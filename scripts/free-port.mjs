import { execSync } from 'child_process';

try {
  const output = execSync('netstat -ano', { encoding: 'utf8' });
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes(':3000') && line.includes('LISTENING')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && Number(pid) > 0 && Number(pid) !== process.pid) {
        console.log(`[*] Freeing port 3000 (closing PID ${pid})...`);
        try {
          process.kill(Number(pid), 'SIGKILL');
        } catch {
          try {
            execSync(`taskkill /F /PID ${pid} >nul 2>&1`);
          } catch {}
        }
      }
    }
  }
} catch {}
