import { homedir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_DATA_DIR = join(homedir(), '.config', 'opencode', 'wechat');

export const DATA_DIR = process.env.OPENCODE_WECHAT_DATA_DIR || process.env.WCC_DATA_DIR || DEFAULT_DATA_DIR;
