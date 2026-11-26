import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const frontendDir = path.join(rootDir, 'fundnest-frontend');

execSync('npm run build', {
  cwd: frontendDir,
  stdio: 'inherit',
  env: { ...process.env, VERCEL: '1' },
});

const srcOutput = path.join(frontendDir, '.vercel', 'output');
const destOutput = path.join(rootDir, '.vercel', 'output');

if (!fs.existsSync(srcOutput)) {
  throw new Error(`Expected Nitro Vercel output at ${srcOutput}, but it was not generated.`);
}

fs.rmSync(destOutput, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destOutput), { recursive: true });
fs.cpSync(srcOutput, destOutput, { recursive: true });
console.log(`Copied Vercel Build Output to ${destOutput}`);

