
(function () {

	"use strict";

	var util = require('util');
	var path = require('path');
	var net = require('net');
	var fs = require('fs');
	var events = require('events');
	var mysql = require('mysql');

	process.on('disconnect', function () {
		process.exit(0);
	});

	var pool = mysql.createPool({
		host: '127.0.0.1',
		user: 'bob',
		password: 'secret'
	});

	function Watcher() {}
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
			'INSERT INTO file_events' +
			' (file, change, event)' +
			' VALUES' +
			' (?, ?, ?)';

	watcher.on('changed', function (data) {
		var query = mysql.format(myInsert, [
				data.file, data.change, data.event ]);
		pool.query(query, function (err, result) {
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

	pool.getConnection(function (err, connection) {
		if (err) {
			console.error(err.stack || err);
			process.exit(1);
		}
		connection.release();
		watcher.watch(process.args[2]);
		server.listen(25001, '127.0.0.1');
	});

})();

