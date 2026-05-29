const net = require('net');

const host = '172.30.0.186';
const ports = [18080, 18090, 18091, 18000, 8000, 8001, 8080, 5432, 54321, 54322, 6432];

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    
    socket.on('connect', () => {
      console.log(`[*] PORT ${port} IS OPEN on ${host}!`);
      socket.destroy();
      resolve(port);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(null);
    });
    
    socket.connect(port, host);
  });
}

async function run() {
  console.log(`Scanning ports on ${host}...`);
  for (const port of ports) {
    await checkPort(port);
  }
  console.log('Scan completed.');
}

run();
