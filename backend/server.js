/**
 * ╔═══════════════════════════════════════════════════╗
 * ║   EXPRESS SERVER — Multi Feature App Backend      ║
 * ║   MERN Stack (MongoDB + Express + React Native)   ║
 * ╚═══════════════════════════════════════════════════╝
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// ─── Load environment variables ─────────────────────────────
dotenv.config();

// ─── Connect to MongoDB ─────────────────────────────────────
connectDB();

// ─── Initialize Express ─────────────────────────────────────
const app = express();

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());                    // Enable CORS for React Native
app.use(express.json());            // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));             // Log HTTP requests in dev mode

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
// ─── Health Check Route ─────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Multi Feature App API is running!',
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ─── 404 Handler ────────────────────────────────────────────
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ─── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
});

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('');
    console.log('═'.repeat(50));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('═'.repeat(50));
    console.log('');
});
