'use strict';


exports.sendGenericError = function(res, status, message)
{
	return res.status(status).jsonp({'error': message});
};

exports.sendUnauthorizedError = function(res)
{
	return this.sendGenericError(res, 401, 'You are not authorized to view this page.');
};