'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('filterModalCtrl', function() {
			beforeEach(module('ace'));

			var scope, UploadController, $httpBackend, modalInstance, data, global;

			beforeEach(inject(function($controller, $rootScope, $injector, UsersAPI) {
				
				scope = $rootScope.$new();
				$httpBackend = $injector.get('$httpBackend');
				data = {'filters': {}, 'type': {'name':'Fuses','code':'FU'}, 'search': {}};
				global = {authenticaed: function() {return true;}, user: {catalogFilters: [{name: 'A', filter: {}}, {name: 'B', filter: {}}]}};
				UploadController = $controller('filterModalCtrl', {
					$scope: scope,
					UsersAPI: UsersAPI,
					$modalInstance: modalInstance,
					data: data,
					Global: global
				});
			}));

			afterEach(function() {
					$httpBackend.verifyNoOutstandingExpectation();
					$httpBackend.verifyNoOutstandingRequest();
				});

			it('should start with save button disabled', function(){
				expect(scope.saveDisabled).toEqual(true);
			});

			it('should allow a new filter to pass', function(){
				scope.newFilter.name = 'C';
				scope.validate();
				expect(scope.saveDisabled).toEqual(false);
			});

			it('should not allow a duplicate filter to pass', function(){
				scope.newFilter.name = 'A';
				scope.validate();
				expect(scope.saveDisabled).toEqual(true);
			});

			it('should not allow a filter with no name to pass', function(){
				scope.newFilter.name = '';
				scope.validate();
				expect(scope.saveDisabled).toEqual(true);
			});

			it('should not allow an empty filter to pass', function(){
				scope.newFilter.filter = {};
				scope.validate();
				expect(scope.saveDisabled).toEqual(true);
			});

		});
	});
})();