import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, X, Loader2, AlertTriangle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { setGroup } from "@/redux/groupSlice";

const InvitationsList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});


  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken")
  const dispatch = useDispatch();


  // 🟣 Fetch Invitations
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiURL}/group/invitations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setInvitations(res.data.invitations || []);
      } catch (err) {
        console.error("Error fetching invitations:", err);
        toast.error(err.response?.data?.message || "Unable to load invitations");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [accessToken]);

  // 🟢 Accept / Reject Response Handler
  const handleResponse = async (invitationId, action) => {
    setProcessing((prev) => ({ ...prev, [invitationId]: action }));
    try {
      const res = await axios.post(`${apiURL}/group/respond/${invitationId}`, { action },
        {
          headers:
          {
            Authorization: `Bearer ${accessToken}`
          }, withCredentials: true
        }
      );

      if (res.data.success) {
        setInvitations((prev) =>
          prev.filter((inv) => inv._id !== invitationId)
        );
        if(res.data.joinedGroup){
          dispatch(setGroup(res.data.joinedGroup))
          toast.success(res.data.message)
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process invitation");
    } finally {
      setProcessing((prev) => {
        const newState = { ...prev };
        delete newState[invitationId];
        return newState;
      });
    }
  };
  const noInvitations = !invitations || invitations.length === 0
  return (
    noInvitations ?
      <Card className="p-8 border transition-colors duration-300 bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full mb-4 bg-gray-100 dark:bg-gray-800">
            <Mail className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You do not have any group invitations at the moment.
          </p>
        </div>
      </Card>
      :
      <div className="space-y-4 transition-colors duration-300">
        {invitations.map((invitation) => {
          const invitationId = invitation._id || invitation.id;
          const isProcessing = !!processing[invitationId];
          const action = processing[invitationId];

          return (
            <Card
              key={invitationId}
              className="p-5 border transition-colors duration-300 bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg mt-3 bg-purple-100 dark:bg-purple-900/30">
                    <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>

                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {invitation.groupId.groupName || "Group Invitation"}
                      </h3>
                      <Badge
                        variant="outline"
                        className="border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
                      >
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Invited by{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {invitation.senderId.username || "Unknown"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {invitation.groupId?.members?.length || 0} / 3 members
                    </p>
                  </div>

                </div>

                {/* Right: Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleResponse(invitationId, "accept")}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isProcessing && action === "accept" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResponse(invitationId, "reject")}
                    disabled={isProcessing}
                    className="border text-red-600 hover:bg-red-50 transition-colors duration-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    {isProcessing && action === "reject" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
  );
};

export default InvitationsList;
