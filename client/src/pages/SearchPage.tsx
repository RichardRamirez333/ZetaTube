import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { IVideo } from '../types';
import VideoCard from '../components/video/VideoCard';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Education', 'Sports', 'News', 'Entertainment'];
const DURATIONS = [
  { label: 'Any', value: '' },
  { label: 'Under 4 min', value: 'short' },
  { label: '4-20 min', value: 'medium' },
  { label: 'Over 20 min', value: 'long' },
];

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [category, setCategory] = useState('All');
  const [duration, setDuration] = useState('');
  const [sort, setSort] = useState('relevance');

  useEffect(() => {
    if (!query) return;
    const p = new URLSearchParams({ q: query });
    if (category !== 'All') p.set('category', category);
    if (duration) p.set('duration', duration);
    if (sort !== 'relevance') p.set('sort', sort);
    api.get(`/videos/search?${p.toString()}`).then(({ data }) => setVideos(data));
  }, [query, category, duration, sort]);

  return (
    <div className="search-page">
      <h2>Results for "{query}"</h2>
      <div className="search-filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={duration} onChange={(e) => setDuration(e.target.value)}>
          {DURATIONS.map((d) => <option key={d.label} value={d.value}>{d.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>
      <div className="video-grid">
        {videos.map((v) => <VideoCard key={v._id} video={v} />)}
      </div>
      {videos.length === 0 && <p className="no-data">No videos found</p>}
    </div>
  );
}
