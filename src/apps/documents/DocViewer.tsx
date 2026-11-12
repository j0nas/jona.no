import AppWindow, { type WindowControls } from "../../components/window/AppWindow";
import { StatusBar } from "../../win95";
import type { WindowId } from "../registry";
import { wordPadMenu } from "../wordpad/WordPad";
import styles from "./DocViewer.module.css";

interface DocViewerProps {
  id: WindowId;
  /** The document, compiled from markdown at build time. */
  html: string;
  controls: WindowControls;
}

// A read-only WordPad showing one document from content/docs/ or one project from
// content/projects/. The markdown is compiled at build time (src/docs, src/projects)
// from files we author ourselves, so the HTML is trusted and rendered as-is.
export default function DocViewer({ id, html, controls }: DocViewerProps) {
  return (
    <AppWindow id={id} controls={controls} menu={wordPadMenu(controls.onClose)}>
      <div className={styles.page}>
        <article className={styles.document} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <StatusBar>For Help, press F1</StatusBar>
    </AppWindow>
  );
}
