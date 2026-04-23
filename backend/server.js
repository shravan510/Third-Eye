require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const setupSocket = require('./config/socket');
const { connectPostgres } = require('./config/db.postgres');
const { connectMongo } = require('./config/db.mongo');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = setupSocket(server);
app.set('socketio', io); // inject for controllers

app.use(cors());
app.use(express.json());

// Expose Evidence path
app.use('/evidence', express.static(path.resolve(process.env.EVIDENCE_BASE_PATH || '../evidence')));

// Healthcheck endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// Mount routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/violations', require('./routes/violations.routes'));
app.use('/api/challans', require('./routes/challans.routes'));
app.use('/api/cameras', require('./routes/cameras.routes'));

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectMongo();
        await connectPostgres();

        server.listen(PORT, () => {
            console.log(`[BACKEND] Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('[BACKEND] Failed to start:', err);
    }
}

startServer();
