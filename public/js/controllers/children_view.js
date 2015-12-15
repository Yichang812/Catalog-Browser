'use strict';

angular.module('ace.schematic')
.controller('Children', ['$scope', 'SchematicsAPI', '$routeParams', 'Global', 'breadcrumbs', '$modal', 'UsersAPI', '_', function ($scope, SchematicsAPI, $routeParams, Global, breadcrumbs, $modal, UsersAPI, underscore) {
	$scope.breadcrumbs = breadcrumbs;
	$scope.bcMenu = [];
	$scope._ = underscore;
	$scope.Global = Global;
	$scope.admin = false;
	$scope.leaves = [];
	$scope.subtypes = [];
	if($scope.Global.authenticated && $scope.Global.user.isAdmin)
		$scope.admin = true;
	$scope.getChildren = function() {
		var nodeId = $routeParams.nodeId;
		$scope.nodeId = nodeId;
		if(!nodeId)
			return;
		SchematicsAPI.children.get({nodeId: nodeId}, function(children) {
			$scope.children = children.children;
			$scope.seperate();
		});
		breadcrumbs.fetch.get({nodeId: nodeId}, function(result) {
			var hiearchy = result.parentHiearchy;
			for (var i = hiearchy.length - 1; i >= 0; i--) {
				hiearchy[i].link = '#!/standards/' + hiearchy[i].link;
			}
			breadcrumbs.add(hiearchy);
		});
	};

	$scope.toggleOption = function (child, set) {
		if(typeof child.showOption === 'undefined')
			child.showOption = false;
		return (child.showOption = set);
	};

	$scope.getSiblings = function(breadcrumb){
		$scope.bcMenu = [];
		var _id = breadcrumb.link.split('/');
		_id = _id[_id.length - 1];
		if(breadcrumb.title !== 'Standards'){
			SchematicsAPI.children.get({nodeId:_id}, function(result){
				for(var i in result.children){
					if(result.children[i].isComposite === true){
						var menuItem = {};
						menuItem.title = result.children[i].name;
						menuItem.link = '#!/standards/' + result.children[i]._id;
						if($scope.nodeId !== result.children[i]._id)
							$scope.bcMenu.unshift(menuItem);
					}
				}
				return;
			});
		}
		if(breadcrumb.title === 'Standards'){
			SchematicsAPI.standardlist.query(function(stds){
				for(var i in stds){
					var menuItem = {};
					menuItem.title = stds[i].name;
					menuItem.link = '#!/standards/' + stds[i]._id;
					if(menuItem.title && $scope.nodeId !== stds[i]._id)
						$scope.bcMenu.unshift(menuItem);
				}
			});
		}
	};

	$scope.seperate = function() {
		$scope.leaves = [];
		$scope.subtypes = [];
		var children = $scope.children;
		for (var i = children.length - 1; i >= 0; i--) {
			if(children[i].isComposite)
				$scope.subtypes.push(children[i]);
			else
				$scope.leaves.push(children[i]);
		}
		if($scope.Global.authenticated)
			$scope.addFavouriteKey();
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

	$scope.showEditForm  = function(child){
		$scope.target = child;
		var modalInstance = $modal.open({
			templateUrl: 'views/Schematics/editComponentForm.html',
			controller: 'editCompFormCtrl',
			backdrop: 'static',
			resolve: {
				target: function() {
					return ($scope.target);
				}
			}
		});
		modalInstance.result.then(function(){
			$scope.getChildren();
		});
	};

	$scope.showLeafAddForm = function(){
		SchematicsAPI.node.get({nodeId:$routeParams.nodeId}, function(node){
			$scope.target = node;
			var modalInstance = $modal.open({
				templateUrl: 'views/Schematics/addCompForm.html',
				controller: 'addCompFormCtrl',
				backdrop: 'static',
				resolve:{
					parent: function(){
						return ($scope.target);
					}
				}
			});
			modalInstance.result.then(function(){
				$scope.getChildren();
			});
		});
	};

	$scope.showSubtypeAddForm = function(){
		SchematicsAPI.node.get({nodeId:$routeParams.nodeId}, function(node){
			$scope.target = node;
			var modalInstance = $modal.open({
				templateUrl: 'views/Schematics/addGrpForm.html',
				controller: 'addGrpFormCtrl',
				backdrop: 'static',
				resolve:{
					parent: function(){
						return ($scope.target);
					}
				}
			});
			modalInstance.result.then(function(){
				$scope.getChildren();
			});
		});
	};

	$scope.showSubtypeEditForm = function(child){
		$scope.target = child;
		var modalInstance = $modal.open({
			templateUrl: 'views/Schematics/editGrpForm.html',
			controller: 'editGrpFormCtrl',
			backdrop: 'static',
			resolve: {
				target: function() {
					return ($scope.target);
				}
			}
		});
		modalInstance.result.then(function(){
			$scope.getChildren();
		});
	};

	$scope.showVersionModal = function(child){
		$scope.target = child;
		var modalInstance = $modal.open({
			templateUrl: 'views/Schematics/versionListModal.html',
			controller: 'versionListCtrl',
			backdrop: 'static',
			resolve: {
				target: function() {
					return ($scope.target);
				}
			}
		});
		modalInstance.result.then(function(){
			$scope.getChildren();
		});
	};

	$scope.showComingSoon = function(){
		$modal.open({
			templateUrl: 'views/ComingModal.html',
			controller: 'ComingModalCtrl'
		});
	};

	$scope.addFavouriteKey = function() {
		var listOfFavs = $scope._.map($scope.Global.user.SchemFav, function(obj) { return obj.schematicId; });
		for (var i = 0; i < $scope.leaves.length; i++) {
			var leaf = $scope.leaves[i];
			if(listOfFavs.indexOf(leaf._id) > -1)
				leaf.isFavourite = true;
			else
				leaf.isFavourite = false;
		}
	};

	$scope.addFav = function(child){
		if(child.isComposite)
			return;
		if(child.published === 0)
			return;
		UsersAPI.addSchemFav.save({_id: child._id, number: child.published}, function(response) {
			if(response)
			{
				child.isFavourite = true;
				if($scope.Global.authenticated)
					$scope.Global.setFav(response);
			}
		});
	};

	$scope.delFav = function(child){
		if(child.isComposite)
			return;
		if(child.published === 0)
			return;
		UsersAPI.delSchemFav.save({_id: child._id}, function(response) {
			if(response)
			{
				child.isFavourite = false;
				if($scope.Global.authenticated)
					$scope.Global.setFav(response);
			}

		});
	};


}]);
