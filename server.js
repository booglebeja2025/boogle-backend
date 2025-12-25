const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth.routes');
const contactRoutes = require('./routes/contact.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const courseRoutes = require('./routes/course.routes');
const uploadRoutes = require('./routes/upload.routes');

const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 10000;

// ====================
// CONFIGURATION SÉCURITÉ
// ====================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

// ====================
// CONFIGURATION CORS
// ====================

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://boogle-backend-6ahk.onrender.com',
  'https://classy-dasik-bdd8a1.netlify.app' // Na7ina el "/" l-lekhra bech ma ya3mely mochekla
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ====================
// MIDDLEWARES
// ====================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Salla7na el mochekla houni (Na7ina el accessLogStream)
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ====================
// CONNECTION DATABASE
// ====================

const MONGODB_URI = process.env.NODE_ENV === 'production' 
  ? process.env.MONGODB_URI_PROD 
  : process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB connecté avec succès'))
.catch(err => {
  console.error('❌ Erreur connection MongoDB:', err);
});

// ====================
// ROUTES API
// ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/upload', uploadRoutes);

// Servir le frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(errorMiddleware);

const server = app.listen(PORT, () => {
  console.log(`🚀 BOOGLE Server running on port ${PORT}`);
});

module.exports = app;