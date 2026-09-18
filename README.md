# Roommate Finder 🏠🎓

> **College 3rd Semester Mini Project**  
> **Phase 5: Final Integration, Testing & Project Polish**  
> Built with clean HTML5, CSS3, Vanilla JavaScript, Node.js/Express, and MySQL.

---

## 1. Project Overview

Finding a compatible roommate in college is often stressful and unreliable. Students frequently face unexpected clashes over conflicting study schedules, budget differences, dietary habits, and lifestyle routines.

**Roommate Finder** is a full-stack web platform engineered to solve student housing challenges. It allows college students to securely register, configure their monthly rent budget and lifestyle requirements, and discover compatible flatmates through an explainable, deterministic **100-Point Compatibility Matching Algorithm**.

---

## 2. Key Features

1. **Student Registration**: Register with student personal details (Full Name, College Email, Age, Gender, Phone, Password).
2. **Secure Authentication & Login**: Password encryption using `bcryptjs` (10 rounds) and HTTP-only session cookie management.
3. **Session-Aware Navigation & Route Protection**: Private student areas (`dashboard.html`, `profile.html`) automatically guard against unauthorized access and redirect to login. Navigation dynamically reflects authentication state.
4. **Student Dashboard**: Live dashboard displaying personal details, profile completion percentage, roommate preference summaries, saved favorites, and roommate match requests.
5. **Create & Edit Profile**: Comprehensive form to define campus location, monthly budget (Min & Max), diet habits (Vegetarian/Non-Vegetarian), smoking rules, study schedules (Quiet/Moderate/Flexible), sleep routines (Early Sleeper/Night Owl), and student bio.
6. **Multi-Parameter Roommate Search**: Real-time filtering across campus areas, monthly budget ranges, dietary preferences, gender, smoking, and study habits.
7. **100-Point Compatibility Score**: Rule-based preference compatibility scoring comparing location (20pts), budget overlap (20pts), diet (15pts), study habit (15pts), sleep routine (10pts), smoking policy (10pts), and cleanliness level (10pts).
8. **Public Roommate Profiles**: Detailed view of peer preferences, compatibility breakdown, and safe contact information without exposing passwords or sensitive database hashes.
9. **Interactive UI Polish**: Button loading spinners, skeleton placeholders, instant form validation feedback, and toast notifications.
10. **MySQL Relational Storage**: Full database persistence with primary keys, foreign key constraints with `CASCADE` delete, unique indexes, and fallback handling.

---

## 3. Technologies Used

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | HTML5 | Semantic page structures, accessible forms, meta SEO tags |
| **Styling** | Vanilla CSS3 | Custom design system, Flexbox, CSS Grid, animations, mobile responsive |
| **Client Scripting** | Vanilla JavaScript (ES6+) | Form validation, dynamic DOM rendering, session check, Fetch API |
| **Backend Server** | Node.js & Express.js (v4.21+) | REST API endpoints, routing, middleware, static file serving |
| **Session & Security**| `express-session`, `bcryptjs`, `cors` | Session cookies, bcrypt password hashing, CORS protection |
| **Database** | MySQL 8.0 (`mysql2/promise`) | Relational tables (`users`, `student_profiles`), parameterized queries |
| **Configuration** | `dotenv` | Environment variable management (`.env`) |

---

## 4. Database Structure & Schema

The relational database `roommate_finder` consists of two normalized tables with a **1-to-1 relationship**:

```
+------------------------------------+          +------------------------------------+
|               users                |          |          student_profiles          |
+------------------------------------+          +------------------------------------+
| id (PK, INT AUTO_INCREMENT)        | <------- | id (PK, INT AUTO_INCREMENT)        |
| full_name (VARCHAR)                |    |     | user_id (FK, UK, INT)              |
| email (UK, VARCHAR)                |    |     | preferred_location (VARCHAR)       |
| password_hash (VARCHAR)            |    |     | min_budget (INT)                   |
| age (INT)                          |    |     | max_budget (INT)                   |
| gender (VARCHAR)                   |    |     | food_preference (VARCHAR)          |
| phone (VARCHAR)                    |    |     | smoking_preference (VARCHAR)       |
| created_at (TIMESTAMP)             |    |     | study_habit (VARCHAR)              |
+------------------------------------+    |     | sleeping_schedule (VARCHAR)        |
                                          |     | cleanliness_preference (VARCHAR)   |
                                          |     | preferred_roommates (INT)          |
                                          |     | about_me (TEXT)                    |
                                          |     | created_at, updated_at (TIMESTAMP) |
                                          |     +------------------------------------+
                                          |
                                          +--- FOREIGN KEY (user_id) REFERENCES users(id)
                                               ON DELETE CASCADE
```

