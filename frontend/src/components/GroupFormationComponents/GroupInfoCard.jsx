import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, GraduationCap } from "lucide-react";
import userImg from "@/assets/user.jpg"

const GroupInfoCard = () => {
  const { group } = useSelector((store) => store.group)
  const { user } = useSelector((store) => store.auth)

  const isLeader = group?.leaderId._id === user._id;

  return (
    <Card className="p-6 border transition-colors duration-300 bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{group?.groupName || "My Group"}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {group?.members?.length || 0} / 3 Members
          </p>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Group Members
          </h3>
          <div className="space-y-3">
            {group?.members?.map((member) => {
              const memberId = member._id;
              const memberName =
                member.username || "Unknown Member";
              const memberEmail = member.email || "";
              const memberPic = member.profilePic
              const isGroupLeader =
                (group.leaderId._id) === memberId;

              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between p-3 rounded-lg transition-colors duration-300 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-indigo-500 text-white flex items-center justify-center">
                      {memberPic ? (
                        <AvatarImage src={memberPic} alt={memberName} />
                      ) : (
                        <span className="text-sm font-medium">
                          {memberName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{memberName}</p>
                      {memberEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {memberEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {isGroupLeader && (
                    <Badge className="flex items-center gap-1 bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700">
                      <Crown className="w-3 h-3" />
                      Admin
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Supervisor
          </h3>
          <div className="space-y-3">
            {group?.supervisor && (
              <div
                className="flex items-center justify-between p-3 rounded-lg transition-colors duration-300 bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-indigo-500 text-white flex items-center justify-center">
                    {group?.supervisor?.profilePic ? (
                      <AvatarImage src={group?.supervisor?.profilePic} alt={"img"} />
                    ) : (
                      <span className="text-sm font-medium">
                        {memberName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{group?.supervisor?.username}</p>
                  </div>
                </div>
                <Badge className="flex items-center gap-1 bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700">
                  <GraduationCap className="w-3 h-3" />
                  Supervisor
                </Badge>
              </div>
            )}
          </div>

        </div>
      </div>
    </Card>
  );
};

export default GroupInfoCard;
