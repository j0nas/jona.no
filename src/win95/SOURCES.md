# Windows 95 — canonical sources

This library is a **pixel-accurate** reproduction of the Windows 95 (4.00.950) UI. The rule is
simple: **every visual value traces to a Microsoft primary source or a faithful reimplementation
of one — nothing is eyeballed.** This document is the spec-of-record. Code carries a terse inline
citation (e.g. `/* COLOR_3DFACE */` or `see SOURCES.md §Bevels`); the full provenance lives here
so it can be audited in one place and lifted wholesale if this is ever extracted into a
standalone package.

## How we document style choices

- **This file is the source of truth.** Each value below maps to a named Win32 constant /
  metric / algorithm and the document that defines it, or to pixels sampled from an RTM capture.
- **Inline comments cite, they don't re-derive.**
- **When a choice could be mistaken for Win98/later, we say so explicitly** (§Win95-specific).
- **Sampling beats memory, and RTM beats betas.** A value sampled from a 1:1, 24-bit capture of
  the released 4.00.950 overrides every other source. 16-colour captures can't show
  `COLOR_3DLIGHT` (it renders as `#c0c0c0`), so they're used for geometry only.

## Primary sources

- **[S1] _The Windows Interface Guidelines for Software Design_** (Microsoft Press, 1995): Win95
  UI anatomy, spacing and behaviour. The archive.org copy is lending-restricted; the Feb-1995
  preliminary edition is public:
  <https://ics.uci.edu/~kobsa/courses/ICS104/course-notes/Microsoft_WindowsGuidelines.pdf>
- **[S2] `GetSysColor`**: every system colour index (`COLOR_*`); the "Windows Standard" scheme
  is the set of defaults. <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsyscolor>
- **[S3] `GetSystemMetrics`**: every system metric (`SM_*`), at 96 DPI.
  <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetrics>
- **[S4] `DrawEdge` / `DrawFrameControl`**: the GDI calls that paint every 3D edge and control.
  For the line order and colour tables we read the clean-room reimplementations: Wine 0.9
  (`dlls/user/uitools.c`, `button.c`, `sysparams.c`, which still carry the Win9x defaults) and
  ReactOS (`user32/windows/draw.c`). ReactOS is an operating system, unrelated to React95.
  Neither is a code dependency. <https://github.com/wine-mirror/wine/tree/wine-0.9/dlls/user>
- **[S5] Start menu banner bitmap**: `explorer.exe` resource 157, shipped as the real bitmap
  (`public/img/win95/start-banner.png`, 21px wide). The blue gradient banners belong to
  Windows 98 (res 157) and ME (res 161).
  <https://adamdemasi.com/2024/07/24/windows-nt-4-start-menu-watermark.html>
- **[S6] Pixel sampling of RTM captures**: the final authority. The captures used (1:1, 24-bit,
  exact palette): GUIdebook's Windows 95 gallery (`desktop_full`, `desktop_empty`, the Display
  Properties "Windows Standard" preview, Control Panel)
  <https://guidebookgallery.org/screenshots/win95>, and BetaWiki's 4.00.950 desktop (1024×768),
  About and Explorer captures <https://betawiki.net/wiki/Windows_95>. Geometry only: the Windows
  95 Tour frames (16-colour) and a German Shut Down dialog (VirtualBox palette, Wikimedia
  Commons). **Not used:** Commons' `Windows95-4.0.180-TaskManager.png` is beta build 180.
- **[S7] Icon set**: the Win95 16-colour shell icons (`public/img/win95/*.png`, from
  `@react95/icons`, MIT, as static assets only; not a dependency). The `shellNN` names are
  shell32.dll resource ids. `_32x32` for the desktop, folders and Start menu, `_16x16` for title
  bars and taskbar buttons. The shortcut overlay is shell32 #30. The Recycle Bin is #32, the
  empty bin, not #33 (full): Explorer shows the full one only while the bin holds something,
  and ours never does. The Domains folder's Internet
  shortcut icon (`internet-shortcut-*.png`) is url.dll #1102 from the same set (v2.5.3). The
  Start button flag (`start-flag.png`) and the arrow cursor (`cursor-arrow.png`) are cut from
  RTM captures [S6].

