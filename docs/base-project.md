Quantifying Culture is a facilitator-led workshop web application that enables anonymous participants to input their country of origin, computes cultural distances using established frameworks (Lewis, Hall, Hofstede), and generates maximally diverse small groups (3–4 people) for discussion and reflection.

## Tech Stack

- NextJS
- Auth: Clerk
- DB: Neon
- ORM: Drizzle
- Styles: Tailwind
- Component Library: ShadCN
- Package manager: PNPM
- Formatter / Linter: Biome

Below is a comprehensive Product Requirement Document (PRD) for Quantifying Culture, structured explicitly as a collection of Feature Requirement Documents (FREDs).
This is written as a build-ready spec: each feature is scoped, testable, and independently implementable, while together covering the full application lifecycle.

⸻

Product Requirement Document

Quantifying Culture

⸻

Product Overview

Quantifying Culture is a facilitator-led workshop web application that enables anonymous participants to input their country of origin, computes cultural distances using established frameworks (Lewis, Hall, Hofstede), and generates maximally diverse small groups (3–4 people) for discussion and reflection.

The product is optimized for:
• Low participant friction (no login, one-time input)
• Deterministic, explainable grouping
• Facilitator control and clarity
• Educational and reflective outcomes, not analytics surveillance

⸻

User Types

Facilitator
• Authenticated user
• Creates and manages workshops
• Controls workshop progression and grouping
• Views all outputs and reflections

Participant
• Anonymous, session-scoped user
• Joins via link or code
• Inputs name and country once
• Views group assignment
• Submits reflection feedback

⸻

Feature Requirement Documents (FREDs)

⸻

FRED-01: Facilitator Account Creation & Authentication

Feature Name

Facilitator Authentication

Goal

Allow facilitators to securely authenticate and access workshop management features.

User Story

As a facilitator, I want to sign in to the application, so that I can create and manage my workshops securely.

Functional Requirements
• The system must support facilitator sign-up and sign-in.
• Only authenticated facilitators can access facilitator routes.
• Each facilitator must be uniquely identifiable.
• A facilitator session must persist across page reloads.

Data Requirements
• Store facilitator identity via external authentication provider.
• Associate workshop sessions with a single facilitator identifier.

User Flow 1. User navigates to facilitator login page. 2. User signs up or logs in. 3. User is redirected to facilitator dashboard.

Acceptance Criteria
• Unauthenticated users cannot access facilitator pages.
• Authenticated facilitators can access their dashboard.
• Each workshop is associated with exactly one facilitator.

Edge Cases
• Facilitator attempts to access workshop they did not create.
• Expired or invalid authentication session.

Non-Functional Requirements
• Authentication must follow industry-standard security practices.
• Login latency < 2 seconds.

⸻

FRED-02: Workshop Creation

Feature Name

Workshop Creation

Goal

Enable facilitators to create a new workshop session that participants can join.

User Story

As a facilitator, I want to create a workshop, so that participants can join and contribute their inputs.

Functional Requirements
• Facilitator can create a workshop with:
• Title
• Optional date
• System must generate a unique join code or link.
• Workshop starts in draft state.

Data Requirements
• New workshop record with status, join code, facilitator ID.

User Flow 1. Facilitator clicks “Create Workshop”. 2. Facilitator enters workshop details. 3. System creates workshop and displays join link.

Acceptance Criteria
• Workshop appears in facilitator dashboard.
• Join link/code is unique and usable.

Edge Cases
• Duplicate join code collision.
• Facilitator refreshes during creation.

⸻

FRED-03: Workshop State Management

Feature Name

Workshop Lifecycle Control

Goal

Allow facilitators to control workshop progression through defined phases.

User Story

As a facilitator, I want to advance the workshop through phases, so that activities happen in the correct order.

Functional Requirements
• Workshop must support states:
• Draft
• Collecting
• Grouped
• Closed
• Facilitator can manually advance state forward only.
• Participants’ permissions depend on workshop state.

Data Requirements
• Workshop status field.

User Flow 1. Facilitator views workshop. 2. Facilitator advances state. 3. System updates available actions.

Acceptance Criteria
• Participants cannot join when workshop is closed.
• Grouping cannot occur before collection phase ends.

Edge Cases
• Facilitator refreshes mid-transition.
• Attempt to regress workshop state.

⸻

FRED-04: Anonymous Participant Join

Feature Name

Anonymous Session Join

Goal

Allow participants to join a workshop without authentication.

User Story

As a participant, I want to join a workshop anonymously, so that I can participate without creating an account.

Functional Requirements
• Participants can join via join code or link.
• Participants must provide:
• Display name
• Country
• Inputs are allowed only once.
• System assigns an anonymous session token.

Data Requirements
• Participant record scoped to workshop.
• Anonymous token stored securely.

User Flow 1. Participant opens join link. 2. Participant enters name and selects country. 3. Submission is stored. 4. Participant is redirected to status page.

Acceptance Criteria
• Participant cannot re-edit inputs.
• Participant remains identified via token.

Edge Cases
• Participant refreshes after submission.
• Participant opens link in multiple tabs.

