#!/usr/bin/env python3
"""
Oracle Fusion ERP Financials 26D (OEDMF準拠)
AP前払請求(PREPAY)〜支払〜標準請求〜前払充当〜SLA〜GL転記
全65テーブル・全項目データ＆プロセス更新色分け Excel 生成スクリプト
"""

import json
import os
import subprocess
import sys
import xlsxwriter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS = os.path.join(SCRIPT_DIR, "data.js")
OUTPUT_XLSX = os.path.join(SCRIPT_DIR, "FusionERP_26D_AP_PREPAY_to_GL_DataFlow.xlsx")
NODE_BIN = "/opt/homebrew/bin/node" if os.path.exists("/opt/homebrew/bin/node") else "node"

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
    "AP_PAYMENT_SCHEDULES_ALL",
]

AP_PAY_TXN_TABLES = [
    "AP_INV_SELECTION_CRITERIA_ALL",
    "AP_SELECTED_INVOICES_ALL",
    "IBY_PAY_SERVICE_REQUESTS",
    "IBY_DOCS_PAYABLE_ALL",
    "IBY_PAY_INSTRUCTIONS_ALL",
    "IBY_PAYMENTS_ALL",
    "AP_CHECKS_ALL",
    "AP_INVOICE_PAYMENTS_ALL",
    "AP_PAYMENT_HISTORY_ALL",
    "AP_PAYMENT_HIST_DISTS",
    "AP_PREPAY_HISTORY_ALL",
    "AP_PREPAY_APP_DISTS",
]

PERCENT_COLS = {"DUE_PERCENT", "PERCENTAGE_RATE", "TAX_RATE"}

SHEET_NAMES = {
    "INDEX": "00_目次_プロセス解説_AFF定義",
    "MATRIX": "01_プロセス別データ状態遷移",
    "ORG": "02_組織_元帳_期間_AFFマスタ",
    "TCA": "03_サプライヤマスタ_TCA_POZ",
    "MASTER": "04_AP_税_源泉_銀行_支払マスタ",
    "AP_INV": "05_AP前払_標準請求_税_源泉",
    "AP_PAY": "06_支払_前払充当_履歴",
    "SLA": "07_SLA補助元帳会計_XLA",
    "GL": "08_GL総勘定元帳_仕訳_残高",
    "REL": "09_テーブル結合ER_リレーション一覧",
}


def load_data_from_js():
    js_script = """
    const d = require(process.argv[1]);
    const states = d.STEPS.map((s) => d.computeStateAtStep(s.id));
    const payload = {
      AFF_SEGMENTS: d.AFF_SEGMENTS,
      CCID_LIST: d.CCID_LIST,
      DOMAINS: d.DOMAINS,
      TABLES: d.TABLES,
      RELATIONS: d.RELATIONS,
      TABLE_RECORDS: d.TABLE_RECORDS,
      STEPS: d.STEPS,
      STATES: states
    };
    process.stdout.write(JSON.stringify(payload));
    """
    proc = subprocess.run(
        [NODE_BIN, "-e", js_script, DATA_JS],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout)


