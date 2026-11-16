// Oracle Fusion ERP 26D — SLA & FAH Data Flow Interactive Animator & Setup Workbench
(function () {
  const Data = window.FusionSLAData;
  if (!Data) {
    console.error('FusionSLAData is not loaded.');
    return;
  }

  const STATE_STYLE = {
    inserted: { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d', badge: 'INSERT', badgeBg: '#16a34a', opacity: 1 },
    updated: { fill: '#fef9c3', stroke: '#ca8a04', text: '#713f12', badge: 'UPDATE', badgeBg: '#ca8a04', opacity: 1 },
    inserted_updated: { fill: '#d1fae5', stroke: '#059669', text: '#064e3b', badge: 'INS/UPD', badgeBg: '#059669', opacity: 1 },
    referenced: { fill: '#f3e8ff', stroke: '#9333ea', text: '#581c87', badge: 'READ', badgeBg: '#9333ea', opacity: 1 },
    existing: { fill: '#eff6ff', stroke: '#3b82f6', text: '#1e3a8a', badge: '済', badgeBg: '#3b82f6', opacity: 0.94 },
    not_created: { fill: '#f8fafc', stroke: '#cbd5e1', text: '#94a3b8', badge: '未', badgeBg: '#94a3b8', opacity: 0.56 }
  };

  let currentStep = 0;
  let isPlaying = false;
  let playTimer = null;
  let selectedTableId = null;
  let selectedSetupId = Data.SETUP_SCREENS[0].id;
  let ccidMap = new Map(Data.CCID_LIST.map(c => [c.id, c]));

  const elSvg = document.getElementById('flow-svg');
  const elPills = document.getElementById('step-pills');
  const elStepIndicator = document.getElementById('svg-step-indicator');
  const elTablesContainer = document.getElementById('tables-container');
  const elDomainFilter = document.getElementById('domain-filter');
  const elTableSearch = document.getElementById('table-search');
  const elChkShowAff = document.getElementById('chk-show-aff');
  const elSelectedBanner = document.getElementById('selected-banner');
  const elSelectedTableName = document.getElementById('selected-table-name');

  function svgEl(tag, attrs = {}, textContent = null) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    if (textContent !== null) el.textContent = textContent;
    return el;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStepPills() {
    elPills.innerHTML = '';
    Data.STEPS.forEach((st, idx) => {
      const btn = document.createElement('button');
      btn.className = 'step-pill';
      if (idx === currentStep) btn.classList.add('active');
      else if (idx < currentStep) btn.classList.add('done');

      btn.innerHTML = `
        <span class="pill-top"><span>${escapeHtml(st.code)}</span><span>${escapeHtml(st.date)}</span></span>
        <span class="pill-title">${escapeHtml(st.shortTitle)}</span>
      `;
      btn.addEventListener('click', () => {
        stopPlayback();
        goToStep(idx);
      });
      elPills.appendChild(btn);
    });
  }

  function getEdgePoints(fromTbl, toTbl) {
    const fc = { x: fromTbl.x + fromTbl.w / 2, y: fromTbl.y + fromTbl.h / 2 };
    const tc = { x: toTbl.x + toTbl.w / 2, y: toTbl.y + toTbl.h / 2 };
    const dx = tc.x - fc.x;
    const dy = tc.y - fc.y;

    let start, end;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx >= 0) {
        start = { x: fromTbl.x + fromTbl.w, y: fc.y };
        end = { x: toTbl.x, y: tc.y };
      } else {
        start = { x: fromTbl.x, y: fc.y };
        end = { x: toTbl.x + toTbl.w, y: tc.y };
      }
    } else {
      if (dy >= 0) {
        start = { x: fc.x, y: fromTbl.y + fromTbl.h };
        end = { x: tc.x, y: toTbl.y };
      } else {
        start = { x: fc.x, y: fromTbl.y };
        end = { x: tc.x, y: toTbl.y + toTbl.h };
      }
    }
    return { start, end };
  }

  function makeCurvePath(start, end) {
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    if (dx > dy) {
      return `M ${start.x} ${start.y} C ${mx} ${start.y}, ${mx} ${end.y}, ${end.x} ${end.y}`;
    }
    return `M ${start.x} ${start.y} C ${start.x} ${my}, ${end.x} ${my}, ${end.x} ${end.y}`;
  }

  function makeSelfLoopPath(tbl) {
    const sx = tbl.x + tbl.w - 18;
    const sy = tbl.y;
    return `M ${sx} ${sy} C ${sx + 26} ${sy - 32}, ${sx - 44} ${sy - 32}, ${tbl.x + tbl.w / 2} ${sy}`;
  }

  function estimateChipWidth(label) {
    let units = 0;
    for (const ch of String(label)) {
      units += ch.charCodeAt(0) > 255 ? 10.5 : 6.2;
    }
    return Math.max(54, Math.ceil(units + 16));
  }

  function renderSVG(stepState) {
    elSvg.innerHTML = '';
    const tblMap = new Map(Data.TABLES.map(t => [t.id, t]));

    const defs = svgEl('defs');
    const markerBase = svgEl('marker', {
      id: 'arrow-base', viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '5', markerHeight: '5', orient: 'auto-start-reverse'
    });
    markerBase.appendChild(svgEl('path', { d: 'M 0 1.5 L 8 5 L 0 8.5 z', fill: '#94a3b8' }));
    defs.appendChild(markerBase);

    const markerActive = svgEl('marker', {
      id: 'arrow-active', viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse'
    });
    markerActive.appendChild(svgEl('path', { d: 'M 0 1 L 9 5 L 0 9 z', fill: '#ea580c' }));
    defs.appendChild(markerActive);
    elSvg.appendChild(defs);

    // 1. ドメイン背景
    const domainGroup = svgEl('g', { id: 'layer-domains' });
    Data.DOMAINS.forEach(dom => {
      domainGroup.appendChild(svgEl('rect', {
        x: dom.x, y: dom.y, width: dom.w, height: dom.h, rx: 12,
        fill: dom.color, stroke: dom.border, 'stroke-width': 2
      }));
      domainGroup.appendChild(svgEl('rect', {
        x: dom.x, y: dom.y, width: dom.w, height: 28, rx: 12,
        fill: dom.headerBg
      }));
      domainGroup.appendChild(svgEl('rect', {
        x: dom.x, y: dom.y + 16, width: dom.w, height: 12,
        fill: dom.headerBg
      }));
      domainGroup.appendChild(svgEl('text', {
        x: dom.x + 12, y: dom.y + 19, fill: '#ffffff',
        'font-size': '12.5', 'font-weight': '800'
      }, dom.title));
    });

    // Dドメイン内の5サブ元帳ラベルマーカー（AP/AR/FA/LA/FAH行ガイド）
    const subTags = [
      { y: 58, text: 'AP (200) 買掛請求' },
      { y: 146, text: 'AR (222) 売掛請求' },
      { y: 234, text: 'FA (140) 資産償却' },
      { y: 322, text: 'LA (10522) リース' },
      { y: 418, text: 'FAH (20001) 外部I/F → Base表ロード' }
    ];
    subTags.forEach(tag => {
      domainGroup.appendChild(svgEl('text', {
        x: 608, y: tag.y, fill: '#9f1239', 'font-size': '10.5', 'font-weight': '800'
      }, tag.text));
    });
    elSvg.appendChild(domainGroup);

    // 2. ベースERリレーション線
    const edgeGroup = svgEl('g', { id: 'layer-base-edges' });
    Data.RELATIONS.forEach(rel => {
      const fromTbl = tblMap.get(rel.from);
      const toTbl = tblMap.get(rel.to);
      if (!fromTbl || !toTbl) return;
      const { start, end } = getEdgePoints(fromTbl, toTbl);
      const isRelSelected = selectedTableId && (rel.from === selectedTableId || rel.to === selectedTableId);
      edgeGroup.appendChild(svgEl('path', {
        d: makeCurvePath(start, end),
        class: isRelSelected ? 'base-edge highlighted' : 'base-edge',
        'marker-end': 'url(#arrow-base)'
      }));
    });
    elSvg.appendChild(edgeGroup);

    // 3. テーブルノード
    const nodeGroup = svgEl('g', { id: 'layer-nodes' });
    Data.TABLES.forEach(tbl => {
      const tState = stepState.tablesState[tbl.id];
      const st = STATE_STYLE[tState.tableState] || STATE_STYLE.not_created;
      const isSelected = selectedTableId === tbl.id;

      const g = svgEl('g', {
        class: `table-node state-${tState.tableState}${isSelected ? ' selected' : ''}`,
        'data-table-id': tbl.id
      });
      g.setAttribute('opacity', st.opacity);

      g.appendChild(svgEl('rect', {
        x: tbl.x, y: tbl.y, width: tbl.w, height: tbl.h, rx: 8,
        fill: st.fill, stroke: st.stroke, 'stroke-width': 2.1,
        class: 'node-rect'
      }));

      // バッジ描画
      const badgeW = 48;
      g.appendChild(svgEl('rect', {
        x: tbl.x + tbl.w - badgeW - 6, y: tbl.y + 5, width: badgeW, height: 15, rx: 4,
        fill: st.badgeBg
      }));
      g.appendChild(svgEl('text', {
        x: tbl.x + tbl.w - badgeW / 2 - 6, y: tbl.y + 16,
        fill: '#ffffff', 'font-size': '8.8', 'font-weight': '800', 'text-anchor': 'middle'
      }, st.badge));

      const countStr = `${tState.rows.length}件`;
      g.appendChild(svgEl('text', {
        x: tbl.x + tbl.w - 8, y: tbl.y + tbl.h - 7,
        fill: st.text, 'font-size': '9.5', 'font-weight': '700', 'text-anchor': 'end'
      }, countStr));

      const maxChars = Math.floor((tbl.w - badgeW - 22) / 6.3);
      const nameFontSize = tbl.id.length > maxChars ? '9.2' : '10.6';
      g.appendChild(svgEl('text', {
        x: tbl.x + 8, y: tbl.y + 17, fill: st.text,
        'font-size': nameFontSize, 'font-weight': '800',
        'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace'
      }, tbl.id));

      const descLimit = Math.floor((tbl.w - 60) / 10);
      const shortJp = tbl.shortDesc.length > descLimit ? tbl.shortDesc.slice(0, Math.max(8, descLimit - 1)) + '…' : tbl.shortDesc;
      g.appendChild(svgEl('text', {
        x: tbl.x + 8, y: tbl.y + 34, fill: '#334155', 'font-size': '10', 'font-weight': '600'
      }, shortJp));

      g.addEventListener('click', () => selectTable(tbl.id));
      nodeGroup.appendChild(g);
    });
    elSvg.appendChild(nodeGroup);

    // 4. アクティブデータフローアニメーション
    const flowGroup = svgEl('g', { id: 'layer-active-flows' });
    (stepState.step.activeFlows || []).forEach((fl, i) => {
      const fromTbl = tblMap.get(fl.from);
      const toTbl = tblMap.get(fl.to);
      if (!fromTbl || !toTbl) return;

      const isSelf = fl.from === fl.to;
      let d, midX, midY;
      if (isSelf) {
        d = makeSelfLoopPath(fromTbl);
        midX = fromTbl.x + fromTbl.w / 2;
        midY = fromTbl.y - 24;
      } else {
        const { start, end } = getEdgePoints(fromTbl, toTbl);
        d = makeCurvePath(start, end);
        midX = (start.x + end.x) / 2;
        midY = (start.y + end.y) / 2;
      }

      const pathId = `active-path-${currentStep}-${i}`;
      flowGroup.appendChild(svgEl('path', {
        id: pathId, d, class: 'active-flow-path', 'marker-end': 'url(#arrow-active)'
      }));

      const dot = svgEl('circle', { r: '5', fill: '#ea580c', stroke: '#ffffff', 'stroke-width': '1.5' });
      const anim = svgEl('animateMotion', { dur: '1.6s', repeatCount: 'indefinite' });
      const mpath = svgEl('mpath');
      mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);
      anim.appendChild(mpath);
      dot.appendChild(anim);
      flowGroup.appendChild(dot);

      if (fl.label) {
        const chipW = estimateChipWidth(fl.label);
        flowGroup.appendChild(svgEl('rect', {
          x: midX - chipW / 2, y: midY - 10, width: chipW, height: 18, class: 'flow-chip-bg'
        }));
        flowGroup.appendChild(svgEl('text', {
          x: midX, y: midY + 3, class: 'flow-chip-text'
        }, fl.label));
      }
    });
    elSvg.appendChild(flowGroup);

    elStepIndicator.textContent = `${stepState.step.code} (${stepState.step.date}): ${stepState.step.shortTitle}`;
  }

  function renderInfoPanel(stepState) {
    const st = stepState.step;
    document.getElementById('info-step-code').textContent = st.code;
    document.getElementById('info-step-date').textContent = st.date;
    document.getElementById('info-step-title').textContent = st.title;
    document.getElementById('info-step-subtitle').textContent = st.subtitle;

    const descEl = document.getElementById('info-description');
    descEl.innerHTML = st.description.map(p => `<p>${escapeHtml(p)}</p>`).join('');

    const flagEl = document.getElementById('info-flag-changes');
    flagEl.innerHTML = st.flagChanges.map(f => `<li>${escapeHtml(f)}</li>`).join('');

    const jEl = document.getElementById('info-journal-preview');
    const jp = st.journalPreview;
    let html = `<div class="journal-caption">${escapeHtml(jp.caption)}</div>`;
    jp.lines.forEach(ln => {
      const sideClass = ln.side === 'DR' ? 'side-dr' : (ln.side === 'CR' ? 'side-cr' : 'side-net0');
      html += `
        <div class="journal-line">
          <span class="${sideClass}">${escapeHtml(ln.side)}</span>
          <div>
            <span class="j-name">${escapeHtml(ln.name)}</span>
            <span class="j-aff">${escapeHtml(ln.aff)}</span>
          </div>
          <span class="j-amt">${escapeHtml(ln.amt)}</span>
        </div>
      `;
    });
    jEl.innerHTML = html;
  }

  function buildSetupScreenDetailHtml(scr) {
    const mock = scr.screenMock;
    return `
      <div class="setup-screen-card">
        <div class="setup-screen-top">
          <div class="setup-ui-path">${escapeHtml(scr.badge)} · ${escapeHtml(scr.uiPath)}</div>
          <h3 class="setup-screen-title">${escapeHtml(mock.title)}</h3>
        </div>
        <p class="setup-summary">${escapeHtml(scr.summary)}</p>
        <div class="setup-fields-grid">
          ${mock.fields.map(f => `
            <div class="setup-field-box">
              <span class="setup-field-label">${escapeHtml(f.label)}</span>
              <span class="setup-field-val">${escapeHtml(f.value)}</span>
            </div>
          `).join('')}
        </div>
        <div class="setup-table-wrap">
          <table class="modal-table">
            <thead>
              <tr>${mock.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${mock.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="setup-oedmf-chips">
          <span style="font-size:11px;font-weight:700;color:#475569;">連動OEDMFテーブル (クリックで下段表示):</span>
          ${scr.oedmfTables.map(tid => `<button type="button" class="oedmf-chip" data-jump-table="${escapeHtml(tid)}">${escapeHtml(tid)}</button>`).join('')}
        </div>
      </div>
    `;
  }

  function renderWorkbench() {
    const navEl = document.getElementById('setup-screens-nav');
    const detailEl = document.getElementById('setup-screen-detail');
    const srEl = document.getElementById('sr-dff-compare-container');
    if (!navEl || !detailEl || !srEl) return;

    navEl.innerHTML = '';
    Data.SETUP_SCREENS.forEach(scr => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `setup-tab-btn${scr.id === selectedSetupId ? ' active' : ''}`;
      btn.textContent = `${scr.stepNo}. ${scr.taskName.split(' ')[1] || scr.badge}`;
      btn.title = scr.taskName;
      btn.addEventListener('click', () => {
        selectedSetupId = scr.id;
        renderWorkbench();
      });
      navEl.appendChild(btn);
    });

    const curScr = Data.SETUP_SCREENS.find(s => s.id === selectedSetupId) || Data.SETUP_SCREENS[0];
    detailEl.innerHTML = buildSetupScreenDetailHtml(curScr);
    detailEl.querySelectorAll('[data-jump-table]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = btn.getAttribute('data-jump-table');
        selectTable(tid);
      });
    });

    const cmp = Data.SR_VS_DFF_COMPARISON;
    srEl.innerHTML = `
      <div class="sr-dff-card">
        <div class="sr-dff-header">
          <h3>⚖️ ${escapeHtml(cmp.title)}</h3>
          <p>${escapeHtml(cmp.subtitle)}</p>
        </div>
        <div class="sr-usecases">
          ${cmp.useCases.map(u => `
            <div class="sr-usecase-box">
              <strong>${escapeHtml(u.code)}: ${escapeHtml(u.type)}</strong>
              <div class="sr-meta">${escapeHtml(u.targetTables)}</div>
              <div><b>項目:</b> ${escapeHtml(u.attributes)}</div>
              <div style="margin-top:3px;color:#334155;">${escapeHtml(u.sampleEffect)}</div>
            </div>
          `).join('')}
        </div>
        <div style="padding:10px 12px;overflow-x:auto;">
          <table class="modal-table" style="margin-bottom:0;font-size:11px;">
            <thead>
              <tr>
                <th style="width:18%;">比較観点</th>
                <th style="width:41%;">サポート参照 (Supporting Reference)</th>
                <th style="width:41%;">DFF (付加フレックスフィールド)</th>
              </tr>
            </thead>
            <tbody>
              ${cmp.dimensions.map(d => `
                <tr>
                  <td><strong>${escapeHtml(d.aspect)}</strong><div style="margin-top:3px;color:#0369a1;font-size:10px;">${escapeHtml(d.verdict)}</div></td>
                  <td>${escapeHtml(d.supportingRef).replace(/\n/g, '<br>')}</td>
                  <td>${escapeHtml(d.dff).replace(/\n/g, '<br>')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function formatCellValue(col, val) {
    if (val === null || val === undefined) return '<span style="color:#94a3b8;">NULL</span>';
    if (typeof val === 'number') {
      const upper = col.toUpperCase();
      if (upper.includes('AMOUNT') || upper.endsWith('_DR') || upper.endsWith('_CR') || upper.includes('BALANCE') || upper === 'DEPRN_RESERVE' || upper === 'NUMBER3' || upper === 'UNIT_PRICE' || upper === 'UNIT_SELLING_PRICE') {
        return val.toLocaleString('ja-JP');
      }
    }
    return escapeHtml(val);
  }

  function getAffTextIfCcid(col, val) {
    if (!elChkShowAff.checked) return '';
    if (val === null || val === undefined) return '';
    if (col === 'CODE_COMBINATION_ID' || col.endsWith('_CCID') || col.endsWith('_COMBINATION_ID')) {
      const cc = ccidMap.get(Number(val));
      if (cc) {
        return `<span class="aff-sub">${escapeHtml(cc.aff)} (${escapeHtml(cc.name)})</span>`;
      }
    }
    return '';
  }

  function renderInspector(stepState) {
    const domFilter = elDomainFilter.value;
    const query = (elTableSearch.value || '').trim().toLowerCase();

    if (selectedTableId) {
      elSelectedBanner.classList.remove('hidden');
      elSelectedTableName.textContent = selectedTableId;
    } else {
      elSelectedBanner.classList.add('hidden');
    }

    elTablesContainer.innerHTML = '';

    let tablesToRender = Data.TABLES.filter(tbl => {
      if (selectedTableId && tbl.id !== selectedTableId) return false;
      if (!selectedTableId && domFilter !== 'ALL' && tbl.domain !== domFilter) return false;
      if (query) {
        const tState = stepState.tablesState[tbl.id];
        const matchMeta = tbl.id.toLowerCase().includes(query) || tbl.shortDesc.toLowerCase().includes(query);
        const matchCols = tbl.cols.some(c => c.name.toLowerCase().includes(query));
        const matchData = tState.rows.some(r => JSON.stringify(r.data).toLowerCase().includes(query));
        if (!matchMeta && !matchCols && !matchData) return false;
      }
      return true;
    });

    const priority = { inserted_updated: 0, inserted: 1, updated: 2, referenced: 3, existing: 4, not_created: 5 };
    tablesToRender.sort((a, b) => {
      const sa = stepState.tablesState[a.id].tableState;
      const sb = stepState.tablesState[b.id].tableState;
      return (priority[sa] ?? 9) - (priority[sb] ?? 9);
    });

    if (tablesToRender.length === 0) {
      elTablesContainer.innerHTML = '<div class="empty-row-msg">条件に一致するテーブルはありません。</div>';
      return;
    }

    tablesToRender.forEach(tbl => {
      const tState = stepState.tablesState[tbl.id];
      const dom = Data.DOMAINS.find(d => d.id === tbl.domain);
      const badgeLabel = STATE_STYLE[tState.tableState]?.badge || '済';

      const card = document.createElement('div');
      card.className = `table-card card-${tState.tableState}`;
      card.id = `card-${tbl.id}`;

      let bodyHtml = '';
      if (tState.rows.length === 0) {
        bodyHtml = `<div class="empty-row-msg">このステップ時点ではまだレコードは作成されていません。</div>`;
      } else {
        const ths = tbl.cols.map(c => {
          const cls = c.role === 'pk' ? 'col-pk' : (c.role === 'fk' ? 'col-fk' : (c.role === 'flag' ? 'col-flag' : ''));
          return `<th class="${cls}">${escapeHtml(c.name)}</th>`;
        }).join('');

        const trs = tState.rows.map(r => {
          const rowCls = r.rowState === 'inserted' ? 'row-inserted' : (r.rowState === 'updated' ? 'row-updated' : '');
          const tds = tbl.cols.map(c => {
            const val = r.data[c.name];
            const isUpdCol = r.updatedCols && r.updatedCols.includes(c.name);
            const prevHtml = (isUpdCol && r.data._prev && c.name in r.data._prev)
              ? `<span class="cell-old">旧: ${formatCellValue(c.name, r.data._prev[c.name])}</span>` : '';
            const affHtml = getAffTextIfCcid(c.name, val);
            return `<td class="${isUpdCol ? 'cell-updated' : ''}">${prevHtml}${formatCellValue(c.name, val)}${affHtml}</td>`;
          }).join('');
          return `<tr class="${rowCls}">${tds}</tr>`;
        }).join('');

        bodyHtml = `<div class="table-scroll"><table class="data-grid"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
      }

      card.innerHTML = `
        <div class="table-card-header">
          <div class="table-name-wrap">
            <span class="domain-tag">${escapeHtml(dom ? dom.title.split('.')[0] : tbl.domain)}</span>
            <span class="table-name-code">${escapeHtml(tbl.id)}</span>
            <span class="table-jp-desc">${escapeHtml(tbl.shortDesc)}</span>
          </div>
          <div>
            <span class="state-pill ${tState.tableState}">${badgeLabel} (${tState.rows.length}行)</span>
          </div>
        </div>
        ${bodyHtml}
      `;
      elTablesContainer.appendChild(card);
    });
  }

  function renderModals() {
    // 1. Setup Modal (全9画面＋OEDMFテーブル一覧)
    const setupBody = document.getElementById('setup-modal-body');
    if (setupBody) {
      setupBody.innerHTML = Data.SETUP_SCREENS.map(scr => `
        <div style="margin-bottom:18px;">
          <h4 style="margin:0 0 6px;color:#1e3a8a;">${escapeHtml(scr.taskName)}</h4>
          ${buildSetupScreenDetailHtml(scr)}
        </div>
      `).join('');
      setupBody.querySelectorAll('[data-jump-table]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('setup-modal').classList.add('hidden');
          selectTable(btn.getAttribute('data-jump-table'));
        });
      });
    }

    // 2. SR vs DFF Modal
    const srdffBody = document.getElementById('srdff-modal-body');
    if (srdffBody) {
      const cmp = Data.SR_VS_DFF_COMPARISON;
      srdffBody.innerHTML = `
        <p style="margin-top:0;font-weight:700;color:#4c1d95;">${escapeHtml(cmp.subtitle)}</p>
        <div class="sr-usecases" style="margin-bottom:14px;">
          ${cmp.useCases.map(u => `
            <div class="sr-usecase-box">
              <strong>${escapeHtml(u.code)}: ${escapeHtml(u.type)}</strong>
              <div class="sr-meta">Carry Forward: ${escapeHtml(u.carryForward)} | ${escapeHtml(u.targetTables)}</div>
              <div><b>保持項目:</b> ${escapeHtml(u.attributes)}</div>
              <div style="margin-top:4px;color:#1e293b;">${escapeHtml(u.sampleEffect)}</div>
            </div>
          `).join('')}
        </div>
        <table class="modal-table">
          <thead>
            <tr>
              <th>比較観点</th>
              <th>サポート参照 (Supporting Reference)</th>
              <th>DFF (付加フレックスフィールド)</th>
              <th>設計指針</th>
            </tr>
          </thead>
          <tbody>
            ${cmp.dimensions.map(d => `
              <tr>
                <td><strong>${escapeHtml(d.aspect)}</strong></td>
                <td>${escapeHtml(d.supportingRef).replace(/\n/g, '<br>')}</td>
                <td>${escapeHtml(d.dff).replace(/\n/g, '<br>')}</td>
                <td style="color:#0369a1;font-weight:600;">${escapeHtml(d.verdict)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // 3. AFF Modal
    const affBody = document.getElementById('aff-modal-body');
    if (affBody) {
      affBody.innerHTML = `
        <p><strong>体系 (JP_COA_9SEG / CHART_OF_ACCOUNTS_ID=101):</strong> <code>会社(1)-部門(2)-勘定科目(3)-補助科目(4)-税コード(5)-管理コード(6)-備考1(7)-備考2(8)-備考3(9)</code></p>
        <table class="modal-table">
          <thead><tr><th>No</th><th>カラム</th><th>セグメント名</th><th>桁数</th><th>設定例</th><th>説明</th></tr></thead>
          <tbody>
            ${Data.AFF_SEGMENTS.map(s => `
              <tr><td>${s.num}</td><td><code>${s.col}</code></td><td><strong>${escapeHtml(s.name)}</strong></td><td>${s.codeLen}</td><td><code>${s.example}</code></td><td>${escapeHtml(s.desc)}</td></tr>
            `).join('')}
          </tbody>
        </table>
        <h4>本シナリオで使用する 全11 CCID マッピング</h4>
        <table class="modal-table">
          <thead><tr><th>CCID</th><th>区分</th><th>勘定科目名</th><th>9セグメント AFF 値</th><th>用途 / 導出元</th></tr></thead>
          <tbody>
            ${Data.CCID_LIST.map(c => `
              <tr><td><code>${c.id}</code></td><td>${c.type}</td><td><strong>${escapeHtml(c.name)}</strong></td><td><code>${c.aff}</code></td><td>${escapeHtml(c.desc)}</td></tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // 4. ER Modal
    const erBody = document.getElementById('er-modal-body');
    if (erBody) {
      erBody.innerHTML = `
        <p>Oracle Fusion ERP Financials 26D の OEDMF に基づく <strong>全59テーブル・${Data.RELATIONS.length}本の主キー/外部キー連携</strong> です。</p>
        <table class="modal-table">
          <thead><tr><th>#</th><th>親テーブル (From)</th><th>子テーブル (To)</th><th>結合キー / カラム</th></tr></thead>
          <tbody>
            ${Data.RELATIONS.map((r, i) => `
              <tr><td>${i + 1}</td><td><code>${escapeHtml(r.from)}</code></td><td><code>${escapeHtml(r.to)}</code></td><td><code>${escapeHtml(r.key)}</code></td></tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  function selectTable(tableId) {
    selectedTableId = (selectedTableId === tableId) ? null : tableId;
    renderAll();
    if (selectedTableId) {
      const target = document.getElementById(`card-${selectedTableId}`) || document.getElementById('inspector-section');
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function renderAll() {
    const stepState = Data.computeStateAtStep(currentStep);
    renderStepPills();
    renderSVG(stepState);
    renderInfoPanel(stepState);
    renderWorkbench();
    renderInspector(stepState);
  }

  function goToStep(idx, autoSyncSetup = true) {
    currentStep = Math.max(0, Math.min(Data.STEPS.length - 1, idx));
    const st = Data.STEPS[currentStep];
    if (autoSyncSetup && st.focusSetupScreenId) {
      selectedSetupId = st.focusSetupScreenId;
    }
    renderAll();
  }

  function startPlayback() {
    if (isPlaying) return;
    isPlaying = true;
    const playBtn = document.getElementById('btn-play');
    playBtn.textContent = '⏸️ 停止';
    playBtn.classList.add('playing');

    const tick = () => {
      if (!isPlaying) return;
      if (currentStep < Data.STEPS.length - 1) {
        goToStep(currentStep + 1);
      } else {
        goToStep(0);
      }
      const speed = Number(document.getElementById('speed-select').value) || 4500;
      playTimer = setTimeout(tick, speed);
    };
    const speed = Number(document.getElementById('speed-select').value) || 4500;
    playTimer = setTimeout(tick, speed);
  }

  function stopPlayback() {
    isPlaying = false;
    if (playTimer) clearTimeout(playTimer);
    playTimer = null;
    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
      playBtn.textContent = '▶️ 再生';
      playBtn.classList.remove('playing');
    }
  }

  document.getElementById('btn-first').addEventListener('click', () => { stopPlayback(); goToStep(0); });
  document.getElementById('btn-prev').addEventListener('click', () => { stopPlayback(); goToStep(currentStep - 1); });
  document.getElementById('btn-next').addEventListener('click', () => { stopPlayback(); goToStep(currentStep + 1); });
  document.getElementById('btn-last').addEventListener('click', () => { stopPlayback(); goToStep(Data.STEPS.length - 1); });
  document.getElementById('btn-play').addEventListener('click', () => { isPlaying ? stopPlayback() : startPlayback(); });

  elDomainFilter.addEventListener('change', () => { selectedTableId = null; renderAll(); });
  elTableSearch.addEventListener('input', () => renderAll());
  elChkShowAff.addEventListener('change', () => renderAll());
  document.getElementById('btn-clear-selection').addEventListener('click', () => { selectedTableId = null; renderAll(); });
  document.getElementById('btn-fit-svg').addEventListener('click', () => {
    document.getElementById('svg-wrapper').scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });

  const wbBody = document.getElementById('sla-workbench-body');
  const wbToggle = document.getElementById('btn-toggle-workbench');
  if (wbToggle && wbBody) {
    wbToggle.addEventListener('click', () => {
      wbBody.classList.toggle('collapsed');
    });
  }

  document.getElementById('btn-setup-modal').addEventListener('click', () => document.getElementById('setup-modal').classList.remove('hidden'));
  document.getElementById('btn-srdff-modal').addEventListener('click', () => document.getElementById('srdff-modal').classList.remove('hidden'));
  document.getElementById('btn-aff-modal').addEventListener('click', () => document.getElementById('aff-modal').classList.remove('hidden'));
  document.getElementById('btn-er-modal').addEventListener('click', () => document.getElementById('er-modal').classList.remove('hidden'));
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const mId = btn.getAttribute('data-close');
      document.getElementById(mId).classList.add('hidden');
    });
  });
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.add('hidden');
    });
  });

  renderModals();
  renderAll();
})();
