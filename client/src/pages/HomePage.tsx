import { useState, useEffect, useRef } from 'react';
import VideoCard from '../components/video/VideoCard';
import api from '../api/axios';
import { IVideo } from '../types';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Education', 'Sports', 'News', 'Entertainment', 'Technology', 'Comedy', 'Travel'];

export default function HomePage() {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('All');
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const observerRef = useRef<IntersectionObserver>();

  const loadVideos = async (reset = false) => {
    if (loading || (!reset && !hasMoreRef.current)) return;
    setLoading(true);
    try {
      if (reset) { pageRef.current = 1; hasMoreRef.current = true; }
      const { data } = await api.get(`/videos?page=${pageRef.current}&limit=12${category !== 'All' ? `&category=${category}` : ''}`);
      setVideos((prev) => reset ? data.videos : [...prev, ...data.videos]);
      hasMoreRef.current = pageRef.current < data.pages;
      pageRef.current += 1;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVideos(true); }, [category]);

  const lastRef = (node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreRef.current && !loading) loadVideos();
    });
    if (node) observerRef.current.observe(node);
  };

  return (
    <div className="home-page">
      <div className="category-chips">
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      <div className="video-grid">
        {videos.map((v, i) => (
          <div key={v._id} ref={i === videos.length - 1 ? lastRef : null}>
            <VideoCard video={v} />
          </div>
        ))}
      </div>
      {loading && <div className="loader">Loading...</div>}
    </div>
  );
}
