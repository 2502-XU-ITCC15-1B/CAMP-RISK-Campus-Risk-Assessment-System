/** Per reported hazard → typical risk & area (per XU / SSIO framing). Include "Other" via free text fields. */

export type HazardRiskPick = { risk: string; affected: string };

export const HAZARD_RISK_CHOICES: Record<string, HazardRiskPick[]> = {
  'Earthquake Hazard': [
    { risk: 'Building collapse, structural damage, injury', affected: 'Academic buildings, dorms, offices' },
    { risk: 'Falling fixtures / debris indoors', affected: 'Classrooms, corridors' },
  ],
  'Fire in Campus Buildings': [
    { risk: 'Fire spread; smoke inhalation', affected: 'Classrooms, offices, corridors' },
    { risk: 'Blocked exits delaying evacuation', affected: 'Stairwells, assembly areas' },
  ],
  'Laboratory Chemical Exposure': [
    { risk: 'Burns; acute poisoning', affected: 'Chemistry labs' },
    { risk: 'Fumes / vapour exposure', affected: 'Laboratories with chemical storage' },
  ],
  'Biological Hazard Exposure': [
    { risk: 'Infection from biological agents', affected: 'Biology labs, research spaces' },
  ],
  'Campus Security Incident': [
    { risk: 'Unauthorized entry — theft, assault', affected: 'Gates, parking, walkways, dorms' },
    { risk: 'Student conflicts / violence', affected: 'Quads, walkways' },
    { risk: 'Poor lighting facilitating crime', affected: 'Parking, peripheral paths' },
  ],
  'Traffic and Vehicle Congestion': [
    { risk: 'Pedestrian–vehicle collisions', affected: 'Main roads, crossings, pickup zones' },
    { risk: 'Congestion near gates', affected: 'Campus entrances' },
  ],
  Flooding: [
    { risk: 'Campus disruption; water intrusion', affected: 'Ground floors, labs, tunnels' },
  ],
  'Electrical Hazards': [
    { risk: 'Electric shock', affected: 'Offices, electrical rooms, AV spaces' },
    { risk: 'Electrical overload → fire risk', affected: 'Dorms, laboratories' },
  ],
  'Emergency Evacuation Failure': [
    { risk: 'Delayed evacuation; injury during egress', affected: 'Buildings; assembly points' },
  ],
  'Slips, Trips, and Falls': [
    { risk: 'Musculoskeletal injuries from falls', affected: 'Stairs, walkways, wet areas' },
  ],
  'Tree/Branch Fall': [
    { risk: 'Falling limbs / debris; injury', affected: 'Open areas; tree-lined roads' },
  ],
  'Heat Stress': [
    { risk: 'Heat exhaustion / heat illness', affected: 'Athletic areas; outdoor queued events' },
  ],
  'Hazardous Waste Management': [
    { risk: 'Toxic spill; environmental exposure', affected: 'Storage rooms; generator areas' },
  ],
  'Construction and Maintenance Hazards': [
    { risk: 'Struck-by; falls from heights', affected: 'Active construction; roof access' },
  ],
  'Public Health Risks': [
    { risk: 'Communicable disease spread', affected: 'Dorms, cafeterias' },
    { risk: 'Poor sanitation — illness', affected: 'Restrooms, kitchens' },
  ],
  Others: [{ risk: 'See description / classify below', affected: '(specify)' }],
};

export function riskChoicesForHazard(label: string): HazardRiskPick[] {
  const row = HAZARD_RISK_CHOICES[label];
  return row ?? [{ risk: 'Site-specific hazard — specify', affected: 'Specify area affected' }];
}
