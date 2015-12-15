'use strict';

//service for validating links in a mapping file.
angular.module('ace.schematic')
.factory('ValidationService', ['$http', '$timeout', function($http, $timeout) {
	var g_result = null;
	var dlList = [];
	var thumbnailList = [];
	var g_messages;
	var checked = 0;
	var total = 0;
	var status = true;
	var trial_number = 0;
	var count = 10;
	var errored = false;
	var escape_regex = function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	};

	var findThumbnail = function(thumbnail, mapping) {
		if(!mapping)
			return null;
		var first_brack = thumbnail.indexOf('(');
		var last_brack = thumbnail.indexOf(')');
		if(first_brack === -1 || last_brack === -1)
			return null;
		var location = thumbnail.substring(0, first_brack)+'/'+thumbnail.substring(first_brack+1, last_brack);
		var matchstring = '^.*'+escape_regex(location)+'\\.bmp$';
		var reg = new RegExp(matchstring, 'i');
		for (var i = mapping.length - 1; i >= 0; i--) {
			var json = mapping[i];
			if(reg.test(json.name))
			{
				return json.dl_url;
			}
		}
		return null;
	};

	var findDl = function(id, mapping) {
		if(!mapping)
			return null;
		var matchstring = '^.*'+escape_regex(id)+'\\.dwg$';
		var reg = new RegExp(matchstring, 'i');
		for (var i = mapping.length - 1; i >= 0; i--) {
			var json = mapping[i];
			if(reg.test(json.name))
			{
				return json.dl_url;
			}
		}
		return null;
	};

	function breakdown(list, number, cb) {
		if(number === trial_number)
		{
			for(var i = 0; i < list.length ; i++)
			{
				var item = list[i];
				checkLinks(item.id, item.link, number, cb);
			}
		}
	}

	var checkLinks = function(id, link, number, cb) {
		$http.head(link).success(function(){
			if(number === trial_number)
			{
				count --;
				g_messages.push({'type': 'success', 'info': (cb? 'DWG ': 'Thumbnail ') + 'Link for '+id+' valid.'});
				checked++;
				if(checked === total)
				{
					if(!cb)
					{
						g_result = status;
						if(status)
							g_messages.push({'type': 'center-result alert alert-info', 'info': 'Validation Succeeded.'});
						else
							g_messages.push({'type': 'center-result alert alert-danger', 'info': 'Validation Failed'});
						return;
					}
					cb(number);

				}
				else if(count === 0)
				{
					count = 10;
					var list = cb? dlList: thumbnailList;
					breakdown(list.splice(0, 10), number, cb);
				}
			}
		}).error(function() {
			if(number === trial_number)
			{
				count --;
				status = false;
				errored = true;
				g_messages.push({'type': 'error', 'info': (cb? 'DWG ': 'Thumbnail ') + 'Link for '+id+' invaild.'});
				checked++;
				if(checked === total)
				{
					if(!cb)
					{
						g_result = status;
						if(status)
							g_messages.push({'type': 'center-result alert alert-info', 'info': 'Validation Succeeded.'});
						else
							g_messages.push({'type': 'center-result alert alert-danger', 'info': 'Validation Failed'});
						return;
					}
					cb(number);
				}
				else if(count === 0)
				{
					count = 10;
					var list = cb? dlList: thumbnailList;
					breakdown(list.splice(0, 10), number, cb);
				}
			}
		});
	};

	var startThumnailCheck = function(number) {
		count = 10;
		g_messages.push({'type': 'center-result alert alert-success', 'info': 'Starting validation of Thumbnail links.....'});
		checked = 0;
		total = thumbnailList.length;
		for (var i = thumbnailList.length - 1; i >= 0; i--) {
			var item = thumbnailList[i];
			if(number === trial_number)
			{
				if(!item.link)
				{
					total--;
					thumbnailList.splice(i, 1);
					g_messages.push({'type': 'error', 'info': 'Thumbnail link for '+item.id+' not found.'});
					if(checked === total)
					{
						g_result = status;
						if(status)
							g_messages.push({'type': 'center-result alert alert-info', 'info': 'Validation Succeeded.'});
						else
							g_messages.push({'type': 'center-result alert alert-danger', 'info': 'Validation Failed'});
						return;
					}
				}
			}
		}
		breakdown(thumbnailList.splice(0, 10), number);
	};


	var startDownloadCheck = function(err, number) {
		count = 10;
		if(err)
		{
			return g_messages.push({'type': 'center-result alert alert-danger', 'info': 'Validation failed.'});
		}
		checked = 0;
		total = dlList.length;
		g_messages.push({'type': 'center-result alert alert-success', 'info': 'Starting validation of Download links.....'});
		for (var i = dlList.length - 1; i >= 0; i--) {
			var item = dlList[i];
			if(number === trial_number)
			{
				if(!item.link)
				{
					total--;
					dlList.splice(i, 1);
					g_messages.push({'type': 'error', 'info': 'Download link for '+item.id+' not found.'});
					if(checked === total)
					{
						return startThumnailCheck(number);
					}
				}
			}
		}
		breakdown(dlList.splice(0, 10), number, startThumnailCheck);
	};

	var populateDlAndThumbnail = function(root, mapping, number, callback) {
		var total = 0, processed = 0;
		function isComposite(child) {
			if(!child.isComponent) {
				thumbnailList.push({'id': child.id, 'link': findThumbnail(child.thumbnail, mapping)});
				populateDlAndThumbnail(child, mapping, number, function() {
					if(++processed === total) {
						callback(null, number);
					}
				});
			}
			else {
				dlList.push({'id': child.component, 'link': findDl(child.component, mapping)});
				thumbnailList.push({'id': child.component, 'link': findThumbnail(child.thumbnail, mapping)});
				if(++processed === total) {
					callback(null, number);
				}
			}
		}

		if(!root.isComponent)
		{
			if(root.children.length === 0)
				callback(null, number);
			else
			{
				total = root.children.length;
				for (var i = 0; i < root.children.length; i++) {
					isComposite(root.children[i]);
				}
			}

		}
		else
		{
			callback(new Error('Not a Sub-type'), number);
		}
	};


	var instance = {
		reset: function() {
			g_messages = [];
			dlList = [];
			thumbnailList = [];
			g_result = null;
			status = true;
			trial_number++;
			errored = false;
		},
		messages: function() { return g_messages; },
		validateLinks: function(data, mapping) {
			this.reset();
			var number = trial_number;
			$timeout(function(){populateDlAndThumbnail(data, JSON.parse(mapping), number, startDownloadCheck);}, 1500);
		},
		result: function() { return g_result; },
		errored: function() { return errored; }
	};
	return instance;
}]);