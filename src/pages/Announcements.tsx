import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CityAnnouncementsService } from "@/components/services/CityAnnouncementsService";

const Announcements = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <CityAnnouncementsService />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Announcements;
