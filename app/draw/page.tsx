"use client";

import { useState } from "react";
import { StudioCanvas } from "@/components/StudioCanvas";
import { Preview } from "@/components/Preview";
import { processImageToCode } from "../actions";
import { X, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function DrawPage() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (base64: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await processImageToCode(base64);
            setCode(result.code);
            setShowPreview(true);
        } catch (err: any) {
            setError(err.message === "API_RATE_LIMIT" ? "Rate limit hit. Wait 30s." : "Generation failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen bg-black">
            <StudioCanvas onSubmit={handleGenerate} loading={loading} />

            {/* Preview Overlay */}
            {showPreview && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowPreview(false)} />

                    <div className="relative w-full max-w-6xl h-full flex flex-col glass rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">Vision Output</h2>
                                <div className="h-4 w-px bg-white/10" />
                                <span className="text-[10px] text-emerald-400 font-mono animate-pulse uppercase tracking-wider">Production Content Ready</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href={{ pathname: "/", query: { code } }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white transition-all border border-white/10"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    View in Dashboard
                                </Link>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-white/40 hover:text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <Preview code={code} loading={false} />
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-full backdrop-blur-md z-50">
                    {error}
                </div>
            )}
        </div>
    );
}
