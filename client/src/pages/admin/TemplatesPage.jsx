import { FileText, ClipboardList, HelpCircle, BookOpen, Wrench, Megaphone } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';

// Sourced from PRD §8.2 "Required Content Templates". There is no /api/v1/templates/
// endpoint in the supplied Django routes, so these are maintained here as the
// canonical definitions the Article Editor's "Template" dropdown reads from.
export const ARTICLE_TEMPLATES = [
  {
    key: 'how_to',
    name: 'How-To Guide',
    icon: BookOpen,
    sections: ['Overview', 'Prerequisites', 'Steps', 'Screenshots', 'Troubleshooting', 'Related Articles'],
  },
  {
    key: 'sop',
    name: 'SOP',
    icon: ClipboardList,
    sections: ['Purpose', 'Scope', 'Responsible Parties', 'Procedure Steps', 'Exceptions', 'Review Date'],
  },
  {
    key: 'faq',
    name: 'FAQ Entry',
    icon: HelpCircle,
    sections: ['Question', 'Short Answer', 'Detailed Answer', 'Related Links'],
  },
  {
    key: 'feature_reference',
    name: 'Feature Reference',
    icon: FileText,
    sections: ['Feature Name', 'Module', 'Description', 'User Roles', 'Configuration', 'Known Issues'],
  },
  {
    key: 'troubleshooting',
    name: 'Troubleshooting Guide',
    icon: Wrench,
    sections: ['Symptom', 'Possible Causes', 'Diagnosis Steps', 'Resolution', 'Escalation Path'],
  },
  {
    key: 'release_notes',
    name: 'Release Notes',
    icon: Megaphone,
    sections: ['Version', 'Date', 'New Features', 'Bug Fixes', 'Breaking Changes', 'Upgrade Instructions'],
  },
];

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader title="Templates" description="Standardized article templates and their required sections (PRD §8.2)" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ARTICLE_TEMPLATES.map((t) => (
          <Card key={t.key}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                <t.icon className="w-5 h-5" />
              </span>
              <h3 className="font-semibold text-text-primary">{t.name}</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {t.sections.map((s) => (
                <Badge key={s} tone="gray">
                  {s}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
