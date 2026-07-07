import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IVideo } from '../types';
import VideoCard from '../components/video/VideoCard';

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<IVideo[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    api.get('/videos/history/me').then(({ data }) => setVideos(data.map((w: any) => w.video).filter(Boolean)));
  }, [user, navigate]);

  return (
    <div className="history-page">
      <h2>Watch History</h2>
      <div className="video-grid">
        {videos.map((v: IVideo) => <VideoCard key={v._id} video={v} />)}
      </div>
      {videos.length === 0 && <p>No watch history</p>}
    </div>
  );
}
