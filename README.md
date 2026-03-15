# AI Student Assistant

Simple AI assistant for students using Node.js, Express, Ollama (Mistral), and basic RAG.

## Features
- Ask questions about exams, fees, policies
- Retrieves relevant docs + LLM response
- API: POST /ask { "question": "..." }

## Quick Setup (macOS/Linux)
1. Ensure Ollama installed: `brew install ollama`
2. Start Ollama: `ollama serve`
3. Pull model: `ollama pull mistral`
4. In project dir:
   ```
   npm install
   cp .env.example .env
   npm run dev
   ```
5. Test: `curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"question":"What are the exam dates?"}'`

## Architecture
```
Frontend Request → Express API (/ask) → RAG (docs/) + Ollama (Mistral) → Response
```

## Endpoints
- `POST /ask` - Ask question
- `GET /health` - Check status
