const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'about', 'at', 'be', 'can', 'do', 'for', 'from',
  'how', 'i', 'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'the',
  'to', 'what', 'when', 'where', 'which', 'who', 'why', 'with', 'you', 'your'
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word));
}

function buildExcerpt(content, maxLength = config.maxExcerptLength) {
  return content.length > maxLength
    ? `${content.slice(0, maxLength).trim()}...`
    : content.trim();
}

function scoreDocument(questionTokens, content, filename) {
  const combinedText = `${filename} ${content}`.toLowerCase();
  let score = 0;

  for (const token of questionTokens) {
    if (combinedText.includes(token)) {
      score += 1;
    }
  }

  return score;
}

async function loadDocuments() {
  const files = await fs.readdir(config.docsDir);
  const textFiles = files.filter((file) => file.endsWith('.txt'));

  const documents = await Promise.all(
    textFiles.map(async (file) => {
      const filePath = path.join(config.docsDir, file);
      const content = await fs.readFile(filePath, 'utf8');

      return {
        file,
        content
      };
    })
  );

  return documents.sort((a, b) => a.file.localeCompare(b.file));
}

async function retrieveRelevantDocuments(question) {
  const documents = await loadDocuments();
  const questionTokens = tokenize(question);

  const rankedDocuments = documents
    .map((document) => ({
      file: document.file,
      content: document.content,
      excerpt: buildExcerpt(document.content),
      score: scoreDocument(questionTokens, document.content, document.file)
    }))
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  const matches = rankedDocuments
    .filter((document) => document.score > 0)
    .slice(0, config.topKDocuments);

  return {
    matches,
    contextText: matches.length > 0
      ? matches.map((document) => `\n\n--- From ${document.file} ---\n${document.content}`).join('')
      : 'No specific information found in the provided student documents.',
    totalDocuments: documents.length
  };
}

module.exports = {
  buildExcerpt,
  loadDocuments,
  retrieveRelevantDocuments,
  scoreDocument,
  tokenize
};
