"use client";
import { getAuth, signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider, type User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/config";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "admin" | "enforcement" | "inspector" | "viewer";
  department?: string;
  inspectorId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  requiresVerification?: boolean;
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const auth = getAuth();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    if (!firebaseUser) {
      return { success: false, error: "Authentication failed" };
    }

    // Check if user exists in Firestore
    const db = getFirebaseClient();
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    let userData: AuthUser;

    if (!userDoc.exists()) {
      // Create new user with default role
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: "viewer", // Default role
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userData);
    } else {
      // Update existing user
      const existingData = userDoc.data() as AuthUser;
      userData = {
        ...existingData,
        lastLogin: new Date().toISOString(),
      };

      await updateDoc(doc(db, "users", firebaseUser.uid), {
        lastLogin: userData.lastLogin,
      });
    }

    return { success: true, user: userData };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const auth = getAuth();
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Sign-out error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign out failed",
    };
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    const db = getFirebaseClient();
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as AuthUser;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const db = getFirebaseClient();
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data() as AuthUser;

    // Admin has all permissions
    if (userData.role === "admin") {
      return true;
    }

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ["*"], // Wildcard for all permissions
      enforcement: [
        "scans.read",
        "scans.create",
        "scans.update",
        "reports.read",
        "reports.generate",
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

    const permissions = rolePermissions[userData.role] || [];

    // Check for wildcard permission
    if (permissions.includes("*")) {
      return true;
    }

    return permissions.includes(permission);
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

export async function updateUserRole(userId: string, newRole: AuthUser["role"], updatedBy: string): Promise<boolean> {
  try {
    const db = getFirebaseClient();
    await updateDoc(doc(db, "users", userId), {
      role: newRole,
      updatedBy,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Update user role error:", error);
    return false;
  }
}

export async function createInspectorProfile(inspectorData: {
  name: string;
  email: string;
  department: string;
  inspectorId: string;
  role?: "enforcement" | "inspector";
}): Promise<AuthResult> {
  try {
    const db = getFirebaseClient();

    // Create user in Firebase Auth
    const auth = getAuth();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;

    // Check if user already exists
    const existingUserDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (existingUserDoc.exists()) {
      return { success: false, error: "User already exists" };
    }

    // Create inspector user
    const userData: AuthUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: inspectorData.name,
      photoURL: null,
      role: inspectorData.role || "inspector",
      department: inspectorData.department,
      inspectorId: inspectorData.inspectorId,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", firebaseUser.uid), userData);

    return { success: true, user: userData };
  } catch (error) {
    console.error("Create inspector profile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create inspector profile",
    };
  }
}

export async function getAllUsers(): Promise<AuthUser[]> {
  try {
    const db = getFirebaseClient();
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map((doc) => doc.data() as AuthUser);
  } catch (error) {
    console.error("Get all users error:", error);
    return [];
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const db = getFirebaseClient();
    await deleteDoc(doc(db, "users", userId));
    return true;
  } catch (error) {
    console.error("Delete user error:", error);
    return false;
  }
}

export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const db = getFirebaseClient();
    const activityData = {
      userId,
      action,
      resource,
      metadata,
      timestamp: new Date().toISOString(),
    };

    await setDoc(doc(db, "activity_logs", `${userId}_${Date.now()}`), activityData);
    return true;
  } catch (error) {
    console.error("Log activity error:", error);
    return false;
  }
}

export async function getUserActivity(userId: string, limit: number = 10): Promise<any[]> {
  try {
    const db = getFirebaseClient();
    const snapshot = await getDocs(
      query(
        collection(db, "activity_logs"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limit)
      )
    );
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Get user activity error:", error);
    return [];
  }
}

// Firebase imports need to be conditional to avoid SSR issues
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        const authUser = await getCurrentUser();
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};