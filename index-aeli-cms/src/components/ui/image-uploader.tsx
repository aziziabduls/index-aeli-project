"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "./button";
import { getClientCookie } from "@/lib/cookie.client";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  ownerType: "destination" | "attraction" | "program";
  ownerId: string;
}

export function ImageUploader({
  value,
  onChange,
  multiple = false,
  ownerType,
  ownerId,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${apiUrl}${url}`;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const token = getClientCookie("session_token");

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("owner_type", ownerType);
        formData.append("owner_id", ownerId);
        formData.append("order_index", multiple ? "1" : "0");

        const res = await fetch(`${apiUrl}/api/v1/admin/media/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const resJson = await res.json();
        if (!res.ok) {
          throw new Error(resJson.error || "Failed to upload file");
        }

        if (resJson.success && resJson.data?.url) {
          uploadedUrls.push(resJson.data.url);
        }
      }

      if (multiple) {
        const currentImages = Array.isArray(value) ? value : value ? [value] : [];
        onChange([...currentImages, ...uploadedUrls]);
        toast.success(`Successfully uploaded ${files.length} images!`);
      } else {
        onChange(uploadedUrls[0] || "");
        toast.success("Image uploaded successfully!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemove = (urlToRemove: string) => {
    if (multiple) {
      const currentImages = Array.isArray(value) ? value : [];
      onChange(currentImages.filter((url) => url !== urlToRemove));
    } else {
      onChange("");
    }
    toast.success("Image removed");
  };

  if (multiple) {
    const images = Array.isArray(value) ? value : [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url) => (
            <div key={url} className="group relative aspect-video overflow-hidden rounded-lg border bg-muted">
              <img
                src={getMediaUrl(url)}
                alt="Gallery"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(url)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}

          <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/30">
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="size-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground font-medium">Upload Image</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>
    );
  }

  const imageUrl = typeof value === "string" ? value : "";

  return (
    <div className="flex flex-col gap-4">
      {imageUrl ? (
        <div className="relative aspect-video max-w-md overflow-hidden rounded-lg border bg-muted">
          <img
            src={getMediaUrl(imageUrl)}
            alt="Uploaded Cover"
            className="h-full w-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleRemove(imageUrl)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex aspect-video max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/30">
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImageIcon className="size-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground font-medium">Upload Cover Image</span>
              <span className="text-xs text-muted-foreground/70 mt-1">Supports JPG, PNG, WEBP, AVIF</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
