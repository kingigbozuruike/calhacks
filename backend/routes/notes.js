const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const NotesController = require('../controllers/NotesController');

// All routes require authentication
router.use(verifyToken);

// Create a new note
router.post('/', NotesController.createNote);

// Get user's notes with pagination
router.get('/', NotesController.getNotes);

// Get recent notes (for dashboard)
router.get('/recent', NotesController.getRecentNotes);

// Get notes for a specific week
router.get('/week/:week', NotesController.getNotesByWeek);

// Get a specific note by ID
router.get('/:id', NotesController.getNoteById);

// Update a note
router.put('/:id', NotesController.updateNote);

// Delete a note
router.delete('/:id', NotesController.deleteNote);

module.exports = router;
