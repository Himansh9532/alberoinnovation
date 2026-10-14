import { useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function UpgradeModal({ feature, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="upgrade-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title" aria-describedby="upgrade-modal-description">
        <button type="button" className="upgrade-modal-close" onClick={onClose} aria-label="Close upgrade plans">
          <X size={20} />
        </button>
        <span className="eyebrow">Practice limit reached</span>
        <h2 id="upgrade-modal-title">Keep practicing with SkillAI</h2>
        <p id="upgrade-modal-description">
          You have used the available practice on your current plan. Choose a plan to continue with {feature}.
        </p>
        <div className="upgrade-modal-plans">
          <article>
            <strong>Plus</strong>
            <span className="upgrade-modal-price">₹299 <small>/ month</small></span>
            <span>5 interviews + 5 assessments (20 questions each), 10 AI paper requests per UTC month, and all Resume AI tools</span>
          </article>
          <article className="upgrade-modal-plan-featured">
            <strong>Pro</strong>
            <span className="upgrade-modal-price">₹599 <small>/ month</small></span>
            <span>12 interviews + 12 assessments (20 questions each), 30 AI paper requests per UTC month, and all Resume AI tools</span>
          </article>
        </div>
        <p className="upgrade-modal-note">Paid plans unlock AI interview practice, AI paper requests, and Resume AI tools. Browse papers, save searches, and use Research Maker locally without paying. Choose 1, 3, 6, or 12 months on the pricing page. One-time purchase; no auto-renewal.</p>
        <Link to="/pricing" className="primary-button upgrade-modal-action">
          View plans <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
