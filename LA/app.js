/**
 * Oracle Fusion ERP Financials 26D (OEDMF)
 * リース会計（LA）登録・修正・中途解約・収益(AR)＆AP連携 UIコントローラ
 */
(function (global) {
  'use strict';

  const DATA = global.FusionLA;
  if (!DATA) return;

  const { AFF_SEGMENTS, CCID_LIST, LA_PROCESS_GUIDE, DOMAINS, TABLES, RELATIONS, CASES, computeStateAtStep } = DATA;

  const appState = {
    caseId: 'LA_BOOK_AP_ACCRUAL',
    stepIndex: 0,
    isPlaying: false,
    timerId: null,
    speedMs: 2800,
    viewMode: 'changed',
    domainFilter: 'ALL',
    searchQuery: '',
    showAff: true,
    guideExpanded: true,
    selectedTableId: null
  };

  const $ = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  const esc = (s) => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  const fmtVal = (v) => {
    if (v === null || v === undefined || v === '') return '<span class="null-val">NULL</span>';
    if (typeof v === 'number') return esc(v.toLocaleString('ja-JP'));
    return esc(v);
  };

  const CCID_COLS = new Set([
    'CODE_COMBINATION_ID', 'ACCOUNT_CCID', 'DR_CODE_COMBINATION_ID', 'CR_CODE_COMBINATION_ID',
    'DEFAULT_DIST_CCID', 'DIST_CODE_COMBINATION_ID', 'ASSET_CODE_COMBINATION_ID'
  ]);
  const FLAG_LIKE = new Set([
    'LEASE_STATUS_CODE', 'VERSION_NUM', 'CHANGE_TYPE_CODE', 'ACTIVE_FLAG', 'REVERSAL_FLAG',
    'ACCRUED_FLAG', 'APPROVAL_STATUS_CODE', 'INTERFACE_STATUS_CODE', 'ACCOUNTED_IN_GL_FLAG',
    'VALIDATION_STATUS', 'PAYMENT_STATUS_FLAG', 'STATUS_LOOKUP_CODE', 'POSTED_FLAG',
    'INTERFACE_STATUS', 'COMPLETE_FLAG', 'STATUS', 'CURRENT_RECORD_FLAG',
    'EVENT_STATUS_CODE', 'PROCESS_STATUS_CODE', 'GL_TRANSFER_STATUS_CODE', 'EVENT_TYPE_CODE'
  ]);
  const AMT_LIKE = new Set([
    'RATE_VALUE', 'ACTUAL_AMOUNT', 'INTEREST_RATE', 'PAYMENT_ITEM_AMOUNT', 'PRESENT_VALUE_AMOUNT',
    'OPENING_LIABILITY_AMOUNT', 'INTEREST_AMOUNT', 'CLOSING_LIABILITY_AMOUNT', 'SCHEDULE1_AMOUNT',
    'OPENING_FIN_ROU_AMOUNT', 'CLOSING_FIN_ROU_AMOUNT', 'CLOSING_BALANCE',
    'ENTERED_AMOUNT', 'ACCOUNTED_AMOUNT', 'INVOICE_AMOUNT', 'AMOUNT_PAID', 'AMOUNT',
    'TAXABLE_AMT', 'TAX_AMT', 'GROSS_AMOUNT', 'AMOUNT_REMAINING', 'TRANSACTION_AMOUNT',
    'EXTENDED_AMOUNT', 'AMOUNT_DUE_ORIGINAL', 'AMOUNT_DUE_REMAINING', 'AMOUNT_APPLIED',
    'AMOUNT_DR', 'AMOUNT_CR', 'ACCOUNTED_DR', 'ACCOUNTED_CR', 'ENTERED_DR', 'ENTERED_CR',
    'RUNNING_TOTAL_ACCOUNTED_DR', 'RUNNING_TOTAL_ACCOUNTED_CR', 'RUNNING_TOTAL_DR', 'RUNNING_TOTAL_CR',
    'BEGIN_BALANCE_DR', 'BEGIN_BALANCE_CR', 'PERIOD_NET_DR', 'PERIOD_NET_CR', 'END_BALANCE'
  ]);

  function rowIdentityKey(tableId, row, idx) {
    const tbl = TABLES[tableId];
    if (!tbl || !row) return String(idx);
    const pks = tbl.pk.split(',').map(s => s.trim());
    const parts = pks.map(k => (row[k] !== undefined && row[k] !== null ? String(row[k]) : ''));
    if (parts.some(p => p !== '')) return parts.join('|');
    return String(idx);
  }

  function analyzeStepDiff(caseId, stepIndex) {
    const curr = computeStateAtStep(caseId, stepIndex);
    const prev = stepIndex > 0 ? computeStateAtStep(caseId, stepIndex - 1) : { state: {} };
    const tableStatuses = {};
    const tableDiffs = {};
    const flagChangeSummaries = [];

    const caseDef = CASES[caseId];
    const stepDef = caseDef.steps[stepIndex];
    const focusSet = new Set(stepDef.focusTables || []);

    Object.keys(TABLES).forEach(tblId => {
      const currRows = curr.state[tblId] || [];
      const prevRows = prev.state[tblId] || [];
      const insSet = new Set();
      const updCells = {};

      if (stepIndex === 0) {
        tableStatuses[tblId] = focusSet.has(tblId)
          ? (currRows.length > 0 ? 'referenced' : 'not_created')
          : (currRows.length > 0 ? 'existing' : 'not_created');
      } else {
        const prevMap = new Map();
        prevRows.forEach((r, idx) => prevMap.set(rowIdentityKey(tblId, r, idx), r));
        let hasInsert = false;
        let hasUpdate = false;

        currRows.forEach((r, idx) => {
          const rk = rowIdentityKey(tblId, r, idx);
          const oldRow = prevMap.get(rk);
          if (!oldRow) {
            insSet.add(rk);
            hasInsert = true;
          } else {
            const cols = new Set([...Object.keys(oldRow), ...Object.keys(r)]);
            const colChanges = {};
            cols.forEach(c => {
              const ov = oldRow[c];
              const nv = r[c];
              if (JSON.stringify(ov) !== JSON.stringify(nv)) {
                colChanges[c] = { old: ov, new: nv };
                hasUpdate = true;
                if (FLAG_LIKE.has(c) || AMT_LIKE.has(c)) {
                  flagChangeSummaries.push({ tableId: tblId, col: c, oldVal: ov, newVal: nv, note: TABLES[tblId].jpName });
                }
              }
            });
            if (Object.keys(colChanges).length > 0) updCells[rk] = colChanges;
          }
        });

        if (hasInsert && focusSet.has(tblId)) {
          currRows.forEach((r, idx) => {
            const rk = rowIdentityKey(tblId, r, idx);
            if (!insSet.has(rk)) return;
            const statusCol = ['LEASE_STATUS_CODE', 'EVENT_TYPE_CODE', 'INTERFACE_STATUS_CODE', 'STATUS_LOOKUP_CODE', 'STATUS', 'CHANGE_TYPE_CODE'].find(c => r[c]);
            if (statusCol) {
              flagChangeSummaries.push({ tableId: tblId, col: statusCol, oldVal: '(新規作成)', newVal: r[statusCol], note: TABLES[tblId].jpName + ' 行追加' });
            }
          });
        }

        if (hasUpdate) tableStatuses[tblId] = 'updated';
        else if (hasInsert) tableStatuses[tblId] = 'inserted';
        else if (currRows.length === 0) tableStatuses[tblId] = 'not_created';
        else if (focusSet.has(tblId)) tableStatuses[tblId] = 'referenced';
        else tableStatuses[tblId] = 'existing';
      }

      tableDiffs[tblId] = { insertedKeys: insSet, updatedCells: updCells };
    });

    return { currState: curr.state, tableStatuses, tableDiffs, flagChangeSummaries };
  }

  function renderGuideStrip() {
    const grid = $('la-guide-grid');
    if (!grid) return;
    grid.innerHTML = LA_PROCESS_GUIDE.map(g => `
      <div class="la-guide-card">
        <span class="lg-badge">${esc(g.badge)}</span>
        <div class="lg-title">${esc(g.title)}</div>
        <div class="lg-desc">${esc(g.meaning)}</div>
        <div class="lg-ex">例: ${esc(g.example)}</div>
      </div>
    `).join('');
  }

  function estSvgTextWidth(str, fontSize, isMono) {
    let w = 0;
    for (const ch of String(str || '')) {
      w += ch.charCodeAt(0) <= 0x7f ? fontSize * (isMono ? 0.65 : 0.62) : fontSize * 1.06;
    }
    return w;
  }

  function fitSvgText(str, maxPx, fontSize, isMono) {
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

  function renderSVG(analysis) {
    const svg = $('flow-svg');
    if (!svg) return;
    const caseDef = CASES[appState.caseId];
    const stepDef = caseDef.steps[appState.stepIndex];
    const activeRelSet = new Set(stepDef.activeRelIds || []);
    const allTables = Object.values(TABLES);

    const parts = [];
    parts.push(`<defs>
      <marker id="arrow-base" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8"/>
      </marker>
      <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c"/>
      </marker>
      ${allTables.map(t => `<clipPath id="clip-la-${t.id}"><rect x="${t.x + 1}" y="${t.y + 1}" width="${Math.max(10, t.w - 2)}" height="${Math.max(10, t.h - 2)}" rx="6"/></clipPath>`).join('')}
    </defs>`);

    Object.values(DOMAINS).forEach(dom => {
      const unitDomW = estSvgTextWidth(dom.label, 1, false) || 1;
      const domFs = estSvgTextWidth(dom.label, 11.2, false) > dom.w - 22
        ? Math.max(9.2, (dom.w - 22) / unitDomW)
        : 11.2;
      const domTxt = fitSvgText(dom.label, dom.w - 22, domFs, false);
      parts.push(`<g class="svg-domain">
        <rect x="${dom.x}" y="${dom.y}" width="${dom.w}" height="${dom.h}" rx="10" fill="${dom.bg}" stroke="${dom.border}" stroke-width="1.6"/>
        <rect x="${dom.x}" y="${dom.y}" width="${dom.w}" height="28" rx="10" fill="${dom.color}"/>
        <rect x="${dom.x}" y="${dom.y + 18}" width="${dom.w}" height="10" fill="${dom.color}"/>
        <text x="${dom.x + 12}" y="${dom.y + 19}" fill="#ffffff" font-size="${domFs.toFixed(1)}" font-weight="800">${esc(domTxt)}</text>
      </g>`);
    });

    RELATIONS.forEach(rel => {
      const relevant = rel.cases.includes('ALL') || rel.cases.includes(appState.caseId);
      const isActive = activeRelSet.has(rel.id);
      if (!relevant && !isActive) return;

      const fromT = TABLES[rel.from];
      const toT = TABLES[rel.to];
      if (!fromT || !toT) return;

      const x1 = fromT.x + (toT.x > fromT.x + 40 ? fromT.w : (toT.x < fromT.x - 40 ? 0 : fromT.w / 2));
      const y1 = fromT.y + fromT.h / 2;
      const x2 = toT.x + (toT.x > fromT.x + 40 ? 0 : (toT.x < fromT.x - 40 ? toT.w : toT.w / 2));
      const y2 = toT.y + toT.h / 2;
      const cx = (x1 + x2) / 2;
      const dPath = Math.abs(x1 - x2) < 20
        ? `M ${x1} ${y1} Q ${x1 + 26} ${(y1 + y2) / 2} ${x2} ${y2}`
        : `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;

      if (isActive) {
        parts.push(`<path id="path-${rel.id}" d="${dPath}" class="flow-edge-active flow-edge-update" marker-end="url(#arrow-active)"/>`);
        parts.push(`<circle r="4.2" fill="#ea580c" stroke="#fff" stroke-width="1.2">
          <animateMotion dur="1.7s" repeatCount="indefinite" path="${dPath}"/>
        </circle>`);
      } else {
        parts.push(`<path d="${dPath}" fill="none" stroke="#cbd5e1" stroke-width="1.15" marker-end="url(#arrow-base)" opacity="0.7"/>`);
      }
    });

    const svgWidth = 1820;
    (stepDef.flows || []).forEach((fl, idx) => {
      const fromT = TABLES[fl.from];
      const toT = TABLES[fl.to];
      if (!fromT || !toT) return;
      const mxRaw = (fromT.x + fromT.w / 2 + toT.x + toT.w / 2) / 2;
      const my = (fromT.y + fromT.h / 2 + toT.y + toT.h / 2) / 2 - (idx % 2 === 0 ? 12 : -14);
      const pillFs = fl.label.length > 22 ? 8.8 : 9.3;
      const pillW = Math.max(80, Math.ceil(estSvgTextWidth(fl.label, pillFs, false) + 20));
      const mx = Math.max(pillW / 2 + 8, Math.min(svgWidth - pillW / 2 - 8, mxRaw));
      parts.push(`<g class="svg-flow-pill">
        <rect x="${mx - pillW / 2}" y="${my - 10}" width="${pillW}" height="19" rx="9" fill="#0f172a" stroke="#f59e0b" stroke-width="1.2" opacity="0.94"/>
        <text x="${mx}" y="${my + 3.2}" text-anchor="middle" fill="#fde68a" font-size="${pillFs}" font-weight="800">${esc(fl.label)}</text>
      </g>`);
    });

    allTables.forEach(tbl => {
      const st = analysis.tableStatuses[tbl.id] || 'not_created';
      const count = (analysis.currState[tbl.id] || []).length;
      const isSelected = appState.selectedTableId === tbl.id;
      const classes = ['svg-node', `state-${st}`, isSelected ? 'selected' : ''].filter(Boolean).join(' ');
      const badgeColor = st === 'inserted' ? '#16a34a' : (st === 'updated' ? '#ea580c' : (st === 'referenced' ? '#0284c7' : '#64748b'));

      const avail1 = tbl.w - 16;
      let fsName = 9.8;
      if (estSvgTextWidth(tbl.name, fsName, true) > avail1) {
        const unitN = estSvgTextWidth(tbl.name, 1, true) || 1;
        fsName = Math.max(8.5, avail1 / unitN);
      }
      const shownName = fitSvgText(tbl.name, avail1, fsName, true);
      const avail2 = Math.max(30, tbl.w - 8 - 46);
      const shownJp = fitSvgText(tbl.jpName, avail2, 9.0, false);

      parts.push(`<g class="${classes}" data-table-id="${tbl.id}">
        <rect class="node-box" x="${tbl.x}" y="${tbl.y}" width="${tbl.w}" height="${tbl.h}" rx="7"/>
        <g clip-path="url(#clip-la-${tbl.id})">
          <text x="${tbl.x + 8}" y="${tbl.y + 16}" fill="#0f172a" font-size="${fsName.toFixed(1)}" font-weight="800" font-family="ui-monospace, monospace">${esc(shownName)}</text>
          <text x="${tbl.x + 8}" y="${tbl.y + 30}" fill="#334155" font-size="9" font-weight="600">${esc(shownJp)}</text>
        </g>
        <rect x="${tbl.x + tbl.w - 40}" y="${tbl.y + tbl.h - 18}" width="34" height="14" rx="4" fill="${badgeColor}"/>
        <text x="${tbl.x + tbl.w - 23}" y="${tbl.y + tbl.h - 7.5}" text-anchor="middle" fill="#ffffff" font-size="8.6" font-weight="800">${count}行</text>
        <title>${esc(tbl.name)} (${esc(tbl.jpName)}) — ${count}行</title>
      </g>`);
    });

    svg.innerHTML = parts.join('\n');

    if (typeof svg.querySelectorAll === 'function') {
      svg.querySelectorAll('.svg-node').forEach(node => {
        node.addEventListener('click', () => {
          const tid = node.getAttribute('data-table-id');
          appState.selectedTableId = (appState.selectedTableId === tid) ? null : tid;
          renderAll();
          if (appState.selectedTableId) {
            const banner = $('selected-banner');
            if (banner && typeof banner.scrollIntoView === 'function') banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });
    }
  }

  function renderMiniJournal(title, rows) {
    const body = rows.map(([side, acct, dr, cr]) => `
      <tr>
        <td class="${side === '借' ? 'side-dr' : 'side-cr'}">${side}</td>
        <td>${esc(acct)}</td>
        <td class="num">${dr ? dr.toLocaleString('ja-JP') : ''}</td>
        <td class="num">${cr ? cr.toLocaleString('ja-JP') : ''}</td>
      </tr>
    `).join('');
    return `<div class="journal-group"><div class="journal-group-note">${esc(title)}</div>
      <table class="journal-table"><thead><tr><th>側</th><th>勘定科目</th><th class="num">借方</th><th class="num">貸方</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function renderJournalPreview(currState, caseId, stepIndex) {
    const container = $('info-journal-preview');
    if (!container) return;
    const blocks = [];
    const lastStep = CASES[caseId].steps.length - 1;

    if (stepIndex === lastStep) {
      const bals = currState.GL_BALANCES || [];
      const drTot = (currState.GL_JE_LINES || []).reduce((a, r) => a + r.ACCOUNTED_DR, 0);
      blocks.push(`<div class="journal-group">
        <div class="journal-group-note">✅ GL転記完了（Status=P）｜ 当期仕訳 Dr=Cr: ¥${drTot.toLocaleString('ja-JP')}</div>
        <table class="journal-table"><thead><tr><th>勘定科目 (GL_BALANCES)</th><th class="num">期首残高</th><th class="num">当期純増減</th><th class="num">期末残高</th></tr></thead><tbody>
          ${bals.map(b => {
            const beg = b.BEGIN_BALANCE_DR - b.BEGIN_BALANCE_CR;
            const net = b.PERIOD_NET_DR - b.PERIOD_NET_CR;
            const cls = b.END_BALANCE === 0 ? 'side-net0' : (b.END_BALANCE > 0 ? 'side-dr' : 'side-cr');
            return `<tr><td>${esc(b.ACCOUNT_NAME)}<span class="aff-mini">${esc(b.SEGMENT_CONCAT)}</span></td><td class="num">${beg.toLocaleString('ja-JP')}</td><td class="num">${net.toLocaleString('ja-JP')}</td><td class="num ${cls}">${b.END_BALANCE.toLocaleString('ja-JP')}</td></tr>`;
          }).join('')}
        </tbody></table></div>`);
    } else if (stepIndex === lastStep - 1) {
      const lines = currState.XLA_AE_LINES || [];
      const dr = lines.reduce((a, r) => a + r.ACCOUNTED_DR, 0);
      const cr = lines.reduce((a, r) => a + r.ACCOUNTED_CR, 0);
      blocks.push(`<div class="journal-group">
        <div class="journal-group-note">⚙️ XLA_AE_LINES 確定済 (${lines.length}行) ｜ 借方計 ¥${dr.toLocaleString('ja-JP')} ＝ 貸方計 ¥${cr.toLocaleString('ja-JP')}</div>
        <table class="journal-table"><thead><tr><th>区分 / AFF</th><th class="num">借方</th><th class="num">貸方</th></tr></thead><tbody>
          ${lines.map(l => `<tr><td><span class="mono">${esc(l.ACCOUNTING_CLASS_CODE)}</span><br><span class="aff-mini">${esc(l.SEGMENT_CONCAT)}</span></td><td class="num">${l.ACCOUNTED_DR ? l.ACCOUNTED_DR.toLocaleString('ja-JP') : '-'}</td><td class="num">${l.ACCOUNTED_CR ? l.ACCOUNTED_CR.toLocaleString('ja-JP') : '-'}</td></tr>`).join('')}
        </tbody></table></div>`);
    } else if (caseId === 'LA_BOOK_AP_ACCRUAL') {
      if (stepIndex <= 1) blocks.push(`<div class="journal-group"><div class="journal-group-note">📋 契約ドラフト段階（有効化時にPV 2,400,000円を計上）</div></div>`);
      if (stepIndex >= 2) blocks.push(renderMiniJournal('🏢 リース初期計上 (LEASE_BOOKING)', [['借', CCID_LIST[1710].name, 2400000, 0], ['貸', CCID_LIST[2310].name, 0, 2400000]]));
      if (stepIndex >= 3) blocks.push(renderMiniJournal('🧾 LA支払 & AP請求連携 (105,000+税10%=115,500)', [['借', CCID_LIST[2310].name, 105000, 0], ['貸', CCID_LIST[2390].name, 0, 105000], ['借', CCID_LIST[2390].name, 105000, 0], ['借', CCID_LIST[1501].name, 10500, 0], ['貸', CCID_LIST[2101].name, 0, 115500]]));
      if (stepIndex >= 4) blocks.push(renderMiniJournal('🏦 AP銀行振込支払 (CLEARED)', [['借', CCID_LIST[2101].name, 115500, 0], ['貸', CCID_LIST[1001].name, 0, 115500]]));
      if (stepIndex >= 5) blocks.push(renderMiniJournal('📉 ROU償却(10万)＆実効利息(5千円)', [['借', CCID_LIST[5401].name, 100000, 0], ['貸', CCID_LIST[1719].name, 0, 100000], ['借', CCID_LIST[6301].name, 5000, 0], ['貸', CCID_LIST[2310].name, 0, 5000]]));
    } else if (caseId === 'LA_REVISION') {
      if (stepIndex === 0) blocks.push(renderMiniJournal('📂 期首1年経過残高 (ROU簿価120万 / 負債123万)', [['借', CCID_LIST[1710].name, 2400000, 0], ['借', CCID_LIST[3101].name, 30000, 0], ['貸', CCID_LIST[1719].name, 0, 1200000], ['貸', CCID_LIST[2310].name, 0, 1230000]]));
      if (stepIndex >= 1) blocks.push(renderMiniJournal('✏️ 契約改定・負債再測定 (LEASE_REVISION: +165万)', [['借', CCID_LIST[1710].name, 1650000, 0], ['貸', CCID_LIST[2310].name, 0, 1650000]]));
      if (stepIndex >= 2) blocks.push(renderMiniJournal('🧾 改定AP連携(13万+税=14.3万)', [['借', CCID_LIST[2310].name, 130000, 0], ['借', CCID_LIST[1501].name, 13000, 0], ['貸', CCID_LIST[2101].name, 0, 143000]]));
      if (stepIndex >= 3) blocks.push(renderMiniJournal('🏦 改定AP支払決済', [['借', CCID_LIST[2101].name, 143000, 0], ['貸', CCID_LIST[1001].name, 0, 143000]]));
      if (stepIndex >= 4) blocks.push(renderMiniJournal('📉 再計算ROU償却(118,750)＆利息(7,200)', [['借', CCID_LIST[5401].name, 118750, 0], ['貸', CCID_LIST[1719].name, 0, 118750], ['借', CCID_LIST[6301].name, 7200, 0], ['貸', CCID_LIST[2310].name, 0, 7200]]));
    } else if (caseId === 'LA_TERMINATION') {
      if (stepIndex === 0) blocks.push(renderMiniJournal('📂 解約前残高 (ROU簿価60万 / 負債62万)', [['借', CCID_LIST[1710].name, 2400000, 0], ['借', CCID_LIST[3101].name, 20000, 0], ['貸', CCID_LIST[1719].name, 0, 1800000], ['貸', CCID_LIST[2310].name, 0, 620000]]));
      if (stepIndex >= 2) blocks.push(renderMiniJournal('🛑 中途解約仕訳 (ROU/負債全消去＋解約損6万)', [['借', CCID_LIST[2310].name, 620000, 0], ['借', CCID_LIST[1719].name, 1800000, 0], ['借', CCID_LIST[6401].name, 60000, 0], ['貸', CCID_LIST[1710].name, 0, 2400000], ['貸', CCID_LIST[2390].name, 0, 80000]]));
      if (stepIndex >= 3) blocks.push(renderMiniJournal('🧾 違約金AP請求＆支払 (80,000+税10%=88,000)', [['借', CCID_LIST[2390].name, 80000, 0], ['借', CCID_LIST[1501].name, 8000, 0], ['貸', CCID_LIST[1001].name, 0, 88000]]));
    } else if (caseId === 'LA_REVENUE_AR') {
      if (stepIndex <= 1) blocks.push(`<div class="journal-group"><div class="journal-group-note">📋 転貸契約有効化完了（AR請求時に売掛・収益クリアリング起票）</div></div>`);
      if (stepIndex >= 2) blocks.push(renderMiniJournal('🧾 ARサブリース請求生成 (20万+税=22万)', [['借', CCID_LIST[1110].name, 220000, 0], ['貸', CCID_LIST[2490].name, 0, 200000], ['貸', CCID_LIST[2501].name, 0, 20000]]));
      if (stepIndex >= 3) blocks.push(renderMiniJournal('💰 テナント入金・売掛消込', [['借', CCID_LIST[1001].name, 220000, 0], ['貸', CCID_LIST[1110].name, 0, 220000]]));
      if (stepIndex >= 4) blocks.push(renderMiniJournal('📈 受取リース収益認識 (200,000円)', [['借', CCID_LIST[2490].name, 200000, 0], ['貸', CCID_LIST[4201].name, 0, 200000]]));
    }

    container.innerHTML = blocks.join('');
  }

  function renderInspector(analysis) {
    const container = $('tables-container');
    if (!container) return;

    const selBanner = $('selected-banner');
    const selNameEl = $('selected-table-name');
    if (appState.selectedTableId && TABLES[appState.selectedTableId]) {
      if (selBanner) selBanner.classList.remove('hidden');
      if (selNameEl) selNameEl.textContent = `${TABLES[appState.selectedTableId].name} (${TABLES[appState.selectedTableId].jpName})`;
    } else {
      if (selBanner) selBanner.classList.add('hidden');
    }

    const q = appState.searchQuery.trim().toLowerCase();
    const caseDef = CASES[appState.caseId];
    const stepDef = caseDef.steps[appState.stepIndex];
    const focusSet = new Set(stepDef.focusTables || []);

    const tablesToRender = Object.values(TABLES).filter(tbl => {
      if (appState.selectedTableId) return tbl.id === appState.selectedTableId;
      if (appState.domainFilter !== 'ALL' && tbl.domain !== appState.domainFilter) return false;
      if (appState.viewMode === 'changed') {
        const st = analysis.tableStatuses[tbl.id];
        if (!focusSet.has(tbl.id) && st !== 'inserted' && st !== 'updated') return false;
      }
      if (q) {
        const hay = [
          tbl.name, tbl.jpName, tbl.desc,
          ...tbl.keyCols.map(c => c.name + ' ' + c.desc),
          ...((analysis.currState[tbl.id] || []).map(r => JSON.stringify(r)))
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (tablesToRender.length === 0) {
      container.innerHTML = '<div class="empty-table-msg">条件に一致するテーブルがありません。表示タブやドメインフィルタを変更してください。</div>';
      return;
    }

    const stateLabels = {
      inserted: '新規登録 (INSERT)',
      updated: '更新・状態変化 (UPDATE)',
      referenced: '参照中 (READ)',
      existing: '作成済',
      not_created: '未作成 / 対象外'
    };

    const html = tablesToRender.map(tbl => {
      const st = analysis.tableStatuses[tbl.id] || 'not_created';
      const rows = analysis.currState[tbl.id] || [];
      const diff = analysis.tableDiffs[tbl.id] || { insertedKeys: new Set(), updatedCells: {} };
      const colNames = rows.length > 0 ? Object.keys(rows[0]) : tbl.keyCols.map(c => c.name);
      const pkSet = new Set(tbl.pk.split(',').map(s => s.trim()));
      const fkSet = new Set(tbl.fks || []);

      const ths = ['<th>状態</th>', ...colNames.map(c => {
        const badges = [];
        if (pkSet.has(c)) badges.push('<span class="col-badge badge-pk">PK</span>');
        if (fkSet.has(c)) badges.push('<span class="col-badge badge-fk">FK</span>');
        if (FLAG_LIKE.has(c)) badges.push('<span class="col-badge badge-flag">FLAG</span>');
        if (AMT_LIKE.has(c)) badges.push('<span class="col-badge badge-amt">AMT</span>');
        return `<th><div class="th-colname">${esc(c)} ${badges.join(' ')}</div></th>`;
      })].join('');

      let tbodyHtml = '';
      if (rows.length === 0) {
        tbodyHtml = `<tr><td colspan="${colNames.length + 1}" class="empty-table-msg">（このステップ・ケースではレコードはまだ作成されていません）</td></tr>`;
      } else {
        tbodyHtml = rows.map((row, idx) => {
          const rk = rowIdentityKey(tbl.id, row, idx);
          const isNew = diff.insertedKeys.has(rk);
          const cellUpds = diff.updatedCells[rk] || {};
          const rowCls = isNew ? 'row-inserted' : (Object.keys(cellUpds).length > 0 ? 'row-updated' : '');
          const tagHtml = isNew ? '<span class="row-tag-new">NEW</span>'
            : (Object.keys(cellUpds).length > 0 ? '<span class="row-tag-upd">UPD</span>' : '<span class="row-tag-cur">作成済</span>');

          const tds = colNames.map(col => {
            const val = row[col];
            const upd = cellUpds[col];
            let content = fmtVal(val);
            let tdCls = typeof val === 'number' ? 'num-cell' : '';

            if (upd) {
              tdCls += ' cell-updated';
              content = `<div class="cell-diff-wrap"><span class="cell-old">${fmtVal(upd.old)}</span><span class="cell-new">→ ${fmtVal(upd.new)}</span></div>`;
            }
            if (appState.showAff && CCID_COLS.has(col) && typeof val === 'number' && CCID_LIST[val]) {
              const cinfo = CCID_LIST[val];
              content += `<span class="cell-aff">${esc(cinfo.concat)} (${esc(cinfo.name)})</span>`;
            }
            return `<td class="${tdCls}">${content}</td>`;
          }).join('');

          return `<tr class="${rowCls}"><td>${tagHtml}</td>${tds}</tr>`;
        }).join('');
      }

      return `<div class="table-card card-${st}">
        <div class="table-card-header">
          <div>
            <div class="tbl-title-line">
              <span class="tbl-code">${esc(tbl.name)}</span>
              <span class="tbl-jp">${esc(tbl.jpName)}</span>
              <span class="tbl-domain-tag">${esc(DOMAINS[tbl.domain].label)}</span>
              <span class="tbl-state-badge state-badge-${st}">${stateLabels[st]} (${rows.length}件)</span>
            </div>
            <p class="tbl-desc">${esc(tbl.desc)}</p>
          </div>
          <div class="tbl-keys">PK: ${esc(tbl.pk)}${tbl.fks.length ? '<br>FK: ' + esc(tbl.fks.join(', ')) : ''}</div>
        </div>
        <div class="table-scroll">
          <table class="data-grid">
            <thead><tr>${ths}</tr></thead>
            <tbody>${tbodyHtml}</tbody>
          </table>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = html;
  }

  function renderAll() {
    const caseDef = CASES[appState.caseId];
    const stepDef = caseDef.steps[appState.stepIndex];
    const analysis = analyzeStepDiff(appState.caseId, appState.stepIndex);

    if (typeof document !== 'undefined') {
      document.querySelectorAll('.case-tab-btn').forEach(btn => {
        const active = btn.getAttribute('data-case') === appState.caseId;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    const summaryBanner = $('case-summary-banner');
    if (summaryBanner) {
      summaryBanner.innerHTML = `<strong>${esc(caseDef.title)}</strong><span>${esc(caseDef.subtitle)}</span>`;
      summaryBanner.style.borderLeftColor = caseDef.badgeColor;
    }

    const pillsEl = $('step-pills');
    if (pillsEl) {
      pillsEl.innerHTML = caseDef.steps.map((s, idx) =>
        `<button type="button" class="step-pill ${idx === appState.stepIndex ? 'active' : ''}" data-step="${idx}">${esc(s.title)}</button>`
      ).join('');
      pillsEl.querySelectorAll('.step-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          stopPlay();
          appState.stepIndex = Number(btn.getAttribute('data-step'));
          renderAll();
        });
      });
    }

    const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
    setText('svg-step-indicator', `STEP ${appState.stepIndex} / ${caseDef.steps.length - 1}`);
    setText('info-step-code', `${stepDef.id} : ${stepDef.badge}`);
    setText('info-step-date', stepDef.date);
    setText('info-step-title', stepDef.title);
    setText('info-step-subtitle', caseDef.shortTitle);

    const descEl = $('info-description');
    if (descEl) descEl.innerHTML = `<p>${esc(stepDef.desc)}</p>`;

    const flagEl = $('info-flag-changes');
    if (flagEl) {
      if (analysis.flagChangeSummaries.length === 0) {
        flagEl.innerHTML = '<div style="font-size:11.5px;color:#64748b;">このステップでは既存マスタ・期首残高または基準情報設定の確認を中心に行います。</div>';
      } else {
        flagEl.innerHTML = analysis.flagChangeSummaries.slice(0, 8).map(f => `
          <div class="flag-change-card">
            <div class="flag-change-top">
              <span class="flag-change-table">${esc(f.tableId)}.${esc(f.col)}</span>
              <span class="flag-change-diff"><span class="val-before">${fmtVal(f.oldVal)}</span><span class="val-arrow">→</span><span class="val-after">${fmtVal(f.newVal)}</span></span>
            </div>
            <div class="flag-change-note">${esc(f.note)}</div>
          </div>
        `).join('');
      }
    }

    renderSVG(analysis);
    renderJournalPreview(analysis.currState, appState.caseId, appState.stepIndex);
    renderInspector(analysis);
    updatePlayButton();
  }

  function updatePlayButton() {
    const btn = $('btn-play');
    if (!btn) return;
    btn.textContent = appState.isPlaying ? '⏸ 一時停止' : '▶ 自動再生';
    btn.classList.toggle('playing', appState.isPlaying);
  }

  function stopPlay() {
    appState.isPlaying = false;
    if (appState.timerId) {
      clearInterval(appState.timerId);
      appState.timerId = null;
    }
    updatePlayButton();
  }

  function startPlay() {
    stopPlay();
    appState.isPlaying = true;
    updatePlayButton();
    appState.timerId = setInterval(() => {
      const max = CASES[appState.caseId].steps.length - 1;
      appState.stepIndex = appState.stepIndex < max ? appState.stepIndex + 1 : 0;
      renderAll();
    }, appState.speedMs);
  }

  function switchCase(newCaseId) {
    if (!CASES[newCaseId]) return;
    stopPlay();
    appState.caseId = newCaseId;
    appState.stepIndex = 0;
    appState.selectedTableId = null;
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('case', newCaseId);
      window.history.replaceState({}, '', u.toString());
    } catch (_) {}
    renderAll();
  }

  function renderLaGuideModal() {
    const body = $('la-guide-modal-body');
    if (!body) return;
    const rows = LA_PROCESS_GUIDE.map(g => `
      <tr>
        <td><strong>${esc(g.title)}</strong><br><span class="tbl-domain-tag">${esc(g.badge)}</span></td>
        <td>${esc(g.meaning)}<br><small style="color:#0f766e;"><strong>具体例:</strong> ${esc(g.example)}</small></td>
        <td class="mono" style="font-size:11px;">${esc(g.tables)}</td>
      </tr>
    `).join('');
    body.innerHTML = `
      <p><strong>リース会計（Oracle Fusion Lease Accounting / APPLICATION_ID = 10522）</strong>とは、オフィス賃貸や設備リースの支払予定額を現在価値(PV)へ割り引いて<strong>使用権資産(ROU)</strong>と<strong>リース負債</strong>を貸借対照表に認識し、毎月の支払(AP連携)／減価償却・利息／修正／解約や、貸手(サブリース→AR請求)までを自動管理するモジュールです。</p>
      <table class="modal-table"><thead><tr><th style="width:24%;">業務プロセス</th><th style="width:46%;">何を行うプロセスか（解説＆具体例）</th><th style="width:30%;">主な関連テーブル</th></tr></thead><tbody>${rows}</tbody></table>
    `;
  }

  function renderAffModal() {
    const body = $('aff-modal-body');
    if (!body) return;
    const segRows = AFF_SEGMENTS.map(s => `<tr><td>${s.idx}</td><td class="mono">${esc(s.col)}</td><td><strong>${esc(s.name)}</strong></td><td class="mono">${esc(s.codeExample)}</td><td>${esc(s.desc)}</td></tr>`).join('');
    const ccidRows = Object.values(CCID_LIST).map(c => `<tr><td class="mono">${c.ccid}</td><td class="mono">${esc(c.concat)}</td><td>${esc(c.name)}</td><td>${esc(c.type)}</td></tr>`).join('');
    body.innerHTML = `
      <h4>1. 会計フレックスフィールド (AFF) 9セグメント体系定義</h4>
      <table class="modal-table"><thead><tr><th>#</th><th>物理列</th><th>セグメント名</th><th>サンプルコード</th><th>役割</th></tr></thead><tbody>${segRows}</tbody></table>
      <h4>2. リース会計(LA)・AP・AR連携 関連 CCID一覧</h4>
      <table class="modal-table"><thead><tr><th>CCID</th><th>9セグメント組合せ文字列</th><th>勘定科目名</th><th>種別</th></tr></thead><tbody>${ccidRows}</tbody></table>
    `;
  }

  function renderErModal() {
    const body = $('er-modal-body');
    if (!body) return;
    const rows = RELATIONS.map((r, i) => `<tr><td>${i + 1}</td><td class="mono">${esc(r.from)}</td><td class="mono">${esc(r.to)}</td><td class="mono">${esc(r.label)}</td><td>${esc(r.cases.join(', '))}</td></tr>`).join('');
    body.innerHTML = `
      <p>Oracle Fusion ERP Financials 26D (OEDMF) 準拠のリース会計(LA)・AP・AR連携 全63テーブル結合定義（${RELATIONS.length}本）です。</p>
      <table class="modal-table"><thead><tr><th>#</th><th>親テーブル (Source)</th><th>子テーブル (Target)</th><th>結合キー/連携イベント</th><th>適用ケース</th></tr></thead><tbody>${rows}</tbody></table>
    `;
  }

  function openModal(id) {
    if (id === 'la-guide-modal') renderLaGuideModal();
    if (id === 'aff-modal') renderAffModal();
    if (id === 'er-modal') renderErModal();
    const el = $(id);
    if (el) el.classList.remove('hidden');
  }

  function closeModal(id) {
    const el = $(id);
    if (el) el.classList.add('hidden');
  }

  function initApp() {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const p = new URLSearchParams(window.location.search).get('case');
      if (p && CASES[p]) appState.caseId = p;
    }

    renderGuideStrip();

    document.querySelectorAll('.case-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchCase(btn.getAttribute('data-case')));
    });

    const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
    bind('btn-toggle-guide', () => {
      appState.guideExpanded = !appState.guideExpanded;
      const grid = $('la-guide-grid');
      if (grid) grid.classList.toggle('hidden', !appState.guideExpanded);
    });
    bind('btn-la-guide-modal', () => openModal('la-guide-modal'));
    bind('btn-first', () => { stopPlay(); appState.stepIndex = 0; renderAll(); });
    bind('btn-prev', () => { stopPlay(); appState.stepIndex = Math.max(0, appState.stepIndex - 1); renderAll(); });
    bind('btn-next', () => { stopPlay(); appState.stepIndex = Math.min(CASES[appState.caseId].steps.length - 1, appState.stepIndex + 1); renderAll(); });
    bind('btn-last', () => { stopPlay(); appState.stepIndex = CASES[appState.caseId].steps.length - 1; renderAll(); });
    bind('btn-play', () => { if (appState.isPlaying) stopPlay(); else startPlay(); });
    bind('btn-fit-svg', () => {
      appState.selectedTableId = null;
      const w = $('svg-wrapper');
      if (w) { w.scrollLeft = 0; w.scrollTop = 0; }
      renderAll();
    });
    bind('btn-clear-selection', () => { appState.selectedTableId = null; renderAll(); });
    bind('btn-aff-modal', () => openModal('aff-modal'));
    bind('btn-er-modal', () => openModal('er-modal'));

    const speedSel = $('speed-select');
    if (speedSel) speedSel.addEventListener('change', (e) => {
      appState.speedMs = Number(e.target.value) || 2800;
      if (appState.isPlaying) startPlay();
    });

    document.querySelectorAll('.view-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.viewMode = btn.getAttribute('data-view');
        appState.selectedTableId = null;
        renderInspector(analyzeStepDiff(appState.caseId, appState.stepIndex));
      });
    });

    const domFilter = $('domain-filter');
    if (domFilter) domFilter.addEventListener('change', (e) => {
      appState.domainFilter = e.target.value;
      appState.selectedTableId = null;
      renderInspector(analyzeStepDiff(appState.caseId, appState.stepIndex));
    });

    const searchInput = $('table-search');
    if (searchInput) searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      appState.selectedTableId = null;
      renderInspector(analyzeStepDiff(appState.caseId, appState.stepIndex));
    });

    const chkAff = $('chk-show-aff');
    if (chkAff) chkAff.addEventListener('change', (e) => {
      appState.showAff = e.target.checked;
      renderInspector(analyzeStepDiff(appState.caseId, appState.stepIndex));
    });

    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => closeModal(el.getAttribute('data-close')));
    });

    renderAll();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
    else initApp();
  }

  global.LaApp = {
    appState,
    switchCase,
    analyzeStepDiff,
    renderAll,
    openModal,
    closeModal,
    initApp
  };
})(typeof window !== 'undefined' ? window : global);
