import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  Shield, Phone, MapPin, AlertTriangle, Siren, Flame, Heart,
  CloudRain, Send, Upload, Loader2, X, Image as ImageIcon,
  Navigation, Radio, Info, CheckCircle2, Clock, FileText, Bug,
  CircleAlert, TriangleAlert, Megaphone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "@/services/notifications";

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────
interface EmergencyContact {
  service: string;
  number: string;
  description: string;
  category: "police" | "fire" | "medical" | "disaster";
  icon: React.ReactNode;
}

interface CityAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  starts_at: string;
  expires_at: string | null;
}

// ────────────────────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────────────────────
const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { service: "Police Emergency", number: "117", description: "For crimes, accidents, and immediate police assistance", category: "police", icon: <Shield className="h-5 w-5" /> },
  { service: "San Carlos Police Station", number: "(075) 529-9234", description: "Non-emergency police matters", category: "police", icon: <Shield className="h-5 w-5" /> },
  { service: "Fire Department", number: "116", description: "For fire emergencies and rescue operations", category: "fire", icon: <Flame className="h-5 w-5" /> },
  { service: "San Carlos Fire Station", number: "(075) 529-8765", description: "Non-emergency fire department inquiries", category: "fire", icon: <Flame className="h-5 w-5" /> },
  { service: "Medical Emergency", number: "911", description: "For medical emergencies and ambulance services", category: "medical", icon: <Heart className="h-5 w-5" /> },
  { service: "San Carlos General Hospital", number: "(075) 529-1234", description: "24/7 emergency and outpatient services", category: "medical", icon: <Heart className="h-5 w-5" /> },
  { service: "Disaster Risk Reduction Office", number: "(075) 529-7890", description: "Disaster preparedness and emergency planning", category: "disaster", icon: <CloudRain className="h-5 w-5" /> },
  { service: "Municipal DRRM Office", number: "(075) 529-6543", description: "Evacuation centers & relief operations", category: "disaster", icon: <CloudRain className="h-5 w-5" /> },
];

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  police:   { label: "Police",   icon: <Shield className="h-4 w-4" />,    color: "text-blue-600" },
  fire:     { label: "Fire",     icon: <Flame className="h-4 w-4" />,     color: "text-orange-600" },
  medical:  { label: "Medical",  icon: <Heart className="h-4 w-4" />,     color: "text-red-600" },
  disaster: { label: "Disaster", icon: <CloudRain className="h-4 w-4" />, color: "text-purple-600" },
};

const REPORT_TYPES = [
  { value: "incident",             label: "Incident",             icon: "🚨", description: "Accident, crime, or emergency event" },
  { value: "hazard",               label: "Hazard",               icon: "⚠️", description: "Unsafe condition or potential danger" },
  { value: "suspicious_activity",  label: "Suspicious Activity",  icon: "👁️", description: "Unusual or concerning behavior" },
  { value: "other",                label: "Other",                icon: "📋", description: "Anything else" },
];

const SAFETY_TIPS = [
  {
    title: "🔥 What to Do During a Fire",
    content: [
      "Stay low to avoid smoke inhalation.",
      "Feel doors before opening — if hot, find another way out.",
      "Call 116 immediately and give your exact location.",
      "Meet at your pre-designated family meeting point.",
      "Never go back inside a burning building.",
    ],
  },
  {
    title: "🌊 Flood Safety Tips",
    content: [
      "Move to higher ground immediately when flooding starts.",
      "Do not walk, swim, or drive through flood waters.",
      "6 inches of moving water can knock you down; 1 foot can carry a vehicle.",
      "Disconnect electrical appliances and turn off gas.",
      "Listen to local radio/TV for evacuation instructions.",
    ],
  },
  {
    title: "🌀 Typhoon Preparedness",
    content: [
      "Stock water, food, medications, and flashlights for at least 3 days.",
      "Secure loose outdoor objects and board windows.",
      "Charge devices and have a battery-powered radio ready.",
      "Know your evacuation route and nearest evacuation center.",
      "Follow PAGASA advisories and local government instructions.",
    ],
  },
  {
    title: "🏚️ Earthquake Safety",
    content: [
      "Drop, Cover, and Hold On — get under a sturdy table.",
      "Stay away from windows, heavy furniture, and appliances.",
      "If outdoors, move to an open area away from buildings.",
      "After shaking stops, check for injuries and hazards.",
      "Be prepared for aftershocks — do not re-enter damaged buildings.",
    ],
  },
  {
    title: "🚗 Road Accident Response",
    content: [
      "Call 117 (police) and 911 (medical) immediately.",
      "Do not move injured persons unless there's immediate danger.",
      "Turn on hazard lights and set up warning triangles.",
      "Take photos of the scene for documentation.",
      "Exchange information with the other party and wait for authorities.",
    ],
  },
];

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ────────────────────────────────────────────────────────────
// HELPER: format tel: href
// ────────────────────────────────────────────────────────────
function telHref(number: string): string {
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}

