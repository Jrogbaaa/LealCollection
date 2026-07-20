// TODO(open-question): real WhatsApp business number — see agent-harness/open-questions.md.
// Placeholder is intentionally obviously fake so it can't be mistaken for live.
export const WHATSAPP_NUMBER = "34600000000";

export function whatsappHref(locale: string) {
  const message =
    locale === "es"
      ? "Hola, me gustaría reservar un barco en Ibiza."
      : "Hi, I'd like to book a boat in Ibiza.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
