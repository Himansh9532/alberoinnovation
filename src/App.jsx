import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpenText,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Database,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  Layers3,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  Moon,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TimerReset,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { authenticateLocalAccount, demoCredentials, registerLocalAccount } from "./data/localAccounts";
import {
  getFirebaseIdToken,
  isFirebaseConfigured,
  registerWithEmailPassword,
  signInWithEmailPassword,
  signInWithSocialProvider,
  signOutFirebaseUser,
} from "./data/firebaseAuth";
import { getDashboardActivity } from "./data/dashboardActivity";
import { apiUrl } from "./data/api";
import { academicPaths } from "./data/academic-paths";
import { PLAN_BILLING_TERMS, PLAN_PRICES_INR } from "../shared/plan-pricing.js";

const InterviewExperiencePage = lazy(() => import("./components/InterviewExperience"));
const SkillAssessmentPage = lazy(() => import("./components/SkillAssessment"));
const ResumeIntelligence = lazy(() => import("./components/ResumeIntelligence"));

const SEO_SITE_URL = "https://www.alberotechnologies.in";
const SAVED_RESEARCH_SEARCHES_KEY = "skillai-research-saved-searches";
const RESEARCH_LIBRARY_KEY = "skillai-research-library";
const RESEARCH_LIBRARY_LIMIT = 200;
const REMOVED_ZENODO_DOIS = new Set(["10.5281/zenodo.7414343"]);
const SEO_PAGES = {
  "/": {
    title: "Online Skill Assessments & Career Tools | SkillAI",
    description: "Assess your skills, explore your strengths, practice AI-powered interviews, and get practical career guidance with SkillAI.",
  },
  "/assessment": {
    title: "AI Skill Assessment Online: Test Your Skills | SkillAI",
    description: "Take an AI-powered online skill assessment for your subject or career field. Get tailored questions, understand your strengths, and see what to learn next.",
  },
  "/interview": {
    title: "AI Mock Interview Practice for Any Career | SkillAI",
    description: "Practice role-specific AI mock interviews, improve your answers, and build confidence with realistic interview preparation.",
  },
  "/domains": {
    title: "Explore Career Paths and Skills by Field | SkillAI",
    description: "Explore career paths and in-demand skills across engineering, business, healthcare, science, design, and more.",
  },
  "/research": {
    title: "Find Research Papers for Your Field of Study | SkillAI",
    description: "Discover scholarly research by academic field, course, keyword, and publication year with SkillAI Research.",
  },
  "/research/maker": {
    title: "Research Idea and Outline Maker | SkillAI",
    description: "Turn a research topic into a focused question and a clear outline to help organize your next academic project.",
  },
  "/roadmap": {
    title: "Build a Practical Career Roadmap | SkillAI",
    description: "Connect your current skills to career goals and create practical next steps with a personalized career roadmap.",
  },
  "/resources": {
    title: "Career and Skill-Building Resources | SkillAI",
    description: "Explore practical resources for career planning, communication, interviews, portfolios, and continuous skill development.",
  },
  "/pricing": {
    title: "Plans and Pricing for SkillAI",
    description: "Compare SkillAI plans for AI interview practice and online skill assessments. Choose the option that fits your goals.",
  },
  "/contact": {
    title: "Contact SkillAI",
    description: "Get in touch with the SkillAI team for help, feedback, or partnership enquiries.",
  },
};

function getSeoPage(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (SEO_PAGES[path]) return { ...SEO_PAGES[path], indexable: true, path };

  const privatePage = ["/login", "/register", "/dashboard", "/interview/start", "/assessment/start"]
    .includes(path) || path === "/resume" || path.startsWith("/resume/");
  return {
    title: privatePage ? "Your SkillAI Workspace" : "Page Not Found | SkillAI",
    description: "SkillAI helps learners assess skills and plan practical next steps.",
    indexable: false,
    path,
  };
}

