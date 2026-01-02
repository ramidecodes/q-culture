import Link from "next/link";
import { GetStartedButton } from "@/components/get-started-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Quantifying Culture
          </h1>
          <p className="text-xl text-muted-foreground sm:text-2xl">
            Facilitator-led workshop application for cultural diversity
          </p>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Enable anonymous participants to input their country of origin,
            compute cultural distances using established frameworks (Lewis,
            Hall, Hofstede), and generate maximally diverse small groups (3-4
            people) for discussion and reflection.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <GetStartedButton />
            <Button variant="outline" size="lg">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features Section */}
      <section id="features" className="container py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Key Features
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools for facilitating cultural diversity workshops
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Anonymous Participation</CardTitle>
              <CardDescription>
                Participants can join workshops anonymously, ensuring privacy
                and encouraging honest input.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No registration required for participants. Simply enter your
                country of origin and join the workshop session.
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">Privacy First</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cultural Distance Computation</CardTitle>
              <CardDescription>
                Advanced algorithms using established cultural frameworks to
                measure diversity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Lewis Model</Badge>
                <Badge variant="outline">Hall Framework</Badge>
                <Badge variant="outline">Hofstede Dimensions</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">Research-Based</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimal Group Generation</CardTitle>
              <CardDescription>
                Automatically create maximally diverse small groups of 3-4
                people for meaningful discussions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our algorithm ensures each group has maximum cultural diversity,
                promoting rich conversations and diverse perspectives.
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">AI-Powered</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facilitator Dashboard</CardTitle>
              <CardDescription>
                Comprehensive tools for workshop facilitators to manage sessions
                and review reflections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create workshops, monitor participant progress, review group
                assignments, and analyze cultural diversity metrics.
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">Full Control</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reflection & Review</CardTitle>
              <CardDescription>
                Participants can submit reflections, and facilitators can review
                and provide feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Structured reflection prompts help participants process their
                cultural exchange experiences and insights.
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">Learning Focused</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                Live updates as participants join and groups are formed in
                real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Watch as your workshop comes together with live participant
                counts and group assignments.
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">Live Sync</Badge>
            </CardFooter>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Tech Stack Section */}
      <section className="container py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Built With Modern Technology
          </h2>
          <p className="text-lg text-muted-foreground">
            Leveraging the latest tools and frameworks for optimal performance
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge variant="default" className="px-4 py-2 text-sm">
            Next.js 15
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            TypeScript
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            TailwindCSS
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            ShadCN UI
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            Drizzle ORM
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            Neon
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            Clerk
          </Badge>
        </div>
      </section>
    </main>
  );
}
