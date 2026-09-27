// Encrypts the prize picture for /mreomd so the public repo only holds ciphertext.
//
//   PRIZE_KEY=<base64 32 bytes> node scripts/encrypt-prize.mjs path/to/prize.jpg
//
// Accepts prize.jpg or prize.png, shrinks it to 1200px wide JPEG and writes
// private/prize.enc (12-byte IV | 16-byte GCM tag | ciphertext). Without PRIZE_KEY a new key
// is generated and printed: put it in the PRIZE_KEY env var on Vercel. Never commit the
// original picture.
import { createCipheriv, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const input = process.argv[2];
if (!input || !/\.(jpe?g|png)$/i.test(input)) {
  console.error("usage: node scripts/encrypt-prize.mjs prize.jpg|prize.png");
  process.exit(1);
}

let key = process.env.PRIZE_KEY ? Buffer.from(process.env.PRIZE_KEY, "base64") : null;
if (!key) {
  key = randomBytes(32);
  console.log(`PRIZE_KEY=${key.toString("base64")}`);
}
if (key.length !== 32) {
  console.error("PRIZE_KEY must be 32 bytes, base64-encoded");
  process.exit(1);
}

const jpeg = await sharp(input).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([cipher.update(jpeg), cipher.final()]);
const out = path.join(process.cwd(), "private", "prize.enc");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([iv, cipher.getAuthTag(), body]));
console.log(`wrote ${out} (${jpeg.length} bytes of JPEG)`);
