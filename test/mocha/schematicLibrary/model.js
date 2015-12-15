'use strict';

/**
 * Module dependencies.
 */

var should = require('should'),
	mongoose = require('mongoose'),
	ComponentSchem = mongoose.model('SchematicComponent'),
	StandardSchem = mongoose.model('SchematicStandard');

//Globals
var standard, standard2, standard3;
var component, component2;

describe('<Unit Test>', function() {
	describe('Model Schematic Library:', function() {

		describe('Standard Methods', function() {

			before(function(done) {
				StandardSchem.remove().exec();
				ComponentSchem.remove().exec();
				standard = new StandardSchem({
					name: 'JIC',
					description: 'abcd'
				});
				standard2 = new StandardSchem({
					name: 'JIC',
					description: 'abcd'
				});
				done();
			});
			it('should begin with no standards', function(done) {
				StandardSchem.find({}, function(err, standards) {
					(standards).should.have.length(0);
					done();
				});
			});

			it('should be able to save a standard whithout problems', function(done) {
				standard.save(done);
			});

			it('should fail to save a standard without a name', function(done) {
				standard.name = null;
				return standard.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should fail to save a duplicate standard with the same name', function(done) {
				return standard2.save(function(err) {
					should.exist(err);
					done();
				});
			});
		});

		describe('Component Methods', function() {

			before(function(done) {
				ComponentSchem.remove().exec(function() {
					standard3 = new StandardSchem({
						name: 'IEC',
						description: 'abcd'
					});

					standard3.save(function() {
						component = new ComponentSchem({
							name: 'Push Buttons',
							id: 'M134',
							parentNode: null,
							standard: standard3._id
						});

						component2 = new ComponentSchem({
							name: 'Push Buttons',
							id: 'M134',
							parentNode: null,
							standard: standard3._id
						});
						done();
					});
				});
			});

			it('should begin with no components', function(done) {
				ComponentSchem.find({}, function(err, components) {
					(components).should.have.length(0);
					done();
				});
			});

			it('should be able to save a component whithout problems', function(done) {
				component.save(done);
			});

			it('should fail to save a duplicate component with the same id and parent', function(done) {
				return component2.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should fail to save a component without a name', function(done) {
				component.name = null;
				return component.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should fail to save a component without an id', function(done) {
				component.name = 'IEC';
				component.id = null;
				return component.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should fail to save a component without a standard', function(done) {
				component.id = 'M134';
				component.standard = null;
				return component.save(function(err) {
					should.exist(err);
					done();
				});
			});

		});

		after(function(done) {
			ComponentSchem.remove().exec();
			StandardSchem.remove().exec();
			done();
		});
	});
});