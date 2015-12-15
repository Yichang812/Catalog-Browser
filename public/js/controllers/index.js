'use strict';

angular.module('ace.system').controller('IndexController', ['$scope', 'Global', '$rootScope', '$cookieStore', '$location', 'navBarMenu', function ($scope, Global, $rootScope, $cookieStore, $location, navBarMenu) {
    $scope.global = Global;
    $scope.nav_menu = [];
    $scope.showSide = true;
    $scope.selected = null;
    $rootScope.accessToken = {};
    $scope.productList = Global.prdtList;
    $scope.menu = navBarMenu;
    
    // DECLARE EACH PRODUCT DETAILS AND ASSIGN TO $scope.prdt accordingly
    // We can store this in database or as global variable, and assign the variable accordingly based on the product type
    // Also need to update product description
    $scope.ACA = {
    	name: 'AutoCAD Architecture',
    	imgURL: '../img/aca.jpg',
    	content1_heading: 'Access the latest arhitectural content online',
    	content1_subHeading: 'Free and easy access to the power of cloud.',
    	content1_text: 'The online library provides you with the updated collection of architectural objects and catalog information.',
    	content2_heading: 'Manage your personalised library',
    	content2_subHeading: 'Take it with you everywhere with the Online Content Library.',
    	content2_text: 'Customize your own library with your favourite objects and catalogs, and download content easily to use within AutoCAD Architecture.'
    };
    $scope.ACE = {
    	name: 'AutoCAD Electrical',
    	imgURL: '../img/ace.jpg',
    	content1_heading: 'Access the latest electrical content online',
    	content1_subHeading: 'Free and easy access to the power of cloud.',
    	content1_text: 'The online library provides you with the updated collection of electrical symbols and catalog information.',
    	content2_heading: 'Manage your personalised library',
    	content2_subHeading: 'Take it with you everywhere with the Online Content Library.',
    	content2_text: 'Customize your own library with your favourite symbols and link relations, and download content easily to use within AutoCAD Electrical.'
    };
    $scope.ACM = {
    	name: 'AutoCAD Mechanical',
    	imgURL: '../img/acm.jpg',
    	content1_heading: 'Access the latest mechanical content online',
    	content1_subHeading: 'Free and easy access to the power of cloud.',
    	content1_text: 'The online library provides you with the updated collection of mechanical content libraries and standard parts information.',
    	content2_heading: 'Manage your personalised library',
    	content2_subHeading: 'Take it with you everywhere with the Online Content Library.',
    	content2_text: 'Customize your own library with your favourite libraries and parts, and download content easily to use within AutoCAD Mechanical.'
    };
    $scope.ACADMEP = {
    	name: 'AutoCAD MEP',
    	imgURL: '../img/acad-mep.jpg',
    	content1_heading: 'Access the latest content online',
    	content1_subHeading: 'Free and easy access to the power of cloud.',
    	content1_text: 'The online library provides you with the updated collection of mechanical, electrical and plumbing components and catalog information.',
    	content2_heading: 'Manage your personalised library',
    	content2_subHeading: 'Take it with you everywhere with the Online Content Library.',
    	content2_text: 'Customize your own library with your favourite lists, and download content easily to use within AutoCAD MEP.'
    };
    $scope.ACAD = {
        name: 'AutoCAD Vertical Products',
        imgURL: '../img/acad.jpg',
        content1_heading: 'Access the latest product content online',
        content1_subHeading: 'Free and easy access to the power of cloud.',
        content1_text: 'The online library provides you with the updated collection of components and catalog information for each supported AutoCAD vertical product.',
        content2_heading: 'Manage your personalised library',
        content2_subHeading: 'Take it with you everywhere with the Online Content Library.',
        content2_text: 'Customize your own library with your favourite lists, and download content easily to use within your AutoCAD product.'
    };

    function post(path, params) {
        $.ajax({
            url : path,
            type: 'POST',
            data: params,
            contentType: 'application/x-www-form-urlencoded',
            success:function(data)
            {
                console.log('Success');
                $rootScope.accessToken = data;
            },
            error: function(errorThrown)
            {
                console.log('Failure');
                console.log(errorThrown);
            }
        });
    }

    if ($cookieStore.get('setProduct') !== undefined)
        $scope.chosenProduct = $cookieStore.get('setProduct');
    else
        $scope.chosenProduct = 'Choose a Product';

    if (window.exec === undefined) {
        $scope.prdt = $scope.ACAD;
    }

    if (window.exec !== undefined) {
		if ($cookieStore.get('product') === 'ACE') {
			$scope.prdt = $scope.ACE;
		} else if ($cookieStore.get('product') === 'ACM') {
			$scope.prdt = $scope.ACM;
		} else if ($cookieStore.get('product') === 'ACA') {
			$scope.prdt = $scope.ACA;
		} else if ($cookieStore.get('product') === 'ACADMEP') {
			$scope.prdt = $scope.ACADMEP;
		} else {
			if (document.URL.indexOf('ACE') > -1) {
				$cookieStore.put('product', 'ACE');
		    	$scope.prdt = $scope.ACE;
		    } else if (document.URL.indexOf('ACM') > -1) {
		    	$cookieStore.put('product', 'ACM');
		    	$scope.prdt = $scope.ACM;
		    } else if (document.URL.indexOf('ACA') > -1) {
		    	$cookieStore.put('product', 'ACA');
		    	$scope.prdt = $scope.ACA;
		    } else if (document.URL.indexOf('ACADMEP') > -1) {
		    	$cookieStore.put('product', 'ACADMEP');
		    	$scope.prdt = $scope.ACADMEP;
		    }
		}
	}

    // if user is signed in, set favourites page link address based on user product
    if ($scope.global.authenticated) {
        if (Global.user.userDefPrdt === 'AutoCAD MEP') {
            $scope.favLinkPage = 'mepFavourites.html';
            $scope.manageCatalog = 'mepManageCatalog.html';
        }
        else {
            $scope.favLinkPage = 'favourites.html';
            $scope.manageCatalog = 'manageCatalog.html';
        }
    }

	if($scope.global.authenticated)
	{	
		// if desktop plugin, show only user favourites to user
		if (window.exec !== undefined) {
			$scope.nav_menu.push({'title': 'My Libraries','link': 'views/Desktop/d_favourites.html', fa: 'fa-star'});
			$scope.selected = {'title': 'My Libraries','link': 'views/Desktop/d_favourites.html', fa: 'fa-star'};
		}
		else {
			$scope.nav_menu.push({'title': 'My Libraries','link': 'views/'+$scope.favLinkPage , fa: 'fa-star'});
			if($scope.global.user.isManufacturer === true || Global.user.isAdmin === true)
			{
				$scope.nav_menu.push({'title': 'Manage My Catalog','link': 'views/Catalog/'+$scope.manageCatalog, fa: 'fa-shopping-cart'});
				$scope.selected = {'title': 'Manage My Catalog','link': 'views/Catalog/'+$scope.manageCatalog, fa: 'fa-shopping-cart'};
			}
			if($scope.global.user.isAdmin === true)
			{
				$scope.nav_menu.push({'title': 'Manage Users','link': 'views/Users/list.html', fa: 'fa-user'});
				$scope.selected = {'title': 'My Libraries','link': 'views/'+$scope.favLinkPage, fa: 'fa-star'};
			}
			if(!$scope.global.user.isAdmin && !$scope.global.user.isManufacturer)
			{
				$scope.selected = {'title': 'My Libraries','link': 'views/'+$scope.favLinkPage, fa: 'fa-star'};
			}

			var current_url = document.URL;
	 
	        if (current_url.indexOf('code') > -1) {
	            var index = current_url.indexOf('code');

	            var client_id = '31apwtezizoqz84wqfz8api4wqkqrl5v';
	            var client_secret = 'pLxXqX32MsPD7DwvXaSGVbau9l7VRTDE';

	            var code = current_url.substring(index+5, index+37);

	            var url = 'https://app.box.com/api/oauth2/token';

	            post(url, {grant_type: 'authorization_code', redirect_uri: 'https://localhost:3000', client_id: client_id, client_secret: client_secret, code: code});

	            $scope.selected = {'title': 'Manage My Catalog','link': 'views/Catalog/'+$scope.manageCatalog, fa: 'fa-shopping-cart'};
	        }

	        if (current_url.indexOf('error') > -1) {
	        	$scope.selected = {'title': 'Manage My Catalog','link': 'views/Catalog/'+$scope.manageCatalog, fa: 'fa-shopping-cart'};
	        }
	    }	
	}

	$scope.$on('changeUserStatus', function() {
		$scope.nav_menu = [];
		if($scope.global.authenticated)
		{
			$scope.nav_menu.push({'title': 'My Libraries','link': 'views/'+$scope.favLinkPage, fa: 'fa-star'});
			if($scope.global.user.isManufacturer === true || Global.user.isAdmin === true)
			{
				$scope.nav_menu.push({'title': 'Manage the Catalog','link': 'views/Catalog/'+$scope.manageCatalog, fa: 'fa-shopping-cart'});
				$scope.selected = {'title': 'Manage the Catalog','link': 'views/Catalog/'+$scope.manageCatalog, fa: 'fa-shopping-cart'};
			}
			if($scope.global.user.isAdmin === true)
			{
				$scope.nav_menu.push({'title': 'Manage Users','link': 'views/Users/list.html', fa: 'fa-user'});
				$scope.selected = {'title': 'My Libraries','link': 'views/'+$scope.favLinkPage, fa: 'fa-star'};
			}
			if(!$scope.global.user.isAdmin && !$scope.global.user.isManufacturer)
			{
				$scope.selected = {'title': 'My Libraries','link': 'views/'+$scope.favLinkPage, fa: 'fa-star'};
			}
		}
	});

	$scope.changeActivePage = function(item) {
		$scope.selected = item;
	};

    $scope.updateProduct = function(updateName) {
        $scope.chosenProduct = updateName;
        $('#setProduct').html($scope.chosenProduct+' <span class="caret pull-right" style="margin-top:9px;"></span>');
    };

    $scope.updateNavBar = function() {
        $cookieStore.put('setProduct', $scope.chosenProduct);
        $scope.menu = navBarMenu.updateMenu();
        $scope.nextURL = navBarMenu.updateURL();
        $location.url($scope.nextURL);
    };
}]);