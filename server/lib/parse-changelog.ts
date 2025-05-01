const CHANGELOG_REGEX = /^- ([A-Z]+): (.*?)(?: \(h\/t (.+)\))?$/;

type Change = {
  tag: string;
  entry: string;
  credit?: string;
};

type Version = {
  version: string;
  changes: Change[];
};

export type Changelog = Version[];

export function parseChangelog(changelogContents: string): Changelog {
  const versions = [];

  const lines = changelogContents.split('\n');
  for(let i = 0; i < lines.length; ++i) {
    // if I wanted a perfectly paresable CHANGELOG format, I'd have used JSON
    // instead, this is nicely human-readable and parseable at the same time
    // if you're willing to ignore some brittleness in the parsing

    const line = lines[i];
    if(line.startsWith('## ')) {
      // start of a new version section
      const versionNumber = line.substring('## '.length);
      versions.push({
        version: versionNumber,
        changes: [],
      });
    } else if(line.startsWith('- ') && versions.length > 0) {
      // start of a changelog line in a section
      const matches = CHANGELOG_REGEX.exec(line);
      if(matches === null) {
        throw new Error(`Found a non-conforming changelog line at line #${i + i}: ${line}`);
      }

      const tag = matches[1];
      const entry = matches[2];
      const credit = matches[3];

      versions[versions.length - 1].changes.push({ tag, entry, credit });
    } else {
      // we don't care. it's either the title, the summary, or a blank line
      continue;
    }
  }

  return versions;
}
