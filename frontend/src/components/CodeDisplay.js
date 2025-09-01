import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy, FiCheck } from 'react-icons/fi';
import './CodeDisplay.css';

const CodeDisplay = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="code-display">
      <div className="code-header">
        <span className="code-language">HTML</span>
        <button 
          onClick={handleCopy}
          disabled={!code}
          className={`copy-btn ${copied ? 'copied' : ''}`}
        >
          {copied ? <FiCheck /> : <FiCopy />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      <div className="code-content">
        {code ? (
          <SyntaxHighlighter 
            language="html" 
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '0 0 8px 8px',
              fontSize: '14px',
              maxWidth: '100%',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
            wrapLongLines={true}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <div className="empty-code">
            <p>No code generated yet. Start a conversation to generate an email template.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeDisplay;