def create_formats(wb):
    f = {}
    base = {"font_name": "Meiryo UI", "font_size": 10}

    f["title"] = wb.add_format({**base, "bold": True, "font_size": 14, "font_color": "#FFFFFF", "bg_color": "#0F172A", "valign": "vcenter", "indent": 1})
    f["subtitle"] = wb.add_format({**base, "font_size": 10, "font_color": "#E2E8F0", "bg_color": "#1E293B", "valign": "vcenter", "indent": 1})
    f["sec_hdr"] = wb.add_format({**base, "bold": True, "font_size": 11, "font_color": "#FFFFFF", "bg_color": "#1E3A8A", "valign": "vcenter", "indent": 1})
    f["tbl_banner"] = wb.add_format({**base, "bold": True, "font_size": 10.5, "font_color": "#0F172A", "bg_color": "#DBEAFE", "border": 1, "border_color": "#93C5FD", "valign": "vcenter", "indent": 1})
    f["tbl_sub"] = wb.add_format({**base, "font_size": 9.5, "font_color": "#334155", "bg_color": "#F8FAFC", "border": 1, "border_color": "#CBD5E1", "valign": "vcenter", "text_wrap": True})

    f["th"] = wb.add_format({**base, "bold": True, "font_size": 9.5, "font_color": "#FFFFFF", "bg_color": "#0F172A", "border": 1, "border_color": "#334155", "align": "center", "valign": "vcenter", "text_wrap": True})
    f["th_sub"] = wb.add_format({**base, "font_size": 8.5, "font_color": "#CBD5E1", "bg_color": "#1E293B", "border": 1, "border_color": "#334155", "align": "center", "valign": "vcenter", "text_wrap": True})

    f["td"] = wb.add_format({**base, "font_size": 9.5, "border": 1, "border_color": "#CBD5E1", "valign": "vcenter"})
    f["td_wrap"] = wb.add_format({**base, "font_size": 9.5, "border": 1, "border_color": "#CBD5E1", "valign": "vcenter", "text_wrap": True})
    f["td_center"] = wb.add_format({**base, "font_size": 9.5, "border": 1, "border_color": "#CBD5E1", "align": "center", "valign": "vcenter"})
    f["td_amt"] = wb.add_format({**base, "font_size": 9.5, "border": 1, "border_color": "#CBD5E1", "num_format": "#,##0", "align": "right", "valign": "vcenter"})
    f["td_pct"] = wb.add_format({**base, "font_size": 9.5, "border": 1, "border_color": "#CBD5E1", "num_format": '0.##"%"', "align": "right", "valign": "vcenter"})
    f["td_null"] = wb.add_format({**base, "font_size": 9, "font_color": "#94A3B8", "italic": True, "border": 1, "border_color": "#CBD5E1", "align": "center", "valign": "vcenter"})

    # 更新・新規ハイライト系
    f["td_new_badge"] = wb.add_format({**base, "bold": True, "font_size": 9, "font_color": "#065F46", "bg_color": "#D1FAE5", "border": 1, "border_color": "#6EE7B7", "align": "center", "valign": "vcenter"})
    f["td_upd_badge"] = wb.add_format({**base, "bold": True, "font_size": 9, "font_color": "#92400E", "bg_color": "#FEF3C7", "border": 1, "border_color": "#FCD34D", "align": "center", "valign": "vcenter"})

    # セル単位の変更強調（オレンジ背景）
    f["cell_upd"] = wb.add_format({**base, "bold": True, "font_size": 9.5, "font_color": "#78350F", "bg_color": "#FDE68A", "border": 1, "border_color": "#F59E0B", "valign": "vcenter"})
    f["cell_upd_amt"] = wb.add_format({**base, "bold": True, "font_size": 9.5, "font_color": "#78350F", "bg_color": "#FDE68A", "border": 1, "border_color": "#F59E0B", "num_format": "#,##0", "align": "right", "valign": "vcenter"})
    f["cell_upd_pct"] = wb.add_format({**base, "bold": True, "font_size": 9.5, "font_color": "#78350F", "bg_color": "#FDE68A", "border": 1, "border_color": "#F59E0B", "num_format": '0.##"%"', "align": "right", "valign": "vcenter"})

    # マトリックス・ステップ別の色分けバッジ
    f["st_insert"] = wb.add_format({**base, "bold": True, "font_size": 9, "font_color": "#065F46", "bg_color": "#D1FAE5", "border": 1, "border_color": "#6EE7B7", "align": "center", "valign": "vcenter"})
    f["st_update"] = wb.add_format({**base, "bold": True, "font_size": 9, "font_color": "#92400E", "bg_color": "#FEF3C7", "border": 1, "border_color": "#FCD34D", "align": "center", "valign": "vcenter"})
    f["st_ins_upd"] = wb.add_format({**base, "bold": True, "font_size": 9, "font_color": "#9A3412", "bg_color": "#FFEDD5", "border": 1, "border_color": "#FB923C", "align": "center", "valign": "vcenter"})
    f["st_ref"] = wb.add_format({**base, "bold": True, "font_size": 9, "font_color": "#075985", "bg_color": "#E0F2FE", "border": 1, "border_color": "#7DD3FC", "align": "center", "valign": "vcenter"})
    f["st_exist"] = wb.add_format({**base, "font_size": 9, "font_color": "#475569", "bg_color": "#F1F5F9", "border": 1, "border_color": "#CBD5E1", "align": "center", "valign": "vcenter"})
    f["st_empty"] = wb.add_format({**base, "font_size": 9, "font_color": "#94A3B8", "bg_color": "#FFFFFF", "border": 1, "border_color": "#E2E8F0", "align": "center", "valign": "vcenter"})

    # 新規行のステップ別ソフトカラー (STEP 0..7)
    step_colors = [
        ("#F1F5F9", "#334155"),  # Step 0 マスタ
        ("#ECFDF5", "#065F46"),  # Step 1 前払請求
        ("#EFF6FF", "#1E40AF"),  # Step 2 前払支払
        ("#F0FDF4", "#166534"),  # Step 3 標準請求作成
        ("#FEFCE8", "#854D0E"),  # Step 4 標準検証・税・源泉
        ("#FDF2F8", "#9D174D"),  # Step 5 前払充当
        ("#F5F3FF", "#5B21B6"),  # Step 6 SLA会計
        ("#FFF7ED", "#9A3412"),  # Step 7 GL転記
    ]
    f["step_badges"] = []
    for bg, fg in step_colors:
        f["step_badges"].append(
            wb.add_format({**base, "bold": True, "font_size": 8.8, "font_color": fg, "bg_color": bg, "border": 1, "border_color": "#CBD5E1", "align": "center", "valign": "vcenter"})
        )

    f["link"] = wb.add_format({**base, "bold": True, "font_size": 9.5, "font_color": "#2563EB", "underline": True, "border": 1, "border_color": "#CBD5E1", "valign": "vcenter"})
    return f


