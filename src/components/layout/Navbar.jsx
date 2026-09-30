import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

/**
 * Navigation item configuration
 */
const NAV_ITEMS = [
  {
    path: '/doacoes',
    label: 'Doações',
    badge: 'Receitas',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  {
    path: '/despesas',
    label: 'Despesas',
    badge: null,
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  {
    path: '/contas',
    label: 'Contas',
    badge: null,
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M3 10h18" />
        <path d="M5 6l7-3 7 3" />
        <path d="M4 10v11" />
        <path d="M20 10v11" />
        <path d="M8 14v4" />
        <path d="M12 14v4" />
        <path d="M16 14v4" />
      </svg>
    )
  },
  {
    path: '/usuarios',
    label: 'Usuários',
    badge: null,
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
];

const DEFAULT_USER = {
  name: 'Tiago Fernandes',
  email: 'financeiro@tiagofernandes.com.br',
  role: 'Administrador'
};

const Navbar = ({ user: propUser, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(propUser || DEFAULT_USER);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  // Sync user prop or fetch from localStorage
  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
      return;
    }

    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      setCurrentUser(DEFAULT_USER);
    }
  }, [propUser]);

  // Handle scroll effect for navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch {
      // Ignore storage errors
    }

    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'TF';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className={`navbar-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="navbar-container" ref={menuRef}>
        {/* Brand / Logo */}
        <Link to="/doacoes" className="navbar-brand" aria-label="Ir para a página inicial">
          <div className="brand-logo-badge">
            <span className="brand-initials">TF</span>
          </div>
          <div className="brand-text-block">
            <span className="brand-title">Campanha Tiago Fernandes</span>
            <span className="brand-subtitle">Gestão Financeira</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-nav desktop-nav" aria-label="Navegação principal">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-link-icon">{item.icon}</span>
                  <span className="nav-link-text">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                  <span className="active-indicator" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Section: User Info + Logout */}
        <div className="navbar-right desktop-right">
          <div className="user-profile-badge" title={currentUser.email}>
            <div className="user-avatar" aria-hidden="true">
              {getInitials(currentUser.name)}
            </div>
            <div className="user-info">
              <span className="user-email">{currentUser.email}</span>
              <span className="user-role">{currentUser.role || 'Usuário'}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogoutClick}
            title="Sair do sistema"
            aria-label="Sair da conta"
          >
            <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="logout-text">Sair</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className={`hamburger-button ${isMobileMenuOpen ? 'is-active' : ''}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        >
          <span className="hamburger-line line-1" />
          <span className="hamburger-line line-2" />
          <span className="hamburger-line line-3" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-drawer ${isMobileMenuOpen ? 'is-open' : ''}`}>
        <div className="mobile-drawer-header">
          <div className="user-profile-badge mobile-user-badge">
            <div className="user-avatar">
              {getInitials(currentUser.name)}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.name || 'Tiago Fernandes'}</span>
              <span className="user-email">{currentUser.email}</span>
            </div>
          </div>
        </div>

        <nav className="mobile-nav-list" aria-label="Navegação móvel">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <div className="mobile-nav-link-content">
                <span className="nav-link-icon">{item.icon}</span>
                <span className="nav-link-text">{item.label}</span>
              </div>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mobile-drawer-footer">
          <button
            type="button"
            className="mobile-logout-button"
            onClick={handleLogoutClick}
          >
            <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair da conta</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
