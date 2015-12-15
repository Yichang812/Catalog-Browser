'use strict';

angular.module('ace.schematic').factory('breadcrumbs', ['$resource', function ($resource) {
	var list = [{'title': 'Standards', 'link': '#!/standards'}];
	var breadcrumbs = {
		all : function() {
			return list;
		},
		reset: function() {
			list = [{'title': 'Standards', 'link': '#!/standards'}];
		},
		add : function(parents) {
			this.reset();
			list = list.concat(parents);
		},
		fetch:$resource('api/getParentHiearchy/:nodeId',
							{nodeId: '@_id'})
	};
	return breadcrumbs;
}]);