def auto_col_widths(ws, max_col, min_widths=None, max_width=44):
    min_widths = min_widths or {}
    for c in range(max_col + 1):
        w = min_widths.get(c, 15)
        ws.set_column(c, c, min(w, max_width))


def build_index_sheet(wb, f, data):
    ws = wb.add_worksheet(SHEET_NAMES["INDEX"])
    ws.hide_gridlines(2)
    ws.set_column(0, 0, 8)
    ws.set_column(1, 1, 30)
    ws.set_column(2, 2, 26)
    ws.set_column(3, 3, 28)
    ws.set_column(4, 4, 24)
    ws.set_column(5, 5, 58)

    ws.merge_range(0, 0, 0, 5, "Oracle Fusion ERP Financials 26D (OEDMF準拠) — AP前払請求(PREPAY)〜支払〜標準請求〜充当〜SLA〜GL転記 完全データブック", f["title"])
    ws.set_row(0, 28)
    ws.merge_range(1, 0, 1, 5, "対象: 全65テーブル・全項目 / 62 ERリレーション / AFF 9セグメント / 明細1(消費税10%・源泉10.21%) / 明細2(軽減8%・源泉20.42%) / 前払充当 ¥1,873,700", f["subtitle"])
    ws.set_row(1, 20)

    r = 3
    # 1. シート目次
    ws.merge_range(r, 0, r, 5, "1. ブック構成・シート目次（シート名リンクから直接ジャンプ可能）", f["sec_hdr"])
    r += 1
    headers = ["No", "シート名", "対象範囲", "主なテーブル数 / 内容", "確認ポイント", "概要説明"]
    for idx, h in enumerate(headers):
        ws.write(r, idx, h, f["th"])
    ws.set_row(r, 22)
    r += 1

    toc_rows = [
        ("01", SHEET_NAMES["MATRIX"], "全8ステップ × 65テーブル", "状態マトリックス + フラグ遷移ログ", "INSERT/UPDATE/REFの色分け", "各プロセス(STEP 0〜7)でどのテーブルが新規・更新・参照されたかと主要フラグの変化を一覧化"),
        ("02", SHEET_NAMES["ORG"], "ドメインA: ORG / GL / AFF", "6テーブル", "9セグメント・元帳・会計期間", "法的実体(XLE), BU(HR), 元帳(GL_LEDGERS), 会計期間(200/101), AFF9構造, CCID全9件"),
        ("03", SHEET_NAMES["TCA"], "ドメインB: TCA & サプライヤ", "6テーブル", "前払CCID(1401)・買掛CCID(2101)", "HZ_PARTIES/SITES/LOCATIONS, POZ_SUPPLIERS/SITES, POZ_SITE_ASSIGNMENTS_ALL_M(AWT_GROUP=8001)"),
        ("04", SHEET_NAMES["MASTER"], "ドメインC: AP / 税 / 源泉 / 銀行", "20テーブル", "前払標準CCID・10%/8%・10.21%/20.42%", "FSP/APシステム設定, 支払条件, ZX消費税(10%/8%), AP_AWT源泉段階税率, CE銀行・手形連番, IBY"),
        ("05", SHEET_NAMES["AP_INV"], "ドメインD前半: AP前払・標準請求・税・源泉", "10テーブル", "前払50000 vs 標準50001・充当行", "AP_INVOICES_ALL, LINES(PREPAY行7,8), DISTRIBUTIONS(残高0), ZX消費税, ZX_WITHHOLDING_LINES, 予定表"),
        ("06", SHEET_NAMES["AP_PAY"], "ドメインD後半: 支払・前払充当履歴", "12テーブル", "CHK-1001 & AP_PREPAY_HISTORY/APP_DISTS", "PPR支払実行(1,873,700), IBY振込, CHK-1001, 前払充当履歴(88001)および6按分充当配賦(89001-89006)"),
        ("07", SHEET_NAMES["SLA"], "ドメインE: SLA補助元帳会計(XLA)", "5テーブル", "4イベント / 13仕訳明細 / 16XDL", "PREPAYMENT VALIDATED/PAYMENT CREATED/INVOICE VALIDATED/PREPAYMENT APPLIEDの完全監査証跡"),
        ("08", SHEET_NAMES["GL"], "ドメインF: GL総勘定元帳", "6テーブル", "借方=貸方=7,801,100円 / 期末残高", "GL_INTERFACE, BATCH, 2ヘッダ(Purchase Invoices / Payments), 13明細, GIR, GL_BALANCES(前払/AP残0)"),
        ("09", SHEET_NAMES["REL"], "ERリレーション定義", "62本", "PK/FK結合キー定義", "マスタ〜AP前払〜支払〜標準請求〜充当〜SLA〜GLの全62結合パス定義"),
    ]
    for no, sh, rng, cnt, pt, desc in toc_rows:
        ws.write(r, 0, no, f["td_center"])
        ws.write_url(r, 1, f"internal:'{sh}'!A1", f["link"], sh)
        ws.write(r, 2, rng, f["td"])
        ws.write(r, 3, cnt, f["td_center"])
        ws.write(r, 4, pt, f["td"])
        ws.write(r, 5, desc, f["td_wrap"])
        ws.set_row(r, 22)
        r += 1

    r += 1
    # 2. プロセス全体説明
    ws.merge_range(r, 0, r, 5, "2. 処理プロセス全体解説（STEP 0 〜 STEP 7）", f["sec_hdr"])
    r += 1
    for idx, h in enumerate(["Step", "処理日付", "プロセス名", "サブタイトル", "主な対象イベント / ID", "業務プロセス詳細解説"]):
        ws.write(r, idx, h, f["th"])
    ws.set_row(r, 22)
    r += 1

    for st in data["STEPS"]:
        ins_cnt = len(st["activeTables"].get("inserted", []))
        upd_cnt = len(st["activeTables"].get("updated", []))
        ref_cnt = len(st["activeTables"].get("referenced", []))
        ev_info = f"NEW:{ins_cnt} / UPD:{upd_cnt} / REF:{ref_cnt}"
        ws.write(r, 0, st["code"], f["step_badges"][st["id"]])
        ws.write(r, 1, st["dateLabel"], f["td_center"])
        ws.write(r, 2, st["title"], f["td"])
        ws.write(r, 3, st["subTitle"], f["td"])
        ws.write(r, 4, ev_info, f["td_center"])
        desc_text = "\n".join(st["description"]) if isinstance(st["description"], list) else str(st["description"])
        ws.write(r, 5, desc_text, f["td_wrap"])
        ws.set_row(r, 82)
        r += 1

    r += 1
    # 3. 金額検算＆仕訳構造サマリ
    ws.merge_range(r, 0, r, 5, "3. シナリオ金額設計・源泉税計算・前払充当・GL最終残高検算（全9勘定）", f["sec_hdr"])
    r += 1
    for idx, h in enumerate(["項目 / 勘定", "明細1 (消費税10%・源泉10.21%)", "明細2 (軽減8%・源泉20.42%)", "合計金額 (JPY)", "CCID (AFF)", "処理・残高の意味"]):
        ws.write(r, idx, h, f["th"])
    ws.set_row(r, 22)
    r += 1

    calc_rows = [
        ("標準請求 本体外注費", 1000000, 1000000, 2000000, "5001 / 5002", "明細1: システム設計報酬 / 明細2: 定期技術資料制作"),
        ("仮払消費税 (非源泉対象)", 100000, 80000, 180000, "1501 (10%) / 1502 (8%)", "明細1: 1,000,000×10% / 明細2: 1,000,000×8%（税込計 ¥2,180,000）"),
        ("源泉所得税 (段階税率)", -102100, -204200, -306300, "2201 (10.21%) / 2202 (20.42%)", "累積課税標準 100万円まで10.21%(¥102,100)、100万円超20.42%(¥204,200)"),
        ("正味支払・前払充当額", 997900, 875800, 1873700, "2101 ⇄ 1401 ⇄ 1001", "前払請求(50000)¥1,873,700支払(CHK-1001)→標準請求(50001)へ全額充当し残高0"),
    ]
    for label, m1, m2, tot, cc, note in calc_rows:
        ws.write(r, 0, label, f["td"])
        ws.write_number(r, 1, m1, f["td_amt"])
        ws.write_number(r, 2, m2, f["td_amt"])
        ws.write_number(r, 3, tot, f["td_amt"])
        ws.write(r, 4, cc, f["td_center"])
        ws.write(r, 5, note, f["td_wrap"])
        ws.set_row(r, 24)
        r += 1

    r += 1
    # 4. AFF 9セグメント体系 + GL_CODE_COMBINATIONS
    ws.merge_range(r, 0, r, 5, "4. AFF (Accounting Flexfield) 9セグメント体系定義 (CHART_OF_ACCOUNTS_ID=101: JP_COA_9SEG)", f["sec_hdr"])
    r += 1
    for idx, h in enumerate(["セグメント", "論理名", "サンプル値", "体系フォーマット", "位置", "説明"]):
        ws.write(r, idx, h, f["th"])
    ws.set_row(r, 22)
    r += 1
    for i, seg in enumerate(data["AFF_SEGMENTS"], start=1):
        ws.write(r, 0, seg["seg"], f["td_center"])
        ws.write(r, 1, seg["name"], f["td"])
        ws.write(r, 2, seg["sample"], f["td_center"])
        ws.write(r, 3, "会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3", f["td"] if i == 1 else f["td_center"])
        ws.write(r, 4, f"第{i}セグメント", f["td_center"])
        ws.write(r, 5, seg["desc"], f["td_wrap"])
        ws.set_row(r, 20)
        r += 1

    r += 1
    ws.merge_range(r, 0, r, 5, "5. 使用勘定コード組合せ一覧 (GL_CODE_COMBINATIONS 全9件) と GL最終残高", f["sec_hdr"])
    r += 1
    for idx, h in enumerate(["CCID", "勘定区分", "勘定科目名称", "AFF 9セグメント連結 (CONCAT)", "2026-11 DR / CR 発生", "2026-11 期末純残高"]):
        ws.write(r, idx, h, f["th"])
    ws.set_row(r, 22)
    r += 1

    bal_rows = {row["CODE_COMBINATION_ID"]: row for row in (r_obj["data"] for r_obj in data["STATES"][-1]["tablesState"]["GL_BALANCES"]["rows"])}
    for cc in data["CCID_LIST"]:
        cid = cc["CODE_COMBINATION_ID"]
        bal = bal_rows.get(cid, {})
        dr = bal.get("PERIOD_NET_DR", 0) or 0
        cr = bal.get("PERIOD_NET_CR", 0) or 0
        net = dr - cr
        ws.write_number(r, 0, cid, f["td_center"])
        ws.write(r, 1, cc["ACCOUNT_TYPE_JP"], f["td_center"])
        ws.write(r, 2, cc["NAME"], f["td"])
        ws.write(r, 3, cc["CONCAT"], f["td"])
        ws.write(r, 4, f"DR {dr:,} / CR {cr:,}", f["td_center"])
        if net == 0 and cid in (1401, 2101):
            ws.write(r, 5, "¥0 (前払/買掛 完済・残0)", f["td_new_badge"])
        else:
            ws.write_number(r, 5, net, f["td_amt"])
        ws.set_row(r, 20)
        r += 1


