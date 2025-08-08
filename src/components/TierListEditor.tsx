import React, { useState, useEffect } from 'react';
import type { TierList, TierListItem } from '../types';
import { generateId } from '../utils';

interface TierListEditorProps {
  tierList: TierList;
  onSave: (tierList: TierList) => void;
  onClose: () => void;
  onTierListChange: (tierList: TierList) => void;
  showStatus: (message: string, type: 'success' | 'error' | 'info') => void;
}

const TierListEditor: React.FC<TierListEditorProps> = ({
  tierList,
  onSave,
  onClose,
  onTierListChange,
  showStatus,
}) => {
  const [localTierList, setLocalTierList] = useState<TierList>(tierList);
  const [newItemText, setNewItemText] = useState('');

  // Update local state when tierList prop changes
  useEffect(() => {
    setLocalTierList(tierList);
  }, [tierList]);

  // Notify parent of changes
  useEffect(() => {
    onTierListChange(localTierList);
  }, [localTierList, onTierListChange]);

  const addTextItem = () => {
    const text = newItemText.trim();
    if (!text) {
      showStatus('Please enter text for the item', 'error');
      return;
    }

    const item: TierListItem = {
      id: generateId(),
      type: 'text',
      content: text
    };

    setLocalTierList(prev => ({
      ...prev,
      unrankedItems: [...prev.unrankedItems, item]
    }));

    setNewItemText('');
    showStatus('Text item added', 'success');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      const item: TierListItem = {
        id: generateId(),
        type: 'image',
        content: result,
        metadata: {
          originalFileName: file.name,
          uploadDate: new Date(),
          size: file.size
        }
      };

      setLocalTierList(prev => ({
        ...prev,
        unrankedItems: [...prev.unrankedItems, item]
      }));

      showStatus('Image item added', 'success');
    };

    reader.readAsDataURL(file);
    event.target.value = ''; // Reset file input
  };

  const deleteItem = (itemId: string) => {
    setLocalTierList(prev => ({
      ...prev,
      unrankedItems: prev.unrankedItems.filter(item => item.id !== itemId),
      tiers: prev.tiers.map(tier => ({
        ...tier,
        items: tier.items.filter(item => item.id !== itemId)
      }))
    }));

    showStatus('Item deleted', 'success');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      addTextItem();
    }
  };

  const handleSave = () => {
    onSave(localTierList);
  };

  const exportTierListImage = () => {
    showStatus('Image export feature coming soon!', 'info');
  };

  return (
    <div className="tier-list-container">
      <div className="tier-list-header">
        <h2 className="tier-list-title">{localTierList.title}</h2>
        <div className="tier-controls">
          <button onClick={handleSave}>💾 Save</button>
          <button onClick={exportTierListImage} className="secondary">📷 Export Image</button>
          <button onClick={onClose} className="danger">✕ Close</button>
        </div>
      </div>
      
      {/* Add Items Controls */}
      <div className="add-item-controls">
        <input
          type="text"
          className="add-item-input"
          placeholder="Add text item..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={addTextItem}>Add Text</button>
        <div className="file-input-wrapper">
          <button type="button">Add Image</button>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ position: 'absolute', left: '-9999px' }}
          />
        </div>
      </div>
      
      {/* Tier Rows */}
      <div id="tierRows">
        {localTierList.tiers.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            onDeleteItem={deleteItem}
          />
        ))}
      </div>
      
      {/* Unranked Items Area */}
      <div className="unranked-area">
        <div className="unranked-header">
          <span>📦 Unranked Items</span>
          <span>{localTierList.unrankedItems.length} item{localTierList.unrankedItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="unranked-content">
          {localTierList.unrankedItems.length === 0 ? (
            <div className="empty-state">Drag items here or add new items above</div>
          ) : (
            localTierList.unrankedItems.map((item) => (
              <TierItem
                key={item.id}
                item={item}
                onDelete={deleteItem}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface TierRowProps {
  tier: any;
  onDeleteItem: (itemId: string) => void;
}

const TierRow: React.FC<TierRowProps> = ({ tier, onDeleteItem }) => {
  const editTierLabel = () => {
    const newLabel = prompt(`Enter new label for tier ${tier.label}:`, tier.label);
    if (newLabel && newLabel.trim()) {
      // This would need to be implemented with proper state management
      console.log('Edit tier label:', newLabel);
    }
  };

  const getTierClass = (label: string) => {
    return `tier-${label.toLowerCase()}`;
  };

  return (
    <div className="tier-row" data-tier={tier.label}>
      <div 
        className={`tier-label ${getTierClass(tier.label)}`}
        onClick={editTierLabel}
      >
        {tier.label}
      </div>
      <div className="tier-content">
        {tier.items.map((item: any) => (
          <TierItem
            key={item.id}
            item={item}
            onDelete={onDeleteItem}
          />
        ))}
      </div>
    </div>
  );
};

interface TierItemProps {
  item: TierListItem;
  onDelete: (itemId: string) => void;
}

const TierItem: React.FC<TierItemProps> = ({ item, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const itemStyle = item.type === 'image' 
    ? { backgroundImage: `url(${item.content})` }
    : {};

  return (
    <div 
      className={`tier-item ${item.type}`}
      draggable
      data-item-id={item.id}
      style={itemStyle}
    >
      {item.type === 'text' && item.content}
      <div className="item-controls">
        <button 
          className="item-delete"
          onClick={handleDelete}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default TierListEditor;