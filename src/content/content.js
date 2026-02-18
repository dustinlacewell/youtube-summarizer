// Main content script coordinator


// Global state
let currentVideoId = null;
let currentVideoTitle = null;
let summaryModal = null;
let summarizeButton = null;
const summaryCache = new Map(); // videoId -> summary text
const transcriptCache = new Map(); // videoId -> transcript text

// Initialize
function init() {
  // Create modal instance
  summaryModal = new SummaryModal();

  // Create button instance
  summarizeButton = new SummarizeButton(handleSummarize);

  // Start video detection
  new YouTubeVideoDetector(handleVideoDetected);

  // Watch for transcript panel opening
  watchTranscriptPanel();
}

/**
 * Handle video detected event
 * @param {string} videoId - The detected video ID
 * @param {string} videoTitle - The video title
 */
function handleVideoDetected(videoId, videoTitle) {
  currentVideoId = videoId;
  currentVideoTitle = videoTitle;
}

/**
 * Watch for transcript panel opening and inject button
 */
function watchTranscriptPanel() {
  // Create a mutation observer to watch for transcript panel
  const observer = new MutationObserver(() => {
    const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');

    if (transcriptPanel) {
      // Check if panel is visible
      const isVisible = transcriptPanel.hasAttribute('visibility') &&
                       transcriptPanel.getAttribute('visibility') !== 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN';

      if (isVisible && !summarizeButton.isInjected()) {
        summarizeButton.inject();
      }
    }
  });

  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['visibility']
  });

  // Also check immediately in case panel is already open
  setTimeout(() => {
    const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
    if (transcriptPanel) {
      const isVisible = transcriptPanel.hasAttribute('visibility') &&
                       transcriptPanel.getAttribute('visibility') !== 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN';
      if (isVisible && !summarizeButton.isInjected()) {
        summarizeButton.inject();
      }
    }
  }, 1000);
}

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoInfo') {
    sendResponse({
      videoId: currentVideoId,
      videoTitle: currentVideoTitle
    });
    return true;
  }

  if (request.action === 'openTranscript') {
    openTranscriptPanel()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === 'summarize') {
    handleSummarize()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

/**
 * Open the transcript panel by clicking the buttons
 */
async function openTranscriptPanel() {
  // Step 1: Expand the description area if collapsed
  const descriptionButton = document.querySelector('#expand, tp-yt-paper-button#expand');
  if (descriptionButton) {
    descriptionButton.click();
    // Wait a moment for the description to expand
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Step 2: Find and click the transcript button
  // Look for the "Show transcript" button in various possible locations
  const transcriptButtons = [
    // New YouTube layout selectors
    'button[aria-label*="transcript" i]',
    'button[aria-label*="Show transcript"]',
    // In the description section
    'ytd-video-description-transcript-section-renderer button',
    // Fallback selectors
    '[class*="transcript"] button',
  ];

  let transcriptButton = null;
  for (const selector of transcriptButtons) {
    try {
      transcriptButton = document.querySelector(selector);
      if (transcriptButton) break;
    } catch (e) {
      continue;
    }
  }

  // If still not found, search by button text content
  if (!transcriptButton) {
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const text = btn.textContent.toLowerCase().trim();
      if (text.includes('transcript') || text === 'show transcript') {
        transcriptButton = btn;
        break;
      }
    }
  }

  if (transcriptButton) {
    transcriptButton.click();
    // Wait for panel to open
    await new Promise(resolve => setTimeout(resolve, 500));
  } else {
    throw new Error('Could not find transcript button. Make sure the video has captions available.');
  }
}

/**
 * Handle summarization
 */
async function handleSummarize() {
  if (!currentVideoId) {
    throw new Error('No video detected');
  }

  // If we already have a cached summary for this video, just reopen the modal
  if (summaryCache.has(currentVideoId)) {
    summaryModal.show(summaryCache.get(currentVideoId), currentVideoTitle, transcriptCache.get(currentVideoId));
    return;
  }

  // Set button to loading state
  if (summarizeButton) {
    summarizeButton.setLoading(true);
  }

  try {
    // Fetch transcript
    const transcript = await fetchTranscript(currentVideoId);

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('NO_TRANSCRIPT');
    }

    // Send to service worker for summarization
    const result = await chrome.runtime.sendMessage({
      action: 'summarize',
      transcript: transcript,
      videoTitle: currentVideoTitle
    });

    if (result.success && result.summary) {
      // Cache the summary and transcript for this video
      summaryCache.set(currentVideoId, result.summary);
      transcriptCache.set(currentVideoId, transcript);

      // Show summary in modal (with transcript for chat feature)
      summaryModal.show(result.summary, currentVideoTitle, transcript);

      // Reset button state
      if (summarizeButton) {
        summarizeButton.setLoading(false);
      }
    } else {
      throw new Error(result.error || 'Failed to generate summary');
    }
  } catch (error) {
    console.error('Error during summarization:', error);

    // Reset button state
    if (summarizeButton) {
      summarizeButton.setLoading(false);
    }

    // Handle error and show in modal
    const errorInfo = ErrorHandler.handle(error, {
      retry: handleSummarize
    });

    summaryModal.showError(errorInfo);
    throw error; // Re-throw for popup to handle
  }
}

/**
 * Clean up when navigating away
 */
function cleanup() {
  if (summaryModal) {
    summaryModal.close();
  }

  currentVideoId = null;
  currentVideoTitle = null;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for page unload
window.addEventListener('beforeunload', cleanup);
