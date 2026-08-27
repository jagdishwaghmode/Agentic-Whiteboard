import mongoose from 'mongoose';

const userAccountSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, default: '' },
    credits: { type: Number, required: true, default: 100, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('UserAccount', userAccountSchema);
