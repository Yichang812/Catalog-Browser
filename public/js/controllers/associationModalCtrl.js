'use strict';

angular.module('ace.catalog').controller('associationModalCtrl', ['$scope', '$modalInstance','data', 'UsersAPI', 'Global', '$modal', '$timeout', 'CatalogAPI', function($scope, $modalInstance, data, UsersAPI, Global, $modal, $timeout, CatalogAPI) {

	$scope.item = data.item;
	$scope.hide = false;

	$scope.populateEntries = function() {
		$scope.schematicEntries = [];
		if(Global.authenticated)
		{
			for (var i = 0; i < Global.user.associations.length; i++) {
				var association = Global.user.associations[i];
				if(association.catalogId === $scope.item._id)
				{
					if(data.schematicLinks[association.schematicId])
					{
						var newObj = data.schematicLinks[association.schematicId];
						newObj.showOption = false;
						newObj.iconVersion = Global.user.associations[i].iconVersion;
						$scope.schematicEntries.push(newObj);
					}
				}
			}
		}
	};

	$scope.refresh = function() {
		UsersAPI.getAssociations.query(function(response) {
			if(response)
			{
				for (var i = 0; i < response.length; i++) {
					data.schematicLinks[response[i]._id] = response[i];
				}
				$scope.populateEntries();
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
				UsersAPI.updateAssociation.save({_id: child._id, item: data.item._id}, function(response) {
					if(response)
					{
						Global.user.associations = response;
						$scope.refresh();
						child.iconVersion = child.published;
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
            	//call API to retrieve entire catalog entry
            	CatalogAPI.getEntryById.save({_id: $scope.item._id}, function(response) {
            		if(response)
            		{
		                window.exec(JSON.stringify({ functionName: 'InsertSingleCatEntry', invokeAsCommand: false, functionParams: {'link': link, 'record': response} }));
		                console.log(response);
            		}
            	});
            }
        }
        catch(e){
            console.error(e);
        }
    };


	$scope.toggleOption = function (child, set) {
		if(typeof child.showOption === 'undefined')
			child.showOption = false;
		return (child.showOption = set);
	};

	$scope.deleteAssociation = function(child) {
		$scope.hide = true;
		var modalInstance = $modal.open({
			templateUrl: 'views/confirmationModal.html',
			controller: 'confirmationModalCtrl',
			resolve: {
				title: function(){return 'Are you sure you want to delete this Link?';},
				msg: function(){return '';}
			}
		});
		modalInstance.result.then(function(decision){
			$scope.hide = false;
			if(decision){
				UsersAPI.delAssociation.save({item: $scope.item._id, _id: child._id}, function(response) {
					if(response)
					{
						if(Global.authenticated) 
						{
							Global.user.associations = response;
							$scope.schematicEntries.splice($scope.schematicEntries.indexOf(child), 1);
						}
					}
				});
			}
		},function(){
			$scope.hide = false;
		});
	};

	$scope.openAddLinkModal = function(){
		$scope.hide = true;
		var modalInstance = $modal.open({
			templateUrl: 'views/Catalog/catIconLinkModal.html',
			controller: 'catIconLinkModalCtrl',
			backdrop: 'static',
			windowClass: 'largerModal',
			resolve: {
				item: function(){
					var itemArray = [];
					itemArray.push($scope.item);
					return itemArray;
				}
			}
		});
		modalInstance.result.then(function(){
			$timeout(function(){
				$scope.hide = false;
				$scope.populateEntries();
			},50);

		},function(){
			$scope.hide =false;
		});
	};

	$scope.done = function(){
		$modalInstance.close(true);
	};

}]);