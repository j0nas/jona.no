import type { WindowControls } from "../../components/window/AppWindow";
import FolderWindow from "../folder/FolderWindow";
import { apps, type WindowId } from "../registry";
import { docs } from "../../docs";
import { CV_DOCS } from "../word/downloads/files";

interface DocumentsProps {
  controls: WindowControls;
  onOpen: (id: WindowId) => void;
}

// A folder window listing the CV in each language and every document in content/docs/ as a WordPad
// file. Double-click (or Enter) opens it in its own read-only window.
export default function Documents({ controls, onOpen }: DocumentsProps) {
  return (
    <FolderWindow
      id="documents"
      controls={controls}
      items={[
        { key: "cv", icon: apps.cv.icon, label: CV_DOCS.en, onOpen: () => onOpen("cv") },
        {
          key: "cv/no",
          icon: apps["cv/no"].icon,
          label: CV_DOCS.no,
          onOpen: () => onOpen("cv/no"),
        },
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
