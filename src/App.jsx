import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { seedData } from './utils/seedData';
import { useEffect } from 'react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Inventory from './pages/Inventory';
import Kasir from './pages/Kasir';
import Laporan from './pages/Laporan';
import Pengaturan from './pages/Pengaturan';
import Pengeluaran from './pages/Pengeluaran';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  useEffect(() => {
    // Migrate any persisted IndexedDB data into localStorage before seeding
    // so seedData does not overwrite existing user data.
    import('./utils/localStorage').then(({ storage }) => {
      storage.migrateFromIndexedDB().then(() => {
        seedData();
      }).catch(() => {
        // If migration fails, still attempt to seed
        seedData();
      });
    }).catch(() => {
      seedData();
    });
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                <Layout>
                  <Inventory />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/kasir"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'kasir']}>
                <Layout>
                  <Kasir />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/laporan"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'kasir']}>
                <Layout>
                  <Laporan />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/pengeluaran"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                <Layout>
                  <Pengeluaran />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/pengaturan"
            element={
              <ProtectedRoute>
                <Layout>
                  <Pengaturan />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

