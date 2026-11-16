import { hashPassword } from "../src/server/password";

const username = process.argv[2];
const password = process.argv[3];
if (!username || !password) {
  console.error("Usage: npm run hash-password -- <username> <password>");
  process.exit(1);
}
const hashed = await hashPassword(password);
const id = crypto.randomUUID();
const now = new Date().toISOString();
console.log(
  `INSERT INTO users (id, username, password_hash, salt, role, is_demo, created_at) VALUES ('${id}', '${username.replace(/'/g, "''")}', '${hashed.hash}', '${hashed.salt}', 'admin', 0, '${now}');`,
);
