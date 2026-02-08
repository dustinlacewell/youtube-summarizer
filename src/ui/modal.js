// Summary modal component

class SummaryModal {
  constructor() {
    this.modal = null;
  }

  /**
   * Show the modal with summary
   * @param {string} summary - The AI-generated summary
   * @param {string} videoTitle - The video title
   */
  show(summary, videoTitle = 'Video Summary') {
    // Close any existing modal
    this.close();

    // Create modal
    this.modal = this.createModal(summary, videoTitle);

    // Add to page
    document.body.appendChild(this.modal);

    // Add event listeners
    this.addEventListeners();

    // Animate in
    requestAnimationFrame(() => {
      this.modal.classList.add('visible');
    });
  }

  /**
   * Show error in modal
   * @param {object} errorInfo - Error information from ErrorHandler
   */
  showError(errorInfo) {
    // Close any existing modal
    this.close();

    // Create error modal
    this.modal = this.createErrorModal(errorInfo);

    // Add to page
    document.body.appendChild(this.modal);

    // Add event listeners
    this.addEventListeners();

    // Animate in
    requestAnimationFrame(() => {
      this.modal.classList.add('visible');
    });
  }

  /**
   * Create modal element
   * @param {string} summary - The summary text
   * @param {string} videoTitle - The video title
   * @returns {HTMLElement} Modal element
   */
  createModal(summary, videoTitle) {
    const modal = document.createElement('div');
    modal.className = 'yt-summary-modal';

    // Format summary with line breaks and paragraphs
    const formattedSummary = this.formatSummary(summary);

    modal.innerHTML = `
      <div class="yt-summary-overlay"></div>
      <div class="yt-summary-content">
        <div class="yt-summary-header">
          <div class="yt-summary-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h2>${this.escapeHtml(videoTitle)}</h2>
          </div>
          <button class="yt-summary-close" aria-label="Close" title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="yt-summary-body">
          <div class="yt-summary-text">${formattedSummary}</div>
        </div>
        <div class="yt-summary-footer">
          <button class="yt-summary-btn yt-summary-copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            Copy Summary
          </button>
          <p class="yt-summary-credit">Powered by Claude AI</p>
        </div>
      </div>
    `;

    return modal;
  }

  /**
   * Create error modal
   * @param {object} errorInfo - Error info from ErrorHandler
   * @returns {HTMLElement} Modal element
   */
  createErrorModal(errorInfo) {
    const modal = document.createElement('div');
    modal.className = 'yt-summary-modal yt-summary-error-modal';

    const actionButton = errorInfo.action ?
      `<button class="yt-summary-btn yt-summary-action">${this.escapeHtml(errorInfo.action.label)}</button>` :
      '';

    modal.innerHTML = `
      <div class="yt-summary-overlay"></div>
      <div class="yt-summary-content">
        <div class="yt-summary-header">
          <div class="yt-summary-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M12 8v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            <h2>${this.escapeHtml(errorInfo.title)}</h2>
          </div>
          <button class="yt-summary-close" aria-label="Close" title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="yt-summary-body">
          <p class="yt-summary-error-message">${this.escapeHtml(errorInfo.message)}</p>
        </div>
        <div class="yt-summary-footer">
          ${actionButton}
        </div>
      </div>
    `;

    // Store action callback
    if (errorInfo.action) {
      modal._actionCallback = errorInfo.action.callback;
    }

    return modal;
  }

  /**
   * Format summary text with markdown rendering
   * @param {string} text - Raw summary text (markdown)
   * @returns {string} Formatted HTML
   */
  formatSummary(text) {
    // Check if marked is available
    if (typeof marked !== 'undefined' && marked.parse) {
      try {
        // Configure marked for better formatting
        marked.setOptions({
          breaks: true,        // Convert \n to <br>
          gfm: true,          // GitHub Flavored Markdown
          headerIds: false,   // Don't add IDs to headers
          mangle: false       // Don't escape autolinked email addresses
        });

        return marked.parse(text);
      } catch (error) {
        console.error('Marked parsing error:', error);
        // Fallback to basic formatting
        return this.basicFormatSummary(text);
      }
    }

    // Fallback if marked is not available
    return this.basicFormatSummary(text);
  }

  /**
   * Basic formatting fallback (original implementation)
   * @param {string} text - Raw summary text
   * @returns {string} Formatted HTML
   */
  basicFormatSummary(text) {
    const paragraphs = text.split('\n\n');

    return paragraphs
      .map(p => {
        const escaped = this.escapeHtml(p.trim());
        const withBreaks = escaped.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      })
      .join('');
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add event listeners to modal
   */
  addEventListeners() {
    if (!this.modal) return;

    // Close button
    const closeBtn = this.modal.querySelector('.yt-summary-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Overlay click
    const overlay = this.modal.querySelector('.yt-summary-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }

    // Copy button
    const copyBtn = this.modal.querySelector('.yt-summary-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copySummary());
    }

    // Action button (for errors)
    const actionBtn = this.modal.querySelector('.yt-summary-action');
    if (actionBtn && this.modal._actionCallback) {
      actionBtn.addEventListener('click', () => {
        this.modal._actionCallback();
        this.close();
      });
    }

    // Escape key
    this.escapeKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeKeyHandler);
  }

  /**
   * Copy summary to clipboard
   */
  async copySummary() {
    const summaryText = this.modal.querySelector('.yt-summary-text');
    if (!summaryText) return;

    const text = summaryText.textContent;

    try {
      await navigator.clipboard.writeText(text);

      // Show feedback
      const copyBtn = this.modal.querySelector('.yt-summary-copy');
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Copied!
        `;
        copyBtn.disabled = true;

        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  /**
   * Close and remove modal
   */
  close() {
    if (!this.modal) return;

    // Animate out
    this.modal.classList.remove('visible');

    // Remove after animation
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;

      // Remove escape key listener
      if (this.escapeKeyHandler) {
        document.removeEventListener('keydown', this.escapeKeyHandler);
        this.escapeKeyHandler = null;
      }
    }, 300);
  }

  /**
   * Check if modal is currently open
   * @returns {boolean}
   */
  isOpen() {
    return this.modal !== null;
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.SummaryModal = SummaryModal;
}
