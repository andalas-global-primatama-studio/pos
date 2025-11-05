import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage, STORAGE_KEYS } from '../utils/localStorage';
import { generateId } from '../utils/generateId';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import Select from '../components/ui/Select';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    email: '',
    noTelepon: '',
    role: '',
    status: 'active'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const data = storage.getAll(STORAGE_KEYS.USERS);
    setUsers(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update user
      const updates = {
        ...formData,
        // Hash password only if a new password is provided
        password: formData.password ? btoa(formData.password) : editingUser.password
      };
      storage.updateOne(STORAGE_KEYS.USERS, editingUser.id, updates);
      showAlert('User berhasil diperbarui', 'success');
    } else {
      // Create user
      const newUser = {
        id: generateId(),
        ...formData,
        password: btoa(formData.password), // Simple encoding
        createdAt: new Date(),
        updatedAt: new Date()
      };
      storage.addOne(STORAGE_KEYS.USERS, newUser);
      showAlert('User berhasil ditambahkan', 'success');
    }
    
    loadUsers();
    handleCloseModal();
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      username: user.username,
      password: '',
      email: user.email || '',
      noTelepon: user.noTelepon || '',
      role: user.role,
      status: user.status
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      storage.deleteOne(STORAGE_KEYS.USERS, id);
      loadUsers();
      showAlert('User berhasil dihapus', 'success');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      nama: '',
      username: '',
      password: '',
      email: '',
      noTelepon: '',
      role: '',
      status: 'active'
    });
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  // Filter role options based on current user
  const roleOptions = currentUser?.role === 'super_admin'
    ? [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'kasir', label: 'Kasir' }
      ]
    : [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'kasir', label: 'Kasir' }
      ];

  const statusOptions = [
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Tidak Aktif' }
  ];

  const filteredUsers = users.filter(user => {
    // Hide super_admin users for admin role
    if (currentUser?.role === 'admin' && user.role === 'super_admin') {
      return false;
    }
    const matchesSearch = user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-gray-600 mt-1">Kelola pengguna sistem</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {alert.show && (
        <Alert type={alert.type}>{alert.message}</Alert>
      )}

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[{ value: '', label: 'Semua Role' }, ...roleOptions]}
            placeholder="Filter Role"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.role === 'super_admin' ? 'warning' : 'primary'}>
                      {roleOptions.find(r => r.value === user.role)?.label || user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                      {user.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
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

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Tambah User'}
        footer={
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={handleCloseModal}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit}>Simpan</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama"
            name="nama"
            value={formData.nama}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required={!editingUser}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          <Input
            label="No. Telepon"
            name="noTelepon"
            value={formData.noTelepon}
            onChange={handleInputChange}
          />
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            options={roleOptions}
            required
          />
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={statusOptions}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default Users;

