# AI Student Assistant

Simple AI assistant for students using Node.js, Express, Ollama, and basic retrieval-augmented generation (RAG).

## Features
- Ask questions about exams, fees, and policies
- Retrieves relevant documents before calling the LLM
- Uses Ollama with a configurable model
- Health endpoint reports document availability and Ollama/model connectivity

## Quick Setup (macOS/Linux)
1. Install Ollama: `brew install ollama`
2. Start Ollama: `ollama serve`
3. Pull the model you want to use: `ollama pull mistral`
4. In the project directory:
   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```
5. Check connectivity:
   ```bash
   curl http://localhost:3000/health
   ```
6. Ask a question:
   ```bash
   curl -X POST http://localhost:3000/ask \
     -H "Content-Type: application/json" \
     -d '{"question":"What is the late fee?"}'
   ```

## Environment Variables
- `OLLAMA_BASE_URL` default: `http://localhost:11434`
- `OLLAMA_MODEL` default: `mistral`
- `PORT` default: `3000`

## Architecture
```text
Client Request -> Express API (/ask) -> Retrieve matching docs from documents/ -> Ollama -> JSON response
```

## Endpoints
- `POST /ask` with body `{ "question": "..." }`
- `GET /health` returns service status, document count, Ollama connectivity, and model availability
