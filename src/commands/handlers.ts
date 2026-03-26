import type { CommandContext, CommandResult } from './router.js';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidProvider, type ProviderType } from '../config.js';
import { getProviderState, setProviderState } from '../session.js';

const HELP_TEXT = `可用命令：

会话管理：
  /help             显示帮助
  /clear            清除当前会话
  /reset            完全重置（包括工作目录等设置）
  /status           查看当前会话状态
  /compact          压缩上下文（开始新 SDK 会话，保留历史）
  /history [数量]   查看对话记录（默认最近20条）
  /undo [数量]      撤销最近对话（默认1条）

配置：
  /cwd [路径]       查看或切换工作目录
  /provider         查看当前 Provider
  /model [名称]     查看或切换模型
  /models [参数]    动态查看可用模型列表
  /permission [模式] 查看或切换权限模式

其他：
  /version          查看版本信息

直接输入文字即可与 OpenCode 对话`;

const PROVIDER_DESCRIPTIONS: Record<ProviderType, string> = {
  opencode: 'OpenCode',
};

const DEFAULT_MODEL_EXAMPLE = 'openai/gpt-5.4';

const PERMISSION_MODES = ['default', 'acceptEdits', 'plan', 'auto'] as const;
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  default: '每次工具使用需手动审批',
  acceptEdits: '自动批准文件编辑，其他需审批',
  plan: '只读模式，不允许任何工具',
  auto: '自动批准所有工具（危险模式）',
};

const MAX_HISTORY_LIMIT = 100;

export function handleHelp(): CommandResult {
  return { reply: HELP_TEXT, handled: true };
}

export function handleClear(ctx: CommandContext): CommandResult {
  ctx.rejectPendingPermission?.();
  const newSession = ctx.clearSession();
  Object.assign(ctx.session, newSession);
  return { reply: '✅ 会话已清除，下次消息将开始新会话。', handled: true };
}

export function handleReset(ctx: CommandContext): CommandResult {
  ctx.rejectPendingPermission?.();
  const newSession = ctx.clearSession();
  newSession.workingDirectory = process.cwd();
  newSession.model = undefined;
  newSession.permissionMode = undefined;
  newSession.provider = 'opencode';
  newSession.providers = {};
  Object.assign(ctx.session, newSession);
  return { reply: '✅ 会话已完全重置，所有设置恢复默认。', handled: true };
}

export function handleCwd(ctx: CommandContext, args: string): CommandResult {
  if (!args) {
    return { reply: `当前工作目录: ${ctx.session.workingDirectory}
用法: /cwd <路径>`, handled: true };
  }
  ctx.updateSession({ workingDirectory: args });
  return { reply: `✅ 工作目录已切换为: ${args}`, handled: true };
}

export function handleProvider(ctx: CommandContext, args: string): CommandResult {
  const current = 'opencode';
  if (args && !isValidProvider(args.trim().toLowerCase())) {
    return { reply: `当前仅支持 ${current}`, handled: true };
  }
  ctx.updateSession({ provider: current });
  return {
    reply: `🔌 当前 Provider: ${current} (${PROVIDER_DESCRIPTIONS[current]})`,
    handled: true,
  };
}

export function handleModel(ctx: CommandContext, args: string): CommandResult {
  const provider = ctx.session.provider ?? 'opencode';
  if (!args) {
    return {
      reply: `当前 Provider: ${provider}
用法: /model <模型名称>
例: /model ${DEFAULT_MODEL_EXAMPLE}`,
      handled: true,
    };
  }
  ctx.updateSession({ model: args });
  return { reply: `✅ 模型已切换为: ${args} (Provider: ${provider})`, handled: true };
}

