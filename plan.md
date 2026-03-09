
# Professional Networking Platform, ShiaConnection
# FULL SYSTEM PLAN

This document is the single source of truth for designing and building the platform.
The platform is inspired by professional networking concepts but is NOT a LinkedIn clone.

Stack: React + firebase

--------------------------------------------------
SECTION 1 — CORE OBJECTIVES
--------------------------------------------------

1. Build a professional networking platform.
2. Provide different experiences based on user roles.
3. Implement scalable microservice architecture.
4. Maintain strict admin control.
5. Follow clean phased development.

--------------------------------------------------
SECTION 2 — TECH STACK
--------------------------------------------------

Frontend
React

Backend
firebase

Database
firebase


--------------------------------------------------
SECTION 3 — SYSTEM ARCHITECTURE
--------------------------------------------------

Browser
   |
React App
   |
API Gateway
   |
-------------------------------------------------
| Auth | User | Role | Post | Message | Job | Admin |
-------------------------------------------------

Principles
• Gateway validates JWT
• Services are stateless
• Services own their data

--------------------------------------------------
SECTION 4 — USER ROLES
--------------------------------------------------

Professional
Skilled Worker
Student
Recruiter

--------------------------------------------------
SECTION 5 — REGISTRATION FIELDS
--------------------------------------------------

First Name
Last Name
Gender
Date of Birth
Phone Number
Email
Password
Role

--------------------------------------------------
SECTION 6 — ROLE FEATURES
--------------------------------------------------
the form for the roles must be unique to identify the users and their needs:

Professional
• Articles
• Jobs
• Networking

Skilled Worker
• Portfolio
• Skill showcase

Student
• Internships
• Mentors


Recruiter
• Job posting
• Candidate search

--------------------------------------------------
SECTION 7 — ROLE CHANGE FLOW
--------------------------------------------------

User requests role change
→ Stored as pending
→ Admin approves or rejects

--------------------------------------------------
SECTION 8 — PROFILE STRUCTURE
--------------------------------------------------

About
Education
Experience
Skills
Certifications
Portfolio

--------------------------------------------------
SECTION 9 — CORE FEATURES
--------------------------------------------------

Connections
Messaging
Posts
Articles
Jobs

--------------------------------------------------
SECTION 10 — ADMIN PANEL
--------------------------------------------------

Admin capabilities

• Manage users
• Approve roles
• Moderate content
• Manage jobs
• Platform analytics

--------------------------------------------------
SECTION 11 — MICROSERVICES
--------------------------------------------------

Auth Service firebase
User Service firebase
Role Service firebase
Post Service firebase
Messaging Service firebase
Connection Service firebase
Job Service firebase
Admin Service firebase

--------------------------------------------------
SECTION 12 — DEVELOPMENT PHASES
--------------------------------------------------

1 Architecture
2 Database schema
3 Auth service
4 Gateway
5 User service
6 Role permissions
7 Admin workflows
8 Core features
9 Frontend
10 Security

--------------------------------------------------
Prepare a document for each service with the following:

• Service name
• Service description
• Service endpoints
• Service database schema
• Service security rules
• Service testing procedures
--------------------------------------------------
prepare a layout for the frontend
--------------------------------------------------
END OF PLAN
