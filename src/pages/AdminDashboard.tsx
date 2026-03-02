import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ParsedDescription } from "@/components/ParsedDescription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Megaphone, AlertTriangle, Plus, Pencil, Trash2, MessageSquare, Eye, Loader2,
  Briefcase, Activity, FileText, Truck, CheckCircle2, Copy, Pin, Search, Calendar as CalendarIcon,
  MapPin, Image, Globe, GlobeLock, LayoutGrid, List, Upload, X,
} from "lucide-react";
import { generateOrderId } from "@/lib/utils";
import { createNotification } from "@/services/notifications";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading, user } = useUserRole();
  const [activeTab, setActiveTab] = useState("overview");

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [concerns, setConcerns] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [businessReqs, setBusinessReqs] = useState<any[]>([]);
  const [healthReqs, setHealthReqs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, announcements: 0, concerns: 0, pendingConcerns: 0, resolvedConcerns: 0, pendingDocs: 0 });
  const [loading, setLoading] = useState(true);
  const hasFetched = React.useRef(false);

  // Announcement form
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", description: "", category: "General", location: "", event_date: "", image_url: "", is_pinned: false, is_published: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [annSearchQuery, setAnnSearchQuery] = useState("");
  const [annCategoryFilter, setAnnCategoryFilter] = useState("All");
  const [annViewMode, setAnnViewMode] = useState<"grid" | "table">("grid");
  const [previewAnnouncement, setPreviewAnnouncement] = useState<any>(null);

  // Concern response
  const [respondDialog, setRespondDialog] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("resolved");

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
      toast.error("You don't have admin privileges.");
    }
  }, [roleLoading, isAdmin, navigate, toast]);

  useEffect(() => {
    if (isAdmin && !hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [announcementsRes, allConcernsRes, profilesRes, paymentsRes] = await Promise.all([
        supabase.from("city_announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("citizen_concerns").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
      ]);

      if (announcementsRes.error) console.error("Announcements error:", announcementsRes.error);
      if (allConcernsRes.error) console.error("Concerns error:", allConcernsRes.error);
      if (profilesRes.error) console.error("Profiles error:", profilesRes.error);
      if (paymentsRes.error) console.error("Payments error:", paymentsRes.error);

      const anns = announcementsRes.data || [];
      const profs = profilesRes.data || [];
      const allItems = allConcernsRes.data || [];
      const pays = (paymentsRes.data as any[]) || [];
      setPayments(pays);

      const mergeProfiles = (items: any[]) => items.map((item: any) => ({
        ...item,
        profiles: profs.find((p: any) => p.user_id === item.user_id) || {}
      }));

      // Split into categories based on subject prefix and category field
      const docs = mergeProfiles(allItems.filter((c: any) => c.subject?.startsWith("Document Request:")));
      const business = mergeProfiles(allItems.filter((c: any) => c.category === "Business Services"));
      const health = mergeProfiles(allItems.filter((c: any) => c.category === "Health Services"));
      const cons = mergeProfiles(allItems.filter((c: any) =>
        !c.subject?.startsWith("Document Request:") &&
        c.category !== "Business Services" &&
        c.category !== "Health Services"
      ));

      setAnnouncements(anns);
      setConcerns(cons);
      setDocuments(docs);
      setBusinessReqs(business);
      setHealthReqs(health);
      setProfiles(profs);

      const allConcernsCount = cons.length + business.length + health.length;
      setStats({
        users: profs.length,
        announcements: anns.length,
        concerns: allConcernsCount,
        pendingConcerns: [...cons, ...business, ...health].filter((c: any) => c.status === "pending").length,
        resolvedConcerns: [...cons, ...business, ...health].filter((c: any) => c.status === "resolved").length,
        pendingDocs: docs.filter((d: any) => d.status === "pending").length,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.description) {
      toast.error("Title and description are required.");
      return;
    }

    let finalImageUrl: string | null = announcementForm.image_url || null;

    // Upload new image file if one was selected
    if (imageFile) {
      setUploadingImage(true);
      const ext = imageFile.name.split(".").pop() || "jpg";
      const filePath = `announcements/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, imageFile, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        toast.error(`Image upload failed: ${uploadError.message}`);
        setUploadingImage(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      finalImageUrl = urlData.publicUrl;
      setUploadingImage(false);
    }

    const payload = {
      title: announcementForm.title,
      description: announcementForm.description,
      category: announcementForm.category,
      location: announcementForm.location || null,
      event_date: announcementForm.event_date || null,
      image_url: finalImageUrl,
      is_pinned: announcementForm.is_pinned,
      is_published: announcementForm.is_published,
    };

    if (editingAnnouncement) {
      const { error } = await supabase.from("city_announcements").update(payload).eq("id", editingAnnouncement.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Announcement updated successfully.");
    } else {
      const { error } = await supabase.from("city_announcements").insert({ ...payload, created_by: user?.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Announcement created successfully.");
    }

    setAnnouncementDialog(false);
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: "", description: "", category: "General", location: "", event_date: "", image_url: "", is_pinned: false, is_published: true });
    setImageFile(null);
    setImagePreview(null);
    fetchAll();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("city_announcements").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement deleted.");
    fetchAll();
  };

  const handleTogglePublish = async (ann: any) => {
    const { error } = await supabase.from("city_announcements").update({ is_published: !ann.is_published }).eq("id", ann.id);
    if (error) { toast.error(error.message); return; }
    toast.success(ann.is_published ? "Announcement unpublished." : "Announcement published.");
    fetchAll();
  };

  const handleTogglePin = async (ann: any) => {
    const { error } = await supabase.from("city_announcements").update({ is_pinned: !ann.is_pinned }).eq("id", ann.id);
    if (error) { toast.error(error.message); return; }
    toast.success(ann.is_pinned ? "Announcement unpinned." : "Announcement pinned.");
    fetchAll();
  };

  const filteredAnnouncements = useMemo(() => {
    let result = announcements;
    if (annCategoryFilter !== "All") {
      result = result.filter((a: any) => a.category === annCategoryFilter);
    }
    if (annSearchQuery.trim()) {
      const q = annSearchQuery.toLowerCase();
      result = result.filter((a: any) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.location && a.location.toLowerCase().includes(q))
      );
    }
    return result;
  }, [announcements, annSearchQuery, annCategoryFilter]);

  const handleRespondConcern = async () => {
    // Build update payload — response text is optional for status-only updates
    const updatePayload: any = {
      status: responseStatus,
      responded_by: user?.id,
      responded_at: new Date().toISOString(),
    };
    if (responseText.trim()) {
      updatePayload.admin_response = responseText.trim();
    }

    console.log("[Admin] Updating concern", selectedConcern.id, "to status:", responseStatus, "user_id:", selectedConcern.user_id);

    const { error } = await supabase.from("citizen_concerns").update(updatePayload).eq("id", selectedConcern.id);

    if (error) {
      console.error("[Admin] Update failed:", error);
      toast.error(error.message);
      return;
    }

    // Send notification to the citizen
    const statusLabels: Record<string, string> = {
      pending: "Pending",
      in_progress: "In Progress",
      processing: "Processing",
      approved: "Approved",
      ready_for_pickup: "Ready for Pickup",
      out_for_delivery: "Out for Delivery",
      completed: "Completed",
      resolved: "Resolved",
    };
    const friendlyStatus = statusLabels[responseStatus] || responseStatus;
    const orderId = generateOrderId(selectedConcern.id, selectedConcern.created_at);
    const notifTitle = `Status Update: ${friendlyStatus}`;
    const notifMessage = `Your request ${orderId} ("${selectedConcern.subject}") has been updated to ${friendlyStatus}.${responseText.trim() ? ` Admin note: ${responseText.trim()}` : ""}`;

    console.log("[Admin] Sending notification to user:", selectedConcern.user_id);

    if (selectedConcern.user_id) {
      await createNotification(selectedConcern.user_id, notifTitle, notifMessage, "status_update", selectedConcern.id);
    } else {
      console.warn("[Admin] No user_id on selectedConcern — cannot send notification");
    }

    toast.success(`Status changed to ${friendlyStatus}.`);
    setRespondDialog(false);
    setSelectedConcern(null);
    setResponseText("");
    fetchAll();
  };

  const openEditAnnouncement = (ann: any) => {
    setEditingAnnouncement(ann);
    setAnnouncementForm({ title: ann.title, description: ann.description, category: ann.category, location: ann.location || "", event_date: ann.event_date || "", image_url: ann.image_url || "", is_pinned: ann.is_pinned || false, is_published: ann.is_published !== false });
    setImageFile(null);
    setImagePreview(ann.image_url || null);
    setAnnouncementDialog(true);
  };

  const openNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: "", description: "", category: "General", location: "", event_date: "", image_url: "", is_pinned: false, is_published: true });
    setImageFile(null);
    setImagePreview(null);
    setAnnouncementDialog(true);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending":          return "secondary";
      case "processing":       return "default";
      case "ready_for_pickup": return "default";
      case "out_for_delivery": return "default";
      case "completed":        return "outline";
      case "in_progress":      return "default";
      case "resolved":         return "outline";
      default:                 return "secondary";
    }
  };

  const docStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending:           "Pending",
      processing:        "Processing",
      ready_for_pickup:  "Ready for Pickup",
      out_for_delivery:  "Out for Delivery",
      completed:         "Completed",
    };
    return map[status] ?? status;
  };

  // Tab title/subtitle lookup — avoids 20 repeated conditional expressions in JSX
  const TAB_META: Record<string, { title: string; subtitle: string }> = {
    overview:      { title: "Dashboard Overview",    subtitle: "Monitor city services at a glance" },
    announcements: { title: "City Announcements",    subtitle: "Create and manage announcements" },
    concerns:      { title: "Citizen Concerns",      subtitle: "View and respond to citizen-submitted concerns" },
    documents:     { title: "Document Requests",     subtitle: "View and process document requests from citizens" },
    business:      { title: "Business Services",     subtitle: "Manage business service requests and permits" },
    health:        { title: "Health Services",        subtitle: "Track health service requests and vaccination inquiries" },
    users:         { title: "Registered Users",      subtitle: "View all registered users" },
  };

  if (roleLoading && !hasFetched.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-civic-blue" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
      <main className="ml-64 min-h-screen p-8">
        {/* Header bar */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{TAB_META[activeTab]?.title}</h1>
          <p className="text-sm text-muted-foreground">{TAB_META[activeTab]?.subtitle}</p>
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
                { label: "Resolved Concerns", value: stats.resolvedConcerns, icon: CheckCircle2, color: "text-accent" },
                { label: "Total Concerns", value: stats.concerns, icon: MessageSquare, color: "text-primary" },
                { label: "Pending Concerns", value: stats.pendingConcerns, icon: AlertTriangle, color: "text-destructive" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Concerns by Status Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Concerns by Status</CardTitle>
                  <CardDescription>Breakdown of all submitted concerns</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const allConcerns = [...concerns, ...businessReqs, ...healthReqs];
                    return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: "Pending", count: allConcerns.filter((c: any) => c.status === "pending").length },
                      { name: "In Progress", count: allConcerns.filter((c: any) => c.status === "in_progress").length },
                      { name: "Resolved", count: allConcerns.filter((c: any) => c.status === "resolved").length },
                    ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Concerns by Category Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Concerns by Category</CardTitle>
                  <CardDescription>Distribution across service categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const allConcerns = [...concerns, ...businessReqs, ...healthReqs];
                    const categoryMap: Record<string, number> = {};
                    allConcerns.forEach((c: any) => {
                      const cat = c.category || "Other";
                      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
                    });
                    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
                    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
                    return pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {pieData.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No data yet</div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Concerns over time Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Concerns Submitted (Last 7 Days)</CardTitle>
                <CardDescription>Daily submission activity</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d;
                  });
                  const allConcerns = [...concerns, ...businessReqs, ...healthReqs];
                  const dailyData = days.map((d) => {
                    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const count = allConcerns.filter((c: any) => {
                      const cd = new Date(c.created_at);
                      return cd.toDateString() === d.toDateString();
                    }).length;
                    return { name: label, count };
                  });
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Announcements */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total", value: announcements.length, icon: Megaphone, color: "text-civic-blue" },
                { label: "Published", value: announcements.filter((a: any) => a.is_published).length, icon: Globe, color: "text-green-600" },
                { label: "Pinned", value: announcements.filter((a: any) => a.is_pinned).length, icon: Pin, color: "text-orange-500" },
                { label: "Drafts", value: announcements.filter((a: any) => !a.is_published).length, icon: GlobeLock, color: "text-muted-foreground" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="flex items-center gap-3 py-4">
                    <s.icon className={`h-8 w-8 ${s.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Toolbar: search, filter, view toggle, new button */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search announcements..." className="pl-10" value={annSearchQuery} onChange={(e) => setAnnSearchQuery(e.target.value)} />
                  </div>
                  <Select value={annCategoryFilter} onValueChange={setAnnCategoryFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {["All", "General", "Event", "Health", "Public Hearing", "Festival", "Emergency", "Infrastructure"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center border rounded-md">
                    <Button variant={annViewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setAnnViewMode("grid")}>
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant={annViewMode === "table" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setAnnViewMode("table")}>
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
                    <DialogTrigger asChild>
                      <Button variant="civic" onClick={openNewAnnouncement}>
                        <Plus className="h-4 w-4 mr-1" /> New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "New Announcement"}</DialogTitle>
                        <DialogDescription>
                          {editingAnnouncement ? "Update the announcement details below." : "Fill in the details to create a new announcement."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div>
                          <Label>Title <span className="text-destructive">*</span></Label>
                          <Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="Enter announcement title" className="mt-1" />
                        </div>
                        <div>
                          <Label>Description <span className="text-destructive">*</span></Label>
                          <Textarea value={announcementForm.description} onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })} rows={5} placeholder="Write the full announcement content..." className="mt-1" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label>Category</Label>
                            <Select value={announcementForm.category} onValueChange={(v) => setAnnouncementForm({ ...announcementForm, category: v })}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["General", "Event", "Health", "Public Hearing", "Festival", "Emergency", "Infrastructure"].map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Event Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={`w-full mt-1 justify-start text-left font-normal ${!announcementForm.event_date ? 'text-muted-foreground' : ''}`}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {announcementForm.event_date ? new Date(announcementForm.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={announcementForm.event_date ? new Date(announcementForm.event_date) : undefined}
                                  onSelect={(date) => setAnnouncementForm({ ...announcementForm, event_date: date ? date.toISOString().split('T')[0] : "" })}
                                  initialFocus
                                />
                                {announcementForm.event_date && (
                                  <div className="px-3 pb-3">
                                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setAnnouncementForm({ ...announcementForm, event_date: "" })}>
                                      Clear date
                                    </Button>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input value={announcementForm.location} onChange={(e) => setAnnouncementForm({ ...announcementForm, location: e.target.value })} placeholder="e.g. City Hall" className="mt-1" />
                        </div>
                        <div>
                          <Label>Image</Label>
                          <div className="mt-1 space-y-3">
                            {(imagePreview || announcementForm.image_url) ? (
                              <div className="relative rounded-lg overflow-hidden border">
                                <img
                                  src={imagePreview || announcementForm.image_url}
                                  alt="Preview"
                                  className="w-full h-48 object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-7 w-7 rounded-full"
                                  onClick={() => {
                                    setImageFile(null);
                                    setImagePreview(null);
                                    setAnnouncementForm({ ...announcementForm, image_url: "" });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <label
                                htmlFor="announcement-image-upload"
                                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              >
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium text-muted-foreground">Click to upload image</span>
                                <span className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP (max 5MB)</span>
                              </label>
                            )}
                            <input
                              id="announcement-image-upload"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error("Image must be under 5 MB.");
                                  return;
                                }
                                setImageFile(file);
                                setImagePreview(URL.createObjectURL(file));
                                // Reset the input so re-selecting the same file triggers onChange
                                e.target.value = "";
                              }}
                            />
                            {(imagePreview || announcementForm.image_url) && (
                              <label
                                htmlFor="announcement-image-upload"
                                className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline"
                              >
                                <Upload className="h-3.5 w-3.5" /> Replace image
                              </label>
                            )}
                          </div>
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row gap-6">
                          <div className="flex items-center gap-3">
                            <Switch id="form_published" checked={announcementForm.is_published} onCheckedChange={(v) => setAnnouncementForm({ ...announcementForm, is_published: v })} />
                            <Label htmlFor="form_published" className="cursor-pointer">
                              <span className="font-medium">Published</span>
                              <p className="text-xs text-muted-foreground">Visible to all citizens</p>
                            </Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch id="form_pinned" checked={announcementForm.is_pinned} onCheckedChange={(v) => setAnnouncementForm({ ...announcementForm, is_pinned: v })} />
                            <Label htmlFor="form_pinned" className="cursor-pointer">
                              <span className="font-medium">Pinned</span>
                              <p className="text-xs text-muted-foreground">Displayed at the top</p>
                            </Label>
                          </div>
                        </div>
                        <Button variant="civic" className="w-full" onClick={handleSaveAnnouncement} disabled={uploadingImage}>
                          {uploadingImage ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading image…</>) : (<>{editingAnnouncement ? "Update" : "Create"} Announcement</>)}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            {filteredAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {announcements.length === 0 ? "No announcements yet. Create one to get started." : "No announcements match your search."}
                  </p>
                </CardContent>
              </Card>
            ) : annViewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAnnouncements.map((ann: any) => (
                  <Card key={ann.id} className={`flex flex-col overflow-hidden transition-all hover:shadow-lg ${!ann.is_published ? "opacity-70 border-dashed" : ""}`}>
                    {/* Image */}
                    {ann.image_url && (
                      <div className="relative h-40 overflow-hidden bg-muted">
                        <img src={ann.image_url} alt={ann.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 flex gap-1">
                          {ann.is_pinned && <Badge variant="destructive" className="text-xs flex items-center gap-1"><Pin className="h-3 w-3" /> Pinned</Badge>}
                          {!ann.is_published && <Badge variant="outline" className="text-xs bg-background">Draft</Badge>}
                        </div>
                      </div>
                    )}
                    {!ann.image_url && (ann.is_pinned || !ann.is_published) && (
                      <div className="px-4 pt-4 flex gap-1">
                        {ann.is_pinned && <Badge variant="destructive" className="text-xs flex items-center gap-1"><Pin className="h-3 w-3" /> Pinned</Badge>}
                        {!ann.is_published && <Badge variant="outline" className="text-xs">Draft</Badge>}
                      </div>
                    )}

                    <CardHeader className="pb-2 flex-none">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary" className="text-xs">{ann.category}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(ann.created_at).toLocaleDateString()}</span>
                      </div>
                      <CardTitle className="text-base line-clamp-2">{ann.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 pb-2">
                      {ann.event_date && (
                        <div className="flex items-center text-xs text-muted-foreground mb-1">
                          <CalendarIcon className="h-3 w-3 mr-1" /> {new Date(ann.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </div>
                      )}
                      {ann.location && (
                        <div className="flex items-center text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3 mr-1" /> {ann.location}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3">{ann.description}</p>
                    </CardContent>

                    <CardFooter className="border-t pt-3 gap-1 flex-wrap">
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setPreviewAnnouncement(ann)}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openEditAnnouncement(ann)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleTogglePublish(ann)}>
                        {ann.is_published ? <GlobeLock className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                        {ann.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleTogglePin(ann)}>
                        <Pin className="h-3 w-3 mr-1" /> {ann.is_pinned ? "Unpin" : "Pin"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{ann.title}" will be permanently deleted. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteAnnouncement(ann.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              /* Table View */
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnnouncements.map((ann: any) => (
                        <TableRow key={ann.id} className={!ann.is_published ? "opacity-60" : ""}>
                          <TableCell>
                            {ann.image_url ? (
                              <img src={ann.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <Image className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium line-clamp-1">{ann.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{ann.description.slice(0, 80)}...</p>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{ann.category}</Badge></TableCell>
                          <TableCell className="text-sm">{ann.event_date || new Date(ann.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {ann.is_pinned && <Badge variant="destructive" className="text-xs">Pinned</Badge>}
                              <Badge variant={ann.is_published ? "default" : "outline"} className="text-xs">{ann.is_published ? "Live" : "Draft"}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewAnnouncement(ann)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditAnnouncement(ann)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePublish(ann)}>
                                {ann.is_published ? <GlobeLock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{ann.title}" will be permanently deleted. This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteAnnouncement(ann.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Preview / View Modal */}
            <Dialog open={!!previewAnnouncement} onOpenChange={(open) => !open && setPreviewAnnouncement(null)}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                {previewAnnouncement && (
                  <>
                    <DialogHeader>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary">{previewAnnouncement.category}</Badge>
                        {previewAnnouncement.is_pinned && <Badge variant="destructive" className="flex items-center gap-1"><Pin className="h-3 w-3" /> Pinned</Badge>}
                        <Badge variant={previewAnnouncement.is_published ? "default" : "outline"}>
                          {previewAnnouncement.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <DialogTitle className="text-xl">{previewAnnouncement.title}</DialogTitle>
                    </DialogHeader>

                    {previewAnnouncement.image_url && (
                      <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        <img src={previewAnnouncement.image_url} alt={previewAnnouncement.title} className="w-full max-h-[28rem] object-contain" />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {new Date(previewAnnouncement.created_at).toLocaleString()}</span>
                      {previewAnnouncement.event_date && (
                        <div className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {new Date(previewAnnouncement.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                      )}
                      {previewAnnouncement.location && (
                        <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {previewAnnouncement.location}</div>
                      )}
                    </div>

                    <Separator />

                    <div className="text-foreground whitespace-pre-line leading-relaxed">
                      {previewAnnouncement.description}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => { setPreviewAnnouncement(null); openEditAnnouncement(previewAnnouncement); }}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="civic" onClick={() => { handleTogglePublish(previewAnnouncement); setPreviewAnnouncement(null); }}>
                        {previewAnnouncement.is_published ? <><GlobeLock className="h-4 w-4 mr-1" /> Unpublish</> : <><Globe className="h-4 w-4 mr-1" /> Publish</>}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Concerns */}
        {activeTab === "concerns" && (
          <Card>
            <CardHeader>
              <CardTitle>Citizen Concerns</CardTitle>
              <CardDescription>View and respond to citizen-submitted concerns</CardDescription>
            </CardHeader>
            <CardContent>
              {concerns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No concerns submitted yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {concerns.map((concern) => (
                      <TableRow key={concern.id}>
                        <TableCell><code className="text-xs font-mono text-civic-blue bg-civic-blue/10 px-1.5 py-0.5 rounded">{generateOrderId(concern.id, concern.created_at)}</code></TableCell>
                        <TableCell className="font-medium">{concern.subject}</TableCell>
                        <TableCell>{(concern.profiles as any)?.full_name || (concern.profiles as any)?.email || "Unknown"}</TableCell>
                        <TableCell><Badge variant="secondary">{concern.category}</Badge></TableCell>
                        <TableCell><Badge variant={statusColor(concern.status)}>{concern.status}</Badge></TableCell>
                        <TableCell>{new Date(concern.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Dialog open={respondDialog && selectedConcern?.id === concern.id} onOpenChange={(open) => { setRespondDialog(open); if (!open) setSelectedConcern(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedConcern(concern); setRespondDialog(true); setResponseText(concern.admin_response || ""); setResponseStatus(concern.status === "pending" ? "resolved" : concern.status); }}>
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Concern Details</DialogTitle>
                              </DialogHeader>
                              {selectedConcern && (
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-muted-foreground">From</Label>
                                    <p className="font-medium">{(selectedConcern.profiles as any)?.full_name || "Unknown"}</p>
                                    <p className="text-sm text-muted-foreground">{(selectedConcern.profiles as any)?.email || "No email"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Subject</Label>
                                    <p className="font-medium">{selectedConcern.subject}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <div className="mt-1">
                                      <ParsedDescription description={selectedConcern.description} />
                                    </div>
                                  </div>
                                  {selectedConcern.location && (
                                    <div>
                                      <Label className="text-muted-foreground">Location</Label>
                                      <p className="text-sm">{selectedConcern.location}</p>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Category</Label>
                                      <p>{selectedConcern.category}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Status</Label>
                                      <Select value={responseStatus} onValueChange={setResponseStatus}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="in_progress">In Progress</SelectItem>
                                          <SelectItem value="resolved">Resolved</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  {selectedConcern.admin_response && (
                                    <div>
                                      <Label className="text-muted-foreground">Previous Response</Label>
                                      <p className="text-sm bg-muted p-3 rounded">{selectedConcern.admin_response}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Admin Response</Label>
                                    <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} rows={4} placeholder="Write your response..." />
                                  </div>
                                  <Button variant="civic" className="w-full" onClick={handleRespondConcern}>
                                    Send Response
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document Requests */}
        {activeTab === "documents" && (
          <Card>
            <CardHeader>
              <CardTitle>Document Requests</CardTitle>
              <CardDescription>View and process document requests submitted by citizens</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No document requests submitted yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const deliveryLine = (doc.description || "").split("\n\n").find((l: string) => l.startsWith("Delivery Method:"));
                      const deliveryType = deliveryLine?.includes("Home Delivery") ? "Home Delivery" : "Pickup";
                      return (
                        <TableRow key={doc.id}>
                          <TableCell><code className="text-xs font-mono text-civic-blue bg-civic-blue/10 px-1.5 py-0.5 rounded">{generateOrderId(doc.id, doc.created_at)}</code></TableCell>
                          <TableCell className="font-medium">{doc.subject.replace("Document Request: ", "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</TableCell>
                          <TableCell>{(doc.profiles as any)?.full_name || (doc.profiles as any)?.email || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge variant={deliveryType === "Home Delivery" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                              {deliveryType === "Home Delivery" ? <Truck className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                              {deliveryType}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant={statusColor(doc.status)}>{docStatusLabel(doc.status)}</Badge></TableCell>
                          <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Dialog open={respondDialog && selectedConcern?.id === doc.id} onOpenChange={(open) => { setRespondDialog(open); if (!open) setSelectedConcern(null); }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedConcern(doc); setRespondDialog(true); setResponseText(doc.admin_response || ""); setResponseStatus(doc.status || "pending"); }}>
                                  <Eye className="h-4 w-4 mr-1" /> Process
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Process Document Request
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedConcern && (() => {
                                  const lines: string[] = (selectedConcern.description || "").split("\n\n");
                                  const getLine = (prefix: string) => lines.find((l: string) => l.startsWith(prefix))?.replace(prefix, "") ?? "—";
                                  const deliveryMethod = getLine("Delivery Method: ");
                                  const isHomeDelivery = deliveryMethod.includes("Home Delivery");
                                  const deliveryAddr = getLine("Delivery Address: ");
                                  return (
                                    <div className="space-y-4 pt-2">
                                      {/* Citizen info */}
                                      <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                                        <p className="font-semibold">{(selectedConcern.profiles as any)?.full_name || "Unknown"}</p>
                                        <p className="text-sm text-muted-foreground">{(selectedConcern.profiles as any)?.email || "No email"}</p>
                                      </div>

                                      {/* Document type */}
                                      <div>
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wide">Document Type</Label>
                                        <p className="font-medium mt-0.5">{selectedConcern.subject.replace("Document Request: ", "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                                      </div>

                                      {/* Submitted details */}
                                      <div>
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wide">Request Details</Label>
                                        <div className="mt-1">
                                          <ParsedDescription description={selectedConcern.description} />
                                        </div>
                                      </div>

                                      {/* Payment Proof */}
                                      {(() => {
                                        const payment = payments.find((p: any) => p.request_id === selectedConcern.id);
                                        if (!payment) return null;
                                        return (
                                          <div className="border rounded-lg p-3 space-y-2">
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Payment Info</Label>
                                            <div className="text-sm space-y-1">
                                              <p><span className="text-muted-foreground">Ref #:</span> <span className="font-mono">{payment.reference_number}</span></p>
                                              <p><span className="text-muted-foreground">GCash #:</span> {payment.gcash_number}</p>
                                              <p><span className="text-muted-foreground">Amount:</span> ₱{Number(payment.amount).toFixed(2)}</p>
                                              <p><span className="text-muted-foreground">Status:</span> <Badge variant={payment.status === "verified" ? "default" : payment.status === "rejected" ? "destructive" : "secondary"}>{payment.status}</Badge></p>
                                            </div>
                                            {payment.proof_url && (
                                              <div>
                                                <p className="text-xs text-muted-foreground mb-1">Payment Screenshot:</p>
                                                <a href={payment.proof_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                                                  <img src={payment.proof_url} alt="Payment proof" className="max-w-[200px] max-h-[200px] rounded border object-cover hover:opacity-80 transition" />
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* Delivery info */}
                                      <div className="border rounded-lg p-3 space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wide">Delivery</Label>
                                        <div className="flex items-center gap-2">
                                          {isHomeDelivery ? (
                                            <Truck className="h-4 w-4 text-purple-600" />
                                          ) : (
                                            <CheckCircle2 className="h-4 w-4 text-civic-blue" />
                                          )}
                                          <span className="font-medium text-sm">{deliveryMethod}</span>
                                        </div>
                                        {isHomeDelivery && deliveryAddr !== "—" && (
                                          <p className="text-sm text-muted-foreground pl-6">{deliveryAddr}</p>
                                        )}
                                      </div>

                                      {/* Status workflow */}
                                      <div>
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wide">Update Status</Label>
                                        <Select value={responseStatus} onValueChange={setResponseStatus}>
                                          <SelectTrigger className="mt-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">1 — Pending (received, not yet started)</SelectItem>
                                            <SelectItem value="processing">2 — Processing (document being prepared)</SelectItem>
                                            {isHomeDelivery ? (
                                              <SelectItem value="out_for_delivery">3 — Out for Delivery (sent via courier)</SelectItem>
                                            ) : (
                                              <SelectItem value="ready_for_pickup">3 — Ready for Pickup (at City Hall)</SelectItem>
                                            )}
                                            <SelectItem value="completed">4 — Completed (delivered / claimed)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Admin note */}
                                      {selectedConcern.admin_response && (
                                        <div>
                                          <Label className="text-muted-foreground text-xs uppercase tracking-wide">Previous Note</Label>
                                          <p className="text-sm bg-muted p-3 rounded mt-1">{selectedConcern.admin_response}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label>Note to Citizen <span className="text-xs text-muted-foreground">(optional)</span></Label>
                                        <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} rows={3} placeholder="e.g. Your document is ready. Please bring a valid ID when claiming..." className="mt-1" />
                                      </div>

                                      <Button variant="civic" className="w-full" onClick={handleRespondConcern}>
                                        Save & Update Status
                                      </Button>
                                    </div>
                                  );
                                })()}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reusable service request table */}
        {(activeTab === "business" || activeTab === "health") && (() => {
          const serviceMap: Record<string, { data: any[]; icon: React.FC<any>; label: string; statusOptions: string[] }> = {
            business:  { data: businessReqs,  icon: Briefcase, label: "Business Request",  statusOptions: ["pending", "in_progress", "resolved"] },
            health:    { data: healthReqs,     icon: Activity,  label: "Health Request",    statusOptions: ["pending", "in_progress", "resolved"] },
          };
          const svc = serviceMap[activeTab];
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svc.icon className="h-5 w-5" />
                  {activeTab === "business" && "Business Services"}
                  {activeTab === "health" && "Health Services"}
                </CardTitle>
                <CardDescription>
                  View and respond to {svc.label.toLowerCase()} submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {svc.data.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {svc.data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.subject}</TableCell>
                          <TableCell>{(item.profiles as any)?.full_name || (item.profiles as any)?.email || "Unknown"}</TableCell>
                          <TableCell><Badge variant="secondary">{item.category || "—"}</Badge></TableCell>
                          <TableCell><Badge variant={statusColor(item.status)}>{item.status}</Badge></TableCell>
                          <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Dialog
                              open={respondDialog && selectedConcern?.id === item.id}
                              onOpenChange={(open) => { setRespondDialog(open); if (!open) setSelectedConcern(null); }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedConcern(item);
                                    setRespondDialog(true);
                                    setResponseText(item.admin_response || "");
                                    setResponseStatus(item.status === "pending" ? "in_progress" : item.status);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>{svc.label} Details</DialogTitle>
                                </DialogHeader>
                                {selectedConcern && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-muted-foreground">From</Label>
                                      <p className="font-medium">{(selectedConcern.profiles as any)?.full_name || "Unknown"}</p>
                                      <p className="text-sm text-muted-foreground">{(selectedConcern.profiles as any)?.email || "No email"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Subject</Label>
                                      <p className="font-medium">{selectedConcern.subject}</p>
                                    </div>
                                    {selectedConcern.description && (
                                      <div>
                                        <Label className="text-muted-foreground">Description</Label>
                                        <div className="mt-1">
                                          <ParsedDescription description={selectedConcern.description} />
                                        </div>
                                      </div>
                                    )}
                                    {selectedConcern.location && (
                                      <div>
                                        <Label className="text-muted-foreground">Location / Notes</Label>
                                        <p className="text-sm">{selectedConcern.location}</p>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">Category</Label>
                                        <p>{selectedConcern.category || "—"}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Update Status</Label>
                                        <Select value={responseStatus} onValueChange={setResponseStatus}>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    {selectedConcern.admin_response && (
                                      <div>
                                        <Label className="text-muted-foreground">Previous Response</Label>
                                        <p className="text-sm bg-muted p-3 rounded">{selectedConcern.admin_response}</p>
                                      </div>
                                    )}
                                    <div>
                                      <Label>Admin Response</Label>
                                      <Textarea
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        rows={3}
                                        placeholder="Write your response to the citizen..."
                                      />
                                    </div>
                                    <Button variant="civic" className="w-full" onClick={handleRespondConcern}>
                                      Send Response
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Users */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>View all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users registered yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {profile.avatar_url && (
                            <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
                          )}
                          {profile.full_name || "—"}
                        </TableCell>
                        <TableCell>{profile.email || "—"}</TableCell>
                        <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
