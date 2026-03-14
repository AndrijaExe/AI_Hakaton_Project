import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, X, Plus } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const DIETARY_OPTIONS = ['none', 'vegetarian', 'vegan', 'halal', 'kosher', 'other'];
const ALLERGY_OPTIONS = ['gluten', 'lactose', 'nuts', 'shellfish', 'eggs', 'soy'];
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
];

const profileSchema = Yup.object({
  firstName: Yup.string().required('First name is required').min(2, 'At least 2 characters'),
  lastName: Yup.string().required('Last name is required').min(2, 'At least 2 characters'),
  company: Yup.string().max(200, 'Max 200 characters'),
  position: Yup.string().max(150, 'Max 150 characters'),
  country: Yup.string().max(100, 'Max 100 characters'),
  bio: Yup.string().max(500, 'Max 500 characters'),
  phone: Yup.string().matches(/^[+]?[\d\s()-]*$/, { message: 'Invalid phone number format', excludeEmptyString: true }),
  linkedin: Yup.string().transform((v) => (v === '' ? undefined : v)).url('Must be a valid URL (e.g. https://linkedin.com/in/...)').optional().nullable(),
  dietaryPreference: Yup.string().oneOf(DIETARY_OPTIONS, 'Invalid option'),
  dietaryNotes: Yup.string().max(300, 'Max 300 characters'),
});

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState('');

  const formik = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      company: user?.company || '',
      position: user?.position || '',
      country: user?.country || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      linkedin: user?.linkedin || '',
      dietaryPreference: user?.dietaryPreference || 'none',
      dietaryNotes: user?.dietaryNotes || '',
      language: user?.language || 'en',
    },
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      setServerError('');
      try {
        await usersApi.updateProfile({
          ...values,
          interests,
          allergies,
          dietaryPreference: values.dietaryPreference === 'none' ? null : values.dietaryPreference,
          language: values.language || 'en',
        } as any);
        await refreshUser();
        setSaved(true);
        setTimeout(() => navigate('/profile'), 800);
      } catch (err: any) {
        const msg = err?.response?.data?.errors;
        if (msg && typeof msg === 'object') {
          setServerError(Object.values(msg).flat().join(', '));
        } else {
          setServerError('Failed to save. Please try again.');
        }
      }
    },
  });

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const addInterest = () => {
    const tag = interestInput.trim().toLowerCase();
    if (tag && !interests.includes(tag)) {
      setInterests(prev => [...prev, tag]);
    }
    setInterestInput('');
  };

  const removeInterest = (tag: string) => {
    setInterests(prev => prev.filter(t => t !== tag));
  };

  const fieldError = (name: keyof typeof formik.values) =>
    formik.touched[name] && formik.errors[name] ? formik.errors[name] : null;

  if (!user) return null;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <h1 className="text-2xl font-bold text-slate-100 mb-4">Edit Profile</h1>

      {serverError && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">{serverError}</div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Personal Info</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="text-xs font-medium text-slate-400 mb-1 block">First Name *</label>
                <input
                  id="firstName"
                  className={`input-field ${fieldError('firstName') ? 'border-red-400' : ''}`}
                  placeholder="e.g. Marko"
                  {...formik.getFieldProps('firstName')}
                />
                {fieldError('firstName') && <p className="text-xs text-red-500 mt-1">{fieldError('firstName')}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="text-xs font-medium text-slate-400 mb-1 block">Last Name *</label>
                <input
                  id="lastName"
                  className={`input-field ${fieldError('lastName') ? 'border-red-400' : ''}`}
                  placeholder="e.g. Petrovic"
                  {...formik.getFieldProps('lastName')}
                />
                {fieldError('lastName') && <p className="text-xs text-red-500 mt-1">{fieldError('lastName')}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="company" className="text-xs font-medium text-slate-400 mb-1 block">Company</label>
              <input
                id="company"
                className={`input-field ${fieldError('company') ? 'border-red-400' : ''}`}
                placeholder="e.g. Fiscal Solutions"
                {...formik.getFieldProps('company')}
              />
              {fieldError('company') && <p className="text-xs text-red-500 mt-1">{fieldError('company')}</p>}
            </div>

            <div>
              <label htmlFor="position" className="text-xs font-medium text-slate-400 mb-1 block">Position</label>
              <input
                id="position"
                className={`input-field ${fieldError('position') ? 'border-red-400' : ''}`}
                placeholder="e.g. Software Engineer"
                {...formik.getFieldProps('position')}
              />
              {fieldError('position') && <p className="text-xs text-red-500 mt-1">{fieldError('position')}</p>}
            </div>

            <div>
              <label htmlFor="country" className="text-xs font-medium text-slate-400 mb-1 block">Country</label>
              <input
                id="country"
                className={`input-field ${fieldError('country') ? 'border-red-400' : ''}`}
                placeholder="e.g. Serbia"
                {...formik.getFieldProps('country')}
              />
              {fieldError('country') && <p className="text-xs text-red-500 mt-1">{fieldError('country')}</p>}
            </div>

            <div>
              <label htmlFor="language" className="text-xs font-medium text-slate-400 mb-1 block">Language (for emails)</label>
              <select
                id="language"
                className={`input-field ${fieldError('language') ? 'border-red-400' : ''}`}
                {...formik.getFieldProps('language')}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldError('language') && <p className="text-xs text-red-500 mt-1">{fieldError('language')}</p>}
            </div>

            <div>
              <label htmlFor="bio" className="text-xs font-medium text-slate-400 mb-1 block">Bio</label>
              <textarea
                id="bio"
                className={`input-field resize-none h-20 ${fieldError('bio') ? 'border-red-400' : ''}`}
                placeholder="Tell us about yourself..."
                {...formik.getFieldProps('bio')}
              />
              <div className="flex justify-between mt-1">
                {fieldError('bio') ? <p className="text-xs text-red-500">{fieldError('bio')}</p> : <span />}
                <span className="text-xs text-slate-500">{formik.values.bio.length}/500</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Contact</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="phone" className="text-xs font-medium text-slate-400 mb-1 block">Phone Number</label>
              <input
                id="phone"
                className={`input-field ${fieldError('phone') ? 'border-red-400' : ''}`}
                placeholder="e.g. +381 61 123 4567"
                {...formik.getFieldProps('phone')}
              />
              {fieldError('phone') && <p className="text-xs text-red-500 mt-1">{fieldError('phone')}</p>}
            </div>
            <div>
              <label htmlFor="linkedin" className="text-xs font-medium text-slate-400 mb-1 block">LinkedIn Profile</label>
              <input
                id="linkedin"
                className={`input-field ${fieldError('linkedin') ? 'border-red-400' : ''}`}
                placeholder="https://linkedin.com/in/your-profile"
                {...formik.getFieldProps('linkedin')}
              />
              {fieldError('linkedin') && <p className="text-xs text-red-500 mt-1">{fieldError('linkedin')}</p>}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Interests</h3>
          <label className="text-xs font-medium text-slate-400 mb-1 block">Add topics you're interested in</label>
          <div className="flex gap-2 mb-2">
            <input
              className="input-field flex-1"
              placeholder="e.g. cloud, pos, retail..."
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
            />
            <button type="button" onClick={addInterest} className="btn-secondary px-3">
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {interests.map(tag => (
              <span key={tag} className="badge bg-primary-50 text-primary-600 flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeInterest(tag)} className="hover:text-primary-800">
                  <X size={12} />
                </button>
              </span>
            ))}
            {interests.length === 0 && <p className="text-xs text-slate-500">No interests added yet</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Dietary Preferences</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Diet Type</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => formik.setFieldValue('dietaryPreference', opt)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formik.values.dietaryPreference === opt
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Allergies</label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map(allergy => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      allergies.includes(allergy)
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {allergy.charAt(0).toUpperCase() + allergy.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="dietaryNotes" className="text-xs font-medium text-slate-400 mb-1 block">Additional Dietary Notes</label>
              <textarea
                id="dietaryNotes"
                className={`input-field resize-none h-16 ${fieldError('dietaryNotes') ? 'border-red-400' : ''}`}
                placeholder="Any other dietary requirements or preferences..."
                {...formik.getFieldProps('dietaryNotes')}
              />
              {fieldError('dietaryNotes') && <p className="text-xs text-red-500 mt-1">{fieldError('dietaryNotes')}</p>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${saved ? 'bg-green-500 text-white' : 'btn-primary'}`}
        >
          {formik.isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saved ? 'Saved!' : formik.isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
