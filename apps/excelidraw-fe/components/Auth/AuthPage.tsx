"use client";
import React from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button';
import Link from 'next/link';
import { Label } from '../ui/label';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

const AuthPage = ({isSignin}:{isSignin: boolean}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSignin) {
            console.log("Signin:", { email, password });
        } else {
            console.log("Signup:", { email, password, confirmPassword });
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
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button type="submit" variant="sketch" className="w-full bg-[#F06E42] hover:bg-[#F06E42] hover:scale-102 text-black ">
             {isSignin ? "Sign In" : "Create Account"}
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