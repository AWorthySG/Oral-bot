import type { SubjectId } from '../types';

// Data for the seven subject zones arranged on a ring around the hub plaza.

export interface ZoneConfig {
  subject: SubjectId;
  name: string;
  angleDeg: number;
  groundColor: number;
  accentColor: number;
  /** Zones locked at the start of a fresh save (the JC subjects). */
  lockedByDefault: boolean;
  requirementText?: string;
}

export const ZONE_RING_RADIUS = 70;
export const ZONE_RADIUS = 22;

export const ZONE_CONFIGS: ZoneConfig[] = [
  {
    subject: 'math',
    name: 'Mathematics',
    angleDeg: 90,
    groundColor: 0xb9ccf7,
    accentColor: 0x4f7df9,
    lockedByDefault: false,
  },
  {
    subject: 'english',
    name: 'English',
    angleDeg: 90 + 51.4,
    groundColor: 0xf0c3bd,
    accentColor: 0xc2554f,
    lockedByDefault: false,
  },
  {
    subject: 'physics',
    name: 'Physics',
    angleDeg: 90 + 102.8,
    groundColor: 0xd5c4f5,
    accentColor: 0x8e5ff0,
    lockedByDefault: false,
  },
  {
    subject: 'chemistry',
    name: 'Chemistry',
    angleDeg: 90 + 154.2,
    groundColor: 0xb6e8c8,
    accentColor: 0x2fae62,
    lockedByDefault: false,
  },
  {
    subject: 'biology',
    name: 'Biology',
    angleDeg: 90 + 205.6,
    groundColor: 0xddedaf,
    accentColor: 0x8db32a,
    lockedByDefault: false,
  },
  {
    subject: 'econs',
    name: 'Economics',
    angleDeg: 90 + 257.0,
    groundColor: 0xf7dfa8,
    accentColor: 0xf2b53a,
    lockedByDefault: true,
    requirementText: 'Maths C6 and any\n2 subjects at C6',
  },
  {
    subject: 'gp',
    name: 'General Paper',
    angleDeg: 90 + 308.4,
    groundColor: 0xf0ead8,
    accentColor: 0x8a7f64,
    lockedByDefault: true,
    requirementText: 'English C6 and any\n3 subjects at D7',
  },
];
