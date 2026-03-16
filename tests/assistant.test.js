const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPrompt,
  getModelAliases,
  getOllamaStatus
} = require('../services/assistant');

test('buildPrompt includes both context and question', () => {
  const prompt = buildPrompt('What is the fee?', '\n\n--- From fees.txt ---\nLate fee is $50.');

  assert.match(prompt, /What is the fee\?/);
  assert.match(prompt, /fees\.txt/);
});

test('getOllamaStatus reports model availability from Ollama list', async () => {
  const mockClient = {
    async list() {
      return {
        models: [{ name: 'mistral:latest' }]
      };
    }
  };

  const status = await getOllamaStatus(mockClient);

  assert.equal(status.ollamaConnected, true);
  assert.equal(status.modelAvailable, true);
});

test('getModelAliases includes base and latest tags', () => {
  const aliases = getModelAliases('mistral');

  assert.equal(aliases.has('mistral'), true);
  assert.equal(aliases.has('mistral:latest'), true);
});
