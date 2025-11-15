import React, { useState } from "react";
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
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function ResetPassword({ open, onClose, onBackToLogin, email }) {
  const { theme } = useSelector((store) => store.theme);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return "your email";
    const [local, domain] = email.split("@");
    const visiblePart = local.slice(0, 2);
    const hidden = "*".repeat(Math.max(local.length - 2, 3));
    return `${visiblePart}${hidden}@${domain}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!password.trim() || !confirm.trim()) {
      toast.error("Please fill out both password fields.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@]).{8,}$/;
    if (!passwordRegex.test(password) || !passwordRegex.test(confirm)) {
      toast.error(
        "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 digit, and @ symbol."
      );
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Resetting password...");

      const apiURL = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiURL}/user/reset-password/${email}`, {
        newPassword: password,
        confirmPassword: confirm,
      });

      toast.dismiss();

      if (res.data.success) {
        toast.success(res.data.message);

        setIsSaved(true);
        setPassword("");
        setConfirm("");

        setTimeout(() => {
          setIsSaved(false);
          onClose();
          setTimeout(() => onBackToLogin(), 500);
        }, 2500);
      }
    } catch (error) {
      toast.dismiss();
      console.log(error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
                Reset <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Password</span>
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-300 text-center text-sm transition-colors duration-300">
                Enter your new password for{" "}
                <span className="font-medium text-purple-600 dark:text-gray-100 transition-colors duration-300">
                  {maskEmail(email)}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            {/* Form */}
            {!isSaved ? (
              <form onSubmit={handleSave} className="space-y-4 mt-4">
                {/* New Password */}
                <div className="space-y-2 relative">
                  <Label className="dark:text-gray-100" htmlFor="password">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword1 ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="focus:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 pr-10 transition-colors duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword1(!showPassword1)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-purple-600 transition-colors duration-300"
                    >
                      {showPassword1 ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2 relative">
                  <Label className="dark:text-gray-100" htmlFor="confirm">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showPassword2 ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      className="focus:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 pr-10 transition-colors duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2(!showPassword2)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-purple-600 transition-colors duration-300"
                    >
                      {showPassword2 ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 font-semibold flex items-center justify-center transition-colors duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Password"
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center mt-10 space-y-3">
                <Lock className="h-10 w-10 text-purple-600 dark:text-blue-400 transition-colors duration-300" />
                <p className="text-gray-600 dark:text-gray-100 text-center transition-colors duration-300">
                  Password reset successfully! You can now log in with your new
                  password.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center transition-colors duration-300">
              <p className="text-sm text-gray-600 dark:text-gray-100 transition-colors duration-300">
                Ready to log in?{" "}
                <span
                  onClick={() => {
                    onClose();
                    setTimeout(() => onBackToLogin(), 300);
                  }}
                  className="text-purple-600 dark:text-gray-100 font-medium cursor-pointer hover:underline transition-colors duration-300"
                >
                  Back to Login
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
