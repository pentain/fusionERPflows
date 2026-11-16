#!/usr/bin/env python3
"""
Oracle Fusion ERP Financials 26D — SLA・FAH プレゼン & セットアップサンプルデータExcel生成
/Users/kim/Documents/work/fusionERP/FAH/data.js を Node.js で読み込み、
12シート・プロセス別色分け・更新履歴コメント・SUM検証式付きのExcelを作成します。
"""

import json
import os
import subprocess
import xlsxwriter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS_PATH = os.path.join(SCRIPT_DIR, "data.js")
OUTPUT_XLSX = os.path.join(SCRIPT_DIR, "FusionERP_26D_SLA_FAH_Setup_SampleData.xlsx")


def load_data():
    script = f"""
    const d = require({json.dumps(DATA_JS_PATH)});
    process.stdout.write(JSON.stringify(d));
    """
    res = subprocess.run(["/opt/homebrew/bin/node", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def make_formats(wb):
    f = "Yu Gothic"
    return {
        "title": wb.add_format({"font_name": f, "font_size": 14, "bold": True, "font_color": "#FFFFFF", "bg_color": "#0F172A", "valign": "vcenter", "indent": 1}),
        "subtitle": wb.add_format({"font_name": f, "font_size": 10, "italic": True, "font_color": "#CBD5E1", "bg_color": "#1E293B", "valign": "vcenter", "indent": 1}),
        "section": wb.add_format({"font_name": f, "font_size": 11, "bold": True, "font_color": "#FFFFFF", "bg_color": "#1D4ED8", "valign": "vcenter", "indent": 1}),
        "subsec": wb.add_format({"font_name": f, "font_size": 10, "bold": True, "font_color": "#1E293B", "bg_color": "#E2E8F0", "border": 1, "valign": "vcenter"}),
        "th": wb.add_format({"font_name": f, "font_size": 9.5, "bold": True, "font_color": "#FFFFFF", "bg_color": "#334155", "border": 1, "align": "center", "valign": "vcenter", "text_wrap": True}),
        "td": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "valign": "top", "text_wrap": True}),
        "td_c": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "align": "center", "valign": "top", "text_wrap": True}),
        "td_num": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "num_format": "#,##0", "align": "right", "valign": "top"}),
        "td_ins": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "bg_color": "#DCFCE7", "font_color": "#14532D", "valign": "top", "text_wrap": True}),
        "td_ins_num": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "bg_color": "#DCFCE7", "font_color": "#14532D", "num_format": "#,##0", "align": "right", "valign": "top"}),
        "td_upd": wb.add_format({"font_name": f, "font_size": 9.5, "bold": True, "border": 1, "bg_color": "#FEF08A", "font_color": "#713F12", "valign": "top", "text_wrap": True}),
        "td_upd_num": wb.add_format({"font_name": f, "font_size": 9.5, "bold": True, "border": 1, "bg_color": "#FEF08A", "font_color": "#713F12", "num_format": "#,##0", "align": "right", "valign": "top"}),
        "td_null": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "font_color": "#94A3B8", "italic": True, "align": "center", "valign": "top"}),
        "tot_lbl": wb.add_format({"font_name": f, "font_size": 10, "bold": True, "border": 1, "bg_color": "#EFF6FF", "font_color": "#1E3A8A"}),
        "tot_num": wb.add_format({"font_name": f, "font_size": 10, "bold": True, "border": 1, "bg_color": "#EFF6FF", "font_color": "#1E3A8A", "num_format": "#,##0"}),
    }


def is_amt_col(c):
    up = (c or "").upper()
    return any(k in up for k in ("AMOUNT", "BALANCE", "RESERVE", "DEPRN_RESERVE", "NUMBER3")) or up.endswith("_DR") or up.endswith("_CR")


def header_banner(ws, fmt, title, subtitle, max_col=7):
    ws.set_row(0, 28)
    ws.set_row(1, 20)
    ws.merge_range(0, 0, 0, max_col, title, fmt["title"])
    ws.merge_range(1, 0, 1, max_col, subtitle, fmt["subtitle"])


