import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import type { RegisterUserRequest } from '@api/types';

interface RegisterProfileFormProps {
  defaultValues: RegisterUserRequest;
  error: string | null;
  isSaving: boolean;
  onSubmit: (values: RegisterUserRequest) => Promise<void>;
}

export function RegisterProfileForm({ defaultValues, error, isSaving, onSubmit }: RegisterProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterUserRequest>({ defaultValues });

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <p className="mt-3 text-sm text-slate-600">
        Your external account owns identity. This profile stores app-specific user data only.
      </p>
      <div className="mt-6 grid gap-4">
        <div>
          <label className="form-label" htmlFor="display-name">
            Display name
          </label>
          <input
            id="display-name"
            className="form-field"
            {...register('displayName', { required: 'Display name is required.' })}
          />
          {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input id="email" className="form-field" type="email" {...register('email')} />
        </div>
      </div>
      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={isSaving}
          type="submit"
        >
          Save profile
        </button>
        <Link className="text-sm font-semibold text-slate-600" to="/tasks">
          Skip for now
        </Link>
      </div>
    </form>
  );
}
