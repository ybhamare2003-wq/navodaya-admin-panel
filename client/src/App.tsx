import { useEffect, useState, type FormEvent } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { BarChart3, LayoutDashboard, LogOut, Shield, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { api, authApi, clearSession, getAccessToken, getErrorMessage, saveSession } from './api/client';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import './App.css';

type Phase = 'checking' | 'login' | 'admin' | 'denied';
type Step = 'phone' | 'otp';

const RESEND_SECONDS = 25;

export default function App() {
    const [phase, setPhase] = useState<Phase>(getAccessToken() ? 'checking' : 'login');
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [busy, setBusy] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [loginError, setLoginError] = useState('');
    const [toast, setToast] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const onExpired = () => {
            setPhase('login');
            setStep('phone');
            setLoginError('Your session expired. Sign in again.');
        };
        const onDenied = () => setPhase('denied');
        const onToast = (event: Event) => {
            setToast((event as CustomEvent<string>).detail);
            window.setTimeout(() => setToast(''), 4500);
        };
        window.addEventListener('admin:session-expired', onExpired);
        window.addEventListener('admin:access-denied', onDenied);
        window.addEventListener('admin:toast', onToast);

        if (getAccessToken()) {
            void api.get<{ isAdmin: boolean }>('/me')
                .then((response) => setPhase(response.data.isAdmin ? 'admin' : 'denied'))
                .catch((error: unknown) => {
                    if (!(axios.isAxiosError(error) && error.response?.status === 403)) setPhase('login');
                });
        }
        return () => {
            window.removeEventListener('admin:session-expired', onExpired);
            window.removeEventListener('admin:access-denied', onDenied);
            window.removeEventListener('admin:toast', onToast);
        };
    }, []);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [countdown]);

    async function sendOtp(event?: FormEvent) {
        event?.preventDefault();
        const identifier = phone.replace(/\D/g, '');
        if (identifier.length < 10 || identifier.length > 15) {
            setLoginError('Enter your number with country code, e.g. 919876543210.');
            return;
        }
        setBusy(true);
        setLoginError('');
        try {
            await authApi.post('/v2/send-otp', { identifierType: 'phone', identifier });
            setPhone(identifier);
            setOtp('');
            setStep('otp');
            setCountdown(RESEND_SECONDS);
        } catch (error: unknown) {
            const message = getErrorMessage(error, 'Could not send OTP. Please try again.');
            const wait = /Wait (\d+)s/i.exec(message);
            if (wait) setCountdown(Number(wait[1]));
            setLoginError(message);
        } finally {
            setBusy(false);
        }
    }

    async function verifyOtp(event: FormEvent) {
        event.preventDefault();
        if (!/^\d{4}$/.test(otp)) {
            setLoginError('Enter the 4-digit OTP.');
            return;
        }
        setBusy(true);
        setLoginError('');
        try {
            const { data } = await authApi.post<{ accessToken: string; refreshToken: string }>(
                '/v2/verify-otp',
                { identifierType: 'phone', identifier: phone, otp },
            );
            saveSession(data.accessToken, data.refreshToken);
            setPhase('checking');
            const admin = await api.get<{ isAdmin: boolean }>('/me');
            if (admin.data.isAdmin) {
                setPhase('admin');
            } else {
                setPhase('denied');
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                setPhase('denied');
            } else {
                clearSession();
                setPhase('login');
                setLoginError(getErrorMessage(error, 'Could not verify OTP. Please try again.'));
            }
        } finally {
            setBusy(false);
        }
    }

    function logout() {
        clearSession();
        setPhase('login');
        setStep('phone');
        setPhone('');
        setOtp('');
        setLoginError('');
        navigate('/');
    }

    if (phase === 'checking') {
        return <div className="full-screen-state"><span className="spinner" />Verifying administrator access...</div>;
    }

    if (phase === 'login') {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <div className="brand-mark"><Shield size={23} /></div>
                    <h1>Admin sign in</h1>
                    {step === 'phone' ? (
                        <form onSubmit={sendOtp} className="auth-form">
                            <label htmlFor="phone">Phone number</label>
                            <input
                                id="phone"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                autoFocus
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="919876543210"
                            />
                            <p className="field-hint">Include country code, without +</p>
                            {loginError && <p className="form-error" role="alert">{loginError}</p>}
                            <button className="button button-primary full-width" type="submit" disabled={busy || countdown > 0}>
                                {busy ? 'Sending…' : countdown > 0 ? `Wait ${countdown}s` : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verifyOtp} className="auth-form">
                            <label htmlFor="otp">Enter the OTP sent to {phone}</label>
                            <input
                                id="otp"
                                className="otp-input"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                autoFocus
                                maxLength={4}
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                                placeholder="••••"
                            />
                            {loginError && <p className="form-error" role="alert">{loginError}</p>}
                            <button className="button button-primary full-width" type="submit" disabled={busy}>
                                {busy ? 'Verifying…' : 'Verify'}
                            </button>
                            <div className="auth-links">
                                <button type="button" className="link-button" onClick={() => { setStep('phone'); setLoginError(''); }}>Change number</button>
                                <button type="button" className="link-button" disabled={busy || countdown > 0} onClick={() => void sendOtp()}>
                                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>
        );
    }

    if (phase === 'denied') {
        return (
            <main className="full-screen-state denied-state">
                <ShieldAlert size={36} />
                <h1>Access denied</h1>
                <p>This account is not permitted to use the admin panel.</p>
                <button className="button button-secondary" onClick={logout}>Sign out</button>
            </main>
        );
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-mark small"><Shield size={19} /></div>
                    <div><strong>Navodaya</strong><span>Admin console</span></div>
                </div>
                <p className="nav-caption">WORKSPACE</p>
                <nav className="side-nav" aria-label="Main navigation">
                    <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                        <LayoutDashboard size={18} />Dashboard
                    </NavLink>
                    <NavLink to="/reports" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                        <BarChart3 size={18} />Reports
                    </NavLink>
                </nav>
                <div className="sidebar-bottom">
                    <div className="admin-identity"><span className="online-dot" /><span><strong>Administrator</strong><small>Authorized account</small></span></div>
                    <button className="logout-button" onClick={logout}><LogOut size={17} />Sign out</button>
                </div>
            </aside>
            <main className="main-panel">
                <header className="topbar">
                    <span>Admin console</span>
                    <div className="topbar-user"><span className="online-dot" />Administrator</div>
                </header>
                <div className="page-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="*" element={<Dashboard />} />
                    </Routes>
                </div>
            </main>
            {toast && <div className="toast" role="status">{toast}</div>}
        </div>
    );
}
