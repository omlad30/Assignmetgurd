const multer = require('multer');

// Store file in memory to allow processing before uploading to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/msword' ||
    file.mimetype.startsWith('image/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, and Image files are allowed!'), false);
  }
};

const materialFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, PPT, TXT, and Image files are supported for study materials!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const materialUpload = multer({
  storage,
  fileFilter: materialFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

module.exports = { upload, materialUpload };

