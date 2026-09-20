// Structured JSON logger — merge into your project's src/logger.ts.
// ADAPT: replace SERVICE_NAME with this project's service name.
const SERVICE_NAME = 'auth';

type Level = 'debug' | 'info' | 'warn' | 'error';

export function log(
  level: Level,
  msg: string,
  fields: Record<string, unknown> = {}
): void {
  const line = JSON.stringify({
    level, msg, ts: new Date().toISOString(), service: SERVICE_NAME,
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
