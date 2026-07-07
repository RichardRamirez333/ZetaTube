import { Link } from 'react-router-dom';
import { IVideo } from '../../types';
import { formatDistanceToNow, formatViews } from '../../utils/formatDate';

export default function VideoCard({ video }: { video: IVideo }) {
  return (
    <Link to={`/watch/${video._id}`} className="video-card">
      <div className="thumbnail">
        <img src={video.thumbnailUrl || `https://picsum.photos/seed/${video._id}/320/180`} alt={video.title} />
        <span className="duration">{formatDuration(video.duration)}</span>
      </div>
      <div className="video-info">
        <img src={video.userId?.avatar || `https://ui-avatars.com/api/?name=${video.userId?.username}&background=red&color=fff`} alt="" className="avatar-sm" />
        <div>
          <h4>{video.title}</h4>
          <p className="channel-name">{video.userId?.username}</p>
          <p className="video-meta">{formatViews(video.views)} views · {formatDistanceToNow(video.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
