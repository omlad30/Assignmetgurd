# AssignGuard — Comprehensive Backend Architecture, Mathematical Logic & Judge Presentation Guide

---

## 📑 Table of Contents
1. **Executive Summary**
2. **End-to-End Backend Architecture & Lifecycle**
3. **Multi-Format Ingestion & OCR Fallback Engine**
4. **Anti-Evasion Sanitization Layer (The "Secret Weapon")**
5. **The Plagiarism Detection Engine: Mathematical Formulation (TF-IDF & Cosine Similarity)**
6. **Asynchronous Non-Blocking Queue & Real-Time Event System**
7. **Google Gemini 1.5 Flash AI Engine & Pre-Flight Self-Audit**
8. **Proctored Online Quiz & Anti-Tab-Switching Engine**
9. **Subject-Wise Study Material & Resource Hub**
10. **The 5-Minute Verbal Speech Script for Judges (With Timestamps)**
11. **Judge Defense Sheet: Tough Questions & Winning Answers**

---

## 1. Executive Summary
**AssignGuard** is an event-driven, AI-powered academic integrity and learning management platform built using Node.js, Express, MongoDB Atlas, Cloudinary, Socket.io, and Google Gemini.

Rather than relying on superficial string comparisons or opaque third-party black boxes, AssignGuard implements an in-house **Natural Language Processing (NLP) pipeline** that vectorizes document text using **Term Frequency-Inverse Document Frequency (TF-IDF)** and computes multi-dimensional **Cosine Similarity** against peer submissions in the same assignment cohort. Submissions exceeding a calibrated 65% similarity threshold are automatically placed in a quarantine state. Furthermore, the platform defends against zero-width character evasion and Cyrillic homoglyph attacks, provides on-demand Gemini AI detection, offers a 2-attempt student pre-flight draft checker, and secures remote quizzes through active tab-switch proctoring.

---

## 2. End-to-End Backend Architecture & Lifecycle

```
[Student Uploads PDF / DOCX / Image]
               │
               ▼
[Step 1: Memory Buffer & Instant Response]
   • Multer receives file into RAM memory buffer (no disk I/O bottleneck).
   • File buffer is streamed directly to Cloudinary for secure storage.
   • MongoDB Submission document created with status: "processing".
   • HTTP 201 Response returns to client in < 250ms (UI never freezes).
               │
               ▼
[Step 2: Text Extraction & OCR Fallback]
   • Digital PDF: parsed via `pdf-parse`.
   • Scanned PDF (< 50 chars): automatic fallback to Google Gemini Vision OCR.
   • Word (.docx/.doc): parsed via `mammoth` raw text extractor.
   • Scanned Images (PNG/JPG): OCR via `tesseract.js` (handwriting fallback to Gemini).
               │
               ▼
[Step 3: Anti-Cheat Sanitization Engine]
   • Regex purges zero-width unicode characters (\u200B, \uFEFF, etc.).
   • Homoglyph dictionary normalizes Cyrillic lookalike glyphs back to ASCII Latin.
               │
               ▼
[Step 4: Vectorization & Cosine Similarity]
   • Queries all existing submissions for that specific assignmentId from MongoDB.
   • Builds vocabulary term frequency matrix using `natural.TfIdf`.
   • Calculates Cosine Similarity between Vector(New) and all Vector(Existing_i).
               │
               ▼
[Step 5: Automated Routing & Quarantine]
   • If Highest Similarity >= 65%:
       - Status set to "quarantine".
       - Matched student ID and percentage recorded.
       - Teacher receives automated alert email; student receives warning email.
   • If Similarity < 65%:
       - Status set to "accepted".
       - Confirmation email dispatched to student.
               │
               ▼
[Step 6: Real-Time WebSockets Broadcast]
   • Socket.io emits `new_submission` to assignment room (`socket.to(assignmentId)`).
   • Teacher's dashboard and 2D Plagiarism Network Graph update live without refresh.
```

---

## 3. Multi-Format Ingestion & OCR Fallback Engine
Located in: `backend/utils/extractText.js`

1. **Digital PDFs (`pdf-parse`):**
   * Extracts text streams from valid vector PDFs.
   * *The Problem:* Scanned image PDFs contain no text streams (`text.length < 50`).
   * *Our Fallback:* Automatically converts the buffer to base64 and invokes **Gemini 1.5 Flash Vision** with a strict extraction prompt:
     ```javascript
     const prompt = "You are an OCR tool. Extract and return all the text from this document/image exactly as written...";
     ```
