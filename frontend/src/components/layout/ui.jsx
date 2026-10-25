import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export function AppShell({ sidebar, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isResizing) return undefined;

    const handlePointerMove = (event) => {
      if (event.pointerId !== resizeStart.current?.pointerId) return;
      const nextWidth = resizeStart.current.width + event.clientX - resizeStart.current.x;
      setSidebarWidth(Math.min(400, Math.max(200, nextWidth)));
    };
    const stopResizing = (event) => {
      if (event.pointerId !== resizeStart.current?.pointerId) return;
      resizeStart.current = null;
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [isResizing]);

  const startResizing = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    resizeStart.current = {
      x: event.clientX,
      width: sidebarWidth,
      pointerId: event.pointerId,
    };
    setIsResizing(true);
  };

  const handleResizeKeyDown = (event) => {
    const adjustment = event.shiftKey ? 32 : 12;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSidebarWidth((width) => Math.max(200, width - adjustment));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setSidebarWidth((width) => Math.min(400, width + adjustment));
    } else if (event.key === "Home") {
      event.preventDefault();
      setSidebarWidth(200);
    } else if (event.key === "End") {
      event.preventDefault();
      setSidebarWidth(400);
    }
  };

  return (
    <div
      className={`app-shell${isResizing ? " is-resizing" : ""}`}
      style={{ "--sidebar-width": `${sidebarWidth}px` }}
    >
      <button
        className="app-drawer-toggle"
        type="button"
        aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={drawerOpen}
        aria-controls="app-sidebar"
        onClick={() => setDrawerOpen((open) => !open)}
      >
        {drawerOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {drawerOpen && (
        <button
          className="app-sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside id="app-sidebar" className={`app-sidebar${drawerOpen ? " is-open" : ""}`}>
        {sidebar}
        <div
          className="app-sidebar-resize-handle"
          role="separator"
          aria-label="Resize navigation sidebar"
          aria-orientation="vertical"
          aria-valuemin={200}
          aria-valuemax={400}
          aria-valuenow={sidebarWidth}
          tabIndex={0}
          onPointerDown={startResizing}
          onKeyDown={handleResizeKeyDown}
        />
      </aside>
      <div className="app-shell-main">{children}</div>
    </div>
  );
}

export function Sidebar({ user, groups, footer, onNavigate }) {
  return (
    <div className="shared-sidebar">
      <NavLink className="shared-sidebar-brand" to="/dashboard" onClick={onNavigate}>
        <img className="shared-sidebar-logo" src="/albero-innovation-mark.svg" alt="" />
        <span>Albero Innovation</span>
      </NavLink>
      {user && <div className="shared-sidebar-user">{user.name}</div>}
      <nav className="shared-sidebar-nav" aria-label="Workspace navigation">
        {groups.map(({ label, items }) => (
          <section className="shared-sidebar-group" key={label}>
            <h2>{label}</h2>
            <div>
              {items.map(({ label: itemLabel, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/" || to === "/dashboard"}
                  className={({ isActive }) => `shared-sidebar-link${isActive ? " active" : ""}`}
                  onClick={onNavigate}
                >
                  {itemLabel}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>
      {footer && <p className="shared-sidebar-note">{footer}</p>}
    </div>
  );
}

export function Card({ as: Element = "section", className = "", children, ...props }) {
  return <Element className={`ds-card${className ? ` ${className}` : ""}`} {...props}>{children}</Element>;
}

export function StatCard({ label, value, note, icon: Icon }) {
  return (
    <Card className="ds-stat-card">
      {Icon && <span className="ds-stat-icon"><Icon size={18} aria-hidden="true" /></span>}
      <span className="ds-stat-label">{label}</span>
      <strong>{value}</strong>
      {note && <span className="ds-stat-note">{note}</span>}
    </Card>
  );
}

export function Button({ variant = "primary", className = "", children, ...props }) {
  return <button className={`ds-button ${variant}${className ? ` ${className}` : ""}`} {...props}>{children}</button>;
}

export function Input({ label, id, ...props }) {
  return <label className="ds-field" htmlFor={id}><span>{label}</span><input id={id} {...props} /></label>;
}

export function Select({ label, id, children, ...props }) {
  return <label className="ds-field" htmlFor={id}><span>{label}</span><select id={id} {...props}>{children}</select></label>;
}

export function Textarea({ label, id, ...props }) {
  return <label className="ds-field" htmlFor={id}><span>{label}</span><textarea id={id} {...props} /></label>;
}

export function Pill({ children, className = "" }) {
  return <span className={`ds-pill${className ? ` ${className}` : ""}`}>{children}</span>;
}

export function Tag({ children = "AI" }) {
  return <span className="ds-tag">{children}</span>;
}

export function ProgressBar({ value, max = 100, label }) {
  const boundedValue = Math.max(0, Math.min(value, max));
  return (
    <div className="ds-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={boundedValue}>
      <span style={{ width: `${max ? boundedValue / max * 100 : 0}%` }} />
    </div>
  );
}

export function ScoreRing({ value, label = "Score" }) {
  const boundedValue = Math.max(0, Math.min(value, 100));
  const circumference = 2 * Math.PI * 46;
  return (
    <div className="ds-score-ring" role="img" aria-label={`${label}: ${boundedValue} out of 100`}>
      <svg viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r="46" />
        <circle cx="55" cy="55" r="46" style={{ strokeDasharray: `${circumference * boundedValue / 100} ${circumference}` }} />
      </svg>
      <span><strong>{boundedValue}</strong><small>/ 100</small></span>
    </div>
  );
}

export function Tabs({ items, value, onChange, label = "Sections" }) {
  return (
    <div className="ds-tabs" role="tablist" aria-label={label}>
      {items.map((item) => {
        const selected = item.value === value;
        return <button key={item.value} type="button" role="tab" aria-selected={selected} className={selected ? "active" : ""} onClick={() => onChange(item.value)}>{item.label}</button>;
      })}
    </div>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="ds-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="ds-modal" role="dialog" aria-modal="true" aria-labelledby="ds-modal-title">
        <div className="ds-modal-heading"><h2 id="ds-modal-title">{title}</h2><Button variant="secondary" aria-label="Close dialog" onClick={onClose}><X size={18} /></Button></div>
        {children}
      </section>
    </div>
  );
}

export function Toast({ children, role = "status" }) {
  return <div className="ds-toast" role={role}>{children}</div>;
}

export function EmptyState({ title, description, action }) {
  return <div className="ds-empty-state"><strong>{title}</strong><p>{description}</p>{action}</div>;
}

export function Skeleton({ lines = 3 }) {
  return <div className="ds-skeleton" aria-label="Loading" aria-busy="true">{Array.from({ length: lines }, (_, index) => <span key={index} />)}</div>;
}

export function Table({ columns, rows, getRowKey = (_, index) => index }) {
  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={getRowKey(row, index)}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
