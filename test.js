
(function () {

	"use strict";

	var child_process = require('child_process');

	var JSONStream = require('JSONStream');

	var when = require('when');
	var whennode = require('when/node');
	var fs = whennode.liftAll(require('fs'));

	var testfile = '/tmp/the.file.dat';

	var Director = function () {
		var messagesCount = 0;
		this.parser = JSONStream.parse();
		this.parser.on('root', function (message) {
			messagesCount ++;
			console.log('got message #%d %s', messagesCount, JSON.stringify(message, null, 2));

			if (messagesCount === this.clients.length) {
				console.log('ok');
				process.exit(0);
			}
		}.bind(this));
	};

	Director.prototype.openFile = function (fname) {
		return fs.open(fname, 'a+')
			.with(this)
			.then(function (fd) {
				this.fd = fd;
				console.log('open a file');
			});
	};

	Director.prototype.startServer = function () {
		return when
			.try(child_process.fork, './server.js', [ testfile ])
			.with(this)
			.then(function (s) {
				this.server = s;
				console.log('start server');
			});
	};

	Director.prototype.startClients = function (nclients) {
		var clients = [];
		for (var n = 0; n < nclients; n ++) {
			var c = when.try(child_process.fork, './client.js', [ testfile ], { encoding: 'UTF-8', silent: true });
			clients.push(c);
			console.log('start client #%d', clients.length);
		}

		return when.all(clients)
			.with(this)
			.then(function (result) {
				var parser = this.parser;
				this.clients = result;
				this.clients.forEach(function (c) {
					c.stdout.pipe(parser);
					c.stderr.pipe(process.stderr);
				});
			});
	};

	Director.prototype.touchFile = function () {
		var now = new Date();
		return fs.futimes(this.fd, now, now).then(function () {
			console.log('touch a file');
		});
	};

	var director = new Director();

	var ok = director.openFile(testfile);

	ok = ok.then(function () {
		return director.startServer();
	});

	ok = ok.delay(300);

	ok = ok.then(function () {
		return director.startClients(3);
	});

	ok = ok.delay(300);

	ok = ok.then(function () {
		return director.touchFile();
	});

	ok = ok.delay(1000);

	ok.done(function () {
		console.log('failed');
		process.exit(1);
	});

})();
