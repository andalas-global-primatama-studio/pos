import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage, STORAGE_KEYS } from '../utils/localStorage';
import { generateId } from '../utils/generateId';
import { formatCurrency } from '../utils/formatCurrency';
import { formatNumberWithDots, handleNumberInputChange } from '../utils/formatNumber';
import { formatDate } from '../utils/dateHelpers';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import Select from '../components/ui/Select';
import { Plus, Edit2, Trash2, Search, DollarSign, Tag, X } from 'lucide-react';

const EXPENSE_STORAGE_KEY = 'pos_expenses';
const EXPENSE_CATEGORIES_KEY = 'pos_expense_categories';

const Pengeluaran = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    deskripsi: '',
    kategori: '',
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0],
    metode: 'tunai'
  });

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  const loadExpenses = () => {
    const data = storage.getAll(EXPENSE_STORAGE_KEY);
    setExpenses(data);
  };

  const loadCategories = () => {
    let cats = storage.get(EXPENSE_CATEGORIES_KEY) || [];
    if (cats.length === 0) {
      cats = ['Operasional', 'Listrik', 'Air', 'Internet', 'Maintenance', 'Lainnya'];
      storage.set(EXPENSE_CATEGORIES_KEY, cats);
    }
    setCategories(cats);
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    
    const cats = [...categories, newCategory.trim()];
    storage.set(EXPENSE_CATEGORIES_KEY, cats);
    setCategories(cats);
    setNewCategory('');
    setShowCategoryModal(false);
    showAlert('Kategori berhasil ditambahkan', 'success');
  };

  const deleteCategory = (categoryToDelete) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete}"?`)) {
      const cats = categories.filter(cat => cat !== categoryToDelete);
      storage.set(EXPENSE_CATEGORIES_KEY, cats);
      setCategories(cats);
      showAlert('Kategori berhasil dihapus', 'success');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e) => {
    const { name } = e.target;
    handleNumberInputChange(e.target.value, (formatted) => {
      setFormData({ ...formData, [name]: formatted });
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parse jumlah dengan atau tanpa separator titik
    const jumlahValue = typeof formData.jumlah === 'string' 
      ? parseFloat(formData.jumlah.replace(/\./g, '')) 
      : parseFloat(formData.jumlah) || 0;
    
    if (editingExpense) {
      const updates = {
        ...formData,
        jumlah: jumlahValue
      };
      storage.updateOne(EXPENSE_STORAGE_KEY, editingExpense.id, updates);
      showAlert('Pengeluaran berhasil diperbarui', 'success');
    } else {
      const newExpense = {
        id: generateId(),
        ...formData,
        jumlah: jumlahValue,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      storage.addOne(EXPENSE_STORAGE_KEY, newExpense);
      showAlert('Pengeluaran berhasil ditambahkan', 'success');
    }
    
    loadExpenses();
    handleCloseModal();
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      deskripsi: expense.deskripsi,
      kategori: expense.kategori,
      jumlah: expense.jumlah.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      tanggal: expense.tanggal,
      metode: expense.metode
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
      storage.deleteOne(EXPENSE_STORAGE_KEY, id);
      loadExpenses();
      showAlert('Pengeluaran berhasil dihapus', 'success');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      deskripsi: '',
      kategori: '',
      jumlah: '',
      tanggal: new Date().toISOString().split('T')[0],
      metode: 'tunai'
    });
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));
  const methodOptions = [
    { value: 'tunai', label: 'Tunai' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'kartu', label: 'Kartu Kredit' }
  ];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || expense.kategori === filterCategory;
    const matchesDate = (!dateRange.start && !dateRange.end) || 
      (!dateRange.start || expense.tanggal >= dateRange.start) &&
      (!dateRange.end || expense.tanggal <= dateRange.end);
    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.jumlah), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengeluaran</h1>
          <p className="text-gray-600 mt-1">Kelola pengeluaran toko</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCategoryModal(true)} variant="secondary">
            <Tag className="w-4 h-4 mr-2" />
            Kategori
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengeluaran
          </Button>
        </div>
      </div>

      {alert.show && (
        <Alert type={alert.type}>{alert.message}</Alert>
      )}

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <DollarSign className="text-red-600" size={32} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jumlah Transaksi</p>
              <p className="text-2xl font-bold mt-2">{filteredExpenses.length}</p>
            </div>
            <Badge variant="primary">{filteredExpenses.length}</Badge>
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari pengeluaran..."
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
          <Input
            label="Tanggal Mulai"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <Input
            label="Tanggal Akhir"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data pengeluaran
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(expense.tanggal)}</td>
                    <td className="px-6 py-4">{expense.deskripsi}</td>
                    <td className="px-6 py-4">
                      <Badge variant="warning">{expense.kategori}</Badge>
                    </td>
                    <td className="px-6 py-4">{expense.metode}</td>
                    <td className="px-6 py-4 font-semibold text-red-600">{formatCurrency(expense.jumlah)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleEdit(expense)} className="text-blue-600 hover:text-blue-900">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expense Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
        size="md"
        footer={
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={handleCloseModal}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit}>Simpan</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Deskripsi"
            name="deskripsi"
            value={formData.deskripsi}
            onChange={handleInputChange}
            required
          />
          <Select
            label="Kategori"
            name="kategori"
            value={formData.kategori}
            onChange={handleInputChange}
            options={categoryOptions}
            required
          />
          <Input
            label="Jumlah"
            name="jumlah"
            value={formatNumberWithDots(formData.jumlah.toString())}
            onChange={handleNumberChange}
            placeholder="0"
            required
          />
          <Input
            label="Tanggal"
            name="tanggal"
            type="date"
            value={formData.tanggal}
            onChange={handleInputChange}
            required
          />
          <Select
            label="Metode Pembayaran"
            name="metode"
            value={formData.metode}
            onChange={handleInputChange}
            options={methodOptions}
            required
          />
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Manajemen Kategori Pengeluaran"
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
                <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <span>{cat}</span>
                  <button
                    onClick={() => deleteCategory(cat)}
                    className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
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

export default Pengeluaran;

