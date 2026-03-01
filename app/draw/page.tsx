"use client";

import { useState } from "react";
import { StudioCanvas } from "@/components/StudioCanvas";
import { Preview } from "@/components/Preview";
import { processImageToCode } from "../actions";
import { X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DrawPage() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showSelection, setShowSelection] = useState(false);
    const [pendingBase64, setPendingBase64] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [framework, setFramework] = useState("vanilla");
    const [styling, setStyling] = useState("tailwind");

    const handleGenerateClick = (base64: string) => {
        setPendingBase64(base64);
        setShowSelection(true);
    };

    const confirmAndGenerate = async () => {
        if (!pendingBase64) return;

        setShowSelection(false);
        setLoading(true);
        setError(null);
        try {
            const result = await processImageToCode(pendingBase64, framework, styling);
            setCode(result.code);
            setShowPreview(true);
        } catch (err: any) {
            setError(err.message === "API_RATE_LIMIT" ? "Rate limit hit. Wait 30s." : "Generation failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen bg-black overflow-hidden">
            <StudioCanvas onSubmit={handleGenerateClick} loading={loading} />

            {/* Selection Modal */}
            {showSelection && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSelection(false)} />

                    <div className="relative w-full max-w-md glass-card p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-bold text-white tracking-tight">Generation Settings</h2>
                                <p className="text-xs text-white/40">Configure your output framework</p>
                            </div>
                            <button onClick={() => setShowSelection(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X className="w-5 h-5 text-white/40 hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Frameworks */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-400/60">Target Framework</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "vanilla", label: "Vanilla" },
                                        { id: "react", label: "React" },
                                        { id: "nextjs", label: "Next.js" },
                                        { id: "vue", label: "Vue" },
                                    ].map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setFramework(f.id)}
                                            className={cn(
                                                "px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                                                framework === f.id
                                                    ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                                            )}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Styling */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60">Styling Engine</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "tailwind", label: "Tailwind" },
                                        { id: "vanilla-css", label: "Vanilla CSS" },
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setStyling(s.id)}
                                            className={cn(
                                                "px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                                                styling === s.id
                                                    ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                                            )}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={confirmAndGenerate}
                                className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                            >
                                Generate Vision Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Overlay */}
            {showPreview && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowPreview(false)} />

                    <div className="relative w-full max-w-6xl h-full flex flex-col glass rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">Vision Output</h2>
                                <div className="h-4 w-px bg-white/10" />
                                <span className="text-[10px] text-emerald-400 font-mono animate-pulse uppercase tracking-wider">
                                    {framework.toUpperCase()} + {styling.toUpperCase()} READY
                                </span>
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
                            <Preview code={code} loading={false} framework={framework} styling={styling} />
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-full backdrop-blur-md z-[120]">
                    {error}
                </div>
            )}
        </div>
    );
}
