import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { participants } from "./participants";
import { groups } from "./groups";

export const reflections = pgTable("reflections", {
  id: uuid("id").defaultRandom().primaryKey(),
  participantId: uuid("participant_id")
    .notNull()
    .unique()
    .references(() => participants.id),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
