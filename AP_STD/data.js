// Oracle Fusion ERP Financials 26D (OEDMF) 完全準拠データ定義
// AP請求書作成 → 消費税(10%/8%)・段階源泉徴収税(10.21%/20.42%)検証 → 初回一括支払 → 支払取消(Void)＆分割 → 明細別分割支払 → SLA会計作成 → GL転送・転記
// AFF 9セグメント体系: 会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3

const AFF_SEGMENTS = [
  { seg: 'SEGMENT1', name: '会社', sample: '01', desc: 'フュージョン株式会社 (プライマリ貸借一致セグメント)' },
  { seg: 'SEGMENT2', name: '部門', sample: '2100 / 9000 / 0000', desc: '2100:情報システム部 / 9000:財務経理部 / 0000:共通部門' },
  { seg: 'SEGMENT3', name: '勘定科目', sample: '1110 / 1350 / 2110 / 2160 / 5210', desc: '1110:普通預金 / 1350:仮払消費税 / 2110:買掛金 / 2160:預り金(源泉税) / 5210:外注費' },
  { seg: 'SEGMENT4', name: '補助科目', sample: '000 / 001 / 010 / 008 / 100 / 200 / 101 / 204', desc: '001:みずほ銀行 / 010:消費税10% / 008:軽減8% / 100:設計外注 / 200:制作外注 / 101:源泉10.21% / 204:源泉20.42%' },
  { seg: 'SEGMENT5', name: '税コード', sample: '00 / V10 / V08 / W10 / W20', desc: '00:対象外 / V10:課税仕入10% / V08:課税仕入8%(軽減) / W10:源泉10.21% / W20:源泉20.42%' },
  { seg: 'SEGMENT6', name: '管理コード', sample: 'PJ002 / 00000', desc: 'PJ002:基幹刷新案件 / 00000:共通' },
  { seg: 'SEGMENT7', name: '備考1', sample: '0000', desc: '予備分析セグメント1 (デフォルト 0000)' },
  { seg: 'SEGMENT8', name: '備考2', sample: '0000', desc: '予備分析セグメント2 (デフォルト 0000)' },
  { seg: 'SEGMENT9', name: '備考3', sample: '0000', desc: '予備分析セグメント3 (デフォルト 0000)' }
];

const CCID_LIST = [
  {
    CODE_COMBINATION_ID: 1001,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'A',
    ACCOUNT_TYPE_JP: '資産 (Asset)',
    NAME: '普通預金（みずほ銀行東京営業部）',
    SEGMENT1: '01', SEGMENT2: '9000', SEGMENT3: '1110', SEGMENT4: '001', SEGMENT5: '00', SEGMENT6: '00000', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-9000-1110-001-00-00000-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 1501,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'A',
    ACCOUNT_TYPE_JP: '資産 (Asset)',
    NAME: '仮払消費税（標準税率10%）',
    SEGMENT1: '01', SEGMENT2: '0000', SEGMENT3: '1350', SEGMENT4: '010', SEGMENT5: 'V10', SEGMENT6: '00000', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-0000-1350-010-V10-00000-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 1502,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'A',
    ACCOUNT_TYPE_JP: '資産 (Asset)',
    NAME: '仮払消費税（軽減税率8%）',
    SEGMENT1: '01', SEGMENT2: '0000', SEGMENT3: '1350', SEGMENT4: '008', SEGMENT5: 'V08', SEGMENT6: '00000', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-0000-1350-008-V08-00000-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 2101,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'L',
    ACCOUNT_TYPE_JP: '負債 (Liability)',
    NAME: '買掛金／未払金（情報システム部・PJ002）',
    SEGMENT1: '01', SEGMENT2: '2100', SEGMENT3: '2110', SEGMENT4: '000', SEGMENT5: '00', SEGMENT6: 'PJ002', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-2100-2110-000-00-PJ002-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 2201,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'L',
    ACCOUNT_TYPE_JP: '負債 (Liability)',
    NAME: '預り金・源泉所得税（100万円以下 10.21%）',
    SEGMENT1: '01', SEGMENT2: '9000', SEGMENT3: '2160', SEGMENT4: '101', SEGMENT5: 'W10', SEGMENT6: '00000', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-9000-2160-101-W10-00000-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 2202,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'L',
    ACCOUNT_TYPE_JP: '負債 (Liability)',
    NAME: '預り金・源泉所得税（100万円超 20.42%）',
    SEGMENT1: '01', SEGMENT2: '9000', SEGMENT3: '2160', SEGMENT4: '204', SEGMENT5: 'W20', SEGMENT6: '00000', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-9000-2160-204-W20-00000-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 5001,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'E',
    ACCOUNT_TYPE_JP: '費用 (Expense)',
    NAME: '外注費（明細1：システム設計報酬・税10%対象）',
    SEGMENT1: '01', SEGMENT2: '2100', SEGMENT3: '5210', SEGMENT4: '100', SEGMENT5: 'V10', SEGMENT6: 'PJ002', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-2100-5210-100-V10-PJ002-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 5002,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'E',
    ACCOUNT_TYPE_JP: '費用 (Expense)',
    NAME: '外注費（明細2：定期技術資料制作・軽減税8%対象）',
    SEGMENT1: '01', SEGMENT2: '2100', SEGMENT3: '5210', SEGMENT4: '200', SEGMENT5: 'V08', SEGMENT6: 'PJ002', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-2100-5210-200-V08-PJ002-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  }
];

const DOMAINS = [
  { id: 'ORG_GL_MASTER', name: 'A. 企業構造・元帳・期間・AFFマスタ (6)', shortName: '組織 / 元帳 / AFF', color: '#475569', bg: '#f1f5f9', x: 20, y: 16, w: 380, h: 196 },
  { id: 'TCA_POZ_MASTER', name: 'B. サプライヤマスタ TCA & POZ (6)', shortName: 'サプライヤマスタ', color: '#0284c7', bg: '#e0f2fe', x: 20, y: 224, w: 380, h: 196 },
  { id: 'AP_TAX_PAY_MASTER', name: 'C. AP・消費税(ZX)・源泉(AWT)・銀行(CE)・支払(IBY)マスタ (20)', shortName: 'AP / 税 / 源泉 / 銀行マスタ', color: '#0d9488', bg: '#ccfbf1', x: 20, y: 432, w: 380, h: 708 },
  { id: 'AP_TXN_PAYMENT', name: 'D. AP請求・消費税・源泉・支払予定・支払・取消トランザクション (20)', shortName: 'AP請求 / 税 / 支払 / 取消', color: '#2563eb', bg: '#dbeafe', x: 422, y: 16, w: 500, h: 1124 },
  { id: 'SLA_XLA', name: 'E. SLA (Subledger Accounting) 補助元帳 (5)', shortName: 'SLA (補助元帳会計)', color: '#7c3aed', bg: '#ede9fe', x: 944, y: 16, w: 320, h: 1124 },
  { id: 'GL_LEDGER', name: 'F. GL (General Ledger) 総勘定元帳 (6)', shortName: 'GL (総勘定元帳)', color: '#d97706', bg: '#fef3c7', x: 1286, y: 16, w: 314, h: 1124 }
];

