import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { IVideo } from '../types';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';

export default function WatchLaterPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<IVideo[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get('/playlists/watch-later').then(({ data }) => setVideos(data)).catch(() => {});
  }, [user]);

  if (!user) return <div className="error-page"><Link to="/auth">Sign in</Link> to view Watch Later</div>;

  return (
    <div className="watch-later-page">
      <h2>Watch Later</h2>
      {videos.length === 0 ? (
        <p className="no-data">No videos saved for later</p>
      ) : (
        <div className="video-grid">
          {videos.map((v) => <VideoCard key={v._id} video={v} />)}
        </div>
      )}
    </div>
  );
}
