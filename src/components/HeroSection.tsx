import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-citylife.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with subtle zoom animation */}
      <div 
        className="absolute inset-0 z-0 animate-[scale-in_1.5s_ease-out_forwards]"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-civic-blue/90 to-civic-green/90"></div>
      </div>
      
      {/* Floating decorative elements */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-white/5 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-white/5 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6 opacity-0 animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
            <MapPin className="h-6 w-6 text-white mr-2 animate-bounce-gentle" />
            <span className="text-white/90 font-medium">San Carlos City, Pangasinan</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Welcome to
            <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              CityLife
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            Your Smart Community Service Hub. Access government services, stay updated with city announcements, 
            and connect with your community—all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <Button variant="default" size="lg" className="bg-white text-civic-blue hover:bg-white/90 text-lg px-8 py-3 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              Explore Services
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-civic-blue text-lg px-8 py-3 transition-all duration-300 hover:scale-105">
              Emergency Services
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="text-center opacity-0 animate-count-up" style={{ animationDelay: '1s' }}>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-white/80">Available</div>
            </div>
            <div className="text-center opacity-0 animate-count-up" style={{ animationDelay: '1.2s' }}>
              <div className="text-3xl font-bold mb-2">10+</div>
              <div className="text-white/80">Services</div>
            </div>
            <div className="text-center opacity-0 animate-count-up" style={{ animationDelay: '1.4s' }}>
              <div className="text-3xl font-bold mb-2">Smart</div>
              <div className="text-white/80">Digital Hub</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};