import { supabase } from "@/integrations/supabase/client";
import type { AuthUser, LoginCredentials, RegisterData } from "@/types/auth";

/**
 * Build an AuthUser from a Supabase auth user object.
 * Falls back to user_metadata if the public.users table is unavailable.
 */
function buildUserFromMetadata(
  id: string,
  email: string,
  metadata: Record<string, unknown>
): AuthUser {
  return {
    id,
    email,
    full_name: (metadata?.full_name as string) ?? email.split("@")[0],
    role: (metadata?.role as "admin" | "librarian") ?? "librarian",
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

/**
 * Try to fetch user profile from public.users table.
 * Returns null (without throwing) if the table doesn't exist yet.
 */
export async function getUserProfile(userId: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, is_active, created_at")
      .eq("id", userId)
      .single();

    if (!error && data) return data as AuthUser;
  } catch {
    // table may not exist — fall through to metadata
  }

  // Fallback: read from auth user metadata
  const { data: authData } = await supabase.auth.getUser();
  if (authData?.user?.id === userId) {
    return buildUserFromMetadata(
      userId,
      authData.user.email ?? "",
      authData.user.user_metadata ?? {}
    );
  }
  return null;
}

/**
 * Login user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Login failed: No user data returned");

  let profile = await getUserProfile(data.user.id);
  
  if (!profile && data.user) {
    // Fallback if profile row is missing but auth succeeded
    profile = buildUserFromMetadata(
      data.user.id,
      data.user.email ?? "",
      data.user.user_metadata ?? {}
    );
  }

  if (!profile) throw new Error("Login failed: Could not retrieve user profile");
  return profile;
}

/**
 * Register new user account.
 * Stores full_name and role in user_metadata (always works).
 * Also tries to insert a row into public.users (best-effort).
 */
export async function register(data: RegisterData): Promise<AuthUser> {
  // 1. Create auth user — store role & name in metadata so we always have them
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
        role: data.role,
      },
    },
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Registration failed: No user data returned");

  // 2. Best-effort: insert profile row into public.users
  try {
    const { error: profileError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_active: true,
      },
    ]);
    if (profileError) {
      // Log but don't fail — metadata is the source of truth
      console.warn("Could not insert into public.users:", profileError.message);
    }
  } catch {
    // Table doesn't exist — that's OK, metadata has everything we need
    console.warn("public.users table not found, using auth metadata instead.");
  }

  return buildUserFromMetadata(authData.user.id, data.email, {
    full_name: data.full_name,
    role: data.role,
  });
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return getUserProfile(data.user.id);
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

/**
 * Get session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

/**
 * Refresh session
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw new Error(error.message);
  return data.session;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await getUserProfile(session.user.id);
      callback(profile);
    } else {
      callback(null);
    }
  });
  return data.subscription;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthUser | null, requiredRole: "admin" | "librarian"): boolean {
  return user?.role === requiredRole;
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, "admin");
}

export function isLibrarian(user: AuthUser | null): boolean {
  return hasRole(user, "librarian");
}
