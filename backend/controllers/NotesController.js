const Note = require('../models/Note');
const User = require('../models/User');
const getTrimester = require('../utils/getTrimester');

/**
 * Create a new note/journal entry
 * POST /api/notes
 */
const createNote = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { content, mood, tags } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Note content cannot exceed 2000 characters'
      });
    }

    // Get user's pregnancy information for context
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate current pregnancy week and trimester if user has conception date
    let weekOfPregnancy = null;
    let trimester = null;

    if (user.conceptionDate) {
      const conceptionDate = new Date(user.conceptionDate);
      const today = new Date();
      const daysSinceConception = Math.floor((today - conceptionDate) / (1000 * 60 * 60 * 24));
      weekOfPregnancy = Math.floor(daysSinceConception / 7);
      trimester = getTrimester(conceptionDate);
    }

    // Create the note
    const note = new Note({
      userId,
      content: content.trim(),
      weekOfPregnancy,
      trimester,
      mood: mood || undefined,
      tags: tags || []
    });

    await note.save();

    res.status(201).json({
      success: true,
      data: {
        id: note._id,
        content: note.content,
        date: note.date,
        weekOfPregnancy: note.weekOfPregnancy,
        trimester: note.trimester,
        mood: note.mood,
        tags: note.tags,
        formattedDate: note.formattedDate
      },
      message: 'Note saved successfully'
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user's notes with pagination
 * GET /api/notes
 */
const getNotes = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalNotes = await Note.countDocuments({ userId });

    // Get notes with pagination
    const notes = await Note.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Format notes for response
    const formattedNotes = notes.map(note => ({
      id: note._id,
      content: note.content,
      date: note.date,
      weekOfPregnancy: note.weekOfPregnancy,
      trimester: note.trimester,
      mood: note.mood,
      tags: note.tags,
      formattedDate: note.formattedDate
    }));

    res.json({
      success: true,
      data: {
        notes: formattedNotes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalNotes / limit),
          totalNotes,
          hasNextPage: page < Math.ceil(totalNotes / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get a specific note by ID
 * GET /api/notes/:id
 */
const getNoteById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const noteId = req.params.id;

    const note = await Note.findOne({ _id: noteId, userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: note._id,
        content: note.content,
        date: note.date,
        weekOfPregnancy: note.weekOfPregnancy,
        trimester: note.trimester,
        mood: note.mood,
        tags: note.tags,
        formattedDate: note.formattedDate
      }
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update a note
 * PUT /api/notes/:id
 */
const updateNote = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const noteId = req.params.id;
    const { content, mood, tags } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Note content cannot exceed 2000 characters'
      });
    }

    const note = await Note.findOne({ _id: noteId, userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Update the note
    note.content = content.trim();
    if (mood !== undefined) note.mood = mood;
    if (tags !== undefined) note.tags = tags;

    await note.save();

    res.json({
      success: true,
      data: {
        id: note._id,
        content: note.content,
        date: note.date,
        weekOfPregnancy: note.weekOfPregnancy,
        trimester: note.trimester,
        mood: note.mood,
        tags: note.tags,
        formattedDate: note.formattedDate
      },
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete a note
 * DELETE /api/notes/:id
 */
const deleteNote = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const noteId = req.params.id;

    const note = await Note.findOne({ _id: noteId, userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await Note.deleteOne({ _id: noteId, userId });

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get notes for a specific week of pregnancy
 * GET /api/notes/week/:week
 */
const getNotesByWeek = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const week = parseInt(req.params.week);

    if (!week || week < 1 || week > 42) {
      return res.status(400).json({
        success: false,
        message: 'Valid week number (1-42) is required'
      });
    }

    const notes = await Note.getNotesByWeek(userId, week);

    const formattedNotes = notes.map(note => ({
      id: note._id,
      content: note.content,
      date: note.date,
      weekOfPregnancy: note.weekOfPregnancy,
      trimester: note.trimester,
      mood: note.mood,
      tags: note.tags,
      formattedDate: note.formattedDate
    }));

    res.json({
      success: true,
      data: {
        week,
        notes: formattedNotes,
        count: formattedNotes.length
      }
    });
  } catch (error) {
    console.error('Error fetching notes by week:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes for the specified week',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get recent notes (for dashboard or quick access)
 * GET /api/notes/recent
 */
const getRecentNotes = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const notes = await Note.getRecentNotes(userId, limit);

    const formattedNotes = notes.map(note => ({
      id: note._id,
      content: note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content,
      date: note.date,
      weekOfPregnancy: note.weekOfPregnancy,
      trimester: note.trimester,
      mood: note.mood,
      formattedDate: note.formattedDate
    }));

    res.json({
      success: true,
      data: {
        notes: formattedNotes,
        count: formattedNotes.length
      }
    });
  } catch (error) {
    console.error('Error fetching recent notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent notes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getNotesByWeek,
  getRecentNotes
};
