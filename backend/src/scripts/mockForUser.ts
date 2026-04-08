/**
 * mockForUser.ts — Register or login a user, then populate their family with mock data.
 *
 * Usage:
 *   npm run db:mock:user -- <username> <password>
 *
 * If the user doesn't exist, registers them (creates a new family).
 * If the user exists, logs in.
 * Then runs the same mock data insertion as mockData.ts.
 */

const BASE_URL = process.env.API_URL ?? "http://localhost:3000";

async function getOrCreateUser(username: string, password: string) {
  // Try login first
  const loginRes = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (loginRes.ok) {
    const data = await loginRes.json();
    console.log(`  🔑  Logged in as "${username}"`);
    return data.user.familyId as string;
  }

  // Login failed — try register
  const regRes = await fetch(`${BASE_URL}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!regRes.ok) {
    const err = await regRes.json().catch(() => regRes.statusText);
    throw new Error(`Failed to login or register: ${JSON.stringify(err)}`);
  }

  const data = await regRes.json();
  console.log(`  🆕  Registered new user "${username}"`);
  return data.user.familyId as string;
}

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error("❌  Usage: npm run db:mock:user -- <username> <password>");
    process.exit(1);
  }

  console.log(`\n🎭  Mock data setup for user "${username}"…\n`);

  const familyId = await getOrCreateUser(username, password);
  console.log(`  👨‍👩‍👧‍👦  Family ID: ${familyId}\n`);

  // Import and run mock data insertion
  // Pass familyId + any extra flags (--only, --skip-members, etc.) to mockData
  const extraArgs = process.argv.slice(4); // everything after username & password
  process.argv = [process.argv[0], process.argv[1], familyId, ...extraArgs];
  await import("./mockData.js");
}

main().catch((err) => {
  console.error("❌  Failed:", err.message);
  process.exit(1);
});
