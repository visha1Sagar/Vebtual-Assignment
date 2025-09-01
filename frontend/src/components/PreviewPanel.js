import React from 'react';
import './PreviewPanel.css';

const PreviewPanel = ({ html, isStreaming = false }) => {
  return (
    <div className="preview-container">
      {html ? (
        <div className="preview-wrapper">
          {isStreaming && (
            <div className="streaming-banner">
              <div className="streaming-indicator-preview"></div>
              <span>Live Preview - Updating in real-time...</span>
            </div>
          )}
          <iframe
            title="Email Preview"
            srcDoc={html}
            className={`preview-iframe ${isStreaming ? 'streaming' : ''}`}
            sandbox="allow-same-origin"
          />
        </div>
      ) : (
        <div className="empty-preview">
          {isStreaming ? (
            <div className="streaming-preview-placeholder">
              <div className="streaming-dots-preview"></div>
              <p>Generating preview...</p>
            </div>
          ) : (
            <p>Preview will appear here once you generate an email template.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
