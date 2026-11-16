// Oracle Fusion ERP Financials 26D (OEDMF準拠)
// SLA(補助元帳会計)・FAHセットアップ・サポート参照・残高管理プレゼンテーション 全データ

const META = {
  version: 'Oracle Fusion Cloud Financials 26D (OEDMF)',
  ledgerId: 300001,
  ledgerName: 'JP_CORP_LEDGER',
  coaId: 101,
  coaName: 'JP_COA_9SEG',
  accountingMethodCode: 'XX_JP_CORP_AM',
  currency: 'JPY',
  period: '2026-04',
  nextPeriod: '2026-05'
};

const AFF_SEGMENTS = [
  { num: 1, col: 'SEGMENT1', name: '会社', len: 2, example: '01', desc: '01: 日本法人株式会社 (LE_01)' },
  { num: 2, col: 'SEGMENT2', name: '部門', len: 3, example: '100', desc: '000: 全社 / 100: 本社管理 / 200: 営業部 / 300: ITシステム部' },
  { num: 3, col: 'SEGMENT3', name: '勘定科目', len: 4, example: '1101', desc: '1011:預金 / 1101:売掛金 / 1201:仮払税 / 1301:使用権資産 / 1691:減価償却累計 / 2101:買掛金 / 2151:仮受税 / 2301:リース負債 / 4101..4104:売上 / 5101..5202:費用' },
  { num: 4, col: 'SEGMENT4', name: '補助科目', len: 3, example: '001', desc: '000: 共通 / 001: 取引先別管理 / 002: 契約別' },
  { num: 5, col: 'SEGMENT5', name: '税コード', len: 2, example: '10', desc: '00: 対象外 / 10: 消費税10% / 08: 軽減税率8%' },
  { num: 6, col: 'SEGMENT6', name: '管理コード', len: 3, example: '001', desc: '000: なし / 001: 案件A / 002: クラウドSaaS' },
  { num: 7, col: 'SEGMENT7', name: '備考1', len: 3, example: '000', desc: '000: デフォルト予備軸1' },
  { num: 8, col: 'SEGMENT8', name: '備考2', len: 3, example: '000', desc: '000: デフォルト予備軸2' },
  { num: 9, col: 'SEGMENT9', name: '備考3', len: 3, example: '000', desc: '000: デフォルト予備軸3' }
];

const CCID_LIST = [
  { id: 1000, type: 'A', name: '普通預金', aff: '01-100-1011-000-00-000-000-000-000', desc: 'AR入金消込用・現金預金勘定' },
  { id: 1001, type: 'A', name: '売掛金', aff: '01-100-1101-001-00-000-000-000-000', desc: 'AR ＆ FAH共用 売掛金勘定（SR残高比較コア）' },
  { id: 1002, type: 'A', name: '仮払消費税(10%)', aff: '01-100-1201-000-10-000-000-000-000', desc: 'AP仕入税額控除' },
  { id: 1003, type: 'A', name: '使用権資産(ROU/不動産)', aff: '01-100-1301-000-00-000-000-000-000', desc: 'LA不動産リース使用権資産' },
  { id: 1004, type: 'A', name: '減価償却累計額(サーバー)', aff: '01-100-1691-000-00-000-000-000-000', desc: 'FAサーバー減価償却累計額' },
  { id: 2001, type: 'L', name: '買掛金', aff: '01-100-2101-001-00-000-000-000-000', desc: 'AP買掛債務' },
  { id: 2002, type: 'L', name: '仮受消費税(10%)', aff: '01-100-2151-000-10-000-000-000-000', desc: 'AR売上消費税負債' },
  { id: 2003, type: 'L', name: 'リース負債', aff: '01-100-2301-001-00-000-000-000-000', desc: 'LAリース負債' },
  { id: 4001, type: 'R', name: '製品売上高', aff: '01-200-4101-000-10-001-000-000-000', desc: 'ARソフトウェア売上' },
  { id: 4002, type: 'R', name: 'クラウドサービス収益', aff: '01-200-4102-000-00-002-000-000-000', desc: 'FAH SaaS売上 (MapSet 4102導出)' },
  { id: 5001, type: 'E', name: '外注費', aff: '01-300-5101-000-10-001-000-000-000', desc: 'AP IT業務委託外注費' },
  { id: 5002, type: 'E', name: '減価償却費(サーバー)', aff: '01-300-5201-000-00-000-000-000-000', desc: 'FA月次償却費' }
];

const CHAPTERS = [
  {
    id: 'ch1',
    num: 1,
    shortTitle: '1. SLA全体構造と仕訳生成',
    title: 'Chapter 1: SLA全体アーキテクチャ ＆ サブ元帳→仕訳生成メカニズム',
    goal: 'AP・AR・FA・LA・FAHからイベント捕捉、ルール評価を経てSLA仕訳・GL転記が生成される一連の機構を理解する。',
    slides: [
      { id: 's1-1', title: '1-1. エグゼクティブサマリ — なぜSLAがFusion ERPの中核なのか', type: 'ch1_summary' },
      { id: 's1-2', title: '1-2. 【アニメ図解】5大サブ元帳 → SLA → GL データ連携＆仕訳生成フロー', type: 'ch1_mechanism' },
      { id: 's1-3', title: '1-3. SLA内部エンジン構造 — イベントモデルとAMB階層ツリー', type: 'ch1_hierarchy' }
    ]
  },
  {
    id: 'ch2',
    num: 2,
    shortTitle: '2. サブモジュール別SLA手順',
    title: 'Chapter 2: サブモジュール単位（AP・AR・FA・LA）のSLAセットアップ全手順',
    goal: '標準4サブ元帳ごとに、算式・マッピングセット・ADR・摘要・JLT・SR・JERSをどう組むかを画面設定＋テーブルレベルで把握する。',
    slides: [
      { id: 's2-1', title: '2-1. 標準サブモジュールSLA設定の定石（ボトムアップ9工程）', type: 'ch2_overview' },
      { id: 's2-2', title: '2-2. 【モジュール切替】AP・AR・FA・LA 別 SLA全セットアップ仕様', type: 'ch2_submodules' }
    ]
  },
  {
    id: 'ch3',
    num: 3,
    shortTitle: '3. FAH専用セットアップ',
    title: 'Chapter 3: FAH（会計ハブ / Financial Accounting Hub）専用セットアップ手順',
    goal: '外部システム連携向けにゼロからアプリケーション・I/F表・カスタムソース・算式・JERSを構築する12工程を理解する。',
    slides: [
      { id: 's3-1', title: '3-1. 標準サブ元帳 vs FAH — アーキテクチャと準備工程の決定的違い', type: 'ch3_compare' },
      { id: 's3-2', title: '3-2. 【12工程図解】FAHセットアップ詳細手順とOEDMF 26Dテーブル対応', type: 'ch3_steps12' }
    ]
  },
  {
    id: 'ch4',
    num: 4,
    shortTitle: '4. サポート参照詳細',
    title: 'Chapter 4: サポート参照（Supporting References）徹底解説',
    goal: '残高有(BALANCING_FLAG=Y)と残高無(N)の違い、5サブ元帳横断ソース正規化、DFF/AFFとの設計区分を完全に習得する。',
    slides: [
      { id: 's4-1', title: '4-1. サポート参照アーキテクチャ — 残高有(Y) vs 残高無(N) ＆ AC1..AC5', type: 'ch4_sr_arch' },
      { id: 's4-2', title: '4-2. 5大サブ元帳横断正規化図 ＆ サポート参照 vs DFF vs AFF比較', type: 'ch4_sr_vs_dff' }
    ]
  },
  {
    id: 'ch5',
    num: 5,
    shortTitle: '5. 残高有SRのSLA残高管理',
    title: 'Chapter 5: 残高有サポート参照単位のSLA残高管理フロー',
    goal: 'XLA_AE_LINES → XLA_AE_LINE_ACS → XLA_AC_BALANCES での取引先別残高累積・消込減算・GL照合・翌期繰越を視覚的に検証する。',
    slides: [
      { id: 's5-1', title: '5-1. 【6フェーズ・アニメ】残高有サポート参照 (相手先) SLA残高管理フロー', type: 'ch5_balance_flow' }
    ]
  },
  {
    id: 'ch6',
    num: 6,
    shortTitle: '6. OEDMF 26D サンプルデータ',
    title: 'Chapter 6: OEDMF 26D セットアップ ＆ トランザクション 全サンプルデータ照会',
    goal: '全サブモジュール設定表・取引表・SLA仕訳・GLテーブルの実サンプル値を検索・検証し、Excel出力と突き合わせる。',
    slides: [
      { id: 's6-1', title: '6-1. OEDMF 26D 全セットアップ・残高管理テーブル インスペクタ', type: 'ch6_inspector' }
    ]
  }
];

// === Chapter 1-2: 5大サブ元帳 -> SLA -> GL 仕組みアニメーションデータ ===
const MECHANISM_NODES = [
  // 左: 5大サブ元帳 (x=24)
  { id: 'SUB_AP', group: 'SUB', title: 'AP 買掛管理 (200)', sub: 'AP_INVOICES_ALL / DISTS', badge: '550,000円', x: 24, y: 52, w: 235, h: 58 },
  { id: 'SUB_AR', group: 'SUB', title: 'AR 売掛管理 (222)', sub: 'RA_CUSTOMER_TRX_ALL / GL_DIST', badge: '880,000円', x: 24, y: 122, w: 235, h: 58 },
  { id: 'SUB_FA', group: 'SUB', title: 'FA 固定資産 (140)', sub: 'FA_TRANSACTION_HEADERS / DEPRN', badge: '120,000円', x: 24, y: 192, w: 235, h: 58 },
  { id: 'SUB_LA', group: 'SUB', title: 'LA リース会計 (10522)', sub: 'FLA_LEASES_ALL / ACCTG_LINES', badge: '2,400,000円', x: 24, y: 262, w: 235, h: 58 },
  { id: 'SUB_FAH', group: 'SUB', title: 'FAH 外部連携 (20001)', sub: 'XLA_TRANSACTION_HEADERS/LINES', badge: '300,000円', x: 24, y: 332, w: 235, h: 58 },
  // 中央上: イベント & 抽出
  { id: 'XLA_EVENTS', group: 'EVT', title: 'XLA_TRANSACTION_ENTITIES / XLA_EVENTS', sub: 'イベントID: 500001〜500005 (U→P)', badge: '5件', x: 318, y: 72, w: 290, h: 72 },
  { id: 'XLA_SOURCES', group: 'EVT', title: 'XLA_SOURCES_B (ソース抽出層)', sub: '取引属性・数量300・単価1000・相手先抽出', badge: 'EXTRACT', x: 318, y: 170, w: 290, h: 72 },
  // 中央下: AMBルールエンジン
  { id: 'AMB_ENGINE', group: 'AMB', title: 'AMB ルールエンジン (XLA_LINE_DEFINITIONS_B)', sub: '算式(300×1000) · MapSet(4102) · ADR · JLT · 摘要 · SR', badge: 'XX_JP_CORP_AM', x: 318, y: 278, w: 290, h: 106 },
  // 右側: SLA仕訳出力 & SR残高
  { id: 'XLA_AE', group: 'SLA', title: 'XLA_AE_HEADERS / XLA_AE_LINES', sub: '5仕訳ヘッダ / 12明細 (総計 4,250,000円)', badge: '12明細', x: 668, y: 58, w: 280, h: 74 },
  { id: 'XLA_LINKS', group: 'SLA', title: 'XLA_DISTRIBUTION_LINKS', sub: '各サブ元帳配賦ID ↔ SLA明細 双方向リンク', badge: '監査証跡', x: 668, y: 152, w: 280, h: 66 },
  { id: 'XLA_ACS', group: 'SLA', title: 'XLA_AE_LINE_ACS (サポート参照値)', sub: 'SR_COUNTERPARTY (残高有) ＋ SR_EXT_TRACE (無)', badge: '20行', x: 668, y: 238, w: 280, h: 66 },
  { id: 'XLA_BAL', group: 'SLA', title: 'XLA_AC_BALANCES (SR残高集計)', sub: 'BALANCING=Y のみ: (株)グローバル商事 1,180k', badge: '残高有のみ', x: 668, y: 324, w: 280, h: 66 },
  // 最右: GL総勘定元帳
  { id: 'GL_IF', group: 'GL', title: 'GL_INTERFACE', sub: 'GL_SL_LINK_ID 700001〜700012 (明細転送D)', badge: 'I/F転送', x: 1004, y: 78, w: 220, h: 68 },
  { id: 'GL_JE', group: 'GL', title: 'GL_JE_BATCHES / HEADERS / LINES', sub: 'Batch 80001 · 5ヘッダ · 12仕訳明細 · References', badge: 'STATUS: P', x: 1004, y: 182, w: 220, h: 82 },
  { id: 'GL_BAL', group: 'GL', title: 'GL_BALANCES (2026-04)', sub: '11 CCID確定残高 DR計=CR計=4,250,000円', badge: '4,250,000円', x: 1004, y: 300, w: 220, h: 76 }
];

