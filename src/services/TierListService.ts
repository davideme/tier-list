import { TierList, TierListSummary, TierListItem, Tier, StorageProvider } from '@/types';
import { generateId, createDefaultTiers, deepClone } from '@/utils';

/**
 * Service class for managing tier list operations
 */
export class TierListService {
  private storage: StorageProvider;
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();

  constructor(storage: StorageProvider) {
    this.storage = storage;
  }

  /**
   * Create a new tier list
   */
  async createTierList(title: string, description?: string): Promise<TierList> {
    const tierList: TierList = {
      id: generateId(),
      title,
      description,
      tiers: createDefaultTiers(),
      unrankedItems: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      settings: {
        theme: 'default',
        layout: 'standard',
        showLabels: true,
      },
    };

    await this.storage.save(tierList);
    this.emit('tierListCreated', tierList);
    return tierList;
  }

  /**
   * Load a tier list by ID
   */
  async loadTierList(id: string): Promise<TierList | null> {
    return await this.storage.load(id);
  }

  /**
   * Get all tier list summaries
   */
  async listTierLists(): Promise<TierListSummary[]> {
    return await this.storage.list();
  }

  /**
   * Update an existing tier list
   */
  async updateTierList(tierList: TierList): Promise<void> {
    tierList.metadata.updatedAt = new Date();
    tierList.metadata.version += 1;

    await this.storage.save(tierList);
    this.emit('tierListUpdated', tierList);
  }

  /**
   * Delete a tier list
   */
  async deleteTierList(id: string): Promise<void> {
    await this.storage.delete(id);
    this.emit('tierListDeleted', { id });
  }

  /**
   * Add an item to the unranked items
   */
  async addItem(tierListId: string, item: Omit<TierListItem, 'id'>): Promise<TierListItem> {
    const tierList = await this.storage.load(tierListId);
    if (!tierList) {
      throw new Error('Tier list not found');
    }

    const newItem: TierListItem = {
      ...item,
      id: generateId(),
    };

    tierList.unrankedItems.push(newItem);
    await this.updateTierList(tierList);

    return newItem;
  }

