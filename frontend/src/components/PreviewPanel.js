import React from 'react';
import './PreviewPanel.css';

const PreviewPanel = ({ html }) => {
  return (
    <div className="preview-container">
      {html ? (
        <iframe
          title="Email Preview"
          srcDoc={html}
          className="preview-iframe"
          sandbox="allow-same-origin"
        />
      ) : (
        <div className="empty-preview">
          <p>Preview will appear here once you generate an email template.</p>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
