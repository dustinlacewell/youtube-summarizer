// YouTube transcript fetcher

/**
 * Scrape transcript directly from YouTube's transcript panel DOM
 * @returns {Promise<string>} The transcript text
 */
async function scrapeTranscriptFromDOM() {
  // Find all transcript segments in the DOM
  const segments = document.querySelectorAll('ytd-transcript-segment-renderer');

  if (!segments || segments.length === 0) {
    throw new Error('NO_TRANSCRIPT_PANEL');
  }

  const transcriptLines = [];

  for (const segment of segments) {
    // Get the text content from the segment
    const textElement = segment.querySelector('.segment-text');

    if (textElement && textElement.textContent) {
      const text = textElement.textContent.trim();
      if (text) {
        transcriptLines.push(text);
      }
    }
  }

  if (transcriptLines.length === 0) {
    throw new Error('NO_TRANSCRIPT_TEXT');
  }

  const transcript = transcriptLines.join(' ');
  return transcript;
}

/**
 * Check if transcript panel is currently visible
 * @returns {boolean} Whether transcript panel is visible
 */
function isTranscriptPanelVisible() {
  const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');

  if (!transcriptPanel) {
    return false;
  }

  // Check if panel is visible (YouTube adds visibility attribute)
  const isVisible = transcriptPanel.hasAttribute('visibility') &&
                   transcriptPanel.getAttribute('visibility') !== 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN';

  return isVisible;
}

/**
 * Fetch transcript from the currently visible transcript panel
 * @returns {Promise<string>} The transcript text
 */
async function fetchTranscript() {
  if (!isTranscriptPanelVisible()) {
    throw new Error('NO_TRANSCRIPT_PANEL');
  }

  const transcript = await scrapeTranscriptFromDOM();
  return transcript;
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.fetchTranscript = fetchTranscript;
  window.scrapeTranscriptFromDOM = scrapeTranscriptFromDOM;
  window.isTranscriptPanelVisible = isTranscriptPanelVisible;
}
