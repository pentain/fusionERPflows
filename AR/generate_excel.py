#!/usr/bin/env python3
"""
Oracle Fusion ERP Financials 26D (OEDMF準拠)
ARトランザクション〜入金・消込〜SLA会計作成〜GL転記 全42テーブル Excel生成スクリプト
data.js の単一データソースを Node 経由で読み込み、Webアニメーションと完全同一のデータを出力する。
"""

import json
import os
import subprocess
import xlsxwriter


def load_data_from_js(work_dir: str) -> dict:
    js_script = """
    const d = require('./data.js');
    const snapshots = {};
    for (let i = 0; i < d.STEPS.length; i++) {
      snapshots[i] = d.computeStateAtStep(i);
    }
    console.log(JSON.stringify({
      AFF_SEGMENTS: d.AFF_SEGMENTS,
      CCID_LIST: d.CCID_LIST,
      DOMAINS: d.DOMAINS,
      TABLES: d.TABLES,
      RELATIONS: d.RELATIONS,
      STEPS: d.STEPS,
      snapshots
    }));
    """
    res = subprocess.run(
        ["node", "-e", js_script],
        cwd=work_dir,
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(res.stdout)


def format_display_val(val, col_meta):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        name = col_meta["name"]
        if name in ("PERCENT", "PERCENTAGE_RATE", "TAX_RATE", "RELATIVE_AMOUNT"):
            return f"{val}%"
        if col_meta.get("role") == "amount":
            return f"{val:,.0f}" if isinstance(val, int) or val.is_integer() else f"{val:,}"
        return str(val)
    return str(val)


def create_formats(wb):
    base_font = "Yu Gothic"
    fmts = {
        "title": wb.add_format({
            "font_name": base_font, "font_size": 15, "bold": True, "font_color": "#FFFFFF",
            "bg_color": "#0F172A", "valign": "vcenter", "indent": 1
        }),
        "subtitle": wb.add_format({
            "font_name": base_font, "font_size": 10, "font_color": "#E2E8F0",
            "bg_color": "#1E3A5F", "valign": "vcenter", "indent": 1, "text_wrap": True
        }),
        "sec_hdr": wb.add_format({
            "font_name": base_font, "font_size": 12, "bold": True, "font_color": "#0F172A",
            "bg_color": "#DBEAFE", "border": 1, "border_color": "#3B82F6", "valign": "vcenter", "indent": 1
        }),
        "tbl_banner_ins": wb.add_format({
            "font_name": base_font, "font_size": 11, "bold": True, "font_color": "#14532D",
            "bg_color": "#DCFCE7", "border": 1, "border_color": "#16A34A", "valign": "vcenter", "indent": 1
        }),
        "tbl_banner_upd": wb.add_format({
            "font_name": base_font, "font_size": 11, "bold": True, "font_color": "#7C2D12",
            "bg_color": "#FFEDD5", "border": 1, "border_color": "#EA580C", "valign": "vcenter", "indent": 1
        }),
        "tbl_banner_std": wb.add_format({
            "font_name": base_font, "font_size": 11, "bold": True, "font_color": "#1E293B",
            "bg_color": "#E2E8F0", "border": 1, "border_color": "#64748B", "valign": "vcenter", "indent": 1
        }),
        "tbl_desc": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "font_color": "#334155",
            "bg_color": "#F8FAFC", "border": 1, "border_color": "#CBD5E1", "text_wrap": True, "valign": "vcenter"
        }),
        "th_std": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "font_color": "#0F172A",
            "bg_color": "#F1F5F9", "border": 1, "border_color": "#94A3B8", "text_wrap": True, "valign": "vcenter", "align": "center"
        }),
        "th_pk": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "font_color": "#155E75",
            "bg_color": "#CFFAFE", "border": 1, "border_color": "#06B6D4", "text_wrap": True, "valign": "vcenter", "align": "center"
        }),
        "th_fk": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "font_color": "#5B21B6",
            "bg_color": "#EDE9FE", "border": 1, "border_color": "#8B5CF6", "text_wrap": True, "valign": "vcenter", "align": "center"
        }),
        "th_flag": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "font_color": "#854D0E",
            "bg_color": "#FEF08A", "border": 1, "border_color": "#EAB308", "text_wrap": True, "valign": "vcenter", "align": "center"
        }),
        "th_amt": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "font_color": "#3730A3",
            "bg_color": "#E0E7FF", "border": 1, "border_color": "#6366F1", "text_wrap": True, "valign": "vcenter", "align": "center"
        }),
        # データセル通常
        "cell_std": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "font_color": "#1E293B",
            "bg_color": "#FFFFFF", "border": 1, "border_color": "#CBD5E1", "valign": "vcenter", "text_wrap": True
        }),
        "cell_num": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "font_color": "#1E293B",
            "bg_color": "#FFFFFF", "border": 1, "border_color": "#CBD5E1", "valign": "vcenter", "align": "right", "num_format": "#,##0"
        }),
        "cell_null": wb.add_format({
            "font_name": base_font, "font_size": 9, "italic": True, "font_color": "#94A3B8",
            "bg_color": "#FFFFFF", "border": 1, "border_color": "#CBD5E1", "valign": "vcenter", "align": "center"
        }),
        # 新規INSERT行セル
        "cell_ins": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "font_color": "#14532D",
            "bg_color": "#DCFCE7", "border": 1, "border_color": "#86EFAC", "valign": "vcenter", "text_wrap": True
        }),
        "cell_ins_num": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "font_color": "#14532D",
            "bg_color": "#DCFCE7", "border": 1, "border_color": "#86EFAC", "valign": "vcenter", "align": "right", "num_format": "#,##0"
        }),
        "cell_ins_null": wb.add_format({
            "font_name": base_font, "font_size": 9, "italic": True, "font_color": "#4D7C0F",
            "bg_color": "#DCFCE7", "border": 1, "border_color": "#86EFAC", "valign": "vcenter", "align": "center"
        }),
        # 更新UPDATEセル（強調オレンジ）
        "cell_upd": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "bold": True, "font_color": "#9A3412",
            "bg_color": "#FFEDD5", "border": 2, "border_color": "#EA580C", "valign": "vcenter", "text_wrap": True
        }),
        # 状態バッジ列
        "badge_new": wb.add_format({
            "font_name": base_font, "font_size": 9, "bold": True, "font_color": "#FFFFFF",
            "bg_color": "#16A34A", "border": 1, "border_color": "#15803D", "valign": "vcenter", "align": "center"
        }),
        "badge_upd": wb.add_format({
            "font_name": base_font, "font_size": 9, "bold": True, "font_color": "#FFFFFF",
            "bg_color": "#EA580C", "border": 1, "border_color": "#C2410C", "valign": "vcenter", "align": "center"
        }),
        "badge_cur": wb.add_format({
            "font_name": base_font, "font_size": 9, "bold": True, "font_color": "#475569",
            "bg_color": "#E2E8F0", "border": 1, "border_color": "#94A3B8", "valign": "vcenter", "align": "center"
        }),
        "badge_ref": wb.add_format({
            "font_name": base_font, "font_size": 9, "bold": True, "font_color": "#0C4A6E",
            "bg_color": "#E0F2FE", "border": 1, "border_color": "#0284C7", "valign": "vcenter", "align": "center"
        }),
        "step_hdr": wb.add_format({
            "font_name": base_font, "font_size": 11, "bold": True, "font_color": "#FFFFFF",
            "bg_color": "#1D4ED8", "border": 1, "border_color": "#1E40AF", "valign": "vcenter", "indent": 1
        }),
        "step_sub": wb.add_format({
            "font_name": base_font, "font_size": 9.5, "font_color": "#1E293B",
            "bg_color": "#EFF6FF", "border": 1, "border_color": "#93C5FD", "text_wrap": True, "valign": "vcenter"
        }),
    }
    return fmts


