#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Démarrage de BOOGLE Platform...');

// Vérifier les variables d'environnement
if (!process.env.NODE_ENV) {
  console.log('⚠️  NODE_ENV non défini, utilisation du mode développement');
  process.env.NODE_ENV = 'development';
}

// Créer les dossiers nécessaires
const folders = ['uploads', 'logs', 'database'];
folders.forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`📁 Dossier créé: ${folder}`);
  }
});

// Lancer le serveur
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('❌ Erreur de démarrage:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`📴 Serveur arrêté avec code: ${code}`);
});