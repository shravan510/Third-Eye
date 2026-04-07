const mongoose = require('mongoose');

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/third_eye_users');
        console.log('[MONGO] Connected to MongoDB users database successfully.');
    } catch (error) {
        console.error('[MONGO] Connection Error:', error);
    }
}

module.exports = { connectMongo };
