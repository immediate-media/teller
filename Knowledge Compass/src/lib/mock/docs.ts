export type DocSource = {
  id: string;
  kind: "confluence" | "jira";
  title: string;
  space: string;
  updated: string;
  snippet: string;
};

export const docs: DocSource[] = [
  {
    id: "CONF-GROW-42",
    kind: "confluence",
    title: "Experimentation cookbook v3",
    space: "Growth",
    updated: "1w ago",
    snippet:
      "Standard patterns for A/B tests: how to set sample size, when to use CUPED, and how to ship a winner. Covers our internal Splitter SDK.",
  },
  {
    id: "CONF-PLAT-118",
    kind: "confluence",
    title: "On-call runbook: prod DB failover",
    space: "Platform",
    updated: "1d ago",
    snippet:
      "Step-by-step for the on-call to promote the read replica during a primary failover, including the pgbouncer restart and Datadog dashboards to watch.",
  },
  {
    id: "CONF-PAY-88",
    kind: "confluence",
    title: "Refund state machine",
    space: "Payments",
    updated: "4d ago",
    snippet:
      "The five refund states we model, transitions, and what happens when Stripe reports a dispute mid-refund. Includes a diagram.",
  },
  {
    id: "CONF-AI-77",
    kind: "confluence",
    title: "How we chose our embedding model",
    space: "AI",
    updated: "5d ago",
    snippet:
      "Benchmarks across text-embedding-3-small vs bge-large vs e5-mistral on our internal doc-search eval. Why we picked what we picked.",
  },
  {
    id: "CONF-DS-14",
    kind: "confluence",
    title: "Design token naming RFC",
    space: "Design",
    updated: "2w ago",
    snippet:
      "Proposed convention for semantic vs primitive tokens; feedback window open until end of sprint.",
  },
  {
    id: "JIRA-GROW-482",
    kind: "jira",
    title: "Reduce signup step 2 drop-off",
    space: "GROW",
    updated: "3d ago",
    snippet: "In-progress epic. Hypothesis: form is too long. See linked experiment ticket GROW-489.",
  },
  {
    id: "JIRA-PAY-233",
    kind: "jira",
    title: "Stripe 3DS fallback for EU cards",
    space: "PAY",
    updated: "today",
    snippet: "Adds fallback path when 3DS challenge times out; ships behind a flag.",
  },
  {
    id: "JIRA-AI-421",
    kind: "jira",
    title: "Add reranker to search v2",
    space: "AI",
    updated: "yesterday",
    snippet: "Cross-encoder reranker on top of pgvector recall; A/B against baseline.",
  },
];

export function getDoc(id: string) {
  return docs.find((d) => d.id === id);
}
