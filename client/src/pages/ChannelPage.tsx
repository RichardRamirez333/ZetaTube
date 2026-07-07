import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IVideo, IPlaylist } from '../types';
import VideoCard from '../components/video/VideoCard';

type Tab = 'videos' | 'about' | 'playlists';

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user, updateUser } = useAuth();
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [tab, setTab] = useState<Tab>('videos');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!channelId) return;
    setError('');
    api.get(`/videos/channel/${channelId}`).then(({ data }) => {
      setChannel(data.channel);
      setVideos(data.videos);
      setPlaylists(data.playlists || []);
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load channel');
    });
  }, [channelId]);

  const subscribed = user ? user.subscriptions?.some((s) => s.channel === channelId) : false;

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      const { data } = await api.post(`/videos/subscribe/${channelId}`);
      setChannel((prev: any) => prev ? { ...prev, subscribers: data.subscribers } : prev);
      updateUser({ ...user, subscriptions: data.subscriptions });
    } catch {}
  };

  if (error) return <div className="error-page">{error}</div>;
  if (!channel) return <div className="loader">Loading...</div>;

  return (
    <div className="channel-page">
      <div className="channel-header">
        <img
          src={channel.avatar || `https://ui-avatars.com/api/?name=${channel.username}&background=red&color=fff&size=128`}
          alt=""
          className="channel-avatar"
        />
        <div>
          <h1>{channel.username}</h1>
          <p>{channel.subscribers?.toLocaleString()} subscribers · {videos.length} videos</p>
          {channel.bio && <p className="channel-bio">{channel.bio}</p>}
          {user && user._id !== channelId && (
            <button
              className={`btn-subscribe ${subscribed ? 'subscribed' : ''}`}
              onClick={handleSubscribe}
              style={{ marginTop: 8 }}
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>

      <div className="channel-tabs">
        <button className={`tab ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>Videos</button>
        <button className={`tab ${tab === 'playlists' ? 'active' : ''}`} onClick={() => setTab('playlists')}>Playlists</button>
        <button className={`tab ${tab === 'about' ? 'active' : ''}`} onClick={() => setTab('about')}>About</button>
      </div>

      {tab === 'videos' && (
        <div className="video-grid">
          {videos.length === 0 && <p className="no-data">No videos yet</p>}
          {videos.map((v) => <VideoCard key={v._id} video={v} />)}
        </div>
      )}

      {tab === 'playlists' && (
        <div className="playlist-grid">
          {playlists.length === 0 ? (
            <p className="no-data">No playlists yet</p>
          ) : (
            playlists.map((p) => (
              <div key={p._id} className="playlist-card">
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
                  <p>{p.videos?.length || 0} videos</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'about' && (
        <div className="channel-about">
          <h3>About</h3>
          <p><strong>Joined</strong> {new Date(channel.createdAt).toLocaleDateString()}</p>
          {channel.bio && (
            <>
              <h4>Description</h4>
              <p>{channel.bio}</p>
            </>
          )}
          <h4>Stats</h4>
          <p>{channel.subscribers?.toLocaleString()} subscribers</p>
          <p>{videos.length} videos</p>
        </div>
      )}
    </div>
  );
}
