import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-citylife.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-civic-blue/90 to-civic-green/90"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <MapPin className="h-6 w-6 text-white mr-2" />
            <span className="text-white/90 font-medium">San Carlos City, Pangasinan</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Welcome to
            <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              CityLife
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your Smart Community Service Hub. Access government services, stay updated with city announcements, 
            and connect with your community—all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="default" size="lg" className="bg-white text-civic-blue hover:bg-white/90 text-lg px-8 py-3">
              Explore Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-civic-blue text-lg px-8 py-3">
              Emergency Services
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-white/80">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">10+</div>
              <div className="text-white/80">Services</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">Smart</div>
              <div className="text-white/80">Digital Hub</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};