/**
 * Main application logic for n8n Agent Chat
 */
class ChatApp {
  constructor() {
    this.webhookUrl = "https://lavesh.app.n8n.cloud/webhook-test/06b8da13-4a71-41f6-92fe-7250320f8980";

    // DOM elements
    this.promptInput = document.getElementById('prompt');
    this.sendButton = document.getElementById('sendButton');
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    // Set up event listeners
    this.sendButton.addEventListener('click', () => this.sendPrompt());
    
    // Focus input on load
    setTimeout(() => this.promptInput.focus(), 100);
    
    // Check URL for conversation ID
    this.checkUrlForConversation();
    
    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  /**
   * Check if URL contains a conversation ID to load
   */
  checkUrlForConversation() {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    
    if (conversationId) {
      const conversation = conversationStorage.getConversationById(conversationId);
      if (conversation) {
        uiController.displayConversation(conversation);
      }
    }
  }

  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + / to focus on input
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        this.promptInput.focus();
      }
      
      // Esc to clear input
      if (e.key === 'Escape' && document.activeElement === this.promptInput) {
        e.preventDefault();
        this.promptInput.value = '';
      }
    });
  }

  /**
   * Send the prompt to the n8n webhook
   */
  async sendPrompt() {
    const promptText = this.promptInput.value.trim();
    
    if (!promptText) {
      return;
    }
    
    // Show loading state
    uiController.showLoading();
    
    // Clear current input
    this.promptInput.value = '';
    uiController.autoResizeTextarea();
    
    // Add prompt to chat
    const timestamp = new Date();
    uiController.currentChat.innerHTML = ''; // Clear welcome message if present
    uiController.addMessageToChat('prompt', promptText, timestamp);
    uiController.scrollToBottom();
    
    try {
      // Send request to n8n webhook
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        body: promptText,
        headers: {
          "Content-Type": "text/plain"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const responseText = await response.text();
      const parsedResponse = JSON.parse(responseText);
      const textOutput = parsedResponse[0]?.output; // Safely access the output property

      if (!textOutput) {
        throw new Error("Invalid response format from server");
      }
      // Add response to chat
      uiController.addMessageToChat('response', textOutput, new Date());
      
      // Save conversation
      const conversation = conversationStorage.saveConversation(promptText, responseText);
      uiController.activeConversationId = conversation.id;
      
      // Update URL with conversation ID for sharing
      this.updateUrlWithConversation(conversation.id);
      
      // Update history list
      uiController.refreshHistoryList();
      
    } catch (error) {
      // Handle error
      uiController.addMessageToChat('response', `Error: ${error.message}`, new Date());
    } finally {
      // Hide loading state
      uiController.hideLoading();
      uiController.scrollToBottom();
    }
  }

  /**
   * Update the URL with the conversation ID for sharing
   * @param {String} conversationId The ID of the conversation
   */
  updateUrlWithConversation(conversationId) {
    const url = new URL(window.location);
    url.searchParams.set('conversation', conversationId);
    window.history.replaceState({}, '', url);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create a new instance of the chat application
  const chatApp = new ChatApp();
});