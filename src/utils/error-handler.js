// Centralized error handling for user-friendly error messages

class ErrorHandler {
  /**
   * Handle error and return user-friendly message
   * @param {Error|string} error - The error object or message
   * @param {object} context - Optional context for error handling
   * @returns {object} Error info with title, message, and optional action
   */
  static handle(error, context = {}) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType = this.getErrorType(errorMessage);

    switch (errorType) {
      case 'NO_API_KEY':
        return {
          title: 'API Key Required',
          message: 'Please configure your Claude API key in the extension options to use this feature.',
          action: {
            label: 'Open Options',
            callback: () => chrome.runtime.openOptionsPage()
          }
        };

      case 'INVALID_API_KEY':
        return {
          title: 'Invalid API Key',
          message: 'Your Claude API key is invalid. Please check your settings and try again.',
          action: {
            label: 'Open Options',
            callback: () => chrome.runtime.openOptionsPage()
          }
        };

      case 'NO_TRANSCRIPT':
        return {
          title: 'No Transcript Available',
          message: 'This video does not have a transcript or captions available. Try a different video.',
          action: null
        };

      case 'RATE_LIMIT':
        return {
          title: 'Rate Limit Reached',
          message: 'You have reached the API rate limit. Please wait a moment and try again.',
          action: context.retry ? {
            label: 'Retry',
            callback: context.retry
          } : null
        };

      case 'NETWORK_ERROR':
        return {
          title: 'Network Error',
          message: 'Failed to connect to the API. Please check your internet connection and try again.',
          action: context.retry ? {
            label: 'Retry',
            callback: context.retry
          } : null
        };

      case 'API_ERROR':
        return {
          title: 'API Error',
          message: this.extractApiErrorMessage(errorMessage),
          action: context.retry ? {
            label: 'Retry',
            callback: context.retry
          } : null
        };

      default:
        return {
          title: 'Error',
          message: errorMessage || 'An unexpected error occurred. Please try again.',
          action: context.retry ? {
            label: 'Retry',
            callback: context.retry
          } : null
        };
    }
  }

  /**
   * Determine error type from error message
   * @param {string} message - Error message
   * @returns {string} Error type
   */
  static getErrorType(message) {
    if (!message) return 'UNKNOWN';

    const msg = message.toUpperCase();

    if (msg.includes('NO_API_KEY')) return 'NO_API_KEY';
    if (msg.includes('INVALID_API_KEY') || msg.includes('401')) return 'INVALID_API_KEY';
    if (msg.includes('NO_TRANSCRIPT')) return 'NO_TRANSCRIPT';
    if (msg.includes('RATE_LIMIT') || msg.includes('429')) return 'RATE_LIMIT';
    if (msg.includes('NETWORK') || msg.includes('FETCH')) return 'NETWORK_ERROR';
    if (msg.includes('API_ERROR')) return 'API_ERROR';

    return 'UNKNOWN';
  }

  /**
   * Extract user-friendly message from API error
   * @param {string} message - Full error message
   * @returns {string} User-friendly message
   */
  static extractApiErrorMessage(message) {
    // Remove technical prefixes
    const cleaned = message
      .replace(/^API_ERROR:\s*/i, '')
      .replace(/^Error:\s*/i, '')
      .trim();

    return cleaned || 'Failed to generate summary. Please try again.';
  }

  /**
   * Log error for debugging
   * @param {Error|string} error - The error
   * @param {string} context - Context description
   */
  static log(error, context = '') {
    const prefix = context ? `[${context}]` : '[Error]';
    console.error(prefix, error);
  }
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}
