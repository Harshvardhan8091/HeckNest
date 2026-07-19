const mongoose = require('mongoose');
const dns = require('dns');

// If Node's DNS servers default to loopback (127.0.0.1), which often fails
// to resolve SRV records on Windows/WSL, we fallback to public DNS resolvers.
try {
  const servers = dns.getServers();
  if (servers.length === 0 || (servers.length === 1 && servers[0] === '127.0.0.1')) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  }
} catch (err) {
  console.warn('DNS override warning:', err.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
