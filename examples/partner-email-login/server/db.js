import bcrypt from "bcryptjs";

/** @typedef {{ id: string; email: string; passwordHash: string }} DemoUser */

/** @type {Map<string, DemoUser>} */
const byEmail = new Map();

/** @type {Map<string, DemoUser>} */
const byId = new Map();

let seeded = false;

export async function ensureSeedUsers() {
  if (seeded) return;
  const passwordHash = await bcrypt.hash("password", 10);
  const user = {
    id: "user_demo_1",
    email: "demo@example.com",
    passwordHash,
  };
  byEmail.set(user.email, user);
  byId.set(user.id, user);
  seeded = true;
}

export async function findUserByEmail(email) {
  await ensureSeedUsers();
  return byEmail.get(String(email).trim().toLowerCase()) ?? null;
}

export function findUserById(id) {
  return byId.get(id) ?? null;
}

export async function verifyPassword(plain, passwordHash) {
  return bcrypt.compare(plain, passwordHash);
}
