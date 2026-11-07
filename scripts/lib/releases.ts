export type ReleaseType = 'patch' | 'minor' | 'major';

type ChangelogEntry = {
  version: string;
  message: string;
  date: string;
};

const stableVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const changelogHeading = '# Changelog\n';

export function isStableVersion(value: unknown): value is string {
  return typeof value === 'string'
    && value === value.trim()
    && stableVersionPattern.test(value);
}

export function parseReleaseType(value: unknown): ReleaseType {
  if (value === 'patch' || value === 'minor' || value === 'major') {
    return value;
  }
  throw new Error('Release type must be patch, minor or major.');
}

export function nextVersion(version: string, release: ReleaseType): string {
  if (!isStableVersion(version)) {
    throw new Error(`Unsupported version: ${version}. Use a stable version such as 0.1.0.`);
  }

  const [major, minor, patch] = version.split('.').map(BigInt);
  switch (release) {
    case 'patch':
      return `${major}.${minor}.${patch + 1n}`;
    case 'minor':
      return `${major}.${minor + 1n}.0`;
    case 'major':
      return `${major + 1n}.0.0`;
    default:
      throw new Error('Release type must be patch, minor or major.');
  }
}

export function prependChangelogEntry(previous: string | null, entry: ChangelogEntry): string {
  if (previous !== null && !previous.startsWith(changelogHeading)) {
    throw new Error('CHANGELOG.md must start with "# Changelog" followed by a newline.');
  }

  const releaseHeading = `## [${entry.version}]`;
  if (previous?.split('\n').some((line) => line.startsWith(releaseHeading))) {
    throw new Error(`CHANGELOG.md already contains version ${entry.version}.`);
  }

  const summary = entry.message.trim().split(/\r?\n/).join('\n  ');
  const newEntry = `${releaseHeading} - ${entry.date}\n\n- ${summary}\n`;
  const history = previous?.slice(changelogHeading.length).trimStart() ?? '';
  return `${changelogHeading}\n${newEntry}${history ? `\n${history}` : ''}`;
}
