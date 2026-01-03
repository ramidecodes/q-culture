"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  saveGroupingConfig,
  type GroupSize,
} from "@/lib/actions/grouping-actions";
import type { Framework } from "@/types/cultural";

const configSchema = z.object({
  framework: z.enum(["lewis", "hall", "hofstede", "combined"]),
  groupSize: z.union([z.literal(3), z.literal(4), z.null()]),
});

type ConfigFormData = z.infer<typeof configSchema>;

type GroupingConfigFormProps = {
  workshopId: string;
  currentConfig?: {
    framework?: Framework | null;
    groupSize?: GroupSize;
  };
  disabled?: boolean;
};

export function GroupingConfigForm({
  workshopId,
  currentConfig,
  disabled = false,
}: GroupingConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      framework:
        (currentConfig?.framework as Framework | undefined) || "combined",
      groupSize: currentConfig?.groupSize ?? null,
    },
  });

  async function onSubmit(data: ConfigFormData) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await saveGroupingConfig(workshopId, data);

      if ("error" in result) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setIsSubmitting(false);
    } catch (_err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="framework"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cultural Framework</FormLabel>
              <FormDescription>
                Choose which cultural framework to use for grouping
                participants. Each framework emphasizes different cultural
                dimensions.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lewis" id="lewis" />
                    <Label
                      htmlFor="lewis"
                      className="font-normal cursor-pointer"
                    >
                      Lewis Framework
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hall" id="hall" />
                    <Label
                      htmlFor="hall"
                      className="font-normal cursor-pointer"
                    >
                      Hall Framework
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hofstede" id="hofstede" />
                    <Label
                      htmlFor="hofstede"
                      className="font-normal cursor-pointer"
                    >
                      Hofstede Framework
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="combined" id="combined" />
                    <Label
                      htmlFor="combined"
                      className="font-normal cursor-pointer"
                    >
                      Combined (All Frameworks)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Size</FormLabel>
              <FormDescription>
                Select the desired number of participants per group. Flexible
                option prefers 4 participants but allows 3 when needed.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) =>
                    field.onChange(
                      value === "flexible" ? null : Number.parseInt(value, 10)
                    )
                  }
                  value={field.value?.toString() ?? "flexible"}
                  disabled={disabled}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="size3" />
                    <Label
                      htmlFor="size3"
                      className="font-normal cursor-pointer"
                    >
                      3 participants
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="size4" />
                    <Label
                      htmlFor="size4"
                      className="font-normal cursor-pointer"
                    >
                      4 participants
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label
                      htmlFor="flexible"
                      className="font-normal cursor-pointer"
                    >
                      Flexible (3-4 participants)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="text-sm font-medium text-destructive">{error}</div>
        )}

        {success && (
          <div className="text-sm font-medium text-green-600 dark:text-green-400">
            Configuration saved successfully!
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || disabled}>
          {isSubmitting ? "Saving..." : "Save Configuration"}
        </Button>
      </form>
    </Form>
  );
}