const MECHANISM_STEPS = [
  {
    idx: 0, code: 'Phase 1', label: '① 5サブ元帳 取引発生',
    title: 'Phase 1: AP・AR・FA・LA・FAH で業務トランザクションが確定',
    points: [
      '標準4モジュール（AP買掛 550k / AR売掛 880k / FA償却 120k / LAリース 2,400k）で承認/計上・実行処理が完了します。',
      '外部システム(POS_BILLING)は XLA_TRANSACTION_HEADERS_INT / LINES_INT 経由で FAH Base表へロードされます（数量300 × 単価1,000、金額はまだ未算出 0）。'
    ],
    activeNodes: ['SUB_AP', 'SUB_AR', 'SUB_FA', 'SUB_LA', 'SUB_FAH'],
    doneNodes: [],
    flows: []
  },
  {
    idx: 1, code: 'Phase 2', label: '② 会計イベント捕捉 (U)',
    title: 'Phase 2: XLA_TRANSACTION_ENTITIES & XLA_EVENTS (未計上 U) 起票',
    points: [
      '各サブ元帳のイベントAPIおよびFAHローダーが XLA_TRANSACTION_ENTITIES と XLA_EVENTS（500001〜500005）を生成します。',
      'この時点では EVENT_STATUS_CODE = "U" (Unaccounted / 未会計計上), PROCESS_STATUS_CODE = "U" です。'
    ],
    activeNodes: ['XLA_EVENTS'],
    doneNodes: ['SUB_AP', 'SUB_AR', 'SUB_FA', 'SUB_LA', 'SUB_FAH'],
    flows: [
      { from: 'SUB_AP', to: 'XLA_EVENTS', label: '500001' },
      { from: 'SUB_AR', to: 'XLA_EVENTS', label: '500002' },
      { from: 'SUB_FA', to: 'XLA_EVENTS', label: '500003' },
      { from: 'SUB_LA', to: 'XLA_EVENTS', label: '500004' },
      { from: 'SUB_FAH', to: 'XLA_EVENTS', label: '500005' }
    ]
  },
  {
    idx: 2, code: 'Phase 3', label: '③ ソース抽出 (Extract)',
    title: 'Phase 3: Create Accounting起動 → XLA_SOURCES_B トランザクション属性抽出',
    points: [
      '「会計の作成 (Create Accounting)」プログラムが対象イベントを抽出し、標準Extract ViewまたはFAH Base表から全ソース値を読み込みます。',
      'AP仕入先名、AR顧客名、LA契約番号、FAHの HEADER_CHAR1(相手先)、LINE_NUMBER1(300)、LINE_NUMBER2(1000)、LINE_CHAR2(SaaS_USAGE) がメモリ上に展開されます。'
    ],
    activeNodes: ['XLA_SOURCES'],
    doneNodes: ['SUB_AP', 'SUB_AR', 'SUB_FA', 'SUB_LA', 'SUB_FAH', 'XLA_EVENTS'],
    flows: [
      { from: 'XLA_EVENTS', to: 'XLA_SOURCES', label: '未処理イベント抽出' },
      { from: 'SUB_FAH', to: 'XLA_SOURCES', label: '数量300/単価1000' }
    ]
  },
  {
    idx: 3, code: 'Phase 4', label: '④ AMB ルール評価',
    title: 'Phase 4: Accounting Methods Builder (AMB) ルール評価エンジン実行',
    points: [
      '元帳 JP_CORP_LEDGER に紐づく会計方式 XX_JP_CORP_AM → 各サブ元帳JERS (XLA_LINE_DEFINITIONS_B) が評価されます。',
      'ユーザー定義算式 XX_FAH_LINE_AMT_FML が 300 × 1,000 = 300,000円 を計算し、マッピングセット XX_FAH_SVC_ACCT_MAP が SaaS_USAGE → 勘定科目4102 を導出、AFF 9セグメントCCIDを解決します。'
    ],
    activeNodes: ['AMB_ENGINE'],
    doneNodes: ['SUB_AP', 'SUB_AR', 'SUB_FA', 'SUB_LA', 'SUB_FAH', 'XLA_EVENTS', 'XLA_SOURCES'],
    flows: [
      { from: 'XLA_SOURCES', to: 'AMB_ENGINE', label: 'ソース引渡し' }
    ]
  },
  {
    idx: 4, code: 'Phase 5', label: '⑤ SLA仕訳＆SR残高生成',
    title: 'Phase 5: XLA_AE_HEADERS/LINES (425万円)・LINKS・サポート参照残高生成',
    points: [
      '5大サブ元帳分の 5仕訳ヘッダ・12仕訳明細（貸借各4,250,000円）と元配賦リンク XLA_DISTRIBUTION_LINKS を生成し、XLA_EVENTS を "P" (処理済) へ更新します。',
      'XLA_AE_LINE_ACS に 残高有(SR_COUNTERPARTY) と 残高無(SR_EXT_TRACE: AC1..AC5) を書き込み、BALANCING_FLAG="Y" のみ XLA_AC_BALANCES へ残高集計します。'
    ],
    activeNodes: ['XLA_AE', 'XLA_LINKS', 'XLA_ACS', 'XLA_BAL'],
    doneNodes: ['SUB_AP', 'SUB_AR', 'SUB_FA', 'SUB_LA', 'SUB_FAH', 'XLA_EVENTS', 'XLA_SOURCES', 'AMB_ENGINE'],
    flows: [
      { from: 'AMB_ENGINE', to: 'XLA_AE', label: '5ヘッダ/12明細' },
      { from: 'AMB_ENGINE', to: 'XLA_LINKS', label: '配賦紐付' },
      { from: 'XLA_AE', to: 'XLA_ACS', label: 'SR属性生成' },
      { from: 'XLA_ACS', to: 'XLA_BAL', label: 'BAL=Y集計' }
    ]
  },
  {
    idx: 5, code: 'Phase 6', label: '⑥ GL転送・インポート・転記',
    title: 'Phase 6: GL_INTERFACE → Journal Import → Post → GL_BALANCES (確定残高)',
    points: [
      'GL転送モード="D" (明細) で 12明細が GL_SL_LINK_ID 付きで GL_INTERFACE へ送信され、XLA_AE_HEADERS.GL_TRANSFER_STATUS_CODE が "N" → "Y" になります。',
      'GL Journal Import & Posting により Batch 80001 / Header 5件 / Lines 12行が STATUS="P" となり、GL_BALANCES の2026-04残高 (DR計=CR計=4,250,000円) が確定します。'
    ],
    activeNodes: ['GL_IF', 'GL_JE', 'GL_BAL'],
    doneNodes: ['SUB_AP', 'SUB_AR', 'SUB_FA', 'SUB_LA', 'SUB_FAH', 'XLA_EVENTS', 'XLA_SOURCES', 'AMB_ENGINE', 'XLA_AE', 'XLA_LINKS', 'XLA_ACS', 'XLA_BAL'],
    flows: [
      { from: 'XLA_AE', to: 'GL_IF', label: 'GL_SL_LINK_ID' },
      { from: 'GL_IF', to: 'GL_JE', label: 'Journal Import' },
      { from: 'GL_JE', to: 'GL_BAL', label: '転記 4,250,000円' }
    ]
  }
];

// === Chapter 2-2: サブモジュール別 (AP / AR / FA / LA) SLA全セットアップ仕様 ===
const SUBMODULE_SETUPS = [
  {
    id: 'AP',
    appId: 200,
    shortName: 'SQLAP',
    title: '① Payables (AP / 買掛管理: APPLICATION_ID=200)',
    tagline: '購買請求書・消費税・源泉徴収・支払消込・前払充当を網羅する標準サブモジュール',
    uiNav: '設定および保守 > 財務 > 買掛管理 > 補助元帳会計オプション / 会計ルールの管理',
    journalExample: {
      event: 'INVOICE VALIDATED (AP-2026-001 / 相手先: テックサポート株式会社)',
      lines: [
        { side: 'DR', aff: '01-300-5101-000-10-001-000-000-000', desc: '外注費 (ITEM / XX_AP_EXP_SEG3_ADR)', amt: '500,000' },
        { side: 'DR', aff: '01-100-1201-000-10-000-000-000-000', desc: '仮払消費税10% (NRTAX)', amt: '50,000' },
        { side: 'CR', aff: '01-100-2101-001-00-000-000-000-000', desc: '買掛金 (LIABILITY / SR_COUNTERPARTY有)', amt: '550,000' }
      ]
    },
    components: [
      { step: '1. イベントモデル & ソース', table: 'XLA_EVENT_CLASSES_B / XLA_EVENT_TYPES_B / XLA_SOURCES_B', code: 'INVOICES / INVOICE VALIDATED', detail: 'Oracle事前定義 (Seeded)。主要ソース: AP_INVOICE_DIST_AMOUNT, AP_VENDOR_NAME, AP_PURCHASING_CATEGORY, AP_INVOICE_NUM, QUANTITY_INVOICED, UNIT_PRICE。' },
      { step: '2. ユーザー定義算式', table: 'XLA_FORMULAS_B / XLA_FORMULA_DETAILS', code: 'XX_AP_NET_EXP_FML', detail: '式: AP_INVOICE_DIST_AMOUNT * 1.0 (配賦金額または数量×単価検算用、DATATYPE_CODE="N")。' },
      { step: '3. マッピングセット', table: 'XLA_MAPPING_SETS_B / VALUES', code: 'XX_AP_EXP_ACCT_MAP', detail: '購買カテゴリ(SEGMENT3割当): "IT_OUTSOURCE" → "5101"(外注費), "CLOUD_INFRA" → "5102"(通信システム費)。' },
      { step: '4. 勘定科目ルール(ADR)&条件', table: 'XLA_SEG_RULES_B / DETAILS / XLA_CONDITIONS', code: 'XX_AP_EXP_SEG3_ADR', detail: '条件: LINE_TYPE_LOOKUP_CODE = "ITEM" かつ 購買カテゴリ IS NOT NULL の場合、Mapping Set XX_AP_EXP_ACCT_MAP を使用。デフォルトは配賦表CCIDのSEGMENT3を継承。' },
      { step: '5. 仕訳摘要ルール', table: 'XLA_DESCRIPTIONS_B', code: 'XX_AP_INV_LINE_DESC', detail: 'リテラル "[AP] " + AP_INVOICE_NUM + " " + AP_DIST_DESCRIPTION → 例: "[AP] AP-2026-001 外注費"。' },
      { step: '6. 仕訳明細ルール(JLT)&属性', table: 'XLA_ACCT_LINE_TYPES_B / XLA_JLT_ACCT_ATTRS', code: 'XX_AP_ITEM_EXP_DR / XX_AP_LIAB_CR', detail: 'XX_AP_ITEM_EXP_DR (借方D / クラス: ITEM EXPENSE)、XX_AP_LIAB_CR (貸方C / クラス: LIABILITY / ENTERED_AMOUNT←AP_INVOICE_DIST_AMOUNT)。' },
      { step: '7. サポート参照 (残高有/無)', table: 'XLA_ANALYTICAL_SOURCES / XLA_LINE_DEFN_AC_ASSGNS', code: 'SR_COUNTERPARTY + SR_EXT_TRACE', detail: 'SR_COUNTERPARTY(AC1) ← AP_VENDOR_NAME (テックサポート株式会社)。SR_EXT_TRACE: AC1=AP_PORTAL, AC2=INVOICE_NUM, AC3=TERMS_DATE, AC4=QUANTITY_INVOICED, AC5=UNIT_PRICE。' },
      { step: '8. 仕訳入力ルールセット(JERS)', table: 'XLA_LINE_DEFINITIONS_B / *_ASSGNS', code: 'AP_STD_INVOICE_JERS (Custom拡張)', detail: '上記 JLT + AFF 9軸ADR + Description + SR_COUNTERPARTY/SR_EXT_TRACE を統合し VALIDATION_STATUS_CODE="C" に検証。' },
      { step: '9. 会計方式 & 元帳設定', table: 'XLA_ACCTG_METHOD_RULES / XLA_LEDGER_OPTIONS', code: 'XX_JP_CORP_AM (APPL=200)', detail: 'JP_CORP_LEDGER へ XX_JP_CORP_AM で紐付。GL転送モード="D"(明細)、ENABLE_SUBMIT_POSTING_FLAG="Y"。' }
    ]
  },
  {
    id: 'AR',
    appId: 222,
    shortName: 'AR',
    title: '② Receivables (AR / 売掛管理: APPLICATION_ID=222)',
    tagline: '請求書計上・売上認識・仮受消費税・入金(Receipt)作成と消込による売掛残高消去まで',
    uiNav: '設定および保守 > 財務 > 売掛管理 > 補助元帳会計オプション / 売掛管理ルールの管理',
    journalExample: {
      event: 'INV_CREATE (AR-2026-001 / 相手先: 株式会社グローバル商事)',
      lines: [
        { side: 'DR', aff: '01-100-1101-001-00-000-000-000-000', desc: '売掛金 (RECEIVABLE / SR_COUNTERPARTY 88万計上)', amt: '880,000' },
        { side: 'CR', aff: '01-200-4101-000-10-001-000-000-000', desc: '製品売上高 (REVENUE / XX_AR_PROD_REV_MAP)', amt: '800,000' },
        { side: 'CR', aff: '01-100-2151-000-10-000-000-000-000', desc: '仮受消費税10% (TAX)', amt: '80,000' }
      ]
    },
    components: [
      { step: '1. イベントモデル & ソース', table: 'XLA_EVENT_CLASSES_B / XLA_EVENT_TYPES_B / XLA_SOURCES_B', code: 'INVOICE / INV_CREATE, RECEIPT / RECP_CREATE', detail: '自動会計 (AutoAccounting) と協調し、ソース AR_BILL_TO_CUST_NAME, AR_TRX_NUMBER, QUANTITY_INVOICED, UNIT_SELLING_PRICE を抽出。' },
      { step: '2. ユーザー定義算式', table: 'XLA_FORMULAS_B / XLA_FORMULA_DETAILS', code: 'XX_AR_REV_CALC_FML', detail: '式: QUANTITY_INVOICED * UNIT_SELLING_PRICE (明細数量4 × 単価200,000 = 800,000検証/補助計算)。' },
      { step: '3. マッピングセット', table: 'XLA_MAPPING_SETS_B / VALUES', code: 'XX_AR_PROD_REV_MAP', detail: '品目カテゴリ(SEGMENT3割当): "SW_LICENSE" → "4101"(製品売上高), "MAINT_SUPPORT" → "4104"(保守売上高)。' },
      { step: '4. 勘定科目ルール(ADR)&条件', table: 'XLA_SEG_RULES_B / DETAILS / XLA_CONDITIONS', code: 'XX_AR_REV_SEG3_ADR', detail: '条件: AR_LINE_TYPE = "LINE" の時 Mapping Set XX_AR_PROD_REV_MAP により収益勘定上書、売掛金行は XX_AR_REC_SEG3_ADR ("1101") を適用。' },
      { step: '5. 仕訳摘要ルール', table: 'XLA_DESCRIPTIONS_B', code: 'XX_AR_INV_DESC', detail: '"[AR] " + AR_TRX_NUMBER + " " + LINE_DESCRIPTION → 例: "[AR] AR-2026-001 製品売上高"。' },
      { step: '6. 仕訳明細ルール(JLT)&属性', table: 'XLA_ACCT_LINE_TYPES_B / XLA_JLT_ACCT_ATTRS', code: 'XX_AR_REC_DR / XX_AR_REV_CR / XX_AR_TAX_CR', detail: 'XX_AR_REC_DR (借方D / RECEIVABLE)、XX_AR_REV_CR (貸方C / REVENUE)、XX_AR_TAX_CR (貸方C / TAX)。入金時は XX_AR_CASH_DR / XX_AR_REC_CR。' },
      { step: '7. サポート参照 (残高有/無)', table: 'XLA_ANALYTICAL_SOURCES / XLA_LINE_DEFN_AC_ASSGNS', code: 'SR_COUNTERPARTY + SR_EXT_TRACE', detail: 'SR_COUNTERPARTY(AC1) ← AR_BILL_TO_CUST_NAME (株式会社グローバル商事)。FAHの同一顧客と XLA_AC_BALANCES で自動統合合算される！' },
      { step: '8. 仕訳入力ルールセット(JERS)', table: 'XLA_LINE_DEFINITIONS_B / *_ASSGNS', code: 'AR_STD_TRX_JERS / XX_AR_RECP_JERS', detail: '売上請求・入金消込の双方に SR_COUNTERPARTY を割当（これにより入金時 XLA_AC_BALANCES.PERIOD_BALANCE_CR が自動減少表示）。' },
      { step: '9. 会計方式 & 元帳設定', table: 'XLA_ACCTG_METHOD_RULES / XLA_LEDGER_OPTIONS', code: 'XX_JP_CORP_AM (APPL=222)', detail: 'TRANSFER_TO_GL_MODE_CODE="D", ROUNDING_RULE_CODE="NEAREST", ENABLE_SUBMIT_POSTING_FLAG="Y"。' }
    ]
  },
  {
    id: 'FA',
    appId: 140,
    shortName: 'OFA',
    title: '③ Assets (FA / 固定資産管理: APPLICATION_ID=140)',
    tagline: '資産取得(Addition)・月次減価償却(Depreciation)・除却(Retirement)の仕訳ルール管理',
    uiNav: '設定および保守 > 財務 > 固定資産 > 補助元帳会計オプション / 資産ルールの管理',
    journalExample: {
      event: 'DEPRECIATION (FA-2026-001 サーバー機器 2026-04分)',
      lines: [
        { side: 'DR', aff: '01-300-5201-000-00-000-000-000-000', desc: '減価償却費 (DEPRN_EXP / XX_FA_CAT_DEPRN_MAP)', amt: '120,000' },
        { side: 'CR', aff: '01-100-1691-000-00-000-000-000-000', desc: '減価償却累計額 (DEPRN_RSV / XX_FA_DEPRN_RSV_ADR)', amt: '120,000' }
      ]
    },
    components: [
      { step: '1. イベントモデル & ソース', table: 'XLA_EVENT_CLASSES_B / XLA_EVENT_TYPES_B / XLA_SOURCES_B', code: 'DEPRECIATION / DEPRECIATION, ADDITIONS / ADDITION', detail: '資産台帳 JP_CORP_BOOK 上で償却計算時に生成。主要ソース: ASSET_NUMBER, ASSET_CATEGORY_CODE, DEPRN_AMOUNT, DEPRN_EXPENSE_CCID, FA_VENDOR_NAME。' },
      { step: '2. ユーザー定義算式', table: 'XLA_FORMULAS_B / XLA_FORMULA_DETAILS', code: 'XX_FA_MONTHLY_DEPRN_FML', detail: '式: FA_DEPRN_AMOUNT * 1.0 (または税務/会計差額調整係数を乗算可能)。' },
      { step: '3. マッピングセット', table: 'XLA_MAPPING_SETS_B / VALUES', code: 'XX_FA_CAT_DEPRN_MAP', detail: '資産カテゴリ → SEGMENT3: "SERVER_HW" → 償却費"5201" / 累計額"1691", "OFFICE_EQUIP" → "5202" / "1692"。' },
      { step: '4. 勘定科目ルール(ADR)&条件', table: 'XLA_SEG_RULES_B / DETAILS / XLA_CONDITIONS', code: 'XX_FA_DEPRN_EXP_ADR / XX_FA_DEPRN_RSV_ADR', detail: '償却費明細は資産配賦部門 (SEGMENT2) を FA_DEPRN_EXPENSE_CCID から引き継ぎ、科目(SEGMENT3)のみ Mapping Set で制御。' },
      { step: '5. 仕訳摘要ルール', table: 'XLA_DESCRIPTIONS_B', code: 'XX_FA_DEPRN_DESC', detail: '"[FA] " + ASSET_NUMBER + " 減価償却費" → 例: "[FA] FA-2026-001 減価償却費"。' },
      { step: '6. 仕訳明細ルール(JLT)&属性', table: 'XLA_ACCT_LINE_TYPES_B / XLA_JLT_ACCT_ATTRS', code: 'XX_FA_DEPRN_EXP_DR / XX_FA_DEPRN_RSV_CR', detail: 'DEPRN_EXP (借方D) / DEPRN_RSV (貸方C)。配賦リンク先: FA_DEPRN_DETAIL.DISTRIBUTION_ID。' },
      { step: '7. サポート参照 (残高有/無)', table: 'XLA_ANALYTICAL_SOURCES / XLA_LINE_DEFN_AC_ASSGNS', code: 'SR_COUNTERPARTY + SR_EXT_TRACE', detail: 'SR_COUNTERPARTY(AC1) ← 購入先ベンダー (ジャパンITインフラ株式会社)。SR_EXT_TRACE: AC1=ASSET_MGR, AC2=ASSET_NUMBER, AC4=CURRENT_UNITS。' },
      { step: '8. 仕訳入力ルールセット(JERS)', table: 'XLA_LINE_DEFINITIONS_B / *_ASSGNS', code: 'FA_DEPRN_JERS', detail: '月次減価償却バッチ実行時に全資産一括評価・VALIDATED("C") 状態。' },
      { step: '9. 会計方式 & 元帳設定', table: 'XLA_ACCTG_METHOD_RULES / XLA_LEDGER_OPTIONS', code: 'XX_JP_CORP_AM (APPL=140)', detail: 'プライマリ元帳 JP_CORP_LEDGER へ直接転送。GL転送モード="D"。' }
    ]
  },
  {
    id: 'LA',
    appId: 10522,
    shortName: 'FLA',
    title: '④ Lease Accounting (LA / リース会計: APPLICATION_ID=10522)',
    tagline: 'IFRS16 / ASC842 / 新リース会計基準に基づく使用権資産(ROU)・リース負債の初期認識＆償却',
    uiNav: '設定および保守 > 財務 > リース会計 > 補助元帳会計オプション / リース会計ルール',
    journalExample: {
      event: 'LEASE_BOOKING (LA-2026-001 本社オフィスフロアリース 開始認識)',
      lines: [
        { side: 'DR', aff: '01-100-1301-000-00-000-000-000-000', desc: '使用権資産(ROU) (ROU_ASSET / XX_LA_ASSET_TYPE_MAP)', amt: '2,400,000' },
        { side: 'CR', aff: '01-100-2301-001-00-000-000-000-000', desc: 'リース負債 (LEASE_LIABILITY / SR_COUNTERPARTY 240万)', amt: '2,400,000' }
      ]
    },
    components: [
      { step: '1. イベントモデル & ソース', table: 'XLA_EVENT_CLASSES_B / XLA_EVENT_TYPES_B / XLA_SOURCES_B', code: 'LEASE_COMMENCEMENT / LEASE_BOOKING', detail: 'FLA_ACCOUNTING_HEADERS_ALL / LINES から抽出。主要ソース: LEASE_NUMBER, LEASE_ASSET_TYPE_CODE, LA_LESSOR_NAME, ENTERED_AMOUNT。' },
      { step: '2. ユーザー定義算式', table: 'XLA_FORMULAS_B / XLA_FORMULA_DETAILS', code: 'XX_LA_ROU_PV_FML', detail: '式: FLA_ENTERED_AMOUNT * 1.0 (割引現在価値ベースのROU計上額をそのまま仕訳計上)。' },
      { step: '3. マッピングセット', table: 'XLA_MAPPING_SETS_B / VALUES', code: 'XX_LA_ASSET_TYPE_MAP', detail: 'リース資産種別 → SEGMENT3: "PROPERTY"(不動産) → ROU"1301" / 負債"2301", "VEHICLE"(車両) → "1302" / "2302"。' },
      { step: '4. 勘定科目ルール(ADR)&条件', table: 'XLA_SEG_RULES_B / DETAILS / XLA_CONDITIONS', code: 'XX_LA_ROU_ASSET_ADR / XX_LA_LEASE_LIAB_ADR', detail: '条件: LEASE_ASSET_TYPE_CODE IS NOT NULL の場合 XX_LA_ASSET_TYPE_MAP で資産/負債科目を決定。' },
      { step: '5. 仕訳摘要ルール', table: 'XLA_DESCRIPTIONS_B', code: 'XX_LA_BOOKING_DESC', detail: '"[LA] " + LEASE_NUMBER + " 使用権資産/リース負債計上"。' },
      { step: '6. 仕訳明細ルール(JLT)&属性', table: 'XLA_ACCT_LINE_TYPES_B / XLA_JLT_ACCT_ATTRS', code: 'XX_LA_ROU_DR / XX_LA_LIAB_CR', detail: 'ROU_ASSET (借方D) / LEASE_LIABILITY (貸方C)。配賦元: FLA_ACCOUNTING_LINES.TRANSACTION_LINE_ID。' },
      { step: '7. サポート参照 (残高有/無)', table: 'XLA_ANALYTICAL_SOURCES / XLA_LINE_DEFN_AC_ASSGNS', code: 'SR_COUNTERPARTY + SR_EXT_TRACE', detail: 'SR_COUNTERPARTY(AC1) ← 貸主名 (東京不動産リース株式会社)。貸主別のリース負債長期管理に SR_COUNTERPARTY 残高が直結！' },
      { step: '8. 仕訳入力ルールセット(JERS)', table: 'XLA_LINE_DEFINITIONS_B / *_ASSGNS', code: 'FLA_ROU_COMMENCE_JERS', detail: 'リース開始イベント LEASE_BOOKING に対して ROU資産借方＋リース負債貸方＋SRを統合コンパイル。' },
      { step: '9. 会計方式 & 元帳設定', table: 'XLA_ACCTG_METHOD_RULES / XLA_LEDGER_OPTIONS', code: 'XX_JP_CORP_AM (APPL=10522)', detail: 'JP_CORP_LEDGER 有効化。FLA_ACCOUNTING_HEADERS_ALL.ACCOUNTED_IN_GL_FLAG が GL転送時に "N"→"Y" へ更新。' }
    ]
  }
];