// ────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────

/* ── 911 Hero + SOS Button ─────────────────────────────── */
function EmergencyHero({ onSOS }: { onSOS: () => void }) {
  return (
    <Card className="border-2 border-destructive bg-destructive/5 overflow-hidden">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Left — 911 call */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
              <span className="text-lg font-bold text-destructive">Life-Threatening Emergency?</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              If someone is in immediate danger or needs urgent medical help, call <strong className="text-destructive text-base">911</strong> right away.
            </p>
            <a href="tel:911" className="inline-block w-full md:w-auto">
              <Button variant="destructive" size="lg" className="w-full md:w-auto text-base gap-2">
                <Phone className="h-5 w-5" />
                Call 911 Now
              </Button>
            </a>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-24 bg-destructive/20" />
          <div className="block md:hidden w-full h-px bg-destructive/20" />

          {/* Right — SOS panic button */}
          <div className="flex-1 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Can't call? Send an <strong>SOS alert</strong> with your GPS location to city authorities.
            </p>
            <Button
              onClick={onSOS}
              size="lg"
              className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white text-base gap-2 animate-pulse hover:animate-none"
            >
              <Navigation className="h-5 w-5" />
              Send SOS Alert
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Contact Card ──────────────────────────────────────── */
function ContactCard({ contact }: { contact: EmergencyContact }) {
  const meta = CATEGORY_META[contact.category];
  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-destructive">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className={meta.color}>{contact.icon}</span>
          {contact.service}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <a href={telHref(contact.number)} className="text-2xl font-bold text-destructive hover:underline block mb-1">
          {contact.number}
        </a>
        <CardDescription className="mb-3 text-xs">{contact.description}</CardDescription>
        <a href={telHref(contact.number)} className="block">
          <Button variant="outline" size="sm" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2">
            <Phone className="h-4 w-4" />
            Call Now
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

/* ── Category Tabs for Contacts ────────────────────────── */
function ContactTabs() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Phone className="h-5 w-5 text-destructive" />
        Emergency Contacts
      </h3>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="all" className="flex-1 min-w-[80px] gap-1 text-xs sm:text-sm">
            <Radio className="h-3.5 w-3.5" /> All
          </TabsTrigger>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <TabsTrigger key={key} value={key} className="flex-1 min-w-[80px] gap-1 text-xs sm:text-sm">
              {meta.icon} {meta.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {EMERGENCY_CONTACTS.map((c, i) => <ContactCard key={i} contact={c} />)}
          </div>
        </TabsContent>

        {Object.keys(CATEGORY_META).map((cat) => (
          <TabsContent key={cat} value={cat}>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {EMERGENCY_CONTACTS.filter((c) => c.category === cat).map((c, i) => (
                <ContactCard key={i} contact={c} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/* ── City Alerts Section ───────────────────────────────── */
function CityAlerts() {
  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("city_alerts")
          .select("id, title, description, severity, category, starts_at, expires_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        setAlerts(data ?? []);
      } catch (err) {
        console.error("Failed to fetch city alerts:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const severityStyle: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    critical: { bg: "bg-red-100 border-red-300", text: "text-red-800", icon: <CircleAlert className="h-5 w-5 text-red-600" /> },
    warning:  { bg: "bg-amber-50 border-amber-300", text: "text-amber-800", icon: <TriangleAlert className="h-5 w-5 text-amber-600" /> },
    info:     { bg: "bg-blue-50 border-blue-200", text: "text-blue-800", icon: <Info className="h-5 w-5 text-blue-600" /> },
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-destructive" />
        Active City Alerts
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
            <p className="font-medium">No active alerts</p>
            <p className="text-sm">The city is currently under normal conditions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const s = severityStyle[alert.severity] ?? severityStyle.info;
            return (
              <Card key={alert.id} className={`border ${s.bg}`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{s.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-semibold ${s.text}`}>{alert.title}</span>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {alert.category}
                        </Badge>
                        <Badge
                          variant={alert.severity === "critical" ? "destructive" : "secondary"}
                          className="text-[10px] uppercase tracking-wider"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className={`text-sm ${s.text} opacity-90`}>{alert.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.starts_at).toLocaleDateString()}
                        </span>
                        {alert.expires_at && (
                          <span>
                            Expires: {new Date(alert.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Safety Tips ───────────────────────────────────────── */
function SafetyTips() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Info className="h-5 w-5 text-civic-blue" />
        Safety Tips &amp; Guidelines
      </h3>
      <Card>
        <CardContent className="pt-4 pb-2">
          <Accordion type="multiple" className="w-full">
            {SAFETY_TIPS.map((tip, i) => (
              <AccordionItem key={i} value={`tip-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                  {tip.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5 ml-1">
                    {tip.content.map((line, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Emergency Report Form ─────────────────────────────── */
function EmergencyReportForm() {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    return () => photoPreviews.forEach((u) => URL.revokeObjectURL(u));
  }, [photoPreviews]);

  const grabGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation(`Lat ${pos.coords.latitude.toFixed(6)}, Lng ${pos.coords.longitude.toFixed(6)}`);
        setGpsLoading(false);
        toast.success("Location captured!");
      },
      (err) => {
        toast.error(`Could not get location: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const allowed = incoming.filter((f) => {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} is not an image`); return false; }
      if (f.size > MAX_FILE_SIZE) { toast.error(`${f.name} exceeds 5 MB`); return false; }
      return true;
    });
    const available = MAX_PHOTOS - photos.length;
    if (allowed.length > available) toast.info(`Only ${available} more photo(s) allowed`);
    const toAdd = allowed.slice(0, available);
    setPhotos((prev) => [...prev, ...toAdd]);
    setPhotoPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx]);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/emergency/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: false });
    if (error) { console.error("Upload error:", error); return null; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  const handleSubmit = async () => {
    if (!type || !subject || !details) {
      toast.error("Please fill in Type, Subject, and Details");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth"); return; }

    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const url = await uploadPhoto(photo, session.user.id);
        if (url) photoUrls.push(url);
      }

      const { error } = await (supabase as any).from("emergency_reports").insert({
        user_id: session.user.id,
        type,
        subject,
        description: details,
        location: location || "",
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        photo_urls: photoUrls,
        status: "pending",
      });
      if (error) throw error;

      toast.success("Emergency report submitted successfully!");
      await createNotification(
        session.user.id,
        "Emergency Report Submitted",
        `Your report "${subject}" has been received and is being reviewed.`,
        "success"
      );

      // Reset
      setType(""); setSubject(""); setLocation(""); setDetails("");
      setCoords(null);
      photoPreviews.forEach((u) => URL.revokeObjectURL(u));
      setPhotos([]); setPhotoPreviews([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(`Failed to submit report: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const charsLeft = 1000 - details.length;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5 text-civic-blue" />
        Report an Incident
      </h3>
      <Card className="shadow-lg border-0 ring-1 ring-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="h-4 w-4 text-amber-600" />
            Non-Urgent Incident Report
          </CardTitle>
          <CardDescription>
            Use this form for non-life-threatening incidents. For emergencies, call 911.
            Fields marked <span className="text-destructive">*</span> are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          {/* Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select incident type" /></SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    <span className="flex items-center gap-2">
                      <span>{rt.icon}</span>
                      <span>{rt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label>Subject <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Fallen power line on Rizal Ave"
              value={subject}
              maxLength={120}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Location + GPS */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Location
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Corner Rizal Ave & Bonifacio St"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={grabGPS}
                disabled={gpsLoading}
                title="Use current GPS location"
              >
                {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              </Button>
            </div>
            {coords && (
              <p className="text-[11px] text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> GPS coordinates captured
              </p>
            )}
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <Label>Details <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Describe what happened, when, and any other relevant information..."
              rows={5}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="resize-none"
            />
            <p className={`text-[11px] text-right ${charsLeft < 50 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
              {charsLeft} characters remaining
            </p>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Photos <span className="text-xs text-muted-foreground font-normal">(optional, up to {MAX_PHOTOS})</span>
            </Label>
            {photoPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < MAX_PHOTOS && (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-4 cursor-pointer text-sm text-muted-foreground hover:border-civic-blue/50 hover:bg-civic-blue/5 transition">
                <Upload className="h-4 w-4" />
                Click or drag to upload photos
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => handlePhotos(e.target.files)} />
              </label>
            )}
          </div>

          {/* Warning */}
          <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>This form is for <strong>non-urgent</strong> reports only. For life-threatening emergencies, please call 911 immediately.</p>
          </div>

          {/* Submit */}
          <Button className="w-full h-11 text-base" variant="civic" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Submit Report</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Emergency Locations ───────────────────────────────── */
function EmergencyLocations() {
  const locations = [
    { name: "San Carlos General Hospital", type: "24/7 Emergency Services", mapQuery: "San Carlos General Hospital, Pangasinan" },
    { name: "San Carlos Police Station", type: "Main Station Downtown", mapQuery: "San Carlos Police Station, Pangasinan" },
    { name: "San Carlos Fire Station", type: "Fire & Rescue HQ", mapQuery: "San Carlos Fire Station, Pangasinan" },
    { name: "City DRRM Center", type: "Evacuation & Relief Center", mapQuery: "San Carlos City Hall, Pangasinan" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="h-5 w-5 text-civic-blue" />
        Emergency Locations
      </h3>
      <Card>
        <CardContent className="pt-4 space-y-3">
          {locations.map((loc, i) => (
            <div key={i} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/30 transition">
              <div>
                <p className="font-medium text-sm">{loc.name}</p>
                <p className="text-xs text-muted-foreground">{loc.type}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Directions
                </Button>
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────
export const EmergencyServicesService = () => {
  const navigate = useNavigate();
  const [sosDialogOpen, setSOSDialogOpen] = useState(false);
  const [sosMessage, setSOSMessage] = useState("");
  const [sosSending, setSOSSending] = useState(false);

  const handleSOS = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Please sign in to send an SOS alert");
      navigate("/auth");
      return;
    }
    setSOSDialogOpen(true);
  };

  const confirmSOS = async () => {
    setSOSSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      let lat: number | null = null;
      let lng: number | null = null;

      // Try to get GPS
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // GPS unavailable — still send the SOS without coordinates
      }

      const { error } = await (supabase as any).from("sos_reports").insert({
        user_id: session.user.id,
        latitude: lat,
        longitude: lng,
        message: sosMessage || "SOS — I need help!",
        status: "sent",
      });
      if (error) throw error;

      toast.success("SOS alert sent! Authorities have been notified.", { duration: 6000 });
      await createNotification(
        session.user.id,
        "SOS Alert Sent",
        `Your SOS alert has been transmitted. Help is on the way.${lat ? ` Location: ${lat.toFixed(5)}, ${lng?.toFixed(5)}` : ""}`,
        "warning"
      );
      setSOSDialogOpen(false);
      setSOSMessage("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to send SOS: ${msg}`);
    } finally {
      setSOSSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Siren className="h-16 w-16 text-destructive mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Emergency Services</h2>
        <p className="text-muted-foreground">Quick access to emergency contacts, alerts, and reporting tools</p>
      </div>

      {/* 911 Hero + SOS */}
      <EmergencyHero onSOS={handleSOS} />

      {/* SOS Confirmation Dialog */}
      <Dialog open={sosDialogOpen} onOpenChange={setSOSDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="h-5 w-5" />
              Confirm SOS Alert
            </DialogTitle>
            <DialogDescription>
              This will send your GPS location and an alert to city emergency services. Only use this in a real emergency.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Optional message</Label>
            <Textarea
              placeholder="Describe your situation briefly (optional)..."
              rows={3}
              value={sosMessage}
              onChange={(e) => setSOSMessage(e.target.value)}
              maxLength={300}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmSOS}
              disabled={sosSending}
              className="gap-2"
            >
              {sosSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {sosSending ? "Sending…" : "Send SOS Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active City Alerts */}
      <CityAlerts />

      {/* Contact Tabs */}
      <ContactTabs />

      {/* Emergency Report Form */}
      <EmergencyReportForm />

      {/* Safety Tips */}
      <SafetyTips />

      {/* Emergency Locations */}
      <EmergencyLocations />
    </div>
  );
};