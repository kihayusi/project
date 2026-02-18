import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Clock, Upload, Truck, CheckCircle2, Loader2 } from "lucide-react";
import { openEmailRequest } from "@/lib/email";
import { supabase } from "@/integrations/supabase/client";

export const DocumentRequestsService = () => {
  const [documentType, setDocumentType] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateRef, setDateRef] = useState("");
  const [placeOfRegistration, setPlaceOfRegistration] = useState("");
  const [relationship, setRelationship] = useState("");
  const [purpose, setPurpose] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [validId, setValidId] = useState<File | null>(null);
  const [authLetter, setAuthLetter] = useState<File | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const navigate = useNavigate();

  const getDateLabel = (type: string) => {
    if (type === "marriage-certificate") return "Date of Marriage";
    if (type === "death-certificate") return "Date of Death";
    return "Date of Birth";
  };

  const showDateField = (type: string) =>
    ["birth-certificate", "marriage-certificate", "death-certificate"].includes(type);

  const fetchMyRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase
      .from("citizen_concerns")
      .select("*")
      .eq("user_id", session.user.id)
      .like("subject", "Document Request:%")
      .order("created_at", { ascending: false })
      .limit(5);
    setMyRequests(data || []);
  };

  useEffect(() => {
    fetchMyRequests();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  const handleSubmit = async () => {
    if (!documentType || !fullName || !purpose || !contactNumber || !email || !deliveryMethod) {
      alert("Please fill in all required fields including delivery method");
      return;
    }
    if (deliveryMethod === "home-delivery" && !deliveryAddress) {
      alert("Please enter your delivery address");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    try {
      const description = [
        `Full Name of Document Owner: ${fullName}`,
        documentType && showDateField(documentType) ? `${getDateLabel(documentType)}: ${dateRef || "N/A"}` : "",
        `Place of Registration: ${placeOfRegistration || "N/A"}`,
        `Relationship to Owner: ${relationship || "N/A"}`,
        `Purpose of Request: ${purpose}`,
        `Contact Number: ${contactNumber}`,
        `Email Address: ${email}`,
        validId ? `Valid ID: ${validId.name}` : "",
        authLetter ? `Authorization Letter: ${authLetter.name}` : "",
        `Delivery Method: ${deliveryMethod === "home-delivery" ? "Home Delivery" : "Pickup at City Hall"}`,
        deliveryMethod === "home-delivery" ? `Delivery Address: ${deliveryAddress}` : "",
      ].filter(Boolean).join("\n\n");

      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session.user.id,
        subject: `Document Request: ${documentType}`,
        description,
        category: documentType,
        status: "pending",
      }).select();

      if (error) throw error;

      try {
        await openEmailRequest("New Document Request", [
          `From: ${session.user.email}`,
          `Document Type: ${documentType}`,
          `Full Name: ${fullName}`,
          `Purpose: ${purpose}`,
          `Contact: ${contactNumber}`,
        ]);
      } catch (emailError) {
        console.warn("Email notification failed, but request was submitted:", emailError);
      }

      alert("Your document request has been submitted successfully!");
      setDocumentType("");
      setFullName("");
      setDateRef("");
      setPlaceOfRegistration("");
      setRelationship("");
      setPurpose("");
      setContactNumber("");
      setValidId(null);
      setAuthLetter(null);
      setDeliveryMethod("");
      setDeliveryAddress("");
      fetchMyRequests();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error submitting request:", errorMsg, error);
      alert(`Failed to submit request: ${errorMsg}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">Document Requests</h2>
        <p className="text-muted-foreground">Apply for permits, certificates, and other official documents</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request a Document</CardTitle>
            <CardDescription>Fill in the details below to submit your request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Type */}
            <div>
              <Label htmlFor="document-type">Document Type <span className="text-destructive">*</span></Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birth-certificate">Birth Certificate</SelectItem>
                  <SelectItem value="marriage-certificate">Marriage Certificate</SelectItem>
                  <SelectItem value="death-certificate">Death Certificate</SelectItem>
                  <SelectItem value="barangay-clearance">Barangay Clearance</SelectItem>
                  <SelectItem value="business-permit">Business Permit</SelectItem>
                  <SelectItem value="residence-certificate">Certificate of Residency</SelectItem>
                  <SelectItem value="cedula">Cedula (Community Tax Certificate)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="full-name">Full Name of Document Owner <span className="text-destructive">*</span></Label>
              <Input
                id="full-name"
                placeholder="e.g. Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Date reference - dynamic based on document type */}
            {documentType && showDateField(documentType) && (
            <div>
              <Label htmlFor="date-ref">{getDateLabel(documentType)}</Label>
              <Input
                id="date-ref"
                type="date"
                value={dateRef}
                onChange={(e) => setDateRef(e.target.value)}
              />
            </div>
            )}

            {/* Place of Registration */}
            <div>
              <Label htmlFor="place-reg">Place of Registration</Label>
              <Input
                id="place-reg"
                placeholder="e.g. San Carlos City, Pangasinan"
                value={placeOfRegistration}
                onChange={(e) => setPlaceOfRegistration(e.target.value)}
              />
            </div>

            {/* Relationship */}
            <div>
              <Label htmlFor="relationship">Relationship to Owner</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="legal-representative">Legal Representative</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Purpose */}
            <div>
              <Label htmlFor="purpose">Purpose of Request <span className="text-destructive">*</span></Label>
              <Textarea
                id="purpose"
                placeholder="e.g. For employment, school enrollment, travel abroad..."
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            {/* Contact Number */}
            <div>
              <Label htmlFor="contact">Contact Number <span className="text-destructive">*</span></Label>
              <Input
                id="contact"
                placeholder="e.g. 09XX-XXX-XXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="req-email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="req-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Valid ID upload */}
            <div>
              <Label htmlFor="valid-id">Upload Valid ID <span className="text-destructive">*</span></Label>
              <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-muted/30">
                <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <label htmlFor="valid-id" className="flex-1 text-sm text-muted-foreground cursor-pointer">
                  {validId ? validId.name : "Click to upload (JPG, PNG, PDF)"}
                </label>
                <input
                  id="valid-id"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="sr-only"
                  onChange={(e) => setValidId(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Authorization Letter upload */}
            <div>
              <Label htmlFor="auth-letter">Upload Authorization Letter <span className="text-xs text-muted-foreground">(if applicable)</span></Label>
              <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-muted/30">
                <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <label htmlFor="auth-letter" className="flex-1 text-sm text-muted-foreground cursor-pointer">
                  {authLetter ? authLetter.name : "Click to upload (JPG, PNG, PDF)"}
                </label>
                <input
                  id="auth-letter"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="sr-only"
                  onChange={(e) => setAuthLetter(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Delivery Method */}
            <div>
              <Label htmlFor="delivery-method">Delivery Method <span className="text-destructive">*</span></Label>
              <Select value={deliveryMethod} onValueChange={(v) => { setDeliveryMethod(v); setDeliveryAddress(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="How would you like to receive the document?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup at City Hall</SelectItem>
                  <SelectItem value="home-delivery">Home Delivery (via courier)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Address — shown only for home delivery */}
            {deliveryMethod === "home-delivery" && (
              <div>
                <Label htmlFor="delivery-address">Delivery Address <span className="text-destructive">*</span></Label>
                <Textarea
                  id="delivery-address"
                  placeholder="Enter your complete address for delivery..."
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            )}

            <Button className="w-full" variant="civic" onClick={handleSubmit}>
              Submit Request
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Track Your Requests</CardTitle>
            <CardDescription>Check the status of your applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No requests submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((r) => {
                  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                    pending:           { label: "Pending",            color: "text-muted-foreground", icon: <Clock className="h-3.5 w-3.5" /> },
                    processing:        { label: "Processing",         color: "text-amber-600",         icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
                    ready_for_pickup:  { label: "Ready for Pickup",   color: "text-civic-blue",        icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                    out_for_delivery:  { label: "Out for Delivery",   color: "text-purple-600",        icon: <Truck className="h-3.5 w-3.5" /> },
                    completed:         { label: "Completed",          color: "text-civic-green",       icon: <Download className="h-3.5 w-3.5" /> },
                    resolved:          { label: "Completed",          color: "text-civic-green",       icon: <Download className="h-3.5 w-3.5" /> },
                  };
                  const s = statusConfig[r.status] ?? { label: r.status, color: "text-muted-foreground", icon: <Clock className="h-3.5 w-3.5" /> };
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {r.subject.replace("Document Request: ", "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                        {r.admin_response && (
                          <p className="text-xs text-muted-foreground mt-1 italic">Note: {r.admin_response}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${s.color}`}>
                        {s.icon}
                        <span>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button variant="civic-outline" className="w-full" onClick={() => { window.location.href = "/"; setTimeout(() => { document.getElementById("my-requests")?.scrollIntoView({ behavior: "smooth" }); }, 300); }}>View All Requests</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};