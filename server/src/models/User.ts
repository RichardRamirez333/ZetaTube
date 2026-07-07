import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription {
  channel: mongoose.Types.ObjectId;
  notifications: 'all' | 'personalized' | 'none';
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar: string;
  bio: string;
  subscribers: number;
  subscriptions: ISubscription[];
  watchHistory: { video: mongoose.Types.ObjectId; watchedAt: Date }[];
  watchLater: mongoose.Types.ObjectId[];
  playlists: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    subscribers: { type: Number, default: 0 },
    subscriptions: [
      {
        channel: { type: Schema.Types.ObjectId, ref: 'User' },
        notifications: { type: String, enum: ['all', 'personalized', 'none'], default: 'all' },
      },
    ],
    watchHistory: [
      {
        video: { type: Schema.Types.ObjectId, ref: 'Video' },
        watchedAt: { type: Date, default: Date.now },
      },
    ],
    watchLater: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    playlists: [{ type: Schema.Types.ObjectId, ref: 'Playlist' }],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
