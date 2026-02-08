// Chrome storage wrapper for API key management

const StorageKeys = {
  CLAUDE_API_KEY: 'claudeApiKey',
  CLAUDE_MODEL: 'claudeModel',
  SETTINGS: 'settings'
};

/**
 * Save Claude API key to Chrome sync storage
 * @param {string} apiKey - The Claude API key
 * @returns {Promise<void>}
 */
async function saveApiKey(apiKey) {
  // Trim whitespace from API key
  const trimmedKey = apiKey ? apiKey.trim() : '';
  return chrome.storage.sync.set({ [StorageKeys.CLAUDE_API_KEY]: trimmedKey });
}

/**
 * Get Claude API key from Chrome sync storage
 * @returns {Promise<string|null>} The API key or null if not set
 */
async function getApiKey() {
  const result = await chrome.storage.sync.get(StorageKeys.CLAUDE_API_KEY);
  return result[StorageKeys.CLAUDE_API_KEY] || null;
}

/**
 * Check if API key exists in storage
 * @returns {Promise<boolean>}
 */
async function hasApiKey() {
  const apiKey = await getApiKey();
  return apiKey !== null && apiKey.length > 0;
}

/**
 * Validate API key format
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if valid format
 */
function validateApiKeyFormat(apiKey) {
  return apiKey && apiKey.trim().startsWith('sk-ant-');
}

/**
 * Clear API key from storage
 * @returns {Promise<void>}
 */
async function clearApiKey() {
  return chrome.storage.sync.remove(StorageKeys.CLAUDE_API_KEY);
}

/**
 * Save selected Claude model to Chrome sync storage
 * @param {string} modelId - The Claude model ID (e.g., 'claude-opus-4-6')
 * @returns {Promise<void>}
 */
async function saveModel(modelId) {
  return chrome.storage.sync.set({ [StorageKeys.CLAUDE_MODEL]: modelId });
}

/**
 * Get selected Claude model from Chrome sync storage
 * @returns {Promise<string>} The model ID or default 'claude-opus-4-6'
 */
async function getModel() {
  const result = await chrome.storage.sync.get(StorageKeys.CLAUDE_MODEL);
  return result[StorageKeys.CLAUDE_MODEL] || 'claude-opus-4-6';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveApiKey,
    getApiKey,
    hasApiKey,
    validateApiKeyFormat,
    clearApiKey,
    saveModel,
    getModel,
    StorageKeys
  };
}
