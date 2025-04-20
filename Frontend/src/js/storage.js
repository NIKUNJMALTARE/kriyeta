/**
 * Storage utility for managing conversation history in localStorage
 */
class ConversationStorage {
  constructor() {
    this.storageKey = 'n8nConversations';
    this.maxConversations = 30; // Maximum number of conversations to store
  }

  /**
   * Get all stored conversations
   * @returns {Array} Array of conversation objects
   */
  getConversations() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save a new conversation
   * @param {String} prompt The user's prompt
   * @param {String} response The agent's response
   * @returns {Object} The saved conversation with id and timestamp
   */
  saveConversation(prompt, response) {
    const conversations = this.getConversations();
    
    // Create new conversation object
    const newConversation = {
      id: this.generateId(),
      prompt: prompt,
      response: response,
      timestamp: new Date().toISOString()
    };
    
    // Add to beginning of array
    conversations.unshift(newConversation);
    
    // Limit the number of stored conversations
    const limitedConversations = conversations.slice(0, this.maxConversations);
    
    // Save to localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(limitedConversations));
    
    return newConversation;
  }

  /**
   * Get a specific conversation by ID
   * @param {String} id The conversation ID
   * @returns {Object|null} The conversation object or null if not found
   */
  getConversationById(id) {
    const conversations = this.getConversations();
    return conversations.find(conv => conv.id === id) || null;
  }

  /**
   * Clear all stored conversations
   */
  clearConversations() {
    localStorage.setItem(this.storageKey, JSON.stringify([]));
  }

  /**
   * Generate a unique ID for a conversation
   * @returns {String} A unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

// Create a global instance of the storage
const conversationStorage = new ConversationStorage();