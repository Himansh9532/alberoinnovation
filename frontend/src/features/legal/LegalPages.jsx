import { Link } from "react-router-dom";

const privacySections = [
  {
    title: "Information we handle",
    paragraphs: [
      "When you create or use an account, we handle details you provide such as your name and email address. If you send a message through the contact form, we store your name, email address, selected topic, message, and submission time in our Firestore database so our team can respond. The services can also process content you choose to enter or upload, including resume text, profile details, interview answers, job descriptions, and research questions.",
      "Some drafts, preferences, and activity may be kept in your browser. If you choose an account or sync feature, the information described on that feature may be saved to your account so you can use it across devices.",
    ],
  },
  {
    title: "How information is used",
    paragraphs: [
      "We use information to provide and secure accounts, operate the tools you request, save your work when you choose to do so, respond to support requests, and maintain the service.",
      "Resume and other AI-assisted features send the text needed to provide a result to an AI provider only when you choose that feature and confirm its disclosure. Review the on-screen notice before submitting; the provider's own privacy terms also apply to that processing.",
    ],
  },
  {
    title: "Service providers and sharing",
    paragraphs: [
      "We use third-party services for functions such as account sign-in, hosting, payments, and AI-assisted features. Information is shared with a provider when needed for the function you use, or where disclosure is required by law. Those providers process information under their own terms and privacy notices.",
    ],
  },
  {
    title: "Cookies and browser storage",
    paragraphs: [
      "The site uses essential browser storage for core functionality and a cookie to remember your cookie preference. You can clear cookies and local browser storage in your browser settings; doing so may sign you out or remove locally saved drafts and preferences.",
    ],
  },
  {
    title: "Retention and your choices",
    paragraphs: [
      "Information is kept for as long as needed to provide the service and meet applicable obligations. You can manage or remove locally stored content in your browser. To ask about accessing, correcting, or deleting account information, contact us; we may need to verify your request and retain information where required.",
    ],
  },
  {
    title: "Security and changes",
    paragraphs: [
      "We use reasonable measures to protect information, but no online service or storage method can be guaranteed completely secure. We may update this policy as the service changes; the date at the top shows when it was last revised.",
    ],
  },
];

const termsSections = [
  {
    title: "Using SkillAI",
    paragraphs: [
      "SkillAI provides learning, assessment, interview-practice, research, and career-support tools. You agree to use the service lawfully, provide accurate account information, keep your sign-in details secure, and not interfere with the service or attempt unauthorized access.",
    ],
  },
  {
    title: "Your content",
    paragraphs: [
      "You are responsible for content you submit and must have the rights and permissions needed to use it. You keep your rights to your content. You allow SkillAI and the service providers needed to operate a feature to process that content only to provide and maintain the features you request.",
      "Do not submit information you are not authorized to share. Before using an AI feature, read its on-screen notice about what will be sent to an AI provider.",
    ],
  },
  {
    title: "AI-generated and educational results",
    paragraphs: [
      "AI-generated responses, assessments, resume suggestions, and career information may be incomplete, inaccurate, or unsuitable for your situation. Review and verify results before relying on or sharing them.",
      "SkillAI is a learning and career-support tool, not professional, legal, financial, medical, or hiring advice. It does not guarantee employment, admission, assessment outcomes, or other results.",
    ],
  },
  {
    title: "Accounts, plans, and third parties",
    paragraphs: [
      "Some features require an account or may be subject to plan limits and pricing shown in the service. Payment processing, sign-in providers, and linked third-party services may have their own terms; you are responsible for reviewing those terms when using them.",
    ],
  },
  {
    title: "Service and intellectual property",
    paragraphs: [
      "The service, its design, and its materials are owned by Albero Technologies or its licensors and may be used only as permitted by these terms and applicable law. We may update, suspend, or discontinue features to maintain or improve the service.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "We may revise these terms when the service or applicable requirements change. Continued use after an update means you accept the revised terms, to the extent permitted by law. If you have a question, contact us at",
    ],
    contact: true,
  },
];

function LegalDocument({ title, description, sections }) {
  return (
    <main className="page-shell legal-page">
      <article className="wrap legal-document">
        <header className="legal-heading">
          <span className="eyebrow">Albero Innovation · SkillAI</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <p className="legal-updated">Last updated: October 20, 2026</p>
        </header>
        <div className="legal-sections">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={paragraph}>{paragraph}{section.contact && index === section.paragraphs.length - 1 && <> <a href="mailto:Business@alberotechnologies.com">Business@alberotechnologies.com</a>.</>}</p>
              ))}
            </section>
          ))}
        </div>
        <p className="legal-contact">Questions? <Link to="/contact">Contact us</Link>.</p>
      </article>
    </main>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How SkillAI handles information when you use our website and tools."
      sections={privacySections}
    />
  );
}

export function TermsOfServicePage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="The terms for accessing and using SkillAI."
      sections={termsSections}
    />
  );
}
