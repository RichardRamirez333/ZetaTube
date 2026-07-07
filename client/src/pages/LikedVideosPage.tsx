import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IVideo } from '../types';
import VideoCard from '../components/video/VideoCard';

export default function LikedVideosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<IVideo[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    api.get('/videos/liked/me').then(({ data }) => setVideos(data)).catch(() => {});
  }, [user, navigate]);

  return (
    <div className="liked-page">
      <h2>Liked Videos</h2>
      <div className="video-grid">
        {videos.map((v) => <VideoCard key={v._id} video={v} />)}
      </div>
      {videos.length === 0 && <p className="no-data">No liked videos</p>}
    </div>
  );
}
