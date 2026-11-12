import { Marked } from "marked";
import { linkRenderer, render } from "../docs";

// The Projects folder: every markdown file in content/projects/ is a project.
// Adding one is adding a file: the folder's icon, its description in the
// folder's web view, the project's own window and its /project/<slug> deep link
// all derive from it. The slug is the file name. The file opens with a block of
// `key: value` lines between `---` fences (see Frontmatter); the markdown after
// it is the project's write-up.

export const KINDS = [
  { id: "web", label: "Web products" },
  { id: "agents", label: "Coding agents and local models" },
  { id: "hardware", label: "Hardware" },
  { id: "design", label: "Design and 3D" },
] as const;

export type ProjectKind = (typeof KINDS)[number]["id"];

interface Frontmatter {
  title: string;
  /** One line under the name, in the web view and the window. */
  tagline: string;
  kind: ProjectKind;
  /** Its place within its kind, from 1. */
  order: number;
  when: string;
  stack: string;
  status?: string;
  /** Markdown links, shown under "Links". */
  links?: string;
  /** A file in public/img/projects/. */
  image?: string;
  /** What the image shows, for its alt text. */
  imageAlt?: string;
  /** The project's icon: public/img/projects/icons/<icon>-32.png and -16.png. */
  icon: string;
}

export interface Project extends Frontmatter {
  slug: string;
  iconLarge: string;
  iconSmall: string;
  imageUrl?: string;
  /** Links as inline HTML, for the web view. */
  linksHtml?: string;
  /** The window's document: name, picture, facts, then the write-up. */
  html: string;
}

const sources = import.meta.glob("../../content/projects/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const inline = new Marked({ gfm: true }).use({ renderer: linkRenderer });

const REQUIRED = ["title", "tagline", "kind", "order", "when", "stack", "icon"] as const;

/** Splits a file into its `key: value` block and the markdown after it. */
export function parse(slug: string, source: string): { meta: Frontmatter; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  if (!match) throw new Error(`content/projects/${slug}.md has no --- block`);
  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) fields[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  for (const key of REQUIRED) {
    if (!fields[key]) throw new Error(`content/projects/${slug}.md has no ${key}`);
  }
  if (!KINDS.some((k) => k.id === fields.kind)) {
    throw new Error(`content/projects/${slug}.md has an unknown kind, ${fields.kind}`);
  }
  return {
    meta: { ...fields, order: Number(fields.order) } as unknown as Frontmatter,
    body: source.slice(match[0].length),
  };
}

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function compile(slug: string, source: string): Project {
  const { meta, body } = parse(slug, source);
  const imageUrl = meta.image && `/img/projects/${meta.image}`;
  const linksHtml = meta.links && inline.parseInline(meta.links, { async: false });
  const facts: [string, string | undefined][] = [
    ["When", escape(meta.when)],
    ["Built with", escape(meta.stack)],
    ["Status", meta.status && escape(meta.status)],
    ["Links", linksHtml],
  ];
  const html = [
    `<h1>${escape(meta.title)}</h1>`,
    `<p class="tagline">${escape(meta.tagline)}</p>`,
    imageUrl &&
      `<figure><img src="${imageUrl}" alt="${escape(meta.imageAlt ?? "")}" loading="lazy"></figure>`,
    `<table class="facts">${facts
      .filter(([, value]) => value)
      .map(([name, value]) => `<tr><th>${name}</th><td>${value}</td></tr>`)
      .join("")}</table>`,
    render(`project-${slug}`, body),
  ]
    .filter(Boolean)
    .join("\n");
  return {
    ...meta,
    slug,
    iconLarge: `/img/projects/icons/${meta.icon}-32.png`,
    iconSmall: `/img/projects/icons/${meta.icon}-16.png`,
    imageUrl,
    linksHtml,
    html,
  };
}

const kindIndex = (kind: ProjectKind) => KINDS.findIndex((k) => k.id === kind);

export const projects: Project[] = Object.entries(sources)
  .map(([path, source]) => compile(path.slice(path.lastIndexOf("/") + 1, -3), source))
  .sort((a, b) => kindIndex(a.kind) - kindIndex(b.kind) || a.order - b.order);

export const projectBySlug = new Map(projects.map((p) => [p.slug, p]));
