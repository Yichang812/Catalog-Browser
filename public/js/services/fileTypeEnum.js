'use strict';

angular.module('ace.catalog').factory('fileTypeEnum', function () {
	var fileTypeEnum = {
		footprint : 0,
  		symbol3d : 1
	};

	return fileTypeEnum;
});