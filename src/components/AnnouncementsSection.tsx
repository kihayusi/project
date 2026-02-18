import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const AnnouncementsSection = () => {
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
      title: "New Business Permit Process Now Digital",
      date: "December 15, 2024",
      category: "Business",
      excerpt: "Apply for business permits online through our new streamlined digital process. Faster approvals and real-time tracking.",
      urgent: false,
    },
    {
      title: "Christmas Festival 2024 - Street Closure Notice",
      date: "December 20, 2024",
      category: "Events",
      excerpt: "Several downtown streets will be closed for the Christmas Festival. Check alternative routes and event schedule.",
      urgent: true,
    },
    {
      title: "Free Health Check-up Program",
      date: "January 10, 2025",
      category: "Health",
      excerpt: "Monthly free health check-ups at the City Health Center. Book your appointment through our platform.",
      urgent: false,
    },
  ];

  return (
    <section id="announcements" className="py-20 bg-civic-gray">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-civic-gray-dark mb-4">
            Latest Announcements
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay informed with the latest updates, events, and important notices from San Carlos City.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {announcements.map((announcement, index) => (
            <Card key={index} className="bg-white hover:shadow-[var(--shadow-card)] transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={announcement.urgent ? "destructive" : "secondary"}>
                    {announcement.category}
                  </Badge>
                  {announcement.urgent && (
                    <Badge variant="destructive" className="animate-pulse">
                      Urgent
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg text-civic-gray-dark">
                  {announcement.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-muted-foreground text-sm mb-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  {announcement.date}
                </div>
                <p className="text-muted-foreground mb-4">
                  {announcement.excerpt}
                </p>
                <Button
                  variant="civic-outline"
                  size="sm"
                  className="w-full"
                  onClick={() => void requireAuth()}
                >
                  Read More
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button variant="civic" size="lg" onClick={() => void requireAuth()}>
            View All Announcements
          </Button>
        </div>
      </div>
    </section>
  );
};