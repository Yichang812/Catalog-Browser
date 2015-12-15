'use strict';

angular.module('ace.catalog').controller(
	'mepManageCatalogCtrl', ['$scope', 'Global', 'CatalogAPI', '_' ,'$modal', '$rootScope', function ($scope, Global, CatalogAPI, underscore, $modal, $rootScope) {
		$scope.global = Global;
		$scope._ = underscore;
		$scope.pageItemLimit = 15;
		$scope.lower = 0;
		$scope.upper = $scope.lower + $scope.pageItemLimit;
		$scope.defaultFilters = [
			'Name'
		];
		$scope.filters = [];
		$scope.searchText = {};
		$scope.typeAheadValues = [];
		$scope.catalogType = 'AutoCAD MEP';
		$rootScope.tab1 = true;
		$rootScope.tab2 = false;

		$scope.authorized = function() {
			if($scope.global.authenticated && ($scope.global.user.isAdmin || $scope.global.user.isManufacturer))
				return true;
			return false;
		};
		$scope.manufacturer = $scope.authorized()?($scope.global.user.isAdmin?null:$scope.global.user.codeName):null;

		$scope.init = function() {
			var getCategory = function(standard) {
				CatalogAPI.mepStandardCategories.query({std: standard}, function (response) {
					if (response) {
						$scope.categories = response.categories;
						$scope.categoryTarget = $scope.categories.length? $scope.categories[0]: null;
					}
				});
			};
			CatalogAPI.mepStandards.query(function(response){
				if(response) {
					$scope.standards = response.standards;
					$scope.standardTarget = $scope.standards.length? $scope.standards[0]: null;
					getCategory($scope.standardTarget);
				}
			});
			$scope.showList = false;
			
			var current_url = document.URL;
			if (current_url.indexOf('code') > -1) {
				$rootScope.tab1 = false;
				$rootScope.tab2 = true;
				$rootScope.uploadOpt = 'fromBox';
				$rootScope.boxLoginStatus = true;
			}

			if (current_url.indexOf('error') > -1) {
				$rootScope.tab1 = false;
				$rootScope.tab2 = true;
				$rootScope.uploadOpt = 'fromBox';
				$rootScope.boxLoginStatus = false;
			}
		};

		$scope.addFilter = function (f) {
			for (var i in $scope.filters)
				if ($scope.filters[i].field === f)
					return;
			$scope.filters.push({
				'field': f,
				'value': ''
			});
		};

		$scope.removeFilter = function (f) {
			if ($scope.filters.indexOf(f) !== -1)
				$scope.filters.splice(f, 1);
		};

		$scope.showEntriesList = function(){
			var standard = $scope.standardTarget;
			var category = $scope.categoryTarget;
			if (!standard && !category) {return;}
			$scope.showList = true;
			$scope.currentPage = 1;
			$scope.getPage(1, true);
		};


		$scope.processFilters = function (filters) {
			if (!filters)
				return null;
			var newObj = {};
			var non_additional = ['Name'];
			for (var i = 0; i < filters.length; i++) {
				var filter = filters[i];
				if(!filter.value)
					continue;
				if(non_additional.indexOf(filter.field) > -1)
					newObj[filter.field[0].toLowerCase()+filter.field.substring(1).replace(' ', '')] = filter.value;
			}
			return newObj;
		};

		function queryForEntries(cb) {
			CatalogAPI.entries.query({
				catalogType: $scope.catalogType,
				standard: $scope.standardTarget,
				category: $scope.categoryTarget,
				lower: $scope.lower,
				upper: $scope.upper,
				search: $scope.prepareSearchString($scope.searchText.value),
				filters: $scope.processFilters($scope.filters)
			}, function (response) {
				cb(response);
			});
		}

		$scope.getPage = function (page, totalFlag) {
			$scope.lower = (page ? page - 1 : 0) * $scope.pageItemLimit;
			$scope.upper = (page ? page : 1) * $scope.pageItemLimit;
			queryForEntries(function (response) {
				$scope.items = response.data;
				if(page === 1 && totalFlag)
				{
					if (response.data.length === $scope.pageItemLimit) {
						CatalogAPI.entries.query({
							catalogType: $scope.catalogType,
							standard: $scope.standardTarget,
							category: $scope.categoryTarget,
							search: $scope.prepareSearchString($scope.searchText.value),
							total: true,
							filters: $scope.processFilters($scope.filters)
						}, function (response) {
							if (response) {
								$scope.total = response.count;
							}
						});
					} else
						$scope.total = response.data.length;
				}
			});
		};

		$scope.prepareSearchString = function (copy) {
			return copy;
		};

		// TODO: editing of item information
		$scope.showEditItemModal = function(item){
			var modalInstance = $modal.open({
				templateUrl: 'views/Catalog/editItemForm.html',
				controller: 'editItemFormCtrl',
				resolve:{
					item: function() {
						return (item);
					}
				}
			});
			modalInstance.result.then(function(){
				$scope.showEntriesList();
			});
		};
}]);
