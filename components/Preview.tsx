"use client";

import React, { useEffect, useRef } from "react";
import { Code, Eye, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewProps {
    code: string;
    loading?: boolean;
    framework?: string;
}

export function Preview({ code, loading, framework = "vanilla" }: PreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [view, setView] = React.useState<"preview" | "code">("preview");
    const [copied, setCopied] = React.useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    useEffect(() => {
        if (view === "preview" && framework === "vanilla" && iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            if (!doc) return;

            const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; background: transparent; }
              ::-webkit-scrollbar { width: 8px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            </style>
          </head>
          <body class="bg-transparent text-white">
            ${code || '<div class="flex items-center justify-center h-screen text-white/20 font-mono">Waiting for sketch...</div>'}
          </body>
        </html>
      `;

            doc.open();
            doc.write(html);
            doc.close();
        }
    }, [code, view, framework]);

    return (
        <div className="flex flex-col h-full glass rounded-2xl overflow-hidden border border-white/10 shadow-emerald-500/10 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <span className="ml-2 text-xs font-mono text-white/40 uppercase tracking-widest">Live Output</span>
                </div>

                <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                    <button
                        onClick={() => setView("preview")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all",
                            view === "preview" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                    </button>
                    <button
                        onClick={() => setView("code")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all",
                            view === "code" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Code className="w-3.5 h-3.5" />
                        Code
                    </button>
                </div>
            </div>

            <div className="relative flex-1 bg-black/20 min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
                            <span className="text-xs font-mono text-blue-400/80 animate-pulse">GENERATING {framework.toUpperCase()} CODE...</span>
                        </div>
                    </div>
                )}

                {view === "preview" ? (
                    framework === "vanilla" ? (
                        <iframe ref={iframeRef} title="Preview" className="w-full h-full border-none" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                                <Code className="w-8 h-8 text-white/20" />
                            </div>
                            <h3 className="text-sm font-medium text-white/80">Preview Not Available</h3>
                            <p className="text-xs text-white/40 max-w-[240px] leading-relaxed">
                                Live previews are not supported for <span className="text-blue-400 font-mono">{framework}</span> components.
                                Switch to the <span className="text-white/60">Code</span> tab to view and copy the output.
                            </p>
                            <button
                                onClick={() => setView("code")}
                                className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all"
                            >
                                View Source Code
                            </button>
                        </div>
                    )
                ) : (
                    <div className="relative h-full">
                        <button
                            onClick={copyToClipboard}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white/60 transition-all z-10"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <pre className="p-4 text-xs font-mono text-blue-300 overflow-auto h-full selection:bg-blue-500/30">
                            {code || "<!-- No code generated yet -->"}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
