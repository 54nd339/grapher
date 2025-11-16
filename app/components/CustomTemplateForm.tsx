"use client";

import { useState } from "react";
import type { EquationTemplate, TemplateCategory, TemplateTag } from "@/types/equationTemplates";
import { addCustomTemplate } from "@/lib/equationTemplates";
import { equationInputStyles } from "@/theme/styles";
import type { GraphMode } from "@/types";

interface CustomTemplateFormProps {
  onSave: (template: EquationTemplate) => void;
  onCancel: () => void;
  initialExpression?: string;
  initialMode?: GraphMode;
}

const CATEGORIES: TemplateCategory[] = [
  "algebra",
  "trigonometry",
  "calculus",
  "differential-equations",
  "physics",
  "parametric",
  "polar",
  "implicit",
  "series",
  "custom",
];

const TAGS: TemplateTag[] = [
  "polynomial",
  "exponential",
  "logarithmic",
  "trigonometric",
  "hyperbolic",
  "rational",
  "piecewise",
  "parametric",
  "polar",
  "implicit",
  "differential",
  "integral",
  "series",
  "fourier",
  "motion",
  "wave",
  "geometry",
  "advanced",
];

export default function CustomTemplateForm({
  onSave,
  onCancel,
  initialExpression = "",
  initialMode = "2d",
}: CustomTemplateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expression, setExpression] = useState(initialExpression);
  const [latex, setLatex] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("custom");
  const [tags, setTags] = useState<TemplateTag[]>([]);
  const [mode, setMode] = useState<GraphMode>(initialMode);
  const [error, setError] = useState("");

  const handleTagToggle = (tag: TemplateTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!expression.trim()) {
      setError("Expression is required");
      return;
    }

    const id = addCustomTemplate({
      name: name.trim(),
      description: description.trim(),
      expression: expression.trim(),
      latex: latex.trim() || expression.trim(),
      category,
      tags,
      mode,
    });

    onSave({
      id,
      name: name.trim(),
      description: description.trim(),
      expression: expression.trim(),
      latex: latex.trim() || expression.trim(),
      category,
      tags,
      mode,
      isCustom: true,
      createdAt: Date.now(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1" style={equationInputStyles.helper}>
          Template Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          style={equationInputStyles.input}
          placeholder="e.g., My Custom Function"
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-1" style={equationInputStyles.helper}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          style={equationInputStyles.input}
          placeholder="Brief description of this template"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm mb-1" style={equationInputStyles.helper}>
          Expression *
        </label>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
          style={equationInputStyles.input}
          placeholder="x^2 + 1"
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-1" style={equationInputStyles.helper}>
          LaTeX (optional)
        </label>
        <input
          type="text"
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
          style={equationInputStyles.input}
          placeholder="x^{2} + 1"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" style={equationInputStyles.helper}>
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TemplateCategory)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          style={equationInputStyles.input}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1" style={equationInputStyles.helper}>
          Graph Mode
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as GraphMode)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          style={equationInputStyles.input}
        >
          <option value="2d">2D</option>
          <option value="3d">3D</option>
          <option value="parametric">Parametric</option>
          <option value="polar">Polar</option>
          <option value="implicit">Implicit</option>
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1" style={equationInputStyles.helper}>
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              className={`px-2 py-1 rounded border text-xs transition-all ${
                tags.includes(tag) ? "opacity-100" : "opacity-50"
              }`}
              style={
                tags.includes(tag)
                  ? {
                      background: equationInputStyles.modeButton.active.background,
                      color: equationInputStyles.modeButton.active.color,
                      borderColor: equationInputStyles.exampleChip.borderColor,
                    }
                  : {
                      background: "transparent",
                      color: equationInputStyles.modeButton.inactive.color,
                      borderColor: equationInputStyles.exampleChip.borderColor,
                    }
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400" style={equationInputStyles.errorText}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
          style={equationInputStyles.addButton}
        >
          Save Template
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border transition-all"
          style={{ ...equationInputStyles.modeButton.inactive, borderColor: equationInputStyles.input.borderColor }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

