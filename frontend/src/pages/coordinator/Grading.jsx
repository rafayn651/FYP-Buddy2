import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Search, ChevronsUpDown, Check } from "lucide-react";
import toast from "react-hot-toast";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";

const CoordinatorGrading = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");
  const { user } = useSelector((store) => store.auth)
  const [phase, setPhase] = useState("Progress");
  const [milestones, setMilestones] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(undefined);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [allGrades, setAllGrades] = useState([]);

  // Search states
  const [searchGroupName, setSearchGroupName] = useState("");
  const [searchPhase, setSearchPhase] = useState("all");
  const [searchMemberName, setSearchMemberName] = useState("");

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/milestone/get-all-milestones`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      if (res.data.success) {
        const allMilestones = res.data.data || [];
        const departmentFiltered = allMilestones.filter(
          (m) => m.department === user?.department
        );

        setMilestones(departmentFiltered);
      } else {
        setMilestones([]);
      }
    } catch (e) {
      toast.error("Failed to load milestones");
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };


  const loadAllGrades = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/grading/get-all-grades`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      if (res.data.success) {
        const allGrades = res.data.data || [];
        const departmentFiltered = allGrades.filter(
          (g) => g.milestoneId?.department === user?.department
        );

        setAllGrades(departmentFiltered);
      } else {
        setAllGrades([]);
      }
    } catch (e) {
      toast.error("Failed to load grades");
      setAllGrades([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadMilestones();
    loadAllGrades();
  }, []);

  const currentPhaseGroups = useMemo(
    () =>
      milestones
        .filter((m) => m.phase === phase)
        .map((m) => ({
          groupId: typeof m.groupId === "object" ? m.groupId._id : m.groupId,
          groupName:
            typeof m.groupId === "object" ? m.groupId.groupName : m.groupId,
          members:
            typeof m.groupId === "object" ? m.groupId.members || [] : [],
        })),
    [milestones, phase]
  );

  const selectedGroup = currentPhaseGroups.find(
    (g) => g.groupId === selectedGroupId
  );

  const submitMark = async (studentId) => {
    const value = Number(marks[studentId]);
    if (Number.isNaN(value)) return;
    try {
      setLoading(true);
      const res = await axios.post(
        `${apiURL}/grading/coordinator`,
        { groupId: selectedGroupId, phase, studentId, marks: value },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        await loadAllGrades();
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data || "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Check if coordinator marks exist for this student & phase
  const hasExistingCoordinatorGrade = (studentId) =>
    allGrades.some(
      (g) =>
        g.studentId?._id === studentId &&
        g.phase === phase &&
        g.coordinatorMarks !== 0
    );

  // Filtered grades
  const filteredRecordedGrades = useMemo(() => {
    const termGroup = searchGroupName.toLowerCase();
    const termMember = searchMemberName.toLowerCase();

    return allGrades.filter((g) => {
      const gGroupName =
        g.groupId && typeof g.groupId === "object"
          ? g.groupId.groupName.toLowerCase()
          : "";
      const gStudentName =
        g.studentId && typeof g.studentId === "object"
          ? g.studentId.username.toLowerCase()
          : "";
      const gPhase = g.phase || "";

      const groupMatch = gGroupName.includes(termGroup);
      const memberMatch = gStudentName.includes(termMember);
      const phaseMatch = searchPhase === "all" ? true : gPhase === searchPhase;

      return groupMatch && memberMatch && phaseMatch;
    });
  }, [allGrades, searchGroupName, searchPhase, searchMemberName]);

  return (
    <div className="min-h-screen mt-16">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="coordinator" />
        <main className="flex flex-col gap-6 w-full">
          {/* Header */}
          <Card className="w-full max-w-5xl mx-auto text-center p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Coordinator{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Grading
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Select a phase and group to record coordinator marks and review
              grades.
            </p>
          </Card>

          {/* Filters */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phase */}
              <div>
                <label className="text-sm block mb-1 ">Phase</label>
                <Select value={phase} onValueChange={setPhase}>
                  <SelectTrigger className="border border-gray-400 dark:border-gray-700">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Progress">Progress</SelectItem>
                    <SelectItem value="Defence">Defence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group Searchable */}
              <div>
                <label className="text-sm block mb-1">Group</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between border border-gray-400 dark:border-gray-700"
                    >
                      {selectedGroupId
                        ? currentPhaseGroups.find(
                          (g) => g.groupId === selectedGroupId
                        )?.groupName
                        : "Select group..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search group..." />
                      <CommandList>
                        <CommandEmpty>No group found.</CommandEmpty>
                        <CommandGroup>
                          {currentPhaseGroups.map((g) => (
                            <CommandItem
                              key={g.groupId}
                              value={g.groupId}
                              onSelect={() => setSelectedGroupId(g.groupId)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedGroupId === g.groupId
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {g.groupName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Refresh */}
              <div className="flex items-end">
                <Button
                  onClick={loadAllGrades}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh Grades
                </Button>
              </div>
            </div>
          </Card>

          {/* Enter Marks */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl space-y-4">
            <h3 className="text-lg font-semibold">
              {selectedGroup
                ? `Enter Marks for: ${selectedGroup.groupName}`
                : "Enter Marks (0–80)"}
            </h3>

            {!selectedGroup ? (
              <p className="text-center text-sm text-gray-500">
                Select a group to start grading.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <Table className="min-w-full text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGroup?.members?.length > 0 ? (
                      selectedGroup.members.map((member) => {
                        const hasGrade =
                          hasExistingCoordinatorGrade(member._id);
                        return (
                          <TableRow key={member._id}>
                            <TableCell>{member.username}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={80}
                                value={marks[member._id] ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "") {
                                    setMarks({
                                      ...marks,
                                      [member._id]: "",
                                    });
                                    return;
                                  }
                                  const num = Number(value);
                                  if (num >= 0 && num <= 80) {
                                    setMarks({
                                      ...marks,
                                      [member._id]: num,
                                    });
                                  }
                                }}
                                placeholder="0–80"
                                className="w-20 text-center border border-gray-400 dark:border-gray-700"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                onClick={() => submitMark(member._id)}
                                disabled={loading || marks[member._id] === ""}
                              >
                                {loading ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    
                                  </>
                                ) : hasGrade ? (
                                  "Edit"
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-gray-500"
                        >
                          No members found in this group.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          {/* Recorded Grades */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl space-y-4">
            <h3 className="text-lg font-semibold mb-2">Recorded Grades</h3>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search group name..."
                  value={searchGroupName}
                  onChange={(e) => setSearchGroupName(e.target.value)}
                  className="pl-10 border border-gray-400 dark:border-gray-700"
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search member name..."
                  value={searchMemberName}
                  onChange={(e) => setSearchMemberName(e.target.value)}
                  className="pl-10 border border-gray-400 dark:border-gray-700"
                />
              </div>

              <div>
                <Select value={searchPhase} onValueChange={setSearchPhase}>
                  <SelectTrigger className={"border border-gray-400 dark:border-gray-700"}>
                    <SelectValue placeholder="Filter by phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    <SelectItem value="Progress">Progress</SelectItem>
                    <SelectItem value="Defence">Defence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <Table className="min-w-full text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Group</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecordedGrades.map((g) => {
                    const gGroupName =
                      typeof g.groupId === "object"
                        ? g.groupId.groupName
                        : g.groupId;
                    const gStudentName =
                      typeof g.studentId === "object"
                        ? g.studentId.username
                        : g.studentId;
                    return (
                      <TableRow key={g._id}>
                        <TableCell>{gGroupName}</TableCell>
                        <TableCell>{gStudentName}</TableCell>
                        <TableCell>{g.phase}</TableCell>
                        <TableCell>{g.supervisorMarks ?? 0}</TableCell>
                        <TableCell>{g.coordinatorMarks ?? 0}</TableCell>
                        <TableCell>
                          {(g.supervisorMarks || 0) +
                            (g.coordinatorMarks || 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default CoordinatorGrading;
