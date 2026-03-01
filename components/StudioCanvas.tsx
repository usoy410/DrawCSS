"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Pencil,
    Eraser,
    Type,
    Undo2,
    Redo2,
    RotateCcw,
    Monitor,
    Smartphone,
    ChevronLeft,
    X,
    CornerDownLeft,
    Send,
    Square,
    Circle as CircleIcon,
    Minus,
    Shapes
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StudioCanvasProps {
    onSubmit: (base64: string) => void;
    loading?: boolean;
}

type Tool = "pencil" | "eraser" | "text" | "shape";
type ShapeType = "rect" | "circle" | "line";

export function StudioCanvas({ onSubmit, loading }: StudioCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeTool, setActiveTool] = useState<Tool>("pencil");
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
    const [isResizing, setIsResizing] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [brushSize, setBrushSize] = useState(3);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [showSettings, setShowSettings] = useState(false);
    const [textInput, setTextInput] = useState<{ open: boolean, x: number, y: number, value: string } | null>(null);
    const [selectedShape, setSelectedShape] = useState<ShapeType>("rect");
    const [isShapeModalOpen, setIsShapeModalOpen] = useState(false);
    const [shapeStartPos, setShapeStartPos] = useState<{ x: number, y: number } | null>(null);
    const [previewImageData, setPreviewImageData] = useState<ImageData | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Handle keyboard for panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") setIsSpacePressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") setIsSpacePressed(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Initialize and handle orientation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const setupCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            // Save content before resize
            const currentContent = canvas.toDataURL();

            canvas.width = canvasSize.width;
            canvas.height = canvasSize.height;

            // Initial state (black bg)
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Restore content if any
            if (historyStep >= 0) {
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0);
                img.src = currentContent;
            }

            ctx.strokeStyle = "white";
            ctx.lineWidth = brushSize;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.font = "20px Inter, sans-serif";
        };

        setupCanvas();
    }, [canvasSize.width, canvasSize.height]);

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newStep = canvas.toDataURL();
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newStep);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    }, [history, historyStep]);

    const undo = () => {
        if (historyStep <= 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        const prevStep = history[historyStep - 1];
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setHistoryStep(historyStep - 1);
        };
        img.src = prevStep;
    };

    const redo = () => {
        if (historyStep >= history.length - 1) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        const nextStep = history[historyStep + 1];
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setHistoryStep(historyStep + 1);
        };
        img.src = nextStep;
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        return {
            x: (clientX - rect.left) / zoom,
            y: (clientY - rect.top) / zoom
        };
    };

    const startAction = (e: React.MouseEvent | React.TouchEvent) => {
        if (isSpacePressed || (e as React.MouseEvent).button === 1) {
            setIsPanning(true);
            return;
        }

        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        if (activeTool === "text" || textInput?.open) {
            if (!textInput?.open) setTextInput({ open: true, x, y, value: "" });
            return;
        }

        if (activeTool === "shape") {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    setPreviewImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
                }
            }
            setShapeStartPos({ x, y });
            setIsDrawing(true);
            return;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = activeTool === "eraser" ? "#0a0a0a" : "white";
        ctx.lineWidth = activeTool === "eraser" ? brushSize * 5 : brushSize;
        setIsDrawing(true);
    };

    const moveAction = (e: React.MouseEvent | React.TouchEvent) => {
        if (isPanning) {
            const mouseEvent = e as React.MouseEvent;
            setPan(prev => ({
                x: prev.x + mouseEvent.movementX,
                y: prev.y + mouseEvent.movementY
            }));
            return;
        }

        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        if (activeTool === "shape" && shapeStartPos && previewImageData) {
            ctx.putImageData(previewImageData, 0, 0);
            ctx.strokeStyle = "white";
            ctx.lineWidth = brushSize;
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";

            const width = x - shapeStartPos.x;
            const height = y - shapeStartPos.y;

            if (selectedShape === "rect") {
                ctx.strokeRect(shapeStartPos.x, shapeStartPos.y, width, height);
                ctx.fillRect(shapeStartPos.x, shapeStartPos.y, width, height);
            } else if (selectedShape === "circle") {
                const radius = Math.sqrt(width * width + height * height);
                ctx.beginPath();
                ctx.arc(shapeStartPos.x, shapeStartPos.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();
            } else if (selectedShape === "line") {
                ctx.beginPath();
                ctx.moveTo(shapeStartPos.x, shapeStartPos.y);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
            return;
        }

        if (activeTool === "shape") return;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endAction = () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }
        if (isDrawing) {
            setIsDrawing(false);
            setShapeStartPos(null);
            setPreviewImageData(null);
            saveToHistory();
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (textInput?.open) return;
        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
            const delta = -e.deltaY;
            const factor = delta > 0 ? 1.1 : 0.9;
            setZoom(prev => Math.min(Math.max(prev * factor, 0.5), 5));
        } else {
            setPan(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#050505] overflow-hidden">
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                        <ChevronLeft className="w-5 h-5 text-white/40 group-hover:text-white" />
                    </Link>
                    <div className="h-6 w-px bg-white/10" />
                    <h1 className="text-sm font-medium tracking-tight text-white/80">Drawing Studio <span className="text-white/20 font-mono text-xs">v1.2</span></h1>
                </div>

                <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-white/5 bg-white/5">
                    <input
                        type="number"
                        value={canvasSize.width}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCanvasSize(prev => ({ ...prev, width: Math.max(200, val) }));
                        }}
                        className="w-12 bg-transparent text-[10px] font-mono text-white/60 focus:text-white focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Canvas Width"
                    />
                    <span className="text-[10px] text-white/20 font-mono">x</span>
                    <input
                        type="number"
                        value={canvasSize.height}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCanvasSize(prev => ({ ...prev, height: Math.max(200, val) }));
                        }}
                        className="w-12 bg-transparent text-[10px] font-mono text-white/60 focus:text-white focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Canvas Height"
                    />
                </div>

                <button
                    onClick={() => canvasRef.current && onSubmit(canvasRef.current.toDataURL("image/png"))}
                    disabled={loading || historyStep < 0}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                        historyStep >= 0 && !loading ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]" : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                    )}
                >
                    {loading ? "Processing..." : <><Send className="w-3.5 h-3.5" /> Generate Code</>}
                </button>
            </header>

            <div className="flex flex-1 relative overflow-hidden">
                <aside className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-2 glass rounded-2xl border border-white/10 z-20">
                    {[
                        { id: "pencil", icon: Pencil, label: "Pencil", slider: true },
                        { id: "eraser", icon: Eraser, label: "Eraser", slider: true },
                        { id: "shape", icon: Shapes, label: "Shapes", slider: false },
                        { id: "text", icon: Type, label: "Text", slider: false },
                    ].map((tool) => (
                        <div key={tool.id} className="relative group">
                            <button
                                onClick={() => {
                                    if (tool.id === "shape") {
                                        setActiveTool("shape");
                                        setIsShapeModalOpen(true);
                                        return;
                                    }
                                    if (activeTool === tool.id && tool.slider) {
                                        setShowSettings(!showSettings);
                                    } else {
                                        setActiveTool(tool.id as Tool);
                                        setShowSettings(false);
                                    }
                                }}
                                className={cn(
                                    "p-3 rounded-xl transition-all relative",
                                    activeTool === tool.id ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-white/40 hover:bg-white/5 hover:text-white/60"
                                )}
                                title={tool.label}
                            >
                                <tool.icon className="w-5 h-5" />
                                {tool.slider && activeTool === tool.id && (
                                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-black" />
                                )}
                            </button>

                            {tool.id === "shape" && isShapeModalOpen && (
                                <div className="absolute left-full ml-4 top-0 p-4 glass rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-left-2 z-50 min-w-[200px]">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Shape</span>
                                            <button onClick={() => setIsShapeModalOpen(false)} className="text-white/20 hover:text-white/60">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: "rect", icon: Square, label: "Rectangle" },
                                                { id: "circle", icon: CircleIcon, label: "Circle" },
                                                { id: "line", icon: Minus, label: "Line" },
                                            ].map((shape) => (
                                                <button
                                                    key={shape.id}
                                                    onClick={() => {
                                                        setSelectedShape(shape.id as ShapeType);
                                                        setIsShapeModalOpen(false);
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                                                        selectedShape === shape.id && activeTool === "shape"
                                                            ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    <shape.icon className="w-5 h-5" />
                                                    <span className="text-[9px] font-medium uppercase tracking-wider">{shape.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTool === tool.id && tool.slider && showSettings && (
                                <div className="absolute left-full ml-4 top-0 p-4 glass rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-left-2 z-30 min-w-[120px]">
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tool Size</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            step="1"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                            className="w-full h-1.5 appearance-none bg-white/5 rounded-full border border-white/5 cursor-pointer"
                                        />
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono text-white/30">{brushSize}px</span>
                                            <button onClick={() => setShowSettings(false)} className="text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-wider">Done</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="h-px bg-white/10 mx-2" />
                    <button onClick={undo} className="p-3 text-white/40 hover:text-white/60 disabled:opacity-20 transition-all" disabled={historyStep <= 0}><Undo2 className="w-5 h-5" /></button>
                    <button onClick={redo} className="p-3 text-white/40 hover:text-white/60 disabled:opacity-20 transition-all" disabled={historyStep >= history.length - 1}><Redo2 className="w-5 h-5" /></button>
                    <div className="h-px bg-white/10 mx-2" />
                    <button onClick={() => { if (confirm("Discard all changes?")) { const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); if (ctx && canvas) { ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, canvas.width, canvas.height); setHistory([]); setHistoryStep(-1); } } }} className="p-3 text-red-400/40 hover:text-red-400 transition-all"><RotateCcw className="w-5 h-5" /></button>
                    <div className="h-px bg-white/10 mx-2" />
                    <div className="flex flex-col items-center gap-2 py-2 group/zoom relative">
                        <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest rotate-180 [writing-mode:vertical-lr]">Zoom</span>
                        <input
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="h-24 appearance-none bg-blue-500/10 rounded-full w-1 border border-white/5 hover:bg-blue-500/20 cursor-ns-resize [writing-mode:vertical-lr]"
                        />
                        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="text-[9px] font-bold text-white/40 hover:text-white transition-colors">100%</button>
                    </div>
                </aside>

                <main onWheel={handleWheel} className="flex-1 flex items-center justify-center p-12 overflow-hidden bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]">
                    <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} className="shadow-[0_0_100px_rgba(255,255,255,0.05)] border border-white/10 rounded-lg overflow-hidden shrink-0 origin-center relative">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startAction}
                            onMouseMove={moveAction}
                            onMouseUp={endAction}
                            onMouseLeave={endAction}
                            onTouchStart={startAction}
                            onTouchMove={moveAction}
                            onTouchEnd={endAction}
                            className="bg-[#0a0a0a] touch-none cursor-crosshair block"
                        />
                        <div
                            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center group/resize"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsResizing(true);
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startWidth = canvasSize.width;
                                const startHeight = canvasSize.height;
                                const handleMouseMove = (me: MouseEvent) => {
                                    setCanvasSize({
                                        width: Math.max(200, Math.round(startWidth + (me.clientX - startX) / zoom)),
                                        height: Math.max(200, Math.round(startHeight + (me.clientY - startY) / zoom))
                                    });
                                };
                                const handleMouseUp = () => {
                                    setIsResizing(false);
                                    window.removeEventListener("mousemove", handleMouseMove);
                                    window.removeEventListener("mouseup", handleMouseUp);
                                };
                                window.addEventListener("mousemove", handleMouseMove);
                                window.addEventListener("mouseup", handleMouseUp);
                            }}
                        >
                            <div className="w-2 h-2 border-r-2 border-b-2 border-white/20 group-hover/resize:border-blue-400 transition-colors" />
                        </div>
                        {textInput?.open && (
                            <div className="absolute z-[110] flex items-center gap-2 group" style={{ left: textInput.x, top: textInput.y, transform: 'translate(-2px, -50%)' }}>
                                <input
                                    autoFocus
                                    type="text"
                                    value={textInput.value}
                                    onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const ctx = canvasRef.current?.getContext("2d");
                                            if (ctx && textInput.value) {
                                                ctx.fillStyle = "white";
                                                ctx.font = "20px Inter, sans-serif";
                                                ctx.fillText(textInput.value, textInput.x, textInput.y);
                                                saveToHistory();
                                            }
                                            setTextInput(null);
                                        }
                                        if (e.key === "Escape") setTextInput(null);
                                    }}
                                    className="bg-transparent border border-white/40 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white min-w-[120px]"
                                    placeholder="Type element name..."
                                />
                                <button onClick={() => {
                                    const ctx = canvasRef.current?.getContext("2d");
                                    if (ctx && textInput.value) {
                                        ctx.fillStyle = "white";
                                        ctx.font = "20px Inter, sans-serif";
                                        ctx.fillText(textInput.value, textInput.x, textInput.y);
                                        saveToHistory();
                                    }
                                    setTextInput(null);
                                }} className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-white"><CornerDownLeft className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