def build_matrix_sheet(wb, f, data):
    ws = wb.add_worksheet(SHEET_NAMES["MATRIX"])
    ws.hide_gridlines(2)
    ws.set_column(0, 0, 5)
    ws.set_column(1, 1, 32)
    ws.set_column(2, 2, 26)
    ws.set_column(3, 3, 24)
    for c in range(4, 12):
        ws.set_column(c, c, 15)

    ws.merge_range(0, 0, 0, 11, "プロセス別 全65テーブル データ状態遷移マトリックス（色分け：緑=INSERT / 橙=UPDATE / 青=READ / 灰=作成済 / 白=-）", f["title"])
    ws.set_row(0, 26)
    ws.merge_range(1, 0, 1, 11, "凡例: [NEW] 新規データ登録(INSERT) | [UPD] 既存データ/フラグ更新(UPDATE) | [NEW+UPD] 同一ステップで登録+更新 | [REF] 参照(READ) | [待機] 作成済 | [-] 未作成", f["subtitle"])
    ws.set_row(1, 20)

    r = 3
    headers = ["No", "テーブル名 (26D OEDMF)", "論理名", "ドメイン"] + [f"{s['code']}\n{s['shortTitle']}" for s in data["STEPS"]]
    for idx, h in enumerate(headers):
        ws.write(r, idx, h, f["th"])
    ws.set_row(r, 32)
    r += 1

    domain_map = {d["id"]: d["shortName"] for d in data["DOMAINS"]}
    state_label_map = {
        "inserted": ("NEW", "st_insert"),
        "updated": ("UPD", "st_update"),
        "inserted_updated": ("NEW+UPD", "st_ins_upd"),
        "referenced": ("REF", "st_ref"),
        "existing": ("待機", "st_exist"),
        "not_created": ("-", "st_empty"),
    }

    for idx, tbl in enumerate(data["TABLES"], start=1):
        ws.write_number(r, 0, idx, f["td_center"])
        ws.write(r, 1, tbl["name"], f["td"])
        ws.write(r, 2, tbl["jpName"], f["td"])
        ws.write(r, 3, domain_map.get(tbl["domain"], tbl["domain"]), f["td_center"])
        for s_idx in range(len(data["STEPS"])):
            ts = data["STATES"][s_idx]["tablesState"][tbl["id"]]
            cnt = len(ts["rows"])
            lbl, fmt_key = state_label_map.get(ts["tableState"], (ts["tableState"], "td_center"))
            text = f"{lbl} ({cnt})" if cnt > 0 and lbl != "-" else lbl
            ws.write(r, 4 + s_idx, text, f[fmt_key])
        ws.set_row(r, 19)
        r += 1

    r += 2
    ws.merge_range(r, 0, r, 11, "プロセス別 主要更新フラグ・ステータス・金額変更トラッキング明細（色付き項目一覧）", f["sec_hdr"])
    r += 1
    log_headers = ["Step", "日付", "プロセス", "更新テーブル", "主キー", "更新項目 / フラグ", "変更前 (Before)", "変更後 (After)", "業務解説・インパクト"]
    for idx, h in enumerate(log_headers):
        if idx < 8:
            ws.write(r, idx, h, f["th"])
        else:
            ws.merge_range(r, 8, r, 11, h, f["th"])
    ws.set_row(r, 22)
    r += 1

    for st in data["STEPS"]:
        for fc in st.get("flagChanges", []):
            ws.write(r, 0, st["code"], f["step_badges"][st["id"]])
            ws.write(r, 1, st["dateLabel"], f["td_center"])
            ws.write(r, 2, st["shortTitle"], f["td"])
            ws.write(r, 3, fc["table"], f["td"])
            ws.write(r, 4, fc["key"], f["td_center"])
            ws.write(r, 5, fc["column"], f["td_upd_badge"])
            ws.write(r, 6, fc["before"], f["td_center"])
            ws.write(r, 7, fc["after"], f["cell_upd"])
            ws.merge_range(r, 8, r, 11, fc["note"], f["td_wrap"])
            ws.set_row(r, 22)
            r += 1


