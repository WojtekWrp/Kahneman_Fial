const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych
const crypto = require('crypto');

// GET /task2 – wyświetlenie zadania
router.get('/', (req, res) => {
    // Tutaj już nie losujemy. Odczytujemy wylosowany czas z sesji (ustawiony w app.js)
    const wylosowanyCzas = req.session.maxCzas || 5; 
    console.log('[GET /task2] Odczytany maxCzas z sesji =', wylosowanyCzas);
    req.session.taskStart = Date.now();
    // Renderujemy szablon ejs 'task2.ejs' z przekazaną zmienną

     // Generowanie unikalnego tokenu
      const taskToken = crypto.randomBytes(16).toString('hex');
      req.session.taskToken = taskToken; // Zapisanie tokenu w sesji

      res.render('task2', {
        wylosowanyCzas,
        taskToken,
        completedTasks: req.session.completedTasks || [] // Przekazywanie completedTasks do widoku
      });
});


// POST /task2 – obsługa formularza
router.post('/', (req, res) => {

  const { taskToken } = req.body; 
  // Walidacja tokenu
  if (taskToken !== req.session.taskToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }
  // Ensure `completedTasks` exists as an array
  req.session.completedTasks = req.session.completedTasks || [];

  // Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task2')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }



  // Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart;
  // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
  const realStart = startTimestamp || 0;
  const now = Date.now();

  // Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';  


  // Różnica w sekundach (lub milisekundach, zależnie co wolisz w bazie)
  const czasOdpowiedziRzeczywisty = (now - realStart) / 1000;  //sekundy

    // Pobierz wybór użytkownika z formularza
    const { choice } = req.body; 
    // Odczytaj maxCzas z sesji (wylosowany w app.js -> /intro_task2)
    const maxCzas = req.session.maxCzas || 5; 
    // Symulacja czasu odpowiedzi użytkownika
     const czasOdpowiedzi = czasOdpowiedziRzeczywisty;

    // Interpretacja wyboru:
    // "cancel" => wynik = 1 (użytkownik dał sobie radę)
    // cokolwiek innego => wynik = 0
    console.log("czy wysłany po timeoucie?", timeout);
    let wynik;
    if (timeout) {
      wynik = 0; // zadanie niewykonane jeżeli timeout
      console.log('Zadanie zakończone przez timeout');
    } else {
      wynik = (choice === 'cancel') ? 1 : 0;
    }

    if (!req.session.quizResults) req.session.quizResults = [];
    if (!req.session.quizResults.some(result => result.task === 'task2')) {
        req.session.quizResults.push({ task: 'task2', result: wynik });
    }
    console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);

    console.log('[POST /task2]', {
      choice,
      maxCzas,
      czasOdpowiedzi,
      wynik
    });

    // Dodajemy wynik do tabeli false_hierarchy
    const sql = `
      INSERT INTO false_hierarchy (id_sesji, max_czas, czas_odpowiedzi, wynik)
      VALUES (?, ?, ?, ?)
    `;

    console.log('czas odpowiedni wyniosl ',czasOdpowiedzi );
    db.query(sql, [req.session.sessionId, maxCzas, czasOdpowiedzi, wynik], (err) => {
        if (err) {
            console.error('Błąd przy zapisie wyniku dla zadania 2:', err.message);
            return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
        }


    // Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task2');
    delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu    
    res.redirect('/intro_nudging2');// Przekierowanie do intro kolejnego zadania (np. task 3)
    });
});

module.exports = router;
