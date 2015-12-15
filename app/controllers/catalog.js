'use strict';

var mongoose = require('mongoose');
var CatalogSchem = mongoose.model('Catalog');
var mepCatalogSchem = mongoose.model('MEPCatalog');
var Users = mongoose.model('User');
var error = require('../utils/error');
var _ = require('underscore');
var searchStringParser = require('../utils/searchStringParser');


var isUrl = /^http?:/i;
var isSecureUrl = /^https?:/i;

var convertToUpper = function(item) {
	if(_.isString(item))
		item.toUpperCase();
	else if(_.isArray(item))
	{
		for (var j = 0; j < item.length; j++) {
			if(_.isString(item[j]))
				item[j] = item[j].toUpperCase();
		}
	}
	else if(_.isObject(item))
	{
		for(var i in item)
			if(_.isString(item[i]))
			{
				if(isUrl.test(item[i]) || isSecureUrl.test(item[i]))
				{
					console.log('found url! dun convert to upper');
					continue;
				}
				item[i] = item[i].toUpperCase();
			}
	}
	return item;
};

var createEntry = function(entry, catalog, typeName, typeCode) {
	CatalogSchem.findOne({catalog: catalog, assemblyCode: null, manufacturer: entry.manufacturer, 'type.code': typeCode}).exec(function(err, fetchedEntry) {
		if(err)
			return console.log(err);
		if(!fetchedEntry)
		{
			var additionalInfo = _.omit(entry, ['catalog', 'manufacturer']);
			var newEntry = new CatalogSchem({
				catalog: catalog? catalog.toUpperCase(): null,
				manufacturer: entry.manufacturer? entry.manufacturer.toUpperCase(): null,
				type: {code: typeCode.toUpperCase(), name: typeName},
				assemblyCode: entry.assemblycode? entry.assemblycode.toUpperCase(): null,
				additionalInfo: convertToUpper(additionalInfo)
			});
			newEntry.save(function(err) {
				if(err)
					return console.log(err);
			});
		}
		else{
			var info = _.omit(entry, ['catalog', 'manufacturer']);
			var replacingEntry = {
				catalog: catalog? catalog.toUpperCase(): null,
				manufacturer: entry.manufacturer? entry.manufacturer.toUpperCase(): null,
				type: {code: typeCode.toUpperCase(), name: typeName},
				assemblyCode: entry.assemblycode? entry.assemblycode.toUpperCase(): null,
				additionalInfo: convertToUpper(info)
			};
			_.extend(fetchedEntry, replacingEntry);
			fetchedEntry.save(function(err) {
				if(err)
					return console.log(err);
			});
		}
	});
};

var populateMepCatalog = function(data, user) {
	function checkAuthority() {
		return user.isAdmin || user.isManufacturer;
	}

	function createMepEntry(entry, standard) {
		mepCatalogSchem.findOne({name: entry.name, category: entry.category, standard: standard}).exec(function(err, fetchedEntry) {
			if (err)
				return console.log(err);
			if (!fetchedEntry) {
				var newEntry = new mepCatalogSchem({
					name: entry.name.toUpperCase(),
					category: entry.category,
					image: entry.bmpPath,
					dwgPath: entry.dwgPath,
					standard: standard,
					columnUnique: entry.uniqueColumn,
					basicTable: entry.basicTable,
					constantLists: entry.constantListTable,
					constants: entry.constTable,
					calculations: entry.calcTable
				});
				newEntry.save(function(err) {
					if(err)
						return console.log(err);
				});
			}
			else {
				var replacingEntry = new mepCatalogSchem({
					name: entry.name.toUpperCase(),
					category: entry.category,
					image: entry.bmpPath,
					dwgPath: entry.dwgPath,
					standard: standard,
					columnUnique: entry.uniqueColumn,
					basicTable: entry.basicTable,
					constantLists: entry.constantListTable,
					constants: entry.constTable,
					calculations: entry.calcTable
				});
				_.extend(fetchedEntry, replacingEntry);
				fetchedEntry.save(function(err) {
					if(err)
						return console.log(err);
				});
			}
		});
	}

	_.each(data, function(value, key) {
		if(!key || !value.title)
			return;
	
		var standardName = value.title.toString();
		if (checkAuthority())
			createMepEntry(value.entries, standardName);
	});
};

