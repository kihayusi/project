import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  FileText,
  MapPin,
  CreditCard,
  Receipt,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { openEmailRequest } from "@/lib/email";
import { createNotification } from "@/services/notifications";
import { generateOrderId } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Requirement {
  label: string;
  note?: string;
}

interface Step {
  number: number;
  emoji: string;
  title: string;
  subtitle: string;
  location?: string;
  requirements?: Requirement[];
  additionalRequirements?: { heading: string; items: Requirement[] };
  fee?: string;
  deliverables?: string[];
  note?: string;
}

const steps: Step[] = [
  {
    number: 1,
    emoji: "🥇",
    title: "Register Your Business Name",
    subtitle: "Choose a registration agency based on your business type",
    requirements: [
      { label: "Sole Proprietorship", note: "Register at DTI via BNRS website — choose a business name and pay ₱200–₱2,000 (scope-dependent)" },
      { label: "Partnership / Corporation", note: "Register at Securities and Exchange Commission (SEC)" },
    ],
    fee: "₱200 – ₱2,000",
  },
  {
    number: 2,
    emoji: "🥈",
    title: "Get Barangay Clearance",
    subtitle: "Visit your Barangay Hall",
    location: "Barangay Hall",
    requirements: [
      { label: "DTI or SEC Certificate" },
      { label: "Valid ID" },
      { label: "Lease Contract", note: "if renting" },
      { label: "Cedula" },
    ],
    fee: "₱300 – ₱1,000 (depends on barangay)",
  },
  {
    number: 3,
    emoji: "🥉",
    title: "Get Mayor's Permit (Business Permit)",
    subtitle: "Apply at City / Municipal Hall — BPLO",
    location: "City Hall — Business Permits & Licensing Office (BPLO)",
    requirements: [
      { label: "DTI / SEC Certificate" },
      { label: "Barangay Clearance" },
      { label: "Lease Contract or Land Title" },
      { label: "Zoning Clearance" },
      { label: "Cedula" },
      { label: "Valid ID" },
    ],
    additionalRequirements: {
      heading: "Additional (if applicable)",
      items: [
        { label: "Fire Safety Inspection", note: "from Bureau of Fire Protection" },
        { label: "Sanitary Permit", note: "for food businesses" },
      ],
    },
    fee: "₱3,000 – ₱15,000+",
  },
  {
    number: 4,
    emoji: "🏦",
    title: "Register with BIR",
    subtitle: "Bureau of Internal Revenue",
    location: "Bureau of Internal Revenue (BIR)",
    requirements: [
      { label: "DTI / SEC Certificate" },
      { label: "Mayor's Permit" },
      { label: "Valid ID" },
      { label: "Lease Contract" },
      { label: "Books of Accounts" },
    ],
    deliverables: [
      "Certificate of Registration (Form 2303)",
      "Authority to Print (for receipts)",
      "Official Receipts",
    ],
  },
  {
    number: 5,
    emoji: "👥",
    title: "Register Employees (If Applicable)",
    subtitle: "Mandatory for businesses with employees",
    requirements: [
      { label: "Social Security System (SSS)" },
      { label: "PhilHealth" },
      { label: "Home Development Mutual Fund (Pag-IBIG)" },
    ],
    note: "You may register at each agency's office or online portal.",
  },
];

/* ------------------------------------------------------------------ */
/*  Step Card Component                                                */
/* ------------------------------------------------------------------ */

