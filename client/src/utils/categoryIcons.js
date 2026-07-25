import {
  Rocket, Users, FlaskConical, Pill, Receipt, ShieldCheck, Wrench, BarChart3,
  Stethoscope, FolderOpen, Radio,
} from 'lucide-react';

const MAP = {
  'getting-started': Rocket,
  'patient-management': Users,
  laboratory: FlaskConical,
  pharmacy: Pill,
  billing: Receipt,
  clinical: Stethoscope,
  radiology: Radio,
  administration: ShieldCheck,
  troubleshooting: Wrench,
  analytics: BarChart3,
};

export function getCategoryIcon(key = '') {
  return MAP[key] || FolderOpen;
}