exports.populateCatalog = function(req, res) {
	if(!req.body.data)
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	var data = req.body.data;
	var user = req.user;
	var one_time_limit = 10000;
	var one_time_delay_ms = 10000;
	function checkAuthority(manufacturerEntry)
	{
		return user.isAdmin? true: (user.codeName.toLowerCase() === manufacturerEntry.toLowerCase());
	}

	function iterate(spliced_entries, typeCode, typeName) {
		for (var i = 0; i < spliced_entries.length; i++) {
			var entry = spliced_entries[i];
			if(entry)
			{
				var catalog = entry.catalog? entry.catalog.replace(' ',''): null;
				if(catalog && checkAuthority(entry.manufacturer.trim())){
					createEntry(entry, catalog, typeName, typeCode);
				}
			}
		}
	}

	function timeout_iteration(j, spliced_entries, typeCode, typeName) {
		setTimeout(function() {iterate(spliced_entries, typeCode, typeName);}, one_time_delay_ms*j);
	}

	if (req.body.data.hasOwnProperty('MEP')) {
		populateMepCatalog(data, user);
	} else {
		_.each(data, function(value, key) {
			if(!key || !value.title)
				return;
		
			var typeCode = key.toString();
			var typeName = value.title.toString();
			if(!value.entries)
				return;
			var iterations = Math.ceil(value.entries.length/one_time_limit);
			for (var j = 0; j < iterations; j++) {
				var spliced_entries = value.entries.splice(0, one_time_limit);
				timeout_iteration(j, spliced_entries, typeCode, typeName);
			}
		});
	}
	res.send(200);
};

exports.getAllUniqueValues = function(req, res) {
	if(!req.body.field || !req.body.type)
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	CatalogSchem.distinct(req.body.field.toLowerCase(), {'type.code': req.body.type}, function(err, result) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		res.jsonp(result);
	});
};

exports.getAllTypes = function(req, res) {
	CatalogSchem.distinct('type', {}, function(err, result) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		res.jsonp(result);
	});
};

exports.getAllFields = function(req, res) {
	if(!req.body.type) {
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	var type = req.body.type;
	CatalogSchem.findOne({'type.code': type}).lean(true).exec(function(err, entry) {
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!entry)
			return error.sendGenericError(res, 400, 'Error Encountered');
		var fields = _.keys(_.omit(entry, ['additionalInfo', '_id', '__v']));
		var additionalInfo = _.keys(entry.additionalInfo);
		fields = _.union(fields, _.map(additionalInfo, function(key) { return 'additionalInfo.'+key; }));
		res.jsonp(fields);
	});
};

