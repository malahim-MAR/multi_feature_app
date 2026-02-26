/**
 * ╔═══════════════════════════════════════════════════╗
 * ║   MongoDB Connection Configuration                ║
 * ║   Uses Mongoose to connect to MongoDB Atlas       ║
 * ╚═══════════════════════════════════════════════════╝
 */
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log('═'.repeat(50));
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📂 Database: ${conn.connection.name}`);
        console.log('═'.repeat(50));
    } catch (error) {
        console.error('═'.repeat(50));
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('═'.repeat(50));
        console.error('\n💡 Troubleshooting tips:');
        console.error('   1. Check your MONGODB_URI in backend/.env');
        console.error('   2. Make sure your IP is whitelisted in MongoDB Atlas');
        console.error('      → Atlas → Network Access → Add IP Address → Allow Access from Anywhere');
        console.error('   3. Verify your username/password are correct');
        console.error('   4. Check your internet connection\n');
        process.exit(1);
    }
};

module.exports = connectDB;
