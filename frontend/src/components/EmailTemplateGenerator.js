import React, { useState, useEffect } from 'react';
import { FiKey, FiMessageSquare, FiCode, FiEye, FiCopy, FiSend } from 'react-icons/fi';
import axios from 'axios';
import CodeDisplay from './CodeDisplay';
import PreviewPanel from './PreviewPanel';
import './EmailTemplateGenerator.css';

const EmailTemplateGenerator = () => {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Show welcome message when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{
        type: 'assistant',
        content: '👋 Welcome to Email Template Generator! I can help you create professional email templates. To get started, please tell me a bit about the email you want to create or what type of business you\'re in.'
      }]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      setIsApiKeySet(true);
      
      // Add initial system message
      setMessages([{
        type: 'system',
        content: 'API Key set successfully! You can now generate email templates.'
      }]);
      
      // If we already have conversation history with product details, don't restart the flow
      if (messages.length >= 5) {
        // Keep the existing conversation and just add a system message
        setMessages(prev => [...prev, {
          type: 'system',
          content: 'You can now send a detailed request to generate your email template.'
        }]);
      } 
      // If we're starting fresh, guide through tone selection
      else {
        // Ask for tone after a short delay
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'assistant',
            content: 'What tone would you prefer for your email template?'
          }]);
          
          // Show tone options immediately
          setTimeout(() => {
            setMessages(prev => [...prev, {
              type: 'options',
              content: 'tone-options'
            }]);
          }, 500);
        }, 1000);
      }
    }
  };

  const askForTone = () => {
    setMessages(prev => [...prev, {
      type: 'assistant',
      content: 'What tone would you prefer for your email template?'
    }]);
  };

  const askForProductLinks = () => {
    setMessages(prev => [...prev, {
      type: 'assistant',
      content: 'Now, please add product links (one per line or comma-separated):'
    }]);
  };

  const handleSendMessage = async (promptOverride) => {
    const prompt = (promptOverride ?? inputMessage).trim();
    if (!prompt) return;

    const userMessage = {
      type: 'user',
      content: prompt
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Clear input right away
    if (!promptOverride) setInputMessage('');

    console.log('Message count when sending:', messages.length + 1); // +1 for the user message we just added
    console.log('Current messages:', messages.map(m => ({ type: m.type, content: m.content.substring(0, 50) })));

    try {
      // NO API KEY FLOW - Step by step guided conversation
      if (!isApiKeySet) {
        // Step 1: User's first message after greeting - Ask for tone
        if (messages.length === 1) {
          console.log('Triggering Step 1: Ask for tone');
          // Remove loading message and add response
          setTimeout(() => {
            setMessages(prev => {
              // Find the last message (which should be the loading message)
              const withoutLoading = prev.filter(msg => 
                msg.type !== 'assistant' || msg.content !== 'Processing your request...'
              );
              
              // Add our new response
              return [...withoutLoading, {
                type: 'assistant',
                content: 'Thank you for sharing that! Now, what tone would you prefer for your email template?'
              }];
            });
            
            // Show tone options after a brief delay
            setTimeout(() => {
              setMessages(prev => [...prev, {
                type: 'options',
                content: 'tone-options'
              }]);
            }, 500);
          }, 500);
          
          setIsLoading(false);
          return;
        }
        
        // Step 2: User selects tone - Ask for product URL
        // After greeting(1) + user_response(2) + tone_question(3) + tone_options(4) + user_tone_selection(5) = 5 messages
        if (messages.length === 4) {
          console.log('Triggering Step 2: Ask for product URL');
          // Remove loading message and add response
          setTimeout(() => {
            setMessages(prev => {
              // Find the last message (which should be the loading message)
              const withoutLoading = prev.filter(msg => 
                msg.type !== 'assistant' || msg.content !== 'Processing your request...'
              );
              
              // Add our new response
              return [...withoutLoading, {
                type: 'assistant',
                content: `Perfect! I'll use a ${prompt} tone for your email. Now, please enter the product URLs that you'd like to feature in your email template (one URL per line):`
              }];
            });
          }, 500);
          
          setIsLoading(false);
          return;
        }
        
        // Step 3: User provides product URL - Thank user and prompt for API key
        // After all previous + product_url_question(6) + user_url_response(7) = 7 messages
        if (messages.length === 6) {
          console.log('Triggering Step 3: Ask for API key');
          // Remove loading message and add response
          setTimeout(() => {
            setMessages(prev => {
              // Find the last message (which should be the loading message)
              const withoutLoading = prev.filter(msg => 
                msg.type !== 'assistant' || msg.content !== 'Processing your request...'
              );
              
              // Add our new response
              return [...withoutLoading, {
                type: 'assistant',
                content: 'Excellent! I have all the information needed to create your email template. To generate the actual template, please enter your OpenAI API key in the field above and then I can create your professional email template.'
              }];
            });
          }, 500);
          
          setIsLoading(false);
          return;
        }

        console.log('No step matched for message count:', messages.length);
      }
      
      // WITH API KEY FLOW - Use backend API
      else {
        // Add loading message
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'Processing your request...'
        }]);
        
        try {
          // Check if backend is available first
          try {
            await axios.get('http://localhost:8000/reply');
          } catch (backendError) {
            console.error("Backend connection error:", backendError);
            setMessages(prev => [...prev.slice(0, -1), {
              type: 'error',
              content: 'Error: Cannot connect to backend server. Please ensure the backend is running on port 8000.'
            }]);
            setIsLoading(false);
            return;
          }
          
          // Backend is available, now send the actual request
          const response = await axios.post('http://localhost:8000/chat', {
            message: prompt,
            apiKey: apiKey
          });

          const assistantMessage = {
            type: 'assistant',
            content: response.data.message || 'Email template generated successfully!'
          };

          setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
          if (response.data.html) {
            setGeneratedHtml(response.data.html);
          }
        } catch (apiError) {
          console.error("API error:", apiError);
          setMessages(prev => [...prev.slice(0, -1), {
            type: 'error',
            content: 'Error connecting to the API. Please check that the backend server is running.'
          }]);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessages(prev => {
        // Find the last message (which should be the loading message)
        const withoutLoading = prev.filter(msg => 
          msg.type !== 'assistant' || msg.content !== 'Processing your request...'
        );
        
        // Add error message
        return [...withoutLoading, {
          type: 'error',
          content: 'Something went wrong. Please try again.'
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (text) => {
    // Put the selected tone in the input box instead of sending automatically
    setInputMessage(text);
  };

  // Function to get appropriate placeholder text based on conversation state
  const getPlaceholderText = () => {
    if (!isApiKeySet) {
      // Check if we're waiting for product URLs
      if (messages.length >= 4) {
        // Check if the last assistant message asks for product URL
        const lastAssistantMessage = messages.slice().reverse().find(m => m.type === 'assistant');
        if (lastAssistantMessage && lastAssistantMessage.content.includes('product URL')) {
          return "Product link 1\nProduct link 2\nProduct link 3\n...";
        }
      }
      return "";
    }
    return "";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="email-generator">
      <header className="header">
        <div className="header-left">
          <h1>Email Template Generator</h1>
        </div>
        
        {/* API Key Section - only show when not set */}
        {!isApiKeySet && (
          <div className="input-group">
            <FiKey className="input-icon" />
            <input
              type="password"
              placeholder="Enter your OpenAI API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isApiKeySet}
              className="api-key-input"
            />
            <button 
              onClick={handleSetApiKey}
              disabled={isApiKeySet || !apiKey.trim()}
              className="set-key-btn"
            >
              {isApiKeySet ? 'Set' : 'Set Key'}
            </button>
          </div>
        )}
      </header>

      <div className="main-content">
        <div className="content-grid">
          {/* Chat Panel */}
          <div className="chat-panel">
            <div className="panel-header">
              <FiMessageSquare />
              <h3>Chat</h3>
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-title">Start your conversation</div>
                  <div className="hints">Press Enter to send • Shift+Enter for newline</div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`message ${message.type}`}>
                    {message.type === 'options' && message.content === 'tone-options' ? (
                      <div className="tone-options">
                        <div className="chips">
                          <button className="chip" onClick={() => handleQuickPrompt('Professional tone')}>Professional</button>
                          <button className="chip" onClick={() => handleQuickPrompt('Friendly tone')}>Friendly</button>
                          <button className="chip" onClick={() => handleQuickPrompt('Persuasive tone')}>Persuasive</button>
                          <button className="chip" onClick={() => handleQuickPrompt('Urgent tone')}>Urgent</button>
                          <button className="chip" onClick={() => handleQuickPrompt('Informative tone')}>Informative</button>
                        </div>
                      </div>
                    ) : (
                      <div className="message-content">
                        {message.content}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="chat-input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholderText()}
                disabled={isLoading}
                className="chat-input"
                rows="3"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="send-btn"
              >
                <FiSend />
              </button>
            </div>
          </div>

          {/* HTML Code Panel */}
          <div className="code-panel">
            <div className="panel-header">
              <FiCode />
              <h3>Generated HTML</h3>
            </div>
            <CodeDisplay code={generatedHtml || ""} />
          </div>

          {/* Preview Panel */}
          <div className="preview-panel">
            <div className="panel-header">
              <FiEye />
              <h3>Preview</h3>
            </div>
            <PreviewPanel html={generatedHtml || ""} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateGenerator;
