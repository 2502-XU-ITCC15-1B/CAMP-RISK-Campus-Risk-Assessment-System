export const MITIGATION_TEAM_OPTIONS = [
  'Maintenance Team',
  'Facilities Team',
  'Safety Team',
  'IT Team',
  'Security Team',
] as const;

export type MitigationTeam = (typeof MITIGATION_TEAM_OPTIONS)[number];
