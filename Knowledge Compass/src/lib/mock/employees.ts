export type Availability = "open" | "focused" | "away";

export type Employee = {
  id: string;
  name: string;
  role: string;
  team: string;
  timezone: string;
  workingHours: string;
  typicalResponse: string;
  availability: Availability;
  slackStatus: string;
  expertise: {
    topic: string;
    confidence: number;
    willingness: "happy" | "sparingly" | "no";
    evidence: string;
    lastActive?: string;
    activityCount?: number;
    collaborators?: string[];
    trend?: "rising" | "steady" | "cooling";
    repos?: { name: string; lastCommit: string; commits30d: number; role?: "owner" | "maintainer" | "contributor" }[];
  }[];
  gaps: string[];
  preferences: { async: boolean; bestHours: string; openToOnboarding: boolean };
  recentActivity: { type: "jira" | "confluence" | "github"; ref: string; title: string; when: string }[];
};

export const currentUserId = "e-you";

export const employees: Employee[] = [
  {
    id: "e-you",
    name: "You (Alex Rivera)",
    role: "Product Engineer",
    team: "Growth",
    timezone: "Europe/London",
    workingHours: "09:00 – 17:30 GMT",
    typicalResponse: "Usually replies within a few hours",
    availability: "open",
    slackStatus: "🟢 Available",
    expertise: [
      { topic: "Onboarding funnels", confidence: 0.88, willingness: "happy", evidence: "Owned 6 Jira epics in Q2–Q3", lastActive: "3d ago", activityCount: 42, collaborators: ["Noor Haddad", "Sam Chen"], trend: "rising", repos: [{ name: "growth/signup-flow", lastCommit: "2d ago", commits30d: 14, role: "maintainer" }] },
      { topic: "A/B testing infra", confidence: 0.71, willingness: "happy", evidence: "Authored 3 Confluence pages", lastActive: "1w ago", activityCount: 18, collaborators: ["Jordan Bello"], trend: "steady", repos: [{ name: "growth/splitter-sdk", lastCommit: "3w ago", commits30d: 4, role: "contributor" }] },
      { topic: "GraphQL federation", confidence: 0.42, willingness: "sparingly", evidence: "Commented on 2 tickets", lastActive: "4mo ago", activityCount: 3, collaborators: [], trend: "cooling" },
      { topic: "Payments / Stripe", confidence: 0.31, willingness: "no", evidence: "Reviewed one PR, no ownership", lastActive: "8mo ago", activityCount: 1, collaborators: ["Sam Chen"], trend: "cooling" },
    ],
    gaps: ["Kubernetes on-call", "SQL query planning"],
    preferences: { async: true, bestHours: "10:00 – 12:00 GMT", openToOnboarding: true },
    recentActivity: [
      { type: "github", ref: "growth/signup-flow#412", title: "Trim step-2 form fields (PR merged)", when: "2d ago" },
      { type: "jira", ref: "GROW-482", title: "Reduce signup step 2 drop-off", when: "3d ago" },
      { type: "confluence", ref: "GROW-42", title: "Experimentation cookbook v3", when: "1w ago" },
    ],
  },
  {
    id: "e-maya",
    name: "Maya Okonkwo",
    role: "Staff Engineer",
    team: "Platform",
    timezone: "Europe/Berlin",
    workingHours: "08:30 – 17:00 CET",
    typicalResponse: "Replies same-day",
    availability: "open",
    slackStatus: "🟢 Around, ping away",
    expertise: [
      { topic: "Kubernetes on-call", confidence: 0.94, willingness: "happy", evidence: "SRE lead, 40+ incidents", lastActive: "yesterday", trend: "steady", repos: [{ name: "platform/k8s-runbooks", lastCommit: "yesterday", commits30d: 22, role: "owner" }, { name: "platform/infra-terraform", lastCommit: "4d ago", commits30d: 31, role: "owner" }] },
      { topic: "Terraform modules", confidence: 0.9, willingness: "happy", evidence: "Owns infra repo", trend: "rising", repos: [{ name: "platform/infra-terraform", lastCommit: "4d ago", commits30d: 31, role: "owner" }] },
      { topic: "Postgres tuning", confidence: 0.82, willingness: "sparingly", evidence: "Diagnosed 7 slow-query issues", lastActive: "2w ago", trend: "steady" },
    ],
    gaps: [],
    preferences: { async: false, bestHours: "14:00 – 16:00 CET", openToOnboarding: true },
    recentActivity: [
      { type: "github", ref: "platform/infra-terraform#221", title: "Rotate cluster CA (PR merged)", when: "yesterday" },
      { type: "confluence", ref: "PLAT-118", title: "On-call runbook: prod DB failover", when: "yesterday" },
      { type: "jira", ref: "PLAT-901", title: "Rotate cluster certs Q4", when: "2d ago" },
    ],
  },
  {
    id: "e-sam",
    name: "Sam Chen",
    role: "Senior Backend Engineer",
    team: "Payments",
    timezone: "America/New_York",
    workingHours: "09:00 – 18:00 EST",
    typicalResponse: "Best reached async",
    availability: "focused",
    slackStatus: "🎯 Heads-down until 4pm",
    expertise: [
      { topic: "Payments / Stripe", confidence: 0.96, willingness: "happy", evidence: "Owns billing service", lastActive: "today", trend: "rising", repos: [{ name: "payments/billing-service", lastCommit: "today", commits30d: 47, role: "owner" }, { name: "payments/stripe-adapters", lastCommit: "2d ago", commits30d: 19, role: "owner" }] },
      { topic: "Webhook reliability", confidence: 0.88, willingness: "happy", evidence: "Wrote retry framework", trend: "steady", repos: [{ name: "payments/webhook-retry", lastCommit: "1w ago", commits30d: 6, role: "owner" }] },
      { topic: "SOX compliance flows", confidence: 0.7, willingness: "sparingly", evidence: "Liaised with audit twice", trend: "steady" },
    ],
    gaps: ["Frontend animation"],
    preferences: { async: true, bestHours: "after 4pm EST", openToOnboarding: false },
    recentActivity: [
      { type: "github", ref: "payments/billing-service#902", title: "3DS challenge retry path (PR open)", when: "today" },
      { type: "jira", ref: "PAY-233", title: "Stripe 3DS fallback for EU cards", when: "today" },
      { type: "confluence", ref: "PAY-88", title: "Refund state machine", when: "4d ago" },
    ],
  },
  {
    id: "e-priya",
    name: "Priya Shah",
    role: "Design Systems Lead",
    team: "Design",
    timezone: "Asia/Kolkata",
    workingHours: "10:00 – 18:30 IST",
    typicalResponse: "OOO — back Monday",
    availability: "away",
    slackStatus: "🌴 On leave until Nov 12",
    expertise: [
      { topic: "Design tokens", confidence: 0.95, willingness: "happy", evidence: "Owns tokens repo" },
      { topic: "Accessibility (WCAG)", confidence: 0.86, willingness: "happy", evidence: "Ran org-wide audit" },
    ],
    gaps: [],
    preferences: { async: true, bestHours: "11:00 – 13:00 IST", openToOnboarding: true },
    recentActivity: [
      { type: "confluence", ref: "DS-14", title: "Token naming RFC", when: "2w ago" },
    ],
  },
  {
    id: "e-jordan",
    name: "Jordan Bello",
    role: "ML Engineer",
    team: "AI",
    timezone: "America/Los_Angeles",
    workingHours: "08:00 – 17:00 PST",
    typicalResponse: "Usually replies within an hour",
    availability: "open",
    slackStatus: "🟢 Open to pings",
    expertise: [
      { topic: "RAG pipelines", confidence: 0.91, willingness: "happy", evidence: "Built internal doc-search", lastActive: "yesterday", trend: "rising", repos: [{ name: "ai/doc-search", lastCommit: "yesterday", commits30d: 38, role: "owner" }, { name: "ai/reranker", lastCommit: "yesterday", commits30d: 12, role: "maintainer" }] },
      { topic: "LLM evaluation", confidence: 0.84, willingness: "happy", evidence: "Owns eval harness", trend: "steady", repos: [{ name: "ai/eval-harness", lastCommit: "1w ago", commits30d: 9, role: "owner" }] },
      { topic: "Vector DBs", confidence: 0.78, willingness: "happy", evidence: "Migrated org from FAISS to pgvector", trend: "cooling" },
    ],
    gaps: ["Mobile release engineering"],
    preferences: { async: false, bestHours: "10:00 – 12:00 PST", openToOnboarding: true },
    recentActivity: [
      { type: "github", ref: "ai/reranker#37", title: "Cross-encoder rerank stage (PR merged)", when: "yesterday" },
      { type: "confluence", ref: "AI-77", title: "How we chose our embedding model", when: "5d ago" },
      { type: "jira", ref: "AI-421", title: "Add reranker to search v2", when: "yesterday" },
    ],
  },
  {
    id: "e-noor",
    name: "Noor Haddad",
    role: "Engineering Manager",
    team: "Growth",
    timezone: "Europe/London",
    workingHours: "09:30 – 18:00 GMT",
    typicalResponse: "Replies same-day",
    availability: "focused",
    slackStatus: "📅 In back-to-backs",
    expertise: [
      { topic: "Onboarding funnels", confidence: 0.8, willingness: "happy", evidence: "Managed Growth team 2yr" },
      { topic: "Hiring loops", confidence: 0.87, willingness: "sparingly", evidence: "Ran 30+ interview loops" },
    ],
    gaps: [],
    preferences: { async: true, bestHours: "async DM anytime", openToOnboarding: true },
    recentActivity: [
      { type: "confluence", ref: "GROW-11", title: "Growth team Q4 goals", when: "1w ago" },
    ],
  },
];

export function getEmployee(id: string) {
  return employees.find((e) => e.id === id);
}
