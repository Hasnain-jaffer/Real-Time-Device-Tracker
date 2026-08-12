// server/src/scripts/promoteToAdmin.js
// One-time utility: run manually from the command line to promote your own
// account to admin. This is intentionally NOT an API endpoint — granting
// admin rights must never be reachable over HTTP without an existing admin.
//
// Usage (from server/ directory): node src/scripts/promoteToAdmin.js your@email.com

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/user.model.js';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node src/scripts/promoteToAdmin.js <email>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email: ${email}`);
  } else {
    console.log(`✅ ${user.email} is now an admin.`);
  }

  await mongoose.disconnect();
}

run();