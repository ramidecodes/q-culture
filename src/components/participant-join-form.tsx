"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/country-select";
import { joinWorkshop } from "@/lib/actions/participant-actions";

const joinSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  countryCode: z.string().min(2, "Country is required"),
});

type JoinFormData = z.infer<typeof joinSchema>;

type Country = {
  isoCode: string;
  name: string;
};

type ParticipantJoinFormProps = {
  joinCode: string;
  countries: Country[];
};

export function ParticipantJoinForm({
  joinCode,
  countries,
}: ParticipantJoinFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      name: "",
      countryCode: "",
    },
  });

  async function onSubmit(data: JoinFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await joinWorkshop(joinCode, data);

      if ("error" in result) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      if ("success" in result && result.success) {
        // Redirect to participant status page (to be implemented)
        router.push(`/participant/${result.token}`);
      }
    } catch (err) {
      console.error("Error joining workshop:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Workshop</CardTitle>
        <CardDescription>
          Enter your name and select your country to join the workshop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Country</FormLabel>
                  <FormControl>
                    <CountrySelect
                      value={field.value}
                      onValueChange={field.onChange}
                      countries={countries}
                      disabled={isSubmitting}
                      placeholder="Select your country"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Joining..." : "Join Workshop"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
