const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [50, 'Title cannot be more than 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Note', NoteSchema);
