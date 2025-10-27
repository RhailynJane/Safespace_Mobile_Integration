import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prioritize Wi-Fi and Ethernet interfaces
        const priority = name.toLowerCase().includes('wi-fi') ? 1 : 
                        name.toLowerCase().includes('wireless') ? 1 :
                        name.toLowerCase().includes('ethernet') ? 2 : 3;
        candidates.push({ address: iface.address, priority, name });
      }
    }
  }
  
  // Sort by priority and return the best candidate
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.priority - b.priority);
    console.log(`📡 Available network interfaces:`);
    candidates.forEach(c => console.log(`   ${c.name}: ${c.address}`));
    console.log(`✨ Selected: ${candidates[0].name} (${candidates[0].address})`);
    return candidates[0].address;
  }
  
  return 'localhost';
}

function updateEnvFile() {
  // Check for .env.local first, then fall back to .env
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envPath = path.join(__dirname, '..', '.env');
  
  let targetPath;
  if (fs.existsSync(envLocalPath)) {
    targetPath = envLocalPath;
    console.log('📝 Using .env.local file');
  } else {
    targetPath = envPath;
    console.log('📝 Using .env file');
  }
  
  const localIP = getLocalIP();
  const newApiUrl = `http://${localIP}:3001`;
  
  console.log(`🔍 Detected local IP: ${localIP}`);
  
  try {
    let envContent = fs.readFileSync(targetPath, 'utf8');
    
    // Replace the EXPO_PUBLIC_API_URL line
    const updated = envContent.replaceAll(
      /EXPO_PUBLIC_API_URL=http:\/\/[0-9.]+:3001/g,
      `EXPO_PUBLIC_API_URL=${newApiUrl}`
    );
    
    fs.writeFileSync(targetPath, updated, 'utf8');
    console.log(`✅ Updated ${path.basename(targetPath)} with: ${newApiUrl}`);
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
}

updateEnvFile();

