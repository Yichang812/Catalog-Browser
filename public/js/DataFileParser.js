'use strict';
(function() {
	var ParserDat = function () {
		this.subMenuMap = {};
		this.rootNode = null;
		//the file pointer is at the beginning of the file
		this._startLine = 0;
	};
	var _;
	ParserDat.RootNodeId = 'M0';
	ParserDat.StartOfSubMenu = '**M';
	ParserDat.SubMenuRefTo = '$S=';
	ParserDat.SubMenuCommand = '$C=';
	ParserDat.ErrorCode = {
		SUCCESS: 'Success',
		DATA_NOT_FOUND: 'Data stream not found',
		NODE_NOT_EXISTS: 'Some node does not exist'
	};
	ParserDat.prototype._readNextLine = function (startLine, fileContent) {
		var lineStr = '';
		var endLine = -1;
		while (startLine < fileContent.length) {
			endLine = fileContent.indexOf('\n', startLine);
			if (-1 === endLine) {
				endLine = fileContent.length;
			}
			lineStr = fileContent.substr(startLine, endLine - startLine);
			if (';' === lineStr[0]) {
				startLine = endLine + 1;
				lineStr = '';
				continue;	//ignore comment
			} else
				break;
		}
		return {
			newStartLine: endLine + 1,
			value: lineStr.trim()
		};
	};
	ParserDat.prototype._readSubMenuTitle = function (startLine, fileContent) {
		//Next line is template Id of submenu - ignore this in server
		var ret = this._readNextLine(startLine, fileContent);
		startLine = ret.newStartLine;
		var tmp = _.clone(ret);
		//Next line is title of submenu 
		ret = this._readNextLine(startLine, fileContent);
		if (ret.value.split('|').length === 3) {
			//this submenu does not have template id referring to DCO dialog
			ret = tmp;
		}
		return ret;
	};
	function trim(str) {
		return str.trim();
	}
	//Return new StartLine
	ParserDat.prototype._parseSubMenu = function (subMenuId, startLine, fileContent) {
		//Read submenu title
		var ret = this._readSubMenuTitle(startLine, fileContent);
		startLine = ret.newStartLine;
		var subMenu = {
				children: [],
				title: ret.value
			};
		//Read sub-submenu
		while (startLine < fileContent.length) {
			ret = this._readNextLine(startLine, fileContent);
			var line = ret.value;
			if (line.indexOf(ParserDat.StartOfSubMenu) === 0) {
				//new submenu detected, step out
				break;
			}
			startLine = ret.newStartLine;
			var split = line.split('|');
			if (split.length !== 3) {
				continue;
			}
			//check if any empty
			split = split.map(trim);
			if (_.contains(split, ''))
				continue;
			/* Parse the 3rd component 
			* we ignore $C = xxx
			* $S = and component are taken care of
			*/
			if (split[2].toUpperCase().indexOf(ParserDat.SubMenuCommand) === 0)
				continue;
			var subSubMenuRef = {
					description: split[0],
					thumbnail: split[1]
				};
			if (split[2].toUpperCase().indexOf(ParserDat.SubMenuRefTo) === 0) {
				subSubMenuRef.isComponent = false;
				//extract the num in $S=<num> 
				subSubMenuRef.subMenuRef = split[2].substr(3);
			} else {
				subSubMenuRef.isComponent = true;
				var comp = split[2];
				//the component name can have format xyz_1- -> it shall be
				//modified to 1-/xyz
				if (comp.indexOf('_1-') === comp.length - 3) {
					comp = '1-/' + comp;
				}
				subSubMenuRef.component = comp;
			}
			subMenu.children.push(subSubMenuRef);
		}
		this.subMenuMap[subMenuId.substr(2)] = subMenu;
		return startLine;
	};
	ParserDat.prototype.parse = function (data) {
		var fileContent = data;
		if(!fileContent)
			return ParserDat.ErrorCode.DATA_NOT_FOUND;
		//parse the file content line by line
		var startLine = 0;
		while (startLine < fileContent.length) {
			var ret = this._readNextLine(startLine, fileContent);
			var line = ret.value;
			startLine = ret.newStartLine;
			if (line.indexOf(ParserDat.StartOfSubMenu) === 0) {
				startLine = this._parseSubMenu(line, startLine, fileContent);
			}
		}
		return ParserDat.ErrorCode.SUCCESS;
	};
	ParserDat.prototype._readSubMenuMapNode = function (subMenuId, subMenuIdName, subMenuThumbnail) {
		var node = this.subMenuMap[subMenuId.toUpperCase()];
		if (typeof node === 'undefined') {
			throw new Error('Node ' + subMenuId + ' is not found');
		}
		//console.log( require('util').inspect(node));
		var newNode = {
				id: subMenuId,
				title: node.title,
				name: subMenuIdName,
				thumbnail: subMenuThumbnail,
				isComponent: false,
				children: []
			};
		for (var i = 0; i < node.children.length; ++i) {
			var childNode = {};
			var children = node.children;
			if (children[i].isComponent) {
				childNode = {
					name: children[i].description,
					thumbnail: children[i].thumbnail,
					isComponent: true,
					component: children[i].component
				};
			} else {
				childNode = this._readSubMenuMapNode(children[i].subMenuRef, children[i].description, children[i].thumbnail);
			}
			newNode.children.push(childNode);
		}
		return newNode;
	};
	ParserDat.prototype.generateSubMenuHierachy = function () {
		//console.log( require('util').inspect(this.subMenuMap));
		this.rootNode = this._readSubMenuMapNode(ParserDat.RootNodeId, 'rootSubMenu', 'none');
		return ParserDat.ErrorCode.SUCCESS;
	};

	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = ParserDat;
		}
		_ = require('underscore');
		exports.ParserDat = ParserDat;
	} else {
		_ = window._;
		window.ParserDat = ParserDat;
	}
})();