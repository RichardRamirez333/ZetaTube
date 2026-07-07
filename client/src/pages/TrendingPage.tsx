import { useState, useEffect } from 'react';
import api from '../api/axios';
import { IVideo } from '../types';
import VideoCard from '../components/video/VideoCard';

export default function TrendingPage() {
  const [videos, setVideos] = useState<IVideo[]>([]);

  useEffect(() => {
    api.get('/videos/trending').then(({ data }) => setVideos(data));
  }, []);

  return (
    <div className="trending-page">
      <h2>Trending</h2>
      <div className="video-grid">
        {videos.map((v) => <VideoCard key={v._id} video={v} />)}
      </div>
    </div>
  );
}
