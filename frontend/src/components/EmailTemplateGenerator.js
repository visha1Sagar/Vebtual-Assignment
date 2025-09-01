import React, { useState, useEffect, useRef } from 'react';
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
  const [conversationStep, setConversationStep] = useState('');
  const [conversationContext, setConversationContext] = useState({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Show welcome message when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{
        type: 'assistant',
        content: '👋 Welcome to Email Template Generator! How can I assist you today?'
      }]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      setIsApiKeySet(true);
      setConversationStep('initial');
      
      // Add initial system message
      setMessages([{
        type: 'system',
        content: 'API Key set successfully! Let\'s create your perfect email template.'
      }]);
      
      // Start the guided conversation
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'Hi! I\'m ready to help you create an amazing email template. Let\'s start by gathering some details about what you need.'
        }]);
        
        // Automatically trigger the detail collection
        setTimeout(() => {
          handleApiChat('start', 'collect_details');
        }, 1000);
      }, 500);
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

  // New function to handle API-based conversation flow
  const handleApiChat = async (message = '', step = '') => {
    return handleApiChatWithContext(message, step, conversationContext);
  };

  // Function to handle API chat with explicit context
  const handleApiChatWithContext = async (message = '', step = '', context = {}) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: message,
        apiKey: apiKey,
        step: step,
        conversation_context: context
      });

      // Add assistant response
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: response.data.message
      }]);

      // Handle different response types
      if (response.data.questions) {
        // Show detailed questions for template creation
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'questions',
            content: response.data.questions
          }]);
          setConversationStep('answering_details');
        }, 500);
      } else if (response.data.show_tone_options) {
        // Show tone options
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'options',
            content: 'tone-options'
          }]);
        }, 500);
      } else if (response.data.html) {
        // Display generated HTML template
        setGeneratedHtml(response.data.html);
        setConversationStep('complete');
      }

      // Update conversation step
      if (response.data.next_step) {
        setConversationStep(response.data.next_step);
      }

    } catch (error) {
      console.error('API Chat error:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: error.response?.data?.detail || 'Error communicating with the API. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (promptOverride) => {
    // Handle case where promptOverride might be an event object
    let prompt;
    if (typeof promptOverride === 'string') {
      prompt = promptOverride.trim();
    } else {
      prompt = inputMessage.trim();
    }
    
    if (!prompt) return;

    const userMessage = {
      type: 'user',
      content: prompt
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Clear input right away
    if (!promptOverride) setInputMessage('');

    try {
      // WITH API KEY FLOW - Use guided conversation
      if (isApiKeySet) {
        
        if (conversationStep === 'answering_details') {
          // Parse the user's answers to detailed questions
          const answers = prompt.split('\n').map(line => line.trim()).filter(line => line);
          
          // Extract information from answers (simple keyword matching)
          const context = {};
          answers.forEach(answer => {
            const lowerAnswer = answer.toLowerCase();
            
            // Extract tone
            if (lowerAnswer.includes('professional') || lowerAnswer.includes('formal')) {
              context.tone = 'professional';
            } else if (lowerAnswer.includes('friendly') || lowerAnswer.includes('casual')) {
              context.tone = 'friendly';
            } else if (lowerAnswer.includes('persuasive') || lowerAnswer.includes('sales')) {
              context.tone = 'persuasive';
            } else if (lowerAnswer.includes('urgent') || lowerAnswer.includes('limited')) {
              context.tone = 'urgent';
            } else if (lowerAnswer.includes('informative') || lowerAnswer.includes('educational')) {
              context.tone = 'informative';
            }
            
            // Extract audience
            if (lowerAnswer.includes('customer') || lowerAnswer.includes('client')) {
              context.audience = 'customers';
            } else if (lowerAnswer.includes('prospect') || lowerAnswer.includes('lead')) {
              context.audience = 'prospects';
            } else if (lowerAnswer.includes('vip') || lowerAnswer.includes('premium')) {
              context.audience = 'VIP clients';
            }
            
            // Extract purpose
            if (lowerAnswer.includes('promotion') || lowerAnswer.includes('sale')) {
              context.purpose = 'product promotion';
            } else if (lowerAnswer.includes('newsletter') || lowerAnswer.includes('update')) {
              context.purpose = 'newsletter';
            } else if (lowerAnswer.includes('announcement') || lowerAnswer.includes('news')) {
              context.purpose = 'announcement';
            }
            
            // Extract style
            if (lowerAnswer.includes('modern') || lowerAnswer.includes('clean')) {
              context.style = 'clean and modern';
            } else if (lowerAnswer.includes('bold') || lowerAnswer.includes('vibrant')) {
              context.style = 'bold and vibrant';
            } else if (lowerAnswer.includes('minimal') || lowerAnswer.includes('simple')) {
              context.style = 'minimal and simple';
            }
          });
          
          // Set defaults if not specified
          if (!context.tone) context.tone = 'professional';
          if (!context.audience) context.audience = 'customers';
          if (!context.purpose) context.purpose = 'product promotion';
          if (!context.style) context.style = 'clean and modern';
          
          setConversationContext(context);
          
          // Move to URL collection step - pass the context directly
          setTimeout(() => {
            handleApiChatWithContext(prompt, 'collect_urls', context);
          }, 500);
          
        } else if (conversationStep === 'collect_urls') {
          // User provided product URLs
          const updatedContext = {...conversationContext, urls: prompt};
          setConversationContext(updatedContext);
          handleApiChatWithContext(prompt, 'generate_template', updatedContext);
          
        } else {
          // Initial or general message
          handleApiChat(prompt, conversationStep || '');
        }
        
        setIsLoading(false);
        return;
      }
      
      // NO API KEY FLOW - Step by step guided conversation (existing logic)
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
        
        // Step 3: User provides product URLs - Fetch product info and generate template
        // After all previous + product_url_question(6) + user_url_response(7) = 7 messages
        if (messages.length === 6) {
          console.log('Triggering Step 3: Processing product URLs and generating template');
          
          // Extract URLs from the user's message
          const urls = prompt.split('\n').map(url => url.trim()).filter(url => url.length > 0);
          console.log('Extracted URLs:', urls);
          
          // Show processing message
          setTimeout(() => {
            setMessages(prev => {
              const withoutLoading = prev.filter(msg => 
                msg.type !== 'assistant' || msg.content !== 'Processing your request...'
              );
              
              return [...withoutLoading, {
                type: 'assistant',
                content: 'Great! Let me fetch the product information and generate your email template...'
              }];
            });
          }, 500);
          
          // Fetch product information for each URL
          try {
            const productPromises = urls.map(async (url) => {
              try {
                const response = await axios.get(`http://localhost:8000/fetch_info?url=${encodeURIComponent(url)}`);
                return {
                  url: url,
                  title: response.data.title,
                  image: response.data.image,
                  price: response.data.price
                };
              } catch (error) {
                console.error(`Error fetching info for ${url}:`, error);
                return {
                  url: url,
                  title: 'Product Title',
                  image: 'placeholder.jpg',
                  price: 'N/A'
                };
              }
            });
            
            const products = await Promise.all(productPromises);
            console.log('Fetched product data:', products);
            
            // Get the selected tone from previous messages
            const toneMessage = messages.find(msg => 
              msg.type === 'user' && 
              (msg.content.includes('tone') || msg.content.includes('Professional') || msg.content.includes('Friendly') || 
               msg.content.includes('Persuasive') || msg.content.includes('Urgent') || msg.content.includes('Informative'))
            );
            const selectedTone = toneMessage ? toneMessage.content.toLowerCase() : 'professional';
            
            // Generate email template based on tone
            const htmlTemplate = generateEmailTemplate(products, selectedTone);
            
            // Update the generated HTML
            setGeneratedHtml(htmlTemplate);
            
            // Show completion message
            setTimeout(() => {
              setMessages(prev => [...prev, {
                type: 'assistant',
                content: 'Perfect! I\'ve generated your email template with the product information. You can see the HTML code and preview on the right. The template is ready to use!'
              }]);
            }, 1000);
            
          } catch (error) {
            console.error('Error processing product URLs:', error);
            setTimeout(() => {
              setMessages(prev => [...prev, {
                type: 'error',
                content: 'There was an error fetching product information. Please check your URLs and try again.'
              }]);
            }, 500);
          }
          
          setIsLoading(false);
          return;
        }

        console.log('No step matched for message count:', messages.length);
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

  // Function to generate email template based on products and tone
  const generateEmailTemplate = (products, tone) => {
    let greeting = '';
    let closing = '';
    let style = '';
    
    // Set tone-specific content
    if (tone.includes('professional')) {
      greeting = 'Dear Valued Customer,';
      closing = 'Best regards,<br>The Team';
      style = 'color: #333; font-family: Arial, sans-serif;';
    } else if (tone.includes('friendly')) {
      greeting = 'Hi there! 👋';
      closing = 'Cheers,<br>Your Friends at Our Store! 😊';
      style = 'color: #444; font-family: "Comic Sans MS", cursive;';
    } else if (tone.includes('persuasive')) {
      greeting = 'Don\'t Miss Out!';
      closing = 'Act Now!<br>Limited Time Offer Team';
      style = 'color: #d73527; font-family: Impact, Arial, sans-serif; font-weight: bold;';
    } else if (tone.includes('urgent')) {
      greeting = '⚡ URGENT: Limited Time Only! ⚡';
      closing = 'Hurry - Offer Expires Soon!<br>Sales Team';
      style = 'color: #ff0000; font-family: Arial, sans-serif; font-weight: bold;';
    } else if (tone.includes('informative')) {
      greeting = 'Product Information Update';
      closing = 'For more information, contact us.<br>Customer Service Team';
      style = 'color: #2c3e50; font-family: Georgia, serif;';
    } else {
      greeting = 'Hello,';
      closing = 'Thank you,<br>The Team';
      style = 'color: #333; font-family: Arial, sans-serif;';
    }
    
    // Generate product cards HTML
    const productCards = products.map(product => `
      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; background: #fff;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <img src="${product.image}" alt="${product.title}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px;" />
          <div style="flex: 1;">
            <h3 style="margin: 0 0 10px 0; ${style}">${product.title}</h3>
            <p style="font-size: 24px; font-weight: bold; color: #e74c3c; margin: 10px 0;">
              ${product.price}
            </p>
            <a href="${product.url}" style="display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Product
            </a>
          </div>
        </div>
      </div>
    `).join('');
    
    // Complete email template
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px;">
    <header style="text-align: center; padding: 20px 0; border-bottom: 2px solid #eee;">
      <h1 style="${style} margin: 0;">${greeting}</h1>
    </header>
    
    <main style="padding: 30px 0;">
      <p style="${style} font-size: 16px; line-height: 1.6;">
        We're excited to share these amazing products with you!
      </p>
      
      ${productCards}
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="${style} font-size: 16px;">
          ${tone.includes('urgent') ? 'Don\'t wait - these deals won\'t last long!' : 
            tone.includes('persuasive') ? 'These exclusive offers are waiting for you!' :
            'Thank you for being a valued customer.'}
        </p>
      </div>
    </main>
    
    <footer style="text-align: center; padding: 20px 0; border-top: 2px solid #eee; margin-top: 20px;">
      <p style="${style} margin: 0;">${closing}</p>
    </footer>
  </div>
</body>
</html>`;
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
          return "https://example.com/product1\nhttps://example.com/product2\nhttps://example.com/product3";
        }
      }
      return "Tell me about the email template you need...";
    } else {
      // With API key - different placeholders based on conversation step
      if (conversationStep === 'answering_details') {
        return "1. Professional tone\n2. Existing customers\n3. Product promotion\n4. Clean and modern style";
      } else if (conversationStep === 'collect_urls') {
        return "https://example.com/product1\nhttps://example.com/product2\nhttps://example.com/product3";
      } else if (conversationStep === 'complete') {
        return "Your template is ready! Ask me to make any changes...";
      }
      return "Let me know what you need help with...";
    }
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
            
            <div className="messages-container" ref={messagesContainerRef}>
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
                    ) : message.type === 'questions' ? (
                      <div className="detailed-questions">
                        <div className="questions-list">
                          {Array.isArray(message.content) ? message.content.map((question, qIndex) => (
                            <div key={qIndex} className="question-item">
                              <span className="question-number">{qIndex + 1}.</span>
                              <span className="question-text">{question}</span>
                            </div>
                          )) : (
                            <div className="question-item">
                              <span className="question-text">{message.content}</span>
                            </div>
                          )}
                        </div>
                        <div className="questions-hint">
                          <small>Please answer in a single response.</small>
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
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholderText()}
                disabled={isLoading}
                className="chat-input"
              />
              <button 
                onClick={() => handleSendMessage()}
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
