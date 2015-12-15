'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('editItemFormCtrl', function() {
		// Load the controllers module
			beforeEach(module('ace'));

			var scope, Ctrl, $httpBackend, modalInstance,item, fakeModal;

			beforeEach(inject(function($controller, $rootScope, $injector, CatalogAPI, $modal) {
				
				scope = $rootScope.$new();
				item = {'_id':'1'};
				$httpBackend = $injector.get('$httpBackend');
				$httpBackend.when('POST','api/getEntryById').respond(200,{'_id':'1','catalog':'cat','manufacturer':'man','type':{'name':'Fuses','code':'FU'},'additionalInfo.type':'something'});
				$httpBackend.when('GET','api/getTypes').respond(200,[{'name':'fuses','code':'FU'}]);				
				spyOn($modal, 'open').andReturn(fakeModal);
				Ctrl = $controller('editItemFormCtrl', {
					$scope: scope,
					CatalogAPI: CatalogAPI,
					$modalInstance:modalInstance,
					item:item
				});

				fakeModal = {
					result: {
						then: function(confirmCallback, cancelCallback) {
							this.confirmCallBack = confirmCallback;
							this.cancelCallback = cancelCallback;
						}
					},
					close: function(result) {
						this.result.confirmCallBack(result);
					},
					dismiss: function(result) {
						this.result.cancelCallback(result);
					}
				};
			}));

			afterEach(function() {
					$httpBackend.verifyNoOutstandingExpectation();
					$httpBackend.verifyNoOutstandingRequest();
				});

			it('should load all information on item from database',function(){
				$httpBackend.expectPOST('api/getEntryById');
				$httpBackend.expectGET('api/getTypes');
				scope.init();
				$httpBackend.flush();
				expect(scope.item._id).toBe('1');			
			});

			it('should launch confirmation modal if type is changed', function(){
				$httpBackend.expectPOST('api/getEntryById');
				$httpBackend.expectGET('api/getTypes');
				scope.init();
				$httpBackend.flush();
				$httpBackend.expect('POST','api/getTypeFields').respond(200, [{'1':'additionalInfo.something'}]);
				scope.selectedType = {type:{'name':'SU','code':'SU'}};
				scope.confirmTypeChange();
				scope.modalInstance.close(true);
				$httpBackend.flush();
				expect(scope.additionalInfo[0]).toEqual(['something',null]);
			});

			it('should disable the done button if nothing is changed',function(){
				$httpBackend.expectPOST('api/getEntryById');
				$httpBackend.expectGET('api/getTypes');
				scope.init();
				$httpBackend.flush();
				expect(scope.doneDisabled).toEqual(true);
			});

			it('should disable the done button if catalog number is empty', function(){
				$httpBackend.expectPOST('api/getEntryById');
				$httpBackend.expectGET('api/getTypes');
				scope.init();
				$httpBackend.flush();
				scope.item.catalog = '';
				scope.checkUnique(true);
				expect(scope.doneDisabled).toEqual(true);
			});

			it('should disabled the done button if the item is not unique', function(){
				$httpBackend.expectPOST('api/getEntryById');
				$httpBackend.expectGET('api/getTypes');
				scope.init();
				$httpBackend.flush();
				$httpBackend.when('POST','api/checkCatUnique').respond(200,{'unique':false});
				$httpBackend.expectPOST('api/checkCatUnique');
				scope.checkUnique(true);
				$httpBackend.flush();
				expect(scope.doneDisabled).toEqual(true);
			});

			it('should enable the done button if information is changed and item is unique',function(){
				$httpBackend.expectPOST('api/getEntryById');
				$httpBackend.expectGET('api/getTypes');
				scope.init();
				$httpBackend.flush();
				scope.item['additionalInfo.type'] = 'something';
				scope.checkUnique(false);
				expect(scope.doneDisabled).toEqual(false); 
			});


		});
	});
})();