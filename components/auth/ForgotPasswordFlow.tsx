"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CanvasRevealEffect } from "@/components/sign-in-flow-1";
import { ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "@/lib/supabase/auth";
import { toast } from "sonner";

interface ForgotPasswordFlowProps {
  className?: string;
}

export const ForgotPasswordFlow = ({ className }: ForgotPasswordFlowProps) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(email);
        setSubmitted(true);
        toast.success("Password reset email sent!");
      } catch (error: any) {
        toast.error(error.message || "Failed to send reset email");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={cn("flex w-[100%] flex-col min-h-screen bg-black relative", className)}>
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-black"
            colors={[
              [234, 179, 8], // yellow-500
              [234, 179, 8],
            ]}
            dotSize={6}
            reverse={false}
          />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top navigation */}
        <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center px-6 py-3 backdrop-blur-sm rounded-full border border-zinc-800 bg-zinc-900/40">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl tracking-tight">
              <span className="font-bold text-white">fund</span>
              <span className="font-bold text-yellow-500">tracker</span>
              <span className="font-light text-white">.pro</span>
            </h1>
          </Link>
        </header>

        {/* Main content container */}
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Left side (form) */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full mt-[150px] max-w-sm">
              {!submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 text-center"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-500 transition-colors mb-4"
                  >
                    <ArrowLeft size={16} />
                    <span className="text-sm">Back to login</span>
                  </Link>

                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Forgot Password?</h1>
                    <p className="text-[1.25rem] text-white/70 font-light">No worries, we'll send you reset instructions</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full backdrop-blur-[1px] bg-zinc-900/40 text-white border border-zinc-800 rounded-full py-3 px-4 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 text-center"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-full py-3 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>

                  <div className="text-sm pt-2">
                    <span className="text-zinc-500">Remember your password? </span>
                    <Link href="/login" className="text-yellow-500 hover:text-yellow-400 transition-colors">
                      Sign in
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Check your email</h1>
                    <p className="text-[1.25rem] text-white/70 font-light">
                      We sent password reset instructions to
                    </p>
                    <p className="text-yellow-500 font-medium">{email}</p>
                  </div>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="py-10"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-black"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </motion.div>

                  <div className="space-y-3">
                    <p className="text-zinc-500 text-sm">
                      Didn't receive the email?{" "}
                      <button
                        onClick={() => setSubmitted(false)}
                        className="text-yellow-500 hover:text-yellow-400 transition-colors"
                      >
                        Click to resend
                      </button>
                    </p>

                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-500 transition-colors"
                    >
                      <ArrowLeft size={16} />
                      <span className="text-sm">Back to login</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
