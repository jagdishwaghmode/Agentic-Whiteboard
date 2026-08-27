import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Untitled Whiteboard',
      trim: true,
      maxlength: 200,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    elements: {
      type: Array,
      default: [],
    },
    appState: {
      type: Object,
      default: {},
    },
    files: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Board = mongoose.model('Board', boardSchema);

export default Board;
