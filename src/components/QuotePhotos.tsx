import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QuotePhoto {
  path: string;      // storage path in the quote-photos bucket: <user_id>/<file>
  caption?: string;
}

interface Props {
  userId?: string;
  photos: QuotePhoto[];
  onChange: (photos: QuotePhoto[]) => void;
  disabled?: boolean;
  max?: number;
}

// Shrink phone photos (often 4–8 MB) to ~1600px JPEGs before upload.
async function compress(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality));
}

export const QuotePhotos = ({ userId, photos, onChange, disabled, max = 8 }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  // Signed URLs for thumbnails (bucket is private)
  useEffect(() => {
    const missing = photos.map((p) => p.path).filter((p) => !urls[p]);
    if (!missing.length) return;
    supabase.storage.from("quote-photos").createSignedUrls(missing, 3600).then(({ data }) => {
      if (!data) return;
      setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path!, d.signedUrl])) }));
    });
  }, [photos]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = () => inputRef.current?.click();

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!userId) {
      toast.error("Create an account to attach photos");
      return;
    }
    const room = max - photos.length;
    if (room <= 0) {
      toast.info(`Up to ${max} photos per quote`);
      return;
    }
    setUploading(true);
    const added: QuotePhoto[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      if (!file.type.startsWith("image/")) continue;
      const blob = await compress(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("quote-photos").upload(path, blob, { contentType: "image/jpeg" });
      if (error) toast.error(`Couldn't upload ${file.name}`);
      else added.push({ path });
    }
    setUploading(false);
    if (added.length) onChange([...photos, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = async (path: string) => {
    onChange(photos.filter((p) => p.path !== path));
    await supabase.storage.from("quote-photos").remove([path]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Site photos <span className="text-muted-foreground font-normal">(optional, shown to your customer)</span></span>
        <Button type="button" variant="outline" size="sm" onClick={pick} disabled={disabled || uploading || photos.length >= max}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
          <span className="ml-1.5">{uploading ? "Uploading…" : "Add photos"}</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          aria-label="Add site photos"
          onChange={(e) => upload(e.target.files)}
        />
      </div>
      {photos.length > 0 && (
        <ul className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {photos.map((p) => (
            <li key={p.path} className="relative aspect-square rounded-md overflow-hidden bg-muted">
              {urls[p.path] && <img src={urls[p.path]} alt="Site photo" className="h-full w-full object-cover" />}
              <button
                type="button"
                onClick={() => remove(p.path)}
                className="absolute top-1 right-1 h-7 w-7 rounded-full bg-background/90 flex items-center justify-center shadow"
                aria-label="Remove photo"
                disabled={disabled}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
