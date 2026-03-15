require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Ollama } = require('ollama');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Ollama client
const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' });

app.use(cors());
app.use(express.json());

// Simple RAG: search documents directory for relevant context
async function retrieveContext(query) {
  const docsDir = path.join(__dirname, 'documents');
  try {
    const files = await fs.readdir(docsDir);
    let context = '';
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const filePath = path.join(docsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          context += `\\n\\n--- From ${file} ---\\n${content.substring(0, 1000)}`;
        }
      }
    }
    return context || 'No specific information found. Ask about exams, fees, or policies.';
  } catch (err) {
    return 'Documents directory not found or empty.';
  }
}

// API endpoint for student questions
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Retrieve relevant context (RAG)
    const context = await retrieveContext(question);

    // Prepare prompt for Mistral
    const prompt = `You are a helpful AI Student Assistant. Use the following context to answer the student's question accurately. If the context doesn't cover it, provide general helpful advice.\\n\\nContext: ${context}\\n\\nQuestion: ${question}\\n\\nAnswer:`;

    // Call Ollama Mistral model
    const response = await ollama.generate({
      model: 'mistral',
      prompt: prompt,
      stream: false
    });

    res.json({ answer: response.response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate response. Ensure Ollama is running with Mistral model.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Student Assistant is running!' });
});

app.listen(PORT, () => {
  console.log(`AI Student Assistant server running on http://localhost:${PORT}`);
  console.log('Test it: POST /ask with { "question": "What are the exam dates?" }');
  console.log('Ensure Ollama is running: ollama serve & ollama pull mistral');
});