const StepCard = ({ step, isLast }: { step: Step; isLast: boolean }) => {
  const [expanded, setExpanded] = useState(step.number <= 2);

  /* colour band per step */
  const colours: Record<number, string> = {
    1: "border-l-blue-500",
    2: "border-l-amber-500",
    3: "border-l-emerald-500",
    4: "border-l-violet-500",
    5: "border-l-rose-500",
  };

  return (
    <div className="relative">
      {/* vertical connector line */}
      {!isLast && (
        <div className="absolute left-6 top-[68px] bottom-0 w-0.5 bg-gray-200 z-0" />
      )}

      <Card
        className={`relative z-10 cursor-pointer border-l-4 ${colours[step.number] ?? "border-l-gray-400"} transition-shadow hover:shadow-md`}
        onClick={() => setExpanded((v) => !v)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{step.emoji}</span>
              <div>
                <CardTitle className="text-base md:text-lg leading-tight">
                  STEP {step.number}: {step.title}
                </CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{step.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step.fee && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                  <CreditCard className="h-3 w-3 mr-1" />
                  {step.fee}
                </Badge>
              )}
              {expanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0 space-y-3 text-sm">
            {/* Location */}
            {step.location && (
              <div className="flex items-start gap-2 bg-blue-50 text-blue-800 rounded-lg p-2.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="font-medium">{step.location}</span>
              </div>
            )}

            {/* Fee badge on mobile */}
            {step.fee && (
              <div className="flex sm:hidden items-center gap-2 bg-amber-50 text-amber-800 rounded-lg p-2.5">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span className="font-medium">Estimated Fee: {step.fee}</span>
              </div>
            )}

            {/* Requirements */}
            {step.requirements && step.requirements.length > 0 && (
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  <FileText className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                  Requirements
                </p>
                <ul className="space-y-1.5 ml-1">
                  {step.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>
                        {req.label}
                        {req.note && (
                          <span className="text-muted-foreground"> — {req.note}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional requirements */}
            {step.additionalRequirements && (
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  <AlertCircle className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                  {step.additionalRequirements.heading}
                </p>
                <ul className="space-y-1.5 ml-1">
                  {step.additionalRequirements.items.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>
                        {req.label}
                        {req.note && (
                          <span className="text-muted-foreground"> — {req.note}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deliverables */}
            {step.deliverables && (
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  <Receipt className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                  You Will Receive
                </p>
                <ul className="space-y-1.5 ml-1">
                  {step.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extra note */}
            {step.note && (
              <p className="text-muted-foreground italic text-xs bg-gray-50 rounded-lg p-2.5">
                💡 {step.note}
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export const BusinessServicesService = () => {
  const navigate = useNavigate();

  /* ---- New Business form state ---- */
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessNature, setBusinessNature] = useState("");
  const [capitalInvestment, setCapitalInvestment] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [nbUploads, setNbUploads] = useState<Record<string, File | null>>({
    dtiSec: null,
    validId: null,
    leaseContract: null,
    cedula: null,
    zoningClearance: null,
  });
  const [nbSubmitting, setNbSubmitting] = useState(false);

  /* ---- Renewal form state ---- */
  const [renewalPermitNo, setRenewalPermitNo] = useState("");
  const [renewalBusinessName, setRenewalBusinessName] = useState("");
  const [renewalOwner, setRenewalOwner] = useState("");
  const [renewalAddress, setRenewalAddress] = useState("");
  const [renewalContact, setRenewalContact] = useState("");
  const [rnUploads, setRnUploads] = useState<Record<string, File | null>>({
    prevPermit: null,
    barangayClearance: null,
    cedula: null,
    fireSafety: null,
    sanitaryPermit: null,
    birCor: null,
  });
  const [rnSubmitting, setRnSubmitting] = useState(false);

  /* ---- Helpers ---- */
  const requireAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth"); return null; }
    return session;
  };

  const handleFileChange = (
    setter: React.Dispatch<React.SetStateAction<Record<string, File | null>>>,
    key: string,
    file: File | null,
  ) => setter((prev) => ({ ...prev, [key]: file }));

  /* ---- Submit: New Business ---- */
  const handleNewBusiness = async () => {
    if (!businessName || !businessType || !ownerName || !businessAddress || !contactNumber) {
      toast.error("Please fill in all required fields");
      return;
    }
    const session = await requireAuth();
    if (!session) return;
    setNbSubmitting(true);
    try {
      const description = [
        `Business Type: ${businessType}`,
        `Owner Name: ${ownerName}`,
        `Business Address: ${businessAddress}`,
        businessNature ? `Nature of Business: ${businessNature}` : "",
        capitalInvestment ? `Capital Investment: ${capitalInvestment}` : "",
        `Contact Number: ${contactNumber}`,
        emailAddress ? `Email: ${emailAddress}` : "",
        `\nUploaded Documents: ${Object.entries(nbUploads).filter(([, f]) => f).map(([k]) => k).join(", ") || "None"}`,
      ].filter(Boolean).join("\n\n");

      const { data: insertedData, error } = await supabase.from("citizen_concerns").insert({
        user_id: session.user.id,
        subject: `New Business Registration: ${businessName}`,
        description,
        category: "Business Services",
        status: "pending",
      } as any).select();
      if (error) throw error;

      const orderId = insertedData?.[0]?.id ? generateOrderId(insertedData[0].id, new Date().toISOString()) : null;

      try {
        await openEmailRequest("New Business Registration", [
          `From: ${session.user.email}`,
          `Business Name: ${businessName}`,
          `Type: ${businessType}`,
          `Owner: ${ownerName}`,
          `Address: ${businessAddress}`,
        ]);
      } catch { /* email non-blocking */ }

      toast.success(`New business registration submitted! Order ID: ${orderId}`);
      await createNotification(session.user.id, "Registration Submitted", `Your new business registration for "${businessName}" has been submitted.`, "success");
      setBusinessName(""); setBusinessType(""); setOwnerName("");
      setBusinessAddress(""); setBusinessNature(""); setCapitalInvestment("");
      setContactNumber(""); setEmailAddress("");
      setNbUploads({ dtiSec: null, validId: null, leaseContract: null, cedula: null, zoningClearance: null });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setNbSubmitting(false);
    }
  };

  /* ---- Submit: Renewal ---- */
  const handleRenewal = async () => {
    if (!renewalPermitNo || !renewalBusinessName || !renewalOwner || !renewalAddress || !renewalContact) {
      toast.error("Please fill in all required fields");
      return;
    }
    const session = await requireAuth();
    if (!session) return;
    setRnSubmitting(true);
    try {
      const description = [
        `Previous Permit No: ${renewalPermitNo}`,
        `Owner Name: ${renewalOwner}`,
        `Business Address: ${renewalAddress}`,
        `Contact Number: ${renewalContact}`,
        `\nUploaded Documents: ${Object.entries(rnUploads).filter(([, f]) => f).map(([k]) => k).join(", ") || "None"}`,
      ].filter(Boolean).join("\n\n");

      const { data: renewData, error } = await supabase.from("citizen_concerns").insert({
        user_id: session.user.id,
        subject: `Business Permit Renewal: ${renewalBusinessName}`,
        description,
        category: "Business Services",
        status: "pending",
      } as any).select();
      if (error) throw error;

      const renewOrderId = renewData?.[0]?.id ? generateOrderId(renewData[0].id, new Date().toISOString()) : null;

      try {
        await openEmailRequest("Business Permit Renewal", [
          `From: ${session.user.email}`,
          `Permit No: ${renewalPermitNo}`,
          `Business: ${renewalBusinessName}`,
          `Owner: ${renewalOwner}`,
        ]);
      } catch { /* email non-blocking */ }

      toast.success(`Permit renewal request submitted! Order ID: ${renewOrderId}`);
      await createNotification(session.user.id, "Renewal Submitted", `Your permit renewal for "${renewalBusinessName}" has been submitted.`, "success");
      setRenewalPermitNo(""); setRenewalBusinessName(""); setRenewalOwner("");
      setRenewalAddress(""); setRenewalContact("");
      setRnUploads({ prevPermit: null, barangayClearance: null, cedula: null, fireSafety: null, sanitaryPermit: null, birCor: null });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setRnSubmitting(false);
    }
  };

  /* ---- Upload row helper ---- */
  const UploadRow = ({
    label,
    fileKey,
    files,
    setFiles,
    required = false,
  }: {
    label: string;
    fileKey: string;
    files: Record<string, File | null>;
    setFiles: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
    required?: boolean;
  }) => (
    <div className="flex items-center justify-between gap-3 p-2.5 border rounded-lg bg-gray-50/50">
      <span className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <label className="cursor-pointer">
        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange(setFiles, fileKey, e.target.files?.[0] ?? null)}
        />
        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border ${
          files[fileKey] ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}>
          {files[fileKey] ? (
            <><CheckCircle2 className="h-3.5 w-3.5" /> {files[fileKey]!.name.slice(0, 20)}</>
          ) : (
            <><Upload className="h-3.5 w-3.5" /> Upload</>
          )}
        </span>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center">
        <Building className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-1">Business Services</h2>
        <p className="text-muted-foreground text-sm">Registration, permits, and renewal services</p>
      </div>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guide">📋 Step-by-Step Guide</TabsTrigger>
          <TabsTrigger value="new-business">➕ New Business</TabsTrigger>
          <TabsTrigger value="renewal">🔄 Permit Renewal</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1 — Step-by-Step Guide ===== */}
        <TabsContent value="guide" className="space-y-4 mt-4">
          {/* Processing time banner */}
          <div className="flex items-center justify-center gap-2 text-sm bg-emerald-50 text-emerald-800 rounded-xl p-3 border border-emerald-200">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Estimated Total Processing Time: 1–3 weeks</span>
            <span className="text-emerald-600">(if documents are complete)</span>
          </div>

          {/* Step cards */}
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <StepCard key={step.number} step={step} isLast={idx === steps.length - 1} />
            ))}
          </div>

          {/* Quick Tip footer */}
          <Card className="bg-blue-50/60 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Need help?</p>
                  <p>
                    Visit the <span className="font-medium">Business Permits &amp; Licensing Office (BPLO)</span> at San
                    Carlos City Hall or call the hotline for assistance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 2 — New Business Registration ===== */}
        <TabsContent value="new-business" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-civic-blue" />
                New Business Registration
              </CardTitle>
              <CardDescription>Submit your new business application online</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Business Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. Juan's Carinderia" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div>
                  <Label>Business Type <span className="text-destructive">*</span></Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="Corporation">Corporation</SelectItem>
                      <SelectItem value="Cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Owner / Authorized Representative <span className="text-destructive">*</span></Label>
                  <Input placeholder="Full name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                </div>
                <div>
                  <Label>Nature of Business</Label>
                  <Input placeholder="e.g. Food & Beverages" value={businessNature} onChange={(e) => setBusinessNature(e.target.value)} />
                </div>
              </div>

              {/* Row 3 */}
              <div>
                <Label>Business Address <span className="text-destructive">*</span></Label>
                <Input placeholder="Complete business address" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Capital Investment</Label>
                  <Input placeholder="e.g. ₱100,000" value={capitalInvestment} onChange={(e) => setCapitalInvestment(e.target.value)} />
                </div>
                <div>
                  <Label>Contact Number <span className="text-destructive">*</span></Label>
                  <Input placeholder="09XX-XXX-XXXX" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input placeholder="email@example.com" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
                </div>
              </div>

              {/* Uploads */}
              <div>
                <Label className="mb-2 block">Upload Requirements</Label>
                <div className="space-y-2">
                  <UploadRow label="DTI / SEC Certificate" fileKey="dtiSec" files={nbUploads} setFiles={setNbUploads} required />
                  <UploadRow label="Valid ID" fileKey="validId" files={nbUploads} setFiles={setNbUploads} required />
                  <UploadRow label="Lease Contract / Land Title" fileKey="leaseContract" files={nbUploads} setFiles={setNbUploads} />
                  <UploadRow label="Cedula" fileKey="cedula" files={nbUploads} setFiles={setNbUploads} />
                  <UploadRow label="Zoning Clearance" fileKey="zoningClearance" files={nbUploads} setFiles={setNbUploads} />
                </div>
              </div>

              <Button className="w-full" variant="civic" onClick={handleNewBusiness} disabled={nbSubmitting}>
                {nbSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Submit Registration"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 3 — Permit Renewal ===== */}
        <TabsContent value="renewal" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-civic-blue" />
                Business Permit Renewal
              </CardTitle>
              <CardDescription>Renew your existing business permit online</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Previous Permit Number <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. BP-2025-00123" value={renewalPermitNo} onChange={(e) => setRenewalPermitNo(e.target.value)} />
                </div>
                <div>
                  <Label>Business Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="Registered business name" value={renewalBusinessName} onChange={(e) => setRenewalBusinessName(e.target.value)} />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Owner / Authorized Representative <span className="text-destructive">*</span></Label>
                  <Input placeholder="Full name" value={renewalOwner} onChange={(e) => setRenewalOwner(e.target.value)} />
                </div>
                <div>
                  <Label>Contact Number <span className="text-destructive">*</span></Label>
                  <Input placeholder="09XX-XXX-XXXX" value={renewalContact} onChange={(e) => setRenewalContact(e.target.value)} />
                </div>
              </div>

              {/* Row 3 */}
              <div>
                <Label>Business Address <span className="text-destructive">*</span></Label>
                <Input placeholder="Complete business address" value={renewalAddress} onChange={(e) => setRenewalAddress(e.target.value)} />
              </div>

              {/* Uploads */}
              <div>
                <Label className="mb-2 block">Upload Requirements for Renewal</Label>
                <div className="space-y-2">
                  <UploadRow label="Previous Business Permit" fileKey="prevPermit" files={rnUploads} setFiles={setRnUploads} required />
                  <UploadRow label="Barangay Clearance" fileKey="barangayClearance" files={rnUploads} setFiles={setRnUploads} required />
                  <UploadRow label="Cedula" fileKey="cedula" files={rnUploads} setFiles={setRnUploads} />
                  <UploadRow label="Fire Safety Inspection" fileKey="fireSafety" files={rnUploads} setFiles={setRnUploads} />
                  <UploadRow label="Sanitary Permit" fileKey="sanitaryPermit" files={rnUploads} setFiles={setRnUploads} />
                  <UploadRow label="BIR Certificate of Registration" fileKey="birCor" files={rnUploads} setFiles={setRnUploads} />
                </div>
              </div>

              <Button className="w-full" variant="civic" onClick={handleRenewal} disabled={rnSubmitting}>
                {rnSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Submit Renewal Request"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};