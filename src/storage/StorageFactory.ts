import { StorageProvider, StorageConfig } from '@/types';
import { LocalStorageProvider } from './LocalStorageProvider';

/**
 * Factory class for creating and managing storage providers
 */
export class StorageFactory {
  private static instance: StorageProvider | null = null;

  /**
   * Create a storage provider based on configuration
   */
  static async createStorage(config: StorageConfig): Promise<StorageProvider> {
    switch (config.type) {
      case 'local':
        return new LocalStorageProvider(config.local);
      case 'firebase':
        throw new Error('Firebase storage not yet implemented');
      case 'api':
        throw new Error('API storage not yet implemented');
      default:
        throw new Error(`Unsupported storage type: ${(config as any).type}`);
    }
  }

  /**
   * Get the current storage instance
   */
  static getInstance(): StorageProvider {
    if (!this.instance) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  /**
   * Initialize storage with configuration
   */
  static async initialize(config: StorageConfig): Promise<void> {
    this.instance = await this.createStorage(config);
  }

  /**
   * Check if storage is initialized
   */
  static isInitialized(): boolean {
    return this.instance !== null;
  }

  /**
   * Reset the storage instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Get default storage configuration for local storage
   */
  static getDefaultLocalConfig(): StorageConfig {
    return {
      type: 'local',
      local: {
        storageKey: 'tierlist_app_data',
        versionKey: 'tierlist_app_version',
        maxSize: 5 * 1024 * 1024, // 5MB
      },
    };
  }
}
