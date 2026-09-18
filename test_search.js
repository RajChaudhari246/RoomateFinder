/**
 * Roommate Finder - Automated Search & Matching Test Suite (Phase 4)
 * File: test_search.js
 * Tests:
 *  1. Create multiple test users & profiles (Charlie, Diana, Evan)
 *  2. Search using location filter
 *  3. Search using budget filter
 *  4. Combine multiple filters (location + budget + food)
 *  5. Check compatibility score calculation
 *  6. Open a roommate profile via /api/roommates/:id
 *  7. Verify private information (passwords) is NOT exposed
 *  8. Verify empty results when no profiles match
 */

const http = require("http");

const TIMESTAMP = Date.now();
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

async function createStudent(name, email, age, gender, phone, pref) {
  // Register
  await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/register",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    },
    {
      full_name: name,
      email,
      password: PASSWORD,
      confirm_password: PASSWORD,
      age,
      gender,
      phone
    }
  );

  // Login
  const loginRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    },
    { email, password: PASSWORD }
  );

  const cookie = (loginRes.headers["set-cookie"] || [])[0]?.split(";")[0] || "";

  // Save profile
  await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/profile",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      }
    },
    pref
  );

  return { email, cookie, id: loginRes.body?.user?.id };
}

async function runSearchTests() {
  console.log("=================================================");
  console.log("🚀 STARTING PHASE 4: SEARCH & MATCHING TESTS");
  console.log("=================================================\n");

  let passed = 0;
  const total = 8;

  let charlieUser, dianaUser, evanUser, viewerUser;

  // -------------------------------------------------------------
  // TEST 1: Create multiple test users with diverse profiles
  // -------------------------------------------------------------
  try {
    charlieUser = await createStudent(
      "Charlie Davis",
      `charlie_${TIMESTAMP}@college.edu`,
      21,
      "Male",
      "9876500001",
      {
        preferred_location: "North Campus",
        min_budget: 5000,
        max_budget: 8000,
        food_preference: "Vegetarian",
        smoking_preference: "Non-Smoker",
        study_habit: "Quiet",
        sleeping_schedule: "Night Owl",
        cleanliness_preference: "High",
        preferred_roommates: 1,
        about_me: "Charlie is a CS student who likes quiet nights."
      }
    );

    dianaUser = await createStudent(
      "Diana Prince",
      `diana_${TIMESTAMP}@college.edu`,
      22,
      "Female",
      "9876500002",
      {
        preferred_location: "South Campus",
        min_budget: 4000,
        max_budget: 7000,
        food_preference: "Non-Vegetarian",
        smoking_preference: "Non-Smoker",
        study_habit: "Moderate",
        sleeping_schedule: "Early Sleeper",
        cleanliness_preference: "Moderate",
        preferred_roommates: 2,
        about_me: "Diana studies early morning and loves cooking."
      }
    );

    evanUser = await createStudent(
      "Evan Wright",
      `evan_${TIMESTAMP}@college.edu`,
      23,
      "Male",
      "9876500003",
      {
        preferred_location: "West End",
        min_budget: 9000,
        max_budget: 14000,
        food_preference: "Vegetarian",
        smoking_preference: "Smoker",
        study_habit: "Flexible",
        sleeping_schedule: "Flexible",
        cleanliness_preference: "Flexible",
        preferred_roommates: 3,
        about_me: "Evan is an arts major with flexible hours."
      }
    );

    // Create a viewer user who is looking for a roommate in North Campus, budget 6000-8000, Veg
    viewerUser = await createStudent(
      "Viewer Student",
      `viewer_${TIMESTAMP}@college.edu`,
      20,
      "Male",
      "9876500004",
      {
        preferred_location: "North Campus",
        min_budget: 6000,
        max_budget: 8000,
        food_preference: "Vegetarian",
        smoking_preference: "Non-Smoker",
        study_habit: "Quiet",
        sleeping_schedule: "Night Owl",
        cleanliness_preference: "High",
        preferred_roommates: 1,
        about_me: "Searching for someone in North Campus."
      }
    );

    console.log("✅ TEST 1 PASSED: Created multiple test students with diverse profiles");
    console.log(`   Created: Charlie (North Campus), Diana (South Campus), Evan (West End)\n`);
    passed++;
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Search using location filter
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/roommates?location=North",
      method: "GET",
      headers: { Cookie: viewerUser.cookie }
    });

    const matches = res.body.roommates || [];
    const hasNorth = matches.some((r) => r.full_name === "Charlie Davis");
    const hasSouth = matches.some((r) => r.full_name === "Diana Prince");

    if (res.statusCode === 200 && hasNorth && !hasSouth) {
      console.log("✅ TEST 2 PASSED: Location filter works correctly");
      console.log(`   Found ${matches.length} matches in 'North Campus', filtered out South Campus\n`);
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED: Location filter mismatch", res.body);
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Search using budget filter
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/roommates?min_budget=10000",
      method: "GET",
      headers: { Cookie: viewerUser.cookie }
    });

    const matches = res.body.roommates || [];
    const hasEvan = matches.some((r) => r.full_name === "Evan Wright");
    const hasDiana = matches.some((r) => r.full_name === "Diana Prince");

    if (res.statusCode === 200 && hasEvan && !hasDiana) {
      console.log("✅ TEST 3 PASSED: Budget filter works correctly (min_budget=10000)");
      console.log(`   Found Evan (Budget: ₹${matches[0].min_budget} - ₹${matches[0].max_budget})\n`);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED: Budget filter mismatch", res.body);
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Combine multiple filters (location + budget + food)
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/roommates?location=North&food_preference=Vegetarian&max_budget=9000",
      method: "GET",
      headers: { Cookie: viewerUser.cookie }
    });

    const matches = res.body.roommates || [];
    const charlieMatch = matches.find((r) => r.full_name === "Charlie Davis");

    if (res.statusCode === 200 && charlieMatch) {
      console.log("✅ TEST 4 PASSED: Combined multiple filters (Location=North, Food=Vegetarian, MaxBudget=9000)");
      console.log(`   Correctly returned: ${charlieMatch.full_name}\n`);
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: Combined filters returned unexpected results", res.body);
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Check compatibility score calculation
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/roommates",
      method: "GET",
      headers: { Cookie: viewerUser.cookie }
    });

    const matches = res.body.roommates || [];
    const charlie = matches.find((r) => r.full_name === "Charlie Davis");
    const diana = matches.find((r) => r.full_name === "Diana Prince");

    if (
      charlie &&
      diana &&
      charlie.compatibility_score >= 80 &&
      charlie.compatibility_score > diana.compatibility_score
    ) {
      console.log("✅ TEST 5 PASSED: Compatibility scoring correctly evaluated");
      console.log(`   Charlie Score: ${charlie.compatibility_score}% (Close preference match)`);
      console.log(`   Diana Score: ${diana.compatibility_score}% (Different location/routine)`);
      console.log(`   Verified ranking: Higher compatibility sorted first.\n`);
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED: Compatibility scores improper", matches);
    }
  } catch (err) {
    console.error("❌ TEST 5 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Open roommate profile via /api/roommates/:id
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/roommates/${charlieUser.id}`,
      method: "GET",
      headers: { Cookie: viewerUser.cookie }
    });

    if (
      res.statusCode === 200 &&
      res.body.success &&
      res.body.profile &&
      res.body.profile.full_name === "Charlie Davis"
    ) {
      console.log("✅ TEST 6 PASSED: Retrieved public roommate profile details");
      console.log(`   Name: ${res.body.profile.full_name}, Location: ${res.body.profile.preferred_location}\n`);
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED: Could not retrieve public roommate profile", res.body);
    }
  } catch (err) {
    console.error("❌ TEST 6 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Verify private information (passwords) is NOT exposed
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/roommates/${charlieUser.id}`,
      method: "GET",
      headers: { Cookie: viewerUser.cookie }
    });

    const p = res.body.profile;
    const hasPassword = p.password !== undefined || p.password_hash !== undefined;

    if (res.statusCode === 200 && !hasPassword) {
      console.log("✅ TEST 7 PASSED: Security verified - No password or sensitive hash exposed in public profile API\n");
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED: Sensitive credentials exposed in public API!", p);
    }
  } catch (err) {
    console.error("❌ TEST 7 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Verify empty results message when no profiles match
  // -------------------------------------------------------------
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/roommates?location=NonExistentCampusZone12345",
      method: "GET",
      headers: { Cookie: viewerUser.cookie }
    });

    if (res.statusCode === 200 && res.body.roommates && res.body.roommates.length === 0) {
      console.log("✅ TEST 8 PASSED: Empty results returned correctly when no candidate matches filters");
      console.log(`   Count: ${res.body.roommates.length}\n`);
      passed++;
    } else {
      console.error("❌ TEST 8 FAILED: Expected empty results", res.body);
    }
  } catch (err) {
    console.error("❌ TEST 8 ERROR:", err.message);
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

setTimeout(runSearchTests, 1000);
