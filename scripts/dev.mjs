import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const isWin = process.platform === 'win32';

const services = [
  {
    name: 'backend',
    cwd: path.join(rootDir, 'fundnest-backend'),
    command: 'npm run dev',
  },
  {
    name: 'ai',
    cwd: path.join(rootDir, 'fundnest-ai'),
    command: 'python -m uvicorn main:app --host 0.0.0.0 --port 8000',
  },
  {
    name: 'frontend',
    cwd: path.join(rootDir, 'fundnest-frontend'),
    command: 'npm run dev',
  },
];

const children = services.map((svc) => {
  const child = spawn(svc.command, {
    cwd: svc.cwd,
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[${svc.name}] exited with code ${code}`);
    }
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    if (child.pid && !child.killed) {
      if (isWin) {
        spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
