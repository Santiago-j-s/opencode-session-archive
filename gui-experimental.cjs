"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const t=require("solid-js/web"),u=require("@opencode/plugin/gui"),m=require("solid-js");var C=t.template("<div class=santi-archive-toast><div><span role=status>Archiving session</span> <span role=timer>in <!> ");const f=5,k=u.Plugin.define({setup(i){const[p,v]=m.createSignal(!1),[w,s]=m.createSignal();let o;i.add(u.Style,`
      .santi-archive-toast {
        position: fixed;
        inset-inline-end: 32px;
        inset-block-end: 48px;
        z-index: 999;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: start;
        gap: 8px;
        box-sizing: border-box;
        width: min(320px, calc(100vw - 48px));
        padding: 12px;
        border-radius: 8px;
        background: var(--v2-background-bg-layer-01);
        color: var(--v2-text-text-base);
        box-shadow: var(--v2-elevation-floating);
      }
      .santi-archive-toast [role="timer"] {
        font-variant-numeric: tabular-nums;
      }
    `),i.add(u.Slot,{at:"window.bottom",render:()=>t.createComponent(m.Show,{get when(){return w()},children:e=>(()=>{var n=C(),g=n.firstChild,c=g.firstChild,a=c.nextSibling,r=a.nextSibling,l=r.firstChild,d=l.nextSibling;return d.nextSibling,t.insert(r,()=>e().seconds,d),t.insert(r,()=>e().seconds===1?"second":"seconds",null),t.insert(n,t.createComponent(i.ui.Button,{size:"small",onClick:()=>e().undo(),children:"Undo"}),null),t.insert(n,t.createComponent(i.ui.IconButton,{icon:"close",label:"Dismiss archive countdown",size:"small",onClick:()=>s(void 0)}),null),n})()})});const h=e=>{if(e.pending)return!1;const{data:n}=e.server;return!(n.session.get(e.id)?.time.archived||n.session.status(e.id)==="running"||n.session.permission.list(e.id)?.length||n.session.form.list(e.id,e.location)?.length)},S=async e=>{try{if(!h(e)){i.toast.show({title:"Archive skipped",description:"The session can no longer be archived."});return}await e.server.client.session.update({sessionID:e.id,archived:!0}),i.tabs.list().some(n=>n.key===e.tab&&n.session?.key===e.key)&&i.tabs.close(e.tab)}catch(n){i.toast.show({variant:"error",title:"Could not archive session",description:n instanceof Error?n.message:String(n)})}finally{v(!1)}};return i.add(u.Command,()=>{const e=i.sessions.current();return{id:"archive",title:"Archive current session",description:"Move this session to the archive",section:"session",bind:"mod+shift+m",editable:!0,enabled:!p()&&!!e&&h(e),run:()=>{const n=i.sessions.current();if(!n||p()||!h(n))return;const g=performance.now()+f*1e3;let c;const a=()=>{o===a&&(o=void 0,clearTimeout(c),s(void 0),v(!1))},r=()=>{const l=g-performance.now();if(l<=0){o=void 0,s(void 0),S(n);return}const d=Math.ceil(l/1e3);s(b=>b&&{...b,seconds:d}),c=setTimeout(r,Math.ceil(l-(d-1)*1e3))};o=a,v(!0),s({seconds:f,undo:a}),r()}}}),()=>o?.()}});exports.default=k;
