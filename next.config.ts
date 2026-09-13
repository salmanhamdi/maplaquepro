import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Désactive la génération automatique d'AGENTS.md / CLAUDE.md par `next dev`
  // (décision ARCH-4 : aucun fichier d'instructions hérité ou implicite). Voir ADR-0001.
  agentRules: false,
};

export default nextConfig;