## Palette — "Windows Standard" scheme [S2][S6]

| Token                            | Hex                   | System colour                                         |
| -------------------------------- | --------------------- | ----------------------------------------------------- |
| `--w95-3d-dark-shadow`           | `#000000`             | `COLOR_3DDKSHADOW`                                    |
| `--w95-3d-shadow`                | `#808080`             | `COLOR_3DSHADOW` / `COLOR_BTNSHADOW`                  |
| `--w95-3d-face`                  | `#c0c0c0`             | `COLOR_3DFACE` / `COLOR_BTNFACE`                      |
| `--w95-3d-light`                 | `#dfdfdf`             | `COLOR_3DLIGHT` (sampled: frames, buttons, fields)    |
| `--w95-3d-highlight`             | `#ffffff`             | `COLOR_3DHIGHLIGHT` / `COLOR_BTNHIGHLIGHT`            |
| `--w95-window` / `-window-text`  | `#ffffff` / `#000000` | `COLOR_WINDOW` / `COLOR_WINDOWTEXT`                   |
| `--w95-active-title` / `-text`   | `#000080` / `#ffffff` | `COLOR_ACTIVECAPTION` / `COLOR_CAPTIONTEXT`           |
| `--w95-inactive-title` / `-text` | `#808080` / `#c0c0c0` | `COLOR_INACTIVECAPTION` / `COLOR_INACTIVECAPTIONTEXT` |
| `--w95-menu` / `-text`           | `#c0c0c0` / `#000000` | `COLOR_MENU` / `COLOR_MENUTEXT`                       |
| `--w95-highlight` / `-text`      | `#000080` / `#ffffff` | `COLOR_HIGHLIGHT` / `COLOR_HIGHLIGHTTEXT`             |
| `--w95-gray-text`                | `#808080`             | `COLOR_GRAYTEXT` (disabled)                           |
| `--w95-desktop`                  | `#008080`             | `COLOR_BACKGROUND` (teal)                             |
| `--w95-info-bk` / `-text`        | `#ffffe1` / `#000000` | `COLOR_INFOBK` / `COLOR_INFOTEXT` (Wine; not sampled) |

## Metrics — defaults @96 DPI [S3][S6]

| Token                  | Value  | Metric                                                      |
| ---------------------- | ------ | ----------------------------------------------------------- |
| `--w95-edge`           | `2px`  | `SM_CXEDGE`                                                 |
| `--w95-border`         | `1px`  | `SM_CXBORDER`                                               |
| `--w95-frame`          | `4px`  | `SM_CXFRAME` (sizing border); dialogs 3px (`SM_CXDLGFRAME`) |
| `--w95-caption-height` | `18px` | the caption band; `SM_CYCAPTION` = 19 = band + 1px face     |
| `--w95-menu-height`    | `19px` | `SM_CYMENU`                                                 |
| `--w95-scrollbar`      | `16px` | `SM_CXVSCROLL`                                              |
| `--w95-taskbar-height` | `28px` | the taskbar, same at 640×480 and 1024×768                   |
| font                   | `11px` | 8pt MS Sans Serif: 13px line, ascent 11, caps 9px           |

## Bevels — `DrawEdge` edge→colour tables [S4][S6]

Each 3D border stacks a 1px outer and a 1px inner line per side. **The bottom-right lines win the
corners** (sampled), so each ring lists its bottom-right shadow first; outer rings are listed
before inner ones.

| Token                     | Edge                   | TL outer / inner        | BR outer / inner        | Used for                                       |
| ------------------------- | ---------------------- | ----------------------- | ----------------------- | ---------------------------------------------- |
| `--w95-bevel-raised`      | `EDGE_RAISED`          | `3DLIGHT` / `HIGHLIGHT` | `DKSHADOW` / `SHADOW`   | window & dialog frames, menus, scrollbar parts |
| `--w95-bevel-raised-soft` | `EDGE_RAISED\|BF_SOFT` | `HIGHLIGHT` / `3DLIGHT` | `DKSHADOW` / `SHADOW`   | push, caption, Start and taskbar buttons       |
| `--w95-bevel-sunken`      | `EDGE_SUNKEN`          | `SHADOW` / `DKSHADOW`   | `HIGHLIGHT` / `3DLIGHT` | client edge, text fields, list panes           |
| `--w95-bevel-sunken-thin` | `BDR_SUNKENOUTER`      | `SHADOW`                | `HIGHLIGHT`             | status-bar fields, the tray                    |
| `--w95-bevel-pressed`     | `EDGE_SUNKEN\|BF_SOFT` | `DKSHADOW` / `SHADOW`   | `HIGHLIGHT` / `3DLIGHT` | held buttons, the active task button           |

