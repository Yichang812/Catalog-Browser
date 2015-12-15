'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    ComponentSchem = mongoose.model('SchematicComponent'),
    SchematicVersions = mongoose.model('Schematic__versions'),
    CatSchem = mongoose.model('Catalog'),
    MepCatSchem = mongoose.model('MEPCatalog'),
    error = require('../utils/error'),
    _ = require('underscore');

var logger = require('../utils/logger');
/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
    res.redirect('/');
};

/**
 * Logout
 */
exports.signout = function(req, res) {
    if(req.user)
    {
        var user = req.user;
        user.lastLogout = new Date();
        user.save(function(err) {
            if(err) console.log(err);
        });
    }
    req.logout();
    res.redirect('/');
    logger.info('signout');
};


/**
 * Session
 */
exports.session = function(req, res) {
    res.redirect('/');
};


/**
 * Send User
 */
exports.me = function(req, res) {
    res.jsonp(req.user || null);
};


/**
 * Make Admin
 */
exports.makeAdmin = function(req, res) {
    if(req.profile)
    {
        var admin = req.profile;
        admin.isAdmin = true;
        admin.save(function(err) {
            if(err)
            {
                return error.sendGenericError(res, 400, 'Error Encountered');
            }
            else
            {
                res.redirect('/');
            }
        });
        return;
    }
    return error.sendGenericError(res, 400, 'Error Encountered');
};

/**
 * Update Profile
 */
exports.updateCodeName = function(req, res) {
    if(req.user)
    {
        var updatedProfile = req.user;
        updatedProfile.codeName = req.params.codeName;
        updatedProfile.isManufacturer = false;
        updatedProfile.save(function(err) {
            if(err)
            {
                return error.sendGenericError(res, 400, 'Error Encountered');
            }
            else
            {
                res.jsonp(updatedProfile);
            }
        });
        return;
    }
    return error.sendGenericError(res, 400, 'Error Encountered');
};

exports.updateUserDefPrdt = function(req, res) {
    if(req.user)
    {
        var updatedProfile = req.user;
        updatedProfile.userDefPrdt = req.params.userDefPrdt;
        updatedProfile.save(function(err) {
            if(err)
            {
                return error.sendGenericError(res, 400, 'Error Encountered');
            }
            else
            {
                res.jsonp(updatedProfile);
            }
        });
        return;
    }
    return error.sendGenericError(res, 400, 'Error Encountered');
};

exports.updateUserPrdt = function(req, res) {
    if(req.user)
    {
        var updatedProfile = req.user;
         console.log(req.body);       
        updatedProfile.userPrdt = req.body.userPrdt;
        updatedProfile.save(function(err) {
            if(err)
            {
                return error.sendGenericError(res, 400, 'Error Encountered');
            }
            else
            {
                res.jsonp(updatedProfile);
            }
        });
        return;
    }
    return error.sendGenericError(res, 400, 'Error Encountered');
};

/**
 * Send All Users
 */
exports.all = function(req, res) {
    var count = false, limit = 100, skip = 0;
    if(req.body.count)
        count = req.body.count;
    if(req.body.limit)
        limit = req.body.limit;
    if(req.body.lowerLimit)
        skip = req.body.lowerLimit;
    var filterCriteria = {};
    var hint = null;
    if(req.body.showMan) {
        filterCriteria.isManufacturer = true;
        hint = {isManufacturer: 1};
    }
    if(req.body.showUsers) {
        filterCriteria.isAdmin = true;
        hint = {isAdmin: 1};
    }
    if(req.body.search)
    {
        filterCriteria.name = new RegExp(req.body.search.trim(), 'i');
        hint = {name: 1};
    }
    if(count === true){
        User.count(filterCriteria).exec(function(err, count){
            if(err)
                error.sendGenericError(res, 400, 'Error Encountered');
            res.jsonp({count:count});
        });
    }
    else{
        var query = User.find(filterCriteria).skip(skip).sort('name').limit(limit).lean();
        if(hint)
            query = query.hint(hint);
        query.exec(function(err,users){
            if(err)
                error.sendGenericError(res, 400, 'Error Encountered');
            res.jsonp({users:users} || null);
        });
    }
};


/**
 * Change User Status
 */
exports.changeStatus = function(req,res) {
    var user = req.profile;
    if(!user.codeName)
        return error.sendGenericError(res, 400, 'Error Encountered');
    user.isManufacturer = !user.isManufacturer;
    user.save(function(err) {
        if (err) {
            return error.sendGenericError(res, 400, 'Error Encountered');
        } else {
            res.jsonp(user);
        }
    });
};

