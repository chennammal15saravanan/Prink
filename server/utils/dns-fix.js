const dns = require('dns');

// On Windows, Node.js's internal resolver (c-ares) can fail to parse the local system's DNS settings
// from the registry, causing SRV record lookups (like MongoDB Atlas connection strings) to fail
// with querySrv ECONNREFUSED. Setting public DNS servers (Google & Cloudflare) resolves this issue.
if (process.platform === 'win32' && dns.setServers) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('[DNS FIX] Warning: Failed to set public DNS servers:', err.message);
  }
}
