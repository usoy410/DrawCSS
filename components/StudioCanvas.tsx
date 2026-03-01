"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Eraser,
    RotateCcw,
    Send,
    Pencil,
    Type,
    Undo2,
    Redo2,
    Monitor,
    Smartphone,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StudioCanvasProps {
    onSubmit: (base64: string) => void;
    loading?: boolean;
}

type Tool = "pencil" | "eraser" | "text";
type Orientation = "desktop" | "mobile";

export function StudioCanvas({ onSubmit, loading }: StudioCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeTool, setActiveTool] = useState<Tool>("pencil");
    const [orientation, setOrientation] = useState<Orientation>("desktop");
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
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

            const width = orientation === "desktop" ? (parent.clientWidth - 100) : 375;
            const height = orientation === "desktop" ? (parent.clientHeight - 100) : 667;

            canvas.width = width;
            canvas.height = height;

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
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.font = "20px Inter, sans-serif";
        };

        setupCanvas();
        window.addEventListener("resize", setupCanvas);
        return () => window.removeEventListener("resize", setupCanvas);
    }, [orientation]);

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

        // Scale-aware coordinates
        return {
            x: (clientX - rect.left) / zoom,
            y: (clientY - rect.top) / zoom
        };
    };


    const startAction = (e: React.MouseEvent | React.TouchEvent) => {
        if (isSpacePressed || (e as React.MouseEvent).button === 1) { // Middle mouse button
            setIsPanning(true);
            return;
        }

        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        if (activeTool === "text") {
            const text = prompt("Enter text for this element:");
            if (text) {
                ctx.fillStyle = "white";
                ctx.fillText(text, x, y);
                saveToHistory();
            }
            return;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = activeTool === "eraser" ? "#0a0a0a" : "white";
        ctx.lineWidth = activeTool === "eraser" ? 20 : 3;
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
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

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
            saveToHistory();
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault(); // Prevent page scrolling
        if (e.ctrlKey || e.metaKey) { // Zoom with Ctrl/Cmd + scroll
            const delta = -e.deltaY;
            const factor = delta > 0 ? 1.1 : 0.9;
            setZoom(prev => Math.min(Math.max(prev * factor, 0.5), 5));
        } else { // Pan with scroll
            setPan(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#050505] overflow-hidden">
            {/* Studio Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                        <ChevronLeft className="w-5 h-5 text-white/40 group-hover:text-white" />
                    </Link>
                    <div className="h-6 w-px bg-white/10" />
                    <h1 className="text-sm font-medium tracking-tight text-white/80">Drawing Studio <span className="text-white/20 font-mono text-xs">v1.2</span></h1>
                </div>

                <div className="flex items-center gap-2 glass px-1 py-1 rounded-xl">
                    <button
                        onClick={() => setOrientation("desktop")}
                        className={cn("p-2 rounded-lg transition-all", orientation === "desktop" ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/50")}
                        title="Desktop View"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setOrientation("mobile")}
                        className={cn("p-2 rounded-lg transition-all", orientation === "mobile" ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/50")}
                        title="Mobile View"
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
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

            {/* Studio Main */}
            <div className="flex flex-1 relative overflow-hidden">
                {/* Toolbar Sidebar */}
                <aside className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-2 glass rounded-2xl border border-white/10 z-20">
                    {[
                        { id: "pencil", icon: Pencil, label: "Pencil" },
                        { id: "eraser", icon: Eraser, label: "Eraser" },
                        { id: "text", icon: Type, label: "Text" },
                    ].map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id as Tool)}
                            className={cn(
                                "p-3 rounded-xl transition-all relative group",
                                activeTool === tool.id ? "bg-blue-600 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/60"
                            )}
                            title={tool.label}
                        >
                            <tool.icon className="w-5 h-5" />
                            <span className="absolute left-full ml-4 px-2 py-1 bg-black text-[10px] text-white rounded hidden group-hover:block whitespace-nowrap border border-white/10">{tool.label}</span>
                        </button>
                    ))}
                    <div className="h-px bg-white/10 mx-2" />
                    <button onClick={undo} className="p-3 text-white/40 hover:text-white/60 disabled:opacity-20 transition-all" disabled={historyStep <= 0}><Undo2 className="w-5 h-5" /></button>
                    <button onClick={redo} className="p-3 text-white/40 hover:text-white/60 disabled:opacity-20 transition-all" disabled={historyStep >= history.length - 1}><Redo2 className="w-5 h-5" /></button>
                    <div className="h-px bg-white/10 mx-2" />
                    <button onClick={() => { if (confirm("Discard all changes?")) { const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); if (ctx && canvas) { ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, canvas.width, canvas.height); setHistory([]); setHistoryStep(-1); } } }} className="p-3 text-red-400/40 hover:text-red-400 transition-all"><RotateCcw className="w-5 h-5" /></button>

                    <div className="h-px bg-white/10 mx-2" />

                    {/* Zoom Control */}
                    <div className="flex flex-col items-center gap-2 py-2">
                        <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest rotate-180 [writing-mode:vertical-lr]">Zoom</span>
                        <input
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="h-24 appearance-none bg-blue-500/10 rounded-full w-1 border border-white/5 hover:bg-blue-500/20 cursor-ns-resize [writing-mode:vertical-lr] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        />
                        <button
                            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                            className="text-[9px] font-bold text-white/40 hover:text-white transition-colors"
                        >
                            100%
                        </button>
                    </div>
                </aside>


                {/* Canvas Area */}
                <main
                    onWheel={handleWheel}
                    className="flex-1 flex items-center justify-center p-12 overflow-hidden bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px] cursor-grab active:cursor-grabbing"
                >
                    <div
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        }}
                        className={cn(
                            "transition-transform duration-75 shadow-[0_0_100px_rgba(255,255,255,0.02)] border border-white/10 rounded-lg overflow-hidden shrink-0 origin-center",
                            orientation === "desktop" ? "aspect-video" : "aspect-[9/16]"
                        )}
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startAction}
                            onMouseMove={moveAction}
                            onMouseUp={endAction}
                            onMouseLeave={endAction}
                            onTouchStart={startAction}
                            onTouchMove={moveAction}
                            onTouchEnd={endAction}
                            className="bg-[#0a0a0a] cursor-crosshair touch-none"
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
