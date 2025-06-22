import { useState } from 'react';
import SimpleHeader from '../components/SimpleHeader';

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Redirect to home or dashboard
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SimpleHeader />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg">
          <div className="flex justify-center mb-4">
            <img src="/images/signup-modal-image.svg" alt="Sign Up" className="h-32" />
          </div>

          <h2 className="text-2xl font-semibold text-thistle text-center mb-6" style={{fontFamily: 'Poppins'}}>
            Join bump today
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
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-carnation-pink hover:bg-black transition-colors font-medium" 
                style={{fontFamily: 'Fredoka'}}
              >
                Create Account
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <a href="/" className="text-sm text-thistle hover:underline" style={{fontFamily: 'Poppins'}}>
                Already have an account? Log in
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default SignUp;