#!/usr/bin/env python3
"""
Oracle Fusion ERP Financials 26D — SLA・FAHセットアップ & 5大サブ元帳→GL転記 データExcel生成スクリプト
/Users/kim/Documents/work/fusionERP/SLA/data.js を Node.js で評価し、
11シート・全59テーブル・変更履歴ハイライト/コメント付きの Excel ファイルを生成します。
"""

import json
import os
import subprocess
import sys
import xlsxwriter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS_PATH = os.path.join(SCRIPT_DIR, "data.js")
OUTPUT_XLSX = os.path.join(SCRIPT_DIR, "FusionERP_26D_SLA_Setup_and_Flow.xlsx")


def load_data_from_js():
    node_script = f"""
    const d = require({json.dumps(DATA_JS_PATH)});
    const states = d.STEPS.map((_, idx) => d.computeStateAtStep(idx));
    const payload = {{
      AFF_SEGMENTS: d.AFF_SEGMENTS,
      CCID_LIST: d.CCID_LIST,
      SETUP_SCREENS: d.SETUP_SCREENS,
      SR_VS_DFF_COMPARISON: d.SR_VS_DFF_COMPARISON,
      DOMAINS: d.DOMAINS,
      TABLES: d.TABLES,
      RELATIONS: d.RELATIONS,
      TABLE_RECORDS: d.TABLE_RECORDS,
      STEPS: d.STEPS,
      FINAL_STATE: states[states.length - 1]
    }};
    process.stdout.write(JSON.stringify(payload));
    """
    proc = subprocess.run(
        ["/opt/homebrew/bin/node", "-e", node_script],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout)


def is_amount_column(col_name, role):
    if role in ("amt", "amount"):
        return True
    up = (col_name or "").upper()
    if any(k in up for k in ("AMOUNT", "BALANCE", "UNIT_PRICE", "UNIT_SELLING_PRICE")):
        return True
    if up.endswith("_DR") or up.endswith("_CR") or up in ("DEPRN_RESERVE", "NUMBER3"):
        return True
    return False


def make_formats(wb):
    base_font = "Yu Gothic"
    return {
        "title": wb.add_format({
            "font_name": base_font, "font_size": 14, "bold": True,
            "font_color": "#FFFFFF", "bg_color": "#0F172A", "valign": "vcenter", "indent": 1
        }),
        "subtitle": wb.add_format({
            "font_name": base_font, "font_size": 10, "italic": True,
            "font_color": "#CBD5E1", "bg_color": "#1E293B", "valign": "vcenter", "indent": 1
        }),
        "section": wb.add_format({
            "font_name": base_font, "font_size": 11, "bold": True,
            "font_color": "#FFFFFF", "bg_color": "#1D4ED8", "valign": "vcenter", "indent": 1
        }),
        "table_banner": wb.add_format({
            "font_name": base_font, "font_size": 10.5, "bold": True,
            "font_color": "#1E293B", "bg_color": "#E2E8F0", "border": 1, "valign": "vcenter"
        }),
        "th": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True,
            "font_color": "#FFFFFF", "bg_color": "#334155", "border": 1,
            "align": "center", "valign": "vcenter", "text_wrap": True
        }),
        "th_pk": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True,
            "font_color": "#1E3A8A", "bg_color": "#DBEAFE", "border": 1,
            "align": "center", "valign": "vcenter", "text_wrap": True
        }),
        "th_flag": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True,
            "font_color": "#713F12", "bg_color": "#FEF3C7", "border": 1,
            "align": "center", "valign": "vcenter", "text_wrap": True
        }),
        "td": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "border": 1,
            "valign": "top", "text_wrap": True
        }),
        "td_center": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "border": 1,
            "align": "center", "valign": "top", "text_wrap": True
        }),
        "td_num": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "border": 1,
            "num_format": "#,##0", "align": "right", "valign": "top"
        }),
        "td_ins": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "border": 1,
            "bg_color": "#DCFCE7", "font_color": "#14532D", "valign": "top", "text_wrap": True
        }),
        "td_ins_num": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "border": 1,
            "bg_color": "#DCFCE7", "font_color": "#14532D",
            "num_format": "#,##0", "align": "right", "valign": "top"
        }),
        "td_upd": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "border": 1,
            "bg_color": "#FEF08A", "font_color": "#713F12", "valign": "top", "text_wrap": True
        }),
        "td_upd_num": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "border": 1,
            "bg_color": "#FEF08A", "font_color": "#713F12",
            "num_format": "#,##0", "align": "right", "valign": "top"
        }),
        "td_null": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "border": 1,
            "font_color": "#94A3B8", "italic": True, "align": "center", "valign": "top"
        }),
        "total": wb.add_format({
            "font_name": base_font, "font_size": 10, "bold": True, "border": 1,
            "bg_color": "#EFF6FF", "font_color": "#1E3A8A", "num_format": "#,##0"
        }),
        "total_label": wb.add_format({
            "font_name": base_font, "font_size": 10, "bold": True, "border": 1,
            "bg_color": "#EFF6FF", "font_color": "#1E3A8A"
        }),
    }


