export const roles = ["Agent", "Manager"] as const;
export type Role = (typeof roles)[number];

type BaseQuestion = {
  id: string;
  /** Column header used in the Google Sheet. */
  column: string;
  text: string;
  managersOnly?: boolean;
};

export type ChoiceQuestion = BaseQuestion & {
  kind: "choice";
  options: readonly string[];
  /** Option that reveals a free-text explanation box. */
  explainOption?: string;
};

export type TextQuestion = BaseQuestion & { kind: "text"; placeholder?: string };

export type Question = ChoiceQuestion | TextQuestion;

const satisfaction = ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"] as const;

export const survey = {
  title: "Portals Feedback Survey",
  intro:
    "We want to improve the support we provide to agents and managers. Please take a few minutes to answer these questions honestly so we can understand what is working well and what we can do better.",
  thanks:
    "Your suggestions will help us improve our service, support your performance, and create a better experience for everyone.",
} as const;

export const questions: readonly Question[] = [
  {
    id: "overallSupport",
    column: "Overall support satisfaction",
    kind: "choice",
    text: "How satisfied are you with the overall support you receive from the Portals team?",
    options: satisfaction,
  },
  {
    id: "bayutLeads",
    column: "Improve Bayut leads",
    kind: "text",
    text: "What can we improve to help you get more leads from Bayut?",
  },
  {
    id: "listingSpeed",
    column: "Listings uploaded & activated quickly",
    kind: "choice",
    text: "Are your listings being uploaded and activated quickly enough?",
    options: ["Yes, always", "Most of the time", "Sometimes", "No, improvements are needed"],
  },
  {
    id: "understandsNeeds",
    column: "Faffie understands needs",
    kind: "choice",
    text: "Do you feel Faffie understands your needs and the challenges you face with your listings and leads?",
    options: ["Always", "Most of the time", "Sometimes", "Not really"],
  },
  {
    id: "supportTraining",
    column: "Support, guidance & training",
    kind: "choice",
    text: "Do you feel you receive enough support, guidance, and training from Faffie to use the property portals effectively, or do you sometimes feel lost or unsure of what to do?",
    options: [
      "Yes, I receive enough support and feel confident.",
      "Most of the time, but I sometimes need more guidance.",
      "Sometimes I feel lost or unsure of what to do.",
      "No, I need more support and training.",
    ],
  },
  {
    id: "exposure",
    column: "Listing exposure & boosting",
    kind: "choice",
    text: "Do you feel your listings are getting enough exposure and boosting support?",
    options: ["Yes", "Sometimes", "No", "Please explain"],
    explainOption: "Please explain",
  },
  {
    id: "leadQuality",
    column: "Lead quality & quantity satisfaction",
    kind: "choice",
    text: "How satisfied are you with the quality and quantity of leads you receive from the portals?",
    options: satisfaction,
  },
  {
    id: "communication",
    column: "Improve communication & response times",
    kind: "text",
    text: "How can our team improve communication and response times when you need help?",
  },
  {
    id: "guidelines",
    column: "Guidelines easy to understand",
    kind: "choice",
    text: "Do you find our portal guidelines, updates, and instructions easy to understand?",
    options: ["Yes", "Mostly", "Sometimes confusing", "No"],
  },
  {
    id: "managerReports",
    column: "Managers: extra reports / support",
    kind: "text",
    text: "For managers: What additional reports, support, or information would help you improve your team's listing performance and lead generation?",
    managersOnly: true,
  },
  {
    id: "changeOneThing",
    column: "One thing to change",
    kind: "text",
    text: "If you could change one thing about the service Faffie provides, what would it be?",
  },
];

export function visibleQuestions(role: Role | "") {
  return questions.filter((q) => !q.managersOnly || role === "Manager");
}
