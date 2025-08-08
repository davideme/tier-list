import React from 'react';

const WelcomeMessage: React.FC = () => {
  return (
    <div className="tier-list-container">
      <div className="empty-state">
        <h2>Welcome to Tier List Creator! 🎯</h2>
        <p>Create a new tier list or select an existing one from the sidebar to start ranking items.</p>
        <p>✨ <strong>Features:</strong></p>
        <ul style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>Drag and drop items between tiers</li>
          <li>Add text and image items</li>
          <li>Customize tier labels and colors</li>
          <li>Export as images</li>
          <li>All data stored locally in your browser</li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeMessage;