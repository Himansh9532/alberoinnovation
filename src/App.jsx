import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircuitBoard,
  Cpu,
  FlaskConical,
  Lightbulb,
  Menu,
  Moon,
  MoveUpRight,
  X,
  Sun,
} from "lucide-react";
import classroomImage from "./images/images (1).jfif?url";
import studentImage from "./images/images (2).jfif?url";
import workshopImage from "./images/images (2).jfif?url";
import electronicsImage from "./images/images (4).jfif?url";
import roboticsImage from "./images/images (4).jfif?url";
import labImage from "./images/images (1).jfif?url";
import teamworkImage from "./images/images (2).jfif?url";
import codingImage from "./images/ai object detection.jfif?url";
import learningImage from "./images/images (8).jfif?url";
import aiObjectDetectionImage from "./images/ai object detection.jfif?url";
import bluetoothCarImage from "./images/Bluetooth control car.jfif?url";
import fireDetectionImage from "./images/fire detection system.jfif?url";
import humanoidRobotImage from "./images/Humnoid robot.jfif?url";
import weatherStationImage from "./images/iot weather station.jfif?url";
import rcPlaneImage from "./images/RC plane.jfif?url";
import smartDustbinImage from "./images/smart dustbin.jfif?url";
import spiderRobotImage from "./images/spider robot.jfif?url";
import roboticsLabImage from "./images/Robotics Lab.jfif?url";
import studentRoboticsLabImage from "./images/student robotics lab.jfif?url";
import advancedRoboticsLabImage from "./images/advanced robotic lab.jfif?url";
import stemInnovationLabImage from "./images/stem innovation lab.jfif?url";
import aiLabImage from "./images/AI lab.jfif?url";
import computerVisionLabImage from "./images/computer vision lab.jfif?url";
import atalTinkeringLabImage from "./images/atal tinkering lab.jfif?url";
import iotWorkshopImage from "./images/ai and iot workshop.jfif?url";
import automationLabImage from "./images/automation lab.jfif?url";
import electronicsLabImage from "./images/electronic lab.jfif?url";
import makerSpaceImage from "./images/maker space.jfif?url";
import scienceProjectImage from "./images/science and engineering project.jfif?url";
import studentTrainingImage from "./images/student trainning.jfif?url";
import studentTranningImage from "./images/Student Tranning.jfif?url";
import teacherTrainingImage from "./images/Teacher Trainning.jfif?url";

const company = "Raj Infotech";
const companyEmail = "sales@rajinfotechindia.com";
const contactEmail = "rajeev.bhargava@rajinfotechindia.com";
const companyPhone = "+91 9829033023";
const companyAddress =
  "106-107, Mahima Majesty, Ram Gali No. 6, Raja Park, Jaipur, Rajasthan 302004";
const companyWebsite = "https://aitechno.org/";
const contactPath = "/contact";

const photos = {
  classroom: classroomImage,
  students: studentImage,
  workshop: workshopImage,
  electronics: electronicsImage,
  robotics: roboticsImage,
  lab: labImage,
  teamwork: teamworkImage,
  coding: codingImage,
  learning: learningImage,
  engineering: electronicsImage,
  components: roboticsImage,
  meeting: classroomImage,
};

const imageUrl = (source) => source;

const projectList = [
  {
    slug: "ai-object-detection",
    title: "AI Object Detection",
    category: "AI",
    image: aiObjectDetectionImage,
    description:
      "Explore how computer vision models identify objects in images and live camera frames.",
    technology: "Python · Computer vision · Camera",
  },
  {
    slug: "bluetooth-controlled-car",
    title: "Bluetooth Controlled Car",
    category: "Robotics",
    image: bluetoothCarImage,
    description:
      "Build and control a small vehicle over a wireless connection, from chassis assembly to app control.",
    technology: "Arduino · Bluetooth · Motor driver",
  },
  {
    slug: "fire-detection-system",
    title: "Fire Detection System",
    category: "Electronics",
    image: fireDetectionImage,
    description:
      "Prototype a sensor-based alert system and learn how inputs can trigger a safety response.",
    technology: "Microcontroller · Flame sensor · Buzzer",
  },
  {
    slug: "humanoid-robot",
    title: "Humanoid Robot",
    category: "Robotics",
    image: humanoidRobotImage,
    description:
      "An introduction to coordinated movement, actuators and the challenges of human-inspired machines.",
    technology: "Robotics kit · Servos · Programming",
  },
  {
    slug: "iot-weather-station",
    title: "IoT Weather Station",
    category: "IoT",
    image: weatherStationImage,
    description:
      "Collect local environmental readings and send them to a dashboard for observation over time.",
    technology: "ESP32 · Environmental sensors · MQTT",
  },
  {
    slug: "rc-plane",
    title: "RC Plane",
    category: "Robotics",
    image: rcPlaneImage,
    description:
      "Explore flight principles, radio control and the parts that bring a model aircraft to life.",
    technology: "Radio control · Servos · Aerodynamics",
  },
  {
    slug: "smart-dustbin",
    title: "Smart Dustbin",
    category: "Electronics",
    image: smartDustbinImage,
    description:
      "Combine proximity sensing and a small actuator to create a touch-free lid mechanism.",
    technology: "Arduino · Ultrasonic sensor · Servo",
  },
  {
    slug: "spider-robot",
    title: "Spider Robot",
    category: "Robotics",
    image: spiderRobotImage,
    description:
      "Investigate multi-leg movement and mechanical coordination with a small walking robot.",
    technology: "Microcontroller · Servos · Leg mechanisms",
  },
];

const galleryItems = [
  {
    image: photos.classroom,
    title: "A collaborative classroom",
    category: "Students",
  },
  {
    image: photos.electronics,
    title: "Electronics in practice",
    category: "Equipment",
  },
  { image: photos.workshop, title: "Learning together", category: "Training" },
  {
    image: photos.robotics,
    title: "Robotics workshop",
    category: "Robotics Labs",
  },
  { image: photos.lab, title: "Building and testing", category: "Projects" },
  { image: photos.teamwork, title: "A team at work", category: "Students" },
  {
    image: photos.coding,
    title: "Programming in the lab",
    category: "STEM Labs",
  },
  { image: photos.learning, title: "Learning by doing", category: "Training" },
  {
    image: photos.engineering,
    title: "An engineering project",
    category: "Projects",
  },
  {
    image: photos.components,
    title: "Components and circuits",
    category: "Equipment",
  },
  { image: photos.meeting, title: "Ideas take shape", category: "STEM Labs" },
  {
    image: photos.students,
    title: "Shared discovery",
    category: "Robotics Labs",
  },
];

const educationPartners = [
  "vgv.png",
  "CL1.png",
  "CL2.png",
  "CL4.png",
  "CL3.png",
  "Edt1.png",
  "Edt2.png",
  "Edt3.png",
  "Edt5.png",
  "Edt4.png",
].map((filename) => `https://aitechno.org/assets/newimg/education/${filename}`);

const softwarePartners = [
  "picture1.png",
  "picture2.jpg",
  "picture3.png",
  "picture4.jpg",
  "picture5.jpg",
  "picture6.jpg",
].map((filename) => `https://aitechno.org/assets/newimg/bannner/${filename}`);

