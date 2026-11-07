import type { WindowControls } from "../../components/window/AppWindow";
import FolderWindow from "../folder/FolderWindow";
import { apps, type WindowId } from "../registry";
import { docs } from "../../docs";

export const CV_FILE_NAME = "Jonas Jensen CV.doc";

interface DocumentsProps {
  controls: WindowControls;
  onOpen: (id: WindowId) => void;
}

// A folder window listing the CV and every document in content/docs/ as a WordPad
// file. Double-click (or Enter) opens it in its own read-only window.
export default function Documents({ controls, onOpen }: DocumentsProps) {
  return (
    <FolderWindow
      id="documents"
      controls={controls}
      items={[
        { key: "cv", icon: apps.cv.icon, label: CV_FILE_NAME, onOpen: () => onOpen("cv") },
        ...docs.map((doc) => ({
          key: doc.slug,
          icon: apps.wordpad.icon,
          label: doc.fileName,
          onOpen: () => onOpen(`docs/${doc.slug}`),
        })),
      ]}
    />
  );
}
