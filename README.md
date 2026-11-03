# AI Evaluator

Answer-key based exam evaluation for faculty and students, powered by Google Gemini.

## Features
- **Two-call pipeline**: Call 1 extracts a JSON blueprint (sections, "any N" rules, OR choices, marking criteria); Call 2 grades each script against it.
- **Marks accuracy in code**: criteria must sum to each question's marks, and the computed total must equal the paper's printed maximum marks before evaluation is allowed.
- **Caching**: blueprint cache (paper + key hash), evaluation cache (blueprint + script hash), OCR cache (file hash).
- **RAG routing**: unlabelled answers are matched to questions with a TF-IDF vector index over answer-key chunks.
- **Scanned PDFs and photos**: pages without a text layer are rendered to images and transcribed by Gemini.
- **Faculty review**: per-criterion mark edits, evidence flags, approve and publish. Students see results only after publishing.
- **Student queries**: per-question queries with faculty replies.

## Where the API key lives
The key is **never typed into the page**.

| Environment | How Gemini is reached |
|---|---|
| Netlify | `netlify/functions/gemini.mjs` reads `GEMINI_API_KEY` from the server environment |
| Google AI Studio (Build) | The platform supplies `process.env.GEMINI_API_KEY` / `process.env.API_KEY` to the app |

## Deploy to Netlify
1. Push this repo to GitHub.
2. In Netlify: **Add new site > Import an existing project**, pick the repo. No build command needed.
3. **Site configuration > Environment variables**: add `GEMINI_API_KEY` (optionally the model overrides and `ALLOWED_ORIGIN` from `.env.example`).
4. Redeploy. Open **Faculty > Gemini settings > Test connection**.

## Run locally
```bash
npm i -g netlify-cli
cp .env.example .env   # add your key
netlify dev            # http://localhost:8888
```

## Run in Google AI Studio
Import or upload this project in AI Studio's Build mode. `index.html` detects the platform-provided key and calls Gemini directly, so no key prompt appears.

## Prototype limits
- Login is a Faculty/Student toggle. Add real authentication before using with students.
- Data is stored in the browser's local storage. A shared database (e.g. Postgres or Firestore) is the next step for multi-user use.
- `/api/gemini` is open to anyone who can reach the site; set `ALLOWED_ORIGIN` and add auth before going live.
