'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
//---------------------------------------------//

var catalogSchema = new Schema({
    name: {
    	type: String,
    	required: true,
    	unique: true
    },
    dwgPath: {
    	type:String,
    	required: false
    },
    image: {
    	type:String,
    	required: false
    },
    standard: {
    	type: String,
    	required: true
    },
    category: {
    	type: String,
    	required: true
    },
    columnUnique: {
    	type: Schema.Types.Mixed,
		default: null
    },
    basicTable: {
    	type: Schema.Types.Mixed,
		default: null
    },
    constantLists: {
    	type: Schema.Types.Mixed,
		default: null
    },
    constants: {
    	type: Schema.Types.Mixed,
		default: null
    },
    calculations: {
    	type: Schema.Types.Mixed,
		default: null
    }
});

catalogSchema.index({name: 1}, {unique: true});
catalogSchema.index({standard: 1, category: 1, name: 1});
catalogSchema.index({description: 1});
catalogSchema.index({category: 1});
catalogSchema.index({standard: 1});
catalogSchema.index({name: 1});

mongoose.model('MEPCatalog', catalogSchema);