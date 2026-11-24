// Oracle Fusion ERP Financials 26D — SLA & FAH Presentation Controller & Interactive Animators
(function () {
  const D = window.FusionFAHPresentationData;
  if (!D) {
    console.error('FusionFAHPresentationData is not loaded.');
    return;
  }

  // フラット化された全スライド配列を作成
  const flatSlides = [];
  D.CHAPTERS.forEach((ch, chIdx) => {
    ch.slides.forEach((sl, slIdx) => {
      flatSlides.push({ ch, chIdx, sl, slIdx, globalIdx: flatSlides.length });
    });
  });

  let currentGlobalIdx = 0;
  let mechStepIdx = 0;
  let mechTimer = null;
  let selectedSubmoduleId = 'AP';
  let selectedFahStepNo = 1;
  let srBalPhaseIdx = 0;
  let srBalTimer = null;
  let inspectorModuleFilter = 'ALL';
  let inspectorSearch = '';

  const ccidMap = new Map(D.CCID_LIST.map(c => [c.id, c]));

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtYen(n) {
    return `${Number(n || 0).toLocaleString('ja-JP')}円`;
  }

  function svgEl(tag, attrs = {}, text = null) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
    if (text !== null) el.textContent = text;
    return el;
  }

  function estSvgTextWidth(str, fontSize, isMono = false) {
    let w = 0;
    for (const ch of String(str || '')) {
      w += ch.charCodeAt(0) <= 0x7f ? fontSize * (isMono ? 0.65 : 0.62) : fontSize * 1.06;
    }
    return w;
  }

  function fitSvgText(str, maxPx, fontSize, isMono = false) {
    const s = String(str || '');
    if (estSvgTextWidth(s, fontSize, isMono) <= maxPx) return s;
    let out = '';
    const ellW = fontSize * 1.06;
    for (const ch of s) {
      if (estSvgTextWidth(out + ch, fontSize, isMono) + ellW > maxPx) break;
      out += ch;
    }
    return out + '…';
  }

  function splitSubTwoLines(str, maxPx, fontSize) {
    const s = String(str || '');
    if (estSvgTextWidth(s, fontSize, false) <= maxPx) return [s];
    const parts = s.split(' · ');
    if (parts.length > 1) {
      let line1 = '';
      for (let i = 0; i < parts.length; i++) {
        const cand = line1 ? `${line1} · ${parts[i]}` : parts[i];
        if (i === 0 || estSvgTextWidth(cand, fontSize, false) <= maxPx) {
          line1 = cand;
        } else {
          const line2 = parts.slice(i).join(' · ');
          return [line1, line2];
        }
      }
    }
    const mid = Math.ceil(s.length / 2);
    const spaceIdx = s.lastIndexOf(' ', mid + 4);
    const slashIdx = s.lastIndexOf('/', mid + 4);
    const cut = Math.max(spaceIdx, slashIdx) > 4 ? Math.max(spaceIdx, slashIdx) + 1 : mid;
    return [s.slice(0, cut).trim(), s.slice(cut).trim()];
  }

  function stopAllSlideTimers() {
    if (mechTimer) { clearInterval(mechTimer); mechTimer = null; }
    if (srBalTimer) { clearInterval(srBalTimer); srBalTimer = null; }
  }

  function goToSlide(globalIdx) {
    stopAllSlideTimers();
    currentGlobalIdx = Math.max(0, Math.min(flatSlides.length - 1, globalIdx));
    renderDeck();
  }

  function renderChrome() {
    const cur = flatSlides[currentGlobalIdx];
    const elChTabs = document.getElementById('chapter-tabs');
    const elSubTabs = document.getElementById('slide-subtabs');
    const elDots = document.getElementById('slide-progress-dots');

    elChTabs.innerHTML = '';
    D.CHAPTERS.forEach((ch, idx) => {
      const b = document.createElement('button');
      b.className = `ch-tab${idx === cur.chIdx ? ' active' : ''}`;
      b.textContent = ch.shortTitle;
      b.title = ch.title;
      b.addEventListener('click', () => {
        const firstIdx = flatSlides.findIndex(x => x.chIdx === idx);
        goToSlide(firstIdx);
      });
      elChTabs.appendChild(b);
    });

    elSubTabs.innerHTML = '';
    cur.ch.slides.forEach((sl, sIdx) => {
      const b = document.createElement('button');
      b.className = `subtab-btn${sIdx === cur.slIdx ? ' active' : ''}`;
      b.textContent = sl.title;
      b.addEventListener('click', () => {
        const target = flatSlides.findIndex(x => x.chIdx === cur.chIdx && x.slIdx === sIdx);
        goToSlide(target);
      });
      elSubTabs.appendChild(b);
    });

    document.getElementById('slide-chapter-badge').textContent = `Chapter ${cur.ch.num}`;
    document.getElementById('slide-title').textContent = cur.sl.title;
    document.getElementById('slide-counter').textContent = `${currentGlobalIdx + 1} / ${flatSlides.length}`;
    document.getElementById('slide-goal').textContent = `【学習ゴール】 ${cur.ch.goal}`;

    document.getElementById('btn-slide-prev').disabled = currentGlobalIdx === 0;
    document.getElementById('btn-slide-next').disabled = currentGlobalIdx === flatSlides.length - 1;

    elDots.innerHTML = '';
    flatSlides.forEach((item, i) => {
      const d = document.createElement('button');
      d.className = `prog-dot${i === currentGlobalIdx ? ' active' : ''}`;
      d.textContent = String(i + 1);
      d.title = item.sl.title;
      d.addEventListener('click', () => goToSlide(i));
      elDots.appendChild(d);
    });
  }

  // === Slide 1-1: Executive Summary ===
  function renderCh1Summary(stage) {
    stage.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-num">5大サブ元帳統合</div>
          <div class="kpi-label">AP · AR · FA · LA · FAH</div>
          <div class="kpi-desc">各業務モジュールの取引仕様の差異を吸収し、SLAが統一された仕訳・監査構造に変換します。</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-num">ルール駆動 (AMB)</div>
          <div class="kpi-label">コードレス柔軟仕訳生成</div>
          <div class="kpi-desc">算式・マッピングセット・ADR・JLT・摘要・JERSの組み合わせにより、会計基準変更へ即応します。</div>
        </div>
        <div class="kpi-card purple">
          <div class="kpi-num">サポート参照 (SR)</div>
          <div class="kpi-label">残高有(Y) / 残高無(N) 分析</div>
          <div class="kpi-desc">勘定組合せ (AFF) を肥大化させず、XLA_AC_BALANCES で取引先別・サブ元帳横断残高を管理します。</div>
        </div>
        <div class="kpi-card rose">
          <div class="kpi-num">完全な監査証跡</div>
          <div class="kpi-label">OEDMF 26D 双方向リンク</div>
          <div class="kpi-desc">GL_BALANCES ⇄ GL_IMPORT_REFERENCES ⇄ XLA_AE_LINES ⇄ XLA_DISTRIBUTION_LINKS ⇄ 元取引まで100%追跡。</div>
        </div>
      </div>

      <div class="two-col">
        <div class="panel">
          <h3>🏛️ Oracle Fusion SLA の基本思想（なぜ直接GLに書かないのか？）</h3>
          <table class="pres-table">
            <thead><tr><th>課題領域</th><th>SLAによる解決アプローチ</th><th>主要OEDMF 26Dテーブル</th></tr></thead>
            <tbody>
              <tr><td><strong>複数会計基準対応</strong></td><td>同一イベント (XLA_EVENTS) に対し、プライマリ元帳とセカンダリ元帳へ別々の会計方式を同時適用可能。</td><td class="mono">XLA_EVENTS, XLA_ACCTG_METHODS_B</td></tr>
              <tr><td><strong>AFF9軸の動的上書</strong></td><td>業務入力の仮CCIDをそのまま使わず、Mapping Set + ADR で部門・科目・管理コードを動的解決。</td><td class="mono">XLA_MAPPING_SETS_B, XLA_SEG_RULES_B</td></tr>
              <tr><td><strong>補助元帳残高の肥大防止</strong></td><td>取引先等をAFFセグメント化せず、残高有サポート参照(XLA_AC_BALANCES)で管理しCCID爆発を防止。</td><td class="mono">XLA_ANALYTICAL_HDRS_B, XLA_AC_BALANCES</td></tr>
              <tr><td><strong>外部システム統一統制</strong></td><td>FAHにより外部POS/SaaS課金データも標準AP/ARと全く同じAMBルール・SLA残高管理へ合流。</td><td class="mono">XLA_SUBLEDGERS, XLA_TRANSACTION_HEADERS</td></tr>
            </tbody>
          </table>
        </div>

        <div class="panel">
          <h3>📊 本プレゼンで扱う一貫サンプル（2026-04期：総計 4,250,000円）</h3>
          <table class="pres-table">
            <thead><tr><th>サブ元帳 (APPL_ID)</th><th>代表イベント / 取引</th><th>生成仕訳概要</th><th class="num">仕訳金額</th></tr></thead>
            <tbody>
              <tr><td><strong>AP 買掛管理 (200)</strong></td><td>INVOICE VALIDATED (AP-2026-001)</td><td>DR 外注費50万+税5万 / CR 買掛金55万</td><td class="num">550,000円</td></tr>
              <tr><td><strong>AR 売掛管理 (222)</strong></td><td>INV_CREATE (AR-2026-001)</td><td>DR 売掛金88万 / CR 製品売上80万+税8万</td><td class="num">880,000円</td></tr>
              <tr><td><strong>FA 固定資産 (140)</strong></td><td>DEPRECIATION (FA-2026-001)</td><td>DR 減価償却費12万 / CR 償却累計額12万</td><td class="num">120,000円</td></tr>
              <tr><td><strong>LA リース会計 (10522)</strong></td><td>LEASE_BOOKING (LA-2026-001)</td><td>DR 使用権資産240万 / CR リース負債240万</td><td class="num">2,400,000円</td></tr>
              <tr class="row-hl"><td><strong>FAH 会計ハブ (20001)</strong></td><td>XX_CLOUD_REV_RECOG (FAH-2026-001)</td><td>算式(300×1,000) / ADR(4102) で売掛金30万</td><td class="num">300,000円</td></tr>
              <tr><td colspan="3"><strong>SLA仕訳(12明細) & GL_BALANCES(11勘定) 合計 (DR = CR)</strong></td><td class="num"><strong>4,250,000円</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // === Slide 1-2: Interactive SVG Mechanism Flow ===
  function renderCh1Mechanism(stage) {
    const curStep = D.MECHANISM_STEPS[mechStepIdx] || D.MECHANISM_STEPS[0];
    stage.innerHTML = `
      <div class="anim-toolbar">
        <div class="anim-pills" id="mech-pills"></div>
        <button id="btn-mech-play" class="anim-play-btn">${mechTimer ? '⏸️ 停止' : '▶️ 自動再生'}</button>
      </div>
      <div class="svg-box">
        <svg id="mech-svg" viewBox="0 0 1250 420" preserveAspectRatio="xMidYMid meet"></svg>
      </div>
      <div class="panel" style="margin-top:12px;">
        <h3>${esc(curStep.title)}</h3>
        ${curStep.points.map(p => `<p style="margin:4px 0;font-size:12.5px;color:#334155;">• ${esc(p)}</p>`).join('')}
      </div>
    `;

    const pillsEl = document.getElementById('mech-pills');
    D.MECHANISM_STEPS.forEach((st, idx) => {
      const b = document.createElement('button');
      b.className = `anim-pill${idx === mechStepIdx ? ' active' : ''}`;
      b.textContent = st.label;
      b.addEventListener('click', () => {
        if (mechTimer) { clearInterval(mechTimer); mechTimer = null; }
        mechStepIdx = idx;
        renderCh1Mechanism(stage);
      });
      pillsEl.appendChild(b);
    });

    document.getElementById('btn-mech-play').addEventListener('click', () => {
      if (mechTimer) {
        clearInterval(mechTimer);
        mechTimer = null;
        renderCh1Mechanism(stage);
      } else {
        mechTimer = setInterval(() => {
          mechStepIdx = (mechStepIdx + 1) % D.MECHANISM_STEPS.length;
          renderCh1Mechanism(stage);
        }, 2800);
        renderCh1Mechanism(stage);
      }
    });

    // Draw SVG
    const svg = document.getElementById('mech-svg');
    const defs = svgEl('defs');
    const marker = svgEl('marker', { id: 'm-arr', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto' });
    marker.appendChild(svgEl('path', { d: 'M 0 1 L 9 5 L 0 9 z', fill: '#ea580c' }));
    defs.appendChild(marker);
    D.MECHANISM_NODES.forEach(n => {
      const cp = svgEl('clipPath', { id: `clip-mech-${n.id}` });
      cp.appendChild(svgEl('rect', { x: n.x + 2, y: n.y + 2, width: Math.max(10, n.w - 4), height: Math.max(10, n.h - 4), rx: 7 }));
      defs.appendChild(cp);
    });
    svg.appendChild(defs);

    // 4段階背景レーン
    const lanes = [
      { x: 10, w: 265, title: '① 5大サブ元帳トランザクション', bg: '#fff1f2', bd: '#fda4af' },
      { x: 294, w: 334, title: '② イベント捕捉 & AMBルールエンジン', bg: '#fefce8', bd: '#fde047' },
      { x: 648, w: 318, title: '③ SLA出力仕訳 & サポート参照残高', bg: '#faf5ff', bd: '#d8b4fe' },
      { x: 984, w: 256, title: '④ GL総勘定元帳 & 残高', bg: '#eff6ff', bd: '#93c5fd' }
    ];
    lanes.forEach(ln => {
      svg.appendChild(svgEl('rect', { x: ln.x, y: 8, width: ln.w, height: 398, rx: 10, fill: ln.bg, stroke: ln.bd, 'stroke-width': 1.5 }));
      svg.appendChild(svgEl('text', { x: ln.x + 12, y: 28, fill: '#0f172a', 'font-size': '12', 'font-weight': '800' }, ln.title));
    });

    const nodeMap = new Map(D.MECHANISM_NODES.map(n => [n.id, n]));
    const activeSet = new Set(curStep.activeNodes);
    const doneSet = new Set(curStep.doneNodes);

    // Active Flows
    curStep.flows.forEach((fl, i) => {
      const f = nodeMap.get(fl.from);
      const t = nodeMap.get(fl.to);
      if (!f || !t) return;
      let sx, sy, ex, ey;
      if (t.x > f.x + f.w) {
        sx = f.x + f.w; sy = f.y + f.h / 2;
        ex = t.x; ey = t.y + t.h / 2;
      } else {
        sx = f.x + f.w / 2; sy = f.y + f.h;
        ex = t.x + t.w / 2; ey = t.y;
      }
      const mxRaw = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      const d = Math.abs(ex - sx) > Math.abs(ey - sy)
        ? `M ${sx} ${sy} C ${mxRaw} ${sy}, ${mxRaw} ${ey}, ${ex} ${ey}`
        : `M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey}`;
      const pid = `mf-${mechStepIdx}-${i}`;
      svg.appendChild(svgEl('path', { id: pid, d, class: 'anim-flow-line', 'marker-end': 'url(#m-arr)' }));
      const c = svgEl('circle', { r: '4.5', fill: '#ea580c', stroke: '#fff', 'stroke-width': '1.2' });
      const am = svgEl('animateMotion', { dur: '1.4s', repeatCount: 'indefinite' });
      const mp = svgEl('mpath');
      mp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pid}`);
      am.appendChild(mp);
      c.appendChild(am);
      svg.appendChild(c);

      if (fl.label) {
        const w = Math.max(54, Math.ceil(estSvgTextWidth(fl.label, 9.2, false) + 18));
        const mx = Math.max(w / 2 + 6, Math.min(1250 - w / 2 - 6, mxRaw));
        svg.appendChild(svgEl('rect', { x: mx - w / 2, y: my - 9, width: w, height: 17, rx: 4, fill: '#fff7ed', stroke: '#ea580c' }));
        svg.appendChild(svgEl('text', { x: mx, y: my + 3, fill: '#9a3412', 'font-size': '9.2', 'font-weight': '800', 'text-anchor': 'middle' }, fl.label));
      }
    });

    // Nodes
    D.MECHANISM_NODES.forEach(n => {
      const isActive = activeSet.has(n.id);
      const isDone = doneSet.has(n.id);
      const fill = isActive ? '#dcfce7' : (isDone ? '#dbeafe' : '#ffffff');
      const stroke = isActive ? '#16a34a' : (isDone ? '#2563eb' : '#cbd5e1');
      const badgeBg = isActive ? '#16a34a' : (isDone ? '#2563eb' : '#64748b');
      const g = svgEl('g', { class: isActive ? 'node-active' : '', opacity: (isActive || isDone) ? '1' : '0.68' });
      g.appendChild(svgEl('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8, fill, stroke, 'stroke-width': isActive ? '2.5' : '1.6' }));

      const badgeFs = 8.0;
      const bw = Math.max(44, Math.ceil(estSvgTextWidth(n.badge, badgeFs, false) + 12));
      g.appendChild(svgEl('rect', { x: n.x + n.w - bw - 6, y: n.y + 5, width: bw, height: 14, rx: 4, fill: badgeBg }));
      g.appendChild(svgEl('text', { x: n.x + n.w - bw / 2 - 6, y: n.y + 15, fill: '#fff', 'font-size': String(badgeFs), 'font-weight': '800', 'text-anchor': 'middle' }, n.badge));

      const textG = svgEl('g', { 'clip-path': `url(#clip-mech-${n.id})` });
      if (n.h >= 66) {
        // 中・大型ノード: 右上バッジの下にタイトルとサブ(最大2行)を分離配置
        const availW = n.w - 18;
        const unitT = estSvgTextWidth(n.title, 1, false) || 1;
        const tFs = Math.min(11.2, Math.max(8.5, availW / unitT));
        textG.appendChild(svgEl('text', { x: n.x + 9, y: n.y + 33, fill: '#0f172a', 'font-size': tFs.toFixed(1), 'font-weight': '800' }, fitSvgText(n.title, availW, tFs, false)));

        const subFs = 9.0;
        const subLines = splitSubTwoLines(n.sub, availW, subFs);
        const subTextEl = svgEl('text', { x: n.x + 9, y: n.y + 49, fill: '#475569', 'font-size': String(subFs), 'font-weight': '600' });
        subLines.forEach((ln, idx) => {
          const lineFit = fitSvgText(ln, availW, subFs, false);
          subTextEl.appendChild(svgEl('tspan', { x: n.x + 9, y: n.y + (idx === 0 ? 49 : 62) }, lineFit));
        });
        textG.appendChild(subTextEl);
      } else {
        // 左列5ノード (h=58): 1行目左にタイトル、右にバッジ、2行目にサブ
        const avail1 = Math.max(40, n.w - 10 - bw - 12);
        const unitT = estSvgTextWidth(n.title, 1, false) || 1;
        const tFs = Math.min(11.0, Math.max(8.5, avail1 / unitT));
        textG.appendChild(svgEl('text', { x: n.x + 9, y: n.y + 20, fill: '#0f172a', 'font-size': tFs.toFixed(1), 'font-weight': '800' }, fitSvgText(n.title, avail1, tFs, false)));

        const avail2 = n.w - 18;
        const unitS = estSvgTextWidth(n.sub, 1, false) || 1;
        const sFs = Math.min(9.5, Math.max(8.2, avail2 / unitS));
        textG.appendChild(svgEl('text', { x: n.x + 9, y: n.y + 40, fill: '#475569', 'font-size': sFs.toFixed(1), 'font-weight': '600' }, fitSvgText(n.sub, avail2, sFs, false)));
      }
      g.appendChild(textG);
      svg.appendChild(g);
    });
  }

  // === Slide 1-3: AMB Hierarchy Tree ===
  function renderCh1Hierarchy(stage) {
    stage.innerHTML = `
      <div class="svg-box" style="margin-bottom:14px;">
        <svg viewBox="0 0 1200 320" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="h-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
            </marker>
          </defs>
          <!-- Tree Connections -->
          <path d="M 210 65 L 246 65" stroke="#2563eb" stroke-width="2.2" marker-end="url(#h-arr)" />
          <path d="M 516 65 L 552 65" stroke="#2563eb" stroke-width="2.2" marker-end="url(#h-arr)" />
          <path d="M 840 65 L 876 65" stroke="#2563eb" stroke-width="2.2" marker-end="url(#h-arr)" />
          <!-- Branch down from JERS (x=878..1182) -->
          <path d="M 1030 100 L 1030 135" stroke="#7e22ce" stroke-width="2" />
          <path d="M 150 135 L 1030 135" stroke="#7e22ce" stroke-width="2" />
          <path d="M 150 135 L 150 165" stroke="#7e22ce" stroke-width="2" marker-end="url(#h-arr)" />
          <path d="M 435 135 L 435 165" stroke="#7e22ce" stroke-width="2" marker-end="url(#h-arr)" />
          <path d="M 720 135 L 720 165" stroke="#7e22ce" stroke-width="2" marker-end="url(#h-arr)" />
          <path d="M 1030 135 L 1030 165" stroke="#7e22ce" stroke-width="2" marker-end="url(#h-arr)" />
          <path d="M 150 230 L 150 258" stroke="#ea580c" stroke-width="2" marker-end="url(#h-arr)" />
          <path d="M 435 230 L 435 258" stroke="#ea580c" stroke-width="2" marker-end="url(#h-arr)" />

          <!-- Top Row -->
          <rect x="16" y="30" width="194" height="70" rx="10" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>
          <text x="113" y="55" text-anchor="middle" font-size="12" font-weight="800" fill="#1e3a8a">1. GL_LEDGERS</text>
          <text x="113" y="76" text-anchor="middle" font-size="10.5" fill="#334155">JP_CORP_LEDGER (300001)</text>

          <rect x="248" y="30" width="268" height="70" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
          <text x="382" y="55" text-anchor="middle" font-size="11.2" font-weight="800" fill="#14532d">2. 会計方式 (XLA_ACCTG_METHODS_B)</text>
          <text x="382" y="76" text-anchor="middle" font-size="10.5" fill="#334155">XX_JP_CORP_AM (COA=101)</text>

          <rect x="554" y="30" width="286" height="70" rx="10" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
          <text x="697" y="55" text-anchor="middle" font-size="11.2" font-weight="800" fill="#713f12">3. 方式割当 (XLA_ACCTG_METHOD_RULES)</text>
          <text x="697" y="76" text-anchor="middle" font-size="10.5" fill="#334155">AP(200) AR(222) FA(140) LA FAH</text>

          <rect x="878" y="30" width="304" height="70" rx="10" fill="#fae8ff" stroke="#9333ea" stroke-width="2.5"/>
          <text x="1030" y="55" text-anchor="middle" font-size="11.5" font-weight="800" fill="#581c87">4. JERS (XLA_LINE_DEFINITIONS_B)</text>
          <text x="1030" y="76" text-anchor="middle" font-size="10.5" fill="#334155">イベントクラス/タイプ別仕訳ルールセット</text>

          <!-- Components Row -->
          <rect x="25" y="165" width="250" height="65" rx="8" fill="#ffffff" stroke="#64748b" stroke-width="1.8"/>
          <text x="150" y="188" text-anchor="middle" font-size="11.2" font-weight="800" fill="#0f172a">5a. JLT (XLA_ACCT_LINE_TYPES_B)</text>
          <text x="150" y="208" text-anchor="middle" font-size="10" fill="#475569">貸借・会計クラス・ENTERED_AMOUNT属性</text>

          <rect x="305" y="165" width="260" height="65" rx="8" fill="#ffffff" stroke="#64748b" stroke-width="1.8"/>
          <text x="435" y="188" text-anchor="middle" font-size="11.2" font-weight="800" fill="#0f172a">5b. ADR (XLA_SEG_RULES_B)</text>
          <text x="435" y="208" text-anchor="middle" font-size="10" fill="#475569">AFF9軸ルール・XLA_CONDITIONS条件分岐</text>

          <rect x="595" y="165" width="250" height="65" rx="8" fill="#ffffff" stroke="#64748b" stroke-width="1.8"/>
          <text x="720" y="188" text-anchor="middle" font-size="11.2" font-weight="800" fill="#0f172a">5c. 摘要 (XLA_DESCRIPTIONS_B)</text>
          <text x="720" y="208" text-anchor="middle" font-size="10" fill="#475569">ヘッダ/明細テキスト動的生成</text>

          <rect x="880" y="165" width="302" height="65" rx="8" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
          <text x="1031" y="188" text-anchor="middle" font-size="11.2" font-weight="800" fill="#9a3412">5d. サポート参照 (XLA_ANALYTICAL_*)</text>
          <text x="1031" y="208" text-anchor="middle" font-size="9.6" fill="#7c2d12">残高有(SR_COUNTERPARTY) & 残高無(SR_EXT_TRACE)</text>

          <!-- Leaves -->
          <rect x="25" y="258" width="250" height="48" rx="7" fill="#fefce8" stroke="#ca8a04" stroke-width="1.5"/>
          <text x="150" y="280" text-anchor="middle" font-size="11.5" font-weight="800" fill="#713f12">6a. 算式 (XLA_FORMULAS_B)</text>
          <text x="150" y="297" text-anchor="middle" font-size="10" fill="#475569">数量(NUMBER1) × 単価(NUMBER2)</text>

          <rect x="305" y="258" width="260" height="48" rx="7" fill="#fefce8" stroke="#ca8a04" stroke-width="1.5"/>
          <text x="435" y="280" text-anchor="middle" font-size="11.5" font-weight="800" fill="#713f12">6b. MapSet (XLA_MAPPING_SETS_B)</text>
          <text x="435" y="297" text-anchor="middle" font-size="10" fill="#475569">SaaS_USAGE → 4102 等</text>
        </svg>
      </div>
      <div class="panel">
        <h3>💡 実務ベストプラクティス：下位部品（ボトムアップ）から上位（JERS・会計方式）へ組み立てる</h3>
        <p style="margin:0;font-size:12.5px;color:#334155;">JERS でルールセットをコンパイル (VALIDATION_STATUS_CODE = "C") する際は、参照先の「算式 → マッピングセット → ADR/条件 → 摘要 → JLT → サポート参照」が事前に有効化されている必要があります。</p>
      </div>
    `;
  }

  // === Slide 2-1: Standard Submodules Overview ===
  function renderCh2Overview(stage) {
    stage.innerHTML = `
      <div class="panel" style="margin-bottom:14px;">
        <h3>🔧 標準サブモジュール (AP · AR · FA · LA) SLAセットアップ・ボトムアップ 9工程</h3>
        <table class="pres-table">
          <thead><tr><th>工程順</th><th>セットアップオブジェクト</th><th>標準提供 (Seeded S) の扱い</th><th>カスタム拡張 (Custom C) 方針</th><th>格納 OEDMF 26D テーブル</th></tr></thead>
          <tbody>
            <tr><td><strong>Step 1</strong></td><td>イベントクラス/タイプ＆ソース</td><td>AP/AR/FA/LA は Oracle 事前定義済</td><td>原則変更不要（不足時のみカスタムソース/DFF参照）</td><td class="mono">XLA_EVENT_TYPES_B, XLA_SOURCES_B</td></tr>
            <tr><td><strong>Step 2</strong></td><td>ユーザー定義算式</td><td>標準金額ソースを補完</td><td>数量×単価や按分率計算が必要なモジュールに追加</td><td class="mono">XLA_FORMULAS_B, XLA_FORMULA_DETAILS</td></tr>
            <tr><td><strong>Step 3</strong></td><td>マッピング・セット</td><td>例示なし/個別要件定義</td><td>購買カテゴリ・品目区分・資産カテゴリ・リース種別→科目(SEG3)</td><td class="mono">XLA_MAPPING_SETS_B, VALUES</td></tr>
            <tr><td><strong>Step 4</strong></td><td>勘定科目ルール (ADR)＆条件</td><td>標準配賦継承ルールあり</td><td>コピーして条件(XLA_CONDITIONS)＋MapSetで上書設定</td><td class="mono">XLA_SEG_RULES_B, DETAILS, XLA_CONDITIONS</td></tr>
            <tr><td><strong>Step 5</strong></td><td>仕訳摘要ルール</td><td>標準摘要定義済</td><td>日本固有の伝票番号・取引先名連結形式へ拡張</td><td class="mono">XLA_DESCRIPTIONS_B</td></tr>
            <tr><td><strong>Step 6</strong></td><td>仕訳明細ルール (JLT)</td><td>標準JLT定義済</td><td>借方/貸方単位に会計属性 (算式/ソース) を紐付</td><td class="mono">XLA_ACCT_LINE_TYPES_B, XLA_JLT_ACCT_ATTRS</td></tr>
            <tr><td><strong>Step 7</strong></td><td>サポート参照 (SR)</td><td>初期状態では未割当</td><td>全サブ元帳共通の SR_COUNTERPARTY (残高有) と SR_EXT_TRACE (無) を紐付</td><td class="mono">XLA_ANALYTICAL_*, XLA_LINE_DEFN_AC_ASSGNS</td></tr>
            <tr><td><strong>Step 8</strong></td><td>仕訳入力ルールセット (JERS)</td><td>Seeded JERS は直接変更不可</td><td>必ず「コピー(複製)」して Custom JERS を作成・有効化("C")</td><td class="mono">XLA_LINE_DEFINITIONS_B, *_ASSGNS</td></tr>
            <tr><td><strong>Step 9</strong></td><td>会計方式＆元帳オプション</td><td>STANDARD_ACCRUAL</td><td>XX_JP_CORP_AM をコピー作成し GL_LEDGERS と XLA_LEDGER_OPTIONS へ適用</td><td class="mono">XLA_ACCTG_METHODS_B, XLA_LEDGER_OPTIONS</td></tr>
          </tbody>
        </table>
      </div>
      <div class="two-col">
        <div class="panel"><h3>⚠️ 絶対に守る運用原則：Seededルールは上書き禁止</h3><p style="margin:0;font-size:12.5px;">Oracle提供の標準JERS・会計方式 (Owner='S') はパッチ適用等でリセットされるリスクがあります。次のスライドで示す AP・AR・FA・LA のカスタマイズは必ず「複製 (Owner='C')」で構築してください。</p></div>
        <div class="panel"><h3>📌 全サブモジュール共通 検証チェック</h3><p style="margin:0;font-size:12.5px;">JERS の検証ステータスが <code>C (Complete)</code> になり、XLA_ACCTG_METHOD_RULES で期間有効化されて初めて Create Accounting に反映されます。</p></div>
      </div>
    `;
  }

  // === Slide 2-2: Interactive AP / AR / FA / LA Setup ===
  function renderCh2Submodules(stage) {
    const mod = D.SUBMODULE_SETUPS.find(m => m.id === selectedSubmoduleId) || D.SUBMODULE_SETUPS[0];
    stage.innerHTML = `
      <div class="mod-tabs" id="submod-tabs">
        ${D.SUBMODULE_SETUPS.map(m => `
          <button type="button" class="mod-tab${m.id === mod.id ? ' active' : ''}" data-mod-id="${m.id}">
            <strong>${esc(m.title)}</strong>
            <span>${esc(m.tagline)}</span>
          </button>
        `).join('')}
      </div>

      <div class="panel" style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
          <strong style="font-size:14px;color:#1e3a8a;">${esc(mod.title)}</strong>
          <span class="mono" style="background:#e2e8f0;padding:3px 8px;border-radius:4px;">ナビ: ${esc(mod.uiNav)}</span>
        </div>
        <table class="pres-table">
          <thead><tr><th style="width:17%;">設定工程</th><th style="width:23%;">OEDMF 26D テーブル</th><th style="width:20%;">定義コード例</th><th>具体的セットアップ仕様・サンプル値</th></tr></thead>
          <tbody>
            ${mod.components.map(c => `
              <tr>
                <td><strong>${esc(c.step)}</strong></td>
                <td class="mono">${esc(c.table)}</td>
                <td class="mono"><strong>${esc(c.code)}</strong></td>
                <td>${esc(c.detail)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h3>📒 ${esc(mod.id)} 仕訳生成結果プレビュー：${esc(mod.journalExample.event)}</h3>
        <table class="pres-table">
          <thead><tr><th style="width:65px;">借/貸</th><th>AFF 9セグメント組合せ</th><th>仕訳明細・適用ルール</th><th class="num">金額 (JPY)</th></tr></thead>
          <tbody>
            ${mod.journalExample.lines.map(l => `
              <tr>
                <td><strong style="color:${l.side === 'DR' ? '#1d4ed8' : '#b91c1c'};">${l.side}</strong></td>
                <td class="mono">${esc(l.aff)}</td>
                <td>${esc(l.desc)}</td>
                <td class="num"><strong>${esc(l.amt)}円</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    stage.querySelectorAll('[data-mod-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSubmoduleId = btn.getAttribute('data-mod-id');
        renderCh2Submodules(stage);
      });
    });
  }

  // === Slide 3-1: Standard vs FAH ===
  function renderCh3Compare(stage) {
    stage.innerHTML = `
      <div class="two-col" style="margin-bottom:14px;">
        <div class="panel">
          <h3>⚖️ 標準サブ元帳 (AP/AR/FA/LA) vs FAH (会計ハブ)</h3>
          <table class="pres-table">
            <thead><tr><th>設計比較項目</th><th>標準サブ元帳 (AP / AR / FA / LA)</th><th>FAH (Financial Accounting Hub)</th></tr></thead>
            <tbody>
              <tr><td><strong>業務データ格納表</strong></td><td>AP_INVOICES_ALL 等の標準業務テーブル</td><td class="mono">XLA_TRANSACTION_HEADERS_INT / LINES_INT → XLA_TRANSACTION_HEADERS / LINES</td></tr>
              <tr><td><strong>アプリケーション定義</strong></td><td>Oracle 事前組込 (200 / 222 / 140 / 10522)</td><td>ユーザー登録 (XLA_SUBLEDGERS: APPL_ID=20001 XX_FAH_CLOUD)</td></tr>
              <tr><td><strong>データ取込方法</strong></td><td>ERP画面入力・REST API・各モジュールFBDI</td><td>会計ハブ共通FBDI ZIP / ERP Integration Service (UCM連携)</td></tr>
              <tr><td><strong>金額計算・ルール自由度</strong></td><td>元モジュール計算額＋AMB上書補完</td><td><strong>算式 (LINE_NUMBER1 * LINE_NUMBER2) で金額自体をSLA生成可能</strong></td></tr>
              <tr><td><strong>I/F取込コントロール</strong></td><td>各モジュール固有ジョブ</td><td class="mono">XLA_TRANSACTION_INT_CONTROLS (COMBINED_IMPORT_AND_LOAD_FLAG='Y')</td></tr>
            </tbody>
          </table>
        </div>

        <div class="panel">
          <h3>🚀 FAH 日次外部データ連携パイプライン</h3>
          <div class="svg-box">
            <svg viewBox="0 0 600 280">
              <defs><marker id="f-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 9 5 L 0 9 z" fill="#ea580c"/></marker></defs>
              <rect x="18" y="24" width="160" height="62" rx="8" fill="#fff1f2" stroke="#be123c" stroke-width="2"/>
              <text x="98" y="48" text-anchor="middle" font-size="11.5" font-weight="800" fill="#881337">外部POS/SaaS課金</text>
              <text x="98" y="68" text-anchor="middle" font-size="10" fill="#475569">数量300 / 単価1000 / CSV</text>

              <path d="M 178 55 L 222 55" stroke="#ea580c" stroke-width="2.5" marker-end="url(#f-arr)"/>
              <rect x="224" y="20" width="176" height="70" rx="8" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
              <text x="312" y="42" text-anchor="middle" font-size="10.5" font-weight="800" fill="#713f12">XLA_TRANSACTION_*_INT</text>
              <text x="312" y="60" text-anchor="middle" font-size="9.5" fill="#475569">STATUS: NEW → PROCESSED</text>
              <text x="312" y="76" text-anchor="middle" font-size="9" fill="#92400e">INT_CONTROLS 結合取込</text>

              <path d="M 400 55 L 434 55" stroke="#ea580c" stroke-width="2.5" marker-end="url(#f-arr)"/>
              <rect x="436" y="20" width="150" height="70" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
              <text x="511" y="44" text-anchor="middle" font-size="10.5" font-weight="800" fill="#14532d">Base実体表 &amp; Event</text>
              <text x="511" y="62" text-anchor="middle" font-size="9.5" fill="#475569">HEADERS / LINES</text>
              <text x="511" y="78" text-anchor="middle" font-size="9.5" fill="#15803d">Event 500005 (U)</text>

              <path d="M 511 90 L 511 138" stroke="#ea580c" stroke-width="2.5" marker-end="url(#f-arr)"/>
              <rect x="18" y="140" width="568" height="58" rx="8" fill="#fae8ff" stroke="#7e22ce" stroke-width="2"/>
              <text x="302" y="164" text-anchor="middle" font-size="11.5" font-weight="800" fill="#581c87">Create Accounting (XX_FAH_CLOUD_JERS)</text>
              <text x="302" y="183" text-anchor="middle" font-size="9.2" fill="#475569">算式(300×1000=300,000円) · MapSet(SaaS_USAGE→4102) · SR_COUNTERPARTY &amp; SR_EXT_TRACE</text>

              <path d="M 302 198 L 302 222" stroke="#ea580c" stroke-width="2.5" marker-end="url(#f-arr)"/>
              <rect x="18" y="224" width="568" height="44" rx="8" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2"/>
              <text x="302" y="250" text-anchor="middle" font-size="9.8" font-weight="800" fill="#1e3a8a">XLA_AE_LINES (売掛金30万/クラウド収益30万) → XLA_AC_BALANCES → GL_BALANCES</text>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  // === Slide 3-2: Interactive FAH 12 Steps ===
  function renderCh3Steps12(stage) {
    const activeSt = D.FAH_SETUP_STEPS.find(s => s.no === selectedFahStepNo) || D.FAH_SETUP_STEPS[0];
    stage.innerHTML = `
      <div class="fah-steps-grid">
        ${D.FAH_SETUP_STEPS.map(s => `
          <button type="button" class="fah-step-tile${s.no === activeSt.no ? ' active' : ''}" data-fah-no="${s.no}">
            <span class="phase-tag">${esc(s.phase)}</span>
            <span class="step-lbl">${esc(s.title)}</span>
          </button>
        `).join('')}
      </div>

      <div class="two-col">
        <div class="panel">
          <h3>🔍 選択中のFAH手順詳細: ${esc(activeSt.title)}</h3>
          <p style="margin:6px 0;"><strong>UI操作画面:</strong> <code>${esc(activeSt.uiTask)}</code></p>
          <p style="margin:6px 0;"><strong>更新/登録OEDMFテーブル:</strong> <span class="mono" style="color:#1e40af;font-weight:700;">${esc(activeSt.tables.join(', '))}</span></p>
          <div style="background:#fff;border:1px solid #cbd5e1;border-left:4px solid #ea580c;border-radius:6px;padding:12px;font-size:13px;margin-top:8px;">
            ${esc(activeSt.detail)}
          </div>
        </div>

        <div class="panel">
          <h3>📋 FAH主要設定サンプル値（XX_FAH_CLOUD / APPL_ID=20001）</h3>
          <table class="pres-table">
            <thead><tr><th>項目</th><th>設定サンプル値</th><th>格納テーブル</th></tr></thead>
            <tbody>
              <tr><td>アプリ短縮名 / 仕訳ソース</td><td class="mono">XX_FAH_CLOUD / XX Cloud Billing Hub</td><td class="mono">XLA_SUBLEDGERS</td></tr>
              <tr><td>イベントタイプ</td><td class="mono">XX_CLOUD_REV_RECOG (ACC=Y)</td><td class="mono">XLA_EVENT_TYPES_B</td></tr>
              <tr><td>ユーザー定義算式</td><td class="mono">XX_FAH_LINE_AMT_FML (LINE_NUMBER1 * NUMBER2)</td><td class="mono">XLA_FORMULA_DETAILS</td></tr>
              <tr><td>マッピングセット</td><td class="mono">XX_FAH_SVC_ACCT_MAP (SaaS_USAGE → 4102)</td><td class="mono">XLA_MAPPING_SET_VALUES</td></tr>
              <tr><td>ADR＆適用条件</td><td class="mono">XX_FAH_REV_ACCT_ADR (LINE_CHAR2 IS NOT NULL)</td><td class="mono">XLA_CONDITIONS</td></tr>
              <tr><td>I/F結合コントロール</td><td class="mono">COMBINED_IMPORT_AND_LOAD_FLAG = Y</td><td class="mono">XLA_TRANSACTION_INT_CONTROLS</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    stage.querySelectorAll('[data-fah-no]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedFahStepNo = Number(btn.getAttribute('data-fah-no'));
        renderCh3Steps12(stage);
      });
    });
  }

  // === Slide 4-1: SR Architecture (Balancing Y vs N) ===
  function renderCh4Arch(stage) {
    const [balY, balN] = D.SR_ARCHITECTURE.definitions;
    stage.innerHTML = `
      <div class="two-col" style="margin-bottom:14px;">
        <div class="panel" style="border-top:4px solid #16a34a;">
          <h3>🟢 ${esc(balY.name)} (${esc(balY.code)})</h3>
          <p style="margin:4px 0;font-size:12px;"><strong>設定フラグ:</strong> <code>BALANCING_FLAG = "Y"</code> ｜ <code>YEAR_END_CARRY_FORWARD_CODE = "${esc(balY.carryForward)}"</code></p>
          <p style="margin:4px 0;font-size:12px;"><strong>物理フロー:</strong> <code>${esc(balY.tables)}</code></p>
          <table class="pres-table" style="margin-top:8px;">
            <thead><tr><th>スロット</th><th>詳細コード</th><th>表示項目</th><th>データ型</th></tr></thead>
            <tbody>
              ${balY.slots.map(s => `<tr><td class="mono"><strong>${s.slot}</strong></td><td class="mono">${s.code}</td><td><strong>${s.jp}</strong></td><td>${s.dtype}</td></tr>`).join('')}
            </tbody>
          </table>
          <p style="margin:8px 0 0;font-size:12px;background:#dcfce7;padding:8px;border-radius:6px;color:#14532d;"><strong>設計ポイント:</strong> ${esc(balY.point)}</p>
        </div>

        <div class="panel" style="border-top:4px solid #7e22ce;">
          <h3>🟣 ${esc(balN.name)} (${esc(balN.code)})</h3>
          <p style="margin:4px 0;font-size:12px;"><strong>設定フラグ:</strong> <code>BALANCING_FLAG = "N"</code> ｜ <code>YEAR_END_CARRY_FORWARD_CODE = "N"</code></p>
          <p style="margin:4px 0;font-size:12px;"><strong>物理フロー:</strong> <code>${esc(balN.tables)}</code></p>
          <table class="pres-table" style="margin-top:8px;">
            <thead><tr><th>スロット</th><th>詳細コード</th><th>表示項目</th><th>データ型</th></tr></thead>
            <tbody>
              ${balN.slots.map(s => `<tr><td class="mono"><strong>${s.slot}</strong></td><td class="mono">${s.code}</td><td><strong>${s.jp}</strong></td><td>${s.dtype}</td></tr>`).join('')}
            </tbody>
          </table>
          <p style="margin:8px 0 0;font-size:12px;background:#faf5ff;padding:8px;border-radius:6px;color:#581c87;"><strong>設計ポイント:</strong> ${esc(balN.point)}</p>
        </div>
      </div>

      <div class="panel">
        <h3>🗄️ OEDMF 26D サポート参照メタデータ構造: XLA_ANALYTICAL_HDRS_B → DTLS_B → SOURCES → LINE_DEFN_AC_ASSGNS</h3>
        <div class="svg-box">
          <svg viewBox="0 0 1160 115">
            <defs><marker id="s-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb"/></marker></defs>
            <rect x="15" y="18" width="210" height="78" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.8"/>
            <text x="120" y="42" text-anchor="middle" font-size="11.5" font-weight="800" fill="#1e3a8a">XLA_ANALYTICAL_HDRS_B</text>
            <text x="120" y="62" text-anchor="middle" font-size="10" fill="#334155">BALANCING_FLAG ('Y'/'N')</text>
            <text x="120" y="79" text-anchor="middle" font-size="10" fill="#334155">YEAR_END_CARRY_FORWARD</text>

            <path d="M 225 57 L 265 57" stroke="#2563eb" stroke-width="2" marker-end="url(#s-arr)"/>
            <rect x="267" y="18" width="220" height="78" rx="8" fill="#fefce8" stroke="#ca8a04" stroke-width="1.8"/>
            <text x="377" y="42" text-anchor="middle" font-size="11.5" font-weight="800" fill="#713f12">XLA_ANALYTICAL_DTLS_B</text>
            <text x="377" y="62" text-anchor="middle" font-size="10" fill="#334155">GROUPING_ORDER 1..5 (AC1..AC5)</text>
            <text x="377" y="79" text-anchor="middle" font-size="10" fill="#334155">DATA_TYPE_CODE (C/N/D)</text>

            <path d="M 487 57 L 527 57" stroke="#2563eb" stroke-width="2" marker-end="url(#s-arr)"/>
            <rect x="529" y="18" width="260" height="78" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="1.8"/>
            <text x="659" y="42" text-anchor="middle" font-size="11.5" font-weight="800" fill="#14532d">XLA_ANALYTICAL_SOURCES</text>
            <text x="659" y="62" text-anchor="middle" font-size="10" fill="#334155">5大サブ元帳のSOURCE_CODEを結合</text>
            <text x="659" y="79" text-anchor="middle" font-size="10" fill="#334155">AP/AR/FA/LA/FAH → 同一軸へ</text>

            <path d="M 789 57 L 829 57" stroke="#2563eb" stroke-width="2" marker-end="url(#s-arr)"/>
            <rect x="831" y="18" width="310" height="78" rx="8" fill="#fae8ff" stroke="#7e22ce" stroke-width="1.8"/>
            <text x="986" y="42" text-anchor="middle" font-size="11.5" font-weight="800" fill="#581c87">XLA_AE_LINE_ACS → XLA_AC_BALANCES</text>
            <text x="986" y="62" text-anchor="middle" font-size="10" fill="#334155">全SRを AE_LINE_ACS (20行) へ格納</text>
            <text x="986" y="79" text-anchor="middle" font-size="10" fill="#15803d">BAL=Y のみ XLA_AC_BALANCES へ残高集計</text>
          </svg>
        </div>
      </div>
    `;
  }

  // === Slide 4-2: Cross-Subledger Normalization & 4-Way Matrix ===
  function renderCh4SrVsDff(stage) {
    const balY = D.SR_ARCHITECTURE.definitions[0];
    stage.innerHTML = `
      <div class="panel" style="margin-bottom:14px;">
        <h3>🔀 残高有サポート参照 (SR_COUNTERPARTY) による5大サブ元帳横断ソース正規化</h3>
        <table class="pres-table">
          <thead><tr><th>サブ元帳</th><th>各業務モジュールの元ソース (XLA_ANALYTICAL_SOURCES.SOURCE_CODE)</th><th>正規化先統一スロット</th><th>本サンプル取引での格納値</th></tr></thead>
          <tbody>
            ${balY.crossSubledgerMap.map(m => `
              <tr class="${m.ex.includes('グローバル') ? 'row-hl' : ''}">
                <td><strong>${esc(m.sub)}</strong></td>
                <td class="mono">${esc(m.source)}</td>
                <td class="mono">SR_COUNTERPARTY.AC1 (相手先)</td>
                <td><strong>${esc(m.ex)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h3>⚖️ 徹底比較マトリクス：残高有SR vs 残高無SR vs DFF vs AFFセグメント</h3>
        <table class="pres-table">
          <thead>
            <tr>
              <th style="width:18%;">比較観点</th>
              <th style="width:22%;background:#14532d;">残高有 SR (BAL=Y)</th>
              <th style="width:20%;background:#581c87;">残高無 SR (BAL=N)</th>
              <th style="width:20%;background:#475569;">DFF (ATTRIBUTE*)</th>
              <th style="width:20%;background:#1e3a8a;">AFF 9セグメント</th>
            </tr>
          </thead>
          <tbody>
            ${D.SR_ARCHITECTURE.comparisonMatrix.map(r => `
              <tr>
                <td><strong>${esc(r.item)}</strong></td>
                <td>${esc(r.srBalY)}</td>
                <td>${esc(r.srBalN)}</td>
                <td>${esc(r.dff)}</td>
                <td>${esc(r.aff)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // === Slide 5-1: Balancing SR SLA Balance Management Flow (6 Phases) ===
  function renderCh5BalanceFlow(stage) {
    const ph = D.SR_BALANCE_PHASES[srBalPhaseIdx] || D.SR_BALANCE_PHASES[0];
    const hl = new Set(ph.flowHighlight);

    // 取引先別累積計算
    const byAc1 = {};
    ph.acBalancesRows.forEach(r => {
      const endDr = r.begDr + r.perDr - r.perCr;
      byAc1[r.ac1] = (byAc1[r.ac1] || 0) + endDr;
    });
    const globalEnd = byAc1['株式会社グローバル商事'] || 0;
    const dainiEnd = byAc1['第二商事株式会社'] || 0;
    const acTotalEnd = globalEnd + dainiEnd;

    stage.innerHTML = `
      <div class="anim-toolbar">
        <div class="anim-pills" id="srbal-pills"></div>
        <button id="btn-srbal-play" class="anim-play-btn">${srBalTimer ? '⏸️ 停止' : '▶️ 自動再生'}</button>
      </div>

      <div class="svg-box" style="margin-bottom:12px;">
        <svg id="srbal-svg" viewBox="0 0 1180 185" preserveAspectRatio="xMidYMid meet"></svg>
      </div>

      <div class="panel" style="margin-bottom:12px;border-left:5px solid #2563eb;">
        <h3 style="margin-bottom:4px;">${esc(ph.title)} <span class="mono" style="font-size:11px;color:#64748b;">[${esc(ph.period)} / ${esc(ph.aeEvent)}]</span></h3>
        <p style="margin:0;font-size:12.5px;color:#334155;">${esc(ph.explanation)}</p>
      </div>

      <div class="two-col">
        <div class="panel">
          <h3>📊 XLA_AC_BALANCES (SR_COUNTERPARTY / CCID=1001 売掛金) リアルタイム残高表</h3>
          <table class="pres-table">
            <thead>
              <tr><th>サブ元帳</th><th>相手先 (AC1)</th><th>期間</th><th class="num">期首DR</th><th class="num">期中DR</th><th class="num">期中CR</th><th class="num">純残高</th></tr>
            </thead>
            <tbody>
              ${ph.acBalancesRows.map(r => {
                const net = r.begDr + r.perDr - r.perCr;
                return `
                  <tr class="${r.updated ? 'row-hl' : ''}">
                    <td class="mono">${esc(r.appl)}</td>
                    <td><strong>${esc(r.ac1)}</strong></td>
                    <td class="mono">${esc(r.period)}</td>
                    <td class="num">${fmtYen(r.begDr)}</td>
                    <td class="num">${fmtYen(r.perDr)}</td>
                    <td class="num">${fmtYen(r.perCr)}</td>
                    <td class="num"><strong>${fmtYen(net)}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="panel">
          <h3>⚖️ GL_BALANCES との期末残高照合 (相手先別合計 ＝ GL勘定残高)</h3>
          <div class="reconcile-banner" style="margin-top:4px;">
            <div class="rec-box">
              <h4>(株)グローバル商事 (AR+FAH統合)</h4>
              <div class="rec-val">${fmtYen(globalEnd)}</div>
            </div>
            <div class="rec-box">
              <h4>第二商事(株) + SR合計</h4>
              <div class="rec-val">${fmtYen(dainiEnd)} / ${fmtYen(acTotalEnd)}</div>
            </div>
            <div class="rec-box match">
              <h4>GL_BALANCES (1001) 一致OK</h4>
              <div class="rec-val">${fmtYen(ph.glBalance.endDr)}</div>
            </div>
          </div>
          <p style="margin:10px 0 0;font-size:11.5px;color:#475569;">
            <strong>照合式:</strong> GL期首(${fmtYen(ph.glBalance.begDr)}) + GL期中DR(${fmtYen(ph.glBalance.netDr)}) − GL期中CR(${fmtYen(ph.glBalance.netCr)}) = <strong>${fmtYen(ph.glBalance.endDr)}</strong>
            ≡ XLA_AC_BALANCES合算 (<strong>${fmtYen(acTotalEnd)}</strong>)
          </p>
        </div>
      </div>
    `;

    // Wire Pills
    const pillsEl = document.getElementById('srbal-pills');
    D.SR_BALANCE_PHASES.forEach((p, idx) => {
      const b = document.createElement('button');
      b.className = `anim-pill${idx === srBalPhaseIdx ? ' active' : ''}`;
      b.textContent = `${p.code}: ${p.shortLabel}`;
      b.addEventListener('click', () => {
        if (srBalTimer) { clearInterval(srBalTimer); srBalTimer = null; }
        srBalPhaseIdx = idx;
        renderCh5BalanceFlow(stage);
      });
      pillsEl.appendChild(b);
    });

    document.getElementById('btn-srbal-play').addEventListener('click', () => {
      if (srBalTimer) {
        clearInterval(srBalTimer);
        srBalTimer = null;
        renderCh5BalanceFlow(stage);
      } else {
        srBalTimer = setInterval(() => {
          srBalPhaseIdx = (srBalPhaseIdx + 1) % D.SR_BALANCE_PHASES.length;
          renderCh5BalanceFlow(stage);
        }, 3000);
        renderCh5BalanceFlow(stage);
      }
    });

    // Draw Phase Flow SVG
    const svg = document.getElementById('srbal-svg');
    const nodes = [
      { id: 'CARRY_FWD', x: 18, y: 18, w: 175, h: 52, title: '期首/翌期繰越バッチ', sub: 'YEAR_END_CARRY_FWD=A' },
      { id: 'TXN_AR', x: 18, y: 78, w: 175, h: 44, title: 'AR請求 / REC消込', sub: 'AR-2026-001 / REC-001' },
      { id: 'TXN_FAH', x: 18, y: 130, w: 175, h: 44, title: 'FAH外部請求', sub: 'FAH-2026-001 (+30万)' },
      { id: 'TXN_REC', x: 225, y: 130, w: 175, h: 44, title: 'AR一部入金消込', sub: 'REC-2026-001 (-60万)' },
      { id: 'XLA_AE_LINE', x: 225, y: 34, w: 195, h: 72, title: 'XLA_AE_LINES', sub: 'CCID=1001 借方/貸方生成' },
      { id: 'XLA_LINE_ACS', x: 465, y: 34, w: 205, h: 72, title: 'XLA_AE_LINE_ACS', sub: 'AC1=(株)グローバル商事抽出' },
      { id: 'XLA_AC_BAL', x: 715, y: 34, w: 220, h: 120, title: 'XLA_AC_BALANCES', sub: 'CCID×AC1×期間 残高更新' },
      { id: 'GL_BAL', x: 975, y: 34, w: 190, h: 120, title: 'GL_BALANCES照合', sub: `合計 ${fmtYen(ph.glBalance.endDr)}` }
    ];
    nodes.forEach(n => {
      const on = hl.has(n.id);
      svg.appendChild(svgEl('rect', {
        x: n.x, y: n.y, width: n.w, height: n.h, rx: 8,
        fill: on ? '#fef9c3' : '#f8fafc',
        stroke: on ? '#ca8a04' : '#cbd5e1',
        'stroke-width': on ? '2.5' : '1.4'
      }));
      svg.appendChild(svgEl('text', { x: n.x + n.w / 2, y: n.y + (n.h > 60 ? 30 : 20), 'text-anchor': 'middle', 'font-size': '11', 'font-weight': '800', fill: on ? '#713f12' : '#475569' }, n.title));
      svg.appendChild(svgEl('text', { x: n.x + n.w / 2, y: n.y + (n.h > 60 ? 52 : 36), 'text-anchor': 'middle', 'font-size': '9.5', 'font-weight': '600', fill: '#334155' }, n.sub));
    });
    const edges = [
      [193, 44, 715, 64], [193, 98, 225, 70], [193, 150, 225, 92], [420, 70, 465, 70], [670, 70, 715, 70], [935, 94, 975, 94]
    ];
    edges.forEach(([x1, y1, x2, y2]) => {
      svg.appendChild(svgEl('line', { x1, y1, x2, y2, stroke: '#94a3b8', 'stroke-width': '1.8', 'stroke-dasharray': '4 3' }));
    });
  }

  // === Slide 6-1: Data Inspector ===
  function renderCh6Inspector(stage) {
    const q = inspectorSearch.trim().toLowerCase();
    const filtered = D.OEDMF_TABLES.filter(t => {
      if (inspectorModuleFilter !== 'ALL' && t.module !== inspectorModuleFilter && t.category !== inspectorModuleFilter) return false;
      if (q) {
        const hitMeta = t.id.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
        const hitRows = t.rows.some(r => JSON.stringify(r.data).toLowerCase().includes(q));
        if (!hitMeta && !hitRows) return false;
      }
      return true;
    });

    stage.innerHTML = `
      <div class="anim-toolbar">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <label style="font-size:12px;font-weight:700;">分類絞り込み:</label>
          <select id="insp-filter" class="anim-pill" style="padding:6px 10px;">
            <option value="ALL">全OEDMFテーブル (${D.OEDMF_TABLES.length}表)</option>
            <option value="COA_LEDGER">A. 組織・AFF9軸・元帳・会計方式</option>
            <option value="SUBLEDGER_META">B. イベントモデル・ソース・FAH I/F制御</option>
            <option value="AMB_SETUP">C. AMBルール (算式/MapSet/ADR/条件/JLT/JERS)</option>
            <option value="SUPPORTING_REF">D. サポート参照定義 &amp; 5サブ元帳ソース正規化</option>
            <option value="TXN_DATA">E. 5大サブ元帳取引サンプル</option>
            <option value="SLA_GL">F. SLA仕訳・SR残高・GL残高</option>
          </select>
          <input id="insp-search" type="text" placeholder="テーブル名・設定コード・金額で検索..." value="${esc(inspectorSearch)}" style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;min-width:240px;font-size:12px;">
        </div>
        <span style="font-size:12px;font-weight:700;color:#475569;">表示中: ${filtered.length} テーブル（黄色セル＝変更箇所・緑＝新規登録）</span>
      </div>
      <div id="insp-tables-wrap" style="display:flex;flex-direction:column;gap:14px;max-height:540px;overflow-y:auto;"></div>
    `;

    const sel = document.getElementById('insp-filter');
    sel.value = inspectorModuleFilter;
    sel.addEventListener('change', () => {
      inspectorModuleFilter = sel.value;
      renderCh6Inspector(stage);
    });
    const inp = document.getElementById('insp-search');
    inp.addEventListener('input', () => {
      inspectorSearch = inp.value;
      renderCh6Inspector(stage);
      const restored = document.getElementById('insp-search');
      if (restored) { restored.focus(); restored.setSelectionRange(restored.value.length, restored.value.length); }
    });

    const wrap = document.getElementById('insp-tables-wrap');
    filtered.forEach(tbl => {
      const box = document.createElement('div');
      box.className = 'panel';
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">
          <div><strong class="mono" style="font-size:13px;color:#1e3a8a;">${esc(tbl.id)}</strong> — <span style="font-size:12px;font-weight:700;">${esc(tbl.desc)}</span></div>
          <span class="mono" style="font-size:11px;background:#e2e8f0;padding:2px 8px;border-radius:4px;">${tbl.rows.length}行</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="pres-table">
            <thead><tr><th>工程</th>${tbl.cols.map(c => `<th class="mono">${esc(c)}</th>`).join('')}</tr></thead>
            <tbody>
              ${tbl.rows.map(r => `
                <tr>
                  <td style="background:${r.updatedCols ? '#fef08a' : (r.isNew ? '#dcfce7' : '#f8fafc')};font-weight:700;font-size:11px;">${esc(r.step || '')}</td>
                  ${tbl.cols.map(c => {
                    const v = r.data[c];
                    const isUpd = r.updatedCols && r.updatedCols.includes(c);
                    const oldStr = (isUpd && r.oldValues && c in r.oldValues) ? `<span style="display:block;font-size:10px;color:#991b1b;text-decoration:line-through;">旧: ${esc(r.oldValues[c])}</span>` : '';
                    let disp = v === null || v === undefined ? '<span style="color:#94a3b8;">NULL</span>' : esc(v);
                    if (typeof v === 'number' && (c.includes('AMOUNT') || c.endsWith('_DR') || c.endsWith('_CR') || c.includes('BALANCE') || c === 'NUMBER3' || c === 'DEPRN_RESERVE')) {
                      disp = Number(v).toLocaleString('ja-JP');
                    }
                    let affHint = '';
                    if (c === 'CODE_COMBINATION_ID' || c.endsWith('_CCID') || c.endsWith('_COMBINATION_ID')) {
                      const cc = ccidMap.get(Number(v));
                      if (cc) affHint = `<span style="display:block;font-size:9.5px;color:#0369a1;">${esc(cc.aff)} (${esc(cc.name)})</span>`;
                    }
                    return `<td class="mono" style="${isUpd ? 'background:#fef08a;font-weight:800;' : ''}">${oldStr}${disp}${affHint}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      wrap.appendChild(box);
    });
  }

  function renderDeck() {
    renderChrome();
    const cur = flatSlides[currentGlobalIdx];
    const stage = document.getElementById('slide-stage');
    const handlers = {
      ch1_summary: renderCh1Summary,
      ch1_mechanism: renderCh1Mechanism,
      ch1_hierarchy: renderCh1Hierarchy,
      ch2_overview: renderCh2Overview,
      ch2_submodules: renderCh2Submodules,
      ch3_compare: renderCh3Compare,
      ch3_steps12: renderCh3Steps12,
      ch4_sr_arch: renderCh4Arch,
      ch4_sr_vs_dff: renderCh4SrVsDff,
      ch5_balance_flow: renderCh5BalanceFlow,
      ch6_inspector: renderCh6Inspector
    };
    const fn = handlers[cur.sl.type];
    if (fn) fn(stage);
  }

  function populateModals() {
    const tocBody = document.getElementById('toc-modal-body');
    let g = 0;
    tocBody.innerHTML = D.CHAPTERS.map(ch => `
      <div style="margin-bottom:14px;">
        <h4 style="margin:0 0 6px;color:#1e3a8a;">${esc(ch.title)}</h4>
        <div style="display:flex;flex-direction:column;gap:5px;">
          ${ch.slides.map(sl => {
            const targetIdx = g++;
            return `<button type="button" class="anim-pill" style="text-align:left;" data-goto-slide="${targetIdx}">Slide ${targetIdx + 1}: ${esc(sl.title)}</button>`;
          }).join('')}
        </div>
      </div>
    `).join('');
    tocBody.querySelectorAll('[data-goto-slide]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('toc-modal').classList.add('hidden');
        goToSlide(Number(btn.getAttribute('data-goto-slide')));
      });
    });

    const affBody = document.getElementById('aff-modal-body');
    affBody.innerHTML = `
      <p><strong>体系 (${D.META.coaName}):</strong> <code>会社(1)-部門(2)-勘定科目(3)-補助科目(4)-税コード(5)-管理コード(6)-備考1(7)-備考2(8)-備考3(9)</code></p>
      <table class="pres-table" style="margin-bottom:14px;">
        <thead><tr><th>No</th><th>カラム</th><th>セグメント名</th><th>桁数</th><th>例</th><th>説明</th></tr></thead>
        <tbody>
          ${D.AFF_SEGMENTS.map(s => `<tr><td>${s.num}</td><td class="mono">${s.col}</td><td><strong>${esc(s.name)}</strong></td><td>${s.len}</td><td class="mono">${s.example}</td><td>${esc(s.desc)}</td></tr>`).join('')}
        </tbody>
      </table>
      <h4>使用CCID一覧 (${D.CCID_LIST.length}件)</h4>
      <table class="pres-table">
        <thead><tr><th>CCID</th><th>区分</th><th>勘定科目名</th><th>AFF 9セグメント</th><th>用途</th></tr></thead>
        <tbody>
          ${D.CCID_LIST.map(c => `<tr><td class="mono">${c.id}</td><td>${c.type}</td><td><strong>${esc(c.name)}</strong></td><td class="mono">${esc(c.aff)}</td><td>${esc(c.desc)}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  // イベント登録
  document.getElementById('btn-slide-prev').addEventListener('click', () => goToSlide(currentGlobalIdx - 1));
  document.getElementById('btn-slide-next').addEventListener('click', () => goToSlide(currentGlobalIdx + 1));
  document.getElementById('btn-toc-modal').addEventListener('click', () => document.getElementById('toc-modal').classList.remove('hidden'));
  document.getElementById('btn-aff-modal').addEventListener('click', () => document.getElementById('aff-modal').classList.remove('hidden'));
  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  });
  document.querySelectorAll('.modal-close').forEach(b => {
    b.addEventListener('click', () => document.getElementById(b.getAttribute('data-close')).classList.add('hidden'));
  });
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
  });
  if (typeof document.addEventListener === 'function') {
    document.addEventListener('keydown', e => {
      if (e.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') goToSlide(currentGlobalIdx + 1);
      if (e.key === 'ArrowLeft') goToSlide(currentGlobalIdx - 1);
    });
  }

  populateModals();
  renderDeck();
})();
