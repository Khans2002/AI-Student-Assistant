const path = require('path');

module.exports = {
  port: Number(process.env.PORT || 3000),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'mistral',
  docsDir: path.join(__dirname, 'documents'),
  topKDocuments: Number(process.env.TOP_K_DOCUMENTS || 2),
  maxExcerptLength: Number(process.env.MAX_EXCERPT_LENGTH || 600),
  maxQuestionLength: Number(process.env.MAX_QUESTION_LENGTH || 500)
};
