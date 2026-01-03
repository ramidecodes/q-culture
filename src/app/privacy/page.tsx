import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function generateMetadata(): Metadata {
  return {
    title: "Privacy Policy | Quantifying Culture",
    description:
      "Quantifying Culture Privacy Policy. Learn how Quantifying Culture collects, uses, discloses, and safeguards your information when you use our facilitator-led workshop application.",
    keywords: [
      "privacy policy",
      "data protection",
      "Quantifying Culture",
      "user privacy",
    ],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      url: `${baseUrl}/privacy`,
      siteName: "Quantifying Culture",
      title: "Privacy Policy | Quantifying Culture",
      description:
        "Quantifying Culture Privacy Policy. Learn how Quantifying Culture collects, uses, discloses, and safeguards your information when you use our facilitator-led workshop application.",
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
      title: "Privacy Policy | Quantifying Culture",
      description:
        "Quantifying Culture Privacy Policy. Learn how Quantifying Culture collects, uses, discloses, and safeguards your information when you use our facilitator-led workshop application.",
      images: [`${baseUrl}/favicon.ico`],
    },
  };
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-8 text-4xl font-bold md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mb-8 text-muted-foreground">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {/* Introduction */}
            <section className="mb-16">
              <Card>
                <CardHeader>
                  <CardTitle>Introduction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">
                    Quantifying Culture ("we," "our," or "us") operates a
                    facilitator-led workshop application for cultural diversity.
                    This Privacy Policy explains how we collect, use, disclose,
                    and safeguard your information when you use our service.
                  </p>
                  <p className="text-muted-foreground">
                    By using Quantifying Culture, you agree to the collection
                    and use of information in accordance with this policy. If
                    you do not agree with our policies and practices, please do
                    not use our service.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Information We Collect */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Information We Collect
              </h2>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Information you provide directly to us
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                      <li>
                        <strong className="font-semibold text-foreground">
                          Account Information:
                        </strong>{" "}
                        Email address, username, and authentication credentials
                        managed through our authentication provider (Clerk)
                      </li>
                      <li>
                        <strong className="font-semibold text-foreground">
                          Workshop Data:
                        </strong>{" "}
                        Workshop names, descriptions, configurations, and
                        settings created by facilitators
                      </li>
                      <li>
                        <strong className="font-semibold text-foreground">
                          Participant Data:
                        </strong>{" "}
                        Country of origin, anonymous participant tokens, group
                        assignments, and reflection submissions
                      </li>
                      <li>
                        <strong className="font-semibold text-foreground">
                          Cultural Data:
                        </strong>{" "}
                        Cultural framework scores and distance calculations used
                        for group generation
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Automatically Collected Information</CardTitle>
                    <CardDescription>
                      Information collected automatically when you use our
                      service
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                      <li>
                        <strong className="font-semibold text-foreground">
                          Usage Data:
                        </strong>{" "}
                        Information about how you access and use Quantifying
                        Culture, including IP address, browser type, device
                        information, and usage patterns
                      </li>
                      <li>
                        <strong className="font-semibold text-foreground">
                          Cookies and Tracking:
                        </strong>{" "}
                        We use cookies and similar tracking technologies to
                        track activity on our service and store certain
                        information
                      </li>
                      <li>
                        <strong className="font-semibold text-foreground">
                          Log Data:
                        </strong>{" "}
                        Server logs, including timestamps, access times, and
                        error information
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                How We Use Your Information
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>
                      To provide, maintain, and improve our workshop
                      facilitation service
                    </li>
                    <li>
                      To process workshop creation and participant joining
                    </li>
                    <li>
                      To compute cultural distances and generate diverse groups
                    </li>
                    <li>
                      To communicate with you about your account and service
                      updates
                    </li>
                    <li>To detect, prevent, and address technical issues</li>
                    <li>
                      To comply with legal obligations and enforce our terms
                    </li>
                    <li>To analyze usage patterns and improve our platform</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Third-Party Services */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Third-Party Services
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle>Service Providers</CardTitle>
                  <CardDescription>
                    We use third-party services to operate and improve
                    Quantifying Culture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>
                      <strong className="font-semibold text-foreground">
                        Authentication:
                      </strong>{" "}
                      Clerk provides user authentication and account management
                      services, including support for Google OAuth sign-in.
                      Their privacy policy applies to authentication data. For
                      detailed information about how we access and use Google
                      user data, please see the "Google OAuth Data" section
                      below.
                    </li>
                    <li>
                      <strong className="font-semibold text-foreground">
                        Database:
                      </strong>{" "}
                      Neon provides PostgreSQL database hosting services. Your
                      workshop and participant data is stored securely on Neon
                      infrastructure.
                    </li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    These third-party services have their own privacy policies
                    governing the collection and use of your information. We
                    encourage you to review their privacy policies.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Google OAuth Data */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Google OAuth Data</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Google User Data Access and Usage</CardTitle>
                  <CardDescription>
                    When you sign in with Google, we access and use specific
                    Google user data as described below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-xl font-semibold">
                        Data Accessed
                      </h3>
                      <p className="mb-2 text-muted-foreground">
                        When you choose to sign in with Google, our application
                        accesses the following types of Google user data:
                      </p>
                      <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                        <li>
                          <strong className="font-semibold text-foreground">
                            Email Address:
                          </strong>{" "}
                          Your Google account email address for account creation
                          and identification
                        </li>
                        <li>
                          <strong className="font-semibold text-foreground">
                            Basic Profile Information:
                          </strong>{" "}
                          Your name and profile picture URL from your Google
                          account
                        </li>
                        <li>
                          <strong className="font-semibold text-foreground">
                            Google User ID:
                          </strong>{" "}
                          A unique identifier from Google for account linking
                          and authentication
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-3 text-xl font-semibold">Data Usage</h3>
                      <p className="mb-2 text-muted-foreground">
                        We use the Google user data we access for the following
                        purposes:
                      </p>
                      <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                        <li>
                          Account creation and authentication when you sign in
                          with Google
                        </li>
                        <li>
                          User identification and profile setup within
                          Quantifying Culture
                        </li>
                        <li>
                          Linking your Google account to your Quantifying
                          Culture user account
                        </li>
                        <li>
                          Storing minimal profile data (email address and
                          username derived from your Google profile) in our
                          database through our authentication provider, Clerk
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-3 text-xl font-semibold">
                        Data Storage
                      </h3>
                      <p className="mb-2 text-muted-foreground">
                        Google authentication data is processed and stored as
                        follows:
                      </p>
                      <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                        <li>
                          Google authentication data is processed and stored by
                          Clerk, our authentication service provider
                        </li>
                        <li>
                          We store only the Clerk user ID and derived profile
                          information (username, email address) in our Neon
                          database
                        </li>
                        <li>
                          We do not store Google passwords or Google access
                          tokens directly
                        </li>
                        <li>
                          All authentication tokens and sensitive credentials
                          are managed securely by Clerk
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-3 text-xl font-semibold">
                        Data Sharing
                      </h3>
                      <p className="mb-2 text-muted-foreground">
                        Google user data sharing practices:
                      </p>
                      <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                        <li>
                          Google user data is shared with Clerk for
                          authentication purposes only
                        </li>
                        <li>
                          We do not share Google user data with other third
                          parties except as necessary for service operation
                          (e.g., database hosting through Neon)
                        </li>
                        <li>
                          We do not sell, rent, or trade Google user data to any
                          third parties
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-3 text-xl font-semibold">
                        Data Revocation and Management
                      </h3>
                      <p className="mb-2 text-muted-foreground">
                        You have control over your Google OAuth access and can
                        revoke it at any time:
                      </p>
                      <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                        <li>
                          <strong className="font-semibold text-foreground">
                            How to Revoke Access:
                          </strong>{" "}
                          You can revoke Google OAuth access through your Google
                          Account settings at{" "}
                          <Link
                            href="https://myaccount.google.com/permissions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:text-primary/80"
                          >
                            myaccount.google.com/permissions
                          </Link>
                          , through your Quantifying Culture account settings,
                          or by contacting us using the information in the
                          Contact section below
                        </li>
                        <li>
                          <strong className="font-semibold text-foreground">
                            What Happens When Access is Revoked:
                          </strong>{" "}
                          Revoking Google OAuth access will prevent future
                          sign-ins using Google. Your existing account data will
                          remain unless you delete your account. You may need to
                          set up alternative authentication methods (such as
                          email/password) to continue accessing your account
                        </li>
                        <li>
                          <strong className="font-semibold text-foreground">
                            Data Retention After Revocation:
                          </strong>{" "}
                          Google OAuth tokens are immediately invalidated when
                          you revoke access. Profile data derived from Google
                          (email address, username) may remain in our database
                          until you request account deletion. You can request
                          full account deletion and data removal through the
                          "Your Rights" section below
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Data Storage and Security */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Data Storage and Security
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-muted-foreground">
                    We implement appropriate technical and organizational
                    measures to protect your personal information. However, no
                    method of transmission over the Internet or electronic
                    storage is 100% secure. While we strive to use commercially
                    acceptable means to protect your data, we cannot guarantee
                    absolute security.
                  </p>
                  <p className="text-muted-foreground">
                    Your data is stored on secure servers provided by our
                    third-party service providers (Neon for database, Clerk for
                    authentication), who maintain industry-standard security
                    practices.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Your Rights */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Your Rights</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-muted-foreground">
                    Depending on your location, you may have certain rights
                    regarding your personal information, including:
                  </p>
                  <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                    <li>
                      <strong className="font-semibold text-foreground">
                        Access:
                      </strong>{" "}
                      Request access to your personal information
                    </li>
                    <li>
                      <strong className="font-semibold text-foreground">
                        Correction:
                      </strong>{" "}
                      Request correction of inaccurate or incomplete information
                    </li>
                    <li>
                      <strong className="font-semibold text-foreground">
                        Deletion:
                      </strong>{" "}
                      Request deletion of your personal information
                    </li>
                    <li>
                      <strong className="font-semibold text-foreground">
                        Portability:
                      </strong>{" "}
                      Request transfer of your data to another service
                    </li>
                    <li>
                      <strong className="font-semibold text-foreground">
                        Objection:
                      </strong>{" "}
                      Object to processing of your personal information
                    </li>
                    <li>
                      <strong className="font-semibold text-foreground">
                        Withdrawal:
                      </strong>{" "}
                      Withdraw consent where processing is based on consent
                    </li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    To exercise these rights, please contact us using the
                    information provided in the Contact section below.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Cookies */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Cookies</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-muted-foreground">
                    We use cookies and similar tracking technologies to track
                    activity on our service and hold certain information.
                    Cookies are files with a small amount of data that may
                    include an anonymous unique identifier.
                  </p>
                  <p className="text-muted-foreground">
                    You can instruct your browser to refuse all cookies or to
                    indicate when a cookie is being sent. However, if you do not
                    accept cookies, you may not be able to use some portions of
                    our service.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Data Retention */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">Data Retention</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    We retain your personal information for as long as necessary
                    to fulfill the purposes outlined in this Privacy Policy,
                    unless a longer retention period is required or permitted by
                    law. When you delete your account, we will delete or
                    anonymize your personal information, except where we are
                    required to retain it for legal purposes.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Children's Privacy */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Children's Privacy
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    Our service is not intended for children under the age of
                    13. We do not knowingly collect personal information from
                    children under 13. If you are a parent or guardian and
                    believe your child has provided us with personal
                    information, please contact us immediately.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-semibold">
                Changes to This Privacy Policy
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    We may update our Privacy Policy from time to time. We will
                    notify you of any changes by posting the new Privacy Policy
                    on this page and updating the "Last updated" date. You are
                    advised to review this Privacy Policy periodically for any
                    changes.
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
                    If you have any questions about this Privacy Policy, please
                    contact us:
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="font-semibold text-foreground">
                      Quantifying Culture
                    </strong>
                    <br />
                    Email: privacy@quantifyingculture.com
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
