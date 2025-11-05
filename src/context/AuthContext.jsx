import { createContext, useContext, useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../utils/localStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ensure user data is complete and up to date
  const migrateUserData = (savedUser) => {
    if (!savedUser) return null;
    
    // Find complete user data from users collection
    const users = storage.getAll(STORAGE_KEYS.USERS);
    const fullUserData = users.find(u => u.id === savedUser.id);
    
    if (fullUserData) {
      // Merge saved user with complete data, excluding password
      const { password, ...userWithoutPassword } = fullUserData;
      const updatedUser = { ...savedUser, ...userWithoutPassword };
      storage.set(STORAGE_KEYS.AUTH, updatedUser);
      return updatedUser;
    }
    
    return savedUser;
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = storage.get(STORAGE_KEYS.AUTH);
    if (savedUser) {
      const migratedUser = migrateUserData(savedUser);
      setUser(migratedUser);
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (username, password) => {
    const users = storage.getAll(STORAGE_KEYS.USERS);
    // Hash the password for comparison
    const hashedPassword = btoa(password);
    
    const foundUser = users.find(
      u => u.username === username && u.password === hashedPassword && u.status === 'active'
    );

    if (foundUser) {
      // Remove password from user object
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      storage.set(STORAGE_KEYS.AUTH, userWithoutPassword);
      return { success: true, user: userWithoutPassword };
    }

    return { success: false, message: 'Username atau password salah' };
  };

  // Logout function
  const logout = () => {
    setUser(null);
    storage.remove(STORAGE_KEYS.AUTH);
  };

  // Get current user info
  const getCurrentUser = () => {
    return storage.get(STORAGE_KEYS.AUTH);
  };

  // Update current user
  const updateCurrentUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    storage.set(STORAGE_KEYS.AUTH, updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    getCurrentUser,
    updateCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

