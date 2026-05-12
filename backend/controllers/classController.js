import Class from "../models/Class.js";
import crypto from "crypto";

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private
export const createClass = async (req, res) => {
  try {
    const { className, subject } = req.body;

    // Generate a unique short code
    const classCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const newClass = await Class.create({
      className,
      subject,
      classCode,
      teacher: req.user.id,
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's classes (Teaching and Enrolled)
// @route   GET /api/classes
// @access  Private
export const getUserClasses = async (req, res) => {
  try {
    const teachingClasses = await Class.find({ teacher: req.user.id })
      .populate("teacher", "name email")
      .populate("students", "name rollNo"); // We don't have rollNo in User, but we can just use name for now

    const enrolledClasses = await Class.find({ students: req.user.id })
      .populate("teacher", "name email")
      .populate("students", "name email");

    res.json({ teaching: teachingClasses, enrolled: enrolledClasses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search for a class by code
// @route   GET /api/classes/search?code=XYZ
// @access  Private
export const searchClass = async (req, res) => {
  try {
    const { code } = req.query;
    const foundClass = await Class.findOne({ classCode: code }).populate("teacher", "name email");

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(foundClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
