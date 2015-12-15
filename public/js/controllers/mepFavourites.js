'use strict';

angular.module('ace')
.controller('mepFavourites', ['$scope', 'Global', 'UsersAPI', '$modal',  function ($scope, Global, UsersAPI, $modal) {
	$scope.Global = Global;
	$scope.schematic = [];
	$scope.catalog = [];
	$scope.catalogFilters = [];
	$scope.linkedSchematicEntries = {};

	// Don't show library, redirect user to profile to select default product if none stated
	// $scope.initDefPrdt = function() {
	// 	// only in browser
	// 	if (window.exec === undefined) {
	// 		if (!Global.user.userDefPrdt || Global.user.userDefPrdt === 'Select default product')
	// 			$location.url('profile');
	// 	}
	// };

	// set link address for catalog library
	// if (Global.user.userDefPrdt === 'AutoCAD MEP')
		$scope.setLink = 'mep-catalog';
	// else
	// 	$scope.setLink = 'catalog';

	// var setFavVersions = function() {
	// 	function predicate(obj) {
	// 		return $scope.schematic[i]._id === obj.schematicId;
	// 	}
	// 	for (var i = $scope.schematic.length - 1; i >= 0; i--) {
	// 		var findIconVersion = _.find(Global.user.SchemFav, predicate);
	// 		if(findIconVersion)
	// 		{
	// 			$scope.schematic[i].favVersion = findIconVersion.iconVersion;
	// 		}
	// 	}
	// };

	Global.user.userDefView = 'AutoCAD MEP';

	$scope.getFavourites = function() {
		UsersAPI.me.query(function(response) {
			if(response)
			{
				Global.user = response;

				// get favourites by product, default is ACE
				// if (Global.user.userDefPrdt === 'AutoCAD MEP') {
					UsersAPI.getCatFav.query({product: Global.user.userDefView}, function(catEntries) {
						$scope.catalog = catEntries;
					});
					UsersAPI.getFilters.query({product: Global.user.userDefView}, function(catFilters) {
						$scope.catalogFilters = catFilters;
					});
				// }
				
				// else {
				// 	UsersAPI.getFav.query(function(favourites) {
				// 		$scope.schematic = favourites.schematic;
				// 		setFavVersions();
				// 	});
				// 	UsersAPI.getCatFav.query(function(catEntries) {
				// 		$scope.catalog = catEntries;
				// 	});
				// 	UsersAPI.getFilters.query(function(catFilters) {
				// 		$scope.catalogFilters = catFilters;
				// 	});
				// }
				

			}
		});
	};
	$scope.toggleOption = function (child, set) {
		if(typeof child.showOption === 'undefined')
			child.showOption = false;
		return (child.showOption = set);
	};


	$scope.delSchemFav = function(child){
		if(child.isComposite)
			return;
		UsersAPI.delSchemFav.save({_id: child._id}, function(response) {
			if(response)
			{
				$scope.schematic.splice($scope.schematic.indexOf(child), 1);
				$scope.Global.setFav(response);
			}
		});
	};

	$scope.updateFav = function(child) {
		var modalInstance = $modal.open({
			templateUrl: 'views/confirmationModal.html',
			controller:'confirmationModalCtrl',
			backdrop: 'static',
			resolve:{
				title: function(){return 'Are you sure you want to update this favourite to the latest icon version?';},
				msg: function(){return '';}
			}
		});
		modalInstance.result.then(function(decision){
			if(decision){
				UsersAPI.updateSchemFav.save({_id: child._id}, function(response) {
					if(response)
					{
						$scope.Global.setFav(response);
						$scope.getFavourites();
					}
				});
			}
		});

	};

	$scope.delCatFav = function(child){
		if (Global.user.userDefPrdt === 'AutoCAD MEP') {
			UsersAPI.delCatFav.save({product: Global.user.userDefPrdt, _id: child._id}, function(response) {
				if(response)
				{
					$scope.catalog.splice($scope.catalog.indexOf(child), 1);
					Global.user.mepFav = response.favourites;
				}
			});
		}
		else {
			if(child.isComposite)
				return;
			UsersAPI.delCatFav.save({_id: child._id}, function(response) {
				if(response)
				{
					$scope.catalog.splice($scope.catalog.indexOf(child), 1);
					Global.user.catFav = response.favourites;
				}
			});
		}
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

	$scope.refreshAssociations = function() {
		if($scope.Global.authenticated && $scope.Global.user.associations && $scope.Global.user.associations.length > 0)
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

	$scope.$watchCollection('Global.user.associations', function() {
		$scope.refreshAssociations();
	});

	$scope.deleteFilter = function(child) {
		var modalInstance = $modal.open({
			templateUrl: 'views/confirmationModal.html',
			controller:'confirmationModalCtrl',
			backdrop: 'static',
			resolve:{
				title: function(){return 'Are you sure you want to delete?';},
				msg: function(){return 'This cannot be undone.';}
			}
		});
		modalInstance.result.then(function(decision){
			if(decision){
				UsersAPI.delFilter.save({name: child.name, product: Global.user.userDefPrdt}, function(response) {
					if(response)
					{	
						$scope.catalogFilters.splice($scope.catalogFilters.indexOf(child), 1);
						if (Global.user.userDefPrdt === 'AutoCAD MEP') 
							Global.user.mepCatalogFilters = response.favourites;
						else
							Global.user.catalogFilters = response.favourites;
					}
				});
			}
		});

	};

	$scope.setDownloadLink = function(link){
        var download;
        if (link === undefined || !link){
            download = '#';
        }
        else{
            download = link;
        }
        try{
            if (window.exec === undefined){
                return download;
            }
        }
        catch(e){
            console.error(e);
            return download;
        }
        // return empty link if its in ACAD
        return '';
    };

    $scope.downloadLink = function (link) {
        try{
            if (window.exec !== undefined){
                var response = window.exec(JSON.stringify({ functionName: 'DownloadInsertSymbol', invokeAsCommand: false, functionParams: {'link': link} }));
                console.log(response);
            }
        }
        catch(e){
            console.error(e);
        }
    };

}]);
