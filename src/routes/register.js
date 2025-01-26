const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Ścieżka do pliku konfiguracji bazy danych


// GET /register - Wyświetlenie formularza rejestracji
router.get('/', (req, res) => {
  // Czyszczenie sesji przed rozpoczęciem rejestracji
  req.session.destroy((err) => {
    if (err) {
      console.error('Błąd przy niszczeniu sesji:', err);
    }
    // Renderowanie widoku EJS (views/register.ejs)
    res.render('register');
  });
});

// POST /register - Obsługa formularza rejestracji
router.post('/', (req, res) => {
  const { wiek, plec, wyksztalcenie, uczelnia, rodzaj_wyksztalcenia } = req.body;

  // Dodanie użytkownika do bazy danych
  const sql = `
    INSERT INTO uzytkownicy (wiek, plec, id_wyksztalcenia, uczelnia, id_rodzaju_wyksztalcenia)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [wiek, plec, wyksztalcenie, uczelnia, rodzaj_wyksztalcenia], (err, result) => {
    if (err) {
      console.error('Błąd przy rejestracji:', err.message);
      return res.status(500).send('Wystąpił błąd podczas rejestracji.');
    }

    console.log('Rejestracja zakończona, dane użytkownika zapisane.');
    const userId = result.insertId;
    const startTime = new Date();

    // Tworzenie nowej sesji w bazie danych
    const sessionSql = 'INSERT INTO sesja (id_uzytkownika, rozp_sesji) VALUES (?, ?)';
    db.query(sessionSql, [userId, startTime], (err, sessionResult) => {
      if (err) {
        console.error('Błąd przy tworzeniu sesji:', err.message);
        return res.status(500).send('Wystąpił błąd przy tworzeniu sesji.');
      }

      req.session.userId = userId;
      req.session.sessionId = sessionResult.insertId;

      // Przekierowanie do pierwszego zadania
      res.redirect('/intro_nudging1');
    });
  });
});

module.exports = router;
