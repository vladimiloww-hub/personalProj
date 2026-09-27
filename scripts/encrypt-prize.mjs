// Encrypts the prize picture for /mreomd so the public repo only holds ciphertext.
//
//   PRIZE_KEY='<any passphrase>' node scripts/encrypt-prize.mjs path/to/prize.jpg
//
// Accepts prize.jpg or prize.png, shrinks it to 1200px wide JPEG and writes
// private/prize.enc (12-byte IV | 16-byte GCM tag | ciphertext). Set the same PRIZE_KEY
// passphrase in the Vercel env vars. Never commit the original picture.
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const input = process.argv[2];
if (!input || !/\.(jpe?g|png)$/i.test(input)) {
  console.error("usage: node scripts/encrypt-prize.mjs prize.jpg|prize.png");
  process.exit(1);
}

const passphrase = process.env.PRIZE_KEY;
if (!passphrase || passphrase.length < 12) {
  console.error("set PRIZE_KEY to a passphrase of at least 12 characters");
  process.exit(1);
}
// Must match prizeKey() in src/app/api/mreomd/prize/route.ts.
const key = scryptSync(passphrase, "mreomd-prize-v1", 32);

const jpeg = await sharp(input).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([cipher.update(jpeg), cipher.final()]);
const out = path.join(process.cwd(), "private", "prize.enc");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([iv, cipher.getAuthTag(), body]));
console.log(`wrote ${out} (${jpeg.length} bytes of JPEG)`);