- **Push buttons do have the `3DLIGHT` inner line** (sampled on RTM Cancel/OK buttons and the
  Start button). An earlier note here said otherwise, from a 16-colour image in which `#dfdfdf`
  can't appear.
- **Scrollbar thumbs and arrow buttons are `EDGE_RAISED`** (the frame bevel, sampled in RTM
  Explorer), not the push-button one. A held arrow goes flat (1px `SHADOW` ring).
- **The default button** adds a 1px black frame; held down it goes flat inside it (`DFCS_FLAT`,
  Wine's `PB_Paint`; not pixel-verified). The focus rectangle is dotted, 3px in (4px on a
  default button).

## Glyphs [S6]

Pixel grids in `glyphs.tsx`, `StatusBar.tsx` (size grip), `Dialog.tsx` (option button) and
`theme.css` (scroll arrows), drawn in `currentColor` where they invert on the selection.

- **Caption buttons** are 16×14, 2px below the band's top; Minimize and Maximize touch, Close
  sits 2px after them and 2px from the band's end. Glyph offsets inside the button: Minimize
  6×2 at (4,9), Maximize 9×9 at (3,2) with a 2px top, Restore 8×9 at (3,2) (Feb-95 figure),
  Close 8×7 at (4,3). Held, a glyph moves 1px down-right. Inactive windows keep black glyphs.
- **Submenu arrow** 4×7; **check mark** 7×7 at x+6; **option bullet** 5×5; **option button**
  12×12 (two rings and a white well, a 4×4 dot when chosen).
- **Scroll arrows**: 7×4 at (4,6) up/down; 4×7 at (5,4) left and (6,4) right.
- **Size grip**: three `HIGHLIGHT`/`SHADOW` ridges on a face square over the last status field's
  corner.

## Title bar and frame [S6]

- Sizable frame, outside in: `3DLIGHT`, `HIGHLIGHT`, face, face (top-left); `DKSHADOW`,
  `SHADOW`, face, face (bottom-right). Then the 18px caption band, a 1px face line, the 19px
  menu bar, and the client edge straight after.
- The small icon at (+2,+1); the bold title's ink from +21 (+3 with no icon, as in dialogs),
  caps top at +4. Active `#000080`/white, inactive `#808080`/`#c0c0c0`, both solid.
- A click on the icon opens the system menu (Restore, Move, Size, Minimize, Maximize, Close
  Alt+F4 in bold); a double-click on it closes the window; a double-click on the band maximizes
  or restores [S1].

## Menus [S6][S1]

- **Menu bar**: 19px, titles from the client's left edge with no margin, each its text plus 6px
  a side (the bitmap font inks 1px further right), caps top at +4.
- **The open title is a navy `COLOR_HIGHLIGHT` fill, 18px tall.** The sunken 3D title is Win98.
- **Popups**: a 3px border (`EDGE_RAISED` + 1px face) whose top overlaps the bar's last row;
  17px items, caps top at +3; the label from +22 past the check column; shortcuts in their own
  left-aligned column 9px after the widest label; 17px spare on the right; the arrow's right
  edge 7px in. Separators are 9px with a `SHADOW` line at +3 and a `HIGHLIGHT` line at +4 across
  the full width. Disabled items are embossed (`GRAYTEXT` over a `HIGHLIGHT` copy +1,+1), plain
  grey on the selection. Default items are bold. Submenus overlap their parent by 3px, first
  item level with the parent item.
