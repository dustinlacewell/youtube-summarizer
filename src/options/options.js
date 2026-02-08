// Options page logic for API key and model management

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('modelSelect');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const messageDiv = document.getElementById('message');

  // Load existing settings on page load
  await loadSettings();

  // Save button click handler
  saveBtn.addEventListener('click', handleSave);

  // Clear button click handler
  clearBtn.addEventListener('click', handleClear);

  // Enter key to save
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  });

  /**
   * Load existing settings from storage
   */
  async function loadSettings() {
    try {
      // Load API key
      const apiKey = await getApiKey();
      if (apiKey) {
        apiKeyInput.value = apiKey;
      }

      // Load selected model
      const selectedModel = await getModel();

      // Fetch available models
      await fetchModels(apiKey, selectedModel);

    } catch (error) {
      showMessage('Error loading settings', 'error');
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Fetch available models from Claude API
   * @param {string} apiKey - The API key to use
   * @param {string} selectedModel - The currently selected model ID
   */
  async function fetchModels(apiKey, selectedModel) {
    if (!apiKey) {
      modelSelect.innerHTML = '<option value="claude-opus-4-6">claude-opus-4-6 (default)</option>' +
                              '<option value="claude-sonnet-4-5">claude-sonnet-4-5</option>' +
                              '<option value="claude-haiku-4-5">claude-haiku-4-5</option>';
      modelSelect.value = selectedModel || 'claude-opus-4-6';
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();

      // Filter to only show message models (not embedding models)
      const messageModels = data.data.filter(model => model.type === 'message');

      if (messageModels.length === 0) {
        throw new Error('No models available');
      }

      // Populate dropdown
      modelSelect.innerHTML = messageModels.map(model =>
        `<option value="${model.id}">${model.display_name || model.id}</option>`
      ).join('');

      // Set selected model
      modelSelect.value = selectedModel || messageModels[0].id;

    } catch (error) {
      console.error('Error fetching models:', error);
      // Fallback to default models
      modelSelect.innerHTML = '<option value="claude-opus-4-6">claude-opus-4-6 (default)</option>' +
                              '<option value="claude-sonnet-4-5">claude-sonnet-4-5</option>' +
                              '<option value="claude-haiku-4-5">claude-haiku-4-5</option>';
      modelSelect.value = selectedModel || 'claude-opus-4-6';
    }
  }

  /**
   * Handle save button click
   */
  async function handleSave() {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;

    // Validate input
    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }

    // Validate format
    if (!validateApiKeyFormat(apiKey)) {
      showMessage('Invalid API key format. Should start with "sk-ant-"', 'error');
      return;
    }

    if (!selectedModel) {
      showMessage('Please select a model', 'error');
      return;
    }

    // Save to storage
    try {
      await saveApiKey(apiKey);
      await saveModel(selectedModel);
      showMessage('Settings saved successfully!', 'success');

      // Disable save button briefly to show feedback
      saveBtn.disabled = true;
      setTimeout(() => {
        saveBtn.disabled = false;
      }, 2000);

      // Refresh models list with new API key
      await fetchModels(apiKey, selectedModel);
    } catch (error) {
      showMessage('Error saving settings', 'error');
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Handle clear button click
   */
  async function handleClear() {
    if (!confirm('Are you sure you want to clear your API key and settings?')) {
      return;
    }

    try {
      await clearApiKey();
      apiKeyInput.value = '';
      showMessage('Settings cleared', 'success');

      // Reset model dropdown
      await fetchModels(null, 'claude-opus-4-6');
    } catch (error) {
      showMessage('Error clearing settings', 'error');
      console.error('Error clearing settings:', error);
    }
  }

  /**
   * Show message to user
   * @param {string} text - Message text
   * @param {string} type - Message type: 'success' or 'error'
   */
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add('hidden');
    }, 5000);
  }
});
