#!/usr/bin/env python3
"""
Oracle Fusion ERP Financials 26D (AP請求〜支払・取消・分割〜SLA〜GL転記)
全63テーブル・全カラム・全ステップ状態遷移 Excelブック生成スクリプト
"""

import json
import os
import shutil
import subprocess
import xlsxwriter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS_PATH = os.path.join(SCRIPT_DIR, "data.js")
OUTPUT_XLSX = os.path.join(SCRIPT_DIR, "FusionERP_26D_AP_to_GL_DataFlow.xlsx")

CCID_COLS = {
    "CODE_COMBINATION_ID",
    "ACCTS_PAY_CODE_COMBINATION_ID",
    "PREPAY_CODE_COMBINATION_ID",
    "CASH_CLEARING_CCID",
    "ASSET_CODE_COMBINATION_ID",
    "DEFAULT_DIST_CCID",
    "DIST_CODE_COMBINATION_ID",
}

PERCENT_COLS = {"DUE_PERCENT", "PERCENTAGE_RATE", "TAX_RATE"}

AP_INV_TXN_TABLES = [
    "AP_INVOICES_ALL",
    "AP_INVOICE_LINES_ALL",
    "AP_INVOICE_DISTRIBUTIONS_ALL",
    "ZX_LINES_DET_FACTORS",
    "ZX_LINES",
    "ZX_LINES_SUMMARY",
    "ZX_REC_NREC_DIST",
    "ZX_WITHHOLDING_LINES",
    "AP_AWT_BUCKETS_ALL",
]

AP_PAY_TXN_TABLES = [
    "AP_PAYMENT_SCHEDULES_ALL",
    "AP_INV_SELECTION_CRITERIA_ALL",
    "AP_SELECTED_INVOICES_ALL",
    "IBY_PAY_SERVICE_REQUESTS",
    "IBY_PAY_INSTRUCTIONS_ALL",
    "IBY_PAYMENTS_ALL",
    "IBY_DOCS_PAYABLE_ALL",
    "AP_CHECKS_ALL",
    "AP_INVOICE_PAYMENTS_ALL",
    "AP_PAYMENT_HISTORY_ALL",
    "AP_PAYMENT_HIST_DISTS",
]

SHEET_NAMES = {
    "toc": "00_目次_プロセス解説_AFF定義",
    "matrix": "01_プロセス別データ状態遷移",
    "org": "02_組織_元帳_期間_AFFマスタ",
    "tca": "03_サプライヤマスタ_TCA_POZ",
    "ap_master": "04_AP_税_源泉_銀行_支払マスタ",
    "ap_inv": "05_AP請求_消費税_源泉徴収税",
    "ap_pay": "06_支払予定_一括払_取消_分割払",
    "sla": "07_SLA補助元帳会計_XLA",
    "gl": "08_GL総勘定元帳_仕訳_残高",
    "er": "09_テーブル結合ER_リレーション一覧",
}


def load_data_from_js():
    node_script = """
    const d = require(%s);
    const out = {
      AFF_SEGMENTS: d.AFF_SEGMENTS,
      CCID_LIST: d.CCID_LIST,
      DOMAINS: d.DOMAINS,
      TABLES: d.TABLES,
      RELATIONS: d.RELATIONS,
      STEPS: d.STEPS,
      STEP_COMPUTED: d.STEPS.map(s => d.computeStateAtStep(s.id))
    };
    process.stdout.write(JSON.stringify(out));
    """ % json.dumps(DATA_JS_PATH)
    node_bin = shutil.which("node") or "/opt/homebrew/bin/node"
    raw = subprocess.check_output([node_bin, "-e", node_script], text=True)
    return json.loads(raw)


