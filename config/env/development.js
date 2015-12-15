'use strict';

module.exports = {
    base_url: 'https://localhost:3000',
    db: "mongodb://localhost/ACE-dev",
    app: {
        name: "Autodesk - ACE ComOn Dev"
    },
    oauth: {
        requestTokenURL: 'https://accounts-staging.autodesk.com/OAuth/RequestToken',
        accessTokenURL: 'https://accounts-staging.autodesk.com/OAuth/AccessToken',
        userAuthorizationURL: 'https://accounts-staging.autodesk.com/OAuth/Authorize',
        consumerKey: 'a8b7d3a1-038b-41bc-ac96-3077485d4479',//'5f7de223-2148-479b-9ae1-e835f590c117',
        consumerSecret: 'a89a322b-d2fc-4205-a9b4-5e36e0be051d',//'fb3d2f26-d89e-4ab5-9da4-d9c0664c3c9d',
        callbackURL: 'https://localhost:3000/auth/oauth/callback',
        apiURL: 'https://accounts-staging.autodesk.com',
        oxygenUrl: 'https://accounts-staging.autodesk.com',
        consumerKeyNitrogen: 'a8b7d3a1-038b-41bc-ac96-3077485d4479',
        consumerSecretNitrogen: 'a89a322b-d2fc-4205-a9b4-5e36e0be051d'
    }
};