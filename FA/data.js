/**
 * Oracle Fusion ERP Financials 26D (OEDMF)
 * 固定資産（FA）データフロー定義：
 * 1. AP連携・資産登録・月次減価償却 (FA_AP_ADD_DEPRN)
 * 2. 資産修正（資本的支出AP連携・部門/場所移動）・再計算償却 (FA_ADJUST_TRANSFER)
 * 3. 資産廃止（売却・除却・撤去費用AP連携・除却損益計算） (FA_RETIREMENT)
 * 準拠: https://docs.oracle.com/en/cloud/saas/financials/26d/oedmf/index.html
 */

const AFF_SEGMENTS = [
  { idx: 1, col: 'SEGMENT1', name: '会社', codeExample: '10', desc: '法的エンティティ・企業コード（10=株式会社テスト商事）' },
  { idx: 2, col: 'SEGMENT2', name: '部門', codeExample: '0000 / 2100 / 2200', desc: '部門・コストセンタ（0000=全社共通, 2100=製造1課, 2200=製造2課）' },
  { idx: 3, col: 'SEGMENT3', name: '勘定科目', codeExample: '16110 / 16190 / 53110', desc: '自然勘定（16110=機械装置, 16190=減価償却累計額, 16910=固定資産仮勘定, 53110=減価償却費, 62110=除却売却損）' },
  { idx: 4, col: 'SEGMENT4', name: '補助科目', codeExample: '000 / 001', desc: '資産種別・内訳コード（001=検査設備関連）' },
  { idx: 5, col: 'SEGMENT5', name: '税コード', codeExample: 'T00 / T10', desc: '税区分（T00=対象外/償却, T10=課税10%）' },
  { idx: 6, col: 'SEGMENT6', name: '管理コード', codeExample: 'C00 / FA1', desc: 'プロジェクト・管理セグメント（FA1=固定資産管理対象）' },
  { idx: 7, col: 'SEGMENT7', name: '備考1', codeExample: '000', desc: '拡張セグメント1' },
  { idx: 8, col: 'SEGMENT8', name: '備考2', codeExample: '000', desc: '拡張セグメント2' },
  { idx: 9, col: 'SEGMENT9', name: '備考3', codeExample: '000', desc: '拡張セグメント3' }
];

const CCID_LIST = {
  1001: { ccid: 1001, concat: '10-0000-11110-000-T00-C00-000-000-000', name: '普通預金（みずほ銀行・本店）', type: 'ASSET' },
  1501: { ccid: 1501, concat: '10-0000-15110-000-T10-C00-000-000-000', name: '仮払消費税（標準10%）', type: 'ASSET' },
  1610: { ccid: 1610, concat: '10-2100-16110-001-T00-FA1-000-000-000', name: '機械及び装置（製造1課）', type: 'ASSET' },
  1611: { ccid: 1611, concat: '10-2200-16110-001-T00-FA1-000-000-000', name: '機械及び装置（製造2課：移動先）', type: 'ASSET' },
  1619: { ccid: 1619, concat: '10-2100-16190-001-T00-FA1-000-000-000', name: '機械装置・減価償却累計額（製造1課）', type: 'ASSET' },
  1620: { ccid: 1620, concat: '10-2200-16190-001-T00-FA1-000-000-000', name: '機械装置・減価償却累計額（製造2課：移動先）', type: 'ASSET' },
  1690: { ccid: 1690, concat: '10-0000-16910-000-T10-FA1-000-000-000', name: '固定資産仮勘定（Asset Clearing）', type: 'ASSET' },
  1694: { ccid: 1694, concat: '10-0000-16940-000-T00-FA1-000-000-000', name: '固定資産売却未収入金（Proceeds Clearing）', type: 'ASSET' },
  1695: { ccid: 1695, concat: '10-0000-16950-000-T10-FA1-000-000-000', name: '除却撤去費用仮勘定（Removal Cost Clearing）', type: 'ASSET' },
  2101: { ccid: 2101, concat: '10-0000-21110-000-T00-C00-000-000-000', name: '買掛金（AP債務）', type: 'LIABILITY' },
  3101: { ccid: 3101, concat: '10-0000-31110-000-T00-C00-000-000-000', name: '繰越利益剰余金・期首元入バランス', type: 'EQUITY' },
  5301: { ccid: 5301, concat: '10-2100-53110-001-T00-FA1-000-000-000', name: '減価償却費（製造1課）', type: 'EXPENSE' },
  5302: { ccid: 5302, concat: '10-2200-53110-001-T00-FA1-000-000-000', name: '減価償却費（製造2課）', type: 'EXPENSE' },
  6201: { ccid: 6201, concat: '10-0000-62110-001-T00-FA1-000-000-000', name: '固定資産除却・売却損（NBV Retired / Loss）', type: 'EXPENSE' }
};

