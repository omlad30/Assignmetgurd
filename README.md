# AssignGuard

> **Live Demo:** [Insert Live Link Here]

An AI-powered assignment submission and duplicate detection software for educational institutions. AssignGuard streamlines the grading process by automatically checking for plagiarism among peers and detecting AI-generated content.

## 📸 Screenshots
*(Add screenshots of your application here to give recruiters a quick overview of the UI)*
- **Teacher Dashboard**: `![Teacher Dashboard](link-to-image)`
- **AI Analysis**: `![AI Analysis Result](link-to-image)`
- **Login Screen**: `![Login Screen](link-to-image)`

## 🚀 Test Drive
To test the live application without creating a new account, you can securely log in using any standard Google Account via our OAuth integration.

## ✨ Features
- **Role-Based Access**: Dedicated workflows for Teachers and Students.
- **AI Plagiarism Detection**: Detects matching text among peers using Cosine Similarity and TF-IDF (`natural` package).
- **AI Generation Check**: Leverages Google Gemini 2.5 Flash to automatically detect LLM-written assignments.
- **Secure Authentication**: One-click Google Sign in using Passport.js and Firebase.
- **File Parsing**: Extracts text directly from DOCX (`mammoth`) and PDF (`pdf-parse`) uploads.
- **Cloud Delivery**: Files are stored safely and efficiently in Cloudinary.
- **Email Notifications**: Automatic alerts to teachers and students on submission via Nodemailer.

## 🛠️ Architecture & Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: React, Vite, Tailwind CSS
- **AI & Integrations**: Google Gemini API, Firebase Admin, Cloudinary, Passport.js

## 🚦 Getting Started (Local Development)

1. Set up your MongoDB Atlas cluster.
2. Get your Gemini API key from Google AI Studio.
3. Configure your Google OAuth client in Google Cloud Console.
4. Fill in `backend/.env` with your keys (see `backend/.env.example`).
5. In `/backend`, run `npm i --legacy-peer-deps` then `npm run dev`.
6. Fill in `frontend/.env` with your Google Client ID.
7. In `/frontend`, run `npm install` then `npm run dev`.
