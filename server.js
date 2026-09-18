/**
 * Roommate Finder - College 3rd Semester Project
 * File: server.js
 * Description: Express backend server with MySQL authentication, profile, and roommate search & matching
 */

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { pool, initDatabase } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "roommate_finder_secret_key_2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);

// Serve static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Helper: Email format validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/* ==========================================================================
   AUTHENTICATION API ROUTES (PHASE 2)
   ========================================================================== */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student user
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      confirm_password,
      age,
      gender,
      phone
    } = req.body;

    // 1. Required fields validation
    if (!full_name || !email || !password || !confirm_password || age === undefined || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required. Please complete the registration form."
      });
    }

    const trimmedName = full_name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const parsedAge = parseInt(age, 10);

    // 2. Name validation
    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters long."
      });
    }

    // 3. Email format validation
    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address (e.g., student@college.edu)."
      });
    }

    // 4. Password validation & confirmation match
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match. Please re-enter your password."
      });
    }

    // 5. Age validation (Reasonable student range: 16 to 99)
    if (isNaN(parsedAge) || parsedAge < 16 || parsedAge > 99) {
      return res.status(400).json({
        success: false,
        message: "Please enter a reasonable age between 16 and 99."
      });
    }

    // 6. Phone validation
    if (trimmedPhone.length < 7) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number."
      });
    }

    // 7. Check if email already exists (Parameterized query)
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [trimmedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please log in or use a different email."
      });
    }

    // 8. Hash password securely using bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 9. Insert new user into MySQL (Parameterized prepared statement)
    const insertQuery = `
      INSERT INTO users (full_name, email, password_hash, age, gender, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(insertQuery, [
      trimmedName,
      trimmedEmail,
      passwordHash,
      parsedAge,
      gender,
      trimmedPhone
    ]);

    return res.status(201).json({
      success: true,
      message: "Registration successful! You can now log in.",
      userId: result.insertId
    });
  } catch (error) {
    console.error("[Register Error]", error);
    return res.status(500).json({
      success: false,
      message: "Database error during registration. Please make sure MySQL is running."
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate student and start session
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter both email and password."
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Query user by email (Parameterized query)
    const [rows] = await pool.execute(
      "SELECT id, full_name, email, password_hash, age, gender, phone FROM users WHERE email = ? LIMIT 1",
      [trimmedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = rows[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Store user session
    req.session.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      phone: user.phone
    };

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: req.session.user
    });
  } catch (error) {
    console.error("[Login Error]", error);
    return res.status(500).json({
      success: false,
      message: "Database error during login. Please make sure MySQL is running."
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in student info from session
 */
app.get("/api/auth/me", (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({
      success: true,
      user: req.session.user
    });
  }

  return res.status(401).json({
    success: false,
    message: "Not authenticated"
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Destroy session and log user out
 */
app.post("/api/auth/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Could not log out. Please try again."
        });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({
        success: true,
        message: "Logged out successfully."
      });
    });
  } else {
    return res.status(200).json({
      success: true,
      message: "Already logged out."
    });
  }
});

/* ==========================================================================
   STUDENT PROFILE & ROOMMATE PREFERENCES API ROUTES (PHASE 3)
   ========================================================================== */

/**
 * @route   GET /api/profile/me
 * @desc    Get the logged-in student's full profile & roommate requirements
 */
app.get("/api/profile/me", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your profile."
      });
    }

    const userId = req.session.user.id;

    // Fetch user personal data
    const [userRows] = await pool.execute(
      "SELECT id, full_name, email, age, gender, phone FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found."
      });
    }

    const personal = userRows[0];

    // Fetch roommate preferences from student_profiles
    const [profileRows] = await pool.execute(
      "SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1",
      [userId]
    );

    const hasProfile = profileRows.length > 0;
    const preferences = hasProfile ? profileRows[0] : null;

    return res.status(200).json({
      success: true,
      personal,
      preferences,
      hasProfile
    });
  } catch (error) {
    console.error("[Get Profile Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student profile."
    });
  }
});

/**
 * @route   POST /api/profile
 * @desc    Create or update logged-in student's profile & roommate preferences
 */
app.post("/api/profile", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Please log in to save your profile."
      });
    }

    const userId = req.session.user.id;

    const {
      full_name,
      age,
      gender,
      phone,
      preferred_location,
      min_budget,
      max_budget,
      food_preference,
      smoking_preference,
      study_habit,
      sleeping_schedule,
      cleanliness_preference,
      preferred_roommates,
      about_me
    } = req.body;

    // 1. Validate Required Fields
    if (!preferred_location || min_budget === undefined || max_budget === undefined) {
      return res.status(400).json({
        success: false,
        message: "Preferred location, minimum budget, and maximum budget are required."
      });
    }

    const parsedMinBudget = parseInt(min_budget, 10);
    const parsedMaxBudget = parseInt(max_budget, 10);
    const parsedRoommates = parseInt(preferred_roommates || 1, 10);

    // 2. Budget validation
    if (isNaN(parsedMinBudget) || parsedMinBudget < 0) {
      return res.status(400).json({
        success: false,
        message: "Minimum budget must be a positive number."
      });
    }

    if (isNaN(parsedMaxBudget) || parsedMaxBudget < 0) {
      return res.status(400).json({
        success: false,
        message: "Maximum budget must be a positive number."
      });
    }

    if (parsedMinBudget > parsedMaxBudget) {
      return res.status(400).json({
        success: false,
        message: "Minimum budget cannot exceed maximum budget."
      });
    }

    // 3. Option lists validation
    const validFood = ["Vegetarian", "Non-Vegetarian", "No Preference"];
    const foodVal = validFood.includes(food_preference) ? food_preference : "No Preference";

    const validSmoking = ["Non-Smoker", "Smoker", "No Preference"];
    const smokingVal = validSmoking.includes(smoking_preference) ? smoking_preference : "Non-Smoker";

    const validStudy = ["Quiet", "Moderate", "Flexible"];
    const studyVal = validStudy.includes(study_habit) ? study_habit : "Moderate";

    const validSleep = ["Early Sleeper", "Night Owl", "Flexible"];
    const sleepVal = validSleep.includes(sleeping_schedule) ? sleeping_schedule : "Flexible";

    const validCleanliness = ["High", "Moderate", "Flexible"];
    const cleanlinessVal = validCleanliness.includes(cleanliness_preference) ? cleanliness_preference : "Moderate";

    // 4. Update personal info in `users` table if provided
    if (full_name && age && gender && phone) {
      const trimmedName = full_name.trim();
      const parsedAge = parseInt(age, 10);
      const trimmedPhone = phone.trim();

      if (trimmedName.length >= 2 && !isNaN(parsedAge) && parsedAge >= 16 && trimmedPhone.length >= 7) {
        await pool.execute(
          "UPDATE users SET full_name = ?, age = ?, gender = ?, phone = ? WHERE id = ?",
          [trimmedName, parsedAge, gender, trimmedPhone, userId]
        );

        // Refresh session user
        req.session.user.full_name = trimmedName;
        req.session.user.age = parsedAge;
        req.session.user.gender = gender;
        req.session.user.phone = trimmedPhone;
      }
    }

    // 5. Check if profile already exists for this user
    const [existingProfile] = await pool.execute(
      "SELECT id FROM student_profiles WHERE user_id = ? LIMIT 1",
      [userId]
    );

    const safeAboutMe = about_me ? about_me.trim() : "";
    const safeLocation = preferred_location.trim();

    if (existingProfile.length > 0) {
      const updateQuery = `
        UPDATE student_profiles SET
          preferred_location = ?,
          min_budget = ?,
          max_budget = ?,
          food_preference = ?,
          smoking_preference = ?,
          study_habit = ?,
          sleeping_schedule = ?,
          cleanliness_preference = ?,
          preferred_roommates = ?,
          about_me = ?
        WHERE user_id = ?
      `;

      await pool.execute(updateQuery, [
        safeLocation,
        parsedMinBudget,
        parsedMaxBudget,
        foodVal,
        smokingVal,
        studyVal,
        sleepVal,
        cleanlinessVal,
        parsedRoommates,
        safeAboutMe,
        userId
      ]);
    } else {
      const insertQuery = `
        INSERT INTO student_profiles (
          user_id,
          preferred_location,
          min_budget,
          max_budget,
          food_preference,
          smoking_preference,
          study_habit,
          sleeping_schedule,
          cleanliness_preference,
          preferred_roommates,
          about_me
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.execute(insertQuery, [
        userId,
        safeLocation,
        parsedMinBudget,
        parsedMaxBudget,
        foodVal,
        smokingVal,
        studyVal,
        sleepVal,
        cleanlinessVal,
        parsedRoommates,
        safeAboutMe
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Roommate profile saved successfully!"
    });
  } catch (error) {
    console.error("[Save Profile Error]", error);
    return res.status(500).json({
      success: false,
      message: "Database error while saving profile."
    });
  }
});

