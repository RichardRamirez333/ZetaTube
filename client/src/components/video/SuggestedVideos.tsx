import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { IVideo } from '../../types';
import { formatDistanceToNow, formatViews } from '../../utils/formatDate';

interface SuggestedVideosProps {
  videoId: string;
  currentVideoId?: string;
  videos?: IVideo[];
}

export default function SuggestedVideos({ videoId, currentVideoId, videos: externalVideos }: SuggestedVideosProps) {
  const [videos, setVideos] = useState<IVideo[]>([]);

  useEffect(() => {
    if (externalVideos) {
      setVideos(externalVideos.filter((v: IVideo) => v._id !== currentVideoId));
      return;
    }
    if (!videoId) return;
    api.get(`/videos/suggested/${videoId}`).then(({ data }) => {
      setVideos(data.filter((v: IVideo) => v._id !== currentVideoId));
    }).catch(() => {});
  }, [videoId, currentVideoId, externalVideos]);

  if (videos.length === 0) return null;

  return (
    <div className="suggested-videos">
      <h3>Suggested</h3>
      {videos.map((v) => (
        <Link to={`/watch/${v._id}`} key={v._id} className="suggested-item">
          <div className="suggested-thumb">
            <img src={v.thumbnailUrl || `https://picsum.photos/seed/${v._id}/168/94`} alt="" />
            <span className="duration">{formatDuration(v.duration)}</span>
          </div>
          <div className="suggested-info">
            <h4>{v.title}</h4>
            <p>{v.userId?.username}</p>
            <p>{formatViews(v.views)} views · {formatDistanceToNow(v.createdAt)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatDuration(s: number): string {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
