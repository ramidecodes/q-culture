import { pgTable, text, numeric } from "drizzle-orm/pg-core";
import { countries } from "./countries";

export const lewisScores = pgTable("lewis_scores", {
  countryCode: text("country_code")
    .primaryKey()
    .references(() => countries.isoCode),
  linearActive: numeric("linear_active", { precision: 4, scale: 3 }).notNull(),
  multiActive: numeric("multi_active", { precision: 4, scale: 3 }).notNull(),
  reactive: numeric("reactive", { precision: 4, scale: 3 }).notNull(),
});

export const hallScores = pgTable("hall_scores", {
  countryCode: text("country_code")
    .primaryKey()
    .references(() => countries.isoCode),
  contextHigh: numeric("context_high", { precision: 4, scale: 3 }).notNull(),
  timePolychronic: numeric("time_polychronic", {
    precision: 4,
    scale: 3,
  }).notNull(),
  spacePrivate: numeric("space_private", { precision: 4, scale: 3 }).notNull(),
});

export const hofstedeScores = pgTable("hofstede_scores", {
  countryCode: text("country_code")
    .primaryKey()
    .references(() => countries.isoCode),
  powerDistance: numeric("power_distance", {
    precision: 4,
    scale: 3,
  }).notNull(),
  individualism: numeric("individualism", { precision: 4, scale: 3 }).notNull(),
  masculinity: numeric("masculinity", { precision: 4, scale: 3 }).notNull(),
  uncertaintyAvoidance: numeric("uncertainty_avoidance", {
    precision: 4,
    scale: 3,
  }).notNull(),
  longTermOrientation: numeric("long_term_orientation", {
    precision: 4,
    scale: 3,
  }).notNull(),
  indulgence: numeric("indulgence", { precision: 4, scale: 3 }).notNull(),
});
