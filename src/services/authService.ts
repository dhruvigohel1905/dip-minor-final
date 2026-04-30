import { supabase } from "@/integrations/supabase/client";
import type { AuthUser, LoginCredentials, RegisterData } from "@/types/auth";
import type { User } from "@/types/database";

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

  // Fetch user profile with role information
  const userProfile = await getUserProfile(data.user.id);
  if (!userProfile) throw new Error("User profile not found");

  return userProfile;
}

/**
 * Register new user account
 */
export async function register(data: RegisterData): Promise<AuthUser> {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Registration failed: No user data returned");

  // Create user profile with role
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
    // Clean up auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  return {
    id: authData.user.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data.user) {
    return null;
  }

  return getUserProfile(data.user.id);
}

/**
 * Get user profile from users table
 */
export async function getUserProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, is_active, created_at")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data as AuthUser;
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
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as User;
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
export function hasRole(user: AuthUser | null, requiredRole: 'admin' | 'librarian'): boolean {
  return user?.role === requiredRole;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user is librarian
 */
export function isLibrarian(user: AuthUser | null): boolean {
  return hasRole(user, 'librarian');
}
