import React, { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
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

export default function CreateUser({ open, setOpen }) {
  const { theme } = useSelector((store) => store.theme);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    cnic: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ---------- Input Validation ----------
  const handleChange = (e) => {
    const { name, value } = e.target;

    // username: only letters and spaces
    if (name === "username") {
      const onlyLetters = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData((prev) => ({ ...prev, username: onlyLetters }));
      return;
    }

    // email: always lowercase
    if (name === "email") {
      setFormData((prev) => ({ ...prev, email: value.toLowerCase() }));
      return;
    }

    // cnic: only digits, max 13
    if (name === "cnic") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 13);
      let updated = { ...formData, cnic: digitsOnly };

      // Auto-generate password when CNIC is exactly 13 digits
      if (digitsOnly.length === 13) {
        const generatedPassword = `Numl@${digitsOnly}`;
        if (formData.password === "" || formData.password.startsWith("Numl@")) {
          updated.password = generatedPassword;
          updated.confirmPassword = generatedPassword;
        }
      }
      setFormData(updated);
      return;
    }

    // normal update
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- Form Submission ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    if (!formData.username.match(/^[A-Za-z\s]+$/)) {
      toast.error("Username must contain only letters and spaces.");
      return;
    }

    if (!/^\d{13}$/.test(formData.cnic)) {
      toast.error("CNIC must be exactly 13 digits without dashes or alphabets.");
      return;
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email must be lowercase and in a valid format!");
      return;
    }

    if (!role) {
      toast.error("Please select a role!");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;

    if (!passwordRegex.test(formData.password)) {
      toast.error(
        "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    toast.loading("Creating user...");

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role,
        cnic: formData.cnic,
      };

      const apiUrl = import.meta.env.VITE_API_URL;
      const accessToken = localStorage.getItem("accessToken");

      const res = await axios.post(`${apiUrl}/user/register`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      toast.dismiss();
      if (res.data.success) {
        toast.success("User Created Successfully!");
        setFormData({
          username: "",
          cnic: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setRole("");
        setOpen(false);
      }
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`sm:max-w-md rounded-2xl backdrop-blur-md bg-white dark:bg-gray-900 shadow-xl p-0 overflow-hidden transition-colors duration-300 ${theme === "dark" ? "dark" : ""
          }`}
      >
        <Card className="border-none shadow-md rounded-xl bg-white dark:bg-gray-800 transition-colors duration-300">
          <CardContent className="flex flex-col justify-between p-6">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-2xl font-semibold text-purple-600 dark:text-gray-100">
                Create a new user
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-300 text-sm">
                Fill the details and save changes
              </DialogDescription>
            </DialogHeader>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              {/* Role dropdown */}
              <div className="flex flex-col gap-2">
                <Label className="dark:text-gray-200">
                  Role <span className="text-red-500">*</span>
                </Label>
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-gray-400 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="student">Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="coordinator">FYP Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="flex flex-col gap-2">
                  <Label className="dark:text-gray-200">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    required
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <Label className="dark:text-gray-200">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                {/* CNIC */}
                <div className="flex flex-col gap-2">
                  <Label className="dark:text-gray-200">
                    CNIC <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleChange}
                    placeholder="13 digits, no dashes"
                    required
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2 relative">
                  <Label className="dark:text-gray-200">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                      className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-300 hover:text-purple-500"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2 relative">
                  <Label className="dark:text-gray-200">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 font-semibold flex items-center justify-center py-5 rounded-xl shadow-md transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Adding ...
                  </>
                ) : (
                  "Add User"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
