'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('EditCompFormCtrl', function() {
		// Load the controllers module
			beforeEach(module('ace'));

			var scope, UploadController, Service, $httpBackend, modalInstance,target;

			beforeEach(inject(function($controller, $rootScope, $injector, SchematicsAPI) {
				
				scope = $rootScope.$new();
				Service = SchematicsAPI;
				$httpBackend = $injector.get('$httpBackend');
				$httpBackend.when('GET', 'api/getChildren/1').respond(200,{'children': [{'name': 'PB','id':'M0'}, {'name': 'Switch','id':'M1'}]});
				target = { 'name' :'IEEE: Solenoids', 'parentNode' : '2', 'id' : 'M24', 'standard' : '53168932e8f493000024bc49', '_id' : '1', 'isComposite' : true, 'dl' : null, 'acad360l' : null, 'thumbnail' : 'https://dl.dropboxusercontent.com/s/t1mrbs8ijos53gr/s_sv.bmp', '__v' : 0 };

				UploadController = $controller('editCompFormCtrl', {
					$scope: scope,
					SchematicsAPI: Service,
					$modalInstance:modalInstance,
					target:target
				});
			}));

			afterEach(function() {
					$httpBackend.verifyNoOutstandingExpectation();
					$httpBackend.verifyNoOutstandingRequest();
				});

			it('ensures repetitive component name are caught', function(){
				var names = ['Pb','PB','SwitcH'];
				for (var index in names){
					var name = names[index];
					scope.target.name = name;
					scope.target._id = '1';
					$httpBackend.expectGET('api/getChildren').respond(200,{'children': [{'name': 'PB','_id':'M0'}, {'name': 'Switch','_id':'M1'}]});
					scope.checkName();
					$httpBackend.flush();
					expect(scope.valid.name).not.toEqual(true);
				}
			});

			it('ensures valid component name passes validation', function(){
				var names = ['SomethingNew','Sth New', 'Sth: New'];
				for (var index in names){
					var name = names[index];
					scope.target.name = name;
					scope.target._id = '1';
					$httpBackend.expectGET('api/getChildren').respond(200,{'children': [{'name': 'PB','_id':'M0'}, {'name': 'Switch','_id':'M1'}]});
					scope.checkName();
					$httpBackend.flush();
					expect(scope.valid.name).toEqual(true);
				}
			});

			it('ensures the original name passes validation', function(){
				scope.target.name = scope.origin.name;
				scope.checkName();
				expect(scope.valid.name).toEqual(true);
			});

			it('ensures ids are checked on the server side',function(){
				scope.target.id = 'M0';
				$httpBackend.expectPOST('api/isUniqueId').respond(200 );
				scope.checkId();
				$httpBackend.flush();
			});

			it('ensures the original id passes validation',function(){
				scope.target.id = scope.origin.id;
				scope.checkId();
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

			it('ensures broken links to thumbnail files are caught', function(){
				$httpBackend.expectGET('http://invalid.bmp').respond(302, '');
				var thumbnail = 'http://invalid.bmp';
				scope.target.thumbnail = thumbnail;
				scope.validateThumbnail();
				$httpBackend.flush();
				expect(scope.valid.thumbnail).not.toEqual(true);
			});

			it('ensures valid link to thumbnail passes validation',function(){
				$httpBackend.expectGET('http://www.abcd.com/valid.bmp').respond(200, '');
				var thumbnail = 'http://www.abcd.com/valid.bmp';
				scope.target.thumbnail = thumbnail;
				scope.validateThumbnail();
				$httpBackend.flush();
				expect(scope.valid.thumbnail).toEqual(true);
			});

			it('ensures non-dwg file link to dl files are caught', function(){
				var dls = ['https://something.png','https://iamadwgfile.bmp'];
				for(var index in dls){
					scope.target.dl= dls[index];
					scope.validateDwg();
					expect(scope.valid.dl).not.toEqual(true);
				}
			});

			it('ensures broken links to dl files are caught',function(){
				$httpBackend.expectGET('http://www.abcd.com/invalid.dwg').respond(302, '');
				scope.target.dl = 'http://www.abcd.com/invalid.dwg';
				scope.validateDwg();
				$httpBackend.flush();
				expect(scope.valid.dl).not.toEqual(true);
			});

			it('ensures valid link to dl passes validation',function(){
				$httpBackend.expectGET('http://www.abcd.com/valid.dwg').respond(200, '');
				scope.target.dl = 'http://www.abcd.com/valid.dwg';
				scope.validateDwg();
				$httpBackend.flush();
				expect(scope.valid.dl).toEqual(true);
			});
		});
	});
})();