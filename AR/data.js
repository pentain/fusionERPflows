// Oracle Fusion ERP Financials 26D (OEDMF) 完全準拠データ定義
// ARトランザクション計上 → 入金 → 消込 → SLA会計作成 → GL転送・転記
// AFF 9セグメント体系: 会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3

const AFF_SEGMENTS = [
  { seg: 'SEGMENT1', name: '会社', sample: '01', desc: 'フュージョン株式会社 (プライマリ貸借一致セグメント)' },
  { seg: 'SEGMENT2', name: '部門', sample: '1100 / 9000 / 0000', desc: '1100:第一営業部 / 9000:財務経理部 / 0000:共通部門' },
  { seg: 'SEGMENT3', name: '勘定科目', sample: '1110 / 1210 / 2150 / 2180 / 4110', desc: '1110:普通預金 / 1210:売掛金 / 2150:仮受金 / 2180:仮受消費税 / 4110:売上高' },
  { seg: 'SEGMENT4', name: '補助科目', sample: '000 / 001 / 010 / 008 / 100 / 200', desc: '001:みずほ銀行 / 010:消費税10% / 008:消費税8% / 100:標準売上 / 200:軽減売上' },
  { seg: 'SEGMENT5', name: '税コード', sample: '00 / T10 / T08', desc: '00:対象外 / T10:課税売上10% / T08:課税売上8%(軽減)' },
  { seg: 'SEGMENT6', name: '管理コード', sample: 'PJ001 / 00000', desc: 'PJ001:基幹案件 / 00000:共通' },
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
    CODE_COMBINATION_ID: 3001,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'A',
    ACCOUNT_TYPE_JP: '資産 (Asset)',
    NAME: '売掛金（第一営業部・PJ001）',
    SEGMENT1: '01', SEGMENT2: '1100', SEGMENT3: '1210', SEGMENT4: '000', SEGMENT5: '00', SEGMENT6: 'PJ001', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-1100-1210-000-00-PJ001-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 2009,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'L',
    ACCOUNT_TYPE_JP: '負債 (Liability)',
    NAME: '仮受金（未消込入金 UNAPP）',
    SEGMENT1: '01', SEGMENT2: '9000', SEGMENT3: '2150', SEGMENT4: '000', SEGMENT5: '00', SEGMENT6: '00000', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-9000-2150-000-00-00000-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 2001,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'L',
    ACCOUNT_TYPE_JP: '負債 (Liability)',
    NAME: '仮受消費税（標準税率10%）',
    SEGMENT1: '01', SEGMENT2: '0000', SEGMENT3: '2180', SEGMENT4: '010', SEGMENT5: 'T10', SEGMENT6: '00000', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-0000-2180-010-T10-00000-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 2002,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'L',
    ACCOUNT_TYPE_JP: '負債 (Liability)',
    NAME: '仮受消費税（軽減税率8%）',
    SEGMENT1: '01', SEGMENT2: '0000', SEGMENT3: '2180', SEGMENT4: '008', SEGMENT5: 'T08', SEGMENT6: '00000', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-0000-2180-008-T08-00000-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 4001,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'R',
    ACCOUNT_TYPE_JP: '収益 (Revenue)',
    NAME: '売上高（明細1: 標準税率10%対象）',
    SEGMENT1: '01', SEGMENT2: '1100', SEGMENT3: '4110', SEGMENT4: '100', SEGMENT5: 'T10', SEGMENT6: 'PJ001', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-1100-4110-100-T10-PJ001-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  },
  {
    CODE_COMBINATION_ID: 4002,
    CHART_OF_ACCOUNTS_ID: 101,
    ACCOUNT_TYPE: 'R',
    ACCOUNT_TYPE_JP: '収益 (Revenue)',
    NAME: '売上高（明細2: 軽減税率8%対象）',
    SEGMENT1: '01', SEGMENT2: '1100', SEGMENT3: '4110', SEGMENT4: '200', SEGMENT5: 'T08', SEGMENT6: 'PJ001', SEGMENT7: '0000', SEGMENT8: '0000', SEGMENT9: '0000',
    CONCAT: '01-1100-4110-200-T08-PJ001-0000-0000-0000',
    ENABLED_FLAG: 'Y',
    DETAIL_POSTING_ALLOWED_FLAG: 'Y'
  }
];

const DOMAINS = [
  { id: 'ORG_GL_MASTER', name: 'A. 企業構造・元帳・期間・AFFマスタ', shortName: '組織 / 元帳 / AFF', color: '#475569', bg: '#f1f5f9', x: 20, y: 20, w: 340, h: 250 },
  { id: 'TCA_MASTER', name: 'B. 顧客マスタ (TCA)', shortName: '顧客マスタ (TCA)', color: '#0284c7', bg: '#e0f2fe', x: 20, y: 285, w: 340, h: 175 },
  { id: 'AR_TAX_CE_MASTER', name: 'C. AR・税金・銀行・入金マスタ', shortName: 'AR / 税 / 銀行マスタ', color: '#0d9488', bg: '#ccfbf1', x: 20, y: 475, w: 340, h: 385 },
  { id: 'AR_TRX_RECEIPT', name: 'D. AR請求・税金・入金・消込トランザクション', shortName: 'AR請求 / 税 / 入金 / 消込', color: '#2563eb', bg: '#dbeafe', x: 385, y: 20, w: 375, h: 840 },
  { id: 'SLA_XLA', name: 'E. SLA (Subledger Accounting) 補助元帳', shortName: 'SLA (補助元帳会計)', color: '#7c3aed', bg: '#ede9fe', x: 785, y: 20, w: 315, h: 840 },
  { id: 'GL_LEDGER', name: 'F. GL (General Ledger) 総勘定元帳', shortName: 'GL (総勘定元帳)', color: '#d97706', bg: '#fef3c7', x: 1125, y: 20, w: 315, h: 840 }
];