def build_formats(wb):
    base_font = "Yu Gothic UI"
    mono_font = "Consolas"
    return {
        "title": wb.add_format({
            "bold": True, "font_size": 14, "font_color": "#FFFFFF",
            "bg_color": "#0F172A", "valign": "vcenter", "align": "left",
            "font_name": base_font,
        }),
        "subtitle": wb.add_format({
            "bold": True, "font_size": 10, "font_color": "#CCFBF1",
            "bg_color": "#134E4A", "valign": "vcenter", "align": "left",
            "font_name": base_font,
        }),
        "sec_hdr": wb.add_format({
            "bold": True, "font_size": 11, "font_color": "#0F172A",
            "bg_color": "#E2E8F0", "border": 1, "border_color": "#94A3B8",
            "valign": "vcenter", "font_name": base_font,
        }),
        "tbl_banner_ins": wb.add_format({
            "bold": True, "font_size": 10.5, "font_color": "#065F46",
            "bg_color": "#D1FAE5", "border": 1, "border_color": "#10B981",
            "valign": "vcenter", "font_name": base_font,
        }),
        "tbl_banner_upd": wb.add_format({
            "bold": True, "font_size": 10.5, "font_color": "#92400E",
            "bg_color": "#FEF3C7", "border": 1, "border_color": "#F59E0B",
            "valign": "vcenter", "font_name": base_font,
        }),
        "tbl_banner_ref": wb.add_format({
            "bold": True, "font_size": 10.5, "font_color": "#155E75",
            "bg_color": "#CFFAFE", "border": 1, "border_color": "#06B6D4",
            "valign": "vcenter", "font_name": base_font,
        }),
        "tbl_banner_exist": wb.add_format({
            "bold": True, "font_size": 10.5, "font_color": "#3730A3",
            "bg_color": "#E0E7FF", "border": 1, "border_color": "#6366F1",
            "valign": "vcenter", "font_name": base_font,
        }),
        "tbl_desc": wb.add_format({
            "font_size": 9.5, "font_color": "#475569",
            "bg_color": "#F8FAFC", "border": 1, "border_color": "#CBD5E1",
            "text_wrap": True, "valign": "vcenter", "font_name": base_font,
        }),
        "th_dark": wb.add_format({
            "bold": True, "font_size": 9.5, "font_color": "#FFFFFF",
            "bg_color": "#1E293B", "border": 1, "border_color": "#475569",
            "text_wrap": True, "valign": "vcenter", "align": "center",
            "font_name": base_font,
        }),
        "th_pk": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#1E40AF",
            "bg_color": "#DBEAFE", "border": 1, "border_color": "#93C5FD",
            "text_wrap": True, "valign": "vcenter", "align": "left",
            "font_name": base_font,
        }),
        "th_fk": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#5B21B6",
            "bg_color": "#EDE9FE", "border": 1, "border_color": "#C4B5FD",
            "text_wrap": True, "valign": "vcenter", "align": "left",
            "font_name": base_font,
        }),
        "th_flag": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#92400E",
            "bg_color": "#FEF3C7", "border": 1, "border_color": "#FCD34D",
            "text_wrap": True, "valign": "vcenter", "align": "left",
            "font_name": base_font,
        }),
        "th_aff": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#115E59",
            "bg_color": "#CCFBF1", "border": 1, "border_color": "#5EEAD4",
            "text_wrap": True, "valign": "vcenter", "align": "left",
            "font_name": base_font,
        }),
        "th_amt": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#166534",
            "bg_color": "#DCFCE7", "border": 1, "border_color": "#86EFAC",
            "text_wrap": True, "valign": "vcenter", "align": "right",
            "font_name": base_font,
        }),
        "th_attr": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#0F172A",
            "bg_color": "#F1F5F9", "border": 1, "border_color": "#CBD5E1",
            "text_wrap": True, "valign": "vcenter", "align": "left",
            "font_name": base_font,
        }),
        # Row status badges
        "badge_ins": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#FFFFFF",
            "bg_color": "#059669", "border": 1, "border_color": "#047857",
            "align": "center", "valign": "vcenter", "font_name": base_font,
        }),
        "badge_upd": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#FFFFFF",
            "bg_color": "#D97706", "border": 1, "border_color": "#B45309",
            "align": "center", "valign": "vcenter", "font_name": base_font,
        }),
        "badge_cur": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#334155",
            "bg_color": "#E2E8F0", "border": 1, "border_color": "#CBD5E1",
            "align": "center", "valign": "vcenter", "font_name": base_font,
        }),
        "badge_ref": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#FFFFFF",
            "bg_color": "#0891B2", "border": 1, "border_color": "#0E7490",
            "align": "center", "valign": "vcenter", "font_name": base_font,
        }),
        "badge_exist": wb.add_format({
            "bold": True, "font_size": 9, "font_color": "#FFFFFF",
            "bg_color": "#4F46E5", "border": 1, "border_color": "#4338CA",
            "align": "center", "valign": "vcenter", "font_name": base_font,
        }),
        "badge_none": wb.add_format({
            "font_size": 9, "font_color": "#64748B",
            "bg_color": "#F1F5F9", "border": 1, "border_color": "#CBD5E1",
            "align": "center", "valign": "vcenter", "font_name": base_font,
        }),
        # Data cells
        "ins_cell": wb.add_format({
            "font_size": 9.5, "font_color": "#0F172A", "bg_color": "#ECFDF5",
            "border": 1, "border_color": "#A7F3D0", "valign": "vcenter", "font_name": base_font,
        }),
        "ins_num": wb.add_format({
            "font_size": 9.5, "font_color": "#0F172A", "bg_color": "#ECFDF5",
            "border": 1, "border_color": "#A7F3D0", "valign": "vcenter",
            "align": "right", "num_format": "#,##0", "font_name": mono_font,
        }),
        "upd_row_cell": wb.add_format({
            "font_size": 9.5, "font_color": "#0F172A", "bg_color": "#FFFBEB",
            "border": 1, "border_color": "#FDE68A", "valign": "vcenter", "font_name": base_font,
        }),
        "upd_row_num": wb.add_format({
            "font_size": 9.5, "font_color": "#0F172A", "bg_color": "#FFFBEB",
            "border": 1, "border_color": "#FDE68A", "valign": "vcenter",
            "align": "right", "num_format": "#,##0", "font_name": mono_font,
        }),
        "upd_diff": wb.add_format({
            "bold": True, "font_size": 9.5, "font_color": "#9A3412",
            "bg_color": "#FDE68A", "border": 2, "border_color": "#D97706",
            "valign": "vcenter", "text_wrap": True, "font_name": base_font,
        }),
        "exist_cell": wb.add_format({
            "font_size": 9.5, "font_color": "#0F172A", "bg_color": "#FFFFFF",
            "border": 1, "border_color": "#CBD5E1", "valign": "vcenter", "font_name": base_font,
        }),
        "exist_num": wb.add_format({
            "font_size": 9.5, "font_color": "#0F172A", "bg_color": "#FFFFFF",
            "border": 1, "border_color": "#CBD5E1", "valign": "vcenter",
            "align": "right", "num_format": "#,##0", "font_name": mono_font,
        }),
        "aff_val": wb.add_format({
            "font_size": 9, "font_color": "#0F766E", "bg_color": "#F0FDFA",
            "border": 1, "border_color": "#99F6E4", "valign": "vcenter",
            "font_name": mono_font,
        }),
        "text_wrap": wb.add_format({
            "font_size": 9.5, "font_color": "#0F172A", "bg_color": "#FFFFFF",
            "border": 1, "border_color": "#CBD5E1", "valign": "top",
            "text_wrap": True, "font_name": base_font,
        }),
        "mono_cell": wb.add_format({
            "font_size": 9.5, "font_color": "#0F172A", "bg_color": "#FFFFFF",
            "border": 1, "border_color": "#CBD5E1", "valign": "vcenter",
            "font_name": mono_font,
        }),
        "null_cell": wb.add_format({
            "italic": True, "font_size": 9, "font_color": "#94A3B8",
            "bg_color": "#F8FAFC", "border": 1, "border_color": "#CBD5E1",
            "align": "center", "valign": "vcenter", "font_name": base_font,
        }),
    }