def write_sheet_header(ws, fmt, title, subtitle, max_col=8):
    ws.set_row(0, 28)
    ws.set_row(1, 20)
    ws.merge_range(0, 0, 0, max_col, title, fmt["title"])
    ws.merge_range(1, 0, 1, max_col, subtitle, fmt["subtitle"])


def build_overview_sheet(wb, fmt, data):
    ws = wb.add_worksheet("00_概要・プロセス一覧")
    write_sheet_header(
        ws, fmt,
        "Oracle Fusion ERP Financials 26D — SLA(補助元帳会計)＆FAH統合プロセス一覧",
        "全9ステップ (S0〜S8) におけるテーブル操作(INSERT/UPDATE/READ)・フラグ変化・概算仕訳を網羅",
        max_col=7
    )

    # 凡例
    ws.write(3, 0, "色分け凡例:", fmt["table_banner"])
    ws.write(3, 1, "緑セル = トランザクション・ルール新規作成 (INSERT)", fmt["td_ins"])
    ws.write(3, 2, "黄太字セル = 後続ステップで更新 (UPDATE / コメントに旧値→新値履歴)", fmt["td_upd"])

    headers = ["Step", "日付/時期", "フェーズ名", "プロセス説明", "主なフラグ・ステータス変化", "新規作成テーブル(INSERT)", "更新テーブル(UPDATE)", "参照テーブル(READ)"]
    ws.set_row(5, 24)
    for c, h in enumerate(headers):
        ws.write(5, c, h, fmt["th"])

    row = 6
    for st in data["STEPS"]:
        desc_text = "\n".join(st["description"]) if isinstance(st["description"], list) else str(st["description"])
        flag_text = "\n".join(st["flagChanges"]) if isinstance(st["flagChanges"], list) else str(st["flagChanges"])
        ins_text = ", ".join(st.get("insertedTables", [])) or "-"
        upd_text = ", ".join(st.get("updatedTables", [])) or "-"
        ref_text = ", ".join(st.get("referencedTables", [])) or "-"

        ws.write(row, 0, st["code"], fmt["td_center"])
        ws.write(row, 1, st["date"], fmt["td_center"])
        ws.write(row, 2, st["title"], fmt["td"])
        ws.write(row, 3, desc_text, fmt["td"])
        ws.write(row, 4, flag_text, fmt["td_upd"] if upd_text != "-" else fmt["td"])
        ws.write(row, 5, ins_text, fmt["td_ins"] if ins_text != "-" else fmt["td"])
        ws.write(row, 6, upd_text, fmt["td_upd"] if upd_text != "-" else fmt["td"])
        ws.write(row, 7, ref_text, fmt["td"])
        ws.set_row(row, 76)
        row += 1

    widths = [8, 15, 34, 54, 42, 36, 28, 30]
    for i, w in enumerate(widths):
        ws.set_column(i, i, w)


