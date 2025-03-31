const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task6 – wyświetlenie zadania (czas zawsze 30s)
router.get('/', (req, res) => {
    const maxCzas = 30;
    const isTricked = Math.random() < 0.5; // Określamy, czy to wersja "tricked" czy "normal"

    // Zapisujemy dane w sesji
    req.session.maxCzas = maxCzas;
    req.session.isTricked = isTricked;
    req.session.taskStart = Date.now();

    // Generowanie unikalnego tokenu
    const taskToken = crypto.randomBytes(16).toString('hex');
    req.session.taskToken = taskToken;

    console.log('[GET /task6]', {
        isTricked,
        maxCzas,
        taskStart: req.session.taskStart
    });

    // Renderujemy widok task6.ejs
    res.render('task6', {
        wylosowanyCzas: maxCzas,
        taskToken,
        isTricked,
        completedTasks: req.session.completedTasks || [] // Przekazywanie completedTasks do widoku,
        
    });
});

// POST /task6 – zapis wyniku w tabeli `timepressing`
router.post('/', (req, res) => {
    const { taskToken } = req.body;

    // Walidacja tokenu
    if (taskToken !== req.session.taskToken) {
        return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
    }

    // Ensure `completedTasks` exists as an array
    req.session.completedTasks = req.session.completedTasks || [];

    // Sprawdzenie, czy zadanie zostało ukończone
    if (req.session.completedTasks.includes('task6')) {
        return res.status(400).send('To zadanie zostało już ukończone.');
    }

    // Pobieramy znacznik timeout
    const timeout = req.body.timeout === 'true';
    console.log('Czy wysłany po timeoucie?', timeout);

    // Zaczytujemy moment startu
    const startTimestamp = req.session.taskStart || 0;
    const now = Date.now();
    const czasOdKlikniecia = (now - startTimestamp) / 1000; // sekundy

    // Odczytujemy dane z sesji
    const isTricked = req.session.isTricked || false;
    const wersja = isTricked ? 'tricked' : 'normal';

    // Sprawdzamy wybór użytkownika
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

    console.log('[POST /task6]', {
        wersja,
        czasOdKlikniecia,
        wynik,
        zapakowanie
    });

    // Zapis do tabeli timepressing
    const sql = `
        INSERT INTO timepressing (id_sesji, wersja, czas_odpowiedzi, wynik, timeout)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        req.session.sessionId, // id_sesji
        wersja,                // 'tricked' lub 'normal'
        czasOdKlikniecia,      // float
        wynik,  // 1 lub 0
        timeout ? 1 : 0                  
    ], (err) => {
        if (err) {
            console.error('Błąd przy zapisie do timepressing:', err.message);
            return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
        }

        // Oznaczenie zadania jako ukończone
        req.session.completedTasks.push('task6');
        delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu
        delete req.session.maxCzas; // <--- czyścimy czas, by nie był używany w kolejnych zadaniach

        // Przekierowanie do kolejnego zadania
        res.redirect('/intro_nudging3');
    });
});

module.exports = router;
