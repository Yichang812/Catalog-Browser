'use strict';

var mongoose = require('mongoose'),
    OpenIDStrategy = require('passport-openid').Strategy,
    OAuthStrategy = require('passport-oauth').OAuthStrategy,
    LocalStrategy = require('passport-local').Strategy,
    User = mongoose.model('User'),
    config = require('./config'),
    request = require('request');


module.exports = function(passport) {
    
    // Serialize the user id to push into the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // Deserialize the user object based on a pre-serialized token
    // which is the user id
    passport.deserializeUser(function(id, done) {
        User.findOne({
            _id: id
        }, function(err, user) {
            done(err, user);
        });
    });

    //Strategy using xauth
    passport.use(new LocalStrategy({
        usernameField: 'oauth_token',
        passwordField: 'oauth_verifier'
      },
      function(username, password, done) {
        var oauth =
        {
            consumer_key: config.oauth.consumerKey,
            consumer_secret: config.oauth.consumerSecret,
            token: username,
            token_secret: password
        },
        url = config.oauth.apiURL+'/api/accounts/v1/user/@me?format=json';
        request.get({url:url, oauth:oauth, json: true}, function (error, response) {
            if(error) return done(error);
            if(!response.body.user) return done(error);
            var ret_user = response.body.user, profile = ret_user.Profile;
            User.findOne({
                'email': ret_user.Email
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    user = new User({
                        name: profile.FirstName+' '+profile.LastName,
                        Id: ret_user.Id,
                        email: ret_user.Email,
                        provider: 'Autodesk',
                        lastLogin: new Date(),
                        isAdmin: false
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                        user.lastLogin = new Date();
                        user.save(function (err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });   
                }
            });
        });
      }
    ));

    passport.use('oauth', new OAuthStrategy({
        requestTokenURL: config.oauth.requestTokenURL,
        accessTokenURL: config.oauth.accessTokenURL,
        userAuthorizationURL: config.oauth.userAuthorizationURL,
        consumerKey: config.oauth.consumerKey,
        consumerSecret: config.oauth.consumerSecret,
        callbackURL: config.oauth.callbackURL
    },
    function(token, tokenSecret, profile, done) {
        var oauth =
        {
            consumer_key: config.oauth.consumerKey,
            consumer_secret: config.oauth.consumerSecret,
            token: token,
            token_secret: tokenSecret
        },
        url = config.oauth.apiURL+'/api/accounts/v1/user/@me?format=json';
        request.get({url:url, oauth:oauth, json: true}, function (error, response) {
            if(error) return done(err);
            var ret_user = response.body.user, profile = ret_user.Profile;
            User.findOne({
                'email': ret_user.Email
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    user = new User({
                        name: profile.FirstName+' '+profile.LastName,
                        Id: ret_user.Id,
                        email: ret_user.Email,
                        provider: 'Autodesk',
                        lastLogin: new Date(),
                        isAdmin: false
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                        user.lastLogin = new Date();
                        user.save(function (err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });   
                }
            });
        });
      }
    ));

};