"use client";
import React from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button';
import Link from 'next/link';
import { Label } from '../ui/label';
import { Pencil, Loader2 } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { HTTP_BACKEND } from '@/lib/config';

const AuthPage = ({isSignin}:{isSignin: boolean}) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!isSignin && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            if (isSignin) {
                const res = await axios.post(`${HTTP_BACKEND}/user/signin`, {
                    email,
                    password,
                }, { withCredentials: true });

                if (res.data.success) {
                    // Store token in localStorage for WebSocket usage
                    if (res.data.token) {
                        localStorage.setItem('token', res.data.token);
                    }
                    router.push('/dashboard');
                }
            } else {
                const res = await axios.post(`${HTTP_BACKEND}/user/signup`, {
                    email,
                    password,
                    name,
                }, { withCredentials: true });

                if (res.data.success) {
                    if (res.data.token) {
                        localStorage.setItem('token', res.data.token);
                    }
                    router.push('/dashboard');
                }
            }
        } catch (err: any) {
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="min-h-screen bg-[#14181F] flex items-center justify-center px-4 text-fuchsia-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[#F06E42] flex items-center justify-center wiggle">
              <Pencil className="w-6 h-6 text-[#0e0806]" />
            </div>
            <span className="font-display text-3xl font-bold text-white">Sketchy</span>
          </Link>
          <h1 className="font-display text-4xl font-bold text-white mb-2">{isSignin ? "Welcome back!" : "Join Sketchy!"}</h1>
          <p className="text-muted-foreground font-body">Create your account and start drawing</p>
        </div>

        <div className="border border-amber-80 rounded-2xl w-[30vw] p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isSignin && (
              <div className="space-y-4">
                <Label htmlFor="name" className="font-body">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-[#262C36] p-2 text-[#B3AC98] font-body placeholder:text-[#B3AC98]"
                  required
                />
              </div>
            )}

            <div className="space-y-4">
              <Label htmlFor="email" className="font-body">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#262C36] p-2 text-[#B3AC98] font-body placeholder:text-[#B3AC98]"
                required
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="password" className="font-body">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#262C36] p-2 text-[#B3AC98] font-body placeholder:text-[#B3AC98]"
                required
              />
            </div>

          { !isSignin &&( <div className="space-y-4">
              <Label htmlFor="confirmPassword" className="font-body">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-[#262C36] p-2 text-[#B3AC98] font-body placeholder:text-[#B3AC98]"
                required
              />
            </div>)}

            <Button 
              type="submit" 
              variant="sketch" 
              className="w-full bg-[#F06E42] hover:bg-[#F06E42] hover:scale-102 text-black"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isSignin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isSignin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className=" font-body text-[#B3AC98]">
                {isSignin ? "Don't have an account? " : "Already have an account? "}
              <Link href={isSignin ? "/signup" : "/signin"} className="text-[#F06E42] hover:underline font-semibold">
                {isSignin ? "Sign up" : "Sign in"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage