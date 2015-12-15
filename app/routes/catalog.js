'use strict';
var authorization = require('./middlewares/authorization');
var error = require('../utils/error');
var catalog = require('../controllers/catalog');
var hasAuthorization = function(req, res, next) {
    if (!req.user || (req.user && (req.user.isAdmin || req.user.isManufacturer)  === false)) {
        return error.sendUnauthorizedError(res);
    }
    next();
};

module.exports = function(app) {
    
    app.post('/api/updateCatalog', authorization.requiresLogin , hasAuthorization, catalog.populateCatalog);
    app.post('/api/updateEntry', authorization.requiresLogin, hasAuthorization, catalog.editCatalogEntry);
    app.post('/api/deleteEntryById', authorization.requiresLogin, hasAuthorization, catalog.deleteCatalogEntry);
    app.post('/api/getTypeFields', catalog.getAllFields);
    app.post('/api/getEntries', catalog.getCatalogEntries);
    app.post('/api/getEntryById',catalog.getCatalogEntryById);
    app.post('/api/getAllUniqueValues',catalog.getAllUniqueValues);
    app.post('/api/checkCatUnique', catalog.checkUnique);
    
    app.get('/api/getTypes', catalog.getAllTypes);

    //------------ For MEP Catalog ------------//
    app.post('/api/getMepStandardCategories', catalog.getMepStandardCategories);

    app.get('/api/getMepStandards', catalog.getAllMepStandards);
};