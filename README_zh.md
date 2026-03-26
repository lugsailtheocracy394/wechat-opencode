# wechat-opencode

[English](README.md) | **中文**

一个将个人微信桥接到本地 [OpenCode](https://github.com/sst/opencode) 的服务。你可以直接在手机微信里和 OpenCode 对话。

## 功能

- 在微信中与本地 OpenCode 对话
- 在微信中用 `y` / `n` 审批工具权限
- 支持会话、模型、工作目录、权限模式等斜杠命令
- 跨消息保留会话
- 支持 macOS / Linux 守护进程运行

## 前置条件

- Node.js >= 18
- macOS 或 Linux
- 个人微信账号
- 本机已安装 OpenCode，且终端里可正常使用
- OpenCode 需要的 provider、key、base_url 等已在本机配置完成

## 安装

```bash
git clone https://github.com/CG-man/wechat-opencode.git ~/wechat-opencode
cd ~/wechat-opencode
npm install
```

## 快速开始

### 1. 绑定微信

```bash
cd ~/wechat-opencode
npm run setup
```

### 2. 启动守护进程

```bash
npm run daemon -- start
```

### 3. 在微信里聊天

直接发消息即可与 OpenCode 对话。

## 微信命令

| 命令 | 说明 |
|------|------|
| `/help` | 显示帮助 |
| `/clear` | 清除当前会话 |
| `/reset` | 重置会话设置 |
| `/status` | 查看当前会话状态 |
| `/cwd <路径>` | 查看或切换工作目录 |
| `/provider` | 查看当前 Provider |
| `/model <名称>` | 切换模型 |
| `/models [参数]` | 通过 `opencode models` 动态查看模型 |
| `/permission <模式>` | 切换权限模式 |
| `/history [数量]` | 查看最近对话 |
| `/undo [数量]` | 撤销最近对话 |
| `/compact` | 开启新的 SDK 会话但保留历史 |
| `/version` | 查看版本 |

## 权限模式

| 模式 | 说明 |
|------|------|
| `default` | 每次工具调用都手动审批 |
| `acceptEdits` | 自动批准文件编辑，其它工具仍需审批 |
| `plan` | 只读模式 |
| `auto` | 自动批准所有工具 |

## 工作原理

```text
微信 ←→ ilink bot API ←→ Node.js 守护进程 ←→ OpenCode SDK / 本地 OpenCode 服务
```

## 数据目录

运行时数据保存在 `~/.config/opencode/wechat/`：

```text
~/.config/opencode/wechat/
├── accounts/
├── config.env
├── sessions/
├── get_updates_buf
└── logs/
```

## 开发

```bash
npm run dev
npm run build
```

## 致谢

本项目基于并参考了 [Wechat-ggGitHub/wechat-claude-code](https://github.com/Wechat-ggGitHub/wechat-claude-code) 进行改造，感谢原作者提供的微信桥接基础实现。

## License

[MIT](LICENSE)
