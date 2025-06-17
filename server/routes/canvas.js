const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Store canvas sessions in memory (use Redis/Database in production)
const canvasSessions = new Map();

// Initialize canvas
router.post('/init', (req, res) => {
    try {
        const { width = 800, height = 600 } = req.body;

        if (width < 100 || width > 2000 || height < 100 || height > 2000) {
            return res.status(400).json({ error: 'Canvas dimensions must be between 100x100 and 2000x2000' });
        }

        const sessionId = uuidv4();
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Initialize with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        canvasSessions.set(sessionId, {
            canvas,
            ctx,
            elements: [],
            width,
            height
        });

        res.json({
            success: true,
            sessionId,
            width,
            height
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add rectangle
router.post('/:sessionId/rectangle', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { x, y, width, height, fillColor = '#000000', strokeColor, strokeWidth = 1 } = req.body;

        const session = canvasSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { ctx } = session;

        // Draw rectangle
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, width, height);
        }

        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(x, y, width, height);
        }

        // Store element info
        session.elements.push({
            type: 'rectangle',
            x, y, width, height, fillColor, strokeColor, strokeWidth
        });

        res.json({ success: true, message: 'Rectangle added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add circle
router.post('/:sessionId/circle', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { x, y, radius, fillColor = '#000000', strokeColor, strokeWidth = 1 } = req.body;

        const session = canvasSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { ctx } = session;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
        }

        session.elements.push({
            type: 'circle',
            x, y, radius, fillColor, strokeColor, strokeWidth
        });

        res.json({ success: true, message: 'Circle added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add text
router.post('/:sessionId/text', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { x, y, text, fontSize = 16, fontFamily = 'Arial', color = '#000000' } = req.body;

        const session = canvasSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { ctx } = session;

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);

        session.elements.push({
            type: 'text',
            x, y, text, fontSize, fontFamily, color
        });

        res.json({ success: true, message: 'Text added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add image
router.post('/:sessionId/image', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { x, y, width, height, imageUrl } = req.body;

        const session = canvasSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { ctx } = session;

        let imagePath;
        if (imageUrl.startsWith('http')) {
            // External URL
            imagePath = imageUrl;
        } else {
            // Local file
            imagePath = path.join(__dirname, '..', 'uploads', path.basename(imageUrl));
        }

        const image = await loadImage(imagePath);
        ctx.drawImage(image, x, y, width || image.width, height || image.height);

        session.elements.push({
            type: 'image',
            x, y, width: width || image.width, height: height || image.height, imageUrl
        });

        res.json({ success: true, message: 'Image added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get canvas preview
router.get('/:sessionId/preview', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = canvasSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const buffer = session.canvas.toBuffer('image/png');

        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export as PDF
router.get('/:sessionId/export/pdf', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = canvasSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Create PDF document
        const doc = new PDFDocument({
            size: [session.width, session.height],
            margin: 0
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="canvas-export-${sessionId}.pdf"`);

        // Pipe PDF to response
        doc.pipe(res);

        // Convert canvas to image and add to PDF
        const canvasBuffer = session.canvas.toBuffer('image/png');

        // Optimize image size for PDF
        const optimizedBuffer = await sharp(canvasBuffer)
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();

        doc.image(optimizedBuffer, 0, 0, {
            width: session.width,
            height: session.height
        });

        // Finalize PDF
        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get session info
router.get('/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = canvasSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            sessionId,
            width: session.width,
            height: session.height,
            elements: session.elements
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear canvas
router.delete('/:sessionId/clear', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = canvasSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Clear canvas
        session.ctx.fillStyle = 'white';
        session.ctx.fillRect(0, 0, session.width, session.height);
        session.elements = [];

        res.json({ success: true, message: 'Canvas cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add drawing
router.post('/:sessionId/draw', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { type, startX, startY, endX, endY, color = '#000000', width = 2 } = req.body;

        const session = canvasSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { ctx } = session;

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';

        switch (type) {
            case 'line':
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                break;

            case 'rectangle':
                ctx.beginPath();
                ctx.rect(startX, startY, endX - startX, endY - startY);
                ctx.stroke();
                break;

            case 'circle':
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                ctx.beginPath();
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;

            default:
                return res.status(400).json({ error: 'Invalid drawing type' });
        }

        // Store element info
        session.elements.push({
            type: 'draw',
            drawType: type,
            startX,
            startY,
            endX,
            endY,
            color,
            width
        });

        res.json({ success: true, message: 'Drawing added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;