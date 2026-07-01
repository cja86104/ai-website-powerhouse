"use client";

/**
 * TemplatePicker — the collapsible template grid inside
 * `GenerationPanel`. Renders both the built-in `PROMPT_TEMPLATES`
 * (grouped by category) and the user-saved templates from the
 * templates store.
 *
 * Fully self-contained: reads userTemplates from the templates
 * store, `setPrompt` from the generation store, `setShowTemplates`
 * from the UI store. All template-selection and template-delete
 * behavior lives here instead of being drilled from the parent.
 *
 * Extracted from the legacy `GenerationPanel` inline block in
 * W1 PR-3.
 */

import { memo, useMemo, type MouseEvent } from "react";
import { Trash2 } from "lucide-react";
import { PROMPT_TEMPLATES, type PromptTemplate } from "@/lib/prompts/templates";
import { useGenerationStore } from "@/lib/store/generation-store";
import { useUiStore } from "@/lib/store/ui-store";
import {
  useTemplatesStore,
  type UserTemplate,
} from "@/lib/store/templates-store";

interface CategorizedTemplate extends PromptTemplate {
  key: string;
}

export const TemplatePicker = memo(function TemplatePicker() {
  const setPrompt = useGenerationStore((s) => s.setPrompt);
  const setShowTemplates = useUiStore((s) => s.setShowTemplates);
  const userTemplates = useTemplatesStore((s) => s.userTemplates);
  const removeUserTemplate = useTemplatesStore((s) => s.removeUserTemplate);

  // Group built-in templates by category — memoized because
  // `PROMPT_TEMPLATES` is a module-level constant.
  const templatesByCategory = useMemo(() => {
    const categories: Record<string, CategorizedTemplate[]> = {};
    for (const [key, template] of Object.entries(PROMPT_TEMPLATES)) {
      const category = template.category || "Other";
      if (!categories[category]) categories[category] = [];
      categories[category].push({ key, ...template });
    }
    return categories;
  }, []);

  const handleSelectBuiltin = (templateKey: string) => {
    const template = PROMPT_TEMPLATES[templateKey];
    if (!template) return;
    setPrompt(template.prompt);
    setShowTemplates(false);
  };

  const handleSelectUser = (template: UserTemplate) => {
    setPrompt(template.prompt);
    setShowTemplates(false);
  };

  const handleDeleteUser = (
    templateId: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (!confirm("Delete this template?")) return;
    removeUserTemplate(templateId);
  };

  return (
    <div className="mb-4 max-h-[400px] overflow-y-auto bg-[#1a1a2e] rounded-lg p-4 border border-purple-500/20">
      <h3 className="text-lg font-semibold text-purple-100 mb-3">
        Professional Templates
      </h3>
      {Object.entries(templatesByCategory).map(([category, templates]) => (
        <div key={category} className="mb-4">
          <h4 className="text-sm font-semibold text-purple-300 mb-2 uppercase tracking-wide">
            {category}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map((template) => (
              <button
                key={template.key}
                onClick={() => handleSelectBuiltin(template.key)}
                className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-200 rounded-lg transition-all text-left text-sm"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {userTemplates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-500/30">
          <h4 className="text-sm font-semibold text-green-300 mb-2 uppercase tracking-wide">
            ⭐ My Templates
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {userTemplates.map((template) => (
              <div key={template.id} className="group relative">
                <button
                  onClick={() => handleSelectUser(template)}
                  className="w-full px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-200 rounded-lg transition-all text-left text-sm pr-8"
                >
                  {template.name}
                </button>
                <button
                  onClick={(e) => handleDeleteUser(template.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete template"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
