'use strict';


angular.module('ace', ['ngCookies', 'luegg.directives', 'angularFileUpload' , 'ngResource', 'ngRoute', 'ui.bootstrap', 'ui.route', 'ace.system', 'ace.users', 'ace.schematic', 'ace.catalog', 'underscore', 'angulartics', 'angulartics.google.analytics']);

angular.module('ace.system', []);
angular.module('ace.schematic', []);
angular.module('ace.catalog', ['ngAnimate', 'ui.select']);
angular.module('ace.users', []);
angular.module('underscore', []);
