import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Phone, MapPin, AlertTriangle, Siren } from "lucide-react";

export const EmergencyServicesService = () => {
  const emergencyContacts = [
    {
      service: "Police Emergency",
      number: "117",
      description: "For crimes, accidents, and immediate police assistance"
    },
    {
      service: "Fire Department",
      number: "116",
      description: "For fire emergencies and rescue operations"
    },
    {
      service: "Medical Emergency",
      number: "911",
      description: "For medical emergencies and ambulance services"
    },
    {
      service: "San Carlos Police Station",
      number: "(075) 529-9234",
      description: "Non-emergency police matters"
    },
    {
      service: "San Carlos Fire Station",
      number: "(075) 529-8765",
      description: "Non-emergency fire department inquiries"
    },
    {
      service: "Disaster Risk Reduction Office",
      number: "(075) 529-7890",
      description: "Disaster preparedness and emergency planning"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Siren className="h-16 w-16 text-destructive mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Emergency Services</h2>
        <p className="text-muted-foreground">Quick access to emergency contacts and services</p>
      </div>

      <Card className="border-2 border-destructive bg-destructive/10">
        <CardHeader className="bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
            <CardTitle className="text-destructive text-xl">Emergency Alert</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm mb-4 text-foreground">In case of life-threatening emergencies, call <strong className="text-destructive text-lg">911</strong> immediately.</p>
          <Button variant="emergency" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" size="lg">
            <Phone className="h-5 w-5 mr-2" />
            Call 911 Now
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {emergencyContacts.map((contact, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-destructive" />
                {contact.service}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive mb-2">{contact.number}</div>
              <CardDescription className="mb-4">{contact.description}</CardDescription>
              <Button variant="outline" size="sm" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-civic-blue" />
            Emergency Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">San Carlos General Hospital</p>
                <p className="text-sm text-muted-foreground">24/7 Emergency Services</p>
              </div>
              <Button variant="civic-outline" size="sm">Directions</Button>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">San Carlos Police Station</p>
                <p className="text-sm text-muted-foreground">Main Station Downtown</p>
              </div>
              <Button variant="civic-outline" size="sm">Directions</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};