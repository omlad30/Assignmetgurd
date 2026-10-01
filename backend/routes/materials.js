const express = require('express');
const router = express.Router();
const { uploadMaterial, getClassroomMaterials, deleteMaterial } = require('../controllers/materialController');
const { protect } = require('../middleware/authMiddleware');
const { materialUpload } = require('../middleware/uploadMiddleware');

// Upload study material (documents, notes, PDFs, presentations, images)
router.post('/', protect, materialUpload.single('file'), uploadMaterial);

// Get materials for a classroom (supports optional ?subject= query)
router.get('/classroom/:classroomId', protect, getClassroomMaterials);

// Delete study material
router.delete('/:id', protect, deleteMaterial);

module.exports = router;
