'use strict';

var parser = require('../../public/js/DataFileParser');
var Inst = new parser();
var mongoose = require('mongoose');
var ComponentSchem = mongoose.model('SchematicComponent');
var StandardSchem = mongoose.model('SchematicStandard');
var SchematicVersions = mongoose.model('Schematic__versions');
var Users = mongoose.model('User');
var error = require('../utils/error');
var formidable = require('formidable');
var fs = require('fs');
var g_mapping;
var _ = require('underscore');
var shardingService = require('./shardservice');
var populateComponents;

var shardPublishedComponent = function(id, version){
    ComponentSchem.VersionedModel.findOne({refId: id}, function(err, versionedModel) {
        if(err){
            console.error(err);
            return;
        }
        if(!versionedModel){
            console.error('The versionedModel was ', versionedModel);
            return;
        }
        //now find the version which was published
        var index =  (version) ? version -1 : 0;
        var modelVersion = versionedModel.versions[index];
        if (!modelVersion){
            console.error( 'No such version of component ', id);
            console.error( 'version ', version);
            return;
        }

        // if already there then do nothing
        if (modelVersion.acad360l)
            return;

        var files = [];
        var downloadLink = modelVersion.dl;
        //get filename
        var fileName = downloadLink.substr(downloadLink.lastIndexOf('/')+1);
        files.push({url:downloadLink, name:fileName});

        //shard the files
        shardingService.sendFilesForSharding(files, function(error, res, drawingId){
            if (undefined === drawingId || 0 === drawingId){
                if (error)
                    console.error(error);
                console.error('Cannot shard component of Id', id);
                return;
            }
            else{
                // update the versioned model
                modelVersion.acad360l = drawingId;
                versionedModel.save(function (err, product, numberAffected){
                    if (err)
                        console.error(err);
                    console.log('The number of updated documents was %d', numberAffected);
                    console.log('The product was ', product);
                });
            }
        });//shard
    });// find component
};

var escape_regex = function(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

var findThumbnail = function(thumbnail) {
	if(!g_mapping)
		return null;
	var first_brack = thumbnail.indexOf('(');
	var last_brack = thumbnail.indexOf(')');
	if(first_brack === -1 || last_brack === -1)
		return null;
	var location = thumbnail.substring(0, first_brack)+'/'+thumbnail.substring(first_brack+1, last_brack);
	var matchstring = '^.*'+escape_regex(location)+'\\.bmp$';
	var reg = new RegExp(matchstring, 'i');
	for (var i = g_mapping.length - 1; i >= 0; i--) {
		var json = g_mapping[i];
		if(reg.test(json.name))
		{
			return json.dl_url;
		}
	}
	return null;
};

var findDl = function(id) {
	if(!g_mapping)
		return null;
	var matchstring = '^.*'+escape_regex(id)+'\\.dwg$';
	var reg = new RegExp(matchstring, 'i');
	for (var i = g_mapping.length - 1; i >= 0; i--) {
		var json = g_mapping[i];
		if(reg.test(json.name))
		{
			return json.dl_url;
		}
	}
	return null;
};

var createComponent = function(child, parent, std) {
	var component = new ComponentSchem({
		name: child.isComponent? child.name: child.title,
		parentNode: parent,
		id: child.isComponent? child.component: child.id,
		standard: std,
		thumbnail: (child.thumbnail === 'none')? null: findThumbnail(child.thumbnail),
		dl: child.isComponent? findDl(child.component): null,
		acad360l: null,
		isComposite: !child.isComponent,
		published: 0,
		version: 1,
		dateModified: new Date()
	});
	component.save(function(err) {
		if(err) return console.log(err);
		if(component.isComposite)
			populateComponents(child.children, component._id, std);
	});
};

var populateComponents = function(children, parent, std) {
	for (var i = children.length - 1; i >= 0; i--) {
		var child = children[i];
		createComponent(child, parent, std);
	}
};

var populateSchematic = function(res, root, fields) {
	var standard = new StandardSchem({
		name: root.title,
		description: fields.description
	});
	standard.save(function(err) {
		if(err) {
			return error.sendGenericError(res, 400, 'Error Encountered');
		}
		var standardId = standard._id;
		populateComponents([root], null, standardId);
		res.status(200).send();
	});
};

var parseFiles = function(res, fields, files) {
	if(!files)
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	var jsonBuffer = fs.readFileSync(files.jsonFile.path, 'utf8');
	var datBuffer = fs.readFileSync(files.datFile.path, 'utf8');
	g_mapping = JSON.parse(jsonBuffer);
	var parse_result = Inst.parse(datBuffer);
	var generate_result = Inst.generateSubMenuHierachy();
	if(parse_result !== 'Success' || generate_result!== 'Success')
		return error.sendGenericError(res, 400, 'Error Encountered');
	var root = Inst.rootNode;
	populateSchematic(res, root, fields);
};

var removeStandardByName = function(name)
{
	StandardSchem
		.findOne({name: name})
		.exec(function(err, standard) {
			if(err)
				return console.log(err);
			if(!standard)
				return console.log('Standard Not found');
			standard.remove();
			return;
		});
};

var deleteChildren = function(id, callback, res) {
	ComponentSchem
		.findOne({_id: id})
		.exec(function(err, component) {
			if(err)
				return callback(err, null, res);
			if(!component)
				return callback('Component Not found', null, res);
			if(!component.parentNode)
			{
				removeStandardByName(component.name);
			}
			var found = [];
			var total = 0;
			var processed = 0;
			function isComposite(child) {
				if(child.isComposite) {
					deleteChildren(child._id, function(err, data) {
						found = found.concat(data);
						if(err)
						{
							return callback(err, found, res);
						}
						if(++processed === total) {
							callback(null, found, res);
						}
					}, res);
				}
				else {
					found.push(child._id);
					child.remove();
					if(++processed === total) {
						callback(null, found, res);
					}
				}
			}
			if(component.isComposite)
			{
				ComponentSchem
					.find({parentNode: component._id})
					.exec(function(err, children) {
						if (err) {
							return callback(err, found, res);
						}
						total = children.length;
						if(total === 0)
						{
							return callback(null, found, res);
						}
						for (var i = total - 1; i >= 0; i--) {
							isComposite(children[i]);
						}
					});
				component.remove();
			}
			else {
				component.remove();
				callback(null, [component._id], res);
			}
		});
};

exports.receiveFiles = function(req, res) {
	var form = new formidable.IncomingForm();
	return form.parse(req, function(err, fields, files) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!files.jsonFile || !files.datFile)
			return error.sendGenericError(res, 400, 'Error Encountered');
		return parseFiles(res, fields, files);
	});
};