def fmt_scalar(val, col_name):
    if val is None:
        return "NULL"
    if col_name in PERCENT_COLS and isinstance(val, (int, float)):
        return f"{val}%"
    if isinstance(val, (int, float)):
        return f"{val:,}"
    return str(val)


def auto_col_widths(ws, min_w=10, max_w=46):
    # Maintain tracking on worksheet object via a dict
    if hasattr(ws, "_tracked_widths"):
        for col_idx, w in ws._tracked_widths.items():
            ws.set_column(col_idx, col_idx, min(max_w, max(min_w, w + 3)))


def track_width(ws, col_idx, text):
    if not hasattr(ws, "_tracked_widths"):
        ws._tracked_widths = {}
    s = str(text or "")
    # Estimate width considering full-width Japanese characters
    width = sum(1.8 if ord(ch) > 127 else 1.05 for ch in s.split("\n")[0])
    for line in s.split("\n"):
        lw = sum(1.8 if ord(ch) > 127 else 1.05 for ch in line)
        if lw > width:
            width = lw
    prev = ws._tracked_widths.get(col_idx, 8)
    if width > prev:
        ws._tracked_widths[col_idx] = width


def write_sheet_banner(ws, fmt, title_text, subtitle_text, max_col=12):
    ws.set_row(0, 26)
    ws.set_row(1, 20)
    ws.merge_range(0, 0, 0, max_col, title_text, fmt["title"])
    ws.merge_range(1, 0, 1, max_col, subtitle_text, fmt["subtitle"])


def expand_columns_with_aff(cols):
    expanded = []
    for c in cols:
        expanded.append({"kind": "data", "meta": c})
        if c["name"] in CCID_COLS:
            expanded.append({
                "kind": "aff_exp",
                "source_col": c["name"],
                "header": f"{c['name']} [AFF 9セグメント展開]",
                "desc": "AFF 9セグメント & 勘定科目名",
            })
    return expanded


