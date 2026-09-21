"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  CircleCheck,
  Clock3,
  Code2,
  Flame,
  LayoutDashboard,
  LockKeyhole,
  Medal,
  Crown,
  Mail,
  Menu,
  Eye,
  EyeOff,
  FileUp,
  GraduationCap,
  LogOut,
  Play,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

type DashboardModule = { id: string; title: string; detail: string; position: number; progress: number; lessons: number; minutes: number };
type DashboardQuestion = { id: string; materialId: string; prompt: string; options: unknown; xp: number; material: { title: string } };
type DashboardBadge = { code: string; title: string; description: string; category: string; icon: string; tone: string; unlocked: boolean; unlockedAt: string | null };
type LeaderboardEntry = { id: string; name: string; xp: number; rank: number; isCurrent: boolean };
type TeacherDashboard = {
  stats: { pathsCount: number; challengesCount: number; studentCount: number; materialCount: number; submissionCount: number };
  paths: { id: string; title: string; description: string; category: string; level: string; materialCount: number }[];
  challenges: { id: string; title: string; category: string; level: string; xp: number; minutes: number }[];
};

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Teman";
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "KK";
}

function formatToday() {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()).toUpperCase();
}

function getWeekActivity(activityDates: string[]) {
  const activeDates = new Set(activityDates);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date).slice(0, 2),
      active: activeDates.has(date.toISOString().slice(0, 10)),
      today: index === 6,
    };
  });
}

