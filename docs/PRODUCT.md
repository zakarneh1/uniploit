# UniPilot: Product Notes

Applied product work on UniPilot across three areas: Agile and Scrum, product ownership, and product strategy.

## Agile and Scrum

Work is tracked in two-week sprints using GitHub Milestones. Each sprint has a single goal, and a story only closes once it meets the definition of done below.

- [Sprint 1](https://github.com/zakarneh1/uniploit/milestone/1)
- [Sprint 2](https://github.com/zakarneh1/uniploit/milestone/2)

**Definition of done:** works on both mobile and desktop, matches the issue's acceptance criteria, does not break existing functionality.

## Product Ownership

Backlog scored with RICE (reach × impact × confidence ÷ effort):

| Feature | RICE | Priority | Issue |
|---|---|---|---|
| Registration deadline reminders | 50.0 | Now | #1 |
| Degree audit tracker | 25.0 | Now | #2 |
| GPA what-if calculator | 30.0 | Next | #3 |
| Prerequisite conflict checker | 16.0 | Next | #4 |
| AI study plan recommender | 4.0 | Later | #5 |

The audit tracker ships alongside the top-scoring item rather than after it: reminders are the safer build, the audit tracker is the reason a student opens the app at all. RICE informed the order, it did not decide it on its own.

Each issue above is written as a user story with acceptance criteria.

## Product Strategy

**Vision:** Give every student one place to see exactly where they stand in their degree, and what to do next.

**Where the product is:** Past the idea stage with real users, not yet a daily habit. Priorities right now favor trust and retention over new-user growth.

**Design:** A missing requirement is shown with what's missing and what to do about it, never just a red flag. An empty state explains itself instead of looking broken.

**What I'd measure next:** weekly return rate on the audit tracker, and where students drop off in the requirement checklist.

**Where AI fits:** the study plan recommender stays in Later until there's usage data showing students want a suggestion instead of a checklist.

## Open questions

- Is a missed prerequisite really the most common cause of delay, or just the most memorable one?
- Would students trust an audit tracker without a registrar's sign-off?
