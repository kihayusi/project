import { Shield, Phone, Mail, MapPin, Facebook, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer id="contact" className="bg-civic-gray-dark text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
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
              <Button variant="ghost" size="icon" className="text-white hover:text-civic-blue">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-civic-blue">
                <Globe className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#services" className="hover:text-civic-blue transition-colors">Services</a></li>
              <li><a href="#announcements" className="hover:text-civic-blue transition-colors">Announcements</a></li>
              <li><a href="#emergency" className="hover:text-civic-blue transition-colors">Emergency</a></li>
              <li><a href="#contact" className="hover:text-civic-blue transition-colors">Contact</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact Information</h4>
            <div className="space-y-3 text-white/80">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-civic-blue" />
                <span className="text-sm">San Carlos City, Pangasinan</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-civic-blue" />
                <span className="text-sm">(075) 532-1234</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-civic-blue" />
                <span className="text-sm">info@sancarlos.gov.ph</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-white/60 text-sm">
            © 2024 CityLife San Carlos. All rights reserved. | Developed for San Carlos City Government
          </p>
        </div>
      </div>
    </footer>
  );
};