exports.isUniqueId = function(req,res) {
	if(!req.body.standardId || !req.body.id)
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	var s_id = req.body.standardId, id = req.body.id, _id = req.body._id;
	ComponentSchem.find({standard: s_id}).exec(function(err, components) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!components || components.length === 0)
			return error.sendGenericError(res, 400, 'Error Encountered');
		var checked = 0;
		var status = true;
		var getVersion = function(i)
		{
			SchematicVersions.findOne({refId: components[i]._id}).exec(function(err, version) {
				if(err)
					console.log(err);
				else if(!version)
					console.log('No available version');
				else
				{
					if(components[i].published)
					{
						if(!!!_id || (!!_id && JSON.stringify(components[i]._id) !== JSON.stringify(_id) ))
						{
							var published = components[i].published - 1;
							var published_version = JSON.parse(JSON.stringify(version.versions[published]));
							if(published_version.id === id)
								status = false;
						}
					}
				}
				if(++checked === components.length)
				{
					res.jsonp({'unique': status});
				}
			});
			return;
		};
		for (var i = components.length - 1; i >= 0; i--) {
			getVersion(i);
		}
	});
};

function getComponentsByVersion(condition, res, obj) {
	ComponentSchem
		.find(condition)
		.populate('standard')
		.populate('parentNode')
		.lean()
		.exec(function(err, components) {
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			if(!components || components.length === 0)
				return res.jsonp(obj? {'children': []}: []);
			var checked = 0;
			var getVersion = function(i)
			{
				SchematicVersions.findOne({refId: components[i]._id}).lean().exec(function(err, version) {
					if(err)
						console.log(err);
					else if(!version)
						console.log('No available version');
					else
					{
						var published = (components[i].published)? (components[i].published - 1): 0;
						var published_version = JSON.parse(JSON.stringify(version.versions[published]));
						var omit = ['refVersion', 'version', 'published', 'standard', 'parentNode', '_id', '__v'];
						published_version = _.omit(published_version, omit);
						_.extend(components[i], published_version);
					}
					if(++checked === components.length)
					{
						res.jsonp(obj? {'children': components}: components);
					}
				});
				return;
			};
			for (var i = components.length - 1; i >= 0; i--) {
				getVersion(i);
			}
		});
}

exports.getNodeChildren = function(req, res) {
	if(!req.node)
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	var id = req.node._id;
	var default_retrieval = {parentNode: id};
	var adminCheck = req.user? (req.user.isAdmin? true: false): false;
	if(!adminCheck)
		default_retrieval.published = {$ne: 0};
	getComponentsByVersion(default_retrieval, res, true);
};

