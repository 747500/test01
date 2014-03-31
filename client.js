
(function () {

	"use strict";

	var net = require('net');
	var JSONStream = require('JSONStream');
	var config = require('./config.js');

	process.on('disconnect', function () {
		process.exit(0);
	});

	var parser = JSONStream.parse();
	parser.on('root', function (data) {
		console.log(JSON.stringify(data, null, 2) + '\n');
	});

	net.connect(config.tcp).pipe(parser);

})();
