const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /feedback – wyświetlenie zadania (czas zawsze 30s)
router.get('/', (req, res) => {
  // Generowanie unikalnego tokenu
  const taskToken = crypto.randomBytes(16).toString('hex');
  req.session.taskToken = taskToken; // Zapisanie tokenu w sesji

  // Zapisujemy moment startu (rzeczywistego wejścia na /feedback)
  req.session.taskStart = Date.now();

  // Renderujemy widok feedback.ejs
  // Przekazujemy taskToken i completedTasks (jeśli istnieją)
  res.render('feedback', {
    taskToken,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /feedback – zapis oceny
router.post('/', (req, res) => {
  const { taskToken, ocena } = req.body;

  // Informacyjny log w konsoli
  console.log('Ocena użytkownika:', ocena);

  // Zapytanie SQL – wstawiamy tylko id_sesji i ocena do session_mark
  const sql = `
    INSERT INTO session_mark (id_sesji, ocena)
    VALUES (?, ?)
  `;

  db.query(sql, [req.session.sessionId, ocena], (err) => {
    if (err) {
      console.error('Błąd przy zapisie do session_mark:', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    console.log('Zapisano ocenę w session_mark.');

    // Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('feedback');
    delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu

    // Po zapisie przekierowujemy np. do /outro
    res.redirect('/outro');
  });
});

module.exports = router;
