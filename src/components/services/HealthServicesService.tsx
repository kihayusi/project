import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Calendar, MapPin, Stethoscope, Syringe, Baby } from "lucide-react";
import { openEmailRequest } from "@/lib/email";
import { supabase } from "@/integrations/supabase/client";

export const HealthServicesService = () => {
  const [vaccinationName, setVaccinationName] = useState("");
  const [vaccineType, setVaccineType] = useState("");
  const [assistanceName, setAssistanceName] = useState("");
  const [assistanceType, setAssistanceType] = useState("");
  const [medicalCondition, setMedicalCondition] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const navigate = useNavigate();

  const requireAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return false;
    }
    return true;
  };

  const handleVaccinationRegistration = async () => {
    if (!vaccinationName || !vaccineType) {
      alert("Please fill in all required fields");
      return;
    }

    if (!(await requireAuth())) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save vaccination registration
      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session?.user?.id,
        subject: `Vaccination Registration: ${vaccineType}`,
        description: `Full Name: ${vaccinationName}\n\nVaccine Type: ${vaccineType}`,
        category: "Health Services",
        status: "pending",
      }).select();

      if (error) {
        throw error;
      }

      // Send email notification (non-blocking)
      try {
        await openEmailRequest("Vaccination Registration", [
          `From: ${session?.user?.email}`,
          `Full Name: ${vaccinationName}`,
          `Vaccine Type: ${vaccineType}`,
        ]);
      } catch (emailError) {
        console.warn("Email notification failed, but registration was submitted:", emailError);
      }

      alert("Your vaccination registration has been submitted!");
      setVaccinationName("");
      setVaccineType("");
    } catch (error) {
      console.error("Error submitting vaccination registration:", error);
      alert("Failed to submit registration. Please try again.");
    }
  };

  const handleScheduleRegistration = async (schedule: { vaccine: string; date: string; time: string; venue: string; }) => {
    if (!(await requireAuth())) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save schedule registration
      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session?.user?.id,
        subject: `Schedule Registration: ${schedule.vaccine}`,
        description: `Vaccine: ${schedule.vaccine}\n\nDate: ${schedule.date}\n\nTime: ${schedule.time}\n\nVenue: ${schedule.venue}`,
        category: "Health Services",
        status: "pending",
      }).select();

      if (error) {
        throw error;
      }

      // Send email notification (non-blocking)
      try {
        await openEmailRequest("Vaccination Schedule Registration", [
          `From: ${session?.user?.email}`,
          `Vaccine: ${schedule.vaccine}`,
          `Date: ${schedule.date}`,
          `Time: ${schedule.time}`,
          `Venue: ${schedule.venue}`,
        ]);
      } catch (emailError) {
        console.warn("Email notification failed, but registration was submitted:", emailError);
      }

      alert("Your schedule registration has been submitted!");
    } catch (error) {
      console.error("Error submitting schedule registration:", error);
      alert("Failed to submit registration. Please try again.");
    }
  };

  const handleAssistanceApplication = async () => {
    if (!assistanceName || !assistanceType || !medicalCondition) {
      alert("Please fill in all required fields");
      return;
    }

    if (!(await requireAuth())) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save assistance application
      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session?.user?.id,
        subject: `Medical Assistance Application: ${assistanceType}`,
        description: `Patient Name: ${assistanceName}\n\nAssistance Type: ${assistanceType}\n\nMedical Condition: ${medicalCondition}\n\nEstimated Cost: ${estimatedCost || "Not specified"}`,
        category: "Health Services",
        status: "pending",
      }).select();

      if (error) {
        throw error;
      }

      // Send email notification (non-blocking)
      try {
        await openEmailRequest("Medical Assistance Application", [
          `From: ${session?.user?.email}`,
          `Patient Name: ${assistanceName}`,
          `Assistance Type: ${assistanceType}`,
          `Medical Condition: ${medicalCondition}`,
          `Estimated Cost: ${estimatedCost || "Not specified"}`,
        ]);
      } catch (emailError) {
        console.warn("Email notification failed, but application was submitted:", emailError);
      }

      alert("Your assistance application has been submitted!");
      setAssistanceName("");
      setAssistanceType("");
      setMedicalCondition("");
      setEstimatedCost("");
    } catch (error) {
      console.error("Error submitting assistance application:", error);
      alert("Failed to submit application. Please try again.");
    }
  };

  const healthPrograms = [
    {
      name: "Free Medical Consultation",
      schedule: "Monday to Friday, 8:00 AM - 4:00 PM",
      location: "City Health Office",
      description: "General medical consultation for all residents"
    },
    {
      name: "Maternal & Child Health",
      schedule: "Daily, 8:00 AM - 5:00 PM",
      location: "Rural Health Units",
      description: "Pre-natal care, delivery assistance, and child immunization"
    },
    {
      name: "Senior Citizens Health Program",
      schedule: "Every Tuesday & Thursday",
      location: "Community Centers",
      description: "Health monitoring and medicine distribution for seniors"
    },
    {
      name: "Family Planning Services",
      schedule: "Monday, Wednesday, Friday",
      location: "Health Centers",
      description: "Counseling and contraceptive services"
    }
  ];

  const vaccinationSchedule = [
    { vaccine: "COVID-19 Booster", date: "March 20, 2024", time: "8:00 AM - 5:00 PM", venue: "Sports Complex" },
    { vaccine: "Influenza Vaccine", date: "March 25, 2024", time: "9:00 AM - 4:00 PM", venue: "City Health Office" },
    { vaccine: "Pneumonia Vaccine (Seniors)", date: "April 1, 2024", time: "8:00 AM - 12:00 PM", venue: "Senior Center" },
    { vaccine: "Routine Immunization", date: "Every Monday", time: "8:00 AM - 5:00 PM", venue: "All Health Centers" }
  ];

  const healthFacilities = [
    {
      name: "San Carlos General Hospital",
      type: "Hospital",
      services: ["Emergency Care", "Surgery", "Laboratory", "Radiology"],
      contact: "(075) 529-7890",
      hours: "24/7"
    },
    {
      name: "City Health Office",
      type: "Health Office",
      services: ["Primary Care", "Vaccination", "Health Programs"],
      contact: "(075) 529-5678",
      hours: "8:00 AM - 5:00 PM"
    },
    {
      name: "Maternal & Child Health Center",
      type: "Specialty Center",
      services: ["Pre-natal Care", "Delivery", "Child Health"],
      contact: "(075) 529-6789",
      hours: "24/7"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heart className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">Health Services</h2>
        <p className="text-muted-foreground">Access health programs, vaccination schedules, and medical assistance</p>
      </div>

      <Tabs defaultValue="programs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="programs">Health Programs</TabsTrigger>
          <TabsTrigger value="vaccination">Vaccination</TabsTrigger>
          <TabsTrigger value="facilities">Health Facilities</TabsTrigger>
          <TabsTrigger value="assistance">Medical Assistance</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          <div className="grid gap-4">
            {healthPrograms.map((program, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-destructive" />
                    {program.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-civic-blue" />
                      <span className="text-sm">{program.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-civic-blue" />
                      <span className="text-sm">{program.location}</span>
                    </div>
                    <Button variant="civic-outline" size="sm">Learn More</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vaccination" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Syringe className="h-5 w-5 text-civic-blue" />
                Vaccination Registration
              </CardTitle>
              <CardDescription>Register for upcoming vaccination programs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vaccination-name">Full Name</Label>
                  <Input
                    id="vaccination-name"
                    placeholder="Enter full name"
                    value={vaccinationName}
                    onChange={(event) => setVaccinationName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vaccine-type">Vaccine Type</Label>
                  <Select onValueChange={setVaccineType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vaccine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="covid">COVID-19 Booster</SelectItem>
                      <SelectItem value="flu">Influenza</SelectItem>
                      <SelectItem value="pneumonia">Pneumonia</SelectItem>
                      <SelectItem value="routine">Routine Immunization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" variant="civic" onClick={handleVaccinationRegistration}>
                Register for Vaccination
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Upcoming Vaccination Schedule</h3>
            {vaccinationSchedule.map((schedule, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{schedule.vaccine}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {schedule.date}
                        </div>
                        <div>{schedule.time}</div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {schedule.venue}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="civic-outline"
                      size="sm"
                      onClick={() => handleScheduleRegistration(schedule)}
                    >
                      Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <div className="grid gap-4">
            {healthFacilities.map((facility, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{facility.name}</CardTitle>
                      <Badge variant="secondary">{facility.type}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{facility.contact}</p>
                      <p className="text-xs text-muted-foreground">{facility.hours}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {facility.services.map((service, serviceIndex) => (
                      <Badge key={serviceIndex} variant="outline">{service}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="civic-outline" size="sm">Contact</Button>
                    <Button variant="civic-outline" size="sm">Directions</Button>
                    <Button variant="civic-outline" size="sm">Services</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assistance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                Medical Assistance Application
              </CardTitle>
              <CardDescription>Apply for financial assistance for medical needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assistance-name">Patient Name</Label>
                  <Input
                    id="assistance-name"
                    placeholder="Full name of patient"
                    value={assistanceName}
                    onChange={(event) => setAssistanceName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="assistance-type">Type of Assistance</Label>
                  <Select onValueChange={setAssistanceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistance type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicine">Medicine Assistance</SelectItem>
                      <SelectItem value="laboratory">Laboratory Tests</SelectItem>
                      <SelectItem value="surgery">Surgical Assistance</SelectItem>
                      <SelectItem value="dialysis">Dialysis Treatment</SelectItem>
                      <SelectItem value="emergency">Emergency Medical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="medical-condition">Medical Condition</Label>
                <Input
                  id="medical-condition"
                  placeholder="Describe the medical condition"
                  value={medicalCondition}
                  onChange={(event) => setMedicalCondition(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estimated-cost">Estimated Cost</Label>
                <Input
                  id="estimated-cost"
                  placeholder="₱0.00"
                  value={estimatedCost}
                  onChange={(event) => setEstimatedCost(event.target.value)}
                />
              </div>
              <Button className="w-full" variant="civic" onClick={handleAssistanceApplication}>
                Submit Application
              </Button>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Baby className="h-5 w-5 text-civic-blue" />
                  Indigent Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Free medical services for qualified indigent families</p>
                <Button variant="civic-outline" className="w-full">Apply</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  Senior Citizen Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Health benefits and discounts for senior citizens</p>
                <Button variant="civic-outline" className="w-full">Learn More</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-civic-green" />
                  PWD Health Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Special health programs for persons with disabilities</p>
                <Button variant="civic-outline" className="w-full">Enroll</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};