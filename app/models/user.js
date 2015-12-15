'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * User Schema
 */
var UserSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    Id: {
        type: String,
        default: null
    },
    provider: String,
    lastLogin: Date,
    lastLogout: Date,
    isAdmin: {
        type: Boolean,
        default: false
    },
    isManufacturer: {
        type: Boolean,
        default: false
    },
    codeName:{
        type: String,
        default: null
    },
    SchemFav: [{schematicId: { type: Schema.ObjectId, ref: 'SchematicComponent' }, iconVersion: {type: Number, default: 1}}],
    catFav: [{
        type: Schema.ObjectId,
        ref: 'Catalog'
    }],
    mepFav: [{
        type: Schema.ObjectId,
        ref: 'MEPCatalog'
    }],
    catalogFilters: [{
        type: Schema.Types.Mixed,
        default: null
    }],
    mepCatalogFilters: [{
        type: Schema.Types.Mixed,
        default: null
    }],
    associations: [{catalogId: {type: Schema.ObjectId, default: null, ref: 'Catalog'}, schematicId: {type: Schema.ObjectId, default: null,  ref: 'SchematicComponent' }, iconVersion: {type: Number, default: 1}}],
    userPrdt: {
        type: Array,
        default: []
    },
    userDefPrdt: {
        type: String,
        default: null
    }
});

UserSchema.index({isAdmin: 1});
UserSchema.index({isManufacturer: 1});
UserSchema.index({name: 1});
UserSchema.index({SchemFav: 1});
UserSchema.index({'associations.schematicId': 1});
mongoose.model('User', UserSchema);