exports.getCatalogEntries = function(req, res) {
	var type, selectedStandard, selectedCategory, fields, index_hint, filterCriteria, catalogToQuery;	
	if (req.body.catalogType === 'AutoCAD MEP') {
		if(!req.body.standard && !req.body.category) {
			return error.sendGenericError(res, 400, 'Invalid Parameters');
		}
		selectedStandard = req.body.standard;
		selectedCategory = req.body.category;
		index_hint = {'standard': 1, 'category': 1, 'name': 1};
		filterCriteria = {standard: selectedStandard, category: selectedCategory};
		catalogToQuery = mepCatalogSchem;
	}
	else {
		if(!req.body.type) {
			return error.sendGenericError(res, 400, 'Invalid Parameters');
		}
		type = req.body.type;
		fields = req.body.fields? req.body.fields: ' catalog manufacturer assemblyCode ';
		index_hint = {'type.code': 1};
		filterCriteria = {'type.code': type};
		catalogToQuery = CatalogSchem;
	}
	var MAX_LIMIT = 1000;
	var lower = req.body.lower? req.body.lower: 0;
	var upper = req.body.upper? req.body.upper: lower+MAX_LIMIT;	
	var sortCriteria = {};
	if(upper < lower)
	{
		var temp = upper;
		upper = lower;
		lower = temp;
	}
	if(upper - lower > MAX_LIMIT)
		upper = lower + MAX_LIMIT;
	if(req.body.sortField)
	{
		var field = req.body.sortField.field;
		var sort = req.body.sortField.sort;
		sortCriteria[field] = sort;
	}
	if(req.body.manufacturer)
	{
		filterCriteria.manufacturer = req.body.manufacturer;
		index_hint = {'manufacturer': 1};
	}
	var count_function = function(final_find) {
		catalogToQuery.count(final_find).exec(function(err, count) {
			if(err){
				return error.sendGenericError(res, 400, 'Error Encountered');
			}
			return res.jsonp({count: count});
		});
	};
	var find_function = function(final_find) {
		catalogToQuery.find(final_find).sort(sortCriteria).select(fields).skip(lower).limit(upper-lower).hint(index_hint).lean().exec(function(err, entries) {
			if(err){
				console.log(err);
				return error.sendGenericError(res, 400, 'Error Encountered');
			}
			return res.jsonp({data: entries, range: {lower: lower, upper: upper}});
		});
	};
	var removeDuplicates = function(fields) {
		for(var index in fields) {
			var single = fields[index];
			if(single === 'manufacturer')
			{
				if(req.body.manufacturer)
				{
					if(req.body.manufacturer.trim().toUpperCase() === req.body.search.string.trim().toUpperCase())
					{
						fields.splice(index, 1);
						continue;
					}
				}
			}
			if(filters && _.has(filters, single))
			{
				if(req.body.filters[single].trim().toUpperCase() === req.body.search.string.trim().toUpperCase())
					fields.splice(index, 1);
			}
		}
	};
	if(req.body.filters && _.keys(req.body.filters).length !== 0)
	{
		var all_filters = req.body.filters;
		var index = null;
		var filters = {};
		for(var key in all_filters)
		{
			if(all_filters[key])
				filters[key] = new RegExp(all_filters[key].toUpperCase());
		}
		if(all_filters.catalog)
		{
			index = {'catalog': 1};
		}
		else if(all_filters.manufacturer)
		{
			index = {'manufacturer': 1};
		}
		else if(all_filters.assemblyCode)
		{
			index = {'assemblyCode': 1};
		}
		else if(all_filters['additionalInfo.description'])
		{
			index = {'additionalInfo.description': 1, 'type.code': 1};
		}
		else if(all_filters.name)
		{
			index = {'name': 1};
		}
		if(index)
			index_hint = index;
		if (req.body.catalogType === 'AutoCAD MEP') {
			filters.standard = selectedStandard;
			filters.category = selectedCategory;
		}
		else {
			filters['type.code'] = type;
		}
		filterCriteria = filters;
	}

	var default_search = null;
	req.body.search = searchStringParser.parse(req.body.search);
	if(req.body.search && req.body.search.string)
	{
		default_search = [];
		var regex;
		var fieldsToSearch;
		var linkRegex = function(val) {
			var obj = {};
			obj[val] = regex;
			return obj;
		};

		if (req.body.catalogType === 'AutoCAD MEP') {
			fieldsToSearch = ['name'];	// for now these are the only searchable fields
		}
		else {
			fieldsToSearch = _.filter(fields.split(' '), function(val) {
				var array_ignore = ['additionalInfo.recnum', 'additionalInfo.assemblyquantity', 'additionalInfo.assemblylist'];
				if(array_ignore.indexOf(val) > -1)
					return false;
				return true;
			});
			removeDuplicates(fieldsToSearch);
		}
		var final_find = filterCriteria;
		final_find.$and = [];
		if(req.body.search.words && req.body.search.words.length !== 0)
		{
			for (var i = 0; i < req.body.search.words.length; i++) {
				var word = req.body.search.words[i];
				regex = new RegExp(word.trim().toUpperCase());
				var newOrWordSet = _.map(fieldsToSearch, linkRegex);
				final_find.$and.push({$or: newOrWordSet});
			}
		}
		if(req.body.search.exacts && req.body.search.exacts.length !== 0)
		{
			for (var j = 0; j < req.body.search.exacts.length; j++) {
				var one_exact = req.body.search.exacts[j];
				regex = new RegExp(one_exact.trim().toUpperCase());
				var newOrExactSet = _.map(fieldsToSearch, linkRegex);
				final_find.$and.push({$or: newOrExactSet});
			}
		}
		if(req.body.search.or && req.body.search.or.length !== 0)
		{
			var wordsToSearch = [];
			delete final_find.$and;
			final_find.$or = [];
			for(var k = 0; k < req.body.search.or.length; k++)
			{
				var one_or = req.body.search.or[k];
				for(var l = 0; l < one_or.length; l++)
				{
					regex = new RegExp(one_or[l].trim().toUpperCase());
					wordsToSearch.push(regex);
				}
			}
			for(var m = 0; m < fieldsToSearch.length; m++) {
				var newOrSet = {};
				newOrSet[fieldsToSearch[m]] = {$in: wordsToSearch};
				final_find.$or.push(newOrSet);
			}
		}
		if(!req.body.total)
			find_function(final_find);
		else
			count_function(final_find);
		return;
	}
	if(req.body.total)
		return count_function(filterCriteria);
	find_function(filterCriteria);
};