const navigation = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  {
    label: "Robotics Labs",
    to: "/robotics-labs",
    children: [
      ["School Robotics Lab", "/robotics-labs#school-lab"],
      ["Advanced Robotics Lab", "/robotics-labs#advanced-lab"],
      ["Robotics Equipment", "/robotics-labs#equipment"],
      ["Robotics Projects", "/projects"],
    ],
  },
  {
    label: "STEM Labs",
    to: "/stem-labs",
    children: [
      ["STEM Innovation Lab", "/stem-labs#innovation-lab"],
      ["Electronics Lab", "/stem-labs#electronics-lab"],
      ["Atal Tinkering Lab", "/stem-labs#atal-lab"],
      ["STEM Activities", "/stem-labs#activities"],
    ],
  },
  {
    label: "AI & IoT",
    to: "/ai-iot",
    children: [
      ["AI Lab", "/ai-iot#ai-lab"],
      ["IoT Lab", "/ai-iot#iot-lab"],
      ["Computer Vision", "/ai-iot#computer-vision"],
      ["Automation Lab", "/ai-iot#automation-lab"],
    ],
  },
  { label: "Software Solutions", to: "/software-solutions" },
  { label: "Projects", to: "/projects" },
  {
    label: "Training",
    to: "/training",
    children: [
      ["Student Training", "/training#student-training"],
      ["Teacher Training", "/training#teacher-training"],
      ["Robotics Workshops", "/training#workshops"],
      ["AI & IoT Training", "/training#workshops"],
    ],
  },
  { label: "Career", to: "/career" },
  { label: "Contact", to: "/contact" },
];