exports.getMultiple = function(req, res) {
	if(!req.body.items)
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	var default_retrieval = {_id: {$in: req.body.items}};
	var adminCheck = req.user? (req.user.isAdmin? true: false): false;
	if(!adminCheck)
		default_retrieval.published = {$ne: 0};
	getComponentsByVersion(default_retrieval, res, false);
};

exports.getEntireStandard = function(req, res) {
	if(!req.body.name)
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	StandardSchem.findOne({name: req.body.name}).exec(function(err, standard) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!standard)
			return error.sendGenericError(res, 400, 'Error Encountered');
		var default_retrieval = {standard: standard._id};
		var adminCheck = req.user? (req.user.isAdmin? true: false): false;
		if(!adminCheck)
			default_retrieval.published = {$ne: 0};
		getComponentsByVersion(default_retrieval, res, false);
	});
};

var deleteFavsAssociation = function(err, data, res) {
	if(!err)
		res.send(200);
	else
		return error.sendGenericError(res, 400, 'Error Encountered');
	Users.find({$or: [{'SchemFav.schematicId': {$in: data}}, {'associations.schematicId': {$in: data}}]}, function(err, users) {
		if(err)
			return console.log(err);
		if(!users)
			return;
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			for (var j = 0; j < data.length; j++) {

				for (var l = 0; l < user.SchemFav.length; l++) {
					if(JSON.stringify(user.SchemFav[l].schematicId) === JSON.stringify(data[j]))
					{
						user.SchemFav.splice(l, 1);
						l--;
					}
				}
				for (var k = 0; k < user.associations.length; k++) {
					if(JSON.stringify(user.associations[k].schematicId) === JSON.stringify(data[j]))
					{
						user.associations.splice(k, 1);
						k--;
					}
				}
			}
			user.save();
		}
	});
};

exports.delete = function(req, res) {
	if(!req.node)
	{
		return error.sendGenericError(res, 400, 'Error Encountered');
	}
	deleteChildren(req.node._id, deleteFavsAssociation, res);
};

exports.editStd = function(req,res){
	if(!req.body.standardId)
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	var standard = {};
	if (req.body.hasOwnProperty('stdName'))
		standard.name = req.body.stdName;
	if (req.body.hasOwnProperty('desc'))
		standard.description = req.body.desc;
	StandardSchem
	.findOne({_id: req.body.standardId}, function(err, fetchedStandard){
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!fetchedStandard)
			return error.sendGenericError(res, 400, 'Error Encountered');
		_.extend(fetchedStandard, standard);
		fetchedStandard.save(function(err) {
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			if(standard.name)
			{
				ComponentSchem.findOne({standard: req.body.standardId, parentNode: null}, function(err, component) {
					if(err)
						return error.sendGenericError(res, 400, 'Error Encountered');
					if(!component)
						return error.sendGenericError(res, 400, 'Error Encountered');
					component.name = standard.name;
					component.save(function(err) {
						if(err)
							return console.log(err);
						return res.jsonp(fetchedStandard);
					});
				});
			}
			else
				return res.jsonp(fetchedStandard);
		});
	});
};

exports.editComponent = function(req, res){
	if(!req.body.node || !req.body.node._id)
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	var component = req.body.node;
	ComponentSchem
	.findOne({_id: req.body.node._id}, function(err, fetchedComponent){
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!fetchedComponent)
			return error.sendGenericError(res, 400, 'Error Encountered');
		var old_name = fetchedComponent.name;
		delete component.published;
		delete component.version;
		_.extend(fetchedComponent, component);
		fetchedComponent.version++;
		fetchedComponent.dateModified = new Date();
		if(fetchedComponent.isComposite)
			fetchedComponent.published++;
		fetchedComponent.save(function(err) {
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			if(!fetchedComponent.parentNode && component.name)
			{
				return StandardSchem.findOne({name: old_name}, function(err, standard) {
					if(err)
						return error.sendGenericError(res, 400, 'Error Encountered');
					if(!standard)
						return error.sendGenericError(res, 400, 'Error Encountered');
					standard.name = component.name;
					standard.save(function(err) {
						if(err)
							return error.sendGenericError(res, 400, 'Error Encountered');
						return res.jsonp(fetchedComponent);
					});
				});
			}
			return res.jsonp(fetchedComponent);
		});
	});
};

exports.getParentHiearchy = function(req, res) {
	if(!req.node)
	{
		return error.sendGenericError(res, 400, 'Error Encountered');
	}
	var list = [];
	var parent = req.node.parentNode;
	list.push({'title': req.node.name, 'link': req.node._id});
	if(parent === null)
	{
		return res.jsonp({'parentHiearchy': list});
	}
	(function genHiearchy(parentId) {
		ComponentSchem
		.findOne({_id: parentId})
		.lean()
		.exec(function(err, component) {
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			list.push({'title': component.name, 'link': component._id});
			if(component.parentNode)
			{
				genHiearchy(component.parentNode);
			}
			else
			{
				return res.jsonp({'parentHiearchy': list.reverse()});
			}
		});
	})(parent);
};


