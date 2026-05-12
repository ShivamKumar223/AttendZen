import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    records: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["present", "absent", "pending"],
          default: "pending",
        },
      },
    ],
    isFinalized: {
      type: Boolean,
      default: false, // This will be true once the teacher hits 'Submit' in the 2-step process
    },
  },
  { timestamps: true }
);

// Ensure a single class can only have one attendance record per day
attendanceSchema.index({ class: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
