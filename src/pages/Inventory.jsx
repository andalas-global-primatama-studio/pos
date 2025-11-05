import { useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../utils/localStorage';
import { generateId } from '../utils/generateId';
import { formatCurrency } from '../utils/formatCurrency';
import { handleNumberInputChange } from '../utils/formatNumber';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import Select from '../components/ui/Select';
import { Plus, Edit2, Trash2, Search, Package, Tag, X } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    nama: '',
    kategori: '',
    hargaBeli: '',
    hargaJual: '',
    stok: '',
    minStok: '',
    satuan: 'Pcs',
    deskripsi: ''
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = () => {
    const data = storage.getAll(STORAGE_KEYS.PRODUCTS);
    setProducts(data);
  };

  const loadCategories = () => {
    let cats = storage.get('pos_categories') || [];
    if (cats.length === 0) {
      // Default categories
      cats = ['Elektronik', 'Fashion', 'Makanan', 'Minuman', 'Kesehatan'];
      storage.set('pos_categories', cats);
    }
    setCategories(cats);
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    
    const cats = [...categories, newCategory.trim()];
    storage.set('pos_categories', cats);
    setCategories(cats);
    setNewCategory('');
    setShowCategoryModal(false);
    showAlert('Kategori berhasil ditambahkan', 'success');
  };

  const deleteCategory = (categoryToDelete) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete}"?`)) {
      const cats = categories.filter(cat => cat !== categoryToDelete);
      storage.set('pos_categories', cats);
      setCategories(cats);
      showAlert('Kategori berhasil dihapus', 'success');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^\d]/g, '');
    handleNumberInputChange(value, (formatted) => {
      setFormData({ ...formData, [name]: formatted });
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingProduct) {
      const updates = {
        ...formData,
        hargaBeli: parseFloat(formData.hargaBeli.replace(/\./g, '')) || 0,
        hargaJual: parseFloat(formData.hargaJual.replace(/\./g, '')) || 0,
        stok: parseInt(formData.stok) || 0,
        minStok: parseInt(formData.minStok) || 0
      };
      storage.updateOne(STORAGE_KEYS.PRODUCTS, editingProduct.id, updates);
      showAlert('Produk berhasil diperbarui', 'success');
    } else {
      const newProduct = {
        id: generateId(),
        ...formData,
        hargaBeli: parseFloat(formData.hargaBeli.replace(/\./g, '')) || 0,
        hargaJual: parseFloat(formData.hargaJual.replace(/\./g, '')) || 0,
        stok: parseInt(formData.stok) || 0,
        minStok: parseInt(formData.minStok) || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      storage.addOne(STORAGE_KEYS.PRODUCTS, newProduct);
      showAlert('Produk berhasil ditambahkan', 'success');
    }
    
    loadProducts();
    handleCloseModal();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      barcode: product.barcode,
      nama: product.nama,
      kategori: product.kategori,
      hargaBeli: product.hargaBeli.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      hargaJual: product.hargaJual.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      stok: product.stok,
      minStok: product.minStok,
      satuan: product.satuan,
      deskripsi: product.deskripsi
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      storage.deleteOne(STORAGE_KEYS.PRODUCTS, id);
      loadProducts();
      showAlert('Produk berhasil dihapus', 'success');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      sku: '',
      barcode: '',
      nama: '',
      kategori: '',
      hargaBeli: '',
      hargaJual: '',
      stok: '',
      minStok: '',
      satuan: 'Pcs',
      deskripsi: ''
    });
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));
  const unitOptions = [
    { value: 'Pcs', label: 'Pcs' },
    { value: 'Box', label: 'Box' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Liter', label: 'Liter' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.kategori === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = filteredProducts.filter(p => p.stok <= p.minStok).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Inventory</h1>
          <p className="text-gray-600 mt-1">Kelola produk dan stok</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCategoryModal(true)} variant="secondary">
            <Tag className="w-4 h-4 mr-2" />
            Kategori
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {alert.show && (
        <Alert type={alert.type}>{alert.message}</Alert>
      )}

      {lowStockProducts > 0 && (
        <Alert type="warning">
          {lowStockProducts} produk memiliki stok rendah
        </Alert>
      )}

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[{ value: '', label: 'Semua Kategori' }, ...categoryOptions]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4">{product.nama}</td>
                  <td className="px-6 py-4">{product.sku}</td>
                  <td className="px-6 py-4">{product.kategori}</td>
                  <td className="px-6 py-4">{formatCurrency(product.hargaBeli)}</td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(product.hargaJual)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={product.stok <= product.minStok ? 'danger' : 'success'}>
                      {product.stok} {product.satuan}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingProduct ? 'Edit Produk' : 'Tambah Produk'}
        size="lg"
        footer={
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={handleCloseModal}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit}>Simpan</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <Input label="SKU" name="sku" value={formData.sku} onChange={handleInputChange} required />
          <Input label="Barcode" name="barcode" value={formData.barcode} onChange={handleInputChange} />
          <Input label="Nama Produk" name="nama" value={formData.nama} onChange={handleInputChange} className="col-span-2" required />
          <Select
            label="Kategori"
            name="kategori"
            value={formData.kategori}
            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
            options={categoryOptions}
            required
          />
          <Input 
            label="Harga Beli" 
            name="hargaBeli" 
            value={formData.hargaBeli} 
            onChange={handleNumberChange} 
            placeholder="0"
            required 
          />
          <Input 
            label="Harga Jual" 
            name="hargaJual" 
            value={formData.hargaJual} 
            onChange={handleNumberChange} 
            placeholder="0"
            required 
          />
          <Input label="Stok" name="stok" type="number" value={formData.stok} onChange={handleInputChange} required />
          <Input label="Min. Stok" name="minStok" type="number" value={formData.minStok} onChange={handleInputChange} required />
          <Select
            label="Satuan"
            name="satuan"
            value={formData.satuan}
            onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
            options={unitOptions}
          />
          <Input label="Deskripsi" name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} className="col-span-2" />
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Manajemen Kategori"
        size="sm"
        footer={
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>Tutup</Button>
            <Button variant="primary" onClick={addCategory}>Tambah</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              placeholder="Nama kategori baru"
            />
          </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Kategori Tersedia</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <span>{cat}</span>
                    <button
                      onClick={() => deleteCategory(cat)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      title="Hapus kategori"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
