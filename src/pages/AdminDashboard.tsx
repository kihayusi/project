import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, Users, Megaphone, AlertTriangle, Plus, Pencil, Trash2, MessageSquare, Eye, Loader2, Shield,
  Briefcase, Activity, Siren, CalendarDays, PhoneCall, FileText, Truck, CheckCircle2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading, user } = useUserRole();
  const [activeTab, setActiveTab] = useState("overview");

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [concerns, setConcerns] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [businessReqs, setBusinessReqs] = useState<any[]>([]);
  const [healthReqs, setHealthReqs] = useState<any[]>([]);
  const [emergencyReqs, setEmergencyReqs] = useState<any[]>([]);
  const [eventReqs, setEventReqs] = useState<any[]>([]);
  const [contactReqs, setContactReqs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, announcements: 0, concerns: 0, pendingConcerns: 0 });
  const [loading, setLoading] = useState(true);

  // Announcement form
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", description: "", category: "General", location: "", event_date: "" });

  // Concern response
  const [respondDialog, setRespondDialog] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("resolved");

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
      toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
    }
  }, [roleLoading, isAdmin, navigate, toast]);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [announcementsRes, concernsRes, docsRes, profilesRes] = await Promise.all([
        supabase.from("city_announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("citizen_concerns").select().not("subject", "like", "Document Request:%").order("created_at", { ascending: false }),
        supabase.from("citizen_concerns").select().like("subject", "Document Request:%").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
      ]);

      if (announcementsRes.error) console.error("Announcements error:", announcementsRes.error);
      if (concernsRes.error) console.error("Concerns error:", concernsRes.error);
      if (docsRes.error) console.error("Documents error:", docsRes.error);
      if (profilesRes.error) console.error("Profiles error:", profilesRes.error);

      const anns = announcementsRes.data || [];
      const profs = profilesRes.data || [];

      const mergeProfiles = (items: any[]) => items.map((item: any) => ({
        ...item,
        profiles: profs.find((p: any) => p.user_id === item.user_id) || {}
      }));

      const cons = mergeProfiles(concernsRes.data || []);
      const docs = mergeProfiles(docsRes.data || []);

      setAnnouncements(anns);
      setConcerns(cons);
      setDocuments(docs);
      setProfiles(profs);
      setStats({
        users: profs.length,
        announcements: anns.length,
        concerns: cons.length,
        pendingConcerns: cons.filter((c: any) => c.status === "pending").length,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.description) {
      toast({ title: "Error", description: "Title and description are required.", variant: "destructive" });
      return;
    }

    if (editingAnnouncement) {
      const { error } = await supabase.from("city_announcements").update(announcementForm).eq("id", editingAnnouncement.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Updated", description: "Announcement updated successfully." });
    } else {
      const { error } = await supabase.from("city_announcements").insert({ ...announcementForm, created_by: user?.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Created", description: "Announcement created successfully." });
    }

    setAnnouncementDialog(false);
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: "", description: "", category: "General", location: "", event_date: "" });
    fetchAll();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("city_announcements").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted", description: "Announcement deleted." });
    fetchAll();
  };

  const handleRespondConcern = async () => {
    if (!responseText) {
      toast({ title: "Error", description: "Response is required.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("citizen_concerns").update({
      admin_response: responseText,
      status: responseStatus,
      responded_by: user?.id,
      responded_at: new Date().toISOString(),
    }).eq("id", selectedConcern.id);

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Responded", description: "Response sent successfully." });
    setRespondDialog(false);
    setSelectedConcern(null);
    setResponseText("");
    fetchAll();
  };

  const openEditAnnouncement = (ann: any) => {
    setEditingAnnouncement(ann);
    setAnnouncementForm({ title: ann.title, description: ann.description, category: ann.category, location: ann.location || "", event_date: ann.event_date || "" });
    setAnnouncementDialog(true);
  };

  const openNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: "", description: "", category: "General", location: "", event_date: "" });
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

  if (roleLoading || loading) {
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
          <h1 className="text-2xl font-bold text-foreground">
            {activeTab === "overview" && "Dashboard Overview"}
            {activeTab === "announcements" && "City Announcements"}
            {activeTab === "concerns" && "Citizen Concerns"}
            {activeTab === "documents" && "Document Requests"}
            {activeTab === "business" && "Business Services"}
            {activeTab === "health" && "Health Services"}
            {activeTab === "emergency" && "Emergency Services"}
            {activeTab === "events" && "Community Events"}
            {activeTab === "contact" && "Contact Directory"}
            {activeTab === "users" && "Registered Users"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "overview" && "Monitor city services at a glance"}
            {activeTab === "announcements" && "Create and manage announcements"}
            {activeTab === "concerns" && "View and respond to citizen-submitted concerns"}
            {activeTab === "documents" && "View and process document requests from citizens"}
            {activeTab === "business" && "Manage business service requests and permits"}
            {activeTab === "health" && "Track health service requests and vaccination inquiries"}
            {activeTab === "emergency" && "Review emergency service requests"}
            {activeTab === "events" && "Manage community event registrations and inquiries"}
            {activeTab === "contact" && "Manage contact directory inquiries"}
            {activeTab === "users" && "View all registered users"}
          </p>
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
                { label: "Announcements", value: stats.announcements, icon: Megaphone, color: "text-accent" },
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
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: "Pending", count: concerns.filter((c: any) => c.status === "pending").length },
                      { name: "In Progress", count: concerns.filter((c: any) => c.status === "in_progress").length },
                      { name: "Resolved", count: concerns.filter((c: any) => c.status === "resolved").length },
                    ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                    const categoryMap: Record<string, number> = {};
                    concerns.forEach((c: any) => {
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
                  const dailyData = days.map((d) => {
                    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const count = concerns.filter((c: any) => {
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>City Announcements</CardTitle>
                <CardDescription>Create and manage announcements</CardDescription>
              </div>
              <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
                <DialogTrigger asChild>
                  <Button variant="civic" onClick={openNewAnnouncement}>
                    <Plus className="h-4 w-4 mr-1" /> New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "New Announcement"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={announcementForm.description} onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })} rows={4} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={announcementForm.category} onValueChange={(v) => setAnnouncementForm({ ...announcementForm, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["General", "Health", "Public Hearing", "Festival", "Emergency", "Infrastructure"].map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input value={announcementForm.location} onChange={(e) => setAnnouncementForm({ ...announcementForm, location: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Event Date</Label>
                      <Input value={announcementForm.event_date} onChange={(e) => setAnnouncementForm({ ...announcementForm, event_date: e.target.value })} placeholder="e.g. March 15, 2024" />
                    </div>
                    <Button variant="civic" className="w-full" onClick={handleSaveAnnouncement}>
                      {editingAnnouncement ? "Update" : "Create"} Announcement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No announcements yet. Create one to get started.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((ann) => (
                      <TableRow key={ann.id}>
                        <TableCell className="font-medium">{ann.title}</TableCell>
                        <TableCell><Badge variant="secondary">{ann.category}</Badge></TableCell>
                        <TableCell>{ann.event_date || "—"}</TableCell>
                        <TableCell><Badge variant={ann.is_published ? "default" : "outline"}>{ann.is_published ? "Yes" : "No"}</Badge></TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditAnnouncement(ann)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAnnouncement(ann.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
                                    <p className="text-sm">{selectedConcern.description}</p>
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
                                        <div className="mt-1 bg-muted/30 rounded p-3 text-sm space-y-1">
                                          {lines.filter((l: string) => l && !l.startsWith("Delivery Method:") && !l.startsWith("Delivery Address:")).map((l: string, i: number) => (
                                            <p key={i}>{l}</p>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Delivery info */}
                                      <div className="border rounded-lg p-3 space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wide">Delivery</Label>
                                        <div className="flex items-center gap-2">
                                          {deliveryMethod === "Home Delivery (via courier)" ? (
                                            <Truck className="h-4 w-4 text-purple-600" />
                                          ) : (
                                            <CheckCircle2 className="h-4 w-4 text-civic-blue" />
                                          )}
                                          <span className="font-medium text-sm">{deliveryMethod}</span>
                                        </div>
                                        {deliveryMethod === "Home Delivery (via courier)" && deliveryAddr !== "—" && (
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
                                            {deliveryMethod === "Home Delivery (via courier)" ? (
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
        {(activeTab === "business" || activeTab === "health" || activeTab === "emergency" || activeTab === "events" || activeTab === "contact") && (() => {
          const serviceMap: Record<string, { data: any[]; icon: React.FC<any>; label: string; statusOptions: string[] }> = {
            business:  { data: businessReqs,  icon: Briefcase,    label: "Business Request",    statusOptions: ["pending", "in_progress", "resolved"] },
            health:    { data: healthReqs,     icon: Activity,     label: "Health Request",       statusOptions: ["pending", "in_progress", "resolved"] },
            emergency: { data: emergencyReqs,  icon: Siren,        label: "Emergency Request",    statusOptions: ["pending", "in_progress", "resolved"] },
            events:    { data: eventReqs,      icon: CalendarDays, label: "Event Inquiry",        statusOptions: ["pending", "in_progress", "resolved"] },
            contact:   { data: contactReqs,    icon: PhoneCall,    label: "Contact Inquiry",      statusOptions: ["pending", "in_progress", "resolved"] },
          };
          const svc = serviceMap[activeTab];
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svc.icon className="h-5 w-5" />
                  {activeTab === "business" && "Business Services"}
                  {activeTab === "health" && "Health Services"}
                  {activeTab === "emergency" && "Emergency Services"}
                  {activeTab === "events" && "Community Events"}
                  {activeTab === "contact" && "Contact Directory"}
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
                                        <p className="text-sm whitespace-pre-wrap">{selectedConcern.description}</p>
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
