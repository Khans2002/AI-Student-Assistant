const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildExcerpt,
  retrieveRelevantDocuments,
  tokenize
} = require('../services/retrieval');

test('tokenize removes stop words and normalizes text', () => {
  assert.deepEqual(
    tokenize('What is the late fee for exams?'),
    ['late', 'fee', 'exams']
  );
});

test('buildExcerpt truncates long content', () => {
  const excerpt = buildExcerpt('a'.repeat(700), 20);
  assert.equal(excerpt, `${'a'.repeat(20)}...`);
});

test('retrieveRelevantDocuments returns the most relevant sources', async () => {
  const result = await retrieveRelevantDocuments('What is the late fee and refund policy?');

  assert.equal(result.totalDocuments, 3);
  assert.ok(result.matches.length > 0);
  assert.equal(result.matches[0].file, 'fees.txt');
  assert.match(result.contextText, /fees\.txt/);
});
