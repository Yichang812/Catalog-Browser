'use strict';

var dropbox = require('dropbox'),
	request = require('request'),
	fs = require('./graceful-fs');
var file_dir = __dirname + '/filesToBeUploaded',
	index_read = 0,
	index_sent = 0;
var account;
var credentials = {key: "uvzy73jhd6i3x6y", secret: "s8ug233k9qcgsj0"};
var mapping = [];
var total_files = 0;
var errored = [];
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
	console.log('Authentication Succeeded. Continuing with reading files....');
	if(!fs.existsSync(file_dir))
	{
		console.log('Directory '+ path+ ' doesn\'t exist');
		return process.exit();
	}
	var write = fs.openSync('mapping.json', 'w+');
	fs.writeSync(write, '');
	fs.closeSync(write);

	//files will be taken from inside the filesToBeUploaded folder and uploaded to "app/" folder directly.
	walk(file_dir, '/',  startProcess);
  });
});


function walk(start, absOl, callback) {
    // Use lstat to resolve symlink if we are passed a symlink
    fs.lstat(start, function(err, stat) {
        if(err) {
            return callback(err);
        }
        var found = [],
            total = 0,
            processed = 0;
        function isDir(abspath, absOl) {
            fs.stat(abspath, function(err, stat) {
                if(stat.isDirectory()) {
                    // If we found a directory, recurse!
                    walk(abspath, absOl, function(err, data) {
                        found = found.concat(data);
                        if(++processed == total) {
                            callback(null, found);
                        }
                    });
                } else {
                    found.push({'file': abspath, 'url': absOl});
                    if(++processed == total) {
                        callback(null, found);
                    }
                }
            });
        }
        // Read through all the files in this directory
        if(stat.isDirectory()) {
            fs.readdir(start, function (err, files) {
                total = files.length;
                if(total == 0)
                {
                    callback(null, found);
                }
                else
                {
                    for(var x=0, l=files.length; x<l; x++) {
                        isDir(start + '/' + files[x], absOl + '/' + files[x]);
                    }
                }
            });
        } else {
            return callback(new Error("Path: " + start + " is not a directory"));
        }
    });
};

var startProcess = function(error, found) {
	if(error) {
		console.log(error);
		return process.exit();
	}
	total_files = found.length;
	process_files(found.slice(0,100), found, 100);
};

var process_files = function(tempFiles, files, slice) {
	var i = tempFiles.length;
	var index_ignored = 0;
	tempFiles.forEach(function(file) {
    	if(!(/\/\./.test(file.file)))
		{
        	console.log('Reading file... ' + ++index_read );
        	fs.readFile(file.file, function(err, data) {
        		if(err)
        		{
        			console.log(err);
        			return process.exit();
        		}
        		console.log('Finished Reading. Sending...');
        		client.writeFile(file.url, data, function(err, stat) {
        			if(err) {
        				console.log(err + ' Error encountered while uploading file at path ' + file.file);
        				errored.push(file);
        				index_sent++;
        				i--;
	        			if(i === 0)
	        			{
	        				console.log(index_sent + '/' + total_files + ' done.');
	        				if(slice < files.length) {
	        					process_files(files.slice(slice, slice+100), files, slice+100);
	        				}
		        			else if(index_sent === total_files)
		        			{
		        				if(errored.length != 0)
		        				{
		        					sendErroredFiles();
		        				}
		        				else
		        				{
			        				var write = fs.openSync('mapping.json', 'a+');
			        				fs.writeSync(write, JSON.stringify(mapping));
			        				console.log('End of uploading.');
			        				return process.exit();
		        				}
		        			}
	        			}
        				return;
        			}
        			client.makeUrl(file.url, {downloadHack: true}, function(error, url) {
        				if(!error) {
        					mapping.push({name: file.url, dl_url: url.url});
        				}
        				else
        				{
        					console.log(error);
        					errored.push(file);
        				}
        				index_sent++;
						i--; 
	        			if(i === 0)
	        			{
	        				console.log(index_sent + '/' + total_files + ' done.');
	        				if(slice < files.length) {
	        					process_files(files.slice(slice, slice+100), files, slice+100);
	        				}
		        			else if(index_sent === total_files)
		        			{
		        				if(errored.length != 0)
		        				{
		        					sendErroredFiles();
		        				}
		        				else
		        				{
			        				var write = fs.openSync('mapping.json', 'a+');
			        				fs.writeSync(write, JSON.stringify(mapping));
			        				console.log('End of uploading.');
			        				return process.exit();
		        				}
		        			}
	        			}				        		
        			});
        			console.log("Sent file at path "+ file.url);
        		});
        	});
    	}
    	else {
    		total_files-- ;
    		index_ignored++;
    		i--;
    	}
	});
};

var sendErroredFiles = function()
{
	console.log('Sending errored files....');
	total_files = errored.length;
	index_sent = 0;
	index_read = 0;
	var copy = errored;
	errored = [];
	process_files(copy.splice(0,100), copy, 100);
}

