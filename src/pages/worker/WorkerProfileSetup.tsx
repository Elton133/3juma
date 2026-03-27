import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Plus, Award, Image as ImageIcon, FileText, CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkerProfile } from '@/hooks/useWorkerProfile';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { TRADES, AREAS } from '@/data/constants';

const WorkerProfileSetup: React.FC = () => {
  const { user } = useAuth();
  const {
    profile, documents, certificates, portfolio,
    loading, saving, error,
    updateProfile, addVerificationDoc, addCertificate, removeCertificate,
    addPortfolioImage, removePortfolioImage, submitForVerification, clearError,
  } = useWorkerProfile(user?.id || '');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const ghanaFrontRef = useRef<HTMLInputElement>(null);
  const ghanaBackRef = useRef<HTMLInputElement>(null);
  const certFileRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Cert form state
  const [certName, setCertName] = useState('');
  const [certIssuedBy, setCertIssuedBy] = useState('');
  const [certYear, setCertYear] = useState('');
  const [showCertForm, setShowCertForm] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const ghanaFront = documents.find(d => d.document_type === 'ghana_card_front');
  const ghanaBack = documents.find(d => d.document_type === 'ghana_card_back');
  const canSubmit = profile.trade && profile.area && ghanaFront && ghanaBack && profile.verification_status === 'none';
  const isPending = profile.verification_status === 'pending';
  const isApproved = profile.verification_status === 'approved';
  const isRejected = profile.verification_status === 'rejected';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const res = await uploadToCloudinary(file);
      await updateProfile({ profile_photo_url: res.secure_url });
    } catch (err: any) {
      console.error('Photo upload failed:', err);
    }
  };

  const handleGhanaCard = async (type: 'ghana_card_front' | 'ghana_card_back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await addVerificationDoc(type, file);
  };

  const handleAddCert = async () => {
    const file = certFileRef.current?.files?.[0];
    if (!file || !certName.trim()) return;
    await addCertificate(certName, file, certIssuedBy || undefined, certYear ? parseInt(certYear) : undefined);
    setCertName('');
    setCertIssuedBy('');
    setCertYear('');
    setShowCertForm(false);
    if (certFileRef.current) certFileRef.current.value = '';
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await addPortfolioImage(file);
    }
    if (portfolioInputRef.current) portfolioInputRef.current.value = '';
  };

  const statusBadge = () => {
    if (isApproved) return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
        <CheckCircle className="w-4 h-4" /> Verified
      </div>
    );
    if (isPending) return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
        <Clock className="w-4 h-4" /> Under Review
      </div>
    );
    if (isRejected) return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100">
        <AlertCircle className="w-4 h-4" /> Rejected
      </div>
    );
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Error bar */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl">
          <p className="text-xs font-bold text-red-500">{error}</p>
          <button onClick={clearError} className="p-1 hover:bg-red-100 rounded-lg"><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

      {/* Rejection notice */}
      {isRejected && profile.rejection_notes && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem]">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Reason for Rejection</p>
          <p className="text-sm font-bold text-red-600">{profile.rejection_notes}</p>
        </div>
      )}

      {/* ─── PROFILE PHOTO ─────────────────────────────────── */}
      <div className="glass rounded-[2.5rem] p-8 border-white/40 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Photo</p>
          {statusBadge()}
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="Profile" className="w-24 h-24 rounded-[1.5rem] object-cover shadow-xl group-hover:opacity-80 transition-opacity" />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-[1.5rem] flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Camera className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <p className="font-black text-gray-900 text-lg">{user?.name || 'Your Name'}</p>
            <p className="text-xs text-gray-400 mt-1">Tap photo to change</p>
          </div>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      </div>

      {/* ─── PERSONAL INFO ─────────────────────────────────── */}
      <div className="glass rounded-[2.5rem] p-8 border-white/40 shadow-lg space-y-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Information</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Professional Name</label>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={(e) => updateProfile({ full_name: e.target.value })}
              placeholder="e.g. John Doe Plumbing"
              className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Contact Number</label>
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => updateProfile({ phone: e.target.value })}
              placeholder="e.g. 054XXXXXXX"
              className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Trade</label>
            <div className="relative">
              <select
                value={profile.trade}
                onChange={(e) => updateProfile({ trade: e.target.value })}
                className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold appearance-none outline-none transition-all"
              >
                <option value="">Select your trade</option>
                {TRADES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Area</label>
            <div className="relative">
              <select
                value={profile.area}
                onChange={(e) => updateProfile({ area: e.target.value })}
                className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold appearance-none outline-none transition-all"
              >
                <option value="">Select your area</option>
                {AREAS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Years of Experience</label>
            <input
              type="number"
              value={profile.years_experience ?? ''}
              onChange={(e) => updateProfile({ years_experience: e.target.value === '' ? 0 : parseInt(e.target.value) })}
              placeholder="e.g. 5"
              className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Gender</label>
            <div className="relative">
              <select
                value={profile.gender || ''}
                onChange={(e) => updateProfile({ gender: e.target.value || null })}
                className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold appearance-none outline-none transition-all"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Date of Birth</label>
            <input
              type="date"
              value={profile.dob || ''}
              onChange={(e) => updateProfile({ dob: e.target.value || null })}
              className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Ghana Card Number (ID)</label>
            <input
              type="text"
              value={profile.ghana_card_id || ''}
              onChange={(e) => updateProfile({ ghana_card_id: e.target.value || null })}
              placeholder="GHA-XXXXXXXXX-X"
              className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Specializations (Skills)</label>
            <input
              type="text"
              value={profile.specializations?.join(', ') || ''}
              onChange={(e) => updateProfile({ specializations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="e.g. Pipe Repair, Bathroom Fitting, Solar Heating (separate with commas)"
              className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Bio / About You</label>
          <textarea
            value={profile.bio}
            onChange={(e) => updateProfile({ bio: e.target.value })}
            placeholder="Tell potential customers about your experience, skills, and specializations..."
            className="w-full h-28 p-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[1.5rem] text-gray-900 font-bold transition-all outline-none resize-none"
          />
        </div>
      </div>

      {/* ─── GHANA CARD ────────────────────────────────────── */}
      <div className="glass rounded-[2.5rem] p-8 border-white/40 shadow-lg space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghana Card Verification</p>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Upload clear photos of the front and back of your Ghana Card for identity verification.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Front */}
          <div
            onClick={() => ghanaFrontRef.current?.click()}
            className={`relative cursor-pointer border-2 border-dashed rounded-[2rem] p-6 text-center transition-all hover:border-gray-900 ${ghanaFront ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50/50'}`}
          >
            {ghanaFront ? (
              <div>
                <img src={ghanaFront.file_url} alt="Ghana Card Front" className="w-full h-32 object-cover rounded-xl mb-3" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Front Uploaded ✓</p>
              </div>
            ) : (
              <div className="py-8">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Front Side</p>
              </div>
            )}
          </div>
          <input ref={ghanaFrontRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleGhanaCard('ghana_card_front', e)} />

          {/* Back */}
          <div
            onClick={() => ghanaBackRef.current?.click()}
            className={`relative cursor-pointer border-2 border-dashed rounded-[2rem] p-6 text-center transition-all hover:border-gray-900 ${ghanaBack ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50/50'}`}
          >
            {ghanaBack ? (
              <div>
                <img src={ghanaBack.file_url} alt="Ghana Card Back" className="w-full h-32 object-cover rounded-xl mb-3" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Back Uploaded ✓</p>
              </div>
            ) : (
              <div className="py-8">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Back Side</p>
              </div>
            )}
          </div>
          <input ref={ghanaBackRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleGhanaCard('ghana_card_back', e)} />
        </div>
      </div>

      {/* ─── CERTIFICATES (Optional) ──────────────────────── */}
      <div className="glass rounded-[2.5rem] p-8 border-white/40 shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-gray-400" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Certificates & Licenses</p>
          </div>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Optional</span>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Add any certificates or licenses you have. These help build trust with customers.</p>

        {/* Existing certs */}
        {certificates.length > 0 && (
          <div className="space-y-3">
            {certificates.map(cert => (
              <div key={cert.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{cert.certificate_name}</p>
                  <p className="text-[10px] text-gray-400">
                    {cert.issued_by && `${cert.issued_by}`}{cert.year_obtained && ` • ${cert.year_obtained}`}
                  </p>
                </div>
                <button
                  onClick={() => removeCertificate(cert.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add cert form */}
        {showCertForm ? (
          <div className="space-y-3 p-4 bg-gray-50/50 rounded-[2rem] border border-gray-100">
            <input
              type="text"
              placeholder="Certificate name (e.g. City & Guilds Plumbing)"
              value={certName}
              onChange={e => setCertName(e.target.value)}
              className="w-full h-10 px-4 bg-white border-2 border-transparent focus:border-gray-900 rounded-xl text-sm text-gray-900 font-bold outline-none transition-all"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Issued by (optional)"
                value={certIssuedBy}
                onChange={e => setCertIssuedBy(e.target.value)}
                className="h-10 px-4 bg-white border-2 border-transparent focus:border-gray-900 rounded-xl text-sm text-gray-900 font-bold outline-none transition-all"
              />
              <input
                type="number"
                placeholder="Year (optional)"
                value={certYear}
                onChange={e => setCertYear(e.target.value)}
                className="h-10 px-4 bg-white border-2 border-transparent focus:border-gray-900 rounded-xl text-sm text-gray-900 font-bold outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center gap-2 h-10 px-4 bg-white border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-900 transition-colors">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-400">
                  {certFileRef.current?.files?.[0]?.name || 'Choose file'}
                </span>
                <input ref={certFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={() => {}} />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCertForm(false); setCertName(''); setCertIssuedBy(''); setCertYear(''); }}
                className="px-4 py-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCert}
                disabled={!certName.trim() || !certFileRef.current?.files?.length}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-20 transition-all"
              >
                Add Certificate
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCertForm(true)}
            className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all w-full justify-center"
          >
            <Plus className="w-4 h-4" /> Add Certificate
          </button>
        )}
      </div>

      {/* ─── WORK PORTFOLIO ────────────────────────────────── */}
      <div className="glass rounded-[2.5rem] p-8 border-white/40 shadow-lg space-y-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-gray-400" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Work Portfolio</p>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Show off your best work! Upload photos of completed jobs to attract more customers.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {portfolio.map(img => (
            <div key={img.id} className="relative group rounded-2xl overflow-hidden shadow-md">
              <img src={img.image_url} alt={img.caption || 'Work'} className="w-full h-32 object-cover" />
              <button
                onClick={() => removePortfolioImage(img.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] font-bold text-white truncate">{img.caption}</p>
                </div>
              )}
            </div>
          ))}

          {/* Upload button */}
          <div
            onClick={() => portfolioInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gray-900 hover:bg-gray-50 transition-all"
          >
            <Plus className="w-6 h-6 text-gray-300 mb-2" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Photos</p>
          </div>
        </div>
        <input ref={portfolioInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioUpload} />
      </div>

      {/* ─── SUBMIT ────────────────────────────────────────── */}
      <div className="glass rounded-[2.5rem] p-8 border-white/40 shadow-lg text-center space-y-4">
        {isApproved ? (
          <div className="flex items-center justify-center gap-3 text-emerald-500">
            <CheckCircle className="w-8 h-8" />
            <p className="font-black text-lg">Profile Verified!</p>
          </div>
        ) : isPending ? (
          <div className="flex items-center justify-center gap-3 text-amber-500">
            <Clock className="w-8 h-8" />
            <div>
              <p className="font-black text-lg text-gray-900">Profile Under Review</p>
              <p className="text-xs text-gray-400 mt-1">Our team is reviewing your documents. This usually takes 24-48 hours.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400">
              {!profile.trade || !profile.area
                ? 'Please select your trade and area.'
                : !ghanaFront || !ghanaBack
                ? 'Please upload both sides of your Ghana Card.'
                : 'Your profile is ready for review!'}
            </p>
            <button
              onClick={submitForVerification}
              disabled={!canSubmit || saving}
              className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkerProfileSetup;
