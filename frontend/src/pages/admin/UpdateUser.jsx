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
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function UpdateUser({ open, setOpen, selectedUser }) {
  const { theme } = useSelector((store) => store.theme);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  // 🔹 Email-related states (same as ProfilePage)
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailChanged, setEmailChanged] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");
  const [saveDisabled, setSaveDisabled] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    cnic: "",
    email: "",
  });

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");
  const emailRegex = /^[a-z0-9.+]+@[a-z0-9.-]+\.[a-z]{2,}$/;



  useEffect(() => {
    if (selectedUser) {
      setRole(selectedUser.role || "");
      setFormData({
        fullName: selectedUser.username || "",
        cnic: selectedUser.cnic || "",
        email: selectedUser.email || "",
      });
      setVerifiedEmail(selectedUser.email || "");
      setOriginalEmail(selectedUser.email || "");
      setEmailChanged(false);
    }
  }, [selectedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      const newEmail = value.trim();
      setFormData((prev) => ({ ...prev, email: newEmail }));

      // Check if email is empty
      if (newEmail === "") {
        setEmailChanged(false);
        setSaveDisabled(true);
        return;
      }

      // Check if email matches verified or original
      if (newEmail === verifiedEmail || newEmail === originalEmail) {
        setEmailChanged(false);
        setSaveDisabled(false);
      } else {
        setEmailChanged(true);
        setSaveDisabled(false);
      }
    }
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "fullName") {
      // Only letters and spaces
      const sanitized = value.replace(/[^A-Za-z\s]/g, "");
      setFormData((prev) => ({ ...prev, fullName: sanitized }));
    } else if (name === "email") {
      // Only lowercase letters, digits, @, ., _
      const sanitized = value.replace(/[^a-z0-9@._]/g, "");
      setFormData((prev) => ({ ...prev, email: sanitized }));

      // Track email changes
      if (sanitized === verifiedEmail || sanitized === originalEmail) {
        setEmailChanged(false);
      } else {
        setEmailChanged(true);
      }
    } else if (name === "cnic") {
      // Only digits, max 13
      const sanitized = value.replace(/[^0-9]/g, "").slice(0, 13);
      setFormData((prev) => ({ ...prev, cnic: sanitized }));
    }
  };

  // 🔹 Handle new email request
  const handleNewEmailRequest = async () => {
    if (!emailChanged) return;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email address");
      return;
    }


    try {
      setLoading(true);
      const res = await axios.post(
        `${apiURL}/user/email-change/${selectedUser._id}`,
        { newEmail: formData.email },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setOtpMode(true);
        toast.success(res.data.message);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Unable to verify the new email.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle OTP Verification
  const handleOTPVerification = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter complete 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${apiURL}/user/verify-email/${selectedUser._id}`,
        { otp, newEmail: formData.email },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setOtpMode(false);
        setVerifiedEmail(formData.email);
        setEmailChanged(false);
        toast.success(res.data.message);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Unable to verify your new email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle full update (after email verified)
  const handleUpdate = async (e) => {
    e.preventDefault();
    const cnicPattern = /^\d{13}$/;

    const cnicValue = String(formData.cnic); // Ensure it's a string

    if (formData.cnic !== selectedUser.cnic && !cnicPattern.test(cnicValue)) {
      toast.error("CNIC must be exactly 13 digits without dashes.");
      return; 
    }

    const payload = {
      role,
      username: formData.fullName,
    };
    if (formData.email !== selectedUser.email) payload.email = formData.email;
    if (formData.cnic !== selectedUser.cnic) payload.cnic = cnicValue;

    const toastId = toast.loading("Updating user...");
    try {
      setLoading(true);
      const res = await axios.put(
        `${apiURL}/user/update-user/${selectedUser._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      toast.dismiss(toastId);
      if (res.data.success) {
        toast.success(res.data.message || "User updated successfully!");
        setTimeout(() => setOpen(false), 800);
      }
    } catch (error) {
      toast.dismiss(toastId);
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to update user.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`sm:max-w-md rounded-2xl backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-xl p-0 overflow-hidden transition-colors duration-300 ${theme === "dark" ? "dark" : ""
          }`}
      >
        <Card className="border-none shadow-md rounded-xl bg-white dark:bg-gray-800 transition-colors duration-300">
          <CardContent className="flex flex-col justify-between p-6">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-2xl text-center font-semibold text-purple-600 dark:text-gray-100">
                Update Existing User
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-center dark:text-gray-300 text-sm">
                Fill in the details and save changes.
              </DialogDescription>
            </DialogHeader>

            <form className="mt-4 space-y-4" onSubmit={handleUpdate}>
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
                  disabled={loading}
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-gray-400 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="student">Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="coordinator">FYP Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-2">
                  <Label className="dark:text-gray-200">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter full name"
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
                    value={formData.email || ""}
                    onChange={handleChange}
                    disabled={loading}
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
                    value={formData.cnic || ""}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter CNIC (No Dashes)"
                    required
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Button group */}
              {emailChanged ? (
                <Button
                  type="button"
                  onClick={handleNewEmailRequest}
                  disabled={loading}
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 font-semibold flex items-center justify-center py-5 rounded-xl shadow-md transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    "Verify New Email"
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || saveDisabled}
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 font-semibold flex items-center justify-center py-5 rounded-xl shadow-md transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save User"
                  )}
                </Button>
              )}
            </form>

            {/* OTP Dialog (same as ProfilePage) */}
            {otpMode && (
              <Dialog open={otpMode} onOpenChange={setOtpMode}>
                <DialogContent
                  className={`sm:max-w-md rounded-2xl backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-xl p-0 overflow-hidden transition-colors duration-300 ${theme === "dark" ? "dark" : ""
                    }`}
                >
                  <Card className="border-none shadow-md rounded-xl bg-white dark:bg-gray-800 transition-colors duration-300">
                    <div className="flex flex-col justify-between p-6">
                      <DialogHeader className="text-center mb-4">
                        <DialogTitle className="text-2xl font-semibold text-center text-purple-600 dark:text-gray-100">
                          Verify New Email
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-100 text-center text-sm">
                          Enter the OTP sent to{" "}
                          <span className="font-medium text-purple-600 dark:text-gray-100">
                            {formData.email}
                          </span>
                          .
                        </DialogDescription>
                      </DialogHeader>

                      <div className="mt-6 flex justify-center gap-2 sm:gap-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otp[index] || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              const newOtp =
                                otp.substring(0, index) + val + otp.substring(index + 1);
                              setOtp(newOtp);
                              if (val && index < 5) {
                                const next = document.getElementById(`otp-${index + 1}`);
                                next && next.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !otp[index] && index > 0) {
                                const prev = document.getElementById(`otp-${index - 1}`);
                                prev && prev.focus();
                              }
                            }}
                            id={`otp-${index}`}
                            className="w-10 h-12 text-center text-lg font-semibold border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 transition-colors duration-300"
                          />
                        ))}
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOtpMode(false)}
                          className="dark:text-gray-100 w-full sm:w-auto cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleOTPVerification}
                          disabled={loading}
                          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300 font-semibold cursor-pointer"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin h-4 w-4 mr-2" />
                              Verifying...
                            </>
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
