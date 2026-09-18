/**
 * Roommate Finder - Automated End-to-End Test Suite (Phase 5)
 * File: test_e2e.js
 * Comprehensive lifecycle test:
 *  Step 1: Registration
 *  Step 2: Login
 *  Step 3: Dashboard data verification
 *  Step 4: Create Profile
 *  Step 5: Save & Retrieve Profile
 *  Step 6: Search Roommates
 *  Step 7: Apply Filters (location, budget, food)
 *  Step 8: View Compatibility Score
 *  Step 9: View Public Profile details
 *  Step 10: Logout & verify session invalidated
 */

const http = require("http");

const TIMESTAMP = Date.now();
const STUDENT_EMAIL = `student_e2e_${TIMESTAMP}@college.edu`;
const PEER_EMAIL = `peer_e2e_${TIMESTAMP}@college.edu`;
const PASSWORD = "CollegePassword2026!";

function request(options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (bodyData) {
      req.write(typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log("==================================================================");
  console.log("🚀 STARTING PHASE 5: COMPREHENSIVE END-TO-END INTEGRATION TEST");
  console.log("==================================================================\n");

  let passed = 0;
  const total = 10;
  let sessionCookie = null;
  let peerId = null;

  // -------------------------------------------------------------
  // STEP 1: Registration
  // -------------------------------------------------------------
  try {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/register",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      {
        full_name: "Karan Malhotra",
        email: STUDENT_EMAIL,
        password: PASSWORD,
        confirm_password: PASSWORD,
        age: 20,
        gender: "Male",
        phone: "9876501122"
      }
    );

    if (res.statusCode === 201 && res.body.success) {
      console.log("✅ STEP 1 PASSED: User Registration successful");
      console.log(`   Registered: Karan Malhotra (${STUDENT_EMAIL})\n`);
      passed++;
    } else {
      console.error("❌ STEP 1 FAILED:", res.statusCode, res.body);
    }
  } catch (err) {
    console.error("❌ STEP 1 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // STEP 2: Login
  // -------------------------------------------------------------
  try {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      {
        email: STUDENT_EMAIL,
        password: PASSWORD
      }
    );

    if (res.statusCode === 200 && res.body.success && res.body.user) {
      const rawCookie = res.headers["set-cookie"];
      if (rawCookie && rawCookie.length > 0) {
        sessionCookie = rawCookie[0].split(";")[0];
      }
      console.log("✅ STEP 2 PASSED: User Login successful");
      console.log(`   Session Established. Cookie: ${sessionCookie ? "VALID" : "MISSING"}\n`);
      passed++;
    } else {
      console.error("❌ STEP 2 FAILED:", res.statusCode, res.body);
    }
  } catch (err) {
    console.error("❌ STEP 2 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // STEP 3: Student Dashboard Access
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/profile/me",
      method: "GET",
      headers: { Cookie: sessionCookie || "" }
    });

    if (
      res.statusCode === 200 &&
      res.body.success &&
      res.body.personal &&
      res.body.personal.email === STUDENT_EMAIL
    ) {
      console.log("✅ STEP 3 PASSED: Student Dashboard authenticated & data verified");
      console.log(`   Welcome: ${res.body.personal.full_name}, Age: ${res.body.personal.age}\n`);
      passed++;
    } else {
      console.error("❌ STEP 3 FAILED:", res.statusCode, res.body);
    }
  } catch (err) {
    console.error("❌ STEP 3 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // STEP 4 & 5: Create & Save Roommate Profile
  // -------------------------------------------------------------
  try {
    const saveRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/profile",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie || ""
        }
      },
      {
        preferred_location: "North Campus",
        min_budget: 6000,
        max_budget: 9000,
        food_preference: "Vegetarian",
        smoking_preference: "Non-Smoker",
        study_habit: "Quiet",
        sleeping_schedule: "Night Owl",
        cleanliness_preference: "High",
        preferred_roommates: 1,
        about_me: "CS undergrad looking for an organized, quiet roommate."
      }
    );

    const checkRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/profile/me",
      method: "GET",
      headers: { Cookie: sessionCookie || "" }
    });

    const pref = checkRes.body.preferences;
    if (
      saveRes.statusCode === 200 &&
      checkRes.statusCode === 200 &&
      checkRes.body.hasProfile &&
      pref.preferred_location === "North Campus" &&
      Number(pref.min_budget) === 6000
    ) {
      console.log("✅ STEP 4 & 5 PASSED: Create & Save Roommate Profile verified in storage");
      console.log(`   Saved: Location: ${pref.preferred_location}, Budget: ₹${pref.min_budget}-₹${pref.max_budget}\n`);
      passed += 2; // Steps 4 and 5
    } else {
      console.error("❌ STEPS 4 & 5 FAILED:", saveRes.body, checkRes.body);
    }
  } catch (err) {
    console.error("❌ STEPS 4 & 5 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // SETUP: Create a peer student to search for
  // -------------------------------------------------------------
  try {
    await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/register",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      {
        full_name: "Tanvi Roy",
        email: PEER_EMAIL,
        password: PASSWORD,
        confirm_password: PASSWORD,
        age: 21,
        gender: "Female",
        phone: "9876503344"
      }
    );

    const peerLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      { email: PEER_EMAIL, password: PASSWORD }
    );

    const peerCookie = (peerLogin.headers["set-cookie"] || [])[0]?.split(";")[0] || "";
    peerId = peerLogin.body?.user?.id;

    await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/profile",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: peerCookie
        }
      },
      {
        preferred_location: "North Campus",
        min_budget: 6500,
        max_budget: 8500,
        food_preference: "Vegetarian",
        smoking_preference: "Non-Smoker",
        study_habit: "Quiet",
        sleeping_schedule: "Night Owl",
        cleanliness_preference: "High",
        preferred_roommates: 1,
        about_me: "Tanvi is a biotech student, clean and studious."
      }
    );
  } catch (e) {
    console.error("Peer setup error:", e.message);
  }

  // -------------------------------------------------------------
  // STEP 6: Search Roommates
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/roommates",
      method: "GET",
      headers: { Cookie: sessionCookie || "" }
    });

    const list = res.body.roommates || [];
    const foundPeer = list.find((r) => r.full_name === "Tanvi Roy");

    if (res.statusCode === 200 && res.body.success && foundPeer) {
      console.log("✅ STEP 6 PASSED: Search Roommates returned candidate list");
      console.log(`   Found ${list.length} roommates in database, including Tanvi Roy\n`);
      passed++;
    } else {
      console.error("❌ STEP 6 FAILED: Peer not found in roommate search", res.body);
    }
  } catch (err) {
    console.error("❌ STEP 6 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // STEP 7: Multiple Filters (Location, Budget, Food)
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/roommates?location=North&food_preference=Vegetarian&min_budget=5000&max_budget=10000",
      method: "GET",
      headers: { Cookie: sessionCookie || "" }
    });

    const list = res.body.roommates || [];
    const match = list.find((r) => r.full_name === "Tanvi Roy");

    if (res.statusCode === 200 && match && match.food_preference === "Vegetarian") {
      console.log("✅ STEP 7 PASSED: Multiple Filters applied correctly (Location, Budget, Food)");
      console.log(`   Filtered result: ${match.full_name} (${match.preferred_location})\n`);
      passed++;
    } else {
      console.error("❌ STEP 7 FAILED:", res.body);
    }
  } catch (err) {
    console.error("❌ STEP 7 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // STEP 8: Compatibility Score Calculation
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/roommates?location=North",
      method: "GET",
      headers: { Cookie: sessionCookie || "" }
    });

    const match = (res.body.roommates || []).find((r) => r.full_name === "Tanvi Roy");

    if (match && typeof match.compatibility_score === "number" && match.compatibility_score >= 80) {
      console.log("✅ STEP 8 PASSED: Compatibility Score calculated accurately");
      console.log(`   Match Score: ${match.compatibility_score}% (High preference alignment)\n`);
      passed++;
    } else {
      console.error("❌ STEP 8 FAILED:", match);
    }
  } catch (err) {
    console.error("❌ STEP 8 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // STEP 9: View Public Profile Details
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/roommates/${peerId}`,
      method: "GET",
      headers: { Cookie: sessionCookie || "" }
    });

    const prof = res.body.profile;
    const hasSensitiveData = prof && (prof.password !== undefined || prof.password_hash !== undefined);

    if (
      res.statusCode === 200 &&
      res.body.success &&
      prof &&
      prof.full_name === "Tanvi Roy" &&
      !hasSensitiveData
    ) {
      console.log("✅ STEP 9 PASSED: View Public Profile details retrieved securely");
      console.log(`   Name: ${prof.full_name}, Age: ${prof.age}, Location: ${prof.preferred_location}`);
      console.log(`   Security: Passwords & hashes are strictly omitted\n`);
      passed++;
    } else {
      console.error("❌ STEP 9 FAILED:", res.body);
    }
  } catch (err) {
    console.error("❌ STEP 9 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // STEP 10: Logout & Session Termination
  // -------------------------------------------------------------
  try {
    const logoutRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/logout",
      method: "POST",
      headers: { Cookie: sessionCookie || "" }
    });

    // Check that /api/auth/me now rejects with 401 Unauthorized
    const meRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/me",
      method: "GET",
      headers: { Cookie: sessionCookie || "" }
    });

    if (logoutRes.statusCode === 200 && meRes.statusCode === 401) {
      console.log("✅ STEP 10 PASSED: Logout destroyed session (subsequent auth check returns 401 Unauthorized)\n");
      passed++;
    } else {
      console.error("❌ STEP 10 FAILED: Session still active after logout");
    }
  } catch (err) {
    console.error("❌ STEP 10 ERROR:", err.message);
  }

  console.log("==================================================================");
  console.log(`🏁 END-TO-END TEST RESULTS: ${passed} / ${total} STEPS PASSED`);
  console.log("==================================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Allow 1 second startup if triggered concurrently
setTimeout(runE2ETests, 1000);
