'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('matchFieldsModalCtrl', function() {
		// Load the controllers module
			beforeEach(module('ace'));

			var scope, Ctrl, $httpBackend, modalInstance, sheet, dbTypes;

			beforeEach(inject(function($controller, $rootScope, $injector, CatalogAPI) {
				
				scope = $rootScope.$new();
				sheet = {'sName':'FU','dName':'FU','fields':[['catalog','catalog'],['manufacturer','manufacturer'],['type','type']],'pendingFields':1};
				dbTypes = ['FU'];
				$httpBackend = $injector.get('$httpBackend');
				$httpBackend.when('POST','api/getTypeFields').respond(200,[{'1':'catalog'},{'1':'manufacturer'},{'1':'type'},{'1':'else'}]);				
				Ctrl = $controller('matchFieldsModalCtrl', {
					$scope: scope,
					$modalInstance:modalInstance,
					CatalogAPI: CatalogAPI,
					sheet:sheet,
					dbTypes:dbTypes
				});

			}));

			afterEach(function() {
					$httpBackend.verifyNoOutstandingExpectation();
					$httpBackend.verifyNoOutstandingRequest();
				});

			it('should ensure each field in database is only matched once',function(){
				scope.sheet = {'sName':'FU','dName':'FU','fields':[['catalog','catalog'],['manufacturer','manufacturer'],['type','type']],'pendingFields':1};
				var cat = ['catalogNo','catalog'];
				scope.checkUniqueMatch(cat);
				expect(cat[1]).toEqual('error');

			});

			it('should ensure the submit button is disabled if not all mandatory fields are present',function(){
				$httpBackend.expectPOST('api/getTypeFields');
				scope.init();
				scope.sheet.fields = [['manufacturer','manufacturer'],['type','type']];
				$httpBackend.flush();
				expect(scope.doneEnabled).toEqual(false);		
			});

			it('should ensure the submit button is disabled if not all fields are matched',function(){
				$httpBackend.expectPOST('api/getTypeFields');
				scope.init();
				scope.sheet.fields = [['catalog','catalog'],['manufacturer','manufacturer'],['type','type'],['something','']];
				$httpBackend.flush();
				expect(scope.doneEnabled).toEqual(false);
			});


		});
	});
})();