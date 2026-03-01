"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dropzone } from "@/components/Dropzone";
import { Canvas } from "@/components/Canvas";
import { Preview } from "@/components/Preview";
import { processImageToCode } from "./actions";
import { Sparkles, Zap, Shield, Cpu, Upload, Pencil, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function HomeContent() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"upload" | "draw">("upload");
  const searchParams = useSearchParams();

  useEffect(() => {
    const sharedCode = searchParams.get("code");
    if (sharedCode) {
      setCode(sharedCode);
    }
  }, [searchParams]);

  const handleProcess = async (base64: string) => {
    if (!base64) {
      if (inputMode === "upload") setCode("");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await processImageToCode(base64);
      setCode(result.code);
    } catch (err: any) {
      if (err.message === "API_RATE_LIMIT") {
        setError("Gemini API rate limit reached (Free Tier). Retrying in 30s... Please wait.");
      } else {
        setError("Failed to process image. Please check your API key or network connection.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen drawcss-gradient flex flex-col items-center p-4 md:p-8 lg:p-12">
      {/* Header */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Zap className="w-6 h-6 text-blue-400 fill-blue-400/20" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
              DrawCSS
            </h1>
          </div>
          <p className="text-white/40 text-sm font-light tracking-wide flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-emerald-400/60" />
            WHITEBOARD-TO-CODE PIPELINE v2.0
          </p>
        </div>

        <div className="flex items-center gap-4 px-4 py-2 glass rounded-full border border-white/5">
          <div className="flex -space-x-2">
            {[Shield, Cpu, Zap].map((Icon, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-white/60" />
              </div>
            ))}
          </div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/30">Flash Stable Engine Active</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl flex-1">
        {/* Sidebar / Upload */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card flex flex-col gap-6 h-fit">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-medium text-white/90">Input Interface</h2>
                <p className="text-xs text-white/40">Capture your vision directly</p>
              </div>
              <Link
                href="/draw"
                className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/5 group"
                title="Open Dedicated Studio"
              >
                <Maximize2 className="w-4 h-4 text-white/40 group-hover:text-blue-400" />
              </Link>
            </div>

            {/* Mode Toggle */}
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
              <button
                onClick={() => { setInputMode("upload"); setCode(""); setError(null); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                  inputMode === "upload" ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Image
              </button>
              <button
                onClick={() => { setInputMode("draw"); setCode(""); setError(null); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                  inputMode === "draw" ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                )}
              >
                <Pencil className="w-3.5 h-3.5" />
                Draw Sketch
              </button>
            </div>

            <div className="min-h-[320px]">
              {inputMode === "upload" ? (
                <Dropzone onImageUpload={handleProcess} className="w-full" />
              ) : (
                <Canvas onSubmit={handleProcess} loading={loading} className="w-full" />
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-white/5 space-y-4">
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-white/30">Guidelines</h3>
              <ul className="space-y-3">
                {[
                  inputMode === "upload" ? "Clear high-contrast sketches work best" : "Draw clearly with visible boundaries",
                  "Label components (e.g., 'Button', 'Hero')",
                  "Vision engine understands layout hierarchy",
                  "Standard Tailwind classes will be used"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-white/50 leading-relaxed italic">
                    <div className="w-1 h-1 rounded-full bg-blue-500/40 mt-1.5" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent">
            <p className="text-[10px] text-white/30 leading-relaxed font-mono">
              // SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}<br />
              // STATUS: WAITING_FOR_PAYLOAD...<br />
              // ENGINE: GEMINI_FLASH_LATEST
            </p>
          </div>
        </div>


        {/* Main Content / Preview */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <Preview code={code} loading={loading} />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-light">
          Built with <span className="text-blue-500/40">Pure Efficiency</span></p>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}
