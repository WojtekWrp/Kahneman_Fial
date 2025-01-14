// middleware/checkSession.js
module.exports = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        console.log('Brak aktywnej sesji, przekierowanie na rejestrację.');
        return res.redirect('/register.html');
    }
    next();
};
