const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych

// GET /task3 – wyświetlenie zadania
router.get('/', (req, res) => {
    // Odczytujemy wylosowany czas z sesji (ustawiony w app.js lub w /intro_task3)
    const wylosowanyCzas = req.session.maxCzas;
    const taskToken = crypto.randomBytes(16).toString('hex');
    req.session.taskToken = taskToken; // Zapisanie tokenu w sesji

    console.log('[GET /task3] Odczytany maxCzas z sesji =', wylosowanyCzas);
    req.session.taskStart = Date.now();

    // Renderujemy widok 'task3.ejs' i przekazujemy wylosowanyCzas
    res.render('task3', {
    wylosowanyCzas,
    taskToken,
    completedTasks: req.session.completedTasks || [] // Przekazywanie completedTasks do widoku
    });
    

});

// POST /task3 – obsługa formularza zadania 3
router.post('/', (req, res) => {

  const { taskToken } = req.body; 
  // Walidacja tokenu
  if (taskToken !== req.session.taskToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` exists as an array
  req.session.completedTasks = req.session.completedTasks || [];

  // Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task3')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }




  const timeout = req.body.timeout === 'true';
  // Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart;
   // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
   const realStart = startTimestamp || 0;
   const now = Date.now();
 // Różnica w sekundach (lub milisekundach, zależnie co wolisz w bazie)
 const czasOdpowiedziRzeczywisty = (now - realStart) / 1000;  //sekundy
 const czasOdpowiedzi = czasOdpowiedziRzeczywisty;

    
    // Pobieramy wybór użytkownika
    const { choice } = req.body;

    // Odczytujemy maksymalny czas (wylosowany wcześniej i zapisany w sesji)
    const maxCzas = req.session.maxCzas;
    // Symulacja czasu odpowiedzi (losujemy od 0 do maxCzas)
    
    console.log("czy wysłany po timeoucie?", timeout);
    // Interpretacja: jeśli choice === 'without_insurance', wynik = 1, inaczej 0
    let wynik;
   if (timeout) {
     wynik = 0; // zadanie niewykonane jeżeli timeout
     console.log('Zadanie zakończone przez timeout');
   } else {
    wynik = (choice === 'without_insurance') ? 1 : 0; // Normalne sprawdzenie wyboru
   }

   if (!req.session.quizResults) req.session.quizResults = [];
    if (!req.session.quizResults.some(result => result.task === 'task3')) {
        req.session.quizResults.push({ task: 'task3', result: wynik });
    }

    console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);
    console.log('[POST /task3]', {
      choice,
      maxCzas,
      czasOdpowiedzi,
      wynik
    });

    // Dodajemy wynik do tabeli 'misdirections'
    const sql = `
      INSERT INTO misdirections (id_sesji, max_czas, czas_odpowiedzi, wynik)
      VALUES (?, ?, ?, ?)
    `;
    console.log('czas odpowiedni wyniosl ',czasOdpowiedzi );
    db.query(sql, [req.session.sessionId, maxCzas, czasOdpowiedzi, wynik], (err) => {
        if (err) {
            console.error('Błąd przy zapisie wyniku dla zadania 3:', err.message);
            return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
        }

           // Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task3');
    delete req.session.maxCzas; // <--- czyścimy czas, by nie był używany w kolejnych zadaniach
    delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu
   // Przekierowanie do kolejnego intro (np. /intro_task4)
   res.redirect('/intro_task4');

    });
});

module.exports = router;
