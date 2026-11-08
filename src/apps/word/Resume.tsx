import { Fragment, type ReactNode } from "react";
import { field, type FieldAttribute } from "@touchup/vite/field";
import {
  GAP,
  credentials,
  dateRange,
  displayUrl,
  footerLabel,
  formatBirthDate,
  formatDate,
  formatLocation,
  groupByEmployer,
  inlineRuns,
  isEarly,
  paragraphs,
  projectRight,
  schoolStudy,
  studyKeys,
  telHref,
  textGroups,
  WORDS,
  type Basics,
  type Certificate,
  type Education,
  type Employer,
  type Fact,
  type Lang,
  type Language,
  type Project,
  type Resume,
  type Skill,
} from "./resumeData";
import styles from "./Resume.module.css";

/** A piece of the CV that stays whole on a page, and the points of space above it. */
export interface ResumeBlock {
  key: string;
  gap: number;
  node: ReactNode;
}

function Link({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children ?? displayUrl(href)}
    </a>
  );
}

/** Text from the résumé, with its links. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {inlineRuns(text).map(({ text, href }, i) =>
        href ? (
          <Link key={i} href={href}>
            {text}
          </Link>
        ) : (
          text
        ),
      )}
    </>
  );
}

/**
 * field() for text that Rich shows. A Markdown link shows its words without its address, and a value
 * of several paragraphs shows across several elements, so neither is what an element shows, and
 * gets no ref: Touchup takes the element's text to be the whole value.
 */
function richField<T extends object>(parent: T, key: keyof T & (string | number)): FieldAttribute {
  const value: unknown = parent[key];
  if (typeof value !== "string" || value.includes("\n")) return {};
  if (inlineRuns(value).some((run) => run.href)) return {};
  return field(parent, key);
}

/** Values in a row, as `join` would put them, each a node of its own so it can carry its ref. */
function joined(nodes: ReactNode[], separator = ", "): ReactNode {
  return nodes.map((node, i) => (
    <Fragment key={i}>
      {i > 0 && separator}
      {node}
    </Fragment>
  ));
}

/** A line with something flush left and something tabbed flush right, as a résumé's dates are. */
function Line({
  left,
  leftField,
  right,
  className,
}: {
  left?: ReactNode;
  /** The ref of the value `left` shows, when it shows just that. */
  leftField?: FieldAttribute;
  right?: ReactNode;
  className: string;
}) {
  if (!left && !right) return null;
  return (
    <div className={`${styles.line} ${className}`}>
      <span {...leftField}>{left}</span>
      {right && <span className={styles.right}>{right}</span>}
    </div>
  );
}

/** A paragraph or a highlight, and the ref of the value it is. */
interface Piece {
  text: string;
  field: FieldAttribute;
  bullet?: boolean;
}

const bulletsOf = (list: string[] = []): Piece[] =>
  list.map((text, i) => ({ text, field: richField(list, i), bullet: true }));

/** A value's paragraphs, which have its ref if it's just the one. */
function paragraphsOf<T extends object>(parent: T, key: keyof T & string): Piece[] {
  const value: unknown = parent[key];
  if (typeof value !== "string") return [];
  return paragraphs(value).map((text) => ({ text, field: richField(parent, key) }));
}

function Bullets({ items }: { items: Piece[] }) {
  if (!items.length) return null;
  return (
    <ul className={styles.bullets}>
      {items.map((item, i) => (
        <li key={i} {...item.field}>
          <Rich text={item.text} />
        </li>
      ))}
    </ul>
  );
}

/** Paragraphs as paragraphs, and a run of bullets as a list. */
function Pieces({ items }: { items: Piece[] }) {
  const nodes: ReactNode[] = [];
  items.forEach((item, i) => {
    if (item.bullet) {
      if (!items[i - 1]?.bullet) {
        const end = items.findIndex((next, j) => j > i && !next.bullet);
        nodes.push(<Bullets key={i} items={items.slice(i, end < 0 ? undefined : end)} />);
      }
    } else {
      nodes.push(
        <p key={i} className={styles.text} {...item.field}>
          <Rich text={item.text} />
        </p>,
      );
    }
  });
  return nodes;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className={styles.section}>{children}</h2>;
}

/**
 * An employer and its roles: the dates on the employer's line, or on each role when it's several.
 * A heading over several roles shows the name each of them has, and an edit through a ref to one
 * would split them, so it has none.
 */
