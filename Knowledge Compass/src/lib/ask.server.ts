import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import {
  ANSWER_PREFERENCES,
  getPreference,
  type AnswerPreferenceId,
} from "./answer-preference";
import { ANSWER_STYLES, getStyle, type AnswerStyleId } from "./answer-style";
import { docs } from "./mock/docs";
import { employees } from "./mock/employees";
import { getRoleLenses, ROLE_LENSES, type RoleLensId } from "./role-lens";

export const AskInput = z.object({
  question: z.string().min(1),
  style: z
    .enum(ANSWER_STYLES.map((s) => s.id) as [AnswerStyleId, ...AnswerStyleId[]])
    .optional(),
  styles: z
    .array(z.enum(ANSWER_STYLES.map((s) => s.id) as [AnswerStyleId, ...AnswerStyleId[]]))
    .optional(),
  roles: z
    .array(z.enum(ROLE_LENSES.map((r) => r.id) as [RoleLensId, ...RoleLensId[]]))
    .optional(),
  preference: z
    .enum(ANSWER_PREFERENCES.map((p) => p.id) as [AnswerPreferenceId, ...AnswerPreferenceId[]])
    .optional(),
});

export const AskOutput = z.object({
  hasDocAnswer: z.boolean(),
  answer: z.string(),
  sourceIds: z.array(z.string()),
  peopleIds: z.array(z.string()),
  reasoning: z.string(),
});

export type AskResult = z.infer<typeof AskOutput>;

export async function runAskQuestion(
  question: string,
  styleId?: AnswerStyleId,
  roleIds?: RoleLensId[],
  preferenceId?: AnswerPreferenceId,
  styleIds?: AnswerStyleId[],
): Promise<AskResult> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("openai/gpt-5.5");
  const activeStyleIds =
    styleIds && styleIds.length ? styleIds : styleId ? [styleId] : undefined;
  const styles = (activeStyleIds ?? []).map((id) => getStyle(id));
  const primaryStyle = styles[0] ?? getStyle(undefined);
  const roleLenses = getRoleLenses(roleIds);
  const preference = getPreference(preferenceId);

  const corpus = docs
    .map((d) => `- [${d.id}] (${d.kind}, ${d.space}) ${d.title} — ${d.snippet}`)
    .join("\n");
  const directory = employees
    .map((e) => {
      const topics = e.expertise
        .filter((x) => x.willingness !== "no")
        .map((x) => {
          const bits = [x.topic, `willingness=${x.willingness}`];
          if (x.lastActive) bits.push(`lastActive=${x.lastActive}`);
          if (typeof x.activityCount === "number") bits.push(`refs=${x.activityCount}`);
          if (x.trend) bits.push(`trend=${x.trend}`);
          if (x.collaborators?.length) bits.push(`with=${x.collaborators.join("/")}`);
          if (x.repos?.length) {
            const repoBits = x.repos
              .map((r) => `${r.name}(${r.role ?? "contributor"}, last=${r.lastCommit}, 30dCommits=${r.commits30d})`)
              .join(" & ");
            bits.push(`repos=${repoBits}`);
          }
          return `{${bits.join("; ")}}`;
        })
        .join(", ");
      return `- [${e.id}] ${e.name}, ${e.role} on ${e.team}. Availability: ${e.availability}. Knows: ${topics}.`;
    })
    .join("\n");

  const system = `You are Teller, an internal knowledge-routing assistant for a software company.
You quietly gather signal from every internal tool the company uses (tickets, docs, code, chats). Never reveal or enumerate which specific tools/systems (Confluence, Jira, GitHub, Slack, etc.) you looked at — just cite concrete artifacts by name when helpful.

DOCUMENTS (available reference material):
${corpus}

DIRECTORY (employees, their expertise, and their willingness to be asked):
${directory}

ANSWER STYLE — the reader has explicitly chosen ${styles.length > 1 ? `${styles.length} styles to blend` : `"${primaryStyle.label}"`}:
${styles.length > 1 ? styles.map((s) => `- ${s.label}: ${s.prompt}`).join("\n") + "\nBlend these styles into a single coherent answer — cover each requested angle with a clear heading so the reader can jump to what they need." : primaryStyle.prompt}
${
  roleLenses.length
    ? `\nREADER AUDIENCE — the reader wants this answer usable for ${roleLenses.length} audience${roleLenses.length > 1 ? "s" : ""}:\n${roleLenses.map((r) => `- ${r.label}: ${r.prompt}`).join("\n")}\n${roleLenses.length > 1 ? "Structure the answer with a short section per audience, clearly labeled, so the reader can hand each section to the right person.\n" : ""}`
    : ""
}
OUTPUT PREFERENCE — "${preference.label}":
${preference.prompt}


For every question:
1. First try to answer from the DOCUMENTS. If one or more docs plausibly cover the answer, set hasDocAnswer=true, write the answer in the ANSWER STYLE above (respect its length/tone/depth strictly), and list the doc ids you drew from in sourceIds.
2. If no doc covers it well, set hasDocAnswer=false and write a one-paragraph "here's who to ask and why" answer — still in the requested style.
3. Regardless, always suggest 1-3 relevant people in peopleIds. Weight the pick by (a) topic match, (b) willingness=happy > sparingly, (c) recency — lastActive within a few weeks, trend=rising, and recent code commits beat cooling/stale, (d) code ownership — if the topic maps to a repo, someone with role=owner/maintainer and recent commits on that repo is the strongest signal, (e) collaboration — someone who recently worked WITH a known owner is a good secondary pick, (f) availability — deprioritize away, note focused. Never suggest e-you (that's the current user).
4. In "reasoning", give one short sentence naming the strongest signal (e.g. "Sam owns billing-service and pushed to 3DS today" or "Maya — merged the runbook PR yesterday"). Reference repos, PRs, or docs by name, but do NOT name source systems.

Keep the answer grounded — do not invent doc content or people not in the lists. Ids MUST come from the lists above verbatim.`;

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: AskOutput }),
      messages: [
        { role: "system", content: system },
        { role: "user", content: question },
      ],
    });
    return output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return {
        hasDocAnswer: false,
        answer:
          "I couldn't shape a structured answer for that. Try rephrasing, or browse the People directory to find someone likely.",
        sourceIds: [],
        peopleIds: [],
        reasoning: "Model output failed schema validation.",
      };
    }
    throw error;
  }
}
