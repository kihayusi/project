import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementsSection } from "@/components/AnnouncementsSection";

const Announcements = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <AnnouncementsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Announcements;