function JobHead({ employer, lang }: { employer: Employer; lang: Lang }) {
  const name = employer.url ? <Link href={employer.url}>{employer.name}</Link> : employer.name;
  const only = employer.roles.length === 1 ? employer.roles[0] : undefined;
  return (
    <div className={`${styles.jobHead}${isEarly(employer) ? ` ${styles.early}` : ""}`}>
      {!!employer.logos.length && (
        <div className={styles.logos}>
          {employer.logos.map((logo, i) => (
            <img
              key={i}
              src={logo.image}
              alt=""
              style={{ width: `${logo.width}pt`, height: `${logo.height}pt` }}
            />
          ))}
        </div>
      )}
      <Line
        className={styles.employer}
        left={name}
        leftField={only && field(only, "name")}
        right={only && dateRange(only.startDate, only.endDate, true, lang)}
      />
      {employer.roles.map((role, i) => (
        <Line
          key={i}
          className={styles.role}
          left={role.position}
          leftField={field(role, "position")}
          right={!only && dateRange(role.startDate, role.endDate, true, lang)}
        />
      ))}
    </div>
  );
}

function School({ school, lang }: { school: Education; lang: Lang }) {
  const study = schoolStudy(school);
  const name = school.url ? (
    <Link href={school.url}>{school.institution}</Link>
  ) : (
    school.institution
  );
  return (
    <>
      <Line
        className={styles.row}
        left={
          <>
            {joined(
              studyKeys(school).map((key) => <span {...field(school, key)}>{school[key]}</span>),
            )}
            {study && name && ", "}
            <span {...field(school, "institution")}>{name}</span>
          </>
        }
        right={dateRange(school.startDate, school.endDate, false, lang)}
      />
      {school.score && (
        <p className={styles.text} {...field(school, "score")}>
          {school.score}
        </p>
      )}
      {!!school.courses?.length && (
        <p className={styles.text}>
          {joined(
            school.courses.map((course, i) => <span {...field(school.courses, i)}>{course}</span>),
            "; ",
          )}
        </p>
      )}
    </>
  );
}

function CertificateRow({ certificate, lang }: { certificate: Certificate; lang: Lang }) {
  const { name, url, issuer, date } = certificate;
  return (
    <Line
      className={styles.row}
      left={
        <>
          <span {...field(certificate, "name")}>{url ? <Link href={url}>{name}</Link> : name}</span>
          {name && issuer && ", "}
          <span {...field(certificate, "issuer")}>{issuer}</span>
        </>
      }
      right={date && formatDate(date, lang)}
    />
  );
}

function ProjectEntry({ project, lang }: { project: Project; lang: Lang }) {
  const title = project.url ? <Link href={project.url}>{project.name}</Link> : project.name;
  return (
    <>
      <Line
        className={styles.project}
        left={title}
        leftField={field(project, "name")}
        right={projectRight(project, lang)}
      />
      {(project.entity || project.type || !!project.roles?.length) && (
        <p className={styles.note}>
          {joined(
            [
              project.entity && <span {...field(project, "entity")}>{project.entity}</span>,
              project.type && <span {...field(project, "type")}>{project.type}</span>,
              ...(project.roles ?? []).map(
                (role, i) => role && <span {...field(project.roles, i)}>{role}</span>,
              ),
            ].filter(Boolean),
          )}
        </p>
      )}
      {project.description && (
        <p className={styles.text} {...field(project, "description")}>
          {project.description}
        </p>
      )}
      <Bullets items={bulletsOf(project.highlights)} />
      {!!project.keywords?.length && (
        <p className={styles.note}>
          {joined(
            project.keywords.map((keyword, i) => (
              <span {...field(project.keywords, i)}>{keyword}</span>
            )),
          )}
        </p>
      )}
    </>
  );
}

function Skills({ skills }: { skills: Skill[] }) {
  const grouped = skills.filter((skill) => skill.keywords?.length);
  const plain = skills.filter((skill) => !skill.keywords?.length);
  return (
    <>
      {grouped.map((skill, i) => (
        <p key={i} className={styles.skill}>
          <strong>
            <span {...field(skill, "name")}>{skill.name}</span>
            {skill.level && (
              <>
                {" ("}
                <span {...field(skill, "level")}>{skill.level}</span>)
              </>
            )}
            :
          </strong>{" "}
          {joined(
            skill.keywords!.map((keyword, i) => (
              <span {...field(skill.keywords, i)}>{keyword}</span>
            )),
          )}
        </p>
      ))}
      {!!plain.length && (
        <p className={styles.skill}>
          {joined(
            plain
              .filter((skill) => skill.name)
              .map((skill) => <span {...field(skill, "name")}>{skill.name}</span>),
          )}
        </p>
      )}
    </>
  );
}

