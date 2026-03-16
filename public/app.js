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

function renderSources(data) {
  if (!data.sources || data.sources.length === 0) {
    sourcesList.innerHTML = '';
    contextBadge.textContent = 'No document match';
    setHidden(sourcesCard, false);
    return;
  }

  contextBadge.textContent = data.contextFound ? 'Context found' : 'No document match';
  sourcesList.innerHTML = data.sources
    .map((source) => `
      <li class="source-item">
        <h3>${source.file}</h3>
        <p>${source.excerpt}</p>
      </li>
    `)
    .join('');
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
