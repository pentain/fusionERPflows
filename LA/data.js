/**
 * Oracle Fusion ERP Financials 26D (OEDMF)
 * リース会計（LA / Lease Accounting: APPLICATION_ID=10522）データフロー定義
 * 1. 借手リース登録・AP請求支払・ROU償却・実効金利利息 (LA_BOOK_AP_ACCRUAL)
 * 2. リース契約修正・負債再測定・AP改定連携・再計算償却 (LA_REVISION)
 * 3. リース中途解約・違約金AP連携・ROU/負債消去・解約損益 (LA_TERMINATION)
 * 4. 収益リース(サブリース)・AR請求消込・受取リース収益認識 (LA_REVENUE_AR)
 * 準拠: https://docs.oracle.com/en/cloud/saas/financials/26d/oedmf/index.html
 */

const AFF_SEGMENTS = [
  { idx: 1, col: 'SEGMENT1', name: '会社', codeExample: '10', desc: '法的エンティティ・企業コード（10=株式会社テスト商事）' },
  { idx: 2, col: 'SEGMENT2', name: '部門', codeExample: '0000 / 1000 / 3000', desc: '部門・コストセンタ（0000=全社共通, 1000=営業・管理収益, 3000=総務ファシリティ）' },
  { idx: 3, col: 'SEGMENT3', name: '勘定科目', codeExample: '17110 / 23110 / 54110', desc: '自然勘定（17110=使用権資産, 23110=リース負債, 54110=ROU減価償却費, 63110=支払利息）' },
  { idx: 4, col: 'SEGMENT4', name: '補助科目', codeExample: '000 / 001', desc: '内訳コード（001=不動産本社リース関連）' },
  { idx: 5, col: 'SEGMENT5', name: '税コード', codeExample: 'T00 / T10', desc: '税区分（T00=対象外/償却・利息, T10=消費税10%）' },
  { idx: 6, col: 'SEGMENT6', name: '管理コード', codeExample: 'C00 / LA1 / LA2', desc: '管理コード（LA1=借手契約, LA2=収益サブリース）' },
  { idx: 7, col: 'SEGMENT7', name: '備考1', codeExample: '000', desc: '拡張セグメント1' },
  { idx: 8, col: 'SEGMENT8', name: '備考2', codeExample: '000', desc: '拡張セグメント2' },
  { idx: 9, col: 'SEGMENT9', name: '備考3', codeExample: '000', desc: '拡張セグメント3' }
];

const CCID_LIST = {
  1001: { ccid: 1001, concat: '10-0000-11110-000-T00-C00-000-000-000', name: '普通預金（みずほ銀行・本店）', type: 'ASSET' },
  1110: { ccid: 1110, concat: '10-0000-11310-000-T00-C00-000-000-000', name: '売掛金（サブリース・賃貸未収）', type: 'ASSET' },
  1501: { ccid: 1501, concat: '10-0000-15110-000-T10-C00-000-000-000', name: '仮払消費税（標準10%）', type: 'ASSET' },
  1710: { ccid: 1710, concat: '10-3000-17110-001-T00-LA1-000-000-000', name: '使用権資産（ROU資産：本社フロア）', type: 'ASSET' },
  1719: { ccid: 1719, concat: '10-3000-17190-001-T00-LA1-000-000-000', name: '使用権資産・減価償却累計額', type: 'ASSET' },
  2101: { ccid: 2101, concat: '10-0000-21110-000-T00-C00-000-000-000', name: '買掛金（AP債務）', type: 'LIABILITY' },
  2310: { ccid: 2310, concat: '10-0000-23110-001-T00-LA1-000-000-000', name: 'リース負債（現在価値元本）', type: 'LIABILITY' },
  2390: { ccid: 2390, concat: '10-0000-23910-001-T10-LA1-000-000-000', name: 'リースAPクリアリング勘定', type: 'LIABILITY' },
  2490: { ccid: 2490, concat: '10-0000-24910-001-T10-LA2-000-000-000', name: 'リースARクリアリング／前受収益', type: 'LIABILITY' },
  2501: { ccid: 2501, concat: '10-0000-25110-000-T10-C00-000-000-000', name: '仮受消費税（標準10%）', type: 'LIABILITY' },
  3101: { ccid: 3101, concat: '10-0000-31110-000-T00-C00-000-000-000', name: '繰越利益剰余金・期首元入バランス', type: 'EQUITY' },
  4201: { ccid: 4201, concat: '10-1000-42110-001-T10-LA2-000-000-000', name: '受取リース収益（賃貸売上）', type: 'REVENUE' },
  5401: { ccid: 5401, concat: '10-3000-54110-001-T00-LA1-000-000-000', name: '使用権資産減価償却費', type: 'EXPENSE' },
  6301: { ccid: 6301, concat: '10-0000-63110-001-T00-LA1-000-000-000', name: '支払利息・リース負債利息費用', type: 'EXPENSE' },
  6401: { ccid: 6401, concat: '10-0000-64110-001-T00-LA1-000-000-000', name: 'リース中途解約損', type: 'EXPENSE' }
};

// リース会計の業務内容が初めての方でも理解できる6大業務プロセス入門データ
const LA_PROCESS_GUIDE = [
  {
    no: 1,
    title: '① システム基準・割引率準備',
    badge: '初期設定・割引率',
    meaning: 'どの会計基準（IFRS 16 / ASC 842 / 日本新リース基準）を使い、将来の支払賃料を現在価値へ割り引く金利（追加借入利子率）を定義する準備工程です。',
    tables: 'FLA_SYSTEM_OPTIONS_ALL / FLA_DISCOUNT_INDEXES_ALL / FLA_DISCOUNT_INDEX_RATES_F / FLA_PAYMENT_TEMPLATES_ALL',
    example: '日次複利(DAILY COMPOUND)、基準IFRS16、追加借入利子率 2.50% を登録。'
  },
  {
    no: 2,
    title: '② リース契約登録 ＆ 資産・負債認識',
    badge: '契約開始 (Booking)',
    meaning: 'オフィスや機械のリース契約を登録して有効化すると、システムが将来の支払総額を割引率で現在価値(PV)計算し、「使用権資産(ROU)」と「リース負債」を同時にオンバランス計上します。',
    tables: 'FLA_LEASES_ALL / FLA_LEASE_DETAILS / FLA_LEASE_ASSETS / FLA_SCHEDULE_HEADERS / FLA_LIABILITY_SCHEDULES',
    example: '24ヶ月×105,000円(計252万円) → PV計算で 2,400,000円 を ROU資産/リース負債計上。'
  },
  {
    no: 3,
    title: '③ AP買掛連携（毎月支払）＆ AR売掛連携（収益転貸）',
    badge: 'AP・AR双方向連携',
    meaning: '借手リースの月次賃料支払は LA→APへ自動連携して支払決済し、逆に自社が貸主となる収益リース(サブリース)は LA→ARへAutoInvoice連携してテナントへ請求・入金消込します。',
    tables: 'FLA_PAYMENT_ITEMS → AP_INVOICES_INTERFACE / AP_INVOICES_ALL ｜ RA_INTERFACE_LINES_ALL / RA_CUSTOMER_TRX_ALL',
    example: '借手: 105,000円+税10%をAP支払決済 / 貸手(転貸): 200,000円+税10%をAR請求＆入金消込。'
  },
  {
    no: 4,
    title: '④ 月次見越決算（ROU減価償却 ＆ 実効金利利息）',
    badge: '月次Accrual・残高',
    meaning: '毎月末に、計上した使用権資産の定額減価償却費と、実効金利法に基づくリース負債利息費用（または収益リースの定額収益認識）を計上し、期間残高を更新します。',
    tables: 'FLA_ACCRUAL_SCHEDULES / FLA_ACCOUNTING_HEADERS_ALL / FLA_ACCOUNTING_LINES / FLA_LEASE_BALANCES_ALL',
    example: 'ROU償却費 100,000円(240万÷24月) ＋ 支払利息 5,000円(240万×2.5%÷12) を計上。'
  },
  {
    no: 5,
    title: '⑤ 契約修正（期間延長・賃料変更の再測定）',
    badge: '改定 (Revision)',
    meaning: '増床や契約期間延長が生じた際、過去バージョンを保持したまま新バージョンを作成して残存リース負債を新割引率で再計算し、差額分だけROU資産と負債を増減修正します。',
    tables: 'FLA_LEASE_DETAILS(VERSION_NUM=2) / FLA_SCHEDULE_HEADERS / FLA_ACCOUNTING_HEADERS_ALL(LEASE_REVISION)',
    example: '増床+12ヶ月延長で新負債PV 2,880,000円へ再計算 → 差額+1,650,000円を上乗せ、月額償却118,750円へ再計算。'
  },
  {
    no: 6,
    title: '⑥ 中途解約（廃止・違約金AP・損益）＆ SLA/GL転記',
    badge: '解約・SLA/GL完結',
    meaning: '中途解約時は残っている使用権資産・累計償却額・リース負債を全額ゼロへ戻し、残差や違約金(AP請求)を解約損益として確定。全ての業務仕訳をSLA経由でGL総勘定元帳へ転記します。',
    tables: 'FLA_LEASES_ALL(TERMINATED) / XLA_TRANSACTION_ENTITIES(APPL=10522/200/222) / GL_JE_LINES / GL_BALANCES',
    example: 'ROU簿価60万・負債62万消去＋違約金8万(AP) → 解約損 60,000円計上し全ROU/負債残高 0円完結。'
  }
];

