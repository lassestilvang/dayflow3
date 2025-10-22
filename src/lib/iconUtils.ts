export const ICONS = [
  { value: "CheckSquare", label: "Check Square", icon: "☑️" },
  { value: "Circle", label: "Circle", icon: "⭕" },
  { value: "Star", label: "Star", icon: "⭐" },
  { value: "Heart", label: "Heart", icon: "❤️" },
  { value: "Flag", label: "Flag", icon: "🚩" },
  { value: "Bookmark", label: "Bookmark", icon: "🔖" },
  { value: "Tag", label: "Tag", icon: "🏷️" },
  { value: "Folder", label: "Folder", icon: "📁" },
  { value: "Home", label: "Home", icon: "🏠" },
  { value: "Work", label: "Work", icon: "💼" },
  { value: "Users", label: "Users", icon: "👥" },
  { value: "Calendar", label: "Calendar", icon: "📅" },
];

export function getIconEmoji(iconValue: string): string {
  const icon = ICONS.find(i => i.value === iconValue);
  return icon?.icon || "☑️";
}