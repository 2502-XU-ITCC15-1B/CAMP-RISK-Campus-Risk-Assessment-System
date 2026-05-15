import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { X, Upload } from 'lucide-react';
import { AppShellHeader } from '../components/AppShellHeader';
import { useAuth } from '../context/AuthContext';
import { ensureMediaSrc, fetchReport, submitIncidentReport, updateGuardIncidentReport } from '../lib/api';
import {
  MAX_INCIDENT_MB,
  MAX_INCIDENT_PHOTOS,
  validateIncidentPhotoFile,
  validateIncidentPhotoList,
} from '../lib/incidentPhotoLimits';

export function IncidentReport() {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId?: string }>();
  const isEdit = Boolean(reportId);
  const { user } = useAuth();
  const [hazardTypes, setHazardTypes] = useState<string[]>([]);
  const [otherHazard, setOtherHazard] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [specific, setSpecific] = useState('');
  const [description, setDescription] = useState('');
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [blobPreviewUrls, setBlobPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [initialLoading, setInitialLoading] = useState(isEdit);
  /** Saved-on-server image URLs when editing. */
  const [serverPhotoUrls, setServerPhotoUrls] = useState<string[]>([]);
  /** Edit: user chose to delete all saved photos on submit (no new files). */
  const [pendingRemoveAllPhotos, setPendingRemoveAllPhotos] = useState(false);

  const hazardOptions = [
    'Earthquake Hazard',
    'Fire in Campus Buildings',
    'Laboratory Chemical Exposure',
    'Biological Hazard Exposure',
    'Campus Security Incident',
    'Traffic and Vehicle Congestion',
    'Flooding',
    'Electrical Hazards',
    'Emergency Evacuation Failure',
    'Slips, Trips, and Falls',
    'Tree/Branch Fall',
    'Heat Stress',
    'Hazardous Waste Management',
    'Construction and Maintenance Hazards',
    'Public Health Risks',
    'Others',
  ];

  useEffect(() => {
    if (!isEdit || !reportId) {
      setInitialLoading(false);
      return;
    }
    let cancelled = false;
    setInitialLoading(true);
    setLoadError('');
    void (async () => {
      try {
        const r = await fetchReport(reportId);
        if (cancelled) return;
        if (!r) {
          setLoadError('Report not found.');
          return;
        }
        if (r.status_code !== 'pending') {
          setLoadError(
            'This report can no longer be edited. Only Pending reports (before SSIO assessment) can be updated.',
          );
          return;
        }
        setHazardTypes(
          (Array.isArray(r.hazard_types) ? r.hazard_types : []).map((h) =>
            h === 'Other (specify)' ? 'Others' : h,
          ),
        );
        setOtherHazard(r.other_hazard || '');
        setBuilding(r.building || '');
        setFloor(r.floor || '');
        setRoom(r.room || '');
        setSpecific(r.specific_location || '');
        setDescription(r.description || '');
        const urls =
          Array.isArray(r.photo_urls) && r.photo_urls.length > 0
            ? r.photo_urls.filter(Boolean)
            : r.photo_url
              ? [r.photo_url]
              : [];
        setServerPhotoUrls(urls);
        setNewPhotoFiles([]);
        setPendingRemoveAllPhotos(false);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Could not load report');
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, reportId]);

  useEffect(() => {
    const urls = newPhotoFiles.map((f) => URL.createObjectURL(f));
    setBlobPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [newPhotoFiles]);

  const toggleHazard = (hazard: string) => {
    if (hazardTypes.includes(hazard)) {
      setHazardTypes(hazardTypes.filter((h) => h !== hazard));
    } else {
      setHazardTypes([...hazardTypes, hazard]);
    }
  };

  const handleFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingRemoveAllPhotos(false);
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!incoming.length) return;

    const rejections: string[] = [];
    const accepted: File[] = [];

    setNewPhotoFiles((prev) => {
      const room = MAX_INCIDENT_PHOTOS - prev.length;
      for (const f of incoming) {
        if (accepted.length >= room) {
          rejections.push(`Only ${MAX_INCIDENT_PHOTOS} photos allowed. Extra files were skipped.`);
          break;
        }
        const err = validateIncidentPhotoFile(f);
        if (err) {
          rejections.push(`${f.name}: ${err}`);
          continue;
        }
        accepted.push(f);
      }
      if (rejections.length) {
        setError(rejections.join(' '));
      } else {
        setError('');
      }
      if (!accepted.length) return prev;
      return [...prev, ...accepted];
    });
  };

  const removeNewPhotoAt = (idx: number) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const markRemoveAllSavedPhotos = () => {
    setNewPhotoFiles([]);
    if (isEdit && serverPhotoUrls.length > 0) setPendingRemoveAllPhotos(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('You must be logged in to submit a report.');
      return;
    }
    if (hazardTypes.length === 0) {
      setError('Select at least one hazard type.');
      return;
    }
    const photoErr = validateIncidentPhotoList(newPhotoFiles);
    if (photoErr) {
      setError(photoErr);
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('submitted_by_user_id', user.id);
      fd.append('submitted_by_name', user.fullName);
      fd.append('hazard_types', JSON.stringify(hazardTypes));
      fd.append('other_hazard', otherHazard);
      fd.append('building', building);
      fd.append('floor', floor);
      fd.append('room', room);
      fd.append('specific_location', specific);
      fd.append('description', description);
      if (newPhotoFiles.length > 0) {
        newPhotoFiles.forEach((f) => fd.append('photos', f));
      } else if (isEdit && pendingRemoveAllPhotos && serverPhotoUrls.length > 0) {
        fd.append('remove_photo', '1');
      }
      if (isEdit && reportId) {
        await updateGuardIncidentReport(reportId, fd);
      } else {
        await submitIncidentReport(fd);
      }
      navigate('/guard/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page">
      <AppShellHeader
        actions={
          <button
            type="button"
            onClick={() => navigate('/guard/dashboard')}
            className="app-btn-outline w-full sm:w-auto"
          >
            Dashboard
          </button>
        }
      />

      <main className="app-main-narrow">
        <div className="app-form-panel">
          <div className="flex items-start justify-between gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl text-slate-800 pr-2">{isEdit ? 'Update Incident Report' : 'New Incident Report'}</h2>
            <button
              type="button"
              onClick={() => navigate('/guard/dashboard')}
              className="text-slate-600 hover:text-slate-800"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {initialLoading ? (
            <p className="text-sm text-slate-600">Loading report…</p>
          ) : loadError ? (
            <div className="mb-6 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900">
              {loadError}
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-slate-800 mb-3">
                    Hazard Type
                    <span className="text-sm text-slate-600 ml-2">(Select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {hazardOptions.map((hazard) => (
                      <label
                        key={hazard}
                        className="flex items-center gap-3 p-3 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={hazardTypes.includes(hazard)}
                          onChange={() => toggleHazard(hazard)}
                          className="h-5 w-5 text-[var(--xu-blue)] rounded focus:ring-[var(--xu-blue)]"
                        />
                        <span className="text-slate-700">{hazard}</span>
                      </label>
                    ))}
                  </div>
                  {hazardTypes.includes('Others') && (
                    <input
                      type="text"
                      value={otherHazard}
                      onChange={(e) => setOtherHazard(e.target.value)}
                      placeholder="Please specify"
                      className="w-full mt-4 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--xu-blue)] bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-800 mb-2">Photos</label>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    Add up to {MAX_INCIDENT_PHOTOS} images (JPG or PNG, max {MAX_INCIDENT_MB}MB each). Three or more angles help SSIO
                    assess risk. On edit, uploading new photos replaces all saved images.
                  </p>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 sm:p-5 hover:border-[var(--xu-blue)]/50 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={handleFilesAdd}
                      className="sr-only"
                      id="incident-photos-upload"
                      disabled={newPhotoFiles.length >= MAX_INCIDENT_PHOTOS}
                    />
                    <label
                      htmlFor="incident-photos-upload"
                      className={`flex flex-col items-center gap-2 ${newPhotoFiles.length >= MAX_INCIDENT_PHOTOS ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <Upload className="h-9 w-9 text-slate-400" aria-hidden />
                      <span className="text-sm font-medium text-slate-700">Add photos</span>
                      <span className="text-xs text-slate-500">
                        {newPhotoFiles.length}/{MAX_INCIDENT_PHOTOS} selected
                      </span>
                    </label>
                  </div>

                  {isEdit && serverPhotoUrls.length > 0 && !pendingRemoveAllPhotos && newPhotoFiles.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-600">
                      {serverPhotoUrls.length} photo{serverPhotoUrls.length === 1 ? '' : 's'} on file. Add new images
                      to replace them, or remove all.
                    </p>
                  ) : null}
                  {isEdit && pendingRemoveAllPhotos && newPhotoFiles.length === 0 ? (
                    <p className="mt-2 text-xs text-amber-800">Saved photos will be removed when you save.</p>
                  ) : null}

                  {newPhotoFiles.length > 0 && isEdit && serverPhotoUrls.length > 0 ? (
                    <p className="mt-2 text-xs text-slate-600">New images below replace all saved photos when you save.</p>
                  ) : null}
                  {newPhotoFiles.length > 0 || (!pendingRemoveAllPhotos && serverPhotoUrls.length > 0) ? (
                    <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                      {newPhotoFiles.length > 0
                        ? newPhotoFiles.map((f, i) => (
                            <div
                              key={`${f.name}-${i}`}
                              className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                            >
                              <img
                                src={blobPreviewUrls[i] ?? ''}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeNewPhotoAt(i)}
                                className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white text-xs hover:bg-black/75"
                                aria-label={`Remove ${f.name}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        : !pendingRemoveAllPhotos
                          ? serverPhotoUrls.map((u, i) => {
                              const src = ensureMediaSrc(u);
                              if (!src) return null;
                              return (
                                <div
                                  key={`srv-${i}`}
                                  className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                                >
                                  <img src={src} alt="" className="h-full w-full object-cover" />
                                </div>
                              );
                            })
                          : null}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    {isEdit && serverPhotoUrls.length > 0 && !pendingRemoveAllPhotos ? (
                      <button
                        type="button"
                        onClick={markRemoveAllSavedPhotos}
                        className="text-red-700 hover:text-red-900 underline underline-offset-2"
                      >
                        Remove all saved photos
                      </button>
                    ) : null}
                    {isEdit && pendingRemoveAllPhotos ? (
                      <button
                        type="button"
                        onClick={() => setPendingRemoveAllPhotos(false)}
                        className="text-[var(--xu-blue)] hover:text-blue-800 underline underline-offset-2"
                      >
                        Undo — keep saved photos
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 mb-3">Location Details</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        placeholder="Building"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--xu-blue)] bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        placeholder="Floor"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--xu-blue)] bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="Room/Zone"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--xu-blue)] bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={specific}
                        onChange={(e) => setSpecific(e.target.value)}
                        placeholder="Specific Location"
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--xu-blue)] bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 mb-3">
                    Description
                    <span className="text-sm text-slate-600 ml-2">(Optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Additional details about the incident..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--xu-blue)] bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 bg-[var(--xu-blue)] text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
