'use strict';

var request = require('request');
var http = require('http');
var box_sdk = require('box-sdk');
var fs = require('./graceful-fs');
var open = require('open');

//User Defined Variables
/*Slice is the size of requests sending out at a time.*/
var slice = 50;
/*The base folder name containing all files to read.*/
var base_folder_name = 'MappingSets';
/*The box account to host the files.*/
var box_account = 'xingjia.zhang@autodesk.com';
/*The application information for the mapper. In authentication page, it is named ComOn*/
var app_info = {
  client_id: 'nlofq3d3oki3frczappna9xco9homcsf',
  client_secret: 'sz89t8uDnsViQU3MWUVriFKlbC7mUyZa',
  port: 9999,
  host: 'localhost' 
};

var logLevel = 'debug'; //default log level on construction is info
var destination_file = 'mapping_box.json';
//initialisation
var mapping = [];
var fileProcessed = 0,
    folderProcessed = 0,
    folderOpened = 0;
var total = 0;
var base_folder_id = 0;
var base_folder_level = 0;
var directory = '';


var box = box_sdk.Box(app_info, logLevel);
var connection = box.getConnection(box_account);

//Navigate user to the auth URL
console.warn('Please authenticate the uploader to access the Box account:');
open(connection.getAuthURL());

connection.ready(function () {
    if(!connection.isAuthenticated())
    {
        console.error('Mapper not authenticated to acces Box account.');
        return;
    }
    console.log('Authentication Succeeded. Reading files...');
    var write = fs.openSync(destination_file, 'w+');
    fs.writeSync(write, '');
    fs.closeSync(write);

    //setting base directory - currently, "MappingSets" - all the files stored inside will be mapped
    directory = '';
    connection.search(base_folder_name,{'fields':'name','limit':1},function(err,body){
        if(err)
        {
            console.error('Error Occured when opening base folder: ',err);
            return;
        }
        if(body.total_count < 1)
        {
            console.error('No folder under such name ',err);
            return;            
        }

        base_folder_id = body.entries[0].id;
        connection.getFolderInfo(base_folder_id, function(err,body){
            console.log('Base folder found');
            if(err)
            {
                console.error(err);
                return;
            }
            total++;
            base_folder_level = body.path_collection.total_count;
            walk(body.id,body.name);
        });
    });
});


var walk = function(start_id, folder_name){
    var folder_entries= 0,
        all_entries = [],
        offset = 0;

    getEntries(start_id,offset,all_entries,folder_name);

};

function getEntries(start_id,offset,all_entries,folder_name)
{
     connection.getFolderItems(start_id, {'offset':offset}, function(err,body){
        if(err)
        {
            console.error('Error Occured when finding items in folder.');
            return;
        }

        if(offset === 0)
        {
            console.log('Open folder '+folder_name);
            console.log('Files in folder '+folder_name+': '+body.total_count);
            total += body.total_count;
        }
        
        var folder_entries = body.total_count;
        all_entries = all_entries.concat(body.entries);
        console.log(all_entries.length+' entries loaded in folder '+folder_name);
        if(all_entries.length < body.total_count)
        {
             getEntries(start_id, all_entries.length,all_entries,folder_name);
        }
        if(all_entries.length === body.total_count)
        {
            var tempEntries = [];

            for (var i = 0; i <= folder_entries/slice; i ++)
            {
                if(slice*(i+1) < folder_entries)
                {
                     tempEntries.push(all_entries.slice(slice*i,slice*(i+1))); 
                }
                else
                {
                    tempEntries.push(all_entries.slice(slice*i));
                }

            }
            console.log('Total chunk in '+folder_name+': '+tempEntries.length);
            fileProcessed++;
            getFileMapping(tempEntries, folder_name);
        }
    });
};

function getFileMapping(tempEntries,folder_name){
    console.log('getFileMapping gets called. Folder:',folder_name);
    //move all folders to the end of the chunk
    tempEntries[0].forEach(function(entry){
        if(entry.type==='folder')
        {
            var temp = tempEntries.shift();
            tempEntries.push(temp);
        }
    });
    tempEntries[0].forEach(function(entry){
        if(entry.type==='folder')
        {
            walk(entry.id,entry.name);
        }
        else
        {
            connection.updateFile(entry.id,{'shared_link':{'access':'open'}},function(err,body){
                if(err)
                {
                    console.error('Error encountered when generating sharing link for file ',entry.name,'.');
                    return;
                }
                var link = body.shared_link.download_url;
                var file_path = body.path_collection;
                if(file_path.total_count - base_folder_level < 2)
                {
                    file_path = '/'+body.name;
                }
                else
                {
                    var temp_path = '/';
                    for(var parent in file_path.entries)
                    {
                        if(file_path.entries[parent].id !== base_folder_id && file_path.entries[parent].name !== 'All Files')
                            temp_path+=file_path.entries[parent].name+'/';
                    }
                    temp_path+=body.name;
                    file_path = temp_path;
                }
                mapping.push({'name':file_path,'dl_url':link});
                //console.log('File: '+entry.name+'in folder'+folder_name+' read.');
                fileProcessed++;
                tempEntries[0].splice(tempEntries[0].indexOf(entry),1);

                //last entry in a chunk, calls for processing the next chunk
                if(tempEntries[0].length < 1)
                {
                    tempEntries.shift();
                    console.log(fileProcessed+'/'+total+' files read...in '+folder_name);
                    console.log('Remaining chunk: ',tempEntries.length);
                    if(tempEntries.length > 0)
                    {
                        getFileMapping(tempEntries,folder_name);
                    }
                    //all entries in folder are processed
                    else
                    {
                        console.log('Folder '+folder_name+' closed.');                    
                    }
                }
                //all file processed,
                if(fileProcessed === total)
                {
                    writeMapping(mapping);
                }
            });
        }
    });
};  


var writeMapping = function(mapping) {
    console.log('All files read. Mapping...');
    var write = fs.openSync(destination_file, 'a+');
    fs.writeSync(write, JSON.stringify(mapping));
    console.log('End of mapping. Total Number of Files Mapped: ',mapping.length);
    return process.exit();  
};

