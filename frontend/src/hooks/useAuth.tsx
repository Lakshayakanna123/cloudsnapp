import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  AuthError,
} from 'aws-amplify/auth';
import { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPasswordConfirm: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const cognito = await getCurrentUser();
      const session = await fetchAuthSession();
      const claims = session.tokens?.idToken?.payload ?? {};
      setUser({
        userId: cognito.userId,
        email: (claims['email'] as string) || '',
        username: cognito.username,
        name: (claims['name'] as string) || undefined,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    await signIn({ username: email, password });
    await loadUser();
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const register = async (email: string, password: string, name: string) => {
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: { email, name },
      },
    });
  };

  const confirmEmail = async (email: string, code: string) => {
    await confirmSignUp({ username: email, confirmationCode: code });
  };

  const resendCode = async (email: string) => {
    await resendSignUpCode({ username: email });
  };

  const forgotPassword = async (email: string) => {
    await resetPassword({ username: email });
  };

  const resetPasswordConfirm = async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        confirmEmail,
        resendCode,
        forgotPassword,
        resetPasswordConfirm,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Helper to extract readable error message from Amplify AuthError
export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof AuthError) {
    switch (err.name) {
      case 'UserNotFoundException':
        return 'No account found with this email address.';
      case 'NotAuthorizedException':
        return 'Incorrect email or password.';
      case 'UsernameExistsException':
        return 'An account with this email already exists.';
      case 'CodeMismatchException':
        return 'Invalid verification code. Please try again.';
      case 'ExpiredCodeException':
        return 'Verification code has expired. Please request a new one.';
      case 'InvalidPasswordException':
        return 'Password does not meet requirements.';
      case 'LimitExceededException':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return err.message || 'An authentication error occurred.';
    }
  }
  return 'An unexpected error occurred.';
}
