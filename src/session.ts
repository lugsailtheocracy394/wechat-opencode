import { loadJson, saveJson } from './store.js';
import { mkdirSync } from 'node:fs';
import { DATA_DIR } from './constants.js';
import { join } from 'node:path';
import { logger } from './logger.js';
import type { ProviderType } from './config.js';

const SESSIONS_DIR = join(DATA_DIR, 'sessions');

function validateAccountId(accountId: string): void {
  if (!/^[a-zA-Z0-9_.@=-]+$/.test(accountId)) {
    throw new Error(`Invalid accountId: "${accountId}"`);
  }
}

export type SessionState = 'idle' | 'processing' | 'waiting_permission';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ProviderSessionState {
  sdkSessionId?: string;
  previousSdkSessionId?: string;
}

export interface Session {
  sdkSessionId?: string;
  previousSdkSessionId?: string;
  providers?: Partial<Record<ProviderType, ProviderSessionState>>;
  provider?: ProviderType;
  workingDirectory: string;
  model?: string;
  permissionMode?: 'default' | 'acceptEdits' | 'plan' | 'auto';
  state: SessionState;
  chatHistory: ChatMessage[];
  maxHistoryLength?: number;
}

export interface PendingPermission {
  toolName: string;
  toolInput: string;
  resolve: (allowed: boolean) => void;
  timer: NodeJS.Timeout;
}

const DEFAULT_MAX_HISTORY = 100;

export function migrateProviderState(session: Session): void {
  if (!session.providers) {
    session.providers = {};
  }
  if (!session.providers.opencode && (session.sdkSessionId || session.previousSdkSessionId)) {
    session.providers.opencode = {
      sdkSessionId: session.sdkSessionId,
      previousSdkSessionId: session.previousSdkSessionId,
    };
    logger.info('Migrated legacy sdkSessionId to providers.opencode');
  }
}

export function getProviderState(
  session: Session,
  provider?: ProviderType,
): ProviderSessionState {
  migrateProviderState(session);
  const key = provider ?? session.provider ?? 'opencode';
  return session.providers?.[key] ?? {};
}

export function setProviderState(
  session: Session,
  provider: ProviderType,
  state: Partial<ProviderSessionState>,
): void {
  if (!session.providers) {
    session.providers = {};
  }
  session.providers[provider] = {
    ...session.providers[provider],
    ...state,
  };
  session.sdkSessionId = session.providers.opencode?.sdkSessionId;
  session.previousSdkSessionId = session.providers.opencode?.previousSdkSessionId;
}

export function createSessionStore() {
  function getSessionPath(accountId: string): string {
    validateAccountId(accountId);
    return join(SESSIONS_DIR, `${accountId}.json`);
  }

  function load(accountId: string): Session {
    validateAccountId(accountId);
    const session = loadJson<Session>(getSessionPath(accountId), {
      workingDirectory: process.cwd(),
      state: 'idle',
      chatHistory: [],
      maxHistoryLength: DEFAULT_MAX_HISTORY,
    });

    if (!session.chatHistory) {
      session.chatHistory = [];
    }
    if (!session.maxHistoryLength) {
      session.maxHistoryLength = DEFAULT_MAX_HISTORY;
    }

    if (session.state === 'processing' || session.state === 'waiting_permission') {
      logger.warn('Resetting stale session state on load', {
        accountId,
        previousState: session.state,
      });
      session.state = 'idle';
    }

    migrateProviderState(session);
    return session;
  }

  function save(accountId: string, session: Session): void {
    mkdirSync(SESSIONS_DIR, { recursive: true });

    const maxLen = session.maxHistoryLength || DEFAULT_MAX_HISTORY;
    if (session.chatHistory.length > maxLen) {
      session.chatHistory = session.chatHistory.slice(-maxLen);
    }

    saveJson(getSessionPath(accountId), session);
  }

  function clear(accountId: string, currentSession?: Session): Session {
    const session: Session = {
      workingDirectory: currentSession?.workingDirectory ?? process.cwd(),
      provider: currentSession?.provider,
      model: currentSession?.model,
      permissionMode: currentSession?.permissionMode,
      state: 'idle',
      chatHistory: [],
      maxHistoryLength: currentSession?.maxHistoryLength || DEFAULT_MAX_HISTORY,
      providers: {},
    };
    save(accountId, session);
    return session;
  }

  function addChatMessage(session: Session, role: 'user' | 'assistant', content: string): void {
    if (!session.chatHistory) {
      session.chatHistory = [];
    }
    session.chatHistory.push({
      role,
      content,
      timestamp: Date.now(),
    });

    const maxLen = session.maxHistoryLength || DEFAULT_MAX_HISTORY;
    if (session.chatHistory.length > maxLen) {
      session.chatHistory = session.chatHistory.slice(-maxLen);
    }
  }

  function getChatHistoryText(session: Session, limit?: number): string {
    const history = session.chatHistory || [];
    const messages = limit ? history.slice(-limit) : history;

    if (messages.length === 0) {
      return '暂无对话记录';
    }

    const providerLabel = 'OpenCode';
    const lines: string[] = [];
    for (const msg of messages) {
      const time = new Date(msg.timestamp).toLocaleString('zh-CN');
      const role = msg.role === 'user' ? '用户' : providerLabel;
      lines.push(`[${time}] ${role}:`);
      lines.push(msg.content);
      lines.push('');
    }

    return lines.join('\n');
  }

  return { load, save, clear, addChatMessage, getChatHistoryText };
}
