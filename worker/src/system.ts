import * as os from 'os';
import * as fs from 'fs';

export function getSystemMetrics() {
  try {
    const metrics: any = {
      hostname: os.hostname(),
      uptime: `${Math.floor(os.uptime())}s`,
      cpu_usage: null,
      ram_usage: null,
      disk_usage: null
    };

    // RAM usage via os module
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    metrics.ram_usage = Math.round((1 - freeMem / totalMem) * 100);

    // CPU load (average over 1 min)
    const loads = os.loadavg();
    const cpus = os.cpus().length;
    metrics.cpu_usage = Math.min(100, Math.round((loads[0] / cpus) * 100));

    // Try to get disk usage via df -h if on linux
    // In a limited worker environment, this might fail, so we return null if so.
    
    return metrics;
  } catch (error) {
    console.error('Error collecting system metrics:', error);
    return {
      hostname: os.hostname(),
      uptime: 'Unknown',
      cpu_usage: null,
      ram_usage: null,
      disk_usage: null
    };
  }
}
