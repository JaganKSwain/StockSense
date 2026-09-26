import { execSync } from 'child_process';

let killedAny = false;

try {
  const output = execSync('netstat -ano', { encoding: 'utf8' });
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes(':3000') && line.includes('LISTENING')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && Number(pid) > 0 && Number(pid) !== process.pid) {
        console.log(`[*] Terminating server on port 3000 (Process Tree PID ${pid})...`);
        try {
          execSync(`taskkill /F /T /PID ${pid} >nul 2>&1`);
          killedAny = true;
        } catch {
          try {
            process.kill(Number(pid), 'SIGKILL');
            killedAny = true;
          } catch {}
        }
      }
    }
  }
  if (killedAny) {
    console.log('[OK] All servers on port 3000 terminated successfully.');
  }
} catch (e) {
  // Silent catch
}
