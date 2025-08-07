import { v4 as uuidv4 } from 'uuid';
import { TierList, TierListSummary, Tier } from '@/types';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Convert a TierList to a TierListSummary
 */
export function toSummary(tierList: TierList): TierListSummary {
  const itemCount =
    tierList.tiers.reduce((count, tier) => count + tier.items.length, 0) +
    tierList.unrankedItems.length;

  return {
    id: tierList.id,
    title: tierList.title,
    createdAt: tierList.metadata.createdAt,
    updatedAt: tierList.metadata.updatedAt,
    itemCount,
    thumbnail: generateThumbnail(tierList),
  };
}

/**
 * Generate a thumbnail representation of a tier list
 */
function generateThumbnail(tierList: TierList): string | undefined {
  // For now, return the first image item found, or undefined
  for (const tier of tierList.tiers) {
    for (const item of tier.items) {
      if (item.type === 'image') {
        return item.content;
      }
    }
  }

  for (const item of tierList.unrankedItems) {
    if (item.type === 'image') {
      return item.content;
    }
  }

  return undefined;
}

/**
 * Create default tiers for a new tier list
 */
export function createDefaultTiers(): Tier[] {
  const labels = ['S', 'A', 'B', 'C', 'D'];
  const colors = ['#ff4444', '#ff8800', '#ffdd00', '#88dd00', '#4488dd'];

  return labels.map((label, index) => ({
    id: generateId(),
    label,
    color: colors[index],
    items: [],
    order: index,
  }));
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Validate that an object has the required structure of a TierList
 */
export function validateTierList(obj: any): obj is TierList {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.tiers) &&
    Array.isArray(obj.unrankedItems) &&
    obj.metadata &&
    obj.settings
  );
}

/**
 * Convert dates in an object from strings to Date objects
 */
export function parseDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(parseDates);
  }

  const result = { ...obj };
  for (const key in result) {
    if (key.includes('Date') || key.includes('At')) {
      if (typeof result[key] === 'string') {
        result[key] = new Date(result[key]);
      }
    } else if (typeof result[key] === 'object') {
      result[key] = parseDates(result[key]);
    }
  }

  return result;
}
