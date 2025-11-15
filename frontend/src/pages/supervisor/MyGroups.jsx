import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Users,
    Calendar,
    Eye,
    GraduationCap,
    Crown,
    Mail,
    BookOpen,
} from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function MyGroups() {
    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all groups supervised by the current supervisor
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${apiURL}/supervisor/my-groups`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.data.success) {
                    setGroups(res.data.groups || []);
                } else {
                    toast.error("Failed to load groups.");
                }
            } catch (err) {
                console.error("Error fetching groups:", err);
                toast.error("Failed to load your groups.");
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, [apiURL, accessToken]);


    const getStatusBadge = (status) => {
        const statusColors = {
            pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
            active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            completed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        };
        return statusColors[status] || statusColors.pending;
    };

    return (
        <div className="min-h-screen mt-15 ">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                {/* Sidebar */}
                <Sidebar portalType="supervisor" />

                {/* Main Section */}
                <main className="flex-1 flex flex-col gap-5">
                    {/* Header */}
                    <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">

                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                            My{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Supervised</span>{" "}
                            Groups
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-base">
                            Manage and view all groups you are supervising.
                        </p>
                    </Card>

                    {/* Loading State */}
                    {loading ? (
                        <Card className="w-full max-w-6xl mx-auto p-12 bg-white dark:bg-gray-800 shadow-md rounded-2xl text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Loading groups...
                                </p>
                            </div>
                        </Card>
                    ) : (
                        /* Groups Grid */
                        <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                            {groups.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {groups.map((group) => {
                                        const memberCount = group.members?.length || 0;
                                        const shouldScroll = memberCount > 3;
                                        return (
                                            <Card
                                                key={group._id}
                                                className="group relative p-3 bg-gray-300 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
                                            >
                                                {/* Group Header */}
                                                <div className="mb-2 flex flex-col items-center">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                        <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight line-clamp-1 text-center">
                                                            {group.groupName || "Unnamed Group"}
                                                        </h2>
                                                    </div>

                                                    {/* FYP Title */}
                                                    {group.fypTitle && (
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 line-clamp-1 text-center px-1">
                                                            {group.fypTitle}
                                                        </p>
                                                    )}

                                                    {/* Status Badge */}
                                                    <Badge
                                                        className={`${getStatusBadge(group.status)} mb-1.5 text-xs px-2 py-0.5`}
                                                    >
                                                        {group.status || "pending"}
                                                    </Badge>

                                                    {/* Created Date */}
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            {group.createdAt
                                                                ? new Date(group.createdAt).toLocaleDateString(
                                                                      "en-US",
                                                                      {
                                                                          month: "short",
                                                                          day: "numeric",
                                                                          year: "numeric",
                                                                      }
                                                                  )
                                                                : "N/A"}
                                                        </span>
                                                    </div>

                                                    {/* View Details Button */}
                                                    {(group.fypTitle || group.description) && (
                                                        <button
                                                            onClick={() => setSelectedGroup(group)}
                                                            className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 hover:text-purple-700 dark:text-gray-100 dark:hover:text-gray-200 mt-1.5 cursor-pointer"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            View Details
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Divider */}
                                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-2"></div>

                                                {/* Team Members Section */}
                                                <div className="mb-2">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Users className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                                                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                            Team ({memberCount})
                                                        </h4>
                                                    </div>

                                                    <div className={`space-y-1 ${shouldScroll ? 'max-h-28 overflow-y-auto' : ''}`}>
                                                        {group.members?.length > 0 ? (
                                                            group.members.map((member, idx) => {
                                                                const isLeader =
                                                                    group.leaderId?._id === member._id ||
                                                                    group.leaderId?.toString() === member._id?.toString();
                                                                return (
                                                                    <div
                                                                        key={member._id || idx}
                                                                        className="flex items-center justify-between p-1.5 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Avatar className="w-6 h-6 border border-gray-200 dark:border-gray-700">
                                                                                {member.profilePic ? (
                                                                                    <AvatarImage
                                                                                        src={member.profilePic}
                                                                                        alt={member.username}
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold">
                                                                                        {member.username?.charAt(0)?.toUpperCase() || "U"}
                                                                                    </div>
                                                                                )}
                                                                            </Avatar>
                                                                            <span className="text-xs text-gray-800 dark:text-gray-200 truncate max-w-[90px]">
                                                                                {member.username}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            {isLeader && (
                                                                                <Crown className="w-2.5 h-2.5 text-yellow-500" />
                                                                            )}
                                                                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                                                                {member.semester &&
                                                                                member.section &&
                                                                                member.shift
                                                                                    ? `${member.semester}-${member.section}-${member.shift.charAt(0)}`
                                                                                    : "N/A"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 italic text-center py-2">
                                                                No members listed
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        No Groups Yet
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        You haven't been assigned to supervise any groups yet.
                                    </p>
                                </div>
                            )}
                        </Card>
                    )}
                </main>
            </div>

            {/* Group Details Dialog */}
            <Dialog
                open={!!selectedGroup}
                onOpenChange={() => setSelectedGroup(null)}
            >
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                    {selectedGroup && (
                        <>
                            <DialogHeader className="pb-3">
                                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                                    {selectedGroup.fypTitle || selectedGroup.groupName || "Group Details"}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                {/* Group Name */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        Group Name
                                    </h4>
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                                        {selectedGroup.groupName || "Not specified"}
                                    </div>
                                </div>

                                {/* FYP Title */}
                                {selectedGroup.fypTitle && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4" />
                                            FYP Title
                                        </h4>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                                            {selectedGroup.fypTitle}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {selectedGroup.description && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Description
                                        </h4>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {selectedGroup.description}
                                        </div>
                                    </div>
                                )}

                                {/* Status */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Status
                                    </h4>
                                    <Badge className={getStatusBadge(selectedGroup.status)}>
                                        {selectedGroup.status || "pending"}
                                    </Badge>
                                </div>

                                {/* All Members */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        All Members ({selectedGroup.members?.length || 0})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedGroup.members?.map((member, idx) => {
                                            const isLeader =
                                                selectedGroup.leaderId?._id === member._id ||
                                                selectedGroup.leaderId?.toString() === member._id?.toString();
                                            return (
                                                <div
                                                    key={member._id || idx}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10">
                                                            {member.profilePic ? (
                                                                <AvatarImage
                                                                    src={member.profilePic}
                                                                    alt={member.username}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                                                    {member.username?.charAt(0)?.toUpperCase() || "U"}
                                                                </div>
                                                            )}
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                                                {member.username}
                                                                {isLeader && (
                                                                    <Crown className="w-4 h-4 inline ml-2 text-yellow-500" />
                                                                )}
                                                            </p>
                                                            {member.email && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {member.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {isLeader && (
                                                            <Badge className="bg-yellow-500 text-white mb-1">
                                                                Leader
                                                            </Badge>
                                                        )}
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {member.semester &&
                                                            member.section &&
                                                            member.shift
                                                                ? `${member.semester}-${member.section}-${member.shift}`
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Created Date */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Created At
                                    </h4>
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                                        {selectedGroup.createdAt
                                            ? new Date(selectedGroup.createdAt).toLocaleString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "N/A"}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
