require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Ollama } = require('ollama');
const config = require('./config');
const { generateAnswer, getOllamaStatus } = require('./services/assistant');
const { loadDocuments, retrieveRelevantDocuments } = require('./services/retrieval');

function createApp(dependencies = {}) {
  const app = express();
  const ollamaClient = dependencies.ollamaClient || new Ollama({ host: config.ollamaBaseUrl });

  app.use(cors());
  app.use(express.json());

  app.get('/health', async (req, res) => {
    const health = {
      status: 'OK',
      message: 'AI Student Assistant is running.',
      configuredModel: config.ollamaModel,
      ollamaConnected: false,
      modelAvailable: false,
      documentsAvailable: 0
    };

    try {
      const documents = await loadDocuments();
      health.documentsAvailable = documents.length;
    } catch (error) {
      health.status = 'DEGRADED';
      health.message = 'Documents directory is unavailable.';
    }

    try {
      const ollamaStatus = await getOllamaStatus(ollamaClient);
      health.ollamaConnected = ollamaStatus.ollamaConnected;
      health.modelAvailable = ollamaStatus.modelAvailable;

      if (!health.modelAvailable) {
        health.status = 'DEGRADED';
        health.message = `Ollama is reachable, but model "${config.ollamaModel}" is not installed.`;
      }
    } catch (error) {
      health.status = 'DEGRADED';
      health.message = 'Ollama is not reachable.';
    }

    res.status(health.status === 'OK' ? 200 : 503).json(health);
  });

  app.get('/documents', async (req, res) => {
    try {
      const documents = await loadDocuments();
      res.json({
        count: documents.length,
        documents: documents.map((document) => ({
          file: document.file,
          preview: document.content.slice(0, config.maxExcerptLength).trim()
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load documents.' });
    }
  });

  app.post('/ask', async (req, res) => {
    try {
      const { question } = req.body;

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Question is required.' });
      }

      const normalizedQuestion = question.trim();

      if (normalizedQuestion.length > config.maxQuestionLength) {
        return res.status(400).json({
          error: `Question must be ${config.maxQuestionLength} characters or fewer.`
        });
      }

      const retrieval = await retrieveRelevantDocuments(normalizedQuestion);
      const answer = await generateAnswer(ollamaClient, normalizedQuestion, retrieval.contextText);

      return res.json({
        question: normalizedQuestion,
        answer,
        model: config.ollamaModel,
        contextFound: retrieval.matches.length > 0,
        sources: retrieval.matches.map((document) => ({
          file: document.file,
          score: document.score,
          excerpt: document.excerpt
        }))
      });
    } catch (error) {
      return res.status(500).json({
        error: `Failed to generate response. Ensure Ollama is running and model "${config.ollamaModel}" is installed.`
      });
    }
  });

  return app;
}

module.exports = { createApp };
