#!/usr/bin/env python3
"""
Oracle Fusion ERP Financials 26D (OEDMF準拠)
リース会計（LA）登録・修正・中途解約・収益(AR)＆AP連携 Excelブック生成スクリプト
"""

import json
import os
import subprocess
import xlsxwriter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS_PATH = os.path.join(SCRIPT_DIR, "data.js")
OUT_XLSX_PATH = os.path.join(SCRIPT_DIR, "FusionERP_26D_LA_DataFlow.xlsx")


def load_data_from_node():
    node_code = f"""
const data = require({json.dumps(DATA_JS_PATH)});
const out = {{
  AFF_SEGMENTS: data.AFF_SEGMENTS,
  CCID_LIST: data.CCID_LIST,
  LA_PROCESS_GUIDE: data.LA_PROCESS_GUIDE,
  DOMAINS: data.DOMAINS,
  TABLES: data.TABLES,
  RELATIONS: data.RELATIONS,
  CASES: data.CASES,
  TIMELINES: {{}}
}};
for (const cid of Object.keys(data.CASES)) {{
  out.TIMELINES[cid] = [];
  for (let s = 0; s < data.CASES[cid].steps.length; s++) {{
    out.TIMELINES[cid].push(data.computeStateAtStep(cid, s).state);
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
    updates_by_rk = {}
    inserted_step_by_rk = {}
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
                        updates_by_rk.setdefault(rk, {}).setdefault(col, []).append((s_idx, old_v, new_v))
        prev_map = curr_map
    return inserted_step_by_rk, updates_by_rk


def make_formats(wb):
    f = "Meiryo UI"
    return {
        "title": wb.add_format({"bold": True, "font_size": 14, "font_color": "#0F172A", "font_name": f}),
        "subtitle": wb.add_format({"font_size": 10, "font_color": "#475569", "font_name": f}),
        "sec_hdr": wb.add_format({"bold": True, "font_size": 11, "bg_color": "#0F172A", "font_color": "#FFFFFF", "border": 1, "font_name": f}),
        "tbl_hdr": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#4C1D95", "font_color": "#FFFFFF", "border": 1, "font_name": f}),
        "th": wb.add_format({"bold": True, "font_size": 9.5, "bg_color": "#E2E8F0", "font_color": "#0F172A", "border": 1, "align": "center", "valign": "vcenter", "font_name": f}),
        "td": wb.add_format({"font_size": 9.5, "border": 1, "valign": "vcenter", "font_name": f}),
        "td_wrap": wb.add_format({"font_size": 9.5, "border": 1, "valign": "vcenter", "text_wrap": True, "font_name": f}),
        "td_num": wb.add_format({"font_size": 9.5, "border": 1, "num_format": "#,##0;-#,##0;0", "align": "right", "valign": "vcenter", "font_name": f}),
        "td_new": wb.add_format({"font_size": 9.5, "border": 1, "bg_color": "#DCFCE7", "valign": "vcenter", "font_name": f}),
        "td_new_num": wb.add_format({"font_size": 9.5, "border": 1, "bg_color": "#DCFCE7", "num_format": "#,##0;-#,##0;0", "align": "right", "valign": "vcenter", "font_name": f}),
        "td_upd": wb.add_format({"font_size": 9.5, "border": 1, "bg_color": "#FEF08A", "bold": True, "font_color": "#9A3412", "valign": "vcenter", "font_name": f}),
        "td_upd_num": wb.add_format({"font_size": 9.5, "border": 1, "bg_color": "#FEF08A", "bold": True, "font_color": "#9A3412", "num_format": "#,##0;-#,##0;0", "align": "right", "valign": "vcenter", "font_name": f}),
        "sum_lbl": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#DBEAFE", "border": 1, "font_name": f}),
        "sum_num": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#DBEAFE", "border": 1, "num_format": "#,##0;-#,##0;0", "align": "right", "font_name": f}),
        "ok_cell": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#DCFCE7", "font_color": "#14532D", "border": 1, "align": "center", "num_format": "#,##0;-#,##0;0", "font_name": f}),
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
        ws.write_comment(r, c, comment, {"width": 270, "height": 75})


def write_summary_sheet(wb, data, fmt):
    ws = wb.add_worksheet("00_業務解説・4ケース比較サマリ")
    ws.set_column(0, 0, 26)
    ws.set_column(1, 2, 34)
    ws.set_column(3, 4, 28)

    ws.write(0, 0, "Oracle Fusion ERP Financials 26D (OEDMF準拠) リース会計（LA）業務プロセス解説 ＆ 総合サマリ", fmt["title"])
    ws.write(1, 0, "対象: 借手新規登録・AP連携・償却 / 契約修正・再測定 / 中途解約・違約金AP / 収益リース(サブリース)・AR連携", fmt["subtitle"])

    # Section 1: 業務プロセス入門ガイド
    row = 3
    ws.write(row, 0, "1. リース会計（IFRS16 / ASC842 / 新リース会計基準）6大業務プロセス詳細解説", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["プロセス", "フェーズ区分", "業務内容・何を行うか（解説）", "代表テーブル", "サンプル数値・処理例"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    for g in data["LA_PROCESS_GUIDE"]:
        ws.write(row, 0, g["title"], fmt["td"])
        ws.write(row, 1, g["badge"], fmt["td"])
        ws.write(row, 2, g["meaning"], fmt["td_wrap"])
        ws.write(row, 3, g["tables"], fmt["td_wrap"])
        ws.write(row, 4, g["example"], fmt["td_wrap"])
        row += 1
    row += 1

    # Section 2: 数値計算検算表 (行番号に合わせて式を動的に組む)
    ws.write(row, 0, "2. リース会計 主要計算数値・検算表（現在価値・償却・利息・再計算・解約損益）", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["シナリオ区分", "計算式ロジック", "基準額 / ROU", "利息 / AP税等", "算出結果 (数式検証)"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1

    r1 = row + 1  # Excel 1-based row
    ws.write(row, 0, "Case1 初月ROU償却 (24ヶ月定額)", fmt["td"])
    ws.write(row, 1, "ROU PV 2,400,000 ÷ 24ヶ月", fmt["td"])
    ws.write_number(row, 2, 2400000, fmt["td_num"])
    ws.write_number(row, 3, 24, fmt["td_num"])
    ws.write_formula(row, 4, f"=C{r1}/D{r1}", fmt["ok_cell"])  # 100,000
    row += 1

    r2 = row + 1
    ws.write(row, 0, "Case1 初月支払利息 (2.5%)", fmt["td"])
    ws.write(row, 1, "期首負債 2,400,000 × 年率2.5% ÷ 12", fmt["td"])
    ws.write_number(row, 2, 2400000, fmt["td_num"])
    ws.write_number(row, 3, 0.025, fmt["td_num"])
    ws.write_formula(row, 4, f"=C{r2}*D{r2}/12", fmt["ok_cell"])  # 5,000
    row += 1

    r3 = row + 1
    ws.write(row, 0, "Case2 改定後 月額ROU償却", fmt["td"])
    ws.write(row, 1, "(期首残1,200,000 + 再測定増1,650,000) ÷ 残24ヶ月", fmt["td"])
    ws.write_number(row, 2, 1200000, fmt["td_num"])
    ws.write_number(row, 3, 1650000, fmt["td_num"])
    ws.write_formula(row, 4, f"=(C{r3}+D{r3})/24", fmt["ok_cell"])  # 118,750
    row += 1

    r4 = row + 1
    ws.write(row, 0, "Case2 改定後 初月支払利息 (3.0%)", fmt["td"])
    ws.write(row, 1, "新負債PV 2,880,000 × 年率3.0% ÷ 12", fmt["td"])
    ws.write_number(row, 2, 2880000, fmt["td_num"])
    ws.write_number(row, 3, 0.03, fmt["td_num"])
    ws.write_formula(row, 4, f"=C{r4}*D{r4}/12", fmt["ok_cell"])  # 7,200
    row += 1

    r5 = row + 1
    ws.write(row, 0, "Case3 中途解約損益", fmt["td"])
    ws.write(row, 1, "消滅負債(620,000) - ROU簿価(600,000) - 違約金(80,000)", fmt["td"])
    ws.write_number(row, 2, 620000, fmt["td_num"])
    ws.write_number(row, 3, 680000, fmt["td_num"])  # 600k + 80k
    ws.write_formula(row, 4, f"=C{r5}-D{r5}", fmt["sum_num"])  # -60,000 (損)
    row += 1

    r6 = row + 1
    ws.write(row, 0, "Case4 サブリースAR請求(税込)", fmt["td"])
    ws.write(row, 1, "月額転貸料 200,000 + 消費税10% (20,000)", fmt["td"])
    ws.write_number(row, 2, 200000, fmt["td_num"])
    ws.write_formula(row, 3, f"=C{r6}*0.10", fmt["td_num"])
    ws.write_formula(row, 4, f"=C{r6}+D{r6}", fmt["ok_cell"])  # 220,000
    row += 2

    # Section 3: 4ケース比較表
    ws.write(row, 0, "3. リース会計 4取引ケース対比サマリ", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["比較項目", "Case 1: 借手登録・AP・償却", "Case 2: 契約修正・再計算", "Case 3: 中途解約・廃止", "Case 4: 収益リース・AR連携"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    comp = [
        ("契約番号 / タイプ", "LA-2026-001 (EXPENSE)", "LA-2026-001 (Ver2修正)", "LA-2026-001 (TERMINATED)", "LA-REV-2026-101 (REVENUE)"),
        ("ERP連携モジュール", "AP (AP-LA-202604: 115,500円)", "AP (AP-LA-202704: 143,000円)", "AP (AP-LA-TERM-003: 88,000円)", "AR (AR-LA-2026-001: 220,000円)"),
        ("LA主要イベント", "BOOKING / PAYMENT / ACCRUAL", "REVISION / PAYMENT / ACCRUAL", "LEASE_TERMINATION", "REVENUE_ACCRUAL"),
        ("SLA総発生仕訳 (Dr=Cr)", 2841000, 2191950, 2656000, 640000),
        ("期末クリアリング/債権債務残", "2390=0 / 2101=0", "2390=0 / 2101=0", "ROU=0 / 負債=0 / 2390=0", "2490=0 / 売掛1110=0"),
    ]
    for rdata in comp:
        for ci, v in enumerate(rdata):
            write_cell(ws, row, ci, v, fmt["td"], fmt["td_num"])
        row += 1


def write_case_sheet(wb, data, case_id, sheet_name, target_table_ids, fmt):
    ws = wb.add_worksheet(sheet_name)
    case_def = data["CASES"][case_id]
    states = data["TIMELINES"][case_id]
    final_state = states[-1]

    ws.write(0, 0, f"{case_def['title']} - ステップ ＆ テーブル詳細", fmt["title"])
    ws.write(1, 0, case_def["subtitle"], fmt["subtitle"])

    row = 3
    ws.write(row, 0, "1. 業務プロセス・ステップ詳細（S0〜最終）", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["Step", "処理日", "フェーズコード", "ステップ名", "業務内容・処理解説"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    for st_def in case_def["steps"]:
        ws.write(row, 0, st_def["id"], fmt["td"])
        ws.write(row, 1, st_def["date"], fmt["td"])
        ws.write(row, 2, st_def["badge"], fmt["td"])
        ws.write(row, 3, st_def["title"], fmt["td"])
        ws.write(row, 4, st_def["desc"], fmt["td"])
        row += 1
    row += 1

    max_widths = {0: 15, 1: 18, 2: 20, 3: 24, 4: 44}
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
        for ci, cname in enumerate(cols, start=1):
            ws.write(row, ci, cname, fmt["th"])
            max_widths[ci] = max(max_widths.get(ci, 12), min(36, len(cname) + 4))
        row += 1

        if not rows:
            ws.write(row, 0, "EMPTY", fmt["td"])
            ws.write(row, 1, "（このケースでは該当レコードなし）", fmt["subtitle"])
            row += 2
            continue

        for idx, rdata in enumerate(rows):
            rk = row_key(tbl_meta, rdata, idx)
            upds = upd_hist.get(rk, {})
            ins_s = ins_steps.get(rk, 0)
            st_lbl = f"UPDATE ({len(upds)}列)" if upds else (f"INSERT (S{ins_s})" if ins_s > 0 else "期首/初期")
            ws.write(row, 0, st_lbl, fmt["td_upd"] if upds else (fmt["td_new"] if ins_s > 0 else fmt["td"]))
            for ci, cname in enumerate(cols, start=1):
                val = rdata.get(cname)
                hlist = upds.get(cname)
                if hlist:
                    cmt = "\n".join([f"S{s}: {ov} → {nv}" for (s, ov, nv) in hlist])
                    write_cell(ws, row, ci, val, fmt["td_upd"], fmt["td_upd_num"], cmt)
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
    ws = wb.add_worksheet("05_共通・LA設定マスタ・AFF")
    ws.write(0, 0, "Oracle Fusion Financials 26D 共通・取引先・LA設定マスタ & AFF 9セグメント定義", fmt["title"])

    row = 2
    ws.write(row, 0, "1. AFF 9セグメント体系定義", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["順序", "物理カラム", "セグメント名", "サンプル", "役割"]):
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

    s0 = data["TIMELINES"]["LA_BOOK_AP_ACCRUAL"][0]
    master_ids = [
        tid for tid, tm in data["TABLES"].items()
        if tm["domain"] in ("ORG_GL_MASTER", "PARTNER_AP_AR_MASTER")
        or tid in ("FLA_SYSTEM_OPTIONS_ALL", "FLA_DISCOUNT_INDEXES_ALL", "FLA_DISCOUNT_INDEX_RATES_F", "FLA_PAYMENT_TEMPLATES_ALL")
    ]
    for tid in master_ids:
        tm = data["TABLES"][tid]
        rows = s0.get(tid, [])
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
        for rdata in rows:
            for ci, c_name in enumerate(cols):
                write_cell(ws, row, ci, rdata.get(c_name), fmt["td"], fmt["td_num"])
            row += 1
        row += 1

    ws.set_column(0, 0, 26)
    ws.set_column(1, 1, 38)
    ws.set_column(2, 2, 34)
    ws.set_column(3, 6, 24)


def write_sla_gl_verification_sheet(wb, data, fmt):
    ws = wb.add_worksheet("06_SLA_GL仕訳・残高検証")
    ws.write(0, 0, "全4ケース SLA (XLA) / GL仕訳明細 (GL_JE_LINES) / 勘定残高 (GL_BALANCES) 自動検証", fmt["title"])
    ws.set_column(0, 0, 14)
    ws.set_column(1, 1, 36)
    ws.set_column(2, 2, 32)
    ws.set_column(3, 6, 16)
    ws.set_column(7, 7, 34)

    row = 2
    for cid in ("LA_BOOK_AP_ACCRUAL", "LA_REVISION", "LA_TERMINATION", "LA_REVENUE_AR"):
        cdef = data["CASES"][cid]
        final_st = data["TIMELINES"][cid][-1]
        je_lines = final_st["GL_JE_LINES"]
        bals = final_st["GL_BALANCES"]

        ws.write(row, 0, f"■ {cdef['title']} - GL仕訳明細", fmt["sec_hdr"])
        for c in range(1, 7):
            ws.write(row, c, "", fmt["sec_hdr"])
        row += 1
        for ci, h in enumerate(["JE_HEADER_ID", "9セグメントAFF文字列", "勘定科目名", "借方 (JPY)", "貸方 (JPY)", "期間", "摘要"]):
            ws.write(row, ci, h, fmt["th"])
        row += 1
        s_r = row + 1
        for jl in je_lines:
            ws.write_number(row, 0, jl["JE_HEADER_ID"], fmt["td_num"])
            ws.write(row, 1, jl["SEGMENT_CONCAT"], fmt["td"])
            ws.write(row, 2, jl["ACCOUNT_NAME"], fmt["td"])
            ws.write_number(row, 3, jl["ACCOUNTED_DR"], fmt["td_num"])
            ws.write_number(row, 4, jl["ACCOUNTED_CR"], fmt["td_num"])
            ws.write(row, 5, jl["PERIOD_NAME"], fmt["td"])
            ws.write(row, 6, jl["DESCRIPTION"], fmt["td"])
            row += 1
        e_r = row
        ws.write(row, 0, "当期仕訳合計", fmt["sum_lbl"])
        ws.write(row, 1, f"{len(je_lines)}行 自動集計", fmt["sum_lbl"])
        ws.write(row, 2, "貸借一致判定:", fmt["sum_lbl"])
        ws.write_formula(row, 3, f"=SUM(D{s_r}:D{e_r})", fmt["sum_num"])
        ws.write_formula(row, 4, f"=SUM(E{s_r}:E{e_r})", fmt["sum_num"])
        ws.write_formula(row, 5, f'=IF(D{row+1}=E{row+1},"PASS (差額0)","NG")', fmt["ok_cell"])
        ws.write_formula(row, 6, f"=D{row+1}-E{row+1}", fmt["sum_num"])
        row += 2

        ws.write(row, 0, f"□ {cdef['shortTitle']} 勘定残高検証 (GL_BALANCES: 期首 + 当期 = 期末)", fmt["tbl_hdr"])
        for c in range(1, 7):
            ws.write(row, c, "", fmt["tbl_hdr"])
        row += 1
        for ci, h in enumerate(["CCID", "9セグメントAFF文字列", "勘定科目名", "期首残(Dr-Cr)", "当期借方", "当期貸方", "期末残高"]):
            ws.write(row, ci, h, fmt["th"])
        row += 1
        b_s = row + 1
        for b in bals:
            beg = b["BEGIN_BALANCE_DR"] - b["BEGIN_BALANCE_CR"]
            ws.write_number(row, 0, b["CODE_COMBINATION_ID"], fmt["td_num"])
            ws.write(row, 1, b["SEGMENT_CONCAT"], fmt["td"])
            ws.write(row, 2, b["ACCOUNT_NAME"], fmt["td"])
            ws.write_number(row, 3, beg, fmt["td_num"])
            ws.write_number(row, 4, b["PERIOD_NET_DR"], fmt["td_num"])
            ws.write_number(row, 5, b["PERIOD_NET_CR"], fmt["td_num"])
            ws.write_formula(row, 6, f"=D{row+1}+E{row+1}-F{row+1}", fmt["ok_cell"] if b["END_BALANCE"] == 0 else fmt["td_num"])
            row += 1
        b_e = row
        ws.write(row, 0, "残高検算合計", fmt["sum_lbl"])
        ws.write(row, 1, "試算表貸借ネット", fmt["sum_lbl"])
        ws.write(row, 2, "すべて0円一致", fmt["sum_lbl"])
        ws.write_formula(row, 3, f"=SUM(D{b_s}:D{b_e})", fmt["sum_num"])
        ws.write_formula(row, 4, f"=SUM(E{b_s}:E{b_e})", fmt["sum_num"])
        ws.write_formula(row, 5, f"=SUM(F{b_s}:F{b_e})", fmt["sum_num"])
        ws.write_formula(row, 6, f"=SUM(G{b_s}:G{b_e})", fmt["ok_cell"])
        row += 3


def write_er_sheet(wb, data, fmt):
    ws = wb.add_worksheet("07_OEDMF63表・ER結合関係")
    ws.write(0, 0, "Oracle Fusion ERP Financials 26D (OEDMF) リース会計 全63テーブル ＆ 結合関係", fmt["title"])
    ws.set_column(0, 0, 32)
    ws.set_column(1, 2, 30)
    ws.set_column(3, 4, 44)

    row = 2
    ws.write(row, 0, "1. 網羅テーブル一覧（全63テーブル）", fmt["sec_hdr"])
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
    ws.write(row, 0, f"2. テーブル間リレーション一覧（{len(data['RELATIONS'])}本）", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["ID", "元テーブル (From)", "先テーブル (To)", "結合キー・遷移", "適用ケース"]):
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

    la_core = [
        "FLA_LEASES_ALL", "FLA_LEASE_DETAILS", "FLA_LEASE_ASSETS",
        "FLA_LEASE_PAYMENT_HEADERS", "FLA_LEASE_PAYMENT_LINES", "FLA_LEASE_PAYMENT_ACCOUNTS",
        "FLA_SCHEDULE_HEADERS", "FLA_LIABILITY_SCHEDULES", "FLA_ACCRUAL_SCHEDULES",
        "FLA_PAYMENT_ITEMS", "FLA_LEASE_BALANCES_ALL",
        "FLA_ACCOUNTING_HEADERS_ALL", "FLA_ACCOUNTING_LINES"
    ]
    ap_txns = [
        "AP_INVOICES_INTERFACE", "AP_INVOICES_ALL", "AP_INVOICE_LINES_ALL", "ZX_LINES",
        "AP_INVOICE_DISTRIBUTIONS_ALL", "AP_PAYMENT_SCHEDULES_ALL", "AP_CHECKS_ALL",
        "AP_INVOICE_PAYMENTS_ALL", "AP_PAYMENT_HISTORY_ALL"
    ]
    ar_txns = [
        "RA_INTERFACE_LINES_ALL", "RA_CUSTOMER_TRX_ALL", "RA_CUSTOMER_TRX_LINES_ALL", "ZX_LINES",
        "RA_CUST_TRX_LINE_GL_DIST_ALL", "AR_PAYMENT_SCHEDULES_ALL", "AR_CASH_RECEIPTS_ALL",
        "AR_CASH_RECEIPT_HISTORY_ALL", "AR_RECEIVABLE_APPLICATIONS_ALL", "AR_DISTRIBUTIONS_ALL"
    ]
    sla_gl = [
        "XLA_TRANSACTION_ENTITIES", "XLA_EVENTS", "XLA_AE_HEADERS", "XLA_AE_LINES", "XLA_DISTRIBUTION_LINKS",
        "GL_INTERFACE", "GL_JE_BATCHES", "GL_JE_HEADERS", "GL_JE_LINES", "GL_IMPORT_REFERENCES", "GL_BALANCES"
    ]

    write_case_sheet(wb, data, "LA_BOOK_AP_ACCRUAL", "01_借手登録・AP連携・償却", la_core + ap_txns + sla_gl, fmt)
    write_case_sheet(wb, data, "LA_REVISION", "02_契約修正・再測定・償却", la_core + ap_txns + sla_gl, fmt)
    write_case_sheet(wb, data, "LA_TERMINATION", "03_中途解約・違約金・損益", la_core + ap_txns + sla_gl, fmt)
    write_case_sheet(wb, data, "LA_REVENUE_AR", "04_収益リース・AR請求連携", la_core + ar_txns + sla_gl, fmt)
    write_master_sheet(wb, data, fmt)
    write_sla_gl_verification_sheet(wb, data, fmt)
    write_er_sheet(wb, data, fmt)

    wb.close()
    print(f"Generated Excel successfully: {OUT_XLSX_PATH}")


if __name__ == "__main__":
    main()
