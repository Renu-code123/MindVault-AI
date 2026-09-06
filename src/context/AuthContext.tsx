import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "../firebase.ts";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          // Initialize or update user profile document strictly in user's isolated path
          try {
            const userRef = doc(db, "users", currentUser.uid);
            await setDoc(
              userRef,
              {
                uid: currentUser.uid,
                displayName: currentUser.displayName || "Explorer",
                email: currentUser.email || "",
                photoURL: currentUser.photoURL || "",
                lastLogin: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (err) {
            // Note: If rules block or network fails, log safely
            console.warn("User profile sync notice:", err instanceof Error ? err.message : err);
          }
        }
      },
      (authErr) => {
        setError(authErr.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      let msg = firebaseError.message || "Failed to sign in with Google.";
      if (firebaseError.code === "auth/popup-blocked") {
        msg = "The sign-in popup was blocked by your browser. If viewing inside an iframe, please allow popups or open this app in a new browser tab.";
      } else if (firebaseError.code === "auth/popup-closed-by-user") {
        msg = "Sign-in cancelled before completion.";
      }
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign out.";
      setError(msg);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
