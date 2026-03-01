"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, RotateCcw, Send, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasProps {
    onSubmit: (base64: string) => void;
    loading?: boolean;
    className?: string;
}

export function Canvas({ onSubmit, loading, className }: CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    // Initialize canvas with correct dimensions and smoothing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Handle resizing - maintain canvas content
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            const tempImage = canvas.toDataURL();
            canvas.width = parent.clientWidth;
            canvas.height = 320; // Fixed height for consistency

            // Redraw after resize
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                // Setup drawing style
                ctx.strokeStyle = "white";
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            };
            img.src = tempImage;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Initial setup
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        ctx.lineTo(x, y);
        ctx.stroke();
        setHasContent(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasContent(false);
        }
    };

    const submit = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasContent) return;

        // Create a temporary canvas to add a dark background for the Vision API
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        // Background
        tempCtx.fillStyle = "#0a0a0a";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the drawing on top
        tempCtx.drawImage(canvas, 0, 0);

        const base64 = tempCanvas.toDataURL("image/png");
        onSubmit(base64);
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="relative glass rounded-2xl overflow-hidden border border-white/10 bg-black/40 touch-none">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[320px] cursor-crosshair"
                />

                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={clear}
                        className="p-2 glass hover:bg-white/10 rounded-xl border border-white/10 text-white/40 hover:text-white/60 transition-all shadow-lg"
                        title="Clear"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 flex-col gap-2">
                        <Pencil className="w-8 h-8" />
                        <span className="text-xs uppercase tracking-widest font-mono">Sketch your UI here</span>
                    </div>
                )}
            </div>

            <button
                onClick={submit}
                disabled={!hasContent || loading}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-medium transition-all duration-300 shadow-xl border",
                    hasContent && !loading
                        ? "bg-blue-600 border-blue-400/30 text-white hover:bg-blue-500 scale-[1.02] active:scale-[0.98]"
                        : "bg-white/5 border-white/10 text-white/20 cursor-not-allowed"
                )}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Generate Code from Whiteboard
                    </>
                )}
            </button>
        </div>
    );
}