def write_table_block(ws, f, tbl, final_tstate, raw_records, row_cursor, data):
    col_count = len(tbl["columns"]) + 2  # +2: [生成Step, 更新履歴]
    max_col = max(col_count - 1, 5)

    pk_str = ", ".join(tbl.get("pk", []))
    fk_str = ", ".join(tbl.get("fks", [])) or "なし"
    banner = f"■ {tbl['name']} （{tbl['jpName']}） | レコード数: {len(final_tstate['rows'])} 件 | PK: [{pk_str}] | FK: [{fk_str}]"
    ws.merge_range(row_cursor, 0, row_cursor, max_col, banner, f["tbl_banner"])
    ws.set_row(row_cursor, 21)
    row_cursor += 1

    ws.merge_range(row_cursor, 0, row_cursor, max_col, f"説明: {tbl['description']}", f["tbl_sub"])
    ws.set_row(row_cursor, 19)
    row_cursor += 1

    # カラム英語ヘッダ + 日本語サブヘッダ
    ws.write(row_cursor, 0, "生成Step", f["th"])
    ws.write(row_cursor, 1, "更新履歴(色付項目)", f["th"])
    for idx, cm in enumerate(tbl["columns"]):
        ws.write(row_cursor, idx + 2, cm["name"], f["th"])
    ws.set_row(row_cursor, 21)
    row_cursor += 1

    ws.write(row_cursor, 0, "登録プロセス", f["th_sub"])
    ws.write(row_cursor, 1, "プロセス別変更詳細", f["th_sub"])
    for idx, cm in enumerate(tbl["columns"]):
        ws.write(row_cursor, idx + 2, f"{cm['desc']}\n({cm['type']})", f["th_sub"])
    ws.set_row(row_cursor, 26)
    row_cursor += 1

    records_for_tbl = raw_records.get(tbl["id"], [])
    for rec_idx, row_obj in enumerate(final_tstate["rows"]):
        row_data = row_obj["data"]
        created_step = row_obj["createdAtStep"]
        updates_map = records_for_tbl[rec_idx].get("updates", {}) if rec_idx < len(records_for_tbl) else {}

        # どの列がどのステップで更新されたかマップ作成 { col_name: [(step_num, old_val, new_val), ...] }
        col_change_history = {}
        hist_texts = []
        # 各ステップの事前値から変更前を追跡する
        val_trace = dict(records_for_tbl[rec_idx]["data"]) if rec_idx < len(records_for_tbl) else {}
        for s_key in sorted((int(k) for k in updates_map.keys())):
            changes = updates_map[str(s_key)] if str(s_key) in updates_map else updates_map.get(s_key, {})
            part_items = []
            for c_name, new_v in changes.items():
                old_v = val_trace.get(c_name)
                col_change_history.setdefault(c_name, []).append((s_key, old_v, new_v))
                part_items.append(f"{c_name}:{old_v}→{new_v}")
                val_trace[c_name] = new_v
            if part_items:
                hist_texts.append(f"STEP{s_key}: " + ", ".join(part_items))

        ws.write(row_cursor, 0, f"STEP {created_step}", f["step_badges"][created_step])
        if hist_texts:
            ws.write(row_cursor, 1, " / ".join(hist_texts), f["td_upd_badge"])
        else:
            ws.write(row_cursor, 1, "変更なし(初期値維持)", f["td_center"])

        for idx, cm in enumerate(tbl["columns"]):
            c_name = cm["name"]
            val = row_data.get(c_name)
            is_updated = c_name in col_change_history
            col_i = idx + 2

            if val is None or val == "":
                fmt = f["cell_upd"] if is_updated else f["td_null"]
                ws.write(row_cursor, col_i, "NULL" if val is None else "", fmt)
            elif c_name in PERCENT_COLS and isinstance(val, (int, float)):
                fmt = f["cell_upd_pct"] if is_updated else f["td_pct"]
                ws.write_number(row_cursor, col_i, val, fmt)
            elif cm.get("role") in ("amt", "amount") and isinstance(val, (int, float)):
                fmt = f["cell_upd_amt"] if is_updated else f["td_amt"]
                ws.write_number(row_cursor, col_i, val, fmt)
            else:
                fmt = f["cell_upd"] if is_updated else f["td"]
                ws.write(row_cursor, col_i, val, fmt)

            if is_updated:
                cmt_lines = [f"[STEP {st}] {ov} → {nv}" for st, ov, nv in col_change_history[c_name]]
                ws.write_comment(row_cursor, col_i, "更新履歴:\n" + "\n".join(cmt_lines), {"width": 240, "height": 58})

        ws.set_row(row_cursor, 21)
        row_cursor += 1

    return row_cursor + 2


