import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import ForgotPassword from "./ForgotPassword";
import toast from "react-hot-toast";
import { setUser } from "@/redux/authSlice";
import axios from "axios";

export default function LoginPage({ open, setOpen }) {
  const { theme } = useSelector((store) => store.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotKey, setForgotKey] = useState(0);
  const [loading, setLoading] = useState(false);


  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const openForgotPassword = () => {
    setOpen(false);
    setTimeout(() => {
      setForgotKey((prev) => prev + 1);
      setIsForgotOpen(true);
    }, 300);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.loading("Checking credentials...");
    const apiURL = import.meta.env.VITE_API_URL;
    try {
      const res = await axios.post(`${apiURL}/user/login`, formData);
      if (res.data.success) {
        dispatch(setUser(res.data.user))
        localStorage.setItem("accessToken", res.data.accessToken);

        toast.success(res.data.message || "Login successful");
        if (res.data.user.role === "student") {
          navigate("/student/dashboard")

        }
        else if (res.data.user.role === "supervisor") {
          navigate('/supervisor/dashboard')
        }
        else if (res.data.user.role === "coordinator") {
          navigate('/coordinator/dashboard')
        }
        else {
          navigate('/admin/dashboard')
        }
        toast.dismiss();
      }

      toast.success(`Login successful 🎉 Welcome back ${res.data.user.username}`);
      setOpen(false);
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message || error.response?.data || "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`sm:max-w-md rounded-2xl backdrop-blur-md bg-white dark:bg-gray-900 shadow-xl p-0 overflow-hidden transition-colors duration-300 ${theme === "dark" ? "dark" : ""
          }`}
      >
        <Card className="border-none shadow-md rounded-xl bg-white dark:bg-gray-800 transition-colors duration-300">
          <CardContent className="flex flex-col justify-between p-6">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-2xl font-semibold text-purple-600 dark:text-gray-100 text-center">
                Welcome to <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">FYP Buddy</span>
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-300 text-sm text-center">
                Login to continue your FYP Journey
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4 mt-4" onSubmit={handleLogin}>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-100">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* Password */}
              <div className="space-y-2 relative">
                <Label htmlFor="password" className="dark:text-gray-100">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 dark:bg-gray-100 dark:text-gray-900 font-semibold flex items-center justify-center py-5 rounded-xl shadow-md transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-left flex flex-row gap-2 text-sm dark:text-gray-300">
                <p>Forgot your password?</p>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="font-medium text-purple-600 hover:underline dark:text-gray-100"
                >
                  Click here
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-600 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Don’t have an account?{" "}
                <span className="text-purple-600 dark:text-gray-100 font-medium cursor-pointer hover:underline">
                  Contact Admin
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>

      {/* Forgot Password Dialog */}
      <ForgotPassword
        key={forgotKey}
        open={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        onBackToLogin={() => {
          setIsForgotOpen(false);
          setTimeout(() => setOpen(true), 300);
        }}
      />
    </Dialog>
  );
}
