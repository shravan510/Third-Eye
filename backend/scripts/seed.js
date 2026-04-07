require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Officer = require('../models/mongo/Officer');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/third_eye_users');
        console.log('Connected to DB');

        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        
        await Officer.deleteMany({});
        
        const admin = new Officer({
            officer_id: 'RTO-ADMIN-01',
            name: 'System Administrator',
            badge_number: 'ADM-001',
            email: 'admin@thirdeye.com',
            password_hash: hashedPassword,
            role: 'admin',
            station: 'Headquarters'
        });

        await admin.save();
        console.log('Admin user created successfully');
        
        process.exit();
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

seedDB();
