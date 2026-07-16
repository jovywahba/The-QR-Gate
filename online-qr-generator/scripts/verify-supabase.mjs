// ───────────────────────────────────────────────────────────────
// Live Supabase security verification (Part 4 §5/§6/§34).
// Run AFTER filling .env.local and applying supabase/migrations:
//
//   node scripts/verify-supabase.mjs
//
// Creates two throwaway users, exercises the real allow/deny matrix
// (anon reads, cross-user access, storage isolation, public RPC),
// prints a report, and cleans everything up. Requires the service
// role key locally — never run it from untrusted machines.
// ───────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

// Minimal .env.local loader (no extra deps).
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE || [URL_, ANON, SERVICE].some((v) => v.includes("placeholder"))) {
  console.error("BLOCKED: real NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY required in .env.local");
  process.exit(2);
}

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const results = [];
const check = (name, expected, actual) =>
  results.push({ name, expected, actual, ok: expected === actual });

async function userClient(email, password) {
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw new Error(`createUser failed: ${createError.message}`);
  const client = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn failed: ${error.message}`);
  return { client, id: data.user.id };
}

const stamp = randomUUID().slice(0, 8);
const emailA = `qa-a-${stamp}@example.com`;
const emailB = `qa-b-${stamp}@example.com`;
let A, B;
const anon = createClient(URL_, ANON, { auth: { persistSession: false } });

try {
  // ── Schema present ──
  for (const table of ["qr_codes", "qr_link_items", "qr_social_items", "qr_assets"]) {
    const { error } = await admin.from(table).select("*", { head: true, count: "exact" });
    check(`table ${table} exists`, "yes", error ? `no (${error.code})` : "yes");
  }
  const { data: buckets } = await admin.storage.listBuckets();
  for (const b of ["qr-private", "qr-public"]) {
    check(`bucket ${b} exists`, "yes", buckets?.some((x) => x.name === b) ? "yes" : "no");
  }

  A = await userClient(emailA, `Aa1!${randomUUID()}`);
  B = await userClient(emailB, `Bb1!${randomUUID()}`);

  // ── User A creates a draft + publishes-ish state via direct rows ──
  const { data: draftA, error: insertA } = await A.client
    .from("qr_codes")
    .insert({ user_id: A.id, type: "links", status: "draft", content: { type: "links", data: {} }, design: {} })
    .select("id")
    .single();
  check("A inserts own draft", "allow", insertA ? `deny (${insertA.code})` : "allow");

  const { data: forgedB, error: forgeError } = await B.client
    .from("qr_codes")
    .insert({ user_id: A.id, type: "links", status: "draft", content: {}, design: {} })
    .select("id")
    .maybeSingle();
  check("B cannot insert a row owned by A", "deny", forgeError || !forgedB ? "deny" : "allow");

  // ── Anonymous access ──
  const { data: anonList } = await anon.from("qr_codes").select("id");
  check("anon cannot list qr_codes", "deny", (anonList ?? []).length === 0 ? "deny" : "allow");
  const { error: anonInsert } = await anon
    .from("qr_codes")
    .insert({ user_id: A.id, type: "links", status: "draft", content: {}, design: {} });
  check("anon cannot insert", "deny", anonInsert ? "deny" : "allow");

  // ── Cross-user reads/writes ──
  const { data: bReadsA } = await B.client.from("qr_codes").select("id").eq("id", draftA.id);
  check("B cannot read A's draft", "deny", (bReadsA ?? []).length === 0 ? "deny" : "allow");
  const { data: bUpdatesA } = await B.client
    .from("qr_codes")
    .update({ name: "hacked" })
    .eq("id", draftA.id)
    .select("id");
  check("B cannot update A's record", "deny", (bUpdatesA ?? []).length === 0 ? "deny" : "allow");
  const { data: bArchivesA } = await B.client
    .from("qr_codes")
    .update({ status: "archived" })
    .eq("id", draftA.id)
    .select("id");
  check("B cannot archive A's record", "deny", (bArchivesA ?? []).length === 0 ? "deny" : "allow");

  // ── Assets: B cannot attach to A's QR / read A's asset rows ──
  const { error: bAssetOnA } = await B.client.from("qr_assets").insert({
    qr_code_id: draftA.id,
    user_id: B.id,
    asset_type: "image",
    storage_path: `${B.id}/${draftA.id}/${randomUUID()}-x.png`,
    mime_type: "image/png",
    file_name: "x.png",
    file_size: 10,
  });
  check("B cannot attach an asset to A's QR", "deny", bAssetOnA ? "deny" : "allow");

  // ── Storage isolation ──
  const pathA = `${A.id}/${draftA.id}/${randomUUID()}-test.png`;
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
  const { error: aUpload } = await A.client.storage.from("qr-private").upload(pathA, png, { contentType: "image/png" });
  check("A uploads under own prefix", "allow", aUpload ? `deny (${aUpload.message})` : "allow");
  const { error: bUploadInA } = await B.client.storage
    .from("qr-private")
    .upload(`${A.id}/${draftA.id}/${randomUUID()}-evil.png`, png, { contentType: "image/png" });
  check("B cannot upload into A's prefix", "deny", bUploadInA ? "deny" : "allow");
  const { data: bDownloadA } = await B.client.storage.from("qr-private").download(pathA);
  check("B cannot download A's private file", "deny", bDownloadA ? "allow" : "deny");
  const { data: anonListStorage } = await anon.storage.from("qr-private").list(A.id);
  check("anon cannot list private bucket", "deny", (anonListStorage ?? []).length === 0 ? "deny" : "allow");
  const { error: anonPublicWrite } = await anon.storage
    .from("qr-public")
    .upload(`q/${randomUUID()}.png`, png, { contentType: "image/png" });
  check("anon cannot write public bucket", "deny", anonPublicWrite ? "deny" : "allow");

  // ── Public read path ──
  const slug = `qa${stamp}test`;
  await A.client
    .from("qr_codes")
    .update({ slug, status: "draft" })
    .eq("id", draftA.id);
  const { data: draftRpc } = await anon.rpc("get_public_qr", { p_slug: slug });
  check("get_public_qr hides drafts", "deny", draftRpc ? "allow" : "deny");
  await A.client
    .from("qr_codes")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", draftA.id);
  const { data: pubRpc } = await anon.rpc("get_public_qr", { p_slug: slug });
  check("get_public_qr returns published", "allow", pubRpc ? "allow" : "deny");
  check(
    "public payload has no user_id/storage_path",
    "clean",
    pubRpc && !JSON.stringify(pubRpc).includes(A.id) && !JSON.stringify(pubRpc).includes("storage_path")
      ? "clean"
      : "leaky",
  );
  await A.client.from("qr_codes").update({ status: "archived" }).eq("id", draftA.id);
  const { data: archRpc } = await anon.rpc("get_public_qr", { p_slug: slug });
  check("get_public_qr hides archived", "deny", archRpc ? "allow" : "deny");
} finally {
  // ── Cleanup ──
  try {
    if (A) {
      await admin.storage.from("qr-private").remove(
        (await admin.storage.from("qr-private").list(A.id, { limit: 100 })).data?.map((o) => `${A.id}/${o.name}`) ?? [],
      );
      await admin.from("qr_codes").delete().eq("user_id", A.id);
      await admin.auth.admin.deleteUser(A.id);
    }
    if (B) {
      await admin.from("qr_codes").delete().eq("user_id", B.id);
      await admin.auth.admin.deleteUser(B.id);
    }
  } catch (err) {
    console.error("cleanup warning:", err?.message ?? err);
  }
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}  (expected ${r.expected}, got ${r.actual})`);
}
console.log(`\n${results.length - failed}/${results.length} security checks passed`);
process.exit(failed === 0 ? 0 : 1);
