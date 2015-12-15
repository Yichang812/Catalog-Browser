'use strict';

angular.module('ace.catalog').controller('matchFieldsModalCtrl', ['$scope', '$modalInstance', 'sheet', 'dbTypes','CatalogAPI', '_',function($scope, $modalInstance, sheet, dbTypes, CatalogAPI, _){
	$scope.sheet = sheet;
	$scope.doneEnabled = false;
	$scope.init = function(){
		$scope.std_fields = [];
		if(dbTypes.indexOf(sheet.dName) > -1){
			CatalogAPI.fields.query({type:sheet.dName},function(response){
				angular.forEach(response,function(field){
					var processedField = _.values(field).join('');
					processedField = processedField.indexOf('additionalInfo.') > -1 ? processedField.substr(15) : processedField;
					if($scope.std_fields.indexOf(processedField) < 0)
						$scope.std_fields.push(processedField);
					else
						$scope.std_fields.push(processedField+'(2)');
				});
			});
			$scope.newType = false;
			return;
		}
		$scope.newType = true;
	};



	$scope.sortedFields = function(field){
		var weight = field[1] === '' ? 0 : 1;
		return weight + field[0];
	};


	$scope.checkUniqueMatch = function(field){
		for(var i = 0; i < sheet.fields.length; i ++)
			if(field[1] === sheet.fields[i][1] && field[0] !== sheet.fields[i][0]){
				field[1] = 'error';
				return;
			}

	};

	$scope.toggleTrackField = function(field,sheet){
		for(var i in sheet.fields){
			if(sheet.fields[i][0] === field){
				if(sheet.fields[i][2] === true)
					sheet.fields[i].splice(2);
				else
					sheet.fields[i].push(true);
			}
		}
	};

	$scope.$watch('sheet.fields',function(){
		for(var i in $scope.sheet.fields)
			if ($scope.sheet.fields[i][1] === 'error' || $scope.sheet.fields[i][1] === ''){
				$scope.doneEnabled = false;
				return;
			}
		var manFields= ['catalog','MANUFACTURER'];
		$scope.flag = 0;
		for(var j in manFields){
			for(var k in $scope.sheet.fields){
				if(manFields[j].toLowerCase() === $scope.sheet.fields[k][1].toLowerCase())
					$scope.flag ++;
			}
				
		}
		if($scope.flag < 2){
			$scope.doneEnabled = false;
			return;
		}
		$scope.doneEnabled = true;
	},true);

	$scope.apply = function(){
		$scope.sheet.pendingFields = 0;
		for(var i in $scope.sheet.fields){
			if($scope.sheet.fields[i][2])
				$scope.sheet.unTrackedFields[i] = true;
		}
		$modalInstance.close($scope.sheet);
	};
	$scope.cancel = function(){
		$modalInstance.dismiss('user cancelled');
	};
}]);