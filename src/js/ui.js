/**
 * UI Controller for managing the chat interface
 */
class UIController {
  constructor() {
    // DOM Elements
    this.sidebar = document.getElementById('sidebar');
    this.toggleSidebarBtn = document.getElementById('toggleSidebar');
    this.themeToggleBtn = document.getElementById('themeToggle');
    this.historyList = document.getElementById('historyList');
    this.clearHistoryBtn = document.getElementById('clearHistory');
    this.currentChat = document.getElementById('currentChat');
    this.promptInput = document.getElementById('prompt');
    this.sendButton = document.getElementById('sendButton');
    this.loader = document.getElementById('loader');

    // State
    this.activeConversationId = null;
    this.sidebarVisible = true;
    this.isDarkTheme = false;

    // Initialize UI
    this.initEventListeners();
    this.loadThemePreference();
    this.refreshHistoryList();
  }

  /**
   * Set up event listeners
   */
  initEventListeners() {
    // Toggle sidebar
    this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
    
    // Toggle theme
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    
    // Clear history
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    
    // Handle textarea enter key
    this.promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendButton.click();
      }
    });

    // Autoresize textarea
    this.promptInput.addEventListener('input', () => {
      this.autoResizeTextarea();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        this.sidebar.classList.remove('visible');
        this.sidebarVisible = false;
      } else {
        this.sidebar.classList.remove('collapsed');
        this.sidebarVisible = true;
      }
    });
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    if (window.innerWidth <= 768) {
      this.sidebar.classList.toggle('visible');
    } else {
      this.sidebar.classList.toggle('collapsed');
    }
    this.sidebarVisible = !this.sidebarVisible;
    
    // Change icon direction
    const icon = this.toggleSidebarBtn.querySelector('i');
    icon.classList.toggle('fa-chevron-left');
    icon.classList.toggle('fa-chevron-right');
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    this.isDarkTheme = document.body.classList.contains('dark-theme');
    localStorage.setItem('n8nTheme', this.isDarkTheme ? 'dark' : 'light');
  }

  /**
   * Load saved theme preference
   */
  loadThemePreference() {
    const savedTheme = localStorage.getItem('n8nTheme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      this.isDarkTheme = true;
    }
  }

  /**
   * Clear all conversation history
   */
  clearHistory() {
    if (confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) {
      conversationStorage.clearConversations();
      this.refreshHistoryList();
      this.showWelcomeMessage();
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.loader.classList.add('visible');
    this.sendButton.disabled = true;
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.loader.classList.remove('visible');
    this.sendButton.disabled = false;
  }

  /**
   * Auto-resize textarea based on content
   */
  autoResizeTextarea() {
    const textarea = this.promptInput;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = newHeight + 'px';
  }

  /**
   * Display welcome message in current chat
   */
  showWelcomeMessage() {
    this.currentChat.innerHTML = `
      <div class="welcome-message">
        <h2>Welcome to n8n Agent Chat</h2>
        <p>Ask anything to get started, or select a previous conversation from the sidebar.</p>
      </div>
    `;
    this.activeConversationId = null;
  }

  /**
   * Display a conversation in the main chat area
   * @param {Object} conversation The conversation to display
   */
  displayConversation(conversation) {
    // Clear current chat first
    this.currentChat.innerHTML = '';
    
    // Add prompt message
    this.addMessageToChat('prompt', conversation.prompt, new Date(conversation.timestamp));
    
    // Add response message
    this.addMessageToChat('response', conversation.response, new Date(conversation.timestamp));
    
    // Update active conversation
    this.activeConversationId = conversation.id;
    
    // Highlight active conversation in sidebar
    this.highlightActiveConversation();
    
    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Add a new message to the chat
   * @param {String} type 'prompt' or 'response'
   * @param {String} content The message content
   * @param {Date} time The message timestamp
   */
  addMessageToChat(type, content, time) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}-message`;
    
    const formattedTime = this.formatTime(time);
    const typeLabel = type === 'prompt' ? 'You' : 'Agent';
    
    messageEl.innerHTML = `
      <div class="message-meta">
        <span class="message-type">${typeLabel}</span>
        <span class="message-time">${formattedTime}</span>
      </div>
      <div class="message-content">${this.formatMessageContent(content)}</div>
    `;
    
    this.currentChat.appendChild(messageEl);
  }

  /**
   * Format message content with line breaks
   * @param {String} content The message content
   * @returns {String} Formatted content with HTML line breaks
   */
  formatMessageContent(content) {
    return content.replace(/\n/g, '<br>');
  }

  /**
   * Format time for display
   * @param {Date} date The date to format
   * @returns {String} Formatted time string
   */
  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
           ', ' + date.toLocaleDateString();
  }

  /**
   * Scroll the chat to the bottom
   */
  scrollToBottom() {
    this.currentChat.scrollTop = this.currentChat.scrollHeight;
  }

  /**
   * Format a prompt for display in the history sidebar
   * @param {String} prompt The full prompt
   * @returns {String} Truncated prompt for display
   */
  formatPromptForHistory(prompt) {
    // Truncate long prompts
    const maxLength = 50;
    return prompt.length > maxLength
      ? prompt.substring(0, maxLength) + '...'
      : prompt;
  }

  /**
   * Format a date for display in the history sidebar
   * @param {String} isoString ISO date string
   * @returns {String} Formatted date
   */
  formatDateForHistory(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If today
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
    }
    
    // If yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString() + ' ' + 
           date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  }

  /**
   * Refresh the history list in the sidebar
   */
  refreshHistoryList() {
    const conversations = conversationStorage.getConversations();
    
    if (conversations.length === 0) {
      this.historyList.innerHTML = `<div class="empty-history">No conversation history yet</div>`;
      return;
    }
    
    this.historyList.innerHTML = '';
    
    conversations.forEach(conversation => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.dataset.id = conversation.id;
      
      if (conversation.id === this.activeConversationId) {
        historyItem.classList.add('active');
      }
      
      historyItem.innerHTML = `
        <div class="history-item-title">${this.formatPromptForHistory(conversation.prompt)}</div>
        <div class="history-item-time">${this.formatDateForHistory(conversation.timestamp)}</div>
      `;
      
      historyItem.addEventListener('click', () => {
        this.displayConversation(conversation);
      });
      
      this.historyList.appendChild(historyItem);
    });
  }

  /**
   * Highlight the active conversation in the sidebar
   */
  highlightActiveConversation() {
    const items = this.historyList.querySelectorAll('.history-item');
    items.forEach(item => {
      if (item.dataset.id === this.activeConversationId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}

// Create a global instance of the UI controller
const uiController = new UIController();