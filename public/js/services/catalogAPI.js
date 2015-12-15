'use strict';

//Schematics service used for Schematic REST endpoint
angular.module('ace.catalog').factory('CatalogAPI', ['$resource', function($resource) {
    return {
			updateCatalog: $resource('api/updateCatalog',null),
			entries: $resource('api/getEntries', null, {query: {method: 'POST'}}),
			types: $resource('api/getTypes', null, {query:{method:'GET', isArray:true}}),
			fields: $resource('api/getTypeFields', null, {query:{method:'POST', isArray:true}}),
			uniqueValues:$resource('api/getAllUniqueValues',null,{query:{method:'POST', isArray:true}}),
			getEntryById: $resource('api/getEntryById',null),
			updateEntry:$resource('api/updateEntry',null),
			deleteEntry:$resource('api/deleteEntryById',null),
			checkUnique:$resource('api/checkCatUnique',null),

			//------------ For MEP Catalog ------------//
			mepStandards: $resource('api/getMepStandards', null, {query:{method:'GET', isArray:false}}),
			mepStandardCategories: $resource('api/getMepStandardCategories', null, {query: {method: 'POST'}})
		};
}]);