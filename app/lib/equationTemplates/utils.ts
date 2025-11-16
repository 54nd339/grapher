import type { EquationTemplate, TemplateCategory, TemplateTag, TemplateLibraryConfig } from "@/types/equationTemplates";

const STORAGE_KEY = "equationTemplateLibrary";

/**
 * Get custom templates and favorites from localStorage
 */
export function getTemplateLibraryConfig(): TemplateLibraryConfig {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as TemplateLibraryConfig;
    }
  } catch {
    // ignore parse errors
  }
  return { customTemplates: [], favorites: [] };
}

/**
 * Save template library configuration to localStorage
 */
export function saveTemplateLibraryConfig(config: TemplateLibraryConfig): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

/**
 * Add a custom template
 */
export function addCustomTemplate(template: Omit<EquationTemplate, "id" | "isCustom" | "createdAt">): string {
  const config = getTemplateLibraryConfig();
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const customTemplate: EquationTemplate = {
    ...template,
    id,
    isCustom: true,
    createdAt: Date.now(),
  };
  config.customTemplates.push(customTemplate);
  saveTemplateLibraryConfig(config);
  return id;
}

/**
 * Remove a custom template
 */
export function removeCustomTemplate(id: string): void {
  const config = getTemplateLibraryConfig();
  config.customTemplates = config.customTemplates.filter((t) => t.id !== id);
  config.favorites = config.favorites.filter((fid) => fid !== id);
  saveTemplateLibraryConfig(config);
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(id: string): boolean {
  const config = getTemplateLibraryConfig();
  const index = config.favorites.indexOf(id);
  if (index >= 0) {
    config.favorites.splice(index, 1);
    saveTemplateLibraryConfig(config);
    return false;
  } else {
    config.favorites.push(id);
    saveTemplateLibraryConfig(config);
    return true;
  }
}

/**
 * Check if template is favorited
 */
export function isFavorite(id: string): boolean {
  const config = getTemplateLibraryConfig();
  return config.favorites.includes(id);
}

/**
 * Search templates by query string
 */
export function searchTemplates(
  templates: EquationTemplate[],
  query: string
): EquationTemplate[] {
  if (!query.trim()) return templates;
  
  const lowerQuery = query.toLowerCase();
  return templates.filter((template) => {
    const searchableText = [
      template.name,
      template.description,
      template.expression,
      ...template.tags,
      template.category,
    ].join(" ").toLowerCase();
    
    return searchableText.includes(lowerQuery);
  });
}

/**
 * Filter templates by category
 */
export function filterByCategory(
  templates: EquationTemplate[],
  category: TemplateCategory | "all"
): EquationTemplate[] {
  if (category === "all") return templates;
  return templates.filter((t) => t.category === category);
}

/**
 * Filter templates by tags
 */
export function filterByTags(
  templates: EquationTemplate[],
  tags: TemplateTag[]
): EquationTemplate[] {
  if (tags.length === 0) return templates;
  return templates.filter((t) => tags.some((tag) => t.tags.includes(tag)));
}

/**
 * Get all unique categories from templates
 */
export function getCategories(templates: EquationTemplate[]): TemplateCategory[] {
  const categories = new Set<TemplateCategory>();
  templates.forEach((t) => categories.add(t.category));
  return Array.from(categories).sort();
}

/**
 * Get all unique tags from templates
 */
export function getTags(templates: EquationTemplate[]): TemplateTag[] {
  const tags = new Set<TemplateTag>();
  templates.forEach((t) => t.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}

/**
 * Substitute variables in expression
 */
export function substituteVariables(expression: string, variables: Record<string, number>): string {
  let result = expression;
  for (const [key, value] of Object.entries(variables)) {
    // Replace variable patterns (e.g., "a", "A", "a*x", etc.)
    const regex = new RegExp(`\\b${key}\\b`, "g");
    result = result.replace(regex, String(value));
  }
  return result;
}

