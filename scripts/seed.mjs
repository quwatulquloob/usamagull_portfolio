#!/usr/bin/env node
/**
 * Seed script — provisions the admin account and session secret.
 *
 * Credentials are stored as encrypted Cloudflare Worker secrets, NOT in the
 * D1 database, so there is nothing to leak from a SQL dump. For local dev
 * the same values are written to `.dev.vars` (gitignored).
 *
 * Usage:
 *   node scripts/seed.mjs            # interactive prompts
 *   ADMIN_USERNAME=... ADMIN_PASSWORD=... node scripts/seed.mjs
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const DEV_VARS = '.dev.vars';
const MIN_PASSWORD_LENGTH = 8;
const PBKDF2_ITERATIONS = 100000;

/**
 * PBKDF2-SHA256 hash in the exact format the Worker's auth layer expects:
 * `pbkdf2$<iterations>$<salt_b64>$<hash_b64>`. The plaintext password is
 * never stored — only this hash goes into the encrypted Worker secret.
 */
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function generatePassword() {
  // 20 chars from an unambiguous alphabet (no 0/O/1/l/I).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  const bytes = randomBytes(20);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

async function prompt(question, fallback = '') {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const suffix = fallback ? ` [${fallback}]` : '';
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  rl.close();
  return answer || fallback;
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

async function main() {
  console.log('\n=== Admin seed script (Cloudflare Workers) ===\n');

  const username = (await prompt('Admin username', process.env.ADMIN_USERNAME || 'admin')).trim();
  if (username.length < 3) {
    console.error('✗ Username must be at least 3 characters.');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD || '';
  if (!password) {
    const useGenerated = await prompt('Generate a strong random password? (Y/n)', 'Y');
    if (/^y/i.test(useGenerated)) {
      password = generatePassword();
    } else {
      password = await prompt('Admin password');
    }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`✗ Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const isRemote = /^y/i.test(await prompt('Configure secrets for PRODUCTION (wrangler secret put)? (Y/n = local .dev.vars)', 'Y'));

  // A dedicated HMAC secret signs the admin session cookies.
  const sessionSecret = randomBytes(32).toString('base64url');

  const setSecret = (name, value) => {
    if (isRemote) {
      console.log(`\n→ Setting production secret: ${name}`);
      execSync(`npx wrangler secret put ${name}`, { input: value + '\n', stdio: ['pipe', 'inherit', 'inherit'] });
    } else {
      console.log(`→ Writing ${name} to ${DEV_VARS}`);
      return { name, value };
    }
  };

  const devVarsEntries = [];
  const setResult1 = setSecret('ADMIN_USERNAME', username);
  if (setResult1) devVarsEntries.push(setResult1);
  const setResult2 = setSecret('ADMIN_PASSWORD_HASH', hashPassword(password));
  if (setResult2) devVarsEntries.push(setResult2);
  const setResult3 = setSecret('SESSION_SECRET', sessionSecret);
  if (setResult3) devVarsEntries.push(setResult3);

  if (!isRemote) {
    const lines = devVarsEntries.map(({ name, value }) => `${name}=${value}`);
    const existing = existsSync(DEV_VARS) ? readFileSync(DEV_VARS, 'utf8') : '';
    const merged = existing
      .split('\n')
      .filter((l) => l.trim() && !devVarsEntries.some(({ name }) => l.startsWith(name + '=')))
      .concat(lines);
    writeFileSync(DEV_VARS, merged.join('\n') + '\n');
    console.log(`\n✓ Wrote ${DEV_VARS} (never commit this file — it is gitignored).`);
  }

  console.log('\n✓ Seeding complete.');
  console.log(`\n  Admin username: ${username}`);
  console.log(`  Admin password: ${password}`);
  console.log('  ↳ Only its PBKDF2-SHA256 hash was stored as an encrypted secret;');
  console.log('    save the password itself in your password manager now.');
  if (!isRemote) {
    console.log(`  ↳ Hash also written to ${DEV_VARS} for local dev (gitignored).`);
  }
  console.log('\nNext: npm run db:init:local && npm run dev\n');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
