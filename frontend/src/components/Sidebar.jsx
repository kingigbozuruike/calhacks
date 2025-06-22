import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaComment, FaCog, FaSignOutAlt, FaTachometerAlt, FaClipboardList } from 'react-icons/fa';
import Logo from './Logo';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    closeSidebar();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/daily-log', name: 'Daily Log', icon: <FaClipboardList /> },
    { path: '/chat', name: 'Chat', icon: <FaComment /> },
    { path: '/settings', name: 'Settings', icon: <FaCog /> },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-8 left-6 z-50 p-2 text-purple-500 hover:text-purple-700 transition-colors"
        aria-label="Toggle navigation"
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-carnation-pink" style={{fontFamily: 'Poppins'}}>Menu</h2>
            <button onClick={closeSidebar} className="text-gray-500 hover:text-black">
              <FaTimes />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center p-3 mb-6 border-b border-gray-200 pb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 mr-3">
              <img src="/images/chat-avatar-lady.svg" alt="User" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800" style={{fontFamily: 'Poppins'}}>Alice</p>
              <p className="text-xs text-gray-500">Week 24</p>
            </div>
          </div>

          <nav className="flex-grow">
            <ul className="space-y-4">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={closeSidebar}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-carnation-pink text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span style={{fontFamily: 'Poppins'}}>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="mr-3"><FaSignOutAlt /></span>
              <span style={{fontFamily: 'Poppins'}}>Logout</span>
            </button>
          </div>

          {/* Logo at bottom */}
          <div className="pt-6 flex justify-center">
            <Logo className="text-3xl" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
