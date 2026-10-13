# Read the Fine Print

Spot the clauses that cost freelancers money, before you sign.

Paste or drop a client contract and every clause gets a traffic light:

- 🔴 **To change**: don't sign it as it is.
- 🟡 **To negotiate**: common, but worth pushing back on.
- 🟢 **Fine**: nothing to do.

Each flagged clause comes with a plain-English explanation and a ready-to-send message asking for a fairer version, and **Copy email to client** puts them all in one email.

**The AI runs entirely in your browser.** Client contracts are confidential and often under NDA, so Read the Fine Print never sends them anywhere: no server, no account, no API key.

## How it works

| Piece | What it does |
|---|---|
| [Gemma 4 E2B](https://huggingface.co/mlc-ai/gemma-4-E2B-it-q4f16_1-MLC) via [WebLLM](https://github.com/mlc-ai/web-llm) | Runs on your GPU through WebGPU, in a Web Worker. Downloaded once (~3 GB) and cached by the browser. Gemma 3 1B is the fallback for GPUs without `shader-f16`. |
| JSON-schema constrained output | Every answer is valid JSON. The model writes its explanation *before* it picks a colour, which made its verdicts noticeably more accurate. |
| A list of known freelance traps | Net 60/90 payment, unlimited revisions, IP handed over before payment, no kill fee, non-competes, unlimited liability, auto-renewal, vague scope. Gives a small model a checklist instead of relying on its judgement alone. |
| [pdf.js](https://mozilla.github.io/pdf.js/) | Reads the text out of PDF contracts, locally. |

## Run it

Needs a browser with WebGPU (recent Chrome or Edge on a laptop or desktop).

```sh
cd app
npm install
npm run dev
```

The app is published to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`.

**Not legal advice.** For anything high-stakes, ask a lawyer.
