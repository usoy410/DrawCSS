"use client";

import React, { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
    onImageUpload: (base64: string) => void;
    className?: string;
}

export function Dropzone({ onImageUpload, className }: DropzoneProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setPreview(base64);
            onImageUpload(base64);
        };
        reader.readAsDataURL(file);
    }, [onImageUpload]);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const clear = () => {
        setPreview(null);
        onImageUpload("");
    };

    return (
        <div
            className={cn(
                "relative group cursor-pointer transition-all duration-300",
                isDragging ? "scale-[0.98] brightness-110" : "",
                className
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
        >
            {!preview ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                    <Upload className="w-10 h-10 mb-4 text-white/40 group-hover:text-white/60 transition-colors" />
                    <p className="text-sm text-white/60">Drop your sketch here or click to upload</p>
                    <input type="file" className="hidden" accept="image/*" onChange={onChange} />
                </label>
            ) : (
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-white/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Preview" className="w-full h-full object-contain bg-black/40" />
                    <button
                        onClick={clear}
                        className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white/80 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium text-white/90">Sketch Loaded</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
