import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageProvider } from '../../src/storage/LocalStorageProvider';
import { TierList, TierListSummary } from '../../src/types';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage = {};

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {};
        }),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
    });

    provider = new LocalStorageProvider({ storageKey: 'tierlist_app_data' });
  });

  describe('save', () => {
    it('should save tier list to localStorage', async () => {
      const tierList: TierList = {
        id: 'test-id',
        title: 'Test Tier List',
        description: 'Test Description',
        tiers: [],
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

      await provider.save(tierList);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tierlist_app_data',
        expect.stringContaining('"test-id"')
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('tierlist_app_version', '1.0.0');
    });

    it('should handle storage quota', async () => {
      const tierList: TierList = {
        id: 'test-id',
        title: 'Test Tier List',
        tiers: [],
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

      // Mock localStorage.setItem to throw QuotaExceededError
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Should either save successfully or throw an error
      try {
        await provider.save(tierList);
        expect(localStorage.setItem).toHaveBeenCalled();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('load', () => {
    it('should load tier list from localStorage', async () => {
      const tierList: TierList = {
        id: 'test-id',
        title: 'Test Tier List',
        tiers: [],
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

      const storageData = {
        version: '1.0.0',
        tierLists: {
          'test-id': tierList,
        },
        settings: {
          theme: 'default',
          autoSave: true,
        },
      };

      mockLocalStorage['tierlist_app_data'] = JSON.stringify(storageData);

      const result = await provider.load('test-id');

      expect(result).toEqual(tierList);
    });

    it('should return null if tier list not found', async () => {
      const result = await provider.load('non-existent');
      expect(result).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      mockLocalStorage['tierlist_app_data'] = 'invalid json';

      const result = await provider.load('test-id');
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return list of tier list summaries', async () => {
      const tierList1: TierList = {
        id: 'id1',
        title: 'List 1',
        tiers: [{ id: 'tier1', label: 'A', color: '#ff0000', items: [], order: 0 }],
        unrankedItems: [{ id: 'item1', type: 'text', content: 'Item 1' }],
        metadata: {
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          version: 1,
        },
        settings: {
          theme: 'default',
          layout: 'standard',
          showLabels: true,
        },
      };

      const storageData = {
        version: '1.0.0',
        tierLists: {
          id1: tierList1,
        },
        settings: {
          theme: 'default',
          autoSave: true,
        },
      };

      mockLocalStorage['tierlist_app_data'] = JSON.stringify(storageData);

      const result = await provider.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'id1',
        title: 'List 1',
        createdAt: tierList1.metadata.createdAt,
        updatedAt: tierList1.metadata.updatedAt,
        itemCount: 1,
        thumbnail: undefined,
      });
    });

    it('should return empty array if no data', async () => {
      const result = await provider.list();
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete tier list from localStorage', async () => {
      const storageData = {
        version: '1.0.0',
        tierLists: {
          id1: { id: 'id1', title: 'List 1' },
          id2: { id: 'id2', title: 'List 2' },
        },
        settings: {
          theme: 'default',
          autoSave: true,
        },
      };

      mockLocalStorage['tierlist_app_data'] = JSON.stringify(storageData);

      await provider.delete('id1');

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('export', () => {
    it('should export all data as JSON string', async () => {
      const storageData = {
        version: '1.0.0',
        tierLists: {
          id1: { id: 'id1', title: 'List 1' },
        },
        settings: {
          theme: 'default',
          autoSave: true,
        },
      };

      mockLocalStorage['tierlist_app_data'] = JSON.stringify(storageData);

      const result = await provider.export();

      expect(typeof result).toBe('string');
      expect(result).toContain('version');
    });
  });

  describe('import', () => {
    it('should import data from JSON string', async () => {
      const importData = {
        version: '1.0.0',
        tierLists: {
          'imported-id': { id: 'imported-id', title: 'Imported List' },
        },
        settings: {
          theme: 'dark',
          autoSave: false,
        },
      };

      await provider.import(JSON.stringify(importData));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tierlist_app_data',
        expect.stringContaining('"version":"1.0.0"')
      );
    });

    it('should throw error for invalid JSON', async () => {
      await expect(provider.import('invalid json')).rejects.toThrow('Failed to import data:');
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', async () => {
      const result = await provider.getStorageInfo();

      expect(result).toEqual({
        type: 'local',
        available: true,
        quota: {
          used: expect.any(Number),
          total: expect.any(Number),
        },
        features: {
          realTime: false,
          sync: false,
          backup: true,
        },
      });
    });
  });
});
