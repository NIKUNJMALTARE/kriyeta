import { useEffect, useState } from 'react';
import { Moon, Sun, ChevronLeft, ChevronRight, Trash2, Send } from 'lucide-react';
import { cn } from './lib/utils';

interface Message {
  type: 'prompt' | 'response';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  prompt: string;
  response: string;
  timestamp: string;
}

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const webhookUrl = "https://lavesh.app.n8n.cloud/webhook-test/06b8da13-4a71-41f6-92fe-7250320f8980";

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('n8nTheme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark');
    }

    // Load conversations
    const stored = localStorage.getItem('n8nConversations');
    if (stored) {
      setConversations(JSON.parse(stored));
    }

    // Check URL for conversation ID
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('n8nTheme', !isDarkTheme ? 'dark' : 'light');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) {
      localStorage.setItem('n8nConversations', '[]');
      setConversations([]);
      setCurrentMessages([]);
      setActiveConversationId(null);
    }
  };

  const loadConversation = (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setCurrentMessages([
        {
          type: 'prompt',
          content: conversation.prompt,
          timestamp: new Date(conversation.timestamp)
        },
        {
          type: 'response',
          content: conversation.response,
          timestamp: new Date(conversation.timestamp)
        }
      ]);
      setActiveConversationId(id);
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('conversation', id);
      window.history.replaceState({}, '', url);
    }
  };

  const saveConversation = (prompt: string, response: string) => {
    const newConversation = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      prompt,
      response,
      timestamp: new Date().toISOString()
    };

    const updatedConversations = [newConversation, ...conversations].slice(0, 30);
    setConversations(updatedConversations);
    localStorage.setItem('n8nConversations', JSON.stringify(updatedConversations));
    return newConversation;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    const timestamp = new Date();
    
    setCurrentMessages(prev => [...prev, {
      type: 'prompt',
      content: prompt.trim(),
      timestamp
    }]);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        body: prompt.trim(),
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
      const newMessage = {
        type: 'response' as const,
        content: textOutput,
        timestamp: new Date()
      };

      setCurrentMessages(prev => [...prev, newMessage]);
      
      const conversation = saveConversation(prompt.trim(), responseText);
      setActiveConversationId(conversation.id);
      
    } catch (error) {
      setCurrentMessages(prev => [...prev, {
        type: 'response',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex",
      isDarkTheme ? 'dark' : ''
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
        "transition-transform duration-300 ease-in-out",
        "fixed md:relative h-full z-10",
        isSidebarVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">n8n Agent</h1>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg md:hidden"
            >
              {isSidebarVisible ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-medium">Conversation History</h2>
          <button
            onClick={clearHistory}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 italic">
              No conversation history yet
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    activeConversationId === conv.id && "bg-gray-100 dark:bg-gray-700"
                  )}
                >
                  <div className="font-medium truncate">
                    {conv.prompt.length > 50 ? conv.prompt.substring(0, 50) + '...' : conv.prompt}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(conv.timestamp).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto p-4">
          {currentMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Welcome to n8n Agent Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask anything to get started, or select a previous conversation from the sidebar.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {currentMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg",
                    message.type === 'prompt'
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : "bg-white dark:bg-gray-800"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <span className="font-medium">
                      {message.type === 'prompt' ? 'You' : 'Agent'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {message.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
        >
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask something..."
                className={cn(
                  "w-full p-3 rounded-lg resize-none",
                  "bg-gray-50 dark:bg-gray-700",
                  "border border-gray-200 dark:border-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
                  "text-gray-900 dark:text-gray-100"
                )}
                rows={3}
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className={cn(
                  "absolute right-3 bottom-3",
                  "p-2 rounded-lg",
                  "bg-blue-600 hover:bg-blue-700",
                  "text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2"
                )}
              >
                <Send size={20} />
                <span>Send</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;