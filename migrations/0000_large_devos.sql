CREATE TYPE "public"."framework" AS ENUM('lewis', 'hall', 'hofstede', 'combined');--> statement-breakpoint
CREATE TYPE "public"."workshop_status" AS ENUM('draft', 'collecting', 'grouped', 'closed');--> statement-breakpoint
CREATE TABLE "countries" (
	"iso_code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hall_scores" (
	"country_code" text PRIMARY KEY NOT NULL,
	"context_high" numeric(4, 3) NOT NULL,
	"time_polychronic" numeric(4, 3) NOT NULL,
	"space_private" numeric(4, 3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hofstede_scores" (
	"country_code" text PRIMARY KEY NOT NULL,
	"power_distance" numeric(4, 3) NOT NULL,
	"individualism" numeric(4, 3) NOT NULL,
	"masculinity" numeric(4, 3) NOT NULL,
	"uncertainty_avoidance" numeric(4, 3) NOT NULL,
	"long_term_orientation" numeric(4, 3) NOT NULL,
	"indulgence" numeric(4, 3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lewis_scores" (
	"country_code" text PRIMARY KEY NOT NULL,
	"linear_active" numeric(4, 3) NOT NULL,
	"multi_active" numeric(4, 3) NOT NULL,
	"reactive" numeric(4, 3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"date" date,
	"join_code" text NOT NULL,
	"facilitator_id" text NOT NULL,
	"status" "workshop_status" DEFAULT 'draft' NOT NULL,
	"framework" "framework",
	"group_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workshops_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"country_code" text NOT NULL,
	"session_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "participants_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	CONSTRAINT "group_members_group_id_participant_id_pk" PRIMARY KEY("group_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"group_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"content" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reflections_participant_id_unique" UNIQUE("participant_id")
);
--> statement-breakpoint
ALTER TABLE "hall_scores" ADD CONSTRAINT "hall_scores_country_code_countries_iso_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("iso_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hofstede_scores" ADD CONSTRAINT "hofstede_scores_country_code_countries_iso_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("iso_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lewis_scores" ADD CONSTRAINT "lewis_scores_country_code_countries_iso_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("iso_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_country_code_countries_iso_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("iso_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;