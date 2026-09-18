/**
 * Roommate Finder - Automated Authentication Test Suite (Phase 2)
 * File: test_auth.js
 * Tests:
 *  1. Successful registration
 *  2. Duplicate email
 *  3. Invalid email
 *  4. Password mismatch
 *  5. Successful login
 *  6. Incorrect password
 *  7. Logout
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";
const TEST_TIMESTAMP = Date.now();
const TEST_EMAIL = `student_${TEST_TIMESTAMP}@college.edu`;
const TEST_PASSWORD = "CollegeStudent2026!";

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

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING ROOMMATE FINDER AUTHENTICATION TESTS");
  console.log("=================================================\n");

  let passedCount = 0;
  let totalTests = 7;
  let sessionCookie = null;

  // -------------------------------------------------------------
  // TEST 1: Successful registration
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
        full_name: "Rohan Varma",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        confirm_password: TEST_PASSWORD,
        age: 20,
        gender: "Male",
        phone: "9876543210"
      }
    );

    if (res.statusCode === 201 && res.body.success) {
      console.log("✅ TEST 1 PASSED: Successful registration");
      console.log(`   Message: "${res.body.message}" (User ID: ${res.body.userId})\n`);
      passedCount++;
    } else {
      console.error(`❌ TEST 1 FAILED: Expected 201, got ${res.statusCode}`, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Duplicate email
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
        full_name: "Duplicate User",
        email: TEST_EMAIL, // Same email
        password: TEST_PASSWORD,
        confirm_password: TEST_PASSWORD,
        age: 21,
        gender: "Male",
        phone: "9876543211"
      }
    );

    if (res.statusCode === 409 && res.body.success === false) {
      console.log("✅ TEST 2 PASSED: Duplicate email correctly rejected with 409 Conflict");
      console.log(`   Message: "${res.body.message}"\n`);
      passedCount++;
    } else {
      console.error(`❌ TEST 2 FAILED: Expected 409, got ${res.statusCode}`, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Invalid email
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
        full_name: "Invalid Email Tester",
        email: "not-an-email",
        password: TEST_PASSWORD,
        confirm_password: TEST_PASSWORD,
        age: 19,
        gender: "Female",
        phone: "9876543212"
      }
    );

    if (res.statusCode === 400 && res.body.success === false) {
      console.log("✅ TEST 3 PASSED: Invalid email format correctly rejected with 400 Bad Request");
      console.log(`   Message: "${res.body.message}"\n`);
      passedCount++;
    } else {
      console.error(`❌ TEST 3 FAILED: Expected 400, got ${res.statusCode}`, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Password mismatch
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
        full_name: "Mismatch Tester",
        email: `mismatch_${TEST_TIMESTAMP}@college.edu`,
        password: "FirstPassword123!",
        confirm_password: "DifferentPassword456!",
        age: 22,
        gender: "Other",
        phone: "9876543213"
      }
    );

    if (res.statusCode === 400 && res.body.success === false) {
      console.log("✅ TEST 4 PASSED: Password mismatch correctly rejected with 400 Bad Request");
      console.log(`   Message: "${res.body.message}"\n`);
      passedCount++;
    } else {
      console.error(`❌ TEST 4 FAILED: Expected 400, got ${res.statusCode}`, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Successful login
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
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    );

    if (res.statusCode === 200 && res.body.success) {
      // Capture session cookie
      const rawCookie = res.headers["set-cookie"];
      if (rawCookie && rawCookie.length > 0) {
        sessionCookie = rawCookie[0].split(";")[0];
      }

      console.log("✅ TEST 5 PASSED: Successful login with valid credentials");
      console.log(`   Welcome User: "${res.body.user.full_name}" (${res.body.user.email})`);
      console.log(`   Session Cookie Established: ${sessionCookie ? "YES" : "NO"}\n`);
      passedCount++;
    } else {
      console.error(`❌ TEST 5 FAILED: Expected 200, got ${res.statusCode}`, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 5 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Incorrect password
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
        email: TEST_EMAIL,
        password: "WrongPassword999!"
      }
    );

    if (res.statusCode === 401 && res.body.success === false) {
      console.log("✅ TEST 6 PASSED: Incorrect password correctly rejected with 401 Unauthorized");
      console.log(`   Message: "${res.body.message}"\n`);
      passedCount++;
    } else {
      console.error(`❌ TEST 6 FAILED: Expected 401, got ${res.statusCode}`, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 6 ERROR:", err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Logout
  // -------------------------------------------------------------
  try {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/logout",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie || ""
        }
      },
      {}
    );

    if (res.statusCode === 200 && res.body.success) {
      // Also verify /api/auth/me is now unauthorized
      const meRes = await request({
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/me",
        method: "GET",
        headers: {
          Cookie: sessionCookie || ""
        }
      });

      if (meRes.statusCode === 401) {
        console.log("✅ TEST 7 PASSED: Logout destroyed session successfully (verified with /api/auth/me returning 401)");
        console.log(`   Message: "${res.body.message}"\n`);
        passedCount++;
      } else {
        console.error(`❌ TEST 7 FAILED: Expected /api/auth/me to return 401, got ${meRes.statusCode}`);
      }
    } else {
      console.error(`❌ TEST 7 FAILED: Expected 200, got ${res.statusCode}`, res.body);
    }
  } catch (err) {
    console.error("❌ TEST 7 ERROR:", err.message);
  }

  console.log("=================================================");
  console.log(`🏁 TEST RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log("=================================================");

  if (passedCount === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Give server 1 second to accept requests if started concurrently
setTimeout(runTests, 1000);
