'use strict';

angular.module('ace.system').controller('HeaderController', ['$scope', 'Global', 'navBarMenu', function ($scope, Global, navBarMenu) {
    $scope.global = Global;
	$scope.menu = navBarMenu.menu;

	// if a user is logged in, choose from user's default product
    if($scope.global.authenticated) {
    	$scope.menu = navBarMenu.useDefault(Global.user.userDefPrdt);
    }

    // watch and update on changes
	$scope.$watch(
        function(){ 
        	return navBarMenu.menu; 
        },

        function(newVal) {
          $scope.menu = newVal;
        }
    );

}]);