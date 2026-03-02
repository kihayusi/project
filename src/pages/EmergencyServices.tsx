import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EmergencyServicesService } from "@/components/services/EmergencyServicesService";

const EmergencyServices = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section id="emergency" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-civic-gray-dark mb-4">Emergency Services</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Emergency contacts, SOS alerts, incident reporting, safety tips, and live city alerts — all in one place.
              </p>
            </div>
            <EmergencyServicesService />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EmergencyServices;
