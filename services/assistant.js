const config = require('../config');

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

  return {
    ollamaConnected: true,
    configuredModel: config.ollamaModel,
    modelAvailable: models.some((model) => model.model === config.ollamaModel || model.name === config.ollamaModel)
  };
}

module.exports = {
  buildPrompt,
  generateAnswer,
  getOllamaStatus
};
