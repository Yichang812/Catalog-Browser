'use strict';

//Global service for global variables
angular.module('ace.system').factory('formValidation', ['SchematicsAPI', '$http', function(SchematicsAPI, $http) {
		var instance = {};
		instance.checkFileExtension = function (file, extensions) {
			if(!file || !extensions)
				return {result: false, suc_message: null, err_message: null};
			var stringExtension = extensions.join('|');
			var pattern = new RegExp('^.*\\.('+stringExtension+')$');
			if(pattern.test(file))
				return {result: true, suc_message: 'Valid file.', err_message: null};
			else
				return {result: false, suc_message: null, err_message: 'Invalid file type.'};
		};

		instance.checkStandardName = function(name, cb) {
			if(name.length > 30)
				return cb({result: false, suc_message: null, err_message: 'Name too long.'});
			SchematicsAPI.standardlist.query(function(stds) {
				if(stds){
					var localName = name.toUpperCase();
					for (var i = 0; i < stds.length; i++){
						var dbName = stds[i].name.toUpperCase();
						if(dbName.localeCompare(localName) === 0){
							return cb({result: false, suc_message: null, err_message: 'A standard with that name already exists.'});
						}
					}
				}
				return cb({result: true, suc_message: 'Valid Name.', err_message: null});
			});
		};

		instance.checkSchematicNodeName = function(name, _id, cb) {
			if(name.length > 100)
				return cb({result: false, suc_message: null, err_message: 'Name too long.'});
			SchematicsAPI.children.get({nodeId: _id}, function(comps) {
				if(comps){
					var localName = name.toUpperCase();
					for (var i = 0; i < comps.children.length; i++){
						var dbName = comps.children[i].name.toUpperCase();
						if(comps.children[i].published !== 0 && dbName.localeCompare(localName) === 0){
							return cb({result: false, suc_message: null, err_message: 'This name is already used within the same group.'});
						}
					}
				}
				return cb({result: true, suc_message: 'Valid Name.', err_message: null});
			});
		};

		instance.checkUniqueSchematicId = function(id, standard, _id, cb) {
			SchematicsAPI.checkId.save({id: id, standardId: standard, _id: _id},function(response){
				if(response.unique === true){
					return cb({result: true, suc_message: 'Valid ID.', err_message: null});
				}
				else{
					return cb({result: false, suc_message: null, err_message: 'This ID is already used within the same group.'});
				}
			});
		};

		instance.validateLink = function(link, cb) {
			$http
			.get(link)
			.success(function(){
				return cb({result: true, suc_message: 'Valid Link.', err_message: null});
			})
			.error(function(){
				return cb({result: false, suc_message: null, err_message: 'The link is broken.'});
			});
		};

		return instance;
	}
]);
