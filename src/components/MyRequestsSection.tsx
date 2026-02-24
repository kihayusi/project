import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Building, Heart, CheckCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const MyRequestsSection = () => {
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Resolved / ready variants are "success", everything else is pending/in-progress
  const getStatusIcon = (status: string) => {
    const resolved = ["resolved", "completed", "ready_for_pickup"].includes(status);
    return resolved
      ? <CheckCircle className="h-4 w-4 text-civic-green" />
      : <Clock className="h-4 w-4 text-amber-600" />;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    if (["resolved", "completed", "ready_for_pickup"].includes(status)) return "default";
    if (["pending", "in_progress", "processing", "out_for_delivery"].includes(status)) return "secondary";
    return "outline";
  };

  const formatStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

  const RequestCard = ({ request }: { request: any }) => {
    const isDocument = request.subject?.startsWith("Document Request:");
    const displayTitle = isDocument
      ? request.subject.replace("Document Request: ", "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
      : (request.subject || request.title);
    const Icon = isDocument ? FileText : MessageSquare;
    const submittedDate = request.created_at
      ? new Date(request.created_at).toLocaleDateString()
      : request.submittedDate;
    const isResolved = ["resolved", "completed"].includes(request.status);

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-civic-blue" />
              <div>
                <h4 className="font-semibold">{displayTitle}</h4>
                <p className="text-sm text-muted-foreground">{request.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(request.status)}
              <Badge
                variant={getStatusVariant(request.status)}
                className={isResolved ? "bg-civic-green text-white" : ""}
              >
                {formatStatus(request.status)}
              </Badge>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
            <span>Submitted: {submittedDate}</span>
            {request.category && <span>Category: {request.category}</span>}
          </div>

          {request.description && (
            <div className="bg-muted/50 p-3 rounded mb-3 text-sm">
              <p className="font-medium text-foreground mb-1">Description:</p>
              <p className="text-muted-foreground">{request.description}</p>
            </div>
          )}

          {request.admin_response && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Admin Response:</p>
              <p className="text-blue-600 dark:text-blue-200">{request.admin_response}</p>
            </div>
          )}
        </CardContent>
      </Card>
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
          <Tabs defaultValue="concerns" className="w-full">
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
    </section>
  );
};