def build_setup_sheet(wb, fmt, data):
    ws = wb.add_worksheet("01_SLA_FAHセットアップ手順")
    write_sheet_header(
        ws, fmt,
        "SLA・FAH 全9セットアップ画面手順 ＆ OEDMF 26D 実格納テーブル対応",
        "Fusion Setup UI での画面構成・入力値・実行テーブル (XLA_FORMULAS_B, XLA_MAPPING_SETS_B, XLA_SEG_RULES_B, XLA_ANALYTICAL_* 等)",
        max_col=6
    )

    row = 3
    for scr in data["SETUP_SCREENS"]:
        ws.set_row(row, 22)
        ws.merge_range(row, 0, row, 6, f"{scr['taskName']}   [{scr['badge']} | UIパス: {scr['uiPath']}]", fmt["section"])
        row += 1
        ws.merge_range(row, 0, row, 6, f"概要: {scr['summary']}   |   更新OEDMF表: {', '.join(scr['oedmfTables'])}", fmt["table_banner"])
        ws.set_row(row, 26)
        row += 1

        # Fields
        ws.write(row, 0, "設定画面項目", fmt["th_pk"])
        ws.write(row, 1, "サンプル設定値", fmt["th_pk"])
        ws.merge_range(row, 2, row, 6, "対象画面タイトル: " + scr["screenMock"]["title"], fmt["th"])
        row += 1
        for f in scr["screenMock"]["fields"]:
            ws.write(row, 0, f["label"], fmt["td"])
            ws.merge_range(row, 1, row, 6, f["value"], fmt["td_ins"])
            row += 1

        # Rows
        cols = scr["screenMock"]["columns"]
        for ci, cname in enumerate(cols):
            ws.write(row, ci, cname, fmt["th"])
        for ci in range(len(cols), 7):
            ws.write(row, ci, "", fmt["th"])
        row += 1

        for rvals in scr["screenMock"]["rows"]:
            for ci, val in enumerate(rvals):
                ws.write(row, ci, val, fmt["td"])
            for ci in range(len(rvals), 7):
                ws.write(row, ci, "", fmt["td"])
            row += 1

        row += 1

    for i, w in enumerate([26, 28, 32, 34, 24, 18, 18]):
        ws.set_column(i, i, w)


def build_sr_vs_dff_sheet(wb, fmt, data):
    ws = wb.add_worksheet("02_サポート参照_vs_DFF比較")
    cmp_data = data["SR_VS_DFF_COMPARISON"]
    write_sheet_header(
        ws, fmt,
        cmp_data["title"],
        cmp_data["subtitle"],
        max_col=3
    )

    ws.merge_range(3, 0, 3, 3, "Part 1: 本プロジェクトにおけるサポート参照の2分類実装モデル", fmt["section"])
    uc_headers = ["コード / 種別", "年度末繰越 / 格納先テーブル", "構成項目 (AC1..AC5)", "実データ上の効果・特徴"]
    for c, h in enumerate(uc_headers):
        ws.write(4, c, h, fmt["th"])

    row = 5
    for uc in cmp_data["useCases"]:
        is_bal = "SR_COUNTERPARTY" in uc["code"]
        ws.write(row, 0, f"{uc['code']}\n{uc['type']}", fmt["td_ins"] if is_bal else fmt["td_upd"])
        ws.write(row, 1, f"{uc['carryForward']}\n{uc['targetTables']}", fmt["td"])
        ws.write(row, 2, uc["attributes"], fmt["td"])
        ws.write(row, 3, uc["sampleEffect"], fmt["td"])
        ws.set_row(row, 48)
        row += 1

    row += 1
    ws.merge_range(row, 0, row, 3, "Part 2: サポート参照 (Supporting Reference) vs DFF (付加フレックスフィールド) 詳細比較表", fmt["section"])
    row += 1
    d_headers = ["比較観点", "サポート参照 (Supporting References)", "DFF (付加フレックスフィールド)", "設計判断ガイドライン"]
    for c, h in enumerate(d_headers):
        ws.write(row, c, h, fmt["th"])
    row += 1
    for dim in cmp_data["dimensions"]:
        ws.write(row, 0, dim["aspect"], fmt["th_pk"])
        ws.write(row, 1, dim["supportingRef"], fmt["td_ins"])
        ws.write(row, 2, dim["dff"], fmt["td"])
        ws.write(row, 3, dim["verdict"], fmt["td_upd"])
        ws.set_row(row, 58)
        row += 1

    for i, w in enumerate([26, 48, 46, 42]):
        ws.set_column(i, i, w)


