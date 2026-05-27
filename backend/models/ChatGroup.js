import mongoose from "mongoose";

const chatGroupSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      unique: true, // One chat group per class
    },
    blockedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Index for fast lookups by classId
chatGroupSchema.index({ classId: 1 });

const ChatGroup = mongoose.model("ChatGroup", chatGroupSchema);
export default ChatGroup;
