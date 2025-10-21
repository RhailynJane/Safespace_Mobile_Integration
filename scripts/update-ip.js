const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

function updateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const localIP = getLocalIP();
  const newApiUrl = `http://${localIP}:3001`;
  
  console.log(`🔍 Detected local IP: ${localIP}`);
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the EXPO_PUBLIC_API_URL line
    const updated = envContent.replaceAll(
      /EXPO_PUBLIC_API_URL=http:\/\/[0-9.]+:3001/g,
      `EXPO_PUBLIC_API_URL=${newApiUrl}`
    );
    
    fs.writeFileSync(envPath, updated, 'utf8');
    console.log(`✅ Updated .env file with: ${newApiUrl}`);
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
}

updateEnvFile();
