// The in-app changelog reads CHANGELOG.md itself, so the file and the popup can
// never disagree. Writing the entry is therefore the only step — see
// AGENTS.md#versioning.
//
// Only the small subset of Markdown the changelog actually uses is handled:
// `## version — date`, `### Section`, `- bullet` (with continuation lines), and
// italic notes. Anything else is kept as a paragraph rather than dropped.
import raw from '../../CHANGELOG.md?raw';

const stripInline = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(?!\s)(.+?)\*/g, '$1$2')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .trim();

export function parseChangelog(markdown = raw) {
  const versions = [];
  let version = null;
  let section = null;

  const pushBullet = (text) => {
    if (!version) return;
    if (!section) {
      section = { title: '', items: [] };
      version.sections.push(section);
    }
    section.items.push(stripInline(text));
  };

  for (const line of markdown.split('\n')) {
    const heading = line.match(/^##\s+(?!#)(.+)$/);
    if (heading) {
      const [, title] = heading;
      const [number, date] = title.split(/\s+—\s+/);
      version = { version: number.trim(), date: (date || '').trim(), sections: [] };
      section = null;
      versions.push(version);
      continue;
    }

    const sub = line.match(/^###\s+(.+)$/);
    if (sub && version) {
      section = { title: stripInline(sub[1]), items: [] };
      version.sections.push(section);
      continue;
    }

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      pushBullet(bullet[1]);
      continue;
    }

    // A wrapped bullet continues the previous item.
    if (/^\s{2,}\S/.test(line) && section?.items.length) {
      section.items[section.items.length - 1] += ` ${stripInline(line)}`;
      continue;
    }

    const text = line.trim();
    if (!text || text === '---' || !version) continue;
    // Prose under a version, such as the note about reconstructed versions.
    pushBullet(text);
  }

  return versions.filter((entry) => /^\d/.test(entry.version));
}

export const CHANGELOG = parseChangelog();