export function handleModels(ctx: CommandContext, args: string): CommandResult {
  const currentModel = ctx.session.model ?? '默认';
  const extraArgs = args.trim() ? args.trim().split(/\s+/) : [];

  try {
    const output = execFileSync('opencode', ['models', ...extraArgs], {
      cwd: ctx.session.workingDirectory || process.cwd(),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

    const lines = [
      '🤖 OpenCode 可用模型',
      `当前模型: ${currentModel}`,
      '',
      output || '未返回可用模型。',
      '',
      '用法:',
      '  /models',
      '  /models openai',
      '  /models refresh',
    ];

    return { reply: lines.join('\n'), handled: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      reply: `⚠️ 获取 OpenCode 模型列表失败
${message}

请确认：
- opencode 可在当前环境中直接执行
- OpenCode provider 已正确配置`,
      handled: true,
    };
  }
}

export function handlePermission(ctx: CommandContext, args: string): CommandResult {
  if (!args) {
    const current = ctx.session.permissionMode ?? 'default';
    const lines = [
      `🔒 当前权限模式: ${current}`,
      '',
      '可用模式:',
      ...PERMISSION_MODES.map((mode) => `  ${mode} — ${PERMISSION_DESCRIPTIONS[mode]}`),
      '',
      '用法: /permission <模式>',
    ];
    return { reply: lines.join('\n'), handled: true };
  }

  const mode = args.trim();
  if (!PERMISSION_MODES.includes(mode as (typeof PERMISSION_MODES)[number])) {
    return { reply: `未知模式: ${mode}
可用: ${PERMISSION_MODES.join(', ')}`, handled: true };
  }

  const nextMode = mode as (typeof PERMISSION_MODES)[number];
  ctx.updateSession({ permissionMode: nextMode });
  const warning = nextMode === 'auto' ? '\n\n⚠️ 已开启危险模式：所有工具调用将自动批准，无需手动确认。' : '';
  return { reply: `✅ 权限模式已切换为: ${nextMode}
${PERMISSION_DESCRIPTIONS[nextMode]}${warning}`, handled: true };
}

export function handleStatus(ctx: CommandContext): CommandResult {
  const provider = ctx.session.provider ?? 'opencode';
  const providerState = getProviderState(ctx.session, provider);
  const lines = [
    '📊 会话状态',
    '',
    `Provider: ${provider}`,
    `工作目录: ${ctx.session.workingDirectory}`,
    `模型: ${ctx.session.model ?? '默认'}`,
    `权限模式: ${ctx.session.permissionMode ?? 'default'}`,
    `会话ID: ${providerState.sdkSessionId ?? '无'}`,
    `状态: ${ctx.session.state}`,
  ];
  return { reply: lines.join('\n'), handled: true };
}

export function handleHistory(ctx: CommandContext, args: string): CommandResult {
  const limit = args ? parseInt(args, 10) : 20;
  if (isNaN(limit) || limit <= 0) {
    return { reply: `用法: /history [数量]
例: /history 50（显示最近50条对话）`, handled: true };
  }
  const effectiveLimit = Math.min(limit, MAX_HISTORY_LIMIT);
  const historyText = ctx.getChatHistoryText?.(effectiveLimit) || '暂无对话记录';
  return { reply: `📝 对话记录（最近${effectiveLimit}条）:

${historyText}`, handled: true };
}

export function handleCompact(ctx: CommandContext): CommandResult {
  const provider = ctx.session.provider ?? 'opencode';
  const providerState = getProviderState(ctx.session, provider);
  if (!providerState.sdkSessionId) {
    return { reply: 'ℹ️ 当前没有活动的 SDK 会话，无需压缩。', handled: true };
  }
  setProviderState(ctx.session, provider, {
    previousSdkSessionId: providerState.sdkSessionId,
    sdkSessionId: undefined,
  });
  ctx.updateSession({ providers: ctx.session.providers });
  return {
    reply: `✅ 上下文已压缩

下次消息将开始新的 SDK 会话（token 清零）
聊天历史已保留，可用 /history 查看`,
    handled: true,
  };
}

export function handleUndo(ctx: CommandContext, args: string): CommandResult {
  const count = args ? parseInt(args, 10) : 1;
  if (isNaN(count) || count <= 0) {
    return { reply: `用法: /undo [数量]
例: /undo 2（撤销最近2条对话）`, handled: true };
  }
  const history = ctx.session.chatHistory || [];
  if (history.length === 0) {
    return { reply: '⚠️ 没有对话记录可撤销', handled: true };
  }
  const actualCount = Math.min(count, history.length);
  ctx.session.chatHistory = history.slice(0, -actualCount);
  ctx.updateSession({ chatHistory: ctx.session.chatHistory });
  return { reply: `✅ 已撤销最近 ${actualCount} 条对话`, handled: true };
}

export function handleVersion(): CommandResult {
  try {
    const dir = fileURLToPath(new URL('.', import.meta.url));
    const pkg = JSON.parse(readFileSync(join(dir, '..', '..', 'package.json'), 'utf-8'));
    const version = pkg.version || 'unknown';
    return { reply: `wechat-opencode v${version}`, handled: true };
  } catch {
    return { reply: 'wechat-opencode (version unknown)', handled: true };
  }
}

export function handleUnknown(cmd: string, args: string): CommandResult {
  return {
    handled: true,
    reply: `未知命令: /${cmd}${args ? ` ${args}` : ''}
输入 /help 查看可用命令`,
  };
}
