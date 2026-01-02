"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  submitReflection,
  getParticipantReflection,
} from "@/lib/actions/reflection-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_LENGTH = 1000;

const reflectionSchema = z.object({
  content: z
    .string()
    .min(1, "Reflection cannot be empty")
    .max(MAX_LENGTH, `Reflection must be ${MAX_LENGTH} characters or less`),
});

type ReflectionFormProps = {
  token: string;
};

export function ReflectionForm({ token }: ReflectionFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [existingReflection, setExistingReflection] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      content: "",
    },
  });

  const content = form.watch("content");
  const charCount = content?.length ?? 0;
  const remaining = MAX_LENGTH - charCount;

  useEffect(() => {
    async function checkExistingReflection() {
      try {
        const reflection = await getParticipantReflection(token);
        if (reflection) {
          setExistingReflection(reflection.content);
          setSubmitted(true);
        }
      } catch (error) {
        console.error("Error checking existing reflection:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkExistingReflection();
  }, [token]);

  async function onSubmit(data: z.infer<typeof reflectionSchema>) {
    setSubmitError(null);
    setSubmitSuccess(false);

    const result = await submitReflection(token, data.content);

    if ("error" in result) {
      setSubmitError(result.error);
      return;
    }

    setSubmitted(true);
    setExistingReflection(data.content);
    setSubmitSuccess(true);
    form.reset();
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (submitted && existingReflection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Reflection</CardTitle>
          <CardDescription>
            Your reflection has been submitted and cannot be edited.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="whitespace-pre-wrap text-sm">{existingReflection}</p>
          </div>
          {submitSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-4">
              Reflection submitted successfully!
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Reflection</CardTitle>
        <CardDescription>
          Share your thoughts and insights from the group discussion. Your
          reflection will be visible to the facilitator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Reflection</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your thoughts and insights from the group discussion..."
                      rows={10}
                      maxLength={MAX_LENGTH}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    Reflect on your group discussion experience and share any
                    insights or observations.
                  </FormDescription>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>
                      {form.formState.errors.content && <FormMessage />}
                      {submitError && (
                        <p className="text-destructive">{submitError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          remaining < 50 && remaining >= 0
                            ? "text-orange-600 dark:text-orange-400"
                            : remaining < 0
                              ? "text-destructive"
                              : ""
                        }
                      >
                        {charCount} / {MAX_LENGTH} characters
                      </span>
                      {remaining < 50 && remaining >= 0 && (
                        <span className="text-orange-600 dark:text-orange-400">
                          ({remaining} remaining)
                        </span>
                      )}
                    </div>
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={submitted || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Submitting..."
                : "Submit Reflection"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
