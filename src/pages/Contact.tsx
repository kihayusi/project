import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactDirectoryService } from "@/components/services/ContactDirectoryService";

const Contact = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <ContactDirectoryService />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
