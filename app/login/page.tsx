'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/app/providers';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, mockUsers, setCurrentUser, isLoading } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/');
    }
  }, [currentUser, isLoading, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifier = email.trim().toLowerCase();
    const user = mockUsers.find(
      (candidate) => candidate.email.toLowerCase() === identifier || candidate.employeeCode.toLowerCase() === identifier
    );

    if (!user || password.length < 4) {
      setError('Enter a valid work email and password to continue.');
      return;
    }

    setError('');
    setCurrentUser(user);
    router.replace('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent font-bold text-accent-foreground">L</div>
              <div>
                <p className="font-semibold">Leave Manager</p>
                <p className="text-xs opacity-75">HR System</p>
              </div>
            </div>
            <p className="max-w-sm text-4xl font-bold leading-tight">A clearer way to manage time away.</p>
            <p className="mt-5 max-w-sm leading-6 opacity-80">Review balances, submit requests, and keep every team aligned from one simple workspace.</p>
          </div>
          <p className="text-sm opacity-70">Secure workspace access for your team.</p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Welcome back</p>
            <h1 className="text-3xl font-bold text-foreground">Sign in to your account</h1>
            <p className="mt-2 leading-6 text-muted-foreground">Use your work email to continue to Leave Manager.</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="email">
              Work email or employee code
              <span className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="email" type="text" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@techcorp.co.mz or EMP1000" className="pl-10" required />
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="password">
              Password
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="pl-10" minLength={4} required />
              </span>
            </label>
            {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
            <Button type="submit" className="mt-2 w-full">Sign in <ArrowRight data-icon="inline-end" /></Button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Demo access accepts any password with 4 or more characters for a registered work email.</p>
        </div>
      </section>
    </main>
  );
}