/** languageList's "English (native), Norwegian (native)", with each value in a span of its own. */
function Languages({ languages }: { languages: Language[] }) {
  return joined(
    languages
      .filter(({ language, fluency }) => language || fluency)
      .map((entry) => (
        <>
          {entry.language && <span {...field(entry, "language")}>{entry.language}</span>}
          {entry.language && entry.fluency && " "}
          {entry.fluency && (
            <>
              (<span {...field(entry, "fluency")}>{entry.fluency}</span>)
            </>
          )}
        </>
      )),
  );
}

function Tldr({ facts }: { facts: Fact[] }) {
  return (
    <>
      {facts.map((fact, i) => (
        <div key={i} className={styles.fact}>
          <span className={styles.factLabel} {...field(fact, "label")}>
            {fact.label}
          </span>
          <span {...richField(fact, "text")}>
            <Rich text={fact.text ?? ""} />
          </span>
        </div>
      ))}
    </>
  );
}

/** Where to find him: the header's line, and the closing's. The phone comes last, as on paper. */
function contactItems(basics: Basics, lang: Lang): ReactNode[] {
  const contact: ReactNode[] = [];
  const location = formatLocation(basics.location, lang);
  if (location) contact.push(location);
  if (basics.email) {
    contact.push(
      <a href={`mailto:${basics.email}`} {...field(basics, "email")}>
        {basics.email}
      </a>,
    );
  }
  if (basics.url) contact.push(<Link href={basics.url} />);
  for (const profile of basics.profiles ?? []) {
    if (profile.url) contact.push(<Link href={profile.url} />);
    else if (profile.username) contact.push(`${profile.network}: ${profile.username}`);
  }
  if (basics.phone) {
    contact.push(
      <a href={telHref(basics.phone)} {...field(basics, "phone")}>
        {basics.phone}
      </a>,
    );
  }
  return contact;
}

function Contact({ basics, lang, className }: { basics: Basics; lang: Lang; className: string }) {
  return (
    <p className={className}>
      {contactItems(basics, lang).map((item, i) => (
        <span key={i} className={styles.contactItem}>
          {item}
        </span>
      ))}
    </p>
  );
}

function Header({ basics, lang }: { basics: Basics; lang: Lang }) {
  return (
    <header>
      <div className={styles.nameLine}>
        {basics.name && (
          <h1 className={styles.name} {...field(basics, "name")}>
            {basics.name}
          </h1>
        )}
        {basics.birthDate && (
          <span className={styles.born}>{formatBirthDate(basics.birthDate, lang)}</span>
        )}
      </div>
      {basics.label && (
        <p className={styles.label} {...field(basics, "label")}>
          {basics.label}
        </p>
      )}
      <Contact basics={basics} lang={lang} className={styles.contact} />
    </header>
  );
}

/** The gap above a block, as the sheet needs it; at the top of a page, as in Word, there is none. */
function gapStyle(gap: number, top: boolean) {
  return top ? undefined : { paddingTop: `${gap}pt` };
}

/**
 * The CV as unbreakable blocks, for Word's page breaks. A section's heading is glued to its first
 * entry and an employer's to what's under it, so neither can end a page alone, and a job's last two
 * paragraphs or bullets stay together, so one can't start a page alone.
 */
export function resumeBlocks(resume: Resume, lang: Lang = "en"): ResumeBlock[] {
  const { basics = {} } = resume;
  const words = WORDS[lang];
  const blocks: ResumeBlock[] = [
    { key: "header", gap: 0, node: <Header basics={basics} lang={lang} /> },
  ];

  const section = (title: string, entries: Omit<ResumeBlock, "key">[]) => {
    entries.forEach(({ gap, node }, i) => {
      blocks.push({
        key: `${title}-${i}`,
        gap: i ? gap : GAP.section,
        node: i ? (
          node
        ) : (
          <>
            <SectionHeading>{title}</SectionHeading>
            {node}
          </>
        ),
      });
    });
  };

  if (basics.summary) {
    blocks.push({
      key: "summary",
      gap: GAP.summary,
      node: <Pieces items={paragraphsOf(basics, "summary")} />,
    });
  }

  if (basics.tldr?.length) {
    section("tl;dr", [{ gap: 0, node: <Tldr facts={basics.tldr} /> }]);
  }

  const work: Omit<ResumeBlock, "key">[] = [];
  let earlier = false;
  for (const employer of groupByEmployer(resume.work)) {
    // Each role's own, for their refs; the employer's text has lost where each piece came from.
    const pieces = [
      ...employer.roles.flatMap((role) => paragraphsOf(role, "summary")),
      ...employer.roles.flatMap((role) => bulletsOf(role.highlights)),
    ];
    const { head, rest } = textGroups(pieces);
    const early = isEarly(employer);
    const node = (
      <>
        <JobHead employer={employer} lang={lang} />
        <Pieces items={head} />
      </>
    );
    // Early jobs stay together, so a line or two of one can't start a page by itself.
    const previous = work.at(-1);
    if (early && earlier && previous) {
      previous.node = (
        <>
          {previous.node}
          <div style={gapStyle(GAP.earlyJob, false)}>{node}</div>
        </>
      );
    } else {
      work.push({ gap: early ? GAP.earlyJob : GAP.job, node });
    }
    // The rest of a job's text can run on over a page.
    work.push(...rest.map((group) => ({ gap: GAP.bullet, node: <Pieces items={group} /> })));
    earlier = early;
  }
  section(words.experience, work);

  section(
    words.projects,
    (resume.projects ?? []).map((project) => ({
      gap: GAP.project,
      node: <ProjectEntry project={project} lang={lang} />,
    })),
  );

  const schoolsAndCertificates = credentials(resume);
  if (schoolsAndCertificates.length) {
    section(words.education, [
      {
        gap: 0,
        node: (
          <>
            {schoolsAndCertificates.map(({ school, certificate }, i) =>
              school ? (
                <School key={i} school={school} lang={lang} />
              ) : (
                <CertificateRow key={i} certificate={certificate} lang={lang} />
              ),
            )}
          </>
        ),
      },
    ]);
  }

  if (resume.languages?.length) {
    section(words.languages, [
      {
        gap: 0,
        node: (
          <p className={styles.text}>
            <Languages languages={resume.languages} />
          </p>
        ),
      },
    ]);
  }

  // The skills, then the closing's paragraphs and where to find him, as the end of the letter.
  const closing = (basics.closing ?? []).map((text, i) => ({
    text,
    field: richField(basics.closing!, i),
  }));
  const other: Omit<ResumeBlock, "key">[] = [];
  if (resume.skills?.length) other.push({ gap: 0, node: <Skills skills={resume.skills} /> });
  if (closing.length) {
    other.push({
      gap: GAP.bullet,
      node: (
        <>
          <Pieces items={closing} />
          <Contact basics={basics} lang={lang} className={styles.closingContact} />
        </>
      ),
    });
  }
  section(words.other, other);

  // The last two stay together, so the last page can't be one short section by itself.
  if (blocks.length > 2) {
    const last = blocks.pop()!;
    const previous = blocks.pop()!;
    blocks.push({
      ...previous,
      node: (
        <>
          {previous.node}
          <div style={gapStyle(last.gap, false)}>{last.node}</div>
        </>
      ),
    });
  }

  return blocks;
}

/** Sheets of A4, each holding the blocks Word's pagination gave it; both the screen and the printer. */
export function Sheets({
  blocks,
  pages,
  name,
}: {
  blocks: ResumeBlock[];
  pages: number[][];
  name?: string;
}) {
  return (
    <>
      {pages.map((page, i) => (
        <article key={i} className={styles.sheet}>
          {page.map((index, j) => (
            <div
              key={blocks[index].key}
              className={styles.block}
              style={gapStyle(blocks[index].gap, j === 0)}
            >
              {blocks[index].node}
            </div>
          ))}
          <div className={styles.pageFooter}>
            {footerLabel(name)} · {i + 1}/{pages.length}
          </div>
        </article>
      ))}
    </>
  );
}

/** The same blocks in Word's Online Layout view: the text reflowed to the window, with no pages. */
export function OnlineLayout({ blocks }: { blocks: ResumeBlock[] }) {
  return (
    <article className={styles.online}>
      {blocks.map((block, i) => (
        <div key={block.key} className={styles.block} style={gapStyle(block.gap, i === 0)}>
          {block.node}
        </div>
      ))}
    </article>
  );
}

/** The blocks at text width, off screen, so they can be measured for pagination. */
export function Measure({
  blocks,
  measureRef,
  lang,
}: {
  blocks: ResumeBlock[];
  measureRef: (element: HTMLDivElement | null) => void;
  lang: string;
}) {
  return (
    <div ref={measureRef} className={styles.measure} lang={lang} aria-hidden="true">
      {blocks.map((block) => (
        <div key={block.key} className={styles.block}>
          {block.node}
        </div>
      ))}
    </div>
  );
}
