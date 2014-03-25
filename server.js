
(function () {

	"use strict";

	var util = require('util');
	var path = require('path');
	var net = require('net');
	var fs = require('fs');
	var events = require('events');
	var mysql = require('mysql');

	var connection = mysql.createConnecton({
		host: '127.0.0.1',
		user: 'bob',
		password: 'secret'
	});

	var Watcher = function () {};
	Watcher.prototype = new events.EventEmitter();
	Watcher.prototype.watch = function (filename) {
		var fname = path.basename(filename);
		return fs.watch(filename, function (ename) {
			this.emit('changed', {
				file: fname,
				change: new Date(),
				event: ename
			});
		}.bind(this));
	};

	var watcher = new Watcher();

	var myInsert =
		'INSERT INTO file_events (file, change, event)' +
		' VALUES (?, ?, ?)';

	watcher.on('changed', function (data) {
		var query = mysql.format(myInsert, [
				data.file, data.change, data.event ]);
		connection.query(query, function (err, result) {
			if (err) {
				console.warn(err.stack || err);
			}
		});
	});

	var server = net.createServer(function (socket) {
		function wlistener(data) {
			socket.write(JSON.stringify(data, null, 2) + '\n');
		}
		watcher.on('changed', wlistener);
		socket.on('finish', function () {
			watcher.removeListener('changed', wlistener);
		});
	});

	connection.connect(function (err) {
		if (err) {
			console.error(err.stack || err);
			process.exit(1);
		}

		watcher.watch(process.args[2]);
		server.listen(25001, '127.0.0.1');
	});

})();

