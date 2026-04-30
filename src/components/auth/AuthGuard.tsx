import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/types/auth';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'librarian' | ('admin' | 'librarian')[];
}

/**
 * ProtectedRoute - Requires authentication
 */
export const ProtectedRoute = ({ children, requiredRole }: AuthGuardProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

/**
 * AdminRoute - Requires admin role
 */
export const AdminRoute = ({ children }: { children: ReactNode }) => {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
};

/**
 * LibrarianRoute - Requires librarian or admin role
 */
export const LibrarianRoute = ({ children }: { children: ReactNode }) => {
  return (
    <ProtectedRoute requiredRole={['librarian', 'admin']}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Check if user can access a resource based on role
 */
export function canAccess(user: AuthUser | null, requiredRole: 'admin' | 'librarian' | ('admin' | 'librarian')[]): boolean {
  if (!user) return false;
  
  if (typeof requiredRole === 'string') {
    return user.role === requiredRole;
  }
  
  return requiredRole.includes(user.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user is librarian
 */
export function isLibrarian(user: AuthUser | null): boolean {
  return user?.role === 'librarian' || user?.role === 'admin';
}
