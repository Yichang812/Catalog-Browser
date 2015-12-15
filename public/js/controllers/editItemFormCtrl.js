'use strict';

angular.module('ace.schematic').controller('editItemFormCtrl', ['$scope', '$modalInstance', 'CatalogAPI', '_', 'item','$modal', function($scope, $modalInstance, CatalogAPI, _, item,$modal){
	$scope.init = function(){
		CatalogAPI.getEntryById.save({_id:item._id}, function(response){
			$scope.item = response;
			$scope.additionalInfo = _.pairs(response.additionalInfo);
			$scope.hide = false;
			$scope.selectedType = {};
			$scope.getTypes();
			$scope.doneDisabled = true;
			$scope.unique = true;
		});
	};

	$scope.getTypes = function(){
		CatalogAPI.types.query(function(response){
			$scope.types = response;
			//$scope.selectedType = $scope.item.type.name + '(' +$scope.item.type.code+ ')';
			for (var index in $scope.types){
				if($scope.types[index].code === $scope.item.type.code){
					$scope.selectedType.type= $scope.types[index];
					$scope.oldVal = $scope.selectedType.type;
				}
			}
		});
	};

	$scope.requiredField = ['catalog','type','assemblyCode','manufacturer'];

	$scope.loadFieldsByType = function(){
		$scope.additionalInfo = [];
		CatalogAPI.fields.query({type:$scope.selectedType.type.code}, function(response){
			if(response){
				for (var i in response){
					if (typeof response[i] === 'object'){
						var field = _.values(response[i]).join('');
						var fieldPair = [];
						if($scope.requiredField.indexOf(field) > -1)
							continue;
						if(field.indexOf('function') > -1)
							continue;
						if(field.indexOf('additionalInfo.') >= 0 && field.length > 0 && field.length < 30)
							field = field.substr(15);
						fieldPair.push(field);
						fieldPair.push(null);
						$scope.additionalInfo.push(fieldPair);
					}
				}
			}
		});
	};

	$scope.cancel = function(){
		$modalInstance.close(false);
	};


	$scope.confirmTypeChange = function(){
		$scope.hide = true;
		$scope.modalInstance = $modal.open({
			templateUrl: 'views/confirmationModal.html',
			controller:'confirmationModalCtrl',
			backdrop: 'static',
			resolve:{
				msg: function(){
					return 'Changing the type will discard all type-specific information on the item.';
				},
				title:function(){
					return 'Are you sure to change the type?';
				}
			}
		});
		$scope.modalInstance.result.then(function(decision){
			if(decision){
				$scope.loadFieldsByType();
				$scope.oldVal = $scope.selectedType.type;
			}
			if(!decision){
				for(var i in $scope.types){
					if($scope.types[i].code === $scope.oldVal.code)
						$scope.selectedType.type = $scope.types[i];
				}
			}
			$scope.hide = false;
			return;
		});
	};

	$scope.update = function(){
		var newItem = {};
		newItem.catalog = $scope.item.catalog;
		newItem.manufacturer = $scope.item.manufacturer;
		newItem.assemblyCode = $scope.item.assemblyCode;
		newItem._id = $scope.item._id;
		newItem.type = $scope.selectedType.type;
		newItem.additionalInfo = _.object($scope.additionalInfo);
		CatalogAPI.updateEntry.save({item:newItem},function(response){
			if(response) {
				$modalInstance.close(true);
			}
		});
	};

	$scope.delete = function(){
		$scope.hide = true;
		var modalInstance = $modal.open({
			templateUrl: 'views/confirmationModal.html',
			controller:'confirmationModalCtrl',
			backdrop: 'static',
			resolve:{
				title:function(){return 'Are you sure you want to delete?';},
				msg:function(){return 'This cannot be undone';}
			}
		});
		modalInstance.result.then(function(decision){
			if(decision){
				CatalogAPI.deleteEntry.save({_id:$scope.item._id}, function(response){
					if(response)
					{
						$modalInstance.close(true);
					}
				});
			}
			$scope.hide = false;
			return;
		});
	};

	$scope.checkUnique = function(compulsory){
		if(compulsory){
			if($scope.item.catalog!=='')
				CatalogAPI.checkUnique.save({catalog:$scope.item.catalog, manufacturer: $scope.item.manufacturer, _id:$scope.item._id, type:$scope.selectedType.type, assemblyCode:$scope.item.assemblyCode}, function(response){
					$scope.unique = response.unique;
					$scope.doneDisabled = !$scope.unique;
				});
			else
				$scope.doneDisabled = true;
			return;
		}
			$scope.doneDisabled = !$scope.unique;

	};


}]);