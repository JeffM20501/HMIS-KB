import { Mail, Phone } from 'lucide-react';
import Input from '../ui/Input.jsx';
import Label from '../ui/Label.jsx';
import FieldError from '../ui/FieldError.jsx';
import Button from '../ui/Button.jsx';
import clsx from 'clsx';

export default function PersonalInfoStep({ register, errors, watch, setValue, onNext }) {
  const requestedRole = watch('requested_role');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>First Name</Label>
          <Input placeholder="Jane" error={!!errors.first_name} {...register('first_name', { required: 'Required' })} />
          <FieldError>{errors.first_name?.message}</FieldError>
        </div>
        <div>
          <Label required>Last Name</Label>
          <Input placeholder="Kamau" error={!!errors.last_name} {...register('last_name', { required: 'Required' })} />
          <FieldError>{errors.last_name?.message}</FieldError>
        </div>
      </div>

      <div>
        <Label required>Work Email Address</Label>
        <Input
          type="email"
          icon={Mail}
          placeholder="jane.kamau@taifacare.health"
          error={!!errors.email}
          {...register('email', {
            required: 'Required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
          })}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>

      <div>
        <Label required>Phone Number</Label>
        <Input
          type="tel"
          icon={Phone}
          placeholder="+254 712 345 678"
          error={!!errors.phone}
          {...register('phone', { required: 'Required' })}
        />
        <FieldError>{errors.phone?.message}</FieldError>
      </div>

      <Button type="button" className="w-full mt-2" size="lg" onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
