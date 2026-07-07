import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { IPlaylist } from '../types';
import VideoCard from '../components/video/VideoCard';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/playlists/${id}`).then(({ data }) => setPlaylist(data)).catch(() => {});
  }, [id]);

  if (!playlist) return <div className="loader">Loading...</div>;

  return (
    <div className="playlist-detail-page">
      <div className="playlist-detail-header">
        <h2>{playlist.name}</h2>
        <p>{playlist.description || ''}</p>
        <p className="playlist-meta">{playlist.videos?.length || 0} videos</p>
      </div>
      <div className="video-grid">
        {playlist.videos?.map((v) => <VideoCard key={v._id} video={v as any} />)}
        {(!playlist.videos || playlist.videos.length === 0) && <p className="no-data">No videos in this playlist</p>}
      </div>
    </div>
  );
}
