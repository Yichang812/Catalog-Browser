'use strict';
var OxygenOauth = require('./oxygenOauth'),
	mongoose = require('mongoose'),
	request = require('supertest'),
	User = mongoose.model('User'),
	SchematicComponent = mongoose.model('SchematicComponent'),
	SchematicStandard = mongoose.model('SchematicStandard'),
	CatalogSchem = mongoose.model('Catalog'),
	agent = request.agent('http://localhost:3001'),
	config = require('../../../config/config'),
	_ = require('underscore');

require('../../../server');

describe('<e2e API Test>', function() {
	var xauth;
	before(function (done) {
		User.remove().exec();
		this.timeout(config.timeout);
		xauth = new OxygenOauth('http://accounts-dev.autodesk.com','5f7de223-2148-479b-9ae1-e835f590c117','fb3d2f26-d89e-4ab5-9da4-d9c0664c3c9d');
		mongoose.createConnection('mongodb://localhost/ACE-test', function (error) {
			if (error) throw error; // Handle failed connection
			done();
		});
	});

	describe('User Controller', function() {
		var acess_token, acess_token_secret;
		var body;

		before(function(done) {
			this.timeout(config.timeout);
			var callback = function(e, at, at_s) {
				if(e) throw (e);
				if(!e)
				{
					acess_token = at;
					acess_token_secret = at_s;
				}
				done();
			};
			xauth.login('akaash.gupta@autodesk.com', 'Iceman123', callback);
		});

		it('should create test user and login', function(done) {
			this.timeout(config.timeout);
			agent
			.post('/xauth')
			.send({oauth_token: acess_token, oauth_verifier: acess_token_secret})
			.end(function(err,res) {
				(res.status).should.equal(302);
				done();
			});
		});

		it('Authorization for mobile devices', function(done) {
			this.timeout(config.timeout);
			xauth.get('http://localhost:3001/api/users/me', function(err, res, b){
				(JSON.parse(res)).should.have.properties('name','email','lastLogin','_id','__v','codeName','isManufacturer','isAdmin','Id');
				(b.statusCode).should.equal(200);
				done();
			});
		});

		it('GET /users/me should return 200', function(done){
			agent
			.get('/api/users/me', {json: true})
			.end(function(err, res){
				(res.status).should.equal(200);
				(res.body).should.have.properties('name','email','lastLogin','_id','__v','codeName','isManufacturer','isAdmin','Id');
				if(res.status === 200)
				{
					body = res.body;
				}
				done();
			});
		});

		it('GET /makeAdmin should make me Admin', function(done) {
			this.timeout(config.timeout);
			agent
			.get('/api/makeAdmin/Akaash Gupta')
			.end(function(err,res) {
				(res.status).should.equal(302);
				done();
			});
		});

		it('GET /updateCodeName should update my code name', function(done) {
			this.timeout(config.timeout);
			agent
			.get('/api/updateCodeName/AG')
			.end(function(err,res) {
				(res.status).should.equal(200);
				(res.body.name).should.equal('Akaash Gupta');
				(res.body.codeName).should.equal('AG');
				done();
			});
		});

		it('POST /users should return 200', function(done){
			agent
			.post('/api/users')
			.end(function(err, res){
				(res.status).should.equal(200);
				(res.body.users[0]).should.have.properties('name','email','provider','lastLogin','_id','__v','codeName','isManufacturer','isAdmin','Id');
				done();
			});
		});

		it('GET /users/:ID should make me a Manufacturer and return 200', function(done){
			agent
			.get('/api/users/'+body._id)
			.end(function(err, res){
				(res.status).should.equal(200);
				(res.body).should.have.properties('name','email','lastLogin','_id','__v','codeName','isManufacturer','isAdmin','Id');
				(res.body.isManufacturer).should.equal(true);
				done();
			});
		});

		it('GET /signout should logout', function(done){
			agent
			.get('/signout')
			.end(function(err, res){
				(res.status).should.equal(302);
				done();
			});
		});

		it('GET api/users/me without credentials should return 401', function(done){
			agent
			.get('/api/users/me')
			.end(function(err, res){
				(res.status).should.equal(401);
				done();
			});
		});
		it('POST api/addSchemFav without credentials should return 401', function(done){
			agent
			.post('/api/addSchemFav')
			.end(function(err, res){
				(res.status).should.equal(401);
				done();
			});
		});

		it('GET api/getSchemFav without credentials should return 401', function(done){
			agent
			.get('/api/getSchemFav')
			.end(function(err, res){
				(res.status).should.equal(401);
				done();
			});
		});

		it('POST api/delSchemFav without credentials should return 401', function(done){
			agent
			.post('/api/delSchemFav')
			.end(function(err, res){
				(res.status).should.equal(401);
				done();
			});
		});

		describe('For testing Add, Delete Schem Fav and geting favourite list', function() {
			var component_id = '';
			var standard = '';
			before(function(done) {
				this.timeout(config.timeout*3);
				SchematicComponent.remove().exec(function() {
					SchematicStandard.remove().exec(function() {
						agent
						.post('/xauth')
						.send({oauth_token: acess_token, oauth_verifier: acess_token_secret})
						.end(function(err,res) {
							(res.status).should.equal(302);
							agent.post('/api/upload')
							.attach('datFile', './test/mocha/RestAPI/ACE_JIC_MENU.dat')
							.attach('jsonFile', './test/mocha/RestAPI/mapping.json')
							.end(function(err, res) {
								res.should.have.status(200);
								function getComponentId() {
									agent.get('/api/getSchemStds')
									.end(function(err, res) {
										(res.status).should.equal(200);
                                        standard = res.body[0].standard._id;
										agent.get('/api/getChildren/'+res.body[0]._id)
										.end(function(err, res) {
											(res.status).should.equal(200);
											agent.get('/api/getChildren/'+res.body.children[0]._id)
											.end(function(err, res) {
												(res.status).should.equal(200);
												for (var i = 0; i < res.body.children.length; i++) {
													var child = res.body.children[i];
													if(!child.isComposite)
													{
														component_id = child._id;
														break;
												    }
												}
                                                if (component_id !== '')
                                                {
                                                    agent.post('/api/publishComponent/')
                                                    .send({_id: component_id, number:1})
                                                    .end(function(err, res) {
                                                        (res.status).should.equal(200);
                                                        done();
                                                        return;
                                                    });
                                                    return;
                                                }
                                                done();
                                            });
                                        });
                                    });
                                }
                                setTimeout(getComponentId, 500);
                            });
                        });
                    });
                });
            });

            it('POST /api/publishStandard with valid standard id should publish the entire standard and return 200', function(done) {
                agent.post('/api/publishStandard')
                .send({std_id: standard})
                .end(function(err, res) {
                    (res.status).should.equal(200);
                    done();
                });
            });
	
            it('POST /api/addSchemFav with valid id should return 200', function(done) {
                (component_id).should.not.equal('');
                agent.post('/api/addSchemFav')
                .send({_id: component_id, number: 1})
                .end(function(err, res) {
                    (res.status).should.equal(200);
                    done();
                });
            });

            it('GET /api/getSchemFav should return updated fav list with one fav', function(done){
                agent
                .get('/api/getSchemFav', {json: true})
                .end(function(err, res){
                    (res.body.schematic.length).should.equal(1);
                    (res.status).should.equal(200);
                    done();
                });
            });

            it('POST /api/delSchemFav with valid id should return 200', function(done) {
                (component_id).should.not.equal('');
                agent.post('/api/delSchemFav')
                .send({_id: component_id})
                .end(function(err, res) {
                    (res.status).should.equal(200);
                    done();
                });
            });

            it('GET /api/getSchemFav should return updated fav list with no favs', function(done){
                agent
                .get('/api/getSchemFav', {json: true})
                .end(function(err, res){
                    (res.status).should.equal(200);
                    (res.body.schematic.length).should.equal(0);
                    done();
                });
            });

            after(function(done) {
                SchematicComponent.remove().exec(function() {
                    SchematicStandard.remove().exec(function() {
                        setTimeout(done, 500);
                    });
                });
            });
        });

		describe('For testing Add, Delete and getting Associations with catalog', function() {
			var component = '';
			var entry1 = {catalog: 'asasd', manufacturer: 'BUSS', description: 'First', type: 'Fuse Holder'};
			var entry2 = {catalog: 'asdqweqd', manufacturer: 'AB', description: 'Second', type: 'Fuse Holder'};
			var entry3 = {catalog: 'rgethetshs', manufacturer: 'AB', description: 'Third', type: 'Fuse Holder'};
			var stored_entries;
			var standard = '';

			before(function(done) {
				this.timeout(config.timeout*3);
				SchematicComponent.remove().exec(function() {
					SchematicStandard.remove().exec(function() {
						agent
						.post('/xauth')
						.send({oauth_token: acess_token, oauth_verifier: acess_token_secret})
						.end(function(err,res) {
							(res.status).should.equal(302);
							agent.post('/api/upload')
							.attach('datFile', './test/mocha/RestAPI/ACE_JIC_MENU.dat')
							.attach('jsonFile', './test/mocha/RestAPI/mapping.json')
							.end(function(err, res) {
								res.should.have.status(200);
								function getComponentId() {
									agent.get('/api/getSchemStds')
									.end(function(err, res) {
										(res.status).should.equal(200);
										standard = res.body[0].standard._id;
										agent.get('/api/getChildren/'+res.body[0]._id)
										.end(function(err, res) {
											(res.status).should.equal(200);
											agent.get('/api/getChildren/'+res.body.children[0]._id)
											.end(function(err, res) {
												(res.status).should.equal(200);
												function setupCatalog() {
													agent
													.post('/api/updateCatalog')
													.send({data: {FU: {title: 'Fuses', entries: [entry1, entry2, entry3]}}})
													.end(function(err, res) {
														(res.status).should.equal(200);
														agent
														.post('/api/getEntries')
														.send({type: 'FU'})
														.end(function(err, res) {
															(res.status).should.equal(200);
															(res.body.data.length).should.equal(3);
															stored_entries = res.body.data;
															done();
														});
													});
												}
												for (var i = 0; i < res.body.children.length; i++) {
													var child = res.body.children[i];
													if(!child.isComposite)
													{
														component = child;
														return setupCatalog();
													}
												}
												done();
											});
										});
									});
								}
								setTimeout(getComponentId, 500);
							});
						});
					});
				});
			});

            it('POST /api/publishStandard with valid standard id should publish the entire standard and return 200', function(done) {
                agent.post('/api/publishStandard')
                .send({std_id: standard})
                .end(function(err, res) {
                    (res.status).should.equal(200);
                    done();
                });
            });

			it('POST /api/addAssociation with valid catalog entries and schematic id should return 200', function(done) {
				(component._id).should.not.equal('');
				agent.post('/api/addAssociation')
				.send({items: _.map(stored_entries, function(obj) {return obj._id;}), _id: component._id, number: component.published})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.length).should.equal(3);
					done();
				});
			});

			it('GET /api/getAssociations should return updated associated schematic icons with 1 entry', function(done){
				agent
				.get('/api/getAssociations')
				.end(function(err, res){
					(res.body.length).should.equal(1);
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST /api/delAssociation with valid catalog entries and schematic id should delete and return updated associations with 2 entries', function(done) {
				(component._id).should.not.equal('');
				agent.post('/api/delAssociation')
				.send({item: stored_entries[0]._id, _id: component._id})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.length).should.equal(2);
					done();
				});
			});

			after(function(done) {
				SchematicComponent.remove().exec(function() {
					SchematicStandard.remove().exec(function() {
						CatalogSchem.remove().exec(function() {
							setTimeout(done, 500);
						});
					});
				});
			});
		});

		describe('For testing Add, Delete and getting catalog favourites', function() {
			var entry1 = {catalog: 'asasd', manufacturer: 'BUSS', description: 'First', type: 'Fuse Holder'};
			var entry2 = {catalog: 'asdqweqd', manufacturer: 'AB', description: 'Second', type: 'Fuse Holder'};
			var entry3 = {catalog: 'rgethetshs', manufacturer: 'AB', description: 'Third', type: 'Fuse Holder'};
			var stored_entries;

			before(function(done) {
				this.timeout(config.timeout*3);
				SchematicComponent.remove().exec(function() {
					SchematicStandard.remove().exec(function() {
						agent
						.post('/xauth')
						.send({oauth_token: acess_token, oauth_verifier: acess_token_secret})
						.end(function(err,res) {
							(res.status).should.equal(302);
							function setupCatalog() {
								agent
								.post('/api/updateCatalog')
								.send({data: {FU: {title: 'Fuses', entries: [entry1, entry2, entry3]}}})
								.end(function(err, res) {
									(res.status).should.equal(200);
									agent
									.post('/api/getEntries')
									.send({type: 'FU'})
									.end(function(err, res) {
										(res.status).should.equal(200);
										(res.body.data.length).should.equal(3);
										stored_entries = res.body.data;
										done();
									});
								});
							}
							setTimeout(setupCatalog, 200);
						});
					});
				});
			});

			it('POST /api/addCatFav with valid catalog entries and schematic id should return 200', function(done) {
				agent.post('/api/addCatFav')
				.send({items: _.map(stored_entries, function(obj) {return obj._id;})})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.favourites.length).should.equal(3);
					done();
				});
			});

			it('GET /api/getCatFav should return updated catalog favourites with 3 entries', function(done){
				agent
				.get('/api/getCatFav')
				.end(function(err, res){
					(res.body.length).should.equal(3);
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST /api/delCatFav with valid catalog entrie id should delete and return updated favourites with 2 entries', function(done) {
				agent.post('/api/delCatFav')
				.send({_id: stored_entries[0]._id})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.favourites.length).should.equal(2);
					done();
				});
			});

			after(function(done) {
				SchematicComponent.remove().exec(function() {
					SchematicStandard.remove().exec(function() {
						CatalogSchem.remove().exec(function() {
							setTimeout(done, 500);
						});
					});
				});
			});
		});

		describe('For testing Add, Delete and getting catalog filters', function() {
			var filter1, filter2;
			before(function(done) {
				filter1 = {name: 'A', filter: {search: 'abcd', type: 'asdasd', filters: ['sdfsd', 'asdasd']}};
				filter2 = filter1;
				this.timeout(config.timeout*3);
				agent
				.post('/xauth')
				.send({oauth_token: acess_token, oauth_verifier: acess_token_secret})
				.end(function(err,res) {
					(res.status).should.equal(302);
					done();
				});
			});
			it('POST /api/addFilter with valid name and filter should return 200', function(done) {
				agent.post('/api/addFilter')
				.send(filter1)
				.end(function(err, res) {
					(res.status).should.equal(200);
					done();
				});
			});

			it('GET /api/getFilters should return updated filter list with one filter', function(done){
				agent
				.get('/api/getFilters', {json: true})
				.end(function(err, res){
					(res.body.length).should.equal(1);
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST /api/addFilter with duplicate name should return 400', function(done) {
				agent.post('/api/addFilter')
				.send(filter2)
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});


			it('POST /api/delFilter with valid name should return 200', function(done) {
				agent.post('/api/delFilter')
				.send({name: filter1.name})
				.end(function(err, res) {
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST /api/delFilter with invalid name should return 400', function(done) {
				agent.post('/api/delFilter')
				.send({name: 'asdasdasd'})
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});

			it('GET /api/getFilters should return updated filter list with no filters', function(done){
				agent
				.get('/api/getFilters', {json: true})
				.end(function(err, res){
					(res.body.length).should.equal(0);
					(res.status).should.equal(200);
					done();
				});
			});
		});
    });

	describe('Schematics Controller', function() {
		var acess_token, acess_token_secret;
		var id, standard_id, node;

		before(function(done) {
			this.timeout(config.timeout);
			var callback = function(e, at, at_s) {
				if(e) throw (e);
				if(!e)
				{
					acess_token = at;
					acess_token_secret = at_s;
				}
				agent
				.post('/xauth')
				.send({oauth_token: acess_token, oauth_verifier: acess_token_secret})
				.end(function(err,res) {
					(res.status).should.equal(302);
					done();
				});
			};
			xauth.login('akaash.gupta@autodesk.com', 'Iceman123', callback);
		});

		describe('Before delete', function() {
			it('POST /api/upload should return 200', function(done) {
				this.timeout(config.timeout);
				agent.post('/api/upload')
				.attach('datFile', './test/mocha/RestAPI/ACE_JIC_MENU.dat')
				.attach('jsonFile', './test/mocha/RestAPI/mapping.json')
				.end(function(err, res) {
					res.should.have.status(200);
					done();
				});
			});

			it('POST /api/upload with only one file should return 400', function(done) {
				this.timeout(config.timeout);
				agent.post('/api/upload')
				.attach('datFile', './test/mocha/RestAPI/ACE_JIC_MENU.dat')
				.end(function(err, res) {
					res.should.have.status(400);
					done();
				});
			});

			it('POST /api/upload with invalid file should return 400', function(done) {
				this.timeout(config.timeout);
				agent.post('/api/upload')
				.attach('datFile', './test/mocha/RestAPI/oxygenOauth.js')
				.end(function(err, res) {
					res.should.have.status(400);
					done();
				});
			});

            it('GET /api/getSchemStds should return 200 with the list of schematics', function(done) {
                this.timeout(config.timeout);
                agent.get('/api/getSchemStds').end(function(err, res){
                    (res.body[0].name).should.equal('JIC: Schematic Symbols');
                    (res.status).should.equal(200);
                    id = res.body[0]._id;
                    standard_id = res.body[0].standard._id;
                    node = res.body[0];
                    done();
                });
            });

            it('GET /api/getChildren/:nodeId with invalid componentId should return 400', function(done) {
                this.timeout(config.timeout);
                agent.get('/api/getChildren/asdjfhisweuhf').end(function(err, res){
                    (res.status).should.equal(400);
                    done();
                });
            });

            it('GET /api/getChildren/:nodeId with valid Id should return the children with status 200', function(done) {
                this.timeout(config.timeout);
                agent.get('/api/getChildren/'+id).end(function(err, res){
                    var result = res.body;
                    (result.children.length).should.equal(17);
                    (res.status).should.equal(200);
                    done();
                });
            });

            it('GET /api/getParentHiearchy/:nodeId with invalid componentId should return 400', function(done) {
                this.timeout(config.timeout);
                agent.get('/api/getParentHiearchy/asdjfhisweuhf').end(function(err, res){
                    (res.status).should.equal(400);
                    done();
                });
            });

            it('GET /api/getParentHiearchy/:nodeId with valid Id should return the parent hiearchy of the node with status 200', function(done) {
                this.timeout(config.timeout);
                agent.get('/api/getParentHiearchy/'+id).end(function(err, res){
                    var result = res.body;
                    (result.parentHiearchy.length).should.equal(1);
                    (result.parentHiearchy[0].title).should.equal('JIC: Schematic Symbols');
                    (res.status).should.equal(200);
                    done();
                });
            });

			it('POST /api/editStd should return updated standard with 200', function(done) {
				this.timeout(config.timeout);
				agent
				.post('/api/editStd')
				.send({standardId: standard_id, stdName: 'JIC',desc: 'pass'})
				.end(function(err, res) {
					(res.body.name).should.equal('JIC');
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST /api/getMultiple should return all items with matching _ids with 200', function(done) {
				this.timeout(config.timeout);
				agent
				.post('/api/getMultiple')
				.send({items: [id]})
				.end(function(err, res) {
					(res.body[0].name).should.equal('JIC');
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST /api/editStd for an invalid standard Id should return 400', function(done) {
				this.timeout(config.timeout);
				agent
				.post('/api/editStd')
				.send({standardId: 'sfrgsdfs', stdName: 'JIC',desc: 'fail'})
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});

			it('POST /api/editComponent should return updated component with 200', function(done) {
				this.timeout(config.timeout);
				agent
				.post('/api/editComponent')
				.send({node: {_id: id,name: 'JIC2'}})
				.end(function(err, res) {
					(res.body.name).should.equal('JIC2');
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST /api/editComponent for an invalid component Id should return 400', function(done) {
				this.timeout(config.timeout);
				agent
				.post('/api/editComponent')
				.send({node: {_id: 'dsajhfiuwhes',name: 'JIC2'}})
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});

			it('GET api/getNode with a valid id should return the component with status 200', function(done) {
				agent
				.get('/api/getNode/'+id)
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.name).should.equal('JIC2');
					done();
				});
			});

			it('GET api/getNode with an invalid id should return 400', function(done) {
				agent
				.get('/api/getNode/dhdhg')
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});

			it('POST api/isUniqueId without an Id should return 400', function(done) {
				agent
				.post('/api/isUniqueId')
				.send({standardId: standard_id})
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});

			it('POST api/isUniqueId without a standard id should return 400', function(done) {
				agent
				.post('/api/isUniqueId')
				.send({id: id})
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});

			it('POST api/isUniqueId with valid id and standardId should return true with status 200', function(done) {
				agent
				.post('/api/isUniqueId')
				.send({id: 'asdasda', standardId: standard_id})
				.end(function(err, res) {
					(res.body.unique).should.equal(true);
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST api/createNode without a proper parent will return 400', function(done) {
				agent
				.post('/api/createNode')
				.send({node: {name: 'asdasd', id: 'asdasd', parentNode: 'as21asd', standard: standard_id}})
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});

			it('POST api/createNode with a proper node (unique name, id, parent combination) will return the created component with status 200', function(done) {
				agent
				.post('/api/createNode')
				.send({node: {name: 'asdasd', id: 'test_id', parentNode: id, standard: standard_id}})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.name).should.equal('asdasd');
					(res.body.id).should.equal('test_id');
					done();
				});
			});

			it('GET /api/delete/:nodeId with an invalid Id should return 400', function(done) {
				this.timeout(config.timeout);
				agent.get('/api/delete/asdwqeq')
				.end(function(err, res) {
					(res.status).should.equal(400);
					done();
				});
			});


			it('GET /api/delete/:nodeId with a valid Id should return 200', function(done) {
				this.timeout(config.timeout);
				xauth.get('http://localhost:3001/api/delete/'+id, function(err, res, b) {
					(b.statusCode).should.equal(200);
					done();
				});
			});

		});

        describe('After delete - testing authorization for various API', function() {
            var test_node = {name: 'test',id: '123saasd',standard: 'asdasdas'};
            var standard;
            var id;
            var name;
            before(function(done) {
                this.timeout(config.timeout);
                agent.post('/api/upload')
                .attach('datFile', './test/mocha/RestAPI/ACE_JIC_MENU.dat')
                .attach('jsonFile', './test/mocha/RestAPI/mapping.json')
                .end(function(err, res) {
                    res.should.have.status(200);
                    function delay() {
	 					agent.get('/api/getSchemStds')
	                    .end(function(err, res) {
	                        (res.status).should.equal(200);
	                        standard = res.body[0].standard._id;
	                    	done();
	                    });
	                }
	                setTimeout(delay, 500);
                });
            });

            it('POST /api/publishStandard with valid standard id should publish the entire standard and return 200', function(done) {
                agent.post('/api/publishStandard')
                .send({std_id: standard})
                .end(function(err, res) {
                    (res.status).should.equal(200);
                    done();
                });
            });

			it('GET /signout should logout', function(done){
				agent
				.get('/signout')
				.end(function(err, res){
					(res.status).should.equal(302);
					done();
				});
			});

			it('POST /api/upload without credentials should return 401', function(done) {
				this.timeout(config.timeout);
				agent.post('/api/upload')
				.attach('datFile', './test/mocha/RestAPI/ACE_JIC_MENU.dat')
				.attach('jsonFile', './test/mocha/RestAPI/mapping.json')
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});

			it('GET /api/getSchemStds without credentials returns 200', function(done) {
				this.timeout(config.timeout);
				agent.get('/api/getSchemStds').end(function(err, res) {
					var result = res.body[0];
					(result.name).should.equal('JIC: Schematic Symbols');
					(res.statusCode).should.equal(200);
					id = result._id;
					standard_id = result.standard;
					done();
				});
			});

            it('GET /api/getChildren/:nodeId without credentials should return the children with status 200', function(done) {
                this.timeout(config.timeout);
                agent.get('/api/getChildren/'+id).end(function(err, res){
                    var result = res.body;
                    (result.children.length).should.equal(17);
                    id = result.children[0]._id;
                    name = result.children[0].name;
                    (res.status).should.equal(200);
                    done();
                });
            });

			it('GET /api/getNode without credentials should return component with status 200', function(done) {
				agent
				.get('/api/getNode/'+id)
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.name).should.equal(name);
					done();
				});
			});

			it('POST /api/getMultiple without authorization should return all items with matching _ids with 200', function(done) {
				this.timeout(config.timeout);
				agent
				.post('/api/getMultiple')
				.send({items: [id]})
				.end(function(err, res) {
					(res.body[0].name).should.equal(name);
					(res.status).should.equal(200);
					done();
				});
			});

			it('POST /api/isUniqueId without credentials should return 401', function(done) {
				agent
				.post('/api/isUniqueId')
				.send({id: id, standardId: standard_id})
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});

			it('POST /api/createNode without credentials should return 401', function(done) {
				agent
				.post('/api/createNode')
				.send({node: test_node})
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});

			it('GET /api/delete/:nodeId without credentials should return 401', function(done) {
				this.timeout(config.timeout);
				agent
				.get('/api/delete/'+id)
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});

			it('POST /api/editStd without credentials should return 401', function(done) {
				this.timeout(config.timeout);
				agent
				.post('/api/editStd')
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});

			it('POST /api/editComponent without credentials should return 401', function(done) {
				this.timeout(config.timeout);
				agent
				.post('/api/editComponent')
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});
        });
    });

	describe('Catalog Controller', function() {
		var acess_token, acess_token_secret;

		before(function(done) {
			this.timeout(config.timeout);
			var callback = function(e, at, at_s) {
				if(e) throw (e);
				if(!e)
				{
					acess_token = at;
					acess_token_secret = at_s;
				}
				agent
				.post('/xauth')
				.send({oauth_token: acess_token, oauth_verifier: acess_token_secret})
				.end(function(err,res) {
					(res.status).should.equal(302);
					done();
				});
			};
			xauth.login('akaash.gupta@autodesk.com', 'Iceman123', callback);
		});

		describe('Functions', function() {
			var entry1, entry2, entry3;
			before(function(done) {
				entry1 = {catalog: 'asasd', manufacturer: 'BUSS', description: 'First', type: 'Fuse Holder'};
				entry2 = {catalog: 'asdqweqd', manufacturer: 'AB', description: 'Second', type: 'Fuse Holder'};
				entry3 = {catalog: null, manufacturer: 'AB', description: 'Third', type: 'Fuse Holder'};
				done();
			});

			it('POST /api/updateCatalog should update the catalog DB with 2 valid entries only', function(done) {
				agent
				.post('/api/updateCatalog')
				.send({data: {FU: {title: 'Fuses', entries: [entry1, entry2, entry3]}}})
				.end(function(err, res) {
					(res.status).should.equal(200);
					agent
					.post('/api/getEntries')
					.send({type: 'FU'})
					.end(function(err, res) {
						(res.status).should.equal(200);
						(res.body.data.length).should.equal(2);
						done();
					});
				});
			});

			it('POST /api/updateCatalog should update the catalog DB with 3 valid entries', function(done) {
				entry3.catalog = 'uykyuk';
				agent
				.post('/api/updateCatalog')
				.send({data: {FU: {title: 'Fuses', entries: [entry3]}}})
				.end(function(err, res) {
					(res.status).should.equal(200);
					agent
					.post('/api/getEntries')
					.send({type: 'FU'})
					.end(function(err, res) {
						(res.status).should.equal(200);
						(res.body.data.length).should.equal(3);
						done();
					});
				});
			});

            it('GET api/getTypes should return FU/Fuses with 200', function(done) {
				agent
				.get('/api/getTypes')
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.length).should.equal(1);
					(res.body[0].code).should.equal('FU');
					done();
				});
			});

			it('POST api/getTypeFields should return with 200', function(done) {
				agent
				.post('/api/getTypeFields')
				.send({type: 'FU'})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body).should.eql([ 'catalog',  'manufacturer',  'type',  'assemblyCode',  'additionalInfo.type',  'additionalInfo.description' ]);
					done();
				});
			});

			it('POST api/getAllUniqueValues should return with 200', function(done) {
				agent
				.post('/api/getAllUniqueValues')
				.send({type: 'FU', field: 'manufacturer'})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.length).should.equal(2);
					done();
				});
			});

			it('POST api/getEntries with a description filter should return a subset', function(done) {
				agent
				.post('/api/getEntries')
				.send({type: 'FU', filters: {'additionalInfo.description': 'first'}})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.data.length).should.equal(1);
					done();
				});
			});

			it('POST api/getEntries with a catalog filter should return a subset', function(done) {
				agent
				.post('/api/getEntries')
				.send({type: 'FU', filters: {catalog: 'asd'}})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.data.length).should.equal(2);
					done();
				});
			});

			it('POST api/updateEntry should return with 200', function(done) {
				agent
				.post('/api/getEntries')
				.send({type: 'FU', filters: {'additionalInfo.description': 'first'}})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.data.length).should.equal(1);
					if(res.body.data[0])
					{
						var item = res.body.data[0];
						item.additionalInfo = {description: 'first updated'};
						item.type = {code: 'FU', name: 'Fuses'};
						agent
						.post('/api/updateEntry')
						.send({item: item})
						.end(function(err, res) {
							(res.status).should.equal(200);
							(res.body.additionalInfo.description).should.match(/first updated/i);
							done();
						});
					}
				});
			});

			it('POST api/deleteEntryById', function(done) {
				function delay() {
					agent
					.post('/api/getEntries')
					.send({type: 'FU', filters: {'additionalInfo.description': 'first updated'}})
					.end(function(err, res) {
						(res.status).should.equal(200);
						(res.body.data.length).should.equal(1);
						if(res.body.data[0])
						{
							agent
							.post('/api/getEntryById')
							.send({_id: res.body.data[0]._id})
							.end(function(err, result) {
								(result.status).should.equal(200);
								var item = result.body;
								(item.catalog).should.match(/asasd/i);
								agent
								.post('/api/deleteEntryById')
								.send({_id: item._id})
								.end(function(err, result3) {
									(result3.status).should.equal(200);
									done();
								});
							});
						}
					});
				}
				setTimeout(delay, 0);
			});

			it('POST api/checkCatUnique should return with 200', function(done) {
				agent
				.post('/api/getEntries')
				.send({type: 'FU', filters: {'additionalInfo.description': 'second'}})
				.end(function(err, res) {
					(res.status).should.equal(200);
					(res.body.data.length).should.equal(1);
					if(res.body.data[0])
					{
						var item = res.body.data[0];
						item.type = {code: 'FU', name: 'Fuses'};
						agent
						.post('/api/checkCatUnique')
						.send(item)
						.end(function(err, res) {
							(res.status).should.equal(200);
							(res.body.unique).should.equal(false);
							done();
						});
					}
				});
			});

			it('GET /signout should logout', function(done){
				agent
				.get('/signout')
				.end(function(err, res){
					(res.status).should.equal(302);
					done();
				});
			});

            //Testing Access of different APIs
			it('POST /api/updateCatalog shoud return unauthorized 401', function(done) {
				agent
				.post('/api/updateCatalog')
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});

			it('POST /api/updateEntry shoud return unauthorized 401', function(done) {
				agent
				.post('/api/updateEntry')
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});

			it('POST /api/deleteEntryById shoud return unauthorized 401', function(done) {
				agent
				.post('/api/deleteEntryById')
				.end(function(err, res) {
					(res.status).should.equal(401);
					done();
				});
			});

		});
	});

	after(function(done) {
		User.remove().exec(function(){
			SchematicComponent.remove().exec(function() {
				SchematicStandard.remove().exec(function() {
					CatalogSchem.remove().exec(function() {
						setTimeout(done, 500);
					});
				});
			});
		});
	});
});