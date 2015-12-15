'use strict';

angular.module('ace.schematic')
.controller('Standards', ['$scope', 'SchematicsAPI', 'Global', 'breadcrumbs', '$modal', function ($scope, SchematicsAPI, Global, breadcrumbs, $modal) {
	$scope.breadcrumbs = breadcrumbs;
	$scope.admin = false;
	$scope.Global = Global;
	if($scope.Global.authenticated && $scope.Global.user.isAdmin)
		$scope.admin = true;
	$scope.form = null;
	$scope.forms = [{'name':'addForm','URL':'views/Schematics/addStdForm.html'},{'name':'editStdForm','URL':'views/Schematics/editStdForm.html'}];

	$scope.showAddForm = function () {
		$scope.form = $scope.forms[0];
	};

	$scope.showEditForm = function(std){
		$scope.form = $scope.forms[1];
		$scope.currentStd = std;
	};

	$scope.getAll = function() {
		$scope.breadcrumbs.reset();
		SchematicsAPI.standardlist.query(function(standards) {
			$scope.stds = standards;
			$scope.form = null;
			for(var i = 0; i < standards.length; i++)
			{
				$scope.stds[i].showOption = false;
			}
		});
	};
	$scope.editForm = false;

	$scope.toggleOption = function (std, set) {
		$scope.target = std;
		if(typeof std.showOption === 'undefined')
			std.showOption = false;
		return (std.showOption = set);
	};

	$scope.unpublished = function(array) {
		var newArray = [];
		if(array)
		{
			for (var i = 0; i < array.length; i++) {
				var child = array[i];
				if(child.isPublished || $scope.admin)
					newArray.push(child);
			}
		}
		return newArray;
	};

	$scope.downloadStandard = function(){
		$scope.showComingSoon();
	};

	$scope.publishStandard = function(child){
		SchematicsAPI.publishStd.save({std_id: child.standard._id}, function(response) {
			if(response)
			{
				child.published = 1;
			}
		});
	};

	$scope.unpublishStandard = function(child){
		SchematicsAPI.unpublishStd.save({std_id: child.standard._id}, function(response) {
			if(response)
			{
				child.published = 0;
			}
		});
	};

	$scope.showComingSoon = function(){
		$modal.open({
			templateUrl: 'views/ComingModal.html',
			controller: 'ComingModalCtrl'
		});
	};
}]);
