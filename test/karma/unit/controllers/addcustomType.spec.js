'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('addCustomTypeModalCtrl', function() {
			beforeEach(module('ace'));

			var scope, UploadController, $httpBackend, modalInstance, data;

			beforeEach(inject(function($controller, $rootScope, $injector) {
				
				scope = $rootScope.$new();
				$httpBackend = $injector.get('$httpBackend');
				data = {types: [{code: 'FU1',name:'ABCD'}], sheets: [], current: {dName: null, sName: 'FU'}, firstName: 'ABCD'};

				UploadController = $controller('addCustomTypeModalCtrl', {
					$scope: scope,
					$modalInstance: modalInstance,
					data: data
				});
			}));

			afterEach(function() {
					$httpBackend.verifyNoOutstandingExpectation();
					$httpBackend.verifyNoOutstandingRequest();
				});

			it('should start with add button disabled', function(){
				expect(scope.addDisabled).toEqual(true);
			});

			it('should be disabled with empty type code', function(){
				scope.newType.code= '';
				scope.checkCode();
				expect(scope.addDisabled).toEqual(true);
			});

			it('should be disabled with empty type name', function(){
				scope.newType.name = '';
				scope.checkName();
				expect(scope.addDisabled).toEqual(true);
			});

			it('should be disabled with duplicate type code', function(){
				scope.newType.code = 'FU1';
				scope.checkCode();
				expect(scope.addDisabled).toEqual(true);
			});

			it('should be disabled with duplicate type name', function(){
				scope.newType.name = 'ABCD';
				scope.checkName();
				expect(scope.addDisabled).toEqual(true);
			});

			it('should be enabled with valid new type', function(){
				scope.newType.name = 'AEFQW';
				scope.checkName();
				scope.newType.code = 'FU';
				scope.checkCode();
				expect(scope.validated).toEqual({name: true, code: true});
			});

		});
	});
})();