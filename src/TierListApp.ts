import { StorageFactory } from './storage/StorageFactory';
import { TierListService } from './services/TierListService';
import { ConfigManager } from './config/ConfigManager';
import { TierList, TierListSummary, AppConfig, StorageInfo } from './types';

/**
 * Main application class that coordinates all services
 */
export class TierListApp {
  private tierListService: TierListService | null = null;
  private initialized = false;
  
  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Load configuration
      const config = ConfigManager.getConfig();
      
      // Initialize storage
      await StorageFactory.initialize(config.storage);
      const storage = StorageFactory.getInstance();
      
      // Initialize services
      this.tierListService = new TierListService(storage);
      
      this.initialized = true;
      console.log('TierList application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }
  
  /**
   * Get the tier list service
   */
  getTierListService(): TierListService {
    this.ensureInitialized();
    return this.tierListService!;
  }
  
  /**
   * Get application configuration
   */
  getConfig(): AppConfig {
    return ConfigManager.getConfig();
  }
  
  /**
   * Update application configuration
   */
  updateConfig(updates: Partial<AppConfig>): AppConfig {
    return ConfigManager.updateConfig(updates);
  }
  
  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    this.ensureInitialized();
    const storage = StorageFactory.getInstance();
    return await storage.getStorageInfo();
  }
  
  /**
   * Export all data
   */
  async exportAllData(): Promise<string> {
    this.ensureInitialized();
    const storage = StorageFactory.getInstance();
    return await storage.export();
  }
  
  /**
   * Import data
   */
  async importData(jsonData: string): Promise<void> {
    this.ensureInitialized();
    const storage = StorageFactory.getInstance();
    await storage.import(jsonData);
  }
  
  /**
   * Create a new tier list
   */
  async createTierList(title: string, description?: string): Promise<TierList> {
    return await this.getTierListService().createTierList(title, description);
  }
  
  /**
   * Load a tier list
   */
  async loadTierList(id: string): Promise<TierList | null> {
    return await this.getTierListService().loadTierList(id);
  }
  
  /**
   * Get all tier lists
   */
  async listTierLists(): Promise<TierListSummary[]> {
    return await this.getTierListService().listTierLists();
  }
  
  /**
   * Update a tier list
   */
  async updateTierList(tierList: TierList): Promise<void> {
    return await this.getTierListService().updateTierList(tierList);
  }
  
  /**
   * Delete a tier list
   */
  async deleteTierList(id: string): Promise<void> {
    return await this.getTierListService().deleteTierList(id);
  }
  
  /**
   * Duplicate a tier list
   */
  async duplicateTierList(id: string, newTitle?: string): Promise<TierList> {
    return await this.getTierListService().duplicateTierList(id, newTitle);
  }
  
  /**
   * Subscribe to tier list events
   */
  onTierListEvent(event: string, callback: (data: any) => void): void {
    this.getTierListService().on(event, callback);
  }
  
  /**
   * Unsubscribe from tier list events
   */
  offTierListEvent(event: string, callback: (data: any) => void): void {
    this.getTierListService().off(event, callback);
  }
  
  /**
   * Check if the application is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Reset the application (useful for testing)
   */
  reset(): void {
    this.tierListService = null;
    this.initialized = false;
    StorageFactory.reset();
  }
  
  /**
   * Ensure the application is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Application not initialized. Call initialize() first.');
    }
  }
}

// Export a singleton instance
export const tierListApp = new TierListApp();