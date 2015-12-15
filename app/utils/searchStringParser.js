'use strict';

var _ = require('underscore');

exports.parse = function(copy) {
	function escapeRegExp(un_string) {
		return un_string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
	}
	if (!copy)
		return '';
	var string = escapeRegExp(copy);
	var exact = [];
	var words = [];
	var or = [];
	var orExps = [];
	var temp = [];
	function gatherExacts() {
		var reg = /".+?"/g;
		var match;
		do {
			match = reg.exec(string);
			if (match) {
				exact.push(string.substring(match.index + 1, match.index + match[0].length - 1));
				temp.push(string.substring(match.index, match.index + match[0].length));
			}
		} while (match);
	}
	function gatherOR() {
		function getLeft(orExpStartIndx) {
			var opLeft = string.substring(0, orExpStartIndx).trim();
			var opLeftLen = opLeft.length;
			if (opLeft[opLeftLen - 1] === '"')
				// This is a quoted expression, potentially
			{
				opLeftLen -= 1;
				// We are indexing...
				while (--opLeftLen >= 0) {
					if (opLeft[opLeftLen] === '"' && (opLeftLen === 0 || opLeft[opLeftLen - 1] === ' ')) {
						opLeft = opLeft.substring(opLeftLen);
						break;
					}
				}
			}
			else {
				// Normal, non-exact operand
				// Locate the previous character such that it starts the word -
				// i.e., the one preceding it is a space
				while (--opLeftLen >= -1) {
					if (opLeftLen === -1 || opLeft[opLeftLen] === ' ') {
						opLeft = opLeft.substring(opLeftLen + 1);
						break;
					}
				}
			}
			return opLeft;
		}
		function getRight(orExpStartIndx) {
			var opRight = string.substring(orExpStartIndx + 4).trim();
			var opRightLen = 0;
			if (opRight[0] === '"')
				// Start of a quoted exact phrase
			{
				// Locate the next " character such that it starts the word -
				// i.e., the one following it is a space (or none)
				while (++opRightLen <= opRight.length) {
					if (opRight[opRightLen] === '"' && (opRightLen === opRight.Length - 1 || opRight[opRightLen + 1] === ' ')) {
						opRight = opRight.substring(0, opRightLen + 1);
						break;
					}
				}
			}
			else {
				// Normal, non-exact operand
				// Locate the next character such that it ends the word -
				// i.e., the one following it is a space (or none)
				while (++opRightLen <= opRight.length) {
					if (opRight.Length === opRightLen || opRight[opRightLen] === ' ') {
						opRight = opRight.substring(0, opRightLen);
						break;
					}
				}
			}
			return opRight;
		}
		var index = string.indexOf(' OR ');
		while (index > -1) {
			var opLeft = getLeft(index);
			var opRight = getRight(index);
			temp.push(opLeft);
			temp.push(opRight);
			or.push(opLeft.trim());
			or.push(opRight.trim());
			var offset = string.indexOf(opRight, index + 4);
			index = string.indexOf(' OR ', offset);
		}
	}
	function groupOR() {
		for (var i = 0; i < or.length; i += 2) {
			if (0 !== i && or[i - 1] === or[i]) {
				orExps[orExps.length - 1].push(or[i + 1]);
			} else {
				var newSet = [];
				newSet.push(or[i]);
				newSet.push(or[i + 1]);
				orExps.push(newSet);
			}
		}
	}
	function cleanSearchString() {
		// Remove all OR operator strings
		string = string.replace(/ OR /gi, '').trim();
		// Sort such that longer strings are in front and replaced first,
		// to avoid replacement of shorter substrings hosing things
		temp = _.sortBy(temp, function (val) {
			return val ? val.length : 0;
		});
		// Remove all exact and OR operands identified
		for (var i = 0; i < temp.length; i++) {
			temp[i] = temp[i].replace(/[.]/, '\\.'); 	// need to escape the backslash again to replace regexp
			string = string.replace(new RegExp(temp[i], 'ig'), ' ');
		}
		temp = [];
	}
	function removeDuplicates() {
		for (var exp in or) {
			if (exact.indexOf(or[exp]) > -1)
				exact.splice(exact.indexOf(or[exp]), 1);
		}
	}
	function gatherRemainingWords() {
		cleanSearchString();
		words = [];
		var s_words = string.split(' ');
		for (var i = 0; i < s_words.length; i++) {
			var tword = s_words[i].trim();
			if (tword.length > 0) {
				words.push(tword);
			}
		}
	}
	function filterExtraOrExps() {
		for (var i = 0; i < orExps.length; i++) {
			var exp = orExps[i];
			for (var j = 0; j < words.length; j++) {
				if (exp.indexOf(words[j]) > -1) {
					orExps.splice(i, 1);
					break;
				}
			}
		}
	}
	gatherExacts();
	gatherOR();
	groupOR();
	removeDuplicates();
	gatherRemainingWords();
	filterExtraOrExps();
	return {
		words: words,
		exacts: exact,
		or: orExps,
		string: escapeRegExp(copy)
	};
};