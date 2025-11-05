import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = login(username, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login gagal');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Sistem POS</h1>
            <p className="text-gray-600 mt-2">Masuk ke akun Anda</p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert type="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo Account:</p>
            <p className="mt-2 font-mono">
              <strong>Username:</strong> admin2<br />
              <strong>Password:</strong> admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;





