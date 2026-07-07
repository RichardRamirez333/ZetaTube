import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  videos: mongoose.Types.ObjectId[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    videos: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlaylist>('Playlist', playlistSchema);
