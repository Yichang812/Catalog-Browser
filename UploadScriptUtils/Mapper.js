'use strict';

var dropbox = require('dropbox'),
    request = require('request'),
    fs = require('./graceful-fs');
var account;
var total;

//Credentials for app folder - change to use your own app folders
var credentials = {key: "uvzy73jhd6i3x6y", secret: "s8ug233k9qcgsj0"};

//Directory inside the application folder where you uploaded the files - e.g. - "app / abcd / "standard(jic) / all the files
var directory;

var mapping = [];
var index_mapped = 0;
var client = new dropbox.Client(credentials);
client.authDriver(new dropbox.AuthDriver.NodeServer(8191));
client.authenticate(function(error, client) {
  if (error) {
    console.log('Authentication with Dropbox failed.'+ error);
    return process.exit();
  }
  client.getAccountInfo(function(error, accountInfo) {
    if(error) {
        console.log('Authentication with Dropbox failed.'+ error);
        return process.exit();  
    }
    account = accountInfo;
    console.log('Welcome, '+accountInfo.name);
    console.log('Authentication Succeeded. Mapping files now....');
    var write = fs.openSync('mapping_ind.json', 'w+');
    fs.writeSync(write, '');
    fs.closeSync(write);

    //setting base directory - currently, "app" - all the files stored inside will be mapped
    directory = '';
    walk(directory, getMapping);
  });
});

var walk = function(start, callback) {
    client.stat(start, function(err, stat) {
        if(err) {
            return callback(err);
        }
        var found = [],
            total = 0,
            processed = 0;
        function isDir(abspath, stat) {
            if(stat.isFolder) {
                // If we found a directory, recurse!
                walk(abspath, function(err, data) {
                    found = found.concat(data);
                    if(++processed == total) {
                        callback(null, found);
                    }
                });
            } else {
                found.push({'file': stat.path});
                if(++processed == total) {
                    callback(null, found);
                }
            }
        }
        // Read through all the files in this directory
        if(stat.isFolder)
         {
            client.readdir(start, null ,function (err, files, stat, statArray) {
                total = files.length;
                if(total == 0)
                {
                    callback(null, found);
                }
                else
                {
                    for(var x=0, l=files.length; x<l; x++) {
                        isDir(start + '/' + files[x], statArray[x]);
                    }
                }
            });
        } else {
            return callback(new Error("Path: " + start + " was not found."));
        }
    });
};

var getMapping = function(err, files) {
    if(err) {
        return console.log(err);
    }
    total = files.length;
    console.log('Total files found: '+total);
    map(files);
};


var map = function(files) {
    files.forEach(function(file) {
        client.makeUrl(file.file, {downloadHack: true}, function(error, url) {
            if(error) {
                console.log(error);
                return map(files.slice(index_mapped - 1));
            }
            index_mapped++;
            console.log('Mapping file number... ' + index_mapped + '/' + total);
            mapping.push({name: file.file, dl_url: url.url});
            if(index_mapped === total)
            {
                var write = fs.openSync('mapping_ind.json', 'a+');
                fs.writeSync(write, JSON.stringify(mapping));
                console.log('End of mapping.');
                return process.exit();  
            }
        });
    });
};