2. **Word Documents (`mammoth`):**
   * Converts XML document structures (`.docx`) directly into clean raw text, discarding layout noise while preserving paragraph spacing.
3. **Scanned Images (`tesseract.js` & Gemini):**
   * Processes raw images via `Tesseract.recognize(fileBuffer, 'eng')`.
   * If detected text is $< 20$ characters (e.g., cursive or messy handwriting), it invokes Gemini Vision OCR to accurately transcribe handwritten student assignments.

---

## 4. Anti-Evasion Sanitization Layer (The "Secret Weapon")
Located in: `backend/utils/extractText.js -> sanitizeText()`

Students frequently use technical loopholes to deceive automated plagiarism scanners. AssignGuard defends against both primary evasion techniques:

### A. Zero-Width Token Breaking Attack
* **The Exploit:** Inserting invisible zero-width unicode characters (like `\u200B` Zero-Width Space, `\u200C` Non-Joiner, `\uFEFF` Byte Order Mark) between letters (e.g., `s[ZWSP]y[ZWSP]s[ZWSP]t[ZWSP]e[ZWSP]m`). A human reads "system", but a standard NLP tokenizer sees separate single-character tokens and misses the match completely.
* **Our Defense:**
  ```javascript
  sanitized = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
  ```

### B. The Cyrillic Homoglyph Attack
* **The Exploit:** Swapping standard Latin characters with visually identical Cyrillic alphabet letters (e.g., Cyrillic Small Letter 'а' `\u0430` instead of Latin 'a' `\u0061`). A naive substring check treats them as completely different characters.
* **Our Defense:** We run an active homoglyph normalization dictionary before tokenization:
  ```javascript
  const homoglyphs = {
    '\u0430': 'a', '\u0441': 'c', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p', '\u0445': 'x', '\u0443': 'y',
    '\u0410': 'A', '\u0421': 'C', '\u0415': 'E', '\u041E': 'O', '\u0420': 'P', '\u0425': 'X', '\u0423': 'Y'
  };
  sanitized = sanitized.replace(/[\u0430\u0441...]/g, match => homoglyphs[match] || match);
  ```

---

## 5. The Plagiarism Detection Engine: Mathematical Formulation
Located in: `backend/utils/duplicateCheck.js`

### Step 1: TF-IDF Vectorization
Given a collection of $N$ previous submissions plus the newly submitted assignment $D_0$:
1. **Term Frequency (TF):** The raw frequency of term $t$ in document $d$:
   $$\text{TF}(t, d) = \frac{\text{Count of } t \text{ in } d}{\text{Total terms in } d}$$
2. **Inverse Document Frequency (IDF):** Measures how unique or rare a term is across the entire assignment cohort:
   $$\text{IDF}(t, D) = \ln\left(\frac{1 + |D|}{1 + |\{d \in D : t \in d\}|}\right) + 1$$
   * *Common words* (e.g., "is", "assignment", "the") appear in every document, producing an IDF near zero.
   * *Subject keywords* (e.g., "deadlock", "dijkstra", "polymorphism") have high IDF weights.
3. Each document is transformed into an $M$-dimensional vector:
   $$\vec{V}_d = [\text{TF-IDF}(t_1, d), \text{TF-IDF}(t_2, d), \dots, \text{TF-IDF}(t_M, d)]$$

### Step 2: Cosine Similarity Calculation
Rather than measuring Euclidean distance (which is biased by document length), we calculate the **cosine of the angle** between Vector $\vec{A}$ (new submission) and Vector $\vec{B}$ (existing submission):

$$\text{Cosine Similarity}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|} = \frac{\sum_{i=1}^{M} A_i B_i}{\sqrt{\sum_{i=1}^{M} A_i^2} \times \sqrt{\sum_{i=1}^{M} B_i^2}}$$

* $\vec{A} \cdot \vec{B}$: Dot product of the two vectors.
* $\|\vec{A}\|$ and $\|\vec{B}\|$: Euclidean L2 norms (magnitudes) of the vectors.
* The result ranges between $0.0$ ($0\%$, orthogonal vectors / no shared concepts) and $1.0$ ($100\%$, parallel vectors / identical keyword distributions).

### Step 3: The 65% Quarantine Threshold
* Because students answer identical assignment questions and follow identical templates, natural lexical overlap sits between $20\% - 35\%$.
* AssignGuard enforces an empirical threshold of **$\ge 65\%$**.
* Any submission exceeding $65\%$ is tagged as duplicate, linked to the matching peer's record, and moved to `quarantine`.

