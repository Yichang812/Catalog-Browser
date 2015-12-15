# Dropbox Uploader

These scripts are used to upload to an app folder in dropbox/box and to generate a listing of all the files uploaded and their download links.

## Prerequisites
* Node.js - Download and Install [Node.js](http://www.nodejs.org/download/). You can also follow [this gist](https://gist.github.com/isaacs/579814) for a quick and easy way to install Node.js and npm

## Quick Install

  Install dependencies:

    $ npm install

  If you are using dropbox, run:

  	$node dropboxUploader.js

  If you are using box, run:

  	$node boxUploader.js

  If you have the folder in dropbox/box service, run:

  	$node boxMapper.js

  or:

  	$node dropboxMapper.js

## Instructions - dropboxUploader.js
	To use the uploader, first setup using npm install, then put all the files you want to be uploaded into a folder called /filesToBeUploaded. You can change this if you want. 
	Also, if you want to use your own dropbox account and api key, you can do so by obtaining an app key and secret from dropbox and replacing the credentials in Uploader.js. 
	Currently, the default directory it will upload the files to is "/App/all your files". This can also be changed according to your wishes.
	If the script completes successfully, it will generate the mapping in a file called mapping.json
	
	For the sake of convenience, please put all your files inside a folder having the same name as the standard.

## Instructions - boxUploader.js
	To use the uploader, first setup using npm install, then put all the files you want to be uploaded into a folder called /filesToBeUploaded. You can change this if you want. 
	Also, if you want to use your own box account and api key, you can do so by obtaining an app key and secret from dropbox and replacing the credentials in boxUploader.js. The variables to change includes: cliend_id - for app key, client_secret - for app secret, and box_account - for custome box account.
	Currently, the default directory it will upload the files to is "/Icons". This can also be changed according to your wishes.
	If the script completes successfully, it will generate the mapping in a file called mapping.json

## Instructions - dropboxMapper.js
	To use the mapper, first setup using npm install, then run dropboxMapper.js. 
	Also, if you want to use your own dropbox account and api key, you can do so by obtaining an app key and secretfrom dropbox and replacing the credentials in Mapper.js. 
	Currently, the default directory it will map the files from is "/App/all your files". This can also be changed according to your wishes.
	If the script completes successfully, it will generate the mapping in a file called mapping_ind.json

## Instructions - boxMapper.js
	To use the mapper, first setup using npm install, then run boxMapper.js. 
	Also, if you want to use your own box account and api key, you can do so by obtaining an app key and secretfrom dropbox and replacing the credentials in boxMapper.js. 
	Currently, the default directory it will map the files from is "/Icons". This can also be changed according to your wishes.
	If the script completes successfully, it will generate the mapping in a file called mapping_ind.json