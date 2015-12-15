'use strict';

angular.module('ace.catalog').controller('filterModalCtrl', ['$scope', '$modalInstance', 'data', 'Global', '_', 'UsersAPI', function($scope, $modalInstance, data, Global, _, UsersAPI){
	$scope.newFilter = {name: '', filter: {search: data.search, product: data.product, standard: data.standard, category: data.category, type: data.type, filters: data.filters}};
	$scope.initsearch = data.search;
	$scope.initfilters = data.filters;
	$scope.saveDisabled = true;
	$scope.global = Global;
	$scope.errored = null;
	$scope.validated = null;
	$scope.validate = function() {
		$scope.errored = null;
		$scope.validated = null;
		$scope.saveDisabled = true;
		if($scope.newFilter.name === '')
			return;

		// validate inputs based on current working product, default is AutoCAD Electrical
		if($scope.newFilter.filter.product === 'AutoCAD MEP') {
			if(!$scope.newFilter.filter.search || !$scope.newFilter.filter.standard || !$scope.newFilter.filter.category || !$scope.newFilter.filter.filters)
				return;
		}
		else {
			if(!$scope.newFilter.filter.search || !$scope.newFilter.filter.type || !$scope.newFilter.filter.filters)
				return;
		}

		var list = _.map($scope.global.user.catalogFilters, function(object) {if(object) return object.name.toLowerCase();});
		if(list.indexOf($scope.newFilter.name.toLowerCase()) > -1)
		{
			$scope.errored = 'A filter by this name already exists.';
			return;
		}
		$scope.validated = true;
		$scope.saveDisabled = false;
	};

	$scope.apply = function(){
		UsersAPI.addFilter.save($scope.newFilter, function(response) {
			if(response)
			{
				$scope.global.user.catalogFilters = response;
			}
		});
		$modalInstance.close(true);
	};

	$scope.cancel = function(){
		$modalInstance.close(false);
	};

}]);