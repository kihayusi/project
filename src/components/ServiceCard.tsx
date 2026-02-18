import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "default" | "emergency";
  onClick?: () => void;
}

export const ServiceCard = ({ title, description, icon: Icon, variant = "default", onClick }: ServiceCardProps) => {
  return (
    <Card className={`group hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 bg-[var(--gradient-card)] ${variant === "emergency" ? "border-2 border-destructive" : "border-civic-gray"}`}>
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto mb-4 p-4 rounded-full transition-colors duration-300 ${
          variant === "emergency" 
            ? "bg-destructive/10 group-hover:bg-destructive/20" 
            : "bg-civic-blue/10 group-hover:bg-civic-blue/20"
        }`}>
          <Icon className={`h-8 w-8 ${variant === "emergency" ? "text-destructive animate-pulse" : "text-civic-blue"}`} />
        </div>
        <CardTitle className={`text-lg font-semibold ${variant === "emergency" ? "text-destructive" : "text-civic-gray-dark"}`}>
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          className={`w-full ${variant === "emergency" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
          variant={variant === "emergency" ? "emergency" : "civic-outline"}
          onClick={onClick}
        >
          {variant === "emergency" ? "Emergency Access" : "Access Service"}
        </Button>
      </CardContent>
    </Card>
  );
};