const AUTH_STORAGE_KEY = "kodekita-user";
const NAV_STORAGE_KEY = "kodekita-active-nav";
const NAV_ITEMS = ["Beranda", "Jalur belajar", "Tantangan", "Pencapaian", "Leaderboard", "Pengaturan", "Pusat bantuan"];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Beranda");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [role, setRole] = useState<"siswa" | "guru">("siswa");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [loggedInName, setLoggedInName] = useState("Andi Ramadhan");
  const [loggedInRole, setLoggedInRole] = useState<"siswa" | "guru">("siswa");
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [loggedInId, setLoggedInId] = useState("");
  const [studentXp, setStudentXp] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [studentBadges, setStudentBadges] = useState<DashboardBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [dashboardModules, setDashboardModules] = useState<DashboardModule[]>([]);
  const [teacherDashboard, setTeacherDashboard] = useState<TeacherDashboard | null>(null);
  const [quickCheck, setQuickCheck] = useState<DashboardQuestion | null>(null);
  const [quickCheckResult, setQuickCheckResult] = useState<boolean | null>(null);
  const [selectedQuickAnswer, setSelectedQuickAnswer] = useState("");
  const [quickCheckLocked, setQuickCheckLocked] = useState(false);
  const [quickCheckAttemptsRemaining, setQuickCheckAttemptsRemaining] = useState(2);
  const [insightVisible, setInsightVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const restoreSession = window.setTimeout(() => {
      const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as { id?: string; name?: string; email?: string; role?: "TEACHER" | "STUDENT" };
          if (!cancelled && user.id && user.name && user.email && user.role) {
            setLoggedInId(user.id);
            setLoggedInName(user.name);
            setLoggedInEmail(user.email);
            setLoggedInRole(user.role === "TEACHER" ? "guru" : "siswa");
            const storedNav = window.localStorage.getItem(NAV_STORAGE_KEY);
            const canRestoreNav = storedNav && NAV_ITEMS.includes(storedNav) && (storedNav !== "Pencapaian" || user.role === "STUDENT");
            if (canRestoreNav) setActiveNav(storedNav);
            setIsLoggedIn(true);
          } else if (!user.id || !user.name || !user.email || !user.role) {
            window.localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } catch {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
      if (!cancelled) setAuthReady(true);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(restoreSession);
    };
  }, []);

  useEffect(() => {
    if (!loggedInId || loggedInRole !== "guru") return;
    fetch(`/api/teacher/dashboard?teacherId=${loggedInId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((result: TeacherDashboard | null) => {
        if (result) setTeacherDashboard(result);
      })
      .catch(() => setTeacherDashboard(null));
  }, [loggedInId, loggedInRole]);

  useEffect(() => {
    if (!loggedInId || loggedInRole !== "siswa") return;
    fetch(`/api/learning/dashboard?studentId=${loggedInId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((result: { xp?: number; currentStreak?: number; activityDates?: string[]; badges?: DashboardBadge[]; leaderboard?: LeaderboardEntry[]; currentRank?: number | null; modules?: DashboardModule[]; quickCheck?: DashboardQuestion | null; quickCheckStatus?: { locked: boolean; attemptsRemaining: number } } | null) => {
        if (!result) return;
        setStudentXp(result.xp ?? 0);
        setCurrentStreak(result.currentStreak ?? 0);
        setActivityDates(result.activityDates ?? []);
        setStudentBadges(result.badges ?? []);
        setLeaderboard(result.leaderboard ?? []);
        setCurrentRank(result.currentRank ?? null);
        setDashboardModules(result.modules ?? []);
        setQuickCheck(result.quickCheck ?? null);
        setQuickCheckLocked(result.quickCheckStatus?.locked ?? false);
        setQuickCheckAttemptsRemaining(result.quickCheckStatus?.attemptsRemaining ?? 2);
      })
      .catch(() => {
        setQuickCheck(null);
        setQuickCheckResult(null);
        setDashboardModules([]);
      });
  }, [loggedInId, loggedInRole]);

  async function submitDashboardAnswer(answer: string) {
    if (!quickCheck || quickCheckLocked) return;
    setSelectedQuickAnswer(answer);
    setQuickCheckResult(null);
    const response = await fetch("/api/learning/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: loggedInId, materialId: quickCheck.materialId, questionId: quickCheck.id, answer }),
    });
    const result = await response.json() as { message?: string; isCorrect: boolean | null; locked?: boolean; attemptsRemaining?: number; totalXp?: number };
    if (response.ok) {
      setQuickCheckResult(result.isCorrect);
      setQuickCheckLocked(result.locked ?? false);
      setQuickCheckAttemptsRemaining(result.attemptsRemaining ?? 0);
      if (result.totalXp !== undefined) setStudentXp(result.totalXp);
      await Swal.fire({
        title: result.isCorrect ? "Jawaban benar" : "Belum tepat",
        text: result.isCorrect ? `${result.message ?? ""} Quick check hari ini selesai.` : `${result.message ?? ""} Sisa kesempatan hari ini: ${result.attemptsRemaining ?? 0}.`,
        icon: result.isCorrect ? "success" : "warning",
        timer: 1900,
        showConfirmButton: false,
        customClass: { popup: "kodekita-alert" },
      });
    } else if (response.status === 409) {
      setQuickCheckLocked(true);
      setQuickCheckAttemptsRemaining(0);
      await Swal.fire({ title: "Quick check selesai", text: result.message ?? "Kamu sudah menyelesaikan quick check hari ini.", icon: "info", confirmButtonText: "Mengerti", customClass: { popup: "kodekita-alert" } });
    } else {
      await Swal.fire({ title: "Belum tersimpan", text: result.message ?? "Jawaban gagal disimpan.", icon: "error", confirmButtonText: "Mengerti", customClass: { popup: "kodekita-alert" } });
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !password) {
      setLoginError("Email atau password salah.");
      return;
    }
    setLoginError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: role === "guru" ? "TEACHER" : "STUDENT" }),
      });
      const result = await response.json();
      if (!response.ok) {
        setLoginError(result.message ?? "Email atau password salah.");
        return;
      }
      setLoggedInName(result.user.name);
      setLoggedInId(result.user.id);
      setLoggedInRole(result.user.role === "TEACHER" ? "guru" : "siswa");
      setLoggedInEmail(result.user.email);
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
      await Swal.fire({
        title: "Berhasil masuk",
        text: `Selamat datang kembali, ${result.user.name}.`,
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
        customClass: { popup: "kodekita-alert" },
      });
      setIsLoggedIn(true);
    } catch {
      setLoginError("Database belum terhubung. Periksa DATABASE_URL lalu coba lagi.");
    }
  }

  async function handleLogout() {
    const confirmation = await Swal.fire({
      title: "Keluar dari KODEKITA?",
      text: "Progres belajarmu tetap tersimpan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Tidak",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "kodekita-alert",
        confirmButton: "alert-confirm",
        cancelButton: "alert-cancel",
      },
    });

    if (!confirmation.isConfirmed) return;

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(NAV_STORAGE_KEY);
    setIsLoggedIn(false);
    setActiveNav("Beranda");
    setPassword("");
    await Swal.fire({
      title: "Berhasil keluar",
      text: "Sampai jumpa lagi di KODEKITA.",
      icon: "success",
      timer: 1800,
      showConfirmButton: false,
      customClass: { popup: "kodekita-alert" },
    });
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterMessage("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: role === "guru" ? "TEACHER" : "STUDENT" }),
      });
      const result = await response.json();
      if (!response.ok) {
        setRegisterMessage(result.message ?? "Pendaftaran gagal.");
        return;
      }
      setRegisterMessage("Akun berhasil dibuat. Silakan masuk.");
      setPassword("");
      setAuthMode("login");
    } catch {
      setRegisterMessage("Database belum terhubung. Periksa DATABASE_URL lalu coba lagi.");
    }
  }

  function navigateTo(label: string) {
    setActiveNav(label);
    window.localStorage.setItem(NAV_STORAGE_KEY, label);
    setMenuOpen(false);
  }

  if (!authReady) return null;

  if (!isLoggedIn) {
    if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} />;
    return <LoginScreen mode={authMode} setMode={setAuthMode} role={role} setRole={setRole} name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} registerMessage={registerMessage} onSubmit={authMode === "login" ? handleLogin : handleRegister} />;
  }

  const currentModule = dashboardModules.find((module) => module.progress > 0 && module.progress < 100) ?? dashboardModules[0];
  const currentTeacherPath = teacherDashboard?.paths[0];
  const overallProgress = dashboardModules.length === 0 ? 0 : Math.round(dashboardModules.reduce((total, module) => total + module.progress, 0) / dashboardModules.length);
  const weekActivity = getWeekActivity(activityDates);

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Code2 size={19} strokeWidth={2.7} /></div>
          <span>KODE<span>KITA</span></span>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={19} /></button>
        </div>

        <div className="profile-card">
          <div className="profile-avatar-wrap"><div className="avatar">{getInitials(loggedInName)}</div><small>06</small></div>
          <div><strong>{loggedInName}</strong><span title={loggedInEmail}>{loggedInRole === "guru" ? "Guru · Kelas XI RPL" : "XI RPL - Level 06"}</span></div>
          <button className="logout-icon" onClick={handleLogout} aria-label="Keluar"><LogOut size={16} /></button>
        </div>

        <nav className="main-nav" aria-label="Navigasi utama">
          <p className="nav-label">Workspace</p>
          {(
            loggedInRole === "siswa"
              ? [["Beranda", LayoutDashboard], ["Jalur belajar", BookOpen], ["Tantangan", Zap], ["Pencapaian", Trophy], ["Leaderboard", Award]]
              : [["Beranda", LayoutDashboard], ["Jalur belajar", BookOpen], ["Tantangan", Zap], ["Pencapaian", Trophy], ["Leaderboard", Award]]
          ).map(([label, Icon]) => (
            <button key={label as string} className={`nav-item ${label === "Leaderboard" ? "leaderboard-nav" : ""} ${activeNav === label ? "active" : ""}`} onClick={() => navigateTo(label as string)}>
              <Icon size={18} /> <span>{label as string}</span>
              {label === "Tantangan" && <em>3</em>}
            </button>
          ))}
          <p className="nav-label second-label">Lainnya</p>
          <button className={`nav-item ${activeNav === "Pengaturan" ? "active" : ""}`} onClick={() => navigateTo("Pengaturan")}><Settings size={18} /><span>Pengaturan</span></button>
          <button className={`nav-item ${activeNav === "Pusat bantuan" ? "active" : ""}`} onClick={() => navigateTo("Pusat bantuan")}><CircleHelp size={18} /><span>Pusat bantuan</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="streak-box"><div className="streak-icon"><Flame size={17} fill="currentColor" /></div><div><strong>{loggedInRole === "siswa" ? `${currentStreak} hari berturut-turut` : "Streak kelas"}</strong><span>Jaga ritmemu, {getFirstName(loggedInName)}!</span></div></div>
          <p className="sidebar-foot">KODEKITA <span>v1.0</span></p>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-label="Tutup navigasi" />}

      <section className="content-area">
        <header className="topbar">
          <button className="icon-button menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu size={21} /></button>
          <div className="crumb"><span>Workspace</span><ChevronRight size={15} /><strong>{activeNav}</strong></div>
          <div className="top-actions"><button className="icon-button" aria-label="Cari"><Search size={19} /></button><span className="top-divider" /><button className="notification" aria-label="Notifikasi"><span /></button><div className="mini-avatar">{getInitials(loggedInName)}</div></div>
        </header>

        {activeNav === "Jalur belajar" ? (loggedInRole === "guru" ? <TeacherLearningPathsView teacherId={loggedInId} /> : <StudentLearningPathView studentId={loggedInId} />) : activeNav === "Tantangan" ? (loggedInRole === "guru" ? <TeacherChallengesView teacherId={loggedInId} /> : <ChallengesView studentId={loggedInId} onXpChange={setStudentXp} />) : activeNav === "Pencapaian" ? (loggedInRole === "guru" ? <TeacherAchievementsView teacherId={loggedInId} /> : <AchievementsView studentId={loggedInId} studentName={loggedInName} />) : activeNav === "Leaderboard" ? <LeaderboardView studentId={loggedInId} studentName={loggedInName} isTeacher={loggedInRole === "guru"} /> : activeNav === "Pengaturan" ? <SettingsView studentName={loggedInName} email={loggedInEmail} role={loggedInRole} /> : activeNav === "Pusat bantuan" ? <HelpCenterView /> : <div className="page-content">
          <div className="welcome-row">
            <div><p className="eyebrow">{formatToday()} <span className="live-dot" /></p><h1>Selamat datang kembali, <span>{getFirstName(loggedInName)}.</span></h1><p className="welcome-copy">{loggedInRole === "guru" ? "Pantau perkembangan kelas dan bantu siswa membangun proyek terbaiknya." : "Sedikit progres setiap hari membawa kamu lebih dekat ke proyek pertamamu."}</p></div>
                <button className={`outline-button insight-trigger ${insightVisible ? "active" : ""}`} onClick={() => setInsightVisible((visible) => !visible)}><Sparkles size={16} /> {insightVisible ? "Sembunyikan insight" : "Lihat insight"} <ArrowUpRight size={15} /></button>
          </div>

              {insightVisible && <section className="insight-panel" aria-live="polite"><div className="insight-panel-icon"><Sparkles size={19} /></div><div><p className="eyebrow">INSIGHT UNTUKMU</p><h2>{currentModule ? `${currentModule.progress}% menuju ${currentModule.title}` : "Mulai dari satu materi kecil"}</h2><p>{currentModule ? `Selesaikan satu sesi ${currentModule.minutes} menit hari ini untuk menjaga ritmemu tetap hidup.` : "Guru belum menerbitkan modul. Cek lagi nanti untuk memulai perjalanan belajarmu."}</p><div className="streak-week" aria-label="Aktivitas belajar tujuh hari terakhir">{weekActivity.map((day) => <span className={`${day.active ? "active" : ""} ${day.today ? "today" : ""}`} key={day.key}><b>{day.label}</b><i /></span>)}</div></div><div className="insight-stat"><strong>{currentStreak}</strong><span>hari konsisten</span></div></section>}

              <section className="hero-card home-hero-card">
            <div className="hero-copy"><div className="hero-tag"><span className="tag-dot" /> {loggedInRole === "guru" ? "KONTEN TERBARU" : "SESI BERIKUTNYA"}</div><h2>{loggedInRole === "guru" ? currentTeacherPath?.title ?? "Belum ada jalur belajar" : currentModule ? currentModule.title : "Belum ada modul"}</h2><p>{loggedInRole === "guru" ? currentTeacherPath?.description ?? "Buat jalur belajar pertama untuk mulai membimbing siswa." : currentModule ? currentModule.detail : "Modul belajar dari guru akan muncul di sini."}</p><div className="hero-meta">{loggedInRole === "guru" ? currentTeacherPath && <><span><BookOpen size={15} /> {currentTeacherPath.materialCount} materi</span><span>{currentTeacherPath.category} · {currentTeacherPath.level}</span></> : currentModule && <><span><BookOpen size={15} /> Modul {String(currentModule.position).padStart(2, "0")}</span><span><Play size={13} fill="currentColor" /> {currentModule.minutes} menit</span></>}</div><button className="primary-button" disabled={loggedInRole === "guru" ? !currentTeacherPath : !currentModule}>{loggedInRole === "guru" ? "Kelola jalur belajar" : "Lanjutkan belajar"} <ChevronRight size={17} /></button></div>
            <div className="hero-art"><div className="code-window"><div className="window-bar"><span /><span /><span /><small>style.css</small></div><div className="code-lines"><div><b>.card</b> <i>{"{"}</i></div><div className="indent"><em>display</em>: grid;</div><div className="indent"><em>gap</em>: 1.5rem;</div><div className="indent"><em>background</em>: <u>#f4f0e8</u>;</div><div><i>{"}"}</i></div><div className="code-cursor" /></div></div><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-star">✦</div></div>
          </section>

          <section className="stats-grid home-stats-grid"><div className="stat-item"><div className="stat-icon orange"><Flame size={19} /></div><div><strong>{loggedInRole === "guru" ? `${teacherDashboard?.stats.pathsCount ?? 0} jalur` : `${currentStreak} hari`}</strong><span>{loggedInRole === "guru" ? "Jalur aktif" : "Streak belajar"}</span></div><small>{loggedInRole === "guru" ? "Aktif" : "Tersimpan"}</small></div><div className="stat-item"><div className="stat-icon yellow"><Zap size={19} /></div><div><strong>{loggedInRole === "guru" ? `${teacherDashboard?.stats.challengesCount ?? 0}` : `${studentXp.toLocaleString("id-ID")} XP`}</strong><span>{loggedInRole === "guru" ? "Tantangan dibuat" : "Total pengalaman"}</span></div><small>{loggedInRole === "guru" ? "Dibuat" : "Tersimpan"}</small></div><div className="stat-item"><div className="stat-icon green"><Trophy size={19} /></div><div><strong>{loggedInRole === "guru" ? `${teacherDashboard?.stats.studentCount ?? 0}` : `${studentBadges.filter((badge) => badge.unlocked).length} lencana`}</strong><span>{loggedInRole === "guru" ? "Siswa terpantau" : "Sudah dikumpulkan"}</span></div><small>{loggedInRole === "guru" ? `${teacherDashboard?.stats.submissionCount ?? 0} jawaban masuk` : `dari ${studentBadges.length}`}</small></div><div className="stat-item"><div className="stat-icon blue"><BookOpen size={19} /></div><div><strong>{loggedInRole === "guru" ? `${teacherDashboard?.stats.materialCount ?? 0}` : `${overallProgress}%`}</strong><span>{loggedInRole === "guru" ? "Materi diterbitkan" : "Progres keseluruhan"}</span></div><small>{loggedInRole === "guru" ? "Terbit" : `${dashboardModules.length} modul`}</small></div></section>

          <div className="dashboard-grid home-dashboard-grid"><section className="roadmap-section"><div className="section-heading"><div><p className="eyebrow">{loggedInRole === "guru" ? "KONTEN TERBARU" : "KURIKULUM KAMU"}</p><h2>{loggedInRole === "guru" ? "Jalur belajar" : "Jalur belajar"}</h2></div><button className="text-button">Lihat semua <ArrowUpRight size={15} /></button></div><div className="module-list">{loggedInRole === "guru" ? (teacherDashboard?.paths.length ? teacherDashboard.paths.map((path, index) => <div className={`module-row ${index === 0 ? "current" : "locked"}`} key={path.id}><div className="module-number">{String(index + 1).padStart(2, "0")}</div><div className="module-info"><div className="module-title"><strong>{path.title}</strong>{index === 0 && <span className="current-pill">TERBARU</span>}</div><span>{path.category} · {path.level} · {path.materialCount} materi</span></div><div className="module-progress">{path.materialCount}</div><ChevronRight size={17} className="module-chevron" /></div>) : <p className="monitor-empty">Belum ada jalur belajar.</p>) : dashboardModules.length === 0 ? <p className="monitor-empty">Belum ada modul.</p> : dashboardModules.map((module) => { const tone = module.progress >= 100 ? "done" : module.progress > 0 ? "current" : "locked"; return <div className={`module-row ${tone}`} key={module.id}><div className="module-number">{tone === "done" ? <Check size={16} /> : String(module.position).padStart(2, "0")}</div><div className="module-info"><div className="module-title"><strong>{module.title}</strong>{tone === "current" && <span className="current-pill">SEDANG BERJALAN</span>}</div><span>{module.detail}</span>{module.progress > 0 && <div className="progress-track"><div style={{ width: `${module.progress}%` }} /></div>}</div><div className="module-progress">{module.progress > 0 ? `${module.progress}%` : "—"}</div><ChevronRight size={17} className="module-chevron" /></div>; })}</div></section>

            <aside className="practice-card"><div className="practice-heading"><div><p className="eyebrow">LATIHAN HARI INI</p><h2>Quick check</h2></div><span className="xp-badge">+{quickCheck?.xp ?? 0} XP</span></div>{quickCheck ? <><p className="question">{quickCheck.prompt}</p><div className="answer-list">{(Array.isArray(quickCheck.options) ? quickCheck.options : []).map((option) => { const value = String(option); const isSelected = selectedQuickAnswer === value; const isAnswered = isSelected && quickCheckResult !== null; return <button type="button" key={value} disabled={quickCheckLocked} onClick={() => void submitDashboardAnswer(value)} className={isAnswered ? (quickCheckResult ? "correct" : "incorrect") : ""}><span>{value}</span>{isAnswered && (quickCheckResult ? <Check size={16} /> : <X size={16} />)}</button>; })}</div>{quickCheckResult === true ? <p className="feedback success"><Check size={14} /> Jawaban benar. Kamu mendapatkan {quickCheck.xp} XP dan quick check terkunci hari ini.</p> : quickCheckResult === false ? <p className="feedback error"><X size={14} /> Jawaban belum tepat. {quickCheckLocked ? "Kesempatan hari ini sudah habis." : `Sisa kesempatan: ${quickCheckAttemptsRemaining}.`}</p> : quickCheckLocked ? <p className="practice-hint">Quick check hari ini sudah selesai.</p> : <p className="practice-hint">Pilih satu jawaban. Sisa kesempatan: {quickCheckAttemptsRemaining}.</p>}</> : <p className="practice-hint">Belum ada quick check.</p>}</aside>
          </div>
        </div>}
      </section>
    </main>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  const [activePillar, setActivePillar] = useState(0);
  const pillars = [
    { label: "Belajar terarah", title: "Dari bingung jadi bisa, satu langkah setiap kali.", copy: "Jalur belajar yang jelas membantumu memahami fondasi sebelum masuk ke proyek yang lebih besar.", icon: BookOpen, accent: "mint" },
    { label: "Latihan nyata", title: "Skill tumbuh saat tanganmu ikut bekerja.", copy: "Tantangan singkat membuat konsep coding menempel lewat eksperimen, bukan hafalan.", icon: Zap, accent: "yellow" },
    { label: "Progres terasa", title: "Lihat sejauh apa kamu sudah berkembang.", copy: "Kumpulkan XP, buka lencana, dan bangun ritme belajar yang bisa kamu pertahankan.", icon: Trophy, accent: "orange" },
  ];
  const ActiveIcon = pillars[activePillar].icon;

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Navigasi landing page">
        <button className="landing-brand" onClick={() => scrollToSection("landing-top")} aria-label="Kembali ke awal"><span className="landing-brand-mark"><Code2 size={18} strokeWidth={2.8} /></span><span>KODE<span>KITA</span></span></button>
        <div className="landing-links"><button onClick={() => scrollToSection("cara-kerja")}>Cara kerja</button><button onClick={() => scrollToSection("fitur")}>Fitur</button><button onClick={() => scrollToSection("cerita")}>Cerita siswa</button></div>
        <button className="landing-login" onClick={onStart}>Masuk <ArrowUpRight size={16} /></button>
      </nav>

      <section className="landing-hero" id="landing-top">
        <div className="landing-hero-copy">
          <div className="landing-kicker"><span className="landing-kicker-line" /> PLATFORM BELAJAR CODING UNTUK GENERASI PEMBUAT</div>
          <h1>Belajar coding.<br /><em>Bikin sesuatu.</em></h1>
          <p className="landing-lead">KODEKITA mengubah rasa penasaranmu menjadi skill yang benar-benar bisa dipakai. Mulai dari dasar, berlatih lewat tantangan, lalu bangun karya pertamamu.</p>
          <div className="landing-actions"><button className="landing-primary" onClick={onStart}>Mulai perjalanan <ArrowRight size={18} /></button><button className="landing-play" onClick={() => scrollToSection("cara-kerja")}><span><Play size={13} fill="currentColor" /></span> Lihat cara kerja</button></div>
          <div className="landing-proof"><div className="proof-avatars"><span>AR</span><span>NA</span><span>DS</span><span>+</span></div><p><strong>2.400+</strong> pembuat muda<br />sedang bertumbuh bersama</p></div>
        </div>
        <div className="landing-hero-art" aria-label="Preview ruang belajar KODEKITA">
          <div className="landing-grid-pattern" />
          <div className="floating-note note-top"><Sparkles size={14} /><span><strong>+240 XP</strong><small>progres hari ini</small></span></div>
          <div className="landing-dashboard-card"><div className="mini-window-bar"><span /><span /><span /><small>workspace / beranda</small></div><div className="mini-dashboard"><div className="mini-sidebar"><b>K</b><span /><span /><span /><span /></div><div className="mini-content"><div className="mini-content-head"><span>SELAMAT DATANG KEMBALI</span><i>•••</i></div><h3>Bangun landing page<br /><em>pertamamu.</em></h3><div className="mini-progress"><span><b>JavaScript Dasar</b><small>68% selesai</small></span><strong>68%</strong><div><i /></div></div><div className="mini-cards"><span><BookOpen size={14} /><b>8</b><small>modul aktif</small></span><span><Flame size={14} /><b>7</b><small>hari beruntun</small></span></div></div></div></div>
          <div className="floating-note note-bottom"><span className="mini-check"><Check size={14} /></span><span><strong>Challenge selesai</strong><small>CSS Layout Sprint</small></span></div>
          <span className="landing-spark spark-one">✦</span><span className="landing-spark spark-two">✦</span>
        </div>
      </section>

      <section className="landing-marquee" aria-label="Topik pembelajaran"><span>HTML & CSS</span><i>✦</i><span>JAVASCRIPT</span><i>✦</i><span>NEXT.JS</span><i>✦</i><span>DATABASE</span><i>✦</i><span>PORTOFOLIO</span></section>

      <section className="landing-section process-section" id="cara-kerja"><div className="section-intro"><p className="landing-eyebrow">CARA KERJA KODEKITA</p><h2>Ritme belajar yang<br /><em>terasa manusiawi.</em></h2><p>Tak perlu menunggu siap. Mulai dari satu konsep kecil, lihat hasilnya, lalu lanjutkan dengan rasa percaya diri yang baru.</p></div><div className="pillar-layout"><div className="pillar-tabs">{pillars.map((pillar, index) => { const Icon = pillar.icon; return <button key={pillar.label} className={activePillar === index ? "active" : ""} onClick={() => setActivePillar(index)}><span>0{index + 1}</span><Icon size={18} /><strong>{pillar.label}</strong><ArrowUpRight size={16} /></button>; })}</div><div className={`pillar-feature ${pillars[activePillar].accent}`}><div className="feature-orbit"><ActiveIcon size={28} /></div><p className="landing-eyebrow">0{activePillar + 1} / 03</p><h3>{pillars[activePillar].title}</h3><p>{pillars[activePillar].copy}</p><div className="feature-line"><span /><small>Geser untuk menjelajah</small></div></div></div></section>

      <section className="landing-section feature-section" id="fitur"><div className="feature-heading"><div><p className="landing-eyebrow">DIBUAT UNTUK PROSES NYATA</p><h2>Lebih sedikit teori.<br /><em>Lebih banyak jadi.</em></h2></div><p>Semua yang kamu butuhkan untuk bergerak dari “aku belum bisa” menuju “lihat, aku yang bikin”.</p></div><div className="feature-grid"><article className="feature-card feature-card-wide"><div><span className="card-index">01</span><h3>Jalur belajar yang<br /><em>tidak bikin tersesat.</em></h3><p>Materi tersusun dari fondasi sampai konsep yang lebih menantang, dengan progres yang selalu terlihat.</p></div><div className="path-preview"><div><span className="path-dot done"><Check size={11} /></span><b>Web Fundamentals</b><small>Selesai</small></div><div><span className="path-dot current">02</span><b>JavaScript Dasar</b><small>68% berjalan</small><i /></div><div><span className="path-dot locked">03</span><b>Frontend dengan Next.js</b><small>Terkunci</small></div></div></article><article className="feature-card challenge-preview"><span className="card-index">02</span><div className="challenge-sticker"><Zap size={17} fill="currentColor" /><span>+400 XP</span></div><h3>Tantangan yang<br /><em>memicu rasa ingin tahu.</em></h3><p>Uji pemahamanmu lewat challenge singkat yang terasa seperti membuat sesuatu, bukan mengerjakan soal.</p><button onClick={onStart}>Coba tantangan <ArrowRight size={15} /></button></article><article className="feature-card community-preview"><span className="card-index">03</span><div className="community-visual"><span>AR</span><span>NA</span><span>DS</span><div><Users size={16} /><b>2.4k</b><small>creator aktif</small></div></div><h3>Belajar sendiri,<br /><em>tumbuh bersama.</em></h3><p>Rayakan progres kecil dan temukan energi dari komunitas yang sedang membangun masa depan mereka.</p></article></div></section>

      <section className="landing-quote-section" id="cerita"><div className="quote-mark">“</div><blockquote>Awalnya aku cuma ingin paham cara kerja website. Sekarang aku punya proyek pertama yang bisa kutunjukkan.</blockquote><div className="quote-person"><span>NA</span><div><strong>Naya Anindita</strong><small>Siswa XI RPL · belajar 4 bulan</small></div></div><div className="quote-number">01 <span>/ 03</span></div></section>

      <section className="landing-cta"><div><p className="landing-eyebrow">TEMPAT IDE PERTAMAMU DIMULAI</p><h2>Siap membuat sesuatu<br /><em>yang milikmu?</em></h2></div><button className="landing-primary light" onClick={onStart}>Masuk ke KODEKITA <ArrowUpRight size={18} /></button><span className="cta-star">✦</span></section>
      <footer className="landing-footer"><span>© 2026 KODEKITA</span><span>Belajar · Bereksperimen · Berkarya</span><span>Ruang untuk tumbuh</span></footer>
    </main>
  );
}

