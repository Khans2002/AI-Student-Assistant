const config = require('./config');
const { createApp } = require('./app');

const app = createApp();

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`AI Student Assistant server running on http://localhost:${config.port}`);
    console.log('Test it: POST /ask with { "question": "What are the exam dates?" }');
    console.log(`Ensure Ollama is running: ollama serve && ollama pull ${config.ollamaModel}`);
  });
}

module.exports = { app };
