#!/usr/bin/env python3
"""
Oracle Fusion ERP Financials 26D (OEDMF準拠)
電子記録債務（AP）・電子記録債権（AR 満期・割引/裏書譲渡）Excelブック生成スクリプト
"""

import json
import os
import subprocess
import sys
import xlsxwriter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS_PATH = os.path.join(SCRIPT_DIR, "data.js")
OUT_XLSX_PATH = os.path.join(SCRIPT_DIR, "FusionERP_26D_DENSAI_DataFlow.xlsx")


def load_data_from_node():
    node_code = f"""
const data = require({json.dumps(DATA_JS_PATH)});
const out = {{
  AFF_SEGMENTS: data.AFF_SEGMENTS,
  CCID_LIST: data.CCID_LIST,
  DOMAINS: data.DOMAINS,
  TABLES: data.TABLES,
  RELATIONS: data.RELATIONS,
  CASES: data.CASES,
  TIMELINES: {{}}
}};
for (const cid of Object.keys(data.CASES)) {{
  out.TIMELINES[cid] = [];
  for (let s = 0; s < data.CASES[cid].steps.length; s++) {{
    const r = data.computeStateAtStep(cid, s);
    out.TIMELINES[cid].push(r.state);
  }}
}}
process.stdout.write(JSON.stringify(out));
"""
    proc = subprocess.run(
        ["/opt/homebrew/bin/node", "-e", node_code],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout)


def row_key(tbl_meta, row, idx):
    pks = [p.strip() for p in tbl_meta["pk"].split(",")]
    vals = [str(row.get(p, "")) for p in pks]
    if any(v != "" for v in vals):
        return "|".join(vals)
    return str(idx)


def compute_final_diff_history(tbl_meta, states):
    """S0..S6 の各ステップを経て、最終状態(S6)の各行が新規か、どのセルがどう更新されたかを追跡する。"""
    updates_by_rk = {}  # rk -> { col: [(step_idx, old, new), ...] }
    inserted_step_by_rk = {}  # rk -> step_idx

    prev_map = {}
    for s_idx, st in enumerate(states):
        rows = st.get(tbl_meta["id"], [])
        curr_map = {}
        for idx, r in enumerate(rows):
            rk = row_key(tbl_meta, r, idx)
            curr_map[rk] = r
            if rk not in prev_map:
                if rk not in inserted_step_by_rk:
                    inserted_step_by_rk[rk] = s_idx
            else:
                old_r = prev_map[rk]
                for col, new_v in r.items():
                    old_v = old_r.get(col)
                    if old_v != new_v:
                        updates_by_rk.setdefault(rk, {}).setdefault(col, []).append(
                            (s_idx, old_v, new_v)
                        )
        prev_map = curr_map
    return inserted_step_by_rk, updates_by_rk


def make_formats(wb):
    base_font = "Meiryo UI"
    return {
        "title": wb.add_format({"bold": True, "font_size": 14, "font_color": "#0F172A", "font_name": base_font}),
        "subtitle": wb.add_format({"font_size": 10, "font_color": "#475569", "font_name": base_font}),
        "sec_hdr": wb.add_format({"bold": True, "font_size": 11, "bg_color": "#0F172A", "font_color": "#FFFFFF", "border": 1, "font_name": base_font}),
        "tbl_hdr": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#1E3A8A", "font_color": "#FFFFFF", "border": 1, "font_name": base_font}),
        "th": wb.add_format({"bold": True, "font_size": 9.5, "bg_color": "#E2E8F0", "font_color": "#0F172A", "border": 1, "align": "center", "valign": "vcenter", "font_name": base_font}),
        "td": wb.add_format({"font_size": 9.5, "border": 1, "valign": "vcenter", "font_name": base_font}),
        "td_num": wb.add_format({"font_size": 9.5, "border": 1, "num_format": "#,##0;-#,##0;0", "align": "right", "valign": "vcenter", "font_name": base_font}),
        "td_new": wb.add_format({"font_size": 9.5, "border": 1, "bg_color": "#DCFCE7", "valign": "vcenter", "font_name": base_font}),
        "td_new_num": wb.add_format({"font_size": 9.5, "border": 1, "bg_color": "#DCFCE7", "num_format": "#,##0;-#,##0;0", "align": "right", "valign": "vcenter", "font_name": base_font}),
        "td_upd": wb.add_format({"font_size": 9.5, "border": 1, "bg_color": "#FEF08A", "bold": True, "font_color": "#9A3412", "valign": "vcenter", "font_name": base_font}),
        "td_upd_num": wb.add_format({"font_size": 9.5, "border": 1, "bg_color": "#FEF08A", "bold": True, "font_color": "#9A3412", "num_format": "#,##0;-#,##0;0", "align": "right", "valign": "vcenter", "font_name": base_font}),
        "sum_lbl": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#DBEAFE", "border": 1, "font_name": base_font}),
        "sum_num": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#DBEAFE", "border": 1, "num_format": "#,##0;-#,##0;0", "align": "right", "font_name": base_font}),
        "ok_cell": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#DCFCE7", "font_color": "#14532D", "border": 1, "align": "center", "font_name": base_font}),
    }


