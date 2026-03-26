export type PermissionMode = 'default' | 'acceptEdits' | 'plan' | 'auto';

export interface QueryOptions {
  prompt: string;
  cwd: string;
  resume?: string;
  model?: string;
  permissionMode?: PermissionMode;
  images?: Array<{
    type: 'image';
    source: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
  onPermissionRequest?: (toolName: string, toolInput: string) => Promise<boolean>;
}

export interface QueryResult {
  text: string;
  sessionId: string;
  error?: string;
}

export type QueryProviderName = 'opencode';

export interface QueryProvider {
  readonly name: QueryProviderName;
  query(options: QueryOptions): Promise<QueryResult>;
}
