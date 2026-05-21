import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "supersecretkey", {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry,
    });

    if (user) {
      // Send Email OTP
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 16px; background-color: #0b0f1e; color: #f0f4ff; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">✦ AttendZen</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Modern Attendance Tracking System</p>
          </div>
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;"></div>
          <p style="font-size: 16px; line-height: 1.5; color: #e2e8f0;">Hello <strong style="color: #6366f1;">${name}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">Thank you for registering on AttendZen! To complete your sign up and verify your email address, please use the 6-digit verification code below:</p>
          
          <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%); border: 1px solid rgba(99, 102, 241, 0.25); padding: 20px; text-align: center; border-radius: 12px; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="font-size: 13px; line-height: 1.5; color: #ef4444; text-align: center; background: rgba(239, 68, 68, 0.08); padding: 10px; border-radius: 8px; border: 1px dashed rgba(239, 68, 68, 0.2);">
            ⚠️ This code is valid for exactly <strong>10 minutes</strong>.
          </p>
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); margin: 30px 0 20px 0;"></div>
          <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.4;">
            If you did not request this verification code, please ignore this email.
          </p>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: "✦ Verify your AttendZen Account",
        html: emailHtml,
        text: `Welcome to AttendZen! Please verify your email. Your 6-digit verification code is: ${otp}. It is valid for 10 minutes.`
      });

      res.status(201).json({
        success: true,
        message: "Registration successful. Verification OTP sent to your email.",
        email: user.email,
        needsVerification: true,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Check if user is verified
      if (!user.isVerified) {
        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send Email
        const emailHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 16px; background-color: #0b0f1e; color: #f0f4ff; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">✦ AttendZen</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Modern Attendance Tracking System</p>
            </div>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;"></div>
            <p style="font-size: 16px; line-height: 1.5; color: #e2e8f0;">Hello <strong style="color: #6366f1;">${user.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">It looks like you haven't verified your email address yet. Please use the verification code below to activate your account:</p>
            
            <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%); border: 1px solid rgba(99, 102, 241, 0.25); padding: 20px; text-align: center; border-radius: 12px; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; font-family: monospace;">${otp}</span>
            </div>
            
            <p style="font-size: 13px; line-height: 1.5; color: #ef4444; text-align: center; background: rgba(239, 68, 68, 0.08); padding: 10px; border-radius: 8px; border: 1px dashed rgba(239, 68, 68, 0.2);">
              ⚠️ This code is valid for exactly <strong>10 minutes</strong>.
            </p>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.08); margin: 30px 0 20px 0;"></div>
            <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.4;">
              If you did not request this verification code, please ignore this email.
            </p>
          </div>
        `;

        await sendEmail({
          to: user.email,
          subject: "✦ Verify your AttendZen Account",
          html: emailHtml,
          text: `Your email is not verified. Please verify using this code: ${otp}. It is valid for 10 minutes.`
        });

        return res.status(403).json({
          emailNotVerified: true,
          email: user.email,
          message: "Email is not verified. A verification OTP has been sent to your email."
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    if (user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 16px; background-color: #0b0f1e; color: #f0f4ff; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">✦ AttendZen</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Modern Attendance Tracking System</p>
        </div>
        <div style="border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;"></div>
        <p style="font-size: 16px; line-height: 1.5; color: #e2e8f0;">Hello <strong style="color: #6366f1;">${user.name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">As requested, here is your new 6-digit verification code to complete your sign up:</p>
        
        <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%); border: 1px solid rgba(99, 102, 241, 0.25); padding: 20px; text-align: center; border-radius: 12px; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; font-family: monospace;">${otp}</span>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: #ef4444; text-align: center; background: rgba(239, 68, 68, 0.08); padding: 10px; border-radius: 8px; border: 1px dashed rgba(239, 68, 68, 0.2);">
          ⚠️ This code is valid for exactly <strong>10 minutes</strong>.
        </p>
        <div style="border-bottom: 1px solid rgba(255,255,255,0.08); margin: 30px 0 20px 0;"></div>
        <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.4;">
          If you did not request this verification code, please ignore this email.
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "✦ Resent: Verify your AttendZen Account",
      html: emailHtml,
      text: `Your new 6-digit verification code is: ${otp}. It is valid for 10 minutes.`
    });

    res.json({ success: true, message: "Verification OTP resent successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request forgot password OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email address" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid rgba(236, 72, 153, 0.15); border-radius: 16px; background-color: #0b0f1e; color: #f0f4ff; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #ec4899; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">✦ AttendZen</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Password Recovery System</p>
        </div>
        <div style="border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;"></div>
        <p style="font-size: 16px; line-height: 1.5; color: #e2e8f0;">Hello <strong style="color: #ec4899;">${user.name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">We received a request to reset your AttendZen account password. Please use the following 6-digit recovery code to complete the process:</p>
        
        <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%); border: 1px solid rgba(236, 72, 153, 0.25); padding: 20px; text-align: center; border-radius: 12px; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f472b6; font-family: monospace;">${otp}</span>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: #ef4444; text-align: center; background: rgba(239, 68, 68, 0.08); padding: 10px; border-radius: 8px; border: 1px dashed rgba(239, 68, 68, 0.2);">
          ⚠️ This code is valid for exactly <strong>10 minutes</strong>.
        </p>
        <div style="border-bottom: 1px solid rgba(255,255,255,0.08); margin: 30px 0 20px 0;"></div>
        <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.4;">
          If you did not request a password reset, please ignore this email or reach out to support if you have concerns. Your password remains safe.
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "✦ Reset your AttendZen Password",
      html: emailHtml,
      text: `You requested a password reset. Your 6-digit OTP code is: ${otp}. It is valid for 10 minutes.`
    });

    res.json({ success: true, message: "Password reset OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP & reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.resetPasswordOtp !== otp || new Date() > user.resetPasswordOtpExpiry) {
      return res.status(400).json({ message: "Invalid or expired reset OTP." });
    }

    // Encrypt the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    
    // Resetting password verifies their ownership, let's auto-verify email if not done
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    // Clear reset OTP fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;

    await user.save();

    res.json({ success: true, message: "Password reset successfully. You can now login with your new password." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      // Validate uniqueness if email changed
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.mobile = req.body.mobile || user.mobile;

      if (req.body.password) {
        if (req.body.password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        isVerified: updatedUser.isVerified,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
