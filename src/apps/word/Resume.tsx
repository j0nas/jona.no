import type { ReactNode } from "react";
import {
  GAP,
  credentials,
  dateRange,
  displayUrl,
  footerLabel,
  formatDate,
  formatLocation,
  groupByEmployer,
  highlightGroups,
  inlineRuns,
  languageList,
  projectRight,
  schoolStudy,
  type Certificate,
  type Education,
  type Employer,
  type Fact,
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

/** Text from resume.json, with its links. */
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

/** A line with something flush left and something tabbed flush right, as a résumé's dates are. */
function Line({
  left,
  right,
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  className: string;
}) {
  if (!left && !right) return null;
  return (
    <div className={`${styles.line} ${className}`}>
      <span>{left}</span>
      {right && <span className={styles.right}>{right}</span>}
    </div>
  );
}

function Bullets({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className={styles.bullets}>
      {items.map((item, i) => (
        <li key={i}>
          <Rich text={item} />
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className={styles.section}>{children}</h2>;
}

/** An employer and its roles: the dates on the employer's line, or on each role when it's several. */
function JobHead({ employer }: { employer: Employer }) {
  const name = employer.url ? <Link href={employer.url}>{employer.name}</Link> : employer.name;
  const only = employer.roles.length === 1 ? employer.roles[0] : undefined;
  return (
    <div className={`${styles.jobHead}${employer.highlights.length ? "" : ` ${styles.early}`}`}>
      <Line
        className={styles.employer}
        left={name}
        right={only && dateRange(only.startDate, only.endDate)}
      />
      {employer.roles.map((role, i) => (
        <Line
          key={i}
          className={styles.role}
          left={role.position}
          right={!only && dateRange(role.startDate, role.endDate)}
        />
      ))}
    </div>
  );
}

function School({ school }: { school: Education }) {
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
            {study}
            {study && name && ", "}
            {name}
          </>
        }
        right={dateRange(school.startDate, school.endDate, false)}
      />
      {school.score && <p className={styles.text}>{school.score}</p>}
      {!!school.courses?.length && <p className={styles.text}>{school.courses.join("; ")}</p>}
    </>
  );
}

function CertificateRow({ certificate }: { certificate: Certificate }) {
  const { name, url, issuer, date } = certificate;
  return (
    <Line
      className={styles.row}
      left={
        <>
          {url ? <Link href={url}>{name}</Link> : name}
          {name && issuer && ", "}
          {issuer}
        </>
      }
      right={date && formatDate(date)}
    />
  );
}

function ProjectEntry({ project }: { project: Project }) {
  const title = project.url ? <Link href={project.url}>{project.name}</Link> : project.name;
  return (
    <>
      <Line className={styles.project} left={title} right={projectRight(project)} />
      {(project.entity || project.type || !!project.roles?.length) && (
        <p className={styles.note}>
          {[project.entity, project.type, ...(project.roles ?? [])].filter(Boolean).join(", ")}
        </p>
      )}
      {project.description && <p className={styles.text}>{project.description}</p>}
      <Bullets items={project.highlights} />
      {!!project.keywords?.length && <p className={styles.note}>{project.keywords.join(", ")}</p>}
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
            {skill.name}
            {skill.level && ` (${skill.level})`}:
          </strong>{" "}
          {skill.keywords!.join(", ")}
        </p>
      ))}
      {!!plain.length && (
        <p className={styles.skill}>
          {plain
            .map((skill) => skill.name)
            .filter(Boolean)
            .join(", ")}
        </p>
      )}
    </>
  );
}

function Tldr({ facts }: { facts: Fact[] }) {
  return (
    <>
      {facts.map(({ label, text }, i) => (
        <div key={i} className={styles.fact}>
          <span className={styles.factLabel}>{label}</span>
          <span>
            <Rich text={text ?? ""} />
          </span>
        </div>
      ))}
    </>
  );
}

function Header({ resume }: { resume: Resume }) {
  const { basics } = resume;
  if (!basics) return null;
  const contact: ReactNode[] = [];
  const location = formatLocation(basics.location);
  if (location) contact.push(location);
  if (basics.phone) contact.push(basics.phone);
  if (basics.email) contact.push(<a href={`mailto:${basics.email}`}>{basics.email}</a>);
  if (basics.url) contact.push(<Link href={basics.url} />);
  for (const profile of basics.profiles ?? []) {
    if (profile.url) contact.push(<Link href={profile.url} />);
    else if (profile.username) contact.push(`${profile.network}: ${profile.username}`);
  }
  return (
    <header>
      {basics.name && <h1 className={styles.name}>{basics.name}</h1>}
      {basics.label && <p className={styles.label}>{basics.label}</p>}
      <p className={styles.contact}>
        {contact.map((item, i) => (
          <span key={i} className={styles.contactItem}>
            {item}
          </span>
        ))}
      </p>
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
 * highlights stay together, so one can't start a page alone.
 */
export function resumeBlocks(resume: Resume): ResumeBlock[] {
  const { basics } = resume;
  const blocks: ResumeBlock[] = [{ key: "header", gap: 0, node: <Header resume={resume} /> }];

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

  if (basics?.tldr?.length) {
    section("tl;dr", [{ gap: 0, node: <Tldr facts={basics.tldr} /> }]);
  }

  if (basics?.summary) {
    section("How I work", [
      {
        gap: 0,
        node: (
          <p className={styles.text}>
            <Rich text={basics.summary} />
          </p>
        ),
      },
    ]);
  }

  const work: Omit<ResumeBlock, "key">[] = [];
  let earlier = false;
  for (const employer of groupByEmployer(resume.work)) {
    const { head, rest } = highlightGroups(employer);
    const early = !employer.highlights.length;
    const node = (
      <>
        <JobHead employer={employer} />
        {employer.summaries.map((summary, i) => (
          <p key={i} className={styles.text}>
            <Rich text={summary} />
          </p>
        ))}
        <Bullets items={head} />
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
    // The rest of a job's highlights can run on over a page.
    work.push(...rest.map((group) => ({ gap: GAP.bullet, node: <Bullets items={group} /> })));
    earlier = early;
  }
  section("Experience", work);

  if (resume.skills?.length) {
    section("Skills", [{ gap: 0, node: <Skills skills={resume.skills} /> }]);
  }

  section(
    "Projects",
    (resume.projects ?? []).map((project) => ({
      gap: GAP.project,
      node: <ProjectEntry project={project} />,
    })),
  );

  const schoolsAndCertificates = credentials(resume);
  if (schoolsAndCertificates.length) {
    section("Education and certificates", [
      {
        gap: 0,
        node: (
          <>
            {schoolsAndCertificates.map(({ school, certificate }, i) =>
              school ? (
                <School key={i} school={school} />
              ) : (
                <CertificateRow key={i} certificate={certificate} />
              ),
            )}
          </>
        ),
      },
    ]);
  }

  if (resume.languages?.length) {
    section("Languages", [
      { gap: 0, node: <p className={styles.text}>{languageList(resume.languages)}</p> },
    ]);
  }

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
}: {
  blocks: ResumeBlock[];
  measureRef: (element: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={measureRef} className={styles.measure} aria-hidden="true">
      {blocks.map((block) => (
        <div key={block.key} className={styles.block}>
          {block.node}
        </div>
      ))}
    </div>
  );
}