def write_oedmf_table_block(ws, fmt, start_row, tbl, widths):
    row = start_row
    cols = tbl["cols"]
    rows = tbl["rows"]
    ws.set_row(row, 22)
    ws.merge_range(row, 0, row, max(3, len(cols)), f"■ {tbl['id']}  —  {tbl['desc']} ({len(rows)}件)", fmt["section"])
    row += 1

    ws.set_row(row, 22)
    ws.write(row, 0, "工程 / 区分", fmt["th"])
    widths[0] = max(widths.get(0, 14), 16)
    for ci, cname in enumerate(cols, start=1):
        ws.write(row, ci, cname, fmt["th"])
        widths[ci] = max(widths.get(ci, 12), min(34, len(cname) + 4))
    row += 1

    for r in rows:
        is_new = bool(r.get("isNew"))
        upd_cols = set(r.get("updatedCols") or [])
        old_vals = r.get("oldValues") or {}
        st_lbl = r.get("step", "")
        ws.write(row, 0, st_lbl, fmt["td_upd"] if upd_cols else (fmt["td_ins"] if is_new else fmt["td_c"]))

        for ci, cname in enumerate(cols, start=1):
            val = r["data"].get(cname)
            is_upd = cname in upd_cols
            is_amt = is_amt_col(cname)
            if val is None:
                ws.write(row, ci, "NULL", fmt["td_null"])
                vlen = 6
            elif isinstance(val, (int, float)) and not isinstance(val, bool) and is_amt:
                cfmt = fmt["td_upd_num"] if is_upd else (fmt["td_ins_num"] if is_new else fmt["td_num"])
                ws.write_number(row, ci, val, cfmt)
                vlen = len(f"{val:,}") + 3
            elif isinstance(val, (int, float)) and not isinstance(val, bool):
                cfmt = fmt["td_upd"] if is_upd else (fmt["td_ins"] if is_new else fmt["td_c"])
                ws.write_number(row, ci, val, cfmt)
                vlen = len(str(val)) + 3
            else:
                sval = str(val)
                cfmt = fmt["td_upd"] if is_upd else (fmt["td_ins"] if is_new else fmt["td"])
                ws.write_string(row, ci, sval, cfmt)
                vlen = min(40, len(sval) + 3)

            if is_upd and cname in old_vals:
                ws.write_comment(row, ci, f"更新 ({st_lbl}): {old_vals[cname]} → {val}")
            widths[ci] = max(widths.get(ci, 12), vlen)
        ws.set_row(row, 20)
        row += 1
    return row + 1


