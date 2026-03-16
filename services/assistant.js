const config = require('../config');

function normalizeModelName(modelName) {
  return String(modelName || '').trim().toLowerCase();
}

function getModelAliases(modelName) {
  const normalized = normalizeModelName(modelName);
  const baseName = normalized.split(':')[0];

  return new Set([
    normalized,
    baseName,
    `${baseName}:latest`
  ]);
}

function buildPrompt(question, contextText) {
  return `You are a helpful AI Student Assistant. Use the provided context to answer the student's question accurately. If the context is incomplete, clearly say what is known from the documents first, then give concise general guidance.

Context:${contextText}

Question: ${question}

Answer:`;
}

async function generateAnswer(ollamaClient, question, contextText) {
  const response = await ollamaClient.generate({
    model: config.ollamaModel,
    prompt: buildPrompt(question, contextText),
    stream: false
  });

  return response.response;
}

async function getOllamaStatus(ollamaClient) {
  const response = await ollamaClient.list();
  const models = response.models || [];
  const acceptedNames = getModelAliases(config.ollamaModel);

  return {
    ollamaConnected: true,
    configuredModel: config.ollamaModel,
    modelAvailable: models.some((model) => {
      const modelNames = [
        normalizeModelName(model.model),
        normalizeModelName(model.name)
      ];

      return modelNames.some((name) => acceptedNames.has(name));
    })
  };
}

module.exports = {
  buildPrompt,
  generateAnswer,
  getModelAliases,
  getOllamaStatus,
  normalizeModelName
};
