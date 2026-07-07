import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import HomePage from './pages/HomePage';
import WatchPage from './pages/WatchPage';
import UploadPage from './pages/UploadPage';
import AuthPage from './pages/AuthPage';
import ChannelPage from './pages/ChannelPage';
import SearchPage from './pages/SearchPage';
import TrendingPage from './pages/TrendingPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import HistoryPage from './pages/HistoryPage';
import LikedVideosPage from './pages/LikedVideosPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import PlaylistPage from './pages/PlaylistPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import WatchLaterPage from './pages/WatchLaterPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    if (mq.matches) setSidebarOpen(false);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
          <div className="main">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`content ${sidebarOpen ? 'sidebar-open' : ''}`}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/watch/:id" element={<WatchPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/channel/:channelId" element={<ChannelPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/liked" element={<LikedVideosPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/playlists" element={<PlaylistPage />} />
                <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                <Route path="/watch-later" element={<WatchLaterPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
              <div className="app-footer">
                <p><a href="/about">ZETAtube</a> &copy; 2026 Built by <strong>Shelby__x1</strong> &mdash; All Rights Reserved</p>
              </div>
            </div>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
