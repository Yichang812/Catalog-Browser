'use strict';
angular.module('ace.catalog').controller('catalogListCtrl', [
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
		$scope.fields = [];
		$scope._ = underscore;
		$scope.pageItemLimit = 15;
		$scope.items = [];
		$scope.searchMode = false;
		$scope.lower = 0;
		$scope.upper = $scope.lower + $scope.pageItemLimit;
		$scope.sort = null;
		$scope.defaultFilters = [
			'Catalog',
			'Manufacturer',
			'Assembly Code',
			'Description'
		];
		$scope.filters = [];
		$scope.searchBox = {};
		$scope.searchText = {};
		$scope.typeAheadValues = [];
		$scope.selectedRows = [];
		$scope.selectedItems = [];
		$scope.sth = {show:'aaa'};
		$scope.multiple = false;
		$scope.fields = [];
		$scope.linkedSchematicEntries = {};
		$scope.cols = [
			{
				title: 'Catalog',
				field: 'catalog',
				sort: null
			},
			{
				title: 'Manufacturer',
				field: 'manufacturer',
				sort: null
			},
			{
				title: 'Assembly Code',
				field: 'assemblyCode',
				sort: null
			}
		];
        $scope.showDownload = (window.exec === undefined)? false : true;

		$scope.authorized = function () {
			if ($scope.global.authenticated && ($scope.global.user.isAdmin || $scope.global.user.isManufacturer))
				return true;
			return false;
		};

		$scope.checkLink = function(data) {
			if($scope.global.authenticated)
			{
				var associations = $scope.global.user.associations;
				var catalogIds = $scope._.map(associations, function(obj) {return obj.catalogId;});
				if(catalogIds.indexOf(data._id) > -1)
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

		$scope.showConfigureModal = function () {
			$modal.open({
				templateUrl: 'views/Catalog/configureTableModal.html',
				controller: 'configureTableModalCtrl',
				resolve: {
					data: function () {
						return {
							fields: $scope.fields,
							cols: $scope.cols,
							toggleField: $scope.toggleField,
							toggleAll: $scope.toggleAll
						};
					}
				}
			});
		};

		$scope.showAssociationModal = function (item) {
			$modal.open({
				templateUrl: 'views/Catalog/associationModal.html',
				controller: 'associationModalCtrl',
				resolve: {
					data: function () {
						return {
							item: item,
							schematicLinks: $scope.linkedSchematicEntries
						};
					}
				}
			});
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
							type: $scope.selected,
							search: $scope.searchText
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

		$scope.markCatFavourite = function(){
			if($scope.selectedItems.length === 0 || !$scope.global.authenticated)
				return;
			var items = $scope._.map($scope.selectedItems, function(obj) {
				return obj._id;
			});
			UsersAPI.addCatFav.save({items: items}, function(response) {
				if(response)
				{
					$scope.global.user.catFav = response.favourites;
				}
			});
		};

		$scope.delCatFav = function(item){
			UsersAPI.delCatFav.save({_id: item._id}, function(response) {
				if(response)
				{
					$scope.global.user.catFav = response.favourites;
				}
			});
		};

		$scope.checkIfCatFav = function(item) {
			if($scope.global.authenticated)
			{
				var favourites = $scope._.map($scope.global.user.catFav, function(item) {
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

		$scope.refreshAssociations = function() {
			if($scope.global.authenticated && $scope.global.user.associations && $scope.global.user.associations.length > 0)
			{
				UsersAPI.getAssociations.query(function(response) {
					if(response)
					{
						for (var i = 0; i < response.length; i++) {
							$scope.linkedSchematicEntries[response[i]._id] = response[i];
						}
					}
				});
			}
		};

		$scope.$watchCollection('global.user.associations', function() {
			$scope.refreshAssociations();
		});

		$scope.init = function () {
			$scope.showTypes = true;
			$scope.searchBox.show = true;
			$scope.showList = false;
			CatalogAPI.types.query(function (response) {
				if (response)
					$scope.types = response;
			});
			if(Global.authenticated)
			{
				UsersAPI.getAssociations.query(function(response) {
					if(response)
					{
						for (var i = 0; i < response.length; i++) {
							$scope.linkedSchematicEntries[response[i]._id] = response[i];
						}
					}
				});
				UsersAPI.me.query(function(response) {
					if(response)
					{
						Global.user = response;
					}
				});
			}
			if($scope.global.authenticated && $routeParams.filterName && $scope.global.user.catalogFilters.length !== 0)
			{
				for (var i = 0; i < $scope.global.user.catalogFilters.length; i++) {
					if($scope.global.user.catalogFilters[i].name === $routeParams.filterName)
					{
						$scope.showTypes = false;
						$scope.selected = $scope.global.user.catalogFilters[i].filter.type;
						$scope.target = $scope.selected;
						$scope.searchText = $scope.global.user.catalogFilters[i].filter.search;
						$scope.filters = $scope.global.user.catalogFilters[i].filter.filters;
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
			$scope.getTypeAheadValues(f);
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

		$scope.showLinkModal = function(item){
			if(item)
				var linkItem = item;
			else if($scope.selectedItems.length === 0)
				return;
			$modal.open({
				templateUrl: 'views/Catalog/catIconLinkModal.html',
				controller: 'catIconLinkModalCtrl',
				backdrop: 'static',
				windowClass: 'largerModal',
				resolve:{
					item:function(){return linkItem ? [linkItem]:$scope.selectedItems;}
				}
			});
		};

		$scope.getTypeAheadValues = function (field) {
			if (field === 'Manufacturer') {
				return $http.post('/api/getAllUniqueValues', {
					field: field,
					type: $scope.selected.code
				}).then(function (response) {
					var array = [];
					for (var i = 0; i < response.length; i++) {
						var string = $scope._.values(response[i]).join('');
						array.push(string);
					}
					$scope.typeAheadValues[field] = response.data;
				});
			}
		};

		$scope.showTypeList = function (type) {
			$scope.showList = true;
			$scope.searchBox.show = true;
			$scope.showTypes = false;
			$scope.selectedRows = [];
			$scope.selectedItems = [];
			$scope.target = type;
			$scope.selected = type;
			$scope.currentType = type;
			function parseCamelCase(input) {
				return input.charAt(0).toUpperCase() + input.substr(1).replace(/[A-Z0-9]/g, ' $&');
			}
			$scope.searchText = {};
			$scope.filters = [];
			$scope.searchBox.show = true;
			$scope.fields = [];
			$scope.cols = [
				{
					title: 'Catalog',
					field: 'catalog',
					sort: null
				},
				{
					title: 'Manufacturer',
					field: 'manufacturer',
					sort: null
				},
				{
					title: 'Assembly Code',
					field: 'assemblyCode',
					sort: null
				}
			];
			CatalogAPI.fields.query({ type: type.code }, function (response) {
				if (response) {
					for (var i = 0; i < response.length; i++) {
						var field = $scope._.values(response[i]).join('');
						var displayed_field = field;
						if (displayed_field.indexOf('additionalInfo') > -1) {
							displayed_field = displayed_field.replace('additionalInfo.', '');
							displayed_field = displayed_field.replace('_', ' ');
							displayed_field = parseCamelCase(displayed_field);
							$scope.fields.push({
								title: displayed_field,
								field: field,
								sort: null
							});
						}
					}
				}
			});
			$scope.getPage(1, true);
		};

		$scope.processFilters = function (filters) {
			if (!filters)
				return null;
			var newObj = {};
			var non_additional = ['Catalog', 'Manufacturer', 'Assembly Code'];
			for (var i = 0; i < filters.length; i++) {
				var filter = filters[i];
				if(!filter.value)
					continue;
				if(non_additional.indexOf(filter.field) > -1)
					newObj[filter.field[0].toLowerCase()+filter.field.substring(1).replace(' ', '')] = filter.value;
				else
					newObj['additionalInfo.'+filter.field.toLowerCase().replace(' ','')] = filter.value;
			}
			return newObj;
		};

		$scope.closeType = function () {
			$scope.showTypes = false;
		};

		$scope.showType = function () {
			$scope.showTypes = true;
		};

		function queryForEntries(fields, upper, lower, cb) {
			CatalogAPI.entries.query({
				type: $scope.target.code,
				lower: lower,
				sortField: $scope.sort,
				upper: upper,
				fields: fields,
				manufacturer: $scope.manufacturer,
				search: $scope.prepareSearchString($scope.searchText.value),
				filters: $scope.processFilters($scope.filters)
			}, function (response) {
				cb(response);
			});
		}

		$scope.toggleField = function (field) {
			if ($scope.cols.indexOf(field) === -1) {
				$scope.cols.push(field);
				if($scope.searchText || $scope.filters.length > 0)
				{
					$scope.getPage(1, true);
					return;
				}
				$scope.getPage($scope.currentPage, true);
			} else {
				$scope.cols.splice($scope.cols.indexOf(field), 1);
			}
		};

		$scope.getPage = function (page, totalFlag, callback) {
            var lower;
            var upper;
            var cols = [];
            if (callback) {
                lower = 0;
                upper = 5000;
                $scope.cols.forEach(function(entry){
                    cols.push(entry.field);
                });
                $scope.fields.forEach(function(entry){
                    cols.push(entry.field);
                });
            } else {
                lower = (page ? page - 1 : 0) * $scope.pageItemLimit;
                upper = (page ? page : 1) * $scope.pageItemLimit;
                cols = $scope._.map($scope.cols, function (value) {
                    return value.field;
                });
				$scope.selectedRows = [];
				$scope.selectedItems = [];
            }

			queryForEntries(cols.join(' '), upper , lower, function (response) {
				var queryResults = $scope._.map(response.data, function (value) {
					return $scope._.omit(value, [
						'additionalInfo',
						'__v'
					]);
				});
				if ($scope.fields.length > 0) {
					for (var i = 0; i < $scope.fields.length; i++) {
						var field = $scope.fields[i];
						for (var j = 0; j < queryResults.length; j++) {
							var newField = $scope._.findWhere(response.data, { _id: queryResults[j]._id });
							if (newField && newField.additionalInfo)
								queryResults[j][field.field] = newField.additionalInfo[field.field.replace('additionalInfo.', '')];
							else
								queryResults[j][field.field] = '';
						}
					}
				}

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
                                type: $scope.selected.code,
                                search: $scope.prepareSearchString($scope.searchText.value),
                                total: true,
                                fields: cols.join(' '),
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

		$scope.sortedValues = function (data) {
			var cols = $scope._.map($scope.cols, function (value) {
					return value.field;
				});
			var val_array = new Array(cols.length + 1).join('-').split('');
			for (var key in data) {
				var index = cols.indexOf(key);
				if (index > -1) {
					if (data[key]) {
						val_array[index] = data[key];
					}
				}
			}
			return val_array;
		};

		$scope.sortTable = function (col) {
			var order = col.sort;
			for (var i = 0; i < $scope.cols.length; i++) {
				$scope.cols[i].sort = null;
			}
			col.sort = order === 1 ? -1 : 1;
			$scope.sort = col;
			$scope.getPage($scope.currentPage ? $scope.currentPage : 1);
		};

		$scope.toggleAll = function () {
			if ($scope.fields.length + 3 !== $scope.cols.length) {
				for (var i = 0; i < $scope.fields.length; i++) {
					var field = $scope.fields[i];
					if ($scope.cols.indexOf(field) === -1)
						$scope.toggleField(field);
				}
				return;
			}
			for (var j = 0; j < $scope.fields.length; j++) {
				var remove_field = $scope.fields[j];
				$scope.cols.splice($scope.cols.indexOf(remove_field), 1);
			}
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