def write_table_block(ws, fmt, row_cursor, tbl_meta, tbl_state_obj, ccid_map, step_label=None):
    table_state = tbl_state_obj["tableState"]
    rows = tbl_state_obj["rows"]
    expanded_cols = expand_columns_with_aff(tbl_meta["columns"])
    total_cols = 1 + len(expanded_cols)

    state_jp_map = {
        "inserted": "INSERT (新規作成)",
        "updated": "UPDATE (更新)",
        "inserted_updated": "INSERT+UPDATE (新規作成&更新)",
        "referenced": "REFERENCED (参照)",
        "existing": "EXISTING (既存)",
        "not_created": "NOT CREATED (未生成)",
    }
    banner_fmt_map = {
        "inserted": fmt["tbl_banner_ins"],
        "updated": fmt["tbl_banner_upd"],
        "inserted_updated": fmt["tbl_banner_upd"],
        "referenced": fmt["tbl_banner_ref"],
        "existing": fmt["tbl_banner_exist"],
    }
    banner_fmt = banner_fmt_map.get(table_state, fmt["sec_hdr"])

    step_prefix = f"[{step_label}] " if step_label else ""
    banner_text = (
        f"{step_prefix}{tbl_meta['id']} ({tbl_meta['jpName']})  |  "
        f"状態: {state_jp_map.get(table_state, table_state)}  |  レコード数: {len(rows)}件"
    )
    ws.set_row(row_cursor, 21)
    ws.merge_range(row_cursor, 0, row_cursor, max(1, total_cols - 1), banner_text, banner_fmt)
    row_cursor += 1

    ws.set_row(row_cursor, 18)
    ws.merge_range(row_cursor, 0, row_cursor, max(1, total_cols - 1), tbl_meta["description"], fmt["tbl_desc"])
    row_cursor += 1

    # Column Headers
    ws.set_row(row_cursor, 34)
    ws.write(row_cursor, 0, "行状態\n(STEP)", fmt["th_dark"])
    track_width(ws, 0, "行状態(STEP)")

    for idx, ec in enumerate(expanded_cols, start=1):
        if ec["kind"] == "aff_exp":
            text = f"{ec['header']}\n({ec['desc']})"
            ws.write(row_cursor, idx, text, fmt["th_aff"])
            track_width(ws, idx, ec["header"])
        else:
            cm = ec["meta"]
            role = cm.get("role", "attr")
            role_tag = f"[{role.upper()}] " if role in {"pk", "fk", "flag", "aff", "amt"} else ""
            text = f"{role_tag}{cm['name']}\n({cm['desc']} | {cm['type']})"
            hfmt = {
                "pk": fmt["th_pk"],
                "fk": fmt["th_fk"],
                "flag": fmt["th_flag"],
                "aff": fmt["th_aff"],
                "amt": fmt["th_amt"],
            }.get(role, fmt["th_attr"])
            ws.write(row_cursor, idx, text, hfmt)
            track_width(ws, idx, f"{role_tag}{cm['name']}")
    row_cursor += 1

    if not rows:
        ws.set_row(row_cursor, 18)
        ws.merge_range(
            row_cursor, 0, row_cursor, max(1, total_cols - 1),
            "（この時点ではレコード未生成）", fmt["null_cell"]
        )
        return row_cursor + 2

    for r in rows:
        ws.set_row(row_cursor, 20)
        rstate = r.get("rowState", "existing")
        upd_cols = r.get("updatedCols", {})
        data = r["data"]

        if rstate == "inserted":
            ws.write(row_cursor, 0, "NEW", fmt["badge_ins"])
            base_fmt = fmt["ins_cell"]
            num_fmt = fmt["ins_num"]
        elif rstate == "updated":
            ws.write(row_cursor, 0, "UPD", fmt["badge_upd"])
            base_fmt = fmt["upd_row_cell"]
            num_fmt = fmt["upd_row_num"]
        else:
            ws.write(row_cursor, 0, "既存", fmt["badge_cur"])
            base_fmt = fmt["exist_cell"]
            num_fmt = fmt["exist_num"]

        for idx, ec in enumerate(expanded_cols, start=1):
            if ec["kind"] == "aff_exp":
                ccid_val = data.get(ec["source_col"])
                ccid_obj = ccid_map.get(ccid_val) if ccid_val is not None else None
                if ccid_obj:
                    txt = f"{ccid_obj['CONCAT']} | {ccid_obj['NAME']}"
                    ws.write(row_cursor, idx, txt, fmt["aff_val"])
                    track_width(ws, idx, txt)
                else:
                    ws.write(row_cursor, idx, "-", fmt["null_cell"])
            else:
                cm = ec["meta"]
                cname = cm["name"]
                val = data.get(cname)
                if cname in upd_cols:
                    diff = upd_cols[cname]
                    diff_txt = f"{fmt_scalar(diff['before'], cname)} → {fmt_scalar(diff['after'], cname)}"
                    ws.write(row_cursor, idx, diff_txt, fmt["upd_diff"])
                    track_width(ws, idx, diff_txt)
                elif val is None:
                    ws.write(row_cursor, idx, "NULL", fmt["null_cell"])
                elif cm.get("role") == "amt" and isinstance(val, (int, float)):
                    ws.write_number(row_cursor, idx, val, num_fmt)
                    track_width(ws, idx, f"{val:,}")
                elif cname in PERCENT_COLS and isinstance(val, (int, float)):
                    ptxt = f"{val}%"
                    ws.write(row_cursor, idx, ptxt, base_fmt)
                    track_width(ws, idx, ptxt)
                else:
                    ws.write(row_cursor, idx, val, base_fmt)
                    track_width(ws, idx, str(val))
        row_cursor += 1

    return row_cursor + 1


