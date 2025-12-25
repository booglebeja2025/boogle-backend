const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth.routes');
const contactRoutes = require('./routes/contact.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const courseRoutes = require('./routes/course.routes');
const uploadRoutes = require('./routes/upload.routes');

// Middlewares
const errorMiddleware = require('./middlewares/error.middleware');

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 5000;

// ====================
// CONFIGURATION SÉCURITÉ
// ====================

// Headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    status: 'error',
    message: 'Trop de requêtes depuis cette IP'
  }
});

// ====================
// CONFIGURATION CORS
// ====================

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://boogle-backend-6ahk.onrender.com', // El Backend mte3ek
  'https://classy-dasik-bdd8a1.netlify.app/'            // ⚠️ Houni 7ott el link mta3 Netlify mte3ek s7i7!
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ====================
// MIDDLEWARES
// ====================

// Parsing JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'logs', 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
}

// Fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ====================
// CONNECTION DATABASE
// ====================

const MONGODB_URI = process.env.NODE_ENV === 'production' 
  ? process.env.MONGODB_URI_PROD 
  : process.env.MONGODB_URI || 'mongodb://localhost:27017/boogle';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connecté avec succès'))
.catch(err => {
  console.error('❌ Erreur connection MongoDB:', err);
  process.exit(1);
});

// ====================
// ROUTES API
// ====================

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'BOOGLE API est opérationnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/upload', uploadRoutes);

// ====================
// ROUTES FRONTEND
// ====================

// Servir l'index principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Servir le dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Route 404 pour API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route API non trouvée'
  });
});

// Route 404 pour le frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ====================
// GESTION ERREURS
// ====================

app.use(errorMiddleware);

// ====================
// DÉMARRAGE SERVEUR
// ====================

const server = app.listen(PORT, () => {
  console.log(`
  🚀 BOOGLE PLATFORM
  =====================
  📡 Environnement: ${process.env.NODE_ENV}
  🔗 URL: http://localhost:${PORT}
  📊 API: http://localhost:${PORT}/api
  🗄️  Database: ${mongoose.connection.name}
  ⏰ Démarrage: ${new Date().toLocaleString()}
  `);
});

// ====================
// GESTION ARRÊT
// ====================

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    mongoose.connection.close(false, () => {
      console.log('✅ Connection MongoDB fermée');
      process.exit(0);
    });
  });
});

process.on('uncaughtException', (error) => {
  console.error('💥 Erreur non gérée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Promise rejetée non gérée:', reason);
});

module.exports = app;