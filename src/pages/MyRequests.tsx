import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MyRequestsSection } from "@/components/MyRequestsSection";

const MyRequests = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <MyRequestsSection />
      </main>
      <Footer />
    </div>
  );
};

export default MyRequests;
