// Background service worker for handling Claude API calls

// Import API configuration
importScripts('../api/claude-api.js');
importScripts('../utils/storage.js');

// Default model list used when API fetch fails or no key is set
const DEFAULT_MODELS = [
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' }
];

const MODEL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    handleSummarize(request.transcript, request.videoTitle)
      .then(summary => {
        sendResponse({ success: true, summary });
      })
      .catch(error => {
        console.error('Error in service worker:', error);
        sendResponse({
          success: false,
          error: error.message || 'Failed to generate summary'
        });
      });

    // Return true to indicate we'll send response asynchronously
    return true;
  }

  if (request.action === 'chat') {
    handleChat(request.transcript, request.videoTitle, request.history, request.message, request.modelId)
      .then(reply => {
        sendResponse({ success: true, reply });
      })
      .catch(error => {
        console.error('Error in chat handler:', error);
        sendResponse({
          success: false,
          error: error.message || 'Failed to get chat response'
        });
      });

    return true;
  }

  if (request.action === 'getModels') {
    fetchModelList()
      .then(models => {
        sendResponse({ success: true, models });
      })
      .catch(error => {
        console.error('Error fetching models:', error);
        sendResponse({ success: true, models: DEFAULT_MODELS });
      });

    return true;
  }

  if (request.action === 'checkApiKey') {
    hasApiKey()
      .then(exists => {
        sendResponse({ success: true, hasApiKey: exists });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});

/**
 * Call the Claude API with a formatted request body
 * @param {object} requestBody - The formatted request body
 * @param {string} apiKey - The API key
 * @returns {Promise<string>} The response text
 */
async function callClaudeApi(requestBody, apiKey) {
  const headers = getClaudeHeaders(apiKey);

  const response = await fetch(CLAUDE_API_CONFIG.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new Error(`INVALID_API_KEY: ${errorData.error?.message || 'Invalid API key'}`);
    } else if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    } else {
      throw new Error(`API_ERROR: ${errorData.error?.message || response.statusText}`);
    }
  }

  const data = await response.json();

  if (data.content && data.content.length > 0) {
    return data.content[0].text;
  }

  throw new Error('Invalid API response format');
}

/**
 * Handle chat request
 * @param {string} transcript - The video transcript
 * @param {string} videoTitle - The video title
 * @param {Array} history - Conversation history [{role, content}, ...]
 * @param {string} message - The user's new message
 * @param {string} overrideModelId - Optional model override
 * @returns {Promise<string>} The chat reply
 */
async function handleChat(transcript, videoTitle, history, message, overrideModelId) {
  const apiKey = await getApiKey();
  const modelId = overrideModelId || await getModel();
  const personality = await getPersonality();

  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const requestBody = formatChatRequest(transcript, videoTitle, history, message, modelId, personality);
  return callClaudeApi(requestBody, apiKey);
}

/**
 * Handle summarization request
 * @param {string} transcript - The video transcript
 * @param {string} videoTitle - The video title (optional)
 * @returns {Promise<string>} The generated summary
 */
async function handleSummarize(transcript, videoTitle = '') {
  const apiKey = await getApiKey();
  const modelId = await getModel();

  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const requestBody = formatSummarizeRequest(transcript, videoTitle, modelId);
  return callClaudeApi(requestBody, apiKey);
}

/**
 * Fetch available models from the Anthropic API (with 24h cache)
 * @returns {Promise<Array<{id: string, name: string}>>} Model list
 */
async function fetchModelList() {
  // Check cache first
  const cached = await chrome.storage.local.get('cachedModels');
  if (cached.cachedModels && Date.now() - cached.cachedModels.fetchedAt < MODEL_CACHE_TTL) {
    return cached.cachedModels.models;
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    return DEFAULT_MODELS;
  }

  const response = await fetch('https://api.anthropic.com/v1/models', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': CLAUDE_API_CONFIG.version,
      'anthropic-dangerous-direct-browser-access': 'true'
    }
  });

  if (!response.ok) {
    return DEFAULT_MODELS;
  }

  const data = await response.json();
  const models = (data.data || [])
    .map(m => ({ id: m.id, name: m.display_name || m.id }));

  if (models.length === 0) {
    return DEFAULT_MODELS;
  }

  // Cache the result
  await chrome.storage.local.set({
    cachedModels: { models, fetchedAt: Date.now() }
  });

  return models;
}
