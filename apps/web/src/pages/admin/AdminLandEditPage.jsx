import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LandForm } from '../../components/admin/LandForm.jsx';
import { ImageUploader } from '../../components/admin/ImageUploader.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/EmptyAndErrorStates.jsx';
import { fetchAdminLandById, updateLand } from '../../lib/landApi.js';

export function AdminLandEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [land, setLand] = useState(null);
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState('loading');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    fetchAdminLandById(id)
      .then((res) => {
        setLand(res.land);
        setImages(res.images);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  const handleSubmit = async (payload) => {
    const updated = await updateLand(id, payload);
    setLand(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  if (status === 'loading') {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === 'error') {
    return <ErrorState message="Could not load this listing." onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-md text-ink">Edit listing</h1>
          <p className="mt-1 text-sm text-ink-soft">{land.title}</p>
        </div>
        <Link to="/admin/lands" className="text-sm text-ink-soft hover:text-accent">
          ← Back to listings
        </Link>
      </div>

      {savedNotice && (
        <p role="status" className="mt-4 rounded bg-accent-soft px-4 py-2.5 text-sm text-accent-hover">
          Listing saved.
        </p>
      )}

      <div className="mt-8 rounded-card border border-border bg-surface p-6">
        <ImageUploader landId={id} images={images} onImagesChange={setImages} />
      </div>

      <div className="mt-8">
        <LandForm defaultValues={land} onSubmit={handleSubmit} submitLabel="Save changes" />
      </div>

      <button
        type="button"
        onClick={() => navigate('/admin/lands')}
        className="mt-6 text-sm text-ink-soft hover:text-accent"
      >
        Done editing
      </button>
    </div>
  );
}
