import { AppConfig, StorageConfig } from '@/types';
import { isLocalStorageAvailable } from '@/utils';

/**
 * Manages application configuration
 */
export class ConfigManager {
  private static readonly CONFIG_KEY = 'tierlist_app_config';

  /**
   * Get the current application configuration
   */
  static getConfig(): AppConfig {
    try {
      if (!isLocalStorageAvailable()) {
        return this.getDefaultConfig();
      }

      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        return { ...this.getDefaultConfig(), ...parsedConfig };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    return this.getDefaultConfig();
  }

  /**
   * Update application configuration
   */
  static updateConfig(updates: Partial<AppConfig>): AppConfig {
    const currentConfig = this.getConfig();
    const newConfig = this.mergeConfig(currentConfig, updates);

    try {
      if (isLocalStorageAvailable()) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(newConfig));
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }

    return newConfig;
  }

  /**
   * Reset configuration to defaults
   */
  static resetConfig(): AppConfig {
    const defaultConfig = this.getDefaultConfig();

    try {
      if (isLocalStorageAvailable()) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(defaultConfig));
      }
    } catch (error) {
      console.error('Error resetting config:', error);
    }

    return defaultConfig;
  }

  /**
   * Get storage configuration
   */
  static getStorageConfig(): StorageConfig {
    return this.getConfig().storage;
  }

  /**
   * Update storage configuration
   */
  static updateStorageConfig(storageConfig: StorageConfig): AppConfig {
    return this.updateConfig({ storage: storageConfig });
  }

  /**
   * Get default configuration
   */
  private static getDefaultConfig(): AppConfig {
    return {
      storage: {
        type: 'local',
        local: {
          storageKey: 'tierlist_app_data',
          versionKey: 'tierlist_app_version',
          maxSize: 5 * 1024 * 1024, // 5MB
        },
      },
      features: {
        realTimeSync: false,
        offlineMode: true,
        autoBackup: true,
      },
      ui: {
        theme: 'default',
        animations: true,
      },
    };
  }

  /**
   * Deep merge configuration objects
   */
  private static mergeConfig(current: AppConfig, updates: Partial<AppConfig>): AppConfig {
    const result = { ...current };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key as keyof AppConfig] = {
            ...(current[key as keyof AppConfig] as any),
            ...value,
          };
        } else {
          result[key as keyof AppConfig] = value as any;
        }
      }
    }

    return result;
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: Partial<AppConfig>): boolean {
    try {
      // Basic validation - ensure required fields exist
      if (config.storage) {
        if (!config.storage.type || !['local', 'firebase', 'api'].includes(config.storage.type)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Export configuration as JSON
   */
  static exportConfig(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  /**
   * Import configuration from JSON
   */
  static importConfig(jsonData: string): AppConfig {
    try {
      const importedConfig = JSON.parse(jsonData);

      if (!this.validateConfig(importedConfig)) {
        throw new Error('Invalid configuration format');
      }

      return this.updateConfig(importedConfig);
    } catch (error) {
      throw new Error(
        `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
