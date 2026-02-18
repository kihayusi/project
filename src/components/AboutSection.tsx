import { FileText, MessageSquare, Megaphone, ShieldCheck, Clock, Users } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Document Requests",
    description: "Request official city documents — permits, clearances, certificates — without visiting the office.",
  },
  {
    icon: MessageSquare,
    title: "Citizen Concerns",
    description: "Report infrastructure issues, public order concerns, and community problems directly to city officials.",
  },
  {
    icon: Megaphone,
    title: "City Announcements",
    description: "Stay up to date with official announcements, public hearings, events, and emergency alerts.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Verified",
    description: "All requests are linked to your account so your data stays private and your submissions are trackable.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Monitor the status of every request you submit — from pending to resolved — in one dashboard.",
  },
  {
    icon: Users,
    title: "Built for Every Citizen",
    description: "Designed for residents of San Carlos City, Pangasinan to access government services with ease.",
  },
];

const steps = [
  { step: "01", title: "Create an Account", description: "Sign up with your email or Google account in seconds." },
  { step: "02", title: "Choose a Service", description: "Browse city services and select the one you need." },
  { step: "03", title: "Submit Your Request", description: "Fill out a simple form and submit — no paperwork needed." },
  { step: "04", title: "Track & Receive", description: "Monitor your request status and get notified when it's processed." },
];

export const AboutSection = () => {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        {/* What is CityLife */}
        <div className="text-center mb-16">

          <h2 className="text-4xl font-bold text-civic-gray-dark mb-4">
            What is <span className="text-civic-blue">CityLife</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            CityLife is the official digital services portal of <strong>San Carlos City, Pangasinan</strong>. It
            connects citizens with local government services — enabling you to submit requests, report concerns,
            and receive city announcements entirely online, anytime and anywhere.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4 p-6 rounded-xl border bg-muted/30 hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-lg bg-civic-blue/10">
                <f.icon className="h-5 w-5 text-civic-blue" />
              </div>
              <div>
                <h3 className="font-semibold text-civic-gray-dark mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="text-center mb-12">
          <span className="inline-block bg-civic-green/10 text-civic-green text-sm font-semibold px-4 py-1 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-4xl font-bold text-civic-gray-dark mb-4">Simple. Fast. Transparent.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Get started in minutes and manage all your city service interactions in one place.
          </p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Horizontal connector line behind the step circles */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gradient-to-r from-civic-blue/20 via-civic-blue/40 to-civic-blue/20 z-0" />
          {steps.map((s) => (
            <div key={s.step} className="relative z-10 text-center p-6 rounded-xl border bg-white hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-civic-blue text-white font-bold text-lg mb-4 ring-4 ring-white">
                {s.step}
              </div>
              <h3 className="font-semibold text-civic-gray-dark mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
