if( process.argv.length < 3 ) {
	console.log(
		'Usage: \n' +
		'node stream-server.js <secret> [<stream-port> <websocket-port>]'
	);
	process.exit();
}

var STREAM_SECRET = process.argv[2],
	STREAM_PORT = process.argv[3] || 8082,
	WEBSOCKET_PORT = process.argv[4] || 8084,
	STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

var width = 320,
	height = 240;

var dev_video = "video0";
var ps = require('ps-node');
var exec = require('child_process').exec, child;
var sleep = require('sleep');
var socketServer = new (require('ws').Server)({port: WEBSOCKET_PORT});
var http = require('http');
var static = require('node-static');

socketServer.on('connection', function(socket) {
	// Send magic bytes and video size to the newly connected socket
	// struct { char magic[4]; unsigned short width, height;}
	var streamHeader = new Buffer(8);
	streamHeader.write(STREAM_MAGIC_BYTES);
	streamHeader.writeUInt16BE(width, 4);
	streamHeader.writeUInt16BE(height, 6);
	socket.send(streamHeader, {binary:true});

	console.log( 'New WebSocket Connection ('+socketServer.clients.length+' total)' );
	
	socket.on('close', function(code, message) {
		console.log( 'Disconnected WebSocket ('+socketServer.clients.length+' total)' );
	});
	
	socket.on('message', function(message) {
	  ps.lookup({ command: 'avconv' }, function(err, resultList ) {
      if (err) {
        throw new Error( err );
      }
      
      resultList.forEach(function(process) {
        if (process) {
          console.log( 'Killing PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
          
          // A simple pid lookup 
          ps.kill( process.pid, function( err ) {
            if (err) {
              throw new Error( err );
            } else {
              console.log( 'Process %s has been killed!', process.pid );
            }
          });  
        }
      });
      
      path_to_exec = "";
      if (dev_video == "video0") {
        path_to_exec = "avconv -s 640x480 -f video4linux2 -i /dev/video1 -f mpeg1video -b 800k -r 30 http://127.0.0.1:8082/streaming/abc/640/480/";
        dev_video = "video1";
      } else {
        path_to_exec = "avconv -s 640x480 -f video4linux2 -i /dev/video2 -f mpeg1video -b 800k -r 30 http://127.0.0.1:8083/streaming/abc/640/480/";
        dev_video = "video0"; 
      }
      sleep.sleep(1);
      child = exec(path_to_exec,
        function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
          }
      });
    });
	});
		
});

socketServer.broadcast = function(data, opts) {
	for( var i in this.clients ) {
		if (this.clients[i].readyState == 1) {
			this.clients[i].send(data, opts);
		}
		else {
			console.log( 'Error: Client ('+i+') not connected.' );
		}
	}
};

var fileServer = new static.Server("/home/pi/jsmpeg/public");

// HTTP Server to accept incomming MPEG Stream
var streamServer = require('http').createServer( function(request, response) {
	request.addListener('end', function() {
	  fileServer.serve(request, response);
	}).resume();
	
	var params = request.url.substr(1).split('/');

  if (params [0] == "streaming") {
  	if (params[1] == STREAM_SECRET ) {
  		width = (params[2] || 320)|0;
  		height = (params[3] || 240)|0;
		
  		console.log(
  			'Stream Connected: ' + request.socket.remoteAddress + 
  			':' + request.socket.remotePort + ' size: ' + width + 'x' + height
  		);
  		request.on('data', function(data){
  			socketServer.broadcast(data, {binary:true});
  		});
  	} else {
  		console.log(
  			'Failed Stream Connection: '+ request.socket.remoteAddress + 
  			request.socket.remotePort + ' - wrong secret.'
  		);
  		response.end();
  	}
	}
});

streamServer.listen(STREAM_PORT);

console.log('Listening for MPEG Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');