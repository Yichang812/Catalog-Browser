'use strict';

angular.module('ace.system').controller('errorAlertModalCtrl', ['$scope', '$modalInstance', 'message', function($scope, $modalInstance, message){
	$scope.message = message? message: 'Unknown Error Occured. Aplologies for any inconveniences caused.';
	$scope.apply = function(){
		$modalInstance.close(true);
	};
	$scope.cancel = function(){
		$modalInstance.close(false);
	};
}]);