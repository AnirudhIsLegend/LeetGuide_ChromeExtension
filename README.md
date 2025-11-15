# **📘 LeetGuide – Your AI Mentor for LeetCode**

LeetGuide is a Chrome extension that helps you deeply understand LeetCode problems, debug your code, and learn step-by-step — without giving full solutions unless you ask for them.

It integrates directly into the LeetCode website, extracts the problem, reads your code from the Monaco editor, and provides AI-powered guidance through the Gemini API.

🚀 Features

📄 Explains LeetCode problems in simple, intuitive terms

🧭 Guides you step-by-step when you’re stuck

🔍 Analyzes your code, finds mistakes, and suggests next steps

🙅 Does NOT reveal full solutions unless explicitly asked

🤖 Uses Gemini API for intelligent responses

📦 Clean and modern UI inside LeetCode

🧩 Easy to toggle using an “Ask AI” floating button

🛠️ Tech Stack

Chrome Extension (Manifest v3)

JavaScript

Gemini API (via generativelanguage.googleapis.com)

DOM extraction (problem + examples)

Monaco editor integration (inject.js)

📂 Project Structure
leetguide-extension/
│
├── manifest.json
├── background.js
├── popup/
│   ├── popup.html
│   └── popup.js
├── content/
│   ├── content.js
│   ├── inject.js
│   └── style.css
├── icons/
│   └── icon128.png
├── README.md
└── LICENSE

🔧 Installation (Development Mode)

Clone the repository:

git clone https://github.com/<your-username>/<your-repo>.git


Open Chrome → go to
chrome://extensions

Enable Developer mode

Click Load unpacked

Select this project folder
(leetguide-extension)

Open LeetCode — you’ll see the floating Ask AI button.

🔑 Setup: Add Gemini API Key

Click the extension icon in Chrome

Open the popup

Paste your Gemini API key

Save

LeetGuide won’t work without a valid key.

💬 How It Works

When you type a question:

It extracts:

Problem title

Description

Examples

Your current code

It builds a structured prompt:

First explains the problem

Guides step-by-step

Points out mistakes in your code

Provides hints (not full answers)

Gives full solution only if you ask

Sends it to Gemini and displays the formatted response.

🧠 AI Behavior Rules

LeetGuide is designed as a tutor, not a cheat tool:

❌ No direct full solutions unless requested

💡 Always explain first

🔧 Help fix user code

⚠️ Act as a mentor, not a solver

📈 Planned Improvements

Better formatting of AI responses

Dark mode styling

Save conversations

Multi-language support (C++, Python, Java)

Auto-detect user intent

🤝 Contributing

Pull requests are welcome!
Please open an issue before creating major changes.

📜 License

MIT License.
You’re free to modify, distribute, or use the code.

⭐ Support

If you like the project, consider starring the repo!
It helps others discover it.
