// Summarize button component

class SummarizeButton {
  constructor(onClick) {
    this.onClick = onClick;
    this.button = null;
    this.isLoading = false;
  }

  /**
   * Create the button element
   * @returns {HTMLElement} The button element
   */
  create() {
    const button = document.createElement('button');
    button.className = 'yt-summarize-btn';
    button.setAttribute('aria-label', 'Summarize video with AI');
    button.setAttribute('title', 'Summarize video with AI');

    button.innerHTML = `
      <div class="yt-summarize-btn-content">
        <svg class="yt-summarize-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="yt-summarize-text">Summarize</span>
      </div>
      <div class="yt-summarize-spinner" style="display: none;">
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>
        <span class="yt-summarize-text">Summarizing...</span>
      </div>
    `;

    button.addEventListener('click', () => {
      if (!this.isLoading) {
        this.onClick();
      }
    });

    this.button = button;
    return button;
  }

  /**
   * Inject button into YouTube transcript panel
   */
  inject() {
    // Remove existing button if present
    this.remove();

    // Create new button
    const button = this.create();

    // Find the transcript panel header
    const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');

    if (!transcriptPanel) {
      setTimeout(() => this.inject(), 1000);
      return false;
    }

    // Find the header section inside the transcript panel
    const header = transcriptPanel.querySelector('#header');

    if (!header) {
      setTimeout(() => this.inject(), 1000);
      return false;
    }

    // Create a wrapper to match YouTube's style
    const wrapper = document.createElement('div');
    wrapper.className = 'yt-summarize-btn-wrapper';
    wrapper.style.padding = '12px 24px';
    wrapper.style.borderBottom = '1px solid var(--yt-spec-10-percent-layer)';
    wrapper.appendChild(button);

    // Insert after the header
    if (header.nextSibling) {
      header.parentNode.insertBefore(wrapper, header.nextSibling);
    } else {
      header.parentNode.appendChild(wrapper);
    }

    return true;
  }

  /**
   * Set loading state
   * @param {boolean} loading - Whether button is loading
   */
  setLoading(loading) {
    if (!this.button) return;

    this.isLoading = loading;

    const content = this.button.querySelector('.yt-summarize-btn-content');
    const spinner = this.button.querySelector('.yt-summarize-spinner');

    if (loading) {
      content.style.display = 'none';
      spinner.style.display = 'flex';
      this.button.disabled = true;
      this.button.classList.add('loading');
    } else {
      content.style.display = 'flex';
      spinner.style.display = 'none';
      this.button.disabled = false;
      this.button.classList.remove('loading');
    }
  }

  /**
   * Remove button from page
   */
  remove() {
    const existing = document.querySelector('.yt-summarize-btn-wrapper');
    if (existing) {
      existing.remove();
    }
    this.button = null;
  }

  /**
   * Check if button is currently injected
   * @returns {boolean}
   */
  isInjected() {
    return document.querySelector('.yt-summarize-btn-wrapper') !== null;
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.SummarizeButton = SummarizeButton;
}
