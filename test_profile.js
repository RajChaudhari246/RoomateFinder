/**
 * Roommate Finder - Automated Profile Test Suite (Phase 3)
 * File: test_profile.js
 * Tests:
 *  1. Create profile
 *  2. Save profile
 *  3. Retrieve profile (verify data remains)
 *  4. Edit profile
 *  5. Verify updated data
 *  6. Test invalid budget validation (min_budget > max_budget)
 *  7. Multi-account profile isolation (User 1 vs User 2)
 */

const http = require("http");

const TIMESTAMP = Date.now();
const USER_1_EMAIL = `alice_${TIMESTAMP}@college.edu`;
const USER_2_EMAIL = `bob_${TIMESTAMP}@college.edu`;
const PASSWORD = "Password123!";

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

async function runProfileTests() {
  console.log("=================================================");
  console.log("🚀 STARTING PHASE 3: PROFILE & PREFERENCES TESTS");
  console.log("=================================================\n");

  let passed = 0;
  const total = 7;
  let aliceCookie = null;
  let bobCookie = null;

  // -------------------------------------------------------------
  // SETUP: Register & Login Alice
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
        full_name: "Alice Johnson",
        email: USER_1_EMAIL,
        password: PASSWORD,
        confirm_password: PASSWORD,
        age: 20,
        gender: "Female",
        phone: "9876543210"
      }
    );

    const loginRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      {
        email: USER_1_EMAIL,
        password: PASSWORD
      }
    );

    const rawCookie = loginRes.headers["set-cookie"];
    if (rawCookie && rawCookie.length > 0) {
      aliceCookie = rawCookie[0].split(";")[0];
    }
  } catch (err) {
    console.error("Setup error:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 1: Create & Save Roommate Profile
  // -------------------------------------------------------------
  try {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/profile",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: aliceCookie
        }
      },
      {
        preferred_location: "North Campus",
        min_budget: 4500,
        max_budget: 7500,
        food_preference: "Vegetarian",
        smoking_preference: "Non-Smoker",
        study_habit: "Quiet",
        sleeping_schedule: "Night Owl",
        cleanliness_preference: "High",
        preferred_roommates: 1,
        about_me: "Alice loves quiet study sessions and coding."
      }
    );

    if (res.statusCode === 200 && res.body.success) {
      console.log("✅ TEST 1 PASSED: Create & Save Roommate Profile");
      console.log(`   Message: "${res.body.message}"\n`);
      passed++;
    } else {
      console.error("❌ TEST 1 FAILED:", res.statusCode, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Retrieve Profile & Verify Data Persistence
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/profile/me",
      method: "GET",
      headers: { Cookie: aliceCookie }
    });

    const pref = res.body.preferences;
    if (
      res.statusCode === 200 &&
      res.body.hasProfile === true &&
      pref &&
      pref.preferred_location === "North Campus" &&
      Number(pref.min_budget) === 4500 &&
      Number(pref.max_budget) === 7500 &&
      pref.food_preference === "Vegetarian" &&
      pref.study_habit === "Quiet"
    ) {
      console.log("✅ TEST 2 PASSED: Retrieved Profile successfully and verified data integrity");
      console.log(`   Location: ${pref.preferred_location}, Budget: ₹${pref.min_budget} - ₹${pref.max_budget}`);
      console.log(`   Food: ${pref.food_preference}, Study: ${pref.study_habit}\n`);
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED: Data mismatch or profile missing", res.body);
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Edit Profile
  // -------------------------------------------------------------
  try {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/profile",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: aliceCookie
        }
      },
      {
        preferred_location: "University Town",
        min_budget: 5000,
        max_budget: 9000,
        food_preference: "Vegetarian",
        smoking_preference: "Non-Smoker",
        study_habit: "Moderate",
        sleeping_schedule: "Flexible",
        cleanliness_preference: "High",
        preferred_roommates: 2,
        about_me: "Updated bio: Looking for a 2BHK flatmate."
      }
    );

    if (res.statusCode === 200 && res.body.success) {
      console.log("✅ TEST 3 PASSED: Edited profile successfully");
      console.log(`   Message: "${res.body.message}"\n`);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED:", res.statusCode, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Verify Updated Data
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/profile/me",
      method: "GET",
      headers: { Cookie: aliceCookie }
    });

    const pref = res.body.preferences;
    if (
      res.statusCode === 200 &&
      pref &&
      pref.preferred_location === "University Town" &&
      Number(pref.max_budget) === 9000 &&
      pref.study_habit === "Moderate" &&
      Number(pref.preferred_roommates) === 2
    ) {
      console.log("✅ TEST 4 PASSED: Verified updated fields persisted correctly in database");
      console.log(`   New Location: ${pref.preferred_location}, New Max Budget: ₹${pref.max_budget}, Study: ${pref.study_habit}\n`);
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: Updated fields do not match", res.body);
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Validation Error (min_budget > max_budget)
  // -------------------------------------------------------------
  try {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/profile",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: aliceCookie
        }
      },
      {
        preferred_location: "West End",
        min_budget: 10000,
        max_budget: 5000, // Invalid: min > max
        food_preference: "Vegetarian",
        smoking_preference: "Non-Smoker",
        study_habit: "Quiet",
        sleeping_schedule: "Night Owl",
        cleanliness_preference: "High",
        preferred_roommates: 1
      }
    );

    if (res.statusCode === 400 && res.body.success === false) {
      console.log("✅ TEST 5 PASSED: Server rejected invalid budget (min > max) with 400 Bad Request");
      console.log(`   Error Message: "${res.body.message}"\n`);
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED: Expected 400, got", res.statusCode, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 5 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Register & Login Second User (Bob) - Verify Isolation
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
        full_name: "Bob Smith",
        email: USER_2_EMAIL,
        password: PASSWORD,
        confirm_password: PASSWORD,
        age: 22,
        gender: "Male",
        phone: "9123456780"
      }
    );

    const loginRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      {
        email: USER_2_EMAIL,
        password: PASSWORD
      }
    );

    const rawCookie = loginRes.headers["set-cookie"];
    if (rawCookie && rawCookie.length > 0) {
      bobCookie = rawCookie[0].split(";")[0];
    }

    // Check Bob's profile
    const bobRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/profile/me",
      method: "GET",
      headers: { Cookie: bobCookie }
    });

    if (
      bobRes.statusCode === 200 &&
      bobRes.body.personal.email === USER_2_EMAIL &&
      bobRes.body.hasProfile === false
    ) {
      console.log("✅ TEST 6 PASSED: Verified profile isolation across student accounts");
      console.log(`   Bob (${USER_2_EMAIL}) logged in and cannot see Alice's profile data (hasProfile: false)\n`);
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED: Profile isolation violated", bobRes.body);
    }
  } catch (err) {
    console.error("❌ TEST 6 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Bob Creates His Own Profile - Alice's Remains Unaffected
  // -------------------------------------------------------------
  try {
    await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/profile",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: bobCookie
        }
      },
      {
        preferred_location: "South Campus",
        min_budget: 6000,
        max_budget: 11000,
        food_preference: "Non-Vegetarian",
        smoking_preference: "No Preference",
        study_habit: "Flexible",
        sleeping_schedule: "Early Sleeper",
        cleanliness_preference: "Moderate",
        preferred_roommates: 2,
        about_me: "Bob is a mechanical engineering student."
      }
    );

    // Verify Bob's profile
    const bobCheck = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/profile/me",
      method: "GET",
      headers: { Cookie: bobCookie }
    });

    // Verify Alice's profile is still intact and unchanged
    const aliceCheck = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/profile/me",
      method: "GET",
      headers: { Cookie: aliceCookie }
    });

    if (
      bobCheck.body.preferences.preferred_location === "South Campus" &&
      aliceCheck.body.preferences.preferred_location === "University Town"
    ) {
      console.log("✅ TEST 7 PASSED: Both students maintain separate, isolated profiles in MySQL");
      console.log(`   Alice Location: ${aliceCheck.body.preferences.preferred_location} (Budget: ₹${aliceCheck.body.preferences.max_budget})`);
      console.log(`   Bob Location: ${bobCheck.body.preferences.preferred_location} (Budget: ₹${bobCheck.body.preferences.max_budget})\n`);
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED: Cross-contamination between profiles");
    }
  } catch (err) {
    console.error("❌ TEST 7 ERROR:", err.message);
  }

  console.log("=================================================");
  console.log(`🏁 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log("=================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

setTimeout(runProfileTests, 1000);