def build_domain_data_sheet(wb, f, data, sheet_key, title, subtitle, table_ids):
    ws = wb.add_worksheet(SHEET_NAMES[sheet_key])
    ws.hide_gridlines(2)
    ws.freeze_panes(2, 0)

    tbl_map = {t["id"]: t for t in data["TABLES"]}
    max_cols = max((len(tbl_map[tid]["columns"]) + 2 for tid in table_ids), default=8)
    last_col = max(max_cols - 1, 6)

    ws.merge_range(0, 0, 0, last_col, title, f["title"])
    ws.set_row(0, 26)
    ws.merge_range(1, 0, 1, last_col, subtitle + " （※黄色・太字セル＝プロセス実行により更新された項目、セルコメントに変更前後の履歴あり）", f["subtitle"])
    ws.set_row(1, 20)

    ws.set_column(0, 0, 12)
    ws.set_column(1, 1, 34)
    for c in range(2, last_col + 1):
        ws.set_column(c, c, 19)

    r = 3
    final_state = data["STATES"][-1]["tablesState"]
    for tid in table_ids:
        tbl = tbl_map[tid]
        r = write_table_block(ws, f, tbl, final_state[tid], data["TABLE_RECORDS"], r, data)


def build_relations_sheet(wb, f, data):
    ws = wb.add_worksheet(SHEET_NAMES["REL"])
    ws.hide_gridlines(2)
    ws.set_column(0, 0, 6)
    ws.set_column(1, 1, 30)
    ws.set_column(2, 2, 30)
    ws.set_column(3, 3, 52)
    ws.set_column(4, 4, 34)

    ws.merge_range(0, 0, 0, 4, f"Oracle Fusion Financials 26D — ERリレーション / テーブル結合定義一覧（全{len(data['RELATIONS'])}本）", f["title"])
    ws.set_row(0, 26)
    ws.merge_range(1, 0, 1, 4, "マスタ設定(ORG/TCA/POZ/ZX/AWT/CE/IBY) → AP前払請求・支払 → 標準請求・税/源泉 → 前払充当 → SLA(XLA) → GL転記", f["subtitle"])
    ws.set_row(1, 20)

    r = 3
    for idx, h in enumerate(["No", "親テーブル (From)", "子テーブル (To)", "結合条件 (Join Key)", "業務リレーション解説"]):
        ws.write(r, idx, h, f["th"])
    ws.set_row(r, 22)
    r += 1

    for idx, rel in enumerate(data["RELATIONS"], start=1):
        ws.write_number(r, 0, idx, f["td_center"])
        ws.write(r, 1, rel["from"], f["td"])
        ws.write(r, 2, rel["to"], f["td"])
        ws.write(r, 3, rel["join"], f["td"])
        ws.write(r, 4, rel["label"], f["td_wrap"])
        ws.set_row(r, 20)
        r += 1


