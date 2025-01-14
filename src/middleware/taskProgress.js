const db = require('../config/db'); // Import konfiguracji bazy danych

/**
 * Middleware sprawdzający, czy użytkownik ukończył poprzednie zadanie
 * @param {string} table - Nazwa tabeli, w której sprawdzamy postęp
 * @returns Middleware funkcja
 */
module.exports = (table) => (req, res, next) => {
    const sessionId = req.session.sessionId;

    if (!sessionId) {
        console.error('Brak sesji. Użytkownik musi być zalogowany.');
        return res.redirect('/register'); // Przekierowanie do rejestracji
    }

    const sql = `SELECT COUNT(*) AS completed FROM ${table} WHERE id_sesji = ?`;
    db.query(sql, [sessionId], (err, results) => {
        if (err) {
            console.error('Błąd przy sprawdzaniu postępu:', err.message);
            return res.status(500).send('Wystąpił błąd serwera.');
        }

        // Sprawdzenie, czy użytkownik ukończył poprzednie zadanie
        if (results[0].completed === 0) {
            console.log(`Zadanie w tabeli ${table} nieukończone.`);
            return res.redirect('/task1'); // Przekierowanie na poprzednie zadanie
        }

        console.log(`Zadanie w tabeli ${table} ukończone. Kontynuuję.`);
        next(); // Kontynuacja, jeśli zadanie jest ukończone
    });
};
