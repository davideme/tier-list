// Core Data Models
export interface TierListItem {
  id: string;
  type: 'text' | 'image';
  content: string; // text content or image URL/base64
  metadata?: {
    originalFileName?: string;
    uploadDate?: Date;
    size?: number;
  };
}

export interface Tier {
  id: string;
  label: string;
  color: string;
  items: TierListItem[];
  order: number;
}

export interface TierList {
  id: string;
  title: string;
  description?: string;
  tiers: Tier[];
  unrankedItems: TierListItem[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    author?: string;
  };
  settings: {
    theme: string;
    layout: 'standard' | 'compact';
    showLabels: boolean;
  };
}

export interface TierListSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  thumbnail?: string;
}

// Storage Interfaces
export interface StorageProvider {
  // Basic CRUD operations
  save(_tierList: TierList): Promise<void>;
  load(_id: string): Promise<TierList | null>;
  list(): Promise<TierListSummary[]>;
  delete(_id: string): Promise<void>;

  // Batch operations
  saveMultiple(_tierLists: TierList[]): Promise<void>;
  loadMultiple(_ids: string[]): Promise<TierList[]>;

  // Export/Import
  export(): Promise<string>; // JSON string of all data
  import(_data: string): Promise<void>;

  // Storage info
  getStorageInfo(): Promise<StorageInfo>;

  // Event handling for real-time updates (future)
  subscribe?(_callback: (_event: StorageEvent) => void): () => void;
}

export interface StorageInfo {
  type: 'local' | 'firebase' | 'api';
  available: boolean;
  quota?: {
    used: number;
    total: number;
  };
  features: {
    realTime: boolean;
    sync: boolean;
    backup: boolean;
  };
}

export interface StorageEvent {
  type: 'created' | 'updated' | 'deleted';
  tierListId: string;
  data?: TierList;
}

// Configuration Interfaces
export interface LocalStorageConfig {
  storageKey?: string;
  versionKey?: string;
  maxSize?: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface StorageConfig {
  type: 'local' | 'firebase' | 'api';
  local?: LocalStorageConfig;
  firebase?: FirebaseConfig;
  api?: ApiConfig;
}

// Local Storage Data Structure
export interface LocalStorageData {
  version: string;
  tierLists: Record<string, TierList>;
  settings: {
    theme: string;
    autoSave: boolean;
  };
}

// Application Configuration
export interface AppConfig {
  storage: StorageConfig;
  features: {
    realTimeSync: boolean;
    offlineMode: boolean;
    autoBackup: boolean;
  };
  ui: {
    theme: string;
    animations: boolean;
  };
}