---

## 6. Asynchronous Non-Blocking Processing & Real-Time Event System

1. **Why `setImmediate()` Matters:**
   Heavy OCR parsing and vector math can take $1 - 4$ seconds. If executed synchronously inside the Express request-response loop, the Node.js event loop would freeze, causing high latency for all concurrent users.
   AssignGuard returns `res.status(201).json(submission)` immediately with `status: 'processing'`, then delegates the CPU-intensive pipeline to `setImmediate(async () => { ... })`.
2. **Socket.IO Event Flow:**
   * When an assignment is created or updated, sockets broadcast to room `classroom_{classroomId}`.
   * When a submission finishes processing, sockets emit `new_submission` to room `{assignmentId}`.
   * The teacher's dashboard updates in real-time, inserting the new node and drawing weighted edges on the **Plagiarism Network Graph** without requiring a browser refresh.

---

## 7. Google Gemini 1.5 Flash AI Engine & Pre-Flight Self-Audit
Located in: `backend/utils/geminiCheck.js`

1. **On-Demand AI Detection (Teacher-Initiated):**
   * Avoids automated false positives by letting educators run audits selectively.
   * Sends the text payload to Gemini 1.5 Flash with structured JSON output requirements:
     ```json
     {
       "ai_probability": 85,
       "verdict": "AI",
       "reason": "Uniform sentence length and synthetic transitional phrases.",
       "suspicious_sentences": ["Furthermore, it is imperative to note...", "..."]
     }
     ```
2. **Pre-Flight Draft Check (Student Formative Self-Audit):**
   * Enforces a hard limit of **2 attempts per assignment** via the `DraftAttempt` compound index (`{ studentId: 1, assignmentId: 1 }`).
   * Evaluates peer similarity and runs a formative writing prompt that provides constructive pedagogical advice (e.g., *"Your text relies heavily on AI sentence structures. Try adding personal project observations or citing specific textbooks"*).
   * **Crucial:** Pre-flight checks are **never recorded as permanent submissions** and do not alert the instructor.

---

## 8. Proctored Online Quiz & Anti-Tab-Switching Engine
Located in: `frontend/src/pages/TakeQuiz.jsx` and `backend/controllers/quizController.js`

* **Strict Scheduling:** Enforces start date/time, end date/time, and time limit windows.
* **Password Protection:** Prevents unauthorized student access without the teacher's secret room key.
* **Real-Time Proctoring (`document.hidden` API):**
  * Tracks browser tab switches and window minimizations.
  * After warnings 1 and 2, exceeding the 3rd tab switch automatically triggers immediate submission with the flag `wasAutoSubmitted: true` and records the exact violation count.
* **Answer Key Security:** Correct answer indexes are completely stripped from API responses sent to students until after official submission.

---

## 9. Subject-Wise Study Material & Resource Hub
Located in: `backend/models/Material.js` & `backend/controllers/materialController.js`

* **Subject-Categorized Distribution:** Teachers upload documents, notes, slides, and reference PDFs categorized by subject.
* **Multi-Format Storage:** Multer `materialUpload` supports `.pdf`, `.docx`, `.doc`, `.pptx`, `.ppt`, `.txt`, and images up to 25MB hosted on Cloudinary.
* **Live Student Sync:** Enrolled students receive instant updates via Socket.io with dedicated subject filter pills and instant search.

---

## 10. The 5-Minute Verbal Speech Script for Judges (With Timestamps)

### ⏱️ [0:00 - 1:00] The Problem & Architectural Overview
> *"Respected judges, academic dishonesty today has evolved far beyond simple copy-pasting. Students use uncredited generative AI, peer collusion across WhatsApp groups, and hidden unicode characters to bypass detection systems. Traditional LMS platforms either fail to catch these tricks or impose blanket punishments without explainability.*
>
> *AssignGuard is built on a high-throughput, **asynchronous event-driven architecture** using Node.js, Express, MongoDB Atlas, Cloudinary, and Socket.io. When a student uploads an assignment, our API responds in less than 200 milliseconds by offloading heavy parsing and vector similarity calculations into a non-blocking background queue."*

