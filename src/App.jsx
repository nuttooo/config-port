import React, { useState, useEffect } from 'react';
import { Plus, Fingerprint, RefreshCw } from 'lucide-react';
import ProjectCard from './components/ProjectCard';
import AddProjectModal from './components/AddProjectModal';

function App() {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('pm_projects');
    return saved ? JSON.parse(saved) : [
      { id: 'default-1', name: 'React App', port: 5173, domain: null },
      { id: 'default-2', name: 'API Server', port: 8080, domain: null }
    ];
  });

  const [portStatus, setPortStatus] = useState({});
  const [activeTunnels, setActiveTunnels] = useState({}); // { projectId: true }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('pm_projects', JSON.stringify(projects));
    checkAllPorts();

    // Check auth on load
    if (window.electronAPI) {
      window.electronAPI.cfCheckAuth().then(setAuthenticated);
    }
  }, [projects]);

  useEffect(() => {
    const interval = setInterval(checkAllPorts, 5000);
    return () => clearInterval(interval);
  }, [projects]);

  const checkAllPorts = async () => {
    if (!window.electronAPI) return;

    const newStatus = {};
    for (const proj of projects) {
      const pid = await window.electronAPI.checkPort(proj.port);
      newStatus[proj.port] = pid
        ? { status: 'active', pid }
        : { status: 'free', pid: null };
    }
    setPortStatus(newStatus);
  };

  const handleAddProject = (projectData) => {
    const newProject = {
      ...projectData,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
    setProjects([...projects, newProject]);
  };

  const handleDeleteProject = (id) => {
    // Stop tunnel if running
    if (activeTunnels[id]) {
      handleStopTunnel(id);
    }
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleStartTunnel = async (project) => {
    if (!authenticated) {
      alert('Please login to Cloudflare first (Click the fingerprint icon on the top right).');
      return;
    }

    setLoading(true);
    try {
      // If domain is not provided, we might still want to support Quick Tunnel logic or force a random subdomain on their zone?
      // For MVP V2, let's assume if domain is empty, we throw error or use old logic?
      // User explicitly asked for "Select Project" and "Config Domain".
      // Let's enforce domain for named tunnel, or warn.

      // Actually, if domain is empty, we could fall back to Quick Tunnel logic from V1?
      // But main.js logic for 'cf-start-tunnel' is built for named tunnels.

      let finalDomain = project.domain;
      if (!finalDomain) {
        // For now, let's just make it required in UI or alert
        // Or let cloudflared handle it (it won't route DNS without domain)
        if (!confirm('No custom domain specified. This will create a tunnel but not route it anywhere public yet. Continue?')) {
          setLoading(false);
          return;
        }
      }

      await window.electronAPI.cfStartTunnel({
        projectId: project.id,
        name: project.name,
        port: project.port,
        domain: finalDomain
      });

      setActiveTunnels(prev => ({ ...prev, [project.id]: true }));
    } catch (err) {
      alert('Tunnel Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopTunnel = async (id) => {
    try {
      await window.electronAPI.cfStopTunnel(id);
      setActiveTunnels(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await window.electronAPI.cfLogin();
      // Poll for auth success or just wait a bit and recheck
      setTimeout(async () => {
        const isAuth = await window.electronAPI.cfCheckAuth();
        if (isAuth) {
          setAuthenticated(true);
          alert('Successfully logged in to Cloudflare!');
        } else {
          alert('Login check failed. Please try completing the browser flow.');
        }
        setLoading(false);
      }, 5000); // 5 sec delay to allow browser interaction
    } catch (err) {
      alert('Login failed: ' + err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30 text-zinc-100 flex flex-col">
      <div className="h-10 w-full draggable fixed top-0 left-0 z-50"></div>

      <div className="flex-1 p-8 pt-16 max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-extralight tracking-tight text-white mb-2">Projects</h1>
            <p className="text-zinc-500 font-light">Manage local services and secure tunnels</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLogin}
              title={authenticated ? "Logged in to Cloudflare" : "Login to Cloudflare"}
              className={`p-2.5 rounded-full transition-all border ${authenticated
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                  : 'bg-zinc-800 border-white/5 text-zinc-600 hover:text-white'
                }`}
            >
              <Fingerprint size={20} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-full transition-all shadow-lg shadow-white/5 font-medium active:scale-95"
            >
              <Plus size={18} />
              <span>New Project</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              status={portStatus[project.port]?.status || 'free'}
              pid={portStatus[project.port]?.pid}
              tunnelActive={activeTunnels[project.id]}
              onDelete={handleDeleteProject}
              onKill={(pid) => window.electronAPI.killProcess(pid).then(checkAllPorts)}
              onStartTunnel={handleStartTunnel}
              onStopTunnel={handleStopTunnel}
            />
          ))}
        </div>
      </div>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddProject}
      />

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

export default App;
