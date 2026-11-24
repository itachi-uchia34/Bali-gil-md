const axios = require('axios');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const net = require('net');

function isBlockedIp(address) {
  const ip = String(address || '').toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  const family = net.isIP(ip);
  if (family === 4) {
    const [a, b, c] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2))))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      || (a === 203 && b === 0 && c === 113);
  }
  if (family === 6) {
    if (ip.startsWith('::ffff:')) return true;
    const firstHextet = parseInt(ip.split(':')[0] || '0', 16);
    // Allow only global-unicast IPv6 (2000::/3); this excludes loopback,
    // link-local, unique-local, unspecified, multicast and mapped forms.
    return firstHextet < 0x2000 || firstHextet >= 0x4000
      || ip.startsWith('2001:db8:') || ip.startsWith('2001:10:');
  }
  return true;
}

function isBlockedHostname(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')
      || host.endsWith('.internal') || host === 'metadata.google.internal') return true;
  if (net.isIP(host)) return isBlockedIp(host);
  return false;
}

async function resolvePublicAddresses(hostname) {
  if (isBlockedHostname(hostname)) throw new Error('Private or local destination is blocked');
  if (net.isIP(hostname)) return [{ address: hostname, family: net.isIP(hostname) }];
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => isBlockedIp(record.address))) {
    throw new Error('Private or local destination is blocked');
  }
  return records;
}

function pinnedAgent(protocol, hostname, records) {
  const lookup = (requestedHost, options, callback) => {
    if (String(requestedHost).toLowerCase() !== String(hostname).toLowerCase()) {
      callback(new Error('Unexpected DNS lookup while fetching public URL'));
      return;
    }
    if (options && options.all) {
      callback(null, records);
      return;
    }
    const selected = records[0];
    callback(null, selected.address, selected.family);
  };
  const Agent = protocol === 'https:' ? https.Agent : http.Agent;
  return new Agent({ keepAlive: false, lookup });
}

/**
 * GET a public HTTP(S) URL. Redirect targets are parsed, DNS-checked and pinned
 * independently so redirects and DNS rebinding cannot reach private addresses.
 */
async function getPublicUrl(url, options = {}) {
  let current;
  try {
    current = new URL(url);
  } catch (_) {
    throw new Error('Invalid URL');
  }
  const maxRedirects = Number.isInteger(options.maxRedirects) ? Math.min(Math.max(options.maxRedirects, 0), 5) : 5;
  const requestOptions = { ...options };
  delete requestOptions.maxRedirects;

  for (let redirects = 0; ; redirects++) {
    if (!['http:', 'https:'].includes(current.protocol) || current.username || current.password) {
      throw new Error('Only public HTTP(S) URLs are supported');
    }
    const records = await resolvePublicAddresses(current.hostname);
    const response = await axios.get(current.href, {
      ...requestOptions,
      httpAgent: pinnedAgent(current.protocol, current.hostname, records),
      httpsAgent: pinnedAgent(current.protocol, current.hostname, records),
      proxy: false,
      maxRedirects: 0,
      validateStatus: status => status >= 200 && status < 400
    });

    if (response.status >= 300 && response.status < 400) {
      if (response.data && typeof response.data.destroy === 'function') response.data.destroy();
      const location = response.headers?.location;
      if (!location || redirects >= maxRedirects) throw new Error('Too many or invalid redirects');
      current = new URL(location, current);
      continue;
    }
    return { response, url: current.href };
  }
}

module.exports = { getPublicUrl, isBlockedIp, isBlockedHostname, resolvePublicAddresses };
