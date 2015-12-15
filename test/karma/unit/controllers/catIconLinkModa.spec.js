'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('catIconLinkModalCtrl', function() {
		// Load the controllers module
			beforeEach(module('ace'));

			var scope, $httpBackend, $modalInstance, item, Global, _, linkController;

			beforeEach(inject(function($controller, $rootScope, $injector, SchematicsAPI, UsersAPI) {
				
				scope = $rootScope.$new();
				$httpBackend = $injector.get('$httpBackend');
				$httpBackend.when('GET', 'api/getSchemStds').respond(200,[{'name':'JIC','_id':'a'},{'name':'IEEE','_id':'b'}]);
				$httpBackend.when('POST','api/getEntireStandard').respond(200,[{'_id':'3','parentNode':'parent1','standard':'JIC','name':'item1','isComposite':true},{'_id':'4','parentNode':'parent2','standard':'JIC','name':'item2','isComposite':false}]);

				item = [{'_id':'1', 'catalog':'0123'},{'_id':'2','catalog':'1234'}];

				linkController = $controller('catIconLinkModalCtrl', {
					$scope: scope,
					$modalInstance: $modalInstance,
					item:item
				});				
			}));

			afterEach(function() {
					$httpBackend.verifyNoOutstandingExpectation();
					$httpBackend.verifyNoOutstandingRequest();
			});

			it('should show the list of standards by default', function($timeout){
				$httpBackend.expectGET('api/getSchemStds');
				$httpBackend.expectPOST('api/getEntireStandard');
				scope.init();
				waitsFor(function(){
					return scope.stds;
				},'stds is initiated', 1000);
				runs(function(){
					expect(scope.stds.length).toEqual(2);
				});
				$httpBackend.flush();
			});

			it('should get the searchable content when a standard is selected', function(){
				$httpBackend.expectGET('api/getSchemStds');
				$httpBackend.expectPOST('api/getEntireStandard');
				scope.init();
				waitsFor(function(){
					return scope.typeAheadValues;
				},'stds is initiated', 1000);
				runs(function(){
					expect(scope.typeAheadValues[0]._id).toEqual('4');
				});
				$httpBackend.flush();
			});

			it('should show the immediate children of the selected standard on the next column on click', function(){
				$httpBackend.expectGET('api/getSchemStds');
				$httpBackend.expectPOST('api/getEntireStandard');
				scope.init();
				var option = {'name':'IEEE','_id':'b'}
				scope.selectStandard(option);
				waitsFor(function(){
					return scope.selectedStd;
				},'scope.levels is loaded',1000);
				runs(function(){
					expect(scope.levels.length).toEqual(2);
					expect(scope.levels[1].levelNumber).toEqual(1);
				});
				$httpBackend.flush();
			});


			it('should remove the excess columns if another item is selected', function(){
				$httpBackend.expectGET('api/getSchemStds');
				$httpBackend.expectPOST('api/getEntireStandard');
				scope.init();
				var option = {'name':'IEEE','_id':'b','parentNode':null};
				scope.selectOption(0, option);
				waitsFor(function(){
					return scope.selectedStd;
				},'scope.levels is loaded',1000);
				runs(function(){
					var item = {'_id':'3','parentNode':'1','isComposite':true};					
					scope.selectOption(1,item);
					waitsFor(function(){
						return scope.levels;
					},'scope.levels not initiated',1000);
					runs(function(){
						expect(scope.levels.length).toEqual(3);
					});
					
				});
				$httpBackend.flush();
			});
				
				

			it('should set the search criteria to the selected standard', function(){
				$httpBackend.expectGET('api/getSchemStds');
				$httpBackend.expectPOST('api/getEntireStandard');
				scope.init();
				var option = {'name':'IEEE','_id':'b'}
				scope.selectStandard(option);
				waitsFor(function(){
					return scope.selectedStd;
				},'scope.levels is loaded',1000);
				runs(function(){
					expect(scope.typeAheadValues[0].standard).toEqual('JIC');
				});
				$httpBackend.flush();
			});


			it('should disable the link if no leaf node is selected', function(){
				$httpBackend.expectGET('api/getSchemStds');
				$httpBackend.expectPOST('api/getEntireStandard');
				scope.init();
				var option = {'name':'IEEE','_id':'b'}
				scope.selectStandard(option);
				waitsFor(function(){
					return scope.selectedStd;
				},'scope.levels is loaded',1000);
				runs(function(){
					expect(scope.linkDisabled).toEqual(true);
				});
				$httpBackend.flush();
			});

			it('should enable the link if a leaf node is selected', function(){
				$httpBackend.expectGET('api/getSchemStds');
				$httpBackend.expectPOST('api/getEntireStandard');
				scope.init();
				var option = {'name':'IEEE','_id':'b','parentNode':null,'isComposite':true};
				scope.selectOption(0, option);
				waitsFor(function(){
					return scope.selectedStd;
				},'scope.levels is loaded',1000);
				runs(function(){
					var item = {'_id':'3','parentNode':'1','isComposite':false};					
					scope.selectOption(1,item);
					scope.$apply();
					expect(scope.linkDisabled).toEqual(false);	
				});
				$httpBackend.flush();
			});

			it('should enable the link if a node is selected from search', function(){
				$httpBackend.expectGET('api/getSchemStds');
				$httpBackend.expectPOST('api/getEntireStandard');
				scope.init();
				scope.selectedItem = {'_id':'d'};
				scope.$apply();
				expect(scope.linkDisabled).toEqual(false);
				$httpBackend.flush();
			});

		});
	});
})();