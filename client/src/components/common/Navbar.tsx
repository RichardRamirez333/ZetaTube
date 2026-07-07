import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiUpload, FiLogOut, FiUser, FiBell, FiSettings, FiThumbsUp, FiMessageSquare, FiFolder, FiHeart } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { formatDistanceToNow } from '../../utils/formatDate';

interface NavbarProps {
  onToggleSidebar: () => void;
}

interface INotifItem {
  _id: string;
  type: 'subscribe' | 'like' | 'comment' | 'upload';
  sender: { _id: string; username: string; avatar: string };
  video?: { _id: string; title: string };
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [query, setQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<INotifItem[]>([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user) { setUnread(0); setNotifs([]); return; }
    const fetch = async () => {
      try {
        const [countRes, notifRes] = await Promise.all([
          api.get('/notifications/unread-count'),
          api.get('/notifications?limit=5'),
        ]);
        setUnread(countRes.data.count);
        setNotifs(notifRes.data);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (showNotif && user) {
      api.get('/notifications?limit=5').then(({ data }) => setNotifs(data)).catch(() => {});
    }
  }, [showNotif, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case 'like': return <FiThumbsUp size={16} />;
      case 'comment': return <FiMessageSquare size={16} />;
      case 'subscribe': return <FiHeart size={16} />;
      case 'upload': return <FiFolder size={16} />;
      default: return <FiBell size={16} />;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="icon-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar"><FiMenu size={22} /></button>
        <Link to="/" className="logo">ZETAtube</Link>
      </div>
      <form className="search-bar" onSubmit={handleSearch}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
        <button type="submit" aria-label="Search"><FiSearch size={18} /></button>
      </form>
      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/upload" className="icon-btn" aria-label="Upload"><FiUpload size={22} /></Link>
            <div className="notif-menu" ref={notifRef}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} aria-label="Notifications">
                <FiBell size={22} />
                {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <strong>Notifications</strong>
                    <button onClick={() => { api.put('/notifications/mark-all-read'); setUnread(0); setNotifs((prev) => prev.map((n) => ({ ...n, read: true }))); }}>Mark all read</button>
                  </div>
                  <div className="notif-list-dropdown">
                    {notifs.length === 0 ? (
                      <p className="no-data" style={{ padding: '20px', fontSize: 13 }}>No notifications</p>
                    ) : (
                      notifs.map((n) => (
                        <div key={n._id} className={`notif-item-dropdown ${n.read ? '' : 'unread'}`} onClick={() => { setShowNotif(false); if (n.video?._id) navigate(`/watch/${n.video._id}`); else navigate('/notifications'); }}>
                          <div className="notif-icon-dropdown">{notifIcon(n.type)}</div>
                          <div className="notif-body-dropdown">
                            <p className="notif-msg">{n.message}</p>
                            <span className="notif-time-dropdown">{formatDistanceToNow(n.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <Link to="/notifications" className="notif-view-all" onClick={() => setShowNotif(false)}>View all notifications</Link>
                </div>
              )}
            </div>
            <div className="user-menu" ref={menuRef}>
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=red&color=fff`}
                alt=""
                className="avatar-sm"
                onClick={() => setShowMenu(!showMenu)}
              />
              {showMenu && (
                <div className="dropdown">
                  <Link to={`/channel/${user._id}`} className="dropdown-item" onClick={() => setShowMenu(false)}>
                    <FiUser /> Your Channel
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={() => setShowMenu(false)}>
                    <FiSettings /> Settings
                  </Link>
                  <Link to="/playlists" className="dropdown-item" onClick={() => setShowMenu(false)}>
                    <FiFolder /> Playlists
                  </Link>
                  <button className="dropdown-item" onClick={() => { logout(); setShowMenu(false); navigate('/'); }}>
                    <FiLogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/auth" className="btn-auth">Sign In</Link>
        )}
      </div>
    </nav>
  );
}