const navItems = [
  { label: "Home", to: "/" },
  {
    label: "Interview",
    children: [
      { label: "AI Interview", to: "/interview" },
      { label: "Skill Assessment", to: "/assessment" },
    ],
  },
  {
    label: "Research",
    children: [
      { label: "Research Papers", to: "/research" },
      { label: "Research Maker", to: "/research/maker" },
    ],
  },
  {
    label: "Resume",
    groups: [
      { heading: "RESUME", items: [
        { label: "Resume Dashboard", to: "/resume/dashboard", description: "Your resume signals in one place.", icon: BarChart3 },
        { label: "Resume Analyzer", to: "/resume/analyzer", description: "Review text extracted from your resume.", icon: FileText },
        { label: "Resume Builder", to: "/resume/builder", description: "Build a clear, single-column resume.", icon: Layers3 },
      ] },
      { heading: "OPTIMIZATION", items: [
        { label: "Job Description Match", to: "/resume/optimizer", description: "Compare exact skill terms with a job.", icon: Target },
        { label: "Job Match", to: "/resume/job-match", description: "Explore role fit from your skills.", icon: BriefcaseBusiness },
        { label: "Resume Tailor", to: "/resume/tailor", description: "Focus relevant sections for a role.", icon: Sparkles },
      ] },
      { heading: "CAREER INTELLIGENCE", items: [
        { label: "Skill Gap Analysis", to: "/resume/skill-gaps", description: "Compare skills with target roles.", icon: GraduationCap },
        { label: "Project Analyzer", to: "/resume/project-analyzer", description: "Strengthen real project evidence.", icon: FolderKanban },
        { label: "Career Profile", to: "/resume/profile", description: "Your reusable professional identity.", icon: UserRound },
      ] },
      { heading: "MANAGEMENT", items: [
        { label: "Resume Versions", to: "/resume/versions", description: "Save and manage resume snapshots.", icon: FileText },
        { label: "Career Package", to: "/resume/package", description: "Draft career materials from your profile.", icon: BriefcaseBusiness },
      ] },
    ],
  },
  { label: "Resources", to: "/resources" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact us", to: "/contact" },
];

const workflowSteps = [
  { number: "01", title: "Choose a starting point", copy: "Explore a field or open the tool that fits what you want to work on today.", icon: Target },
  { number: "02", title: "Learn by doing", copy: "Practice a skill, prepare for an interview, or work with your resume.", icon: Sparkles },
  { number: "03", title: "Plan what comes next", copy: "Use research, resources, and career paths to guide your next step.", icon: TrendingUp },
];

const ASSESSMENT_FAQS = [
  {
    question: "What is an AI skill assessment?",
    answer: "An AI skill assessment gives you questions based on your selected subject or field, then summarizes your responses with practical learning suggestions. It is for practice and self-improvement, not a certified qualification or hiring decision.",
  },
  {
    question: "Can I take a free online skill assessment?",
    answer: "The Free plan includes one lifetime AI practice start shared between skill assessments and interview practice. See the SkillAI pricing page for current plan limits.",
  },
  {
    question: "What skills can an online assessment test?",
    answer: "Choose from the available branch, course, and domain options. The assessment focuses on the selected academic or professional area, and available topics can vary by branch.",
  },
  {
    question: "How should I use my skill assessment results?",
    answer: "Review the learning summary to identify topics to practice next. Treat AI-generated feedback as guidance, and verify important academic or career decisions with a qualified instructor or advisor.",
  },
];

const domainCards = [
  { icon: Layers3, name: "Engineering & Technology", description: "Explore pathways across mechanical, civil, electrical, computer, and emerging technologies.", skills: "Projects & practical skills", interview: "Role preparation", research: "Career pathways" },
  { icon: BriefcaseBusiness, name: "Business & Finance", description: "Build capability in management, accounting, entrepreneurship, economics, and finance.", skills: "Business capability", interview: "Interview practice", research: "Career pathways" },
  { icon: GraduationCap, name: "Healthcare & Life Sciences", description: "Prepare for opportunities in healthcare, biotechnology, pharmacy, and life sciences.", skills: "Applied knowledge", interview: "Role preparation", research: "Career pathways" },
  { icon: BrainCircuit, name: "Science & Research", description: "Strengthen scientific thinking, research skills, communication, and academic readiness.", skills: "Research skills", interview: "Presentation practice", research: "Research Hub" },
  { icon: Sparkles, name: "Design & Creative Arts", description: "Showcase creative work and grow skills in design, media, communication, and the arts.", skills: "Portfolio building", interview: "Creative practice", research: "Career pathways" },
  { icon: ShieldCheck, name: "Law & Public Service", description: "Develop clear communication, critical analysis, and preparation for public-facing careers.", skills: "Core competencies", interview: "Scenario practice", research: "Career pathways" },
  { icon: Database, name: "Agriculture & Environment", description: "Explore modern agriculture, sustainability, environmental science, and field innovation.", skills: "Practical capability", interview: "Role preparation", research: "Career pathways" },
  { icon: BookOpenText, name: "Education & Humanities", description: "Connect your strengths in teaching, languages, history, policy, and social sciences to work.", skills: "Transferable skills", interview: "Communication practice", research: "Career pathways" },
];

const resourceCards = [
  { category: "Career Skills", level: "All levels", title: "Explain your experience with clarity and confidence" },
  { category: "Portfolio", level: "Practical guide", title: "Showcase projects, placements, and hands-on work" },
  { category: "Communication", level: "All levels", title: "Prepare for interviews across different industries" },
  { category: "Research", level: "Step-by-step", title: "Find reliable sources and build a strong research question" },
];

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [theme, setTheme] = useState(() => (
    window.localStorage.getItem("skillai-theme") === "dark" ? "dark" : "light"
  ));
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("skillai-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");
  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link to="/" className="brand" aria-label="SkillAI home">
          <span className="brand-mark" aria-hidden="true"><Sparkles size={20} strokeWidth={2.1} /></span>
          <span className="brand-text">
            <strong>SkillAI</strong>
          </span>
        </Link>

        <button
          type="button"
          className="icon-button theme-toggle mobile-theme-toggle"
          onClick={toggleTheme}
          aria-label={themeLabel}
          aria-pressed={theme === "dark"}
          title={themeLabel}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          className="mobile-toggle"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`main-nav${menuOpen ? " open" : ""}`} aria-label="Main navigation">
          <div className="nav-links">
            {navItems.map((item) => item.children || item.groups ? (
              <div key={item.label} className={`nav-dropdown${openDropdown === item.label ? " open" : ""}`}>
                <div className="nav-dropdown-trigger">
                  <button
                    type="button"
                    className={`nav-dropdown-heading${(item.children || item.groups.flatMap((group) => group.items)).some((child) => location.pathname === child.to || location.pathname.startsWith(`${child.to}/`)) ? " active" : ""}`}
                    aria-expanded={openDropdown === item.label}
                    aria-controls={`${item.label.toLowerCase()}-nav-menu`}
                    onClick={() => setOpenDropdown((open) => open === item.label ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                </div>
                {item.groups ? (
                  <div id={`${item.label.toLowerCase()}-nav-menu`} className="nav-dropdown-menu nav-mega-menu">
                    {item.groups.map((group) => <section className="nav-mega-group" key={group.heading}>
                      <span>{group.heading}</span>
                      {group.items.map(({ icon: Icon, ...child }) => <NavLink key={child.to} to={child.to} className="nav-mega-link"><i><Icon size={17} /></i><span><strong>{child.label}</strong><small>{child.description}</small></span><ArrowRight size={14} /></NavLink>)}
                    </section>)}
                  </div>
                ) : (
                  <div id={`${item.label.toLowerCase()}-nav-menu`} className="nav-dropdown-menu">
                    {item.children.map((child) => <NavLink key={child.to} to={child.to} className="nav-dropdown-link">{child.label}</NavLink>)}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-tools">
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button
              type="button"
              className="icon-button theme-toggle desktop-theme-toggle"
              onClick={toggleTheme}
              aria-label={themeLabel}
              aria-pressed={theme === "dark"}
              title={themeLabel}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="nav-divider" aria-hidden="true" />
            {user ? (
              <>
                <Link to="/dashboard" className="user-pill" aria-label={`Open ${user.name}'s dashboard`}>{user.name}</Link>
                <button type="button" className="nav-login" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-login">Login</Link>
                <Link to="/register" className="primary-button small">Get Started</Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => item.children || item.groups ? (
            <div key={item.label} className={`mobile-nav-dropdown${openDropdown === item.label ? " open" : ""}`}>
              <div className="mobile-nav-dropdown-trigger">
                <button
                  type="button"
                  className={`mobile-nav-dropdown-heading${(item.children || item.groups.flatMap((group) => group.items)).some((child) => location.pathname === child.to || location.pathname.startsWith(`${child.to}/`)) ? " active" : ""}`}
                  aria-expanded={openDropdown === item.label}
                  aria-controls={`mobile-${item.label.toLowerCase()}-nav-menu`}
                  onClick={() => setOpenDropdown((open) => open === item.label ? null : item.label)}
                >
                  {item.label}
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>
              <div id={`mobile-${item.label.toLowerCase()}-nav-menu`} className={`mobile-nav-submenu${openDropdown === item.label ? " open" : ""}`}>
                {item.groups ? item.groups.flatMap((group) => group.items).map((child) => <NavLink key={child.to} to={child.to} className={({ isActive }) => `mobile-link${isActive ? " active" : ""}`}><span>{child.label}<small>{child.description}</small></span></NavLink>) : item.children.map((child) => <NavLink key={child.to} to={child.to} className={({ isActive }) => `mobile-link${isActive ? " active" : ""}`}>{child.label}</NavLink>)}
              </div>
            </div>
          ) : (
            <NavLink key={item.label} to={item.to} end={item.to === "/"} className={({ isActive }) => `mobile-link${isActive ? " active" : ""}`}>
              {item.label}
            </NavLink>
          ))}
          <div className="mobile-actions">
            {user ? (
              <>
                <span className="mobile-user-name">Hi, {user.name}</span>
                <Link to="/dashboard" className="secondary-button small">Dashboard</Link>
                <button type="button" className="primary-button small" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-login">Login</Link>
                <Link to="/register" className="primary-button small">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function HomePage() {
  const homeTools = [
    { icon: BarChart3, title: "Skill assessments", copy: "Practice a subject or career skill and review guidance on what to learn next.", to: "/assessment", link: "Explore assessments" },
    { icon: BriefcaseBusiness, title: "AI interview practice", copy: "Prepare for role-specific and behavioral conversations at your own pace.", to: "/interview", link: "See interview practice" },
    { icon: FileText, title: "Resume workspace", copy: "Review resume text, compare job terms, and work on career materials.", to: "/resume/dashboard", link: "Open resume tools" },
    { icon: BookOpenText, title: "Research hub", copy: "Search scholarly work by field, subject, year, and publication type.", to: "/research", link: "Find research" },
    { icon: TrendingUp, title: "Career roadmaps", copy: "Connect your current skills with roles and practical steps to explore.", to: "/roadmap", link: "Explore roadmaps" },
  ];

  return (
    <main className="page-shell home-page">
      <section className="hero-section wrap" aria-labelledby="home-title">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> SKILLS · CAREER · LEARNING</span>
          <h1 id="home-title">Make your next move<span>with more clarity.</span></h1>
          <p>Explore your strengths, practice for opportunities, and find useful next steps—all in one place built for learning and career growth.</p>
          <div className="cta-row">
            <Link to="/register" className="primary-button">Get started free <ArrowRight size={17} /></Link>
            <a href="#home-tools" className="secondary-button">Explore the tools <ArrowUpRight size={17} /></a>
          </div>
          <div className="hero-proof">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Your goals set the pace. Start wherever you are.</span>
          </div>
        </div>

        <div className="home-visual">
          <img
            src="/all-fields-career.svg"
            alt="Illustration of a professional exploring career growth"
          />
          <div className="home-visual-caption">
            <span className="home-caption-mark"><Sparkles size={17} /></span>
            <span><strong>One step at a time</strong><small>Build a path around your goals.</small></span>
          </div>
        </div>
      </section>

      <section className="section section-soft home-tools-section" id="home-tools">
        <div className="wrap">
          <SectionHeading eyebrow="Explore SkillAI" title="A useful place to start, whatever your goal." description="Choose one tool to work on a skill, prepare for an opportunity, or explore a direction." />
          <div className="home-tools-grid">
            {homeTools.map(({ icon: Icon, title, copy, to, link }) => (
              <Link key={title} to={to} className="home-tool-card">
                <span className="home-tool-icon"><Icon size={20} /></span>
                <span className="home-tool-card-arrow"><ArrowUpRight size={17} /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="home-tool-link">{link} <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section wrap home-process-section">
        <SectionHeading eyebrow="A simple way forward" title="Start small. Keep building." description="You do not need a complete plan before you begin. Pick a useful next step, learn from it, and adjust as you go." />
        <div className="home-next-grid">
          {workflowSteps.map(({ number, title, copy, icon: Icon }) => (
            <article key={number}>
              <div className="home-step-heading"><span>{number}</span><Icon size={17} /></div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-soft home-fields-section">
        <div className="wrap">
          <div className="home-fields-heading">
            <SectionHeading eyebrow="Explore by field" title="Your interests can lead in more than one direction." description="Browse academic and professional areas, then choose the tools and topics that make sense for you." />
            <Link to="/domains" className="text-link">Browse all fields <ArrowRight size={16} /></Link>
          </div>
          <div className="domain-grid">
            {domainCards.map(({ icon: Icon, name, description }) => (
              <Link key={name} to="/domains" className="domain-card home-domain-card">
                <span className="domain-icon"><Icon size={18} /></span>
                <h3>{name}</h3>
                <p>{description}</p>
                <span className="home-domain-link">Explore field <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section wrap home-cta-section">
        <div className="home-cta-panel">
          <div>
            <span className="eyebrow">YOUR NEXT STEP</span>
            <h2>You do not have to figure it all out today.</h2>
            <p>Start with one tool, explore what you learn, and build from there.</p>
          </div>
          <div className="home-cta-actions">
            <Link to="/register" className="primary-button">Get started free <ArrowRight size={17} /></Link>
            <Link to="/domains" className="home-cta-link">Explore career fields <ArrowUpRight size={16} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StandardPage({ eyebrow, title, description, illustration, illustrationAlt, startTo = "/register", children }) {
  return (
    <main className="page-shell standard-page">
      <section className="standard-hero wrap">
        <div className="standard-hero-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <Link to={startTo} className="primary-button">Get started <ArrowRight size={16} /></Link>
        </div>
        <div className="standard-hero-art">
          <img src={illustration} alt={illustrationAlt} />
        </div>
      </section>

      <section className="wrap standard-content">
        {children}
      </section>

      <section className="standard-next section-soft">
        <div className="wrap">
          <SectionHeading eyebrow="A practical next step" title="Make progress that fits your goals." description="Choose one useful action, learn from it, and keep building on what you already know." />
          <div className="standard-next-grid">
            <article><span>01</span><h3>Start where you are</h3><p>Bring your current skills, experience, and interests into focus.</p></article>
            <article><span>02</span><h3>Find what matters next</h3><p>Explore a relevant practice, resource, or pathway for your goals.</p></article>
            <article><span>03</span><h3>Keep building</h3><p>Turn each step into progress you can see and share with confidence.</p></article>
          </div>
        </div>
      </section>

      <section className="wrap standard-cta cta-panel">
        <div><span className="eyebrow eyebrow-light">Made for your next chapter</span><h2>Build a path that works for you, whatever your field.</h2></div>
        <Link to={startTo} className="primary-button light">Get started <ArrowUpRight size={17} /></Link>
      </section>
    </main>
  );
}

function DomainsPage() {
  return (
    <StandardPage eyebrow="Explore your options" title="Discover where your strengths can take you." description="Explore pathways across engineering, business, healthcare, science, design, public service, and more." illustration="/all-fields-pathways.svg" illustrationAlt="A professional surrounded by career pathway options">
      <div className="domain-grid" style={{ marginTop: 24 }}>
        {domainCards.map(({ icon: Icon, name, description, skills, interview, research }) => (
          <article key={name} className="domain-card">
            <div className="domain-head"><span className="domain-icon"><Icon size={18} /></span><button type="button" className="ghost-action">Explore</button></div>
            <h3>{name}</h3>
            <p>{description}</p>
            <div className="domain-meta"><span>{skills}</span><span>{interview}</span><span>{research}</span></div>
          </article>
        ))}
      </div>
    </StandardPage>
  );
}

function InterviewPage() {
  const interviewModes = [
    { label: 'Role-specific', summary: 'Practice the questions and professional conversations common in your field.' },
    { label: 'Case discussion', summary: 'Work through a realistic scenario and explain how you would respond.' },
    { label: 'Portfolio review', summary: 'Present projects, placements, research, or practical work with confidence.' },
    { label: 'Behavioral', summary: 'Prepare clear examples of teamwork, initiative, and problem solving.' },
  ];

  const deliveryFeatures = [
    { title: 'Field-aware practice', copy: 'Prepare for conversations that reflect your chosen profession and experience level.' },
    { title: 'Clear feedback', copy: 'Get guidance on structure, clarity, examples, and professional communication.' },
    { title: 'Practical evaluation', copy: 'Review how well your responses demonstrate relevant knowledge and transferable skills.' },
    { title: 'Thoughtful follow-ups', copy: 'Practice explaining your decisions, learning, and contribution in more detail.' },
  ];

  return (
    <StandardPage eyebrow="AI Interview" title="Practice interviews that feel real, sharp, and role-specific." description="Move from generic preparation to adaptive simulation built around your background, goals, and weak spots." illustration="/career-interview.svg" illustrationAlt="Professional avatar preparing for an interview" startTo="/interview/start">
      <div className="interview-layout" style={{ marginTop: 24 }}>
        <div className="interview-panel">
          <div className="mode-pills">
            {['Role-specific', 'Case discussion', 'Portfolio review', 'Behavioral'].map((mode) => (<span key={mode} className="mode-pill">{mode}</span>))}
          </div>
          <div className="conversation-card">
            <div className="conversation-row"><span className="bubble ai">AI</span><p>Tell me about a project or experience that best represents the work you want to do.</p></div>
            <div className="conversation-row user"><span className="bubble user-badge">You</span><p>I worked with a small team, planned the work around our goals, and used feedback to improve the final result.</p></div>
            <div className="conversation-row"><span className="bubble ai">AI</span><p>What challenge came up, and how did your contribution help move the work forward?</p></div>
          </div>
        </div>

        <aside className="panel-side">
          <div className="panel-header"><strong>Practice feedback</strong><span>Sample</span></div>
          <div className="competency-row"><div className="competency-label-row"><span>Relevant knowledge</span><strong>82%</strong></div><div className="progress-track"><span style={{ width: '82%' }} /></div></div>
          <div className="competency-row"><div className="competency-label-row"><span>Communication</span><strong>88%</strong></div><div className="progress-track"><span style={{ width: '88%' }} /></div></div>
          <div className="competency-row"><div className="competency-label-row"><span>Example quality</span><strong>76%</strong></div><div className="progress-track"><span style={{ width: '76%' }} /></div></div>
          <div className="timer-box"><TimerReset size={16} /><span>Round timer</span><strong>23:14</strong></div>
        </aside>
      </div>

      <div className="section" style={{ paddingTop: 24, paddingBottom: 0 }}>
        <div className="workflow-grid" style={{ marginTop: 8 }}>
          {interviewModes.map(({ label, summary }) => (
            <article key={label} className="workflow-card">
              <span className="step-number">{label}</span>
              <h3>{label}</h3>
              <p>{summary}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="section" style={{ paddingTop: 16, paddingBottom: 0 }}>
        <div className="readiness-grid">
          <div className="report-card">
            <SectionHeading eyebrow="What makes it different" title="Practice telling the story of your work." description="SkillAI helps you organize your experience, explain your decisions, and speak clearly about what you can contribute in your chosen profession." />
            <div className="score-breakdown">
              <div><span>Clarity</span><strong>86</strong></div>
              <div><span>Relevant examples</span><strong>82</strong></div>
              <div><span>Communication</span><strong>79</strong></div>
              <div><span>Confidence</span><strong>74</strong></div>
            </div>
          </div>

          <div className="weakness-card">
            <div className="panel-header"><strong>How it works</strong><span>AI-powered</span></div>
            <div className="weakness-list">
              {deliveryFeatures.map(({ title, copy }) => (
                <div key={title} className="weakness-item">
                  <h4>{title}</h4>
                  <small>{copy}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </StandardPage>
  );
}

function ResumePage() {
  return (
    <StandardPage
      eyebrow="Resume tools"
      title="Make your resume work harder for your next opportunity."
      description="Use your resume to prepare for a more relevant AI interview. SkillAI reads PDF, DOCX, and TXT files in your browser and uses the extracted text to tailor interview questions—with your consent."
      illustration="/career-interview.svg"
      illustrationAlt="Learner preparing for an interview using their resume"
      startTo="/interview/start"
    >
      <section className="resume-tools-grid" aria-label="Resume preparation steps">
        <article className="resume-tool-card">
          <span className="resume-tool-icon"><FileText size={20} /></span>
          <span className="eyebrow">01 · Add your resume</span>
          <h2>Start with your experience</h2>
          <p>Upload a PDF, DOCX, or TXT resume from your device in the AI Interview setup. The original file stays in your browser.</p>
        </article>
        <article className="resume-tool-card">
          <span className="resume-tool-icon"><ShieldCheck size={20} /></span>
          <span className="eyebrow">02 · Choose what matters</span>
          <h2>Set your direction</h2>
          <p>Select a branch and interview domain. Review the details and choose whether to share extracted resume text for tailored questions.</p>
        </article>
        <article className="resume-tool-card">
          <span className="resume-tool-icon"><Sparkles size={20} /></span>
          <span className="eyebrow">03 · Practice with purpose</span>
          <h2>Get role-aware practice</h2>
          <p>Answer questions shaped by your chosen field and resume experience, then review feedback to improve your next response.</p>
        </article>
      </section>
      <div className="resume-tools-privacy">
        <strong>Your resume stays yours.</strong>
        <p>The original file is not uploaded or stored by SkillAI. Extracted text is sent to the AI service only after you give consent in the interview setup.</p>
      </div>
    </StandardPage>
  );
}

function AssessmentPage() {
  return (
    <StandardPage eyebrow="AI-Powered Skill Assessment" title="Take an online skill assessment and see what to learn next." description="Test your knowledge in a selected subject or career field with tailored AI-generated questions. Review your strengths and get practical suggestions for what to build next." illustration="/career-assessment.svg" illustrationAlt="Learner reviewing a personal skill assessment" startTo="/assessment/start">
      <div className="readiness-grid" style={{ marginTop: 24 }}>
        <div className="report-card">
          <div className="big-score"><strong>78</strong><span>/ 100</span></div>
          <div className="score-breakdown">
            <div><span>Field Knowledge</span><strong>84</strong></div>
            <div><span>Interview Performance</span><strong>76</strong></div>
            <div><span>Communication</span><strong>72</strong></div>
            <div><span>Practical Experience</span><strong>81</strong></div>
          </div>
        </div>
        <div className="weakness-card">
          <div className="panel-header"><strong>Focus areas</strong><span>Recommended</span></div>
          <div className="weakness-list">
            {[['Communication', 'Confident'], ['Applied Knowledge', 'Confident'], ['Planning Next Steps', 'Confident']].map(([skill, level]) => (
              <div key={skill} className="weakness-item">
                <h4>{skill}</h4>
                <div className="weakness-meta"><span>Current: Intermediate</span><span>Target: {level}</span></div>
                <small>Use practical examples to show what you know and where you want to grow.</small>
              </div>
            ))}
          </div>
        </div>
      </div>
      <section className="assessment-examples">
        <SectionHeading eyebrow="Across every discipline" title="Skills show up differently in every field." description="A useful assessment looks at more than one kind of knowledge. It recognizes how you learn, apply ideas, and work with others." />
        <div className="assessment-example-grid">
          <article><span>Engineering</span><h3>Practical problem solving</h3><p>Show how you approach a challenge, test ideas, and improve a solution.</p></article>
          <article><span>Healthcare</span><h3>Care and communication</h3><p>Reflect on applied knowledge, clear communication, and thoughtful decisions.</p></article>
          <article><span>Business</span><h3>Analysis and teamwork</h3><p>Connect information, collaborate, and explain the reasoning behind a decision.</p></article>
          <article><span>Arts & design</span><h3>Creative practice</h3><p>Present your process, creative choices, and the needs your work responds to.</p></article>
        </div>
      </section>
      <section className="section wrap">
        <SectionHeading eyebrow="Online skills test FAQ" title="Skill assessment questions, answered." description="Learn what an AI-powered assessment covers, how free practice works, and how to use your results." />
        <div className="workflow-grid">
          {ASSESSMENT_FAQS.map(({ question, answer }, index) => (
            <article key={question} className="workflow-card">
              <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </StandardPage>
  );
}

function getOpenAlexAbstract(invertedIndex) {
  if (!invertedIndex) return "";
  const words = [];
  Object.entries(invertedIndex).forEach(([word, positions]) => {
    positions.forEach((position) => {
      words[position] = word;
    });
  });
  return words.filter(Boolean).join(" ").replace(/\s+([.,;:!?])/g, "$1");
}

function normalizeLinkForComparison(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
}

function isRemovedRepositoryRecord(paper) {
  const normalizedDoi = String(paper?.doi || "").replace(/^https?:\/\/doi\.org\//i, "").toLowerCase();
  return REMOVED_ZENODO_DOIS.has(normalizedDoi);
}

function getScholarSearchUrl(title) {
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${title || ""}"`)}`;
}

function getDirectPdfUrl(location) {
  const pdfUrl = location?.pdf_url;
  if (typeof pdfUrl !== "string" || !/^https?:\/\//i.test(pdfUrl)) return "";
  if (normalizeLinkForComparison(pdfUrl) === normalizeLinkForComparison(location?.landing_page_url)) return "";
  return pdfUrl;
}

function isSavedResearchSearch(value) {
  return value
    && typeof value.id === "string"
    && typeof value.name === "string"
    && value.filters
    && typeof value.filters === "object"
    && typeof value.filters.branch === "string"
    && Object.hasOwn(academicPaths, value.filters.branch);
}

function isResearchLibraryItem(value) {
  return value
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.year === "number"
    && Array.isArray(value.authors)
    && value.authors.every((author) => typeof author === "string")
    && typeof value.journal === "string"
    && typeof value.sourceUrl === "string"
    && typeof value.doi === "string"
    && typeof value.pdfUrl === "string"
    && typeof value.status === "string"
    && ["To read", "Reading", "Done"].includes(value.status)
    && typeof value.notes === "string";
}

function escapeBibTeX(value) {
  const replacements = {
    "\\": "\\textbackslash{}",
    "&": "\\&",
    "%": "\\%",
    "$": "\\$",
    "#": "\\#",
    "_": "\\_",
    "{": "\\{",
    "}": "\\}",
  };
  return String(value || "").replace(/[\\&%$#_{}]/g, (character) => replacements[character]);
}

function cleanCitationField(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function createCitationFile(papers, format) {
  const entries = papers.map((paper, index) => {
    const title = cleanCitationField(paper.title);
    const authors = paper.authors.map(cleanCitationField).filter(Boolean).join(format === "ris" ? "\nAU  - " : " and ");
    const journal = cleanCitationField(paper.journal);
    const doi = cleanCitationField(paper.doi).replace(/^https?:\/\/doi\.org\//, "");
    const sourceUrl = cleanCitationField(paper.sourceUrl);
    if (format === "ris") {
      return [
        "TY  - JOUR",
        `ID  - ${cleanCitationField(paper.id)}`,
        `TI  - ${title}`,
        authors ? `AU  - ${authors}` : "",
        paper.year ? `PY  - ${paper.year}` : "",
        journal ? `JO  - ${journal}` : "",
        doi ? `DO  - ${doi}` : "",
        `UR  - ${sourceUrl}`,
        "ER  - ",
      ].filter(Boolean).join("\n");
    }

    const firstAuthor = cleanCitationField(paper.authors[0]).split(/\s+/).pop() || "paper";
    const titleSlug = title.split(/\s+/).slice(0, 3).join("");
    const citationKey = `${firstAuthor}${paper.year || ""}${titleSlug}${index + 1}`.replace(/[^A-Za-z0-9]/g, "") || `paper${index + 1}`;
    return [
      "@misc{" + citationKey + ",",
      `  title = {${escapeBibTeX(title)}},`,
      authors ? `  author = {${escapeBibTeX(authors)}},` : "",
      paper.year ? `  year = {${paper.year}},` : "",
      journal ? `  howpublished = {${escapeBibTeX(journal)}},` : "",
      doi ? `  doi = {${escapeBibTeX(doi)}},` : "",
      `  url = {${escapeBibTeX(sourceUrl)}}`,
      "}",
    ].filter(Boolean).join("\n");
  });
  return entries.join(format === "ris" ? "\n\n" : "\n\n");
}

function ResearchPaperAssistant({ paper }) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [signInRequired, setSignInRequired] = useState(false);
  const canAsk = Boolean(paper.abstract) && questionCount < 3 && !isLoading;

  const requestAssistant = async (action, askedQuestion = "") => {
    setError("");
    setUpgradeRequired(false);
    setSignInRequired(false);
    setIsLoading(true);
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch(apiUrl("/api/research-assistant"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action,
          paperId: paper.id,
          title: paper.title,
          year: paper.year,
          journal: paper.journal,
          abstract: paper.abstract,
          question: askedQuestion,
          history: messages.slice(-4),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setUpgradeRequired(result.code === "QUOTA_EXHAUSTED");
        throw new Error(result.error || "Research AI could not answer. Please try again.");
      }
      if (typeof result.answer !== "string" || !result.answer.trim()) {
        throw new Error("Research AI returned an empty answer. Please try again.");
      }
      if (action === "summarize") {
        setSummary(result.answer.trim());
      } else {
        setMessages((current) => [...current, { question: askedQuestion, answer: result.answer.trim() }]);
        setQuestionCount((count) => count + 1);
        setQuestion("");
      }
    } catch (requestError) {
      setError(requestError.message || "Research AI could not answer. Please try again.");
      setSignInRequired(requestError.code === "AUTH_REQUIRED");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsk = (event) => {
    event.preventDefault();
    const askedQuestion = question.trim();
    if (!askedQuestion || !canAsk) return;
    requestAssistant("ask", askedQuestion);
  };

  return (
    <div className="research-ai">
      <button
        type="button"
        className="secondary-button research-ai-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Sparkles size={16} /> {isOpen ? "Hide AI paper helper" : "Summarize / ask AI"}
      </button>
      {isOpen && (
        <section className="research-ai-panel" aria-label={`AI paper helper for ${paper.title}`}>
          <p className="research-ai-disclaimer">
            AI uses only the paper abstract, not the full paper. Sign in to use AI paper help: Plus includes 10, Pro includes 30 AI paper requests per UTC month. You can ask up to 3 questions about each paper per page session.
          </p>
          {!paper.abstract && <p className="research-search-error" role="status">This paper has no available abstract, so AI summary and questions are unavailable.</p>}
          {paper.abstract && !summary && (
            <button
              type="button"
              className="primary-button"
              onClick={() => requestAssistant("summarize")}
              disabled={isLoading}
            >
              {isLoading ? <LoaderCircle size={16} className="research-spinner" /> : <Sparkles size={16} />}
              {isLoading ? "Preparing summary..." : "Summarize this paper"}
            </button>
          )}
          {summary && (
            <article className="research-ai-summary">
              <h4>Paper summary</h4>
              <p>{summary}</p>
            </article>
          )}
          {messages.map((message, index) => (
            <article className="research-ai-answer" key={`${index}-${message.question}`}>
              <h4>Your question</h4>
              <p>{message.question}</p>
              <h4>AI answer</h4>
              <p>{message.answer}</p>
            </article>
          ))}
          {paper.abstract && (
            <form className="research-ai-form" onSubmit={handleAsk}>
              <label className="research-filter" htmlFor={`research-ai-question-${paper.id}`}>
                <span>Ask about this paper ({Math.max(0, 3 - questionCount)} questions left)</span>
                <input
                  id={`research-ai-question-${paper.id}`}
                  type="text"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={500}
                  placeholder="e.g. What is the main finding?"
                  disabled={!canAsk}
                />
              </label>
              <button type="submit" className="secondary-button" disabled={!canAsk || !question.trim()}>
                Ask AI <ArrowRight size={15} />
              </button>
            </form>
          )}
          {isLoading && <p className="research-ai-loading" role="status">Reading the abstract and preparing a grounded answer…</p>}
          {error && <div className="research-search-error" role="alert"><p>{error}</p>{signInRequired && <Link to="/login">Sign in to SkillAI</Link>}{upgradeRequired && <Link to="/pricing">View plans</Link>}</div>}
        </section>
      )}
    </div>
  );
}

function ResearchPage() {
  const currentYear = new Date().getFullYear();
  const branches = Object.keys(academicPaths);
  const [form, setForm] = useState({
    branch: branches[0],
    course: academicPaths[branches[0]].courses[0],
    domain: academicPaths[branches[0]].domains[0],
    keywords: "",
    fromYear: String(Math.max(1949, currentYear - 4)),
    toYear: String(currentYear),
    workType: "article",
    sort: "relevance_score:desc",
    openAccessOnly: false,
    resultLimit: "20",
  });
  const [papers, setPapers] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [excludedRetractedCount, setExcludedRetractedCount] = useState(0);
  const [savedSearches, setSavedSearches] = useState([]);
  const [savedSearchName, setSavedSearchName] = useState("");
  const [savedSearchMessage, setSavedSearchMessage] = useState("");
  const [researchLibrary, setResearchLibrary] = useState([]);
  const [libraryMessage, setLibraryMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchController = useRef(null);
  const yearOptions = Array.from({ length: currentYear - 1949 }, (_, index) => String(currentYear - index));

  useEffect(() => () => searchController.current?.abort(), []);

  useEffect(() => {
    try {
      const serialized = window.localStorage.getItem(SAVED_RESEARCH_SEARCHES_KEY);
      if (!serialized) return;

      const storedSearches = JSON.parse(serialized);
      if (!Array.isArray(storedSearches)) throw new Error("Saved searches have an invalid format.");
      const validSearches = storedSearches.filter(isSavedResearchSearch);
      setSavedSearches(validSearches.slice(0, 50));
      if (validSearches.length !== storedSearches.length) {
        setSavedSearchMessage("Some saved searches were skipped because their saved data is invalid.");
      }
      if (validSearches.length > 50) {
        setSavedSearchMessage("Showing the 50 most recent saved searches.");
      }
    } catch (error) {
      setSavedSearchMessage(error instanceof Error ? error.message : "Saved searches could not be loaded.");
    }
  }, []);

  useEffect(() => {
    try {
      const serialized = window.localStorage.getItem(RESEARCH_LIBRARY_KEY);
      if (!serialized) return;

      const storedItems = JSON.parse(serialized);
      if (!Array.isArray(storedItems)) throw new Error("Your research library has an invalid format.");
      const validItems = storedItems.filter(isResearchLibraryItem);
      setResearchLibrary(validItems.slice(0, RESEARCH_LIBRARY_LIMIT));
      if (validItems.length !== storedItems.length) {
        setLibraryMessage("Some saved papers were skipped because their saved data is invalid.");
      } else if (validItems.length > RESEARCH_LIBRARY_LIMIT) {
        setLibraryMessage(`Showing the ${RESEARCH_LIBRARY_LIMIT} most recently saved papers.`);
      }
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Your research library could not be loaded.");
    }
  }, []);

  const persistResearchLibrary = (nextLibrary, message) => {
    try {
      window.localStorage.setItem(RESEARCH_LIBRARY_KEY, JSON.stringify(nextLibrary));
      setResearchLibrary(nextLibrary);
      setLibraryMessage(message);
    } catch {
      setLibraryMessage("Could not update your library in this browser. Check available storage and try again.");
    }
  };

  const savePaperToLibrary = (paper) => {
    if (researchLibrary.some((item) => item.id === paper.id)) {
      setLibraryMessage("This paper is already in your library.");
      return;
    }
    if (researchLibrary.length >= RESEARCH_LIBRARY_LIMIT) {
      setLibraryMessage(`Your library can hold up to ${RESEARCH_LIBRARY_LIMIT} papers. Remove a paper before adding another.`);
      return;
    }

    const libraryItem = {
      id: paper.id,
      title: paper.title,
      year: paper.year || 0,
      authors: paper.authors || [],
      journal: paper.journal || "",
      doi: paper.doi || "",
      sourceUrl: paper.sourceUrl || paper.id,
      pdfUrl: paper.pdfUrl || "",
      status: "To read",
      notes: "",
      savedAt: new Date().toISOString(),
    };
    persistResearchLibrary([libraryItem, ...researchLibrary], `Saved "${paper.title}" to My Library.`);
  };

  const updateLibraryItem = (itemId, updates) => {
    const nextLibrary = researchLibrary.map((item) => item.id === itemId ? { ...item, ...updates } : item);
    persistResearchLibrary(nextLibrary, "My Library updated.");
  };

  const removeLibraryItem = (itemId) => {
    persistResearchLibrary(researchLibrary.filter((item) => item.id !== itemId), "Paper removed from My Library.");
  };

  const exportCitations = (format) => {
    if (researchLibrary.length === 0) {
      setLibraryMessage("Save a paper to My Library before exporting citations.");
      return;
    }
    const extension = format === "ris" ? "ris" : "bib";
    const mimeType = format === "ris" ? "application/x-research-info-systems" : "application/x-bibtex";
    const blobUrl = URL.createObjectURL(new Blob([createCitationFile(researchLibrary, format)], { type: `${mimeType};charset=utf-8` }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `skillai-research-library.${extension}`;
    link.click();
    URL.revokeObjectURL(blobUrl);
    setLibraryMessage(`Exported ${researchLibrary.length} citation${researchLibrary.length === 1 ? "" : "s"} as ${format.toUpperCase()}.`);
  };

  const persistSavedSearches = (nextSearches, message) => {
    try {
      window.localStorage.setItem(SAVED_RESEARCH_SEARCHES_KEY, JSON.stringify(nextSearches));
      setSavedSearches(nextSearches);
      setSavedSearchMessage(message);
    } catch {
      setSavedSearchMessage("Could not update saved searches in this browser. Check available storage and try again.");
    }
  };

  const saveCurrentSearch = (event) => {
    event.preventDefault();
    const name = savedSearchName.trim();
    if (!name) {
      setSavedSearchMessage("Enter a name for this search.");
      return;
    }

    const existingSearch = savedSearches.find((search) => search.name.toLowerCase() === name.toLowerCase());
    const nextSearch = {
      id: existingSearch?.id || `research-${Date.now()}`,
      name,
      filters: { ...form },
      updatedAt: new Date().toISOString(),
    };
    const nextSearches = [nextSearch, ...savedSearches.filter((search) => search.id !== nextSearch.id)].slice(0, 50);
    persistSavedSearches(nextSearches, `Saved "${name}".`);
    setSavedSearchName("");
  };

  const applySavedSearch = (search) => {
    const branch = search.filters.branch;
    const path = academicPaths[branch];
    setForm({
      branch,
      course: path.courses.includes(search.filters.course) ? search.filters.course : path.courses[0],
      domain: path.domains.includes(search.filters.domain) ? search.filters.domain : path.domains[0],
      keywords: typeof search.filters.keywords === "string" ? search.filters.keywords : "",
      fromYear: typeof search.filters.fromYear === "string" ? search.filters.fromYear : String(Math.max(1949, currentYear - 4)),
      toYear: typeof search.filters.toYear === "string" ? search.filters.toYear : String(currentYear),
      workType: typeof search.filters.workType === "string" ? search.filters.workType : "article",
      sort: typeof search.filters.sort === "string" ? search.filters.sort : "relevance_score:desc",
      openAccessOnly: search.filters.openAccessOnly === true,
      resultLimit: ["20", "50", "100"].includes(search.filters.resultLimit) ? search.filters.resultLimit : "20",
    });
    setSavedSearchMessage(`Loaded "${search.name}". Select Find research papers to run it.`);
  };

  const removeSavedSearch = (searchId) => {
    persistSavedSearches(savedSearches.filter((search) => search.id !== searchId), "Saved search removed.");
  };

  const handleBranchChange = (event) => {
    const branch = event.target.value;
    setForm((current) => ({
      ...current,
      branch,
      course: academicPaths[branch].courses[0],
      domain: academicPaths[branch].domains[0],
    }));
  };

  const handleFromYearChange = (event) => {
    const fromYear = event.target.value;
    setForm((current) => ({
      ...current,
      fromYear,
      toYear: Number(fromYear) > Number(current.toYear) ? fromYear : current.toYear,
    }));
  };

  const handleToYearChange = (event) => {
    const toYear = event.target.value;
    setForm((current) => ({
      ...current,
      fromYear: Number(toYear) < Number(current.fromYear) ? toYear : current.fromYear,
      toYear,
    }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setSearchError("");
    setExcludedRetractedCount(0);
    setPapers([]);
    setHasSearched(false);

    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setIsSearching(true);

    const searchTerms = [form.domain, form.course, form.branch, form.keywords.trim()].filter(Boolean).join(" ");
    const filters = [
      `from_publication_date:${form.fromYear}-01-01`,
      `to_publication_date:${form.toYear}-12-31`,
      `type:${form.workType}`,
      form.openAccessOnly ? "is_oa:true" : "",
    ].filter(Boolean);
    const params = new URLSearchParams({
      search: searchTerms,
      filter: filters.join(","),
      "per-page": form.resultLimit,
      sort: form.sort,
      select: "id,doi,title,publication_year,authorships,primary_location,best_oa_location,open_access,is_retracted,cited_by_count,abstract_inverted_index",
    });

    try {
      const response = await fetch(`https://api.openalex.org/works?${params}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`The scholarly search service returned ${response.status}. Please try again later.`);
      }

      const data = await response.json();
      if (!Array.isArray(data.results)) {
        throw new Error("The scholarly search service returned an unexpected response.");
      }
      const availablePapers = data.results.filter((paper) => paper.is_retracted !== true);
      setExcludedRetractedCount(data.results.length - availablePapers.length);
      setPapers(availablePapers.map((paper) => ({
        id: paper.id,
        title: paper.title || "Untitled research work",
        year: paper.publication_year,
        authors: (paper.authorships || []).map((entry) => entry.author?.display_name).filter(Boolean),
        journal: paper.primary_location?.source?.display_name || paper.best_oa_location?.source?.display_name || "Publication details unavailable",
        doi: paper.doi || "",
        sourceUrl: paper.best_oa_location?.landing_page_url
          || paper.primary_location?.landing_page_url
          || paper.doi
          || paper.id,
        pdfUrl: isRemovedRepositoryRecord(paper)
          ? ""
          : getDirectPdfUrl(paper.best_oa_location) || getDirectPdfUrl(paper.primary_location),
        alternateSearchUrl: getScholarSearchUrl(paper.title),
        sourceUnavailable: isRemovedRepositoryRecord(paper),
        isOpenAccess: Boolean(paper.open_access?.is_oa),
        citations: Number.isFinite(paper.cited_by_count) ? paper.cited_by_count : 0,
        abstract: getOpenAlexAbstract(paper.abstract_inverted_index),
      })).sort((first, second) => Number(Boolean(second.pdfUrl)) - Number(Boolean(first.pdfUrl))));
      setHasSearched(true);
    } catch (error) {
      if (error.name !== "AbortError") {
        setSearchError(error.message || "Research papers could not be loaded. Please try again.");
      }
    } finally {
      if (searchController.current === controller) {
        searchController.current = null;
        setIsSearching(false);
      }
    }
  };

  const downloadResults = () => {
    const columns = ["Title", "Authors", "Year", "Journal", "Citations", "DOI", "Source URL", "PDF URL"];
    const rows = papers.map((paper) => [
      paper.title,
      paper.authors.join("; "),
      paper.year,
      paper.journal,
      paper.citations,
      paper.doi,
      paper.sourceUrl,
      paper.pdfUrl,
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blobUrl = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "skillai-research-results.csv";
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <main className="page-shell standard-page research-page">
      <section className="standard-hero wrap">
        <div className="standard-hero-copy">
          <span className="eyebrow">Research Papers</span>
          <h1>Find scholarly work for your field of study.</h1>
          <p>Search indexed research by branch, course, subject area, publication dates, and optional keywords. Filter by work type and open access, then sort by relevance, citations, or date.</p>
        </div>
        <div className="standard-hero-art">
          <img src="/career-research.svg" alt="Researcher exploring scholarly papers" />
        </div>
      </section>

      <section className="wrap standard-content">
        <div className="research-search-panel">
          <div className="section-heading">
            <span className="eyebrow">Paper finder</span>
            <h2>Choose your academic area.</h2>
            <p>Find relevant research faster. Filter by subject, publication year, work type, and open access, then save papers to your library or export citations.</p>
          </div>
          <form className="research-search-form" onSubmit={handleSearch}>
            <label className="research-filter" htmlFor="paper-branch">
              <span>Branch</span>
              <select id="paper-branch" value={form.branch} onChange={handleBranchChange}>
                {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </label>
            <label className="research-filter" htmlFor="paper-course">
              <span>Course</span>
              <select id="paper-course" value={form.course} onChange={(event) => setForm((current) => ({ ...current, course: event.target.value }))}>
                {academicPaths[form.branch].courses.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </label>
            <label className="research-filter" htmlFor="paper-domain">
              <span>Subject area</span>
              <select id="paper-domain" value={form.domain} onChange={(event) => setForm((current) => ({ ...current, domain: event.target.value }))}>
                {academicPaths[form.branch].domains.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
              </select>
            </label>
            <label className="research-filter" htmlFor="paper-keywords">
              <span>Keywords <small>(optional)</small></span>
              <input id="paper-keywords" type="search" value={form.keywords} onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))} placeholder="e.g. machine learning" />
            </label>
            <label className="research-filter" htmlFor="paper-from-year">
              <span>From year</span>
              <select id="paper-from-year" value={form.fromYear} onChange={handleFromYearChange}>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label className="research-filter" htmlFor="paper-to-year">
              <span>To year</span>
              <select id="paper-to-year" value={form.toYear} onChange={handleToYearChange}>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label className="research-filter" htmlFor="paper-type">
              <span>Work type</span>
              <select id="paper-type" value={form.workType} onChange={(event) => setForm((current) => ({ ...current, workType: event.target.value }))}>
                <option value="article">Journal article</option>
                <option value="review">Review</option>
                <option value="preprint">Preprint</option>
                <option value="book-chapter">Book chapter</option>
                <option value="book">Book</option>
                <option value="dissertation">Dissertation</option>
                <option value="dataset">Dataset</option>
              </select>
            </label>
            <label className="research-filter" htmlFor="paper-sort">
              <span>Sort by</span>
              <select id="paper-sort" value={form.sort} onChange={(event) => setForm((current) => ({ ...current, sort: event.target.value }))}>
                <option value="relevance_score:desc">Most relevant</option>
                <option value="cited_by_count:desc">Most cited</option>
                <option value="publication_date:desc">Newest first</option>
                <option value="publication_date:asc">Oldest first</option>
              </select>
            </label>
            <label className="research-filter" htmlFor="paper-result-limit">
              <span>Results</span>
              <select id="paper-result-limit" value={form.resultLimit} onChange={(event) => setForm((current) => ({ ...current, resultLimit: event.target.value }))}>
                <option value="20">20 papers</option>
                <option value="50">50 papers</option>
                <option value="100">100 papers</option>
              </select>
            </label>
            <label className="research-filter research-filter-checkbox" htmlFor="paper-open-access">
              <input id="paper-open-access" type="checkbox" checked={form.openAccessOnly} onChange={(event) => setForm((current) => ({ ...current, openAccessOnly: event.target.checked }))} />
              <span>Open-access only</span>
            </label>
            <button type="submit" className="primary-button research-search-button" disabled={isSearching}>
              {isSearching ? <LoaderCircle size={17} className="research-spinner" /> : <Search size={17} />}
              {isSearching ? "Searching papers..." : "Find research papers"}
            </button>
          </form>
          {searchError && <p className="research-search-error" role="alert">{searchError}</p>}
          <section className="research-saved-searches" aria-labelledby="saved-searches-heading">
            <div className="research-saved-search-form">
              <label className="research-filter" htmlFor="saved-search-name">
                <span id="saved-searches-heading">Save this search</span>
                <input
                  id="saved-search-name"
                  type="text"
                  maxLength={50}
                  value={savedSearchName}
                  onChange={(event) => setSavedSearchName(event.target.value)}
                  placeholder="e.g. Recent AI reviews"
                />
              </label>
              <button type="button" className="secondary-button" onClick={saveCurrentSearch}>
                Save search
              </button>
            </div>
            <p className="research-saved-search-note">Saved searches stay in this browser on this device only. Email alerts are not enabled.</p>
            {savedSearchMessage && <p className="research-saved-search-message" role="status">{savedSearchMessage}</p>}
            {savedSearches.length > 0 && (
              <ul className="research-saved-search-list" aria-label="Your saved research searches">
                {savedSearches.map((search) => (
                  <li key={search.id}>
                    <button type="button" className="research-saved-search-load" onClick={() => applySavedSearch(search)}>
                      <strong>{search.name}</strong>
                      <span>{search.filters.branch} · {search.filters.course || "All courses"} · {search.filters.fromYear || "Any year"}–{search.filters.toYear || "present"}</span>
                    </button>
                    <button type="button" className="research-saved-search-remove" onClick={() => removeSavedSearch(search.id)} aria-label={`Remove saved search ${search.name}`}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {isSearching && (
          <div className="research-result-status" role="status" aria-label="Searching research papers">
            <LoaderCircle size={32} className="research-spinner research-spinner-large" aria-hidden="true" />
          </div>
        )}
        <section className="research-library" aria-labelledby="research-library-heading">
          <div className="research-library-header">
            <div>
              <span className="eyebrow">Your collection</span>
              <h2 id="research-library-heading">My Library <span>({researchLibrary.length})</span></h2>
              <p>Save papers, track reading progress, and keep private notes in this browser.</p>
            </div>
            <div className="research-library-exports">
              <button type="button" className="secondary-button" onClick={() => exportCitations("bib")} disabled={!researchLibrary.length}>
                <FileText size={16} /> Export BibTeX
              </button>
              <button type="button" className="secondary-button" onClick={() => exportCitations("ris")} disabled={!researchLibrary.length}>
                <FileText size={16} /> Export RIS
              </button>
            </div>
          </div>
          <p className="research-library-note">Library and notes are stored only on this device; they are not synced to an account.</p>
          {libraryMessage && <p className="research-saved-search-message" role="status">{libraryMessage}</p>}
          {researchLibrary.length === 0 ? (
            <div className="research-no-results"><p>Your library is empty. Add papers from search results to organize them here.</p></div>
          ) : (
            <div className="research-library-list">
              {researchLibrary.map((paper) => (
                <article className="research-library-card" key={paper.id}>
                  <div className="research-library-paper">
                    <h3>
                      <a href={isRemovedRepositoryRecord(paper) ? getScholarSearchUrl(paper.title) : paper.sourceUrl} target="_blank" rel="noreferrer">
                        {paper.title}
                      </a>
                    </h3>
                    <p>{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? ` + ${paper.authors.length - 4} more` : ""}</p>
                    <p>{paper.journal}{paper.year ? ` · ${paper.year}` : ""}{paper.doi ? ` · DOI: ${paper.doi.replace(/^https?:\/\/doi\.org\//, "")}` : ""}</p>
                    {isRemovedRepositoryRecord(paper) && <p>This Zenodo record was removed. The title opens a search for other versions.</p>}
                  </div>
                  <div className="research-library-controls">
                    <label className="research-filter" htmlFor={`library-status-${paper.id}`}>
                      <span>Reading status</span>
                      <select id={`library-status-${paper.id}`} value={paper.status} onChange={(event) => updateLibraryItem(paper.id, { status: event.target.value })}>
                        <option>To read</option>
                        <option>Reading</option>
                        <option>Done</option>
                      </select>
                    </label>
                    <label className="research-filter" htmlFor={`library-notes-${paper.id}`}>
                      <span>Private notes</span>
                      <textarea
                        id={`library-notes-${paper.id}`}
                        value={paper.notes}
                        maxLength={2000}
                        onChange={(event) => updateLibraryItem(paper.id, { notes: event.target.value })}
                        placeholder="Add your research notes..."
                        rows={3}
                      />
                    </label>
                  </div>
                  <button type="button" className="research-saved-search-remove research-library-remove" onClick={() => removeLibraryItem(paper.id)}>
                    Remove from library
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
        {hasSearched && (
          <section className="research-results" aria-live="polite">
            <div className="research-results-header">
              <div>
                <span className="eyebrow">Search results</span>
                <h2>{papers.length ? `${papers.length} papers found` : "No papers found"}</h2>
                <p>{form.domain} · {form.course} · {form.fromYear}–{form.toYear}{form.openAccessOnly ? " · Open access" : ""}</p>
                {excludedRetractedCount > 0 && <p>{excludedRetractedCount} record{excludedRetractedCount === 1 ? "" : "s"} marked as retracted were hidden.</p>}
              </div>
              {papers.length > 0 && (
                <button type="button" className="secondary-button research-export-button" onClick={downloadResults}>
                  <Download size={16} /> Download results
                </button>
              )}
            </div>
            {papers.length === 0 ? (
              <div className="research-no-results">
                <p>{excludedRetractedCount > 0
                  ? "All returned records were marked as retracted and hidden. Try another query."
                  : "No matching papers were returned. Try broadening the date range, changing the work type, or using related keywords."}</p>
              </div>
            ) : (
              <div className="research-paper-list">
                {papers.map((paper) => (
                  <article key={paper.id} className="research-result-card">
                    <div className="research-result-meta">
                      <span>{paper.year || "Year unavailable"}</span>
                      <span>{paper.isOpenAccess ? "Open access" : "Access via source"}</span>
                      <span>{paper.citations.toLocaleString()} citations</span>
                    </div>
                    <h3>{paper.title}</h3>
                    <p className="research-result-authors">{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? ` + ${paper.authors.length - 4} more` : ""}</p>
                    <p className="research-result-journal">{paper.journal}</p>
                    {paper.abstract && <p className="research-result-abstract">{paper.abstract}</p>}
                    <button
                      type="button"
                      className="secondary-button research-library-save"
                      onClick={() => savePaperToLibrary(paper)}
                      disabled={researchLibrary.some((item) => item.id === paper.id)}
                    >
                      {researchLibrary.some((item) => item.id === paper.id) ? "Saved in My Library" : "Add to My Library"}
                    </button>
                    <ResearchPaperAssistant paper={paper} />
                    {paper.doi && <p className="research-result-doi">DOI: {paper.doi.replace(/^https?:\/\/doi\.org\//, "")}</p>}
                    <div className="research-result-actions">
                      {!paper.sourceUnavailable && (
                        <a className="secondary-button" href={paper.sourceUrl} target="_blank" rel="noreferrer">
                          View source <ExternalLink size={15} />
                        </a>
                      )}
                      {paper.pdfUrl && (
                        <a className="primary-button" href={paper.pdfUrl} target="_blank" rel="noreferrer">
                          Open / download PDF <Download size={15} />
                        </a>
                      )}
                    </div>
                    {!paper.pdfUrl && <p className="research-pdf-unavailable-note">No direct open-access PDF listed.</p>}
                    <div className="research-result-alternate-actions">
                      <a className="secondary-button" href={paper.alternateSearchUrl} target="_blank" rel="noreferrer">
                        Find other versions <ExternalLink size={15} />
                      </a>
                    </div>
                    <p className="research-result-link-note">
                      {paper.sourceUnavailable
                        ? "This Zenodo record was removed. Check other versions using the link below."
                        : "Repository copies can be removed while search indexes still show old links. Check another version if the source is unavailable."}
                    </p>
                  </article>
                ))}
              </div>
            )}
            <p className="research-attribution">Research metadata provided by <a href="https://openalex.org" target="_blank" rel="noreferrer">OpenAlex</a>. Full-text access is controlled by each publisher or repository.</p>
          </section>
        )}
      </section>
    </main>
  );
}

function ResearchMakerPage() {
  const [form, setForm] = useState({
    topic: "",
    question: "",
    discipline: "Computer Science",
    format: "Research paper",
    method: "Mixed methods",
    context: "",
    keywords: "",
    inclusionCriteria: "",
    exclusionCriteria: "",
    objectives: "",
  });
  const [outline, setOutline] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const topic = form.topic.trim();
    if (!topic) return;

    const sections = {
      "Research paper": [
        ["Introduction and problem statement", "Establish the context, explain who is affected, and support the problem with credible evidence."],
        ["Literature and research gap", "Synthesize relevant studies, compare their findings, and state the specific gap this project will address."],
        ["Research aim and objectives", "Translate the question into focused, measurable objectives that can be completed with available evidence."],
        ["Methodology and ethics", "Explain the design, data or participants, sampling, instruments, analysis, consent, and privacy safeguards."],
        ["Results, discussion, and limitations", "Report evidence transparently, relate findings to prior work, and describe uncertainty and limitations."],
        ["Conclusion and implications", "Answer the research question and state practical implications and future research."],
      ],
      "Literature review": [
        ["Review question and scope", "Define the population or subject, concepts, context, date range, and type of evidence covered."],
        ["Search protocol", "Record databases, search date, exact search strings, and any filters so another researcher can reproduce the search."],
        ["Eligibility and screening", "Apply predefined inclusion and exclusion criteria; track duplicate removal and reasons for excluding records."],
        ["Evidence extraction and appraisal", "Capture each study's design, sample, setting, measures, findings, limitations, and quality considerations."],
        ["Thematic synthesis", "Compare evidence across studies, explain agreement or disagreement, and avoid treating a study count as proof."],
        ["Research gaps and conclusion", "Summarize what is established, what remains uncertain, and which questions merit further study."],
      ],
      "Case study": [
        ["Case selection and boundaries", "Define the case, setting, timeframe, unit of analysis, and reason for selecting it."],
        ["Question and analytical framework", "State the case question and define the concepts or framework used to interpret evidence."],
        ["Evidence sources and methods", "Describe documents, observations, interviews, or datasets, how they will be selected, and how evidence will be triangulated."],
        ["Findings and interpretation", "Present evidence by theme or timeline and distinguish direct observations from interpretation."],
        ["Ethics, limitations, and transferability", "Address consent and privacy, explain limits of the case, and state where insights may or may not apply."],
        ["Conclusion", "Answer the case question and identify practical implications or follow-up questions."],
      ],
      "Systematic review": [
        ["Protocol and review question", "Specify the review question, protocol, scope, and whether the protocol will be registered."],
        ["Search strategy", "List databases, platforms, search dates, full search strings, and supplementary search methods."],
        ["Eligibility and study selection", "Define inclusion and exclusion criteria, screening stages, duplicate handling, and exclusion reasons."],
        ["Data extraction and risk of bias", "Predefine extracted fields and an appropriate critical appraisal or risk-of-bias tool."],
        ["Synthesis", "Choose a synthesis method suited to the evidence; explain heterogeneity and avoid unsupported pooling."],
        ["Reporting and limitations", "Document the selection flow, evidence limitations, protocol deviations, and conclusions."],
      ],
      "Research proposal": [
        ["Background and problem", "Explain the context, affected stakeholders, evidence-backed problem, and why it merits investigation."],
        ["Question, aim, and objectives", "Set one answerable main question and aligned objectives that define the project's boundaries."],
        ["Literature and rationale", "Summarize relevant evidence and explain how the proposed project addresses a genuine gap."],
        ["Methods, feasibility, and ethics", "Describe design, data access, analysis, resources, timeline, risks, and required ethical approvals."],
        ["Expected contribution and limitations", "State the intended contribution without promising results and identify foreseeable limitations."],
      ],
      "Thesis": [
        ["Introduction and research problem", "Establish the topic, research problem, scope, significance, and main question."],
        ["Critical literature review", "Organize prior work by themes, methods, and debates; identify the gap your thesis addresses."],
        ["Conceptual or theoretical framework", "Define key concepts and explain the framework that guides the study."],
        ["Methods and ethical considerations", "Document design, sampling, instruments, analysis, consent, privacy, and reproducibility."],
        ["Findings and discussion", "Present results clearly and interpret them in relation to the question and literature."],
        ["Conclusion, contribution, and future work", "Answer the question, state the contribution and limitations, and suggest grounded next steps."],
      ],
    };

    const keywords = form.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean);
    const objectives = form.objectives.split(/\r?\n/).map((objective) => objective.trim()).filter(Boolean);
    const methodGuidance = {
      Qualitative: "Use interviews, observations, documents, or other text-rich evidence; explain coding, interpretation, researcher reflexivity, and how credibility will be assessed.",
      Quantitative: "Define measurable variables, a justified sample and design, data quality checks, and an analysis plan aligned with the question before examining outcomes.",
      "Mixed methods": "Explain why both qualitative and quantitative evidence are needed, how each strand will be analyzed, and where the findings will be integrated.",
      "Evidence synthesis": "Use a documented search and screening process, predefined eligibility criteria, transparent extraction, and a synthesis method suited to the included studies.",
      "Case-based analysis": "Bound the case and timeframe, justify case selection, triangulate appropriate evidence sources, and distinguish observations from interpretation.",
    };
    setOutline({
      title: `${topic}: ${form.format} Plan`,
      question: form.question.trim(),
      approach: `${form.method} approach in ${form.discipline}. ${methodGuidance[form.method]} ${form.context.trim() ? `Study context: ${form.context.trim()}.` : "Define the study setting, population or data source before collecting evidence."}`,
      keywords,
      objectives,
      searchQuery: keywords.length ? keywords.map((keyword) => `"${keyword}"`).join(" AND ") : `"${topic}"`,
      inclusionCriteria: form.inclusionCriteria.trim(),
      exclusionCriteria: form.exclusionCriteria.trim(),
      sections: sections[form.format],
    });
  };

  const downloadPlan = () => {
    if (!outline) return;
    const lines = [
      outline.title,
      "",
      `Field: ${form.discipline}`,
      `Research format: ${form.format}`,
      `Methodology: ${form.method}`,
      "",
      `Research question: ${outline.question}`,
      `Study context: ${form.context.trim() || "To be defined"}`,
      `Keywords: ${outline.keywords.join(", ") || form.topic.trim()}`,
      `Search query: ${outline.searchQuery}`,
      `Inclusion criteria: ${outline.inclusionCriteria || "To be defined"}`,
      `Exclusion criteria: ${outline.exclusionCriteria || "To be defined"}`,
      "",
      "Research objectives:",
      ...(outline.objectives.length ? outline.objectives.map((objective, index) => `${index + 1}. ${objective}`) : ["To be defined"]),
      "",
      "Outline:",
      ...outline.sections.flatMap(([title, guidance], index) => [`${index + 1}. ${title}`, `   ${guidance}`]),
      "",
      "Planning aid only. Verify sources, facts, ethics requirements, and institutional guidance independently.",
    ];
    const blobUrl = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "skillai-research-plan.txt";
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <main className="page-shell standard-page research-maker-page">
      <section className="standard-hero wrap">
        <div className="standard-hero-copy">
          <span className="eyebrow">Research Maker</span>
          <h1>Build a research plan you can actually follow.</h1>
          <p>Clarify your question, define the method and scope, and leave with a structured plan and reproducible search query.</p>
          <a href="#research-maker-form" className="primary-button">Start a research plan <ArrowRight size={16} /></a>
        </div>
        <div className="standard-hero-art">
          <img src="/career-research.svg" alt="Researcher organizing ideas and evidence" />
        </div>
      </section>

      <section className="wrap standard-content">
        <div className="research-maker-panel" id="research-maker-form">
          <div className="section-heading">
            <span className="eyebrow">Research planning workspace</span>
            <h2>Define the question before the paper.</h2>
            <p>This creates a structured, editable planning template—not a finished paper. It does not search for sources or verify claims.</p>
          </div>
          <form className="research-maker-form" onSubmit={handleSubmit}>
            <label className="research-maker-field" htmlFor="research-topic">
              <span>Research topic</span>
              <input
                id="research-topic"
                type="text"
                value={form.topic}
                maxLength={200}
                onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
                placeholder="For example, AI tools in university learning"
                required
              />
            </label>
            <label className="research-maker-field research-maker-field-wide" htmlFor="research-question">
              <span>Main research question</span>
              <textarea
                id="research-question"
                value={form.question}
                maxLength={500}
                onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
                placeholder="What do you want to find out? Keep it focused and answerable."
                required
                rows={3}
              />
            </label>
            <label className="research-maker-field" htmlFor="research-discipline">
              <span>Field of study</span>
              <select
                id="research-discipline"
                value={form.discipline}
                onChange={(event) => setForm((current) => ({ ...current, discipline: event.target.value }))}
              >
                {["Computer Science", "Engineering", "Healthcare", "Business", "Education", "Environmental Science", "Social Science", "Other"].map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </label>
            <label className="research-maker-field" htmlFor="research-format">
              <span>Project format</span>
              <select
                id="research-format"
                value={form.format}
                onChange={(event) => setForm((current) => ({ ...current, format: event.target.value }))}
              >
                {["Research paper", "Literature review", "Systematic review", "Research proposal", "Case study", "Thesis"].map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </label>
            <label className="research-maker-field" htmlFor="research-method">
              <span>Methodology</span>
              <select
                id="research-method"
                value={form.method}
                onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
              >
                {["Qualitative", "Quantitative", "Mixed methods", "Evidence synthesis", "Case-based analysis"].map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
            <label className="research-maker-field" htmlFor="research-context">
              <span>Population, dataset, or study context</span>
              <input
                id="research-context"
                type="text"
                value={form.context}
                maxLength={200}
                onChange={(event) => setForm((current) => ({ ...current, context: event.target.value }))}
                placeholder="e.g. undergraduate students in public universities"
              />
            </label>
            <label className="research-maker-field" htmlFor="research-keywords">
              <span>Search keywords <small>comma-separated</small></span>
              <input
                id="research-keywords"
                type="text"
                value={form.keywords}
                maxLength={300}
                onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))}
                placeholder="e.g. generative AI, higher education, learning outcomes"
              />
            </label>
            <label className="research-maker-field research-maker-field-wide" htmlFor="research-objectives">
              <span>Objectives <small>one per line</small></span>
              <textarea
                id="research-objectives"
                value={form.objectives}
                maxLength={1200}
                onChange={(event) => setForm((current) => ({ ...current, objectives: event.target.value }))}
                placeholder={"Compare existing approaches\nIdentify reported benefits and limitations"}
                rows={3}
              />
            </label>
            <label className="research-maker-field" htmlFor="research-inclusion">
              <span>Include evidence that...</span>
              <textarea
                id="research-inclusion"
                value={form.inclusionCriteria}
                maxLength={500}
                onChange={(event) => setForm((current) => ({ ...current, inclusionCriteria: event.target.value }))}
                placeholder="e.g. studies involving university learners"
                rows={3}
              />
            </label>
            <label className="research-maker-field" htmlFor="research-exclusion">
              <span>Exclude evidence that...</span>
              <textarea
                id="research-exclusion"
                value={form.exclusionCriteria}
                maxLength={500}
                onChange={(event) => setForm((current) => ({ ...current, exclusionCriteria: event.target.value }))}
                placeholder="e.g. opinion pieces without methods or evidence"
                rows={3}
              />
            </label>
            <button type="submit" className="primary-button">Build research plan <ArrowRight size={16} /></button>
          </form>
        </div>

        {outline && (
          <section className="research-maker-result" aria-live="polite" aria-labelledby="research-outline-title">
            <div className="research-maker-result-header">
              <div>
                <span className="eyebrow">Research plan · {form.format}</span>
                <h2 id="research-outline-title">{outline.title}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={downloadPlan}><Download size={16} /> Download plan</button>
            </div>
            <div className="research-maker-guidance">
              <article>
                <h3>Research question</h3>
                <p>{outline.question}</p>
              </article>
              <article>
                <h3>Suggested approach</h3>
                <p>{outline.approach}</p>
              </article>
              <article>
                <h3>Search strategy starter</h3>
                <p><strong>Keywords:</strong> {outline.keywords.join(", ") || form.topic}</p>
                <code className="research-maker-search-query">{outline.searchQuery}</code>
              </article>
              <article>
                <h3>Evidence boundaries</h3>
                <p><strong>Include:</strong> {outline.inclusionCriteria || "Define which sources or participants are eligible."}</p>
                <p><strong>Exclude:</strong> {outline.exclusionCriteria || "Define which sources or participants are out of scope."}</p>
              </article>
            </div>
            <section className="research-maker-objectives" aria-label="Research objectives">
              <h3>Research objectives</h3>
              {outline.objectives.length ? (
                <ol>{outline.objectives.map((objective, index) => <li key={`${index}-${objective}`}>{objective}</li>)}</ol>
              ) : (
                <p>Add objectives in the form to define the practical steps for answering your question.</p>
              )}
            </section>
            <ol className="research-maker-sections">
              {outline.sections.map(([title, guidance]) => (
                <li key={title}>
                  <strong>{title}</strong>
                  <p>{guidance}</p>
                </li>
              ))}
            </ol>
            <p className="research-maker-disclaimer">Planning template only—it does not find or verify sources, establish facts, or replace supervisor and ethics guidance. Evaluate evidence critically and cite all sources you use.</p>
          </section>
        )}
      </section>
    </main>
  );
}

function RoadmapPage() {
  return (
    <StandardPage eyebrow="Career Roadmap" title="Turn your goals into a path you can follow." description="Connect your strengths to practical milestones and explore career directions that feel right for you." illustration="/career-roadmap.svg" illustrationAlt="Professional planning a route toward career goals">
      <div className="roadmap-grid" style={{ marginTop: 24 }}>
        {[
          { label: 'Current', title: 'Where you are today', skills: ['Your core knowledge', 'Coursework or training', 'Hands-on experience'], gap: ['Skills to strengthen', 'New areas to explore'], projects: ['A project that shows what you can do'] },
          { label: 'Next', title: 'A direction to explore', skills: ['Transferable strengths', 'Role-specific knowledge', 'Communication'], gap: ['Experience to build', 'Tools or methods to learn'], projects: ['A practical portfolio or field project'] },
          { label: 'Target', title: 'The goal you choose', skills: ['Capabilities for your goal', 'Professional practice', 'Continuous learning'], gap: ['Your next milestones', 'Support and experience'], projects: ['Work that demonstrates your growth'] },
        ].map((step) => (
          <article key={step.label} className="roadmap-card">
            <span className="roadmap-label">{step.label}</span>
            <h3>{step.title}</h3>
            <div><h4>Skills</h4><ul>{step.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></div>
            <div><h4>Skill gap</h4><ul>{step.gap.map((skill) => <li key={skill}>{skill}</li>)}</ul></div>
            <div><h4>Projects</h4><ul>{step.projects.map((project) => <li key={project}>{project}</li>)}</ul></div>
          </article>
        ))}
      </div>
    </StandardPage>
  );
}

function ResourcesPage() {
  return (
    <StandardPage eyebrow="Resources" title="Find useful ways to keep learning and growing." description="Explore guides, learning materials, and practical advice chosen to support your goals in any field." illustration="/career-resources.svg" illustrationAlt="Learner exploring career and learning resources">
      <div className="resource-grid" style={{ marginTop: 24 }}>
        {resourceCards.map(({ category, level, title }) => (
          <article key={title} className="resource-card">
            <div className="resource-topline"><span>{category}</span><span>{level}</span></div>
            <h3>{title}</h3>
            <Link to="/resources" className="text-link">View resource <ArrowRight size={15} /></Link>
          </article>
        ))}
      </div>
    </StandardPage>
  );
}

function ContactPage() {
  const handleSubmit = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") || "").trim();
    const email = String(values.get("email") || "").trim();
    const topic = String(values.get("topic") || "General enquiry");
    const message = String(values.get("message") || "").trim();
    const subject = encodeURIComponent(`SkillAI contact: ${topic}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`);
    window.location.href = `mailto:Business@alberotechnologies.com?subject=${subject}&body=${body}`;
  };

  return (
    <main className="page-shell contact-page">
      <section className="contact-hero wrap">
        <div className="contact-intro">
          <span className="eyebrow">Contact us</span>
          <h1>We'd love to hear from you.</h1>
          <p>Have a question, feedback, or an idea to share? Reach out to our team and we'll be glad to help.</p>
          <div className="contact-details" aria-label="Contact details">
            <a className="contact-detail-card" href="mailto:Business@alberotechnologies.com">
              <span className="contact-detail-icon"><Mail size={19} /></span>
              <span><small>Email us</small><strong>Business@alberotechnologies.com</strong></span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <a className="contact-detail-card" href="tel:+919170780671">
              <span className="contact-detail-icon"><Phone size={19} /></span>
              <span><small>Call us</small><strong>+91 91707 80761</strong></span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <div className="contact-detail-card">
              <span className="contact-detail-icon"><MapPin size={19} /></span>
              <span><small>Our location</small><strong>Noida, Uttar Pradesh, India</strong></span>
            </div>
          </div>
        </div>

        <div className="contact-form-side">
          <section className="contact-form-card" aria-labelledby="contact-form-title">
            <div className="contact-form-heading">
              <span className="contact-form-mark"><Send size={18} /></span>
              <div><h2 id="contact-form-title">Send us a message</h2><p>Fill in the details and your email app will open with your message ready.</p></div>
            </div>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form-row">
                <label className="field"><span>Your name</span><input className="auth-input" name="name" autoComplete="name" placeholder="e.g. Alex Kumar" required /></label>
                <label className="field"><span>Email address</span><input className="auth-input" type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
              </div>
              <label className="field"><span>What can we help with?</span>
                <select className="auth-input" name="topic" defaultValue="General enquiry">
                  <option>General enquiry</option>
                  <option>Technical support</option>
                  <option>Feedback or suggestion</option>
                  <option>Partnership enquiry</option>
                  <option>Billing question</option>
                </select>
              </label>
              <label className="field"><span>Your message</span><textarea className="auth-input contact-message-input" name="message" rows="5" placeholder="Tell us how we can help..." required /></label>
              <button type="submit" className="primary-button contact-submit">Open email app <ArrowRight size={17} /></button>
              <p className="contact-form-note">Your message isn't sent automatically. Review it in your email app and press Send.</p>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function loadRazorpayCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  const scriptId = "razorpay-checkout-script";
  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Razorpay checkout could not be loaded. Check your connection and try again.")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

function PricingPage({ user, onLogout }) {
  const [checkoutPlan, setCheckoutPlan] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [usage, setUsage] = useState(null);
  const [usageError, setUsageError] = useState("");
  const [refreshUsage, setRefreshUsage] = useState(0);
  const [billingMonths, setBillingMonths] = useState(1);

  useEffect(() => {
    if (user?.authProvider !== "firebase") {
      setUsage(null);
      setUsageError("");
      return undefined;
    }
    let cancelled = false;
    const loadUsage = async () => {
      setUsageError("");
      try {
        const token = await getFirebaseIdToken();
        const response = await fetch(apiUrl("/api/billing/usage"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Your plan details could not be loaded.");
        if (!cancelled) setUsage(result);
      } catch (error) {
        if (!cancelled) setUsageError(error.message || "Your plan details could not be loaded.");
      }
    };
    void loadUsage();
    return () => {
      cancelled = true;
    };
  }, [user, refreshUsage]);

  const startCheckout = async (plan, months) => {
    if (!user) {
      setCheckoutMessage("Sign in with your SkillAI account before choosing a paid plan.");
      return;
    }
    if (user.authProvider !== "firebase") {
      setCheckoutMessage("Plan purchases require a Firebase-backed SkillAI account. Sign out and sign in with Firebase to continue.");
      return;
    }
    if (!["plus", "pro"].includes(plan) || ![1, 3, 6, 12].includes(months)) {
      setCheckoutMessage("Choose a valid paid plan.");
      return;
    }

    setCheckoutPlan(`${plan}-${months}`);
    setCheckoutMessage("");
    try {
      const token = await getFirebaseIdToken();
      const orderResponse = await fetch(apiUrl("/api/billing/order"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, months }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "Checkout could not be started.");

      await loadRazorpayCheckoutScript();
      if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable. Please refresh and try again.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SkillAI",
        description: `${plan === "plus" ? "Plus" : "Pro"} plan · ${months} ${months === 1 ? "month" : "months"}`,
        order_id: order.orderId,
        handler: async (payment) => {
          setCheckoutMessage("Payment received. Verifying it securely…");
          try {
            const verificationResponse = await fetch(apiUrl("/api/billing/verify-payment"), {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payment),
            });
            const verification = await verificationResponse.json();
            if (!verificationResponse.ok) throw new Error(verification.error || "Payment verification failed.");
            const receiptStatus = verification.receiptEmailSent
              ? "Your receipt was emailed to you and the business."
              : verification.receiptEmailPending
                ? "Your receipt email is being processed; please check your inbox shortly."
                : verification.receiptEmailError || "Your receipt could not be emailed yet. Please contact support.";
            setCheckoutMessage(`${plan === "plus" ? "Plus" : "Pro"} is active for ${months} ${months === 1 ? "month" : "months"}. Thank you for your purchase. ${receiptStatus}`);
            setRefreshUsage((current) => current + 1);
          } catch (error) {
            setCheckoutMessage(`${error.message || "Payment verification failed."} If money was debited, contact support with your payment ID: ${payment.razorpay_payment_id || "unavailable"}.`);
          } finally {
            setCheckoutPlan("");
          }
        },
        modal: {
          ondismiss: () => setCheckoutPlan(""),
        },
        theme: { color: "#356be0" },
      });
      checkout.on("payment.failed", (event) => {
        setCheckoutMessage(event.error?.description || "Payment did not complete. You can try again.");
        setCheckoutPlan("");
      });
      checkout.open();
    } catch (error) {
      setCheckoutMessage(error.message || "Checkout could not be started. Please try again.");
      setCheckoutPlan("");
    }
  };

  const plans = [
    {
      name: "Free",
      price: "₹0",
      description: "Get started with the core SkillAI experience, including non-AI research tools.",
      features: [
        "Create a SkillAI account",
        "One lifetime AI interview or assessment start",
        "Browse research papers, save searches, and use your personal library",
        "Use the local Research Maker planning template at no cost",
        "Explore career resources and non-AI learning tools",
      ],
      action: "Get started free",
      featured: false,
    },
    {
      name: "Plus",
      price: PLAN_PRICES_INR.plus[billingMonths],
      description: "For learners building consistent practice habits.",
      features: [
        "Everything in Free",
        "5 AI interviews + 5 assessments per UTC calendar month",
        "20 questions per assessment",
        "10 AI paper requests per UTC calendar month",
        "All Resume AI tools: analyzer, job match, tailor, and skill gaps",
        "Personalized feedback and progress review",
      ],
      action: "Choose Plus",
      featured: true,
    },
    {
      name: "Pro",
      price: PLAN_PRICES_INR.pro[billingMonths],
      description: "For focused preparation across your career journey.",
      features: [
        "Everything in Plus",
        "12 AI interviews + 12 assessments per UTC calendar month",
        "20 questions per assessment",
        "30 AI paper requests per UTC calendar month",
        "All Resume AI tools: analyzer, job match, tailor, and skill gaps",
        "Advanced interview preparation",
        "Deeper skill and career insights",
        "Priority access to new features",
      ],
      action: "Choose Pro",
      featured: false,
    },
  ];

  return (
    <main className="page-shell pricing-page">
      <section className="pricing-hero wrap">
        <span className="eyebrow">Simple, transparent pricing</span>
        <h1>Choose the support that fits your next step.</h1>
        <p>Every paid plan brings interview practice, the Resume AI toolkit, and research support together. Pro adds higher monthly limits. Choose a term; paid plans are one-time purchases and never auto-renew.</p>
      </section>
      <section className="wrap pricing-term-picker" aria-label="Choose plan duration">
        <span>Choose your plan duration</span>
        <div role="group" aria-label="Plan duration">
          {PLAN_BILLING_TERMS.map((term) => (
            <button key={term.months} type="button" className={billingMonths === term.months ? "active" : ""} aria-pressed={billingMonths === term.months} onClick={() => setBillingMonths(term.months)}>
              {term.label}{term.savings && <small>{term.savings}</small>}
            </button>
          ))}
        </div>
      </section>
      <section className="wrap pricing-plan-grid" aria-label={`${PLAN_BILLING_TERMS.find((term) => term.months === billingMonths)?.label} SkillAI plans`}>
        {plans.map((plan) => (
          <article key={plan.name} className={`pricing-plan-card${plan.featured ? " featured" : ""}`}>
            {plan.featured && <span className="pricing-popular">Most popular</span>}
            <h2>{plan.name}</h2>
            <p className="pricing-plan-description">{plan.description}</p>
            <p className="pricing-plan-price">
              <strong>{plan.name === "Free" ? plan.price : `₹${plan.price.toLocaleString("en-IN")}`}</strong>
              {plan.name !== "Free" && <span>for {PLAN_BILLING_TERMS.find((term) => term.months === billingMonths)?.label}</span>}
              {plan.name === "Free" && <span>forever</span>}
            </p>
            {plan.name !== "Free" && <p className="pricing-monthly-equivalent">₹{Math.round(plan.price / billingMonths).toLocaleString("en-IN")} per month · one-time payment</p>}
            {plan.name === "Free" ? (
              <Link to={user ? "/dashboard" : "/register"} className="secondary-button pricing-plan-action">
                {plan.action} <ArrowRight size={16} />
              </Link>
            ) : (
              <button type="button" className={plan.featured ? "primary-button pricing-plan-action" : "secondary-button pricing-plan-action"} onClick={() => startCheckout(plan.name.toLowerCase(), billingMonths)} disabled={Boolean(checkoutPlan)}>
                {checkoutPlan === `${plan.name.toLowerCase()}-${billingMonths}` ? "Opening checkout..." : plan.action} <ArrowRight size={16} />
              </button>
            )}
            <ul className="pricing-feature-list">
              {plan.features.map((feature) => (
                <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      {checkoutMessage && <div className="wrap pricing-checkout-message" role="status">
        {checkoutMessage}
        {!user && <Link to="/login" state={{ from: "/pricing" }}>Sign in</Link>}
        {user && user.authProvider !== "firebase" && <button type="button" className="text-link" onClick={onLogout}>Sign out, then sign in with Firebase</button>}
      </div>}
      {user?.authProvider === "firebase" && (
        <section className="wrap pricing-current-plan" aria-live="polite">
          {usage ? (
            <>
              <strong>Current plan: {usage.plan[0].toUpperCase() + usage.plan.slice(1)}</strong>
              {usage.plan === "free" ? (
                <span>Free practice used: {usage.freeUsed ? "1 of 1 lifetime use" : "0 of 1 lifetime uses"} (shared between interviews and assessments)</span>
              ) : (
                <span>Interviews: {usage.usage.interviews.used}/{usage.usage.interviews.limit} · Assessments: {usage.usage.assessments.used}/{usage.usage.assessments.limit} · AI paper requests: {usage.usage.research.used}/{usage.usage.research.limit} for {usage.month}</span>
              )}
              {usage.expiresAt && <span>Valid until {new Date(usage.expiresAt).toLocaleDateString()}</span>}
            </>
          ) : <span>{usageError || "Loading your current plan..."}</span>}
        </section>
      )}
      <p className="wrap pricing-disclaimer">Paid plans are one-time purchases; they do not auto-renew. Plan benefits stay active for the selected term. Usage limits shown above reset monthly on the first day of each UTC month, including multi-month plans. Free includes one lifetime practice start shared between interviews and assessments.</p>
    </main>
  );
}

function SocialAuthButtons({ mode, onLogin, onError, disabled = false }) {
  const [activeProvider, setActiveProvider] = useState("");
  const providers = [
    { id: "google", label: "Google", icon: <GoogleMark /> },
    { id: "microsoft", label: "Microsoft", icon: <MicrosoftMark /> },
    { id: "apple", label: "Apple", icon: <AppleMark /> },
  ];

  const handleProviderClick = async (provider) => {
    setActiveProvider(provider.id);
    onError("");
    try {
      const user = await signInWithSocialProvider(provider.id);
      onLogin(user);
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
        onError(error.message || `${provider.label} sign-in could not be completed.`);
      }
    } finally {
      setActiveProvider("");
    }
  };

  return (
    <div className="social-auth">
      <div className="social-auth-divider"><span>or {mode === "register" ? "sign up" : "continue"} with</span></div>
      <div className="social-auth-buttons">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="social-auth-button"
            onClick={() => handleProviderClick(provider)}
            disabled={disabled || Boolean(activeProvider)}
          >
            <span className="social-auth-icon" aria-hidden="true">{provider.icon}</span>
            <span>{activeProvider === provider.id ? "Connecting..." : provider.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(2 2) scale(.92)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.66 5.94c4.47-4.13 7.11-10.2 7.11-17.59Z" transform="translate(2 2) scale(.92)" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" transform="translate(2 2) scale(.92)" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.66-5.94c-2.13 1.43-4.86 2.27-8.24 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(2 2) scale(.92)" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M13 1h10v10H13z" />
      <path fill="#05a6f0" d="M1 13h10v10H1z" />
      <path fill="#ffba08" d="M13 13h10v10H13z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path fill="currentColor" d="M16.37 12.15c.02 2.17 1.9 2.89 1.92 2.9-.02.05-.3 1.03-.98 2.04-.59.87-1.21 1.74-2.18 1.76-.95.02-1.26-.57-2.35-.57s-1.44.55-2.33.59c-.93.03-1.64-.94-2.23-1.81-1.2-1.74-2.12-4.91-.89-7.05.61-1.06 1.7-1.73 2.89-1.75.91-.02 1.77.63 2.33.63.56 0 1.61-.78 2.72-.67.46.02 1.77.18 2.61 1.42-.07.04-1.56.91-1.54 2.51ZM14.58 5.9c.49-.59.82-1.41.73-2.23-.71.03-1.57.47-2.08 1.06-.46.53-.86 1.37-.75 2.17.79.06 1.61-.4 2.1-1Z" />
    </svg>
  );
}

function LoginPage({ onLogin }) {
  const [formValues, setFormValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = isFirebaseConfigured()
        ? await signInWithEmailPassword(formValues.email, formValues.password)
        : await authenticateLocalAccount(formValues.email, formValues.password);
      if (!user) {
        setError('Email or password is incorrect. Check your details and try again.');
        return;
      }
      onLogin(user);
    } catch (loginError) {
      setError(loginError.message || 'Sign in could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <div className="wrap auth-layout">
        <section className="auth-card">
          <div className="auth-heading">
            <span className="eyebrow">Welcome back</span>
            <h1>Sign in to SkillAI</h1>
            <p className="auth-copy">Continue to your interviews, assessments, research, and career dashboard.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field" htmlFor="login-email">
              <span>Email address</span>
              <input id="login-email" className="auth-input" type="email" name="email" autoComplete="username" value={formValues.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>
            <label className="field" htmlFor="login-password">
              <span>Password</span>
              <span className="auth-password-control">
                <input id="login-password" className="auth-input" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" value={formValues.password} onChange={handleChange} placeholder="Enter your password" required />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'} {!isSubmitting && <ArrowRight size={16} />}</button>
          </form>

          <SocialAuthButtons mode="login" onLogin={onLogin} onError={setError} disabled={isSubmitting} />

          {!isFirebaseConfigured() && <div className="demo-box">
            <div className="demo-heading"><strong>Try a demo account</strong><span>Select to fill the sign-in fields</span></div>
            <div className="demo-grid">
              {demoCredentials.map(({ label, email, password }) => (
                <button key={label} type="button" className="demo-chip" onClick={() => setFormValues({ email, password })}>
                  <strong>{label}</strong>
                  <span>{email}</span>
                  <span>Password: {password}</span>
                </button>
              ))}
            </div>
          </div>}

          <p className="auth-cta">Need an account? <Link to="/register">Create one</Link></p>
        </section>
      </div>
    </main>
  );
}

function RegisterPage({ onLogin }) {
  const [formValues, setFormValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (formValues.password !== formValues.confirmPassword) {
      setError('Passwords do not match. Please check both password fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = isFirebaseConfigured()
        ? await registerWithEmailPassword(formValues)
        : await registerLocalAccount(formValues);
      onLogin(user);
    } catch (registerError) {
      setError(registerError.message || 'Your account could not be created.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <div className="wrap auth-layout">
        <section className="auth-card">
          <span className="eyebrow">Create account</span>
          <h1>Start your SkillAI journey</h1>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field"><span>Full name</span><input className="auth-input" type="text" name="name" autoComplete="name" value={formValues.name} onChange={handleChange} placeholder="Your full name" required /></label>
            <label className="field"><span>Email</span><input className="auth-input" type="email" name="email" autoComplete="email" value={formValues.email} onChange={handleChange} placeholder="you@example.com" required /></label>
            <label className="field"><span>Password</span><input className="auth-input" type="password" name="password" autoComplete="new-password" minLength={8} value={formValues.password} onChange={handleChange} placeholder="At least 8 characters" required /></label>
            <label className="field"><span>Confirm password</span><input className="auth-input" type="password" name="confirmPassword" autoComplete="new-password" minLength={8} value={formValues.confirmPassword} onChange={handleChange} placeholder="Enter your password again" required /></label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'} {!isSubmitting && <ArrowRight size={16} />}</button>
          </form>
          <SocialAuthButtons mode="register" onLogin={onLogin} onError={setError} disabled={isSubmitting} />
          <p className="auth-cta">Already have an account? <Link to="/login">Login</Link></p>
        </section>
      </div>
    </main>
  );
}

function DashboardPage({ user }) {
  const [activity, setActivity] = useState({ interviews: [], assessments: [] });
  const [activityError, setActivityError] = useState("");
  const [isActivityLoaded, setIsActivityLoaded] = useState(false);

  useEffect(() => {
    try {
      setActivity(getDashboardActivity(user.email));
      setActivityError("");
    } catch (error) {
      setActivityError(`Your activity could not be loaded: ${error.message}`);
    } finally {
      setIsActivityLoaded(true);
    }
  }, [user.email]);

  const interviewScores = activity.interviews.map((item) => item.score);
  const assessmentScores = activity.assessments.map((item) => item.score);
  const allScores = [...interviewScores, ...assessmentScores];
  const average = (scores) => scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : null;
  const recentActivity = [
    ...activity.interviews.map((item) => ({
      id: `interview-${item.sessionId || item.evaluatedAt}`,
      title: item.domain ? `${item.domain} interview` : "Practice interview",
      type: "Interview",
      score: item.score,
      date: item.evaluatedAt,
    })),
    ...activity.assessments.map((item) => ({
      id: item.id,
      title: item.domain || item.course || "Skill assessment",
      type: "Assessment",
      score: item.score,
      date: item.completedAt,
    })),
  ].sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0)).slice(0, 4);

  return (
    <main className="page-shell dashboard-page">
      <div className="wrap dashboard-shell">
        <section className="dashboard-main">
          <header className="dashboard-welcome">
            <div className="dashboard-welcome-copy">
              <span className="dashboard-welcome-eyebrow"><Sparkles size={15} /> YOUR SKILLAI WORKSPACE</span>
              <h1>Welcome back, {user.name.trim().split(/\s+/)[0]}.</h1>
              <p>Your next step starts here. Practice, track your progress, and keep moving toward your goals.</p>
            </div>
            <div className="dashboard-welcome-actions">
              <Link to="/interview" className="primary-button">Practice interview <ArrowRight size={16} /></Link>
              <Link to="/assessment" className="dashboard-welcome-secondary">Take assessment <ArrowRight size={16} /></Link>
            </div>
            <span className="dashboard-welcome-decoration" aria-hidden="true"><Sparkles size={100} /></span>
          </header>

          <div className="dashboard-overview-heading">
            <div><span className="eyebrow">Your progress</span><h2>A little progress adds up.</h2></div>
            <Link to="/pricing" className="dashboard-plan-link">Explore plans <ArrowRight size={15} /></Link>
          </div>

          {activityError && <div className="dashboard-data-error" role="alert">Your activity could not be loaded: {activityError}</div>}

          <div className="dashboard-metrics">
            {[
              ["Completed interviews", activity.interviews.length],
              ["Completed assessments", activity.assessments.length],
              ["Interview average", average(interviewScores) === null ? "—" : `${average(interviewScores)}%`],
              ["Assessment average", average(assessmentScores) === null ? "—" : `${average(assessmentScores)}%`],
            ].map(([label, value], index) => (
              <div key={label} className={`mini-stat dashboard-stat dashboard-stat-${index + 1}`}><span>{label}</span><strong>{isActivityLoaded ? value : "—"}</strong></div>
            ))}
          </div>

          <div className="dashboard-grid">
            <section className="panel-card dashboard-activity-panel">
              <div className="panel-header"><strong>Recent activity</strong><span>{activity.interviews.length + activity.assessments.length} completed</span></div>
              {!isActivityLoaded ? (
                <p className="dashboard-activity-empty">Loading your recent progress...</p>
              ) : recentActivity.length ? (
                <div className="dashboard-activity-list">
                  {recentActivity.map((item) => (
                    <article key={item.id} className="dashboard-activity-item">
                      <span className="dashboard-activity-type">{item.type}</span>
                      <div><strong>{item.title}</strong><small>{item.date ? new Date(item.date).toLocaleDateString() : "Date unavailable"}</small></div>
                      <strong className="dashboard-activity-score">{item.score}%</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-activity-empty">
                  <span className="dashboard-empty-icon"><Sparkles size={19} /></span>
                  <strong>Your progress starts with one practice.</strong>
                  <p>Finish an interview or assessment and your personal results will appear here.</p>
                </div>
              )}
            </section>
            <section className="panel-card dashboard-next-step">
              <div className="panel-header"><strong>Pick up where you want to grow</strong></div>
              <p>{activity.interviews.length === 0
                ? "Build confidence with a practice interview, or check what you know with a skill assessment."
                : activity.assessments.length === 0
                  ? "Take a skill assessment to identify strengths and choose what to learn next."
                  : "Keep practicing and revisit your latest feedback to build on your progress."}</p>
              <div className="dashboard-shortcuts">
                <Link to="/interview" className="dashboard-shortcut">
                  <span className="dashboard-shortcut-icon"><Sparkles size={18} /></span>
                  <span><strong>AI Interview</strong><small>Practice with a virtual interviewer</small></span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/assessment" className="dashboard-shortcut">
                  <span className="dashboard-shortcut-icon assessment"><BarChart3 size={18} /></span>
                  <span><strong>Skill Assessment</strong><small>Check your knowledge and skills</small></span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="footer-brand-block">
          <div className="brand mini-brand">
            <span className="brand-mark" aria-hidden="true"><Sparkles size={20} strokeWidth={2.1} /></span>
            <span className="brand-text"><strong>SkillAI</strong><small>Assess. Improve. Grow.</small></span>
          </div>
          <p>AI-powered interview readiness, skill intelligence, and career growth support for students, researchers, and professionals.</p>
        </div>

        <div className="footer-links">
          <div>
            <h4>Platform</h4>
            <Link to="/">Home</Link>
            <Link to="/domains">Domains</Link>
            <Link to="/interview">AI Interview</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
          <div>
            <h4>Learning</h4>
            <Link to="/assessment">Skill Assessment</Link>
            <Link to="/research">Research Hub</Link>
            <Link to="/roadmap">Career Roadmap</Link>
          </div>
          <div>
            <h4>Resources</h4>
            <Link to="/resources">Resources</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Get Started</Link>
          </div>
        </div>
      </div>

      <div className="wrap footer-bottom">
        <span>© 2026 SkillAI</span>
        <span>Privacy</span>
        <span>Terms</span>
        <Link to="/contact">Contact us</Link>
      </div>
    </footer>
  );
}

function App() {
  const location = useLocation();
  const [session, setSession] = useState(() => {
    try {
      const storedSession = window.localStorage.getItem('skillai-auth');
      const user = storedSession ? JSON.parse(storedSession) : null;
      return isFirebaseConfigured() && user?.authProvider !== "firebase" ? null : user;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      window.localStorage.setItem('skillai-auth', JSON.stringify(session));
      return;
    }
    window.localStorage.removeItem('skillai-auth');
  }, [session]);

  useEffect(() => {
    const page = getSeoPage(location.pathname);
    const canonicalUrl = `${SEO_SITE_URL}${page.path === "/" ? "/" : page.path}`;
    document.title = page.title;

    const setMetaContent = (selector, content) => {
      document.head.querySelector(selector)?.setAttribute("content", content);
    };
    setMetaContent('meta[name="description"]', page.description);
    setMetaContent('meta[name="robots"]', page.indexable ? "index, follow" : "noindex, follow");
    setMetaContent('meta[property="og:title"]', page.title);
    setMetaContent('meta[property="og:description"]', page.description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', page.title);
    setMetaContent('meta[name="twitter:description"]', page.description);

    let pageSchema = document.head.querySelector('script[data-seo-page-schema]');
    if (!pageSchema) {
      pageSchema = document.createElement("script");
      pageSchema.type = "application/ld+json";
      pageSchema.dataset.seoPageSchema = "";
      document.head.append(pageSchema);
    }
    pageSchema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      url: canonicalUrl,
      isPartOf: { "@id": `${SEO_SITE_URL}/#website` },
      inLanguage: "en-IN",
    });

    let faqSchema = document.head.querySelector('script[data-seo-faq-schema]');
    if (page.path === "/assessment") {
      if (!faqSchema) {
        faqSchema = document.createElement("script");
        faqSchema.type = "application/ld+json";
        faqSchema.dataset.seoFaqSchema = "";
        document.head.append(faqSchema);
      }
      faqSchema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: ASSESSMENT_FAQS.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      });
    } else {
      faqSchema?.remove();
    }

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!page.indexable) {
      canonical?.remove();
      return;
    }
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.append(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, [location.pathname]);

  const handleLogin = (user) => setSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider,
  });
  const handleLogout = async () => {
    if (session?.authProvider === "firebase") await signOutFirebaseUser();
    setSession(null);
  };
  const requestedPath = typeof location.state?.from === "string"
    && location.state.from.startsWith("/")
    && !location.state.from.startsWith("//")
    ? location.state.from
    : "/dashboard";
  const resumePage = (
    <Suspense fallback={<main className="page-shell ri-page"><div className="wrap">Loading Resume Intelligence…</div></main>}>
      <ResumeIntelligence key={session?.id} user={session} />
    </Suspense>
  );
  const loginRequired = (
    <Navigate
      to="/login"
      replace
      state={{ from: `${location.pathname}${location.search}${location.hash}` }}
    />
  );
  const requireSession = (element) => session ? element : loginRequired;

  return (
    <>
      <Navbar user={session} onLogout={handleLogout} />
      <main className="page-main">
        <Routes>
          <Route path="/" element={session ? <DashboardPage user={session} /> : <HomePage />} />
          <Route path="/domains" element={requireSession(<DomainsPage />)} />
          <Route path="/interview" element={requireSession(<InterviewPage />)} />
          <Route path="/interview/start" element={requireSession(<Suspense fallback={<main className="page-shell interview-experience"><div className="wrap">Loading interview setup...</div></main>}><InterviewExperiencePage /></Suspense>)} />
          <Route path="/resume" element={requireSession(resumePage)} />
          <Route path="/resume/:section" element={requireSession(resumePage)} />
          <Route path="/assessment" element={requireSession(<AssessmentPage />)} />
          <Route path="/assessment/start" element={requireSession(<Suspense fallback={<main className="page-shell skill-assessment-page"><div className="wrap">Loading your assessment...</div></main>}><SkillAssessmentPage /></Suspense>)} />
          <Route path="/research" element={requireSession(<ResearchPage />)} />
          <Route path="/research/maker" element={requireSession(<ResearchMakerPage />)} />
          <Route path="/roadmap" element={requireSession(<RoadmapPage />)} />
          <Route path="/resources" element={requireSession(<ResourcesPage />)} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pricing" element={<PricingPage user={session} onLogout={handleLogout} />} />
          <Route path="/login" element={session ? <Navigate to={requestedPath} replace /> : <LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={session ? <Navigate to={requestedPath} replace /> : <RegisterPage onLogin={handleLogin} />} />
          <Route path="/dashboard" element={requireSession(<DashboardPage user={session} />)} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
