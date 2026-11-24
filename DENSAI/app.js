/**
 * Oracle Fusion ERP Financials 26D (OEDMF)
 * 電子記録債務（AP）・電子記録債権（AR 満期／割引・譲渡）データフロー UIコントローラ
 */
(function (global) {
  'use strict';

  const DATA = global.FusionDENSAI;
  if (!DATA) return;

  const { AFF_SEGMENTS, CCID_LIST, DOMAINS, TABLES, RELATIONS, CASES, computeStateAtStep } = DATA;

  const appState = {
    caseId: 'AP_DENSAI',
    stepIndex: 0,
    isPlaying: false,
    timerId: null,
    speedMs: 2800,
    viewMode: 'changed', // 'changed' | 'all'
    domainFilter: 'ALL',
    searchQuery: '',
    showAff: true,
    selectedTableId: null
  };

  // --- DOM Helpers ---
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
    'CODE_COMBINATION_ID', 'DEFAULT_DIST_CCID', 'DIST_CODE_COMBINATION_ID',
    'ACCTS_PAY_CODE_COMBINATION_ID', 'FUTURE_DATED_PAYMENT_CCID',
    'GL_ID_REC', 'GL_ID_REV', 'GL_ID_UNPAID_REC', 'GL_ID_REMITTED_REC',
    'ASSET_CODE_COMBINATION_ID', 'CCID'
  ]);
  const PK_LIKE = new Set(['LEGAL_ENTITY_ID', 'BU_ID', 'LEDGER_ID', 'STRUCTURE_INSTANCE_ID', 'CODE_COMBINATION_ID', 'PARTY_ID', 'LOCATION_ID', 'PARTY_SITE_ID', 'VENDOR_ID', 'VENDOR_SITE_ID', 'CUST_ACCOUNT_ID', 'ORG_ID', 'TERM_ID', 'CUST_TRX_TYPE_SEQ_ID', 'TAX_RATE_ID', 'GROUP_ID', 'BANK_ACCOUNT_ID', 'BANK_ACCT_USE_ID', 'PAYMENT_METHOD_CODE', 'RECEIPT_METHOD_ID', 'RECEIVABLES_TRX_ID', 'INVOICE_ID', 'TAX_LINE_ID', 'INVOICE_DISTRIBUTION_ID', 'DOCUMENT_PAYABLE_ID', 'PAYMENT_ID', 'CHECK_ID', 'INVOICE_PAYMENT_ID', 'PAYMENT_HISTORY_ID', 'CUSTOMER_TRX_ID', 'CUSTOMER_TRX_LINE_ID', 'CUST_TRX_LINE_GL_DIST_ID', 'PAYMENT_SCHEDULE_ID', 'BATCH_ID', 'TRANSACTION_HISTORY_ID', 'ADJUSTMENT_ID', 'CASH_RECEIPT_ID', 'CASH_RECEIPT_HISTORY_ID', 'RECEIVABLE_APPLICATION_ID', 'LINE_ID', 'ENTITY_ID', 'EVENT_ID', 'AE_HEADER_ID', 'JE_BATCH_ID', 'JE_HEADER_ID']);
  const FLAG_LIKE = new Set(['VALIDATION_STATUS', 'PAYMENT_STATUS_FLAG', 'STATUS_LOOKUP_CODE', 'FUTURE_DATED_PMT_FLAG', 'POSTED_FLAG', 'MATCHED_FLAG', 'COMPLETE_FLAG', 'STATUS', 'EVENT', 'CURRENT_RECORD_FLAG', 'POSTABLE_FLAG', 'EVENT_STATUS_CODE', 'PROCESS_STATUS_CODE', 'GL_TRANSFER_STATUS_CODE', 'CLOSING_STATUS', 'TRANSACTION_TYPE', 'SUPPORT_BILLS_PAYABLE_FLAG', 'BR_ENABLED_FLAG']);
  const AMT_LIKE = new Set(['INVOICE_AMOUNT', 'AMOUNT_PAID', 'AMOUNT', 'TAXABLE_AMT', 'TAX_AMT', 'GROSS_AMOUNT', 'AWT_WITHHELD_AMOUNT', 'AMOUNT_REMAINING', 'PAYMENT_AMOUNT', 'CLEARED_AMOUNT', 'TRANSACTION_AMOUNT', 'BR_AMOUNT', 'EXTENDED_AMOUNT', 'AMOUNT_DUE_ORIGINAL', 'AMOUNT_ADJUSTED', 'AMOUNT_DUE_REMAINING', 'AMOUNT_DR', 'AMOUNT_CR', 'ACCOUNTED_DR', 'ACCOUNTED_CR', 'ENTERED_DR', 'ENTERED_CR', 'RUNNING_TOTAL_ACCOUNTED_DR', 'RUNNING_TOTAL_ACCOUNTED_CR', 'RUNNING_TOTAL_DR', 'RUNNING_TOTAL_CR', 'PERIOD_NET_DR', 'PERIOD_NET_CR', 'END_BALANCE', 'AMOUNT_APPLIED', 'PERCENTAGE_RATE', 'TAX_RATE']);

  function isTableRelevantToCase(tableId, caseId) {
    const t = TABLES[tableId];
    if (!t) return false;
    if (t.caseScope === 'ALL') return true;
    if (caseId === 'AP_DENSAI') return t.caseScope === 'AP';
    if (caseId === 'AR_DENSAI') return t.caseScope === 'AR';
    if (caseId === 'AR_DISCOUNT') {
      // 割引・譲渡ケースはAR系＋裏書譲渡先(サプライヤ系/参考AP_INVOICES_ALL)を使う
      return t.caseScope === 'AR' || tableId === 'POZ_SUPPLIERS' || tableId === 'POZ_SUPPLIER_SITES_ALL_M' || tableId === 'AP_INVOICES_ALL';
    }
    return true;
  }

  function rowIdentityKey(tableId, row, idx) {
    const tbl = TABLES[tableId];
    if (!tbl || !row) return String(idx);
    const pks = tbl.pk.split(',').map(s => s.trim());
    const parts = pks.map(k => (row[k] !== undefined ? String(row[k]) : ''));
    if (parts.some(p => p !== '')) return parts.join('|');
    return String(idx);
  }

  function analyzeStepDiff(caseId, stepIndex) {
    const curr = computeStateAtStep(caseId, stepIndex);
    const prev = stepIndex > 0 ? computeStateAtStep(caseId, stepIndex - 1) : { state: {} };
    const tableStatuses = {};
    const tableDiffs = {}; // { tblId: { insertedKeys: Set, updatedCells: { rowKey: { col: {old, new} } } } }
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
        if (focusSet.has(tblId)) {
          tableStatuses[tblId] = currRows.length > 0 ? 'referenced' : 'not_created';
        } else {
          tableStatuses[tblId] = currRows.length > 0 ? 'existing' : 'not_created';
        }
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
                  flagChangeSummaries.push({
                    tableId: tblId,
                    col: c,
                    oldVal: ov,
                    newVal: nv,
                    note: TABLES[tblId].jpName
                  });
                }
              }
            });
            if (Object.keys(colChanges).length > 0) {
              updCells[rk] = colChanges;
            }
          }
        });

        // 新規登録行の重要ステータスも変化サマリに追記（見やすさ向上）
        if (hasInsert && focusSet.has(tblId)) {
          currRows.forEach((r, idx) => {
            const rk = rowIdentityKey(tblId, r, idx);
            if (!insSet.has(rk)) return;
            const statusCol = ['STATUS', 'EVENT', 'TRANSACTION_TYPE', 'STATUS_LOOKUP_CODE', 'EVENT_TYPE_CODE', 'VALIDATION_STATUS'].find(c => r[c]);
            if (statusCol) {
              flagChangeSummaries.push({
                tableId: tblId,
                col: statusCol,
                oldVal: '(新規作成)',
                newVal: r[statusCol],
                note: TABLES[tblId].jpName + ' 行追加'
              });
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

  // --- SVG Diagram Renderer ---
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
      <marker id="arrow-insert" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a"/>
      </marker>
      ${allTables.map(t => `<clipPath id="clip-densai-${t.id}"><rect x="${t.x + 1}" y="${t.y + 1}" width="${Math.max(10, t.w - 2)}" height="${Math.max(10, t.h - 2)}" rx="6"/></clipPath>`).join('')}
    </defs>`);

    // 1. Domains
    Object.values(DOMAINS).forEach(dom => {
      const unitDomW = estSvgTextWidth(dom.label, 1, false) || 1;
      const domFs = estSvgTextWidth(dom.label, 12, false) > dom.w - 22
        ? Math.max(9.2, (dom.w - 22) / unitDomW)
        : 12;
      const domTxt = fitSvgText(dom.label, dom.w - 22, domFs, false);
      parts.push(`<g class="svg-domain">
        <rect x="${dom.x}" y="${dom.y}" width="${dom.w}" height="${dom.h}" rx="10" fill="${dom.bg}" stroke="${dom.border}" stroke-width="1.6"/>
        <rect x="${dom.x}" y="${dom.y}" width="${dom.w}" height="28" rx="10" fill="${dom.color}"/>
        <rect x="${dom.x}" y="${dom.y + 18}" width="${dom.w}" height="10" fill="${dom.color}"/>
        <text x="${dom.x + 12}" y="${dom.y + 19}" fill="#ffffff" font-size="${domFs.toFixed(1)}" font-weight="800">${esc(domTxt)}</text>
      </g>`);
    });

    // 2. Base & Active Relations
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
        parts.push(`<path d="${dPath}" fill="none" stroke="#cbd5e1" stroke-width="1.15" marker-end="url(#arrow-base)" opacity="0.72"/>`);
      }
    });

    // 3. Explicit step flow callouts (extra animated highlight paths + badges)
    const svgWidth = 1760;
    (stepDef.flows || []).forEach((fl, idx) => {
      const fromT = TABLES[fl.from];
      const toT = TABLES[fl.to];
      if (!fromT || !toT) return;
      const x1 = fromT.x + fromT.w / 2;
      const y1 = fromT.y + fromT.h / 2;
      const x2 = toT.x + toT.w / 2;
      const y2 = toT.y + toT.h / 2;
      const mxRaw = (x1 + x2) / 2;
      const my = (y1 + y2) / 2 - (idx % 2 === 0 ? 12 : -14);
      const pillFs = fl.label.length > 22 ? 8.8 : 9.3;
      const pillW = Math.max(80, Math.ceil(estSvgTextWidth(fl.label, pillFs, false) + 20));
      const mx = Math.max(pillW / 2 + 8, Math.min(svgWidth - pillW / 2 - 8, mxRaw));
      parts.push(`<g class="svg-flow-pill">
        <rect x="${mx - pillW / 2}" y="${my - 10}" width="${pillW}" height="19" rx="9" fill="#0f172a" stroke="#f59e0b" stroke-width="1.2" opacity="0.94"/>
        <text x="${mx}" y="${my + 3.2}" text-anchor="middle" fill="#fde68a" font-size="${pillFs}" font-weight="800">${esc(fl.label)}</text>
      </g>`);
    });

    // 4. Table Nodes (all 56 tables)
    allTables.forEach(tbl => {
      const st = analysis.tableStatuses[tbl.id] || 'not_created';
      const rel = isTableRelevantToCase(tbl.id, appState.caseId);
      const count = (analysis.currState[tbl.id] || []).length;
      const isSelected = appState.selectedTableId === tbl.id;

      const classes = [
        'svg-node',
        `state-${st}`,
        rel ? '' : 'case-dimmed',
        isSelected ? 'selected' : ''
      ].filter(Boolean).join(' ');

      const badgeColor = st === 'inserted' ? '#16a34a' : (st === 'updated' ? '#ea580c' : (st === 'referenced' ? '#0284c7' : '#64748b'));

      const avail1 = tbl.w - 16;
      let fsName = 10.2;
      if (estSvgTextWidth(tbl.name, fsName, true) > avail1) {
        const unitN = estSvgTextWidth(tbl.name, 1, true) || 1;
        fsName = Math.max(8.5, avail1 / unitN);
      }
      const shownName = fitSvgText(tbl.name, avail1, fsName, true);
      const avail2 = Math.max(30, tbl.w - 8 - 46);
      const shownJp = fitSvgText(tbl.jpName, avail2, 9.5, false);

      parts.push(`<g class="${classes}" data-table-id="${tbl.id}">
        <rect class="node-box" x="${tbl.x}" y="${tbl.y}" width="${tbl.w}" height="${tbl.h}" rx="7"/>
        <g clip-path="url(#clip-densai-${tbl.id})">
          <text x="${tbl.x + 8}" y="${tbl.y + 18}" fill="#0f172a" font-size="${fsName.toFixed(1)}" font-weight="800" font-family="ui-monospace, monospace">${esc(shownName)}</text>
          <text x="${tbl.x + 8}" y="${tbl.y + 34}" fill="#334155" font-size="9.5" font-weight="600">${esc(shownJp)}</text>
        </g>
        <rect x="${tbl.x + tbl.w - 42}" y="${tbl.y + tbl.h - 20}" width="36" height="15" rx="4" fill="${badgeColor}"/>
        <text x="${tbl.x + tbl.w - 24}" y="${tbl.y + tbl.h - 9}" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="800">${count}行</text>
        <title>${esc(tbl.name)} (${esc(tbl.jpName)}) — ${count}行</title>
      </g>`);
    });

    svg.innerHTML = parts.join('\n');

    // Click bindings on SVG nodes
    if (typeof svg.querySelectorAll === 'function') {
      svg.querySelectorAll('.svg-node').forEach(node => {
        node.addEventListener('click', () => {
          const tid = node.getAttribute('data-table-id');
          appState.selectedTableId = (appState.selectedTableId === tid) ? null : tid;
          renderAll();
          if (appState.selectedTableId) {
            const banner = $('selected-banner');
            if (banner && typeof banner.scrollIntoView === 'function') {
              banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        });
      });
    }
  }

  // --- Side Panel Render ---
  function renderJournalPreview(currState, caseId, stepIndex) {
    const container = $('info-journal-preview');
    if (!container) return;

    const blocks = [];

    if (stepIndex === 0) {
      blocks.push(`<div class="journal-group"><div class="journal-group-note">📋 マスタ事前検証済み（仕訳未発生）</div>
        <div style="font-size:11.5px;color:#475569;">AFF 9セグメント体系（会社-部門-勘定-補助-税-管理-備考1-備考2-備考3）および消費税10%/軽減8%・段階源泉(10.21%/20.42%)の準備が完了しています。</div></div>`);
    } else if (stepIndex >= 1 && stepIndex <= 4) {
      if (caseId === 'AP_DENSAI') {
        if (stepIndex >= 2) {
          blocks.push(renderMiniJournal('🧾 請求書検証・税・源泉仕訳 (INVOICE_VALIDATED)', [
            ['借', CCID_LIST[5001].name, 1000000, 0],
            ['借', CCID_LIST[5002].name, 1000000, 0],
            ['借', CCID_LIST[1501].name, 100000, 0],
            ['借', CCID_LIST[1502].name, 80000, 0],
            ['貸', CCID_LIST[2201].name, 0, 102100],
            ['貸', CCID_LIST[2202].name, 0, 204200],
            ['貸', CCID_LIST[2101].name, 0, 1873700]
          ]));
        } else {
          blocks.push(`<div class="journal-group"><div class="journal-group-note">📝 請求書未検証（品目合計 2,000,000円）</div></div>`);
        }
        if (stepIndex >= 3) {
          blocks.push(renderMiniJournal('📄 でんさい振出仕訳 (PAYMENT_CREATED / ISSUED)', [
            ['借', CCID_LIST[2101].name, 1873700, 0],
            ['貸', CCID_LIST[2110].name, 0, 1873700]
          ]));
        }
        if (stepIndex >= 4) {
          blocks.push(renderMiniJournal('🏦 満期銀行引落仕訳 (PAYMENT_MATURED / CLEARED)', [
            ['借', CCID_LIST[2110].name, 1873700, 0],
            ['貸', CCID_LIST[1001].name, 0, 1873700]
          ]));
        }
      } else if (caseId === 'AR_DENSAI') {
        if (stepIndex >= 1) {
          blocks.push(renderMiniJournal('🧾 AR請求＋源泉控除調整 (INV & ADJ)', [
            ['借', CCID_LIST[1110].name, 2180000, 0],
            ['貸', '売上高 10%/8% & 仮受消費税 10%/8%', 0, 2180000],
            ['借', '仮払源泉税 (10.21%: 102,100 + 20.42%: 204,200)', 306300, 0],
            ['貸', CCID_LIST[1110].name, 0, 306300]
          ]));
        }
        if (stepIndex >= 2) {
          blocks.push(renderMiniJournal('📄 電子記録債権受取 (PENDING_REMITTANCE)', [
            ['借', CCID_LIST[1120].name, 1873700, 0],
            ['貸', CCID_LIST[1110].name, 0, 1873700]
          ]));
        }
        if (stepIndex >= 3) {
          blocks.push(renderMiniJournal('📤 銀行取立送金 (REMITTED)', [
            ['借', CCID_LIST[1121].name, 1873700, 0],
            ['貸', CCID_LIST[1120].name, 0, 1873700]
          ]));
        }
        if (stepIndex >= 4) {
          blocks.push(renderMiniJournal('🏦 満期振込入金・BR消込 (CLEARED / CLOSED)', [
            ['借', CCID_LIST[1001].name, 1873700, 0],
            ['貸', CCID_LIST[1121].name, 0, 1873700]
          ]));
        }
      } else if (caseId === 'AR_DISCOUNT') {
        if (stepIndex >= 1) {
          blocks.push(renderMiniJournal('🧾 AR請求(10%/8%)＋源泉税控除 (-306,300円)', [
            ['借', CCID_LIST[1110].name, 2180000, 0],
            ['貸', '売上高10%/8%・仮受消費税10%/8%', 0, 2180000],
            ['借', CCID_LIST[1150].name, 306300, 0],
            ['貸', CCID_LIST[1110].name, 0, 306300]
          ]));
        }
        if (stepIndex >= 2) {
          blocks.push(renderMiniJournal('📄 分割でんさい2件受取 (997,900 + 875,800)', [
            ['借', '電子記録債権 BR-2A & BR-2B', 1873700, 0],
            ['貸', CCID_LIST[1110].name, 0, 1873700]
          ]));
        }
        if (stepIndex >= 3) {
          blocks.push(renderMiniJournal('💸 パターンA：BR-2A 銀行割引 (FACTORED)', [
            ['借', CCID_LIST[1001].name, 990000, 0],
            ['借', CCID_LIST[6101].name, 7900, 0],
            ['貸', CCID_LIST[1122].name, 0, 997900]
          ]));
        }
        if (stepIndex >= 4) {
          blocks.push(renderMiniJournal('🤝 パターンB：BR-2B 裏書譲渡 ＆ 期日リスク消滅', [
            ['借', CCID_LIST[2101].name, 875800, 0],
            ['貸', CCID_LIST[1123].name, 0, 875800],
            ['借', '割引/譲渡保証見合 (1122 & 1123)', 1873700, 0],
            ['貸', CCID_LIST[1120].name, 0, 1873700]
          ]));
        }
      }
    } else if (stepIndex === 5) {
      const lines = currState.XLA_AE_LINES || [];
      const dr = lines.reduce((a, r) => a + r.ACCOUNTED_DR, 0);
      const cr = lines.reduce((a, r) => a + r.ACCOUNTED_CR, 0);
      blocks.push(`<div class="journal-group">
        <div class="journal-group-note">⚙️ XLA_AE_LINES 確定済 (${lines.length}行) ｜ 借方計 ¥${dr.toLocaleString('ja-JP')} ＝ 貸方計 ¥${cr.toLocaleString('ja-JP')}</div>
        <table class="journal-table"><thead><tr><th>勘定科目</th><th class="num">借方</th><th class="num">貸方</th></tr></thead><tbody>
          ${lines.map(l => `<tr><td><span class="mono">${esc(l.ACCOUNTING_CLASS_CODE)}</span><br><span class="aff-mini">${esc(l.SEGMENT_CONCAT)}</span></td><td class="num">${l.ACCOUNTED_DR ? l.ACCOUNTED_DR.toLocaleString('ja-JP') : '-'}</td><td class="num">${l.ACCOUNTED_CR ? l.ACCOUNTED_CR.toLocaleString('ja-JP') : '-'}</td></tr>`).join('')}
        </tbody></table></div>`);
    } else if (stepIndex === 6) {
      const bals = currState.GL_BALANCES || [];
      const drTot = (currState.GL_JE_LINES || []).reduce((a, r) => a + r.ACCOUNTED_DR, 0);
      blocks.push(`<div class="journal-group">
        <div class="journal-group-note">✅ GL転記完了（Status=P）｜ 総発生 Dr/Cr: ¥${drTot.toLocaleString('ja-JP')}</div>
        <table class="journal-table"><thead><tr><th>勘定科目 (GL_BALANCES)</th><th class="num">借方累計</th><th class="num">貸方累計</th><th class="num">期末残高</th></tr></thead><tbody>
          ${bals.map(b => {
            const cls = b.END_BALANCE === 0 ? 'side-net0' : (b.END_BALANCE > 0 ? 'side-dr' : 'side-cr');
            return `<tr><td>${esc(b.ACCOUNT_NAME)}<span class="aff-mini">${esc(b.SEGMENT_CONCAT)}</span></td><td class="num">${b.PERIOD_NET_DR.toLocaleString('ja-JP')}</td><td class="num">${b.PERIOD_NET_CR.toLocaleString('ja-JP')}</td><td class="num ${cls}">${b.END_BALANCE.toLocaleString('ja-JP')}</td></tr>`;
          }).join('')}
        </tbody></table></div>`);
    }

    container.innerHTML = blocks.join('');
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

  // --- Data Inspector Render ---
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
      if (appState.selectedTableId) {
        return tbl.id === appState.selectedTableId;
      }
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
      updated: '更新・状態遷移 (UPDATE)',
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

  // --- Main Render Cycle ---
  function renderAll() {
    const caseDef = CASES[appState.caseId];
    const stepDef = caseDef.steps[appState.stepIndex];
    const analysis = analyzeStepDiff(appState.caseId, appState.stepIndex);

    // Case tabs active state
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

    // Step pills
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

    // Header tags & Info Panel
    const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
    setText('svg-step-indicator', `STEP ${appState.stepIndex} / ${caseDef.steps.length - 1}`);
    setText('info-step-code', `${stepDef.id} : ${stepDef.badge}`);
    setText('info-step-date', stepDef.date);
    setText('info-step-title', stepDef.title);
    setText('info-step-subtitle', caseDef.shortTitle);

    const descEl = $('info-description');
    if (descEl) {
      descEl.innerHTML = `<p>${esc(stepDef.desc)}</p>`;
    }

    const flagEl = $('info-flag-changes');
    if (flagEl) {
      if (analysis.flagChangeSummaries.length === 0) {
        flagEl.innerHTML = '<div style="font-size:11.5px;color:#64748b;">このステップでは既存テーブル状態または新規準備の確認を中心に行います。</div>';
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

  // --- Playback Controls ---
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
      if (appState.stepIndex < max) {
        appState.stepIndex++;
      } else {
        appState.stepIndex = 0;
      }
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

  // --- Modals ---
  function renderAffModal() {
    const body = $('aff-modal-body');
    if (!body) return;
    const segRows = AFF_SEGMENTS.map(s => `<tr><td>${s.idx}</td><td class="mono">${esc(s.col)}</td><td><strong>${esc(s.name)}</strong></td><td class="mono">${esc(s.codeExample)}</td><td>${esc(s.desc)}</td></tr>`).join('');
    const ccidRows = Object.values(CCID_LIST).map(c => `<tr><td class="mono">${c.ccid}</td><td class="mono">${esc(c.concat)}</td><td>${esc(c.name)}</td><td>${esc(c.type)}</td></tr>`).join('');
    body.innerHTML = `
      <h4>1. 会計フレックスフィールド (AFF) 9セグメント体系定義</h4>
      <table class="modal-table"><thead><tr><th>#</th><th>物理列</th><th>セグメント名</th><th>サンプルコード</th><th>役割</th></tr></thead><tbody>${segRows}</tbody></table>
      <h4>2. 電子記録債務・債権 関連 CCID（コード組合せ）一覧</h4>
      <table class="modal-table"><thead><tr><th>CCID</th><th>9セグメント組合せ文字列</th><th>勘定科目名</th><th>種別</th></tr></thead><tbody>${ccidRows}</tbody></table>
    `;
  }

  function renderErModal() {
    const body = $('er-modal-body');
    if (!body) return;
    const rows = RELATIONS.map((r, i) => `<tr><td>${i + 1}</td><td class="mono">${esc(r.from)}</td><td class="mono">${esc(r.to)}</td><td class="mono">${esc(r.label)}</td><td>${esc(r.cases.join(', '))}</td></tr>`).join('');
    body.innerHTML = `
      <p>Oracle Fusion ERP Financials 26D (OEDMF) 準拠の主要56テーブル結合定義（全${RELATIONS.length}本）です。</p>
      <table class="modal-table"><thead><tr><th>#</th><th>親テーブル (Source)</th><th>子テーブル (Target)</th><th>結合キー/イベント</th><th>適用ケース</th></tr></thead><tbody>${rows}</tbody></table>
    `;
  }

  function openModal(id) {
    if (id === 'aff-modal') renderAffModal();
    if (id === 'er-modal') renderErModal();
    const el = $(id);
    if (el) el.classList.remove('hidden');
  }

  function closeModal(id) {
    const el = $(id);
    if (el) el.classList.add('hidden');
  }

  // --- Initialization ---
  function initApp() {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const p = new URLSearchParams(window.location.search).get('case');
      if (p && CASES[p]) appState.caseId = p;
    }

    document.querySelectorAll('.case-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchCase(btn.getAttribute('data-case')));
    });

    const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
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

  global.DensaiApp = {
    appState,
    switchCase,
    analyzeStepDiff,
    renderAll,
    openModal,
    closeModal,
    initApp
  };
})(typeof window !== 'undefined' ? window : global);
