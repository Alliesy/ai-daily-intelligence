const TRACKING_KEYS = new Set([
  "dclid",
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "ref_src",
  "s_cid",
  "si",
]);

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const X_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]);
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export const URL_NORMALIZATION_VERSION = "url-v1";

export interface NormalizedUrl {
  normalizedUrl: string;
  provider: "youtube" | "x" | "github" | null;
  externalId: string | null;
  metadata: Record<string, string | string[]>;
  ruleVersion: typeof URL_NORMALIZATION_VERSION;
  usedCanonicalOverride: boolean;
}

export interface NormalizeUrlOptions {
  canonicalOverride?: string;
}

export function normalizeUrl(rawUrl: string, options: NormalizeUrlOptions = {}): NormalizedUrl {
  const parsed = parsePublicHttpUrl(rawUrl);
  const base = normalizeProvider(parsed);

  if (options.canonicalOverride !== undefined) {
    const override = normalizeUrl(options.canonicalOverride);
    return { ...override, usedCanonicalOverride: true };
  }
  return base;
}

function parsePublicHttpUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid source URL: ${rawUrl}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Only HTTP(S) source URLs are supported: ${rawUrl}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`Source URLs must not contain credentials: ${rawUrl}`);
  }
  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === "http:" && parsed.port === "80") ||
      (parsed.protocol === "https:" && parsed.port === "443")) {
    parsed.port = "";
  }
  parsed.hash = "";
  return parsed;
}

function normalizeProvider(url: URL): NormalizedUrl {
  const hostname = url.hostname;
  if (YOUTUBE_HOSTS.has(hostname)) {
    const videoId = youtubeVideoId(url);
    if (videoId !== null) {
      const metadata = collectMeaningfulYouTubeMetadata(url);
      return result(`https://www.youtube.com/watch?v=${videoId}`, "youtube", videoId, metadata);
    }
  }

  if (X_HOSTS.has(hostname)) {
    const status = url.pathname.match(/^\/([^/]+)\/status\/(\d+)(?:\/.*)?$/i);
    if (status?.[2]) {
      return result(`https://x.com/i/status/${status[2]}`, "x", status[2], {});
    }
  }

  if (hostname === "github.com" || hostname === "www.github.com") {
    return normalizeGitHub(url);
  }

  stripTracking(url);
  sortQuery(url);
  return result(url.toString(), null, null, {});
}

function youtubeVideoId(url: URL): string | null {
  let candidate: string | null = null;
  if (url.hostname === "youtu.be") {
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (url.pathname === "/watch") {
    candidate = url.searchParams.get("v");
  } else {
    const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/);
    candidate = match?.[1] ?? null;
  }
  return candidate !== null && VIDEO_ID.test(candidate) ? candidate : null;
}

function collectMeaningfulYouTubeMetadata(url: URL): Record<string, string | string[]> {
  const metadata: Record<string, string | string[]> = {};
  for (const key of ["list", "index", "start", "t", "end"]) {
    const values = url.searchParams.getAll(key);
    if (values.length === 1 && values[0] !== undefined) metadata[key] = values[0];
    if (values.length > 1) metadata[key] = values;
  }
  return metadata;
}

function normalizeGitHub(url: URL): NormalizedUrl {
  url.hostname = "github.com";
  stripTracking(url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    segments[0] = segments[0]!.toLowerCase();
    segments[1] = segments[1]!.replace(/\.git$/i, "").toLowerCase();
    url.pathname = `/${segments.join("/")}`;
  }
  if (segments.length === 2) url.pathname = url.pathname.replace(/\/$/, "");
  sortQuery(url);

  const kind = githubResourceKind(segments);
  const externalId = segments.length >= 2 ? `${kind}:${segments.join("/")}` : null;
  return result(url.toString(), "github", externalId, { resource_kind: kind });
}

function githubResourceKind(segments: string[]): string {
  if (segments.length === 2) return "repository";
  const marker = segments[2]?.toLowerCase();
  if (marker === "issues") return "issue";
  if (marker === "pull") return "pull_request";
  if (marker === "commit" || marker === "commits") return "commit";
  if (marker === "releases") return "release";
  if (marker === "blob" || marker === "raw") return marker;
  return "resource";
}

function stripTracking(url: URL): void {
  for (const key of [...url.searchParams.keys()]) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.startsWith("utm_") || TRACKING_KEYS.has(normalizedKey)) {
      url.searchParams.delete(key);
    }
  }
}

function sortQuery(url: URL): void {
  const entries = [...url.searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) =>
    leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue));
  url.search = "";
  for (const [key, value] of entries) url.searchParams.append(key, value);
}

function result(
  normalizedUrl: string,
  provider: NormalizedUrl["provider"],
  externalId: string | null,
  metadata: Record<string, string | string[]>,
): NormalizedUrl {
  return {
    normalizedUrl,
    provider,
    externalId,
    metadata,
    ruleVersion: URL_NORMALIZATION_VERSION,
    usedCanonicalOverride: false,
  };
}
