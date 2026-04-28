# AssignGuard

An AI-powered assignment submission and duplicate detection software for educational institutions.

## Features
- **Two Roles**: Teacher and Student.
- **AI Plagiarism Detection**: Detects matching text among peers using `natural` Cosine Similarity and TF-IDF.
- **AI AI-Generation Check**: Leverages Google Gemini 2.5 Flash to automatically detect LLM-written assignments.
- **OAuth Integration**: One-click Google Sign in using Passport.js.
- **File Parsing**: Extracts text directly from DOCX (`mammoth`) and PDF (`pdf-parse`) uploads.
- **Cloud Delivery**: Files are stored safely in Cloudinary.
- **Email Notifications**: Automatic alerts to teacher and student on submission via Nodemailer.

## Structure
- `/backend`: Node.js, Express, MongoDB.
- `/frontend`: React, Vite, Tailwind CSS.

## Getting Started

1. Set up your MongoDB Atlas cluster.
2. Get your Gemini API key from Google AI Studio.
3. Configure your Google OAuth client in Google Cloud Console.
4. Fill in `backend/.env` with your keys.
5. In `/backend`, run `npm i --legacy-peer-deps` then `npm run dev`.
6. Fill in `frontend/.env` with your Google Client ID.
7. In `/frontend`, run `npm install` then `npm run dev`.
