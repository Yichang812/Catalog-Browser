'use strict';
angular.module('ace.catalog').controller('mepCatalogListCtrl', [
	'$scope',
	'Global',
	'CatalogAPI',
	'$routeParams',
	'_',
	'$modal',
	'$http',
	'$timeout',
	'SchematicsAPI',
	'UsersAPI',
	function ($scope, Global, CatalogAPI, $routeParams, underscore, $modal, $http, $timeout, SchematicsAPI, UsersAPI) {
		$scope.global = Global;
		$scope._ = underscore;
		$scope.pageItemLimit = 15;
		$scope.items = [];
		$scope.searchMode = false;
		$scope.lower = 0;
		$scope.upper = $scope.lower + $scope.pageItemLimit;
		$scope.defaultFilters = [
			'Name'
		];
		$scope.filters = [];
		$scope.searchBox = {};
		$scope.searchText = {};
		$scope.typeAheadValues = [];
		$scope.selectedRows = [];
		$scope.selectedItems = [];
		$scope.multiple = false;
		$scope.linkedSchematicEntries = {};
		$scope.toggleDetails = false;
		$scope.showDetails = false;
		$scope.category = {};
		$scope.catalogType = 'AutoCAD MEP';

        $scope.showDownload = (window.exec === undefined)? false : true;

		$scope.authorized = function () {
			if ($scope.global.authenticated && ($scope.global.user.isAdmin || $scope.global.user.isManufacturer))
				return true;
			return false;
		};

		$scope.toggleDetailsBox = function (index) {
			if (!$scope.toggleDetails)			
				$scope.clickIndex = index;
			$scope.toggleDetails = !$scope.toggleDetails;
		};

		$scope.showDetails = function (index) {
			if ($scope.toggleDetails && $scope.clickIndex === index)
				return true;
			else 
				return false;
		};

		$scope.showFilterModal = function () {
			$modal.open({
				templateUrl: 'views/Catalog/filterModal.html',
				controller: 'filterModalCtrl',
				backdrop: 'static',
				resolve: {
					data: function () {
						return {
							filters: $scope.filters,
							product: $scope.catalogType,
							standard: $scope.selectedStandard,
							category: $scope.selected,
							search: ($scope.searchText.value)? $scope.searchText : $scope.searchText = {value: ''}
						};
					}
				}
			});
		};

		$scope.isHighlighted = function(index){
			return $scope.selectedRows.indexOf(index) + 1;
		};

		$scope.$watch('selectedItems',function(){
			if($scope.selectedItems.length > 0)
				$scope.searchBox.show = false;
		},true);

		$scope.markMepFavourite = function(){
			if($scope.selectedItems.length === 0 || !$scope.global.authenticated)
				return;

			var items = $scope._.map($scope.selectedItems, function(obj) {
				return obj._id;
			});
			UsersAPI.addCatFav.save({product: $scope.catalogType, items: items}, function(response) {
				if(response)
				{
					$scope.global.user.mepFav = response.favourites;
				}
			});
		};

		$scope.delMepFav = function(item){
			UsersAPI.delCatFav.save({product: $scope.catalogType, _id: item._id}, function(response) {
				if(response)
				{
					$scope.global.user.mepFav = response.favourites;
				}
			});
		};

		$scope.checkIfMepFav = function(item) {
			if($scope.global.authenticated)
			{
				var favourites = $scope._.map($scope.global.user.mepFav, function(item) {
					return item;
				});
				if(favourites.indexOf(item._id) > -1)
				{
					return true;
				}
				return false;
			}
			else
			{
				return false;
			}
		};

		$scope.toggleSelectRow = function(index) {
			//if shift key is not pressed, only one row is selected
			//Otherwise, multiple rows are selected;
			if(!$scope.multiple){
				if($scope.selectedRows.indexOf(index) > -1){
					$scope.selectedRows = [];
					$scope.selectedItems = [];
					return;
				}
				$scope.selectedRows = [];
				$scope.selectedItems = [];

				$scope.selectedRows[0] = index;
				$scope.selectedItems.push($scope.items[index]);
			}else{
				if($scope.selectedRows.indexOf(index) > -1){
					$scope.selectedRows.splice($scope.selectedRows.indexOf(index),1);
					for(var k in $scope.selectedItems){
						if($scope.selectedItems[k]._id === $scope.items[index]._id)
							$scope.selectedItems.splice(k,1);
					}
					return;
				}
				if($scope.selectedRows.length === 0 || $scope.ctrl){
					$scope.selectedRows.push(index);
					$scope.selectedItems.push($scope.items[index]);
					return;
				}
				var minDiff = 9999,
				minIndex = 0;
				for(var j = 0; j < $scope.selectedRows.length; j++){
					if(Math.abs($scope.selectedRows[j] - index) < minDiff){
						minIndex = $scope.selectedRows[j];
						minDiff = Math.abs($scope.selectedRows[j] - index);
					}
				}
				for(var i = 0; i <= Math.abs(index - minIndex);i++){
					if($scope.selectedRows.indexOf(Math.min(index,minIndex)+i)<0){
						$scope.selectedRows.push(Math.min(index,minIndex)+i);
						$scope.selectedItems.push($scope.items[Math.min(index,minIndex)+i]);
					}
				}
			}
		};

		$scope.init = function () {
			$scope.standardList = [];
			$scope.showStandards = true;
			$scope.searchBox.show = true;
			$scope.showList = false;
			CatalogAPI.mepStandards.query(function (response) {
				if (response) {
					$scope.standards = response.standards;
				}
			});
			if(Global.authenticated)
			{
				UsersAPI.me.query(function(response) {
					if(response)
					{
						Global.user = response;
					}
				});
			}

			if($scope.global.authenticated && $routeParams.filterName && $scope.global.user.mepCatalogFilters.length !== 0)
			{
				for (var i = 0; i < $scope.global.user.mepCatalogFilters.length; i++) {
					if($scope.global.user.mepCatalogFilters[i].name === $routeParams.filterName)
					{
						$scope.showStandards = false;
						$scope.selectedStandard = $scope.global.user.mepCatalogFilters[i].filter.standard;
						$scope.selected = $scope.global.user.mepCatalogFilters[i].filter.category;
						$scope.category.selected = $scope.selected;
						$scope.target = $scope.selected;
						$scope.searchText = $scope.global.user.mepCatalogFilters[i].filter.search;
						$scope.filters = $scope.global.user.mepCatalogFilters[i].filter.filters;
						$scope.showList = true;
						$scope.search();
						break;
					}
				}
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

		$scope.showSearchBox = function () {
			$scope.searchBox.show = true;
		};

		$scope.hideSearchBox = function () {
			$scope.searchBox.show = false;
		};

		$scope.showStandardCategories = function (standard) {
			// only show ui-select dropdown to choose category
			$scope.showStandards = false;
			$scope.selectedStandard = standard;		
			// reset category selection if user change a standard to view
			if ($scope.selected !== undefined) {	
				$scope.category.selected = undefined;
				$scope.selected = undefined;
				$scope.items = undefined;
				$scope.showList = false;
			}
			CatalogAPI.mepStandardCategories.query({std: $scope.selectedStandard}, function (response) {
				if (response)
					$scope.categories = response.categories;
			});
		};

		$scope.showCategoryEntries =  function(category) {
			$scope.showList = true;
			$scope.searchBox.show = true;
			$scope.showStandards= false;
			$scope.selectedRows = [];
			$scope.selectedItems = [];
			$scope.target = category;
			$scope.selected = category;			
			$scope.searchText = {};
			$scope.filters = [];

            $scope.getPage(1, true);
		};

		$scope.processFilters = function (filters) {
			if (!filters)
				return null;
			var newObj = {};
			var non_additional = ['Name', 'Description'];
			for (var i = 0; i < filters.length; i++) {
				var filter = filters[i];
				if(!filter.value)
					continue;
				if(non_additional.indexOf(filter.field) > -1)
					newObj[filter.field[0].toLowerCase()+filter.field.substring(1).replace(' ', '')] = filter.value;
			}
			return newObj;
		};

		$scope.closeStandard = function () {
			$scope.showStandards = false;
		};

		$scope.showStandard = function () {
			$scope.showStandards = true;
		};

		function queryForEntries(upper, lower, cb) {
			CatalogAPI.entries.query({
				catalogType: $scope.catalogType,
				standard: $scope.selectedStandard,
				category: $scope.target,
				lower: lower,
				upper: upper,
				search: $scope.prepareSearchString($scope.searchText.value),
				filters: $scope.processFilters($scope.filters)
			}, function (response) {
				cb(response);
			});
		}

		$scope.getPage = function (page, totalFlag, callback) {
            var lower;
            var upper;
            if (callback) {
                lower = 0;
                upper = 5000;
            } else {
                lower = (page ? page - 1 : 0) * $scope.pageItemLimit;
                upper = (page ? page : 1) * $scope.pageItemLimit;
				$scope.selectedRows = [];
				$scope.selectedItems = [];
            }

			queryForEntries(upper, lower, function (response) {
				var queryResults = response.data;
			
                if (callback) {
                	$scope.items = queryResults;
					var linkedIcons = $scope.downloadSelectedCatalogLinks();
					for (var m=0; m<queryResults.length; m++) {
						queryResults[m].symbol2d = '';
						for (var n=0; n<linkedIcons.length; n++) {
							if (queryResults[m]._id === linkedIcons[n].catalogId && queryResults[m].catalog === linkedIcons[n].catalogName) {
								for (var o=0; o<linkedIcons[n].schematics.length; o++) {
									if (queryResults[m].symbol2d === '')
										queryResults[m].symbol2d += linkedIcons[n].schematics[o].id.toString();
									else
										queryResults[m].symbol2d = queryResults[m].symbol2d + '|' + linkedIcons[n].schematics[o].id.toString();
								}
							}
						}
					}
                    callback($scope.selected.code, queryResults);
                } else {
                    $scope.items = queryResults;
                    $scope.lower = lower;
                    $scope.upper = upper;
                    if(page === 1 && totalFlag)
                    {	
                        if (response.data.length === $scope.pageItemLimit) {
                            CatalogAPI.entries.query({
                            	catalogType: $scope.catalogType,
								standard: $scope.selectedStandard,
								category: $scope.target,
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
                }
      
			});
		};

		$scope.prepareSearchString = function (copy) {
			return copy;
		};

		$scope.search = function () {
			$scope.currentPage = 1;
			$scope.getPage(1, true);
		};

		$scope.noSubmit = function (evt) {
			if (evt.which === 13)
				evt.preventDefault();
		};

		$scope.checkFilters = function() {
			for (var i = 0; i < $scope.filters.length; i++) {
				if($scope.filters[i].value)
					return true;
			}
			if($scope.searchText.value)
				return true;
			return false;
		};

		// TODO: downloading of assets
        var resultDownloaded = function(type, queryResult) {
            try{
                if (window.exec !== undefined){
                    var response = window.exec(JSON.stringify({ functionName: 'MergeTable', invokeAsCommand: false, functionParams: {'type' : type, 'result' : queryResult}}));
                    console.log(response);
                }
            }
            catch(e){
                console.error(e);
            }
        };

        $scope.downloadSearchResults = function() {
            alert('downloading...');
            $scope.getPage(0, false, resultDownloaded);
        };

        $scope.downloadSelectedCatalogLinks = function() {
        	var catalogAndSchematicMapping = [];

        	if (Global.user !== null) {
        		var count = 0;
	        	var previousValue = $scope.selectedItems;
	        	$scope.selectedItems = $scope.items; 
	        	for (var i=0; i<$scope.selectedItems.length; i++) {
	        		catalogAndSchematicMapping[count] = {catalogId: '', catalogName: '', schematics: []};
	        		for (var j=0; j<Global.user.associations.length; j++) {
			        	if (Global.user.associations[j].catalogId === $scope.selectedItems[i]._id && $scope.linkedSchematicEntries[Global.user.associations[j].schematicId]) {
			        		catalogAndSchematicMapping[count].catalogId = Global.user.associations[j].catalogId;
			        		catalogAndSchematicMapping[count].catalogName = $scope.selectedItems[i].catalog;
			        		catalogAndSchematicMapping[count].schematics.push($scope.linkedSchematicEntries[Global.user.associations[j].schematicId]);
			        	}
					}
					if (catalogAndSchematicMapping[count].catalogId === '')
						catalogAndSchematicMapping.splice(count);
					else
						count++;
				}
				$scope.selectedItems = previousValue;
        	}
        	
			return catalogAndSchematicMapping;
        };

	}
]);