/**
 * Change User Schematic Favourites
 */
exports.addSchemFavourite = function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('_id'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    if(!req.body.hasOwnProperty('number'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    var id = req.body._id;
    var number = req.body.number;
    ComponentSchem.findOne({_id: id}, function(err, component) {
        if(err)
            return error.sendGenericError(res, 400, 'Error Encountered');
        if(!component)
            return error.sendGenericError(res, 400, 'Error Encountered');
        if(component.published === 0)
            return error.sendGenericError(res, 400, 'Error Encountered');
        var list = _.map(req.user.SchemFav, function(obj) { return JSON.stringify(obj.schematicId); });
        if(list.indexOf(JSON.stringify(id)) < 0)
        {
            req.user.SchemFav.push({schematicId: id, iconVersion: number});
            req.user.save(function(err) {
                if(err)
                    return error.sendGenericError(res, 400, 'Error Encountered');
                res.jsonp(req.user.SchemFav);
            });
            return;
        }
        else
            return error.sendGenericError(res, 400, 'Error Encountered');
    });
};

exports.removeSchemFavourite = function(req,res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('_id'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    var id = JSON.stringify(req.body._id);
    var list = _.map(req.user.SchemFav, function(obj) { return JSON.stringify(obj.schematicId); });
    var index = list.indexOf(id);
    if(index > -1)
    {
        req.user.SchemFav.splice(index, 1);
        req.user.save(function(err) {
            if(err)
                return error.sendGenericError(res, 400, 'Error Encountered');
            res.jsonp(req.user.SchemFav);
        });
        return;
    }
    else
        return error.sendGenericError(res, 400, 'Error Encountered');
};

exports.updateSchemFavourite = function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('_id'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    var id = req.body._id;
    ComponentSchem.findOne({_id: id}, function(err, component) {
        if(err)
            return error.sendGenericError(res, 400, 'Error Encountered');
        if(!component)
            return error.sendGenericError(res, 400, 'Error Encountered');
        var list = _.map(req.user.SchemFav, function(obj) { return JSON.stringify(obj.schematicId); });
        var index = list.indexOf(JSON.stringify(id));
        if(index > -1)
        {
            req.user.SchemFav[index].iconVersion = component.published;
            req.user.save(function(err) {
                if(err)
                    return error.sendGenericError(res, 400, 'Error Encountered');
                res.jsonp(req.user.SchemFav);
            });
            return;
        }
        else
            return error.sendGenericError(res, 400, 'Error Encountered');
    });
};

exports.getSchemFavourites = function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    ComponentSchem.find({_id: {$in: _.map(req.user.SchemFav, function(obj){ if (obj.schematicId !== undefined)return obj.schematicId; return null; })}, isComposite: false}).lean().exec(function(err, components) {
        if(err)
        {
            // no need to return 400 here, this just means that user doesnt have any fav.
            //return error.sendGenericError(res, 400, 'Error Encountered');
            return;
        }
            
        if(!components || components.length === 0)
            return res.jsonp({'schematic': components});
        var checked = 0;
        var getVersion = function(i)
        {
            SchematicVersions.findOne({refId: components[i]._id}).exec(function(err, version) {
                if(err)
                    console.log(err);
                else if(!version)
                    console.log('No available version');
                else
                {
                    var findIconVersion = _.find(req.user.SchemFav, function(obj) { return JSON.stringify(obj.schematicId) === JSON.stringify(components[i]._id); });
                    var published = findIconVersion.iconVersion? (version.versions[findIconVersion.iconVersion - 1]? findIconVersion.iconVersion - 1: 0): -1;
                    if(published > -1)
                    {
                        var published_version = JSON.parse(JSON.stringify(version.versions[published]));
                        var omit = ['refVersion', 'version', 'published', 'standard', 'parentNode', '_id', '__v'];
                        published_version = _.omit(published_version, omit);
                        _.extend(components[i], published_version);
                        if(components[i].published === 0)
                        {
                            components[i] = _.pick(components[i], ['name', '_id', 'published', 'version']);
                        }
                    }

                }
                if(++checked === components.length)
                {
                    res.jsonp({'schematic': components});
                }
            });
            return;
        };
        for (var i = components.length - 1; i >= 0; i--) {
            getVersion(i);
        }
    });
};

exports.getFilters = function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if (req.body.product === 'AutoCAD MEP') {
        return res.jsonp(req.user.mepCatalogFilters);
    }
    else
        return res.jsonp(req.user.catalogFilters);
};

exports.addFilter = function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('filter'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');

    var productFilter;
    if (req.body.filter.hasOwnProperty('product') && req.body.filter.product === 'AutoCAD MEP') 
        productFilter = req.user.mepCatalogFilters; 
    else 
        productFilter = req.user.catalogFilters;

    var name = req.body.name;
    var list = _.map(productFilter, function(object) {return object.name.toLowerCase();});
    if(list.indexOf(name.toLowerCase()) > -1)
    {
        return error.sendGenericError(res, 400, 'Error Encountered');
    }
    productFilter.push({name: name, filter: req.body.filter});
    req.user.save(function(err) {
        if(err)
            return error.sendGenericError(res, 400, 'Error Encountered');
        res.jsonp(productFilter);
    });
};

exports.removeFilter = function(req,res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('name'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');

    var productFilter;
    if (req.body.product === 'AutoCAD MEP')
        productFilter = req.user.mepCatalogFilters;
    else
        productFilter = req.user.catalogFilters;

    var name = req.body.name;
    var list = _.map(productFilter, function(object) {return object.name.toLowerCase();});
    if(list.indexOf(name.toLowerCase()) > -1)
    {
        productFilter.splice(list.indexOf(name.toLowerCase()), 1);
        req.user.save(function(err) {
            if(err)
                return error.sendGenericError(res, 400, 'Error Encountered');
            res.jsonp(productFilter);
        });
        return;
    }
    else {
        return error.sendGenericError(res, 400, 'Error Encountered');
    }
};

exports.getCatFavourite = function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    var favList, favType; 
    if (req.body.product === 'AutoCAD MEP') {
        favList = MepCatSchem;
        favType = req.user.mepFav;
    }
    else {
        favList = CatSchem;
        favType = req.user.catFav;
    }
    favList.find({_id: {$in: favType}}).lean().exec(function(err, entries) {
        if(err) {
            return error.sendGenericError(res, 400, 'Error Encountered');
        }
        res.jsonp(entries);
    });
};

exports.addCatFavourite= function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('items'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    var favList, favType; 
    if (req.body.product === 'AutoCAD MEP') {
        favList = MepCatSchem;
        favType = req.user.mepFav;
    }
    else {
        favList = CatSchem;
        favType = req.user.catFav;
    }
    var items = req.body.items;
    favList.find({_id: {$in: items}}).lean().exec(function(err, entries) {
        if(err)
            return error.sendGenericError(res, 400, 'Error Encountered');
        if(entries.length === 0)
            return error.sendGenericError(res, 400, 'Error Encountered');
        for (var i = entries.length - 1; i >= 0; i--) {
            var id = entries[i]._id;
            if(favType.indexOf(id) < 0)
            {
                favType.push(id);
            }  
        }
        req.user.save(function(err) {
            if(err)
                return error.sendGenericError(res, 400, 'Error Encountered');
            res.jsonp({'favourites': favType});
        });
    });
};

exports.removeCatFavourite= function(req,res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('_id'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    var favType; 
    if (req.body.product === 'AutoCAD MEP') {
        favType = req.user.mepFav;
    }
    else {
        favType = req.user.catFav;
    }
    var _id = req.body._id;
    var index = favType.indexOf(_id);
    if(index > -1)
    {
        favType.splice(index, 1);
        req.user.save(function(err) {
            if(err)
                return error.sendGenericError(res, 400, 'Error Encountered');
            res.jsonp({'favourites': favType});
        });
        return;
    }
    else {
        return error.sendGenericError(res, 400, 'Error Encountered');
    }
};

exports.getAssociations = function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    ComponentSchem.find({_id: {$in: _.map(req.user.associations, function(obj){ return obj.schematicId; })}, isComposite: false}).populate('standard').lean().exec(function(err, components) {
        if(err)
            return error.sendGenericError(res, 400, 'Error Encountered');
        if(!components || components.length === 0)
            return res.jsonp(components);
        var checked = 0;
        var getVersion = function(i)
        {
            SchematicVersions.findOne({refId: components[i]._id}).exec(function(err, version) {
                if(err)
                    console.log(err);
                else if(!version)
                    console.log('No available version');
                else
                {
                    var findIconVersion = _.find(req.user.associations, function(obj) { return JSON.stringify(obj.schematicId) === JSON.stringify(components[i]._id); });
                    var published = findIconVersion? (version.versions[findIconVersion.iconVersion - 1]? findIconVersion.iconVersion - 1: 0): -1;
                    if(published > -1)
                    {
                        var published_version = JSON.parse(JSON.stringify(version.versions[published]));
                        var omit = ['refVersion', 'version', 'published', 'standard', 'parentNode', '_id', '__v'];
                        published_version = _.omit(published_version, omit);
                        _.extend(components[i], published_version);
                        if(components[i].published === 0)
                        {
                            components[i] = _.pick(components[i], ['name', '_id', 'published', 'version', 'standard']);
                        }
                    }

                }
                if(++checked === components.length)
                {
                    res.jsonp(components);
                }
            });
            return;
        };
        for (var i = components.length - 1; i >= 0; i--) {
            getVersion(i);
        }
    });
};

exports.addAssociation = function(req, res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('items') || !req.body.hasOwnProperty('_id'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    if(!req.body.hasOwnProperty('number'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    var items = req.body.items;
    var number = req.body.number;
    if(items.length === 0)
        return error.sendGenericError(res, 400, 'Error Encountered');
    var _id = req.body._id;
    var entry;
    var checker = function(obj) {
        if(entry && JSON.stringify(obj.catalogId) === JSON.stringify(entry._id) && JSON.stringify(obj.schematicId) === JSON.stringify(_id))
        {
            return true;
        }
        return false;
    };
    ComponentSchem.findOne({_id: _id}).lean().exec(function(err, component) {
        if(err)
            return error.sendGenericError(res, 400, 'Error Encountered');
        if(!component)
            return error.sendGenericError(res, 400, 'Error Encountered');
        if(component.isComposite)
            return error.sendGenericError(res, 400, 'Error Encountered');
        if(component.published === 0)
            return error.sendGenericError(res, 400, 'Error Encountered');
        CatSchem.find({_id: {$in: items}}).lean().exec(function(err, entries) {
            if(err)
                return error.sendGenericError(res, 400, 'Error Encountered');
            var associations = req.user.associations;
            for (var i = 0; i < entries.length; i++) {
                entry = entries[i];
                if(!associations || (associations && _.filter(associations, checker).length === 0))
                {
                    associations.push({catalogId: entry._id, schematicId: _id, iconVersion: number});
                }
            }
            req.user.associations = associations;
            req.user.save(function(err) {
                if(err)
                    return error.sendGenericError(res, 400, 'Error Encountered');
                else
                    res.jsonp(req.user.associations);
            });
        });
    });
};

exports.updateAssociation = function(req,res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('item') || !req.body.hasOwnProperty('_id'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    var item = JSON.stringify(req.body.item);
    var _id = JSON.stringify(req.body._id);
    var list = req.user.associations;
    ComponentSchem.findOne({_id: req.body._id}).lean().exec(function(err, component) {
        if(err)
        {
            return error.sendGenericError(res, 400, 'Error Encountered1');
        }
        if(!component)
            return error.sendGenericError(res, 400, 'Error Encountered2');
        if(component.isComposite)
            return error.sendGenericError(res, 400, 'Error Encountered3');
        var callback = function(err) {
            if(err)
            {
                return error.sendGenericError(res, 400, 'Error Encountered4');
            }
            res.jsonp(req.user.associations);
        };
        for (var i = 0; i < list.length; i++) {
            if(JSON.stringify(list[i].catalogId) === item && JSON.stringify(list[i].schematicId)=== _id)
            {
                req.user.associations[i].iconVersion = component.published;
                req.user.save(callback);
                return;
            }
        }
        return error.sendGenericError(res, 400, 'Error Encountered');
    });
};

exports.removeAssociation = function(req,res) {
    if(!req.user)
        return error.sendUnauthorizedError(res);
    if(!req.body.hasOwnProperty('item') || !req.body.hasOwnProperty('_id'))
        return error.sendGenericError(res, 400, 'Invalid Parameters');
    var item = JSON.stringify(req.body.item);
    var _id = JSON.stringify(req.body._id);
    var list = req.user.associations;
    var callback = function(err) {
        if(err)
            return error.sendGenericError(res, 400, 'Error Encountered');
        res.jsonp(req.user.associations);
    };
    for (var i = 0; i < list.length; i++) {
        if(JSON.stringify(list[i].catalogId) === item && JSON.stringify(list[i].schematicId)=== _id)
        {
            req.user.associations.splice(i, 1);
            req.user.save(callback);
            return;
        }
    }
    return error.sendGenericError(res, 400, 'Error Encountered');
};


/**
 * Find user by Id
 */
exports.user = function(req,res,next,id) {
    User
        .findOne({
            _id: id
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to find User ' + id));
            req.profile = user;
            next();
        });
};

/**
 * Find user by name
 */
exports.findByName = function(req, res, next, name) {
    User
        .findOne({
            name: name
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to find User ' + name));
            req.profile = user;
            next();
        });
};