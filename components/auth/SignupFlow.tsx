"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CanvasRevealEffect } from "@/components/sign-in-flow-1";
import { signInWithMagicLink, verifyOtp } from "@/lib/supabase/auth";
import { toast } from "sonner";

interface SignupFlowProps {
  className?: string;
}

export const SignupFlow = ({ className }: SignupFlowProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [step, setStep] = useState<"details" | "code" | "success">("details");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setIsLoading(true);
      try {
        await signInWithMagicLink(formData.email);
        toast.success("Check your email for the verification code!");
        setStep("code");
      } catch (error: any) {
        toast.error(error.message || "Failed to send verification email");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Focus first input when code screen appears
  useEffect(() => {
    if (step === "code") {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 500);
    }
  }, [step]);

  const handleCodeChange = async (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Focus next input if value is entered
      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }

      // Check if code is complete
      if (index === 5 && value) {
        const isComplete = newCode.every(digit => digit.length === 1);
        if (isComplete) {
          const token = newCode.join('');
          setIsLoading(true);

          try {
            await verifyOtp(formData.email, token);

            // First show the new reverse canvas
            setReverseCanvasVisible(true);

            // Then hide the original canvas after a small delay
            setTimeout(() => {
              setInitialCanvasVisible(false);
            }, 50);

            // Transition to success screen after animation
            setTimeout(() => {
              setStep("success");
            }, 2000);
          } catch (error: any) {
            toast.error(error.message || "Invalid code. Please try again.");
            setCode(["", "", "", "", "", ""]);
            codeInputRefs.current[0]?.focus();
          } finally {
            setIsLoading(false);
          }
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleBackClick = () => {
    setStep("details");
    setCode(["", "", "", "", "", ""]);
    // Reset animations if going back
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  const handleContinueToDashboard = () => {
    router.push('/dashboard');
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await signInWithMagicLink(formData.email);
      toast.success("New code sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex w-[100%] flex-col min-h-screen bg-black relative", className)}>
      <div className="absolute inset-0 z-0">
        {/* Initial canvas (forward animation) */}
        {initialCanvasVisible && (
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
        )}

        {/* Reverse canvas (appears when code is complete) */}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[
                [234, 179, 8],
                [234, 179, 8],
              ]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}

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
              <AnimatePresence mode="wait">
                {step === "details" ? (
                  <motion.div
                    key="details-step"
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Create Account</h1>
                      <p className="text-[1.8rem] text-white/70 font-light">Spot Hyperliquid opportunities in real-time</p>
                    </div>

                    <div className="space-y-4">
                      <button className="backdrop-blur-[2px] w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-zinc-800 rounded-full py-3 px-4 transition-colors">
                        <span className="text-lg">G</span>
                        <span>Sign up with Google</span>
                      </button>

                      <div className="flex items-center gap-4">
                        <div className="h-px bg-zinc-800 flex-1" />
                        <span className="text-zinc-500 text-sm">or</span>
                        <div className="h-px bg-zinc-800 flex-1" />
                      </div>

                      <form onSubmit={handleDetailsSubmit} className="space-y-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full backdrop-blur-[1px] bg-zinc-900/40 text-white border border-zinc-800 rounded-full py-3 px-4 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 text-center"
                          required
                        />
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full backdrop-blur-[1px] bg-zinc-900/40 text-white border border-zinc-800 rounded-full py-3 px-4 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 text-center"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full backdrop-blur-[1px] bg-zinc-900/40 text-white border border-zinc-800 rounded-full py-3 px-4 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 text-center"
                          required
                          minLength={8}
                        />
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-full py-3 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Sending..." : "Create Account"}
                        </button>
                      </form>

                      <div className="text-sm pt-2">
                        <span className="text-zinc-500">Already have an account? </span>
                        <Link href="/login" className="text-yellow-500 hover:text-yellow-400 transition-colors">
                          Sign in
                        </Link>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 pt-10">
                      By creating an account, you agree to our{" "}
                      <Link href="#" className="underline text-zinc-500 hover:text-zinc-400 transition-colors">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="#" className="underline text-zinc-500 hover:text-zinc-400 transition-colors">Privacy Policy</Link>
                    </p>
                  </motion.div>
                ) : step === "code" ? (
                  <motion.div
                    key="code-step"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Verify your email</h1>
                      <p className="text-[1.25rem] text-white/50 font-light">We sent a code to {formData.email}</p>
                    </div>

                    <div className="w-full">
                      <div className="relative rounded-full py-4 px-5 border border-zinc-800 bg-zinc-900/40">
                        <div className="flex items-center justify-center">
                          {code.map((digit, i) => (
                            <div key={i} className="flex items-center">
                              <div className="relative">
                                <input
                                  ref={(el) => {
                                    codeInputRefs.current[i] = el;
                                  }}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={1}
                                  value={digit}
                                  onChange={e => handleCodeChange(i, e.target.value)}
                                  onKeyDown={e => handleKeyDown(i, e)}
                                  className="w-8 text-center text-xl bg-transparent text-white border-none focus:outline-none focus:ring-0 appearance-none"
                                  style={{ caretColor: 'transparent' }}
                                />
                                {!digit && (
                                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                                    <span className="text-xl text-zinc-700">0</span>
                                  </div>
                                )}
                              </div>
                              {i < 5 && <span className="text-zinc-800 text-xl">|</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <motion.p
                        onClick={handleResendCode}
                        className="text-zinc-500 hover:text-yellow-500 transition-colors cursor-pointer text-sm"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isLoading ? "Sending..." : "Resend code"}
                      </motion.p>
                    </div>

                    <div className="flex w-full gap-3">
                      <motion.button
                        onClick={handleBackClick}
                        className="rounded-full bg-zinc-800 text-white font-medium px-8 py-3 hover:bg-zinc-700 transition-colors w-[30%]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        Back
                      </motion.button>
                      <motion.button
                        className={`flex-1 rounded-full font-medium py-3 border transition-all duration-300 ${
                          code.every(d => d !== "")
                          ? "bg-yellow-500 text-black border-transparent hover:bg-yellow-600 cursor-pointer"
                          : "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
                        }`}
                        disabled={!code.every(d => d !== "")}
                      >
                        Verify Email
                      </motion.button>
                    </div>

                    <div className="pt-16">
                      <p className="text-xs text-zinc-600">
                        By creating an account, you agree to our{" "}
                        <Link href="#" className="underline text-zinc-500 hover:text-zinc-400 transition-colors">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="#" className="underline text-zinc-500 hover:text-zinc-400 transition-colors">Privacy Policy</Link>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-step"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Welcome aboard!</h1>
                      <p className="text-[1.25rem] text-white/50 font-light">Your account is ready</p>
                    </div>

                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="py-10"
                    >
                      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </motion.div>

                    <motion.button
                      onClick={handleContinueToDashboard}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="w-full rounded-full bg-yellow-500 text-black font-medium py-3 hover:bg-yellow-600 transition-colors"
                    >
                      Continue to Dashboard
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
