import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage, STORAGE_KEYS } from '../utils/localStorage';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Building2, Lock, Upload } from 'lucide-react';
import { handleNumberInputChange } from '../utils/formatNumber';
import { formatCurrency } from '../utils/formatCurrency';

const Pengaturan = () => {
  const { user, login, updateCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'super_admin' || user?.role === 'admin' ? 'toko' : 'password');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const [tokoData, setTokoData] = useState({
    nama: '',
    alamat: '',
    telepon: '',
    email: ''
  });

  const [taxSettings, setTaxSettings] = useState({
    enabled: false,
    rate: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
    
    setTokoData({
      nama: settings.companyName || '',
      alamat: settings.companyAddress || '',
      telepon: settings.companyPhone || '',
      email: settings.companyEmail || ''
    });

    setTaxSettings({
      enabled: settings.taxEnabled !== undefined ? settings.taxEnabled : true,
      rate: settings.taxRate || '10'
    });

    if (settings.logo) {
      setLogo(settings.logo);
      setLogoPreview(settings.logo);
    }
  };

  const saveTokoSettings = () => {
    const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
    
    const newSettings = {
      ...settings,
      companyName: tokoData.nama,
      companyAddress: tokoData.alamat,
      companyPhone: tokoData.telepon,
      companyEmail: tokoData.email
    };

    storage.set(STORAGE_KEYS.SETTINGS, newSettings);
    showAlert('Data toko berhasil disimpan', 'success');
  };

  const saveTaxSettings = () => {
    const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
    
    // Parse rate dengan atau tanpa separator titik
    const rateValue = typeof taxSettings.rate === 'string' 
      ? parseFloat(taxSettings.rate.replace(/\./g, '')) 
      : parseFloat(taxSettings.rate) || 0;
    
    const newSettings = {
      ...settings,
      taxEnabled: taxSettings.enabled,
      taxRate: rateValue
    };

    storage.set(STORAGE_KEYS.SETTINGS, newSettings);
    showAlert('Pengaturan pajak berhasil disimpan', 'success');
    
    // Update state to show formatted value
    setTaxSettings({ ...taxSettings, rate: rateValue.toString() });
  };

  const changePassword = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('Password baru tidak cocok', 'danger');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showAlert('Password minimal 6 karakter', 'danger');
      return;
    }

    // Verify current password
    const result = login(user.username, passwordData.currentPassword);
    if (!result.success) {
      showAlert('Password saat ini salah', 'danger');
      return;
    }

    // Update password
    const users = storage.getAll(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      users[userIndex].password = btoa(passwordData.newPassword);
      storage.set(STORAGE_KEYS.USERS, users);
      showAlert('Password berhasil diubah', 'success');
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('Ukuran file maksimal 2MB', 'danger');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showAlert('File harus berupa gambar', 'danger');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLogo(base64String);
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLogo = () => {
    if (logo) {
      const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
      settings.logo = logo;
      storage.set(STORAGE_KEYS.SETTINGS, settings);
      showAlert('Logo berhasil disimpan', 'success');
      // Reload page to update logo in sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-600 mt-1">Kelola pengaturan aplikasi</p>
      </div>

      {alert.show && (
        <Alert type={alert.type}>{alert.message}</Alert>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        {(user?.role === 'super_admin' || user?.role === 'admin' 
          ? ['toko', 'pajak', 'password', 'logo', 'database'] 
          : ['password']
        ).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'toko' && (
        <Card title="Data Toko">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Toko"
              value={tokoData.nama}
              onChange={(e) => setTokoData({ ...tokoData, nama: e.target.value })}
              placeholder="Masukkan nama toko"
            />
            <Input
              label="No. Telepon"
              value={tokoData.telepon}
              onChange={(e) => setTokoData({ ...tokoData, telepon: e.target.value })}
              placeholder="Masukkan nomor telepon"
            />
            <Input
              label="Email"
              type="email"
              value={tokoData.email}
              onChange={(e) => setTokoData({ ...tokoData, email: e.target.value })}
              placeholder="Masukkan email"
            />
          </div>
          <div className="mt-4">
            <Input
              label="Alamat"
              value={tokoData.alamat}
              onChange={(e) => setTokoData({ ...tokoData, alamat: e.target.value })}
              placeholder="Masukkan alamat toko"
            />
          </div>
          <div className="mt-6">
            <Button onClick={saveTokoSettings} variant="primary">
              <Building2 className="w-4 h-4 mr-2" />
              Simpan Data Toko
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'pajak' && (
        <Card title="Pengaturan Pajak">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Aktifkan Pajak</h3>
                <p className="text-sm text-gray-600">Gunakan perhitungan PPN untuk transaksi</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxSettings.enabled}
                  onChange={(e) => setTaxSettings({ ...taxSettings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {taxSettings.enabled && (
              <Input
                label="Tarif Pajak (%)"
                value={taxSettings.rate}
                onChange={(e) => handleNumberInputChange(e.target.value, (val) => 
                  setTaxSettings({ ...taxSettings, rate: val })
                )}
                placeholder="10"
              />
            )}
          </div>

          <div className="mt-6">
            <Button onClick={saveTaxSettings} variant="primary">
              Simpan Pengaturan Pajak
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card title="Ganti Password">
          <form onSubmit={changePassword} className="space-y-4">
            <Input
              label="Password Saat Ini"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
            />
            <Input
              label="Password Baru"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              minLength={6}
            />
            <Input
              label="Konfirmasi Password Baru"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
            />
            <div className="mt-6">
              <Button type="submit" variant="primary">
                <Lock className="w-4 h-4 mr-2" />
                Ubah Password
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'logo' && (
        <Card title="Logo Toko">
          <div className="space-y-4">
            {logoPreview && (
              <div className="flex justify-center mb-4">
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  className="h-32 object-contain border border-gray-200 rounded"
                />
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {!logoPreview && <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
              <p className="text-gray-600 mb-4">
                {logoPreview ? 'Ganti logo toko' : 'Upload logo toko'}
              </p>
              <label>
                <Button variant="outline" as="span">
                  <Upload className="w-4 h-4 mr-2" />
                  {logoPreview ? 'Pilih File Baru' : 'Pilih File'}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Format: JPG, PNG. Maks: 2MB
              </p>
            </div>
            {logoPreview && (
              <div className="flex space-x-2">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setLogo(null);
                    setLogoPreview(null);
                  }}
                >
                  Hapus
                </Button>
                <Button 
                  variant="primary" 
                  onClick={saveLogo}
                  className="flex-1"
                >
                  Simpan Logo
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'database' && (
        <Card title="Database Management">
          <div className="space-y-6">
            {/* Storage Persistence Status */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Persistent Storage</h3>
                  <p className="text-sm text-gray-600">Meminta izin browser untuk menyimpan data secara permanen</p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const granted = await storage.persistence.request();
                      showAlert(
                        granted 
                          ? 'Persistent storage berhasil diaktifkan' 
                          : 'Persistent storage tidak diizinkan browser',
                        granted ? 'success' : 'warning'
                      );
                    } catch (err) {
                      showAlert('Gagal mengaktifkan persistent storage', 'danger');
                    }
                  }}
                  variant="secondary"
                >
                  Request Persistence
                </Button>
              </div>
            </div>

            {/* Backup/Restore */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div>
                <h3 className="font-semibold">Backup & Restore</h3>
                <p className="text-sm text-gray-600">Export atau import data aplikasi</p>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  onClick={async () => {
                    try {
                      const data = await storage.backup();
                      const blob = new Blob(
                        [JSON.stringify(data, null, 2)], 
                        { type: 'application/json' }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      showAlert('Gagal membuat backup', 'danger');
                    }
                  }}
                  variant="primary"
                >
                  Export Backup
                </Button>

                <div>
                  <input
                    type="file"
                    id="restore-file"
                    className="hidden"
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const text = await file.text();
                        const data = JSON.parse(text);
                        await storage.restore(data);
                        showAlert('Data berhasil di-restore', 'success');
                        setTimeout(() => window.location.reload(), 1500);
                      } catch (err) {
                        showAlert('Gagal melakukan restore data', 'danger');
                      }

                      e.target.value = '';
                    }}
                  />
                  <Button
                    onClick={() => document.getElementById('restore-file').click()}
                    variant="secondary"
                  >
                    Import Backup
                  </Button>
                </div>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div>
                <h3 className="font-semibold">Storage Usage</h3>
                <p className="text-sm text-gray-600">Informasi penggunaan storage</p>
              </div>
              
              <Button
                onClick={async () => {
                  try {
                    const estimate = await storage.persistence.getEstimate();
                    if (estimate) {
                      const used = (estimate.usage / 1024 / 1024).toFixed(2);
                      const total = (estimate.quota / 1024 / 1024).toFixed(2);
                      showAlert(
                        `Storage: ${used}MB used of ${total}MB allocated`,
                        'success'
                      );
                    } else {
                      showAlert('Storage info tidak tersedia', 'warning');
                    }
                  } catch (err) {
                    showAlert('Gagal mendapatkan info storage', 'danger');
                  }
                }}
                variant="secondary"
              >
                Check Storage Usage
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Pengaturan;

