'use strict';
var authorization = require('./middlewares/authorization');
var error = require('../utils/error');
var schem = require('../controllers/schematics');
var hasAuthorization = function(req, res, next) {
    if (!req.user || (req.user && req.user.isAdmin === false)) {
        return error.sendUnauthorizedError(res);
    }
    next();
};

module.exports = function(app) {
    
    app.post('/api/upload', authorization.requiresLogin , hasAuthorization, schem.receiveFiles);
    app.post('/api/editStd', authorization.requiresLogin , hasAuthorization,  schem.editStd);
    app.post('/api/editComponent',authorization.requiresLogin , hasAuthorization, schem.editComponent);
    app.post('/api/isUniqueId',authorization.requiresLogin, hasAuthorization, schem.isUniqueId);
    app.post('/api/createNode',authorization.requiresLogin, hasAuthorization, schem.createNode);
    
    app.post('/api/publishComponent', authorization.requiresLogin, hasAuthorization, schem.publishComponent);
    app.post('/api/publishStandard', authorization.requiresLogin, hasAuthorization, schem.publishStandard);
    app.post('/api/unpublishStandard', authorization.requiresLogin, hasAuthorization, schem.unpublishStandard);
    app.post('/api/getCompVersions', authorization.requiresLogin, hasAuthorization, schem.getVersions);

    app.post('/api/getEntireStandard', schem.getEntireStandard);
    app.post('/api/getMultiple', schem.getMultiple);
    
    app.get('/api/getChildren/:nodeId', schem.getNodeChildren);
    app.get('/api/getParentHiearchy/:nodeId', schem.getParentHiearchy);
    app.get('/api/delete/:nodeId', authorization.requiresLogin , hasAuthorization, schem.delete);
    app.get('/api/getNode/:nodeId',schem.getNode);
    app.param('nodeId', schem.node);

    app.get('/api/getSchemStds', schem.getAllSchemStds);

};