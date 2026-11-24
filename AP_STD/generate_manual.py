#!/usr/bin/env python3
"""
Oracle Fusion ERP 26D — AP標準請求書作成手順書（画面イメージ＆Excel生成スクリプト）
アップロードされた請求書作成画面をベースに、固有環境名・会社名をサンプル値へ置換し、
リーダーライン＋番号コールアウト付きの7ステップ画像を生成したうえで、
画像埋め込み・項目定義・仕訳検証付きのExcel手順書を出力します。
"""

import os
from PIL import Image, ImageDraw, ImageFont
import xlsxwriter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(SCRIPT_DIR, "manual_images")
SRC_IMAGE = "/Users/kim/.gemini/antigravity/brain/fcf23cdf-ff61-4f83-bb90-e25095d63a80/.user_uploaded/media_1794818843174_44be412f.jpg"
OUTPUT_XLSX = os.path.join(SCRIPT_DIR, "FusionERP_26D_AP_Invoice_Creation_Manual.xlsx")

FONT_REG_PATH = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"
FONT_BOLD_PATH = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"

SCALE = 2  # 2048x1024


def get_font(size, bold=False):
    path = FONT_BOLD_PATH if bold else FONT_REG_PATH
    if not os.path.exists(path):
        path = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
    return ImageFont.truetype(path, size)


def sx(val):
    return int(round(val * SCALE))


