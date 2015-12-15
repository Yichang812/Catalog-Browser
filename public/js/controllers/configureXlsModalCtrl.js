'use strict';

angular.module('ace.catalog').controller('configureXlsModalCtrl', ['$scope', '$modalInstance',function($scope, $modalInstance){
	$scope.config = {'title':'A1','fields':2};
	$scope.valid = {};
	$scope.error = {};
	$scope.titleRow = 1;

	$scope.checkCell = function(){
		var cell = new RegExp('^(\\w+)(\\d+)$');
		if(!cell.test($scope.config.title)){
			$scope.valid.title = false;
			$scope.error.title = 'Please enter a valid cell number.';
			return;
		}
		$scope.valid.title = true;
		$scope.titleRow = cell.exec($scope.config.title)[1];
	};

	$scope.checkFields = function(){
		var rowNumber = new RegExp('^\\d+$');
		if(!rowNumber.test($scope.config.fields || $scope.config.fields < 1)){
			$scope.valid.fields = false;
			$scope.error.fields = 'Please enter a positve integer.';
			return;
		}
		if($scope.config.fields === $scope.titleRow){
			$scope.valid.fields = false;
			$scope.error.fields = 'Column Title Row cannot equal the row of title cell.';
			return;
		}
		$scope.valid.fields = true;
	};

	$scope.$watch('valid',function(){
		if($scope.valid.title !== false && $scope.valid.fields !== false){
			$scope.doneDisabled = false;
			return;
		}
		$scope.doneDisabled = true;
	},true);

	$scope.apply = function(){
		$modalInstance.close($scope.config);
	};
	$scope.cancel = function(){
		$modalInstance.dismiss('user cancelled');
	};
}]);