import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// Images are now served from public/images
// No need to import images when they're in the public folder
import { FaNotesMedical, FaPills, FaDumbbell, FaBed, FaWeight, FaHeart, FaCheck, FaCalendarAlt, FaUserMd, FaBaby, FaHospital, FaClipboardList } from 'react-icons/fa';
import Logo from '../components/Logo';
import DateSelector from '../components/DateSelector';

const DailyLogPage = () => {
  const [searchParams] = useSearchParams();
  const trimester = parseInt(searchParams.get('trimester')) || 1;
  const [currentWeek, setCurrentWeek] = useState(trimester === 1 ? 6 : trimester === 2 ? 18 : 32);

  const trimesterWeeks = {
    1: Array.from({ length: 12 }, (_, i) => i + 1), // weeks 1-12
    2: Array.from({ length: 14 }, (_, i) => i + 13), // weeks 13-26
    3: Array.from({ length: 14 }, (_, i) => i + 27), // weeks 27-40
  };

  const trimesterTasks = {
    1: [
      { id: 1, title: 'Confirm Pregnancy', frequency: 'Schedule initial prenatal visit', completed: false, icon: <FaUserMd className="text-blue-400" /> },
      { id: 2, title: 'Prenatal Vitamins', frequency: 'Take daily (folic acid, iron, DHA)', completed: true, icon: <FaPills className="text-purple-400" /> },
      { id: 3, title: 'Track Symptoms', frequency: 'Log nausea, urination, mood changes', completed: false, icon: <FaNotesMedical className="text-pink-400" /> },
      { id: 4, title: 'Light Exercise', frequency: 'Begin gentle routine', completed: false, icon: <FaDumbbell className="text-green-400" /> },
      { id: 5, title: 'Rest & Hydration', frequency: '7+ hours sleep, 8-10 glasses water', completed: false, icon: <FaBed className="text-indigo-400" /> },
    ],
    2: [
      { id: 1, title: 'Regular Checkups', frequency: 'Schedule anatomy scan (week 18-20)', completed: false, icon: <FaUserMd className="text-blue-400" /> },
      { id: 2, title: 'Nutrition & Hydration', frequency: 'Optimize diet and water intake', completed: false, icon: <FaPills className="text-purple-400" /> },
      { id: 3, title: 'Childbirth Classes', frequency: 'Enroll in preparation classes', completed: false, icon: <FaClipboardList className="text-pink-400" /> },
      { id: 4, title: 'Fetal Movement', frequency: 'Monitor kick counts daily', completed: false, icon: <FaBaby className="text-green-400" /> },
      { id: 5, title: 'Exercise Routine', frequency: 'Continue gentle exercise', completed: false, icon: <FaDumbbell className="text-indigo-400" /> },
    ],
    3: [
      { id: 1, title: 'Frequent Visits', frequency: 'Biweekly, then weekly from week 36', completed: false, icon: <FaUserMd className="text-blue-400" /> },
      { id: 2, title: 'Birth Plan', frequency: 'Prepare plan and hospital bag', completed: false, icon: <FaClipboardList className="text-purple-400" /> },
      { id: 3, title: 'Nursery Setup', frequency: 'Pack for delivery, set up nursery', completed: false, icon: <FaBaby className="text-pink-400" /> },
      { id: 4, title: 'Monitor Signs', frequency: 'Watch for labor, preeclampsia, diabetes', completed: false, icon: <FaNotesMedical className="text-green-400" /> },
      { id: 5, title: 'Hospital Prep', frequency: 'Finalize delivery arrangements', completed: false, icon: <FaHospital className="text-indigo-400" /> },
    ],
  };

  const [monitoringItems, setMonitoringItems] = useState(trimesterTasks[trimester]);

  const [badges, setBadges] = useState([
    { id: 1, title: 'First Trimester Health Star', earned: trimester === 1, icon: '🏅' },
    { id: 2, title: 'Second Trimester Champion', earned: trimester === 2, icon: '🌟' },
    { id: 3, title: 'Third Trimester Warrior', earned: trimester === 3, icon: '💪' },
    { id: 4, title: `Logged symptoms ${trimester === 1 ? '7' : trimester === 2 ? '14' : '21'} days in a row`, earned: trimester === 3, icon: '🗓️' },
  ]);

  const toggleItem = (id) => {
    setMonitoringItems(
      monitoringItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getTrimesterTitle = () => {
    const titles = {
      1: 'First Trimester',
      2: 'Second Trimester', 
      3: 'Third Trimester'
    };
    return titles[trimester];
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decorative Background Icons */}
      <FaHeart className="absolute top-0 left-0 text-pink-100 opacity-50 text-9xl transform -translate-x-1/2 -translate-y-1/2 rotate-12" />
      <FaHeart className="absolute bottom-0 right-0 text-purple-100 opacity-50 text-9xl transform translate-x-1/2 translate-y-1/2 -rotate-12" />
      
      <header className="flex justify-center pt-8">
        <Logo className="text-4xl" />
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <DateSelector trimester={trimester} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* To Do Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 h-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 font-fredoka">To Do</h2>
            <div className="space-y-3">
              {monitoringItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{item.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 transform hover:scale-110 ${
                        item.completed
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <FaCheck className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How are you feeling Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 flex flex-col">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 font-fredoka">How are you feeling?</h2>
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              <img src="/images/husband and wife 2.webp" alt="Support" className="w-64 h-64 object-cover rounded-full mb-6 shadow-md"/>
              <p className="text-gray-600 mb-6 text-lg">Share your thoughts and feelings to get personalized support.</p>
              <Link to={`/chat?trimester=${trimester}`}>
                <button className="bg-pink-400 text-white font-bold py-3 px-8 rounded-lg hover:bg-pink-500 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Share Your Feelings
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 font-fredoka text-center">Your Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center flex flex-col items-center justify-center transition-all duration-300 transform hover:-translate-y-1 ${
                  badge.earned ? 'opacity-100' : 'opacity-50 grayscale'
                }`}
              >
                <div className="text-6xl mb-4">{badge.icon}</div>
                <h3 className="font-semibold text-gray-800 text-sm">{badge.title}</h3>
                {badge.earned && (
                  <span className="mt-2 inline-block bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    EARNED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DailyLogPage; 