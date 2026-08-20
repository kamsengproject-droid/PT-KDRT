import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Employee, UserPermissions, UserProfile, UserRole } from '../types';
import { getEmployeeByUserId } from '../services/employeeService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  employeeProfile: Employee | null;
  loading: boolean;
  role: UserRole;
  permissions: UserPermissions;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string, requestedRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_OWNER_PERMISSIONS: UserPermissions = {
  canReadPrivate: true,
  canWritePrivate: true,
  canReadSharing: true,
  canWriteSharing: true,
  canManageAccounts: true,
  canManageExpenses: true,
  canManageUsers: true,
  canViewReports: true,
  canExport: true,
  canManageHR: true,
  canManagePayroll: true,
};

const DEFAULT_MANAGER_PERMISSIONS: UserPermissions = {
  canReadPrivate: false,
  canWritePrivate: false,
  canReadSharing: true,
  canWriteSharing: true,
  canManageAccounts: true,
  canManageExpenses: true,
  canManageUsers: false,
  canViewReports: true,
  canExport: true,
  canManageHR: true,
  canManagePayroll: false,
};

const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
  canReadPrivate: false,
  canWritePrivate: false,
  canReadSharing: false,
  canWriteSharing: false,
  canManageAccounts: false,
  canManageExpenses: false,
  canManageUsers: false,
  canViewReports: false,
  canExport: false,
  canManageHR: false,
  canManagePayroll: false,
};

const DEFAULT_INVESTOR_PERMISSIONS: UserPermissions = {
  canReadPrivate: false,
  canWritePrivate: false,
  canReadSharing: true,
  canWriteSharing: false,
  canManageAccounts: false,
  canManageExpenses: false,
  canManageUsers: false,
  canViewReports: true,
  canExport: true,
  canManageHR: false,
  canManagePayroll: false,
};

