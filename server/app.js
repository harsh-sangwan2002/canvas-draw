const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const canvasRoutes = require('./routes/canvas');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://canvas-draw-harsh.vercel.app/'
    ]
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Routes
app.use('/api/canvas', canvasRoutes);

// File upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
        success: true,
        filename: req.file.filename,
        url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Canvas Builder API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});