function SettingsView({ studentName, email, role }: { studentName: string; email: string; role: "siswa" | "guru" }) {
  const [section, setSection] = useState("Profil");
  const [displayName, setDisplayName] = useState(studentName);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [challengeAlerts, setChallengeAlerts] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [saved, setSaved] = useState(false);

  function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return <div className="page-content settings-page"><div className="view-intro"><div><p className="eyebrow">PREFERENSI AKUN</p><h1>Pengaturan</h1><p className="view-subtitle">Atur ruang belajar supaya terasa lebih nyaman dan sesuai dengan ritmemu.</p></div><div className="settings-account"><div className="avatar">{getInitials(studentName)}</div><div><strong>{studentName}</strong><span>{role === "guru" ? "Akun guru" : "Akun siswa"}</span></div></div></div>
    <div className="settings-layout"><nav className="settings-tabs" aria-label="Bagian pengaturan">{["Profil", "Notifikasi", "Preferensi"].map((item) => <button key={item} className={section === item ? "selected" : ""} onClick={() => setSection(item)}>{item}<ChevronRight size={15} /></button>)}</nav>
      <form className="settings-panel" onSubmit={saveSettings}><div className="settings-panel-heading"><div><p className="eyebrow">{section.toUpperCase()}</p><h2>{section === "Profil" ? "Informasi akun" : section === "Notifikasi" ? "Tetap dapat kabar penting" : "Atur pengalaman belajar"}</h2></div>{saved && <span className="settings-saved"><Check size={14} /> Tersimpan</span>}</div>
        {section === "Profil" && <div className="settings-fields"><label>Nama tampilan<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label>Email sekolah<input value={email} type="email" readOnly /><small>Email terhubung dengan akun sekolahmu.</small></label><div className="settings-role"><span>Peran akun</span><strong>{role === "guru" ? "Guru" : "Siswa"}</strong><small>Peran ditentukan saat pendaftaran.</small></div></div>}
        {section === "Notifikasi" && <div className="settings-options"><label className="toggle-row"><span><strong>Ringkasan belajar</strong><small>Terima pengingat progres mingguan lewat email.</small></span><input type="checkbox" checked={emailUpdates} onChange={() => setEmailUpdates(!emailUpdates)} /><i /></label><label className="toggle-row"><span><strong>Challenge baru</strong><small>Dapatkan kabar saat tantangan baru tersedia.</small></span><input type="checkbox" checked={challengeAlerts} onChange={() => setChallengeAlerts(!challengeAlerts)} /><i /></label></div>}
        {section === "Preferensi" && <div className="settings-options"><label className="toggle-row"><span><strong>Tampilan ringkas</strong><small>Padatkan jarak antar materi agar lebih banyak terlihat.</small></span><input type="checkbox" checked={compactMode} onChange={() => setCompactMode(!compactMode)} /><i /></label><div className="settings-static-row"><span><strong>Bahasa antarmuka</strong><small>Bahasa Indonesia</small></span><ChevronRight size={16} /></div></div>}
        <div className="settings-actions"><button type="submit" className="login-button">Simpan perubahan <ArrowRight size={16} /></button></div>
      </form></div>
  </div>;
}

function HelpCenterView() {
  const [query, setQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState(0);
  const questions = [
    { question: "Bagaimana cara memulai jalur belajar?", answer: "Buka menu Jalur belajar, pilih materi yang tersedia, lalu ikuti setiap langkah sesuai urutan. Progresmu akan tersimpan otomatis." },
    { question: "Bagaimana cara mendapatkan XP?", answer: "XP didapat dari menyelesaikan materi, menjawab quick check, dan mengikuti tantangan coding di menu Tantangan." },
    { question: "Apakah progres belajar saya tersimpan?", answer: "Ya. Progres tersimpan pada akunmu setelah kamu masuk, sehingga bisa dilanjutkan kembali kapan saja." },
    { question: "Bagaimana cara mengubah data akun?", answer: "Buka menu Pengaturan, pilih Profil, ubah nama tampilan, lalu tekan Simpan perubahan." },
  ];
  const visibleQuestions = questions.filter((item) => item.question.toLowerCase().includes(query.toLowerCase()));

  return <div className="page-content help-page"><div className="help-hero"><div><p className="eyebrow">KAMI SIAP MEMBANTU</p><h1>Pusat bantuan</h1><p>Temukan jawaban cepat untuk pertanyaan seputar belajar, progres, dan akunmu.</p></div><div className="help-hero-icon"><CircleHelp size={31} /></div></div><div className="help-layout"><section className="faq-section"><div className="help-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari pertanyaan..." aria-label="Cari pertanyaan" /></div><div className="help-heading"><div><p className="eyebrow">PERTANYAAN UMUM</p><h2>Yang sering ditanyakan</h2></div><span>{visibleQuestions.length} artikel</span></div><div className="faq-list">{visibleQuestions.map((item) => { const questionIndex = questions.indexOf(item); const isOpen = openQuestion === questionIndex; return <article className={`faq-item ${isOpen ? "open" : ""}`} key={item.question}><button onClick={() => setOpenQuestion(isOpen ? -1 : questionIndex)}><span>{item.question}</span><ChevronRight size={17} /></button>{isOpen && <p>{item.answer}</p>}</article>; })}{visibleQuestions.length === 0 && <div className="help-empty"><CircleHelp size={21} /><strong>Pertanyaan belum ditemukan</strong><span>Coba gunakan kata kunci yang lebih umum.</span></div>}</div></section><aside className="help-contact"><div className="help-contact-icon"><Mail size={19} /></div><p className="eyebrow">MASIH BUTUH BANTUAN?</p><h2>Ngobrol dengan tim kami.</h2><p>Kirim pertanyaanmu dan kami akan membantu menemukan langkah berikutnya.</p><button onClick={() => window.location.href = "mailto:halo@kodekita.id"}>Hubungi kami <ArrowUpRight size={15} /></button><div className="help-contact-note"><Check size={13} /> Biasanya dibalas dalam 1 hari kerja</div></aside></div></div>;
}

type TeacherAchievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  tone: string;
  userBadges: { unlockedAt: string; student: { id: string; name: string; email: string } }[];
};

function TeacherAchievementsView({ teacherId }: { teacherId: string }) {
  const [achievements, setAchievements] = useState<TeacherAchievement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "Belajar", icon: "Award", tone: "purple" });
  const [saving, setSaving] = useState(false);
  const badgeIcons = { Code2, Flame, Zap, Target, Trophy, Award, BookOpen } as const;

  async function loadAchievements() {
    const response = await fetch(`/api/teacher/achievements?teacherId=${teacherId}`);
    if (!response.ok) return;
    const result = await response.json() as { badges: TeacherAchievement[] };
    setAchievements(result.badges);
    setSelectedId((current) => current ?? result.badges[0]?.id ?? null);
  }

  useEffect(() => { if (teacherId) void loadAchievements(); }, [teacherId]);

  async function createAchievement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const response = await fetch("/api/teacher/achievements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId, ...form }) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) { await Swal.fire({ title: "Belum tersimpan", text: result.message, icon: "error", confirmButtonText: "Mengerti" }); return; }
    setForm({ title: "", description: "", category: "Belajar", icon: "Award", tone: "purple" });
    await loadAchievements();
    await Swal.fire({ title: "Pencapaian ditambahkan", text: "Pencapaian baru siap digunakan siswa.", icon: "success", timer: 1500, showConfirmButton: false });
  }

  const selected = achievements.find((achievement) => achievement.id === selectedId);
  return <div className="page-content teacher-achievements-page"><div className="view-intro"><div><p className="eyebrow">WORKSPACE GURU</p><h1>Pencapaian siswa</h1><p className="view-subtitle">Buat pencapaian baru dan lihat siswa yang sudah berhasil mendapatkannya.</p></div><div className="teacher-badge"><Trophy size={16} /> {achievements.length} pencapaian</div></div>
    <div className="teacher-achievement-layout"><form className="creator-card achievement-creator" onSubmit={createAchievement}><div className="creator-heading"><div className="creator-icon orange"><Award size={19} /></div><div><p className="eyebrow">KOLEKSI KELAS</p><h2>Tambah pencapaian</h2></div></div><label>Judul pencapaian<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: CSS champion" required /></label><label>Deskripsi<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Syarat atau cerita di balik pencapaian" rows={4} required /></label><div className="creator-row"><label>Kategori<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Belajar</option><option>Konsistensi</option><option>Skill</option><option>Challenge</option></select></label><label>Warna<select value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })}><option value="purple">Ungu</option><option value="blue">Biru</option><option value="green">Hijau</option><option value="orange">Oranye</option><option value="yellow">Kuning</option></select></label></div><label>Ikon<select value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}><option value="Award">Award</option><option value="Trophy">Trophy</option><option value="Flame">Flame</option><option value="Target">Target</option><option value="Code2">Code</option><option value="BookOpen">Book</option></select></label><button className="login-button" disabled={saving}>{saving ? "Menyimpan..." : "Tambah pencapaian"}<ArrowRight size={16} /></button></form>
      <section className="teacher-achievement-content"><div className="list-heading"><div><p className="eyebrow">SEMUA PENCAPAIAN</p><h2>Koleksi pencapaian kelas</h2></div><span>{achievements.length} total</span></div><div className="teacher-achievement-grid">{achievements.map((achievement) => { const Icon = badgeIcons[achievement.icon as keyof typeof badgeIcons] ?? Award; return <button type="button" className={`teacher-achievement-card ${achievement.id === selectedId ? "selected" : ""}`} key={achievement.id} onClick={() => setSelectedId(achievement.id)}><div className={`achievement-icon ${achievement.tone}`}><Icon size={22} /></div><div><span className="achievement-category">{achievement.category}</span><h3>{achievement.title}</h3><p>{achievement.description}</p></div><strong>{achievement.userBadges.length}<small>siswa</small></strong></button>; })}</div></section>
    </div>
    <section className="achievement-recipients"><div className="list-heading"><div><p className="eyebrow">PENERIMA PENCAPAIAN</p><h2>{selected ? selected.title : "Pilih pencapaian"}</h2></div><span>{selected?.userBadges.length ?? 0} siswa</span></div>{selected?.userBadges.length ? <div className="recipient-grid">{selected.userBadges.map((userBadge) => <div className="recipient-card" key={userBadge.student.id}><div className="avatar">{getInitials(userBadge.student.name)}</div><div><strong>{userBadge.student.name}</strong><span>{userBadge.student.email}</span></div><small>{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(userBadge.unlockedAt))}</small></div>)}</div> : <div className="achievement-recipient-empty"><Users size={22} /><strong>Belum ada siswa yang mendapat pencapaian ini.</strong><span>Siswa akan muncul di sini setelah syarat pencapaian terpenuhi.</span></div>}</section>
  </div>;
}

function AchievementsView({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [filter, setFilter] = useState("Semua");
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState<DashboardBadge[]>([]);
  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/learning/dashboard?studentId=${studentId}`).then((response) => response.ok ? response.json() : null).then((result: { currentStreak?: number; xp?: number; badges?: DashboardBadge[] } | null) => {
      if (!result) return;
      setStreak(result.currentStreak ?? 0);
      setXp(result.xp ?? 0);
      setAchievements(result.badges ?? []);
    });
  }, [studentId]);
  const visibleAchievements = achievements.filter((item) => filter === "Semua" || (filter === "Terbuka" ? item.unlocked : !item.unlocked));
  const firstName = getFirstName(studentName);
  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const badgeIcons = { Code2, Flame, Zap, Target, Trophy, Award, BookOpen } as const;
  const level = Math.floor(xp / 200) + 1;
  const nextLevelXp = level * 200;
  const levelProgress = Math.min(100, Math.round(((xp - (level - 1) * 200) / 200) * 100));

  return <div className="page-content achievements-page">
    <div className="view-intro achievements-intro"><div><p className="eyebrow">KOLEKSI PROGRES</p><h1>Pencapaianmu, {firstName}.</h1><p className="view-subtitle">Setiap lencana adalah bukti kecil bahwa kamu terus datang, mencoba, dan berkembang.</p></div><div className="achievement-total"><div className="achievement-ring"><strong>{unlockedCount}</strong><span>/ {achievements.length}</span></div><div><strong>Lencana terbuka</strong><span>Terus kumpulkan semuanya</span></div></div></div>
    <section className="achievement-summary"><div className="achievement-level"><div className="level-top"><span>LEVEL {String(level).padStart(2, "0")}</span><strong>{xp.toLocaleString("id-ID")} <small>XP</small></strong></div><h2>Builder in progress <span>✦</span></h2><p>{Math.max(0, nextLevelXp - xp).toLocaleString("id-ID")} XP lagi untuk mencapai Level {String(level + 1).padStart(2, "0")}</p><div className="level-track"><i style={{ width: `${levelProgress}%` }} /></div><div className="level-foot"><span>Level {String(level).padStart(2, "0")}</span><span>{nextLevelXp.toLocaleString("id-ID")} XP</span></div></div><div className="achievement-stat"><div className="achievement-stat-icon orange"><Flame size={19} /></div><strong>{streak} hari</strong><span>streak belajar</span><small>Tersimpan di database</small></div><div className="achievement-stat"><div className="achievement-stat-icon yellow"><Zap size={19} /></div><strong>{xp.toLocaleString("id-ID")}</strong><span>total XP</span><small>Tersimpan di database</small></div></section>
    <div className="achievement-toolbar"><div><p className="eyebrow">SEMUA PENCAPAIAN</p><h2>Lencana yang kamu kumpulkan</h2></div><div className="filter-tabs">{["Semua", "Terbuka", "Terkunci"].map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
    <div className="achievement-grid">{visibleAchievements.map((item) => { const Icon = badgeIcons[item.icon as keyof typeof badgeIcons] ?? Award; return <article className={`achievement-card ${item.unlocked ? "unlocked" : "locked"}`} key={item.code}><div className={`achievement-icon ${item.tone}`}>{item.unlocked ? <Icon size={25} /> : <LockKeyhole size={21} />}</div><div className="achievement-card-copy"><span className="achievement-category">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p></div><div className="achievement-date">{item.unlocked && <Check size={13} />}{item.unlockedAt ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.unlockedAt)) : "Belum terbuka"}</div></article>; })}</div>
    <section className="next-achievement"><div className="next-achievement-icon"><Target size={20} /></div><div><p className="eyebrow">PENCAPAIAN BERIKUTNYA</p><h2>{achievements.find((item) => !item.unlocked)?.title ?? "Semua lencana terbuka"}</h2><p>{achievements.find((item) => !item.unlocked)?.description ?? "Kamu sudah membuka semua lencana yang tersedia."}</p></div><div className="next-progress"><strong>{unlockedCount} <small>/ {achievements.length}</small></strong><div><i style={{ width: `${achievements.length ? (unlockedCount / achievements.length) * 100 : 0}%` }} /></div></div></section>
  </div>;
}

function LeaderboardView({ studentId, studentName, isTeacher = false }: { studentId: string; studentName: string; isTeacher?: boolean }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [period, setPeriod] = useState("Semua Waktu");

  useEffect(() => {
    if (!studentId) return;
    fetch(isTeacher ? `/api/teacher/leaderboard?teacherId=${studentId}` : `/api/learning/dashboard?studentId=${studentId}`).then((response) => response.ok ? response.json() : null).then((result: { leaderboard?: LeaderboardEntry[]; currentRank?: number | null } | null) => {
      if (!result) return;
      setLeaderboard(result.leaderboard ?? []);
      setCurrentRank(result.currentRank ?? null);
    });
  }, [studentId]);

  const currentEntry = leaderboard.find((entry) => entry.isCurrent);
  const currentXp = currentEntry?.xp ?? 0;
  const level = Math.floor(currentXp / 200) + 1;
  const levelProgress = Math.round(((currentXp % 200) / 200) * 100);
  const podium = leaderboard.slice(0, 3);
  const podiumByRank = [podium[1], podium[0], podium[2]].filter(Boolean);
  const listEntries = leaderboard.slice(3);
  const periods = ["Mingguan", "Bulanan", "Semua Waktu"];

  return <div className="page-content leaderboard-page">
    <div className="leaderboard-hero">
      <div className="leaderboard-hero-copy">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="leaderboard-kicker"><Sparkles size={15} /> {isTeacher ? "MONITORING KELAS" : "KOMPETISI AKTIF"} <span /></motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>{isTeacher ? "Leaderboard Siswa" : "Leaderboard Siswa"}</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .16 }}>{isTeacher ? "Pantau peringkat XP dan perkembangan siswa di kelasmu." : "Naik peringkat, kumpulkan XP, dan jadilah inspirasi untuk kelasmu."}</motion.p>
      </div>
      <motion.div className="rank-summary-card" initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .18 }}>
        <div className="rank-summary-icon"><Trophy size={18} /></div>
        <div><span>{isTeacher ? "TOTAL SISWA" : "POSISI KAMU"}</span><strong>{isTeacher ? leaderboard.length : `#${currentRank ?? "—"}`}</strong></div>
        <div className="rank-summary-progress"><div><span>Menuju level {level + 1}</span><b>{levelProgress}%</b></div><i><em style={{ width: `${levelProgress}%` }} /></i></div>
      </motion.div>
    </div>

    <div className="leaderboard-toolbar">
      <div className="leaderboard-tabs" role="tablist" aria-label="Periode leaderboard">
        {periods.map((item) => <button key={item} role="tab" aria-selected={period === item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>{period === item && <motion.i layoutId="leaderboard-tab-pill" />}{item}</button>)}
      </div>
      <span className="leaderboard-updated"><span /> Diperbarui hari ini</span>
    </div>

    <section className="podium-section">
      <div className="leaderboard-section-heading"><div><p className="eyebrow">RANKING SISWA</p><h2>Siapa yang memimpin?</h2></div><div className="heading-spark"><Flame size={17} /> XP race</div></div>
      <div className="podium-grid">
        {podiumByRank.map((entry, index) => {
          const place = entry.rank;
          const isWinner = place === 1;
          const Icon = isWinner ? Crown : Medal;
          return <motion.article key={entry.id} className={`podium-card podium-${place} ${entry.isCurrent ? "current" : ""}`} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .14 + index * .1 }} whileHover={{ y: -8, rotate: isWinner ? 0 : place === 2 ? -1 : 1 }}>
            <div className="podium-rank"><Icon size={isWinner ? 21 : 18} /> <span>#{place}</span></div>
            <div className="podium-avatar-wrap"><div className="podium-avatar">{getInitials(entry.name)}</div><small>LVL {Math.floor(entry.xp / 200) + 1}</small></div>
            <strong>{entry.name}</strong>{entry.isCurrent && <span className="you-badge">KAMU</span>}<b title={`${entry.xp.toLocaleString("id-ID")} experience points`}>{entry.xp.toLocaleString("id-ID")} <small>XP</small></b>
          </motion.article>;
        })}
      </div>
    </section>

    <section className="student-ranking-section">
      <div className="leaderboard-section-heading"><div><p className="eyebrow">PEMAIN LAINNYA</p><h2>Terus kejar posisi berikutnya</h2></div><span className="student-count">{leaderboard.length} siswa aktif</span></div>
      <div className="student-ranking-list">
        {listEntries.map((entry, index) => {
          const rowLevel = Math.floor(entry.xp / 200) + 1;
          const rowProgress = Math.round(((entry.xp % 200) / 200) * 100);
          const isRising = index % 3 !== 1;
          return <motion.article key={entry.id} className={`student-ranking-row ${entry.isCurrent ? "current" : ""}`} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .24 + index * .05 }} whileHover={{ scale: 1.012 }}>
            <div className="student-rank-badge"><strong>#{entry.rank}</strong>{isRising && <TrendingUp size={13} />}</div>
            <div className="student-avatar-ring"><div>{getInitials(entry.name)}</div></div>
            <div className="student-identity"><div><strong>{entry.name}</strong>{entry.isCurrent && <span className="you-badge">KAMU</span>}</div><span>XI RPL <i>Level {String(rowLevel).padStart(2, "0")}</i></span></div>
            <div className="student-xp-track"><div><span>Progress level berikutnya</span><b>{rowProgress}%</b></div><i><em style={{ width: `${rowProgress}%` }} /></i></div>
            <strong className="student-xp" title="Total experience points">{entry.xp.toLocaleString("id-ID")} <small>XP</small><Sparkles size={14} /></strong>
          </motion.article>;
        })}
        {listEntries.length === 0 && <div className="leaderboard-empty"><Target size={22} /><strong>Belum ada siswa lain di ranking.</strong><span>Jadilah yang pertama mengumpulkan XP.</span></div>}
      </div>
    </section>
    <p className="leaderboard-footer-note"><Target size={14} /> Halo {getFirstName(studentName)}, konsistensi kecil hari ini bisa mengubah peringkatmu besok.</p>
  </div>;
}

