import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import ResetPassword from "./ResetPassword";
import toast from "react-hot-toast";
import axios from "axios";

export default function OTPVerification({
  open,
  onClose,
  onBackToLogin,
  email,
  onBackToChangeEmail,
}) {
  const { theme } = useSelector((store) => store.theme);
  const [OTP, setOTP] = useState(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return "your email";
    const [local, domain] = email.split("@");
    const visiblePart = local.slice(0, 2);
    const hidden = "*".repeat(Math.max(local.length - 2, 3));
    return `${visiblePart}${hidden}@${domain}`;
  };

  useEffect(() => {
    if (open) setCooldown(60);
  }, [open]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newOTP = [...OTP];
      newOTP[index] = value;
      setOTP(newOTP);
      if (value && index < 5) inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !OTP[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  const resetOTPFields = () => {
    setOTP(["", "", "", "", "", ""]);
    inputRefs.current.forEach((input) => {
      if (input) input.value = "";
    });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = OTP.join("");
    if (otp.length !== 6) return toast.error("Enter all 6 digits");

    try {
      setLoading(true);
      const apiURL = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiURL}/user/verify-otp/${email}`, { otp });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsVerified(true);
        resetOTPFields();
        setTimeout(() => {
          setIsResetOpen(true);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.log(error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const apiURL = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiURL}/user/forgot-password`, { email });
      if (res.data.success) {
        toast.success(res.data.message);
        resetOTPFields();
        setCooldown(60);
      }
    } catch (error) {
      console.log(error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={`sm:max-w-md rounded-2xl backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-xl p-0 overflow-hidden transition-colors duration-300 ${theme === "dark" ? "dark" : ""
            }`}
        >
          <Card className="border-none shadow-md rounded-xl bg-white dark:bg-gray-800 transition-colors duration-300">
            <CardContent className="flex flex-col justify-between p-6">
              {/* Header */}
              <DialogHeader className="text-center mb-4">
                <DialogTitle className="text-2xl font-semibold text-center text-purple-600 dark:text-gray-100 transition-colors duration-300">
                  Verify <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">OTP</span>
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-100 text-center text-sm transition-colors duration-300">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-purple-600 dark:text-gray-100 transition-colors duration-300">
                    {maskEmail(email)}
                  </span>
                  .
                </DialogDescription>
              </DialogHeader>

              {/* OTP Form */}
              {!isVerified ? (
                <>
                  <form onSubmit={handleVerify} className="space-y-6 mt-6">
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {OTP.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-10 h-12 text-center text-lg font-semibold border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 transition-colors duration-300"
                        />
                      ))}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300 font-semibold transition-colors duration-300"
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </form>

                  {/* Separate Section: Resend + Change Email */}
                  <div className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400 space-y-2 transition-colors duration-300">
                    {cooldown > 0 ? (
                      <p className="text-gray-500 dark:text-gray-100">
                        Resend available in{" "}
                        <span className="font-semibold text-purple-600 dark:text-gray-100">
                          {cooldown}s
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-purple-600 dark:text-gray-100 font-medium cursor-pointer hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}

                    <p className="dark:text-gray-100">
                      Wrong email?{" "}
                      <span
                        onClick={() => {
                          resetOTPFields();
                          onClose();
                          setTimeout(() => onBackToChangeEmail(), 300);
                        }}
                        className="text-purple-600 dark:text-gray-100 font-medium cursor-pointer hover:underline"
                      >
                        Change Email
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center mt-10 space-y-3">
                  <ShieldCheck className="h-10 w-10 text-purple-600 dark:text-blue-400" />
                  <p className="text-gray-600 dark:text-gray-100 text-center">
                    OTP verified successfully! You can now reset your password.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-100">
                  Want to go back?{" "}
                  <span
                    onClick={() => {
                      resetOTPFields();
                      onClose();
                      setTimeout(() => onBackToLogin(), 300);
                    }}
                    className="text-purple-600 dark:text-gray-100 font-medium cursor-pointer hover:underline"
                  >
                    Back to Login
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Reset Password Popup */}
      <ResetPassword
        open={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onBackToLogin={onBackToLogin}
        email={email}
      />
    </>
  );
}