CCID_COLS = {
    "CODE_COMBINATION_ID", "GL_ID_REC", "GL_ID_REV", "GL_ID_TAX",
    "CASH_CCID", "UNAPPLIED_CCID", "ON_ACCOUNT_CCID", "UNIDENTIFIED_CCID",
    "REMITTANCE_CCID", "CASH_CLEARING_CCID", "ASSET_CODE_COMBINATION_ID",
    "ACCOUNT_CODE_COMBINATION_ID"
}


def update_col_widths(col_widths: dict, col_idx: int, text_len: int):
    cur = col_widths.get(col_idx, 10)
    col_widths[col_idx] = min(max(cur, text_len + 3), 48)


def write_banner(ws, row: int, ncols: int, title: str, subtitle: str, fmts):
    ws.set_row(row, 28)
    ws.merge_range(row, 0, row, max(ncols - 1, 6), title, fmts["title"])
    ws.set_row(row + 1, 24)
    ws.merge_range(row + 1, 0, row + 1, max(ncols - 1, 6), subtitle, fmts["subtitle"])
    return row + 3


def write_table_block(ws, start_row: int, tbl_meta: dict, rows_list: list, ccid_map: dict, fmts, col_widths: dict, banner_mode: str = "std", step_note: str = "") -> int:
    cols = tbl_meta["columns"]
    total_cols = len(cols) + 2  # 先頭: 行状態, 末尾: AFF/補足
    banner_fmt = fmts["tbl_banner_ins"] if banner_mode == "ins" else fmts["tbl_banner_upd"] if banner_mode == "upd" else fmts["tbl_banner_std"]

    banner_text = f"■ {tbl_meta['name']} （{tbl_meta['jpName']}）  |  PK: {', '.join(tbl_meta['pk'])}"
    if tbl_meta["fks"]:
        banner_text += f"  |  FK: {', '.join(tbl_meta['fks'])}"
    if step_note:
        banner_text += f"  【{step_note}】"

    ws.set_row(start_row, 22)
    ws.merge_range(start_row, 0, start_row, total_cols - 1, banner_text, banner_fmt)
    start_row += 1

    ws.set_row(start_row, 22)
    ws.merge_range(start_row, 0, start_row, total_cols - 1, f"概要: {tbl_meta['description']}", fmts["tbl_desc"])
    start_row += 1

    # カラムヘッダ行
    ws.set_row(start_row, 38)
    ws.write(start_row, 0, "行状態", fmts["th_std"])
    update_col_widths(col_widths, 0, 14)

    for idx, col in enumerate(cols, start=1):
        role = col.get("role", "normal")
        tag = "[PK] " if role == "pk" else "[FK] " if role == "fk" else "[FLAG] " if role == "flag" else "[AMT] " if role == "amount" else ""
        hdr_txt = f"{tag}{col['name']}\n{col['desc']} ({col['type']})"
        th_fmt = fmts["th_pk"] if role == "pk" else fmts["th_fk"] if role == "fk" else fmts["th_flag"] if role == "flag" else fmts["th_amt"] if role == "amount" else fmts["th_std"]
        ws.write(start_row, idx, hdr_txt, th_fmt)
        update_col_widths(col_widths, idx, max(len(col["name"]) + 6, len(col["desc"]) + 4))

    ws.write(start_row, total_cols - 1, "AFF 9セグメント / 補足", fmts["th_std"])
    update_col_widths(col_widths, total_cols - 1, 44)
    start_row += 1

    if not rows_list:
        ws.set_row(start_row, 20)
        ws.merge_range(start_row, 0, start_row, total_cols - 1, "（この時点ではレコード未作成）", fmts["cell_null"])
        return start_row + 2

    for r in rows_list:
        r_state = r["rowState"]
        upd_cols = r.get("updatedCols", {})
        data = r["data"]
        ws.set_row(start_row, 24 if not upd_cols else 30)

        if r_state == "inserted":
            ws.write(start_row, 0, "NEW (INSERT)", fmts["badge_new"])
        elif r_state == "updated":
            ws.write(start_row, 0, "UPD (更新)", fmts["badge_upd"])
        else:
            ws.write(start_row, 0, "既存", fmts["badge_cur"])

        aff_notes = []
        for idx, col in enumerate(cols, start=1):
            cname = col["name"]
            val = data.get(cname)
            if cname in CCID_COLS and val is not None and val in ccid_map:
                cc = ccid_map[val]
                aff_notes.append(f"{cname}={val}: {cc['CONCAT']} ({cc['NAME']})")

            if cname in upd_cols:
                old_v = format_display_val(upd_cols[cname]["before"], col)
                new_v = format_display_val(upd_cols[cname]["after"], col)
                txt = f"{old_v} → {new_v}"
                ws.write(start_row, idx, txt, fmts["cell_upd"])
                update_col_widths(col_widths, idx, len(txt) + 2)
                continue

            is_ins = (r_state == "inserted")
            if val is None:
                ws.write(start_row, idx, "NULL", fmts["cell_ins_null"] if is_ins else fmts["cell_null"])
            elif isinstance(val, (int, float)) and col.get("role") == "amount" and cname not in ("PERCENT", "PERCENTAGE_RATE", "TAX_RATE", "RELATIVE_AMOUNT"):
                ws.write_number(start_row, idx, val, fmts["cell_ins_num"] if is_ins else fmts["cell_num"])
                update_col_widths(col_widths, idx, len(f"{val:,}") + 2)
            elif isinstance(val, (int, float)) and cname in ("PERCENT", "PERCENTAGE_RATE", "TAX_RATE", "RELATIVE_AMOUNT"):
                ws.write(start_row, idx, f"{val}%", fmts["cell_ins"] if is_ins else fmts["cell_std"])
            else:
                ws.write(start_row, idx, val, fmts["cell_ins"] if is_ins else fmts["cell_std"])
                update_col_widths(col_widths, idx, len(str(val)) + 2)

        aff_str = " / ".join(aff_notes) if aff_notes else "-"
        ws.write(start_row, total_cols - 1, aff_str, fmts["cell_ins"] if r_state == "inserted" else fmts["cell_std"])
        update_col_widths(col_widths, total_cols - 1, min(len(aff_str), 46))
        start_row += 1

    return start_row + 1


