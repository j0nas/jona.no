import type { WindowControls } from "../../components/window/AppWindow";
import FolderWindow from "../folder/FolderWindow";

// Every domain I own, as Internet shortcuts that open in a new browser tab.
const domains = [
  "formeriet.no",
  "codegreen.no",
  "pep.dev",
  "jonas-jensen.com",
  "jensen.codes",
  "edh.land",
];

export default function Domains({ controls }: { controls: WindowControls }) {
  return (
    <FolderWindow
      id="domains"
      controls={controls}
      items={domains.map((domain) => ({
        key: domain,
        icon: "/img/win95/internet-shortcut-32.png",
        label: domain,
        shortcut: true,
        onOpen: () => window.open(`https://${domain}`, "_blank", "noopener,noreferrer"),
      }))}
    />
  );
}
