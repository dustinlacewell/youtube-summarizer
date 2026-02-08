// YouTube video detection for Single Page Application navigation

class YouTubeVideoDetector {
  /**
   * @param {function(string, string)} callback - Callback function called when video detected
   *                                               Receives (videoId, videoTitle)
   */
  constructor(callback) {
    this.callback = callback;
    this.currentVideoId = null;
    this.init();
  }

  /**
   * Initialize the detector
   */
  init() {
    // Check initial page load
    this.checkForVideo();

    // Listen for YouTube's SPA navigation event
    document.addEventListener('yt-navigate-finish', () => {
      this.checkForVideo();
    });

    // Fallback: observe URL changes
    this.observeUrlChanges();

    // Fallback: observe page title changes (indicates new video loaded)
    this.observeTitleChanges();
  }

  /**
   * Check if current page is a video page and extract video ID
   */
  checkForVideo() {
    const videoId = this.extractVideoId();

    if (videoId && videoId !== this.currentVideoId) {
      this.currentVideoId = videoId;
      const videoTitle = this.extractVideoTitle();
      this.callback(videoId, videoTitle);
    } else if (!videoId && this.currentVideoId) {
      // Navigated away from video page
      this.currentVideoId = null;
    }
  }

  /**
   * Extract video ID from URL
   * @returns {string|null} Video ID or null if not on video page
   */
  extractVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  /**
   * Extract video title from page
   * @returns {string} Video title
   */
  extractVideoTitle() {
    // Try to get title from the page
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') ||
                         document.querySelector('h1.ytd-watch-metadata') ||
                         document.querySelector('yt-formatted-string.ytd-watch-metadata');

    if (titleElement) {
      return titleElement.textContent.trim();
    }

    // Fallback to page title (removes " - YouTube")
    return document.title.replace(' - YouTube', '').trim();
  }

  /**
   * Observe URL changes using History API
   */
  observeUrlChanges() {
    let lastUrl = location.href;

    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.checkForVideo();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  /**
   * Observe page title changes
   */
  observeTitleChanges() {
    const titleElement = document.querySelector('title');
    if (titleElement) {
      new MutationObserver(() => {
        this.checkForVideo();
      }).observe(titleElement, { childList: true, subtree: true });
    }
  }

  /**
   * Get current video ID
   * @returns {string|null}
   */
  getCurrentVideoId() {
    return this.currentVideoId;
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.YouTubeVideoDetector = YouTubeVideoDetector;
}