const DOMAINS = {
  ORG_GL_MASTER: { id: 'ORG_GL_MASTER', label: 'A. 組織・元帳・AFF・Flexfield マスタ', x: 16, y: 16, w: 288, h: 420, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  AP_SUPPLIER_MASTER: { id: 'AP_SUPPLIER_MASTER', label: 'B. AP買掛・仕入先・税・銀行マスタ', x: 16, y: 452, w: 288, h: 572, color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  FA_SETUP_MASTER: { id: 'FA_SETUP_MASTER', label: 'C. FA台帳・償却・カテゴリ・事業所設定', x: 320, y: 16, w: 300, h: 1008, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  AP_FA_TXNS: { id: 'AP_FA_TXNS', label: 'D. AP請求支払 ＆ FA一括追加・台帳・調整・償却・廃止', x: 636, y: 16, w: 620, h: 1008, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  SLA_XLA: { id: 'SLA_XLA', label: 'E. SLA（補助元帳会計 XLA: AP 200 & FA 140）', x: 1272, y: 16, w: 492, h: 440, color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  GL_LEDGER: { id: 'GL_LEDGER', label: 'F. GL（総勘定元帳・残高）', x: 1272, y: 472, w: 492, h: 552, color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' }
};

const TABLES = {
  // === A. ORG_GL_MASTER (6) ===
  XLE_ENTITY_PROFILES: {
    id: 'XLE_ENTITY_PROFILES', name: 'XLE_ENTITY_PROFILES', jpName: '法的エンティティ・プロファイル', domain: 'ORG_GL_MASTER',
    x: 28, y: 56, w: 264, h: 52, pk: 'LEGAL_ENTITY_ID', fks: [],
    desc: '企業グループ内の法人格（法的エンティティ）および適格請求書登録番号を保持するマスタ。',
    keyCols: [
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'PK', desc: '法的エンティティID' },
      { name: 'NAME', type: 'VARCHAR2(240)', role: '', desc: '法人名（株式会社テスト商事）' },
      { name: 'LEGAL_ENTITY_IDENTIFIER', type: 'VARCHAR2(30)', role: '', desc: '法人識別子・登録番号' },
      { name: 'COUNTRY', type: 'VARCHAR2(60)', role: '', desc: '国コード（JP）' }
    ]
  },
  FUN_ALL_BUSINESS_UNITS_V: {
    id: 'FUN_ALL_BUSINESS_UNITS_V', name: 'FUN_ALL_BUSINESS_UNITS_V', jpName: 'ビジネス・ユニット (BU)', domain: 'ORG_GL_MASTER',
    x: 28, y: 116, w: 264, h: 52, pk: 'BU_ID', fks: ['LEGAL_ENTITY_ID', 'PRIMARY_LEDGER_ID'],
    desc: 'AP請求書の管理組織単位（ORG_ID）。法的エンティティおよび主元帳に紐付く。',
    keyCols: [
      { name: 'BU_ID', type: 'NUMBER(18)', role: 'PK', desc: 'ビジネス・ユニットID' },
      { name: 'BU_NAME', type: 'VARCHAR2(240)', role: '', desc: 'BU名称' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'FK', desc: '法的エンティティID' },
      { name: 'PRIMARY_LEDGER_ID', type: 'NUMBER(18)', role: 'FK', desc: 'プライマリ元帳ID' }
    ]
  },
  GL_LEDGERS: {
    id: 'GL_LEDGERS', name: 'GL_LEDGERS', jpName: '総勘定元帳定義', domain: 'ORG_GL_MASTER',
    x: 28, y: 176, w: 264, h: 52, pk: 'LEDGER_ID', fks: ['CHART_OF_ACCOUNTS_ID'],
    desc: '機能通貨(JPY)・会計カレンダ・9セグメントAFF体系・SLA会計ルールを規定する元帳マスタ。',
    keyCols: [
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'PK', desc: '元帳ID' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: '', desc: '元帳名（JP_PRIMARY_LEDGER）' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: '', desc: '通貨コード（JPY）' },
      { name: 'CHART_OF_ACCOUNTS_ID', type: 'NUMBER(18)', role: 'FK', desc: '9セグメントCOA体系ID' }
    ]
  },
  GL_PERIOD_STATUSES: {
    id: 'GL_PERIOD_STATUSES', name: 'GL_PERIOD_STATUSES', jpName: '会計期間ステータス (GL/AP)', domain: 'ORG_GL_MASTER',
    x: 28, y: 236, w: 264, h: 52, pk: 'APPLICATION_ID, LEDGER_ID, PERIOD_NAME', fks: ['LEDGER_ID'],
    desc: 'GL(101)およびSQLAP(200)の会計期間オープン/クローズ状態を管理（FA償却期間はFA_DEPRN_PERIODSで管理）。',
    keyCols: [
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'PK', desc: '101(GL) / 200(AP)' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '元帳ID' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'PK', desc: '会計期間名' },
      { name: 'CLOSING_STATUS', type: 'VARCHAR2(1)', role: '', desc: 'O=オープン / C=クローズ' }
    ]
  },
  FND_KF_STR_INSTANCES_B: {
    id: 'FND_KF_STR_INSTANCES_B', name: 'FND_KF_STR_INSTANCES_B', jpName: 'Key Flexfield 構造インスタンス', domain: 'ORG_GL_MASTER',
    x: 28, y: 296, w: 264, h: 52, pk: 'STRUCTURE_INSTANCE_ID', fks: [],
    desc: 'GL勘定体系(GL# 9セグメント)に加え、FA固有のカテゴリ(CAT#)・ロケーション(LOC#)・アセットキー(KEY#)体系を定義。',
    keyCols: [
      { name: 'STRUCTURE_INSTANCE_ID', type: 'NUMBER(18)', role: 'PK', desc: '構造インスタンスID' },
      { name: 'STRUCTURE_INSTANCE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'JP_9SEG_AFF / FA_CAT / FA_LOC / FA_KEY' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: '', desc: '101(GL) / 140(FA)' },
      { name: 'KEY_FLEXFIELD_CODE', type: 'VARCHAR2(4)', role: '', desc: 'GL# / CAT# / LOC# / KEY#' }
    ]
  },
  GL_CODE_COMBINATIONS: {
    id: 'GL_CODE_COMBINATIONS', name: 'GL_CODE_COMBINATIONS', jpName: '勘定科目組合せ (CCID / 9軸AFF)', domain: 'ORG_GL_MASTER',
    x: 28, y: 356, w: 264, h: 52, pk: 'CODE_COMBINATION_ID', fks: ['CHART_OF_ACCOUNTS_ID'],
    desc: 'SEGMENT1〜SEGMENT9の全9セグメント値を結合し、AP・FA・SLA・GLで共通利用されるCCIDを管理。',
    keyCols: [
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'PK', desc: '勘定コード組合せID' },
      { name: 'SEGMENT1..SEGMENT5', type: 'VARCHAR2(25)', role: '', desc: '会社-部門-勘定-補助-税' },
      { name: 'SEGMENT6..SEGMENT9', type: 'VARCHAR2(25)', role: '', desc: '管理(FA1等)-備考1-備考2-備考3' },
      { name: 'ACCOUNT_TYPE', type: 'VARCHAR2(1)', role: '', desc: 'A=資産, L=負債, E=費用, Q=純資産' }
    ]
  },

  // === B. AP_SUPPLIER_MASTER (10) ===
  HZ_PARTIES: {
    id: 'HZ_PARTIES', name: 'HZ_PARTIES', jpName: 'TCAパーティ（取引先法人）', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 490, w: 264, h: 46, pk: 'PARTY_ID', fks: [],
    desc: '設備購入先や解体撤去業者など、仕入先法人の基本情報を保持するTCA基底テーブル。',
    keyCols: [
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'PK', desc: 'パーティID' },
      { name: 'PARTY_NAME', type: 'VARCHAR2(360)', role: '', desc: '仕入先法人名' },
      { name: 'PARTY_TYPE', type: 'VARCHAR2(30)', role: '', desc: 'ORGANIZATION' }
    ]
  },
  HZ_PARTY_SITES: {
    id: 'HZ_PARTY_SITES', name: 'HZ_PARTY_SITES', jpName: 'パーティ・サイト', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 542, w: 264, h: 46, pk: 'PARTY_SITE_ID', fks: ['PARTY_ID'],
    desc: '取引先の請求書送付・事業所所在地サイト定義。',
    keyCols: [
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'PK', desc: 'パーティサイトID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'FK', desc: 'パーティID' },
      { name: 'PARTY_SITE_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'サイト番号' }
    ]
  },
  POZ_SUPPLIERS: {
    id: 'POZ_SUPPLIERS', name: 'POZ_SUPPLIERS', jpName: 'サプライヤ（設備ベンダー）', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 594, w: 264, h: 46, pk: 'VENDOR_ID', fks: ['PARTY_ID'],
    desc: 'FA一括追加(FA_MASS_ADDITIONS.PO_VENDOR_ID / FA_ASSET_INVOICES)にも連携される仕入先マスタ。',
    keyCols: [
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'PK', desc: 'サプライヤID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'FK', desc: 'パーティID' },
      { name: 'SEGMENT1', type: 'VARCHAR2(30)', role: '', desc: 'サプライヤ番号' }
    ]
  },
  POZ_SUPPLIER_SITES_ALL_M: {
    id: 'POZ_SUPPLIER_SITES_ALL_M', name: 'POZ_SUPPLIER_SITES_ALL_M', jpName: 'サプライヤ・サイト', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 646, w: 264, h: 46, pk: 'VENDOR_SITE_ID', fks: ['VENDOR_ID', 'PARTY_SITE_ID'],
    desc: 'BU別支払条件・買掛金負債勘定・標準支払方法を保持する仕入先サイト。',
    keyCols: [
      { name: 'VENDOR_SITE_ID', type: 'NUMBER(18)', role: 'PK', desc: 'サプライヤサイトID' },
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'FK', desc: 'サプライヤID' },
      { name: 'VENDOR_SITE_CODE', type: 'VARCHAR2(15)', role: '', desc: 'サイトコード' }
    ]
  },
  AP_SYSTEM_PARAMETERS_ALL: {
    id: 'AP_SYSTEM_PARAMETERS_ALL', name: 'AP_SYSTEM_PARAMETERS_ALL', jpName: 'AP買掛管理システム設定', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 698, w: 264, h: 46, pk: 'ORG_ID', fks: ['SET_OF_BOOKS_ID'],
    desc: 'BU単位の買掛金規定勘定や請求検証・一括追加連携時の制御を設定。',
    keyCols: [
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'PK', desc: 'ビジネス・ユニットID' },
      { name: 'ACCTS_PAY_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '買掛金CCID（2101）' }
    ]
  },
  AP_TERMS_B: {
    id: 'AP_TERMS_B', name: 'AP_TERMS_B', jpName: 'AP支払条件マスタ', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 750, w: 264, h: 46, pk: 'TERM_ID', fks: [],
    desc: '設備・工事請求書の支払期日を計算する支払条件定義（例: 翌月現金振込）。',
    keyCols: [
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払条件ID' },
      { name: 'NAME', type: 'VARCHAR2(50)', role: '', desc: 'NET_30' }
    ]
  },
  ZX_RATES_B: {
    id: 'ZX_RATES_B', name: 'ZX_RATES_B', jpName: 'EBTax 税率マスタ (10%)', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 802, w: 264, h: 46, pk: 'TAX_RATE_ID', fks: [],
    desc: '固定資産取得・資本的支出・撤去費用のAP請求計上時に消費税10%を算出するEBTax税率定義。',
    keyCols: [
      { name: 'TAX_RATE_ID', type: 'NUMBER(15)', role: 'PK', desc: '税率ID（101）' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: '', desc: 'JP_TAX_10' },
      { name: 'PERCENTAGE_RATE', type: 'NUMBER', role: '', desc: '10.00' }
    ]
  },
  CE_BANK_ACCOUNTS: {
    id: 'CE_BANK_ACCOUNTS', name: 'CE_BANK_ACCOUNTS', jpName: '自社銀行口座マスタ', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 854, w: 264, h: 46, pk: 'BANK_ACCOUNT_ID', fks: ['ASSET_CODE_COMBINATION_ID'],
    desc: '設備代金・撤去費用支払時の出金元普通預金口座。',
    keyCols: [
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'PK', desc: '銀行口座ID（8001）' },
      { name: 'BANK_ACCOUNT_NAME', type: 'VARCHAR2(100)', role: '', desc: 'みずほ銀行 本店 普通' },
      { name: 'ASSET_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '普通預金CCID（1001）' }
    ]
  },
  CE_BANK_ACCT_USES_ALL: {
    id: 'CE_BANK_ACCT_USES_ALL', name: 'CE_BANK_ACCT_USES_ALL', jpName: 'BU別銀行口座用途', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 906, w: 264, h: 46, pk: 'BANK_ACCT_USE_ID', fks: ['BANK_ACCOUNT_ID', 'ORG_ID'],
    desc: 'AP支払処理でどのBUがどの口座を利用するかを定義。',
    keyCols: [
      { name: 'BANK_ACCT_USE_ID', type: 'NUMBER(18)', role: 'PK', desc: '口座用途ID（7001）' },
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'FK', desc: '銀行口座ID（8001）' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'FK', desc: 'BU ID' }
    ]
  },
  IBY_PAYMENT_METHODS_B: {
    id: 'IBY_PAYMENT_METHODS_B', name: 'IBY_PAYMENT_METHODS_B', jpName: 'IBY支払方法 (EFT振込)', domain: 'AP_SUPPLIER_MASTER',
    x: 28, y: 958, w: 264, h: 46, pk: 'PAYMENT_METHOD_CODE', fks: [],
    desc: 'Oracle Paymentsにおける銀行振込(EFT)支払方式定義。',
    keyCols: [
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'PK', desc: 'ELECTRONIC（総合振込）' },
      { name: 'ENABLED_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y' }
    ]
  },

  // === C. FA_SETUP_MASTER (11) ===
  FA_SYSTEM_CONTROLS: {
    id: 'FA_SYSTEM_CONTROLS', name: 'FA_SYSTEM_CONTROLS', jpName: 'FA システム制御', domain: 'FA_SETUP_MASTER',
    x: 332, y: 60, w: 276, h: 56, pk: 'COMPANY_NAME', fks: [],
    desc: '企業全体で1レコード保持されるFA基幹制御表。最古使用開始日・Flexfield構造・開始資産番号を定義。',
    keyCols: [
      { name: 'COMPANY_NAME', type: 'VARCHAR2(30)', role: 'PK', desc: '企業名' },
      { name: 'LOCATION_FLEX_STRUCTURE', type: 'NUMBER(18)', role: '', desc: 'ロケーション構造ID' },
      { name: 'CATEGORY_FLEX_STRUCTURE', type: 'NUMBER(18)', role: '', desc: 'カテゴリ構造ID' },
      { name: 'INITIAL_ASSET_ID', type: 'NUMBER(18)', role: '', desc: '採番開始資産ID' }
    ]
  },
  FA_CALENDAR_TYPES: {
    id: 'FA_CALENDAR_TYPES', name: 'FA_CALENDAR_TYPES', jpName: 'FA 減価償却カレンダヘッダ', domain: 'FA_SETUP_MASTER',
    x: 332, y: 144, w: 276, h: 56, pk: 'CALENDAR_TYPE', fks: [],
    desc: '償却期間（月次12期）および按分(Prorate)カレンダの枠組みを定義。',
    keyCols: [
      { name: 'CALENDAR_TYPE', type: 'VARCHAR2(15)', role: 'PK', desc: 'JP_MONTHLY_CAL' },
      { name: 'NUMBER_PER_FISCAL_YEAR', type: 'NUMBER(4)', role: '', desc: '12（年12期間）' },
      { name: 'FISCAL_YEAR_NAME', type: 'VARCHAR2(30)', role: '', desc: 'JP_FY_APR_MAR' }
    ]
  },
  FA_CALENDAR_PERIODS: {
    id: 'FA_CALENDAR_PERIODS', name: 'FA_CALENDAR_PERIODS', jpName: 'FA 償却カレンダ期間明細', domain: 'FA_SETUP_MASTER',
    x: 332, y: 228, w: 276, h: 56, pk: 'CALENDAR_TYPE, START_DATE', fks: ['CALENDAR_TYPE'],
    desc: '各償却期間・按分期間ごとの開始日・終了日・期間番号を格納。',
    keyCols: [
      { name: 'CALENDAR_TYPE', type: 'VARCHAR2(15)', role: 'PK/FK', desc: 'カレンダタイプ' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: '', desc: '期間名（2026-05 等）' },
      { name: 'START_DATE', type: 'DATE', role: 'PK', desc: '期間開始日' },
      { name: 'END_DATE', type: 'DATE', role: '', desc: '期間終了日' }
    ]
  },
  FA_BOOK_CONTROLS: {
    id: 'FA_BOOK_CONTROLS', name: 'FA_BOOK_CONTROLS', jpName: 'FA 資産台帳制御 (JP_CORP_BOOK)', domain: 'FA_SETUP_MASTER',
    x: 332, y: 312, w: 276, h: 56, pk: 'BOOK_TYPE_CODE', fks: ['SET_OF_BOOKS_ID', 'DEPRN_CALENDAR'],
    desc: '法人台帳(CORP)や税務台帳(TAX)の定義、関連元帳ID(LEDGER_ID)、償却カレンダ、除却損益勘定を一元管理。',
    keyCols: [
      { name: 'BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: 'PK', desc: 'JP_CORP_BOOK' },
      { name: 'BOOK_CLASS', type: 'VARCHAR2(15)', role: '', desc: 'CORPORATE' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'FK', desc: '2001（主元帳ID）' },
      { name: 'DEPRN_CALENDAR', type: 'VARCHAR2(15)', role: 'FK', desc: 'JP_MONTHLY_CAL' }
    ]
  },
  FA_DEPRN_PERIODS: {
    id: 'FA_DEPRN_PERIODS', name: 'FA_DEPRN_PERIODS', jpName: 'FA 償却会計期間 (Open/Close)', domain: 'FA_SETUP_MASTER',
    x: 332, y: 396, w: 276, h: 56, pk: 'BOOK_TYPE_CODE, PERIOD_COUNTER', fks: ['BOOK_TYPE_CODE'],
    desc: '台帳ごとのオープン中償却期間・期間カウンタ(PERIOD_COUNTER)およびクローズ日時を管理。',
    keyCols: [
      { name: 'BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: 'PK/FK', desc: 'JP_CORP_BOOK' },
      { name: 'PERIOD_COUNTER', type: 'NUMBER(18)', role: 'PK', desc: '連番期間カウンタ（24317 等）' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: '', desc: '2026-05 / 2027-05 / 2029-05' },
      { name: 'PERIOD_CLOSE_DATE', type: 'DATE', role: '', desc: 'NULL(オープン中) / 日時(クローズ済)' }
    ]
  },
  FA_CONVENTION_TYPES: {
    id: 'FA_CONVENTION_TYPES', name: 'FA_CONVENTION_TYPES', jpName: 'FA 按分規約 (Prorate Convention)', domain: 'FA_SETUP_MASTER',
    x: 332, y: 480, w: 276, h: 56, pk: 'CONVENTION_TYPE_ID', fks: [],
    desc: '使用開始日(DPIS)や廃止日から償却開始/終了基準日(PRORATE_DATE)を決定する規約。',
    keyCols: [
      { name: 'CONVENTION_TYPE_ID', type: 'NUMBER(18)', role: 'PK', desc: '按分規約ID' },
      { name: 'PRORATE_CONVENTION_CODE', type: 'VARCHAR2(10)', role: '', desc: 'SAME_MONTH（当月度開始）' },
      { name: 'SET_ID', type: 'NUMBER(18)', role: '', desc: '参照データセットID' },
      { name: 'FISCAL_YEAR_NAME', type: 'VARCHAR2(30)', role: '', desc: '会計年度名' },
      { name: 'DEPR_WHEN_ACQUIRED_FLAG', type: 'VARCHAR2(3)', role: '', desc: 'YES' }
    ]
  },
  FA_METHODS: {
    id: 'FA_METHODS', name: 'FA_METHODS', jpName: 'FA 減価償却方法 (定額法 STL 60ヶ月)', domain: 'FA_SETUP_MASTER',
    x: 332, y: 564, w: 276, h: 56, pk: 'METHOD_ID', fks: [],
    desc: '計算方式（定額法/定率法）、耐用年数(月数)、計算基準(COST/NBV)を定義。',
    keyCols: [
      { name: 'METHOD_ID', type: 'NUMBER(18)', role: 'PK', desc: '償却方法ID' },
      { name: 'METHOD_CODE', type: 'VARCHAR2(12)', role: '', desc: 'STL（定額法）' },
      { name: 'LIFE_IN_MONTHS', type: 'NUMBER(4)', role: '', desc: '60（5年）' },
      { name: 'DEPRN_BASIS_RULE', type: 'VARCHAR2(6)', role: '', desc: 'COST / NBV' }
    ]
  },
  FA_CATEGORIES_B: {
    id: 'FA_CATEGORIES_B', name: 'FA_CATEGORIES_B', jpName: 'FA 資産カテゴリマスタ', domain: 'FA_SETUP_MASTER',
    x: 332, y: 648, w: 276, h: 56, pk: 'CATEGORY_ID', fks: [],
    desc: '大分類・小分類カテゴリ（例: MACHINERY.INSPECTION 精密検査装置）と資本化フラグを定義。',
    keyCols: [
      { name: 'CATEGORY_ID', type: 'NUMBER(18)', role: 'PK', desc: 'カテゴリID（301）' },
      { name: 'SEGMENT1', type: 'VARCHAR2(30)', role: '', desc: '大分類（MACHINERY）' },
      { name: 'SEGMENT2', type: 'VARCHAR2(30)', role: '', desc: '小分類（INSPECTION）' },
      { name: 'CAPITALIZE_FLAG', type: 'VARCHAR2(3)', role: '', desc: 'YES' }
    ]
  },
  FA_CATEGORY_BOOKS: {
    id: 'FA_CATEGORY_BOOKS', name: 'FA_CATEGORY_BOOKS', jpName: 'FA カテゴリ・台帳勘定定義', domain: 'FA_SETUP_MASTER',
    x: 332, y: 732, w: 276, h: 56, pk: 'CATEGORY_ID, BOOK_TYPE_CODE', fks: ['CATEGORY_ID', 'BOOK_TYPE_CODE', 'ASSET_COST_ACCOUNT_CCID', 'ASSET_CLEARING_ACCOUNT_CCID', 'DEPRN_EXPENSE_ACCOUNT_CCID', 'RESERVE_ACCOUNT_CCID'],
    desc: '資産カテゴリ×台帳ごとに、原価勘定・仮勘定(APクリア)・減価償却費・減価償却累計額のCCIDを規定。',
    keyCols: [
      { name: 'CATEGORY_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '301' },
      { name: 'BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: 'PK/FK', desc: 'JP_CORP_BOOK' },
      { name: 'ASSET_COST_ACCOUNT_CCID', type: 'NUMBER(18)', role: 'FK', desc: '1610（機械装置）' },
      { name: 'ASSET_CLEARING_ACCOUNT_CCID', type: 'NUMBER(18)', role: 'FK', desc: '1690（固定資産仮勘定）' },
      { name: 'DEPRN_EXPENSE_ACCOUNT_CCID', type: 'NUMBER(18)', role: 'FK', desc: '5301（減価償却費）' },
      { name: 'RESERVE_ACCOUNT_CCID', type: 'NUMBER(18)', role: 'FK', desc: '1619（減価償却累計額）' }
    ]
  },
  FA_LOCATIONS: {
    id: 'FA_LOCATIONS', name: 'FA_LOCATIONS', jpName: 'FA 資産設置ロケーション', domain: 'FA_SETUP_MASTER',
    x: 332, y: 816, w: 276, h: 56, pk: 'LOCATION_ID', fks: [],
    desc: '都道府県・工場・フロア等の設置場所コード組合せ。資産登録・部門移動(Transfer)で使用。',
    keyCols: [
      { name: 'LOCATION_ID', type: 'NUMBER(18)', role: 'PK', desc: 'ロケーションID（701 / 702）' },
      { name: 'SEGMENT1..3', type: 'VARCHAR2(30)', role: '', desc: 'JP-TOKYO-PLANT1F / PLANT2F' }
    ]
  },
  FA_ASSET_KEYWORDS: {
    id: 'FA_ASSET_KEYWORDS', name: 'FA_ASSET_KEYWORDS', jpName: 'FA アセットキー組合せ', domain: 'FA_SETUP_MASTER',
    x: 332, y: 900, w: 276, h: 56, pk: 'CODE_COMBINATION_ID', fks: [],
    desc: '資産グループや投資プロジェクト別の管理識別キー（Asset Key Flexfield）。',
    keyCols: [
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'PK', desc: 'アセットキーCCID（801）' },
      { name: 'SEGMENT1', type: 'VARCHAR2(30)', role: '', desc: 'CAPEX-2026-LINE1' }
    ]
  },

  // === D. AP_FA_TXNS (左: AP 10表 + 右: FA 12表 = 22表) ===
  AP_INVOICES_ALL: {
    id: 'AP_INVOICES_ALL', name: 'AP_INVOICES_ALL', jpName: 'AP請求書ヘッダ（資産購入/撤去費）', domain: 'AP_FA_TXNS',
    x: 650, y: 60, w: 286, h: 56, pk: 'INVOICE_ID', fks: ['VENDOR_ID', 'VENDOR_SITE_ID', 'ORG_ID'],
    desc: '固定資産取得・資本的支出・撤去費用のAP請求書ヘッダ。検証および支払・AP会計完了がFA連携の起点。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK', desc: '請求書ID' },
      { name: 'INVOICE_NUM', type: 'VARCHAR2(50)', role: '', desc: 'AP-FA-2026-001 等' },
      { name: 'INVOICE_AMOUNT', type: 'NUMBER', role: '', desc: '請求税込合計' },
      { name: 'VALIDATION_STATUS', type: 'VARCHAR2(25)', role: '', desc: 'VALIDATED' },
      { name: 'PAYMENT_STATUS_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'N → Y' }
    ]
  },
  AP_INVOICE_LINES_ALL: {
    id: 'AP_INVOICE_LINES_ALL', name: 'AP_INVOICE_LINES_ALL', jpName: 'AP請求書明細 (資産追跡属性)', domain: 'AP_FA_TXNS',
    x: 650, y: 152, w: 286, h: 56, pk: 'INVOICE_ID, LINE_NUMBER', fks: ['INVOICE_ID', 'ASSET_CATEGORY_ID'],
    desc: '資産対象明細では ASSETS_TRACKING_FLAG=Y、対象台帳 ASSET_BOOK_TYPE_CODE とカテゴリを設定。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '請求書ID' },
      { name: 'LINE_NUMBER', type: 'NUMBER', role: 'PK', desc: '明細番号' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '明細金額' },
      { name: 'ASSETS_TRACKING_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y（資産として追跡）' },
      { name: 'ASSET_BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'JP_CORP_BOOK' },
      { name: 'ASSET_CATEGORY_ID', type: 'NUMBER(18)', role: 'FK', desc: '301' }
    ]
  },
  ZX_LINES: {
    id: 'ZX_LINES', name: 'ZX_LINES', jpName: 'EBTax 税明細 (消費税10%)', domain: 'AP_FA_TXNS',
    x: 650, y: 244, w: 286, h: 56, pk: 'TAX_LINE_ID', fks: ['TRX_ID', 'TAX_RATE_ID'],
    desc: '課税仕入税額（回収可能仮払消費税10%）を算出。原則税抜価額がFA_MASS_ADDITIONSへ連携される。',
    keyCols: [
      { name: 'TAX_LINE_ID', type: 'NUMBER(15)', role: 'PK', desc: '税明細ID' },
      { name: 'TRX_ID', type: 'NUMBER(15)', role: 'FK', desc: '請求書ID' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: '', desc: 'JP_TAX_10' },
      { name: 'TAX_AMT', type: 'NUMBER', role: '', desc: '算出消費税額' }
    ]
  },
  AP_INVOICE_DISTRIBUTIONS_ALL: {
    id: 'AP_INVOICE_DISTRIBUTIONS_ALL', name: 'AP_INVOICE_DISTRIBUTIONS_ALL', jpName: 'AP配分 (ASSETS_ADDITION_FLAG)', domain: 'AP_FA_TXNS',
    x: 650, y: 336, w: 286, h: 56, pk: 'INVOICE_DISTRIBUTION_ID', fks: ['INVOICE_ID', 'DIST_CODE_COMBINATION_ID'],
    desc: '一括追加作成(Create Mass Additions)の直接データソース。FA連携後に ASSETS_ADDITION_FLAG が U→Y へ更新。',
    keyCols: [
      { name: 'INVOICE_DISTRIBUTION_ID', type: 'NUMBER(18)', role: 'PK', desc: 'AP配分ID' },
      { name: 'LINE_TYPE_LOOKUP_CODE', type: 'VARCHAR2(25)', role: '', desc: 'ITEM / REC_TAX' },
      { name: 'DIST_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '1690(仮勘定) / 1501(仮払税) / 1695' },
      { name: 'ASSETS_TRACKING_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y / N' },
      { name: 'ASSETS_ADDITION_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'U(未連携) → Y(FA連携済)' },
      { name: 'ASSET_BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'JP_CORP_BOOK' }
    ]
  },
  AP_PAYMENT_SCHEDULES_ALL: {
    id: 'AP_PAYMENT_SCHEDULES_ALL', name: 'AP_PAYMENT_SCHEDULES_ALL', jpName: 'AP支払予定スケジュール', domain: 'AP_FA_TXNS',
    x: 650, y: 428, w: 286, h: 56, pk: 'INVOICE_ID, PAYMENT_NUM', fks: ['INVOICE_ID'],
    desc: '設備・工事請求書の支払期日と未払残高（支払完了後 0）を管理。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '請求書ID' },
      { name: 'PAYMENT_NUM', type: 'NUMBER', role: 'PK', desc: '1' },
      { name: 'GROSS_AMOUNT', type: 'NUMBER', role: '', desc: '税込支払予定額' },
      { name: 'AMOUNT_REMAINING', type: 'NUMBER', role: '', desc: '未払残高（支払後 0）' }
    ]
  },
  IBY_DOCS_PAYABLE_ALL: {
    id: 'IBY_DOCS_PAYABLE_ALL', name: 'IBY_DOCS_PAYABLE_ALL', jpName: 'IBY 支払指示ドキュメント', domain: 'AP_FA_TXNS',
    x: 650, y: 520, w: 286, h: 56, pk: 'DOCUMENT_PAYABLE_ID', fks: ['CALLING_APP_DOC_UNIQUE_REF1', 'PAYMENT_ID'],
    desc: '支払処理要求(PPR)によりAPからOracle Paymentsへ渡される支払ドキュメント。',
    keyCols: [
      { name: 'DOCUMENT_PAYABLE_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払ドキュメントID' },
      { name: 'PAYMENT_AMOUNT', type: 'NUMBER', role: '', desc: '支払金額' },
      { name: 'DOCUMENT_STATUS', type: 'VARCHAR2(30)', role: '', desc: 'PAYMENT_CREATED' }
    ]
  },
  IBY_PAYMENTS_ALL: {
    id: 'IBY_PAYMENTS_ALL', name: 'IBY_PAYMENTS_ALL', jpName: 'IBY 統合支払トランザクション', domain: 'AP_FA_TXNS',
    x: 650, y: 612, w: 286, h: 56, pk: 'PAYMENT_ID', fks: ['INTERNAL_BANK_ACCOUNT_ID'],
    desc: '振込電文(EFT)単位の支払ヘッダ情報。',
    keyCols: [
      { name: 'PAYMENT_ID', type: 'NUMBER(18)', role: 'PK', desc: 'IBY支払ID' },
      { name: 'PAYMENT_AMOUNT', type: 'NUMBER', role: '', desc: '支払金額' },
      { name: 'PAYMENT_STATUS', type: 'VARCHAR2(30)', role: '', desc: 'ISSUED' }
    ]
  },
  AP_CHECKS_ALL: {
    id: 'AP_CHECKS_ALL', name: 'AP_CHECKS_ALL', jpName: 'AP支払実績 (振込決済 CLEARED)', domain: 'AP_FA_TXNS',
    x: 650, y: 704, w: 286, h: 56, pk: 'CHECK_ID', fks: ['VENDOR_ID', 'CE_BANK_ACCT_USE_ID', 'PAYMENT_ID'],
    desc: '銀行口座からの資金支出実績（買掛金支払ヘッダ）。',
    keyCols: [
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払ID' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '支払額' },
      { name: 'STATUS_LOOKUP_CODE', type: 'VARCHAR2(25)', role: '', desc: 'CLEARED（決済済）' }
    ]
  },
  AP_INVOICE_PAYMENTS_ALL: {
    id: 'AP_INVOICE_PAYMENTS_ALL', name: 'AP_INVOICE_PAYMENTS_ALL', jpName: 'AP請求・支払消込', domain: 'AP_FA_TXNS',
    x: 650, y: 796, w: 286, h: 56, pk: 'INVOICE_PAYMENT_ID', fks: ['INVOICE_ID', 'CHECK_ID'],
    desc: 'AP請求書と支払実績の1対1消込レコード。',
    keyCols: [
      { name: 'INVOICE_PAYMENT_ID', type: 'NUMBER(18)', role: 'PK', desc: '請求支払ID' },
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'FK', desc: '請求書ID' },
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'FK', desc: '支払ID' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '消込額' }
    ]
  },
  AP_PAYMENT_HISTORY_ALL: {
    id: 'AP_PAYMENT_HISTORY_ALL', name: 'AP_PAYMENT_HISTORY_ALL', jpName: 'AP支払会計履歴', domain: 'AP_FA_TXNS',
    x: 650, y: 888, w: 286, h: 56, pk: 'PAYMENT_HISTORY_ID', fks: ['CHECK_ID', 'ACCOUNTING_EVENT_ID'],
    desc: 'AP支払時の会計履歴（PAYMENT CREATED / CLEARED）およびSLAイベント連携元。',
    keyCols: [
      { name: 'PAYMENT_HISTORY_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払履歴ID' },
      { name: 'TRANSACTION_TYPE', type: 'VARCHAR2(30)', role: '', desc: 'PAYMENT CLEARING' },
      { name: 'TRANSACTION_AMOUNT', type: 'NUMBER', role: '', desc: '取引額' },
      { name: 'POSTED_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'N → Y' }
    ]
  },

  // --- D右サブ列: FA トランザクション 12表 ---
  FA_MASS_ADDITIONS: {
    id: 'FA_MASS_ADDITIONS', name: 'FA_MASS_ADDITIONS', jpName: 'FA 一括追加ステージング', domain: 'AP_FA_TXNS',
    x: 956, y: 60, w: 286, h: 54, pk: 'MASS_ADDITION_ID', fks: ['INVOICE_ID', 'INVOICE_DISTRIBUTION_ID', 'ASSET_CATEGORY_ID', 'PAYABLES_CODE_COMBINATION_ID', 'ADD_TO_ASSET_ID'],
    desc: 'APから連携された資産候補データを保持。NEW → MERGED/ON HOLD → POST → POSTEDへと状態遷移し、新規登録または既存資産へのコスト追加を行う。',
    keyCols: [
      { name: 'MASS_ADDITION_ID', type: 'NUMBER(18)', role: 'PK', desc: '一括追加ID' },
      { name: 'POSTING_STATUS', type: 'VARCHAR2(15)', role: '', desc: 'NEW / MERGED / POST / POSTED' },
      { name: 'QUEUE_NAME', type: 'VARCHAR2(15)', role: '', desc: 'NEW / MERGED / POST / POSTED' },
      { name: 'PAYABLES_COST', type: 'NUMBER', role: '', desc: 'AP連携金額' },
      { name: 'FIXED_ASSETS_COST', type: 'NUMBER', role: '', desc: '資産計上額' },
      { name: 'ADD_TO_ASSET_ID', type: 'NUMBER(18)', role: 'FK', desc: '追加先既存ASSET_ID（Case2で使用）' }
    ]
  },
  FA_ADDITIONS_B: {
    id: 'FA_ADDITIONS_B', name: 'FA_ADDITIONS_B', jpName: 'FA 資産基本台帳 (Asset Master)', domain: 'AP_FA_TXNS',
    x: 956, y: 138, w: 286, h: 54, pk: 'ASSET_ID', fks: ['ASSET_CATEGORY_ID', 'ASSET_KEY_CCID'],
    desc: '固定資産の物理的・記述的基本情報を保持する親テーブル（資産番号 AST-2026-0001、カテゴリ、単位数、資産タイプ）。',
    keyCols: [
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'PK', desc: '資産ID（100001）' },
      { name: 'ASSET_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'AST-2026-0001' },
      { name: 'ASSET_TYPE', type: 'VARCHAR2(11)', role: '', desc: 'CAPITALIZED（資産計上）' },
      { name: 'ASSET_CATEGORY_ID', type: 'NUMBER(18)', role: 'FK', desc: '301' },
      { name: 'CURRENT_UNITS', type: 'NUMBER', role: '', desc: '1' }
    ]
  },
  FA_ADDITIONS_TL: {
    id: 'FA_ADDITIONS_TL', name: 'FA_ADDITIONS_TL', jpName: 'FA 資産名称・摘要翻訳表', domain: 'AP_FA_TXNS',
    x: 956, y: 216, w: 286, h: 54, pk: 'ASSET_ID, LANGUAGE', fks: ['ASSET_ID'],
    desc: '各言語(JA/US)ごとの資産名称（DESCRIPTION）を保持する多言語テーブル。',
    keyCols: [
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '資産ID（100001）' },
      { name: 'LANGUAGE', type: 'VARCHAR2(4)', role: 'PK', desc: 'JA' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(80)', role: '', desc: '精密検査装置（レーザー式）' }
    ]
  },
  FA_ASSET_INVOICES: {
    id: 'FA_ASSET_INVOICES', name: 'FA_ASSET_INVOICES', jpName: 'FA 資産・AP請求紐付け明細', domain: 'AP_FA_TXNS',
    x: 956, y: 294, w: 286, h: 54, pk: 'ASSET_INVOICE_ID', fks: ['ASSET_ID', 'INVOICE_ID', 'INVOICE_DISTRIBUTION_ID', 'PO_VENDOR_ID'],
    desc: '固定資産と元となったAP請求明細・仕入先を永続的に結び付け、資本的支出の追加入金額も履歴保持する表。',
    keyCols: [
      { name: 'ASSET_INVOICE_ID', type: 'NUMBER(18)', role: 'PK', desc: '資産請求ID' },
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'FK', desc: '資産ID（100001）' },
      { name: 'INVOICE_NUMBER', type: 'VARCHAR2(50)', role: '', desc: 'AP-FA-2026-001 / AP-FA-2026-002' },
      { name: 'FIXED_ASSETS_COST', type: 'NUMBER', role: '', desc: '取得/追加原価' },
      { name: 'DATE_INEFFECTIVE', type: 'DATE', role: '', desc: 'NULL(現行有効)' }
    ]
  },
  FA_BOOKS: {
    id: 'FA_BOOKS', name: 'FA_BOOKS', jpName: 'FA 資産台帳金額・償却条件履歴', domain: 'AP_FA_TXNS',
    x: 956, y: 372, w: 286, h: 54, pk: 'BOOK_TYPE_CODE, ASSET_ID, TRANSACTION_HEADER_ID_IN', fks: ['ASSET_ID', 'BOOK_TYPE_CODE', 'TRANSACTION_HEADER_ID_IN'],
    desc: '取得原価(COST)・耐用年数・償却方法・按分日付を管理。登録・修正・除却のたびに旧行にTRANSACTION_HEADER_ID_OUTとDATE_INEFFECTIVEを設定し新行を挿入する。',
    keyCols: [
      { name: 'BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: 'PK/FK', desc: 'JP_CORP_BOOK' },
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '100001' },
      { name: 'TRANSACTION_HEADER_ID_IN', type: 'NUMBER(18)', role: 'PK/FK', desc: '行作成トランザクションID' },
      { name: 'TRANSACTION_HEADER_ID_OUT', type: 'NUMBER(18)', role: 'FK', desc: 'NULL(現行) / 次TXN_ID(履歴)' },
      { name: 'COST', type: 'NUMBER', role: '', desc: '現在原価（1,500,000 → 1,740,000 / 0）' },
      { name: 'LIFE_IN_MONTHS', type: 'NUMBER(4)', role: '', desc: '60' }
    ]
  },
  FA_DISTRIBUTION_HISTORY: {
    id: 'FA_DISTRIBUTION_HISTORY', name: 'FA_DISTRIBUTION_HISTORY', jpName: 'FA 費用勘定・設置場所配分履歴', domain: 'AP_FA_TXNS',
    x: 956, y: 450, w: 286, h: 54, pk: 'DISTRIBUTION_ID', fks: ['ASSET_ID', 'CODE_COMBINATION_ID', 'LOCATION_ID'],
    desc: '資産の部門償却費CCIDと物理設置ロケーションを管理。Transfer時は旧行を終了し新行を作成する。',
    keyCols: [
      { name: 'DISTRIBUTION_ID', type: 'NUMBER(18)', role: 'PK', desc: '配分ID' },
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'FK', desc: '100001' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '5301(1課) → 5302(2課)' },
      { name: 'LOCATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '701(1F) → 702(2F)' },
      { name: 'DATE_INEFFECTIVE', type: 'DATE', role: '', desc: 'NULL(現行) / 日時(移動後旧行)' }
    ]
  },
  FA_TRANSACTION_HEADERS: {
    id: 'FA_TRANSACTION_HEADERS', name: 'FA_TRANSACTION_HEADERS', jpName: 'FA 資産トランザクション履歴', domain: 'AP_FA_TXNS',
    x: 956, y: 528, w: 286, h: 54, pk: 'TRANSACTION_HEADER_ID', fks: ['ASSET_ID', 'BOOK_TYPE_CODE'],
    desc: 'ADDITION(登録)・ADJUSTMENT(修正)・TRANSFER(移動)・FULL RETIREMENT(廃止)等の全業務イベントヘッダ。SLA ENTITYの結合元。',
    keyCols: [
      { name: 'TRANSACTION_HEADER_ID', type: 'NUMBER(18)', role: 'PK', desc: 'トランザクションID' },
      { name: 'BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: 'FK', desc: 'JP_CORP_BOOK' },
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'FK', desc: '100001' },
      { name: 'TRANSACTION_TYPE_CODE', type: 'VARCHAR2(20)', role: '', desc: 'ADDITION / ADJUSTMENT / TRANSFER / FULL RETIREMENT' }
    ]
  },
  FA_ADJUSTMENTS: {
    id: 'FA_ADJUSTMENTS', name: 'FA_ADJUSTMENTS', jpName: 'FA 会計仕訳ソース配分', domain: 'AP_FA_TXNS',
    x: 956, y: 606, w: 286, h: 54, pk: 'ADJUSTMENT_LINE_ID', fks: ['TRANSACTION_HEADER_ID', 'ASSET_ID', 'CODE_COMBINATION_ID'],
    desc: '減価償却以外の全FAイベント（登録・原価修正・部門移動・除却売却）に対する貸借詳細(DR/CR)を生成する表。',
    keyCols: [
      { name: 'ADJUSTMENT_LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: '調整明細ID' },
      { name: 'TRANSACTION_HEADER_ID', type: 'NUMBER(18)', role: 'FK', desc: 'TXNヘッダID' },
      { name: 'SOURCE_TYPE_CODE', type: 'VARCHAR2(15)', role: '', desc: 'ADDITION / ADJUSTMENT / TRANSFER / RETIREMENT' },
      { name: 'ADJUSTMENT_TYPE', type: 'VARCHAR2(15)', role: '', desc: 'COST / COST CLEARING / RESERVE / NBV RETIRED 等' },
      { name: 'DEBIT_CREDIT_FLAG', type: 'VARCHAR2(2)', role: '', desc: 'DR / CR' },
      { name: 'ADJUSTMENT_AMOUNT', type: 'NUMBER', role: '', desc: '金額' }
    ]
  },
  FA_DEPRN_EVENTS: {
    id: 'FA_DEPRN_EVENTS', name: 'FA_DEPRN_EVENTS', jpName: 'FA 減価償却SLAイベント管理', domain: 'AP_FA_TXNS',
    x: 956, y: 684, w: 286, h: 54, pk: 'ASSET_ID, BOOK_TYPE_CODE, PERIOD_COUNTER', fks: ['EVENT_ID', 'ASSET_ID'],
    desc: '減価償却実行(Calculate Depreciation)で生成されたXLA_EVENTS.EVENT_IDとFA償却期間を紐付ける表。',
    keyCols: [
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '100001' },
      { name: 'BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: 'PK', desc: 'JP_CORP_BOOK' },
      { name: 'PERIOD_COUNTER', type: 'NUMBER(18)', role: 'PK', desc: '期間カウンタ' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'FK', desc: 'XLAイベントID' }
    ]
  },
  FA_DEPRN_SUMMARY: {
    id: 'FA_DEPRN_SUMMARY', name: 'FA_DEPRN_SUMMARY', jpName: 'FA 減価償却サマリ (資産・期間単位)', domain: 'AP_FA_TXNS',
    x: 956, y: 762, w: 286, h: 54, pk: 'BOOK_TYPE_CODE, ASSET_ID, PERIOD_COUNTER', fks: ['ASSET_ID', 'BOOK_TYPE_CODE'],
    desc: '資産・償却期間ごとの当期償却費(DEPRN_AMOUNT)・年初来累計(YTD_DEPRN)・減価償却累計額(DEPRN_RESERVE)を保持。',
    keyCols: [
      { name: 'BOOK_TYPE_CODE', type: 'VARCHAR2(30)', role: 'PK/FK', desc: 'JP_CORP_BOOK' },
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '100001' },
      { name: 'PERIOD_COUNTER', type: 'NUMBER(18)', role: 'PK', desc: '期間カウンタ' },
      { name: 'DEPRN_SOURCE_CODE', type: 'VARCHAR2(15)', role: '', desc: 'BOOKS / DEPRN' },
      { name: 'DEPRN_AMOUNT', type: 'NUMBER', role: '', desc: '当月償却額（25,000 / 30,000 等）' },
      { name: 'DEPRN_RESERVE', type: 'NUMBER', role: '', desc: '期末累計額' }
    ]
  },
  FA_DEPRN_DETAIL: {
    id: 'FA_DEPRN_DETAIL', name: 'FA_DEPRN_DETAIL', jpName: 'FA 減価償却明細 (配分・部門単位)', domain: 'AP_FA_TXNS',
    x: 956, y: 840, w: 286, h: 54, pk: 'BOOK_TYPE_CODE, ASSET_ID, DISTRIBUTION_ID, PERIOD_COUNTER', fks: ['ASSET_ID', 'DISTRIBUTION_ID'],
    desc: '部門・費用配分(DISTRIBUTION_ID)単位の当期償却費および累計額。SLA償却仕訳明細の直接元データ。',
    keyCols: [
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '100001' },
      { name: 'DISTRIBUTION_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '配分ID' },
      { name: 'PERIOD_COUNTER', type: 'NUMBER(18)', role: 'PK', desc: '期間カウンタ' },
      { name: 'DEPRN_AMOUNT', type: 'NUMBER', role: '', desc: '当月償却額' },
      { name: 'DEPRN_RESERVE', type: 'NUMBER', role: '', desc: '累計償却額' }
    ]
  },
  FA_RETIREMENTS: {
    id: 'FA_RETIREMENTS', name: 'FA_RETIREMENTS', jpName: 'FA 資産除却・売却廃止明細', domain: 'AP_FA_TXNS',
    x: 956, y: 918, w: 286, h: 54, pk: 'RETIREMENT_ID', fks: ['ASSET_ID', 'BOOK_TYPE_CODE', 'TRANSACTION_HEADER_ID_IN'],
    desc: '除却・売却額・撤去費用・簿価(NBV)・除却損益を保持。PENDINGで登録後、損益計算ジョブでPROCESSEDになる。',
    keyCols: [
      { name: 'RETIREMENT_ID', type: 'NUMBER(18)', role: 'PK', desc: '廃止ID' },
      { name: 'ASSET_ID', type: 'NUMBER(18)', role: 'FK', desc: '100001' },
      { name: 'COST_RETIRED', type: 'NUMBER', role: '', desc: '除却原価（1,500,000）' },
      { name: 'PROCEEDS_OF_SALE', type: 'NUMBER', role: '', desc: '売却収入（200,000）' },
      { name: 'COST_OF_REMOVAL', type: 'NUMBER', role: '', desc: '撤去費用（50,000）' },
      { name: 'NBV_RETIRED', type: 'NUMBER', role: '', desc: '除却簿価（600,000）' },
      { name: 'GAIN_LOSS_AMOUNT', type: 'NUMBER', role: '', desc: '除却損益（-450,000）' },
      { name: 'STATUS', type: 'VARCHAR2(15)', role: '', desc: 'PENDING → PROCESSED' }
    ]
  },

  // === E. SLA_XLA (5) ===
  XLA_TRANSACTION_ENTITIES: {
    id: 'XLA_TRANSACTION_ENTITIES', name: 'XLA_TRANSACTION_ENTITIES', jpName: 'SLA 取引エンティティ (AP 200 / FA 140)', domain: 'SLA_XLA',
    x: 1288, y: 60, w: 460, h: 56, pk: 'ENTITY_ID', fks: ['APPLICATION_ID', 'LEDGER_ID'],
    desc: 'AP(APPL=200: AP_INVOICES, AP_PAYMENTS) と FA(APPL=140: TRANSACTIONS, DEPRECIATION) の実体キーを保持。',
    keyCols: [
      { name: 'ENTITY_ID', type: 'NUMBER(15)', role: 'PK', desc: 'エンティティID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(15)', role: 'FK', desc: '200(AP) / 140(FA)' },
      { name: 'ENTITY_CODE', type: 'VARCHAR2(30)', role: '', desc: 'AP_INVOICES / AP_PAYMENTS / TRANSACTIONS / DEPRECIATION' },
      { name: 'SOURCE_ID_INT_1', type: 'NUMBER(15)', role: '', desc: 'INVOICE_ID / CHECK_ID / TXN_HDR_ID / ASSET_ID' }
    ]
  },
  XLA_EVENTS: {
    id: 'XLA_EVENTS', name: 'XLA_EVENTS', jpName: 'SLA 会計イベント', domain: 'SLA_XLA',
    x: 1288, y: 134, w: 460, h: 56, pk: 'EVENT_ID', fks: ['ENTITY_ID'],
    desc: '資産登録(ADDITIONS)・修正(COST_ADJUSTMENT)・移動(TRANSFERS)・減価償却(DEPRECIATION)・廃止(RETIREMENTS)等のイベントを管理。',
    keyCols: [
      { name: 'EVENT_ID', type: 'NUMBER(15)', role: 'PK', desc: 'イベントID' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'INVOICE_VALIDATED / ADDITIONS / COST_ADJUSTMENT / TRANSFERS / DEPRECIATION / RETIREMENTS' },
      { name: 'EVENT_STATUS_CODE', type: 'VARCHAR2(1)', role: '', desc: 'U → P（処理済）' }
    ]
  },
  XLA_AE_HEADERS: {
    id: 'XLA_AE_HEADERS', name: 'XLA_AE_HEADERS', jpName: 'SLA 仕訳ヘッダ', domain: 'SLA_XLA',
    x: 1288, y: 208, w: 460, h: 56, pk: 'AE_HEADER_ID', fks: ['EVENT_ID', 'LEDGER_ID'],
    desc: 'Create Accountingにより生成されたSLA仕訳伝票ヘッダ。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: 'SLA仕訳ヘッダID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(15)', role: '', desc: '200(AP) / 140(FA)' },
      { name: 'JE_CATEGORY_NAME', type: 'VARCHAR2(30)', role: '', desc: 'Addition / Adjustment / Transfer / Depreciation / Retirement' },
      { name: 'GL_TRANSFER_STATUS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'N → Y' }
    ]
  },
  XLA_AE_LINES: {
    id: 'XLA_AE_LINES', name: 'XLA_AE_LINES', jpName: 'SLA 仕訳明細', domain: 'SLA_XLA',
    x: 1288, y: 282, w: 460, h: 56, pk: 'AE_HEADER_ID, AE_LINE_NUM', fks: ['AE_HEADER_ID', 'CODE_COMBINATION_ID'],
    desc: '9セグメントAFF CCIDへの厳密な貸借仕訳明細。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: 'SLAヘッダID' },
      { name: 'AE_LINE_NUM', type: 'NUMBER(15)', role: 'PK', desc: '行番号' },
      { name: 'ACCOUNTING_CLASS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'ASSET_COST / ASSET_CLEARING / DEPRN_EXPENSE / RESERVE / GAIN_LOSS' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '9軸CCID' },
      { name: 'ACCOUNTED_DR / CR', type: 'NUMBER', role: '', desc: '借方 / 貸方金額(JPY)' }
    ]
  },
  XLA_DISTRIBUTION_LINKS: {
    id: 'XLA_DISTRIBUTION_LINKS', name: 'XLA_DISTRIBUTION_LINKS', jpName: 'SLA 監査トレースリンク', domain: 'SLA_XLA',
    x: 1288, y: 356, w: 460, h: 56, pk: 'AE_HEADER_ID, AE_LINE_NUM, REF_AE_HEADER_ID', fks: ['AE_HEADER_ID', 'SOURCE_DISTRIBUTION_ID_NUM_1'],
    desc: 'SLA仕訳明細からFA_ADJUSTMENTS / FA_DEPRN_DETAIL / AP_INVOICE_DISTRIBUTIONSへの監査ドリルダウンを提供。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: 'SLAヘッダID' },
      { name: 'SOURCE_DISTRIBUTION_TYPE', type: 'VARCHAR2(30)', role: '', desc: 'AP_INV_DIST / FA_ADJUSTMENTS / FA_DEPRN_DETAIL' },
      { name: 'SOURCE_DISTRIBUTION_ID_NUM_1', type: 'NUMBER(15)', role: 'FK', desc: '業務配分元ID' }
    ]
  },

  // === F. GL_LEDGER (6) ===
  GL_INTERFACE: {
    id: 'GL_INTERFACE', name: 'GL_INTERFACE', jpName: 'GL インタフェース一時表', domain: 'GL_LEDGER',
    x: 1288, y: 516, w: 460, h: 56, pk: 'GROUP_ID', fks: ['LEDGER_ID', 'CODE_COMBINATION_ID'],
    desc: 'SLAからJournal Importで取り込む直前の転送データ。',
    keyCols: [
      { name: 'GROUP_ID', type: 'NUMBER(15)', role: 'PK', desc: 'インポートグループID' },
      { name: 'USER_JE_SOURCE_NAME', type: 'VARCHAR2(25)', role: '', desc: 'Payables / Assets' },
      { name: 'USER_JE_CATEGORY_NAME', type: 'VARCHAR2(25)', role: '', desc: 'Addition / Depreciation 等' }
    ]
  },
  GL_JE_BATCHES: {
    id: 'GL_JE_BATCHES', name: 'GL_JE_BATCHES', jpName: 'GL 仕訳バッチ', domain: 'GL_LEDGER',
    x: 1288, y: 594, w: 460, h: 56, pk: 'JE_BATCH_ID', fks: [],
    desc: 'GL転記を実行する仕訳バッチ単位（STATUS=P）。',
    keyCols: [
      { name: 'JE_BATCH_ID', type: 'NUMBER(15)', role: 'PK', desc: '仕訳バッチID' },
      { name: 'NAME', type: 'VARCHAR2(100)', role: '', desc: 'バッチ名称' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: '', desc: 'P（転記済）' },
      { name: 'RUNNING_TOTAL_ACCOUNTED_DR', type: 'NUMBER', role: '', desc: '借方累計' }
    ]
  },
  GL_JE_HEADERS: {
    id: 'GL_JE_HEADERS', name: 'GL_JE_HEADERS', jpName: 'GL 仕訳ヘッダ', domain: 'GL_LEDGER',
    x: 1288, y: 672, w: 460, h: 56, pk: 'JE_HEADER_ID', fks: ['JE_BATCH_ID', 'LEDGER_ID'],
    desc: 'ソース(Payables / Assets)とカテゴリ(Addition / Transfer / Retirement / Depreciation)別伝票ヘッダ。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: '仕訳ヘッダID' },
      { name: 'JE_SOURCE', type: 'VARCHAR2(25)', role: '', desc: 'Payables / Assets' },
      { name: 'JE_CATEGORY', type: 'VARCHAR2(25)', role: '', desc: 'カテゴリ' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: '', desc: 'P（転記済）' }
    ]
  },
  GL_JE_LINES: {
    id: 'GL_JE_LINES', name: 'GL_JE_LINES', jpName: 'GL 仕訳明細', domain: 'GL_LEDGER',
    x: 1288, y: 750, w: 460, h: 56, pk: 'JE_HEADER_ID, JE_LINE_NUM', fks: ['JE_HEADER_ID', 'CODE_COMBINATION_ID'],
    desc: '9セグメントCCID別GL仕訳明細。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: 'ヘッダID' },
      { name: 'JE_LINE_NUM', type: 'NUMBER(15)', role: 'PK', desc: '行番号' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '9セグメントCCID' },
      { name: 'ACCOUNTED_DR / CR', type: 'NUMBER', role: '', desc: '借方 / 貸方金額' }
    ]
  },
  GL_IMPORT_REFERENCES: {
    id: 'GL_IMPORT_REFERENCES', name: 'GL_IMPORT_REFERENCES', jpName: 'GL-SLA ドリルダウン参照', domain: 'GL_LEDGER',
    x: 1288, y: 828, w: 460, h: 56, pk: 'JE_HEADER_ID, JE_LINE_NUM, GL_SL_LINK_ID', fks: ['JE_HEADER_ID'],
    desc: 'GL明細とXLA仕訳明細を GL_SL_LINK_ID で結合し、GL残高画面からFA資産・AP請求書への完全トレースを実現。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: 'ヘッダID' },
      { name: 'JE_LINE_NUM', type: 'NUMBER(15)', role: 'PK', desc: '行番号' },
      { name: 'GL_SL_LINK_ID', type: 'NUMBER(15)', role: 'FK', desc: 'SLAリンクID' }
    ]
  },
  GL_BALANCES: {
    id: 'GL_BALANCES', name: 'GL_BALANCES', jpName: 'GL 勘定残高 (期首・当期・期末)', domain: 'GL_LEDGER',
    x: 1288, y: 906, w: 460, h: 56, pk: 'LEDGER_ID, CODE_COMBINATION_ID, PERIOD_NAME', fks: ['LEDGER_ID', 'CODE_COMBINATION_ID'],
    desc: 'GL転記完了後に更新される試算表残高。固定資産仮勘定・買掛金・部門別移動元勘定・廃止済資産が正しく0となることを証明。',
    keyCols: [
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '2001' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '9セグメントCCID' },
      { name: 'BEGIN_BALANCE_DR / CR', type: 'NUMBER', role: '', desc: '期首借方・貸方残高' },
      { name: 'PERIOD_NET_DR / CR', type: 'NUMBER', role: '', desc: '当期発生借方・貸方' }
    ]
  }
};

