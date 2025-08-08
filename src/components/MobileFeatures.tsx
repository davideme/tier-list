import React from 'react';

const MobileFeatures: React.FC = () => {
  return (
    <>
      {/* Mobile hamburger menu */}
      <button className="mobile-menu-toggle" id="mobileMenuToggle">
        ☰
      </button>
      
      {/* Mobile overlay */}
      <div className="mobile-overlay" id="mobileOverlay"></div>
      
      {/* Floating Action Button */}
      <div className="fab-container" id="fabContainer" role="toolbar" aria-label="Tier list actions">
        <button className="fab-main" id="fabMain" aria-label="Open actions menu" aria-expanded="false" aria-haspopup="true">+</button>
        <div className="fab-menu" id="fabMenu" role="menu" aria-label="Action menu">
          <button className="fab-item" data-action="add-text" role="menuitem" aria-label="Add text item">📝 Add Text</button>
          <button className="fab-item" data-action="add-image" role="menuitem" aria-label="Add image item">🖼️ Add Image</button>
          <button className="fab-item" data-action="save" role="menuitem" aria-label="Save tier list">💾 Save</button>
          <button className="fab-item" data-action="export" role="menuitem" aria-label="Export tier list as image">📤 Export</button>
        </div>
      </div>
      
      {/* Mobile tier selection modal */}
      <div className="mobile-tier-modal" id="mobileTierModal">
        <div className="modal-header">Move item to tier</div>
        <div className="tier-buttons">
          <button className="tier-button tier-s" data-tier="S">S</button>
          <button className="tier-button tier-a" data-tier="A">A</button>
          <button className="tier-button tier-b" data-tier="B">B</button>
          <button className="tier-button tier-c" data-tier="C">C</button>
          <button className="tier-button tier-d" data-tier="D">D</button>
          <button className="tier-button unranked" data-tier="unranked">Unranked</button>
        </div>
        <div className="modal-actions">
          <button className="modal-cancel" id="modalCancel">Cancel</button>
          <button className="modal-delete" id="modalDelete">Delete Item</button>
        </div>
      </div>

      {/* Mobile tier tabs navigation */}
      <div className="tier-tabs" id="tierTabs">
        <div className="tier-tab active" data-tier="S">S</div>
        <div className="tier-tab" data-tier="A">A</div>
        <div className="tier-tab" data-tier="B">B</div>
        <div className="tier-tab" data-tier="C">C</div>
        <div className="tier-tab" data-tier="D">D</div>
        <div className="tier-tab" data-tier="unranked">Unranked</div>
      </div>
    </>
  );
};

export default MobileFeatures;