import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, FileText, DollarSign, Users, TrendingUp } from "lucide-react";
import { openEmailRequest } from "@/lib/email";
import { supabase } from "@/integrations/supabase/client";

export const BusinessServicesService = () => {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [permitType, setPermitType] = useState("");
  const navigate = useNavigate();

  const requireAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return false;
    }
    return true;
  };

  const handleRegistration = async () => {
    if (!businessName || !businessType || !businessAddress) {
      alert("Please fill in all required fields");
      return;
    }

    if (!(await requireAuth())) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save business registration request
      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session?.user?.id,
        subject: `Business Registration: ${businessName}`,
        description: `Business Type: ${businessType}\n\nBusiness Address: ${businessAddress}`,
        category: "Business Services",
        status: "pending",
      }).select();

      if (error) {
        throw error;
      }

      // Send email notification (non-blocking)
      try {
        await openEmailRequest("Business Registration Request", [
          `From: ${session?.user?.email}`,
          `Business Name: ${businessName}`,
          `Business Type: ${businessType}`,
          `Business Address: ${businessAddress}`,
        ]);
      } catch (emailError) {
        console.warn("Email notification failed, but registration was submitted:", emailError);
      }

      alert("Your business registration request has been submitted!");
      setBusinessName("");
      setBusinessType("");
      setBusinessAddress("");
    } catch (error) {
      console.error("Error submitting registration:", error);
      alert("Failed to submit registration. Please try again.");
    }
  };

  const handlePermitRenewal = async () => {
    if (!permitNumber || !permitType) {
      alert("Please fill in all required fields");
      return;
    }

    if (!(await requireAuth())) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save permit renewal request
      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session?.user?.id,
        subject: `Business Permit Renewal: ${permitType}`,
        description: `Permit Number: ${permitNumber}\n\nPermit Type: ${permitType}`,
        category: "Business Services",
        status: "pending",
      }).select();

      if (error) {
        throw error;
      }

      // Send email notification (non-blocking)
      try {
        await openEmailRequest("Business Permit Renewal Request", [
          `From: ${session?.user?.email}`,
          `Permit Number: ${permitNumber}`,
          `Permit Type: ${permitType}`,
        ]);
      } catch (emailError) {
        console.warn("Email notification failed, but renewal was submitted:", emailError);
      }

      alert("Your permit renewal request has been submitted!");
      setPermitNumber("");
      setPermitType("");
    } catch (error) {
      console.error("Error submitting renewal:", error);
      alert("Failed to submit renewal request. Please try again.");
    }
  };

  const businessTypes = [
    { name: "Sole Proprietorship", fee: "₱500", processing: "3-5 days" },
    { name: "Partnership", fee: "₱1,000", processing: "5-7 days" },
    { name: "Corporation", fee: "₱2,500", processing: "7-14 days" },
    { name: "Cooperative", fee: "₱1,500", processing: "5-10 days" }
  ];

  const permits = [
    { name: "Mayor's Permit", fee: "₱1,200", renewal: "Annual" },
    { name: "Sanitary Permit", fee: "₱800", renewal: "Annual" },
    { name: "Fire Safety Permit", fee: "₱600", renewal: "Annual" },
    { name: "Environmental Permit", fee: "₱1,000", renewal: "Annual" }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">Business Services</h2>
        <p className="text-muted-foreground">Business registration, permits, and entrepreneurship support</p>
      </div>

      <Tabs defaultValue="registration" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="permits">Permits</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="directory">Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="registration" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New Business Registration</CardTitle>
                <CardDescription>Register your business with the city</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    placeholder="Enter business name"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="business-type">Business Type</Label>
                  <Select onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="business-address">Business Address</Label>
                  <Input
                    id="business-address"
                    placeholder="Complete business address"
                    value={businessAddress}
                    onChange={(event) => setBusinessAddress(event.target.value)}
                  />
                </div>
                <Button className="w-full" variant="civic" onClick={handleRegistration}>
                  Start Registration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registration Types & Fees</CardTitle>
                <CardDescription>Choose the right registration for your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessTypes.map((type, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-sm text-muted-foreground">Processing: {type.processing}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-civic-blue">{type.fee}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permits" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Required Permits</CardTitle>
                <CardDescription>Essential permits for business operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permits.map((permit, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{permit.name}</p>
                        <p className="text-sm text-muted-foreground">Renewal: {permit.renewal}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-civic-blue">{permit.fee}</p>
                        <Button variant="civic-outline" size="sm">Apply</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permit Renewal</CardTitle>
                <CardDescription>Renew your existing business permits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="permit-number">Permit Number</Label>
                  <Input
                    id="permit-number"
                    placeholder="Enter permit number"
                    value={permitNumber}
                    onChange={(event) => setPermitNumber(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="permit-type">Permit Type</Label>
                  <Select onValueChange={setPermitType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select permit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mayors">Mayor's Permit</SelectItem>
                      <SelectItem value="sanitary">Sanitary Permit</SelectItem>
                      <SelectItem value="fire">Fire Safety Permit</SelectItem>
                      <SelectItem value="environmental">Environmental Permit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" variant="civic" onClick={handlePermitRenewal}>
                  Check Renewal Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-civic-blue" />
                  Business Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Training programs and workshops for entrepreneurs</p>
                <Button variant="civic-outline" className="w-full">Learn More</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-civic-blue" />
                  Financial Assistance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Microfinance and loan programs for small businesses</p>
                <Button variant="civic-outline" className="w-full">Apply Now</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-civic-blue" />
                  Mentorship Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Connect with experienced business mentors</p>
                <Button variant="civic-outline" className="w-full">Join Program</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="directory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Local Business Directory</CardTitle>
              <CardDescription>Find and connect with local businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input placeholder="Search businesses..." className="flex-1" />
                  <Button variant="civic-outline">Search</Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">San Carlos Hardware</h4>
                    <p className="text-sm text-muted-foreground">Construction supplies and tools</p>
                    <p className="text-sm text-civic-blue">📍 Main Street, San Carlos</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Kakanin ni Aling Rosa</h4>
                    <p className="text-sm text-muted-foreground">Traditional Filipino delicacies</p>
                    <p className="text-sm text-civic-blue">📍 Public Market, San Carlos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};