def build_sheet_00(wb, fmt, data):
    ws = wb.add_worksheet("00_プレゼン目次と全体概要")
    header_banner(ws, fmt, "Oracle Fusion ERP Financials 26D — SLA・FAH プレゼン全体構成と概要", "5大サブ元帳連携 / サブモジュール別手順 / FAH専用12工程 / サポート参照 / 残高有SR残高管理", 5)

    ws.write(3, 0, "色分け凡例:", fmt["subsec"])
    ws.write(3, 1, "緑セル = 新規登録(INSERT)レコード", fmt["td_ins"])
    ws.merge_range(3, 2, 3, 5, "黄太字セル = 後続工程で更新(UPDATE)・セルコメントに旧値→新値履歴", fmt["td_upd"])

    ws.merge_range(5, 0, 5, 5, "Part 1: プレゼンテーション構成（全6チャプター・11スライド）", fmt["section"])
    for c, h in enumerate(["Chapter", "チャプター名", "スライドID", "スライドタイトル", "学習ゴール", "対応Excelシート"]):
        ws.write(6, c, h, fmt["th"])

    sheet_map = {
        "ch1": "00_プレゼン目次と全体概要 / 09_5大サブ元帳_取引サンプル / 10_SLA生成仕訳とGL転記データ",
        "ch2": "02_AP / 03_AR / 04_FA / 05_LA_SLAセットアップ",
        "ch3": "06_FAH_専用セットアップ",
        "ch4": "07_サポート参照設定とDFF比較",
        "ch5": "08_残高有SR_SLA残高管理フロー",
        "ch6": "01_COA9軸と元帳共通設定 / 09_5大サブ元帳 / 10_SLA生成仕訳"
    }
    row = 7
    for ch in data["CHAPTERS"]:
        for sl in ch["slides"]:
            ws.write(row, 0, f"Chapter {ch['num']}", fmt["td_c"])
            ws.write(row, 1, ch["title"], fmt["td"])
            ws.write(row, 2, sl["id"], fmt["td_c"])
            ws.write(row, 3, sl["title"], fmt["td"])
            ws.write(row, 4, ch["goal"], fmt["td"])
            ws.write(row, 5, sheet_map.get(ch["id"], ""), fmt["td"])
            ws.set_row(row, 32)
            row += 1

    row += 1
    ws.merge_range(row, 0, row, 5, "Part 2: 5大サブ元帳 → SLA生成仕訳 一貫サンプル (2026-04: 総計 4,250,000円)", fmt["section"])
    row += 1
    for c, h in enumerate(["サブ元帳", "APPL_ID", "代表イベント", "取引番号", "仕訳概要", "仕訳額 (DR=CR)"]):
        ws.write(row, c, h, fmt["th"])
    row += 1
    samples = [
        ("AP 買掛管理", 200, "INVOICE VALIDATED", "AP-2026-001", "外注費50万 + 仮払税5万 / 買掛金55万", 550000),
        ("AR 売掛管理", 222, "INV_CREATE", "AR-2026-001", "売掛金88万 / 製品売上80万 + 仮受税8万", 880000),
        ("FA 固定資産", 140, "DEPRECIATION", "FA-2026-001", "減価償却費12万 / 償却累計額12万", 120000),
        ("LA リース会計", 10522, "LEASE_BOOKING", "LA-2026-001", "使用権資産240万 / リース負債240万", 2400000),
        ("FAH 会計ハブ", 20001, "XX_CLOUD_REV_RECOG", "FAH-2026-001", "算式(300×1000)＆ADR(4102) 売掛30万 / 収益30万", 300000),
    ]
    start_s = row + 1
    for mod, aid, ev, num, desc, amt in samples:
        ws.write(row, 0, mod, fmt["td"])
        ws.write_number(row, 1, aid, fmt["td_c"])
        ws.write(row, 2, ev, fmt["td"])
        ws.write(row, 3, num, fmt["td_c"])
        ws.write(row, 4, desc, fmt["td"])
        ws.write_number(row, 5, amt, fmt["td_ins_num"] if aid == 20001 else fmt["td_num"])
        row += 1
    end_s = row
    ws.merge_range(row, 0, row, 4, "5大サブ元帳 SLA生成総計 (XLA_AE_LINES ＆ GL_BALANCES 一致)", fmt["tot_lbl"])
    ws.write_formula(row, 5, f"=SUM(F{start_s}:F{end_s})", fmt["tot_num"], 4250000)

    for i, w in enumerate([16, 36, 16, 42, 46, 26]):
        ws.set_column(i, i, w)


def build_sheet_01_coa(wb, fmt, data):
    ws = wb.add_worksheet("01_COA9軸と元帳共通設定")
    header_banner(ws, fmt, "共通基盤設定: 組織・AFF 9セグメント体系・元帳・会計方式 (XX_JP_CORP_AM)", "GL_LEDGERS / FND_ID_FLEX_SEGMENTS / GL_CODE_COMBINATIONS / XLA_ACCTG_METHODS_B / XLA_LEDGER_OPTIONS", 10)
    widths = {}
    row = 3
    for tbl in data["OEDMF_TABLES"]:
        if tbl["category"] == "COA_LEDGER" and tbl["id"] != "GL_BALANCES":
            row = write_oedmf_table_block(ws, fmt, row, tbl, widths)
    for ci, w in widths.items():
        ws.set_column(ci, ci, min(42, max(12, w)))


