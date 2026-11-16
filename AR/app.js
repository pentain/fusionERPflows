(() => {
  const ccidById = new Map(CCID_LIST.map(c => [c.CODE_COMBINATION_ID, c]));
  const tableById = new Map(TABLES.map(t => [t.id, t]));
  const domainById = new Map(DOMAINS.map(d => [d.id, d]));

  const CCID_COLUMN_NAMES = new Set([
    'CODE_COMBINATION_ID', 'GL_ID_REC', 'GL_ID_REV', 'GL_ID_TAX',
    'CASH_CCID', 'UNAPPLIED_CCID', 'ON_ACCOUNT_CCID', 'UNIDENTIFIED_CCID',
    'REMITTANCE_CCID', 'CASH_CLEARING_CCID', 'ASSET_CODE_COMBINATION_ID',
    'ACCOUNT_CODE_COMBINATION_ID'
  ]);

  const PERCENT_COLUMN_NAMES = new Set(['PERCENT', 'PERCENTAGE_RATE', 'TAX_RATE', 'RELATIVE_AMOUNT']);

  let currentStep = 0;
  let isPlaying = false;
  let playTimer = null;
  let playSpeed = 2800;
  let viewMode = 'changed'; // 'changed' | 'all'
  let domainFilter = 'ALL';
  let searchQuery = '';
  let selectedTableId = null;
  let showAff = true;

  // DOM要素
  const elStepPills = document.getElementById('step-pills');
  const elBtnFirst = document.getElementById('btn-first');
  const elBtnPrev = document.getElementById('btn-prev');
  const elBtnPlay = document.getElementById('btn-play');
  const elBtnNext = document.getElementById('btn-next');
  const elBtnLast = document.getElementById('btn-last');
  const elSpeedSelect = document.getElementById('speed-select');
  const elFlowSvg = document.getElementById('flow-svg');
  const elSvgStepInd = document.getElementById('svg-step-indicator');

  const elInfoCode = document.getElementById('info-step-code');
  const elInfoDate = document.getElementById('info-step-date');
  const elInfoTitle = document.getElementById('info-step-title');
  const elInfoSub = document.getElementById('info-step-subtitle');
  const elInfoDesc = document.getElementById('info-description');
  const elInfoFlags = document.getElementById('info-flag-changes');
  const elInfoJournal = document.getElementById('info-journal-preview');

  const elTablesContainer = document.getElementById('tables-container');
  const elDomainFilter = document.getElementById('domain-filter');
  const elTableSearch = document.getElementById('table-search');
  const elChkShowAff = document.getElementById('chk-show-aff');
  const elSelectedBanner = document.getElementById('selected-banner');
  const elSelectedName = document.getElementById('selected-table-name');
  const elBtnClearSel = document.getElementById('btn-clear-selection');

  function formatValue(val, colMeta) {
    if (val === null || val === undefined) return '<span class="null-val">NULL</span>';
    if (typeof val === 'number') {
      if (colMeta && colMeta.role === 'amount' && !PERCENT_COLUMN_NAMES.has(colMeta.name)) {
        return val.toLocaleString('ja-JP');
      }
      if (PERCENT_COLUMN_NAMES.has(colMeta?.name)) {
        return `${val}%`;
      }
      return String(val);
    }
    return escapeHtml(String(val));
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStepPills() {
    elStepPills.innerHTML = '';
    STEPS.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'step-pill' + (s.id === currentStep ? ' active' : s.id < currentStep ? ' done' : '');
      btn.innerHTML = `<span class="step-pill-code">${s.code} (${s.dateLabel})</span><span class="step-pill-title">${s.shortTitle}</span>`;
      btn.addEventListener('click', () => {
        stopAutoPlay();
        setStep(s.id);
      });
      elStepPills.appendChild(btn);
    });
  }

  function updatePlaybackButtons() {
    elBtnFirst.disabled = currentStep === 0;
    elBtnPrev.disabled = currentStep === 0;
    elBtnNext.disabled = currentStep === STEPS.length - 1;
    elBtnLast.disabled = currentStep === STEPS.length - 1;
    elBtnPlay.textContent = isPlaying ? '⏸ 一時停止' : '▶ 自動再生';
    elBtnPlay.classList.toggle('playing', isPlaying);
  }

  function startAutoPlay() {
    if (currentStep >= STEPS.length - 1) {
      currentStep = 0;
    }
    isPlaying = true;
    updatePlaybackButtons();
    renderAll();
    if (playTimer) clearInterval(playTimer);
    playTimer = setInterval(() => {
      if (currentStep < STEPS.length - 1) {
        setStep(currentStep + 1);
      } else {
        stopAutoPlay();
      }
    }, playSpeed);
  }

  function stopAutoPlay() {
    isPlaying = false;
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    updatePlaybackButtons();
  }

  function setStep(idx) {
    currentStep = Math.max(0, Math.min(STEPS.length - 1, idx));
    renderAll();
  }

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    return el;
  }

  function getAnchorPoints(fromTbl, toTbl) {
    const a = fromTbl.pos;
    const b = toTbl.pos;
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;

    let x1 = ax, y1 = ay, x2 = bx, y2 = by;
    if (Math.abs(bx - ax) > Math.abs(by - ay) * 0.75) {
      x1 = bx > ax ? a.x + a.w : a.x;
      x2 = bx > ax ? b.x : b.x + b.w;
    } else {
      y1 = by > ay ? a.y + a.h : a.y;
      y2 = by > ay ? b.y : b.y + b.h;
    }
    return { x1, y1, x2, y2 };
  }

  function makeCurvePath(x1, y1, x2, y2) {
    const dx = (x2 - x1) * 0.45;
    const dy = (y2 - y1) * 0.15;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1 + dy}, ${x2 - dx} ${y2 - dy}, ${x2} ${y2}`;
  }

  function renderSvgDiagram(snapshot) {
    const svg = elFlowSvg;
    svg.innerHTML = '';

    // Defs (矢印マーカー & グロウ)
    const defs = createSvgEl('defs');
    const markers = [
      { id: 'arrow-insert', color: '#16a34a' },
      { id: 'arrow-update', color: '#ea580c' },
      { id: 'arrow-ref', color: '#0284c7' },
      { id: 'arrow-base', color: '#cbd5e1' }
    ];
    markers.forEach(m => {
      const marker = createSvgEl('marker', {
        id: m.id, viewBox: '0 0 10 10', refX: '8', refY: '5',
        markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse'
      });
      marker.appendChild(createSvgEl('path', { d: 'M 0 1 L 10 5 L 0 9 z', fill: m.color }));
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    // 1. ドメイン背景レーン
    DOMAINS.forEach(d => {
      const g = createSvgEl('g');
      g.appendChild(createSvgEl('rect', {
        x: d.x, y: d.y, width: d.w, height: d.h, rx: 10,
        fill: d.bg, stroke: d.color, 'stroke-width': '1.4', 'fill-opacity': '0.55'
      }));
      const titleBg = createSvgEl('rect', {
        x: d.x, y: d.y, width: d.w, height: 24, rx: 10, fill: d.color
      });
      g.appendChild(titleBg);
      const txt = createSvgEl('text', {
        x: d.x + 10, y: d.y + 16, fill: '#ffffff',
        'font-size': '11.5', 'font-weight': '700'
      });
      txt.textContent = d.name;
      g.appendChild(txt);
      svg.appendChild(g);
    });

    // 2. ベースの薄い結合線
    const baseEdgeGroup = createSvgEl('g', { opacity: '0.28' });
    RELATIONS.forEach(rel => {
      const f = tableById.get(rel.from);
      const t = tableById.get(rel.to);
      if (!f || !t) return;
      const { x1, y1, x2, y2 } = getAnchorPoints(f, t);
      const p = createSvgEl('path', {
        d: makeCurvePath(x1, y1, x2, y2),
        fill: 'none', stroke: '#94a3b8', 'stroke-width': '1'
      });
      baseEdgeGroup.appendChild(p);
    });
    svg.appendChild(baseEdgeGroup);

    // 3. テーブルノード描画
    TABLES.forEach(tbl => {
      const st = snapshot.tablesState[tbl.id];
      const stateCls = `state-${st.tableState === 'inserted_updated' ? 'updated' : st.tableState}`;
      const isSelected = selectedTableId === tbl.id;
      const g = createSvgEl('g', {
        class: `svg-node ${stateCls}${isSelected ? ' selected' : ''}`,
        'data-table': tbl.id
      });

      const { x, y, w, h } = tbl.pos;
      g.appendChild(createSvgEl('rect', {
        class: 'node-box', x, y, width: w, height: h, rx: 6
      }));

      // テーブル名
      const nameEl = createSvgEl('text', {
        x: x + 7, y: y + 16,
        fill: '#0f172a', 'font-size': w > 200 ? '10.8' : '8.8', 'font-weight': '800',
        'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace'
      });
      const maxChars = w > 250 ? 33 : 22;
      nameEl.textContent = tbl.name.length > maxChars ? tbl.name.slice(0, maxChars - 1) + '…' : tbl.name;
      g.appendChild(nameEl);

      // 日本語名 + 件数
      const subEl = createSvgEl('text', {
        x: x + 7, y: y + 32,
        fill: '#475569', 'font-size': w > 200 ? '10' : '8.5', 'font-weight': '600'
      });
      const jpShort = tbl.jpName.length > (w > 250 ? 22 : 12)
        ? tbl.jpName.slice(0, (w > 250 ? 21 : 11)) + '…'
        : tbl.jpName;
      subEl.textContent = `${jpShort} (${st.rows.length}件)`;
      g.appendChild(subEl);

      // 状態バッジ (右上)
      let badgeLabel = '';
      let badgeFill = '';
      if (st.tableState === 'inserted') { badgeLabel = 'NEW'; badgeFill = '#16a34a'; }
      else if (st.tableState === 'updated' || st.tableState === 'inserted_updated') { badgeLabel = 'UPD'; badgeFill = '#ea580c'; }
      else if (st.tableState === 'referenced') { badgeLabel = 'REF'; badgeFill = '#0284c7'; }

      if (badgeLabel) {
        g.appendChild(createSvgEl('rect', {
          x: x + w - 34, y: y + 4, width: 30, height: 14, rx: 3, fill: badgeFill
        }));
        const bTxt = createSvgEl('text', {
          x: x + w - 19, y: y + 14, fill: '#fff',
          'font-size': '8.5', 'font-weight': '800', 'text-anchor': 'middle'
        });
        bTxt.textContent = badgeLabel;
        g.appendChild(bTxt);
      }

      const titleTag = createSvgEl('title');
      titleTag.textContent = `${tbl.name} (${tbl.jpName})\n状態: ${st.tableState} / レコード数: ${st.rows.length}\nクリックして詳細テーブルを表示`;
      g.appendChild(titleTag);

      g.addEventListener('click', () => {
        selectedTableId = (selectedTableId === tbl.id) ? null : tbl.id;
        renderInspector(snapshot);
        renderSvgDiagram(snapshot);
        if (selectedTableId) {
          document.getElementById('inspector-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      svg.appendChild(g);
    });

    // 4. アクティブステップのデータフロー線＋アニメーション粒子
    const activeEdgesGroup = createSvgEl('g');
    snapshot.step.flowEdges.forEach((edge, idx) => {
      const f = tableById.get(edge.from);
      const t = tableById.get(edge.to);
      if (!f || !t) return;
      const { x1, y1, x2, y2 } = getAnchorPoints(f, t);
      const pathD = makeCurvePath(x1, y1, x2, y2);
      const pathId = `active-path-${snapshot.step.id}-${idx}`;

      const colorMap = { insert: '#16a34a', update: '#ea580c', ref: '#0284c7' };
      const strokeColor = colorMap[edge.type] || '#1d4ed8';

      const pathEl = createSvgEl('path', {
        id: pathId,
        d: pathD,
        class: `flow-edge-active flow-edge-${edge.type}`,
        'marker-end': `url(#arrow-${edge.type})`
      });
      activeEdgesGroup.appendChild(pathEl);

      // アニメーション粒子 (データパケット)
      const packet = createSvgEl('circle', {
        r: '5.5', fill: strokeColor, stroke: '#ffffff', 'stroke-width': '1.5'
      });
      const anim = createSvgEl('animateMotion', {
        dur: '1.8s', repeatCount: 'indefinite', begin: `${(idx * 0.22).toFixed(2)}s`
      });
      const mpath = createSvgEl('mpath');
      mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`);
      anim.appendChild(mpath);
      packet.appendChild(anim);
      activeEdgesGroup.appendChild(packet);

      // ラベルチップ
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2 - 4;
      const lw = edge.label.length * 7 + 14;
      activeEdgesGroup.appendChild(createSvgEl('rect', {
        x: mx - lw / 2, y: my - 9, width: lw, height: 16, rx: 4,
        fill: '#ffffff', stroke: strokeColor, 'stroke-width': '1.2', 'fill-opacity': '0.94'
      }));
      const lTxt = createSvgEl('text', {
        x: mx, y: my + 2.5, fill: strokeColor,
        'font-size': '9', 'font-weight': '800', 'text-anchor': 'middle'
      });
      lTxt.textContent = edge.label;
      activeEdgesGroup.appendChild(lTxt);
    });
    svg.appendChild(activeEdgesGroup);

    elSvgStepInd.textContent = snapshot.step.code;
  }

  function renderInfoPanel(snapshot) {
    const s = snapshot.step;
    elInfoCode.textContent = s.code;
    elInfoDate.textContent = `基準日: ${s.dateLabel}`;
    elInfoTitle.textContent = s.title;
    elInfoSub.textContent = s.subTitle;

    elInfoDesc.innerHTML = s.description.map(p => `<p>${escapeHtml(p)}</p>`).join('');

    if (s.flagChanges.length === 0) {
      elInfoFlags.innerHTML = '<div class="empty-table-msg">このステップでの変更はありません。</div>';
    } else {
      elInfoFlags.innerHTML = s.flagChanges.map(fc => `
        <div class="flag-change-card">
          <div class="flag-change-top">
            <span class="flag-change-table">${escapeHtml(fc.table)} [${escapeHtml(fc.key)}] → ${escapeHtml(fc.column)}</span>
            <span class="flag-change-diff">
              <span class="val-before">${escapeHtml(fc.before)}</span>
              <span class="val-arrow">→</span>
              <span class="val-after">${escapeHtml(fc.after)}</span>
            </span>
          </div>
          <div class="flag-change-note">${escapeHtml(fc.note)}</div>
        </div>
      `).join('');
    }

    if (s.journalPreview.length === 0) {
      elInfoJournal.innerHTML = '<div class="empty-table-msg">Step 0では仕訳は未発生です（GL_BALANCES の期首残高 = 0円）。</div>';
    } else {
      elInfoJournal.innerHTML = s.journalPreview.map(grp => `
        <div class="journal-group">
          <div class="journal-group-note">${escapeHtml(grp.note)}</div>
          <table class="journal-table">
            <thead>
              <tr>
                <th>貸借</th>
                <th>CCID / 勘定科目 & AFF 9セグメント</th>
                <th style="text-align:right;">金額 (JPY)</th>
              </tr>
            </thead>
            <tbody>
              ${grp.lines.map(ln => {
                const cc = ccidById.get(ln.ccid);
                const sideCls = ln.side === 'DR' ? 'side-dr' : ln.side === 'CR' ? 'side-cr' : 'side-net0';
                const sideLbl = ln.side === 'DR' ? '借方(DR)' : ln.side === 'CR' ? '貸方(CR)' : '残高 0';
                return `
                  <tr>
                    <td class="${sideCls}">${sideLbl}</td>
                    <td>
                      <strong>${ln.ccid}</strong>: ${escapeHtml(ln.name)}
                      ${cc ? `<span class="aff-mini">${cc.CONCAT}</span>` : ''}
                    </td>
                    <td class="num">${ln.amount.toLocaleString('ja-JP')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('');
    }
  }

  function getStateBadgeHtml(tableState) {
    const labels = {
      inserted: '新規登録 (INSERT)',
      updated: '更新発生 (UPDATE)',
      inserted_updated: '新規＆更新',
      referenced: '参照マスタ (READ)',
      existing: '登録済データ',
      not_created: 'この時点では未作成'
    };
    const cls = tableState === 'inserted_updated' ? 'updated' : tableState;
    return `<span class="tbl-state-badge state-badge-${cls}">${labels[tableState] || tableState}</span>`;
  }

  function renderInspector(snapshot) {
    if (selectedTableId) {
      elSelectedBanner.classList.remove('hidden');
      const m = tableById.get(selectedTableId);
      elSelectedName.textContent = `${m.name} (${m.jpName})`;
    } else {
      elSelectedBanner.classList.add('hidden');
    }

    const q = searchQuery.trim().toLowerCase();
    const list = [];

    for (const tbl of TABLES) {
      const st = snapshot.tablesState[tbl.id];

      if (selectedTableId) {
        if (tbl.id !== selectedTableId) continue;
      } else {
        if (domainFilter !== 'ALL' && tbl.domain !== domainFilter) continue;
        if (viewMode === 'changed') {
          const isChanged = st.tableState === 'inserted' || st.tableState === 'updated' || st.tableState === 'inserted_updated';
          if (!isChanged) continue;
        }
      }

      if (q) {
        const metaMatch =
          tbl.name.toLowerCase().includes(q) ||
          tbl.jpName.toLowerCase().includes(q) ||
          tbl.columns.some(c => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
        const rowMatch = st.rows.some(r =>
          Object.values(r.data).some(v => v !== null && String(v).toLowerCase().includes(q))
        );
        if (!metaMatch && !rowMatch) continue;
      }

      list.push(st);
    }

    if (list.length === 0) {
      elTablesContainer.innerHTML = `<div class="table-card"><div class="empty-table-msg">該当するテーブルがありません（フィルタ条件やタブを変更してください）。</div></div>`;
      return;
    }

    elTablesContainer.innerHTML = list.map(st => {
      const tbl = st.meta;
      const dom = domainById.get(tbl.domain);
      const cardCls = st.tableState === 'inserted_updated' ? 'updated' : st.tableState;

      let bodyHtml = '';
      if (st.rows.length === 0) {
        bodyHtml = `<div class="empty-table-msg">このステップ（${snapshot.step.code}）の時点では、まだレコードは作成されていません。</div>`;
      } else {
        const ths = tbl.columns.map(col => {
          let badge = '';
          if (col.role === 'pk') badge = '<span class="col-badge badge-pk">PK</span>';
          else if (col.role === 'fk') badge = '<span class="col-badge badge-fk">FK</span>';
          else if (col.role === 'flag') badge = '<span class="col-badge badge-flag">FLAG</span>';
          else if (col.role === 'amount') badge = '<span class="col-badge badge-amt">AMT</span>';
          return `
            <th>
              <span class="th-colname">${badge} ${escapeHtml(col.name)}</span>
              <span class="th-sub">${escapeHtml(col.desc)} (${col.type})</span>
            </th>
          `;
        }).join('');

        const trs = st.rows.map(row => {
          const rowCls = row.rowState === 'inserted' ? 'row-inserted' : row.rowState === 'updated' ? 'row-updated' : '';
          const tagHtml = row.rowState === 'inserted'
            ? '<span class="row-tag-new">NEW</span>'
            : row.rowState === 'updated'
              ? '<span class="row-tag-upd">UPD</span>'
              : '<span class="row-tag-cur">済</span>';

          const tds = tbl.columns.map(col => {
            const val = row.data[col.name];
            const upd = row.updatedCols[col.name];
            const isCcidCol = showAff && CCID_COLUMN_NAMES.has(col.name) && val !== null && ccidById.has(Number(val));
            const ccObj = isCcidCol ? ccidById.get(Number(val)) : null;
            const affHtml = ccObj ? `<span class="cell-aff">${ccObj.CONCAT} (${escapeHtml(ccObj.NAME)})</span>` : '';

            if (upd) {
              return `
                <td class="cell-updated">
                  <div class="cell-diff-wrap">
                    <span class="cell-old">旧: ${formatValue(upd.before, col)}</span>
                    <span class="cell-new">新: ${formatValue(upd.after, col)}</span>
                  </div>
                  ${affHtml}
                </td>
              `;
            }

            const numCls = (col.role === 'amount') ? 'num-cell' : '';
            return `<td class="${numCls}">${formatValue(val, col)}${affHtml}</td>`;
          }).join('');

          return `<tr class="${rowCls}"><td>${tagHtml}</td>${tds}</tr>`;
        }).join('');

        bodyHtml = `
          <div class="table-scroll">
            <table class="data-grid">
              <thead><tr><th>状態</th>${ths}</tr></thead>
              <tbody>${trs}</tbody>
            </table>
          </div>
        `;
      }

      return `
        <article class="table-card card-${cardCls}" id="card-${tbl.id}">
          <div class="table-card-header">
            <div>
              <div class="tbl-title-line">
                <span class="tbl-code">${escapeHtml(tbl.name)}</span>
                <span class="tbl-jp">${escapeHtml(tbl.jpName)}</span>
                <span class="tbl-domain-tag">${escapeHtml(dom.shortName)}</span>
                ${getStateBadgeHtml(st.tableState)}
                <span style="font-size:11px; color:#475569; font-weight:700;">(${st.rows.length}行)</span>
              </div>
              <p class="tbl-desc">${escapeHtml(tbl.description)}</p>
            </div>
            <div class="tbl-keys">
              <div><strong>PK:</strong> ${tbl.pk.join(', ')}</div>
              ${tbl.fks.length ? `<div><strong>FK:</strong> ${tbl.fks.join(', ')}</div>` : ''}
            </div>
          </div>
          ${bodyHtml}
        </article>
      `;
    }).join('');
  }

  function renderModals() {
    // AFFモーダル
    const affBody = document.getElementById('aff-modal-body');
    affBody.innerHTML = `
      <h4>1. 会計フレックスフィールド (AFF) 9セグメント体系定義</h4>
      <p><code>GL_CODE_COMBINATIONS</code>（構造インスタンス: <code>JP_AFF_9SEG / CHART_OF_ACCOUNTS_ID=101</code>）で定義される9セグメント構造：</p>
      <table class="modal-table">
        <thead><tr><th>物理カラム</th><th>セグメント名</th><th>使用コード例</th><th>解説</th></tr></thead>
        <tbody>
          ${AFF_SEGMENTS.map(s => `
            <tr>
              <td class="mono"><strong>${s.seg}</strong></td>
              <td><strong>${escapeHtml(s.name)}</strong></td>
              <td class="mono">${escapeHtml(s.sample)}</td>
              <td>${escapeHtml(s.desc)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <h4>2. 本フローで使用する勘定コード組合せ (CCID) 一覧</h4>
      <table class="modal-table">
        <thead>
          <tr><th>CCID</th><th>勘定タイプ</th><th>勘定科目名称</th><th>AFF 9セグメント結合表記</th></tr>
        </thead>
        <tbody>
          ${CCID_LIST.map(c => `
            <tr>
              <td class="mono"><strong>${c.CODE_COMBINATION_ID}</strong></td>
              <td>${escapeHtml(c.ACCOUNT_TYPE_JP)}</td>
              <td>${escapeHtml(c.NAME)}</td>
              <td class="mono"><strong>${c.CONCAT}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // ER結合モーダル
    const erBody = document.getElementById('er-modal-body');
    erBody.innerHTML = `
      <p>Oracle Fusion ERP Financials 26D (OEDMF) における全テーブル間の主要な結合条件（PK/FK）一覧です：</p>
      <table class="modal-table">
        <thead><tr><th>#</th><th>親テーブル (From)</th><th>子/連携テーブル (To)</th><th>結合条件 (SQL Join)</th><th>業務的意味</th></tr></thead>
        <tbody>
          ${RELATIONS.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td class="mono"><strong>${r.from}</strong></td>
              <td class="mono"><strong>${r.to}</strong></td>
              <td class="mono">${escapeHtml(r.join)}</td>
              <td>${escapeHtml(r.label)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderAll() {
    const snapshot = computeStateAtStep(currentStep);
    renderStepPills();
    updatePlaybackButtons();
    renderSvgDiagram(snapshot);
    renderInfoPanel(snapshot);
    renderInspector(snapshot);
  }

  // イベントリスナー
  elBtnFirst.addEventListener('click', () => { stopAutoPlay(); setStep(0); });
  elBtnPrev.addEventListener('click', () => { stopAutoPlay(); setStep(currentStep - 1); });
  elBtnNext.addEventListener('click', () => { stopAutoPlay(); setStep(currentStep + 1); });
  elBtnLast.addEventListener('click', () => { stopAutoPlay(); setStep(STEPS.length - 1); });
  elBtnPlay.addEventListener('click', () => {
    if (isPlaying) stopAutoPlay();
    else startAutoPlay();
  });
  elSpeedSelect.addEventListener('change', (e) => {
    playSpeed = Number(e.target.value);
    if (isPlaying) startAutoPlay();
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.dataset.view;
      selectedTableId = null;
      renderAll();
    });
  });

  elDomainFilter.addEventListener('change', (e) => {
    domainFilter = e.target.value;
    selectedTableId = null;
    if (domainFilter !== 'ALL' && viewMode === 'changed') {
      viewMode = 'all';
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'all'));
    }
    renderAll();
  });

  elTableSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery.trim() && viewMode === 'changed') {
      viewMode = 'all';
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'all'));
    }
    renderAll();
  });

  elChkShowAff.addEventListener('change', (e) => {
    showAff = e.target.checked;
    renderAll();
  });

  elBtnClearSel.addEventListener('click', () => {
    selectedTableId = null;
    renderAll();
  });

  document.getElementById('btn-fit-svg').addEventListener('click', () => {
    selectedTableId = null;
    renderAll();
  });

  // モーダル制御
  document.getElementById('btn-aff-modal').addEventListener('click', () => {
    document.getElementById('aff-modal').classList.remove('hidden');
  });
  document.getElementById('btn-er-modal').addEventListener('click', () => {
    document.getElementById('er-modal').classList.remove('hidden');
  });
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById(el.dataset.close).classList.add('hidden');
    });
  });

  // 初期描画
  renderModals();
  renderAll();
})();
