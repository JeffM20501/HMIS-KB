import { Info } from 'lucide-react';
import Select from '../ui/Select.jsx';
import Label from '../ui/Label.jsx';
import FieldError from '../ui/FieldError.jsx';
import Button from '../ui/Button.jsx';

const DEPARTMENTS = [
  'Medical Administration',
  'Nursing',
  'Laboratory',
  'Pharmacy',
  'Radiology',
  'Finance & Billing',
  'IT & Systems',
  'Clinical Operations',
];

const FACILITIES = [
  'Nairobi General Hospital',
  'Kenyatta National Hospital',
  'Aga Khan University Hospital',
  'Moi Teaching & Referral Hospital',
  'Coast General Hospital',
  'HQ — TaifaCare',
];

export default function WorkplaceStep({ register, errors, watch, onBack, onNext }) {
  const values = watch();

  return (
    <div className="space-y-4">
      <div>
        <Label required>Department</Label>
        <Select defaultValue="" error={!!errors.department} {...register('department', { required: 'Required' })}>
          <option value="" disabled>
            Select your department
          </option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <FieldError>{errors.department?.message}</FieldError>
      </div>

      <div>
        <Label required>Facility</Label>
        <Select defaultValue="" error={!!errors.facility} {...register('facility', { required: 'Required' })}>
          <option value="" disabled>
            Select your facility
          </option>
          {FACILITIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
        <FieldError>{errors.facility?.message}</FieldError>
      </div>

      <div className="flex gap-2.5 rounded-lg bg-primary-50 border border-primary/20 p-3.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-primary/90 leading-relaxed">
          <span className="font-semibold">Account approval required.</span> New accounts require approval from your
          facility's TaifaCare administrator before access is granted. Typical response time is 24–48 hours.
        </p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="text-xs font-semibold text-text-primary mb-2.5">Account Summary</p>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Name</dt>
            <dd className="text-text-primary font-medium">
              {values.first_name} {values.last_name}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Email</dt>
            <dd className="text-text-primary font-medium">{values.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Role</dt>
            <dd className="text-text-primary font-medium capitalize">{values.requested_role}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" className="flex-1" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="button" className="flex-1" size="lg" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
