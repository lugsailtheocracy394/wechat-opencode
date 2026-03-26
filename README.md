# wechat-opencode

**English** | [中文](README_zh.md)

A WeChat bridge for your local [OpenCode](https://github.com/sst/opencode). Chat with OpenCode from your phone through WeChat.

## Features

- Chat with local OpenCode from WeChat
- Permission approval in WeChat with `y` / `n`
- Slash commands for session, model, cwd, and permission management
- Session persistence across messages
- macOS and Linux daemon support

## Prerequisites

- Node.js >= 18
- macOS or Linux
- Personal WeChat account
- OpenCode installed and working in your shell
- Your OpenCode provider credentials already configured locally

## Installation

```bash
git clone https://github.com/CG-man/wechat-opencode.git ~/wechat-opencode
cd ~/wechat-opencode
npm install
```

## Quick Start

### 1. Bind WeChat

```bash
cd ~/wechat-opencode
npm run setup
```

### 2. Start the daemon

```bash
npm run daemon -- start
```

### 3. Chat in WeChat

Send any message in WeChat to talk to OpenCode.

## WeChat Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/clear` | Clear current session |
| `/reset` | Reset session settings |
| `/status` | Show current session state |
| `/cwd <path>` | Show or switch working directory |
| `/provider` | Show current provider |
| `/model <name>` | Switch model |
| `/models [args]` | Show models dynamically from `opencode models` |
| `/permission <mode>` | Switch permission mode |
| `/history [n]` | Show recent chat history |
| `/undo [n]` | Undo recent messages |
| `/compact` | Start a fresh SDK session but keep history |
| `/version` | Show version |

## Permission Modes

| Mode | Description |
|------|-------------|
| `default` | Manual approval for each tool use |
| `acceptEdits` | Auto-approve file edits, ask for others |
| `plan` | Read-only mode |
| `auto` | Auto-approve all tools |

## How It Works

```text
WeChat ←→ ilink bot API ←→ Node.js daemon ←→ OpenCode SDK / local OpenCode server
```

## Data Directory

All runtime data is stored in `~/.config/opencode/wechat/`:

```text
~/.config/opencode/wechat/
├── accounts/
├── config.env
├── sessions/
├── get_updates_buf
└── logs/
```

## Development

```bash
npm run dev
npm run build
```

## Acknowledgements

This project was adapted from and inspired by [Wechat-ggGitHub/wechat-claude-code](https://github.com/Wechat-ggGitHub/wechat-claude-code). Thanks to the original author for the WeChat bridge foundation.

## License

[MIT](LICENSE)
