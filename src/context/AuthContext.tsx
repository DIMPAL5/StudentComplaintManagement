import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AccountStatus } from '../types';
import { INITIAL_PROFILES } from '../data/seedData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { DataService } from '../services/dataService';

export interface RegisterData {
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  rollOrEmpId?: string;
  departmentId?: string;
  departmentName?: string;
  termsAccepted?: boolean;
}

export const normalizeRole = (role?: string): UserRole => {
  if (!role) return 'student';
  if (role === 'faculty') return 'professor';
  if (role === 'department_head') return 'hod';
  return role as UserRole;
};

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  isDemoMode: boolean;
  demoAccounts: UserProfile[];
  login: (
    email: string,
    password: string,
    selectedRole: UserRole
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; error?: string; message?: string; accountStatus?: AccountStatus }>;
  deleteAccount: (userId?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_STORAGE_KEY = 'sc360_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const isDemoMode = !isSupabaseConfigured;

  // On mount: check localStorage for saved session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          // Verify user still exists and role is normalized
          parsed.role = normalizeRole(parsed.role);
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to restore active session:', e);
    } finally {
      // Small artificial delay to show slick transition / prevent flashes
      const timer = setTimeout(() => {
        setIsAuthChecking(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync active user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  /**
   * AUTHENTICATION LOGIC (6-STEP WORKFLOW)
   * STEP 1: Verify the email and password.
   * STEP 2: Retrieve the authenticated user's actual role from trusted database profile.
   * STEP 3: Verify that the account is active and approved for that role.
   * STEP 4: Compare the selected login role with the registered role.
   * STEP 5: If they match, grant access.
   * STEP 6: If they do not match, display clear role mismatch error.
   */
  const login = async (
    email: string,
    password: string,
    selectedRole: UserRole
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your institutional email address.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Please enter your password.' };
    }
    if (!selectedRole) {
      return { success: false, error: 'Please select your role from the dropdown.' };
    }

    // 1. Fetch user from persistent store
    const allUsers = await DataService.getUsers();
    let matched = allUsers.find((p) => p.email.toLowerCase() === cleanEmail);

    // If Supabase Auth is enabled, attempt Supabase authentication
    if (!matched && isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error || !data.user) {
          return { success: false, error: error?.message || 'Invalid institutional credentials.' };
        }

        // Fetch profile from profiles table
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (dbProfile) {
          matched = {
            id: dbProfile.id,
            email: dbProfile.email,
            fullName: dbProfile.full_name,
            role: normalizeRole(dbProfile.role),
            accountStatus: dbProfile.account_status || 'approved',
            departmentId: dbProfile.department_id,
            rollOrEmpId: dbProfile.roll_or_emp_id,
            phone: dbProfile.phone,
            avatarUrl: dbProfile.avatar_url,
            createdAt: dbProfile.created_at,
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Supabase authentication failed.' };
      }
    }

    // STEP 1: Verify user exists
    if (!matched) {
      return {
        success: false,
        error: 'No account found with this institutional email. Please create an account or verify your email.',
      };
    }

    // STEP 1b: Verify Password
    if (matched.password && matched.password !== cleanPassword) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    // STEP 2: Retrieve actual registered role
    const actualRole = normalizeRole(matched.role);
    const targetRole = normalizeRole(selectedRole);

    // STEP 3: Verify account status (pending, approved, suspended)
    const status: AccountStatus = matched.accountStatus || 'approved';
    if (status === 'pending') {
      return {
        success: false,
        error:
          'Your account is pending administrator approval. Please contact campus administration to activate your account.',
      };
    }
    if (status === 'suspended') {
      return {
        success: false,
        error: 'Your account has been suspended. Please contact the campus system administrator.',
      };
    }

    // STEP 4: Compare selected login role with registered role
    if (actualRole !== targetRole) {
      return {
        success: false,
        error: `The selected role does not match your registered account role (${actualRole.toUpperCase()}). Please select the correct role.`,
      };
    }

    // STEP 5: Success! Update current user state and log audit
    const authenticatedUser: UserProfile = {
      ...matched,
      role: actualRole,
      accountStatus: status,
    };

    setCurrentUser(authenticatedUser);
    await DataService.logAudit(
      authenticatedUser,
      'USER_LOGIN',
      'auth',
      authenticatedUser.id,
      `User signed in successfully as [${actualRole}] (${authenticatedUser.fullName})`
    );

    return { success: true, user: authenticatedUser };
  };

  const logout = () => {
    if (currentUser) {
      DataService.logAudit(
        currentUser,
        'USER_LOGOUT',
        'auth',
        currentUser.id,
        `User logged out: ${currentUser.fullName}`
      );
    }
    setCurrentUser(null);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const norm = normalizeRole(targetRole);
    const allUsers = await DataService.getUsers();
    const targetUser =
      allUsers.find((p) => normalizeRole(p.role) === norm && p.accountStatus === 'approved') ||
      INITIAL_PROFILES.find((p) => normalizeRole(p.role) === norm) ||
      INITIAL_PROFILES[0];

    setCurrentUser(targetUser);
    DataService.logAudit(
      targetUser,
      'DEMO_ROLE_SWITCH',
      'auth',
      targetUser.id,
      `Switched demo persona to ${norm} (${targetUser.fullName})`
    );
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, ...data, updatedAt: new Date().toISOString() };
    setCurrentUser(updated);
    await DataService.saveUser(updated);
    await DataService.logAudit(updated, 'PROFILE_UPDATE', 'user', updated.id, 'Updated personal profile details');
  };

  /**
   * REGISTRATION LOGIC WITH STRICT ROLE RULES
   * - Student: auto-approved ('approved')
   * - Professor: pending approval ('pending')
   * - Staff: pending approval ('pending')
   * - HOD: pending approval ('pending')
   */
  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; error?: string; message?: string; accountStatus?: AccountStatus }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const fullName = data.fullName.trim();
    const password = (data.password || '').trim();
    const confirmPassword = (data.confirmPassword || '').trim();
    const selectedRole = normalizeRole(data.role);

    // Validation
    if (!fullName) {
      return { success: false, error: 'Full Name is required.' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'Institutional Email Address is required.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid institutional email address.' };
    }
    if (!password) {
      return { success: false, error: 'Password is required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Password and Confirm Password do not match.' };
    }
    if (!data.rollOrEmpId?.trim()) {
      return {
        success: false,
        error: selectedRole === 'student' ? 'Student ID / Roll Number is required.' : 'Employee ID is required.',
      };
    }
    if (!data.termsAccepted) {
      return { success: false, error: 'You must accept the Campus Code of Conduct and Terms.' };
    }

    // Check duplicate account
    const allUsers = await DataService.getUsers();
    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    // Assign account status according to role registration rules
    let accountStatus: AccountStatus = 'approved';
    let message = 'Account registered successfully! You can now sign in.';

    if (selectedRole === 'student') {
      accountStatus = 'approved';
      message = 'Student account created successfully! You can now sign in to your Student Dashboard.';
    } else if (selectedRole === 'professor') {
      accountStatus = 'pending';
      message =
        'Professor account registration submitted. Your account is pending administrator verification before privileged access is granted.';
    } else if (selectedRole === 'staff') {
      accountStatus = 'pending';
      message =
        'Staff account registration submitted. Your account is pending administrator approval before access is granted.';
    } else if (selectedRole === 'hod') {
      accountStatus = 'pending';
      message =
        'Head of Department account registered. HOD accounts require verified administrative authorization before activation.';
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      fullName,
      role: selectedRole,
      accountStatus,
      password,
      rollOrEmpId: data.rollOrEmpId.trim(),
      phone: data.phone?.trim() || undefined,
      departmentId: data.departmentId || 'dept-1',
      departmentName: data.departmentName || 'Computer Science & Engineering',
      createdAt: new Date().toISOString(),
    };

    // Save to persistence
    await DataService.saveUser(newUser);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: newUser.fullName,
              role: newUser.role,
              account_status: newUser.accountStatus,
            },
          },
        });
      } catch (err) {
        console.warn('Supabase signup notice:', err);
      }
    }

    await DataService.logAudit(
      newUser,
      'USER_REGISTER',
      'auth',
      newUser.id,
      `New user registered: ${newUser.fullName} (${newUser.email}) as [${newUser.role}] - Status: ${accountStatus}`
    );

    return {
      success: true,
      message,
      accountStatus,
    };
  };

  const deleteAccount = async (userId?: string): Promise<{ success: boolean; error?: string }> => {
    const idToDelete = userId || currentUser?.id;
    if (!idToDelete || !currentUser) {
      return { success: false, error: 'No active user session to delete.' };
    }

    try {
      await DataService.deleteUser(idToDelete, currentUser);
      logout();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete account' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: normalizeRole(currentUser?.role),
        isAuthenticated: Boolean(currentUser),
        isAuthChecking,
        isDemoMode,
        demoAccounts: INITIAL_PROFILES,
        login,
        logout,
        switchDemoRole,
        updateProfile,
        register,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
