var config = require('../config'),
	DB = require('mongodb').Db,
	Connection = require('mongodb').Connection,
	Server = require('mongodb').Server;
module.exports = new DB(config.db, new Server(config.host, config.port), {safe: true});