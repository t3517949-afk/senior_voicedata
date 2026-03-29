import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { ChevronDown, Moon, Sun } from 'lucide-react';

const NAV_ITEMS = [
  {
    path: '/',
    label: '首页',
    exact: true,
    children: [
      { label: '首页导览', note: '项目总体入口', to: '/' },
      { label: '项目简介', note: '研究目标与定位', to: '/#project-introduction' },
      { label: '实验概览', note: '对象、方法与流程', to: '/#experiment-overview' },
    ],
  },
  {
    path: '/speech-data',
    label: '语音数据',
    children: [
      { label: '样本浏览', note: '分组筛选与播放', to: '/speech-data#sample-browser' },
      { label: '音节对照', note: '青年/老年语音对照', to: '/speech-data#syllable-compare' },
    ],
  },
  {
    path: '/evaluation',
    label: '评价结果',
    children: [
      { label: '年龄分组', note: '按年龄层展示语音评价结果', to: '/evaluation#age-group' },
      { label: '任务对比', note: '不同任务下的结果对照', to: '/evaluation#task-compare' },
      { label: '能力量达', note: '多维能力指标综合展示', to: '/evaluation#ability-radar' },
      { label: '语义网络', note: '语料网络结构分析', to: '/evaluation#semantic-network' },
    ],
  },
  {
    path: '/conclusion',
    label: '结论与价值',
    children: [
      { label: '研究结论', note: '核心发现与总结', to: '/conclusion' },
      { label: '应用价值', note: '场景与社会价值', to: '/conclusion' },
    ],
  },
  {
    path: '/about',
    label: '关于我们',
    children: [
      { label: '项目团队', note: '成员与协作单位', to: '/about' },
      { label: '研究时间线', note: '阶段推进与里程碑', to: '/about#about-timeline' },
      { label: '研究资源', note: '文档与二维码入口', to: '/about#about-resources' },
    ],
  },
];

