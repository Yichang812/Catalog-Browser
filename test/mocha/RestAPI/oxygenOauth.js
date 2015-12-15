'use strict';

var OAuth = require('oauth').OAuth;
var request = require('request');
var inspect = require('util').inspect;
//Oxygen OAuth
var OxygenOAuth = function(baseURL, consumerKey, consumerSecret){
    this.baseURL = baseURL;
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
};

OxygenOAuth.prototype.login = function(username, password, callback)
{
//cache username/password
    this.username = username;
    this.password = password;
    //we login as service so requestTokenPath is used as accesstoken
    //with given username&password
    var requestTokenPath = this.baseURL + '/OAuth/AccessToken';
    var accessTokenPath = this.baseURL + '/OAuth/AccessToken';
    if (this.oauth_session_handle) {
        accessTokenPath += '?' + 'oauth_session_handle=' + this.oauth_session_handle;
    }
    this.oauth = new OAuth(
        requestTokenPath,
        accessTokenPath,
        this.consumerKey,
        this.consumerSecret,
        '1.0',
        null,
        'HMAC-SHA1');
    var public_cred = {
        'x_auth_username': username,
        'x_auth_password': password,
        'x_auth_mode': 'client_auth'
    };
    var self = this;
    this.oauth.getOAuthRequestToken(public_cred, function(e, oauth_accesstoken, oauth_accesstoken_secret, results) {
        self.oauth_accesstoken = oauth_accesstoken;
        self.oauth_accesstoken_secret = oauth_accesstoken_secret;
        if(results !== undefined && null !== results && results.hasOwnProperty('oauth_session_handle')) {
            self.oauth_session_handle = results.oauth_session_handle;
        }
        //console.log('oauth_accesstoken ' + oauth_accesstoken);
        //console.log('oauth_accesstoken_secret ' + oauth_accesstoken_secret);
        //console.log(self.oauth_session_handle);
        callback(e, self.oauth_accesstoken, self.oauth_accesstoken_secret);
    });
};

OxygenOAuth.prototype.refreshLogin = function(callback) {
    this.login(this.username, this.password, callback);
};

OxygenOAuth.prototype.get = function(queryUrl, callback){
    return this.oauth.get(
        queryUrl,
        this.oauth_accesstoken,
        this.oauth_accesstoken_secret,
        callback);
};

OxygenOAuth.prototype.post = function(queryUrl, postBody, postContentType, callback){
    return this.oauth.post(
        queryUrl,
        this.oauth_accesstoken,
        this.oauth_accesstoken_secret,
        postBody,
        postContentType,
        callback);
};

OxygenOAuth.prototype.signUrl = function(url, method){
    return this.oauth.signUrl(url, this.oauth_accesstoken, this.oauth_accesstoken_secret, method);
};

OxygenOAuth.prototype.request = function(options, baseurl, callback){
    var self = this;
    options.url = this.signUrl(baseurl, options.method);

    var loginAndRequestAgain = function(){
        self.refreshLogin(function(e){
            console.error('--------Logged in again  ----- !!!');
            if (e) {
                console.error('-errror-------------');
                console.error(require('util').inspect(e, true, null));
                console.error('-end---error----');
                return;
            }
            self.request(options, baseurl, callback);
        });
    };

    //Proxy to fiddler: http://127.0.0.1:8888 ~ debugging purpose 
    //options.proxy = "http://127.0.0.1:8888/";
    request(options, function(e,r,body){
        if (e){
            console.error('ERROR!');
            console.error(e);
            console.error(options);
        }
        if(body && body.indexOf('An internal error occurred. Please try again later.') !== -1){
            loginAndRequestAgain();
        }
        if (r && (r.statusCode === 401 || r.statusCode === 400)){ //need authentication again
            if (body.indexOf('File with name UniqueFileName visitor') !== -1){
                callback(e,r,body);
                return;
            }
            console.log('---Start----');
            console.error('Status code = ' + r.statusCode);
            //console.error(e);
           
            if (options.body){
                console.error(options.body.toString('utf8', 0, 100));
            }
            if (options.headers){
                console.error(options.headers);
            }
            console.error(inspect(body.toString('utf8')));
            console.log('---------');
            if (body && body.indexOf('This request requires HTTP authentication') !== -1){
                console.error('ERROR! Need authentication again ');
                loginAndRequestAgain();
                return;
            }
            callback(e,r,body);
            return;
        }
        callback(e,r,body);
    });
};

module.exports = OxygenOAuth;