const DOMAINS = {
  ORG_GL_MASTER: { id: 'ORG_GL_MASTER', label: 'A. 組織・元帳・AFF・Flexfield マスタ', x: 16, y: 16, w: 280, h: 420, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  PARTNER_AP_AR_MASTER: { id: 'PARTNER_AP_AR_MASTER', label: 'B. 貸主/借主・AP/AR・銀行・税マスタ', x: 16, y: 452, w: 280, h: 612, color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  LA_CONTRACT_SCHEDULE: { id: 'LA_CONTRACT_SCHEDULE', label: 'C. LA リース設定・契約・償却/負債スケジュール', x: 312, y: 16, w: 304, h: 1048, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  LA_AP_AR_TXNS: { id: 'LA_AP_AR_TXNS', label: 'D. LA会計明細 ＆ AP(支払) / AR(請求入金) 連携', x: 632, y: 16, w: 636, h: 1048, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  SLA_XLA: { id: 'SLA_XLA', label: 'E. SLA（XLA: LA 10522 / AP 200 / AR 222）', x: 1284, y: 16, w: 520, h: 448, color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  GL_LEDGER: { id: 'GL_LEDGER', label: 'F. GL（総勘定元帳・残高）', x: 1284, y: 480, w: 520, h: 584, color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' }
};

const TABLES = {
  // === A. ORG_GL_MASTER (6) ===
  XLE_ENTITY_PROFILES: {
    id: 'XLE_ENTITY_PROFILES', name: 'XLE_ENTITY_PROFILES', jpName: '法的エンティティ・プロファイル', domain: 'ORG_GL_MASTER',
    x: 28, y: 56, w: 256, h: 52, pk: 'LEGAL_ENTITY_ID', fks: [],
    desc: '法的エンティティ（株式会社テスト商事）および登録番号を管理するマスタ。',
    keyCols: [
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'PK', desc: '法的エンティティID' },
      { name: 'NAME', type: 'VARCHAR2(240)', role: '', desc: '法人名' },
      { name: 'COUNTRY', type: 'VARCHAR2(60)', role: '', desc: 'JP' }
    ]
  },
  FUN_ALL_BUSINESS_UNITS_V: {
    id: 'FUN_ALL_BUSINESS_UNITS_V', name: 'FUN_ALL_BUSINESS_UNITS_V', jpName: 'ビジネス・ユニット (BU)', domain: 'ORG_GL_MASTER',
    x: 28, y: 116, w: 256, h: 52, pk: 'BU_ID', fks: ['LEGAL_ENTITY_ID', 'PRIMARY_LEDGER_ID'],
    desc: 'LAリース契約・AP支払・AR請求の管理単位（ORG_ID）。',
    keyCols: [
      { name: 'BU_ID', type: 'NUMBER(18)', role: 'PK', desc: 'ビジネス・ユニットID' },
      { name: 'BU_NAME', type: 'VARCHAR2(240)', role: '', desc: 'KGJPN_東京本社BU' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'FK', desc: '法的エンティティID' },
      { name: 'PRIMARY_LEDGER_ID', type: 'NUMBER(18)', role: 'FK', desc: '主元帳ID' }
    ]
  },
  GL_LEDGERS: {
    id: 'GL_LEDGERS', name: 'GL_LEDGERS', jpName: '総勘定元帳定義', domain: 'ORG_GL_MASTER',
    x: 28, y: 176, w: 256, h: 52, pk: 'LEDGER_ID', fks: ['CHART_OF_ACCOUNTS_ID'],
    desc: '機能通貨(JPY)・会計カレンダ・9セグメントAFF体系を規定する元帳マスタ。',
    keyCols: [
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'PK', desc: '2001' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: '', desc: 'JP_PRIMARY_LEDGER' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: '', desc: 'JPY' }
    ]
  },
  GL_PERIOD_STATUSES: {
    id: 'GL_PERIOD_STATUSES', name: 'GL_PERIOD_STATUSES', jpName: '会計期間ステータス (GL/AP/AR)', domain: 'ORG_GL_MASTER',
    x: 28, y: 236, w: 256, h: 52, pk: 'APPLICATION_ID, LEDGER_ID, PERIOD_NAME', fks: ['LEDGER_ID'],
    desc: 'GL(101)・AP(200)・AR(222)の会計期間オープン/クローズ管理テーブル。',
    keyCols: [
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'PK', desc: '101(GL)/200(AP)/222(AR)' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '2001' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'PK', desc: '2026-04 / 2027-04 / 2027-10' },
      { name: 'CLOSING_STATUS', type: 'VARCHAR2(1)', role: '', desc: 'O=オープン' }
    ]
  },
  FND_KF_STR_INSTANCES_B: {
    id: 'FND_KF_STR_INSTANCES_B', name: 'FND_KF_STR_INSTANCES_B', jpName: 'Key Flexfield 構造 (9軸AFF)', domain: 'ORG_GL_MASTER',
    x: 28, y: 296, w: 256, h: 52, pk: 'STRUCTURE_INSTANCE_ID', fks: [],
    desc: '9セグメントAFF（会社-部門-勘定-補助-税-管理-備考1-備考2-備考3）の構造定義。',
    keyCols: [
      { name: 'STRUCTURE_INSTANCE_ID', type: 'NUMBER(18)', role: 'PK', desc: '50001' },
      { name: 'STRUCTURE_INSTANCE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'JP_9SEG_AFF' },
      { name: 'KEY_FLEXFIELD_CODE', type: 'VARCHAR2(4)', role: '', desc: 'GL#' }
    ]
  },
  GL_CODE_COMBINATIONS: {
    id: 'GL_CODE_COMBINATIONS', name: 'GL_CODE_COMBINATIONS', jpName: '勘定科目組合せ (CCID / 9軸AFF)', domain: 'ORG_GL_MASTER',
    x: 28, y: 356, w: 256, h: 52, pk: 'CODE_COMBINATION_ID', fks: [],
    desc: 'SEGMENT1〜9を結合保持し、LA支払勘定設定・AP/AR・SLA・GLで参照されるCCIDマスタ。',
    keyCols: [
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'PK', desc: 'CCID' },
      { name: 'SEGMENT_CONCAT', type: 'VARCHAR2(120)', role: '', desc: '9軸文字列表現' },
      { name: 'ACCOUNT_TYPE', type: 'VARCHAR2(1)', role: '', desc: 'A/L/E/R/Q' }
    ]
  },

  // === B. PARTNER_AP_AR_MASTER (11) ===
  HZ_PARTIES: {
    id: 'HZ_PARTIES', name: 'HZ_PARTIES', jpName: 'TCAパーティ（貸主・転貸先顧客）', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 490, w: 256, h: 46, pk: 'PARTY_ID', fks: [],
    desc: 'リース契約の相手方（貸主ビルオーナー／サブリース先テナント）の法人マスタ。',
    keyCols: [
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'PK', desc: 'パーティID' },
      { name: 'PARTY_NAME', type: 'VARCHAR2(360)', role: '', desc: '相手先名' }
    ]
  },
  HZ_PARTY_SITES: {
    id: 'HZ_PARTY_SITES', name: 'HZ_PARTY_SITES', jpName: 'パーティ・サイト', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 541, w: 256, h: 46, pk: 'PARTY_SITE_ID', fks: ['PARTY_ID'],
    desc: '貸主・転貸先の拠点サイト情報。',
    keyCols: [
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'PK', desc: 'サイトID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'FK', desc: 'パーティID' },
      { name: 'PARTY_SITE_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'サイト番号' }
    ]
  },
  POZ_SUPPLIERS: {
    id: 'POZ_SUPPLIERS', name: 'POZ_SUPPLIERS', jpName: 'サプライヤ（リース貸主）', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 592, w: 256, h: 46, pk: 'VENDOR_ID', fks: ['PARTY_ID'],
    desc: '借手リースの支払先(VENDOR_ID)。LAからAP請求自動作成時に参照。',
    keyCols: [
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'PK', desc: '5001' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'FK', desc: '4001' },
      { name: 'VENDOR_NAME', type: 'VARCHAR2(240)', role: '', desc: '三井不動産ビルディング株式会社' }
    ]
  },
  POZ_SUPPLIER_SITES_ALL_M: {
    id: 'POZ_SUPPLIER_SITES_ALL_M', name: 'POZ_SUPPLIER_SITES_ALL_M', jpName: 'サプライヤ・サイト', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 643, w: 256, h: 46, pk: 'VENDOR_SITE_ID', fks: ['VENDOR_ID', 'PARTY_SITE_ID'],
    desc: 'AP支払先サイトおよび支払条件の規定。',
    keyCols: [
      { name: 'VENDOR_SITE_ID', type: 'NUMBER(18)', role: 'PK', desc: '5101' },
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'FK', desc: '5001' },
      { name: 'VENDOR_SITE_CODE', type: 'VARCHAR2(15)', role: '', desc: 'TOKYO-LEASING' }
    ]
  },
  HZ_CUST_ACCOUNTS: {
    id: 'HZ_CUST_ACCOUNTS', name: 'HZ_CUST_ACCOUNTS', jpName: '顧客アカウント（転貸テナント）', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 694, w: 256, h: 46, pk: 'CUST_ACCOUNT_ID', fks: ['PARTY_ID'],
    desc: '収益リース・サブリース時に家賃請求先となる顧客(BILL_TO_CUSTOMER_ID)。',
    keyCols: [
      { name: 'CUST_ACCOUNT_ID', type: 'NUMBER(18)', role: 'PK', desc: '6001' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'FK', desc: '4002' },
      { name: 'ACCOUNT_NAME', type: 'VARCHAR2(240)', role: '', desc: '株式会社テックイノベーション' }
    ]
  },
  HZ_CUST_ACCT_SITES_ALL: {
    id: 'HZ_CUST_ACCT_SITES_ALL', name: 'HZ_CUST_ACCT_SITES_ALL', jpName: '顧客サイト（請求先用途）', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 745, w: 256, h: 46, pk: 'CUST_ACCT_SITE_ID', fks: ['CUST_ACCOUNT_ID', 'PARTY_SITE_ID'],
    desc: 'AR AutoInvoice請求作成用の請求先サイト用途(BILL_TO_SITE_USE_ID)。',
    keyCols: [
      { name: 'CUST_ACCT_SITE_ID', type: 'NUMBER(18)', role: 'PK', desc: '6201' },
      { name: 'CUST_ACCOUNT_ID', type: 'NUMBER(18)', role: 'FK', desc: '6001' },
      { name: 'BILL_TO_SITE_USE_ID', type: 'NUMBER(18)', role: '', desc: '6301' }
    ]
  },
  RA_CUST_TRX_TYPES_ALL: {
    id: 'RA_CUST_TRX_TYPES_ALL', name: 'RA_CUST_TRX_TYPES_ALL', jpName: 'AR取引タイプ（リース賃貸請求）', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 796, w: 256, h: 46, pk: 'CUST_TRX_TYPE_SEQ_ID', fks: [],
    desc: '収益リースAR連携で作成する請求書タイプ(LEASE_INV)。',
    keyCols: [
      { name: 'CUST_TRX_TYPE_SEQ_ID', type: 'NUMBER(18)', role: 'PK', desc: '301' },
      { name: 'NAME', type: 'VARCHAR2(20)', role: '', desc: 'JP_LEASE_REV_INV' },
      { name: 'TYPE', type: 'VARCHAR2(20)', role: '', desc: 'INV' }
    ]
  },
  AP_TERMS_B: {
    id: 'AP_TERMS_B', name: 'AP_TERMS_B', jpName: '支払/請求条件 (NET_30 / IMMEDIATE)', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 847, w: 256, h: 46, pk: 'TERM_ID', fks: [],
    desc: 'APおよびAR請求の支払・回収期限計算条件。',
    keyCols: [
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'PK', desc: '10' },
      { name: 'NAME', type: 'VARCHAR2(50)', role: '', desc: 'IMMEDIATE（期日即時）' }
    ]
  },
  ZX_RATES_B: {
    id: 'ZX_RATES_B', name: 'ZX_RATES_B', jpName: 'EBTax 税率マスタ (消費税10%)', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 898, w: 256, h: 46, pk: 'TAX_RATE_ID', fks: [],
    desc: 'オフィス賃料・解約違約金・サブリース賃貸料に対する消費税10%定義。',
    keyCols: [
      { name: 'TAX_RATE_ID', type: 'NUMBER(15)', role: 'PK', desc: '101' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: '', desc: 'JP_TAX_10' },
      { name: 'PERCENTAGE_RATE', type: 'NUMBER', role: '', desc: '10.00' }
    ]
  },
  CE_BANK_ACCOUNTS: {
    id: 'CE_BANK_ACCOUNTS', name: 'CE_BANK_ACCOUNTS', jpName: '自社銀行口座マスタ', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 949, w: 256, h: 46, pk: 'BANK_ACCOUNT_ID', fks: ['ASSET_CODE_COMBINATION_ID'],
    desc: 'AP支払出金およびAR入金着金に使用する自社普通預金口座。',
    keyCols: [
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'PK', desc: '8001' },
      { name: 'BANK_ACCOUNT_NAME', type: 'VARCHAR2(100)', role: '', desc: 'みずほ銀行 本店 普通' },
      { name: 'ASSET_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '1001' }
    ]
  },
  CE_BANK_ACCT_USES_ALL: {
    id: 'CE_BANK_ACCT_USES_ALL', name: 'CE_BANK_ACCT_USES_ALL', jpName: 'BU別銀行口座用途', domain: 'PARTNER_AP_AR_MASTER',
    x: 28, y: 1000, w: 256, h: 46, pk: 'BANK_ACCT_USE_ID', fks: ['BANK_ACCOUNT_ID', 'ORG_ID'],
    desc: 'BUに割り当てられた銀行口座利用設定。',
    keyCols: [
      { name: 'BANK_ACCT_USE_ID', type: 'NUMBER(18)', role: 'PK', desc: '7001' },
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'FK', desc: '8001' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'FK', desc: '300001' }
    ]
  },

  // === C. LA_CONTRACT_SCHEDULE (15) ===
  FLA_SYSTEM_OPTIONS_ALL: {
    id: 'FLA_SYSTEM_OPTIONS_ALL', name: 'FLA_SYSTEM_OPTIONS_ALL', jpName: 'LA システムオプション設定', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 56, w: 280, h: 50, pk: 'SYSTEM_OPTION_ID', fks: ['ORG_ID', 'LEDGER_ID'],
    desc: 'BU単位で会計基準(IFRS16)・利息計算手法(DAILY COMPOUND)・償却頻度・自動採番を設定。',
    keyCols: [
      { name: 'SYSTEM_OPTION_ID', type: 'NUMBER(18)', role: 'PK', desc: '1' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'FK', desc: '300001' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'FK', desc: '2001' },
      { name: 'PRIMARY_REGIME_CODE', type: 'VARCHAR2(30)', role: '', desc: 'IFRS16' },
      { name: 'INTEREST_METHOD_CODE', type: 'VARCHAR2(30)', role: '', desc: 'DAILY COMPOUND' },
      { name: 'AMORTIZATION_FREQUENCY_CODE', type: 'VARCHAR2(30)', role: '', desc: 'PERIODICALLY' }
    ]
  },
  FLA_DISCOUNT_INDEXES_ALL: {
    id: 'FLA_DISCOUNT_INDEXES_ALL', name: 'FLA_DISCOUNT_INDEXES_ALL', jpName: 'LA 割引率インデックスヘッダ', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 122, w: 280, h: 50, pk: 'INDEX_ID', fks: ['ORG_ID'],
    desc: '現在価値計算に用いる追加借入利子率(IBR)インデックスのヘッダ定義。',
    keyCols: [
      { name: 'INDEX_ID', type: 'NUMBER(18)', role: 'PK', desc: '101' },
      { name: 'NAME', type: 'VARCHAR2(300)', role: '', desc: 'JP_IBR_INDEX' },
      { name: 'START_DATE', type: 'DATE', role: '', desc: '2026-01-01' }
    ]
  },
  FLA_DISCOUNT_INDEX_RATES_F: {
    id: 'FLA_DISCOUNT_INDEX_RATES_F', name: 'FLA_DISCOUNT_INDEX_RATES_F', jpName: 'LA 割引率（期間有効レート）', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 188, w: 280, h: 50, pk: 'INDEX_LINE_ID', fks: ['INDEX_ID'],
    desc: '有効開始・終了日ごとの割引率(%)。新規登録時 2.50%、契約改定時 3.00% 等を提供。',
    keyCols: [
      { name: 'INDEX_LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: '1001 / 1002' },
      { name: 'INDEX_ID', type: 'NUMBER(18)', role: 'FK', desc: '101' },
      { name: 'EFFECTIVE_START_DATE', type: 'DATE', role: '', desc: '2026-04-01 / 2027-04-01' },
      { name: 'RATE_VALUE', type: 'NUMBER', role: '', desc: '2.50% / 3.00%' },
      { name: 'FINAL_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y' }
    ]
  },
  FLA_PAYMENT_TEMPLATES_ALL: {
    id: 'FLA_PAYMENT_TEMPLATES_ALL', name: 'FLA_PAYMENT_TEMPLATES_ALL', jpName: 'LA 支払テンプレート', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 254, w: 280, h: 50, pk: 'PAYMENT_TEMPLATE_ID', fks: ['ORG_ID', 'VENDOR_ID'],
    desc: '基本賃料・解約違約金・転貸収入のROU/負債生成ルールと既定仕入先をひな形定義。',
    keyCols: [
      { name: 'PAYMENT_TEMPLATE_ID', type: 'NUMBER(18)', role: 'PK', desc: '201 / 202' },
      { name: 'NAME', type: 'VARCHAR2(300)', role: '', desc: 'OFFICE_RENT_EXP / SUBLEASE_REV' },
      { name: 'ROU_ASSET_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y / N' },
      { name: 'LIABILITY_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y / N' }
    ]
  },
  FLA_LEASES_ALL: {
    id: 'FLA_LEASES_ALL', name: 'FLA_LEASES_ALL', jpName: 'LA リース契約マスタヘッダ', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 320, w: 280, h: 50, pk: 'LEASE_ID', fks: ['ORG_ID', 'LESSOR_PARTY_ID'],
    desc: 'リース契約番号・契約名・種別(EXPENSE/REVENUE)・ステータス(DRAFT→ACTIVE→TERMINATED)を管理。',
    keyCols: [
      { name: 'LEASE_ID', type: 'NUMBER(18)', role: 'PK', desc: '40001 / 40002' },
      { name: 'LEASE_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'LA-2026-001 / LA-REV-2026-101' },
      { name: 'LEASE_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'EXPENSE / REVENUE' },
      { name: 'LEASE_ASSET_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'PROPERTY' },
      { name: 'LEASE_STATUS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'DRAFT → ACTIVE → TERMINATED' }
    ]
  },
  FLA_LEASE_DETAILS: {
    id: 'FLA_LEASE_DETAILS', name: 'FLA_LEASE_DETAILS', jpName: 'LA リース契約バージョン明細', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 386, w: 280, h: 50, pk: 'LEASE_DETAIL_ID', fks: ['LEASE_ID'],
    desc: 'バージョン管理表。初期登録(VERSION_NUM=1)・改定(VERSION_NUM=2)・解約(VERSION_NUM=3)ごとにリース分類と契約期間を保持。',
    keyCols: [
      { name: 'LEASE_DETAIL_ID', type: 'NUMBER(18)', role: 'PK', desc: '41001〜' },
      { name: 'LEASE_ID', type: 'NUMBER(18)', role: 'FK', desc: '40001' },
      { name: 'VERSION_NUM', type: 'NUMBER', role: '', desc: '1 → 2' },
      { name: 'PRIMARY_CLASSIFICATION_CODE', type: 'VARCHAR2(30)', role: '', desc: 'FINANCE / OPERATING' },
      { name: 'LEASE_START_DATE', type: 'DATE', role: '', desc: '開始日' },
      { name: 'LEASE_END_DATE', type: 'DATE', role: '', desc: '終了日（延長/解約で更新）' }
    ]
  },
  FLA_LEASE_ASSETS: {
    id: 'FLA_LEASE_ASSETS', name: 'FLA_LEASE_ASSETS', jpName: 'LA リース対象資産明細', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 452, w: 280, h: 50, pk: 'LEASE_ASSET_ID', fks: ['LEASE_DETAIL_ID', 'LEASE_ID'],
    desc: 'リース対象となる物件・フロア・設備ごとの利用開始/終了日と設置場所を管理。',
    keyCols: [
      { name: 'LEASE_ASSET_ID', type: 'NUMBER(18)', role: 'PK', desc: '42001' },
      { name: 'LEASE_DETAIL_ID', type: 'NUMBER(18)', role: 'FK', desc: '41001' },
      { name: 'ASSET_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'LA-ASSET-001' },
      { name: 'CHANGE_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'ADD / REVISE / TERMINATE' }
    ]
  },
  FLA_LEASE_PAYMENT_HEADERS: {
    id: 'FLA_LEASE_PAYMENT_HEADERS', name: 'FLA_LEASE_PAYMENT_HEADERS', jpName: 'LA リース支払/請求条件ヘッダ', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 518, w: 280, h: 50, pk: 'PAYMENT_HEADER_ID', fks: ['LEASE_ID', 'LEASE_DETAIL_ID', 'VENDOR_ID', 'BILL_TO_CUSTOMER_ID'],
    desc: '定期賃料・違約金・転貸料ごとに、ROU/負債フラグ、頻度(MONTHLY)、AP支払先(VENDOR_ID)またはAR請求先(BILL_TO_CUSTOMER_ID)を保持。',
    keyCols: [
      { name: 'PAYMENT_HEADER_ID', type: 'NUMBER(18)', role: 'PK', desc: '43001' },
      { name: 'PAYMENT_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'PAY-BASE-01 / PAY-TERM-02 / REV-SUB-01' },
      { name: 'ROU_ASSET_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y / N' },
      { name: 'LIABILITY_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y / N' },
      { name: 'VENDOR_ID / BILL_TO_CUSTOMER_ID', type: 'NUMBER(18)', role: 'FK', desc: 'AP仕入先 / AR顧客' }
    ]
  },
  FLA_LEASE_PAYMENT_LINES: {
    id: 'FLA_LEASE_PAYMENT_LINES', name: 'FLA_LEASE_PAYMENT_LINES', jpName: 'LA リース支払/請求ライン明細', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 584, w: 280, h: 50, pk: 'PAYMENT_LINE_ID', fks: ['PAYMENT_HEADER_ID', 'LEASE_ID'],
    desc: '期間別の定額支払額(ACTUAL_AMOUNT)・回数(NO_OF_PAYMENTS)・開始/終了日を定義。',
    keyCols: [
      { name: 'PAYMENT_LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: '44001' },
      { name: 'PAYMENT_NUMBER', type: 'VARCHAR2(30)', role: '', desc: '支払番号' },
      { name: 'ACTUAL_AMOUNT', type: 'NUMBER', role: '', desc: '月額 105,000 / 130,000 / 200,000' },
      { name: 'NO_OF_PAYMENTS', type: 'NUMBER', role: '', desc: '24 / 1' }
    ]
  },
  FLA_LEASE_PAYMENT_ACCOUNTS: {
    id: 'FLA_LEASE_PAYMENT_ACCOUNTS', name: 'FLA_LEASE_PAYMENT_ACCOUNTS', jpName: 'LA 支払・会計別 9軸CCID指定', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 650, w: 280, h: 50, pk: 'PAYMENT_ACCOUNT_ID', fks: ['LEASE_ID', 'ACCOUNT_CCID'],
    desc: '支払番号ごとに使用権資産・リース負債・償却費・支払利息・クリアリング・解約損等のAFF 9セグメントCCIDをマッピング。',
    keyCols: [
      { name: 'PAYMENT_ACCOUNT_ID', type: 'NUMBER(18)', role: 'PK', desc: '45001〜' },
      { name: 'PAYMENT_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'PAY-BASE-01 等' },
      { name: 'ACCOUNT_CLASS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'ROU_ASSET / LIABILITY / INTEREST / AMORTIZATION' },
      { name: 'ACCOUNT_CCID', type: 'NUMBER(18)', role: 'FK', desc: '1710 / 2310 / 5401 / 6301 / 2390' }
    ]
  },
  FLA_SCHEDULE_HEADERS: {
    id: 'FLA_SCHEDULE_HEADERS', name: 'FLA_SCHEDULE_HEADERS', jpName: 'LA 計算スケジュールヘッダ', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 716, w: 280, h: 50, pk: 'SCHEDULE_HEADER_ID', fks: ['LEASE_ID', 'LEASE_DETAIL_ID'],
    desc: '有効化・修正・解約ごとに生成される返済・償却スケジュールヘッダ。適用金利や有効フラグ(ACTIVE_FLAG)を管理。',
    keyCols: [
      { name: 'SCHEDULE_HEADER_ID', type: 'NUMBER(18)', role: 'PK', desc: '46001〜' },
      { name: 'VERSION_NUM', type: 'NUMBER', role: '', desc: '1 / 2' },
      { name: 'REGIME_CODE', type: 'VARCHAR2(30)', role: '', desc: 'IFRS16' },
      { name: 'INTEREST_RATE', type: 'NUMBER', role: '', desc: '2.50 / 3.00' },
      { name: 'ACTIVE_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y / N' }
    ]
  },
  FLA_LIABILITY_SCHEDULES: {
    id: 'FLA_LIABILITY_SCHEDULES', name: 'FLA_LIABILITY_SCHEDULES', jpName: 'LA リース負債・現在価値スケジュール', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 782, w: 280, h: 50, pk: 'LIABILITY_SCHEDULE_ID', fks: ['SCHEDULE_HEADER_ID'],
    desc: '各期間の期首負債・現在価値(PV=240万 / 再測定288万)・月次支払・利息計算・期末負債を保持。',
    keyCols: [
      { name: 'LIABILITY_SCHEDULE_ID', type: 'NUMBER(18)', role: 'PK', desc: '47001〜' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: '', desc: '2026-04 / 2027-04' },
      { name: 'PRESENT_VALUE_AMOUNT', type: 'NUMBER', role: '', desc: '現在価値(PV)' },
      { name: 'OPENING_LIABILITY_AMOUNT', type: 'NUMBER', role: '', desc: '期首負債' },
      { name: 'INTEREST_AMOUNT', type: 'NUMBER', role: '', desc: '実効利息(5,000 / 7,200)' },
      { name: 'CLOSING_LIABILITY_AMOUNT', type: 'NUMBER', role: '', desc: '期末負債' }
    ]
  },
  FLA_ACCRUAL_SCHEDULES: {
    id: 'FLA_ACCRUAL_SCHEDULES', name: 'FLA_ACCRUAL_SCHEDULES', jpName: 'LA ROU償却・利息・収益見越明細', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 848, w: 280, h: 50, pk: 'ACCRUAL_SCHEDULE_ID', fks: ['SCHEDULE_HEADER_ID'],
    desc: '月次ROU減価償却費(SCHEDULE1_AMOUNT)・利息または収益認識額および期首/期末ROU純額を管理。ACCRUED_FLAG=Yで計上完了。',
    keyCols: [
      { name: 'ACCRUAL_SCHEDULE_ID', type: 'NUMBER(18)', role: 'PK', desc: '48001〜' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: '', desc: '2026-04 / 2027-04' },
      { name: 'SCHEDULE1_AMOUNT', type: 'NUMBER', role: '', desc: 'ROU償却/収益認識額' },
      { name: 'INTEREST_AMOUNT', type: 'NUMBER', role: '', desc: '支払利息' },
      { name: 'ACCRUED_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'N → Y' }
    ]
  },
  FLA_PAYMENT_ITEMS: {
    id: 'FLA_PAYMENT_ITEMS', name: 'FLA_PAYMENT_ITEMS', jpName: 'LA 支払/請求承認アイテム (AP/AR起点)', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 914, w: 280, h: 50, pk: 'PAYMENT_ITEM_ID', fks: ['LEASE_ID', 'LEASE_DETAIL_ID'],
    desc: '毎月の支払・違約金・転貸請求ごとに承認(APPROVAL_STATUS_CODE)され、APまたはARへ連携(INTERFACE_STATUS_CODE=INTERFACED)される明細。',
    keyCols: [
      { name: 'PAYMENT_ITEM_ID', type: 'NUMBER(18)', role: 'PK', desc: '49001〜' },
      { name: 'ACTUAL_AMOUNT', type: 'NUMBER', role: '', desc: '請求連携額' },
      { name: 'APPROVAL_STATUS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'APPROVED' },
      { name: 'INTERFACE_STATUS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'PENDING → INTERFACED' }
    ]
  },
  FLA_LEASE_BALANCES_ALL: {
    id: 'FLA_LEASE_BALANCES_ALL', name: 'FLA_LEASE_BALANCES_ALL', jpName: 'LA リース期間別残高レポート表', domain: 'LA_CONTRACT_SCHEDULE',
    x: 324, y: 980, w: 280, h: 50, pk: 'LEASE_BALANCE_ID', fks: ['LEASE_ID', 'LEDGER_ID'],
    desc: 'リース単位×会計期間ごとの使用権資産(ROU)残高とリース負債(LIABILITY)残高を開示・監査向けに集計する残高テーブル。',
    keyCols: [
      { name: 'LEASE_BALANCE_ID', type: 'NUMBER(18)', role: 'PK', desc: '50001〜' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: '', desc: '期間名' },
      { name: 'BALANCE_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'ROU / LIABILITY' },
      { name: 'CLOSING_BALANCE', type: 'NUMBER', role: '', desc: '期末残高' }
    ]
  },

  // === D. LA_AP_AR_TXNS (左: LA会計 + AP連携 11表 / 右: AR連携 9表 = 20表) ===
  FLA_ACCOUNTING_HEADERS_ALL: {
    id: 'FLA_ACCOUNTING_HEADERS_ALL', name: 'FLA_ACCOUNTING_HEADERS_ALL', jpName: 'LA 会計イベントヘッダ (SLA橋渡し)', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 60, w: 294, h: 54, pk: 'TRANSACTION_ID', fks: ['LEASE_ID', 'LEDGER_ID', 'EVENT_ID'],
    desc: 'LA内の全会計事象（BOOKING / PAYMENT / ACCRUAL / REVISION / TERMINATION / REVENUE_ACCRUAL）を記録しXLA_EVENTSへ繋ぐ表。',
    keyCols: [
      { name: 'TRANSACTION_ID', type: 'NUMBER(18)', role: 'PK', desc: '61001〜' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'LEASE_BOOKING / REVISION / TERMINATION 等' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'FK', desc: 'XLAイベントID' },
      { name: 'ACCOUNTED_IN_GL_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'N → Y' }
    ]
  },
  FLA_ACCOUNTING_LINES: {
    id: 'FLA_ACCOUNTING_LINES', name: 'FLA_ACCOUNTING_LINES', jpName: 'LA 会計仕訳明細 (ROU/負債/償却/利息)', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 148, w: 294, h: 54, pk: 'TRANSACTION_LINE_ID', fks: ['TRANSACTION_ID', 'DR_CODE_COMBINATION_ID', 'CR_CODE_COMBINATION_ID'],
    desc: 'LA取引に対する借方・貸方CCIDと金額(ENTERED_AMOUNT / ACCOUNTED_AMOUNT)を格納。',
    keyCols: [
      { name: 'TRANSACTION_LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: '62001〜' },
      { name: 'SCHEDULE_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'ROU_ASSET / LEASE_LIABILITY / AMORTIZATION 等' },
      { name: 'DR_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '借方CCID' },
      { name: 'CR_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '貸方CCID' },
      { name: 'ACCOUNTED_AMOUNT', type: 'NUMBER', role: '', desc: '金額(JPY)' }
    ]
  },
  AP_INVOICES_INTERFACE: {
    id: 'AP_INVOICES_INTERFACE', name: 'AP_INVOICES_INTERFACE', jpName: 'AP請求書オープンインタフェース', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 236, w: 294, h: 54, pk: 'INVOICE_ID', fks: ['VENDOR_ID', 'VENDOR_SITE_ID'],
    desc: 'LA(FLA_PAYMENT_ITEMS)から作成されたAP請求インポートステージング表。SOURCE=ORACLE LEASE ACCOUNTINGで投入される。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(15)', role: 'PK', desc: '10001〜' },
      { name: 'INVOICE_NUM', type: 'VARCHAR2(50)', role: '', desc: 'AP-LA-202604 等' },
      { name: 'INVOICE_AMOUNT', type: 'NUMBER', role: '', desc: '請求税抜金額' },
      { name: 'SOURCE', type: 'VARCHAR2(80)', role: '', desc: 'Lease Accounting' },
      { name: 'STATUS', type: 'VARCHAR2(25)', role: '', desc: 'PROCESSED' }
    ]
  },
  AP_INVOICES_ALL: {
    id: 'AP_INVOICES_ALL', name: 'AP_INVOICES_ALL', jpName: 'AP請求書ヘッダ（賃料・違約金）', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 324, w: 294, h: 54, pk: 'INVOICE_ID', fks: ['VENDOR_ID', 'ORG_ID'],
    desc: 'APにインポートされたリース賃料/解約違約金請求書ヘッダ。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK', desc: '10001〜' },
      { name: 'INVOICE_AMOUNT', type: 'NUMBER', role: '', desc: '税込請求金額' },
      { name: 'VALIDATION_STATUS', type: 'VARCHAR2(25)', role: '', desc: 'VALIDATED' },
      { name: 'PAYMENT_STATUS_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'N → Y' }
    ]
  },
  AP_INVOICE_LINES_ALL: {
    id: 'AP_INVOICE_LINES_ALL', name: 'AP_INVOICE_LINES_ALL', jpName: 'AP請求書明細', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 412, w: 294, h: 54, pk: 'INVOICE_ID, LINE_NUMBER', fks: ['INVOICE_ID', 'DEFAULT_DIST_CCID'],
    desc: 'クリアリング勘定(2390)を借方設定した品目行および消費税10%(1501)行を保持。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '10001〜' },
      { name: 'LINE_NUMBER', type: 'NUMBER', role: 'PK', desc: '1(品目) / 2(税)' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '金額' }
    ]
  },
  ZX_LINES: {
    id: 'ZX_LINES', name: 'ZX_LINES', jpName: 'EBTax 税明細 (AP/AR 10%)', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 500, w: 294, h: 54, pk: 'TAX_LINE_ID', fks: ['TRX_ID', 'TAX_RATE_ID'],
    desc: 'AP賃料支払(仮払消費税)およびARサブリース請求(仮受消費税)の10%税明細。',
    keyCols: [
      { name: 'TAX_LINE_ID', type: 'NUMBER(15)', role: 'PK', desc: '税明細ID' },
      { name: 'APPLICATION_ID', type: 'NUMBER', role: '', desc: '200(AP) / 222(AR)' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: '', desc: 'JP_TAX_10' },
      { name: 'TAX_AMT', type: 'NUMBER', role: '', desc: '10%税額' }
    ]
  },
  AP_INVOICE_DISTRIBUTIONS_ALL: {
    id: 'AP_INVOICE_DISTRIBUTIONS_ALL', name: 'AP_INVOICE_DISTRIBUTIONS_ALL', jpName: 'AP勘定配分（クリアリング消込）', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 588, w: 294, h: 54, pk: 'INVOICE_DISTRIBUTION_ID', fks: ['INVOICE_ID', 'DIST_CODE_COMBINATION_ID'],
    desc: 'LA側で計上したリースAPクリアリング(2390)をAP借方で相殺消込し、負債を正確に買掛金(2101)へ移す配分表。',
    keyCols: [
      { name: 'INVOICE_DISTRIBUTION_ID', type: 'NUMBER(18)', role: 'PK', desc: '配分ID' },
      { name: 'DIST_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '2390(クリアリング) / 1501(仮払税)' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '金額' }
    ]
  },
  AP_PAYMENT_SCHEDULES_ALL: {
    id: 'AP_PAYMENT_SCHEDULES_ALL', name: 'AP_PAYMENT_SCHEDULES_ALL', jpName: 'AP支払予定スケジュール', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 676, w: 294, h: 54, pk: 'INVOICE_ID, PAYMENT_NUM', fks: ['INVOICE_ID'],
    desc: '貸主への賃料/違約金の支払残高(振込決済後は0)。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '10001〜' },
      { name: 'GROSS_AMOUNT', type: 'NUMBER', role: '', desc: '税込支払予定' },
      { name: 'AMOUNT_REMAINING', type: 'NUMBER', role: '', desc: '残高 → 0' }
    ]
  },
  AP_CHECKS_ALL: {
    id: 'AP_CHECKS_ALL', name: 'AP_CHECKS_ALL', jpName: 'AP支払（銀行振込決済 CLEARED）', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 764, w: 294, h: 54, pk: 'CHECK_ID', fks: ['VENDOR_ID', 'CE_BANK_ACCT_USE_ID'],
    desc: 'リース貸主への銀行口座振込実績レコード。',
    keyCols: [
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'PK', desc: '88001〜' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '振込出金額' },
      { name: 'STATUS_LOOKUP_CODE', type: 'VARCHAR2(25)', role: '', desc: 'CLEARED' }
    ]
  },
  AP_INVOICE_PAYMENTS_ALL: {
    id: 'AP_INVOICE_PAYMENTS_ALL', name: 'AP_INVOICE_PAYMENTS_ALL', jpName: 'AP請求・支払消込', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 852, w: 294, h: 54, pk: 'INVOICE_PAYMENT_ID', fks: ['INVOICE_ID', 'CHECK_ID'],
    desc: 'APリース請求と銀行支払実績の消込紐付け。',
    keyCols: [
      { name: 'INVOICE_PAYMENT_ID', type: 'NUMBER(18)', role: 'PK', desc: '消込ID' },
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'FK', desc: '請求書ID' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '消込額' }
    ]
  },
  AP_PAYMENT_HISTORY_ALL: {
    id: 'AP_PAYMENT_HISTORY_ALL', name: 'AP_PAYMENT_HISTORY_ALL', jpName: 'AP支払会計履歴', domain: 'LA_AP_AR_TXNS',
    x: 646, y: 940, w: 294, h: 54, pk: 'PAYMENT_HISTORY_ID', fks: ['CHECK_ID', 'ACCOUNTING_EVENT_ID'],
    desc: '銀行決済に伴う買掛金消込・現預金支出会計の連携履歴。',
    keyCols: [
      { name: 'PAYMENT_HISTORY_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払履歴ID' },
      { name: 'TRANSACTION_TYPE', type: 'VARCHAR2(30)', role: '', desc: 'PAYMENT CLEARING' },
      { name: 'TRANSACTION_AMOUNT', type: 'NUMBER', role: '', desc: '取引額' }
    ]
  },

  // --- D右サブ列: ARサブリース連携 9表 ---
  RA_INTERFACE_LINES_ALL: {
    id: 'RA_INTERFACE_LINES_ALL', name: 'RA_INTERFACE_LINES_ALL', jpName: 'AR AutoInvoice インタフェース', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 60, w: 294, h: 54, pk: 'INTERFACE_LINE_ID', fks: ['ORIG_SYSTEM_BILL_CUSTOMER_ID'],
    desc: '収益リース(REVENUE)の月次請求データをARのAutoInvoiceへ連携するオープンインタフェース表。',
    keyCols: [
      { name: 'INTERFACE_LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: '90001' },
      { name: 'BATCH_SOURCE_NAME', type: 'VARCHAR2(50)', role: '', desc: 'ORA_LEASE_ACCOUNTING' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '200,000' },
      { name: 'INTERFACE_STATUS', type: 'VARCHAR2(1)', role: '', desc: 'P（完了）' }
    ]
  },
  RA_CUSTOMER_TRX_ALL: {
    id: 'RA_CUSTOMER_TRX_ALL', name: 'RA_CUSTOMER_TRX_ALL', jpName: 'AR請求書ヘッダ（サブリース賃貸）', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 156, w: 294, h: 54, pk: 'CUSTOMER_TRX_ID', fks: ['BILL_TO_CUSTOMER_ID', 'CUST_TRX_TYPE_SEQ_ID'],
    desc: 'AutoInvoiceにより作成されたサブリース請求書（AR-LA-2026-001）。',
    keyCols: [
      { name: 'CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'PK', desc: '30001' },
      { name: 'TRX_NUMBER', type: 'VARCHAR2(20)', role: '', desc: 'AR-LA-2026-001' },
      { name: 'COMPLETE_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y' }
    ]
  },
  RA_CUSTOMER_TRX_LINES_ALL: {
    id: 'RA_CUSTOMER_TRX_LINES_ALL', name: 'RA_CUSTOMER_TRX_LINES_ALL', jpName: 'AR請求書明細', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 252, w: 294, h: 54, pk: 'CUSTOMER_TRX_LINE_ID', fks: ['CUSTOMER_TRX_ID'],
    desc: 'サブリース賃貸料200,000円および仮受消費税10% 20,000円を保持。',
    keyCols: [
      { name: 'CUSTOMER_TRX_LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: '31001 / 31002' },
      { name: 'LINE_TYPE', type: 'VARCHAR2(20)', role: '', desc: 'LINE / TAX' },
      { name: 'EXTENDED_AMOUNT', type: 'NUMBER', role: '', desc: '200,000 / 20,000' }
    ]
  },
  RA_CUST_TRX_LINE_GL_DIST_ALL: {
    id: 'RA_CUST_TRX_LINE_GL_DIST_ALL', name: 'RA_CUST_TRX_LINE_GL_DIST_ALL', jpName: 'AR請求仕訳配分 (2490クリアリング)', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 348, w: 294, h: 54, pk: 'CUST_TRX_LINE_GL_DIST_ID', fks: ['CUSTOMER_TRX_ID', 'CODE_COMBINATION_ID'],
    desc: '売掛金(1110) 220,000円の相手勘定をリースARクリアリング(2490) 200,000円・仮受消費税(2501) 20,000円として計上。',
    keyCols: [
      { name: 'CUST_TRX_LINE_GL_DIST_ID', type: 'NUMBER(18)', role: 'PK', desc: '32001〜' },
      { name: 'ACCOUNT_CLASS', type: 'VARCHAR2(20)', role: '', desc: 'REC / REV / TAX' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '1110 / 2490 / 2501' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '220,000 / 200,000 / 20,000' }
    ]
  },
  AR_PAYMENT_SCHEDULES_ALL: {
    id: 'AR_PAYMENT_SCHEDULES_ALL', name: 'AR_PAYMENT_SCHEDULES_ALL', jpName: 'AR回収予定スケジュール', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 444, w: 294, h: 54, pk: 'PAYMENT_SCHEDULE_ID', fks: ['CUSTOMER_TRX_ID'],
    desc: 'テナントへの売掛回収残高(入金消込後に残高 0, STATUS=CL)。',
    keyCols: [
      { name: 'PAYMENT_SCHEDULE_ID', type: 'NUMBER(18)', role: 'PK', desc: '40001' },
      { name: 'AMOUNT_DUE_ORIGINAL', type: 'NUMBER', role: '', desc: '220,000' },
      { name: 'AMOUNT_DUE_REMAINING', type: 'NUMBER', role: '', desc: '220,000 → 0' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'OP → CL' }
    ]
  },
  AR_CASH_RECEIPTS_ALL: {
    id: 'AR_CASH_RECEIPTS_ALL', name: 'AR_CASH_RECEIPTS_ALL', jpName: 'AR入金（テナント賃貸振込）', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 540, w: 294, h: 54, pk: 'CASH_RECEIPT_ID', fks: ['PAY_FROM_CUSTOMER'],
    desc: '転貸テナントからの銀行振込入金 220,000円を記録。',
    keyCols: [
      { name: 'CASH_RECEIPT_ID', type: 'NUMBER(18)', role: 'PK', desc: '50001' },
      { name: 'RECEIPT_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'RCPT-LA-001' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '220,000' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'APP' }
    ]
  },
  AR_CASH_RECEIPT_HISTORY_ALL: {
    id: 'AR_CASH_RECEIPT_HISTORY_ALL', name: 'AR_CASH_RECEIPT_HISTORY_ALL', jpName: 'AR入金履歴 (CLEARED)', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 636, w: 294, h: 54, pk: 'CASH_RECEIPT_HISTORY_ID', fks: ['CASH_RECEIPT_ID'],
    desc: '着金銀行口座消込ステータス(CLEARED)の履歴。',
    keyCols: [
      { name: 'CASH_RECEIPT_HISTORY_ID', type: 'NUMBER(18)', role: 'PK', desc: '51001' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'CLEARED' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '220,000' }
    ]
  },
  AR_RECEIVABLE_APPLICATIONS_ALL: {
    id: 'AR_RECEIVABLE_APPLICATIONS_ALL', name: 'AR_RECEIVABLE_APPLICATIONS_ALL', jpName: 'AR入金充当消込明細', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 732, w: 294, h: 54, pk: 'RECEIVABLE_APPLICATION_ID', fks: ['CASH_RECEIPT_ID', 'APPLIED_CUSTOMER_TRX_ID'],
    desc: '入金額220,000円を請求書 AR-LA-2026-001 へ充当して売掛金を消込。',
    keyCols: [
      { name: 'RECEIVABLE_APPLICATION_ID', type: 'NUMBER(18)', role: 'PK', desc: '52001' },
      { name: 'AMOUNT_APPLIED', type: 'NUMBER', role: '', desc: '220,000' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'APP' }
    ]
  },
  AR_DISTRIBUTIONS_ALL: {
    id: 'AR_DISTRIBUTIONS_ALL', name: 'AR_DISTRIBUTIONS_ALL', jpName: 'AR入金配分明細', domain: 'LA_AP_AR_TXNS',
    x: 958, y: 828, w: 294, h: 54, pk: 'LINE_ID', fks: ['SOURCE_ID', 'CODE_COMBINATION_ID'],
    desc: '入金時の普通預金(1001)借方と売掛金(1110)貸方配分を生成。',
    keyCols: [
      { name: 'LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: '71001 / 71002' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '1001 / 1110' },
      { name: 'AMOUNT_DR / CR', type: 'NUMBER', role: '', desc: '220,000' }
    ]
  },

  // === E. SLA_XLA (5) ===
  XLA_TRANSACTION_ENTITIES: {
    id: 'XLA_TRANSACTION_ENTITIES', name: 'XLA_TRANSACTION_ENTITIES', jpName: 'SLA 取引エンティティ (LA 10522 / AP / AR)', domain: 'SLA_XLA',
    x: 1300, y: 60, w: 488, h: 56, pk: 'ENTITY_ID', fks: ['APPLICATION_ID', 'LEDGER_ID'],
    desc: 'LA(10522: LEASE_TRANSACTION)・AP(200)・AR(222) の実体キーを統合保持するSLA親表。',
    keyCols: [
      { name: 'ENTITY_ID', type: 'NUMBER(15)', role: 'PK', desc: 'エンティティID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(15)', role: 'FK', desc: '10522(LA) / 200(AP) / 222(AR)' },
      { name: 'ENTITY_CODE', type: 'VARCHAR2(30)', role: '', desc: 'LEASE_TRANSACTIONS / AP_INVOICES / TRANSACTIONS' }
    ]
  },
  XLA_EVENTS: {
    id: 'XLA_EVENTS', name: 'XLA_EVENTS', jpName: 'SLA 会計イベント', domain: 'SLA_XLA',
    x: 1300, y: 136, w: 488, h: 56, pk: 'EVENT_ID', fks: ['ENTITY_ID'],
    desc: 'BOOKING / PAYMENT / ACCRUAL / REVISION / TERMINATION / REVENUE_ACCRUAL / AP / AR の会計イベントを管理。',
    keyCols: [
      { name: 'EVENT_ID', type: 'NUMBER(15)', role: 'PK', desc: 'イベントID' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'LEASE_BOOKING / REVISION / TERMINATION 等' },
      { name: 'EVENT_STATUS_CODE', type: 'VARCHAR2(1)', role: '', desc: 'U → P' }
    ]
  },
  XLA_AE_HEADERS: {
    id: 'XLA_AE_HEADERS', name: 'XLA_AE_HEADERS', jpName: 'SLA 仕訳ヘッダ', domain: 'SLA_XLA',
    x: 1300, y: 212, w: 488, h: 56, pk: 'AE_HEADER_ID', fks: ['EVENT_ID', 'LEDGER_ID'],
    desc: 'Create Accountingにより生成されたSLA伝票ヘッダ。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: 'ヘッダID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(15)', role: '', desc: '10522 / 200 / 222' },
      { name: 'JE_CATEGORY_NAME', type: 'VARCHAR2(30)', role: '', desc: 'Lease Accounting / Payables / Receivables' },
      { name: 'GL_TRANSFER_STATUS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'N → Y' }
    ]
  },
  XLA_AE_LINES: {
    id: 'XLA_AE_LINES', name: 'XLA_AE_LINES', jpName: 'SLA 仕訳明細', domain: 'SLA_XLA',
    x: 1300, y: 288, w: 488, h: 56, pk: 'AE_HEADER_ID, AE_LINE_NUM', fks: ['AE_HEADER_ID', 'CODE_COMBINATION_ID'],
    desc: 'AFF 9セグメントCCIDへの正確な貸借仕訳行。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: 'SLAヘッダID' },
      { name: 'AE_LINE_NUM', type: 'NUMBER(15)', role: 'PK', desc: '行番号' },
      { name: 'ACCOUNTING_CLASS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'ROU_ASSET / LEASE_LIABILITY / AMORT / INTEREST 等' },
      { name: 'ACCOUNTED_DR / CR', type: 'NUMBER', role: '', desc: '借方 / 貸方金額(JPY)' }
    ]
  },
  XLA_DISTRIBUTION_LINKS: {
    id: 'XLA_DISTRIBUTION_LINKS', name: 'XLA_DISTRIBUTION_LINKS', jpName: 'SLA 監査トレースリンク', domain: 'SLA_XLA',
    x: 1300, y: 364, w: 488, h: 56, pk: 'AE_HEADER_ID, AE_LINE_NUM, REF_AE_HEADER_ID', fks: ['AE_HEADER_ID', 'SOURCE_DISTRIBUTION_ID_NUM_1'],
    desc: 'SLA仕訳明細をFLA_ACCOUNTING_LINES・AP配分・AR配分へ直接紐付ける監査リンク表。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: 'SLAヘッダID' },
      { name: 'SOURCE_DISTRIBUTION_TYPE', type: 'VARCHAR2(30)', role: '', desc: 'FLA_ACCOUNTING_LINES / AP_INV_DIST / AR_DIST' },
      { name: 'SOURCE_DISTRIBUTION_ID_NUM_1', type: 'NUMBER(15)', role: 'FK', desc: '元明細ID' }
    ]
  },

  // === F. GL_LEDGER (6) ===
  GL_INTERFACE: {
    id: 'GL_INTERFACE', name: 'GL_INTERFACE', jpName: 'GL インタフェース一時表', domain: 'GL_LEDGER',
    x: 1300, y: 524, w: 488, h: 56, pk: 'GROUP_ID', fks: ['LEDGER_ID', 'CODE_COMBINATION_ID'],
    desc: 'SLAからGL取り込みのための自動転送バッファ。',
    keyCols: [
      { name: 'GROUP_ID', type: 'NUMBER(15)', role: 'PK', desc: 'グループID' },
      { name: 'USER_JE_SOURCE_NAME', type: 'VARCHAR2(25)', role: '', desc: 'Lease Accounting / Payables / Receivables' }
    ]
  },
  GL_JE_BATCHES: {
    id: 'GL_JE_BATCHES', name: 'GL_JE_BATCHES', jpName: 'GL 仕訳バッチ', domain: 'GL_LEDGER',
    x: 1300, y: 606, w: 488, h: 56, pk: 'JE_BATCH_ID', fks: [],
    desc: 'GL転記を実行するバッチ（STATUS=P）。',
    keyCols: [
      { name: 'JE_BATCH_ID', type: 'NUMBER(15)', role: 'PK', desc: 'バッチID' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: '', desc: 'P（転記済）' },
      { name: 'RUNNING_TOTAL_ACCOUNTED_DR', type: 'NUMBER', role: '', desc: '借方累計' }
    ]
  },
  GL_JE_HEADERS: {
    id: 'GL_JE_HEADERS', name: 'GL_JE_HEADERS', jpName: 'GL 仕訳ヘッダ', domain: 'GL_LEDGER',
    x: 1300, y: 688, w: 488, h: 56, pk: 'JE_HEADER_ID', fks: ['JE_BATCH_ID', 'LEDGER_ID'],
    desc: 'Lease Accounting / Payables / Receivables別の仕訳ヘッダ。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: 'ヘッダID' },
      { name: 'JE_SOURCE', type: 'VARCHAR2(25)', role: '', desc: 'Lease Accounting 等' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: '', desc: 'P' }
    ]
  },
  GL_JE_LINES: {
    id: 'GL_JE_LINES', name: 'GL_JE_LINES', jpName: 'GL 仕訳明細', domain: 'GL_LEDGER',
    x: 1300, y: 770, w: 488, h: 56, pk: 'JE_HEADER_ID, JE_LINE_NUM', fks: ['JE_HEADER_ID', 'CODE_COMBINATION_ID'],
    desc: '9セグメントCCIDごとのGL仕訳明細。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: 'ヘッダID' },
      { name: 'JE_LINE_NUM', type: 'NUMBER(15)', role: 'PK', desc: '行番号' },
      { name: 'ACCOUNTED_DR / CR', type: 'NUMBER', role: '', desc: '借方 / 貸方' }
    ]
  },
  GL_IMPORT_REFERENCES: {
    id: 'GL_IMPORT_REFERENCES', name: 'GL_IMPORT_REFERENCES', jpName: 'GL-SLA ドリルダウン参照', domain: 'GL_LEDGER',
    x: 1300, y: 852, w: 488, h: 56, pk: 'JE_HEADER_ID, JE_LINE_NUM, GL_SL_LINK_ID', fks: ['JE_HEADER_ID'],
    desc: 'GL残高からLA使用権資産・リース負債明細、AP請求、AR請求へドリルダウンするための結合表。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: 'ヘッダID' },
      { name: 'GL_SL_LINK_ID', type: 'NUMBER(15)', role: 'FK', desc: 'SLAリンクID' }
    ]
  },
  GL_BALANCES: {
    id: 'GL_BALANCES', name: 'GL_BALANCES', jpName: 'GL 勘定残高 (期首・当期・期末)', domain: 'GL_LEDGER',
    x: 1300, y: 934, w: 488, h: 56, pk: 'LEDGER_ID, CODE_COMBINATION_ID, PERIOD_NAME', fks: ['LEDGER_ID', 'CODE_COMBINATION_ID'],
    desc: '転記後の試算表残高。AP/ARクリアリング・買掛金・売掛金や解約後のROU/負債が0となることを検証。',
    keyCols: [
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '9軸CCID' },
      { name: 'BEGIN_BALANCE_DR / CR', type: 'NUMBER', role: '', desc: '期首残高' },
      { name: 'PERIOD_NET_DR / CR', type: 'NUMBER', role: '', desc: '当期増減' }
    ]
  }
};

const RELATIONS = [
  // Org & Master
  { id: 'r1', from: 'XLE_ENTITY_PROFILES', to: 'FUN_ALL_BUSINESS_UNITS_V', label: 'LEGAL_ENTITY_ID', cases: ['ALL'] },
  { id: 'r2', from: 'FUN_ALL_BUSINESS_UNITS_V', to: 'GL_LEDGERS', label: 'PRIMARY_LEDGER_ID', cases: ['ALL'] },
  { id: 'r3', from: 'GL_LEDGERS', to: 'GL_PERIOD_STATUSES', label: 'LEDGER_ID', cases: ['ALL'] },
  { id: 'r4', from: 'FND_KF_STR_INSTANCES_B', to: 'GL_CODE_COMBINATIONS', label: 'STRUCTURE_INSTANCE_ID', cases: ['ALL'] },
  { id: 'r5', from: 'HZ_PARTIES', to: 'HZ_PARTY_SITES', label: 'PARTY_ID', cases: ['ALL'] },
  { id: 'r6', from: 'HZ_PARTIES', to: 'POZ_SUPPLIERS', label: 'PARTY_ID', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r7', from: 'POZ_SUPPLIERS', to: 'POZ_SUPPLIER_SITES_ALL_M', label: 'VENDOR_ID', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r8', from: 'HZ_PARTIES', to: 'HZ_CUST_ACCOUNTS', label: 'PARTY_ID', cases: ['LA_REVENUE_AR'] },
  { id: 'r9', from: 'HZ_CUST_ACCOUNTS', to: 'HZ_CUST_ACCT_SITES_ALL', label: 'CUST_ACCOUNT_ID', cases: ['LA_REVENUE_AR'] },
  { id: 'r10', from: 'CE_BANK_ACCOUNTS', to: 'CE_BANK_ACCT_USES_ALL', label: 'BANK_ACCOUNT_ID', cases: ['ALL'] },
  // LA Setup -> Contract -> Schedule
  { id: 'r11', from: 'FUN_ALL_BUSINESS_UNITS_V', to: 'FLA_SYSTEM_OPTIONS_ALL', label: 'ORG_ID', cases: ['ALL'] },
  { id: 'r12', from: 'FLA_DISCOUNT_INDEXES_ALL', to: 'FLA_DISCOUNT_INDEX_RATES_F', label: 'INDEX_ID', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r13', from: 'FLA_SYSTEM_OPTIONS_ALL', to: 'FLA_LEASES_ALL', label: 'ORG_ID / REGIME', cases: ['ALL'] },
  { id: 'r14', from: 'FLA_PAYMENT_TEMPLATES_ALL', to: 'FLA_LEASE_PAYMENT_HEADERS', label: 'TEMPLATE適用', cases: ['ALL'] },
  { id: 'r15', from: 'FLA_LEASES_ALL', to: 'FLA_LEASE_DETAILS', label: 'LEASE_ID (VER)', cases: ['ALL'] },
  { id: 'r16', from: 'FLA_LEASE_DETAILS', to: 'FLA_LEASE_ASSETS', label: 'LEASE_DETAIL_ID', cases: ['ALL'] },
  { id: 'r17', from: 'FLA_LEASE_DETAILS', to: 'FLA_LEASE_PAYMENT_HEADERS', label: 'PAYMENT定義', cases: ['ALL'] },
  { id: 'r18', from: 'FLA_LEASE_PAYMENT_HEADERS', to: 'FLA_LEASE_PAYMENT_LINES', label: 'PAYMENT_HEADER_ID', cases: ['ALL'] },
  { id: 'r19', from: 'FLA_LEASE_PAYMENT_HEADERS', to: 'FLA_LEASE_PAYMENT_ACCOUNTS', label: 'CCID割当', cases: ['ALL'] },
  { id: 'r20', from: 'GL_CODE_COMBINATIONS', to: 'FLA_LEASE_PAYMENT_ACCOUNTS', label: 'ACCOUNT_CCID', cases: ['ALL'] },
  { id: 'r21', from: 'FLA_DISCOUNT_INDEX_RATES_F', to: 'FLA_SCHEDULE_HEADERS', label: 'RATE_VALUE(2.5%/3%)', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION'] },
  { id: 'r22', from: 'FLA_LEASE_PAYMENT_LINES', to: 'FLA_SCHEDULE_HEADERS', label: 'PV / 償却スケジュール生成', cases: ['ALL'] },
  { id: 'r23', from: 'FLA_SCHEDULE_HEADERS', to: 'FLA_LIABILITY_SCHEDULES', label: 'SCHEDULE_HEADER_ID', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r24', from: 'FLA_SCHEDULE_HEADERS', to: 'FLA_ACCRUAL_SCHEDULES', label: 'SCHEDULE_HEADER_ID', cases: ['ALL'] },
  { id: 'r25', from: 'FLA_LEASE_PAYMENT_LINES', to: 'FLA_PAYMENT_ITEMS', label: 'DUE_DATE別明細', cases: ['ALL'] },
  { id: 'r26', from: 'FLA_ACCRUAL_SCHEDULES', to: 'FLA_LEASE_BALANCES_ALL', label: '期間別残高集計', cases: ['ALL'] },
  // LA -> Accounting & AP/AR bridge
  { id: 'r30', from: 'FLA_LEASES_ALL', to: 'FLA_ACCOUNTING_HEADERS_ALL', label: 'BOOK/REV/TERM/ACCR', cases: ['ALL'] },
  { id: 'r31', from: 'FLA_ACCOUNTING_HEADERS_ALL', to: 'FLA_ACCOUNTING_LINES', label: 'TRANSACTION_ID', cases: ['ALL'] },
  { id: 'r32', from: 'FLA_PAYMENT_ITEMS', to: 'AP_INVOICES_INTERFACE', label: 'AP連携(INTERFACED)', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r33', from: 'AP_INVOICES_INTERFACE', to: 'AP_INVOICES_ALL', label: 'Import Payables', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r34', from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_LINES_ALL', label: 'INVOICE_ID', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r35', from: 'ZX_RATES_B', to: 'ZX_LINES', label: '10%税算出', cases: ['ALL'] },
  { id: 'r36', from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: '2390クリアリング', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r37', from: 'AP_INVOICES_ALL', to: 'AP_PAYMENT_SCHEDULES_ALL', label: 'INVOICE_ID', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r38', from: 'AP_PAYMENT_SCHEDULES_ALL', to: 'AP_CHECKS_ALL', label: 'CLEARED支払', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r39', from: 'AP_CHECKS_ALL', to: 'AP_INVOICE_PAYMENTS_ALL', label: 'CHECK_ID', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r40', from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: 'PAYMENT CLEARING', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  // AR Revenue Lease bridge
  { id: 'r45', from: 'FLA_PAYMENT_ITEMS', to: 'RA_INTERFACE_LINES_ALL', label: 'AutoInvoice連携', cases: ['LA_REVENUE_AR'] },
  { id: 'r46', from: 'RA_INTERFACE_LINES_ALL', to: 'RA_CUSTOMER_TRX_ALL', label: 'AR請求書生成', cases: ['LA_REVENUE_AR'] },
  { id: 'r47', from: 'RA_CUSTOMER_TRX_ALL', to: 'RA_CUSTOMER_TRX_LINES_ALL', label: 'CUSTOMER_TRX_ID', cases: ['LA_REVENUE_AR'] },
  { id: 'r48', from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', label: '2490 / 2501', cases: ['LA_REVENUE_AR'] },
  { id: 'r49', from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_PAYMENT_SCHEDULES_ALL', label: 'OP → CL', cases: ['LA_REVENUE_AR'] },
  { id: 'r50', from: 'AR_PAYMENT_SCHEDULES_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: '充当消込', cases: ['LA_REVENUE_AR'] },
  { id: 'r51', from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_CASH_RECEIPT_HISTORY_ALL', label: 'CLEARED', cases: ['LA_REVENUE_AR'] },
  { id: 'r52', from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: 'CASH_RECEIPT_ID', cases: ['LA_REVENUE_AR'] },
  { id: 'r53', from: 'AR_RECEIVABLE_APPLICATIONS_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: '1001 / 1110', cases: ['LA_REVENUE_AR'] },
  // SLA -> GL
  { id: 'r60', from: 'FLA_ACCOUNTING_LINES', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=10522 (LA)', cases: ['ALL'] },
  { id: 'r61', from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=200 (AP請求)', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r62', from: 'AP_PAYMENT_HISTORY_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=200 (AP支払)', cases: ['LA_BOOK_AP_ACCRUAL', 'LA_REVISION', 'LA_TERMINATION'] },
  { id: 'r63', from: 'AR_DISTRIBUTIONS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=222 (AR)', cases: ['LA_REVENUE_AR'] },
  { id: 'r64', from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', label: 'ENTITY_ID', cases: ['ALL'] },
  { id: 'r65', from: 'XLA_EVENTS', to: 'XLA_AE_HEADERS', label: 'EVENT_ID', cases: ['ALL'] },
  { id: 'r66', from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'AE_HEADER_ID', cases: ['ALL'] },
  { id: 'r67', from: 'XLA_AE_LINES', to: 'XLA_DISTRIBUTION_LINKS', label: '監査リンク', cases: ['ALL'] },
  { id: 'r68', from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'GL転送', cases: ['ALL'] },
  { id: 'r69', from: 'GL_INTERFACE', to: 'GL_JE_BATCHES', label: 'Journal Import', cases: ['ALL'] },
  { id: 'r70', from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', label: 'JE_BATCH_ID', cases: ['ALL'] },
  { id: 'r71', from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', label: 'JE_HEADER_ID', cases: ['ALL'] },
  { id: 'r72', from: 'GL_JE_LINES', to: 'GL_IMPORT_REFERENCES', label: 'GL_SL_LINK_ID', cases: ['ALL'] },
  { id: 'r73', from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '転記(P) 残高更新', cases: ['ALL'] }
];

function buildCommonMasters() {
  return {
    XLE_ENTITY_PROFILES: [
      { LEGAL_ENTITY_ID: 1001, NAME: '株式会社テスト商事', LEGAL_ENTITY_IDENTIFIER: 'T1010001123456', COUNTRY: 'JP' }
    ],
    FUN_ALL_BUSINESS_UNITS_V: [
      { BU_ID: 300001, BU_NAME: 'KGJPN_東京本社BU', LEGAL_ENTITY_ID: 1001, PRIMARY_LEDGER_ID: 2001 }
    ],
    GL_LEDGERS: [
      { LEDGER_ID: 2001, NAME: 'JP_PRIMARY_LEDGER', CURRENCY_CODE: 'JPY', CHART_OF_ACCOUNTS_ID: 50001 }
    ],
    GL_PERIOD_STATUSES: [
      { APPLICATION_ID: 200, LEDGER_ID: 2001, PERIOD_NAME: '2026-04', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 222, LEDGER_ID: 2001, PERIOD_NAME: '2026-04', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 101, LEDGER_ID: 2001, PERIOD_NAME: '2026-04', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 200, LEDGER_ID: 2001, PERIOD_NAME: '2027-04', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 101, LEDGER_ID: 2001, PERIOD_NAME: '2027-04', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 200, LEDGER_ID: 2001, PERIOD_NAME: '2027-10', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 101, LEDGER_ID: 2001, PERIOD_NAME: '2027-10', CLOSING_STATUS: 'O' }
    ],
    FND_KF_STR_INSTANCES_B: [
      { STRUCTURE_INSTANCE_ID: 50001, STRUCTURE_INSTANCE_CODE: 'JP_9SEG_AFF', APPLICATION_ID: 101, KEY_FLEXFIELD_CODE: 'GL#' }
    ],
    GL_CODE_COMBINATIONS: Object.values(CCID_LIST).map(c => ({
      CODE_COMBINATION_ID: c.ccid, SEGMENT_CONCAT: c.concat, ACCOUNT_DESC: c.name, ACCOUNT_TYPE: c.type
    })),
    HZ_PARTIES: [
      { PARTY_ID: 4001, PARTY_NAME: '三井不動産ビルディング株式会社（貸主）', PARTY_TYPE: 'ORGANIZATION' },
      { PARTY_ID: 4002, PARTY_NAME: '株式会社テックイノベーション（転貸テナント）', PARTY_TYPE: 'ORGANIZATION' }
    ],
    HZ_PARTY_SITES: [
      { PARTY_SITE_ID: 4201, PARTY_ID: 4001, PARTY_SITE_NUMBER: 'PS-LA-SUP-01' },
      { PARTY_SITE_ID: 4202, PARTY_ID: 4002, PARTY_SITE_NUMBER: 'PS-LA-CUS-01' }
    ],
    POZ_SUPPLIERS: [
      { VENDOR_ID: 5001, PARTY_ID: 4001, SEGMENT1: 'SUP-LA-1001', VENDOR_NAME: '三井不動産ビルディング株式会社' }
    ],
    POZ_SUPPLIER_SITES_ALL_M: [
      { VENDOR_SITE_ID: 5101, VENDOR_ID: 5001, PARTY_SITE_ID: 4201, VENDOR_SITE_CODE: 'TOKYO-LEASING' }
    ],
    HZ_CUST_ACCOUNTS: [
      { CUST_ACCOUNT_ID: 6001, PARTY_ID: 4002, ACCOUNT_NUMBER: 'CUST-LA-2001', ACCOUNT_NAME: '株式会社テックイノベーション' }
    ],
    HZ_CUST_ACCT_SITES_ALL: [
      { CUST_ACCT_SITE_ID: 6201, CUST_ACCOUNT_ID: 6001, PARTY_SITE_ID: 4202, BILL_TO_SITE_USE_ID: 6301 }
    ],
    RA_CUST_TRX_TYPES_ALL: [
      { CUST_TRX_TYPE_SEQ_ID: 301, NAME: 'JP_LEASE_REV_INV', TYPE: 'INV' }
    ],
    AP_TERMS_B: [
      { TERM_ID: 10, NAME: 'IMMEDIATE', ENABLED_FLAG: 'Y' }
    ],
    ZX_RATES_B: [
      { TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', PERCENTAGE_RATE: 10 }
    ],
    CE_BANK_ACCOUNTS: [
      { BANK_ACCOUNT_ID: 8001, BANK_ACCOUNT_NAME: 'みずほ銀行 本店 普通', ASSET_CODE_COMBINATION_ID: 1001 }
    ],
    CE_BANK_ACCT_USES_ALL: [
      { BANK_ACCT_USE_ID: 7001, BANK_ACCOUNT_ID: 8001, ORG_ID: 300001 }
    ],
    FLA_SYSTEM_OPTIONS_ALL: [
      {
        SYSTEM_OPTION_ID: 1, ORG_ID: 300001, LEDGER_ID: 2001, PRIMARY_REGIME_CODE: 'IFRS16',
        SECONDARY_REGIME_CODE: 'ASC842', INTEREST_METHOD_CODE: 'DAILY COMPOUND',
        AMORTIZATION_FREQUENCY_CODE: 'PERIODICALLY', AUTO_LEASE_NUMBER_FLAG: 'Y'
      }
    ],
    FLA_DISCOUNT_INDEXES_ALL: [
      { INDEX_ID: 101, NAME: 'JP_IBR_INDEX', ORG_ID: 300001, START_DATE: '2026-01-01', DESCRIPTION: '国内不動産リース追加借入利子率' }
    ],
    FLA_DISCOUNT_INDEX_RATES_F: [
      { INDEX_LINE_ID: 1001, INDEX_ID: 101, EFFECTIVE_START_DATE: '2026-04-01', EFFECTIVE_END_DATE: '2027-03-31', RATE_VALUE: 2.50, FINAL_FLAG: 'Y' },
      { INDEX_LINE_ID: 1002, INDEX_ID: 101, EFFECTIVE_START_DATE: '2027-04-01', EFFECTIVE_END_DATE: '2030-03-31', RATE_VALUE: 3.00, FINAL_FLAG: 'Y' }
    ],
    FLA_PAYMENT_TEMPLATES_ALL: [
      { PAYMENT_TEMPLATE_ID: 201, NAME: 'OFFICE_RENT_EXP', ORG_ID: 300001, PAYMENT_TYPE_CODE: 'BASE_RENT', PAYMENT_PURPOSE_CODE: 'LEASE_PAYMENT', ROU_ASSET_FLAG: 'Y', LIABILITY_FLAG: 'Y', PAYMENT_FREQUENCY_CODE: 'MONTHLY', VENDOR_ID: 5001 },
      { PAYMENT_TEMPLATE_ID: 202, NAME: 'SUBLEASE_RENT_REV', ORG_ID: 300001, PAYMENT_TYPE_CODE: 'BASE_RENT', PAYMENT_PURPOSE_CODE: 'SUBLEASE_REVENUE', ROU_ASSET_FLAG: 'N', LIABILITY_FLAG: 'N', PAYMENT_FREQUENCY_CODE: 'MONTHLY', VENDOR_ID: null }
    ]
  };
}

// === 4つのリース会計ケース ===
const CASES = {
  LA_BOOK_AP_ACCRUAL: {
    id: 'LA_BOOK_AP_ACCRUAL',
    shortTitle: '1. 借手リース登録・AP連携・償却',
    title: 'ケース1：借手リース新規登録(ROU/負債PV 240万) → AP賃料支払(115,500円) → 月次償却＆利息',
    subtitle: 'リース契約LA-2026-001(24ヶ月/月額105,000円)の現在価値240万円をROU資産・リース負債へ登録し、初月AP請求支払・ROU償却10万円・実効利息5千円をGLまで連携します。',
    badgeColor: '#0e7490',
    steps: [
      {
        id: 'S0', title: '1. LAシステム設定・割引率・貸主準備', badge: 'MASTER_PREP', date: '2026-04-01',
        desc: '【業務プロセス①】会計基準(IFRS16)・利息計算方式(DAILY COMPOUND)・割引率インデックス(JP_IBR_INDEX 2.50%)・支払テンプレート・貸主サプライヤ(三井不動産ビルディング)・AFF 9セグメントCCIDを確認。',
        focusTables: ['FLA_SYSTEM_OPTIONS_ALL', 'FLA_DISCOUNT_INDEXES_ALL', 'FLA_DISCOUNT_INDEX_RATES_F', 'FLA_PAYMENT_TEMPLATES_ALL', 'POZ_SUPPLIERS', 'GL_CODE_COMBINATIONS'],
        activeRelIds: ['r1', 'r2', 'r6', 'r7', 'r11', 'r12', 'r13'],
        flows: [{ from: 'FLA_DISCOUNT_INDEXES_ALL', to: 'FLA_DISCOUNT_INDEX_RATES_F', label: '割引率 2.50%' }]
      },
      {
        id: 'S1', title: '2. リース契約ドラフト登録 (DRAFT / 条件入力)', badge: 'LEASE_DRAFT', date: '2026-04-01',
        desc: '【業務プロセス②の前段】新規契約LA-2026-001(EXPENSE / PROPERTY / DRAFT)を作成。リース資産(本社オフィス9F)・賃料支払条件(月額105,000円 × 24ヶ月)・使用勘定(ROU 1710 / 負債 2310 / クリアリング 2390 / 償却 5401 / 利息 6301)を定義。',
        focusTables: ['FLA_LEASES_ALL', 'FLA_LEASE_DETAILS', 'FLA_LEASE_ASSETS', 'FLA_LEASE_PAYMENT_HEADERS', 'FLA_LEASE_PAYMENT_LINES', 'FLA_LEASE_PAYMENT_ACCOUNTS'],
        activeRelIds: ['r14', 'r15', 'r16', 'r17', 'r18', 'r19', 'r20'],
        flows: [{ from: 'FLA_LEASES_ALL', to: 'FLA_LEASE_PAYMENT_LINES', label: '月額105,000 × 24月' }]
      },
      {
        id: 'S2', title: '3. スケジュール計算 ＆ 有効化 (BOOKING PV 240万)', badge: 'LEASE_BOOKING', date: '2026-04-01',
        desc: '【業務プロセス②】契約を有効化(ACTIVE)して現在価値(PV=2,400,000円)の負債・償却スケジュールを確定。FLA_ACCOUNTING_HEADERS_ALL/LINESに「LEASE_BOOKING」(Dr ROU資産1710 / Cr リース負債2310 2,400,000円)を生成。',
        focusTables: ['FLA_LEASES_ALL', 'FLA_SCHEDULE_HEADERS', 'FLA_LIABILITY_SCHEDULES', 'FLA_ACCRUAL_SCHEDULES', 'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES', 'FLA_LEASE_BALANCES_ALL'],
        activeRelIds: ['r21', 'r22', 'r23', 'r24', 'r30', 'r31'],
        flows: [
          { from: 'FLA_SCHEDULE_HEADERS', to: 'FLA_LIABILITY_SCHEDULES', label: 'PV = 2,400,000' },
          { from: 'FLA_ACCOUNTING_HEADERS_ALL', to: 'FLA_ACCOUNTING_LINES', label: 'Dr1710 / Cr2310' }
        ]
      },
      {
        id: 'S3', title: '4. 支払承認 ＆ AP請求書インポート (115,500円)', badge: 'LA_TO_AP_INV', date: '2026-04-05',
        desc: '【業務プロセス③】初月賃料105,000円をFLA_PAYMENT_ITEMS(APPROVED→INTERFACED)で承認連携。LA側でLEASE_PAYMENT(Dr負債2310/Crクリアリング2390 105,000円)を起票し、AP_INVOICES_INTERFACE経由でAP請求(税込115,500円)を検証完了。',
        focusTables: ['FLA_PAYMENT_ITEMS', 'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES', 'AP_INVOICES_INTERFACE', 'AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_PAYMENT_SCHEDULES_ALL'],
        activeRelIds: ['r25', 'r32', 'r33', 'r34', 'r35', 'r36', 'r37'],
        flows: [
          { from: 'FLA_PAYMENT_ITEMS', to: 'AP_INVOICES_INTERFACE', label: 'AP連携 105,000' },
          { from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: '2390+税10%=115,500' }
        ]
      },
      {
        id: 'S4', title: '5. APリース賃料 銀行振込決済 (CLEARED)', badge: 'AP_PAYMENT', date: '2026-04-10',
        desc: '【業務プロセス③の完結】三井不動産ビルディングへ税込115,500円を振込決済(AP_CHECKS_ALL=CLEARED)。AP支払履歴に「PAYMENT CLEARING」(Dr 買掛金2101 / Cr 普通預金1001)を記録。',
        focusTables: ['AP_CHECKS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_INVOICES_ALL', 'AP_PAYMENT_SCHEDULES_ALL'],
        activeRelIds: ['r38', 'r39', 'r40'],
        flows: [{ from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: '115,500 CLEARED' }]
      },
      {
        id: 'S5', title: '6. 月次決算：ROU償却(10万) ＆ 実効利息(5千円)', badge: 'LA_ACCRUAL', date: '2026-04-30',
        desc: '【業務プロセス④】月末に見越会計(LEASE_ACCRUAL)を実行。ROU定額償却100,000円(Dr 5401 / Cr 1719)＋実効利息5,000円(Dr 6301 / Cr 2310)を計上し、FLA_LEASE_BALANCES_ALLに期末ROU純額230万・負債230万を更新。',
        focusTables: ['FLA_ACCRUAL_SCHEDULES', 'FLA_LIABILITY_SCHEDULES', 'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES', 'FLA_LEASE_BALANCES_ALL'],
        activeRelIds: ['r24', 'r26', 'r30', 'r31'],
        flows: [
          { from: 'FLA_ACCRUAL_SCHEDULES', to: 'FLA_LEASE_BALANCES_ALL', label: '償却10万・利息5千' },
          { from: 'FLA_ACCOUNTING_HEADERS_ALL', to: 'FLA_ACCOUNTING_LINES', label: 'LEASE_ACCRUAL' }
        ]
      },
      {
        id: 'S6', title: '7. SLA会計作成 (LA 10522 & AP 200 一括仕訳)', badge: 'CREATE_ACCOUNTING', date: '2026-04-30',
        desc: 'LA 3イベント(BOOKING / PAYMENT / ACCRUAL) と AP 2イベント(請求・支払) 計5イベントをCreate Accountingで仕訳化。総発生額2,841,000円(Dr=Cr)を確定。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r60', 'r61', 'r62', 'r64', 'r65', 'r66', 'r67'],
        flows: [{ from: 'FLA_ACCOUNTING_LINES', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=10522 / 200' }]
      },
      {
        id: 'S7', title: '8. GL転記 ＆ クリアリング0円・残高確認', badge: 'GL_POST', date: '2026-04-30',
        desc: '【業務プロセス完結】GL転記(Status=P)を実行しACCOUNTED_IN_GL_FLAG=Yへ更新。GL_BALANCESでリースAPクリアリング(2390)=0円・買掛金(2101)=0円・ROU純額230万・負債230万を確認。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES', 'FLA_ACCOUNTING_HEADERS_ALL'],
        activeRelIds: ['r68', 'r69', 'r70', 'r71', 'r72', 'r73'],
        flows: [{ from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '2390=0 / 2101=0' }]
      }
    ]
  },

  LA_REVISION: {
    id: 'LA_REVISION',
    shortTitle: '2. リース契約修正・再計算償却',
    title: 'ケース2：契約修正（増床＋12ヶ月延長 / 再測定PV +165万）→ 改定AP支払 → ROU再計算償却',
    subtitle: '稼働1年後(残ROU 120万・残負債 123万)で増床改定(月額13万/残24ヶ月/新割引率3%)を実施。再測定差額+165万円を計上後、改定AP支払143,000円と新償却118,750円/新利息7,200円を処理します。',
    badgeColor: '#2563eb',
    steps: [
      {
        id: 'S0', title: '1. 12ヶ月経過時点 期首契約＆残高確認', badge: 'OPENING_STATE', date: '2027-04-01',
        desc: '契約LA-2026-001(Version 1)の1年経過時点：ROU取得240万・累計償却120万(純額120万)、リース負債123万、GL_BALANCES期首残を確認。',
        focusTables: ['FLA_LEASES_ALL', 'FLA_LEASE_DETAILS', 'FLA_LEASE_BALANCES_ALL', 'GL_BALANCES'],
        activeRelIds: ['r15', 'r26'],
        flows: [{ from: 'FLA_LEASES_ALL', to: 'FLA_LEASE_BALANCES_ALL', label: '期首ROU120万 / 負債123万' }]
      },
      {
        id: 'S1', title: '2. 契約修正Ver2 ＆ 負債再測定 (+1,650,000円)', badge: 'LEASE_REVISION', date: '2027-04-01',
        desc: '【業務プロセス⑤】契約改定Version=2を作成(月額13万円・残期間24ヶ月・新割引率3.00%)。新負債PV 2,880,000円と期首負債1,230,000円の差額+1,650,000円を「LEASE_REVISION」(Dr ROU 1710 / Cr 負債2310)として計上。',
        focusTables: ['FLA_LEASE_DETAILS', 'FLA_LEASE_ASSETS', 'FLA_LEASE_PAYMENT_LINES', 'FLA_SCHEDULE_HEADERS', 'FLA_LIABILITY_SCHEDULES', 'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES'],
        activeRelIds: ['r15', 'r16', 'r18', 'r21', 'r22', 'r23', 'r30', 'r31'],
        flows: [
          { from: 'FLA_LEASE_DETAILS', to: 'FLA_SCHEDULE_HEADERS', label: 'VER=2 / 3.00%再計算' },
          { from: 'FLA_ACCOUNTING_HEADERS_ALL', to: 'FLA_ACCOUNTING_LINES', label: 'REVISION +1,650,000' }
        ]
      },
      {
        id: 'S2', title: '3. 改定後初月賃料 LA→AP請求連携 (143,000円)', badge: 'REVISED_AP_INV', date: '2027-04-05',
        desc: '改定後月額130,000円の支払アイテムを承認・AP連携(LEASE_PAYMENT: Dr負債2310/Cr 2390 13万円)。AP請求「AP-LA-202704」(13万円+税10% 1.3万円=143,000円)を検証完了。',
        focusTables: ['FLA_PAYMENT_ITEMS', 'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES', 'AP_INVOICES_INTERFACE', 'AP_INVOICES_ALL', 'AP_INVOICE_DISTRIBUTIONS_ALL'],
        activeRelIds: ['r25', 'r32', 'r33', 'r34', 'r36'],
        flows: [{ from: 'FLA_PAYMENT_ITEMS', to: 'AP_INVOICES_ALL', label: '改定賃料 143,000円' }]
      },
      {
        id: 'S3', title: '4. 改定後AP賃料支払決済 (CLEARED)', badge: 'AP_PAYMENT', date: '2027-04-10',
        desc: 'APから貸主へ143,000円を銀行振込決済(AP_CHECKS_ALL=CLEARED / AP_PAYMENT_HISTORY_ALL)。',
        focusTables: ['AP_CHECKS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_PAYMENT_SCHEDULES_ALL'],
        activeRelIds: ['r37', 'r38', 'r39', 'r40'],
        flows: [{ from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: '143,000 CLEARED' }]
      },
      {
        id: 'S4', title: '5. 修正後ROU再計算償却(118,750) ＆ 利息(7,200)', badge: 'RECALC_ACCRUAL', date: '2027-04-30',
        desc: '修正後未償却ROU(120万+165万=285万円)を残存24ヶ月で再計算し月額118,750円を償却(Dr 5401 / Cr 1719)。新負債288万の月利3%相当7,200円を利息計上。',
        focusTables: ['FLA_ACCRUAL_SCHEDULES', 'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES', 'FLA_LEASE_BALANCES_ALL'],
        activeRelIds: ['r24', 'r26', 'r30', 'r31'],
        flows: [{ from: 'FLA_ACCRUAL_SCHEDULES', to: 'FLA_LEASE_BALANCES_ALL', label: '償却118,750 / 利息7,200' }]
      },
      {
        id: 'S5', title: '6. SLA会計作成 (再測定＋AP＋再計算償却)', badge: 'CREATE_ACCOUNTING', date: '2027-04-30',
        desc: '契約改定・支払・見越(LA 10522)と改定請求支払(AP 200)の計5イベントを仕訳化。当期借方＝貸方＝2,191,950円。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r60', 'r61', 'r62', 'r64', 'r65', 'r66', 'r67'],
        flows: [{ from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'Dr/Cr 2,191,950' }]
      },
      {
        id: 'S6', title: '7. GL転記 ＆ 修正後残高バランス確認', badge: 'GL_POST', date: '2027-04-30',
        desc: 'GL転記完了。期首＋当期後のGL_BALANCESでROU取得405万・ROU累計-1,318,750・リース負債-2,757,200・2390/2101=0円を確認。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r68', 'r69', 'r70', 'r71', 'r72', 'r73'],
        flows: [{ from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '残高完全一致' }]
      }
    ]
  },

  LA_TERMINATION: {
    id: 'LA_TERMINATION',
    shortTitle: '3. リース中途解約・廃止',
    title: 'ケース3：リース中途解約・廃止（ROU/負債全消去 ＋ 解約違約金AP連携 88,000円 → 解約損 60,000円）',
    subtitle: '18ヶ月経過時(残ROU簿価60万・残負債62万)に解約実行(STATUS=TERMINATED)。ROU原価240万・累計180万・負債62万を全消去し、違約金8万円をAP連携して解約損60,000円を確定します。',
    badgeColor: '#be185d',
    steps: [
      {
        id: 'S0', title: '1. 解約対象リース期首状態確認 (18ヶ月時点)', badge: 'OPENING_STATE', date: '2027-10-01',
        desc: 'ROU資産240万・ROU累計180万(簿価60万)・リース負債62万の状態とGL_BALANCES期首残を確認。',
        focusTables: ['FLA_LEASES_ALL', 'FLA_LEASE_BALANCES_ALL', 'GL_BALANCES'],
        activeRelIds: ['r26'],
        flows: [{ from: 'FLA_LEASES_ALL', to: 'FLA_LEASE_BALANCES_ALL', label: 'ROU簿価60万 / 負債62万' }]
      },
      {
        id: 'S1', title: '2. 中途解約実行 ＆ 違約金アイテム生成 (TERMINATED)', badge: 'TERMINATE_REQ', date: '2027-10-15',
        desc: '【業務プロセス⑥】LA契約画面から中途解約を実行し、FLA_LEASES_ALL.LEASE_STATUS_CODEをACTIVE→TERMINATEDへ更新。契約終了日を2027-10-15へ短縮し解約違約金80,000円(PAY-TERM-02)をFLA_PAYMENT_ITEMSへ登録。',
        focusTables: ['FLA_LEASES_ALL', 'FLA_LEASE_DETAILS', 'FLA_LEASE_PAYMENT_HEADERS', 'FLA_LEASE_PAYMENT_LINES', 'FLA_PAYMENT_ITEMS', 'FLA_SCHEDULE_HEADERS'],
        activeRelIds: ['r15', 'r17', 'r18', 'r22', 'r25'],
        flows: [{ from: 'FLA_LEASES_ALL', to: 'FLA_PAYMENT_ITEMS', label: 'TERMINATED / 違約金8万' }]
      },
      {
        id: 'S2', title: '3. 解約会計生成 (ROU/負債消去 ＆ 解約損6万円)', badge: 'TERM_ACCOUNTING', date: '2027-10-15',
        desc: 'FLA_ACCOUNTING_HEADERS_ALL/LINESに「LEASE_TERMINATION」を起票：Dr 負債62万 + Dr 累計180万 + Dr 解約損(6401) 6万 / Cr ROU 240万 + Cr クリアリング(2390) 8万 ＝ 2,480,000円。',
        focusTables: ['FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES', 'FLA_LEASE_BALANCES_ALL'],
        activeRelIds: ['r26', 'r30', 'r31'],
        flows: [{ from: 'FLA_ACCOUNTING_HEADERS_ALL', to: 'FLA_ACCOUNTING_LINES', label: '解約損60,000 / 残0円化' }]
      },
      {
        id: 'S3', title: '4. 解約違約金のAP請求連携 ＆ 検証 (88,000円)', badge: 'TERM_AP_INV', date: '2027-10-20',
        desc: '違約金80,000円をAP_INVOICES_INTERFACE経由でAP請求書「AP-LA-TERM-003」(8万円+税10% 8千円=88,000円)へインポート＆検証。',
        focusTables: ['FLA_PAYMENT_ITEMS', 'AP_INVOICES_INTERFACE', 'AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES', 'AP_INVOICE_DISTRIBUTIONS_ALL'],
        activeRelIds: ['r32', 'r33', 'r34', 'r35', 'r36'],
        flows: [{ from: 'AP_INVOICES_INTERFACE', to: 'AP_INVOICES_ALL', label: '違約金請求 88,000円' }]
      },
      {
        id: 'S4', title: '5. AP違約金支払決済 ＆ 残高ゼロ確定', badge: 'AP_PAYMENT', date: '2027-10-25',
        desc: '違約金88,000円の銀行振込決済(AP_CHECKS_ALL=CLEARED)を完了し、FLA_LEASE_BALANCES_ALLのROU/負債残高0円を確定。',
        focusTables: ['AP_CHECKS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_PAYMENT_SCHEDULES_ALL', 'FLA_LEASE_BALANCES_ALL'],
        activeRelIds: ['r37', 'r38', 'r39', 'r40'],
        flows: [{ from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: '88,000 CLEARED' }]
      },
      {
        id: 'S5', title: '6. SLA会計作成 (解約仕訳＋違約金AP)', badge: 'CREATE_ACCOUNTING', date: '2027-10-31',
        desc: 'LA中途解約(2,480,000)とAP違約金請求・支払(計176,000)をSLA仕訳化し、総額2,656,000円(Dr=Cr)を確定。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r60', 'r61', 'r62', 'r64', 'r65', 'r66', 'r67'],
        flows: [{ from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'Dr/Cr 2,656,000' }]
      },
      {
        id: 'S6', title: '7. GL転記 ＆ 解約後 全資産・負債0円確認', badge: 'GL_POST', date: '2027-10-31',
        desc: 'GL転記完了。GL_BALANCESでROU(1710)=0円・累計(1719)=0円・リース負債(2310)=0円・クリアリング(2390)=0円・買掛金(2101)=0円・解約損(6401)=+60,000円を確認。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r68', 'r69', 'r70', 'r71', 'r72', 'r73'],
        flows: [{ from: 'GL_JE_LINES', to: 'GL_BALANCES', label: 'ROU/負債 0円完結' }]
      }
    ]
  },

  LA_REVENUE_AR: {
    id: 'LA_REVENUE_AR',
    shortTitle: '4. 収益リース(サブリース)・AR連携',
    title: 'ケース4：収益リース／サブリース（契約登録 → AR AutoInvoice請求 → 入金消込 → 受取リース収益認識）',
    subtitle: '貸主(REVENUE / OPERATING)契約LA-REV-2026-101を登録し、転貸テナント(テックイノベーション)へのAR請求(22万円)・銀行入金消込を経て、受取リース収益20万円を認識します。',
    badgeColor: '#7c3aed',
    steps: [
      {
        id: 'S0', title: '1. 転貸顧客・AR取引タイプ・収益設定確認', badge: 'MASTER_PREP', date: '2026-04-01',
        desc: '収益リース対象顧客(株式会社テックイノベーション CUST-LA-2001)・AR請求タイプ(JP_LEASE_REV_INV)・収益テンプレート・税率10%を確認。',
        focusTables: ['HZ_CUST_ACCOUNTS', 'HZ_CUST_ACCT_SITES_ALL', 'RA_CUST_TRX_TYPES_ALL', 'FLA_PAYMENT_TEMPLATES_ALL', 'CE_BANK_ACCOUNTS'],
        activeRelIds: ['r8', 'r9', 'r10', 'r14'],
        flows: [{ from: 'HZ_CUST_ACCOUNTS', to: 'HZ_CUST_ACCT_SITES_ALL', label: '転貸テナント顧客' }]
      },
      {
        id: 'S1', title: '2. 収益リース契約登録 ＆ スケジュール生成', badge: 'REV_LEASE_ACTIVE', date: '2026-04-01',
        desc: 'LEASE_TYPE_CODE=REVENUE、OPERATING分類で契約LA-REV-2026-101を有効化。BILL_TO_CUSTOMER_ID=6001、月額200,000円、月次定額収益認識スケジュールを生成。',
        focusTables: ['FLA_LEASES_ALL', 'FLA_LEASE_DETAILS', 'FLA_LEASE_ASSETS', 'FLA_LEASE_PAYMENT_HEADERS', 'FLA_LEASE_PAYMENT_LINES', 'FLA_LEASE_PAYMENT_ACCOUNTS', 'FLA_SCHEDULE_HEADERS', 'FLA_ACCRUAL_SCHEDULES'],
        activeRelIds: ['r15', 'r16', 'r17', 'r18', 'r19', 'r22', 'r24'],
        flows: [{ from: 'FLA_LEASES_ALL', to: 'FLA_ACCRUAL_SCHEDULES', label: '収益リース ACTIVE' }]
      },
      {
        id: 'S2', title: '3. 月次請求アイテム → AR AutoInvoice請求書生成', badge: 'LA_TO_AR_INV', date: '2026-04-05',
        desc: '【業務プロセス③(AR連携)】FLA_PAYMENT_ITEMS(20万円)をRA_INTERFACE_LINES_ALL経由でAR請求書「AR-LA-2026-001」へ連携。Dr 売掛金(1110) 220,000 / Cr ARクリアリング(2490) 200,000 + 仮受消費税(2501) 20,000。',
        focusTables: ['FLA_PAYMENT_ITEMS', 'RA_INTERFACE_LINES_ALL', 'RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'ZX_LINES', 'RA_CUST_TRX_LINE_GL_DIST_ALL', 'AR_PAYMENT_SCHEDULES_ALL'],
        activeRelIds: ['r25', 'r45', 'r46', 'r47', 'r48', 'r49', 'r35'],
        flows: [
          { from: 'FLA_PAYMENT_ITEMS', to: 'RA_INTERFACE_LINES_ALL', label: 'AutoInvoice 20万' },
          { from: 'RA_CUSTOMER_TRX_ALL', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', label: '税込 220,000円' }
        ]
      },
      {
        id: 'S3', title: '4. テナントからの振込入金・売掛消込 (CLEARED)', badge: 'AR_RECEIPT', date: '2026-04-25',
        desc: '普通預金へ220,000円着金。AR_CASH_RECEIPTS_ALL(CLEARED)からAR_RECEIVABLE_APPLICATIONS_ALLで請求残高を0(STATUS=CL)へ消込。',
        focusTables: ['AR_CASH_RECEIPTS_ALL', 'AR_CASH_RECEIPT_HISTORY_ALL', 'AR_RECEIVABLE_APPLICATIONS_ALL', 'AR_DISTRIBUTIONS_ALL', 'AR_PAYMENT_SCHEDULES_ALL'],
        activeRelIds: ['r50', 'r51', 'r52', 'r53'],
        flows: [{ from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: '売掛消込 220,000' }]
      },
      {
        id: 'S4', title: '5. 月次受取リース収益認識 (LEASE_REVENUE_ACCRUAL)', badge: 'LA_REV_ACCRUAL', date: '2026-04-30',
        desc: '月末見越プロセスによりFLA_ACCRUAL_SCHEDULES(ACCRUED_FLAG=Y)を計上し、LA会計(Dr ARクリアリング2490 / Cr 受取リース収益4201 200,000円)を生成。',
        focusTables: ['FLA_ACCRUAL_SCHEDULES', 'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES', 'FLA_LEASE_BALANCES_ALL'],
        activeRelIds: ['r24', 'r26', 'r30', 'r31'],
        flows: [{ from: 'FLA_ACCOUNTING_HEADERS_ALL', to: 'FLA_ACCOUNTING_LINES', label: '受取リース収益 20万' }]
      },
      {
        id: 'S5', title: '6. SLA会計作成 (AR 222 & LA 10522)', badge: 'CREATE_ACCOUNTING', date: '2026-04-30',
        desc: 'AR請求・AR入金(APPL=222)とLA収益認識(APPL=10522)の計3イベントをSLA仕訳化(Dr=Cr=640,000円)。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r60', 'r63', 'r64', 'r65', 'r66', 'r67'],
        flows: [{ from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'Dr/Cr 640,000' }]
      },
      {
        id: 'S6', title: '7. GL転記 ＆ ARクリアリング0円・収益確定', badge: 'GL_POST', date: '2026-04-30',
        desc: 'GL転記完了。GL_BALANCESで普通預金+220,000円・売掛金1110=0円・ARクリアリング2490=0円・受取リース収益-200,000円・仮受税-20,000円(ネット0)を確認。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r68', 'r69', 'r70', 'r71', 'r72', 'r73'],
        flows: [{ from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '2490=0 / 収益20万確定' }]
      }
    ]
  }
};

function buildJournalRow(jeHeaderId, jeLineNum, ccid, dr, cr, desc, period, glSlLinkId) {
  const c = CCID_LIST[ccid];
  return {
    JE_HEADER_ID: jeHeaderId, JE_LINE_NUM: jeLineNum, PERIOD_NAME: period,
    CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: c.concat, ACCOUNT_NAME: c.name,
    ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: glSlLinkId
  };
}

function computeBalancesWithOpening(openingEntries, jeLines, periodName) {
  const map = {};
  const ensure = (ccid) => {
    if (!map[ccid]) {
      const c = CCID_LIST[ccid];
      map[ccid] = {
        LEDGER_ID: 2001, CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: c.concat, ACCOUNT_NAME: c.name,
        PERIOD_NAME: periodName, BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0,
        PERIOD_NET_DR: 0, PERIOD_NET_CR: 0, END_BALANCE: 0
      };
    }
    return map[ccid];
  };
  for (const [ccid, bdr, bcr] of openingEntries) {
    const m = ensure(ccid);
    m.BEGIN_BALANCE_DR += bdr;
    m.BEGIN_BALANCE_CR += bcr;
  }
  for (const l of jeLines) {
    const m = ensure(l.CODE_COMBINATION_ID);
    m.PERIOD_NET_DR += l.ACCOUNTED_DR;
    m.PERIOD_NET_CR += l.ACCOUNTED_CR;
  }
  for (const m of Object.values(map)) {
    m.END_BALANCE = (m.BEGIN_BALANCE_DR - m.BEGIN_BALANCE_CR) + (m.PERIOD_NET_DR - m.PERIOD_NET_CR);
  }
  return Object.values(map).sort((a, b) => a.CODE_COMBINATION_ID - b.CODE_COMBINATION_ID);
}

// === ケース別タイムライン状態 ===
function computeStateAtStep(caseId, stepIndex) {
  const state = buildCommonMasters();
  const emptyTables = [
    'FLA_LEASES_ALL', 'FLA_LEASE_DETAILS', 'FLA_LEASE_ASSETS', 'FLA_LEASE_PAYMENT_HEADERS',
    'FLA_LEASE_PAYMENT_LINES', 'FLA_LEASE_PAYMENT_ACCOUNTS', 'FLA_SCHEDULE_HEADERS',
    'FLA_LIABILITY_SCHEDULES', 'FLA_ACCRUAL_SCHEDULES', 'FLA_PAYMENT_ITEMS', 'FLA_LEASE_BALANCES_ALL',
    'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES',
    'AP_INVOICES_INTERFACE', 'AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES',
    'AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_PAYMENT_SCHEDULES_ALL', 'AP_CHECKS_ALL',
    'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL',
    'RA_INTERFACE_LINES_ALL', 'RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL',
    'RA_CUST_TRX_LINE_GL_DIST_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_CASH_RECEIPTS_ALL',
    'AR_CASH_RECEIPT_HISTORY_ALL', 'AR_RECEIVABLE_APPLICATIONS_ALL', 'AR_DISTRIBUTIONS_ALL',
    'XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS',
    'GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'
  ];
  emptyTables.forEach(t => { state[t] = []; });

  // ==========================================================
  // CASE 1: LA_BOOK_AP_ACCRUAL
  // ==========================================================
  if (caseId === 'LA_BOOK_AP_ACCRUAL') {
    if (stepIndex >= 1) {
      const active = stepIndex >= 2;
      state.FLA_LEASES_ALL = [{
        LEASE_ID: 40001, LEASE_NUMBER: 'LA-2026-001', LEASE_NAME: '本社オフィスフロアリース',
        ORG_ID: 300001, LEASE_TYPE_CODE: 'EXPENSE', LEASE_ASSET_TYPE_CODE: 'PROPERTY',
        LEASE_STATUS_CODE: active ? 'ACTIVE' : 'DRAFT', LESSOR_PARTY_ID: 4001
      }];
      state.FLA_LEASE_DETAILS = [{
        LEASE_DETAIL_ID: 41001, LEASE_ID: 40001, VERSION_NUM: 1, LEASE_VERSION_NAME: 'V1_INITIAL',
        PRIMARY_CLASSIFICATION_CODE: 'FINANCE', LEASE_START_DATE: '2026-04-01', LEASE_END_DATE: '2028-03-31'
      }];
      state.FLA_LEASE_ASSETS = [{
        LEASE_ASSET_ID: 42001, LEASE_DETAIL_ID: 41001, LEASE_ID: 40001, ASSET_NUMBER: 'LA-ASSET-001',
        START_DATE: '2026-04-01', END_DATE: '2028-03-31', INSTALL_SITE_ID: 4201, CHANGE_TYPE_CODE: 'ADD', CHANGED_IN_VERSION_NUM: 1
      }];
      state.FLA_LEASE_PAYMENT_HEADERS = [{
        PAYMENT_HEADER_ID: 43001, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001,
        LEASE_ASSET_ID: 42001, PAYMENT_TYPE_CODE: 'BASE_RENT', PAYMENT_FREQUENCY_CODE: 'MONTHLY',
        ROU_ASSET_FLAG: 'Y', LIABILITY_FLAG: 'Y', CURRENCY_CODE: 'JPY', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101
      }];
      state.FLA_LEASE_PAYMENT_LINES = [{
        PAYMENT_LINE_ID: 44001, PAYMENT_HEADER_ID: 43001, PAYMENT_NUMBER: 'PAY-BASE-01',
        LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, PAYMENT_LINE_NUM: 1, ACTUAL_AMOUNT: 105000,
        PAYMENT_LINE_START_DATE: '2026-04-01', PAYMENT_LINE_END_DATE: '2028-03-31', NO_OF_PAYMENTS: 24
      }];
      state.FLA_LEASE_PAYMENT_ACCOUNTS = [
        { PAYMENT_ACCOUNT_ID: 45001, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, LEDGER_ID: 2001, ACCOUNT_CCID: 1710, ACCOUNT_CLASS_CODE: 'ROU_ASSET', CHANGE_TYPE_CODE: 'ADD' },
        { PAYMENT_ACCOUNT_ID: 45002, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, LEDGER_ID: 2001, ACCOUNT_CCID: 2310, ACCOUNT_CLASS_CODE: 'LIABILITY', CHANGE_TYPE_CODE: 'ADD' },
        { PAYMENT_ACCOUNT_ID: 45003, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, LEDGER_ID: 2001, ACCOUNT_CCID: 2390, ACCOUNT_CLASS_CODE: 'AP_CLEARING', CHANGE_TYPE_CODE: 'ADD' },
        { PAYMENT_ACCOUNT_ID: 45004, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, LEDGER_ID: 2001, ACCOUNT_CCID: 5401, ACCOUNT_CLASS_CODE: 'AMORTIZATION', CHANGE_TYPE_CODE: 'ADD' },
        { PAYMENT_ACCOUNT_ID: 45005, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, LEDGER_ID: 2001, ACCOUNT_CCID: 6301, ACCOUNT_CLASS_CODE: 'INTEREST', CHANGE_TYPE_CODE: 'ADD' }
      ];
    }
    if (stepIndex >= 2) {
      const accrued = stepIndex >= 5;
      const glPosted = stepIndex >= 7;
      state.FLA_SCHEDULE_HEADERS = [{
        SCHEDULE_HEADER_ID: 46001, LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, VERSION_NUM: 1,
        PAYMENT_NUMBER: 'PAY-BASE-01', REGIME_CODE: 'IFRS16', AMORTIZATION_START_DATE: '2026-04-01',
        AMORTIZATION_END_DATE: '2028-03-31', INTEREST_RATE: 2.50, ACTIVE_FLAG: 'Y', REVERSAL_FLAG: 'N', PARENT_RECORD_ID: null
      }];
      state.FLA_LIABILITY_SCHEDULES = [{
        LIABILITY_SCHEDULE_ID: 47001, SCHEDULE_HEADER_ID: 46001, SCHEDULE_DATE: '2026-04-30', PERIOD_NAME: '2026-04',
        PAYMENT_ITEM_AMOUNT: stepIndex >= 3 ? 105000 : 0, PRESENT_VALUE_AMOUNT: 2400000,
        OPENING_LIABILITY_AMOUNT: 2400000, INTEREST_AMOUNT: accrued ? 5000 : 0,
        CLOSING_LIABILITY_AMOUNT: accrued ? 2300000 : (stepIndex >= 3 ? 2295000 : 2400000),
        CATCHUP_FLAG: 'N', LIABILITY_REVERSAL_FLAG: 'N'
      }];
      state.FLA_ACCRUAL_SCHEDULES = [{
        ACCRUAL_SCHEDULE_ID: 48001, SCHEDULE_HEADER_ID: 46001, SCHEDULE_DATE: '2026-04-30', PERIOD_NAME: '2026-04',
        INTEREST_AMOUNT: accrued ? 5000 : 0, SCHEDULE1_AMOUNT: accrued ? 100000 : 0,
        OPENING_FIN_ROU_AMOUNT: 2400000, CLOSING_FIN_ROU_AMOUNT: accrued ? 2300000 : 2400000,
        ACCRUED_FLAG: accrued ? 'Y' : 'N', ACCRUAL_REVERSAL_FLAG: 'N'
      }];
      state.FLA_ACCOUNTING_HEADERS_ALL = [{
        TRANSACTION_ID: 61001, LEASE_ID: 40001, LEDGER_ID: 2001, EVENT_ID: stepIndex >= 6 ? 90001 : null,
        ACCOUNTING_DATE: '2026-04-01', EVENT_TYPE_CODE: 'LEASE_BOOKING', ACCOUNTED_IN_GL_FLAG: glPosted ? 'Y' : 'N'
      }];
      state.FLA_ACCOUNTING_LINES = [{
        TRANSACTION_LINE_ID: 62001, TRANSACTION_ID: 61001, SCHEDULE_TYPE_CODE: 'ROU_ASSET',
        DR_CODE_COMBINATION_ID: 1710, CR_CODE_COMBINATION_ID: 2310, ENTERED_AMOUNT: 2400000, ACCOUNTED_AMOUNT: 2400000
      }];
      state.FLA_LEASE_BALANCES_ALL = [
        { LEASE_BALANCE_ID: 50001, LEASE_ID: 40001, ORG_ID: 300001, LEDGER_ID: 2001, PERIOD_NAME: '2026-04', REGIME_CODE: 'IFRS16', BALANCE_TYPE_CODE: 'ROU', CURRENCY_CODE: 'JPY', CLOSING_BALANCE: accrued ? 2300000 : 2400000 },
        { LEASE_BALANCE_ID: 50002, LEASE_ID: 40001, ORG_ID: 300001, LEDGER_ID: 2001, PERIOD_NAME: '2026-04', REGIME_CODE: 'IFRS16', BALANCE_TYPE_CODE: 'LIABILITY', CURRENCY_CODE: 'JPY', CLOSING_BALANCE: accrued ? 2300000 : 2400000 }
      ];
    }
    if (stepIndex >= 3) {
      const paid = stepIndex >= 4;
      const glPosted = stepIndex >= 7;
      state.FLA_PAYMENT_ITEMS = [{
        PAYMENT_ITEM_ID: 49001, LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, PAYMENT_NUMBER: 'PAY-BASE-01',
        DUE_DATE: '2026-04-05', ACTUAL_AMOUNT: 105000, APPROVAL_STATUS_CODE: 'APPROVED', INTERFACE_STATUS_CODE: 'INTERFACED'
      }];
      state.FLA_ACCOUNTING_HEADERS_ALL.push({
        TRANSACTION_ID: 61002, LEASE_ID: 40001, LEDGER_ID: 2001, EVENT_ID: stepIndex >= 6 ? 90002 : null,
        ACCOUNTING_DATE: '2026-04-05', EVENT_TYPE_CODE: 'LEASE_PAYMENT', ACCOUNTED_IN_GL_FLAG: glPosted ? 'Y' : 'N'
      });
      state.FLA_ACCOUNTING_LINES.push({
        TRANSACTION_LINE_ID: 62002, TRANSACTION_ID: 61002, SCHEDULE_TYPE_CODE: 'LEASE_LIABILITY',
        DR_CODE_COMBINATION_ID: 2310, CR_CODE_COMBINATION_ID: 2390, ENTERED_AMOUNT: 105000, ACCOUNTED_AMOUNT: 105000
      });
      state.AP_INVOICES_INTERFACE = [{
        INVOICE_ID: 10001, INVOICE_NUM: 'AP-LA-202604', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101,
        INVOICE_AMOUNT: 105000, SOURCE: 'Oracle Lease Accounting', STATUS: 'PROCESSED'
      }];
      state.AP_INVOICES_ALL = [{
        INVOICE_ID: 10001, INVOICE_NUM: 'AP-LA-202604', VENDOR_ID: 5001, ORG_ID: 300001,
        INVOICE_AMOUNT: 115500, AMOUNT_PAID: paid ? 115500 : 0, VALIDATION_STATUS: 'VALIDATED', PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N'
      }];
      state.AP_INVOICE_LINES_ALL = [
        { INVOICE_ID: 10001, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: '2026年4月度 本社フロア賃料', AMOUNT: 105000, DEFAULT_DIST_CCID: 2390 },
        { INVOICE_ID: 10001, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税10%', AMOUNT: 10500, DEFAULT_DIST_CCID: 1501 }
      ];
      state.ZX_LINES = [{ TAX_LINE_ID: 20001, APPLICATION_ID: 200, TRX_ID: 10001, TRX_LINE_ID: 1, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAXABLE_AMT: 105000, TAX_AMT: 10500 }];
      state.AP_INVOICE_DISTRIBUTIONS_ALL = [
        { INVOICE_DISTRIBUTION_ID: 10101, INVOICE_ID: 10001, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 2390, AMOUNT: 105000, POSTED_FLAG: glPosted ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10102, INVOICE_ID: 10001, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1501, AMOUNT: 10500, POSTED_FLAG: glPosted ? 'Y' : 'N' }
      ];
      state.AP_PAYMENT_SCHEDULES_ALL = [{ INVOICE_ID: 10001, PAYMENT_NUM: 1, DUE_DATE: '2026-04-10', GROSS_AMOUNT: 115500, AMOUNT_REMAINING: paid ? 0 : 115500, PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N' }];
    }
    if (stepIndex >= 4) {
      state.AP_CHECKS_ALL = [{ CHECK_ID: 88001, CHECK_NUMBER: 88001, VENDOR_ID: 5001, CE_BANK_ACCT_USE_ID: 7001, CHECK_DATE: '2026-04-10', AMOUNT: 115500, STATUS_LOOKUP_CODE: 'CLEARED' }];
      state.AP_INVOICE_PAYMENTS_ALL = [{ INVOICE_PAYMENT_ID: 77001, INVOICE_ID: 10001, CHECK_ID: 88001, AMOUNT: 115500 }];
      state.AP_PAYMENT_HISTORY_ALL = [{ PAYMENT_HISTORY_ID: 70001, CHECK_ID: 88001, TRANSACTION_TYPE: 'PAYMENT CLEARING', TRANSACTION_DATE: '2026-04-10', TRANSACTION_AMOUNT: 115500, POSTED_FLAG: stepIndex >= 7 ? 'Y' : 'N' }];
    }
    if (stepIndex >= 5) {
      const glPosted = stepIndex >= 7;
      state.FLA_ACCOUNTING_HEADERS_ALL.push({
        TRANSACTION_ID: 61003, LEASE_ID: 40001, LEDGER_ID: 2001, EVENT_ID: stepIndex >= 6 ? 90005 : null,
        ACCOUNTING_DATE: '2026-04-30', EVENT_TYPE_CODE: 'LEASE_ACCRUAL', ACCOUNTED_IN_GL_FLAG: glPosted ? 'Y' : 'N'
      });
      state.FLA_ACCOUNTING_LINES.push(
        { TRANSACTION_LINE_ID: 62003, TRANSACTION_ID: 61003, SCHEDULE_TYPE_CODE: 'AMORTIZATION', DR_CODE_COMBINATION_ID: 5401, CR_CODE_COMBINATION_ID: 1719, ENTERED_AMOUNT: 100000, ACCOUNTED_AMOUNT: 100000 },
        { TRANSACTION_LINE_ID: 62004, TRANSACTION_ID: 61003, SCHEDULE_TYPE_CODE: 'INTEREST_EXPENSE', DR_CODE_COMBINATION_ID: 6301, CR_CODE_COMBINATION_ID: 2310, ENTERED_AMOUNT: 5000, ACCOUNTED_AMOUNT: 5000 }
      );
    }
    if (stepIndex >= 6) {
      const glSt = stepIndex >= 7 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 80001, APPLICATION_ID: 10522, LEDGER_ID: 2001, ENTITY_CODE: 'LEASE_TRANSACTIONS', SOURCE_ID_INT_1: 40001 },
        { ENTITY_ID: 80002, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_INVOICES', SOURCE_ID_INT_1: 10001 },
        { ENTITY_ID: 80003, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_PAYMENTS', SOURCE_ID_INT_1: 88001 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 90001, ENTITY_ID: 80001, EVENT_TYPE_CODE: 'LEASE_BOOKING', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90002, ENTITY_ID: 80001, EVENT_TYPE_CODE: 'LEASE_PAYMENT', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90003, ENTITY_ID: 80002, EVENT_TYPE_CODE: 'INVOICE_VALIDATED', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90004, ENTITY_ID: 80003, EVENT_TYPE_CODE: 'PAYMENT_CLEARED', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90005, ENTITY_ID: 80001, EVENT_TYPE_CODE: 'LEASE_ACCRUAL', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 91001, APPLICATION_ID: 10522, EVENT_ID: 90001, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Lease Accounting', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 91002, APPLICATION_ID: 10522, EVENT_ID: 90002, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Lease Accounting', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 91003, APPLICATION_ID: 200, EVENT_ID: 90003, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Purchase Invoices', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 91004, APPLICATION_ID: 200, EVENT_ID: 90004, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Payments', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 91005, APPLICATION_ID: 10522, EVENT_ID: 90005, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Lease Accounting', GL_TRANSFER_STATUS_CODE: glSt }
      ];
      const aeRaw = [
        [91001, 1, 'ROU_ASSET', 1710, 2400000, 0, '使用権資産(ROU) 初期計上', 701],
        [91001, 2, 'LEASE_LIABILITY', 2310, 0, 2400000, 'リース負債(PV) 初期計上', 702],
        [91002, 1, 'LEASE_LIABILITY', 2310, 105000, 0, 'リース負債 月次支払減少', 703],
        [91002, 2, 'AP_CLEARING', 2390, 0, 105000, 'リースAPクリアリング貸方', 704],
        [91003, 1, 'AP_CLEARING', 2390, 105000, 0, 'AP側 リースAPクリアリング相殺', 705],
        [91003, 2, 'RECOVERABLE_TAX', 1501, 10500, 0, '仮払消費税10%', 706],
        [91003, 3, 'LIABILITY', 2101, 0, 115500, '買掛金計上(賃料税込)', 707],
        [91004, 1, 'LIABILITY', 2101, 115500, 0, '買掛金支払消込', 708],
        [91004, 2, 'CASH', 1001, 0, 115500, '普通預金出金', 709],
        [91005, 1, 'AMORTIZATION', 5401, 100000, 0, 'ROU減価償却費(240万÷24月)', 710],
        [91005, 2, 'ROU_RESERVE', 1719, 0, 100000, '使用権資産減価償却累計額', 711],
        [91005, 3, 'INTEREST_EXPENSE', 6301, 5000, 0, 'リース支払利息(240万×2.5%÷12)', 712],
        [91005, 4, 'LEASE_LIABILITY', 2310, 0, 5000, 'リース負債 利息増加', 713]
      ];
      state.XLA_AE_LINES = aeRaw.map(([hid, ln, cls, ccid, dr, cr, desc, lid]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat, ACCOUNT_NAME: CCID_LIST[ccid].name,
        ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: lid
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 91001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 62001, REF_AE_HEADER_ID: 91001 },
        { AE_HEADER_ID: 91002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 62002, REF_AE_HEADER_ID: 91002 },
        { AE_HEADER_ID: 91003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10101, REF_AE_HEADER_ID: 91003 },
        { AE_HEADER_ID: 91004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_HIST', SOURCE_DISTRIBUTION_ID_NUM_1: 70001, REF_AE_HEADER_ID: 91004 },
        { AE_HEADER_ID: 91005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 62003, REF_AE_HEADER_ID: 91005 }
      ];
    }
    if (stepIndex >= 7) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6001, LINE_NO: idx + 1, STATUS: 'PROCESSED',
        USER_JE_SOURCE_NAME: [91003, 91004].includes(l.AE_HEADER_ID) ? 'Payables' : 'Lease Accounting',
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [{ JE_BATCH_ID: 55001, NAME: 'LA_BOOK_AP_ACCRUAL_202604', STATUS: 'P', RUNNING_TOTAL_ACCOUNTED_DR: 2841000, RUNNING_TOTAL_ACCOUNTED_CR: 2841000 }];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66001, JE_BATCH_ID: 55001, LEDGER_ID: 2001, JE_SOURCE: 'Lease Accounting', JE_CATEGORY: 'Lease Book/Pay/Accrual', PERIOD_NAME: '2026-04', STATUS: 'P', RUNNING_TOTAL_DR: 2610000, RUNNING_TOTAL_CR: 2610000 },
        { JE_HEADER_ID: 66002, JE_BATCH_ID: 55001, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Lease AP Invoice & Pay', PERIOD_NAME: '2026-04', STATUS: 'P', RUNNING_TOTAL_DR: 231000, RUNNING_TOTAL_CR: 231000 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const isAp = [91003, 91004].includes(l.AE_HEADER_ID);
        return buildJournalRow(isAp ? 66002 : 66001, l.AE_LINE_NUM + (l.AE_HEADER_ID % 10) * 10, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, '2026-04', l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({ JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL' }));
      state.GL_BALANCES = computeBalancesWithOpening([], state.GL_JE_LINES, '2026-04');
    }

  // ==========================================================
  // CASE 2: LA_REVISION
  // ==========================================================
  } else if (caseId === 'LA_REVISION') {
    const revised = stepIndex >= 1;
    const accrued = stepIndex >= 4;
    const opening = [[1710, 2400000, 0], [1719, 0, 1200000], [2310, 0, 1230000], [3101, 30000, 0]];

    state.FLA_LEASES_ALL = [{
      LEASE_ID: 40001, LEASE_NUMBER: 'LA-2026-001', LEASE_NAME: '本社オフィスフロアリース（増床延長改定）',
      ORG_ID: 300001, LEASE_TYPE_CODE: 'EXPENSE', LEASE_ASSET_TYPE_CODE: 'PROPERTY', LEASE_STATUS_CODE: 'ACTIVE', LESSOR_PARTY_ID: 4001
    }];
    state.FLA_LEASE_DETAILS = [
      { LEASE_DETAIL_ID: 41001, LEASE_ID: 40001, VERSION_NUM: 1, LEASE_VERSION_NAME: 'V1_INITIAL', PRIMARY_CLASSIFICATION_CODE: 'FINANCE', LEASE_START_DATE: '2026-04-01', LEASE_END_DATE: '2028-03-31' }
    ];
    state.FLA_LEASE_ASSETS = [
      { LEASE_ASSET_ID: 42001, LEASE_DETAIL_ID: 41001, LEASE_ID: 40001, ASSET_NUMBER: 'LA-ASSET-001', START_DATE: '2026-04-01', END_DATE: '2028-03-31', INSTALL_SITE_ID: 4201, CHANGE_TYPE_CODE: 'ADD', CHANGED_IN_VERSION_NUM: 1 }
    ];
    state.FLA_LEASE_PAYMENT_HEADERS = [{
      PAYMENT_HEADER_ID: 43001, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: revised ? 41002 : 41001,
      LEASE_ASSET_ID: 42001, PAYMENT_TYPE_CODE: 'BASE_RENT', PAYMENT_FREQUENCY_CODE: 'MONTHLY', ROU_ASSET_FLAG: 'Y', LIABILITY_FLAG: 'Y', CURRENCY_CODE: 'JPY', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101
    }];
    state.FLA_LEASE_PAYMENT_LINES = [{
      PAYMENT_LINE_ID: 44001, PAYMENT_HEADER_ID: 43001, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001,
      PAYMENT_LINE_NUM: 1, ACTUAL_AMOUNT: 105000, PAYMENT_LINE_START_DATE: '2026-04-01', PAYMENT_LINE_END_DATE: '2027-03-31', NO_OF_PAYMENTS: 12
    }];
    state.FLA_LEASE_PAYMENT_ACCOUNTS = [
      { PAYMENT_ACCOUNT_ID: 45001, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, LEDGER_ID: 2001, ACCOUNT_CCID: 1710, ACCOUNT_CLASS_CODE: 'ROU_ASSET', CHANGE_TYPE_CODE: 'ADD' },
      { PAYMENT_ACCOUNT_ID: 45002, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, LEDGER_ID: 2001, ACCOUNT_CCID: 2310, ACCOUNT_CLASS_CODE: 'LIABILITY', CHANGE_TYPE_CODE: 'ADD' }
    ];
    state.FLA_SCHEDULE_HEADERS = [{
      SCHEDULE_HEADER_ID: 46001, LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, VERSION_NUM: 1, PAYMENT_NUMBER: 'PAY-BASE-01',
      REGIME_CODE: 'IFRS16', AMORTIZATION_START_DATE: '2026-04-01', AMORTIZATION_END_DATE: '2028-03-31',
      INTEREST_RATE: 2.50, ACTIVE_FLAG: revised ? 'N' : 'Y', REVERSAL_FLAG: 'N', PARENT_RECORD_ID: null
    }];
    state.FLA_LIABILITY_SCHEDULES = [{
      LIABILITY_SCHEDULE_ID: 47001, SCHEDULE_HEADER_ID: 46001, SCHEDULE_DATE: '2027-03-31', PERIOD_NAME: '2027-03',
      PAYMENT_ITEM_AMOUNT: 105000, PRESENT_VALUE_AMOUNT: 2400000, OPENING_LIABILITY_AMOUNT: 1332000, INTEREST_AMOUNT: 3000, CLOSING_LIABILITY_AMOUNT: 1230000, CATCHUP_FLAG: 'N', LIABILITY_REVERSAL_FLAG: 'N'
    }];
    state.FLA_ACCRUAL_SCHEDULES = [{
      ACCRUAL_SCHEDULE_ID: 48001, SCHEDULE_HEADER_ID: 46001, SCHEDULE_DATE: '2027-03-31', PERIOD_NAME: '2027-03',
      INTEREST_AMOUNT: 3000, SCHEDULE1_AMOUNT: 100000, OPENING_FIN_ROU_AMOUNT: 1300000, CLOSING_FIN_ROU_AMOUNT: 1200000, ACCRUED_FLAG: 'Y', ACCRUAL_REVERSAL_FLAG: 'N'
    }];
    state.FLA_LEASE_BALANCES_ALL = [
      { LEASE_BALANCE_ID: 50001, LEASE_ID: 40001, ORG_ID: 300001, LEDGER_ID: 2001, PERIOD_NAME: '2027-04', REGIME_CODE: 'IFRS16', BALANCE_TYPE_CODE: 'ROU', CURRENCY_CODE: 'JPY', CLOSING_BALANCE: accrued ? 2731250 : (revised ? 2850000 : 1200000) },
      { LEASE_BALANCE_ID: 50002, LEASE_ID: 40001, ORG_ID: 300001, LEDGER_ID: 2001, PERIOD_NAME: '2027-04', REGIME_CODE: 'IFRS16', BALANCE_TYPE_CODE: 'LIABILITY', CURRENCY_CODE: 'JPY', CLOSING_BALANCE: accrued ? 2757200 : (stepIndex >= 2 ? 2750000 : (revised ? 2880000 : 1230000)) }
    ];
    if (stepIndex === 0) state.GL_BALANCES = computeBalancesWithOpening(opening, [], '2027-04 (期首)');

    if (revised) {
      const glPosted = stepIndex >= 6;
      state.FLA_LEASE_DETAILS.push({ LEASE_DETAIL_ID: 41002, LEASE_ID: 40001, VERSION_NUM: 2, LEASE_VERSION_NAME: 'V2_EXTEND_24M', PRIMARY_CLASSIFICATION_CODE: 'FINANCE', LEASE_START_DATE: '2027-04-01', LEASE_END_DATE: '2029-03-31' });
      state.FLA_LEASE_ASSETS.push({ LEASE_ASSET_ID: 42002, LEASE_DETAIL_ID: 41002, LEASE_ID: 40001, ASSET_NUMBER: 'LA-ASSET-001', START_DATE: '2027-04-01', END_DATE: '2029-03-31', INSTALL_SITE_ID: 4201, CHANGE_TYPE_CODE: 'REVISE', CHANGED_IN_VERSION_NUM: 2 });
      state.FLA_LEASE_PAYMENT_LINES.push({ PAYMENT_LINE_ID: 44002, PAYMENT_HEADER_ID: 43001, PAYMENT_NUMBER: 'PAY-BASE-01', LEASE_ID: 40001, LEASE_DETAIL_ID: 41002, PAYMENT_LINE_NUM: 2, ACTUAL_AMOUNT: 130000, PAYMENT_LINE_START_DATE: '2027-04-01', PAYMENT_LINE_END_DATE: '2029-03-31', NO_OF_PAYMENTS: 24 });
      state.FLA_SCHEDULE_HEADERS.push({ SCHEDULE_HEADER_ID: 46002, LEASE_ID: 40001, LEASE_DETAIL_ID: 41002, VERSION_NUM: 2, PAYMENT_NUMBER: 'PAY-BASE-01', REGIME_CODE: 'IFRS16', AMORTIZATION_START_DATE: '2027-04-01', AMORTIZATION_END_DATE: '2029-03-31', INTEREST_RATE: 3.00, ACTIVE_FLAG: 'Y', REVERSAL_FLAG: 'N', PARENT_RECORD_ID: 46001 });
      state.FLA_LIABILITY_SCHEDULES.push({ LIABILITY_SCHEDULE_ID: 47002, SCHEDULE_HEADER_ID: 46002, SCHEDULE_DATE: '2027-04-30', PERIOD_NAME: '2027-04', PAYMENT_ITEM_AMOUNT: stepIndex >= 2 ? 130000 : 0, PRESENT_VALUE_AMOUNT: 2880000, OPENING_LIABILITY_AMOUNT: 2880000, INTEREST_AMOUNT: accrued ? 7200 : 0, CLOSING_LIABILITY_AMOUNT: accrued ? 2757200 : (stepIndex >= 2 ? 2750000 : 2880000), CATCHUP_FLAG: 'N', LIABILITY_REVERSAL_FLAG: 'N' });
      state.FLA_ACCRUAL_SCHEDULES.push({ ACCRUAL_SCHEDULE_ID: 48002, SCHEDULE_HEADER_ID: 46002, SCHEDULE_DATE: '2027-04-30', PERIOD_NAME: '2027-04', INTEREST_AMOUNT: accrued ? 7200 : 0, SCHEDULE1_AMOUNT: accrued ? 118750 : 0, OPENING_FIN_ROU_AMOUNT: 2850000, CLOSING_FIN_ROU_AMOUNT: accrued ? 2731250 : 2850000, ACCRUED_FLAG: accrued ? 'Y' : 'N', ACCRUAL_REVERSAL_FLAG: 'N' });
      state.FLA_ACCOUNTING_HEADERS_ALL = [{ TRANSACTION_ID: 61201, LEASE_ID: 40001, LEDGER_ID: 2001, EVENT_ID: stepIndex >= 5 ? 92001 : null, ACCOUNTING_DATE: '2027-04-01', EVENT_TYPE_CODE: 'LEASE_REVISION', ACCOUNTED_IN_GL_FLAG: glPosted ? 'Y' : 'N' }];
      state.FLA_ACCOUNTING_LINES = [{ TRANSACTION_LINE_ID: 62201, TRANSACTION_ID: 61201, SCHEDULE_TYPE_CODE: 'ROU_ASSET', DR_CODE_COMBINATION_ID: 1710, CR_CODE_COMBINATION_ID: 2310, ENTERED_AMOUNT: 1650000, ACCOUNTED_AMOUNT: 1650000 }];
    }
    if (stepIndex >= 2) {
      const paid = stepIndex >= 3;
      const glPosted = stepIndex >= 6;
      state.FLA_PAYMENT_ITEMS = [{ PAYMENT_ITEM_ID: 49201, LEASE_ID: 40001, LEASE_DETAIL_ID: 41002, PAYMENT_NUMBER: 'PAY-BASE-01', DUE_DATE: '2027-04-05', ACTUAL_AMOUNT: 130000, APPROVAL_STATUS_CODE: 'APPROVED', INTERFACE_STATUS_CODE: 'INTERFACED' }];
      state.FLA_ACCOUNTING_HEADERS_ALL.push({ TRANSACTION_ID: 61202, LEASE_ID: 40001, LEDGER_ID: 2001, EVENT_ID: stepIndex >= 5 ? 92002 : null, ACCOUNTING_DATE: '2027-04-05', EVENT_TYPE_CODE: 'LEASE_PAYMENT', ACCOUNTED_IN_GL_FLAG: glPosted ? 'Y' : 'N' });
      state.FLA_ACCOUNTING_LINES.push({ TRANSACTION_LINE_ID: 62202, TRANSACTION_ID: 61202, SCHEDULE_TYPE_CODE: 'LEASE_LIABILITY', DR_CODE_COMBINATION_ID: 2310, CR_CODE_COMBINATION_ID: 2390, ENTERED_AMOUNT: 130000, ACCOUNTED_AMOUNT: 130000 });
      state.AP_INVOICES_INTERFACE = [{ INVOICE_ID: 10201, INVOICE_NUM: 'AP-LA-202704', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101, INVOICE_AMOUNT: 130000, SOURCE: 'Oracle Lease Accounting', STATUS: 'PROCESSED' }];
      state.AP_INVOICES_ALL = [{ INVOICE_ID: 10201, INVOICE_NUM: 'AP-LA-202704', VENDOR_ID: 5001, ORG_ID: 300001, INVOICE_AMOUNT: 143000, AMOUNT_PAID: paid ? 143000 : 0, VALIDATION_STATUS: 'VALIDATED', PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N' }];
      state.AP_INVOICE_LINES_ALL = [
        { INVOICE_ID: 10201, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: '改定後フロア賃料(Ver2)', AMOUNT: 130000, DEFAULT_DIST_CCID: 2390 },
        { INVOICE_ID: 10201, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税10%', AMOUNT: 13000, DEFAULT_DIST_CCID: 1501 }
      ];
      state.ZX_LINES = [{ TAX_LINE_ID: 20201, APPLICATION_ID: 200, TRX_ID: 10201, TRX_LINE_ID: 1, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAXABLE_AMT: 130000, TAX_AMT: 13000 }];
      state.AP_INVOICE_DISTRIBUTIONS_ALL = [
        { INVOICE_DISTRIBUTION_ID: 10211, INVOICE_ID: 10201, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 2390, AMOUNT: 130000, POSTED_FLAG: glPosted ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10212, INVOICE_ID: 10201, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1501, AMOUNT: 13000, POSTED_FLAG: glPosted ? 'Y' : 'N' }
      ];
      state.AP_PAYMENT_SCHEDULES_ALL = [{ INVOICE_ID: 10201, PAYMENT_NUM: 1, DUE_DATE: '2027-04-10', GROSS_AMOUNT: 143000, AMOUNT_REMAINING: paid ? 0 : 143000, PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N' }];
    }
    if (stepIndex >= 3) {
      state.AP_CHECKS_ALL = [{ CHECK_ID: 88201, CHECK_NUMBER: 88201, VENDOR_ID: 5001, CE_BANK_ACCT_USE_ID: 7001, CHECK_DATE: '2027-04-10', AMOUNT: 143000, STATUS_LOOKUP_CODE: 'CLEARED' }];
      state.AP_INVOICE_PAYMENTS_ALL = [{ INVOICE_PAYMENT_ID: 77201, INVOICE_ID: 10201, CHECK_ID: 88201, AMOUNT: 143000 }];
      state.AP_PAYMENT_HISTORY_ALL = [{ PAYMENT_HISTORY_ID: 70201, CHECK_ID: 88201, TRANSACTION_TYPE: 'PAYMENT CLEARING', TRANSACTION_DATE: '2027-04-10', TRANSACTION_AMOUNT: 143000, POSTED_FLAG: stepIndex >= 6 ? 'Y' : 'N' }];
    }
    if (accrued) {
      state.FLA_ACCOUNTING_HEADERS_ALL.push({ TRANSACTION_ID: 61203, LEASE_ID: 40001, LEDGER_ID: 2001, EVENT_ID: stepIndex >= 5 ? 92005 : null, ACCOUNTING_DATE: '2027-04-30', EVENT_TYPE_CODE: 'LEASE_ACCRUAL', ACCOUNTED_IN_GL_FLAG: stepIndex >= 6 ? 'Y' : 'N' });
      state.FLA_ACCOUNTING_LINES.push(
        { TRANSACTION_LINE_ID: 62203, TRANSACTION_ID: 61203, SCHEDULE_TYPE_CODE: 'AMORTIZATION', DR_CODE_COMBINATION_ID: 5401, CR_CODE_COMBINATION_ID: 1719, ENTERED_AMOUNT: 118750, ACCOUNTED_AMOUNT: 118750 },
        { TRANSACTION_LINE_ID: 62204, TRANSACTION_ID: 61203, SCHEDULE_TYPE_CODE: 'INTEREST_EXPENSE', DR_CODE_COMBINATION_ID: 6301, CR_CODE_COMBINATION_ID: 2310, ENTERED_AMOUNT: 7200, ACCOUNTED_AMOUNT: 7200 }
      );
    }
    if (stepIndex >= 5) {
      const glSt = stepIndex >= 6 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 82001, APPLICATION_ID: 10522, LEDGER_ID: 2001, ENTITY_CODE: 'LEASE_TRANSACTIONS', SOURCE_ID_INT_1: 40001 },
        { ENTITY_ID: 82002, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_INVOICES', SOURCE_ID_INT_1: 10201 },
        { ENTITY_ID: 82003, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_PAYMENTS', SOURCE_ID_INT_1: 88201 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 92001, ENTITY_ID: 82001, EVENT_TYPE_CODE: 'LEASE_REVISION', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92002, ENTITY_ID: 82001, EVENT_TYPE_CODE: 'LEASE_PAYMENT', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92003, ENTITY_ID: 82002, EVENT_TYPE_CODE: 'INVOICE_VALIDATED', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92004, ENTITY_ID: 82003, EVENT_TYPE_CODE: 'PAYMENT_CLEARED', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92005, ENTITY_ID: 82001, EVENT_TYPE_CODE: 'LEASE_ACCRUAL', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 93001, APPLICATION_ID: 10522, EVENT_ID: 92001, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Lease Accounting', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 93002, APPLICATION_ID: 10522, EVENT_ID: 92002, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Lease Accounting', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 93003, APPLICATION_ID: 200, EVENT_ID: 92003, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Purchase Invoices', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 93004, APPLICATION_ID: 200, EVENT_ID: 92004, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Payments', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 93005, APPLICATION_ID: 10522, EVENT_ID: 92005, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Lease Accounting', GL_TRANSFER_STATUS_CODE: glSt }
      ];
      const aeRaw = [
        [93001, 1, 'ROU_ASSET', 1710, 1650000, 0, '契約改定 ROU増加分', 721],
        [93001, 2, 'LEASE_LIABILITY', 2310, 0, 1650000, '負債再測定増加分', 722],
        [93002, 1, 'LEASE_LIABILITY', 2310, 130000, 0, '改定後負債 月次支払減少', 723],
        [93002, 2, 'AP_CLEARING', 2390, 0, 130000, 'リースAPクリアリング貸方', 724],
        [93003, 1, 'AP_CLEARING', 2390, 130000, 0, 'AP側クリアリング消込', 725],
        [93003, 2, 'RECOVERABLE_TAX', 1501, 13000, 0, '仮払消費税10%', 726],
        [93003, 3, 'LIABILITY', 2101, 0, 143000, '買掛金計上', 727],
        [93004, 1, 'LIABILITY', 2101, 143000, 0, '買掛金支払消込', 728],
        [93004, 2, 'CASH', 1001, 0, 143000, '普通預金出金', 729],
        [93005, 1, 'AMORTIZATION', 5401, 118750, 0, '再計算ROU償却費(285万÷24)', 730],
        [93005, 2, 'ROU_RESERVE', 1719, 0, 118750, 'ROU累計額増加', 731],
        [93005, 3, 'INTEREST_EXPENSE', 6301, 7200, 0, '改定後支払利息(288万×3%÷12)', 732],
        [93005, 4, 'LEASE_LIABILITY', 2310, 0, 7200, 'リース負債利息増加', 733]
      ];
      state.XLA_AE_LINES = aeRaw.map(([hid, ln, cls, ccid, dr, cr, desc, lid]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat, ACCOUNT_NAME: CCID_LIST[ccid].name,
        ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: lid
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 93001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 62201, REF_AE_HEADER_ID: 93001 },
        { AE_HEADER_ID: 93002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 62202, REF_AE_HEADER_ID: 93002 },
        { AE_HEADER_ID: 93003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10211, REF_AE_HEADER_ID: 93003 },
        { AE_HEADER_ID: 93004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_HIST', SOURCE_DISTRIBUTION_ID_NUM_1: 70201, REF_AE_HEADER_ID: 93004 },
        { AE_HEADER_ID: 93005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 62203, REF_AE_HEADER_ID: 93005 }
      ];
    }
    if (stepIndex >= 6) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6101, LINE_NO: idx + 1, STATUS: 'PROCESSED',
        USER_JE_SOURCE_NAME: [93003, 93004].includes(l.AE_HEADER_ID) ? 'Payables' : 'Lease Accounting',
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [{ JE_BATCH_ID: 55101, NAME: 'LA_REVISION_202704', STATUS: 'P', RUNNING_TOTAL_ACCOUNTED_DR: 2191950, RUNNING_TOTAL_ACCOUNTED_CR: 2191950 }];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66101, JE_BATCH_ID: 55101, LEDGER_ID: 2001, JE_SOURCE: 'Lease Accounting', JE_CATEGORY: 'Lease Revision & Accrual', PERIOD_NAME: '2027-04', STATUS: 'P', RUNNING_TOTAL_DR: 1905950, RUNNING_TOTAL_CR: 1905950 },
        { JE_HEADER_ID: 66102, JE_BATCH_ID: 55101, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Lease Revised AP', PERIOD_NAME: '2027-04', STATUS: 'P', RUNNING_TOTAL_DR: 286000, RUNNING_TOTAL_CR: 286000 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const isAp = [93003, 93004].includes(l.AE_HEADER_ID);
        return buildJournalRow(isAp ? 66102 : 66101, l.AE_LINE_NUM + (l.AE_HEADER_ID % 10) * 10, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, '2027-04', l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({ JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL' }));
      state.GL_BALANCES = computeBalancesWithOpening(opening, state.GL_JE_LINES, '2027-04');
    }

  // ==========================================================
  // CASE 3: LA_TERMINATION
  // ==========================================================
  } else if (caseId === 'LA_TERMINATION') {
    const terminated = stepIndex >= 1;
    const termAcct = stepIndex >= 2;
    const opening = [[1710, 2400000, 0], [1719, 0, 1800000], [2310, 0, 620000], [3101, 20000, 0]];

    state.FLA_LEASES_ALL = [{
      LEASE_ID: 40001, LEASE_NUMBER: 'LA-2026-001', LEASE_NAME: '本社オフィスフロアリース（中途解約）',
      ORG_ID: 300001, LEASE_TYPE_CODE: 'EXPENSE', LEASE_ASSET_TYPE_CODE: 'PROPERTY',
      LEASE_STATUS_CODE: terminated ? 'TERMINATED' : 'ACTIVE', LESSOR_PARTY_ID: 4001
    }];
    state.FLA_LEASE_DETAILS = [{
      LEASE_DETAIL_ID: 41001, LEASE_ID: 40001, VERSION_NUM: 1, LEASE_VERSION_NAME: terminated ? 'V1_TERMINATED' : 'V1_INITIAL',
      PRIMARY_CLASSIFICATION_CODE: 'FINANCE', LEASE_START_DATE: '2026-04-01', LEASE_END_DATE: terminated ? '2027-10-15' : '2028-03-31'
    }];
    state.FLA_LEASE_BALANCES_ALL = [
      { LEASE_BALANCE_ID: 50001, LEASE_ID: 40001, ORG_ID: 300001, LEDGER_ID: 2001, PERIOD_NAME: '2027-10', REGIME_CODE: 'IFRS16', BALANCE_TYPE_CODE: 'ROU', CURRENCY_CODE: 'JPY', CLOSING_BALANCE: termAcct ? 0 : 600000 },
      { LEASE_BALANCE_ID: 50002, LEASE_ID: 40001, ORG_ID: 300001, LEDGER_ID: 2001, PERIOD_NAME: '2027-10', REGIME_CODE: 'IFRS16', BALANCE_TYPE_CODE: 'LIABILITY', CURRENCY_CODE: 'JPY', CLOSING_BALANCE: termAcct ? 0 : 620000 }
    ];
    if (stepIndex === 0) state.GL_BALANCES = computeBalancesWithOpening(opening, [], '2027-10 (期首)');

    if (terminated) {
      state.FLA_LEASE_PAYMENT_HEADERS = [{
        PAYMENT_HEADER_ID: 43301, PAYMENT_NUMBER: 'PAY-TERM-02', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001,
        LEASE_ASSET_ID: 42001, PAYMENT_TYPE_CODE: 'TERMINATION_PENALTY', PAYMENT_FREQUENCY_CODE: 'ONE_TIME',
        ROU_ASSET_FLAG: 'N', LIABILITY_FLAG: 'N', CURRENCY_CODE: 'JPY', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101
      }];
      state.FLA_LEASE_PAYMENT_LINES = [{
        PAYMENT_LINE_ID: 44301, PAYMENT_HEADER_ID: 43301, PAYMENT_NUMBER: 'PAY-TERM-02', LEASE_ID: 40001, LEASE_DETAIL_ID: 41001,
        PAYMENT_LINE_NUM: 1, ACTUAL_AMOUNT: 80000, PAYMENT_LINE_START_DATE: '2027-10-15', PAYMENT_LINE_END_DATE: '2027-10-15', NO_OF_PAYMENTS: 1
      }];
      state.FLA_PAYMENT_ITEMS = [{
        PAYMENT_ITEM_ID: 49301, LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, PAYMENT_NUMBER: 'PAY-TERM-02',
        DUE_DATE: '2027-10-20', ACTUAL_AMOUNT: 80000, APPROVAL_STATUS_CODE: 'APPROVED', INTERFACE_STATUS_CODE: stepIndex >= 3 ? 'INTERFACED' : 'PENDING'
      }];
      state.FLA_SCHEDULE_HEADERS = [{
        SCHEDULE_HEADER_ID: 46301, LEASE_ID: 40001, LEASE_DETAIL_ID: 41001, VERSION_NUM: 1, PAYMENT_NUMBER: 'PAY-TERM-02',
        REGIME_CODE: 'IFRS16', AMORTIZATION_START_DATE: '2027-10-15', AMORTIZATION_END_DATE: '2027-10-15', INTEREST_RATE: 2.50, ACTIVE_FLAG: 'N', REVERSAL_FLAG: 'Y', PARENT_RECORD_ID: 46001
      }];
    }
    if (termAcct) {
      state.FLA_ACCOUNTING_HEADERS_ALL = [{
        TRANSACTION_ID: 61301, LEASE_ID: 40001, LEDGER_ID: 2001, EVENT_ID: stepIndex >= 5 ? 94001 : null,
        ACCOUNTING_DATE: '2027-10-15', EVENT_TYPE_CODE: 'LEASE_TERMINATION', ACCOUNTED_IN_GL_FLAG: stepIndex >= 6 ? 'Y' : 'N'
      }];
      state.FLA_ACCOUNTING_LINES = [
        { TRANSACTION_LINE_ID: 62301, TRANSACTION_ID: 61301, SCHEDULE_TYPE_CODE: 'LEASE_LIABILITY', DR_CODE_COMBINATION_ID: 2310, CR_CODE_COMBINATION_ID: 1710, ENTERED_AMOUNT: 620000, ACCOUNTED_AMOUNT: 620000 },
        { TRANSACTION_LINE_ID: 62302, TRANSACTION_ID: 61301, SCHEDULE_TYPE_CODE: 'ROU_RESERVE', DR_CODE_COMBINATION_ID: 1719, CR_CODE_COMBINATION_ID: 1710, ENTERED_AMOUNT: 1780000, ACCOUNTED_AMOUNT: 1780000 },
        { TRANSACTION_LINE_ID: 62303, TRANSACTION_ID: 61301, SCHEDULE_TYPE_CODE: 'TERMINATION_LOSS', DR_CODE_COMBINATION_ID: 6401, CR_CODE_COMBINATION_ID: 2390, ENTERED_AMOUNT: 80000, ACCOUNTED_AMOUNT: 80000 }
      ];
    }
    if (stepIndex >= 3) {
      const paid = stepIndex >= 4;
      const glPosted = stepIndex >= 6;
      state.AP_INVOICES_INTERFACE = [{ INVOICE_ID: 10301, INVOICE_NUM: 'AP-LA-TERM-003', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101, INVOICE_AMOUNT: 80000, SOURCE: 'Oracle Lease Accounting', STATUS: 'PROCESSED' }];
      state.AP_INVOICES_ALL = [{ INVOICE_ID: 10301, INVOICE_NUM: 'AP-LA-TERM-003', VENDOR_ID: 5001, ORG_ID: 300001, INVOICE_AMOUNT: 88000, AMOUNT_PAID: paid ? 88000 : 0, VALIDATION_STATUS: 'VALIDATED', PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N' }];
      state.AP_INVOICE_LINES_ALL = [
        { INVOICE_ID: 10301, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: 'リース中途解約違約金', AMOUNT: 80000, DEFAULT_DIST_CCID: 2390 },
        { INVOICE_ID: 10301, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税10%', AMOUNT: 8000, DEFAULT_DIST_CCID: 1501 }
      ];
      state.ZX_LINES = [{ TAX_LINE_ID: 20301, APPLICATION_ID: 200, TRX_ID: 10301, TRX_LINE_ID: 1, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAXABLE_AMT: 80000, TAX_AMT: 8000 }];
      state.AP_INVOICE_DISTRIBUTIONS_ALL = [
        { INVOICE_DISTRIBUTION_ID: 10311, INVOICE_ID: 10301, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 2390, AMOUNT: 80000, POSTED_FLAG: glPosted ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10312, INVOICE_ID: 10301, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1501, AMOUNT: 8000, POSTED_FLAG: glPosted ? 'Y' : 'N' }
      ];
      state.AP_PAYMENT_SCHEDULES_ALL = [{ INVOICE_ID: 10301, PAYMENT_NUM: 1, DUE_DATE: '2027-10-25', GROSS_AMOUNT: 88000, AMOUNT_REMAINING: paid ? 0 : 88000, PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N' }];
    }
    if (stepIndex >= 4) {
      state.AP_CHECKS_ALL = [{ CHECK_ID: 88301, CHECK_NUMBER: 88301, VENDOR_ID: 5001, CE_BANK_ACCT_USE_ID: 7001, CHECK_DATE: '2027-10-25', AMOUNT: 88000, STATUS_LOOKUP_CODE: 'CLEARED' }];
      state.AP_INVOICE_PAYMENTS_ALL = [{ INVOICE_PAYMENT_ID: 77301, INVOICE_ID: 10301, CHECK_ID: 88301, AMOUNT: 88000 }];
      state.AP_PAYMENT_HISTORY_ALL = [{ PAYMENT_HISTORY_ID: 70301, CHECK_ID: 88301, TRANSACTION_TYPE: 'PAYMENT CLEARING', TRANSACTION_DATE: '2027-10-25', TRANSACTION_AMOUNT: 88000, POSTED_FLAG: stepIndex >= 6 ? 'Y' : 'N' }];
    }
    if (stepIndex >= 5) {
      const glSt = stepIndex >= 6 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 84001, APPLICATION_ID: 10522, LEDGER_ID: 2001, ENTITY_CODE: 'LEASE_TRANSACTIONS', SOURCE_ID_INT_1: 40001 },
        { ENTITY_ID: 84002, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_INVOICES', SOURCE_ID_INT_1: 10301 },
        { ENTITY_ID: 84003, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_PAYMENTS', SOURCE_ID_INT_1: 88301 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 94001, ENTITY_ID: 84001, EVENT_TYPE_CODE: 'LEASE_TERMINATION', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94002, ENTITY_ID: 84002, EVENT_TYPE_CODE: 'INVOICE_VALIDATED', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94003, ENTITY_ID: 84003, EVENT_TYPE_CODE: 'PAYMENT_CLEARED', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 95001, APPLICATION_ID: 10522, EVENT_ID: 94001, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Lease Termination', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 95002, APPLICATION_ID: 200, EVENT_ID: 94002, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Purchase Invoices', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 95003, APPLICATION_ID: 200, EVENT_ID: 94003, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Payments', GL_TRANSFER_STATUS_CODE: glSt }
      ];
      const aeRaw = [
        [95001, 1, 'LEASE_LIABILITY', 2310, 620000, 0, 'リース負債 全額消去', 741],
        [95001, 2, 'ROU_RESERVE', 1719, 1800000, 0, '使用権資産 累計額消去', 742],
        [95001, 3, 'TERMINATION_LOSS', 6401, 60000, 0, 'リース中途解約損(負債62万-ROU60万-違約8万)', 743],
        [95001, 4, 'ROU_ASSET', 1710, 0, 2400000, '使用権資産(ROU) 原価消去', 744],
        [95001, 5, 'AP_CLEARING', 2390, 0, 80000, '解約違約金 APクリアリング', 745],
        [95002, 1, 'AP_CLEARING', 2390, 80000, 0, '違約金クリアリング消込', 746],
        [95002, 2, 'RECOVERABLE_TAX', 1501, 8000, 0, '仮払消費税10%', 747],
        [95002, 3, 'LIABILITY', 2101, 0, 88000, '買掛金計上(違約金税込)', 748],
        [95003, 1, 'LIABILITY', 2101, 88000, 0, '買掛金支払消込', 749],
        [95003, 2, 'CASH', 1001, 0, 88000, '普通預金出金', 750]
      ];
      state.XLA_AE_LINES = aeRaw.map(([hid, ln, cls, ccid, dr, cr, desc, lid]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat, ACCOUNT_NAME: CCID_LIST[ccid].name,
        ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: lid
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 95001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 62301, REF_AE_HEADER_ID: 95001 },
        { AE_HEADER_ID: 95002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10311, REF_AE_HEADER_ID: 95002 },
        { AE_HEADER_ID: 95003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_HIST', SOURCE_DISTRIBUTION_ID_NUM_1: 70301, REF_AE_HEADER_ID: 95003 }
      ];
    }
    if (stepIndex >= 6) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6201, LINE_NO: idx + 1, STATUS: 'PROCESSED',
        USER_JE_SOURCE_NAME: l.AE_HEADER_ID === 95001 ? 'Lease Accounting' : 'Payables',
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [{ JE_BATCH_ID: 55201, NAME: 'LA_TERMINATION_202710', STATUS: 'P', RUNNING_TOTAL_ACCOUNTED_DR: 2656000, RUNNING_TOTAL_ACCOUNTED_CR: 2656000 }];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66201, JE_BATCH_ID: 55201, LEDGER_ID: 2001, JE_SOURCE: 'Lease Accounting', JE_CATEGORY: 'Lease Termination', PERIOD_NAME: '2027-10', STATUS: 'P', RUNNING_TOTAL_DR: 2480000, RUNNING_TOTAL_CR: 2480000 },
        { JE_HEADER_ID: 66202, JE_BATCH_ID: 55201, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Termination Penalty AP', PERIOD_NAME: '2027-10', STATUS: 'P', RUNNING_TOTAL_DR: 176000, RUNNING_TOTAL_CR: 176000 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const isAp = l.AE_HEADER_ID !== 95001;
        return buildJournalRow(isAp ? 66202 : 66201, l.AE_LINE_NUM + (l.AE_HEADER_ID % 10) * 10, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, '2027-10', l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({ JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL' }));
      state.GL_BALANCES = computeBalancesWithOpening(opening, state.GL_JE_LINES, '2027-10');
    }

  // ==========================================================
  // CASE 4: LA_REVENUE_AR
  // ==========================================================
  } else if (caseId === 'LA_REVENUE_AR') {
    if (stepIndex >= 1) {
      const accrued = stepIndex >= 4;
      state.FLA_LEASES_ALL = [{
        LEASE_ID: 40002, LEASE_NUMBER: 'LA-REV-2026-101', LEASE_NAME: '本社ビル8Fサブリース（貸手契約）',
        ORG_ID: 300001, LEASE_TYPE_CODE: 'REVENUE', LEASE_ASSET_TYPE_CODE: 'PROPERTY', LEASE_STATUS_CODE: 'ACTIVE', LESSOR_PARTY_ID: 4002
      }];
      state.FLA_LEASE_DETAILS = [{
        LEASE_DETAIL_ID: 41501, LEASE_ID: 40002, VERSION_NUM: 1, LEASE_VERSION_NAME: 'REV_V1',
        PRIMARY_CLASSIFICATION_CODE: 'OPERATING', LEASE_START_DATE: '2026-04-01', LEASE_END_DATE: '2028-03-31'
      }];
      state.FLA_LEASE_ASSETS = [{
        LEASE_ASSET_ID: 42501, LEASE_DETAIL_ID: 41501, LEASE_ID: 40002, ASSET_NUMBER: 'LA-REV-UNIT-01',
        START_DATE: '2026-04-01', END_DATE: '2028-03-31', INSTALL_SITE_ID: 4202, CHANGE_TYPE_CODE: 'ADD', CHANGED_IN_VERSION_NUM: 1
      }];
      state.FLA_LEASE_PAYMENT_HEADERS = [{
        PAYMENT_HEADER_ID: 43501, PAYMENT_NUMBER: 'REV-SUB-01', LEASE_ID: 40002, LEASE_DETAIL_ID: 41501,
        LEASE_ASSET_ID: 42501, PAYMENT_TYPE_CODE: 'BASE_RENT', PAYMENT_FREQUENCY_CODE: 'MONTHLY',
        ROU_ASSET_FLAG: 'N', LIABILITY_FLAG: 'N', CURRENCY_CODE: 'JPY',
        BILL_TO_CUSTOMER_ID: 6001, BILL_TO_SITE_USE_ID: 6301, REVENUE_METHOD_CODE: 'LEASE_REVENUE'
      }];
      state.FLA_LEASE_PAYMENT_LINES = [{
        PAYMENT_LINE_ID: 44501, PAYMENT_HEADER_ID: 43501, PAYMENT_NUMBER: 'REV-SUB-01', LEASE_ID: 40002, LEASE_DETAIL_ID: 41501,
        PAYMENT_LINE_NUM: 1, ACTUAL_AMOUNT: 200000, PAYMENT_LINE_START_DATE: '2026-04-01', PAYMENT_LINE_END_DATE: '2028-03-31', NO_OF_PAYMENTS: 24
      }];
      state.FLA_LEASE_PAYMENT_ACCOUNTS = [
        { PAYMENT_ACCOUNT_ID: 45501, PAYMENT_NUMBER: 'REV-SUB-01', LEASE_ID: 40002, LEASE_DETAIL_ID: 41501, LEDGER_ID: 2001, ACCOUNT_CCID: 2490, ACCOUNT_CLASS_CODE: 'AR_CLEARING', CHANGE_TYPE_CODE: 'ADD' },
        { PAYMENT_ACCOUNT_ID: 45502, PAYMENT_NUMBER: 'REV-SUB-01', LEASE_ID: 40002, LEASE_DETAIL_ID: 41501, LEDGER_ID: 2001, ACCOUNT_CCID: 4201, ACCOUNT_CLASS_CODE: 'LEASE_REVENUE', CHANGE_TYPE_CODE: 'ADD' }
      ];
      state.FLA_SCHEDULE_HEADERS = [{
        SCHEDULE_HEADER_ID: 46501, LEASE_ID: 40002, LEASE_DETAIL_ID: 41501, VERSION_NUM: 1, PAYMENT_NUMBER: 'REV-SUB-01',
        REGIME_CODE: 'IFRS16', AMORTIZATION_START_DATE: '2026-04-01', AMORTIZATION_END_DATE: '2028-03-31',
        INTEREST_RATE: 0, ACTIVE_FLAG: 'Y', REVERSAL_FLAG: 'N', PARENT_RECORD_ID: null
      }];
      state.FLA_ACCRUAL_SCHEDULES = [{
        ACCRUAL_SCHEDULE_ID: 48501, SCHEDULE_HEADER_ID: 46501, SCHEDULE_DATE: '2026-04-30', PERIOD_NAME: '2026-04',
        INTEREST_AMOUNT: 0, SCHEDULE1_AMOUNT: accrued ? 200000 : 0, OPENING_FIN_ROU_AMOUNT: 0, CLOSING_FIN_ROU_AMOUNT: 0,
        ACCRUED_FLAG: accrued ? 'Y' : 'N', ACCRUAL_REVERSAL_FLAG: 'N'
      }];
    }
    if (stepIndex >= 2) {
      const paid = stepIndex >= 3;
      state.FLA_PAYMENT_ITEMS = [{
        PAYMENT_ITEM_ID: 49501, LEASE_ID: 40002, LEASE_DETAIL_ID: 41501, PAYMENT_NUMBER: 'REV-SUB-01',
        DUE_DATE: '2026-04-05', ACTUAL_AMOUNT: 200000, APPROVAL_STATUS_CODE: 'APPROVED', INTERFACE_STATUS_CODE: 'INTERFACED'
      }];
      state.RA_INTERFACE_LINES_ALL = [{
        INTERFACE_LINE_ID: 90001, BATCH_SOURCE_NAME: 'ORA_LEASE_ACCOUNTING', LINE_TYPE: 'LINE',
        DESCRIPTION: '2026年4月度 サブリース転貸料', AMOUNT: 200000, CURRENCY_CODE: 'JPY',
        ORIG_SYSTEM_BILL_CUSTOMER_ID: 6001, INTERFACE_STATUS: 'P'
      }];
      state.RA_CUSTOMER_TRX_ALL = [{
        CUSTOMER_TRX_ID: 30001, TRX_NUMBER: 'AR-LA-2026-001', CUST_TRX_TYPE_SEQ_ID: 301,
        BILL_TO_CUSTOMER_ID: 6001, TRX_DATE: '2026-04-05', COMPLETE_FLAG: 'Y'
      }];
      state.RA_CUSTOMER_TRX_LINES_ALL = [
        { CUSTOMER_TRX_LINE_ID: 31001, CUSTOMER_TRX_ID: 30001, LINE_NUMBER: 1, LINE_TYPE: 'LINE', EXTENDED_AMOUNT: 200000, DESCRIPTION: '転貸賃料' },
        { CUSTOMER_TRX_LINE_ID: 31002, CUSTOMER_TRX_ID: 30001, LINE_NUMBER: 2, LINE_TYPE: 'TAX', EXTENDED_AMOUNT: 20000, DESCRIPTION: '仮受消費税10%' }
      ];
      state.ZX_LINES = [{ TAX_LINE_ID: 22001, APPLICATION_ID: 222, TRX_ID: 30001, TRX_LINE_ID: 31001, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAXABLE_AMT: 200000, TAX_AMT: 20000 }];
      state.RA_CUST_TRX_LINE_GL_DIST_ALL = [
        { CUST_TRX_LINE_GL_DIST_ID: 32001, CUSTOMER_TRX_ID: 30001, ACCOUNT_CLASS: 'REC', CODE_COMBINATION_ID: 1110, AMOUNT: 220000 },
        { CUST_TRX_LINE_GL_DIST_ID: 32002, CUSTOMER_TRX_ID: 30001, ACCOUNT_CLASS: 'REV', CODE_COMBINATION_ID: 2490, AMOUNT: 200000 },
        { CUST_TRX_LINE_GL_DIST_ID: 32003, CUSTOMER_TRX_ID: 30001, ACCOUNT_CLASS: 'TAX', CODE_COMBINATION_ID: 2501, AMOUNT: 20000 }
      ];
      state.AR_PAYMENT_SCHEDULES_ALL = [{
        PAYMENT_SCHEDULE_ID: 40001, CUSTOMER_TRX_ID: 30001, CLASS: 'INV', AMOUNT_DUE_ORIGINAL: 220000,
        AMOUNT_DUE_REMAINING: paid ? 0 : 220000, STATUS: paid ? 'CL' : 'OP'
      }];
    }
    if (stepIndex >= 3) {
      state.AR_CASH_RECEIPTS_ALL = [{ CASH_RECEIPT_ID: 50001, RECEIPT_NUMBER: 'RCPT-LA-001', AMOUNT: 220000, RECEIPT_DATE: '2026-04-25', PAY_FROM_CUSTOMER: 6001, STATUS: 'APP' }];
      state.AR_CASH_RECEIPT_HISTORY_ALL = [{ CASH_RECEIPT_HISTORY_ID: 51001, CASH_RECEIPT_ID: 50001, STATUS: 'CLEARED', TRX_DATE: '2026-04-25', AMOUNT: 220000, CURRENT_RECORD_FLAG: 'Y' }];
      state.AR_RECEIVABLE_APPLICATIONS_ALL = [{ RECEIVABLE_APPLICATION_ID: 52001, CASH_RECEIPT_ID: 50001, APPLIED_CUSTOMER_TRX_ID: 30001, AMOUNT_APPLIED: 220000, STATUS: 'APP' }];
      state.AR_DISTRIBUTIONS_ALL = [
        { LINE_ID: 71001, SOURCE_ID: 51001, CODE_COMBINATION_ID: 1001, AMOUNT_DR: 220000, AMOUNT_CR: 0 },
        { LINE_ID: 71002, SOURCE_ID: 52001, CODE_COMBINATION_ID: 1110, AMOUNT_DR: 0, AMOUNT_CR: 220000 }
      ];
    }
    if (stepIndex >= 4) {
      state.FLA_ACCOUNTING_HEADERS_ALL = [{
        TRANSACTION_ID: 61501, LEASE_ID: 40002, LEDGER_ID: 2001, EVENT_ID: stepIndex >= 5 ? 96003 : null,
        ACCOUNTING_DATE: '2026-04-30', EVENT_TYPE_CODE: 'LEASE_REVENUE_ACCRUAL', ACCOUNTED_IN_GL_FLAG: stepIndex >= 6 ? 'Y' : 'N'
      }];
      state.FLA_ACCOUNTING_LINES = [{
        TRANSACTION_LINE_ID: 62501, TRANSACTION_ID: 61501, SCHEDULE_TYPE_CODE: 'LEASE_REVENUE',
        DR_CODE_COMBINATION_ID: 2490, CR_CODE_COMBINATION_ID: 4201, ENTERED_AMOUNT: 200000, ACCOUNTED_AMOUNT: 200000
      }];
      state.FLA_LEASE_BALANCES_ALL = [{
        LEASE_BALANCE_ID: 50501, LEASE_ID: 40002, ORG_ID: 300001, LEDGER_ID: 2001,
        PERIOD_NAME: '2026-04', REGIME_CODE: 'IFRS16', BALANCE_TYPE_CODE: 'LEASE_REVENUE_YTD', CURRENCY_CODE: 'JPY', CLOSING_BALANCE: 200000
      }];
    }
    if (stepIndex >= 5) {
      const glSt = stepIndex >= 6 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 86001, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'TRANSACTIONS', SOURCE_ID_INT_1: 30001 },
        { ENTITY_ID: 86002, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'RECEIPTS', SOURCE_ID_INT_1: 50001 },
        { ENTITY_ID: 86003, APPLICATION_ID: 10522, LEDGER_ID: 2001, ENTITY_CODE: 'LEASE_TRANSACTIONS', SOURCE_ID_INT_1: 40002 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 96001, ENTITY_ID: 86001, EVENT_TYPE_CODE: 'INV_CREATE', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 96002, ENTITY_ID: 86002, EVENT_TYPE_CODE: 'RECP_CREATE', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 96003, ENTITY_ID: 86003, EVENT_TYPE_CODE: 'LEASE_REVENUE_ACCRUAL', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 97001, APPLICATION_ID: 222, EVENT_ID: 96001, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Sales Invoices', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 97002, APPLICATION_ID: 222, EVENT_ID: 96002, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Receipts', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 97003, APPLICATION_ID: 10522, EVENT_ID: 96003, LEDGER_ID: 2001, JE_CATEGORY_NAME: 'Lease Revenue', GL_TRANSFER_STATUS_CODE: glSt }
      ];
      const aeRaw = [
        [97001, 1, 'RECEIVABLE', 1110, 220000, 0, 'サブリース売掛金', 761],
        [97001, 2, 'AR_CLEARING', 2490, 0, 200000, 'リースARクリアリング貸方', 762],
        [97001, 3, 'TAX', 2501, 0, 20000, '仮受消費税10%', 763],
        [97002, 1, 'CASH', 1001, 220000, 0, '普通預金 着金', 764],
        [97002, 2, 'RECEIVABLE', 1110, 0, 220000, '売掛金入金消込', 765],
        [97003, 1, 'AR_CLEARING', 2490, 200000, 0, 'リースARクリアリング振替消込', 766],
        [97003, 2, 'LEASE_REVENUE', 4201, 0, 200000, '受取リース収益認識', 767]
      ];
      state.XLA_AE_LINES = aeRaw.map(([hid, ln, cls, ccid, dr, cr, desc, lid]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat, ACCOUNT_NAME: CCID_LIST[ccid].name,
        ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: lid
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 97001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 32001, REF_AE_HEADER_ID: 97001 },
        { AE_HEADER_ID: 97002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 71001, REF_AE_HEADER_ID: 97002 },
        { AE_HEADER_ID: 97003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 62501, REF_AE_HEADER_ID: 97003 }
      ];
    }
    if (stepIndex >= 6) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6301, LINE_NO: idx + 1, STATUS: 'PROCESSED',
        USER_JE_SOURCE_NAME: l.AE_HEADER_ID === 97003 ? 'Lease Accounting' : 'Receivables',
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [{ JE_BATCH_ID: 55301, NAME: 'LA_REVENUE_AR_202604', STATUS: 'P', RUNNING_TOTAL_ACCOUNTED_DR: 640000, RUNNING_TOTAL_ACCOUNTED_CR: 640000 }];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66301, JE_BATCH_ID: 55301, LEDGER_ID: 2001, JE_SOURCE: 'Receivables', JE_CATEGORY: 'Sublease Invoice & Receipt', PERIOD_NAME: '2026-04', STATUS: 'P', RUNNING_TOTAL_DR: 440000, RUNNING_TOTAL_CR: 440000 },
        { JE_HEADER_ID: 66302, JE_BATCH_ID: 55301, LEDGER_ID: 2001, JE_SOURCE: 'Lease Accounting', JE_CATEGORY: 'Lease Revenue', PERIOD_NAME: '2026-04', STATUS: 'P', RUNNING_TOTAL_DR: 200000, RUNNING_TOTAL_CR: 200000 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const isLa = l.AE_HEADER_ID === 97003;
        return buildJournalRow(isLa ? 66302 : 66301, l.AE_LINE_NUM + (l.AE_HEADER_ID % 10) * 10, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, '2026-04', l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({ JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL' }));
      state.GL_BALANCES = computeBalancesWithOpening([], state.GL_JE_LINES, '2026-04');
    }
  }

  return { state };
}

const FusionLA = {
  AFF_SEGMENTS,
  CCID_LIST,
  LA_PROCESS_GUIDE,
  DOMAINS,
  TABLES,
  RELATIONS,
  CASES,
  computeStateAtStep
};

if (typeof window !== 'undefined') {
  window.FusionLA = FusionLA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FusionLA;
}
