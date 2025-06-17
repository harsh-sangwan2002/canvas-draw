import { useRef, useEffect, useState, useCallback } from "react"
import axios from "axios"

const CanvasBuilder = ({ sessionId, apiBase, canvasDimensions, onReset }) => {
    const canvasRef = useRef(null)
    const fileInputRef = useRef(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const contextRef = useRef(null)
    const [elements, setElements] = useState([])
    const [selectedElement, setSelectedElement] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [isDrawing, setIsDrawing] = useState(false)

    // Drawing state
    const [drawingState, setDrawingState] = useState({
        tool: "pen", // pen, rectangle, circle, text, image
        color: "#000000",
        strokeWidth: 2,
        startX: 0,
        startY: 0,
        fontSize: 16,
        fontFamily: "Arial",
    })

    // Text input state
    const [textInput, setTextInput] = useState("")
    const [showTextInput, setShowTextInput] = useState(false)
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Set canvas dimensions to prevent blurring
        const rect = canvas.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1

        canvas.width = canvasDimensions.width * dpr
        canvas.height = canvasDimensions.height * dpr

        // Scale the canvas back down using CSS
        canvas.style.width = canvasDimensions.width + "px"
        canvas.style.height = canvasDimensions.height + "px"

        // Get context and scale for high DPI
        const context = canvas.getContext("2d")
        context.scale(dpr, dpr)
        context.lineCap = "round"
        context.lineJoin = "round"
        context.strokeStyle = drawingState.color
        context.lineWidth = drawingState.strokeWidth

        // Set white background
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height)

        contextRef.current = context

        // Load initial canvas state
        loadElements()
    }, [canvasDimensions])

    // Load elements from server
    const loadElements = useCallback(async () => {
        try {
            const response = await axios.get(`${apiBase}/api/canvas/${sessionId}`)
            setElements(response.data.elements || [])
            redrawCanvas(response.data.elements || [])
        } catch (err) {
            console.error("Failed to load elements:", err)
            // Initialize with empty canvas if no elements exist
            setElements([])
            redrawCanvas([])
        }
    }, [apiBase, sessionId])

    // Redraw entire canvas
    const redrawCanvas = useCallback(
        (elementsToDraw = elements) => {
            const context = contextRef.current
            if (!context) return

            // Clear canvas with white background
            context.fillStyle = "#ffffff"
            context.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height)

            // Draw all elements
            elementsToDraw.forEach((element, index) => {
                context.save()

                // Set element styles
                context.strokeStyle = element.color || element.strokeColor || "#000000"
                context.lineWidth = element.width || element.strokeWidth || 2
                context.fillStyle = element.color || "#000000"

                // Highlight selected element
                if (selectedElement && element === selectedElement) {
                    context.shadowColor = "#0066ff"
                    context.shadowBlur = 5
                }

                switch (element.type) {
                    case "draw":
                        context.beginPath()
                        context.moveTo(element.startX, element.startY)
                        context.lineTo(element.endX, element.endY)
                        context.stroke()
                        break

                    case "rectangle":
                        context.beginPath()
                        context.rect(element.x, element.y, element.width, element.height)
                        context.stroke()
                        break

                    case "circle":
                        context.beginPath()
                        context.arc(element.x, element.y, element.radius, 0, 2 * Math.PI)
                        context.stroke()
                        break

                    case "text":
                        context.font = `${element.fontSize}px ${element.fontFamily}`
                        context.fillText(element.text, element.x, element.y)
                        break

                    case "image":
                        // Handle image drawing if needed
                        break
                }

                context.restore()
            })
        },
        [elements, selectedElement, canvasDimensions],
    )

    // Get mouse position relative to canvas
    const getMousePos = useCallback(
        (e) => {
            const canvas = canvasRef.current
            if (!canvas) return { x: 0, y: 0 }

            const rect = canvas.getBoundingClientRect()
            return {
                x: ((e.clientX - rect.left) * canvasDimensions.width) / rect.width,
                y: ((e.clientY - rect.top) * canvasDimensions.height) / rect.height,
            }
        },
        [canvasDimensions],
    )

    // Check if point is inside element
    const isPointInElement = useCallback((point, element) => {
        const tolerance = 10

        switch (element.type) {
            case "draw":
                // Check if point is near the line
                const dx = element.endX - element.startX
                const dy = element.endY - element.startY
                const length = Math.sqrt(dx * dx + dy * dy)
                if (length === 0) return false

                const dot = ((point.x - element.startX) * dx + (point.y - element.startY) * dy) / (length * length)
                const closestX = element.startX + dot * dx
                const closestY = element.startY + dot * dy
                const distance = Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2))
                return distance < tolerance

            case "rectangle":
                return (
                    point.x >= element.x - tolerance &&
                    point.x <= element.x + element.width + tolerance &&
                    point.y >= element.y - tolerance &&
                    point.y <= element.y + element.height + tolerance
                )

            case "circle":
                const distanceFromCenter = Math.sqrt(Math.pow(point.x - element.x, 2) + Math.pow(point.y - element.y, 2))
                return Math.abs(distanceFromCenter - element.radius) < tolerance

            case "text":
                const context = contextRef.current
                if (!context) return false
                context.font = `${element.fontSize}px ${element.fontFamily}`
                const metrics = context.measureText(element.text)
                return (
                    point.x >= element.x - tolerance &&
                    point.x <= element.x + metrics.width + tolerance &&
                    point.y >= element.y - element.fontSize - tolerance &&
                    point.y <= element.y + tolerance
                )

            default:
                return false
        }
    }, [])

    // Handle mouse down
    const handleMouseDown = useCallback(
        (e) => {
            e.preventDefault()
            const pos = getMousePos(e)

            // Check if clicking on existing element for dragging
            const clickedElement = [...elements].reverse().find((element) => isPointInElement(pos, element))

            if (clickedElement && drawingState.tool === "pen") {
                // Select and prepare for dragging
                setSelectedElement(clickedElement)
                setIsDragging(true)
                setDragOffset({
                    x: pos.x - (clickedElement.x || clickedElement.startX || 0),
                    y: pos.y - (clickedElement.y || clickedElement.startY || 0),
                })
                redrawCanvas() // Redraw to show selection
                return
            }

            // Handle text tool
            if (drawingState.tool === "text") {
                setTextPosition(pos)
                setShowTextInput(true)
                return
            }

            // Start drawing new element
            setIsDrawing(true)
            setSelectedElement(null)
            setDrawingState((prev) => ({
                ...prev,
                startX: pos.x,
                startY: pos.y,
            }))

            // For pen tool, start drawing immediately
            if (drawingState.tool === "pen") {
                const context = contextRef.current
                context.strokeStyle = drawingState.color
                context.lineWidth = drawingState.strokeWidth
                context.beginPath()
                context.moveTo(pos.x, pos.y)
            }
        },
        [drawingState, getMousePos, elements, isPointInElement, redrawCanvas],
    )

    // Handle mouse move
    const handleMouseMove = useCallback(
        (e) => {
            e.preventDefault()
            const pos = getMousePos(e)

            // Handle dragging
            if (isDragging && selectedElement) {
                const newElements = elements.map((element) => {
                    if (element === selectedElement) {
                        const newElement = { ...element }

                        if (element.type === "draw") {
                            const dx = pos.x - dragOffset.x - element.startX
                            const dy = pos.y - dragOffset.y - element.startY
                            newElement.startX = element.startX + dx
                            newElement.startY = element.startY + dy
                            newElement.endX = element.endX + dx
                            newElement.endY = element.endY + dy
                        } else {
                            newElement.x = pos.x - dragOffset.x
                            newElement.y = pos.y - dragOffset.y
                        }
                        return newElement
                    }
                    return element
                })

                setElements(newElements)
                redrawCanvas(newElements)
                return
            }

            // Handle drawing
            if (!isDrawing) return

            const context = contextRef.current
            context.strokeStyle = drawingState.color
            context.lineWidth = drawingState.strokeWidth

            if (drawingState.tool === "pen") {
                // Continue drawing line
                context.lineTo(pos.x, pos.y)
                context.stroke()
            } else {
                // Preview shape while drawing
                redrawCanvas()
                context.save()
                context.strokeStyle = drawingState.color
                context.lineWidth = drawingState.strokeWidth
                context.setLineDash([5, 5]) // Dashed preview
                context.beginPath()

                switch (drawingState.tool) {
                    case "rectangle":
                        const width = pos.x - drawingState.startX
                        const height = pos.y - drawingState.startY
                        context.rect(drawingState.startX, drawingState.startY, width, height)
                        break

                    case "circle":
                        const radius = Math.sqrt(
                            Math.pow(pos.x - drawingState.startX, 2) + Math.pow(pos.y - drawingState.startY, 2),
                        )
                        context.arc(drawingState.startX, drawingState.startY, radius, 0, 2 * Math.PI)
                        break
                }

                context.stroke()
                context.restore()
            }
        },
        [drawingState, getMousePos, isDrawing, isDragging, selectedElement, elements, dragOffset, redrawCanvas],
    )

    // Handle mouse up
    const handleMouseUp = useCallback(
        async (e) => {
            e.preventDefault()

            // Handle end of dragging
            if (isDragging && selectedElement) {
                setIsDragging(false)

                // Update element on server (if your API supports it)
                try {
                    // Note: Your current API doesn't have an update endpoint,
                    // so we'll just keep the local state updated
                    console.log("Element moved:", selectedElement)
                } catch (err) {
                    console.error("Failed to update element position:", err)
                }
                return
            }

            // Handle end of drawing
            if (!isDrawing) return

            const pos = getMousePos(e)
            setIsDrawing(false)
            setLoading(true)
            setError("")

            try {
                let endpoint = ""
                let data = {}

                switch (drawingState.tool) {
                    case "pen":
                        endpoint = `${apiBase}/api/canvas/${sessionId}/draw`
                        data = {
                            type: "line",
                            startX: drawingState.startX,
                            startY: drawingState.startY,
                            endX: pos.x,
                            endY: pos.y,
                            color: drawingState.color,
                            width: drawingState.strokeWidth,
                        }
                        break

                    case "rectangle":
                        const width = Math.abs(pos.x - drawingState.startX)
                        const height = Math.abs(pos.y - drawingState.startY)
                        if (width < 5 || height < 5) return // Ignore tiny rectangles

                        endpoint = `${apiBase}/api/canvas/${sessionId}/rectangle`
                        data = {
                            x: Math.min(drawingState.startX, pos.x),
                            y: Math.min(drawingState.startY, pos.y),
                            width: width,
                            height: height,
                            strokeColor: drawingState.color,
                            strokeWidth: drawingState.strokeWidth,
                        }
                        break

                    case "circle":
                        const radius = Math.sqrt(
                            Math.pow(pos.x - drawingState.startX, 2) + Math.pow(pos.y - drawingState.startY, 2),
                        )
                        if (radius < 5) return // Ignore tiny circles

                        endpoint = `${apiBase}/api/canvas/${sessionId}/circle`
                        data = {
                            x: drawingState.startX,
                            y: drawingState.startY,
                            radius: radius,
                            strokeColor: drawingState.color,
                            strokeWidth: drawingState.strokeWidth,
                        }
                        break

                    default:
                        return
                }

                await axios.post(endpoint, data)
                await loadElements() // Reload to get the latest state
            } catch (err) {
                setError(err.response?.data?.error || "Failed to draw")
            } finally {
                setLoading(false)
            }
        },
        [drawingState, getMousePos, isDrawing, isDragging, selectedElement, apiBase, sessionId, loadElements],
    )

    // Add text to canvas
    const addText = useCallback(async () => {
        if (!textInput.trim()) return

        setLoading(true)
        setError("")

        try {
            await axios.post(`${apiBase}/api/canvas/${sessionId}/text`, {
                x: textPosition.x,
                y: textPosition.y,
                text: textInput,
                fontSize: drawingState.fontSize,
                fontFamily: drawingState.fontFamily,
                color: drawingState.color,
            })

            await loadElements()
            setTextInput("")
            setShowTextInput(false)
        } catch (err) {
            setError(err.response?.data?.error || "Failed to add text")
        } finally {
            setLoading(false)
        }
    }, [textInput, textPosition, drawingState, apiBase, sessionId, loadElements])

    // Handle image upload
    const handleImageUpload = useCallback(
        async (e) => {
            const file = e.target.files?.[0]
            if (!file) return

            setLoading(true)
            setError("")

            try {
                const formData = new FormData()
                formData.append("image", file)

                const uploadResponse = await axios.post(`${apiBase}/api/upload`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })

                await axios.post(`${apiBase}/api/canvas/${sessionId}/image`, {
                    x: 50,
                    y: 50,
                    imageUrl: uploadResponse.data.filename,
                    width: 200,
                    height: 150,
                })

                await loadElements()
            } catch (err) {
                setError(err.response?.data?.error || "Failed to upload image")
            } finally {
                setLoading(false)
            }
        },
        [apiBase, sessionId, loadElements],
    )

    // Clear canvas
    const clearCanvas = useCallback(async () => {
        setLoading(true)
        setError("")

        try {
            await axios.delete(`${apiBase}/api/canvas/${sessionId}/clear`)
            setElements([])
            redrawCanvas([])
        } catch (err) {
            setError(err.response?.data?.error || "Failed to clear canvas")
        } finally {
            setLoading(false)
        }
    }, [apiBase, sessionId, redrawCanvas])

    // Export to PDF
    const exportToPDF = useCallback(async () => {
        setLoading(true)
        setError("")

        try {
            const response = await axios.get(`${apiBase}/api/canvas/${sessionId}/export/pdf`, {
                responseType: "blob",
            })

            const url = URL.createObjectURL(response.data)
            const link = document.createElement("a")
            link.href = url
            link.download = `canvas-${sessionId}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (err) {
            setError(err.response?.data?.error || "Failed to export PDF")
        } finally {
            setLoading(false)
        }
    }, [apiBase, sessionId])

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Toolbar */}
            <div className="lg:w-80">
                <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Tools</h3>

                    {/* Drawing Tools */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Drawing Tools</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { tool: "pen", icon: "✏️", label: "Pen" },
                                { tool: "rectangle", icon: "⬜", label: "Rectangle" },
                                { tool: "circle", icon: "⭕", label: "Circle" },
                                { tool: "text", icon: "📝", label: "Text" },
                            ].map(({ tool, icon, label }) => (
                                <button
                                    key={tool}
                                    onClick={() => {
                                        setDrawingState((prev) => ({ ...prev, tool }))
                                        setSelectedElement(null)
                                        redrawCanvas()
                                    }}
                                    className={`p-3 rounded-md border-2 transition-colors ${drawingState.tool === tool
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <div className="text-lg">{icon}</div>
                                    <div className="text-xs mt-1">{label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <input
                            type="color"
                            value={drawingState.color}
                            onChange={(e) => setDrawingState((prev) => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 rounded-md border border-gray-300"
                        />
                    </div>

                    {/* Stroke Width */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stroke Width: {drawingState.strokeWidth}px
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={drawingState.strokeWidth}
                            onChange={(e) => setDrawingState((prev) => ({ ...prev, strokeWidth: Number.parseInt(e.target.value) }))}
                            className="w-full"
                        />
                    </div>

                    {/* Font Size (for text tool) */}
                    {drawingState.tool === "text" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Font Size: {drawingState.fontSize}px
                            </label>
                            <input
                                type="range"
                                min="12"
                                max="72"
                                value={drawingState.fontSize}
                                onChange={(e) => setDrawingState((prev) => ({ ...prev, fontSize: Number.parseInt(e.target.value) }))}
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Selection Info */}
                    {selectedElement && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <div className="text-sm font-medium text-blue-900">Selected Element</div>
                            <div className="text-xs text-blue-700 mt-1">
                                Type: {selectedElement.type}
                                <br />
                                Click and drag to move
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                        >
                            📷 Add Image
                        </button>

                        <button
                            onClick={clearCanvas}
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                        >
                            🗑️ Clear Canvas
                        </button>

                        <button
                            onClick={exportToPDF}
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                        >
                            📄 Export PDF
                        </button>

                        <button
                            onClick={onReset}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                        >
                            🔄 Reset Canvas
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
                    )}
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Canvas ({canvasDimensions.width} × {canvasDimensions.height})
                        </h3>
                        {loading && <div className="text-blue-600 text-sm">Processing...</div>}
                        {selectedElement && <div className="text-sm text-blue-600">Element selected - drag to move</div>}
                    </div>

                    <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className={`block ${isDragging ? "cursor-grabbing" : selectedElement ? "cursor-grab" : "cursor-crosshair"
                                }`}
                            style={{
                                width: `${canvasDimensions.width}px`,
                                height: `${canvasDimensions.height}px`,
                                maxWidth: "100%",
                                maxHeight: "70vh",
                                objectFit: "contain",
                            }}
                        />

                        {/* Text Input Overlay */}
                        {showTextInput && (
                            <div
                                className="absolute bg-white border border-gray-300 rounded-md p-3 shadow-lg z-10"
                                style={{
                                    left: `${(textPosition.x / canvasDimensions.width) * 100}%`,
                                    top: `${(textPosition.y / canvasDimensions.height) * 100}%`,
                                    transform: "translate(-50%, -100%)",
                                }}
                            >
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Enter text..."
                                    className="w-40 px-2 py-1 border border-gray-300 rounded text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") addText()
                                        if (e.key === "Escape") setShowTextInput(false)
                                    }}
                                    autoFocus
                                />
                                <div className="flex gap-1 mt-2">
                                    <button
                                        onClick={addText}
                                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowTextInput(false)}
                                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
    )
}

export default CanvasBuilder
