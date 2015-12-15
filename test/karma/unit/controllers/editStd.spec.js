'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('editStdFormCtrl', function() {
		// Load the controllers module
			beforeEach(module('ace'));

			var scope, UploadController, Service, $httpBackend;

			beforeEach(inject(function($controller, $rootScope, $injector, SchematicsAPI) {
				
				scope = $rootScope.$new();
				Service = SchematicsAPI;
				$httpBackend = $injector.get('$httpBackend');
				$httpBackend.when('GET', 'api/getSchemStds').respond([{'name': 'IEC','_id':'1'}, {'name': 'ABC','_id':'2'}]);

				UploadController = $controller('editStdFormCtrl', {
					$scope: scope,
					SchematicsAPI: Service
				});
			}));

			afterEach(function() {
					$httpBackend.verifyNoOutstandingExpectation();
					$httpBackend.verifyNoOutstandingRequest();
				});

			it('ensure name larger than 60 chars are caught', function(){
				scope.currentStd = {'name': 'ABC','_id':'4'};
				scope.stdName = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ';
				scope.checkName();
				expect(scope.valid.name).toBe(false);
			});

			it('ensures repetitive standard name are caught', function(){
				var names = ['IEC','iec','ieC'];
				scope.currentStd = {'name': 'ABC','_id':'4'};
				for (var index in names){
					var name = names[index];
					scope.stdName = name;
					scope.checkName();
					$httpBackend.flush();
					expect(scope.valid.name).toEqual(false);
				}
			});

			it('ensures the original name pass validation',function(){
				scope.currentStd = {'name': 'ABC','_id':'2'};
				scope.stdName = 'ABC';
				scope.checkName();
				expect(scope.valid.name).toEqual(true);
			});

			it('ensure valid name pass validation', function(){
				scope.stdName = 'JIC New';
				scope.currentStd = {'name': 'ABC','_id':'5'};
				scope.checkName();
				$httpBackend.flush();
				expect(scope.valid.name).toEqual(true);
			});

			it('ensure invalid path to mapping json files are caught', function(){
				var jsonFile = [{'name':'something.exe'}];
				scope.jsonFileSelect(jsonFile);
				expect(scope.valid.json).not.toEqual(true);
			});

			it('ensure invalid path to mapping json files (file name with .json) are caught', function(){
				var jsonFile = [{'name':'sth.json.exe'}];
				scope.jsonFileSelect(jsonFile);
				expect(scope.valid.json).not.toEqual(true);
			});

			it('ensure valid path to mapping jason file passes', function(){
				var jsonFile = [{'name':'something/file.json'}];
				scope.jsonFileSelect(jsonFile);
				expect(scope.valid.json).toEqual(true);
			});

			it('ensure invalid dat files (file name with .dat) are caught', function(){
				var datFiles = [[{'name':'sth.dat.exe'}],[{'name':'sth.date'}]];
				for(var index in datFiles){
					scope.checkDatFile(datFiles[index]);
					expect(scope.valid.dat).not.toEqual(true);
				}
			});

			it('ensure invalid dat files are caught', function(){
				var datFile = [{'name':'somethingstrange'}];
				scope.checkDatFile(datFile);
				expect(scope.valid.dat).not.toEqual(true);
			});

			it('ensure valid dat files passes', function(){
				var datFile = [{'name':'sthvalid.dat'}];
				scope.checkDatFile(datFile);
				expect(scope.valid.dat).toEqual(true);
			});

		});
	});
})();