type TeacherPath = { id: string; title: string; description: string; category: string; level: string };
type ChallengeQuestion = { prompt: string; options: string[]; answer: string };
type TeacherChallenge = { id: string; title: string; description: string; category: string; level: string; xp: number; minutes: number; mode?: "coding" | "pemahaman"; questions?: ChallengeQuestion[] };
type MaterialRecord = { id: string; title: string; description: string; fileName: string; fileUrl: string; questions: { id: string; prompt: string; options: unknown }[]; reads?: { readAt: string }[]; _count?: { reads: number } };
type MonitoredStudent = { id: string; name: string; email: string; readCount: number; answeredCount: number; correctCount: number };

function TeacherLearningPathsView({ teacherId }: { teacherId: string }) {
  const [paths, setPaths] = useState<(TeacherPath & { materials: MaterialRecord[] })[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoredStudent[]>([]);
  const [selectedPathId, setSelectedPathId] = useState("");
  const [pathForm, setPathForm] = useState({ title: "", description: "", category: "Frontend", level: "Pemula" });
  const [materialForm, setMaterialForm] = useState({ title: "", description: "", questionPrompt: "", questionOptions: "", answer: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadContent() {
    const response = await fetch(`/api/teacher/paths?teacherId=${teacherId}`);
    if (!response.ok) return;
    const result = await response.json();
    setPaths(result.paths);
    setMonitoring(result.monitoring);
    if (!selectedPathId && result.paths[0]) setSelectedPathId(result.paths[0].id);
  }

  useEffect(() => { if (!teacherId) return; fetch(`/api/teacher/paths?teacherId=${teacherId}`).then((response) => response.ok ? response.json() : null).then((result) => { if (!result) return; setPaths(result.paths); setMonitoring(result.monitoring); if (!selectedPathId && result.paths[0]) setSelectedPathId(result.paths[0].id); }); }, [teacherId, selectedPathId]);

  async function createPath(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const response = await fetch("/api/teacher/paths", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId, ...pathForm }) });
    setSaving(false);
    if (!response.ok) { const result = await response.json(); await Swal.fire({ title: "Belum tersimpan", text: result.message, icon: "error", confirmButtonText: "Mengerti" }); return; }
    setPathForm({ title: "", description: "", category: "Frontend", level: "Pemula" }); await loadContent();
  }

  async function createMaterial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPathId || !file) return;
    setSaving(true);
    const form = new FormData();
    Object.entries(materialForm).forEach(([key, value]) => form.append(key, value));
    form.append("teacherId", teacherId); form.append("file", file);
    const response = await fetch(`/api/teacher/paths/${selectedPathId}/materials`, { method: "POST", body: form });
    const result = await response.json(); setSaving(false);
    if (!response.ok) { await Swal.fire({ title: "Belum tersimpan", text: result.message, icon: "error", confirmButtonText: "Mengerti" }); return; }
    setMaterialForm({ title: "", description: "", questionPrompt: "", questionOptions: "", answer: "" }); setFile(null); await loadContent();
    await Swal.fire({ title: "Materi diterbitkan", text: "File dan pertanyaan sudah tersedia untuk siswa.", icon: "success", timer: 1500, showConfirmButton: false });
  }

  const selectedPath = paths.find((path) => path.id === selectedPathId);
  return <div className="page-content teacher-page"><div className="view-intro"><div><p className="eyebrow">WORKSPACE GURU</p><h1>Jalur belajar</h1><p className="view-subtitle">Unggah materi, uji pemahaman, dan lihat siswa yang sudah mengikuti setiap langkah.</p></div><div className="teacher-badge"><Users size={16} /> Pantauan kelas</div></div>
    <div className="teacher-layout material-layout"><form className="creator-card" onSubmit={createPath}><div className="creator-heading"><div className="creator-icon green"><BookOpen size={19} /></div><div><p className="eyebrow">KURIKULUM</p><h2>Buat jalur baru</h2></div></div><label>Judul jalur<input value={pathForm.title} onChange={(event) => setPathForm({ ...pathForm, title: event.target.value })} placeholder="Contoh: React untuk pemula" required /></label><label>Deskripsi<textarea value={pathForm.description} onChange={(event) => setPathForm({ ...pathForm, description: event.target.value })} placeholder="Apa yang akan siswa pelajari?" rows={3} required /></label><div className="creator-row"><label>Kategori<select value={pathForm.category} onChange={(event) => setPathForm({ ...pathForm, category: event.target.value })}><option>Frontend</option><option>Backend</option><option>UI/UX</option></select></label><label>Level<select value={pathForm.level} onChange={(event) => setPathForm({ ...pathForm, level: event.target.value })}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></label></div><button className="login-button" disabled={saving}>Simpan jalur <ArrowRight size={16} /></button></form>
      <section className="teacher-content-list"><div className="list-heading"><div><p className="eyebrow">JALUR AKTIF</p><h2>Pilih jalur untuk diisi</h2></div><span>{paths.length} jalur</span></div>{paths.length === 0 ? <div className="empty-teacher"><BookOpen size={22} /><strong>Belum ada jalur belajar</strong><span>Buat jalur pertama di panel sebelah.</span></div> : <div className="path-picker">{paths.map((path) => <button type="button" className={`path-picker-item ${selectedPathId === path.id ? "selected" : ""}`} key={path.id} onClick={() => setSelectedPathId(path.id)}><span>{path.category} · {path.level}</span><strong>{path.title}</strong><small>{path.materials.length} materi tersedia</small></button>)}</div>}
        {selectedPath && <form className="creator-card material-form" onSubmit={createMaterial}><div className="creator-heading"><div className="creator-icon orange"><FileUp size={19} /></div><div><p className="eyebrow">MATERI UNTUK {selectedPath.title.toUpperCase()}</p><h2>Upload materi + kuis</h2></div></div><label>Judul materi<input value={materialForm.title} onChange={(event) => setMaterialForm({ ...materialForm, title: event.target.value })} placeholder="Contoh: Flexbox dan Grid" required /></label><label>Ringkasan<textarea value={materialForm.description} onChange={(event) => setMaterialForm({ ...materialForm, description: event.target.value })} placeholder="Ringkasan singkat materi" rows={2} required /></label><label className="file-input-label">File materi<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /><small>{file ? file.name : "PDF, dokumen, gambar, atau ZIP · maksimal 10 MB"}</small></label><label>Pertanyaan pemahaman<input value={materialForm.questionPrompt} onChange={(event) => setMaterialForm({ ...materialForm, questionPrompt: event.target.value })} placeholder="Apa fungsi display: grid?" required /></label><label>Pilihan jawaban<textarea value={materialForm.questionOptions} onChange={(event) => setMaterialForm({ ...materialForm, questionOptions: event.target.value })} placeholder={"Satu pilihan per baris\nMenyusun layout dua dimensi\nMengubah warna teks"} rows={3} required /></label><label>Jawaban benar<input value={materialForm.answer} onChange={(event) => setMaterialForm({ ...materialForm, answer: event.target.value })} placeholder="Harus sama persis dengan pilihan" required /></label><button className="login-button" disabled={saving}>{saving ? "Mengunggah..." : "Terbitkan materi"}<ArrowRight size={16} /></button></form>}</section></div>
    <section className="monitor-card"><div className="list-heading"><div><p className="eyebrow">MONITORING SISWA</p><h2>Siapa yang sudah belajar?</h2></div><span><Users size={14} /> {monitoring.length} siswa</span></div>{monitoring.length === 0 ? <p className="monitor-empty">Belum ada akun siswa yang terdaftar.</p> : <div className="monitor-table">{monitoring.map((student) => <div className="monitor-row" key={student.id}><div className="avatar">{getInitials(student.name)}</div><div><strong>{student.name}</strong><span>{student.email}</span></div><span className={student.readCount ? "status-done" : "status-pending"}>{student.readCount ? `${student.readCount} materi dibaca` : "Belum membaca"}</span><span className={student.answeredCount ? "status-done" : "status-pending"}>{student.answeredCount ? `${student.correctCount}/${student.answeredCount} benar` : "Belum menjawab"}</span></div>)}</div>}</section>
  </div>;
}

