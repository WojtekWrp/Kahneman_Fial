const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// GET /nudging2 – wyświetlenie zadania
router.get('/', (req, res) => {
  req.session.visitedNudging2Get = true;

  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /nudging2]', {
    wylosowanyCzas,
    sessionID: req.sessionID
  });

  req.session.taskStart = Date.now();

  const nudging2Token = crypto.randomBytes(16).toString('hex');
  req.session.nudging2Token = nudging2Token;

  res.render('nudging2', {
    wylosowanyCzas,
    nudging2Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /nudging2 – obsługa formularza
router.post('/', (req, res) => {
  if (!req.session.visitedNudging2Get) {
    console.log('[POST /nudging2] Ominięto GET, redirect do /nudging2');
    return res.redirect('/nudging2');
  }

  const { nudging2Token: bodyToken } = req.body;
  console.log("[POST /nudging2]", {
    bodyToken,
    sessionToken: req.session.nudging2Token,
    sessionID: req.sessionID
  });

  if (bodyToken !== req.session.nudging2Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];
  if (!req.session.completedTasks.includes('nudging2')) {
    req.session.completedTasks.push('nudging2');
  }

  // Log start–stop (opcjonalnie):
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czas = (now - startTimestamp) / 1000;
  console.log('[POST /nudging2] Czas wykonania:', czas, 's');

  // Czyścimy sesję
  delete req.session.visitedNudging2Get;
  delete req.session.nudging2Token;
  delete req.session.maxCzas;
  delete req.session.taskStart;

  // Bezpieczny redirect z zapisem sesji
  req.session.save((err) => {
    if (err) {
      console.error('Błąd zapisu sesji (nudging2):', err);
      return res.status(500).send('Błąd sesji.');
    }
    res.redirect('/intro_task3');
  });
});

module.exports = router;
