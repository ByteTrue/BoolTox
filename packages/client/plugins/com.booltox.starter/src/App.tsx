import { useState, useEffect } from 'react';
import { useBooltox } from './hooks/useBooltox';
import { Terminal, FileText, Database, Activity } from 'lucide-react';
import { clsx } from 'clsx';

type Tab = 'system' | 'notes' | 'files';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('system');
  const api = useBooltox();

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">BoolTox Starter</h1>
            <p className="text-xs text-[var(--text-secondary)]">Plugin Capabilities Demo</p>
          </div>
        </div>
        <div className="flex gap-2">
          <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<Terminal size={16} />}>System</TabButton>
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<Database size={16} />}>Data</TabButton>
          <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<FileText size={16} />}>Files</TabButton>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'system' && <SystemTab api={api} />}
        {activeTab === 'notes' && <NotesTab api={api} />}
        {activeTab === 'files' && <FilesTab api={api} />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-blue-500 text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function SystemTab({ api }: { api: ReturnType<typeof useBooltox> }) {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runCommand = async (cmd: string, args: string[]) => {
    setLoading(true);
    setOutput(prev => prev + `> ${cmd} ${args.join(' ')}\n`);
    try {
      const res = await api.shell.exec(cmd, args);
      if (res.success) {
        setOutput(prev => prev + (res.stdout || '') + '\n');
      } else {
        setOutput(prev => prev + `Error: ${res.error || res.stderr}\n`);
      }
    } catch (e: any) {
      setOutput(prev => prev + `Error: ${e.message}\n`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] p-4">
          <h3 className="mb-2 font-semibold">Quick Commands</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runCommand('node', ['-v'])} className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-800">Node Version</button>
            <button onClick={() => runCommand('npm', ['-v'])} className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-800">NPM Version</button>
            <button onClick={() => runCommand('echo', ['Hello from BoolTox!'])} className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-800">Echo</button>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <h3 className="mb-2 font-semibold">Window Control</h3>
          <div className="flex gap-2">
            <button onClick={() => api.window.setSize(900, 600)} className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm">Reset Size</button>
            <button onClick={() => api.window.setSize(1000, 700)} className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm">Large Size</button>
          </div>
        </div>
      </div>
      
      <div className="rounded-xl border border-[var(--border)] bg-black p-4 font-mono text-sm text-green-400">
        <pre className="whitespace-pre-wrap">{output || '// Terminal Output'}</pre>
        {loading && <span className="animate-pulse">_</span>}
      </div>
    </div>
  );
}

function NotesTab({ api }: { api: ReturnType<typeof useBooltox> }) {
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadNote();
  }, []);

  const loadNote = async () => {
    const data = await api.db.get<string>('user-note');
    if (data) {
      setSavedNote(data);
      setNote(data);
    }
  };

  const saveNote = async () => {
    setStatus('Saving...');
    await api.db.set('user-note', note);
    setSavedNote(note);
    setStatus('Saved!');
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] p-6">
        <h3 className="mb-4 text-lg font-semibold">Persistent Notes</h3>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Data entered here is saved to <code>userData/plugin-data/com.booltox.starter/db.json</code> via <code>booltox.db</code> API.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-40 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 focus:border-blue-500 focus:outline-none"
          placeholder="Type something..."
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-green-500">{status}</span>
          <button
            onClick={saveNote}
            className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

function FilesTab({ api }: { api: ReturnType<typeof useBooltox> }) {
  const [filename, setFilename] = useState('test.txt');
  const [content, setContent] = useState('Hello File System!');
  const [readContent, setReadContent] = useState('');

  const writeFile = async () => {
    await api.fs.writeFile(filename, content);
    alert('File written!');
  };

  const readFile = async () => {
    const res = await api.fs.readFile(filename);
    if (res.success && res.data) {
      setReadContent(res.data);
    } else {
      alert('Error reading file: ' + res.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] p-6">
        <h3 className="mb-4 text-lg font-semibold">File System Sandbox</h3>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Filename</label>
            <input 
              type="text" 
              value={filename} 
              onChange={e => setFilename(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Content</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)}
              className="h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={writeFile} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Write File</button>
            <button onClick={readFile} className="rounded-lg border border-[var(--border)] px-4 py-2 hover:bg-[var(--bg-secondary)]">Read File</button>
          </div>
          {readContent && (
            <div className="mt-4 rounded-lg bg-[var(--bg-secondary)] p-4">
              <h4 className="mb-2 text-xs font-bold uppercase text-[var(--text-secondary)]">Read Result:</h4>
              <pre className="text-sm">{readContent}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
