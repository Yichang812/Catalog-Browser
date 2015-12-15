'use strict';

module.exports = {
    base_url: 'https://ec2-54-255-35-115.ap-southeast-1.compute.amazonaws.com',//'http://ecs-237d5f21.ecs.ads.autodesk.com/',
    db: "mongodb://ec2-54-255-35-115.ap-southeast-1.compute.amazonaws.com/ACE-prod",
    app: {
        name: "Autodesk - ACE ComOn Production"
    },
	oauth: {
        requestTokenURL: 'https://accounts-staging.autodesk.com/OAuth/RequestToken',
        accessTokenURL: 'https://accounts-staging.autodesk.com/OAuth/AccessToken',
        userAuthorizationURL: 'https://accounts-staging.autodesk.com/OAuth/Authorize',
        consumerKey: 'a8b7d3a1-038b-41bc-ac96-3077485d4479',
        consumerSecret: 'a89a322b-d2fc-4205-a9b4-5e36e0be051d',
        callbackURL: 'https://ec2-54-251-227-173.ap-southeast-1.compute.amazonaws.com/auth/oauth/callback',
        apiURL: 'https://accounts-staging.autodesk.com'
    },
	port: '443'
};
/*
 deployed to http://ecs-237d5f21.ecs.ads.autodesk.com/#!/
 remote desktop to centOS = http://ajmatson.net/wordpress/2014/01/install-xrdp-remote-desktop-to-centos-6-5/
 deploying to centos = http://www.dacius.com/?p=636
 mongodb to centos = http://docs.mongodb.org/manual/tutorial/install-mongodb-on-red-hat-centos-or-fedora-linux/
 user forever to deploy.

 */