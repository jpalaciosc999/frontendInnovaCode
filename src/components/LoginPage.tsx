import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUsuario } from '../services/authService';

const pickUsuarioValue = (usuario: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = usuario[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return undefined;
};

const loginWithCredentialFallback = async (credential: string, password: string) => {
  const baseRequest = {
    username: credential,
    correo: credential,
    password,
  };

  try {
    return await loginUsuario(baseRequest);
  } catch (error) {
    if (!credential.includes('@')) throw error;

    return loginUsuario({
      ...baseRequest,
      username: credential.split('@')[0],
    });
  }
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !contrasena.trim()) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const credential = email.trim();
      const response = await loginWithCredentialFallback(credential, contrasena);

      const usuario = response.usuario as unknown as Record<string, unknown>;
      const rolId = pickUsuarioValue(usuario, ['rol_id', 'ROL_ID']);
      const rolNombre = pickUsuarioValue(usuario, ['rol_nombre', 'ROL_NOMBRE', 'rol', 'role']);
      const correo = pickUsuarioValue(usuario, ['correo', 'CORREO', 'email', 'EMAIL']);

      login(response.token, {
        ...response.usuario,
        id: Number(pickUsuarioValue(usuario, ['id', 'ID', 'USU_ID', 'usu_id']) ?? response.usuario.id),
        email: String(correo ?? ''),
        correo: String(correo ?? ''),
        rol: String(rolNombre ?? rolId ?? ''),
        rol_id: rolId !== undefined ? Number(rolId) : undefined,
        rol_nombre: rolNombre !== undefined ? String(rolNombre) : undefined,
      });

      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          display: flex;
          min-height: 100vh;
          font-family: 'Nunito', sans-serif;
        }

        /* ── Panel izquierdo: formulario ── */
        .lp-left {
          width: 420px;
          flex-shrink: 0;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 3rem;
          position: relative;
          z-index: 2;
          box-shadow: 6px 0 32px rgba(0,0,0,0.08);
        }

        .lp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2rem;
        }

        .lp-logo-icon {
          width: 44px;
          height: 44px;
        }

        .lp-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: #1a2e4a;
          line-height: 1.1;
        }

        .lp-logo-sub {
          font-family: 'Nunito', sans-serif;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #e07b39;
          display: block;
        }

        .lp-heading {
          font-family: 'Playfair Display', serif;
          font-size: 1.9rem;
          color: #1a2e4a;
          margin-bottom: 0.3rem;
        }

        .lp-sub {
          font-size: 0.875rem;
          color: #8a96a8;
          margin-bottom: 2rem;
        }

        .lp-field {
          margin-bottom: 1.2rem;
        }

        .lp-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #4a5568;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
        }

        .lp-input-wrap {
          position: relative;
        }

        .lp-input {
          width: 100%;
          padding: 11px 42px 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-family: 'Nunito', sans-serif;
          font-size: 0.925rem;
          color: #1a2e4a;
          background: #f8fafc;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .lp-input:focus {
          border-color: #e07b39;
          box-shadow: 0 0 0 3px rgba(224,123,57,0.12);
          background: #fff;
        }
        .lp-input::placeholder { color: #b0bec5; }

        .lp-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: #8a96a8;
          padding: 2px;
          transition: color 0.2s;
        }
        .lp-eye:hover { color: #e07b39; }

        .lp-error {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 7px;
          padding: 9px 13px;
          font-size: 0.83rem;
          color: #c53030;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .lp-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #e07b39 0%, #c9612a 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'Nunito', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 0.5rem;
          letter-spacing: 0.02em;
        }
        .lp-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .lp-footer {
          margin-top: 2rem;
          font-size: 0.75rem;
          color: #b0bec5;
          text-align: center;
          line-height: 1.6;
        }

        /* ── Panel derecho: ilustración ── */
        .lp-right {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #0f2a4a 0%, #1a4a7a 35%, #2d6a9f 60%, #e8a460 85%, #e07b39 100%);
        }

        /* Montañas SVG decorativas */
        .lp-mountains {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
        }

        /* Estrellas / partículas */
        .lp-stars {
          position: absolute;
          inset: 0;
        }
        .star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: twinkle 3s infinite alternate;
        }
        @keyframes twinkle {
          from { opacity: 0.2; }
          to   { opacity: 1; }
        }

        /* Personaje central: oficinista */
        .lp-illustration {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .lp-ill-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          color: rgba(255,255,255,0.95);
          text-align: center;
          line-height: 1.2;
          text-shadow: 0 2px 20px rgba(0,0,0,0.3);
          margin-bottom: 1.5rem;
          animation: fadeUp 0.8s ease both;
        }

        .lp-badges {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          animation: fadeUp 0.8s 0.2s ease both;
        }

        .lp-badge {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 40px;
          padding: 8px 20px;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 9px;
          white-space: nowrap;
        }

        .lp-badge-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #e07b39;
          box-shadow: 0 0 8px #e07b39;
          flex-shrink: 0;
        }

        /* SVG ilustración planilla */
        .lp-svg-wrap {
          position: absolute;
          bottom: 80px;
          right: 60px;
          opacity: 0.18;
          animation: floatSvg 4s ease-in-out infinite alternate;
        }
        @keyframes floatSvg {
          from { transform: translateY(0); }
          to   { transform: translateY(-16px); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .lp-right { display: none; }
          .lp-left { width: 100%; }
        }

        /* Spinner */
        .lp-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="lp-root">

        {/* ── IZQUIERDA: Formulario ── */}
        <div className="lp-left">

          {/* Logo */}
          <div className="lp-logo">
            <svg className="lp-logo-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="44" height="44" rx="10" fill="#1a2e4a"/>
              <path d="M10 32L16 20L22 26L28 16L34 32H10Z" fill="#e07b39" opacity="0.9"/>
              <circle cx="28" cy="14" r="3" fill="#e07b39"/>
              <path d="M10 22H34" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
            </svg>
            <div>
              <span className="lp-logo-text">Innova Home</span>
              <span className="lp-logo-sub">Gestión de Planilla</span>
            </div>
          </div>

          <h1 className="lp-heading">Bienvenido</h1>
          <p className="lp-sub">Ingresa tus credenciales para acceder al sistema</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="lp-field">
              <label className="lp-label" htmlFor="email">Usuario o correo electrónico</label>
              <div className="lp-input-wrap">
                <input
                  id="email"
                  type="email"
                  className="lp-input"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="contrasena">Contraseña</label>
              <div className="lp-input-wrap">
                <input
                  id="contrasena"
                  type={showPass ? 'text' : 'password'}
                  className="lp-input"
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button type="button" className="lp-eye" onClick={() => setShowPass(p => !p)}>
                  {showPass ? '👁' : '🔒'}
                </button>
              </div>
            </div>

            {error && (
              <div className="lp-error">
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? <span className="lp-spinner" /> : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="lp-footer">
            Sistema protegido bajo uso exclusivo de personal autorizado.<br />
            © {new Date().getFullYear()} Innova Home · Guatemala
          </div>
        </div>

        {/* ── DERECHA: Ilustración temática planilla ── */}
        <div className="lp-right">

          {/* Estrellas */}
          <div className="lp-stars">
            {[
              [12,8],[25,5],[38,12],[55,4],[70,9],[82,6],[90,14],
              [15,20],[42,18],[68,22],[88,19],[30,28],[75,25],
              [8,35],[50,32],[92,30],[20,42],[60,38],[85,44],
            ].map(([l, t], i) => (
              <div key={i} className="star" style={{
                left: `${l}%`, top: `${t}%`,
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                animationDelay: `${(i * 0.3) % 3}s`,
                animationDuration: `${2 + (i % 3)}s`,
              }} />
            ))}
          </div>

          {/* Contenido central */}
          <div className="lp-illustration">
            <div className="lp-ill-title">
              Planilla Digital<br />para Guatemala
            </div>

            {/* SVG: persona trabajando con documentos */}
            <svg width="220" height="180" viewBox="0 0 220 180" fill="none" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>
              {/* Escritorio */}
              <rect x="20" y="130" width="180" height="12" rx="4" fill="#c9612a" opacity="0.9"/>
              <rect x="40" y="142" width="12" height="30" rx="3" fill="#a04e22"/>
              <rect x="168" y="142" width="12" height="30" rx="3" fill="#a04e22"/>

              {/* Monitor */}
              <rect x="65" y="70" width="90" height="62" rx="6" fill="#1a2e4a"/>
              <rect x="70" y="75" width="80" height="50" rx="3" fill="#0f3460"/>
              {/* Pantalla: gráfica de barras */}
              <rect x="76" y="100" width="10" height="20" rx="2" fill="#e07b39"/>
              <rect x="90" y="93" width="10" height="27" rx="2" fill="#e07b39" opacity="0.7"/>
              <rect x="104" y="97" width="10" height="23" rx="2" fill="#e07b39"/>
              <rect x="118" y="88" width="10" height="32" rx="2" fill="#e07b39" opacity="0.8"/>
              <rect x="132" y="94" width="10" height="26" rx="2" fill="#e07b39" opacity="0.6"/>
              {/* Línea base */}
              <line x1="74" y1="122" x2="146" y2="122" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              {/* Pie monitor */}
              <rect x="100" y="132" width="20" height="6" rx="2" fill="#0f2a4a"/>
              <rect x="92" y="137" width="36" height="4" rx="2" fill="#0f2a4a"/>

              {/* Persona */}
              {/* Cuerpo */}
              <rect x="88" y="44" width="44" height="32" rx="8" fill="#2d6a9f"/>
              {/* Cabeza */}
              <circle cx="110" cy="35" r="16" fill="#f4a261"/>
              {/* Cabello */}
              <path d="M94 32 Q110 18 126 32" fill="#1a2e4a"/>
              {/* Ojos */}
              <circle cx="104" cy="34" r="2" fill="#1a2e4a"/>
              <circle cx="116" cy="34" r="2" fill="#1a2e4a"/>
              {/* Sonrisa */}
              <path d="M105 40 Q110 44 115 40" stroke="#1a2e4a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              {/* Corbata */}
              <path d="M108 44 L110 56 L112 44" fill="#e07b39"/>
              {/* Brazos */}
              <rect x="68" y="50" width="22" height="8" rx="4" fill="#2d6a9f" transform="rotate(15 68 50)"/>
              <rect x="130" y="50" width="22" height="8" rx="4" fill="#2d6a9f" transform="rotate(-15 152 50)"/>
              {/* Manos */}
              <circle cx="72" cy="62" r="6" fill="#f4a261"/>
              <circle cx="148" cy="62" r="6" fill="#f4a261"/>

              {/* Documentos flotantes */}
              <rect x="30" y="85" width="32" height="40" rx="3" fill="#fff" opacity="0.92"/>
              <line x1="36" y1="95" x2="56" y2="95" stroke="#e07b39" strokeWidth="2" strokeLinecap="round"/>
              <line x1="36" y1="101" x2="56" y2="101" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="36" y1="107" x2="50" y2="107" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="36" y1="113" x2="54" y2="113" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
              <text x="33" y="93" fontSize="6" fill="#1a2e4a" fontWeight="bold">PLANILLA</text>

              <rect x="158" y="78" width="32" height="40" rx="3" fill="#fff" opacity="0.92"/>
              <line x1="164" y1="88" x2="184" y2="88" stroke="#e07b39" strokeWidth="2" strokeLinecap="round"/>
              <line x1="164" y1="94" x2="184" y2="94" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="164" y1="100" x2="178" y2="100" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="164" y1="106" x2="182" y2="106" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
              <text x="161" y="86" fontSize="6" fill="#1a2e4a" fontWeight="bold">NÓMINA</text>
            </svg>

            <div className="lp-badges">
              {[
                'Control de Planilla Mensual',
                'IGSS · ISR Guatemala',
                'Gestión de Empleados',
                'Reportes y KPIs',
              ].map(item => (
                <div key={item} className="lp-badge">
                  <span className="lp-badge-dot" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Montañas decorativas */}
          <svg className="lp-mountains" viewBox="0 0 800 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 200 L0 120 L100 60 L200 110 L320 30 L440 90 L560 20 L680 80 L800 40 L800 200Z" fill="rgba(15,42,74,0.6)"/>
            <path d="M0 200 L0 150 L150 90 L280 140 L400 70 L520 130 L650 60 L800 100 L800 200Z" fill="rgba(15,42,74,0.4)"/>
          </svg>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