def write_cell(ws, r, c, val, fmt_str, fmt_num, comment=None):
    if val is None or val == "":
        ws.write_string(r, c, "NULL", fmt_str)
    elif isinstance(val, bool):
        ws.write_string(r, c, str(val), fmt_str)
    elif isinstance(val, (int, float)):
        ws.write_number(r, c, val, fmt_num)
    else:
        ws.write_string(r, c, str(val), fmt_str)
    if comment:
        ws.write_comment(r, c, comment, {"width": 260, "height": 70})


def write_summary_sheet(wb, data, fmt):
    ws = wb.add_worksheet("00_全体サマリ・3ケース比較")
    ws.set_column(0, 0, 26)
    ws.set_column(1, 3, 28)
    ws.set_column(4, 5, 20)

    ws.write(0, 0, "Oracle Fusion ERP Financials 26D (OEDMF準拠) 電子記録債務・電子記録債権 データフロー総合サマリ", fmt["title"])
    ws.write(1, 0, "作成範囲: AFF 9セグメント体系 / 品目明細2本(10% & 軽減8%) / 段階源泉(<=100万:10.21% / >100万:20.42%) / SLA〜GL転記・残高検証", fmt["subtitle"])

    # 凡例
    ws.write(3, 0, "データ更新ハイライト凡例", fmt["sec_hdr"])
    ws.write(3, 1, "薄緑セル: 新規追加レコード (INSERT)", fmt["td_new"])
    ws.write(3, 2, "黄色太字セル: プロセス途上で値が更新された項目 (UPDATE + コメント履歴)", fmt["td_upd"])

    # 金額基盤検算表
    row = 5
    ws.write(row, 0, "1. 共通請求金額・消費税・源泉徴収税 検算基盤（全3ケース共通明細構成）", fmt["sec_hdr"])
    for col in range(1, 5):
        ws.write(row, col, "", fmt["sec_hdr"])
    row += 1
    headers = ["明細区分", "取引内容", "税抜・課税対象額", "適用税率", "算出税額・調整額"]
    for ci, h in enumerate(headers):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    calc_rows = [
        ("明細1 (標準10%)", "システム開発・UIデザイン委託", 1000000, "10.00%", "=C7*0.10"),
        ("明細2 (軽減8%)", "飲料・食品系販促資料パッケージ", 1000000, "8.00%", "=C8*0.08"),
        ("源泉徴収 (第1段階 <=100万)", "100万円以下部分 (10.21%)", 1000000, "10.21%", "=-C9*0.1021"),
        ("源泉徴収 (第2段階 >100万)", "100万円超部分 (20.42%)", 1000000, "20.42%", "=-C10*0.2042"),
    ]
    start_calc = row + 1  # 1-based Excel row 7
    for label, desc, amt, rate_str, formula in calc_rows:
        ws.write(row, 0, label, fmt["td"])
        ws.write(row, 1, desc, fmt["td"])
        ws.write_number(row, 2, amt, fmt["td_num"])
        ws.write(row, 3, rate_str, fmt["td"])
        ws.write_formula(row, 4, formula, fmt["td_num"])
        row += 1

    # Totals
    ws.write(row, 0, "品目合計（税抜）", fmt["sum_lbl"])
    ws.write(row, 1, "明細1 + 明細2", fmt["sum_lbl"])
    ws.write_formula(row, 2, "=SUM(C7:C8)", fmt["sum_num"])
    ws.write(row, 3, "-", fmt["sum_lbl"])
    ws.write_formula(row, 4, "=SUM(E7:E8)", fmt["sum_num"])
    row += 1
    ws.write(row, 0, "税込請求総額", fmt["sum_lbl"])
    ws.write(row, 1, "品目合計 + 消費税(10% + 8%)", fmt["sum_lbl"])
    ws.write_formula(row, 2, "=C11+E11", fmt["sum_num"])
    ws.write(row, 3, "源泉控除計", fmt["sum_lbl"])
    ws.write_formula(row, 4, "=SUM(E9:E10)", fmt["sum_num"])
    row += 1
    ws.write(row, 0, "正味でんさい振出・受取額", fmt["ok_cell"])
    ws.write(row, 1, "税込総額 - 源泉徴収税合計", fmt["ok_cell"])
    ws.write_formula(row, 2, "=C12+E12", fmt["sum_num"])
    ws.write(row, 3, "一致検証", fmt["ok_cell"])
    ws.write_formula(row, 4, '=IF(C13=1873700,"OK (1,873,700)","NG")', fmt["ok_cell"])
    row += 2

    # 3ケース比較表
    ws.write(row, 0, "2. 電子記録債務・電子記録債権 3ケース対比サマリ", fmt["sec_hdr"])
    for col in range(1, 5):
        ws.write(row, col, "", fmt["sec_hdr"])
    row += 1
    comp_hdrs = ["比較項目", "Case 1: AP 電子記録債務", "Case 2: AR 電子記録債権 (満期)", "Case 3: AR 電子記録債権 (割引・譲渡)", "備考・重要論点"]
    for ci, h in enumerate(comp_hdrs):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    comp_rows = [
        ("代表取引番号", "AP-DEN-2026-001 / CHECK 88001", "AR-INV-2026-001 / DEN-BR-2026-001", "AR-INV-2026-002 / BR-002A & 002B", "すべて2明細(10%/8%)＆段階源泉準拠"),
        ("中心トランザクション表", "AP_CHECKS_ALL / AP_PAYMENT_HISTORY_ALL", "RA_CUSTOMER_TRX_ALL / AR_TRANSACTION_HISTORY_ALL", "AR_TRANSACTION_HISTORY_ALL / AR_CASH_RECEIPTS_ALL", "OEDMF 26D 公式テーブルのみ使用"),
        ("主要支払・受取方法", "IBY: BILLS_PAYABLE (FUTURE_DATED_PMT_FLAG=Y)", "AR_RECEIPT_METHODS: DENSAI_BR_STANDARD", "DENSAI_BR_FACTORING & DENSAI_BR_ENDORSEMENT", "実運用標準の設定パターン"),
        ("ステータス遷移", "ISSUED → CLEARED (PAYMENT CREATED → PAYMENT MATURITY)", "PENDING_REMITTANCE → REMITTED → CLOSED (MATURITY_DATE)", "PENDING_REMITTANCE → FACTORED / ENDORSED → CLOSED (RISK_ELIMINATED)", "履歴テーブルのCURRENT_RECORD_FLAG管理"),
        ("決済金額内訳", "振出・満期引落: 1,873,700円", "受取・取立・満期入金: 1,873,700円", "BR-2A割引着金990,000+割引料7,900 / BR-2B裏書875,800", "合計 1,873,700円 完全一致"),
        ("SLA総発生仕訳額 (Dr=Cr)", 5927400, 8107400, 8107400, "05_SLA_GL仕訳・残高検証シートでSUM検算済"),
        ("期末 電子記録債務/債権 残高", 0, 0, 0, "全ケース決済・リスク消滅後に残高0円完結"),
    ]
    for c_row in comp_rows:
        for ci, v in enumerate(c_row):
            write_cell(ws, row, ci, v, fmt["td"], fmt["td_num"])
        row += 1


