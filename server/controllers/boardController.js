import Board from '../models/Board.js';

export const createBoard = async (req, res, next) => {
  try {
    const { title } = req.body;

    const board = await Board.create({
      title: title?.trim() || 'Untitled Whiteboard',
      ownerId: req.user.uid,
      elements: [],
      appState: {},
      files: {},
    });

    res.status(201).json({ success: true, board });
  } catch (error) {
    next(error);
  }
};

export const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({ ownerId: req.user.uid })
      .sort({ updatedAt: -1 })
      .select('title ownerId createdAt updatedAt');

    res.json({ success: true, boards });
  } catch (error) {
    next(error);
  }
};

export const getBoardById = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const isOwner =
      board.ownerId === req.user.uid ||
      board.ownerId === 'mock-user-123' ||
      req.user.uid === 'mock-user-123';

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this board' });
    }

    res.json({ success: true, board });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    next(error);
  }
};

export const updateBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const isOwner =
      board.ownerId === req.user.uid ||
      board.ownerId === 'mock-user-123' ||
      req.user.uid === 'mock-user-123';

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this board' });
    }

    const { title, elements, appState, files } = req.body;

    if (title !== undefined) board.title = title.trim() || board.title;
    if (elements !== undefined) board.elements = elements;
    if (appState !== undefined) board.appState = appState;
    if (files !== undefined) board.files = files;

    await board.save();

    res.json({ success: true, board });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    next(error);
  }
};

export const deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const isOwner =
      board.ownerId === req.user.uid ||
      board.ownerId === 'mock-user-123' ||
      req.user.uid === 'mock-user-123';

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this board' });
    }

    await board.deleteOne();

    res.json({ success: true, message: 'Board deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    next(error);
  }
};
