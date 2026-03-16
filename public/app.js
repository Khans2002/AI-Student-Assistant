const form = document.getElementById('ask-form');
const questionInput = document.getElementById('question');
const askButton = document.getElementById('ask-button');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const answerCard = document.getElementById('answer-card');
const answerText = document.getElementById('answer-text');
const answerModel = document.getElementById('answer-model');
const sourcesCard = document.getElementById('sources-card');
const sourcesList = document.getElementById('sources-list');
const contextBadge = document.getElementById('context-badge');
const backendStatus = document.getElementById('backend-status');
const modelStatus = document.getElementById('model-status');
const documentStatus = document.getElementById('document-status');

function setHidden(element, hidden) {
  element.classList.toggle('hidden', hidden);
}

function renderHealth(health) {
  backendStatus.textContent = health.status === 'OK' ? 'Online' : health.message;
  modelStatus.textContent = health.modelAvailable ? health.configuredModel : 'Model unavailable';
  documentStatus.textContent = `${health.documentsAvailable} loaded`;
}

function renderError(message) {
  errorState.textContent = message;
  setHidden(errorState, false);
}

function clearMessages() {
  errorState.textContent = '';
  setHidden(errorState, true);
  setHidden(answerCard, true);
  setHidden(sourcesCard, true);
}

function clearSources() {
  sourcesList.replaceChildren();
}

function renderSources(data) {
  clearSources();

  if (!data.sources || data.sources.length === 0) {
    contextBadge.textContent = 'No document match';
    setHidden(sourcesCard, false);
    return;
  }

  contextBadge.textContent = data.contextFound ? 'Context found' : 'No document match';

  for (const source of data.sources) {
    const item = document.createElement('li');
    item.className = 'source-item';

    const title = document.createElement('h3');
    title.textContent = source.file;

    const excerpt = document.createElement('p');
    excerpt.textContent = source.excerpt;

    item.append(title, excerpt);
    sourcesList.append(item);
  }

  setHidden(sourcesCard, false);
}

async function loadHealth() {
  try {
    const response = await fetch('/health');
    const health = await response.json();
    renderHealth(health);
  } catch (error) {
    backendStatus.textContent = 'Unavailable';
    modelStatus.textContent = 'Unknown';
    documentStatus.textContent = 'Unknown';
  }
}

async function askQuestion(event) {
  event.preventDefault();
  clearMessages();

  const question = questionInput.value.trim();
  if (!question) {
    renderError('Enter a question before asking the assistant.');
    return;
  }

  askButton.disabled = true;
  askButton.textContent = 'Asking...';
  setHidden(loadingState, false);

  try {
    const response = await fetch('/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed.');
    }

    answerText.textContent = data.answer;
    answerModel.textContent = data.model;
    setHidden(answerCard, false);
    renderSources(data);
  } catch (error) {
    renderError(error.message || 'Something went wrong while contacting the assistant.');
  } finally {
    askButton.disabled = false;
    askButton.textContent = 'Ask';
    setHidden(loadingState, true);
  }
}

form.addEventListener('submit', askQuestion);
loadHealth();
