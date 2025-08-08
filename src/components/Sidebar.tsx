import React, { useState } from 'react';
import type { TierListSummary } from '../types';

interface SidebarProps {
  tierLists: TierListSummary[];
  onCreateTierList: (title: string, description?: string) => void;
  onViewTierList: (id: string) => void;
  onDuplicateTierList: (id: string) => void;
  onExportTierList: (id: string) => void;
  onDeleteTierList: (id: string) => void;
  onExportAllData: () => void;
  onImportData: (file: File) => void;
  onShowStorageInfo: () => void;
  onRefresh: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  tierLists,
  onCreateTierList,
  onViewTierList,
  onDuplicateTierList,
  onExportTierList,
  onDeleteTierList,
  onExportAllData,
  onImportData,
  onShowStorageInfo,
  onRefresh,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTierList = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your tier list');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateTierList(title.trim(), description.trim() || undefined);
      setTitle('');
      setDescription('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportData(file);
      event.target.value = ''; // Reset file input
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleCreateTierList();
    }
  };

  return (
    <div className="sidebar">
      {/* Create New Tier List Section */}
      <div className="section">
        <h3>Create New Tier List</h3>
        <div className="form-group">
          <label htmlFor="tierListTitle">Title:</label>
          <input
            type="text"
            id="tierListTitle"
            placeholder="Enter tier list title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <div className="form-group">
          <label htmlFor="tierListDescription">Description:</label>
          <textarea
            id="tierListDescription"
            rows={3}
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button 
          onClick={handleCreateTierList}
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Tier List'}
        </button>
      </div>

      {/* App Controls Section */}
      <div className="section">
        <h3>Application Controls</h3>
        <button onClick={onExportAllData} className="secondary">Export All Data</button>
        <label htmlFor="importFile">
          <button type="button" className="secondary">Import Data</button>
          <input
            type="file"
            id="importFile"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </label>
        <button onClick={onShowStorageInfo} className="secondary">Storage Info</button>
        <button onClick={onRefresh} className="secondary">Refresh</button>
      </div>

      {/* Existing Tier Lists Section */}
      <div className="section">
        <h3>Your Tier Lists</h3>
        <div id="tierListsContainer">
          {tierLists.length === 0 ? (
            <div className="empty-state">
              <h3>No tier lists yet</h3>
              <p>Create your first tier list using the form above!</p>
            </div>
          ) : (
            <div className="tier-list-grid">
              {tierLists.map((tierList) => (
                <TierListCard
                  key={tierList.id}
                  tierList={tierList}
                  onView={onViewTierList}
                  onDuplicate={onDuplicateTierList}
                  onExport={onExportTierList}
                  onDelete={onDeleteTierList}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TierListCardProps {
  tierList: TierListSummary;
  onView: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}

const TierListCard: React.FC<TierListCardProps> = ({
  tierList,
  onView,
  onDuplicate,
  onExport,
  onDelete,
}) => {
  const createdDate = new Date(tierList.createdAt).toLocaleDateString();
  const updatedDate = new Date(tierList.updatedAt).toLocaleDateString();

  return (
    <div className="tier-list-card">
      <h3>{tierList.title}</h3>
      <p>
        <strong>Items:</strong> {tierList.itemCount}<br />
        <strong>Created:</strong> {createdDate}<br />
        <strong>Updated:</strong> {updatedDate}
      </p>
      <div className="tier-list-actions">
        <button className="view-btn" onClick={() => onView(tierList.id)}>
          View
        </button>
        <button className="duplicate-btn" onClick={() => onDuplicate(tierList.id)}>
          Duplicate
        </button>
        <button className="export-btn" onClick={() => onExport(tierList.id)}>
          Export
        </button>
        <button className="delete-btn" onClick={() => onDelete(tierList.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default Sidebar;