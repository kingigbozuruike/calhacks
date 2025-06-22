import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DailyLogPage from './pages/DailyLogPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/daily-log" element={<DailyLogPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App; 