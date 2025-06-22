import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import HomePage from './pages/HomePage';
import SignUp from './pages/SignUp';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PregnancyInfoPage from './pages/PregnancyInfoPage';
import DailyLogPage from './pages/DailyLogPage';
import ChatPage from './pages/ChatPage';
import Sidebar from './components/Sidebar';

// Wrapper component to conditionally render the sidebar
const AppContent = () => {
  const location = useLocation();

  // Pages where sidebar should not appear
  const noSidebarPages = ['/', '/signup', '/pregnancy-info'];
  const showSidebar = !noSidebarPages.includes(location.pathname);

  return (
    <>
      {showSidebar && <Sidebar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pregnancy-info" element={<PregnancyInfoPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/daily-log" element={<DailyLogPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
