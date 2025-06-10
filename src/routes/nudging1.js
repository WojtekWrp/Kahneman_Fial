const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// GET /nudging1 – wyświetlenie zadania
router.get('/', (req, res) => {
  req.session.visitedNudging1Get = true;

  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /nudging1]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
  });

  req.session.taskStart = Date.now();

  const nudging1Token = crypto.randomBytes(16).toString('hex');
  req.session.nudging1Token = nudging1Token;

  res.render('nudging1', {
    wylosowanyCzas,
    nudging1Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /nudging1 – obsługa formularza
router.post('/', (req, res) => {
  if (!req.session.visitedNudging1Get) {
    console.log('[POST /nudging1] Brak visitedNudging1Get');
    return res.redirect('/nudging1');
  }

  const { nudging1Token: bodyToken } = req.body;
  if (bodyToken !== req.session.nudging1Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (!req.session.completedTasks.includes('nudging1')) {
    req.session.completedTasks.push('nudging1');
  }

  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  console.log('[POST /nudging1] Zakończenie zadania, czas:', czasOdpowiedziRzeczywisty);

  delete req.session.visitedNudging1Get;
  delete req.session.nudging1Token;
  delete req.session.maxCzas;
  delete req.session.taskStart;

  req.session.save((err) => {
    if (err) {
      console.error('Błąd zapisu sesji (nudging1):', err);
      return res.status(500).send('Błąd sesji.');
    }
    res.redirect('/intro_task1');
  });
});

module.exports = router;