// Helper: Verify client public IP against office whitelist on the server
async function verifyNetworkAccess(
  uid: string,
  role: UserRole
): Promise<{ allowed: boolean; message?: string }> {
  // OWNER and INVESTOR can login from anywhere
  if (role === 'OWNER' || role === 'INVESTOR') {
    return { allowed: true };
  }

  try {
    const res = await fetch('/api/auth/verify-network', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        allowed: false,
        message: data.message || 'Login karyawan hanya dapat dilakukan melalui jaringan kantor.',
      };
    }

    const data = await res.json();
    return {
      allowed: Boolean(data.allowed),
      message: data.message,
    };
  } catch (err) {
    console.warn('Network verification check failed to reach server:', err);
    return {
      allowed: false,
      message: 'Login karyawan hanya dapat dilakukan melalui jaringan kantor.',
    };
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile from Firestore
  const loadProfile = async (uid: string, userEmail?: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        if (data.role === 'EMPLOYEE') {
          const emp = await getEmployeeByUserId(uid);
          setEmployeeProfile(emp);
        } else {
          setEmployeeProfile(null);
        }
      } else {
        // Fallback or Initial setup for user
        const isInvestorUser = uid === 'MIOVfeWwRGcSIY22fVnvc1UkRoG3' || userEmail === 'ferrymerry@kdrt.com';
        const initialRole: UserRole = isInvestorUser ? 'INVESTOR' : 'OWNER';
        const initialPerms = isInvestorUser ? DEFAULT_INVESTOR_PERMISSIONS : DEFAULT_OWNER_PERMISSIONS;
        const initialName = isInvestorUser ? 'Investor Ferry Merry' : (userEmail?.split('@')[0] || 'Owner PT.KDRT');

        const newProfile: UserProfile = {
          uid,
          name: initialName,
          email: userEmail || (isInvestorUser ? 'ferrymerry@kdrt.com' : 'owner@kdrt.id'),
          role: initialRole,
          active: true,
          permissions: initialPerms,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        try {
          await setDoc(userRef, newProfile, { merge: true });
        } catch {
          // If Firestore rules restrict write, keep local state
        }
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Gagal load user profile:', err);
      setUserProfile({
        uid,
        name: userEmail?.split('@')[0] || 'Owner PT.KDRT',
        email: userEmail || 'owner@kdrt.id',
        role: 'OWNER',
        active: true,
        permissions: DEFAULT_OWNER_PERMISSIONS,
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      if (user) {
        // Check role and enforce network check on initial load/session restore
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          const currentRole: UserRole = snap.exists() ? (snap.data()?.role as UserRole) : 'EMPLOYEE';

          if (currentRole === 'EMPLOYEE' || currentRole === 'MANAGER') {
            const netCheck = await verifyNetworkAccess(user.uid, currentRole);
            if (!netCheck.allowed) {
              await signOut(auth);
              if (isMounted) {
                setCurrentUser(null);
                setUserProfile(null);
                setEmployeeProfile(null);
                setLoading(false);
              }
              return;
            }
          }
        } catch (err) {
          console.warn('Session network verification error:', err);
        }

        if (isMounted) {
          setCurrentUser(user);
          await loadProfile(user.uid, user.email || undefined);
        }
      } else {
        if (isMounted) {
          setCurrentUser(null);
          setUserProfile(null);
          setEmployeeProfile(null);
        }
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const uid = res.user.uid;

      // Fetch user profile from Firestore to determine role
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const profileData = snap.exists() ? (snap.data() as UserProfile) : null;
      const userRole: UserRole = profileData?.role || 'EMPLOYEE';

      // Perform server-side network evaluation
      if (userRole === 'EMPLOYEE' || userRole === 'MANAGER') {
        const netCheck = await verifyNetworkAccess(uid, userRole);
        if (!netCheck.allowed) {
          // Immediately sign out from Firebase Auth so no session remains
          await signOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
          setEmployeeProfile(null);

          const netError: any = new Error(
            netCheck.message || 'Login karyawan hanya dapat dilakukan melalui jaringan kantor.'
          );
          netError.code = 'OFFICE_NETWORK_DENIED';
          netError.isNetworkDenied = true;
          throw netError;
        }
      }

      await loadProfile(uid, email);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name?: string,
    requestedRole?: UserRole
  ) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const isInvestorUser =
        res.user.uid === 'MIOVfeWwRGcSIY22fVnvc1UkRoG3' || email.toLowerCase() === 'ferrymerry@kdrt.com';
      const roleToAssign: UserRole = requestedRole || (isInvestorUser ? 'INVESTOR' : 'OWNER');
      const permsToAssign =
        roleToAssign === 'INVESTOR'
          ? DEFAULT_INVESTOR_PERMISSIONS
          : roleToAssign === 'MANAGER'
          ? DEFAULT_MANAGER_PERMISSIONS
          : roleToAssign === 'EMPLOYEE'
          ? DEFAULT_EMPLOYEE_PERMISSIONS
          : DEFAULT_OWNER_PERMISSIONS;

      const userRef = doc(db, 'users', res.user.uid);
      const newProfile: UserProfile = {
        uid: res.user.uid,
        name: name || (isInvestorUser ? 'Investor Ferry Merry' : email.split('@')[0] || 'User'),
        email: email,
        role: roleToAssign,
        active: true,
        permissions: permsToAssign,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(userRef, newProfile, { merge: true });
      } catch (err) {
        console.warn('Set doc profile error:', err);
      }

      await loadProfile(res.user.uid, email);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch {
      // Ignored
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      setEmployeeProfile(null);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (userProfile?.uid) {
      await loadProfile(userProfile.uid, userProfile.email);
    }
  };

  const role: UserRole = userProfile?.role || 'OWNER';
  const permissions: UserPermissions = userProfile?.permissions || DEFAULT_OWNER_PERMISSIONS;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        employeeProfile,
        loading,
        role,
        permissions,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshProfile,
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
