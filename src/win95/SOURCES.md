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

## Internet Explorer 3 (`src/apps/internet/`)

[S8] is the authority: **IE 3.02's own binaries**, 4.70.1300 from WinWorld
(<https://winworldpc.com/product/internet-explorer/ie-30>), with `Iexplore.cab` unpacked and the PE
resources read as data, never run. Geometry and placement are sampled from two captures:
**[S9]** GUIdebook's Windows 95B browser shot, 480×321, 1:1 but in 16 colours
(<https://guidebookgallery.org/screenshots/browser>), and **[S10]** WinWorld's 640×480 IE 3.02 shot
in 256 colours, on the same page as the download.

- **Coolbar bitmap** (`img/home/ie3-coolbar.png`): `shdocvw.dll` bitmap #259, 640×125, tiled from
  (2,2) across both bands; that origin matches [S10] on 200/200 sampled pixels. A 16-colour display
  draws the bands flat instead, which is why [S9] looks different.
- **Toolbar** (`ie3-toolbar.png`): `shdocvw.dll` #261 (cold, grey) and #262 (hot, colour), 14 cells
  of 30×20 keyed on magenta; Stop's red cell while loading is cell 12 of #261. The third row,
  disabled, is generated (dark pixels as `SHADOW` over a `HIGHLIGHT` copy +1,+1) and matches Back and
  Forward in [S9] on 600/600 pixels each.
- **Throbber** (`ie3-throbber.png`): `shdocvw.dll` #267, a 46-frame 38×38 filmstrip on black, in a
  41×40 cell at (+1,+1). **The frame time is a guess** (100ms); one pass is one "page load".
- **Hand cursor** (`ie3-hand.png`): `mshtml.dll` cursor #45, hotspot (5,0), on the page's links only.
- **Icons**: the desktop's `win95/internet-32.png` is `iexplore.exe` group 32528, 16-colour, and
  matches "The Internet" on GUIdebook's Windows 95B desktop on every pixel. The caption and status
  bar's `internet-16.png` is `shdocvw.dll` group 272, matching [S9] and [S10] exactly at (+2,+1).
- **Metrics** [S9]: etched grooves of `SHADOW` then `HIGHLIGHT` around and between bands; a 40px
  toolbar band and a 26px address band; grippers of two 3px raised ridges 2px in; 50×40 buttons
  from +14, the cell at +3; a 22px combo box; 3px of face before the page's client edge; status
  fields of the rest, 101px and 66px.
- **Menus**: the strings are `shdocvw.dll` menus #256 and #258 and `mshtml.dll` #32515.
- **The hot button's 1px raised bevel is from memory**: no capture shows the pointer on a button.

## The home page's GIFs (`img/home/*.gif`)

Period GIFs from GeoCities pages, found with GifCities (<https://gifcities.org>, the Internet
Archive's search) and fetched from its store by checksum, picked for saying nothing about anyone.
Total weight 84 KB. Listed so any of them can be traced back; URLs are as archived.

| File                     | From                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| `globe-spinning.gif`     | `geocities.com/iciaos/globe.gif`                                        |
| `under-construction.gif` | `geocities.com/picklel0af/UnderConstruction.gif`                        |
| `digger.gif`             | `geocities.com/jpdetroitusa/CONSTRUCTION_ANIMEE.gif`                    |
| `new-burst.gif`          | `geocities.com/angeljulie2/ani-new.gif`                                 |
| `new-small.gif`          | `geocities.com/ardharn/new.gif`                                         |
| `divider-rainbow.gif`    | `geocities.com/orcanut2002/rainbowspiral.gif`                           |
| `divider-lights.gif`     | `uk.geocities.com/necnld/animatedrainbowline.gif`                       |
| `divider-arrows.gif`     | `geocities.com/sweetdaphne86/A-rainbowbar2front.gif`                    |
| `mailbox.gif`            | `geocities.com/RainForest/4627/icons/email6.gif`                        |
| `ball.gif`               | `geocities.com/visoka123/images/bluered.gif`                            |
| `guestbook.gif`          | `geocities.com/greatsunjester/signguestbook.gif`                        |
| `computer.gif`           | `geocities.com/lavoiep66/computer.gif`                                  |
| `stars.gif`              | `hk.geocities.com/robertoyip/stars.gif`; `stars-still.gif` is frame one |

`badge-*.gif` are 88×31 buttons from <https://cyber.dabamos.de/88x31/>, same names:
`msexplorer`, `built_notepad`, `mspaint`, `800x600`, `anybrowser2`, `win95`.

## Word 97 (`src/apps/word/`)

**[S11]** WinWorld's two 640×480 Word 97 captures on Windows 95, 256 colours, 1:1
(<https://winworldpc.com/product/microsoft-word/97>): the Letter Wizard shot (toolbars, page, status
bar, the Assistant's balloon) and the About shot (the ruler). No Word 97 binaries were used.

- **Toolbar buttons** (`img/cv/word-toolbar.png`): every button cut from [S11] as a 23×22 cell,
  face colour keyed out, disabled looks included (Cut, Copy, Redo, Excel). Justify was captured
  pressed, so its dither and bevel are keyed away too; a button that's on gets them back in CSS.
- **Command bars** [S11]: a 1px raised outline; a 23px menu bar and 26px toolbars; a gripper of two
  3px ridges from +4; separators of `SHADOW` and `HIGHLIGHT`; flat 15px combos 90, 110 and 35px
  wide (Style, Font, Size) and 52px (Zoom). The menu bar's document icon is Winword #2. **A
  lifting and sinking button or menu title is from memory**: the captures don't show the pointer on
  one. So is the menus' content, unlike IE's, and their real toolbar icons aren't drawn.
- **Ruler** [S11]: 5px of face, a 13px strip, 6px of face; eighth-inch ticks 12px apart, 2px tall;
  half inches 5px; tab stops 3px below it. The indent marker (`word-ruler-marker.png`) and tab
  selector are cut from the capture. **The grey over the margins is from memory**, since [S11]'s ruler
  is in normal view.
- **Workspace** [S11]: `#808080`; the page a 1px black edge, 3px on the right and below.
- **View buttons, Select Browse Object** (`word-scroll-glyphs.png`): glyphs cut from [S11] and put on
  `EDGE_RAISED` buttons. The horizontal scroll bar is drawn with nothing to scroll: the page always
  fits.
- **Status bar** [S11]: fields 182, 159, 27, 24, 25, 26, 28, 44 and 35px, 5px apart.
- **Office Assistant** [S11]: a window with a 15px caption and close box, a stage gradient
  through sampled greys; the balloon `#ffffcf`, 1px black, its bullet (`clippy-bullet.png`) cut from
  the capture. **The sprite isn't Word 97's**: `clippyjs`'s Clippy (`clippy-map.png`,
  `clippy-agent.json`) is the later Microsoft Agent one, 124×93, where Word 97's stage is 92×68.
  Those two files are clippyjs 0.1.0's agent module, repacked to the 13 animations used, without
  sound, for 339 KB against its 1.3 MB.
- **Icons**: Winword #1 (the caption's W) and #2 (the file's icon), `@react95/icons` v2.8.0 as in
  [S7]. #2 matches [S11] exactly; #1 is cut from the same resource.
- **The document's look**: Word 97's résumé templates are the idea, but **no copy of them or capture
  was found**. The Times New Roman and Arial, thin rules and tabbed dates are from memory of
  them.

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