def build_submodule_sheet(wb, fmt, data, mod_id, sheet_name):
    ws = wb.add_worksheet(sheet_name)
    mod = next(m for m in data["SUBMODULE_SETUPS"] if m["id"] == mod_id)
    header_banner(ws, fmt, f"{mod['title']} — SLA全セットアップ手順サンプルデータ", f"ナビ: {mod['uiNav']} | {mod['tagline']}", 6)

    ws.merge_range(3, 0, 3, 6, "Part 1: 9段階ボトムアップ SLAセットアップ仕様・コード・OEDMF格納先", fmt["section"])
    for c, h in enumerate(["工程順", "OEDMF 26D 対象テーブル", "設定コード例", "具体的設定値・ビジネスルール詳細"]):
        ws.write(4, c, h, fmt["th"])
    ws.merge_range(4, 3, 4, 6, "具体的設定値・ビジネスルール詳細", fmt["th"])

    row = 5
    for comp in mod["components"]:
        ws.write(row, 0, comp["step"], fmt["td_ins"])
        ws.write(row, 1, comp["table"], fmt["td"])
        ws.write(row, 2, comp["code"], fmt["td_upd"])
        ws.merge_range(row, 3, row, 6, comp["detail"], fmt["td"])
        ws.set_row(row, 34)
        row += 1

    row += 1
    ws.merge_range(row, 0, row, 6, f"Part 2: サンプル仕訳生成結果 ({mod['journalExample']['event']})", fmt["section"])
    row += 1
    ws.write(row, 0, "借/貸", fmt["th"])
    ws.merge_range(row, 1, row, 2, "AFF 9セグメント組合せ", fmt["th"])
    ws.merge_range(row, 3, row, 5, "摘要・適用ルール", fmt["th"])
    ws.write(row, 6, "金額 (JPY)", fmt["th"])
    row += 1
    for ln in mod["journalExample"]["lines"]:
        ws.write(row, 0, ln["side"], fmt["td_c"])
        ws.merge_range(row, 1, row, 2, ln["aff"], fmt["td"])
        ws.merge_range(row, 3, row, 5, ln["desc"], fmt["td"])
        amt_val = int(str(ln["amt"]).replace(",", ""))
        ws.write_number(row, 6, amt_val, fmt["td_num"])
        row += 1

    row += 1
    # 当該モジュールの実際のテーブルレコード抜粋
    widths = {0: 22, 1: 30, 2: 26, 3: 24, 4: 22, 5: 22, 6: 18}
    app_id = mod["appId"]
    for tbl in data["OEDMF_TABLES"]:
        if tbl["id"] in ("XLA_FORMULAS_B", "XLA_MAPPING_SETS_B", "XLA_SEG_RULES_B", "XLA_SEG_RULE_DETAILS", "XLA_DESCRIPTIONS_B", "XLA_ACCT_LINE_TYPES_B", "XLA_LINE_DEFINITIONS_B"):
            mod_rows = [r for r in tbl["rows"] if r["data"].get("APPLICATION_ID") == app_id]
            if mod_rows:
                sub_tbl = {"id": f"{tbl['id']} ({mod_id}設定)", "desc": tbl["desc"], "cols": tbl["cols"], "rows": mod_rows}
                row = write_oedmf_table_block(ws, fmt, row, sub_tbl, widths)

    for ci, w in widths.items():
        ws.set_column(ci, ci, min(42, max(14, w)))