def build_aff_and_journal_sheet(wb, fmt, data):
    ws = wb.add_worksheet("03_AFF構造と仕訳検証")
    write_sheet_header(
        ws, fmt,
        "AFF 9セグメント体系・11勘定組合せ・5大サブ元帳 貸借一致検証 (4,250,000円)",
        "AFF構造: 会社(1)-部門(2)-勘定科目(3)-補助科目(4)-税コード(5)-管理コード(6)-備考1(7)-備考2(8)-備考3(9)",
        max_col=7
    )

    ws.merge_range(3, 0, 3, 7, "Part 1: AFF 9セグメント定義 (FND_ID_FLEX_SEGMENTS)", fmt["section"])
    for c, h in enumerate(["No", "DBカラム", "セグメント名", "桁数", "設定例", "説明", "", ""]):
        ws.write(4, c, h, fmt["th"])
    row = 5
    for seg in data["AFF_SEGMENTS"]:
        ws.write(row, 0, seg["num"], fmt["td_center"])
        ws.write(row, 1, seg["col"], fmt["td"])
        ws.write(row, 2, seg["name"], fmt["td"])
        ws.write(row, 3, seg["codeLen"], fmt["td_center"])
        ws.write(row, 4, seg["example"], fmt["td_center"])
        ws.merge_range(row, 5, row, 7, seg["desc"], fmt["td"])
        row += 1

    row += 1
    ws.merge_range(row, 0, row, 7, "Part 2: CCID 11勘定一覧 (GL_CODE_COMBINATIONS)", fmt["section"])
    row += 1
    for c, h in enumerate(["CCID", "勘定区分", "勘定科目名", "9セグメントAFF値", "用途・導出ルール", "", "", ""]):
        ws.write(row, c, h, fmt["th"])
    row += 1
    ccid_map = {}
    for cc in data["CCID_LIST"]:
        ccid_map[cc["id"]] = cc
        ws.write(row, 0, cc["id"], fmt["td_center"])
        ws.write(row, 1, cc["type"], fmt["td_center"])
        ws.write(row, 2, cc["name"], fmt["td"])
        ws.merge_range(row, 3, row, 4, cc["aff"], fmt["td"])
        ws.merge_range(row, 5, row, 7, cc["desc"], fmt["td"])
        row += 1

    row += 1
    ws.merge_range(row, 0, row, 7, "Part 3: 5大サブ元帳別 SLA仕訳 12明細 貸借検証 (XLA_AE_LINES)", fmt["section"])
    row += 1
    j_headers = ["AE_HEADER_ID", "行", "APPL_ID", "CCID / AFF", "会計クラス", "摘要", "借方 (DR)", "貸方 (CR)"]
    for c, h in enumerate(j_headers):
        ws.write(row, c, h, fmt["th"])
    row += 1

    first_line_row = row + 1
    for rwrap in data["TABLE_RECORDS"]["XLA_AE_LINES"]:
        d = rwrap["data"]
        cc = ccid_map.get(d["CODE_COMBINATION_ID"], {})
        ws.write(row, 0, d["AE_HEADER_ID"], fmt["td_center"])
        ws.write(row, 1, d["AE_LINE_NUM"], fmt["td_center"])
        ws.write(row, 2, d["APPLICATION_ID"], fmt["td_center"])
        ws.write(row, 3, f"{d['CODE_COMBINATION_ID']} ({cc.get('aff', '')})", fmt["td"])
        ws.write(row, 4, d["ACCOUNTING_CLASS_CODE"], fmt["td"])
        ws.write(row, 5, d["DESCRIPTION"], fmt["td"])
        ws.write_number(row, 6, d["ACCOUNTED_DR"], fmt["td_num"])
        ws.write_number(row, 7, d["ACCOUNTED_CR"], fmt["td_num"])
        row += 1
    last_line_row = row

    ws.merge_range(row, 0, row, 5, "SLA 12仕訳明細 貸借合計 (AP 550k + AR 880k + FA 120k + LA 2,400k + FAH 300k)", fmt["total_label"])
    ws.write_formula(row, 6, f"=SUM(G{first_line_row}:G{last_line_row})", fmt["total"], 4250000)
    ws.write_formula(row, 7, f"=SUM(H{first_line_row}:H{last_line_row})", fmt["total"], 4250000)
    row += 2

    # GL_BALANCES cross check
    ws.merge_range(row, 0, row, 7, "Part 4: GL_BALANCES 最終確定勘定残高 貸借検証 (11 CCID)", fmt["section"])
    row += 1
    for c, h in enumerate(["LEDGER_ID", "CCID", "勘定科目名", "期間", "通貨", "期首残", "期間純借方 (DR)", "期間純貸方 (CR)"]):
        ws.write(row, c, h, fmt["th"])
    row += 1
    b_first = row + 1
    for rwrap in data["TABLE_RECORDS"]["GL_BALANCES"]:
        d = rwrap["data"]
        cc = ccid_map.get(d["CODE_COMBINATION_ID"], {})
        ws.write(row, 0, d["LEDGER_ID"], fmt["td_center"])
        ws.write(row, 1, d["CODE_COMBINATION_ID"], fmt["td_center"])
        ws.write(row, 2, f"{cc.get('name', '')} [{cc.get('aff', '')}]", fmt["td"])
        ws.write(row, 3, d["PERIOD_NAME"], fmt["td_center"])
        ws.write(row, 4, d["CURRENCY_CODE"], fmt["td_center"])
        ws.write_number(row, 5, d["BEGIN_BALANCE_DR"], fmt["td_num"])
        ws.write_number(row, 6, d["PERIOD_NET_DR"], fmt["td_num"])
        ws.write_number(row, 7, d["PERIOD_NET_CR"], fmt["td_num"])
        row += 1
    b_last = row
    ws.merge_range(row, 0, row, 5, "GL_BALANCES 総計", fmt["total_label"])
    ws.write_formula(row, 6, f"=SUM(G{b_first}:G{b_last})", fmt["total"], 4250000)
    ws.write_formula(row, 7, f"=SUM(H{b_first}:H{b_last})", fmt["total"], 4250000)

    for i, w in enumerate([14, 16, 36, 20, 18, 42, 16, 16]):
        ws.set_column(i, i, w)


