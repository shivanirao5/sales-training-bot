export const SALES_SCENARIOS = {
  cold_calling: {
    title: "Cold Calling Practice",
    description: "Practice your cold calling skills with realistic role-play scenarios.",
    customerProfile: {
      role: "Operations Manager",
      company: "Mid-size manufacturing company",
      challenges: ["Improving efficiency", "Reducing costs", "Streamlining operations"],
      personality: "Professional but direct, values concrete benefits over features",
      initialMood: "Skeptical and busy",
    },
    objectives: [
      "Build rapport quickly",
      "Identify customer pain points",
      "Present value proposition clearly",
      "Handle objections professionally",
      "Secure next meeting or commitment",
    ],
  },

  demo_pitch: {
    title: "Demo Pitch Training",
    description: "Perfect your product demonstration and pitch delivery.",
    customerProfile: {
      role: "Chief Technology Officer",
      company: "Growing tech startup",
      challenges: ["Scaling operations", "Improving team productivity", "Managing technical debt"],
      personality: "Technical-minded, data-driven, wants to see proof of value",
      initialMood: "Interested but needs convincing",
    },
    objectives: [
      "Demonstrate key features effectively",
      "Connect features to business benefits",
      "Address technical concerns",
      "Discuss implementation and support",
      "Move toward purchase decision",
    ],
  },

  upsell: {
    title: "Upselling Practice",
    description: "Learn to identify and capitalize on upselling opportunities.",
    customerProfile: {
      role: "Managing Partner",
      company: "Established consulting firm",
      challenges: ["Improving client satisfaction", "Increasing team efficiency", "Staying competitive"],
      personality: "Relationship-focused, values long-term partnerships, cost-conscious but willing to invest",
      initialMood: "Satisfied with current service, open to improvements",
    },
    objectives: [
      "Identify expansion opportunities",
      "Present additional value clearly",
      "Address cost concerns",
      "Leverage existing relationship",
      "Secure upgrade or additional services",
    ],
  },
} as const

export type ScenarioType = keyof typeof SALES_SCENARIOS
