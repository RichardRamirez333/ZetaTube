import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiBell, FiBellOff, FiEdit2, FiTrash2, FiClock, FiList, FiX, FiMessageSquare, FiMonitor } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IVideo, IComment, IPlaylist } from '../types';
import VideoPlayer from '../components/video/VideoPlayer';
import SuggestedVideos from '../components/video/SuggestedVideos';
import { formatDistanceToNow, formatViews } from '../utils/formatDate';

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<IVideo | null>(null);
  const [suggested, setSuggested] = useState<IVideo[]>([]);
  const [comments, setComments] = useState<IComment[]>([]);
  const [replies, setReplies] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showNotifPref, setShowNotifPref] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/videos/${id}`).then(({ data }) => setVideo(data));
    api.get(`/comments/${id}?sort=${sortBy}`).then(({ data }) => {
      setComments(data.comments || []);
      setReplies(data.replies || []);
    });
    api.get(`/videos/suggested/${id}`).then(({ data }) => {
      setSuggested(data.filter((v: IVideo) => v._id !== id));
    });
  }, [id, sortBy]);

  useEffect(() => {
    if (!id || !user?.token) return;
    api.post(`/videos/${id}/watch-history`).catch(() => {});
  }, [id, user?.token]);

  const currentIndex = suggested.findIndex((v) => v._id === id);
  const prevVideo = currentIndex > 0 ? suggested[currentIndex - 1] : null;
  const nextVideo = currentIndex < suggested.length - 1 ? suggested[currentIndex + 1] : null;

  const isOwner = user && video && user._id === video.userId._id;

  const handleDeleteVideo = async () => {
    if (!id) return;
    try {
      await api.delete(`/videos/${id}`);
      navigate('/');
    } catch {}
  };

  const handleLike = async () => {
    if (!user || !video) return;
    const { data } = await api.post(`/videos/${id}/like`);
    setVideo((prev) =>
      prev ? {
        ...prev,
        likes: data.liked ? [...prev.likes, user._id] : prev.likes.filter((l) => l !== user._id),
        dislikes: prev.dislikes.filter((d) => d !== user._id),
      } : prev
    );
  };

  const handleDislike = async () => {
    if (!user || !video) return;
    const { data } = await api.post(`/videos/${id}/dislike`);
    setVideo((prev) =>
      prev ? {
        ...prev,
        dislikes: data.disliked ? [...prev.dislikes, user._id] : prev.dislikes.filter((d) => d !== user._id),
        likes: prev.likes.filter((l) => l !== user._id),
      } : prev
    );
  };

  const handleSubscribe = async () => {
    if (!user || !video) return;
    const { data } = await api.post(`/videos/subscribe/${video.userId._id}`);
    setVideo((prev) =>
      prev ? { ...prev, userId: { ...prev.userId, subscribers: data.subscribers } } : prev
    );
    updateUser({ ...user, subscriptions: data.subscriptions });
  };

  const handleNotifPref = async (pref: 'all' | 'personalized' | 'none') => {
    if (!user || !video) return;
    await api.put('/videos/subscription/notifications', { channelId: video.userId._id, notifications: pref });
    const subs = user.subscriptions.map((s) =>
      s.channel === video.userId._id ? { ...s, notifications: pref } : s
    );
    updateUser({ ...user, subscriptions: subs });
    setShowNotifPref(false);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link:', url);
    });
  };

  const handleWatchLater = async () => {
    if (!user || !video) return;
    const { data } = await api.post(`/playlists/watch-later/${video._id}`);
    updateUser({ ...user, watchLater: data.watchLater });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const { data } = await api.post(`/comments/${id}`, { text: newComment });
    setComments((prev) => [data, ...prev]);
    setNewComment('');
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    const { data } = await api.put(`/comments/${commentId}`, { text: editText });
    setComments((prev) => prev.map((c) => c._id === commentId ? { ...c, text: data.text, updatedAt: data.updatedAt } : c));
    setReplies((prev) => prev.map((c) => c._id === commentId ? { ...c, text: data.text, updatedAt: data.updatedAt } : c));
    setEditingComment(null);
    setEditText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    await api.delete(`/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    setReplies((prev) => prev.filter((c) => c._id !== commentId));
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    const { data } = await api.post(`/comments/${id}`, { text: replyText, parentComment: parentId });
    setReplies((prev) => [...prev, data]);
    setReplyTo(null);
    setReplyText('');
  };

  const handleLikeComment = async (commentId: string) => {
    const { data } = await api.post(`/comments/${commentId}/like`);
    const toggleLike = (prev: IComment[]) => prev.map((c) =>
      c._id === commentId ? { ...c, likes: data.liked ? [...c.likes, '1'] : c.likes.slice(0, -1) } : c
    );
    setComments(toggleLike);
    setReplies(toggleLike);
  };

  const openPlaylistModal = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/playlists/my');
      setPlaylists(data);
    } catch {}
    setShowPlaylistModal(true);
  };

  const togglePlaylist = async (playlistId: string) => {
    if (!video) return;
    await api.post(`/playlists/${playlistId}/add`, { videoId: video._id });
    openPlaylistModal();
  };

  const sub = video ? user?.subscriptions?.find((s) => s.channel === video.userId?._id) : null;
  const subscribed = !!sub;
  const notifPref = sub?.notifications || 'all';
  const inWatchLater = user?.watchLater?.includes(video?._id || '');

  const getRepliesForComment = (commentId: string) => replies.filter((r) => r.parentComment === commentId);

  if (!video) return <div className="loader">Loading...</div>;

  const userLiked = user && video.likes.includes(user._id);
  const userDisliked = user && video.dislikes.includes(user._id);

  return (
    <div className={`watch-page-layout ${theatreMode ? 'theatre' : ''}`}>
      <div className="watch-primary">
        <div className="player-toolbar">
          <div className="player-toolbar-left">
            <button className={`toolbar-btn ${theatreMode ? 'active' : ''}`} onClick={() => setTheatreMode(!theatreMode)} title="Theatre mode">
              <FiMonitor size={16} /> Theatre
            </button>
          </div>
          <div className="player-toolbar-right">
            <label className="autoplay-toggle">
              <span>Autoplay</span>
              <input type="checkbox" checked={autoplay} onChange={() => setAutoplay(!autoplay)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <VideoPlayer
          src={video.videoUrl || 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'}
          onNext={nextVideo ? () => navigate(`/watch/${nextVideo._id}`) : undefined}
          onPrev={prevVideo ? () => navigate(`/watch/${prevVideo._id}`) : undefined}
          hasNext={!!nextVideo}
          hasPrev={!!prevVideo}
          theatreMode={theatreMode}
          autoplay={autoplay}
        />

        <h2 className="video-title">{video.title}</h2>

        <div className="video-actions">
          <div className="channel-row">
            <Link to={`/channel/${video.userId._id}`} className="channel-info">
              <img
                src={video.userId?.avatar || `https://ui-avatars.com/api/?name=${video.userId?.username}&background=red&color=fff`}
                alt=""
                className="avatar"
              />
              <div>
                <strong>{video.userId?.username}</strong>
                <p>{video.userId?.subscribers?.toLocaleString()} subscribers</p>
              </div>
            </Link>
            {isOwner ? (
              <div className="owner-actions">
                <button className="btn-edit" onClick={() => navigate(`/upload?edit=${id}`)}>
                  <FiEdit2 /> Edit
                </button>
                <button className="btn-edit btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            ) : user ? (
              <div className="sub-group">
                <button className={`btn-subscribe ${subscribed ? 'subscribed' : ''}`} onClick={handleSubscribe}>
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
                {subscribed && (
                  <div className="notif-bell-wrap">
                    <button className="icon-btn notif-bell" onClick={() => setShowNotifPref(!showNotifPref)}>
                      {notifPref === 'none' ? <FiBellOff size={18} /> : <FiBell size={18} />}
                    </button>
                    {showNotifPref && (
                      <div className="notif-pref-dropdown">
                        <button className={notifPref === 'all' ? 'active' : ''} onClick={() => handleNotifPref('all')}>All</button>
                        <button className={notifPref === 'personalized' ? 'active' : ''} onClick={() => handleNotifPref('personalized')}>Personalized</button>
                        <button className={notifPref === 'none' ? 'active' : ''} onClick={() => handleNotifPref('none')}>None</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="btn-subscribe">Subscribe</Link>
            )}
          </div>

          <div className="like-bar-wrap">
            <div className="like-bar">
              <button className={`icon-btn ${userLiked ? 'active' : ''}`} onClick={handleLike}>
                <FiThumbsUp /> {video.likes.length}
              </button>
              <button className={`icon-btn ${userDisliked ? 'active' : ''}`} onClick={handleDislike}>
                <FiThumbsDown /> {video.dislikes.length}
              </button>
            </div>
            <button className="icon-btn share-btn" onClick={handleShare}><FiShare2 /> Share</button>
            {user && (
              <button className={`icon-btn share-btn ${inWatchLater ? 'active' : ''}`} onClick={handleWatchLater}>
                <FiClock /> {inWatchLater ? 'Saved' : 'Save'}
              </button>
            )}
            {user && (
              <button className="icon-btn share-btn" onClick={openPlaylistModal}>
                <FiList /> Playlist
              </button>
            )}
          </div>
        </div>

        <div className="video-description">
          <p>{formatViews(video.views)} views · {formatDistanceToNow(video.createdAt)}</p>
          <p>{video.description}</p>
        </div>

        <div className="comments-section">
          <div className="comments-header">
            <h3>{comments.length + replies.length} Comments</h3>
            <div className="sort-selector">
              <button className={sortBy === 'top' ? 'active' : ''} onClick={() => setSortBy('top')}>Top</button>
              <button className={sortBy === 'newest' ? 'active' : ''} onClick={() => setSortBy('newest')}>Newest</button>
            </div>
          </div>
          {user ? (
            <form className="comment-form" onSubmit={handleComment}>
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." />
              <button type="submit">Comment</button>
            </form>
          ) : (
            <p className="comment-login-prompt"><Link to="/auth">Sign in</Link> to comment</p>
          )}
          <div className="comments-list">
            {comments.length === 0 && <p className="no-data">No comments yet</p>}
            {comments.map((c) => (
              <div key={c._id}>
                <div className="comment">
                  <img
                    src={c.userId?.avatar || `https://ui-avatars.com/api/?name=${c.userId?.username}&background=red&color=fff`}
                    alt=""
                    className="avatar-sm"
                  />
                  <div className="comment-body">
                    <div className="comment-header">
                      <strong>{c.userId?.username}</strong>
                      <span className="comment-time">{formatDistanceToNow(c.createdAt)}</span>
                      {c.updatedAt !== c.createdAt && <span className="edited">(edited)</span>}
                    </div>
                    {editingComment === c._id ? (
                      <div className="edit-comment-form">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <div className="edit-comment-actions">
                          <button className="btn-sm btn-primary" onClick={() => handleEditComment(c._id)}>Save</button>
                          <button className="btn-sm" onClick={() => { setEditingComment(null); setEditText(''); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p>{c.text}</p>
                    )}
                    <div className="comment-actions">
                      <button className="comment-action-btn" onClick={() => handleLikeComment(c._id)}>
                        <FiThumbsUp size={12} /> {c.likes.length}
                      </button>
                      {user && (
                        <>
                          <button className="comment-action-btn" onClick={() => setReplyTo(replyTo === c._id ? null : c._id)}>
                            <FiMessageSquare size={12} /> Reply
                          </button>
                          {c.userId?._id === user._id && (
                            <>
                              <button className="comment-action-btn" onClick={() => { setEditingComment(c._id); setEditText(c.text); }}>
                                <FiEdit2 size={12} /> Edit
                              </button>
                              <button className="comment-action-btn" onClick={() => handleDeleteComment(c._id)}>
                                <FiTrash2 size={12} /> Delete
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {replyTo === c._id && (
                      <form className="reply-form" onSubmit={(e) => { e.preventDefault(); handleReply(c._id); }}>
                        <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." autoFocus />
                        <button type="submit" className="btn-sm btn-primary">Reply</button>
                      </form>
                    )}
                    {getRepliesForComment(c._id).length > 0 && (
                      <div className="replies">
                        {getRepliesForComment(c._id).map((r) => (
                          <div key={r._id} className="comment reply">
                            <img
                              src={r.userId?.avatar || `https://ui-avatars.com/api/?name=${r.userId?.username}&background=red&color=fff`}
                              alt=""
                              className="avatar-sm"
                            />
                            <div className="comment-body">
                              <div className="comment-header">
                                <strong>{r.userId?.username}</strong>
                                <span className="comment-time">{formatDistanceToNow(r.createdAt)}</span>
                                {r.updatedAt !== r.createdAt && <span className="edited">(edited)</span>}
                              </div>
                              {editingComment === r._id ? (
                                <div className="edit-comment-form">
                                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                                  <div className="edit-comment-actions">
                                    <button className="btn-sm btn-primary" onClick={() => handleEditComment(r._id)}>Save</button>
                                    <button className="btn-sm" onClick={() => { setEditingComment(null); setEditText(''); }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <p>{r.text}</p>
                              )}
                              <div className="comment-actions">
                                <button className="comment-action-btn" onClick={() => handleLikeComment(r._id)}>
                                  <FiThumbsUp size={12} /> {r.likes.length}
                                </button>
                                {user && r.userId?._id === user._id && (
                                  <>
                                    <button className="comment-action-btn" onClick={() => { setEditingComment(r._id); setEditText(r.text); }}>
                                      <FiEdit2 size={12} /> Edit
                                    </button>
                                    <button className="comment-action-btn" onClick={() => handleDeleteComment(r._id)}>
                                      <FiTrash2 size={12} /> Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="watch-sidebar">
        <SuggestedVideos videoId={id!} currentVideoId={id} videos={suggested} />
      </aside>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this video?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-sm btn-danger-btn" onClick={handleDeleteVideo}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showPlaylistModal && (
        <div className="modal-overlay" onClick={() => setShowPlaylistModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Save to Playlist</h3>
              <button className="icon-btn" onClick={() => setShowPlaylistModal(false)}><FiX /></button>
            </div>
            <div className="playlist-list-modal">
              {playlists.length === 0 ? (
                <p className="no-data">No playlists yet</p>
              ) : (
                playlists.map((p) => (
                  <label key={p._id} className="playlist-check-item">
                    <input
                      type="checkbox"
                      checked={p.videos?.some((v: any) => v._id === video?._id || v === video?._id)}
                      onChange={() => togglePlaylist(p._id)}
                    />
                    <span>{p.name}</span>
                  </label>
                ))
              )}
            </div>
            <button className="btn-sm btn-primary" style={{ margin: '8px 16px 16px' }} onClick={() => navigate('/playlists')}>
              Create new playlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
