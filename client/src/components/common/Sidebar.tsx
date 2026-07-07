import { NavLink } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiFolder, FiClock, FiThumbsUp, FiList } from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-item ${isActive ? 'active' : ''}`;

  const handleClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" end className={linkClass} onClick={handleClick}><FiHome /> <span>Home</span></NavLink>
        <NavLink to="/trending" className={linkClass} onClick={handleClick}><FiTrendingUp /> <span>Trending</span></NavLink>
        <NavLink to="/subscriptions" className={linkClass} onClick={handleClick}><FiFolder /> <span>Subscriptions</span></NavLink>
        <hr />
        <NavLink to="/history" className={linkClass} onClick={handleClick}><FiClock /> <span>History</span></NavLink>
        <NavLink to="/liked" className={linkClass} onClick={handleClick}><FiThumbsUp /> <span>Liked Videos</span></NavLink>
        <NavLink to="/watch-later" className={linkClass} onClick={handleClick}><FiClock /> <span>Watch Later</span></NavLink>
        <NavLink to="/playlists" className={linkClass} onClick={handleClick}><FiList /> <span>Playlists</span></NavLink>
      </aside>
    </>
  );
}
