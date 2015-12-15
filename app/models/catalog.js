'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
//---------------------------------------------//

var catalogSchema = new Schema({
    catalog: {
        type: String,
        required: true,
        trim: true
    },
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },
    assemblyCode: {
        type: String,
        default: null
    },
    type:{
        code: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        }
    },
    additionalInfo: {
        type: Schema.Types.Mixed,
        default: null
    }

});

catalogSchema.index({catalog: 1, manufacturer: 1, assemblyCode: 1, 'type.code': 1}, {unique: true});
catalogSchema.index({'type.code': 1});
catalogSchema.index({catalog: 1});
catalogSchema.index({assemblyCode: 1});
catalogSchema.index({'additionalInfo.description': 1, 'type.code': 1});
catalogSchema.index({additionalInfo: 1});
catalogSchema.index({manufacturer: 1});


mongoose.model('Catalog', catalogSchema);

