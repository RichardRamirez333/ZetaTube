import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBell, FiThumbsUp, FiMessageSquare, FiUserPlus, FiUpload } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { INotification } from '../types';
import { formatDistanceToNow } from '../utils/formatDate';

const iconMap: Record<string, React.ReactNode> = {
  subscribe: <FiUserPlus />,
  like: <FiThumbsUp />,
  comment: <FiMessageSquare />,
  upload: <FiUpload />,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<INotification[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    api.get('/notifications').then(({ data }) => setNotifs(data));
  }, [user, navigate]);

  const handleMarkRead = async (id: string) => {
    await api.put('/notifications/mark-read', { ids: [id] });
    setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      {notifs.length === 0 && <p className="no-data">No notifications yet</p>}
      <div className="notif-list">
        {notifs.map((n) => (
          <div key={n._id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => handleMarkRead(n._id)}>
            <div className="notif-icon">{iconMap[n.type] || <FiBell />}</div>
            <div className="notif-body">
              <p>{n.message}</p>
              <span className="notif-time">{formatDistanceToNow(n.createdAt)}</span>
            </div>
            {n.video && (
              <Link to={`/watch/${n.video._id}`} className="notif-video-link" onClick={(e) => e.stopPropagation()}>
                View video
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
