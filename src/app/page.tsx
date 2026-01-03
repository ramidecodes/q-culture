import Link from "next/link";
import { GetStartedButton } from "@/components/get-started-button";
import { HeroNetworkGraph } from "@/components/hero-network-graph";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Users,
  Globe,
  Network,
  LayoutDashboard,
  BookOpen,
  Zap,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Users,
      title: "Anonymous Participation",
      description:
        "Participants join workshops anonymously, ensuring privacy and encouraging honest input without registration barriers.",
    },
    {
      icon: Globe,
      title: "Cultural Distance Computation",
      description:
        "Advanced algorithms using established frameworks (Lewis, Hall, Hofstede) to measure and visualize cultural diversity.",
    },
    {
      icon: Network,
      title: "Optimal Group Generation",
      description:
        "Automatically create maximally diverse small groups of 3-4 people for meaningful cross-cultural discussions.",
    },
    {
      icon: LayoutDashboard,
      title: "Facilitator Dashboard",
      description:
        "Comprehensive tools to manage sessions, monitor progress, review group assignments, and analyze diversity metrics.",
    },
    {
      icon: BookOpen,
      title: "Reflection & Review",
      description:
        "Structured reflection prompts help participants process their cultural exchange experiences and insights.",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description:
        "Live updates as participants join and groups are formed in real-time, keeping everyone synchronized.",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
        {/* Background Graph */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <HeroNetworkGraph />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
              Quantifying Culture
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground sm:text-2xl">
              Facilitator-led workshop application for cultural diversity
            </p>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              Enable anonymous participants to input their country of origin,
              compute cultural distances using established frameworks, and
              generate maximally diverse small groups for discussion and
              reflection.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <GetStartedButton />
            <Button variant="outline" size="lg" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Key Features
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful tools for facilitating cultural diversity workshops
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
