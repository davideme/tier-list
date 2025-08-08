import React, { useState, useEffect } from 'react';
import { TierListApp } from './TierListApp';
import type { TierList, TierListSummary } from './types';

// Import components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TierListEditor from './components/TierListEditor';
import WelcomeMessage from './components/WelcomeMessage';
import StatusMessage from './components/StatusMessage';
import MobileFeatures from './components/MobileFeatures';

const App: React.FC = () => {
  const [app, setApp] = useState<TierListApp | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTierList, setCurrentTierList] = useState<TierList | null>(null);
  const [tierLists, setTierLists] = useState<TierListSummary[]>([]);
  const [status, setStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  // Initialize the application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        showStatus('Initializing application...', 'info');
        const tierListApp = new TierListApp();
        await tierListApp.initialize();
        setApp(tierListApp);
        setIsInitialized(true);
        showStatus('Application initialized successfully!', 'success');
        await loadTierLists(tierListApp);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        showStatus(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    };

    initializeApp();
  }, []);

  const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatus({ message, type, visible: true });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setStatus(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const loadTierLists = async (tierListApp?: TierListApp) => {
    const appInstance = tierListApp || app;
    if (!appInstance || !isInitialized) return;
    
    try {
      const lists = await appInstance.listTierLists();
      setTierLists(lists);
    } catch (error) {
      console.error('Failed to load tier lists:', error);
      showStatus(`Failed to load tier lists: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const createTierList = async (title: string, description?: string) => {
    if (!app || !isInitialized) return;
    
    try {
      const tierList = await app.createTierList(title, description);
      showStatus(`Tier list "${title}" created successfully!`, 'success');
      await loadTierLists();
      // Automatically open the new tier list for editing
      await viewTierList(tierList.id);
    } catch (error) {
      console.error('Failed to create tier list:', error);
      showStatus(`Failed to create tier list: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const viewTierList = async (id: string) => {
    if (!app) return;
    
    try {
      const tierList = await app.loadTierList(id);
      if (tierList) {
        setCurrentTierList(tierList);
        showStatus(`Editing tier list: ${tierList.title}`, 'info');
      } else {
        showStatus('Tier list not found', 'error');
      }
    } catch (error) {
      console.error('Failed to view tier list:', error);
      showStatus(`Failed to view tier list: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const closeTierListEditor = () => {
    setCurrentTierList(null);
  };

  const saveTierList = async (tierList: TierList) => {
    if (!app) return;
    
    try {
      await app.updateTierList(tierList);
      showStatus('Tier list saved successfully', 'success');
      await loadTierLists();
    } catch (error) {
      console.error('Failed to save tier list:', error);
      showStatus('Failed to save tier list', 'error');
    }
  };

  const deleteTierList = async (id: string) => {
    if (!app) return;
    
    if (!window.confirm('Are you sure you want to delete this tier list? This action cannot be undone.')) {
      return;
    }
    
    try {
      await app.deleteTierList(id);
      showStatus('Tier list deleted successfully', 'success');
      await loadTierLists();
      
      // Close editor if the deleted tier list is currently open
      if (currentTierList && currentTierList.id === id) {
        closeTierListEditor();
      }
    } catch (error) {
      console.error('Failed to delete tier list:', error);
      showStatus(`Failed to delete tier list: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const duplicateTierList = async (id: string) => {
    if (!app) return;
    
    try {
      const duplicated = await app.duplicateTierList(id);
      showStatus(`Tier list duplicated as "${duplicated.title}"`, 'success');
      await loadTierLists();
    } catch (error) {
      console.error('Failed to duplicate tier list:', error);
      showStatus(`Failed to duplicate tier list: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const exportTierList = async (id: string) => {
    if (!app) return;
    
    try {
      const tierList = await app.loadTierList(id);
      if (!tierList) {
        showStatus('Tier list not found', 'error');
        return;
      }
      
      const data = JSON.stringify(tierList, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `tierlist-${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showStatus('Tier list exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export tier list:', error);
      showStatus(`Failed to export tier list: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const exportAllData = async () => {
    if (!app || !isInitialized) return;
    
    try {
      const data = await app.exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `tierlist-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showStatus('All data exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      showStatus(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const importData = async (file: File) => {
    if (!app) return;
    
    try {
      const text = await file.text();
      await app.importData(text);
      
      showStatus('Data imported successfully', 'success');
      await loadTierLists();
      closeTierListEditor(); // Close any open editor
    } catch (error) {
      console.error('Failed to import data:', error);
      showStatus(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const showStorageInfo = async () => {
    if (!app || !isInitialized) return;
    
    try {
      const info = await app.getStorageInfo();
      const usedMB = info.quota?.used ? (info.quota.used / (1024 * 1024)).toFixed(2) : 'Unknown';
      const totalMB = info.quota?.total ? (info.quota.total / (1024 * 1024)).toFixed(2) : 'Unknown';
      
      const message = `Storage Information:\n\nType: ${info.type}\nAvailable: ${info.available ? 'Yes' : 'No'}\nUsed: ${usedMB} MB\nTotal: ${totalMB} MB\n\nFeatures:\n• Real-time: ${info.features.realTime ? 'Yes' : 'No'}\n• Sync: ${info.features.sync ? 'Yes' : 'No'}\n• Backup: ${info.features.backup ? 'Yes' : 'No'}`;
      alert(message);
    } catch (error) {
      console.error('Failed to get storage info:', error);
      showStatus(`Failed to get storage info: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <>
      <MobileFeatures />
      
      <div className="container">
        <Header />
        
        <div className="main-content">
          <Sidebar
            tierLists={tierLists}
            onCreateTierList={createTierList}
            onViewTierList={viewTierList}
            onDuplicateTierList={duplicateTierList}
            onExportTierList={exportTierList}
            onDeleteTierList={deleteTierList}
            onExportAllData={exportAllData}
            onImportData={importData}
            onShowStorageInfo={showStorageInfo}
            onRefresh={() => loadTierLists()}
          />
          
          <div className="tier-editor">
            {currentTierList ? (
              <TierListEditor
                tierList={currentTierList}
                onSave={saveTierList}
                onClose={closeTierListEditor}
                onTierListChange={setCurrentTierList}
                showStatus={showStatus}
              />
            ) : (
              <WelcomeMessage />
            )}
          </div>
        </div>
      </div>
      
      <StatusMessage 
        message={status.message}
        type={status.type}
        visible={status.visible}
      />
    </>
  );
};

export default App;