import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import OtpVerification from "./OtpVerification";
import toast from "react-hot-toast";
import axios from "axios";

export default function ForgotPassword({ open, onClose, onBackToLogin }) {
  const { theme } = useSelector((store) => store.theme);
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(open);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsForgotOpen(open);
  }, [open]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!email) return toast.error("Please enter your registered email");

    const apiURL = import.meta.env.VITE_API_URL;
    const toastId = toast.loading("Sending OTP...");

    try {
      setLoading(true);
      const res = await axios.post(`${apiURL}/user/forgot-password`, { email });

      if (res.data.success) {
        toast.success(res.data.message);
        toast.dismiss(toastId);

        // navigation to OTP Verification Page
        setTimeout(() => {
          setIsSent(true);
          setTimeout(() => {
            setIsSent(false);
            setIsForgotOpen(false);
            setTimeout(() => setIsOtpOpen(true), 300);
          }, 1000);
        });
      }
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error(
        error.response?.data?.message || "Failed to send OTP. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent
          className={`sm:max-w-md rounded-2xl backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-xl p-0 overflow-hidden transition-colors duration-300 ${
            theme === "dark" ? "dark" : ""
          }`}
        >
          <Card className="border-none shadow-md rounded-xl bg-white dark:bg-gray-800 transition-colors duration-300">
            <CardContent className="flex flex-col justify-between p-6">
              {/* Header */}
              <DialogHeader className="text-center mb-4">
                <DialogTitle className="text-2xl font-semibold text-center text-purple-600 dark:text-gray-100 transition-colors duration-300">
                  Forgot <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Password</span>
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-300 text-center text-sm transition-colors duration-300">
                  Enter your registered email to receive an OTP for password reset.
                </DialogDescription>
              </DialogHeader>

              {/* Email Form */}
              {!isSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-gray-100">
                      Registered Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        disabled={loading}
                        className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 transition-colors duration-300"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 transition-colors duration-300" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 font-semibold flex items-center justify-center py-5 rounded-xl shadow-md transition-all duration-300"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Sending OTP...
                      </div>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center mt-10 space-y-3">
                  <Mail className="h-10 w-10 text-purple-600 dark:text-blue-400" />
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    OTP has been sent to your email. Please check your inbox.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Remembered your password?{" "}
                  <span
                    onClick={() => {
                      setIsForgotOpen(false);
                      setTimeout(() => onBackToLogin(), 300);
                    }}
                    className="text-purple-600 dark:text-gray-100 font-medium cursor-pointer hover:underline transition-colors duration-300"
                  >
                    Go back to Login
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Popup */}
      <OtpVerification
        open={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onBackToLogin={onBackToLogin}
        email={email}
        onBackToChangeEmail={() => {
          setIsOtpOpen(false);
          setTimeout(() => setIsForgotOpen(true), 300);
        }}
      />
    </>
  );
}