function StudentLearningPathView({ studentId }: { studentId: string }) {
  const [paths, setPaths] = useState<(TeacherPath & { materials: MaterialRecord[] })[]>([]);
  const [answers, setAnswers] = useState<Record<string, { answer: string; isCorrect: boolean }>>({});
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [expandedMaterials, setExpandedMaterials] = useState<string[]>([]);

  useEffect(() => { if (!studentId) return; fetch(`/api/learning/paths?studentId=${studentId}`).then((response) => response.ok ? response.json() : null).then((result) => { if (!result) return; setPaths(result.paths); setAnswers(Object.fromEntries(result.answers.map((answer: { questionId: string; answer: string; isCorrect: boolean }) => [answer.questionId, { answer: answer.answer, isCorrect: answer.isCorrect }]))); }); }, [studentId]);

  async function markMaterialRead(materialId: string) {
    const response = await fetch("/api/learning/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, materialId }) });
    if (!response.ok) return;
    setPaths((currentPaths) => currentPaths.map((path) => ({ ...path, materials: path.materials.map((material) => material.id === materialId ? { ...material, reads: [{ readAt: new Date().toISOString() }] } : material) })));
  }

  async function submitAnswer(materialId: string, questionId: string, answer: string) { const response = await fetch("/api/learning/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, materialId, questionId, answer }) }); const result = await response.json(); if (response.ok) setAnswers((current) => ({ ...current, [questionId]: { answer, isCorrect: result.isCorrect } })); }

  const categories = ["Semua", ...Array.from(new Set(paths.map((path) => path.category)))];
  const visiblePaths = activeCategory === "Semua" ? paths : paths.filter((path) => path.category === activeCategory);
  const allMaterials = paths.flatMap((path) => path.materials);
  const completedMaterials = allMaterials.filter((material) => material.reads?.length).length;
  const overallProgress = allMaterials.length ? Math.round((completedMaterials / allMaterials.length) * 100) : 0;
  const toggleMaterial = (materialId: string) => setExpandedMaterials((current) => current.includes(materialId) ? current.filter((id) => id !== materialId) : [...current, materialId]);

  return <div className="page-content learning-page student-learning-page"><div className="view-intro learning-intro"><div><p className="eyebrow">KURIKULUM TERSTRUKTUR</p><h1>Jalur belajar</h1><p className="view-subtitle">Pilih jalur yang ingin kamu jelajahi, lalu lanjutkan dari materi terakhir yang kamu buka.</p></div><div className="path-overview learning-progress-overview"><div className="path-ring" style={{ background: `conic-gradient(var(--green) ${overallProgress}%, #e8eee5 0)` }}><div><strong>{overallProgress}</strong><span>%</span></div></div><div><strong>{completedMaterials} dari {allMaterials.length} materi</strong><span>Progres belajarmu</span></div></div></div><section className="learning-hero"><div className="learning-hero-icon"><Sparkles size={21} /></div><div><p className="eyebrow">LANGKAH BERIKUTNYA</p><h2>{allMaterials.length && completedMaterials < allMaterials.length ? "Sedikit lagi, lanjutkan ritmemu." : "Mulai perjalanan belajarmu."}</h2><p>{completedMaterials ? `Kamu sudah membuka ${completedMaterials} materi. Pilih satu materi berikutnya untuk melanjutkan.` : "Buka materi pertama untuk mendapatkan ritme belajar yang nyaman."}</p></div><div className="learning-hero-stat"><strong>{paths.length}</strong><span>jalur tersedia</span></div></section><div className="learning-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter kategori jalur belajar">{categories.map((category) => <button key={category} className={activeCategory === category ? "selected" : ""} onClick={() => setActiveCategory(category)} role="tab" aria-selected={activeCategory === category}>{category}</button>)}</div><span className="path-note"><Target size={15} /> {completedMaterials ? `${overallProgress}% perjalanan selesai` : "Siap mulai belajar?"}</span></div>{visiblePaths.length === 0 ? <div className="empty-teacher"><BookOpen size={22} /><strong>Belum ada materi</strong><span>Guru belum menerbitkan jalur belajar.</span></div> : <div className="student-path-list">{visiblePaths.map((path, pathIndex) => { const readCount = path.materials.filter((material) => material.reads?.length).length; const pathProgress = path.materials.length ? Math.round((readCount / path.materials.length) * 100) : 0; return <section className={`student-path student-path-color-${pathIndex % 4}`} key={path.id}><div className="student-path-heading"><div><span className="path-state">{path.category} · {path.level}</span><h2>{path.title}</h2><p>{path.description}</p></div><div className="path-section-progress"><strong>{pathProgress}%</strong><span>{readCount}/{path.materials.length} materi</span><div><i style={{ width: `${pathProgress}%` }} /></div></div></div>{path.materials.length === 0 ? <p className="monitor-empty">Materi sedang disiapkan guru.</p> : <div className="material-stack">{path.materials.map((material, materialIndex) => { const question = material.questions[0]; const hasBeenRead = Boolean(material.reads?.length); const current = question ? answers[question.id] : undefined; const isExpanded = expandedMaterials.includes(material.id); return <article className={`material-card ${isExpanded ? "expanded" : ""}`} key={material.id}><button type="button" className="material-card-toggle" onClick={() => toggleMaterial(material.id)} aria-expanded={isExpanded}><span className="material-step">{hasBeenRead ? <Check size={15} /> : String(materialIndex + 1).padStart(2, "0")}</span><span className="material-card-heading"><span className="path-state">{hasBeenRead ? "SUDAH DIBACA" : "MATERI BERIKUTNYA"}</span><strong>{material.title}</strong><small>{material.description}</small></span><span className="material-toggle-icon"><ChevronRight size={18} /></span></button>{isExpanded && <div className="material-card-body"><div className="material-card-actions"><span><Clock3 size={14} /> Belajar sesuai ritmemu</span><a href={material.fileUrl} target="_blank" rel="noreferrer" onClick={() => void markMaterialRead(material.id)}><FileUp size={15} /> Buka file</a></div>{question && (hasBeenRead ? <div className="question-check"><p><strong>Cek pemahaman:</strong> {question.prompt}</p><div className="answer-list">{(Array.isArray(question.options) ? question.options : []).map((option) => <button type="button" key={String(option)} className={current?.answer === String(option) ? (current.isCorrect ? "correct" : "incorrect") : ""} onClick={() => void submitAnswer(material.id, question.id, String(option))}>{String(option)}{current?.answer === String(option) && (current.isCorrect ? <Check size={15} /> : <X size={15} />)}</button>)}</div>{current && <small className={current.isCorrect ? "feedback success" : "feedback"}>{current.isCorrect ? "Jawaban tersimpan dan benar." : "Jawaban tersimpan. Coba pelajari kembali materinya."}</small>}</div> : <p className="material-locked-note"><LockKeyhole size={14} /> Buka file materi terlebih dahulu untuk melihat pertanyaan.</p>)}</div>}</article>; })}</div>}</section>; })}</div>}</div>;
}

// Kept as a rollback reference while the database-backed view is exercised.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StudentLearningPathViewLegacy({ studentId }: { studentId: string }) {
  const [paths, setPaths] = useState<(TeacherPath & { materials: MaterialRecord[] })[]>([]);
  const [answers, setAnswers] = useState<Record<string, { answer: string; isCorrect: boolean }>>({});
  useEffect(() => { if (!studentId) return; fetch(`/api/learning/paths?studentId=${studentId}`).then((response) => response.ok ? response.json() : null).then((result) => { if (!result) return; setPaths(result.paths); setAnswers(Object.fromEntries(result.answers.map((answer: { questionId: string; answer: string; isCorrect: boolean }) => [answer.questionId, { answer: answer.answer, isCorrect: answer.isCorrect }]))); }); }, [studentId]);
  async function markMaterialRead(materialId: string) {
    const response = await fetch("/api/learning/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, materialId }) });
    if (!response.ok) return;
    setPaths((currentPaths) => currentPaths.map((path) => ({ ...path, materials: path.materials.map((material) => material.id === materialId ? { ...material, reads: [{ readAt: new Date().toISOString() }] } : material) })));
  }
  async function submitAnswer(materialId: string, questionId: string, answer: string) { const response = await fetch("/api/learning/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, materialId, questionId, answer }) }); const result = await response.json(); if (response.ok) setAnswers((current) => ({ ...current, [questionId]: { answer, isCorrect: result.isCorrect } })); }
  return <div className="page-content learning-page"><div className="view-intro"><div><p className="eyebrow">KURIKULUM TERSTRUKTUR</p><h1>Jalur belajar</h1><p className="view-subtitle">Baca materi, buka file pendukung, lalu jawab pertanyaan singkat untuk mengunci pemahamanmu.</p></div><div className="path-overview"><div className="path-ring"><strong>{paths.reduce((sum, path) => sum + path.materials.length, 0)}</strong><span>materi</span></div><div><strong>Materi tersedia</strong><span>Belajar sesuai ritmemu</span></div></div></div>{paths.length === 0 ? <div className="empty-teacher"><BookOpen size={22} /><strong>Belum ada materi</strong><span>Guru belum menerbitkan jalur belajar.</span></div> : <div className="student-path-list">{paths.map((path) => <section className="student-path" key={path.id}><div className="student-path-heading"><div><span className="path-state">{path.category} · {path.level}</span><h2>{path.title}</h2><p>{path.description}</p></div><span className="material-count">{path.materials.length} materi</span></div>{path.materials.length === 0 ? <p className="monitor-empty">Materi sedang disiapkan guru.</p> : path.materials.map((material) => { const question = material.questions[0]; const hasBeenRead = Boolean(material.reads?.length); const current = question ? answers[question.id] : undefined; return <article className="material-card" key={material.id}><div className="material-card-heading"><div><span className="path-state">MATERI</span><h3>{material.title}</h3><p>{material.description}</p></div><a href={material.fileUrl} target="_blank" rel="noreferrer" onClick={() => void markMaterialRead(material.id)}><FileUp size={15} /> Buka file</a></div>{hasBeenRead && question && <div className="question-check"><p><strong>Cek pemahaman:</strong> {question.prompt}</p><div className="answer-list">{(Array.isArray(question.options) ? question.options : []).map((option) => <button type="button" key={String(option)} className={current?.answer === String(option) ? "correct" : ""} onClick={() => submitAnswer(material.id, question.id, String(option))}>{String(option)}{current?.answer === String(option) && <Check size={15} />}</button>)}</div>{current && <small className={current.isCorrect ? "feedback success" : "feedback"}>{current.isCorrect ? "Jawaban tersimpan dan benar." : "Jawaban tersimpan. Coba pelajari kembali materinya."}</small>}</div>}{!hasBeenRead && question && <p className="monitor-empty">Buka file materi terlebih dahulu untuk melihat pertanyaan.</p>}</article>; })}</section>)}</div>}</div>;
}

type ChallengeBrief = { goal: string; tasks: string[]; deliverable: string };

function getChallengeBrief(challenge: TeacherChallenge): ChallengeBrief {
  if (challenge.title === "Landing page responsif") return {
    goal: "Membuat landing page profil yang tetap nyaman dibaca di berbagai ukuran layar.",
    tasks: ["Buat struktur hero, fitur, dan tombol ajakan menggunakan HTML semantik.", "Gunakan CSS Grid atau Flexbox untuk menyusun layout.", "Tambahkan satu breakpoint untuk tampilan ponsel."],
    deliverable: "Satu halaman HTML dan CSS yang responsif.",
  };
  if (challenge.title === "Flexbox layout sprint") return {
    goal: "Soal: Buat layout tiga kartu fitur dengan Flexbox yang rapi di desktop dan tetap nyaman dibaca di layar ponsel.",
    tasks: ["Buat tiga kartu fitur dengan judul, deskripsi, dan tombol aksi.", "Gunakan display: flex, gap, align-items, dan justify-content untuk mengatur layout.", "Tambahkan flex-wrap atau media query agar kartu tersusun satu kolom di layar kecil.", "Uji hasilnya di panel Output dengan ukuran layar yang berbeda."],
    deliverable: "Komponen tiga kartu fitur responsif tanpa mengandalkan margin manual.",
  };
  if (challenge.title.toLowerCase().includes("interaksi") || challenge.title.toLowerCase().includes("tombol")) return {
    goal: "Membuat halaman sederhana yang merespons aksi pengguna.",
    tasks: ["Buat tombol dengan label yang jelas.", "Ubah teks status ketika tombol diklik.", "Tambahkan class atau style baru untuk menunjukkan perubahan."],
    deliverable: "Halaman HTML, CSS, dan JavaScript dengan tombol interaktif.",
  };
  return {
    goal: challenge.description,
    tasks: ["Baca brief dan pecah pekerjaan menjadi langkah-langkah kecil.", "Buat solusi menggunakan teknologi sesuai kategori challenge.", "Uji hasilnya sebelum menandai challenge selesai."],
    deliverable: "Hasil kerja yang bisa ditunjukkan dan dijelaskan kembali.",
  };
}

function buildChallengePreview(code: string, challenge: TeacherChallenge) {
  if (!code.trim()) return "";
  const runtime = `<script>function showPreviewError(message, line) { var box = document.createElement("div"); box.id = "preview-error"; box.style.cssText = "margin:16px;padding:12px;border:1px solid #efb5a1;border-radius:8px;background:#fff0eb;color:#a44832;font:12px/1.5 system-ui;white-space:pre-wrap"; box.textContent = "Error: " + message + (line ? "\\nBaris: " + line : ""); document.body.replaceChildren(box); } window.addEventListener("error", function(event) { showPreviewError(event.message || "Terjadi error pada preview.", event.lineno || 0); }); window.addEventListener("unhandledrejection", function(event) { showPreviewError(String(event.reason || "Promise gagal dijalankan."), 0); });</script>`;
  if (/<(html|body|button|div|section|style|script)\b/i.test(code)) return `${runtime}${code}`;
  if (challenge.category === "CSS") return `<style>body{font-family:system-ui;padding:24px;background:#f6f8f3} ${code}</style><div class="preview-card">Preview CSS kamu</div>${runtime}`;
  return `${runtime}<main style="font-family:system-ui;padding:24px;background:#f6f8f3;min-height:100vh"><button id="demo-button" style="padding:10px 14px;border:0;border-radius:7px;background:#1b6b54;color:white;cursor:pointer">Klik tombol</button><p id="demo-output">Output akan muncul di sini.</p></main><script>${code}</script>`;
}

function getChallengeSolution(challenge: TeacherChallenge) {
  if (challenge.title.toLowerCase().includes("landing") || challenge.title.toLowerCase().includes("responsif")) return `<header class="site-header">
  <a class="brand" href="#">KODEKITA</a>
  <nav aria-label="Navigasi utama"><a href="#fitur">Fitur</a><a href="#mulai">Mulai</a></nav>
</header>

<main>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="eyebrow">BELAJAR DAN BERKARYA</p>
      <h1 id="hero-title">Bangun ide pertamamu.</h1>
      <p>Ruang belajar coding untuk mengubah rasa ingin tahu menjadi karya web.</p>
      <a class="cta" href="#mulai">Mulai belajar</a>
    </div>
    <div class="hero-card" aria-label="Preview proyek">HTML · CSS · JavaScript</div>
  </section>

  <section class="features" id="fitur" aria-labelledby="features-title">
    <h2 id="features-title">Kenapa mulai di sini?</h2>
    <div class="feature-grid">
      <article><h3>Terarah</h3><p>Materi tersusun dari dasar sampai proyek.</p></article>
      <article><h3>Praktis</h3><p>Belajar lewat latihan yang bisa langsung dicoba.</p></article>
      <article><h3>Terlihat</h3><p>Progres dan karya tersimpan di satu ruang.</p></article>
    </div>
  </section>
  </main>

  <style>
    :root { font-family: system-ui, sans-serif; color: #182320; background: #f6f8f3; }
    body { margin: 0; }
    .site-header, .hero, .features { max-width: 980px; margin: auto; padding: 24px; }
    .site-header { display: flex; justify-content: space-between; align-items: center; }
    .site-header a { color: #1b6b54; text-decoration: none; font-weight: 700; }
    nav { display: flex; gap: 18px; }
    .hero { display: flex; align-items: center; gap: 32px; padding-top: 80px; padding-bottom: 80px; }
    .hero-copy, .hero-card { flex: 1; }
    .eyebrow { color: #ed8051; font-size: 12px; font-weight: 700; letter-spacing: .12em; }
    h1 { margin: 10px 0; font-size: clamp(38px, 7vw, 72px); line-height: .95; }
    .hero-copy > p:not(.eyebrow) { color: #68786d; line-height: 1.6; }
    .cta { display: inline-block; margin-top: 14px; padding: 12px 16px; border-radius: 7px; background: #1b6b54; color: white; text-decoration: none; }
    .hero-card { display: grid; place-items: center; min-height: 220px; border-radius: 16px; background: #dcefd7; color: #1b6b54; font-weight: 700; }
    .feature-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .feature-grid article { flex: 1 1 180px; padding: 18px; border-radius: 10px; background: white; box-shadow: 0 8px 20px rgba(27,107,84,.1); }
    .feature-grid p { color: #68786d; line-height: 1.5; }
    @media (max-width: 600px) { .hero { flex-direction: column; align-items: stretch; padding-top: 45px; }.feature-grid article { flex-basis: 100%; } }
  </style>`;
  if (challenge.title.toLowerCase().includes("interaksi") || challenge.title.toLowerCase().includes("tombol")) return `<button id="status-button">Klik saya</button>
<p id="status-text">Belum ada interaksi.</p>

<style>
  #status-button {
    border: 0;
    border-radius: 7px;
    padding: 10px 14px;
    background: #1b6b54;
    color: white;
    cursor: pointer;
  }

  #status-button.is-active {
    background: #ed8051;
    transform: translateY(-2px);
  }
</style>

<script>
  const button = document.querySelector("#status-button");
  const statusText = document.querySelector("#status-text");

  button.addEventListener("click", () => {
    statusText.textContent = "Tombol berhasil diklik!";
    button.classList.add("is-active");
  });
</script>`;
  if (challenge.title === "Flexbox layout sprint") return `<div class="feature-list">
  <article class="feature-card"><h2>Komponen</h2><p>Struktur UI yang mudah digunakan.</p><button>Lihat detail</button></article>
  <article class="feature-card"><h2>Responsif</h2><p>Tetap rapi di berbagai ukuran layar.</p><button>Lihat detail</button></article>
  <article class="feature-card"><h2>Terukur</h2><p>Layout memiliki jarak dan alignment konsisten.</p><button>Lihat detail</button></article>
</div>

<style>
  .feature-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: stretch;
    justify-content: center;
  }

  .feature-card {
    flex: 1 1 180px;
    padding: 18px;
    border-radius: 10px;
    background: white;
    color: #182320;
    box-shadow: 0 8px 20px rgba(27, 107, 84, .12);
  }

  .feature-card button {
    border: 0;
    border-radius: 6px;
    padding: 8px 10px;
    background: #1b6b54;
    color: white;
  }

  @media (max-width: 600px) {
    .feature-card { flex-basis: 100%; }
  }
</style>`;
  if (challenge.category === "JavaScript") return `<button id="challenge-button">Klik tombol</button>
<p id="challenge-status">Status: belum diklik</p>

<style>
  #challenge-button { padding: 10px 14px; border: 0; border-radius: 7px; background: #1b6b54; color: white; cursor: pointer; }
  #challenge-button.is-active { background: #ed8051; }
</style>

<script>
  const button = document.querySelector("#challenge-button");
  const status = document.querySelector("#challenge-status");

  button.addEventListener("click", () => {
    status.textContent = "Status: tombol sudah diklik";
    button.classList.add("is-active");
  });
</script>`;
  return `<h2>Challenge siap dikerjakan</h2>
<p>Buat solusi sesuai brief, lalu uji hasilnya di panel Output.</p>`;
}

function ChallengeWorkPanel({ challenge, onComplete }: { challenge: TeacherChallenge; onComplete: () => void }) {
  const brief = getChallengeBrief(challenge);
  const [workCode, setWorkCode] = useState("");
  const [workNotes, setWorkNotes] = useState("");
  const [showSolution, setShowSolution] = useState(() => challenge.title.toLowerCase().includes("interaksi") || challenge.title.toLowerCase().includes("tombol"));
  const [previewVersion, setPreviewVersion] = useState(0);
  const codeLineCount = Math.max(1, workCode.split("\n").length);
  const previewSource = buildChallengePreview(workCode, challenge);

  function useSolution() {
    setWorkCode(getChallengeSolution(challenge));
    setPreviewVersion((version) => version + 1);
  }

  return <section className="challenge-work-panel"><div className="challenge-work-heading"><div><p className="eyebrow">SEDANG DIKERJAKAN</p><h2>{challenge.title}</h2><p>{brief.goal}</p></div><span className="challenge-work-status"><span /> Aktif</span></div><div className="challenge-work-grid"><div className="challenge-work-tasks"><strong>Tugas pengerjaan</strong>{brief.tasks.map((task, index) => <div className="challenge-task" key={task}><span>{index + 1}</span><p>{task}</p></div>)}<div className="challenge-deliverable"><strong>Deliverable</strong><span>{brief.deliverable}</span></div><button type="button" className="challenge-solution-toggle" onClick={() => setShowSolution((visible) => !visible)}>{showSolution ? "Sembunyikan contoh jawaban" : "Lihat contoh jawaban"}</button>{showSolution && <div className="challenge-solution-wrap"><pre className="challenge-solution"><code>{getChallengeSolution(challenge)}</code></pre><button type="button" className="challenge-use-solution" onClick={useSolution}><Code2 size={13} /> Gunakan contoh ini</button></div>}</div><div className="challenge-work-inputs"><label className="challenge-work-editor code-editor"><span><Code2 size={14} /> Kode</span><div className="code-editor-shell"><div className="code-editor-bar"><i /><i /><i /><b>challenge.js</b></div><div className="code-editor-body"><div className="code-line-numbers" aria-hidden="true">{Array.from({ length: codeLineCount }, (_, index) => <span key={index}>{index + 1}</span>)}</div><textarea value={workCode} onChange={(event) => setWorkCode(event.target.value)} placeholder="Tulis kode HTML, CSS, atau JavaScript di sini..." rows={7} spellCheck={false} /></div></div><small>{workCode.length} karakter kode</small></label><label className="challenge-work-editor text-editor"><span><FileUp size={14} /> Catatan</span><textarea value={workNotes} onChange={(event) => setWorkNotes(event.target.value)} placeholder="Jelaskan ide atau progresmu dengan kata-kata..." rows={4} /><small>{workNotes.length} karakter catatan</small></label><div className="challenge-output"><div className="challenge-output-heading"><span><Play size={14} /> Output</span><button type="button" onClick={() => setPreviewVersion((version) => version + 1)} disabled={!previewSource}><ArrowRight size={13} /> Refresh preview</button></div>{previewSource ? <iframe key={`${previewSource}-${previewVersion}`} title="Output kode challenge" sandbox="allow-scripts" srcDoc={previewSource} /> : <div className="challenge-output-empty">Tulis kode untuk melihat output di sini.</div>}</div></div></div><div className="challenge-work-footer"><span><Clock3 size={14} /> Estimasi {challenge.minutes} menit</span><button type="button" className="login-button" onClick={onComplete}>Tandai selesai <CircleCheck size={16} /></button></div></section>;
}

function TeacherPathsView({ teacherId }: { teacherId: string }) {
  const [paths, setPaths] = useState<TeacherPath[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Frontend");
  const [level, setLevel] = useState("Pemula");
  const [saving, setSaving] = useState(false);

  async function loadPaths() { const response = await fetch(`/api/teacher/paths?teacherId=${teacherId}`); if (response.ok) setPaths((await response.json()).paths); }
  useEffect(() => { if (!teacherId) return; fetch(`/api/teacher/paths?teacherId=${teacherId}`).then((response) => response.ok ? response.json() : null).then((data) => { if (data) setPaths(data.paths); }); }, [teacherId]);
  async function createPath(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); const response = await fetch("/api/teacher/paths", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId, title, description, category, level }) }); const result = await response.json(); setSaving(false); if (!response.ok) { await Swal.fire({ title: "Belum tersimpan", text: result.message, icon: "error", confirmButtonText: "Mengerti" }); return; } setTitle(""); setDescription(""); await loadPaths(); await Swal.fire({ title: "Jalur dibuat", text: "Materi baru tersimpan di database.", icon: "success", timer: 1500, showConfirmButton: false }); }

  return <div className="page-content teacher-page"><div className="view-intro"><div><p className="eyebrow">WORKSPACE GURU</p><h1>Jalur belajar</h1><p className="view-subtitle">Susun kurikulum yang membantu siswa belajar bertahap dan terukur.</p></div><div className="teacher-badge"><BookOpen size={16} /> Konten saya</div></div><div className="teacher-layout"><form className="creator-card" onSubmit={createPath}><div className="creator-heading"><div className="creator-icon green"><BookOpen size={19} /></div><div><p className="eyebrow">BUAT KONTEN BARU</p><h2>Tambah jalur belajar</h2></div></div><label>Judul jalur<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: React untuk pemula" required /></label><label>Deskripsi<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Apa yang akan siswa pelajari?" rows={4} required /></label><div className="creator-row"><label>Kategori<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Frontend</option><option>Backend</option><option>UI/UX</option></select></label><label>Level<select value={level} onChange={(event) => setLevel(event.target.value)}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></label></div><button className="login-button" disabled={saving}>{saving ? "Menyimpan..." : "Simpan jalur belajar"}<ArrowRight size={16} /></button></form><section className="teacher-content-list"><div className="list-heading"><div><p className="eyebrow">TERSIMPAN DI DATABASE</p><h2>Jalur buatanmu</h2></div><span>{paths.length} jalur</span></div>{paths.length === 0 ? <div className="empty-teacher"><BookOpen size={22} /><strong>Belum ada jalur belajar</strong><span>Jalur yang kamu buat akan muncul di sini.</span></div> : paths.map((path) => <article className="teacher-item" key={path.id}><div className="teacher-item-icon"><BookOpen size={17} /></div><div><span>{path.category} · {path.level}</span><h3>{path.title}</h3><p>{path.description}</p></div><ChevronRight size={17} /></article>)}</section></div></div>;
}

const emptyChallengeQuestions = (): ChallengeQuestion[] => Array.from({ length: 10 }, () => ({ prompt: "", options: ["", "", "", ""], answer: "" }));

function TeacherChallengesView({ teacherId }: { teacherId: string }) {
  const [mode, setMode] = useState<"coding" | "pemahaman">("coding");
  return <><div className="challenge-mode-switch teacher-mode-switch" role="tablist" aria-label="Pilih tipe challenge guru"><button type="button" className={mode === "coding" ? "selected" : ""} onClick={() => setMode("coding")}>Tantangan coding</button><button type="button" className={mode === "pemahaman" ? "selected" : ""} onClick={() => setMode("pemahaman")}>Pemahaman</button></div>{mode === "pemahaman" ? <TeacherUnderstandingEditor teacherId={teacherId} /> : <TeacherCodingChallengesView teacherId={teacherId} />}</>;
}

function TeacherUnderstandingEditor({ teacherId }: { teacherId: string }) {
  const [challenges, setChallenges] = useState<TeacherChallenge[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "HTML", level: "Pemula", xp: "100", minutes: "20" });
  const [questions, setQuestions] = useState<ChallengeQuestion[]>(emptyChallengeQuestions);

  async function loadChallenges() {
    const response = await fetch(`/api/teacher/challenges?teacherId=${teacherId}`);
    if (response.ok) setChallenges(((await response.json()).challenges as TeacherChallenge[]).filter((challenge) => challenge.mode === "pemahaman"));
  }
  useEffect(() => { void loadChallenges(); }, [teacherId]);
  function updateQuestion(index: number, field: "prompt" | "answer" | "option", value: string, optionIndex = 0) {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex !== index ? question : field === "option" ? { ...question, options: question.options.map((option, itemIndex) => itemIndex === optionIndex ? value : option) } : { ...question, [field]: value }));
  }
  function startEdit(challenge: TeacherChallenge) {
    setEditingId(challenge.id); setForm({ title: challenge.title, description: challenge.description, category: challenge.category, level: challenge.level, xp: String(challenge.xp), minutes: String(challenge.minutes) }); setQuestions(challenge.questions?.length === 10 ? challenge.questions : emptyChallengeQuestions());
  }
  function resetForm() { setEditingId(null); setForm({ title: "", description: "", category: "HTML", level: "Pemula", xp: "100", minutes: "20" }); setQuestions(emptyChallengeQuestions()); }
  async function saveChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const response = await fetch("/api/teacher/challenges", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId, challengeId: editingId, ...form, mode: "pemahaman", questions }) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) { await Swal.fire({ title: "Belum tersimpan", text: result.message, icon: "error", confirmButtonText: "Mengerti" }); return; }
    resetForm(); await loadChallenges(); await Swal.fire({ title: editingId ? "Materi diperbarui" : "Materi dibuat", text: "Mode pemahaman dengan 10 soal sudah tersimpan.", icon: "success", timer: 1500, showConfirmButton: false });
  }
  return <div className="page-content teacher-page"><div className="view-intro"><div><p className="eyebrow">WORKSPACE GURU</p><h1>Materi pemahaman</h1><p className="view-subtitle">Buat beberapa materi, masing-masing dengan 10 soal untuk siswa.</p></div><div className="teacher-badge"><Target size={16} /> Editor pemahaman</div></div><div className="teacher-layout"><form className="creator-card understanding-editor-form" onSubmit={saveChallenge}><div className="creator-heading"><div className="creator-icon orange"><Target size={19} /></div><div><p className="eyebrow">{editingId ? "EDIT MATERI" : "MATERI BARU"}</p><h2>{editingId ? "Edit materi pemahaman" : "Buat materi pemahaman"}</h2></div></div><label>Judul materi<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: HTML dan struktur halaman" required /></label><label>Deskripsi<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Ringkasan materi untuk siswa" rows={3} required /></label><div className="creator-row"><label>Kategori<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>HTML</option><option>CSS</option><option>JavaScript</option><option>Next.js</option></select></label><label>Level<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></label></div><div className="creator-row"><label>Hadiah XP<input type="number" min="10" value={form.xp} onChange={(event) => setForm({ ...form, xp: event.target.value })} /></label><label>Durasi (menit)<input type="number" min="5" value={form.minutes} onChange={(event) => setForm({ ...form, minutes: event.target.value })} /></label></div><div className="teacher-question-editor"><div className="list-heading"><div><p className="eyebrow">KUIS</p><h3>10 soal pemahaman</h3></div><span>4 opsi / soal</span></div>{questions.map((question, index) => <div className="teacher-question" key={index}><strong>Soal {index + 1}</strong><input value={question.prompt} onChange={(event) => updateQuestion(index, "prompt", event.target.value)} placeholder="Tulis pertanyaan" required />{question.options.map((option, optionIndex) => <input key={optionIndex} value={option} onChange={(event) => updateQuestion(index, "option", event.target.value, optionIndex)} placeholder={`Pilihan ${optionIndex + 1}`} required />)}<input value={question.answer} onChange={(event) => updateQuestion(index, "answer", event.target.value)} placeholder="Jawaban benar, harus sama dengan pilihan" required /></div>)}</div><div className="editor-actions"><button type="button" className="challenge-link" onClick={resetForm}>Bersihkan</button><button className="login-button" disabled={saving}>{saving ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Terbitkan materi"}<ArrowRight size={16} /></button></div></form><section className="teacher-content-list"><div className="list-heading"><div><p className="eyebrow">TERSIMPAN</p><h2>Materi pemahamanmu</h2></div><span>{challenges.length} materi</span></div>{challenges.length === 0 ? <div className="empty-teacher"><BookOpen size={22} /><strong>Belum ada materi pemahaman</strong><span>Materi yang dibuat akan muncul di sini.</span></div> : challenges.map((challenge) => <article className="teacher-item" key={challenge.id}><div className="teacher-item-icon orange"><Target size={17} /></div><div><span>{challenge.category} · {challenge.level}</span><strong>{challenge.title}</strong><small>{challenge.questions?.length ?? 0} soal · {challenge.xp} XP</small></div><button type="button" className="challenge-link" onClick={() => startEdit(challenge)}>Edit</button></article>)}</section></div></div>;
}

