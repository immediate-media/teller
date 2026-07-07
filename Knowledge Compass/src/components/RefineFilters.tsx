import { FilterMenu } from "@/components/FilterMenu";
import {
  ANSWER_PREFERENCES,
  useAnswerPreference,
} from "@/lib/answer-preference";
import { ANSWER_STYLES, useAnswerStyles } from "@/lib/answer-style";
import { ROLE_LENSES, useRoleLenses, type RoleLensId } from "@/lib/role-lens";

export function RefineFilters({ size = "sm" }: { size?: "sm" | "md" }) {
  const { styles, toggleStyle } = useAnswerStyles();
  const { roles, toggleRole } = useRoleLenses();
  const { preference, setPreference } = useAnswerPreference();

  const styleValue =
    styles.length === 1
      ? ANSWER_STYLES.find((s) => s.id === styles[0])!.label
      : `${styles.length} selected`;
  const isStyleDefault = styles.length === 1 && styles[0] === "everything";

  const roleValue =
    roles.length === 0
      ? "Anyone"
      : roles.length === 1
        ? ROLE_LENSES.find((r) => r.id === roles[0])!.label
        : `${roles.length} selected`;

  const preferenceValue =
    ANSWER_PREFERENCES.find((p) => p.id === preference)!.label;
  const isPreferenceDefault = preference === "auto";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <FilterMenu
        label="Type of answer"
        value={styleValue}
        isDefault={isStyleDefault}
        options={ANSWER_STYLES.map((s) => ({ id: s.id, label: s.label, hint: s.hint }))}
        selected={styles}
        multi
        onSelect={(id) => toggleStyle(id as typeof styles[number])}
        size={size}
      />
      <FilterMenu
        label="Who are you?"
        value={roleValue}
        isDefault={roles.length === 0}
        options={ROLE_LENSES.map((r) => ({ id: r.id, label: r.label, hint: r.hint }))}
        selected={roles}
        multi
        onSelect={(id) => toggleRole(id as RoleLensId)}
        size={size}
      />
      <FilterMenu
        label="Answer as"
        value={preferenceValue}
        isDefault={isPreferenceDefault}
        options={ANSWER_PREFERENCES.map((p) => ({ id: p.id, label: p.label, hint: p.hint }))}
        selected={[preference]}
        onSelect={(id) => setPreference(id as typeof preference)}
        size={size}
      />
    </div>
  );
}
