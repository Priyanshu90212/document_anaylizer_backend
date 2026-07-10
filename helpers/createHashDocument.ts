import { createHash } from "crypto";

function calculateHash(buffer: Buffer): string {
  return createHash('sha256')
    .update(buffer)
    .digest('hex');
}
export default calculateHash;