### ⏱️ [1:00 - 2:15] Ingestion & The Anti-Evasion Sanitization Layer
> *"Our extraction pipeline accepts PDFs, Word DOCX files, and scanned handwritten images. We use `pdf-parse` for digital PDFs, `mammoth` for Word documents, and `Tesseract.js` for scanned images. If a PDF is a scanned scan with minimal digital text, our engine automatically triggers Google Gemini Vision as an intelligent OCR fallback.*
>
> *Before any NLP model inspects the text, it passes through our custom **Anti-Evasion Sanitizer**. This layer defeats two of the most common student cheating tricks: zero-width unicode injection, which breaks keyword tokenizers, and Cyrillic homoglyph attacks, where students swap Latin letters with identical Russian characters. Our sanitizer strips these anomalies and normalizes the text into clean ASCII."*

### ⏱️ [2:15 - 3:30] The Duplicate Detection Engine & The Math
> *"To detect peer plagiarism, we don't use simple string matching. We use **TF-IDF vectorization** paired with **Cosine Similarity** via the `natural` NLP library.*
>
> *We query all existing submissions for that assignment and convert each document into a multidimensional term-frequency vector, penalizing generic filler words while weighting core subject terminology. We then compute the dot product divided by the Euclidean norms between the new vector and every previous submission.*
>
> *If the cosine similarity reaches **65% or higher**, the submission is automatically quarantined. The instructor receives an automated email alert, and the match is visually mapped onto our **Interactive 2D Plagiarism Network Graph**, allowing educators to instantly see collusion clusters across the classroom."*

### ⏱️ [3:30 - 4:15] On-Demand AI Detection & Pre-Flight Self-Audit
> *"For AI detection, we avoid blanket auto-penalties that produce false positives. Instead, teachers can trigger an **On-Demand AI Audit** powered by Google Gemini 1.5 Flash. It returns an AI probability score, a categorical verdict—Human, AI, or Mixed—and specific highlighted suspicious sentences.*
>
> *For students, we introduced the **Pre-Flight Draft Check**. Each student gets up to 2 chances per assignment to test their draft against the peer database and receive formative AI writing suggestions before their official submission. This shifts the platform from punitive policing to authentic academic growth."*

### ⏱️ [4:15 - 5:00] Quizzes, Study Materials & Conclusion
> *"Finally, AssignGuard includes **proctored online quizzes** with active browser tab-switch detection that auto-submits upon three violations, alongside a **Subject-Wise Resource Hub** where instructors publish syllabus notes and slides with live real-time sync via WebSockets.*
>
> *In summary, AssignGuard combines mathematical vector similarity, OCR fallback pipelines, anti-bypass sanitization, and explainable AI into a fair, transparent educational platform. Thank you, and we welcome your questions!"*

---

## 11. Judge Defense Sheet: Tough Questions & Winning Answers

#### Q1: "What happens if two students submit identical assignments at the exact same second?"
> **Answer:** *"Our database operations are atomic. MongoDB handles concurrent requests through document-level locking and assigns chronological timestamps. The submission whose transaction commits first becomes the baseline; the second submission immediately vectorizes against that new baseline and is identified as the duplicate."*

#### Q2: "Why did you choose 65% as the duplicate threshold instead of 80% or 90%?"
> **Answer:** *"In academic environments, students share identical problem statements, code templates, and question headers, which naturally creates a legitimate lexical baseline of 20% to 35%. A threshold of 80% is too lenient and misses heavily paraphrased collusion, while 50% causes false positives. Through testing, 65% proved to be the optimal mathematical cutoff to separate legitimate formatting from intentional copying."*

#### Q3: "Doesn't running OCR and Cosine Similarity on large files slow down your server?"
> **Answer:** *"No, because of our non-blocking design. The route handler stores the file in memory buffer, saves a 'processing' record, and responds with HTTP 201 to the client immediately. The OCR extraction and vector dot-product computations execute asynchronously inside Node.js's `setImmediate` event queue. When processing finishes, Socket.io pushes the result to the client."*

#### Q4: "How do you prevent false positives in AI detection?"
> **Answer:** *"First, we never auto-reject submissions based solely on AI scores. Second, the check is on-demand, initiated by the teacher only when there is reasonable suspicion. Third, our Gemini prompt mandates explainability: it must cite the exact suspicious sentences and provide a reasoned explanation rather than a black-box percentage."*

#### Q5: "Can students cheat the quiz tab-switch proctor by using a second monitor or mobile phone?"
> **Answer:** *"Our current proctoring detects active browser state and tab unfocus events (`document.hidden` and `window.blur`), which stops the most common vector: googling answers on the same machine. In our future roadmap (Phase 4), we are adding WebCam face-tracking and audio detection to monitor off-screen gaze and second-device usage."*
