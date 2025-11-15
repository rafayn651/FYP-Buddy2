import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    roomKey: {
      type: String,
      required: true,
      index: true,
    },
    chatType: {
      type: String,
      enum: ["individual", "group", "public"],
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    messageType: {
      type: String,
      enum: ["text", "image", "document", "contact"],
      default: "text",
    },
    attachments: [
      {
        url: String,
        publicId: String,
        fileName: String,
        fileType: String,
        fileSize: Number,
      },
    ],
    contactData: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      username: String,
      email: String,
      phone: String,
    },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    meta: {
      scope: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

