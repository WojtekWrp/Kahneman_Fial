module.exports = (req, res, next) => {
    try {
        if (!req.session || !req.session.userId) {
            console.log('Brak aktywnej sesji, przekierowanie na rejestrację.');
            return res.redirect('/register.html');
        }
        next();
    } catch (err) {
        console.error('Błąd w middleware sprawdzającym sesję:', err);
        next(err);
    }
};
