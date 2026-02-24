import { Shield, Phone, Mail, MapPin, Facebook, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

export const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer id="contact" className="bg-civic-gray-dark text-white">
      <div ref={footerRef} className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className={`col-span-1 md:col-span-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-civic-blue" />
              <div>
                <h3 className="text-xl font-bold">CityLife San Carlos</h3>
                <p className="text-sm text-white/70">Smart Community Service Hub</p>
              </div>
            </div>
            <p className="text-white/80 mb-4 max-w-md">
              Transforming San Carlos City through digital innovation. Your gateway to efficient, 
              accessible, and transparent government services.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-white hover:text-civic-blue hover:scale-110 transition-all duration-300">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-civic-blue hover:scale-110 transition-all duration-300">
                <Globe className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#services" className="hover:text-civic-blue hover:translate-x-1 transition-all duration-300 inline-block">Services</a></li>
              <li><a href="#announcements" className="hover:text-civic-blue hover:translate-x-1 transition-all duration-300 inline-block">Announcements</a></li>
              <li><a href="#emergency" className="hover:text-civic-blue hover:translate-x-1 transition-all duration-300 inline-block">Emergency</a></li>
              <li><a href="#contact" className="hover:text-civic-blue hover:translate-x-1 transition-all duration-300 inline-block">Contact</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h4 className="font-semibold mb-4">Contact Information</h4>
            <div className="space-y-3 text-white/80">
              <div className="flex items-center group">
                <MapPin className="h-4 w-4 mr-2 text-civic-blue group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm">San Carlos City, Pangasinan</span>
              </div>
              <div className="flex items-center group">
                <Phone className="h-4 w-4 mr-2 text-civic-blue group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm">(075) 532-1234</span>
              </div>
              <div className="flex items-center group">
                <Mail className="h-4 w-4 mr-2 text-civic-blue group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm">info@sancarlos.gov.ph</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`border-t border-white/20 mt-8 pt-8 text-center transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-white/60 text-sm">
            © 2024 CityLife San Carlos. All rights reserved. | Developed for San Carlos City Government
          </p>
        </div>
      </div>
    </footer>
  );
};