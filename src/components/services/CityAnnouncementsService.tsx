import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Calendar, MapPin, Search, Pin, Loader2, ExternalLink, ImageIcon } from "lucide-react";
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

const PAGE_SIZE = 6;

const CATEGORIES = ["All", "General", "Event", "Health", "Public Hearing", "Festival", "Emergency", "Infrastructure"];

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

export const CityAnnouncementsService = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("city_announcements")
        .select("*")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data) setAnnouncements(data as Announcement[]);
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeCategory]);

  const filtered = useMemo(() => {
    let result = announcements;

    // Category filter
    if (activeCategory !== "All") {
      result = result.filter((a) => a.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }

    return result;
  }, [announcements, searchQuery, activeCategory]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Megaphone className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">City Announcements</h2>
        <p className="text-muted-foreground">Stay updated with the latest news, events, and public notices</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "civic" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-civic-blue" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {searchQuery || activeCategory !== "All"
            ? "No announcements match your search."
            : "No announcements at the moment."}
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((ann) => (
            <Card key={ann.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                {ann.image_url && (
                  <div className="sm:w-48 h-40 sm:h-auto shrink-0 overflow-hidden">
                    <img src={ann.image_url} alt={ann.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{ann.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{timeAgo(ann.created_at)}</span>
                          {ann.event_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {ann.event_date}
                            </div>
                          )}
                          {ann.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {ann.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ann.is_pinned && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Pin className="h-3 w-3" /> Pinned
                          </Badge>
                        )}
                        <Badge variant="secondary">{ann.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-2">{ann.description}</CardDescription>
                    <Button
                      variant="civic-outline"
                      size="sm"
                      onClick={() => setSelectedAnn(ann)}
                    >
                      Read More
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button variant="civic" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Load More Announcements ({filtered.length - visibleCount} remaining)
          </Button>
        </div>
      )}

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
    </div>
  );
};