// 全42テーブルの完全メタデータ（26D OEDMF準拠）
const TABLES = [
  // === A. 企業構造・元帳・期間・AFFマスタ (6) ===
  {
    id: 'XLE_ENTITY_PROFILES', name: 'XLE_ENTITY_PROFILES', jpName: '法的エンティティ・プロファイル',
    domain: 'ORG_GL_MASTER', pk: ['LEGAL_ENTITY_ID'], fks: [],
    pos: { x: 35, y: 58, w: 150, h: 46 },
    description: '法的実体（会社）を定義するXLEマスタ。請求・入金の法的主体と税務報告単位を保持する。',
    columns: [
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'pk', desc: '法的エンティティID' },
      { name: 'NAME', type: 'VARCHAR2(240)', role: 'normal', desc: '法的エンティティ名' },
      { name: 'LEGAL_ENTITY_IDENTIFIER', type: 'VARCHAR2(30)', role: 'normal', desc: '法的識別子' },
      { name: 'TRANSACTING_ENTITY_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '取引エンティティフラグ' },
      { name: 'EFFECTIVE_FROM', type: 'DATE', role: 'normal', desc: '有効開始日' }
    ]
  },
  {
    id: 'GL_LEDGERS', name: 'GL_LEDGERS', jpName: '元帳マスタ',
    domain: 'ORG_GL_MASTER', pk: ['LEDGER_ID'], fks: ['CHART_OF_ACCOUNTS_ID'],
    pos: { x: 195, y: 58, w: 150, h: 46 },
    description: '会計通貨、カレンダ、勘定体系(COA)、SLA会計方式(発生主義等)を定義するGL元帳マスタ。',
    columns: [
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'pk', desc: '元帳ID' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: 'normal', desc: '元帳名称' },
      { name: 'SHORT_NAME', type: 'VARCHAR2(20)', role: 'normal', desc: '短縮名' },
      { name: 'LEDGER_CATEGORY_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '元帳カテゴリ (PRIMARY等)' },
      { name: 'CHART_OF_ACCOUNTS_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定体系ID (AFF構造)' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '機能通貨コード' },
      { name: 'PERIOD_SET_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計カレンダ名' },
      { name: 'ACCOUNTED_PERIOD_TYPE', type: 'VARCHAR2(15)', role: 'normal', desc: '会計期間タイプ' },
      { name: 'SLA_ACCOUNTING_METHOD_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'SLA補助元帳会計方式' }
    ]
  },
  {
    id: 'FUN_ALL_BUSINESS_UNITS_V', name: 'FUN_ALL_BUSINESS_UNITS_V', jpName: 'ビジネス・ユニット (BU) ビュー',
    domain: 'ORG_GL_MASTER', pk: ['BU_ID'], fks: ['LEGAL_ENTITY_ID', 'PRIMARY_LEDGER_ID'],
    pos: { x: 35, y: 114, w: 150, h: 46 },
    description: 'ARトランザクションや入金の処理組織単位 (ORG_ID = BU_ID) と元帳・法的エンティティ・参照データセットを紐付ける。',
    columns: [
      { name: 'BU_ID', type: 'NUMBER(18)', role: 'pk', desc: 'ビジネス・ユニットID (ORG_ID)' },
      { name: 'BU_NAME', type: 'VARCHAR2(240)', role: 'normal', desc: 'ビジネス・ユニット名' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' },
      { name: 'PRIMARY_LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: 'プライマリ元帳ID' },
      { name: 'DEFAULT_SET_ID', type: 'NUMBER(18)', role: 'fk', desc: 'デフォルト参照データセットID' },
      { name: 'DEFAULT_CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: 'デフォルト通貨' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (A=有効)' }
    ]
  },
  {
    id: 'GL_PERIOD_STATUSES', name: 'GL_PERIOD_STATUSES', jpName: '会計期間ステータス',
    domain: 'ORG_GL_MASTER', pk: ['APPLICATION_ID', 'LEDGER_ID', 'PERIOD_NAME'], fks: ['LEDGER_ID'],
    pos: { x: 195, y: 114, w: 150, h: 46 },
    description: 'AR (222) と GL (101) それぞれの会計期間オープン状態 (CLOSING_STATUS = O) を管理する。',
    columns: [
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'アプリケーションID (222:AR, 101:GL)' },
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
    id: 'FND_KF_STR_INSTANCES_B', name: 'FND_KF_STR_INSTANCES_B', jpName: 'キーフレックスフィールド構造インスタンス',
    domain: 'ORG_GL_MASTER', pk: ['STRUCTURE_INSTANCE_ID'], fks: [],
    pos: { x: 35, y: 170, w: 150, h: 46 },
    description: 'AFF (KEY_FLEXFIELD_CODE = GL#) の9セグメント構造インスタンス定義 (CHART_OF_ACCOUNTS_ID = 101 に対応)。',
    columns: [
      { name: 'STRUCTURE_INSTANCE_ID', type: 'NUMBER(18)', role: 'pk', desc: '構造インスタンスID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリケーションID (101)' },
      { name: 'KEY_FLEXFIELD_CODE', type: 'VARCHAR2(4)', role: 'normal', desc: 'KFFコード (GL#)' },
      { name: 'STRUCTURE_INSTANCE_NUMBER', type: 'NUMBER(18)', role: 'normal', desc: 'COA構造インスタンス番号' },
      { name: 'STRUCTURE_INSTANCE_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '構造インスタンスコード' },
      { name: 'STRUCTURE_ID', type: 'NUMBER(18)', role: 'fk', desc: '親構造ID' },
      { name: 'ENABLED_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '有効フラグ' }
    ]
  },
  {
    id: 'GL_CODE_COMBINATIONS', name: 'GL_CODE_COMBINATIONS', jpName: '勘定コード組合せ (AFF 9セグメント)',
    domain: 'ORG_GL_MASTER', pk: ['CODE_COMBINATION_ID'], fks: ['CHART_OF_ACCOUNTS_ID'],
    pos: { x: 195, y: 170, w: 150, h: 46 },
    description: '会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3 の9セグメント組合せ (CCID) マスタ。',
    columns: [
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'CCID (勘定コード組合せID)' },
      { name: 'CHART_OF_ACCOUNTS_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定体系ID (101)' },
      { name: 'ACCOUNT_TYPE', type: 'VARCHAR2(1)', role: 'flag', desc: '勘定タイプ (A:資産, L:負債, R:収益)' },
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

  // === B. 顧客マスタ (TCA) (4) ===
  {
    id: 'HZ_PARTIES', name: 'HZ_PARTIES', jpName: 'パーティマスタ (取引先実体)',
    domain: 'TCA_MASTER', pk: ['PARTY_ID'], fks: [],
    pos: { x: 35, y: 322, w: 150, h: 46 },
    description: 'TCAの最上位エンティティ。顧客企業の法人情報 (株式会社ジャパンコマース) を保持する。',
    columns: [
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'pk', desc: 'パーティID' },
      { name: 'PARTY_NUMBER', type: 'VARCHAR2(30)', role: 'normal', desc: 'パーティ番号' },
      { name: 'PARTY_NAME', type: 'VARCHAR2(360)', role: 'normal', desc: 'パーティ名' },
      { name: 'PARTY_TYPE', type: 'VARCHAR2(30)', role: 'normal', desc: 'パーティタイプ' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (A=有効)' }
    ]
  },
  {
    id: 'HZ_CUST_ACCOUNTS', name: 'HZ_CUST_ACCOUNTS', jpName: '顧客アカウントマスタ',
    domain: 'TCA_MASTER', pk: ['CUST_ACCOUNT_ID'], fks: ['PARTY_ID'],
    pos: { x: 195, y: 322, w: 150, h: 46 },
    description: 'パーティに紐付く顧客アカウント（債権・取引先口座）。BILL_TO_CUSTOMER_ID / PAY_FROM_CUSTOMER の参照先。',
    columns: [
      { name: 'CUST_ACCOUNT_ID', type: 'NUMBER(18)', role: 'pk', desc: '顧客アカウントID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティID' },
      { name: 'ACCOUNT_NUMBER', type: 'VARCHAR2(30)', role: 'normal', desc: '顧客番号' },
      { name: 'ACCOUNT_NAME', type: 'VARCHAR2(240)', role: 'normal', desc: 'アカウント名' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (A=有効)' },
      { name: 'CUSTOMER_TYPE', type: 'VARCHAR2(30)', role: 'flag', desc: '顧客タイプ (R=外部収益顧客)' }
    ]
  },
  {
    id: 'HZ_CUST_ACCT_SITES_ALL', name: 'HZ_CUST_ACCT_SITES_ALL', jpName: '顧客アカウントサイト',
    domain: 'TCA_MASTER', pk: ['CUST_ACCT_SITE_ID'], fks: ['CUST_ACCOUNT_ID'],
    pos: { x: 35, y: 382, w: 150, h: 46 },
    description: '顧客アカウントの拠点（住所・セット単位の請求/出荷サイト）を管理する。',
    columns: [
      { name: 'CUST_ACCT_SITE_ID', type: 'NUMBER(18)', role: 'pk', desc: '顧客アカウントサイトID' },
      { name: 'CUST_ACCOUNT_ID', type: 'NUMBER(18)', role: 'fk', desc: '顧客アカウントID' },
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'パーティサイトID' },
      { name: 'SET_ID', type: 'NUMBER(18)', role: 'fk', desc: '参照データセットID' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス' },
      { name: 'BILL_TO_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '請求先サイトフラグ (P=主)' },
      { name: 'SHIP_TO_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '出荷先サイトフラグ (P=主)' }
    ]
  },
  {
    id: 'HZ_CUST_SITE_USES_ALL', name: 'HZ_CUST_SITE_USES_ALL', jpName: '顧客サイト用途 (BILL_TO)',
    domain: 'TCA_MASTER', pk: ['SITE_USE_ID'], fks: ['CUST_ACCT_SITE_ID'],
    pos: { x: 195, y: 382, w: 150, h: 46 },
    description: '顧客サイトの業務用途 (BILL_TO / SHIP_TO等) を定義。請求先サイト用途ID (BILL_TO_SITE_USE_ID) の参照先。',
    columns: [
      { name: 'SITE_USE_ID', type: 'NUMBER(18)', role: 'pk', desc: 'サイト用途ID' },
      { name: 'CUST_ACCT_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: '顧客アカウントサイトID' },
      { name: 'SITE_USE_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '用途コード (BILL_TO)' },
      { name: 'PRIMARY_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'プライマリフラグ' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス' },
      { name: 'LOCATION', type: 'VARCHAR2(40)', role: 'normal', desc: 'ロケーションコード' },
      { name: 'SET_ID', type: 'NUMBER(18)', role: 'fk', desc: '参照データセットID' }
    ]
  },

  // === C. AR・税金・銀行・入金マスタ (12) ===
  {
    id: 'AR_SYSTEM_PARAMETERS_ALL', name: 'AR_SYSTEM_PARAMETERS_ALL', jpName: 'ARシステムオプション',
    domain: 'AR_TAX_CE_MASTER', pk: ['ORG_ID'], fks: ['SET_OF_BOOKS_ID'],
    pos: { x: 35, y: 512, w: 150, h: 46 },
    description: 'BU単位のAR基本設定（会計基準=ACCRUAL、消込ルール、使用元帳）を保持する。',
    columns: [
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'pk', desc: 'ビジネス・ユニットID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'ACCOUNTING_METHOD', type: 'VARCHAR2(30)', role: 'flag', desc: '会計基準 (ACCRUAL=発生主義)' },
      { name: 'DEFAULT_COUNTRY', type: 'VARCHAR2(60)', role: 'normal', desc: 'デフォルト国コード' },
      { name: 'PAYMENT_APPLICATION_RULE', type: 'VARCHAR2(1)', role: 'flag', desc: '消込配分ルール (H=ヘッダ)' }
    ]
  },
  {
    id: 'RA_BATCH_SOURCES_ALL', name: 'RA_BATCH_SOURCES_ALL', jpName: 'トランザクションソース',
    domain: 'AR_TAX_CE_MASTER', pk: ['BATCH_SOURCE_SEQ_ID'], fks: [],
    pos: { x: 195, y: 512, w: 150, h: 46 },
    description: '請求書の発番ルールや入力元（手動/自動インポート）を定義。26Dの主キーは BATCH_SOURCE_SEQ_ID。',
    columns: [
      { name: 'BATCH_SOURCE_SEQ_ID', type: 'NUMBER(18)', role: 'pk', desc: 'バッチソース連番ID' },
      { name: 'BATCH_SOURCE_ID', type: 'NUMBER(18)', role: 'normal', desc: 'バッチソースID' },
      { name: 'SET_ID', type: 'NUMBER(18)', role: 'fk', desc: '参照データセットID' },
      { name: 'NAME', type: 'VARCHAR2(50)', role: 'normal', desc: 'ソース名' },
      { name: 'BATCH_SOURCE_TYPE', type: 'VARCHAR2(10)', role: 'flag', desc: 'ソースタイプ (INV)' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス' },
      { name: 'AUTO_TRX_NUMBERING_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '自動採番フラグ' }
    ]
  },
  {
    id: 'RA_CUST_TRX_TYPES_ALL', name: 'RA_CUST_TRX_TYPES_ALL', jpName: 'トランザクションタイプ',
    domain: 'AR_TAX_CE_MASTER', pk: ['CUST_TRX_TYPE_SEQ_ID'], fks: ['GL_ID_REC', 'GL_ID_REV', 'GL_ID_TAX'],
    pos: { x: 35, y: 568, w: 150, h: 46 },
    description: '請求書種別(INV等)、税計算要否、GL転記可否、自動会計デフォルト勘定を定義。26D主キーは CUST_TRX_TYPE_SEQ_ID。',
    columns: [
      { name: 'CUST_TRX_TYPE_SEQ_ID', type: 'NUMBER(18)', role: 'pk', desc: '取引タイプ連番ID' },
      { name: 'CUST_TRX_TYPE_ID', type: 'NUMBER(18)', role: 'normal', desc: '取引タイプID' },
      { name: 'SET_ID', type: 'NUMBER(18)', role: 'fk', desc: '参照データセットID' },
      { name: 'NAME', type: 'VARCHAR2(20)', role: 'normal', desc: '取引タイプ名称' },
      { name: 'TYPE', type: 'VARCHAR2(20)', role: 'flag', desc: 'クラス (INV=請求書)' },
      { name: 'ACCOUNTING_AFFECT_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '未決済・会計影響フラグ' },
      { name: 'POST_TO_GL', type: 'VARCHAR2(1)', role: 'flag', desc: 'GL転記対象フラグ' },
      { name: 'TAX_CALCULATION_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '税計算フラグ' },
      { name: 'GL_ID_REC', type: 'NUMBER(18)', role: 'fk', desc: '売掛金CCID (3001)' },
      { name: 'GL_ID_REV', type: 'NUMBER(18)', role: 'fk', desc: '標準売上CCID (4001)' },
      { name: 'GL_ID_TAX', type: 'NUMBER(18)', role: 'fk', desc: '標準税CCID (2001)' }
    ]
  },
  {
    id: 'RA_TERMS_B', name: 'RA_TERMS_B', jpName: '支払条件ヘッダ',
    domain: 'AR_TAX_CE_MASTER', pk: ['TERM_ID'], fks: [],
    pos: { x: 195, y: 568, w: 150, h: 46 },
    description: '請求書の支払期日・分割ルール計算のための支払条件ヘッダ。',
    columns: [
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払条件ID' },
      { name: 'SET_ID', type: 'NUMBER(18)', role: 'fk', desc: '参照データセットID' },
      { name: 'BILLING_CYCLE_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求サイクルID' },
      { name: 'PRINTING_LEAD_DAYS', type: 'NUMBER(15)', role: 'normal', desc: '印刷リード日数' },
      { name: 'START_DATE_ACTIVE', type: 'DATE', role: 'normal', desc: '有効開始日' }
    ]
  },
  {
    id: 'RA_TERMS_LINES', name: 'RA_TERMS_LINES', jpName: '支払条件明細',
    domain: 'AR_TAX_CE_MASTER', pk: ['TERM_ID', 'SEQUENCE_NUM'], fks: ['TERM_ID'],
    pos: { x: 35, y: 624, w: 150, h: 46 },
    description: '支払条件の分割割合と期日日数 (DUE_DAYS = 30 → 請求日+30日で支払予定 DUE_DATE を算出)。',
    columns: [
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払条件ID' },
      { name: 'SEQUENCE_NUM', type: 'NUMBER(15)', role: 'pk', desc: '分割順番' },
      { name: 'RELATIVE_AMOUNT', type: 'NUMBER', role: 'normal', desc: '相対金額割合 (100)' },
      { name: 'DUE_DAYS', type: 'NUMBER(15)', role: 'normal', desc: '期日日数 (30日後)' }
    ]
  },
  {
    id: 'AR_MEMO_LINES_ALL_B', name: 'AR_MEMO_LINES_ALL_B', jpName: '標準メモ明細マスタ',
    domain: 'AR_TAX_CE_MASTER', pk: ['MEMO_LINE_SEQ_ID'], fks: ['GL_ID_REV'],
    pos: { x: 195, y: 624, w: 150, h: 46 },
    description: '明細1 (10%対象・売上CCID 4001) と明細2 (8%軽減対象・売上CCID 4002) の単価・収益勘定・税区分を定義。',
    columns: [
      { name: 'MEMO_LINE_SEQ_ID', type: 'NUMBER(18)', role: 'pk', desc: 'メモ明細連番ID' },
      { name: 'MEMO_LINE_ID', type: 'NUMBER(18)', role: 'normal', desc: 'メモ明細ID' },
      { name: 'SET_ID', type: 'NUMBER(18)', role: 'fk', desc: '参照データセットID' },
      { name: 'LINE_TYPE', type: 'VARCHAR2(30)', role: 'flag', desc: '明細タイプ (LINE)' },
      { name: 'UOM_CODE', type: 'VARCHAR2(3)', role: 'normal', desc: '単位コード' },
      { name: 'UNIT_STD_PRICE', type: 'NUMBER', role: 'amount', desc: '標準単価' },
      { name: 'GL_ID_REV', type: 'NUMBER(18)', role: 'fk', desc: '売上勘定CCID' },
      { name: 'TAX_PRODUCT_CATEGORY', type: 'VARCHAR2(240)', role: 'normal', desc: '税製品カテゴリ' }
    ]
  },
  {
    id: 'ZX_RATES_B', name: 'ZX_RATES_B', jpName: '税率マスタ (Fusion Tax)',
    domain: 'AR_TAX_CE_MASTER', pk: ['TAX_RATE_ID'], fks: [],
    pos: { x: 35, y: 680, w: 150, h: 46 },
    description: '消費税10% (JP_OUT_10 / 24010) と軽減消費税8% (JP_OUT_8 / 24008) の税率定義を保持する。',
    columns: [
      { name: 'TAX_RATE_ID', type: 'NUMBER(18)', role: 'pk', desc: '税率ID' },
      { name: 'TAX_REGIME_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税制度コード' },
      { name: 'TAX', type: 'VARCHAR2(30)', role: 'normal', desc: '税金コード' },
      { name: 'TAX_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '税ステータス (STANDARD/REDUCED)' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: 'normal', desc: '税率コード' },
      { name: 'PERCENTAGE_RATE', type: 'NUMBER', role: 'amount', desc: '税率 (%)' },
      { name: 'RATE_TYPE_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税率タイプ' },
      { name: 'EFFECTIVE_FROM', type: 'DATE', role: 'normal', desc: '有効開始日' },
      { name: 'ACTIVE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '有効フラグ' }
    ]
  },
  {
    id: 'AR_RECEIPT_CLASSES', name: 'AR_RECEIPT_CLASSES', jpName: '入金クラス',
    domain: 'AR_TAX_CE_MASTER', pk: ['RECEIPT_CLASS_ID'], fks: [],
    pos: { x: 195, y: 680, w: 150, h: 46 },
    description: '入金作成方法 (MANUAL) や確認・送金・決済フラグ (CLEAR_FLAG=N で作成時即CLEARED) を定義する。',
    columns: [
      { name: 'RECEIPT_CLASS_ID', type: 'NUMBER(18)', role: 'pk', desc: '入金クラスID' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: 'normal', desc: '入金クラス名' },
      { name: 'CREATION_METHOD_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '作成方法 (MANUAL)' },
      { name: 'CONFIRM_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '確認要否フラグ' },
      { name: 'REMIT_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '送金要否フラグ' },
      { name: 'CLEAR_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '決済要否フラグ (N=即時決済)' },
      { name: 'REMIT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '送金方法コード' }
    ]
  },
  {
    id: 'AR_RECEIPT_METHODS', name: 'AR_RECEIPT_METHODS', jpName: '入金方法マスタ',
    domain: 'AR_TAX_CE_MASTER', pk: ['RECEIPT_METHOD_ID'], fks: ['RECEIPT_CLASS_ID'],
    pos: { x: 35, y: 736, w: 150, h: 46 },
    description: '銀行振込などの入金方法と支払チャネルを定義。入金クラスおよび銀行口座勘定に紐付く。',
    columns: [
      { name: 'RECEIPT_METHOD_ID', type: 'NUMBER(18)', role: 'pk', desc: '入金方法ID' },
      { name: 'RECEIPT_CLASS_ID', type: 'NUMBER(18)', role: 'fk', desc: '入金クラスID' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: 'normal', desc: '入金方法名' },
      { name: 'PAYMENT_CHANNEL_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '支払チャネル' },
      { name: 'START_DATE', type: 'DATE', role: 'normal', desc: '有効開始日' }
    ]
  },
  {
    id: 'CE_BANK_ACCOUNTS', name: 'CE_BANK_ACCOUNTS', jpName: '銀行口座マスタ (CE)',
    domain: 'AR_TAX_CE_MASTER', pk: ['BANK_ACCOUNT_ID'], fks: ['ACCOUNT_OWNER_ORG_ID', 'ASSET_CODE_COMBINATION_ID'],
    pos: { x: 195, y: 736, w: 150, h: 46 },
    description: 'Cash Management上の自社銀行口座マスタ（みずほ銀行東京営業部・普通口座）と資産勘定を保持する。',
    columns: [
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'pk', desc: '銀行口座ID' },
      { name: 'BANK_ACCOUNT_NAME', type: 'VARCHAR2(100)', role: 'normal', desc: '銀行口座名' },
      { name: 'BANK_ACCOUNT_NUM', type: 'VARCHAR2(100)', role: 'normal', desc: '口座番号' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨コード' },
      { name: 'ACCOUNT_OWNER_ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: '所有者法的エンティティID' },
      { name: 'CASH_CLEARING_CCID', type: 'NUMBER(18)', role: 'fk', desc: '現金決済CCID' },
      { name: 'ASSET_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '現金資産CCID (1001)' }
    ]
  },
  {
    id: 'CE_BANK_ACCT_USES_ALL', name: 'CE_BANK_ACCT_USES_ALL', jpName: '銀行口座利用設定',
    domain: 'AR_TAX_CE_MASTER', pk: ['BANK_ACCT_USE_ID'], fks: ['BANK_ACCOUNT_ID', 'ORG_ID', 'LEGAL_ENTITY_ID'],
    pos: { x: 35, y: 792, w: 150, h: 46 },
    description: '銀行口座を特定のBU (ORG_ID) のAR入金送金口座として使用可能にする紐付けテーブル。',
    columns: [
      { name: 'BANK_ACCT_USE_ID', type: 'NUMBER(18)', role: 'pk', desc: '銀行口座利用ID' },
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'fk', desc: '銀行口座ID' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'ビジネス・ユニットID' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' },
      { name: 'AR_USE_ENABLE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'AR利用有効フラグ' },
      { name: 'AP_USE_ENABLE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'AP利用有効フラグ' },
      { name: 'PRIMARY_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: 'プライマリフラグ' }
    ]
  },
  {
    id: 'AR_RECEIPT_METHOD_ACCOUNTS_ALL', name: 'AR_RECEIPT_METHOD_ACCOUNTS_ALL', jpName: '入金方法別勘定マスタ',
    domain: 'AR_TAX_CE_MASTER', pk: ['RECEIPT_METHOD_ID', 'REMIT_BANK_ACCT_USE_ID'], fks: ['CASH_CCID', 'UNAPPLIED_CCID'],
    pos: { x: 195, y: 792, w: 150, h: 46 },
    description: '入金方法と銀行口座の組合せごとの現金勘定 (1001) および未消込仮受金勘定 (2009) を定義。',
    columns: [
      { name: 'RECEIPT_METHOD_ID', type: 'NUMBER(18)', role: 'pk', desc: '入金方法ID' },
      { name: 'REMIT_BANK_ACCT_USE_ID', type: 'NUMBER(18)', role: 'pk', desc: '銀行口座利用ID' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'ビジネス・ユニットID' },
      { name: 'CASH_CCID', type: 'NUMBER(18)', role: 'fk', desc: '現金・預金CCID (1001)' },
      { name: 'UNAPPLIED_CCID', type: 'NUMBER(18)', role: 'fk', desc: '未消込入金CCID (2009)' },
      { name: 'ON_ACCOUNT_CCID', type: 'NUMBER(18)', role: 'fk', desc: '仮払・前受CCID (2009)' },
      { name: 'UNIDENTIFIED_CCID', type: 'NUMBER(18)', role: 'fk', desc: '不明入金CCID (2009)' },
      { name: 'REMITTANCE_CCID', type: 'NUMBER(18)', role: 'fk', desc: '送金中CCID (1001)' }
    ]
  },

  // === D. AR請求・税金・入金・消込トランザクション (9) ===
  {
    id: 'RA_CUSTOMER_TRX_ALL', name: 'RA_CUSTOMER_TRX_ALL', jpName: 'ARトランザクションヘッダ',
    domain: 'AR_TRX_RECEIPT', pk: ['CUSTOMER_TRX_ID'], fks: ['CUST_TRX_TYPE_SEQ_ID', 'BATCH_SOURCE_SEQ_ID', 'BILL_TO_CUSTOMER_ID', 'BILL_TO_SITE_USE_ID', 'TERM_ID', 'ORG_ID', 'SET_OF_BOOKS_ID', 'LEGAL_ENTITY_ID'],
    pos: { x: 405, y: 65, w: 335, h: 58 },
    description: '請求書ヘッダ情報。作成時は COMPLETE_FLAG=N、請求完了処理で Y へ更新され債権が確定する。',
    columns: [
      { name: 'CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'pk', desc: '顧客トランザクションID' },
      { name: 'TRX_NUMBER', type: 'VARCHAR2(20)', role: 'normal', desc: '請求書番号' },
      { name: 'TRX_DATE', type: 'DATE', role: 'normal', desc: '請求日' },
      { name: 'CUST_TRX_TYPE_SEQ_ID', type: 'NUMBER(18)', role: 'fk', desc: '取引タイプ連番ID' },
      { name: 'BATCH_SOURCE_SEQ_ID', type: 'NUMBER(18)', role: 'fk', desc: 'バッチソース連番ID' },
      { name: 'BILL_TO_CUSTOMER_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求先顧客ID' },
      { name: 'BILL_TO_SITE_USE_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求先サイト用途ID' },
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払条件ID' },
      { name: 'INVOICE_CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '請求通貨' },
      { name: 'COMPLETE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '完了フラグ (N→Y)' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' }
    ]
  },
  {
    id: 'RA_CUSTOMER_TRX_LINES_ALL', name: 'RA_CUSTOMER_TRX_LINES_ALL', jpName: 'ARトランザクション明細',
    domain: 'AR_TRX_RECEIPT', pk: ['CUSTOMER_TRX_LINE_ID'], fks: ['CUSTOMER_TRX_ID', 'MEMO_LINE_SEQ_ID', 'LINK_TO_CUST_TRX_LINE_ID', 'TAX_LINE_ID'],
    pos: { x: 405, y: 145, w: 335, h: 60 },
    description: '品目行 (LINE_TYPE=LINE: 明細1=10万円, 明細2=5万円) と税行 (LINE_TYPE=TAX: 10%=1万円, 8%=4千円) の計4行を格納。',
    columns: [
      { name: 'CUSTOMER_TRX_LINE_ID', type: 'NUMBER(18)', role: 'pk', desc: 'トランザクション明細ID' },
      { name: 'CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: 'ヘッダID' },
      { name: 'LINE_NUMBER', type: 'NUMBER', role: 'normal', desc: '明細番号' },
      { name: 'LINE_TYPE', type: 'VARCHAR2(20)', role: 'flag', desc: '明細タイプ (LINE / TAX)' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(240)', role: 'normal', desc: '摘要・明細内容' },
      { name: 'MEMO_LINE_SEQ_ID', type: 'NUMBER(18)', role: 'fk', desc: '標準メモ明細連番ID' },
      { name: 'QUANTITY_INVOICED', type: 'NUMBER', role: 'normal', desc: '請求数量' },
      { name: 'UNIT_SELLING_PRICE', type: 'NUMBER', role: 'amount', desc: '販売単価' },
      { name: 'EXTENDED_AMOUNT', type: 'NUMBER', role: 'amount', desc: '明細金額' },
      { name: 'REVENUE_AMOUNT', type: 'NUMBER', role: 'amount', desc: '収益金額' },
      { name: 'TAX_CLASSIFICATION_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税分類コード' },
      { name: 'VAT_TAX_ID', type: 'NUMBER(18)', role: 'fk', desc: '税率ID参照' },
      { name: 'LINK_TO_CUST_TRX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: '親明細ID (TAX行のみ)' },
      { name: 'TAX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: 'ZX_LINES税明細ID' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' }
    ]
  },
  {
    id: 'ZX_LINES', name: 'ZX_LINES', jpName: '税計算明細 (Fusion Tax)',
    domain: 'AR_TRX_RECEIPT', pk: ['TAX_LINE_ID'], fks: ['TRX_ID', 'TRX_LINE_ID', 'TAX_RATE_ID'],
    pos: { x: 405, y: 225, w: 335, h: 56 },
    description: 'Fusion Taxエンジンが算出した詳細税額。TRX_ID=CUSTOMER_TRX_ID、TRX_LINE_ID=明細ID で請求明細と結合する。',
    columns: [
      { name: 'TAX_LINE_ID', type: 'NUMBER(18)', role: 'pk', desc: '税明細ID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (222=AR)' },
      { name: 'ENTITY_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'エンティティ (TRANSACTIONS)' },
      { name: 'EVENT_CLASS_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'イベントクラス (INVOICE)' },
      { name: 'TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ヘッダID' },
      { name: 'TRX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: '対象請求書明細ID' },
      { name: 'TRX_LEVEL_TYPE', type: 'VARCHAR2(30)', role: 'normal', desc: 'レベルタイプ (LINE)' },
      { name: 'TAX_LINE_NUMBER', type: 'NUMBER(15)', role: 'normal', desc: '税行番号' },
      { name: 'TAX_REGIME_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '税制度コード' },
      { name: 'TAX', type: 'VARCHAR2(30)', role: 'normal', desc: '税金コード' },
      { name: 'TAX_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '税ステータス' },
      { name: 'TAX_RATE_ID', type: 'NUMBER(18)', role: 'fk', desc: '税率ID' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: 'normal', desc: '税率コード' },
      { name: 'TAX_RATE', type: 'NUMBER', role: 'amount', desc: '適用税率 (%)' },
      { name: 'TAXABLE_AMT', type: 'NUMBER', role: 'amount', desc: '課税対象額' },
      { name: 'TAX_AMT', type: 'NUMBER', role: 'amount', desc: '算出税額' },
      { name: 'LINE_AMT', type: 'NUMBER', role: 'amount', desc: '明細金額' },
      { name: 'TRX_NUMBER', type: 'VARCHAR2(150)', role: 'normal', desc: '請求書番号' },
      { name: 'TRX_DATE', type: 'DATE', role: 'normal', desc: '請求日' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'INTERNAL_ORGANIZATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '内部組織ID (BU)' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' }
    ]
  },
  {
    id: 'RA_CUST_TRX_LINE_GL_DIST_ALL', name: 'RA_CUST_TRX_LINE_GL_DIST_ALL', jpName: 'ARトランザクション会計配賦',
    domain: 'AR_TRX_RECEIPT', pk: ['CUST_TRX_LINE_GL_DIST_ID'], fks: ['CUSTOMER_TRX_ID', 'CUSTOMER_TRX_LINE_ID', 'CODE_COMBINATION_ID', 'EVENT_ID'],
    pos: { x: 405, y: 300, w: 335, h: 60 },
    description: 'REC(売掛金164,000)、REV(売上100,000/50,000)、TAX(仮受消費税10,000/4,000)の5配賦行。完了時EVENT_ID付与、SLA会計時にPOSTING_CONTROL_ID更新。',
    columns: [
      { name: 'CUST_TRX_LINE_GL_DIST_ID', type: 'NUMBER(18)', role: 'pk', desc: 'AR配賦ID' },
      { name: 'CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ヘッダID' },
      { name: 'CUSTOMER_TRX_LINE_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書明細ID (RECはNULL)' },
      { name: 'ACCOUNT_CLASS', type: 'VARCHAR2(20)', role: 'flag', desc: '勘定クラス (REC/REV/TAX)' },
      { name: 'ACCOUNT_SET_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '勘定セットフラグ (Y→N)' },
      { name: 'AMOUNT', type: 'NUMBER', role: 'amount', desc: '取引通貨金額' },
      { name: 'ACCTD_AMOUNT', type: 'NUMBER', role: 'amount', desc: '機能通貨金額' },
      { name: 'PERCENT', type: 'NUMBER', role: 'normal', desc: '配賦率 (%)' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定コード組合せID' },
      { name: 'GL_DATE', type: 'DATE', role: 'normal', desc: 'GL計上日' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAイベントID (NULL→80001)' },
      { name: 'POSTING_CONTROL_ID', type: 'NUMBER(18)', role: 'flag', desc: '転記制御ID (-3→9001)' },
      { name: 'GL_POSTED_DATE', type: 'DATE', role: 'normal', desc: 'GL会計済日 (NULL→日付)' },
      { name: 'LATEST_REC_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '最新RECフラグ (NULL→Y)' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' }
    ]
  },
  {
    id: 'AR_PAYMENT_SCHEDULES_ALL', name: 'AR_PAYMENT_SCHEDULES_ALL', jpName: '支払予定・債権残高',
    domain: 'AR_TRX_RECEIPT', pk: ['PAYMENT_SCHEDULE_ID'], fks: ['CUSTOMER_ID', 'CUSTOMER_SITE_USE_ID', 'CUSTOMER_TRX_ID', 'CASH_RECEIPT_ID', 'TERM_ID'],
    pos: { x: 405, y: 380, w: 335, h: 62 },
    description: '請求書(CLASS=INV)と入金(CLASS=PMT)の未消込残高とステータス(OP→CL)を管理。消込で残高0・クローズ日更新。',
    columns: [
      { name: 'PAYMENT_SCHEDULE_ID', type: 'NUMBER(18)', role: 'pk', desc: '支払予定ID' },
      { name: 'TRX_NUMBER', type: 'VARCHAR2(30)', role: 'normal', desc: '取引番号 (請求/入金番号)' },
      { name: 'TRX_DATE', type: 'DATE', role: 'normal', desc: '取引日' },
      { name: 'GL_DATE', type: 'DATE', role: 'normal', desc: 'GL日付' },
      { name: 'GL_DATE_CLOSED', type: 'DATE', role: 'flag', desc: 'GLクローズ日 (4712-12-31→消込日)' },
      { name: 'ACTUAL_DATE_CLOSED', type: 'DATE', role: 'flag', desc: '実クローズ日 (4712-12-31→消込日)' },
      { name: 'CLASS', type: 'VARCHAR2(20)', role: 'flag', desc: 'クラス (INV=請求, PMT=入金)' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: 'flag', desc: 'ステータス (OP→CL)' },
      { name: 'CUSTOMER_ID', type: 'NUMBER(18)', role: 'fk', desc: '顧客ID' },
      { name: 'CUSTOMER_SITE_USE_ID', type: 'NUMBER(18)', role: 'fk', desc: '顧客サイト用途ID' },
      { name: 'CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '請求書ヘッダID' },
      { name: 'CASH_RECEIPT_ID', type: 'NUMBER(18)', role: 'fk', desc: '入金ID' },
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'fk', desc: '支払条件ID' },
      { name: 'TERMS_SEQUENCE_NUMBER', type: 'NUMBER(15)', role: 'normal', desc: '分割番号' },
      { name: 'DUE_DATE', type: 'DATE', role: 'normal', desc: '支払期日' },
      { name: 'INVOICE_CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨コード' },
      { name: 'AMOUNT_DUE_ORIGINAL', type: 'NUMBER', role: 'amount', desc: '当初請求額 / 入金額' },
      { name: 'AMOUNT_DUE_REMAINING', type: 'NUMBER', role: 'amount', desc: '未決済残高 (→0)' },
      { name: 'AMOUNT_LINE_ITEMS_ORIGINAL', type: 'NUMBER', role: 'amount', desc: '当初品目金額' },
      { name: 'AMOUNT_LINE_ITEMS_REMAINING', type: 'NUMBER', role: 'amount', desc: '残品目金額 (→0)' },
      { name: 'TAX_ORIGINAL', type: 'NUMBER', role: 'amount', desc: '当初消費税額' },
      { name: 'TAX_REMAINING', type: 'NUMBER', role: 'amount', desc: '残消費税額 (→0)' },
      { name: 'AMOUNT_APPLIED', type: 'NUMBER', role: 'amount', desc: '消込済金額 (0→164000)' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'AR_CASH_RECEIPTS_ALL', name: 'AR_CASH_RECEIPTS_ALL', jpName: '現金入金ヘッダ',
    domain: 'AR_TRX_RECEIPT', pk: ['CASH_RECEIPT_ID'], fks: ['PAY_FROM_CUSTOMER', 'CUSTOMER_SITE_USE_ID', 'RECEIPT_METHOD_ID', 'REMIT_BANK_ACCT_USE_ID'],
    pos: { x: 405, y: 465, w: 335, h: 58 },
    description: '入金の基本情報。登録時は未消込 (STATUS=UNAPP)、請求書への消込実行時に全額消込済 (STATUS=APP) になる。',
    columns: [
      { name: 'CASH_RECEIPT_ID', type: 'NUMBER(18)', role: 'pk', desc: '現金入金ID' },
      { name: 'RECEIPT_NUMBER', type: 'VARCHAR2(30)', role: 'normal', desc: '入金番号' },
      { name: 'RECEIPT_DATE', type: 'DATE', role: 'normal', desc: '入金日' },
      { name: 'AMOUNT', type: 'NUMBER', role: 'amount', desc: '入金額' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '入金通貨' },
      { name: 'TYPE', type: 'VARCHAR2(30)', role: 'flag', desc: '入金タイプ (CASH)' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: 'flag', desc: 'ステータス (UNAPP→APP)' },
      { name: 'PAY_FROM_CUSTOMER', type: 'NUMBER(18)', role: 'fk', desc: '入金元顧客ID' },
      { name: 'CUSTOMER_SITE_USE_ID', type: 'NUMBER(18)', role: 'fk', desc: '顧客サイト用途ID' },
      { name: 'RECEIPT_METHOD_ID', type: 'NUMBER(18)', role: 'fk', desc: '入金方法ID' },
      { name: 'REMIT_BANK_ACCT_USE_ID', type: 'NUMBER(18)', role: 'fk', desc: '自社入金銀行口座利用ID' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' }
    ]
  },
  {
    id: 'AR_CASH_RECEIPT_HISTORY_ALL', name: 'AR_CASH_RECEIPT_HISTORY_ALL', jpName: '入金ライフサイクル履歴',
    domain: 'AR_TRX_RECEIPT', pk: ['CASH_RECEIPT_HISTORY_ID'], fks: ['CASH_RECEIPT_ID', 'ACCOUNT_CODE_COMBINATION_ID', 'EVENT_ID'],
    pos: { x: 405, y: 545, w: 335, h: 58 },
    description: '入金の決済ステータス遷移 (CLEARED等) と銀行勘定 (1001) の計上履歴を保持。AR_DISTRIBUTIONS_ALL (CRH) の親。',
    columns: [
      { name: 'CASH_RECEIPT_HISTORY_ID', type: 'NUMBER(18)', role: 'pk', desc: '入金履歴ID' },
      { name: 'CASH_RECEIPT_ID', type: 'NUMBER(18)', role: 'fk', desc: '現金入金ID' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: 'flag', desc: '履歴ステータス (CLEARED)' },
      { name: 'TRX_DATE', type: 'DATE', role: 'normal', desc: '取引日' },
      { name: 'GL_DATE', type: 'DATE', role: 'normal', desc: 'GL日付' },
      { name: 'AMOUNT', type: 'NUMBER', role: 'amount', desc: '入金額' },
      { name: 'ACCTD_AMOUNT', type: 'NUMBER', role: 'amount', desc: '機能通貨換算額' },
      { name: 'ACCOUNT_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '銀行資産CCID (1001)' },
      { name: 'CURRENT_RECORD_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '現行レコードフラグ' },
      { name: 'POSTABLE_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '転記対象フラグ' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAイベントID (80002)' },
      { name: 'POSTING_CONTROL_ID', type: 'NUMBER(18)', role: 'flag', desc: '転記制御ID (-3→9001)' },
      { name: 'GL_POSTED_DATE', type: 'DATE', role: 'normal', desc: 'GL会計済日' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },
  {
    id: 'AR_RECEIVABLE_APPLICATIONS_ALL', name: 'AR_RECEIVABLE_APPLICATIONS_ALL', jpName: '債権消込・未消込履歴',
    domain: 'AR_TRX_RECEIPT', pk: ['RECEIVABLE_APPLICATION_ID'], fks: ['CASH_RECEIPT_ID', 'CASH_RECEIPT_HISTORY_ID', 'PAYMENT_SCHEDULE_ID', 'APPLIED_CUSTOMER_TRX_ID', 'APPLIED_PAYMENT_SCHEDULE_ID', 'CODE_COMBINATION_ID', 'EVENT_ID'],
    pos: { x: 405, y: 625, w: 335, h: 64 },
    description: '入金時のUNAPP(+164,000)、消込時のUNAPP取消(-164,000)と請求書へのAPP充当(+164,000)の3行を格納。',
    columns: [
      { name: 'RECEIVABLE_APPLICATION_ID', type: 'NUMBER(18)', role: 'pk', desc: '債権消込ID' },
      { name: 'CASH_RECEIPT_ID', type: 'NUMBER(18)', role: 'fk', desc: '現金入金ID' },
      { name: 'CASH_RECEIPT_HISTORY_ID', type: 'NUMBER(18)', role: 'fk', desc: '入金履歴ID' },
      { name: 'PAYMENT_SCHEDULE_ID', type: 'NUMBER(18)', role: 'fk', desc: '入金側の支払予定ID' },
      { name: 'APPLIED_CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'fk', desc: '消込先請求書ID' },
      { name: 'APPLIED_PAYMENT_SCHEDULE_ID', type: 'NUMBER(18)', role: 'fk', desc: '消込先支払予定ID' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: 'flag', desc: 'ステータス (UNAPP / APP)' },
      { name: 'APPLICATION_TYPE', type: 'VARCHAR2(20)', role: 'flag', desc: '消込タイプ (CASH)' },
      { name: 'APPLICATION_RULE', type: 'VARCHAR2(30)', role: 'normal', desc: '内部処理ルールコード' },
      { name: 'AMOUNT_APPLIED', type: 'NUMBER', role: 'amount', desc: '消込・未消込金額' },
      { name: 'ACCTD_AMOUNT_APPLIED_FROM', type: 'NUMBER', role: 'amount', desc: '入金側機能通貨金額' },
      { name: 'ACCTD_AMOUNT_APPLIED_TO', type: 'NUMBER', role: 'amount', desc: '請求側機能通貨金額' },
      { name: 'LINE_APPLIED', type: 'NUMBER', role: 'amount', desc: '品目充当額 (150,000)' },
      { name: 'TAX_APPLIED', type: 'NUMBER', role: 'amount', desc: '税充当額 (14,000)' },
      { name: 'APPLY_DATE', type: 'DATE', role: 'normal', desc: '消込日' },
      { name: 'GL_DATE', type: 'DATE', role: 'normal', desc: 'GL日付' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定CCID (2009 / 3001)' },
      { name: 'DISPLAY', type: 'VARCHAR2(1)', role: 'flag', desc: 'UI表示対象フラグ (Y/N)' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAイベントID' },
      { name: 'POSTING_CONTROL_ID', type: 'NUMBER(18)', role: 'flag', desc: '転記制御ID (-3→9001)' },
      { name: 'GL_POSTED_DATE', type: 'DATE', role: 'normal', desc: 'GL会計済日' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' }
    ]
  },
  {
    id: 'AR_DISTRIBUTIONS_ALL', name: 'AR_DISTRIBUTIONS_ALL', jpName: '入金・消込サブレジャー配賦',
    domain: 'AR_TRX_RECEIPT', pk: ['LINE_ID'], fks: ['SOURCE_ID', 'CODE_COMBINATION_ID'],
    pos: { x: 405, y: 715, w: 335, h: 64 },
    description: '入金履歴(CRH)と消込(RA)の借方・貸方明細を保持。SLAのXLA_DISTRIBUTION_LINKSが参照するソース配賦。',
    columns: [
      { name: 'LINE_ID', type: 'NUMBER(18)', role: 'pk', desc: 'AR配賦明細ID' },
      { name: 'SOURCE_ID', type: 'NUMBER(18)', role: 'fk', desc: '親ID (CRH_ID or RA_ID)' },
      { name: 'SOURCE_TABLE', type: 'VARCHAR2(10)', role: 'flag', desc: '親テーブル識別 (CRH / RA)' },
      { name: 'SOURCE_TYPE', type: 'VARCHAR2(30)', role: 'flag', desc: 'ソースタイプ (CASH/UNAPP/REC)' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定コード組合せID' },
      { name: 'AMOUNT_DR', type: 'NUMBER', role: 'amount', desc: '借方金額' },
      { name: 'AMOUNT_CR', type: 'NUMBER', role: 'amount', desc: '貸方金額' },
      { name: 'ACCTD_AMOUNT_DR', type: 'NUMBER', role: 'amount', desc: '機能通貨借方' },
      { name: 'ACCTD_AMOUNT_CR', type: 'NUMBER', role: 'amount', desc: '機能通貨貸方' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨コード' },
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'fk', desc: 'BU ID' }
    ]
  },

  // === E. SLA (Subledger Accounting) 補助元帳会計 (5) ===
  {
    id: 'XLA_TRANSACTION_ENTITIES', name: 'XLA_TRANSACTION_ENTITIES', jpName: 'SLAトランザクションエンティティ',
    domain: 'SLA_XLA', pk: ['ENTITY_ID'], fks: ['LEGAL_ENTITY_ID', 'SOURCE_ID_INT_1', 'LEDGER_ID'],
    pos: { x: 805, y: 80, w: 275, h: 72 },
    description: 'SLAにおける取引エンティティ。TRANSACTIONS(請求50001)とRECEIPTS(入金60001)をSOURCE_ID_INT_1で識別する。',
    columns: [
      { name: 'ENTITY_ID', type: 'NUMBER(18)', role: 'pk', desc: 'SLAエンティティID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (222=AR)' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: '法的エンティティID' },
      { name: 'ENTITY_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'エンティティ種別' },
      { name: 'SOURCE_ID_INT_1', type: 'NUMBER(38)', role: 'fk', desc: '元取引主キー (TRX_ID/RCPT_ID)' },
      { name: 'TRANSACTION_NUMBER', type: 'VARCHAR2(240)', role: 'normal', desc: '取引番号' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' }
    ]
  },
  {
    id: 'XLA_EVENTS', name: 'XLA_EVENTS', jpName: 'SLA会計イベント',
    domain: 'SLA_XLA', pk: ['EVENT_ID'], fks: ['ENTITY_ID'],
    pos: { x: 805, y: 205, w: 275, h: 72 },
    description: 'INV_CREATE(80001)、RECP_CREATE(80002)、RECP_UPDATE(80003)を保持。会計作成前はU、作成後はPへ更新。',
    columns: [
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'pk', desc: '会計イベントID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (222=AR)' },
      { name: 'ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAエンティティID' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'イベント種別コード' },
      { name: 'EVENT_NUMBER', type: 'NUMBER(18)', role: 'normal', desc: 'イベント番号' },
      { name: 'EVENT_DATE', type: 'DATE', role: 'normal', desc: 'イベント日' },
      { name: 'EVENT_STATUS_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: 'イベントステータス (U→P)' },
      { name: 'PROCESS_STATUS_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: '処理ステータス (U→P)' },
      { name: 'ON_HOLD_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '保留フラグ' },
      { name: 'TRANSACTION_DATE', type: 'DATE', role: 'normal', desc: '取引日' }
    ]
  },
  {
    id: 'XLA_AE_HEADERS', name: 'XLA_AE_HEADERS', jpName: 'SLA補助元帳仕訳ヘッダ',
    domain: 'SLA_XLA', pk: ['AE_HEADER_ID'], fks: ['LEDGER_ID', 'ENTITY_ID', 'EVENT_ID'],
    pos: { x: 805, y: 345, w: 275, h: 76 },
    description: 'Create Accountingで生成される仕訳ヘッダ3件。GL転送前は GL_TRANSFER_STATUS_CODE=N、GL転送後は Y に更新。',
    columns: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: '補助元帳仕訳ヘッダID' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'normal', desc: 'アプリID (222)' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'ENTITY_ID', type: 'NUMBER(18)', role: 'fk', desc: 'SLAエンティティID' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: '会計イベントID' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'イベント種別' },
      { name: 'ACCOUNTING_DATE', type: 'DATE', role: 'normal', desc: '会計日付' },
      { name: 'GL_TRANSFER_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: 'GL転送状況 (N→Y)' },
      { name: 'GL_TRANSFER_DATE', type: 'DATE', role: 'normal', desc: 'GL転送日 (NULL→日付)' },
      { name: 'JE_CATEGORY_NAME', type: 'VARCHAR2(30)', role: 'normal', desc: '仕訳カテゴリ' },
      { name: 'ACCOUNTING_ENTRY_STATUS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '仕訳状態 (F=最終)' },
      { name: 'BALANCE_TYPE_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: '残高タイプ (A=実績)' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計期間' }
    ]
  },
  {
    id: 'XLA_AE_LINES', name: 'XLA_AE_LINES', jpName: 'SLA補助元帳仕訳明細',
    domain: 'SLA_XLA', pk: ['AE_HEADER_ID', 'AE_LINE_NUM', 'APPLICATION_ID'], fks: ['AE_HEADER_ID', 'CODE_COMBINATION_ID', 'GL_SL_LINK_ID', 'PARTY_ID', 'PARTY_SITE_ID'],
    pos: { x: 805, y: 495, w: 275, h: 78 },
    description: 'Create Accountingで生成された9本の仕訳明細。GL_SL_LINK_ID が GL_IMPORT_REFERENCES とのドリルスルー鍵になる。',
    columns: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: '補助元帳仕訳ヘッダID' },
      { name: 'AE_LINE_NUM', type: 'NUMBER(18)', role: 'pk', desc: '仕訳明細番号' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'アプリID (222)' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定CCID' },
      { name: 'GL_TRANSFER_MODE_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: 'GL転送モード (D=明細)' },
      { name: 'GL_SL_LINK_ID', type: 'NUMBER(18)', role: 'fk', desc: 'GL-SLAリンクID' },
      { name: 'GL_SL_LINK_TABLE', type: 'VARCHAR2(30)', role: 'normal', desc: 'リンク元テーブル (XLAJEL)' },
      { name: 'ACCOUNTING_CLASS_CODE', type: 'VARCHAR2(30)', role: 'flag', desc: '会計クラス' },
      { name: 'ENTERED_DR', type: 'NUMBER', role: 'amount', desc: '入力借方金額' },
      { name: 'ENTERED_CR', type: 'NUMBER', role: 'amount', desc: '入力貸方金額' },
      { name: 'ACCOUNTED_DR', type: 'NUMBER', role: 'amount', desc: '機能通貨借方金額' },
      { name: 'ACCOUNTED_CR', type: 'NUMBER', role: 'amount', desc: '機能通貨貸方金額' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨コード' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'fk', desc: '顧客パーティID' },
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'fk', desc: '顧客サイトID' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(1996)', role: 'normal', desc: '仕訳明細摘要' }
    ]
  },
  {
    id: 'XLA_DISTRIBUTION_LINKS', name: 'XLA_DISTRIBUTION_LINKS', jpName: 'SLA配賦リンク (監査証跡)',
    domain: 'SLA_XLA', pk: ['APPLICATION_ID', 'AE_HEADER_ID', 'AE_LINE_NUM', 'SOURCE_DISTRIBUTION_TYPE', 'SOURCE_DISTRIBUTION_ID_NUM_1'], fks: ['EVENT_ID', 'AE_HEADER_ID', 'SOURCE_DISTRIBUTION_ID_NUM_1'],
    pos: { x: 805, y: 650, w: 275, h: 78 },
    description: 'SLA仕訳明細 (XLA_AE_LINES) と AR配賦ソース (RA_CUST_TRX_LINE_GL_DIST_ALL / AR_DISTRIBUTIONS_ALL) を直接結ぶ監査証跡。',
    columns: [
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'pk', desc: 'アプリID (222)' },
      { name: 'EVENT_ID', type: 'NUMBER(18)', role: 'fk', desc: '会計イベントID' },
      { name: 'AE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: '補助元帳仕訳ヘッダID' },
      { name: 'AE_LINE_NUM', type: 'NUMBER(18)', role: 'pk', desc: '仕訳明細番号' },
      { name: 'SOURCE_DISTRIBUTION_TYPE', type: 'VARCHAR2(30)', role: 'pk', desc: '配賦ソースタイプ' },
      { name: 'SOURCE_DISTRIBUTION_ID_NUM_1', type: 'NUMBER(38)', role: 'pk', desc: '元配賦PK ID' },
      { name: 'APPLIED_TO_SOURCE_ID_NUM_1', type: 'NUMBER(18)', role: 'fk', desc: '消込先請求ID (消込時)' },
      { name: 'EVENT_CLASS_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'イベントクラス' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: 'イベントタイプ' },
      { name: 'ROUNDING_CLASS_CODE', type: 'VARCHAR2(30)', role: 'normal', desc: '端数丸めクラス' },
      { name: 'MERGE_DUPLICATE_CODE', type: 'VARCHAR2(1)', role: 'flag', desc: 'マージ区分' },
      { name: 'UNROUNDED_ACCOUNTED_DR', type: 'NUMBER', role: 'amount', desc: '未丸め機能通貨借方' },
      { name: 'UNROUNDED_ACCOUNTED_CR', type: 'NUMBER', role: 'amount', desc: '未丸め機能通貨貸方' }
    ]
  },

  // === F. GL (General Ledger) 総勘定元帳 (6) ===
  {
    id: 'GL_INTERFACE', name: 'GL_INTERFACE', jpName: 'GL仕訳インタフェース',
    domain: 'GL_LEDGER', pk: ['GROUP_ID', 'GL_SL_LINK_ID'], fks: ['LEDGER_ID', 'CODE_COMBINATION_ID', 'GL_SL_LINK_ID'],
    pos: { x: 1145, y: 70, w: 275, h: 64 },
    description: 'SLAから転送された9明細を受け取るステージング表。Journal Import実行により STATUS が NEW → PROCESSED となる。',
    columns: [
      { name: 'STATUS', type: 'VARCHAR2(50)', role: 'flag', desc: '処理ステータス (NEW→PROCESSED)' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'ACCOUNTING_DATE', type: 'DATE', role: 'normal', desc: '会計日付' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨コード' },
      { name: 'DATE_CREATED', type: 'DATE', role: 'normal', desc: '作成日' },
      { name: 'ACTUAL_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '残高タイプ (A=実績)' },
      { name: 'USER_JE_CATEGORY_NAME', type: 'VARCHAR2(25)', role: 'normal', desc: '仕訳カテゴリ名' },
      { name: 'USER_JE_SOURCE_NAME', type: 'VARCHAR2(25)', role: 'normal', desc: '仕訳ソース名 (Receivables)' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定CCID' },
      { name: 'ENTERED_DR', type: 'NUMBER', role: 'amount', desc: '入力借方' },
      { name: 'ENTERED_CR', type: 'NUMBER', role: 'amount', desc: '入力貸方' },
      { name: 'ACCOUNTED_DR', type: 'NUMBER', role: 'amount', desc: '機能通貨借方' },
      { name: 'ACCOUNTED_CR', type: 'NUMBER', role: 'amount', desc: '機能通貨貸方' },
      { name: 'GROUP_ID', type: 'NUMBER(18)', role: 'pk', desc: 'インポートグループID' },
      { name: 'GL_SL_LINK_ID', type: 'NUMBER(18)', role: 'pk', desc: 'GL-SLAリンクID' },
      { name: 'GL_SL_LINK_TABLE', type: 'VARCHAR2(30)', role: 'normal', desc: 'リンク元テーブル' }
    ]
  },
  {
    id: 'GL_JE_BATCHES', name: 'GL_JE_BATCHES', jpName: 'GL仕訳バッチ',
    domain: 'GL_LEDGER', pk: ['JE_BATCH_ID'], fks: ['CHART_OF_ACCOUNTS_ID'],
    pos: { x: 1145, y: 175, w: 275, h: 64 },
    description: 'インポートされたGL仕訳ヘッダをまとめるバッチ。GL転記で STATUS が U(未転記) → P(転記済) へ更新される。',
    columns: [
      { name: 'JE_BATCH_ID', type: 'NUMBER(18)', role: 'pk', desc: '仕訳バッチID' },
      { name: 'NAME', type: 'VARCHAR2(100)', role: 'normal', desc: 'バッチ名' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: '転記ステータス (U→P)' },
      { name: 'DEFAULT_PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: 'デフォルト会計期間' },
      { name: 'POSTED_DATE', type: 'DATE', role: 'normal', desc: '転記日 (NULL→日付)' },
      { name: 'RUNNING_TOTAL_DR', type: 'NUMBER', role: 'amount', desc: 'バッチ借方合計 (492,000)' },
      { name: 'RUNNING_TOTAL_CR', type: 'NUMBER', role: 'amount', desc: 'バッチ貸方合計 (492,000)' },
      { name: 'CHART_OF_ACCOUNTS_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定体系ID (101)' },
      { name: 'PERIOD_SET_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計カレンダ' },
      { name: 'ACCOUNTED_PERIOD_TYPE', type: 'VARCHAR2(15)', role: 'normal', desc: '期間タイプ' },
      { name: 'ACTUAL_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '実績フラグ (A)' }
    ]
  },
  {
    id: 'GL_JE_HEADERS', name: 'GL_JE_HEADERS', jpName: 'GL仕訳ヘッダ',
    domain: 'GL_LEDGER', pk: ['JE_HEADER_ID'], fks: ['JE_BATCH_ID', 'LEDGER_ID'],
    pos: { x: 1145, y: 280, w: 275, h: 68 },
    description: 'Sales Invoices (164,000) と Receipts (328,000) の2つのGL仕訳伝票ヘッダ。GL転記で STATUS が U → P に更新。',
    columns: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: '仕訳ヘッダID' },
      { name: 'JE_BATCH_ID', type: 'NUMBER(18)', role: 'fk', desc: '仕訳バッチID' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'JE_CATEGORY', type: 'VARCHAR2(25)', role: 'normal', desc: '仕訳カテゴリ' },
      { name: 'JE_SOURCE', type: 'VARCHAR2(25)', role: 'normal', desc: '仕訳ソース (Receivables)' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計期間' },
      { name: 'NAME', type: 'VARCHAR2(100)', role: 'normal', desc: '仕訳伝票名' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: 'normal', desc: '通貨' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (U→P)' },
      { name: 'DATE_CREATED', type: 'DATE', role: 'normal', desc: '作成日' },
      { name: 'POSTED_DATE', type: 'DATE', role: 'normal', desc: '転記日 (NULL→日付)' },
      { name: 'ACTUAL_FLAG', type: 'VARCHAR2(1)', role: 'flag', desc: '実績フラグ (A)' },
      { name: 'RUNNING_TOTAL_DR', type: 'NUMBER', role: 'amount', desc: '借方合計' },
      { name: 'RUNNING_TOTAL_CR', type: 'NUMBER', role: 'amount', desc: '貸方合計' }
    ]
  },
  {
    id: 'GL_JE_LINES', name: 'GL_JE_LINES', jpName: 'GL仕訳明細',
    domain: 'GL_LEDGER', pk: ['JE_HEADER_ID', 'JE_LINE_NUM'], fks: ['JE_HEADER_ID', 'LEDGER_ID', 'CODE_COMBINATION_ID'],
    pos: { x: 1145, y: 395, w: 275, h: 72 },
    description: '総勘定元帳の9本の仕訳明細行。GL転記で STATUS が U → P に更新され、各勘定残高へ集計される。',
    columns: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(18)', role: 'pk', desc: '仕訳ヘッダID' },
      { name: 'JE_LINE_NUM', type: 'NUMBER(15)', role: 'pk', desc: '仕訳明細番号' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'fk', desc: '元帳ID' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'fk', desc: '勘定CCID' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'normal', desc: '会計期間' },
      { name: 'EFFECTIVE_DATE', type: 'DATE', role: 'normal', desc: '有効日 (会計日)' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: 'flag', desc: 'ステータス (U→P)' },
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
    pos: { x: 1145, y: 520, w: 275, h: 72 },
    description: 'GL仕訳明細とSLA仕訳明細 (XLA_AE_LINES) を GL_SL_LINK_ID で1対1に紐付け、GLからAR原伝票へのドリルスルーを実現する。',
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
    pos: { x: 1145, y: 650, w: 275, h: 78 },
    description: 'CCID(AFF 9セグメント)×会計期間別の試算表残高。Step 7のGL転記時に PERIOD_NET_DR / PERIOD_NET_CR が加算更新される。',
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
  { from: 'XLE_ENTITY_PROFILES', to: 'FUN_ALL_BUSINESS_UNITS_V', join: 'XLE.LEGAL_ENTITY_ID = BU.LEGAL_ENTITY_ID', label: '法的実体→BU' },
  { from: 'GL_LEDGERS', to: 'FUN_ALL_BUSINESS_UNITS_V', join: 'GL.LEDGER_ID = BU.PRIMARY_LEDGER_ID', label: '元帳→BU' },
  { from: 'GL_LEDGERS', to: 'GL_PERIOD_STATUSES', join: 'GL.LEDGER_ID = GPS.LEDGER_ID', label: '会計期間開閉' },
  { from: 'FND_KF_STR_INSTANCES_B', to: 'GL_CODE_COMBINATIONS', join: 'KFF.STRUCTURE_INSTANCE_NUMBER = GCC.CHART_OF_ACCOUNTS_ID', label: 'AFF構造→組合せ' },
  { from: 'HZ_PARTIES', to: 'HZ_CUST_ACCOUNTS', join: 'HP.PARTY_ID = HCA.PARTY_ID', label: '取引先→顧客口座' },
  { from: 'HZ_CUST_ACCOUNTS', to: 'HZ_CUST_ACCT_SITES_ALL', join: 'HCA.CUST_ACCOUNT_ID = HCAS.CUST_ACCOUNT_ID', label: '口座→サイト' },
  { from: 'HZ_CUST_ACCT_SITES_ALL', to: 'HZ_CUST_SITE_USES_ALL', join: 'HCAS.CUST_ACCT_SITE_ID = HCSU.CUST_ACCT_SITE_ID', label: 'サイト→用途' },
  { from: 'CE_BANK_ACCOUNTS', to: 'CE_BANK_ACCT_USES_ALL', join: 'CBA.BANK_ACCOUNT_ID = CBAU.BANK_ACCOUNT_ID', label: '銀行口座→BU利用' },
  { from: 'AR_RECEIPT_CLASSES', to: 'AR_RECEIPT_METHODS', join: 'ARC.RECEIPT_CLASS_ID = ARM.RECEIPT_CLASS_ID', label: '入金クラス→方法' },
  { from: 'AR_RECEIPT_METHODS', to: 'AR_RECEIPT_METHOD_ACCOUNTS_ALL', join: 'ARM.RECEIPT_METHOD_ID = ARMA.RECEIPT_METHOD_ID', label: '入金方法→勘定' },
  { from: 'CE_BANK_ACCT_USES_ALL', to: 'AR_RECEIPT_METHOD_ACCOUNTS_ALL', join: 'CBAU.BANK_ACCT_USE_ID = ARMA.REMIT_BANK_ACCT_USE_ID', label: '銀行利用→入金勘定' },
  { from: 'RA_TERMS_B', to: 'RA_TERMS_LINES', join: 'RTB.TERM_ID = RTL.TERM_ID', label: '支払条件ヘッダ→明細' },
  { from: 'HZ_CUST_ACCOUNTS', to: 'RA_CUSTOMER_TRX_ALL', join: 'HCA.CUST_ACCOUNT_ID = RCT.BILL_TO_CUSTOMER_ID', label: '顧客→請求ヘッダ' },
  { from: 'RA_CUST_TRX_TYPES_ALL', to: 'RA_CUSTOMER_TRX_ALL', join: 'RCTT.CUST_TRX_TYPE_SEQ_ID = RCT.CUST_TRX_TYPE_SEQ_ID', label: '取引タイプ→請求' },
  { from: 'RA_BATCH_SOURCES_ALL', to: 'RA_CUSTOMER_TRX_ALL', join: 'RBS.BATCH_SOURCE_SEQ_ID = RCT.BATCH_SOURCE_SEQ_ID', label: 'ソース→請求' },
  { from: 'RA_CUSTOMER_TRX_ALL', to: 'RA_CUSTOMER_TRX_LINES_ALL', join: 'RCT.CUSTOMER_TRX_ID = RCTL.CUSTOMER_TRX_ID', label: '請求ヘッダ→明細' },
  { from: 'AR_MEMO_LINES_ALL_B', to: 'RA_CUSTOMER_TRX_LINES_ALL', join: 'AML.MEMO_LINE_SEQ_ID = RCTL.MEMO_LINE_SEQ_ID', label: '標準メモ→明細' },
  { from: 'ZX_RATES_B', to: 'ZX_LINES', join: 'ZXR.TAX_RATE_ID = ZXL.TAX_RATE_ID', label: '税率→税明細' },
  { from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'ZX_LINES', join: 'RCTL.CUSTOMER_TRX_LINE_ID = ZXL.TRX_LINE_ID AND RCTL.TAX_LINE_ID = ZXL.TAX_LINE_ID', label: '請求明細↔税計算' },
  { from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', join: 'RCTL.CUSTOMER_TRX_LINE_ID = DIST.CUSTOMER_TRX_LINE_ID', label: '明細→会計配賦' },
  { from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_PAYMENT_SCHEDULES_ALL', join: 'RCT.CUSTOMER_TRX_ID = APS.CUSTOMER_TRX_ID', label: '請求確定→支払予定' },
  { from: 'AR_RECEIPT_METHODS', to: 'AR_CASH_RECEIPTS_ALL', join: 'ARM.RECEIPT_METHOD_ID = ACR.RECEIPT_METHOD_ID', label: '入金方法→入金' },
  { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_CASH_RECEIPT_HISTORY_ALL', join: 'ACR.CASH_RECEIPT_ID = ACRH.CASH_RECEIPT_ID', label: '入金→履歴(CRH)' },
  { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_PAYMENT_SCHEDULES_ALL', join: 'ACR.CASH_RECEIPT_ID = APS.CASH_RECEIPT_ID', label: '入金→支払予定' },
  { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', join: 'ACR.CASH_RECEIPT_ID = ARA.CASH_RECEIPT_ID', label: '入金→消込(RA)' },
  { from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', join: 'RCT.CUSTOMER_TRX_ID = ARA.APPLIED_CUSTOMER_TRX_ID', label: '請求書←消込充当' },
  { from: 'AR_CASH_RECEIPT_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', join: "ACRH.CASH_RECEIPT_HISTORY_ID = ARD.SOURCE_ID AND ARD.SOURCE_TABLE='CRH'", label: 'CRH→AR配賦' },
  { from: 'AR_RECEIVABLE_APPLICATIONS_ALL', to: 'AR_DISTRIBUTIONS_ALL', join: "ARA.RECEIVABLE_APPLICATION_ID = ARD.SOURCE_ID AND ARD.SOURCE_TABLE='RA'", label: 'RA→AR配賦' },
  { from: 'RA_CUSTOMER_TRX_ALL', to: 'XLA_TRANSACTION_ENTITIES', join: "RCT.CUSTOMER_TRX_ID = XTE.SOURCE_ID_INT_1 AND XTE.ENTITY_CODE='TRANSACTIONS'", label: '請求→SLAエンティティ' },
  { from: 'AR_CASH_RECEIPTS_ALL', to: 'XLA_TRANSACTION_ENTITIES', join: "ACR.CASH_RECEIPT_ID = XTE.SOURCE_ID_INT_1 AND XTE.ENTITY_CODE='RECEIPTS'", label: '入金→SLAエンティティ' },
  { from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', join: 'XTE.ENTITY_ID = XE.ENTITY_ID', label: 'エンティティ→イベント' },
  { from: 'XLA_EVENTS', to: 'XLA_AE_HEADERS', join: 'XE.EVENT_ID = XAH.EVENT_ID', label: 'イベント→SLA仕訳ヘッダ' },
  { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', join: 'XAH.AE_HEADER_ID = XAL.AE_HEADER_ID', label: 'SLAヘッダ→明細' },
  { from: 'XLA_AE_LINES', to: 'XLA_DISTRIBUTION_LINKS', join: 'XAL.AE_HEADER_ID = XDL.AE_HEADER_ID AND XAL.AE_LINE_NUM = XDL.AE_LINE_NUM', label: 'SLA明細→配賦リンク' },
  { from: 'RA_CUST_TRX_LINE_GL_DIST_ALL', to: 'XLA_DISTRIBUTION_LINKS', join: "DIST.CUST_TRX_LINE_GL_DIST_ID = XDL.SOURCE_DISTRIBUTION_ID_NUM_1 AND XDL.SOURCE_DISTRIBUTION_TYPE='RA_CUST_TRX_LINE_GL_DIST_ALL'", label: '請求配賦→XDL' },
  { from: 'AR_DISTRIBUTIONS_ALL', to: 'XLA_DISTRIBUTION_LINKS', join: "ARD.LINE_ID = XDL.SOURCE_DISTRIBUTION_ID_NUM_1 AND XDL.SOURCE_DISTRIBUTION_TYPE='AR_DISTRIBUTIONS_ALL'", label: '入金消込配賦→XDL' },
  { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', join: 'XAL.GL_SL_LINK_ID = GI.GL_SL_LINK_ID AND XAL.GL_SL_LINK_TABLE = GI.GL_SL_LINK_TABLE', label: 'SLA→GLインタフェース' },
  { from: 'GL_INTERFACE', to: 'GL_JE_BATCHES', join: 'Journal Import → バッチ生成', label: 'I/F→GLバッチ' },
  { from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', join: 'GJB.JE_BATCH_ID = GJH.JE_BATCH_ID', label: 'バッチ→GL仕訳ヘッダ' },
  { from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', join: 'GJH.JE_HEADER_ID = GJL.JE_HEADER_ID', label: 'GLヘッダ→明細' },
  { from: 'GL_JE_LINES', to: 'GL_IMPORT_REFERENCES', join: 'GJL.JE_HEADER_ID = GIR.JE_HEADER_ID AND GJL.JE_LINE_NUM = GIR.JE_LINE_NUM', label: 'GL明細→参照リンク' },
  { from: 'XLA_AE_LINES', to: 'GL_IMPORT_REFERENCES', join: 'XAL.GL_SL_LINK_ID = GIR.GL_SL_LINK_ID', label: 'SLA↔GLドリルスルー' },
  { from: 'GL_JE_LINES', to: 'GL_BALANCES', join: 'GJL.CODE_COMBINATION_ID = GB.CODE_COMBINATION_ID AND GJL.PERIOD_NAME = GB.PERIOD_NAME', label: 'GL転記→元帳残高更新' }
];

// 各テーブルのレコードとステップ別ライフサイクル
// createdAtStep: レコードが初めて現れるステップ (0〜7)
// updates: { [stepIndex]: { COL_NAME: newValue, ... } }
const TABLE_RECORDS = {
  XLE_ENTITY_PROFILES: [
    { createdAtStep: 0, data: { LEGAL_ENTITY_ID: 201, NAME: 'フュージョン株式会社', LEGAL_ENTITY_IDENTIFIER: 'JP201', TRANSACTING_ENTITY_FLAG: 'Y', EFFECTIVE_FROM: '2020-04-01' } }
  ],
  GL_LEDGERS: [
    { createdAtStep: 0, data: { LEDGER_ID: 3001, NAME: 'JP Primary Ledger', SHORT_NAME: 'JP_PL', LEDGER_CATEGORY_CODE: 'PRIMARY', CHART_OF_ACCOUNTS_ID: 101, CURRENCY_CODE: 'JPY', PERIOD_SET_NAME: 'JP_CALENDAR', ACCOUNTED_PERIOD_TYPE: 'MONTH', SLA_ACCOUNTING_METHOD_CODE: 'STANDARD_ACCRUAL' } }
  ],
  FUN_ALL_BUSINESS_UNITS_V: [
    { createdAtStep: 0, data: { BU_ID: 401, BU_NAME: 'JP Business Unit', LEGAL_ENTITY_ID: 201, PRIMARY_LEDGER_ID: 3001, DEFAULT_SET_ID: 501, DEFAULT_CURRENCY_CODE: 'JPY', STATUS: 'A' } }
  ],
  GL_PERIOD_STATUSES: [
    { createdAtStep: 0, data: { APPLICATION_ID: 222, LEDGER_ID: 3001, SET_OF_BOOKS_ID: 3001, PERIOD_NAME: '2026-11', CLOSING_STATUS: 'O', START_DATE: '2026-11-01', END_DATE: '2026-11-30', PERIOD_YEAR: 2026, PERIOD_NUM: 11 } },
    { createdAtStep: 0, data: { APPLICATION_ID: 101, LEDGER_ID: 3001, SET_OF_BOOKS_ID: 3001, PERIOD_NAME: '2026-11', CLOSING_STATUS: 'O', START_DATE: '2026-11-01', END_DATE: '2026-11-30', PERIOD_YEAR: 2026, PERIOD_NUM: 11 } }
  ],
  FND_KF_STR_INSTANCES_B: [
    { createdAtStep: 0, data: { STRUCTURE_INSTANCE_ID: 101, APPLICATION_ID: 101, KEY_FLEXFIELD_CODE: 'GL#', STRUCTURE_INSTANCE_NUMBER: 101, STRUCTURE_INSTANCE_CODE: 'JP_AFF_9SEG', STRUCTURE_ID: 101, ENABLED_FLAG: 'Y' } }
  ],
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
  HZ_PARTIES: [
    { createdAtStep: 0, data: { PARTY_ID: 10001, PARTY_NUMBER: 'P-10001', PARTY_NAME: '株式会社ジャパンコマース', PARTY_TYPE: 'ORGANIZATION', STATUS: 'A' } }
  ],
  HZ_CUST_ACCOUNTS: [
    { createdAtStep: 0, data: { CUST_ACCOUNT_ID: 11001, PARTY_ID: 10001, ACCOUNT_NUMBER: 'CUST-11001', ACCOUNT_NAME: 'ジャパンコマース売掛口座', STATUS: 'A', CUSTOMER_TYPE: 'R' } }
  ],
  HZ_CUST_ACCT_SITES_ALL: [
    { createdAtStep: 0, data: { CUST_ACCT_SITE_ID: 12001, CUST_ACCOUNT_ID: 11001, PARTY_SITE_ID: 10501, SET_ID: 501, STATUS: 'A', BILL_TO_FLAG: 'P', SHIP_TO_FLAG: 'P' } }
  ],
  HZ_CUST_SITE_USES_ALL: [
    { createdAtStep: 0, data: { SITE_USE_ID: 13001, CUST_ACCT_SITE_ID: 12001, SITE_USE_CODE: 'BILL_TO', PRIMARY_FLAG: 'Y', STATUS: 'A', LOCATION: 'TOKYO-HQ-BILL', SET_ID: 501 } }
  ],
  AR_SYSTEM_PARAMETERS_ALL: [
    { createdAtStep: 0, data: { ORG_ID: 401, SET_OF_BOOKS_ID: 3001, ACCOUNTING_METHOD: 'ACCRUAL', DEFAULT_COUNTRY: 'JP', PAYMENT_APPLICATION_RULE: 'H' } }
  ],
  RA_BATCH_SOURCES_ALL: [
    { createdAtStep: 0, data: { BATCH_SOURCE_SEQ_ID: 20001, BATCH_SOURCE_ID: 1001, SET_ID: 501, NAME: 'MANUAL_SOURCE', BATCH_SOURCE_TYPE: 'INV', STATUS: 'A', AUTO_TRX_NUMBERING_FLAG: 'Y' } }
  ],
  RA_CUST_TRX_TYPES_ALL: [
    { createdAtStep: 0, data: { CUST_TRX_TYPE_SEQ_ID: 21001, CUST_TRX_TYPE_ID: 2001, SET_ID: 501, NAME: '国内標準請求書', TYPE: 'INV', ACCOUNTING_AFFECT_FLAG: 'Y', POST_TO_GL: 'Y', TAX_CALCULATION_FLAG: 'Y', GL_ID_REC: 3001, GL_ID_REV: 4001, GL_ID_TAX: 2001 } }
  ],
  RA_TERMS_B: [
    { createdAtStep: 0, data: { TERM_ID: 22001, SET_ID: 501, BILLING_CYCLE_ID: null, PRINTING_LEAD_DAYS: 0, START_DATE_ACTIVE: '2020-04-01' } }
  ],
  RA_TERMS_LINES: [
    { createdAtStep: 0, data: { TERM_ID: 22001, SEQUENCE_NUM: 1, RELATIVE_AMOUNT: 100, DUE_DAYS: 30 } }
  ],
  AR_MEMO_LINES_ALL_B: [
    { createdAtStep: 0, data: { MEMO_LINE_SEQ_ID: 23001, MEMO_LINE_ID: 301, SET_ID: 501, LINE_TYPE: 'LINE', UOM_CODE: 'EA', UNIT_STD_PRICE: 100000, GL_ID_REV: 4001, TAX_PRODUCT_CATEGORY: 'STD_10' } },
    { createdAtStep: 0, data: { MEMO_LINE_SEQ_ID: 23002, MEMO_LINE_ID: 302, SET_ID: 501, LINE_TYPE: 'LINE', UOM_CODE: 'SET', UNIT_STD_PRICE: 50000, GL_ID_REV: 4002, TAX_PRODUCT_CATEGORY: 'RED_8' } }
  ],
  ZX_RATES_B: [
    { createdAtStep: 0, data: { TAX_RATE_ID: 24010, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'STANDARD', TAX_RATE_CODE: 'JP_OUT_10', PERCENTAGE_RATE: 10, RATE_TYPE_CODE: 'PERCENTAGE', EFFECTIVE_FROM: '2019-10-01', ACTIVE_FLAG: 'Y' } },
    { createdAtStep: 0, data: { TAX_RATE_ID: 24008, TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'REDUCED', TAX_RATE_CODE: 'JP_OUT_8', PERCENTAGE_RATE: 8, RATE_TYPE_CODE: 'PERCENTAGE', EFFECTIVE_FROM: '2019-10-01', ACTIVE_FLAG: 'Y' } }
  ],
  AR_RECEIPT_CLASSES: [
    { createdAtStep: 0, data: { RECEIPT_CLASS_ID: 25001, NAME: '銀行振込入金クラス', CREATION_METHOD_CODE: 'MANUAL', CONFIRM_FLAG: 'N', REMIT_FLAG: 'N', CLEAR_FLAG: 'N', REMIT_METHOD_CODE: 'NO_REMITTANCE' } }
  ],
  AR_RECEIPT_METHODS: [
    { createdAtStep: 0, data: { RECEIPT_METHOD_ID: 26001, RECEIPT_CLASS_ID: 25001, NAME: '銀行振込(即時決済)', PAYMENT_CHANNEL_CODE: 'BANK_ACCT_XFER', START_DATE: '2020-04-01' } }
  ],
  CE_BANK_ACCOUNTS: [
    { createdAtStep: 0, data: { BANK_ACCOUNT_ID: 27001, BANK_ACCOUNT_NAME: 'みずほ銀行東京営業部_普通', BANK_ACCOUNT_NUM: '1234567', CURRENCY_CODE: 'JPY', ACCOUNT_OWNER_ORG_ID: 201, CASH_CLEARING_CCID: 1001, ASSET_CODE_COMBINATION_ID: 1001 } }
  ],
  CE_BANK_ACCT_USES_ALL: [
    { createdAtStep: 0, data: { BANK_ACCT_USE_ID: 28001, BANK_ACCOUNT_ID: 27001, ORG_ID: 401, LEGAL_ENTITY_ID: 201, AR_USE_ENABLE_FLAG: 'Y', AP_USE_ENABLE_FLAG: 'Y', PRIMARY_FLAG: 'Y' } }
  ],
  AR_RECEIPT_METHOD_ACCOUNTS_ALL: [
    { createdAtStep: 0, data: { RECEIPT_METHOD_ID: 26001, REMIT_BANK_ACCT_USE_ID: 28001, ORG_ID: 401, CASH_CCID: 1001, UNAPPLIED_CCID: 2009, ON_ACCOUNT_CCID: 2009, UNIDENTIFIED_CCID: 2009, REMITTANCE_CCID: 1001 } }
  ],

  // === D. ARトランザクション・税金・入金・消込 ===
  RA_CUSTOMER_TRX_ALL: [
    {
      createdAtStep: 1,
      data: {
        CUSTOMER_TRX_ID: 50001, TRX_NUMBER: 'INV-2026-0001', TRX_DATE: '2026-11-15',
        CUST_TRX_TYPE_SEQ_ID: 21001, BATCH_SOURCE_SEQ_ID: 20001,
        BILL_TO_CUSTOMER_ID: 11001, BILL_TO_SITE_USE_ID: 13001, TERM_ID: 22001,
        INVOICE_CURRENCY_CODE: 'JPY', COMPLETE_FLAG: 'N',
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001, LEGAL_ENTITY_ID: 201
      },
      updates: {
        2: { COMPLETE_FLAG: 'Y' }
      }
    }
  ],
  RA_CUSTOMER_TRX_LINES_ALL: [
    {
      createdAtStep: 1,
      data: {
        CUSTOMER_TRX_LINE_ID: 51001, CUSTOMER_TRX_ID: 50001, LINE_NUMBER: 1, LINE_TYPE: 'LINE',
        DESCRIPTION: 'クラウドERPライセンス・保守 (標準税率10%)', MEMO_LINE_SEQ_ID: 23001,
        QUANTITY_INVOICED: 1, UNIT_SELLING_PRICE: 100000, EXTENDED_AMOUNT: 100000, REVENUE_AMOUNT: 100000,
        TAX_CLASSIFICATION_CODE: 'JP_OUT_10', VAT_TAX_ID: null, LINK_TO_CUST_TRX_LINE_ID: null, TAX_LINE_ID: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    },
    {
      createdAtStep: 1,
      data: {
        CUSTOMER_TRX_LINE_ID: 51002, CUSTOMER_TRX_ID: 50001, LINE_NUMBER: 2, LINE_TYPE: 'LINE',
        DESCRIPTION: '軽減税率対象飲食料品パック (軽減税率8%)', MEMO_LINE_SEQ_ID: 23002,
        QUANTITY_INVOICED: 1, UNIT_SELLING_PRICE: 50000, EXTENDED_AMOUNT: 50000, REVENUE_AMOUNT: 50000,
        TAX_CLASSIFICATION_CODE: 'JP_OUT_8', VAT_TAX_ID: null, LINK_TO_CUST_TRX_LINE_ID: null, TAX_LINE_ID: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    },
    {
      createdAtStep: 1,
      data: {
        CUSTOMER_TRX_LINE_ID: 51003, CUSTOMER_TRX_ID: 50001, LINE_NUMBER: 1, LINE_TYPE: 'TAX',
        DESCRIPTION: '消費税 10% (標準税率)', MEMO_LINE_SEQ_ID: null,
        QUANTITY_INVOICED: null, UNIT_SELLING_PRICE: null, EXTENDED_AMOUNT: 10000, REVENUE_AMOUNT: null,
        TAX_CLASSIFICATION_CODE: 'JP_OUT_10', VAT_TAX_ID: 24010, LINK_TO_CUST_TRX_LINE_ID: 51001, TAX_LINE_ID: 70001,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    },
    {
      createdAtStep: 1,
      data: {
        CUSTOMER_TRX_LINE_ID: 51004, CUSTOMER_TRX_ID: 50001, LINE_NUMBER: 1, LINE_TYPE: 'TAX',
        DESCRIPTION: '消費税 8% (軽減税率)', MEMO_LINE_SEQ_ID: null,
        QUANTITY_INVOICED: null, UNIT_SELLING_PRICE: null, EXTENDED_AMOUNT: 4000, REVENUE_AMOUNT: null,
        TAX_CLASSIFICATION_CODE: 'JP_OUT_8', VAT_TAX_ID: 24008, LINK_TO_CUST_TRX_LINE_ID: 51002, TAX_LINE_ID: 70002,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      }
    }
  ],
  ZX_LINES: [
    {
      createdAtStep: 1,
      data: {
        TAX_LINE_ID: 70001, APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', EVENT_CLASS_CODE: 'INVOICE',
        TRX_ID: 50001, TRX_LINE_ID: 51001, TRX_LEVEL_TYPE: 'LINE', TAX_LINE_NUMBER: 1,
        TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'STANDARD',
        TAX_RATE_ID: 24010, TAX_RATE_CODE: 'JP_OUT_10', TAX_RATE: 10,
        TAXABLE_AMT: 100000, TAX_AMT: 10000, LINE_AMT: 100000,
        TRX_NUMBER: 'INV-2026-0001', TRX_DATE: '2026-11-15',
        LEDGER_ID: 3001, INTERNAL_ORGANIZATION_ID: 401, LEGAL_ENTITY_ID: 201
      }
    },
    {
      createdAtStep: 1,
      data: {
        TAX_LINE_ID: 70002, APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', EVENT_CLASS_CODE: 'INVOICE',
        TRX_ID: 50001, TRX_LINE_ID: 51002, TRX_LEVEL_TYPE: 'LINE', TAX_LINE_NUMBER: 1,
        TAX_REGIME_CODE: 'JP_CONSUMPTION_TAX', TAX: 'JP_CONSUMPTION_TAX', TAX_STATUS_CODE: 'REDUCED',
        TAX_RATE_ID: 24008, TAX_RATE_CODE: 'JP_OUT_8', TAX_RATE: 8,
        TAXABLE_AMT: 50000, TAX_AMT: 4000, LINE_AMT: 50000,
        TRX_NUMBER: 'INV-2026-0001', TRX_DATE: '2026-11-15',
        LEDGER_ID: 3001, INTERNAL_ORGANIZATION_ID: 401, LEGAL_ENTITY_ID: 201
      }
    }
  ],
  RA_CUST_TRX_LINE_GL_DIST_ALL: [
    {
      createdAtStep: 1,
      data: {
        CUST_TRX_LINE_GL_DIST_ID: 52001, CUSTOMER_TRX_ID: 50001, CUSTOMER_TRX_LINE_ID: null,
        ACCOUNT_CLASS: 'REC', ACCOUNT_SET_FLAG: 'Y', AMOUNT: 164000, ACCTD_AMOUNT: 164000, PERCENT: 100,
        CODE_COMBINATION_ID: 3001, GL_DATE: '2026-11-15', EVENT_ID: null, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null, LATEST_REC_FLAG: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      },
      updates: {
        2: { ACCOUNT_SET_FLAG: 'N', EVENT_ID: 80001, LATEST_REC_FLAG: 'Y' },
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    },
    {
      createdAtStep: 1,
      data: {
        CUST_TRX_LINE_GL_DIST_ID: 52002, CUSTOMER_TRX_ID: 50001, CUSTOMER_TRX_LINE_ID: 51001,
        ACCOUNT_CLASS: 'REV', ACCOUNT_SET_FLAG: 'N', AMOUNT: 100000, ACCTD_AMOUNT: 100000, PERCENT: 100,
        CODE_COMBINATION_ID: 4001, GL_DATE: '2026-11-15', EVENT_ID: null, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null, LATEST_REC_FLAG: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      },
      updates: {
        2: { EVENT_ID: 80001 },
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    },
    {
      createdAtStep: 1,
      data: {
        CUST_TRX_LINE_GL_DIST_ID: 52003, CUSTOMER_TRX_ID: 50001, CUSTOMER_TRX_LINE_ID: 51002,
        ACCOUNT_CLASS: 'REV', ACCOUNT_SET_FLAG: 'N', AMOUNT: 50000, ACCTD_AMOUNT: 50000, PERCENT: 100,
        CODE_COMBINATION_ID: 4002, GL_DATE: '2026-11-15', EVENT_ID: null, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null, LATEST_REC_FLAG: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      },
      updates: {
        2: { EVENT_ID: 80001 },
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    },
    {
      createdAtStep: 1,
      data: {
        CUST_TRX_LINE_GL_DIST_ID: 52004, CUSTOMER_TRX_ID: 50001, CUSTOMER_TRX_LINE_ID: 51003,
        ACCOUNT_CLASS: 'TAX', ACCOUNT_SET_FLAG: 'N', AMOUNT: 10000, ACCTD_AMOUNT: 10000, PERCENT: 100,
        CODE_COMBINATION_ID: 2001, GL_DATE: '2026-11-15', EVENT_ID: null, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null, LATEST_REC_FLAG: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      },
      updates: {
        2: { EVENT_ID: 80001 },
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    },
    {
      createdAtStep: 1,
      data: {
        CUST_TRX_LINE_GL_DIST_ID: 52005, CUSTOMER_TRX_ID: 50001, CUSTOMER_TRX_LINE_ID: 51004,
        ACCOUNT_CLASS: 'TAX', ACCOUNT_SET_FLAG: 'N', AMOUNT: 4000, ACCTD_AMOUNT: 4000, PERCENT: 100,
        CODE_COMBINATION_ID: 2002, GL_DATE: '2026-11-15', EVENT_ID: null, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null, LATEST_REC_FLAG: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      },
      updates: {
        2: { EVENT_ID: 80001 },
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    }
  ],
  AR_PAYMENT_SCHEDULES_ALL: [
    {
      createdAtStep: 2,
      data: {
        PAYMENT_SCHEDULE_ID: 55001, TRX_NUMBER: 'INV-2026-0001', TRX_DATE: '2026-11-15', GL_DATE: '2026-11-15',
        GL_DATE_CLOSED: '4712-12-31', ACTUAL_DATE_CLOSED: '4712-12-31',
        CLASS: 'INV', STATUS: 'OP', CUSTOMER_ID: 11001, CUSTOMER_SITE_USE_ID: 13001,
        CUSTOMER_TRX_ID: 50001, CASH_RECEIPT_ID: null, TERM_ID: 22001, TERMS_SEQUENCE_NUMBER: 1, DUE_DATE: '2026-12-15',
        INVOICE_CURRENCY_CODE: 'JPY', AMOUNT_DUE_ORIGINAL: 164000, AMOUNT_DUE_REMAINING: 164000,
        AMOUNT_LINE_ITEMS_ORIGINAL: 150000, AMOUNT_LINE_ITEMS_REMAINING: 150000,
        TAX_ORIGINAL: 14000, TAX_REMAINING: 14000, AMOUNT_APPLIED: 0, ORG_ID: 401
      },
      updates: {
        4: {
          GL_DATE_CLOSED: '2026-11-20', ACTUAL_DATE_CLOSED: '2026-11-20',
          STATUS: 'CL', AMOUNT_DUE_REMAINING: 0, AMOUNT_LINE_ITEMS_REMAINING: 0,
          TAX_REMAINING: 0, AMOUNT_APPLIED: 164000
        }
      }
    },
    {
      createdAtStep: 3,
      data: {
        PAYMENT_SCHEDULE_ID: 55002, TRX_NUMBER: 'RCPT-2026-0001', TRX_DATE: '2026-11-20', GL_DATE: '2026-11-20',
        GL_DATE_CLOSED: '4712-12-31', ACTUAL_DATE_CLOSED: '4712-12-31',
        CLASS: 'PMT', STATUS: 'OP', CUSTOMER_ID: 11001, CUSTOMER_SITE_USE_ID: 13001,
        CUSTOMER_TRX_ID: null, CASH_RECEIPT_ID: 60001, TERM_ID: null, TERMS_SEQUENCE_NUMBER: 1, DUE_DATE: '2026-11-20',
        INVOICE_CURRENCY_CODE: 'JPY', AMOUNT_DUE_ORIGINAL: -164000, AMOUNT_DUE_REMAINING: -164000,
        AMOUNT_LINE_ITEMS_ORIGINAL: null, AMOUNT_LINE_ITEMS_REMAINING: null,
        TAX_ORIGINAL: null, TAX_REMAINING: null, AMOUNT_APPLIED: 0, ORG_ID: 401
      },
      updates: {
        4: {
          GL_DATE_CLOSED: '2026-11-20', ACTUAL_DATE_CLOSED: '2026-11-20',
          STATUS: 'CL', AMOUNT_DUE_REMAINING: 0, AMOUNT_APPLIED: 164000
        }
      }
    }
  ],
  AR_CASH_RECEIPTS_ALL: [
    {
      createdAtStep: 3,
      data: {
        CASH_RECEIPT_ID: 60001, RECEIPT_NUMBER: 'RCPT-2026-0001', RECEIPT_DATE: '2026-11-20',
        AMOUNT: 164000, CURRENCY_CODE: 'JPY', TYPE: 'CASH', STATUS: 'UNAPP',
        PAY_FROM_CUSTOMER: 11001, CUSTOMER_SITE_USE_ID: 13001,
        RECEIPT_METHOD_ID: 26001, REMIT_BANK_ACCT_USE_ID: 28001,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001, LEGAL_ENTITY_ID: 201
      },
      updates: {
        4: { STATUS: 'APP' }
      }
    }
  ],
  AR_CASH_RECEIPT_HISTORY_ALL: [
    {
      createdAtStep: 3,
      data: {
        CASH_RECEIPT_HISTORY_ID: 61001, CASH_RECEIPT_ID: 60001, STATUS: 'CLEARED',
        TRX_DATE: '2026-11-20', GL_DATE: '2026-11-20', AMOUNT: 164000, ACCTD_AMOUNT: 164000,
        ACCOUNT_CODE_COMBINATION_ID: 1001, CURRENT_RECORD_FLAG: 'Y', POSTABLE_FLAG: 'Y',
        EVENT_ID: 80002, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null, ORG_ID: 401
      },
      updates: {
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    }
  ],
  AR_RECEIVABLE_APPLICATIONS_ALL: [
    {
      createdAtStep: 3,
      data: {
        RECEIVABLE_APPLICATION_ID: 62001, CASH_RECEIPT_ID: 60001, CASH_RECEIPT_HISTORY_ID: 61001,
        PAYMENT_SCHEDULE_ID: 55002, APPLIED_CUSTOMER_TRX_ID: null, APPLIED_PAYMENT_SCHEDULE_ID: null,
        STATUS: 'UNAPP', APPLICATION_TYPE: 'CASH', APPLICATION_RULE: '60.0',
        AMOUNT_APPLIED: 164000, ACCTD_AMOUNT_APPLIED_FROM: 164000, ACCTD_AMOUNT_APPLIED_TO: null,
        LINE_APPLIED: null, TAX_APPLIED: null, APPLY_DATE: '2026-11-20', GL_DATE: '2026-11-20',
        CODE_COMBINATION_ID: 2009, DISPLAY: 'N', EVENT_ID: 80002, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      },
      updates: {
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    },
    {
      createdAtStep: 4,
      data: {
        RECEIVABLE_APPLICATION_ID: 62002, CASH_RECEIPT_ID: 60001, CASH_RECEIPT_HISTORY_ID: 61001,
        PAYMENT_SCHEDULE_ID: 55002, APPLIED_CUSTOMER_TRX_ID: null, APPLIED_PAYMENT_SCHEDULE_ID: null,
        STATUS: 'UNAPP', APPLICATION_TYPE: 'CASH', APPLICATION_RULE: '60.2',
        AMOUNT_APPLIED: -164000, ACCTD_AMOUNT_APPLIED_FROM: -164000, ACCTD_AMOUNT_APPLIED_TO: null,
        LINE_APPLIED: null, TAX_APPLIED: null, APPLY_DATE: '2026-11-20', GL_DATE: '2026-11-20',
        CODE_COMBINATION_ID: 2009, DISPLAY: 'N', EVENT_ID: 80003, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      },
      updates: {
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    },
    {
      createdAtStep: 4,
      data: {
        RECEIVABLE_APPLICATION_ID: 62003, CASH_RECEIPT_ID: 60001, CASH_RECEIPT_HISTORY_ID: 61001,
        PAYMENT_SCHEDULE_ID: 55002, APPLIED_CUSTOMER_TRX_ID: 50001, APPLIED_PAYMENT_SCHEDULE_ID: 55001,
        STATUS: 'APP', APPLICATION_TYPE: 'CASH', APPLICATION_RULE: '60.1',
        AMOUNT_APPLIED: 164000, ACCTD_AMOUNT_APPLIED_FROM: 164000, ACCTD_AMOUNT_APPLIED_TO: 164000,
        LINE_APPLIED: 150000, TAX_APPLIED: 14000, APPLY_DATE: '2026-11-20', GL_DATE: '2026-11-20',
        CODE_COMBINATION_ID: 3001, DISPLAY: 'Y', EVENT_ID: 80003, POSTING_CONTROL_ID: -3, GL_POSTED_DATE: null,
        ORG_ID: 401, SET_OF_BOOKS_ID: 3001
      },
      updates: {
        5: { POSTING_CONTROL_ID: 9001, GL_POSTED_DATE: '2026-11-20' }
      }
    }
  ],
  AR_DISTRIBUTIONS_ALL: [
    { createdAtStep: 3, data: { LINE_ID: 63001, SOURCE_ID: 61001, SOURCE_TABLE: 'CRH', SOURCE_TYPE: 'CASH', CODE_COMBINATION_ID: 1001, AMOUNT_DR: 164000, AMOUNT_CR: null, ACCTD_AMOUNT_DR: 164000, ACCTD_AMOUNT_CR: null, CURRENCY_CODE: 'JPY', ORG_ID: 401 } },
    { createdAtStep: 3, data: { LINE_ID: 63002, SOURCE_ID: 62001, SOURCE_TABLE: 'RA', SOURCE_TYPE: 'UNAPP', CODE_COMBINATION_ID: 2009, AMOUNT_DR: null, AMOUNT_CR: 164000, ACCTD_AMOUNT_DR: null, ACCTD_AMOUNT_CR: 164000, CURRENCY_CODE: 'JPY', ORG_ID: 401 } },
    { createdAtStep: 4, data: { LINE_ID: 63003, SOURCE_ID: 62002, SOURCE_TABLE: 'RA', SOURCE_TYPE: 'UNAPP', CODE_COMBINATION_ID: 2009, AMOUNT_DR: 164000, AMOUNT_CR: null, ACCTD_AMOUNT_DR: 164000, ACCTD_AMOUNT_CR: null, CURRENCY_CODE: 'JPY', ORG_ID: 401 } },
    { createdAtStep: 4, data: { LINE_ID: 63004, SOURCE_ID: 62003, SOURCE_TABLE: 'RA', SOURCE_TYPE: 'REC', CODE_COMBINATION_ID: 3001, AMOUNT_DR: null, AMOUNT_CR: 164000, ACCTD_AMOUNT_DR: null, ACCTD_AMOUNT_CR: 164000, CURRENCY_CODE: 'JPY', ORG_ID: 401 } }
  ],

  // === E. SLA (Subledger Accounting) ===
  XLA_TRANSACTION_ENTITIES: [
    { createdAtStep: 2, data: { ENTITY_ID: 90001, APPLICATION_ID: 222, LEGAL_ENTITY_ID: 201, ENTITY_CODE: 'TRANSACTIONS', SOURCE_ID_INT_1: 50001, TRANSACTION_NUMBER: 'INV-2026-0001', LEDGER_ID: 3001 } },
    { createdAtStep: 3, data: { ENTITY_ID: 90002, APPLICATION_ID: 222, LEGAL_ENTITY_ID: 201, ENTITY_CODE: 'RECEIPTS', SOURCE_ID_INT_1: 60001, TRANSACTION_NUMBER: 'RCPT-2026-0001', LEDGER_ID: 3001 } }
  ],
  XLA_EVENTS: [
    {
      createdAtStep: 2,
      data: { EVENT_ID: 80001, APPLICATION_ID: 222, ENTITY_ID: 90001, EVENT_TYPE_CODE: 'INV_CREATE', EVENT_NUMBER: 1, EVENT_DATE: '2026-11-15', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U', ON_HOLD_FLAG: 'N', TRANSACTION_DATE: '2026-11-15' },
      updates: { 5: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } }
    },
    {
      createdAtStep: 3,
      data: { EVENT_ID: 80002, APPLICATION_ID: 222, ENTITY_ID: 90002, EVENT_TYPE_CODE: 'RECP_CREATE', EVENT_NUMBER: 1, EVENT_DATE: '2026-11-20', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U', ON_HOLD_FLAG: 'N', TRANSACTION_DATE: '2026-11-20' },
      updates: { 5: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } }
    },
    {
      createdAtStep: 4,
      data: { EVENT_ID: 80003, APPLICATION_ID: 222, ENTITY_ID: 90002, EVENT_TYPE_CODE: 'RECP_UPDATE', EVENT_NUMBER: 2, EVENT_DATE: '2026-11-20', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U', ON_HOLD_FLAG: 'N', TRANSACTION_DATE: '2026-11-20' },
      updates: { 5: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } }
    }
  ],
  XLA_AE_HEADERS: [
    {
      createdAtStep: 5,
      data: { AE_HEADER_ID: 81001, APPLICATION_ID: 222, LEDGER_ID: 3001, ENTITY_ID: 90001, EVENT_ID: 80001, EVENT_TYPE_CODE: 'INV_CREATE', ACCOUNTING_DATE: '2026-11-15', GL_TRANSFER_STATUS_CODE: 'N', GL_TRANSFER_DATE: null, JE_CATEGORY_NAME: 'Sales Invoices', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A', PERIOD_NAME: '2026-11' },
      updates: { 6: { GL_TRANSFER_STATUS_CODE: 'Y', GL_TRANSFER_DATE: '2026-11-20' } }
    },
    {
      createdAtStep: 5,
      data: { AE_HEADER_ID: 81002, APPLICATION_ID: 222, LEDGER_ID: 3001, ENTITY_ID: 90002, EVENT_ID: 80002, EVENT_TYPE_CODE: 'RECP_CREATE', ACCOUNTING_DATE: '2026-11-20', GL_TRANSFER_STATUS_CODE: 'N', GL_TRANSFER_DATE: null, JE_CATEGORY_NAME: 'Receipts', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A', PERIOD_NAME: '2026-11' },
      updates: { 6: { GL_TRANSFER_STATUS_CODE: 'Y', GL_TRANSFER_DATE: '2026-11-20' } }
    },
    {
      createdAtStep: 5,
      data: { AE_HEADER_ID: 81003, APPLICATION_ID: 222, LEDGER_ID: 3001, ENTITY_ID: 90002, EVENT_ID: 80003, EVENT_TYPE_CODE: 'RECP_UPDATE', ACCOUNTING_DATE: '2026-11-20', GL_TRANSFER_STATUS_CODE: 'N', GL_TRANSFER_DATE: null, JE_CATEGORY_NAME: 'Receipts', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A', PERIOD_NAME: '2026-11' },
      updates: { 6: { GL_TRANSFER_STATUS_CODE: 'Y', GL_TRANSFER_DATE: '2026-11-20' } }
    }
  ],
  XLA_AE_LINES: [
    { createdAtStep: 5, data: { AE_HEADER_ID: 81001, AE_LINE_NUM: 1, APPLICATION_ID: 222, CODE_COMBINATION_ID: 3001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85001, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'RECEIVABLE', ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '請求計上 売掛金 INV-2026-0001' } },
    { createdAtStep: 5, data: { AE_HEADER_ID: 81001, AE_LINE_NUM: 2, APPLICATION_ID: 222, CODE_COMBINATION_ID: 4001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85002, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'REVENUE', ENTERED_DR: null, ENTERED_CR: 100000, ACCOUNTED_DR: null, ACCOUNTED_CR: 100000, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '売上計上 明細1(10%対象)' } },
    { createdAtStep: 5, data: { AE_HEADER_ID: 81001, AE_LINE_NUM: 3, APPLICATION_ID: 222, CODE_COMBINATION_ID: 4002, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85003, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'REVENUE', ENTERED_DR: null, ENTERED_CR: 50000, ACCOUNTED_DR: null, ACCOUNTED_CR: 50000, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '売上計上 明細2(8%軽減対象)' } },
    { createdAtStep: 5, data: { AE_HEADER_ID: 81001, AE_LINE_NUM: 4, APPLICATION_ID: 222, CODE_COMBINATION_ID: 2001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85004, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'TAX', ENTERED_DR: null, ENTERED_CR: 10000, ACCOUNTED_DR: null, ACCOUNTED_CR: 10000, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '仮受消費税(標準10%) 明細1' } },
    { createdAtStep: 5, data: { AE_HEADER_ID: 81001, AE_LINE_NUM: 5, APPLICATION_ID: 222, CODE_COMBINATION_ID: 2002, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85005, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'TAX', ENTERED_DR: null, ENTERED_CR: 4000, ACCOUNTED_DR: null, ACCOUNTED_CR: 4000, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '仮受消費税(軽減8%) 明細2' } },
    { createdAtStep: 5, data: { AE_HEADER_ID: 81002, AE_LINE_NUM: 1, APPLICATION_ID: 222, CODE_COMBINATION_ID: 1001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85006, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'CASH', ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '銀行入金 普通預金 RCPT-2026-0001' } },
    { createdAtStep: 5, data: { AE_HEADER_ID: 81002, AE_LINE_NUM: 2, APPLICATION_ID: 222, CODE_COMBINATION_ID: 2009, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85007, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'UNAPPLIED_CASH', ENTERED_DR: null, ENTERED_CR: 164000, ACCOUNTED_DR: null, ACCOUNTED_CR: 164000, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '未消込入金計上 仮受金' } },
    { createdAtStep: 5, data: { AE_HEADER_ID: 81003, AE_LINE_NUM: 1, APPLICATION_ID: 222, CODE_COMBINATION_ID: 2009, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85008, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'UNAPPLIED_CASH', ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '未消込入金振替(消込による取消)' } },
    { createdAtStep: 5, data: { AE_HEADER_ID: 81003, AE_LINE_NUM: 2, APPLICATION_ID: 222, CODE_COMBINATION_ID: 3001, GL_TRANSFER_MODE_CODE: 'D', GL_SL_LINK_ID: 85009, GL_SL_LINK_TABLE: 'XLAJEL', ACCOUNTING_CLASS_CODE: 'RECEIVABLE', ENTERED_DR: null, ENTERED_CR: 164000, ACCOUNTED_DR: null, ACCOUNTED_CR: 164000, CURRENCY_CODE: 'JPY', PARTY_ID: 10001, PARTY_SITE_ID: 10501, DESCRIPTION: '売掛金消込 INV-2026-0001充当' } }
  ],
  XLA_DISTRIBUTION_LINKS: [
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80001, AE_HEADER_ID: 81001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 52001, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', ROUNDING_CLASS_CODE: 'RECEIVABLE', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: 164000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80001, AE_HEADER_ID: 81001, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 52002, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', ROUNDING_CLASS_CODE: 'REVENUE', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 100000 } },
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80001, AE_HEADER_ID: 81001, AE_LINE_NUM: 3, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 52003, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', ROUNDING_CLASS_CODE: 'REVENUE', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 50000 } },
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80001, AE_HEADER_ID: 81001, AE_LINE_NUM: 4, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 52004, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', ROUNDING_CLASS_CODE: 'TAX', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 10000 } },
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80001, AE_HEADER_ID: 81001, AE_LINE_NUM: 5, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 52005, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', ROUNDING_CLASS_CODE: 'TAX', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 4000 } },
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80002, AE_HEADER_ID: 81002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 63001, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'RECEIPT', EVENT_TYPE_CODE: 'RECP_CREATE', ROUNDING_CLASS_CODE: 'CASH', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: 164000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80002, AE_HEADER_ID: 81002, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 63002, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'RECEIPT', EVENT_TYPE_CODE: 'RECP_CREATE', ROUNDING_CLASS_CODE: 'UNAPPLIED_CASH', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 164000 } },
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80003, AE_HEADER_ID: 81003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 63003, APPLIED_TO_SOURCE_ID_NUM_1: null, EVENT_CLASS_CODE: 'RECEIPT', EVENT_TYPE_CODE: 'RECP_UPDATE', ROUNDING_CLASS_CODE: 'UNAPPLIED_CASH', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: 164000, UNROUNDED_ACCOUNTED_CR: null } },
    { createdAtStep: 5, data: { APPLICATION_ID: 222, EVENT_ID: 80003, AE_HEADER_ID: 81003, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 63004, APPLIED_TO_SOURCE_ID_NUM_1: 50001, EVENT_CLASS_CODE: 'RECEIPT', EVENT_TYPE_CODE: 'RECP_UPDATE', ROUNDING_CLASS_CODE: 'RECEIVABLE', MERGE_DUPLICATE_CODE: 'N', UNROUNDED_ACCOUNTED_DR: null, UNROUNDED_ACCOUNTED_CR: 164000 } }
  ],

  // === F. GL (General Ledger) ===
  GL_INTERFACE: [
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-15', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Sales Invoices', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 3001, ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, GROUP_ID: 94001, GL_SL_LINK_ID: 85001, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-15', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Sales Invoices', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 4001, ENTERED_DR: null, ENTERED_CR: 100000, ACCOUNTED_DR: null, ACCOUNTED_CR: 100000, GROUP_ID: 94001, GL_SL_LINK_ID: 85002, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-15', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Sales Invoices', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 4002, ENTERED_DR: null, ENTERED_CR: 50000, ACCOUNTED_DR: null, ACCOUNTED_CR: 50000, GROUP_ID: 94001, GL_SL_LINK_ID: 85003, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-15', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Sales Invoices', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 2001, ENTERED_DR: null, ENTERED_CR: 10000, ACCOUNTED_DR: null, ACCOUNTED_CR: 10000, GROUP_ID: 94001, GL_SL_LINK_ID: 85004, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-15', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Sales Invoices', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 2002, ENTERED_DR: null, ENTERED_CR: 4000, ACCOUNTED_DR: null, ACCOUNTED_CR: 4000, GROUP_ID: 94001, GL_SL_LINK_ID: 85005, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-20', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Receipts', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 1001, ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, GROUP_ID: 94001, GL_SL_LINK_ID: 85006, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-20', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Receipts', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 2009, ENTERED_DR: null, ENTERED_CR: 164000, ACCOUNTED_DR: null, ACCOUNTED_CR: 164000, GROUP_ID: 94001, GL_SL_LINK_ID: 85007, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-20', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Receipts', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 2009, ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, GROUP_ID: 94001, GL_SL_LINK_ID: 85008, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { STATUS: 'PROCESSED', LEDGER_ID: 3001, ACCOUNTING_DATE: '2026-11-20', CURRENCY_CODE: 'JPY', DATE_CREATED: '2026-11-20', ACTUAL_FLAG: 'A', USER_JE_CATEGORY_NAME: 'Receipts', USER_JE_SOURCE_NAME: 'Receivables', CODE_COMBINATION_ID: 3001, ENTERED_DR: null, ENTERED_CR: 164000, ACCOUNTED_DR: null, ACCOUNTED_CR: 164000, GROUP_ID: 94001, GL_SL_LINK_ID: 85009, GL_SL_LINK_TABLE: 'XLAJEL' } }
  ],
  GL_JE_BATCHES: [
    {
      createdAtStep: 6,
      data: {
        JE_BATCH_ID: 95001, NAME: 'Receivables A 94001 2026-11-20', STATUS: 'U',
        DEFAULT_PERIOD_NAME: '2026-11', POSTED_DATE: null,
        RUNNING_TOTAL_DR: 492000, RUNNING_TOTAL_CR: 492000,
        CHART_OF_ACCOUNTS_ID: 101, PERIOD_SET_NAME: 'JP_CALENDAR', ACCOUNTED_PERIOD_TYPE: 'MONTH', ACTUAL_FLAG: 'A'
      },
      updates: { 7: { STATUS: 'P', POSTED_DATE: '2026-11-20' } }
    }
  ],
  GL_JE_HEADERS: [
    {
      createdAtStep: 6,
      data: {
        JE_HEADER_ID: 96001, JE_BATCH_ID: 95001, LEDGER_ID: 3001,
        JE_CATEGORY: 'Sales Invoices', JE_SOURCE: 'Receivables', PERIOD_NAME: '2026-11',
        NAME: 'Sales Invoices JPY', CURRENCY_CODE: 'JPY', STATUS: 'U',
        DATE_CREATED: '2026-11-20', POSTED_DATE: null, ACTUAL_FLAG: 'A',
        RUNNING_TOTAL_DR: 164000, RUNNING_TOTAL_CR: 164000
      },
      updates: { 7: { STATUS: 'P', POSTED_DATE: '2026-11-20' } }
    },
    {
      createdAtStep: 6,
      data: {
        JE_HEADER_ID: 96002, JE_BATCH_ID: 95001, LEDGER_ID: 3001,
        JE_CATEGORY: 'Receipts', JE_SOURCE: 'Receivables', PERIOD_NAME: '2026-11',
        NAME: 'Receipts JPY', CURRENCY_CODE: 'JPY', STATUS: 'U',
        DATE_CREATED: '2026-11-20', POSTED_DATE: null, ACTUAL_FLAG: 'A',
        RUNNING_TOTAL_DR: 328000, RUNNING_TOTAL_CR: 328000
      },
      updates: { 7: { STATUS: 'P', POSTED_DATE: '2026-11-20' } }
    }
  ],
  GL_JE_LINES: [
    { createdAtStep: 6, data: { JE_HEADER_ID: 96001, JE_LINE_NUM: 1, LEDGER_ID: 3001, CODE_COMBINATION_ID: 3001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-15', STATUS: 'U', ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, DESCRIPTION: '請求計上 売掛金 INV-2026-0001' }, updates: { 7: { STATUS: 'P' } } },
    { createdAtStep: 6, data: { JE_HEADER_ID: 96001, JE_LINE_NUM: 2, LEDGER_ID: 3001, CODE_COMBINATION_ID: 4001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-15', STATUS: 'U', ENTERED_DR: null, ENTERED_CR: 100000, ACCOUNTED_DR: null, ACCOUNTED_CR: 100000, DESCRIPTION: '売上計上 明細1(10%対象)' }, updates: { 7: { STATUS: 'P' } } },
    { createdAtStep: 6, data: { JE_HEADER_ID: 96001, JE_LINE_NUM: 3, LEDGER_ID: 3001, CODE_COMBINATION_ID: 4002, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-15', STATUS: 'U', ENTERED_DR: null, ENTERED_CR: 50000, ACCOUNTED_DR: null, ACCOUNTED_CR: 50000, DESCRIPTION: '売上計上 明細2(8%軽減対象)' }, updates: { 7: { STATUS: 'P' } } },
    { createdAtStep: 6, data: { JE_HEADER_ID: 96001, JE_LINE_NUM: 4, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-15', STATUS: 'U', ENTERED_DR: null, ENTERED_CR: 10000, ACCOUNTED_DR: null, ACCOUNTED_CR: 10000, DESCRIPTION: '仮受消費税(標準10%) 明細1' }, updates: { 7: { STATUS: 'P' } } },
    { createdAtStep: 6, data: { JE_HEADER_ID: 96001, JE_LINE_NUM: 5, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2002, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-15', STATUS: 'U', ENTERED_DR: null, ENTERED_CR: 4000, ACCOUNTED_DR: null, ACCOUNTED_CR: 4000, DESCRIPTION: '仮受消費税(軽減8%) 明細2' }, updates: { 7: { STATUS: 'P' } } },
    { createdAtStep: 6, data: { JE_HEADER_ID: 96002, JE_LINE_NUM: 1, LEDGER_ID: 3001, CODE_COMBINATION_ID: 1001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-20', STATUS: 'U', ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, DESCRIPTION: '銀行入金 普通預金 RCPT-2026-0001' }, updates: { 7: { STATUS: 'P' } } },
    { createdAtStep: 6, data: { JE_HEADER_ID: 96002, JE_LINE_NUM: 2, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2009, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-20', STATUS: 'U', ENTERED_DR: null, ENTERED_CR: 164000, ACCOUNTED_DR: null, ACCOUNTED_CR: 164000, DESCRIPTION: '未消込入金計上 仮受金' }, updates: { 7: { STATUS: 'P' } } },
    { createdAtStep: 6, data: { JE_HEADER_ID: 96002, JE_LINE_NUM: 3, LEDGER_ID: 3001, CODE_COMBINATION_ID: 2009, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-20', STATUS: 'U', ENTERED_DR: 164000, ENTERED_CR: null, ACCOUNTED_DR: 164000, ACCOUNTED_CR: null, DESCRIPTION: '未消込入金振替(消込による取消)' }, updates: { 7: { STATUS: 'P' } } },
    { createdAtStep: 6, data: { JE_HEADER_ID: 96002, JE_LINE_NUM: 4, LEDGER_ID: 3001, CODE_COMBINATION_ID: 3001, PERIOD_NAME: '2026-11', EFFECTIVE_DATE: '2026-11-20', STATUS: 'U', ENTERED_DR: null, ENTERED_CR: 164000, ACCOUNTED_DR: null, ACCOUNTED_CR: 164000, DESCRIPTION: '売掛金消込 INV-2026-0001充当' }, updates: { 7: { STATUS: 'P' } } }
  ],
  GL_IMPORT_REFERENCES: [
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96001, JE_LINE_NUM: 1, REFERENCE_5: '90001', REFERENCE_6: '80001', REFERENCE_7: '81001', GL_SL_LINK_ID: 85001, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96001, JE_LINE_NUM: 2, REFERENCE_5: '90001', REFERENCE_6: '80001', REFERENCE_7: '81001', GL_SL_LINK_ID: 85002, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96001, JE_LINE_NUM: 3, REFERENCE_5: '90001', REFERENCE_6: '80001', REFERENCE_7: '81001', GL_SL_LINK_ID: 85003, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96001, JE_LINE_NUM: 4, REFERENCE_5: '90001', REFERENCE_6: '80001', REFERENCE_7: '81001', GL_SL_LINK_ID: 85004, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96001, JE_LINE_NUM: 5, REFERENCE_5: '90001', REFERENCE_6: '80001', REFERENCE_7: '81001', GL_SL_LINK_ID: 85005, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96002, JE_LINE_NUM: 1, REFERENCE_5: '90002', REFERENCE_6: '80002', REFERENCE_7: '81002', GL_SL_LINK_ID: 85006, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96002, JE_LINE_NUM: 2, REFERENCE_5: '90002', REFERENCE_6: '80002', REFERENCE_7: '81002', GL_SL_LINK_ID: 85007, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96002, JE_LINE_NUM: 3, REFERENCE_5: '90002', REFERENCE_6: '80003', REFERENCE_7: '81003', GL_SL_LINK_ID: 85008, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { createdAtStep: 6, data: { JE_BATCH_ID: 95001, JE_HEADER_ID: 96002, JE_LINE_NUM: 4, REFERENCE_5: '90002', REFERENCE_6: '80003', REFERENCE_7: '81003', GL_SL_LINK_ID: 85009, GL_SL_LINK_TABLE: 'XLAJEL' } }
  ],
  GL_BALANCES: [
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 1001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 7: { PERIOD_NET_DR: 164000 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 3001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 7: { PERIOD_NET_DR: 164000, PERIOD_NET_CR: 164000 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 2009, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 7: { PERIOD_NET_DR: 164000, PERIOD_NET_CR: 164000 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 2001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 7: { PERIOD_NET_CR: 10000 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 2002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 7: { PERIOD_NET_CR: 4000 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 4001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 7: { PERIOD_NET_CR: 100000 } } },
    { createdAtStep: 0, data: { LEDGER_ID: 3001, CODE_COMBINATION_ID: 4002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-11', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 0 }, updates: { 7: { PERIOD_NET_CR: 50000 } } }
  ]
};

const STEPS = [
  {
    id: 0,
    code: 'STEP 0',
    shortTitle: 'マスタ事前準備',
    title: 'ステップ0：マスタ・企業構造・AFF・顧客・税率・銀行セットアップ',
    subTitle: '事前準備（企業構造 / TCA / AR / Fusion Tax / CE / GLマスタ）',
    dateLabel: '2026-11-01',
    description: [
      'ARトランザクションからGL転記までの業務プロセスを実行する前に、Oracle Fusion ERPの基盤となる22のマスタテーブルおよび期首のGL_BALANCES（残高0）がセットアップされている状態を確認します。',
      '法的エンティティ（XLE_ENTITY_PROFILES）、プライマリ元帳（GL_LEDGERS）、ビジネスユニット（FUN_ALL_BUSINESS_UNITS_V）が紐付き、会計期間 2026-11 がAR(222)・GL(101)双方でオープン（CLOSING_STATUS = "O"）されています。',
      'AFF体系は9セグメント（会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3）で定義され、普通預金(1001)、売掛金(3001)、仮受金(2009)、仮受消費税10%(2001)/8%(2002)、売上高10%(4001)/8%(4002)の7組合せが GL_CODE_COMBINATIONS に登録済みです。'
    ],
    flagChanges: [
      { table: 'GL_PERIOD_STATUSES', key: 'APP=222, 101 / 2026-11', column: 'CLOSING_STATUS', before: '-', after: 'O (Open)', note: 'ARとGL両方の会計期間がオープン状態' },
      { table: 'ZX_RATES_B', key: '24010 / 24008', column: 'PERCENTAGE_RATE', before: '-', after: '10% / 8%', note: '標準税率10%と軽減税率8%の税率マスタ有効化' },
      { table: 'AR_RECEIPT_CLASSES', key: '25001', column: 'CLEAR_FLAG', before: '-', after: 'N', note: '即時決済クラスのため入金登録時にCLEARED生成' }
    ],
    journalPreview: [],
    activeTables: {
      inserted: [
        'XLE_ENTITY_PROFILES', 'GL_LEDGERS', 'FUN_ALL_BUSINESS_UNITS_V', 'GL_PERIOD_STATUSES', 'FND_KF_STR_INSTANCES_B', 'GL_CODE_COMBINATIONS',
        'HZ_PARTIES', 'HZ_CUST_ACCOUNTS', 'HZ_CUST_ACCT_SITES_ALL', 'HZ_CUST_SITE_USES_ALL',
        'AR_SYSTEM_PARAMETERS_ALL', 'RA_BATCH_SOURCES_ALL', 'RA_CUST_TRX_TYPES_ALL', 'RA_TERMS_B', 'RA_TERMS_LINES', 'AR_MEMO_LINES_ALL_B', 'ZX_RATES_B', 'AR_RECEIPT_CLASSES', 'AR_RECEIPT_METHODS', 'CE_BANK_ACCOUNTS', 'CE_BANK_ACCT_USES_ALL', 'AR_RECEIPT_METHOD_ACCOUNTS_ALL',
        'GL_BALANCES'
      ],
      updated: [],
      referenced: []
    },
    flowEdges: [
      { from: 'XLE_ENTITY_PROFILES', to: 'FUN_ALL_BUSINESS_UNITS_V', label: 'LE→BU紐付', type: 'insert' },
      { from: 'GL_LEDGERS', to: 'FUN_ALL_BUSINESS_UNITS_V', label: '元帳設定', type: 'insert' },
      { from: 'FND_KF_STR_INSTANCES_B', to: 'GL_CODE_COMBINATIONS', label: '9セグメントAFF', type: 'insert' },
      { from: 'HZ_PARTIES', to: 'HZ_CUST_ACCOUNTS', label: '顧客口座', type: 'insert' },
      { from: 'CE_BANK_ACCOUNTS', to: 'AR_RECEIPT_METHOD_ACCOUNTS_ALL', label: '入金銀行勘定', type: 'insert' }
    ]
  },
  {
    id: 1,
    code: 'STEP 1',
    shortTitle: 'ARトランザクション作成',
    title: 'ステップ1：ARトランザクション作成（下書保存・税計算・仮配賦生成）',
    subTitle: '請求書の作成 (Create Transaction) / Fusion Tax / AutoAccounting',
    dateLabel: '2026-11-15',
    description: [
      '顧客（株式会社ジャパンコマース: CUST_ACCOUNT_ID=11001）向けに請求書 INV-2026-0001 を新規作成し保存します（この時点では未完了・下書き状態のため RA_CUSTOMER_TRX_ALL.COMPLETE_FLAG = "N" です）。',
      '請求書明細は2本作成されます。明細1（100,000円）には標準税率10%（JP_OUT_10）、明細2（50,000円）には軽減税率8%（JP_OUT_8）が指定され、Fusion Taxエンジンが ZX_LINES に税額 10,000円と 4,000円を計算・格納し、RA_CUSTOMER_TRX_LINES_ALL にも LINE_TYPE="TAX" の2行が自動生成されます（請求合計：164,000円）。',
      '同時に AutoAccounting が働き、RA_CUST_TRX_LINE_GL_DIST_ALL に5行の配賦を作成します。下書き状態のため、REC（売掛金）行は仮配賦を示す ACCOUNT_SET_FLAG="Y"・LATEST_REC_FLAG=NULL となっており、支払予定やSLAイベントはまだ作成されません。'
    ],
    flagChanges: [
      { table: 'RA_CUSTOMER_TRX_ALL', key: '50001 (INV-2026-0001)', column: 'COMPLETE_FLAG', before: '(新規)', after: 'N (未完了)', note: '下書き保存。債権・支払予定はまだ未生成' },
      { table: 'RA_CUSTOMER_TRX_LINES_ALL', key: '51001〜51004', column: 'EXTENDED_AMOUNT', before: '(新規)', after: '100,000 / 50,000 / 10,000 / 4,000', note: '品目2行＋税明細2行 (10%と8%) の計4行を作成' },
      { table: 'ZX_LINES', key: '70001 / 70002', column: 'TAX_AMT', before: '(新規)', after: '10,000 (10%) / 4,000 (8%)', note: 'TRX_ID=50001 に対して税率別に詳細税行を作成' },
      { table: 'RA_CUST_TRX_LINE_GL_DIST_ALL', key: '52001 (REC行)', column: 'ACCOUNT_SET_FLAG', before: '(新規)', after: 'Y (仮状態)', note: 'POSTING_CONTROL_ID=-3 (未転記), EVENT_ID=NULL' }
    ],
    journalPreview: [
      { note: '※まだ下書き(COMPLETE_FLAG=N)のため会計イベント未発生。AutoAccountingにより下記配賦(仮)を準備：', lines: [
        { side: 'DR', ccid: 3001, name: '売掛金 (仮: ACCOUNT_SET_FLAG=Y)', amount: 164000 },
        { side: 'CR', ccid: 4001, name: '売上高 (明細1: 10%対象)', amount: 100000 },
        { side: 'CR', ccid: 4002, name: '売上高 (明細2: 8%軽減対象)', amount: 50000 },
        { side: 'CR', ccid: 2001, name: '仮受消費税 (10%)', amount: 10000 },
        { side: 'CR', ccid: 2002, name: '仮受消費税 (8%軽減)', amount: 4000 }
      ]}
    ],
    activeTables: {
      inserted: ['RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'ZX_LINES', 'RA_CUST_TRX_LINE_GL_DIST_ALL'],
      updated: [],
      referenced: ['HZ_CUST_ACCOUNTS', 'HZ_CUST_SITE_USES_ALL', 'RA_CUST_TRX_TYPES_ALL', 'RA_BATCH_SOURCES_ALL', 'RA_TERMS_B', 'AR_MEMO_LINES_ALL_B', 'ZX_RATES_B', 'GL_CODE_COMBINATIONS', 'AR_SYSTEM_PARAMETERS_ALL']
    },
    flowEdges: [
      { from: 'HZ_CUST_ACCOUNTS', to: 'RA_CUSTOMER_TRX_ALL', label: '顧客情報', type: 'ref' },
      { from: 'RA_CUST_TRX_TYPES_ALL', to: 'RA_CUSTOMER_TRX_ALL', label: '取引タイプ', type: 'ref' },
      { from: 'AR_MEMO_LINES_ALL_B', to: 'RA_CUSTOMER_TRX_LINES_ALL', label: '品目・売上CCID', type: 'ref' },
      { from: 'RA_CUSTOMER_TRX_ALL', to: 'RA_CUSTOMER_TRX_LINES_ALL', label: '明細4行 INSERT', type: 'insert' },
      { from: 'ZX_RATES_B', to: 'ZX_LINES', label: '10%/8%税率適用', type: 'ref' },
      { from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'ZX_LINES', label: '税計算 INSERT', type: 'insert' },
      { from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', label: '配賦5行 INSERT', type: 'insert' }
    ]
  },
  {
    id: 2,
    code: 'STEP 2',
    shortTitle: 'AR請求完了(確定)',
    title: 'ステップ2：ARトランザクション完了（請求確定・支払予定生成・SLAイベント発生）',
    subTitle: '請求書「完了 (Complete)」実行',
    dateLabel: '2026-11-15',
    description: [
      '請求書画面で「完了 (Complete)」を押下すると、RA_CUSTOMER_TRX_ALL.COMPLETE_FLAG が "N" から "Y" に更新され、請求書が法的に確定します。',
      '同時に RA_CUST_TRX_LINE_GL_DIST_ALL の REC行(52001) が ACCOUNT_SET_FLAG: "Y"→"N", LATEST_REC_FLAG: NULL→"Y" に更新され、5本すべての配賦行に SLAイベントID (EVENT_ID = 80001) が割り当てられます。',
      '支払条件(30日後)に基づき AR_PAYMENT_SCHEDULES_ALL に請求書債権レコード(55001, CLASS="INV", STATUS="OP", 残高=164,000円) が作成され、SLA側には XLA_TRANSACTION_ENTITIES(90001) と XLA_EVENTS(80001, INV_CREATE, ステータス="U") が生成されます。'
    ],
    flagChanges: [
      { table: 'RA_CUSTOMER_TRX_ALL', key: '50001', column: 'COMPLETE_FLAG', before: 'N', after: 'Y', note: '請求書確定！以降、修正不可・消込可能に' },
      { table: 'RA_CUST_TRX_LINE_GL_DIST_ALL', key: '52001 (REC)', column: 'ACCOUNT_SET_FLAG / LATEST_REC_FLAG', before: 'Y / NULL', after: 'N / Y', note: '本配賦へ昇格し最新RECフラグが立つ' },
      { table: 'RA_CUST_TRX_LINE_GL_DIST_ALL', key: '52001〜52005', column: 'EVENT_ID', before: 'NULL', after: '80001', note: 'SLAイベント80001 (INV_CREATE) を紐付け' },
      { table: 'AR_PAYMENT_SCHEDULES_ALL', key: '55001 (INV)', column: 'STATUS / AMOUNT_DUE_REMAINING', before: '(新規)', after: 'OP / 164,000', note: '支払期日 2026-12-15 の未決済債権が誕生' },
      { table: 'XLA_EVENTS', key: '80001 (INV_CREATE)', column: 'EVENT_STATUS_CODE / PROCESS_STATUS_CODE', before: '(新規)', after: 'U / U', note: '未処理の会計イベントが登録される' }
    ],
    journalPreview: [
      { note: '請求確定イベント (INV_CREATE / EVENT_ID=80001) が発生（SLA仕訳はStep 5で生成）：', lines: [
        { side: 'DR', ccid: 3001, name: '売掛金 (本配賦確定)', amount: 164000 },
        { side: 'CR', ccid: 4001, name: '売上高 (明細1: 10%対象)', amount: 100000 },
        { side: 'CR', ccid: 4002, name: '売上高 (明細2: 8%軽減対象)', amount: 50000 },
        { side: 'CR', ccid: 2001, name: '仮受消費税 (10%)', amount: 10000 },
        { side: 'CR', ccid: 2002, name: '仮受消費税 (8%軽減)', amount: 4000 }
      ]}
    ],
    activeTables: {
      inserted: ['AR_PAYMENT_SCHEDULES_ALL', 'XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS'],
      updated: ['RA_CUSTOMER_TRX_ALL', 'RA_CUST_TRX_LINE_GL_DIST_ALL'],
      referenced: ['RA_TERMS_B', 'RA_TERMS_LINES', 'GL_PERIOD_STATUSES']
    },
    flowEdges: [
      { from: 'RA_TERMS_LINES', to: 'AR_PAYMENT_SCHEDULES_ALL', label: '30日後期日計算', type: 'ref' },
      { from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_PAYMENT_SCHEDULES_ALL', label: '債権残高164,000 INSERT', type: 'insert' },
      { from: 'RA_CUSTOMER_TRX_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'TRANSACTIONSエンティティ', type: 'insert' },
      { from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', label: 'INV_CREATE (U)', type: 'insert' },
      { from: 'XLA_EVENTS', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', label: 'EVENT_ID=80001更新', type: 'update' }
    ]
  },
  {
    id: 3,
    code: 'STEP 3',
    shortTitle: '入金登録(未消込)',
    title: 'ステップ3：入金登録（銀行預金計上・未消込仮受金 UNAPP・SLAイベント発生）',
    subTitle: '標準入金の作成 (Create Receipt) - 消込前の銀行着金',
    dateLabel: '2026-11-20',
    description: [
      '2026-11-20に顧客から164,000円の銀行振込を受け、入金 RCPT-2026-0001 を登録します（この段階では請求書にまだ紐付けず未消込で登録）。',
      'AR_CASH_RECEIPTS_ALL に STATUS="UNAPP"（未消込）で登録され、入金クラス(CLEAR_FLAG="N")の設定により AR_CASH_RECEIPT_HISTORY_ALL には即座に STATUS="CLEARED"、CURRENT_RECORD_FLAG="Y" で銀行勘定(1001)の履歴が作成されます。',
      '同時に支払予定(AR_PAYMENT_SCHEDULES_ALL)に入金側の行(55002, CLASS="PMT", 残高=-164,000)が作成され、AR_RECEIVABLE_APPLICATIONS_ALL に STATUS="UNAPP"（金額164,000, CCID=2009 仮受金）の行が1行作成されます。AR_DISTRIBUTIONS_ALL に借方CASH(1001)/貸方UNAPP(2009)の配賦が記録され、SLAに RECP_CREATE イベント(80002)が発生します。'
    ],
    flagChanges: [
      { table: 'AR_CASH_RECEIPTS_ALL', key: '60001 (RCPT-2026-0001)', column: 'STATUS', before: '(新規)', after: 'UNAPP (未消込)', note: '入金額 164,000円が未消込状態で登録' },
      { table: 'AR_CASH_RECEIPT_HISTORY_ALL', key: '61001', column: 'STATUS / CURRENT_RECORD_FLAG', before: '(新規)', after: 'CLEARED / Y', note: '銀行預金(1001)へ即時決済として計上' },
      { table: 'AR_PAYMENT_SCHEDULES_ALL', key: '55002 (PMT)', column: 'STATUS / AMOUNT_DUE_REMAINING', before: '(新規)', after: 'OP / -164,000', note: '入金側の未充当クレジット残高を生成' },
      { table: 'AR_RECEIVABLE_APPLICATIONS_ALL', key: '62001', column: 'STATUS / AMOUNT_APPLIED', before: '(新規)', after: 'UNAPP / 164,000', note: '仮受金(2009)への一時計上行を作成' },
      { table: 'XLA_EVENTS', key: '80002 (RECP_CREATE)', column: 'EVENT_STATUS_CODE', before: '(新規)', after: 'U', note: '入金イベントが発生 (未会計)' }
    ],
    journalPreview: [
      { note: '入金登録イベント (RECP_CREATE / EVENT_ID=80002) に対応する配賦 (AR_DISTRIBUTIONS_ALL)：', lines: [
        { side: 'DR', ccid: 1001, name: '普通預金 (CRH / CASH)', amount: 164000 },
        { side: 'CR', ccid: 2009, name: '仮受金 (RA / UNAPP)', amount: 164000 }
      ]}
    ],
    activeTables: {
      inserted: ['AR_CASH_RECEIPTS_ALL', 'AR_CASH_RECEIPT_HISTORY_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_RECEIVABLE_APPLICATIONS_ALL', 'AR_DISTRIBUTIONS_ALL', 'XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS'],
      updated: [],
      referenced: ['HZ_CUST_ACCOUNTS', 'AR_RECEIPT_CLASSES', 'AR_RECEIPT_METHODS', 'CE_BANK_ACCOUNTS', 'CE_BANK_ACCT_USES_ALL', 'AR_RECEIPT_METHOD_ACCOUNTS_ALL']
    },
    flowEdges: [
      { from: 'AR_RECEIPT_METHOD_ACCOUNTS_ALL', to: 'AR_CASH_RECEIPTS_ALL', label: '預金/未消込CCID', type: 'ref' },
      { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_CASH_RECEIPT_HISTORY_ALL', label: 'CLEARED履歴 INSERT', type: 'insert' },
      { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_PAYMENT_SCHEDULES_ALL', label: 'PMT(-164,000) INSERT', type: 'insert' },
      { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: 'UNAPP行 INSERT', type: 'insert' },
      { from: 'AR_CASH_RECEIPT_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: 'CRH借方配賦', type: 'insert' },
      { from: 'AR_RECEIVABLE_APPLICATIONS_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: 'UNAPP貸方配賦', type: 'insert' },
      { from: 'AR_CASH_RECEIPTS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'RECEIPTSエンティティ', type: 'insert' },
      { from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', label: 'RECP_CREATE (U)', type: 'insert' }
    ]
  },
  {
    id: 4,
    code: 'STEP 4',
    shortTitle: '消込処理(APP)',
    title: 'ステップ4：消込処理（入金と請求書のマッチング・残高クローズ・消込イベント）',
    subTitle: '売掛金の消込 (Apply Receipt to Invoice)',
    dateLabel: '2026-11-20',
    description: [
      '入金 RCPT-2026-0001 (164,000円) を請求書 INV-2026-0001 (164,000円) に対して消込（Apply）実行します。',
      'AR_CASH_RECEIPTS_ALL.STATUS が "UNAPP" から "APP"（消込済）へ更新され、AR_PAYMENT_SCHEDULES_ALL の請求行(55001)と入金行(55002)の両方で、未決済残高(AMOUNT_DUE_REMAINING)が 0 に、STATUS が "OP"→"CL"（クローズ済）に、クローズ日が 4712-12-31 → 2026-11-20 へ更新されます。請求行の LINE_ITEMS_REMAINING(150,000→0) と TAX_REMAINING(14,000→0) も 0 になります。',
      'AR_RECEIVABLE_APPLICATIONS_ALL には既存UNAPP行を上書きせず、①未消込の取消行(62002: STATUS="UNAPP", -164,000, DISPLAY="N") と ②請求書への充当行(62003: STATUS="APP", +164,000, LINE_APPLIED=150,000, TAX_APPLIED=14,000, DISPLAY="Y") の2行を追記し、AR_DISTRIBUTIONS_ALL に借方仮受金(2009)/貸方売掛金(3001)を追加、SLAに RECP_UPDATE イベント(80003)を起票します。'
    ],
    flagChanges: [
      { table: 'AR_CASH_RECEIPTS_ALL', key: '60001', column: 'STATUS', before: 'UNAPP', after: 'APP', note: '入金全額が消込済ステータスへ変化' },
      { table: 'AR_PAYMENT_SCHEDULES_ALL', key: '55001 (請求INV)', column: 'STATUS / AMOUNT_DUE_REMAINING / TAX_REMAINING', before: 'OP / 164,000 / 14,000', after: 'CL / 0 / 0', note: 'GL_DATE_CLOSED も 4712-12-31 → 2026-11-20 へ更新' },
      { table: 'AR_PAYMENT_SCHEDULES_ALL', key: '55002 (入金PMT)', column: 'STATUS / AMOUNT_DUE_REMAINING / AMOUNT_APPLIED', before: 'OP / -164,000 / 0', after: 'CL / 0 / 164,000', note: '入金側の支払予定もクローズ完了' },
      { table: 'AR_RECEIVABLE_APPLICATIONS_ALL', key: '62002 / 62003', column: 'STATUS / AMOUNT_APPLIED / DISPLAY', before: '(新規2行)', after: 'UNAPP(-164,000, N) & APP(+164,000, Y)', note: '仮受金を取り消し、請求書50001へ164,000円充当' },
      { table: 'XLA_EVENTS', key: '80003 (RECP_UPDATE)', column: 'EVENT_STATUS_CODE', before: '(新規)', after: 'U', note: '消込会計イベントを起票' }
    ],
    journalPreview: [
      { note: '消込イベント (RECP_UPDATE / EVENT_ID=80003) に対応する配賦 (AR_DISTRIBUTIONS_ALL)：', lines: [
        { side: 'DR', ccid: 2009, name: '仮受金 (RA / UNAPP取消)', amount: 164000 },
        { side: 'CR', ccid: 3001, name: '売掛金 (RA / REC消込)', amount: 164000 }
      ]}
    ],
    activeTables: {
      inserted: ['AR_RECEIVABLE_APPLICATIONS_ALL', 'AR_DISTRIBUTIONS_ALL', 'XLA_EVENTS'],
      updated: ['AR_CASH_RECEIPTS_ALL', 'AR_PAYMENT_SCHEDULES_ALL'],
      referenced: ['RA_CUSTOMER_TRX_ALL', 'AR_SYSTEM_PARAMETERS_ALL', 'XLA_TRANSACTION_ENTITIES']
    },
    flowEdges: [
      { from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: '請求50001へ充当', type: 'ref' },
      { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: 'UNAPP取消+APP追記', type: 'insert' },
      { from: 'AR_RECEIVABLE_APPLICATIONS_ALL', to: 'AR_PAYMENT_SCHEDULES_ALL', label: '残高0・STATUS=CL更新', type: 'update' },
      { from: 'AR_RECEIVABLE_APPLICATIONS_ALL', to: 'AR_CASH_RECEIPTS_ALL', label: 'STATUS: UNAPP→APP', type: 'update' },
      { from: 'AR_RECEIVABLE_APPLICATIONS_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: 'UNAPP借方/REC貸方', type: 'insert' },
      { from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', label: 'RECP_UPDATE (U)', type: 'insert' }
    ]
  },
  {
    id: 5,
    code: 'STEP 5',
    shortTitle: 'SLA 会計作成',
    title: 'ステップ5：SLA 会計作成（Create Accounting - 補助元帳仕訳生成とAR済マーク）',
    subTitle: '会計作成プログラム (Create Accounting) - 下書きではなく「最終 (Final)」モード',
    dateLabel: '2026-11-20',
    description: [
      'スケジュールプロセス「会計の作成 (Create Accounting)」を実行し、未処理(U)だった3つのSLAイベント（80001:請求確定, 80002:入金登録, 80003:消込）をすべて会計処理します。',
      'XLA_EVENTS の EVENT_STATUS_CODE と PROCESS_STATUS_CODE が "U" から "P"（Processed）へ更新され、XLA_AE_HEADERS に3ヘッダ（ACCOUNTING_ENTRY_STATUS_CODE="F" 最終、GL_TRANSFER_STATUS_CODE="N" 未転送）、XLA_AE_LINES に9本の仕訳明細（それぞれ GL_SL_LINK_ID=85001〜85009 を付与）が生成されます。',
      'さらに XLA_DISTRIBUTION_LINKS に9行の監査証跡リンクが作成され、AR側のソース配賦テーブル（RA_CUST_TRX_LINE_GL_DIST_ALL, AR_CASH_RECEIPT_HISTORY_ALL, AR_RECEIVABLE_APPLICATIONS_ALL）の POSTING_CONTROL_ID が -3 から 9001 へ、GL_POSTED_DATE が 2026-11-20 へと更新されます。'
    ],
    flagChanges: [
      { table: 'XLA_EVENTS', key: '80001 / 80002 / 80003', column: 'EVENT_STATUS_CODE / PROCESS_STATUS_CODE', before: 'U / U', after: 'P / P', note: '3イベントすべて会計作成完了' },
      { table: 'XLA_AE_HEADERS', key: '81001 / 81002 / 81003', column: 'ACCOUNTING_ENTRY_STATUS_CODE / GL_TRANSFER_STATUS_CODE', before: '(新規)', after: 'F (Final) / N (未転送)', note: 'SLA仕訳ヘッダ確定。次ステップでGL転送対象となる' },
      { table: 'XLA_AE_LINES', key: '85001〜85009', column: 'GL_SL_LINK_ID', before: '(新規)', after: '85001〜85009', note: 'GLへのドリルスルー用リンクIDを各明細に採番' },
      { table: 'RA_CUST_TRX_LINE_GL_DIST_ALL / AR_CASH_RECEIPT_HISTORY_ALL / AR_RECEIVABLE_APPLICATIONS_ALL', key: '全9配賦/履歴', column: 'POSTING_CONTROL_ID / GL_POSTED_DATE', before: '-3 / NULL', after: '9001 / 2026-11-20', note: 'AR側トランザクションの会計作成済マークを更新' }
    ],
    journalPreview: [
      { note: '【仕訳1: AE_HEADER_ID=81001】Sales Invoices (INV_CREATE)', lines: [
        { side: 'DR', ccid: 3001, name: '売掛金 (RECEIVABLE)', amount: 164000 },
        { side: 'CR', ccid: 4001, name: '売上高 明細1 (REVENUE 10%)', amount: 100000 },
        { side: 'CR', ccid: 4002, name: '売上高 明細2 (REVENUE 8%)', amount: 50000 },
        { side: 'CR', ccid: 2001, name: '仮受消費税10% (TAX)', amount: 10000 },
        { side: 'CR', ccid: 2002, name: '仮受消費税8% (TAX)', amount: 4000 }
      ]},
      { note: '【仕訳2: AE_HEADER_ID=81002】Receipts (RECP_CREATE)', lines: [
        { side: 'DR', ccid: 1001, name: '普通預金 (CASH)', amount: 164000 },
        { side: 'CR', ccid: 2009, name: '仮受金 (UNAPPLIED_CASH)', amount: 164000 }
      ]},
      { note: '【仕訳3: AE_HEADER_ID=81003】Receipts (RECP_UPDATE)', lines: [
        { side: 'DR', ccid: 2009, name: '仮受金 (UNAPPLIED_CASH取消)', amount: 164000 },
        { side: 'CR', ccid: 3001, name: '売掛金 (RECEIVABLE消込)', amount: 164000 }
      ]}
    ],
    activeTables: {
      inserted: ['XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
      updated: ['XLA_EVENTS', 'RA_CUST_TRX_LINE_GL_DIST_ALL', 'AR_CASH_RECEIPT_HISTORY_ALL', 'AR_RECEIVABLE_APPLICATIONS_ALL'],
      referenced: ['RA_CUST_TRX_LINE_GL_DIST_ALL', 'AR_DISTRIBUTIONS_ALL', 'GL_LEDGERS', 'GL_CODE_COMBINATIONS']
    },
    flowEdges: [
      { from: 'RA_CUST_TRX_LINE_GL_DIST_ALL', to: 'XLA_DISTRIBUTION_LINKS', label: '請求配賦5行リンク', type: 'insert' },
      { from: 'AR_DISTRIBUTIONS_ALL', to: 'XLA_DISTRIBUTION_LINKS', label: '入金/消込4行リンク', type: 'insert' },
      { from: 'XLA_EVENTS', to: 'XLA_AE_HEADERS', label: '3仕訳ヘッダ生成', type: 'insert' },
      { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: '9仕訳明細生成', type: 'insert' },
      { from: 'XLA_AE_LINES', to: 'XLA_DISTRIBUTION_LINKS', label: '監査証跡リンク', type: 'insert' },
      { from: 'XLA_EVENTS', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', label: 'POSTING_CONTROL_ID=9001', type: 'update' },
      { from: 'XLA_EVENTS', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: 'POSTING_CONTROL_ID=9001', type: 'update' }
    ]
  },
  {
    id: 6,
    code: 'STEP 6',
    shortTitle: 'GL転送・仕訳インポート',
    title: 'ステップ6：GL転送 & 仕訳インポート（Transfer to GL / Journal Import）',
    subTitle: '総勘定元帳への転記 (Transfer Journal Entries to GL) → GL仕訳バッチ生成',
    dateLabel: '2026-11-20',
    description: [
      'SLAで確定した仕訳を総勘定元帳（GL）へ転送します（Create Accounting実行時にパラメータ「総勘定元帳に転記=はい」を指定した場合も内部で連続実行されます）。',
      'XLA_AE_HEADERS の GL_TRANSFER_STATUS_CODE が "N" から "Y" へ、GL_TRANSFER_DATE が "2026-11-20" へ更新されます。XLA_AE_LINES の9行が GROUP_ID=94001 として GL_INTERFACE へ投入され（STATUS="NEW"）、直後に実行される「仕訳インポート (Journal Import)」が検証・取込を完了して GL_INTERFACE.STATUS を "PROCESSED" へ変更します。',
      'これにより GL_JE_BATCHES（1バッチ：95001、貸借合計492,000円）、GL_JE_HEADERS（カテゴリ別2ヘッダ：Sales Invoices 96001 / Receipts 96002）、GL_JE_LINES（9明細）がすべて未転記状態（STATUS="U"）で生成され、GL_IMPORT_REFERENCES に GL_SL_LINK_ID (85001〜85009) によるドリルスルー参照が記録されます。'
    ],
    flagChanges: [
      { table: 'XLA_AE_HEADERS', key: '81001 / 81002 / 81003', column: 'GL_TRANSFER_STATUS_CODE / GL_TRANSFER_DATE', before: 'N / NULL', after: 'Y / 2026-11-20', note: 'GLへの転送完了マーク' },
      { table: 'GL_INTERFACE', key: 'GROUP_ID=94001 (9行)', column: 'STATUS', before: '(NEW投入)', after: 'PROCESSED', note: 'Journal Importによる検証・取込完了' },
      { table: 'GL_JE_BATCHES / GL_JE_HEADERS / GL_JE_LINES', key: '95001 / 96001,96002 / 9行', column: 'STATUS', before: '(新規)', after: 'U (Unposted)', note: 'GL仕訳が作成されたが、まだGL残高には未反映' },
      { table: 'GL_IMPORT_REFERENCES', key: '85001〜85009', column: 'REFERENCE_5 / 6 / 7', before: '(新規)', after: 'ENTITY_ID / EVENT_ID / AE_HEADER_ID', note: 'GL→SLA→ARへの完全ドリルスルーを可能にする' }
    ],
    journalPreview: [
      { note: '【GL仕訳バッチ 95001 (STATUS="U" 未転記)】カテゴリ別に2つのGL仕訳ヘッダが生成：', lines: [
        { side: 'DR', ccid: 3001, name: '[96001: Sales Invoices] 売掛金', amount: 164000 },
        { side: 'CR', ccid: 4001, name: '[96001: Sales Invoices] 売上高(10%)', amount: 100000 },
        { side: 'CR', ccid: 4002, name: '[96001: Sales Invoices] 売上高(8%)', amount: 50000 },
        { side: 'CR', ccid: 2001, name: '[96001: Sales Invoices] 仮受消費税(10%)', amount: 10000 },
        { side: 'CR', ccid: 2002, name: '[96001: Sales Invoices] 仮受消費税(8%)', amount: 4000 },
        { side: 'DR', ccid: 1001, name: '[96002: Receipts] 普通預金', amount: 164000 },
        { side: 'CR', ccid: 2009, name: '[96002: Receipts] 仮受金', amount: 164000 },
        { side: 'DR', ccid: 2009, name: '[96002: Receipts] 仮受金(消込取消)', amount: 164000 },
        { side: 'CR', ccid: 3001, name: '[96002: Receipts] 売掛金(消込)', amount: 164000 }
      ]}
    ],
    activeTables: {
      inserted: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES'],
      updated: ['XLA_AE_HEADERS'],
      referenced: ['XLA_AE_LINES', 'GL_LEDGERS', 'GL_PERIOD_STATUSES', 'GL_CODE_COMBINATIONS']
    },
    flowEdges: [
      { from: 'XLA_AE_HEADERS', to: 'GL_INTERFACE', label: 'GL転送 (STATUS: N→Y)', type: 'update' },
      { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: '9明細投入 (GL_SL_LINK_ID)', type: 'insert' },
      { from: 'GL_INTERFACE', to: 'GL_JE_BATCHES', label: 'Journal Import バッチ生成', type: 'insert' },
      { from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', label: 'カテゴリ別2ヘッダ生成', type: 'insert' },
      { from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', label: '9仕訳明細生成 (STATUS=U)', type: 'insert' },
      { from: 'GL_JE_LINES', to: 'GL_IMPORT_REFERENCES', label: 'GL_SL_LINK_ID紐付け', type: 'insert' },
      { from: 'XLA_AE_LINES', to: 'GL_IMPORT_REFERENCES', label: 'ドリルスルー参照', type: 'ref' }
    ]
  },
  {
    id: 7,
    code: 'STEP 7',
    shortTitle: 'GL転記(残高更新)',
    title: 'ステップ7：GL転記（Post Journals - 仕訳確定と GL_BALANCES 総勘定元帳残高の更新）',
    subTitle: '仕訳の転記 (Post Journals) → 試算表・決算書への反映完了',
    dateLabel: '2026-11-20',
    description: [
      '最後に、総勘定元帳で「仕訳の転記 (Post Journals)」プロセスを実行し、未転記だったGL仕訳を元帳残高に確定反映します。',
      'GL_JE_BATCHES（95001）、GL_JE_HEADERS（96001, 96002）、GL_JE_LINES（9行）のすべてで STATUS が "U"（Unposted）から "P"（Posted）へ更新され、POSTED_DATE に "2026-11-20" がセットされます。',
      '同時に GL_BALANCES（2026-11期）の7つのCCIDレコードが更新され、PERIOD_NET_DR と PERIOD_NET_CR に仕訳合計が加算されます。その結果、普通預金(1001) +164,000円、売上高(4001/4002) 貸方150,000円、仮受消費税(2001/2002) 貸方14,000円が計上され、売掛金(3001)と仮受金(2009)は借方164,000・貸方164,000で残高ゼロ（消込完了）となり、全プロセスが完了します。'
    ],
    flagChanges: [
      { table: 'GL_JE_BATCHES', key: '95001', column: 'STATUS / POSTED_DATE', before: 'U / NULL', after: 'P / 2026-11-20', note: '仕訳バッチ転記完了' },
      { table: 'GL_JE_HEADERS', key: '96001 / 96002', column: 'STATUS / POSTED_DATE', before: 'U / NULL', after: 'P / 2026-11-20', note: '2仕訳ヘッダとも転記完了' },
      { table: 'GL_JE_LINES', key: '全9行', column: 'STATUS', before: 'U', after: 'P', note: '全仕訳明細が転記済に更新' },
      { table: 'GL_BALANCES', key: '1001 (普通預金)', column: 'PERIOD_NET_DR', before: '0', after: '164,000', note: '残高 +164,000円 (資産増加)' },
      { table: 'GL_BALANCES', key: '3001 (売掛金) / 2009 (仮受金)', column: 'PERIOD_NET_DR / PERIOD_NET_CR', before: '0 / 0', after: '164,000 / 164,000', note: '借方=貸方のため当期末残高は0円(消込済)' },
      { table: 'GL_BALANCES', key: '4001 / 4002 / 2001 / 2002', column: 'PERIOD_NET_CR', before: '0', after: '100,000 / 50,000 / 10,000 / 4,000', note: '10%・8%それぞれの売上高および仮受消費税が確定' }
    ],
    journalPreview: [
      { note: '【GL転記後 勘定残高サマリ (2026-11期)】借方合計 492,000円 ＝ 貸方合計 492,000円：', lines: [
        { side: 'DR', ccid: 1001, name: '普通預金 (残高: 借方 164,000)', amount: 164000 },
        { side: 'NET0', ccid: 3001, name: '売掛金 (DR 164,000 / CR 164,000 → 残高 0)', amount: 0 },
        { side: 'NET0', ccid: 2009, name: '仮受金 (DR 164,000 / CR 164,000 → 残高 0)', amount: 0 },
        { side: 'CR', ccid: 4001, name: '売上高10% (残高: 貸方 100,000)', amount: 100000 },
        { side: 'CR', ccid: 4002, name: '売上高8%軽減 (残高: 貸方 50,000)', amount: 50000 },
        { side: 'CR', ccid: 2001, name: '仮受消費税10% (残高: 貸方 10,000)', amount: 10000 },
        { side: 'CR', ccid: 2002, name: '仮受消費税8%軽減 (残高: 貸方 4,000)', amount: 4000 }
      ]}
    ],
    activeTables: {
      inserted: [],
      updated: ['GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_BALANCES'],
      referenced: ['GL_CODE_COMBINATIONS', 'GL_PERIOD_STATUSES', 'GL_LEDGERS', 'GL_IMPORT_REFERENCES']
    },
    flowEdges: [
      { from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', label: 'STATUS: U→P', type: 'update' },
      { from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', label: 'STATUS: U→P', type: 'update' },
      { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: 'PERIOD_NET加算更新', type: 'update' },
      { from: 'GL_CODE_COMBINATIONS', to: 'GL_BALANCES', label: '9セグメント集計軸', type: 'ref' }
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AFF_SEGMENTS,
    CCID_LIST,
    DOMAINS,
    TABLES,
    RELATIONS,
    TABLE_RECORDS,
    STEPS,
    computeStateAtStep
  };
}
