/**
 * ───────────────────────────────────────────────────────────────
 * Upload rules shared by client (pre-flight) and server (authority).
 * The browser-provided MIME type is never trusted alone — both sides
 * sniff magic bytes; the server re-verifies the stored object before
 * an asset row is created.
 * ───────────────────────────────────────────────────────────────
 */

export type AssetType = "pdf" | "image" | "logo" | "cover" | "thumbnail" | "audio" | "video" | "icon";

export type UploadRule = {
  maxBytes: number;
  /** Accepted browser MIME types (pre-flight only). */
  mimes: string[];
  extensions: string[];
  /** Accepted sniffed kinds (the authority). */
  kinds: SniffedKind[];
  label: string;
};

export type SniffedKind = "pdf" | "png" | "jpeg" | "gif" | "webp" | "mp3" | "mp4" | "webm";

const MB = 1024 * 1024;

const IMAGE_RULE: Omit<UploadRule, "maxBytes" | "label"> = {
  mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  kinds: ["jpeg", "png", "webp", "gif"],
};

export const UPLOAD_RULES: Record<AssetType, UploadRule> = {
  pdf: {
    maxBytes: 15 * MB,
    mimes: ["application/pdf"],
    extensions: [".pdf"],
    kinds: ["pdf"],
    label: "PDF up to 15 MB",
  },
  image: { ...IMAGE_RULE, maxBytes: 8 * MB, label: "JPG, PNG, WebP, or GIF up to 8 MB" },
  logo: { ...IMAGE_RULE, maxBytes: 4 * MB, label: "JPG, PNG, WebP, or GIF up to 4 MB" },
  cover: { ...IMAGE_RULE, maxBytes: 8 * MB, label: "JPG, PNG, WebP, or GIF up to 8 MB" },
  thumbnail: { ...IMAGE_RULE, maxBytes: 4 * MB, label: "JPG, PNG, WebP, or GIF up to 4 MB" },
  icon: { ...IMAGE_RULE, maxBytes: 2 * MB, label: "JPG, PNG, WebP, or GIF up to 2 MB" },
  audio: {
    maxBytes: 25 * MB,
    mimes: ["audio/mpeg", "audio/mp3"],
    extensions: [".mp3"],
    kinds: ["mp3"],
    label: "MP3 up to 25 MB",
  },
  video: {
    maxBytes: 200 * MB,
    mimes: ["video/mp4", "video/webm", "video/quicktime"],
    extensions: [".mp4", ".webm", ".mov", ".m4v"],
    kinds: ["mp4", "webm"],
    label: "MP4, WebM, or MOV up to 200 MB",
  },
};

export function isAssetType(value: string | null | undefined): value is AssetType {
  return !!value && value in UPLOAD_RULES;
}

/** Sniff the file kind from its first bytes. Needs ≥ 16 bytes. */
export function sniffMagicBytes(bytes: Uint8Array): SniffedKind | null {
  if (bytes.length < 12) return null;
  const ascii = (start: number, len: number) =>
    String.fromCharCode(...bytes.slice(start, start + len));

  if (ascii(0, 4) === "%PDF") return "pdf";
  if (bytes[0] === 0x89 && ascii(1, 3) === "PNG") return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (ascii(0, 4) === "GIF8") return "gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "webp";
  if (ascii(0, 3) === "ID3") return "mp3";
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "mp3"; // bare MPEG frame sync
  if (ascii(4, 4) === "ftyp") return "mp4"; // also covers .mov/.m4v (QuickTime container)
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "webm";
  return null;
}

/** Strip paths/unsafe chars; keep the extension; cap the length. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const dot = base.lastIndexOf(".");
  const stem = (dot > 0 ? base.slice(0, dot) : base)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 60);
  const ext = (dot > 0 ? base.slice(dot) : "").toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 10);
  return `${stem || "file"}${ext}`;
}

export type UploadCheck = { ok: true } | { ok: false; error: string };

/** Metadata pre-flight (both sides). Magic bytes checked separately. */
export function checkUploadMetadata(args: {
  assetType: AssetType;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): UploadCheck {
  const rule = UPLOAD_RULES[args.assetType];
  if (args.fileSize <= 0) return { ok: false, error: "The file is empty." };
  if (args.fileSize > rule.maxBytes) {
    return { ok: false, error: `File is too large — max ${Math.round(rule.maxBytes / MB)} MB.` };
  }
  const lower = args.fileName.toLowerCase();
  if (!rule.extensions.some((ext) => lower.endsWith(ext))) {
    return { ok: false, error: `Unsupported file type — expected ${rule.extensions.join(", ")}.` };
  }
  if (args.mimeType && !rule.mimes.includes(args.mimeType.toLowerCase())) {
    return { ok: false, error: `Unsupported file type — expected ${rule.label}.` };
  }
  return { ok: true };
}

/** Authority check on actual bytes (server re-runs this on the stored object). */
export function checkMagicBytes(assetType: AssetType, head: Uint8Array): UploadCheck {
  const kind = sniffMagicBytes(head);
  if (!kind || !UPLOAD_RULES[assetType].kinds.includes(kind)) {
    return { ok: false, error: "The file's contents don't match its type." };
  }
  return { ok: true };
}

/** Private-bucket object path: {userId}/{qrCodeId}/{uuid}-{sanitizedName}. */
export function buildStoragePath(userId: string, qrCodeId: string, fileName: string): string {
  return `${userId}/${qrCodeId}/${globalThis.crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

const STORAGE_PATH_PATTERN =
  /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}-[a-zA-Z0-9._-]{1,80}$/;

/** Server-side guard: never accept arbitrary storage paths from the client. */
export function isOwnedStoragePath(path: string, userId: string, qrCodeId: string): boolean {
  return STORAGE_PATH_PATTERN.test(path) && path.startsWith(`${userId}/${qrCodeId}/`);
}
