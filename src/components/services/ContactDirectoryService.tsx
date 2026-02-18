import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, MapPin, Clock, Search, Building } from "lucide-react";

export const ContactDirectoryService = () => {
  const cityOffices = [
    {
      office: "Office of the Mayor",
      head: "Hon. [Mayor Name]",
      phone: "(075) 529-1234",
      email: "mayor@sancarlos.gov.ph",
      address: "City Hall, San Carlos City",
      hours: "8:00 AM - 5:00 PM"
    },
    {
      office: "City Planning Office",
      head: "Engr. [Department Head]",
      phone: "(075) 529-2345",
      email: "planning@sancarlos.gov.ph",
      address: "2nd Floor, City Hall",
      hours: "8:00 AM - 5:00 PM"
    },
    {
      office: "Business Permits & Licensing",
      head: "[Department Head]",
      phone: "(075) 529-3456",
      email: "permits@sancarlos.gov.ph",
      address: "Ground Floor, City Hall",
      hours: "8:00 AM - 5:00 PM"
    },
    {
      office: "Civil Registry Office",
      head: "[Department Head]",
      phone: "(075) 529-4567",
      email: "civilregistry@sancarlos.gov.ph",
      address: "Annex Building, City Hall",
      hours: "8:00 AM - 5:00 PM"
    }
  ];


  const barangays = [
    { name: "Barangay Poblacion Norte", captain: "Kap. [Name]", phone: "(075) 529-1111" },
    { name: "Barangay Poblacion Sur", captain: "Kap. [Name]", phone: "(075) 529-1112" },
    { name: "Barangay Malacampa", captain: "Kap. [Name]", phone: "(075) 529-1113" },
    { name: "Barangay Pangoloan", captain: "Kap. [Name]", phone: "(075) 529-1114" },
    { name: "Barangay Tandoc", captain: "Kap. [Name]", phone: "(075) 529-1115" },
    { name: "Barangay Balite Norte", captain: "Kap. [Name]", phone: "(075) 529-1116" }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Phone className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">Contact Directory</h2>
        <p className="text-muted-foreground">Find contact information for all government offices and departments</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-10" />
        </div>
      </div>

      <Tabs defaultValue="city-offices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="city-offices">City Offices</TabsTrigger>
          <TabsTrigger value="barangays">Barangays</TabsTrigger>
        </TabsList>

        <TabsContent value="city-offices" className="space-y-4">
          <div className="grid gap-4">
            {cityOffices.map((office, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-civic-blue" />
                    {office.office}
                  </CardTitle>
                  <CardDescription>{office.head}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-civic-blue" />
                        <span className="text-sm">{office.phone}</span>
                        <Button variant="civic-outline" size="sm">Call</Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-civic-blue" />
                        <span className="text-sm">{office.email}</span>
                        <Button variant="civic-outline" size="sm">Email</Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-civic-blue" />
                        <span className="text-sm">{office.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-civic-blue" />
                        <span className="text-sm">{office.hours}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="barangays" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {barangays.map((barangay, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{barangay.name}</CardTitle>
                  <CardDescription>{barangay.captain}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-civic-blue" />
                      <span className="text-sm">{barangay.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="civic-outline" size="sm">Call</Button>
                      <Button variant="civic-outline" size="sm">Visit</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};