def build_sheet_06_fah(wb, fmt, data):
    ws = wb.add_worksheet("06_FAH_専用セットアップ")
    header_banner(ws, fmt, "FAH (会計ハブ / XX_FAH_CLOUD: 20001) 専用セットアップ 12工程 ＆ サンプルデータ", "XLA_SUBLEDGERS / XLA_SOURCES_B / XLA_TRANSACTION_INT_CONTROLS / 算式 / MapSet / ADR / JLT / JERS / I/F表", 9)

    ws.merge_range(3, 0, 3, 9, "Part 1: FAH 専用セットアップ 全12工程ステップリスト", fmt["section"])
    ws.write(4, 0, "工程", fmt["th"])
    ws.write(4, 1, "フェーズ", fmt["th"])
    ws.merge_range(4, 2, 4, 3, "セットアップ手順タイトル", fmt["th"])
    ws.merge_range(4, 4, 4, 5, "UI操作画面パス", fmt["th"])
    ws.merge_range(4, 6, 4, 7, "対象OEDMF 26Dテーブル", fmt["th"])
    ws.merge_range(4, 8, 4, 9, "設定内容・技術ポイント", fmt["th"])

    row = 5
    for st in data["FAH_SETUP_STEPS"]:
        ws.write_number(row, 0, st["no"], fmt["td_c"])
        ws.write(row, 1, st["phase"], fmt["td_ins"])
        ws.merge_range(row, 2, row, 3, st["title"], fmt["td"])
        ws.merge_range(row, 4, row, 5, st["uiTask"], fmt["td"])
        ws.merge_range(row, 6, row, 7, ", ".join(st["tables"]), fmt["td"])
        ws.merge_range(row, 8, row, 9, st["detail"], fmt["td"])
        ws.set_row(row, 34)
        row += 1

    row += 1
    widths = {i: 18 for i in range(10)}
    for tbl in data["OEDMF_TABLES"]:
        if tbl["module"] == "FAH":
            row = write_oedmf_table_block(ws, fmt, row, tbl, widths)
        elif tbl["id"] in ("XLA_FORMULAS_B", "XLA_FORMULA_DETAILS", "XLA_MAPPING_SETS_B", "XLA_MAPPING_SET_VALUES", "XLA_SEG_RULES_B", "XLA_SEG_RULE_DETAILS", "XLA_CONDITIONS", "XLA_LINE_DEFINITIONS_B"):
            fah_rows = [r for r in tbl["rows"] if r["data"].get("APPLICATION_ID") == 20001 or "FAH" in str(r["data"].get("MAPPING_SET_CODE", ""))]
            if fah_rows:
                row = write_oedmf_table_block(ws, fmt, row, {"id": f"{tbl['id']} (FAH定義)", "desc": tbl["desc"], "cols": tbl["cols"], "rows": fah_rows}, widths)

    for ci, w in widths.items():
        ws.set_column(ci, ci, min(38, max(12, w)))


def build_sheet_07_sr(wb, fmt, data):
    ws = wb.add_worksheet("07_サポート参照設定とDFF比較")
    header_banner(ws, fmt, "サポート参照 (Supporting References) 全設定 ＆ 残高有/無 vs DFF vs AFF比較", "残高有 SR_COUNTERPARTY (相手先) / 残高無 SR_EXT_TRACE (外部システム/請求書番号/満期日/数量/単価)", 6)

    widths = {}
    row = 3
    for tbl in data["OEDMF_TABLES"]:
        if tbl["category"] == "SUPPORTING_REF":
            row = write_oedmf_table_block(ws, fmt, row, tbl, widths)

    ws.merge_range(row, 0, row, 6, "■ サポート参照 (残高有/無) vs DFF vs AFF 4軸比較マトリクス", fmt["section"])
    row += 1
    ws.write(row, 0, "比較観点", fmt["th"])
    ws.write(row, 1, "残高有サポート参照 (BAL=Y)", fmt["th"])
    ws.write(row, 2, "残高無サポート参照 (BAL=N)", fmt["th"])
    ws.merge_range(row, 3, row, 4, "DFF (ATTRIBUTE1..15)", fmt["th"])
    ws.merge_range(row, 5, row, 6, "AFF 9セグメント (GL CCID)", fmt["th"])
    row += 1
    for m in data["SR_ARCHITECTURE"]["comparisonMatrix"]:
        ws.write(row, 0, m["item"], fmt["td_upd"])
        ws.write(row, 1, m["srBalY"], fmt["td_ins"])
        ws.write(row, 2, m["srBalN"], fmt["td"])
        ws.merge_range(row, 3, row, 4, m["dff"], fmt["td"])
        ws.merge_range(row, 5, row, 6, m["aff"], fmt["td"])
        ws.set_row(row, 38)
        row += 1

    for i, w in enumerate([24, 34, 34, 24, 20, 22, 22]):
        ws.set_column(i, i, w)


