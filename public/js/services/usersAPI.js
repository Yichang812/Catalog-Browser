'use strict';

//Users service used for Users REST endpoint
angular.module('ace.users').factory('UsersAPI', ['$resource', function($resource) {
    return {
        userlist: $resource('/api/users/:userId', {userId: '@_id'}, {update: {method: 'GET'}, query: {method: 'GET'}, getall:{method:'POST', isArray:false}}),
		me: $resource('api/users/me', null, {query: {method: 'GET'}}),
		profile: $resource('api/updateCodeName/:codeName', null, {update: {method:'GET'}}),
        addSchemFav: $resource('api/addSchemFav', null, {save: {method: 'POST', isArray: true}}),
        delSchemFav: $resource('api/delSchemFav', null, {save: {method: 'POST', isArray: true}}),
        updateSchemFav: $resource('api/updateSchemFav', null, {save: {method: 'POST', isArray: true}}),
        getFav: $resource('api/getSchemFav', null, {query: {method: 'GET'}}),
        addFilter: $resource('api/addFilter', null, {save: {method: 'POST', isArray: true}}),
        delFilter: $resource('api/delFilter', null, {save: {method: 'POST', isArray: true}}),
        getFilters: $resource('api/getFilters', null, {query: {method: 'POST', isArray: true}}),
        addCatFav: $resource('api/addCatFav', null, {save: {method: 'POST'}}),
        delCatFav: $resource('api/delCatFav', null, {save: {method: 'POST'}}),
        getCatFav: $resource('api/getCatFav', null, {query: {method: 'POST', isArray: true}}),
        addAssociation: $resource('api/addAssociation', null, {save: {method: 'POST', isArray: true}}),
        delAssociation: $resource('api/delAssociation', null, {save: {method: 'POST', isArray: true}}),
        updateAssociation: $resource('api/updateAssociation', null, {save: {method: 'POST', isArray: true}}),
        getAssociations: $resource('api/getAssociations', null, {query: {method: 'GET', isArray: true}}),
        updateUserPrdt: $resource('api/updateUserPrdt', null, {save: {method: 'POST', isArray: false}}),
        updateUserDefPrdt: $resource('api/updateUserDefPrdt/:userDefPrdt', null, {update: {method: 'GET'}})
	};
}]);