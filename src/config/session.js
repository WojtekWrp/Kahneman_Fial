module.exports = (req, res, next) => {
    try {
        if (!req || !res || !next) {
            console.error('Nieprawidłowe argumenty w middleware');
            return res.status(500).send('Wewnętrzny błąd serwera: Nieprawidłowe argumenty middleware');
        }

        if (!req.session || !req.session.userId) {
            console.log('Brak aktywnej sesji, przekierowanie na rejestrację.');
            return res.redirect('/register.html'); // Brak sesji – przekierowanie
        }

        next(); // Przejdź do następnego middleware lub endpointu
    } catch (err) {
        console.error('Błąd w middleware sprawdzającym sesję:', err);
        next(err); // Przekaż błąd dalej
    }
};
