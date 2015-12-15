'use strict';

angular.module('ace.schematic').controller('UploadController', ['ValidationService', 'formValidation', '$timeout', '$scope', '$location', '$upload', 'ParsingService', 'Global', '$modal', function (ValidationService, formValidation, $timeout, $scope, $location, $upload, ParseDat, Global, $modal) {
	$scope.global = Global;
	$scope.Parser = new ParseDat();
	$scope.uploadDisabled = true;
	$scope.validateDisabled = true;
	$scope.httpMethod = 'POST';
	$scope.error = [];
	$scope.success = [];
	$scope.valid = [];
	$scope.desc = '';
	$scope.validator = ValidationService;
	$scope.formValidator = formValidation;
	$scope.validateText = 'Validate';

	$scope.datFileSelect = function($files) {
		$scope.checkDatFile($files);
		if($scope.valid.dat)
			$scope.parseDatForStdName();
	};

	$scope.checkDatFile = function($files){
		$scope.error.dat = null;
		var check = $scope.formValidator.checkFileExtension($files[0]?$files[0].name:'', ['dat']);
		if(check.result)
		{
			$scope.datFile = $files[0];
		}
		$scope.success.dat = check.suc_message;
		$scope.valid.dat = check.result;
		$scope.error.dat = check.err_message;
	};

	$scope.resetDAT = function() {
		if($scope.jsonFile)
			$scope.resetJSON();
		$scope.uploadDisabled = true;
		$scope.validateDisabled = true;
		$scope.valid.dat = false;
		$scope.error.dat = null;
		$scope.success.dat = null;
		$scope.datFile = null;
		$scope.progress = -1 ;
		if ($scope.upload) {
			$scope.upload.abort();
		}
		$scope.upload = null;
		$scope.uploadResult = null;
		$scope.stdName = null;
		$scope.valid.name = false;
		$scope.error.name = null;
		$scope.success.name = null;
	};

	$scope.jsonFileSelect = function($files) {
		$scope.checkJsonFile($files);
		if($scope.valid.json)
			$scope.parseJsonFile();
	};

	$scope.checkJsonFile = function($files){
		$scope.error.json = null;
		var check = $scope.formValidator.checkFileExtension($files[0]?$files[0].name:'', ['json']);
		if(check.result)
		{
			$scope.jsonFile = $files[0];
		}
		$scope.success.json = check.suc_message;
		$scope.valid.json = check.result;
		$scope.error.json = check.err_message;
	};

	$scope.resetJSON = function() {
		$scope.uploadDisabled = true;
		$scope.validateDisabled = true;
		$scope.valid.json = false;
		$scope.error.json = null;
		$scope.success.json = null;
		$scope.jsonFile = null;
		$scope.progress = -1 ;
		if ($scope.upload) {
			$scope.upload.abort();
		}
		$scope.upload = null;
		$scope.uploadResult = null;
	};

	$scope.checkName = function(){
		$scope.error.name = null;
		$scope.success.name = null;
		$scope.valid.name = false;
		var data = $scope.stdName;
		if(!data)
		{
			return;
		}
		$scope.formValidator.checkStandardName(data, function(check) {
			$scope.valid.name = check.result;
			$scope.error.name = check.err_message;
			$scope.success.name = check.suc_message;
		});
	};

	$scope.validate = function() {
		var check = $scope.valid;
		if(check.dat && check.name && check.json)
		{
			var modalInstance = $modal.open({
				templateUrl: 'views/Schematics/validationModal.html',
				controller: 'ValidationController',
				backdrop: 'static',
				resolve: {
					items: function() {
						return ({'dat': $scope.datObject, 'json': $scope.jsonText});
					}
				}
			});
			modalInstance.result.then(function(valid){
				$scope.uploadDisabled = !valid;
				if(valid){
					$scope.validateText = 'Validated';
				}
			}, function() {
				$scope.validator.reset();
			});
		}
		$scope.uploadDisabled = true;
	};


	$scope.uploadFiles = function() {
		$scope.progress = 0;
		$scope.uploadDisabled = true;
		$scope.sendingFlag = true;
		$scope.upload = $upload.upload({
			url : 'api/upload',
			method: $scope.httpMethod,
			headers: {'Content-Type': 'application/file'},
			data : {
				stdName : $scope.stdName,
				description: $scope.desc
			},
			file: [$scope.datFile , $scope.jsonFile],
			fileFormDataName: ['datFile', 'jsonFile']
		}).then(function(response) {
			$scope.sendingFlag = false;
			if(response)
			{
				if(response.status === 200)
				{
					$scope.sendingSuccess = true;
					$scope.uploadResult = response.data;
					$timeout($scope.getAll, 500);
				}
			}
		}, null, function(evt) {
			$scope.progress = parseInt(100.0 * evt.loaded / evt.total);
		});
	};
	
	$scope.parseDatForStdName = function(){
		var reader = new FileReader();
		reader.onload = function(){
			$scope.Parser.parse(reader.result);
			$scope.Parser.generateSubMenuHierachy();
			$scope.stdName = $scope.Parser.rootNode.title;
			$scope.datObject = $scope.Parser.rootNode;
			$scope.checkName();
		};
		reader.readAsText($scope.datFile);
	};

	$scope.parseJsonFile = function(){
		var reader = new FileReader();
		reader.onload = function(){
			$scope.jsonText = reader.result;
		};
		reader.readAsText($scope.jsonFile);
	};
}]);