def draw_clean_base():
    """元画像の固有環境・会社情報を完全にマスクし、AP_STDサンプル値を描いたベース画像(2048x1024)を生成"""
    raw = Image.open(SRC_IMAGE).convert("RGB")
    im = raw.resize((1024 * SCALE, 512 * SCALE), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(im)

    f_banner = get_font(18, bold=True)
    f_field = get_font(16, bold=False)
    f_field_sm = get_font(13, bold=False)
    f_avatar = get_font(15, bold=True)

    # 1. 最上部オレンジバー（固有環境名を完全置換）
    draw.rectangle([0, 0, sx(1024), sx(15)], fill="#F7AC2E")
    draw.text((sx(18), sx(2)), "▲ Oracle Fusion Cloud ERP 26D — サンプル検証環境 (JP_BU_401)", fill="#451A03", font=f_banner)

    # 2. 右上ユーザーアイコン (元のPPは x=1004..1016, y=22..34 付近)
    draw.rectangle([sx(998), sx(19), sx(1020), sx(39)], fill="#312C2A")
    draw.ellipse([sx(999), sx(20), sx(1018), sx(38)], fill="#475569", outline="#94A3B8", width=2)
    draw.text((sx(1003), sx(22)), "JP", fill="#FFFFFF", font=f_avatar)

    # 3. 請求書ヘッダー左列：固有値をマスクしてサンプル値へ置換
    # ビジネスユニット (KGJPN -> JP_BU_401)
    draw.rectangle([sx(178), sx(128), sx(248), sx(140)], fill="#FFFFFF")
    draw.text((sx(180), sx(128)), "JP_BU_401", fill="#0F172A", font=f_field)

    # サプライヤ (PPB-DDD (株) -> (株)テックパートナーズ)
    draw.rectangle([sx(178), sx(146), sx(250), sx(157)], fill="#FFFFFF")
    draw.text((sx(180), sx(146)), "(株)テックパートナーズ", fill="#0F172A", font=f_field_sm)

    # サプライヤ番号 (10010 -> SUP-1001)
    draw.rectangle([sx(175), sx(160), sx(240), sx(171)], fill="#FFFFFF")
    draw.text((sx(177), sx(160)), "SUP-1001", fill="#334155", font=f_field)

    # サプライヤ・サイト (1000011 -> TOKYO-PAY)
    draw.rectangle([sx(178), sx(177), sx(246), sx(188)], fill="#FFFFFF")
    draw.text((sx(180), sx(177)), "TOKYO-PAY", fill="#0F172A", font=f_field)

    # 法的エンティティ (KGJPN -> フュージョン(株))
    draw.rectangle([sx(175), sx(191), sx(255), sx(202)], fill="#FFFFFF")
    draw.text((sx(177), sx(191)), "フュージョン(株)", fill="#334155", font=f_field_sm)

    # 金額初期値クリア (20,000 -> 0)
    draw.rectangle([sx(552), sx(128), sx(599), sx(141)], fill="#FFFFFF")
    draw.text((sx(588), sx(129)), "0", fill="#0F172A", font=f_field)

    # 右下 合計/未払額の初期値クリア（警告記号・20,000を覆う）
    draw.rectangle([sx(974), sx(480), sx(1022), sx(509)], fill="#FFFFFF")
    draw.text((sx(1004), sx(483)), "0", fill="#334155", font=f_field_sm)
    draw.text((sx(1004), sx(498)), "0", fill="#334155", font=f_field_sm)

    return im


def draw_populated_header(im, step):
    """Stepの進行に応じた入力済みヘッダー・明細・合計状態を描画"""
    draw = ImageDraw.Draw(im)
    f_field = get_font(16, bold=False)
    f_field_sm = get_font(13, bold=False)
    f_bold_sm = get_font(13, bold=True)

    if step >= 1:
        draw.rectangle([sx(178), sx(208), sx(266), sx(220)], fill="#FFFFFF")
        draw.text((sx(180), sx(209)), "202611_月次外注", fill="#0F172A", font=f_field_sm)

    if step >= 2:
        draw.rectangle([sx(540), sx(128), sx(599), sx(141)], fill="#FFFFFF")
        draw.text((sx(552), sx(129)), "2,180,000", fill="#0F172A", font=f_field)
        draw.rectangle([sx(519), sx(162), sx(598), sx(183)], fill="#FFFFFF")
        draw.text((sx(521), sx(165)), "基幹刷新システム\n設計・資料委託", fill="#0F172A", font=f_field_sm)

    if step >= 3:
        draw.rectangle([sx(858), sx(171), sx(938), sx(182)], fill="#FFFFFF")
        draw.text((sx(861), sx(171)), "山田 太郎", fill="#0F172A", font=f_field_sm)
        draw.rectangle([sx(866), sx(188), sx(940), sx(199)], fill="#FFFFFF")
        draw.text((sx(868), sx(189)), "INV_202611.pdf", fill="#1D4ED8", font=get_font(12, bold=True))

    if step >= 4:
        # 明細1行目 (y=329..341)
        draw.rectangle([sx(119), sx(329), sx(163), sx(340)], fill="#FFFFFF")
        draw.text((sx(123), sx(330)), "1,000,000", fill="#0F172A", font=f_field_sm)
        draw.rectangle([sx(246), sx(329), sx(359), sx(340)], fill="#FFFFFF")
        draw.text((sx(248), sx(330)), "01-2100-5210-100-V10", fill="#0F172A", font=get_font(12, bold=False))
        draw.rectangle([sx(484), sx(329), sx(592), sx(340)], fill="#FFFFFF")
        draw.text((sx(486), sx(330)), "システム設計委託報酬", fill="#0F172A", font=f_field_sm)
        draw.rectangle([sx(602), sx(329), sx(634), sx(340)], fill="#FFFFFF")
        draw.text((sx(604), sx(330)), "JP_TAX_10", fill="#0F172A", font=get_font(12, bold=True))

        # 明細2行目 (実ライン高さ y=348..360, 品目枠も完全カバー)
        draw.rectangle([sx(54), sx(348), sx(108), sx(360)], fill="#FFFFFF", outline="#CBD5E1", width=1)
        draw.text((sx(58), sx(349)), "品目", fill="#0F172A", font=f_field_sm)
        draw.rectangle([sx(119), sx(348), sx(163), sx(360)], fill="#FFFFFF", outline="#94A3B8", width=1)
        draw.text((sx(123), sx(349)), "1,000,000", fill="#0F172A", font=f_field_sm)
        draw.rectangle([sx(246), sx(348), sx(359), sx(360)], fill="#FFFFFF", outline="#94A3B8", width=1)
        draw.text((sx(248), sx(349)), "01-2100-5210-200-V08", fill="#0F172A", font=get_font(12, bold=False))
        draw.rectangle([sx(484), sx(348), sx(592), sx(360)], fill="#FFFFFF", outline="#94A3B8", width=1)
        draw.text((sx(486), sx(349)), "技術資料制作報酬", fill="#0F172A", font=f_field_sm)
        draw.rectangle([sx(602), sx(348), sx(638), sx(360)], fill="#FFFFFF", outline="#94A3B8", width=1)
        draw.text((sx(604), sx(349)), "JP_TAX_8", fill="#0F172A", font=get_font(12, bold=True))

        # Step 4時点の合計欄（税計算前の仮表示）
        draw.rectangle([sx(120), sx(482), sx(165), sx(494)], fill="#FFFFFF")
        draw.text((sx(122), sx(483)), "2,000,000", fill="#0F172A", font=f_field_sm)
        draw.rectangle([sx(962), sx(480), sx(1022), sx(509)], fill="#FFFFFF")
        draw.text((sx(968), sx(483)), "2,000,000", fill="#B45309", font=f_bold_sm)
        draw.text((sx(968), sx(498)), "2,000,000", fill="#0F172A", font=f_field_sm)

    if step >= 5:
        draw.rectangle([sx(120), sx(482), sx(165), sx(494)], fill="#FFFFFF")
        draw.text((sx(122), sx(483)), "2,000,000", fill="#0F172A", font=f_field_sm)

        # 税金・源泉領域をまとめてクリーンにして描画
        draw.rectangle([sx(600), sx(480), sx(656), sx(510)], fill="#FFFFFF")
        draw.text((sx(606), sx(482)), "180,000", fill="#1D4ED8", font=f_bold_sm)
        draw.text((sx(603), sx(497)), "-306,300", fill="#B91C1C", font=f_bold_sm)

        draw.rectangle([sx(962), sx(480), sx(1022), sx(509)], fill="#FFFFFF")
        draw.text((sx(968), sx(483)), "2,180,000", fill="#15803D", font=f_bold_sm)
        draw.text((sx(968), sx(498)), "1,873,700", fill="#0F172A", font=f_bold_sm)


def draw_callout_leader(im, rect_1x, badge_num, label_text, label_xy_1x, color="#DC2626", badge_side="auto"):
    """
    対象枠＋番号バッジ＋ラベルボックス（リーダーラインは最背面に描画してラベルや枠との隙間をなくす）
    """
    draw = ImageDraw.Draw(im)
    x1, y1, x2, y2 = sx(rect_1x[0]), sx(rect_1x[1]), sx(rect_1x[2]), sx(rect_1x[3])

    f_lbl = get_font(17, bold=True)
    bbox = draw.textbbox((0, 0), label_text, font=f_lbl)
    tw = bbox[2] - bbox[0] + 24
    th = 34
    lx = max(8, min(im.width - tw - 8, sx(label_xy_1x[0])))
    ly = max(8, min(im.height - th - 8, sx(label_xy_1x[1])))

    # リーダーライン始点：矩形外周の適切なエッジからスタート（内部文字を横切らない）
    cx_box, cy_box = (x1 + x2) // 2, (y1 + y2) // 2
    lcx, lcy = lx + tw // 2, ly + th // 2
    if lcx > x2 + 20:
        start_pt = (x2, cy_box)
        end_pt = (lx, lcy)
    elif lcx < x1 - 20:
        start_pt = (x1, cy_box)
        end_pt = (lx + tw, lcy)
    elif lcy < y1:
        start_pt = (cx_box, y1)
        end_pt = (lcx, ly + th)
    else:
        start_pt = (cx_box, y2)
        end_pt = (lcx, ly)
    draw.line([start_pt, end_pt], fill=color, width=4)

    # 対象ボックス（内部塗りつぶしせず枠線だけ鮮明に）
    draw.rectangle([x1, y1, x2, y2], outline=color, width=5)

    # 番号丸バッジ
    r = 14
    if badge_side == "bottom":
        bx, by = cx_box - r, y2 + 4
    elif badge_side == "top":
        bx, by = cx_box - r, max(4, y1 - r * 2 - 4)
    elif badge_side == "right":
        bx, by = min(im.width - r * 2 - 4, x2 + 4), cy_box - r
    else:
        bx = max(6, x1 - r * 2 - 4) if lx >= x1 - 40 else min(im.width - r * 2 - 6, x2 + 4)
        by = cy_box - r

    draw.ellipse([bx, by, bx + r * 2, by + r * 2], fill=color, outline="#FFFFFF", width=3)
    f_badge = get_font(18, bold=True)
    nstr = str(badge_num)
    draw.text((bx + (8 if len(nstr) == 1 else 3), by + 3), nstr, fill="#FFFFFF", font=f_badge)

    # ラベルボックス描画
    draw.rounded_rectangle([lx, ly, lx + tw, ly + th], radius=7, fill="#0F172A", outline=color, width=3)
    draw.text((lx + 12, ly + 7), label_text, fill="#FFFFFF", font=f_lbl)


def build_all_images():
    os.makedirs(IMG_DIR, exist_ok=True)
    files = {}

    # Step 0: 全体構成
    im0 = draw_clean_base()
    draw_callout_leader(im0, (766, 42, 1018, 63), "A", "A. アクション＆処理メニュー", (758, 72), color="#2563EB")
    draw_callout_leader(im0, (10, 82, 965, 228), "B", "B. 請求書ヘッダー (取引先・金額・支払条件)", (280, 68), color="#DC2626")
    draw_callout_leader(im0, (10, 240, 985, 428), "C", "C. 明細セクション (品目・配分組合せ・税分類)", (660, 385), color="#16A34A")
    draw_callout_leader(im0, (6, 430, 68, 444), "D", "D. 税金セクション (税額・源泉内訳)", (130, 428), color="#9333EA")
    draw_callout_leader(im0, (10, 466, 1021, 510), "E", "E. 合計サマリ (品目・税金・源泉・未払額)", (520, 428), color="#EA580C")
    p0 = os.path.join(IMG_DIR, "step0_overview.png")
    im0.save(p0, "PNG")
    files["step0"] = p0

    # Step 1: ヘッダー左列
    im1 = draw_clean_base()
    draw_populated_header(im1, 1)
    draw_callout_leader(im1, (112, 126, 266, 142), 1, "1. ビジネス・ユニット: JP_BU_401", (295, 112), color="#DC2626")
    draw_callout_leader(im1, (112, 144, 266, 173), 2, "2. サプライヤ: (株)テックパートナーズ", (295, 142), color="#DC2626")
    draw_callout_leader(im1, (112, 175, 266, 203), 3, "3. サイト: TOKYO-PAY (LE自動表示)", (295, 172), color="#DC2626")
    draw_callout_leader(im1, (112, 206, 268, 222), 4, "4. グループ: 202611_月次外注 (任意)", (295, 202), color="#2563EB")
    p1 = os.path.join(IMG_DIR, "step1_header_vendor.png")
    im1.save(p1, "PNG")
    files["step1"] = p1

    # Step 2: ヘッダー中央列
    im2 = draw_clean_base()
    draw_populated_header(im2, 2)
    draw_callout_leader(im2, (482, 109, 603, 125), 1, "1. 番号: AP-INV-2026-0001", (630, 104), color="#DC2626")
    draw_callout_leader(im2, (482, 127, 603, 143), 2, "2. 金額: JPY 2,180,000 (税込総額)", (630, 134), color="#DC2626")
    draw_callout_leader(im2, (482, 145, 603, 160), 3, "3. タイプ: 標準 (STANDARD)", (630, 164), color="#2563EB")
    draw_callout_leader(im2, (482, 161, 603, 185), 4, "4. 摘要: 委託内容を入力", (630, 194), color="#16A34A")
    p2 = os.path.join(IMG_DIR, "step2_header_amount.png")
    im2.save(p2, "PNG")
    files["step2"] = p2

    # Step 3: ヘッダー右列
    im3 = draw_clean_base()
    draw_populated_header(im3, 3)
    draw_callout_leader(im3, (815, 118, 945, 134), 1, "1. 日付: 2026-11-16", (632, 104), color="#DC2626")
    draw_callout_leader(im3, (815, 136, 945, 151), 2, "2. 支払条件: 当月10日締め当月末", (616, 134), color="#DC2626")
    draw_callout_leader(im3, (815, 153, 945, 168), 3, "3. 支払起算日: 2026-11-16", (616, 164), color="#2563EB")
    draw_callout_leader(im3, (815, 170, 945, 222), 4, "4. 依頼人 / 添付PDF (+)", (632, 194), color="#16A34A")
    p3 = os.path.join(IMG_DIR, "step3_header_terms.png")
    im3.save(p3, "PNG")
    files["step3"] = p3

    # Step 4: 明細入力 (+ボタンは y=245..258)
    im4 = draw_clean_base()
    draw_populated_header(im4, 4)
    draw_callout_leader(im4, (38, 245, 51, 258), 1, "1. 行追加 (+) で明細2を追加", (75, 232), color="#2563EB")
    draw_callout_leader(im4, (45, 326, 362, 363), 2, "2. 金額(各100万) & 配分組合せ(CCID 5001/5002)", (64, 386), color="#DC2626")
    draw_callout_leader(im4, (482, 326, 646, 363), 3, "3. 摘要 & 税分類(JP_TAX_10 / JP_TAX_8)", (482, 386), color="#DC2626")
    p4 = os.path.join(IMG_DIR, "step4_lines_input.png")
    im4.save(p4, "PNG")
    files["step4"] = p4

    # Step 5: 税金計算 & 合計
    im5 = draw_clean_base()
    draw_populated_header(im5, 5)
    draw_callout_leader(im5, (6, 430, 68, 444), 1, "1. 「税金」展開で消費税18万・源泉内訳確認", (18, 396), color="#9333EA")
    draw_callout_leader(im5, (595, 476, 660, 510), 2, "2. 消費税 180,000 / 源泉徴収 -306,300", (445, 424), color="#DC2626")
    draw_callout_leader(im5, (955, 476, 1022, 510), 3, "3. 合計 2,180,000 一致 / 未払 1,873,700", (745, 424), color="#16A34A")
    p5 = os.path.join(IMG_DIR, "step5_tax_totals.png")
    im5.save(p5, "PNG")
    files["step5"] = p5

    # Step 6: 保存・請求書処理・保存して閉じる
    im6 = draw_clean_base()
    draw_populated_header(im6, 5)
    draw_callout_leader(im6, (901, 42, 924, 62), 1, "1. まず「保存」をクリック", (645, 74), color="#2563EB", badge_side="top")
    draw_callout_leader(im6, (785, 42, 836, 62), 2, "2. 「請求書処理▼」→ 検証 → 会計計上", (330, 42), color="#DC2626", badge_side="top")
    draw_callout_leader(im6, (925, 42, 982, 62), 3, "3. 完了後「保存して閉じる(S)」", (825, 74), color="#16A34A", badge_side="bottom")
    p6 = os.path.join(IMG_DIR, "step6_actions_validate.png")
    im6.save(p6, "PNG")
    files["step6"] = p6

    return files


def make_formats(wb):
    f = "Yu Gothic"
    return {
        "title": wb.add_format({"font_name": f, "font_size": 15, "bold": True, "font_color": "#FFFFFF", "bg_color": "#0F172A", "valign": "vcenter", "indent": 1}),
        "sub": wb.add_format({"font_name": f, "font_size": 10, "italic": True, "font_color": "#CBD5E1", "bg_color": "#1E293B", "valign": "vcenter", "indent": 1}),
        "sec": wb.add_format({"font_name": f, "font_size": 11.5, "bold": True, "font_color": "#FFFFFF", "bg_color": "#1D4ED8", "valign": "vcenter", "indent": 1}),
        "th": wb.add_format({"font_name": f, "font_size": 9.5, "bold": True, "font_color": "#FFFFFF", "bg_color": "#334155", "border": 1, "align": "center", "valign": "vcenter", "text_wrap": True}),
        "td": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "valign": "top", "text_wrap": True}),
        "td_c": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "align": "center", "valign": "top", "text_wrap": True}),
        "td_req": wb.add_format({"font_name": f, "font_size": 9.5, "bold": True, "border": 1, "bg_color": "#FEE2E2", "font_color": "#991B1B", "align": "center", "valign": "top"}),
        "td_auto": wb.add_format({"font_name": f, "font_size": 9.5, "bold": True, "border": 1, "bg_color": "#EFF6FF", "font_color": "#1E40AF", "align": "center", "valign": "top"}),
        "td_val": wb.add_format({"font_name": f, "font_size": 9.5, "bold": True, "border": 1, "bg_color": "#DCFCE7", "font_color": "#14532D", "valign": "top", "text_wrap": True}),
        "td_num": wb.add_format({"font_name": f, "font_size": 9.5, "border": 1, "num_format": "#,##0", "align": "right", "valign": "top"}),
        "tot_l": wb.add_format({"font_name": f, "font_size": 10, "bold": True, "border": 1, "bg_color": "#FEF9C3", "font_color": "#713F12"}),
        "tot_n": wb.add_format({"font_name": f, "font_size": 10, "bold": True, "border": 1, "bg_color": "#FEF9C3", "font_color": "#713F12", "num_format": "#,##0"}),
    }


