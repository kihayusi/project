import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Smartphone, Upload, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// GCash brand color
const GCASH_BLUE = "#007DFE";

// Fee schedule for document types (in PHP)
export const SERVICE_FEES: Record<string, { label: string; fee: number }> = {
  "birth-certificate": { label: "Birth Certificate", fee: 155 },
  "marriage-certificate": { label: "Marriage Certificate", fee: 155 },
  "death-certificate": { label: "Death Certificate", fee: 155 },
  "residence-certificate": { label: "Certificate of Residency", fee: 100 },
  "cedula": { label: "Cedula (Community Tax Certificate)", fee: 35 },
};

// GCash receiving details — update these to match your city's GCash account
const GCASH_RECEIVER = {
  name: "San Carlos City Hall",
  number: "0917-XXX-XXXX", // Replace with actual GCash number
};

interface GCashPaymentProps {
  /** The service / document type key from SERVICE_FEES */
  serviceType: string;
  /** Optional custom amount override */
  amount?: number;
  /** Called when the user successfully submits proof of payment */
  onPaymentSubmitted: (paymentInfo: {
    referenceNumber: string;
    gcashNumber: string;
    amount: number;
    proofFileName: string | null;
    proofUrl: string | null;
  }) => void;
  /** Called when the user cancels */
  onCancel?: () => void;
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
}

export const GCashPayment = ({
  serviceType,
  amount: customAmount,
  onPaymentSubmitted,
  onCancel,
  open,
  onOpenChange,
}: GCashPaymentProps) => {
  const [step, setStep] = useState<"instructions" | "confirm">("instructions");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const feeInfo = SERVICE_FEES[serviceType];
  const amount = customAmount ?? feeInfo?.fee ?? 0;
  const label = feeInfo?.label ?? serviceType;

  const resetForm = () => {
    setStep("instructions");
    setReferenceNumber("");
    setGcashNumber("");
    setProofFile(null);
    setSubmitting(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmitProof = async () => {
    if (!referenceNumber.trim()) {
      toast.error("Please enter the GCash reference number");
      return;
    }
    if (!gcashNumber.trim()) {
      toast.error("Please enter your GCash number");
      return;
    }

    setSubmitting(true);
    try {
      // Upload proof screenshot to Supabase Storage if provided
      let proofUrl: string | null = null;
      if (proofFile) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const ext = proofFile.name.split(".").pop() ?? "jpg";
          const path = `${session.user.id}/payment-proof/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("uploads").upload(path, proofFile, { upsert: false });
          if (!uploadErr) {
            const { data } = supabase.storage.from("uploads").getPublicUrl(path);
            proofUrl = data?.publicUrl ?? null;
          } else {
            console.warn("Proof upload failed:", uploadErr);
          }
        }
      }

      onPaymentSubmitted({
        referenceNumber: referenceNumber.trim(),
        gcashNumber: gcashNumber.trim(),
        amount,
        proofFileName: proofFile?.name ?? null,
        proofUrl,
      });
      resetForm();
    } catch (err) {
      console.error("Payment submission error:", err);
      toast.error("Failed to submit payment details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" style={{ color: GCASH_BLUE }} />
            GCash Payment
          </DialogTitle>
          <DialogDescription>
            Pay for <span className="font-semibold">{label}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Fee summary */}
        <Card className="border-2" style={{ borderColor: GCASH_BLUE }}>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-3xl font-bold" style={{ color: GCASH_BLUE }}>
              ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
            <Badge variant="outline" className="mt-2">{label}</Badge>
          </CardContent>
        </Card>

        {step === "instructions" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 space-y-2 text-sm">
              <p className="font-semibold" style={{ color: GCASH_BLUE }}>
                How to pay via GCash:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open your <strong>GCash app</strong></li>
                <li>
                  Tap <strong>"Send Money"</strong> and enter:
                  <div className="mt-1 ml-4 font-mono text-xs bg-white rounded px-2 py-1 border">
                    {GCASH_RECEIVER.number}
                  </div>
                  <div className="ml-4 text-xs">{GCASH_RECEIVER.name}</div>
                </li>
                <li>
                  Enter amount:{" "}
                  <strong>₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>
                </li>
                <li>Confirm the transaction</li>
                <li>Take a <strong>screenshot</strong> of the confirmation</li>
              </ol>
            </div>

            <Button
              className="w-full text-white"
              style={{ backgroundColor: GCASH_BLUE }}
              onClick={() => setStep("confirm")}
            >
              I've Sent the Payment
            </Button>

            {onCancel && (
              <Button variant="ghost" className="w-full" onClick={() => { resetForm(); onCancel(); }}>
                Cancel
              </Button>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="gcash-ref">GCash Reference Number <span className="text-destructive">*</span></Label>
              <Input
                id="gcash-ref"
                placeholder="e.g. 1234 5678 9012"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Found in your GCash transaction confirmation
              </p>
            </div>

            <div>
              <Label htmlFor="gcash-num">Your GCash Number <span className="text-destructive">*</span></Label>
              <Input
                id="gcash-num"
                placeholder="e.g. 09XX-XXX-XXXX"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="gcash-proof">Upload Payment Screenshot <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-muted/30">
                <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <label htmlFor="gcash-proof" className="flex-1 text-sm text-muted-foreground cursor-pointer">
                  {proofFile ? proofFile.name : "Click to upload (JPG, PNG)"}
                </label>
                <input
                  id="gcash-proof"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                className="w-full text-white"
                style={{ backgroundColor: GCASH_BLUE }}
                onClick={handleSubmitProof}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Payment Proof
                  </>
                )}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("instructions")}>
                Back
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ──────────────────────────────────────────────────────────────────
   PaymentStatusBadge — small helper used elsewhere to show status
   ────────────────────────────────────────────────────────────────── */

type PaymentStatus = "pending_verification" | "verified" | "rejected" | "refunded";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending_verification: { label: "Pending Verification", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  verified: { label: "Verified", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
  refunded: { label: "Refunded", variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
};

export const PaymentStatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status as PaymentStatus] ?? STATUS_CONFIG.pending_verification;
  return (
    <Badge variant={cfg.variant} className="gap-1 text-xs">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
};