def write_sheet_00_toc(wb, fmt, payload, sheet_of_table):
    ws = wb.add_worksheet(SHEET_NAMES["toc"])
    ws.freeze_panes(2, 0)
    write_sheet_banner(
        ws, fmt,
        "Oracle Fusion ERP Financials 26D | AP請求〜支払・取消(Void)・分割〜SLA〜GL転記 全データ一覧",
        "AFF体系: 会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3 | 全63テーブル・全9ステップ網羅",
        max_col=7,
    )

    r = 3
    # Scenario summary
    ws.set_row(r, 20)
    ws.merge_range(r, 0, r, 7, "1. 業務シナリオ & 計算ロジック・色分け凡例", fmt["sec_hdr"])
    r += 1

    summary_lines = [
        ("検証スキーマ", "Oracle Fusion Cloud ERP Financials 26D (OEDMF 26D 公式テーブル・カラムのみ使用)"),
        ("サプライヤ / 請求書", "株式会社テックパートナーズ (VENDOR_ID=3001) / AP-INV-2026-0001 (INVOICE_ID=50001, 通貨JPY, 税込総額 2,180,000円)"),
        ("明細1 (標準税率10%)", "税抜 1,000,000円 (CCID:5001) + 仮払消費税10% 100,000円 (CCID:1501) - 源泉徴収税10.21%(100万円まで部分) 102,100円 (CCID:2201) = 正味支払額 997,900円"),
        ("明細2 (軽減税率8%)", "税抜 1,000,000円 (CCID:5002) + 仮払消費税8% 80,000円 (CCID:1502) - 源泉徴収税20.42%(100万円超部分) 204,200円 (CCID:2202) = 正味支払額 875,800円"),
        ("支払・取消・分割シナリオ", "初回に合計 1,873,700円 を一括支払(CHECK_NUMBER=1001 / CHECK_ID=70001) → 初回支払取消(Void: NEGOTIABLE→VOIDED, REVERSAL_FLAG: N→Y) → 支払予定を明細ごとに2分割(997,900円 / 875,800円) → 2回の分割支払(CHECK_NUMBER=1002 / CHECK_NUMBER=1003)で完済 → SLA会計作成 → GL転記"),
        ("色分け凡例", "緑 (INSERT)=新規行作成 / 橙・濃黄セル (UPDATE)=フラグ・金額・状態更新 (変更前 → 変更後表記) / 水色=マスタ参照 / 薄緑=CCIDのAFF 9セグメント展開列"),
    ]
    for k, v in summary_lines:
        ws.set_row(r, 20)
        ws.write(r, 0, k, fmt["th_attr"])
        ws.merge_range(r, 1, r, 7, v, fmt["text_wrap"])
        track_width(ws, 0, k)
        r += 1

    r += 1
    ws.set_row(r, 20)
    ws.merge_range(r, 0, r, 7, "2. 処理ステップ一覧 (STEP 0 〜 STEP 8)", fmt["sec_hdr"])
    r += 1

    step_hdrs = ["ステップ", "日付", "プロセス名", "サブタイトル", "プロセス解説", "主なフラグ・状態変化", "会計仕訳イメージ"]
    ws.set_row(r, 24)
    for idx, h in enumerate(step_hdrs):
        ws.write(r, idx, h, fmt["th_dark"])
        track_width(ws, idx, h)
    ws.write(r, 7, "更新/新規テーブル数", fmt["th_dark"])
    r += 1

    for idx, st in enumerate(payload["STEPS"]):
        comp = payload["STEP_COMPUTED"][idx]
        ins_c = sum(1 for v in comp["tablesState"].values() if v["tableState"] in ("inserted", "inserted_updated"))
        upd_c = sum(1 for v in comp["tablesState"].values() if v["tableState"] in ("updated", "inserted_updated"))
        ref_c = sum(1 for v in comp["tablesState"].values() if v["tableState"] == "referenced")

        fc_text = "\n".join(
            f"• {f['table']}.{f['column']}: {f['before']} → {f['after']}"
            for f in st.get("flagChanges", [])
        ) or "-"
        jp_text = "\n".join(
            f"{g['note']} " + ", ".join(f"[{l['side']}] {l['name']} {l['amount']:,}" for l in g["lines"])
            for g in st.get("journalPreview", [])
        ) or "（仕訳未発生）"

        desc_val = st["description"]
        if isinstance(desc_val, list):
            desc_text = "\n".join(f"• {line}" for line in desc_val)
        else:
            desc_text = str(desc_val or "")

        ws.set_row(r, 78)
        ws.write(r, 0, st["code"], fmt["badge_ins"] if idx == 0 else fmt["badge_exist"])
        ws.write(r, 1, st["dateLabel"], fmt["exist_cell"])
        ws.write(r, 2, st["title"], fmt["text_wrap"])
        ws.write(r, 3, st["subTitle"], fmt["text_wrap"])
        ws.write(r, 4, desc_text, fmt["text_wrap"])
        ws.write(r, 5, fc_text, fmt["text_wrap"])
        ws.write(r, 6, jp_text, fmt["text_wrap"])
        ws.write(r, 7, f"新規:{ins_c} / 更新:{upd_c} / 参照:{ref_c}", fmt["exist_cell"])
        r += 1

    r += 1
    ws.set_row(r, 20)
    ws.merge_range(r, 0, r, 7, "3. AFF 9セグメント体系定義 (CHART_OF_ACCOUNTS_ID = 101)", fmt["sec_hdr"])
    r += 1
    for idx, h in enumerate(["セグメント", "論理名", "サンプル値", "役割・定義内容"]):
        ws.write(r, idx, h, fmt["th_dark"])
    ws.merge_range(r, 3, r, 7, "役割・定義内容", fmt["th_dark"])
    ws.set_row(r, 22)
    r += 1
    for seg in payload["AFF_SEGMENTS"]:
        ws.set_row(r, 20)
        ws.write(r, 0, seg["seg"], fmt["mono_cell"])
        ws.write(r, 1, seg["name"], fmt["exist_cell"])
        ws.write(r, 2, seg["sample"], fmt["mono_cell"])
        ws.merge_range(r, 3, r, 7, seg["desc"], fmt["exist_cell"])
        r += 1

    r += 1
    ws.set_row(r, 20)
    ws.merge_range(r, 0, r, 7, "4. 勘定コード組合せ一覧 (GL_CODE_COMBINATIONS 全8CCID)", fmt["sec_hdr"])
    r += 1
    ws.set_row(r, 22)
    for idx, h in enumerate(["CCID", "AFF 9セグメント結合", "勘定タイプ", "勘定科目名・用途", "SEGMENT1..9 内訳"]):
        ws.write(r, idx, h, fmt["th_dark"])
    ws.merge_range(r, 4, r, 7, "SEGMENT1..9 内訳", fmt["th_dark"])
    r += 1
    for c in payload["CCID_LIST"]:
        ws.set_row(r, 20)
        ws.write_number(r, 0, c["CODE_COMBINATION_ID"], fmt["exist_num"])
        ws.write(r, 1, c["CONCAT"], fmt["aff_val"])
        ws.write(r, 2, c["ACCOUNT_TYPE_JP"], fmt["exist_cell"])
        ws.write(r, 3, c["NAME"], fmt["exist_cell"])
        segs = f"会:{c['SEGMENT1']} 部:{c['SEGMENT2']} 科:{c['SEGMENT3']} 補:{c['SEGMENT4']} 税:{c['SEGMENT5']} 管:{c['SEGMENT6']} 備1:{c['SEGMENT7']} 備2:{c['SEGMENT8']} 備3:{c['SEGMENT9']}"
        ws.merge_range(r, 4, r, 7, segs, fmt["mono_cell"])
        r += 1

    r += 1
    ws.set_row(r, 20)
    ws.merge_range(r, 0, r, 7, "5. 全63テーブル一覧 & 収録シート索引", fmt["sec_hdr"])
    r += 1
    ws.set_row(r, 22)
    for idx, h in enumerate(["#", "領域", "物理テーブル名 (26D)", "日本語テーブル名", "区分", "説明", "列数", "収録シート"]):
        ws.write(r, idx, h, fmt["th_dark"])
    r += 1

    dom_map = {d["id"]: d["shortName"] for d in payload["DOMAINS"]}
    master_doms = {"ORG_GL_MASTER", "TCA_POZ_MASTER", "AP_TAX_PAY_MASTER"}
    for i, t in enumerate(payload["TABLES"], start=1):
        ws.set_row(r, 20)
        ws.write_number(r, 0, i, fmt["exist_num"])
        ws.write(r, 1, dom_map.get(t["domain"], t["domain"]), fmt["exist_cell"])
        ws.write(r, 2, t["id"], fmt["mono_cell"])
        ws.write(r, 3, t["jpName"], fmt["exist_cell"])
        ws.write(r, 4, "マスタ" if t["domain"] in master_doms else "トランザクション", fmt["exist_cell"])
        ws.write(r, 5, t["description"], fmt["text_wrap"])
        ws.write_number(r, 6, len(t["columns"]), fmt["exist_num"])
        ws.write(r, 7, sheet_of_table[t["id"]], fmt["aff_val"])
        r += 1

    ws.set_column(0, 0, 22)
    ws.set_column(1, 1, 28)
    ws.set_column(2, 2, 34)
    ws.set_column(3, 3, 28)
    ws.set_column(4, 4, 46)
    ws.set_column(5, 5, 44)
    ws.set_column(6, 6, 44)
    ws.set_column(7, 7, 30)