  /**
   * Move an item between tiers or to unranked
   */
  async moveItem(
    tierListId: string,
    itemId: string,
    targetTierId: string | null,
    position: number
  ): Promise<void> {
    const tierList = await this.storage.load(tierListId);
    if (!tierList) {
      throw new Error('Tier list not found');
    }

    // Find and remove item from current location
    const item = this.findAndRemoveItem(tierList, itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    // Add item to new location
    if (targetTierId) {
      const targetTier = tierList.tiers.find(t => t.id === targetTierId);
      if (!targetTier) {
        throw new Error('Target tier not found');
      }
      targetTier.items.splice(position, 0, item);
    } else {
      // Move to unranked
      tierList.unrankedItems.splice(position, 0, item);
    }

    await this.updateTierList(tierList);
  }

  /**
   * Update tier properties
   */
  async updateTier(
    tierListId: string,
    tierId: string,
    updates: Partial<Pick<Tier, 'label' | 'color'>>
  ): Promise<void> {
    const tierList = await this.storage.load(tierListId);
    if (!tierList) {
      throw new Error('Tier list not found');
    }

    const tier = tierList.tiers.find(t => t.id === tierId);
    if (!tier) {
      throw new Error('Tier not found');
    }

    Object.assign(tier, updates);
    await this.updateTierList(tierList);
  }

  /**
   * Add a new tier
   */
  async addTier(tierListId: string, label: string, color: string): Promise<Tier> {
    const tierList = await this.storage.load(tierListId);
    if (!tierList) {
      throw new Error('Tier list not found');
    }

    const newTier: Tier = {
      id: generateId(),
      label,
      color,
      items: [],
      order: tierList.tiers.length,
    };

    tierList.tiers.push(newTier);
    await this.updateTierList(tierList);

    return newTier;
  }

  /**
   * Remove a tier (moves all items to unranked)
   */
  async removeTier(tierListId: string, tierId: string): Promise<void> {
    const tierList = await this.storage.load(tierListId);
    if (!tierList) {
      throw new Error('Tier list not found');
    }

    const tierIndex = tierList.tiers.findIndex(t => t.id === tierId);
    if (tierIndex === -1) {
      throw new Error('Tier not found');
    }

    // Move all items from the tier to unranked
    const tier = tierList.tiers[tierIndex];
    tierList.unrankedItems.push(...tier.items);

    // Remove the tier
    tierList.tiers.splice(tierIndex, 1);

    // Update order of remaining tiers
    tierList.tiers.forEach((t, index) => {
      t.order = index;
    });

    await this.updateTierList(tierList);
  }

  /**
   * Reorder tiers
   */
  async reorderTiers(tierListId: string, tierIds: string[]): Promise<void> {
    const tierList = await this.storage.load(tierListId);
    if (!tierList) {
      throw new Error('Tier list not found');
    }

    // Create a map for quick lookup
    const tierMap = new Map(tierList.tiers.map(tier => [tier.id, tier]));

    // Reorder tiers based on the provided order
    tierList.tiers = tierIds.map((id, index) => {
      const tier = tierMap.get(id);
      if (!tier) {
        throw new Error(`Tier with id ${id} not found`);
      }
      tier.order = index;
      return tier;
    });

    await this.updateTierList(tierList);
  }

  /**
   * Export tier list as JSON
   */
  async exportTierList(tierListId: string): Promise<string> {
    const tierList = await this.storage.load(tierListId);
    if (!tierList) {
      throw new Error('Tier list not found');
    }

    return JSON.stringify(tierList, null, 2);
  }

  /**
   * Import tier list from JSON
   */
  async importTierList(jsonData: string): Promise<TierList> {
    try {
      const tierList = JSON.parse(jsonData) as TierList;

      // Generate new ID to avoid conflicts
      tierList.id = generateId();
      tierList.metadata.createdAt = new Date();
      tierList.metadata.updatedAt = new Date();
      tierList.metadata.version = 1;

      await this.storage.save(tierList);
      this.emit('tierListCreated', tierList);

      return tierList;
    } catch (error) {
      throw new Error(
        `Failed to import tier list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Duplicate a tier list
   */
  async duplicateTierList(tierListId: string, newTitle?: string): Promise<TierList> {
    const originalTierList = await this.storage.load(tierListId);
    if (!originalTierList) {
      throw new Error('Tier list not found');
    }

    const duplicatedTierList = deepClone(originalTierList);
    duplicatedTierList.id = generateId();
    duplicatedTierList.title = newTitle || `${originalTierList.title} (Copy)`;
    duplicatedTierList.metadata.createdAt = new Date();
    duplicatedTierList.metadata.updatedAt = new Date();
    duplicatedTierList.metadata.version = 1;

    // Generate new IDs for all tiers and items
    duplicatedTierList.tiers.forEach(tier => {
      tier.id = generateId();
      tier.items.forEach(item => {
        item.id = generateId();
      });
    });

    duplicatedTierList.unrankedItems.forEach(item => {
      item.id = generateId();
    });

    await this.storage.save(duplicatedTierList);
    this.emit('tierListCreated', duplicatedTierList);

    return duplicatedTierList;
  }

  /**
   * Find and remove an item from a tier list
   */
  private findAndRemoveItem(tierList: TierList, itemId: string): TierListItem | null {
    // Check unranked items first
    const unrankedIndex = tierList.unrankedItems.findIndex(item => item.id === itemId);
    if (unrankedIndex !== -1) {
      return tierList.unrankedItems.splice(unrankedIndex, 1)[0];
    }

    // Check tiers
    for (const tier of tierList.tiers) {
      const itemIndex = tier.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        return tier.items.splice(itemIndex, 1)[0];
      }
    }

    return null;
  }

  /**
   * Add event listener
   */
  on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }
}
