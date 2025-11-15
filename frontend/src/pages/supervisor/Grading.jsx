import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Lock, Users, Upload, AlertCircle, List, Check, GraduationCap } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SupervisorGrading() {
    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");

    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [milestone, setMilestone] = useState(null);
    const [grades, setGrades] = useState([]);

    // 5 Rubrics for supervisor grading (each out of 4, total 20)
    const RUBRICS = [
        { label: "Understanding", max: 4, description: "Understanding of project scope and requirements" },
        { label: "Methodology", max: 4, description: "Appropriate methodology and approach" },
        { label: "Implementation", max: 4, description: "Quality of implementation and coding" },
        { label: "Presentation", max: 4, description: "Presentation and communication skills" },
        { label: "Contribution", max: 4, description: "Individual contribution to the project" },
    ];

    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState({ groups: false, details: false, submit: false });

    const selectedGroup = groups.find((g) => g._id === selectedGroupId) || null;
    const members = selectedGroup?.members || [];
    const gradingDeadline = milestone?.gradingDeadline;
    const isGradingClosed = gradingDeadline ? new Date(gradingDeadline) < new Date() : false;
    const isValidPhase = milestone?.phase === "Progress" || milestone?.phase === "Defence";

    const formatDeadline = (date) => {
        if (!date) return "No deadline set";
        return new Date(date).toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Fetch supervisor's groups
    const fetchGroups = useCallback(async () => {
        if (!accessToken) {
            toast.error("Please login again");
            return;
        }

        try {
            setLoading(prev => ({ ...prev, groups: true }));
            const res = await axios.get(`${apiURL}/supervisor/my-groups`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }, withCredentials: true
            });

            if (res.data?.success && Array.isArray(res.data.groups)) {
                setGroups(res.data.groups);
            } else {
                toast.error("Failed to load groups");
                setGroups([]);
            }
        } catch (err) {
            console.error("Error fetching groups:", err);
            toast.error(err.response?.data?.message || "Failed to load your groups");
            setGroups([]);
        } finally {
            setLoading(prev => ({ ...prev, groups: false }));
        }
    }, [apiURL, accessToken]);

    // Load groups on component mount
    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    // Fetch group grades
    const fetchGroupGrades = async (currentMilestone) => {
        if (!selectedGroupId || !currentMilestone) return;

        setLoading(true);
        try {
            const res = await axios.get(
                `${apiURL}/grading/get-group-marks/${selectedGroupId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                }
            );

            if (res.data.success) {
                const gradesData = res.data.data;

                // Filter grades for the current milestone phase
                const filteredGrades = gradesData.filter(
                    (grade) => grade.phase === currentMilestone.phase
                );

                if (filteredGrades.length > 0) {
                    setGrades(filteredGrades);
                } else {
                    setGrades([]);
                    toast.error("No grades available for the current phase");
                }
            } else {
                setGrades([]);
                toast.error(res.data.message || "Failed to fetch grades");
            }
        } catch (error) {
            const message =
                error.response?.data?.message || "Failed to fetch grades";
            toast.error(message);
            console.error("Error fetching grades:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch milestone and grades when a group is selected
    useEffect(() => {
        if (!selectedGroupId) {
            setMilestone(null);
            setMarks({});
            setGrades([]);
            return;
        }

        const fetchGroupMilestone = async () => {
            try {
                setLoading((prev) => ({ ...prev, details: true }));
                setMarks({});

                const res = await axios.get(
                    `${apiURL}/milestone/get-my-milestone/${selectedGroupId}`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    }
                );

                if (res.data.success) {
                    const fetchedMilestone = res.data.milestone;
                    setMilestone(fetchedMilestone);

                    // Pass milestone directly to avoid null issue
                    fetchGroupGrades(fetchedMilestone);
                } else {
                    setMilestone(null);
                    toast.error("Failed to fetch milestone details");
                }
            } catch (err) {
                console.error("Error fetching milestone:", err);
                toast.error(
                    err.response?.data?.message || "Failed to fetch milestone details"
                );
                setMilestone(null);
            } finally {
                setLoading((prev) => ({ ...prev, details: false }));
            }
        };

        fetchGroupMilestone();
    }, [selectedGroupId, apiURL, accessToken]);


    // Handle rubric marks change
    const handleRubricChange = (memberId, rubricIndex, value) => {
        if (isGradingClosed || !isValidPhase) return;

        const rubric = RUBRICS[rubricIndex];
        const numValue = Math.max(0, Math.min(Number(value) || 0, rubric.max));

        if (Number.isNaN(numValue)) return;

        setMarks(prev => ({
            ...prev,
            [memberId]: prev[memberId]?.map((mark, idx) =>
                idx === rubricIndex ? numValue : mark
            ) || RUBRICS.map((_, idx) => idx === rubricIndex ? numValue : 0)
        }));
    };

    // Calculate total marks for a student (0-20)
    const calculateTotal = (memberId) => {
        const studentMarks = marks[memberId] || [];
        return studentMarks.reduce((sum, mark) => sum + (Number(mark) || 0), 0);
    };

    // Submit marks for a student
    const submitMarks = async (memberId) => {
        if (!selectedGroupId || !milestone || !isValidPhase) return;

        const member = members.find(m => m._id === memberId);
        if (!member) return;

        const totalMarks = calculateTotal(memberId);
        if (totalMarks === 0) {
            toast.error("Please enter marks before submitting");
            return;
        }

        try {
            setLoading(prev => ({ ...prev, submit: true }));

            const payload = {
                studentId: memberId,
                groupId: selectedGroupId,
                phase: milestone.phase,
                marks: totalMarks
            };

            const res = await axios.post(
                `${apiURL}/grading/supervisor`,
                payload,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (res.data?.success) {
                toast.success(`Marks submitted for ${member.username || member.email}`);
                fetchGroupGrades(milestone);
                setMarks(prev => ({
                    ...prev,
                    [memberId]: RUBRICS.map(() => 0)
                }));
            } else {
                toast.error(res.data?.message || "Failed to submit marks");
            }
        } catch (err) {
            console.error("Error submitting marks:", err);
            toast.error(err.response?.data?.message || "Failed to submit marks");
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };


    // Render student grading card
    const StudentGradingCard = ({ member }) => {
        const totalMarks = calculateTotal(member._id);

        return (
            <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Student Info */}
                    <div className="lg:w-48">
                        <h4 className="font-bold text-md text-gray-900 dark:text-white">{member.username || member.email}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>

                    {/* Rubrics */}
                    <div className="flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {RUBRICS.map((rubric, index) => (
                                <div key={rubric.label} className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {rubric.label}
                                        <span className="text-xs text-gray-500"> ({rubric.max})</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={rubric.max}
                                        step="0.5"
                                        placeholder="0"
                                        value={marks[member._id]?.[index] || ""}
                                        onChange={(e) => handleRubricChange(member._id, index, e.target.value)}
                                        disabled={isGradingClosed || !isValidPhase || loading.submit}
                                        className="text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total and Submit */}
                    <div className="lg:w-48 flex flex-col justify-between">
                        <div className="text-center mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Marks</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalMarks}/20</p>
                        </div>
                        <Button
                            onClick={() => submitMarks(member._id)}
                            disabled={isGradingClosed || !isValidPhase || loading.submit || totalMarks === 0}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                        >
                            {loading.submit ? (
                                "Submitting..."
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Submit Marks
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        );
    };

    // Render recorded grades table
    const RecordedGradesTable = ({ grades }) => {
        if (!grades || grades.length === 0) {
            return (
                <div className="text-center py-6 text-gray-600 dark:text-gray-400">
                    No recorded grades available.
                </div>
            );
        }

        return (
            <Card className={"w-full mt-2 p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl"}>
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Student Name</TableHead>
                            <TableHead className="w-[40%] text-right">Supervisor Marks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {grades.map((grade) => (
                            <TableRow key={grade.studentId}>
                                <TableCell>{grade.studentId.username || grade.email || "Unknown Student"}</TableCell>
                                <TableCell className="text-right font-medium">{grade.supervisorMarks || 0}/20</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        );
    };

    return (
        <div className="min-h-screen mt-15">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                {/* Sidebar */}
                <Sidebar portalType="supervisor" />

                {/* Main Section */}
                <main className="flex-1 flex flex-col gap-5">
                    {/* Header */}
                    <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                            Grade{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Groups
                            </span>{" "}

                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-base">
                            Review and assign grades for your supervised groups' progress and defence phases.
                        </p>
                    </Card>

                    {/* Group Selection Card */}
                    <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                        <div className="flex flex-row flex-wrap items-center justify-between gap-6">

                            {/* Group Select */}
                            <Select
                                value={selectedGroupId || "none"}
                                onValueChange={(groupId) => setSelectedGroupId(groupId === "none" ? "" : groupId)}
                                disabled={loading.groups || loading.details}
                            >
                                <SelectTrigger className="w-48 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                    <SelectValue placeholder={loading.groups ? "Loading groups..." : "Choose a group"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        {loading.groups ? "Loading groups..." : "Choose a group"}
                                    </SelectItem>
                                    {groups.map((group) => (
                                        <SelectItem key={group._id} value={group._id}>
                                            {group.groupName || `Group ${group._id.slice(-4)}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Phase Display */}
                            <div className="text-center md:text-left font-medium text-gray-700 dark:text-gray-300">
                                {`Phase: ${milestone ? milestone.phase : "--"}`}
                            </div>

                            {/* Grading Deadline */}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-500" />
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Grading Deadline:</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatDeadline(gradingDeadline)}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </Card>



                    <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                        {/* No group selected */}
                        {!selectedGroupId && !loading.details && (
                            <div className="text-center py-12">
                                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Select a group to grade their Phases
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Choose a group from the dropdown to begin grading their Progress or Defence phase.
                                </p>
                            </div>
                        )}

                        {/* Loading state */}
                        {loading.details && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-600 dark:text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-3"></div>
                                <p>Loading group details...</p>
                            </div>
                        )}

                        {/* No milestone found */}
                        {!loading.details && selectedGroupId && !milestone && (
                            <div className="text-center py-12">
                                <List className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    No Milestone Found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    There is currently no milestone assigned for this group.
                                </p>
                            </div>
                        )}

                        {/* Invalid phase */}
                        {!loading.details && milestone && !isValidPhase && (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                                <h3 className="text-lg font-semibold text-yellow-600 mb-2">
                                    Grading Unavailable
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Grading is only available during Progress and Defence phases.
                                </p>
                            </div>
                        )}

                        {/* Grading closed */}
                        {!loading.details && isGradingClosed && (
                            <>
                                <div className="text-center py-4">
                                    <Lock className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Grading Closed
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        The grading deadline has passed for this milestone. Contact Coordinator incase of missing grades.
                                    </p>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                                        Recorded Grades
                                    </h2>
                                    <RecordedGradesTable grades={grades.length > 0 ? grades.map(g => ({
                                        studentId: g.studentId,
                                        studentName: members.find(m => m._id === g.studentId)?.username || members.find(m => m._id === g.studentId)?.email,
                                        supervisorMarks: g.supervisorMarks
                                    })) : []} />
                                </div>
                            </>
                        )}

                        {/* Group has no members */}
                        {!loading.details && selectedGroupId && milestone && isValidPhase && members.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    No Members Found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    This group currently has no assigned members.
                                </p>
                            </div>
                        )}

                        {/* Members list and grading */}
                        {!loading.details && selectedGroupId && milestone && isValidPhase && members.length > 0 && !isGradingClosed && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Group Members ({members.length})
                                    </h2>
                                </div>

                                {members.map((member) => (
                                    <StudentGradingCard key={member._id} member={member} />
                                ))}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
                                        Recorded Grades
                                    </h2>
                                    <RecordedGradesTable grades={grades.length > 0 ? grades.map(g => ({
                                        studentId: g.studentId,
                                        studentName: members.find(m => m._id === g.studentId)?.username || members.find(m => m._id === g.studentId)?.email,
                                        supervisorMarks: g.supervisorMarks
                                    })) : []} />
                                </div>
                            </div>
                        )}
                    </Card>

                </main>
            </div>
        </div>
    );
}
