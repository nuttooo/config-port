import React, { useRef, useEffect } from 'react';
import { X, Terminal } from 'lucide-react';

const LogViewer = ({ isOpen, onClose, projectName, logs = [] }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] border border-zinc-700 w-full max-w-2xl h-[500px] flex flex-col rounded-xl shadow-2xl relative overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Terminal size={16} />
                        <span className="font-mono text-sm">{projectName} — Logs</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Log Content */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-[#1e1e1e]">
                    {logs.length === 0 ? (
                        <div className="text-zinc-600 italic">Waiting for logs...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="break-words">
                                <span className="text-zinc-600 select-none mr-2">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="text-zinc-300 whitespace-pre-wrap">
                                    {log.message}
                                </span>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
};

export default LogViewer;
