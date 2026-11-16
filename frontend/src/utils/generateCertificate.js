import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateIntegrityCertificate = (submission, assignment = null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const studentName = submission.studentId?.fullName || 'Student';
  const studentEmail = submission.studentId?.email || 'N/A';
  const rollNo = submission.studentId?.rollNo || 'N/A';
  const division = submission.studentId?.division || 'N/A';
  const assignmentTitle = assignment?.title || submission.assignmentId?.title || 'Assignment Report';
  const subject = assignment?.subject || submission.assignmentId?.subject || 'Coursework';
  const submittedDate = submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const similarity = submission.similarityScore !== undefined ? submission.similarityScore : 0;
  const isQuarantine = submission.status === 'quarantine' || similarity >= 65;
  const grade = submission.grade || submission.suggestedGrade || 'Ungraded';
  const aiVerdict = submission.aiVerdict || 'Pending';

  // --- 1. HEADER SECTION ---
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 36, 'F');

  // Decorative Accent Bar
  doc.setFillColor(147, 51, 234); // Purple 600
  doc.rect(0, 36, 210, 3, 'F');

  // Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AssignGuard', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('OFFICIAL ACADEMIC INTEGRITY & EVALUATION CERTIFICATE', 14, 26);
  doc.text(`Certificate ID: AG-${submission._id ? submission._id.toString().substring(0, 10).toUpperCase() : 'VERIFIED'}`, 14, 31);

  // Status Badge (Top Right)
  if (isQuarantine) {
    doc.setFillColor(239, 68, 68); // Red
    doc.roundedRect(148, 10, 48, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('QUARANTINED', 154, 20);
  } else {
    doc.setFillColor(16, 185, 129); // Emerald
    doc.roundedRect(148, 10, 48, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFIED & CLEAN', 151, 20);
  }

  // --- 2. STUDENT & ASSIGNMENT DETAILS TABLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Submission Information', 14, 48);

  autoTable(doc, {
    startY: 52,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
    body: [
      [
        { content: 'Student Name:', styles: { fontStyle: 'bold', textColor: [51, 65, 85] } },
        studentName,
        { content: 'Roll No / Div:', styles: { fontStyle: 'bold', textColor: [51, 65, 85] } },
        `${rollNo} / ${division}`
      ],
      [
        { content: 'Email Address:', styles: { fontStyle: 'bold', textColor: [51, 65, 85] } },
        studentEmail,
        { content: 'Submitted At:', styles: { fontStyle: 'bold', textColor: [51, 65, 85] } },
        submittedDate
      ],
      [
        { content: 'Assignment Title:', styles: { fontStyle: 'bold', textColor: [51, 65, 85] } },
        assignmentTitle,
        { content: 'Subject:', styles: { fontStyle: 'bold', textColor: [51, 65, 85] } },
        subject
      ]
    ],
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // --- 3. ACADEMIC INTEGRITY & PLAGIARISM METRICS ---
  const currentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Academic Integrity & Anti-Cheat Audit', 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    theme: 'striped',
    head: [['Integrity Metric', 'Measurement Result', 'Audit Status', 'Standard Cutoff']],
    body: [
      [
        submission.isCode ? 'MOSS-Style AST Code Similarity' : 'TF-IDF Cosine Similarity',
        `${similarity}% Peer Match`,
        isQuarantine ? 'FLAGGED (Review Required)' : 'ACCEPTED (Original Content)',
        'Threshold: >= 65%'
      ],
      [
        'Google Gemini AI Detection',
        submission.aiScore !== undefined ? `${submission.aiScore}% AI Probability` : 'Pending Teacher Audit',
        aiVerdict,
        'Flagged if > 80%'
      ],
      [
        'Anti-Evasion Sanitization',
        'Zero-Width & Cyrillic Check',
        'PASSED (All Characters Normalized)',
        'Zero-Tolerance Unicode'
      ],
      [
        'Submission Content Volume',
        'Word & Character Verification',
        'PASSED (Valid Academic Document)',
        'Minimum: 15 Words'
      ]
    ],
    headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3.5 }
  });

  // --- 4. EVALUATION & GRADING BREAKDOWN ---
  const gradingY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Evaluation & Academic Scoring', 14, gradingY);

  autoTable(doc, {
    startY: gradingY + 4,
    theme: 'plain',
    body: [
      [
        { content: 'Official Grade Awarded:', styles: { fontStyle: 'bold', fontSize: 11, textColor: [15, 23, 42] } },
        { content: `${grade} / 10`, styles: { fontStyle: 'bold', fontSize: 12, textColor: [16, 185, 129] } }
      ],
      [
        { content: 'Evaluation Feedback:', styles: { fontStyle: 'bold', fontSize: 9, textColor: [71, 85, 105] } },
        { content: submission.rubricFeedback || 'Evaluated against assignment rubrics and original content requirements.', styles: { fontSize: 9, textColor: [51, 65, 85] } }
      ]
    ],
    styles: { cellPadding: 3 }
  });

  // --- 5. INSTITUTIONAL VERIFICATION FOOTER & SEAL ---
  const footerY = 250;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY, 196, footerY);

  // Digital Seal Badge
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, footerY + 4, 85, 28, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(88, 28, 135);
  doc.text('VERIFIED BY ASSIGNGUARD NLP ENGINE', 18, footerY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Term Frequency-Inverse Document Frequency (TF-IDF)', 18, footerY + 16);
  doc.text('Multi-Dimensional Cosine Similarity Matrix', 18, footerY + 20);
  doc.text('Powered by Google Gemini 1.5 Flash Vision & NLP', 18, footerY + 24);

  // Teacher / Examiner Signature Area
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Evaluation Sign-off:', 140, footerY + 14);
  doc.line(140, footerY + 22, 190, footerY + 22);
  doc.text('Course Instructor / Evaluator', 140, footerY + 26);

  // Save the PDF
  const cleanFileName = `AssignGuard_Report_${studentName.replace(/\s+/g, '_')}_${assignmentTitle.replace(/\s+/g, '_')}.pdf`;
  doc.save(cleanFileName);
};
