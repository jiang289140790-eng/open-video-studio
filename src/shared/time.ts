export function nowIso(): string {
  return new Date().toISOString();
}

export function addSecondsIso(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}
