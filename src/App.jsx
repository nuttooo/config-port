import React, { useState, useEffect } from 'react';
import { Plus, Fingerprint, RefreshCw } from 'lucide-react';
import ProjectCard from './components/ProjectCard';
import AddProjectModal from './components/AddProjectModal';
import LogViewer from './components/LogViewer';

function App() {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('pm_projects');
    return saved ? JSON.parse(saved) : [
      { id: 'default-1', name: 'React App', port: 5173, domain: null, autoStart: false },
      { id: 'default-2', name: 'API Server', port: 8080, domain: null, autoStart: false }
    ];
  });

  const [portStatus, setPortStatus] = useState({});
  const [activeTunnels, setActiveTunnels] = useState({}); // { projectId: true }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // Project object handling
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Logs state: { projectId: [ { timestamp, message } ] }
  const [logs, setLogs] = useState({});
  const [logViewerProject, setLogViewerProject] = useState(null); // projectId or null

  useEffect(() => {
    localStorage.setItem('pm_projects', JSON.stringify(projects));
    checkAllPorts();

    if (window.electronAPI) {
      window.electronAPI.cfCheckAuth().then(setAuthenticated);

      // Listen for logs
      if (window.electronAPI.onTunnelLog) {
        window.electronAPI.onTunnelLog((data) => {
          setLogs(prev => {
            const projectLogs = prev[data.projectId] || [];
            const newLogs = [...projectLogs, data].slice(-1000);
            return { ...prev, [data.projectId]: newLogs };
          });
        });
      }
    }
  }, [projects]);

  // Auto-start Tunnels
  useEffect(() => {
    if (authenticated) {
      projects.forEach(p => {
        if (p.autoStart && !activeTunnels[p.id]) {
          console.log('Auto-starting tunnel for', p.name);
          handleStartTunnel(p);
        }
      });
    }
  }, [authenticated]);

  // Sync Tray Menu
  useEffect(() => {
    if (window.electronAPI?.updateTray) {
      window.electronAPI.updateTray({ projects, activeTunnels });
    }
  }, [projects, activeTunnels]);

  // Handle Tray Actions
  useEffect(() => {
    if (!window.electronAPI?.onTrayAction) return;

    const cleanup = window.electronAPI.onTrayAction((action) => {
      console.log('Tray Action:', action);
      if (action.type === 'start') {
        const proj = projects.find(p => p.id === action.projectId);
        if (proj) {
          // Check auth before starting from tray
          if (authenticated) {
            handleStartTunnel(proj);
          } else {
            // Maybe bring window to front if auth needed?
            alert('Please login in the app first');
          }
        }
      } else if (action.type === 'stop') {
        handleStopTunnel(action.projectId);
      }
    });

    return cleanup;
  }, [projects, authenticated]); // Re-bind when projects/auth changes to avoid stale closures

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
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      autoStart: false
    };
    setProjects([...projects, newProject]);
  };

  const handleEditProject = (id, updatedData) => {
    // Logic: If domain changed and tunnel is active, we should ideally restart.
    // But for simplicity, we just update data. User has to stop/start manually or we warn?
    // Let's just update.
    setProjects(projects.map(p => p.id === id ? { ...p, ...updatedData } : p));
    setEditingProject(null);
  };

  const handleToggleAutoStart = (id) => {
    setProjects(projects.map(p =>
      p.id === id ? { ...p, autoStart: !p.autoStart } : p
    ));
  };

  const handleDeleteProject = async (id) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    if (confirm(`Delete project "${project.name}"? This will remove the tunnel and DNS records.`)) {
      if (activeTunnels[id]) {
        handleStopTunnel(id);
      }

      if (window.electronAPI) {
        try {
          await window.electronAPI.cfDeleteTunnel({
            projectId: id,
            domain: project.domain
          });
        } catch (err) {
          console.error('Failed to cleanup tunnel:', err);
          alert('Project deleted, but cleanup may have failed: ' + err);
        }
      }

      setProjects(projects.filter(p => p.id !== id));
      setLogs(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleStartTunnel = async (project) => {
    if (!authenticated) {
      alert('Please login to Cloudflare first (Click the fingerprint icon on the top right).');
      return;
    }

    setLogs(prev => ({ ...prev, [project.id]: [] }));

    try {
      let finalDomain = project.domain;
      if (!finalDomain) {
        if (!confirm('No custom domain specified. Continue with local tunnel?')) {
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
      console.error(err);
      alert(`Tunnel Error (${project.name}): ` + err.message);
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
      setTimeout(async () => {
        const isAuth = await window.electronAPI.cfCheckAuth();
        if (isAuth) {
          setAuthenticated(true);
          alert('Successfully logged in to Cloudflare!');
        } else {
          alert('Login check failed. Please try completing the browser flow.');
        }
        setLoading(false);
      }, 5000);
    } catch (err) {
      alert('Login failed: ' + err);
      setLoading(false);
    }
  };

  const currentProjectLogs = logViewerProject ? logs[logViewerProject] : [];
  const logViewerTitle = logViewerProject ? projects.find(p => p.id === logViewerProject)?.name : '';

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
              onViewLogs={() => setLogViewerProject(project.id)}
              onToggleAutoStart={() => handleToggleAutoStart(project.id)}
              onEdit={(p) => {
                setEditingProject(p);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(() => setEditingProject(null), 300); // Clear after potential anim
        }}
        onAdd={handleAddProject}
        onEdit={handleEditProject}
        initialData={editingProject}
      />

      <LogViewer
        isOpen={!!logViewerProject}
        onClose={() => setLogViewerProject(null)}
        projectName={logViewerTitle}
        logs={currentProjectLogs}
      />

      {loading && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

export default App;
