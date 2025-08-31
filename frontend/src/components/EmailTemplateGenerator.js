import React, { useState } from 'react';
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

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      setIsApiKeySet(true);
      setMessages([{
        type: 'system',
        content: 'API Key set successfully! You can now generate email templates.'
      }]);
    }
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

    try {
      // Add a loading message
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Generating email template...'
      }]);

      const response = await axios.post('/api/generate-template', {
        prompt,
        apiKey: apiKey
      });

      const assistantMessage = {
        type: 'assistant',
        content: 'Email template generated successfully!'
      };

      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
      setGeneratedHtml(response.data.html);
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), {
        type: 'error',
        content: 'Error generating template. Please check your API key and try again.'
      }]);
    } finally {
      setIsLoading(false);
      // Clear input only if we sent the current input
      if (!promptOverride) setInputMessage('');
    }
  };

  const handleQuickPrompt = (text) => {
    setInputMessage(text);
    // Defer send to allow state to update (optional)
    setTimeout(() => handleSendMessage(text), 0);
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
                  <div className="empty-title">Describe the email you need</div>
                  <div className="chips">
                    <button className="chip" onClick={() => handleQuickPrompt('Create a sleek product launch email for our new feature. Include a hero section, 3 benefits, a CTA button, and a footer with social links.')}>Product launch</button>
                    <button className="chip" onClick={() => handleQuickPrompt('Write a clean newsletter email. Include a header, 2 article cards with images, a featured section, and an unsubscribe footer.')}>Newsletter</button>
                    <button className="chip" onClick={() => handleQuickPrompt('Craft a professional cold outreach email to book a demo. Keep it concise, personalized placeholders, and add a CTA button.')}>Cold outreach</button>
                  </div>
                  <div className="hints">Press Enter to send • Shift+Enter for newline</div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`message ${message.type}`}>
                    <div className="message-content">
                      {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="chat-input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe the email template you want to generate..."
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
