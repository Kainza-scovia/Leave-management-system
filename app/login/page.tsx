// app/login/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";
import { useAppContext } from "@/app/providers";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, isLoading, mockUsers } = useAppContext();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace("/");
    }
  }, [currentUser, isLoading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const identifier = email.trim().toLowerCase();
    
    // Check if using employee code (contains letters and numbers)
    const isEmployeeCode = /^[A-Za-z]{2,}\d+$/.test(identifier);
    
    try {
      let userCredential;
      
      if (isEmployeeCode) {
        // Try to find user by employee code in mock data
        const foundUser = mockUsers.find(
          (u) => u.employeeCode?.toLowerCase() === identifier
        );
        
        if (foundUser) {
          // If found in mock data, login with that user
          setCurrentUser(foundUser);
          router.replace("/");
          setLoading(false);
          return;
        } else {
          setError("Employee code not found. Please use your email.");
          setLoading(false);
          return;
        }
      } else {
        // Login with email and password
        userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      }

      const firebaseUser = userCredential.user;
      
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "employees", firebaseUser.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          name: data.name ?? firebaseUser.displayName ?? firebaseUser.email ?? "User",
          employeeCode: data.employeeCode ?? "",
          department: data.department ?? "",
          role: data.role ?? "employee",
          avatar: data.avatar ?? "",
          totalLeaveDays: data.totalLeaveDays ?? 20,
          usedLeaveDays: data.usedLeaveDays ?? 0,
          remainingLeaveDays: data.remainingLeaveDays ?? 20,
        };
        setCurrentUser(userData);
      } else {
        // If no Firestore doc, create basic user
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          name: firebaseUser.displayName ?? firebaseUser.email ?? "User",
          employeeCode: "",
          role: "employee",
          avatar: "",
          totalLeaveDays: 20,
          usedLeaveDays: 0,
          remainingLeaveDays: 20,
        };
        setCurrentUser(userData);
      }
      
      router.replace("/");
    } catch (err: any) {
      console.error("Login error:", err);
      
      // User-friendly error messages
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email. Please check or sign up.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later.");
          break;
        default:
          setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // For demo mode: allow quick access with mock users
  function handleDemoLogin() {
    // Use first mock user or create a demo user
    const demoUser = mockUsers[0] || {
      id: "demo-user-1",
      email: "demo@company.com",
      name: "Demo User",
      employeeCode: "EMP1000",
      role: "employee",
      department: "Engineering",
      avatar: "",
      totalLeaveDays: 20,
      usedLeaveDays: 5,
      remainingLeaveDays: 15,
    };
    setCurrentUser(demoUser);
    router.replace("/");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-6 sm:px-6 sm:py-10 md:-ml-64 md:px-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl lg:min-h-[560px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent font-bold text-accent-foreground">
                L
              </div>
              <div>
                <p className="font-semibold">Leave Manager</p>
                <p className="text-xs opacity-75">HR System</p>
              </div>
            </div>
            <p className="max-w-sm text-4xl font-bold leading-tight">
              A clearer way to manage time away.
            </p>
            <p className="mt-5 max-w-sm leading-6 opacity-80">
              Review balances, submit requests, and keep every team aligned from
              one simple workspace.
            </p>
          </div>
          <p className="text-sm opacity-70">Secure workspace access for your team.</p>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="mb-7">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
              Welcome back
            </p>
            <h1 className="text-3xl font-bold text-foreground">
              Sign in to your account
            </h1>
            <p className="mt-2 leading-6 text-muted-foreground">
              Use your email and password to access Leave Manager.
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="email">
              Work email or employee code
              <span className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com or EMP1000"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </span>
            </label>
            
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="password">
              Password
              <span className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  minLength={6}
                  required
                  disabled={loading}
                />
              </span>
            </label>
            
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Demo mode button - useful for testing */}
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoLogin}
              className="text-xs"
            >
              Quick Demo Access
            </Button>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Don't have an account? Contact your HR administrator to get access.
          </p>
        </div>
      </section>
    </main>
  );
}