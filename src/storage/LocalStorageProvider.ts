import {
  StorageProvider,
  TierList,
  TierListSummary,
  StorageInfo,
  LocalStorageConfig,
  LocalStorageData
} from '@/types';
import { toSummary, isLocalStorageAvailable, validateTierList, parseDates } from '@/utils';

export class LocalStorageProvider implements StorageProvider {
  private readonly STORAGE_KEY: string;
  private readonly VERSION_KEY: string;
  private readonly CURRENT_VERSION = '1.0.0';
  private readonly maxSize: number;
  
  constructor(private config: LocalStorageConfig = {}) {
    this.STORAGE_KEY = config.storageKey || 'tierlist_app_data';
    this.VERSION_KEY = config.versionKey || 'tierlist_app_version';
    this.maxSize = config.maxSize || 5 * 1024 * 1024; // 5MB default
  }
  
  async save(tierList: TierList): Promise<void> {
    const data = await this.loadAllData();
    data.tierLists[tierList.id] = {
      ...tierList,
      metadata: {
        ...tierList.metadata,
        updatedAt: new Date()
      }
    };
    await this.saveAllData(data);
  }
  
  async load(id: string): Promise<TierList | null> {
    const data = await this.loadAllData();
    const tierList = data.tierLists[id];
    return tierList ? parseDates(tierList) : null;
  }
  
  async list(): Promise<TierListSummary[]> {
    const data = await this.loadAllData();
    return Object.values(data.tierLists)
      .map(tierList => parseDates(tierList))
      .map(toSummary)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async delete(id: string): Promise<void> {
    const data = await this.loadAllData();
    delete data.tierLists[id];
    await this.saveAllData(data);
  }
  
  async saveMultiple(tierLists: TierList[]): Promise<void> {
    const data = await this.loadAllData();
    for (const tierList of tierLists) {
      data.tierLists[tierList.id] = {
        ...tierList,
        metadata: {
          ...tierList.metadata,
          updatedAt: new Date()
        }
      };
    }
    await this.saveAllData(data);
  }
  
  async loadMultiple(ids: string[]): Promise<TierList[]> {
    const data = await this.loadAllData();
    return ids
      .map(id => data.tierLists[id])
      .filter(Boolean)
      .map(tierList => parseDates(tierList));
  }
  
  async export(): Promise<string> {
    const data = await this.loadAllData();
    return JSON.stringify(data, null, 2);
  }
  
  async import(jsonData: string): Promise<void> {
    try {
      const importedData = JSON.parse(jsonData);
      const validatedData = await this.validateAndMigrateData(importedData);
      await this.saveAllData(validatedData);
    } catch (error) {
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getStorageInfo(): Promise<StorageInfo> {
    const data = await this.loadAllData();
    const dataSize = new Blob([JSON.stringify(data)]).size;
    
    return {
      type: 'local',
      available: isLocalStorageAvailable(),
      quota: {
        used: dataSize,
        total: this.maxSize
      },
      features: {
        realTime: false,
        sync: false,
        backup: true
      }
    };
  }
  
  private async loadAllData(): Promise<LocalStorageData> {
    try {
      if (!isLocalStorageAvailable()) {
        throw new Error('localStorage is not available');
      }
      
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return this.createEmptyData();
      }
      
      const parsed = JSON.parse(data);
      return await this.validateAndMigrateData(parsed);
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return this.createEmptyData();
    }
  }
  
  private async saveAllData(data: LocalStorageData): Promise<void> {
    try {
      if (!isLocalStorageAvailable()) {
        throw new Error('localStorage is not available');
      }
      
      const serialized = JSON.stringify(data);
      const size = new Blob([serialized]).size;
      
      if (size > this.maxSize) {
        throw new Error(`Data size (${Math.round(size / 1024)}KB) exceeds maximum allowed size (${Math.round(this.maxSize / 1024)}KB)`);
      }
      
      localStorage.setItem(this.STORAGE_KEY, serialized);
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete some tier lists or clear browser data.');
      }
      throw error;
    }
  }
  
  private createEmptyData(): LocalStorageData {
    return {
      version: this.CURRENT_VERSION,
      tierLists: {},
      settings: {
        theme: 'default',
        autoSave: true
      }
    };
  }
  
  private async validateAndMigrateData(data: any): Promise<LocalStorageData> {
    // If data is empty or invalid, return empty data
    if (!data || typeof data !== 'object') {
      return this.createEmptyData();
    }
    
    // Ensure required structure exists
    const result: LocalStorageData = {
      version: data.version || this.CURRENT_VERSION,
      tierLists: {},
      settings: {
        theme: data.settings?.theme || 'default',
        autoSave: data.settings?.autoSave ?? true
      }
    };
    
    // Validate and migrate tier lists
    if (data.tierLists && typeof data.tierLists === 'object') {
      for (const [id, tierList] of Object.entries(data.tierLists)) {
        if (validateTierList(tierList)) {
          result.tierLists[id] = parseDates(tierList as any);
        } else {
          console.warn(`Invalid tier list found with id: ${id}, skipping...`);
        }
      }
    }
    
    // Handle version migrations if needed
    if (data.version !== this.CURRENT_VERSION) {
      console.log(`Migrating data from version ${data.version} to ${this.CURRENT_VERSION}`);
      // Add migration logic here when needed
    }
    
    return result;
  }
}