def write_sheet_01_matrix(wb, fmt, payload, sheet_of_table):
    ws = wb.add_worksheet(SHEET_NAMES["matrix"])
    ws.freeze_panes(4, 3)
    steps = payload["STEPS"]
    max_col = 3 + len(steps) + 1
    write_sheet_banner(
        ws, fmt,
        "全63テーブル × STEP 0〜8 データ状態遷移マトリクス & フラグ/金額変化一覧",
        "各ステップにおける全63テーブルの操作種別 (INSERT / UPDATE / REF / 既存 / 未生成) とレコード件数を色分け表示",
        max_col=max_col,
    )

    r = 3
    ws.set_row(r, 30)
    hdrs = ["領域", "物理テーブル名", "日本語名"] + [f"{s['code']}\n{s['shortTitle']}" for s in steps] + ["Step8件数", "収録シート"]
    for idx, h in enumerate(hdrs):
        ws.write(r, idx, h, fmt["th_dark"])
        track_width(ws, idx, h)
    r += 1

    dom_map = {d["id"]: d["shortName"] for d in payload["DOMAINS"]}
    comp_list = payload["STEP_COMPUTED"]

    for t in payload["TABLES"]:
        ws.set_row(r, 19)
        tid = t["id"]
        ws.write(r, 0, dom_map.get(t["domain"], t["domain"]), fmt["exist_cell"])
        ws.write(r, 1, tid, fmt["mono_cell"])
        ws.write(r, 2, t["jpName"], fmt["exist_cell"])
        track_width(ws, 0, dom_map.get(t["domain"], ""))
        track_width(ws, 1, tid)
        track_width(ws, 2, t["jpName"])

        for s_idx in range(len(steps)):
            ts = comp_list[s_idx]["tablesState"][tid]
            st_name = ts["tableState"]
            cnt = len(ts["rows"])
            if st_name == "inserted":
                ws.write(r, 3 + s_idx, f"INSERT({cnt})", fmt["badge_ins"])
            elif st_name == "updated":
                ws.write(r, 3 + s_idx, f"UPDATE({cnt})", fmt["badge_upd"])
            elif st_name == "inserted_updated":
                ws.write(r, 3 + s_idx, f"INS+UPD({cnt})", fmt["badge_upd"])
            elif st_name == "referenced":
                ws.write(r, 3 + s_idx, f"REF({cnt})", fmt["badge_ref"])
            elif st_name == "existing":
                ws.write(r, 3 + s_idx, f"既存({cnt})", fmt["badge_exist"])
            else:
                ws.write(r, 3 + s_idx, "-", fmt["badge_none"])

        final_cnt = len(comp_list[-1]["tablesState"][tid]["rows"])
        ws.write_number(r, 3 + len(steps), final_cnt, fmt["exist_num"])
        ws.write(r, 4 + len(steps), sheet_of_table[tid], fmt["aff_val"])
        track_width(ws, 4 + len(steps), sheet_of_table[tid])
        r += 1

    r += 1
    ws.set_row(r, 22)
    ws.merge_range(r, 0, r, max_col, "ステップ別 主要フラグ・ステータス・金額変更サマリー (STEP 0 〜 STEP 8)", fmt["sec_hdr"])
    r += 1
    ws.set_row(r, 24)
    f_hdrs = ["ステップ", "テーブル", "レコードキー", "更新カラム", "変更前 (Before)", "変更後 (After)", "解説"]
    for idx, h in enumerate(f_hdrs):
        ws.write(r, idx, h, fmt["th_dark"])
    ws.merge_range(r, 6, r, max_col, "解説", fmt["th_dark"])
    r += 1

    for st in steps:
        for fc in st.get("flagChanges", []):
            ws.set_row(r, 22)
            ws.write(r, 0, st["code"], fmt["badge_exist"])
            ws.write(r, 1, fc["table"], fmt["mono_cell"])
            ws.write(r, 2, fc["key"], fmt["mono_cell"])
            ws.write(r, 3, fc["column"], fmt["mono_cell"])
            ws.write(r, 4, fc["before"], fmt["null_cell"])
            ws.write(r, 5, fc["after"], fmt["upd_diff"])
            ws.merge_range(r, 6, r, max_col, fc["note"], fmt["exist_cell"])
            r += 1

    auto_col_widths(ws, min_w=12, max_w=36)


