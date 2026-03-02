import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, ExternalLink, MapPin, Pin, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Announcement = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  event_date: string | null;
  image_url: string | null;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const AnnouncementsSection = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("city_announcements")
        .select("*")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) setAnnouncements(data as Announcement[]);
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);

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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-civic-blue" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No announcements at the moment. Check back later!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {announcements.map((ann) => (
              <Card key={ann.id} className="bg-white hover:shadow-[var(--shadow-card)] transition-all duration-300 flex flex-col overflow-hidden">
                {/* Image */}
                {ann.image_url ? (
                  <div className="relative h-48 overflow-hidden">
                    <img src={ann.image_url} alt={ann.title} className="w-full h-full object-cover" />
                    {ann.is_pinned && (
                      <Badge variant="destructive" className="absolute top-2 right-2 flex items-center gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                  </div>
                ) : (
                  ann.is_pinned && (
                    <div className="px-6 pt-4">
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    </div>
                  )
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{ann.category}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(ann.created_at)}</span>
                  </div>
                  <CardTitle className="text-lg text-civic-gray-dark line-clamp-2">{ann.title}</CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {ann.event_date && (
                    <div className="flex items-center text-muted-foreground text-sm mb-1">
                      <Calendar className="h-4 w-4 mr-2 shrink-0" />
                      {ann.event_date}
                    </div>
                  )}
                  {ann.location && (
                    <div className="flex items-center text-muted-foreground text-sm mb-2">
                      <MapPin className="h-4 w-4 mr-2 shrink-0" />
                      {ann.location}
                    </div>
                  )}
                  <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                    {ann.description}
                  </p>
                  <Button
                    variant="civic-outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedAnn(ann)}
                  >
                    Read More
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center">
          <Button variant="civic" size="lg" onClick={() => navigate("/announcements")}>
            View All Announcements
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedAnn} onOpenChange={(open) => !open && setSelectedAnn(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedAnn && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{selectedAnn.category}</Badge>
                  {selectedAnn.is_pinned && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Pin className="h-3 w-3" /> Pinned
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{selectedAnn.title}</DialogTitle>
              </DialogHeader>

              {selectedAnn.image_url && (
                <div className="rounded-lg overflow-hidden my-2 bg-muted flex items-center justify-center">
                  <img src={selectedAnn.image_url} alt={selectedAnn.title} className="w-full max-h-[28rem] object-contain" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>{timeAgo(selectedAnn.created_at)}</span>
                {selectedAnn.event_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {selectedAnn.event_date}
                  </div>
                )}
                {selectedAnn.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedAnn.location}
                  </div>
                )}
              </div>

              <div className="mt-4 text-foreground whitespace-pre-line leading-relaxed">
                {selectedAnn.description}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};