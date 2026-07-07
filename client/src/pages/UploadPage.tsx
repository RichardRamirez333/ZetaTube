import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [privacy, setPrivacy] = useState('public');
  const [video, setVideo] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (editId) {
      api.get(`/videos/${editId}`).then(({ data }) => {
        if (data.userId._id !== user._id) { navigate('/'); return; }
        setTitle(data.title);
        setDescription(data.description);
        setTags(data.tags?.join(', ') || '');
        setCategory(data.category || 'Entertainment');
        setPrivacy(data.privacy || 'public');
        setThumbPreview(data.thumbnailUrl);
      });
    }
  }, [user, editId, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (editId) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', description);
        fd.append('tags', tags);
        fd.append('category', category);
        fd.append('privacy', privacy);
        if (thumbnail) fd.append('thumbnail', thumbnail);
        await api.put(`/videos/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate(`/watch/${editId}`);
      } catch { setError('Update failed'); } finally { setUploading(false); }
      return;
    }
    if (!video || !title) { setError('Video and title required'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('video', video);
      if (thumbnail) fd.append('thumbnail', thumbnail);
      fd.append('title', title);
      fd.append('description', description);
      fd.append('tags', tags);
      fd.append('category', category);
      fd.append('privacy', privacy);
      const { data } = await api.post('/videos', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/watch/${data._id}`);
    } catch { setError('Upload failed'); } finally { setUploading(false); }
  };

  return (
    <div className="upload-page">
      <h1>{editId ? 'Edit Video' : 'Upload Video'}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        {!editId && (
          <div className="upload-drop">
            {video ? (
              <p>{video.name} ({(video.size / 1024 / 1024).toFixed(1)} MB)</p>
            ) : (
              <label>
                <p>Click to select video</p>
                <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} hidden />
              </label>
            )}
          </div>
        )}
        <div className="upload-drop thumb-drop">
          {thumbPreview ? (
            <div className="thumb-preview">
              <img src={thumbPreview} alt="thumbnail" />
              <label className="change-thumb">Change</label>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setThumbnail(f); setThumbPreview(URL.createObjectURL(f)); } }} hidden />
            </div>
          ) : (
            <label>
              <p>Click to add thumbnail</p>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setThumbnail(f); setThumbPreview(URL.createObjectURL(f)); } }} hidden />
            </label>
          )}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" required />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={4} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Entertainment</option>
          <option>Music</option>
          <option>Gaming</option>
          <option>Education</option>
          <option>Sports</option>
          <option>News</option>
          <option>Technology</option>
          <option>Comedy</option>
          <option>Travel</option>
        </select>
        <select value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
        </select>
        <button type="submit" disabled={uploading || (!editId && !video)}>
          {uploading ? 'Uploading...' : editId ? 'Save Changes' : 'Upload'}
        </button>
      </form>
    </div>
  );
}
