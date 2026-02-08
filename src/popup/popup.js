// Popup script for extension icon click

document.addEventListener('DOMContentLoaded', async () => {
  showSection('loading');

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if on YouTube video page
    if (!tab.url || !tab.url.includes('youtube.com/watch')) {
      showSection('not-youtube');
      return;
    }

    // Check if API key is configured
    const response = await chrome.runtime.sendMessage({ action: 'checkApiKey' });
    if (!response.success || !response.hasApiKey) {
      showSection('no-api-key');
      document.getElementById('openOptions').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
      return;
    }

    // Get video info from content script
    const videoInfo = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });

    if (videoInfo && videoInfo.videoId) {
      // Everything is ready - automatically open transcript and close popup
      await handleOpenTranscript(tab.id);
    } else {
      showSection('not-youtube');
    }
  } catch (error) {
    console.error('Error in popup:', error);
    showError('Failed to initialize. Please refresh the page.');
  }
});

/**
 * Handle open transcript button click
 */
async function handleOpenTranscript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'openTranscript' });
    // Close popup after opening transcript
    window.close();
  } catch (error) {
    console.error('Error opening transcript:', error);
    showError(error.message || 'Failed to open transcript');
  }
}

/**
 * Handle summarize button click
 */
async function handleSummarize(tabId) {
  showSection('summarizing');

  try {
    // Send message to content script to start summarization
    const response = await chrome.tabs.sendMessage(tabId, { action: 'summarize' });

    if (response && response.success) {
      // Close popup - the modal will show on the page
      window.close();
    } else {
      showError(response.error || 'Failed to generate summary');
    }
  } catch (error) {
    console.error('Error during summarization:', error);
    showError(error.message || 'An error occurred');
  }
}

/**
 * Show specific section
 */
function showSection(sectionId) {
  const sections = ['loading', 'not-youtube', 'no-api-key', 'ready', 'summarizing', 'error'];
  sections.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('hidden', id !== sectionId);
    }
  });
}

/**
 * Show error message
 */
function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  showSection('error');

  document.getElementById('retryBtn').addEventListener('click', () => {
    location.reload();
  });
}
