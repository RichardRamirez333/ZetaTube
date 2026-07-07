import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  dislikes: mongoose.Types.ObjectId[];
  category: string;
  duration: number;
  privacy: 'public' | 'unlisted';
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 5000 },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    views: { type: Number, default: 0 },
    tags: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    category: { type: String, default: 'Entertainment' },
    duration: { type: Number, default: 0 },
    privacy: { type: String, enum: ['public', 'unlisted'], default: 'public' },
  },
  { timestamps: true }
);

videoSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IVideo>('Video', videoSchema);
