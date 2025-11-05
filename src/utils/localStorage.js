// Enhanced localStorage with IndexedDB persistence, cross-tab sync,
// and backup/restore functionality. Implements:
// 1. IndexedDB persistence for data survival across sessions
// 2. BroadcastChannel for cross-tab synchronization
// 3. StorageManager for requesting persistent storage
// 4. Backup/restore functionality for data export/import

// Cross-tab communication channel
const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('pos_sync') 
  : null;

// Minimal IndexedDB wrapper
const IDB_DB_NAME = 'pos_db';
const IDB_STORE = 'kv';
const IDB_VERSION = 1;

function openIdb() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

async function idbSet(key, value) {
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put({ key, value });
    return tx.complete || new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
  } catch (err) {
    console.warn('idbSet error', err);
  }
}

async function idbGet(key) {
  try {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGet error', err);
    return null;
  }
}

async function idbGetAll() {
  try {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGetAll error', err);
    return [];
  }
}

async function idbDelete(key) {
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.delete(key);
    return tx.complete || new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
  } catch (err) {
    console.warn('idbDelete error', err);
  }
}

// Request persistent storage
async function requestPersistentStorage() {
  if (!navigator.storage?.persist) {
    return false;
  }
  
  try {
    if (await navigator.storage.persist()) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Check if storage is persistent
async function isPersistentStorage() {
  if (!navigator.storage?.persisted) {
    return false;
  }
  
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

// Get estimated storage usage
async function getStorageEstimate() {
  if (!navigator.storage?.estimate) {
    return null;
  }
  
  try {
    return await navigator.storage.estimate();
  } catch {
    return null;
  }
}

export const storage = {
  // Storage persistence management
  persistence: {
    request: requestPersistentStorage,
    check: isPersistentStorage,
    getEstimate: getStorageEstimate
  },

  // Backup/Restore functionality
  backup: async () => {
    try {
      const data = {};
      const pairs = await idbGetAll();
      pairs.forEach(entry => {
        data[entry.key] = entry.value;
      });
      return data;
    } catch (err) {
      console.error('Backup failed', err);
      throw err;
    }
  },

  restore: async (backupData) => {
    try {
      // Validate backup data
      if (!backupData || typeof backupData !== 'object') {
        throw new Error('Invalid backup data');
      }

      // Clear current data
      await storage.clear();

      // Restore each key
      for (const [key, value] of Object.entries(backupData)) {
        await storage.set(key, value);
      }

      // Migrate restored data to localStorage
      await storage.migrateFromIndexedDB();
      
      // Notify other tabs
      broadcastChannel?.postMessage({ type: 'restore', timestamp: Date.now() });
      
      return true;
    } catch (err) {
      console.error('Restore failed', err);
      throw err;
    }
  },

  // Get item from localStorage (synchronous). We keep this fast; migration populates
  // localStorage from IndexedDB on app start so reads find data.
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  // Set item to localStorage and mirror to IndexedDB (async)
  set: (key, value) => {
    try {
      const timestamp = Date.now();
      const str = JSON.stringify(value);
      localStorage.setItem(key, str);
      
      // Mirror to IndexedDB (fire-and-forget)
      idbSet(key, value).catch(err => console.warn('Failed to persist to IDB', err));
      
      // Notify other tabs
      broadcastChannel?.postMessage({ 
        type: 'update', 
        key, 
        value, 
        timestamp 
      });
      
      return true;
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  },

  // Remove item from both storages
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      idbDelete(key).catch(err => console.warn('Failed to delete idb key', err));
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  },

  // Clear all localStorage and all IndexedDB entries
  clear: () => {
    try {
      localStorage.clear();
      // Clear IDB by opening and deleting object store entries
      openIdb().then(db => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.clear();
      }).catch(err => console.warn('Failed to clear IDB', err));
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  // CRUD operations for collections (unchanged behavior)
  getAll: (key) => {
    const items = storage.get(key);
    return items || [];
  },

  addOne: (key, item) => {
    const items = storage.getAll(key);
    items.push(item);
    return storage.set(key, items);
  },

  findOne: (key, id) => {
    const items = storage.getAll(key);
    return items.find(item => item.id === id);
  },

  updateOne: (key, id, updates) => {
    const items = storage.getAll(key);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: new Date() };
      storage.set(key, items);
      return items[index];
    }
    return null;
  },

  deleteOne: (key, id) => {
    const items = storage.getAll(key);
    const filtered = items.filter(item => item.id !== id);
    return storage.set(key, filtered);
  },

  // Get collection by key and field
  findByField: (key, field, value) => {
    const items = storage.getAll(key);
    return items.filter(item => item[field] === value);
  },

  // Migrate data from IndexedDB into localStorage (run at app start)
  migrateFromIndexedDB: async () => {
    try {
      const pairs = await idbGetAll();
      pairs.forEach(entry => {
        try {
          localStorage.setItem(entry.key, JSON.stringify(entry.value));
        } catch (err) {
          console.warn('Failed to populate localStorage from IDB for key', entry.key, err);
        }
      });
    } catch (err) {
      console.warn('migrateFromIndexedDB failed', err);
    }
  }
};

// Storage keys
export const STORAGE_KEYS = {
  USERS: 'pos_users',
  PRODUCTS: 'pos_products',
  STOCK_HISTORY: 'pos_stock_history',
  CUSTOMERS: 'pos_customers',
  PROMO_CODES: 'pos_promo_codes',
  TRANSACTIONS: 'pos_transactions',
  EXPENSES: 'pos_expenses',
  AUTH: 'pos_auth',
  SETTINGS: 'pos_settings'
};