def write_case_sheet(wb, data, case_id, sheet_name, target_table_ids, fmt):
    ws = wb.add_worksheet(sheet_name)
    case_def = data["CASES"][case_id]
    states = data["TIMELINES"][case_id]
    final_state = states[-1]

    ws.write(0, 0, f"{case_def['title']} - 全ステップ＆テーブル状態詳細", fmt["title"])
    ws.write(1, 0, case_def["subtitle"], fmt["subtitle"])

    # Section 1: ステップ別解説タイムライン
    row = 3
    ws.write(row, 0, "1. プロセス進行ステップ一覧（S0〜S6）", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["Step", "処理日", "フェーズコード", "ステップタイトル", "プロセス解説・業務内容と使用テーブル"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    for idx, st_def in enumerate(case_def["steps"]):
        ws.write(row, 0, st_def["id"], fmt["td"])
        ws.write(row, 1, st_def["date"], fmt["td"])
        ws.write(row, 2, st_def["badge"], fmt["td"])
        ws.write(row, 3, st_def["title"], fmt["td"])
        ws.write(row, 4, st_def["desc"], fmt["td"])
        row += 1
    row += 1

    # Section 2: トランザクション・SLA・GL 各テーブル最終データ（更新セル黄色 + コメント付）
    max_widths = {0: 14, 1: 18, 2: 20, 3: 24, 4: 44}
    for tid in target_table_ids:
        tbl_meta = data["TABLES"][tid]
        rows = final_state.get(tid, [])
        ins_steps, upd_hist = compute_final_diff_history(tbl_meta, states)

        ws.write(row, 0, f"テーブル: {tbl_meta['name']} ({tbl_meta['jpName']}) | {len(rows)}件", fmt["tbl_hdr"])
        cols = list(rows[0].keys()) if rows else [c["name"] for c in tbl_meta["keyCols"]]
        for ci in range(1, max(2, len(cols) + 1)):
            ws.write(row, ci, "", fmt["tbl_hdr"])
        row += 1

        ws.write(row, 0, "行状態", fmt["th"])
        for ci, col_name in enumerate(cols, start=1):
            ws.write(row, ci, col_name, fmt["th"])
            max_widths[ci] = max(max_widths.get(ci, 12), min(36, len(col_name) + 4))
        row += 1

        if not rows:
            ws.write(row, 0, "EMPTY", fmt["td"])
            ws.write(row, 1, "（このケースでは該当レコードなし）", fmt["subtitle"])
            row += 2
            continue

        for idx, r_data in enumerate(rows):
            rk = row_key(tbl_meta, r_data, idx)
            upds = upd_hist.get(rk, {})
            ins_s = ins_steps.get(rk, 0)
            st_lbl = f"UPDATE ({len(upds)}列)" if upds else (f"INSERT (S{ins_s})" if ins_s > 0 else "マスタ/初期")
            ws.write(row, 0, st_lbl, fmt["td_upd"] if upds else (fmt["td_new"] if ins_s > 0 else fmt["td"]))

            for ci, col_name in enumerate(cols, start=1):
                val = r_data.get(col_name)
                hist_list = upds.get(col_name)
                if hist_list:
                    cmt_lines = [f"S{s}: {ov} → {nv}" for (s, ov, nv) in hist_list]
                    write_cell(ws, row, ci, val, fmt["td_upd"], fmt["td_upd_num"], "\n".join(cmt_lines))
                elif ins_s > 0:
                    write_cell(ws, row, ci, val, fmt["td_new"], fmt["td_new_num"])
                else:
                    write_cell(ws, row, ci, val, fmt["td"], fmt["td_num"])
                max_widths[ci] = max(max_widths.get(ci, 12), min(38, len(str(val or "")) + 3))
            row += 1
        row += 1

    for ci, w in max_widths.items():
        ws.set_column(ci, ci, w)


def write_master_sheet(wb, data, fmt):
    ws = wb.add_worksheet("04_共通マスタ・AFF定義")
    ws.write(0, 0, "Oracle Fusion Financials 26D 共通マスタ & AFF 9セグメント体系・CCID定義", fmt["title"])

    row = 2
    ws.write(row, 0, "1. AFF 9セグメント体系定義 (FND_KF_STR_INSTANCES_B)", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["順序", "物理カラム", "セグメント名", "設定例", "説明"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    for seg in data["AFF_SEGMENTS"]:
        ws.write_number(row, 0, seg["idx"], fmt["td_num"])
        ws.write(row, 1, seg["col"], fmt["td"])
        ws.write(row, 2, seg["name"], fmt["td"])
        ws.write(row, 3, seg["codeExample"], fmt["td"])
        ws.write(row, 4, seg["desc"], fmt["td"])
        row += 1
    row += 1

    # All master tables from S0
    s0_state = data["TIMELINES"]["AP_DENSAI"][0]
    master_ids = [
        tid for tid, tm in data["TABLES"].items()
        if tm["domain"] in ("ORG_GL_MASTER", "PARTNER_MASTER", "TXN_DENSAI_MASTER")
    ]
    for tid in master_ids:
        tm = data["TABLES"][tid]
        rows = s0_state.get(tid, [])
        if not rows:
            continue
        cols = list(rows[0].keys())
        ws.write(row, 0, f"{tm['name']} ({tm['jpName']})", fmt["tbl_hdr"])
        for ci in range(1, len(cols)):
            ws.write(row, ci, "", fmt["tbl_hdr"])
        row += 1
        for ci, c_name in enumerate(cols):
            ws.write(row, ci, c_name, fmt["th"])
        row += 1
        for r_data in rows:
            for ci, c_name in enumerate(cols):
                write_cell(ws, row, ci, r_data.get(c_name), fmt["td"], fmt["td_num"])
            row += 1
        row += 1

    ws.set_column(0, 0, 24)
    ws.set_column(1, 1, 38)
    ws.set_column(2, 2, 34)
    ws.set_column(3, 4, 30)


def write_sla_gl_verification_sheet(wb, data, fmt):
    ws = wb.add_worksheet("05_SLA_GL仕訳・残高検証")
    ws.write(0, 0, "全3ケース SLA (XLA_AE_LINES) / GL (GL_JE_LINES) / 期末残高 (GL_BALANCES) 自動検証シート", fmt["title"])
    ws.set_column(0, 0, 14)
    ws.set_column(1, 1, 36)
    ws.set_column(2, 2, 30)
    ws.set_column(3, 5, 16)
    ws.set_column(6, 6, 36)

    row = 2
    for cid in ("AP_DENSAI", "AR_DENSAI", "AR_DISCOUNT"):
        cdef = data["CASES"][cid]
        final_st = data["TIMELINES"][cid][-1]
        je_lines = final_st["GL_JE_LINES"]
        bals = final_st["GL_BALANCES"]

        ws.write(row, 0, f"■ {cdef['title']} - GL仕訳明細 (GL_JE_LINES)", fmt["sec_hdr"])
        for c in range(1, 7):
            ws.write(row, c, "", fmt["sec_hdr"])
        row += 1
        for ci, h in enumerate(["JE_HEADER_ID", "9セグメントAFF文字列", "勘定科目名", "借方 (JPY)", "貸方 (JPY)", "期間", "摘要"]):
            ws.write(row, ci, h, fmt["th"])
        row += 1
        start_r = row + 1
        for jl in je_lines:
            ws.write_number(row, 0, jl["JE_HEADER_ID"], fmt["td_num"])
            ws.write(row, 1, jl["SEGMENT_CONCAT"], fmt["td"])
            ws.write(row, 2, jl["ACCOUNT_NAME"], fmt["td"])
            ws.write_number(row, 3, jl["ACCOUNTED_DR"], fmt["td_num"])
            ws.write_number(row, 4, jl["ACCOUNTED_CR"], fmt["td_num"])
            ws.write(row, 5, jl["PERIOD_NAME"], fmt["td"])
            ws.write(row, 6, jl["DESCRIPTION"], fmt["td"])
            row += 1
        end_r = row
        ws.write(row, 0, "仕訳合計", fmt["sum_lbl"])
        ws.write(row, 1, f"{len(je_lines)}行 自動集計", fmt["sum_lbl"])
        ws.write(row, 2, "貸借一致判定:", fmt["sum_lbl"])
        ws.write_formula(row, 3, f"=SUM(D{start_r}:D{end_r})", fmt["sum_num"])
        ws.write_formula(row, 4, f"=SUM(E{start_r}:E{end_r})", fmt["sum_num"])
        ws.write_formula(row, 5, f'=IF(D{row+1}=E{row+1},"PASS (差額0)","NG")', fmt["ok_cell"])
        ws.write_formula(row, 6, f"=D{row+1}-E{row+1}", fmt["sum_num"])
        row += 2

        # GL_BALANCES
        ws.write(row, 0, f"□ {cdef['shortTitle']} 期末勘定残高 (GL_BALANCES)", fmt["tbl_hdr"])
        for c in range(1, 6):
            ws.write(row, c, "", fmt["tbl_hdr"])
        row += 1
        for ci, h in enumerate(["CCID", "9セグメントAFF文字列", "勘定科目名", "借方累計", "貸方累計", "期末残高"]):
            ws.write(row, ci, h, fmt["th"])
        row += 1
        b_start = row + 1
        for b in bals:
            ws.write_number(row, 0, b["CODE_COMBINATION_ID"], fmt["td_num"])
            ws.write(row, 1, b["SEGMENT_CONCAT"], fmt["td"])
            ws.write(row, 2, b["ACCOUNT_NAME"], fmt["td"])
            ws.write_number(row, 3, b["PERIOD_NET_DR"], fmt["td_num"])
            ws.write_number(row, 4, b["PERIOD_NET_CR"], fmt["td_num"])
            ws.write_formula(row, 5, f"=D{row+1}-E{row+1}", fmt["ok_cell"] if b["END_BALANCE"] == 0 else fmt["td_num"])
            row += 1
        b_end = row
        ws.write(row, 0, "残高合計", fmt["sum_lbl"])
        ws.write(row, 1, "純資産/損益ネット検証", fmt["sum_lbl"])
        ws.write(row, 2, "債権債務残ゼロ＆試算表一致", fmt["sum_lbl"])
        ws.write_formula(row, 3, f"=SUM(D{b_start}:D{b_end})", fmt["sum_num"])
        ws.write_formula(row, 4, f"=SUM(E{b_start}:E{b_end})", fmt["sum_num"])
        ws.write_formula(row, 5, f"=SUM(F{b_start}:F{b_end})", fmt["ok_cell"])
        row += 3


def write_er_sheet(wb, data, fmt):
    ws = wb.add_worksheet("06_OEDMF56表・ER結合関係")
    ws.write(0, 0, "Oracle Fusion ERP Financials 26D (OEDMF) 全56テーブル一覧 & 53結合関係", fmt["title"])
    ws.set_column(0, 0, 32)
    ws.set_column(1, 2, 28)
    ws.set_column(3, 4, 42)

    row = 2
    ws.write(row, 0, "1. 網羅テーブル一覧（全56テーブル）", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["物理テーブル名", "和名", "ドメイン", "主キー (PK)", "説明"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    for tbl in data["TABLES"].values():
        ws.write(row, 0, tbl["name"], fmt["td"])
        ws.write(row, 1, tbl["jpName"], fmt["td"])
        ws.write(row, 2, data["DOMAINS"][tbl["domain"]]["label"], fmt["td"])
        ws.write(row, 3, tbl["pk"], fmt["td"])
        ws.write(row, 4, tbl["desc"], fmt["td"])
        row += 1

    row += 1
    ws.write(row, 0, f"2. テーブル結合関係一覧（{len(data['RELATIONS'])}本）", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["ID", "元テーブル (From)", "先テーブル (To)", "結合キー・遷移内容", "適用ケース"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    for rel in data["RELATIONS"]:
        ws.write(row, 0, rel["id"], fmt["td"])
        ws.write(row, 1, rel["from"], fmt["td"])
        ws.write(row, 2, rel["to"], fmt["td"])
        ws.write(row, 3, rel["label"], fmt["td"])
        ws.write(row, 4, ", ".join(rel["cases"]), fmt["td"])
        row += 1


def main():
    data = load_data_from_node()
    wb = xlsxwriter.Workbook(OUT_XLSX_PATH)
    fmt = make_formats(wb)

    write_summary_sheet(wb, data, fmt)

    ap_tables = [
        "AP_INVOICES_ALL", "AP_INVOICE_LINES_ALL", "ZX_LINES", "AP_INVOICE_DISTRIBUTIONS_ALL",
        "AP_PAYMENT_SCHEDULES_ALL", "IBY_DOCS_PAYABLE_ALL", "IBY_PAYMENTS_ALL",
        "AP_CHECKS_ALL", "AP_INVOICE_PAYMENTS_ALL", "AP_PAYMENT_HISTORY_ALL",
        "XLA_TRANSACTION_ENTITIES", "XLA_EVENTS", "XLA_AE_HEADERS", "XLA_AE_LINES", "XLA_DISTRIBUTION_LINKS",
        "GL_INTERFACE", "GL_JE_BATCHES", "GL_JE_HEADERS", "GL_JE_LINES", "GL_IMPORT_REFERENCES", "GL_BALANCES"
    ]
    ar_tables = [
        "RA_CUSTOMER_TRX_ALL", "RA_CUSTOMER_TRX_LINES_ALL", "ZX_LINES", "RA_CUST_TRX_LINE_GL_DIST_ALL",
        "AR_PAYMENT_SCHEDULES_ALL", "AR_BATCHES_ALL", "AR_TRANSACTION_HISTORY_ALL", "AR_ADJUSTMENTS_ALL",
        "AR_CASH_RECEIPTS_ALL", "AR_CASH_RECEIPT_HISTORY_ALL", "AR_RECEIVABLE_APPLICATIONS_ALL", "AR_DISTRIBUTIONS_ALL",
        "XLA_TRANSACTION_ENTITIES", "XLA_EVENTS", "XLA_AE_HEADERS", "XLA_AE_LINES", "XLA_DISTRIBUTION_LINKS",
        "GL_INTERFACE", "GL_JE_BATCHES", "GL_JE_HEADERS", "GL_JE_LINES", "GL_IMPORT_REFERENCES", "GL_BALANCES"
    ]
    disc_tables = [
        "RA_CUSTOMER_TRX_ALL", "RA_CUSTOMER_TRX_LINES_ALL", "ZX_LINES", "RA_CUST_TRX_LINE_GL_DIST_ALL",
        "AR_PAYMENT_SCHEDULES_ALL", "AR_BATCHES_ALL", "AR_TRANSACTION_HISTORY_ALL", "AR_ADJUSTMENTS_ALL",
        "AP_INVOICES_ALL", "AR_CASH_RECEIPTS_ALL", "AR_CASH_RECEIPT_HISTORY_ALL",
        "AR_RECEIVABLE_APPLICATIONS_ALL", "AR_DISTRIBUTIONS_ALL",
        "XLA_TRANSACTION_ENTITIES", "XLA_EVENTS", "XLA_AE_HEADERS", "XLA_AE_LINES", "XLA_DISTRIBUTION_LINKS",
        "GL_INTERFACE", "GL_JE_BATCHES", "GL_JE_HEADERS", "GL_JE_LINES", "GL_IMPORT_REFERENCES", "GL_BALANCES"
    ]

    write_case_sheet(wb, data, "AP_DENSAI", "01_AP電子記録債務_全データ", ap_tables, fmt)
    write_case_sheet(wb, data, "AR_DENSAI", "02_AR電子記録債権_満期決済", ar_tables, fmt)
    write_case_sheet(wb, data, "AR_DISCOUNT", "03_AR電子記録債権_割引譲渡", disc_tables, fmt)
    write_master_sheet(wb, data, fmt)
    write_sla_gl_verification_sheet(wb, data, fmt)
    write_er_sheet(wb, data, fmt)

    wb.close()
    print(f"Generated Excel successfully: {OUT_XLSX_PATH}")


if __name__ == "__main__":
    main()
