// Claude API client for formatting requests

const CLAUDE_API_CONFIG = {
  endpoint: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01',
  maxTokens: 2048,
  defaultModel: 'claude-opus-4-6'
};

/**
 * Format a summarize request for Claude API
 * @param {string} transcript - The video transcript to summarize
 * @param {string} videoTitle - The video title (optional)
 * @param {string} modelId - The Claude model ID to use (optional)
 * @returns {object} Formatted request body
 */
function formatSummarizeRequest(transcript, videoTitle = '', modelId = null) {
  const titleContext = videoTitle ? `\n\nVideo Title: ${videoTitle}` : '';

  const prompt = `
  Please provide a summary of this YouTube video transcript.

  Focus on the main points, key takeaways, and important details.
  Format your response in a clear, easy-to-read structure:

  - a 1 line TLDR that captures the primary takeaway of the whole video.
  - a section listing all key takeaways.
  - an extended section where the transcript is distilled into the tersest possible reduction.

  Video Title: ${titleContext}

Transcript:
${transcript}
`;

  return {
    model: modelId || CLAUDE_API_CONFIG.defaultModel,
    max_tokens: CLAUDE_API_CONFIG.maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };
}

/**
 * Get headers for Claude API request
 * @param {string} apiKey - The Claude API key
 * @returns {object} Headers object
 */
function getClaudeHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': CLAUDE_API_CONFIG.version,
    'anthropic-dangerous-direct-browser-access': 'true'
  };
}

/**
 * Truncate transcript if too long (to avoid token limits)
 * @param {string} transcript - The transcript text
 * @param {number} maxLength - Maximum character length (default 50000)
 * @returns {string} Truncated transcript
 */
function truncateTranscript(transcript, maxLength = 50000) {
  if (transcript.length <= maxLength) {
    return transcript;
  }

  return transcript.substring(0, maxLength) + '\n\n[Transcript truncated due to length...]';
}

// Export for use in service worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CLAUDE_API_CONFIG,
    formatSummarizeRequest,
    getClaudeHeaders,
    truncateTranscript
  };
}
