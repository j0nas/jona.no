import { useState } from "react";
import AppWindow, { type WindowControls } from "../../components/window/AppWindow";
import { Button, DesktopIcon, StatusBar } from "../../win95";
import { folderMenu } from "../folderMenu";
import type { WindowId } from "../registry";
import { KINDS, projectBySlug, projects, type Project } from "../../projects";
import styles from "./Projects.module.css";

interface ProjectsProps {
  controls: WindowControls;
  onOpen: (id: WindowId) => void;
}

/**
 * The Projects folder as Explorer shows a folder with "View as Web Page" on (the Windows 98
 * desktop update): a panel down the left describes the folder, or the selected icon with its
 * picture, and the icons sit to its right, one group per kind of project. Double-click, Enter
 * or the panel's Open button opens the project's own window. A narrow window drops the panel.
 */
export default function Projects({ controls, onOpen }: ProjectsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const project = selected ? projectBySlug.get(selected) : undefined;
  const open = (slug: string) => onOpen(`project/${slug}`);
  return (
    <AppWindow id="project" controls={controls} menu={folderMenu(controls.onClose)}>
      <div className={styles.body}>
        <aside className={styles.web}>
          <img className={styles.folder} src="/img/win95/folder-32.png" alt="" width={32} />
          <h1 className={styles.title}>Projects</h1>
          <hr className={styles.rule} />
          {project ? (
            <Details project={project} onOpen={() => open(project.slug)} />
          ) : (
            <>
              <p>
                What I've built lately, mostly in my own time and often together with coding agents.
              </p>
              <p>Select an item to view its description.</p>
            </>
          )}
        </aside>
        <div
          className={styles.pane}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          {KINDS.map((kind) => (
            <section key={kind.id} className={styles.group}>
              <h2 className={styles.kind}>{kind.label}</h2>
              <div className={styles.icons}>
                {projects
                  .filter((p) => p.kind === kind.id)
                  .map((p) => (
                    <DesktopIcon
                      key={p.slug}
                      icon={p.iconLarge}
                      label={p.title}
                      inFolder
                      selected={selected === p.slug}
                      onSelect={() => setSelected(p.slug)}
                      onOpen={() => open(p.slug)}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <StatusBar>{project ? "1 object(s) selected" : `${projects.length} object(s)`}</StatusBar>
    </AppWindow>
  );
}

function Details({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <>
      <h2 className={styles.name}>{project.title}</h2>
      <p>{project.tagline}</p>
      {project.imageUrl && (
        <button type="button" className={styles.preview} onClick={onOpen}>
          <img src={project.imageUrl} alt={project.imageAlt ?? ""} />
        </button>
      )}
      <dl className={styles.facts}>
        <dt>When:</dt>
        <dd>{project.when}</dd>
        <dt>Built with:</dt>
        <dd>{project.stack}</dd>
        {project.status && (
          <>
            <dt>Status:</dt>
            <dd>{project.status}</dd>
          </>
        )}
        {project.linksHtml && (
          <>
            <dt>Links:</dt>
            <dd dangerouslySetInnerHTML={{ __html: project.linksHtml }} />
          </>
        )}
      </dl>
      <Button className={styles.open} onClick={onOpen}>
        Open
      </Button>
    </>
  );
}
