# hot-ai

[OpenAI](https://platform.openai.com/playground) is still 🔥.

[ChatGPT](https://www.codegpt.co/) is very good but I wanted a tiny garage project to learn/experiment with [go](https://go.dev/) + test [wails](https://wails.io/) with an actual project + learn more about [prompting](https://platform.openai.com/docs/introduction/prompts-and-completions).

Update: `go get -u && go mod tidy`
Development: `wails dev`  
Building: `wails build -clean -webview2 embed`

> **Note:** Building flag `-upx` removed! This means bigger binary size but no [false positive antivirus alerts](https://github.com/upx/upx/issues/437).

![Demo](demo.gif)

Icons: [bearicons Outline Color](https://icons8.com/icons/authors/DFlb6Xyr8saR/bearicons/external-bearicons-outline-color-bearicons) from [Icons8](https://icons8.com)

Prompts: [f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts#prompts)

## GPT-4 vs GPT-3.5 Turbo

> **Note:** GPT-4o is `10x` more expensive than GPT-3.5! Don't forget to check [pricing](https://openai.com/pricing) and [usage](https://platform.openai.com/account/usage) regularly!

GPT-4o: *"most advanced multimodal model that’s faster and cheaper than GPT-4"*  
GPT-4o mini 🔥: *"most cost-efficient small model that’s smarter and cheaper than GPT-3.5 Turbo, and has vision capabilities"*  
GPT-3.5 Turbo: *"fast, inexpensive model for simple tasks"*  

| Model          | Input               | Output             |
| -------------- | ------------------- | ------------------ |
| gpt-4o         | $5.00 / 1M tokens   | $15.00 / 1M tokens |
| gpt-4o-mini    | $0.15 / 1M tokens   |  $0.60 / 1M tokens |
| gpt-3.5-turbo  | $0.50 / 1M tokens   |  $1.50 / 1M tokens |
