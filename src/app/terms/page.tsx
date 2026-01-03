import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function generateMetadata(): Metadata {
  return {
    title: "Terms of Service | Quantifying Culture",
    description:
      "Quantifying Culture Terms of Service. Read the terms and conditions governing your use of Quantifying Culture, a facilitator-led workshop application for cultural diversity.",
    keywords: [
      "terms of service",
      "terms and conditions",
      "Quantifying Culture",
      "legal",
    ],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      url: `${baseUrl}/terms`,
      siteName: "Quantifying Culture",
      title: "Terms of Service | Quantifying Culture",
      description:
        "Quantifying Culture Terms of Service. Read the terms and conditions governing your use of Quantifying Culture, a facilitator-led workshop application for cultural diversity.",
      images: [
        {
          url: `${baseUrl}/favicon.ico`,
          width: 32,
          height: 32,
          alt: "Quantifying Culture",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: "Terms of Service | Quantifying Culture",
      description:
        "Quantifying Culture Terms of Service. Read the terms and conditions governing your use of Quantifying Culture, a facilitator-led workshop application for cultural diversity.",
      images: [`${baseUrl}/favicon.ico`],
    },
  };
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-8 text-4xl font-bold md:text-5xl">
              Terms of Service
            </h1>
            <p className="mb-8 text-muted-foreground">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {/* Agreement to Terms */}
            <section className="mb-16">
              <Card>
                <CardHeader>
                  <CardTitle>Agreement to Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">
                    These Terms of Service ("Terms") constitute a legally
                    binding agreement between you and Quantifying Culture ("we,"
                    "our," or "us") regarding your use of Quantifying Culture, a
                    facilitator-led workshop application for cultural diversity
                    (the "Service").
                  </p>
                  <p className="text-muted-foreground">
                    By accessing or using Quantifying Culture, you agree to be
                    bound by these Terms. If you disagree with any part of these
                    Terms, then you may not access or use the Service.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Service Description */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Service Description
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-muted-foreground">
                    Quantifying Culture is a facilitator-led workshop
                    application that provides:
                  </p>
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>
                      Anonymous participant registration and workshop joining
                    </li>
                    <li>
                      Cultural distance computation using established frameworks
                      (Lewis, Hall, Hofstede)
                    </li>
                    <li>
                      Optimal group generation algorithms for creating maximally
                      diverse small groups
                    </li>
                    <li>
                      Facilitator dashboard for workshop management and
                      participant monitoring
                    </li>
                    <li>
                      Reflection submission and review tools for participants
                      and facilitators
                    </li>
                    <li>
                      Real-time updates and cultural visualization features
                    </li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    We reserve the right to modify, suspend, or discontinue any
                    aspect of the Service at any time, with or without notice.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* User Accounts */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">User Accounts</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Account Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>
                      You must be at least 13 years old to create an account
                    </li>
                    <li>
                      You must provide accurate, current, and complete
                      information during registration
                    </li>
                    <li>
                      You are responsible for maintaining the confidentiality of
                      your account credentials
                    </li>
                    <li>
                      You are responsible for all activities that occur under
                      your account
                    </li>
                    <li>
                      You must notify us immediately of any unauthorized use of
                      your account
                    </li>
                    <li>
                      Participants may join workshops anonymously without
                      creating an account
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* User Obligations */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">User Obligations</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Acceptable Use</CardTitle>
                  <CardDescription>
                    You agree to use the Service only for lawful purposes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">You agree not to:</p>
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>
                      Violate any applicable laws, regulations, or third-party
                      rights
                    </li>
                    <li>
                      Use the Service to transmit harmful, offensive, or
                      inappropriate content
                    </li>
                    <li>
                      Attempt to gain unauthorized access to the Service or its
                      systems
                    </li>
                    <li>
                      Interfere with or disrupt the Service or servers connected
                      to the Service
                    </li>
                    <li>
                      Use automated systems (bots, scrapers, etc.) to access the
                      Service without permission
                    </li>
                    <li>
                      Reverse engineer, decompile, or disassemble any part of
                      the Service
                    </li>
                    <li>
                      Create multiple accounts to circumvent restrictions or
                      abuse the Service
                    </li>
                    <li>
                      Share your account credentials with others or allow others
                      to access your account
                    </li>
                    <li>
                      Provide false or misleading information about your country
                      of origin or cultural background
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Intellectual Property */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Intellectual Property
              </h2>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Ownership</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      The Service, including its original content, features, and
                      functionality, is owned by Quantifying Culture and is
                      protected by international copyright, trademark, patent,
                      trade secret, and other intellectual property laws.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground">
                      You retain ownership of content you create within the
                      Service, including workshops, participant data, reflections,
                      and group assignments. However, by using the Service, you
                      grant Quantifying Culture a worldwide, non-exclusive,
                      royalty-free license to:
                    </p>
                    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                      <li>
                        Store, process, and display your content on the Service
                      </li>
                      <li>
                        Use your content to provide, maintain, and improve the
                        Service
                      </li>
                      <li>Create backups and ensure data availability</li>
                    </ul>
                    <p className="mt-4 text-muted-foreground">
                      You represent and warrant that you have all necessary
                      rights to grant this license and that your content does
                      not infringe upon any third-party rights.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Payments and Subscriptions */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Payments and Subscriptions
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    Currently, Quantifying Culture is provided as a free
                    service. If we introduce paid features or subscriptions in
                    the future, we will update these Terms and provide notice
                    to users. Any future payment terms will be clearly disclosed
                    before you are charged.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Disclaimers */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Disclaimers</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-muted-foreground">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                    WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
                    BUT NOT LIMITED TO:
                  </p>
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>
                      Implied warranties of merchantability, fitness for a
                      particular purpose, and non-infringement
                    </li>
                    <li>
                      Warranties that the Service will be uninterrupted, secure,
                      or error-free
                    </li>
                    <li>
                      Warranties regarding the accuracy, reliability, or quality
                      of any content or information obtained through the Service
                    </li>
                    <li>
                      Warranties that defects will be corrected or that the
                      Service is free of viruses or other harmful components
                    </li>
                    <li>
                      Warranties regarding the accuracy of cultural distance
                      calculations or group assignment algorithms
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Limitation of Liability
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-muted-foreground">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, QUANTIFYING CULTURE
                    SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                    CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                    LIMITED TO:
                  </p>
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>Loss of profits, data, or use</li>
                    <li>Business interruption</li>
                    <li>Personal injury or property damage</li>
                    <li>Loss of goodwill or reputation</li>
                    <li>
                      Issues arising from cultural distance calculations or group
                      assignments
                    </li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    Our total liability for any claims arising from or related
                    to the Service shall not exceed the amount you paid to us in
                    the twelve (12) months preceding the claim, or $100,
                    whichever is greater. If you have not paid us anything, our
                    total liability shall not exceed $100.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Indemnification */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Indemnification</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    You agree to indemnify, defend, and hold harmless Quantifying
                    Culture and its officers, directors, employees, and agents
                    from and against any claims, liabilities, damages, losses,
                    and expenses, including reasonable attorneys' fees, arising
                    out of or in any way connected with your use of the Service,
                    your violation of these Terms, or your violation of any
                    third-party rights.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Termination */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Termination</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Termination Rights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>
                      You may terminate your account at any time by contacting
                      us or using account deletion features
                    </li>
                    <li>
                      We may terminate or suspend your account immediately,
                      without prior notice, for conduct that we believe violates
                      these Terms or is harmful to other users, us, or third
                      parties
                    </li>
                    <li>
                      Upon termination, your right to use the Service will cease
                      immediately
                    </li>
                    <li>
                      We may delete your account and associated data after a
                      reasonable period following termination
                    </li>
                    <li>
                      Provisions of these Terms that by their nature should
                      survive termination shall survive, including ownership
                      provisions, warranty disclaimers, and limitations of
                      liability
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Governing Law */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Governing Law</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    These Terms shall be governed by and construed in accordance
                    with the laws of the jurisdiction in which Quantifying
                    Culture operates, without regard to its conflict of law
                    provisions. Any disputes arising from or relating to these
                    Terms or the Service shall be subject to the exclusive
                    jurisdiction of the courts in that jurisdiction.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Changes to Terms */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Changes to Terms</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    We reserve the right to modify or replace these Terms at any
                    time. If a revision is material, we will provide at least 30
                    days' notice prior to any new terms taking effect. What
                    constitutes a material change will be determined at our sole
                    discretion. By continuing to access or use the Service after
                    those revisions become effective, you agree to be bound by
                    the revised terms.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Severability */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Severability</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    If any provision of these Terms is held to be invalid or
                    unenforceable by a court, the remaining provisions of these
                    Terms will remain in effect. The invalid or unenforceable
                    provision will be replaced with a valid, enforceable
                    provision that most closely matches the intent of the
                    original provision.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Contact */}
            <section>
              <h2 className="mb-6 text-3xl font-semibold">Contact Us</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-muted-foreground">
                    If you have any questions about these Terms of Service,
                    please contact us:
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="font-semibold text-foreground">
                      Quantifying Culture
                    </strong>
                    <br />
                    Email: legal@quantifyingculture.com
                  </p>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
