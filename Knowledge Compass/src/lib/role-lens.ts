import { useEffect, useState } from "react";

export const ROLE_LENSES = [
  {
    id: "developer",
    label: "Engineer",
    hint: "Engineer / IC",
    prompt:
      "a software engineer — mention code paths, APIs, libraries, and failure modes where useful, prefer concrete examples over abstractions",
  },
  {
    id: "product",
    label: "Product",
    hint: "PM lens",
    prompt:
      "a product manager — frame around user impact, tradeoffs, priorities, and cross-team dependencies; skip low-level implementation unless it changes the decision",
  },
  {
    id: "design",
    label: "Design",
    hint: "Design lens",
    prompt:
      "a designer — frame around user experience, flows, states, and design system implications; reference component/pattern names when relevant",
  },
  {
    id: "delivery",
    label: "Delivery",
    hint: "PM / EM / delivery lead",
    prompt:
      "a delivery lead — frame around scope, sequencing, risks, owners, and unblockers; call out who to loop in and what's blocking",
  },
  {
    id: "business",
    label: "Business",
    hint: "Non-technical stakeholder",
    prompt:
      "a business stakeholder — avoid jargon, translate acronyms, lead with outcome and impact, no code",
  },
] as const;

export type RoleLensId = (typeof ROLE_LENSES)[number]["id"];

export function getRoleLenses(ids: readonly string[] | null | undefined) {
  if (!ids?.length) return [];
  return ROLE_LENSES.filter((r) => ids.includes(r.id));
}

const KEY = "teller.roleLenses.v2";

export function useRoleLenses() {
  const [roles, setRoles] = useState<RoleLensId[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        const valid = parsed.filter((id): id is RoleLensId =>
          ROLE_LENSES.some((r) => r.id === id),
        );
        setRoles(valid);
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, []);

  const persist = (next: RoleLensId[]) => {
    setRoles(next);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  };

  const toggle = (id: RoleLensId) => {
    persist(roles.includes(id) ? roles.filter((r) => r !== id) : [...roles, id]);
  };

  return { roles, toggleRole: toggle, setRoles: persist, hydrated };
}
