'use strict';

angular.module('ace.system').controller('confirmationModalCtrl', ['$scope', '$modalInstance','msg','title', function($scope, $modalInstance, msg, title){

	$scope.msg = msg;
	$scope.title = title;

	$scope.confirm = function(){
		$modalInstance.close(true);
	};
	$scope.cancel = function(){
		$modalInstance.close(false);
	};
}]);