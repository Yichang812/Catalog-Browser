'use strict';

/**
 * Module dependencies.
 */

var should = require('should'),
	mongoose = require('mongoose'),
	CatalogSchem = mongoose.model('Catalog');

//Globals
var catalog_entry, catalog_entry2;

describe('<Unit Test>', function() {
	describe('Model Catalog:', function() {

		describe('Catalog Methods', function() {

			before(function(done) {
				CatalogSchem.remove().exec();
				done();
			});

			beforeEach(function(done) {
				catalog_entry = new CatalogSchem({
					catalog: 'A',
					manufacturer: 'B',
					type: {code: 'C', name: 'D'},
					assemblyCode: null
				});
				catalog_entry2 = new CatalogSchem({
					catalog: 'A',
					manufacturer: 'B',
					type: {code: 'C', name: 'D'},
					assemblyCode: null
				});
				done();
			});

			it('should begin with no entries', function(done) {
				CatalogSchem.find({}, function(err, entries) {
					(entries).should.have.length(0);
					done();
				});
			});

			it('should be able to save a entry whithout problems', function(done) {
				catalog_entry.save(done);
			});

			it('should fail to save a duplicate entry with the same catalog, manufacturer, typeCode and assemblyCode', function(done) {
				return catalog_entry2.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should fail to save a entry without a catalog number', function(done) {
				catalog_entry.catalog = null;
				return catalog_entry.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should fail to save a entry without a manufacturer', function(done) {
				catalog_entry.manufacturer = null;
				return catalog_entry.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should fail to save a entry without a typeCode', function(done) {
				catalog_entry.type.code = null;
				return catalog_entry.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should fail to save a entry without a typeName', function(done) {
				catalog_entry.type.name = null;
				return catalog_entry.save(function(err) {
					should.exist(err);
					done();
				});
			});

		});

		after(function(done) {
			CatalogSchem.remove().exec();
			done();
		});
	});
});