def write_master_domain_sheet(wb, fmt, sheet_name, title, subtitle, tables, step0_state, ccid_map):
    ws = wb.add_worksheet(sheet_name)
    ws.freeze_panes(2, 0)
    write_sheet_banner(ws, fmt, title, subtitle, max_col=12)
    r = 3
    for t in tables:
        r = write_table_block(ws, fmt, r, t, step0_state["tablesState"][t["id"]], ccid_map, step_label="STEP 0 マスタ基盤")
    auto_col_widths(ws, min_w=11, max_w=46)


def write_timeline_txn_sheet(wb, fmt, sheet_name, title, subtitle, table_ids, payload, ccid_map):
    ws = wb.add_worksheet(sheet_name)
    ws.freeze_panes(2, 0)
    write_sheet_banner(ws, fmt, title, subtitle, max_col=14)
    tbl_meta_map = {t["id"]: t for t in payload["TABLES"]}
    steps = payload["STEPS"]
    comp_list = payload["STEP_COMPUTED"]

    r = 3
    # Part 1: Step-by-step chronological snapshots whenever a table in table_ids is inserted/updated/created
    ws.set_row(r, 22)
    ws.merge_range(r, 0, r, 14, "【パート1】 プロセス進行順 (INSERT / UPDATE 発生ステップごとのデータ推移と前後比較)", fmt["sec_hdr"])
    r += 2

    for s_idx, st in enumerate(steps):
        active_for_step = []
        for tid in table_ids:
            ts = comp_list[s_idx]["tablesState"][tid]
            if ts["tableState"] in ("inserted", "updated", "inserted_updated"):
                active_for_step.append((tid, ts))
        if not active_for_step:
            continue
        ws.set_row(r, 22)
        ws.merge_range(r, 0, r, 14, f"{st['code']} ({st['dateLabel']}) — {st['title']} | {st['subTitle']}", fmt["sec_hdr"])
        r += 1
        for tid, ts in active_for_step:
            r = write_table_block(ws, fmt, r, tbl_meta_map[tid], ts, ccid_map, step_label=st["code"])

    # Part 2: Final state snapshot of all tables in this sheet
    ws.set_row(r, 22)
    ws.merge_range(r, 0, r, 14, "【パート2】 全処理完了後 (STEP 8 最終時点) の該当全テーブル確定スナップショット", fmt["sec_hdr"])
    r += 2
    final_comp = comp_list[-1]
    for tid in table_ids:
        r = write_table_block(ws, fmt, r, tbl_meta_map[tid], final_comp["tablesState"][tid], ccid_map, step_label="STEP 8 最終")

    auto_col_widths(ws, min_w=10, max_w=46)


def write_sheet_09_er(wb, fmt, payload):
    ws = wb.add_worksheet(SHEET_NAMES["er"])
    ws.freeze_panes(4, 0)
    write_sheet_banner(
        ws, fmt,
        "Oracle Fusion Financials 26D AP系テーブル結合関係 (ERリレーション 全58リンク)",
        "請求計上・消費税(ZX)・段階源泉(AWT)・銀行(CE)・支払(IBY/AP)・支払取消/分割・SLA(XLA)・GL間の主キー/外部キー結合一覧",
        max_col=5,
    )
    r = 3
    ws.set_row(r, 24)
    hdrs = ["No.", "親 / 参照元テーブル", "子 / 参照先テーブル", "JOIN条件 (26D実在カラム)", "リレーションの意味・業務上の役割"]
    for idx, h in enumerate(hdrs):
        ws.write(r, idx, h, fmt["th_dark"])
    ws.merge_range(r, 4, r, 5, "リレーションの意味・業務上の役割", fmt["th_dark"])
    r += 1

    for i, rel in enumerate(payload["RELATIONS"], start=1):
        ws.set_row(r, 20)
        ws.write_number(r, 0, i, fmt["exist_num"])
        ws.write(r, 1, rel["from"], fmt["mono_cell"])
        ws.write(r, 2, rel["to"], fmt["mono_cell"])
        ws.write(r, 3, rel["join"], fmt["mono_cell"])
        ws.merge_range(r, 4, r, 5, rel["label"], fmt["exist_cell"])
        track_width(ws, 1, rel["from"])
        track_width(ws, 2, rel["to"])
        track_width(ws, 3, rel["join"])
        track_width(ws, 4, rel["label"])
        r += 1

    ws.set_column(0, 0, 7)
    ws.set_column(1, 1, 34)
    ws.set_column(2, 2, 34)
    ws.set_column(3, 3, 52)
    ws.set_column(4, 5, 28)


