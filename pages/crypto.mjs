// Browser equivalent for the SHA-256 fingerprints used by the shared renderer.
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
export function createHash(algorithm) {
  if(algorithm!=='sha256')throw new Error('Unsupported fingerprint algorithm');
  const hash=sha256.create();
  return {update(value){hash.update(typeof value==='string'?new TextEncoder().encode(value):value);return this;},digest(format){if(format!=='hex')throw new Error('Unsupported digest format');return bytesToHex(hash.digest());}};
}
