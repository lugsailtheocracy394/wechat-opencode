import {
  createOpencodeClient,
  createOpencodeServer,
  type OpencodeClient,
  type Part,
  type PermissionRequest,
  type PermissionRuleset,
} from '@opencode-ai/sdk/v2';

import { logger } from '../logger.js';
import type { QueryOptions, QueryResult } from '../providers/types.js';

type OpencodeRuntime = {
  baseUrl: string;
  close?: () => void;
};

let runtimePromise: Promise<OpencodeRuntime> | undefined;
const clientCache = new Map<string, OpencodeClient>();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getEventErrorMessage(error: { data?: { message?: string }; name?: string } | undefined): string {
  if (!error) {
    return 'OpenCode 会话出错。';
  }

  if (error.data?.message) {
    return error.data.message;
  }

  if (error.name) {
    return error.name;
  }

  return 'OpenCode 会话出错。';
}

function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === 'AbortError' || error.message === 'Aborted';
}

function isTextPart(part: Part): part is Extract<Part, { type: 'text' }> {
  return part.type === 'text';
}

function extractText(parts: Part[] | undefined): string {
  if (!parts?.length) {
    return '';
  }

  return parts
    .filter(isTextPart)
    .filter((part) => !part.ignored)
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function parseModel(model: string | undefined): { providerID: string; modelID: string } | undefined {
  if (!model) {
    return undefined;
  }

  const separatorIndex = model.indexOf('/');
  if (separatorIndex === -1) {
    logger.warn('OpenCode model should use provider/model format; falling back to server default', { model });
    return undefined;
  }

  const providerID = model.slice(0, separatorIndex).trim();
  const modelID = model.slice(separatorIndex + 1).trim();
  if (!providerID || !modelID) {
    logger.warn('OpenCode model format is invalid; falling back to server default', { model });
    return undefined;
  }

  return { providerID, modelID };
}

function buildPermissionRules(permissionMode: QueryOptions['permissionMode']): PermissionRuleset | undefined {
  switch (permissionMode) {
    case 'plan':
      return [{ permission: '*', pattern: '*', action: 'deny' }];
    case 'acceptEdits':
      return [
        { permission: 'edit', pattern: '*', action: 'allow' },
        { permission: '*', pattern: '*', action: 'ask' },
      ];
    case 'default':
      return [{ permission: '*', pattern: '*', action: 'ask' }];
    default:
      return undefined;
  }
}

function formatPermissionInput(permission: PermissionRequest): string {
  return JSON.stringify(
    {
      permission: permission.permission,
      patterns: permission.patterns,
      metadata: permission.metadata,
      tool: permission.tool,
    },
    null,
    2,
  );
}

async function getRuntime(): Promise<OpencodeRuntime> {
  const envBaseUrl = process.env.OPENCODE_BASE_URL;
  if (envBaseUrl) {
    return { baseUrl: envBaseUrl };
  }

  if (!runtimePromise) {
    runtimePromise = createOpencodeServer({
      hostname: process.env.OPENCODE_HOST ?? '127.0.0.1',
      port: process.env.OPENCODE_PORT ? Number(process.env.OPENCODE_PORT) : 4096,
      timeout: 15_000,
    }).then((server) => ({
      baseUrl: server.url,
      close: () => server.close(),
    }));
  }

  return runtimePromise;
}

async function getClient(cwd: string): Promise<OpencodeClient> {
  const cached = clientCache.get(cwd);
  if (cached) {
    return cached;
  }

  const runtime = await getRuntime();
  const client = createOpencodeClient({
    baseUrl: runtime.baseUrl,
    directory: cwd,
  });

  clientCache.set(cwd, client);
  return client;
}

export async function opencodeQuery(options: QueryOptions): Promise<QueryResult> {
  const {
    prompt,
    cwd,
    resume,
    model,
    permissionMode,
    images,
    onPermissionRequest,
  } = options;

  logger.info('Starting OpenCode query', {
    cwd,
    model,
    permissionMode,
    resume: !!resume,
    hasImages: !!images?.length,
  });

  if (images?.length) {
    return {
      text: '',
      sessionId: resume ?? '',
      error: 'OpenCode provider 暂未在此桥接中支持图片输入。',
    };
  }

  const client = await getClient(cwd);
  let sessionId = resume ?? '';

  if (!sessionId) {
    const createResult = await client.session.create({
      title: 'WeChat Session',
      permission: buildPermissionRules(permissionMode),
    });

    if (createResult.error || !createResult.data) {
      const error = createResult.error ? getErrorMessage(createResult.error) : 'OpenCode 创建会话失败。';
      logger.error('Failed to create OpenCode session', { error });
      return { text: '', sessionId: '', error };
    }

    sessionId = createResult.data.id;
  }

  const eventAbortController = new AbortController();
  let eventError: string | undefined;
  const eventWatcher = (async () => {
    try {
      const events = await client.event.subscribe(undefined, {
        signal: eventAbortController.signal,
      });

      for await (const event of events.stream) {
        switch (event.type) {
          case 'permission.asked': {
            if (event.properties.sessionID !== sessionId) {
              break;
            }

            if (!onPermissionRequest) {
              await client.permission.reply({
                requestID: event.properties.id,
                reply: 'reject',
                message: 'Permission handling is not configured for this bridge.',
              });
              break;
            }

            try {
              const allowed = await onPermissionRequest(
                event.properties.permission,
                formatPermissionInput(event.properties),
              );

              await client.permission.reply({
                requestID: event.properties.id,
                reply: allowed ? 'once' : 'reject',
              });
            } catch (error) {
              const message = getErrorMessage(error);
              logger.error('OpenCode permission handler error', { error: message });
              await client.permission.reply({
                requestID: event.properties.id,
                reply: 'reject',
                message,
              });
            }
            break;
          }
          case 'session.error': {
            if (event.properties.sessionID === sessionId) {
              eventError = getEventErrorMessage(event.properties.error);
            }
            break;
          }
          default:
            break;
        }
      }
    } catch (error) {
      if (!isAbortError(error)) {
        eventError = getErrorMessage(error);
      }
    }
  })();

  let promptResult;

  try {
    promptResult = await client.session.prompt({
      sessionID: sessionId,
      model: parseModel(model),
      parts: [{ type: 'text', text: prompt }],
    });
  } finally {
    eventAbortController.abort();
    await eventWatcher;
  }

  if (promptResult.error) {
    const error = getErrorMessage(promptResult.error);
    logger.error('OpenCode prompt failed', { error, sessionId });
    return {
      text: '',
      sessionId,
      error,
    };
  }

  const promptError = getEventErrorMessage(promptResult.data?.info.error);
  const resultText = extractText(promptResult.data?.parts);

  logger.info('OpenCode query completed', {
    sessionId,
    textLength: resultText.length,
    hasError: !!(eventError || promptResult.data?.info.error),
  });

  return {
    text: resultText,
    sessionId,
    error:
      eventError ??
      (promptResult.data?.info.error ? promptError : undefined) ??
      (!resultText ? 'OpenCode returned an empty response.' : undefined),
  };
}