exports.getAllSchemStds = function(req, res) {
	var adminCheck = req.user? (req.user.isAdmin? true: false): false;
	ComponentSchem
		.find({
			parentNode: null,
		})
		.populate('standard')
		.lean()
		.exec(function(err, components) {
			if (err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			return res.jsonp(_.filter(components, function(value) {
				if(value.published === 0 && !adminCheck)
					return false;
				else
					return true;
			}));
		});
};


exports.node = function(req, res, next, id) {
	ComponentSchem
		.findOne({
			_id: id
		})
		.lean()
		.exec(function(err, component) {
			if (err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			if (!component)
				return error.sendGenericError(res, 400, 'Error Encountered');
			req.node = component;
			next();
		});
};


exports.getNode = function(req,res){
	if (!req.node)
		return error.sendGenericError(res, 400, 'Error Encountered');
	var component = req.node;
	if(!component.published && !req.user.isAdmin)
		return error.sendGenericError(res, 400, 'Error Encountered');
	if(component.isComposite)
		return res.jsonp(component);
	SchematicVersions.findOne({refId: component._id}).exec(function(err, version) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		else if(!version)
			return error.sendGenericError(res, 400, 'Error Encountered');
		else
		{
			var published = (component.published)? (component.published - 1): 0;
			var published_version = JSON.parse(JSON.stringify(version.versions[published]));
			var omit = ['refVersion', 'version', 'published', 'standard', 'parentNode', '_id', '__v'];
			published_version = _.omit(published_version, omit);
			_.extend(component, published_version);	
			res.jsonp(component);
		}
	});
};

exports.createNode = function(req,res){
	if(!req.body.node)
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	var node = req.body.node;
	if(!node.parentNode)
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	ComponentSchem.findOne({_id: node.parentNode}, function(err, component) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!component)
			return error.sendGenericError(res, 400, 'Error Encountered');
		var child_component = new ComponentSchem({
				name: node.name,
				parentNode: node.parentNode,
				id: node.id,
				standard: node.standard,
				thumbnail: node.thumbnail,
				dl: node.dl,
				acad360l: null,
				isComposite: node.isComposite,
				published: node.isComposite? 1: 0,
				version: 1,
				dateModified: new Date()
			});
		child_component.save(function(err) {
			if(err) return error.sendGenericError(res, 400, 'Error Encountered');
			return res.jsonp(child_component);
		});
	});
};

exports.getVersions = function(req, res) {
	if(!req.body._id)
	{
		return error.sendGenericError(res, 400, 'Error Encountered');
	}
	var id = req.body._id;
	ComponentSchem.findOne({_id: id}).exec(function(err, component) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!component || (component && component.isComposite))
			return error.sendGenericError(res, 400, 'Error Encountered');
		SchematicVersions.findOne({refId: id}).exec(function(err, version) {
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			if(!version)
				return error.sendGenericError(res, 400, 'Error Encountered');
			return res.jsonp(version);
		});
	});
};

exports.publishStandard = function(req, res) {
	if(!req.body.hasOwnProperty('std_id'))
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	ComponentSchem.find({standard: req.body.std_id}).exec(function(err, components) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		for (var i = 0; i < components.length; i++) {
			if(!components[i].published)
			{
				components[i].published = 1;
				components[i].save();
			}
		}
		res.send(200);
	});
};

exports.unpublishStandard = function(req, res) {
	if(!req.body.hasOwnProperty('std_id'))
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	ComponentSchem.find({standard: req.body.std_id}).exec(function(err, components) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		for (var i = 0; i < components.length; i++) {
			if(components[i].published)
			{
				components[i].published = 0;
				components[i].save();
			}
		}
		res.send(200);
	});
};

exports.publishComponent = function(req, res){
	if(!req.body.hasOwnProperty('_id') || !req.body.hasOwnProperty('number'))
	{
		return error.sendGenericError(res, 400, 'Error Encountered');
	}
	var id = req.body._id;
	var number = req.body.number;
	ComponentSchem.findOne({_id: id}).exec(function(err, component) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!component)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(component.version < number)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(component.isComposite)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(component.published === number)
			return res.send(200);
		component.published = number;
        if (number !== 0){
            shardPublishedComponent(id);
        }
        component.save(function(err) {
            if(err)
                return error.sendGenericError(res, 400, 'Error Encountered');
            return res.send(200);
        });
	});
};
