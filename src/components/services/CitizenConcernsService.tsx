import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, MapPin, Upload, Loader2, Tag, FileText, Info, X, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { openEmailRequest } from "@/lib/email";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "@/components/NotificationBell";
import { generateOrderId } from "@/lib/utils";

const CATEGORIES = [
  { value: "infrastructure",    label: "Infrastructure",    icon: "🏗️", description: "Roads, bridges, buildings" },
  { value: "road-maintenance",  label: "Road Maintenance",  icon: "🛣️", description: "Potholes, cracks, signage" },
  { value: "public-order",      label: "Public Order",      icon: "🛡️", description: "Safety & peace concerns" },
  { value: "sanitation",        label: "Sanitation",        icon: "🧹", description: "Waste, drainage, cleanliness" },
  { value: "utilities",         label: "Utilities",         icon: "💡", description: "Water, power, internet" },
  { value: "flooding",          label: "Flooding",          icon: "🌊", description: "Flood-prone areas" },
  { value: "noise-complaint",   label: "Noise Complaint",   icon: "🔊", description: "Excessive noise" },
  { value: "stray-animals",     label: "Stray Animals",     icon: "🐕", description: "Animal control" },
  { value: "illegal-dumping",   label: "Illegal Dumping",   icon: "🚮", description: "Unauthorized waste disposal" },
  { value: "other",             label: "Other",             icon: "📋", description: "Anything else" },
];

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const CitizenConcernsService = () => {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => photoPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [photoPreviews]);

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
    const path = `${userId}/concerns/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: false });
    if (error) { console.error("Upload error:", error); return null; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  const handleSubmit = async () => {
    if (!category || !subject || !details) {
      toast.error("Please fill in all required fields (Category, Subject, Details)");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const url = await uploadPhoto(photo, session.user.id);
        if (url) photoUrls.push(url);
      }

      // Build rich description
      const descParts = [
        `Category: ${CATEGORIES.find((c) => c.value === category)?.label ?? category}`,
        `Subject: ${subject}`,
        location ? `Location: ${location}` : "",
        contactNumber ? `Contact Number: ${contactNumber}` : "",
        `Email Address: ${email}`,
        `Details: ${details}`,
        ...photoUrls.map((url, i) => `Photo ${i + 1}: [photo]${url}`),
      ].filter(Boolean);

      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session.user.id,
        subject,
        description: descParts.join("\n\n"),
        category,
        location: location || "",
        status: "pending",
      }).select();

      if (error) throw error;

      // Email notification (non-blocking)
      try {
        await openEmailRequest("New Citizen Concern Submitted", [
          `From: ${session.user.email}`,
          `Category: ${category}`,
          `Subject: ${subject}`,
          `Location: ${location || "Not specified"}`,
          `Details: ${details}`,
        ]);
      } catch (emailError) {
        console.warn("Email notification failed, but concern was submitted:", emailError);
      }

      const orderId = data?.[0]?.id ? generateOrderId(data[0].id, new Date().toISOString()) : null;
      toast.success(`Your concern has been submitted! Order ID: ${orderId}`);

      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.user?.id) {
        await createNotification(s.user.id, "Concern Submitted", `Your concern "${subject}" has been submitted and is under review.`, "success");
      }

      // Reset form
      setCategory("");
      setSubject("");
      setLocation("");
      setDetails("");
      setContactNumber("");
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error submitting concern:", errorMsg, error);
      toast.error(`Failed to submit concern: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = CATEGORIES.find((c) => c.value === category);
  const charsLeft = 1000 - details.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-civic-blue/10 mb-4">
          <MessageSquare className="h-8 w-8 text-civic-blue" />
        </div>
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">Citizen Concerns</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Report issues in your community. Our team reviews every submission and will keep you updated.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-civic-blue" />
              Submit a Concern
            </CardTitle>
            <CardDescription>Fill in the details below. Fields marked <span className="text-destructive">*</span> are required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {/* Category picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="concern-title" className="flex items-center gap-1">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="concern-title"
                placeholder="e.g. Broken street lamp on Rizal Ave"
                value={subject}
                maxLength={120}
                onChange={(e) => setSubject(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">A short summary of the issue (max 120 characters)</p>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="concern-location" className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Location
              </Label>
              <Input
                id="concern-location"
                placeholder="e.g. Corner Rizal Ave & Bonifacio St, Brgy. 1"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Contact & Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="concern-contact">Contact Number</Label>
                <Input
                  id="concern-contact"
                  placeholder="09XX-XXX-XXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="concern-email">Email</Label>
                <Input
                  id="concern-email"
                  value={email}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5">
              <Label htmlFor="concern-details" className="flex items-center gap-1">
                Details <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="concern-details"
                placeholder="Describe the issue in detail — what, when, and how it affects the community..."
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

            {/* Photo upload */}
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
                <label
                  htmlFor="concern-photos"
                  className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-4 cursor-pointer text-sm text-muted-foreground hover:border-civic-blue/50 hover:bg-civic-blue/5 transition"
                >
                  <Upload className="h-4 w-4" />
                  Click or drag to upload photos
                  <input
                    id="concern-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => handlePhotos(e.target.files)}
                  />
                </label>
              )}
            </div>

            {/* Info tip */}
            <div className="flex gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Your concern will be reviewed within 24–48 hours. You'll receive a notification when there's an update.</p>
            </div>

            {/* Submit */}
            <Button className="w-full h-11 text-base" variant="civic" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Concern
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};