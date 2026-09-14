import type { AuthUser } from "@/lib/auth/auth";

export type Permission =
  | "scans.read"
  | "scans.create"
  | "scans.update"
  | "scans.delete"
  | "reports.read"
  | "reports.generate"
  | "reports.export"
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "violations.read"
  | "violations.respond"
  | "analytics.read"
  | "analytics.export"
  | "settings.update";

export type Role = "admin" | "enforcement" | "inspector" | "viewer";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "scans.read",
    "scans.create",
    "scans.update",
    "scans.delete",
    "reports.read",
    "reports.generate",
    "reports.export",
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "violations.read",
    "violations.respond",
    "analytics.read",
    "analytics.export",
    "settings.update",
  ],
  enforcement: [
    "scans.read",
    "scans.create",
    "scans.update",
    "reports.read",
    "reports.generate",
    "reports.export",
    "users.read",
    "users.create",
    "violations.read",
    "violations.respond",
    "analytics.read",
  ],
  inspector: [
    "scans.read",
    "scans.create",
    "scans.update",
    "reports.read",
    "reports.generate",
    "violations.read",
    "violations.respond",
  ],
  viewer: [
    "scans.read",
    "reports.read",
    "analytics.read",
  ],
};

export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false;

  // Admin has all permissions
  if (user.role === "admin") return true;

  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some(p => hasPermission(user, p));
}

export function hasAllPermissions(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.every(p => hasPermission(user, p));
}

export function canAccessRoute(user: AuthUser | null, route: string): boolean {
  if (!user) return false;

  // Define route permissions
  const routePermissions: Record<string, Permission[]> = {
    "/scan": ["scans.create"],
    "/reports": ["reports.read"],
    "/analytics": ["analytics.read"],
    "/users": ["users.read"],
    "/settings": ["settings.update"],
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) return true; // Public route

  return hasAnyPermission(user, requiredPermissions);
}