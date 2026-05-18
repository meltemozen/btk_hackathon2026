import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, History, User, LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/dashboard">FinTwin AI</Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className="nav-item">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/history" className="nav-item">
          <History size={20} />
          <span>Geçmiş</span>
        </Link>
        <Link to="/profile" className="nav-item">
          <User size={20} />
          <span>Profil</span>
        </Link>
        <button onClick={handleLogout} className="nav-logout">
          <LogOut size={18} />
          <span>Çıkış</span>
        </button>
      </div>

      <style>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
          position: sticky;
          top: 0;
          z-index: 1000;
          margin-bottom: 1rem;
        }
        .nav-logo a {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(to right, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-decoration: none;
        }
        .nav-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .nav-item:hover {
          color: #6366f1;
        }
        .nav-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 0 !important;
          width: auto !important;
          box-shadow: none !important;
        }
        .nav-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          transform: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </nav>
  );
}