def main():
    data = load_data_from_js()

    # ドメイン別テーブルID抽出と網羅性検証
    by_dom = {d["id"]: [t["id"] for t in data["TABLES"] if t["domain"] == d["id"]] for d in data["DOMAINS"]}
    d_all = set(by_dom["AP_TXN_PAYMENT"])
    d_split = set(AP_INV_TXN_TABLES) | set(AP_PAY_TXN_TABLES)
    assert len(AP_INV_TXN_TABLES) + len(AP_PAY_TXN_TABLES) == len(d_all) and d_all == d_split, (
        f"Domain D split mismatch: diff={d_all ^ d_split}"
    )

    wb = xlsxwriter.Workbook(OUTPUT_XLSX)
    f = create_formats(wb)

    build_index_sheet(wb, f, data)
    build_matrix_sheet(wb, f, data)
    build_domain_data_sheet(
        wb, f, data, "ORG",
        "ドメインA: 企業構造・元帳・会計期間・AFF9・CCIDマスタ (6テーブル)",
        "XLE / HR組織 / GL_LEDGERS / GL_PERIOD_STATUSES / FND_ID_FLEX_SEGMENTS / GL_CODE_COMBINATIONS",
        by_dom["ORG_GL_MASTER"],
    )
    build_domain_data_sheet(
        wb, f, data, "TCA",
        "ドメインB: サプライヤマスタ TCA & POZ (6テーブル)",
        "HZ_PARTIES / HZ_LOCATIONS / HZ_PARTY_SITES / POZ_SUPPLIERS / SITES / SITE_ASSIGNMENTS (PREPAY_CCID=1401)",
        by_dom["TCA_POZ_MASTER"],
    )
    build_domain_data_sheet(
        wb, f, data, "MASTER",
        "ドメインC: AP基本設定・消費税(ZX)・源泉税(AWT)・銀行(CE)・支払(IBY)マスタ (20テーブル)",
        "FINANCIALS_SYSTEM_PARAMS_ALL / APシステム / 支払条件 / ZX(10%,8%) / AP_AWT(10.21%,20.42%) / CE / IBY",
        by_dom["AP_TAX_PAY_MASTER"],
    )
    build_domain_data_sheet(
        wb, f, data, "AP_INV",
        "ドメインD前半: AP前払請求(50000)・標準請求(50001)・消費税・段階源泉・支払予定 (10テーブル)",
        "前払請求(1,873,700) / 標準請求明細1(10%+源泉10.21%) / 明細2(8%+源泉20.42%) / 前払充当マイナス明細7,8",
        AP_INV_TXN_TABLES,
    )
    build_domain_data_sheet(
        wb, f, data, "AP_PAY",
        "ドメインD後半: 前払支払実行(CHK-1001)・IBY決済・前払充当履歴(88001)＆配賦按分(89001-89006) (12テーブル)",
        "PPR支払抽出 / IBY電信振込 / AP_CHECKS_ALL / AP_PREPAY_HISTORY_ALL / AP_PREPAY_APP_DISTS",
        AP_PAY_TXN_TABLES,
    )
    build_domain_data_sheet(
        wb, f, data, "SLA",
        "ドメインE: SLA (Subledger Accounting) 補助元帳会計 XLA (5テーブル)",
        "4イベント(PREPAYMENT VALIDATED / PAYMENT CREATED / INVOICE VALIDATED / PREPAYMENT APPLIED)・13仕訳明細・16XDLリンク",
        by_dom["SLA_XLA"],
    )
    build_domain_data_sheet(
        wb, f, data, "GL",
        "ドメインF: GL (General Ledger) 総勘定元帳・仕訳バッチ/ヘッダ/明細・残高 (6テーブル)",
        "GL_INTERFACE / GL_JE_BATCHES(借貸一致¥7,801,100) / GL_JE_HEADERS(2本) / 13明細 / GIR / GL_BALANCES",
        by_dom["GL_LEDGER"],
    )
    build_relations_sheet(wb, f, data)

    wb.close()
    print(f"Generated Excel successfully: {OUTPUT_XLSX}")


if __name__ == "__main__":
    main()