def resolve_record_history(raw_rec, steps):
    """
    raw_rec = { _createdAt, data, _updates? } から最終値と各カラムの更新履歴を構築
    Returns: (final_dict, col_history_dict)
    where col_history_dict[col] = ["S0(作成時): NEW", "S4: NEW → PROCESSED", ...]
    """
    cur = dict(raw_rec["data"])
    history = {}
    updates = raw_rec.get("_updates") or {}
    sorted_steps = sorted(int(k) for k in updates.keys())

    for ustep in sorted_steps:
        patch = updates[str(ustep)]
        st_code = steps[ustep]["code"] if ustep < len(steps) else f"S{ustep}"
        for col, new_val in patch.items():
            old_val = cur.get(col)
            history.setdefault(col, []).append(f"{st_code} 更新: {old_val} → {new_val}")
            cur[col] = new_val
    return cur, history


def build_domain_sheet(wb, fmt, data, domain_id, sheet_name):
    ws = wb.add_worksheet(sheet_name)
    dom = next(d for d in data["DOMAINS"] if d["id"] == domain_id)
    dom_tables = [t for t in data["TABLES"] if t["domain"] == domain_id]
    max_cols = max((len(t["cols"]) + 1 for t in dom_tables), default=6)

    write_sheet_header(
        ws, fmt,
        f"{dom['title']} （全{len(dom_tables)}テーブル）",
        f"{dom['subtitle']}   |   [色凡例] 緑行: 新規INSERT行 / 黄色セル: プロセス途中で更新(コメントに旧値→新値履歴)",
        max_col=max(6, max_cols)
    )

    row = 3
    steps = data["STEPS"]
    col_widths = {}

    for tbl in dom_tables:
        tid = tbl["id"]
        cols = tbl["cols"]
        pk_set = set(tbl.get("pk") or [])
        records = data["TABLE_RECORDS"].get(tid, [])

        ws.set_row(row, 22)
        ws.merge_range(
            row, 0, row, len(cols),
            f"■ {tid}  —  {tbl['shortDesc']}  ({len(records)}件)   PK: {', '.join(tbl.get('pk') or [])}",
            fmt["section"]
        )
        row += 1

        # Header row: Col 0 is 作成/最終更新Step
        ws.set_row(row, 22)
        ws.write(row, 0, "発生/最終更新Step", fmt["th"])
        col_widths[0] = max(col_widths.get(0, 14), 16)
        for ci, cmeta in enumerate(cols, start=1):
            cname = cmeta["name"]
            role = cmeta.get("role", "attr")
            th_fmt = fmt["th_pk"] if cname in pk_set or role == "pk" else (fmt["th_flag"] if role == "flag" else fmt["th"])
            ws.write(row, ci, cname, th_fmt)
            col_widths[ci] = max(col_widths.get(ci, 12), min(34, len(cname) + 4))
        row += 1

        for raw_rec in records:
            c_idx = raw_rec.get("_createdAt", 0)
            final_vals, col_hist = resolve_record_history(raw_rec, steps)
            step_str = steps[c_idx]["code"] if c_idx < len(steps) else f"S{c_idx}"
            if raw_rec.get("_updates"):
                upd_codes = [steps[int(k)]["code"] for k in sorted(int(x) for x in raw_rec["_updates"].keys())]
                step_str = f"{step_str} → {'/'.join(upd_codes)}"

            ws.write(row, 0, step_str, fmt["td_upd"] if raw_rec.get("_updates") else (fmt["td_ins"] if c_idx > 0 else fmt["td_center"]))
            col_widths[0] = max(col_widths.get(0, 16), len(step_str) + 3)

            for ci, cmeta in enumerate(cols, start=1):
                cname = cmeta["name"]
                role = cmeta.get("role", "attr")
                val = final_vals.get(cname)
                is_upd = cname in col_hist
                is_amt = is_amount_column(cname, role)

                if val is None:
                    ws.write(row, ci, "NULL", fmt["td_null"])
                    val_len = 6
                elif isinstance(val, (int, float)) and not isinstance(val, bool) and is_amt:
                    cell_fmt = fmt["td_upd_num"] if is_upd else (fmt["td_ins_num"] if c_idx > 0 else fmt["td_num"])
                    ws.write_number(row, ci, val, cell_fmt)
                    val_len = len(f"{val:,}") + 3
                elif isinstance(val, (int, float)) and not isinstance(val, bool):
                    cell_fmt = fmt["td_upd"] if is_upd else (fmt["td_ins"] if c_idx > 0 else fmt["td_center"])
                    ws.write_number(row, ci, val, cell_fmt)
                    val_len = len(str(val)) + 3
                else:
                    sval = str(val)
                    cell_fmt = fmt["td_upd"] if is_upd else (fmt["td_ins"] if c_idx > 0 else fmt["td"])
                    ws.write_string(row, ci, sval, cell_fmt)
                    val_len = min(40, len(sval) + 3)

                if is_upd:
                    ws.write_comment(row, ci, "\n".join(col_hist[cname]))

                col_widths[ci] = max(col_widths.get(ci, 12), val_len)

            ws.set_row(row, 20)
            row += 1

        row += 1

    for ci, w in col_widths.items():
        ws.set_column(ci, ci, min(42, max(12, w)))


