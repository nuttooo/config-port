import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Command } from 'lucide-react';
import PortCard from './components/PortCard';
import AddPortModal from './components/AddPortModal';

function App() {
  const [monitoredPorts, setMonitoredPorts] = useState(() => {
    const saved = localStorage.getItem('monitoredPorts');
    return saved ? JSON.parse(saved) : [3000, 5173, 8080];
  });

  const [portStatus, setPortStatus] = useState({});
  const [tunnels, setTunnels] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    localStorage.setItem('monitoredPorts', JSON.stringify(monitoredPorts));
    checkAllPorts();
  }, [monitoredPorts]);

  // Periodic polling
  useEffect(() => {
    const interval = setInterval(checkAllPorts, 5000);
    return () => clearInterval(interval);
  }, [monitoredPorts]);

  // Keyboard shortcut for Add
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsModalOpen(true);
      }
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const checkAllPorts = async () => {
    if (!window.electronAPI) return;
    setRefreshing(true);

    const newStatus = {};
    for (const port of monitoredPorts) {
      const pid = await window.electronAPI.checkPort(port);
      newStatus[port] = pid
        ? { status: 'active', pid }
        : { status: 'free', pid: null };
    }
    setPortStatus(newStatus);

    // Tiny delay for visual feedback
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAddPort = (port) => {
    const portNum = parseInt(port);
    if (!monitoredPorts.includes(portNum)) {
      setMonitoredPorts([...monitoredPorts, portNum]);
    }
  };

  const handleRemovePort = (port) => {
    setMonitoredPorts(monitoredPorts.filter(p => p !== port));
  };

  const handleKill = async (pid) => {
    if (!window.electronAPI) return;
    // Removed confirm dialog for faster flow, but could add back if requested
    try {
      await window.electronAPI.killProcess(pid);
      checkAllPorts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTunnel = async (port) => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const url = await window.electronAPI.startTunnel(port);
      setTunnels(prev => ({ ...prev, [port]: url }));
    } catch (err) {
      alert('Failed to start tunnel: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopTunnel = async (port) => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.stopTunnel();
      setTunnels(prev => {
        const next = { ...prev };
        delete next[port];
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30 text-zinc-100 flex flex-col">
      {/* Title Bar dragging area */}
      <div className="h-10 w-full draggable fixed top-0 left-0 z-50 flex items-center justify-center pointer-events-none">
        <span className="text-xs font-medium text-zinc-600 tracking-widest uppercase opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">Port Manager</span>
      </div>

      <div className="flex-1 p-8 pt-16 max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-extralight tracking-tight text-white mb-2">
              Dashboard
            </h1>
            <p className="text-zinc-500 font-light flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${refreshing ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`}></span>
              {refreshing ? 'Updating...' : 'All systems operational'}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-3 px-5 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/10 active:scale-95"
          >
            <span className="text-sm font-medium">Add Port</span>
            <kbd className="hidden group-hover:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-black/20 rounded text-zinc-500">⌘K</kbd>
            <span className="bg-white/10 p-1 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Plus size={14} />
            </span>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {monitoredPorts.map(port => (
            <PortCard
              key={port}
              port={port}
              status={portStatus[port]?.status || 'free'}
              pid={portStatus[port]?.pid}
              tunnelUrl={tunnels[port]}
              onDelete={handleRemovePort}
              onKill={handleKill}
              onTunnel={handleStartTunnel}
              onStopTunnel={() => handleStopTunnel(port)}
            />
          ))}

          <button
            onClick={() => setIsModalOpen(true)}
            className="group min-h-[200px] rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/20 flex flex-col items-center justify-center gap-4 transition-all text-zinc-600 hover:text-zinc-400"
          >
            <div className="p-3 rounded-full bg-zinc-900 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="text-sm font-medium">Monitor New Port</span>
          </button>
        </div>
      </div>

      <AddPortModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddPort}
      />

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-white/10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-sm text-zinc-400 font-medium">Starting Cloudflare Tunnel...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
