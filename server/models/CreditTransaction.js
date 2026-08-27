import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true },
    type: { type: String, enum: ['signup', 'generation', 'purchase', 'refund'], required: true },
    credits: { type: Number, required: true },
    reference: { type: String, default: '', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('CreditTransaction', creditTransactionSchema);