// === Chapter 3-2: FAH 専用セットアップ全12工程 ===
const FAH_SETUP_STEPS = [
  {
    no: 1, phase: '設計', title: '1. 外部業務イベント分析と取引データ設計',
    tables: ['設計書 / 会計マトリクス'],
    uiTask: '外部システム(POS_BILLING / EC請求等)の明細構造洗い出し',
    detail: 'ヘッダに「相手先」「外部請求書番号」「満期日」、明細に「外部システム」「サービス種別」「数量」「単価」を持たせ、合計金額はSLA算式で算出する設計を確定する。'
  },
  {
    no: 2, phase: '登録', title: '2. FAH登録スプレッドシート (AccountingHubSetup.xlsm) 作成',
    tables: ['テンプレート作成'],
    uiTask: '設定および保守 > 会計ハブ > スプレッドシートからの登録',
    detail: 'Oracle標準の登録テンプレートにアプリケーション名 XX_FAH_CLOUD、イベントタイプ XX_CLOUD_REV_RECOG、ヘッダ/明細列定義(CHAR1..2, NUMBER1..2, DATE1)を記入する。'
  },
  {
    no: 3, phase: '基盤生成', title: '3. サブ元帳アプリケーション登録 (APPLICATION_ID=20001)',
    tables: ['XLA_SUBLEDGERS'],
    uiTask: '登録zipアップロード / 会計ハブ・アプリケーション登録',
    detail: 'XLA_SUBLEDGERS に APPLICATION_ID=20001, SHORT_NAME="XX_FAH_CLOUD", JE_SOURCE_NAME="XX Cloud Billing Hub" が自動生成される。'
  },
  {
    no: 4, phase: '基盤生成', title: '4. イベントクラス・イベントタイプ自動生成',
    tables: ['XLA_EVENT_CLASSES_B', 'XLA_EVENT_TYPES_B'],
    uiTask: 'サブ元帳アプリケーションの編集 > イベントタイプ',
    detail: 'ENTITY_CODE="XX_CLOUD_BILLING", EVENT_CLASS_CODE="XX_CLOUD_BILLING", EVENT_TYPE_CODE="XX_CLOUD_REV_RECOG" (ACCOUNTING_FLAG="Y") が登録される。'
  },
  {
    no: 5, phase: 'ソース定義', title: '5. カスタム取引オブジェクト ＆ ソース定義',
    tables: ['XLA_SOURCES_B'],
    uiTask: 'サブ元帳ソースの確認 (ヘッダ / 明細ソース)',
    detail: 'HEADER_CHAR1(相手先), HEADER_CHAR2(外部請求書番号), HEADER_DATE1(満期日), LINE_CHAR1(外部システム), LINE_CHAR2(サービス種別), LINE_NUMBER1(数量), LINE_NUMBER2(単価) がソース登録される。'
  },
  {
    no: 6, phase: '取込制御', title: '6. FAH インタフェース制御＆結合ロード定義',
    tables: ['XLA_TRANSACTION_INT_CONTROLS'],
    uiTask: 'トランザクション取込コントロール管理',
    detail: 'PROCESSING_GROUP_NAME="FAH_GRP_202604" とし、XLA_TRANSACTION_HEADERS_INT / LINES_INT から Base表への COMBINED_IMPORT_AND_LOAD_FLAG="Y" を設定する。'
  },
  {
    no: 7, phase: '属性マップ', title: '7. 会計属性 (Accounting Attributes) マッピング確認',
    tables: ['XLA_JLT_ACCT_ATTRS (システム属性)'],
    uiTask: 'サブ元帳アプリケーションの編集 > 会計属性の割当',
    detail: 'TRANSACTION_DATE, ACCOUNTING_DATE, CURRENCY_CODE ("JPY"), LEDGER_ID を FAHヘッダソース列へ紐付ける。'
  },
  {
    no: 8, phase: 'AMB部品①', title: '8. ユーザー定義算式 (User-Defined Formula) 構築',
    tables: ['XLA_FORMULAS_B', 'XLA_FORMULA_DETAILS'],
    uiTask: '設定および保守 > 会計ハブ > ユーザー定義算式の管理',
    detail: 'XX_FAH_LINE_AMT_FML を作成し、POSTFIX_EXPR に "LINE_NUMBER1", "LINE_NUMBER2", "*" (300 × 1,000 = 300,000円) を定義する。'
  },
  {
    no: 9, phase: 'AMB部品②', title: '9. マッピング・セット (Mapping Set) 定義',
    tables: ['XLA_MAPPING_SETS_B', 'XLA_MAPPING_SET_VALUES'],
    uiTask: '設定および保守 > 会計ハブ > マッピング・セットの管理',
    detail: 'XX_FAH_SVC_ACCT_MAP を作成。入力=LINE_CHAR2 (サービス種別), 出力=SEGMENT3: "SaaS_USAGE" → "4102", "CONS_SVC" → "4103"。'
  },
  {
    no: 10, phase: 'AMB部品③', title: '10. 勘定科目ルール (ADR) ＆ 条件式定義',
    tables: ['XLA_SEG_RULES_B', 'XLA_SEG_RULE_DETAILS', 'XLA_CONDITIONS'],
    uiTask: '設定および保守 > 会計ハブ > 勘定科目ルールの管理',
    detail: 'XX_FAH_REV_ACCT_ADR を作成（条件: LINE_CHAR2 IS NOT NULL なら XX_FAH_SVC_ACCT_MAP を評価、ELSE 定数 "4101"）。他に XX_FAH_AR_1101_ADR ("1101") 等も作成。'
  },
  {
    no: 11, phase: 'AMB部品④', title: '11. 摘要・JLT・サポート参照 (残高有/無) 設定',
    tables: ['XLA_DESCRIPTIONS_B', 'XLA_ACCT_LINE_TYPES_B', 'XLA_JLT_ACCT_ATTRS', 'XLA_ANALYTICAL_*'],
    uiTask: 'JLT & 摘要 & サポート参照の管理',
    detail: 'XX_FAH_AR_DR_JLT / XX_FAH_REV_CR_JLT の ENTERED_AMOUNT に算式 XX_FAH_LINE_AMT_FML を割当。残高有 SR_COUNTERPARTY と 残高無 SR_EXT_TRACE を定義。'
  },
  {
    no: 12, phase: '有効化&稼働', title: '12. JERS検証・会計方式組込・FBDI取込実行',
    tables: ['XLA_LINE_DEFINITIONS_B', 'XLA_ACCTG_METHOD_RULES', 'XLA_TRANSACTION_HEADERS_INT', 'XLA_TRANSACTION_HEADERS'],
    uiTask: '仕訳入力ルールセットの有効化 → 会計ハブ・トランザクションのインポート',
    detail: 'XX_FAH_CLOUD_JERS (STATUS="C") を XX_JP_CORP_AM へ組み込み。FBDI ZIP投入により INT(NEW→PROCESSED) → Base表 → XLA_EVENTS(500005) → 仕訳生成！'
  }
];