const RELATIONS = [
  // Org & AFF master
  { id: 'r1', from: 'XLE_ENTITY_PROFILES', to: 'FUN_ALL_BUSINESS_UNITS_V', label: 'LEGAL_ENTITY_ID', cases: ['ALL'] },
  { id: 'r2', from: 'FUN_ALL_BUSINESS_UNITS_V', to: 'GL_LEDGERS', label: 'PRIMARY_LEDGER_ID', cases: ['ALL'] },
  { id: 'r3', from: 'GL_LEDGERS', to: 'GL_PERIOD_STATUSES', label: 'LEDGER_ID', cases: ['ALL'] },
  { id: 'r4', from: 'FND_KF_STR_INSTANCES_B', to: 'GL_CODE_COMBINATIONS', label: 'STRUCTURE_INSTANCE_ID', cases: ['ALL'] },
  { id: 'r5', from: 'GL_LEDGERS', to: 'GL_CODE_COMBINATIONS', label: 'CHART_OF_ACCOUNTS_ID', cases: ['ALL'] },
  // Partner & AP setup
  { id: 'r6', from: 'HZ_PARTIES', to: 'HZ_PARTY_SITES', label: 'PARTY_ID', cases: ['ALL'] },
  { id: 'r7', from: 'HZ_PARTIES', to: 'POZ_SUPPLIERS', label: 'PARTY_ID', cases: ['ALL'] },
  { id: 'r8', from: 'POZ_SUPPLIERS', to: 'POZ_SUPPLIER_SITES_ALL_M', label: 'VENDOR_ID', cases: ['ALL'] },
  { id: 'r9', from: 'CE_BANK_ACCOUNTS', to: 'CE_BANK_ACCT_USES_ALL', label: 'BANK_ACCOUNT_ID', cases: ['ALL'] },
  // FA setup
  { id: 'r10', from: 'FA_CALENDAR_TYPES', to: 'FA_CALENDAR_PERIODS', label: 'CALENDAR_TYPE', cases: ['ALL'] },
  { id: 'r11', from: 'FA_CALENDAR_TYPES', to: 'FA_BOOK_CONTROLS', label: 'DEPRN_CALENDAR', cases: ['ALL'] },
  { id: 'r12', from: 'GL_LEDGERS', to: 'FA_BOOK_CONTROLS', label: 'SET_OF_BOOKS_ID', cases: ['ALL'] },
  { id: 'r13', from: 'FA_BOOK_CONTROLS', to: 'FA_DEPRN_PERIODS', label: 'BOOK_TYPE_CODE', cases: ['ALL'] },
  { id: 'r14', from: 'FA_CATEGORIES_B', to: 'FA_CATEGORY_BOOKS', label: 'CATEGORY_ID', cases: ['ALL'] },
  { id: 'r15', from: 'FA_BOOK_CONTROLS', to: 'FA_CATEGORY_BOOKS', label: 'BOOK_TYPE_CODE', cases: ['ALL'] },
  { id: 'r16', from: 'GL_CODE_COMBINATIONS', to: 'FA_CATEGORY_BOOKS', label: 'CCID(1610/1690/5301/1619)', cases: ['ALL'] },
  // AP flows
  { id: 'r20', from: 'POZ_SUPPLIER_SITES_ALL_M', to: 'AP_INVOICES_ALL', label: 'VENDOR_SITE_ID', cases: ['ALL'] },
  { id: 'r21', from: 'AP_TERMS_B', to: 'AP_INVOICES_ALL', label: 'TERM_ID', cases: ['ALL'] },
  { id: 'r22', from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_LINES_ALL', label: 'INVOICE_ID', cases: ['ALL'] },
  { id: 'r23', from: 'ZX_RATES_B', to: 'ZX_LINES', label: 'JP_TAX_10 (10%)', cases: ['ALL'] },
  { id: 'r24', from: 'AP_INVOICE_LINES_ALL', to: 'ZX_LINES', label: 'TRX_LINE_ID', cases: ['ALL'] },
  { id: 'r25', from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: 'ASSETS_TRACKING=Y', cases: ['ALL'] },
  { id: 'r26', from: 'AP_INVOICES_ALL', to: 'AP_PAYMENT_SCHEDULES_ALL', label: 'INVOICE_ID', cases: ['ALL'] },
  { id: 'r27', from: 'AP_PAYMENT_SCHEDULES_ALL', to: 'IBY_DOCS_PAYABLE_ALL', label: 'PPR支払選択', cases: ['ALL'] },
  { id: 'r28', from: 'IBY_DOCS_PAYABLE_ALL', to: 'IBY_PAYMENTS_ALL', label: 'PAYMENT_ID', cases: ['ALL'] },
  { id: 'r29', from: 'IBY_PAYMENTS_ALL', to: 'AP_CHECKS_ALL', label: 'CHECK_ID', cases: ['ALL'] },
  { id: 'r30', from: 'CE_BANK_ACCT_USES_ALL', to: 'AP_CHECKS_ALL', label: 'BANK_ACCT_USE_ID', cases: ['ALL'] },
  { id: 'r31', from: 'AP_CHECKS_ALL', to: 'AP_INVOICE_PAYMENTS_ALL', label: 'CHECK_ID', cases: ['ALL'] },
  { id: 'r32', from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: 'CLEARED', cases: ['ALL'] },
  // AP -> FA bridge & FA lifecycles
  { id: 'r40', from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'FA_MASS_ADDITIONS', label: 'Create Mass Additions (U→Y)', cases: ['FA_AP_ADD_DEPRN', 'FA_ADJUST_TRANSFER'] },
  { id: 'r41', from: 'FA_MASS_ADDITIONS', to: 'FA_ADDITIONS_B', label: 'Post Mass Additions', cases: ['FA_AP_ADD_DEPRN'] },
  { id: 'r42', from: 'FA_ADDITIONS_B', to: 'FA_ADDITIONS_TL', label: 'ASSET_ID', cases: ['ALL'] },
  { id: 'r43', from: 'FA_ADDITIONS_B', to: 'FA_ASSET_INVOICES', label: '請求明細紐付', cases: ['FA_AP_ADD_DEPRN', 'FA_ADJUST_TRANSFER'] },
  { id: 'r44', from: 'FA_MASS_ADDITIONS', to: 'FA_BOOKS', label: 'ADD_TO_ASSET / ADDITION', cases: ['FA_AP_ADD_DEPRN', 'FA_ADJUST_TRANSFER'] },
  { id: 'r45', from: 'FA_METHODS', to: 'FA_BOOKS', label: 'STL / 60ヶ月', cases: ['ALL'] },
  { id: 'r46', from: 'FA_CONVENTION_TYPES', to: 'FA_BOOKS', label: 'SAME_MONTH', cases: ['ALL'] },
  { id: 'r47', from: 'FA_ADDITIONS_B', to: 'FA_DISTRIBUTION_HISTORY', label: '部門・設置場所', cases: ['ALL'] },
  { id: 'r48', from: 'FA_LOCATIONS', to: 'FA_DISTRIBUTION_HISTORY', label: 'LOCATION_ID', cases: ['ALL'] },
  { id: 'r49', from: 'FA_BOOKS', to: 'FA_TRANSACTION_HEADERS', label: 'TXN_HDR_IN/OUT', cases: ['ALL'] },
  { id: 'r50', from: 'FA_DISTRIBUTION_HISTORY', to: 'FA_TRANSACTION_HEADERS', label: 'TRANSFER / ADDITION', cases: ['ALL'] },
  { id: 'r51', from: 'FA_TRANSACTION_HEADERS', to: 'FA_ADJUSTMENTS', label: 'DR/CR配分生成', cases: ['ALL'] },
  { id: 'r52', from: 'FA_BOOKS', to: 'FA_DEPRN_EVENTS', label: 'Calculate Depreciation', cases: ['FA_AP_ADD_DEPRN', 'FA_ADJUST_TRANSFER'] },
  { id: 'r53', from: 'FA_DEPRN_EVENTS', to: 'FA_DEPRN_SUMMARY', label: 'ASSET単位償却', cases: ['ALL'] },
  { id: 'r54', from: 'FA_DEPRN_SUMMARY', to: 'FA_DEPRN_DETAIL', label: '配分単位償却', cases: ['ALL'] },
  { id: 'r55', from: 'FA_TRANSACTION_HEADERS', to: 'FA_RETIREMENTS', label: 'FULL RETIREMENT', cases: ['FA_RETIREMENT'] },
  { id: 'r56', from: 'FA_RETIREMENTS', to: 'FA_ADJUSTMENTS', label: '除却損益5行生成', cases: ['FA_RETIREMENT'] },
  { id: 'r57', from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'FA_RETIREMENTS', label: '撤去費50,000(1695)', cases: ['FA_RETIREMENT'] },
  // SLA -> GL
  { id: 'r60', from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=200 (AP_INVOICES)', cases: ['ALL'] },
  { id: 'r61', from: 'AP_PAYMENT_HISTORY_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=200 (AP_PAYMENTS)', cases: ['ALL'] },
  { id: 'r62', from: 'FA_ADJUSTMENTS', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=140 (TRANSACTIONS)', cases: ['ALL'] },
  { id: 'r63', from: 'FA_DEPRN_EVENTS', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=140 (DEPRECIATION)', cases: ['FA_AP_ADD_DEPRN', 'FA_ADJUST_TRANSFER'] },
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

// === 共通・FA設定マスタ初期データ ===
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
      { APPLICATION_ID: 200, LEDGER_ID: 2001, PERIOD_NAME: '2026-05', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 101, LEDGER_ID: 2001, PERIOD_NAME: '2026-05', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 200, LEDGER_ID: 2001, PERIOD_NAME: '2027-05', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 101, LEDGER_ID: 2001, PERIOD_NAME: '2027-05', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 200, LEDGER_ID: 2001, PERIOD_NAME: '2029-05', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 101, LEDGER_ID: 2001, PERIOD_NAME: '2029-05', CLOSING_STATUS: 'O' }
    ],
    FND_KF_STR_INSTANCES_B: [
      { STRUCTURE_INSTANCE_ID: 50001, STRUCTURE_INSTANCE_CODE: 'JP_9SEG_AFF', APPLICATION_ID: 101, KEY_FLEXFIELD_CODE: 'GL#' },
      { STRUCTURE_INSTANCE_ID: 50101, STRUCTURE_INSTANCE_CODE: 'JP_FA_CAT_FLEX', APPLICATION_ID: 140, KEY_FLEXFIELD_CODE: 'CAT#' },
      { STRUCTURE_INSTANCE_ID: 50102, STRUCTURE_INSTANCE_CODE: 'JP_FA_LOC_FLEX', APPLICATION_ID: 140, KEY_FLEXFIELD_CODE: 'LOC#' },
      { STRUCTURE_INSTANCE_ID: 50103, STRUCTURE_INSTANCE_CODE: 'JP_FA_KEY_FLEX', APPLICATION_ID: 140, KEY_FLEXFIELD_CODE: 'KEY#' }
    ],
    GL_CODE_COMBINATIONS: Object.values(CCID_LIST).map(c => ({
      CODE_COMBINATION_ID: c.ccid,
      SEGMENT_CONCAT: c.concat,
      ACCOUNT_DESC: c.name,
      ACCOUNT_TYPE: c.type
    })),
    HZ_PARTIES: [
      { PARTY_ID: 4001, PARTY_NAME: '東京精密機器株式会社（本体・増設納入）', PARTY_TYPE: 'ORGANIZATION' },
      { PARTY_ID: 4002, PARTY_NAME: '関東プラント撤去工事株式会社（撤去業者）', PARTY_TYPE: 'ORGANIZATION' }
    ],
    HZ_PARTY_SITES: [
      { PARTY_SITE_ID: 4201, PARTY_ID: 4001, PARTY_SITE_NUMBER: 'PS-FA-SUP-01' },
      { PARTY_SITE_ID: 4202, PARTY_ID: 4002, PARTY_SITE_NUMBER: 'PS-FA-RET-02' }
    ],
    POZ_SUPPLIERS: [
      { VENDOR_ID: 5001, PARTY_ID: 4001, SEGMENT1: 'SUP-FA-1001', VENDOR_NAME: '東京精密機器株式会社' },
      { VENDOR_ID: 5002, PARTY_ID: 4002, SEGMENT1: 'SUP-FA-1002', VENDOR_NAME: '関東プラント撤去工事株式会社' }
    ],
    POZ_SUPPLIER_SITES_ALL_M: [
      { VENDOR_SITE_ID: 5101, VENDOR_ID: 5001, PARTY_SITE_ID: 4201, VENDOR_SITE_CODE: 'TOKYO-EQUIP' },
      { VENDOR_SITE_ID: 5102, VENDOR_ID: 5002, PARTY_SITE_ID: 4202, VENDOR_SITE_CODE: 'TOKYO-WORKS' }
    ],
    AP_SYSTEM_PARAMETERS_ALL: [
      { ORG_ID: 300001, SET_OF_BOOKS_ID: 2001, ACCTS_PAY_CODE_COMBINATION_ID: 2101 }
    ],
    AP_TERMS_B: [
      { TERM_ID: 10, NAME: 'NET_30', ENABLED_FLAG: 'Y' }
    ],
    ZX_RATES_B: [
      { TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', PERCENTAGE_RATE: 10 }
    ],
    CE_BANK_ACCOUNTS: [
      { BANK_ACCOUNT_ID: 8001, BANK_ACCOUNT_NAME: 'みずほ銀行 本店 普通', BANK_ACCOUNT_NUM: '1234567', ASSET_CODE_COMBINATION_ID: 1001 }
    ],
    CE_BANK_ACCT_USES_ALL: [
      { BANK_ACCT_USE_ID: 7001, BANK_ACCOUNT_ID: 8001, ORG_ID: 300001 }
    ],
    IBY_PAYMENT_METHODS_B: [
      { PAYMENT_METHOD_CODE: 'ELECTRONIC', ENABLED_FLAG: 'Y' }
    ],
    FA_SYSTEM_CONTROLS: [
      { COMPANY_NAME: '株式会社テスト商事', LOCATION_FLEX_STRUCTURE: 50102, CATEGORY_FLEX_STRUCTURE: 50101, ASSET_KEY_FLEX_STRUCTURE: 50103, INITIAL_ASSET_ID: 100000 }
    ],
    FA_CALENDAR_TYPES: [
      { CALENDAR_TYPE: 'JP_MONTHLY_CAL', NUMBER_PER_FISCAL_YEAR: 12, FISCAL_YEAR_NAME: 'JP_FY_APR_MAR' }
    ],
    FA_CALENDAR_PERIODS: [
      { CALENDAR_TYPE: 'JP_MONTHLY_CAL', PERIOD_NAME: '2026-05', PERIOD_NUM: 2, START_DATE: '2026-05-01', END_DATE: '2026-05-31' },
      { CALENDAR_TYPE: 'JP_MONTHLY_CAL', PERIOD_NAME: '2027-05', PERIOD_NUM: 2, START_DATE: '2027-05-01', END_DATE: '2027-05-31' },
      { CALENDAR_TYPE: 'JP_MONTHLY_CAL', PERIOD_NAME: '2029-05', PERIOD_NUM: 2, START_DATE: '2029-05-01', END_DATE: '2029-05-31' }
    ],
    FA_BOOK_CONTROLS: [
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', BOOK_CLASS: 'CORPORATE', SET_OF_BOOKS_ID: 2001, DEPRN_CALENDAR: 'JP_MONTHLY_CAL', PRORATE_CALENDAR: 'JP_MONTHLY_CAL', DEPRN_STATUS: 'C' }
    ],
    FA_DEPRN_PERIODS: [
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', PERIOD_COUNTER: 24317, PERIOD_NAME: '2026-05', CALENDAR_PERIOD_OPEN_DATE: '2026-05-01', CALENDAR_PERIOD_CLOSE_DATE: '2026-05-31', PERIOD_CLOSE_DATE: null }
    ],
    FA_CONVENTION_TYPES: [
      { CONVENTION_TYPE_ID: 1, PRORATE_CONVENTION_CODE: 'SAME_MONTH', SET_ID: 1, FISCAL_YEAR_NAME: 'JP_FY_APR_MAR', DEPR_WHEN_ACQUIRED_FLAG: 'YES' }
    ],
    FA_METHODS: [
      { METHOD_ID: 201, METHOD_CODE: 'STL', LIFE_IN_MONTHS: 60, DEPRN_BASIS_RULE: 'COST', RATE_SOURCE_RULE: 'CALCULATED' }
    ],
    FA_CATEGORIES_B: [
      { CATEGORY_ID: 301, SEGMENT1: 'MACHINERY', SEGMENT2: 'INSPECTION', CAPITALIZE_FLAG: 'YES', OWNED_LEASED: 'OWNED' }
    ],
    FA_CATEGORY_BOOKS: [
      { CATEGORY_ID: 301, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_COST_ACCOUNT_CCID: 1610, ASSET_CLEARING_ACCOUNT_CCID: 1690, DEPRN_EXPENSE_ACCOUNT_CCID: 5301, RESERVE_ACCOUNT_CCID: 1619 }
    ],
    FA_LOCATIONS: [
      { LOCATION_ID: 701, SEGMENT1: 'JP', SEGMENT2: 'TOKYO', SEGMENT3: 'PLANT1F', ENABLED_FLAG: 'Y' },
      { LOCATION_ID: 702, SEGMENT1: 'JP', SEGMENT2: 'TOKYO', SEGMENT3: 'PLANT2F', ENABLED_FLAG: 'Y' }
    ],
    FA_ASSET_KEYWORDS: [
      { CODE_COMBINATION_ID: 801, SEGMENT1: 'CAPEX-2026-LINE1', ENABLED_FLAG: 'Y' }
    ]
  };
}

// === 3つの固定資産(FA)取引ケース ===
const CASES = {
  FA_AP_ADD_DEPRN: {
    id: 'FA_AP_ADD_DEPRN',
    shortTitle: '1. AP連携・資産登録・減価償却',
    title: 'ケース1：AP買掛連携 → 一括追加マージ → 資産登録(ADDITION) → 月次減価償却 → SLA → GL',
    subtitle: 'AP請求書(本体120万円+据付30万円+税10%=165万円)の支払完了後、Create/Post Mass Additionsで固定資産(150万円/定額60ヶ月)を登録し、初月償却25,000円をGLまで連携します。',
    badgeColor: '#0e7490',
    steps: [
      {
        id: 'S0', title: '1. 組織・AFF・AP・FA台帳マスタ準備', badge: 'MASTER_PREP', date: '2026-05-01',
        desc: '主元帳(2001)・9セグメントAFF(CCID)・仕入先(東京精密機器)・FA台帳(JP_CORP_BOOK)・償却方法(STL 60ヶ月)・カテゴリ勘定定義(機械1610/仮勘定1690/償却費5301/累計額1619)を確認。',
        focusTables: ['XLE_ENTITY_PROFILES', 'FUN_ALL_BUSINESS_UNITS_V', 'GL_LEDGERS', 'GL_CODE_COMBINATIONS', 'FA_BOOK_CONTROLS', 'FA_DEPRN_PERIODS', 'FA_CATEGORIES_B', 'FA_CATEGORY_BOOKS', 'FA_METHODS', 'FA_CONVENTION_TYPES', 'FA_LOCATIONS'],
        activeRelIds: ['r1', 'r2', 'r5', 'r12', 'r13', 'r14', 'r15', 'r16'],
        flows: [
          { from: 'FA_CATEGORIES_B', to: 'FA_CATEGORY_BOOKS', label: '1610/1690/5301/1619' },
          { from: 'GL_LEDGERS', to: 'FA_BOOK_CONTROLS', label: 'JP_CORP_BOOK' }
        ]
      },
      {
        id: 'S1', title: '2. AP設備請求書計上・検証 (ASSETS_TRACKING_FLAG=Y)', badge: 'AP_INVOICE_VAL', date: '2026-05-10',
        desc: 'AP請求書「AP-FA-2026-001」(検査装置本体120万+据付費30万+税10% 15万=税込1,650,000円)を計上し検証完了。AP_INVOICE_DISTRIBUTIONS_ALLの2品目行に固定資産仮勘定(CCID 1690)・ASSETS_TRACKING_FLAG=Y・ASSETS_ADDITION_FLAG=Uを設定。',
        focusTables: ['AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_PAYMENT_SCHEDULES_ALL'],
        activeRelIds: ['r20', 'r21', 'r22', 'r23', 'r24', 'r25', 'r26'],
        flows: [
          { from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_LINES_ALL', label: '本体120万+据付30万' },
          { from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: '仮勘定1690 / FLAG=U' }
        ]
      },
      {
        id: 'S2', title: '3. AP請求支払決済 (1,650,000円 CLEARED)', badge: 'AP_PAYMENT', date: '2026-05-12',
        desc: 'IBY経由で東京精密機器へ1,650,000円を銀行振込決済(AP_CHECKS_ALL=CLEARED, 請求未払残高0)。Create Mass Additions実行前提となるAP側検証・会計準備が完了。',
        focusTables: ['IBY_DOCS_PAYABLE_ALL', 'IBY_PAYMENTS_ALL', 'AP_CHECKS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_INVOICES_ALL', 'AP_PAYMENT_SCHEDULES_ALL'],
        activeRelIds: ['r27', 'r28', 'r29', 'r30', 'r31', 'r32'],
        flows: [
          { from: 'IBY_PAYMENTS_ALL', to: 'AP_CHECKS_ALL', label: '1,650,000 CLEARED' },
          { from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: 'PAYMENT CLEARING' }
        ]
      },
      {
        id: 'S3', title: '4. Create Mass Additions連携 ＆ 親子マージ', badge: 'CREATE_MASS_ADD', date: '2026-05-14',
        desc: '一括追加作成プロセスにより、AP_INVOICE_DISTRIBUTIONS_ALLのASSETS_ADDITION_FLAGがU→Yへ更新され、FA_MASS_ADDITIONSに2行(120万と30万)を連携。付帯費用である据付費30万を本体へマージ(MERGED)し、統合額1,500,000円のPOSTキューへ移行。',
        focusTables: ['AP_INVOICE_DISTRIBUTIONS_ALL', 'FA_MASS_ADDITIONS'],
        activeRelIds: ['r40'],
        flows: [
          { from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'FA_MASS_ADDITIONS', label: '120万+30万マージ → POST' }
        ]
      },
      {
        id: 'S4', title: '5. Post Mass Additions 資産本登録 (ADDITION)', badge: 'FA_ADDITION', date: '2026-05-15',
        desc: 'Post実行でFA_MASS_ADDITIONS=POSTEDとなり、FA_ADDITIONS_B/TL(AST-2026-0001)・FA_ASSET_INVOICES・FA_BOOKS(COST=1,500,000, STL 60ヶ月)・FA_DISTRIBUTION_HISTORY・FA_TRANSACTION_HEADERS(ADDITION)を生成。FA_ADJUSTMENTSに機械装置1610借方/仮勘定1690貸方の1,500,000円を記録。',
        focusTables: ['FA_MASS_ADDITIONS', 'FA_ADDITIONS_B', 'FA_ADDITIONS_TL', 'FA_ASSET_INVOICES', 'FA_BOOKS', 'FA_DISTRIBUTION_HISTORY', 'FA_TRANSACTION_HEADERS', 'FA_ADJUSTMENTS', 'FA_DEPRN_SUMMARY', 'FA_DEPRN_DETAIL'],
        activeRelIds: ['r41', 'r42', 'r43', 'r44', 'r45', 'r46', 'r47', 'r48', 'r49', 'r50', 'r51'],
        flows: [
          { from: 'FA_MASS_ADDITIONS', to: 'FA_ADDITIONS_B', label: 'AST-2026-0001 生成' },
          { from: 'FA_TRANSACTION_HEADERS', to: 'FA_ADJUSTMENTS', label: 'Dr1610 / Cr1690 150万' }
        ]
      },
      {
        id: 'S5', title: '6. 月次減価償却実行 (2026-05: 25,000円)', badge: 'FA_DEPRN', date: '2026-05-31',
        desc: 'Calculate Depreciationを実行。1,500,000 ÷ 60ヶ月 = 月額25,000円を算出し、FA_DEPRN_EVENTS・FA_DEPRN_SUMMARY・FA_DEPRN_DETAIL(DEPRN_AMOUNT=25,000, DEPRN_RESERVE=25,000)へ登録。',
        focusTables: ['FA_DEPRN_EVENTS', 'FA_DEPRN_SUMMARY', 'FA_DEPRN_DETAIL', 'FA_DEPRN_PERIODS', 'FA_BOOKS'],
        activeRelIds: ['r52', 'r53', 'r54'],
        flows: [
          { from: 'FA_BOOKS', to: 'FA_DEPRN_EVENTS', label: 'Calculate Deprn' },
          { from: 'FA_DEPRN_SUMMARY', to: 'FA_DEPRN_DETAIL', label: '償却費 25,000円' }
        ]
      },
      {
        id: 'S6', title: '7. SLA会計作成 (AP 200 & FA 140 一括仕訳)', badge: 'CREATE_ACCOUNTING', date: '2026-05-31',
        desc: 'AP(請求・支払)とFA(ADDITIONS 150万・DEPRECIATION 2.5万)の計4イベントをCreate Accountingで仕訳化し、XLA_AE_LINESに総発生額4,825,000円(Dr=Cr)を確定。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r60', 'r61', 'r62', 'r63', 'r64', 'r65', 'r66', 'r67'],
        flows: [
          { from: 'FA_ADJUSTMENTS', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=140 ADDITIONS' },
          { from: 'FA_DEPRN_EVENTS', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=140 DEPRECIATION' }
        ]
      },
      {
        id: 'S7', title: '8. GLインポート・転記・試算表残高確定', badge: 'GL_POST', date: '2026-05-31',
        desc: 'GL転記(Status=P)完了。GL_BALANCES上で固定資産仮勘定(1690)=0円・買掛金(2101)=0円、機械装置(1610)=1,500,000円、累計額(1619)=-25,000円(正味NBV 1,475,000円)を確認。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r68', 'r69', 'r70', 'r71', 'r72', 'r73'],
        flows: [
          { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'Transfer to GL' },
          { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '仮勘定0円 / NBV 147.5万' }
        ]
      }
    ]
  },

  FA_ADJUST_TRANSFER: {
    id: 'FA_ADJUST_TRANSFER',
    shortTitle: '2. 資産修正・部門移動・再計算償却',
    title: 'ケース2：資産修正（資本的支出AP連携 ADD_TO_ASSET）＆ 部門/場所移動(TRANSFER) → 再計算償却',
    subtitle: '稼働1年後(原価150万・累計30万・NBV120万)の検査装置にAP増設24万円を加算し(新原価174万)、製造1課→2課へ移管して残存48ヶ月の月額30,000円を再計算償却します。',
    badgeColor: '#2563eb',
    steps: [
      {
        id: 'S0', title: '1. 既存資産＆期首残高確認 (経過12ヶ月時点)', badge: 'OPENING_STATE', date: '2027-05-01',
        desc: '既存資産AST-2026-0001(原価1,500,000・累計償却300,000・簿価1,200,000・残存48ヶ月)およびGL_BALANCES期首残高(1610 Dr150万 / 1619 Cr30万 / 3101 Cr120万)を確認。',
        focusTables: ['FA_ADDITIONS_B', 'FA_BOOKS', 'FA_DISTRIBUTION_HISTORY', 'FA_DEPRN_SUMMARY', 'FA_DEPRN_PERIODS', 'GL_BALANCES'],
        activeRelIds: ['r13', 'r42', 'r47', 'r49', 'r53'],
        flows: [
          { from: 'FA_ADDITIONS_B', to: 'FA_BOOKS', label: '原価150万 / 残48ヶ月' },
          { from: 'FA_DEPRN_SUMMARY', to: 'GL_BALANCES', label: '期首累計 300,000円' }
        ]
      },
      {
        id: 'S1', title: '2. 資本的支出(追加ユニット)のAP請求＆支払', badge: 'AP_CAPEX_PAY', date: '2027-05-05',
        desc: '増設センサーモジュールAP請求書「AP-FA-2026-002」(税抜240,000円+税10% 24,000円=264,000円、仮勘定1690)を検証・支払決済(CLEARED)まで完了。',
        focusTables: ['AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_CHECKS_ALL', 'AP_PAYMENT_HISTORY_ALL'],
        activeRelIds: ['r20', 'r22', 'r24', 'r25', 'r28', 'r29', 'r31', 'r32'],
        flows: [
          { from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: '増設 240,000円' },
          { from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: '264,000 決済済' }
        ]
      },
      {
        id: 'S2', title: '3. 既存資産へのコスト追加修正 (ADJUSTMENT)', badge: 'COST_ADJUST', date: '2027-05-10',
        desc: 'FA_MASS_ADDITIONSにADD_TO_ASSET_ID=100001を設定してPost実行。FA_BOOKS旧行(150万)にTRANSACTION_HEADER_ID_OUTとDATE_INEFFECTIVEを設定し、新行(COST=1,740,000)を履歴挿入。FA_ADJUSTMENTSにDr1610/Cr1690 24万円を記録。',
        focusTables: ['AP_INVOICE_DISTRIBUTIONS_ALL', 'FA_MASS_ADDITIONS', 'FA_ASSET_INVOICES', 'FA_BOOKS', 'FA_TRANSACTION_HEADERS', 'FA_ADJUSTMENTS'],
        activeRelIds: ['r40', 'r43', 'r44', 'r49', 'r51'],
        flows: [
          { from: 'FA_MASS_ADDITIONS', to: 'FA_BOOKS', label: '150万→174万 (履歴更新)' },
          { from: 'FA_TRANSACTION_HEADERS', to: 'FA_ADJUSTMENTS', label: 'ADJUSTMENT 240,000' }
        ]
      },
      {
        id: 'S3', title: '4. 部門・設置場所の移動 (TRANSFER: 1課→2課)', badge: 'DEPT_TRANSFER', date: '2027-05-20',
        desc: '資産の配賦を製造1課(CCID 5301/PLANT1F)から製造2課(CCID 5302/PLANT2F)へ移動(TRANSFER)。FA_DISTRIBUTION_HISTORY旧行を終了し新行を追加、FA_ADJUSTMENTSに原価174万と累計額30万の部門間振替仕訳4行を生成。',
        focusTables: ['FA_DISTRIBUTION_HISTORY', 'FA_TRANSACTION_HEADERS', 'FA_ADJUSTMENTS', 'FA_LOCATIONS'],
        activeRelIds: ['r48', 'r50', 'r51'],
        flows: [
          { from: 'FA_DISTRIBUTION_HISTORY', to: 'FA_TRANSACTION_HEADERS', label: '製造1課 → 製造2課' },
          { from: 'FA_TRANSACTION_HEADERS', to: 'FA_ADJUSTMENTS', label: '原価174万/累計30万 振替' }
        ]
      },
      {
        id: 'S4', title: '5. 修正後コストの再計算減価償却 (月額30,000円)', badge: 'RECALC_DEPRN', date: '2027-05-31',
        desc: '新しい償却対象残高(新原価1,740,000 - 期首累計300,000 = 1,440,000円)を残存48ヶ月で再配賦し、月額30,000円を移動先(製造2課 5302/1620)へ計上(新累計330,000円)。',
        focusTables: ['FA_DEPRN_EVENTS', 'FA_DEPRN_SUMMARY', 'FA_DEPRN_DETAIL', 'FA_BOOKS'],
        activeRelIds: ['r52', 'r53', 'r54'],
        flows: [
          { from: 'FA_BOOKS', to: 'FA_DEPRN_EVENTS', label: '(174万-30万)÷48' },
          { from: 'FA_DEPRN_SUMMARY', to: 'FA_DEPRN_DETAIL', label: '製造2課 30,000円' }
        ]
      },
      {
        id: 'S5', title: '6. SLA会計作成 (AP 200 & FA 140 一括仕訳)', badge: 'CREATE_ACCOUNTING', date: '2027-05-31',
        desc: '資本的支出AP(請求・支払)＋FAコスト追加・部門振替・再計算償却の計5イベントをSLA仕訳化し、当期発生額合計2,838,000円(Dr=Cr)を確定。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r60', 'r61', 'r62', 'r63', 'r64', 'r65', 'r66', 'r67'],
        flows: [
          { from: 'FA_ADJUSTMENTS', to: 'XLA_TRANSACTION_ENTITIES', label: 'ADJUST & TRANSFER' },
          { from: 'FA_DEPRN_EVENTS', to: 'XLA_TRANSACTION_ENTITIES', label: 'RECALC DEPRECIATION' }
        ]
      },
      {
        id: 'S6', title: '7. GL転記・部門別残高(1課0円 / 2課174万)確認', badge: 'GL_POST', date: '2027-05-31',
        desc: 'GL転記完了(Status=P)。期首残＋当期発生により製造1課の原価(1610)・累計(1619)が完全0円となり、製造2課の原価(1611)=1,740,000円・累計(1620)=-330,000円へ正確に引継がれたことを検証。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r68', 'r69', 'r70', 'r71', 'r72', 'r73'],
        flows: [
          { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'Transfer to GL' },
          { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '1課0円 / 2課174万' }
        ]
      }
    ]
  },

  FA_RETIREMENT: {
    id: 'FA_RETIREMENT',
    shortTitle: '3. 資産廃止(除却・売却)・撤去費・損益計算',
    title: 'ケース3：資産廃止（撤去費用AP連携 → 除却/売却登録 → 損益計算 PROCESSED → SLA → GL）',
    subtitle: '3年稼働後の資産(原価150万・累計90万・簿価NBV60万)に対し撤去費用5万円(税込5.5万)をAP処理後、売却収入20万円で全廃止し除却売却損450,000円を計上します。',
    badgeColor: '#be185d',
    steps: [
      {
        id: 'S0', title: '1. 廃止対象資産＆期首残高確認 (NBV 600,000円)', badge: 'OPENING_STATE', date: '2029-05-01',
        desc: '稼働36ヶ月経過資産(原価1,500,000・累計900,000・帳簿価額600,000)とGL_BALANCES期首残高(1610 Dr150万 / 1619 Cr90万 / 3101 Cr60万)を確認。',
        focusTables: ['FA_ADDITIONS_B', 'FA_BOOKS', 'FA_DEPRN_SUMMARY', 'FA_DEPRN_PERIODS', 'GL_BALANCES'],
        activeRelIds: ['r13', 'r42', 'r49', 'r53'],
        flows: [
          { from: 'FA_BOOKS', to: 'FA_DEPRN_SUMMARY', label: 'NBV 600,000円' },
          { from: 'FA_DEPRN_SUMMARY', to: 'GL_BALANCES', label: '累計 900,000円' }
        ]
      },
      {
        id: 'S1', title: '2. 解体撤去費用のAP請求計上 ＆ 支払決済', badge: 'AP_REMOVAL_COST', date: '2029-05-10',
        desc: '関東プラント撤去工事からのAP請求「AP-FA-RET-003」(撤去費50,000円+税10% 5,000円=55,000円、除却撤去費用仮勘定1695)を計上・検証し、支払(CLEARED)まで完了。',
        focusTables: ['AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_CHECKS_ALL', 'AP_PAYMENT_HISTORY_ALL'],
        activeRelIds: ['r20', 'r22', 'r24', 'r25', 'r28', 'r29', 'r31', 'r32'],
        flows: [
          { from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: '撤去仮勘定1695 5万' },
          { from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: '55,000 支払済' }
        ]
      },
      {
        id: 'S2', title: '3. 資産全廃止(SALE/RETIREMENT) 登録 (PENDING)', badge: 'FA_RETIRE_REQ', date: '2029-05-15',
        desc: '資産廃止画面よりFULL RETIREMENTを登録。FA_TRANSACTION_HEADERS(FULL RETIREMENT)とFA_RETIREMENTS(COST_RETIRED=1,500,000, PROCEEDS_OF_SALE=200,000, COST_OF_REMOVAL=50,000, STATUS=PENDING)を生成。',
        focusTables: ['FA_TRANSACTION_HEADERS', 'FA_RETIREMENTS', 'FA_BOOKS'],
        activeRelIds: ['r55', 'r57'],
        flows: [
          { from: 'FA_TRANSACTION_HEADERS', to: 'FA_RETIREMENTS', label: 'STATUS = PENDING' }
        ]
      },
      {
        id: 'S3', title: '4. 除却損益計算実行 (PROCESSED / 損45万円)', badge: 'CALC_GAIN_LOSS', date: '2029-05-15',
        desc: 'Calculate Gains and Lossesを実行しSTATUS=PROCESSEDへ遷移。NBV 600,000 - 売却200,000 + 撤去50,000 = 損失450,000円(GAIN_LOSS_AMOUNT=-450,000)を算出。FA_BOOKSをCOST=0 & FULLY_RETIRED化し、FA_ADJUSTMENTSに除却仕訳5行を生成。',
        focusTables: ['FA_RETIREMENTS', 'FA_BOOKS', 'FA_ADJUSTMENTS'],
        activeRelIds: ['r49', 'r55', 'r56'],
        flows: [
          { from: 'FA_RETIREMENTS', to: 'FA_ADJUSTMENTS', label: '除却損 450,000 / 原価150万消去' }
        ]
      },
      {
        id: 'S4', title: '5. 廃止期間サマリ確認 ＆ 償却対象除外', badge: 'POST_RETIRE_CHK', date: '2029-05-31',
        desc: '廃止済みのため当期減価償却費=0円、FA_DEPRN_SUMMARY・FA_DEPRN_DETAIL上の資産簿価消滅(NBV=0)を確認。',
        focusTables: ['FA_DEPRN_SUMMARY', 'FA_DEPRN_DETAIL', 'FA_DEPRN_PERIODS', 'FA_DISTRIBUTION_HISTORY'],
        activeRelIds: ['r53', 'r54'],
        flows: [
          { from: 'FA_DEPRN_SUMMARY', to: 'FA_DEPRN_DETAIL', label: '廃止後 当月償却 0円' }
        ]
      },
      {
        id: 'S5', title: '6. SLA会計作成 (AP撤去費＋FA除却損益)', badge: 'CREATE_ACCOUNTING', date: '2029-05-31',
        desc: 'AP撤去費(請求・支払)＋FA除却イベント(RETIREMENTS 5明細 155万)をSLA仕訳化し、総発生額1,660,000円(Dr=Cr)を確定。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r60', 'r61', 'r62', 'r64', 'r65', 'r66', 'r67'],
        flows: [
          { from: 'FA_ADJUSTMENTS', to: 'XLA_TRANSACTION_ENTITIES', label: 'APPL=140 RETIREMENTS' },
          { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'Dr/Cr 1,660,000' }
        ]
      },
      {
        id: 'S6', title: '7. GL転記・資産/累計/撤去仮勘定の完全0円検証', badge: 'GL_POST', date: '2029-05-31',
        desc: 'GL転記完了(Status=P)。機械装置(1610)=0円、累計額(1619)=0円、撤去仮勘定(1695)=0円、買掛金(2101)=0円となり、除却売却損450,000円(6201)と売却未収200,000円(1694)が確定。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r68', 'r69', 'r70', 'r71', 'r72', 'r73'],
        flows: [
          { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'Transfer to GL' },
          { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '1610=0 / 1619=0 / 損45万' }
        ]
      }
    ]
  }
};