function TeacherCodingChallengesView({ teacherId }: { teacherId: string }) {
  const [challenges, setChallenges] = useState<TeacherChallenge[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "JavaScript", level: "Pemula", xp: "100", minutes: "30" });
  const [saving, setSaving] = useState(false);
  async function loadChallenges() { const response = await fetch(`/api/teacher/challenges?teacherId=${teacherId}`); if (response.ok) setChallenges((await response.json()).challenges); }
  useEffect(() => { if (!teacherId) return; fetch(`/api/teacher/challenges?teacherId=${teacherId}`).then((response) => response.ok ? response.json() : null).then((data) => { if (data) setChallenges(data.challenges); }); }, [teacherId]);
  async function createChallenge(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); const response = await fetch("/api/teacher/challenges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId, ...form }) }); const result = await response.json(); setSaving(false); if (!response.ok) { await Swal.fire({ title: "Belum tersimpan", text: result.message, icon: "error", confirmButtonText: "Mengerti" }); return; } setForm({ title: "", description: "", category: "JavaScript", level: "Pemula", xp: "100", minutes: "30" }); await loadChallenges(); await Swal.fire({ title: "Challenge dibuat", text: "Tantangan baru siap diberikan ke siswa.", icon: "success", timer: 1500, showConfirmButton: false }); }
  async function resetChallenge(challenge: TeacherChallenge) { const confirmation = await Swal.fire({ title: "Reset challenge?", text: "Progress semua siswa untuk challenge ini akan dihapus dan XP dikembalikan.", icon: "warning", showCancelButton: true, confirmButtonText: "Ya, reset", cancelButtonText: "Batal", reverseButtons: true, buttonsStyling: false, customClass: { popup: "kodekita-alert", confirmButton: "alert-confirm", cancelButton: "alert-cancel" } }); if (!confirmation.isConfirmed) return; const response = await fetch("/api/teacher/challenges", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId, challengeId: challenge.id }) }); const result = await response.json(); if (!response.ok) { await Swal.fire({ title: "Reset gagal", text: result.message, icon: "error", confirmButtonText: "Mengerti", customClass: { popup: "kodekita-alert" } }); return; } await loadChallenges(); await Swal.fire({ title: "Challenge direset", text: `${result.resetCount ?? 0} progress siswa berhasil dihapus.`, icon: "success", timer: 1700, showConfirmButton: false, customClass: { popup: "kodekita-alert" } }); }
  return <div className="page-content teacher-page"><div className="view-intro"><div><p className="eyebrow">WORKSPACE GURU</p><h1>Tantangan</h1><p className="view-subtitle">Buat latihan yang mendorong siswa berpikir, mencoba, dan menunjukkan hasil.</p></div><div className="teacher-badge challenge-teacher-badge"><Target size={16} /> Arena kelas</div></div><div className="teacher-layout"><form className="creator-card challenge-creator" onSubmit={createChallenge}><div className="creator-heading"><div className="creator-icon orange"><Target size={19} /></div><div><p className="eyebrow">BUAT TANTANGAN BARU</p><h2>Rancang challenge</h2></div></div><label>Judul challenge<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Landing page sprint" required /></label><label>Instruksi<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tulis instruksi untuk siswa..." rows={4} required /></label><div className="creator-row"><label>Kategori<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>JavaScript</option><option>CSS</option><option>Next.js</option></select></label><label>Level<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></label></div><div className="creator-row"><label>Hadiah XP<input type="number" min="10" value={form.xp} onChange={(event) => setForm({ ...form, xp: event.target.value })} /></label><label>Durasi (menit)<input type="number" min="5" value={form.minutes} onChange={(event) => setForm({ ...form, minutes: event.target.value })} /></label></div><button className="login-button" disabled={saving}>{saving ? "Menyimpan..." : "Terbitkan challenge"}<ArrowRight size={16} /></button></form><section className="teacher-content-list"><div className="list-heading"><div><p className="eyebrow">TERSIMPAN DI DATABASE</p><h2>Challenge buatanmu</h2></div><span>{challenges.length} challenge</span></div>{challenges.length === 0 ? <div className="empty-teacher"><Target size={22} /><strong>Belum ada challenge</strong><span>Challenge yang kamu terbitkan akan muncul di sini.</span></div> : challenges.map((challenge) => <article className="teacher-item" key={challenge.id}><div className="teacher-item-icon orange"><Target size={17} /></div><div><span>{challenge.category} · {challenge.level} · +{challenge.xp} XP</span><h3>{challenge.title}</h3><p>{challenge.description}</p></div><span className="teacher-duration"><Clock3 size={13} /> {challenge.minutes} mnt</span><button type="button" className="teacher-reset-button" onClick={() => void resetChallenge(challenge)} title="Reset progress siswa"><RotateCcw size={14} /> Reset</button></article>)}</section></div></div>;
}

