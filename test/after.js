console.log('after');

const http = require('http');
const net = require('net');

const server1 = http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Hello, World!');
});

server1.listen(4023, () => {
	console.log('Start http service, port 4023');
});

const server2 = net.createServer((socket) => {
	console.log('Client connected');

	socket.on('data', (data) => {
		console.log(`Received data from client: ${data}`);
		socket.write('Server received your message');
	});

	socket.on('end', () => {
		console.log('Client disconnected');
	});
});

server2.listen(4027, () => {
	console.log('Start tcp service, port 4027');
});