function buildJournalRow(jeHeaderId, jeLineNum, ccid, dr, cr, desc, period, glSlLinkId) {
  const c = CCID_LIST[ccid];
  return {
    JE_HEADER_ID: jeHeaderId,
    JE_LINE_NUM: jeLineNum,
    PERIOD_NAME: period,
    CODE_COMBINATION_ID: ccid,
    SEGMENT_CONCAT: c.concat,
    ACCOUNT_NAME: c.name,
    ACCOUNTED_DR: dr,
    ACCOUNTED_CR: cr,
    DESCRIPTION: desc,
    GL_SL_LINK_ID: glSlLinkId
  };
}

function computeBalancesWithOpening(openingEntries, jeLines, periodName) {
  const map = {};
  const ensure = (ccid) => {
    if (!map[ccid]) {
      const c = CCID_LIST[ccid];
      map[ccid] = {
        LEDGER_ID: 2001,
        CODE_COMBINATION_ID: ccid,
        SEGMENT_CONCAT: c.concat,
        ACCOUNT_NAME: c.name,
        PERIOD_NAME: periodName,
        BEGIN_BALANCE_DR: 0,
        BEGIN_BALANCE_CR: 0,
        PERIOD_NET_DR: 0,
        PERIOD_NET_CR: 0,
        END_BALANCE: 0
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

// === ケース別タイムライン状態生成 ===
function computeStateAtStep(caseId, stepIndex) {
  const state = buildCommonMasters();
  const emptyTables = [
    'AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES', 'AP_INVOICE_DISTRIBUTIONS_ALL',
    'AP_PAYMENT_SCHEDULES_ALL', 'IBY_DOCS_PAYABLE_ALL', 'IBY_PAYMENTS_ALL', 'AP_CHECKS_ALL',
    'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL',
    'FA_MASS_ADDITIONS', 'FA_ADDITIONS_B', 'FA_ADDITIONS_TL', 'FA_ASSET_INVOICES',
    'FA_BOOKS', 'FA_DISTRIBUTION_HISTORY', 'FA_TRANSACTION_HEADERS', 'FA_ADJUSTMENTS',
    'FA_DEPRN_EVENTS', 'FA_DEPRN_SUMMARY', 'FA_DEPRN_DETAIL', 'FA_RETIREMENTS',
    'XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS',
    'GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'
  ];
  emptyTables.forEach(t => { state[t] = []; });

  // Case別 期間ヘッダ調整
  if (caseId === 'FA_ADJUST_TRANSFER') {
    state.FA_DEPRN_PERIODS = [
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', PERIOD_COUNTER: 24328, PERIOD_NAME: '2027-04', CALENDAR_PERIOD_OPEN_DATE: '2027-04-01', CALENDAR_PERIOD_CLOSE_DATE: '2027-04-30', PERIOD_CLOSE_DATE: '2027-04-30' },
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', PERIOD_COUNTER: 24329, PERIOD_NAME: '2027-05', CALENDAR_PERIOD_OPEN_DATE: '2027-05-01', CALENDAR_PERIOD_CLOSE_DATE: '2027-05-31', PERIOD_CLOSE_DATE: null }
    ];
  } else if (caseId === 'FA_RETIREMENT') {
    state.FA_DEPRN_PERIODS = [
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', PERIOD_COUNTER: 24352, PERIOD_NAME: '2029-04', CALENDAR_PERIOD_OPEN_DATE: '2029-04-01', CALENDAR_PERIOD_CLOSE_DATE: '2029-04-30', PERIOD_CLOSE_DATE: '2029-04-30' },
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', PERIOD_COUNTER: 24353, PERIOD_NAME: '2029-05', CALENDAR_PERIOD_OPEN_DATE: '2029-05-01', CALENDAR_PERIOD_CLOSE_DATE: '2029-05-31', PERIOD_CLOSE_DATE: null }
    ];
  }

  // ==========================================================
  // CASE 1: FA_AP_ADD_DEPRN
  // ==========================================================
  if (caseId === 'FA_AP_ADD_DEPRN') {
    if (stepIndex >= 1) {
      const paid = stepIndex >= 2;
      const interfaced = stepIndex >= 3;
      const apAccounted = stepIndex >= 6;
      state.AP_INVOICES_ALL = [{
        INVOICE_ID: 10001, INVOICE_NUM: 'AP-FA-2026-001', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101, ORG_ID: 300001,
        INVOICE_DATE: '2026-05-10', INVOICE_CURRENCY_CODE: 'JPY', INVOICE_AMOUNT: 1650000,
        AMOUNT_PAID: paid ? 1650000 : 0, VALIDATION_STATUS: 'VALIDATED', PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N'
      }];
      state.AP_INVOICE_LINES_ALL = [
        { INVOICE_ID: 10001, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: '精密検査装置本体', AMOUNT: 1200000, ASSETS_TRACKING_FLAG: 'Y', ASSET_BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, DEFAULT_DIST_CCID: 1690 },
        { INVOICE_ID: 10001, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: '据付工事・調整費', AMOUNT: 300000, ASSETS_TRACKING_FLAG: 'Y', ASSET_BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, DEFAULT_DIST_CCID: 1690 },
        { INVOICE_ID: 10001, LINE_NUMBER: 3, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税10%(本体)', AMOUNT: 120000, ASSETS_TRACKING_FLAG: 'N', ASSET_BOOK_TYPE_CODE: null, ASSET_CATEGORY_ID: null, DEFAULT_DIST_CCID: 1501 },
        { INVOICE_ID: 10001, LINE_NUMBER: 4, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税10%(据付)', AMOUNT: 30000, ASSETS_TRACKING_FLAG: 'N', ASSET_BOOK_TYPE_CODE: null, ASSET_CATEGORY_ID: null, DEFAULT_DIST_CCID: 1501 }
      ];
      state.ZX_LINES = [
        { TAX_LINE_ID: 20001, TRX_ID: 10001, TRX_LINE_ID: 1, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAXABLE_AMT: 1200000, TAX_AMT: 120000 },
        { TAX_LINE_ID: 20002, TRX_ID: 10001, TRX_LINE_ID: 2, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAXABLE_AMT: 300000, TAX_AMT: 30000 }
      ];
      state.AP_INVOICE_DISTRIBUTIONS_ALL = [
        { INVOICE_DISTRIBUTION_ID: 10101, INVOICE_ID: 10001, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 1690, AMOUNT: 1200000, ASSETS_TRACKING_FLAG: 'Y', ASSETS_ADDITION_FLAG: interfaced ? 'Y' : 'U', ASSET_BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, ACCOUNTING_EVENT_ID: apAccounted ? 90001 : null, POSTED_FLAG: apAccounted ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10102, INVOICE_ID: 10001, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 1690, AMOUNT: 300000, ASSETS_TRACKING_FLAG: 'Y', ASSETS_ADDITION_FLAG: interfaced ? 'Y' : 'U', ASSET_BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, ACCOUNTING_EVENT_ID: apAccounted ? 90001 : null, POSTED_FLAG: apAccounted ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10103, INVOICE_ID: 10001, LINE_NUMBER: 3, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1501, AMOUNT: 120000, ASSETS_TRACKING_FLAG: 'N', ASSETS_ADDITION_FLAG: 'N', ASSET_BOOK_TYPE_CODE: null, ASSET_CATEGORY_ID: null, ACCOUNTING_EVENT_ID: apAccounted ? 90001 : null, POSTED_FLAG: apAccounted ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10104, INVOICE_ID: 10001, LINE_NUMBER: 4, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1501, AMOUNT: 30000, ASSETS_TRACKING_FLAG: 'N', ASSETS_ADDITION_FLAG: 'N', ASSET_BOOK_TYPE_CODE: null, ASSET_CATEGORY_ID: null, ACCOUNTING_EVENT_ID: apAccounted ? 90001 : null, POSTED_FLAG: apAccounted ? 'Y' : 'N' }
      ];
      state.AP_PAYMENT_SCHEDULES_ALL = [{
        INVOICE_ID: 10001, PAYMENT_NUM: 1, DUE_DATE: '2026-06-10', GROSS_AMOUNT: 1650000,
        AMOUNT_REMAINING: paid ? 0 : 1650000, PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N'
      }];
    }
    if (stepIndex >= 2) {
      const apAccounted = stepIndex >= 6;
      state.IBY_DOCS_PAYABLE_ALL = [{ DOCUMENT_PAYABLE_ID: 95001, CALLING_APP_DOC_UNIQUE_REF1: 10001, PAYMENT_ID: 91001, PAYMENT_AMOUNT: 1650000, DOCUMENT_STATUS: 'PAYMENT_CREATED' }];
      state.IBY_PAYMENTS_ALL = [{ PAYMENT_ID: 91001, INTERNAL_BANK_ACCOUNT_ID: 8001, PAYMENT_METHOD_CODE: 'ELECTRONIC', PAYMENT_AMOUNT: 1650000, PAYMENT_DATE: '2026-05-12', PAYMENT_STATUS: 'ISSUED' }];
      state.AP_CHECKS_ALL = [{ CHECK_ID: 88001, CHECK_NUMBER: 88001, VENDOR_ID: 5001, CE_BANK_ACCT_USE_ID: 7001, PAYMENT_ID: 91001, CHECK_DATE: '2026-05-12', AMOUNT: 1650000, STATUS_LOOKUP_CODE: 'CLEARED' }];
      state.AP_INVOICE_PAYMENTS_ALL = [{ INVOICE_PAYMENT_ID: 77001, INVOICE_ID: 10001, CHECK_ID: 88001, AMOUNT: 1650000, ACCOUNTING_EVENT_ID: apAccounted ? 90002 : null, POSTED_FLAG: apAccounted ? 'Y' : 'N' }];
      state.AP_PAYMENT_HISTORY_ALL = [{ PAYMENT_HISTORY_ID: 70001, CHECK_ID: 88001, TRANSACTION_TYPE: 'PAYMENT CLEARING', TRANSACTION_DATE: '2026-05-12', TRANSACTION_AMOUNT: 1650000, ACCOUNTING_EVENT_ID: apAccounted ? 90002 : null, POSTED_FLAG: apAccounted ? 'Y' : 'N' }];
    }
    if (stepIndex >= 3) {
      const posted = stepIndex >= 4;
      state.FA_MASS_ADDITIONS = [
        {
          MASS_ADDITION_ID: 50001, ASSET_NUMBER: posted ? 'AST-2026-0001' : null, DESCRIPTION: '精密検査装置（レーザー式）',
          BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, PAYABLES_COST: 1200000, FIXED_ASSETS_COST: 1500000,
          PAYABLES_UNITS: 1, FIXED_ASSETS_UNITS: 1, PAYABLES_CODE_COMBINATION_ID: 1690, EXPENSE_CODE_COMBINATION_ID: 5301,
          LOCATION_ID: 701, POSTING_STATUS: posted ? 'POSTED' : 'POST', QUEUE_NAME: posted ? 'POSTED' : 'POST',
          INVOICE_ID: 10001, INVOICE_NUMBER: 'AP-FA-2026-001', INVOICE_DISTRIBUTION_ID: 10101, PO_VENDOR_ID: 5001,
          ASSET_ID: posted ? 100001 : null, ADD_TO_ASSET_ID: null, MERGED_CODE: 'MP', SPLIT_MERGED_CODE: 'MP', DATE_PLACED_IN_SERVICE: '2026-05-15'
        },
        {
          MASS_ADDITION_ID: 50002, ASSET_NUMBER: null, DESCRIPTION: '据付工事・調整費（本体へマージ）',
          BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, PAYABLES_COST: 300000, FIXED_ASSETS_COST: 300000,
          PAYABLES_UNITS: 1, FIXED_ASSETS_UNITS: 1, PAYABLES_CODE_COMBINATION_ID: 1690, EXPENSE_CODE_COMBINATION_ID: 5301,
          LOCATION_ID: 701, POSTING_STATUS: 'MERGED', QUEUE_NAME: 'MERGED',
          INVOICE_ID: 10001, INVOICE_NUMBER: 'AP-FA-2026-001', INVOICE_DISTRIBUTION_ID: 10102, PO_VENDOR_ID: 5001,
          ASSET_ID: posted ? 100001 : null, ADD_TO_ASSET_ID: null, MERGED_CODE: 'MC', SPLIT_MERGED_CODE: 'MC', DATE_PLACED_IN_SERVICE: '2026-05-15'
        }
      ];
    }
    if (stepIndex >= 4) {
      const deprned = stepIndex >= 5;
      state.FA_ADDITIONS_B = [{ ASSET_ID: 100001, ASSET_NUMBER: 'AST-2026-0001', ASSET_TYPE: 'CAPITALIZED', ASSET_CATEGORY_ID: 301, ASSET_KEY_CCID: 801, CURRENT_UNITS: 1 }];
      state.FA_ADDITIONS_TL = [{ ASSET_ID: 100001, LANGUAGE: 'JA', DESCRIPTION: '精密検査装置（レーザー式）' }];
      state.FA_ASSET_INVOICES = [
        { ASSET_INVOICE_ID: 61001, ASSET_ID: 100001, INVOICE_ID: 10001, INVOICE_NUMBER: 'AP-FA-2026-001', INVOICE_DISTRIBUTION_ID: 10101, PO_VENDOR_ID: 5001, FIXED_ASSETS_COST: 1200000, DATE_INEFFECTIVE: null },
        { ASSET_INVOICE_ID: 61002, ASSET_ID: 100001, INVOICE_ID: 10001, INVOICE_NUMBER: 'AP-FA-2026-001', INVOICE_DISTRIBUTION_ID: 10102, PO_VENDOR_ID: 5001, FIXED_ASSETS_COST: 300000, DATE_INEFFECTIVE: null }
      ];
      state.FA_BOOKS = [{
        BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, TRANSACTION_HEADER_ID_IN: 40001, TRANSACTION_HEADER_ID_OUT: null,
        DATE_PLACED_IN_SERVICE: '2026-05-15', DATE_EFFECTIVE: '2026-05-15', DATE_INEFFECTIVE: null,
        DEPRN_START_DATE: '2026-05-01', DEPRN_METHOD_CODE: 'STL', LIFE_IN_MONTHS: 60,
        COST: 1500000, ORIGINAL_COST: 1500000, ADJUSTED_COST: 1500000, RECOVERABLE_COST: 1500000, SALVAGE_VALUE: 0,
        PRORATE_CONVENTION_CODE: 'SAME_MONTH', PRORATE_DATE: '2026-05-01', DEPRECIATE_FLAG: 'YES', PERIOD_COUNTER_FULLY_RETIRED: null
      }];
      state.FA_DISTRIBUTION_HISTORY = [{
        DISTRIBUTION_ID: 72001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, UNITS_ASSIGNED: 1,
        CODE_COMBINATION_ID: 5301, LOCATION_ID: 701, TRANSACTION_HEADER_ID_IN: 40001, DATE_INEFFECTIVE: null
      }];
      state.FA_TRANSACTION_HEADERS = [{
        TRANSACTION_HEADER_ID: 40001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001,
        TRANSACTION_TYPE_CODE: 'ADDITION', TRANSACTION_DATE_ENTERED: '2026-05-15', DATE_EFFECTIVE: '2026-05-15'
      }];
      state.FA_ADJUSTMENTS = [
        { ADJUSTMENT_LINE_ID: 81001, TRANSACTION_HEADER_ID: 40001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'ADDITION', ADJUSTMENT_TYPE: 'COST', DEBIT_CREDIT_FLAG: 'DR', CODE_COMBINATION_ID: 1610, ADJUSTMENT_AMOUNT: 1500000, PERIOD_COUNTER_CREATED: 24317 },
        { ADJUSTMENT_LINE_ID: 81002, TRANSACTION_HEADER_ID: 40001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'ADDITION', ADJUSTMENT_TYPE: 'COST CLEARING', DEBIT_CREDIT_FLAG: 'CR', CODE_COMBINATION_ID: 1690, ADJUSTMENT_AMOUNT: 1500000, PERIOD_COUNTER_CREATED: 24317 }
      ];
      state.FA_DEPRN_SUMMARY = [
        { BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, PERIOD_COUNTER: 24316, DEPRN_SOURCE_CODE: 'BOOKS', DEPRN_AMOUNT: 0, YTD_DEPRN: 0, DEPRN_RESERVE: 0, ADJUSTED_COST: 1500000 }
      ];
      state.FA_DEPRN_DETAIL = [
        { BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, PERIOD_COUNTER: 24316, DEPRN_SOURCE_CODE: 'B', DEPRN_AMOUNT: 0, YTD_DEPRN: 0, DEPRN_RESERVE: 0 }
      ];
      if (deprned) {
        state.FA_DEPRN_EVENTS = [{ EVENT_ID: 90004, ASSET_ID: 100001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', PERIOD_COUNTER: 24317, DEPRN_RUN_ID: 3001 }];
        state.FA_DEPRN_SUMMARY.push({ BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, PERIOD_COUNTER: 24317, DEPRN_SOURCE_CODE: 'DEPRN', DEPRN_AMOUNT: 25000, YTD_DEPRN: 25000, DEPRN_RESERVE: 25000, ADJUSTED_COST: 1500000 });
        state.FA_DEPRN_DETAIL.push({ BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, PERIOD_COUNTER: 24317, DEPRN_SOURCE_CODE: 'D', DEPRN_AMOUNT: 25000, YTD_DEPRN: 25000, DEPRN_RESERVE: 25000 });
      }
    }
    if (stepIndex >= 6) {
      const glSt = stepIndex >= 7 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 80001, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_INVOICES', TRANSACTION_NUMBER: 'AP-FA-2026-001', SOURCE_ID_INT_1: 10001 },
        { ENTITY_ID: 80002, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_PAYMENTS', TRANSACTION_NUMBER: 'CHK-88001', SOURCE_ID_INT_1: 88001 },
        { ENTITY_ID: 80003, APPLICATION_ID: 140, LEDGER_ID: 2001, ENTITY_CODE: 'TRANSACTIONS', TRANSACTION_NUMBER: 'FA-TXN-40001', SOURCE_ID_INT_1: 40001 },
        { ENTITY_ID: 80004, APPLICATION_ID: 140, LEDGER_ID: 2001, ENTITY_CODE: 'DEPRECIATION', TRANSACTION_NUMBER: 'AST-2026-0001-24317', SOURCE_ID_INT_1: 100001 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 90001, ENTITY_ID: 80001, EVENT_TYPE_CODE: 'INVOICE_VALIDATED', EVENT_DATE: '2026-05-10', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90002, ENTITY_ID: 80002, EVENT_TYPE_CODE: 'PAYMENT_CLEARED', EVENT_DATE: '2026-05-12', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90003, ENTITY_ID: 80003, EVENT_TYPE_CODE: 'ADDITIONS', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90004, ENTITY_ID: 80004, EVENT_TYPE_CODE: 'DEPRECIATION', EVENT_DATE: '2026-05-31', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 91001, APPLICATION_ID: 200, EVENT_ID: 90001, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-10', JE_CATEGORY_NAME: 'Purchase Invoices', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 91002, APPLICATION_ID: 200, EVENT_ID: 90002, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-12', JE_CATEGORY_NAME: 'Payments', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 91003, APPLICATION_ID: 140, EVENT_ID: 90003, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Addition', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 91004, APPLICATION_ID: 140, EVENT_ID: 90004, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-31', JE_CATEGORY_NAME: 'Depreciation', GL_TRANSFER_STATUS_CODE: glSt }
      ];
      const aeRaw = [
        [91001, 1, 'ASSET_CLEARING', 1690, 1200000, 0, '固定資産仮勘定（本体）', 701],
        [91001, 2, 'ASSET_CLEARING', 1690, 300000, 0, '固定資産仮勘定（据付）', 702],
        [91001, 3, 'RECOVERABLE_TAX', 1501, 150000, 0, '仮払消費税10%', 703],
        [91001, 4, 'LIABILITY', 2101, 0, 1650000, '買掛金計上（税込）', 704],
        [91002, 1, 'LIABILITY', 2101, 1650000, 0, '買掛金支払消込', 705],
        [91002, 2, 'CASH', 1001, 0, 1650000, '普通預金出金', 706],
        [91003, 1, 'ASSET_COST', 1610, 1500000, 0, '機械装置本資産計上', 707],
        [91003, 2, 'ASSET_CLEARING', 1690, 0, 1500000, '固定資産仮勘定振替消込', 708],
        [91004, 1, 'DEPRN_EXPENSE', 5301, 25000, 0, '月次減価償却費（製造1課）', 709],
        [91004, 2, 'DEPRN_RESERVE', 1619, 0, 25000, '機械装置・減価償却累計額', 710]
      ];
      state.XLA_AE_LINES = aeRaw.map(([hid, ln, cls, ccid, dr, cr, desc, lid]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat, ACCOUNT_NAME: CCID_LIST[ccid].name,
        ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: lid
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 91001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10101, REF_AE_HEADER_ID: 91001 },
        { AE_HEADER_ID: 91002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_HIST', SOURCE_DISTRIBUTION_ID_NUM_1: 70001, REF_AE_HEADER_ID: 91002 },
        { AE_HEADER_ID: 91003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FA_ADJUSTMENTS', SOURCE_DISTRIBUTION_ID_NUM_1: 81001, REF_AE_HEADER_ID: 91003 },
        { AE_HEADER_ID: 91004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FA_DEPRN_DETAIL', SOURCE_DISTRIBUTION_ID_NUM_1: 72001, REF_AE_HEADER_ID: 91004 }
      ];
    }
    if (stepIndex >= 7) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6001, LINE_NO: idx + 1, STATUS: 'PROCESSED',
        USER_JE_SOURCE_NAME: l.AE_HEADER_ID <= 91002 ? 'Payables' : 'Assets',
        USER_JE_CATEGORY_NAME: state.XLA_AE_HEADERS.find(h => h.AE_HEADER_ID === l.AE_HEADER_ID).JE_CATEGORY_NAME,
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [{ JE_BATCH_ID: 55001, NAME: 'FA_AP_ADD_BATCH_202605', STATUS: 'P', DEFAULT_PERIOD_NAME: '2026-05', RUNNING_TOTAL_ACCOUNTED_DR: 4825000, RUNNING_TOTAL_ACCOUNTED_CR: 4825000 }];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66001, JE_BATCH_ID: 55001, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Purchase & Payment', PERIOD_NAME: '2026-05', STATUS: 'P', RUNNING_TOTAL_DR: 3300000, RUNNING_TOTAL_CR: 3300000 },
        { JE_HEADER_ID: 66002, JE_BATCH_ID: 55001, LEDGER_ID: 2001, JE_SOURCE: 'Assets', JE_CATEGORY: 'Addition', PERIOD_NAME: '2026-05', STATUS: 'P', RUNNING_TOTAL_DR: 1500000, RUNNING_TOTAL_CR: 1500000 },
        { JE_HEADER_ID: 66003, JE_BATCH_ID: 55001, LEDGER_ID: 2001, JE_SOURCE: 'Assets', JE_CATEGORY: 'Depreciation', PERIOD_NAME: '2026-05', STATUS: 'P', RUNNING_TOTAL_DR: 25000, RUNNING_TOTAL_CR: 25000 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const jhid = l.AE_HEADER_ID <= 91002 ? 66001 : (l.AE_HEADER_ID === 91003 ? 66002 : 66003);
        const lno = l.AE_HEADER_ID === 91002 ? l.AE_LINE_NUM + 10 : l.AE_LINE_NUM;
        return buildJournalRow(jhid, lno, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, '2026-05', l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({ JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL' }));
      state.GL_BALANCES = computeBalancesWithOpening([], state.GL_JE_LINES, '2026-05');
    }

  // ==========================================================
  // CASE 2: FA_ADJUST_TRANSFER
  // ==========================================================
  } else if (caseId === 'FA_ADJUST_TRANSFER') {
    const adjusted = stepIndex >= 2;
    const transferred = stepIndex >= 3;
    const deprned = stepIndex >= 4;
    const opening = [[1610, 1500000, 0], [1619, 0, 300000], [3101, 0, 1200000]];

    state.FA_ADDITIONS_B = [{ ASSET_ID: 100001, ASSET_NUMBER: 'AST-2026-0001', ASSET_TYPE: 'CAPITALIZED', ASSET_CATEGORY_ID: 301, ASSET_KEY_CCID: 801, CURRENT_UNITS: 1 }];
    state.FA_ADDITIONS_TL = [{ ASSET_ID: 100001, LANGUAGE: 'JA', DESCRIPTION: '精密検査装置（レーザー式）' }];
    state.FA_ASSET_INVOICES = [
      { ASSET_INVOICE_ID: 61001, ASSET_ID: 100001, INVOICE_ID: 10001, INVOICE_NUMBER: 'AP-FA-2026-001', INVOICE_DISTRIBUTION_ID: 10101, PO_VENDOR_ID: 5001, FIXED_ASSETS_COST: 1500000, DATE_INEFFECTIVE: null }
    ];
    state.FA_BOOKS = [{
      BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, TRANSACTION_HEADER_ID_IN: 40001, TRANSACTION_HEADER_ID_OUT: adjusted ? 40002 : null,
      DATE_PLACED_IN_SERVICE: '2026-05-15', DATE_EFFECTIVE: '2026-05-15', DATE_INEFFECTIVE: adjusted ? '2027-05-10' : null,
      DEPRN_START_DATE: '2026-05-01', DEPRN_METHOD_CODE: 'STL', LIFE_IN_MONTHS: 60,
      COST: 1500000, ORIGINAL_COST: 1500000, ADJUSTED_COST: 1500000, RECOVERABLE_COST: 1500000, SALVAGE_VALUE: 0,
      PRORATE_CONVENTION_CODE: 'SAME_MONTH', PRORATE_DATE: '2026-05-01', DEPRECIATE_FLAG: 'YES', PERIOD_COUNTER_FULLY_RETIRED: null
    }];
    state.FA_DISTRIBUTION_HISTORY = [{
      DISTRIBUTION_ID: 72001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, UNITS_ASSIGNED: 1,
      CODE_COMBINATION_ID: 5301, LOCATION_ID: 701, TRANSACTION_HEADER_ID_IN: 40001, TRANSACTION_HEADER_ID_OUT: transferred ? 40003 : null,
      DATE_INEFFECTIVE: transferred ? '2027-05-20' : null
    }];
    state.FA_TRANSACTION_HEADERS = [
      { TRANSACTION_HEADER_ID: 40001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, TRANSACTION_TYPE_CODE: 'ADDITION', TRANSACTION_DATE_ENTERED: '2026-05-15', DATE_EFFECTIVE: '2026-05-15' }
    ];
    state.FA_DEPRN_SUMMARY = [
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, PERIOD_COUNTER: 24328, DEPRN_SOURCE_CODE: 'DEPRN', DEPRN_AMOUNT: 25000, YTD_DEPRN: 25000, DEPRN_RESERVE: 300000, ADJUSTED_COST: 1500000 }
    ];
    state.FA_DEPRN_DETAIL = [
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, PERIOD_COUNTER: 24328, DEPRN_SOURCE_CODE: 'D', DEPRN_AMOUNT: 25000, YTD_DEPRN: 25000, DEPRN_RESERVE: 300000 }
    ];
    if (stepIndex === 0) {
      state.GL_BALANCES = computeBalancesWithOpening(opening, [], '2027-05 (期首)');
    }

    if (stepIndex >= 1) {
      const interfaced = stepIndex >= 2;
      const apAcc = stepIndex >= 5;
      state.AP_INVOICES_ALL = [{
        INVOICE_ID: 10002, INVOICE_NUM: 'AP-FA-2026-002', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101, ORG_ID: 300001,
        INVOICE_DATE: '2027-05-05', INVOICE_CURRENCY_CODE: 'JPY', INVOICE_AMOUNT: 264000, AMOUNT_PAID: 264000, VALIDATION_STATUS: 'VALIDATED', PAYMENT_STATUS_FLAG: 'Y'
      }];
      state.AP_INVOICE_LINES_ALL = [
        { INVOICE_ID: 10002, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: '増設センサーモジュール（資本的支出）', AMOUNT: 240000, ASSETS_TRACKING_FLAG: 'Y', ASSET_BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, DEFAULT_DIST_CCID: 1690 },
        { INVOICE_ID: 10002, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税10%', AMOUNT: 24000, ASSETS_TRACKING_FLAG: 'N', ASSET_BOOK_TYPE_CODE: null, ASSET_CATEGORY_ID: null, DEFAULT_DIST_CCID: 1501 }
      ];
      state.ZX_LINES = [{ TAX_LINE_ID: 20101, TRX_ID: 10002, TRX_LINE_ID: 1, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAXABLE_AMT: 240000, TAX_AMT: 24000 }];
      state.AP_INVOICE_DISTRIBUTIONS_ALL = [
        { INVOICE_DISTRIBUTION_ID: 10201, INVOICE_ID: 10002, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 1690, AMOUNT: 240000, ASSETS_TRACKING_FLAG: 'Y', ASSETS_ADDITION_FLAG: interfaced ? 'Y' : 'U', ASSET_BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, ACCOUNTING_EVENT_ID: apAcc ? 92001 : null, POSTED_FLAG: apAcc ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10202, INVOICE_ID: 10002, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1501, AMOUNT: 24000, ASSETS_TRACKING_FLAG: 'N', ASSETS_ADDITION_FLAG: 'N', ASSET_BOOK_TYPE_CODE: null, ASSET_CATEGORY_ID: null, ACCOUNTING_EVENT_ID: apAcc ? 92001 : null, POSTED_FLAG: apAcc ? 'Y' : 'N' }
      ];
      state.AP_PAYMENT_SCHEDULES_ALL = [{ INVOICE_ID: 10002, PAYMENT_NUM: 1, DUE_DATE: '2027-06-05', GROSS_AMOUNT: 264000, AMOUNT_REMAINING: 0, PAYMENT_STATUS_FLAG: 'Y' }];
      state.IBY_DOCS_PAYABLE_ALL = [{ DOCUMENT_PAYABLE_ID: 95201, CALLING_APP_DOC_UNIQUE_REF1: 10002, PAYMENT_ID: 91201, PAYMENT_AMOUNT: 264000, DOCUMENT_STATUS: 'PAYMENT_CREATED' }];
      state.IBY_PAYMENTS_ALL = [{ PAYMENT_ID: 91201, INTERNAL_BANK_ACCOUNT_ID: 8001, PAYMENT_METHOD_CODE: 'ELECTRONIC', PAYMENT_AMOUNT: 264000, PAYMENT_DATE: '2027-05-05', PAYMENT_STATUS: 'ISSUED' }];
      state.AP_CHECKS_ALL = [{ CHECK_ID: 88201, CHECK_NUMBER: 88201, VENDOR_ID: 5001, CE_BANK_ACCT_USE_ID: 7001, PAYMENT_ID: 91201, CHECK_DATE: '2027-05-05', AMOUNT: 264000, STATUS_LOOKUP_CODE: 'CLEARED' }];
      state.AP_INVOICE_PAYMENTS_ALL = [{ INVOICE_PAYMENT_ID: 77201, INVOICE_ID: 10002, CHECK_ID: 88201, AMOUNT: 264000, ACCOUNTING_EVENT_ID: apAcc ? 92002 : null, POSTED_FLAG: apAcc ? 'Y' : 'N' }];
      state.AP_PAYMENT_HISTORY_ALL = [{ PAYMENT_HISTORY_ID: 70201, CHECK_ID: 88201, TRANSACTION_TYPE: 'PAYMENT CLEARING', TRANSACTION_DATE: '2027-05-05', TRANSACTION_AMOUNT: 264000, ACCOUNTING_EVENT_ID: apAcc ? 92002 : null, POSTED_FLAG: apAcc ? 'Y' : 'N' }];
    }
    if (stepIndex >= 2) {
      state.FA_MASS_ADDITIONS = [{
        MASS_ADDITION_ID: 50201, ASSET_NUMBER: 'AST-2026-0001', DESCRIPTION: '増設センサーモジュール（既存資産追加）',
        BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: 301, PAYABLES_COST: 240000, FIXED_ASSETS_COST: 240000,
        PAYABLES_UNITS: 1, FIXED_ASSETS_UNITS: 1, PAYABLES_CODE_COMBINATION_ID: 1690, EXPENSE_CODE_COMBINATION_ID: 5301,
        LOCATION_ID: 701, POSTING_STATUS: 'POSTED', QUEUE_NAME: 'POSTED',
        INVOICE_ID: 10002, INVOICE_NUMBER: 'AP-FA-2026-002', INVOICE_DISTRIBUTION_ID: 10201, PO_VENDOR_ID: 5001,
        ASSET_ID: 100001, ADD_TO_ASSET_ID: 100001, MERGED_CODE: null, SPLIT_MERGED_CODE: null, DATE_PLACED_IN_SERVICE: '2027-05-10'
      }];
      state.FA_ASSET_INVOICES.push({
        ASSET_INVOICE_ID: 61003, ASSET_ID: 100001, INVOICE_ID: 10002, INVOICE_NUMBER: 'AP-FA-2026-002', INVOICE_DISTRIBUTION_ID: 10201, PO_VENDOR_ID: 5001, FIXED_ASSETS_COST: 240000, DATE_INEFFECTIVE: null
      });
      state.FA_TRANSACTION_HEADERS.push({
        TRANSACTION_HEADER_ID: 40002, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001,
        TRANSACTION_TYPE_CODE: 'ADJUSTMENT', TRANSACTION_DATE_ENTERED: '2027-05-10', DATE_EFFECTIVE: '2027-05-10'
      });
      state.FA_BOOKS.push({
        BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, TRANSACTION_HEADER_ID_IN: 40002, TRANSACTION_HEADER_ID_OUT: null,
        DATE_PLACED_IN_SERVICE: '2026-05-15', DATE_EFFECTIVE: '2027-05-10', DATE_INEFFECTIVE: null,
        DEPRN_START_DATE: '2026-05-01', DEPRN_METHOD_CODE: 'STL', LIFE_IN_MONTHS: 60,
        COST: 1740000, ORIGINAL_COST: 1500000, ADJUSTED_COST: 1440000, RECOVERABLE_COST: 1740000, SALVAGE_VALUE: 0,
        PRORATE_CONVENTION_CODE: 'SAME_MONTH', PRORATE_DATE: '2026-05-01', DEPRECIATE_FLAG: 'YES', PERIOD_COUNTER_FULLY_RETIRED: null
      });
      state.FA_ADJUSTMENTS.push(
        { ADJUSTMENT_LINE_ID: 82001, TRANSACTION_HEADER_ID: 40002, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'ADJUSTMENT', ADJUSTMENT_TYPE: 'COST', DEBIT_CREDIT_FLAG: 'DR', CODE_COMBINATION_ID: 1610, ADJUSTMENT_AMOUNT: 240000, PERIOD_COUNTER_CREATED: 24329 },
        { ADJUSTMENT_LINE_ID: 82002, TRANSACTION_HEADER_ID: 40002, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'ADJUSTMENT', ADJUSTMENT_TYPE: 'COST CLEARING', DEBIT_CREDIT_FLAG: 'CR', CODE_COMBINATION_ID: 1690, ADJUSTMENT_AMOUNT: 240000, PERIOD_COUNTER_CREATED: 24329 }
      );
    }
    if (stepIndex >= 3) {
      state.FA_TRANSACTION_HEADERS.push({
        TRANSACTION_HEADER_ID: 40003, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001,
        TRANSACTION_TYPE_CODE: 'TRANSFER', TRANSACTION_DATE_ENTERED: '2027-05-20', DATE_EFFECTIVE: '2027-05-20'
      });
      state.FA_DISTRIBUTION_HISTORY.push({
        DISTRIBUTION_ID: 72002, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, UNITS_ASSIGNED: 1,
        CODE_COMBINATION_ID: 5302, LOCATION_ID: 702, TRANSACTION_HEADER_ID_IN: 40003, TRANSACTION_HEADER_ID_OUT: null, DATE_INEFFECTIVE: null
      });
      state.FA_ADJUSTMENTS.push(
        { ADJUSTMENT_LINE_ID: 82003, TRANSACTION_HEADER_ID: 40003, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72002, SOURCE_TYPE_CODE: 'TRANSFER', ADJUSTMENT_TYPE: 'COST', DEBIT_CREDIT_FLAG: 'DR', CODE_COMBINATION_ID: 1611, ADJUSTMENT_AMOUNT: 1740000, PERIOD_COUNTER_CREATED: 24329 },
        { ADJUSTMENT_LINE_ID: 82004, TRANSACTION_HEADER_ID: 40003, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'TRANSFER', ADJUSTMENT_TYPE: 'COST', DEBIT_CREDIT_FLAG: 'CR', CODE_COMBINATION_ID: 1610, ADJUSTMENT_AMOUNT: 1740000, PERIOD_COUNTER_CREATED: 24329 },
        { ADJUSTMENT_LINE_ID: 82005, TRANSACTION_HEADER_ID: 40003, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'TRANSFER', ADJUSTMENT_TYPE: 'RESERVE', DEBIT_CREDIT_FLAG: 'DR', CODE_COMBINATION_ID: 1619, ADJUSTMENT_AMOUNT: 300000, PERIOD_COUNTER_CREATED: 24329 },
        { ADJUSTMENT_LINE_ID: 82006, TRANSACTION_HEADER_ID: 40003, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72002, SOURCE_TYPE_CODE: 'TRANSFER', ADJUSTMENT_TYPE: 'RESERVE', DEBIT_CREDIT_FLAG: 'CR', CODE_COMBINATION_ID: 1620, ADJUSTMENT_AMOUNT: 300000, PERIOD_COUNTER_CREATED: 24329 }
      );
    }
    if (deprned) {
      state.FA_DEPRN_EVENTS = [{ EVENT_ID: 92005, ASSET_ID: 100001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', PERIOD_COUNTER: 24329, DEPRN_RUN_ID: 3101 }];
      state.FA_DEPRN_SUMMARY.push({ BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, PERIOD_COUNTER: 24329, DEPRN_SOURCE_CODE: 'DEPRN', DEPRN_AMOUNT: 30000, YTD_DEPRN: 55000, DEPRN_RESERVE: 330000, ADJUSTED_COST: 1440000 });
      state.FA_DEPRN_DETAIL.push({ BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72002, PERIOD_COUNTER: 24329, DEPRN_SOURCE_CODE: 'D', DEPRN_AMOUNT: 30000, YTD_DEPRN: 30000, DEPRN_RESERVE: 330000 });
    }
    if (stepIndex >= 5) {
      const glSt = stepIndex >= 6 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 82001, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_INVOICES', TRANSACTION_NUMBER: 'AP-FA-2026-002', SOURCE_ID_INT_1: 10002 },
        { ENTITY_ID: 82002, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_PAYMENTS', TRANSACTION_NUMBER: 'CHK-88201', SOURCE_ID_INT_1: 88201 },
        { ENTITY_ID: 82003, APPLICATION_ID: 140, LEDGER_ID: 2001, ENTITY_CODE: 'TRANSACTIONS', TRANSACTION_NUMBER: 'FA-TXN-40002', SOURCE_ID_INT_1: 40002 },
        { ENTITY_ID: 82004, APPLICATION_ID: 140, LEDGER_ID: 2001, ENTITY_CODE: 'TRANSACTIONS', TRANSACTION_NUMBER: 'FA-TXN-40003', SOURCE_ID_INT_1: 40003 },
        { ENTITY_ID: 82005, APPLICATION_ID: 140, LEDGER_ID: 2001, ENTITY_CODE: 'DEPRECIATION', TRANSACTION_NUMBER: 'AST-2026-0001-24329', SOURCE_ID_INT_1: 100001 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 92001, ENTITY_ID: 82001, EVENT_TYPE_CODE: 'INVOICE_VALIDATED', EVENT_DATE: '2027-05-05', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92002, ENTITY_ID: 82002, EVENT_TYPE_CODE: 'PAYMENT_CLEARED', EVENT_DATE: '2027-05-05', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92003, ENTITY_ID: 82003, EVENT_TYPE_CODE: 'COST_ADJUSTMENT', EVENT_DATE: '2027-05-10', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92004, ENTITY_ID: 82004, EVENT_TYPE_CODE: 'TRANSFERS', EVENT_DATE: '2027-05-20', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92005, ENTITY_ID: 82005, EVENT_TYPE_CODE: 'DEPRECIATION', EVENT_DATE: '2027-05-31', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 93001, APPLICATION_ID: 200, EVENT_ID: 92001, LEDGER_ID: 2001, ACCOUNTING_DATE: '2027-05-05', JE_CATEGORY_NAME: 'Purchase Invoices', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 93002, APPLICATION_ID: 200, EVENT_ID: 92002, LEDGER_ID: 2001, ACCOUNTING_DATE: '2027-05-05', JE_CATEGORY_NAME: 'Payments', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 93003, APPLICATION_ID: 140, EVENT_ID: 92003, LEDGER_ID: 2001, ACCOUNTING_DATE: '2027-05-10', JE_CATEGORY_NAME: 'Adjustment', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 93004, APPLICATION_ID: 140, EVENT_ID: 92004, LEDGER_ID: 2001, ACCOUNTING_DATE: '2027-05-20', JE_CATEGORY_NAME: 'Transfer', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 93005, APPLICATION_ID: 140, EVENT_ID: 92005, LEDGER_ID: 2001, ACCOUNTING_DATE: '2027-05-31', JE_CATEGORY_NAME: 'Depreciation', GL_TRANSFER_STATUS_CODE: glSt }
      ];
      const aeRaw = [
        [93001, 1, 'ASSET_CLEARING', 1690, 240000, 0, '資本的支出・仮勘定', 721],
        [93001, 2, 'RECOVERABLE_TAX', 1501, 24000, 0, '仮払消費税10%', 722],
        [93001, 3, 'LIABILITY', 2101, 0, 264000, '買掛金（増設費）', 723],
        [93002, 1, 'LIABILITY', 2101, 264000, 0, '買掛金支払消込', 724],
        [93002, 2, 'CASH', 1001, 0, 264000, '普通預金出金', 725],
        [93003, 1, 'ASSET_COST', 1610, 240000, 0, '機械装置・資本的支出加算', 726],
        [93003, 2, 'ASSET_CLEARING', 1690, 0, 240000, '固定資産仮勘定消込', 727],
        [93004, 1, 'ASSET_COST', 1611, 1740000, 0, '製造2課へ原価受入', 728],
        [93004, 2, 'ASSET_COST', 1610, 0, 1740000, '製造1課から原価払出', 729],
        [93004, 3, 'DEPRN_RESERVE', 1619, 300000, 0, '製造1課・累計額減少', 730],
        [93004, 4, 'DEPRN_RESERVE', 1620, 0, 300000, '製造2課・累計額引継', 731],
        [93005, 1, 'DEPRN_EXPENSE', 5302, 30000, 0, '再計算償却費（製造2課）', 732],
        [93005, 2, 'DEPRN_RESERVE', 1620, 0, 30000, '累計額増加（製造2課）', 733]
      ];
      state.XLA_AE_LINES = aeRaw.map(([hid, ln, cls, ccid, dr, cr, desc, lid]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat, ACCOUNT_NAME: CCID_LIST[ccid].name,
        ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: lid
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 93001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10201, REF_AE_HEADER_ID: 93001 },
        { AE_HEADER_ID: 93002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_HIST', SOURCE_DISTRIBUTION_ID_NUM_1: 70201, REF_AE_HEADER_ID: 93002 },
        { AE_HEADER_ID: 93003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FA_ADJUSTMENTS', SOURCE_DISTRIBUTION_ID_NUM_1: 82001, REF_AE_HEADER_ID: 93003 },
        { AE_HEADER_ID: 93004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FA_ADJUSTMENTS', SOURCE_DISTRIBUTION_ID_NUM_1: 82003, REF_AE_HEADER_ID: 93004 },
        { AE_HEADER_ID: 93005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FA_DEPRN_DETAIL', SOURCE_DISTRIBUTION_ID_NUM_1: 72002, REF_AE_HEADER_ID: 93005 }
      ];
    }
    if (stepIndex >= 6) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6101, LINE_NO: idx + 1, STATUS: 'PROCESSED',
        USER_JE_SOURCE_NAME: l.AE_HEADER_ID <= 93002 ? 'Payables' : 'Assets',
        USER_JE_CATEGORY_NAME: state.XLA_AE_HEADERS.find(h => h.AE_HEADER_ID === l.AE_HEADER_ID).JE_CATEGORY_NAME,
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [{ JE_BATCH_ID: 55101, NAME: 'FA_ADJUST_TRANSFER_202705', STATUS: 'P', DEFAULT_PERIOD_NAME: '2027-05', RUNNING_TOTAL_ACCOUNTED_DR: 2838000, RUNNING_TOTAL_ACCOUNTED_CR: 2838000 }];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66101, JE_BATCH_ID: 55101, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Capex Invoice & Pay', PERIOD_NAME: '2027-05', STATUS: 'P', RUNNING_TOTAL_DR: 528000, RUNNING_TOTAL_CR: 528000 },
        { JE_HEADER_ID: 66102, JE_BATCH_ID: 55101, LEDGER_ID: 2001, JE_SOURCE: 'Assets', JE_CATEGORY: 'Adjustment & Transfer', PERIOD_NAME: '2027-05', STATUS: 'P', RUNNING_TOTAL_DR: 2280000, RUNNING_TOTAL_CR: 2280000 },
        { JE_HEADER_ID: 66103, JE_BATCH_ID: 55101, LEDGER_ID: 2001, JE_SOURCE: 'Assets', JE_CATEGORY: 'Depreciation', PERIOD_NAME: '2027-05', STATUS: 'P', RUNNING_TOTAL_DR: 30000, RUNNING_TOTAL_CR: 30000 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const jhid = l.AE_HEADER_ID <= 93002 ? 66101 : (l.AE_HEADER_ID <= 93004 ? 66102 : 66103);
        const lno = l.AE_LINE_NUM + (l.AE_HEADER_ID % 10) * 10;
        return buildJournalRow(jhid, lno, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, '2027-05', l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({ JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL' }));
      state.GL_BALANCES = computeBalancesWithOpening(opening, state.GL_JE_LINES, '2027-05');
    }

  // ==========================================================
  // CASE 3: FA_RETIREMENT
  // ==========================================================
  } else if (caseId === 'FA_RETIREMENT') {
    const reqRetire = stepIndex >= 2;
    const processedRetire = stepIndex >= 3;
    const opening = [[1610, 1500000, 0], [1619, 0, 900000], [3101, 0, 600000]];

    state.FA_ADDITIONS_B = [{ ASSET_ID: 100001, ASSET_NUMBER: 'AST-2026-0001', ASSET_TYPE: 'CAPITALIZED', ASSET_CATEGORY_ID: 301, ASSET_KEY_CCID: 801, CURRENT_UNITS: processedRetire ? 0 : 1 }];
    state.FA_ADDITIONS_TL = [{ ASSET_ID: 100001, LANGUAGE: 'JA', DESCRIPTION: '精密検査装置（レーザー式）' }];
    state.FA_ASSET_INVOICES = [
      { ASSET_INVOICE_ID: 61001, ASSET_ID: 100001, INVOICE_ID: 10001, INVOICE_NUMBER: 'AP-FA-2026-001', INVOICE_DISTRIBUTION_ID: 10101, PO_VENDOR_ID: 5001, FIXED_ASSETS_COST: 1500000, DATE_INEFFECTIVE: null }
    ];
    state.FA_BOOKS = [{
      BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, TRANSACTION_HEADER_ID_IN: 40001, TRANSACTION_HEADER_ID_OUT: processedRetire ? 40004 : null,
      DATE_PLACED_IN_SERVICE: '2026-05-15', DATE_EFFECTIVE: '2026-05-15', DATE_INEFFECTIVE: processedRetire ? '2029-05-15' : null,
      DEPRN_START_DATE: '2026-05-01', DEPRN_METHOD_CODE: 'STL', LIFE_IN_MONTHS: 60,
      COST: 1500000, ORIGINAL_COST: 1500000, ADJUSTED_COST: 1500000, RECOVERABLE_COST: 1500000, SALVAGE_VALUE: 0,
      PRORATE_CONVENTION_CODE: 'SAME_MONTH', PRORATE_DATE: '2026-05-01', DEPRECIATE_FLAG: 'YES', PERIOD_COUNTER_FULLY_RETIRED: null
    }];
    state.FA_DISTRIBUTION_HISTORY = [{
      DISTRIBUTION_ID: 72001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, UNITS_ASSIGNED: 1,
      CODE_COMBINATION_ID: 5301, LOCATION_ID: 701, TRANSACTION_HEADER_ID_IN: 40001, TRANSACTION_HEADER_ID_OUT: processedRetire ? 40004 : null,
      DATE_INEFFECTIVE: processedRetire ? '2029-05-15' : null
    }];
    state.FA_TRANSACTION_HEADERS = [
      { TRANSACTION_HEADER_ID: 40001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, TRANSACTION_TYPE_CODE: 'ADDITION', TRANSACTION_DATE_ENTERED: '2026-05-15', DATE_EFFECTIVE: '2026-05-15' }
    ];
    state.FA_DEPRN_SUMMARY = [
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, PERIOD_COUNTER: 24352, DEPRN_SOURCE_CODE: 'DEPRN', DEPRN_AMOUNT: 25000, YTD_DEPRN: 25000, DEPRN_RESERVE: 900000, ADJUSTED_COST: 1500000 }
    ];
    state.FA_DEPRN_DETAIL = [
      { BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, PERIOD_COUNTER: 24352, DEPRN_SOURCE_CODE: 'D', DEPRN_AMOUNT: 25000, YTD_DEPRN: 25000, DEPRN_RESERVE: 900000 }
    ];
    if (stepIndex === 0) {
      state.GL_BALANCES = computeBalancesWithOpening(opening, [], '2029-05 (期首)');
    }

    if (stepIndex >= 1) {
      const apAcc = stepIndex >= 5;
      state.AP_INVOICES_ALL = [{
        INVOICE_ID: 10003, INVOICE_NUM: 'AP-FA-RET-003', VENDOR_ID: 5002, VENDOR_SITE_ID: 5102, ORG_ID: 300001,
        INVOICE_DATE: '2029-05-10', INVOICE_CURRENCY_CODE: 'JPY', INVOICE_AMOUNT: 55000, AMOUNT_PAID: 55000, VALIDATION_STATUS: 'VALIDATED', PAYMENT_STATUS_FLAG: 'Y'
      }];
      state.AP_INVOICE_LINES_ALL = [
        { INVOICE_ID: 10003, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: '装置解体・撤去工事費', AMOUNT: 50000, ASSETS_TRACKING_FLAG: 'N', ASSET_BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: null, DEFAULT_DIST_CCID: 1695 },
        { INVOICE_ID: 10003, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税10%', AMOUNT: 5000, ASSETS_TRACKING_FLAG: 'N', ASSET_BOOK_TYPE_CODE: null, ASSET_CATEGORY_ID: null, DEFAULT_DIST_CCID: 1501 }
      ];
      state.ZX_LINES = [{ TAX_LINE_ID: 20301, TRX_ID: 10003, TRX_LINE_ID: 1, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAXABLE_AMT: 50000, TAX_AMT: 5000 }];
      state.AP_INVOICE_DISTRIBUTIONS_ALL = [
        { INVOICE_DISTRIBUTION_ID: 10301, INVOICE_ID: 10003, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 1695, AMOUNT: 50000, ASSETS_TRACKING_FLAG: 'N', ASSETS_ADDITION_FLAG: 'N', ASSET_BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_CATEGORY_ID: null, ACCOUNTING_EVENT_ID: apAcc ? 94001 : null, POSTED_FLAG: apAcc ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10302, INVOICE_ID: 10003, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1501, AMOUNT: 5000, ASSETS_TRACKING_FLAG: 'N', ASSETS_ADDITION_FLAG: 'N', ASSET_BOOK_TYPE_CODE: null, ASSET_CATEGORY_ID: null, ACCOUNTING_EVENT_ID: apAcc ? 94001 : null, POSTED_FLAG: apAcc ? 'Y' : 'N' }
      ];
      state.AP_PAYMENT_SCHEDULES_ALL = [{ INVOICE_ID: 10003, PAYMENT_NUM: 1, DUE_DATE: '2029-06-10', GROSS_AMOUNT: 55000, AMOUNT_REMAINING: 0, PAYMENT_STATUS_FLAG: 'Y' }];
      state.IBY_DOCS_PAYABLE_ALL = [{ DOCUMENT_PAYABLE_ID: 95301, CALLING_APP_DOC_UNIQUE_REF1: 10003, PAYMENT_ID: 91301, PAYMENT_AMOUNT: 55000, DOCUMENT_STATUS: 'PAYMENT_CREATED' }];
      state.IBY_PAYMENTS_ALL = [{ PAYMENT_ID: 91301, INTERNAL_BANK_ACCOUNT_ID: 8001, PAYMENT_METHOD_CODE: 'ELECTRONIC', PAYMENT_AMOUNT: 55000, PAYMENT_DATE: '2029-05-10', PAYMENT_STATUS: 'ISSUED' }];
      state.AP_CHECKS_ALL = [{ CHECK_ID: 88301, CHECK_NUMBER: 88301, VENDOR_ID: 5002, CE_BANK_ACCT_USE_ID: 7001, PAYMENT_ID: 91301, CHECK_DATE: '2029-05-10', AMOUNT: 55000, STATUS_LOOKUP_CODE: 'CLEARED' }];
      state.AP_INVOICE_PAYMENTS_ALL = [{ INVOICE_PAYMENT_ID: 77301, INVOICE_ID: 10003, CHECK_ID: 88301, AMOUNT: 55000, ACCOUNTING_EVENT_ID: apAcc ? 94002 : null, POSTED_FLAG: apAcc ? 'Y' : 'N' }];
      state.AP_PAYMENT_HISTORY_ALL = [{ PAYMENT_HISTORY_ID: 70301, CHECK_ID: 88301, TRANSACTION_TYPE: 'PAYMENT CLEARING', TRANSACTION_DATE: '2029-05-10', TRANSACTION_AMOUNT: 55000, ACCOUNTING_EVENT_ID: apAcc ? 94002 : null, POSTED_FLAG: apAcc ? 'Y' : 'N' }];
    }
    if (reqRetire) {
      state.FA_TRANSACTION_HEADERS.push({
        TRANSACTION_HEADER_ID: 40004, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001,
        TRANSACTION_TYPE_CODE: 'FULL RETIREMENT', TRANSACTION_DATE_ENTERED: '2029-05-15', DATE_EFFECTIVE: '2029-05-15'
      });
      state.FA_RETIREMENTS = [{
        RETIREMENT_ID: 85001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, TRANSACTION_HEADER_ID_IN: 40004,
        DATE_RETIRED: '2029-05-15', DATE_EFFECTIVE: '2029-05-15', UNITS: 1, RETIREMENT_TYPE_CODE: 'SALE',
        COST_RETIRED: 1500000, PROCEEDS_OF_SALE: 200000, COST_OF_REMOVAL: 50000,
        NBV_RETIRED: processedRetire ? 600000 : null,
        GAIN_LOSS_AMOUNT: processedRetire ? -450000 : null,
        STATUS: processedRetire ? 'PROCESSED' : 'PENDING'
      }];
    }
    if (processedRetire) {
      state.FA_BOOKS.push({
        BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, TRANSACTION_HEADER_ID_IN: 40004, TRANSACTION_HEADER_ID_OUT: null,
        DATE_PLACED_IN_SERVICE: '2026-05-15', DATE_EFFECTIVE: '2029-05-15', DATE_INEFFECTIVE: null,
        DEPRN_START_DATE: '2026-05-01', DEPRN_METHOD_CODE: 'STL', LIFE_IN_MONTHS: 60,
        COST: 0, ORIGINAL_COST: 1500000, ADJUSTED_COST: 0, RECOVERABLE_COST: 0, SALVAGE_VALUE: 0,
        PRORATE_CONVENTION_CODE: 'SAME_MONTH', PRORATE_DATE: '2026-05-01', DEPRECIATE_FLAG: 'NO', PERIOD_COUNTER_FULLY_RETIRED: 24353
      });
      state.FA_ADJUSTMENTS = [
        { ADJUSTMENT_LINE_ID: 83001, TRANSACTION_HEADER_ID: 40004, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'RETIREMENT', ADJUSTMENT_TYPE: 'RESERVE', DEBIT_CREDIT_FLAG: 'DR', CODE_COMBINATION_ID: 1619, ADJUSTMENT_AMOUNT: 900000, PERIOD_COUNTER_CREATED: 24353 },
        { ADJUSTMENT_LINE_ID: 83002, TRANSACTION_HEADER_ID: 40004, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'RETIREMENT', ADJUSTMENT_TYPE: 'PROCEEDS CLR', DEBIT_CREDIT_FLAG: 'DR', CODE_COMBINATION_ID: 1694, ADJUSTMENT_AMOUNT: 200000, PERIOD_COUNTER_CREATED: 24353 },
        { ADJUSTMENT_LINE_ID: 83003, TRANSACTION_HEADER_ID: 40004, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'RETIREMENT', ADJUSTMENT_TYPE: 'NBV RETIRED', DEBIT_CREDIT_FLAG: 'DR', CODE_COMBINATION_ID: 6201, ADJUSTMENT_AMOUNT: 450000, PERIOD_COUNTER_CREATED: 24353 },
        { ADJUSTMENT_LINE_ID: 83004, TRANSACTION_HEADER_ID: 40004, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'RETIREMENT', ADJUSTMENT_TYPE: 'COST', DEBIT_CREDIT_FLAG: 'CR', CODE_COMBINATION_ID: 1610, ADJUSTMENT_AMOUNT: 1500000, PERIOD_COUNTER_CREATED: 24353 },
        { ADJUSTMENT_LINE_ID: 83005, TRANSACTION_HEADER_ID: 40004, BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, SOURCE_TYPE_CODE: 'RETIREMENT', ADJUSTMENT_TYPE: 'REMOVALCOST CLR', DEBIT_CREDIT_FLAG: 'CR', CODE_COMBINATION_ID: 1695, ADJUSTMENT_AMOUNT: 50000, PERIOD_COUNTER_CREATED: 24353 }
      ];
    }
    if (stepIndex >= 4) {
      state.FA_DEPRN_SUMMARY.push({ BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, PERIOD_COUNTER: 24353, DEPRN_SOURCE_CODE: 'DEPRN', DEPRN_AMOUNT: 0, YTD_DEPRN: 25000, DEPRN_RESERVE: 0, ADJUSTED_COST: 0 });
      state.FA_DEPRN_DETAIL.push({ BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 100001, DISTRIBUTION_ID: 72001, PERIOD_COUNTER: 24353, DEPRN_SOURCE_CODE: 'D', DEPRN_AMOUNT: 0, YTD_DEPRN: 25000, DEPRN_RESERVE: 0 });
    }
    if (stepIndex >= 5) {
      const glSt = stepIndex >= 6 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 84001, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_INVOICES', TRANSACTION_NUMBER: 'AP-FA-RET-003', SOURCE_ID_INT_1: 10003 },
        { ENTITY_ID: 84002, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_PAYMENTS', TRANSACTION_NUMBER: 'CHK-88301', SOURCE_ID_INT_1: 88301 },
        { ENTITY_ID: 84003, APPLICATION_ID: 140, LEDGER_ID: 2001, ENTITY_CODE: 'TRANSACTIONS', TRANSACTION_NUMBER: 'FA-TXN-40004', SOURCE_ID_INT_1: 40004 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 94001, ENTITY_ID: 84001, EVENT_TYPE_CODE: 'INVOICE_VALIDATED', EVENT_DATE: '2029-05-10', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94002, ENTITY_ID: 84002, EVENT_TYPE_CODE: 'PAYMENT_CLEARED', EVENT_DATE: '2029-05-10', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94003, ENTITY_ID: 84003, EVENT_TYPE_CODE: 'RETIREMENTS', EVENT_DATE: '2029-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 95001, APPLICATION_ID: 200, EVENT_ID: 94001, LEDGER_ID: 2001, ACCOUNTING_DATE: '2029-05-10', JE_CATEGORY_NAME: 'Purchase Invoices', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 95002, APPLICATION_ID: 200, EVENT_ID: 94002, LEDGER_ID: 2001, ACCOUNTING_DATE: '2029-05-10', JE_CATEGORY_NAME: 'Payments', GL_TRANSFER_STATUS_CODE: glSt },
        { AE_HEADER_ID: 95003, APPLICATION_ID: 140, EVENT_ID: 94003, LEDGER_ID: 2001, ACCOUNTING_DATE: '2029-05-15', JE_CATEGORY_NAME: 'Retirement', GL_TRANSFER_STATUS_CODE: glSt }
      ];
      const aeRaw = [
        [95001, 1, 'REMOVAL_CLEARING', 1695, 50000, 0, '除却撤去費用仮勘定', 741],
        [95001, 2, 'RECOVERABLE_TAX', 1501, 5000, 0, '仮払消費税10%', 742],
        [95001, 3, 'LIABILITY', 2101, 0, 55000, '買掛金計上（撤去費）', 743],
        [95002, 1, 'LIABILITY', 2101, 55000, 0, '買掛金支払消込', 744],
        [95002, 2, 'CASH', 1001, 0, 55000, '普通預金出金', 745],
        [95003, 1, 'DEPRN_RESERVE', 1619, 900000, 0, '減価償却累計額消去', 746],
        [95003, 2, 'PROCEEDS_CLR', 1694, 200000, 0, '固定資産売却未収入金', 747],
        [95003, 3, 'GAIN_LOSS', 6201, 450000, 0, '固定資産除却・売却損（NBV60万-売却20万+撤去5万）', 748],
        [95003, 4, 'ASSET_COST', 1610, 0, 1500000, '機械装置・取得原価消去', 749],
        [95003, 5, 'REMOVAL_CLR', 1695, 0, 50000, '除却撤去費用仮勘定消込', 750]
      ];
      state.XLA_AE_LINES = aeRaw.map(([hid, ln, cls, ccid, dr, cr, desc, lid]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat, ACCOUNT_NAME: CCID_LIST[ccid].name,
        ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: lid
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 95001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10301, REF_AE_HEADER_ID: 95001 },
        { AE_HEADER_ID: 95002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_HIST', SOURCE_DISTRIBUTION_ID_NUM_1: 70301, REF_AE_HEADER_ID: 95002 },
        { AE_HEADER_ID: 95003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FA_ADJUSTMENTS', SOURCE_DISTRIBUTION_ID_NUM_1: 83001, REF_AE_HEADER_ID: 95003 }
      ];
    }
    if (stepIndex >= 6) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6201, LINE_NO: idx + 1, STATUS: 'PROCESSED',
        USER_JE_SOURCE_NAME: l.AE_HEADER_ID <= 95002 ? 'Payables' : 'Assets',
        USER_JE_CATEGORY_NAME: state.XLA_AE_HEADERS.find(h => h.AE_HEADER_ID === l.AE_HEADER_ID).JE_CATEGORY_NAME,
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [{ JE_BATCH_ID: 55201, NAME: 'FA_RETIREMENT_202905', STATUS: 'P', DEFAULT_PERIOD_NAME: '2029-05', RUNNING_TOTAL_ACCOUNTED_DR: 1660000, RUNNING_TOTAL_ACCOUNTED_CR: 1660000 }];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66201, JE_BATCH_ID: 55201, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Removal Cost AP', PERIOD_NAME: '2029-05', STATUS: 'P', RUNNING_TOTAL_DR: 110000, RUNNING_TOTAL_CR: 110000 },
        { JE_HEADER_ID: 66202, JE_BATCH_ID: 55201, LEDGER_ID: 2001, JE_SOURCE: 'Assets', JE_CATEGORY: 'Retirement', PERIOD_NAME: '2029-05', STATUS: 'P', RUNNING_TOTAL_DR: 1550000, RUNNING_TOTAL_CR: 1550000 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const jhid = l.AE_HEADER_ID <= 95002 ? 66201 : 66202;
        const lno = l.AE_LINE_NUM + (l.AE_HEADER_ID % 10) * 10;
        return buildJournalRow(jhid, lno, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, '2029-05', l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({ JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL' }));
      state.GL_BALANCES = computeBalancesWithOpening(opening, state.GL_JE_LINES, '2029-05');
    }
  }

  return { state };
}

const FusionFA = {
  AFF_SEGMENTS,
  CCID_LIST,
  DOMAINS,
  TABLES,
  RELATIONS,
  CASES,
  computeStateAtStep
};

if (typeof window !== 'undefined') {
  window.FusionFA = FusionFA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FusionFA;
}