/* ==========================================================================
   ROOMMATE SEARCH & MATCHING ALGORITHM (PHASE 4)
   ========================================================================== */

/**
 * Roommate Finder Compatibility Algorithm (Deterministic 100-Point Rubric)
 * Note: This is a simple, explainable rule-based preference compatibility score.
 * It is NOT an AI prediction.
 *
 * Scoring Rubric:
 *  1. Location Match: 20 points
 *  2. Budget Compatibility: 20 points
 *  3. Food Preference: 15 points
 *  4. Study Habit: 15 points
 *  5. Sleeping Schedule: 10 points
 *  6. Smoking Preference: 10 points
 *  7. Cleanliness Preference: 10 points
 *  --------------------------------------
 *  Total Possible: 100 points
 */
function calculateCompatibility(userPref, candidate) {
  if (!userPref) {
    // If logged-in student has not set preferences yet, provide a neutral baseline score
    return 65;
  }

  let score = 0;

  // 1. Location Match (20 pts)
  const uLoc = (userPref.preferred_location || "").trim().toLowerCase();
  const cLoc = (candidate.preferred_location || "").trim().toLowerCase();
  if (uLoc && cLoc && (uLoc === cLoc || uLoc.includes(cLoc) || cLoc.includes(uLoc))) {
    score += 20;
  } else if (!uLoc || !cLoc) {
    score += 10;
  }

  // 2. Budget Compatibility (20 pts)
  // Overlapping budget range: max(uMin, cMin) <= min(uMax, cMax)
  const uMin = Number(userPref.min_budget) || 0;
  const uMax = Number(userPref.max_budget) || 15000;
  const cMin = Number(candidate.min_budget) || 0;
  const cMax = Number(candidate.max_budget) || 15000;

  const overlap = Math.max(uMin, cMin) <= Math.min(uMax, cMax);
  if (overlap) {
    score += 20;
  } else {
    // Within reasonable 1500 range
    const diff = Math.min(Math.abs(uMax - cMin), Math.abs(cMax - uMin));
    if (diff <= 1500) {
      score += 10;
    }
  }

  // 3. Food Preference Alignment (15 pts)
  const uFood = userPref.food_preference || "No Preference";
  const cFood = candidate.food_preference || "No Preference";
  if (uFood === cFood || uFood === "No Preference" || cFood === "No Preference") {
    score += 15;
  }

  // 4. Study Habit Alignment (15 pts)
  const uStudy = userPref.study_habit || "Moderate";
  const cStudy = candidate.study_habit || "Moderate";
  if (uStudy === cStudy || uStudy === "Flexible" || cStudy === "Flexible") {
    score += 15;
  } else if (
    (uStudy === "Quiet" && cStudy === "Moderate") ||
    (uStudy === "Moderate" && cStudy === "Quiet")
  ) {
    score += 10;
  } else {
    score += 5;
  }

  // 5. Sleeping Schedule Alignment (10 pts)
  const uSleep = userPref.sleeping_schedule || "Flexible";
  const cSleep = candidate.sleeping_schedule || "Flexible";
  if (uSleep === cSleep || uSleep === "Flexible" || cSleep === "Flexible") {
    score += 10;
  }

  // 6. Smoking Preference Alignment (10 pts)
  const uSmoke = userPref.smoking_preference || "Non-Smoker";
  const cSmoke = candidate.smoking_preference || "Non-Smoker";
  if (uSmoke === cSmoke || uSmoke === "No Preference" || cSmoke === "No Preference") {
    score += 10;
  }

  // 7. Cleanliness Preference Alignment (10 pts)
  const uClean = userPref.cleanliness_preference || "Moderate";
  const cClean = candidate.cleanliness_preference || "Moderate";
  if (uClean === cClean || uClean === "Flexible" || cClean === "Flexible") {
    score += 10;
  } else if (
    (uClean === "High" && cClean === "Moderate") ||
    (uClean === "Moderate" && cClean === "High")
  ) {
    score += 5;
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * @route   GET /api/roommates
 * @desc    Search and filter roommate profiles from MySQL with compatibility scoring
 */
app.get("/api/roommates", async (req, res) => {
  try {
    const currentUserId = req.session && req.session.user ? req.session.user.id : 0;

    // Fetch logged-in user's preferences to compute personalized compatibility
    let currentUserPref = null;
    if (currentUserId > 0) {
      const [uProfileRows] = await pool.execute(
        "SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1",
        [currentUserId]
      );
      if (uProfileRows.length > 0) {
        currentUserPref = uProfileRows[0];
      }
    }

    // Extract search query filters
    const {
      location,
      min_budget,
      max_budget,
      food_preference,
      gender,
      smoking_preference,
      study_habit,
      sleeping_schedule
    } = req.query;

    // Fetch candidate profiles from MySQL (excluding current user, and omitting passwords)
    const [candidates] = await pool.execute(
      `SELECT
        u.id,
        u.full_name,
        u.age,
        u.gender,
        u.email,
        u.phone,
        p.preferred_location,
        p.min_budget,
        p.max_budget,
        p.food_preference,
        p.smoking_preference,
        p.study_habit,
        p.sleeping_schedule,
        p.cleanliness_preference,
        p.preferred_roommates,
        p.about_me
      FROM users u
      JOIN student_profiles p ON u.id = p.user_id
      WHERE u.id != ?`,
      [currentUserId]
    );

    // Filter candidates in memory based on query params
    const filtered = candidates.filter((item) => {
      // 1. Location filter
      if (location && location.trim()) {
        const qLoc = location.trim().toLowerCase();
        const candLoc = (item.preferred_location || "").toLowerCase();
        if (!candLoc.includes(qLoc)) return false;
      }

      // 2. Minimum budget filter (candidate's max_budget must be >= search min_budget)
      if (min_budget && !isNaN(parseInt(min_budget, 10))) {
        const searchMin = parseInt(min_budget, 10);
        if (item.max_budget < searchMin) return false;
      }

      // 3. Maximum budget filter (candidate's min_budget must be <= search max_budget)
      if (max_budget && !isNaN(parseInt(max_budget, 10))) {
        const searchMax = parseInt(max_budget, 10);
        if (item.min_budget > searchMax) return false;
      }

      // 4. Food Preference filter
      if (food_preference && food_preference !== "all" && food_preference !== "Any") {
        if (item.food_preference !== food_preference && item.food_preference !== "No Preference") {
          return false;
        }
      }

      // 5. Gender filter
      if (gender && gender !== "all" && gender !== "Any") {
        if (item.gender !== gender) return false;
      }

      // 6. Smoking Preference filter
      if (smoking_preference && smoking_preference !== "all" && smoking_preference !== "Any") {
        if (item.smoking_preference !== smoking_preference && item.smoking_preference !== "No Preference") {
          return false;
        }
      }

      // 7. Study Habit filter
      if (study_habit && study_habit !== "all" && study_habit !== "Any") {
        if (item.study_habit !== study_habit && item.study_habit !== "Flexible") {
          return false;
        }
      }

      // 8. Sleeping Schedule filter
      if (sleeping_schedule && sleeping_schedule !== "all" && sleeping_schedule !== "Any") {
        if (item.sleeping_schedule !== sleeping_schedule && item.sleeping_schedule !== "Flexible") {
          return false;
        }
      }

      return true;
    });

    // Compute compatibility score for each candidate
    const results = filtered.map((cand) => {
      const compatibility = calculateCompatibility(currentUserPref, cand);
      return {
        ...cand,
        compatibility_score: compatibility
      };
    });

    // Sort descending by compatibility score
    results.sort((a, b) => b.compatibility_score - a.compatibility_score);

    return res.status(200).json({
      success: true,
      count: results.length,
      roommates: results
    });
  } catch (error) {
    console.error("[Search Error]", error);
    return res.status(500).json({
      success: false,
      message: "Database error during roommate search."
    });
  }
});

/**
 * @route   GET /api/roommates/:id
 * @desc    Get another roommate's public profile details (Sensitive fields strictly omitted)
 */
app.get("/api/roommates/:id", async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roommate ID."
      });
    }

    const [rows] = await pool.execute(
      `SELECT
        u.id,
        u.full_name,
        u.age,
        u.gender,
        u.email,
        u.phone,
        p.preferred_location,
        p.min_budget,
        p.max_budget,
        p.food_preference,
        p.smoking_preference,
        p.study_habit,
        p.sleeping_schedule,
        p.cleanliness_preference,
        p.preferred_roommates,
        p.about_me,
        p.created_at
      FROM users u
      JOIN student_profiles p ON u.id = p.user_id
      WHERE u.id = ? LIMIT 1`,
      [targetId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Roommate profile not found."
      });
    }

    const candidate = rows[0];

    // Compute compatibility if current user is logged in
    let compatibilityScore = 65;
    if (req.session && req.session.user) {
      const [userRows] = await pool.execute(
        "SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1",
        [req.session.user.id]
      );
      if (userRows.length > 0) {
        compatibilityScore = calculateCompatibility(userRows[0], candidate);
      }
    }

    return res.status(200).json({
      success: true,
      profile: {
        ...candidate,
        compatibility_score: compatibilityScore
      }
    });
  } catch (error) {
    console.error("[Get Roommate Details Error]", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching roommate details."
    });
  }
});

// Fallback route to index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server and Initialize Database
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Roommate Finder Server running on http://localhost:${PORT}`);
      console.log(`📦 Connected to MySQL Database: ${process.env.DB_NAME || "roommate_finder"}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error("[Startup Error] Could not connect to MySQL. Starting server in degraded mode...");
    app.listen(PORT, () => {
      console.log(`⚠️  Server started on http://localhost:${PORT} (MySQL connection pending).`);
    });
  }
}

startServer();

module.exports = app;
