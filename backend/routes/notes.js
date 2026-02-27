const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// @route   POST /api/notes
// @desc    Create a new note
// @access  Public (for now)
router.post('/', async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Please provide both a title and description' });
        }

        const note = await Note.create({
            title,
            description
        });

        res.status(201).json({
            success: true,
            data: note
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/notes
// @desc    Get all notes
// @access  Public (for now)
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 }); // newest first
        res.status(200).json({
            success: true,
            count: notes.length,
            data: notes
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});



module.exports = router;
