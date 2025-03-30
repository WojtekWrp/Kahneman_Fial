const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');

// GET /task7
router.get('/', (req, res) => {

  

    // Losujemy wersję
    req.session.taskStart = Date.now();
    const isNegative = Math.random() < 0.5;  // 50% szans na negative, 50% na positive
    const wersja = isNegative ? 'negative' : 'positive';
    console.log("wylosowana wersja", wersja);

    // Generowanie unikalnego tokenu
    const taskToken = crypto.randomBytes(16).toString('hex');
    req.session.taskToken = taskToken; // Zapisanie tokenu w sesji
   

    req.session.wersja = wersja; // Zapisujemy w sesji
    // Renderujemy plik EJS z wylosowaną wersją
    res.render('task7', {
      taskToken,
      wersja,
      completedTasks: req.session.completedTasks || [] // Przekazywanie completedTasks do widoku
    });


});

// POST /task7 – obsługa formularza (ubezpieczenie / brak ubezpieczenia)
router.post('/', (req, res) => {


  const { taskToken } = req.body; 
  // Walidacja tokenu
  if (taskToken !== req.session.taskToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` exists as an array
  req.session.completedTasks = req.session.completedTasks || [];

  // Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task7')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }
    // Pobieramy znacznik timeout
    const timeout = req.body.timeout === 'true';  
    console.log("czy wysłany po timeoucie?", timeout);

     // Zaczytujemy moment startu z sesji
    const startTimestamp = req.session.taskStart;
     const now = Date.now();

  // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
  const realStart = startTimestamp || 0;
  const czasOdpowiedziRzeczywisty = (now - realStart) / 1000; // w sekundach
    // Jeśli user zaznaczył checkbox name="ubezpieczenie", w req.body.ubezpieczenie będzie np. 'on' (albo '1')
    const ubezpieczenie = req.body.ubezpieczenie; // 'on' jeśli zaznaczone, undefined jeśli nie
    const wersja = req.session.wersja;
    console.log("Czy zaznaczył ubezpieczenie",ubezpieczenie );
    //jeżeli zaznaczono ubezpieczenie- zwracamy 0
    let wynik;
    if (timeout) {
      wynik = 0; // zadanie niewykonane jeżeli timeout
      console.log('Zadanie zakończone przez timeout');
    } else {
      wynik = (ubezpieczenie === 'True') ? 0 : 1; // Normalne sprawdzenie wyboru
    }

    if (!req.session.quizResults) req.session.quizResults = [];
    if (!req.session.quizResults.some(result => result.task === 'task7')) {
        req.session.quizResults.push({ task: 'task7', result: wynik });
    }
    console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);

    console.log('[POST /task7]', {
      ubezpieczenie,
      wynik,
      czasOdpowiedziRzeczywisty

    });
    
    // Tutaj możesz zapisać do bazy, np.:
    const sql = `
    INSERT INTO framing (id_sesji, wersja, czas_odpowiedzi, wynik)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [
    req.session.sessionId, // id_sesji
    wersja,                // 'tricked' lub 'normal'
    czasOdpowiedziRzeczywisty,      // float
    wynik                  // 1 lub 0
  ], (err) => {
      if (err) {
          console.error('Błąd przy zapisie do timepressing:', err.message);
          return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
      }




    // Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task7');
    delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu
    delete req.session.maxCzas; // <--- czyścimy czas, by nie był używany w kolejnych zadaniach

    // Po zapisie przekierowujemy np. do /intro_task7
    res.redirect('/intro_task8');
  });
});
module.exports = router;
