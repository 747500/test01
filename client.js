
(function () {

	"use strict";

	var net = require('net');
	var JSONStream = require('JSONStream');
	var config = require('./config.js');

	var parser = JSONStream.parse();

	parser.on('root', function (data) {
		console.log(JSON.stringify(data, null, 2) + '\n');
	});

	net.connect(config.http).pipe(parser);

})();
