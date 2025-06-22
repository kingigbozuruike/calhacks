import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center space-x-2">
        {type === 'success' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-75">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const handleVoiceCall = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please log in to use the voice assistant', 'error');
        return;
      }

      // Check if user has a phone number stored
      if (!dashboardData?.user?.phoneNumber) {
        showToast('Please update your profile with a phone number to use the voice assistant', 'error');
        return;
      }

      const response = await fetch('http://localhost:5000/api/voice-checkin/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: dashboardData.user.phoneNumber,
          userId: dashboardData?.user?.userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        showToast('Voice call initiated! You should receive a call shortly.', 'success');
        console.log('Voice call started:', result);
      } else {
        const error = await response.json();
        showToast(`Failed to start voice call: ${error.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error starting voice call:', error);
      showToast('Failed to start voice call. Please try again.', 'error');
    }
  };

  // Pregnancy stages with detailed progress
  const pregnancyStages = [
    { name: 'Conception', weeks: 0 },
    { name: 'First Trimester', weeks: 12 },
    { name: 'Second Trimester', weeks: 27 },
    { name: 'Third Trimester', weeks: 40 },
    { name: 'Postpartum', weeks: 46 }
  ];

  // Baby size by week (you can expand this with more weeks)
  const babySizeByWeek = {
    4: { size: 'poppy seed', image: '/images/week4.png', length: '0.04 inches' },
    8: { size: 'raspberry', image: '/images/week8.png', length: '0.63 inches' },
    12: { size: 'lime', image: '/images/week12.png', length: '2.13 inches' },
    16: { size: 'avocado', image: '/images/week16.png', length: '4.57 inches' },
    20: { size: 'banana', image: '/images/week20.png', length: '6.46 inches' },
    24: { size: 'ear of corn', image: '/images/week24.png', length: '11.81 inches' },
    28: { size: 'eggplant', image: '/images/week28.png', length: '14.80 inches' },
    32: { size: 'jicama', image: '/images/week32.png', length: '16.69 inches' },
    36: { size: 'romaine lettuce', image: '/images/week36.png', length: '18.66 inches' },
    40: { size: 'watermelon', image: '/images/week40.png', length: '20.16 inches' },
  };

  const getCurrentBabySize = (week) => {
    const weekKeys = Object.keys(babySizeByWeek).map(Number).sort((a, b) => a - b);
    const closestWeek = weekKeys.reduce((prev, curr) =>
      Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
    );
    return babySizeByWeek[closestWeek];
  };

  const getCurrentTrimester = (week) => {
    if (week <= 12) return 1;
    if (week <= 27) return 2;
    return 3;
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch dashboard data from backend
    const fetchDashboardData = async () => {
      console.log('🚀 Frontend: Starting dashboard data fetch');
      console.log('🔑 Frontend: Token exists:', !!token);
      console.log('🔑 Frontend: Token value:', token?.substring(0, 20) + '...');

      try {
        console.log('📡 Frontend: Making API calls to dashboard and profile');

        // Fetch both dashboard data and profile data
        const [dashboardResponse, profileResponse] = await Promise.all([
          fetch('http://localhost:5000/api/dashboard', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('http://localhost:5000/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        console.log('📊 Frontend: Dashboard response status:', dashboardResponse.status);
        console.log('👤 Frontend: Profile response status:', profileResponse.status);

        if (dashboardResponse.ok && profileResponse.ok) {
          console.log('✅ Frontend: Both responses OK, parsing JSON...');

          const dashboardData = await dashboardResponse.json();
          const profileData = await profileResponse.json();

          console.log('📊 Frontend: Dashboard data received:', dashboardData);
          console.log('👤 Frontend: Profile data received:', profileData);

          // Merge the data, adding profile info (including dueDate) to dashboard data
          const mergedData = {
            ...dashboardData.data,
            user: {
              ...dashboardData.data.user,
              dueDate: profileData.dueDate,
              email: profileData.email
            }
          };

          console.log('🔄 Frontend: Merged data:', mergedData);
          setDashboardData(mergedData);

          // Extract user name from email or use placeholder
          const emailName = profileData.email ? profileData.email.split('@')[0] : 'Alice';
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
          console.log('👤 Frontend: Set username to:', emailName);
        } else {
          console.error('❌ Frontend: API responses not OK');
          console.error('📊 Dashboard response:', await dashboardResponse.text());
          console.error('👤 Profile response:', await profileResponse.text());
          console.error('Failed to load dashboard data');
        }
      } catch (err) {
        console.error('❌ Frontend: Dashboard fetch error:', err);
        console.error('Network error. Please check your connection.');
      } finally {
        // Show loading for at least 2 seconds for better UX
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Show loading screen while dashboard is loading
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-carnation-pink"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2" style={{fontFamily: 'Poppins'}}>
            Loading your dashboard...
          </h2>
          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>
            Getting everything ready for you
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-100 rounded-full opacity-50" />
      <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-pink-100 rounded-full opacity-50" />

      <header className="relative z-10 flex justify-center pt-8">
        <Logo className="text-4xl" />
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center pt-8">
        <div className="w-full max-w-6xl px-4">
          {/* Welcome Section - Horizontal Layout */}
          <div className="flex justify-between items-start mb-6">
            {/* Left side - Welcome message */}
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{fontFamily: 'Poppins'}}>
                Welcome back, {userName}!
              </h1>
              <p className="text-lg text-gray-600" style={{fontFamily: 'Poppins'}}>
                It's a great day to carry greatness
              </p>
            </div>

            {/* Right side - Expected Date of Delivery */}
            {dashboardData?.user?.dueDate && (
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-4 min-w-max">
                <p className="text-sm text-gray-600 mb-1 text-center" style={{fontFamily: 'Poppins'}}>Expected Date of Delivery</p>
                <p className="text-xl font-bold text-gray-800 text-center" style={{fontFamily: 'Poppins'}}>
                  {new Date(dashboardData.user.dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-1 text-center" style={{fontFamily: 'Poppins'}}>
                  {Math.ceil((new Date(dashboardData.user.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days to go
                </p>
              </div>
            )}
          </div>

          {/* Detailed Progress Bar */}
          {dashboardData && (
            <div className="relative mb-12 bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800" style={{fontFamily: 'Poppins'}}>
                  Week {dashboardData.user.weekOfPregnancy} - {getCurrentTrimester(dashboardData.user.weekOfPregnancy) === 1 ? 'First' : getCurrentTrimester(dashboardData.user.weekOfPregnancy) === 2 ? 'Second' : 'Third'} Trimester
                </h2>
                <span className="text-sm text-gray-600">{dashboardData.trimesterProgress.overallProgress}% Complete</span>
              </div>

              <div className="relative w-full h-2 bg-gray-200 rounded-full mb-4">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${dashboardData.trimesterProgress.overallProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                {pregnancyStages.map((stage, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      dashboardData.user.weekOfPregnancy >= stage.weeks ? 'bg-pink-400' : 'bg-gray-300'
                    }`} />
                    <span>{stage.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Today's Tip Card */}
            <div className="bg-purple-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Poppins'}}>
                Today's Tip
              </h3>
              <div className="space-y-3">
                {dashboardData?.dailyContent?.tip ? (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm">
                      {typeof dashboardData.dailyContent.tip === 'object'
                        ? dashboardData.dailyContent.tip.content || dashboardData.dailyContent.tip.title
                        : dashboardData.dailyContent.tip}
                    </p>
                  </div>
                ) : (
                  // Fallback tips if backend data is not available
                  ['Stay hydrated - aim for 8-10 glasses of water daily', 'Take your prenatal vitamins with food', 'Get plenty of rest - your body is working hard'].map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm">{tip}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Daily Todo Card - Clickable */}
            <Link to="/daily-log" className="block">
              <div className="bg-pink-50 rounded-2xl p-6 hover:bg-pink-100 transition-colors cursor-pointer">
                <h3 className="text-xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Poppins'}}>
                  Daily Todo
                </h3>
                <div className="space-y-2 mb-4">
                  {dashboardData?.tasks?.today?.length > 0 ? (
                    dashboardData.tasks.today.slice(0, 4).map((task, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">
                          {typeof task === 'object'
                            ? (task.title || task.description || task.content)
                            : task}
                        </span>
                      </div>
                    ))
                  ) : (
                    // Fallback todos if backend data is not available
                    ['Take prenatal vitamins', 'Drink 8 glasses of water', 'Do 30 minutes of gentle exercise', 'Practice mindfulness or meditation'].map((todo, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">{todo}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="w-full bg-carnation-pink text-black py-2 px-4 rounded-lg font-medium text-center text-sm" style={{fontFamily: 'Fredoka'}}>
                  View & Complete Tasks →
                </div>
              </div>
            </Link>

            {/* Affirmations Card */}
            <div className="bg-green-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Poppins'}}>
                Daily Affirmation
              </h3>
              <div className="text-center">
                <p className="text-lg text-gray-700 italic mb-4" style={{fontFamily: 'Poppins'}}>
                  "{dashboardData?.dailyContent?.affirmation
                    ? (typeof dashboardData.dailyContent.affirmation === 'object'
                        ? dashboardData.dailyContent.affirmation.content || dashboardData.dailyContent.affirmation.title
                        : dashboardData.dailyContent.affirmation)
                    : 'My body is creating a miracle'}"
                </p>
              </div>
            </div>
          </div>

          {/* Did You Know and Baby Size Cards - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Did You Know Card */}
            {dashboardData?.dailyContent?.didYouKnow && (
              <div className="bg-blue-50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Poppins'}}>
                  Did You Know?
                </h3>
                <p className="text-gray-700">
                  {typeof dashboardData.dailyContent.didYouKnow === 'object'
                    ? dashboardData.dailyContent.didYouKnow.content || dashboardData.dailyContent.didYouKnow.title
                    : dashboardData.dailyContent.didYouKnow}
                </p>
              </div>
            )}

            {/* Baby Size Visualizer */}
            {dashboardData && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Poppins'}}>
                  Your Baby at Week {dashboardData.user.weekOfPregnancy}
                </h2>
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-24 h-24">
                    <img
                      src={getCurrentBabySize(dashboardData.user.weekOfPregnancy).image}
                      alt={getCurrentBabySize(dashboardData.user.weekOfPregnancy).size}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = '/images/watermelon.png'; // Fallback image
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-700 mb-1">Your baby is about the size of</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{getCurrentBabySize(dashboardData.user.weekOfPregnancy).size}</p>
                    <p className="text-sm text-gray-600">Length: {getCurrentBabySize(dashboardData.user.weekOfPregnancy).length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Voice Assistant Call Button */}
      <button
        onClick={handleVoiceCall}
        className="fixed bottom-6 right-6 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg transition-colors flex items-center space-x-2 z-50"
        style={{fontFamily: 'Poppins'}}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="text-sm font-medium">Wanna talk? Call me</span>
      </button>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default DashboardPage;