// === Chapter 4: サポート参照 & DFF & AFF 比較データ ===
const SR_ARCHITECTURE = {
  definitions: [
    {
      code: 'SR_COUNTERPARTY',
      name: '残高有サポート参照：相手先',
      balancingFlag: 'Y',
      carryForward: 'A (常に年度末繰越 / Always)',
      slots: [{ slot: 'AC1', code: 'COUNTERPARTY', jp: '相手先', dtype: '文字(C)' }],
      tables: 'XLA_ANALYTICAL_HDRS_B → XLA_AE_LINE_ACS → XLA_AC_BALANCES',
      crossSubledgerMap: [
        { sub: 'AP (200)', source: 'AP_VENDOR_NAME', ex: 'テックサポート株式会社' },
        { sub: 'AR (222)', source: 'AR_BILL_TO_CUST_NAME', ex: '株式会社グローバル商事' },
        { sub: 'FA (140)', source: 'FA_VENDOR_NAME', ex: 'ジャパンITインフラ株式会社' },
        { sub: 'LA (10522)', source: 'LA_LESSOR_NAME', ex: '東京不動産リース株式会社' },
        { sub: 'FAH (20001)', source: 'HEADER_CHAR1', ex: '株式会社グローバル商事' }
      ],
      point: 'ARの請求先とFAHのHEADER_CHAR1がどちらも「株式会社グローバル商事」であるため、異なるサブ元帳を横断して XLA_AC_BALANCES 上で同一相手先の売掛金残高を統合管理できる！'
    },
    {
      code: 'SR_EXT_TRACE',
      name: '残高無サポート参照：外部取引詳細5軸',
      balancingFlag: 'N',
      carryForward: 'N (残高保持なし・明細属性のみ)',
      slots: [
        { slot: 'AC1', code: 'EXT_SYSTEM', jp: '外部システム', dtype: '文字(C)' },
        { slot: 'AC2', code: 'EXT_INV_NUM', jp: '外部請求書番号', dtype: '文字(C)' },
        { slot: 'AC3', code: 'MATURITY_DATE', jp: '満期日', dtype: '日付(D)' },
        { slot: 'AC4', code: 'QTY', jp: '数量', dtype: '数値(N)' },
        { slot: 'AC5', code: 'UNIT_PRICE', jp: '単価', dtype: '数値(N)' }
      ],
      tables: 'XLA_ANALYTICAL_HDRS_B → XLA_AE_LINE_ACS (XLA_AC_BALANCESには入らない！)',
      crossSubledgerMap: [
        { sub: 'FAH (20001)', source: 'LINE_CHAR1 / HEADER_CHAR2 / HEADER_DATE1 / LINE_NUMBER1 / LINE_NUMBER2', ex: 'POS_BILLING / EXT-2026-0891 / 2026-05-31 / 300 / 1000' },
        { sub: 'AP (200)', source: 'AP_PORTAL / INVOICE_NUM / TERMS_DATE / QTY / UNIT_PRICE', ex: 'AP_PORTAL / EXT-AP-771 / 2026-05-10 / 10 / 50000' },
        { sub: 'AR (222)', source: 'EC_ORDER / TRX_NUMBER / DUE_DATE / QTY / UNIT_SELLING_PRICE', ex: 'EC_ORDER / AR-2026-001 / 2026-05-12 / 4 / 200000' }
      ],
      point: '伝票番号や単価のようにカーディナリティ（組合せ数）が高い項目を残高有にするとテーブルが爆発する。残高無(N)にすることで監査証跡を構造化保持しつつ性能劣化を防ぐ。'
    }
  ],
  comparisonMatrix: [
    { item: '残高テーブル (Balance)', srBalY: 'XLA_AC_BALANCES へ「CCID × AC1 × 期間」残高自動集計', srBalN: '残高表なし（監査・検索属性のみ）', dff: '残高表なし（単一取引行のみ）', aff: 'GL_BALANCES に全組合せCCID単位で集計' },
    { item: '格納先物理テーブル', srBalY: 'XLA_AE_LINE_ACS + XLA_AC_BALANCES', srBalN: 'XLA_AE_LINE_ACS (AC1..AC5)', dff: '各業務表 ATTRIBUTE1..15', aff: 'GL_CODE_COMBINATIONS (SEGMENT1..9)' },
    { item: '最大項目数 / 属性制約', srBalY: '最大5項目 (実務は1〜2項目推奨)', srBalN: '最大5項目 (AC1..AC5)', dff: 'サブ元帳表ごと自由多数', aff: '勘定体系セグメント数固定 (今回9軸)' },
    { item: 'サブ元帳横断での正規化', srBalY: 'XLA_ANALYTICAL_SOURCES で5サブ元帳を1つのSRコードへ統一可能', srBalN: '同様に5サブ元帳で共通項目名に統合可能', dff: 'テーブル毎ATTRIBUTE列がバラバラで非統一', aff: 'GL転記時点で全サブ元帳共通のCCID' },
    { item: 'GLへの影響・組合せ爆発', srBalY: 'GL転記には影響せずSLA内で詳細残高管理（GL肥大化防止！）', srBalN: 'GL影響なし＆SLA残高表肥大化もなし', dff: 'GL持ち回り不可または個別設定要', aff: '取引先を増やすとCCID数爆発＆GL試算表肥大化' },
    { item: '年度末残高繰越', srBalY: 'YEAR_END_CARRY_FORWARD_CODE="A" で自動翌期繰越', srBalN: 'なし', dff: 'なし', aff: 'BS科目(A/L/O)はGLで自動繰越' }
  ]
};

