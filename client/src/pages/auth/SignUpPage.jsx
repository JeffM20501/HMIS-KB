import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2, Quote } from 'lucide-react';
import toast from 'react-hot-toast';
import * as usersApi from '../../api/users.api';
import { extractErrorMessage } from '../../api/axios';
import Button from '../../components/ui/Button.jsx';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel.jsx';
import SignupStepIndicator from '../../components/auth/SignupStepIndicator.jsx';
import PersonalInfoStep from '../../components/auth/PersonalInfoStep.jsx';
import WorkplaceStep from '../../components/auth/WorkplaceStep.jsx';
import SecurityStep from '../../components/auth/SecurityStep.jsx';
import { ROUTES } from '../../constants/routes';

const STEP_1_FIELDS = ['first_name', 'last_name', 'email', 'username', 'requested_role'];
const STEP_2_FIELDS = ['department'];

const FEATURES = [
  'SOPs and clinical documentation',
  'Searchable across all HMIS modules',
  'AI-powered knowledge assistant',
  'Role-based access for your team',
];

/**
 * There's no dedicated public self-registration endpoint in the current
 * Django route list — this reuses POST /api/v1/u/users/ (the same endpoint
 * UserManagementPage.jsx's "Invite User" already calls as an authenticated
 * admin action). That endpoint may currently be permission-gated to admins
 * only, in which case an unauthenticated visitor submitting this form will
 * get a 403 until the backend either opens that endpoint for unauthenticated
 * self-registration with a pending status, or a dedicated /register/
 * endpoint is added. Flagging this here rather than silently assuming it
 * already works end-to-end.
 */
export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const submitMutation = useMutation({
    mutationFn: (values) =>
      usersApi.createUser({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        department: values.department,
        username:values.username,
        // facility: values.facility,
        password: values.password,
        status: 'pending',
      }),
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(extractErrorMessage(err) || 'Could not create your account.'),
  });

  const goNext = async () => {
    const fields = step === 1 ? STEP_1_FIELDS : STEP_2_FIELDS;
    const valid = await trigger(fields);
    if (valid) setStep((s) => s + 1);
  };
  const goBack = () => setStep((s) => s - 1);
  const onSubmit = (values) => submitMutation.mutate(values);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-success-bg flex items-center justify-center mb-5">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Account request submitted</h1>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Your facility's TaifaCare administrator has been notified and will review your request. You'll receive an
            email once your account is approved — typically within 24–48 hours.
          </p>
          <Button onClick={() => navigate(ROUTES.LOGIN)} className="w-full">
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface">
      <AuthBrandPanel>
        <div>
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">Your healthcare team's knowledge hub</h1>
          <p className="text-sm leading-relaxed text-white/70 mb-6">
            Access clinical SOPs, lab protocols, pharmacy guidelines, and system documentation — all in one place
            designed for healthcare professionals.
          </p>
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/85">
                <span className="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white/[0.08] border border-white/10 p-4">
          <Quote className="w-4 h-4 text-white/40 mb-2" />
          <p className="text-sm text-white/85 italic mb-3">Your reliable source of truth</p>
        </div>
      </AuthBrandPanel>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm font-bold text-text-primary">TaifaCare KB</div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Create your account</h2>
          <p className="text-sm text-text-secondary mb-7">Join the TaifaCare HMIS Knowledge Base platform</p>

          <SignupStepIndicator step={step} />

          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {step === 1 && (
                <PersonalInfoStep register={register} errors={errors} watch={watch} setValue={setValue} onNext={goNext} />
              )}
              {step === 2 && (
                <WorkplaceStep register={register} errors={errors} watch={watch} onBack={goBack} onNext={goNext} />
              )}
              {step === 3 && (
                <SecurityStep register={register} errors={errors} watch={watch} onBack={goBack} isSubmitting={isSubmitting} />
              )}
            </form>
          </div>

          <p className="text-center text-xs text-text-secondary mt-5">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