export function Layout() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'day' | 'night'>('night');
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null);
  const closeDropdownTimerRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('lingxi-theme');
    const nextTheme = savedTheme === 'day' ? 'day' : 'night';
    setThemeMode(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('lingxi-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDesktopDropdown(null);
    if (closeDropdownTimerRef.current !== null) {
      window.clearTimeout(closeDropdownTimerRef.current);
      closeDropdownTimerRef.current = null;
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      window.requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    return () => {
      if (closeDropdownTimerRef.current !== null) {
        window.clearTimeout(closeDropdownTimerRef.current);
        closeDropdownTimerRef.current = null;
      }
    };
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'night' ? 'day' : 'night'));
  };

  const clearDropdownCloseTimer = () => {
    if (closeDropdownTimerRef.current !== null) {
      window.clearTimeout(closeDropdownTimerRef.current);
      closeDropdownTimerRef.current = null;
    }
  };

  const openDropdown = (path: string) => {
    clearDropdownCloseTimer();
    setOpenDesktopDropdown(path);
  };

  const scheduleCloseDropdown = (path: string) => {
    clearDropdownCloseTimer();
    closeDropdownTimerRef.current = window.setTimeout(() => {
      setOpenDesktopDropdown((prev) => (prev === path ? null : prev));
    }, 140);
  };

  return (
    <div
      style={{
        fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        backgroundColor: 'var(--lx-bg-page)',
        minHeight: '100vh',
        color: 'var(--lx-text-primary)',
      }}
    >
      {/* ─── Navigation ─── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: scrolled ? 'var(--lx-bg-header-scrolled)' : 'var(--lx-bg-header)',
          backdropFilter: 'blur(12px)',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          boxShadow: scrolled ? 'var(--lx-shadow-header)' : 'none',
          borderBottom: '1px solid var(--lx-border-soft)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 32px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo / Project Acronym */}
          <NavLink
            to="/"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '-24px' }}
          >
            {/* Waveform mini logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[8, 14, 20, 14, 8, 20, 14, 8].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${h}px`,
                    backgroundColor: 'var(--lx-accent)',
                    borderRadius: '2px',
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                letterSpacing: '0.15em',
                color: 'var(--lx-text-on-dark)',
                fontWeight: 700,
              }}
            >
              聆夕
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#8A8070',
                letterSpacing: '0.08em',
                display: 'none',
              }}
              className="md-show"
            >
              老年人语料数据集和分析可视化平台项目
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <div
                  key={item.path}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={() => openDropdown(item.path)}
                  onMouseLeave={() => scheduleCloseDropdown(item.path)}
                >
                  <NavLink
                    to={item.path}
                    style={{
                      textDecoration: 'none',
                      padding: '6px 8px 6px 14px',
                      fontSize: '13px',
                      letterSpacing: '0.05em',
                      color: isActive ? 'var(--lx-nav-link-active)' : 'var(--lx-nav-link)',
                      borderBottom: isActive ? '2px solid var(--lx-nav-link-active)' : '2px solid transparent',
                      transition: 'color 0.2s, border-color 0.2s',
                      fontWeight: isActive ? 500 : 400,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {item.label}
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDesktopDropdown((prev) => (prev === item.path ? null : item.path));
                      navigate(item.path);
                    }}
                    aria-label={`${item.label}子菜单`}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '6px 10px 6px 0',
                      marginBottom: '2px',
                      color: isActive ? 'var(--lx-nav-link-active)' : 'var(--lx-nav-link)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronDown size={12} />
                  </button>

                  {openDesktopDropdown === item.path && item.children && (
                    <div
                      onMouseEnter={() => openDropdown(item.path)}
                      onMouseLeave={() => scheduleCloseDropdown(item.path)}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '4px',
                        marginTop: '1px',
                        minWidth: '248px',
                        backgroundColor: 'var(--lx-bg-page)',
                        border: '1px solid var(--lx-border-soft)',
                        borderRadius: '12px',
                        boxShadow: '0 16px 28px rgba(0,0,0,0.16)',
                        padding: '10px',
                        zIndex: 150,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '10px',
                          letterSpacing: '0.12em',
                          color: '#8A8070',
                          margin: '2px 6px 8px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.label}
                      </div>
                      {item.children.map((entry) => (
                        <button
                          key={`${item.path}-${entry.label}`}
                          type="button"
                          onClick={() => {
                            navigate(entry.to);
                            setOpenDesktopDropdown(null);
                          }}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'left',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            cursor: 'pointer',
                            display: 'grid',
                            gap: '4px',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(192,120,48,0.12)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{ fontSize: '13px', color: 'var(--lx-text-primary)', lineHeight: 1.4 }}>
                            {entry.label}
                          </span>
                          <span style={{ fontSize: '11px', color: '#8A8070', lineHeight: 1.4 }}>
                            {entry.note}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <button
            onClick={toggleTheme}
            style={{
              marginLeft: '10px',
              width: '36px',
              height: '36px',
              borderRadius: '999px',
              border: '1px solid var(--lx-border-strong)',
              backgroundColor: 'var(--lx-bg-page)',
              color: 'var(--lx-text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={themeMode === 'night' ? '切换到白天版' : '切换到夜晚版'}
            aria-label={themeMode === 'night' ? '切换到白天版' : '切换到夜晚版'}
          >
            {themeMode === 'night' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--lx-text-on-dark)',
            }}
            className="mobile-menu-btn"
            aria-label="菜单"
          >
            <div style={{ width: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ height: '2px', backgroundColor: 'currentColor', display: 'block', borderRadius: '1px', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
              <span style={{ height: '2px', backgroundColor: 'currentColor', display: 'block', borderRadius: '1px', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
              <span style={{ height: '2px', backgroundColor: 'currentColor', display: 'block', borderRadius: '1px', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
            </div>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            style={{
              backgroundColor: 'var(--lx-bg-header)',
              borderTop: '1px solid var(--lx-border-soft)',
              padding: '12px 32px 20px',
            }}
          >
            <button
              onClick={toggleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                width: '36px',
                height: '36px',
                borderRadius: '999px',
                border: '1px solid var(--lx-border-strong)',
                backgroundColor: 'var(--lx-bg-page)',
                color: 'var(--lx-text-primary)',
                cursor: 'pointer',
              }}
              title={themeMode === 'night' ? '切换到白天版' : '切换到夜晚版'}
              aria-label={themeMode === 'night' ? '切换到白天版' : '切换到夜晚版'}
            >
              {themeMode === 'night' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: '10px 0',
                    fontSize: '14px',
                    color: isActive ? 'var(--lx-nav-link-active)' : 'var(--lx-nav-link)',
                    borderBottom: '1px solid var(--lx-border-soft)',
                  }}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* ─── Page Content ─── */}
      <main style={{ paddingTop: '60px', minHeight: 'calc(100vh - 60px)' }}>
        <Outlet />
      </main>

      {/* ─── Footer ─── */}
      <footer
        style={{
          backgroundColor: 'var(--lx-bg-footer)',
          color: 'var(--lx-text-muted)',
          padding: '32px',
          textAlign: 'center',
          borderTop: '1px solid var(--lx-border-soft)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            {[6, 10, 16, 10, 6, 14, 10, 6].map((h, i) => (
              <div key={i} style={{ width: '2px', height: `${h}px`, backgroundColor: 'var(--lx-accent)', borderRadius: '1px', opacity: 0.5 }} />
            ))}
          </div>
          <p style={{ fontSize: '12px', letterSpacing: '0.08em', marginBottom: '4px' }}>
            聆夕 / 聆伴 · 老年人语料数据集和分析可视化平台
          </p>
          <p style={{ fontSize: '11px', color: 'var(--lx-text-weak)' }}>
            语音采集 · 状态观察 · 反馈支持 · 家庭协同
          </p>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
