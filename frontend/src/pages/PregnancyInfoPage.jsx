import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHeader from '../components/SimpleHeader';

const PregnancyInfoPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lastMenstrualPeriod: '',
    conceptionDate: '',
    dueDate: '',
    dateType: 'lmp' // 'lmp' for Last Menstrual Period or 'conception' for Conception Date
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const calculateDueDate = (lmpDate) => {
    const lmp = new Date(lmpDate);
    const dueDate = new Date(lmp);
    dueDate.setDate(dueDate.getDate() + 280); // 40 weeks = 280 days
    return dueDate.toISOString().split('T')[0];
  };

  const calculateConceptionDate = (lmpDate) => {
    const lmp = new Date(lmpDate);
    const conception = new Date(lmp);
    conception.setDate(conception.getDate() + 14); // Ovulation typically occurs 14 days after LMP
    return conception.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (formData.dateType === 'lmp' && !formData.lastMenstrualPeriod) {
      setError('Please enter your last menstrual period date');
      return;
    }

    if (formData.dateType === 'conception' && !formData.conceptionDate) {
      setError('Please enter your conception date');
      return;
    }

    setLoading(true);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Calculate dates based on input
      let lmpDate, conceptionDate, dueDate;

      if (formData.dateType === 'lmp') {
        lmpDate = formData.lastMenstrualPeriod;
        conceptionDate = calculateConceptionDate(lmpDate);
        dueDate = calculateDueDate(lmpDate);
      } else {
        conceptionDate = formData.conceptionDate;
        const conception = new Date(conceptionDate);
        const lmp = new Date(conception);
        lmp.setDate(lmp.getDate() - 14);
        lmpDate = lmp.toISOString().split('T')[0];
        dueDate = calculateDueDate(lmpDate);
      }

      // Update user profile with pregnancy information
      const response = await fetch('http://localhost:5000/api/profile/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pregnancyStage: 'track_pregnancy',
          conceptionDate: conceptionDate
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show loading for 2 seconds before redirecting
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(data.msg || 'Failed to save pregnancy information. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Pregnancy info error:', err);
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while processing
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-carnation-pink"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2" style={{fontFamily: 'Poppins'}}>
            Setting up your pregnancy journey...
          </h2>
          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>
            Calculating your due date and preparing your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SimpleHeader />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg">
          <div className="flex justify-center mb-4">
            <img src="/images/get-pregnant-icon2.svg" alt="Pregnancy Info" className="h-32" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2" style={{fontFamily: 'Poppins'}}>
            Let's track your pregnancy!
          </h2>

          <p className="text-gray-600 text-center mb-6" style={{fontFamily: 'Poppins'}}>
            Help us calculate your due date and personalize your experience
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Date Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3" style={{fontFamily: 'Poppins'}}>
                  Which date do you know?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="dateType"
                      value="lmp"
                      checked={formData.dateType === 'lmp'}
                      onChange={handleChange}
                      className="mr-2 text-carnation-pink"
                    />
                    <span className="text-sm text-gray-700" style={{fontFamily: 'Poppins'}}>
                      First day of my last menstrual period
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="dateType"
                      value="conception"
                      checked={formData.dateType === 'conception'}
                      onChange={handleChange}
                      className="mr-2 text-carnation-pink"
                    />
                    <span className="text-sm text-gray-700" style={{fontFamily: 'Poppins'}}>
                      Conception date (if known)
                    </span>
                  </label>
                </div>
              </div>

              {/* Date Input */}
              {formData.dateType === 'lmp' && (
                <div>
                  <label htmlFor="lastMenstrualPeriod" className="block text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins'}}>
                    First Day of Last Menstrual Period
                  </label>
                  <input
                    type="date"
                    id="lastMenstrualPeriod"
                    name="lastMenstrualPeriod"
                    value={formData.lastMenstrualPeriod}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thistle focus:border-thistle"
                    required
                  />
                </div>
              )}

              {formData.dateType === 'conception' && (
                <div>
                  <label htmlFor="conceptionDate" className="block text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins'}}>
                    Conception Date
                  </label>
                  <input
                    type="date"
                    id="conceptionDate"
                    name="conceptionDate"
                    value={formData.conceptionDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thistle focus:border-thistle"
                    required
                  />
                </div>
              )}

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
                {loading ? 'Setting up...' : 'Continue to Dashboard'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PregnancyInfoPage;
