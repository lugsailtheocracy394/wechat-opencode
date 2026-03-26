import type { Session } from '../session.js';
import { logger } from '../logger.js';
import { handleHelp, handleClear, handleCwd, handleModel, handleModels, handlePermission, handleStatus, handleHistory, handleReset, handleCompact, handleUndo, handleVersion, handleProvider, handleUnknown } from './handlers.js';

export interface CommandContext {
  accountId: string;
  session: Session;
  updateSession: (partial: Partial<Session>) => void;
  clearSession: () => Session;
  getChatHistoryText?: (limit?: number) => string;
  rejectPendingPermission?: () => boolean;
  text: string;
}

export interface CommandResult {
  reply?: string;
  handled: boolean;
}

export function routeCommand(ctx: CommandContext): CommandResult {
  const text = ctx.text.trim();

  if (!text.startsWith('/')) {
    return { handled: false };
  }

  const spaceIdx = text.indexOf(' ');
  const cmd = (spaceIdx === -1 ? text.slice(1) : text.slice(1, spaceIdx)).toLowerCase();
  const args = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1).trim();

  logger.info(`Slash command: /${cmd} ${args}`.trimEnd());

  switch (cmd) {
    case 'help':
      return handleHelp();
    case 'clear':
      return handleClear(ctx);
    case 'reset':
      return handleReset(ctx);
    case 'cwd':
      return handleCwd(ctx, args);
    case 'provider':
      return handleProvider(ctx, args);
    case 'model':
      return handleModel(ctx, args);
    case 'models':
      return handleModels(ctx, args);
    case 'permission':
      return handlePermission(ctx, args);
    case 'status':
      return handleStatus(ctx);
    case 'history':
      return handleHistory(ctx, args);
    case 'undo':
      return handleUndo(ctx, args);
    case 'compact':
      return handleCompact(ctx);
    case 'version':
    case 'v':
      return handleVersion();
    default:
      return handleUnknown(cmd, args);
  }
}
