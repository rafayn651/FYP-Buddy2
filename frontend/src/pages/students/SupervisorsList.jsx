import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import userImg from "@/assets/user.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

export default function SupervisorsList() {
    const [supervisors, setSupervisors] = useState({});
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fypTitle, setFypTitle] = useState("")
    const [description, setDescription] = useState("")
    const navigate = useNavigate();
    const accessToken = localStorage.getItem("accessToken");
    const apiURL = import.meta.env.VITE_API_URL;
    const { group } = useSelector((store) => store.group)
    const groupId = group._id || null

    const getSupervsiors = async () => {
        try {
            setLoading(true);


            const res = await axios.get(`${apiURL}/user/get-users`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            });

            if (res.data.success) {
                // Filter only supervisors
                const onlySupervisors = res.data.user.filter(
                    (u) => u.role === "supervisor"
                );

                // Group supervisors by department
                const grouped = onlySupervisors.reduce((acc, sup) => {
                    const dept = sup.department || "Other";
                    if (!acc[dept]) acc[dept] = [];
                    acc[dept].push(sup);
                    return acc;
                }, {});

                setSupervisors(grouped);
            } else {
                toast.error(res.data.message || "Failed to fetch users");
            }
        } catch (error) {
            toast.error("Failed to load Supervisors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getSupervsiors();
    }, []);

    const handleSelect = (supervisor) => {
        setSelectedSupervisor(supervisor);
        setShowForm(false);
    };

    const handleSendRequest = () => setShowForm(true);
    const handleBack = () => {
        setSelectedSupervisor(null);
        setShowForm(false);
    };
    const handleBackToProfile = () => setShowForm(false);
    const handleBackToDashboard = () => {
        setSelectedSupervisor(null);
        setShowForm(false);
        navigate(-1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!groupId) {
            toast.error("Group not found. Please form a group first.");
            return;
        }

        try {
            setLoading(true);

            const res = await axios.post(`${apiURL}/supervisor/send-request`,
                {
                    fypTitle,
                    description,
                    groupId,
                    supervisorId: selectedSupervisor._id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                }
            );

            if (res.data.success) {
                toast.success(res.data.message || "Request sent successfully!");
                setShowForm(false);
                setSelectedSupervisor(null);
                setFypTitle("");
                setDescription("");
            } else {
                toast.error(res.data.message || "Failed to send request");
            }
        } catch (error) {
            console.error("Error sending request:", error);
            toast.error(error.response?.data?.message || "Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-purple-50 dark:bg-gray-900 transition-colors duration-300 mt-15">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                <Sidebar portalType="student" />

                <main className="flex-1 flex flex-col gap-6 overflow-y-auto">
                    <Card className="relative bg-white dark:bg-gray-800 p-8 text-center shadow-lg rounded-2xl transition-all duration-300">
                        <Button
                            onClick={handleBackToDashboard}
                            className="absolute top-4 left-4 flex items-center gap-2 bg-gray-800 text-white dark:text-gray-800 hover:bg-gray-700 dark:bg-gray-100 cursor-pointer dark:hover:bg-gray-200"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>

                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 mt-6">
                            Meet Your{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Future</span>{" "}
                            Mentors
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            Connect with experienced supervisors ready to guide you through your FYP journey.
                        </p>
                    </Card>

                    {/* Supervisors List by Department */}
                    {!selectedSupervisor && !showForm && (
                        <div className="flex flex-col items-center w-full">
                            {Object.entries(supervisors).map(([dept, list]) => (
                                <div key={dept} className="w-full max-w-6xl text-center mt-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                                        {dept}
                                    </h2>
                                    <hr className="w-32 h-[3px] mb-8 mx-auto  rounded border-0 bg-purple-500  dark:bg-gray-100" />

                                    <div
                                        className="grid gap-6 justify-items-center"
                                        style={{
                                            gridTemplateColumns:
                                                "repeat(auto-fit, minmax(220px, 1fr))",
                                        }}
                                    >
                                        {list.map((sup) => (
                                            <Card
                                                key={sup._id}
                                                onClick={() => handleSelect(sup)}
                                                className="cursor-pointer flex flex-col items-center text-center bg-white dark:bg-gray-800 shadow-md hover:-translate-y-1 transition-all duration-300 w-full max-w-[230px] p-4"
                                            >
                                                <img
                                                    src={sup.profilePic}
                                                    alt={sup.username}
                                                    className="w-20 h-20 rounded-full mb-2 border border-gray-300 dark:border-gray-700 object-cover"
                                                />
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                                    {sup.username}
                                                </h3>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-snug mt-0.5">
                                                    {`Expert: ${sup.specialization}`}
                                                </p>
                                                <span className="text-purple-600 dark:text-gray-100 text-xs font-medium mt-1">
                                                    {`Available: ${sup.supervision.isAvailable ? "Yes" : "No"}`}
                                                </span>
                                            </Card>

                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Selected Supervisor */}
                    {selectedSupervisor && !showForm && (
                        <Card className="relative p-6 bg-white dark:bg-gray-800 text-center shadow-lg rounded-2xl transition-all duration-300 max-w-md mx-auto flex flex-col justify-center">
                            <div>
                                <Button
                                    onClick={handleBack}
                                    className="absolute top-4 left-4 flex items-center gap-2 bg-gray-800 text-white dark:text-gray-800 hover:bg-gray-700 dark:bg-gray-100 cursor-pointer dark:hover:bg-gray-200 text-sm px-3 py-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <img
                                    src={selectedSupervisor.profilePic || userImg}
                                    alt={selectedSupervisor.username}
                                    className="w-28 h-28 rounded-full mx-auto mb-3 border border-gray-300 dark:border-gray-700 object-cover"
                                />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {selectedSupervisor.username}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">
                                    Available Slots: {5 - selectedSupervisor.supervision.current || 0}
                                </p>
                                <a
                                    href="#"
                                    className="text-purple-600 dark:text-gray-100 hover:underline text-sm mb-2 block"
                                >
                                    View CV
                                </a>
                                <p className="text-gray-700 dark:text-gray-300 text-sm max-w-md mx-auto mb-4 leading-relaxed">
                                    {`Expertise: ${selectedSupervisor.specialization} `}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 text-sm max-w-md mx-auto mb-4 leading-relaxed">
                                    {`Department: ${selectedSupervisor.department} `}
                                </p>
                                <Button
                                    onClick={handleSendRequest}
                                    className="bg-purple-600 cursor-pointer hover:bg-purple-700 text-white dark:bg-gray-100 dark:text-gray-700 dark:hover:bg-gray-300 text-sm px-4 py-2"
                                >
                                    Send Request
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Request Form */}
                    {showForm && (
                        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl transition-all duration-300 max-w-md mx-auto">
                            <div className="flex flex-col">
                                <Button
                                    onClick={handleBackToProfile}
                                    className="flex items-center gap-2 mb-3 bg-gray-800 text-white dark:text-gray-800 hover:bg-gray-700 dark:bg-gray-100 cursor-pointer dark:hover:bg-gray-200 text-sm px-3 w-fit"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <h2 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
                                    Send FYP Request
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
                                    <div className="flex-shrink-0">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                            FYP Idea Title
                                        </label>
                                        <Input
                                            type="text"
                                            required
                                            className="text-sm"
                                            value={fypTitle}
                                            onChange={(e) => setFypTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex-shrink-0 flex flex-col">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                            FYP Idea Description
                                        </label>
                                        <Textarea
                                            rows={5}
                                            required
                                            className="text-sm resize-none overflow-y-auto break-words break-all"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            style={{ 
                                                resize: "none",
                                                maxHeight: "8rem",
                                                minHeight: "5rem"
                                            }}
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {description.length} characters
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full cursor-pointer bg-purple-600 hover:bg-purple-700 text-white dark:bg-gray-100 dark:text-gray-700 dark:hover:bg-gray-300 text-sm py-2 mt-2 flex-shrink-0"
                                    >
                                        {loading ? "Sending..." : "Send"}
                                    </Button>
                                </form>

                            </div>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    );
}
