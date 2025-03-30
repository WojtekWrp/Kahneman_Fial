const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych
const crypto = require('crypto');

// GET /nudging2 – wyświetlenie zadania
router.get('/', (req, res) => {

  const wylosowanyCzas = req.session.maxCzas; 
    console.log('[GET /nudging2] Odczytany maxCzas z sesji =', wylosowanyCzas);
    req.session.taskStart = Date.now();

      const taskToken = crypto.randomBytes(16).toString('hex');
      req.session.taskToken = taskToken;
      res.render('nudging2', {
        wylosowanyCzas,
        taskToken,
        completedTasks: req.session.completedTasks || [] 
      });
});


// POST /nudging2 – obsługa formularza
router.post('/', (req, res) => {

  const { taskToken } = req.body; 
  // Walidacja tokenu
  if (taskToken !== req.session.taskToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }
  // Ensure `completedTasks` exists as an array
  req.session.completedTasks = req.session.completedTasks || [];

  // Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('nudging2')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart;
  // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
  const realStart = startTimestamp || 0;
  const now = Date.now();

  // Oznaczenie zadania jako ukończone
  req.session.completedTasks.push('nudging2');
  delete req.session.maxCzas; // <--- czyścimy czas, by nie był używany w kolejnych zadaniach
  delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu    
  res.redirect('/intro_task3');// Przekierowanie do intro kolejnego zadania- task3

  });


     


module.exports = router;