function LearningPathView() {
  const [filter, setFilter] = useState("Semua modul");
  const filters = ["Semua modul", "Frontend", "Backend"];
  const pathModules = [
    { number: "01", title: "Web Fundamentals", description: "Pahami fondasi HTML, CSS, dan cara browser menampilkan halaman.", lessons: "8 pelajaran", minutes: "2 jam 10 mnt", progress: 100, state: "Selesai", tone: "path-done" },
    { number: "02", title: "JavaScript Dasar", description: "Bangun logika interaktif dengan variable, function, DOM, dan event.", lessons: "12 pelajaran", minutes: "4 jam 30 mnt", progress: 68, state: "Sedang dipelajari", tone: "path-current" },
    { number: "03", title: "Frontend dengan Next.js", description: "Ubah ide menjadi aplikasi modern dengan komponen dan routing.", lessons: "10 pelajaran", minutes: "3 jam 45 mnt", progress: 0, state: "Terkunci", tone: "path-locked" },
    { number: "04", title: "Database & API", description: "Simpan data, buat endpoint, dan hubungkan aplikasi dengan PostgreSQL.", lessons: "9 pelajaran", minutes: "3 jam 20 mnt", progress: 0, state: "Terkunci", tone: "path-locked" },
  ];

  return <div className="page-content learning-page"><div className="view-intro"><div><p className="eyebrow">KURIKULUM TERSTRUKTUR</p><h1>Jalur belajar</h1><p className="view-subtitle">Ikuti langkah kecil yang terarah sampai kamu siap membangun produk web sendiri.</p></div><div className="path-overview"><div className="path-ring"><strong>68</strong><span>%</span></div><div><strong>Progress keseluruhan</strong><span>2 dari 4 modul aktif</span></div></div></div><div className="path-toolbar"><div className="filter-tabs">{filters.map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><span className="path-note"><Target size={15} /> Target selesai: 30 Okt 2026</span></div><div className="learning-layout"><section className="path-list">{pathModules.filter((item) => filter === "Semua modul" || (filter === "Frontend" ? ["01", "02", "03"].includes(item.number) : item.number === "04")).map((item) => <article className={`path-card ${item.tone}`} key={item.number}><div className="path-number">{item.state === "Selesai" ? <CircleCheck size={18} /> : item.state === "Terkunci" ? <LockKeyhole size={16} /> : item.number}</div><div className="path-card-main"><div className="path-card-heading"><div><span className="path-state">{item.state}</span><h2>{item.title}</h2></div><span className="path-percent">{item.progress > 0 ? `${item.progress}%` : "—"}</span></div><p>{item.description}</p><div className="path-card-meta"><span><BookOpen size={14} /> {item.lessons}</span><span><Clock3 size={14} /> {item.minutes}</span></div>{item.progress > 0 && <div className="path-progress"><div style={{ width: `${item.progress}%` }} /></div>}</div><button className="path-action" disabled={item.state === "Terkunci"}>{item.state === "Selesai" ? "Ulangi" : item.state === "Terkunci" ? <LockKeyhole size={16} /> : <>Lanjutkan <ArrowRight size={16} /></>}</button></article>)}</section><aside className="path-side-card"><div className="side-card-icon"><Award size={21} /></div><p className="eyebrow">TARGET MINGGU INI</p><h2>Bangun satu halaman web.</h2><p>Selesaikan Modul 02 dan kumpulkan karya pertamamu di portofolio.</p><div className="target-progress"><div><span>Progress target</span><strong>2 / 3 tugas</strong></div><div className="progress-track"><div style={{ width: "66%" }} /></div></div><button className="primary-button">Lihat target <ChevronRight size={16} /></button></aside></div></div>;
}

type UnderstandingQuestion = { question: string; options: string[]; answer: string; code?: string };
const understandingQuestions: UnderstandingQuestion[] = [
  { question: "Apa hasil dari kode berikut?", code: "<h1>Belajar Web</h1>", options: ["Judul besar tampil di halaman", "Gambar tampil di halaman", "Data masuk database", "Tombol menjadi aktif"], answer: "Judul besar tampil di halaman" },
  { question: "Apa fungsi kode CSS berikut?", code: ".title { color: red; }", options: ["Mengubah warna teks menjadi merah", "Mengubah teks menjadi judul HTML", "Menghapus elemen title", "Membuat background gambar"], answer: "Mengubah warna teks menjadi merah" },
  { question: "Apa hasil kode JavaScript berikut?", code: "const total = 2 + 3;", options: ["Variabel total bernilai 5", "Variabel total bernilai 23", "Halaman menjadi kosong", "Muncul gambar angka"], answer: "Variabel total bernilai 5" },
  { question: "Apa tujuan dari CSS berikut pada sebuah container?", code: ".container { display: flex; }", options: ["Mengatur anak elemen dengan layout Flexbox", "Mengubah container menjadi database", "Menjalankan JavaScript", "Menghapus semua anak elemen"], answer: "Mengatur anak elemen dengan layout Flexbox" },
  { question: "Apa arti responsive design?", options: ["Tampilan menyesuaikan ukuran layar", "Tampilan hanya untuk desktop", "Website tanpa warna", "Halaman tanpa gambar"], answer: "Tampilan menyesuaikan ukuran layar" },
  { question: "Apa yang dilakukan CSS berikut?", code: "@media (max-width: 600px) { ... }", options: ["Menerapkan style saat layar maksimal 600px", "Membuat API baru", "Menjalankan kode setiap detik", "Menghapus media dari halaman"], answer: "Menerapkan style saat layar maksimal 600px" },
  { question: "Tag mana yang paling tepat untuk navigasi utama?", code: "<nav>Menu utama</nav>", options: ["`<nav>`", "`<image>`", "`<database>`", "`<style>`"], answer: "`<nav>`" },
  { question: "Apa kegunaan CSS berikut?", code: ".grid { grid-template-columns: 1fr 1fr; }", options: ["Membuat dua kolom dengan lebar seimbang", "Membuat dua database", "Membuat dua fungsi JavaScript", "Menghapus dua kolom"], answer: "Membuat dua kolom dengan lebar seimbang" },
  { question: "Apa yang dilakukan kode berikut?", code: "button.addEventListener('click', run)", options: ["Menjalankan run saat button diklik", "Menghapus button saat halaman dibuka", "Mengubah button menjadi gambar", "Membuat database baru"], answer: "Menjalankan run saat button diklik" },
  { question: "Mengapa class seperti `.card` berguna dalam CSS?", code: ".card { padding: 16px; }", options: ["Style dapat dipakai ulang pada beberapa elemen", "Class hanya untuk menyimpan password", "Class menjalankan server", "Class menghapus HTML"], answer: "Style dapat dipakai ulang pada beberapa elemen" },
];

const understandingMaterials = [
  { id: "html", title: "HTML & Struktur", description: "Pahami struktur, tag, dan makna halaman web.", level: "Pemula", questions: understandingQuestions },
  { id: "css", title: "CSS & Layout", description: "Kenali styling, responsive design, Flexbox, dan Grid.", level: "Pemula", questions: understandingQuestions },
  { id: "javascript", title: "JavaScript & Interaksi", description: "Pelajari dasar interaksi dinamis pada website.", level: "Menengah", questions: understandingQuestions },
];

function QuestionCodeEditor({ code }: { code: string }) {
  return <div className="question-code-editor"><div className="question-editor-bar"><span /><span /><span /><small>snippet.js</small></div><div className="question-editor-body"><span className="question-line-numbers">1</span><code>{code}</code></div></div>;
}

function UnderstandingMode({ studentId }: { studentId: string }) {
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [materials, setMaterials] = useState<TeacherChallenge[]>([]);
  useEffect(() => { fetch(`/api/challenges?studentId=${studentId}`).then((response) => response.ok ? response.json() : null).then((result) => { if (result) setMaterials((result.challenges as TeacherChallenge[]).filter((challenge) => challenge.mode === "pemahaman")); }); }, [studentId]);
  const activeMaterial = materials.find((material) => material.id === activeMaterialId);
  const questions: UnderstandingQuestion[] = (activeMaterial?.questions ?? []).map((item) => ({ question: item.prompt, options: item.options, answer: item.answer, code: (item as ChallengeQuestion & { code?: string }).code }));
  const correctAnswers = questions.filter((item, index) => answers[index] === item.answer).length;
  const chooseAnswer = (index: number, answer: string) => { setSubmitted(false); setAnswers((current) => ({ ...current, [index]: answer })); };

  if (!activeMaterial) return <section className="understanding-mode"><div className="challenge-banner"><div><span className="banner-kicker"><Sparkles size={14} /> MODE PEMAHAMAN</span><h2>Belajar per materi,<br /><i>kuasai konsepnya.</i></h2><p>{materials.length ? "Pilih materi untuk mengerjakan 10 soal." : "Belum ada materi pemahaman dari guru."}</p></div><div className="banner-target"><strong>{materials.length}</strong><span>materi tersedia</span></div></div><div className="understanding-heading"><div><p className="eyebrow">MATERI PEMAHAMAN</p><h2>Pilih materi belajar</h2></div><span>10 soal per materi</span></div><div className="understanding-material-grid">{materials.map((material, index) => <article className="understanding-material" key={material.id}><div className={`challenge-art ${index % 3 === 0 ? "challenge-yellow" : index % 3 === 1 ? "challenge-green" : "challenge-blue"}`}><span>{String(index + 1).padStart(2, "0")}</span><small>Materi</small></div><div className="understanding-material-body"><span className="challenge-level">{material.level}</span><h3>{material.title}</h3><p>{material.description}</p><div className="understanding-material-meta"><span>{material.questions?.length ?? 0} soal</span><span>coding singkat</span></div><button type="button" className="challenge-button" onClick={() => { setAnswers({}); setSubmitted(false); setActiveMaterialId(material.id); }}>Mulai materi <ArrowUpRight size={14} /></button></div></article>)}</div></section>;

  return <section className="understanding-mode"><div className="understanding-quiz-top"><button type="button" className="challenge-link" onClick={() => setActiveMaterialId(null)}><ArrowRight size={15} /> Kembali ke materi</button><div><span className="eyebrow">MATERI PEMAHAMAN</span><h2>{activeMaterial.title}</h2></div><span className="understanding-progress">{Object.keys(answers).length}/10 terjawab</span></div><div className="challenge-banner"><div><span className="banner-kicker"><Sparkles size={14} /> {activeMaterial.title}</span><h2>Konsep dan kode,<br /><i>jadi satu latihan.</i></h2><p>Baca snippet seperti di editor, lalu pilih jawaban yang paling tepat.</p></div><div className="banner-target"><strong>{correctAnswers}/10</strong><span>jawaban benar</span></div></div><div className="understanding-grid">{questions.map((item, index) => <article className={`understanding-card ${submitted ? answers[index] === item.answer ? "answer-correct" : "answer-wrong" : ""}`} key={`${activeMaterial.id}-${index}`}><div className="understanding-number">{String(index + 1).padStart(2, "0")}</div><div><span className="challenge-level">{item.code ? "Coding singkat" : "Konsep"}</span><h3>{item.question}</h3>{item.code && <QuestionCodeEditor code={item.code} />}<div className="understanding-options">{item.options.map((option) => <button type="button" key={option} className={answers[index] === option ? "selected" : ""} onClick={() => chooseAnswer(index, option)}>{option}</button>)}</div>{submitted && <p className={answers[index] === item.answer ? "answer-success" : "answer-error"}>{answers[index] === item.answer ? "Jawaban benar." : `Jawaban benar: ${item.answer}`}</p>}</div></article>)}</div><div className="understanding-submit"><span>{submitted ? `Skor ${correctAnswers}/10` : `${10 - Object.keys(answers).length} soal belum dijawab`}</span>{submitted ? <button type="button" className="challenge-button" onClick={() => { setAnswers({}); setSubmitted(false); }}>Ulangi kuis</button> : <button type="button" className="challenge-button" disabled={Object.keys(answers).length !== 10} onClick={() => setSubmitted(true)}>Kumpulkan jawaban <ArrowUpRight size={14} /></button>}</div></section>;
}

function UnderstandingUnusedOne() {
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const activeMaterial = understandingMaterials.find((material) => material.id === activeMaterialId);
  const questions = activeMaterial?.questions ?? [];
  const correctAnswers = questions.filter((item, index) => answers[index] === item.answer).length;

  function chooseAnswer(index: number, option: string) {
    setSubmitted(false);
    setAnswers((current) => ({ ...current, [index]: option }));
  }

  if (!activeMaterial) {
    return <section className="understanding-mode"><div className="challenge-banner"><div><span className="banner-kicker"><Sparkles size={14} /> MODE PEMAHAMAN</span><h2>Belajar per materi,<br /><i>kuasai konsepnya.</i></h2><p>Pilih satu materi untuk mengerjakan 10 soal pemahaman.</p></div><div className="banner-target"><strong>3</strong><span>materi tersedia</span></div></div><div className="understanding-heading"><div><p className="eyebrow">MATERI PEMAHAMAN</p><h2>Pilih materi belajar</h2></div><span>Setiap materi berisi 10 soal</span></div><div className="understanding-material-grid">{understandingMaterials.map((material, index) => <article className="understanding-material" key={material.id}><div className={`challenge-art ${index === 0 ? "challenge-yellow" : index === 1 ? "challenge-green" : "challenge-blue"}`}><span>{String(index + 1).padStart(2, "0")}</span><small>Materi</small></div><div className="understanding-material-body"><span className="challenge-level">{material.level}</span><h3>{material.title}</h3><p>{material.description}</p><div className="understanding-material-meta"><span>10 soal</span><span>+100 XP</span></div><button type="button" className="challenge-button" onClick={() => { setAnswers({}); setSubmitted(false); setActiveMaterialId(material.id); }}>Mulai materi <ArrowUpRight size={14} /></button></div></article>)}</div></section>;
  }

  return <section className="understanding-mode"><div className="understanding-quiz-top"><button type="button" className="challenge-link" onClick={() => { setActiveMaterialId(null); setSubmitted(false); }}><ArrowRight size={15} /> Kembali ke materi</button><div><span className="eyebrow">MATERI PEMAHAMAN</span><h2>{activeMaterial.title}</h2></div><span className="understanding-progress">{Object.keys(answers).length}/10 terjawab</span></div><div className="challenge-banner"><div><span className="banner-kicker"><Sparkles size={14} /> {activeMaterial.title}</span><h2>Uji pemahamanmu,<br /><i>10 soal singkat.</i></h2><p>Pilih jawaban yang paling tepat, lalu kumpulkan jawabanmu.</p></div><div className="banner-target"><strong>{correctAnswers}/10</strong><span>jawaban benar</span><div className="banner-bar"><div style={{ width: `${correctAnswers * 10}%` }} /></div></div></div><div className="understanding-grid">{questions.map((item, index) => <article className={`understanding-card ${submitted ? answers[index] === item.answer ? "answer-correct" : "answer-wrong" : ""}`} key={`${activeMaterial.id}-${item.question}`}><div className="understanding-number">{String(index + 1).padStart(2, "0")}</div><div><span className="challenge-level">Soal pemahaman</span><h3>{item.question}</h3><div className="understanding-options">{item.options.map((option) => <button type="button" key={option} className={answers[index] === option ? "selected" : ""} onClick={() => chooseAnswer(index, option)}>{option}</button>)}</div>{submitted && <p className={answers[index] === item.answer ? "answer-success" : "answer-error"}>{answers[index] === item.answer ? "Jawaban benar. Konsep ini sudah kamu kuasai." : `Jawaban benar: ${item.answer}`}</p>}</div></article>)}</div><div className="understanding-submit"><span>{submitted ? `Skor kamu ${correctAnswers}/10` : `${10 - Object.keys(answers).length} soal belum dijawab`}</span>{submitted ? <button type="button" className="challenge-button" onClick={() => { setAnswers({}); setSubmitted(false); }}>Ulangi kuis</button> : <button type="button" className="challenge-button" disabled={Object.keys(answers).length !== 10} onClick={() => setSubmitted(true)}>Kumpulkan jawaban <ArrowUpRight size={14} /></button>}</div></section>;
}

function UnderstandingUnusedTwo() {
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const activeMaterial = understandingMaterials.find((material) => material.id === activeMaterialId);
  const questions = activeMaterial?.questions ?? [];
  const correctAnswers = questions.filter((item, index) => answers[index] === item.answer).length;

  if (!activeMaterial) {
    return <section className="understanding-mode"><div className="challenge-banner"><div><span className="banner-kicker"><Sparkles size={14} /> MODE PEMAHAMAN</span><h2>Belajar per materi,<br /><i>kuasai konsepnya.</i></h2><p>Pilih satu materi untuk mengerjakan 10 soal pemahaman.</p></div><div className="banner-target"><strong>3</strong><span>materi tersedia</span></div></div><div className="understanding-heading"><div><p className="eyebrow">MATERI PEMAHAMAN</p><h2>Pilih materi belajar</h2></div><span>Setiap materi berisi 10 soal</span></div><div className="understanding-material-grid">{understandingMaterials.map((material, index) => <article className="understanding-material" key={material.id}><div className={`challenge-art ${index === 0 ? "challenge-yellow" : index === 1 ? "challenge-green" : "challenge-blue"}`}><span>{String(index + 1).padStart(2, "0")}</span><small>Materi</small></div><div className="understanding-material-body"><span className="challenge-level">{material.level}</span><h3>{material.title}</h3><p>{material.description}</p><div className="understanding-material-meta"><span>10 soal</span><span>+100 XP</span></div><button type="button" className="challenge-button" onClick={() => { setAnswers({}); setActiveMaterialId(material.id); }}>Mulai materi <ArrowUpRight size={14} /></button></div></article>)}</div></section>;
  }

  return <section className="understanding-mode"><div className="understanding-quiz-top"><button type="button" className="challenge-link" onClick={() => setActiveMaterialId(null)}><ArrowRight size={15} /> Kembali ke materi</button><div><span className="eyebrow">MATERI PEMAHAMAN</span><h2>{activeMaterial.title}</h2></div><span className="understanding-progress">{Object.keys(answers).length}/10 terjawab</span></div><div className="challenge-banner"><div><span className="banner-kicker"><Sparkles size={14} /> {activeMaterial.title}</span><h2>Uji pemahamanmu,<br /><i>10 soal singkat.</i></h2><p>Pilih jawaban yang paling tepat untuk materi ini.</p></div><div className="banner-target"><strong>{correctAnswers}/10</strong><span>jawaban benar</span><div className="banner-bar"><div style={{ width: `${correctAnswers * 10}%` }} /></div></div></div><div className="understanding-grid">{questions.map((item, index) => <article className="understanding-card" key={`${activeMaterial.id}-${item.question}`}><div className="understanding-number">{String(index + 1).padStart(2, "0")}</div><div><span className="challenge-level">Soal pemahaman</span><h3>{item.question}</h3><div className="understanding-options">{item.options.map((option) => <button type="button" key={option} className={answers[index] === option ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}>{option}</button>)}</div></div></article>)}</div></section>;
}

function UnderstandingQuizLegacy() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const correctAnswers = understandingQuestions.filter((item, index) => answers[index] === item.answer).length;

  return <section className="understanding-mode"><div className="challenge-banner"><div><span className="banner-kicker"><Sparkles size={14} /> MODE PEMAHAMAN</span><h2>Uji pemahamanmu,<br /><i>10 soal singkat.</i></h2><p>Pilih jawaban yang paling tepat untuk setiap konsep dasar web.</p></div><div className="banner-target"><strong>{correctAnswers}/10</strong><span>jawaban benar</span><div className="banner-bar"><div style={{ width: `${correctAnswers * 10}%` }} /></div></div></div><div className="understanding-heading"><div><p className="eyebrow">KUIS KONSEP</p><h2>Jawab semua pertanyaan</h2></div><span>{Object.keys(answers).length}/10 terjawab</span></div><div className="understanding-grid">{understandingQuestions.map((item, index) => <article className="understanding-card" key={item.question}><div className="understanding-number">{String(index + 1).padStart(2, "0")}</div><div><span className="challenge-level">Pemahaman</span><h3>{item.question}</h3><div className="understanding-options">{item.options.map((option) => <button type="button" key={option} className={answers[index] === option ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}>{option}</button>)}</div></div></article>)}</div></section>;
}

