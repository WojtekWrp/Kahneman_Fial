const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// GET /nudging3 – wyświetlenie zadania
router.get('/', (req, res) => {
  req.session.visitedNudging3Get = true;

  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /nudging3] Odczytany maxCzas =', wylosowanyCzas, 'sessionID =', req.sessionID);

  req.session.taskStart = Date.now();

  const nudging3Token = crypto.randomBytes(16).toString('hex');
  req.session.nudging3Token = nudging3Token;

  res.render('nudging3', {
    wylosowanyCzas,
    nudging3Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /nudging3 – obsługa formularza
router.post('/', (req, res) => {
  if (!req.session.visitedNudging3Get) {
    console.log('[POST /nudging3] Brak visitedNudging3Get – redirect');
    return res.redirect('/nudging3');
  }

  const { nudging3Token: bodyToken } = req.body;
  console.log("[POST /nudging3]", {
    bodyToken,
    sessionToken: req.session.nudging3Token,
    sessionID: req.sessionID
  });

  if (bodyToken !== req.session.nudging3Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (!req.session.completedTasks.includes('nudging3')) {
    req.session.completedTasks.push('nudging3');
  }

  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czas = (now - startTimestamp) / 1000;
  console.log('[POST /nudging3] czas:', czas, 'sekund');

  delete req.session.visitedNudging3Get;
  delete req.session.nudging3Token;
  delete req.session.maxCzas;
  delete req.session.taskStart;

  req.session.save((err) => {
    if (err) {
      console.error('Błąd zapisu sesji (nudging3):', err);
      return res.status(500).send('Błąd sesji.');
    }
    res.redirect('/intro_task7');
  });
});

module.exports = router;
