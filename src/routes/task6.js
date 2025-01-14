// routes/task6.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task6 – wyświetlenie zadania (czas zawsze 30s)
router.get('/', (req, res) => {
    // Ustawiamy stałe 30s w tym zadaniu
    const maxCzas = 30;
    const now = Date.now();
    
    // Określamy, czy to wersja "tricked" czy "normal"
    // Możesz ustawić na stałe np. true, albo wylosować:
    const isTricked = Math.random() < 0.5;
    

    // Zapisujemy w sesji, by ewentualnie wykorzystać w routerze
    req.session.maxCzas = maxCzas;
    req.session.isTricked = isTricked;

    // Zapisujemy moment startu (rzeczywistego wejścia na /task6)
    req.session.taskStart = Date.now();

    console.log('[GET /task6]', {
      isTricked,
      maxCzas,
      taskStart: req.session.taskStart
    });

    // Renderujemy widok task6.ejs, przekazujemy isTricked i maxCzas
    res.render('task6', { isTricked, maxCzas });
});

// POST /task6 – zapis wyniku w tabeli `timepressing`
router.post('/', (req, res) => {
  
  
  // Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';  
  console.log("czy wysłany po timeoucie?", timeout);

  // Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart;
  // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
  const realStart = startTimestamp || 0;
  const now = Date.now();
  // Różnica w sekundach (lub milisekundach, zależnie co wolisz w bazie)
  const czasOdpowiedziRzeczywisty = (now - realStart) / 1000;  //sekundy
  const czasOdpowiedzi = czasOdpowiedziRzeczywisty;




    // Odczytujemy z sesji dane
    const isTricked = req.session.isTricked || false;
    const wersja = isTricked ? 'tricked' : 'normal';

    // Rzeczywisty czas od wejścia (GET) do kliknięcia (POST)
    
    const czasOdKlikniecia = (Date.now() - startTimestamp) / 1000; // sekundy

    // Jeśli user nie zaznaczył "zapakowanie", w ogóle nie będzie `req.body.zapakowanie`.
    // Wg wymagań: WYNIK = 1 => user NIE dał się namówić (czyli NIE zaznaczył)
    //             WYNIK = 0 => user dał się (zaznaczył).
    const zapakowanie = req.body.zapakowanie; // '5' jeśli zaznaczył, undefined jeśli nie


     // Ustalanie wyniku na podstawie timeout
    let wynik;
    if (timeout) {
      wynik = 0; // zadanie niewykonane jeżeli timeout
      console.log('Zadanie zakończone przez timeout');
    } else {
      wynik = zapakowanie ? 0 : 1; // Normalne sprawdzenie wyboru
    }


    if (!req.session.quizResults) req.session.quizResults = [];
    if (!req.session.quizResults.some(result => result.task === 'task6')) {
        req.session.quizResults.push({ task: 'task6', result: wynik });
    }
    console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);

    console.log('[POST /task6]', {
      wersja,
      czasOdKlikniecia,
      wynik,
      zapakowanie
    });

    // Zapis do tabeli timepressing
    // Kolumny: id_sesji, wersja (enum('tricked','normal')), czas_odpowiedzi, wynik
    const sql = `
      INSERT INTO timepressing (id_sesji, wersja, czas_odpowiedzi, wynik)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [
      req.session.sessionId, // id_sesji
      wersja,                // 'tricked' lub 'normal'
      czasOdKlikniecia,      // float
      wynik                  // 1 lub 0
    ], (err) => {
        if (err) {
            console.error('Błąd przy zapisie do timepressing:', err.message);
            return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
        }

        // Po zapisie przekierowujemy np. do /intro_task7
        res.redirect('/intro_task7');
    });
});

module.exports = router;