def build_sheet_08_sr_balance_flow(wb, fmt, data):
    ws = wb.add_worksheet("08_残高有SR_SLA残高管理フロー")
    header_banner(ws, fmt, "残高有サポート参照 (SR_COUNTERPARTY: 相手先) 単位の SLA残高管理 6フェーズ推移", "CCID=1001(売掛金) について 期首50万 + AR 88万 + FAH 30万 - 入金消込 60万 = 期末108万 (+第二商事40万 = GL148万一致)", 9)

    row = 3
    for ph in data["SR_BALANCE_PHASES"]:
        ws.merge_range(row, 0, row, 9, f"{ph['title']}   [{ph['period']} | {ph['aeEvent']}]", fmt["section"])
        row += 1
        ws.merge_range(row, 0, row, 9, f"解説: {ph['explanation']}", fmt["subsec"])
        ws.set_row(row, 26)
        row += 1

        headers = ["状態", "サブ元帳", "CCID", "相手先 (AC1)", "会計期間", "期首借方(DR)", "期中借方(DR)", "期中貸方(CR)", "取引先別 純残高", "GL_BALANCES合計(1001)"]
        for c, h in enumerate(headers):
            ws.write(row, c, h, fmt["th"])
        row += 1

        first_r = row + 1
        for i, r in enumerate(ph["acBalancesRows"]):
            is_u = bool(r["updated"])
            cfmt = fmt["td_upd"] if is_u else fmt["td"]
            nfmt = fmt["td_upd_num"] if is_u else fmt["td_num"]
            ws.write(row, 0, "当Phase更新" if is_u else "保持", fmt["td_upd"] if is_u else fmt["td_c"])
            ws.write(row, 1, r["appl"], cfmt)
            ws.write_number(row, 2, r["ccid"], fmt["td_c"])
            ws.write(row, 3, r["ac1"], cfmt)
            ws.write(row, 4, r["period"], fmt["td_c"])
            ws.write_number(row, 5, r["begDr"], nfmt)
            ws.write_number(row, 6, r["perDr"], nfmt)
            ws.write_number(row, 7, r["perCr"], nfmt)
            excel_r = row + 1
            ws.write_formula(row, 8, f"=F{excel_r}+G{excel_r}-H{excel_r}", fmt["td_ins_num"], r["begDr"] + r["perDr"] - r["perCr"])
            if i == 0:
                ws.write_number(row, 9, ph["glBalance"]["endDr"], fmt["tot_num"])
            else:
                ws.write(row, 9, "↑ 合算一致対象", fmt["td_c"])
            if is_u:
                ws.write_comment(row, 6, f"{ph['code']} 更新発生: {ph['aeEvent']}")
            row += 1
        last_r = row
        glob_net = sum(r["begDr"] + r["perDr"] - r["perCr"] for r in ph["acBalancesRows"] if r["ac1"] == "株式会社グローバル商事")
        ws.merge_range(row, 0, row, 7, f"{ph['code']} [相手先横断合算] 株式会社グローバル商事 (AR+FAH統合純残高)", fmt["td_ins"])
        ws.write_formula(row, 8, f'=SUMIF(D{first_r}:D{last_r},"株式会社グローバル商事",I{first_r}:I{last_r})', fmt["td_ins_num"], glob_net)
        ws.write(row, 9, "AR+FAH 同一SR統合値", fmt["td_c"])
        row += 1
        ws.merge_range(row, 0, row, 7, f"{ph['code']} XLA_AC_BALANCES 期末合計 ≡ GL_BALANCES (CCID=1001) 残高", fmt["tot_lbl"])
        ws.write_formula(row, 8, f"=SUM(I{first_r}:I{last_r})", fmt["tot_num"], ph["glBalance"]["endDr"])
        ws.write_number(row, 9, ph["glBalance"]["endDr"], fmt["tot_num"])
        row += 2

    for i, w in enumerate([13, 15, 9, 24, 12, 15, 15, 15, 18, 22]):
        ws.set_column(i, i, w)


def build_sheet_category(wb, fmt, data, categories, sheet_name, title, sub):
    ws = wb.add_worksheet(sheet_name)
    header_banner(ws, fmt, title, sub, 9)
    widths = {}
    row = 3
    for tbl in data["OEDMF_TABLES"]:
        if tbl["category"] in categories:
            row = write_oedmf_table_block(ws, fmt, row, tbl, widths)
    for ci, w in widths.items():
        ws.set_column(ci, ci, min(40, max(12, w)))


