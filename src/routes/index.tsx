import { createFileRoute, redirect } from "@tanstack/react-router";

// La app "Corazón de Élite" es una PWA vanilla servida como archivo estático.
// La ruta raíz simplemente lleva a esa aplicación.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Corazón de Élite — Entrenamiento, máximos y planificación" },
      {
        name: "description",
        content:
          "PWA local-first para entrenar con enfoque: rutinas, máximos, rachas, calendario y modo Focus optimizado para Android.",
      },
      { property: "og:title", content: "Corazón de Élite" },
      {
        property: "og:description",
        content:
          "Entrena con rutinas, máximos, rachas y planificación en una PWA rápida y offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ href: "/app/index.html" });
  },
  component: () => null,
});
