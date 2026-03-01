import React, { useState } from "react";
import {
  FileText, User, MapPin, Phone, Mail, CalendarDays,
  Heart, ShieldCheck, Truck, FileCheck, Image, X, ZoomIn,
} from "lucide-react";

/**
 * Lightbox component for viewing uploaded photos full-size.
 */
const PhotoLightbox = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <button
      className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition"
      onClick={onClose}
    >
      <X className="h-5 w-5" />
    </button>
    <img
      src={src}
      alt={alt}
      className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

/**
 * Renders a clickable thumbnail for an uploaded photo URL.
 */
const PhotoThumbnail = ({ url, label }: { url: string; label: string }) => {
  const [open, setOpen] = useState(false);
  const isPdf = url.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-civic-blue hover:underline"
      >
        <FileText className="h-4 w-4" />
        View PDF
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative inline-block rounded-lg overflow-hidden border border-border/60 hover:border-civic-blue transition w-20 h-20"
      >
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
          <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
        </div>
      </button>
      {open && <PhotoLightbox src={url} alt={label} onClose={() => setOpen(false)} />}
    </>
  );
};

/**
 * Parses a `\n\n`-separated "Label: Value" description string
 * and renders it as a structured detail grid with contextual icons.
 */
export const ParsedDescription = ({ description }: { description: string }) => {
  if (!description) return null;

  const fields = description
    .split("\n\n")
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx <= 0) return null;
      const label = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      if (!value) return null;

      const ll = label.toLowerCase();
      let icon: React.ReactNode = <FileText className="h-3.5 w-3.5" />;
      if (ll.includes("name"))                                     icon = <User className="h-3.5 w-3.5" />;
      if (ll.includes("date"))                                     icon = <CalendarDays className="h-3.5 w-3.5" />;
      if (ll.includes("place") || ll.includes("registration"))    icon = <MapPin className="h-3.5 w-3.5" />;
      if (ll.includes("address"))                                  icon = <MapPin className="h-3.5 w-3.5" />;
      if (ll.includes("contact") || ll.includes("phone"))         icon = <Phone className="h-3.5 w-3.5" />;
      if (ll.includes("email"))                                    icon = <Mail className="h-3.5 w-3.5" />;
      if (ll.includes("relationship"))                             icon = <Heart className="h-3.5 w-3.5" />;
      if (ll.includes("purpose"))                                  icon = <FileCheck className="h-3.5 w-3.5" />;
      if (ll.includes("valid id") || ll.includes("authorization") || ll.includes("letter")
          || ll.includes("utility") || ll.includes("barangay id") || ll.includes("cedula")
          || ll.includes("lease"))
                                                                   icon = <ShieldCheck className="h-3.5 w-3.5" />;
      if (ll.includes("delivery"))                                 icon = <Truck className="h-3.5 w-3.5" />;

      // Detect [photo]URL pattern for uploaded files
      const isPhoto = value.startsWith("[photo]");
      const photoUrl = isPhoto ? value.replace("[photo]", "") : null;
      if (isPhoto) icon = <Image className="h-3.5 w-3.5" />;

      return { label, value: isPhoto ? value : value, icon, photoUrl };
    })
    .filter(Boolean) as { label: string; value: string; icon: React.ReactNode; photoUrl: string | null }[];

  if (fields.length === 0) {
    return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-1.5">
      {fields.map((f, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2.5 rounded-lg bg-muted/40 border border-border/50 px-3 py-2"
        >
          <div className="text-muted-foreground mt-0.5 flex-shrink-0">{f.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 leading-tight">
              {f.label}
            </p>
            {f.photoUrl ? (
              <div className="mt-1">
                <PhotoThumbnail url={f.photoUrl} label={f.label} />
              </div>
            ) : (
              <p className="text-sm text-foreground mt-0.5 break-words">{f.value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
