/**
 * Minimal structured JSON logger. Never log secrets or full card/PAN data.
 * Redacts known sensitive keys defensively before output.
 */

const SENSITIVE_KEYS = [
  "app_key",
  "appkey",
  "gp_app_key",
  "secret",
  "client_secret",
  "vivaclientsecret",
  "internal_api_secret",
  "authorization",
  "apikey",
  "anon_key",
  "token",
  "access_token",
  "pan",
  "card",
  "cardnumber",
  "cvv",
  "cvc",
];

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth-limit]";
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
      out[k] = "[redacted]";
    } else {
      out[k] = redact(v, depth + 1);
    }
  }
  return out;
}

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, event: string, data?: Record<string, unknown>) {
  const line = {
    t: new Date().toISOString(),
    level,
    event,
    ...(data ? (redact(data) as Record<string, unknown>) : {}),
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const log = {
  debug: (event: string, data?: Record<string, unknown>) =>
    emit("debug", event, data),
  info: (event: string, data?: Record<string, unknown>) =>
    emit("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) =>
    emit("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) =>
    emit("error", event, data),
};