// 全63テーブルの完全メタデータ（Oracle Fusion Financials 26D OEDMF準拠）
const TABLES = [
  // === A. 企業構造・元帳・期間・AFFマスタ (6) ===
  {
    id: 'XLE_ENTITY_PROFILES', name: 'XLE_ENTITY_PROFILES', jpName: '法的エンティティ・プロファイル',
    domain: 'ORG_GL_MASTER', pk: ['LEGAL_ENTITY_ID'], fks: [],
    pos: { x: 34, y: 48, w: 170, h: 42 },
    description: '法的実体（会社：フュージョン株式会社）を定義。AP請求書・支払・税務源泉報告の法的主体。',
    columns: [
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'pk', desc: '法的エンティティID' },
      { name: 'NAME', type: 'VARCHAR2(240)', role: 'normal', desc: '法的エンティティ名' },
      { name: 'LEGAL_ENTITY_IDENTIFIER', type: 'VARCHAR2(30)', role: 'normal', desc: '法的識別子' },
      { name: 'TRANSACTING_ENTITY_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '取引エンティティフラグ' },
      { name: 'EFFECTIVE_FROM', type: 'DATE', role: 'normal', desc: '有効開始日' }
    ]
  },
  {
    id: 'HR_ALL_ORGANIZATION_UNITS_F', name: 'HR_ALL_ORGANIZATION_UNITS_F', jpName: '組織ユニット基本表 (BU)',
    domain: 'ORG_GL_MASTER', pk: ['ORGANIZATION_ID', 'EFFECTIVE_START_DATE', 'EFFECTIVE_END_DATE'], fks: ['LOCATION_ID'],
    pos: { x: 214, y: 48, w: 170, h: 42 },
    description: '日付有効管理される組織ユニット表（BU_ID = ORG_ID = 401）。APトランザクションのORG_ID参照元。',
    columns: [
      { name: 'ORGANIZATION_ID', type: 'NUMBER(18)', role: 'pk', desc: '組織ID (ORG_ID/BU_ID)' },
      { name: 'EFFECTIVE_START_DATE', type: 'DATE', role: 'pk', desc: '有効開始日' },
      { name: 'EFFECTIVE_END_DATE', type: 'DATE', role: 'pk', desc: '有効終了日' },
      { name: 'BUSINESS_GROUP_ID', type: 'NUMBER(18)', role: 'fk', desc: 'ビジネスグループID' },
      { name: 'ORGANIZATION_CODE', type: 'VARCHAR2(150)', role: 'normal', desc: '組織コード' },
      { name: 'INTERNAL_EXTERNAL_FLAG', type: 'VARCHAR2(30)', role: 'flag', desc: '内外区分 (INT)' },
      { name: 'TYPE', type: 'VARCHAR2(30)', role: 'flag', desc: '組織タイプ (FUN_BUSINESS_UNIT)' },
      { name: 'LOCATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '所在地ID' }
    ]
  },
  {
    id: 'GL_LEDGERS', name: 'GL_LEDGERS', jpName: '元帳マスタ',
    domain: 'ORG_GL_MASTER', pk: ['LEDGER_ID'], fks: ['CHART_OF_ACCOUNTS_ID'],
    pos: { x: 34, y: 98, w: 170, h: 42 },
    description: '会計通貨(JPY)、カレンダ、勘定体系(COA=101)、SLA会計方式(STANDARD_ACCRUAL)を定義する元帳マスタ。',
    columns: [
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'pk', desc: '元帳ID' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: 'normal', desc: '元帳名称' },
      { name: 'SHORT_NAME', type: 'VARCHAR2(20)', role: 'normal', desc: '短縮名' },
      { name: 'LEDGER_CATEGORY_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '元帳カテゴリ' },
      { name: 'CHART_OF_ACCOUNTS_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定体系ID (101)' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '機能通貨コード' },
      { name: 'PERIOD_SET_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計カレンダ名' },
      { name: 'ACCOUNTED_PERIOD_TYPE', type: 'VARCHAR2(15)', role: 'normal', desc: '期間タイプ' },
      { name: 'SLA_ACCOUNTING_METHOD_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'SLA補助元帳会計方式' }
    ]
  },
  {
    id: 'GL_PERIOD_STATUSES', name: 'GL_PERIOD_STATUSES', jpName: '会計期間ステータス',
    domain: 'ORG_GL_MASTER', pk: ['APPLICATION_ID', 'LEDGER_ID', 'PERIOD_NAME'], fks: ['LEDGER_ID'],
    pos: { x: 214, y: 98, w: 170, h: 42 },
    description: 'AP (APPLICATION_ID=200) と GL (101) の会計期間 2026-11 のオープン状態 (CLOSING_STATUS=O) を管理。',
    columns: [
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'アプリID (200:AP, 101:GL)' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'pk', desc: '元帳ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID (互換維持列)' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'pk', desc: '会計期間名 (2026-11)' },
      { name: 'CLOSING_STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'クローズ状況 (O=Open)' },
      { name: 'START_DATE', type: 'DATE', role: 'normal', desc: '期間開始日' },
      { name: 'END_DATE', type: 'DATE', role: 'normal', desc: '期間終了日' },
      { name: 'PERIOD_YEAR', type: 'NUMBER(15)', role: 'normal', desc: '会計年度' },
      { name: 'PERIOD_NUM', type: 'NUMBER(15)', role: 'normal', desc: '期間番号' }
    ]
  },
  {
    id: 'FND_ID_FLEX_SEGMENTS', name: 'FND_ID_FLEX_SEGMENTS', jpName: 'キーフレックスフィールド・セグメント定義',
    domain: 'ORG_GL_MASTER', pk: ['APPLICATION_ID', 'ID_FLEX_CODE', 'ID_FLEX_NUM', 'APPLICATION_COLUMN_NAME'], fks: [],
    pos: { x: 34, y: 148, w: 170, h: 42 },
    description: 'AFF (GL#, COA=101) の9セグメント（会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3）定義。',
    columns: [
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'アプリID (101=GL)' },
      { name: 'ID_FLEX_CODE', type: 'VARCHAR2(4)', role: 'pk', desc: 'KFFコード (GL#)' },
      { name: 'ID_FLEX_NUM', type: 'NUMBER(18)', role: 'pk', desc: '構造インスタンス番号 (101)' },
      { name: 'APPLICATION_COLUMN_NAME', type: 'VARCHAR2(30)', role: 'pk', desc: '物理列名 (SEGMENT1..9)' },
      { name: 'SEGMENT_NAME', type: 'VARCHAR2(30)', role: 'normal', desc: 'セグメント名' },
      { name: 'SEGMENT_NUM', type: 'NUMBER(15)', role: 'normal', desc: 'セグメント順序' },
      { name: 'ENABLED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '有効フラグ' },
      { name: 'REQUIRED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '必須フラグ' },
      { name: 'FLEX_VALUE_SET_ID', type: 'NUMBER(18)', role: 'fk', desc: '値セットID' }
    ]
  },
  {
    id: 'GL_CODE_COMBINATIONS', name: 'GL_CODE_COMBINATIONS', jpName: '勘定コード組合せ (AFF 9セグメント)',
    domain: 'ORG_GL_MASTER', pk: ['CODE_COMBINATION_ID'], fks: ['CHART_OF_ACCOUNTS_ID'],
    pos: { x: 214, y: 148, w: 170, h: 42 },
    description: '外注費・仮払消費税(10%/8%)・買掛金・源泉所得税預り金(10.21%/20.42%)・普通預金の8通りのCCID。',
    columns: [
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'CCID (勘定コード組合せID)' },
      { name: 'CHART_OF_ACCOUNTS_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定体系ID (101)' },
      { name: 'ACCOUNT_TYPE', type: 'VARCHAR2(1)', role: 'flag', desc: '勘定タイプ (A/L/E)' },
      { name: 'ENABLED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '有効フラグ' },
      { name: 'DETAIL_POSTING_ALLOWED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '明細転記許可フラグ' },
      { name: 'SEGMENT1', type: 'VARCHAR2(25)', role: 'normal', desc: '会社' },
      { name: 'SEGMENT2', type: 'VARCHAR2(25)', role: 'normal', desc: '部門' },
      { name: 'SEGMENT3', type: 'VARCHAR2(25)', role: 'normal', desc: '勘定科目' },
      { name: 'SEGMENT4', type: 'VARCHAR2(25)', role: 'normal', desc: '補助科目' },
      { name: 'SEGMENT5', type: 'VARCHAR2(25)', role: 'normal', desc: '税コード' },
      { name: 'SEGMENT6', type: 'VARCHAR2(25)', role: 'normal', desc: '管理コード' },
      { name: 'SEGMENT7', type: 'VARCHAR2(25)', role: 'normal', desc: '備考1' },
      { name: 'SEGMENT8', type: 'VARCHAR2(25)', role: 'normal', desc: '備考2' },
      { name: 'SEGMENT9', type: 'VARCHAR2(25)', role: 'normal', desc: '備考3' }
    ]
  },

  // === B. サプライヤマスタ TCA & POZ (6) ===
  {
    id: 'HZ_PARTIES', name: 'HZ_PARTIES', jpName: 'パーティマスタ (取引先実体)',
    domain: 'TCA_POZ_MASTER', pk: ['PARTY_ID'], fks: [],
    pos: { x: 34, y: 256, w: 170, h: 42 },
    description: 'TCA最上位エンティティ。仕入先（株式会社テックパートナーズ）の法人実体情報を保持。',
    columns: [
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'pk', desc: 'パーティID' },
      { name: 'PARTY_NUMBER', type: 'VARCHAR2(30)', role: 'normal', desc: 'パーティ番号' },
      { name: 'PARTY_NAME', type: 'VARCHAR2(360)', role: 'normal', desc: 'パーティ名' },
      { name: 'PARTY_TYPE', type: 'VARCHAR2(30)', role: 'normal', desc: 'パーティタイプ' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (A=有効)' }
    ]
  },
  {
    id: 'HZ_LOCATIONS', name: 'HZ_LOCATIONS', jpName: 'ロケーション (物理住所)',
    domain: 'TCA_POZ_MASTER', pk: ['LOCATION_ID'], fks: [],
    pos: { x: 214, y: 256, w: 170, h: 42 },
    description: '取引先事業所の物理住所（国・都道府県・市区町村・番地）を保持するTCA住所表。',
    columns: [
      { name: 'LOCATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'ロケーションID' },
      { name: 'ADDRESS1', type: 'VARCHAR2(240)', role: 'normal', desc: '住所1' },
      { name: 'CITY', type: 'VARCHAR2(60)', role: 'normal', desc: '市区町村' },
      { name: 'STATE', type: 'VARCHAR2(60)', role: 'normal', desc: '都道府県' },
      { name: 'POSTAL_CODE', type: 'VARCHAR2(60)', role: 'normal', desc: '郵便番号' },
      { name: 'COUNTRY', type: 'VARCHAR2(60)', role: 'normal', desc: '国コード (JP)' }
    ]
  },
  {
    id: 'HZ_PARTY_SITES', name: 'HZ_PARTY_SITES', jpName: 'パーティサイト (拠点紐付)',
    domain: 'TCA_POZ_MASTER', pk: ['PARTY_SITE_ID'], fks: ['PARTY_ID', 'LOCATION_ID'],
    pos: { x: 34, y: 306, w: 170, h: 42 },
    description: 'パーティと住所ロケーションを結び付け、サプライヤサイトや請求書のPARTY_SITE_IDとして参照される。',
    columns: [
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'pk', desc: 'パーティサイトID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティID' },
      { name: 'LOCATION_ID', type: 'NUMBER(18)', role: 'fk', desc: 'ロケーションID' },
      { name: 'PARTY_SITE_NUMBER', type: 'VARCHAR2(30)', role: 'normal', desc: 'パーティサイト番号' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (A)' },
      { name: 'IDENTIFYING_ADDRESS_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '主識別住所フラグ' }
    ]
  },
  {
    id: 'POZ_SUPPLIERS', name: 'POZ_SUPPLIERS', jpName: 'サプライヤマスタ (POZ)',
    domain: 'TCA_POZ_MASTER', pk: ['VENDOR_ID'], fks: ['PARTY_ID'],
    pos: { x: 214, y: 306, w: 170, h: 42 },
    description: '購買/買掛共通のサプライヤマスタ。サプライヤ番号(SEGMENT1)やパーティ(HZ_PARTIES)を保持。',
    columns: [
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'pk', desc: 'サプライヤID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティID' },
      { name: 'SEGMENT1', type: 'VARCHAR2(30)', role: 'normal', desc: 'サプライヤ番号 (SUP-1001)' },
      { name: 'VENDOR_TYPE_LOOKUP_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'サプライヤタイプ' },
      { name: 'ENABLED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '有効フラグ' }
    ]
  },
  {
    id: 'POZ_SUPPLIER_SITES_ALL_M', name: 'POZ_SUPPLIER_SITES_ALL_M', jpName: 'サプライヤサイト (日付有効)',
    domain: 'TCA_POZ_MASTER', pk: ['VENDOR_SITE_ID', 'EFFECTIVE_START_DATE', 'EFFECTIVE_END_DATE'], fks: ['VENDOR_ID', 'PRC_BU_ID', 'PARTY_SITE_ID'],
    pos: { x: 34, y: 356, w: 170, h: 42 },
    description: '調達BU・住所・取引目的(PAY_SITE_FLAG=Y)ごとのサプライヤサイト属性。AP請求書VENDOR_SITE_ID参照先。',
    columns: [
      { name: 'VENDOR_SITE_ID', type: 'NUMBER(18)', role: 'pk', desc: 'サプライヤサイトID' },
      { name: 'EFFECTIVE_START_DATE', type: 'DATE', role: 'pk', desc: '有効開始日' },
      { name: 'EFFECTIVE_END_DATE', type: 'DATE', role: 'pk', desc: '有効終了日' },
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'fk', desc: 'サプライヤID' },
      { name: 'PRC_BU_ID', type: 'NUMBER(18)', role: 'fk', desc: '調達BU ID' },
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティサイトID' },
      { name: 'VENDOR_SITE_CODE', type: 'VARCHAR2(240)', role: 'normal', desc: 'サイトコード' },
      { name: 'PURCHASING_SITE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '購買サイトフラグ' },
      { name: 'PAY_SITE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '支払サイトフラグ (Y)' }
    ]
  },
  {
    id: 'POZ_SITE_ASSIGNMENTS_ALL_M', name: 'POZ_SITE_ASSIGNMENTS_ALL_M', jpName: 'サプライヤサイトBU割当',
    domain: 'TCA_POZ_MASTER', pk: ['ASSIGNMENT_ID', 'EFFECTIVE_START_DATE', 'EFFECTIVE_END_DATE'], fks: ['VENDOR_SITE_ID', 'BU_ID', 'ACCTS_PAY_CODE_COMBINATION_ID', 'PREPAY_CODE_COMBINATION_ID', 'AWT_GROUP_ID'],
    pos: { x: 214, y: 356, w: 170, h: 42 },
    description: 'サイトと請求BUの割当。買掛金負債CCID(2101)と源泉徴収税グループ(AWT_GROUP_ID=8001)をデフォルト供給。',
    columns: [
      { name: 'ASSIGNMENT_ID', type: 'NUMBER(18)', role: 'pk', desc: 'サイト割当ID' },
      { name: 'EFFECTIVE_START_DATE', type: 'DATE', role: 'pk', desc: '有効開始日' },
      { name: 'EFFECTIVE_END_DATE', type: 'DATE', role: 'pk', desc: '有効終了日' },
      { name: 'VENDOR_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'サプライヤサイトID' },
      { name: 'BU_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求BU ID (401)' },
      { name: 'ACCTS_PAY_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '買掛金負債CCID (2101)' },
      { name: 'PREPAY_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '前払金CCID' },
      { name: 'AWT_GROUP_ID', type: 'NUMBER(18)', role: 'fk', desc: '源泉徴収税グループID (8001)' }
    ]
  },

  // === C. AP・消費税(ZX)・源泉(AWT)・銀行(CE)・支払(IBY)マスタ (20) ===
  {
    id: 'FINANCIALS_SYSTEM_PARAMS_ALL', name: 'FINANCIALS_SYSTEM_PARAMS_ALL', jpName: '会計システム共通オプション',
    domain: 'AP_TAX_PAY_MASTER', pk: ['SET_OF_BOOKS_ID', 'ORG_ID'], fks: ['ORG_ID', 'SET_OF_BOOKS_ID', 'ACCTS_PAY_CODE_COMBINATION_ID'],
    pos: { x: 34, y: 470, w: 170, h: 46 },
    description: 'Payables/Procurement共通オプション。BU単位の標準買掛金負債CCIDと元帳を保持する。',
    columns: [
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'pk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'pk', desc: '元帳ID' },
      { name: 'ACCTS_PAY_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '標準買掛金CCID (2101)' }
    ]
  },
  {
    id: 'AP_SYSTEM_PARAMETERS_ALL', name: 'AP_SYSTEM_PARAMETERS_ALL', jpName: 'APシステムオプション',
    domain: 'AP_TAX_PAY_MASTER', pk: ['ORG_ID'], fks: ['SET_OF_BOOKS_ID'],
    pos: { x: 214, y: 470, w: 170, h: 46 },
    description: 'AP請求/支払オプション。ALLOW_AWT_FLAG=Y、CREATE_AWT_DISTS_TYPE=APPROVAL（検証時源泉計上）を設定。',
    columns: [
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'pk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'BASE_CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '機能通貨 (JPY)' },
      { name: 'ALLOW_AWT_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '源泉徴収税有効フラグ (Y)' },
      { name: 'CREATE_AWT_DISTS_TYPE', type: 'VARCHAR2(25)', role: 'flag', desc: '源泉計上時点 (APPROVAL=検証時)' }
    ]
  },
  {
    id: 'AP_TERMS_B', name: 'AP_TERMS_B', jpName: 'AP支払条件ヘッダ (基本)',
    domain: 'AP_TAX_PAY_MASTER', pk: ['TERM_ID'], fks: [],
    pos: { x: 34, y: 535, w: 170, h: 46 },
    description: '請求書検証時に支払予定(AP_PAYMENT_SCHEDULES_ALL)の期日を算出するためのAP支払条件基本表。',
    columns: [
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払条件ID' },
      { name: 'TYPE', type: 'VARCHAR2(15)', role: 'flag', desc: '支払条件タイプ' },
      { name: 'ENABLED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '有効フラグ' },
      { name: 'DUE_CUTOFF_DAY', type: 'NUMBER', role: 'normal', desc: '締日' },
      { name: 'START_DATE_ACTIVE', type: 'DATE', role: 'normal', desc: '有効開始日' }
    ]
  },
  {
    id: 'AP_TERMS_TL', name: 'AP_TERMS_TL', jpName: 'AP支払条件 (翻訳名称)',
    domain: 'AP_TAX_PAY_MASTER', pk: ['TERM_ID', 'LANGUAGE'], fks: ['TERM_ID'],
    pos: { x: 214, y: 535, w: 170, h: 46 },
    description: 'AP支払条件の言語別名称（例：Net 25 / 当月25日払）を保持する翻訳表。',
    columns: [
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払条件ID' },
      { name: 'LANGUAGE', type: 'VARCHAR2(4)', role: 'pk', desc: '言語コード (JA)' },
      { name: 'SOURCE_LANG', type: 'VARCHAR2(4)', role: 'normal', desc: '元言語' },
      { name: 'NAME', type: 'VARCHAR2(50)', role: 'normal', desc: '支払条件名' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(240)', role: 'normal', desc: '説明' }
    ]
  },
  {
    id: 'AP_TERMS_LINES', name: 'AP_TERMS_LINES', jpName: 'AP支払条件明細',
    domain: 'AP_TAX_PAY_MASTER', pk: ['TERM_ID', 'SEQUENCE_NUM'], fks: ['TERM_ID'],
    pos: { x: 34, y: 600, w: 170, h: 46 },
    description: '支払割合(DUE_PERCENT=100)と期日日数(DUE_DAYS=25)を定義。当初予定期日 2026-11-30 の計算根拠。',
    columns: [
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払条件ID' },
      { name: 'SEQUENCE_NUM', type: 'NUMBER(15)', role: 'pk', desc: '分割順番' },
      { name: 'DUE_PERCENT', type: 'NUMBER', role: 'amount', desc: '支払割合 (%)' },
      { name: 'DUE_DAYS', type: 'NUMBER(15)', role: 'normal', desc: '猶予日数 (25日)' }
    ]
  },
  {
    id: 'ZX_REGIMES_B', name: 'ZX_REGIMES_B', jpName: '税制度マスタ (Fusion Tax)',
    domain: 'AP_TAX_PAY_MASTER', pk: ['TAX_REGIME_ID'], fks: [],
    pos: { x: 214, y: 600, w: 170, h: 46 },
    description: '日本の消費税制度 (JP_CONSUMPTION_TAX) と税控除可否フラグを管理。',
    columns: [
      { name: 'TAX_REGIME_ID', type: 'NUMBER(18)', role: 'pk', desc: '税制度ID' },
      { name: 'TAX_REGIME_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税制度コード' },
      { name: 'TAX_REGIME_TYPE_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '制度タイプ (TAX)' },
      { name: 'COUNTRY_CODE', type: 'VARCHAR2(2)', role: 'normal', desc: '国コード (JP)' },
      { name: 'EFFECTIVE_FROM', type: 'DATE', role: 'normal', desc: '有効開始日' },
      { name: 'ALLOW_RECOVERABILITY_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '仕入税額控除許可 (Y)' }
    ]
  },
  {
    id: 'ZX_TAXES_B', name: 'ZX_TAXES_B', jpName: '税金定義マスタ',
    domain: 'AP_TAX_PAY_MASTER', pk: ['TAX_ID'], fks: [],
    pos: { x: 34, y: 665, w: 170, h: 46 },
    description: '日本の消費税(JP_CONSUMPTION_TAX)および源泉徴収用管理など税目単位の処理稼働フラグを保持。',
    columns: [
      { name: 'TAX_ID', type: 'NUMBER(18)', role: 'pk', desc: '税金ID' },
      { name: 'TAX_REGIME_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税制度コード' },
      { name: 'TAX', type: 'VARCHAR2(30)', role: 'normal', desc: '税金コード' },
      { name: 'TAX_TYPE_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '税タイプ (VAT)' },
      { name: 'LIVE_FOR_PROCESSING_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '取引適用有効フラグ (Y)' },
      { name: 'EFFECTIVE_FROM', type: 'DATE', role: 'normal', desc: '有効開始日' }
    ]
  },
  {
    id: 'ZX_STATUS_B', name: 'ZX_STATUS_B', jpName: '税ステータスマスタ',
    domain: 'AP_TAX_PAY_MASTER', pk: ['TAX_STATUS_ID'], fks: [],
    pos: { x: 214, y: 665, w: 170, h: 46 },
    description: '標準税率 (STANDARD: 10%) と軽減税率 (REDUCED: 8%) の2種類の税ステータスを定義。',
    columns: [
      { name: 'TAX_STATUS_ID', type: 'NUMBER(18)', role: 'pk', desc: '税ステータスID' },
      { name: 'TAX_REGIME_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税制度コード' },
      { name: 'TAX', type: 'VARCHAR2(30)', role: 'normal', desc: '税金コード' },
      { name: 'TAX_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '税ステータス (STANDARD/REDUCED)' },
      { name: 'DEFAULT_STATUS_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'デフォルトフラグ' },
      { name: 'EFFECTIVE_FROM', type: 'DATE', role: 'normal', desc: '有効開始日' }
    ]
  },
  {
    id: 'ZX_RATES_B', name: 'ZX_RATES_B', jpName: '消費税率マスタ',
    domain: 'AP_TAX_PAY_MASTER', pk: ['TAX_RATE_ID'], fks: [],
    pos: { x: 34, y: 730, w: 170, h: 46 },
    description: '仮払消費税10% (JP_TAX_10 / 24110) と軽減消費税8% (JP_TAX_8_RED / 24108) の税率定義。',
    columns: [
      { name: 'TAX_RATE_ID', type: 'NUMBER(18)', role: 'pk', desc: '税率ID' },
      { name: 'TAX_REGIME_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税制度コード' },
      { name: 'TAX', type: 'VARCHAR2(30)', role: 'normal', desc: '税金コード' },
      { name: 'TAX_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '税ステータス' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: 'normal', desc: '税率コード' },
      { name: 'PERCENTAGE_RATE', type: 'NUMBER', role: 'amount', desc: '消費税率 (%)' },
      { name: 'RATE_TYPE_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税率タイプ' },
      { name: 'EFFECTIVE_FROM', type: 'DATE', role: 'normal', desc: '有効開始日' },
      { name: 'ACTIVE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '有効フラグ' }
    ]
  },
  {
    id: 'AP_AWT_GROUPS', name: 'AP_AWT_GROUPS', jpName: '源泉徴収税グループ (AWT)',
    domain: 'AP_TAX_PAY_MASTER', pk: ['GROUP_ID'], fks: [],
    pos: { x: 214, y: 730, w: 170, h: 46 },
    description: '報酬・料金等に対する源泉所得税グループ (GROUP_ID=8001) を定義。請求明細・サイトから参照。',
    columns: [
      { name: 'GROUP_ID', type: 'NUMBER(18)', role: 'pk', desc: '源泉税グループID' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: 'normal', desc: 'グループ名' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(240)', role: 'normal', desc: '説明' },
      { name: 'INACTIVE_DATE', type: 'DATE', role: 'normal', desc: '無効日' }
    ]
  },
  {
    id: 'AP_AWT_GROUP_TAXES_ALL', name: 'AP_AWT_GROUP_TAXES_ALL', jpName: '源泉グループ税割当',
    domain: 'AP_TAX_PAY_MASTER', pk: ['GROUP_ID', 'TAX_NAME'], fks: ['GROUP_ID', 'ORG_ID'],
    pos: { x: 34, y: 795, w: 170, h: 46 },
    description: '源泉グループ(8001)と源泉税コード(JP_WHT_TIER)の紐付と適用順位(RANK)を管理。',
    columns: [
      { name: 'GROUP_ID', type: 'NUMBER(18)', role: 'pk', desc: '源泉税グループID' },
      { name: 'TAX_NAME', type: 'VARCHAR2(15)', role: 'pk', desc: '源泉税コード' },
      { name: 'RANK', type: 'NUMBER(15)', role: 'normal', desc: '適用優先順位' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'AP_AWT_TAX_RATES_ALL', name: 'AP_AWT_TAX_RATES_ALL', jpName: '段階源泉徴収税率マスタ',
    domain: 'AP_TAX_PAY_MASTER', pk: ['TAX_RATE_ID'], fks: ['ORG_ID'],
    pos: { x: 214, y: 795, w: 170, h: 46 },
    description: '段階税率定義：0〜100万円以下は 10.21% (8201)、100万円超は 20.42% (8202)。',
    columns: [
      { name: 'TAX_RATE_ID', type: 'NUMBER(18)', role: 'pk', desc: '源泉税率ID' },
      { name: 'TAX_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '源泉税コード' },
      { name: 'RATE_TYPE', type: 'VARCHAR2(25)', role: 'flag', desc: 'レートタイプ (STANDARD)' },
      { name: 'TAX_RATE', type: 'NUMBER', role: 'amount', desc: '源泉税率 (%)' },
      { name: 'START_AMOUNT', type: 'NUMBER', role: 'amount', desc: '金額範囲開始 (下限)' },
      { name: 'END_AMOUNT', type: 'NUMBER', role: 'amount', desc: '金額範囲終了 (上限)' },
      { name: 'START_DATE', type: 'DATE', role: 'normal', desc: '適用開始日' },
      { name: 'END_DATE', type: 'DATE', role: 'normal', desc: '適用終了日' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'CE_BANK_ACCOUNTS', name: 'CE_BANK_ACCOUNTS', jpName: '自社銀行口座マスタ (CE)',
    domain: 'AP_TAX_PAY_MASTER', pk: ['BANK_ACCOUNT_ID'], fks: ['ACCOUNT_OWNER_ORG_ID', 'ASSET_CODE_COMBINATION_ID'],
    pos: { x: 34, y: 860, w: 170, h: 46 },
    description: 'みずほ銀行東京営業部の自社口座と資産CCID (1001) を定義するCash Management表。',
    columns: [
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'pk', desc: '銀行口座ID' },
      { name: 'BANK_ACCOUNT_NAME', type: 'VARCHAR2(100)', role: 'normal', desc: '口座名' },
      { name: 'BANK_ACCOUNT_NUM', type: 'VARCHAR2(100)', role: 'normal', desc: '口座番号' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨コード' },
      { name: 'ACCOUNT_OWNER_ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: '所有法的エンティティID' },
      { name: 'CASH_CLEARING_CCID', type: 'NUMBER(18)', role: 'fk', desc: '現金決済CCID' },
      { name: 'ASSET_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '普通預金CCID (1001)' }
    ]
  },
  {
    id: 'CE_BANK_ACCT_USES_ALL', name: 'CE_BANK_ACCT_USES_ALL', jpName: '銀行口座BU利用設定',
    domain: 'AP_TAX_PAY_MASTER', pk: ['BANK_ACCT_USE_ID'], fks: ['BANK_ACCOUNT_ID', 'ORG_ID', 'LEGAL_ENTITY_ID'],
    pos: { x: 214, y: 860, w: 170, h: 46 },
    description: '自社口座のBU 401におけるAP支払利用を有効化 (AP_USE_ENABLE_FLAG=Y)。',
    columns: [
      { name: 'BANK_ACCT_USE_ID', type: 'NUMBER(18)', role: 'pk', desc: '銀行口座利用ID' },
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'fk', desc: '銀行口座ID' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' },
      { name: 'AP_USE_ENABLE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'AP利用有効フラグ (Y)' },
      { name: 'AR_USE_ENABLE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'AR利用有効フラグ' },
      { name: 'PRIMARY_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'プライマリフラグ' }
    ]
  },
  {
    id: 'CE_PAYMENT_DOCUMENTS', name: 'CE_PAYMENT_DOCUMENTS', jpName: '支払ドキュメント連番管理',
    domain: 'AP_TAX_PAY_MASTER', pk: ['PAYMENT_DOCUMENT_ID'], fks: ['INTERNAL_BANK_ACCOUNT_ID'],
    pos: { x: 34, y: 925, w: 170, h: 46 },
    description: '振込データ/支払文書の連番(LAST_ISSUED_DOCUMENT_NUMBER)を払出ごとに1001→1002→1003と採番・更新。',
    columns: [
      { name: 'PAYMENT_DOCUMENT_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払文書ID' },
      { name: 'PAYMENT_DOCUMENT_NAME', type: 'VARCHAR2(100)', role: 'normal', desc: '支払文書名' },
      { name: 'INTERNAL_BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'fk', desc: '自社銀行口座ID' },
      { name: 'PAPER_STOCK_TYPE', type: 'VARCHAR2(30)', role: 'flag', desc: '用紙種別' },
      { name: 'FORMAT_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'フォーマットコード' },
      { name: 'FIRST_AVAILABLE_DOCUMENT_NUM', type: 'NUMBER', role: 'normal', desc: '開始番号' },
      { name: 'LAST_AVAILABLE_DOCUMENT_NUMBER', type: 'NUMBER', role: 'normal', desc: '終了番号' },
      { name: 'LAST_ISSUED_DOCUMENT_NUMBER', type: 'NUMBER', role: 'flag', desc: '最終発行番号 (1000→1003)' },
      { name: 'MANUAL_PAYMENTS_ONLY_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '手動限定フラグ' }
    ]
  },
  {
    id: 'IBY_PAYMENT_METHODS_B', name: 'IBY_PAYMENT_METHODS_B', jpName: 'IBY支払方法マスタ',
    domain: 'AP_TAX_PAY_MASTER', pk: ['PAYMENT_METHOD_CODE'], fks: [],
    pos: { x: 214, y: 925, w: 170, h: 46 },
    description: '電子銀行振込 (EFT) などの支払方法定義。AP請求・支払選択・支払指示から共通参照。',
    columns: [
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'pk', desc: '支払方法コード (EFT)' },
      { name: 'SUPPORT_BILLS_PAYABLE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '期日払手形対応フラグ' },
      { name: 'MATURITY_DATE_OFFSET_DAYS', type: 'NUMBER(18)', role: 'normal', desc: '満期日オフセット日数' },
      { name: 'INACTIVE_DATE', type: 'DATE', role: 'normal', desc: '無効日' }
    ]
  },
  {
    id: 'IBY_ACCT_PMT_PROFILES_B', name: 'IBY_ACCT_PMT_PROFILES_B', jpName: 'IBY支払処理プロファイル (PPP)',
    domain: 'AP_TAX_PAY_MASTER', pk: ['PAYMENT_PROFILE_ID'], fks: [],
    pos: { x: 34, y: 990, w: 170, h: 46 },
    description: '全銀振込(ZENGIN_EFT)の支払指示作成・ファイル生成・送受信設定を規定するプロファイル。',
    columns: [
      { name: 'PAYMENT_PROFILE_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払処理プロファイルID' },
      { name: 'SYSTEM_PROFILE_CODE', type: 'VARCHAR2(100)', role: 'normal', desc: 'システムプロファイルコード' },
      { name: 'BEP_ACCOUNT_ID', type: 'NUMBER(18)', role: 'fk', desc: '決済システム口座ID' },
      { name: 'SECURITY_CONFIGURATION_ID', type: 'NUMBER(18)', role: 'fk', desc: 'セキュリティ設定ID' },
      { name: 'TRANSMIT_CONFIGURATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '伝送設定ID' }
    ]
  },
  {
    id: 'IBY_EXT_BANK_ACCOUNTS', name: 'IBY_EXT_BANK_ACCOUNTS', jpName: 'サプライヤ受取銀行口座 (外部)',
    domain: 'AP_TAX_PAY_MASTER', pk: ['EXT_BANK_ACCOUNT_ID'], fks: [],
    pos: { x: 214, y: 990, w: 170, h: 46 },
    description: '仕入先（株式会社テックパートナーズ）側の振込先口座（三菱UFJ銀行渋谷支店）を保持。',
    columns: [
      { name: 'EXT_BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'pk', desc: '外部銀行口座ID' },
      { name: 'BANK_ACCOUNT_NUM', type: 'VARCHAR2(100)', role: 'normal', desc: '口座番号' },
      { name: 'BANK_ACCOUNT_NAME', type: 'VARCHAR2(80)', role: 'normal', desc: '口座名義' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨コード' },
      { name: 'COUNTRY_CODE', type: 'VARCHAR2(2)', role: 'normal', desc: '国コード' }
    ]
  },
  {
    id: 'IBY_EXTERNAL_PAYEES_ALL', name: 'IBY_EXTERNAL_PAYEES_ALL', jpName: 'IBY外部受取人設定',
    domain: 'AP_TAX_PAY_MASTER', pk: ['EXT_PAYEE_ID'], fks: ['PAYEE_PARTY_ID', 'SUPPLIER_SITE_ID', 'ORG_ID', 'DEFAULT_PAYMENT_METHOD_CODE'],
    pos: { x: 34, y: 1055, w: 170, h: 46 },
    description: 'サプライヤサイトに対するデフォルト支払方法(EFT)と受取属性を管理。',
    columns: [
      { name: 'EXT_PAYEE_ID', type: 'NUMBER(18)', role: 'pk', desc: '外部受取人ID' },
      { name: 'PAYEE_PARTY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティID' },
      { name: 'SUPPLIER_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'サプライヤサイトID' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'DEFAULT_PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'fk', desc: 'デフォルト支払方法' }
    ]
  },
  {
    id: 'IBY_PMT_INSTR_USES_ALL', name: 'IBY_PMT_INSTR_USES_ALL', jpName: 'IBY受取人銀行口座割当',
    domain: 'AP_TAX_PAY_MASTER', pk: ['INSTRUMENT_PAYMENT_USE_ID'], fks: ['EXT_PMT_PARTY_ID', 'INSTRUMENT_ID'],
    pos: { x: 214, y: 1055, w: 170, h: 46 },
    description: '外部受取人(34001)とサプライヤ振込先銀行口座(33001)を優先順(1位)で関連付ける。',
    columns: [
      { name: 'INSTRUMENT_PAYMENT_USE_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払手段割当ID' },
      { name: 'EXT_PMT_PARTY_ID', type: 'NUMBER(18)', role: 'fk', desc: '外部受取人ID' },
      { name: 'INSTRUMENT_ID', type: 'NUMBER(18)', role: 'fk', desc: '外部銀行口座ID' },
      { name: 'INSTRUMENT_TYPE', type: 'VARCHAR2(30)', role: 'flag', desc: '手段タイプ (BANKACCOUNT)' },
      { name: 'PAYMENT_FLOW', type: 'VARCHAR2(30)', role: 'flag', desc: '支払フロー (DISBURSEMENTS)' },
      { name: 'ORDER_OF_PREFERENCE', type: 'NUMBER(15)', role: 'normal', desc: '優先順位' },
      { name: 'START_DATE', type: 'DATE', role: 'normal', desc: '有効開始日' }
    ]
  },

  // === D. AP請求・消費税・源泉・支払予定・支払・取消トランザクション (20) ===
  {
    id: 'AP_INVOICES_ALL', name: 'AP_INVOICES_ALL', jpName: 'AP請求書ヘッダ',
    domain: 'AP_TXN_PAYMENT', pk: ['INVOICE_ID'], fks: ['VENDOR_ID', 'VENDOR_SITE_ID', 'PARTY_ID', 'PARTY_SITE_ID', 'TERMS_ID', 'ACCTS_PAY_CODE_COMBINATION_ID', 'AWT_GROUP_ID', 'ORG_ID', 'SET_OF_BOOKS_ID', 'LEGAL_ENTITY_ID'],
    pos: { x: 438, y: 54, w: 226, h: 48 },
    description: '買掛請求書ヘッダ(2,180,000円)。検証・初回支払(Y)・取消(N)・分割1(P)・分割2(Y)と状態が遷移。',
    columns: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'pk', desc: '請求書ID' },
      { name: 'INVOICE_NUM', type: 'VARCHAR2(50)', role: 'normal', desc: '請求書番号' },
      { name: 'INVOICE_DATE', type: 'DATE', role: 'normal', desc: '請求書日付' },
      { name: 'INVOICE_TYPE_LOOKUP_CODE', type: 'VARCHAR2(25)', role: 'flag', desc: '請求種別 (STANDARD)' },
      { name: 'INVOICE_AMOUNT', type: 'NUMBER', role: 'amount', desc: '請求総額 (税込 2,180,000)' },
      { name: 'TOTAL_TAX_AMOUNT', type: 'NUMBER', role: 'amount', desc: '消費税合計 (0→180,000)' },
      { name: 'AMOUNT_PAID', type: 'NUMBER', role: 'amount', desc: '支払済累計額 (遷移)' },
      { name: 'INVOICE_CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨' },
      { name: 'PAYMENT_STATUS_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '支払状況 (N→Y→N→P→Y)' },
      { name: 'APPROVAL_STATUS', type: 'VARCHAR2(25)', role: 'flag', desc: '承認/検証状態' },
      { name: 'WFAPPROVAL_STATUS', type: 'VARCHAR2(50)', role: 'flag', desc: '承認WF状況' },
      { name: 'AWT_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '源泉処理済フラグ (NULL→A)' },
      { name: 'AWT_GROUP_ID', type: 'NUMBER(18)', role: 'fk', desc: '源泉グループID' },
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'fk', desc: 'サプライヤID' },
      { name: 'VENDOR_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'サイトID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティID' },
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティサイトID' },
      { name: 'TERMS_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払条件ID' },
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'fk', desc: '支払方法 (EFT)' },
      { name: 'ACCTS_PAY_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '買掛金CCID (2101)' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' }
    ]
  },
  {
    id: 'AP_INVOICE_LINES_ALL', name: 'AP_INVOICE_LINES_ALL', jpName: 'AP請求書明細',
    domain: 'AP_TXN_PAYMENT', pk: ['INVOICE_ID', 'LINE_NUMBER'], fks: ['INVOICE_ID', 'DEFAULT_DIST_CCID', 'AWT_GROUP_ID', 'SUMMARY_TAX_LINE_ID', 'SET_OF_BOOKS_ID'],
    pos: { x: 680, y: 54, w: 226, h: 48 },
    description: 'ITEM 2行(100万円[10%]・100万円[8%])、検証時生成のTAX 2行(+10万/+8万)、AWT 2行(-102,100/-204,200)の計6行。',
    columns: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'pk', desc: '請求書ID' },
      { name: 'LINE_NUMBER', type: 'NUMBER', role: 'pk', desc: '明細番号 (1〜6)' },
      { name: 'LINE_TYPE_LOOKUP_CODE', type: 'VARCHAR2(25)', role: 'flag', desc: '明細タイプ (ITEM/TAX/AWT)' },
      { name: 'LINE_SOURCE', type: 'VARCHAR2(30)', role: 'normal', desc: '生成元 (MANUAL/ETAX/AUTOWH)' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(240)', role: 'normal', desc: '明細摘要' },
      { name: 'AMOUNT', type: 'NUMBER', role: 'amount', desc: '明細金額' },
      { name: 'TAX_CLASSIFICATION_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税分類コード' },
      { name: 'DEFAULT_DIST_CCID', type: 'NUMBER(18)', role: 'fk', desc: 'デフォルト配賦CCID' },
      { name: 'AWT_GROUP_ID', type: 'NUMBER(18)', role: 'fk', desc: '源泉グループID' },
      { name: 'SUMMARY_TAX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: '税サマリID (TAX行)' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' }
    ]
  },
  {
    id: 'AP_INVOICE_DISTRIBUTIONS_ALL', name: 'AP_INVOICE_DISTRIBUTIONS_ALL', jpName: 'AP請求書会計配賦',
    domain: 'AP_TXN_PAYMENT', pk: ['INVOICE_DISTRIBUTION_ID'], fks: ['INVOICE_ID', 'DIST_CODE_COMBINATION_ID', 'DETAIL_TAX_DIST_ID', 'AWT_RELATED_ID', 'AWT_TAX_RATE_ID', 'ACCOUNTING_EVENT_ID'],
    pos: { x: 438, y: 162, w: 226, h: 48 },
    description: 'ITEM 2行・REC_TAX 2行・AWT 2行の全6配賦行。検証でMATCH_STATUS_FLAG=A、SLA作成でPOSTED_FLAG=Yへ。',
    columns: [
      { name: 'INVOICE_DISTRIBUTION_ID', type: 'NUMBER(18)', role: 'pk', desc: '請求書配賦ID' },
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ID' },
      { name: 'INVOICE_LINE_NUMBER', type: 'NUMBER', role: 'normal', desc: '親明細番号' },
      { name: 'DISTRIBUTION_LINE_NUMBER', type: 'NUMBER', role: 'normal', desc: '配賦行番号' },
      { name: 'LINE_TYPE_LOOKUP_CODE', type: 'VARCHAR2(25)', role: 'flag', desc: '配賦タイプ (ITEM/REC_TAX/AWT)' },
      { name: 'AMOUNT', type: 'NUMBER', role: 'amount', desc: '配賦金額' },
      { name: 'DIST_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定CCID' },
      { name: 'ACCOUNTING_DATE', type: 'DATE', role: 'normal', desc: '会計日付' },
      { name: 'MATCH_STATUS_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '検証状態 (A=検証済)' },
      { name: 'DETAIL_TAX_DIST_ID', type: 'NUMBER(18)', role: 'fk', desc: 'ZX税配賦ID (REC_TAX)' },
      { name: 'AWT_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'AWT自動生成フラグ' },
      { name: 'AWT_RELATED_ID', type: 'NUMBER(18)', role: 'fk', desc: '源泉対象ITEM配賦ID' },
      { name: 'AWT_GROSS_AMOUNT', type: 'NUMBER', role: 'amount', desc: '源泉課税対象額' },
      { name: 'AWT_GROUP_ID', type: 'NUMBER(18)', role: 'fk', desc: '源泉グループID' },
      { name: 'AWT_TAX_RATE_ID', type: 'NUMBER(18)', role: 'fk', desc: '源泉税率ID (8201/8202)' },
      { name: 'POSTED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '会計済フラグ (N→Y)' },
      { name: 'ACCOUNTING_EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAイベントID (NULL→90001)' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'ZX_LINES_DET_FACTORS', name: 'ZX_LINES_DET_FACTORS', jpName: '税決定ファクタ明細 (ZX)',
    domain: 'AP_TXN_PAYMENT', pk: ['LINES_DET_FACTOR_ID'], fks: ['TRX_ID', 'INTERNAL_ORGANIZATION_ID'],
    pos: { x: 680, y: 162, w: 226, h: 48 },
    description: '明細1(JP_TAX_10)と明細2(JP_TAX_8_RED)の税決定属性を保持しFusion Taxエンジンへ渡す。',
    columns: [
      { name: 'LINES_DET_FACTOR_ID', type: 'NUMBER(18)', role: 'pk', desc: '税決定ファクタID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (200=AP)' },
      { name: 'ENTITY_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'エンティティ (AP_INVOICES)' },
      { name: 'EVENT_CLASS_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'イベントクラス' },
      { name: 'TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ID (50001)' },
      { name: 'TRX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: '明細番号 (1, 2)' },
      { name: 'TAX_CLASSIFICATION_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '税分類コード' },
      { name: 'LINE_AMT', type: 'NUMBER', role: 'amount', desc: '課税標準額' },
      { name: 'INTERNAL_ORGANIZATION_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'ZX_LINES', name: 'ZX_LINES', jpName: '消費税計算明細 (ZX)',
    domain: 'AP_TXN_PAYMENT', pk: ['TAX_LINE_ID'], fks: ['TRX_ID', 'TAX_RATE_ID'],
    pos: { x: 438, y: 270, w: 226, h: 48 },
    description: '10%税(100,000円)と8%軽減税(80,000円)の算出結果を保持するFusion Tax明細表。',
    columns: [
      { name: 'TAX_LINE_ID', type: 'NUMBER(18)', role: 'pk', desc: '税明細ID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (200)' },
      { name: 'TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ID' },
      { name: 'TRX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: '対象明細番号' },
      { name: 'TAX_REGIME_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税制度コード' },
      { name: 'TAX', type: 'VARCHAR2(30)', role: 'normal', desc: '税金コード' },
      { name: 'TAX_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '税ステータス' },
      { name: 'TAX_RATE_ID', type: 'NUMBER(18)', role: 'fk', desc: '税率ID' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: 'normal', desc: '税率コード' },
      { name: 'TAX_RATE', type: 'NUMBER', role: 'amount', desc: '税率 (%)' },
      { name: 'TAXABLE_AMT', type: 'NUMBER', role: 'amount', desc: '課税標準額' },
      { name: 'TAX_AMT', type: 'NUMBER', role: 'amount', desc: '算出税額' }
    ]
  },
  {
    id: 'ZX_LINES_SUMMARY', name: 'ZX_LINES_SUMMARY', jpName: '税サマリ明細 (AP連携キー)',
    domain: 'AP_TXN_PAYMENT', pk: ['SUMMARY_TAX_LINE_ID'], fks: ['TRX_ID'],
    pos: { x: 680, y: 270, w: 226, h: 48 },
    description: '税種別ごとのサマリ税額。AP_INVOICE_LINES_ALLのTAX行 (SUMMARY_TAX_LINE_ID) と結合する。',
    columns: [
      { name: 'SUMMARY_TAX_LINE_ID', type: 'NUMBER(18)', role: 'pk', desc: 'サマリ税明細ID' },
      { name: 'TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ID' },
      { name: 'TAX_REGIME_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税制度コード' },
      { name: 'TAX', type: 'VARCHAR2(30)', role: 'normal', desc: '税金コード' },
      { name: 'TAX_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '税ステータス' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: 'normal', desc: '税率コード' },
      { name: 'TAX_RATE', type: 'NUMBER', role: 'amount', desc: '税率 (%)' },
      { name: 'TAX_AMT', type: 'NUMBER', role: 'amount', desc: '合計税額' }
    ]
  },
  {
    id: 'ZX_REC_NREC_DIST', name: 'ZX_REC_NREC_DIST', jpName: '控除対象/非対象税配賦 (ZX)',
    domain: 'AP_TXN_PAYMENT', pk: ['REC_NREC_TAX_DIST_ID'], fks: ['TAX_LINE_ID', 'TRX_ID', 'TAX_RATE_ID'],
    pos: { x: 438, y: 378, w: 226, h: 48 },
    description: '仮払消費税の仕入税額控除配賦 (RECOVERABLE_FLAG=Y)。AP_INVOICE_DISTRIBUTIONS_ALL.DETAIL_TAX_DIST_IDの参照元。',
    columns: [
      { name: 'REC_NREC_TAX_DIST_ID', type: 'NUMBER(18)', role: 'pk', desc: '控除税配賦ID' },
      { name: 'TAX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'ZX_LINES ID' },
      { name: 'TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ID' },
      { name: 'TAX_RATE_ID', type: 'NUMBER(18)', role: 'fk', desc: '税率ID' },
      { name: 'RECOVERABLE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '仕入税額控除フラグ (Y)' },
      { name: 'RECOVERY_RATE_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '控除率コード (100%)' },
      { name: 'REC_NREC_TAX_AMT', type: 'NUMBER', role: 'amount', desc: '控除可能消費税額' }
    ]
  },
  {
    id: 'ZX_WITHHOLDING_LINES', name: 'ZX_WITHHOLDING_LINES', jpName: '源泉徴収税計算明細 (ZX)',
    domain: 'AP_TXN_PAYMENT', pk: ['TAX_LINE_ID'], fks: ['TRX_ID'],
    pos: { x: 680, y: 378, w: 226, h: 48 },
    description: '100万円まで10.21% (-102,100円) と100万円超分100万円×20.42% (-204,200円) の段階源泉税計算結果。',
    columns: [
      { name: 'TAX_LINE_ID', type: 'NUMBER(18)', role: 'pk', desc: '源泉税明細ID' },
      { name: 'TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ID' },
      { name: 'TRX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: '対象明細番号' },
      { name: 'TAX', type: 'VARCHAR2(30)', role: 'normal', desc: '税金コード (JP_WHT_TIER)' },
      { name: 'TAX_RATE', type: 'NUMBER', role: 'amount', desc: '適用源泉税率 (%)' },
      { name: 'TAXABLE_AMT', type: 'NUMBER', role: 'amount', desc: '源泉課税対象額' },
      { name: 'TAX_AMT', type: 'NUMBER', role: 'amount', desc: '算出源泉徴収税額' }
    ]
  },
  {
    id: 'AP_AWT_BUCKETS_ALL', name: 'AP_AWT_BUCKETS_ALL', jpName: '源泉税期間累積バケット',
    domain: 'AP_TXN_PAYMENT', pk: ['PERIOD_NAME', 'TAX_NAME', 'VENDOR_ID'], fks: ['VENDOR_ID', 'ORG_ID'],
    pos: { x: 438, y: 486, w: 226, h: 48 },
    description: '段階税率判定のため、サプライヤ・期間(2026-11)別に課税標準累計(2,000,000)と源泉累計(306,300)を保持。',
    columns: [
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'pk', desc: '源泉期間名' },
      { name: 'TAX_NAME', type: 'VARCHAR2(15)', role: 'pk', desc: '源泉税コード' },
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'pk', desc: 'サプライヤID' },
      { name: 'GROSS_AMOUNT_TO_DATE', type: 'NUMBER', role: 'amount', desc: '累積課税対象額 (2,000,000)' },
      { name: 'WITHHELD_AMOUNT_TO_DATE', type: 'NUMBER', role: 'amount', desc: '累積源泉徴収額 (306,300)' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'AP_PAYMENT_SCHEDULES_ALL', name: 'AP_PAYMENT_SCHEDULES_ALL', jpName: 'AP支払予定 (分割管理)',
    domain: 'AP_TXN_PAYMENT', pk: ['INVOICE_ID', 'PAYMENT_NUM'], fks: ['INVOICE_ID', 'PAYMENT_METHOD_CODE', 'ORG_ID'],
    pos: { x: 680, y: 486, w: 226, h: 48 },
    description: '当初1本(1,873,700) → 初回払完済 → 取消＆2分割（予定1:明細1分 997,900 / 予定2:明細2分 875,800）→ 順次完済。',
    columns: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'pk', desc: '請求書ID' },
      { name: 'PAYMENT_NUM', type: 'NUMBER(15)', role: 'pk', desc: '支払分割番号 (1, 2)' },
      { name: 'DUE_DATE', type: 'DATE', role: 'normal', desc: '支払期日' },
      { name: 'GROSS_AMOUNT', type: 'NUMBER', role: 'amount', desc: '予定支払総額 (源泉控除後)' },
      { name: 'AMOUNT_REMAINING', type: 'NUMBER', role: 'amount', desc: '未払残高' },
      { name: 'PAYMENT_STATUS_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '支払状況 (N/Y)' },
      { name: 'HOLD_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '保留フラグ' },
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'fk', desc: '支払方法 (EFT)' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'AP_INV_SELECTION_CRITERIA_ALL', name: 'AP_INV_SELECTION_CRITERIA_ALL', jpName: '支払処理要求 (PPR基準)',
    domain: 'AP_TXN_PAYMENT', pk: ['CHECKRUN_ID'], fks: ['ORG_ID', 'PAYMENT_METHOD_CODE'],
    pos: { x: 438, y: 594, w: 226, h: 48 },
    description: 'PPR-01(一括)、PPR-02(明細1分割)、PPR-03(明細2分割)の計3回の支払実行パラメータヘッダ。',
    columns: [
      { name: 'CHECKRUN_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払処理要求ID' },
      { name: 'CHECKRUN_NAME', type: 'VARCHAR2(50)', role: 'normal', desc: 'PPR名称' },
      { name: 'PAY_THRU_DATE', type: 'DATE', role: 'normal', desc: '対象支払期日上限' },
      { name: 'STATUS', type: 'VARCHAR2(25)', role: 'flag', desc: 'PPRステータス' },
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'fk', desc: '支払方法' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'AP_SELECTED_INVOICES_ALL', name: 'AP_SELECTED_INVOICES_ALL', jpName: '選択済支払対象請求書',
    domain: 'AP_TXN_PAYMENT', pk: ['CHECKRUN_ID', 'INVOICE_ID', 'PAYMENT_NUM'], fks: ['CHECKRUN_ID', 'INVOICE_ID', 'LEGAL_ENTITY_ID', 'ORG_ID'],
    pos: { x: 680, y: 594, w: 226, h: 48 },
    description: '各PPRのAutoSelectで抽出された請求書と分割支払番号(PAYMENT_NUM)および確定支払額。',
    columns: [
      { name: 'CHECKRUN_ID', type: 'NUMBER(18)', role: 'pk', desc: 'PPR ID' },
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'pk', desc: '請求書ID' },
      { name: 'PAYMENT_NUM', type: 'NUMBER(15)', role: 'pk', desc: '支払分割番号' },
      { name: 'PROPOSED_PAYMENT_AMOUNT', type: 'NUMBER', role: 'amount', desc: '提案支払金額' },
      { name: 'PAYMENT_AMOUNT', type: 'NUMBER', role: 'amount', desc: '確定支払金額' },
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'fk', desc: '支払方法' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'IBY_PAY_SERVICE_REQUESTS', name: 'IBY_PAY_SERVICE_REQUESTS', jpName: 'IBY支払サービス要求',
    domain: 'AP_TXN_PAYMENT', pk: ['PAYMENT_SERVICE_REQUEST_ID'], fks: ['CALL_APP_PAY_SERVICE_REQ_CODE'],
    pos: { x: 438, y: 702, w: 226, h: 48 },
    description: 'APのPPR(200)からOracle Payments(IBY)へ連携された支払構築リクエストの親コンテナ。',
    columns: [
      { name: 'PAYMENT_SERVICE_REQUEST_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払サービス要求ID' },
      { name: 'CALLING_APP_ID', type: 'NUMBER(18)', role: 'normal', desc: '呼出元アプリID (200=AP)' },
      { name: 'CALL_APP_PAY_SERVICE_REQ_CODE', type: 'VARCHAR2(255)', role: 'fk', desc: 'AP PPR参照コード' },
      { name: 'PAYMENT_SERVICE_REQUEST_STATUS', type: 'VARCHAR2(30)', role: 'flag', desc: '要求ステータス (PAYMENTS_CREATED)' }
    ]
  },
  {
    id: 'IBY_DOCS_PAYABLE_ALL', name: 'IBY_DOCS_PAYABLE_ALL', jpName: 'IBY支払対象文書',
    domain: 'AP_TXN_PAYMENT', pk: ['DOCUMENT_PAYABLE_ID'], fks: ['PAYMENT_SERVICE_REQUEST_ID', 'PAYMENT_ID', 'CALLING_APP_DOC_UNIQUE_REF1'],
    pos: { x: 680, y: 702, w: 226, h: 48 },
    description: 'APからIBYへ渡された支払対象請求明細。初回分はStep 4のVoidでVOID_BY_SETUP等へ更新。',
    columns: [
      { name: 'DOCUMENT_PAYABLE_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払対象文書ID' },
      { name: 'PAYMENT_SERVICE_REQUEST_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払サービス要求ID' },
      { name: 'PAYMENT_ID', type: 'NUMBER(18)', role: 'fk', desc: 'IBY支払ID' },
      { name: 'CALLING_APP_DOC_UNIQUE_REF1', type: 'VARCHAR2(100)', role: 'fk', desc: '請求書ID参照' },
      { name: 'DOCUMENT_AMOUNT', type: 'NUMBER', role: 'amount', desc: '支払対象金額' },
      { name: 'DOCUMENT_STATUS', type: 'VARCHAR2(30)', role: 'flag', desc: '文書状態 (PAYMENT_CREATED→VOID)' }
    ]
  },
  {
    id: 'IBY_PAY_INSTRUCTIONS_ALL', name: 'IBY_PAY_INSTRUCTIONS_ALL', jpName: 'IBY支払指示 (振込指示ファイル)',
    domain: 'AP_TXN_PAYMENT', pk: ['PAYMENT_INSTRUCTION_ID'], fks: ['PAYMENT_PROFILE_ID', 'INTERNAL_BANK_ACCOUNT_ID'],
    pos: { x: 438, y: 810, w: 226, h: 48 },
    description: '支払プロファイル(PPP)と自社銀行口座ごとに支払をまとめて作成・伝送する支払指示ヘッダ。',
    columns: [
      { name: 'PAYMENT_INSTRUCTION_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払指示ID' },
      { name: 'PAYMENT_PROFILE_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払処理プロファイルID' },
      { name: 'INTERNAL_BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'fk', desc: '自社銀行口座ID' },
      { name: 'PAYMENT_INSTRUCTION_STATUS', type: 'VARCHAR2(30)', role: 'flag', desc: '指示ステータス (TRANSMITTED)' }
    ]
  },
  {
    id: 'IBY_PAYMENTS_ALL', name: 'IBY_PAYMENTS_ALL', jpName: 'IBY支払トランザクション',
    domain: 'AP_TXN_PAYMENT', pk: ['PAYMENT_ID'], fks: ['PAYMENT_SERVICE_REQUEST_ID', 'PAYMENT_INSTRUCTION_ID'],
    pos: { x: 680, y: 810, w: 226, h: 48 },
    description: 'IBYで生成された支払取引。初回(95001)はStep 4でVOID、分割1(95002)と分割2(95003)はISSUED。',
    columns: [
      { name: 'PAYMENT_ID', type: 'NUMBER(18)', role: 'pk', desc: 'IBY支払ID' },
      { name: 'PAYMENT_SERVICE_REQUEST_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払サービス要求ID' },
      { name: 'PAYMENT_INSTRUCTION_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払指示ID' },
      { name: 'PAPER_DOCUMENT_NUMBER', type: 'NUMBER(18)', role: 'normal', desc: '振込/小切手番号' },
      { name: 'PAYMENT_AMOUNT', type: 'NUMBER', role: 'amount', desc: '支払金額' },
      { name: 'PAYMENT_STATUS', type: 'VARCHAR2(30)', role: 'flag', desc: 'IBY支払状況 (ISSUED→VOID)' },
      { name: 'VOID_DATE', type: 'DATE', role: 'normal', desc: '取消日 (Void時更新)' }
    ]
  },
  {
    id: 'AP_CHECKS_ALL', name: 'AP_CHECKS_ALL', jpName: 'AP支払ヘッダ (小切手/振込)',
    domain: 'AP_TXN_PAYMENT', pk: ['CHECK_ID'], fks: ['VENDOR_ID', 'VENDOR_SITE_ID', 'PAYMENT_ID', 'PAYMENT_DOCUMENT_ID', 'PAYMENT_METHOD_CODE', 'ORG_ID'],
    pos: { x: 438, y: 918, w: 226, h: 48 },
    description: '70001(初回1,873,700→VOIDED)、70002(分割1:997,900 NEGOTIABLE)、70003(分割2:875,800 NEGOTIABLE)。',
    columns: [
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払チェックID' },
      { name: 'CHECK_NUMBER', type: 'NUMBER(18)', role: 'normal', desc: '支払文書番号 (1001/1002/1003)' },
      { name: 'CHECK_DATE', type: 'DATE', role: 'normal', desc: '支払日' },
      { name: 'AMOUNT', type: 'NUMBER', role: 'amount', desc: '支払合計額' },
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'fk', desc: 'サプライヤID' },
      { name: 'VENDOR_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'サイトID' },
      { name: 'STATUS_LOOKUP_CODE', type: 'VARCHAR2(25)', role: 'flag', desc: '支払状態 (NEGOTIABLE→VOIDED)' },
      { name: 'VOID_DATE', type: 'DATE', role: 'normal', desc: '取消日 (NULL→2026-11-16)' },
      { name: 'PAYMENT_ID', type: 'NUMBER(18)', role: 'fk', desc: 'IBY支払ID' },
      { name: 'PAYMENT_DOCUMENT_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払文書ID' },
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'fk', desc: '支払方法' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'AP_INVOICE_PAYMENTS_ALL', name: 'AP_INVOICE_PAYMENTS_ALL', jpName: 'AP請求-支払紐付明細',
    domain: 'AP_TXN_PAYMENT', pk: ['INVOICE_PAYMENT_ID'], fks: ['CHECK_ID', 'INVOICE_ID', 'REVERSAL_INV_PMT_ID', 'ACCTS_PAY_CODE_COMBINATION_ID', 'SET_OF_BOOKS_ID'],
    pos: { x: 680, y: 918, w: 226, h: 48 },
    description: '請求書と支払を1対1で結ぶ。Step 4の取消時は元行80001のREVERSAL_FLAG=Y更新と逆仕訳行80002(-1,873,700)をINSERT。',
    columns: [
      { name: 'INVOICE_PAYMENT_ID', type: 'NUMBER(18)', role: 'pk', desc: '請求支払紐付ID' },
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払チェックID' },
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ID' },
      { name: 'PAYMENT_NUM', type: 'NUMBER(15)', role: 'normal', desc: '支払予定分割番号' },
      { name: 'AMOUNT', type: 'NUMBER', role: 'amount', desc: '充当支払額' },
      { name: 'ACCOUNTING_DATE', type: 'DATE', role: 'normal', desc: '会計日' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計期間' },
      { name: 'REVERSAL_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '取消フラグ (N→Y)' },
      { name: 'REVERSAL_INV_PMT_ID', type: 'NUMBER(18)', role: 'fk', desc: '取消元請求支払ID' },
      { name: 'POSTED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '会計済フラグ (N→Y)' },
      { name: 'ACCTS_PAY_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '買掛金CCID (2101)' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' }
    ]
  },
  {
    id: 'AP_PAYMENT_HISTORY_ALL', name: 'AP_PAYMENT_HISTORY_ALL', jpName: 'AP支払イベント履歴',
    domain: 'AP_TXN_PAYMENT', pk: ['PAYMENT_HISTORY_ID'], fks: ['CHECK_ID', 'REV_PMT_HIST_ID', 'ACCOUNTING_EVENT_ID'],
    pos: { x: 438, y: 1026, w: 226, h: 48 },
    description: '支払作成(PAYMENT CREATED)・支払取消(PAYMENT CANCELLED)などSLAイベントと1:1対応する支払履歴ヘッダ。',
    columns: [
      { name: 'PAYMENT_HISTORY_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払履歴ID' },
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払チェックID' },
      { name: 'TRANSACTION_TYPE', type: 'VARCHAR2(30)', role: 'flag', desc: '支払取引種別 (CREATED/CANCELLED)' },
      { name: 'TRANSACTION_DATE', type: 'DATE', role: 'normal', desc: '取引日' },
      { name: 'REV_PMT_HIST_ID', type: 'NUMBER(18)', role: 'fk', desc: '取消元支払履歴ID' },
      { name: 'POSTED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '会計済フラグ (N→Y)' },
      { name: 'ACCOUNTING_EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAイベントID' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'AP_PAYMENT_HIST_DISTS', name: 'AP_PAYMENT_HIST_DISTS', jpName: 'AP支払履歴配賦明細',
    domain: 'AP_TXN_PAYMENT', pk: ['PAYMENT_HIST_DIST_ID'], fks: ['PAYMENT_HISTORY_ID', 'INVOICE_PAYMENT_ID', 'INVOICE_DISTRIBUTION_ID', 'ACCOUNTING_EVENT_ID'],
    pos: { x: 680, y: 1026, w: 226, h: 48 },
    description: 'どの請求配賦行(ITEM/REC_TAX/AWT)に対し幾ら支払・取消したかを保持。分割1では明細1系3配賦、分割2では明細2系3配賦を消込。',
    columns: [
      { name: 'PAYMENT_HIST_DIST_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払履歴配賦ID' },
      { name: 'PAYMENT_HISTORY_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払履歴ID' },
      { name: 'INVOICE_PAYMENT_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求支払紐付ID' },
      { name: 'INVOICE_DISTRIBUTION_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書配賦ID' },
      { name: 'PAY_DIST_LOOKUP_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '支払配賦区分 (CASH)' },
      { name: 'AMOUNT', type: 'NUMBER', role: 'amount', desc: '配賦別支払・取消額' },
      { name: 'REVERSAL_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '取消フラグ' },
      { name: 'ACCOUNTING_EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAイベントID' }
    ]
  },

  // === E. SLA (Subledger Accounting) 補助元帳 (5) ===
  {
    id: 'XLA_TRANSACTION_ENTITIES', name: 'XLA_TRANSACTION_ENTITIES', jpName: 'SLAトランザクションエンティティ',
    domain: 'SLA_XLA', pk: ['ENTITY_ID'], fks: ['LEGAL_ENTITY_ID', 'SOURCE_ID_INT_1', 'LEDGER_ID'],
    pos: { x: 966, y: 80, w: 276, h: 96 },
    description: 'AP (APPLICATION_ID=200) の取引実体。AP_INVOICES(請求50001)とAP_PAYMENTS(支払70001/70002/70003)を管理。',
    columns: [
      { name: 'ENTITY_ID', type: 'NUMBER(18)', role: 'pk', desc: 'SLAエンティティID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (200=AP)' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' },
      { name: 'ENTITY_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'エンティティ種別 (AP_INVOICES/AP_PAYMENTS)' },
      { name: 'SOURCE_ID_INT_1', type: 'NUMBER(38)', role: 'fk', desc: '元取引PK (INVOICE_ID / CHECK_ID)' },
      { name: 'TRANSACTION_NUMBER', type: 'VARCHAR2(240)', role: 'normal', desc: '取引番号' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' }
    ]
  },
  {
    id: 'XLA_EVENTS', name: 'XLA_EVENTS', jpName: 'SLA会計イベント',
    domain: 'SLA_XLA', pk: ['EVENT_ID'], fks: ['ENTITY_ID'],
    pos: { x: 966, y: 290, w: 276, h: 96 },
    description: '検証(90001)・初回払(90002)・取消(90003)・分割1(90004)・分割2(90005)の5イベント。Create AccountingでPへ更新。',
    columns: [
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'pk', desc: '会計イベントID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (200=AP)' },
      { name: 'ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAエンティティID' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'イベント種別' },
      { name: 'EVENT_NUMBER', type: 'NUMBER(18)', role: 'normal', desc: 'イベント番号' },
      { name: 'EVENT_DATE', type: 'DATE', role: 'normal', desc: 'イベント日' },
      { name: 'EVENT_STATUS_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: 'イベント状態 (U→P)' },
      { name: 'PROCESS_STATUS_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: '処理状態 (U→P)' },
      { name: 'ON_HOLD_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '保留フラグ' },
      { name: 'TRANSACTION_DATE', type: 'DATE', role: 'normal', desc: '取引日' }
    ]
  },
  {
    id: 'XLA_AE_HEADERS', name: 'XLA_AE_HEADERS', jpName: 'SLA補助元帳仕訳ヘッダ',
    domain: 'SLA_XLA', pk: ['AE_HEADER_ID'], fks: ['LEDGER_ID', 'ENTITY_ID', 'EVENT_ID'],
    pos: { x: 966, y: 500, w: 276, h: 96 },
    description: 'Create Accountingで生成される5仕訳ヘッダ。Step 7はGL_TRANSFER_STATUS_CODE=N、Step 8のGL転送でYへ更新。',
    columns: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: 'SLA仕訳ヘッダID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (200)' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAエンティティID' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: '会計イベントID' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'イベント種別' },
      { name: 'ACCOUNTING_DATE', type: 'DATE', role: 'normal', desc: '会計日付' },
      { name: 'GL_TRANSFER_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'GL転送状況 (N→Y)' },
      { name: 'GL_TRANSFER_DATE', type: 'DATE', role: 'normal', desc: 'GL転送日' },
      { name: 'JE_CATEGORY_NAME', type: 'VARCHAR2(30)', role: 'normal', desc: '仕訳カテゴリ' },
      { name: 'ACCOUNTING_ENTRY_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '仕訳状態 (F=最終)' },
      { name: 'BALANCE_TYPE_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: '残高タイプ (A=実績)' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計期間' }
    ]
  },
  {
    id: 'XLA_AE_LINES', name: 'XLA_AE_LINES', jpName: 'SLA補助元帳仕訳明細',
    domain: 'SLA_XLA', pk: ['AE_HEADER_ID', 'AE_LINE_NUM', 'APPLICATION_ID'], fks: ['AE_HEADER_ID', 'CODE_COMBINATION_ID', 'GL_SL_LINK_ID', 'PARTY_ID', 'PARTY_SITE_ID'],
    pos: { x: 966, y: 710, w: 276, h: 96 },
    description: '全5イベントから自動仕訳された15明細行。GL_SL_LINK_IDがGL_IMPORT_REFERENCESへのドリルスルー鍵。',
    columns: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: 'SLA仕訳ヘッダID' },
      { name: 'AE_LINE_NUM', type: 'NUMBER(18)', role: 'pk', desc: '仕訳明細番号' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'アプリID (200)' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定CCID' },
      { name: 'GL_TRANSFER_MODE_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: 'GL転送モード (D=明細)' },
      { name: 'GL_SL_LINK_ID', type: 'NUMBER(18)', role: 'fk', desc: 'GL-SLAリンクID' },
      { name: 'GL_SL_LINK_TABLE', type: 'VARCHAR2(30)', role: 'normal', desc: 'リンク元表 (XLAJEL)' },
      { name: 'ACCOUNTING_CLASS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '会計クラス' },
      { name: 'ENTERED_DR', type: 'NUMBER', role: 'amount', desc: '入力借方金額' },
      { name: 'ENTERED_CR', type: 'NUMBER', role: 'amount', desc: '入力貸方金額' },
      { name: 'ACCOUNTED_DR', type: 'NUMBER', role: 'amount', desc: '機能通貨借方金額' },
      { name: 'ACCOUNTED_CR', type: 'NUMBER', role: 'amount', desc: '機能通貨貸方金額' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨コード' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'サプライヤパーティID' },
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティサイトID' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(1996)', role: 'normal', desc: '明細摘要' }
    ]
  },
  {
    id: 'XLA_DISTRIBUTION_LINKS', name: 'XLA_DISTRIBUTION_LINKS', jpName: 'SLA配賦リンク (監査証跡)',
    domain: 'SLA_XLA', pk: ['APPLICATION_ID', 'AE_HEADER_ID', 'AE_LINE_NUM', 'SOURCE_DISTRIBUTION_TYPE', 'SOURCE_DISTRIBUTION_ID_NUM_1'], fks: ['EVENT_ID', 'AE_HEADER_ID', 'SOURCE_DISTRIBUTION_ID_NUM_1'],
    pos: { x: 966, y: 920, w: 276, h: 96 },
    description: 'SLA仕訳明細とAP_INVOICE_DISTRIBUTIONS_ALL(6行)・AP_PAYMENT_HIST_DISTS(18行)を結ぶ全24監査証跡リンク。',
    columns: [
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'アプリID (200)' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: '会計イベントID' },
      { name: 'AE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: 'SLA仕訳ヘッダID' },
      { name: 'AE_LINE_NUM', type: 'NUMBER(18)', role: 'pk', desc: '仕訳明細番号' },
      { name: 'SOURCE_DISTRIBUTION_TYPE', type: 'VARCHAR2(30)', role: 'pk', desc: '配賦ソース表タイプ' },
      { name: 'SOURCE_DISTRIBUTION_ID_NUM_1', type: 'NUMBER(38)', role: 'pk', desc: '元配賦PK ID' },
      { name: 'APPLIED_TO_SOURCE_ID_NUM_1', type: 'NUMBER(18)', role: 'fk', desc: '消込先請求配賦ID' },
      { name: 'EVENT_CLASS_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'イベントクラス' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'イベントタイプ' },
      { name: 'ROUNDING_CLASS_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '丸めクラス' },
      { name: 'MERGE_DUPLICATE_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: 'マージ区分' },
      { name: 'UNROUNDED_ACCOUNTED_DR', type: 'NUMBER', role: 'amount', desc: '未丸め借方金額' },
      { name: 'UNROUNDED_ACCOUNTED_CR', type: 'NUMBER', role: 'amount', desc: '未丸め貸方金額' }
    ]
  },

  // === F. GL (General Ledger) 総勘定元帳 (6) ===
  {
    id: 'GL_INTERFACE', name: 'GL_INTERFACE', jpName: 'GL仕訳インタフェース',
    domain: 'GL_LEDGER', pk: ['GROUP_ID', 'GL_SL_LINK_ID'], fks: ['LEDGER_ID', 'CODE_COMBINATION_ID', 'GL_SL_LINK_ID'],
    pos: { x: 1306, y: 72, w: 274, h: 86 },
    description: 'SLAから転送された15明細を受け取るステージング表。Journal Import後 PROCESSED に遷移。',
    columns: [
      { name: 'STATUS', type: 'VARCHAR2(50)', role: 'flag', desc: 'ステータス (PROCESSED)' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'ACCOUNTING_DATE', type: 'DATE', role: 'normal', desc: '会計日付' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨' },
      { name: 'DATE_CREATED', type: 'DATE', role: 'normal', desc: '作成日' },
      { name: 'ACTUAL_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '実績フラグ (A)' },
      { name: 'USER_JE_CATEGORY_NAME', type: 'VARCHAR2(25)', role: 'normal', desc: '仕訳カテゴリ名' },
      { name: 'USER_JE_SOURCE_NAME', type: 'VARCHAR2(25)', role: 'normal', desc: '仕訳ソース名 (Payables)' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定CCID' },
      { name: 'ENTERED_DR', type: 'NUMBER', role: 'amount', desc: '入力借方' },
      { name: 'ENTERED_CR', type: 'NUMBER', role: 'amount', desc: '入力貸方' },
      { name: 'ACCOUNTED_DR', type: 'NUMBER', role: 'amount', desc: '機能通貨借方' },
      { name: 'ACCOUNTED_CR', type: 'NUMBER', role: 'amount', desc: '機能通貨貸方' },
      { name: 'GROUP_ID', type: 'NUMBER(18)', role: 'pk', desc: 'グループID' },
      { name: 'GL_SL_LINK_ID', type: 'NUMBER(18)', role: 'pk', desc: 'GL-SLAリンクID' },
      { name: 'GL_SL_LINK_TABLE', type: 'VARCHAR2(30)', role: 'normal', desc: 'リンク元テーブル' }
    ]
  },
  {
    id: 'GL_JE_BATCHES', name: 'GL_JE_BATCHES', jpName: 'GL仕訳バッチ',
    domain: 'GL_LEDGER', pk: ['JE_BATCH_ID'], fks: ['CHART_OF_ACCOUNTS_ID'],
    pos: { x: 1306, y: 247, w: 274, h: 86 },
    description: 'Payables仕訳をまとめるGL仕訳バッチ (貸借各7,801,100円)。GL転記によりSTATUS=Pに確定。',
    columns: [
      { name: 'JE_BATCH_ID', type: 'NUMBER(18)', role: 'pk', desc: '仕訳バッチID' },
      { name: 'NAME', type: 'VARCHAR2(100)', role: 'normal', desc: 'バッチ名' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: '転記ステータス (P=転記済)' },
      { name: 'DEFAULT_PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: 'デフォルト会計期間' },
      { name: 'POSTED_DATE', type: 'DATE', role: 'normal', desc: '転記日' },
      { name: 'RUNNING_TOTAL_DR', type: 'NUMBER', role: 'amount', desc: 'バッチ借方合計 (7,801,100)' },
      { name: 'RUNNING_TOTAL_CR', type: 'NUMBER', role: 'amount', desc: 'バッチ貸方合計 (7,801,100)' },
      { name: 'CHART_OF_ACCOUNTS_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定体系ID (101)' },
      { name: 'PERIOD_SET_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計カレンダ' },
      { name: 'ACCOUNTED_PERIOD_TYPE', type: 'VARCHAR2(15)', role: 'normal', desc: '期間タイプ' },
      { name: 'ACTUAL_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '実績フラグ' }
    ]
  },
  {
    id: 'GL_JE_HEADERS', name: 'GL_JE_HEADERS', jpName: 'GL仕訳ヘッダ',
    domain: 'GL_LEDGER', pk: ['JE_HEADER_ID'], fks: ['JE_BATCH_ID', 'LEDGER_ID'],
    pos: { x: 1306, y: 422, w: 274, h: 86 },
    description: 'Purchase Invoices(2,180,000円) と Payments(初回+取消+分割1+分割2 = 5,621,100円) の2ヘッダ。',
    columns: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: '仕訳ヘッダID' },
      { name: 'JE_BATCH_ID', type: 'NUMBER(18)', role: 'fk', desc: '仕訳バッチID' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'JE_CATEGORY', type: 'VARCHAR2(25)', role: 'normal', desc: '仕訳カテゴリ' },
      { name: 'JE_SOURCE', type: 'VARCHAR2(25)', role: 'normal', desc: '仕訳ソース (Payables)' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計期間' },
      { name: 'NAME', type: 'VARCHAR2(100)', role: 'normal', desc: '仕訳名' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (P)' },
      { name: 'DATE_CREATED', type: 'DATE', role: 'normal', desc: '作成日' },
      { name: 'POSTED_DATE', type: 'DATE', role: 'normal', desc: '転記日' },
      { name: 'ACTUAL_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '実績フラグ (A)' },
      { name: 'RUNNING_TOTAL_DR', type: 'NUMBER', role: 'amount', desc: '借方合計' },
      { name: 'RUNNING_TOTAL_CR', type: 'NUMBER', role: 'amount', desc: '貸方合計' }
    ]
  },
  {
    id: 'GL_JE_LINES', name: 'GL_JE_LINES', jpName: 'GL仕訳明細',
    domain: 'GL_LEDGER', pk: ['JE_HEADER_ID', 'JE_LINE_NUM'], fks: ['JE_HEADER_ID', 'LEDGER_ID', 'CODE_COMBINATION_ID'],
    pos: { x: 1306, y: 597, w: 274, h: 86 },
    description: '総勘定元帳の15本の仕訳明細行。STATUS=Pで確定し、GL_BALANCESへ自動集計される。',
    columns: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: '仕訳ヘッダID' },
      { name: 'JE_LINE_NUM', type: 'NUMBER(15)', role: 'pk', desc: '仕訳明細番号' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定CCID' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計期間' },
      { name: 'EFFECTIVE_DATE', type: 'DATE', role: 'normal', desc: '有効日' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (P)' },
      { name: 'ENTERED_DR', type: 'NUMBER', role: 'amount', desc: '入力借方' },
      { name: 'ENTERED_CR', type: 'NUMBER', role: 'amount', desc: '入力貸方' },
      { name: 'ACCOUNTED_DR', type: 'NUMBER', role: 'amount', desc: '機能通貨借方' },
      { name: 'ACCOUNTED_CR', type: 'NUMBER', role: 'amount', desc: '機能通貨貸方' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(240)', role: 'normal', desc: '明細摘要' }
    ]
  },
  {
    id: 'GL_IMPORT_REFERENCES', name: 'GL_IMPORT_REFERENCES', jpName: 'GL仕訳インポート参照',
    domain: 'GL_LEDGER', pk: ['JE_HEADER_ID', 'JE_LINE_NUM', 'GL_SL_LINK_ID'], fks: ['JE_BATCH_ID', 'JE_HEADER_ID', 'GL_SL_LINK_ID'],
    pos: { x: 1306, y: 772, w: 274, h: 86 },
    description: 'GL仕訳明細とXLA_AE_LINESをGL_SL_LINK_IDで1:1結合し、GLからAP請求・取消・分割支払へのドリルスルーを保証。',
    columns: [
      { name: 'JE_BATCH_ID', type: 'NUMBER(18)', role: 'fk', desc: '仕訳バッチID' },
      { name: 'JE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: '仕訳ヘッダID' },
      { name: 'JE_LINE_NUM', type: 'NUMBER(15)', role: 'pk', desc: '仕訳明細番号' },
      { name: 'REFERENCE_5', type: 'VARCHAR2(240)', role: 'fk', desc: 'ENTITY_ID (参照5)' },
      { name: 'REFERENCE_6', type: 'VARCHAR2(240)', role: 'fk', desc: 'EVENT_ID (参照6)' },
      { name: 'REFERENCE_7', type: 'VARCHAR2(240)', role: 'fk', desc: 'AE_HEADER_ID (参照7)' },
      { name: 'GL_SL_LINK_ID', type: 'NUMBER(18)', role: 'pk', desc: 'GL-SLAリンクID' },
      { name: 'GL_SL_LINK_TABLE', type: 'VARCHAR2(30)', role: 'normal', desc: 'リンク元テーブル (XLAJEL)' }
    ]
  },
  {
    id: 'GL_BALANCES', name: 'GL_BALANCES', jpName: 'GL総勘定元帳残高',
    domain: 'GL_LEDGER', pk: ['LEDGER_ID', 'CODE_COMBINATION_ID', 'CURRENCY_CODE', 'PERIOD_NAME', 'ACTUAL_FLAG'], fks: ['LEDGER_ID', 'CODE_COMBINATION_ID'],
    pos: { x: 1306, y: 947, w: 274, h: 86 },
    description: 'CCID(AFF 9セグメント)×会計期間別の試算表残高。Step 8で8勘定すべてが更新（買掛金期末残高=0）。',
    columns: [
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'pk', desc: '元帳ID' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'pk', desc: '勘定CCID' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'pk', desc: '通貨コード' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'pk', desc: '会計期間' },
      { name: 'ACTUAL_FLAG', type: 'VARCHAR2(1)', role: 'pk', desc: '実績フラグ (A)' },
      { name: 'BEGIN_BALANCE_DR', type: 'NUMBER', role: 'amount', desc: '期首借方残高' },
      { name: 'BEGIN_BALANCE_CR', type: 'NUMBER', role: 'amount', desc: '期首貸方残高' },
      { name: 'PERIOD_NET_DR', type: 'NUMBER', role: 'amount', desc: '当期借方発生 (0→集計値)' },
      { name: 'PERIOD_NET_CR', type: 'NUMBER', role: 'amount', desc: '当期貸方発生 (0→集計値)' }
    ]
  }
];

const RELATIONS = [
  { from: 'XLE_ENTITY_PROFILES', to: 'CE_BANK_ACCOUNTS', join: 'XLE.LEGAL_ENTITY_ID = CBA.ACCOUNT_OWNER_ORG_ID', label: '法的実体→銀行口座' },
  { from: 'HR_ALL_ORGANIZATION_UNITS_F', to: 'AP_SYSTEM_PARAMETERS_ALL', join: 'HR.ORGANIZATION_ID = AP_SP.ORG_ID', label: 'BU→APオプション' },
  { from: 'GL_LEDGERS', to: 'GL_PERIOD_STATUSES', join: 'GL.LEDGER_ID = GPS.LEDGER_ID', label: '元帳→会計期間(200/101)' },
  { from: 'FND_ID_FLEX_SEGMENTS', to: 'GL_CODE_COMBINATIONS', join: 'SEG.ID_FLEX_NUM = GCC.CHART_OF_ACCOUNTS_ID', label: 'AFF9構造→CCID' },
  { from: 'HZ_PARTIES', to: 'HZ_PARTY_SITES', join: 'HP.PARTY_ID = HPS.PARTY_ID', label: 'パーティ→サイト' },
  { from: 'HZ_LOCATIONS', to: 'HZ_PARTY_SITES', join: 'HL.LOCATION_ID = HPS.LOCATION_ID', label: '物理住所→サイト' },
  { from: 'HZ_PARTIES', to: 'POZ_SUPPLIERS', join: 'HP.PARTY_ID = PS.PARTY_ID', label: '法人実体→サプライヤ' },
  { from: 'POZ_SUPPLIERS', to: 'POZ_SUPPLIER_SITES_ALL_M', join: 'PS.VENDOR_ID = PSS.VENDOR_ID', label: 'サプライヤ→サイト' },
  { from: 'POZ_SUPPLIER_SITES_ALL_M', to: 'POZ_SITE_ASSIGNMENTS_ALL_M', join: 'PSS.VENDOR_SITE_ID = PSA.VENDOR_SITE_ID', label: 'サイト→BU割当' },
  { from: 'FINANCIALS_SYSTEM_PARAMS_ALL', to: 'AP_SYSTEM_PARAMETERS_ALL', join: 'FSP.ORG_ID = AP_SP.ORG_ID', label: '共通オプション→AP設定' },
  { from: 'AP_TERMS_B', to: 'AP_TERMS_TL', join: 'ATB.TERM_ID = ATT.TERM_ID', label: '支払条件→翻訳名称' },
  { from: 'AP_TERMS_B', to: 'AP_TERMS_LINES', join: 'ATB.TERM_ID = ATL.TERM_ID', label: '支払条件→期日割合' },
  { from: 'ZX_REGIMES_B', to: 'ZX_TAXES_B', join: 'ZXRG.TAX_REGIME_CODE = ZXT.TAX_REGIME_CODE', label: '税制度→税金' },
  { from: 'ZX_TAXES_B', to: 'ZX_STATUS_B', join: 'ZXT.TAX = ZXS.TAX', label: '税金→税ステータス' },
  { from: 'ZX_STATUS_B', to: 'ZX_RATES_B', join: 'ZXS.TAX_STATUS_CODE = ZXR.TAX_STATUS_CODE', label: 'ステータス→税率(10%/8%)' },
  { from: 'AP_AWT_GROUPS', to: 'AP_AWT_GROUP_TAXES_ALL', join: 'AG.GROUP_ID = AGT.GROUP_ID', label: '源泉グループ→税割当' },
  { from: 'AP_AWT_GROUP_TAXES_ALL', to: 'AP_AWT_TAX_RATES_ALL', join: 'AGT.TAX_NAME = ATR.TAX_NAME', label: '段階源泉税率(10.21%/20.42%)' },
  { from: 'CE_BANK_ACCOUNTS', to: 'CE_BANK_ACCT_USES_ALL', join: 'CBA.BANK_ACCOUNT_ID = CBAU.BANK_ACCOUNT_ID', label: '銀行口座→BU利用' },
  { from: 'CE_BANK_ACCOUNTS', to: 'CE_PAYMENT_DOCUMENTS', join: 'CBA.BANK_ACCOUNT_ID = CPD.INTERNAL_BANK_ACCOUNT_ID', label: '銀行口座→支払文書連番' },
  { from: 'IBY_EXT_BANK_ACCOUNTS', to: 'IBY_PMT_INSTR_USES_ALL', join: 'IEBA.EXT_BANK_ACCOUNT_ID = IPIU.INSTRUMENT_ID', label: '仕入先銀行→手段割当' },
  { from: 'IBY_EXTERNAL_PAYEES_ALL', to: 'IBY_PMT_INSTR_USES_ALL', join: 'IEP.EXT_PAYEE_ID = IPIU.EXT_PMT_PARTY_ID', label: '外部受取人→口座割当' },
  { from: 'POZ_SITE_ASSIGNMENTS_ALL_M', to: 'AP_INVOICES_ALL', join: 'PSA.VENDOR_SITE_ID = AI.VENDOR_SITE_ID AND PSA.BU_ID = AI.ORG_ID', label: '負債CCID・AWT→請求' },
  { from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_LINES_ALL', join: 'AI.INVOICE_ID = AIL.INVOICE_ID', label: '請求ヘッダ→明細6行' },
  { from: 'AP_INVOICE_LINES_ALL', to: 'ZX_LINES_DET_FACTORS', join: 'AIL.INVOICE_ID = ZDF.TRX_ID AND AIL.LINE_NUMBER = ZDF.TRX_LINE_ID', label: '請求明細→税決定ファクタ' },
  { from: 'ZX_RATES_B', to: 'ZX_LINES', join: 'ZXR.TAX_RATE_ID = ZXL.TAX_RATE_ID', label: '税率→消費税計算明細' },
  { from: 'ZX_LINES', to: 'ZX_LINES_SUMMARY', join: 'ZXL.TRX_ID = ZXLS.TRX_ID AND ZXL.TAX_RATE_CODE = ZXLS.TAX_RATE_CODE', label: '税明細→サマリ税' },
  { from: 'ZX_LINES', to: 'ZX_REC_NREC_DIST', join: 'ZXL.TAX_LINE_ID = ZRD.TAX_LINE_ID', label: '税明細→控除税配賦' },
  { from: 'AP_AWT_TAX_RATES_ALL', to: 'ZX_WITHHOLDING_LINES', join: '段階税率判定 → ZWL', label: '段階源泉→源泉明細' },
  { from: 'AP_AWT_TAX_RATES_ALL', to: 'AP_AWT_BUCKETS_ALL', join: '累積課税標準額→期間バケット', label: '源泉累積額管理' },
  { from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', join: 'AIL.INVOICE_ID = AID.INVOICE_ID AND AIL.LINE_NUMBER = AID.INVOICE_LINE_NUMBER', label: '請求明細→配賦6行' },
  { from: 'ZX_REC_NREC_DIST', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', join: 'ZRD.REC_NREC_TAX_DIST_ID = AID.DETAIL_TAX_DIST_ID', label: '仮払消費税配賦連携' },
  { from: 'AP_INVOICES_ALL', to: 'AP_PAYMENT_SCHEDULES_ALL', join: 'AI.INVOICE_ID = APS.INVOICE_ID', label: '請求→支払予定(分割管理)' },
  { from: 'AP_INV_SELECTION_CRITERIA_ALL', to: 'AP_SELECTED_INVOICES_ALL', join: 'AISC.CHECKRUN_ID = ASI.CHECKRUN_ID', label: 'PPR基準→選択明細' },
  { from: 'AP_PAYMENT_SCHEDULES_ALL', to: 'AP_SELECTED_INVOICES_ALL', join: 'APS.INVOICE_ID = ASI.INVOICE_ID AND APS.PAYMENT_NUM = ASI.PAYMENT_NUM', label: '支払予定→PPR抽出' },
  { from: 'AP_INV_SELECTION_CRITERIA_ALL', to: 'IBY_PAY_SERVICE_REQUESTS', join: 'AISC.CHECKRUN_NAME = IPSR.CALL_APP_PAY_SERVICE_REQ_CODE', label: 'PPR→IBY支払要求' },
  { from: 'IBY_PAY_SERVICE_REQUESTS', to: 'IBY_DOCS_PAYABLE_ALL', join: 'IPSR.PAYMENT_SERVICE_REQUEST_ID = IDP.PAYMENT_SERVICE_REQUEST_ID', label: 'IBY要求→支払文書' },
  { from: 'IBY_PAY_INSTRUCTIONS_ALL', to: 'IBY_PAYMENTS_ALL', join: 'IPI.PAYMENT_INSTRUCTION_ID = IP.PAYMENT_INSTRUCTION_ID', label: '支払指示→IBY支払' },
  { from: 'IBY_PAYMENTS_ALL', to: 'AP_CHECKS_ALL', join: 'IP.PAYMENT_ID = AC.PAYMENT_ID', label: 'IBY支払→AP支払ヘッダ' },
  { from: 'CE_PAYMENT_DOCUMENTS', to: 'AP_CHECKS_ALL', join: 'CPD.PAYMENT_DOCUMENT_ID = AC.PAYMENT_DOCUMENT_ID', label: '採番文書→小切手/振込' },
  { from: 'AP_CHECKS_ALL', to: 'AP_INVOICE_PAYMENTS_ALL', join: 'AC.CHECK_ID = AIP.CHECK_ID', label: '支払ヘッダ→請求支払紐付' },
  { from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', join: 'AC.CHECK_ID = APH.CHECK_ID', label: '支払→支払/取消イベント履歴' },
  { from: 'AP_PAYMENT_HISTORY_ALL', to: 'AP_PAYMENT_HIST_DISTS', join: 'APH.PAYMENT_HISTORY_ID = APHD.PAYMENT_HISTORY_ID', label: '履歴→配賦別支払明細' },
  { from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'AP_PAYMENT_HIST_DISTS', join: 'AID.INVOICE_DISTRIBUTION_ID = APHD.INVOICE_DISTRIBUTION_ID', label: '請求配賦←分割支払配賦' },
  { from: 'AP_INVOICES_ALL', to: 'XLA_TRANSACTION_ENTITIES', join: "AI.INVOICE_ID = XTE.SOURCE_ID_INT_1 AND XTE.ENTITY_CODE='AP_INVOICES'", label: '請求→SLAエンティティ' },
  { from: 'AP_CHECKS_ALL', to: 'XLA_TRANSACTION_ENTITIES', join: "AC.CHECK_ID = XTE.SOURCE_ID_INT_1 AND XTE.ENTITY_CODE='AP_PAYMENTS'", label: '支払→SLAエンティティ' },
  { from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', join: 'XTE.ENTITY_ID = XE.ENTITY_ID', label: 'エンティティ→5イベント' },
  { from: 'XLA_EVENTS', to: 'XLA_AE_HEADERS', join: 'XE.EVENT_ID = XAH.EVENT_ID', label: 'イベント→SLA仕訳ヘッダ' },
  { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', join: 'XAH.AE_HEADER_ID = XAL.AE_HEADER_ID', label: 'SLAヘッダ→15仕訳明細' },
  { from: 'XLA_AE_LINES', to: 'XLA_DISTRIBUTION_LINKS', join: 'XAL.AE_HEADER_ID = XDL.AE_HEADER_ID AND XAL.AE_LINE_NUM = XDL.AE_LINE_NUM', label: 'SLA明細→監査リンク(24行)' },
  { from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'XLA_DISTRIBUTION_LINKS', join: "AID.INVOICE_DISTRIBUTION_ID = XDL.SOURCE_DISTRIBUTION_ID_NUM_1 AND XDL.SOURCE_DISTRIBUTION_TYPE='AP_INV_DIST'", label: 'AP配賦→XDL監査リンク' },
  { from: 'AP_PAYMENT_HIST_DISTS', to: 'XLA_DISTRIBUTION_LINKS', join: "APHD.PAYMENT_HIST_DIST_ID = XDL.SOURCE_DISTRIBUTION_ID_NUM_1 AND XDL.SOURCE_DISTRIBUTION_TYPE='AP_PMT_DIST'", label: '支払配賦→XDL監査リンク' },
  { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', join: 'XAL.GL_SL_LINK_ID = GI.GL_SL_LINK_ID AND XAL.GL_SL_LINK_TABLE = GI.GL_SL_LINK_TABLE', label: 'SLA→GL_INTERFACE' },
  { from: 'GL_INTERFACE', to: 'GL_JE_BATCHES', join: 'Journal Import → バッチ生成', label: 'I/F→GL仕訳バッチ' },
  { from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', join: 'GJB.JE_BATCH_ID = GJH.JE_BATCH_ID', label: 'バッチ→GLヘッダ(2件)' },
  { from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', join: 'GJH.JE_HEADER_ID = GJL.JE_HEADER_ID', label: 'GLヘッダ→15明細' },
  { from: 'GL_JE_LINES', to: 'GL_IMPORT_REFERENCES', join: 'GJL.JE_HEADER_ID = GIR.JE_HEADER_ID AND GJL.JE_LINE_NUM = GIR.JE_LINE_NUM', label: 'GL明細→参照リンク' },
  { from: 'XLA_AE_LINES', to: 'GL_IMPORT_REFERENCES', join: 'XAL.GL_SL_LINK_ID = GIR.GL_SL_LINK_ID', label: 'SLA↔GLドリルスルー' },
  { from: 'GL_JE_LINES', to: 'GL_BALANCES', join: 'GJL.CODE_COMBINATION_ID = GB.CODE_COMBINATION_ID AND GJL.PERIOD_NAME = GB.PERIOD_NAME', label: 'GL転記→残高集計' }
];

const TABLE_RECORDS = {
  // === A. 企業構造・元帳・期間・AFFマスタ (6) ===
  XLE_ENTITY_PROFILES: [
    { createdAtStep: 0, data: { LEGAL_ENTITY_ID: 201, NAME: 'フュージョン株式会社', LEGAL_ENTITY_IDENTIFIER: 'JP201', TRANSACTING_ENTITY_FLAG: 'Y', EFFECTIVE_FROM: '2020-04-01' } }
  ],
  HR_ALL_ORGANIZATION_UNITS_F: [
    { createdAtStep: 0, data: { ORGANIZATION_ID: 401, EFFECTIVE_START_DATE: '2020-04-01', EFFECTIVE_END_DATE: '4712-12-31', BUSINESS_GROUP_ID: 1, ORGANIZATION_CODE: 'JP_BU_401', INTERNAL_EXTERNAL_FLAG: 'INT', TYPE: 'FUN_BUSINESS_UNIT', LOCATION_ID: 101 } }
  ],
  GL_LEDGERS: [
    { createdAtStep: 0, data: { LEDGER_ID: 3001, NAME: 'JP Primary Ledger', SHORT_NAME: 'JP_PL', LEDGER_CATEGORY_CODE: 'PRIMARY', CHART_OF_ACCOUNTS_ID: 101, CURRENCY_CODE: 'JPY', PERIOD_SET_NAME: 'JP_CALENDAR', ACCOUNTED_PERIOD_TYPE: 'MONTH', SLA_ACCOUNTING_METHOD_CODE: 'STANDARD_ACCRUAL' } }
  ],
  GL_PERIOD_STATUSES: [
    { createdAtStep: 0, data: { APPLICATION_ID: 200, LEDGER_ID: 3001, SET_OF_BOOKS_ID: 3001, PERIOD_NAME: '2026-11', CLOSING_STATUS: 'O', START_DATE: '2026-11-01', END_DATE: '2026-11-30', PERIOD_YEAR: 2026, PERIOD_NUM: 11 } },
    { createdAtStep: 0, data: { APPLICATION_ID: 101, LEDGER_ID: 3001, SET_OF_BOOKS_ID: 3001, PERIOD_NAME: '2026-11', CLOSING_STATUS: 'O', START_DATE: '2026-11-01', END_DATE: '2026-11-30', PERIOD_YEAR: 2026, PERIOD_NUM: 11 } }
  ],
  FND_ID_FLEX_SEGMENTS: AFF_SEGMENTS.map((seg, i) => ({
    createdAtStep: 0,
    data: {
      APPLICATION_ID: 101, ID_FLEX_CODE: 'GL#', ID_FLEX_NUM: 101,
      APPLICATION_COLUMN_NAME: seg.seg, SEGMENT_NAME: seg.name, SEGMENT_NUM: i + 1,
      ENABLED_FLAG: 'Y', REQUIRED_FLAG: 'Y', FLEX_VALUE_SET_ID: 10101 + i
    }
  })),
  GL_CODE_COMBINATIONS: CCID_LIST.map(c => ({
    createdAtStep: 0,
    data: {
      CODE_COMBINATION_ID: c.CODE_COMBINATION_ID,
      CHART_OF_ACCOUNTS_ID: c.CHART_OF_ACCOUNTS_ID,
      ACCOUNT_TYPE: c.ACCOUNT_TYPE,
      ENABLED_FLAG: c.ENABLED_FLAG,
      DETAIL_POSTING_ALLOWED_FLAG: c.DETAIL_POSTING_ALLOWED_FLAG,
      SEGMENT1: c.SEGMENT1, SEGMENT2: c.SEGMENT2, SEGMENT3: c.SEGMENT3,
      SEGMENT4: c.SEGMENT4, SEGMENT5: c.SEGMENT5, SEGMENT6: c.SEGMENT6,
      SEGMENT7: c.SEGMENT7, SEGMENT8: c.SEGMENT8, SEGMENT9: c.SEGMENT9
    }
  })),

  // === B. サプライヤマスタ TCA & POZ (6) ===
  HZ_PARTIES: [
    { createdAtStep: 0, data: { PARTY_ID: 30001, PARTY_NUMBER: 'P-30001', PARTY_NAME: '株式会社テックパートナーズ', PARTY_TYPE: 'ORGANIZATION', STATUS: 'A' } }
  ],
  HZ_LOCATIONS: [
    { createdAtStep: 0, data: { LOCATION_ID: 30401, ADDRESS1: '渋谷区神南1-10-5', CITY: '渋谷区', STATE: '東京都', POSTAL_CODE: '150-0041', COUNTRY: 'JP' } }
  ],
  HZ_PARTY_SITES: [
    { createdAtStep: 0, data: { PARTY_SITE_ID: 30501, PARTY_ID: 30001, LOCATION_ID: 30401, PARTY_SITE_NUMBER: 'PS-30501', STATUS: 'A', IDENTIFYING_ADDRESS_FLAG: 'Y' } }
  ],
  POZ_SUPPLIERS: [
    { createdAtStep: 0, data: { VENDOR_ID: 3001, PARTY_ID: 30001, SEGMENT1: 'SUP-1001', VENDOR_TYPE_LOOKUP_CODE: 'SUPPLIER', ENABLED_FLAG: 'Y' } }
  ],
  POZ_SUPPLIER_SITES_ALL_M: [
    { createdAtStep: 0, data: { VENDOR_SITE_ID: 3101, EFFECTIVE_START_DATE: '2020-04-01', EFFECTIVE_END_DATE: '4712-12-31', VENDOR_ID: 3001, PRC_BU_ID: 401, PARTY_SITE_ID: 30501, VENDOR_SITE_CODE: 'TOKYO-PAY', PURCHASING_SITE_FLAG: 'Y', PAY_SITE_FLAG: 'Y' } }
  ],
  POZ_SITE_ASSIGNMENTS_ALL_M: [
    { createdAtStep: 0, data: { ASSIGNMENT_ID: 3201, EFFECTIVE_START_DATE: '2020-04-01', EFFECTIVE_END_DATE: '4712-12-31', VENDOR_SITE_ID: 3101, BU_ID: 401, ACCTS_PAY_CODE_COMBINATION_ID: 2101, PREPAY_CODE_COMBINATION_ID: 2101, AWT_GROUP_ID: 8001 } }
  ],

  // === C. AP・消費税・源泉・銀行・IBY支払マスタ (20) ===
  FINANCIALS_SYSTEM_PARAMS_ALL: [
    { createdAtStep: 0, data: { ORG_ID: 401, SET_OF_BOOKS_ID: 3001, ACCTS_PAY_CODE_COMBINATION_ID: 2101 } }
  ],
  AP_SYSTEM_PARAMETERS_ALL: [
    { createdAtStep: 0, data: { ORG_ID: 401, SET_OF_BOOKS_ID: 3001, BASE_CURRENCY_CODE: 'JPY', ALLOW_AWT_FLAG: 'Y', CREATE_AWT_DISTS_TYPE: 'APPROVAL' } }
  ],
  AP_TERMS_B: [
    { createdAtStep: 0, data: { TERM_ID: 22001, TYPE: 'STANDARD', ENABLED_FLAG: 'Y', DUE_CUTOFF_DAY: null, START_DATE_ACTIVE: '2020-04-01' } }
  ],
  AP_TERMS_TL: [
    { createdAtStep: 0, data: { TERM_ID: 22001, LANGUAGE: 'JA', SOURCE_LANG: 'JA', NAME: 'Net 25 Days', DESCRIPTION: '請求日後25日以内支払' } }
  ],
  AP_TERMS_LINES: [
    { createdAtStep: 0, data: { TERM_ID: 22001, SEQUENCE_NUM: 1, DUE_PERCENT: 100, DUE_DAYS: 25 } }
  ],
  ZX_REGIMES_B: [
    { createdAtStep: 0, data: { TAX_REGIME_ID: 24001, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX_REGIME_TYPE_CODE: 'TAX', COUNTRY_CODE: 'JP', EFFECTIVE_FROM: '2019-10-01', ALLOW_RECOVERABILITY_FLAG: 'Y' } }
  ],
  ZX_TAXES_B: [
    { createdAtStep: 0, data: { TAX_ID: 24002, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_TYPE_CODE: 'VAT', LIVE_FOR_PROCESSING_FLAG: 'Y', EFFECTIVE_FROM: '2019-10-01' } }
  ],
  ZX_STATUS_B: [
    { createdAtStep: 0, data: { TAX_STATUS_ID: 24011, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'STANDARD', DEFAULT_STATUS_FLAG: 'Y', EFFECTIVE_FROM: '2019-10-01' } },
    { createdAtStep: 0, data: { TAX_STATUS_ID: 24012, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'REDUCED', DEFAULT_STATUS_FLAG: 'N', EFFECTIVE_FROM: '2019-10-01' } }
  ],
  ZX_RATES_B: [
    { createdAtStep: 0, data: { TAX_RATE_ID: 24110, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'STANDARD', TAX_RATE_CODE: 'JP_TAX_10', PERCENTAGE_RATE: 10, RATE_TYPE_CODE: 'PERCENTAGE', EFFECTIVE_FROM: '2019-10-01', ACTIVE_FLAG: 'Y' } },
    { createdAtStep: 0, data: { TAX_RATE_ID: 24108, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'REDUCED', TAX_RATE_CODE: 'JP_TAX_8_RED', PERCENTAGE_RATE: 8, RATE_TYPE_CODE: 'PERCENTAGE', EFFECTIVE_FROM: '2019-10-01', ACTIVE_FLAG: 'Y' } }
  ],
  AP_AWT_GROUPS: [
    { createdAtStep: 0, data: { GROUP_ID: 8001, NAME: 'JP_WHT_TIERED', DESCRIPTION: '報酬・料金段階源泉所得税(100万以下10.21%/超20.42%)', INACTIVE_DATE: null } }
  ],
  AP_AWT_GROUP_TAXES_ALL: [
    { createdAtStep: 0, data: { GROUP_ID: 8001, TAX_NAME: 'JP_WHT_TIER', RANK: 1, ORG_ID: 401 } }
  ],
  AP_AWT_TAX_RATES_ALL: [
    { createdAtStep: 0, data: { TAX_RATE_ID: 8201, TAX_NAME: 'JP_WHT_TIER', RATE_TYPE: 'STANDARD', TAX_RATE: 10.21, START_AMOUNT: 0, END_AMOUNT: 1000000, START_DATE: '2020-01-01', END_DATE: null, ORG_ID: 401 } },
    { createdAtStep: 0, data: { TAX_RATE_ID: 8202, TAX_NAME: 'JP_WHT_TIER', RATE_TYPE: 'STANDARD', TAX_RATE: 20.42, START_AMOUNT: 1000000, END_AMOUNT: 999999999, START_DATE: '2020-01-01', END_DATE: null, ORG_ID: 401 } }
  ],
  CE_BANK_ACCOUNTS: [
    { createdAtStep: 0, data: { BANK_ACCOUNT_ID: 27001, BANK_ACCOUNT_NAME: 'みずほ銀行東京営業部_普通', BANK_ACCOUNT_NUM: '1234567', CURRENCY_CODE: 'JPY', ACCOUNT_OWNER_ORG_ID: 201, CASH_CLEARING_CCID: 1001, ASSET_CODE_COMBINATION_ID: 1001 } }
  ],
  CE_BANK_ACCT_USES_ALL: [
    { createdAtStep: 0, data: { BANK_ACCT_USE_ID: 28001, BANK_ACCOUNT_ID: 27001, ORG_ID: 401, LEGAL_ENTITY_ID: 201, AP_USE_ENABLE_FLAG: 'Y', AR_USE_ENABLE_FLAG: 'Y', PRIMARY_FLAG: 'Y' } }
  ],
  CE_PAYMENT_DOCUMENTS: [
    {
      createdAtStep: 0,
      data: {
        PAYMENT_DOCUMENT_ID: 29001, PAYMENT_DOCUMENT_NAME: '全銀総合振込電子番号',
        INTERNAL_BANK_ACCOUNT_ID: 27001, PAPER_STOCK_TYPE: 'BLANK', FORMAT_CODE: 'ZENGIN_EFT',
        FIRST_AVAILABLE_DOCUMENT_NUM: 1001, LAST_AVAILABLE_DOCUMENT_NUMBER: 99999,
        LAST_ISSUED_DOCUMENT_NUMBER: 1000, MANUAL_PAYMENTS_ONLY_FLAG: 'N'
      },
      updates: {
        3: { LAST_ISSUED_DOCUMENT_NUMBER: 1001 },
        5: { LAST_ISSUED_DOCUMENT_NUMBER: 1002 },
        6: { LAST_ISSUED_DOCUMENT_NUMBER: 1003 }
      }
    }
  ],
  IBY_PAYMENT_METHODS_B: [
    { createdAtStep: 0, data: { PAYMENT_METHOD_CODE: 'EFT', SUPPORT_BILLS_PAYABLE_FLAG: 'N', MATURITY_DATE_OFFSET_DAYS: 0, INACTIVE_DATE: null } }
  ],
  IBY_ACCT_PMT_PROFILES_B: [
    { createdAtStep: 0, data: { PAYMENT_PROFILE_ID: 31001, SYSTEM_PROFILE_CODE: 'JP_ZENGIN_EFT_PROFILE', BEP_ACCOUNT_ID: 1, SECURITY_CONFIGURATION_ID: 10, TRANSMIT_CONFIGURATION_ID: 20 } }
  ],
  IBY_EXT_BANK_ACCOUNTS: [
    { createdAtStep: 0, data: { EXT_BANK_ACCOUNT_ID: 33001, BANK_ACCOUNT_NUM: '7654321', BANK_ACCOUNT_NAME: 'カ）テックパートナーズ（三菱UFJ渋谷）', CURRENCY_CODE: 'JPY', COUNTRY_CODE: 'JP' } }
  ],
  IBY_EXTERNAL_PAYEES_ALL: [
    { createdAtStep: 0, data: { EXT_PAYEE_ID: 34001, PAYEE_PARTY_ID: 30001, SUPPLIER_SITE_ID: 3101, ORG_ID: 401, DEFAULT_PAYMENT_METHOD_CODE: 'EFT' } }
  ],
  IBY_PMT_INSTR_USES_ALL: [
    { createdAtStep: 0, data: { INSTRUMENT_PAYMENT_USE_ID: 35001, EXT_PMT_PARTY_ID: 34001, INSTRUMENT_ID: 33001, INSTRUMENT_TYPE: 'BANKACCOUNT', PAYMENT_FLOW: 'DISBURSEMENTS', ORDER_OF_PREFERENCE: 1, START_DATE: '2020-04-01' } }
  ],

  // === D. AP請求・消費税・源泉・支払予定・支払・取消トランザクション (20) ===
  AP_INVOICES_ALL: [
    {
      createdAtStep: 1,
      data: {
        INVOICE_ID: 50001, INVOICE_NUM: 'AP-INV-2026-0001', INVOICE_DATE: '2026-11-05',
        INVOICE_TYPE_LOOKUP_CODE: 'STANDARD', INVOICE_AMOUNT: 2180000, TOTAL_TAX_AMOUNT: 0, AMOUNT_PAID: 0,
        INVOICE_CURRENCY_CODE: 'JPY', PAYMENT_STATUS_FLAG: 'N', APPROVAL_STATUS: 'NEVER VALIDATED', WFAPPROVAL_STATUS: 'REQUIRED',
        AWT_FLAG: null, AWT_GROUP_ID: 8001,
        VENDOR_ID: 3001, VENDOR_SITE_ID: 3101, PARTY_ID: 30001, PARTY_SITE_ID: 30501,
        TERMS_ID: 22001, PAYMENT_METHOD_CODE: 'EFT', ACCTS_PAY_CODE_COMBINATION_ID: 2101,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001, LEGAL_ENTITY_ID: 201
      },
      updates: {
        2: { TOTAL_TAX_AMOUNT: 180000, APPROVAL_STATUS: 'APPROVED', WFAPPROVAL_STATUS: 'WFAPPROVED', AWT_FLAG: 'A' },
        3: { AMOUNT_PAID: 1873700, PAYMENT_STATUS_FLAG: 'Y' },
        4: { AMOUNT_PAID: 0, PAYMENT_STATUS_FLAG: 'N' },
        5: { AMOUNT_PAID: 997900, PAYMENT_STATUS_FLAG: 'P' },
        6: { AMOUNT_PAID: 1873700, PAYMENT_STATUS_FLAG: 'Y' }
      }
    }
  ],
  AP_INVOICE_LINES_ALL: [
    {
      createdAtStep: 1,
      data: {
        INVOICE_ID: 50001, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', LINE_SOURCE: 'MANUAL LINE ENTRY',
        DESCRIPTION: '明細1: システム設計委託報酬 (消費税10%・源泉10.21%)', AMOUNT: 1000000,
        TAX_CLASSIFICATION_CODE: 'JP_TAX_10', DEFAULT_DIST_CCID: 5001, AWT_GROUP_ID: 8001, SUMMARY_TAX_LINE_ID: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    },
    {
      createdAtStep: 1,
      data: {
        INVOICE_ID: 50001, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'ITEM', LINE_SOURCE: 'MANUAL LINE ENTRY',
        DESCRIPTION: '明細2: 定期技術資料制作報酬 (軽減税8%・100万超部分 源泉20.42%)', AMOUNT: 1000000,
        TAX_CLASSIFICATION_CODE: 'JP_TAX_8_RED', DEFAULT_DIST_CCID: 5002, AWT_GROUP_ID: 8001, SUMMARY_TAX_LINE_ID: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_ID: 50001, LINE_NUMBER: 3, LINE_TYPE_LOOKUP_CODE: 'TAX', LINE_SOURCE: 'ETAX',
        DESCRIPTION: '仮払消費税 (標準税率 10% / 明細1)', AMOUNT: 100000,
        TAX_CLASSIFICATION_CODE: 'JP_TAX_10', DEFAULT_DIST_CCID: 1501, AWT_GROUP_ID: null, SUMMARY_TAX_LINE_ID: 61001,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_ID: 50001, LINE_NUMBER: 4, LINE_TYPE_LOOKUP_CODE: 'TAX', LINE_SOURCE: 'ETAX',
        DESCRIPTION: '仮払消費税 (軽減税率 8% / 明細2)', AMOUNT: 80000,
        TAX_CLASSIFICATION_CODE: 'JP_TAX_8_RED', DEFAULT_DIST_CCID: 1502, AWT_GROUP_ID: null, SUMMARY_TAX_LINE_ID: 61002,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_ID: 50001, LINE_NUMBER: 5, LINE_TYPE_LOOKUP_CODE: 'AWT', LINE_SOURCE: 'AUTOMATIC WITHHOLDING',
        DESCRIPTION: '源泉徴収税 (100万円まで部分 10.21% / 明細1)', AMOUNT: -102100,
        TAX_CLASSIFICATION_CODE: null, DEFAULT_DIST_CCID: 2201, AWT_GROUP_ID: 8001, SUMMARY_TAX_LINE_ID: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_ID: 50001, LINE_NUMBER: 6, LINE_TYPE_LOOKUP_CODE: 'AWT', LINE_SOURCE: 'AUTOMATIC WITHHOLDING',
        DESCRIPTION: '源泉徴収税 (100万円超部分100万円 × 20.42% / 明細2)', AMOUNT: -204200,
        TAX_CLASSIFICATION_CODE: null, DEFAULT_DIST_CCID: 2202, AWT_GROUP_ID: 8001, SUMMARY_TAX_LINE_ID: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    }
  ],
  AP_INVOICE_DISTRIBUTIONS_ALL: [
    {
      createdAtStep: 2,
      data: {
        INVOICE_DISTRIBUTION_ID: 61001, INVOICE_ID: 50001, INVOICE_LINE_NUMBER: 1, DISTRIBUTION_LINE_NUMBER: 1,
        LINE_TYPE_LOOKUP_CODE: 'ITEM', AMOUNT: 1000000, DIST_CODE_COMBINATION_ID: 5001,
        ACCOUNTING_DATE: '2026-11-05', MATCH_STATUS_FLAG: 'A', DETAIL_TAX_DIST_ID: null,
        AWT_FLAG: null, AWT_RELATED_ID: null, AWT_GROSS_AMOUNT: null, AWT_GROUP_ID: 8001, AWT_TAX_RATE_ID: null,
        POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401
      },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90001 } }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_DISTRIBUTION_ID: 61002, INVOICE_ID: 50001, INVOICE_LINE_NUMBER: 2, DISTRIBUTION_LINE_NUMBER: 1,
        LINE_TYPE_LOOKUP_CODE: 'ITEM', AMOUNT: 1000000, DIST_CODE_COMBINATION_ID: 5002,
        ACCOUNTING_DATE: '2026-11-05', MATCH_STATUS_FLAG: 'A', DETAIL_TAX_DIST_ID: null,
        AWT_FLAG: null, AWT_RELATED_ID: null, AWT_GROSS_AMOUNT: null, AWT_GROUP_ID: 8001, AWT_TAX_RATE_ID: null,
        POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401
      },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90001 } }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_DISTRIBUTION_ID: 61003, INVOICE_ID: 50001, INVOICE_LINE_NUMBER: 3, DISTRIBUTION_LINE_NUMBER: 1,
        LINE_TYPE_LOOKUP_CODE: 'REC_TAX', AMOUNT: 100000, DIST_CODE_COMBINATION_ID: 1501,
        ACCOUNTING_DATE: '2026-11-05', MATCH_STATUS_FLAG: 'A', DETAIL_TAX_DIST_ID: 61501,
        AWT_FLAG: null, AWT_RELATED_ID: null, AWT_GROSS_AMOUNT: null, AWT_GROUP_ID: null, AWT_TAX_RATE_ID: null,
        POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401
      },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90001 } }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_DISTRIBUTION_ID: 61004, INVOICE_ID: 50001, INVOICE_LINE_NUMBER: 4, DISTRIBUTION_LINE_NUMBER: 1,
        LINE_TYPE_LOOKUP_CODE: 'REC_TAX', AMOUNT: 80000, DIST_CODE_COMBINATION_ID: 1502,
        ACCOUNTING_DATE: '2026-11-05', MATCH_STATUS_FLAG: 'A', DETAIL_TAX_DIST_ID: 61502,
        AWT_FLAG: null, AWT_RELATED_ID: null, AWT_GROSS_AMOUNT: null, AWT_GROUP_ID: null, AWT_TAX_RATE_ID: null,
        POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401
      },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90001 } }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_DISTRIBUTION_ID: 61005, INVOICE_ID: 50001, INVOICE_LINE_NUMBER: 5, DISTRIBUTION_LINE_NUMBER: 1,
        LINE_TYPE_LOOKUP_CODE: 'AWT', AMOUNT: -102100, DIST_CODE_COMBINATION_ID: 2201,
        ACCOUNTING_DATE: '2026-11-05', MATCH_STATUS_FLAG: 'A', DETAIL_TAX_DIST_ID: null,
        AWT_FLAG: 'A', AWT_RELATED_ID: 61001, AWT_GROSS_AMOUNT: 1000000, AWT_GROUP_ID: 8001, AWT_TAX_RATE_ID: 8201,
        POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401
      },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90001 } }
    },
    {
      createdAtStep: 2,
      data: {
        INVOICE_DISTRIBUTION_ID: 61006, INVOICE_ID: 50001, INVOICE_LINE_NUMBER: 6, DISTRIBUTION_LINE_NUMBER: 1,
        LINE_TYPE_LOOKUP_CODE: 'AWT', AMOUNT: -204200, DIST_CODE_COMBINATION_ID: 2202,
        ACCOUNTING_DATE: '2026-11-05', MATCH_STATUS_FLAG: 'A', DETAIL_TAX_DIST_ID: null,
        AWT_FLAG: 'A', AWT_RELATED_ID: 61002, AWT_GROSS_AMOUNT: 1000000, AWT_GROUP_ID: 8001, AWT_TAX_RATE_ID: 8202,
        POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401
      },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90001 } }
    }
  ],
  ZX_LINES_DET_FACTORS: [
    { createdAtStep: 1, data: { LINES_DET_FACTOR_ID: 60101, APPLICATION_ID: 200, ENTITY_CODE: 'AP_INVOICES', EVENT_CLASS_CODE: 'STANDARD INVOICES', TRX_ID: 50001, TRX_LINE_ID: 1, TAX_CLASSIFICATION_CODE: 'JP_TAX_10', LINE_AMT: 1000000, INTERNAL_ORGANIZATION_ID: 401 } },
    { createdAtStep: 1, data: { LINES_DET_FACTOR_ID: 60102, APPLICATION_ID: 200, ENTITY_CODE: 'AP_INVOICES', EVENT_CLASS_CODE: 'STANDARD INVOICES', TRX_ID: 50001, TRX_LINE_ID: 2, TAX_CLASSIFICATION_CODE: 'JP_TAX_8_RED', LINE_AMT: 1000000, INTERNAL_ORGANIZATION_ID: 401 } }
  ],
  ZX_LINES: [
    { createdAtStep: 2, data: { TAX_LINE_ID: 60501, APPLICATION_ID: 200, TRX_ID: 50001, TRX_LINE_ID: 1, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'STANDARD', TAX_RATE_ID: 24110, TAX_RATE_CODE: 'JP_TAX_10', TAX_RATE: 10, TAXABLE_AMT: 1000000, TAX_AMT: 100000 } },
    { createdAtStep: 2, data: { TAX_LINE_ID: 60502, APPLICATION_ID: 200, TRX_ID: 50001, TRX_LINE_ID: 2, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'REDUCED', TAX_RATE_ID: 24108, TAX_RATE_CODE: 'JP_TAX_8_RED', TAX_RATE: 8, TAXABLE_AMT: 1000000, TAX_AMT: 80000 } }
  ],
  ZX_LINES_SUMMARY: [
    { createdAtStep: 2, data: { SUMMARY_TAX_LINE_ID: 61001, TRX_ID: 50001, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'STANDARD', TAX_RATE_CODE: 'JP_TAX_10', TAX_RATE: 10, TAX_AMT: 100000 } },
    { createdAtStep: 2, data: { SUMMARY_TAX_LINE_ID: 61002, TRX_ID: 50001, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'REDUCED', TAX_RATE_CODE: 'JP_TAX_8_RED', TAX_RATE: 8, TAX_AMT: 80000 } }
  ],
  ZX_REC_NREC_DIST: [
    { createdAtStep: 2, data: { REC_NREC_TAX_DIST_ID: 61501, TAX_LINE_ID: 60501, TRX_ID: 50001, TAX_RATE_ID: 24110, RECOVERABLE_FLAG: 'Y', RECOVERY_RATE_CODE: 'REC_100', REC_NREC_TAX_AMT: 100000 } },
    { createdAtStep: 2, data: { REC_NREC_TAX_DIST_ID: 61502, TAX_LINE_ID: 60502, TRX_ID: 50001, TAX_RATE_ID: 24108, RECOVERABLE_FLAG: 'Y', RECOVERY_RATE_CODE: 'REC_100', REC_NREC_TAX_AMT: 80000 } }
  ],
  ZX_WITHHOLDING_LINES: [
    { createdAtStep: 2, data: { TAX_LINE_ID: 62001, TRX_ID: 50001, TRX_LINE_ID: 1, TAX: 'JP_WHT_TIER', TAX_RATE: 10.21, TAXABLE_AMT: 1000000, TAX_AMT: -102100 } },
    { createdAtStep: 2, data: { TAX_LINE_ID: 62002, TRX_ID: 50001, TRX_LINE_ID: 2, TAX: 'JP_WHT_TIER', TAX_RATE: 20.42, TAXABLE_AMT: 1000000, TAX_AMT: -204200 } }
  ],
  AP_AWT_BUCKETS_ALL: [
    { createdAtStep: 2, data: { PERIOD_NAME: '2026-11', TAX_NAME: 'JP_WHT_TIER', VENDOR_ID: 3001, GROSS_AMOUNT_TO_DATE: 2000000, WITHHELD_AMOUNT_TO_DATE: 306300, ORG_ID: 401 } }
  ],
  AP_PAYMENT_SCHEDULES_ALL: [
    {
      createdAtStep: 2,
      data: {
        INVOICE_ID: 50001, PAYMENT_NUM: 1, DUE_DATE: '2026-11-30',
        GROSS_AMOUNT: 1873700, AMOUNT_REMAINING: 1873700, PAYMENT_STATUS_FLAG: 'N',
        HOLD_FLAG: 'N', PAYMENT_METHOD_CODE: 'EFT', ORG_ID: 401
      },
      updates: {
        3: { AMOUNT_REMAINING: 0, PAYMENT_STATUS_FLAG: 'Y' },
        4: { DUE_DATE: '2026-11-20', GROSS_AMOUNT: 997900, AMOUNT_REMAINING: 997900, PAYMENT_STATUS_FLAG: 'N' },
        5: { AMOUNT_REMAINING: 0, PAYMENT_STATUS_FLAG: 'Y' }
      }
    },
    {
      createdAtStep: 4,
      data: {
        INVOICE_ID: 50001, PAYMENT_NUM: 2, DUE_DATE: '2026-11-25',
        GROSS_AMOUNT: 875800, AMOUNT_REMAINING: 875800, PAYMENT_STATUS_FLAG: 'N',
        HOLD_FLAG: 'N', PAYMENT_METHOD_CODE: 'EFT', ORG_ID: 401
      },
      updates: {
        6: { AMOUNT_REMAINING: 0, PAYMENT_STATUS_FLAG: 'Y' }
      }
    }
  ],
  AP_INV_SELECTION_CRITERIA_ALL: [
    { createdAtStep: 3, data: { CHECKRUN_ID: 71001, CHECKRUN_NAME: 'PPR-20261115-FULL', PAY_THRU_DATE: '2026-11-30', STATUS: 'CONFIRMED', PAYMENT_METHOD_CODE: 'EFT', ORG_ID: 401 } },
    { createdAtStep: 5, data: { CHECKRUN_ID: 71002, CHECKRUN_NAME: 'PPR-20261120-LINE1', PAY_THRU_DATE: '2026-11-20', STATUS: 'CONFIRMED', PAYMENT_METHOD_CODE: 'EFT', ORG_ID: 401 } },
    { createdAtStep: 6, data: { CHECKRUN_ID: 71003, CHECKRUN_NAME: 'PPR-20261125-LINE2', PAY_THRU_DATE: '2026-11-25', STATUS: 'CONFIRMED', PAYMENT_METHOD_CODE: 'EFT', ORG_ID: 401 } }
  ],
  AP_SELECTED_INVOICES_ALL: [
    { createdAtStep: 3, data: { CHECKRUN_ID: 71001, INVOICE_ID: 50001, PAYMENT_NUM: 1, PROPOSED_PAYMENT_AMOUNT: 1873700, PAYMENT_AMOUNT: 1873700, PAYMENT_METHOD_CODE: 'EFT', LEGAL_ENTITY_ID: 201, ORG_ID: 401 } },
    { createdAtStep: 5, data: { CHECKRUN_ID: 71002, INVOICE_ID: 50001, PAYMENT_NUM: 1, PROPOSED_PAYMENT_AMOUNT: 997900, PAYMENT_AMOUNT: 997900, PAYMENT_METHOD_CODE: 'EFT', LEGAL_ENTITY_ID: 201, ORG_ID: 401 } },
    { createdAtStep: 6, data: { CHECKRUN_ID: 71003, INVOICE_ID: 50001, PAYMENT_NUM: 2, PROPOSED_PAYMENT_AMOUNT: 875800, PAYMENT_AMOUNT: 875800, PAYMENT_METHOD_CODE: 'EFT', LEGAL_ENTITY_ID: 201, ORG_ID: 401 } }
  ],
  IBY_PAY_SERVICE_REQUESTS: [
    { createdAtStep: 3, data: { PAYMENT_SERVICE_REQUEST_ID: 91001, CALLING_APP_ID: 200, CALL_APP_PAY_SERVICE_REQ_CODE: 'PPR-20261115-FULL', PAYMENT_SERVICE_REQUEST_STATUS: 'PAYMENTS_CREATED' } },
    { createdAtStep: 5, data: { PAYMENT_SERVICE_REQUEST_ID: 91002, CALLING_APP_ID: 200, CALL_APP_PAY_SERVICE_REQ_CODE: 'PPR-20261120-LINE1', PAYMENT_SERVICE_REQUEST_STATUS: 'PAYMENTS_CREATED' } },
    { createdAtStep: 6, data: { PAYMENT_SERVICE_REQUEST_ID: 91003, CALLING_APP_ID: 200, CALL_APP_PAY_SERVICE_REQ_CODE: 'PPR-20261125-LINE2', PAYMENT_SERVICE_REQUEST_STATUS: 'PAYMENTS_CREATED' } }
  ],
  IBY_DOCS_PAYABLE_ALL: [
    {
      createdAtStep: 3,
      data: { DOCUMENT_PAYABLE_ID: 92001, PAYMENT_SERVICE_REQUEST_ID: 91001, PAYMENT_ID: 95001, CALLING_APP_DOC_UNIQUE_REF1: '50001-1', DOCUMENT_AMOUNT: 1873700, DOCUMENT_STATUS: 'PAYMENT_CREATED' },
      updates: { 4: { DOCUMENT_STATUS: 'VOID_BY_SETUP' } }
    },
    { createdAtStep: 5, data: { DOCUMENT_PAYABLE_ID: 92002, PAYMENT_SERVICE_REQUEST_ID: 91002, PAYMENT_ID: 95002, CALLING_APP_DOC_UNIQUE_REF1: '50001-1', DOCUMENT_AMOUNT: 997900, DOCUMENT_STATUS: 'PAYMENT_CREATED' } },
    { createdAtStep: 6, data: { DOCUMENT_PAYABLE_ID: 92003, PAYMENT_SERVICE_REQUEST_ID: 91003, PAYMENT_ID: 95003, CALLING_APP_DOC_UNIQUE_REF1: '50001-2', DOCUMENT_AMOUNT: 875800, DOCUMENT_STATUS: 'PAYMENT_CREATED' } }
  ],
  IBY_PAY_INSTRUCTIONS_ALL: [
    { createdAtStep: 3, data: { PAYMENT_INSTRUCTION_ID: 93001, PAYMENT_PROFILE_ID: 31001, INTERNAL_BANK_ACCOUNT_ID: 27001, PAYMENT_INSTRUCTION_STATUS: 'TRANSMITTED' } },
    { createdAtStep: 5, data: { PAYMENT_INSTRUCTION_ID: 93002, PAYMENT_PROFILE_ID: 31001, INTERNAL_BANK_ACCOUNT_ID: 27001, PAYMENT_INSTRUCTION_STATUS: 'TRANSMITTED' } },
    { createdAtStep: 6, data: { PAYMENT_INSTRUCTION_ID: 93003, PAYMENT_PROFILE_ID: 31001, INTERNAL_BANK_ACCOUNT_ID: 27001, PAYMENT_INSTRUCTION_STATUS: 'TRANSMITTED' } }
  ],
  IBY_PAYMENTS_ALL: [
    {
      createdAtStep: 3,
      data: { PAYMENT_ID: 95001, PAYMENT_SERVICE_REQUEST_ID: 91001, PAYMENT_INSTRUCTION_ID: 93001, PAPER_DOCUMENT_NUMBER: 1001, PAYMENT_AMOUNT: 1873700, PAYMENT_STATUS: 'ISSUED', VOID_DATE: null },
      updates: { 4: { PAYMENT_STATUS: 'VOID', VOID_DATE: '2026-11-16' } }
    },
    { createdAtStep: 5, data: { PAYMENT_ID: 95002, PAYMENT_SERVICE_REQUEST_ID: 91002, PAYMENT_INSTRUCTION_ID: 93002, PAPER_DOCUMENT_NUMBER: 1002, PAYMENT_AMOUNT: 997900, PAYMENT_STATUS: 'ISSUED', VOID_DATE: null } },
    { createdAtStep: 6, data: { PAYMENT_ID: 95003, PAYMENT_SERVICE_REQUEST_ID: 91003, PAYMENT_INSTRUCTION_ID: 93003, PAPER_DOCUMENT_NUMBER: 1003, PAYMENT_AMOUNT: 875800, PAYMENT_STATUS: 'ISSUED', VOID_DATE: null } }
  ],
  AP_CHECKS_ALL: [
    {
      createdAtStep: 3,
      data: { CHECK_ID: 70001, CHECK_NUMBER: 1001, CHECK_DATE: '2026-11-15', AMOUNT: 1873700, VENDOR_ID: 3001, VENDOR_SITE_ID: 3101, STATUS_LOOKUP_CODE: 'NEGOTIABLE', VOID_DATE: null, PAYMENT_ID: 95001, PAYMENT_DOCUMENT_ID: 29001, PAYMENT_METHOD_CODE: 'EFT', ORG_ID: 401 },
      updates: { 4: { STATUS_LOOKUP_CODE: 'VOIDED', VOID_DATE: '2026-11-16' } }
    },
    { createdAtStep: 5, data: { CHECK_ID: 70002, CHECK_NUMBER: 1002, CHECK_DATE: '2026-11-20', AMOUNT: 997900, VENDOR_ID: 3001, VENDOR_SITE_ID: 3101, STATUS_LOOKUP_CODE: 'NEGOTIABLE', VOID_DATE: null, PAYMENT_ID: 95002, PAYMENT_DOCUMENT_ID: 29001, PAYMENT_METHOD_CODE: 'EFT', ORG_ID: 401 } },
    { createdAtStep: 6, data: { CHECK_ID: 70003, CHECK_NUMBER: 1003, CHECK_DATE: '2026-11-25', AMOUNT: 875800, VENDOR_ID: 3001, VENDOR_SITE_ID: 3101, STATUS_LOOKUP_CODE: 'NEGOTIABLE', VOID_DATE: null, PAYMENT_ID: 95003, PAYMENT_DOCUMENT_ID: 29001, PAYMENT_METHOD_CODE: 'EFT', ORG_ID: 401 } }
  ],
  AP_INVOICE_PAYMENTS_ALL: [
    {
      createdAtStep: 3,
      data: { INVOICE_PAYMENT_ID: 80001, CHECK_ID: 70001, INVOICE_ID: 50001, PAYMENT_NUM: 1, AMOUNT: 1873700, ACCOUNTING_DATE: '2026-11-15', PERIOD_NAME: '2026-11', REVERSAL_FLAG: 'N', REVERSAL_INV_PMT_ID: null, POSTED_FLAG: 'N', ACCTS_PAY_CODE_COMBINATION_ID: 2101, SET_OF_BOOKS_ID: 3001 },
      updates: {
        4: { REVERSAL_FLAG: 'Y' },
        7: { POSTED_FLAG: 'Y' }
      }
    },
    {
      createdAtStep: 4,
      data: { INVOICE_PAYMENT_ID: 80002, CHECK_ID: 70001, INVOICE_ID: 50001, PAYMENT_NUM: 1, AMOUNT: -1873700, ACCOUNTING_DATE: '2026-11-16', PERIOD_NAME: '2026-11', REVERSAL_FLAG: 'Y', REVERSAL_INV_PMT_ID: 80001, POSTED_FLAG: 'N', ACCTS_PAY_CODE_COMBINATION_ID: 2101, SET_OF_BOOKS_ID: 3001 },
      updates: { 7: { POSTED_FLAG: 'Y' } }
    },
    {
      createdAtStep: 5,
      data: { INVOICE_PAYMENT_ID: 80003, CHECK_ID: 70002, INVOICE_ID: 50001, PAYMENT_NUM: 1, AMOUNT: 997900, ACCOUNTING_DATE: '2026-11-20', PERIOD_NAME: '2026-11', REVERSAL_FLAG: 'N', REVERSAL_INV_PMT_ID: null, POSTED_FLAG: 'N', ACCTS_PAY_CODE_COMBINATION_ID: 2101, SET_OF_BOOKS_ID: 3001 },
      updates: { 7: { POSTED_FLAG: 'Y' } }
    },
    {
      createdAtStep: 6,
      data: { INVOICE_PAYMENT_ID: 80004, CHECK_ID: 70003, INVOICE_ID: 50001, PAYMENT_NUM: 2, AMOUNT: 875800, ACCOUNTING_DATE: '2026-11-25', PERIOD_NAME: '2026-11', REVERSAL_FLAG: 'N', REVERSAL_INV_PMT_ID: null, POSTED_FLAG: 'N', ACCTS_PAY_CODE_COMBINATION_ID: 2101, SET_OF_BOOKS_ID: 3001 },
      updates: { 7: { POSTED_FLAG: 'Y' } }
    }
  ],
  AP_PAYMENT_HISTORY_ALL: [
    {
      createdAtStep: 3,
      data: { PAYMENT_HISTORY_ID: 85001, CHECK_ID: 70001, TRANSACTION_TYPE: 'PAYMENT CREATED', TRANSACTION_DATE: '2026-11-15', REV_PMT_HIST_ID: null, POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401 },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90002 } }
    },
    {
      createdAtStep: 4,
      data: { PAYMENT_HISTORY_ID: 85002, CHECK_ID: 70001, TRANSACTION_TYPE: 'PAYMENT CANCELLED', TRANSACTION_DATE: '2026-11-16', REV_PMT_HIST_ID: 85001, POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401 },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90003 } }
    },
    {
      createdAtStep: 5,
      data: { PAYMENT_HISTORY_ID: 85003, CHECK_ID: 70002, TRANSACTION_TYPE: 'PAYMENT CREATED', TRANSACTION_DATE: '2026-11-20', REV_PMT_HIST_ID: null, POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401 },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90004 } }
    },
    {
      createdAtStep: 6,
      data: { PAYMENT_HISTORY_ID: 85004, CHECK_ID: 70003, TRANSACTION_TYPE: 'PAYMENT CREATED', TRANSACTION_DATE: '2026-11-25', REV_PMT_HIST_ID: null, POSTED_FLAG: 'N', ACCOUNTING_EVENT_ID: null, ORG_ID: 401 },
      updates: { 7: { POSTED_FLAG: 'Y', ACCOUNTING_EVENT_ID: 90005 } }
    }
  ],
  AP_PAYMENT_HIST_DISTS: [
    // Step 3: 初回全額払 (6行 = 計1,873,700)
    { createdAtStep: 3, data: { PAYMENT_HIST_DIST_ID: 86001, PAYMENT_HISTORY_ID: 85001, INVOICE_PAYMENT_ID: 80001, INVOICE_DISTRIBUTION_ID: 61001, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 1000000, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90002 } } },
    { createdAtStep: 3, data: { PAYMENT_HIST_DIST_ID: 86002, PAYMENT_HISTORY_ID: 85001, INVOICE_PAYMENT_ID: 80001, INVOICE_DISTRIBUTION_ID: 61002, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 1000000, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90002 } } },
    { createdAtStep: 3, data: { PAYMENT_HIST_DIST_ID: 86003, PAYMENT_HISTORY_ID: 85001, INVOICE_PAYMENT_ID: 80001, INVOICE_DISTRIBUTION_ID: 61003, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 100000, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90002 } } },
    { createdAtStep: 3, data: { PAYMENT_HIST_DIST_ID: 86004, PAYMENT_HISTORY_ID: 85001, INVOICE_PAYMENT_ID: 80001, INVOICE_DISTRIBUTION_ID: 61004, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 80000, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90002 } } },
    { createdAtStep: 3, data: { PAYMENT_HIST_DIST_ID: 86005, PAYMENT_HISTORY_ID: 85001, INVOICE_PAYMENT_ID: 80001, INVOICE_DISTRIBUTION_ID: 61005, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: -102100, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90002 } } },
    { createdAtStep: 3, data: { PAYMENT_HIST_DIST_ID: 86006, PAYMENT_HISTORY_ID: 85001, INVOICE_PAYMENT_ID: 80001, INVOICE_DISTRIBUTION_ID: 61006, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: -204200, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90002 } } },
    // Step 4: 初回取消マイナス (6行 = 計 -1,873,700)
    { createdAtStep: 4, data: { PAYMENT_HIST_DIST_ID: 86007, PAYMENT_HISTORY_ID: 85002, INVOICE_PAYMENT_ID: 80002, INVOICE_DISTRIBUTION_ID: 61001, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: -1000000, REVERSAL_FLAG: 'Y', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90003 } } },
    { createdAtStep: 4, data: { PAYMENT_HIST_DIST_ID: 86008, PAYMENT_HISTORY_ID: 85002, INVOICE_PAYMENT_ID: 80002, INVOICE_DISTRIBUTION_ID: 61002, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: -1000000, REVERSAL_FLAG: 'Y', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90003 } } },
    { createdAtStep: 4, data: { PAYMENT_HIST_DIST_ID: 86009, PAYMENT_HISTORY_ID: 85002, INVOICE_PAYMENT_ID: 80002, INVOICE_DISTRIBUTION_ID: 61003, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: -100000, REVERSAL_FLAG: 'Y', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90003 } } },
    { createdAtStep: 4, data: { PAYMENT_HIST_DIST_ID: 86010, PAYMENT_HISTORY_ID: 85002, INVOICE_PAYMENT_ID: 80002, INVOICE_DISTRIBUTION_ID: 61004, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: -80000, REVERSAL_FLAG: 'Y', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90003 } } },
    { createdAtStep: 4, data: { PAYMENT_HIST_DIST_ID: 86011, PAYMENT_HISTORY_ID: 85002, INVOICE_PAYMENT_ID: 80002, INVOICE_DISTRIBUTION_ID: 61005, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 102100, REVERSAL_FLAG: 'Y', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90003 } } },
    { createdAtStep: 4, data: { PAYMENT_HIST_DIST_ID: 86012, PAYMENT_HISTORY_ID: 85002, INVOICE_PAYMENT_ID: 80002, INVOICE_DISTRIBUTION_ID: 61006, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 204200, REVERSAL_FLAG: 'Y', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90003 } } },
    // Step 5: 分割支払1回目 (明細1分 3行 = 計997,900)
    { createdAtStep: 5, data: { PAYMENT_HIST_DIST_ID: 86013, PAYMENT_HISTORY_ID: 85003, INVOICE_PAYMENT_ID: 80003, INVOICE_DISTRIBUTION_ID: 61001, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 1000000, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90004 } } },
    { createdAtStep: 5, data: { PAYMENT_HIST_DIST_ID: 86014, PAYMENT_HISTORY_ID: 85003, INVOICE_PAYMENT_ID: 80003, INVOICE_DISTRIBUTION_ID: 61003, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 100000, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90004 } } },
    { createdAtStep: 5, data: { PAYMENT_HIST_DIST_ID: 86015, PAYMENT_HISTORY_ID: 85003, INVOICE_PAYMENT_ID: 80003, INVOICE_DISTRIBUTION_ID: 61005, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: -102100, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90004 } } },
    // Step 6: 分割支払2回目 (明細2分 3行 = 計875,800)
    { createdAtStep: 6, data: { PAYMENT_HIST_DIST_ID: 86016, PAYMENT_HISTORY_ID: 85004, INVOICE_PAYMENT_ID: 80004, INVOICE_DISTRIBUTION_ID: 61002, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 1000000, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90005 } } },
    { createdAtStep: 6, data: { PAYMENT_HIST_DIST_ID: 86017, PAYMENT_HISTORY_ID: 85004, INVOICE_PAYMENT_ID: 80004, INVOICE_DISTRIBUTION_ID: 61004, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: 80000, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90005 } } },
    { createdAtStep: 6, data: { PAYMENT_HIST_DIST_ID: 86018, PAYMENT_HISTORY_ID: 85004, INVOICE_PAYMENT_ID: 80004, INVOICE_DISTRIBUTION_ID: 61006, PAY_DIST_LOOKUP_CODE: 'CASH', AMOUNT: -204200, REVERSAL_FLAG: 'N', ACCOUNTING_EVENT_ID: null }, updates: { 7: { ACCOUNTING_EVENT_ID: 90005 } } }
  ],

  // === E. SLA (Subledger Accounting) (5) ===
  XLA_TRANSACTION_ENTITIES: [
    { createdAtStep: 7, data: { ENTITY_ID: 70001, APPLICATION_ID: 200, LEGAL_ENTITY_ID: 201, ENTITY_CODE: 'AP_INVOICES', SOURCE_ID_INT_1: 50001, TRANSACTION_NUMBER: 'AP-INV-2026-0001', LEDGER_ID: 3001 } },
    { createdAtStep: 7, data: { ENTITY_ID: 70002, APPLICATION_ID: 200, LEGAL_ENTITY_ID: 201, ENTITY_CODE: 'AP_PAYMENTS', SOURCE_ID_INT_1: 70001, TRANSACTION_NUMBER: 'CHK-1001', LEDGER_ID: 3001 } },
    { createdAtStep: 7, data: { ENTITY_ID: 70003, APPLICATION_ID: 200, LEGAL_ENTITY_ID: 201, ENTITY_CODE: 'AP_PAYMENTS', SOURCE_ID_INT_1: 70002, TRANSACTION_NUMBER: 'CHK-1002', LEDGER_ID: 3001 } },
    { createdAtStep: 7, data: { ENTITY_ID: 70004, APPLICATION_ID: 200, LEGAL_ENTITY_ID: 201, ENTITY_CODE: 'AP_PAYMENTS', SOURCE_ID_INT_1: 70003, TRANSACTION_NUMBER: 'CHK-1003', LEDGER_ID: 3001 } }
  ],
  XLA_EVENTS: [
    { createdAtStep: 2, data: { EVENT_ID: 90001, APPLICATION_ID: 200, ENTITY_ID: 70001, EVENT_TYPE_CODE: 'INVOICE VALIDATED', EVENT_NUMBER: 1, EVENT_DATE: '2026-11-05', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U', ON_HOLD_FLAG: 'N', TRANSACTION_DATE: '2026-11-05' }, updates: { 7: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } },
    { createdAtStep: 3, data: { EVENT_ID: 90002, APPLICATION_ID: 200, ENTITY_ID: 70002, EVENT_TYPE_CODE: 'PAYMENT CREATED', EVENT_NUMBER: 1, EVENT_DATE: '2026-11-15', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U', ON_HOLD_FLAG: 'N', TRANSACTION_DATE: '2026-11-15' }, updates: { 7: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } },
    { createdAtStep: 4, data: { EVENT_ID: 90003, APPLICATION_ID: 200, ENTITY_ID: 70002, EVENT_TYPE_CODE: 'PAYMENT CANCELLED', EVENT_NUMBER: 2, EVENT_DATE: '2026-11-16', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U', ON_HOLD_FLAG: 'N', TRANSACTION_DATE: '2026-11-16' }, updates: { 7: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } },
    { createdAtStep: 5, data: { EVENT_ID: 90004, APPLICATION_ID: 200, ENTITY_ID: 70003, EVENT_TYPE_CODE: 'PAYMENT CREATED', EVENT_NUMBER: 1, EVENT_DATE: '2026-11-20', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U', ON_HOLD_FLAG: 'N', TRANSACTION_DATE: '2026-11-20' }, updates: { 7: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } },
    { createdAtStep: 6, data: { EVENT_ID: 90005, APPLICATION_ID: 200, ENTITY_ID: 70004, EVENT_TYPE_CODE: 'PAYMENT CREATED', EVENT_NUMBER: 1, EVENT_DATE: '2026-11-25', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U', ON_HOLD_FLAG: 'N', TRANSACTION_DATE: '2026-11-25' }, updates: { 7: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } }
  ],
  XLA_AE_HEADERS: [
    { createdAtStep: 7, data: { AE_HEADER_ID: 950001, APPLICATION_ID: 200, LEDGER_ID: 3001, ENTITY_ID: 70001, EVENT_ID: 90001, EVENT_TYPE_CODE: 'INVOICE VALIDATED', ACCOUNTING_DATE: '2026-11-05', GL_TRANSFER_STATUS_CODE: 'N', GL_TRANSFER_DATE: null, JE_CATEGORY_NAME: 'Purchase Invoices', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A', PERIOD_NAME: '2026-11' }, updates: { 8: { GL_TRANSFER_STATUS_CODE: 'Y', GL_TRANSFER_DATE: '2026-11-25' } } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950002, APPLICATION_ID: 200, LEDGER_ID: 3001, ENTITY_ID: 70002, EVENT_ID: 90002, EVENT_TYPE_CODE: 'PAYMENT CREATED', ACCOUNTING_DATE: '2026-11-15', GL_TRANSFER_STATUS_CODE: 'N', GL_TRANSFER_DATE: null, JE_CATEGORY_NAME: 'Payments', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A', PERIOD_NAME: '2026-11' }, updates: { 8: { GL_TRANSFER_STATUS_CODE: 'Y', GL_TRANSFER_DATE: '2026-11-25' } } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950003, APPLICATION_ID: 200, LEDGER_ID: 3001, ENTITY_ID: 70002, EVENT_ID: 90003, EVENT_TYPE_CODE: 'PAYMENT CANCELLED', ACCOUNTING_DATE: '2026-11-16', GL_TRANSFER_STATUS_CODE: 'N', GL_TRANSFER_DATE: null, JE_CATEGORY_NAME: 'Payments', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A', PERIOD_NAME: '2026-11' }, updates: { 8: { GL_TRANSFER_STATUS_CODE: 'Y', GL_TRANSFER_DATE: '2026-11-25' } } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950004, APPLICATION_ID: 200, LEDGER_ID: 3001, ENTITY_ID: 70003, EVENT_ID: 90004, EVENT_TYPE_CODE: 'PAYMENT CREATED', ACCOUNTING_DATE: '2026-11-20', GL_TRANSFER_STATUS_CODE: 'N', GL_TRANSFER_DATE: null, JE_CATEGORY_NAME: 'Payments', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A', PERIOD_NAME: '2026-11' }, updates: { 8: { GL_TRANSFER_STATUS_CODE: 'Y', GL_TRANSFER_DATE: '2026-11-25' } } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950005, APPLICATION_ID: 200, LEDGER_ID: 3001, ENTITY_ID: 70004, EVENT_ID: 90005, EVENT_TYPE_CODE: 'PAYMENT CREATED', ACCOUNTING_DATE: '2026-11-25', GL_TRANSFER_STATUS_CODE: 'N', GL_TRANSFER_DATE: null, JE_CATEGORY_NAME: 'Payments', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A', PERIOD_NAME: '2026-11' }, updates: { 8: { GL_TRANSFER_STATUS_CODE: 'Y', GL_TRANSFER_DATE: '2026-11-25' } } }
  ],
  XLA_AE_LINES: [
    // Event 1: 請求書検証 (7行)
    { createdAtStep: 7, data: { AE_HEADER_ID: 950001, AE_LINE_NUM: 1, APPLICATION_ID: 200, CODE_COMBINATION_ID: 5001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510001, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'ITEM_EXPENSE', ENTERED_DR: 1000000, ENTERED_CR: null, ACCOUNTED_DR: 1000000, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '外注費(明細1:10%対象)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950001, AE_LINE_NUM: 2, APPLICATION_ID: 200, CODE_COMBINATION_ID: 5002, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510002, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'ITEM_EXPENSE', ENTERED_DR: 1000000, ENTERED_CR: null, ACCOUNTED_DR: 1000000, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '外注費(明細2:8%軽減対象)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950001, AE_LINE_NUM: 3, APPLICATION_ID: 200, CODE_COMBINATION_ID: 1501, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510003, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'RTAX', ENTERED_DR: 100000, ENTERED_CR: null, ACCOUNTED_DR: 100000, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '仮払消費税(10%)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950001, AE_LINE_NUM: 4, APPLICATION_ID: 200, CODE_COMBINATION_ID: 1502, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510004, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'RTAX', ENTERED_DR: 80000, ENTERED_CR: null, ACCOUNTED_DR: 80000, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '仮払消費税(軽減8%)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950001, AE_LINE_NUM: 5, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2201, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510005, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'AWT', ENTERED_DR: null, ENTERED_CR: 102100, ACCOUNTED_DR: null, ACCOUNTED_CR: 102100, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '預り金・源泉税(10.21%・100万まで)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950001, AE_LINE_NUM: 6, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2202, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510006, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'AWT', ENTERED_DR: null, ENTERED_CR: 204200, ACCOUNTED_DR: null, ACCOUNTED_CR: 204200, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '預り金・源泉税(20.42%・100万超)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950001, AE_LINE_NUM: 7, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2101, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510007, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'LIABILITY', ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '買掛金計上(源泉控除後正味)' } },
    // Event 2: 初回一括支払 (2行)
    { createdAtStep: 7, data: { AE_HEADER_ID: 950002, AE_LINE_NUM: 1, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2101, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510008, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'LIABILITY', ENTERED_DR: 1873700, ENTERED_CR: null, ACCOUNTED_DR: 1873700, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '買掛金消込(初回支払CHK-1001)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950002, AE_LINE_NUM: 2, APPLICATION_ID: 200, CODE_COMBINATION_ID: 1001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510009, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'CASH', ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '普通預金出金(初回支払CHK-1001)' } },
    // Event 3: 初回支払取消 (2行)
    { createdAtStep: 7, data: { AE_HEADER_ID: 950003, AE_LINE_NUM: 1, APPLICATION_ID: 200, CODE_COMBINATION_ID: 1001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510010, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'CASH', ENTERED_DR: 1873700, ENTERED_CR: null, ACCOUNTED_DR: 1873700, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '普通預金戻入(支払取消Void CHK-1001)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950003, AE_LINE_NUM: 2, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2101, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510011, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'LIABILITY', ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '買掛金負債戻入(支払取消Void CHK-1001)' } },
    // Event 4: 分割支払1回目 (2行)
    { createdAtStep: 7, data: { AE_HEADER_ID: 950004, AE_LINE_NUM: 1, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2101, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510012, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'LIABILITY', ENTERED_DR: 997900, ENTERED_CR: null, ACCOUNTED_DR: 997900, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '買掛金消込(分割1:明細1分 CHK-1002)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950004, AE_LINE_NUM: 2, APPLICATION_ID: 200, CODE_COMBINATION_ID: 1001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510013, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'CASH', ENTERED_DR: null, ENTERED_CR: 997900, ACCOUNTED_DR: null, ACCOUNTED_CR: 997900, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '普通預金出金(分割1:明細1分 CHK-1002)' } },
    // Event 5: 分割支払2回目 (2行)
    { createdAtStep: 7, data: { AE_HEADER_ID: 950005, AE_LINE_NUM: 1, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2101, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510014, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'LIABILITY', ENTERED_DR: 875800, ENTERED_CR: null, ACCOUNTED_DR: 875800, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '買掛金消込(分割2:明細2分 CHK-1003)' } },
    { createdAtStep: 7, data: { AE_HEADER_ID: 950005, AE_LINE_NUM: 2, APPLICATION_ID: 200, CODE_COMBINATION_ID: 1001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 510015, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'CASH', ENTERED_DR: null, ENTERED_CR: 875800, ACCOUNTED_DR: null, ACCOUNTED_CR: 875800, CURRENCY_CODE: 'JPY', PARTY_ID: 30001, PARTY_SITE_ID: 30501, DESCRIPTION: '普通預金出金(分割2:明細2分 CHK-1003)' } }
  ],
  XLA_DISTRIBUTION_LINKS: [
    // 請求イベント 90001 → AP_INVOICE_DISTRIBUTIONS_ALL (6行)
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90001, AE_HEADER_ID: 950001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 61001, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', ROUNDING_CLASS_CODE: 'ITEM_EXPENSE', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: 1000000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90001, AE_HEADER_ID: 950001, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 61002, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', ROUNDING_CLASS_CODE: 'ITEM_EXPENSE', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: 1000000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90001, AE_HEADER_ID: 950001, AE_LINE_NUM: 3, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 61003, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', ROUNDING_CLASS_CODE: 'RTAX', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: 100000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90001, AE_HEADER_ID: 950001, AE_LINE_NUM: 4, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 61004, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', ROUNDING_CLASS_CODE: 'RTAX', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: 80000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90001, AE_HEADER_ID: 950001, AE_LINE_NUM: 5, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 61005, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', ROUNDING_CLASS_CODE: 'AWT', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 102100 } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90001, AE_HEADER_ID: 950001, AE_LINE_NUM: 6, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 61006, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', ROUNDING_CLASS_CODE: 'AWT', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 204200 } },
    // 初回支払イベント 90002 → AP_PAYMENT_HIST_DISTS (6行)
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90002, AE_HEADER_ID: 950002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86001, APPLIED_TO_SOURCE_ID_NUM_1: 61001, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: 1000000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90002, AE_HEADER_ID: 950002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86002, APPLIED_TO_SOURCE_ID_NUM_1: 61002, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: 1000000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90002, AE_HEADER_ID: 950002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86003, APPLIED_TO_SOURCE_ID_NUM_1: 61003, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: 100000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90002, AE_HEADER_ID: 950002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86004, APPLIED_TO_SOURCE_ID_NUM_1: 61004, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: 80000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90002, AE_HEADER_ID: 950002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86005, APPLIED_TO_SOURCE_ID_NUM_1: 61005, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: -102100, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90002, AE_HEADER_ID: 950002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86006, APPLIED_TO_SOURCE_ID_NUM_1: 61006, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: -204200, UNROUNDED_ACCOUNTED_CR: null } },
    // 初回取消イベント 90003 → AP_PAYMENT_HIST_DISTS (6行)
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90003, AE_HEADER_ID: 950003, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86007, APPLIED_TO_SOURCE_ID_NUM_1: 61001, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CANCELLED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 1000000 } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90003, AE_HEADER_ID: 950003, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86008, APPLIED_TO_SOURCE_ID_NUM_1: 61002, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CANCELLED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 1000000 } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90003, AE_HEADER_ID: 950003, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86009, APPLIED_TO_SOURCE_ID_NUM_1: 61003, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CANCELLED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 100000 } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90003, AE_HEADER_ID: 950003, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86010, APPLIED_TO_SOURCE_ID_NUM_1: 61004, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CANCELLED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 80000 } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90003, AE_HEADER_ID: 950003, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86011, APPLIED_TO_SOURCE_ID_NUM_1: 61005, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CANCELLED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: -102100 } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90003, AE_HEADER_ID: 950003, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86012, APPLIED_TO_SOURCE_ID_NUM_1: 61006, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CANCELLED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: -204200 } },
    // 分割1イベント 90004 → AP_PAYMENT_HIST_DISTS (3行)
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90004, AE_HEADER_ID: 950004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86013, APPLIED_TO_SOURCE_ID_NUM_1: 61001, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: 1000000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90004, AE_HEADER_ID: 950004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86014, APPLIED_TO_SOURCE_ID_NUM_1: 61003, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: 100000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90004, AE_HEADER_ID: 950004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86015, APPLIED_TO_SOURCE_ID_NUM_1: 61005, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: -102100, UNROUNDED_ACCOUNTED_CR: null } },
    // 分割2イベント 90005 → AP_PAYMENT_HIST_DISTS (3行)
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90005, AE_HEADER_ID: 950005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86016, APPLIED_TO_SOURCE_ID_NUM_1: 61002, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: 1000000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90005, AE_HEADER_ID: 950005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86017, APPLIED_TO_SOURCE_ID_NUM_1: 61004, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: 80000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 7, data: { APPLICATION_ID: 200, EVENT_ID: 90005, AE_HEADER_ID: 950005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 86018, APPLIED_TO_SOURCE_ID_NUM_1: 61006, EVENT_CLASS_CODE: 'PAYMENTS', EVENT_TYPE_CODE: 'PAYMENT CREATED', ROUNDING_CLASS_CODE: 'LIABILITY', MERGE_DUPLICATE_CODE: 'Y', UNROUNDED_ACCOUNTED_DR: -204200, UNROUNDED_ACCOUNTED_CR: null } }
  ],

  // === F. GL (General Ledger) (6) ===
  GL_INTERFACE: [
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-05', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Purchase Invoices', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 5001, ENTERED_DR: 1000000, ENTERED_CR: null, ACCOUNTED_DR: 1000000, ACCOUNTED_CR: null, GROUP_ID: 77001, GL_SL_LINK_ID: 510001, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-05', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Purchase Invoices', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 5002, ENTERED_DR: 1000000, ENTERED_CR: null, ACCOUNTED_DR: 1000000, ACCOUNTED_CR: null, GROUP_ID: 77001, GL_SL_LINK_ID: 510002, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-05', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Purchase Invoices', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 1501, ENTERED_DR: 100000, ENTERED_CR: null, ACCOUNTED_DR: 100000, ACCOUNTED_CR: null, GROUP_ID: 77001, GL_SL_LINK_ID: 510003, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-05', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Purchase Invoices', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 1502, ENTERED_DR: 80000, ENTERED_CR: null, ACCOUNTED_DR: 80000, ACCOUNTED_CR: null, GROUP_ID: 77001, GL_SL_LINK_ID: 510004, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-05', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Purchase Invoices', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 2201, ENTERED_DR: null, ENTERED_CR: 102100, ACCOUNTED_DR: null, ACCOUNTED_CR: 102100, GROUP_ID: 77001, GL_SL_LINK_ID: 510005, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-05', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Purchase Invoices', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 2202, ENTERED_DR: null, ENTERED_CR: 204200, ACCOUNTED_DR: null, ACCOUNTED_CR: 204200, GROUP_ID: 77001, GL_SL_LINK_ID: 510006, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-05', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Purchase Invoices', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 2101, ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, GROUP_ID: 77001, GL_SL_LINK_ID: 510007, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-15', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Payments', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 2101, ENTERED_DR: 1873700, ENTERED_CR: null, ACCOUNTED_DR: 1873700, ACCOUNTED_CR: null, GROUP_ID: 77001, GL_SL_LINK_ID: 510008, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-15', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Payments', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 1001, ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, GROUP_ID: 77001, GL_SL_LINK_ID: 510009, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-16', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Payments', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 1001, ENTERED_DR: 1873700, ENTERED_CR: null, ACCOUNTED_DR: 1873700, ACCOUNTED_CR: null, GROUP_ID: 77001, GL_SL_LINK_ID: 510010, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-16', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Payments', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 2101, ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, GROUP_ID: 77001, GL_SL_LINK_ID: 510011, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-20', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Payments', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 2101, ENTERED_DR: 997900, ENTERED_CR: null, ACCOUNTED_DR: 997900, ACCOUNTED_CR: null, GROUP_ID: 77001, GL_SL_LINK_ID: 510012, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-20', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Payments', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 1001, ENTERED_DR: null, ENTERED_CR: 997900, ACCOUNTED_DR: null, ACCOUNTED_CR: 997900, GROUP_ID: 77001, GL_SL_LINK_ID: 510013, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-25', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Payments', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 2101, ENTERED_DR: 875800, ENTERED_CR: null, ACCOUNTED_DR: 875800, ACCOUNTED_CR: null, GROUP_ID: 77001, GL_SL_LINK_ID: 510014, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-25', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-25', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Payments', USER_JE_SOURCE_NAME: 'Payables', CODE_COMBINATION_ID: 1001, ENTERED_DR: null, ENTERED_CR: 875800, ACCOUNTED_DR: null, ACCOUNTED_CR: 875800, GROUP_ID: 77001, GL_SL_LINK_ID: 510015, GL_SL_LINK_TABLE: 'XLAJEL' } }
  ],
  GL_JE_BATCHES: [
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, NAME: 'AP仕訳インポート_20261125_01', STATUS: 'P', DEFAULT_PERIOD_NAME: '2026-11', POSTED_DATE: '2026-11-25', RUNNING_TOTAL_DR: 7801100, RUNNING_TOTAL_CR: 7801100, CHART_OF_ACCOUNTS_ID: 101, PERIOD_SET_NAME: 'JP_CALENDAR', ACCOUNTED_PERIOD_TYPE: 'MONTH', ACTUAL_FLAG: 'A' } }
  ],
  GL_JE_HEADERS: [
    { createdAtStep: 8, data: { JE_HEADER_ID: 110001, JE_BATCH_ID: 100001, LEDGER_ID: 3001, JE_CATEGORY: 'Purchase Invoices', JE_SOURCE: 'Payables', PERIOD_NAME: '2026-11', NAME: 'Purchase Invoices JPY (AP請求計上)', CURRENCY_CODE: 'JPY', STATUS: 'P', DATE_CREATED: '2026-11-25', POSTED_DATE: '2026-11-25', ACTUAL_FLAG: 'A', RUNNING_TOTAL_DR: 2180000, RUNNING_TOTAL_CR: 2180000 } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_BATCH_ID: 100001, LEDGER_ID: 3001, JE_CATEGORY: 'Payments', JE_SOURCE: 'Payables', PERIOD_NAME: '2026-11', NAME: 'Payments JPY (初回+取消+分割1・2)', CURRENCY_CODE: 'JPY', STATUS: 'P', DATE_CREATED: '2026-11-25', POSTED_DATE: '2026-11-25', ACTUAL_FLAG: 'A', RUNNING_TOTAL_DR: 5621100, RUNNING_TOTAL_CR: 5621100 } }
  ],
  GL_JE_LINES: [
    { createdAtStep: 8, data: { JE_HEADER_ID: 110001, JE_LINE_NUM: 1, LEDGER_ID: 3001, CODE_COMBINATION_ID: 5001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-05', STATUS: 'P', ENTERED_DR: 1000000, ENTERED_CR: null, ACCOUNTED_DR: 1000000, ACCOUNTED_CR: null, DESCRIPTION: '外注費(明細1:10%対象)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110001, JE_LINE_NUM: 2, LEDGER_ID: 3001, CODE_COMBINATION_ID: 5002, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-05', STATUS: 'P', ENTERED_DR: 1000000, ENTERED_CR: null, ACCOUNTED_DR: 1000000, ACCOUNTED_CR: null, DESCRIPTION: '外注費(明細2:8%軽減対象)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110001, JE_LINE_NUM: 3, LEDGER_ID: 3001, CODE_COMBINATION_ID: 1501, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-05', STATUS: 'P', ENTERED_DR: 100000, ENTERED_CR: null, ACCOUNTED_DR: 100000, ACCOUNTED_CR: null, DESCRIPTION: '仮払消費税(10%)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110001, JE_LINE_NUM: 4, LEDGER_ID: 3001, CODE_COMBINATION_ID: 1502, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-05', STATUS: 'P', ENTERED_DR: 80000, ENTERED_CR: null, ACCOUNTED_DR: 80000, ACCOUNTED_CR: null, DESCRIPTION: '仮払消費税(軽減8%)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110001, JE_LINE_NUM: 5, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2201, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-05', STATUS: 'P', ENTERED_DR: null, ENTERED_CR: 102100, ACCOUNTED_DR: null, ACCOUNTED_CR: 102100, DESCRIPTION: '預り金・源泉税(10.21%)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110001, JE_LINE_NUM: 6, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2202, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-05', STATUS: 'P', ENTERED_DR: null, ENTERED_CR: 204200, ACCOUNTED_DR: null, ACCOUNTED_CR: 204200, DESCRIPTION: '預り金・源泉税(20.42%)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110001, JE_LINE_NUM: 7, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2101, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-05', STATUS: 'P', ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, DESCRIPTION: '買掛金計上(源泉控除後正味)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_LINE_NUM: 1, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2101, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-15', STATUS: 'P', ENTERED_DR: 1873700, ENTERED_CR: null, ACCOUNTED_DR: 1873700, ACCOUNTED_CR: null, DESCRIPTION: '買掛金消込(初回払CHK-1001)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_LINE_NUM: 2, LEDGER_ID: 3001, CODE_COMBINATION_ID: 1001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-15', STATUS: 'P', ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, DESCRIPTION: '普通預金出金(初回払CHK-1001)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_LINE_NUM: 3, LEDGER_ID: 3001, CODE_COMBINATION_ID: 1001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-16', STATUS: 'P', ENTERED_DR: 1873700, ENTERED_CR: null, ACCOUNTED_DR: 1873700, ACCOUNTED_CR: null, DESCRIPTION: '普通預金戻入(支払取消CHK-1001)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_LINE_NUM: 4, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2101, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-16', STATUS: 'P', ENTERED_DR: null, ENTERED_CR: 1873700, ACCOUNTED_DR: null, ACCOUNTED_CR: 1873700, DESCRIPTION: '買掛金戻入(支払取消CHK-1001)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_LINE_NUM: 5, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2101, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-20', STATUS: 'P', ENTERED_DR: 997900, ENTERED_CR: null, ACCOUNTED_DR: 997900, ACCOUNTED_CR: null, DESCRIPTION: '買掛金消込(分割1:明細1 CHK-1002)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_LINE_NUM: 6, LEDGER_ID: 3001, CODE_COMBINATION_ID: 1001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-20', STATUS: 'P', ENTERED_DR: null, ENTERED_CR: 997900, ACCOUNTED_DR: null, ACCOUNTED_CR: 997900, DESCRIPTION: '普通預金出金(分割1:明細1 CHK-1002)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_LINE_NUM: 7, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2101, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-25', STATUS: 'P', ENTERED_DR: 875800, ENTERED_CR: null, ACCOUNTED_DR: 875800, ACCOUNTED_CR: null, DESCRIPTION: '買掛金消込(分割2:明細2 CHK-1003)' } },
    { createdAtStep: 8, data: { JE_HEADER_ID: 110002, JE_LINE_NUM: 8, LEDGER_ID: 3001, CODE_COMBINATION_ID: 1001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-25', STATUS: 'P', ENTERED_DR: null, ENTERED_CR: 875800, ACCOUNTED_DR: null, ACCOUNTED_CR: 875800, DESCRIPTION: '普通預金出金(分割2:明細2 CHK-1003)' } }
  ],
  GL_IMPORT_REFERENCES: [
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110001, JE_LINE_NUM: 1, REFERENCE_5: '70001', REFERENCE_6: '90001', REFERENCE_7: '950001', GL_SL_LINK_ID: 510001, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110001, JE_LINE_NUM: 2, REFERENCE_5: '70001', REFERENCE_6: '90001', REFERENCE_7: '950001', GL_SL_LINK_ID: 510002, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110001, JE_LINE_NUM: 3, REFERENCE_5: '70001', REFERENCE_6: '90001', REFERENCE_7: '950001', GL_SL_LINK_ID: 510003, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110001, JE_LINE_NUM: 4, REFERENCE_5: '70001', REFERENCE_6: '90001', REFERENCE_7: '950001', GL_SL_LINK_ID: 510004, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110001, JE_LINE_NUM: 5, REFERENCE_5: '70001', REFERENCE_6: '90001', REFERENCE_7: '950001', GL_SL_LINK_ID: 510005, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110001, JE_LINE_NUM: 6, REFERENCE_5: '70001', REFERENCE_6: '90001', REFERENCE_7: '950001', GL_SL_LINK_ID: 510006, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110001, JE_LINE_NUM: 7, REFERENCE_5: '70001', REFERENCE_6: '90001', REFERENCE_7: '950001', GL_SL_LINK_ID: 510007, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110002, JE_LINE_NUM: 1, REFERENCE_5: '70002', REFERENCE_6: '90002', REFERENCE_7: '950002', GL_SL_LINK_ID: 510008, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110002, JE_LINE_NUM: 2, REFERENCE_5: '70002', REFERENCE_6: '90002', REFERENCE_7: '950002', GL_SL_LINK_ID: 510009, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110002, JE_LINE_NUM: 3, REFERENCE_5: '70002', REFERENCE_6: '90003', REFERENCE_7: '950003', GL_SL_LINK_ID: 510010, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110002, JE_LINE_NUM: 4, REFERENCE_5: '70002', REFERENCE_6: '90003', REFERENCE_7: '950003', GL_SL_LINK_ID: 510011, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110002, JE_LINE_NUM: 5, REFERENCE_5: '70003', REFERENCE_6: '90004', REFERENCE_7: '950004', GL_SL_LINK_ID: 510012, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110002, JE_LINE_NUM: 6, REFERENCE_5: '70003', REFERENCE_6: '90004', REFERENCE_7: '950004', GL_SL_LINK_ID: 510013, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110002, JE_LINE_NUM: 7, REFERENCE_5: '70004', REFERENCE_6: '90005', REFERENCE_7: '950005', GL_SL_LINK_ID: 510014, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 8, data: { JE_BATCH_ID: 100001, JE_HEADER_ID: 110002, JE_LINE_NUM: 8, REFERENCE_5: '70004', REFERENCE_6: '90005', REFERENCE_7: '950005', GL_SL_LINK_ID: 510015, GL_SL_LINK_TABLE: 'XLAJEL' } }
  ],
  GL_BALANCES: [
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 1001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 8: { PERIOD_NET_DR: 1873700, PERIOD_NET_CR: 3747400 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 1501, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 8: { PERIOD_NET_DR: 100000, PERIOD_NET_CR: 0 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 1502, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 8: { PERIOD_NET_DR: 80000, PERIOD_NET_CR: 0 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 2101, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 8: { PERIOD_NET_DR: 3747400, PERIOD_NET_CR: 3747400 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 2201, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 8: { PERIOD_NET_DR: 0, PERIOD_NET_CR: 102100 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 2202, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 8: { PERIOD_NET_DR: 0, PERIOD_NET_CR: 204200 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 5001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 8: { PERIOD_NET_DR: 1000000, PERIOD_NET_CR: 0 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 5002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 8: { PERIOD_NET_DR: 1000000, PERIOD_NET_CR: 0 } } }
  ]
};

const STEPS = [
  {
    id: 0,
    code: 'STEP 0',
    shortTitle: 'マスタ・AFF・税/源泉基盤',
    title: 'STEP 0：事前設定済マスタ基盤（組織・TCA/POZ・消費税・段階源泉・銀行）',
    dateLabel: '2026-11-01',
    subTitle: 'AP請求・支払・SLA・GLを実行する前にセットアップされた全32マスタテーブル',
    description: [
      'エンタープライズ構造(XLE/HR/GL)、AFF 9セグメント体系(FND_ID_FLEX_SEGMENTS / GL_CODE_COMBINATIONS)、サプライヤマスタ(TCA/POZ)を設定します。',
      '消費税(ZX)では標準10%(24110)と軽減8%(24108)を定義。源泉徴収税(AP_AWT_TAX_RATES_ALL)では段階税率として0〜100万円以下は10.21%(8201)、100万円超は20.42%(8202)を定義します。',
      '自社銀行口座(CE_BANK_ACCOUNTS / CE_PAYMENT_DOCUMENTS)および仕入先振込先口座(IBY_EXT_BANK_ACCOUNTS / IBY_PMT_INSTR_USES_ALL)を設定し、AP会計期間 2026-11 (OPEN)を準備します。'
    ],
    flagChanges: [
      { table: 'AP_SYSTEM_PARAMETERS_ALL', key: 'ORG_ID=401', column: 'ALLOW_AWT_FLAG / CREATE_AWT_DISTS_TYPE', before: '-', after: 'Y / APPROVAL', note: '請求書検証(Validation)時点で源泉税配賦を自動作成する設定' },
      { table: 'AP_AWT_TAX_RATES_ALL', key: 'TAX_RATE_ID=8201/8202', column: 'TAX_RATE (範囲別段階)', before: '-', after: '10.21% / 20.42%', note: '課税標準100万円以下=10.21%、100万円超=20.42%の段階税率定義' },
      { table: 'ZX_RATES_B', key: '24110 / 24108', column: 'PERCENTAGE_RATE', before: '-', after: '10% / 8%', note: '仮払消費税(標準10%)および軽減消費税(8%)の定義' }
    ],
    journalPreview: [],
    activeTables: {
      inserted: [
        'XLE_ENTITY_PROFILES', 'HR_ALL_ORGANIZATION_UNITS_F', 'GL_LEDGERS', 'GL_PERIOD_STATUSES', 'FND_ID_FLEX_SEGMENTS', 'GL_CODE_COMBINATIONS',
        'HZ_PARTIES', 'HZ_LOCATIONS', 'HZ_PARTY_SITES', 'POZ_SUPPLIERS', 'POZ_SUPPLIER_SITES_ALL_M', 'POZ_SITE_ASSIGNMENTS_ALL_M',
        'FINANCIALS_SYSTEM_PARAMS_ALL', 'AP_SYSTEM_PARAMETERS_ALL', 'AP_TERMS_B', 'AP_TERMS_TL', 'AP_TERMS_LINES',
        'ZX_REGIMES_B', 'ZX_TAXES_B', 'ZX_STATUS_B', 'ZX_RATES_B', 'AP_AWT_GROUPS', 'AP_AWT_GROUP_TAXES_ALL', 'AP_AWT_TAX_RATES_ALL',
        'CE_BANK_ACCOUNTS', 'CE_BANK_ACCT_USES_ALL', 'CE_PAYMENT_DOCUMENTS', 'IBY_PAYMENT_METHODS_B', 'IBY_ACCT_PMT_PROFILES_B',
        'IBY_EXT_BANK_ACCOUNTS', 'IBY_EXTERNAL_PAYEES_ALL', 'IBY_PMT_INSTR_USES_ALL', 'GL_BALANCES'
      ],
      updated: [],
      referenced: []
    },
    flowEdges: [
      { from: 'FND_ID_FLEX_SEGMENTS', to: 'GL_CODE_COMBINATIONS', label: 'AFF 9セグメント体系定義', type: 'insert' },
      { from: 'POZ_SUPPLIERS', to: 'POZ_SITE_ASSIGNMENTS_ALL_M', label: '負債CCID・AWTデフォルト', type: 'insert' },
      { from: 'AP_AWT_GROUPS', to: 'AP_AWT_TAX_RATES_ALL', label: '段階源泉 10.21% / 20.42%', type: 'insert' },
      { from: 'CE_BANK_ACCOUNTS', to: 'CE_PAYMENT_DOCUMENTS', label: '支払文書連番初期値', type: 'insert' }
    ]
  },
  {
    id: 1,
    code: 'STEP 1',
    shortTitle: '請求書作成(未検証)',
    title: 'STEP 1：AP請求書作成（明細1:100万円[10%] / 明細2:100万円[8%]）',
    dateLabel: '2026-11-05',
    subTitle: '請求ヘッダ・ITEM明細2本・ZX決定ファクタ登録（APPROVAL_STATUS = NEVER VALIDATED）',
    description: [
      'サプライヤ(株式会社テックパートナーズ)からの請求書 AP-INV-2026-0001（INVOICE_AMOUNT=2,180,000円）を登録します。',
      'AP_INVOICE_LINES_ALL に2本のITEM明細を入力：明細1はシステム設計委託報酬 1,000,000円（税分類 JP_TAX_10:10%・外注費CCID 5001）、明細2は技術資料制作報酬 1,000,000円（税分類 JP_TAX_8_RED:軽減8%・外注費CCID 5002）。両明細ともAWT_GROUP_ID=8001を引き継ぎます。',
      'この段階では請求書検証前であるため、APPROVAL_STATUS=NEVER VALIDATED、TOTAL_TAX_AMOUNT=0、PAYMENT_STATUS_FLAG=N となり、配賦・支払予定・源泉計算行は未生成です。'
    ],
    flagChanges: [
      { table: 'AP_INVOICES_ALL', key: 'INVOICE_ID=50001', column: 'APPROVAL_STATUS / PAYMENT_STATUS_FLAG', before: '-', after: 'NEVER VALIDATED / N', note: '未検証状態で請求書ヘッダを作成（税込コントロール額 2,180,000円）' },
      { table: 'AP_INVOICE_LINES_ALL', key: 'LINE 1, 2 (ITEM)', column: 'AMOUNT / TAX_CLASSIFICATION', before: '-', after: '1,000,000(10%) / 1,000,000(8%)', note: '明細1・明細2の品目行とCCID(5001/5002)を登録' },
      { table: 'ZX_LINES_DET_FACTORS', key: '60101, 60102', column: 'TAX_CLASSIFICATION_CODE', before: '-', after: 'JP_TAX_10 / JP_TAX_8_RED', note: 'Fusion Taxへ渡す明細別税判定属性を登録' }
    ],
    journalPreview: [],
    activeTables: {
      inserted: ['AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES_DET_FACTORS'],
      updated: [],
      referenced: ['POZ_SUPPLIERS', 'POZ_SUPPLIER_SITES_ALL_M', 'POZ_SITE_ASSIGNMENTS_ALL_M', 'AP_TERMS_B', 'AP_AWT_GROUPS', 'GL_CODE_COMBINATIONS']
    },
    flowEdges: [
      { from: 'POZ_SITE_ASSIGNMENTS_ALL_M', to: 'AP_INVOICES_ALL', label: '負債CCID(2101) / AWT(8001)', type: 'ref' },
      { from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_LINES_ALL', label: '明細1(100万) & 明細2(100万)', type: 'insert' },
      { from: 'AP_INVOICE_LINES_ALL', to: 'ZX_LINES_DET_FACTORS', label: '税判定ファクタ生成', type: 'insert' }
    ]
  },
  {
    id: 2,
    code: 'STEP 2',
    shortTitle: '検証・税/源泉算出・予定生成',
    title: 'STEP 2：請求書検証（消費税10%/8%・段階源泉10.21%/20.42%・支払予定生成）',
    dateLabel: '2026-11-05',
    subTitle: '消費税180,000円＋段階源泉306,300円計算、配賦6行＆当初一括支払予定(1,873,700円)生成',
    description: [
      '請求書検証(Validate)を実行すると、Fusion Taxが明細1に10%消費税(100,000円)、明細2に8%軽減消費税(80,000円)を算出し ZX_LINES / ZX_LINES_SUMMARY / ZX_REC_NREC_DIST へ登録します。',
      '同時にAP源泉税エンジンが累進課税ロジックで自動源泉を計算：明細1の100万円までの部分には10.21%(-102,100円)、明細2の100万円は累積100万円超の段階に該当するため20.42%(-204,200円)を適用し、ZX_WITHHOLDING_LINES・AP_AWT_BUCKETS_ALL(課税累積200万円/源泉306,300円)・マイナスAWT明細2行を生成します。',
      '全6配賦(AP_INVOICE_DISTRIBUTIONS_ALL: MATCH_STATUS_FLAG=A)が確定し、支払予定 AP_PAYMENT_SCHEDULES_ALL に源泉控除後の正味支払予定額 1,873,700円（=2,180,000 - 306,300）が生成され、イベント 90001(U) が起票されます。'
    ],
    flagChanges: [
      { table: 'AP_INVOICES_ALL', key: 'INVOICE_ID=50001', column: 'TOTAL_TAX_AMOUNT / APPROVAL_STATUS / AWT_FLAG', before: '0 / NEVER VALIDATED / NULL', after: '180,000 / APPROVED / A', note: '税額18万円・源泉自動計算済・請求書検証完了' },
      { table: 'ZX_WITHHOLDING_LINES', key: '62001 / 62002', column: 'TAX_RATE / TAX_AMT', before: '-', after: '10.21%(-102,100) / 20.42%(-204,200)', note: '100万円まで10.21%・100万円超20.42%の段階源泉算出' },
      { table: 'AP_INVOICE_DISTRIBUTIONS_ALL', key: '61001..61006', column: 'MATCH_STATUS_FLAG / POSTED_FLAG', before: '-', after: 'A / N', note: 'ITEM2行・REC_TAX2行・AWT2行の配賦生成(会計前)' },
      { table: 'AP_PAYMENT_SCHEDULES_ALL', key: 'INVOICE_ID=50001, NUM=1', column: 'GROSS_AMOUNT / PAYMENT_STATUS_FLAG', before: '-', after: '1,873,700 / N', note: '源泉控除後 1,873,700円 の当初一括支払予定を作成' },
      { table: 'XLA_EVENTS', key: 'EVENT_ID=90001', column: 'EVENT_TYPE_CODE / STATUS', before: '-', after: 'INVOICE VALIDATED / U', note: 'SLA会計待ちの請求検証イベント起票' }
    ],
    journalPreview: [
      {
        note: '※ 検証確定時の会計予定イメージ（Step 7 Create AccountingでSLA仕訳化）：',
        lines: [
          { side: 'DR', ccid: 5001, name: '外注費(明細1:10%対象)', amount: 1000000 },
          { side: 'DR', ccid: 5002, name: '外注費(明細2:軽減8%対象)', amount: 1000000 },
          { side: 'DR', ccid: 1501, name: '仮払消費税(10%)', amount: 100000 },
          { side: 'DR', ccid: 1502, name: '仮払消費税(軽減8%)', amount: 80000 },
          { side: 'CR', ccid: 2201, name: '預り金・源泉税(10.21%)', amount: 102100 },
          { side: 'CR', ccid: 2202, name: '預り金・源泉税(20.42%)', amount: 204200 },
          { side: 'CR', ccid: 2101, name: '買掛金(源泉控除後支払予定額)', amount: 1873700 }
        ]
      }
    ],
    activeTables: {
      inserted: ['ZX_LINES', 'ZX_LINES_SUMMARY', 'ZX_REC_NREC_DIST', 'ZX_WITHHOLDING_LINES', 'AP_AWT_BUCKETS_ALL', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_PAYMENT_SCHEDULES_ALL', 'XLA_EVENTS'],
      updated: ['AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL'],
      referenced: ['ZX_RATES_B', 'AP_AWT_TAX_RATES_ALL', 'AP_TERMS_LINES', 'AP_SYSTEM_PARAMETERS_ALL']
    },
    flowEdges: [
      { from: 'ZX_RATES_B', to: 'ZX_LINES', label: '10% & 8% 消費税算出', type: 'insert' },
      { from: 'ZX_LINES', to: 'ZX_REC_NREC_DIST', label: '控除税配賦(10万/8万)', type: 'insert' },
      { from: 'AP_AWT_TAX_RATES_ALL', to: 'ZX_WITHHOLDING_LINES', label: '段階源泉10.21%/20.42%', type: 'insert' },
      { from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: '6配賦行確定(MATCH=A)', type: 'insert' },
      { from: 'AP_INVOICES_ALL', to: 'AP_PAYMENT_SCHEDULES_ALL', label: '一括支払予定 1,873,700', type: 'insert' }
    ]
  },
  {
    id: 3,
    code: 'STEP 3',
    shortTitle: '初回一括支払(1,873,700円)',
    title: 'STEP 3：初回一括支払の実行（PPR-01 → 差引全額 1,873,700円 送金）',
    dateLabel: '2026-11-15',
    subTitle: 'PPR→IBY支払指示→AP_CHECKS_ALL(1001)発行→支払予定・請求書が一括完済(Y)へ遷移',
    description: [
      '支払処理要求 PPR-20261115-FULL (AP_INV_SELECTION_CRITERIA_ALL / AP_SELECTED_INVOICES_ALL) を実行し、予定番号1(1,873,700円)を抽出します。',
      'Oracle Payments(IBY_PAY_SERVICE_REQUESTS → IBY_DOCS_PAYABLE_ALL → IBY_PAY_INSTRUCTIONS_ALL → IBY_PAYMENTS_ALL)で振込指示を作成し、CE_PAYMENT_DOCUMENTSの採番を 1000→1001 へ進めます。',
      'AP_CHECKS_ALL(CHECK_ID=70001, 1,873,700円, STATUS=NEGOTIABLE)、AP_INVOICE_PAYMENTS_ALL(80001)、AP_PAYMENT_HISTORY_ALL(85001: PAYMENT CREATED)、AP_PAYMENT_HIST_DISTS(6配賦行)が登録され、請求書・支払予定は一旦全額支払済(PAYMENT_STATUS_FLAG: N→Y, AMOUNT_REMAINING: 1,873,700→0)になります。'
    ],
    flagChanges: [
      { table: 'CE_PAYMENT_DOCUMENTS', key: 'PAYMENT_DOCUMENT_ID=29001', column: 'LAST_ISSUED_DOCUMENT_NUMBER', before: '1000', after: '1001', note: '初回振込文書番号 1001 を採番' },
      { table: 'AP_CHECKS_ALL / IBY_PAYMENTS_ALL', key: 'CHECK_ID=70001 / PMT=95001', column: 'STATUS / AMOUNT', before: '-', after: 'NEGOTIABLE / 1,873,700', note: '初回一括支払トランザクション生成' },
      { table: 'AP_PAYMENT_SCHEDULES_ALL', key: 'INVOICE_ID=50001, NUM=1', column: 'AMOUNT_REMAINING / PAYMENT_STATUS_FLAG', before: '1,873,700 / N', after: '0 / Y', note: '支払予定が一旦完済状態へ更新' },
      { table: 'AP_INVOICES_ALL', key: 'INVOICE_ID=50001', column: 'AMOUNT_PAID / PAYMENT_STATUS_FLAG', before: '0 / N', after: '1,873,700 / Y', note: '請求書ヘッダ支払済額・ステータス更新' },
      { table: 'XLA_EVENTS', key: 'EVENT_ID=90002', column: 'EVENT_TYPE_CODE / STATUS', before: '-', after: 'PAYMENT CREATED / U', note: '初回支払のSLAイベント起票' }
    ],
    journalPreview: [
      {
        note: '※ 初回一括支払 1,873,700円の仕訳予定イメージ：',
        lines: [
          { side: 'DR', ccid: 2101, name: '買掛金（初回支払による消込）', amount: 1873700 },
          { side: 'CR', ccid: 1001, name: '普通預金（みずほ銀行・CHK-1001）', amount: 1873700 }
        ]
      }
    ],
    activeTables: {
      inserted: [
        'AP_INV_SELECTION_CRITERIA_ALL', 'AP_SELECTED_INVOICES_ALL',
        'IBY_PAY_SERVICE_REQUESTS', 'IBY_DOCS_PAYABLE_ALL', 'IBY_PAY_INSTRUCTIONS_ALL', 'IBY_PAYMENTS_ALL',
        'AP_CHECKS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_PAYMENT_HIST_DISTS', 'XLA_EVENTS'
      ],
      updated: ['CE_PAYMENT_DOCUMENTS', 'AP_PAYMENT_SCHEDULES_ALL', 'AP_INVOICES_ALL'],
      referenced: ['CE_BANK_ACCOUNTS', 'IBY_ACCT_PMT_PROFILES_B', 'IBY_EXTERNAL_PAYEES_ALL', 'IBY_PMT_INSTR_USES_ALL']
    },
    flowEdges: [
      { from: 'AP_PAYMENT_SCHEDULES_ALL', to: 'AP_SELECTED_INVOICES_ALL', label: 'PPR-01 一括抽出(1,873,700)', type: 'insert' },
      { from: 'IBY_PAY_SERVICE_REQUESTS', to: 'IBY_PAYMENTS_ALL', label: 'IBY支払作成(95001)', type: 'insert' },
      { from: 'IBY_PAYMENTS_ALL', to: 'AP_CHECKS_ALL', label: '小切手/振込(CHK-1001)', type: 'insert' },
      { from: 'AP_CHECKS_ALL', to: 'AP_INVOICE_PAYMENTS_ALL', label: '請求支払紐付(80001)', type: 'insert' },
      { from: 'AP_PAYMENT_HISTORY_ALL', to: 'AP_PAYMENT_HIST_DISTS', label: '6配賦消込明細作成', type: 'insert' }
    ]
  },
  {
    id: 4,
    code: 'STEP 4',
    shortTitle: '支払取消(Void)＆2分割',
    title: 'STEP 4：初回支払の取消(Void Payment) ＆ 支払予定の明細ごと2分割',
    dateLabel: '2026-11-16',
    subTitle: 'CHK-1001をVOIDED取消→請求を未払(N)に戻し→支払予定を明細1(997,900)＆明細2(875,800)に分割',
    description: [
      '支払方法・期日変更のため初回支払(CHECK_ID=70001)を取消(Void Payment)します。AP_CHECKS_ALLは STATUS_LOOKUP_CODE: NEGOTIABLE→VOIDED (VOID_DATE=2026-11-16)、IBY_PAYMENTS_ALLは ISSUED→VOID、IBY_DOCS_PAYABLE_ALLは VOID_BY_SETUP へ更新されます。',
      'AP_INVOICE_PAYMENTS_ALLでは元行(80001)のREVERSAL_FLAGが N→Y になり、マイナス取消行 80002(-1,873,700, REVERSAL_INV_PMT_ID=80001)がINSERTされます。AP_PAYMENT_HISTORY_ALL(85002: PAYMENT CANCELLED, REV_PMT_HIST_ID=85001)と逆符号のAP_PAYMENT_HIST_DISTS 6行が追加され、取消イベント 90003 が起票されます。',
      '請求ヘッダは AMOUNT_PAID: 1,873,700→0 / PAYMENT_STATUS_FLAG: Y→N に戻ります。続いて支払予定を明細ごとに分割：予定番号1を明細1正味額 997,900円(期日11/20)へUPDATEし、予定番号2として明細2正味額 875,800円(期日11/25)を新規INSERTします。'
    ],
    flagChanges: [
      { table: 'AP_CHECKS_ALL / IBY_PAYMENTS_ALL', key: 'CHECK=70001 / PMT=95001', column: 'STATUS / VOID_DATE', before: 'NEGOTIABLE / NULL', after: 'VOIDED / 2026-11-16', note: '初回支払の無効化・取消日時記録' },
      { table: 'AP_INVOICE_PAYMENTS_ALL', key: '80001(更新) & 80002(新規)', column: 'REVERSAL_FLAG / AMOUNT', before: 'N (80001)', after: 'Y / -1,873,700 (80002)', note: '元支払に取消フラグY、逆仕訳レコードを追記' },
      { table: 'AP_INVOICES_ALL', key: 'INVOICE_ID=50001', column: 'AMOUNT_PAID / PAYMENT_STATUS_FLAG', before: '1,873,700 / Y', after: '0 / N', note: '取消により請求書が未払ステータスへ復帰' },
      { table: 'AP_PAYMENT_SCHEDULES_ALL', key: 'NUM=1(変更) & NUM=2(新規)', column: 'GROSS_AMOUNT / AMOUNT_REMAINING', before: 'NUM=1: 1,873,700 (残0/Y)', after: 'NUM1: 997,900(N) + NUM2: 875,800(N)', note: '明細1(10%・10.21%後)と明細2(8%・20.42%後)へ支払予定を2分割' },
      { table: 'XLA_EVENTS', key: 'EVENT_ID=90003', column: 'EVENT_TYPE_CODE / STATUS', before: '-', after: 'PAYMENT CANCELLED / U', note: '支払取消のSLAイベントを同一ENTITY(70002)に追加起票' }
    ],
    journalPreview: [
      {
        note: '※ 初回支払取消 (Void) の逆仕訳予定イメージ：',
        lines: [
          { side: 'DR', ccid: 1001, name: '普通預金（取消による口座戻入 CHK-1001）', amount: 1873700 },
          { side: 'CR', ccid: 2101, name: '買掛金（債務の復活）', amount: 1873700 }
        ]
      }
    ],
    activeTables: {
      inserted: ['AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_PAYMENT_HIST_DISTS', 'AP_PAYMENT_SCHEDULES_ALL', 'XLA_EVENTS'],
      updated: ['AP_CHECKS_ALL', 'IBY_PAYMENTS_ALL', 'IBY_DOCS_PAYABLE_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_INVOICES_ALL', 'AP_PAYMENT_SCHEDULES_ALL'],
      referenced: ['AP_INVOICE_DISTRIBUTIONS_ALL']
    },
    flowEdges: [
      { from: 'AP_CHECKS_ALL', to: 'IBY_PAYMENTS_ALL', label: 'Void取消(NEGOTIABLE→VOIDED)', type: 'update' },
      { from: 'AP_CHECKS_ALL', to: 'AP_INVOICE_PAYMENTS_ALL', label: '取消行80002 (-1,873,700)', type: 'insert' },
      { from: 'AP_PAYMENT_HISTORY_ALL', to: 'AP_PAYMENT_HIST_DISTS', label: '取消マイナス6配賦行', type: 'insert' },
      { from: 'AP_INVOICES_ALL', to: 'AP_PAYMENT_SCHEDULES_ALL', label: '予定1(997,900)+予定2(875,800)分割', type: 'update' }
    ]
  },
  {
    id: 5,
    code: 'STEP 5',
    shortTitle: '分割支払1 (明細1:997,900円)',
    title: 'STEP 5：分割支払1回目の実行（明細1分：100万+10%税-10.21%源泉 = 997,900円）',
    dateLabel: '2026-11-20',
    subTitle: 'PPR-02で予定番号1を支払→CHK-1002発行→請求書ステータスが一部支払済(P)へ遷移',
    description: [
      '支払期日 2026-11-20 の支払予定番号1（明細1分 997,900円 = 税抜1,000,000 + 税100,000 - 源泉102,100）のみを対象として PPR-20261120-LINE1 を実行します。',
      'IBYから新支払指示(93002)・IBY支払(95002)を生成し、CE_PAYMENT_DOCUMENTSを 1001→1002 に採番して AP_CHECKS_ALL(CHECK_ID=70002, 997,900円) を発行します。',
      'AP_PAYMENT_HIST_DISTS には明細1関連の3配賦行(61001:+100万, 61003:+10万, 61005:-102,100)のみが生成されます。予定番号1は残高0(Y)となり、請求書全体のステータスは PAYMENT_STATUS_FLAG: N→P（一部支払済）へ更新されます。'
    ],
    flagChanges: [
      { table: 'CE_PAYMENT_DOCUMENTS', key: 'PAYMENT_DOCUMENT_ID=29001', column: 'LAST_ISSUED_DOCUMENT_NUMBER', before: '1001', after: '1002', note: '分割1回目の振込文書番号 1002 を採番' },
      { table: 'AP_CHECKS_ALL', key: 'CHECK_ID=70002', column: 'STATUS_LOOKUP_CODE / AMOUNT', before: '-', after: 'NEGOTIABLE / 997,900', note: '明細1分の支払チェックレコード作成' },
      { table: 'AP_PAYMENT_SCHEDULES_ALL', key: 'INVOICE_ID=50001, NUM=1', column: 'AMOUNT_REMAINING / PAYMENT_STATUS_FLAG', before: '997,900 / N', after: '0 / Y', note: '分割予定1が完済' },
      { table: 'AP_INVOICES_ALL', key: 'INVOICE_ID=50001', column: 'AMOUNT_PAID / PAYMENT_STATUS_FLAG', before: '0 / N', after: '997,900 / P', note: '予定2(875,800)が残るため一部支払済(P)に更新' },
      { table: 'XLA_EVENTS', key: 'EVENT_ID=90004', column: 'EVENT_TYPE_CODE / STATUS', before: '-', after: 'PAYMENT CREATED / U', note: '分割支払1のSLAイベント起票' }
    ],
    journalPreview: [
      {
        note: '※ 分割支払1回目（明細1分 997,900円）の仕訳予定イメージ：',
        lines: [
          { side: 'DR', ccid: 2101, name: '買掛金（明細1分の決済）', amount: 997900 },
          { side: 'CR', ccid: 1001, name: '普通預金（みずほ銀行・CHK-1002）', amount: 997900 }
        ]
      }
    ],
    activeTables: {
      inserted: [
        'AP_INV_SELECTION_CRITERIA_ALL', 'AP_SELECTED_INVOICES_ALL',
        'IBY_PAY_SERVICE_REQUESTS', 'IBY_DOCS_PAYABLE_ALL', 'IBY_PAY_INSTRUCTIONS_ALL', 'IBY_PAYMENTS_ALL',
        'AP_CHECKS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_PAYMENT_HIST_DISTS', 'XLA_EVENTS'
      ],
      updated: ['CE_PAYMENT_DOCUMENTS', 'AP_PAYMENT_SCHEDULES_ALL', 'AP_INVOICES_ALL'],
      referenced: ['AP_INVOICE_DISTRIBUTIONS_ALL', 'IBY_ACCT_PMT_PROFILES_B', 'IBY_PAYMENT_METHODS_B']
    },
    flowEdges: [
      { from: 'AP_PAYMENT_SCHEDULES_ALL', to: 'AP_SELECTED_INVOICES_ALL', label: 'PPR-02 予定1抽出(997,900)', type: 'insert' },
      { from: 'IBY_PAYMENTS_ALL', to: 'AP_CHECKS_ALL', label: '分割1支払(CHK-1002)', type: 'insert' },
      { from: 'AP_CHECKS_ALL', to: 'AP_INVOICE_PAYMENTS_ALL', label: '紐付80003 (NUM=1)', type: 'insert' },
      { from: 'AP_PAYMENT_HISTORY_ALL', to: 'AP_PAYMENT_HIST_DISTS', label: '明細1系3配賦のみ消込', type: 'insert' },
      { from: 'AP_INVOICES_ALL', to: 'AP_INVOICES_ALL', label: '支払状態 N→P', type: 'update' }
    ]
  },
  {
    id: 6,
    code: 'STEP 6',
    shortTitle: '分割支払2 (明細2:875,800円)',
    title: 'STEP 6：分割支払2回目の実行（明細2分：100万+8%税-20.42%源泉 = 875,800円 → 完済）',
    dateLabel: '2026-11-25',
    subTitle: 'PPR-03で予定番号2を支払→CHK-1003発行→請求書が完全支払済(Y)へ遷移',
    description: [
      '支払期日 2026-11-25 の支払予定番号2（明細2分 875,800円 = 税抜1,000,000 + 軽減税80,000 - 100万超源泉20.42%分 204,200）を対象に PPR-20261125-LINE2 を実行します。',
      'CE_PAYMENT_DOCUMENTSを 1002→1003 に採番し、IBY支払(95003)・AP_CHECKS_ALL(CHECK_ID=70003, 875,800円)・AP_INVOICE_PAYMENTS_ALL(80004)を生成します。',
      'AP_PAYMENT_HIST_DISTS に明細2関連の3配賦行(61002:+100万, 61004:+8万, 61006:-204,200)が登録され、予定番号2が残高0(Y)、請求書全体が AMOUNT_PAID: 997,900→1,873,700、PAYMENT_STATUS_FLAG: P→Y（完済）となります。'
    ],
    flagChanges: [
      { table: 'CE_PAYMENT_DOCUMENTS', key: 'PAYMENT_DOCUMENT_ID=29001', column: 'LAST_ISSUED_DOCUMENT_NUMBER', before: '1002', after: '1003', note: '分割2回目の振込文書番号 1003 を採番' },
      { table: 'AP_CHECKS_ALL', key: 'CHECK_ID=70003', column: 'STATUS_LOOKUP_CODE / AMOUNT', before: '-', after: 'NEGOTIABLE / 875,800', note: '明細2分の支払チェックレコード作成' },
      { table: 'AP_PAYMENT_SCHEDULES_ALL', key: 'INVOICE_ID=50001, NUM=2', column: 'AMOUNT_REMAINING / PAYMENT_STATUS_FLAG', before: '875,800 / N', after: '0 / Y', note: '分割予定2が残高0・完済' },
      { table: 'AP_INVOICES_ALL', key: 'INVOICE_ID=50001', column: 'AMOUNT_PAID / PAYMENT_STATUS_FLAG', before: '997,900 / P', after: '1,873,700 / Y', note: '全分割支払完了により請求書が完全支払済(Y)へ遷移' },
      { table: 'XLA_EVENTS', key: 'EVENT_ID=90005', column: 'EVENT_TYPE_CODE / STATUS', before: '-', after: 'PAYMENT CREATED / U', note: '分割支払2のSLAイベント起票' }
    ],
    journalPreview: [
      {
        note: '※ 分割支払2回目（明細2分 875,800円）の仕訳予定イメージ：',
        lines: [
          { side: 'DR', ccid: 2101, name: '買掛金（明細2分の決済・完済）', amount: 875800 },
          { side: 'CR', ccid: 1001, name: '普通預金（みずほ銀行・CHK-1003）', amount: 875800 }
        ]
      }
    ],
    activeTables: {
      inserted: [
        'AP_INV_SELECTION_CRITERIA_ALL', 'AP_SELECTED_INVOICES_ALL',
        'IBY_PAY_SERVICE_REQUESTS', 'IBY_DOCS_PAYABLE_ALL', 'IBY_PAY_INSTRUCTIONS_ALL', 'IBY_PAYMENTS_ALL',
        'AP_CHECKS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_PAYMENT_HIST_DISTS', 'XLA_EVENTS'
      ],
      updated: ['CE_PAYMENT_DOCUMENTS', 'AP_PAYMENT_SCHEDULES_ALL', 'AP_INVOICES_ALL'],
      referenced: ['AP_INVOICE_DISTRIBUTIONS_ALL', 'IBY_ACCT_PMT_PROFILES_B', 'IBY_PAYMENT_METHODS_B']
    },
    flowEdges: [
      { from: 'AP_PAYMENT_SCHEDULES_ALL', to: 'AP_SELECTED_INVOICES_ALL', label: 'PPR-03 予定2抽出(875,800)', type: 'insert' },
      { from: 'IBY_PAYMENTS_ALL', to: 'AP_CHECKS_ALL', label: '分割2支払(CHK-1003)', type: 'insert' },
      { from: 'AP_CHECKS_ALL', to: 'AP_INVOICE_PAYMENTS_ALL', label: '紐付80004 (NUM=2)', type: 'insert' },
      { from: 'AP_PAYMENT_HISTORY_ALL', to: 'AP_PAYMENT_HIST_DISTS', label: '明細2系3配賦を消込', type: 'insert' },
      { from: 'AP_INVOICES_ALL', to: 'AP_INVOICES_ALL', label: '支払状態 P→Y (完済)', type: 'update' }
    ]
  },
  {
    id: 7,
    code: 'STEP 7',
    shortTitle: 'SLA会計作成 (XLA)',
    title: 'STEP 7：SLA会計作成（Create Accounting：5イベント→15仕訳明細・24監査リンク生成）',
    dateLabel: '2026-11-25',
    subTitle: '請求検証＋初回払＋取消(Void)＋分割1＋分割2の全イベントをXLAへ会計仕訳化',
    description: [
      '「会計の作成 (Create Accounting)」を実行し、XLA_TRANSACTION_ENTITIES(4エンティティ)と未会計の XLA_EVENTS 5件(90001〜90005)を会計済 (EVENT_STATUS_CODE=P, PROCESS_STATUS_CODE=P) へ処理します。',
      'XLA_AE_HEADERS に5件（Purchase Invoices 1件, Payments 4件: 初期 GL_TRANSFER_STATUS_CODE=N）、XLA_AE_LINES に合計15本の補助元帳仕訳明細（AFF 9セグメントCCID・GL_SL_LINK_ID 510001〜510015付）を生成します。',
      'XLA_DISTRIBUTION_LINKS に AP_INVOICE_DISTRIBUTIONS_ALL (6行) と AP_PAYMENT_HIST_DISTS (18行) を結ぶ全24本の監査証跡リンクを作成し、AP側の POSTED_FLAG をすべて N→Y へ更新します。'
    ],
    flagChanges: [
      { table: 'AP_INVOICE_DISTRIBUTIONS_ALL / AP_PAYMENT_HISTORY_ALL', key: '全AP配賦・履歴', column: 'POSTED_FLAG / ACCOUNTING_EVENT_ID', before: 'N / NULL', after: 'Y / 90001..90005', note: 'APサブレジャー全配賦・履歴にSLA済印とイベントIDを付与' },
      { table: 'XLA_EVENTS', key: '90001〜90005', column: 'EVENT_STATUS_CODE / PROCESS_STATUS_CODE', before: 'U / U', after: 'P / P', note: '全5イベントがSLA処理完了(Processed)' },
      { table: 'XLA_AE_HEADERS / XLA_AE_LINES', key: '5ヘッダ / 15明細', column: 'ACCOUNTING_ENTRY_STATUS_CODE / GL_TRANSFER', before: '-', after: 'F (Final) / N', note: '最終補助元帳仕訳を生成（GL転送前はN）' },
      { table: 'XLA_DISTRIBUTION_LINKS', key: '全24監査リンク', column: 'SOURCE_DISTRIBUTION_TYPE', before: '-', after: 'AP_INV_DIST(6) + AP_PMT_DIST(18)', note: 'SLA仕訳からAP配賦明細への完全トレーサビリティ確立' }
    ],
    journalPreview: [
      {
        note: 'AE_HEADER 950001 (請求計上: INVOICE VALIDATED / 2,180,000円)',
        lines: [
          { side: 'DR', ccid: 5001, name: '外注費(明細1)', amount: 1000000 },
          { side: 'DR', ccid: 5002, name: '外注費(明細2)', amount: 1000000 },
          { side: 'DR', ccid: 1501, name: '仮払消費税(10%)', amount: 100000 },
          { side: 'DR', ccid: 1502, name: '仮払消費税(8%軽減)', amount: 80000 },
          { side: 'CR', ccid: 2201, name: '預り金・源泉税(10.21%)', amount: 102100 },
          { side: 'CR', ccid: 2202, name: '預り金・源泉税(20.42%)', amount: 204200 },
          { side: 'CR', ccid: 2101, name: '買掛金', amount: 1873700 }
        ]
      },
      {
        note: 'AE_HEADER 950002〜950005 (初回払 1,873,700 → 取消 1,873,700 → 分割1 997,900 → 分割2 875,800)',
        lines: [
          { side: 'DR', ccid: 2101, name: '買掛金 (初回払CHK-1001)', amount: 1873700 },
          { side: 'CR', ccid: 1001, name: '普通預金 (初回払CHK-1001)', amount: 1873700 },
          { side: 'DR', ccid: 1001, name: '普通預金 (取消Void CHK-1001)', amount: 1873700 },
          { side: 'CR', ccid: 2101, name: '買掛金 (取消Void CHK-1001)', amount: 1873700 },
          { side: 'DR', ccid: 2101, name: '買掛金 (分割1:明細1 CHK-1002)', amount: 997900 },
          { side: 'CR', ccid: 1001, name: '普通預金 (分割1:明細1 CHK-1002)', amount: 997900 },
          { side: 'DR', ccid: 2101, name: '買掛金 (分割2:明細2 CHK-1003)', amount: 875800 },
          { side: 'CR', ccid: 1001, name: '普通預金 (分割2:明細2 CHK-1003)', amount: 875800 }
        ]
      }
    ],
    activeTables: {
      inserted: ['XLA_TRANSACTION_ENTITIES', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
      updated: ['AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_PAYMENT_HIST_DISTS', 'XLA_EVENTS'],
      referenced: ['GL_CODE_COMBINATIONS', 'GL_LEDGERS', 'GL_PERIOD_STATUSES']
    },
    flowEdges: [
      { from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'XLA_AE_LINES', label: '請求配賦6行→SLA仕訳7行', type: 'insert' },
      { from: 'AP_PAYMENT_HIST_DISTS', to: 'XLA_AE_LINES', label: '支払・取消18行→SLA仕訳8行', type: 'insert' },
      { from: 'XLA_EVENTS', to: 'XLA_AE_HEADERS', label: 'U→P・5仕訳ヘッダ生成', type: 'insert' },
      { from: 'XLA_AE_LINES', to: 'XLA_DISTRIBUTION_LINKS', label: '全24本監査リンク作成', type: 'insert' }
    ]
  },
  {
    id: 8,
    code: 'STEP 8',
    shortTitle: 'GL転送・インポート・転記',
    title: 'STEP 8：GL転送・仕訳インポート・GL転記（GL_BALANCES 試算表残高更新）',
    dateLabel: '2026-11-25',
    subTitle: 'SLA仕訳15行をGLへ転送・インポート・転記（貸借各 7,801,100円 / 買掛金期末残高 0円）',
    description: [
      '「一般会計への転記 (Transfer Journal Entries to GL)」および Journal Import により、XLA_AE_HEADERS の GL_TRANSFER_STATUS_CODE が N→Y に更新され、15本の仕訳明細が GL_INTERFACE (STATUS=PROCESSED) を経由して GL_JE_BATCHES (1バッチ)、GL_JE_HEADERS (2ヘッダ：Purchase Invoices & Payments)、GL_JE_LINES (15明細) へ取り込まれます。',
      '同時に GL_IMPORT_REFERENCES が GL_SL_LINK_ID (510001〜510015) で SLA明細と1対1結合され、GL仕訳から元のAP請求書・Void取消・分割支払へのドリルスルーが可能になります。',
      'GL自動転記 (Posting) により GL_JE_* の STATUS が P(転記済) となり、GL_BALANCES の全8勘定が更新されます。初回支払と取消が相殺され、最終的に買掛金(2101)残高 0円、普通預金純減 1,873,700円、源泉預り金合計 306,300円（10.21%分102,100円＋20.42%分204,200円）、仮払消費税 180,000円、外注費 2,000,000円が確定します。'
    ],
    flagChanges: [
      { table: 'XLA_AE_HEADERS', key: '950001〜950005', column: 'GL_TRANSFER_STATUS_CODE', before: 'N', after: 'Y', note: '全SLAヘッダがGL転送完了' },
      { table: 'GL_JE_BATCHES / HEADERS / LINES', key: '100001 / 110001,110002', column: 'STATUS / RUNNING_TOTAL', before: '-', after: 'P / DR=CR=7,801,100', note: '仕訳インポート及びGL転記完了' },
      { table: 'GL_BALANCES', key: 'CCID 2101 (買掛金)', column: 'PERIOD_NET_DR / CR', before: '0 / 0', after: '3,747,400 / 3,747,400 (残高 0)', note: '請求+取消 CR 3,747,400 と 支払合計 DR 3,747,400 が完全消込' },
      { table: 'GL_BALANCES', key: 'CCID 1001 / 2201 / 2202', column: '期末純残高', before: '0', after: '預金CR 1,873,700 / 源泉CR 306,300', note: '実質支払額1,873,700円＋源泉税計306,300円＋消費税180,000円=費用2,000,000円+180,000円と完全一致' }
    ],
    journalPreview: [
      {
        note: 'GL_BALANCES 2026-11 転記完了後 勘定別残高サマリ（AFF 9セグメント全8勘定 / 貸借合計 7,801,100円）：',
        lines: [
          { side: 'DR', ccid: 5001, name: '外注費(明細1: 10%対象)', amount: 1000000 },
          { side: 'DR', ccid: 5002, name: '外注費(明細2: 軽減8%対象)', amount: 1000000 },
          { side: 'DR', ccid: 1501, name: '仮払消費税(10%)', amount: 100000 },
          { side: 'DR', ccid: 1502, name: '仮払消費税(軽減8%)', amount: 80000 },
          { side: 'CR', ccid: 2201, name: '預り金・源泉所得税(10.21%)', amount: 102100 },
          { side: 'CR', ccid: 2202, name: '預り金・源泉所得税(20.42%)', amount: 204200 },
          { side: 'CR', ccid: 1001, name: '普通預金(純支出額: 997,900+875,800)', amount: 1873700 },
          { side: 'NET0', ccid: 2101, name: '買掛金(DR 3,747,400 / CR 3,747,400 → 期末残高 0)', amount: 0 }
        ]
      }
    ],
    activeTables: {
      inserted: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES'],
      updated: ['XLA_AE_HEADERS', 'GL_BALANCES'],
      referenced: ['XLA_AE_LINES', 'GL_CODE_COMBINATIONS', 'GL_PERIOD_STATUSES', 'GL_LEDGERS']
    },
    flowEdges: [
      { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: '15明細GL転送 (N→Y)', type: 'insert' },
      { from: 'GL_INTERFACE', to: 'GL_JE_BATCHES', label: 'Journal Import (BATCH=100001)', type: 'insert' },
      { from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', label: '2ヘッダ / 15明細 (STATUS=P)', type: 'insert' },
      { from: 'GL_JE_LINES', to: 'GL_IMPORT_REFERENCES', label: 'GL_SL_LINK_ID紐付', type: 'insert' },
      { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '転記→全8勘定残高更新', type: 'update' }
    ]
  }
];

function computeStateAtStep(stepIndex) {
  const stepMeta = STEPS[stepIndex] || STEPS[0];
  const insertedSet = new Set(stepMeta.activeTables.inserted);
  const updatedSet = new Set(stepMeta.activeTables.updated);
  const referencedSet = new Set(stepMeta.activeTables.referenced);

  const tablesState = {};

  for (const tbl of TABLES) {
    const rawRecords = TABLE_RECORDS[tbl.id] || [];
    const rows = [];

    for (const rec of rawRecords) {
      if (rec.createdAtStep > stepIndex) continue;

      const currentData = { ...rec.data };
      const updatedCols = {};

      if (rec.updates) {
        const updateSteps = Object.keys(rec.updates).map(Number).sort((a, b) => a - b);
        for (const uStep of updateSteps) {
          if (uStep > stepIndex) break;
          const changes = rec.updates[uStep];
          if (uStep === stepIndex) {
            for (const [col, newVal] of Object.entries(changes)) {
              updatedCols[col] = { before: currentData[col], after: newVal };
              currentData[col] = newVal;
            }
          } else {
            for (const [col, newVal] of Object.entries(changes)) {
              currentData[col] = newVal;
            }
          }
        }
      }

      let rowState = 'existing';
      if (rec.createdAtStep === stepIndex) {
        rowState = 'inserted';
      } else if (Object.keys(updatedCols).length > 0) {
        rowState = 'updated';
      }

      rows.push({
        data: currentData,
        rowState,
        updatedCols,
        createdAtStep: rec.createdAtStep
      });
    }

    let tableState = 'inactive';
    if (rows.length === 0) {
      tableState = 'not_created';
    } else if (insertedSet.has(tbl.id) && updatedSet.has(tbl.id)) {
      tableState = 'inserted_updated';
    } else if (insertedSet.has(tbl.id)) {
      tableState = 'inserted';
    } else if (updatedSet.has(tbl.id)) {
      tableState = 'updated';
    } else if (referencedSet.has(tbl.id)) {
      tableState = 'referenced';
    } else {
      tableState = 'existing';
    }

    tablesState[tbl.id] = {
      meta: tbl,
      tableState,
      rows
    };
  }

  return {
    step: stepMeta,
    tablesState
  };
}

const _AP_EXPORTS = {
  AFF_SEGMENTS,
  CCID_LIST,
  DOMAINS,
  TABLES,
  RELATIONS,
  TABLE_RECORDS,
  STEPS,
  computeStateAtStep
};

if (typeof window !== 'undefined') {
  window.FusionAPData = _AP_EXPORTS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = _AP_EXPORTS;
}
