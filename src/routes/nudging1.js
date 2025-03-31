const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych
const crypto = require('crypto');

// GET /nudging1 – wyświetlenie zadania
router.get('/', (req, res) => {

    const wylosowanyCzas = req.session.maxCzas; 
    console.log('[GET /nudging1] Odczytany maxCzas z sesji =', wylosowanyCzas);
    req.session.taskStart = Date.now();

      const taskToken = crypto.randomBytes(16).toString('hex');
      req.session.taskToken = taskToken;
      res.render('nudging1', {
        wylosowanyCzas,
        taskToken,
        completedTasks: req.session.completedTasks || [] 
      });
});


// POST /nudging1 – obsługa formularza
router.post('/', (req, res) => {

  const { taskToken } = req.body; 
  // Walidacja tokenu
  if (taskToken !== req.session.taskToken) {
    console.log("BODY taskToken:", req.body.taskToken);
    console.log("SESSION taskToken:", req.session.taskToken);
    console.log("SESSION ID:", req.sessionID)
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
    ;
  }
  // Ensure `completedTasks` exists as an array
  req.session.completedTasks = req.session.completedTasks || [];

  // Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('nudging1')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart;
  // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
  const realStart = startTimestamp || 0;
  const now = Date.now();

  // Oznaczenie zadania jako ukończone
  req.session.completedTasks.push('nudging1');
  delete req.session.maxCzas;
  delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu    
  res.redirect('/intro_task1');// Przekierowanie do intro kolejnego zadania (np. task 3)

  });


     


module.exports = router;
