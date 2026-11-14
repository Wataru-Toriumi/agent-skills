export type ReleaseType = 'patch' | 'minor' | 'major';

const stableVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export const isStableVersion = (value: unknown): value is string => {
  return typeof value === 'string' && value === value.trim() && stableVersionPattern.test(value);
};

export const parseReleaseType = (value: unknown): ReleaseType => {
  if (value === 'patch' || value === 'minor' || value === 'major') {
    return value;
  }
  throw new Error('Release type must be patch, minor or major.');
};

export const nextVersion = (version: string, release: ReleaseType): string => {
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
};
