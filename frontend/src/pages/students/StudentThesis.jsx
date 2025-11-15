import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Eye,
  Search,
  Filter,
  AlertCircle,
  GithubIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function StudentThesis() {
  const { user } = useSelector((store) => store.auth);
  const { group } = useSelector((store) => store.group);
  const navigate = useNavigate();

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(false);
  const [thesisFiles, setThesisFiles] = useState([]);
  const [viewLoadingMap, setViewLoadingMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("All");

  // Fetch all thesis files from GitHub
  const fetchThesisFiles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/thesis/all-github-files`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      if (res.data.success) {
        setThesisFiles(res.data.files || []);
      } else {
        setThesisFiles([]);
        toast.error("Failed to fetch thesis files");
      }
    } catch (err) {
      console.error("Error fetching thesis files:", err);
      toast.error("Error loading thesis files");
      setThesisFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThesisFiles();
  }, [group]);

  // Handle file viewing (nested paths fixed)
  const handleViewFile = async (filePath) => {
    setViewLoadingMap((prev) => ({ ...prev, [filePath]: true }));
    try {
      const res = await axios.get(
        `${apiURL}/thesis/see-github-file/${encodeURIComponent(filePath)}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          responseType: 'blob',
          withCredentials: true,
        }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Error viewing file:", err);
      toast.error("Error opening file");
    } finally {
      setViewLoadingMap((prev) => ({ ...prev, [filePath]: false }));
    }
  };

  // Filter files based on search and phase
  const filteredFiles = thesisFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = phaseFilter === "All" || file.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  // Sort files by phase then name
  const sortedFiles = [...filteredFiles].sort(
    (a, b) => a.phase.localeCompare(b.phase) || a.name.localeCompare(b.name)
  );

  // Get unique phases for filter
  const uniquePhases = [...new Set(thesisFiles.map((file) => file.phase))];

  return (
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="student" />

        <main className="flex flex-col gap-5 w-full">
          {/* Header */}
          <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-8">
            <h1 className="text-4xl font-extrabold mb-2">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Thesis
              </span>{" "}
              Section
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Browse and view all submitted thesis documents from GitHub repository
            </p>
          </Card>

          {/* Files Table */}
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Previous FYP Documents
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total files: {sortedFiles.length}
                </p>
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by file name."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border border-gray-400 dark:border-gray-700 rounded-md h-10 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {loading ? (
              <div className="w-full max-w-6xl mx-auto p-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Loading thesis files...
                </p>
              </div>
            ) : sortedFiles.length === 0 ? (
              <div className="w-full max-w-6xl mx-auto p-10 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {thesisFiles.length === 0
                    ? "No thesis files found in the repository."
                    : "No files match your current filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFiles.map((file) => (
                      <TableRow
                        key={file.path}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-900/40"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {file.name}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewFile(file.path)}
                              className="flex items-center gap-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-20 justify-center"
                            >
                              {viewLoadingMap[file.path] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-purple-600"></div>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  View
                                </>
                              )}
                            </Button>

                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}