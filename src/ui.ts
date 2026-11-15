import { StyleSheet } from "react-native";

export const colors = {
  bg: "#0E0E12",
  card: "#1A1A22",
  text: "#FFFFFF",
  muted: "#9A9AA8",
  accent: "#7C5CFF",
  danger: "#FF5C7A",
};

export const ui = StyleSheet.create({
  h1: { color: colors.text, fontSize: 24, fontWeight: "800" },
  h2: { color: colors.text, fontSize: 18, fontWeight: "700" },
  muted: { color: colors.muted, fontSize: 14 },
  error: { color: colors.danger, fontSize: 14 },
  link: { color: colors.accent, fontSize: 15, textAlign: "center", padding: 8 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  buttonSecondary: { backgroundColor: colors.card, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.4 },
  chip: { backgroundColor: colors.card, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { color: colors.text, fontSize: 14 },
});