def build_excel_manual(img_files):
    wb = xlsxwriter.Workbook(OUTPUT_XLSX)
    fmt = make_formats(wb)

    # === Sheet 0: 表紙・サンプル請求書概要 ===
    ws0 = wb.add_worksheet("00_表紙とサンプル請求書概要")
    ws0.set_row(0, 30)
    ws0.set_row(1, 22)
    ws0.merge_range(0, 0, 0, 5, "Oracle Fusion Cloud ERP 26D — AP標準請求書作成 操作手順書", fmt["title"])
    ws0.merge_range(1, 0, 1, 5, "サンプルシナリオ: AP-INV-2026-0001（消費税10%/8%・段階源泉徴収税10.21%/20.42% 検証〜会計計上）", fmt["sub"])

    ws0.merge_range(3, 0, 3, 5, "1. 本手順書で作成するサンプル請求書サマリ", fmt["sec"])
    for c, h in enumerate(["項目区分", "項目名", "サンプル設定値", "計算内訳・備考"]):
        ws0.write(4, c, h, fmt["th"])
    ws0.merge_range(4, 3, 4, 5, "計算内訳・備考", fmt["th"])

    ov_rows = [
        ("取引先情報", "ビジネス・ユニット / サプライヤ", "JP_BU_401 / (株)テックパートナーズ (SUP-1001)", "サイト: TOKYO-PAY / 法的エンティティ: フュージョン(株)"),
        ("請求書ヘッダ", "請求書番号 / 日付 / 通貨・総額", "AP-INV-2026-0001 / 2026-11-16 / JPY 2,180,000", "タイプ: 標準 / 支払条件: 当月10日締め当月末"),
        ("明細 1", "システム設計委託報酬 (10%)", "1,000,000円 + 消費税100,000円 − 源泉102,100円", "100万円以下は源泉税率 10.21% → 差引支払額 997,900円"),
        ("明細 2", "定期技術資料制作報酬 (軽減8%)", "1,000,000円 + 消費税80,000円 − 源泉204,200円", "累積100万円超部分は源泉税率 20.42% → 差引支払額 875,800円"),
        ("最終金額", "税込請求総額 / 源泉差引後未払額", "合計 2,180,000円 / 未払額 1,873,700円", "消費税計 180,000円 / 源泉徴収計 -306,300円")
    ]
    r = 5
    for k1, k2, v1, v2 in ov_rows:
        ws0.write(r, 0, k1, fmt["td_c"])
        ws0.write(r, 1, k2, fmt["td"])
        ws0.write(r, 2, v1, fmt["td_val"])
        ws0.merge_range(r, 3, r, 5, v2, fmt["td"])
        ws0.set_row(r, 24)
        r += 1

    r += 1
    ws0.merge_range(r, 0, r, 5, "2. ブック構成シート一覧", fmt["sec"])
    r += 1
    ws0.write(r, 0, "シート名", fmt["th"])
    ws0.merge_range(r, 1, r, 5, "内容概要", fmt["th"])
    r += 1
    sh_list = [
        ("00_表紙とサンプル請求書概要", "対象サンプル数値、適用消費税/源泉徴収税条件、シート案内"),
        ("01_画面イメージ手順書", "Step 0〜Step 6 までの加工済み実画面PNG画像を埋め込んだビジュアル操作手順書"),
        ("02_画面項目とOEDMF定義一覧", "請求書作成画面の全項目に対する必須/任意、サンプル入力値、Fusion 26D物理テーブル・カラム一覧"),
        ("03_検証後データとSLA仕訳", "検証・会計計上後に作成されるAP表・SLA仕訳明細（貸借各2,180,000円 SUM検証）")
    ]
    for sname, sdesc in sh_list:
        ws0.write(r, 0, sname, fmt["td_val"])
        ws0.merge_range(r, 1, r, 5, sdesc, fmt["td"])
        r += 1

    for i, w in enumerate([24, 30, 38, 22, 18, 18]):
        ws0.set_column(i, i, w)

    # === Sheet 1: 画面イメージ付き手順書 ===
    ws1 = wb.add_worksheet("01_画面イメージ手順書")
    ws1.set_row(0, 30)
    ws1.set_row(1, 22)
    ws1.merge_range(0, 0, 0, 8, "AP標準請求書作成 — ビジュアル操作手順書（画面イメージ付き Step 0 〜 Step 6）", fmt["title"])
    ws1.merge_range(1, 0, 1, 8, "画像内の番号バッジ(1,2,3...)に対応する下の詳細手順表に沿って画面入力・検証を行います", fmt["sub"])

    steps_spec = [
        {
            "key": "step0",
            "title": "Step 0: 請求書作成画面の全体構成（ナビ：買掛管理 ＞ 請求書 ＞ タスク：請求書の作成）",
            "ops": [
                ("A", "グローバル・アクションバー", "自動/操作", "保存・請求書処理▼（検証/会計計上）・保存して閉じる等の実行エリア", "AP_INVOICES_ALL 制御"),
                ("B", "請求書ヘッダー領域", "必須入力", "ビジネスユニット・サプライヤ・番号・税込金額・日付・支払条件を設定", "AP_INVOICES_ALL"),
                ("C", "明細セクション", "必須入力", "請求書の品目・配賦CCID・会計日・税分類を行単位に入力（配分等6タブ構成）", "AP_INVOICE_LINES_ALL"),
                ("D", "税金セクション", "自動計算", "請求書検証(Validate)実行後に消費税および源泉徴収税の内訳行を展開表示", "ZX_LINES"),
                ("E", "合計サマリバー", "確認", "明細合計＋税金＝ヘッダ税込金額と一致し警告アイコンが消えたことを確認", "AP_PAYMENT_SCHEDULES_ALL")
            ]
        },
        {
            "key": "step1",
            "title": "Step 1: 請求書ヘッダー（左列）— 取引先・ビジネスユニットの選択",
            "ops": [
                ("1", "* ビジネス・ユニット", "必須", "JP_BU_401", "自社の請求管理ビジネスユニットをドロップダウンから選択 (ORG_ID=401)"),
                ("2", "* サプライヤ", "必須", "(株)テックパートナーズ", "虫眼鏡アイコンから検索選択。サプライヤ番号(SUP-1001)が自動表示"),
                ("3", "* サプライヤ・サイト", "必須", "TOKYO-PAY", "支払用サイトを選択すると法的エンティティ(フュージョン(株))と負債CCIDが自動セット"),
                ("4", "請求書グループ", "任意", "202611_月次外注", "月次バッチ集計・一括検証用に任意のグループ名を入力")
            ]
        },
        {
            "key": "step2",
            "title": "Step 2: 請求書ヘッダー（中央列）— 請求書番号・金額・タイプ入力",
            "ops": [
                ("1", "* 番号", "必須", "AP-INV-2026-0001", "サプライヤ受領請求書と照合できるよう一意の請求書番号を入力"),
                ("2", "* 金額", "必須", "JPY / 2,180,000", "明細税抜合計200万円＋消費税合計18万円の「税込コントロール総額」を入力（源泉引前）"),
                ("3", "* タイプ", "必須", "標準 (STANDARD)", "通常請求のためデフォルト「標準」を維持（前払時は「前払金」を選択）"),
                ("4", "摘要", "任意", "基幹刷新システム設計・資料委託", "照会・承認ワークフロー画面で識別しやすい件名を入力")
            ]
        },
        {
            "key": "step3",
            "title": "Step 3: 請求書ヘッダー（右列）— 日付・支払条件・添付ファイル設定",
            "ops": [
                ("1", "* 日付", "必須", "2026-11-16", "サプライヤ請求書記載の発行日を設定"),
                ("2", "* 支払条件", "必須", "当月10日締め当月末", "サイト規定値を確認し、契約条件と相違があれば選択変更"),
                ("3", "* 支払起算日", "必須", "2026-11-16", "支払予定期日(DUE_DATE)の起算日を入力"),
                ("4", "依頼人 / 添付", "任意", "山田 太郎 / INV_202611.pdf", "社内依頼者を指定し、添付(+)から証憑PDFをアップロード")
            ]
        },
        {
            "key": "step4",
            "title": "Step 4: 明細入力 — 明細1 (税10%) ＆ 明細2 (軽減税8%)・配分組合せ登録",
            "ops": [
                ("1", "行追加 (+) ボタン", "操作", "明細2を追加", "初期表示行に加え、+ボタンで2行目（明細2）を挿入"),
                ("2", "* 金額 & 配分組合せ", "必須", "明細1: 1,000,000 (5001)\n明細2: 1,000,000 (5002)", "AFF 9セグメント体系の費用勘定組合せを指定（未設定時は配分セットまたはCCID手入力）"),
                ("3", "摘要 & 税分類", "必須", "明細1: JP_TAX_10 (10%)\n明細2: JP_TAX_8_RED (8%)", "明細ごとに適切な税分類コード（標準10% / 軽減8%）を指定。完了後「保存」を押下")
            ]
        },
        {
            "key": "step5",
            "title": "Step 5: 税金計算（消費税＋段階源泉徴収税）と合計サマリ一致確認",
            "ops": [
                ("1", "「税金」アコーディオン", "自動確認", "TAX明細 180,000円生成", "検証実行により品目明細の下に10%税(10万円)と軽減8%税(8万円)が自動生成される"),
                ("2", "源泉徴収税の段階計算", "自動確認", "源泉計 -306,300円", "100万以下 10.21% (-102,100円) ＋ 100万超 20.42% (-204,200円) の自動計上を確認"),
                ("3", "合計・未払額の一致確認", "必須確認", "合計 2,180,000 / 未払 1,873,700", "ヘッダ金額2,180,000と合計が一致して警告(!)マークが消えたことを確認")
            ]
        },
        {
            "key": "step6",
            "title": "Step 6: 保存・検証 (Validate)・会計計上 (Post to Ledger) の実行",
            "ops": [
                ("1", "保存 ボタン", "操作", "変更内容をDB保存", "検証実行前にまず右上「保存」を押して請求書IDを確定"),
                ("2", "請求書処理 ▼ メニュー", "操作", "「検証」→「会計計上」", "「検証」でAPPROVAL_STATUS=APPROVEDにし、続けて「会計計上」でSLA仕訳(XLA_AE_LINES)を作成"),
                ("3", "保存して閉じる (S)", "操作", "請求書作業領域へ戻る", "「検証済・会計計上済」を確認して「保存して閉じる(S)」で完了")
            ]
        }
    ]

    cur_row = 3
    for st in steps_spec:
        ws1.set_row(cur_row, 24)
        ws1.merge_range(cur_row, 0, cur_row, 8, st["title"], fmt["sec"])
        cur_row += 1

        img_start_row = cur_row
        img_rows = 22
        for rr in range(img_start_row, img_start_row + img_rows):
            ws1.set_row(rr, 21)
        ws1.insert_image(img_start_row, 0, img_files[st["key"]], {"x_scale": 0.44, "y_scale": 0.44, "x_offset": 6, "y_offset": 4})

        cur_row = img_start_row + img_rows
        ws1.write(cur_row, 0, "番号", fmt["th"])
        ws1.merge_range(cur_row, 1, cur_row, 2, "画面項目名 / 操作", fmt["th"])
        ws1.write(cur_row, 3, "区分", fmt["th"])
        ws1.merge_range(cur_row, 4, cur_row, 5, "サンプル入力値 / 設定内容", fmt["th"])
        ws1.merge_range(cur_row, 6, cur_row, 8, "操作ポイント・業務確認事項", fmt["th"])
        cur_row += 1

        for op_no, op_name, op_req, op_val, op_note in st["ops"]:
            ws1.write(cur_row, 0, op_no, fmt["td_c"])
            ws1.merge_range(cur_row, 1, cur_row, 2, op_name, fmt["td"])
            rfmt = fmt["td_req"] if "必須" in op_req else (fmt["td_auto"] if "自動" in op_req else fmt["td_c"])
            ws1.write(cur_row, 3, op_req, rfmt)
            ws1.merge_range(cur_row, 4, cur_row, 5, op_val, fmt["td_val"])
            ws1.merge_range(cur_row, 6, cur_row, 8, op_note, fmt["td"])
            ws1.set_row(cur_row, 32 if "\n" in op_val else 24)
            cur_row += 1

        cur_row += 1

    for i, w in enumerate([9, 16, 16, 12, 18, 18, 18, 18, 18]):
        ws1.set_column(i, i, w)

    # === Sheet 2: 画面項目・DB定義一覧 ===
    ws2 = wb.add_worksheet("02_画面項目とOEDMF定義一覧")
    ws2.set_row(0, 30)
    ws2.set_row(1, 22)
    ws2.merge_range(0, 0, 0, 5, "請求書作成画面 全項目定義 ＆ Oracle Fusion 26D OEDMF テーブルマッピング", fmt["title"])
    ws2.merge_range(1, 0, 1, 5, "画面UI項目・サンプル値・バックエンド物理テーブル/カラム対応表", fmt["sub"])

    for c, h in enumerate(["エリア", "画面項目名", "必須/任意", "サンプル値", "OEDMF 26D 格納テーブル.カラム", "備考・補足仕様"]):
        ws2.write(3, c, h, fmt["th"])

    field_catalog = [
        ("ヘッダー(左)", "識別購買オーダー", "任意", "(空欄: POなし)", "AP_INVOICES_ALL.PO_HEADER_ID", "PO照合請求時に指定。PO選択でサプライヤ自動引用"),
        ("ヘッダー(左)", "* ビジネス・ユニット", "必須", "JP_BU_401", "AP_INVOICES_ALL.ORG_ID (401)", "組織単位 HR_ALL_ORGANIZATION_UNITS_F"),
        ("ヘッダー(左)", "* サプライヤ", "必須", "(株)テックパートナーズ", "AP_INVOICES_ALL.VENDOR_ID (3001)", "HZ_PARTIES.PARTY_NAME 検索"),
        ("ヘッダー(左)", "サプライヤ番号", "自動表示", "SUP-1001", "POZ_SUPPLIERS.SEGMENT1", "サプライヤ選択時に自動表示"),
        ("ヘッダー(左)", "* サプライヤ・サイト", "必須", "TOKYO-PAY", "AP_INVOICES_ALL.VENDOR_SITE_ID (3101)", "POZ_SITE_ASSIGNMENTS_ALL_M から負債CCID・AWT継承"),
        ("ヘッダー(左)", "法的エンティティ", "自動表示", "フュージョン(株)", "AP_INVOICES_ALL.LEGAL_ENTITY_ID (201)", "XLE_ENTITY_PROFILES より自動セット"),
        ("ヘッダー(左)", "請求書グループ", "任意", "202611_月次外注", "AP_INVOICES_ALL.BATCH_ID / グループ名", "支払バッチ・検証処理のグループ抽出に利用"),
        ("ヘッダー(中央)", "* 番号", "必須", "AP-INV-2026-0001", "AP_INVOICES_ALL.INVOICE_NUM", "同一サプライヤ内で重複登録不可"),
        ("ヘッダー(中央)", "* 金額 (通貨/額)", "必須", "JPY / 2,180,000", "INVOICE_CURRENCY_CODE / INVOICE_AMOUNT", "消費税込みコントロール総額（明細＋税と一致必須）"),
        ("ヘッダー(中央)", "* タイプ", "必須", "標準 (STANDARD)", "INVOICE_TYPE_LOOKUP_CODE", "標準 / 前払金 / クレジットメモ 等"),
        ("ヘッダー(中央)", "摘要", "任意", "基幹刷新システム設計・資料委託", "AP_INVOICES_ALL.DESCRIPTION", "承認依頼やSLA仕訳摘要に連携可能"),
        ("ヘッダー(右)", "* 日付", "必須", "2026-11-16", "AP_INVOICES_ALL.INVOICE_DATE", "請求書記載日付"),
        ("ヘッダー(右)", "* 支払条件", "必須", "当月10日締め当月末", "AP_INVOICES_ALL.TERMS_ID", "AP_TERMS_TL / LINES により期日算出"),
        ("ヘッダー(右)", "* 支払起算日", "必須", "2026-11-16", "AP_INVOICES_ALL.TERMS_DATE", "支払期日算出ベース日"),
        ("ヘッダー(右)", "依頼人", "任意", "山田 太郎", "AP_INVOICES_ALL.REQUESTER_ID", "社内承認ワークフロー等で使用"),
        ("ヘッダー(右)", "添付 / ノート", "任意", "INV_202611.pdf", "FND_ATTACHED_DOCUMENTS", "請求書PDF証憑ファイルの紐付け"),
        ("明細(配分タブ)", "* 番号 / * タイプ", "必須", "1, 2 / 品目 (ITEM)", "AP_INVOICE_LINES_ALL.LINE_NUMBER / LINE_TYPE_LOOKUP_CODE", "商品・サービス明細は ITEM を選択"),
        ("明細(配分タブ)", "* 金額", "必須", "各 1,000,000", "AP_INVOICE_LINES_ALL.AMOUNT", "税抜金額を入力（税は検証時に別行自動作成）"),
        ("明細(配分タブ)", "配分組合せ", "必須", "01-2100-5210-...", "DEFAULT_DIST_CCID (5001 / 5002)", "AFF 9セグメント (会社-部門-科目-補助-税-管理-備1-2-3)"),
        ("明細(配分タブ)", "会計日", "必須", "2026-11-16", "AP_INVOICE_LINES_ALL.ACCOUNTING_DATE", "GLオープン期間 (GL_PERIOD_STATUSES='O') 内の日付"),
        ("明細(税金タブ)", "税分類", "必須", "JP_TAX_10 / JP_TAX_8_RED", "TAX_CLASSIFICATION_CODE", "ZX_RATES_B による10% / 軽減8%判定"),
        ("税金・合計", "合計 / 未払額", "自動集計", "2,180,000 / 1,873,700", "AP_INVOICES_ALL / AP_PAYMENT_SCHEDULES_ALL", "源泉306,300円控除後の実際の振込予定額＝1,873,700円")
    ]
    r = 4
    for area, fname, req, fval, fcol, fnote in field_catalog:
        ws2.write(r, 0, area, fmt["td_c"])
        ws2.write(r, 1, fname, fmt["td"])
        ws2.write(r, 2, req, fmt["td_req"] if req == "必須" else (fmt["td_auto"] if "自動" in req else fmt["td_c"]))
        ws2.write(r, 3, fval, fmt["td_val"])
        ws2.write(r, 4, fcol, fmt["td"])
        ws2.write(r, 5, fnote, fmt["td"])
        ws2.set_row(r, 24)
        r += 1
    for i, w in enumerate([16, 24, 12, 28, 40, 44]):
        ws2.set_column(i, i, w)

    # === Sheet 3: 検証後データとSLA仕訳 ===
    ws3 = wb.add_worksheet("03_検証後データとSLA仕訳")
    ws3.set_row(0, 30)
    ws3.set_row(1, 22)
    ws3.merge_range(0, 0, 0, 6, "手順完了（検証・会計計上）後の生成データ ＆ SLA仕訳検証", fmt["title"])
    ws3.merge_range(1, 0, 1, 6, "AP_INVOICE_LINES_ALL (6行) と XLA_AE_LINES (貸借各 2,180,000円 一致検証)", fmt["sub"])

    ws3.merge_range(3, 0, 3, 6, "1. AP_INVOICE_LINES_ALL（検証後の請求明細 全6行：品目2 + 消費税2 + 源泉税2）", fmt["sec"])
    for c, h in enumerate(["LINE_NUM", "TYPE", "LINE_SOURCE", "TAX_CODE", "AFF / CCID", "摘要", "AMOUNT (JPY)"]):
        ws3.write(4, c, h, fmt["th"])

    ap_lines = [
        (1, "ITEM", "MANUAL", "JP_TAX_10", "5001 (01-2100-5210-100-V10-PJ002...)", "システム設計委託報酬 (税抜)", 1000000),
        (2, "ITEM", "MANUAL", "JP_TAX_8_RED", "5002 (01-2100-5210-200-V08-PJ002...)", "技術資料制作報酬 (税抜)", 1000000),
        (3, "TAX", "ETAX", "JP_TAX_10", "1501 (仮払消費税 10%)", "消費税 (標準10%)", 100000),
        (4, "TAX", "ETAX", "JP_TAX_8_RED", "1502 (仮払消費税 軽減8%)", "消費税 (軽減8%)", 80000),
        (5, "AWT", "AUTOMATIC", "JP_WHT_TIER(10.21%)", "2201 (預り金・源泉10.21%)", "源泉所得税 (100万円以下)", -102100),
        (6, "AWT", "AUTOMATIC", "JP_WHT_TIER(20.42%)", "2202 (預り金・源泉20.42%)", "源泉所得税 (100万円超)", -204200),
    ]
    r = 5
    first_ap = r + 1
    for ln, tp, src, tc, cc, ds, amt in ap_lines:
        ws3.write_number(r, 0, ln, fmt["td_c"])
        ws3.write(r, 1, tp, fmt["td_c"])
        ws3.write(r, 2, src, fmt["td_c"])
        ws3.write(r, 3, tc, fmt["td"])
        ws3.write(r, 4, cc, fmt["td"])
        ws3.write(r, 5, ds, fmt["td"])
        ws3.write_number(r, 6, amt, fmt["td_num"])
        r += 1
    last_ap = r
    ws3.merge_range(r, 0, r, 5, "AP_PAYMENT_SCHEDULES_ALL.AMOUNT_REMAINING (差引支払予定額)", fmt["tot_l"])
    ws3.write_formula(r, 6, f"=SUM(G{first_ap}:G{last_ap})", fmt["tot_n"], 1873700)
    r += 2

    ws3.merge_range(r, 0, r, 6, "2. XLA_AE_LINES（会計計上後のSLA仕訳：貸借各 2,180,000円）", fmt["sec"])
    r += 1
    for c, h in enumerate(["AE_LINE_NUM", "ACCOUNTING_CLASS", "CCID", "AFF 9セグメント", "仕訳摘要", "借方 (DR)", "貸方 (CR)"]):
        ws3.write(r, c, h, fmt["th"])
    r += 1
    first_xla = r + 1
    xla_lines = [
        (1, "ITEM EXPENSE", 5001, "01-2100-5210-100-V10-PJ002-0000-0000-0000", "外注費 (明細1: 設計委託)", 1000000, 0),
        (2, "ITEM EXPENSE", 5002, "01-2100-5210-200-V08-PJ002-0000-0000-0000", "外注費 (明細2: 資料制作)", 1000000, 0),
        (3, "TAX", 1501, "01-0000-1350-010-V10-00000-0000-0000-0000", "仮払消費税 (10%)", 100000, 0),
        (4, "TAX", 1502, "01-0000-1350-008-V08-00000-0000-0000-0000", "仮払消費税 (軽減8%)", 80000, 0),
        (5, "LIABILITY", 2101, "01-2100-2110-000-00-PJ002-0000-0000-0000", "買掛金 (源泉控除後純額)", 0, 1873700),
        (6, "AWT", 2201, "01-9000-2160-101-W10-00000-0000-0000-0000", "預り金・源泉所得税(10.21%)", 0, 102100),
        (7, "AWT", 2202, "01-9000-2160-204-W20-00000-0000-0000-0000", "預り金・源泉所得税(20.42%)", 0, 204200),
    ]
    for ln, cls, cc, aff, ds, dr, cr in xla_lines:
        ws3.write_number(r, 0, ln, fmt["td_c"])
        ws3.write(r, 1, cls, fmt["td"])
        ws3.write_number(r, 2, cc, fmt["td_c"])
        ws3.write(r, 3, aff, fmt["td"])
        ws3.write(r, 4, ds, fmt["td"])
        ws3.write_number(r, 5, dr, fmt["td_num"])
        ws3.write_number(r, 6, cr, fmt["td_num"])
        r += 1
    last_xla = r
    ws3.merge_range(r, 0, r, 4, "XLA_AE_LINES 貸借合計 (DR = CR = 税込2,180,000円)", fmt["tot_l"])
    ws3.write_formula(r, 5, f"=SUM(F{first_xla}:F{last_xla})", fmt["tot_n"], 2180000)
    ws3.write_formula(r, 6, f"=SUM(G{first_xla}:G{last_xla})", fmt["tot_n"], 2180000)

    for i, w in enumerate([12, 18, 12, 34, 30, 16, 16]):
        ws3.set_column(i, i, w)

    wb.close()


def main():
    imgs = build_all_images()
    build_excel_manual(imgs)
    print("Regenerated images & Excel successfully.")


if __name__ == "__main__":
    main()
