'use strict';

angular.module('ace.catalog').controller('catIconLinkModalCtrl', ['Global', '$scope', '$modalInstance', 'SchematicsAPI', 'UsersAPI', 'item', '_', function(Global, $scope, $modalInstance, SchematicsAPI, UsersAPI, item, _){


	$scope.cancel = function(){
		$modalInstance.close(false);
	};
	$scope.query = {};
	$scope.query.text = '';
	$scope.linkDisabled = true;
	$scope.levels = [];
	$scope.selectedHiearchy = [];
	$scope.selectedStd = null;
	$scope.selectedStdName = null;
	$scope.selectedLevel = null;
	$scope.selectedItem = null;

	$scope.link = function() {
		if(!$scope.linkDisabled)
		{
			if($scope.query.text.length === 0)
				UsersAPI.addAssociation.save({items: _.map($scope.items, function(obj) {return obj._id;}), _id: $scope.selectedHiearchy[$scope.selectedHiearchy.length - 1]._id, number: $scope.selectedHiearchy[$scope.selectedHiearchy.length - 1].published}, function(response) {
					if(response) {
						Global.user.associations = response;
						$modalInstance.close(true);
					}
				});
			else
				UsersAPI.addAssociation.save({items: _.map($scope.items, function(obj) {return obj._id;}), _id: $scope.selectedItem._id, number: $scope.selectedItem.published}, function(response){
					if(response){
						Global.user.associations = response;
						$modalInstance.close(true);
					}
				});
		}
	};

	$scope.setTarget = function(item){
		$scope.target = item;
	};

	$scope.removeTarget = function(){
		$scope.target = null;
	};

	$scope.getParentName = function(item){
		if(!item.parentNode)
			return;
		$scope.itemParentName = null;
		SchematicsAPI.node.get({nodeId: item.parentNode._id},function(response){
			$scope.itemParentName = response.name;
		});
	};

	$scope.alreadyLinked = function(item) {
		if($scope.items.length === 1 && !item.isComposite)
		{
			for (var i = 0; i < Global.user.associations.length; i++) {
				if (Global.user.associations[i].catalogId === $scope.items[0]._id && Global.user.associations[i].schematicId === item._id)
					return true;
			}
		}
		return false;
	};

	$scope.unpublished = function(item) {
		if(item.published === 0)
			return true;
		return false;
	};

	$scope.getListOfItems = function() {
		return _.map($scope.items, function(obj){return obj.catalog;}).join(', ');
	};

	$scope.init = function() {
		SchematicsAPI.standardlist.query(function(standards) {
			$scope.stds = standards;
			$scope.typeAheadValues = [];
			$scope.levels.push({items: standards, levelNumber: 0});
			if(standards.length > 0)
			{
				$scope.selectedStdName = $scope.stds[0].name;
				SchematicsAPI.getAllChildren.save({name: $scope.selectedStdName}, function(response) {
					if(response)
					{
						for(var i in response)
							if(!response[i].isComposite){
								$scope.typeAheadValues.push(response[i]);							
							}

					}
				});
			}
		}); 
		$scope.items = [];
		for(var i in item)
			$scope.items.push(item[i]);
	};

	$scope.isSelected = function(level, item)
	{
		var selectedOption = $scope.selectedHiearchy[level];
		if(selectedOption && item._id === selectedOption._id)
		{
			return true;
		}
		return false;
	};

	$scope.selectFromSearch = function(item){
		$scope.selectedItem = item;
	};

	$scope.selectOption = function(level, item)
	{
		$scope.selectedLevel = {current: parseInt(level, 10), total: parseInt($scope.levels.length, 10)};
		if($scope.selectedHiearchy[level] && $scope.selectedHiearchy[level]._id !== item._id)
		{
			$scope.levels.splice(level+1, $scope.levels.length);
			$scope.selectedHiearchy.splice(level+1, $scope.selectedHiearchy.length);
		}
		if(!$scope.selectedHiearchy[level] || ($scope.selectedHiearchy[level] && $scope.selectedHiearchy[level]._id !== item._id))
		{
			$scope.selectedHiearchy[level] = {_id: item._id, isComposite: item.isComposite, published: item.published};
			if(item.parentNode === null)
			{
				$scope.selectStandard(item);
			}
			else
			{
				$scope.select(level, item);
			}
		}
	};

	$scope.selectSearchStd = function(option){
		$scope.selectedStdName = option.name;
		$scope.typeAheadValues =[];
		SchematicsAPI.getAllChildren.save({name: option.name}, function(response) {
			if(response)
			{
				for(var i in response)
						if(!response[i].isComposite)
							$scope.typeAheadValues.push(response[i]);
			}
		});
	};

	$scope.selectStandard = function(option)
	{
		$scope.selectedStdName = option.name;
		SchematicsAPI.getAllChildren.save({name: option.name}, function(response) {
			if(response)
			{
				$scope.selectedStd = response;
				$scope.typeAheadValues = [];
				for(var i in response)
						if(!response[i].isComposite){
							$scope.typeAheadValues.push(response[i]);							
						}
				var immediateChildren = [];
				for (var j = 0; j < response.length; j++) {
					if(response[j].parentNode && response[j].parentNode._id === option._id)
					{
						immediateChildren.push(response[j]);
					}
				}
				$scope.levels.push({items: immediateChildren, levelNumber: 1});
			}
		});
	};

	$scope.select = function(level, option)
	{

		var immediateChildren = [];
		for (var i = 0; i < $scope.selectedStd.length; i++) {
			if($scope.selectedStd[i].parentNode && $scope.selectedStd[i].parentNode._id === option._id)
			{
				immediateChildren.push($scope.selectedStd[i]);
			}
		}
		if(option.isComposite){
			$scope.levels[level+1] = {items: immediateChildren, levelNumber: level+1};
		}
			
	};

	$scope.$watch('selectedHiearchy', function() {
		for (var i = 0; i < $scope.selectedHiearchy.length; i++) {
			if(!$scope.selectedHiearchy[i].isComposite)
			{
				$scope.linkDisabled = false;
				return;
			}
		}
		$scope.linkDisabled = true;
	},true);

	$scope.$watch('selectedItem',function(){
		if($scope.selectedItem!== null)
			$scope.linkDisabled = false;
	});
}]);