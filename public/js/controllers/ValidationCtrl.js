'use strict';

angular.module('ace.schematic').controller('ValidationController', ['$scope', '$modalInstance', 'ValidationService', 'items', function($scope, $modalInstance, ValidationService, items){
	$scope.validator = ValidationService;
	$scope.result = function() {
		return $scope.validator.result();
	};
	$scope.startValidation = function() {
		$scope.validator.validateLinks(items.dat, items.json);
		$scope.messages = $scope.validator.messages();
	};
	$scope.init = function() {
		$scope.startValidation();
	};

	$scope.ok = function(){
		$modalInstance.close($scope.validator.result());
		$scope.validator.reset();
	};
	$scope.cancel = function(){
		$modalInstance.dismiss('Cancelled by User');
	};

}]);