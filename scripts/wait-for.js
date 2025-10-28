const net = require("net");
const [, , host, port, retriesArg = "60", delayArg = "1000"] = process.argv;
const portNum = parseInt(port, 10);
const retries = parseInt(retriesArg, 10);
const delay = parseInt(delayArg, 10);
if (!host || !portNum) {
  console.error("Usage: node wait-for.js host port [retries] [delayMs]");
  process.exit(2);
}
let attempts = 0;
function tryConnect() {
  attempts++;
  const socket = new net.Socket();
  socket.setTimeout(3000);
  socket.on("connect", () => {
    console.log(`Connected to ${host}:${portNum}`);
    socket.destroy();
    process.exit(0);
  });
  socket.on("error", () => {
    socket.destroy();
    if (attempts >= retries) {
      console.error(
        `Timeout waiting for ${host}:${portNum} after ${attempts} attempts`
      );
      process.exit(1);
    }
    setTimeout(tryConnect, delay);
  });
  socket.on("timeout", () => {
    socket.destroy();
    if (attempts >= retries) {
      console.error(
        `Timeout waiting for ${host}:${portNum} after ${attempts} attempts`
      );
      process.exit(1);
    }
    setTimeout(tryConnect, delay);
  });
  socket.connect(portNum, host);
}
tryConnect();
