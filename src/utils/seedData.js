import { storage, STORAGE_KEYS } from './localStorage';
import { generateId } from './generateId';

// Simple password hash (for demo purposes)
const hashPassword = (password) => {
  // In production, use proper hashing like bcrypt
  return btoa(password); // Base64 encoding for demo
};

export const seedData = () => {
  // Always reseed to ensure correct password format
  // Check if users exist
  const existingUsers = storage.get(STORAGE_KEYS.USERS);
  
  // If users don't exist, create seed data
  if (!existingUsers || existingUsers.length === 0) {
    createSeedData();
  }
};

const createSeedData = () => {

  // Seed Users
  const users = [
    {
      id: generateId(),
      nama: 'Super Admin',
      username: 'admin',
      password: hashPassword('admin123'),
      email: 'admin@pos.com',
      noTelepon: '081234567890',
      role: 'super_admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      nama: 'Administrator',
      username: 'admin2',
      password: hashPassword('admin123'),
      email: 'admin2@pos.com',
      noTelepon: '081234567891',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      nama: 'Manager Toko',
      username: 'manager',
      password: hashPassword('manager123'),
      email: 'manager@pos.com',
      noTelepon: '081234567892',
      role: 'manager',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      nama: 'Kasir 1',
      username: 'kasir',
      password: hashPassword('kasir123'),
      email: 'kasir@pos.com',
      noTelepon: '081234567893',
      role: 'kasir',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  storage.set(STORAGE_KEYS.USERS, users);

  // Seed Products
  const products = [
    {
      id: generateId(),
      sku: 'PRD-001',
      barcode: '1234567890123',
      nama: 'Produk A - Premium',
      kategori: 'Elektronik',
      hargaBeli: 50000,
      hargaJual: 75000,
      stok: 100,
      minStok: 20,
      satuan: 'Pcs',
      deskripsi: 'Produk berkualitas tinggi',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      sku: 'PRD-002',
      barcode: '1234567890124',
      nama: 'Produk B - Standard',
      kategori: 'Elektronik',
      hargaBeli: 30000,
      hargaJual: 50000,
      stok: 50,
      minStok: 15,
      satuan: 'Pcs',
      deskripsi: 'Produk standar',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      sku: 'PRD-003',
      barcode: '1234567890125',
      nama: 'Produk C - Basic',
      kategori: 'Fashion',
      hargaBeli: 25000,
      hargaJual: 40000,
      stok: 75,
      minStok: 25,
      satuan: 'Pcs',
      deskripsi: 'Produk basic',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      sku: 'PRD-004',
      barcode: '1234567890126',
      nama: 'Produk D - Deluxe',
      kategori: 'Fashion',
      hargaBeli: 60000,
      hargaJual: 90000,
      stok: 30,
      minStok: 10,
      satuan: 'Pcs',
      deskripsi: 'Produk deluxe',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      sku: 'PRD-005',
      barcode: '1234567890127',
      nama: 'Produk E - Economy',
      kategori: 'Elektronik',
      hargaBeli: 20000,
      hargaJual: 35000,
      stok: 150,
      minStok: 30,
      satuan: 'Pcs',
      deskripsi: 'Produk ekonomis',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  storage.set(STORAGE_KEYS.PRODUCTS, products);

  // Seed Customers
  const customers = [
    {
      id: generateId(),
      nama: 'Pelanggan 1',
      noTelepon: '081234567890',
      email: 'pelanggan1@email.com',
      alamat: 'Jl. Contoh No. 123',
      poin: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      nama: 'Pelanggan 2',
      noTelepon: '081234567891',
      email: 'pelanggan2@email.com',
      alamat: 'Jl. Contoh No. 456',
      poin: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  storage.set(STORAGE_KEYS.CUSTOMERS, customers);

  // Seed Promo Codes
  const promoCodes = [
    {
      id: generateId(),
      code: 'DISKON10',
      type: 'percentage',
      value: 10,
      minPurchase: 100000,
      maxDiscount: 50000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      usageLimit: 1000,
      usageCount: 0,
      status: 'active'
    },
    {
      id: generateId(),
      code: 'DISKON20K',
      type: 'nominal',
      value: 20000,
      minPurchase: 200000,
      maxDiscount: 20000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
      usageCount: 0,
      status: 'active'
    }
  ];

  storage.set(STORAGE_KEYS.PROMO_CODES, promoCodes);

  // Seed Settings
  const settings = {
    taxRate: 10, // 10% PPN
    currency: 'IDR',
    currencySymbol: 'Rp',
    companyName: 'PT. Toko Maju Jaya',
    companyAddress: 'Jl. Raya No. 123',
    companyPhone: '081234567890',
    receiptFooter: 'Terima kasih atas kunjungan Anda'
  };

  storage.set(STORAGE_KEYS.SETTINGS, settings);
};

