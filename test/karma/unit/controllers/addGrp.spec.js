'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('AddGrpFormCtrl', function() {
		// Load the controllers module
			beforeEach(module('ace'));

			var scope, UploadController, Service, $httpBackend, modalInstance,parent;

			beforeEach(inject(function($controller, $rootScope, $injector, SchematicsAPI) {
				
				scope = $rootScope.$new();
				Service = SchematicsAPI;
				$httpBackend = $injector.get('$httpBackend');
				$httpBackend.when('GET', 'api/getChildren/1').respond(200,{'children': [{'name': 'PB','id':'M0'}, {'name': 'Switch','id':'M1'}]});
				$httpBackend.when('GET','http://invalid.bmp').respond(302);
				parent = { 'name' :'IEEE: Solenoids', 'parentNode' : '53168932e8f493000024bc4a', 'id' : 'M24', 'standard' : '53168932e8f493000024bc49', '_id' : '1', 'isComposite' : true, 'dl' : null, 'acad360l' : null, 'thumbnail' : 'https://dl.dropboxusercontent.com/s/t1mrbs8ijos53gr/s_sv.bmp', '__v' : 0 };

				UploadController = $controller('addGrpFormCtrl', {
					$scope: scope,
					SchematicsAPI: Service,
					$modalInstance:modalInstance,
					parent:parent
				});
			}));

			afterEach(function() {
					$httpBackend.verifyNoOutstandingExpectation();
					$httpBackend.verifyNoOutstandingRequest();
				});
			
			it('ensures repetitive component name are caught', function(){
				var names = ['Pb','PB','SwitcH'];
				var ids = ['1', '2', '3'];
				for (var index in names){
					var name = names[index];
					scope.target.name = name;
					scope.target._id = ids[index];
					scope.checkName();
					$httpBackend.flush();
					expect(scope.valid.name).not.toEqual(true);
				}
			});

			it('ensures add is enabled only when name, id, dl, thumbnail are all valid', function() {
				expect(scope.createDisabled).toEqual(true);
				scope.valid.name = true;
				expect(scope.createDisabled).toEqual(true);
				scope.valid.id = true;
				expect(scope.createDisabled).toEqual(true);
				scope.valid.thumbnail = true;
				scope.$apply();
				expect(scope.createDisabled).not.toEqual(true);
			});

			it('ensures valid component name passes validation', function(){
				var names = ['SomethingNew','Sth New', 'Sth: New'];
				for (var index in names){
					var name = names[index];
					scope.target.name = name;
					scope.checkName();
					$httpBackend.flush();
					expect(scope.valid.name).toEqual(true);
				}
			});

			it('ensures ids are checked on the server side',function(){
				scope.target.id = 'M0';
				$httpBackend.expectPOST('api/isUniqueId').respond(200, {unique: true});
				scope.checkId();
				$httpBackend.flush();
				expect(scope.valid.id).toEqual(true);
			});

			it('ensures non-bmp file link to thumbnail files are caught',function(){
				var thumbnails = ['https://dl.dropboxusercontent.com/s/rx4be2kya1bxu38/_np_nt.dat'];
				for (var tn in thumbnails){
					scope.target.thumbnail = thumbnails[tn];
					scope.validateThumbnail();
					expect(scope.valid.thumbnail).not.toEqual(true);
				}
			});

			it('ensures broken linkes to thumbnail files are caught', function(){
				var thumbnail = 'public/invalid.bmp';
				$httpBackend.whenGET(thumbnail).respond(302, '');
				scope.target.thumbnail = thumbnail;
				scope.validateThumbnail();
				$httpBackend.flush();
				expect(scope.valid.thumbnail).not.toEqual(true);
			});

			it('ensures valid link to thumbnail passes validation',function(){
				$httpBackend.whenGET('public/valid.bmp').respond(200, '');
				var thumbnail = 'public/valid.bmp';
				scope.target.thumbnail = thumbnail;
				scope.validateThumbnail();
				$httpBackend.flush();
				expect(scope.valid.thumbnail).toEqual(true);
			});

		});
	});
})();