- **Behaviour**: the highlight follows the mouse and the arrow keys; access keys fire items and
  their underlines always show; a submenu opens after the menu show delay (400ms, Wine's and
  later Windows' default; Win95's own value wasn't found) or at once on click / Right.

## Taskbar [S6]

- 28px; the top edge a `3DLIGHT` row then a `HIGHLIGHT` row; buttons 22px tall at y+4.
- **Start**: 54×22 at x=2, the flag at (+4,+3), bold "Start" inked from +23 with caps at +6.
  Open, it's pushed with the dotted focus rectangle 3px in. It opens on press.
- **Task buttons**: up to 160px, 3px apart, 4px after Start; icon at (+4,+3), label from +23.
  The active window's: pushed, the `HIGHLIGHT`/face checker behind it, bold, content +1,+1. A
  tooltip with the full title only when the label is cut off [S1].
- **Tray**: a 1px sunken box, 22px tall, 63px wide around the clock alone, its right edge 3px
  from the screen's; the clock "1:47 PM" centred, the long date as its tooltip.

## Start menu [S6]

- The popup border (3px); the banner 21px wide, full height; the menu's bottom edge rests on
  the Start button, over the taskbar's top edge. 164×239px with the stock entries.
- Top level: 32px rows, the 32px icon at (+6,+0), the label from +44 with caps at +11, 37px
  spare after the widest label, the arrow 6px in; the separator 9px with its lines at +2/+3.
- Flyouts: 22px rows with a 20px highlight (1px of face above and below), the 16px icon at
  (+6,+3), the label from +28, 30px spare; the first row level with its parent, overlapping it
  by 3px.
- Order: Programs, Documents, Settings, Find, Help, Run..., separator, Shut Down....

## Desktop and folder icons [S6][S1]

- 75×75 cells (`SM_CXICONSPACING` / `SM_CYICONSPACING`), auto-arranged from the top-left corner
  down the left, wrapping into columns; in a folder window left to right. The icon at (21,2),
  the label box from +38 in 13px lines, at most 75px wide.
- **Desktop labels are white on a box of the desktop colour, with no shadow.** Over a
  wallpaper that box shows (transparent icon text came with Win98's desktop update; the shadow
  with 2000/XP). In folders, labels are black on white.
- Selected: a 50% navy dither over the icon's own pixels and a navy label. The focused icon's
  label carries a dotted focus rectangle, XORed (pink on teal, yellow on navy).
- A click selects, a press on empty space clears, a double-click or Enter opens.

## Status bar, dialogs, tooltips [S6][S1]

- **Status bar**: 17px sunken fields 2px apart below a 2px gap, text 4px in with caps at +4; the
  size grip in the last field's corner. "N object(s)", or what's selected.
- **Dialogs**: the 3px dialog frame, a caption with only Close and no icon; 75×23 buttons.
  Shut Down greys the whole screen with a 50% black dither.
- **Tooltips**: `COLOR_INFOBK` in a 1px black box, 2px text margin; 500ms to appear, 5s shown
  (`TTM_SETDELAYTIME` defaults), below-right of the pointer.

## Behaviour [S1]

- **Windows move and size as an outline** (a `SM_CXFRAME`-wide dither XORed onto the screen)
  and follow on release. Showing window contents while dragging was a Microsoft Plus! feature.
- Menus appear at once: no slide or fade (Win98/2000).
- Ctrl+Esc opens the Start menu.
- The pointer is the RTM arrow (11×19, no shadow: pointer shadows are Win2000).

## Win95-specific — where the "authentic" libraries half-ass it

- **Title bars are SOLID navy `#000080`**. The gradient is Win98's `COLOR_GRADIENTACTIVECAPTION`.
- **The Start banner is solid grey**, not a blue gradient (Win98/ME, [S5]).
- **The dark shadow is true black `#000000`**. 98.css uses `#0a0a0a`.
- **Bevels are the real `DrawEdge` stacks**, with the bottom-right lines owning the corners.
- **An open menu-bar title is a navy fill**, not a 3D button (Win98).
- **Desktop icon labels have no shadow** and sit on the desktop colour.

## Not reproduced (known deviations)

- The minimize/restore caption zoom animation (`IDANI_CAPTION`).
- The wallpaper is scaled to cover the screen; Win95 could only tile or centre (stretching came
  with Plus!).
- The "It's now safe to turn off your computer" screen is set in text, not the LOGOS.SYS bitmap.
- Keyboard window moving/sizing (system menu Move / Size) and Alt+F4, which the browser owns.
