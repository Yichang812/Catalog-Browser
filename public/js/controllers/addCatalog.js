'use strict';

angular.module('ace.catalog').controller('catalogController', ['CatalogAPI', 'formValidation', 'boxSelect', 'fileTypeEnum','$scope', 'Global', '$modal', '_', '$rootScope', function (CatalogAPI, formValidation, boxSelect, fileTypeEnum, $scope, Global, $modal, _, $rootScope) {
	$scope.global = Global;
	$scope.formValidator = formValidation;
	$scope.boxSelect = boxSelect;
	$scope.xls = window.XLS;
	$scope.xlsx = window.XLSX;
	$scope.fileTypeEnum = fileTypeEnum;
	$scope.invalidUrl = false;
	$scope.errorIcon = [];

	$scope.init = function () {
		$scope.uploadDisabled = true;
		$scope.states = [1,0,0];
		$scope.sheets = [];
		$scope.processedSheets = [];
		$scope.nextDisabled = true;
		$scope.showAll = false;
		$scope.showAllFields = false;
		$scope.newBeginning = true;
		$scope.sheetTitle = 'A1';
		$scope.title_row = 2;
		$scope.symbol3DWithURL = [];
		$scope.footprintWithURL = [];
		$scope.folderItems = {};
		$scope.folderItemsList = [];
		$scope.boxFolderName = '';
		$scope.processingBoxFolder = false;
		$scope.validateStatus = '';
		$scope.doneProcessing = false;
	};

	$scope.redirectAfterSubmit = function() {
		$scope.changeActivePage({'title': 'Manage My Catalog','link': 'views/Catalog/manageCatalog.html', fa: 'fa-shopping-cart'});
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

        /* initialise the file input field */
        document.getElementById('setFileInput1').className = 'fileinput fileinput-new';
       	document.getElementById('fileInputName1').innerHTML = '';
       	document.getElementById('setFileInput2').className = 'fileinput fileinput-new';
       	document.getElementById('fileInputName2').innerHTML = '';

       	$scope.valid = false;
	};

	$scope.showConfigureModal = function () {
		var modalInstance = $modal.open({
			templateUrl: 'views/Catalog/configureXlsModal.html',
			controller: 'configureXlsModalCtrl',
			resolve: {
				data: function () {
					return {
						title: $scope.sheetTitle,
						column_row: $scope.title_row
					};
				}
			}
		});
		modalInstance.result.then(function(result){
			if(result){
				$scope.newBeginning = true;
				$scope.title_row = result.fields;
				$scope.sheetTitle = result.title;
			}
		});
	};

	$scope.authorized = function() {
		if($scope.global.authenticated && ($scope.global.user.isAdmin || $scope.global.user.isManufacturer))
			return true;
		return false;
	};

	$scope.toggleShowAll = function(number){
		if(number === 1)
			$scope.showAll = !$scope.showAll;
		if(number === 2)
			$scope.showAllFields = !$scope.showAllFields;
	};

	$scope.isPending = function(sheet){
		if(!$scope.showAll)
			return (sheet.pending);
		return true;
	};

	$scope.sheetSorted = function(sheet){
		/*The sheets are ordered in this order:
		1)Pending sheets are always on the top;
		2)Matched sheets at the bottom (if shown);
		3)Untrack does not affect the order
		4)Within each, the order is by sName, aphabetical.
		*/
		var weight = sheet.pending ? 0 : 1;
		return weight + sheet.sName;
	};

	$scope.fileSelect = function($files) {
		var check = $scope.formValidator.checkFileExtension($files[0]?$files[0].name:'', ['xls']);
		if(check.result)
		{
			$scope.newBeginning = true;
			$scope.uploadDisabled = false;
			$scope.file = $files[0];
			$scope.sheets = [];
			$scope.processedSheets = [];
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
			var wb = $scope.xls.read(reader.result, {type: 'binary'});
			$scope.wb = wb;
			$scope.getSheets();
			$scope.states[1] = 1;
			$scope.states[0] = 0;
			$scope.newBeginning = false;
			$scope.parsingXLS = false;
			$scope.$apply();
		};
		reader.readAsBinaryString($scope.file);
	};

	$scope.getSheets = function(){
		var wb = $scope.wb;
		if($scope.processedSheets.length > 0)
			return;
		$scope.sheets = [];
		for(var j in wb.Sheets)
		{
			var single = wb.Sheets[j];

			var all_keys = _.keys(single);
			for(var i = 0; i < all_keys.length; i++)
			{
				var cell = all_keys[i];
				var matches = cell.match(/\d+$/);
				if(matches)
				{
					var number = matches[0];
					number = parseInt(number, 10);
					if(number > $scope.title_row)
					{
						$scope.sheets.push(j);
						break;
					}
				}
			}
		}
		$scope.matchSheets($scope.sheets);
	};

	$scope.matchSheets = function(sheets){
		if(sheets.length === 0)
		{
			$scope.success = null;
			$scope.valid = false;
			$scope.error = 'No sheets found in the workbook';
			return;
		}
		$scope.types = [];
		$scope.typeCodes = [];
		var processedSheet = null;
		CatalogAPI.types.query(function(response){
			$scope.types = response;
			for(var i in response){
				if(response[i].code)
					$scope.typeCodes.push(response[i].code);
			}
			$scope.original_types = [];
			for(var k in $scope.typeCodes)
				$scope.original_types.push($scope.typeCodes[k]);
			for (var j in sheets){
				if($scope.typeCodes.indexOf(sheets[j]) > -1)
					processedSheet = {'sName':sheets[j],'dName':sheets[j]};
				else
					processedSheet = {'sName':sheets[j],'pending':true};
				$scope.processedSheets.push(processedSheet);
			}
		});
	};

	$scope.showOverrideMatchSheetModal = function(){
		var modalInstance = $modal.open({
			templateUrl: 'views/Catalog/overrideMatchingSheetModal.html',
			controller: 'overrideMatchingSheetModalCtrl',
			resolve:{
				sheets: function(){
					return $scope.processedSheets;
				},
				wb: function(){
					return ($scope.wb);
				}
			}
		});
		modalInstance.result.then(function(data){
			for(var i in data.types)
				if(data.types[i].code){
					$scope.typeCodes.push(data.types[i].code);
					$scope.types.push(data.types[i]);
				}
			$scope.processedSheets = data.sheets;
		});
	};

	$scope.matchFields = function(){
		var wb = $scope.wb;
		var count = -1;
		for(var i in wb.Sheets){
			count++;
			var sheet_flag= false;
			for(var j in $scope.processedSheets){
				if($scope.processedSheets[j].sName === wb.SheetNames[count] && $scope.processedSheets[j].dName && !$scope.processedSheets[j].unTrack){
					sheet_flag = true;
					$scope.processedSheets[j].pendingFields = 0;
					$scope.processedSheets[j].unTrackedFields = [];
					break;
				}
			}
			if(sheet_flag){
				var sheet = wb.Sheets[i];
				var cols = [];
				var column = 'A';
				var col_flag = true;
				var column_titles_row = $scope.title_row.toString();
				while(col_flag){
					if(!sheet[column+column_titles_row] || !sheet[column+column_titles_row].w)
					{
						col_flag = false;
						break;
					}
					var column_title = sheet[column+column_titles_row].w;
					if(cols.indexOf(column_title) < 0)
						cols.push(column_title);
					column = $scope.getNextColumnToRead(column.split(''));
					if(!column)
					{
						col_flag = false;
						break;
					}
				}
				$scope.match_field(j, cols);
			}
		}
	};

	$scope.match_field = function (j, cols)
	{
		var std_fields = [];
		var compulsory_fields = ['catalog','manufacturer'];
		var compulsory_fields_flag = 0;
		if($scope.original_types.indexOf($scope.processedSheets[j].dName) > -1){
			CatalogAPI.fields.query({type:$scope.processedSheets[j].dName},function(response){
				for(var k in response){
					var std_field = _.values(response[k]).join('');
					if(std_field.indexOf('additionalInfo') > -1)
						std_field = std_field.substr(15);
					std_fields.push(std_field);
				}
				k = 0;
				$scope.processedSheets[j].fields = [];
				for (k in cols){
					var fieldMatchPair = [];
					if(std_fields.indexOf(cols[k].toLowerCase()) > -1){
						fieldMatchPair.push(cols[k]);
						fieldMatchPair.push(std_fields[std_fields.indexOf(cols[k].toLowerCase())]);
						if(compulsory_fields.indexOf(cols[k].toLowerCase()) > -1){
							compulsory_fields_flag++;
						}

					}else{
						fieldMatchPair.push(cols[k]);
						fieldMatchPair.push('');
						$scope.processedSheets[j].pendingFields++;
					}
					$scope.processedSheets[j].fields.push(fieldMatchPair);
				}
				$scope.processedSheets[j].pendingFields += (compulsory_fields.length - compulsory_fields_flag);
			});
		}
		else{
			$scope.processedSheets[j].fields = [];
			for (var k in cols){
				var fieldMatchPair = [];
				fieldMatchPair.push(cols[k]);
				fieldMatchPair.push(cols[k]);
				$scope.processedSheets[j].pendingFields++;
				$scope.processedSheets[j].fields.push(fieldMatchPair);
			}
		}
	};

	$scope.isSheetPendingByFields = function(sheet){
		if($scope.showAllFields) return sheet.dName && (!sheet.unTrack);
		return (sheet.pendingFields !== 0) && sheet.dName && (!sheet.unTrack);
	};

	$scope.countPendingByFields = function(){
		var count = 0;
		for(var i in $scope.processedSheets){
			var sheet = $scope.processedSheets[i];
			if(sheet.pendingFields !== 0 && sheet.dName && (!sheet.unTrack))
				count++;
		}
		return count;
	};

	$scope.sheetSortedByPendingFields = function(sheet){
		var weight = sheet.pendingFields !== 0 ? 0 : 1;
		return weight + sheet.sName;
	};

	$scope.isFieldPending = function(field){
		return field[1] === '';
	};
	
	$scope.showMatchFieldsModal = function(sheet){
		var modalInstance = $modal.open({
			templateUrl: 'views/Catalog/matchFieldsModal.html',
			controller: 'matchFieldsModalCtrl',
			resolve:{
				sheet: function() {
					return (sheet);
				},
				dbTypes: function(){
					return $scope.original_types;
				}
			}
		});
		modalInstance.result.then(function(response){
			for(var i in $scope.processedSheets){
				if($scope.processedSheets[i].sName === response.sName)
					$scope.processedSheets[i] = response;
			}
		});
	};

	$scope.overrideMatchingFields = function(){
		var compulsory_fields = ['catalog','manufacturer'];
		for(var i in $scope.processedSheets){
			var flag = 0;
			if($scope.original_types.indexOf($scope.processedSheets[i].dName) < 0){
				$scope.processedSheets[i].pendingFields = 0;
				for(var j in $scope.processedSheets[i].fields)
					if(compulsory_fields.indexOf($scope.processedSheets[i].fields[j][0].toLowerCase()) > -1)
						flag ++;
				$scope.processedSheets[i].pendingFields += compulsory_fields.length - flag;
			}
		}
	};

	$scope.toggleTrackingSheet = function(sheet){
		for(var j in $scope.processedSheets){
			if($scope.processedSheets[j].sName === sheet.sName){
				$scope.processedSheets[j].unTrack = !$scope.processedSheets[j].unTrack;
				$scope.processedSheets[j].dName = null;
			}
		}
	};

	$scope.showTypesModal = function(sheet) {
		if(!$scope.global.user.isAdmin)
			return;
		var modalInstance = $modal.open({
			templateUrl: 'views/Catalog/addCustomTypeModal.html',
			controller: 'addCustomTypeModalCtrl',
			resolve: {
				data: function() {
					return {
						types: $scope.types,
						sheets: $scope.sheets,
						current: sheet,
						firstName: ($scope.wb.Sheets[sheet.sName]? ($scope.wb.Sheets[sheet.sName][$scope.sheetTitle]? $scope.wb.Sheets[sheet.sName][$scope.sheetTitle].w: ''): '')
					};
				}
			}
		});
		modalInstance.result.then(function(){
			$scope.typeCodes = [];
			for (var i = 0; i < $scope.types.length; i++) {
				$scope.typeCodes.push($scope.types[i].code);
			}
		});
		return;
	};

	$scope.$watch('processedSheets', function(){
		if($scope.processedSheets.length !== 0)
		{
			for(var i in $scope.processedSheets)
				if((!$scope.processedSheets[i].dName) && (!$scope.processedSheets[i].unTrack)){
					$scope.nextDisabled = true;
					return;
				}
			$scope.nextDisabled = false;
			return;
		}
		$scope.nextDisabled = true;
	},true);

	$scope.$watch('processedSheets', function(){
		if($scope.processedSheets.length !== 0)
		{
			for(var i in $scope.processedSheets)
				if($scope.processedSheets[i].pendingFields !== 0 && (!$scope.processedSheets[i].unTrack)){
					$scope.submitDisabled = true;
					return;
				}
			$scope.submitDisabled = false;
			return;
		}
		$scope.submitDisabled = true;
	},true);

	$scope.populateArrayWithUrl = function(newCell, index, array) {
		if (array[index][newCell] === undefined && newCell !== '') {
			array[index][newCell.toLowerCase()] = '';
		}
	};

	$scope.getCellData = function() {
		var wb = $scope.wb;
		var user = $scope.global.user;

		function checkAuthority(manufacturerEntry)
		{
			return user.isAdmin? true: (user.codeName.toLowerCase() === manufacturerEntry.toLowerCase());
		}
		function invalid_man() {
			return 'The codename in your profile does not match the manufacturer field in the sheet '+key+'.';
		}
		function getSheetToBeProcessed(sheetName)
		{
			for(var i = 0; i< $scope.processedSheets.length; i++)
			{
				if($scope.processedSheets[i].sName === sheetName)
				{
					return $scope.processedSheets[i];
				}
			}
			return null;
		}
		function getMatchingColumn(key, fields) {
			if(!fields || !key)
				return null;
			fields = _.object(fields);
			var newTitle = _.has(fields, key)? fields[key]: null;
			return newTitle;
		}
		function getAttributeUrl(array) {
			for (var s=0; s<array.length; s++) {
				for (var key in array[s]) {
					if ($scope.folderItemsList[key] !== undefined) {
						array[s][key] = $scope.folderItemsList[key];
					}
				}
			}
		}

		var count = 0;

		$scope.totalSheetNo = $scope.processedSheets.length;
		var sheetsToSend = _.map($scope.processedSheets, function(object) {
			if(object.unTrack)
				return null;
			return object.sName? object.sName: null;
		});
		for (var j=0 ; j < sheetsToSend.length ; j++) {
			var key = sheetsToSend[j];
			var sheetToProcess = getSheetToBeProcessed(key);
			count ++;
			var sheet, sheet_data, row_data, columnFlag, rowFlag, column, row;
			$scope.symbol3DWithURL[j] = {};
			$scope.footprintWithURL[j] = {};
			if(wb.Sheets.hasOwnProperty(key))
			{
				sheet = wb.Sheets[key];
				sheet_data = [];
				row_data = {};
				columnFlag = true;
				rowFlag = true;
				column = 'A';
				var column_titles_row = $scope.title_row.toString();
				row = $scope.title_row + 1;
				while(rowFlag)
				{
					if(!sheet['A'+row.toString()] || !sheet['A'+row.toString()].w)
					{
						rowFlag = false;
						break;
					}
					while(columnFlag)
					{
						if(!sheet[column+column_titles_row] || !sheet[column+column_titles_row].w)
						{
							columnFlag = false;
							break;
						}
						var column_title = sheet[column+column_titles_row].w;
						if(!row_data[column_title.toLowerCase()])
						{
							var newCell = sheet[column+row.toString()]?sheet[column+row.toString()].w: '';
							if(column_title.toLowerCase() === 'manufacturer' && newCell !== '')
							{
								if(!checkAuthority(newCell))
								{
									$modal.open({
										templateUrl: 'views/errorAlertModal.html',
										controller: 'errorAlertModalCtrl',
										resolve: {
											message: invalid_man
										}
									});
									return;
								}
							}
							var updated_column_title = getMatchingColumn(column_title, sheetToProcess.fields);
							if(updated_column_title)
								row_data[updated_column_title.toLowerCase()] = newCell;

							if (column_title === 'SYMBOL3D')
							{
								$scope.populateArrayWithUrl(newCell, j, $scope.symbol3DWithURL);
							}

							if (column_title === 'FOOTPRINT')
							{
								$scope.populateArrayWithUrl(newCell, j, $scope.footprintWithURL);	
							}
						}

						column = $scope.getNextColumnToRead(column.split(''));
						if(!column)
						{
							columnFlag = false;
							break;
						}
					}
					columnFlag = true;
					column = 'A';
					row+=1;
					if(row_data)
					{
						sheet_data.push(row_data);
					}
					row_data = {};
				}
				sheet_data = [];
			}
		}

		getAttributeUrl($scope.footprintWithURL);//getFootprintUrl();
		getAttributeUrl($scope.symbol3DWithURL);//get3DSymbolUrl();
	};

	$scope.startProcessing = function() {
		var wb = $scope.wb;
		var user = $scope.global.user;

		function checkAuthority(manufacturerEntry)
		{
			return user.isAdmin? true: (user.codeName.toLowerCase() === manufacturerEntry.toLowerCase());
		}
		function invalid_man() {
			return 'The codename in your profile does not match the manufacturer field in the sheet '+key+'.';
		}
		function getSheetToBeProcessed(sheetName)
		{
			for(var i = 0; i< $scope.processedSheets.length; i++)
			{
				if($scope.processedSheets[i].sName === sheetName)
				{
					return $scope.processedSheets[i];
				}
			}
			return null;
		}
		function getMatchingColumn(key, fields) {
			if(!fields || !key)
				return null;
			fields = _.object(fields);
			var newTitle = _.has(fields, key)? fields[key]: null;
			return newTitle;
		}
		function getTypeName(typeCode) {
			for (var i = 0; i < $scope.types.length; i++) {
				if($scope.types[i].code.toLowerCase() === typeCode.toLowerCase())
				{
					return $scope.types[i].name;
				}
			}
			return null;
		}
		function appendAttribute(row_data, array, identifier) {
			var attribute = '';

			switch (identifier) {
				case $scope.fileTypeEnum.footprint:
					attribute = row_data.footprint;
					break;
				case $scope.fileTypeEnum.symbol3d:
					attribute = row_data.symbol3d;
					break;
				default:
					break;
			}

			for (var j=0; j<array.length; j++) {
				for (var footprintName in array[j]) {
					if (attribute.toLowerCase() === footprintName) {
						/* if URL exist, append the url to the front of the icon's name, separated by comma */
						if (array[j][footprintName].indexOf('http') > -1)
							attribute = array[j][footprintName].toLowerCase() + ',' + attribute;
						break;
					}
				}
			}
			
			return attribute;
		}

		var json_obj = {};

		var count = 0;

		$scope.totalSheetNo = $scope.processedSheets.length;
		var sheetsToSend = _.map($scope.processedSheets, function(object) {
			if(object.unTrack)
				return null;
			return object.sName? object.sName: null;
		});
		for (var j=0 ; j < sheetsToSend.length ; j++) {
			var key = sheetsToSend[j];
			var sheetToProcess = getSheetToBeProcessed(key);
			count ++;
			var sheet, sheet_data, row_data, columnFlag, rowFlag, column, row;
			if(wb.Sheets.hasOwnProperty(key))
			{
				sheet = wb.Sheets[key];
				sheet_data = [];
				row_data = {};
				columnFlag = true;
				rowFlag = true;
				column = 'A';
				var column_titles_row = $scope.title_row.toString();
				row = $scope.title_row + 1;
				while(rowFlag)
				{
					if(!sheet['A'+row.toString()] || !sheet['A'+row.toString()].w)
					{
						rowFlag = false;
						break;
					}
					while(columnFlag)
					{
						if(!sheet[column+column_titles_row] || !sheet[column+column_titles_row].w)
						{
							columnFlag = false;
							break;
						}
						var column_title = sheet[column+column_titles_row].w;
						if(!row_data[column_title.toLowerCase()])
						{
							var newCell = sheet[column+row.toString()]?sheet[column+row.toString()].w: '';
							//A manufacturer can only upload items under his own name
							if(column_title.toLowerCase() === 'manufacturer' && newCell !== '')
							{
								if(!checkAuthority(newCell))
								{
									$modal.open({
										templateUrl: 'views/errorAlertModal.html',
										controller: 'errorAlertModalCtrl',
										resolve: {
											message: invalid_man
										}
									});
									return;
								}
							}
							var updated_column_title = getMatchingColumn(column_title, sheetToProcess.fields);
							if(updated_column_title)
								row_data[updated_column_title.toLowerCase()] = newCell;
						}
						column = $scope.getNextColumnToRead(column.split(''));
						if(!column)
						{
							columnFlag = false;
							break;
						}
					}
					columnFlag = true;
					column = 'A';
					row+=1;
					if(row_data) 
					{
						if (row_data.hasOwnProperty('footprint'))
							row_data.footprint = appendAttribute(row_data, $scope.footprintWithURL, $scope.fileTypeEnum.footprint);

						if (row_data.hasOwnProperty('symbol3d'))
							row_data.symbol3d = appendAttribute(row_data, $scope.symbol3DWithURL, $scope.fileTypeEnum.symbol3d);

						sheet_data.push(row_data);
					}
					row_data = {};
				}
				json_obj[sheetToProcess.dName? sheetToProcess.dName: key] = {title: (sheetToProcess.dName? getTypeName(sheetToProcess.dName): (sheet[[$scope.sheetTitle]]? sheet[$scope.sheetTitle].w: '')), entries: sheet_data};
				sheet_data = [];
			}
		}
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

	$scope.countPending = function() {
		var count = 0;
		for(var i in $scope.processedSheets)
		{
			if((!$scope.processedSheets[i].dName) && (!$scope.processedSheets[i].unTrack)){
				count++;
			}
		}
		return count;
	};

	$scope.getNextColumnToRead = function(column)
	{
		var length = column.join('').length;
		function repeatChar(count, ch) {
			if (count === 0) {
				return '';
			}
			var count2 = count / 2;
			var result = ch;
			while (result.length <= count2) {
				result += result;
			}
			var finalResult = result + result.substring(0, count - result.length);
			return finalResult;
		}
		function getNextAlphabet(char) {
			return String.fromCharCode(char.charCodeAt(0)+1);
		}
		var endString = repeatChar(length, 'Z');
		if(column.join('') === endString)
			return repeatChar(length+1, 'A');
		if(column[length - 1] === 'Z')
		{
			var index = 1;
			while(length >= index && column[length - index] === 'Z')
			{
				column[length-index] = 'A';
				if(length > index && column[length-index-1] === 'Z')
				{
					index++;
				}
				else
				{
					column[length-index-1] = getNextAlphabet(column[length-index-1]);
					break;
				}
			}
		}
		else
		{
			column[length-1] = getNextAlphabet(column[length-1])[0];
		}
		return column.join('');
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
	        }	
		}
	};

	var ajaxSuccess = function(data) {
		$scope.itemsParsed++;
        console.log('Success');
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