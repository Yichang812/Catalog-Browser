'use strict';

// User routes use users controller
var users = require('../controllers/users');
var authorization = require('./middlewares/authorization');
var error = require('../utils/error');

var hasAuthorization = function(req, res, next) {
    if (!req.user || (req.user && req.user.isAdmin === false)) {
        return error.sendUnauthorizedError(res);
    }
    next();
};

module.exports = function(app, passport) {

    app.get('/signout', users.signout);
    app.get('/api/users/me', authorization.requiresLogin , users.me);
    app.post('/api/users',authorization.requiresLogin , hasAuthorization, users.all);

    app.get('/api/makeAdmin/:name', authorization.requiresLogin , users.makeAdmin);
    app.param('name', users.findByName);

    app.get('/api/users/:userId', authorization.requiresLogin, hasAuthorization, users.changeStatus);
    app.param('userId', users.user);

    app.get('/api/updateCodeName/:codeName', authorization.requiresLogin , users.updateCodeName);
    app.post('/api/updateUserPrdt', authorization.requiresLogin , users.updateUserPrdt);
    app.get('/api/updateUserDefPrdt/:userDefPrdt', authorization.requiresLogin , users.updateUserDefPrdt);

    app.post('/api/addSchemFav', authorization.requiresLogin, users.addSchemFavourite);
    app.post('/api/delSchemFav', authorization.requiresLogin, users.removeSchemFavourite);
    app.get('/api/getSchemFav', authorization.requiresLogin, users.getSchemFavourites);
    app.post('/api/updateSchemFav', authorization.requiresLogin, users.updateSchemFavourite);

    app.post('/api/addFilter', authorization.requiresLogin, users.addFilter);
    app.post('/api/delFilter', authorization.requiresLogin, users.removeFilter);
    app.post('/api/getFilters', authorization.requiresLogin, users.getFilters);

    app.post('/api/addCatFav', authorization.requiresLogin, users.addCatFavourite);
    app.post('/api/delCatFav', authorization.requiresLogin, users.removeCatFavourite);
    app.post('/api/getCatFav', authorization.requiresLogin, users.getCatFavourite);

    app.post('/api/addAssociation', authorization.requiresLogin, users.addAssociation);
    app.post('/api/delAssociation', authorization.requiresLogin, users.removeAssociation);
    app.post('/api/updateAssociation', authorization.requiresLogin, users.updateAssociation);
    app.get('/api/getAssociations', authorization.requiresLogin, users.getAssociations);
    
    // Setting the oxygen oauth route
    app.get('/auth/oauth', passport.authenticate('oauth', {
        failureRedirect: '/'
    }));
    app.get('/auth/oauth/callback', passport.authenticate('oauth', {
        failureRedirect: '/'
    }), users.authCallback);

    //Setting up the xauth login
    app.post('/xauth',  passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/'
    }));

};
