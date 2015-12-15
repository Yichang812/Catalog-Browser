'use strict';

angular.module('ace.catalog').controller('mepCatalogController', ['CatalogAPI', 'formValidation', 'boxSelect', 'fileTypeEnum','$scope', 'Global', '$modal', '_', '$rootScope', '$cookieStore', function (CatalogAPI, formValidation, boxSelect, fileTypeEnum, $scope, Global, $modal, _, $rootScope, $cookieStore) {
	$scope.global = Global;
	$scope.formValidator = formValidation;
	$scope.boxSelect = boxSelect;
	$scope.fileTypeEnum = fileTypeEnum;
	$scope.invalidUrl = false;
	$scope.errorIcon = [];
	$scope.standardList = ['Global', 'US Imperial', 'US Metric'];  // some default values
	$scope.standardName = {};

	$scope.init = function () {
		$scope.uploadDisabled = true;
		$scope.states = [1,0,0];
		$scope.nextDisabled = true;
		$scope.showAll = false;
		$scope.showAllFields = false;
		$scope.newBeginning = true;
		$scope.folderItems = {};
		$scope.folderItemsList = [];
		$scope.boxFolderName = '';
		$scope.processingBoxFolder = false;
		$scope.validateStatus = '';
		$scope.doneProcessing = false;

		if ($cookieStore.get('standard') !== undefined)
			$scope.standardName.value = $cookieStore.get('standard');
	};

	$scope.redirectAfterSubmit = function() {
		$scope.changeActivePage({'title': 'Manage My Catalog','link': 'views/Catalog/mepManageCatalog.html', fa: 'fa-shopping-cart'});
		$('#submitCatalogAlert').slideDown(400);
        window.setTimeout(function() {
		    $('#submitCatalogAlert').slideUp(400, function(){
		        $(this).hide();
		    });
		}, 2500);
        var ele = document.getElementsByName('inlineRadioOptions');
        for (var i=0;i<ele.length;i++) {
            ele[i].checked = false;
        }
        $scope.uploadOpt = '';
        $scope.standardName.value = null;
        $cookieStore.remove('standard');

        /* initialise the file input field */
        document.getElementById('setFileInput1').className = 'fileinput fileinput-new';
       	document.getElementById('fileInputName1').innerHTML = '';
       	document.getElementById('setFileInput2').className = 'fileinput fileinput-new';
       	document.getElementById('fileInputName2').innerHTML = '';

       	$scope.valid = false;
	};

	$scope.authorized = function() {
		if($scope.global.authenticated && ($scope.global.user.isAdmin || $scope.global.user.isManufacturer))
			return true;
		return false;
	};

    $scope.updateStandardInput = function(standard) {
    	$scope.standardName.value = standard;
    	$cookieStore.put('standard', $scope.standardName.value);
    };

	$scope.toggleShowAll = function(number){
		if(number === 1)
			$scope.showAll = !$scope.showAll;
		if(number === 2)
			$scope.showAllFields = !$scope.showAllFields;
	};

	$scope.fileSelect = function($files) {
		var check = $scope.formValidator.checkFileExtension($files[0]?$files[0].name:'', ['xml']);
		if(check.result)
		{
			$scope.newBeginning = true;
			$scope.uploadDisabled = false;
			$scope.file = $files[0];
		}
		$scope.showAll = false;
		$scope.showAllFields = false;
		$scope.success = check.suc_message;
		$scope.valid = check.result;
		$scope.error = check.err_message;
		$scope.sendingFlag = false;
		$scope.sendingSuccess = false;
	};

	$scope.populate = function() {
		$scope.populateProgress = 0;
		$scope.parsingXLS = true;
		var reader = new FileReader();
		reader.onload = function(){
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(reader.result,'text/xml');
			$scope.getXmlData(xmlDoc);
			$scope.newBeginning = false;
			$scope.parsingXLS = false;
			$scope.$apply();
		};
		reader.readAsText($scope.file);
	};

	$scope.getXmlData = function(xmlDoc) {
		function getXmlInformation(tableName) {
			var infoArray = [];
			for (var i=0; i<tableName.length; i++) {
				var impInfo = {
					name: tableName[i].attributes.name.value,
					desc: tableName[i].attributes.desc.value,
					dataType: tableName[i].attributes.dataType.value,
					unit: tableName[i].attributes.unit.value,
					id: tableName[i].attributes.id.value,
					context: tableName[i].attributes.context.value,
					visible: tableName[i].attributes.visible.value,
					index: tableName[i].attributes.index.value
				};
				if (impInfo.desc === 'Part Domain') {
					$scope.category = tableName[i].innerHTML.substring(0, tableName[i].innerHTML.indexOf('_'));
				}
				if (impInfo.desc === 'Part Name') {
					$scope.partName = tableName[i].innerHTML;
				}
				var extraInfo = [];
				for (var j=0; j<tableName[i].childNodes.length; j++) {
					if (tableName[i].childNodes[j].localName === 'Item') {
						var itemInfo = {
							id: tableName[i].childNodes[j].id,
							value: tableName[i].childNodes[j].textContent
						};
						extraInfo.push(itemInfo);
					} else if (tableName[i].childNodes[j].localName === 'Row') {
						var rowInfo = {
							id: tableName[i].childNodes[j].id,
							value: tableName[i].childNodes[j].textContent
						};
						extraInfo.push(rowInfo);
					}
				}
				impInfo.extraInfo = extraInfo;
				infoArray[i] = impInfo;
			}
			return infoArray;
		}

		function getUniqueRows(column) {
			var rowInfo = {
				desc: column[0].attributes[0].value,
				dataType: column[0].attributes[1].value,
				name: column[0].attributes[2].value,
				visible: column[0].attributes[3].value
			};
			var rows = [];
			for (var i=0; i<column[0].childNodes.length; i++) {
				if (column[0].childNodes[i].localName === 'RowUnique') {
					var itemInfo = {
						id: column[0].childNodes[i].id,
						value: column[0].childNodes[i].textContent
					};
					rows.push(itemInfo);
				}
			}
			rowInfo.rows = rows;
			return rowInfo;
		}

		$scope.imagePath = xmlDoc.getElementsByTagName('ColumnConstView')[0].childNodes[1].childNodes[1].childNodes[1].attributes[1].value;
		$scope.dwgPath = xmlDoc.getElementsByTagName('ColumnConstView')[0].childNodes[3].innerHTML;
		$scope.basicTableUniqueColumn = [];
		$scope.basicTable = [];
		$scope.constListTable = [];
		$scope.constTable = [];
		$scope.calcTable = [];
		if (xmlDoc.getElementsByTagName('Column')[0] !== undefined) {
			$scope.basicTable = xmlDoc.getElementsByTagName('Column');
			$scope.basicTableUniqueColumn = xmlDoc.getElementsByTagName('ColumnUnique');
			$scope.basicTableUniqueColumn = getUniqueRows($scope.basicTableUniqueColumn);
		}
		if (xmlDoc.getElementsByTagName('ColumnConstList')[0] !== undefined)
			$scope.constListTable = xmlDoc.getElementsByTagName('ColumnConstList');
		if (xmlDoc.getElementsByTagName('ColumnConst')[0] !== undefined)
			$scope.constTable = xmlDoc.getElementsByTagName('ColumnConst');
		if (xmlDoc.getElementsByTagName('ColumnCalc')[0] !== undefined)
			$scope.calcTable = xmlDoc.getElementsByTagName('ColumnCalc');

		$scope.basicTable = getXmlInformation($scope.basicTable);
		$scope.constListTable = getXmlInformation($scope.constListTable);
		$scope.constTable = getXmlInformation($scope.constTable);
		$scope.calcTable = getXmlInformation($scope.calcTable);

		if ($scope.uploadOpt === 'fromBox')
			$scope.attachDwgAndBmp();

		var entries = {
			name: $scope.partName,
			category: $scope.category,
			dwgPath: $scope.dwgPathUrl,
			bmpPath: $scope.imagePathUrl,
			uniqueColumn: $scope.basicTableUniqueColumn,
			basicTable: $scope.basicTable,
			constListTable: $scope.constListTable,
			constTable: $scope.constTable,
			calcTable: $scope.calcTable
		};

		$scope.entries = entries;

		$scope.startProcessing();
	};

	$scope.attachDwgAndBmp = function() {
		$scope.imagePath = $scope.imagePath.substring($scope.imagePath.lastIndexOf('\\') + 1);
		$scope.dwgPath = $scope.dwgPath.substring($scope.dwgPath.lastIndexOf('\\') + 1);

		for (var key in $scope.folderItemsList) {
			if (key === $scope.imagePath.toLowerCase()) {
				$scope.imagePathUrl = $scope.folderItemsList[key];
			}
			else if (key === $scope.dwgPath.toLowerCase())
				$scope.dwgPathUrl = $scope.folderItemsList[key];
		}
	};

	$scope.submit = function() {
		$scope.populate();
	};

	$scope.startProcessing = function() {
		var json_obj = {};
		var product = 'MEP';
		json_obj[product] = {title: $scope.standardName.value, entries: $scope.entries};
		$scope.submitDisabled = true;
		$scope.sendingFlag = true;
		CatalogAPI.updateCatalog.save({data: json_obj}, function(response) {
			if(response)
			{
				$scope.sendingFlag = false;
				$scope.sendingSuccess = true;
			}
		});

		$scope.init();
		$scope.redirectAfterSubmit();
	};

	$scope.boxAuth = function() {
		var client_id = '31apwtezizoqz84wqfz8api4wqkqrl5v';
        var url = 'https://www.box.com/api/oauth2/authorize?response_type=code&client_id=' + client_id + '&output=embed';

        window.location.replace(url);
	};

	$scope.boxFolderPicker = function() {

		function makeAjaxCall(response) {
			$.ajax({
	            url : 'https://api.box.com/2.0/folders/' + response[0].id + '/items',
	            type: 'GET',
	            data: {access_token: $rootScope.accessToken.access_token},
	            contentType: 'application/x-www-form-urlencoded',
	            success:function(data)
	            {
	                console.log('Success');
	                $scope.folderItems = data;
	                parseBoxFolder();
	            },
	            error: function(errorThrown)
	            {
	                console.log('Failure');
	                console.log(errorThrown);
	            }
	        });
		}

		$scope.boxSelect.launchPopup();

		$scope.boxSelect.success(function(response) {
			$scope.executeOnBoxSuccess(response);

			if ($scope.processingBoxFolder)
				makeAjaxCall(response);
		});

		$scope.boxSelect.cancel(function() {
			console.log('The user clicked cancel or close the popup');
		});
	};

	$scope.executeOnBoxSuccess = function(response) {
		if (response[0].type !== 'folder') {
			$scope.folderError = true;
			$scope.errorMsg = 'Please choose a valid box folder.';
			$scope.processingBoxFolder = false;
		}
		else {
			$scope.folderError = false;
			$scope.validateStatus = 'Validating box contents...';
			$scope.processingBoxFolder = true;
		}

		$scope.$apply(function() {
			//wrapped this within $apply to update view faster
			$scope.boxFolderName = response[0].name;
		});
	};

	$scope.clearBoxFolderInput = function() {
		$scope.boxFolderName = '';
		$scope.validateStatus = '';
		$scope.processingBoxFolder = false;
		$scope.doneProcessing = false;
	};	

	var parseBoxFolder = function() {
		$scope.itemsParsed = 0;
		for (var i=0; i<$scope.folderItems.total_count; i++) {
			if ($scope.folderItems.entries[i].type === 'file') {// && ($scope.folderItems.entries[i].name.indexOf('.ipt') > -1 || $scope.folderItems.entries[i].name.indexOf('.dwg') > -1 )) {
				$.ajax({
		            url : 'https://api.box.com/2.0/files/' + $scope.folderItems.entries[i].id,
		            type: 'GET',
		            data: {access_token: $rootScope.accessToken.access_token},
		            contentType: 'application/x-www-form-urlencoded',
		            success: ajaxSuccess,
		            error: ajaxError
		        });
	        } else
	        	$scope.itemsParsed++;	
		}
	};

	var ajaxSuccess = function(data) {
		$scope.itemsParsed++;
        $scope.folderItemsList[data.name.toLowerCase()] = data.shared_link.download_url;

        if ($scope.itemsParsed >= $scope.folderItems.total_count) {
        	$scope.$apply(function() {
	        	$scope.processingBoxFolder = false;
	        	$scope.doneProcessing = true;
	        	$scope.validateStatus = 'Box contents validated.';
        	});
        }
	};

	var ajaxError = function(errorThrown) {
        console.log('Failure');
        console.log(errorThrown);
	};

	$scope.isEmptyRow = function(index) {
		if(typeof $scope.footprintWithURL[index] === 'object') {
			if(Object.keys($scope.footprintWithURL[index]).length === 0 && Object.keys($scope.symbol3DWithURL[index]).length === 0) {
				return true;
			}
			else {
				return false;
			}
		}
	};

	$scope.checkValidUrl = function(index,cell,array) {
		if (array === 'footprint')
			array = $scope.footprintWithURL;
		else if (array === 'symbol3d')
			array = $scope.symbol3DWithURL;

		//becomes undefined when the input field becomes empty after being changed
		if (array[index][cell] === undefined) {
			array[index][cell] = '';
		}

		//no error icons on the page
		if (array[index][cell] === '' && $scope.errorIcon.length === 0) {
			$scope.invalidUrl = false;
		}
		//the current input value is neither a link nor empty
		else if ((array[index][cell].indexOf('http://') < 0 && array[index][cell].indexOf('https://') < 0) && array[index][cell] !== '') {
			var object = {index: index, cell: cell};
			if ($scope.errorIcon.length === 0) {
				$scope.errorIcon.push(object);
				$scope.invalidUrl = true;
			} else {
				var matching = 0;
				for (var i=0; i<$scope.errorIcon.length; i++) {
					if ($scope.errorIcon[i].index === index && $scope.errorIcon[i].cell === cell) {
						matching = 1;
						break;
					}
				}
				if (!matching) {
					$scope.errorIcon.push(object);
					$scope.invalidUrl = true;
				}
			}
		}
		else {
			//the current input value either contains a link or is empty
			if ((array[index][cell].indexOf('http://') > -1 || array[index][cell].indexOf('https://') > -1) || array[index][cell] === '') {
				for (var j=0; j<$scope.errorIcon.length; j++) {
					if ($scope.errorIcon[j].index === index && $scope.errorIcon[j].cell === cell) {
						$scope.errorIcon.splice(j, 1);				//remove the particular error icon from array
						break;
					}
				}
				if ($scope.errorIcon.length === 0) {
					$scope.invalidUrl = false;
				}
			}
		}
	};

	$scope.isInvalidUrl = function(inputUrl) {
		if (inputUrl !== undefined && inputUrl !== '') {
			if (inputUrl.indexOf('http://') > -1 || inputUrl.indexOf('https://') > -1)
				return false;
			else
				return true;
		}
		else 
			return false;
	};

	$scope.showLinkIcons = function(subform, cell, parentIndex, array, icon) {
		if(array === 'footprint')
			array = $scope.footprintWithURL;
		else if (array === 'symbol3d')
			array = $scope.symbol3DWithURL;

		if (icon === 'question')
			return ((!subform) || $scope.isInvalidUrl(array[parentIndex][cell]));
		else if (icon === 'success')
			return (subform || $scope.isInvalidUrl(array[parentIndex][cell]));
		else
			return $scope.isInvalidUrl(array[parentIndex][cell]);
	};
}]);