import { useRef } from 'react';
import type { Project } from '../types';
import { Save, Download, Play, Plus } from 'lucide-react';

interface HeaderProps {
  project: Project;
  onRename: (name: string) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  onStartRender: () => void;
  saving: boolean;
}

export function Header({ project, onRename, onNewProject, onSaveProject, onLoadProject, onStartRender, saving }: HeaderProps) {
  const loadInputRef = useRef<HTMLInputElement>(null);
  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLoadProject(file);
    e.target.value = '';
  };

  return (
    <div className="topbar">
      <div className="brand">
        <span className="dot" aria-hidden="true" />
        <span>CallFrame</span>
      </div>
      <div className="project-name">
        <input
          value={project.name}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Project name"
          spellCheck={false}
        />
        <span className={`save-indicator ${saving ? '' : 'ok'}`} aria-hidden="true">
          {saving ? 'saving…' : 'saved'}
        </span>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-small" onClick={onNewProject} title="New project">
          <Plus size={14} /> New
        </button>
        <button className="btn btn-small" onClick={() => loadInputRef.current?.click()} title="Open project (.json)">
          <Download size={14} /> Open
        </button>
        <input
          ref={loadInputRef}
          id="load-project-input"
          type="file"
          accept=".json"
          hidden
          onChange={handleLoad}
        />
        <button className="btn btn-small" onClick={onSaveProject} title="Save project (.json)">
          <Save size={14} /> Save
        </button>
        <button className="btn btn-success" onClick={onStartRender} disabled={saving} title="Start Rendering">
          <Play size={14} /> Start Rendering
        </button>
      </div>
    </div>
  );
}
