import { sql } from "drizzle-orm";
import {
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const workshopStatusEnum = pgEnum("workshop_status", [
  "draft",
  "collecting",
  "grouped",
  "closed",
]);

export type WorkshopStatus = "draft" | "collecting" | "grouped" | "closed";

export const frameworkEnum = pgEnum("framework", [
  "lewis",
  "hall",
  "hofstede",
  "combined",
]);

export const workshops = pgTable("workshops", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  date: date("date"),
  joinCode: text("join_code").notNull().unique(),
  facilitatorId: text("facilitator_id").notNull(),
  status: workshopStatusEnum("status").default("collecting").notNull(),
  framework: frameworkEnum("framework"),
  groupSize: integer("group_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
});
