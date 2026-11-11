// Credential patterns, shared by the pre-commit scan (scoring/score.mjs check-protected)
// and the renderer's log redaction (render.mjs).
export const SECRET_PATTERNS = [
  ["Anthropic key", /sk-ant-[A-Za-z0-9_-]{20,}/g],
  ["API key (sk-)", /\bsk-[A-Za-z0-9_-]{20,}/g],
  ["GitHub token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{22,}/g],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/g],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ["Meta/Instagram token", /\bEAA[A-Za-z0-9]{60,}/g],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
];

const mask = (s) => `${s.slice(0, 4)}…[redacted]`;

/** Replaces anything that looks like a credential with a masked stub. */
export function redact(text) {
  let out = String(text);
  for (const [, re] of SECRET_PATTERNS) out = out.replace(re, mask);
  return out;
}

/** Returns [{line, kind, masked}] for every credential-like string in text. */
export function findSecrets(text) {
  const hits = [];
  String(text).split(/\r?\n/).forEach((l, i) => {
    for (const [kind, re] of SECRET_PATTERNS) for (const m of l.match(re) || []) hits.push({ line: i + 1, kind, masked: mask(m) });
  });
  return hits;
}
