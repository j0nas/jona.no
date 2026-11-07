import type { ReactNode } from "react";
import { Window, type Menu } from "../../win95";
import { windowMeta, type WindowId } from "../../apps/registry";

/** The per-window state Desktop owns and threads into each app's window. */
export interface WindowControls {
  initialX: number;
  initialY: number;
  zIndex: number;
  active: boolean;
  minimized: boolean;
  initialMaximized?: boolean;
  /** Spawn this tall rather than the window's default height. */
  initialHeight?: number;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
}

interface AppWindowProps {
  id: WindowId;
  controls: WindowControls;
  menu?: Menu[];
  children: ReactNode;
}

// Pairs a window's metadata (icon, title, default size — an app's registry entry
// or a document's synthesised one) with the live window controls Desktop
// supplies, then renders our owned <Window>.
export default function AppWindow({ id, controls, menu, children }: AppWindowProps) {
  const { iconSmall, title, defaultSize } = windowMeta(id);
  return (
    <Window
      title={title}
      icon={iconSmall}
      width={defaultSize.width}
      height={controls.initialHeight ?? defaultSize.height}
      menu={menu}
      {...controls}
    >
      {children}
    </Window>
  );
}