function Brand() {
  return (
    <Link to="/" className="brand" aria-label={`${company} home`}>
      <span className="brand-mark">
        <img src="https://aitechno.org/assets/newimg/logoaitechno.png" alt="" />
      </span>
      <span className="brand-name">
        Raj Infotech<span>Robotics & STEM lab solutions</span>
      </span>
    </Link>
  );
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("raj-infotech-theme") || "light",
  );
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup("");
  }, [location.pathname]);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("raj-infotech-theme", theme);
  }, [theme]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="header-inner">
        <Brand />
        <button
          className="mobile-toggle icon-button"
          type="button"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
        <nav
          className={`main-nav${mobileOpen ? " mobile-open" : ""}`}
          aria-label="Main navigation"
        >
          <div className="nav-links">
            {navigation.map((item) =>
              item.children ? (
                <div
                  className={`nav-group${openGroup === item.label ? " group-open" : ""}`}
                  key={item.label}
                >
                  <div className="nav-group-top">
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `nav-link${isActive ? " active" : ""}`
                      }
                    >
                      {item.label}
                    </NavLink>
                    <button
                      className="nav-expand icon-button"
                      type="button"
                      aria-label={`Show ${item.label} menu`}
                      aria-expanded={openGroup === item.label}
                      onClick={() =>
                        setOpenGroup(openGroup === item.label ? "" : item.label)
                      }
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="dropdown-menu">
                    {item.children.map(([label, to]) => (
                      <Link key={label} to={to}>
                        {label}
                        <ArrowUpRight size={14} />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </div>
          <button
            className="theme-toggle icon-button"
            type="button"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link className="button button-small header-cta" to={contactPath}>
            Request a Lab Proposal
            <ArrowUpRight size={15} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main wrap">
        <div className="footer-about">
          <Brand />
          <p>
            Jaipur-based technology company specialising in robotics lab setups,
            automation and innovative IT solutions.
          </p>
          <a
            className="footer-note"
            href={companyWebsite}
            target="_blank"
            rel="noreferrer"
          >
            Visit aitechno.org ↗
          </a>
          <div className="footer-contact">
            <a href={`tel:${companyPhone.replaceAll(" ", "")}`}>
              {companyPhone}
            </a>
            <a href={`mailto:${companyEmail}`}>{companyEmail}</a>
          </div>
        </div>
        <div className="footer-column">
          <h3>Company</h3>
          <Link to="/">Home</Link>
          <Link to="/about">About us</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/career">Career</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-column">
          <h3>Solutions</h3>
          <Link to="/robotics-labs">Robotics labs</Link>
          <Link to="/stem-labs">STEM labs</Link>
          <Link to="/ai-iot">AI & IoT</Link>
          <Link to="/software-solutions">Software solutions</Link>
          <Link to="/ai-iot#automation-lab">Automation</Link>
          <Link to="/stem-labs#electronics-lab">Electronics</Link>
        </div>
        <div className="footer-column">
          <h3>Learning</h3>
          <Link to="/training#student-training">Student training</Link>
          <Link to="/training#teacher-training">Teacher training</Link>
          <Link to="/training#workshops">Workshops</Link>
          <Link to="/projects">Project training</Link>
          <span className="social-note">Jaipur, Rajasthan</span>
        </div>
      </div>
      <div className="footer-bottom wrap">
        <span>© 2026 {company}. All rights reserved.</span>
        <span className="legal-note">Privacy policy · Terms & conditions</span>
        <span className="footer-india">
          Jaipur, India <span>·</span> <a href="#top">Back to top ↑</a>
        </span>
      </div>
    </footer>
  );
}

function Photo({ name, alt, className = "", width = 1000, eager = false }) {
  return (
    <img
      className={className}
      src={name.startsWith("https://") ? name : imageUrl(name, width)}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
    />
  );
}

function PageHeading({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={`page-heading page-heading-${align}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, link, to }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {link && (
        <Link className="text-link" to={to}>
          {link}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

function CTASection({
  title = "Planning a robotics or STEM lab?",
  copy = "Tell us about your institution and learning goals. We’ll help you shape a practical next step.",
  button = "Request a Lab Proposal",
}) {
  return (
    <section className="cta-section wrap">
      <div className="cta-copy">
        <span className="eyebrow eyebrow-light">LET’S MAKE SOMETHING</span>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <Link className="button button-light" to={contactPath}>
        {button}
        <ArrowUpRight size={17} />
      </Link>
      <span className="cta-orbit" aria-hidden="true">
        <CircuitBoard />
      </span>
    </section>
  );
}

function PhotoTile({ image, title, tag, to, alt }) {
  return (
    <Link to={to} className="photo-tile">
      <div className="photo-frame">
        <Photo name={image} alt={alt || title} />
        <span className="tile-arrow">
          <ArrowUpRight size={17} />
        </span>
      </div>
      <div className="tile-meta">
        <span>{tag}</span>
        <h3>{title}</h3>
      </div>
    </Link>
  );
}

function HomePage() {
  const heroSlides = [
    {
      image: roboticsLabImage,
      alt: "Robotics lab models for hands-on learning",
      title: "Robotics in action",
      copy: "Models for hands-on learning",
    },
    {
      image: photos.workshop,
      alt: "Orange and green educational robot kits",
      title: "Build and code a robot",
      copy: "Start with a robot, then make it move",
    },
    {
      image: studentRoboticsLabImage,
      alt: "Students working in a robotics lab",
      title: "Student robotics lab",
      copy: "Explore sensors, movement and code",
    },
  ];
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroSlide = heroSlides[heroSlideIndex];
  const changeHeroSlide = (direction) => {
    setHeroSlideIndex(
      (current) => (current + direction + heroSlides.length) % heroSlides.length,
    );
  };
  useEffect(() => {
    if (
      heroPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setHeroSlideIndex((current) => (current + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroPaused, heroSlides.length]);
  const benefits = [
    [
      "01",
      "Hands-on learning",
      "Students learn by building, testing and improving real working models.",
    ],
    [
      "02",
      "Industry-oriented skills",
      "Introduce tools and methods used across engineering and technology.",
    ],
    [
      "03",
      "Project-based education",
      "Connect classroom concepts to practical, explainable outcomes.",
    ],
    [
      "04",
      "Future skills",
      "Encourage computational thinking, collaboration and creative problem-solving.",
    ],
    [
      "05",
      "STEM integration",
      "Bring science, technology, engineering and mathematics into one workspace.",
    ],
    [
      "06",
      "Teacher support",
      "Give educators project guidance and practical lab training.",
    ],
  ];
  const solutions = [
    [
      "Robotics Lab",
      roboticsLabImage,
      "Robotics",
      "/robotics-labs",
    ],
    [
      "STEM Lab",
      stemInnovationLabImage,
      "STEM",
      "/stem-labs",
    ],
    ["AI Lab", aiLabImage, "Artificial intelligence", "/ai-iot#ai-lab"],
    ["IoT Lab", weatherStationImage, "Connected devices", "/ai-iot#iot-lab"],
    [
      "Automation Lab",
      automationLabImage,
      "Automation",
      "/ai-iot#automation-lab",
    ],
    [
      "Electronics Lab",
      electronicsLabImage,
      "Electronics",
      "/stem-labs#electronics-lab",
    ],
    [
      "Drone Technology",
      "https://aitechno.org/assets/newimg/product/product4.png",
      "Emerging technology",
      "/robotics-labs#drone-technology",
    ],
    [
      "Industry 4.0",
      "https://aitechno.org/assets/newimg/product/product5.png",
      "Smart industry",
      "/ai-iot#industry-40",
    ],
    [
      "Additive Manufacturing",
      "https://aitechno.org/assets/newimg/product/product6.png",
      "3D printing",
      "/stem-labs#additive-manufacturing",
    ],
    [
      "Electric Vehicle Lab",
      "https://aitechno.org/assets/newimg/product/product7.png",
      "Electric mobility",
      "/stem-labs#ev-lab",
    ],
    [
      "AR & VR Virtual Lab",
      "https://aitechno.org/assets/newimg/product/product8.png",
      "Immersive learning",
      "/stem-labs#ar-vr-lab",
    ],
    [
      "Industrial Robotics",
      "https://aitechno.org/assets/newimg/product/product9.png",
      "Industrial automation",
      "/robotics-labs#industrial-robotics",
    ],
    [
      "PLC Trainer Kit",
      "https://aitechno.org/assets/newimg/product/product10.png",
      "Control systems",
      "/robotics-labs#plc-trainer",
    ],
  ];
  return (
    <main>
      <section className="home-hero wrap">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> JAIPUR-BASED · 28+ YEARS IN TECHNOLOGY
          </span>
          <h1>
            Build the future with a complete <em>Robotics & STEM Lab</em>
          </h1>
          <p>
            End-to-end robotics, STEM, AI, IoT and automation lab solutions for
            schools, colleges and educational institutions.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/robotics-labs">
              Explore lab solutions
              <ArrowRight size={16} />
            </Link>
            <Link className="button button-outline" to={contactPath}>
              Request a lab proposal
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-trust">
            <span className="trust-rule" />
            <span>
              Designed for schools, colleges, STEM programmes and skill
              development centres
            </span>
          </div>
        </div>
        <div
          className="hero-visual"
          role="region"
          aria-label="Robotics and STEM lab photos"
          aria-roledescription="carousel"
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          onFocusCapture={() => setHeroPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setHeroPaused(false);
            }
          }}
        >
          <Photo
            key={heroSlide.image}
            name={heroSlide.image}
            alt={heroSlide.alt}
            width={1600}
            eager
          />
          <div className="hero-carousel-controls" role="group" aria-label="Carousel controls">
            <button
              className="hero-carousel-arrow"
              type="button"
              title="Previous image"
              aria-label="Previous image"
              onClick={() => changeHeroSlide(-1)}
            >
              <ArrowLeft size={15} />
            </button>
            {heroSlides.map((slide, index) => (
              <button
                className={`hero-carousel-dot ${index === heroSlideIndex ? "is-active" : ""}`}
                type="button"
                key={slide.title}
                title={slide.title}
                aria-label={`Show image ${index + 1}: ${slide.title}`}
                aria-pressed={index === heroSlideIndex}
                onClick={() => setHeroSlideIndex(index)}
              />
            ))}
            <button
              className="hero-carousel-arrow"
              type="button"
              title="Next image"
              aria-label="Next image"
              onClick={() => changeHeroSlide(1)}
            >
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="hero-image-caption">
            <span className="caption-mark">
              <Lightbulb size={19} />
            </span>
            <span>
              <strong>{heroSlide.title}</strong>
              <small>{heroSlide.copy}</small>
            </span>
            <ArrowUpRight size={17} />
          </div>
          <span className="hero-index" aria-live="polite">
            {String(heroSlideIndex + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
          </span>
        </div>
      </section>
      <section className="section wrap home-why">
        <SectionHeading
          eyebrow="WHY A LAB?"
          title="Make room for the ‘how’ and ‘what if’."
          description="A well-planned lab gives students the space, tools and support to turn a lesson into something they can test for themselves."
        />
        <div className="benefit-grid">
          {benefits.map(([number, title, copy]) => (
            <article className="benefit" key={number}>
              <span className="benefit-number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-tint">
        <div className="wrap">
          <SectionHeading
            eyebrow="ONE PARTNER, MANY PATHS"
            title="Complete lab solutions"
            description="A purposeful learning space starts with the right mix of tools, projects and teacher support."
            link="Explore all solutions"
            to="/robotics-labs"
          />
          <div className="solution-grid">
            {solutions.map(([title, image, tag, to]) => (
              <PhotoTile
                key={title}
                title={title}
                image={image}
                tag={tag}
                to={to}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="partners-section" aria-labelledby="partners-heading">
        <div className="wrap">
          <div className="partners-heading">
            <span className="eyebrow">IN GOOD COMPANY</span>
            <h2 id="partners-heading">Education partners</h2>
          </div>
          <div className="partners-grid">
            {educationPartners.map((logo, index) => (
              <div className="partner-logo" key={logo}>
                <img
                  src={logo}
                  alt={`Education partner ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="software-preview wrap">
        <div className="software-preview-copy">
          <span className="eyebrow">SOFTWARE SOLUTIONS</span>
          <h2>Trusted tools, chosen for the work ahead.</h2>
          <p>
            Licensed software, technical consultation, training and support for
            academic and commercial teams.
          </p>
          <Link className="text-link" to="/software-solutions">
            Explore software solutions
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="software-preview-points">
          <span>Licensed distribution</span>
          <span>Technical consultation</span>
          <span>Training & support</span>
          <span>Academic collaboration</span>
        </div>
      </section>
      <section className="section wrap project-preview">
        <SectionHeading
          eyebrow="BUILT BY STUDENTS"
          title="Projects that make ideas tangible."
          description="Start with a question, work through the fundamentals, and finish with something you can demonstrate."
          link="See all projects"
          to="/projects"
        />
        <div className="project-strip">
          {projectList.slice(0, 3).map((project, index) => (
            <Link
              to={`/projects/${project.slug}`}
              className="project-preview-item"
              key={project.slug}
            >
              <span className="preview-number">0{index + 1}</span>
              <span>
                <strong>{project.title}</strong>
                <small>{project.technology}</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </section>
      <section className="process-section">
        <div className="wrap">
          <SectionHeading
            eyebrow="FROM FIRST CONVERSATION TO FIRST PROJECT"
            title="A clear path to a working lab."
            description="A practical setup process, shaped around the people who will use the space."
          />
          <div className="process-steps">
            {[
              "Requirement analysis",
              "Lab planning",
              "Equipment selection",
              "Installation",
              "Curriculum & projects",
              "Teacher training",
              "Lab launch",
            ].map((step, index) => (
              <div className="process-step" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
          <div className="process-note">
            <span className="note-icon">
              <Check size={18} />
            </span>
            <p>
              Scope, equipment and timelines are planned around each
              institution’s requirements.
            </p>
            <Link to="/about" className="text-link">
              How we work
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section wrap why-us">
        <div className="why-photo">
          <Photo
            name={photos.engineering}
            alt="Close view of a person working carefully with electronics"
          />
          <span>Thoughtful setup. Practical learning.</span>
        </div>
        <div className="why-copy">
          <span className="eyebrow">A PRACTICAL PARTNER</span>
          <h2>Support beyond the equipment list.</h2>
          <p>
            A lab works best when the space, teaching plan and projects fit
            together. We bring those pieces into one considered setup.
          </p>
          <ul className="check-list">
            <li>
              <Check size={16} /> Solutions planned around your learners and
              space
            </li>
            <li>
              <Check size={16} /> Equipment selected for practical classroom use
            </li>
            <li>
              <Check size={16} /> Project-led learning across core technologies
            </li>
            <li>
              <Check size={16} /> Training support for students and teachers
            </li>
          </ul>
          <Link className="text-link" to="/about">
            Get to know our approach
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <CTASection />
    </main>
  );
}

function AboutPage() {
  const approach = [
    [
      "01",
      "Plan",
      "Understand the institution, available space, learner groups and outcomes before recommending a setup.",
    ],
    [
      "02",
      "Build",
      "Bring together appropriate equipment, workspaces, curriculum resources and projects.",
    ],
    [
      "03",
      "Train",
      "Help students and teachers get comfortable using the equipment through practical sessions.",
    ],
    [
      "04",
      "Support",
      "Provide a clear route for follow-up questions as the lab and its projects develop.",
    ],
  ];
  return (
    <main className="inner-page">
      <div className="wrap">
        <PageHeading
          eyebrow="ABOUT RAJ INFOTECH"
          title="Building smart labs, smarter minds."
          description="Raj Infotech is a Jaipur-based technology company with 28+ years of experience, specialising in robotic lab setups and innovative IT solutions."
        />
      </div>
      <section className="about-intro wrap">
        <div className="about-image">
          <Photo
            name={photos.teamwork}
            alt="Colleagues working together around a table"
          />
          <span className="image-label">
            Technology that helps people learn by doing.
          </span>
        </div>
        <div className="about-copy">
          <span className="eyebrow">WHO WE ARE</span>
          <h2>Bridging academia and industry.</h2>
          <p>
            Raj Infotech, Jaipur is a technical education and industrial
            innovation organisation focused on connecting academic learning
            with industry through training and infrastructure.
          </p>
          <p>
            We proudly manufacture educational robots under the Make in India
            initiative and offer industry-aligned degree programmes in
            collaboration with universities.
          </p>
          <p>
            Through hands-on infrastructure and advanced training, we help
            students develop practical skills with technology that prepares
            them for the work ahead.
          </p>
          <Link className="text-link" to="/contact">
            Talk through your requirements
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="mission-vision-section">
        <div className="wrap">
          <div className="mission-vision-layout">
            <div className="mission-vision-visual">
              <img
                src="https://aitechno.org/assets/images/service/service-2.png"
                alt="Robotics and technology learning environment"
                loading="lazy"
              />
              <div className="mission-years">
                <strong>28+</strong>
                <span>years of experience</span>
              </div>
            </div>
            <div className="mission-vision-copy">
              <article>
                <span className="eyebrow">OUR VISION</span>
                <h2>Practical learning for a digital future.</h2>
                <p>
                  We aim to empower people and organisations with innovative
                  training and state-of-the-art AI, IoT, robotics and emerging
                  technology labs. By connecting theory with practice, we
                  foster creativity, problem-solving and critical thinking for
                  the workforce of tomorrow.
                </p>
              </article>
              <article>
                <span className="eyebrow">OUR MISSION</span>
                <h2>Help the next generation turn ideas into impact.</h2>
                <p>
                  We nurture future technology entrepreneurs with the training,
                  resources and infrastructure to succeed. Through hands-on
                  labs, practical programmes and a collaborative ecosystem, we
                  help people develop ideas into useful solutions.
                </p>
              </article>
            </div>
          </div>
          <div className="about-metrics" aria-label="Raj Infotech programme metrics">
            {[
              ["Assessment System Integration", 95],
              ["Hands-on Training & Pilot Sessions", 98],
              ["Solution", 100],
            ].map(([label, percentage]) => (
              <article className="about-metric" key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{percentage}%</strong>
                </div>
                <div
                  className="metric-track"
                  role="progressbar"
                  aria-label={label}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={percentage}
                >
                  <span style={{ width: `${percentage}%` }} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="approach-section">
        <div className="wrap">
          <SectionHeading
            eyebrow="OUR APPROACH"
            title="Plan. Build. Train. Support."
            description="A considered process makes it easier to move from a room and an idea to a lab people can use."
          />
          <div className="approach-grid">
            {approach.map(([n, title, copy]) => (
              <article className="approach-item" key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="about-audience wrap">
        <div>
          <span className="eyebrow">WHO WE SERVE</span>
          <h2>Built around the institution, not a one-size kit.</h2>
          <p>
            School programmes and curriculum requirements differ. So do college
            labs, community learning spaces and government education
            initiatives. We support institutions in Jaipur and across Rajasthan,
            shaping each conversation around the intended learners, equipment
            needs and teaching plan.
          </p>
          <div className="tag-list">
            <span>CBSE & ICSE schools</span>
            <span>Jaipur colleges & universities</span>
            <span>Skill development centres</span>
            <span>Atal Tinkering Labs</span>
            <span>STEM innovation centres</span>
            <span>Education programmes</span>
          </div>
        </div>
        <Photo
          name={studentTranningImage}
          alt="Students learning together during a hands-on training session"
        />
      </section>
      <CTASection title="Let’s talk about the learning space you have in mind." />
    </main>
  );
}

function RoboticsPage() {
  const progression = [
    "Basic electronics",
    "Programming",
    "Sensors",
    "Robotics",
    "Automation",
    "Projects",
  ];
  const specialistLabs = [
    [
      "drone-technology",
      "Drone Technology",
      "Explore unmanned aerial systems, their components and the sensing and control ideas behind them.",
      "https://aitechno.org/assets/newimg/product/product4.png",
    ],
    [
      "industrial-robotics",
      "Industrial Robotics",
      "Introduce industrial robot systems, precision movement and the role of robotics in manufacturing workflows.",
      "https://aitechno.org/assets/newimg/product/product9.png",
    ],
    [
      "plc-trainer",
      "PLC Trainer Kit",
      "Practise PLC and HMI programming with digital and analogue I/O, and explore Modbus, Ethernet and CANopen communication.",
      "https://aitechno.org/assets/newimg/product/product10.png",
    ],
  ];
  return (
    <main className="inner-page">
      <div className="wrap">
        <PageHeading
          eyebrow="ROBOTICS LABS"
          title="Complete robotics lab setup"
          description="From first circuits to advanced builds, equip students to explore how machines sense, move and respond."
        />
      </div>
      <section className="lab-feature wrap" id="school-lab">
        <div className="lab-feature-copy">
          <span className="eyebrow">FOR BEGINNER & INTERMEDIATE LEARNERS</span>
          <h2>School Robotics Lab</h2>
          <p>
            A practical starting point for students learning electronics,
            programming and the basics of moving machines. Kits and project
            choices can be matched to learners’ ages and experience.
          </p>
          <h3>Equipment categories</h3>
          <div className="tag-list">
            <span>Arduino</span>
            <span>Motors</span>
            <span>Sensors</span>
            <span>Servo motors</span>
            <span>Motor drivers</span>
            <span>Robot chassis</span>
            <span>Basic electronics</span>
          </div>
          <Link className="text-link" to={contactPath}>
            Plan a school robotics lab
            <ArrowRight size={16} />
          </Link>
        </div>
        <Photo
          name={studentRoboticsLabImage}
          alt="Student robotics lab for beginner and intermediate learners"
        />
      </section>
      <section
        className="lab-feature lab-feature-reverse wrap"
        id="advanced-lab"
      >
        <div className="lab-feature-copy">
          <span className="eyebrow">FOR ADVANCED LEARNERS & COLLEGES</span>
          <h2>Advanced Robotics Lab</h2>
          <p>
            Extend the fundamentals into connected devices, more capable
            controllers and automation components for deeper project work.
          </p>
          <h3>Equipment categories</h3>
          <div className="tag-list">
            <span>Arduino</span>
            <span>ESP32</span>
            <span>Robotics kits</span>
            <span>Sensors</span>
            <span>Wireless communication</span>
            <span>Motor drivers</span>
            <span>Automation components</span>
          </div>
          <Link className="text-link" to={contactPath}>
            Discuss an advanced setup
            <ArrowRight size={16} />
          </Link>
        </div>
        <Photo
          name={advancedRoboticsLabImage}
          alt="Advanced robotics lab equipment for experienced learners"
        />
      </section>
      <section className="equipment-band" id="equipment">
        <div className="wrap">
          <SectionHeading
            eyebrow="THE BUILDING BLOCKS"
            title="Robotics equipment"
            description="A useful lab balances core components with the tools needed to assemble, programme and test."
          />
          <div className="equipment-grid">
            {[
              [
                "Controllers & kits",
                "Microcontrollers, beginner kits and development boards",
                Cpu,
              ],
              [
                "Motion & mechanics",
                "Motors, servo motors, chassis and mechanical parts",
                CircuitBoard,
              ],
              [
                "Sensing & control",
                "Sensor modules, motor drivers and wireless components",
                FlaskConical,
              ],
            ].map(([title, copy, Icon]) => (
              <article className="equipment-item" key={title}>
                <Icon size={23} strokeWidth={1.6} />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-tint">
        <div className="wrap">
          <SectionHeading
            eyebrow="APPLIED ENGINEERING"
            title="Robotics beyond the classroom basics"
            description="Extend robotics learning into aerial systems, industrial applications and programmable control."
          />
          <div className="solution-grid stem-grid">
            {specialistLabs.map(([id, title, copy, image]) => (
              <article className="stem-card" id={id} key={id}>
                <Photo name={image} alt={title} />
                <div>
                  <span className="eyebrow">ROBOTICS & AUTOMATION</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap learning-path">
        <SectionHeading
          eyebrow="A STEP-BY-STEP LEARNING PATH"
          title="From components to confident builds."
          description="Progress concepts in a sequence that helps students understand what each part contributes."
        />
        <div className="path-line">
          {progression.map((step, index) => (
            <div className="path-step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
        <Photo
          name={roboticsLabImage}
          alt="Robotics lab models for hands-on learning"
        />
      </section>
      <CTASection
        title="Ready to plan your robotics lab?"
        button="Request a Robotics Lab Proposal"
      />
    </main>
  );
}

function StemPage() {
  const areas = [
  [
      "innovation-lab",
      "STEM Innovation Lab",
      "A flexible space for exploring ideas through science, technology, engineering and mathematics.",
      stemInnovationLabImage,
    ],
    [
      "electronics-lab",
      "Electronics Lab",
      "Work with circuits, components, measurement and introductory embedded systems.",
      electronicsLabImage,
    ],
    [
      "atal-lab",
      "Atal Tinkering Lab",
      "Support a hands-on maker environment with tools, project materials and learning activities.",
      atalTinkeringLabImage,
    ],
    [
      "activities",
      "Science & Engineering Projects",
      "Give learners practical ways to investigate a question, prototype a solution and share what they learned.",
      scienceProjectImage,
    ],
    [
      "maker-space",
      "Maker Space",
      "Create room for prototyping, collaboration and iterative problem-solving across disciplines.",
      makerSpaceImage,
    ],
    [
      "additive-manufacturing",
      "Additive Manufacturing",
      "Introduce digital design, rapid prototyping and the layer-by-layer process of 3D printing.",
      "https://aitechno.org/assets/newimg/product/product6.png",
    ],
    [
      "ev-lab",
      "Electric Vehicle Lab",
      "Explore electric mobility through learning pathways in battery systems, motors and charging technology.",
      "https://aitechno.org/assets/newimg/product/product7.png",
    ],
    [
      "ar-vr-lab",
      "AR & VR Virtual Lab",
      "Create immersive learning experiences and explore the hardware and software behind augmented and virtual reality.",
      "https://aitechno.org/assets/newimg/product/product8.png",
    ],
  ];
  return (
    <main className="inner-page">
      <div className="wrap">
        <PageHeading
          eyebrow="STEM LABS"
          title="STEM innovation lab setup"
          description="A flexible space for learners to explore science, technology, engineering and mathematics through practical work."
        />
      </div>
      <section className="stem-lead wrap">
        <div className="stem-lead-copy">
          <span className="eyebrow">LEARNING ACROSS DISCIPLINES</span>
          <h2>One idea can bring four subjects together.</h2>
          <p>
            A STEM lab creates a place to ask questions, experiment with
            materials, make prototypes and learn from the results. Equipment and
            activities can be selected for the institution’s students, space and
            programme.
          </p>
          <div className="stem-pillars">
            {[
              ["S", "Science"],
              ["T", "Technology"],
              ["E", "Engineering"],
              ["M", "Mathematics"],
            ].map(([letter, label]) => (
              <div key={letter}>
                <span>{letter}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </div>
        <Photo
          name={photos.learning}
          alt="Students collaborating in an active learning environment"
        />
      </section>
      <section className="section section-tint">
        <div className="wrap">
          <SectionHeading
            eyebrow="SPACES FOR MAKING & DISCOVERY"
            title="A lab shaped around the work."
            description="Build a dedicated space or combine complementary areas to suit your curriculum and learners."
          />
          <div className="solution-grid stem-grid">
            {areas.map(([id, title, copy, image]) => (
              <article className="stem-card" id={id} key={id}>
                <Photo name={image} alt={title} />
                <div>
                  <span className="eyebrow">PRACTICAL LEARNING</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap stem-outcomes">
        <div className="stem-outcome-copy">
          <span className="eyebrow">WHAT STUDENTS PRACTISE</span>
          <h2>Curiosity, backed by a process.</h2>
          <p>
            Learning to frame a question, work with evidence, test a design and
            improve it is at the heart of a useful maker environment.
          </p>
          <Link to={contactPath} className="text-link">
            Plan your STEM lab
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="outcomes-grid">
          {[
            "Innovation",
            "Problem solving",
            "Design thinking",
            "Collaboration",
            "Scientific inquiry",
            "Prototyping",
          ].map((item, index) => (
            <div key={item}>
              <span>0{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>
      <CTASection
        title="Plan a STEM lab that fits your learners."
        button="Plan Your STEM Lab"
      />
    </main>
  );
}

function AiIotPage() {
  const labs = [
    {
      id: "ai-lab",
      name: "AI Lab",
      eyebrow: "ARTIFICIAL INTELLIGENCE",
      copy: "Introduce students to data, models and responsible experimentation through accessible, project-led AI learning.",
      topics: ["Python", "Machine learning", "Computer vision", "AI projects"],
      image: aiLabImage,
    },
    {
      id: "iot-lab",
      name: "IoT Lab",
      eyebrow: "CONNECTED DEVICES",
      copy: "Explore how sensors, microcontrollers and networks connect physical measurements to useful applications.",
      topics: [
        "ESP32",
        "ESP8266",
        "Sensors",
        "Cloud connectivity",
        "MQTT",
        "Smart devices",
      ],
      image: weatherStationImage,
    },
    {
      id: "automation-lab",
      name: "Automation Lab",
      eyebrow: "CONTROL & RESPONSE",
      copy: "Build a foundation in inputs, controllers and outputs through small, observable automation systems.",
      topics: [
        "Motors",
        "Relays",
        "Sensors",
        "Controllers",
        "Automation projects",
      ],
      image: automationLabImage,
    },
    {
      id: "computer-vision",
      name: "Computer Vision",
      eyebrow: "MACHINES THAT INTERPRET IMAGES",
      copy: "Use camera systems and image processing to examine how AI applications can classify and detect visual information.",
      topics: [
        "Camera systems",
        "Object detection",
        "Image processing",
        "AI applications",
      ],
      image: computerVisionLabImage,
    },
    {
      id: "industry-40",
      name: "Industry 4.0",
      eyebrow: "CONNECTED INDUSTRY",
      copy: "Connect robotics, IoT, automation and data concepts to understand the systems behind smart manufacturing.",
      topics: [
        "Industrial IoT",
        "Robotics",
        "Automation",
        "Connected systems",
      ],
      image: "https://aitechno.org/assets/newimg/product/product5.png",
    },
  ];
  return (
    <main className="inner-page">
      <div className="wrap">
        <PageHeading
          eyebrow="AI & IoT"
          title="AI, IoT & smart technology labs"
          description="Help learners connect code, sensors and real-world data through thoughtful technology lab setups."
        />
      </div>
      <section className="ai-overview wrap">
        <div>
          <span className="eyebrow">CONNECTED, PRACTICAL LEARNING</span>
          <h2>Technology makes more sense when students can try it.</h2>
          <p>
            AI and IoT learning brings together programming, electronics, data
            and design. A well-scoped lab helps learners build a strong
            foundation before moving on to more ambitious applications.
          </p>
          <Link className="text-link" to={contactPath}>
            Discuss your requirements
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="ai-stats">
          <div>
            <Cpu size={21} />
            <strong>Code</strong>
            <span>Write and adapt</span>
          </div>
          <div>
            <CircuitBoard size={21} />
            <strong>Connect</strong>
            <span>Read and respond</span>
          </div>
          <div>
            <Lightbulb size={21} />
            <strong>Explore</strong>
            <span>Test an idea</span>
          </div>
        </div>
      </section>
      <section className="section section-tint">
        <div className="wrap">
          <SectionHeading
            eyebrow="LEARNING ENVIRONMENTS"
            title="Four ways into smart technology."
            description="Choose a focused lab or combine pathways into a connected programme."
          />
          <div className="ai-lab-list">
            {labs.map((lab, index) => (
              <article
                className={`ai-lab-row${index % 2 ? " row-reverse" : ""}`}
                id={lab.id}
                key={lab.id}
              >
                <Photo
                  name={lab.image}
                  alt={`${lab.name} learning environment`}
                />
                <div>
                  <span className="eyebrow">{lab.eyebrow}</span>
                  <h3>{lab.name}</h3>
                  <p>{lab.copy}</p>
                  <div className="tag-list">
                    {lab.topics.map((topic) => (
                      <span key={topic}>{topic}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CTASection
        title="Let’s shape an AI & IoT learning space."
        button="Discuss Your AI & IoT Lab"
      />
    </main>
  );
}

function SoftwareSolutionsPage() {
  const services = [
    [
      "Licensed Software Distribution",
      "Original, verified and up-to-date software solutions for academic and commercial use.",
    ],
    [
      "Technical Consultation",
      "Guidance to select, implement and optimise tools around your technical and learning needs.",
    ],
    [
      "Training & Support",
      "Technical training, onboarding and ongoing support to help teams adopt their software.",
    ],
    [
      "Academic Collaboration",
      "Software and practical learning support for engineering colleges, universities and training centres.",
    ],
  ];
  const audiences = [
    "Engineering colleges",
    "Research institutions",
    "Design studios",
    "Manufacturing units",
    "Government & private enterprises",
  ];

  return (
    <main className="inner-page software-page">
      <div className="wrap">
        <PageHeading
          eyebrow="SOFTWARE SOLUTIONS"
          title="Technology that works for the people using it."
          description="Raj Infotech is a value-added authorised channel partner for trusted software providers, connecting academic and commercial clients with software, consulting and support."
        />
      </div>
      <section className="software-intro wrap">
        <div>
          <span className="eyebrow">FROM SELECTION TO ADOPTION</span>
          <h2>Right-fit software, with people behind it.</h2>
          <p>
            We help institutions and businesses choose tools for design,
            engineering, simulation and technical education, then support
            implementation and adoption with consultation, training and
            onboarding.
          </p>
          <Link className="text-link" to={contactPath}>
            Discuss your software needs
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="software-promise">
          <span className="eyebrow">OUR COMMITMENT</span>
          <p>Original, verified software</p>
          <p>Practical technical guidance</p>
          <p>Training and ongoing support</p>
        </div>
      </section>
      <section className="section section-tint software-partners-section">
        <div className="wrap">
          <SectionHeading
            eyebrow="OUR ESTEEMED TECHNOLOGY PARTNERS"
            title="Software from global technology leaders"
            description="Raj Infotech represents and distributes solutions from the technology partners shown below."
          />
          <div className="software-partners-grid">
            {softwarePartners.map((logo, index) => (
              <div className="software-partner-logo" key={logo}>
                <img
                  src={logo}
                  alt={`Technology partner ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap software-services-section">
        <SectionHeading
          eyebrow="END-TO-END SOFTWARE SUPPORT"
          title="A partner beyond the purchase."
          description="From selecting the right tools to helping people use them with confidence."
        />
        <div className="software-service-grid">
          {services.map(([title, copy], index) => (
            <article className="software-service" key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="software-audience-section">
        <div className="wrap software-audience-inner">
          <div>
            <span className="eyebrow eyebrow-light">WHO WE SUPPORT</span>
            <h2>Tools for education, research and industry.</h2>
          </div>
          <div className="software-audience-list">
            {audiences.map((audience, index) => (
              <div key={audience}>
                <span>0{index + 1}</span>
                <strong>{audience}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CTASection
        title="Looking for the right software for your team?"
        copy="Talk with Raj Infotech about licensing, technical consultation or training."
        button="Talk to Our Team"
      />
    </main>
  );
}

function ProjectCard({ project }) {
  return (
    <article className="project-card">
      <Link to={`/projects/${project.slug}`} className="project-card-image">
        <Photo name={project.image} alt={`${project.title} project`} />
        <span className="project-category">{project.category}</span>
        <span className="tile-arrow">
          <ArrowUpRight size={17} />
        </span>
      </Link>
      <div className="project-card-copy">
        <h2>
          <Link to={`/projects/${project.slug}`}>{project.title}</Link>
        </h2>
        <p>{project.description}</p>
        <div className="project-tech">
          <span>TECHNOLOGY</span>
          <small>{project.technology}</small>
        </div>
        <Link className="text-link" to={`/projects/${project.slug}`}>
          View project
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

function ProjectsPage() {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Robotics", "IoT", "Electronics", "AI"];
  const filtered =
    filter === "All"
      ? projectList
      : projectList.filter((project) => project.category === filter);
  return (
    <main className="inner-page">
      <div className="wrap">
        <PageHeading
          eyebrow="PROJECT LIBRARY"
          title="Projects students can build"
          description="A selection of practical builds for exploring robotics, electronics, connected devices and AI. Project scope can be adapted to learner level and available equipment."
        />
        <div
          className="filter-bar"
          role="group"
          aria-label="Filter projects by technology"
        >
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={filter === category ? "filter-active" : ""}
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="project-grid">
          {filtered.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
      <CTASection
        title="Looking for the right project pathway?"
        copy="We can help connect project choices to your lab equipment and learning goals."
        button="Talk About Project Training"
      />
    </main>
  );
}

function ProjectDetailPage() {
  const { slug } = useParams();
  const project = projectList.find((entry) => entry.slug === slug);
  if (!project) return <NotFoundPage />;
  return (
    <main className="inner-page project-detail-page">
      <div className="wrap">
        <Link to="/projects" className="back-link">
          <ArrowLeft size={16} /> All projects
        </Link>
        <PageHeading
          eyebrow={`${project.category.toUpperCase()} PROJECT`}
          title={project.title}
          description={project.description}
        />
        <div className="project-detail">
          <Photo
            name={project.image}
            alt={`${project.title} project`}
            width={1300}
          />
          <aside>
            <span className="eyebrow">TECHNOLOGY USED</span>
            <h2>What learners explore</h2>
            <p>{project.technology}</p>
            <div className="detail-divider" />
            <span className="eyebrow">A PRACTICAL PATHWAY</span>
            <p>
              Students can explore the components, plan a build, programme a
              response and test how their design performs. The level of detail
              can be adapted to the learners and lab setup.
            </p>
            <Link className="button" to={contactPath}>
              Ask about this project
              <ArrowUpRight size={16} />
            </Link>
          </aside>
        </div>
      </div>
      <CTASection title="Bring this kind of project into your lab." />
    </main>
  );
}

function TrainingPage() {
  const training = [
    {
      id: "student-training",
      title: "Student training",
      image: studentTrainingImage,
      intro:
        "Practical sessions that help students move from a concept to a working build.",
      topics: [
        "Robotics",
        "Arduino",
        "ESP32",
        "IoT",
        "Python",
        "AI",
        "Electronics",
        "Automation",
      ],
    },
    {
      id: "teacher-training",
      title: "Teacher training",
      image: teacherTrainingImage,
      intro:
        "Support for educators bringing lab equipment and project-based learning into lessons.",
      topics: [
        "Lab operation",
        "Robotics fundamentals",
        "Project implementation",
        "Curriculum support",
        "Practical teaching",
      ],
    },
    {
      id: "workshops",
      title: "Workshops",
      image: iotWorkshopImage,
      intro:
        "Focused, hands-on formats for introducing a topic or building on existing skills.",
      topics: [
        "Robotics workshop",
        "STEM workshop",
        "AI workshop",
        "IoT workshop",
        "Innovation workshop",
      ],
    },
  ];
  return (
    <main className="inner-page">
      <div className="wrap">
        <PageHeading
          eyebrow="TRAINING & WORKSHOPS"
          title="Practical robotics & technology training"
          description="Help students and teachers feel at home in the lab with hands-on learning built around equipment, projects and the classroom."
        />
      </div>
      <section className="training-intro wrap">
        <Photo
          name={studentTranningImage}
          alt="A facilitator and learners collaborating in a workshop"
        />
        <div>
          <span className="eyebrow">LEARN BY MAKING</span>
          <h2>Useful skills grow through practice.</h2>
          <p>
            Training is most valuable when it connects directly to the lab and
            the work learners are expected to do. Sessions can be shaped for
            student groups, teachers and focused workshops.
          </p>
          <Link to={contactPath} className="text-link">
            Enquire about training
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="section section-tint">
        <div className="wrap">
          <SectionHeading
            eyebrow="LEARNING FORMATS"
            title="Training for the people using the lab."
            description="Choose a focused session or build a learning pathway across the academic year."
          />
          <div className="training-grid">
            {training.map((item, index) => (
              <article className="training-card" id={item.id} key={item.title}>
                <div className="training-image">
                  <Photo name={item.image} alt={item.title} />
                  <span>0{index + 1}</span>
                </div>
                <div className="training-content">
                  <h3>{item.title}</h3>
                  <p>{item.intro}</p>
                  <div className="tag-list">
                    {item.topics.map((topic) => (
                      <span key={topic}>{topic}</span>
                    ))}
                  </div>
                  <Link className="text-link" to={contactPath}>
                    Enquire about this programme
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CTASection
        title="Let’s find the right training format."
        button="Enquire About Training"
      />
    </main>
  );
}

function CareerPage() {
  return (
    <main className="inner-page">
      <div className="wrap">
        <PageHeading
          eyebrow="CAREERS"
          title="Help learners build what comes next."
          description="Bring practical technology and hands-on learning to schools, colleges and communities with Raj Infotech."
        />
        <section className="about-audience">
          <div>
            <span className="eyebrow">WORK WITH US</span>
            <h2>Make technology tangible for learners.</h2>
            <p>
              We welcome introductions from people interested in robotics,
              STEM education, electronics, AI, IoT and hands-on training.
              Tell us about your experience and the kind of work you want to do.
            </p>
            <div className="tag-list">
              <span>Robotics & STEM</span>
              <span>AI & IoT</span>
              <span>Electronics</span>
              <span>Education & training</span>
            </div>
            <a
              className="button"
              href={`mailto:${contactEmail}?subject=${encodeURIComponent("Career enquiry")}`}
            >
              Send your profile
              <ArrowUpRight size={16} />
            </a>
          </div>
          <Photo
            name={roboticsLabImage}
            alt="Robotics lab for hands-on technology learning"
          />
        </section>
      </div>
    </main>
  );
}

function GalleryPage() {
  const categories = [
    "All",
    "Robotics Labs",
    "STEM Labs",
    "Students",
    "Training",
    "Projects",
    "Equipment",
  ];
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const filtered =
    filter === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);

  useEffect(() => {
    if (!selected) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("lightbox-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("lightbox-open");
    };
  }, [selected]);

  return (
    <main className="inner-page">
      <div className="wrap">
        <PageHeading
          eyebrow="IN THE LAB"
          title="Our robotics & STEM lab gallery"
          description="A visual look at collaborative learning, technology and project work. These are editorial stock photographs, not images of a specific company installation."
        />
        <div
          className="filter-bar gallery-filters"
          role="group"
          aria-label="Filter gallery images"
        >
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={filter === category ? "filter-active" : ""}
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="gallery-grid">
          {filtered.map((item) => (
            <button
              className="gallery-item"
              type="button"
              key={item.title}
              onClick={() => setSelected(item)}
              aria-label={`View image: ${item.title}`}
            >
              <Photo name={item.image} alt={item.title} />
              <span className="gallery-caption">
                <span>{item.category}</span>
                <strong>{item.title}</strong>
                <MoveUpRight size={18} />
              </span>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <button
            type="button"
            className="lightbox-close icon-button"
            aria-label="Close image viewer"
            onClick={() => setSelected(null)}
          >
            <X size={24} />
          </button>
          <Photo name={selected.image} alt={selected.title} width={1600} />
          <div className="lightbox-caption">
            <span>{selected.category}</span>
            <strong>{selected.title}</strong>
          </div>
        </div>
      )}
      <CTASection title="See your ideas take shape." button="Plan a Lab" />
    </main>
  );
}

function ContactPage() {
  const [formStatus, setFormStatus] = useState("");
  const onSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fields = [
      ["Name", "name"],
      ["Institution", "institution"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["City", "city"],
      ["Institution type", "institutionType"],
      ["Student strength", "studentStrength"],
      ["Lab requirement", "labRequirement"],
      ["Budget range", "budget"],
      ["Message", "message"],
    ];
    const body = fields
      .map(([label, name]) => `${label}: ${formData.get(name) || "Not provided"}`)
      .join("\n");
    const subject = `Lab proposal enquiry from ${formData.get("institution")}`;
    setFormStatus(
      "Opening your email app with the enquiry addressed to Raj Infotech. If it does not open, email sales@rajinfotechindia.com directly.",
    );
    window.location.href = `mailto:${companyEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <main className="inner-page contact-page">
      <div className="wrap">
        <PageHeading
          eyebrow="START A CONVERSATION"
          title="Let’s build your robotics lab"
          description="Share a little about your institution, learners and plans. We’ll use that context to shape the conversation."
        />
        <div className="contact-layout">
          <form className="contact-form" onSubmit={onSubmit}>
            <div className="form-heading">
              <span className="eyebrow">LAB PROPOSAL ENQUIRY</span>
              <h2>Tell us what you’re planning.</h2>
              <p>Fields marked with an asterisk are required.</p>
            </div>
            <div className="form-grid">
              <label>
                Name *
                <input
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="Your name"
                />
              </label>
              <label>
                Institution name *
                <input
                  name="institution"
                  required
                  placeholder="School, college or organisation"
                />
              </label>
              <label>
                Email *
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@institution.org"
                />
              </label>
              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Include your country code"
                />
              </label>
              <label>
                City
                <input
                  name="city"
                  autoComplete="address-level2"
                  placeholder="City"
                />
              </label>
              <label>
                Institution type
                <select name="institutionType" defaultValue="">
                  <option value="" disabled>
                    Select an institution
                  </option>
                  <option>School (CBSE / ICSE / other)</option>
                  <option>College or university</option>
                  <option>Skill development centre</option>
                  <option>Atal Tinkering Lab</option>
                  <option>STEM innovation centre</option>
                  <option>Government education programme</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Student strength
                <input
                  name="studentStrength"
                  inputMode="numeric"
                  placeholder="Approximate number of learners"
                />
              </label>
              <label>
                Lab requirement
                <select name="labRequirement" defaultValue="">
                  <option value="" disabled>
                    Select a requirement
                  </option>
                  <option>Robotics lab</option>
                  <option>STEM lab</option>
                  <option>AI lab</option>
                  <option>IoT lab</option>
                  <option>Automation lab</option>
                  <option>Electronics lab</option>
                  <option>Multiple labs</option>
                  <option>Training or workshops</option>
                </select>
              </label>
              <label>
                Budget range
                <select name="budget" defaultValue="">
                  <option value="" disabled>
                    Select a range (optional)
                  </option>
                  <option>Not yet decided</option>
                  <option>Under ₹2 lakh</option>
                  <option>₹2–5 lakh</option>
                  <option>₹5–10 lakh</option>
                  <option>₹10 lakh and above</option>
                </select>
              </label>
              <label className="form-wide">
                Message
                <textarea
                  name="message"
                  rows="5"
                  placeholder="What would you like your students to be able to do?"
                />
              </label>
            </div>
            <button className="button" type="submit">
              Request a Lab Proposal
              <ArrowUpRight size={16} />
            </button>
            {formStatus && (
              <p className="form-status" role="status">
                {formStatus}
              </p>
            )}
            <p className="form-disclaimer">
              Submitting opens your email app with the enquiry addressed to Raj
              Infotech. Nothing is stored by this website.
            </p>
          </form>
          <aside className="contact-aside">
            <div className="contact-aside-head">
              <span className="eyebrow eyebrow-light">
                RAJ INFOTECH · JAIPUR
              </span>
              <h2>Tell us what your learners need.</h2>
              <p>
                From one project kit to a complete learning environment, begin
                with the outcomes you have in mind.
              </p>
            </div>
            <div className="contact-detail">
              <span>EMAIL</span>
              <p><a href={`mailto:${companyEmail}`}>{companyEmail}</a></p>
              <p><a href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
            </div>
            <div className="contact-detail">
              <span>PHONE</span>
              <p><a href={`tel:${companyPhone.replaceAll(" ", "")}`}>{companyPhone}</a></p>
            </div>
            <div className="contact-detail">
              <span>LOCATION</span>
              <p><a href={`https://maps.google.com/?q=${encodeURIComponent(companyAddress)}`} target="_blank" rel="noreferrer">{companyAddress}</a></p>
            </div>
            <div className="contact-detail">
              <span>WORKING HOURS</span>
              <p>Please call or email to confirm availability.</p>
            </div>
            <div className="contact-aside-foot">
              <span className="aside-icon">
                <ArrowDownRight size={20} />
              </span>
              <p>
                Serving education and technology needs from Jaipur, Rajasthan.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="not-found wrap">
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1>That page isn’t here.</h1>
      <p>The link may have moved. Let’s get you back to the lab.</p>
      <Link className="button" to="/">
        Back to home
        <ArrowRight size={16} />
      </Link>
    </main>
  );
}

const pageMetadata = {
  "/": [
    "Robotics Lab Setup for Schools & Colleges",
    "Robotics, STEM, AI and IoT lab planning, equipment, projects and training from Raj Infotech, Jaipur.",
  ],
  "/about": [
    "About Our Robotics & STEM Lab Solutions",
    "Meet Raj Infotech, a Jaipur-based technology company with 28+ years of experience.",
  ],
  "/robotics-labs": [
    "Robotics Lab Setup for Schools & Colleges",
    "Explore school and advanced robotics lab setup, equipment categories and learning pathways.",
  ],
  "/stem-labs": [
    "STEM Lab Setup & Innovation Labs",
    "Plan a STEM innovation, electronics, maker or Atal Tinkering lab for practical learning.",
  ],
  "/ai-iot": [
    "AI & IoT Lab Setup for Educational Institutions",
    "Explore AI, IoT, computer vision and automation lab pathways for learners.",
  ],
  "/software-solutions": [
    "Software Solutions & Licensed Distribution",
    "Licensed software, consulting, training and support from Raj Infotech for academic and commercial clients.",
  ],
  "/projects": [
    "Robotics & STEM Projects for Students",
    "Browse hands-on robotics, electronics, IoT and AI project ideas for students.",
  ],
  "/training": [
    "Robotics & STEM Training Programs",
    "Practical robotics, AI, IoT and STEM training for students and teachers.",
  ],
  "/career": [
    "Careers at Raj Infotech",
    "Explore opportunities to support robotics, STEM and hands-on technology learning.",
  ],
  "/contact": [
    "Contact Us for Robotics Lab Setup",
    "Contact Raj Infotech in Jaipur about robotics, STEM, AI or IoT lab setup.",
  ],
};

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const isProject = pathname.startsWith("/projects/");
    const project = isProject
      ? projectList.find((entry) => entry.slug === pathname.split("/")[2])
      : null;
    const [title, description] = project
      ? [
          `${project.title} | Student Robotics & STEM Projects`,
          project.description,
        ]
      : pageMetadata[pathname] || [
          "Page not found",
          "Explore robotics and STEM lab solutions for educational institutions.",
        ];
    document.title = `${title} | ${company}`;
    const setMeta = (selector, create, content) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        Object.assign(element, create);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    const pageUrl = new URL(location.pathname, window.location.origin).href;
    const socialImage = new URL(photos.workshop, window.location.origin).href;
    setMeta('meta[name="description"]', { name: "description" }, description);
    setMeta('meta[property="og:title"]', { property: "og:title" }, document.title);
    setMeta(
      'meta[property="og:description"]',
      { property: "og:description" },
      description,
    );
    setMeta('meta[property="og:url"]', { property: "og:url" }, pageUrl);
    setMeta('meta[property="og:image"]', { property: "og:image" }, socialImage);
    setMeta(
      'meta[name="twitter:title"]',
      { name: "twitter:title" },
      document.title,
    );
    setMeta(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      description,
    );
    setMeta(
      'meta[name="twitter:image"]',
      { name: "twitter:image" },
      socialImage,
    );
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    let organizationSchema = document.getElementById("organization-schema");
    if (!organizationSchema) {
      organizationSchema = document.createElement("script");
      organizationSchema.id = "organization-schema";
      organizationSchema.type = "application/ld+json";
      document.head.appendChild(organizationSchema);
    }
    organizationSchema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: company,
      url: `${window.location.origin}/`,
      logo: "https://aitechno.org/assets/newimg/logoaitechno.png",
      description:
        "Jaipur-based technology company providing robotics lab setups, technical education, software solutions and training.",
      telephone: companyPhone,
      email: companyEmail,
      address: {
        "@type": "PostalAddress",
        streetAddress: "106-107, Mahima Majesty, Ram Gali No. 6, Raja Park",
        addressLocality: "Jaipur",
        addressRegion: "Rajasthan",
        postalCode: "302004",
        addressCountry: "IN",
      },
    });
    if (location.hash) {
      window.setTimeout(
        () =>
          document
            .getElementById(decodeURIComponent(location.hash.slice(1)))
            ?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname, location.hash]);

  return (
    <div id="top" className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/robotics-labs" element={<RoboticsPage />} />
        <Route path="/stem-labs" element={<StemPage />} />
        <Route path="/ai-iot" element={<AiIotPage />} />
        <Route
          path="/software-solutions"
          element={<SoftwareSolutionsPage />}
        />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/career" element={<CareerPage />} />
        <Route path="/gallery" element={<Navigate to="/career" replace />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