exports.getCatalogEntryById = function(req,res){
	if(req.body._id)
	{
		CatalogSchem.findOne({_id: req.body._id}).lean().exec(function(err,entry){
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			if(!entry)
				return error.sendGenericError(res, 400, 'Error Encountered');
			res.jsonp(entry);
		});
	}
	else if(req.body.item_ids)
	{
		CatalogSchem.find({_id: {$in: req.body.item_ids}}).lean().exec(function(err,entries){
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			res.jsonp(entries);
		});	
	}
	else
	{
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
};

exports.editCatalogEntry = function(req,res){
	var newEntry;
	if(!req.body.item)
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	newEntry = req.body.item;
	if(!newEntry._id)
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	CatalogSchem.findOne({_id: newEntry._id}).exec(function(err, fetchedEntry){
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(!fetchedEntry)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if(newEntry.type && fetchedEntry.type.code !== newEntry.type.code)
		{
			fetchedEntry.additionalInfo = {};
		}
		_.extend(fetchedEntry,newEntry);
		for(var key in _.omit(fetchedEntry, ['_id', '__v', 'type']))
		{
			fetchedEntry[key] = convertToUpper(fetchedEntry[key]);
		}
		fetchedEntry.type.code = fetchedEntry.type.code.toUpperCase();
		fetchedEntry.save(function(err){
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			return res.jsonp(fetchedEntry);
		});
	});
};

exports.deleteCatalogEntry = function(req,res){
	if(!req.body._id)
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	CatalogSchem.findOne({_id: req.body._id}).exec(function(err,entry){
		if (err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		if (!entry)
			return error.sendGenericError(res, 400, 'Error Encountered');
		Users.find({'associations.catalogId': entry._id}, function(err, users) {
			if(err)
				return;
			if(!users)
				return;
			for (var i = 0; i < users.length; i++) {
				var user = users[i];
				for (var j = 0; j < user.associations.length; j++) {
					if(JSON.stringify(user.associations[j].catalogId) === JSON.stringify(entry._id))
					{
						user.associations.splice(j, 1);
					}
				}
				user.save();
			}
		});
		entry.remove(function(err){
			if(err)
				return error.sendGenericError(res, 400, 'Error Encountered');
			return res.jsonp(entry);
		});
	});
};

exports.checkUnique = function(req, res){
	if(!req.body.catalog || !req.body.manufacturer || typeof req.body.assemblyCode === 'undefined' || !req.body.type || !req.body._id){
		return error.sendGenericError(res, 400, 'Invalid Parameters');
	}
	CatalogSchem.find({catalog: req.body.catalog, manufacturer: req.body.manufacturer, assemblycode: req.body.assemblyCode}).exec(function(err, entry){
		if(err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		for(var i in entry){
			if(entry[i]._id !== req.body._id && entry[i].type.code === req.body.type.code)
				return res.jsonp({'unique':false});
		}
		return res.jsonp({'unique':true});
		
	});
};

//------------ For MEP Catalog ------------//

exports.getAllMepStandards = function(req, res) {
	//var index_hint = {'standard': 1};
	mepCatalogSchem.find().exec(function(err, result) {
		var list = [];
		var unique = [];
		if (err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		for (var i in result) {
			if (unique.indexOf(result[i].standard) === -1) {
				unique.push(result[i].standard);
				list.push(result[i].standard);
			}
		}
		return res.jsonp({'standards': list});
	});
};

exports.getMepStandardCategories = function (req, res) {
	var index_hint = {'category': 1};
	var selectedStandard = req.body.std;
	mepCatalogSchem.find({standard: selectedStandard}).hint(index_hint).lean().exec(function(err, result) {
		var list = [];
		if (err)
			return error.sendGenericError(res, 400, 'Error Encountered');
		for (var i in result) {
			if (list.indexOf(result[i].category) === -1) {
				list.push(result[i].category);
			}
		}
		return res.jsonp({'categories': list});
	});
};