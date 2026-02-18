// Summary modal component with chat-with-video feature

class SummaryModal {
  constructor() {
    this.modal = null;
    this.chatHistory = []; // [{role: 'user'|'assistant', content: string}]
    this.transcript = null;
    this.videoTitle = null;
    this.isSending = false;
    this.chatModelId = null; // override model for chat, null = use default
  }

  /**
   * Show the modal with summary and chat panel
   * @param {string} summary - The AI-generated summary
   * @param {string} videoTitle - The video title
   * @param {string} transcript - The video transcript (for chat context)
   */
  show(summary, videoTitle = 'Video Summary', transcript = null) {
    // Close any existing modal
    this.close();

    // Reset chat state for new session
    this.chatHistory = [];
    this.transcript = transcript;
    this.videoTitle = videoTitle;
    this.isSending = false;

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
   * Create modal element with two-panel layout
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
        <div class="yt-summary-panels">
          <div class="yt-summary-panel-left">
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
              <button class="yt-summary-chat-toggle" title="Chat with this video">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Chat
              </button>
            </div>
          </div>
          <div class="yt-summary-panel-right">
            <div class="yt-summary-chat-header">
              <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Chat with this video
                <select class="yt-summary-chat-model-select" title="Model for chat">
                  <option value="">Loading...</option>
                </select>
              </h3>
            </div>
            <div class="yt-summary-chat-messages">
              <div class="yt-summary-chat-empty">Ask me anything about what I cover!</div>
            </div>
            <div class="yt-summary-chat-input-row">
              <textarea class="yt-summary-chat-input" placeholder="Ask me anything..." rows="1"></textarea>
              <button class="yt-summary-chat-send" aria-label="Send message" title="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    return modal;
  }

  /**
   * Create error modal (no chat panel for errors)
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
      <div class="yt-summary-content" style="max-width: 700px;">
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
        // Configure marked once
        if (!SummaryModal._markedConfigured) {
          marked.setOptions({
            breaks: true,        // Convert \n to <br>
            gfm: true,          // GitHub Flavored Markdown
            headerIds: false,   // Don't add IDs to headers
            mangle: false       // Don't escape autolinked email addresses
          });
          SummaryModal._markedConfigured = true;
        }

        return this.sanitizeHtml(marked.parse(text));
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
   * Sanitize HTML to prevent XSS from API responses
   * @param {string} html - Raw HTML string
   * @returns {string} Sanitized HTML
   */
  sanitizeHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, iframe, object, embed, form, link').forEach(el => el.remove());
    doc.querySelectorAll('*').forEach(el => {
      for (const attr of [...el.attributes]) {
        if (attr.name.startsWith('on') || attr.name === 'srcdoc') {
          el.removeAttribute(attr.name);
        }
        if (['href', 'src', 'action', 'formaction'].includes(attr.name) &&
            attr.value.trim().toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
    });
    return doc.body.innerHTML;
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

    // Chat toggle button
    const chatToggle = this.modal.querySelector('.yt-summary-chat-toggle');
    if (chatToggle) {
      chatToggle.addEventListener('click', () => this.toggleChat());
    }

    // Model selector — fetch available models from service worker
    const modelSelect = this.modal.querySelector('.yt-summary-chat-model-select');
    if (modelSelect) {
      chrome.runtime.sendMessage({ action: 'getModels' }, (result) => {
        if (result && result.success && result.models && result.models.length > 0) {
          modelSelect.innerHTML = result.models.map(m => {
            const safeId = this.escapeHtml(m.id);
            const safeName = this.escapeHtml(m.name);
            return `<option value="${safeId}">${safeName}</option>`;
          }).join('');
        }

        // Set to user's saved default
        chrome.storage.sync.get('claudeModel', (storageResult) => {
          const defaultModel = storageResult.claudeModel || 'claude-opus-4-6';
          modelSelect.value = defaultModel;
          this.chatModelId = defaultModel;
        });
      });

      modelSelect.addEventListener('change', () => {
        this.chatModelId = modelSelect.value;
      });
    }

    // Chat input — Enter to send, Shift+Enter for newline
    const chatInput = this.modal.querySelector('.yt-summary-chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendChatMessage();
        }
      });

