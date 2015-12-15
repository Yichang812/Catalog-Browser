'use strict';

// service for setting navigation bar tabs based on product selected
angular.module('ace.system').service('navBarMenu', ['$cookieStore', function ($cookieStore) {
    var userDefinedPrdt;
	var product;
	var menuItems;
	var firstItemLink;
	var updatedURL;
	var userDefined = false;

	function updateValues() {
		// if on desktop plugin, only show product specific menu items
	    if(window.exec !== undefined) {
	        if ($cookieStore.get('product') !== undefined)
	            product = $cookieStore.get('product');
	        else {
	            if (document.URL.indexOf('ACE') > -1)
	                product = 'ACE';
	            else if (document.URL.indexOf('ACM') > -1)
	                product = 'ACM';
	            else if (document.URL.indexOf('ACA') > -1) 
	                product = 'ACA';
	            else if (document.URL.indexOf('ACADMEP') > -1)
	                product = 'ACADMEP';
	        }
	    }
		else {
			// if user has set a default product, override cookie value
			if (userDefined)
				product = userDefinedPrdt; 
			else if ($cookieStore.get('setProduct') !== undefined) 
				product = $cookieStore.get('setProduct');
		}

		// TODO: Assign correct menu items according to each specific product
		if (product === 'AutoCAD Electrical' || product === 'ACE') 
			menuItems = [{'title': 'Icon Browser','link': 'standards'}, {'title': 'Catalog Browser','link': 'catalog'}];
		else if (product === 'AutoCAD MEP' || product === 'ACADMEP')
			menuItems = [{'title': 'Catalog Browser','link': 'mep-catalog'}];
		else if (product === 'AutoCAD Mechanical' || product === 'ACM')
			menuItems = [{'title': 'Icon Browser','link': 'standards'}, {'title': 'Catalog Browser','link': 'catalog'}];
		else if (product === 'AutoCAD Architecture' || product === 'ACA')
			menuItems = [{'title': 'Icon Browser','link': 'standards'}, {'title': 'Catalog Browser','link': 'catalog'}];
		else
			menuItems = [];

		userDefined = false;
		return menuItems;
	}
	
	this.menu = updateValues();
	this.updatedURL = '';

	this.updateMenu = function() {
		this.menu = updateValues();
	};

	this.updateURL = function() {
		// assign the first item's link 
		firstItemLink = menuItems[0].link;
		updatedURL = firstItemLink;
		return updatedURL;
	};

	this.useDefault = function(productName) {
		userDefined = true;
		userDefinedPrdt = productName;
		this.menu = updateValues();
	};

}]);