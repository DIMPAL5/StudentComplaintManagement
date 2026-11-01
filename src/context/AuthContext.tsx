import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_PROFILES } from '../data/seedData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { DataService } from '../services/dataService';

export interface RegisterData {
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
  phone?: string;
  rollOrEmpId?: string;
  departmentId?: string;
  departmentName?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  demoAccounts: UserProfile[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (userId?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_STORAGE_KEY = 'sc360_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default to student for instant accessibility
    return INITIAL_PROFILES[0];
  });

  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your institutional email.' };
    }

    // 1. Check in persistent users list
    const allUsers = await DataService.getUsers();
    const matched = allUsers.find((p) => p.email.toLowerCase() === cleanEmail);

    if (matched) {
      // If user has a registered password, check it
      if (matched.password && password && matched.password !== password) {
        return { success: false, error: 'Incorrect password. Please verify and try again.' };
      }
      setCurrentUser(matched);
      await DataService.logAudit(matched, 'USER_LOGIN', 'auth', matched.id, `User logged in: ${matched.fullName} (${matched.email})`);
      return { success: true };
    }

    // 2. If Supabase is configured, verify with Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password || 'password123',
        });
        if (error || !data.user) {
          return { success: false, error: error?.message || 'Invalid credentials' };
        }

        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          fullName: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          role: data.user.user_metadata?.role || 'student',
          createdAt: data.user.created_at,
        };
        setCurrentUser(profile);
        await DataService.saveUser(profile);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Supabase authentication failed' };
      }
    }

    // 3. Fallback: If not found in demo mode, create ad-hoc student account
    const adhoc: UserProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      fullName: cleanEmail.split('@')[0].toUpperCase(),
      role: 'student',
      password: password || 'password123',
      rollOrEmpId: `2026-STU-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
    };
    await DataService.saveUser(adhoc);
    setCurrentUser(adhoc);
    await DataService.logAudit(adhoc, 'USER_LOGIN', 'auth', adhoc.id, `Ad-hoc user logged in: ${adhoc.fullName}`);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      DataService.logAudit(currentUser, 'USER_LOGOUT', 'auth', currentUser.id, `User logged out: ${currentUser.fullName}`);
    }
    setCurrentUser(null);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const allUsers = await DataService.getUsers();
    const targetUser = allUsers.find((p) => p.role === targetRole) || INITIAL_PROFILES.find((p) => p.role === targetRole) || INITIAL_PROFILES[0];
    setCurrentUser(targetUser);
    DataService.logAudit(targetUser, 'DEMO_ROLE_SWITCH', 'auth', targetUser.id, `Switched persona to ${targetRole} (${targetUser.fullName})`);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    await DataService.saveUser(updated);
    await DataService.logAudit(updated, 'PROFILE_UPDATE', 'user', updated.id, 'Updated personal profile details');
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!cleanEmail || !data.fullName.trim()) {
      return { success: false, error: 'Full name and email are required.' };
    }

    const allUsers = await DataService.getUsers();
    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      role: data.role || 'student',
      password: data.password || 'password123',
      phone: data.phone?.trim() || undefined,
      rollOrEmpId: data.rollOrEmpId?.trim() || `ID-${Math.floor(1000 + Math.random() * 9000)}`,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
      createdAt: new Date().toISOString(),
    };

    // Save to persistence
    await DataService.saveUser(newUser);
    setCurrentUser(newUser);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password || 'password123',
          options: {
            data: {
              full_name: newUser.fullName,
              role: newUser.role,
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
      `New user registered: ${newUser.fullName} (${newUser.email}) as [${newUser.role}]`
    );

    return { success: true };
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
        role: currentUser?.role || 'student',
        isAuthenticated: Boolean(currentUser),
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