def build_excel():
    payload = load_data_from_js()
    ccid_map = {c["CODE_COMBINATION_ID"]: c for c in payload["CCID_LIST"]}
    step0_state = payload["STEP_COMPUTED"][0]

    # Map each of 63 tables to its containing Excel sheet
    sheet_of_table = {}
    for t in payload["TABLES"]:
        tid = t["id"]
        dom = t["domain"]
        if dom == "ORG_GL_MASTER":
            sheet_of_table[tid] = SHEET_NAMES["org"]
        elif dom == "TCA_POZ_MASTER":
            sheet_of_table[tid] = SHEET_NAMES["tca"]
        elif dom == "AP_TAX_PAY_MASTER":
            sheet_of_table[tid] = SHEET_NAMES["ap_master"]
        elif dom == "SLA_XLA":
            sheet_of_table[tid] = SHEET_NAMES["sla"]
        elif dom == "GL_LEDGER":
            sheet_of_table[tid] = SHEET_NAMES["gl"]
        elif tid in AP_INV_TXN_TABLES:
            sheet_of_table[tid] = SHEET_NAMES["ap_inv"]
        elif tid in AP_PAY_TXN_TABLES:
            sheet_of_table[tid] = SHEET_NAMES["ap_pay"]
        else:
            raise ValueError(f"Unmapped table id: {tid}")

    wb = xlsxwriter.Workbook(OUTPUT_XLSX)
    fmt = build_formats(wb)

    # 00 & 01
    write_sheet_00_toc(wb, fmt, payload, sheet_of_table)
    write_sheet_01_matrix(wb, fmt, payload, sheet_of_table)

    # 02, 03, 04 (Master domains)
    org_tables = [t for t in payload["TABLES"] if t["domain"] == "ORG_GL_MASTER"]
    tca_tables = [t for t in payload["TABLES"] if t["domain"] == "TCA_POZ_MASTER"]
    ap_m_tables = [t for t in payload["TABLES"] if t["domain"] == "AP_TAX_PAY_MASTER"]

    write_master_domain_sheet(
        wb, fmt, SHEET_NAMES["org"],
        "A. 組織・元帳・会計期間・AFFマスタ (ORG_GL_MASTER 全6テーブル)",
        "STEP 0 初期セットアップ: 法的実体(XLE), BU(HR/FUN), 元帳(GL_LEDGERS), 期間(GL_PERIOD_STATUSES), 9セグメントCCID(GL_CODE_COMBINATIONS)",
        org_tables, step0_state, ccid_map,
    )
    write_master_domain_sheet(
        wb, fmt, SHEET_NAMES["tca"],
        "B. サプライヤマスタ TCA & POZ (TCA_POZ_MASTER 全6テーブル)",
        "STEP 0 初期セットアップ: HZ_PARTIES, HZ_LOCATIONS, HZ_PARTY_SITES, POZ_SUPPLIERS, POZ_SUPPLIER_SITES_ALL_M, POZ_SITE_ASSIGNMENTS_ALL_M",
        tca_tables, step0_state, ccid_map,
    )
    write_master_domain_sheet(
        wb, fmt, SHEET_NAMES["ap_master"],
        "C. AP設定・消費税(ZX)・段階源泉(AWT)・銀行(CE)・支払(IBY)マスタ (全20テーブル)",
        "STEP 0 初期セットアップ: 支払条件(AP_TERMS_*), システム設定, ZX税マスタ(10%/8%), 源泉徴収段階税(10.21%/20.42%), 銀行口座(CE), IBY支払方法/プロファイル",
        ap_m_tables, step0_state, ccid_map,
    )

    # 05, 06, 07, 08 (Transaction timelines)
    write_timeline_txn_sheet(
        wb, fmt, SHEET_NAMES["ap_inv"],
        "D-1. AP請求書・消費税(10%/8%)・段階源泉税(10.21%/20.42%) トランザクション (9テーブル)",
        "STEP 1(作成) → STEP 2(検証・税/源泉確定) → STEP 3〜6(支払ステータス・支払済金額変化) → STEP 7(SLA連携済み更新)",
        AP_INV_TXN_TABLES, payload, ccid_map,
    )
    write_timeline_txn_sheet(
        wb, fmt, SHEET_NAMES["ap_pay"],
        "D-2. 支払予定・初回一括支払・取消(Void)＆明細2分割・分割支払1/2 トランザクション (11テーブル)",
        "STEP 2(予定1行) → STEP 3(PPR-01一括支払 CHK-1001) → STEP 4(Void取消+予定2分割) → STEP 5(CHK-1002) → STEP 6(CHK-1003完済) → STEP 7(SLA済)",
        AP_PAY_TXN_TABLES, payload, ccid_map,
    )
    sla_tables = [t["id"] for t in payload["TABLES"] if t["domain"] == "SLA_XLA"]
    write_timeline_txn_sheet(
        wb, fmt, SHEET_NAMES["sla"],
        "E. SLA (Subledger Accounting / XLA) 補助元帳データ遷移 (5テーブル)",
        "STEP 2〜6(イベントU蓄積) → STEP 7(Create Accounting: イベントP, 5ヘッダ, 15仕訳明細, 24監査リンク) → STEP 8(GL_TRANSFER_STATUS_CODE N→Y)",
        sla_tables, payload, ccid_map,
    )
    gl_tables = [t["id"] for t in payload["TABLES"] if t["domain"] == "GL_LEDGER"]
    write_timeline_txn_sheet(
        wb, fmt, SHEET_NAMES["gl"],
        "F. GL (General Ledger) 総勘定元帳・転記・残高更新 (6テーブル)",
        "STEP 0(GL_BALANCES 期首0円) → STEP 8(GL_INTERFACE 15行インポート → GL_JE_* 転記済P → GL_BALANCES DR=CR=7,801,100円, 買掛金期末=0)",
        gl_tables, payload, ccid_map,
    )

    # 09 ER
    write_sheet_09_er(wb, fmt, payload)

    wb.close()
    print(f"Generated Excel successfully: {OUTPUT_XLSX}")


if __name__ == "__main__":
    build_excel()
