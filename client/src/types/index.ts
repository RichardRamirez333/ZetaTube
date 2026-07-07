export interface IUser {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  subscribers: number;
  subscriptions: { channel: string; notifications: 'all' | 'personalized' | 'none' }[];
  watchHistory: { video: string; watchedAt: string }[];
  watchLater: string[];
  playlists: string[];
  token?: string;
}

export interface IVideo {
  _id: string;
  userId: {
    _id: string;
    username: string;
    avatar: string;
    subscribers: number;
    bio?: string;
  };
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  tags: string[];
  likes: string[];
  dislikes: string[];
  category: string;
  duration: number;
  privacy: 'public' | 'unlisted';
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  userId: {
    _id: string;
    username: string;
    avatar: string;
  };
  videoId: string;
  text: string;
  parentComment?: string;
  likes: string[];
  dislikes: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface IPlaylist {
  _id: string;
  userId: { _id: string; username: string; avatar: string };
  name: string;
  description: string;
  videos: IVideo[];
  isPublic: boolean;
  createdAt: string;
}

export interface INotification {
  _id: string;
  recipient: string;
  sender: { _id: string; username: string; avatar: string };
  type: 'subscribe' | 'like' | 'comment' | 'upload';
  video?: { _id: string; title: string };
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PaginatedResponse {
  videos: IVideo[];
  total: number;
  page: number;
  pages: number;
}
