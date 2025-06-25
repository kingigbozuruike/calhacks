import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaNotesMedical, FaPills, FaDumbbell, FaHeart, FaCheck, FaCalendarAlt, FaUserMd, FaClipboardList, FaChevronLeft, FaChevronRight, FaStickyNote, FaSave } from 'react-icons/fa';
import Logo from '../components/Logo';

const DailyLogPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Task completion state
  const [dailyTasks, setDailyTasks] = useState([]);
  const [trimesterTasks, setTrimesterTasks] = useState([]);

  // Pagination state for trimester tasks
  const [currentTrimesterPage, setCurrentTrimesterPage] = useState(1);
  const trimesterTasksPerPage = 5;

  // Journal/Notes state
  const [journalEntry, setJournalEntry] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch dashboard data from backend
    const fetchDashboardData = async () => {
      console.log('🚀 DailyLog: Starting data fetch');

      try {
        // Fetch both dashboard data and profile data
        const [dashboardResponse, profileResponse, notesResponse] = await Promise.all([
          fetch('https://calhacks.onrender.com/api/dashboard', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('https://calhacks.onrender.com/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('https://calhacks.onrender.com/api/notes/recent?limit=3', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        console.log('📊 DailyLog: Dashboard response status:', dashboardResponse.status);
        console.log('👤 DailyLog: Profile response status:', profileResponse.status);
        console.log('📝 DailyLog: Notes response status:', notesResponse.status);

        if (dashboardResponse.ok && profileResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          const profileData = await profileResponse.json();

          console.log('📊 DailyLog: Dashboard data received:', dashboardData);
          console.log('👤 DailyLog: Profile data received:', profileData);

          // Merge the data
          const mergedData = {
            ...dashboardData.data,
            user: {
              ...dashboardData.data.user,
              email: profileData.email
            }
          };

          setDashboardData(mergedData);

          // Set tasks from backend data
          if (mergedData.tasks) {
            setDailyTasks(mergedData.tasks.today || []);
            setTrimesterTasks(mergedData.tasks.trimester || []);
          }

          // Extract user name from email
          const emailName = profileData.email ? profileData.email.split('@')[0] : 'Alice';
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));

          // Load recent notes if available
          if (notesResponse.ok) {
            const notesData = await notesResponse.json();
            setRecentNotes(notesData.data.notes || []);
          }
        } else {
          console.error('❌ DailyLog: API responses not OK');
          console.error('Failed to load dashboard data');
        }
      } catch (err) {
        console.error('❌ DailyLog: Fetch error:', err);
        console.error('Network error. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const toggleDailyTask = (taskId) => {
    setDailyTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const toggleTrimesterTask = (taskId) => {
    setTrimesterTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const getTaskIcon = (category) => {
    const iconMap = {
      'health': <FaUserMd className="text-blue-400" />,
      'nutrition': <FaPills className="text-purple-400" />,
      'exercise': <FaDumbbell className="text-green-400" />,
      'wellness': <FaHeart className="text-pink-400" />,
      'medical': <FaNotesMedical className="text-red-400" />,
      'preparation': <FaClipboardList className="text-indigo-400" />,
      'monitoring': <FaCalendarAlt className="text-yellow-400" />,
      'default': <FaCheck className="text-gray-400" />
    };
    return iconMap[category] || iconMap['default'];
  };

  const getTrimesterTitle = (trimester) => {
    const titles = {
      1: 'First Trimester',
      2: 'Second Trimester',
      3: 'Third Trimester'
    };
    return titles[trimester] || 'Current Trimester';
  };

  // Pagination logic for trimester tasks
  const totalTrimesterPages = Math.ceil(trimesterTasks.length / trimesterTasksPerPage);
  const startIndex = (currentTrimesterPage - 1) * trimesterTasksPerPage;
  const endIndex = startIndex + trimesterTasksPerPage;
  const currentTrimesterTasks = trimesterTasks.slice(startIndex, endIndex);

  const handleTrimesterPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalTrimesterPages) {
      setCurrentTrimesterPage(newPage);
    }
  };

  // Journal/Notes functionality
  const handleSaveNote = async () => {
    if (!journalEntry.trim()) return;

    setIsSavingNote(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('https://calhacks.onrender.com/api/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: journalEntry.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRecentNotes(prev => [result.data, ...prev.slice(0, 2)]); // Keep only 3 recent notes
        setJournalEntry('');
        console.log('Note saved successfully');
      } else {
        console.error('Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Show loading screen while data is loading
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-carnation-pink"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2" style={{fontFamily: 'Poppins'}}>
            Loading your daily log...
          </h2>
          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>
            Getting your tasks ready
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decorative Background Icons */}
      <FaHeart className="absolute top-0 left-0 text-pink-100 opacity-50 text-9xl transform -translate-x-1/2 -translate-y-1/2 rotate-12" />
      <FaHeart className="absolute bottom-0 right-0 text-purple-100 opacity-50 text-9xl transform translate-x-1/2 translate-y-1/2 -rotate-12" />

      <header className="flex justify-center pt-8">
        <Logo className="text-4xl" />
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{fontFamily: 'Poppins'}}>
            Daily Log - {userName}
          </h1>
          <p className="text-lg text-gray-600" style={{fontFamily: 'Poppins'}}>
            {dashboardData ? `Week ${dashboardData.user.weekOfPregnancy} - ${getTrimesterTitle(dashboardData.user.trimester)}` : 'Track your pregnancy journey'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Daily Tasks Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{fontFamily: 'Poppins'}}>
              Today's Tasks
            </h2>
            <div className="space-y-3">
              {dailyTasks.length > 0 ? (
                dailyTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center">
                      <div className="text-2xl mr-4">{getTaskIcon(task.category)}</div>
                      <div>
                        <p className="font-semibold text-gray-800 text-base">
                          {task.title || task.description || task.content}
                        </p>
                        {task.description && task.title && (
                          <p className="text-sm text-gray-500">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleDailyTask(task.id)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 transform hover:scale-110 ${
                        task.isCompleted
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <FaCheck className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FaClipboardList className="text-gray-300 text-4xl mx-auto mb-4" />
                  <p className="text-gray-500">No daily tasks available</p>
                </div>
              )}
            </div>
          </div>

          {/* Trimester Tasks Section with Pagination */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800" style={{fontFamily: 'Poppins'}}>
                {dashboardData ? getTrimesterTitle(dashboardData.user.trimester) : 'Trimester'} Tasks
              </h2>
              {totalTrimesterPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTrimesterPageChange(currentTrimesterPage - 1)}
                    disabled={currentTrimesterPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentTrimesterPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentTrimesterPage} of {totalTrimesterPages}
                  </span>
                  <button
                    onClick={() => handleTrimesterPageChange(currentTrimesterPage + 1)}
                    disabled={currentTrimesterPage === totalTrimesterPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentTrimesterPage === totalTrimesterPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {currentTrimesterTasks.length > 0 ? (
                currentTrimesterTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center">
                      <div className="text-2xl mr-4">{getTaskIcon(task.category)}</div>
                      <div>
                        <p className="font-semibold text-gray-800 text-base">
                          {task.title || task.description || task.content}
                        </p>
                        {task.description && task.title && (
                          <p className="text-sm text-gray-500">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTrimesterTask(task.id)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 transform hover:scale-110 ${
                        task.isCompleted
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <FaCheck className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FaClipboardList className="text-gray-300 text-4xl mx-auto mb-4" />
                  <p className="text-gray-500">No trimester tasks available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Journal/Notes Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800" style={{fontFamily: 'Poppins'}}>
              <FaStickyNote className="inline mr-3 text-yellow-500" />
              My Journal
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Write New Note */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Write a note</h3>
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="How are you feeling today? Share your thoughts, experiences, or anything on your mind..."
                className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                maxLength={2000}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {journalEntry.length}/2000 characters
                </span>
                <button
                  onClick={handleSaveNote}
                  disabled={!journalEntry.trim() || isSavingNote}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    !journalEntry.trim() || isSavingNote
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-carnation-pink text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <FaSave />
                  <span>{isSavingNote ? 'Saving...' : 'Save Note'}</span>
                </button>
              </div>
            </div>

            {/* Recent Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Recent entries</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {recentNotes.length > 0 ? (
                  recentNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{note.formattedDate}</span>
                        {note.weekOfPregnancy && (
                          <span>Week {note.weekOfPregnancy}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FaStickyNote className="text-gray-300 text-3xl mx-auto mb-2" />
                    <p>No journal entries yet</p>
                    <p className="text-sm">Start writing to track your journey!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Progress Summary */}
        {dashboardData && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center" style={{fontFamily: 'Poppins'}}>
              Today's Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-500 mb-2">
                  {dailyTasks.filter(task => task.isCompleted).length}/{dailyTasks.length}
                </div>
                <p className="text-gray-600">Daily Tasks Completed</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">
                  {trimesterTasks.filter(task => task.isCompleted).length}/{trimesterTasks.length}
                </div>
                <p className="text-gray-600">Trimester Tasks Completed</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Back to Dashboard Button */}
      <Link to="/dashboard">
        <button className="fixed bottom-6 left-6 w-16 h-16 bg-carnation-pink rounded-full shadow-lg hover:bg-black hover:text-white transition-colors flex items-center justify-center z-50">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </Link>

      {/* Floating Chat Button */}
      <Link to="/chat">
        <button className="fixed bottom-6 right-6 w-16 h-16 bg-carnation-pink rounded-full shadow-lg hover:bg-black hover:text-white transition-colors flex items-center justify-center z-50">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </Link>
    </div>
  );
};

export default DailyLogPage;
