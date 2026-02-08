// Background service worker for handling Claude API calls

// Import API configuration
importScripts('../api/claude-api.js');
importScripts('../utils/storage.js');

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
 * Handle summarization request
 * @param {string} transcript - The video transcript
 * @param {string} videoTitle - The video title (optional)
 * @returns {Promise<string>} The generated summary
 */
async function handleSummarize(transcript, videoTitle = '') {
  // Get API key and model from storage
  const apiKey = await getApiKey();
  const modelId = await getModel();

  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  // Truncate transcript if too long
  const truncatedTranscript = truncateTranscript(transcript);

  // Format request with selected model
  const requestBody = formatSummarizeRequest(truncatedTranscript, videoTitle, modelId);
  const headers = getClaudeHeaders(apiKey);

  // Call Claude API
  const response = await fetch(CLAUDE_API_CONFIG.endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      const errorMsg = errorData.error?.message || 'Invalid API key';
      throw new Error(`INVALID_API_KEY: ${errorMsg}`);
    } else if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    } else {
      throw new Error(`API_ERROR: ${errorData.error?.message || response.statusText}`);
    }
  }

  const data = await response.json();

  // Extract summary from response
  if (data.content && data.content.length > 0) {
    return data.content[0].text;
  }

  throw new Error('Invalid API response format');
}
