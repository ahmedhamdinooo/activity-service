import net from 'net';

const host = process.env.KAFKA_HOST || 'kafka';
const port = Number(process.env.KAFKA_PORT || 9092);
const timeout = Number(process.env.WAIT_TIMEOUT || 60);

console.log(`⏳ Waiting for Kafka at ${host}:${port}...`);

let attempts = 0;

function check() {
  const socket = new net.Socket();
  socket.setTimeout(1000);

  socket.on('connect', () => {
    console.log('✅ Kafka is ready!');
    process.exit(0);
  });

  socket.on('error', () => {
    attempts++;
    if (attempts >= timeout) {
      console.error(`❌ Kafka is still not available after ${timeout} seconds.`);
      process.exit(1);
    } else {
      process.stdout.write(`⏱ Waiting... (${attempts}/${timeout})\r`);
      setTimeout(check, 1000);
    }
  });

  socket.connect(port, host);
}

check();
