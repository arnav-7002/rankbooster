import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import TestInterface from "./TestInterface";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const VALID_PAGES = ["dashboard", "courses", "tests", "analysis", "notebook", "admin", "settings"];

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:#080812;color:#E2E8F0}
html,body,#root{min-height:100%}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#3730a3;border-radius:4px}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:18px;transition:border-color 0.18s ease,background 0.18s ease,transform 0.16s ease,box-shadow 0.18s ease}
.card:hover{border-color:rgba(255,255,255,0.1)}
.card-hover{transition:border-color 0.2s,transform 0.15s,background 0.15s}
.card-hover:hover{border-color:rgba(124,58,237,0.3);background:rgba(255,255,255,0.05);transform:translateY(-1px)}
button{touch-action:manipulation}
.tap-card{transition:transform .16s cubic-bezier(.2,.8,.2,1),border-color .16s ease,background .16s ease,box-shadow .16s ease}
.tap-card:active{transform:scale(.985);border-color:rgba(167,139,250,.28);background:rgba(255,255,255,.055)}
.btn-primary,.btn-ghost,.btn-danger,.btn-success{min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:10px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;cursor:pointer;user-select:none;transition:transform 0.12s,opacity 0.15s,border-color 0.15s,background 0.15s,color 0.15s}
.btn-primary{background:linear-gradient(135deg,#7C3AED,#6D28D9);color:white;border:none;padding:10px 22px;box-shadow:0 8px 18px rgba(124,58,237,0.18)}
.btn-primary:hover{opacity:0.92;transform:translateY(-1px)}
.btn-primary:active,.btn-ghost:active,.btn-danger:active,.btn-success:active,.report-tab:active,.subject-pill:active,.course-switch-card:active{transform:translateY(1px) scale(.985)}
.btn-ghost{background:rgba(255,255,255,0.03);color:#CBD5E1;border:1px solid rgba(255,255,255,0.14);padding:9px 18px}
.btn-ghost:hover{color:#F8FAFC;border-color:rgba(255,255,255,0.28);background:rgba(255,255,255,0.06)}
.btn-danger{background:rgba(239,68,68,0.15);color:#FCA5A5;border:1px solid rgba(239,68,68,0.28);padding:9px 18px}
.btn-danger:hover{background:rgba(239,68,68,0.22);border-color:rgba(239,68,68,0.42)}
.btn-success{background:rgba(16,185,129,0.15);color:#6EE7B7;border:1px solid rgba(16,185,129,0.28);padding:9px 18px}
.btn-success:hover{background:rgba(16,185,129,0.22);border-color:rgba(16,185,129,0.42)}
.input-field{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#E2E8F0;padding:11px 14px;border-radius:10px;font-family:'Outfit',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color 0.15s}
.input-field:focus{border-color:rgba(124,58,237,0.5)}
.input-field::placeholder{color:#475569}
.input-field:active,.select-field:active{transform:scale(.997)}
.select-field{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#E2E8F0;padding:9px 14px;border-radius:9px;font-family:'Outfit',sans-serif;font-size:13px;outline:none;cursor:pointer}
.select-field option{background:#1a1a2e}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:14px;cursor:pointer;font-size:13px;color:#64748B;transition:background .16s ease,color .16s ease,transform .16s ease,box-shadow .16s ease;user-select:none}
.nav-item:hover{background:rgba(124,58,237,0.1);color:#C4B5FD;transform:translateX(2px)}
.nav-item.active{background:rgba(255,255,255,0.95);color:#0F172A;font-weight:700;box-shadow:0 10px 22px rgba(255,255,255,0.04)}
.nav-item.admin-item{color:#FCD34D}
.nav-item.admin-item:hover{background:rgba(251,191,36,0.1);color:#FDE68A}
.nav-item.admin-item.active{background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.22);color:#FDE68A;box-shadow:none}
.nav-tree-panel{animation:treeSlide .2s cubic-bezier(.2,.8,.2,1);transform-origin:top left}
.nav-branch{display:flex;align-items:center;gap:7px;border-radius:8px;cursor:pointer;transition:background .15s ease,color .15s ease,transform .15s ease}
.nav-branch:hover{background:rgba(255,255,255,0.045);transform:translateX(2px)}
.nav-leaf{border-radius:7px;transition:background .15s ease,color .15s ease,transform .15s ease}
.nav-leaf:hover{background:rgba(124,58,237,0.08);transform:translateX(3px)}
.sub-nav-item{display:flex;align-items:center;gap:8px;padding:7px 10px 7px 28px;border-radius:8px;cursor:pointer;font-size:12px;color:#475569;transition:all 0.15s}
.sub-nav-item:hover{background:rgba(255,255,255,0.04);color:#94A3B8}
.sub-nav-item.active{background:rgba(124,58,237,0.15);color:#A78BFA}
.tag{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.tag-purple{background:rgba(124,58,237,0.2);color:#A78BFA}
.tag-blue{background:rgba(14,165,233,0.2);color:#38BDF8}
.tag-green{background:rgba(16,185,129,0.2);color:#34D399}
.tag-amber{background:rgba(251,191,36,0.2);color:#FCD34D}
.tag-red{background:rgba(239,68,68,0.2);color:#F87171}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)}
.modal{background:#0F0F1A;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:28px;min-width:480px;max-width:600px;width:90vw;max-height:85vh;overflow-y:auto;animation:modalPop .18s cubic-bezier(.2,.8,.2,1)}
.modal::-webkit-scrollbar{width:3px}
.table-head th{font-size:11px;color:#475569;font-weight:600;text-align:left;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);text-transform:uppercase;letter-spacing:0.5px}
.table-row td{padding:12px 12px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04)}
.table-row:last-child td{border-bottom:none}
.table-row:hover td{background:rgba(255,255,255,0.02)}
.progress-bar{height:5px;border-radius:3px;background:rgba(255,255,255,0.07);overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transform-origin:left center;animation:progressGrow .7s cubic-bezier(.2,.8,.2,1)}
.account-card{position:relative;display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);cursor:pointer;transition:background .15s ease,border-color .15s ease,transform .15s ease}
.account-card:hover{background:rgba(124,58,237,0.12);transform:translateY(-1px)}
.account-popover{position:absolute;left:8px;width:300px;bottom:72px;background:#11111D;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:16px;box-shadow:0 18px 45px rgba(0,0,0,.38);animation:popoverUp .2s cubic-bezier(.2,.8,.2,1);z-index:200}
.account-popover::after{content:"";position:absolute;left:24px;bottom:-7px;width:14px;height:14px;background:#11111D;border-right:1px solid rgba(255,255,255,0.1);border-bottom:1px solid rgba(255,255,255,0.1);transform:rotate(45deg)}
.sidebar-shell.is-collapsed .account-popover{left:64px;bottom:8px}
.sidebar-shell.is-collapsed .account-popover::after{left:-7px;bottom:18px;border:none;border-left:1px solid rgba(255,255,255,0.1);border-bottom:1px solid rgba(255,255,255,0.1)}
.account-popover-row{padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.055)}
.account-popover-row:last-child{border-bottom:none}
.signout-nudge .logout-arrow{transition:transform .18s cubic-bezier(.2,.8,.2,1)}
.signout-nudge:hover .logout-arrow{transform:translateX(2px)}
.signin-nudge .login-arrow{transition:transform .18s cubic-bezier(.2,.8,.2,1)}
.signin-nudge:hover .login-arrow{transform:translateX(2px)}
.sidebar-section{font-size:10px;color:#334155;text-transform:uppercase;letter-spacing:0.8px;padding:14px 12px 6px;font-weight:600}
.sidebar-shell{width:230px;background:#0A0A14;border-right:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;transition:width .34s cubic-bezier(.2,.8,.2,1);flex-shrink:0;position:sticky;top:0;height:100vh;overflow:visible;z-index:80}
.sidebar-shell.is-collapsed{width:74px}
.sidebar-logo-row{padding:18px 14px 14px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;transition:padding .28s cubic-bezier(.2,.8,.2,1)}
.sidebar-shell.is-collapsed .sidebar-logo-row{padding:14px 10px;justify-content:center}
.sidebar-brand{display:flex;align-items:center;gap:10px;overflow:hidden;opacity:1;max-width:190px;transform:translateX(0);transition:opacity .18s ease,max-width .28s cubic-bezier(.2,.8,.2,1),transform .28s cubic-bezier(.2,.8,.2,1)}
.sidebar-shell.is-collapsed .sidebar-brand{opacity:0;max-width:0;transform:translateX(-8px);pointer-events:none}
.sidebar-toggle{border:none;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#475569;background:transparent;border-radius:12px;padding:2px;transition:width .25s cubic-bezier(.2,.8,.2,1),height .25s cubic-bezier(.2,.8,.2,1),background .18s ease,color .18s ease,transform .18s ease,box-shadow .18s ease}
.sidebar-toggle:hover{color:#A78BFA;transform:translateY(-1px)}
.sidebar-shell.is-collapsed .sidebar-toggle{width:42px;height:42px;padding:0;background:rgba(124,58,237,0.18);color:#A78BFA;box-shadow:0 12px 28px rgba(124,58,237,0.16)}
.sidebar-toggle svg{transition:transform .24s cubic-bezier(.2,.8,.2,1)}
.sidebar-shell.is-collapsed .sidebar-toggle svg{animation:sidebarIconPop .3s cubic-bezier(.2,.8,.2,1)}
.sidebar-nav{flex:1;overflow-y:auto;overflow-x:hidden;padding:10px 8px}
.sidebar-label{flex:1;white-space:nowrap;overflow:hidden;opacity:1;max-width:150px;transform:translateX(0);transition:opacity .16s ease,max-width .24s cubic-bezier(.2,.8,.2,1),transform .24s cubic-bezier(.2,.8,.2,1)}
.sidebar-shell.is-collapsed .sidebar-label{opacity:0;max-width:0;transform:translateX(-6px)}
.sidebar-shell.is-collapsed .sidebar-section{opacity:0;max-height:0;padding-top:0;padding-bottom:0;overflow:hidden;transition:opacity .12s ease,max-height .2s ease,padding .2s ease}
.sidebar-icon-wrap{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .2s cubic-bezier(.2,.8,.2,1),color .18s ease}
.sidebar-shell.is-collapsed .nav-item{justify-content:center!important;padding:0!important;width:42px!important;height:42px!important;margin:7px auto!important;border-radius:13px;transition:width .28s cubic-bezier(.2,.8,.2,1),height .28s cubic-bezier(.2,.8,.2,1),margin .28s cubic-bezier(.2,.8,.2,1),border-radius .22s ease,background .18s ease,color .18s ease,transform .18s ease,box-shadow .18s ease}
.sidebar-shell.is-collapsed .nav-item:hover{transform:translateY(-2px) scale(1.04)}
.sidebar-shell.is-collapsed .nav-item.active{animation:sidebarTilePop .3s cubic-bezier(.2,.8,.2,1);box-shadow:0 14px 32px rgba(255,255,255,0.08)}
.sidebar-shell.is-collapsed .nav-item.active .sidebar-icon-wrap{animation:sidebarIconPop .34s cubic-bezier(.2,.8,.2,1)}
.sidebar-footer{padding:10px 8px;border-top:1px solid rgba(255,255,255,0.05);position:relative}
.sidebar-shell.is-collapsed .sidebar-footer{padding:10px 0;display:flex;justify-content:center}
.sidebar-shell.is-collapsed .account-card{justify-content:center;padding:0;width:42px;height:42px;margin:0;border-radius:13px}
.sidebar-shell.is-collapsed .account-card:hover{transform:translateY(-2px) scale(1.04)}
.app-shell{display:flex;min-height:100vh;background:#080812}
.app-main{flex:1;overflow-y:auto;padding:28px 32px;min-width:0}
.app-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;gap:12px}
.site-banner{display:flex;align-items:center;gap:9px;margin-bottom:16px;padding:11px 14px;border-radius:13px;font-size:13px;font-weight:700;animation:dropdownIn .22s cubic-bezier(.2,.8,.2,1)}
.site-banner.banner-info{background:rgba(124,58,237,.14);border:1px solid rgba(167,139,250,.25);color:#C4B5FD}
.site-banner.banner-success{background:rgba(16,185,129,.12);border:1px solid rgba(52,211,153,.24);color:#6EE7B7}
.site-banner.banner-warning{background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.25);color:#FCD34D}
.mobile-bottom-nav{display:none}
.toast-stack{position:fixed;right:18px;bottom:18px;z-index:2500;display:grid;gap:10px;width:min(360px,calc(100vw - 28px));pointer-events:none}
.toast-card{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:12px 13px;border-radius:14px;background:#11111D;border:1px solid rgba(255,255,255,.1);box-shadow:0 18px 45px rgba(0,0,0,.32);animation:toastIn .22s cubic-bezier(.2,.8,.2,1);font-size:13px;color:#CBD5E1}
.toast-card.success{border-color:rgba(16,185,129,.3);background:linear-gradient(135deg,rgba(16,185,129,.12),#11111D)}
.toast-card.error{border-color:rgba(239,68,68,.32);background:linear-gradient(135deg,rgba(239,68,68,.12),#11111D)}
.toast-card.info{border-color:rgba(124,58,237,.28);background:linear-gradient(135deg,rgba(124,58,237,.14),#11111D)}
.toast-close{margin-left:auto;border:0;background:transparent;color:#64748B;cursor:pointer;padding:0;display:flex}
.skeleton-card{position:relative;overflow:hidden;min-height:110px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);padding:18px}
.skeleton-card::after{content:"";position:absolute;inset:0;transform:translateX(-110%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.055),transparent);animation:skeletonSweep 1.1s infinite}
.responsive-grid{display:grid;gap:16px}
.course-card-grid{grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
.responsive-two-col{display:grid;grid-template-columns:minmax(0,0.95fr) minmax(0,1.05fr);gap:16px}
.responsive-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.tests-layout{display:flex;gap:16px}
.tests-course-rail{width:280px;flex-shrink:0}
.stat-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:2px 7px;border-radius:20px;font-weight:600}
.stat-up{background:rgba(16,185,129,0.15);color:#34D399}
.stat-dn{background:rgba(239,68,68,0.15);color:#F87171}
.tooltip-custom .recharts-tooltip-wrapper .recharts-default-tooltip{background:#1E1B4B!important;border:1px solid #4C1D95!important;border-radius:8px!important;font-size:12px!important}
.admin-tabs{position:relative;display:grid;grid-template-columns:repeat(var(--tab-count,4),1fr);gap:4px;margin-bottom:20px;background:rgba(255,255,255,0.04);padding:4px;border-radius:11px;width:min(100%,820px);overflow:hidden}
.admin-tabs::before{content:"";position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - ((var(--tab-count,4) + 1) * 4px)) / var(--tab-count,4));border-radius:9px;background:rgba(124,58,237,0.25);transform:translateX(calc(var(--tab-index,0) * (100% + 4px)));transition:transform .24s cubic-bezier(.2,.8,.2,1),background .18s ease}
.admin-tab{position:relative;z-index:1;padding:9px 14px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;transition:color 0.15s,transform .15s;border:none;font-family:'Outfit',sans-serif;background:transparent;color:#64748B;white-space:nowrap}
.admin-tab.active{color:#A78BFA}
.admin-tab:not(.active):hover{color:#CBD5E1;transform:translateY(-1px)}
.fade-in{animation:fadeIn 0.24s ease}
.dropdown-panel{animation:dropdownIn .18s cubic-bezier(.2,.8,.2,1);transform-origin:top center}
.tab-panel{animation:panelSwitch .22s cubic-bezier(.2,.8,.2,1)}
.icon-tile{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .14s ease,background .14s ease}
.test-item-row{transition:background .15s ease,transform .15s ease}
.test-item-row:hover{background:rgba(255,255,255,0.025);transform:translateX(2px)}
.test-action-btn{min-height:38px;padding:8px 13px!important;border-radius:11px!important;font-size:12px!important;font-weight:600!important;color:#CBD5E1}
.test-action-btn svg{opacity:.82}
.test-action-btn.danger{color:#F87171}
.test-action-btn:hover{transform:translateY(-1px)}
.course-switch-list{display:grid;gap:8px}
.course-switch-card{position:relative;width:100%;text-align:left;padding:12px 13px 11px;border-radius:13px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.035);color:#94A3B8;cursor:pointer;font-family:'Outfit',sans-serif;overflow:hidden;transition:transform .18s cubic-bezier(.2,.8,.2,1),border-color .18s ease,background .18s ease,box-shadow .18s ease,color .18s ease}
.course-switch-card::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 12% 0%,var(--course-glow,rgba(124,58,237,.2)),transparent 42%);opacity:0;transition:opacity .18s ease;pointer-events:none}
.course-switch-card:hover{transform:translateX(3px);border-color:rgba(167,139,250,.24);background:rgba(255,255,255,.055);color:#CBD5E1}
.course-switch-card:hover::before{opacity:.55}
.course-switch-card.active{border-color:var(--course-border,rgba(124,58,237,.55));background:linear-gradient(135deg,var(--course-bg,rgba(124,58,237,.18)),rgba(255,255,255,.035));box-shadow:0 14px 32px rgba(0,0,0,.16),0 0 0 1px rgba(124,58,237,.08) inset;transform:translateX(0)}
.course-switch-card.active::before{opacity:.9}
.course-switch-card.active::after{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 999px 999px 0;background:var(--course-accent,#7C3AED);box-shadow:0 0 18px var(--course-accent,#7C3AED)}
.course-switch-content{position:relative;z-index:1}
.course-switch-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.course-switch-title{font-size:12px;font-weight:750;line-height:1.25;color:#CBD5E1;overflow-wrap:anywhere}
.course-switch-card.active .course-switch-title{color:var(--course-text,#C4B5FD)}
.course-switch-meta{font-size:10px;color:#475569;margin-top:3px}
.course-switch-card.active .course-switch-meta{color:#64748B}
.course-switch-dot{width:8px;height:8px;border-radius:50%;background:var(--course-accent,#7C3AED);box-shadow:0 0 0 4px var(--course-bg,rgba(124,58,237,.16));margin-top:4px;opacity:0;transform:scale(.65);transition:opacity .18s ease,transform .18s ease}
.course-switch-card.active .course-switch-dot{opacity:1;transform:scale(1)}
.course-switch-progress{height:4px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;margin-top:10px}
.course-switch-progress span{display:block;height:100%;width:var(--course-progress,0%);border-radius:999px;background:linear-gradient(90deg,var(--course-accent,#7C3AED),#A78BFA);animation:progressGrow .55s cubic-bezier(.2,.8,.2,1)}
.landing-shell{min-height:100vh;background:#080812;color:#F1F5F9}
.landing-wrap{max-width:1520px;margin:0 auto;padding:22px 38px 64px}
.landing-main{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(380px,.72fr);gap:30px;align-items:start}
.landing-auth-tabs{--auth-tab-index:0;position:relative;display:grid;grid-template-columns:repeat(2,1fr);gap:4px;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.035);border-radius:12px;padding:4px;margin-bottom:20px;overflow:hidden}
.landing-auth-tabs::before{content:"";position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 12px)/2);border-radius:9px;background:linear-gradient(135deg,rgba(124,58,237,.82),rgba(109,40,217,.72));box-shadow:0 8px 18px rgba(124,58,237,.18);transform:translateX(calc(var(--auth-tab-index,0) * (100% + 4px)));transition:transform .24s cubic-bezier(.2,.8,.2,1)}
.landing-auth-tab{position:relative;z-index:1;padding:10px;border:none;border-radius:9px;background:transparent;color:#64748B;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:color .15s ease,transform .15s ease}
.landing-auth-tab.active{color:#EDE9FE}
.landing-auth-tab:not(.active):hover{color:#CBD5E1;transform:translateY(-1px)}
.landing-auth-card{transition:transform .2s cubic-bezier(.2,.8,.2,1),border-color .2s ease,background .2s ease,box-shadow .2s ease}
.landing-auth-form{display:block}
.landing-signup-row{animation:authFormSwitch .22s cubic-bezier(.2,.8,.2,1)}
.landing-hover-card{transform-style:preserve-3d;transition:transform .2s cubic-bezier(.2,.8,.2,1),border-color .2s ease,background .2s ease,box-shadow .2s ease}
.landing-hover-card:hover{transform:translateY(-7px) rotateX(1.4deg) rotateY(-1.8deg);border-color:rgba(124,58,237,.34);background:rgba(255,255,255,.055);box-shadow:0 24px 70px rgba(0,0,0,.3),0 12px 32px rgba(124,58,237,.08)}
.pass-plan-grid{display:grid;gap:12px}
.pass-plan-card{display:flex;flex-direction:column;min-height:222px;overflow:visible}
.pass-plan-action{margin-top:auto;padding-top:12px;min-height:50px;display:flex;align-items:flex-end}
.pass-plan-action .btn-primary,.pass-plan-action .btn-ghost{width:100%;min-height:40px;font-size:12px;display:inline-flex!important;visibility:visible!important}
.skeleton-line{position:relative;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.06)}
.skeleton-line::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);animation:skeletonSweep 1.1s infinite}
.leaderboard-row{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.leaderboard-row:last-child{border-bottom:0}
.leaderboard-row.me{margin:0 -8px;padding:10px 8px;border-radius:12px;background:rgba(124,58,237,.13);border-bottom-color:transparent}
.leaderboard-rank{width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(124,58,237,.18);color:#A78BFA;font-size:12px;font-weight:850}
.leaderboard-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;font-size:11px;font-weight:850;flex-shrink:0}
.leaderboard-name{color:#E2E8F0;font-size:12px;font-weight:750;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.leaderboard-meta{color:#64748B;font-size:10px;margin-top:2px}
button:disabled{cursor:not-allowed;opacity:.68}
.landing-course-card{position:relative}
.landing-course-card::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,.05) 45%,transparent 60%);opacity:0;transform:translateX(-35%);transition:opacity .2s ease,transform .35s ease}
.landing-course-card:hover::after{opacity:1;transform:translateX(35%)}
.landing-pass-stage{max-width:820px;perspective:1200px;margin:26px 0}
.landing-pass-card{position:relative;min-height:220px;border-radius:30px;padding:28px 34px;overflow:hidden;background:linear-gradient(135deg,#7C3AED 0%,#4F46E5 54%,#312E81 100%);border:1px solid rgba(255,255,255,.16);box-shadow:0 26px 80px rgba(49,46,129,.35),0 18px 45px rgba(0,0,0,.28);transform:perspective(1200px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translate3d(var(--tx,0px),var(--ty,0px),0);transition:transform .12s ease-out,box-shadow .18s ease;touch-action:none}
.landing-pass-card.is-resting{transition:transform .55s cubic-bezier(.2,.8,.2,1),box-shadow .28s ease}
.landing-pass-card::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.22),transparent 28%);opacity:.85;pointer-events:none}
.landing-pass-card::after{content:"";position:absolute;right:-70px;top:18px;width:250px;height:250px;border:3px solid rgba(255,255,255,.12);border-radius:50%;box-shadow:inset 0 0 0 42px rgba(255,255,255,.045);opacity:.8}
.pass-watermark{position:absolute;right:28px;bottom:28px;font-size:118px;font-weight:800;line-height:.8;color:rgba(255,255,255,.055);transform:rotate(-10deg);pointer-events:none}
.pass-mini-chip{width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:0;color:#4F46E5;font-size:9px;font-weight:850;box-shadow:0 7px 18px rgba(0,0,0,.14);margin-left:-7px;letter-spacing:-.3px;position:relative;z-index:1;overflow:hidden;transition:transform .18s ease,box-shadow .18s ease,z-index .18s step-end}
.pass-mini-chip:first-child{margin-left:0}
.pass-mini-chip:hover{z-index:9;transform:translateY(-3px) scale(1.1);box-shadow:0 11px 24px rgba(0,0,0,.28)}
.pass-mini-chip img{width:100%;height:100%;object-fit:contain;padding:0;display:block;position:relative;z-index:1}
.pass-mini-chip.logo-wide img{padding:0}
.pass-validity-pill{display:inline-flex;align-items:center;justify-content:center;height:24px;padding:0 9px;border-radius:999px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);font-size:10px;font-weight:800;color:rgba(255,255,255,.86);white-space:nowrap}
input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus{-webkit-text-fill-color:#E2E8F0!important;box-shadow:0 0 0 1000px #161622 inset!important;border:1px solid rgba(124,58,237,.34)!important;caret-color:#E2E8F0}
@media (max-width:980px){.landing-wrap{padding:18px 18px 44px}.landing-main{grid-template-columns:1fr}.landing-auth-card{position:static!important}.landing-stat-grid{grid-template-columns:1fr!important}.landing-pass-stage{max-width:620px}.landing-pass-card{min-height:210px;border-radius:26px;padding:24px 28px}.landing-pass-card::after{right:-92px;top:28px;width:220px;height:220px}.pass-watermark{right:20px;bottom:24px;font-size:96px}.pass-brand-title{font-size:22px!important}.pass-title{font-size:20px!important}}
@media (max-width:640px){.landing-wrap{padding:16px 14px 38px}.landing-pass-stage{width:100%;max-width:none;perspective:900px}.landing-pass-card{min-height:0;border-radius:22px;padding:20px 18px;transition:transform .12s ease-out,box-shadow .18s ease}.landing-pass-card:active{box-shadow:0 18px 48px rgba(49,46,129,.3),0 12px 28px rgba(0,0,0,.24)}.landing-hover-card:hover{transform:none}.landing-hover-card:active{transform:scale(.985);border-color:rgba(124,58,237,.3)}.landing-pass-card::after{right:-94px;top:38px;width:190px;height:190px;box-shadow:inset 0 0 0 32px rgba(255,255,255,.045)}.landing-pass-card::before{background:radial-gradient(circle at var(--mx,40%) var(--my,12%),rgba(255,255,255,.2),transparent 34%)}.pass-content{min-height:178px!important}.pass-brand-row{gap:8px!important;margin-bottom:20px!important}.pass-brand-logo{width:32px!important;height:32px!important;border-radius:9px!important}.pass-brand-title{font-size:19px!important}.pass-brand-title span{font-size:11px!important;padding:2px 6px!important}.pass-title{font-size:18px!important}.pass-meta-row{align-items:flex-start!important;flex-direction:column;gap:14px!important;margin-top:28px!important}.pass-exam-row{padding-left:0!important}.pass-mini-chip{width:31px;height:31px;margin-left:-5px}.pass-mini-chip:hover{transform:translateY(-2px) scale(1.08)}.pass-validity{text-align:left!important}.pass-validity>div:last-child{justify-content:flex-start!important;max-width:100%!important}.pass-validity-pill{height:22px;padding:0 8px;font-size:9px}.landing-stat-grid{gap:10px!important}.admin-tabs{width:100%;overflow-x:auto;grid-template-columns:repeat(var(--tab-count,4),minmax(138px,1fr))}.admin-tabs::before{display:none}.admin-tab.active{background:rgba(124,58,237,.24)}.site-banner{font-size:12px;line-height:1.45;margin-bottom:12px}.solution-layout{grid-template-columns:1fr;padding:14px}.solution-palette{position:static;max-height:none}.solution-grid{display:flex;overflow-x:auto;gap:8px;padding-bottom:3px}.solution-qbtn{min-width:40px}.report-top{padding:13px 14px;align-items:flex-start}.report-top>div:last-child{flex-wrap:wrap;justify-content:flex-end}.subject-strip{top:65px;padding:9px 14px}.notebook-card{width:145px;height:205px;padding:18px 14px}.notebook-layout{display:grid;grid-template-columns:1fr;gap:12px}.notebook-list{width:100%;display:flex;gap:9px;overflow-x:auto;padding:2px 2px 8px;scroll-snap-type:x proximity}.notebook-list .btn-primary{min-width:148px;width:auto!important;margin-bottom:0!important;scroll-snap-align:start}.notebook-list-item{min-width:190px;margin-bottom:0;scroll-snap-align:start}.notebook-main{min-width:0}.notebook-question-card{padding:14px!important}.notebook-question-card .btn-primary,.notebook-question-card .btn-ghost{flex:1;min-width:132px}.modal{min-width:0;width:94vw;padding:20px;border-radius:16px}.responsive-two-col,.tests-layout{grid-template-columns:1fr!important;display:grid}.tests-course-rail{width:100%}.card{border-radius:13px}.btn-primary,.btn-ghost,.btn-danger,.btn-success{min-height:42px}}
@media (max-width:390px){.landing-pass-card{padding:18px 15px;border-radius:20px}.pass-content{min-height:176px!important}.pass-brand-title{font-size:17px!important}.pass-title{font-size:17px!important}.pass-mini-chip{width:29px;height:29px;margin-left:-4px}.pass-validity-pill{height:21px;padding:0 7px}}
@keyframes fadeIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes dropdownIn{from{opacity:0;transform:translateY(-6px) scale(.995)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes treeSlide{from{opacity:0;transform:translateY(-4px) translateX(-4px);max-height:0}to{opacity:1;transform:translateY(0) translateX(0);max-height:680px}}
@keyframes panelSwitch{from{opacity:0;transform:translateY(8px) scale(.995)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes authFormSwitch{from{opacity:.35;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes modalPop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes popoverUp{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes toastIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes progressGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes skeletonSweep{to{transform:translateX(100%)}}
@keyframes sidebarTilePop{0%{transform:scale(.84);opacity:.75}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
@keyframes sidebarIconPop{0%{transform:scale(.72) rotate(-8deg)}70%{transform:scale(1.16) rotate(3deg)}100%{transform:scale(1) rotate(0)}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
.checkbox-custom{width:16px;height:16px;border:1px solid rgba(255,255,255,0.2);border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.checkbox-custom.checked{background:#7C3AED;border-color:#7C3AED}
.quiz-layout{display:grid;grid-template-columns:320px minmax(0,1fr);gap:48px;max-width:1540px;margin:0 auto}
.quiz-left-title{font-size:28px;font-weight:800;line-height:1.3;color:#F8FAFC;margin:28px 0 30px}
.quiz-select-pill{height:52px;border-radius:28px;border:1px solid #7E8CFF;background:#342F80;color:#C7CFFF;padding:0 20px;display:flex;align-items:center;justify-content:space-between;font-size:18px;font-weight:600}
.quiz-side-menu{display:flex;flex-direction:column;gap:14px}
.quiz-menu-item{min-height:60px;border-radius:14px;padding:0 20px;display:flex;align-items:center;gap:14px;color:#F8FAFC;border:1px solid transparent;background:transparent;cursor:pointer;font-size:17px;font-weight:700}
.quiz-menu-item:hover{background:#1C272C;border-color:#2D3A40}
.quiz-menu-item.active{background:rgba(124,58,237,0.22);color:#EDE9FE}
.quiz-main-title{font-size:32px;font-weight:800;color:#F8FAFC;margin:8px 0 22px}
.quiz-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}
.pill-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.filter-pill{height:46px;border-radius:24px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#CBD5E1;padding:0 20px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer}
.filter-pill.active{background:#A9B7FF;border-color:#A9B7FF;color:#172126}
.search-pill{height:48px;border-radius:24px;border:1px solid rgba(255,255,255,0.1);background:#0B0B16;color:#D5DEE3;padding:0 18px;font-size:15px;font-family:'Outfit',sans-serif;min-width:280px}
.test-row{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden;margin-bottom:22px}
.test-row:active,.card:active{border-color:rgba(167,139,250,.18)}
.test-row-main{display:flex;align-items:center;gap:18px;padding:28px}
.status-check{width:21px;height:21px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#66E0AE;color:#10201A;font-size:13px;font-weight:900;flex-shrink:0}
.test-title{font-size:20px;font-weight:800;color:#F8FAFC;margin-bottom:7px}
.muted{color:#8A9AA3}
.metric-strip{min-height:46px;background:rgba(124,58,237,0.08);border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:28px;padding:0 70px;font-size:17px;font-weight:700;color:#B7C6CD}
.metric-strip span{display:inline-flex;align-items:center;gap:7px}
.analysis-shell{display:grid;grid-template-columns:360px minmax(0,1fr);gap:42px;max-width:1380px;margin:0 auto}
.analysis-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-top:6px solid #7C3AED;border-radius:12px;overflow:hidden;margin-bottom:34px}
.analysis-card h3{font-size:24px;font-weight:800;color:#F8FAFC;padding:26px 28px 18px}
.metric-table{width:100%;border-collapse:collapse;table-layout:fixed}
.metric-table th,.metric-table td{border-top:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);padding:18px 20px;text-align:left}
.metric-table th:last-child,.metric-table td:last-child{border-right:none}
.metric-table th{color:#CAD5DA;font-size:15px;font-weight:800}
.metric-table td{font-size:22px;font-weight:800;color:#F8FAFC}
.metric-table small{font-size:14px;color:#AAB5BB;font-weight:600}
.accent-score{color:#FFB461!important}.accent-good{color:#69E5A7!important}.accent-wrong{color:#FF93A3!important}.accent-blue{color:#9EADFF!important}.accent-gray{color:#C5D1D7!important}
.notebook-card{width:190px;height:270px;background:#352F88;border-left:8px solid #D7E0E8;box-shadow:10px 8px 0 #263842;border-radius:2px;color:white;padding:24px 18px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer}
.notebook-card:hover{transform:translateY(-2px);transition:transform 0.15s}
.notebook-layout{display:flex;gap:16px}
.notebook-list{width:260px;flex-shrink:0}
.notebook-list-item{padding:10px 12px;border-radius:12px;cursor:pointer;margin-bottom:8px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);transition:transform .16s cubic-bezier(.2,.8,.2,1),border-color .16s ease,background .16s ease}
.notebook-list-item:hover{transform:translateX(2px);border-color:rgba(167,139,250,.22);background:rgba(255,255,255,.045)}
.notebook-list-item.active{border-color:rgba(124,58,237,.46);background:rgba(124,58,237,.14);box-shadow:0 12px 28px rgba(124,58,237,.08)}
.notebook-main{flex:1;min-width:0}
.notebook-question-card{margin-bottom:10px;transition:transform .16s cubic-bezier(.2,.8,.2,1),border-color .16s ease,background .16s ease}
.notebook-question-card:hover{transform:translateY(-1px);border-color:rgba(167,139,250,.16)}
.report-shell{min-height:100vh;background:linear-gradient(180deg,#090912 0%,#080812 34%,#070711 100%);color:#E2E8F0;font-family:'Outfit',sans-serif}
.report-shell .card{background:rgba(255,255,255,0.035);border-color:rgba(255,255,255,0.075);box-shadow:0 14px 34px rgba(0,0,0,0.12)}
.report-top{position:sticky;top:0;z-index:30;background:rgba(8,8,18,0.88);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,0.07);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.report-title{font-size:20px;font-weight:650;color:#F1F5F9;letter-spacing:-0.2px}
.report-subtitle{color:#64748B;font-size:12px;margin-top:3px;font-weight:400}
.report-section-title{color:#E2E8F0;font-size:14px;font-weight:650;letter-spacing:-0.1px}
.report-tab{height:38px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.035);color:#94A3B8;padding:0 12px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:transform .14s,background .14s,border-color .14s,color .14s,box-shadow .14s}
.report-tab svg{opacity:.88}
.report-tab .tab-icon{width:22px;height:22px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.045);color:currentColor;transition:background .14s,color .14s}
.report-tab:hover{transform:translateY(-1px);background:rgba(124,58,237,0.14);border-color:rgba(167,139,250,0.35);color:#E2E8F0}
.report-tab.active{background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.18));border-color:rgba(167,139,250,0.58);color:#C4B5FD;box-shadow:0 12px 28px rgba(124,58,237,0.12)}
.report-tab.active .tab-icon{background:rgba(167,139,250,0.18);color:#DDD6FE}
.report-tab.close-tab:hover{background:rgba(239,68,68,0.1);border-color:rgba(248,113,113,0.26);color:#FCA5A5}
.report-metric{position:relative;overflow:hidden;text-align:left!important;min-height:104px;display:flex;flex-direction:column;justify-content:space-between}
.report-metric::after{content:"";position:absolute;inset:auto -35% -65% 20%;height:110px;background:radial-gradient(circle,rgba(124,58,237,0.14),transparent 64%);pointer-events:none}
.report-metric-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(124,58,237,0.14);color:#A78BFA}
.report-metric-value{font-size:22px;font-weight:650;letter-spacing:-0.2px;line-height:1}
.report-metric-label{color:#64748B;font-size:10px;margin-top:5px;text-transform:uppercase;letter-spacing:.6px;font-weight:600}
.subject-strip{position:sticky;top:67px;z-index:20;background:rgba(8,8,18,0.93);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,0.07);padding:10px 24px;display:flex;gap:9px;overflow-x:auto}
.subject-pill{height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.035);color:#94A3B8;padding:0 13px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:transform .14s,background .14s,border-color .14s,color .14s}
.subject-pill:hover{transform:translateY(-1px);border-color:rgba(167,139,250,0.35);color:#CBD5E1}
.subject-pill.active{background:rgba(124,58,237,0.18);border-color:rgba(167,139,250,0.5);color:#A78BFA}
.solution-layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:20px;padding:22px 24px 36px}
.solution-palette{position:sticky;top:136px;align-self:start;max-height:calc(100vh - 160px);overflow:auto}
.solution-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.solution-qbtn{height:38px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#94A3B8;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:transform .12s,box-shadow .12s,border-color .12s,background .12s}
.solution-qbtn:hover{transform:translateY(-1px);border-color:rgba(167,139,250,0.35)}
.solution-qbtn.correct{background:rgba(16,185,129,0.16);border-color:rgba(16,185,129,0.38);color:#6EE7B7}
.solution-qbtn.wrong{background:rgba(239,68,68,0.16);border-color:rgba(239,68,68,0.38);color:#FCA5A5}
.solution-qbtn.blank{background:rgba(124,58,237,0.12);color:#A78BFA}
.solution-qbtn.active{box-shadow:0 0 0 2px rgba(167,139,250,0.6)}
.solution-image-watermark-wrap{position:relative;display:inline-block;max-width:100%;background:#fff;border-radius:8px;border:1px solid rgba(255,255,255,0.08);overflow:hidden}
.solution-image-watermark-wrap img{position:relative;z-index:1;display:block;max-width:100%;max-height:360px;object-fit:contain;object-position:left top;background:#fff}
.solution-watermark-layer{position:absolute;z-index:2;inset:-22px;display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));grid-auto-rows:82px;pointer-events:none;overflow:hidden;mix-blend-mode:multiply}
.solution-watermark-layer span{align-self:center;justify-self:center;color:rgba(71,85,105,0.30);font-size:13px;font-weight:650;line-height:1;white-space:nowrap;transform:rotate(-48deg);user-select:none;text-shadow:0 0 1px rgba(255,255,255,0.25)}
.insight-card{position:relative;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.065);border-radius:12px;padding:13px 13px 13px 36px}
.insight-card::before{content:"";position:absolute;left:14px;top:16px;width:8px;height:8px;border-radius:50%;background:#A78BFA;box-shadow:0 0 0 4px rgba(124,58,237,0.16)}
.review-option{padding:10px 12px;border-radius:9px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#94A3B8;font-size:13px;font-weight:500}
.review-option.correct{border-color:rgba(52,211,153,0.42);background:rgba(16,185,129,0.09);color:#6EE7B7}
.review-option.marked{border-color:rgba(248,113,113,0.42);background:rgba(239,68,68,0.09);color:#FCA5A5}
@media (max-width: 1100px){.quiz-layout,.analysis-shell{grid-template-columns:1fr;gap:24px}.search-pill{min-width:0;width:100%}.quiz-toolbar{align-items:flex-start;flex-direction:column}.metric-strip{padding:12px 22px;flex-wrap:wrap}.metric-table{min-width:760px}.analysis-card{overflow-x:auto}}
@media (max-width: 900px){.solution-layout{grid-template-columns:1fr}.solution-palette{position:relative;top:auto}.subject-strip{top:68px}}
@media (max-width: 820px){
body{overflow-x:hidden}
.app-shell{display:block;min-height:100svh;padding-bottom:74px}
.app-main{padding:16px 14px 92px!important;overflow:visible}
.app-topbar{position:sticky;top:0;z-index:60;margin:-16px -14px 18px;padding:12px 14px;background:rgba(8,8,18,.9);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.06)}
.sidebar-shell{position:fixed;left:0;right:0;bottom:0;top:auto;width:100%!important;height:70px;z-index:90;border-right:none;border-top:1px solid rgba(255,255,255,.08);display:block;background:rgba(10,10,20,.94);backdrop-filter:blur(16px);overflow:visible}
.sidebar-logo-row,.sidebar-section,.sidebar-footer,.sidebar-toggle,.sidebar-brand,.nav-tree-panel{display:none!important}
.sidebar-nav{height:70px;display:flex;align-items:center;justify-content:space-around;gap:4px;padding:7px 8px;overflow-x:auto;overflow-y:hidden}
.sidebar-nav .nav-item{width:52px!important;height:52px!important;margin:0!important;padding:0!important;justify-content:center!important;border-radius:16px;flex:0 0 52px}
.sidebar-nav .nav-item:hover{transform:translateY(-2px)}
.sidebar-nav .nav-item.active{background:rgba(255,255,255,.95);color:#0F172A}
.sidebar-label,.sidebar-nav .nav-item svg + span,.sidebar-nav .nav-item .sidebar-label{display:none!important}
.sidebar-icon-wrap{width:20px;height:20px}
.account-popover{position:fixed;left:12px;right:12px;bottom:86px;width:auto}
.account-popover::after{display:none}
.card{border-radius:13px;padding:14px}
.modal-overlay{align-items:flex-end;padding:0}
.modal{min-width:0!important;width:100vw!important;max-width:100vw!important;max-height:88svh;border-radius:20px 20px 0 0;padding:20px 16px}
.modal [style*="grid-template-columns"]{grid-template-columns:1fr!important}
.card{overflow-x:auto}
.btn-primary,.btn-ghost,.btn-danger,.btn-success{min-height:44px}
.landing-wrap{padding:16px 14px 96px}
.landing-main{grid-template-columns:1fr!important;gap:22px}
.landing-main h1{font-size:34px!important;line-height:1.08!important}
.landing-main p{font-size:14px!important}
.pass-plan-grid{grid-template-columns:1fr!important}
.pass-plan-card{min-height:auto}
.course-switch-list{display:flex;overflow-x:auto;gap:10px;padding-bottom:8px;scroll-snap-type:x mandatory}
.course-switch-card{min-width:220px;scroll-snap-align:start}
.test-item-row{align-items:flex-start!important;flex-wrap:wrap}
.test-item-row>div:nth-child(2){min-width:0;flex-basis:calc(100% - 48px)}
.test-item-row>div:last-child{width:100%;justify-content:stretch!important}
.test-item-row>div:last-child button{flex:1;min-width:120px}
.report-top{position:sticky;top:0;padding:12px 14px;align-items:flex-start;flex-direction:column}
.report-top>div:last-child{width:100%;overflow-x:auto;padding-bottom:2px}
.report-tab{flex:0 0 auto}
.subject-strip{top:96px;padding:9px 14px}
.solution-layout{padding:14px;gap:14px}
.solution-grid{grid-template-columns:repeat(6,1fr)}
.solution-palette{max-height:none}
.report-shell .card{box-shadow:none}
.analysis-card{overflow-x:auto}
.metric-table{min-width:680px}
.admin-tabs{width:100%;overflow-x:auto;display:flex}
.admin-tabs::before{display:none}
.admin-tab{flex:0 0 auto;min-width:116px}
.admin-tab.active{background:rgba(124,58,237,.22);border:1px solid rgba(167,139,250,.35)}
table{min-width:640px}
.table-scroll{overflow-x:auto}
.responsive-grid,.responsive-two-col,.responsive-stats-grid{grid-template-columns:1fr!important}
.course-card-grid{grid-template-columns:1fr!important}
.tests-layout{display:block!important}
.tests-course-rail{width:100%!important;margin-bottom:16px}
.responsive-split{flex-direction:column!important;align-items:flex-start!important}
}
@media (max-width: 560px){
.app-main{padding-left:12px!important;padding-right:12px!important}
.app-topbar{margin-left:-12px;margin-right:-12px}
.landing-main h1{font-size:30px!important}
.quiz-main-title,.quiz-left-title{font-size:24px}
.test-row-main{padding:16px;align-items:flex-start;flex-direction:column}
.metric-strip{gap:12px;font-size:13px}
.course-switch-card{min-width:196px}
.solution-grid{grid-template-columns:repeat(5,1fr)}
.report-title{font-size:18px}
.report-metric-value{font-size:19px}
.subject-pill{height:34px;font-size:11px}
}
`;

const PASS_PLANS = [
  { id: "daily", name: "Daily Pass", durationDays: 1, price: 49, originalPrice: 99, label: "1 day", badge: "Trial", note: "Best for one serious mock day." },
  { id: "monthly", name: "Monthly Pass", durationDays: 30, price: 299, originalPrice: 499, label: "1 month", badge: "Popular", note: "For steady weekly practice." },
  { id: "six_month", name: "6 Month Pass", durationDays: 180, price: 999, originalPrice: 1499, label: "6 months", badge: "Value", note: "For full syllabus preparation." },
  { id: "yearly", name: "Yearly Pass", durationDays: 365, price: 1499, originalPrice: 2499, label: "1 year", badge: "Max", note: "For long-term test access." },
];

const DEFAULT_SETTINGS = {
  banner: { enabled: false, text: "", variant: "info" },
  homeAnnouncement: { enabled: false, title: "", body: "" },
  payments: { enabled: false, upiId: "", payeeName: "RankBooster", note: "Pay using UPI, then submit the UTR/reference ID for manual approval." },
};

function passStatus(pass) {
  if (!pass?.expiresAt) return { active: false, label: "No active pass", daysLeft: 0 };
  const expires = new Date(pass.expiresAt);
  if (Number.isNaN(expires.getTime())) return { active: false, label: "No active pass", daysLeft: 0 };
  const msLeft = expires.getTime() - Date.now();
  if (msLeft <= 0) return { active: false, label: "Expired", daysLeft: 0, expiresAt: pass.expiresAt };
  const daysLeft = Math.max(1, Math.ceil(msLeft / 86400000));
  return { active: true, label: `${pass.planName || "Pass"} active`, daysLeft, expiresAt: pass.expiresAt };
}

function createPass(plan, payment = {}) {
  const now = new Date();
  const expires = new Date(now.getTime() + Number(plan.durationDays || 1) * 86400000);
  return {
    planId: plan.id,
    planName: plan.name,
    durationDays: plan.durationDays,
    price: plan.price,
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    paymentMode: payment.mode || "mock",
    paymentStatus: "paid",
    paymentRef: payment.ref || "",
    orderId: payment.orderId || "",
  };
}

function upiPaymentUrl({ upiId, payeeName, amount, note, orderId }) {
  const params = new URLSearchParams();
  params.set("pa", upiId || "");
  params.set("pn", payeeName || "RankBooster");
  params.set("am", String(Number(amount || 0)));
  params.set("cu", "INR");
  params.set("tn", `${note || "RankBooster Pass"} ${orderId || ""}`.trim());
  return `upi://pay?${params.toString()}`;
}

function qrImageUrl(data, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(data || "")}`;
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function testScheduleState(test) {
  const start = test?.scheduledAt ? new Date(test.scheduledAt) : null;
  const end = test?.scheduledUntil ? new Date(test.scheduledUntil) : null;
  const now = Date.now();
  if (start && !Number.isNaN(start.getTime()) && start.getTime() > now) {
    return { available: false, state: "upcoming", label: `Opens ${formatDateTime(test.scheduledAt)}` };
  }
  if (end && !Number.isNaN(end.getTime()) && end.getTime() < now) {
    return { available: false, state: "closed", label: "Window closed" };
  }
  return { available: true, state: start ? "live" : "open", label: start ? "Live now" : "" };
}

const IMPORTER_API = "";

function stableOfflineId(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) return "";
  const slug = email.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
  return slug ? `acct_${slug}` : "";
}
function randomOfflineId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function ensureOfflineUser(user) {
  if (!user) return user;
  const offlineId = user.offlineId || stableOfflineId(user) || randomOfflineId();
  return { ...user, id: user.id || offlineId, offlineId };
}

async function syncOfflineUser(user, optedIds = [], courses = []) {
  user = ensureOfflineUser(user);
  if (!user) return null;
  const coursesOpted = optedIds.map(id => {
    const course = courses.find(c => c.id === id);
    if (!course) return null;
    return {
      id: course.id,
      title: course.title,
      folderName: course.folderName || course.title,
      optedAt: new Date().toISOString(),
    };
  }).filter(Boolean);

  const res = await fetch(`${IMPORTER_API}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, coursesOpted }),
  }).catch(() => null);
  if (!res?.ok) return user;
  const data = await res.json().catch(() => null);
  const returnedCourses = Array.isArray(data?.coursesOpted) ? data.coursesOpted : [];
  const returnedCourseIds = returnedCourses.map(c => c.id).filter(Boolean);
  const syncedUser = data?.user ? {
    ...user,
    name: data.user.name || user.name,
    email: data.user.email || user.email,
    role: data.user.role || user.role,
    avatar: data.user.avatar || user.avatar,
    joinedAt: data.user.joinedAt || user.joinedAt,
    offlineId: data.user.offlineId || user.offlineId,
    pass: data.pass || data.user.pass || user.pass,
  } : user;
  return { ...syncedUser, syncedCourseIds: returnedCourseIds };
}

function mergeFolderLibrary(localCourses, folderCourses) {
  const merged = [...(localCourses || [])];
  for (const folderCourse of folderCourses || []) {
    const idx = merged.findIndex(c => c.id === folderCourse.id || c.title === folderCourse.title);
    if (idx === -1) {
      merged.push(folderCourse);
    } else {
      const localCourse = merged[idx];
      const mergedFolders = (folderCourse.testFolders || []).map(folder => {
        return {
          ...folder,
          tests: folder.tests || [],
        };
      });
      merged[idx] = {
        ...localCourse,
        ...folderCourse,
        testFolders: mergedFolders,
      };
    }
  }
  return merged;
}

function normalizeExternalTestUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (u.hostname === "github.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const blobIdx = parts.indexOf("blob");
      if (parts.length >= 5 && blobIdx === 2) {
        return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts.slice(3).join("/")}`;
      }
    }
  } catch {}
  return raw;
}

function sameExternalUrl(a, b) {
  const left = normalizeExternalTestUrl(a);
  const right = normalizeExternalTestUrl(b);
  return !!left && !!right && left === right;
}

async function loadExternalTestJson(sourceUrl) {
  const url = normalizeExternalTestUrl(sourceUrl);
  if (!url) return null;
  const proxied = await fetch(`${IMPORTER_API}/test?sourceUrl=${encodeURIComponent(url)}`).catch(() => null);
  if (proxied?.ok) {
    const data = await proxied.json().catch(() => null);
    if (data?.test) return data.test;
  }
  const direct = await fetch(url, { cache: "force-cache" }).catch(() => null);
  if (!direct?.ok) return null;
  return direct.json().catch(() => null);
}

function isConfiguredTest(test) {
  return test?.configured === true || (!!test?.sourceUrl && test?.configured !== false) || (!test?.sourceZip && !test?.sourceUrl);
}

function cleanAttemptTestId(test) {
  const raw = String(test?.id || test?.testId || test?.sourceZip || test?.name || "");
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function configuredTests(folder) {
  return (folder?.tests || []).filter(isConfiguredTest);
}

function configuredTestCount(course) {
  return (course?.testFolders || []).reduce((a, f) => a + configuredTests(f).length, 0);
}

function configuredFolders(course) {
  return (course?.testFolders || []).map(f => ({ ...f, tests: configuredTests(f) }));
}

function initStore() {}

async function loadNotebookStore(user) {
  if (!user?.offlineId) return [];
  const res = await fetch(`${IMPORTER_API}/notebooks?offlineId=${encodeURIComponent(user.offlineId)}`).catch(() => null);
  const data = res?.ok ? await res.json() : null;
  return Array.isArray(data?.notebooks) ? data.notebooks : [];
}

function saveNotebookStore(userId, notebooks, user) {
  if (user?.offlineId) {
    return fetch(`${IMPORTER_API}/notebooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, notebooks }),
    }).catch(() => null);
  }
  return Promise.resolve(null);
}

// ─── ICONS (inline SVG — no emojis) ─────────────────────────────────────────
const Icon = ({ n, s = 16, c }) => {
  const icons = {
    // nav
    home:         <><path d="m3 10 9-7 9 7"/><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/><path d="M9 21v-6h6v6"/></>,
    courses:      <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    tests:        <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></>,
    analysis:     <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></>,
    mistakes:     <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    notebook:     <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/></>,
    settings:     <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></>,
    admin:        <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></>,
    logout:       <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    // actions
    plus:         <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit:         <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:        <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    repeat:       <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
    // chevrons
    chevdown:     <polyline points="6 9 12 15 18 9"/>,
    chevright:    <polyline points="9 18 15 12 9 6"/>,
    chevleft:     <polyline points="15 18 9 12 15 6"/>,
    // misc
    check:        <polyline points="20 6 9 17 4 12"/>,
    "check-circle":<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    x:            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    "x-circle":   <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
    search:       <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    star:         <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    users:        <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    book:         <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    "book-open":  <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    books:        <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/></>,
    clipboard:    <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 12 2 2 4-4"/></>,
    "file-text":  <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    folder:       <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    tag:          <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    bar:          <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    menu:         <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    image:        <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    "trending-up":<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    target:       <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    award:        <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
    "alert-tri":  <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    flame:        <><path d="M12 2c0 0-5 4-5 9a5 5 0 0 0 10 0c0-5-5-9-5-9z"/><path d="M12 12c0 0-2 1.5-2 3a2 2 0 0 0 4 0c0-1.5-2-3-2-3z"/></>,
    zap:          <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    "price-tag":  <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    rupee:        <><path d="M6 3h12"/><path d="M6 8h12"/><path d="M13 21 6 13h4a5 5 0 0 0 5-5"/></>,
    percent:      <><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>,
    user:         <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    "eye":        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    "clock":      <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    calendar:     <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[n] || icons["x"]}</svg>;
};

function LogoutNudgeIcon({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <g className="logout-arrow">
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </g>
    </svg>
  );
}

function LoginNudgeIcon({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <g className="login-arrow">
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </g>
    </svg>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in" style={{ minWidth: width, maxWidth: width }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#F1F5F9" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}><Icon n="x" s={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LandingPassCard({ courses, totalTests }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, tx: 0, ty: 0, mx: 50, my: 50, resting: true });
  const examChips = [
    { name: "JEE Main", short: "JEE", logo: "/exam-logos/badges/jee-main.png" },
    { name: "BITSAT", short: "BITS", logo: "/exam-logos/badges/bitsat.png" },
    { name: "UGEE", short: "UGEE", logo: "/exam-logos/badges/ugee.png", wide: true },
    { name: "COMEDK", short: "COM", logo: "/exam-logos/badges/comedk.png", wide: true },
  ];
  const validityOptions = ["1D", "1M", "3M", "6M", "1Y"];

  function moveCardFromPoint(el, clientX, clientY, touch = false) {
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const ry = ((x / rect.width) - 0.5) * (touch ? 10 : 15);
    const rx = -((y / rect.height) - 0.5) * (touch ? 8 : 12);
    setTilt({
      rx,
      ry,
      tx: ((x / rect.width) - 0.5) * (touch ? 5 : 8),
      ty: ((y / rect.height) - 0.5) * (touch ? 4 : 6),
      mx: px,
      my: py,
      resting: false,
    });
  }

  function moveCard(e) {
    moveCardFromPoint(e.currentTarget, e.clientX, e.clientY, false);
  }

  function touchMoveCard(e) {
    const point = e.touches?.[0] || e.changedTouches?.[0];
    if (!point) return;
    moveCardFromPoint(e.currentTarget, point.clientX, point.clientY, true);
  }

  function resetCard() {
    setTilt({ rx: 0, ry: 0, tx: 0, ty: 0, mx: 50, my: 50, resting: true });
  }

  return (
    <div className="landing-pass-stage">
      <div
        className={`landing-pass-card ${tilt.resting ? "is-resting" : ""}`}
        onMouseMove={moveCard}
        onMouseLeave={resetCard}
        onTouchStart={touchMoveCard}
        onTouchMove={touchMoveCard}
        onTouchEnd={resetCard}
        onTouchCancel={resetCard}
        style={{
          "--rx": `${tilt.rx}deg`,
          "--ry": `${tilt.ry}deg`,
          "--tx": `${tilt.tx}px`,
          "--ty": `${tilt.ty}px`,
          "--mx": `${tilt.mx}%`,
          "--my": `${tilt.my}%`,
        }}
      >
        <div className="pass-watermark">R</div>
        <div className="pass-content" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: 164 }}>
          <div className="pass-brand-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div className="pass-brand-logo" style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 850 }}>R</div>
            <div className="pass-brand-title" style={{ fontSize: 24, fontWeight: 850, color: "#FFFFFF" }}>RankBooster <span style={{ fontSize: 13, padding: "3px 7px", borderRadius: 6, background: "rgba(255,255,255,.9)", color: "#4F46E5", verticalAlign: "middle" }}>Pass</span></div>
          </div>
          <div style={{ color: "rgba(255,255,255,.55)", fontSize: 13, marginBottom: 4 }}>Pass Type</div>
          <div className="pass-title" style={{ color: "#FFFFFF", fontSize: 21, fontWeight: 650 }}>Engineering Test Pass</div>
          <div className="pass-meta-row" style={{ marginTop: "auto", display: "flex", alignItems: "end", justifyContent: "space-between", gap: 18 }}>
            <div>
              <div style={{ color: "rgba(255,255,255,.55)", fontSize: 13, marginBottom: 8 }}>4 exams covered · {totalTests} tests</div>
              <div className="pass-exam-row" style={{ display: "flex", paddingLeft: 2 }}>
                {examChips.map((exam) => (
                  <span key={exam.name} className={`pass-mini-chip${exam.wide ? " logo-wide" : ""}`} title={exam.name} aria-label={exam.name}>
                    <img src={exam.logo} alt={exam.name} />
                  </span>
                ))}
              </div>
            </div>
            <div className="pass-validity" style={{ textAlign: "right" }}>
              <div style={{ color: "rgba(255,255,255,.55)", fontSize: 13, marginBottom: 8 }}>Validity</div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 5, flexWrap: "wrap", maxWidth: 188 }}>
                {validityOptions.map(v => <span key={v} className="pass-validity-pill">{v}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassPlanCards({ compact = false, activePass, onSelect, plans = PASS_PLANS }) {
  const status = passStatus(activePass);
  const canActivate = typeof onSelect === "function";
  const visiblePlans = (plans && plans.length ? plans : PASS_PLANS).filter(p => p.isActive !== false);
  const gridStyle = compact
    ? { gridTemplateColumns: "repeat(auto-fill,minmax(180px,240px))", justifyContent: "start" }
    : { gridTemplateColumns: "repeat(auto-fill,minmax(230px,300px))", justifyContent: "start" };
  return (
    <div className="pass-plan-grid" style={gridStyle}>
      {visiblePlans.map(plan => {
        const isActive = status.active && activePass?.planId === plan.id;
        const disabled = isActive || !canActivate;
        return (
          <div key={plan.id} className="card landing-hover-card pass-plan-card" style={{ padding: compact ? 14 : 16, borderColor: isActive ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.08)", background: isActive ? "rgba(16,185,129,0.08)" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ color: "#F1F5F9", fontSize: compact ? 13 : 15, fontWeight: 800 }}>{plan.name}</div>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>{plan.label} access</div>
              </div>
              <span className={isActive ? "tag tag-green" : "tag tag-purple"} style={{ height: 22 }}>{isActive ? "Active" : plan.badge}</span>
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 7, marginBottom: 9 }}>
              <span style={{ color: "#F8FAFC", fontSize: compact ? 22 : 26, fontWeight: 850 }}>₹{plan.price}</span>
              <span style={{ color: "#475569", fontSize: 12, textDecoration: "line-through", marginBottom: 4 }}>₹{plan.originalPrice}</span>
            </div>
            <div style={{ color: "#64748B", fontSize: 11, lineHeight: 1.5, minHeight: compact ? 0 : 34 }}>{plan.note}</div>
            <div className="pass-plan-action">
              <button type="button" className={isActive || !canActivate ? "btn-ghost" : "btn-primary"} onClick={() => canActivate && onSelect(plan)} disabled={disabled}>
                {isActive ? `${status.daysLeft} days left` : canActivate ? "Activate pass" : "Log in to activate"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage({ onLogin, passPlans = PASS_PLANS }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [dbStatus, setDbStatus] = useState({ state: "checking", label: "Checking database..." });
  const [publicCourses, setPublicCourses] = useState([]);
  const [fieldNonce] = useState(() => Math.random().toString(36).slice(2));

  useEffect(() => {
    let cancelled = false;
    async function checkDb() {
      setDbStatus({ state: "checking", label: "Checking database..." });
      const res = await fetch(`${IMPORTER_API}/health`, { cache: "no-store" }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (cancelled) return;
      if (res?.ok && data?.ok) setDbStatus({ state: "connected", label: "Database connected" });
      else setDbStatus({ state: "error", label: "Database offline" });
    }
    checkDb();
    fetch(`${IMPORTER_API}/library`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled || !data?.courses) return;
        setPublicCourses(data.courses || []);
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, []);

  async function handleLogin() {
    if (dbStatus.state !== "connected") { setErr("Database is not connected yet. Try again after it turns green."); return; }
    setErr("");
    const res = await fetch(`${IMPORTER_API}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (res?.ok && data?.user) onLogin({ ...data.user, syncedCourseIds: (data.coursesOpted || []).map(c => c.id).filter(Boolean), pass: data.pass || data.user.pass });
    else setErr(data?.error || "Invalid email or password.");
  }

  async function handleSignup() {
    if (dbStatus.state !== "connected") { setErr("Database is not connected yet. Try again after it turns green."); return; }
    if (!name || !email || !password) { setErr("All fields required."); return; }
    setErr("");
    const res = await fetch(`${IMPORTER_API}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup", name, email, password }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (res?.ok && data?.user) onLogin(data.user);
    else setErr(data?.error || "Could not create account.");
  }

  const authReady = dbStatus.state === "connected";
  const visibleCourses = (publicCourses || []).slice(0, 4);
  const totalTests = (publicCourses || []).reduce((a, c) => a + configuredTestCount(c), 0);
  const connectionTone = dbStatus.state === "connected"
    ? { border: "rgba(16,185,129,0.28)", bg: "rgba(16,185,129,0.07)", color: "#34D399", icon: "check-circle" }
    : dbStatus.state === "checking"
      ? { border: "rgba(251,191,36,0.25)", bg: "rgba(251,191,36,0.07)", color: "#FCD34D", icon: "clock" }
      : { border: "rgba(239,68,68,0.28)", bg: "rgba(239,68,68,0.07)", color: "#F87171", icon: "alert-tri" };
  const scrollToAuth = (nextTab) => {
    setTab(nextTab);
    setErr("");
    setTimeout(() => document.getElementById("landing-auth")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };

  return (
    <div className="landing-shell">
      <div className="landing-wrap">
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 46, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800 }}>R</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>RankBooster</div>
              <div style={{ fontSize: 11, color: "#475569" }}>Offline-ready test series platform</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 190, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 999, border: `1px solid ${connectionTone.border}`, background: connectionTone.bg, color: connectionTone.color, fontSize: 12, fontWeight: 750 }}>
              <Icon n={connectionTone.icon} s={14} />
              <span>{dbStatus.label}</span>
              {dbStatus.state !== "connected" && (
                <button type="button" className="btn-ghost" onClick={() => window.location.reload()} style={{ minHeight: 24, padding: "2px 7px", fontSize: 10, marginLeft: 2 }}>Retry</button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="btn-ghost signin-nudge" onClick={() => scrollToAuth("login")}><LoginNudgeIcon s={14} />Log In</button>
            <button className="btn-primary" onClick={() => scrollToAuth("signup")}><Icon n="plus" s={14} />Sign Up</button>
          </div>
        </header>

        <main className="landing-main">
          <section className="fade-in">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 10px", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 999, background: "rgba(124,58,237,0.1)", color: "#A78BFA", fontSize: 12, fontWeight: 700, marginBottom: 18 }}>
              <Icon n="zap" s={13} />Built for serious mock-test practice
            </div>
            <h1 style={{ maxWidth: 790, fontSize: 48, lineHeight: 1.05, letterSpacing: 0, fontWeight: 760, marginBottom: 16 }}>
              Buy one pass, join any course, and attempt every scheduled mock.
            </h1>
            <p style={{ maxWidth: 690, fontSize: 16, lineHeight: 1.75, color: "#64748B", marginBottom: 24 }}>
              Students choose daily, monthly, six-month, or yearly access. Once the pass is active, every available course can be joined from the dashboard.
            </p>
            <LandingPassCard courses={publicCourses} totalTests={totalTests} />
            <div className="landing-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, maxWidth: 820, marginBottom: 28 }}>
              {[
                ["Courses", publicCourses.length, "courses"],
                ["Tests", totalTests, "tests"],
                ["Access", "Online", "student portal"],
              ].map(([label, value, sub], idx) => (
                <div key={label} className="card landing-hover-card" style={{ padding: 16 }}>
                  <Icon n={idx === 0 ? "courses" : idx === 1 ? "tests" : "admin"} s={17} c="#A78BFA" />
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9", marginTop: 10 }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{label} · {sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn-primary" style={{ padding: "12px 18px" }} onClick={() => scrollToAuth("signup")}><Icon n="check-circle" s={15} />Start Learning</button>
              <button className="btn-ghost" style={{ padding: "12px 18px" }} onClick={() => document.getElementById("landing-plans")?.scrollIntoView({ behavior: "smooth" })}><Icon n="rupee" s={15} />View Passes</button>
            </div>
          </section>

          <aside id="landing-auth" className="card fade-in landing-hover-card landing-auth-card" style={{ padding: 24, position: "sticky", top: 22, borderColor: "rgba(255,255,255,0.1)" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9" }}>{tab === "login" ? "Welcome back" : "Create your account"}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{tab === "login" ? "Continue to your tests and analysis." : "Sign up and enroll in available test series."}</div>
            </div>
            <div className="landing-auth-tabs" style={{ "--auth-tab-index": tab === "login" ? 0 : 1, marginBottom: 14 }}>
              {["login", "signup"].map(t => (
                <button key={t} className={`landing-auth-tab ${tab === t ? "active" : ""}`} onClick={() => { setTab(t); setErr(""); }}>
                  {t === "login" ? "Log In" : "Sign Up"}
                </button>
              ))}
            </div>

            <div className="landing-auth-form">
              {tab === "signup" && (
                <div className="landing-signup-row" style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: "#64748B", marginBottom: 5, display: "block" }}>Full Name</label>
                  <input className="input-field" name={`rb_name_${fieldNonce}`} autoComplete="off" spellCheck="false" placeholder="Arjun Mehta" value={name} onChange={e => setName(e.target.value)} />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#64748B", marginBottom: 5, display: "block" }}>Email</label>
                <input className="input-field" type="text" inputMode="email" name={`rb_mail_${fieldNonce}`} autoComplete="off" autoCorrect="off" spellCheck="false" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && authReady && (tab === "login" ? handleLogin() : handleSignup())} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#64748B", marginBottom: 5, display: "block" }}>Password</label>
                <input className="input-field" type="password" name={`rb_key_${fieldNonce}`} autoComplete="new-password" autoCorrect="off" spellCheck="false" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && authReady && (tab === "login" ? handleLogin() : handleSignup())} />
              </div>
              {err && <div style={{ fontSize: 12, color: "#F87171", marginBottom: 10, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 8 }}>{err}</div>}
              <button className={`btn-primary ${tab === "login" ? "signin-nudge" : ""}`} disabled={!authReady} style={{ width: "100%", padding: 12, fontSize: 14, marginTop: 0, marginBottom: tab === "login" ? 10 : 0, opacity: authReady ? 1 : 0.55, cursor: authReady ? "pointer" : "not-allowed" }} onClick={tab === "login" ? handleLogin : handleSignup}>
                {tab === "login" ? <><LoginNudgeIcon s={14} />Log In</> : <><Icon n="plus" s={14} />Create Account</>}
              </button>
            </div>
          </aside>
        </main>

        <section id="landing-plans" style={{ marginTop: 52 }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>Choose your pass</h2>
              <p style={{ fontSize: 13, color: "#64748B" }}>Choose access duration and unlock every available course.</p>
            </div>
            <button className="btn-ghost" onClick={() => scrollToAuth("signup")}><Icon n="check-circle" s={14} />Create account</button>
          </div>
          <PassPlanCards plans={passPlans} />
        </section>

        <section id="landing-courses" style={{ marginTop: 52 }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>Courses included in pass</h2>
              <p style={{ fontSize: 13, color: "#64748B" }}>After buying a pass, students can enroll into any course listed here.</p>
            </div>
            <button className="btn-ghost" onClick={() => scrollToAuth("signup")}><Icon n="plus" s={14} />Join to enroll</button>
          </div>

          {visibleCourses.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: "center" }}>
              <Icon n="folder" s={28} c="#475569" />
              <div style={{ color: "#94A3B8", marginTop: 10, fontSize: 13 }}>No public courses yet. Add courses from Admin Panel.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,360px))", justifyContent: "start", gap: 14 }}>
              {visibleCourses.map(course => {
                const testCount = configuredTestCount(course);
                return (
                  <div key={course.id || course.title} className="card card-hover landing-hover-card landing-course-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ height: 4, background: course.color || "#7C3AED" }} />
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                        <div title={course.title} style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", lineHeight: 1.25, overflowWrap: "anywhere" }}>{course.title}</div>
                        <span className="tag tag-purple" style={{ flexShrink: 0 }}>{course.badge || "New"}</span>
                      </div>
                      <div style={{ color: "#64748B", fontSize: 12, lineHeight: 1.45, marginBottom: 10 }}>{course.subtitle || course.description || "Mock test series"}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        {(course.subjects || []).slice(0, 4).map(s => <span key={s} className="tag" style={{ background: "rgba(124,58,237,0.16)", color: "#A78BFA", fontSize: 10 }}>{s}</span>)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ color: course.textColor || "#A78BFA", fontSize: 15, fontWeight: 800 }}>Included</div>
                          <div style={{ color: "#475569", fontSize: 11 }}>{testCount} tests available</div>
                        </div>
                        <button className="btn-ghost" style={{ minHeight: 34, padding: "7px 11px", fontSize: 12 }} onClick={() => scrollToAuth("signup")}>Enroll</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ user, page, setPage, courses, userCourseIds, collapsed, setCollapsed, onLogout }) {
  const [openCourse, setOpenCourse] = useState(null);
  const [openFolder, setOpenFolder] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [savedAttempts, setSavedAttempts] = useState([]);
  const accountRef = useRef(null);

  const myCourses = courses.filter(c => userCourseIds.includes(c.id));
  useEffect(() => {
    let cancelled = false;
    setSavedAttempts([]);
    if (user?.offlineId) {
      fetch(`${IMPORTER_API}/attempts?offlineId=${encodeURIComponent(user.offlineId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (!cancelled && data?.attempts) setSavedAttempts(data.attempts); })
        .catch(() => null);
    }
    return () => { cancelled = true; };
  }, [user?.id, user?.offlineId]);

  const attemptsForCourse = (course) => savedAttempts.filter(a => {
    const courseTitle = a.courseTitle || a.source?.courseTitle;
    return courseTitle === course?.title || a.courseId === course?.id || a.source?.courseId === course?.id;
  });
  const totalOptedTests = myCourses.reduce((a, c) => a + (c.testFolders || []).reduce((b, f) => b + (f.tests || []).length, 0), 0);
  const totalDoneTests = savedAttempts.length;
  const completionPct = totalOptedTests ? Math.round((totalDoneTests / totalOptedTests) * 100) : 0;

  useEffect(() => {
    if (!accountOpen) return undefined;
    const closeOnOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [accountOpen]);

  const mainNavItems = [
    { id: "dashboard", label: "Home", icon: "home" },
    { id: "courses", label: "My Courses", icon: "courses" },
    { id: "tests", label: "Tests", icon: "tests", hasSub: true },
    { id: "analysis", label: "Analysis", icon: "analysis" },
    { id: "notebook", label: "Notebook", icon: "notebook" },
  ];

  return (
    <div className={`sidebar-shell ${collapsed ? "is-collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo-row">
        <div className="sidebar-brand">
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>R</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#E2E8F0", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>RankBooster</span>
        </div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          <Icon n={collapsed ? "chevright" : "chevleft"} s={15} />
        </button>
      </div>

      <div className="sidebar-nav">
        {!collapsed && <div className="sidebar-section">Main</div>}

        {mainNavItems.map(item => (
          <div key={item.id}>
            {/* Main nav item */}
            <div
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => {
                if (item.id === "tests") {
                  if (!collapsed) setOpenCourse(openCourse ? null : (myCourses[0]?.id || null));
                }
                setPage(item.id);
              }}
            >
              <span className="sidebar-icon-wrap"><Icon n={item.icon} s={17} /></span>
              {!collapsed && (
                <>
                  <span className="sidebar-label">{item.label}</span>
                  {item.hasSub && myCourses.length > 0 && (
                    <span onClick={e => { e.stopPropagation(); setOpenCourse(openCourse ? null : myCourses[0].id); }}>
                      <Icon n={openCourse ? "chevdown" : "chevright"} s={13} />
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Sub-nav for Tests */}
            {!collapsed && item.id === "tests" && openCourse && page === "tests" && (
              <div className="nav-tree-panel" style={{ marginLeft: 8, marginBottom: 4 }}>
                {myCourses.map(course => (
                  <div key={course.id}>
                    <div
                      className="nav-branch"
                      style={{ padding: "6px 8px 6px 16px", fontSize: 12, color: openCourse === course.id ? "#CBD5E1" : "#475569" }}
                      onClick={() => setOpenCourse(openCourse === course.id ? null : course.id)}
                    >
                      <Icon n={openCourse === course.id ? "chevdown" : "chevright"} s={11} />
                      <span title={course.title} style={{ flex: 1, whiteSpace: "normal", overflow: "hidden", overflowWrap: "anywhere", lineHeight: 1.25 }}>{course.title}</span>
                    </div>
                    {openCourse === course.id && (
                      <div className="dropdown-panel">
                      {course.testFolders.map(folder => (
                      <div key={folder.id}>
                        <div
                          className="nav-branch"
                          style={{ padding: "5px 8px 5px 28px", fontSize: 11.5, color: openFolder === folder.id ? "#94A3B8" : "#334155" }}
                          onClick={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}
                        >
                          <Icon n={folder.icon || "folder"} s={13} />
                          <span style={{ flex: 1, whiteSpace: "nowrap" }}>{folder.name}</span>
                          <Icon n={openFolder === folder.id ? "chevdown" : "chevright"} s={10} />
                        </div>
                        {openFolder === folder.id && (
                          <div className="dropdown-panel">
                          {folder.tests.map(test => (
                          <div key={test.id} className="nav-leaf" style={{ padding: "4px 8px 4px 38px", fontSize: 11, color: "#334155", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#64748B"}
                            onMouseLeave={e => e.currentTarget.style.color = "#334155"}>
                            <Icon n={test.attempted ? "check-circle" : "clipboard"} s={11} c={test.attempted ? "#34D399" : "#475569"} /><span style={{marginLeft:4}}>{test.name.split("–")[0].trim()}</span>
                          </div>
                          ))}
                          </div>
                        )}
                      </div>
                      ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {!collapsed && <div className="sidebar-section" style={{ marginTop: 8 }}>Account</div>}

        {user.role === "admin" && (
          <div className={`nav-item admin-item ${page === "admin" ? "active" : ""}`} onClick={() => setPage("admin")}>
            <span className="sidebar-icon-wrap" style={{ color: "#FCD34D" }}><Icon n="admin" s={17} c="#FCD34D" /></span>
            {!collapsed && <span className="sidebar-label">Admin Panel</span>}
          </div>
        )}

        <div className={`nav-item ${page === "settings" ? "active" : ""}`} onClick={() => setPage("settings")}>
          <span className="sidebar-icon-wrap"><Icon n="settings" s={17} /></span>
          {!collapsed && <span className="sidebar-label">Settings</span>}
        </div>
      </div>

      {/* User footer */}
      <div ref={accountRef} className="sidebar-footer">
        {accountOpen && (
          <div className="account-popover">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{user.avatar}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: "#F1F5F9", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ color: "#64748B", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user.email}>{user.role === "admin" ? "Admin" : "Student"} · {user.email}</div>
              </div>
              <Icon n="chevdown" s={14} c="#64748B" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7, marginBottom: 12 }}>
              {[
                ["Courses", myCourses.length],
                ["Given", totalDoneTests],
                ["Done", `${completionPct}%`],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: "8px 5px", borderRadius: 10, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.16)", textAlign: "center", minWidth: 0 }}>
                  <div style={{ color: "#EDE9FE", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
                  <div style={{ color: "#64748B", fontSize: 10 }}>{label}</div>
                </div>
              ))}
            </div>
            {myCourses.length === 0 ? (
              <div style={{ color: "#475569", fontSize: 12, padding: "8px 0" }}>No courses opted yet.</div>
            ) : myCourses.map(course => {
              const done = attemptsForCourse(course).length;
              const total = configuredTestCount(course);
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div key={course.id} className="account-popover-row">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
                    <span title={course.title} style={{ color: "#CBD5E1", fontSize: 12, lineHeight: 1.25, overflowWrap: "anywhere" }}>{course.title}</span>
                    <span style={{ color: "#A78BFA", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{done}/{total}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: course.color || "#7C3AED" }} />
                  </div>
                </div>
              );
            })}
            <button className="btn-danger signout-nudge" style={{ width: "100%", minHeight: 36, marginTop: 10, padding: "8px 12px", fontSize: 12 }} onClick={onLogout}>
              <LogoutNudgeIcon s={13} />
              Sign Out
            </button>
          </div>
        )}
        <div className="account-card" onClick={() => setAccountOpen(v => !v)}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{user.avatar}</div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>{user.role === "admin" ? "Admin" : "Student"}</div>
            </div>
          )}
          {!collapsed && <Icon n={accountOpen ? "chevdown" : "chevright"} s={13} c="#64748B" />}
        </div>
      </div>
    </div>
  );
}

// ─── COURSES PAGE ─────────────────────────────────────────────────────────────
function CoursesPage({ courses, userCourseIds, setUserCourseIds, userId, user, onUserUpdate, passPlans = PASS_PLANS, appSettings = DEFAULT_SETTINGS, notify }) {
  const myCourses = courses.filter(c => userCourseIds.includes(c.id));
  const available = courses.filter(c => !userCourseIds.includes(c.id));
  const [savedAttempts, setSavedAttempts] = useState([]);
  const [passBusy, setPassBusy] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentStep, setPaymentStep] = useState("qr");
  const [utr, setUtr] = useState("");
  const [pendingOrders, setPendingOrders] = useState([]);
  const currentPass = user?.pass;
  const currentPassStatus = passStatus(currentPass);
  const paymentSettings = { ...DEFAULT_SETTINGS.payments, ...(appSettings.payments || {}) };

  useEffect(() => {
    let cancelled = false;
    setSavedAttempts([]);
    if (!user?.offlineId) return undefined;
    fetch(`${IMPORTER_API}/attempts?offlineId=${encodeURIComponent(user.offlineId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.attempts) setSavedAttempts(data.attempts);
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [user?.id, user?.offlineId]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.offlineId) return undefined;
    fetch(`${IMPORTER_API}/payments?offlineId=${encodeURIComponent(user.offlineId)}&status=pending`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (!cancelled) setPendingOrders(data?.orders || []); })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [user?.offlineId, passBusy]);

  async function activatePlan(plan) {
    if (paymentSettings.enabled) {
      setPaymentModal(plan);
      setUtr("");
      setPaymentStep("qr");
      return;
    }
    setPassBusy(plan.id);
    const updatedUser = { ...user, pass: createPass(plan) };
    onUserUpdate?.(updatedUser);
    const res = await fetch(`${IMPORTER_API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: updatedUser, profileUpdate: true }),
    }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (data?.user) onUserUpdate?.({ ...updatedUser, ...data.user, pass: data.pass || data.user.pass || updatedUser.pass });
    setPassBusy("");
  }

  async function submitPaymentOrder() {
    if (!paymentModal) return;
    if (!paymentSettings.upiId) {
      notify?.("Payment UPI is not configured yet.", "error");
      return;
    }
    if (!utr.trim() || utr.trim().length < 6) {
      notify?.("Enter a valid UTR/reference ID.", "error");
      return;
    }
    setPassBusy(paymentModal.id);
    try {
      const res = await fetch(`${IMPORTER_API}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, plan: paymentModal, utr: utr.trim(), note: "Student submitted UPI payment" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Payment submission failed.");
      notify?.("Payment submitted. Your pass will activate after admin approval.", "success");
      setPendingOrders(prev => [data.order, ...prev.filter(o => o.id !== data.order?.id)].filter(Boolean));
      setPaymentModal(null);
      setUtr("");
    } catch (err) {
      notify?.(err.message || "Payment submission failed.", "error");
    } finally {
      setPassBusy("");
    }
  }

  async function enroll(courseId) {
    if (!currentPassStatus.active) return;
    const nu = [...new Set([...userCourseIds, courseId])];
    setUserCourseIds(nu);
    const coursesOpted = nu.map(id => {
      const course = courses.find(c => c.id === id);
      return course ? { id: course.id, title: course.title, folderName: course.folderName || course.title, optedAt: new Date().toISOString() } : null;
    }).filter(Boolean);
    const res = await fetch(`${IMPORTER_API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, coursesOpted }),
    }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (data?.coursesOpted) setUserCourseIds(data.coursesOpted.map(c => c.id).filter(Boolean));
    if (data?.user) onUserUpdate?.({ ...user, ...data.user, pass: data.pass || data.user.pass || user.pass });
  }

  function isAttemptForTest(attempt, course, folder, test) {
    const courseTitle = attempt.courseTitle || attempt.source?.courseTitle;
    const folderName = attempt.folderName || attempt.source?.folderName;
    const testName = attempt.testName || attempt.source?.testName;
    const testId = attempt.testId || attempt.source?.testId;
    const sourceZip = attempt.sourceZip || attempt.source?.sourceZip;
    const sameCourse = courseTitle === course?.title || attempt.courseId === course?.id || attempt.source?.courseId === course?.id;
    const sameFolder = !folderName || folderName === folder?.name;
    const sameTest = testId === test?.id || sourceZip === test?.sourceZip || testName === test?.name;
    return sameCourse && sameFolder && sameTest;
  }

  function completedTestsForCourse(course) {
    return (course.testFolders || []).reduce((count, folder) => {
      const doneInFolder = configuredTests(folder).filter(test =>
        test.attempted || savedAttempts.some(attempt => isAttemptForTest(attempt, course, folder, test))
      ).length;
      return count + doneInFolder;
    }, 0);
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>My Courses</h2>
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 24 }}>Activate a pass, then enroll into any course you want</p>

      <div className="card" style={{ marginBottom: 18, borderColor: currentPassStatus.active ? "rgba(52,211,153,0.28)" : "rgba(124,58,237,0.2)" }}>
        <div className="responsive-split" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", marginBottom: currentPassStatus.active ? 0 : 14 }}>
          <div>
            <div style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 800 }}>{currentPassStatus.active ? currentPassStatus.label : "Choose a pass to unlock courses"}</div>
            <div style={{ color: "#64748B", fontSize: 12, marginTop: 3 }}>
              {currentPassStatus.active ? `${currentPassStatus.daysLeft} days left · expires ${formatDateTime(currentPassStatus.expiresAt)}` : "Choose a pass duration to continue."}
            </div>
          </div>
          {currentPassStatus.active && <span className="tag tag-green">Pass Active</span>}
        </div>
        {!currentPassStatus.active && (
          <div style={{ opacity: passBusy ? 0.65 : 1, pointerEvents: passBusy ? "none" : "auto" }}>
            <PassPlanCards compact activePass={currentPass} onSelect={activatePlan} plans={passPlans} />
          </div>
        )}
        {!currentPassStatus.active && pendingOrders.length > 0 && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)", color: "#FCD34D", fontSize: 12, fontWeight: 750 }}>
            {pendingOrders.length} payment request{pendingOrders.length === 1 ? "" : "s"} pending admin approval.
          </div>
        )}
      </div>

      {myCourses.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ marginBottom: 12, display:"flex", justifyContent:"center" }}><Icon n="books" s={36} c="#475569" /></div>
          <div style={{ fontSize: 15, color: "#94A3B8" }}>No courses enrolled yet</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Browse available courses below</div>
        </div>
      )}

      {myCourses.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Enrolled ({myCourses.length})</div>
          <div className="responsive-grid course-card-grid" style={{ marginBottom: 32 }}>
            {myCourses.map(c => <CourseCard key={c.id} course={c} enrolled completedTests={completedTestsForCourse(c)} onEnroll={() => {}} />)}
          </div>
        </>
      )}

      {available.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Available Courses</div>
          <div className="responsive-grid course-card-grid">
            {available.map(c => <CourseCard key={c.id} course={c} passActive={currentPassStatus.active} onEnroll={() => enroll(c.id)} />)}
          </div>
        </>
      )}
      {paymentModal && (
        <Modal onClose={() => setPaymentModal(null)} title="Complete UPI Payment">
          <div style={{ display: "grid", gap: 14 }}>
            <div className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 850 }}>{paymentModal.name}</div>
                <div style={{ color: "#64748B", fontSize: 12 }}>{paymentModal.label || `${paymentModal.durationDays} days`} access</div>
              </div>
              <div style={{ color: "#A78BFA", fontSize: 22, fontWeight: 900 }}>₹{Number(paymentModal.price || 0)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", gap: 14, alignItems: "center" }}>
              <div style={{ padding: 12, background: "white", borderRadius: 14, display: "grid", placeItems: "center" }}>
                <img alt="UPI QR code" style={{ width: 196, height: 196, display: "block" }} src={qrImageUrl(upiPaymentUrl({ upiId: paymentSettings.upiId, payeeName: paymentSettings.payeeName, amount: paymentModal.price, note: "RankBooster Pass", orderId: paymentModal.id }))} />
              </div>
              <div>
                <div style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{paymentSettings.note}</div>
                <div style={{ color: "#64748B", fontSize: 12, marginBottom: 5 }}>Pay to</div>
                <div style={{ color: "#F1F5F9", fontWeight: 850, marginBottom: 12 }}>{paymentSettings.upiId}</div>
                {paymentStep === "utr" ? (
                  <>
                    <label style={{ color: "#64748B", fontSize: 11, display: "block", marginBottom: 5 }}>UTR / Reference ID</label>
                    <input className="input-field" value={utr} onChange={e => setUtr(e.target.value)} placeholder="Enter UTR after payment" autoFocus />
                  </>
                ) : (
                  <div style={{ padding: 12, borderRadius: 12, background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.20)", color: "#C4B5FD", fontSize: 12, lineHeight: 1.6 }}>
                    Scan this QR and pay exactly ₹{Number(paymentModal.price || 0)}. After payment, click Paid to enter the UTR/reference ID.
                  </div>
                )}
              </div>
            </div>
            {paymentStep === "qr" ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="btn-ghost" onClick={() => setPaymentModal(null)}><Icon n="x" s={14} />Cancel</button>
                <button className="btn-primary" onClick={() => setPaymentStep("utr")}><Icon n="check" s={14} />Paid</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="btn-ghost" onClick={() => setPaymentStep("qr")}><Icon n="chevleft" s={14} />Back to QR</button>
                <button className="btn-primary" disabled={passBusy === paymentModal.id} onClick={submitPaymentOrder}>
                  <Icon n="check" s={14} />{passBusy === paymentModal.id ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function CourseCard({ course, enrolled, onEnroll, completedTests, passActive = true }) {
  const totalTests = configuredTestCount(course);
  const doneTests = Number.isFinite(completedTests)
    ? completedTests
    : (course.testFolders?.reduce((a, f) => a + configuredTests(f).filter(t => t.attempted).length, 0) || 0);
  const pct = totalTests ? Math.round((doneTests / totalTests) * 100) : 0;

  return (
    <div className="card card-hover" style={{ overflow: "hidden", padding: 0 }}>
      <div style={{ height: 6, background: course.color, opacity: 0.8 }} />
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0", lineHeight: 1.3, marginBottom: 3 }}>{course.title}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>{course.subtitle}</div>
          </div>
          <span className="tag" style={{ background: `${course.color}22`, color: course.textColor, flexShrink: 0, marginLeft: 8 }}>{course.badge}</span>
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 12, lineHeight: 1.5 }}>{course.description}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {course.subjects.map(s => <span key={s} className="tag tag-purple" style={{ fontSize: 10 }}>{s}</span>)}
        </div>
        {enrolled && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#64748B" }}>Progress</span>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>{doneTests}/{totalTests} tests</span>
            </div>
            <div className="progress-bar">
              <div key={`${course.id}_${doneTests}_${totalTests}`} className="progress-fill" style={{ width: `${pct}%`, background: course.color || "#7C3AED" }} />
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: course.textColor }}>{passActive ? "Included" : `₹${course.price.toLocaleString()}`}</span>
            {!passActive && <span style={{ fontSize: 12, color: "#334155", textDecoration: "line-through", marginLeft: 6 }}>₹{course.originalPrice.toLocaleString()}</span>}
          </div>
          {enrolled
            ? <span className="tag tag-green" style={{display:"inline-flex",alignItems:"center",gap:4}}><Icon n="check" s={11} /> Enrolled</span>
            : <button className={passActive ? "btn-primary" : "btn-ghost"} disabled={!passActive} style={{ padding: "10px 20px", fontSize: 13 }} onClick={onEnroll}>{passActive ? "Enroll Now" : "Pass needed"}</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── TESTS PAGE ───────────────────────────────────────────────────────────────
function TestsPage({ courses, setCoursesView, userCourseIds, onStartTest, onSetPage, onViewAnalysis, user }) {
  const myCourses = courses.filter(c => userCourseIds.includes(c.id));
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || null);
  const [openFolders, setOpenFolders] = useState({});
  const [attemptModal, setAttemptModal] = useState(null);
  const [savedAttempts, setSavedAttempts] = useState([]);
  const [loadingTestId, setLoadingTestId] = useState(null);
  const selectedCourseObjRaw = myCourses.find(c => c.id === selectedCourse);
  const selectedCourseObj = selectedCourseObjRaw ? { ...selectedCourseObjRaw, testFolders: configuredFolders(selectedCourseObjRaw) } : null;

  useEffect(() => {
    let cancelled = false;
    setSavedAttempts([]);
    if (!user?.offlineId) return undefined;
    fetch(`${IMPORTER_API}/attempts?offlineId=${encodeURIComponent(user.offlineId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.attempts) setSavedAttempts(data.attempts);
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [user?.id, user?.offlineId]);

  function toggleFolder(fid) {
    setOpenFolders(p => ({ ...p, [fid]: !p[fid] }));
  }

  function savedAttemptFor(course, folder, test) {
    return savedAttempts.find(a => {
      const courseTitle = a.courseTitle || a.source?.courseTitle;
      const folderName = a.folderName || a.source?.folderName;
      const testName = a.testName || a.source?.testName;
      const testId = a.testId || a.source?.testId;
      const sourceZip = a.sourceZip || a.source?.sourceZip;
      const sourceUrl = a.sourceUrl || a.source?.sourceUrl;
      const sameCourse = courseTitle === course?.title || a.courseId === course?.id || a.source?.courseId === course?.id;
      const sameFolder = !folderName || folderName === folder?.name;
      const sameTest = testId === test?.id || sourceZip === test?.sourceZip || sameExternalUrl(sourceUrl, test?.sourceUrl) || testName === test?.name;
      return sameCourse && sameFolder && sameTest;
    });
  }

  function forgetLocalAttempt(course, folder, test, attempt) {
    const attemptId = attempt?.attemptId;
    const matchesTest = a => {
      if (attemptId && a.attemptId === attemptId) return true;
      const courseTitle = a.courseTitle || a.source?.courseTitle;
      const folderName = a.folderName || a.source?.folderName;
      const testName = a.testName || a.source?.testName;
      const sourceZip = a.sourceZip || a.source?.sourceZip;
      const sourceUrl = a.sourceUrl || a.source?.sourceUrl;
      return (courseTitle === course?.title || a.courseId === course?.id || a.source?.courseId === course?.id)
        && (!folderName || folderName === folder?.name)
        && (sourceZip === test?.sourceZip || sameExternalUrl(sourceUrl, test?.sourceUrl) || testName === test?.name || a.testId === test?.id || a.source?.testId === test?.id);
    };

    setSavedAttempts(prev => prev.filter(a => !matchesTest(a)));
  }

  async function deleteAttempt(course, folder, test, attempt, ask = true) {
    if (!attempt?.attemptId) return false;
    if (ask && !window.confirm("Delete this attempt? Its score, analysis, and saved answers will be removed.")) return false;
    forgetLocalAttempt(course, folder, test, attempt);
    await fetch(`${IMPORTER_API}/attempts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offlineId: user?.offlineId, attemptId: attempt.attemptId }),
    }).catch(() => null);
    return true;
  }

  async function handleReattempt(course, folder, test, attempt) {
    if (!window.confirm("Reattempt this test? Your old attempt, score, analysis, and saved answers will be deleted.")) return;
    if (attempt?.attemptId) await deleteAttempt(course, folder, test, attempt, false);
    await handleStartTest(course, folder, test);
  }

  async function handleStartTest(course, folder, test) {
    const testId = test.id || `${folder?.name}_${test.name}`;
    setLoadingTestId(testId);
    try {
      let fullTest = test;
      if (test.sourceUrl) {
        const data = await loadExternalTestJson(test.sourceUrl);
        if (data) {
          fullTest = {
            ...data,
            id: test.id,
            name: test.name,
            title: test.name,
            duration: test.duration || data.duration,
            maxMarks: test.maxMarks || data.maxMarks,
            sourceUrl: normalizeExternalTestUrl(test.sourceUrl),
            examType: test.examType || data.examType,
            examConfig: {
              ...(data.examConfig || data.config || {}),
              ...(test.examConfig || test.config || {}),
            },
          };
        }
      } else if (test.sourceZip && (test.imagesMissing || !(test.subjects || []).some(s => (s.questions || []).some(q => q.images?.length)))) {
        const qs = new URLSearchParams({
          course: course.folderName || course.title,
          folder: test.sourceFolder || folder.name,
          zip: test.sourceZip,
        });
        const res = await fetch(`${IMPORTER_API}/test?${qs.toString()}`).catch(() => null);
        const data = res?.ok ? await res.json() : null;
        if (data?.test) fullTest = data.test;
      }
      onStartTest({
        ...fullTest,
        courseId: course?.id,
        courseTitle: course?.title,
        folderId: folder.id,
        folderName: folder.name,
        id: test.id || fullTest.id,
        name: test.name || fullTest.name,
        title: test.name || fullTest.title,
        sourceUrl: normalizeExternalTestUrl(test.sourceUrl || fullTest.sourceUrl || ""),
        examType: test.examType || fullTest.examType,
        examConfig: {
          ...(fullTest.examConfig || fullTest.config || {}),
          ...(test.examConfig || test.config || {}),
        },
      });
    } finally {
      setLoadingTestId(null);
    }
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Tests</h2>
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>All your test series in one place</p>

      {myCourses.length === 0 && <div className="card" style={{ textAlign: "center", padding: 40, color: "#475569" }}>Enroll in a course to access tests.</div>}

      {myCourses.length > 0 && (
        <div className="tests-layout">
          {/* Course selector */}
          <div className="tests-course-rail">
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Select Course</div>
            <div className="course-switch-list">
              {myCourses.map(c => {
                const total = configuredTestCount(c);
                const done = configuredFolders(c).reduce((sum, folder) => sum + configuredTests(folder).filter(test => savedAttemptFor(c, folder, test)).length, 0);
                const active = selectedCourse === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`course-switch-card ${active ? "active" : ""}`}
                    onClick={() => setSelectedCourse(c.id)}
                    style={{
                      "--course-accent": c.color || "#7C3AED",
                      "--course-text": c.textColor || "#A78BFA",
                      "--course-border": `${c.color || "#7C3AED"}70`,
                      "--course-bg": `${c.color || "#7C3AED"}18`,
                      "--course-glow": `${c.color || "#7C3AED"}28`,
                      "--course-progress": `${total ? Math.round((done / total) * 100) : 0}%`,
                    }}
                  >
                    <div className="course-switch-content">
                      <div className="course-switch-top">
                        <div>
                          <div className="course-switch-title" title={c.title}>{c.title}</div>
                          <div className="course-switch-meta">{done}/{total} tests done</div>
                        </div>
                        <span className="course-switch-dot" />
                      </div>
                      <div className="course-switch-progress"><span /></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Folders & Tests */}
          <div style={{ flex: 1 }}>
            {selectedCourseObj && selectedCourseObj.testFolders.map(folder => {
              const doneCount = folder.tests.filter(t => savedAttemptFor(selectedCourseObj, folder, t)).length;
              return (
              <div key={folder.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
                <div onClick={() => toggleFolder(folder.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}>
                  <Icon n={folder.icon || "folder"} s={20} c="#7C3AED" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0", flex: 1 }}>{folder.name}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{folder.tests.length} tests · {doneCount} done</span>
                  <Icon n={openFolders[folder.id] ? "chevdown" : "chevright"} s={14} c="#475569" />
                </div>
                {openFolders[folder.id] && (
                  <div className="dropdown-panel" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {folder.tests.map((test, i) => {
                      const savedAttempt = savedAttemptFor(selectedCourseObj, folder, test);
                      const attempted = !!savedAttempt;
                      const schedule = testScheduleState(test);
                      const score = savedAttempt ? Number(savedAttempt.score || 0) : test.score;
                      const maxMarks = savedAttempt ? Number(savedAttempt.maxMarks || test.maxMarks || 0) : test.maxMarks;
                      const performance = savedAttempt ? Number(savedAttempt.percentage ?? savedAttempt.percentile ?? 0) : test.percentile;
                      return (
                      <div key={test.id} className="test-item-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < folder.tests.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <div className="icon-tile" style={{ background: attempted ? "rgba(16,185,129,0.1)" : "rgba(124,58,237,0.1)", border: `1px solid ${attempted ? "rgba(16,185,129,0.22)" : "rgba(124,58,237,0.22)"}` }}>
                          <Icon n={attempted ? "check-circle" : "clipboard"} s={17} c={attempted ? "#34D399" : "#A78BFA"} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#E2E8F0" }}>{test.name}</div>
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                            {test.duration} min · {test.maxMarks} marks{test.date ? ` · ${test.date}` : ""}
                            {schedule.label && <span style={{ color: schedule.available ? "#34D399" : "#F59E0B", marginLeft: 8 }}>{schedule.label}</span>}
                          </div>
                        </div>
                        {attempted
                          ? <div style={{ textAlign: "right", minWidth: 70 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#34D399", lineHeight: 1.1 }}>{score}/{maxMarks}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>{performance}%</div>
                          </div>
                          : null
                        }
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {attempted && (
                            <>
                              <button className="btn-ghost test-action-btn" onClick={() => onViewAnalysis({ course: selectedCourseObj, folder, test, attempt: savedAttempt })}><Icon n="analysis" s={14} />Analysis</button>
                              <button className="btn-ghost test-action-btn" onClick={() => handleReattempt(selectedCourseObj, folder, test, savedAttempt)}><Icon n="repeat" s={14} />Reattempt</button>
                              <button className="btn-ghost test-action-btn danger" onClick={() => deleteAttempt(selectedCourseObj, folder, test, savedAttempt)}><Icon n="trash" s={14} />Delete</button>
                            </>
                          )}
                          {!attempted && (
                            <button className={schedule.available ? "btn-primary" : "btn-ghost"} disabled={loadingTestId === test.id || !schedule.available} style={{ padding: "9px 18px", fontSize: 13, minWidth: 128, opacity: loadingTestId === test.id ? 0.65 : 1 }} onClick={() => handleStartTest(selectedCourseObj, folder, test)}>
                              {loadingTestId === test.id ? "Loading..." : schedule.available ? "Start Test" : "Scheduled"}
                            </button>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      )}

      <Modal open={!!attemptModal} onClose={() => setAttemptModal(null)} title={attemptModal?.name || ""}>
        {attemptModal && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[["Duration", attemptModal.duration + " min"], ["Max Marks", attemptModal.maxMarks], ["Date", attemptModal.date], ["Status", attemptModal.attempted ? "Attempted" : "Not Attempted"]].map(([k, v]) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.04)", padding: "12px", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#E2E8F0" }}>{v}</div>
                </div>
              ))}
            </div>
            {attemptModal.attempted ? (
              <div style={{ padding: "14px", background: "rgba(16,185,129,0.08)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.15)", marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#34D399", fontWeight: 600 }}>Score: {attemptModal.score}/{attemptModal.maxMarks} · {attemptModal.percentile}%</div>
              </div>
            ) : null}
            <button className="btn-primary" style={{ width: "100%", padding: 11 }} onClick={() => attemptModal.attempted ? (setAttemptModal(null), onSetPage("analysis")) : (setAttemptModal(null), onStartTest(attemptModal))}>
              {attemptModal.attempted ? "View Full Analysis →" : "Start Test Now →"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ANALYSIS PAGE ────────────────────────────────────────────────────────────
function AnalysisPage({ courses, userCourseIds, user }) {
  const myCourses = courses.filter(c => userCourseIds.includes(c.id));
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || null);
  const [savedAttempts, setSavedAttempts] = useState([]);
  const course = myCourses.find(c => c.id === selectedCourse);

  useEffect(() => {
    let cancelled = false;
    setSavedAttempts([]);
    if (!user?.offlineId) return undefined;
    fetch(`${IMPORTER_API}/attempts?offlineId=${encodeURIComponent(user.offlineId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.attempts) setSavedAttempts(data.attempts);
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [user?.id, user?.offlineId]);

  const courseAttempts = course ? savedAttempts
    .filter(a => a.courseTitle === course.title || a.source?.courseTitle === course.title || a.courseId === course.id || a.source?.courseId === course.id)
    .map(a => ({
      id: a.attemptId || `${a.testName}_${a.submittedAt}`,
      name: a.testName || a.source?.testName || "Test",
      folder: a.folderName || a.source?.folderName || "Tests",
      score: Number(a.score || 0),
      maxMarks: Number(a.maxMarks || 0),
      percentile: Number(a.percentage ?? a.percentile ?? 0),
      date: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "",
      savedAttempt: true,
    })) : [];

  const courseFlagAttempts = course ? course.testFolders.flatMap(f => f.tests.filter(t => t.attempted).map(t => ({ ...t, folder: f.name }))) : [];
  const seenAttempts = new Set();
  const allAttempted = [...courseAttempts, ...courseFlagAttempts].filter(t => {
    const key = `${t.name}|${t.folder}|${t.date || ""}`;
    if (seenAttempts.has(key)) return false;
    seenAttempts.add(key);
    return true;
  });

  const chartData = allAttempted.map(t => ({ name: t.name.split(" ").slice(-2).join(" "), score: Math.round((t.score / t.maxMarks) * 100), percentile: t.percentile }));

  const avgScore = allAttempted.length ? Math.round(allAttempted.reduce((a, t) => a + (t.score / t.maxMarks) * 100, 0) / allAttempted.length) : 0;
  const avgPct = allAttempted.length ? (allAttempted.reduce((a, t) => a + (t.percentile || 0), 0) / allAttempted.length).toFixed(1) : 0;
  const bestPct = allAttempted.length ? Math.max(...allAttempted.map(t => t.percentile || 0)) : 0;
  const lastThree = allAttempted.slice(0, 3);
  const recentAvg = lastThree.length ? Math.round(lastThree.reduce((a, t) => a + (t.score / t.maxMarks) * 100, 0) / lastThree.length) : 0;
  const totalTimeMin = Math.round(allAttempted.reduce((a, t) => a + Number(t.timeSpentSec || 0), 0) / 60);
  const courseInsights = [
    allAttempted.length ? `Recent score average is ${recentAvg}%.` : "Attempt a test to unlock trend insights.",
    bestPct ? `Best recorded performance: ${bestPct}%.` : "Performance history will appear after attempts.",
    avgScore >= 70 ? "Course performance is strong. Focus on consistency." : avgScore >= 45 ? "You are building momentum. Review weak chapters after each test." : "Start with accuracy-first review before chasing speed.",
    totalTimeMin ? `Total active test time recorded: ${totalTimeMin} min.` : "Timing analytics starts from new attempts after this update.",
  ];

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Analysis</h2>
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>Performance breakdown by course</p>

      {myCourses.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: "#475569" }}>No courses enrolled.</div>}

      {myCourses.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {myCourses.map(c => (
              <button key={c.id} title={c.title} onClick={() => setSelectedCourse(c.id)} style={{ padding: "8px 16px", borderRadius: 9, border: `1px solid ${selectedCourse === c.id ? c.color : "rgba(255,255,255,0.1)"}`, background: selectedCourse === c.id ? c.color + "20" : "transparent", color: selectedCourse === c.id ? c.textColor : "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: selectedCourse === c.id ? 600 : 400 }}>
                {c.title}
              </button>
            ))}
          </div>

          {course && (
            <>
              <div className="responsive-stats-grid" style={{ marginBottom: 20 }}>
                {[
                  { l: "Tests Attempted", v: allAttempted.length + "/" + course.testFolders.reduce((a, f) => a + f.tests.length, 0) },
                  { l: "Avg Score", v: avgScore + "%" },
                  { l: "Avg Performance", v: `${avgPct}%` },
                  { l: "Best Performance", v: allAttempted.length ? `${bestPct}%` : "—" },
                ].map(s => (
                  <div key={s.l} className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9" }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {allAttempted.length > 0 ? (
                <>
                  <div className="responsive-two-col" style={{ marginBottom: 16 }}>
                    <div className="card">
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", marginBottom: 14 }}>Score Trend (%)</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={course.color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={course.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "#1E1B4B", border: "1px solid #4C1D95", borderRadius: 8, fontSize: 12 }} />
                          <Area type="monotone" dataKey="score" stroke={course.color} fill="url(#ag)" strokeWidth={2} dot={{ r: 4, fill: course.color }} name="Score %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="card">
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", marginBottom: 12 }}>Course Insights</div>
                      <div style={{ display: "grid", gap: 10 }}>
                        {courseInsights.map(x => (
                          <div key={x} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)", color: "#CBD5E1", fontSize: 12, lineHeight: 1.5 }}>{x}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 14 }}>Test-wise Breakdown</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr className="table-head">
                        {["Test", "Folder", "Score", "Performance", "Date"].map(h => <th key={h}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {allAttempted.map(t => (
                          <tr key={t.id} className="table-row">
                            <td style={{ color: "#CBD5E1" }}>{t.name}</td>
                            <td><span className="tag tag-purple" style={{ fontSize: 10 }}>{t.folder}</span></td>
                            <td style={{ color: "#34D399", fontWeight: 600 }}>{t.score}/{t.maxMarks}</td>
                            <td style={{ color: "#A78BFA", fontWeight: 600 }}>{t.percentile}%</td>
                            <td style={{ color: "#475569" }}>{t.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="card" style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ marginBottom: 10, display:"flex", justifyContent:"center" }}><Icon n="bar" s={28} c="#475569" /></div>
                  <div style={{ color: "#475569" }}>No tests attempted for this course yet.</div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── NOTEBOOK PAGE ────────────────────────────────────────────────────────────
function NotebookPage({ user }) {
  const userId = user.id;
  const [notebooks, setNotebooks] = useState([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(true);
  const [newNbModal, setNewNbModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedNb, setSelectedNb] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [practiceItem, setPracticeItem] = useState(null);
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceReveal, setPracticeReveal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingNotebooks(true);
    loadNotebookStore(user)
      .then(nbs => { if (!cancelled) setNotebooks(nbs); })
      .finally(() => { if (!cancelled) setLoadingNotebooks(false); });
    return () => { cancelled = true; };
  }, [user]);

  function save(nbs) {
    setNotebooks(nbs);
    saveNotebookStore(userId, nbs, user);
  }

  function createNb() {
    if (!newName.trim()) return;
    const nb = { id: "nb" + Date.now(), name: newName.trim(), questionIds: [], items: [], createdAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) };
    save([...notebooks, nb]);
    setNewName("");
    setNewNbModal(false);
  }

  function deleteNb(id) {
    save(notebooks.filter(n => n.id !== id));
    if (selectedNb === id) setSelectedNb(null);
  }

  function renameNb(id, name) {
    save(notebooks.map(n => n.id === id ? { ...n, name } : n));
    setEditingId(null);
  }

  const nb = notebooks.find(n => n.id === selectedNb);
  const nbQuestions = nb ? (nb.items || []) : [];

  function removeQuestionFromNotebook(item) {
    if (!nb || !item) return;
    if (!window.confirm("Remove this question from this notebook?")) return;

    const updated = notebooks.map(n => {
      if (n.id !== nb.id) return n;
      const items = (n.items || []).filter(q => {
        const sameStoredItem = item.id && q.id === item.id;
        const sameQuestion = q.qId === item.qId
          && q.sourceZip === item.sourceZip
          && q.courseTitle === item.courseTitle
          && q.folderName === item.folderName;
        return !sameStoredItem && !sameQuestion;
      });
      const questionIds = (n.questionIds || []).filter(id => id !== item.qId);
      return { ...n, items, questionIds };
    });

    save(updated);
    if (practiceItem && (
      (item.id && practiceItem.id === item.id) ||
      (practiceItem.qId === item.qId && practiceItem.sourceZip === item.sourceZip)
    )) {
      setPracticeItem(null);
    }
  }

  async function startPractice(item) {
    setPracticeItem(item);
    setPracticeQuestion(null);
    setPracticeAnswer("");
    setPracticeReveal(false);
    if (!item?.sourceZip || !item?.courseTitle || !item?.folderName) return;
    setPracticeLoading(true);
    const qs = new URLSearchParams({ course: item.courseTitle, folder: item.folderName, zip: item.sourceZip });
    try {
      const res = await fetch(`${IMPORTER_API}/test?${qs.toString()}`).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      const allQuestions = (data?.test?.subjects || []).flatMap(s => (s.questions || []).map(q => ({ ...q, subjectName: s.name })));
      const found = allQuestions.find(q => q.id === item.qId || Number(q.globalQNum) === Number(item.globalQNum));
      if (found) {
        const imgQs = new URLSearchParams({ course: item.courseTitle, folder: item.folderName, zip: item.sourceZip, qId: found.id });
        const imgRes = await fetch(`${IMPORTER_API}/question-images?${imgQs.toString()}`).catch(() => null);
        const imgData = imgRes?.ok ? await imgRes.json() : null;
        setPracticeQuestion({ ...found, images: imgData?.images || found.images || [] });
      } else {
        setPracticeQuestion(null);
      }
    } finally {
      setPracticeLoading(false);
    }
  }

  function optLabelToNumber(label) {
    const text = String(label || "").trim().toUpperCase();
    if (/^\d+$/.test(text)) return text;
    const code = text.charCodeAt(0);
    return code >= 65 && code <= 90 ? String(code - 64) : text;
  }

  const practiceCorrect = practiceQuestion
    ? (Array.isArray(practiceQuestion.correctAnswer) ? practiceQuestion.correctAnswer : [practiceQuestion.correctAnswer]).filter(v => v !== undefined && v !== null).map(String)
    : String(practiceItem?.correct || "").split(",").map(x => optLabelToNumber(x)).filter(Boolean);
  const practiceIsRight = practiceReveal && practiceAnswer && practiceCorrect.includes(optLabelToNumber(practiceAnswer));

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Notebook</h2>
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>Organize important questions into custom notebooks</p>

      <div className="notebook-layout">
        {/* Notebook list */}
        <div className="notebook-list">
          <button className="btn-primary" style={{ width: "100%", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => setNewNbModal(true)}>
            <Icon n="plus" s={14} /> New Notebook
          </button>
          {loadingNotebooks && <div style={{ fontSize: 12, color: "#64748B", textAlign: "center", padding: 16 }}>Loading notebooks...</div>}
          {!loadingNotebooks && notebooks.length === 0 && <div style={{ fontSize: 12, color: "#334155", textAlign: "center", padding: 16 }}>No notebooks yet</div>}
          {notebooks.map(n => (
            <div key={n.id} className={`notebook-list-item tap-card ${selectedNb === n.id ? "active" : ""}`} onClick={() => setSelectedNb(n.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon n="book" s={14} c="#7C3AED" />
                {editingId === n.id ? (
                  <input className="input-field" style={{ padding: "3px 8px", fontSize: 12, flex: 1 }} value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") renameNb(n.id, editName); if (e.key === "Escape") setEditingId(null); }} autoFocus onClick={e => e.stopPropagation()} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 500, color: selectedNb === n.id ? "#A78BFA" : "#CBD5E1", flex: 1 }}>{n.name}</span>
                )}
                <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditingId(n.id); setEditName(n.name); }} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 2 }}><Icon n="edit" s={12} /></button>
                  <button onClick={() => deleteNb(n.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 2 }}><Icon n="trash" s={12} /></button>
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 3, paddingLeft: 22 }}>{(n.items || n.questionIds || []).length} questions · {n.createdAt}</div>
            </div>
          ))}
        </div>

        {/* Questions in selected notebook */}
        <div className="notebook-main">
          {!nb ? (
            <div className="card" style={{ textAlign: "center", padding: 48 }}>
              <div style={{ marginBottom: 12, display:"flex", justifyContent:"center" }}><Icon n="notebook" s={32} c="#475569" /></div>
              <div style={{ color: "#475569" }}>Select a notebook to view questions</div>
            </div>
          ) : nbQuestions.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 48 }}>
              <div style={{ marginBottom: 12, display:"flex", justifyContent:"center" }}><Icon n="file-text" s={32} c="#475569" /></div>
              <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 6 }}>{nb.name}</div>
              <div style={{ color: "#475569", fontSize: 12 }}>No questions added yet. Add questions from the solution review page.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0", marginBottom: 12 }}>{nb.name} <span style={{ fontSize: 12, color: "#475569", fontWeight: 400 }}>({nbQuestions.length} questions)</span></div>
              {nbQuestions.map((q, i) => (
                <div key={`${q.id || q.qId}_${q.sourceZip || ""}_${i}`} className="card notebook-question-card tap-card">
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#F87171", flexShrink: 0 }}>Q{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                        <span className="tag tag-purple" style={{ fontSize: 10 }}>{q.subject}</span>
                        <span style={{ fontSize: 11, color: "#475569" }}>{q.testName}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#CBD5E1" }}>Question {q.globalQNum || ""}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 5 }}>{q.courseTitle} / {q.folderName}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                        <button className="btn-primary" style={{ padding: "8px 14px", fontSize: 12 }} onClick={() => startPractice(q)}>
                          <Icon n="repeat" s={13} /> Reattempt Question
                        </button>
                        <button className="btn-ghost danger" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => removeQuestionFromNotebook(q)}>
                          <Icon n="trash" s={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <Modal open={newNbModal} onClose={() => setNewNbModal(false)} title="Create New Notebook" width={400}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#64748B", marginBottom: 5, display: "block" }}>Notebook Name</label>
          <input className="input-field" placeholder="e.g. Tricky Formulas" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createNb()} autoFocus />
        </div>
        <button className="btn-primary" style={{ width: "100%", padding: 10 }} onClick={createNb}>Create Notebook</button>
      </Modal>

      <Modal open={!!practiceItem} onClose={() => setPracticeItem(null)} title="Reattempt Question" width={760}>
        {practiceItem && (
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <span className="tag tag-purple">{practiceItem.subject}</span>
              <span style={{ color: "#64748B", fontSize: 12 }}>{practiceItem.testName}</span>
              <span style={{ color: "#64748B", fontSize: 12 }}>Question {practiceItem.globalQNum}</span>
            </div>
            {practiceLoading && <div style={{ color: "#A78BFA", fontSize: 13, padding: "16px 0" }}>Loading question...</div>}
            {!practiceLoading && practiceQuestion?.images?.length > 0 && (
              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                {practiceQuestion.images.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain", objectPosition: "left top", background: "white", borderRadius: 8 }} />
                ))}
              </div>
            )}
            {!practiceLoading && !practiceQuestion?.images?.length && (
              <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.04)", color: "#64748B", marginBottom: 14 }}>
                Question image could not be loaded. Make sure the converted image cache is present for this test.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
              {["A", "B", "C", "D"].map(opt => (
                <button key={opt} className={`review-option ${practiceAnswer === opt ? "correct" : ""}`} onClick={() => { setPracticeAnswer(opt); setPracticeReveal(false); }}>
                  {opt}
                </button>
              ))}
            </div>
            {practiceReveal && (
              <div style={{ padding: 12, borderRadius: 10, background: practiceIsRight ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${practiceIsRight ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, color: practiceIsRight ? "#6EE7B7" : "#FCA5A5", marginBottom: 12 }}>
                {practiceIsRight ? "Correct." : `Not correct. Correct answer: ${practiceCorrect.map(n => String.fromCharCode(64 + Number(n))).join(", ") || practiceItem.correct || "—"}`}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button className="btn-ghost" onClick={() => setPracticeReveal(true)}>Reveal Answer</button>
              <button className="btn-primary" disabled={!practiceAnswer} onClick={() => setPracticeReveal(true)}>Check Answer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage({ allCourses, setAllCourses, passPlans, setPassPlans, appSettings, setAppSettings, user, notify }) {
  const [tab, setTab] = useState("courses");
  const [dbStatus, setDbStatus] = useState({ state: "checking", label: "Checking Database", detail: "Pinging database..." });
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminEvents, setAdminEvents] = useState([]);
  const allUC = {};
  const adminTabs = [["courses", "Courses"], ["tests", "Test Management"], ["plans", "Pass Pricing"], ["payments", "Payments"], ["announcements", "Announcements"], ["users", "Users"], ["activity", "Activity"], ["checklist", "Publish Checklist"]];
  const tabIndex = Math.max(0, adminTabs.findIndex(([k]) => k === tab));
  const toast = useCallback((message, type = "info") => notify?.(message, type), [notify]);

  const checkDatabase = useCallback(async () => {
    setDbStatus({ state: "checking", label: "Checking Database", detail: "Pinging database..." });
    const started = Date.now();
    const res = await fetch(`${IMPORTER_API}/health`, { cache: "no-store" }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (res?.ok && data?.ok) {
      setDbStatus({ state: "connected", label: "Database Connected", detail: `Live in ${data.latencyMs ?? Date.now() - started} ms` });
      return;
    }
    setDbStatus({ state: "error", label: "Database Not Connected", detail: data?.message || "Health check endpoint failed" });
  }, []);

  useEffect(() => { checkDatabase(); }, [checkDatabase]);

  const loadAdminUsers = useCallback(async () => {
    const res = await fetch(`${IMPORTER_API}/users?all=1`, { cache: "no-store" }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (data?.users) setAdminUsers(data.users);
  }, []);

  useEffect(() => { loadAdminUsers(); }, [loadAdminUsers]);
  useEffect(() => { if (tab === "users") loadAdminUsers(); }, [tab, loadAdminUsers]);

  const loadAdminEvents = useCallback(async () => {
    const res = await fetch(`${IMPORTER_API}/admin-events`, { cache: "no-store" }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (data?.events) setAdminEvents(data.events);
  }, []);

  const recordAdminEvent = useCallback(async (type, message, metadata = {}) => {
    setAdminEvents(prev => [{ id: `local_${Date.now()}`, event_type: type, payload_json: { message, actor_email: user?.email, metadata }, created_at: new Date().toISOString() }, ...prev].slice(0, 80));
    await fetch(`${IMPORTER_API}/admin-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message, metadata, actor: { id: user?.id || user?.offlineId, email: user?.email, name: user?.name } }),
    }).catch(() => null);
  }, [user]);

  useEffect(() => { if (tab === "activity") loadAdminEvents(); }, [tab, loadAdminEvents]);

  const totalEnrollments = adminUsers.reduce((sum, u) => sum + (u.enrollments || u.coursesOpted || []).length, 0);
  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n="admin" s={18} c="#FCD34D" />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Admin Panel</h2>
          <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Manage courses, tests, users & content</p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 18, borderColor: dbStatus.state === "connected" ? "rgba(16,185,129,0.28)" : dbStatus.state === "checking" ? "rgba(251,191,36,0.24)" : "rgba(239,68,68,0.3)", background: dbStatus.state === "connected" ? "rgba(16,185,129,0.055)" : dbStatus.state === "checking" ? "rgba(251,191,36,0.055)" : "rgba(239,68,68,0.055)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: dbStatus.state === "connected" ? "rgba(16,185,129,0.16)" : dbStatus.state === "checking" ? "rgba(251,191,36,0.16)" : "rgba(239,68,68,0.16)", color: dbStatus.state === "connected" ? "#34D399" : dbStatus.state === "checking" ? "#FCD34D" : "#F87171", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon n={dbStatus.state === "connected" ? "check-circle" : dbStatus.state === "checking" ? "clock" : "alert-tri"} s={19} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9" }}>{dbStatus.label}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{dbStatus.detail}</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={checkDatabase} style={{ minHeight: 34, padding: "7px 13px", fontSize: 12 }}>
          <Icon n="repeat" s={13} />Check Again
        </button>
      </div>
      {/* Admin stat bar */}
      <div className="responsive-stats-grid" style={{ marginBottom: 24 }}>
        {[
          { l: "Total Courses", v: allCourses.length, icon: "courses", c: "#7C3AED" },
          { l: "Total Tests", v: allCourses.reduce((a, c) => a + c.testFolders.reduce((b, f) => b + f.tests.length, 0), 0), icon: "tests", c: "#0EA5E9" },
          { l: "Registered Users", v: adminUsers.filter(u => u.role !== "admin").length, icon: "users", c: "#10B981" },
          { l: "Total Enrollments", v: totalEnrollments || Object.values(allUC).reduce((a, v) => a + v.length, 0), icon: "star", c: "#F59E0B" },
        ].map(s => (
          <div key={s.l} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: s.c + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={s.icon} s={18} c={s.c} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9" }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ "--tab-index": tabIndex, "--tab-count": adminTabs.length }}>
        {adminTabs.map(([k, v]) => (
          <button key={k} className={`admin-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      <div key={tab} className="tab-panel">
        {tab === "courses" && <AdminCourses allCourses={allCourses} setAllCourses={setAllCourses} notify={toast} recordAdminEvent={recordAdminEvent} />}
        {tab === "tests" && <AdminTests allCourses={allCourses} setAllCourses={setAllCourses} notify={toast} recordAdminEvent={recordAdminEvent} />}
        {tab === "plans" && <AdminPlans passPlans={passPlans} setPassPlans={setPassPlans} notify={toast} recordAdminEvent={recordAdminEvent} />}
        {tab === "payments" && <AdminPayments appSettings={appSettings} setAppSettings={setAppSettings} notify={toast} recordAdminEvent={recordAdminEvent} currentAdmin={user} />}
        {tab === "announcements" && <AdminAnnouncements appSettings={appSettings} setAppSettings={setAppSettings} notify={toast} recordAdminEvent={recordAdminEvent} />}
        {tab === "users" && <AdminUsers allUsers={adminUsers} allUC={allUC} allCourses={allCourses} passPlans={passPlans} onRefresh={loadAdminUsers} notify={toast} recordAdminEvent={recordAdminEvent} currentAdmin={user} />}
        {tab === "activity" && <AdminActivity events={adminEvents} onRefresh={loadAdminEvents} />}
        {tab === "checklist" && <AdminPublishChecklist dbStatus={dbStatus} allCourses={allCourses} passPlans={passPlans} appSettings={appSettings} adminUsers={adminUsers} />}
      </div>
    </div>
  );
}

function AdminActivity({ events, onRefresh }) {
  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ color: "#E2E8F0", fontSize: 15, fontWeight: 800 }}>Admin Activity</div>
          <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>Recent course, test, plan, user, and attempt events saved in the database.</div>
        </div>
        <button className="btn-ghost" onClick={onRefresh}><Icon n="repeat" s={13} />Refresh</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {(events || []).length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "#64748B" }}>
            <Icon n="clipboard" s={28} c="#334155" />
            <div style={{ marginTop: 10 }}>No activity recorded yet.</div>
          </div>
        ) : events.map(evt => (
          <div key={evt.id} style={{ display: "grid", gridTemplateColumns: "34px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(124,58,237,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n={String(evt.event_type || "").includes("delete") ? "trash" : String(evt.event_type || "").includes("attempt") ? "analysis" : "zap"} s={15} c="#A78BFA" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 750 }}>{evt.payload_json?.message || evt.event_type}</div>
              <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>{evt.payload_json?.actor_email || "System"} · {evt.event_type || "event"}</div>
            </div>
            <div style={{ color: "#475569", fontSize: 11, whiteSpace: "nowrap" }}>{evt.created_at ? new Date(evt.created_at).toLocaleString() : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPublishChecklist({ dbStatus, allCourses, passPlans, appSettings, adminUsers }) {
  const tests = allCourses.flatMap(c => (c.testFolders || []).flatMap(f => (f.tests || []).map(t => ({ ...t, courseTitle: c.title }))));
  const configured = tests.filter(t => t.isConfigured !== false && (t.sourceUrl || t.githubUrl || t.sourceZip));
  const activePlans = (passPlans || []).filter(p => p.isActive !== false);
  const items = [
    { label: "Database connection", ok: dbStatus.state === "connected", detail: dbStatus.detail },
    { label: "Courses published", ok: allCourses.length > 0, detail: `${allCourses.length} course${allCourses.length === 1 ? "" : "s"}` },
    { label: "Tests configured", ok: configured.length > 0 && configured.length === tests.length, detail: `${configured.length}/${tests.length} configured` },
    { label: "Pass plans active", ok: activePlans.length > 0, detail: `${activePlans.length} active plan${activePlans.length === 1 ? "" : "s"}` },
    { label: "Announcements reviewed", ok: !!(appSettings.banner?.enabled || appSettings.homeAnnouncement?.enabled), detail: appSettings.banner?.enabled ? "Top banner enabled" : appSettings.homeAnnouncement?.enabled ? "Home announcement enabled" : "No announcement active" },
    { label: "User table reachable", ok: Array.isArray(adminUsers), detail: `${adminUsers.length} account${adminUsers.length === 1 ? "" : "s"} loaded` },
  ];
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "#E2E8F0", fontSize: 15, fontWeight: 800 }}>Publish Checklist</div>
        <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>Quick pre-launch scan before sharing the website.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,420px))", gap: 12, alignItems: "start" }}>
        {items.map(item => (
          <div key={item.label} className="card tap-card" style={{ display: "flex", alignItems: "center", gap: 12, borderColor: item.ok ? "rgba(16,185,129,0.22)" : "rgba(251,191,36,0.22)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: item.ok ? "rgba(16,185,129,0.14)" : "rgba(251,191,36,0.13)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n={item.ok ? "check-circle" : "alert-tri"} s={18} c={item.ok ? "#34D399" : "#FCD34D"} />
            </div>
            <div>
              <div style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 800 }}>{item.label}</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCourses({ allCourses, setAllCourses, notify, recordAdminEvent }) {
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", price: "", originalPrice: "", badge: "New", color: "#7C3AED", textColor: "#A78BFA", description: "", subjects: "Physics,Chemistry,Mathematics" });
  const [folderChoices, setFolderChoices] = useState({ full: true, part: true, chapter: false });
  const [extraFolders, setExtraFolders] = useState("");

  function normalizeCourseForm(course) {
    return {
      ...course,
      price: Number(course.price || 0),
      originalPrice: Number(course.originalPrice || course.price || 0),
      subjects: Array.isArray(course.subjects)
        ? course.subjects
        : String(course.subjects || "").split(",").map(s => s.trim()).filter(Boolean),
    };
  }

  async function refreshCoursesFromDisk(fallbackCourses) {
    const res = await fetch(`${IMPORTER_API}/library`).catch(() => null);
    if (!res?.ok) {
      setAllCourses(fallbackCourses);
      return;
    }
    const data = await res.json();
    const updated = mergeFolderLibrary(fallbackCourses, data.courses || []);
    setAllCourses(updated);
  }

  async function saveEdit(course) {
    const original = allCourses.find(c => c.id === course.id);
    const cleaned = normalizeCourseForm(course);
    try {
      const res = await fetch(`${IMPORTER_API}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cleaned,
          previousTitle: original?.folderName || original?.title || cleaned.folderName || cleaned.title,
          testFolders: cleaned.testFolders || original?.testFolders || [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Course could not be saved.");
      const saved = data.course ? { ...cleaned, ...data.course, testFolders: cleaned.testFolders || original?.testFolders || [] } : cleaned;
      const updated = allCourses.map(c => c.id === course.id ? saved : c);
      await refreshCoursesFromDisk(updated);
      notify?.("Course saved.", "success");
      recordAdminEvent?.("course.updated", `Updated course ${saved.title || course.title}`, { courseId: saved.id });
      setEditModal(null);
    } catch (err) {
      notify?.(err.message || "Course save failed. Check database connection.", "error");
    }
  }

  async function deleteCourse(id) {
    const course = allCourses.find(c => c.id === id);
    if (course?.title) {
      try {
        const res = await fetch(`${IMPORTER_API}/courses`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.id, courseTitle: course.title }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) throw new Error(data?.error || "Course could not be deleted.");
        await refreshCoursesFromDisk(allCourses.filter(c => c.id !== id));
        notify?.("Course deleted.", "success");
        recordAdminEvent?.("course.deleted", `Deleted course ${course.title}`, { courseId: course.id });
      } catch (err) {
        notify?.(err.message || "Course delete failed. Check database connection.", "error");
        return;
      }
    }
    setDeleteConfirm(null);
  }

  async function addCourse() {
    if (!form.title.trim()) return;
    const selectedFolders = [
      folderChoices.full && "Full Tests",
      folderChoices.part && "Part Tests",
      folderChoices.chapter && "Chapter Tests",
      ...extraFolders.split(",").map(s => s.trim()).filter(Boolean),
    ].filter(Boolean);
    const uniqueFolders = [...new Set(selectedFolders)];
    const nc = {
      id: Date.now(), title: form.title.trim(), subtitle: form.subtitle, price: Number(form.price || 0), originalPrice: Number(form.originalPrice || form.price || 0),
      badge: form.badge, color: form.color, textColor: form.textColor, description: form.description,
      subjects: form.subjects.split(",").map(s => s.trim()).filter(Boolean),
      enrolledCount: 0, rating: 4.5,
      testFolders: uniqueFolders.map((name, idx) => ({
        id: "f" + Date.now() + "_" + idx,
        name,
        icon: "folder",
        tests: [],
      }))
    };
    try {
      const res = await fetch(`${IMPORTER_API}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nc),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Course could not be created.");
      const updated = [...allCourses.filter(c => c.id !== (data.course?.id || nc.id)), data.course || nc];
      await refreshCoursesFromDisk(updated);
      notify?.("Course created.", "success");
      recordAdminEvent?.("course.created", `Created course ${data.course?.title || nc.title}`, { courseId: data.course?.id || nc.id });
    } catch (err) {
      notify?.(err.message || "Course create failed. Check database connection.", "error");
      return;
    }
    setAddModal(false);
    setForm({ title: "", subtitle: "", price: "", originalPrice: "", badge: "New", color: "#7C3AED", textColor: "#A78BFA", description: "", subjects: "Physics,Chemistry,Mathematics" });
    setFolderChoices({ full: true, part: true, chapter: false });
    setExtraFolders("");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0" }}>All Courses ({allCourses.length})</span>
        <button className="btn-primary" style={{ padding: "10px 20px" }} onClick={() => setAddModal(true)}>
          <Icon n="plus" s={14} />Add Course
        </button>
      </div>

      {allCourses.map(course => (
        <div key={course.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
          <div style={{ height: 4, background: course.color }} />
          <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>{course.title}</span>
                <span className="tag" style={{ background: course.color + "25", color: course.textColor }}>{course.badge}</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>{course.subtitle}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#475569" }}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><Icon n="price-tag" s={12} c="#64748B" /> Included in pass</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><Icon n="clipboard" s={12} c="#64748B" />{course.testFolders.reduce((a, f) => a + f.tests.length, 0)} tests</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><Icon n="users" s={12} c="#64748B" /> {course.enrolledCount || 0} enrolled</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><Icon n="star" s={12} c="#F59E0B" /> {course.rating || 4.5}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={() => setEditModal({ ...course })}>
                <Icon n="edit" s={13} />Edit
              </button>
              <button className="btn-danger" style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={() => setDeleteConfirm(course.id)}>
                <Icon n="trash" s={13} />Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Course" width={580}>
        {editModal && <CourseForm form={editModal} setForm={setEditModal} onSave={saveEdit} />}
      </Modal>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Course" width={580}>
        <CourseForm form={form} setForm={setForm} onSave={addCourse} saveLabel="Create Course">
          <div style={{ gridColumn: "1/-1", marginTop: 4 }}>
            <label style={{ fontSize: 11, color: "#64748B", marginBottom: 8, display: "block" }}>Create Test Folders</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {[
                ["full", "Full Tests"],
                ["part", "Part Tests"],
                ["chapter", "Chapter Tests"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFolderChoices(p => ({ ...p, [key]: !p[key] }))}
                  style={{ padding: "7px 11px", borderRadius: 8, border: `1px solid ${folderChoices[key] ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)"}`, background: folderChoices[key] ? "rgba(124,58,237,0.18)" : "transparent", color: folderChoices[key] ? "#A78BFA" : "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  {folderChoices[key] && <Icon n="check" s={12} />} {label}
                </button>
              ))}
            </div>
            <input className="input-field" value={extraFolders} onChange={e => setExtraFolders(e.target.value)} placeholder="Extra folders, comma separated e.g. Mock Tests, PYQ" />
          </div>
        </CourseForm>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Course?" width={400}>
        <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>This will permanently delete the course. Students who enrolled will lose access.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn-danger" style={{ flex: 1 }} onClick={() => deleteCourse(deleteConfirm)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

function CourseForm({ form, setForm, onSave, saveLabel = "Save Changes", children }) {
  const F = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const subjectsValue = Array.isArray(form.subjects) ? form.subjects.join(",") : (form.subjects || "");
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Course Title *</label>
          <input className="input-field" value={form.title || ""} onChange={e => F("title", e.target.value)} placeholder="JEE Main 2025 Complete Pack" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Subtitle</label>
          <input className="input-field" value={form.subtitle || ""} onChange={e => F("subtitle", e.target.value)} placeholder="Full Syllabus Mock Series" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Badge</label>
          <input className="input-field" value={form.badge || ""} onChange={e => F("badge", e.target.value)} placeholder="Bestseller" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Course Price (optional)</label>
          <input className="input-field" type="number" value={form.price || ""} onChange={e => F("price", e.target.value)} placeholder="Leave empty for pass-only access" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Original Price (₹)</label>
          <input className="input-field" type="number" value={form.originalPrice || ""} onChange={e => F("originalPrice", e.target.value)} placeholder="3999" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Accent Color</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={form.color || "#7C3AED"} onChange={e => F("color", e.target.value)} style={{ width: 36, height: 36, borderRadius: 7, border: "none", cursor: "pointer", background: "none" }} />
            <input className="input-field" value={form.color || ""} onChange={e => F("color", e.target.value)} style={{ flex: 1 }} placeholder="#7C3AED" />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Text Color</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={form.textColor || "#A78BFA"} onChange={e => F("textColor", e.target.value)} style={{ width: 36, height: 36, borderRadius: 7, border: "none", cursor: "pointer", background: "none" }} />
            <input className="input-field" value={form.textColor || ""} onChange={e => F("textColor", e.target.value)} style={{ flex: 1 }} placeholder="#A78BFA" />
          </div>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Subjects (comma separated)</label>
          <input className="input-field" value={subjectsValue} onChange={e => F("subjects", e.target.value)} placeholder="Physics, Chemistry, Mathematics" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Description</label>
          <textarea className="input-field" rows={3} style={{ resize: "vertical" }} value={form.description || ""} onChange={e => F("description", e.target.value)} placeholder="Course description..." />
        </div>
        {children}
      </div>
      <button className="btn-primary" style={{ width: "100%", padding: 11 }} onClick={() => onSave(form)}>{saveLabel}</button>
    </div>
  );
}

function AdminTests({ allCourses, setAllCourses, notify, recordAdminEvent }) {
  const [selectedCourse, setSelectedCourse] = useState(allCourses[0]?.id || null);
  const [addFolderModal, setAddFolderModal] = useState(false);
  const [addTestModal, setAddTestModal] = useState(null);   // folderId for manual add
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("clipboard");
  const [newTest, setNewTest] = useState({ name: "", sourceUrl: "", duration: 180, maxMarks: 300, date: "", scheduledAt: "", scheduledUntil: "" });
  const [openFolder, setOpenFolder] = useState(null);
  const [deleteTestConfirm, setDeleteTestConfirm] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [configModal, setConfigModal] = useState(null);
  const [configBusy, setConfigBusy] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleBusy, setScheduleBusy] = useState(false);

  const course = allCourses.find(c => c.id === selectedCourse);

  function saveAll(updated) { setAllCourses(updated); }

  async function addFolder() {
    if (!newFolderName.trim()) return;
    const folderName = newFolderName.trim();
    try {
      const res = await fetch(`${IMPORTER_API}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course?.id, courseTitle: course?.title, folderName, icon: newFolderIcon }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Folder could not be created.");
      await refreshLibrary();
      notify?.("Folder created.", "success");
      recordAdminEvent?.("folder.created", `Created folder ${folderName}`, { courseId: course?.id, folderName });
    } catch (err) {
      notify?.(err.message || "Folder create failed. Check database connection.", "error");
      return;
    }
    setAddFolderModal(false); setNewFolderName("");
  }

  async function deleteFolder(fid) {
    const folder = course?.testFolders?.find(f => f.id === fid);
    if (course?.title && folder?.name) {
      try {
        const res = await fetch(`${IMPORTER_API}/folders`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.id, courseTitle: course.title, folderName: folder.name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) throw new Error(data?.error || "Folder could not be deleted.");
        await refreshLibrary();
        notify?.("Folder deleted.", "success");
        recordAdminEvent?.("folder.deleted", `Deleted folder ${folder.name}`, { courseId: course.id, folderName: folder.name });
      } catch (err) {
        notify?.(err.message || "Folder delete failed. Check database connection.", "error");
      }
    }
  }

  async function addTest(fid) {
    if (!newTest.name.trim()) return;
    const sourceUrl = normalizeExternalTestUrl(newTest.sourceUrl);
    const t = { id: "t" + Date.now(), ...newTest, sourceUrl, configured: !!sourceUrl, duration: Number(newTest.duration), maxMarks: Number(newTest.maxMarks), attempted: false };
    const folder = course?.testFolders?.find(f => f.id === fid);
    try {
      const res = await fetch(`${IMPORTER_API}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...t,
          courseId: course?.id,
          courseTitle: course?.title,
          folderName: folder?.name || "Tests",
          examConfig: { examType: "other" },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Test could not be added.");
      await refreshLibrary();
      notify?.("Test added.", "success");
      recordAdminEvent?.("test.created", `Added test ${t.name}`, { courseId: course?.id, testId: t.id });
    } catch (err) {
      notify?.(err.message || "Test add failed. Check database connection.", "error");
      return;
    }
    setAddTestModal(null); setNewTest({ name: "", sourceUrl: "", duration: 180, maxMarks: 300, date: "", scheduledAt: "", scheduledUntil: "" });
  }

  async function refreshLibraryAfterDelete() {
    const res = await fetch(`${IMPORTER_API}/library`).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    saveAll(data.courses || []);
  }

  async function refreshLibrary() {
    const res = await fetch(`${IMPORTER_API}/library`).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    saveAll(data.courses || []);
  }

  function openConfig(folder, test) {
    const cfg = test.examConfig || {};
    setConfigModal({
      folderId: folder.id,
      folderName: folder.name,
      testId: test.id,
      testName: test.name,
      sourceZip: test.sourceZip,
      sourceUrl: test.sourceUrl,
      duration: test.duration || 180,
      maxMarks: test.maxMarks || 0,
      examType: cfg.examType || "jee_main",
      customExamName: cfg.customExamName || "",
      bitsatHasBonus: cfg.bitsatHasBonus !== false,
      scheduledAt: test.scheduledAt || "",
      scheduledUntil: test.scheduledUntil || "",
    });
  }

  function openSchedule(folder, test) {
    setScheduleModal({
      folderId: folder.id,
      folderName: folder.name,
      testId: test.id,
      testName: test.name,
      sourceZip: test.sourceZip,
      sourceUrl: test.sourceUrl,
      duration: test.duration || 180,
      maxMarks: test.maxMarks || 0,
      configured: test.configured !== false,
      examType: test.examConfig?.examType || "other",
      customExamName: test.examConfig?.customExamName || "",
      bitsatHasBonus: test.examConfig?.bitsatHasBonus !== false,
      scheduledAt: test.scheduledAt || "",
      scheduledUntil: test.scheduledUntil || "",
    });
  }

  async function saveConfig() {
    if (!course || !configModal?.folderName || (!configModal?.sourceZip && !configModal?.sourceUrl)) return;
    setConfigBusy(true);
    try {
      if (configModal.sourceUrl) {
        const res = await fetch(`${IMPORTER_API}/tests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: configModal.testId,
            name: configModal.testName,
            courseId: course.id,
            courseTitle: course.title,
            folderName: configModal.folderName,
            sourceUrl: configModal.sourceUrl,
            duration: configModal.duration || 180,
            maxMarks: configModal.maxMarks || 0,
            configured: true,
            examConfig: {
              examType: configModal.examType,
              customExamName: configModal.customExamName,
              bitsatHasBonus: configModal.bitsatHasBonus,
            },
            scheduledAt: configModal.scheduledAt || "",
            scheduledUntil: configModal.scheduledUntil || "",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) throw new Error(data?.error || "Test configuration could not be saved.");
      } else {
        await fetch(`${IMPORTER_API}/test-config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseTitle: course.folderName || course.title,
            folderName: configModal.folderName,
            zipName: configModal.sourceZip,
            examType: configModal.examType,
            customExamName: configModal.customExamName,
            bitsatHasBonus: configModal.bitsatHasBonus,
            scheduledAt: configModal.scheduledAt || "",
            scheduledUntil: configModal.scheduledUntil || "",
          }),
        });
      }
      await refreshLibrary();
      setConfigModal(null);
      notify?.("Test configuration saved.", "success");
      recordAdminEvent?.("test.configured", `Configured test ${configModal.testName}`, { courseId: course.id, testId: configModal.testId, examType: configModal.examType });
    } catch (err) {
      notify?.(err.message || "Test configuration failed. Check database connection.", "error");
    } finally {
      setConfigBusy(false);
    }
  }

  async function saveSchedule(clear = false) {
    if (!course || !scheduleModal) return;
    const scheduledAt = clear ? "" : scheduleModal.scheduledAt || "";
    const scheduledUntil = clear ? "" : scheduleModal.scheduledUntil || "";
    setScheduleBusy(true);
    try {
      if (scheduleModal.sourceUrl) {
        const res = await fetch(`${IMPORTER_API}/tests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: scheduleModal.testId,
            name: scheduleModal.testName,
            courseId: course.id,
            courseTitle: course.title,
            folderName: scheduleModal.folderName,
            sourceUrl: scheduleModal.sourceUrl,
            duration: scheduleModal.duration || 180,
            maxMarks: scheduleModal.maxMarks || 0,
            configured: scheduleModal.configured !== false,
            examConfig: {
              examType: scheduleModal.examType,
              customExamName: scheduleModal.customExamName,
              bitsatHasBonus: scheduleModal.bitsatHasBonus,
            },
            scheduledAt,
            scheduledUntil,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) throw new Error(data?.error || "Schedule could not be saved.");
        await refreshLibrary();
      } else if (scheduleModal.sourceZip) {
        await fetch(`${IMPORTER_API}/test-config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseTitle: course.folderName || course.title,
            folderName: scheduleModal.folderName,
            zipName: scheduleModal.sourceZip,
            examType: scheduleModal.examType,
            customExamName: scheduleModal.customExamName,
            bitsatHasBonus: scheduleModal.bitsatHasBonus,
            scheduledAt,
            scheduledUntil,
          }),
        });
        await refreshLibrary();
      }
      setScheduleModal(null);
      notify?.(clear ? "Schedule cleared." : "Schedule saved.", "success");
      recordAdminEvent?.("test.scheduled", `${clear ? "Cleared schedule for" : "Scheduled"} ${scheduleModal.testName}`, { courseId: course.id, testId: scheduleModal.testId, scheduledAt, scheduledUntil });
    } catch (err) {
      notify?.(err.message || "Schedule save failed. Check database connection.", "error");
    } finally {
      setScheduleBusy(false);
    }
  }

  async function deleteTest(fid, tid) {
    const folder = course?.testFolders?.find(f => f.id === fid);
    const test = folder?.tests?.find(t => t.id === tid);
    if (!folder || !test) return;
    setDeleteBusy(true);
    if (test?.sourceUrl) {
      try {
        const res = await fetch(`${IMPORTER_API}/tests`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testId: test.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) throw new Error(data?.error || "Test could not be deleted.");
        await refreshLibraryAfterDelete();
        notify?.("Test deleted.", "success");
        recordAdminEvent?.("test.deleted", `Deleted test ${test.name}`, { courseId: course.id, testId: test.id });
      } catch (err) {
        notify?.(err.message || "Test delete failed. Check database connection.", "error");
      }
    } else if (course?.title && folder?.name && test?.sourceZip) {
      try {
        await fetch(`${IMPORTER_API}/tests`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseTitle: course.title, folderName: folder.name, zipName: test.sourceZip }),
        });
        await refreshLibraryAfterDelete();
        notify?.("Test deleted.", "success");
        recordAdminEvent?.("test.deleted", `Deleted test ${test.name}`, { courseId: course.id, testId: test.id });
      } catch {}
    }
    setDeleteBusy(false);
    setDeleteTestConfirm(null);
  }

  return (
    <div>
      {/* Course selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {allCourses.map(c => (
          <button key={c.id} title={c.title} onClick={() => setSelectedCourse(c.id)} style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${selectedCourse === c.id ? c.color : "rgba(255,255,255,0.1)"}`, background: selectedCourse === c.id ? c.color + "18" : "transparent", color: selectedCourse === c.id ? c.textColor : "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {c.title}
          </button>
        ))}
      </div>

      {course && (
        <>
          {/* Action bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#475569" }}>
              {course.testFolders.reduce((a, f) => a + f.tests.length, 0)} tests across {course.testFolders.length} folders
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ padding: "10px 18px", fontSize: 13 }} onClick={() => setAddFolderModal(true)}>
                <Icon n="folder" s={13} />Add Folder
              </button>
            </div>
          </div>

          {course.testFolders.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon n="folder" s={32} c="#334155" /></div>
              <div style={{ color: "#475569", marginBottom: 16 }}>No folders yet. Create a folder, then add tests with GitHub JSON links.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => setAddFolderModal(true)}>
                  <Icon n="folder" s={13} />Add Folder
                </button>
              </div>
            </div>
          )}

          {course.testFolders.map(folder => (
            <div key={folder.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: "rgba(255,255,255,0.02)", cursor: "pointer" }} onClick={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}>
                <Icon n={folder.icon || "folder"} s={20} c="#7C3AED" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0", flex: 1 }}>{folder.name}</span>
                <span style={{ fontSize: 11, color: "#475569", marginRight: 6 }}>{folder.tests.length} tests</span>
                <button className="btn-primary" style={{ padding: "8px 14px", fontSize: 12, minHeight: 36 }} onClick={e => { e.stopPropagation(); setAddTestModal(folder.id); }}>+ GitHub Test</button>
                <button className="btn-danger" style={{ padding: "8px 14px", fontSize: 12, minHeight: 36 }} onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}>Delete</button>
                <Icon n={openFolder === folder.id ? "chevdown" : "chevright"} s={14} c="#475569" />
              </div>
              {openFolder === folder.id && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  {folder.tests.length === 0 && (
                    <div style={{ padding: "16px 18px", fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 8 }}>
                      No tests yet.
                      <button className="btn-ghost" style={{ fontSize: 12, padding: "8px 14px", minHeight: 36 }} onClick={() => setAddTestModal(folder.id)}>
                        + GitHub Test
                      </button>
                    </div>
                  )}
                  {folder.tests.map((test, i) => (
                    <div key={test.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: i < folder.tests.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 500, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          {test.name}
                          {(test.sourceZip || test.sourceUrl) && (
                            <span className={`tag ${test.configured ? "tag-green" : "tag-amber"}`} style={{ fontSize: 10 }}>
                              {test.configured ? `${(test.examConfig?.examType || "configured").replace("_", " ").toUpperCase()}` : "Not configured"}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <span>{test.duration} min</span>
                          <span>{test.maxMarks} marks</span>
                          {test.date && <span>{test.date}</span>}
                          {test.scheduledAt && <span style={{ color: "#F59E0B" }}>Opens {formatDateTime(test.scheduledAt)}</span>}
                          {test.scheduledUntil && <span style={{ color: "#A78BFA" }}>Closes {formatDateTime(test.scheduledUntil)}</span>}
                          {test.subjects && <span style={{ color: "#7C3AED" }}>{test.subjects.length} subjects · {test.subjects.reduce((a, s) => a + s.questions.length, 0)} Qs</span>}
                          {test.hasSolution && <span style={{ color: "#34D399" }}>Has Solutions</span>}
                          {test.sourceUrl && <span style={{ color: "#38BDF8" }}>GitHub source</span>}
                        </div>
                      </div>
                      <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 12, minHeight: 36, opacity: (test.sourceZip || test.sourceUrl) && !test.configured ? 0.55 : 1 }} disabled={(test.sourceZip || test.sourceUrl) && !test.configured} title={(test.sourceZip || test.sourceUrl) && !test.configured ? "Configure this test before scheduling it." : "Schedule test"} onClick={() => openSchedule(folder, test)}>
                        <Icon n="calendar" s={11} />Schedule
                      </button>
                      {(test.sourceZip || test.sourceUrl) && (
                        <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 12, minHeight: 36 }} onClick={() => openConfig(folder, test)}>
                          <Icon n="settings" s={11} />Configure
                        </button>
                      )}
                      <button className="btn-danger" style={{ padding: "8px 14px", fontSize: 12, minHeight: 36 }} onClick={() => setDeleteTestConfirm({ folderId: folder.id, testId: test.id, folderName: folder.name, testName: test.name, sourceZip: test.sourceZip })}>
                        <Icon n="trash" s={11} />Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <Modal open={addFolderModal} onClose={() => setAddFolderModal(false)} title="Add Test Folder" width={420}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Folder Name</label>
          <input className="input-field" placeholder="Full Tests" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} autoFocus />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#64748B", marginBottom: 6, display: "block" }}>Icon</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["clipboard","books","book-open","file-text","target","zap","search","folder"].map(ic => (
              <button key={ic} onClick={() => setNewFolderIcon(ic)} style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${newFolderIcon === ic ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)"}`, background: newFolderIcon === ic ? "rgba(124,58,237,0.2)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon n={ic} s={16} c={newFolderIcon === ic ? "#A78BFA" : "#475569"} />
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary" style={{ width: "100%", padding: 10 }} onClick={addFolder}>Create Folder</button>
      </Modal>

      <Modal open={!!addTestModal} onClose={() => setAddTestModal(null)} title="Add Test from GitHub" width={520}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Test Name *</label>
            <input className="input-field" placeholder="JEE Main Full Test 6" value={newTest.name} onChange={e => setNewTest(p => ({ ...p, name: e.target.value }))} autoFocus />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>GitHub test JSON link *</label>
            <input className="input-field" placeholder="https://github.com/you/course-tests/blob/main/mock-1.rbtest.json" value={newTest.sourceUrl} onChange={e => setNewTest(p => ({ ...p, sourceUrl: e.target.value }))} />
            <div style={{ fontSize: 11, color: "#475569", marginTop: 5 }}>GitHub blob links are converted to raw links automatically. Keep the repo public for now.</div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Duration (min)</label>
            <input className="input-field" type="number" value={newTest.duration} onChange={e => setNewTest(p => ({ ...p, duration: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Max Marks</label>
            <input className="input-field" type="number" value={newTest.maxMarks} onChange={e => setNewTest(p => ({ ...p, maxMarks: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Test Date</label>
            <input className="input-field" type="date" value={newTest.date} onChange={e => setNewTest(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Opens At</label>
            <input className="input-field" type="datetime-local" value={newTest.scheduledAt || ""} onChange={e => setNewTest(p => ({ ...p, scheduledAt: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Closes At</label>
            <input className="input-field" type="datetime-local" value={newTest.scheduledUntil || ""} onChange={e => setNewTest(p => ({ ...p, scheduledUntil: e.target.value }))} />
          </div>
        </div>
        <button className="btn-primary" style={{ width: "100%", padding: 10 }} onClick={() => addTest(addTestModal)}>Add GitHub Test</button>
      </Modal>

      <Modal open={!!scheduleModal} onClose={() => !scheduleBusy && setScheduleModal(null)} title="Schedule Test" width={480}>
        {scheduleModal && (
          <div>
            <div style={{ padding: 12, borderRadius: 12, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", marginBottom: 14 }}>
              <div style={{ color: "#F1F5F9", fontSize: 14, fontWeight: 700 }}>{scheduleModal.testName}</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 3 }}>{scheduleModal.folderName}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Opens At</label>
                <input className="input-field" type="datetime-local" value={scheduleModal.scheduledAt || ""} onChange={e => setScheduleModal(p => ({ ...p, scheduledAt: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Closes At</label>
                <input className="input-field" type="datetime-local" value={scheduleModal.scheduledUntil || ""} onChange={e => setScheduleModal(p => ({ ...p, scheduledUntil: e.target.value }))} />
              </div>
            </div>
            <div style={{ color: "#64748B", fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
              Before the opening time, students will see the test as scheduled and cannot start it. After the closing time, it becomes closed.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={scheduleBusy} onClick={() => saveSchedule(true)}>Clear</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={scheduleBusy} onClick={() => saveSchedule(false)}>
                {scheduleBusy ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTestConfirm} onClose={() => !deleteBusy && setDeleteTestConfirm(null)} title="Delete Test?" width={430}>
        {deleteTestConfirm && (
          <div>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FCA5A5", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                <Icon n="alert-tri" s={15} />{deleteTestConfirm.testName}
              </div>
              <div style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.6 }}>
                This will remove the test from <span style={{ color: "#E2E8F0" }}>{deleteTestConfirm.folderName}</span>.
                {deleteTestConfirm.sourceZip ? " The ZIP and generated fast-load files will be moved to tests-import/deleted." : " This manual test will be removed from the app."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={deleteBusy} onClick={() => setDeleteTestConfirm(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} disabled={deleteBusy} onClick={() => deleteTest(deleteTestConfirm.folderId, deleteTestConfirm.testId)}>
                <Icon n="trash" s={13} />{deleteBusy ? "Deleting..." : "Delete Test"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!configModal} onClose={() => !configBusy && setConfigModal(null)} title="Configure Test" width={520}>
        {configModal && (
          <div>
            <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 14 }}>
              {configModal.testName} · {configModal.folderName}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", marginBottom: 5, display: "block" }}>Test Name</label>
                <input className="input-field" value={configModal.testName} onChange={e => setConfigModal(p => ({ ...p, testName: e.target.value }))} placeholder="Display name shown to students" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#64748B", marginBottom: 5, display: "block" }}>Duration (min)</label>
                  <input className="input-field" type="number" value={configModal.duration} onChange={e => setConfigModal(p => ({ ...p, duration: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748B", marginBottom: 5, display: "block" }}>Max Marks</label>
                  <input className="input-field" type="number" value={configModal.maxMarks} onChange={e => setConfigModal(p => ({ ...p, maxMarks: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", marginBottom: 5, display: "block" }}>Exam Type</label>
                <select className="select-field" style={{ width: "100%", minHeight: 42 }} value={configModal.examType} onChange={e => setConfigModal(p => ({ ...p, examType: e.target.value }))}>
                  <option value="bitsat">BITSAT</option>
                  <option value="ugee">UGEE</option>
                  <option value="jee_main">JEE Main</option>
                  <option value="jee_advanced">JEE Advanced</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {configModal.examType === "other" && (
                <div>
                  <label style={{ fontSize: 11, color: "#64748B", marginBottom: 5, display: "block" }}>Exam Name</label>
                  <input className="input-field" value={configModal.customExamName} onChange={e => setConfigModal(p => ({ ...p, customExamName: e.target.value }))} placeholder="Type exam name" />
                </div>
              )}
              {configModal.examType === "bitsat" && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#CBD5E1", fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={configModal.bitsatHasBonus} onChange={e => setConfigModal(p => ({ ...p, bitsatHasBonus: e.target.checked }))} />
                  Has Bonus section. Bonus unlocks only after all normal questions are attempted; after entering Bonus, normal questions are locked.
                </label>
              )}
              {configModal.examType === "ugee" && (
                <div style={{ padding: 12, borderRadius: 10, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.18)", color: "#94A3B8", fontSize: 12, lineHeight: 1.6 }}>
                  UGEE mode: SUPR is available for first 60 minutes, then the test automatically switches to REAP for 120 minutes.
                </div>
              )}
              {configModal.examType === "jee_main" && (
                <div style={{ padding: 12, borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", color: "#94A3B8", fontSize: 12, lineHeight: 1.6 }}>
                  JEE Main mode: the last 5 questions of each subject become numerical answer questions with keyboard and on-screen numpad support.
                </div>
              )}
            </div>
            <button className="btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={configBusy} onClick={saveConfig}>
              {configBusy ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AdminPlans({ passPlans, setPassPlans, notify, recordAdminEvent }) {
  const [plans, setPlans] = useState(passPlans?.length ? passPlans : PASS_PLANS);
  const [saving, setSaving] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState(null);

  useEffect(() => { setPlans(passPlans?.length ? passPlans : PASS_PLANS); }, [passPlans]);

  function updatePlan(id, patch) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  function addPlan() {
    const id = `plan_${Date.now()}`;
    setPlans(prev => [...prev, { id, name: "New Pass", durationDays: 30, price: 0, originalPrice: 0, label: "30 days", badge: "New", note: "Describe this pass.", isActive: true, sortOrder: prev.length + 1 }]);
  }

  async function deletePlan(plan) {
    if (!plan?.id) return;
    if (!window.confirm(`Delete "${plan.name || "this pass"}"? Students will not see this pass option anymore.`)) return;
    if (String(plan.id).startsWith("plan_")) {
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      return;
    }
    setDeletingPlanId(plan.id);
    try {
      const res = await fetch(`${IMPORTER_API}/pass-plans`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Plan could not be deleted.");
      const next = plans.filter(p => p.id !== plan.id).map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
      setPlans(next);
      setPassPlans(next);
      notify?.("Pass plan deleted.", "success");
      recordAdminEvent?.("plan.deleted", `Deleted pass plan ${plan.name}`, { planId: plan.id });
    } catch (err) {
      notify?.(err.message || "Pass delete failed.", "error");
    } finally {
      setDeletingPlanId(null);
    }
  }

  async function savePlans() {
    setSaving(true);
    try {
      const normalized = plans.map((p, idx) => ({
        ...p,
        durationDays: Number(p.durationDays || 1),
        price: Number(p.price || 0),
        originalPrice: Number(p.originalPrice || p.price || 0),
        label: p.label || `${p.durationDays || 1} days`,
        sortOrder: idx + 1,
      }));
      const res = await fetch(`${IMPORTER_API}/pass-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Plans could not be saved.");
      setPassPlans(data.plans?.length ? data.plans : normalized);
      setPlans(data.plans?.length ? data.plans : normalized);
      notify?.("Pass pricing saved.", "success");
      recordAdminEvent?.("plans.updated", "Updated pass pricing", { count: normalized.length });
    } catch (err) {
      notify?.(err.message || "Pass pricing save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ color: "#E2E8F0", fontSize: 15, fontWeight: 800 }}>Pass Pricing</div>
          <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>These cards control the landing page and student pass purchase options.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={addPlan}><Icon n="plus" s={13} />Add Plan</button>
          <button className="btn-primary" disabled={saving} onClick={savePlans}>{saving ? "Saving..." : "Save Pricing"}</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
        {plans.map((plan, idx) => (
          <div key={plan.id} className="card landing-hover-card" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span className="tag tag-purple">#{idx + 1}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, color: "#94A3B8", fontSize: 12 }}>
                  <input type="checkbox" checked={plan.isActive !== false} onChange={e => updatePlan(plan.id, { isActive: e.target.checked })} />
                  Active
                </label>
                <button className="btn-danger" disabled={deletingPlanId === plan.id || plans.length <= 1} title={plans.length <= 1 ? "Keep at least one pass plan" : "Delete pass plan"} onClick={() => deletePlan(plan)} style={{ minHeight: 30, padding: "5px 9px", fontSize: 11 }}>
                  <Icon n="trash" s={11} />{deletingPlanId === plan.id ? "Deleting" : "Delete"}
                </button>
              </div>
            </div>
            <input className="input-field" value={plan.name} onChange={e => updatePlan(plan.id, { name: e.target.value })} placeholder="Plan name" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input className="input-field" type="number" value={plan.price} onChange={e => updatePlan(plan.id, { price: e.target.value })} placeholder="Price" />
              <input className="input-field" type="number" value={plan.originalPrice} onChange={e => updatePlan(plan.id, { originalPrice: e.target.value })} placeholder="Original" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input className="input-field" type="number" value={plan.durationDays} onChange={e => updatePlan(plan.id, { durationDays: e.target.value, label: `${e.target.value} days` })} placeholder="Days" />
              <input className="input-field" value={plan.badge || ""} onChange={e => updatePlan(plan.id, { badge: e.target.value })} placeholder="Badge" />
            </div>
            <textarea className="input-field" value={plan.note || ""} onChange={e => updatePlan(plan.id, { note: e.target.value })} placeholder="Short description" rows={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPayments({ appSettings, setAppSettings, notify, recordAdminEvent, currentAdmin }) {
  const [draft, setDraft] = useState({ ...DEFAULT_SETTINGS.payments, ...(appSettings.payments || {}) });
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [saving, setSaving] = useState(false);
  const [busyOrder, setBusyOrder] = useState("");

  useEffect(() => { setDraft({ ...DEFAULT_SETTINGS.payments, ...(appSettings.payments || {}) }); }, [appSettings.payments]);

  const loadOrders = useCallback(async () => {
    const res = await fetch(`${IMPORTER_API}/payments?status=${encodeURIComponent(statusFilter)}`, { cache: "no-store" }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    setOrders(data?.orders || []);
  }, [statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function savePaymentSettings() {
    setSaving(true);
    try {
      const settings = { ...DEFAULT_SETTINGS, ...appSettings, payments: draft };
      const res = await fetch(`${IMPORTER_API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Payment settings could not be saved.");
      setAppSettings({ ...DEFAULT_SETTINGS, ...(data.settings || settings) });
      notify?.(draft.enabled ? "Manual UPI payments enabled." : "Manual payments turned off.", "success");
      recordAdminEvent?.("payments.settings_updated", "Updated payment settings", { enabled: !!draft.enabled, upiId: draft.upiId });
    } catch (err) {
      notify?.(err.message || "Payment settings save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function reviewOrder(order, action) {
    if (!order?.id) return;
    if (!window.confirm(`${action === "approve" ? "Approve" : "Decline"} payment from ${order.userEmail}?`)) return;
    setBusyOrder(`${action}_${order.id}`);
    try {
      const res = await fetch(`${IMPORTER_API}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, action, actor: currentAdmin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Payment review failed.");
      notify?.(action === "approve" ? "Payment approved and pass activated." : "Payment declined.", action === "approve" ? "success" : "info");
      recordAdminEvent?.(`payment.${action}d`, `${action === "approve" ? "Approved" : "Declined"} payment ${order.utr}`, { orderId: order.id, userId: order.userId, amount: order.amount });
      await loadOrders();
    } catch (err) {
      notify?.(err.message || "Payment review failed.", "error");
    } finally {
      setBusyOrder("");
    }
  }

  const pendingCount = orders.filter(o => o.status === "pending").length;
  return (
    <div className="fade-in">
      <div className="responsive-two-col" style={{ alignItems: "start", marginBottom: 16 }}>
        <div className="card landing-hover-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 850 }}>Manual UPI Payments</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>When enabled, students submit UTR and wait for approval.</div>
            </div>
            <label className="tag tag-purple" style={{ cursor: "pointer", padding: "7px 10px" }}>
              <input type="checkbox" checked={!!draft.enabled} onChange={e => setDraft(p => ({ ...p, enabled: e.target.checked }))} style={{ marginRight: 7 }} />
              {draft.enabled ? "Enabled" : "Off"}
            </label>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label style={{ color: "#64748B", fontSize: 11, display: "block", marginBottom: 5 }}>UPI ID</label>
              <input className="input-field" value={draft.upiId || ""} onChange={e => setDraft(p => ({ ...p, upiId: e.target.value }))} placeholder="yourupi@bank" />
            </div>
            <div>
              <label style={{ color: "#64748B", fontSize: 11, display: "block", marginBottom: 5 }}>Payee Name</label>
              <input className="input-field" value={draft.payeeName || ""} onChange={e => setDraft(p => ({ ...p, payeeName: e.target.value }))} placeholder="RankBooster" />
            </div>
            <div>
              <label style={{ color: "#64748B", fontSize: 11, display: "block", marginBottom: 5 }}>Student Instructions</label>
              <textarea className="input-field" rows={3} value={draft.note || ""} onChange={e => setDraft(p => ({ ...p, note: e.target.value }))} />
            </div>
            <button className="btn-primary" disabled={saving} onClick={savePaymentSettings}>{saving ? "Saving..." : "Save Payment Settings"}</button>
          </div>
        </div>
        <div className="card">
          <div style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 850, marginBottom: 12 }}>Payment Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              ["Mode", draft.enabled ? "Manual" : "Free", draft.enabled ? "#FCD34D" : "#34D399"],
              ["UPI", draft.upiId || "Not set", "#A78BFA"],
              ["Visible Orders", orders.length, "#38BDF8"],
            ].map(([label, value, color]) => (
              <div key={label} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color, fontWeight: 850, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: pendingCount ? "rgba(251,191,36,0.10)" : "rgba(16,185,129,0.08)", border: `1px solid ${pendingCount ? "rgba(251,191,36,0.22)" : "rgba(16,185,129,0.18)"}`, color: pendingCount ? "#FCD34D" : "#6EE7B7", fontSize: 12, fontWeight: 750 }}>
            {pendingCount ? `${pendingCount} pending payment${pendingCount === 1 ? "" : "s"} need review.` : "No pending payments in this view."}
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div style={{ color: "#F1F5F9", fontWeight: 850, fontSize: 14 }}>Payment Orders</div>
            <div style={{ color: "#64748B", fontSize: 12 }}>Review UTR, email, amount, and approve only after checking your bank.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="all">All</option>
            </select>
            <button className="btn-ghost" onClick={loadOrders}><Icon n="repeat" s={13} />Refresh</button>
          </div>
        </div>
        <div style={{ display: "grid" }}>
          {orders.length ? orders.map(order => (
            <div key={order.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 12, alignItems: "center", padding: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 850 }}>{order.userEmail} · ₹{order.amount}</div>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>{order.planName} · UTR: <span style={{ color: "#CBD5E1" }}>{order.utr}</span> · {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</div>
              </div>
              <span className={`tag ${order.status === "approved" ? "tag-green" : order.status === "declined" ? "tag-red" : "tag-amber"}`}>{order.status}</span>
              {order.status === "pending" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-success" style={{ minHeight: 34, padding: "7px 11px", fontSize: 12 }} disabled={busyOrder === `approve_${order.id}`} onClick={() => reviewOrder(order, "approve")}><Icon n="check" s={12} />Approve</button>
                  <button className="btn-danger" style={{ minHeight: 34, padding: "7px 11px", fontSize: 12 }} disabled={busyOrder === `decline_${order.id}`} onClick={() => reviewOrder(order, "decline")}><Icon n="x" s={12} />Decline</button>
                </div>
              ) : <div style={{ color: "#475569", fontSize: 11 }}>{order.reviewedAt ? new Date(order.reviewedAt).toLocaleString() : ""}</div>}
            </div>
          )) : (
            <div style={{ padding: 34, textAlign: "center", color: "#64748B" }}>No payment orders in this view.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminAnnouncements({ appSettings, setAppSettings, notify, recordAdminEvent }) {
  const [draft, setDraft] = useState({ ...DEFAULT_SETTINGS, ...(appSettings || {}) });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft({ ...DEFAULT_SETTINGS, ...(appSettings || {}) }); }, [appSettings]);

  function patch(section, value) {
    setDraft(prev => ({ ...prev, [section]: { ...prev[section], ...value } }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`${IMPORTER_API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Announcements could not be saved.");
      setAppSettings({ ...DEFAULT_SETTINGS, ...(data.settings || draft) });
      notify?.("Announcements saved.", "success");
      recordAdminEvent?.("announcements.updated", "Updated announcements", { banner: !!draft.banner?.enabled, home: !!draft.homeAnnouncement?.enabled });
    } catch (err) {
      notify?.(err.message || "Announcement save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ color: "#E2E8F0", fontSize: 15, fontWeight: 800 }}>Announcements</div>
          <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>One banner appears site-wide. One card appears on the logged-in home.</div>
        </div>
        <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save Announcements"}</button>
      </div>
      <div className="responsive-two-col">
        <div className="card landing-hover-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ color: "#F1F5F9", fontSize: 14, fontWeight: 800 }}>Top Website Banner</div>
              <div style={{ color: "#64748B", fontSize: 12 }}>Shows above every logged-in page.</div>
            </div>
            <label className="tag tag-purple" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={!!draft.banner?.enabled} onChange={e => patch("banner", { enabled: e.target.checked })} style={{ marginRight: 6 }} />
              Enabled
            </label>
          </div>
          <textarea className="input-field" rows={4} value={draft.banner?.text || ""} onChange={e => patch("banner", { text: e.target.value })} placeholder="Example: New BITSAT mock opens tonight at 8 PM." />
          <select className="select-field" style={{ width: "100%", marginTop: 10 }} value={draft.banner?.variant || "info"} onChange={e => patch("banner", { variant: e.target.value })}>
            <option value="info">Info purple</option>
            <option value="success">Success green</option>
            <option value="warning">Warning amber</option>
          </select>
        </div>
        <div className="card landing-hover-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ color: "#F1F5F9", fontSize: 14, fontWeight: 800 }}>Home Announcement</div>
              <div style={{ color: "#64748B", fontSize: 12 }}>Shows as a card on dashboard/home.</div>
            </div>
            <label className="tag tag-purple" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={!!draft.homeAnnouncement?.enabled} onChange={e => patch("homeAnnouncement", { enabled: e.target.checked })} style={{ marginRight: 6 }} />
              Enabled
            </label>
          </div>
          <input className="input-field" value={draft.homeAnnouncement?.title || ""} onChange={e => patch("homeAnnouncement", { title: e.target.value })} placeholder="Title" style={{ marginBottom: 10 }} />
          <textarea className="input-field" rows={5} value={draft.homeAnnouncement?.body || ""} onChange={e => patch("homeAnnouncement", { body: e.target.value })} placeholder="Longer announcement for students..." />
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ allUsers, allUC, allCourses, passPlans = PASS_PLANS, onRefresh, notify, recordAdminEvent, currentAdmin }) {
  const users = useMemo(() => allUsers || [], [allUsers]);
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(users.find(u => u.role !== "admin")?.id || users[0]?.id || "");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState("");
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const activePlans = (passPlans?.length ? passPlans : PASS_PLANS).filter(p => p.isActive !== false);
  const [manualPlanId, setManualPlanId] = useState(activePlans[0]?.id || "");

  useEffect(() => {
    if (!selectedUserId && users.length) setSelectedUserId(users.find(u => u.role !== "admin")?.id || users[0]?.id || "");
  }, [users, selectedUserId]);

  const visibleUsers = users.filter(u => {
    const hay = `${u.name || ""} ${u.email || ""} ${u.role || ""}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });
  const selectedUser = users.find(u => u.id === selectedUserId) || visibleUsers[0] || null;
  const testOptions = allCourses.flatMap(course => (course.testFolders || []).flatMap(folder => (folder.tests || []).map(test => ({
    id: cleanAttemptTestId(test),
    name: test.name,
    folder: folder.name,
    course: course.title,
  })))).filter(t => t.id);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!selectedUser?.id) {
        setHistory([]);
        return;
      }
      setHistoryLoading(true);
      const res = await fetch(`${IMPORTER_API}/attempts?offlineId=${encodeURIComponent(selectedUser.id)}`, { cache: "no-store" }).catch(() => null);
      const data = res?.ok ? await res.json().catch(() => null) : null;
      if (!cancelled) {
        setHistory(data?.attempts || []);
        setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => { cancelled = true; };
  }, [selectedUser?.id]);

  async function refreshSelectedHistory() {
    if (!selectedUser?.id) return;
    setHistoryLoading(true);
    const res = await fetch(`${IMPORTER_API}/attempts?offlineId=${encodeURIComponent(selectedUser.id)}`, { cache: "no-store" }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    setHistory(data?.attempts || []);
    setHistoryLoading(false);
    onRefresh?.();
  }

  async function deleteAttempt(attempt) {
    if (!attempt?.attemptId) return;
    if (!window.confirm(`Delete this attempt for ${selectedUser?.email}?`)) return;
    setDeleteBusy(attempt.attemptId);
    try {
      const res = await fetch(`${IMPORTER_API}/attempts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.attemptId, userId: selectedUser.id, actor: currentAdmin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Attempt delete failed.");
      notify?.("Attempt deleted.", "success");
      recordAdminEvent?.("attempt.deleted", `Deleted attempt for ${selectedUser.email}`, { attemptId: attempt.attemptId, userId: selectedUser.id });
      await refreshSelectedHistory();
    } catch (err) {
      notify?.(err.message || "Attempt delete failed.", "error");
    } finally {
      setDeleteBusy("");
    }
  }

  async function deleteAllForUser() {
    if (!selectedUser?.id) return;
    if (!window.confirm(`Delete ALL attempts for ${selectedUser.email}? This cannot be undone.`)) return;
    setDeleteBusy("user");
    try {
      const res = await fetch(`${IMPORTER_API}/attempts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, allForUser: true, actor: currentAdmin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "User attempts delete failed.");
      notify?.("All attempts for user deleted.", "success");
      recordAdminEvent?.("attempts.user_deleted", `Deleted all attempts for ${selectedUser.email}`, { userId: selectedUser.id });
      await refreshSelectedHistory();
    } catch (err) {
      notify?.(err.message || "User attempts delete failed.", "error");
    } finally {
      setDeleteBusy("");
    }
  }

  async function deleteSelectedTestAttempts() {
    if (!selectedTestIds.length) return;
    if (!window.confirm(`Delete attempts of ${selectedTestIds.length} selected test(s) for ALL users?`)) return;
    setDeleteBusy("tests");
    try {
      const res = await fetch(`${IMPORTER_API}/attempts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testIds: selectedTestIds, actor: currentAdmin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Bulk test attempt delete failed.");
      notify?.("Selected test attempts deleted.", "success");
      recordAdminEvent?.("attempts.test_deleted", `Deleted attempts for ${selectedTestIds.length} tests`, { testIds: selectedTestIds });
      setSelectedTestIds([]);
      await refreshSelectedHistory();
    } catch (err) {
      notify?.(err.message || "Bulk test attempt delete failed.", "error");
    } finally {
      setDeleteBusy("");
    }
  }

  async function manualPass(action) {
    if (!selectedUser?.id) return;
    const plan = activePlans.find(p => p.id === manualPlanId) || activePlans[0];
    if (action === "manual_grant" && !plan) {
      notify?.("Create an active pass plan first.", "error");
      return;
    }
    const verb = action === "manual_grant" ? "grant" : "remove";
    if (!window.confirm(`${verb === "grant" ? "Grant" : "Remove"} pass for ${selectedUser.email}?`)) return;
    setDeleteBusy(action);
    try {
      const res = await fetch(`${IMPORTER_API}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, user: selectedUser, plan, actor: currentAdmin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Manual pass update failed.");
      notify?.(action === "manual_grant" ? "Pass granted manually." : "Pass removed.", "success");
      recordAdminEvent?.(action === "manual_grant" ? "payment.manual_grant" : "payment.manual_remove", `${action === "manual_grant" ? "Granted" : "Removed"} pass for ${selectedUser.email}`, { userId: selectedUser.id, planId: plan?.id });
      await onRefresh?.();
    } catch (err) {
      notify?.(err.message || "Manual pass update failed.", "error");
    } finally {
      setDeleteBusy("");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>Users ({users.length})</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Pass, enrolled courses, attempts, and role are loaded from the database.</div>
        </div>
        <button className="btn-ghost" style={{ minHeight: 34, padding: "7px 13px", fontSize: 12 }} onClick={onRefresh}>
          <Icon n="repeat" s={13} />Refresh
        </button>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="responsive-two-col" style={{ alignItems: "start" }}>
          <div>
            <label style={{ display: "block", color: "#64748B", fontSize: 11, marginBottom: 6 }}>Find user by email or name</label>
            <input className="input-field" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search user..." />
          </div>
          <div>
            <label style={{ display: "block", color: "#64748B", fontSize: 11, marginBottom: 6 }}>Open full history</label>
            <select className="select-field" style={{ width: "100%", minHeight: 42 }} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
              {visibleUsers.map(u => <option key={u.id} value={u.id}>{u.email} · {u.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      {selectedUser && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 850 }}>{selectedUser.avatar}</div>
              <div>
                <div style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 850 }}>{selectedUser.name}</div>
                <div style={{ color: "#64748B", fontSize: 12 }}>{selectedUser.email}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-ghost" onClick={refreshSelectedHistory} disabled={historyLoading}><Icon n="repeat" s={13} />Refresh History</button>
              <button className="btn-danger" onClick={deleteAllForUser} disabled={deleteBusy === "user" || history.length === 0}><Icon n="trash" s={13} />{deleteBusy === "user" ? "Deleting..." : "Delete User Attempts"}</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 14 }}>
            <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 750 }}>Manual pass</span>
            <select className="select-field" value={manualPlanId} onChange={e => setManualPlanId(e.target.value)} style={{ minWidth: 180 }}>
              {activePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} · ₹{plan.price}</option>)}
            </select>
            <button className="btn-success" disabled={deleteBusy === "manual_grant"} onClick={() => manualPass("manual_grant")}><Icon n="check" s={13} />{deleteBusy === "manual_grant" ? "Granting..." : "Grant Pass"}</button>
            <button className="btn-danger" disabled={deleteBusy === "manual_revoke"} onClick={() => manualPass("manual_revoke")}><Icon n="x" s={13} />{deleteBusy === "manual_revoke" ? "Removing..." : "Remove Pass"}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
            {[
              ["Attempts", history.length, "#A78BFA"],
              ["Best Score", history.reduce((best, a) => Math.max(best, Number(a.score || 0)), 0), "#34D399"],
              ["Courses", (selectedUser.enrollments || selectedUser.coursesOpted || []).length, "#38BDF8"],
              ["Pass", passStatus(selectedUser.pass).active ? `${passStatus(selectedUser.pass).daysLeft}d left` : "Inactive", passStatus(selectedUser.pass).active ? "#FCD34D" : "#F87171"],
            ].map(([label, value, color]) => (
              <div key={label} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color, fontSize: 18, fontWeight: 850 }}>{value}</div>
                <div style={{ color: "#64748B", fontSize: 11 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {historyLoading ? [1,2,3].map(i => <div key={i} className="skeleton-card" style={{ minHeight: 58 }} />) : history.length ? history.map(attempt => (
              <div key={attempt.attemptId} className="tap-card" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 12, alignItems: "center", padding: 12, borderRadius: 13, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.035)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attempt.testName || attempt.source?.testName || "Attempt"}</div>
                  <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>{attempt.courseTitle || attempt.source?.courseTitle || "Course"} · {attempt.folderName || attempt.source?.folderName || "Folder"} · {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#A78BFA", fontWeight: 850 }}>{Number(attempt.score || 0)}/{Number(attempt.maxMarks || 0)}</div>
                  <div style={{ color: "#64748B", fontSize: 11 }}>{Number(attempt.correct || 0)} correct · {Number(attempt.wrong || 0)} wrong</div>
                </div>
                <button className="btn-danger" style={{ minHeight: 34, padding: "7px 11px", fontSize: 12 }} disabled={deleteBusy === attempt.attemptId} onClick={() => deleteAttempt(attempt)}>
                  <Icon n="trash" s={12} />{deleteBusy === attempt.attemptId ? "Deleting" : "Delete"}
                </button>
              </div>
            )) : <div style={{ color: "#64748B", fontSize: 13, padding: 16, textAlign: "center" }}>No attempts for this user.</div>}
          </div>
        </div>
      )}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ color: "#F1F5F9", fontWeight: 850, fontSize: 14 }}>Bulk Attempt Cleanup</div>
            <div style={{ color: "#64748B", fontSize: 12 }}>Delete all users' attempts for specific tests. The test itself remains available.</div>
          </div>
          <button className="btn-danger" disabled={!selectedTestIds.length || deleteBusy === "tests"} onClick={deleteSelectedTestAttempts}>
            <Icon n="trash" s={13} />{deleteBusy === "tests" ? "Deleting..." : `Delete ${selectedTestIds.length || ""} Test Attempts`}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 8, maxHeight: 230, overflow: "auto", paddingRight: 4 }}>
          {testOptions.length ? testOptions.map(test => (
            <label key={`${test.course}_${test.folder}_${test.id}`} className="tap-card" style={{ display: "flex", alignItems: "center", gap: 9, padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: selectedTestIds.includes(test.id) ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)", cursor: "pointer" }}>
              <input type="checkbox" checked={selectedTestIds.includes(test.id)} onChange={e => setSelectedTestIds(prev => e.target.checked ? [...new Set([...prev, test.id])] : prev.filter(id => id !== test.id))} />
              <span style={{ minWidth: 0 }}>
                <div style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.name}</div>
                <div style={{ color: "#64748B", fontSize: 10 }}>{test.course} · {test.folder}</div>
              </span>
            </label>
          )) : <div style={{ color: "#64748B", fontSize: 13 }}>No tests found.</div>}
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr className="table-head">
            {["User", "Email", "Role", "Joined", "Pass", "Courses", "Attempts", "Best"].map(h => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {visibleUsers.map(u => {
              const enrolled = (u.enrollments || u.coursesOpted || (allUC[u.id] || []).map(cid => ({ title: allCourses.find(c => c.id === cid)?.title || cid }))).map(c => c.title || c.id).filter(Boolean);
              const userPass = passStatus(u.pass);
              return (
                <tr key={u.id} className="table-row" onClick={() => setSelectedUserId(u.id)} style={{ cursor: "pointer", background: selectedUserId === u.id ? "rgba(124,58,237,0.08)" : undefined }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#A78BFA" }}>{u.avatar}</div>
                      <span style={{ color: "#E2E8F0" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "#64748B" }}>{u.email}</td>
                  <td><span className={u.role === "admin" ? "tag tag-amber" : "tag tag-purple"} style={{ fontSize: 10 }}>{u.role || "user"}</span></td>
                  <td style={{ color: "#475569" }}>{u.joinedAt}</td>
                  <td>
                    {userPass.active
                      ? <span className="tag tag-green" style={{ fontSize: 10 }}>{u.pass?.planName || "Pass"} · {userPass.daysLeft}d</span>
                      : <span className="tag" style={{ fontSize: 10 }}>No pass</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {enrolled.length === 0 ? <span style={{ color: "#334155", fontSize: 11 }}>None</span> : enrolled.map(e => <span key={e} className="tag tag-purple" style={{ fontSize: 10 }}>{e}</span>)}
                    </div>
                  </td>
                  <td style={{ color: "#CBD5E1", fontWeight: 700 }}>{u.attemptCount || 0}</td>
                  <td style={{ color: "#A78BFA", fontWeight: 700 }}>{u.bestScore || 0}</td>
                </tr>
              );
            })}
            {visibleUsers.length === 0 && (
              <tr className="table-row">
                <td colSpan={8} style={{ textAlign: "center", color: "#475569", padding: 28 }}>No users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ user, onLogout, onUserUpdate, courses = [], userCourseIds = [] }) {
  const [name, setName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [notebooks, setNotebooks] = useState([]);

  useEffect(() => {
    setName(user.name || "");
    setStatus("");
  }, [user.name]);

  useEffect(() => {
    let cancelled = false;
    if (user?.offlineId) {
      fetch(`${IMPORTER_API}/attempts?offlineId=${encodeURIComponent(user.offlineId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (!cancelled) setAttempts(data?.attempts || []); })
        .catch(() => { if (!cancelled) setAttempts([]); });
    }
    loadNotebookStore(user).then(data => { if (!cancelled) setNotebooks(data || []); });
    return () => { cancelled = true; };
  }, [user]);

  const enrolledCourses = courses.filter(c => userCourseIds.includes(c.id));
  const pass = passStatus(user?.pass);

  async function saveProfile() {
    const nextName = name.trim();
    if (!nextName) {
      setStatus("Name cannot be empty.");
      return;
    }
    setSaving(true);
    setStatus("");
    const updated = { ...user, name: nextName, email: user.email };
    try {
      const res = await fetch(`${IMPORTER_API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: updated, profileUpdate: true }),
      }).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (!data?.user) {
        setStatus("Could not save. Start importer and try again.");
        return;
      }
      onUserUpdate?.({ ...updated, ...data.user, email: user.email });
      setStatus("Saved to users folder.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", marginBottom: 20 }}>Account</h2>
      <div className="responsive-two-col" style={{ alignItems: "start" }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>{user.avatar}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "#475569" }}>{user.email}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Member since {user.joinedAt}</div>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#64748B", marginBottom: 5, display: "block" }}>Display Name</label>
          <input className="input-field" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveProfile()} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#64748B", marginBottom: 5, display: "block" }}>Email</label>
          <input className="input-field" value={user.email} disabled readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
        </div>
        {status && <div style={{ color: status.startsWith("Saved") ? "#34D399" : "#F87171", fontSize: 12, marginBottom: 12 }}>{status}</div>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn-primary" disabled={saving || name.trim() === user.name} onClick={saveProfile} style={{ opacity: saving || name.trim() === user.name ? 0.65 : 1 }}>
            <Icon n="check" s={14} />{saving ? "Saving..." : "Save"}
          </button>
          <button className="btn-danger signout-nudge" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={onLogout}>
            <LogoutNudgeIcon s={14} />Sign Out
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div className="card landing-hover-card">
          <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Learning Snapshot</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              ["Pass", pass.active ? "Active" : "Inactive", pass.active ? "#34D399" : "#F87171"],
              ["Courses", enrolledCourses.length, "#A78BFA"],
              ["Attempts", attempts.length, "#38BDF8"],
              ["Notebooks", notebooks.reduce((sum, n) => sum + (n.questions || []).length, 0), "#FCD34D"],
              ["Expiry", pass.active && pass.expiresAt ? new Date(pass.expiresAt).toLocaleDateString("en-IN") : "-", "#CBD5E1"],
              ["Role", user.role || "user", "#CBD5E1"],
            ].map(([label, value, color]) => (
              <div key={label} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color, fontSize: 17, fontWeight: 850 }}>{value}</div>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Enrolled Courses</div>
          {enrolledCourses.length ? enrolledCourses.map(course => (
            <div key={course.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 700 }}>{course.title}</span>
              <span style={{ color: "#64748B", fontSize: 12 }}>{configuredTestCount(course)} tests</span>
            </div>
          )) : <div style={{ color: "#64748B", fontSize: 13 }}>No courses enrolled yet.</div>}
        </div>
      </div>
      </div>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts?.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast-card ${t.type || "info"}`}>
          <Icon n={t.type === "success" ? "check-circle" : t.type === "error" ? "alert-tri" : "zap"} s={16} c={t.type === "success" ? "#34D399" : t.type === "error" ? "#F87171" : "#A78BFA"} />
          <div style={{ lineHeight: 1.45, fontWeight: 650 }}>{t.message}</div>
          <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
            <Icon n="x" s={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function AppLoadingSkeleton() {
  return (
    <div className="landing-shell" style={{ minHeight: "100vh", padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 46 }}>
        <div className="skeleton-line" style={{ width: 42, height: 42, borderRadius: 12 }} />
        <div>
          <div className="skeleton-line" style={{ width: 150, height: 16, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: 210, height: 10 }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(320px,0.45fr)", gap: 24 }}>
        <div>
          <div className="skeleton-line" style={{ width: "56%", height: 54, borderRadius: 14, marginBottom: 18 }} />
          <div className="skeleton-line" style={{ width: "42%", height: 16, marginBottom: 34 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        </div>
        <div className="skeleton-card" style={{ minHeight: 360 }} />
      </div>
    </div>
  );
}

// ─── DASHBOARD (user home) ────────────────────────────────────────────────────
function DashboardPage({ user, courses, userCourseIds, wrongQuestions, setPage, announcement }) {
  const myCourses = courses.filter(c => userCourseIds.includes(c.id));
  const [savedAttempts, setSavedAttempts] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const totalTests = myCourses.reduce((a, c) => a + configuredTestCount(c), 0);
  const currentPass = passStatus(user?.pass);

  useEffect(() => {
    let cancelled = false;
    setSavedAttempts([]);
    if (user?.offlineId) {
      fetch(`${IMPORTER_API}/attempts?offlineId=${encodeURIComponent(user.offlineId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!cancelled && data?.attempts) setSavedAttempts(data.attempts);
        })
        .catch(() => null);
    }
    return () => { cancelled = true; };
  }, [user?.id, user?.offlineId]);

  useEffect(() => {
    let cancelled = false;
    loadNotebookStore(user).then(nbs => { if (!cancelled) setNotebooks(nbs); });
    return () => { cancelled = true; };
  }, [user]);

  const attemptsForCourse = (course) => savedAttempts.filter(a => {
    const courseTitle = a.courseTitle || a.source?.courseTitle;
    return courseTitle === course?.title || a.courseId === course?.id || a.source?.courseId === course?.id;
  });
  const nextTests = myCourses.flatMap(course => (course.testFolders || []).flatMap(folder => configuredTests(folder).map(test => ({
    course,
    folder,
    test,
    done: savedAttempts.some(a => {
      const courseTitle = a.courseTitle || a.source?.courseTitle;
      const folderName = a.folderName || a.source?.folderName;
      const testName = a.testName || a.source?.testName;
      const sourceZip = a.sourceZip || a.source?.sourceZip;
      return (courseTitle === course.title || a.courseId === course.id || a.source?.courseId === course.id)
        && (!folderName || folderName === folder.name)
        && (sourceZip === test.sourceZip || testName === test.name || a.testId === test.id || a.source?.testId === test.id);
    }),
  })))).filter(x => !x.done).slice(0, 4);

  return (
    <div className="fade-in">
      {announcement?.enabled && (announcement.title || announcement.body) && (
        <div className="card landing-hover-card" style={{ marginBottom: 16, borderColor: "rgba(167,139,250,0.22)", background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(255,255,255,0.035))" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n="zap" s={17} c="#A78BFA" />
            </div>
            <div>
              <div style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 800 }}>{announcement.title || "Announcement"}</div>
              <div style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.55, marginTop: 4 }}>{announcement.body}</div>
            </div>
          </div>
        </div>
      )}
      <div className="card responsive-two-col" style={{ padding: 24, marginBottom: 16, alignItems: "center", overflow: "hidden" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 750, color: "#F1F5F9", letterSpacing: "-0.3px", marginBottom: 4 }}>Hi, {user.name.split(" ")[0]}!</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>Pick up where you left off.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => setPage("tests")}><Icon n="tests" s={15} />Open Tests</button>
            <button className="btn-ghost" onClick={() => setPage("courses")}><Icon n="courses" s={15} />My Courses</button>
            <button className="btn-ghost" onClick={() => setPage("notebook")}><Icon n="notebook" s={15} />Notebook</button>
          </div>
        </div>
        <div style={{ minWidth: 210, padding: 16, borderRadius: 14, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#CBD5E1", fontSize: 12 }}><span>Courses</span><strong>{myCourses.length}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#CBD5E1", fontSize: 12 }}><span>Tests Done</span><strong>{savedAttempts.length}/{totalTests}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#CBD5E1", fontSize: 12 }}><span>Notebooks</span><strong>{notebooks.length}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: currentPass.active ? "#34D399" : "#94A3B8", fontSize: 12 }}><span>Pass</span><strong>{currentPass.active ? `${currentPass.daysLeft}d left` : "Needed"}</strong></div>
          </div>
        </div>
      </div>

      <div className="responsive-two-col" style={{ marginBottom: 16 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 12 }}>My Courses</div>
          {myCourses.length === 0 ? (
            <div style={{ color: "#334155", fontSize: 12, textAlign: "center", padding: "16px 0" }}>
              No courses yet. <span style={{ color: "#A78BFA", cursor: "pointer" }} onClick={() => setPage("courses")}>Browse →</span>
            </div>
          ) : myCourses.map(c => {
            const done = attemptsForCourse(c).length;
            const total = configuredTestCount(c);
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div title={c.title} style={{ fontSize: 12, color: "#CBD5E1", overflowWrap: "anywhere" }}>{c.title}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{done}/{total} tests completed</div>
                  <div className="progress-bar" style={{ marginTop: 7 }}>
                    <div className="progress-fill" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%`, background: c.color || "#7C3AED" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>Next Tests</div>
            <button className="btn-ghost" style={{ minHeight: 30, padding: "5px 10px", fontSize: 11 }} onClick={() => setPage("tests")}>View all</button>
          </div>
          {nextTests.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: "18px 0" }}>No pending tests right now.</div>
          ) : nextTests.map(({ course, folder, test }) => (
            <div key={`${course.id}_${folder.id}_${test.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon n="clipboard" s={15} c="#A78BFA" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#CBD5E1", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.name}</div>
                <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{folder.name} · {course.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 4 }}>Notebook</div>
          <div style={{ color: "#64748B", fontSize: 12 }}>
            {notebooks.length ? `${notebooks.length} notebook${notebooks.length === 1 ? "" : "s"} ready for revision.` : "Save questions from solutions and revise them here."}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setPage("notebook")}><Icon n="notebook" s={14} />Open Notebook</button>
      </div>
    </div>
  );
}

// ─── TEST ATTEMPT REPORT ─────────────────────────────────────────────────────
function TestAttemptReport({ report, user, onBack }) {
  const [mode, setMode] = useState("report");
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [fullTest, setFullTest] = useState(null);
  const [loadingFullTest, setLoadingFullTest] = useState(false);
  const [reportImages, setReportImages] = useState({});
  const [loadingReportImage, setLoadingReportImage] = useState(false);
  const [solutionSubjectIdx, setSolutionSubjectIdx] = useState(0);
  const [solutionQIdx, setSolutionQIdx] = useState(0);
  const [notebookModal, setNotebookModal] = useState(false);
  const [notebookName, setNotebookName] = useState("");
  const [reportNotebooks, setReportNotebooks] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ loading: true, entries: [], myRank: null, total: 0 });

  const { course, folder, test, attempt } = report || {};
  const attemptHasDetails = !!(
    attempt && (
      (Array.isArray(attempt.attemptedQuestions) && attempt.attemptedQuestions.length) ||
      (attempt.questionTimes && Object.keys(attempt.questionTimes).length) ||
      (Array.isArray(attempt.subjects) && attempt.subjects.length)
    )
  );
  const summary = detail || (attemptHasDetails ? attempt : null) || {
    attemptId: attempt?.attemptId,
    submittedAt: attempt?.submittedAt,
    source: {
      courseTitle: course?.title || attempt?.courseTitle,
      folderName: folder?.name || attempt?.folderName,
      testName: test?.name || attempt?.testName,
    },
    score: Number(attempt?.score || test?.score || 0),
    maxMarks: Number(attempt?.maxMarks || test?.maxMarks || 0),
    percentage: Number(attempt?.percentage ?? attempt?.percentile ?? test?.percentile ?? 0),
    correct: Number(attempt?.correct || 0),
    wrong: Number(attempt?.wrong || 0),
    unattempted: Number(attempt?.unattempted || 0),
    subjects: attempt?.subjects || [],
    attemptedQuestions: attempt?.attemptedQuestions || [],
  };
  const reportTestId = test?.id || attempt?.testId || attempt?.source?.testId || summary.source?.testId;

  useEffect(() => {
    let cancelled = false;
    if (attemptHasDetails) { setDetail(attempt); return undefined; }
    if (!attempt?.attemptId) return undefined;
    if (!user?.offlineId) return undefined;
    setLoadingDetail(true);
    fetch(`${IMPORTER_API}/attempt?offlineId=${encodeURIComponent(user.offlineId)}&attemptId=${encodeURIComponent(attempt.attemptId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.attempt) setDetail(data.attempt);
      })
      .catch(() => null)
      .finally(() => { if (!cancelled) setLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [user?.id, user?.offlineId, attempt?.attemptId, attemptHasDetails, attempt]);

  const reportZipName = test?.sourceZip || summary.source?.sourceZip;
  const reportSourceUrl = normalizeExternalTestUrl(test?.sourceUrl || summary.source?.sourceUrl || "");
  const reportCourseName = course?.folderName || course?.title || summary.source?.courseTitle;
  const reportFolderName = test?.sourceFolder || folder?.name || summary.source?.folderName;
  const needsFullTest = !!reportZipName && !(test?.subjects || []).some(s => (s.questions || []).some(q => q.images?.length));
  useEffect(() => {
    let cancelled = false;
    if (reportSourceUrl) {
      setLoadingFullTest(true);
      loadExternalTestJson(reportSourceUrl)
        .then(data => { if (!cancelled && data) setFullTest({ ...data, sourceUrl: reportSourceUrl }); })
        .catch(() => null)
        .finally(() => { if (!cancelled) setLoadingFullTest(false); });
      return () => { cancelled = true; };
    }
    const zipName = reportZipName;
    const courseName = reportCourseName;
    const folderName = reportFolderName;
    if (!zipName || !courseName || !folderName) return undefined;
    if (!needsFullTest && (test?.subjects || []).length) return undefined;
    setLoadingFullTest(true);
    const qs = new URLSearchParams({ course: courseName, folder: folderName, zip: zipName });
    fetch(`${IMPORTER_API}/test?${qs.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.test) setFullTest(data.test);
      })
      .catch(() => null)
      .finally(() => { if (!cancelled) setLoadingFullTest(false); });
    return () => { cancelled = true; };
  }, [needsFullTest, reportCourseName, reportFolderName, reportZipName, reportSourceUrl, test?.subjects]);

  const displayTest = fullTest || test;
  const subjects = displayTest?.subjects || [];
  const reportActiveQuestion = subjects[solutionSubjectIdx]?.questions?.[solutionQIdx];
  const reportActiveQId = reportActiveQuestion?.id;
  const reportLazyImages = reportActiveQId ? reportImages[reportActiveQId] : null;
  const totalQuestions = subjects.reduce((a, s) => a + (s.questions?.length || 0), 0) || summary.totalQuestions || 0;
  const attemptedMap = (summary.attemptedQuestions || []).reduce((acc, q) => {
    acc[q.qId] = q;
    return acc;
  }, {});
  const submitted = summary.submittedAt ? new Date(summary.submittedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Saved attempt";
  const attemptedCount = Number(summary.correct || 0) + Number(summary.wrong || 0);
  const accuracy = attemptedCount ? Math.round((Number(summary.correct || 0) / attemptedCount) * 100) : 0;
  const attemptRate = totalQuestions ? Math.round((attemptedCount / totalQuestions) * 100) : 0;
  const timeSpentSec = Number(summary.timeSpentSec || Object.values(summary.questionTimes || {}).reduce((a, v) => a + Number(v || 0), 0));
  const timeSpentMin = timeSpentSec ? Math.round(timeSpentSec / 60) : 0;
  const avgTimePerAttempt = attemptedCount && timeSpentSec ? Math.round(timeSpentSec / attemptedCount) : 0;
  const marksPerMinute = timeSpentMin ? (Number(summary.score || 0) / timeSpentMin).toFixed(1) : "—";
  const subjectRows = summary.subjects?.length ? summary.subjects : subjects.map(s => ({ name: s.name, totalQuestions: s.questions.length, attempted: 0, correct: 0, wrong: 0, score: 0, maxMarks: s.questions.reduce((a, q) => a + (q.marks?.cm || 0), 0), timeSpentSec: 0 }));
  const momentumData = (summary.attemptedQuestions || []).map((q, i, arr) => ({
    name: `Q${q.globalQNum || i + 1}`,
    score: arr.slice(0, i + 1).reduce((a, x) => a + Number(x.marksAwarded || 0), 0),
  }));
  const insights = [
    accuracy >= 80 ? "Accuracy is strong. Keep the same selection discipline." : accuracy >= 55 ? "Accuracy is decent, but review wrong attempts before increasing speed." : "Accuracy is the main leak. Slow down on uncertain questions.",
    attemptRate < 55 ? "Attempt rate is low. Prioritize easier questions earlier in the paper." : attemptRate > 85 ? "Attempt rate is high. Check if wrong answers are costing marks." : "Attempt coverage is balanced.",
    timeSpentSec ? `Average time per attempted question: ${avgTimePerAttempt}s.` : "Timing data starts from new attempts after this update.",
    Number(summary.wrong || 0) > Number(summary.correct || 0) * 0.35 ? "Negative marking risk is high. Mark fewer guesses for review." : "Wrong-answer pressure is under control.",
  ];
  const leaderboardLabel = leaderboard.loading ? "..." : leaderboard.myRank ? `#${leaderboard.myRank}/${leaderboard.total || leaderboard.myRank}` : "New";
  const formatLeaderboardTime = sec => {
    const n = Number(sec || 0);
    if (!n) return "time not recorded";
    const min = Math.floor(n / 60);
    const rem = n % 60;
    return min ? `${min}m ${rem}s` : `${rem}s`;
  };

  useEffect(() => {
    let cancelled = false;
    const testId = reportTestId;
    if (!testId) {
      setLeaderboard({ loading: false, entries: [], myRank: null, total: 0 });
      return undefined;
    }
    setLeaderboard(prev => ({ ...prev, loading: true }));
    const qs = new URLSearchParams({
      testId,
      offlineId: user?.offlineId || user?.id || "",
      limit: "8",
    });
    fetch(`${IMPORTER_API}/leaderboard?${qs.toString()}`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled) {
          setLeaderboard({
            loading: false,
            entries: data?.entries || [],
            myRank: data?.myRank || null,
            mine: data?.mine || null,
            total: data?.total || 0,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setLeaderboard({ loading: false, entries: [], myRank: null, total: 0 });
      });
    return () => { cancelled = true; };
  }, [reportTestId, user?.id, user?.offlineId]);

  useEffect(() => {
    let cancelled = false;
    if (!reportActiveQId || reportActiveQuestion?.images?.length || reportLazyImages || !reportZipName || !reportCourseName || !reportFolderName) return undefined;
    setLoadingReportImage(true);
    const qs = new URLSearchParams({ course: reportCourseName, folder: reportFolderName, zip: reportZipName, qId: reportActiveQId });
    fetch(`${IMPORTER_API}/question-images?${qs.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.images) setReportImages(prev => ({ ...prev, [reportActiveQId]: data.images }));
      })
      .catch(() => null)
      .finally(() => { if (!cancelled) setLoadingReportImage(false); });
    return () => { cancelled = true; };
  }, [reportActiveQId, reportActiveQuestion?.images, reportLazyImages, reportZipName, reportCourseName, reportFolderName]);

  useEffect(() => {
    let cancelled = false;
    loadNotebookStore(user).then(nbs => { if (!cancelled) setReportNotebooks(nbs); });
    return () => { cancelled = true; };
  }, [user]);

  function optLabel(v) {
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 1 && n <= 26) return String.fromCharCode(64 + n);
    return String(v);
  }

  function addActiveQuestionToNotebook(notebookId, sourceNotebooks = reportNotebooks) {
    const activeSubject = subjects[solutionSubjectIdx] || subjects[0];
    const activeQuestion = activeSubject?.questions?.[solutionQIdx];
    if (!activeQuestion || !user?.id) return;
    const row = attemptedMap[activeQuestion.id];
    const correct = (Array.isArray(activeQuestion.correctAnswer) ? activeQuestion.correctAnswer : [activeQuestion.correctAnswer]).filter(v => v !== undefined && v !== null);
    const marked = row?.selected || [];
    const item = {
      id: `${summary.attemptId || "attempt"}_${activeQuestion.id}`,
      qId: activeQuestion.id,
      globalQNum: activeQuestion.globalQNum || solutionQIdx + 1,
      subject: activeSubject?.name || "",
      type: activeQuestion.type || "mcq",
      courseTitle: reportCourseName || "",
      folderName: reportFolderName || "",
      testName: displayTest?.name || summary.source?.testName || "",
      sourceZip: reportZipName || "",
      sourceUrl: reportSourceUrl || "",
      marked: marked.length ? marked.map(optLabel).join(", ") : "",
      correct: correct.length ? correct.map(optLabel).join(", ") : "",
      isCorrect: row ? !!row.isCorrect : undefined,
      marksAwarded: row?.marksAwarded ?? 0,
      addedAt: new Date().toISOString(),
    };
    const updated = sourceNotebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      const items = (nb.items || []).filter(x => x.id !== item.id);
      return { ...nb, items: [item, ...items], questionIds: Array.from(new Set([...(nb.questionIds || []), item.qId])) };
    });
    setReportNotebooks(updated);
    saveNotebookStore(user.id, updated, user);
    setNotebookModal(false);
  }

  function createNotebookAndAdd() {
    const name = notebookName.trim();
    if (!name || !user?.id) return;
    const nb = { id: "nb" + Date.now(), name, questionIds: [], items: [], createdAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) };
    const withNew = [...reportNotebooks, nb];
    setReportNotebooks(withNew);
    setNotebookName("");
    addActiveQuestionToNotebook(nb.id, withNew);
  }

  if (!report) return null;

  if (mode === "solution") {
    const activeSubject = subjects[solutionSubjectIdx] || subjects[0];
    const activeQuestion = activeSubject?.questions?.[solutionQIdx];
    const activeImages = activeQuestion?.images?.length ? activeQuestion.images : ((activeQuestion?.id === reportActiveQId ? reportLazyImages : reportImages[activeQuestion?.id]) || []);
    const qOffset = subjects.slice(0, solutionSubjectIdx).reduce((a, s) => a + (s.questions?.length || 0), 0);
    const row = activeQuestion ? attemptedMap[activeQuestion.id] : null;
    const correct = activeQuestion ? (Array.isArray(activeQuestion.correctAnswer) ? activeQuestion.correctAnswer : [activeQuestion.correctAnswer]).filter(v => v !== undefined && v !== null) : [];
    const marked = row?.selected || [];
    const ok = row ? !!row.isCorrect : false;
    const marks = row ? row.marksAwarded : 0;
    const numOpts = parseInt(activeQuestion?.answerOptions) || 4;
    const timeForQ = row?.timeSpentSec || summary.questionTimes?.[activeQuestion?.id] || 0;
    const watermarkEmail = String(user?.email || "").trim();
    const watermarkTiles = Array.from({ length: 28 });
    function setSolutionQuestion(si, qi) {
      setSolutionSubjectIdx(si);
      setSolutionQIdx(qi);
    }
    return (
      <div className="report-shell fade-in">
        <div className="report-top">
          <div>
            <div className="report-title">{displayTest?.name || summary.source?.testName} Solutions</div>
            <div className="report-subtitle">Navigate by subject and question. Images load from the converted test cache.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="report-tab" onClick={() => setMode("report")}><span className="tab-icon"><Icon n="chevleft" s={13} /></span> Scorecard</button>
            <button className="report-tab close-tab" onClick={onBack}><span className="tab-icon"><Icon n="x" s={13} /></span> Close</button>
          </div>
        </div>

        <div className="subject-strip">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#64748B", fontSize: 12, fontWeight: 600, padding: "0 4px", whiteSpace: "nowrap" }}>
            <Icon n="folder" s={14} /> Subjects
          </span>
          {subjects.map((s, si) => (
            <button key={s.id || s.name} className={`subject-pill ${si === solutionSubjectIdx ? "active" : ""}`} onClick={() => setSolutionQuestion(si, 0)}>
              {s.name} ({s.questions.length})
            </button>
          ))}
        </div>

        <div className="solution-layout">
          <aside className="solution-palette card">
            <div className="report-section-title" style={{ marginBottom: 4 }}>{activeSubject?.name}</div>
            <div style={{ color: "#64748B", fontSize: 12, marginBottom: 14 }}>Choose a question</div>
            <div className="solution-grid">
              {(activeSubject?.questions || []).map((q, qi) => {
                const r = attemptedMap[q.id];
                const cls = !r ? "blank" : r.isCorrect ? "correct" : "wrong";
                return (
                  <button key={q.id} className={`solution-qbtn ${cls} ${qi === solutionQIdx ? "active" : ""}`} onClick={() => setSolutionQuestion(solutionSubjectIdx, qi)}>
                    {qi + 1}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 16, color: "#94A3B8", fontSize: 12 }}>
              <span><span className="tag tag-green">Correct</span></span>
              <span><span className="tag tag-red">Wrong</span></span>
              <span><span className="tag tag-purple">Not attempted</span></span>
            </div>
          </aside>

          <main style={{ minWidth: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 className="report-title" style={{ marginBottom: 4 }}>Question {qOffset + solutionQIdx + 1}</h2>
              <p style={{ color: "#64748B", fontSize: 13 }}>{activeSubject?.name} · {activeQuestion?.type?.toUpperCase() || "MCQ"} · Time spent: {timeForQ ? `${timeForQ}s` : "not recorded"}</p>
          {!detail && loadingDetail && <p style={{ color: "#A78BFA", fontSize: 12, marginTop: 8 }}>Loading detailed attempt...</p>}
          {loadingFullTest && <p style={{ color: "#A78BFA", fontSize: 12, marginTop: 8 }}>Loading original question images...</p>}
          {!detail && !loadingDetail && !(summary.attemptedQuestions || []).length && <p style={{ color: "#FCD34D", fontSize: 12, marginTop: 8 }}>Full saved answer details are not available for this older attempt.</p>}
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", background: "rgba(124,58,237,0.14)", display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`tag ${!row ? "tag-purple" : ok ? "tag-green" : "tag-red"}`}>{!row ? "Not attempted" : ok ? "Correct" : "Wrong"}</span>
                <span style={{ marginLeft: "auto", color: row ? ok ? "#34D399" : "#F87171" : "#64748B", fontWeight: 650 }}>{marks > 0 ? `+${marks}` : marks}</span>
              </div>
              <div style={{ padding: 18 }}>
                    {activeImages.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                        {activeImages.map((src, i) => (
                          <div key={i} className="solution-image-watermark-wrap">
                            <img src={src} alt="" />
                            {watermarkEmail && (
                              <div className="solution-watermark-layer" aria-hidden="true">
                                {watermarkTiles.map((_, wi) => <span key={wi}>{watermarkEmail}</span>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: 18, borderRadius: 10, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B", marginBottom: 14 }}>
                        {loadingFullTest || loadingReportImage ? "Fetching the original question image..." : "Question image is not available for this saved attempt."}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8, marginBottom: 12 }}>
                      {activeQuestion?.type === "integer" ? (
                        <div style={{ padding: 12, borderRadius: 9, background: "rgba(255,255,255,0.04)", color: "#CBD5E1" }}>Numerical answer</div>
                      ) : Array.from({ length: numOpts }, (_, i) => String(i + 1)).map(opt => {
                        const isMarked = marked.map(String).includes(opt);
                        const isAns = correct.map(String).includes(opt);
                        return (
                          <div key={opt} className={`review-option ${isAns ? "correct" : isMarked ? "marked" : ""}`}>
                            {optLabel(opt)} {isAns && <span style={{ fontSize: 11 }}>Correct</span>} {isMarked && !isAns && <span style={{ fontSize: 11 }}>Marked</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", color: "#94A3B8", fontSize: 13 }}>
                      <span>Your answer: <strong style={{ color: marked.length ? "#F8FAFC" : "#64748B" }}>{marked.length ? marked.map(optLabel).join(", ") : "Not attempted"}</strong></span>
                      <span>Correct: <strong style={{ color: "#34D399" }}>{correct.map(optLabel).join(", ") || "—"}</strong></span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
                      <button className="btn-ghost" disabled={solutionSubjectIdx === 0 && solutionQIdx === 0} onClick={() => {
                        if (solutionQIdx > 0) setSolutionQIdx(q => q - 1);
                        else if (solutionSubjectIdx > 0) {
                          const prev = subjects[solutionSubjectIdx - 1];
                          setSolutionSubjectIdx(s => s - 1);
                          setSolutionQIdx((prev?.questions?.length || 1) - 1);
                        }
                      }}>Previous</button>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-ghost" onClick={() => setNotebookModal(true)}><Icon n="notebook" s={14} />Add to Notebook</button>
                        <button className="btn-primary" onClick={() => {
                          if (solutionQIdx < (activeSubject?.questions?.length || 0) - 1) setSolutionQIdx(q => q + 1);
                          else if (solutionSubjectIdx < subjects.length - 1) {
                            setSolutionSubjectIdx(s => s + 1);
                            setSolutionQIdx(0);
                          }
                        }}>Next</button>
                      </div>
                    </div>
              </div>
            </div>
          </main>
        </div>
        <Modal open={notebookModal} onClose={() => setNotebookModal(false)} title="Add to Notebook" width={430}>
          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
            {reportNotebooks.length === 0 && <div style={{ color: "#64748B", fontSize: 12, padding: "8px 0" }}>No notebooks yet. Create one below.</div>}
            {reportNotebooks.map(nb => (
              <button key={nb.id} className="btn-ghost" style={{ justifyContent: "space-between", minHeight: 42 }} onClick={() => addActiveQuestionToNotebook(nb.id)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon n="notebook" s={14} />{nb.name}</span>
                <span style={{ color: "#64748B", fontSize: 11 }}>{(nb.items || nb.questionIds || []).length} qs</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input-field" placeholder="New notebook name" value={notebookName} onChange={e => setNotebookName(e.target.value)} onKeyDown={e => e.key === "Enter" && createNotebookAndAdd()} />
            <button className="btn-primary" onClick={createNotebookAndAdd}>Create</button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="report-shell fade-in">
      <div className="report-top">
        <div>
          <div className="report-title">Attempt Analysis</div>
          <div className="report-subtitle">{displayTest?.name || summary.source?.testName} · {submitted}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="report-tab active"><span className="tab-icon"><Icon n="bar" s={13} /></span> Scorecard</button>
          <button className="report-tab" onClick={() => setMode("solution")}><span className="tab-icon"><Icon n="eye" s={13} /></span> Solutions</button>
          <button className="report-tab close-tab" onClick={onBack}><span className="tab-icon"><Icon n="x" s={13} /></span> Close</button>
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: 1420, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 12, marginBottom: 18 }}>
          {[
            ["Score", `${summary.score}/${summary.maxMarks}`, "#A78BFA", "target"],
            ["Percentage", `${summary.percentage}%`, "#38BDF8", "percent"],
            ["Leaderboard", leaderboardLabel, "#F59E0B", "award"],
            ["Accuracy", `${accuracy}%`, "#34D399", "check-circle"],
            ["Attempt Rate", `${attemptRate}%`, "#FCD34D", "zap"],
            ["Paper Time", timeSpentSec ? `${timeSpentMin} min` : "—", "#94A3B8", "clock"],
            ["Marks / Min", marksPerMinute, "#F59E0B", "trending-up"],
          ].map(([label, value, color, icon]) => (
            <div key={label} className="card report-metric">
              <div className="report-metric-icon" style={{ color, background: `${color}1F` }}><Icon n={icon} s={16} /></div>
              <div>
                <div className="report-metric-value" style={{ color }}>{value}</div>
                <div className="report-metric-label">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="responsive-two-col" style={{ marginBottom: 18 }}>
          <div className="card" style={{ minHeight: 260 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div className="report-section-title">Score Momentum</div>
              <span className="tag tag-purple">{momentumData.length || 0} attempted Qs</span>
            </div>
            {momentumData.length ? (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={momentumData}>
                  <defs>
                    <linearGradient id="attemptMomentum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1E1B4B", border: "1px solid #4C1D95", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#A78BFA" fill="url(#attemptMomentum)" strokeWidth={2} dot={false} name="Cumulative Score" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#64748B", padding: 32, textAlign: "center" }}>No attempted-question sequence available yet.</div>
            )}
          </div>

          <div className="card">
            <div className="report-section-title" style={{ marginBottom: 12 }}>Useful Insights</div>
            <div style={{ display: "grid", gap: 10 }}>
              {insights.map(text => (
                <div key={text} className="insight-card" style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.5 }}>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <div className="report-section-title">Leaderboard</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                Best attempt per student for this test.
              </div>
            </div>
            <span className="tag tag-amber">{leaderboard.myRank ? `Your Rank #${leaderboard.myRank}` : leaderboard.loading ? "Loading" : "No rank yet"}</span>
          </div>
          {leaderboard.loading ? (
            <div style={{ display: "grid", gap: 10 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px", gap: 10, alignItems: "center" }}>
                  <div className="skeleton-line" style={{ width: 30, height: 30, borderRadius: 10 }} />
                  <div>
                    <div className="skeleton-line" style={{ width: "42%", height: 12, marginBottom: 7 }} />
                    <div className="skeleton-line" style={{ width: "28%", height: 9 }} />
                  </div>
                  <div className="skeleton-line" style={{ width: 70, height: 14 }} />
                </div>
              ))}
            </div>
          ) : leaderboard.entries.length ? (
            <div>
              {leaderboard.entries.map(entry => (
                <div key={`${entry.userId}_${entry.attemptId}`} className={`leaderboard-row ${entry.isMe ? "me" : ""}`}>
                  <div className="leaderboard-rank">#{entry.rank}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div className="leaderboard-avatar">{entry.avatar || "ST"}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="leaderboard-name">{entry.name}{entry.isMe ? " · You" : ""}</div>
                      <div className="leaderboard-meta">{entry.correct} correct · {entry.wrong} wrong · {formatLeaderboardTime(entry.timeSpentSec)}</div>
                    </div>
                  </div>
                  <div style={{ color: "#F8FAFC", fontWeight: 850, textAlign: "right" }}>
                    {entry.score}<span style={{ color: "#64748B", fontSize: 11, fontWeight: 700 }}>/{entry.maxMarks}</span>
                  </div>
                </div>
              ))}
              {!leaderboard.entries.some(e => e.isMe) && leaderboard.mine && (
                <div className="leaderboard-row me" style={{ marginTop: 8 }}>
                  <div className="leaderboard-rank">#{leaderboard.mine.rank}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div className="leaderboard-avatar">{leaderboard.mine.avatar || "ME"}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="leaderboard-name">{leaderboard.mine.name || "You"} · You</div>
                      <div className="leaderboard-meta">{leaderboard.mine.correct} correct · {leaderboard.mine.wrong} wrong · {formatLeaderboardTime(leaderboard.mine.timeSpentSec)}</div>
                    </div>
                  </div>
                  <div style={{ color: "#F8FAFC", fontWeight: 850, textAlign: "right" }}>
                    {leaderboard.mine.score}<span style={{ color: "#64748B", fontSize: 11, fontWeight: 700 }}>/{leaderboard.mine.maxMarks}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.035)", color: "#64748B", textAlign: "center" }}>
              Your score will appear here as soon as this attempt syncs.
            </div>
          )}
        </div>

        <div className="responsive-two-col" style={{ marginBottom: 18 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="report-section-title" style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Subject Engine</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr className="table-head">{["Subject", "Attempted", "Accuracy", "Score", "Time"].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {subjectRows.map(s => {
                  const acc = s.attempted ? Math.round((Number(s.correct || 0) / Number(s.attempted || 1)) * 100) : 0;
                  return (
                    <tr key={s.id || s.name} className="table-row">
                      <td style={{ color: "#CBD5E1", fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: "#94A3B8" }}>{s.attempted}/{s.totalQuestions}</td>
                      <td style={{ color: acc >= 70 ? "#34D399" : acc >= 45 ? "#FCD34D" : "#F87171", fontWeight: 600 }}>{acc}%</td>
                      <td style={{ color: "#A78BFA", fontWeight: 650 }}>{s.score}/{s.maxMarks}</td>
                      <td style={{ color: "#94A3B8" }}>{s.timeSpentSec ? `${Math.round(s.timeSpentSec / 60)} min` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="report-section-title" style={{ marginBottom: 12 }}>Time Analysis</div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Total active paper time", timeSpentSec ? `${timeSpentMin} min` : "Not recorded"],
                ["Avg time / attempted Q", avgTimePerAttempt ? `${avgTimePerAttempt}s` : "—"],
                ["Unattempted questions", summary.unattempted || Math.max(totalQuestions - attemptedCount, 0)],
                ["Correct : Wrong", `${summary.correct || 0} : ${summary.wrong || 0}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#64748B", fontSize: 12 }}>{label}</span>
                  <strong style={{ color: "#F1F5F9" }}>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div>
            <div style={{ color: "#F1F5F9", fontWeight: 600, marginBottom: 4 }}>Deep review is ready</div>
            <div style={{ color: "#64748B", fontSize: 13 }}>Open the navigator to inspect every question, answer, and original image.</div>
          </div>
          <button className="btn-primary" onClick={() => setMode("solution")}>View Solutions</button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState("courses");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [courses, setCourses] = useState([]);
  const [userCourseIds, setUserCourseIds] = useState([]);
  const [wrongQuestions, setWrongQuestions] = useState({});
  const [activeTest, setActiveTest] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [passPlans, setPassPlans] = useState(PASS_PLANS);
  const [appSettings, setAppSettings] = useState(DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = "info") => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }].slice(-4));
    window.setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const syncFolderLibrary = useCallback(async () => {
    const res = await fetch(`${IMPORTER_API}/library`).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setCourses(data.courses || []);
  }, []);

  const syncAdminConfig = useCallback(async () => {
    const [planRes, settingsRes] = await Promise.all([
      fetch(`${IMPORTER_API}/pass-plans`, { cache: "no-store" }).catch(() => null),
      fetch(`${IMPORTER_API}/settings`, { cache: "no-store" }).catch(() => null),
    ]);
    const planData = planRes?.ok ? await planRes.json().catch(() => null) : null;
    const settingsData = settingsRes?.ok ? await settingsRes.json().catch(() => null) : null;
    if (planData?.plans?.length) setPassPlans(planData.plans);
    if (settingsData?.settings) setAppSettings({ ...DEFAULT_SETTINGS, ...settingsData.settings });
  }, []);

  useEffect(() => {
    initStore();
    setWrongQuestions({});
    syncFolderLibrary();
    syncAdminConfig();
  }, [syncFolderLibrary, syncAdminConfig]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${IMPORTER_API}/auth`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled) return;
        if (data?.user) {
          const syncedCourseIds = (data.coursesOpted || []).map(c => c.id).filter(Boolean);
          setUser(ensureOfflineUser({ ...data.user, syncedCourseIds, pass: data.pass || data.user.pass }));
          setUserCourseIds(syncedCourseIds);
          const hashPage = (window.location.hash || "#dashboard").replace("#", "") || "dashboard";
          setPage(VALID_PAGES.includes(hashPage) ? hashPage : "dashboard");
        }
      })
      .catch(() => null)
      .finally(() => { if (!cancelled) setAuthChecked(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const id = setInterval(syncFolderLibrary, 60000);
    return () => clearInterval(id);
  }, [syncFolderLibrary]);

  useEffect(() => {
    if (!user || !page) return;
    if (window.location.hash !== `#${page}`) window.location.hash = page;
  }, [user, page]);

  useEffect(() => {
    if (!user) return undefined;
    const onHashChange = () => {
      const next = (window.location.hash || "#dashboard").replace("#", "") || "dashboard";
      const nextPage = VALID_PAGES.includes(next) ? next : "dashboard";
      setActiveReport(null);
      setActiveTest(null);
      setPage(nextPage);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [user]);

  async function handleLogin(u) {
    const offlineUser = ensureOfflineUser(u);
    setUser(offlineUser);
    if (Array.isArray(u.syncedCourseIds)) {
      setUserCourseIds(u.syncedCourseIds);
    } else {
      setUserCourseIds([]);
    }
    setPage("dashboard");
    const synced = await syncOfflineUser(offlineUser, Array.isArray(u.syncedCourseIds) ? u.syncedCourseIds : [], courses);
    if (synced) {
      setUser(synced);
      if (synced.syncedCourseIds?.length) setUserCourseIds(synced.syncedCourseIds);
    }
  }

  async function handleLogout() {
    await fetch(`${IMPORTER_API}/auth`, { method: "DELETE" }).catch(() => null);
    setUser(null);
    setUserCourseIds([]);
    setPage("courses");
    window.location.hash = "";
  }

  if (!authChecked) return (
    <>
      <style>{GS}</style>
      <AppLoadingSkeleton />
    </>
  );

  if (!user) return (
    <>
      <style>{GS}</style>
      <LoginPage onLogin={handleLogin} passPlans={passPlans} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );

  if (activeTest) return (
    <TestInterface
      test={activeTest}
      user={user}
      onAttemptSaved={(attempt) => {
        setActiveTest(null);
        setActiveReport({
          course: { id: activeTest.courseId, title: activeTest.courseTitle },
          folder: { id: activeTest.folderId, name: activeTest.folderName },
          test: activeTest,
          attempt,
        });
      }}
      onExit={() => setActiveTest(null)}
    />
  );

  const renderPage = () => {
    if (activeReport) return <TestAttemptReport report={activeReport} user={user} onBack={() => setActiveReport(null)} />;
    switch (page) {
      case "dashboard": return <DashboardPage user={user} courses={courses} userCourseIds={userCourseIds} wrongQuestions={wrongQuestions} setPage={setPage} announcement={appSettings.homeAnnouncement} />;
      case "courses": return <CoursesPage courses={courses} userCourseIds={userCourseIds} setUserCourseIds={setUserCourseIds} userId={user.id} user={user} onUserUpdate={setUser} passPlans={passPlans} appSettings={appSettings} notify={notify} />;
      case "tests": return <TestsPage courses={courses} setCoursesView={setCourses} userCourseIds={userCourseIds} onStartTest={setActiveTest} onSetPage={setPage} onViewAnalysis={setActiveReport} user={user} />;
      case "analysis": return <AnalysisPage courses={courses} userCourseIds={userCourseIds} user={user} />;
      case "notebook": return <NotebookPage user={user} />;
      case "admin": return user.role === "admin" ? <AdminPage allCourses={courses} setAllCourses={setCourses} passPlans={passPlans} setPassPlans={setPassPlans} appSettings={appSettings} setAppSettings={setAppSettings} user={user} notify={notify} /> : null;
      case "settings": return <SettingsPage user={user} courses={courses} userCourseIds={userCourseIds} onUserUpdate={setUser} onLogout={handleLogout} />;
      default: return null;
    }
  };

  return (
    <>
      <style>{GS}</style>
      <div className="app-shell">
        {!activeReport && <Sidebar user={user} page={page} setPage={setPage} courses={courses} userCourseIds={userCourseIds} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onLogout={handleLogout} />}
        <div className="app-main" style={activeReport ? { padding: 0 } : undefined}>
          {!activeReport && appSettings.banner?.enabled && appSettings.banner?.text && (
            <div className={`site-banner banner-${appSettings.banner.variant || "info"}`}>
              <Icon n={appSettings.banner.variant === "success" ? "check-circle" : appSettings.banner.variant === "warning" ? "alert-tri" : "zap"} s={15} />
              <span>{appSettings.banner.text}</span>
            </div>
          )}
          {/* Top bar */}
          {!activeReport && <div className="app-topbar">
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {page !== "dashboard" && (
                <button onClick={() => setPage("dashboard")} style={{ minHeight: 40, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 16px", color: "#94A3B8", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 7 }}>
                  <Icon n="chevleft" s={12} />Dashboard
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user.role === "admin" && <span className="tag tag-amber" style={{ fontSize: 11 }}><Icon n="zap" s={10} /> Admin</span>}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, cursor: "pointer" }} onClick={() => setPage("settings")}>{user.avatar}</div>
            </div>
          </div>}
          {renderPage()}
        </div>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
