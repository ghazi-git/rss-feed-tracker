// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(...data: any[]) {
  const now = new Date();
  console.log(`[${now.toISOString()}]`, ...data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logError(...data: any[]) {
  const now = new Date();
  console.error(`[${now.toISOString()}]`, ...data);
}
