import { TierListService } from '../../src/services/TierListService';
import { StorageProvider } from '../../src/types';
import { generateId, createDefaultTiers, deepClone } from '../../src/utils';

// Mock the utils module
jest.mock('../../src/utils', () => ({
  generateId: jest.fn(),
  createDefaultTiers: jest.fn(),
  deepClone: jest.fn(),
}));

const mockGenerateId = generateId as jest.MockedFunction<typeof generateId>;
const mockCreateDefaultTiers = createDefaultTiers as jest.MockedFunction<typeof createDefaultTiers>;
const mockDeepClone = deepClone as jest.MockedFunction<typeof deepClone>;

describe('TierListService', () => {
  let service: TierListService;
  let mockStorageProvider: jest.Mocked<StorageProvider>;

  beforeEach(() => {
    mockStorageProvider = {
      save: jest.fn(),
      load: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
      saveMultiple: jest.fn(),
      loadMultiple: jest.fn(),
      export: jest.fn(),
      import: jest.fn(),
      getStorageInfo: jest.fn(),
    };

    service = new TierListService(mockStorageProvider);
    
    // Reset mocks
    mockGenerateId.mockClear();
    mockCreateDefaultTiers.mockClear();
    mockDeepClone.mockClear();
    
    // Setup default mock returns
    mockGenerateId.mockReturnValue('test-id-123');
    mockCreateDefaultTiers.mockReturnValue([
      {
        id: 'tier-s',
        label: 'S',
        color: '#ff7f7f',
        items: [],
        order: 0
      },
      {
        id: 'tier-a',
        label: 'A',
        color: '#ffbf7f',
        items: [],
        order: 1
      },
      {
        id: 'tier-b',
        label: 'B',
        color: '#ffff7f',
        items: [],
        order: 2
      },
      {
        id: 'tier-c',
        label: 'C',
        color: '#bfff7f',
        items: [],
        order: 3
      },
      {
        id: 'tier-d',
        label: 'D',
        color: '#7fff7f',
        items: [],
        order: 4
      }
    ]);
  });

  describe('createTierList', () => {
    it('should create a new tier list with default tiers', async () => {
      const mockTierList = {
        id: 'test-id-123',
        title: 'Test Tier List',
        description: 'Test Description',
        tiers: [
          { id: 'tier-s', label: 'S', color: '#ff7f7f', items: [], order: 0 },
          { id: 'tier-a', label: 'A', color: '#ffbf7f', items: [], order: 1 },
          { id: 'tier-b', label: 'B', color: '#ffff7f', items: [], order: 2 },
          { id: 'tier-c', label: 'C', color: '#bfff7f', items: [], order: 3 },
          { id: 'tier-d', label: 'D', color: '#7fff7f', items: [], order: 4 },
        ],
        unrankedItems: [],
        metadata: {
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          version: 1,
        },
        settings: {
          theme: 'default',
          layout: 'standard' as const,
          showLabels: true,
        },
      };

      mockStorageProvider.save.mockResolvedValue(undefined);

      const result = await service.createTierList('Test Tier List', 'Test Description');

      expect(result).toEqual(mockTierList);
      expect(mockStorageProvider.save).toHaveBeenCalledWith(mockTierList);
    });

    it('should create tier list without description', async () => {
      mockStorageProvider.save.mockResolvedValue(undefined);

      const result = await service.createTierList('Test Tier List');

      expect(result.title).toBe('Test Tier List');
      expect(result.description).toBeUndefined();
      expect(result.metadata).toBeDefined();
      expect(result.settings).toBeDefined();
    });

    it('should throw error if storage save fails', async () => {
      mockStorageProvider.save.mockRejectedValue(new Error('Storage error'));

      try {
        await service.createTierList('Test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Storage error');
      }
    });
  });

  describe('loadTierList', () => {
    it('should load existing tier list', async () => {
      const mockTierList = {
        id: 'test-id',
        title: 'Test',
        tiers: [],
        unrankedItems: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
        settings: {
          theme: 'default',
          layout: 'standard' as const,
          showLabels: true,
        },
      };

      mockStorageProvider.load.mockResolvedValue(mockTierList);

      const result = await service.loadTierList('test-id');

      expect(result).toEqual(mockTierList);
      expect(mockStorageProvider.load).toHaveBeenCalledWith('test-id');
    });

    it('should return null if tier list not found', async () => {
      mockStorageProvider.load.mockResolvedValue(null);

      const result = await service.loadTierList('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('listTierLists', () => {
    it('should return list of tier list summaries', async () => {
      const mockSummaries = [
        {
          id: 'id1',
          title: 'List 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          itemCount: 5,
        },
        {
          id: 'id2',
          title: 'List 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          itemCount: 3,
        },
      ];

      mockStorageProvider.list.mockResolvedValue(mockSummaries);

      const result = await service.listTierLists();

      expect(result).toEqual(mockSummaries);
      expect(mockStorageProvider.list).toHaveBeenCalled();
    });
  });

  describe('updateTierList', () => {
    it('should update existing tier list', async () => {
      const existingTierList = {
        id: 'test-id',
        title: 'Original',
        tiers: [],
        unrankedItems: [],
        metadata: {
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          version: 1,
        },
        settings: {
          theme: 'default',
          layout: 'standard' as const,
          showLabels: true,
        },
      };

      const updates = {
        title: 'Updated Title',
        tiers: [{ id: 'tier-1', label: 'A', color: '#ff0000', items: [], order: 0 }],
      };

      const updatedTierList = { ...existingTierList, ...updates };
      mockStorageProvider.load.mockResolvedValue(existingTierList);
      mockStorageProvider.save.mockResolvedValue(undefined);

      await service.updateTierList(updatedTierList);

      expect(mockStorageProvider.save).toHaveBeenCalledWith(updatedTierList);
    });
  });

  describe('deleteTierList', () => {
    it('should delete tier list', async () => {
      mockStorageProvider.delete.mockResolvedValue(undefined);

      await service.deleteTierList('test-id');

      expect(mockStorageProvider.delete).toHaveBeenCalledWith('test-id');
    });
  });

  describe('duplicateTierList', () => {
    it('should create a copy of existing tier list', async () => {
      const originalTierList = {
        id: 'original-id',
        title: 'Original',
        description: 'Original description',
        tiers: [{ id: 'tier-1', label: 'A', color: '#ff0000', items: [], order: 0 }],
        unrankedItems: [],
        metadata: {
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          version: 1,
        },
        settings: {
          theme: 'default',
          layout: 'standard' as const,
          showLabels: true,
        },
      };

      const clonedTierList = { ...originalTierList };
      
      mockStorageProvider.load.mockResolvedValue(originalTierList);
      mockDeepClone.mockReturnValue(clonedTierList);
      mockGenerateId.mockReturnValue('new-id-123');
      mockStorageProvider.save.mockResolvedValue(undefined);

      const result = await service.duplicateTierList('original-id');

      expect(mockStorageProvider.load).toHaveBeenCalledWith('original-id');
      expect(mockDeepClone).toHaveBeenCalledWith(originalTierList);
      expect(result.id).toBe('new-id-123');
      expect(result.title).toBe('Original (Copy)');
      expect(result.description).toBe('Original description');
      expect(result.tiers).toEqual(originalTierList.tiers);
      expect(mockStorageProvider.save).toHaveBeenCalledWith(result);
    });
  });
});