### Constraints & Security Guarantees:
- **Primary Keys**: Ensure unique record identification.
- **Unique Email**: Enforces one account per email.
- **Foreign Key (`user_id`)**: Maintained with `ON DELETE CASCADE` so deleting a user removes their profile automatically.
- **Parameterized SQL**: All queries use prepared statements (`?` placeholders) to eliminate SQL injection vulnerabilities.

*(For a presentation-ready schema guide, see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).)*

---

## 5. API Endpoints

### Authentication Routes
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new student account | Public |
| `POST` | `/api/auth/login` | Authenticate student and start session | Public |
| `GET` | `/api/auth/me` | Return currently logged-in student info | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate session and clear cookie | Authenticated |

### Profile & Preferences Routes
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/profile/me` | Fetch active student's full profile | Authenticated |
| `POST` | `/api/profile` | Create or update preferences & personal data | Authenticated |

### Roommate Search & Discovery Routes
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/roommates` | Search & filter profiles with compatibility % | Public / Authenticated |
| `GET` | `/api/roommates/:id` | View specific peer public profile | Public / Authenticated |

---

## 6. Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16.x or higher)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (optional but recommended; an in-memory database fallback is included)

### Step 1: Clone or Navigate to Directory
```bash
cd RoomateFinder
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` or verify the values:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=roommate_finder
SESSION_SECRET=roommate_finder_secret_key_2026
```

### Step 4: Import Database Schema (MySQL)
Open MySQL Workbench, phpMyAdmin, or MySQL CLI and run:
```bash
mysql -u root -p < schema.sql
```
*Note: `schema.sql` creates the database, all tables, and pre-populates sample student accounts for instant demonstration.*

---

## 7. How to Run the Project

### Start the Server
```bash
npm start
# or
node server.js
```

### Open the Application
Navigate your web browser to:
```
http://localhost:3000
```

### Demo Student Login Credentials (from `schema.sql`)
| Email | Password | Campus Area | Budget |
|---|---|---|---|
| `aarav@college.edu` | `Password123!` | North Campus | ₹5,000 - ₹8,000 |
| `priya@college.edu` | `Password123!` | West End | ₹4,500 - ₹7,000 |
| `rohan@college.edu` | `Password123!` | South Campus | ₹7,000 - ₹11,000 |
| `sneha@college.edu` | `Password123!` | North Campus | ₹6,000 - ₹9,500 |
| `vikram@college.edu`| `Password123!` | University Town | ₹8,000 - ₹13,000 |

---

## 8. Test Cases & Verification

The project includes four automated test suites validating functionality across all phases:

```bash
# Run all automated tests
npm test
# or
node test_auth.js && node test_profile.js && node test_search.js && node test_e2e.js
```

### Test Suites Included:
1. **`test_auth.js`** (Phase 2):
   - Successful user registration (201 Created)
   - Duplicate email rejection (409 Conflict)
   - Invalid email format validation (400 Bad Request)
   - Password mismatch rejection (400 Bad Request)
   - Successful login and session cookie establishment (200 OK)
   - Incorrect password rejection (401 Unauthorized)
   - Logout session invalidation
2. **`test_profile.js`** (Phase 3):
   - Create and save roommate preferences
   - Profile persistence verification
   - Edit profile fields and verify updates
   - Budget validation rejection (min_budget > max_budget)
   - Multi-account profile data isolation
3. **`test_search.js`** (Phase 4):
   - Diverse student profile generation
   - Location filtering
   - Budget range filtering
   - Combined multi-criteria filtering
   - 100-point compatibility score ranking
   - Password omission in public roommate queries
   - Empty search results handling
4. **`test_e2e.js`** (Phase 5):
   - Complete 10-step student lifecycle test:
     Registration ➔ Login ➔ Dashboard ➔ Create Profile ➔ Save Profile ➔ Search Roommates ➔ Apply Filters ➔ View Compatibility ➔ View Profile ➔ Logout.

---

## 9. Future Scope

1. **In-App Direct Chat**: Real-time peer-to-peer messaging using WebSockets (`socket.io`).
2. **College Identity Card Verification**: Automated student ID upload and manual/OCR approval badge.
3. **Interactive Campus Map**: Map integration (Leaflet/OpenStreetMap) showing accommodation pins and commute times to university campus gates.
4. **Room Listing Uploads**: Allowing flat owners or students with existing vacant rooms to upload photos and amenities.
5. **Push Notifications**: Browser push notifications when a matching student registers in the same campus zone.

---

## 10. Project Author & Academic Information

- **Project:** Roommate Finder Web Application
- **Course:** 3rd Semester Web Development Mini Project
- **Status:** Phase 5 Completed & Integrated
- **Year:** 2026