      // Auto-resize textarea
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
      });
    }

    // Send button
    const sendBtn = this.modal.querySelector('.yt-summary-chat-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendChatMessage());
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
   * Toggle chat panel visibility
   */
  toggleChat() {
    if (!this.modal) return;
    this.modal.classList.toggle('chat-open');

    // Focus input when opening
    if (this.modal.classList.contains('chat-open')) {
      const input = this.modal.querySelector('.yt-summary-chat-input');
      if (input) {
        setTimeout(() => input.focus(), 300); // after transition
      }
    }
  }

  /**
   * Send a chat message to the video
   */
  async sendChatMessage() {
    if (this.isSending || !this.modal) return;

    const input = this.modal.querySelector('.yt-summary-chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    if (!this.transcript) {
      this.appendMessage('error', 'Chat is unavailable — no transcript loaded.');
      return;
    }

    // Clear input and reset height
    input.value = '';
    input.style.height = 'auto';

    // Remove empty state if present
    const emptyState = this.modal.querySelector('.yt-summary-chat-empty');
    if (emptyState) {
      emptyState.remove();
    }

    // Show user message
    this.appendMessage('user', message);

    // Disable input while sending
    this.isSending = true;
    input.disabled = true;
    const sendBtn = this.modal.querySelector('.yt-summary-chat-send');
    if (sendBtn) sendBtn.disabled = true;

    // Show typing indicator
    this.showTypingIndicator();

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'chat',
        transcript: this.transcript,
        videoTitle: this.videoTitle,
        history: this.chatHistory,
        message: message,
        modelId: this.chatModelId
      });

      this.hideTypingIndicator();

      if (result.success && result.reply) {
        // Add to conversation history
        this.chatHistory.push({ role: 'user', content: message });
        this.chatHistory.push({ role: 'assistant', content: result.reply });

        // Show assistant reply
        this.appendMessage('assistant', result.reply);
      } else {
        this.appendMessage('error', result.error || 'Something went wrong. Try again!');
      }
    } catch (error) {
      this.hideTypingIndicator();
      this.appendMessage('error', 'Failed to send message. Try again!');
      console.error('Chat error:', error);
    } finally {
      // Re-enable input
      this.isSending = false;
      if (this.modal) {
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
      }
    }
  }

  /**
   * Append a message bubble to the chat
   * @param {string} role - 'user', 'assistant', or 'error'
   * @param {string} text - The message text
   */
  appendMessage(role, text) {
    if (!this.modal) return;

    const messagesContainer = this.modal.querySelector('.yt-summary-chat-messages');
    if (!messagesContainer) return;

    const bubble = document.createElement('div');
    bubble.className = `yt-summary-chat-bubble ${role}`;

    if (role === 'assistant') {
      bubble.innerHTML = this.formatSummary(text);
    } else {
      bubble.textContent = text;
    }

    messagesContainer.appendChild(bubble);

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Show typing indicator in chat
   */
  showTypingIndicator() {
    if (!this.modal) return;

    const messagesContainer = this.modal.querySelector('.yt-summary-chat-messages');
    if (!messagesContainer) return;

    const typing = document.createElement('div');
    typing.className = 'yt-summary-chat-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';

    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Remove typing indicator from chat
   */
  hideTypingIndicator() {
    if (!this.modal) return;

    const typing = this.modal.querySelector('.yt-summary-chat-typing');
    if (typing) {
      typing.remove();
    }
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

SummaryModal._markedConfigured = false;

// Export for use in content script
if (typeof window !== 'undefined') {
  window.SummaryModal = SummaryModal;
}
