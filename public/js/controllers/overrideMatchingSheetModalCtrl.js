'use strict';

angular.module('ace.catalog').controller('overrideMatchingSheetModalCtrl', ['Global', '$scope', '$modalInstance', 'CatalogAPI', '_', 'sheets','wb', function(Global, $scope, $modalInstance, CatalogAPI, _, sheets, wb){

	$scope.init = function(){
		$scope.sheets = sheets;
		$scope.wb = wb;
		$scope.newTypes = [];
		$scope.showEditCode = [];
		$scope.showEditName = [];
		$scope.errorCode = [];
		$scope.errorName = [];
		$scope.doneDisabled = false;
		$scope.newTypes = [];
		CatalogAPI.types.query(function(response){
			$scope.dbTypes = response;
		});
		for(var i in $scope.sheets){
			if($scope.sheets[i].pending){
				$scope.newTypes.push({'code':$scope.sheets[i].sName,'name':$scope.getTypeName($scope.sheets[i])});
				$scope.sheets[i].dName = $scope.sheets[i].sName;
			}else{
				$scope.newTypes.push({});
			}
			$scope.showEditCode.push(false);
			$scope.showEditName.push(false);
			$scope.errorCode.push(false);
			$scope.errorName.push(false);
			$scope.checkNames(i);
			$scope.checkCodes(i);
		}
	};

	$scope.cancel = function(){
		$modalInstance.dismiss('cancel');
	};

	$scope.apply = function(){
		$scope.data = {};
		$scope.data.types = $scope.newTypes;
		$scope.data.sheets = $scope.sheets;
		$modalInstance.close($scope.data);
	};

	$scope.autoSubmitCode = function(e,index){
		if(e.which === 13){
			$scope.checkCodes(index);
		}
	};

	$scope.checkCodes = function(index){
		for(var i in $scope.dbTypes){
			if($scope.dbTypes[i].code && $scope.dbTypes[i].code.toLowerCase() === $scope.newTypes[index].code.toLowerCase().trim()){
				$scope.errorCode[index] = true;
				return;
			}
		}
		for(var j in $scope.newTypes){
			if($scope.newTypes[j].code && $scope.newTypes[index].code){
				if($scope.newTypes[j].code.toLowerCase() === $scope.newTypes[index].code.toLowerCase()  && (parseInt(j) !== parseInt(index))){
					$scope.errorCode[index] = true;
					return;
				}
			}
		}
		$scope.errorCode[index] = false;
		$scope.showEditCode[index] = false;
		if($scope.newTypes[index].code)
			$scope.sheets[index].dName = $scope.newTypes[index].code;
	};

	$scope.autoSubmitName = function(e,index){
		if(e.which === 13){
			$scope.checkNames(index);
		}
	};

	$scope.checkNames = function(index){
		for(var i in $scope.dbTypes){
			if($scope.dbTypes[i].name && $scope.dbTypes[i].name.toLowerCase() === $scope.newTypes[index].name.toLowerCase().trim()){
				$scope.errorName[index] = true;
				return;
			}
		}
		for(var j in $scope.newTypes){
			if($scope.newTypes[j].name && $scope.newTypes[index].name){
			 	if($scope.newTypes[j].name.toLowerCase() === $scope.newTypes[index].name.toLowerCase() && (parseInt(j) !== parseInt(index))){
					$scope.errorName[index] = true;
					return;
				}
			}
		}
		$scope.errorName[index] = false;
		$scope.showEditName[index] = false;
	};

	$scope.getTypeName = function(sheet){
		return $scope.wb.Sheets[sheet.sName].A1.v;
	};

	$scope.$watch('showEditCode',function(){
		for(var i in $scope.showEditCode)
			if($scope.showEditCode[i] === true){
				$scope.doneDisabled = true;
				return;				
			}
		$scope.doneDisabled = false;
	},true);

	$scope.$watch('showEditName',function(){
		for(var i in $scope.showEditName)
			if($scope.showEditName[i] === true){
				$scope.doneDisabled = true;
				return;				
			}
		$scope.doneDisabled = false;
	},true);



}]);