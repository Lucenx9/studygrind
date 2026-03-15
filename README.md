# StudyGrind

A local web app where students paste their notes and get AI-generated quiz questions with FSRS-powered spaced repetition. Built on evidence-based learning science: active recall, spaced repetition via the FSRS algorithm (same as Anki), confidence-based rating, and immediate feedback with explanations.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Configure LLM

Go to **Settings** and enter your API key. The recommended option is **OpenRouter** — one key gives you access to all models.

## Tech Stack

- React 19 + Vite + TypeScript
- TailwindCSS 4 + shadcn/ui
- ts-fsrs for spaced repetition scheduling
- localStorage for persistence (no backend)

## License

MIT
