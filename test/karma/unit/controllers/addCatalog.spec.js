'use strict';

(function() {
	describe('ACE controllers', function() {
		describe('AddCatalogController', function() {
		// Load the controllers module
			beforeEach(module('ace'));

			var scope, addCatCtrl, Service, $httpBackend, boxService, enumService;

			beforeEach(inject(function($controller, $rootScope, $injector, CatalogAPI, boxSelect, fileTypeEnum) {
				
				scope = $rootScope.$new();
				Service = CatalogAPI;
				boxService = boxService;
				enumService = fileTypeEnum;
				$httpBackend = $injector.get('$httpBackend');
				addCatCtrl = $controller('catalogController',{
					$scope: scope,
					CatalogAPI: Service,
					boxSelect: boxService,
					fileTypeEnum: enumService
				});
				scope.init();
			}));
			

			afterEach(function() {
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			});

			it('ensures sheets names are checked against existing types in database', function(){
				$httpBackend.expect('GET', 'api/getTypes').respond(200,[{'name':'Fuses','code':'FU'},{'name':'Switches','code':'SW'}]);
				var sheets = ['FU','LR'];
				scope.matchSheets(sheets);
				$httpBackend.flush();
				expect(scope.processedSheets.length).toEqual(2);
			});

			it('ensures sheets with new sheet names are marked pending',function(){
				$httpBackend.expect('GET', 'api/getTypes').respond(200,[{'name':'Fuses','code':'FU'},{'name':'Switches','code':'SW'}]);
				var sheets = ['LR'];
				scope.matchSheets(sheets);
				$httpBackend.flush();				
				expect(scope.processedSheets[0]).toEqual({'sName':'LR','pending':true});
			});

			it('ensures auto macthed sheets are marked with dName',function(){
				$httpBackend.expect('GET', 'api/getTypes').respond(200,[{'name':'Fuses','code':'FU'},{'name':'Switches','code':'SW'}]);
				var sheets = ['FU'];
				scope.matchSheets(sheets);
				$httpBackend.flush();				
				expect(scope.processedSheets[0]).toEqual({'sName':'FU','dName':'FU'});
			});

			it('ensures untracked sheets have their dnames set to null',function(){
				scope.processedSheets = [{'sName':'FU','dName':'FU'},{'sName':'LR','dName':'LR'}];
				var sheet = {'sName':'FU','dName':'FU'};
				scope.toggleTrackingSheet(sheet);
				expect(scope.processedSheets[0]).toEqual({'sName':'FU','dName':null,'unTrack':true});
			});

			it('matched field names matched with existing database fields are recorded',function(){
				$httpBackend.expect('POST', 'api/getTypeFields').respond(200,['catalog','manufacturer']);
				scope.processedSheets = [{'sName':'FU','dName':'FU'}];
				var cols = ['catalog','manufacturer'];
				var j = 0;
				scope.original_types=['FU'];
				scope.match_field(j,cols);
				$httpBackend.flush();
				expect(scope.processedSheets[0].fields).toEqual([['catalog','catalog'],['manufacturer','manufacturer']]);
			});

			it('ensures field names that doesn\'t get a match in the database are counted in pendingFields',function(){
				$httpBackend.expect('POST', 'api/getTypeFields').respond(200,['catalog','manufacturer']);
				scope.processedSheets = [{'sName':'FU','dName':'FU','pendingFields':0}];
				var cols = ['catalog','manufacturer','somethingElse'];
				var j = 0;
				scope.original_types=['FU'];
				scope.match_field(j,cols);
				$httpBackend.flush();
				expect(scope.processedSheets[0].fields).toEqual([['catalog','catalog'],['manufacturer','manufacturer'],['somethingElse','']]);
				expect(scope.processedSheets[0].pendingFields).toEqual(1);
			});

			it('ensures sheets must have all compulsory fields to be marked as auto-matched',function(){
				$httpBackend.expect('POST', 'api/getTypeFields').respond(200,['catalog','manufacturer']);
				scope.processedSheets = [{'sName':'FU','dName':'FU','pendingFields':0}];
				var cols = ['catalog'];
				var j = 0;
				scope.original_types=['FU'];
				scope.match_field(j,cols);
				$httpBackend.flush();
				expect(scope.processedSheets[0].pendingFields).toEqual(1);
			});

			it('newly created types has all their fields counted as pending fields',function(){
				scope.processedSheets = [{'sName':'SW','dName':'SW','pendingFields':0}];
				var cols = ['catalog','manufacturer','somethingElse'];
				var j = 0;
				scope.original_types=['FU'];
				scope.match_field(j,cols);
				expect(scope.processedSheets[0].fields).toEqual([['catalog','catalog'],['manufacturer','manufacturer'],['somethingElse','somethingElse']]);
				expect(scope.processedSheets[0].pendingFields).toEqual(3);
			});

			it('ensures originally pending sheets are not filtered out from the list',function(){
				scope.processedSheets = [{'sName':'SW','pending':true},{'sName':'SW','dName':'SW','pending':true,'unTrack':true},{'sName':'SW','dName':'SW','pending':true}];
				var isPending = scope.isPending({'sName':'SW','pending':true});
				expect(isPending).toEqual(true);
				isPending = scope.isPending({'sName':'SW','dName':'SW','pending':true,'unTrack':true});
				expect(isPending).toEqual(true);
				isPending = scope.isPending({'sName':'SW','dName':'SW','pending':true});
				expect(isPending).toEqual(true);
			});

			it('ensures in step 2the order of list items are alphabetical with pending ones on top',function(){
				var sheets = [{'sName':'SW','pending':true},{'sName':'FU','pending':true,'unTrack':true},{'sName':'FU','dName':'FU'},{'sName':'SW','dName':'SW'}];
				var order = (scope.sheetSorted(sheets[1]) < scope.sheetSorted(sheets[0])) && (scope.sheetSorted(sheets[0]) < scope.sheetSorted(sheets[2])) && (scope.sheetSorted(sheets[2]) < scope.sheetSorted(sheets[3]));
				expect(order).toEqual(true);

			});

			it('ensures step 3 is enabled only if step 2 has no pending sheets',function(){
				scope.processedSheets = [{'sName':'SW','pending':true},{'sName':'FU','pending':true,'unTrack':true},{'sName':'FU','dName':'FU'},{'sName':'SW','dName':'SW'}];
				scope.$apply();
				expect(scope.nextDisabled).toEqual(true);
				scope.processedSheets = [{'sName':'FU','dName':'FU'},{'sName':'SW','unTrack':true}];
				scope.$apply();
				expect(scope.nextDisabled).toEqual(false);
			});

			it('ensures in step 3 sheets are ordered by as pending ones on top',function(){
				var sheets = [{'sName':'FU','dName':'FU', 'pendingFields':1},{'sName':'AN','dName':'AN','pendingFields':0},{'sName':'SW','dName':'SW','pendingFields':0}];
				var order  = (scope.sheetSortedByPendingFields(sheets[0]) < scope.sheetSortedByPendingFields(sheets[1])) && (scope.sheetSortedByPendingFields(sheets[1]) < scope.sheetSortedByPendingFields(sheets[2]));
				expect(order).toEqual(true);
			});

			it('ensures submit is enabled only if no sheet has pending fields',function(){
				scope.processedSheets = [{'sName':'FU','dName':'FU', 'pendingFields':1},{'sName':'AN','dName':'AN','pendingFields':0},{'sName':'SW','dName':'SW','pendingFields':0}];
				scope.$apply();
				expect(scope.submitDisabled).toEqual(true);
				scope.processedSheets = [{'sName':'FU','dName':'FU', 'pendingFields':0}];
				scope.$apply();
				expect(scope.submitDisabled).toEqual(false);
			});

			it('ensures new footprint names are added successfully in the map if not empty', function() {
				scope.footprintWithURL[0] = {};
				scope.populateArrayWithUrl('ABFU', 0, scope.footprintWithURL);
				expect(scope.footprintWithURL[0]['abfu']).toEqual('');

				scope.populateArrayWithUrl('', 0, scope.footprintWithURL);
				expect(scope.footprintWithURL[0]['']).toEqual(undefined);
			});

			it('ensures new symbol 3d names are added successfully in the map if not empty', function() {
				scope.symbol3DWithURL[0] = {};
				scope.populateArrayWithUrl('xyz.ipt', 0, scope.symbol3DWithURL);
				expect(scope.symbol3DWithURL[0]['xyz.ipt']).toEqual('');

				scope.populateArrayWithUrl('', 0, scope.symbol3DWithURL);
				expect(scope.symbol3DWithURL[0]['']).toEqual(undefined);
			});

			it('ensures that user is only allowed to choose a folder from box', function() {
				var response = [{type: 'folder', url: 'https://autodesk.box.com/s/tu93hplg9zhd31k78aha'}];
				scope.executeOnBoxSuccess(response);
				expect(scope.processingBoxFolder).toEqual(true);
				expect(scope.validateStatus).toEqual('Validating box contents...');

				response = [{type: 'file', url: 'https://autodesk.box.com/s/tu93hplg9zhd31k78aha'}];
				scope.executeOnBoxSuccess(response);
				expect(scope.folderError).toEqual(true);
				expect(scope.errorMsg).toEqual('Please choose a valid box folder.');
			});
		});
	});
})();