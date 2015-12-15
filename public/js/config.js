'use strict';


//Setting up route and client interceptor
angular.module('ace').config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
        when('/', {
            templateUrl: (window.exec === undefined)? 'views/index.html':'views/Desktop/d_index.html'
        }).
        when('/profile', {
            templateUrl: (window.exec === undefined)? 'views/profile.html':'views/Desktop/d_profile.html'
        }).
        when('/standards', {
            templateUrl: (window.exec === undefined)? 'views/Schematics/all.html':'views/Desktop/d_Schematics_all.html'
        }).
        when('/catalog', {
            templateUrl: (window.exec === undefined)? 'views/Catalog/catalogList.html':'views/Desktop/d_Catalog_catalogList.html'
        }).
        when('/catalog/:filterName', {
            templateUrl: (window.exec === undefined)? 'views/Catalog/catalogList.html':'views/Desktop/d_Catalog_catalogList.html'
        }).
        when('/standards/:nodeId', {
            templateUrl: (window.exec === undefined)? 'views/Schematics/child.html':'views/Desktop/d_Schematics_child.html'
        }).
        when('/mep-catalog', {
            templateUrl: (window.exec === undefined)? 'views/Catalog/mepCatalogList.html':'views/Desktop/d_Catalog_catalogList.html'
        }).
        when('/mep-catalog/:filterName', {
            templateUrl: (window.exec === undefined)? 'views/Catalog/mepCatalogList.html':'views/Desktop/d_Catalog_catalogList.html'
        }).
        when('/acadmep', {
            templateUrl: 'views/mepIndex.html'
        }).
        otherwise({
            redirectTo: '/'
        });
    }
]).run(function(Global, $rootScope, $location) {
    // register listener to watch route changes
    $rootScope.$on('$locationChangeStart', function() {
        var path = $location.$$path;//function(event, next, current)
        if (Global.authenticated === false) {
        // no logged user, can still browse the schematics
            if (path === '/' || path.substring(0, 10) === '/standards' || path.substring(0, 8) === '/catalog' || path.substring(0, 12) === '/mep-catalog') {
                return;
            } else {
                // not going to #login, we should redirect now
                $location.path('/');
            }
        }
    });
});

//Setting HTML5 Location Mode
angular.module('ace').config(['$locationProvider',
    function($locationProvider) {
        $locationProvider.hashPrefix('!');
    }
]);

//Setting up interceptor
angular.module('ace').config(['$httpProvider',
    function($httpProvider) {
        function Interceptor($q) {
            function success(response) {
                return response;
            }
            function error(response) {
                var status = response.status;
                if(status === 401) {
                    window.location = '/';
                }
                else if(status === 400) {
                    window.alert(response.data.error);
                }
                return $q.reject(response); //similar to throw response;
            }
            return function(promise) {
                return promise.then(success, error);
            };
        }
        $httpProvider.responseInterceptors.push(Interceptor);
    }
]);


