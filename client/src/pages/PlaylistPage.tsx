import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { IPlaylist } from '../types';
import { useAuth } from '../context/AuthContext';

export default function PlaylistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/playlists/my').then(({ data }) => setPlaylists(data)).catch(() => {});
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const { data } = await api.post('/playlists', { name: newName, description: newDesc });
    setPlaylists((prev) => [data, ...prev]);
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/playlists/${id}`);
    setPlaylists((prev) => prev.filter((p) => p._id !== id));
  };

  if (!user) return <div className="error-page"><Link to="/auth">Sign in</Link> to view your playlists</div>;

  return (
    <div className="playlists-page">
      <div className="playlists-header">
        <h2>Your Playlists</h2>
        <button className="btn-subscribe" onClick={() => setShowCreate(!showCreate)}>New Playlist</button>
      </div>

      {showCreate && (
        <form className="create-playlist-form" onSubmit={handleCreate}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Playlist name" required />
          <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={2} />
          <div className="form-actions">
            <button type="submit" className="btn-sm btn-primary">Create</button>
            <button type="button" className="btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      {playlists.length === 0 ? (
        <p className="no-data">No playlists yet</p>
      ) : (
        <div className="playlist-grid">
          {playlists.map((p) => (
            <div key={p._id} className="playlist-card" onClick={() => navigate(`/playlist/${p._id}`)}>
              <div className="playlist-thumb">
                {p.videos && p.videos.length > 0 ? (
                  <img src={(p.videos[0] as any)?.thumbnailUrl || `https://picsum.photos/seed/${p._id}/320/180`} alt="" />
                ) : (
                  <div className="empty-playlist-thumb">No videos</div>
                )}
                <span className="playlist-count">{p.videos?.length || 0} videos</span>
              </div>
              <div className="playlist-card-info">
                <h4>{p.name}</h4>
                <p>{p.description || `${p.videos?.length || 0} videos`}</p>
              </div>
              <button className="playlist-delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
