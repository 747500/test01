
(function () {

	"use strict";

	var net = require('net');
	var JSONStream = require('JSONStream');

	var parser = JSONStream.parse();

	parser.on('root', function (data) {
		console.log(JSON.stringify(data, null, 2) + '\n');
	});

	net.connect({ host: '127.0.0.1', port: 25001 }).pipe(parser);

})();
