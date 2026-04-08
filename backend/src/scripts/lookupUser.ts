/**
 * lookupUser.ts — Look up a user's familyId by username.
 *
 * Usage:  npm run db:lookup -- <username>
 */

import { usersRepo } from "../repos/usersRepo.js";

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error("Usage: npm run db:lookup -- <username>");
    process.exit(1);
  }

  const user = await usersRepo.getByUsername(username);
  if (!user) {
    console.error(`User "${username}" not found.`);
    process.exit(1);
  }

  console.log(user.familyId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
