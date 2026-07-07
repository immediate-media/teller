import { createServerFn } from "@tanstack/react-start";

import { AskInput, runAskQuestion, type AskResult } from "./ask.server";

export type { AskResult };

export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => AskInput.parse(raw))
  .handler(async ({ data }): Promise<AskResult> => {
    return runAskQuestion(data.question, data.style, data.roles, data.preference, data.styles);
  });
