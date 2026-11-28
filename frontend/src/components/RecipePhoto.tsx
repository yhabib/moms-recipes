import { useEffect, useState } from "react";
import { backend } from "../backend";
import { placeholderColor, placeholderInitial } from "../placeholderColor";
import "./RecipePhoto.css";

type Variant = "hero" | "card";

/** The photo found for an id: an object URL, or null for "no photo" (or an error). */
type PhotoState = { id: string; url: string | null };

/**
 * A recipe's photo, or a coloured box with the title's initial when there is
 * none. Pass `hasPhoto={false}` (from `RecipeSummary`) to skip the backend call.
 */
export function RecipePhoto({
  id,
  title,
  hasPhoto,
  variant,
}: {
  id: string;
  title: string;
  hasPhoto?: boolean;
  variant: Variant;
}) {
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const shouldFetch = hasPhoto !== false;

  useEffect(() => {
    if (!shouldFetch) return;
    let cancelled = false;
    let url: string | null = null;
    backend
      .getRecipePhoto(id)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          // Copy into a fresh ArrayBuffer-backed array so Blob accepts it.
          url = URL.createObjectURL(new Blob([new Uint8Array(p.data)], { type: p.contentType }));
        }
        setPhoto({ id, url });
      })
      .catch(() => {
        if (!cancelled) setPhoto({ id, url: null });
      });
    return () => {
      cancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
        // Drop the revoked URL so a later effect for the same id cannot show it.
        const revoked = url;
        setPhoto((prev) => (prev?.url === revoked ? null : prev));
      }
    };
  }, [id, shouldFetch]);

  // A photo left over from a previous id counts as still loading.
  const url = shouldFetch && photo?.id === id ? photo.url : null;

  if (url) {
    return <img className={`recipe-photo recipe-photo--${variant}`} src={url} alt={title} />;
  }
  return <RecipePhotoPlaceholder id={id} title={title} variant={variant} />;
}

function RecipePhotoPlaceholder({ id, title, variant }: { id: string; title: string; variant: Variant }) {
  const { background, foreground } = placeholderColor(id);
  return (
    <div
      className={`recipe-photo recipe-photo--${variant} recipe-photo__placeholder`}
      role="img"
      aria-label={title}
      style={{ background, color: foreground }}
    >
      <span aria-hidden="true">{placeholderInitial(title)}</span>
    </div>
  );
}
