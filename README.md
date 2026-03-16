# AI Student Assistant

Simple AI assistant for students using Node.js, Express, Ollama, and basic retrieval-augmented generation (RAG).

## Features
- Ask questions about exams, fees, and policies
- Retrieves relevant documents before calling the LLM
- Uses Ollama with a configurable model
- Health endpoint reports document availability and Ollama/model connectivity
- Documents endpoint helps the frontend inspect available knowledge sources

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
6. Inspect available documents:
   ```bash
   curl http://localhost:3000/documents
   ```
7. Ask a question:
   ```bash
   curl -X POST http://localhost:3000/ask \
     -H "Content-Type: application/json" \
     -d '{"question":"What is the late fee?"}'
   ```

## Environment Variables
- `OLLAMA_BASE_URL` default: `http://localhost:11434`
- `OLLAMA_MODEL` default: `mistral`
- `PORT` default: `3000`
- `TOP_K_DOCUMENTS` default: `2`
- `MAX_EXCERPT_LENGTH` default: `600`
- `MAX_QUESTION_LENGTH` default: `500`

## Architecture
```text
Client Request -> Express API (/ask) -> Retrieve matching docs from documents/ -> Ollama -> JSON response
```

## Endpoints
- `POST /ask` with body `{ "question": "..." }`
- `GET /health` returns service status, document count, Ollama connectivity, and model availability
- `GET /documents` returns the list of loaded text documents and a short preview of each

## Sample `/ask` Response
```json
{
  "question": "What is the late fee?",
  "answer": "The late fee is $50 after the due date.",
  "model": "mistral",
  "contextFound": true,
  "sources": [
    {
      "file": "fees.txt",
      "score": 2,
      "excerpt": "Fee Structure:\n- Tuition: $5000 per semester\n- Registration: $100 one-time..."
    }
  ]
}
```

## Testing
```bash
npm test
```
