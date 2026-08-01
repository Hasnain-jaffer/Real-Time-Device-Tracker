// server/src/controllers/auth.controller.js
import User from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
} from '../utils/token.util.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/mailer.service.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateRandomToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      passwordHash,
      verificationToken,
      verificationTokenExpires,
    });

   const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (mailErr) {
      // Account is created either way — don't fail the whole request over email delivery.
      console.error('[register] Verification email failed to send:', mailErr.message);
    }

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        themePreference: user.themePreference,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }

    const newAccessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (token) {
      await User.updateOne({ refreshTokens: token }, { $pull: { refreshTokens: token } });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.passwordHash = await hashPassword(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshTokens = [];
    await user.save();

    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (err) {
    next(err);
  }
}