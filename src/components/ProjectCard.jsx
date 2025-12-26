import React from 'react';
import { Trash2, Globe, Power, Link2, Copy, Check, Activity, Terminal } from 'lucide-react';

const ProjectCard = ({ project, status, pid, tunnelActive, onDelete, onKill, onStartTunnel, onStopTunnel }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!project.domain) return;
        navigator.clipboard.writeText(`https://${project.domain}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative glass-panel rounded-2xl p-5 transition-all duration-300 hover:bg-zinc-800/60 hover:shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-medium text-white mb-1">{project.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono">
                        <Terminal size={12} />
                        <span>:{project.port}</span>
                    </div>
                </div>

                <button
                    onClick={() => onDelete(project.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-600 hover:text-red-400 rounded-lg hover:bg-white/5"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Status Section */}
            <div className="space-y-4">
                {/* Local Process Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 shadow-glow' : 'bg-zinc-700'}`} />
                        <span className="text-sm text-zinc-400">
                            {status === 'active' ? `PID ${pid}` : 'No Process'}
                        </span>
                    </div>
                    {status === 'active' && (
                        <button
                            onClick={() => onKill(pid)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            Kill
                        </button>
                    )}
                </div>

                {/* Cloudflare Tunnel Status */}
                <div className="pt-2">
                    {tunnelActive ? (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium px-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Tunnel Active
                            </div>

                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <span className="text-xs text-blue-200 truncate flex-1">
                                    {project.domain ? `https://${project.domain}` : 'Scanning...'}
                                </span>
                                <div className="flex items-center gap-1">
                                    {project.domain && (
                                        <button
                                            onClick={handleCopy}
                                            className="p-1.5 text-blue-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                                        >
                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onStopTunnel(project.id)}
                                        className="p-1.5 text-red-400 hover:text-white hover:bg-red-500/50 rounded transition-colors"
                                    >
                                        <Power size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => onStartTunnel(project)}
                            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10"
                        >
                            <Globe size={14} />
                            <span>Connect Tunnel</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
