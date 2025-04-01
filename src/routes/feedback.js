const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /feedback – wyświetlenie zadania (lub formularza oceny)
router.get('/', (req, res) => {
  // 1. Ustawiamy flagę: user odwiedził GET /feedback
  req.session.visitedFeedbackGet = true;

  // 2. Generowanie unikalnego tokenu
  const feedbackToken = crypto.randomBytes(16).toString('hex');
  req.session.feedbackToken = feedbackToken;

  // 3. Zapisujemy moment startu (rzeczywistego wejścia na /feedback)
  req.session.taskStart = Date.now();

  console.log('[GET /feedback]', {
    feedbackToken,
    sessionID: req.sessionID
  });

  // 4. Renderujemy widok feedback.ejs
  //    Pamiętaj, by w widoku użyć <input type="hidden" name="feedbackToken" value="<%= feedbackToken %>">
  res.render('feedback', {
    feedbackToken,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /feedback – zapis oceny
router.post('/', (req, res) => {
  // 1. Sprawdź, czy odwiedzono GET /feedback
  if (!req.session.visitedFeedbackGet) {
    console.log('[POST /feedback] Nie odwiedził GET, redirect do /feedback');
    return res.redirect('/feedback');
  }

  // 2. Odczytujemy token z formularza
  const { feedbackToken: bodyToken, ocena } = req.body;
  console.log('[POST /feedback]', {
    bodyToken,
    sessionToken: req.session.feedbackToken,
    ocena,
    sessionID: req.sessionID
  });

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.feedbackToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` exists
  req.session.completedTasks = req.session.completedTasks || [];

  // 4. Czy zadanie 'feedback' już ukończone?
  if (req.session.completedTasks.includes('feedback')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 5. Zapis do bazy – np. session_mark
  const sql = `
    INSERT INTO session_mark (id_sesji, ocena)
    VALUES (?, ?)
  `;
  db.query(sql, [req.session.sessionId, ocena], (err) => {
    if (err) {
      console.error('Błąd przy zapisie do session_mark:', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    console.log('Zapisano ocenę w session_mark:', ocena);

    // 6. Dodajemy 'feedback' do completedTasks
    req.session.completedTasks.push('feedback');

    // 7. Usunięcie tokenu i flagi po zapisaniu
    delete req.session.visitedFeedbackGet;
    delete req.session.feedbackToken;
    delete req.session.taskStart;

    // 8. Przekierowanie np. do /outro
    res.redirect('/outro');
  });
});

module.exports = router;
