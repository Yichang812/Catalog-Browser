'use strict';

//Schematics service used for Schematic REST endpoint
angular.module('ace.schematic').factory('SchematicsAPI', ['$resource', function($resource) {
    return {
		standardlist: $resource('api/getSchemStds', null, {query: {method: 'GET', isArray: true}, find: {method: 'GET', isArray: false}}),
		children: $resource('api/getChildren/:nodeId', {nodeId: '@_id'}),
		node:$resource('api/getNode/:nodeId', {nodeId:'@_id'}),
		createNode:$resource('api/createNode',null),
		nodeVersion:$resource('/api/getCompVersions',null),
		delete: $resource('api/delete/:nodeId', {nodeId: '@_id'}),
		editComponent: $resource('api/editComponent',null),
		editStd: $resource('api/editStd',null),
		publish:$resource('api/publishComponent',null),
		checkId: $resource('api/isUniqueId',null),
		getAllChildren: $resource('api/getEntireStandard',null, {save: {method: 'POST', isArray: true}}),
		getLinks: $resource('api/getMultiple',null, {query: {method: 'POST', isArray: true}}),
		publishStd: $resource('api/publishStandard',null),
		unpublishStd: $resource('api/unpublishStandard',null)
	};
}]);