import React from 'react';
import { Trash2, Globe, Power, Link2, Copy, Check } from 'lucide-react';

const PortCard = ({ port, status, pid, tunnelUrl, onDelete, onKill, onTunnel, onStopTunnel }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(tunnelUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative glass-panel rounded-2xl p-5 transition-all duration-300 hover:bg-zinc-800/60 hover:shadow-2xl hover:-translate-y-0.5">
            {/* Header / Port Info */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-glow ${status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-600'
                        }`} />
                    <div>
                        <h3 className="text-2xl font-light tracking-tight text-white/90">
                            {port}
                        </h3>
                    </div>
                </div>

                {/* Delete Button (Hidden by default, shown on hover) */}
                <button
                    onClick={() => onDelete(port)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Status Details */}
            <div className="space-y-4">
                {status === 'active' ? (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 font-medium tracking-wide">PID {pid}</span>
                        <button
                            onClick={() => onKill(pid)}
                            className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                        >
                            Kill Process
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between text-sm h-8">
                        <span className="text-zinc-600">No process running</span>
                    </div>
                )}

                {/* Tunnel Actions */}
                <div className="pt-4 border-t border-white/5">
                    {tunnelUrl ? (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Live via Cloudflare
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs py-2 rounded-lg transition-all active:scale-95"
                                >
                                    {copied ? <Check size={14} /> : <Link2 size={14} />}
                                    {copied ? 'Copied' : 'Copy URL'}
                                </button>
                                <button
                                    onClick={onStopTunnel}
                                    className="px-3 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                                    title="Stop Tunnel"
                                >
                                    <Power size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => onTunnel(port)}
                            disabled={status !== 'active'}
                            className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${status === 'active'
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95'
                                    : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                                }`}
                        >
                            <Globe size={16} />
                            <span>Share to Internet</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortCard;
