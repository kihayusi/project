import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { openEmailRequest } from "@/lib/email";
import { supabase } from "@/integrations/supabase/client";

export const CitizenConcernsService = () => {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [myConcerns, setMyConcerns] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchMyConcerns = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase
      .from("citizen_concerns")
      .select("*")
      .eq("user_id", session.user.id)
      .not("subject", "like", "Document Request:%")
      .order("created_at", { ascending: false })
      .limit(5);
    setMyConcerns(data || []);
  };

  useEffect(() => { fetchMyConcerns(); }, []);

  const handleSubmit = async () => {
    if (!category || !subject || !details) {
      alert("Please fill in all required fields (Category, Subject, Details)");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    try {
      // Save the concern to the database
      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session.user.id,
        subject: subject,
        description: details,
        category: category,
        location: location || "",
        status: "pending",
      }).select();

      console.log("Insert response - Data:", data, "Error:", error);

      if (error) {
        throw error;
      }

      // Send email notification to admin (non-blocking)
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

      alert("Your concern has been submitted successfully!");
      setCategory("");
      setSubject("");
      setLocation("");
      setDetails("");
      fetchMyConcerns();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error submitting concern:", errorMsg, error);
      alert(`Failed to submit concern: ${errorMsg}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">Citizen Concerns</h2>
        <p className="text-muted-foreground">Report issues, suggest improvements, and track resolution progress</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit New Concern</CardTitle>
            <CardDescription>Help us improve our city by reporting issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="concern-category">Category</Label>
              <Select onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="road-maintenance">Road Maintenance</SelectItem>
                  <SelectItem value="public-order">Public Order</SelectItem>
                  <SelectItem value="sanitation">Sanitation</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="concern-title">Subject</Label>
              <Input
                id="concern-title"
                placeholder="Brief description of the issue"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="concern-location">Location</Label>
              <Input
                id="concern-location"
                placeholder="Where is this issue located?"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="concern-details">Details</Label>
              <Textarea
                id="concern-details"
                placeholder="Provide detailed information about the issue"
                rows={4}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
              />
            </div>
            <Button className="w-full" variant="civic" onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Submit Concern
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Track Your Reports</CardTitle>
            <CardDescription>Monitor the status of your submitted concerns</CardDescription>
          </CardHeader>
          <CardContent>
            {myConcerns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No reports submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {myConcerns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.category} • {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      c.status === "resolved" ? "text-civic-green" :
                      c.status === "in_progress" ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {c.status === "resolved" && <CheckCircle className="h-3.5 w-3.5" />}
                      {c.status === "in_progress" && <Clock className="h-3.5 w-3.5" />}
                      {c.status === "pending" && <AlertCircle className="h-3.5 w-3.5" />}
                      <span className="capitalize">{c.status.replace("_", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="civic-outline" className="w-full" onClick={() => { window.location.href = "/"; setTimeout(() => { document.getElementById("my-requests")?.scrollIntoView({ behavior: "smooth" }); }, 300); }}>
              View All Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};