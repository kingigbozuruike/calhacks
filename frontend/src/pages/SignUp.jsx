import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SimpleHeader from '../components/SimpleHeader';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }

    if (!formData.age || formData.age < 1 || formData.age > 120) {
      setError("Please enter a valid age!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://calhacks.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: parseInt(formData.age),
          phoneNumber: formData.phoneNumber
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the JWT token
        localStorage.setItem('token', data.token);

        // Show confirmation message
        setShowConfirmation(true);

        // Redirect to home page after brief confirmation
        setTimeout(() => {
          navigate('/home');
        }, 2500);
      } else {
        setError(data.msg || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation page if signup was successful
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <SimpleHeader />

        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-lg text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
              Welcome to Bump!
            </h2>

            <p className="text-gray-600 mb-4" style={{fontFamily: 'Poppins'}}>
              Your account has been created successfully. You're all set to start your pregnancy journey with us!
            </p>

            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-carnation-pink"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SimpleHeader />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg">
          <div className="flex justify-center mb-4">
            <img src="/images/signup-modal-image.svg" alt="Sign Up" className="h-32" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6" style={{fontFamily: 'Poppins'}}>
            Join Bump today!
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins'}}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thistle focus:border-thistle"
                  required
                />
              </div>

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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins'}}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thistle focus:border-thistle"
                  required
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins'}}>
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="1"
                  max="120"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thistle focus:border-thistle"
                  required
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins'}}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1234567890"
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-thistle hover:underline" style={{fontFamily: 'Poppins'}}>
                Already have an account? Log in
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default SignUp;
