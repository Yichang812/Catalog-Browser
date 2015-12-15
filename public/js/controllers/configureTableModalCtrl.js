'use strict';

angular.module('ace.catalog').controller('configureTableModalCtrl', ['$scope', '$modalInstance', 'data', function($scope, $modalInstance, data){
	$scope.initfields = data.fields;
	$scope.initcols = data.cols;

	$scope.apply = function(){
		$modalInstance.close(true);
	};
	$scope.cancel = function(){
		$modalInstance.close(false);
	};

	$scope.toggle = function(field){
		data.toggleField(field);
	};

	$scope.All = function(){
		data.toggleAll();
	};
}]);