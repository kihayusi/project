import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Calendar, MapPin, Clock, Search, Heart } from "lucide-react";

export const CommunityEventsService = () => {
  const upcomingEvents = [
    {
      title: "Bagong Taon Festival 2024",
      date: "March 25-27, 2024",
      time: "9:00 AM - 10:00 PM",
      location: "Plaza Lucrecia Kasilag",
      category: "Festival",
      description: "Annual celebration featuring local culture, food, music, and traditional performances.",
      attendees: 2500,
      image: "🎭"
    },
    {
      title: "Community Clean-up Drive",
      date: "March 30, 2024",
      time: "6:00 AM - 12:00 PM",
      location: "Various Barangays",
      category: "Environment",
      description: "Join us in keeping San Carlos clean and green. Bring your family and friends!",
      attendees: 450,
      image: "🌱"
    },
    {
      title: "Senior Citizens Health Fair",
      date: "April 5, 2024",
      time: "8:00 AM - 5:00 PM",
      location: "San Carlos Civic Center",
      category: "Health",
      description: "Free health checkups, consultations, and wellness activities for senior citizens.",
      attendees: 300,
      image: "❤️"
    },
    {
      title: "Youth Skills Training Workshop",
      date: "April 12-14, 2024",
      time: "1:00 PM - 6:00 PM",
      location: "San Carlos Technical Institute",
      category: "Education",
      description: "Digital literacy and entrepreneurship training for young adults aged 18-25.",
      attendees: 120,
      image: "💻"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">Community Events</h2>
        <p className="text-muted-foreground">Discover local events, festivals, and community gatherings</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-10" />
        </div>
        <Button variant="civic-outline">Filter by Date</Button>
        <Button variant="civic-outline">Categories</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {upcomingEvents.map((event, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{event.image}</div>
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1">{event.category}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{event.description}</CardDescription>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {event.attendees} people interested
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="civic" className="flex-1">
                  <Heart className="h-4 w-4 mr-2" />
                  I'm Interested
                </Button>
                <Button variant="civic-outline">Share</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button variant="civic">View Event Calendar</Button>
      </div>
    </div>
  );
};