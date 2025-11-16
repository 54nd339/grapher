"use client";

import { useState, useMemo, useCallback } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import type { EquationTemplate, TemplateCategory, TemplateTag } from "@/types/equationTemplates";
import {
  equationTemplates,
  getTemplateLibraryConfig,
  searchTemplates,
  filterByCategory,
  filterByTags,
  getCategories,
  getTags,
  toggleFavorite,
  isFavorite,
  substituteVariables,
  removeCustomTemplate,
} from "@/lib/equationTemplates";
import { useTheme } from "@/theme/ThemeProvider";
import { equationInputStyles } from "@/theme/styles";
import type { GraphMode } from "@/types";

interface EquationTemplateLibraryProps {
  onSelectTemplate: (template: EquationTemplate, substitutedExpression: string) => void;
  currentMode?: GraphMode;
  onClose?: () => void;
}

export default function EquationTemplateLibrary({
  onSelectTemplate,
  currentMode,
  onClose,
}: EquationTemplateLibraryProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [selectedTags, setSelectedTags] = useState<TemplateTag[]>([]);
  const [showCustomOnly, setShowCustomOnly] = useState(false);

  const config = getTemplateLibraryConfig();
  const allTemplates = [...equationTemplates, ...config.customTemplates];

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = allTemplates;

    // Filter by custom only
    if (showCustomOnly) {
      filtered = filtered.filter((t) => t.isCustom);
    }

    // Filter by mode if specified
    if (currentMode) {
      filtered = filtered.filter((t) => t.mode === currentMode);
    }

    // Filter by category
    filtered = filterByCategory(filtered, selectedCategory);

    // Filter by tags
    filtered = filterByTags(filtered, selectedTags);

    // Search
    filtered = searchTemplates(filtered, searchQuery);

    return filtered;
  }, [allTemplates, searchQuery, selectedCategory, selectedTags, showCustomOnly, currentMode]);

  const categories = useMemo(() => getCategories(allTemplates), [allTemplates]);
  const allTags = useMemo(() => getTags(allTemplates), [allTemplates]);

  const handleTagToggle = useCallback((tag: TemplateTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSelectTemplate = useCallback(
    (template: EquationTemplate) => {
      let expression = template.expression;

      // Substitute default variable values
      if (template.variables) {
        const defaultValues: Record<string, number> = {};
        Object.entries(template.variables).forEach(([key, config]) => {
          defaultValues[key] = config.default;
        });
        expression = substituteVariables(expression, defaultValues);
      }

      onSelectTemplate(template, expression);
      onClose?.();
    },
    [onSelectTemplate, onClose]
  );

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, templateId: string) => {
      e.stopPropagation();
      toggleFavorite(templateId);
      // Force re-render by updating state
      setSearchQuery((prev) => prev);
    },
    []
  );

  const handleDeleteCustom = useCallback(
    (e: React.MouseEvent, templateId: string) => {
      e.stopPropagation();
      if (confirm("Delete this custom template?")) {
        removeCustomTemplate(templateId);
        setSearchQuery((prev) => prev);
      }
    },
    []
  );

  const bg = theme.surfaceAlt || theme.surface || "rgba(15,23,42,0.98)";
  const border = theme.borderMuted || "rgba(148,163,184,0.4)";
  const text = theme.text || "#e5e7eb";
  const accent = theme.primary || "#38bdf8";

  return (
    <div
      className="rounded-lg shadow-lg border p-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
      style={{ ...equationInputStyles.panel, background: bg, borderColor: border }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={equationInputStyles.heading}>
          Equation Templates
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border text-sm"
            style={{ borderColor: border, background: "transparent", color: text }}
          >
            Close
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2"
          style={equationInputStyles.input}
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm" style={equationInputStyles.helper}>
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-lg border text-xs transition-all ${
              selectedCategory === "all" ? "opacity-100" : "opacity-60"
            }`}
            style={
              selectedCategory === "all"
                ? { ...equationInputStyles.modeButton.active, borderColor: border }
                : { ...equationInputStyles.modeButton.inactive, borderColor: border }
            }
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg border text-xs transition-all capitalize ${
                selectedCategory === cat ? "opacity-100" : "opacity-60"
              }`}
              style={
                selectedCategory === cat
                  ? { ...equationInputStyles.modeButton.active, borderColor: border }
                  : { ...equationInputStyles.modeButton.inactive, borderColor: border }
              }
            >
              {cat.replace("-", " ")}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm" style={equationInputStyles.helper}>
            Tags:
          </span>
          {allTags.slice(0, 10).map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-2 py-1 rounded border text-xs transition-all ${
                selectedTags.includes(tag) ? "opacity-100" : "opacity-50"
              }`}
              style={
                selectedTags.includes(tag)
                  ? { borderColor: accent, background: accent + "20", color: accent }
                  : { borderColor: border, background: "transparent", color: text }
              }
            >
              {tag}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm" style={equationInputStyles.helper}>
          <input
            type="checkbox"
            checked={showCustomOnly}
            onChange={(e) => setShowCustomOnly(e.target.checked)}
            style={{ accentColor: accent }}
          />
          Show custom templates only
        </label>
      </div>

      {/* Template List */}
      <div className="space-y-2">
        {filteredTemplates.length === 0 ? (
          <p className="text-center py-8 text-sm" style={equationInputStyles.emptyState}>
            No templates found. Try adjusting your filters.
          </p>
        ) : (
          filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isFavorited={isFavorite(template.id)}
              onSelect={() => handleSelectTemplate(template)}
              onToggleFavorite={(e) => handleToggleFavorite(e, template.id)}
              onDelete={template.isCustom ? (e) => handleDeleteCustom(e, template.id) : undefined}
              theme={{ bg, border, text, accent }}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: EquationTemplate;
  isFavorited: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  theme: { bg: string; border: string; text: string; accent: string };
}

function TemplateCard({
  template,
  isFavorited,
  onSelect,
  onToggleFavorite,
  onDelete,
  theme,
}: TemplateCardProps) {
  return (
    <div
      className="p-3 rounded-lg border cursor-pointer transition-all hover:opacity-90 active:scale-98"
      style={{
        borderColor: theme.border,
        background: "rgba(15,23,42,0.4)",
        color: theme.text,
      }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm" style={{ color: theme.accent }}>
              {template.name}
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded border capitalize"
              style={{ borderColor: theme.border, background: "transparent" }}
            >
              {template.category.replace("-", " ")}
            </span>
            {template.isCustom && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: theme.accent + "30", color: theme.accent }}>
                Custom
              </span>
            )}
          </div>
          <p className="text-xs opacity-80 mb-2">{template.description}</p>

          {/* LaTeX Preview */}
          <div className="mb-2 p-2 rounded border" style={{ borderColor: theme.border, background: "rgba(0,0,0,0.2)" }}>
            <BlockMath math={template.latex} errorColor="#DC2626" />
          </div>

          {/* Expression */}
          <code className="text-xs opacity-70 font-mono block mb-2">{template.expression}</code>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded opacity-60"
                  style={{ background: theme.border + "40" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={onToggleFavorite}
            className="p-1.5 rounded transition-all hover:opacity-80"
            style={{ color: isFavorited ? theme.accent : theme.text }}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              className="w-4 h-4"
              fill={isFavorited ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded transition-all hover:opacity-80 text-red-400"
              aria-label="Delete template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

