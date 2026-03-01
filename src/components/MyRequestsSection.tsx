import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, MessageSquare, Building, Heart, CheckCircle2, Clock, Loader2, ClipboardCheck, CircleDot, Truck, Package, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateOrderId } from "@/lib/utils";
import { toast } from "sonner";

export const MyRequestsSection = () => {
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("id");
  const tabParam = searchParams.get("tab");
  const highlightRef = useRef<HTMLDivElement>(null);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCancelRequest = async (id: string) => {
    try {
      const { error } = await supabase.from("citizen_concerns").delete().eq("id", id);
      if (error) throw error;
      toast.success("Request cancelled successfully.");
      setAllRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel request.");
    }
  };

  const handleOpenEdit = (request: any) => {
    setEditingRequest(request);
    setEditSubject(request.subject || "");
    setEditDescription(request.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("citizen_concerns").update({
        subject: editSubject,
        description: editDescription,
      }).eq("id", editingRequest.id);
      if (error) throw error;
      toast.success("Request updated successfully.");
      setAllRequests((prev) => prev.map((r) =>
        r.id === editingRequest.id ? { ...r, subject: editSubject, description: editDescription } : r
      ));
      setEditingRequest(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update request.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchUserConcerns();
  }, []);

  const fetchUserConcerns = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("citizen_concerns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching concerns:", error);
      } else {
        setAllRequests(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to highlighted request after render
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightId, loading]);

  const documentRequests = allRequests.filter((r) => r.subject?.startsWith("Document Request:"));
  const businessRequests = allRequests.filter((r) => r.subject?.startsWith("Business"));
  const healthRequests = allRequests.filter((r) => r.subject?.startsWith("Health") || r.subject?.startsWith("Vaccination") || r.subject?.startsWith("Medical"));
  const concerns = allRequests.filter(
    (r) =>
      !r.subject?.startsWith("Document Request:") &&
      !r.subject?.startsWith("Business") &&
      !r.subject?.startsWith("Health") &&
      !r.subject?.startsWith("Vaccination") &&
      !r.subject?.startsWith("Medical")
  );

  const formatStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

  const RequestCard = ({ request }: { request: any }) => {
    const isHighlighted = request.id === highlightId;
    const isDocument = request.subject?.startsWith("Document Request:");
    const displayTitle = isDocument
      ? request.subject.replace("Document Request: ", "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
      : (request.subject || request.title);
    const Icon = isDocument ? FileText : MessageSquare;
    const orderId = generateOrderId(request.id, request.created_at);

    // Parse delivery method from description (robust: try \n\n and \n splits, also regex)
    const descText = request.description || "";
    const deliveryMatch = descText.match(/Delivery Method:\s*(.*)/i);
    const delivery = deliveryMatch?.[1]?.includes("Home Delivery") ? "Home Delivery" : "Pickup";

    // Timeline steps — Shopee-style, context-aware per request type
    const steps = isDocument
      ? [
          { key: "submitted", label: "Request Submitted", desc: `Your ${displayTitle} request has been received`, icon: <ClipboardCheck className="h-4 w-4" /> },
          { key: "processing", label: "Processing", desc: "Your request is being reviewed by the office", icon: <Loader2 className="h-4 w-4" /> },
          { key: "ready", label: delivery === "Home Delivery" ? "Out for Delivery" : "Ready for Pickup", desc: delivery === "Home Delivery" ? "Your document is on its way" : "You can claim your document at City Hall", icon: delivery === "Home Delivery" ? <Truck className="h-4 w-4" /> : <Package className="h-4 w-4" /> },
          { key: "completed", label: "Completed", desc: "Your document has been released", icon: <CheckCircle2 className="h-4 w-4" /> },
        ]
      : [
          { key: "submitted", label: "Report Submitted", desc: `Your concern "${displayTitle}" has been received`, icon: <ClipboardCheck className="h-4 w-4" /> },
          { key: "processing", label: "Under Review", desc: "Your concern is being reviewed by the assigned office", icon: <Loader2 className="h-4 w-4" /> },
          { key: "action", label: "Action Taken", desc: "The office has taken action to address your concern", icon: <Package className="h-4 w-4" /> },
          { key: "completed", label: "Resolved", desc: "Your concern has been resolved", icon: <CheckCircle2 className="h-4 w-4" /> },
        ];

    // Map status to active step index
    const statusStep: Record<string, number> = { pending: 0, in_progress: 1, processing: 1, ready_for_pickup: 2, out_for_delivery: 2, completed: 3, resolved: 3 };
    const activeStep = statusStep[request.status] ?? 0;

    // Status badge color
    const statusStyle: Record<string, { label: string; badgeClass: string }> = {
      pending:          { label: "Pending",          badgeClass: "bg-amber-100 text-amber-700 border-amber-200" },
      in_progress:      { label: "In Progress",     badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
      processing:       { label: "Processing",       badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
      ready_for_pickup: { label: "Ready for Pickup", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      out_for_delivery: { label: "Out for Delivery", badgeClass: "bg-purple-100 text-purple-700 border-purple-200" },
      completed:        { label: "Completed",        badgeClass: "bg-green-100 text-green-700 border-green-200" },
      resolved:         { label: "Completed",        badgeClass: "bg-green-100 text-green-700 border-green-200" },
    };
    const st = statusStyle[request.status] ?? { label: request.status, badgeClass: "bg-muted text-muted-foreground" };

    return (
      <div
        ref={isHighlighted ? highlightRef : undefined}
        className={`rounded-xl border bg-white p-4 space-y-4 shadow-sm mb-4 transition-all duration-500 ${
          isHighlighted ? "ring-2 ring-civic-blue ring-offset-2 bg-blue-50/30" : ""
        }`}
      >
        {/* Top: title + status + date */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-civic-blue/10 p-2">
              <Icon className="h-5 w-5 text-civic-blue" />
            </div>
            <div>
              <p className="font-semibold text-sm">{displayTitle}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono font-medium text-civic-blue bg-civic-blue/10 px-1.5 py-0.5 rounded">{orderId}</span>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold border ${st.badgeClass}`}>
            {st.label}
          </Badge>
        </div>

        {/* Timeline stepper — vertical like Shopee */}
        <div className="pl-2">
          {steps.map((step, i) => {
            const isDone = i < activeStep;
            const isCurrent = i === activeStep;
            const isFuture = i > activeStep;

            return (
              <div key={step.key} className="flex gap-3">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center h-7 w-7 rounded-full border-2 flex-shrink-0 ${
                    isCurrent ? "border-civic-blue bg-civic-blue text-white" :
                    isDone ? "border-green-500 bg-green-500 text-white" :
                    "border-gray-200 bg-white text-gray-300"
                  }`}>
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                     isCurrent ? step.icon :
                     <CircleDot className="h-3.5 w-3.5" />}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[24px] ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>

                {/* Label + description */}
                <div className={`pb-4 ${isFuture ? "opacity-40" : ""}`}>
                  <p className={`text-sm font-medium leading-7 ${isCurrent ? "text-civic-blue" : isDone ? "text-green-700" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{step.desc}</p>
                  {isCurrent && i === 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {isDocument ? `${delivery} · ` : ""}Order ID: {orderId}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin response */}
        {request.admin_response && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-0.5">Admin Note</p>
            <p className="text-sm text-blue-900">{request.admin_response}</p>
          </div>
        )}

        {/* Cancel / Edit — only when still pending */}
        {request.status === "pending" && (
          <div className="flex items-center gap-2 pt-1 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => handleOpenEdit(request)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Details
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  <X className="h-3.5 w-3.5" />
                  Cancel Request
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently cancel and remove your request <strong>{orderId}</strong> ({displayTitle}). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Request</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleCancelRequest(request.id)}
                  >
                    Yes, Cancel Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="h-8 w-8 animate-spin text-civic-blue" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="my-requests" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-civic-gray-dark mb-4">
            My Requests
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Track all your submitted requests and applications in one place
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue={tabParam || "concerns"} className="w-full" onValueChange={(v) => {
            // Clear highlight when switching tabs manually
            const params = new URLSearchParams(searchParams);
            params.set("tab", v);
            params.delete("id");
            setSearchParams(params, { replace: true });
          }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="concerns">Concerns</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
            </TabsList>

            <TabsContent value="concerns" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Citizen Concerns
                  </CardTitle>
                  <CardDescription>
                    Monitor the status of your reported issues and suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {concerns.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No concerns submitted yet</p>
                    </div>
                  ) : (
                    concerns.map((concern) => (
                      <RequestCard key={concern.id} request={concern} />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Requests
                  </CardTitle>
                  <CardDescription>
                    Track your permit applications, certificates, and other document requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documentRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No document requests submitted yet</p>
                    </div>
                  ) : (
                    documentRequests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Business Services
                  </CardTitle>
                  <CardDescription>
                    Track your business registration and permit applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {businessRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No business service requests submitted yet</p>
                    </div>
                  ) : (
                    businessRequests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Health Services
                  </CardTitle>
                  <CardDescription>
                    View your health service requests and vaccination records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {healthRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No health service requests submitted yet</p>
                    </div>
                  ) : (
                    healthRequests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Request Dialog */}
      <Dialog open={!!editingRequest} onOpenChange={(open) => { if (!open) setEditingRequest(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Request Details</DialogTitle>
          </DialogHeader>
          {editingRequest && (() => {
            const isDoc = editingRequest.subject?.startsWith("Document Request:");
            const orderId = generateOrderId(editingRequest.id, editingRequest.created_at);

            // Parse description lines for a friendly editor
            const lines = editDescription.split(/\n\n|\n/).filter(Boolean);

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono text-civic-blue bg-civic-blue/10 px-1.5 py-0.5 rounded text-xs">{orderId}</span>
                  <span>{isDoc ? editingRequest.subject.replace("Document Request: ", "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : editingRequest.subject}</span>
                </div>

                <div>
                  <Label className="text-sm font-medium">Request Details</Label>
                  <p className="text-xs text-muted-foreground mb-2">Edit the information you submitted. Each field should be on its own line.</p>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Enter your request details..."
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setEditingRequest(null)}>Cancel</Button>
                  <Button variant="civic" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </section>
  );
};