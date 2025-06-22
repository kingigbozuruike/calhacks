import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SimpleHeader from '../components/SimpleHeader';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the JWT token
        localStorage.setItem('token', data.token);

        // Redirect to dashboard after successful login
        navigate('/dashboard');
      } else {
        setError(data.msg || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SimpleHeader />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg">
          <div className="flex justify-center mb-4">
            <img src="/images/signup-modal-image.svg" alt="Login" className="h-32" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6" style={{fontFamily: 'Poppins'}}>
            Welcome back to Bump!
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins'}}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thistle focus:border-thistle"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins'}}>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thistle focus:border-thistle"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-carnation-pink hover:bg-black hover:text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{fontFamily: 'Fredoka'}}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <Link to="/signup" className="text-sm text-thistle hover:underline" style={{fontFamily: 'Poppins'}}>
                Don't have an account? Sign up
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