// === Chapter 5: 残高有サポート参照単位の SLA残高管理 6フェーズ推移 ===
// コア検証シナリオ: CCID=1001 (売掛金) について
// - 株式会社グローバル商事: 期首 500,000 + AR 880,000 + FAH 300,000 - 入金消込 600,000 = 期末 1,080,000円
// - 第二商事株式会社: 期首 400,000 (期中変動なし) = 期末 400,000円
// -> GL_BALANCES (CCID=1001) = 期首 900,000 + 期中純DR 580,000 = 期末 1,480,000円 (100%一致!)
const SR_BALANCE_PHASES = [
  {
    phase: 1,
    code: 'Phase 1',
    period: '2026-04 (期首)',
    shortLabel: '期首残高設定',
    title: 'Phase 1: 期首繰越残高 (BEGINNING_BALANCE_DR = 900,000円)',
    explanation: '前会計期間末からの繰越処理により、CCID=1001 (売掛金) の XLA_AC_BALANCES に取引先別期首残高（株式会社グローバル商事 500,000円、第二商事株式会社 400,000円）が保持されています。GL_BALANCES のCCID=1001 期首残は合算の 900,000円です。',
    aeEvent: '前年度末繰越バッチ (Carry Forward)',
    flowHighlight: ['CARRY_FWD', 'XLA_AC_BAL', 'GL_BAL'],
    acBalancesRows: [
      { appl: '222 (AR)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 500000, begCr: 0, perDr: 0, perCr: 0, updated: false },
      { appl: '20001 (FAH)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 0, begCr: 0, perDr: 0, perCr: 0, updated: false },
      { appl: '222 (AR)', ccid: 1001, ac1: '第二商事株式会社', period: '2026-04', begDr: 400000, begCr: 0, perDr: 0, perCr: 0, updated: false }
    ],
    glBalance: { ccid: 1001, period: '2026-04', begDr: 900000, netDr: 0, netCr: 0, endDr: 900000 }
  },
  {
    phase: 2,
    code: 'Phase 2',
    period: '2026-04-12',
    shortLabel: 'AR請求 +88万',
    title: 'Phase 2: AR 売掛請求計上 (+880,000円) → AC_BALANCES DR増加',
    explanation: 'AR-2026-001 (株式会社グローバル商事) の Create Accounting が実行され、XLA_AE_LINES (DR 1001: 880,000円) と XLA_AE_LINE_ACS (AC1="株式会社グローバル商事") が生成。XLA_AC_BALANCES の APPL=222 行 PERIOD_BALANCE_DR が +880,000円 増加します。',
    aeEvent: 'AR Event 500002 (AR-2026-001 請求計上)',
    flowHighlight: ['TXN_AR', 'XLA_AE_LINE', 'XLA_LINE_ACS', 'XLA_AC_BAL'],
    acBalancesRows: [
      { appl: '222 (AR)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 500000, begCr: 0, perDr: 880000, perCr: 0, updated: true },
      { appl: '20001 (FAH)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 0, begCr: 0, perDr: 0, perCr: 0, updated: false },
      { appl: '222 (AR)', ccid: 1001, ac1: '第二商事株式会社', period: '2026-04', begDr: 400000, begCr: 0, perDr: 0, perCr: 0, updated: false }
    ],
    glBalance: { ccid: 1001, period: '2026-04', begDr: 900000, netDr: 880000, netCr: 0, endDr: 1780000 }
  },
  {
    phase: 3,
    code: 'Phase 3',
    period: '2026-04-20',
    shortLabel: 'FAH請求 +30万',
    title: 'Phase 3: FAH 外部請求計上 (+300,000円) → サブ元帳横断で同一相手先へ蓄積',
    explanation: '外部 POS_BILLING からの FAH-2026-001 も同じく株式会社グローバル商事向け売掛金 (CCID=1001) です。HEADER_CHAR1 が SR_COUNTERPARTY へ正規化されているため、同一相手先の累積売掛残高は 500,000 + 880,000 + 300,000 = 1,680,000円 として横断把握されます！',
    aeEvent: 'FAH Event 500005 (FAH-2026-001 クラウド請求)',
    flowHighlight: ['TXN_FAH', 'XLA_AE_LINE', 'XLA_LINE_ACS', 'XLA_AC_BAL'],
    acBalancesRows: [
      { appl: '222 (AR)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 500000, begCr: 0, perDr: 880000, perCr: 0, updated: false },
      { appl: '20001 (FAH)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 0, begCr: 0, perDr: 300000, perCr: 0, updated: true },
      { appl: '222 (AR)', ccid: 1001, ac1: '第二商事株式会社', period: '2026-04', begDr: 400000, begCr: 0, perDr: 0, perCr: 0, updated: false }
    ],
    glBalance: { ccid: 1001, period: '2026-04', begDr: 900000, netDr: 1180000, netCr: 0, endDr: 2080000 }
  },
  {
    phase: 4,
    code: 'Phase 4',
    period: '2026-04-25',
    shortLabel: '入金消込 -60万',
    title: 'Phase 4: AR 一部入金消込 (-600,000円) → AC_BALANCES.PERIOD_BALANCE_CR 加算(純減)',
    explanation: '株式会社グローバル商事から 600,000円 の一部入金 (REC-2026-001) が消込まれると、売掛金貸方仕訳 (CR CCID=1001: 600,000円) が発生し、XLA_AC_BALANCES.PERIOD_BALANCE_CR に 600,000円 が計上されます。株式会社グローバル商事の期末純残高は 1,080,000円 となります。',
    aeEvent: 'AR Receipt Event 500006 (REC-2026-001 入金消込)',
    flowHighlight: ['TXN_REC', 'XLA_AE_LINE', 'XLA_LINE_ACS', 'XLA_AC_BAL'],
    acBalancesRows: [
      { appl: '222 (AR)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 500000, begCr: 0, perDr: 880000, perCr: 600000, updated: true },
      { appl: '20001 (FAH)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 0, begCr: 0, perDr: 300000, perCr: 0, updated: false },
      { appl: '222 (AR)', ccid: 1001, ac1: '第二商事株式会社', period: '2026-04', begDr: 400000, begCr: 0, perDr: 0, perCr: 0, updated: false }
    ],
    glBalance: { ccid: 1001, period: '2026-04', begDr: 900000, netDr: 1180000, netCr: 600000, endDr: 1480000 }
  },
  {
    phase: 5,
    code: 'Phase 5',
    period: '2026-04-30',
    shortLabel: 'GL照合・一致検証',
    title: 'Phase 5: GL_BALANCES 総勘定元帳との期末残高 100%照合検証 (1,480,000円)',
    explanation: 'GL転記完了後、GL_BALANCES (CCID=1001 売掛金) の2026-04末残高 1,480,000円 と、XLA_AC_BALANCES 全取引先合算 (株式会社グローバル商事 1,080,000円 + 第二商事株式会社 400,000円 = 1,480,000円) が1円のズレなく完全に一致します。',
    aeEvent: '月次締め・サブ元帳対一般会計残高照合',
    flowHighlight: ['XLA_AC_BAL', 'GL_BAL'],
    acBalancesRows: [
      { appl: '222 (AR)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 500000, begCr: 0, perDr: 880000, perCr: 600000, updated: false },
      { appl: '20001 (FAH)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-04', begDr: 0, begCr: 0, perDr: 300000, perCr: 0, updated: false },
      { appl: '222 (AR)', ccid: 1001, ac1: '第二商事株式会社', period: '2026-04', begDr: 400000, begCr: 0, perDr: 0, perCr: 0, updated: false }
    ],
    glBalance: { ccid: 1001, period: '2026-04', begDr: 900000, netDr: 1180000, netCr: 600000, endDr: 1480000 }
  },
  {
    phase: 6,
    code: 'Phase 6',
    period: '2026-05 (翌期首)',
    shortLabel: '翌期繰越生成',
    title: 'Phase 6: 期間オープン＆年度末繰越 (YEAR_END_CARRY_FORWARD_CODE="A") → 2026-05期首',
    explanation: '翌期間 (2026-05) をオープンすると、2026-04の期末純残高（株式会社グローバル商事 AR=780,000 / FAH=300,000 [計1,080,000], 第二商事株式会社 AR=400,000）がそのまま 2026-05 の BEGINNING_BALANCE_DR へ繰り越されます。',
    aeEvent: '期間オープン / Carry Forward バッチ実行',
    flowHighlight: ['XLA_AC_BAL', 'CARRY_FWD', 'GL_BAL'],
    acBalancesRows: [
      { appl: '222 (AR)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-05', begDr: 780000, begCr: 0, perDr: 0, perCr: 0, updated: true },
      { appl: '20001 (FAH)', ccid: 1001, ac1: '株式会社グローバル商事', period: '2026-05', begDr: 300000, begCr: 0, perDr: 0, perCr: 0, updated: true },
      { appl: '222 (AR)', ccid: 1001, ac1: '第二商事株式会社', period: '2026-05', begDr: 400000, begCr: 0, perDr: 0, perCr: 0, updated: true }
    ],
    glBalance: { ccid: 1001, period: '2026-05', begDr: 1480000, netDr: 0, netCr: 0, endDr: 1480000 }
  }
];

// === Chapter 6 & Excel用 OEDMF 26D 完全テーブル・レコード集 ===
// 各レコードには Excel出力向けの changeLog / stepTag を付与
const OEDMF_TABLES = [
  // --- A. 共通組織・COA・元帳・会計方式 ---
  {
    id: 'XLE_ENTITY_PROFILES', category: 'COA_LEDGER', module: 'COMMON', desc: '法的エンティティマスタ',
    cols: ['LEGAL_ENTITY_ID', 'NAME', 'LEGAL_ENTITY_IDENTIFIER', 'COUNTRY', 'TRANSACTING_ENTITY_FLAG'],
    rows: [{ step: '事前設定', data: { LEGAL_ENTITY_ID: 50001, NAME: '日本法人株式会社', LEGAL_ENTITY_IDENTIFIER: 'JP-LE-01', COUNTRY: 'JP', TRANSACTING_ENTITY_FLAG: 'Y' } }]
  },
  {
    id: 'HR_ALL_ORGANIZATION_UNITS_F', category: 'COA_LEDGER', module: 'COMMON', desc: '事業単位(BU/OU)マスタ',
    cols: ['ORGANIZATION_ID', 'NAME', 'EFFECTIVE_START_DATE', 'EFFECTIVE_END_DATE', 'BUSINESS_GROUP_ID'],
    rows: [{ step: '事前設定', data: { ORGANIZATION_ID: 3001, NAME: 'JP_CORP_BU', EFFECTIVE_START_DATE: '2026-01-01', EFFECTIVE_END_DATE: '4712-12-31', BUSINESS_GROUP_ID: 1 } }]
  },
  {
    id: 'FND_ID_FLEX_SEGMENTS', category: 'COA_LEDGER', module: 'COMMON', desc: 'AFF 9セグメント体系定義 (JP_COA_9SEG)',
    cols: ['APPLICATION_ID', 'ID_FLEX_CODE', 'ID_FLEX_NUM', 'APPLICATION_COLUMN_NAME', 'SEGMENT_NAME', 'SEGMENT_NUM'],
    rows: AFF_SEGMENTS.map(s => ({ step: '事前設定', data: { APPLICATION_ID: 101, ID_FLEX_CODE: 'GL#', ID_FLEX_NUM: 101, APPLICATION_COLUMN_NAME: s.col, SEGMENT_NAME: s.name, SEGMENT_NUM: s.num } }))
  },
  {
    id: 'GL_CODE_COMBINATIONS', category: 'COA_LEDGER', module: 'COMMON', desc: '勘定組合せマスタ (12 CCID)',
    cols: ['CODE_COMBINATION_ID', 'CHART_OF_ACCOUNTS_ID', 'ACCOUNT_TYPE', 'SEGMENT1', 'SEGMENT2', 'SEGMENT3', 'SEGMENT4', 'SEGMENT5', 'SEGMENT6', 'ENABLED_FLAG'],
    rows: CCID_LIST.map(c => {
      const segs = c.aff.split('-');
      return { step: '事前設定', data: { CODE_COMBINATION_ID: c.id, CHART_OF_ACCOUNTS_ID: 101, ACCOUNT_TYPE: c.type, SEGMENT1: segs[0], SEGMENT2: segs[1], SEGMENT3: segs[2], SEGMENT4: segs[3], SEGMENT5: segs[4], SEGMENT6: segs[5], ENABLED_FLAG: 'Y' } };
    })
  },
  {
    id: 'GL_LEDGERS', category: 'COA_LEDGER', module: 'COMMON', desc: 'プライマリ元帳・会計方式割当',
    cols: ['LEDGER_ID', 'NAME', 'SHORT_NAME', 'CHART_OF_ACCOUNTS_ID', 'CURRENCY_CODE', 'PERIOD_SET_NAME', 'SLA_ACCOUNTING_METHOD_CODE', 'SLA_ACCOUNTING_METHOD_TYPE'],
    rows: [{ step: '設定更新', updatedCols: ['SLA_ACCOUNTING_METHOD_CODE', 'SLA_ACCOUNTING_METHOD_TYPE'], oldValues: { SLA_ACCOUNTING_METHOD_CODE: 'STANDARD_ACCRUAL', SLA_ACCOUNTING_METHOD_TYPE: 'S' }, data: { LEDGER_ID: 300001, NAME: 'JP_CORP_LEDGER', SHORT_NAME: 'JP_CORP', CHART_OF_ACCOUNTS_ID: 101, CURRENCY_CODE: 'JPY', PERIOD_SET_NAME: 'JP_FY_CAL', SLA_ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', SLA_ACCOUNTING_METHOD_TYPE: 'C' } }]
  },
  {
    id: 'XLA_ACCTG_METHODS_B', category: 'COA_LEDGER', module: 'COMMON', desc: '会計方式 (Accounting Method) ヘッダ',
    cols: ['ACCOUNTING_METHOD_TYPE_CODE', 'ACCOUNTING_METHOD_CODE', 'TRANSACTION_COA_ID', 'ACCOUNTING_COA_ID', 'ENABLED_FLAG'],
    rows: [{ step: 'AMB有効化', isNew: true, data: { ACCOUNTING_METHOD_TYPE_CODE: 'C', ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', TRANSACTION_COA_ID: 101, ACCOUNTING_COA_ID: 101, ENABLED_FLAG: 'Y' } }]
  },
  {
    id: 'XLA_ACCTG_METHOD_RULES', category: 'COA_LEDGER', module: 'COMMON', desc: '会計方式×5大サブ元帳JERS割当',
    cols: ['ACCTG_METHOD_RULE_ID', 'ACCOUNTING_METHOD_CODE', 'APPLICATION_ID', 'PRODUCT_RULE_TYPE_CODE', 'PRODUCT_RULE_CODE', 'START_DATE_ACTIVE', 'AMB_CONTEXT_CODE'],
    rows: [
      { step: 'AP組込', isNew: true, data: { ACCTG_METHOD_RULE_ID: 9501, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 200, PRODUCT_RULE_TYPE_CODE: 'C', PRODUCT_RULE_CODE: 'XX_AP_INVOICE_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } },
      { step: 'AR組込', isNew: true, data: { ACCTG_METHOD_RULE_ID: 9502, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 222, PRODUCT_RULE_TYPE_CODE: 'C', PRODUCT_RULE_CODE: 'XX_AR_INVOICE_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } },
      { step: 'FA組込', isNew: true, data: { ACCTG_METHOD_RULE_ID: 9503, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 140, PRODUCT_RULE_TYPE_CODE: 'C', PRODUCT_RULE_CODE: 'XX_FA_DEPRN_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } },
      { step: 'LA組込', isNew: true, data: { ACCTG_METHOD_RULE_ID: 9504, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 10522, PRODUCT_RULE_TYPE_CODE: 'C', PRODUCT_RULE_CODE: 'XX_LA_BOOKING_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } },
      { step: 'FAH組込', isNew: true, data: { ACCTG_METHOD_RULE_ID: 9505, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 20001, PRODUCT_RULE_TYPE_CODE: 'C', PRODUCT_RULE_CODE: 'XX_FAH_CLOUD_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } }
    ]
  },
  {
    id: 'XLA_LEDGER_OPTIONS', category: 'COA_LEDGER', module: 'COMMON', desc: '元帳×各サブ元帳SLA会計設定',
    cols: ['LEDGER_ID', 'APPLICATION_ID', 'TRANSFER_TO_GL_MODE_CODE', 'ACCT_REVERSAL_OPTION_CODE', 'ROUNDING_RULE_CODE', 'ENABLE_SUBMIT_POSTING_FLAG', 'ENABLED_FLAG'],
    rows: [200, 222, 140, 10522, 20001].map(appId => ({
      step: '元帳設定', isNew: true,
      data: { LEDGER_ID: 300001, APPLICATION_ID: appId, TRANSFER_TO_GL_MODE_CODE: 'D', ACCT_REVERSAL_OPTION_CODE: 'NONE', ROUNDING_RULE_CODE: 'NEAREST', ENABLE_SUBMIT_POSTING_FLAG: 'Y', ENABLED_FLAG: 'Y' }
    }))
  },

  // --- B. イベントモデル・ソース・FAHコントロール ---
  {
    id: 'XLA_SUBLEDGERS', category: 'SUBLEDGER_META', module: 'FAH', desc: 'サブ元帳アプリケーション定義 (AP/AR/FA/LA + FAH 20001)',
    cols: ['APPLICATION_ID', 'APPLICATION_SHORT_NAME', 'JE_SOURCE_NAME', 'CONTROL_ACCOUNT_TYPE_CODE', 'VALUATION_METHOD_FLAG'],
    rows: [
      { step: '標準定義', data: { APPLICATION_ID: 200, APPLICATION_SHORT_NAME: 'SQLAP', JE_SOURCE_NAME: 'Payables', CONTROL_ACCOUNT_TYPE_CODE: 'Y', VALUATION_METHOD_FLAG: 'N' } },
      { step: '標準定義', data: { APPLICATION_ID: 222, APPLICATION_SHORT_NAME: 'AR', JE_SOURCE_NAME: 'Receivables', CONTROL_ACCOUNT_TYPE_CODE: 'Y', VALUATION_METHOD_FLAG: 'N' } },
      { step: '標準定義', data: { APPLICATION_ID: 140, APPLICATION_SHORT_NAME: 'OFA', JE_SOURCE_NAME: 'Assets', CONTROL_ACCOUNT_TYPE_CODE: 'N', VALUATION_METHOD_FLAG: 'N' } },
      { step: '標準定義', data: { APPLICATION_ID: 10522, APPLICATION_SHORT_NAME: 'FLA', JE_SOURCE_NAME: 'Lease Accounting', CONTROL_ACCOUNT_TYPE_CODE: 'N', VALUATION_METHOD_FLAG: 'N' } },
      { step: 'FAH登録', isNew: true, data: { APPLICATION_ID: 20001, APPLICATION_SHORT_NAME: 'XX_FAH_CLOUD', JE_SOURCE_NAME: 'XX Cloud Billing Hub', CONTROL_ACCOUNT_TYPE_CODE: 'N', VALUATION_METHOD_FLAG: 'N' } }
    ]
  },
  {
    id: 'XLA_EVENT_CLASSES_B', category: 'SUBLEDGER_META', module: 'ALL', desc: '会計イベントクラス定義 (5大サブ元帳)',
    cols: ['APPLICATION_ID', 'ENTITY_CODE', 'EVENT_CLASS_CODE', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP', data: { APPLICATION_ID: 200, ENTITY_CODE: 'AP_INVOICES', EVENT_CLASS_CODE: 'INVOICES', ENABLED_FLAG: 'Y' } },
      { step: 'AR', data: { APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', EVENT_CLASS_CODE: 'INVOICE', ENABLED_FLAG: 'Y' } },
      { step: 'AR', data: { APPLICATION_ID: 222, ENTITY_CODE: 'RECEIPTS', EVENT_CLASS_CODE: 'RECEIPT', ENABLED_FLAG: 'Y' } },
      { step: 'FA', data: { APPLICATION_ID: 140, ENTITY_CODE: 'DEPRECIATION', EVENT_CLASS_CODE: 'DEPRECIATION', ENABLED_FLAG: 'Y' } },
      { step: 'LA', data: { APPLICATION_ID: 10522, ENTITY_CODE: 'LEASE_TRANSACTIONS', EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', ENABLED_FLAG: 'Y' } },
      { step: 'FAH', isNew: true, data: { APPLICATION_ID: 20001, ENTITY_CODE: 'XX_CLOUD_BILLING', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_EVENT_TYPES_B', category: 'SUBLEDGER_META', module: 'ALL', desc: '会計イベントタイプ定義',
    cols: ['APPLICATION_ID', 'ENTITY_CODE', 'EVENT_CLASS_CODE', 'EVENT_TYPE_CODE', 'ACCOUNTING_FLAG', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP', data: { APPLICATION_ID: 200, ENTITY_CODE: 'AP_INVOICES', EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
      { step: 'AR', data: { APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
      { step: 'AR', data: { APPLICATION_ID: 222, ENTITY_CODE: 'RECEIPTS', EVENT_CLASS_CODE: 'RECEIPT', EVENT_TYPE_CODE: 'RECP_CREATE', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
      { step: 'FA', data: { APPLICATION_ID: 140, ENTITY_CODE: 'DEPRECIATION', EVENT_CLASS_CODE: 'DEPRECIATION', EVENT_TYPE_CODE: 'DEPRECIATION', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
      { step: 'LA', data: { APPLICATION_ID: 10522, ENTITY_CODE: 'LEASE_TRANSACTIONS', EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', EVENT_TYPE_CODE: 'LEASE_BOOKING', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
      { step: 'FAH', isNew: true, data: { APPLICATION_ID: 20001, ENTITY_CODE: 'XX_CLOUD_BILLING', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_SOURCES_B', category: 'SUBLEDGER_META', module: 'ALL', desc: 'トランザクションソース属性定義 (標準＋FAHカスタム)',
    cols: ['APPLICATION_ID', 'SOURCE_CODE', 'SOURCE_TYPE_CODE', 'DATATYPE_CODE', 'VIEW_APPLICATION_ID', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP', data: { APPLICATION_ID: 200, SOURCE_CODE: 'AP_VENDOR_NAME', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 200, ENABLED_FLAG: 'Y' } },
      { step: 'AP', data: { APPLICATION_ID: 200, SOURCE_CODE: 'AP_PURCHASING_CATEGORY', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 200, ENABLED_FLAG: 'Y' } },
      { step: 'AR', data: { APPLICATION_ID: 222, SOURCE_CODE: 'AR_BILL_TO_CUST_NAME', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 222, ENABLED_FLAG: 'Y' } },
      { step: 'AR', data: { APPLICATION_ID: 222, SOURCE_CODE: 'AR_LINE_ITEM_CAT', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 222, ENABLED_FLAG: 'Y' } },
      { step: 'FA', data: { APPLICATION_ID: 140, SOURCE_CODE: 'ASSET_CATEGORY_CODE', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 140, ENABLED_FLAG: 'Y' } },
      { step: 'FA', data: { APPLICATION_ID: 140, SOURCE_CODE: 'FA_VENDOR_NAME', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 140, ENABLED_FLAG: 'Y' } },
      { step: 'LA', data: { APPLICATION_ID: 10522, SOURCE_CODE: 'LA_LESSOR_NAME', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 10522, ENABLED_FLAG: 'Y' } },
      { step: 'LA', data: { APPLICATION_ID: 10522, SOURCE_CODE: 'LEASE_ASSET_TYPE_CODE', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 10522, ENABLED_FLAG: 'Y' } },
      { step: 'FAH登録', isNew: true, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_CHAR1', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
      { step: 'FAH登録', isNew: true, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_CHAR2', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
      { step: 'FAH登録', isNew: true, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_DATE1', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'D', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
      { step: 'FAH登録', isNew: true, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_CHAR1', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
      { step: 'FAH登録', isNew: true, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_CHAR2', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
      { step: 'FAH登録', isNew: true, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_NUMBER1', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'N', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
      { step: 'FAH登録', isNew: true, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_NUMBER2', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'N', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_TRANSACTION_INT_CONTROLS', category: 'SUBLEDGER_META', module: 'FAH', desc: 'FAH 外部インタフェース取込制御',
    cols: ['INTERFACE_CONTROL_ID', 'APPLICATION_ID', 'PROCESSING_GROUP_NAME', 'HEADER_INTERFACE_TABLE_NAME', 'LINE_INTERFACE_TABLE_NAME', 'COMBINED_IMPORT_AND_LOAD_FLAG'],
    rows: [{ step: 'FAH登録', isNew: true, data: { INTERFACE_CONTROL_ID: 9001, APPLICATION_ID: 20001, PROCESSING_GROUP_NAME: 'FAH_GRP_202604', HEADER_INTERFACE_TABLE_NAME: 'XLA_TRANSACTION_HEADERS_INT', LINE_INTERFACE_TABLE_NAME: 'XLA_TRANSACTION_LINES_INT', COMBINED_IMPORT_AND_LOAD_FLAG: 'Y' } }]
  },

  // --- C. AMB セットアップ (全5サブ元帳のルール一式) ---
  {
    id: 'XLA_FORMULAS_B', category: 'AMB_SETUP', module: 'ALL', desc: 'ユーザー定義算式ヘッダ (AP/AR/FA/LA/FAH)',
    cols: ['APPLICATION_ID', 'AMB_CONTEXT_CODE', 'FORMULA_CODE', 'FORMULA_ID', 'DATATYPE_CODE', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP算式', isNew: true, data: { APPLICATION_ID: 200, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_CODE: 'XX_AP_NET_EXP_FML', FORMULA_ID: 7011, DATATYPE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'AR算式', isNew: true, data: { APPLICATION_ID: 222, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_CODE: 'XX_AR_REV_CALC_FML', FORMULA_ID: 7021, DATATYPE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'FA算式', isNew: true, data: { APPLICATION_ID: 140, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_CODE: 'XX_FA_MONTHLY_DEPRN_FML', FORMULA_ID: 7031, DATATYPE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'LA算式', isNew: true, data: { APPLICATION_ID: 10522, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_CODE: 'XX_LA_ROU_PV_FML', FORMULA_ID: 7041, DATATYPE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'FAH算式', isNew: true, data: { APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_CODE: 'XX_FAH_LINE_AMT_FML', FORMULA_ID: 7001, DATATYPE_CODE: 'N', ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_FORMULA_DETAILS', category: 'AMB_SETUP', module: 'ALL', desc: 'ユーザー定義算式明細 (Postfix演算子)',
    cols: ['FORMULA_DETAIL_ID', 'APPLICATION_ID', 'FORMULA_ID', 'USER_SEQUENCE', 'EXPR_TYPE', 'POSTFIX_EXPR'],
    rows: [
      { step: 'FAH算式', isNew: true, data: { FORMULA_DETAIL_ID: 7101, APPLICATION_ID: 20001, FORMULA_ID: 7001, USER_SEQUENCE: 1, EXPR_TYPE: 'S', POSTFIX_EXPR: 'LINE_NUMBER1' } },
      { step: 'FAH算式', isNew: true, data: { FORMULA_DETAIL_ID: 7102, APPLICATION_ID: 20001, FORMULA_ID: 7001, USER_SEQUENCE: 2, EXPR_TYPE: 'S', POSTFIX_EXPR: 'LINE_NUMBER2' } },
      { step: 'FAH算式', isNew: true, data: { FORMULA_DETAIL_ID: 7103, APPLICATION_ID: 20001, FORMULA_ID: 7001, USER_SEQUENCE: 3, EXPR_TYPE: 'O', POSTFIX_EXPR: '*' } },
      { step: 'AR算式', isNew: true, data: { FORMULA_DETAIL_ID: 7121, APPLICATION_ID: 222, FORMULA_ID: 7021, USER_SEQUENCE: 1, EXPR_TYPE: 'S', POSTFIX_EXPR: 'QUANTITY_INVOICED' } },
      { step: 'AR算式', isNew: true, data: { FORMULA_DETAIL_ID: 7122, APPLICATION_ID: 222, FORMULA_ID: 7021, USER_SEQUENCE: 2, EXPR_TYPE: 'S', POSTFIX_EXPR: 'UNIT_SELLING_PRICE' } },
      { step: 'AR算式', isNew: true, data: { FORMULA_DETAIL_ID: 7123, APPLICATION_ID: 222, FORMULA_ID: 7021, USER_SEQUENCE: 3, EXPR_TYPE: 'O', POSTFIX_EXPR: '*' } }
    ]
  },
  {
    id: 'XLA_MAPPING_SETS_B', category: 'AMB_SETUP', module: 'ALL', desc: 'マッピングセットヘッダ (5大サブ元帳)',
    cols: ['MAPPING_SET_CODE', 'APPLICATION_ID', 'FLEXFIELD_ASSIGN_MODE_CODE', 'FLEXFIELD_SEGMENT_CODE', 'NUM_INPUTS', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP設定', isNew: true, data: { MAPPING_SET_CODE: 'XX_AP_EXP_ACCT_MAP', APPLICATION_ID: 200, FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', NUM_INPUTS: 1, ENABLED_FLAG: 'Y' } },
      { step: 'AR設定', isNew: true, data: { MAPPING_SET_CODE: 'XX_AR_PROD_REV_MAP', APPLICATION_ID: 222, FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', NUM_INPUTS: 1, ENABLED_FLAG: 'Y' } },
      { step: 'FA設定', isNew: true, data: { MAPPING_SET_CODE: 'XX_FA_CAT_DEPRN_MAP', APPLICATION_ID: 140, FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', NUM_INPUTS: 1, ENABLED_FLAG: 'Y' } },
      { step: 'LA設定', isNew: true, data: { MAPPING_SET_CODE: 'XX_LA_ASSET_TYPE_MAP', APPLICATION_ID: 10522, FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', NUM_INPUTS: 1, ENABLED_FLAG: 'Y' } },
      { step: 'FAH設定', isNew: true, data: { MAPPING_SET_CODE: 'XX_FAH_SVC_ACCT_MAP', APPLICATION_ID: 20001, FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', NUM_INPUTS: 1, ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_MAPPING_SET_VALUES', category: 'AMB_SETUP', module: 'ALL', desc: 'マッピングセット変換値明細',
    cols: ['MAPPING_SET_VALUE_ID', 'MAPPING_SET_CODE', 'INPUT_VALUE_CONSTANT1', 'VALUE_CONSTANT', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8011, MAPPING_SET_CODE: 'XX_AP_EXP_ACCT_MAP', INPUT_VALUE_CONSTANT1: 'IT_OUTSOURCE', VALUE_CONSTANT: '5101', ENABLED_FLAG: 'Y' } },
      { step: 'AP設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8012, MAPPING_SET_CODE: 'XX_AP_EXP_ACCT_MAP', INPUT_VALUE_CONSTANT1: 'CLOUD_INFRA', VALUE_CONSTANT: '5102', ENABLED_FLAG: 'Y' } },
      { step: 'AR設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8021, MAPPING_SET_CODE: 'XX_AR_PROD_REV_MAP', INPUT_VALUE_CONSTANT1: 'SW_LICENSE', VALUE_CONSTANT: '4101', ENABLED_FLAG: 'Y' } },
      { step: 'AR設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8022, MAPPING_SET_CODE: 'XX_AR_PROD_REV_MAP', INPUT_VALUE_CONSTANT1: 'MAINT_SUPPORT', VALUE_CONSTANT: '4104', ENABLED_FLAG: 'Y' } },
      { step: 'FA設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8031, MAPPING_SET_CODE: 'XX_FA_CAT_DEPRN_MAP', INPUT_VALUE_CONSTANT1: 'SERVER_HW', VALUE_CONSTANT: '5201', ENABLED_FLAG: 'Y' } },
      { step: 'FA設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8032, MAPPING_SET_CODE: 'XX_FA_CAT_DEPRN_MAP', INPUT_VALUE_CONSTANT1: 'OFFICE_EQUIP', VALUE_CONSTANT: '5202', ENABLED_FLAG: 'Y' } },
      { step: 'LA設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8041, MAPPING_SET_CODE: 'XX_LA_ASSET_TYPE_MAP', INPUT_VALUE_CONSTANT1: 'PROPERTY', VALUE_CONSTANT: '1301', ENABLED_FLAG: 'Y' } },
      { step: 'LA設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8042, MAPPING_SET_CODE: 'XX_LA_ASSET_TYPE_MAP', INPUT_VALUE_CONSTANT1: 'VEHICLE', VALUE_CONSTANT: '1302', ENABLED_FLAG: 'Y' } },
      { step: 'FAH設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8001, MAPPING_SET_CODE: 'XX_FAH_SVC_ACCT_MAP', INPUT_VALUE_CONSTANT1: 'SaaS_USAGE', VALUE_CONSTANT: '4102', ENABLED_FLAG: 'Y' } },
      { step: 'FAH設定', isNew: true, data: { MAPPING_SET_VALUE_ID: 8002, MAPPING_SET_CODE: 'XX_FAH_SVC_ACCT_MAP', INPUT_VALUE_CONSTANT1: 'CONS_SVC', VALUE_CONSTANT: '4103', ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_SEG_RULES_B', category: 'AMB_SETUP', module: 'ALL', desc: '勘定科目ルール(ADR)ヘッダ',
    cols: ['APPLICATION_ID', 'SEGMENT_RULE_TYPE_CODE', 'SEGMENT_RULE_CODE', 'FLEXFIELD_ASSIGN_MODE_CODE', 'FLEXFIELD_SEGMENT_CODE', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP設定', isNew: true, data: { APPLICATION_ID: 200, SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_AP_EXP_SEG3_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', ENABLED_FLAG: 'Y' } },
      { step: 'AR設定', isNew: true, data: { APPLICATION_ID: 222, SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_AR_REV_SEG3_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', ENABLED_FLAG: 'Y' } },
      { step: 'FA設定', isNew: true, data: { APPLICATION_ID: 140, SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FA_DEPRN_EXP_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', ENABLED_FLAG: 'Y' } },
      { step: 'LA設定', isNew: true, data: { APPLICATION_ID: 10522, SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_LA_ROU_ASSET_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', ENABLED_FLAG: 'Y' } },
      { step: 'FAH設定', isNew: true, data: { APPLICATION_ID: 20001, SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FAH_REV_ACCT_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', ENABLED_FLAG: 'Y' } },
      { step: 'FAH設定', isNew: true, data: { APPLICATION_ID: 20001, SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FAH_AR_1101_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_SEG_RULE_DETAILS', category: 'AMB_SETUP', module: 'ALL', desc: '勘定科目ルール(ADR)決定ロジック明細',
    cols: ['SEGMENT_RULE_DETAIL_ID', 'APPLICATION_ID', 'SEGMENT_RULE_CODE', 'USER_SEQUENCE', 'VALUE_TYPE_CODE', 'VALUE_MAPPING_SET_CODE', 'VALUE_CONSTANT'],
    rows: [
      { step: 'AP設定', isNew: true, data: { SEGMENT_RULE_DETAIL_ID: 8211, APPLICATION_ID: 200, SEGMENT_RULE_CODE: 'XX_AP_EXP_SEG3_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'M', VALUE_MAPPING_SET_CODE: 'XX_AP_EXP_ACCT_MAP', VALUE_CONSTANT: null } },
      { step: 'AR設定', isNew: true, data: { SEGMENT_RULE_DETAIL_ID: 8221, APPLICATION_ID: 222, SEGMENT_RULE_CODE: 'XX_AR_REV_SEG3_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'M', VALUE_MAPPING_SET_CODE: 'XX_AR_PROD_REV_MAP', VALUE_CONSTANT: null } },
      { step: 'FA設定', isNew: true, data: { SEGMENT_RULE_DETAIL_ID: 8231, APPLICATION_ID: 140, SEGMENT_RULE_CODE: 'XX_FA_DEPRN_EXP_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'M', VALUE_MAPPING_SET_CODE: 'XX_FA_CAT_DEPRN_MAP', VALUE_CONSTANT: null } },
      { step: 'LA設定', isNew: true, data: { SEGMENT_RULE_DETAIL_ID: 8241, APPLICATION_ID: 10522, SEGMENT_RULE_CODE: 'XX_LA_ROU_ASSET_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'M', VALUE_MAPPING_SET_CODE: 'XX_LA_ASSET_TYPE_MAP', VALUE_CONSTANT: null } },
      { step: 'FAH設定', isNew: true, data: { SEGMENT_RULE_DETAIL_ID: 8201, APPLICATION_ID: 20001, SEGMENT_RULE_CODE: 'XX_FAH_REV_ACCT_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'M', VALUE_MAPPING_SET_CODE: 'XX_FAH_SVC_ACCT_MAP', VALUE_CONSTANT: null } },
      { step: 'FAH設定', isNew: true, data: { SEGMENT_RULE_DETAIL_ID: 8204, APPLICATION_ID: 20001, SEGMENT_RULE_CODE: 'XX_FAH_AR_1101_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'C', VALUE_MAPPING_SET_CODE: null, VALUE_CONSTANT: '1101' } }
    ]
  },
  {
    id: 'XLA_CONDITIONS', category: 'AMB_SETUP', module: 'ALL', desc: 'ルール適用条件式',
    cols: ['CONDITION_ID', 'APPLICATION_ID', 'SEGMENT_RULE_DETAIL_ID', 'USER_SEQUENCE', 'SOURCE_CODE', 'LINE_OPERATOR_CODE', 'VALUE_CONSTANT'],
    rows: [
      { step: 'AP設定', isNew: true, data: { CONDITION_ID: 8311, APPLICATION_ID: 200, SEGMENT_RULE_DETAIL_ID: 8211, USER_SEQUENCE: 1, SOURCE_CODE: 'AP_PURCHASING_CATEGORY', LINE_OPERATOR_CODE: 'IS NOT NULL', VALUE_CONSTANT: null } },
      { step: 'AR設定', isNew: true, data: { CONDITION_ID: 8321, APPLICATION_ID: 222, SEGMENT_RULE_DETAIL_ID: 8221, USER_SEQUENCE: 1, SOURCE_CODE: 'AR_LINE_ITEM_CAT', LINE_OPERATOR_CODE: 'IS NOT NULL', VALUE_CONSTANT: null } },
      { step: 'FAH設定', isNew: true, data: { CONDITION_ID: 8301, APPLICATION_ID: 20001, SEGMENT_RULE_DETAIL_ID: 8201, USER_SEQUENCE: 1, SOURCE_CODE: 'LINE_CHAR2', LINE_OPERATOR_CODE: 'IS NOT NULL', VALUE_CONSTANT: null } }
    ]
  },
  {
    id: 'XLA_DESCRIPTIONS_B', category: 'AMB_SETUP', module: 'ALL', desc: '仕訳摘要ルール定義',
    cols: ['APPLICATION_ID', 'AMB_CONTEXT_CODE', 'DESCRIPTION_TYPE_CODE', 'DESCRIPTION_CODE', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP', isNew: true, data: { APPLICATION_ID: 200, AMB_CONTEXT_CODE: 'DEFAULT', DESCRIPTION_TYPE_CODE: 'C', DESCRIPTION_CODE: 'XX_AP_INV_LINE_DESC', ENABLED_FLAG: 'Y' } },
      { step: 'AR', isNew: true, data: { APPLICATION_ID: 222, AMB_CONTEXT_CODE: 'DEFAULT', DESCRIPTION_TYPE_CODE: 'C', DESCRIPTION_CODE: 'XX_AR_INV_DESC', ENABLED_FLAG: 'Y' } },
      { step: 'FA', isNew: true, data: { APPLICATION_ID: 140, AMB_CONTEXT_CODE: 'DEFAULT', DESCRIPTION_TYPE_CODE: 'C', DESCRIPTION_CODE: 'XX_FA_DEPRN_DESC', ENABLED_FLAG: 'Y' } },
      { step: 'LA', isNew: true, data: { APPLICATION_ID: 10522, AMB_CONTEXT_CODE: 'DEFAULT', DESCRIPTION_TYPE_CODE: 'C', DESCRIPTION_CODE: 'XX_LA_BOOKING_DESC', ENABLED_FLAG: 'Y' } },
      { step: 'FAH', isNew: true, data: { APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', DESCRIPTION_TYPE_CODE: 'C', DESCRIPTION_CODE: 'XX_FAH_LINE_DESC', ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_ACCT_LINE_TYPES_B', category: 'AMB_SETUP', module: 'ALL', desc: '仕訳明細ルール(JLT)一覧',
    cols: ['APPLICATION_ID', 'EVENT_CLASS_CODE', 'ACCOUNTING_LINE_CODE', 'ACCOUNTING_CLASS_CODE', 'NATURAL_SIDE_CODE', 'MERGE_DUPLICATE_CODE', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP', isNew: true, data: { APPLICATION_ID: 200, EVENT_CLASS_CODE: 'INVOICES', ACCOUNTING_LINE_CODE: 'XX_AP_ITEM_EXP_DR', ACCOUNTING_CLASS_CODE: 'ITEM EXPENSE', NATURAL_SIDE_CODE: 'D', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'AP', isNew: true, data: { APPLICATION_ID: 200, EVENT_CLASS_CODE: 'INVOICES', ACCOUNTING_LINE_CODE: 'XX_AP_LIAB_CR', ACCOUNTING_CLASS_CODE: 'LIABILITY', NATURAL_SIDE_CODE: 'C', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'AR', isNew: true, data: { APPLICATION_ID: 222, EVENT_CLASS_CODE: 'INVOICE', ACCOUNTING_LINE_CODE: 'XX_AR_REC_DR', ACCOUNTING_CLASS_CODE: 'RECEIVABLE', NATURAL_SIDE_CODE: 'D', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'AR', isNew: true, data: { APPLICATION_ID: 222, EVENT_CLASS_CODE: 'INVOICE', ACCOUNTING_LINE_CODE: 'XX_AR_REV_CR', ACCOUNTING_CLASS_CODE: 'REVENUE', NATURAL_SIDE_CODE: 'C', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'FA', isNew: true, data: { APPLICATION_ID: 140, EVENT_CLASS_CODE: 'DEPRECIATION', ACCOUNTING_LINE_CODE: 'XX_FA_DEPRN_EXP_DR', ACCOUNTING_CLASS_CODE: 'DEPRN_EXP', NATURAL_SIDE_CODE: 'D', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'FA', isNew: true, data: { APPLICATION_ID: 140, EVENT_CLASS_CODE: 'DEPRECIATION', ACCOUNTING_LINE_CODE: 'XX_FA_DEPRN_RSV_CR', ACCOUNTING_CLASS_CODE: 'DEPRN_RSV', NATURAL_SIDE_CODE: 'C', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'LA', isNew: true, data: { APPLICATION_ID: 10522, EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', ACCOUNTING_LINE_CODE: 'XX_LA_ROU_DR', ACCOUNTING_CLASS_CODE: 'ROU_ASSET', NATURAL_SIDE_CODE: 'D', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'LA', isNew: true, data: { APPLICATION_ID: 10522, EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', ACCOUNTING_LINE_CODE: 'XX_LA_LIAB_CR', ACCOUNTING_CLASS_CODE: 'LEASE_LIABILITY', NATURAL_SIDE_CODE: 'C', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'FAH', isNew: true, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', ACCOUNTING_LINE_CODE: 'XX_FAH_AR_DR_JLT', ACCOUNTING_CLASS_CODE: 'RECEIVABLE', NATURAL_SIDE_CODE: 'D', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
      { step: 'FAH', isNew: true, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', ACCOUNTING_LINE_CODE: 'XX_FAH_REV_CR_JLT', ACCOUNTING_CLASS_CODE: 'REVENUE', NATURAL_SIDE_CODE: 'C', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_ANALYTICAL_HDRS_B', category: 'SUPPORTING_REF', module: 'SR', desc: 'サポート参照ヘッダ (残高有Y vs 残高無N)',
    cols: ['ANALYTICAL_CRITERION_CODE', 'ANALYTICAL_CRITERION_TYPE_CODE', 'AMB_CONTEXT_CODE', 'BALANCING_FLAG', 'YEAR_END_CARRY_FORWARD_CODE', 'ENABLED_FLAG'],
    rows: [
      { step: '残高有SR', isNew: true, data: { ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', BALANCING_FLAG: 'Y', YEAR_END_CARRY_FORWARD_CODE: 'A', ENABLED_FLAG: 'Y' } },
      { step: '残高無SR', isNew: true, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', BALANCING_FLAG: 'N', YEAR_END_CARRY_FORWARD_CODE: 'N', ENABLED_FLAG: 'Y' } }
    ]
  },
  {
    id: 'XLA_ANALYTICAL_DTLS_B', category: 'SUPPORTING_REF', module: 'SR', desc: 'サポート参照詳細属性 (AC1..AC5 スロット定義)',
    cols: ['ANALYTICAL_CRITERION_CODE', 'ANALYTICAL_DETAIL_CODE', 'DATA_TYPE_CODE', 'GROUPING_ORDER'],
    rows: [
      { step: '残高有', isNew: true, data: { ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY (相手先)', DATA_TYPE_CODE: 'C', GROUPING_ORDER: 1 } },
      { step: '残高無1', isNew: true, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'EXT_SYSTEM (外部システム)', DATA_TYPE_CODE: 'C', GROUPING_ORDER: 1 } },
      { step: '残高無2', isNew: true, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'EXT_INV_NUM (外部請求書番号)', DATA_TYPE_CODE: 'C', GROUPING_ORDER: 2 } },
      { step: '残高無3', isNew: true, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'MATURITY_DATE (満期日)', DATA_TYPE_CODE: 'D', GROUPING_ORDER: 3 } },
      { step: '残高無4', isNew: true, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'QTY (数量)', DATA_TYPE_CODE: 'N', GROUPING_ORDER: 4 } },
      { step: '残高無5', isNew: true, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'UNIT_PRICE (単価)', DATA_TYPE_CODE: 'N', GROUPING_ORDER: 5 } }
    ]
  },
  {
    id: 'XLA_ANALYTICAL_SOURCES', category: 'SUPPORTING_REF', module: 'SR', desc: 'サポート参照 × 5大サブ元帳ソースマッピング',
    cols: ['APPLICATION_ID', 'ANALYTICAL_CRITERION_CODE', 'ANALYTICAL_DETAIL_CODE', 'EVENT_CLASS_CODE', 'SOURCE_CODE'],
    rows: [
      { step: 'AP正規化', isNew: true, data: { APPLICATION_ID: 200, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'INVOICES', SOURCE_CODE: 'AP_VENDOR_NAME' } },
      { step: 'AR正規化', isNew: true, data: { APPLICATION_ID: 222, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'INVOICE', SOURCE_CODE: 'AR_BILL_TO_CUST_NAME' } },
      { step: 'FA正規化', isNew: true, data: { APPLICATION_ID: 140, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'DEPRECIATION', SOURCE_CODE: 'FA_VENDOR_NAME' } },
      { step: 'LA正規化', isNew: true, data: { APPLICATION_ID: 10522, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', SOURCE_CODE: 'LA_LESSOR_NAME' } },
      { step: 'FAH正規化', isNew: true, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_CODE: 'HEADER_CHAR1' } },
      { step: 'FAH残高無', isNew: true, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'EXT_SYSTEM', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_CODE: 'LINE_CHAR1' } },
      { step: 'FAH残高無', isNew: true, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'EXT_INV_NUM', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_CODE: 'HEADER_CHAR2' } },
      { step: 'FAH残高無', isNew: true, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'MATURITY_DATE', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_CODE: 'HEADER_DATE1' } },
      { step: 'FAH残高無', isNew: true, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'QTY', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_CODE: 'LINE_NUMBER1' } },
      { step: 'FAH残高無', isNew: true, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'UNIT_PRICE', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_CODE: 'LINE_NUMBER2' } }
    ]
  },
  {
    id: 'XLA_LINE_DEFINITIONS_B', category: 'AMB_SETUP', module: 'ALL', desc: '仕訳入力ルールセット(JERS)有効化一覧',
    cols: ['APPLICATION_ID', 'EVENT_CLASS_CODE', 'EVENT_TYPE_CODE', 'LINE_DEFINITION_OWNER_CODE', 'LINE_DEFINITION_CODE', 'VALIDATION_STATUS_CODE', 'ENABLED_FLAG'],
    rows: [
      { step: 'AP', isNew: true, data: { APPLICATION_ID: 200, EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', LINE_DEFINITION_OWNER_CODE: 'C', LINE_DEFINITION_CODE: 'XX_AP_INVOICE_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } },
      { step: 'AR', isNew: true, data: { APPLICATION_ID: 222, EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', LINE_DEFINITION_OWNER_CODE: 'C', LINE_DEFINITION_CODE: 'XX_AR_INVOICE_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } },
      { step: 'FA', isNew: true, data: { APPLICATION_ID: 140, EVENT_CLASS_CODE: 'DEPRECIATION', EVENT_TYPE_CODE: 'DEPRECIATION', LINE_DEFINITION_OWNER_CODE: 'C', LINE_DEFINITION_CODE: 'XX_FA_DEPRN_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } },
      { step: 'LA', isNew: true, data: { APPLICATION_ID: 10522, EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', EVENT_TYPE_CODE: 'LEASE_BOOKING', LINE_DEFINITION_OWNER_CODE: 'C', LINE_DEFINITION_CODE: 'XX_LA_BOOKING_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } },
      { step: 'FAH', isNew: true, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', LINE_DEFINITION_OWNER_CODE: 'C', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } }
    ]
  },

  // --- D. 5大サブ元帳サンプルデータ & SLA仕訳・残高結果 ---
  {
    id: 'XLA_TRANSACTION_HEADERS_INT', category: 'TXN_DATA', module: 'FAH', desc: '[FAH] 外部取引ヘッダ I/F表 (NEW→PROCESSED)',
    cols: ['APPLICATION_ID', 'APPLICATION_SHORT_NAME', 'TRANSACTION_NUMBER', 'EVENT_TYPE_CODE', 'LEDGER_NAME', 'TRANSACTION_DATE', 'STATUS_CODE', 'CHAR1', 'CHAR2', 'DATE1'],
    rows: [{ step: '取込完了', updatedCols: ['STATUS_CODE'], oldValues: { STATUS_CODE: 'NEW' }, data: { APPLICATION_ID: 20001, APPLICATION_SHORT_NAME: 'XX_FAH_CLOUD', TRANSACTION_NUMBER: 'FAH-2026-001', EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', LEDGER_NAME: 'JP_CORP_LEDGER', TRANSACTION_DATE: '2026-04-20', STATUS_CODE: 'PROCESSED', CHAR1: '株式会社グローバル商事', CHAR2: 'EXT-2026-0891', DATE1: '2026-05-31' } }]
  },
  {
    id: 'XLA_TRANSACTION_LINES_INT', category: 'TXN_DATA', module: 'FAH', desc: '[FAH] 外部取引明細 I/F表 (NEW→PROCESSED)',
    cols: ['APPLICATION_ID', 'TRANSACTION_NUMBER', 'LINE_NUMBER', 'CHAR1', 'CHAR2', 'NUMBER1', 'NUMBER2', 'NUMBER3', 'STATUS_CODE'],
    rows: [{ step: '取込完了', updatedCols: ['STATUS_CODE'], oldValues: { STATUS_CODE: 'NEW' }, data: { APPLICATION_ID: 20001, TRANSACTION_NUMBER: 'FAH-2026-001', LINE_NUMBER: 1, CHAR1: 'POS_BILLING', CHAR2: 'SaaS_USAGE', NUMBER1: 300, NUMBER2: 1000, NUMBER3: 0, STATUS_CODE: 'PROCESSED' } }]
  },
  {
    id: 'XLA_TRANSACTION_HEADERS', category: 'TXN_DATA', module: 'FAH', desc: '[FAH] FAH取引ヘッダ実体 (Base表)',
    cols: ['APPLICATION_ID', 'EVENT_ID', 'TRANSACTION_NUMBER', 'LEDGER_ID', 'TRANSACTION_DATE', 'LEGAL_ENTITY_ID', 'CHAR1', 'CHAR2', 'DATE1'],
    rows: [{ step: 'Baseロード', isNew: true, data: { APPLICATION_ID: 20001, EVENT_ID: 500005, TRANSACTION_NUMBER: 'FAH-2026-001', LEDGER_ID: 300001, TRANSACTION_DATE: '2026-04-20', LEGAL_ENTITY_ID: 50001, CHAR1: '株式会社グローバル商事', CHAR2: 'EXT-2026-0891', DATE1: '2026-05-31' } }]
  },
  {
    id: 'XLA_TRANSACTION_LINES', category: 'TXN_DATA', module: 'FAH', desc: '[FAH] FAH取引明細実体 (算式 300×1000=300,000)',
    cols: ['APPLICATION_ID', 'EVENT_ID', 'LINE_NUMBER', 'TRANSACTION_DATE', 'CHAR1', 'CHAR2', 'NUMBER1', 'NUMBER2', 'NUMBER3'],
    rows: [{ step: '算式評価', updatedCols: ['NUMBER3'], oldValues: { NUMBER3: 0 }, data: { APPLICATION_ID: 20001, EVENT_ID: 500005, LINE_NUMBER: 1, TRANSACTION_DATE: '2026-04-20', CHAR1: 'POS_BILLING', CHAR2: 'SaaS_USAGE', NUMBER1: 300, NUMBER2: 1000, NUMBER3: 300000 } }]
  },
  {
    id: 'AP_INVOICES_ALL', category: 'TXN_DATA', module: 'AP', desc: '[AP] 買掛請求書ヘッダサンプル',
    cols: ['INVOICE_ID', 'INVOICE_NUM', 'VENDOR_ID', 'INVOICE_AMOUNT', 'INVOICE_DATE', 'ORG_ID', 'ATTRIBUTE_CATEGORY', 'ATTRIBUTE1'],
    rows: [{ step: 'AP計上', isNew: true, data: { INVOICE_ID: 10001, INVOICE_NUM: 'AP-2026-001', VENDOR_ID: 501, INVOICE_AMOUNT: 550000, INVOICE_DATE: '2026-04-10', ORG_ID: 3001, ATTRIBUTE_CATEGORY: 'JP_AP_EXT', ATTRIBUTE1: 'テックサポート株式会社' } }]
  },
  {
    id: 'RA_CUSTOMER_TRX_ALL', category: 'TXN_DATA', module: 'AR', desc: '[AR] 売掛請求書ヘッダサンプル',
    cols: ['CUSTOMER_TRX_ID', 'TRX_NUMBER', 'TRX_DATE', 'BILL_TO_CUSTOMER_ID', 'ORG_ID', 'COMPLETE_FLAG', 'ATTRIBUTE1'],
    rows: [{ step: 'AR計上', isNew: true, data: { CUSTOMER_TRX_ID: 20001, TRX_NUMBER: 'AR-2026-001', TRX_DATE: '2026-04-12', BILL_TO_CUSTOMER_ID: 601, ORG_ID: 3001, COMPLETE_FLAG: 'Y', ATTRIBUTE1: '株式会社グローバル商事' } }]
  },
  {
    id: 'FA_DEPRN_DETAIL', category: 'TXN_DATA', module: 'FA', desc: '[FA] 月次減価償却計算明細サンプル',
    cols: ['BOOK_TYPE_CODE', 'ASSET_ID', 'DISTRIBUTION_ID', 'PERIOD_COUNTER', 'DEPRN_AMOUNT', 'DEPRN_RESERVE', 'EVENT_ID'],
    rows: [{ step: 'FA償却', isNew: true, data: { BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 30001, DISTRIBUTION_ID: 32001, PERIOD_COUNTER: 24316, DEPRN_AMOUNT: 120000, DEPRN_RESERVE: 120000, EVENT_ID: 500003 } }]
  },
  {
    id: 'FLA_ACCOUNTING_LINES', category: 'TXN_DATA', module: 'LA', desc: '[LA] リース使用権資産・負債会計明細サンプル',
    cols: ['TRANSACTION_LINE_ID', 'TRANSACTION_ID', 'SCHEDULE_TYPE_CODE', 'DR_CODE_COMBINATION_ID', 'CR_CODE_COMBINATION_ID', 'ACCOUNTED_AMOUNT'],
    rows: [{ step: 'LA計上', isNew: true, data: { TRANSACTION_LINE_ID: 42001, TRANSACTION_ID: 41001, SCHEDULE_TYPE_CODE: 'ROU_ASSET', DR_CODE_COMBINATION_ID: 1003, CR_CODE_COMBINATION_ID: 2003, ACCOUNTED_AMOUNT: 2400000 } }]
  },
  {
    id: 'XLA_EVENTS', category: 'SLA_GL', module: 'ALL', desc: 'SLA会計イベント (5大サブ元帳 U→P)',
    cols: ['EVENT_ID', 'APPLICATION_ID', 'ENTITY_ID', 'EVENT_TYPE_CODE', 'EVENT_DATE', 'EVENT_STATUS_CODE', 'PROCESS_STATUS_CODE'],
    rows: [
      { step: '会計済P', updatedCols: ['EVENT_STATUS_CODE', 'PROCESS_STATUS_CODE'], oldValues: { EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, data: { EVENT_ID: 500001, APPLICATION_ID: 200, ENTITY_ID: 400001, EVENT_TYPE_CODE: 'INVOICE VALIDATED', EVENT_DATE: '2026-04-10', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } },
      { step: '会計済P', updatedCols: ['EVENT_STATUS_CODE', 'PROCESS_STATUS_CODE'], oldValues: { EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, data: { EVENT_ID: 500002, APPLICATION_ID: 222, ENTITY_ID: 400002, EVENT_TYPE_CODE: 'INV_CREATE', EVENT_DATE: '2026-04-12', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } },
      { step: '会計済P', updatedCols: ['EVENT_STATUS_CODE', 'PROCESS_STATUS_CODE'], oldValues: { EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, data: { EVENT_ID: 500003, APPLICATION_ID: 140, ENTITY_ID: 400003, EVENT_TYPE_CODE: 'DEPRECIATION', EVENT_DATE: '2026-04-30', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } },
      { step: '会計済P', updatedCols: ['EVENT_STATUS_CODE', 'PROCESS_STATUS_CODE'], oldValues: { EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, data: { EVENT_ID: 500004, APPLICATION_ID: 10522, ENTITY_ID: 400004, EVENT_TYPE_CODE: 'LEASE_BOOKING', EVENT_DATE: '2026-04-01', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } },
      { step: '会計済P', updatedCols: ['EVENT_STATUS_CODE', 'PROCESS_STATUS_CODE'], oldValues: { EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, data: { EVENT_ID: 500005, APPLICATION_ID: 20001, ENTITY_ID: 400005, EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', EVENT_DATE: '2026-04-20', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } }
    ]
  },
  {
    id: 'XLA_AE_LINES', category: 'SLA_GL', module: 'ALL', desc: 'SLA生成仕訳明細 (12行: 貸借計各 4,250,000円)',
    cols: ['AE_HEADER_ID', 'AE_LINE_NUM', 'APPLICATION_ID', 'CODE_COMBINATION_ID', 'ACCOUNTING_CLASS_CODE', 'ACCOUNTED_DR', 'ACCOUNTED_CR', 'DESCRIPTION', 'GL_SL_LINK_ID'],
    rows: [
      { step: 'AP', isNew: true, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 1, APPLICATION_ID: 200, CODE_COMBINATION_ID: 5001, ACCOUNTING_CLASS_CODE: 'ITEM EXPENSE', ACCOUNTED_DR: 500000, ACCOUNTED_CR: 0, DESCRIPTION: '[AP] AP-2026-001 外注費', GL_SL_LINK_ID: 700001 } },
      { step: 'AP', isNew: true, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 2, APPLICATION_ID: 200, CODE_COMBINATION_ID: 1002, ACCOUNTING_CLASS_CODE: 'NRTAX', ACCOUNTED_DR: 50000, ACCOUNTED_CR: 0, DESCRIPTION: '[AP] AP-2026-001 仮払消費税10%', GL_SL_LINK_ID: 700002 } },
      { step: 'AP', isNew: true, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 3, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2001, ACCOUNTING_CLASS_CODE: 'LIABILITY', ACCOUNTED_DR: 0, ACCOUNTED_CR: 550000, DESCRIPTION: '[AP] AP-2026-001 買掛金', GL_SL_LINK_ID: 700003 } },
      { step: 'AR', isNew: true, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 1, APPLICATION_ID: 222, CODE_COMBINATION_ID: 1001, ACCOUNTING_CLASS_CODE: 'RECEIVABLE', ACCOUNTED_DR: 880000, ACCOUNTED_CR: 0, DESCRIPTION: '[AR] AR-2026-001 売掛金', GL_SL_LINK_ID: 700004 } },
      { step: 'AR', isNew: true, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 2, APPLICATION_ID: 222, CODE_COMBINATION_ID: 4001, ACCOUNTING_CLASS_CODE: 'REVENUE', ACCOUNTED_DR: 0, ACCOUNTED_CR: 800000, DESCRIPTION: '[AR] AR-2026-001 製品売上高', GL_SL_LINK_ID: 700005 } },
      { step: 'AR', isNew: true, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 3, APPLICATION_ID: 222, CODE_COMBINATION_ID: 2002, ACCOUNTING_CLASS_CODE: 'TAX', ACCOUNTED_DR: 0, ACCOUNTED_CR: 80000, DESCRIPTION: '[AR] AR-2026-001 仮受消費税10%', GL_SL_LINK_ID: 700006 } },
      { step: 'FA', isNew: true, data: { AE_HEADER_ID: 600003, AE_LINE_NUM: 1, APPLICATION_ID: 140, CODE_COMBINATION_ID: 5002, ACCOUNTING_CLASS_CODE: 'DEPRN_EXP', ACCOUNTED_DR: 120000, ACCOUNTED_CR: 0, DESCRIPTION: '[FA] FA-2026-001 減価償却費', GL_SL_LINK_ID: 700007 } },
      { step: 'FA', isNew: true, data: { AE_HEADER_ID: 600003, AE_LINE_NUM: 2, APPLICATION_ID: 140, CODE_COMBINATION_ID: 1004, ACCOUNTING_CLASS_CODE: 'DEPRN_RSV', ACCOUNTED_DR: 0, ACCOUNTED_CR: 120000, DESCRIPTION: '[FA] FA-2026-001 減価償却累計額', GL_SL_LINK_ID: 700008 } },
      { step: 'LA', isNew: true, data: { AE_HEADER_ID: 600004, AE_LINE_NUM: 1, APPLICATION_ID: 10522, CODE_COMBINATION_ID: 1003, ACCOUNTING_CLASS_CODE: 'ROU_ASSET', ACCOUNTED_DR: 2400000, ACCOUNTED_CR: 0, DESCRIPTION: '[LA] LA-2026-001 使用権資産計上', GL_SL_LINK_ID: 700009 } },
      { step: 'LA', isNew: true, data: { AE_HEADER_ID: 600004, AE_LINE_NUM: 2, APPLICATION_ID: 10522, CODE_COMBINATION_ID: 2003, ACCOUNTING_CLASS_CODE: 'LEASE_LIABILITY', ACCOUNTED_DR: 0, ACCOUNTED_CR: 2400000, DESCRIPTION: '[LA] LA-2026-001 リース負債計上', GL_SL_LINK_ID: 700010 } },
      { step: 'FAH', isNew: true, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 1, APPLICATION_ID: 20001, CODE_COMBINATION_ID: 1001, ACCOUNTING_CLASS_CODE: 'RECEIVABLE', ACCOUNTED_DR: 300000, ACCOUNTED_CR: 0, DESCRIPTION: '[FAH] FAH-2026-001 売掛金', GL_SL_LINK_ID: 700011 } },
      { step: 'FAH', isNew: true, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 2, APPLICATION_ID: 20001, CODE_COMBINATION_ID: 4002, ACCOUNTING_CLASS_CODE: 'REVENUE', ACCOUNTED_DR: 0, ACCOUNTED_CR: 300000, DESCRIPTION: '[FAH] FAH-2026-001 クラウド収益', GL_SL_LINK_ID: 700012 } }
    ]
  },
  {
    id: 'XLA_AE_LINE_ACS', category: 'SLA_GL', module: 'SR', desc: 'SLA仕訳サポート参照明細値 (残高有+残高無AC1..5)',
    cols: ['AE_HEADER_ID', 'AE_LINE_NUM', 'ANALYTICAL_CRITERION_CODE', 'AC1', 'AC2', 'AC3', 'AC4', 'AC5'],
    rows: [
      { step: 'AP-有', isNew: true, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 3, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: 'テックサポート株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
      { step: 'AP-無', isNew: true, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', AC1: 'AP_PORTAL', AC2: 'EXT-AP-771', AC3: '2026-05-10', AC4: '10', AC5: '50000' } },
      { step: 'AR-有', isNew: true, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: '株式会社グローバル商事', AC2: null, AC3: null, AC4: null, AC5: null } },
      { step: 'AR-無', isNew: true, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', AC1: 'EC_ORDER', AC2: 'AR-2026-001', AC3: '2026-05-12', AC4: '4', AC5: '200000' } },
      { step: 'LA-有', isNew: true, data: { AE_HEADER_ID: 600004, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: '東京不動産リース株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
      { step: 'FAH-有', isNew: true, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: '株式会社グローバル商事', AC2: null, AC3: null, AC4: null, AC5: null } },
      { step: 'FAH-無', isNew: true, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', AC1: 'POS_BILLING', AC2: 'EXT-2026-0891', AC3: '2026-05-31', AC4: '300', AC5: '1000' } }
    ]
  },
  {
    id: 'XLA_AC_BALANCES', category: 'SLA_GL', module: 'SR', desc: '残高有サポート参照残高 (SR_COUNTERPARTY 取引先別・Phase4末)',
    cols: ['APPLICATION_ID', 'LEDGER_ID', 'CODE_COMBINATION_ID', 'ANALYTICAL_CRITERION_CODE', 'AC1', 'PERIOD_NAME', 'BEGINNING_BALANCE_DR', 'PERIOD_BALANCE_DR', 'PERIOD_BALANCE_CR'],
    rows: [
      { step: 'Phase4更新', updatedCols: ['PERIOD_BALANCE_DR', 'PERIOD_BALANCE_CR'], oldValues: { PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 0 }, data: { APPLICATION_ID: 222, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: '株式会社グローバル商事', PERIOD_NAME: '2026-04', BEGINNING_BALANCE_DR: 500000, PERIOD_BALANCE_DR: 880000, PERIOD_BALANCE_CR: 600000 } },
      { step: 'Phase3更新', updatedCols: ['PERIOD_BALANCE_DR'], oldValues: { PERIOD_BALANCE_DR: 0 }, data: { APPLICATION_ID: 20001, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: '株式会社グローバル商事', PERIOD_NAME: '2026-04', BEGINNING_BALANCE_DR: 0, PERIOD_BALANCE_DR: 300000, PERIOD_BALANCE_CR: 0 } },
      { step: '期首保持', data: { APPLICATION_ID: 222, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: '第二商事株式会社', PERIOD_NAME: '2026-04', BEGINNING_BALANCE_DR: 400000, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 0 } },
      { step: 'AP確定', isNew: true, data: { APPLICATION_ID: 200, LEDGER_ID: 300001, CODE_COMBINATION_ID: 2001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: 'テックサポート株式会社', PERIOD_NAME: '2026-04', BEGINNING_BALANCE_DR: 0, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 550000 } },
      { step: 'LA確定', isNew: true, data: { APPLICATION_ID: 10522, LEDGER_ID: 300001, CODE_COMBINATION_ID: 2003, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AC1: '東京不動産リース株式会社', PERIOD_NAME: '2026-04', BEGINNING_BALANCE_DR: 0, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 2400000 } }
    ]
  },
  {
    id: 'GL_BALANCES', category: 'SLA_GL', module: 'COMMON', desc: '一般会計 確定勘定残高 (2026-04 貸借各4,250,000円)',
    cols: ['LEDGER_ID', 'CODE_COMBINATION_ID', 'CURRENCY_CODE', 'PERIOD_NAME', 'ACTUAL_FLAG', 'BEGIN_BALANCE_DR', 'PERIOD_NET_DR', 'PERIOD_NET_CR'],
    rows: [
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 1180000, PERIOD_NET_CR: 0 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 1002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 50000, PERIOD_NET_CR: 0 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 1003, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 2400000, PERIOD_NET_CR: 0 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 1004, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 120000 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 2001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 550000 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 2002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 80000 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 2003, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 2400000 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 4001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 800000 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 4002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 300000 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 5001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 500000, PERIOD_NET_CR: 0 } },
      { step: 'GL転記済', isNew: true, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 5002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, PERIOD_NET_DR: 120000, PERIOD_NET_CR: 0 } }
    ]
  }
];

const RELATIONS = [
  { from: 'XLE_ENTITY_PROFILES', to: 'GL_LEDGERS', key: 'LEGAL_ENTITY_ID' },
  { from: 'FND_ID_FLEX_SEGMENTS', to: 'GL_CODE_COMBINATIONS', key: 'CHART_OF_ACCOUNTS_ID' },
  { from: 'GL_LEDGERS', to: 'XLA_ACCTG_METHODS_B', key: 'SLA_ACCOUNTING_METHOD_CODE' },
  { from: 'GL_LEDGERS', to: 'XLA_LEDGER_OPTIONS', key: 'LEDGER_ID' },
  { from: 'XLA_ACCTG_METHODS_B', to: 'XLA_ACCTG_METHOD_RULES', key: 'ACCOUNTING_METHOD_CODE' },
  { from: 'XLA_LINE_DEFINITIONS_B', to: 'XLA_ACCTG_METHOD_RULES', key: 'PRODUCT_RULE_CODE' },
  { from: 'XLA_SUBLEDGERS', to: 'XLA_EVENT_CLASSES_B', key: 'APPLICATION_ID' },
  { from: 'XLA_EVENT_CLASSES_B', to: 'XLA_EVENT_TYPES_B', key: 'EVENT_CLASS_CODE' },
  { from: 'XLA_SUBLEDGERS', to: 'XLA_SOURCES_B', key: 'APPLICATION_ID' },
  { from: 'XLA_SUBLEDGERS', to: 'XLA_TRANSACTION_INT_CONTROLS', key: 'APPLICATION_ID' },
  { from: 'XLA_FORMULAS_B', to: 'XLA_FORMULA_DETAILS', key: 'FORMULA_ID' },
  { from: 'XLA_MAPPING_SETS_B', to: 'XLA_MAPPING_SET_VALUES', key: 'MAPPING_SET_CODE' },
  { from: 'XLA_SEG_RULES_B', to: 'XLA_SEG_RULE_DETAILS', key: 'SEGMENT_RULE_CODE' },
  { from: 'XLA_MAPPING_SETS_B', to: 'XLA_SEG_RULE_DETAILS', key: 'VALUE_MAPPING_SET_CODE' },
  { from: 'XLA_SEG_RULE_DETAILS', to: 'XLA_CONDITIONS', key: 'SEGMENT_RULE_DETAIL_ID' },
  { from: 'XLA_ANALYTICAL_HDRS_B', to: 'XLA_ANALYTICAL_DTLS_B', key: 'ANALYTICAL_CRITERION_CODE' },
  { from: 'XLA_ANALYTICAL_DTLS_B', to: 'XLA_ANALYTICAL_SOURCES', key: 'ANALYTICAL_DETAIL_CODE' },
  { from: 'XLA_SOURCES_B', to: 'XLA_ANALYTICAL_SOURCES', key: 'SOURCE_CODE' },
  { from: 'XLA_TRANSACTION_HEADERS_INT', to: 'XLA_TRANSACTION_LINES_INT', key: 'TRANSACTION_NUMBER' },
  { from: 'XLA_TRANSACTION_HEADERS_INT', to: 'XLA_TRANSACTION_HEADERS', key: 'TRANSACTION_NUMBER' },
  { from: 'XLA_TRANSACTION_HEADERS', to: 'XLA_TRANSACTION_LINES', key: 'EVENT_ID' },
  { from: 'XLA_TRANSACTION_HEADERS', to: 'XLA_EVENTS', key: 'EVENT_ID' },
  { from: 'XLA_EVENTS', to: 'XLA_AE_LINES', key: 'EVENT_ID -> AE_HEADER_ID' },
  { from: 'XLA_AE_LINES', to: 'XLA_AE_LINE_ACS', key: 'AE_HEADER_ID, AE_LINE_NUM' },
  { from: 'XLA_AE_LINE_ACS', to: 'XLA_AC_BALANCES', key: 'ANALYTICAL_CRITERION_CODE, AC1 (BAL=Y)' },
  { from: 'XLA_AE_LINES', to: 'GL_BALANCES', key: 'CODE_COMBINATION_ID (via GL_INTERFACE)' }
];

const FusionFAHPresentationData = {
  META,
  AFF_SEGMENTS,
  CCID_LIST,
  CHAPTERS,
  MECHANISM_NODES,
  MECHANISM_STEPS,
  SUBMODULE_SETUPS,
  FAH_SETUP_STEPS,
  SR_ARCHITECTURE,
  SR_BALANCE_PHASES,
  OEDMF_TABLES,
  RELATIONS
};

if (typeof window !== 'undefined') {
  window.FusionFAHPresentationData = FusionFAHPresentationData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FusionFAHPresentationData;
}
