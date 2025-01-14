const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych

router.post('/', (req, res) => {
    const { wiek, plec, wyksztalcenie, uczelnia } = req.body;
    const sql = 'INSERT INTO uzytkownicy (wiek, plec, id_wyksztalcenia, uczelnia) VALUES (?, ?, ?, ?)';
    db.query(sql, [wiek, plec, wyksztalcenie, uczelnia], (err, result) => {
        if (err) {
            console.error('Błąd przy rejestracji:', err.message);
            return res.status(500).send('Wystąpił błąd podczas rejestracji.');
        }

        const userId = result.insertId;
        const sessionSql = 'INSERT INTO sesja (id_uzytkownika, rozp_sesji) VALUES (?, NOW())';
        db.query(sessionSql, [userId], (err, sessionResult) => {
            if (err) {
                console.error('Błąd przy tworzeniu sesji:', err.message);
                return res.status(500).send('Wystąpił błąd przy tworzeniu sesji.');
            }

            req.session.userId = userId;
            req.session.sessionId = sessionResult.insertId;
            res.redirect('/intro_task1.html');
        });
    });
});

module.exports = router;