⸻

FRED-05: Country & Cultural Framework Reference Data

Feature Name

Cultural Reference Data Management

Goal

Provide standardized cultural scores for each country across models.

User Story

As a system, I want to map countries to cultural dimensions, so that distances can be computed consistently.

Functional Requirements
• Maintain canonical country list.
• Each country must have:
• ISO code (if available)
• Lewis scores
• Hall scores
• Hofstede scores
• Reference data is read-only at runtime.

Data Requirements
• Country table
• One table per framework, keyed by country

User Flow
• Not user-facing; used internally.

Acceptance Criteria
• All selectable countries have complete cultural data.
• No runtime edits are allowed.

Edge Cases
• Missing data for a country.
• Deprecated or renamed countries.

⸻

FRED-06: Participant Collection Overview (Facilitator)

Feature Name

Participant Overview

Goal

Allow facilitators to monitor participant input during collection.

User Story

As a facilitator, I want to see who has joined the workshop, so that I know when to proceed.

Functional Requirements
• Show list of participants.
• Show country distribution summary.
• No cultural scoring shown yet.

Data Requirements
• Read participant records.

User Flow 1. Facilitator opens workshop. 2. Views participant list updating in real-time or on refresh.

Acceptance Criteria
• Participant count matches actual submissions.
• No participant can be edited.

Edge Cases
• Duplicate names.
• Late joins near phase transition.

⸻

FRED-07: Group Generation Configuration

Feature Name

Grouping Configuration

Goal

Allow facilitators to control grouping parameters.

User Story

As a facilitator, I want to choose grouping rules, so that group composition matches my workshop needs.

Functional Requirements
• Facilitator selects:
• Cultural framework (Lewis / Hall / Hofstede / Combined)
• Group size (3, 4, or flexible 3–4)
• Configuration must be locked once grouping starts.

Data Requirements
• Grouping configuration fields on workshop.

User Flow 1. Facilitator opens grouping tab. 2. Selects parameters. 3. Confirms grouping.

Acceptance Criteria
• Configuration cannot be changed after grouping.
• Invalid combinations are blocked.

Edge Cases
• Too few participants for group size.
• Odd remainder handling.

⸻

FRED-08: Cultural Distance Computation

Feature Name

Cultural Distance Engine

Goal

Compute normalized cultural distances between participants.

User Story

As a system, I want to compute distances objectively, so that grouping is explainable and consistent.

Functional Requirements
• Normalize all dimensions to [0,1].
• Compute pairwise distances using selected model.
• Results must be deterministic.

Data Requirements
• Temporary computation structures (not persisted).

User Flow
• System-only process triggered during grouping.

Acceptance Criteria
• Same inputs always yield same distances.

Edge Cases
• Identical countries.
• All participants from same culture.

⸻

FRED-09: Group Assignment

Feature Name

Group Generation

Goal

Generate maximally diverse groups.

User Story

As a facilitator, I want participants grouped diversely, so that discussions benefit from cultural contrast.

Functional Requirements
• Groups must respect chosen size.
• Every participant assigned to exactly one group.
• Algorithm must be deterministic.

Data Requirements
• Groups table
• Group-member join table

User Flow 1. Facilitator clicks “Generate Groups”. 2. System computes and persists groups. 3. Participants are notified of assignment.

Acceptance Criteria
• No unassigned participants.
• No group exceeds size constraints.

Edge Cases
• Remainder participants.
• Minimal participant count.

⸻

FRED-10: Participant Group View

Feature Name

Group Assignment View

Goal

Allow participants to see their assigned group.

User Story

As a participant, I want to know my group, so that I can participate in discussions.

Functional Requirements
• Display group number.
• Optionally show group member names.
• Read-only.

Data Requirements
• Read group membership.

User Flow 1. Participant opens status page. 2. Sees group assignment.

Acceptance Criteria
• Correct group shown.
• No access to other groups.

Edge Cases
• Participant loads page before grouping.

⸻

FRED-11: Reflection Submission

Feature Name

Participant Feedback

Goal

Collect reflections after group discussion.

User Story

As a participant, I want to submit feedback, so that my reflections are recorded.

Functional Requirements
• Text-only input.
• One submission per participant.
• Submission allowed only after grouping.

Data Requirements
• Feedback table.

User Flow 1. Participant opens feedback page. 2. Enters text. 3. Submits feedback.

Acceptance Criteria
• Feedback saved once.
• Participant cannot edit after submit.

Edge Cases
• Empty submission.
• Network interruption on submit.

⸻

FRED-12: Facilitator Reflection Review

Feature Name

Reflection Review

Goal

Allow facilitators to review group reflections.

User Story

As a facilitator, I want to read group feedback, so that I can reflect on workshop outcomes.

Functional Requirements
• View feedback grouped by group.
• No editing.
• Available only after feedback phase.

Data Requirements
• Read feedback records.

User Flow 1. Facilitator opens reflection tab. 2. Reviews submissions.

Acceptance Criteria
• Feedback correctly grouped.
• Only facilitator can view.

Edge Cases
• Missing feedback from some participants.

⸻
