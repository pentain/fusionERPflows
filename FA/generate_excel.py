#!/usr/bin/env python3
"""
Oracle Fusion ERP Financials 26D (OEDMF準拠)
固定資産（FA）AP連携・登録・修正・廃止・減価償却 Excelブック生成スクリプト
"""

import json
import os
import subprocess
import xlsxwriter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS_PATH = os.path.join(SCRIPT_DIR, "data.js")
OUT_XLSX_PATH = os.path.join(SCRIPT_DIR, "FusionERP_26D_FA_DataFlow.xlsx")


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
        "tbl_hdr": wb.add_format({"bold": True, "font_size": 10, "bg_color": "#1E3A8A", "font_color": "#FFFFFF", "border": 1, "font_name": f}),
        "th": wb.add_format({"bold": True, "font_size": 9.5, "bg_color": "#E2E8F0", "font_color": "#0F172A", "border": 1, "align": "center", "valign": "vcenter", "font_name": f}),
        "td": wb.add_format({"font_size": 9.5, "border": 1, "valign": "vcenter", "font_name": f}),
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
    ws = wb.add_worksheet("00_全体サマリ・3ケース比較")
    ws.set_column(0, 0, 28)
    ws.set_column(1, 3, 30)
    ws.set_column(4, 4, 28)

    ws.write(0, 0, "Oracle Fusion ERP Financials 26D (OEDMF準拠) 固定資産（FA）データフロー総合サマリ", fmt["title"])
    ws.write(1, 0, "収録シナリオ: Case1 AP連携・資産登録・減価償却 / Case2 資産修正・部門移動・再計算償却 / Case3 資産廃止(除却売却)・損益計算", fmt["subtitle"])

    ws.write(3, 0, "色分け・変更履歴凡例", fmt["sec_hdr"])
    ws.write(3, 1, "薄緑セル: 新規登録レコード (INSERT)", fmt["td_new"])
    ws.write(3, 2, "黄色太字セル: プロセス途上で値が更新された項目 (UPDATE＋履歴コメント)", fmt["td_upd"])

    # Section 1: 数値検算表
    row = 5
    ws.write(row, 0, "1. 固定資産ライフサイクル 数値モデル検算表（AST-2026-0001 / STL 60ヶ月）", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["フェーズ", "計算根拠・項目", "金額 / 原価", "減価償却・増減", "判定 / 算出結果 (数式)"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1

    # Row 7 (index 6)
    ws.write(row, 0, "Case1 取得（本体）", fmt["td"])
    ws.write(row, 1, "AP-FA-2026-001 明細1（税抜）", fmt["td"])
    ws.write_number(row, 2, 1200000, fmt["td_num"])
    ws.write_number(row, 3, 0, fmt["td_num"])
    ws.write_formula(row, 4, "=C7*0.10", fmt["td_num"])  # 消費税 120,000
    row += 1
    # Row 8 (index 7)
    ws.write(row, 0, "Case1 取得（据付付帯費）", fmt["td"])
    ws.write(row, 1, "AP-FA-2026-001 明細2（マージ元）", fmt["td"])
    ws.write_number(row, 2, 300000, fmt["td_num"])
    ws.write_number(row, 3, 0, fmt["td_num"])
    ws.write_formula(row, 4, "=C8*0.10", fmt["td_num"])  # 消費税 30,000
    row += 1
    # Row 9 (index 8)
    ws.write(row, 0, "Case1 合計・初月償却費", fmt["sum_lbl"])
    ws.write(row, 1, "取得原価 (150万) ÷ 60ヶ月 STL", fmt["sum_lbl"])
    ws.write_formula(row, 2, "=SUM(C7:C8)", fmt["sum_num"])
    ws.write_formula(row, 3, "=C9/60", fmt["sum_num"])
    ws.write_formula(row, 4, "=C9-D9", fmt["ok_cell"])  # 初月末NBV 1,475,000
    row += 1
    # Row 10 (index 9)
    ws.write(row, 0, "Case2 資本的支出・移動後", fmt["td"])
    ws.write(row, 1, "12ヶ月後(累計30万)へ+24万加算 / 残48ヶ月", fmt["td"])
    ws.write_number(row, 2, 240000, fmt["td_num"])
    ws.write_number(row, 3, 300000, fmt["td_num"])
    ws.write_formula(row, 4, "=(C9+C10-D10)/48", fmt["ok_cell"])  # 新月額償却 30,000
    row += 1
    # Row 11 (index 10)
    ws.write(row, 0, "Case3 売却・除却損益計算", fmt["td"])
    ws.write(row, 1, "NBV 60万(150万-累計90万) / 売却20万 / 撤去AP5万", fmt["td"])
    ws.write_number(row, 2, 200000, fmt["td_num"])
    ws.write_number(row, 3, 50000, fmt["td_num"])
    ws.write_formula(row, 4, "=C11-600000-D11", fmt["sum_num"])  # -450,000 除却売却損
    row += 2

    # Section 2: 3ケース比較
    ws.write(row, 0, "2. 固定資産(FA) 全3ケース対比サマリ", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["比較項目", "Case 1: 資産登録・減価償却", "Case 2: 資産修正・部門移動", "Case 3: 資産廃止・除却損益", "重要検証ポイント"]):
        ws.write(row, ci, h, fmt["th"])
    row += 1
    comp = [
        ("代表AP請求番号", "AP-FA-2026-001 (1,650,000円)", "AP-FA-2026-002 (264,000円)", "AP-FA-RET-003 (55,000円)", "すべてAP支払CLEARED連携"),
        ("FA主要イベント", "ADDITION & DEPRECIATION", "ADJUSTMENT & TRANSFER & DEPRN", "FULL RETIREMENT & SALE", "FA_TRANSACTION_HEADERS記録"),
        ("主要ステータス遷移", "ASSETS_ADDITION_FLAG: U→Y / POSTED", "FA_BOOKS履歴化 & DIST移動終了", "FA_RETIREMENTS: PENDING→PROCESSED", "不変履歴管理(DATE_INEFFECTIVE)"),
        ("SLA発生合計 (Dr=Cr)", 4825000, 2838000, 1660000, "05_SLA_GL仕訳・残高検証シートでSUM検算"),
        ("仮勘定・買掛金期末残高", 0, 0, 0, "1690 / 1695 / 2101 が確実に0円完結"),
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
    ws.write(row, 0, "1. 業務・システム処理ステップ一覧", fmt["sec_hdr"])
    for c in range(1, 5):
        ws.write(row, c, "", fmt["sec_hdr"])
    row += 1
    for ci, h in enumerate(["Step", "処理日", "フェーズコード", "ステップ名", "プロセス説明・業務内容"]):
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
            st_lbl = f"UPDATE ({len(upds)}列)" if upds else (f"INSERT (S{ins_s})" if ins_s > 0 else "期首/マスタ")
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
    ws = wb.add_worksheet("04_共通・FA設定マスタ・AFF")
    ws.write(0, 0, "Oracle Fusion Financials 26D 共通・AP・FAマスタ & AFF 9セグメント定義", fmt["title"])

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

    s0 = data["TIMELINES"]["FA_AP_ADD_DEPRN"][0]
    master_ids = [
        tid for tid, tm in data["TABLES"].items()
        if tm["domain"] in ("ORG_GL_MASTER", "AP_SUPPLIER_MASTER", "FA_SETUP_MASTER")
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
    ws.set_column(3, 5, 24)


def write_sla_gl_verification_sheet(wb, data, fmt):
    ws = wb.add_worksheet("05_SLA_GL仕訳・残高検証")
    ws.write(0, 0, "全3ケース SLA (XLA) / GL仕訳明細 (GL_JE_LINES) / 勘定残高 (GL_BALANCES) 自動検証", fmt["title"])
    ws.set_column(0, 0, 14)
    ws.set_column(1, 1, 36)
    ws.set_column(2, 2, 32)
    ws.set_column(3, 6, 16)
    ws.set_column(7, 7, 34)

    row = 2
    for cid in ("FA_AP_ADD_DEPRN", "FA_ADJUST_TRANSFER", "FA_RETIREMENT"):
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
    ws = wb.add_worksheet("06_OEDMF60表・ER結合関係")
    ws.write(0, 0, "Oracle Fusion ERP Financials 26D (OEDMF) 固定資産 全60テーブル ＆ 結合関係", fmt["title"])
    ws.set_column(0, 0, 32)
    ws.set_column(1, 2, 30)
    ws.set_column(3, 4, 44)

    row = 2
    ws.write(row, 0, "1. 網羅テーブル一覧（全60テーブル）", fmt["sec_hdr"])
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

    common_txn_tables = [
        "AP_INVOICES_ALL", "AP_INVOICE_LINES_ALL", "ZX_LINES", "AP_INVOICE_DISTRIBUTIONS_ALL",
        "AP_PAYMENT_SCHEDULES_ALL", "IBY_DOCS_PAYABLE_ALL", "IBY_PAYMENTS_ALL",
        "AP_CHECKS_ALL", "AP_INVOICE_PAYMENTS_ALL", "AP_PAYMENT_HISTORY_ALL",
        "FA_MASS_ADDITIONS", "FA_ADDITIONS_B", "FA_ADDITIONS_TL", "FA_ASSET_INVOICES",
        "FA_BOOKS", "FA_DISTRIBUTION_HISTORY", "FA_TRANSACTION_HEADERS", "FA_ADJUSTMENTS",
        "FA_DEPRN_EVENTS", "FA_DEPRN_SUMMARY", "FA_DEPRN_DETAIL", "FA_RETIREMENTS",
        "XLA_TRANSACTION_ENTITIES", "XLA_EVENTS", "XLA_AE_HEADERS", "XLA_AE_LINES", "XLA_DISTRIBUTION_LINKS",
        "GL_INTERFACE", "GL_JE_BATCHES", "GL_JE_HEADERS", "GL_JE_LINES", "GL_IMPORT_REFERENCES", "GL_BALANCES"
    ]

    write_case_sheet(wb, data, "FA_AP_ADD_DEPRN", "01_AP連携・資産登録・償却", common_txn_tables, fmt)
    write_case_sheet(wb, data, "FA_ADJUST_TRANSFER", "02_資産修正・部門移動・償却", common_txn_tables, fmt)
    write_case_sheet(wb, data, "FA_RETIREMENT", "03_資産廃止・除却売却損益", common_txn_tables, fmt)
    write_master_sheet(wb, data, fmt)
    write_sla_gl_verification_sheet(wb, data, fmt)
    write_er_sheet(wb, data, fmt)

    wb.close()
    print(f"Generated Excel successfully: {OUT_XLSX_PATH}")


if __name__ == "__main__":
    main()