def build_er_sheet(wb, fmt, data):
    ws = wb.add_worksheet("ERリレーション一覧")
    write_sheet_header(
        ws, fmt,
        f"Oracle Fusion ERP Financials 26D — 全テーブルリレーション一覧 ({len(data['RELATIONS'])}本)",
        "A〜Fの全6ドメイン・59テーブルを繋ぐ OEDMF 26D 外部キー連携一覧",
        max_col=5
    )

    tbl_desc = {t["id"]: t["shortDesc"] for t in data["TABLES"]}
    tbl_dom = {t["id"]: t["domain"] for t in data["TABLES"]}
    headers = ["No", "親テーブル (From)", "親テーブル説明", "子テーブル (To)", "子テーブル説明", "結合キー / カラム"]
    ws.set_row(3, 22)
    for c, h in enumerate(headers):
        ws.write(3, c, h, fmt["th"])

    row = 4
    for idx, rel in enumerate(data["RELATIONS"], start=1):
        ws.write(row, 0, idx, fmt["td_center"])
        ws.write(row, 1, rel["from"], fmt["td"])
        ws.write(row, 2, tbl_desc.get(rel["from"], ""), fmt["td"])
        ws.write(row, 3, rel["to"], fmt["td"])
        ws.write(row, 4, tbl_desc.get(rel["to"], ""), fmt["td"])
        ws.write(row, 5, rel["key"], fmt["td_ins"])
        row += 1

    for i, w in enumerate([7, 32, 34, 32, 34, 28]):
        ws.set_column(i, i, w)


def main():
    data = load_data_from_js()
    wb = xlsxwriter.Workbook(OUTPUT_XLSX)
    fmt = make_formats(wb)

    build_overview_sheet(wb, fmt, data)
    build_setup_sheet(wb, fmt, data)
    build_sr_vs_dff_sheet(wb, fmt, data)
    build_aff_and_journal_sheet(wb, fmt, data)

    domain_sheet_map = [
        ("ORG_GL_MASTER", "A_組織とGL基本マスタ"),
        ("SLA_EVENT_FAH_SETUP", "B_イベントモデルとFAH基盤"),
        ("SLA_AMB_RULES", "C_SLAルール定義(AMB全設定)"),
        ("SUBLEDGER_TXNS", "D_5大サブ元帳トランザクション"),
        ("SLA_ENGINE_OUTPUT", "E_SLA仕訳とサポート参照残高"),
        ("GL_LEDGER", "F_GL転記と一般会計残高"),
    ]
    for dom_id, sh_name in domain_sheet_map:
        build_domain_sheet(wb, fmt, data, dom_id, sh_name)

    build_er_sheet(wb, fmt, data)
    wb.close()
    print(f"Generated Excel successfully: {OUTPUT_XLSX}")


if __name__ == "__main__":
    main()
