'use strict';

angular.module('ace.catalog').controller('addCustomTypeModalCtrl', ['$scope', '$modalInstance', 'data', '_', function($scope, $modalInstance, data, _){

	$scope.initTypes = data.types? data.types : [];
	$scope.initSheets = data.sheets? data.sheets : [];
	$scope.newType = {code: data.current.sName, name: data.firstName};
	$scope.addDisabled = true;
	$scope.validated = {name: null, code: null};
	$scope.errored = {name: null, code: null};
	$scope.joined = [];
	$scope.ok = function(){
		$modalInstance.close(true);
	};
	
	$scope.cancel = function(){
		$modalInstance.close(false);
	};

	$scope.checkCode = function() {
		$scope.errored.name = null;
		$scope.validated.name = null;
		$scope.errored.code = null;
		$scope.validated.code = false;
		if($scope.newType.code === '')
			return;
		var typeCodes = _.map($scope.initTypes, function(val) {return val.code;});
		if(typeCodes.indexOf($scope.newType.code) > -1)
		{
			$scope.newType.name = '';
			$scope.validated.code = false;
			$scope.errored.code = 'A type with that code already exists.';
		}
		else
		{
			$scope.validated.code = true;
			$scope.checkName();
		}
	};

	$scope.checkName = function() {
		$scope.errored.name = null;
		$scope.validated.name = null;
		var typeNames = _.map($scope.initTypes, function(val) {return val.name;});
		if($scope.newType.name === '')
			return;
		if($scope.newType.name.length >30)
		{
			$scope.validated.name = false;
			$scope.errored.name = 'The entered name is too long.';
		}
		else if(typeNames.indexOf($scope.newType.name) > -1)
		{
			$scope.validated.name = false;
			$scope.errored.name = 'A type with that name already exists.';
		}
		else
		{
			$scope.validated.name = true;
		}
	};

	$scope.add = function() {
		$scope.initTypes.push({code: $scope.newType.code, name: $scope.newType.name});
		data.current.dName = $scope.newType.code;
		$scope.ok();
	};

	$scope.$watch('validated', function() {
		if($scope.validated.name && $scope.validated.code)
		{
			$scope.addDisabled = false;
		}
	}, true);

	$scope.join = function() {
		$scope.joined = $scope.initSheets;
		$scope.checkCode();
		$scope.checkName();
	};

}]);