def build_sheet_10_sla_gl(wb, fmt, data):
    ws = wb.add_worksheet("10_SLA生成仕訳とGL転記データ")
    header_banner(ws, fmt, "SLA生成仕訳 (XLA_*) ・サポート参照実績 ・ GL残高 (4,250,000円 貸借検証)", "XLA_EVENTS / XLA_AE_LINES (12明細) / XLA_AE_LINE_ACS / XLA_AC_BALANCES / GL_BALANCES (11勘定)", 9)
    widths = {}
    row = 3
    for tbl in data["OEDMF_TABLES"]:
        if tbl["category"] == "SLA_GL":
            row = write_oedmf_table_block(ws, fmt, row, tbl, widths)
            if tbl["id"] == "XLA_AE_LINES":
                # Add SUM verification line right below XLA_AE_LINES
                # 12 rows ended at row - 2 (since write_oedmf_table_block adds 1 blank row)
                last_line = row - 1
                first_line = last_line - len(tbl["rows"]) + 1
                ws.merge_range(row - 1, 0, row - 1, 5, "XLA_AE_LINES 貸借合計検算 (SUM)", fmt["tot_lbl"])
                ws.write_formula(row - 1, 6, f"=SUM(G{first_line}:G{last_line})", fmt["tot_num"], 4250000)
                ws.write_formula(row - 1, 7, f"=SUM(H{first_line}:H{last_line})", fmt["tot_num"], 4250000)
                row += 1
            elif tbl["id"] == "GL_BALANCES":
                last_line = row - 1
                first_line = last_line - len(tbl["rows"]) + 1
                ws.merge_range(row - 1, 0, row - 1, 6, "GL_BALANCES 期末純額合計 (SUM DR=CR)", fmt["tot_lbl"])
                ws.write_formula(row - 1, 7, f"=SUM(H{first_line}:H{last_line})", fmt["tot_num"], 4250000)
                ws.write_formula(row - 1, 8, f"=SUM(I{first_line}:I{last_line})", fmt["tot_num"], 4250000)
                row += 1
    for ci, w in widths.items():
        ws.set_column(ci, ci, min(38, max(12, w)))


def build_sheet_11_er(wb, fmt, data):
    ws = wb.add_worksheet("11_OEDMF26D_ERリレーション")
    header_banner(ws, fmt, f"Oracle Fusion ERP 26D — テーブル間ERリレーション一覧 ({len(data['RELATIONS'])}本)", "COA・イベント・AMB・サポート参照・サブ元帳取引・SLA出力・GL間のキー結合関係", 4)
    tbl_desc = {t["id"]: t["desc"] for t in data["OEDMF_TABLES"]}
    for c, h in enumerate(["No", "親テーブル (From)", "説明", "子テーブル (To)", "結合キー / カラム"]):
        ws.write(3, c, h, fmt["th"])
    row = 4
    for i, r in enumerate(data["RELATIONS"], 1):
        ws.write_number(row, 0, i, fmt["td_c"])
        ws.write(row, 1, r["from"], fmt["td"])
        ws.write(row, 2, tbl_desc.get(r["from"], ""), fmt["td"])
        ws.write(row, 3, r["to"], fmt["td"])
        ws.write(row, 4, r["key"], fmt["td_ins"])
        row += 1
    for i, w in enumerate([7, 32, 36, 32, 34]):
        ws.set_column(i, i, w)


def main():
    data = load_data()
    wb = xlsxwriter.Workbook(OUTPUT_XLSX)
    fmt = make_formats(wb)

    build_sheet_00(wb, fmt, data)
    build_sheet_01_coa(wb, fmt, data)
    build_submodule_sheet(wb, fmt, data, "AP", "02_AP_SLAセットアップ")
    build_submodule_sheet(wb, fmt, data, "AR", "03_AR_SLAセットアップ")
    build_submodule_sheet(wb, fmt, data, "FA", "04_FA_SLAセットアップ")
    build_submodule_sheet(wb, fmt, data, "LA", "05_LA_SLAセットアップ")
    build_sheet_06_fah(wb, fmt, data)
    build_sheet_07_sr(wb, fmt, data)
    build_sheet_08_sr_balance_flow(wb, fmt, data)
    build_sheet_category(wb, fmt, data, ("TXN_DATA",), "09_5大サブ元帳_取引サンプル", "5大サブ元帳 トランザクションサンプルデータ", "AP・AR・FA・LA・FAH (INT表 → Base表) 実データ一覧")
    build_sheet_10_sla_gl(wb, fmt, data)
    build_sheet_11_er(wb, fmt, data)

    wb.close()
    print(f"Generated Excel successfully: {OUTPUT_XLSX}")


if __name__ == "__main__":
    main()
