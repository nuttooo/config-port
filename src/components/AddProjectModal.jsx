import React, { useState } from 'react';
import { X, ArrowRight, Globe } from 'lucide-react';

const AddProjectModal = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [port, setPort] = useState('');
    const [domain, setDomain] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (port && name) {
            onAdd({
                name,
                port: parseInt(port),
                domain: domain || null
            });
            setName('');
            setPort('');
            setDomain('');
            onClose();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all"
            onClick={handleBackdropClick}
        >
            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 w-[400px] shadow-2xl animate-scale-in">
                <h2 className="text-xl font-light text-white mb-6">New Project</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome API"
                            className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Local Port</label>
                        <input
                            type="number"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="3000"
                            className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-widest font-medium flex items-center gap-2">
                            Custom Domain <span className="text-zinc-700 normal-case tracking-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                            <Globe size={14} className="absolute left-0 top-3 text-zinc-600" />
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="api.mysite.com"
                                className="w-full bg-transparent border-b border-white/10 py-2 pl-6 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            disabled={!port || !name}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span>Create Project</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProjectModal;
