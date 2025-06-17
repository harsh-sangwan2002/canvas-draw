# 🎨 Canvas Builder

> A powerful, interactive canvas drawing application built with React and Node.js. Create beautiful designs, add shapes, text, and images, then export your masterpieces as PDF.

## ✨ Features

### 🖌️ **Drawing Tools**

- **Pen Tool** - Freehand drawing with customizable stroke width
- **Rectangle Tool** - Perfect rectangles and squares
- **Circle Tool** - Smooth circles with precise radius control
- **Text Tool** - Add text with custom fonts and sizes

### 🎯 **Interactive Elements**

- **Drag & Drop** - Move any element around the canvas
- **Element Selection** - Click to select and highlight elements
- **Real-time Preview** - See your shapes as you draw them
- **Visual Feedback** - Selected elements glow with blue highlights

### 🎨 **Customization**

- **Color Picker** - Choose any color for your elements
- **Stroke Width** - Adjustable from 1px to 20px
- **Font Sizing** - Text from 12px to 72px
- **Canvas Dimensions** - Custom width and height (100px - 2000px)

### 📤 **Export & Share**

- **PDF Export** - High-quality PDF generation
- **Image Upload** - Add images to your canvas
- **Session Management** - Save and restore your work
- **Clear Canvas** - Start fresh anytime

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/canvas-builder.git
   cd canvas-builder
   \`\`\`

2. **Install backend dependencies**
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

3. **Install frontend dependencies**
   \`\`\`bash
   cd ../frontend
   npm install
   \`\`\`

4. **Start the backend server**
   \`\`\`bash
   cd ../backend
   npm start

   # Server runs on http://localhost:8080

   \`\`\`

5. **Start the frontend application**
   \`\`\`bash
   cd ../frontend
   npm start

   # App runs on http://localhost:3000

   \`\`\`

6. **Open your browser**
   Navigate to \`http://localhost:3000\` and start creating!

## 🏗️ Architecture

### Frontend (React)

\`\`\`
src/
├── components/
│ ├── CanvasBuilder.jsx # Main canvas component
│ └── ...
├── App.jsx # Root component
└── index.css # Tailwind styles
\`\`\`

### Backend (Node.js/Express)

\`\`\`
backend/
├── routes/
│ └── canvas.js # Canvas API routes
├── uploads/ # Image storage
├── server.js # Express server
└── package.json
\`\`\`

## 🔌 API Endpoints

### Canvas Management

- \`POST /api/canvas/init\` - Initialize new canvas session
- \`GET /api/canvas/:sessionId\` - Get canvas data
- \`DELETE /api/canvas/:sessionId/clear\` - Clear canvas

### Drawing Operations

- \`POST /api/canvas/:sessionId/draw\` - Add line/pen strokes
- \`POST /api/canvas/:sessionId/rectangle\` - Add rectangle
- \`POST /api/canvas/:sessionId/circle\` - Add circle
- \`POST /api/canvas/:sessionId/text\` - Add text

### Media & Export

- \`POST /api/upload\` - Upload images
- \`POST /api/canvas/:sessionId/image\` - Add image to canvas
- \`GET /api/canvas/:sessionId/export/pdf\` - Export as PDF
- \`GET /api/canvas/:sessionId/preview\` - Get canvas preview

## 🎮 Usage Guide

### Getting Started

1. **Initialize Canvas** - Set your desired width and height
2. **Choose a Tool** - Select from pen, rectangle, circle, or text
3. **Customize Settings** - Pick colors, stroke width, font size
4. **Start Creating** - Click and drag to draw shapes

### Drawing Shapes

- **Pen**: Click and drag to draw freehand
- **Rectangle**: Click and drag from corner to corner
- **Circle**: Click center point and drag to set radius
- **Text**: Click where you want text, then type

### Moving Elements

1. Select the **Pen tool**
2. Click on any existing element to select it
3. Drag the selected element to move it
4. Click elsewhere to deselect

### Adding Images

1. Click **"Add Image"** button
2. Choose an image file (JPG, PNG, GIF)
3. Image appears on canvas and can be moved

## 🚀 Deployment

### Frontend (Vercel)

\`\`\`bash

# Deploy to Vercel

npm install -g vercel
vercel --prod
\`\`\`

### Backend (Railway)

\`\`\`bash

# Deploy to Railway

# Connect your GitHub repo at railway.app

# Railway auto-deploys on push

\`\`\`

### Environment Variables

\`\`\`env

# Frontend (.env)

REACT_APP_API_BASE=https://your-backend-url.railway.app

# Backend (.env)

PORT=8080
NODE_ENV=production
\`\`\`

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **HTML5 Canvas** - Drawing surface

### Backend

- **Node.js** - Runtime
- **Express.js** - Web framework
- **Canvas** - Server-side canvas rendering
- **PDFKit** - PDF generation
- **Multer** - File uploads
- **Sharp** - Image processing

## 🎨 Screenshots

### Main Interface

![Main Interface](https://via.placeholder.com/600x400/F3F4F6/374151?text=Drawing+Interface)

### Drawing Tools

![Drawing Tools](https://via.placeholder.com/300x400/EF4444/FFFFFF?text=Tools+Panel)

### Canvas in Action

![Canvas Drawing](https://via.placeholder.com/600x400/10B981/FFFFFF?text=Canvas+Drawing)

## 🤝 Contributing

We love contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   \`\`\`bash
   git checkout -b feature/amazing-feature
   \`\`\`
3. **Make your changes**
4. **Commit your changes**
   \`\`\`bash
   git commit -m 'Add amazing feature'
   \`\`\`
5. **Push to the branch**
   \`\`\`bash
   git push origin feature/amazing-feature
   \`\`\`
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 Roadmap

### 🔄 Version 2.0

- [ ] **Undo/Redo System** - History management
- [ ] **Layers Panel** - Organize elements in layers
- [ ] **Multi-select** - Select multiple elements
- [ ] **Resize Handles** - Resize elements visually

### 🎯 Version 2.1

- [ ] **Collaboration** - Real-time multi-user editing
- [ ] **Templates** - Pre-made canvas templates
- [ ] **Advanced Shapes** - Polygons, arrows, curves
- [ ] **Grid & Snap** - Precision alignment tools

### 🚀 Version 3.0

- [ ] **Mobile App** - React Native version
- [ ] **Cloud Storage** - Save canvases to cloud
- [ ] **Animation** - Animated elements
- [ ] **3D Elements** - Basic 3D shape support

## 🐛 Known Issues

- Drag and drop may be sensitive on touch devices
- Large images might affect performance
- PDF export limited to canvas dimensions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Canvas API** - For powerful drawing capabilities
- **Tailwind CSS** - For beautiful, responsive design
- **React Community** - For amazing tools and support
- **Open Source Contributors** - For inspiration and code

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/canvas-builder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/canvas-builder/discussions)
- **Email**: support@canvasbuilder.com

---

<div align="center">

**Made with ❤️ by [Your Name](https://github.com/yourusername)**

[⭐ Star this repo](https://github.com/yourusername/canvas-builder) • [🐛 Report Bug](https://github.com/yourusername/canvas-builder/issues) • [✨ Request Feature](https://github.com/yourusername/canvas-builder/issues)

</div>