def build_excel(work_dir: str, out_path: str):
    data = load_data_from_js(work_dir)
    ccid_map = {c["CODE_COMBINATION_ID"]: c for c in data["CCID_LIST"]}
    tbl_by_id = {t["id"]: t for t in data["TABLES"]}
    dom_by_id = {d["id"]: d for d in data["DOMAINS"]}
    snapshots = data["snapshots"]

    wb = xlsxwriter.Workbook(out_path)
    fmts = create_formats(wb)

    # =========================================================================
    # Sheet 0: 00_目次_プロセス解説_AFF定義
    # =========================================================================
    ws0 = wb.add_worksheet("00_目次_プロセス解説_AFF定義")
    w0 = {}
    row = write_banner(
        ws0, 0, 8,
        "Oracle Fusion ERP Financials 26D (OEDMF) AR〜入金・消込〜SLA〜GL転記 データモデル＆処理データ集",
        "公式スキーマ(26D OEDMF)完全準拠 ｜ AFF 9セグメント体系 ｜ 明細1(10%:100,000+10,000)＋明細2(8%:50,000+4,000)＝164,000円",
        fmts,
    )

    # カラー凡例
    ws0.set_row(row, 22)
    ws0.merge_range(row, 0, row, 7, "1. 色分け凡例（プロセス更新・キー種別）", fmts["sec_hdr"])
    row += 1
    legends = [
        ("新規登録 (INSERT)", fmts["badge_new"], "各プロセスで新たにレコードがINSERTされた行（行全体を薄緑色で表示）"),
        ("更新セル (UPDATE)", fmts["badge_upd"], "プロセス進行に伴い値・フラグ・金額がUPDATEされたセル（オレンジ枠で「旧値 → 新値」を表示）"),
        ("主キー [PK]", fmts["th_pk"], "テーブルを一意に識別する主キー項目（水色ヘッダ）"),
        ("外部キー [FK]", fmts["th_fk"], "他テーブルの主キーまたはCCIDを参照する外部キー項目（薄紫ヘッダ）"),
        ("重要フラグ [FLAG]", fmts["th_flag"], "処理状態を制御するステータス・フラグ項目（黄色ヘッダ）"),
        ("金額・数量 [AMT]", fmts["th_amt"], "金額・税額・数量・割合項目（薄青インディゴヘッダ）"),
    ]
    for lbl, fmt, desc in legends:
        ws0.set_row(row, 20)
        ws0.write(row, 0, lbl, fmt)
        ws0.merge_range(row, 1, row, 7, desc, fmts["cell_std"])
        row += 1
    row += 1

    # AFF 9セグメント定義
    ws0.set_row(row, 22)
    ws0.merge_range(row, 0, row, 7, "2. AFF（会計フレックスフィールド）9セグメント体系（CHART_OF_ACCOUNTS_ID = 101）", fmts["sec_hdr"])
    row += 1
    ws0.set_row(row, 22)
    for ci, h in enumerate(["物理カラム", "セグメント論理名", "サンプル値", "解説"]):
        ws0.write(row, ci if ci < 3 else 3, h, fmts["th_std"])
    ws0.merge_range(row, 3, row, 7, "解説", fmts["th_std"])
    row += 1
    for seg in data["AFF_SEGMENTS"]:
        ws0.set_row(row, 20)
        ws0.write(row, 0, seg["seg"], fmts["cell_std"])
        ws0.write(row, 1, seg["name"], fmts["cell_std"])
        ws0.write(row, 2, seg["sample"], fmts["cell_std"])
        ws0.merge_range(row, 3, row, 7, seg["desc"], fmts["cell_std"])
        row += 1
    row += 1

    # CCID マッピング
    ws0.set_row(row, 22)
    ws0.merge_range(row, 0, row, 7, "3. 本シナリオで使用する勘定コード組合せ (GL_CODE_COMBINATIONS) 7件", fmts["sec_hdr"])
    row += 1
    ws0.set_row(row, 22)
    for ci, h in enumerate(["CCID", "勘定タイプ", "勘定科目名称", "AFF 9セグメント結合表記 (会社-部門-勘定-補助-税-管理-備1-備2-備3)"]):
        if ci < 3:
            ws0.write(row, ci, h, fmts["th_std"])
        else:
            ws0.merge_range(row, 3, row, 7, h, fmts["th_std"])
    row += 1
    for cc in data["CCID_LIST"]:
        ws0.set_row(row, 20)
        ws0.write(row, 0, cc["CODE_COMBINATION_ID"], fmts["cell_std"])
        ws0.write(row, 1, cc["ACCOUNT_TYPE_JP"], fmts["cell_std"])
        ws0.write(row, 2, cc["NAME"], fmts["cell_std"])
        ws0.merge_range(row, 3, row, 7, cc["CONCAT"], fmts["cell_std"])
        row += 1
    row += 1

    # プロセス一覧解説
    ws0.set_row(row, 22)
    ws0.merge_range(row, 0, row, 7, "4. プロセス解説サマリ（Step 0 〜 Step 7）", fmts["sec_hdr"])
    row += 1
    ws0.set_row(row, 22)
    ws0.write(row, 0, "ステップ", fmts["th_std"])
    ws0.write(row, 1, "日付", fmts["th_std"])
    ws0.write(row, 2, "プロセス名", fmts["th_std"])
    ws0.merge_range(row, 3, row, 5, "業務・Oracle Fusion内部処理の説明", fmts["th_std"])
    ws0.merge_range(row, 6, row, 7, "新規INSERT / 更新UPDATEテーブル", fmts["th_std"])
    row += 1
    for s in data["STEPS"]:
        ws0.set_row(row, 66)
        ws0.write(row, 0, s["code"], fmts["step_hdr"])
        ws0.write(row, 1, s["dateLabel"], fmts["cell_std"])
        ws0.write(row, 2, f"{s['title']}\n({s['subTitle']})", fmts["cell_std"])
        ws0.merge_range(row, 3, row, 5, "\n".join(s["description"]), fmts["cell_std"])
        ins_txt = "【INSERT】" + (", ".join(s["activeTables"]["inserted"]) or "なし")
        upd_txt = "【UPDATE】" + (", ".join(s["activeTables"]["updated"]) or "なし")
        ws0.merge_range(row, 6, row, 7, f"{ins_txt}\n{upd_txt}", fmts["cell_std"])
        row += 1
    row += 1

    # 全42テーブル一覧
    ws0.set_row(row, 22)
    ws0.merge_range(row, 0, row, 7, f"5. 網羅テーブル全{len(data['TABLES'])}テーブル一覧（Oracle Fusion Financials 26D OEDMF）", fmts["sec_hdr"])
    row += 1
    ws0.set_row(row, 22)
    ws0.write(row, 0, "No.", fmts["th_std"])
    ws0.write(row, 1, "ドメイン", fmts["th_std"])
    ws0.write(row, 2, "物理テーブル名 (26D)", fmts["th_std"])
    ws0.write(row, 3, "論理名", fmts["th_std"])
    ws0.write(row, 4, "主キー (PK)", fmts["th_std"])
    ws0.merge_range(row, 5, row, 7, "テーブル役割・説明", fmts["th_std"])
    row += 1
    for i, tbl in enumerate(data["TABLES"], start=1):
        ws0.set_row(row, 22)
        ws0.write(row, 0, i, fmts["cell_std"])
        ws0.write(row, 1, dom_by_id[tbl["domain"]]["shortName"], fmts["cell_std"])
        ws0.write(row, 2, tbl["name"], fmts["cell_std"])
        ws0.write(row, 3, tbl["jpName"], fmts["cell_std"])
        ws0.write(row, 4, ", ".join(tbl["pk"]), fmts["cell_std"])
        ws0.merge_range(row, 5, row, 7, tbl["description"], fmts["cell_std"])
        row += 1

    for ci, width in enumerate([16, 18, 30, 32, 26, 26, 28, 28]):
        ws0.set_column(ci, ci, width)
    ws0.freeze_panes(2, 0)

    # =========================================================================
    # Sheet 1: 01_プロセス別データ状態遷移
    # =========================================================================
    ws1 = wb.add_worksheet("01_プロセス別データ状態遷移")
    row = write_banner(
        ws1, 0, 7,
        "プロセス別 データ生成・フラグ更新・金額状態遷移ウォークスルー (Step 0 〜 Step 7)",
        "各ステップでどのテーブルのどのカラム・フラグがどのように変化するか（Before → After）を時系列で整理",
        fmts,
    )
    for s in data["STEPS"]:
        ws1.set_row(row, 24)
        ws1.merge_range(row, 0, row, 6, f"{s['code']} ({s['dateLabel']}) ： {s['title']}", fmts["step_hdr"])
        row += 1
        ws1.set_row(row, 48)
        ws1.merge_range(row, 0, row, 6, "\n".join(s["description"]), fmts["step_sub"])
        row += 1

        ws1.set_row(row, 22)
        for ci, h in enumerate(["テーブル名", "対象レコードキー", "カラム名 / フラグ", "変更前 (Before)", "変更後 (After)", "処理種別", "業務的意味・解説"]):
            ws1.write(row, ci, h, fmts["th_std"])
        row += 1

        for fc in s["flagChanges"]:
            ws1.set_row(row, 24)
            is_new = fc["before"] in ("-", "(新規)", "(新規2行)", "(NEW投入)")
            ws1.write(row, 0, fc["table"], fmts["cell_std"])
            ws1.write(row, 1, fc["key"], fmts["cell_std"])
            ws1.write(row, 2, fc["column"], fmts["cell_std"])
            ws1.write(row, 3, fc["before"], fmts["cell_ins"] if is_new else fmts["cell_std"])
            ws1.write(row, 4, fc["after"], fmts["cell_ins"] if is_new else fmts["cell_upd"])
            ws1.write(row, 5, "新規INSERT" if is_new else "更新UPDATE", fmts["badge_new"] if is_new else fmts["badge_upd"])
            ws1.write(row, 6, fc["note"], fmts["cell_std"])
            row += 1
        row += 1

    for ci, width in enumerate([36, 24, 34, 22, 26, 14, 48]):
        ws1.set_column(ci, ci, width)
    ws1.freeze_panes(2, 0)

    # =========================================================================
    # Sheet 2〜4: マスタシート (Step 0 全量)
    # =========================================================================
    master_sheets = [
        ("02_組織_元帳_期間_AFFマスタ", "A. 企業構造・元帳・会計期間・AFF 9セグメントマスタ (6テーブル)", "ORG_GL_MASTER"),
        ("03_顧客マスタ_TCA", "B. 顧客マスタ TCA (4テーブル)", "TCA_MASTER"),
        ("04_AR_税金_銀行_入金マスタ", "C. AR・Fusion Tax税率・銀行口座・入金マスタ (12テーブル)", "AR_TAX_CE_MASTER"),
    ]
    snap0 = snapshots["0"]
    for sheet_name, title, dom_id in master_sheets:
        ws = wb.add_worksheet(sheet_name)
        col_widths = {}
        r = write_banner(ws, 0, 12, title, "Step 0（事前セットアップ済マスタデータ：全テーブル・全項目）", fmts)
        for tbl in data["TABLES"]:
            if tbl["domain"] != dom_id:
                continue
            t_state = snap0["tablesState"][tbl["id"]]
            r = write_table_block(ws, r, tbl, t_state["rows"], ccid_map, fmts, col_widths, banner_mode="ins", step_note="マスタ初期セットアップ")
        for ci, width in col_widths.items():
            ws.set_column(ci, ci, width)
        ws.freeze_panes(2, 0)

    # =========================================================================
    # Sheet 5〜8: トランザクション・SLA・GLシート（プロセス別スナップショット色分け）
    # =========================================================================
    tx_sheets = [
        (
            "05_AR請求トランザクション_税金",
            "D-1. AR請求トランザクション ＆ Fusion Tax 税計算 (4テーブル)",
            "Step 1(下書) → Step 2(請求確定) → Step 5(SLA会計済更新) の状態変化を色分け表示",
            [
                ("STEP 1：ARトランザクション作成（下書保存・税率10%/8%計算・仮配賦）", 1, ["RA_CUSTOMER_TRX_ALL", "RA_CUSTOMER_TRX_LINES_ALL", "ZX_LINES", "RA_CUST_TRX_LINE_GL_DIST_ALL"]),
                ("STEP 2：ARトランザクション完了（COMPLETE_FLAG: N→Y / EVENT_ID=80001 / 本配賦確定）", 2, ["RA_CUSTOMER_TRX_ALL", "RA_CUST_TRX_LINE_GL_DIST_ALL"]),
                ("STEP 5：SLA会計作成後のAR配賦更新（POSTING_CONTROL_ID: -3→9001, GL_POSTED_DATE更新）", 5, ["RA_CUST_TRX_LINE_GL_DIST_ALL"]),
            ],
        ),
        (
            "06_入金_消込_債権残高",
            "D-2. 支払予定・入金・消込・AR配賦 (5テーブル)",
            "Step 2(請求確定) → Step 3(入金UNAPP) → Step 4(消込APP・残高0) → Step 5(SLA会計済更新) の状態変化",
            [
                ("STEP 2：請求確定時の支払予定生成（INV: OP / 164,000円）", 2, ["AR_PAYMENT_SCHEDULES_ALL"]),
                ("STEP 3：入金登録（未消込 UNAPP 計上 / 銀行履歴 CLEARED / PMT: -164,000円）", 3, ["AR_CASH_RECEIPTS_ALL", "AR_CASH_RECEIPT_HISTORY_ALL", "AR_PAYMENT_SCHEDULES_ALL", "AR_RECEIVABLE_APPLICATIONS_ALL", "AR_DISTRIBUTIONS_ALL"]),
                ("STEP 4：消込処理（UNAPP→APP / 残高0・STATUS=CL / UNAPP取消+APP充当の追記）", 4, ["AR_CASH_RECEIPTS_ALL", "AR_PAYMENT_SCHEDULES_ALL", "AR_RECEIVABLE_APPLICATIONS_ALL", "AR_DISTRIBUTIONS_ALL"]),
                ("STEP 5：SLA会計作成後の入金・消込更新（POSTING_CONTROL_ID: -3→9001）", 5, ["AR_CASH_RECEIPT_HISTORY_ALL", "AR_RECEIVABLE_APPLICATIONS_ALL"]),
            ],
        ),
        (
            "07_SLA補助元帳会計_XLA",
            "E. SLA (Subledger Accounting) 補助元帳会計 (5テーブル)",
            "Step 2〜4(イベント起票 U) → Step 5(Create Accounting: P/F/N) → Step 6(GL転送 Y) の遷移",
            [
                ("STEP 2：請求確定時 SLAエンティティ＆イベント起票 (INV_CREATE / U)", 2, ["XLA_TRANSACTION_ENTITIES", "XLA_EVENTS"]),
                ("STEP 3：入金登録時 SLAエンティティ＆イベント起票 (RECP_CREATE / U)", 3, ["XLA_TRANSACTION_ENTITIES", "XLA_EVENTS"]),
                ("STEP 4：消込時 SLAイベント起票 (RECP_UPDATE / U)", 4, ["XLA_EVENTS"]),
                ("STEP 5：Create Accounting実行（イベントU→P / 仕訳3ヘッダ・9明細・9リンク生成）", 5, ["XLA_EVENTS", "XLA_AE_HEADERS", "XLA_AE_LINES", "XLA_DISTRIBUTION_LINKS"]),
                ("STEP 6：GL転送実行後（XLA_AE_HEADERS.GL_TRANSFER_STATUS_CODE: N→Y）", 6, ["XLA_AE_HEADERS"]),
            ],
        ),
        (
            "08_GL総勘定元帳_仕訳_残高",
            "F. GL (General Ledger) 総勘定元帳 仕訳＆勘定残高 (6テーブル)",
            "Step 0(期首残高0) → Step 6(GL転送・Journal Import: STATUS=U) → Step 7(GL転記: STATUS=P, 残高更新)",
            [
                ("STEP 0：転記前の期首残高状態（2026-11 期首・当期発生ともに 0円）", 0, ["GL_BALANCES"]),
                ("STEP 6：GL転送＆Journal Import（I/F→バッチ/ヘッダ/明細(STATUS=U)・参照リンク生成）", 6, ["GL_INTERFACE", "GL_JE_BATCHES", "GL_JE_HEADERS", "GL_JE_LINES", "GL_IMPORT_REFERENCES"]),
                ("STEP 7：GL転記実行後（STATUS: U→P / GL_BALANCES PERIOD_NET_DR/CR 加算完了）", 7, ["GL_JE_BATCHES", "GL_JE_HEADERS", "GL_JE_LINES", "GL_BALANCES"]),
            ],
        ),
    ]

    for sheet_name, title, subtitle, stages in tx_sheets:
        ws = wb.add_worksheet(sheet_name)
        col_widths = {}
        r = write_banner(ws, 0, 14, title, subtitle, fmts)
        for stage_title, s_idx, tbl_ids in stages:
            step_obj = data["STEPS"][s_idx]
            ws.set_row(r, 24)
            ws.merge_range(r, 0, r, 13, stage_title, fmts["step_hdr"])
            r += 1
            ws.set_row(r, 34)
            ws.merge_range(r, 0, r, 13, step_obj["description"][0] + " " + (step_obj["description"][1] if len(step_obj["description"]) > 1 else ""), fmts["step_sub"])
            r += 1

            snap = snapshots[str(s_idx)]
            for tid in tbl_ids:
                tbl = tbl_by_id[tid]
                t_state = snap["tablesState"][tid]
                bmode = "ins" if t_state["tableState"] == "inserted" else "upd" if t_state["tableState"] in ("updated", "inserted_updated") else "std"
                r = write_table_block(ws, r, tbl, t_state["rows"], ccid_map, fmts, col_widths, banner_mode=bmode, step_note=step_obj["code"])
            r += 1

        for ci, width in col_widths.items():
            ws.set_column(ci, ci, width)
        ws.freeze_panes(2, 0)

    # =========================================================================
    # Sheet 9: 09_テーブル結合ER_リレーション一覧
    # =========================================================================
    ws9 = wb.add_worksheet("09_テーブル結合ER_リレーション一覧")
    row = write_banner(
        ws9, 0, 5,
        "Oracle Fusion Financials 26D 全テーブル間結合関係 (ER / PK-FKリレーション一覧)",
        "ARトランザクション〜入金・消込〜SLA〜GLドリルスルーまでの結合SQLキー",
        fmts,
    )
    ws9.set_row(row, 24)
    for ci, h in enumerate(["No.", "元テーブル (From)", "先テーブル (To)", "SQL結合条件 (Join Condition)", "連携の意味"]):
        ws9.write(row, ci, h, fmts["th_std"])
    row += 1
    for idx, rel in enumerate(data["RELATIONS"], start=1):
        ws9.set_row(row, 22)
        ws9.write(row, 0, idx, fmts["cell_std"])
        ws9.write(row, 1, rel["from"], fmts["cell_std"])
        ws9.write(row, 2, rel["to"], fmts["cell_std"])
        ws9.write(row, 3, rel["join"], fmts["cell_std"])
        ws9.write(row, 4, rel["label"], fmts["cell_std"])
        row += 1

    for ci, width in enumerate([6, 32, 32, 68, 28]):
        ws9.set_column(ci, ci, width)
    ws9.freeze_panes(2, 0)

    wb.close()


if __name__ == "__main__":
    work_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(work_dir, "FusionERP_26D_AR_to_GL_DataFlow.xlsx")
    build_excel(work_dir, out_file)
    print(f"Generated Excel successfully: {out_file}")
