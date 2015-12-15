'use strict';

var parseString = require('xml2js').parseString;
var OxygenOauth = require('../../test/mocha/RestAPI/oxygenOauth');
var config = require('../../config/config');

//staging account for sharding cause there is no dev sharder
var oxygenOAuth = new OxygenOauth(config.oauth.oxygenUrl, config.oauth.consumerKeyNitrogen, config.oauth.consumerSecretNitrogen);
oxygenOAuth.login('qi_men@hotmail.com','asdfasdf1', function(err, accessToken, accessSecret){
    if (err){
        console.error(err);
        return;
    }
    if (undefined === accessToken || undefined === accessSecret){
        console.error('Cant login to account');
    }
});

exports.sendFilesForSharding = function(files, callback){
    var sharderURL = 'http://compdev.visualtao.net/main/wsServices/files/v1/folder/@root/compress';
    var urlList = '<?xml version= "1.0"  encoding="UTF-8"?>';
    urlList +='<Files>';
    for(var i = 0; i < files.length; ++i) {
        urlList += '<File>';
        urlList += '<url>' + files[i].url + '</url>';
        urlList += '<filename>' + files[i].name + '</filename>';
        urlList += '</File>';
    }
    urlList += '</Files>';

    //send urlList over to aws sharding server
    //console.log(urlList);

    oxygenOAuth.request({method:'POST', headers:{'urlList':urlList, 'shardingVersion' : 269}}, sharderURL, function(e, r, body){
        if (e) {
            console.error(e);
            return;
        }
        if (!body) {
            console.error('body is not found ');
            console.error('Again........');
            this.sendFilesForSharding(files, callback);
            return;
        }
        parseString(body, function(err, res){
            if (err){
                console.error(err);
                console.error(body);
                return;
            }
            //console.log(inspect(res, true, null));
            var dwgIds = res.files.file;
            var drawingId;
            if (dwgIds.length === 1){
                drawingId = dwgIds[0].drawingId[0];
                callback(err, res, drawingId);
                return;
            }
            // more then 1
            /*for(var j = 0; j < dwgIds.length; ++j) {
                var fileKey = files[j].key;
            }*/
        });
    });
};

/*function uploadInBatch(files, startIndex, maxRequest, callback){
   if (startIndex >= files.length) {
     if (callback) callback();
     return;
   }

   var sendingFiles = [];
   var i = 0;
   while (i < maxRequest && startIndex + i < files.length){
     sendingFiles.push(files[startIndex + i]);
     ++i;
   }
   sendShardingService(sendingFiles, function(){
      console.log(color.good('Completeing ... ' + (startIndex + maxRequest).toString() + '/' + files.length));
      uploadInBatch(files, startIndex + maxRequest, maxRequest, callback);
   });
}*/
