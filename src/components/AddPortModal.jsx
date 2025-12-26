import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

const AddPortModal = ({ isOpen, onClose, onAdd }) => {
    const [port, setPort] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (port) {
            onAdd(port);
            setPort('');
            onClose();
        }
    };

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all"
            onClick={handleBackdropClick}
        >
            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-1 w-[320px] shadow-2xl animate-scale-in">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        placeholder="Port..."
                        className="w-full bg-transparent text-white px-4 py-3 outline-none text-lg placeholder:text-zinc-600 font-light"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!port}
                        className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-0 disabled:translate-x-2"
                    >
                        <ArrowRight size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-2 text-zinc-600 hover:text-zinc-400 p-2 transition-colors"
                        style={{ display: port ? 'none' : 'block' }}
                    >
                        <span className="text-xs font-medium">ESC</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddPortModal;
