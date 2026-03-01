import React from "react";
import {
  FileText, User, MapPin, Phone, Mail, CalendarDays,
  Heart, ShieldCheck, Truck, FileCheck,
} from "lucide-react";

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
      if (ll.includes("valid id") || ll.includes("authorization") || ll.includes("letter"))
                                                                   icon = <ShieldCheck className="h-3.5 w-3.5" />;
      if (ll.includes("delivery"))                                 icon = <Truck className="h-3.5 w-3.5" />;

      return { label, value, icon };
    })
    .filter(Boolean) as { label: string; value: string; icon: React.ReactNode }[];

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
            <p className="text-sm text-foreground mt-0.5 break-words">{f.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
