import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Megaphone, Calendar, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const CityAnnouncementsService = () => {
  const navigate = useNavigate();

  const requireAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return false;
    }
    return true;
  };
  const announcements = [
    {
      title: "Public Consultation: New Traffic Management System",
      date: "March 15, 2024",
      location: "City Hall Conference Room",
      category: "Public Hearing",
      description: "Join us for a public consultation regarding the implementation of new traffic management systems in downtown San Carlos."
    },
    {
      title: "Vaccination Drive Schedule",
      date: "March 20, 2024",
      location: "San Carlos Sports Complex",
      category: "Health",
      description: "Free vaccination drive for all residents. Bring your vaccination cards and valid ID."
    },
    {
      title: "Bagong Taon Festival 2024",
      date: "March 25-27, 2024",
      location: "Plaza Lucrecia Kasilag",
      category: "Festival",
      description: "Annual celebration featuring local culture, food, and entertainment. Everyone is welcome!"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Megaphone className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">City Announcements</h2>
        <p className="text-muted-foreground">Stay updated with the latest news, events, and public notices</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search announcements..." className="pl-10" />
        </div>
        <Button variant="civic-outline">Filter</Button>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {announcement.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {announcement.location}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">{announcement.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{announcement.description}</CardDescription>
              <Button
                variant="civic-outline"
                size="sm"
                onClick={() => void requireAuth()}
              >
                Read More
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button variant="civic" onClick={() => void requireAuth()}>
          Load More Announcements
        </Button>
      </div>
    </div>
  );
};