import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IVideo } from '../types';
import VideoCard from '../components/video/VideoCard';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<IVideo[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    api.get('/videos/subscriptions/list').then(({ data }) => setVideos(data));
  }, [user, navigate]);

  return (
    <div className="subscriptions-page">
      <h2>Subscriptions</h2>
      <div className="video-grid">
        {videos.map((v) => <VideoCard key={v._id} video={v} />)}
      </div>
      {videos.length === 0 && <p>No videos from subscribed channels</p>}
    </div>
  );
}
