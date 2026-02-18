import { ServiceCard } from "@/components/ServiceCard";
import { FileText, Megaphone, Shield, MessageSquare, Users, Building, Phone, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DocumentRequestsService } from "@/components/services/DocumentRequestsService";
import { CityAnnouncementsService } from "@/components/services/CityAnnouncementsService";
import { EmergencyServicesService } from "@/components/services/EmergencyServicesService";
import { CitizenConcernsService } from "@/components/services/CitizenConcernsService";
import { CommunityEventsService } from "@/components/services/CommunityEventsService";
import { BusinessServicesService } from "@/components/services/BusinessServicesService";
import { ContactDirectoryService } from "@/components/services/ContactDirectoryService";
import { HealthServicesService } from "@/components/services/HealthServicesService";

export const ServicesSection = () => {
  const services = [
    {
      title: "Document Requests",
      description: "Apply for permits, certificates, and other official documents online",
      icon: FileText,
      component: DocumentRequestsService,
    },
    {
      title: "City Announcements",
      description: "Stay updated with the latest news, events, and public notices",
      icon: Megaphone,
      component: CityAnnouncementsService,
    },
    {
      title: "Emergency Services",
      description: "Quick access to police, fire department, and medical emergency contacts",
      icon: Shield,
      variant: "emergency" as const,
      component: EmergencyServicesService,
    },
    {
      title: "Citizen Concerns",
      description: "Report issues, suggest improvements, and track resolution progress",
      icon: MessageSquare,
      component: CitizenConcernsService,
    },
    {
      title: "Community Events",
      description: "Discover local events, festivals, and community gatherings",
      icon: Users,
      component: CommunityEventsService,
    },
    {
      title: "Business Services",
      description: "Business registration, permits, and entrepreneurship support",
      icon: Building,
      component: BusinessServicesService,
    },
    {
      title: "Contact Directory",
      description: "Find contact information for all government offices and departments",
      icon: Phone,
      component: ContactDirectoryService,
    },
    {
      title: "Health Services",
      description: "Access health programs, vaccination schedules, and medical assistance",
      icon: Heart,
      component: HealthServicesService,
    },
  ];

  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-civic-gray-dark mb-4">
            Smart City Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access all your essential city services through our integrated digital platform. 
            Designed for students, employees, business owners, and all residents of San Carlos City.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const ServiceComponent = service.component;
            return (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div>
                    <ServiceCard
                      title={service.title}
                      description={service.description}
                      icon={service.icon}
                      variant={service.variant}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="sr-only">{service.title}</DialogTitle>
                  </DialogHeader>
                  <ServiceComponent />
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </div>
    </section>
  );
};