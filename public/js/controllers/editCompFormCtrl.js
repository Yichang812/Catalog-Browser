'use strict';

angular.module('ace.schematic')
.controller('editCompFormCtrl', ['formValidation', '$timeout', '$scope','$location', '$upload', 'Global', '$http', 'SchematicsAPI', '$modalInstance', '$modal', 'target', function (formValidation, $timeout, $scope, $location, $upload, Global, $http, SchematicsAPI, $modalInstance, $modal, target) {
	$scope.target = {'_id': target._id};
	$scope.origin = target;
	$scope.global = Global;
	$scope.httpMethod = 'POST';
	$scope.error = {};
	$scope.success = {};
	$scope.id = null;
	$scope.valid = {'name':false,'thumbnail':false,'dl':false,'id':false};
	$scope.editDisabled = true;
	$scope.formValidator = formValidation;
	$scope.imgPreview = '<img src="'.concat($scope.origin.thumbnail, '"/>');

	$scope.$watchCollection('[target.thumbnail, valid.thumbnail]',function(){
		if($scope.target.thumbnail && $scope.valid.thumbnail){
			$scope.imgPreview = '<img src="'.concat($scope.target.thumbnail, '"/>');
		}
		else if($scope.target.thumbnail && !$scope.valid.thumbnail){
			$scope.imgPreview = '<i class="fa fa-ban fa-2x error"></i>';
		}
		else {
			$scope.imgPreview = '<img src="'.concat($scope.origin.thumbnail, '"/>');
		}
	});

	$scope.$watchCollection('valid',function(){
		var nameCorrect = (($scope.target.name && $scope.valid.name) || !$scope.target.name);
		var idCorrect = ($scope.target.id && $scope.valid.id) || !$scope.target.id;
		var thumbnailCorrect = (($scope.valid.thumbnail && $scope.target.thumbnail) || !$scope.target.thumbnail);
		var dlCorrect = (($scope.target.dl && $scope.valid.dl) || !$scope.target.dl);
		var cleanForm = !$scope.target.name && !$scope.target.dl && !$scope.target.thumbnail && !$scope.target.id;
		$scope.editDisabled = !(idCorrect && nameCorrect && thumbnailCorrect && dlCorrect) || cleanForm;
	});

	$scope.validateThumbnail = function(){
		$scope.valid.thumbnail = undefined;
		$scope.success.thumbnail = null;
		$scope.error.thumbnail = null;
		var string = $scope.target.thumbnail;
		if(!string)
			return;
		var check = $scope.formValidator.checkFileExtension(string, ['bmp', 'jpeg', 'jpg', 'png', 'ico']);
		if(check.result)
		{
			$scope.formValidator.validateLink(string, function(result) {
				$scope.success.thumbnail = result.suc_message;
				$scope.valid.thumbnail = result.result;
				$scope.error.thumbnail = result.err_message;
			});
			return;
		}
		$scope.success.thumbnail = check.suc_message;
		$scope.valid.thumbnail = check.result;
		$scope.error.thumbnail = check.err_message;
	};

	$scope.validateDwg = function(){
		$scope.valid.dl = false;
		$scope.error.dl = null;
		$scope.success.dl = null;
		var string = $scope.target.dl;
		if(!string)
			return;
		var check = $scope.formValidator.checkFileExtension(string, ['dwg']);
		if(check.result)
		{
			$scope.formValidator.validateLink(string, function(result) {
				$scope.success.dl = result.suc_message;
				$scope.valid.dl = result.result;
				$scope.error.dl = result.err_message;
			});
			return;
		}
		$scope.success.dl = check.suc_message;
		$scope.valid.dl = check.result;
		$scope.error.dl = check.err_message;
	};

	$scope.checkName = function(){
		$scope.error.name = null;
		$scope.success.name = null;
		$scope.valid.name = undefined;
		var data = $scope.target.name;
		if(!data)
		{
			return;
		}
		if(data.toUpperCase().localeCompare($scope.origin.name.toUpperCase()) === 0)
		{
			$scope.success.name = 'Valid name.';
			$scope.valid.name = true;
			return;
		}
		$scope.formValidator.checkSchematicNodeName(data, $scope.origin.parentNode._id, function(check) {
			$scope.valid.name = check.result;
			$scope.error.name = check.err_message;
			$scope.success.name = check.suc_message;
		});
	};

	$scope.checkId = function(){
		$scope.error.id = null;
		$scope.success.id = null;
		$scope.valid.id = undefined;
		if(!$scope.target.id)
			return;
		$scope.target.id = $scope.target.id.toUpperCase();
		var data = $scope.target.id;
		if(data.toUpperCase().localeCompare($scope.origin.id.toUpperCase()) === 0)
		{
			$scope.success.id = 'Valid ID.';
			$scope.valid.id = true;
			return;
		}
		$scope.formValidator.checkUniqueSchematicId(data, $scope.origin.standard._id, $scope.origin._id,  function(check) {
			$scope.valid.id = check.result;
			$scope.error.id = check.err_message;
			$scope.success.id = check.suc_message;
		});
	};

	$scope.delete = function() {
		$scope.hide = true;
		var modalInstance = $modal.open({
			templateUrl: 'views/confirmationModal.html',
			controller:'confirmationModalCtrl',
			backdrop: 'static',
			resolve:{
				title:function(){return 'Are you sure you want to delete?';},
				msg:function(){return 'This cannot be undone.';}
			}
		});
		modalInstance.result.then(function(decision){
			if(decision){
				if(!$scope.origin._id)
					return;
				SchematicsAPI.delete.get({nodeId: $scope.origin._id}, function(response) {
					if(response)
					{
						$modalInstance.close();
					}
					$scope.hide = false;
				});
				return;
			}
			$scope.hide = false;
		});
	};

	$scope.editComp = function(){
		SchematicsAPI.editComponent.save({node:$scope.target}, function(response){
			if(response)
			{
				$modalInstance.close();
			}
		});
	};

	$scope.cancel = function(){
		$modalInstance.dismiss('Cancelled by User');
	};

}]);
