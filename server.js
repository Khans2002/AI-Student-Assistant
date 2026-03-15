require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Ollama } = require('ollama');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OLLAMA_MODEL || 'mistral';
const DOCS_DIR = path.join(__dirname, 'documents');
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'about', 'at', 'be', 'can', 'do', 'for', 'from',
  'how', 'i', 'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'the',
  'to', 'what', 'when', 'where', 'which', 'who', 'why', 'with', 'you', 'your'
]);

// Initialize Ollama client
const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' });

app.use(cors());
app.use(express.json());

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word));
}

function scoreDocument(questionTokens, content, filename) {
  const text = `${filename} ${content}`.toLowerCase();
  let score = 0;

  for (const token of questionTokens) {
    if (text.includes(token)) {
      score += 1;
    }
  }

  return score;
}

// Simple RAG: rank documents using keyword overlap and return the top matches.
async function retrieveContext(query) {
  try {
    const files = await fs.readdir(DOCS_DIR);
    const queryTokens = tokenize(query);
    const rankedDocuments = [];

    for (const file of files) {
      if (file.endsWith('.txt')) {
        const filePath = path.join(DOCS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');

        rankedDocuments.push({
          file,
          content,
          score: scoreDocument(queryTokens, content, file)
        });
      }
    }

    rankedDocuments.sort((a, b) => b.score - a.score);

    const topMatches = rankedDocuments
      .filter((doc) => doc.score > 0)
      .slice(0, 2)
      .map((doc) => `\n\n--- From ${doc.file} ---\n${doc.content.substring(0, 1000)}`);

    return topMatches.length > 0
      ? topMatches.join('')
      : 'No specific information found in the provided student documents.';
  } catch (err) {
    return 'Documents directory not found or empty.';
  }
}

async function getHealthStatus() {
  const health = {
    status: 'OK',
    message: 'AI Student Assistant is running.',
    ollamaConnected: false,
    configuredModel: MODEL,
    modelAvailable: false,
    documentsAvailable: 0
  };

  try {
    const files = await fs.readdir(DOCS_DIR);
    health.documentsAvailable = files.filter((file) => file.endsWith('.txt')).length;
  } catch (error) {
    health.status = 'DEGRADED';
    health.message = 'Documents directory is unavailable.';
  }

  try {
    const response = await ollama.list();
    const models = response.models || [];

    health.ollamaConnected = true;
    health.modelAvailable = models.some((model) => model.model === MODEL || model.name === MODEL);

    if (!health.modelAvailable) {
      health.status = 'DEGRADED';
      health.message = `Ollama is reachable, but model "${MODEL}" is not installed.`;
    }
  } catch (error) {
    health.status = 'DEGRADED';
    health.message = 'Ollama is not reachable.';
  }

  return health;
}

// API endpoint for student questions
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Retrieve relevant context (RAG)
    const context = await retrieveContext(question.trim());

    // Prepare prompt for Mistral
    const prompt = `You are a helpful AI Student Assistant. Use the following context to answer the student's question accurately. If the context does not fully cover the answer, say what is known from the documents first, then provide concise general guidance.\n\nContext:${context}\n\nQuestion: ${question.trim()}\n\nAnswer:`;

    // Call Ollama Mistral model
    const response = await ollama.generate({
      model: MODEL,
      prompt: prompt,
      stream: false
    });

    res.json({
      answer: response.response,
      model: MODEL,
      usedContext: context
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: `Failed to generate response. Ensure Ollama is running and model "${MODEL}" is installed.` });
  }
});

// Health check
app.get('/health', async (req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI Student Assistant server running on http://localhost:${PORT}`);
    console.log('Test it: POST /ask with { "question": "What are the exam dates?" }');
    console.log(`Ensure Ollama is running: ollama serve && ollama pull ${MODEL}`);
  });
}

module.exports = { app, retrieveContext, getHealthStatus };
