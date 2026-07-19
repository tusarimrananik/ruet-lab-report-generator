import { spawn } from 'node:child_process';

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== '--strictPort');
const child = spawn(
  process.execPath,
  ['node_modules/@rsbuild/core/bin/rsbuild.js', 'dev', ...forwardedArgs],
  { stdio: 'inherit' },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
