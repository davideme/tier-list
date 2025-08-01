import { TierListApp } from './TierListApp';
import type { TierList, TierListSummary, TierListItem } from './types';
import { generateId } from './utils';

let app: TierListApp;
let currentTierList: TierList | null = null;
let draggedItem: HTMLElement | null = null;

// Application state
let isInitialized = false;

/**
 * Show status message
 */
function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const statusEl = document.getElementById('status') as HTMLDivElement;
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 5000);
  } else {
    // Fallback to console if status element doesn't exist
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    showStatus('Initializing application...', 'info');
    app = new TierListApp();
    await app.initialize();
    isInitialized = true;
    showStatus('Application initialized successfully!', 'success');
    await loadTierLists();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showStatus(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  }
}

/**
 * Load and display tier lists
 */
async function loadTierLists() {
  if (!isInitialized) return;
  
  try {
    const tierListsContainer = document.getElementById('tierListsContainer') as HTMLDivElement;
    tierListsContainer.innerHTML = '<div class="loading">Loading tier lists...</div>';
    
    const tierLists = await app.listTierLists();
    
    if (tierLists.length === 0) {
      tierListsContainer.innerHTML = `
        <div class="empty-state">
          <h3>No tier lists yet</h3>
          <p>Create your first tier list using the form above!</p>
        </div>
      `;
      return;
    }
    
    const tierListsHtml = tierLists.map(tierList => createTierListCard(tierList)).join('');
    tierListsContainer.innerHTML = `<div class="tier-list-grid">${tierListsHtml}</div>`;
    
    // Add event listeners for tier list actions
    addTierListEventListeners();
  } catch (error) {
    console.error('Failed to load tier lists:', error);
    showStatus(`Failed to load tier lists: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    const tierListsContainer = document.getElementById('tierListsContainer') as HTMLDivElement;
    tierListsContainer.innerHTML = '<div class="empty-state"><h3>Error loading tier lists</h3></div>';
  }
}

/**
 * Create HTML for a tier list card
 */
function createTierListCard(tierList: TierListSummary): string {
  const createdDate = new Date(tierList.createdAt).toLocaleDateString();
  const updatedDate = new Date(tierList.updatedAt).toLocaleDateString();
  
  return `
    <div class="tier-list-card" data-id="${tierList.id}">
      <h3>${escapeHtml(tierList.title)}</h3>
      <p>
        <strong>Items:</strong> ${tierList.itemCount}<br>
        <strong>Created:</strong> ${createdDate}<br>
        <strong>Updated:</strong> ${updatedDate}
      </p>
      <div class="tier-list-actions">
        <button class="view-btn" data-id="${tierList.id}">View</button>
        <button class="duplicate-btn" data-id="${tierList.id}">Duplicate</button>
        <button class="export-btn" data-id="${tierList.id}">Export</button>
        <button class="delete-btn" data-id="${tierList.id}">Delete</button>
      </div>
    </div>
  `;
}

/**
 * Add event listeners for tier list actions
 */
function addTierListEventListeners() {
  // View buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id!;
      await viewTierList(id);
    });
  });
  
  // Duplicate buttons
  document.querySelectorAll('.duplicate-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id!;
      await duplicateTierList(id);
    });
  });
  
  // Export buttons
  document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id!;
      await exportTierList(id);
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id!;
      await deleteTierList(id);
    });
  });
}

/**
 * Create a new tier list
 */
async function createTierList() {
  if (!isInitialized) return;
  
  const tierListTitleInput = document.getElementById('tierListTitle') as HTMLInputElement;
  const tierListDescriptionInput = document.getElementById('tierListDescription') as HTMLInputElement;
  const createBtn = document.getElementById('createBtn') as HTMLButtonElement;
  
  if (!tierListTitleInput || !createBtn) {
    showStatus('Required form elements not found', 'error');
    return;
  }
  
  const title = tierListTitleInput.value.trim();
  const description = tierListDescriptionInput?.value.trim() || undefined;
  
  if (!title) {
    showStatus('Please enter a title for your tier list', 'error');
    return;
  }
  
  try {
    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';
    
    const tierList = await app.createTierList(title, description);
    
    showStatus(`Tier list "${title}" created successfully!`, 'success');
    tierListTitleInput.value = '';
    if (tierListDescriptionInput) tierListDescriptionInput.value = '';
    
    await loadTierLists();
    // Automatically open the new tier list for editing
    await viewTierList(tierList.id);
  } catch (error) {
    console.error('Failed to create tier list:', error);
    showStatus(`Failed to create tier list: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  } finally {
    if (createBtn) {
      createBtn.disabled = false;
      createBtn.textContent = 'Create Tier List';
    }
  }
}

/**
 * View/Edit a tier list
 */
async function viewTierList(id: string) {
  try {
    const tierList = await app.loadTierList(id);
    if (tierList) {
      currentTierList = tierList;
      openTierListEditor(tierList);
      showStatus(`Editing tier list: ${tierList.title}`, 'info');
    } else {
      showStatus('Tier list not found', 'error');
    }
  } catch (error) {
    console.error('Failed to view tier list:', error);
    showStatus(`Failed to view tier list: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  }
}

/**
 * Open the tier list editor
 */
function openTierListEditor(tierList: TierList) {
  const welcomeMessage = document.getElementById('welcomeMessage');
  const tierListEditor = document.getElementById('tierListEditor');
  const titleElement = document.getElementById('currentTierListTitle');
  
  if (welcomeMessage) welcomeMessage.classList.add('hidden');
  if (tierListEditor) tierListEditor.classList.remove('hidden');
  if (titleElement) titleElement.textContent = tierList.title;
  
  // Load tier list data into the editor
  loadTierListData(tierList);
}

/**
 * Close the tier list editor
 */
function closeTierListEditor() {
  const welcomeMessage = document.getElementById('welcomeMessage');
  const tierListEditor = document.getElementById('tierListEditor');
  
  if (welcomeMessage) welcomeMessage.classList.remove('hidden');
  if (tierListEditor) tierListEditor.classList.add('hidden');
  
  currentTierList = null;
}

/**
 * Load tier list data into the editor
 */
function loadTierListData(tierList: TierList) {
  // Clear all tier contents
  const tierContents = document.querySelectorAll('.tier-content');
  tierContents.forEach(content => {
    content.innerHTML = '';
  });
  
  // Load items into their respective tiers
  tierList.tiers.forEach(tier => {
    const tierContent = document.querySelector(`[data-tier="${tier.label}"] .tier-content`);
    if (tierContent) {
      tier.items.forEach(item => {
        const itemElement = createItemElement(item);
        tierContent.appendChild(itemElement);
      });
    }
  });
  
  // Load unranked items
  const unrankedContainer = document.getElementById('unrankedItems');
  if (unrankedContainer) {
    unrankedContainer.innerHTML = '';
    if (tierList.unrankedItems.length === 0) {
      unrankedContainer.innerHTML = '<div class="empty-state">Drag items here or add new items above</div>';
    } else {
      tierList.unrankedItems.forEach(item => {
        const itemElement = createItemElement(item);
        unrankedContainer.appendChild(itemElement);
      });
    }
  }
  
  updateUnrankedCount();
}

/**
 * Create an item element
 */
function createItemElement(item: TierListItem): HTMLElement {
  const itemDiv = document.createElement('div');
  itemDiv.className = `tier-item ${item.type}`;
  itemDiv.draggable = true;
  itemDiv.dataset.itemId = item.id;
  
  if (item.type === 'image') {
    itemDiv.style.backgroundImage = `url(${item.content})`;
  } else {
    itemDiv.textContent = item.content;
  }
  
  // Add delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'item-delete';
  deleteBtn.innerHTML = '×';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteItem(item.id);
  };
  
  const controls = document.createElement('div');
  controls.className = 'item-controls';
  controls.appendChild(deleteBtn);
  itemDiv.appendChild(controls);
  
  // Add drag event listeners
  itemDiv.addEventListener('dragstart', handleDragStart);
  itemDiv.addEventListener('dragend', handleDragEnd);
  
  return itemDiv;
}

/**
 * Add text item
 */
function addTextItem() {
  const input = document.getElementById('newItemText') as HTMLInputElement;
  const text = input.value.trim();
  
  if (!text) {
    showStatus('Please enter text for the item', 'error');
    return;
  }
  
  if (!currentTierList) {
    showStatus('No tier list is currently open', 'error');
    return;
  }
  
  const item: TierListItem = {
    id: generateId(),
    type: 'text',
    content: text
  };
  
  currentTierList.unrankedItems.push(item);
  
  const itemElement = createItemElement(item);
  const unrankedContainer = document.getElementById('unrankedItems');
  if (unrankedContainer) {
    // Remove empty state if present
    const emptyState = unrankedContainer.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
    unrankedContainer.appendChild(itemElement);
  }
  
  input.value = '';
  updateUnrankedCount();
  showStatus('Text item added', 'success');
}

/**
 * Handle image upload
 */
function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;
  
  if (!currentTierList) {
    showStatus('No tier list is currently open', 'error');
    return;
  }
  
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
    
    currentTierList!.unrankedItems.push(item);
    
    const itemElement = createItemElement(item);
    const unrankedContainer = document.getElementById('unrankedItems');
    if (unrankedContainer) {
      // Remove empty state if present
      const emptyState = unrankedContainer.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }
      unrankedContainer.appendChild(itemElement);
    }
    
    updateUnrankedCount();
    showStatus('Image item added', 'success');
  };
  
  reader.readAsDataURL(file);
  input.value = ''; // Reset file input
}

/**
 * Handle add item key press
 */
function handleAddItemKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    addTextItem();
  }
}

/**
 * Delete item
 */
function deleteItem(itemId: string) {
  if (!currentTierList) return;
  
  // Remove from unranked items
  currentTierList.unrankedItems = currentTierList.unrankedItems.filter(item => item.id !== itemId);
  
  // Remove from tiers
  currentTierList.tiers.forEach(tier => {
    tier.items = tier.items.filter(item => item.id !== itemId);
  });
  
  // Remove from DOM
  const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
  if (itemElement) {
    itemElement.remove();
  }
  
  // Check if unranked area is empty
  const unrankedContainer = document.getElementById('unrankedItems');
  if (unrankedContainer && unrankedContainer.children.length === 0) {
    unrankedContainer.innerHTML = '<div class="empty-state">Drag items here or add new items above</div>';
  }
  
  updateUnrankedCount();
  showStatus('Item deleted', 'success');
}

/**
 * Drag and drop handlers
 */
function handleDragStart(event: DragEvent) {
  draggedItem = event.target as HTMLElement;
  draggedItem.classList.add('dragging');
  event.dataTransfer!.effectAllowed = 'move';
}

function handleDragEnd(event: DragEvent) {
  if (draggedItem) {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
  }
}

function allowDrop(event: DragEvent) {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.classList.add('drag-over');
}

function dragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('drag-over');
}

function drop(event: DragEvent) {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('drag-over');
  
  if (!draggedItem || !currentTierList) return;
  
  const itemId = draggedItem.dataset.itemId;
  if (!itemId) return;
  
  // Find the item in the current tier list
  let item: TierListItem | undefined;
  
  // Check unranked items
  const unrankedIndex = currentTierList.unrankedItems.findIndex(i => i.id === itemId);
  if (unrankedIndex !== -1) {
    item = currentTierList.unrankedItems.splice(unrankedIndex, 1)[0];
  }
  
  // Check tiers
  if (!item) {
    for (const tier of currentTierList.tiers) {
      const tierIndex = tier.items.findIndex(i => i.id === itemId);
      if (tierIndex !== -1) {
        item = tier.items.splice(tierIndex, 1)[0];
        break;
      }
    }
  }
  
  if (!item) return;
  
  // Determine target location
  if (target.id === 'unrankedItems' || target.classList.contains('unranked-content')) {
    // Moving to unranked
    currentTierList.unrankedItems.push(item);
    
    // Remove empty state if present
    const emptyState = target.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
    
    target.appendChild(draggedItem);
  } else if (target.classList.contains('tier-content')) {
    // Moving to a tier
  const tierRow = target.closest('.tier-row') as HTMLElement;
  const tierLabel = tierRow?.dataset.tier;
    
    if (tierLabel) {
      const tier = currentTierList.tiers.find(t => t.label === tierLabel);
      if (tier) {
        tier.items.push(item);
        target.appendChild(draggedItem);
      }
    }
  }
  
  // Update unranked count and check for empty state
  updateUnrankedCount();
  
  const unrankedContainer = document.getElementById('unrankedItems');
  if (unrankedContainer && unrankedContainer.children.length === 0) {
    unrankedContainer.innerHTML = '<div class="empty-state">Drag items here or add new items above</div>';
  }
}

/**
 * Update unranked count
 */
function updateUnrankedCount() {
  const countElement = document.getElementById('unrankedCount');
  if (countElement && currentTierList) {
    const count = currentTierList.unrankedItems.length;
    countElement.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  }
}

/**
 * Save tier list
 */
async function saveTierList() {
  if (!currentTierList) {
    showStatus('No tier list is currently open', 'error');
    return;
  }
  
  try {
    await app.updateTierList(currentTierList);
    showStatus('Tier list saved successfully', 'success');
    await loadTierLists(); // Refresh the sidebar
  } catch (error) {
    console.error('Failed to save tier list:', error);
    showStatus('Failed to save tier list', 'error');
  }
}

/**
 * Edit tier label
 */
function editTierLabel(currentLabel: string) {
  const newLabel = prompt(`Enter new label for tier ${currentLabel}:`, currentLabel);
  if (newLabel && newLabel.trim() && currentTierList) {
    const tier = currentTierList.tiers.find(t => t.label === currentLabel);
    if (tier) {
      tier.label = newLabel.trim();
      
      // Update the UI
    const tierRow = document.querySelector(`[data-tier="${currentLabel}"]`) as HTMLElement;
    if (tierRow) {
      tierRow.dataset.tier = newLabel.trim();
        const labelElement = tierRow.querySelector('.tier-label');
        if (labelElement) {
          labelElement.textContent = newLabel.trim();
          labelElement.setAttribute('onclick', `editTierLabel('${newLabel.trim()}')`);
        }
      }
      
      showStatus(`Tier label updated to "${newLabel.trim()}"`, 'success');
    }
  }
}

/**
 * Export tier list as image
 */
function exportTierListImage() {
  if (!currentTierList) {
    showStatus('No tier list is currently open', 'error');
    return;
  }
  
  // This is a placeholder - in a real implementation, you'd use canvas or html2canvas
  showStatus('Image export feature coming soon!', 'info');
}

/**
 * Duplicate a tier list
 */
async function duplicateTierList(id: string) {
  try {
    const duplicated = await app.duplicateTierList(id);
    showStatus(`Tier list duplicated as "${duplicated.title}"`, 'success');
    await loadTierLists();
  } catch (error) {
    console.error('Failed to duplicate tier list:', error);
    showStatus(`Failed to duplicate tier list: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  }
}

/**
 * Export a single tier list
 */
async function exportTierList(id: string) {
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
}

/**
 * Delete a tier list
 */
async function deleteTierList(id: string) {
  if (!confirm('Are you sure you want to delete this tier list? This action cannot be undone.')) {
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
}

/**
 * Export all data
 */
async function exportAllData() {
  if (!isInitialized) return;
  
  try {
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';
    
    const data = await app.exportAllData();
    downloadJson(data, `tierlist-backup-${new Date().toISOString().split('T')[0]}.json`);
    showStatus('All data exported successfully', 'success');
  } catch (error) {
    console.error('Failed to export data:', error);
    showStatus(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  } finally {
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    exportBtn.disabled = false;
    exportBtn.textContent = 'Export All Data';
  }
}

/**
 * Import data
 */
async function importData() {
  const importFile = document.getElementById('importFile') as HTMLInputElement;
  importFile.click();
}

/**
 * Handle file import
 */
async function handleFileImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  try {
    const importBtn = document.getElementById('importBtn') as HTMLButtonElement;
    const importFile = document.getElementById('importFile') as HTMLInputElement;
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';
    
    const text = await file.text();
    await app.importData(text);
    
    showStatus('Data imported successfully', 'success');
    await loadTierLists();
    closeTierListEditor(); // Close any open editor
  } catch (error) {
    console.error('Failed to import data:', error);
    showStatus(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  } finally {
    const importBtn = document.getElementById('importBtn') as HTMLButtonElement;
    const importFile = document.getElementById('importFile') as HTMLInputElement;
    importBtn.disabled = false;
    importBtn.textContent = 'Import Data';
    importFile.value = ''; // Reset file input
  }
}

/**
 * Show storage information
 */
async function showStorageInfo() {
  if (!isInitialized) return;
  
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
}

/**
 * Download JSON data as file
 */
function downloadJson(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally available
(window as any).createTierList = createTierList;
(window as any).viewTierList = viewTierList;
(window as any).closeTierListEditor = closeTierListEditor;
(window as any).addTextItem = addTextItem;
(window as any).handleImageUpload = handleImageUpload;
(window as any).handleAddItemKeyPress = handleAddItemKeyPress;
(window as any).saveTierList = saveTierList;
(window as any).editTierLabel = editTierLabel;
(window as any).exportTierListImage = exportTierListImage;
(window as any).duplicateTierList = duplicateTierList;
(window as any).exportTierList = exportTierList;
(window as any).deleteTierList = deleteTierList;
(window as any).exportAllData = exportAllData;
(window as any).importData = importData;
(window as any).handleFileImport = handleFileImport;
(window as any).showStorageInfo = showStorageInfo;
(window as any).loadTierLists = loadTierLists;
(window as any).allowDrop = allowDrop;
(window as any).drop = drop;
(window as any).dragLeave = dragLeave;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const createBtn = document.getElementById('createBtn') as HTMLButtonElement;
  const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
  const importBtn = document.getElementById('importBtn') as HTMLButtonElement;
  const importFile = document.getElementById('importFile') as HTMLInputElement;
  const storageInfoBtn = document.getElementById('storageInfoBtn') as HTMLButtonElement;
  const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
  const tierListTitleInput = document.getElementById('tierListTitle') as HTMLInputElement;
  
  // Add event listeners with null checks
  if (createBtn) createBtn.addEventListener('click', createTierList);
  if (exportBtn) exportBtn.addEventListener('click', exportAllData);
  if (importBtn) importBtn.addEventListener('click', importData);
  if (importFile) importFile.addEventListener('change', handleFileImport);
  if (storageInfoBtn) storageInfoBtn.addEventListener('click', showStorageInfo);
  if (refreshBtn) refreshBtn.addEventListener('click', loadTierLists);
  
  // Handle Enter key in title input
  if (tierListTitleInput) {
    tierListTitleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        createTierList();
      }
    });
  }
  
  // Initialize the application
  initializeApp();
});