function ChallengesView({ studentId, onXpChange }: { studentId: string; onXpChange: (xp: number) => void }) {
  const [challengeMode, setChallengeMode] = useState<"coding" | "pemahaman">("coding");

  return <><div className="challenge-mode-switch" role="tablist" aria-label="Pilih mode tantangan"><button type="button" role="tab" aria-selected={challengeMode === "coding"} className={challengeMode === "coding" ? "selected" : ""} onClick={() => setChallengeMode("coding")}>Tantangan coding</button><button type="button" role="tab" aria-selected={challengeMode === "pemahaman"} className={challengeMode === "pemahaman" ? "selected" : ""} onClick={() => setChallengeMode("pemahaman")}>Pemahaman</button></div>{challengeMode === "pemahaman" ? <UnderstandingMode studentId={studentId} /> : <ChallengesCodingView studentId={studentId} onXpChange={onXpChange} />}</>;
}

function ChallengesCodingView({ studentId, onXpChange }: { studentId: string; onXpChange: (xp: number) => void }) {
  const [challengeMode, setChallengeMode] = useState<"coding" | "pemahaman">("coding");
  const [category, setCategory] = useState("Semua");
  const [joined, setJoined] = useState<string[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<TeacherChallenge | null>(null);
  const [workingChallenge, setWorkingChallenge] = useState<TeacherChallenge | null>(null);
  const [challenges, setChallenges] = useState<(TeacherChallenge & { time: string; color: string; icon: string })[]>([]);
  const categories = ["Semua", ...Array.from(new Set(challenges.map((challenge) => challenge.category)))];
  const activeBrief = activeChallenge ? getChallengeBrief(activeChallenge) : null;

  useEffect(() => {
    fetch(`/api/challenges?studentId=${studentId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Tantangan belum dapat dimuat.");
        const result = await response.json() as { challenges: TeacherChallenge[]; completedChallengeIds?: string[] };
        setCompleted(result.completedChallengeIds ?? []);
        setChallenges(result.challenges.filter((challenge) => challenge.mode !== "pemahaman").map((challenge) => ({
          ...challenge,
          time: `${challenge.minutes} mnt`,
          color: challenge.category === "CSS" ? "challenge-green" : challenge.category === "Next.js" ? "challenge-blue" : "challenge-yellow",
          icon: challenge.category === "CSS" ? "✦" : challenge.category === "Next.js" ? "↗" : "{}",
        })));
      })
      .catch(() => setChallenges([]));
  }, [studentId]);

  async function toggleChallenge(challenge: TeacherChallenge) {
    if (completed.includes(challenge.id)) return;
    if (!joined.includes(challenge.id)) {
      setActiveChallenge(challenge);
      return;
    }
    const response = await fetch("/api/challenges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, challengeId: challenge.id }) });
    if (response.ok) {
      const result = await response.json() as { totalXp?: number };
      setCompleted((current) => [...current, challenge.id]);
      setJoined((current) => current.filter((item) => item !== challenge.id));
      setWorkingChallenge(null);
      onXpChange(result.totalXp ?? 0);
    }
  }

  return <div className="page-content challenges-page"><div className="view-intro challenge-intro"><div><p className="eyebrow">ARENA PRAKTIK</p><h1>Tantangan coding</h1><p className="view-subtitle">Belajar paling cepat saat kamu berani mencoba. Pilih challenge dan buktikan skill-mu.</p></div><div className="challenge-score"><div className="score-icon"><Zap size={19} fill="currentColor" /></div><div><strong>{challenges.reduce((total, challenge) => total + challenge.xp, 0).toLocaleString("id-ID")} XP</strong><span>total hadiah tersedia</span></div><ArrowUpRight size={16} /></div></div><div className="challenge-banner"><div><span className="banner-kicker"><Sparkles size={14} /> CHALLENGE MINGGU INI</span><h2>Landing page untuk<br /><i>masa depanmu.</i></h2><p>Rancang hero section yang berani dengan HTML dan CSS.</p></div><div className="banner-target"><strong>4</strong><span>hari tersisa</span><div className="banner-bar"><div /></div></div></div><div className="challenge-toolbar"><div className="filter-tabs">{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="challenge-count">{challenges.length} challenge tersedia</span></div>{workingChallenge && <ChallengeWorkPanel challenge={workingChallenge} onComplete={() => void toggleChallenge(workingChallenge)} />}<div className="challenge-grid">{challenges.filter((item) => category === "Semua" || item.category === category).map((challenge) => { const isJoined = joined.includes(challenge.id); const isCompleted = completed.includes(challenge.id); return <article className="challenge-card" key={challenge.id}><div className={`challenge-art ${challenge.color}`}><span>{challenge.icon}</span><small>{challenge.category}</small></div><div className="challenge-card-body"><div className="challenge-title"><h2>{challenge.title}</h2><span className="challenge-level">{challenge.level}</span></div><p>{challenge.description}</p><div className="challenge-meta"><span><Zap size={14} /> +{challenge.xp} XP</span><span><Clock3 size={14} /> {challenge.time}</span></div><button disabled={isCompleted} className={`challenge-button ${isJoined || isCompleted ? "joined" : ""}`} onClick={() => void toggleChallenge(challenge)}>{isCompleted ? <><CircleCheck size={16} /> Selesai</> : isJoined ? <><CircleCheck size={16} /> Selesaikan challenge</> : <>Mulai challenge <ArrowRight size={16} /></>}</button></div></article>; })}</div>{activeChallenge && activeBrief && <div className="challenge-detail-backdrop" role="presentation" onClick={() => setActiveChallenge(null)}><section className="challenge-detail" role="dialog" aria-modal="true" aria-labelledby="challenge-detail-title" onClick={(event) => event.stopPropagation()}><button type="button" className="challenge-detail-close" onClick={() => setActiveChallenge(null)} aria-label="Tutup detail challenge"><X size={18} /></button><div className="challenge-detail-icon"><Target size={22} /></div><p className="eyebrow">CHALLENGE DIMULAI</p><h2 id="challenge-detail-title">{activeChallenge.title}</h2><p className="challenge-detail-copy">{activeBrief.goal}</p><div className="challenge-detail-meta"><span><Zap size={15} /> +{activeChallenge.xp} XP</span><span><Clock3 size={15} /> {activeChallenge.minutes} menit</span><span>{activeChallenge.level}</span></div><div className="challenge-detail-steps"><strong>Tugas yang harus dibuat</strong>{activeBrief.tasks.map((task) => <span key={task}>{task}</span>)}<strong className="challenge-deliverable-label">Hasil akhir</strong><span>{activeBrief.deliverable}</span></div><button type="button" className="login-button" onClick={() => { setJoined((current) => current.includes(activeChallenge.id) ? current : [...current, activeChallenge.id]); setWorkingChallenge(activeChallenge); setActiveChallenge(null); }}>Mulai mengerjakan <ArrowRight size={16} /></button></section></div>}</div>;
}

type LoginScreenProps = {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  role: "siswa" | "guru";
  setRole: (role: "siswa" | "guru") => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  loginError: string;
  registerMessage: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function LoginScreen({ mode, setMode, role, setRole, name, setName, email, setEmail, password, setPassword, showPassword, setShowPassword, loginError, registerMessage, onSubmit }: LoginScreenProps) {
  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="login-brand"><div className="brand-mark"><Code2 size={19} strokeWidth={2.7} /></div><span>KODE<span>KITA</span></span></div>
        <div className="login-visual-copy"><p className="eyebrow">RUANG BELAJAR DIGITAL</p><h1>Belajar coding,<br /><i>jadi karya.</i></h1><p>Temukan cara belajar pemrograman web yang lebih dekat dengan dunia kerja.</p></div>
        <div className="login-code-card"><div className="window-bar"><span /><span /><span /><small>hello-world.js</small></div><div className="login-code"><span className="code-purple">const</span> <span className="code-yellow">future</span> <span className="code-white">=</span> <span className="code-green">&quot;punyamu&quot;</span>;<br /><span className="code-purple">console</span>.log(future);<span className="code-cursor" /></div></div>
        <div className="login-orbit" /><span className="login-star">✦</span>
        <p className="login-quote">&quot;Kode yang baik dimulai dari rasa ingin tahu.&quot;</p>
      </section>
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-mobile-brand"><div className="brand-mark"><Code2 size={19} strokeWidth={2.7} /></div><span>KODE<span>KITA</span></span></div>
          <div className="login-heading"><p className="eyebrow">{mode === "login" ? "SELAMAT DATANG" : "MULAI BELAJAR"}</p><h2>{mode === "login" ? "Masuk ke ruang belajar" : "Buat akun KODEKITA"}</h2><p>{mode === "login" ? "Gunakan akunmu untuk melanjutkan progres." : "Daftar dan simpan progres belajarmu."}</p></div>
          <div className="role-switch" role="tablist" aria-label="Pilih peran"><button type="button" className={role === "siswa" ? "selected" : ""} onClick={() => setRole("siswa")} role="tab" aria-selected={role === "siswa"}><GraduationCap size={17} /> Saya siswa</button><button type="button" className={role === "guru" ? "selected" : ""} onClick={() => setRole("guru")} role="tab" aria-selected={role === "guru"}><BriefcaseBusiness size={17} /> Saya guru</button></div>
          <form className="login-form" onSubmit={onSubmit}>{mode === "register" && <label>Nama lengkap<input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama lengkapmu" /></label>}<label>Email sekolah<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@sekolah.sch.id" /></label><label>Kata sandi<div className="password-input"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "Minimal 8 karakter" : "Masukkan kata sandi"} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{loginError && <p className="login-error">{loginError}</p>}{registerMessage && <p className={registerMessage.startsWith("Akun") ? "register-success" : "login-error"}>{registerMessage}</p>}{mode === "login" && <div className="login-options"><label className="remember-option"><input type="checkbox" /> <span>Ingat saya</span></label><button type="button" className="forgot-button">Lupa kata sandi?</button></div>}<button className="login-button" type="submit">{mode === "login" ? `Masuk sebagai ${role === "siswa" ? "siswa" : "guru"}` : "Buat akun sekarang"}<ChevronRight size={17} /></button></form>
          <p className="login-register">{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); }}>{mode === "login" ? "Daftar sekarang" : "Masuk ke akun"}</button></p><p className="login-privacy">Dengan melanjutkan, kamu menyetujui ketentuan penggunaan KODEKITA.</p>
        </div>
      </section>
    </main>
  );
}
