import { describe, expect, it } from "vitest";
import { activeSuperAdmins, wouldStrandSuperAdmins, type Membership } from "../team-guard";

const M = (userId: string, role: string, isActive = true): Membership => ({ userId, role, isActive });

describe("last-super-admin guard (pure)", () => {
  it("lists only active super admins", () => {
    const members = [M("a", "super_admin"), M("b", "super_admin", false), M("c", "admin"), M("d", "super_admin")];
    expect(activeSuperAdmins(members).sort()).toEqual(["a", "d"]);
  });

  it("blocks removing the ONLY active super admin", () => {
    const members = [M("a", "super_admin"), M("b", "admin")];
    expect(wouldStrandSuperAdmins(members, "a", "none")).toBe(true);
    expect(wouldStrandSuperAdmins(members, "a", "admin")).toBe(true); // demotion
    expect(wouldStrandSuperAdmins(members, "a", "support")).toBe(true);
  });

  it("allows demoting/removing a super admin when another active one remains", () => {
    const members = [M("a", "super_admin"), M("b", "super_admin")];
    expect(wouldStrandSuperAdmins(members, "a", "none")).toBe(false);
    expect(wouldStrandSuperAdmins(members, "a", "admin")).toBe(false);
  });

  it("keeping the target as super_admin is always allowed", () => {
    const members = [M("a", "super_admin")];
    expect(wouldStrandSuperAdmins(members, "a", "super_admin")).toBe(false);
  });

  it("changing a non-super-admin never strands anyone", () => {
    const members = [M("a", "super_admin"), M("b", "admin")];
    expect(wouldStrandSuperAdmins(members, "b", "none")).toBe(false);
    expect(wouldStrandSuperAdmins(members, "b", "support")).toBe(false);
  });

  it("an inactive super admin does not count as the safety net", () => {
    // a is the only ACTIVE super admin; b is a disabled super admin.
    const members = [M("a", "super_admin"), M("b", "super_admin", false)];
    expect(wouldStrandSuperAdmins(members, "a", "none")).toBe(true);
  });
});
