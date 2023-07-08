# hot-ai

[OpenAI](https://platform.openai.com/playground) is still 🔥.

[ChatGPT](https://www.codegpt.co/) is very good but I wanted a tiny garage project to learn/experiment with [go](https://go.dev/) + test [wails](https://wails.io/) with an actual project + learn more about [prompting](https://platform.openai.com/docs/introduction/prompts-and-completions).

Development: `wails dev`  
Building: `wails build -clean -upx -webview2 embed`

![Screenshot](screenshot.png)

> Icons used during development: [bearicons Outline Color](https://icons8.com/icons/authors/DFlb6Xyr8saR/bearicons/external-bearicons-outline-color-bearicons)

## ideas

- [ ] ~~Save chats in [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) and add search bar~~
- [x] Save modified presets ~~+ create new ones + upload avatar too~~
- [x] Redesign button layout
- [x] [Frameless](https://wails.io/docs/v2.4.0/guides/frameless) appearance
- [ ] Generate icons with [DALL-E](https://labs.openai.com/)
- [x] Check [releases](https://api.github.com/repos/ZalaPanda/hot-ai/releases/latest) to check last version
- [ ] Create tooltip component

Detected: `Trojan:Win32/Sabsik.FL.B!ml` [Link](https://www.microsoft.com/en-us/wdsi/threats/malware-encyclopedia-description?name=Trojan%3AWin32%2FSabsik.FL.B!ml&threatid=2147780203) Status: `Quarantined`

# GPT-4 vs GPT-3.5 Turbo

| Model          | Context | Input               | Output             |
| -------------- | ------- | ------------------- | ------------------ |
| GPT-4          | 8K      | $0.03 / 1K tokens   | $0.06 / 1K tokens  |
| GPT-4          | 32K     | $0.06 / 1K tokens	 | $0.12 / 1K tokens  |
| GPT-3.5 Turbo  | 4K      | $0.0015 / 1K tokens | $0.002 / 1K tokens |
| GPT-3.5 Turbo  | 16K     | $0.003 / 1K tokens  | $0.004 / 1K tokens |

Source: [Pricing](https://openai.com/pricing)
