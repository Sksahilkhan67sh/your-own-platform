import { useNavigate } from 'react-router-dom';
import { LandForm } from '../../components/admin/LandForm.jsx';
import { createLand } from '../../lib/landApi.js';

export function AdminLandCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    const land = await createLand(payload);
    // Images can only be uploaded once the land exists (the upload flow
    // needs a landId), so we redirect straight into edit mode.
    navigate(`/admin/lands/${land._id}/edit`, { replace: true });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-display-md text-ink">New listing</h1>
      <p className="mt-2 text-ink-soft">
        Fill in the listing details below. You'll be able to add photos once the listing is created.
      </p>
      <div className="mt-8">
        <LandForm onSubmit={handleSubmit} submitLabel="Create listing" />
      </div>
    </div>
  );
}
