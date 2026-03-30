import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { PROJECT_INFO, EXPERIMENT_OVERVIEW } from '../data/mockData';

// Animated counter hook
function useCountUp(target: number, duration = 1500, decimals = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return { ref, value: decimals > 0 ? count.toFixed(decimals) : Math.round(count).toString() };
}

// Fade-in on scroll
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function StatCard({ label, value, unit, index }: { label: string; value: string; unit: string; index: number }) {
  const isDecimal = value.includes('.');
  const numValue = parseFloat(value);
  const { ref, value: animated } = useCountUp(numValue, 1800, isDecimal ? 1 : 0);

  return (
    <div
      ref={ref}
      style={{
        animationDelay: `${index * 0.15}s`,
        padding: '18px 0',
        borderTop: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '78px',
          fontWeight: 700,
          lineHeight: 0.88,
          letterSpacing: '-0.045em',
          fontVariantNumeric: 'lining-nums tabular-nums',
          color: '#C07830',
          display: 'inline-flex',
          alignItems: 'flex-end',
        }}
      >
        {animated}
        <span
          style={{
            fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif",
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            marginLeft: '4px',
            display: 'inline-block',
            alignSelf: 'flex-end',
            color: '#8A8070',
          }}
        >
          {unit}
        </span>
      </div>
      <div
        style={{
          fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif",
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: '0.01em',
          marginTop: '12px',
          color: '#9A9488',
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Individual metric card to properly use hooks
function MetricCard({ v, u, label, index }: { v: string; u: string; label: string; index: number }) {
  const { ref, value } = useCountUp(parseInt(v), 1500);
  return (
    <div
      ref={ref}
      style={{
        padding: '24px 20px',
        borderRight: '1px solid #DED8CC',
        borderBottom: '1px solid #DED8CC',
      }}
    >
      <div
        style={{
          fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
          fontSize: '32px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          fontFeatureSettings: '"tnum" 1, "lnum" 1',
          color: '#2C5F8A',
          lineHeight: 1,
          marginBottom: '6px',
        }}
      >
        {value}
        <span style={{ fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif", fontWeight: 700, fontSize: '14px', color: '#8A8070', marginLeft: '2px', letterSpacing: '-0.005em' }}>{u}</span>
      </div>
      <div style={{ fontSize: '12px', color: '#8A8070', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function DimensionTag({ name, en, desc }: { name: string; en: string; desc: string }) {
  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(222,216,204,0.15)',
        borderRadius: '4px',
        transition: 'background-color 0.2s, border-color 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(192,120,48,0.08)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(192,120,48,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(222,216,204,0.15)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '14px', color: 'var(--lx-text-on-dark)', fontWeight: 500 }}>{name}</span>
        <span style={{ fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif", fontSize: '10px', fontWeight: 700, color: '#5A7088', letterSpacing: '0.08em' }}>{en}</span>
      </div>
      <div style={{ fontSize: '12px', color: '#7D7568', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();

  const waveHeights = [6, 10, 18, 28, 38, 46, 52, 44, 34, 48, 58, 46, 32, 44, 56, 46, 32, 48, 60, 48, 34, 46, 56, 44, 30, 44, 52, 40, 26, 38, 22, 14, 8, 4];

  return (
    <div>
      {/* ══════════════════════════════════════
          HERO — Full viewport, dark background
          ══════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: 'var(--lx-bg-dark)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }}
        />

        {/* Decorative amber circle */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            border: '1px solid rgba(192,120,48,0.12)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            border: '1px solid rgba(192,120,48,0.08)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '80px 32px 80px 8px',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Eyebrow */}
          <div
            className="fade-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '40px',
            }}
          >
            <div style={{ height: '1px', width: '40px', backgroundColor: '#C07830' }} />
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: '#C07830',
                textTransform: 'uppercase',
              }}
            >
              语音实验数据展示平台
            </span>
          </div>

          {/* Main Title */}
          <h1
            className="fade-up"
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(32px, 5.5vw, 68px)',
              color: 'var(--lx-text-on-dark)',
              lineHeight: 1.2,
              marginBottom: '44px',
              fontWeight: 700,
              animationDelay: '0.1s',
              opacity: 0,
              animation: 'fadeUp 0.8s ease-out 0.1s forwards',
            }}
          >
            老年人语料数据集
            <br />
            <span style={{ color: '#C07830' }}>和分析可视化平台</span>
            
          </h1>

          {/* Waveform decoration */}
          <div
            style={{
              opacity: 0,
              animation: 'fadeUp 0.8s ease-out 0.5s forwards',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              marginBottom: '52px',
              color: '#C07830',
            }}
          >
            {waveHeights.map((h, i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: `${h}px`,
                  backgroundColor: '#C07830',
                  borderRadius: '2px',
                  opacity: 0.5 + (h / 60) * 0.5,
                  transition: 'height 0.3s',
                }}
              />
            ))}
          </div>

          {/* Stats row */}
          <div
            style={{
              opacity: 0,
              animation: 'fadeUp 0.8s ease-out 0.7s forwards',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              columnGap: '28px',
              maxWidth: '720px',
              width: '100%',
            }}
          >
            {PROJECT_INFO.highlights.map((h, i) => (
              <StatCard key={i} label={h.label} value={h.value} unit={h.unit} index={i} />
            ))}
          </div>

          {/* CTA buttons */}
          <div
            style={{
              opacity: 0,
              animation: 'fadeUp 0.8s ease-out 0.9s forwards',
              display: 'flex',
              gap: '16px',
              marginTop: '48px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => navigate('/speech-data')}
              style={{
                padding: '12px 28px',
                backgroundColor: '#C07830',
                color: 'var(--lx-text-primary)',
                border: 'none',
                borderRadius: '2px',
                fontSize: '13px',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'background-color 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = '#D08840'; (e.target as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = '#C07830'; (e.target as HTMLElement).style.transform = 'none'; }}
            >
              浏览语音样本 →
            </button>
            <button
              onClick={() => navigate('/evaluation')}
              style={{
                padding: '12px 28px',
                backgroundColor: 'transparent',
                color: '#C8C2B8',
                border: '1px solid rgba(200,194,184,0.3)',
                borderRadius: '2px',
                fontSize: '13px',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = '#C07830'; (e.target as HTMLElement).style.color = '#C07830'; (e.target as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(200,194,184,0.3)'; (e.target as HTMLElement).style.color = '#C8C2B8'; (e.target as HTMLElement).style.transform = 'none'; }}
            >
              查看可视化数据
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: '#5A5248',
            fontSize: '10px',
            letterSpacing: '0.15em',
            animation: 'fadeUp 1s ease-out 1.4s forwards',
            opacity: 0,
          }}
        >
          <span>SCROLL</span>
          <div
            style={{
              width: '1px',
              height: '40px',
              backgroundColor: '#5A5248',
              animation: 'waveBar 2s ease-in-out infinite',
              transformOrigin: 'top',
            }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════
          项目简介 SECTION
          ══════════════════════════════════════ */}
      <section
        id="project-introduction"
        style={{
          scrollMarginTop: '92px',
          backgroundColor: 'var(--lx-bg-page)',
          padding: 'clamp(60px, 10vw, 120px) 0',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
          }}
        >
          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '48px', marginBottom: '64px' }}>
            <div style={{ flex: '0 0 auto' }}>
              <div
                style={{
                  fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                  fontSize: 'clamp(64px, 12vw, 120px)',
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  fontFeatureSettings: '"tnum" 1, "lnum" 1',
                  color: 'rgba(14,20,33,0.05)',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                01
              </div>
            </div>
            <div style={{ flex: 1, paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ height: '1px', width: '32px', backgroundColor: '#C07830' }} />
                <span
                  style={{
                    fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: '#C07830',
                    textTransform: 'uppercase',
                  }}
                >
                  Project Introduction
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 'clamp(24px, 3.5vw, 40px)',
                  color: 'var(--lx-text-primary)',
                  fontWeight: 400,
                  marginBottom: '24px',
                }}
              >
                项目简介
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#4A4440',
                  lineHeight: 2,
                  maxWidth: '640px',
                  marginBottom: '40px',
                }}
              >
                {PROJECT_INFO.description}
              </p>

              {/* Core positioning badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '48px' }}>
                {['公众号 + 小程序联动', '老人端 + 家人端协同', '语音采集与反馈', '适老化表达支持'].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid #DED8CC',
                      borderRadius: '2px',
                      fontSize: '12px',
                      color: '#6A6058',
                      letterSpacing: '0.05em',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Highlight metrics in a horizontal rule format */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  borderTop: '1px solid #DED8CC',
                  borderLeft: '1px solid #DED8CC',
                }}
              >
                {[
                  { v: '16', u: '条', label: '展示样本' },
                  { v: '4', u: '类', label: '核心模块' },
                  { v: '5', u: '个', label: '观察维度' },
                  { v: '2', u: '端', label: '联动形态' },
                ].map((item, i) => (
                  <MetricCard key={i} v={item.v} u={item.u} label={item.label} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          实验概览 SECTION
          ══════════════════════════════════════ */}
      <section
        id="experiment-overview"
        style={{
          scrollMarginTop: '92px',
          backgroundColor: 'var(--lx-bg-dark)',
          padding: 'clamp(60px, 10vw, 120px) 0',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '48px', marginBottom: '72px' }}>
            <div style={{ flex: '0 0 auto' }}>
              <div
                style={{
                  fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                  fontSize: 'clamp(64px, 12vw, 120px)',
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  fontFeatureSettings: '"tnum" 1, "lnum" 1',
                  color: 'rgba(244,240,232,0.24)',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                02
              </div>
            </div>
            <div style={{ flex: 1, paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ height: '1px', width: '32px', backgroundColor: '#C07830' }} />
                <span
                  style={{
                    fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: '#C07830',
                    textTransform: 'uppercase',
                  }}
                >
                  Experiment Overview
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 'clamp(24px, 3.5vw, 40px)',
                  color: 'var(--lx-text-on-dark)',
                  fontWeight: 400,
                }}
              >
                实验概览
              </h2>
            </div>
          </div>

          {/* Two-column layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '2px',
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            {/* 实验目的 */}
            <div style={{ backgroundColor: 'var(--lx-bg-dark)', padding: '36px 32px' }}>
              <div
                style={{
                  fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                  fontSize: '10px',
                  color: '#C07830',
                  letterSpacing: '0.2em',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                01 · Purpose
              </div>
              <h3
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: '18px',
                  color: 'var(--lx-text-on-dark)',
                  fontWeight: 400,
                  marginBottom: '16px',
                }}
              >
                实验目的
              </h3>
              <p style={{ fontSize: '14px', color: '#8A8070', lineHeight: 1.9 }}>
                {EXPERIMENT_OVERVIEW.purpose}
              </p>
            </div>

            {/* 研究对象 */}
            <div style={{ backgroundColor: 'var(--lx-bg-dark)', padding: '36px 32px' }}>
              <div
                style={{
                  fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                  fontSize: '10px',
                  color: '#4E7D6A',
                  letterSpacing: '0.2em',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                02 · Participants
              </div>
              <h3
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: '18px',
                  color: 'var(--lx-text-on-dark)',
                  fontWeight: 400,
                  marginBottom: '16px',
                }}
              >
                研究对象
              </h3>
              <p style={{ fontSize: '14px', color: '#8A8070', lineHeight: 1.9 }}>
                {EXPERIMENT_OVERVIEW.participants}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                {['60-64岁', '65-70岁', '71-75岁'].map((level) => (
                  <span
                    key={level}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid rgba(78,125,106,0.3)',
                      borderRadius: '2px',
                      fontSize: '11px',
                      color: '#4E7D6A',
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>

            {/* 实验流程 */}
            <div style={{ backgroundColor: 'var(--lx-bg-dark)', padding: '36px 32px' }}>
              <div
                style={{
                  fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#2C5F8A',
                  letterSpacing: '0.2em',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                03 · Procedure
              </div>
              <h3
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: '18px',
                  color: 'var(--lx-text-on-dark)',
                  fontWeight: 400,
                  marginBottom: '20px',
                }}
              >
                实验流程
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {EXPERIMENT_OVERVIEW.procedure.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      paddingBottom: '16px',
                      paddingTop: i > 0 ? '16px' : '0',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    <div style={{ flex: '0 0 60px' }}>
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '11px',
                          color: '#2C5F8A',
                          backgroundColor: 'rgba(44,95,138,0.12)',
                          padding: '3px 8px',
                          borderRadius: '2px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {step.week}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#C8C2B8', fontWeight: 500, marginBottom: '3px' }}>
                        {step.phase}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6A6258', lineHeight: 1.6 }}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 评价维度 */}
            <div style={{ backgroundColor: 'var(--lx-bg-dark)', padding: '36px 32px' }}>
              <div
                style={{
                  fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#9A7A5A',
                  letterSpacing: '0.2em',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                04 · Dimensions
              </div>
              <h3
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: '18px',
                  color: 'var(--lx-text-on-dark)',
                  fontWeight: 400,
                  marginBottom: '20px',
                }}
              >
                评价维度
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {EXPERIMENT_OVERVIEW.dimensions.map((dim) => (
                  <DimensionTag key={dim.name} name={dim.name} en={dim.en} desc={dim.desc} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div
            style={{
              marginTop: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ height: '1px', flex: 1, maxWidth: '160px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '13px', color: '#5A5248', letterSpacing: '0.1em' }}>
              探索完整实验数据
            </span>
            <div style={{ height: '1px', flex: 1, maxWidth: '160px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { to: '/speech-data', label: '语音数据 →' },
              { to: '/evaluation', label: '评价结果 →' },
              { to: '/conclusion', label: '结论与价值 →' },
            ].map(({ to, label }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                style={{
                  padding: '10px 22px',
                  border: '1px solid rgba(200,194,184,0.2)',
                  borderRadius: '2px',
                  backgroundColor: 'transparent',
                  color: '#8A8070',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = '#C07830'; (e.target as HTMLElement).style.color = '#C07830'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(200,194,184,0.2)'; (e.target as HTMLElement).style.color = '#8A8070'; }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
