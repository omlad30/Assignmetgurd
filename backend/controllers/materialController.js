const Material = require('../models/Material');
const Classroom = require('../models/Classroom');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Helper to determine simplified file category
const getFileType = (fileName, mimeType) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) return 'docx';
  if (['ppt', 'pptx'].includes(ext) || mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'pptx';
  if (ext === 'txt' || mimeType === 'text/plain') return 'txt';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || mimeType.startsWith('image/')) return 'image';
  return ext || 'document';
};

// @route   POST /api/materials
// @desc    Upload study material for a classroom & subject
// @access  Teacher / Admin
exports.uploadMaterial = async (req, res) => {
  try {
    const { title, subject, description, classroomId } = req.body;
    const teacherId = req.user._id;

    if (!title || !subject || !classroomId) {
      return res.status(400).json({ message: 'Title, subject, and classroom are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please attach a document, notes, PDF, or image file.' });
    }

    // Verify classroom exists & check permissions
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }

    if (classroom.teacherId.toString() !== teacherId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the classroom instructor can upload study materials.' });
    }

    // Prepare upload to Cloudinary
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const isRaw = !['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext);
    const baseName = req.file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = `${baseName}_${Date.now()}${isRaw ? '.' + ext : ''}`;

    const fileUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'study_materials',
          public_id: publicId,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(stream);
    });

    const fileType = getFileType(req.file.originalname, req.file.mimetype);

    const material = await Material.create({
      title: title.trim(),
      subject: subject.trim(),
      description: (description || '').trim(),
      classroomId,
      teacherId,
      fileUrl,
      fileName: req.file.originalname,
      fileType,
      fileSize: req.file.size || 0,
    });

    const populatedMaterial = await Material.findById(material._id).populate('teacherId', 'fullName email');

    // Real-time notification to students in the classroom
    if (req.io) {
      req.io.to(`classroom_${classroomId}`).emit('material_uploaded', populatedMaterial);
    }

    res.status(201).json(populatedMaterial);
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ message: 'Failed to upload study material', error: error.message });
  }
};

// @route   GET /api/materials/classroom/:classroomId
// @desc    Get all study materials for a classroom (supports ?subject= query)
// @access  Protected (Enrolled students, Classroom Teacher, Admin)
exports.getClassroomMaterials = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { subject } = req.query;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }

    const isTeacher = classroom.teacherId.toString() === req.user._id.toString();
    const isEnrolledStudent = classroom.students.some(id => id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isTeacher && !isEnrolledStudent && !isAdmin) {
      return res.status(403).json({ message: 'You must be enrolled in this classroom to view study materials.' });
    }

    const query = { classroomId };
    if (subject && subject.trim() && subject.toLowerCase() !== 'all') {
      query.subject = new RegExp(`^${subject.trim()}$`, 'i');
    }

    const materials = await Material.find(query)
      .populate('teacherId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Failed to fetch study materials', error: error.message });
  }
};

// @route   DELETE /api/materials/:id
// @desc    Delete study material
// @access  Teacher / Admin
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found.' });
    }

    const classroom = await Classroom.findById(material.classroomId);
    const isTeacher = classroom && classroom.teacherId.toString() === req.user._id.toString();
    const isAuthor = material.teacherId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isTeacher && !isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this study material.' });
    }

    await Material.findByIdAndDelete(req.params.id);

    // Real-time notification to students in the classroom
    if (req.io) {
      req.io.to(`classroom_${material.classroomId}`).emit('material_deleted', req.params.id);
    }

    res.json({ message: 'Study material deleted successfully', materialId: req.params.id });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: 'Failed to delete study material', error: error.message });
  }
};
