function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/admin/login');
}

function isNotAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return res.redirect('/admin/dashboard');
    }
    next();
}

module.exports = {
    isAuthenticated,
    isNotAuthenticated
}; 