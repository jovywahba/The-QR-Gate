/**
 * ───────────────────────────────────────────────────────────────
 * Last-super-admin invariant (PURE). Mirrors the authoritative DB guard in
 * migration 0006 (`admin_grant_role`), which enforces it atomically under an
 * advisory lock. This copy exists so the server action can reject the change
 * early with a clear message (defense in depth) and so the invariant is
 * unit-tested. The DATABASE remains the source of truth.
 * ───────────────────────────────────────────────────────────────
 */

export type Membership = { userId: string; role: string; isActive: boolean };

/** The user ids of the currently active super admins. */
export function activeSuperAdmins(members: Membership[]): string[] {
  return members.filter((m) => m.isActive && m.role === "super_admin").map((m) => m.userId);
}

/**
 * Would setting `targetUserId` to `newRole` ("none" = remove / disable) strip
 * the LAST active super admin? When true, the change must be blocked — it is
 * impossible to demote, remove, or disable the final active super admin.
 */
export function wouldStrandSuperAdmins(
  members: Membership[],
  targetUserId: string,
  newRole: string,
): boolean {
  const supers = activeSuperAdmins(members);
  if (!supers.includes(targetUserId)) return false; // target isn't an active super admin
  if (newRole === "super_admin") return false; // staying a super admin
  // Demotion or removal: stranded only if no OTHER active super admin remains.
  return supers.filter((id) => id !== targetUserId).length < 1;
}
