/**
 * Oracle Fusion ERP Financials 26D (OEDMF)
 * 電子記録債務（AP）・電子記録債権（AR 満期決済／割引・裏書譲渡）データフロー定義
 * 準拠: https://docs.oracle.com/en/cloud/saas/financials/26d/oedmf/index.html
 */

const AFF_SEGMENTS = [
  { idx: 1, col: 'SEGMENT1', name: '会社', codeExample: '10', desc: '法的エンティティ・企業コード（例: 10=株式会社テスト商事）' },
  { idx: 2, col: 'SEGMENT2', name: '部門', codeExample: '0000 / 1000 / 2000', desc: '部門・コストセンタ（0000=全社共通, 1000=営業本部, 2000=開発本部）' },
  { idx: 3, col: 'SEGMENT3', name: '勘定科目', codeExample: '11410 / 21210', desc: '自然勘定（11410=電子記録債権, 21210=電子記録債務 等）' },
  { idx: 4, col: 'SEGMENT4', name: '補助科目', codeExample: '001 / 002', desc: '内訳識別（001=10.21%源泉・一般でんさい, 002=20.42%源泉）' },
  { idx: 5, col: 'SEGMENT5', name: '税コード', codeExample: 'T10 / T08 / W10 / W20', desc: '税区分（T10=10%, T08=軽減8%, W10=源泉10.21%, W20=源泉20.42%）' },
  { idx: 6, col: 'SEGMENT6', name: '管理コード', codeExample: 'DEN / P01 / C01', desc: 'プロジェクト・管理セグメント（DEN=でんさい管理対象）' },
  { idx: 7, col: 'SEGMENT7', name: '備考1', codeExample: '000', desc: '予備・拡張セグメント1' },
  { idx: 8, col: 'SEGMENT8', name: '備考2', codeExample: '000', desc: '予備・拡張セグメント2' },
  { idx: 9, col: 'SEGMENT9', name: '備考3', codeExample: '000', desc: '予備・拡張セグメント3' }
];

const CCID_LIST = {
  1001: { ccid: 1001, concat: '10-0000-11110-000-T00-C00-000-000-000', name: '普通預金（みずほ銀行・本店）', type: 'ASSET' },
  1110: { ccid: 1110, concat: '10-0000-11310-000-T00-C00-000-000-000', name: '売掛金（一般売掛）', type: 'ASSET' },
  1120: { ccid: 1120, concat: '10-0000-11410-001-T00-DEN-000-000-000', name: '電子記録債権（保有・未取立）', type: 'ASSET' },
  1121: { ccid: 1121, concat: '10-0000-11420-001-T00-DEN-000-000-000', name: '電子記録債権（銀行取立送金中）', type: 'ASSET' },
  1122: { ccid: 1122, concat: '10-0000-11430-001-T00-DEN-000-000-000', name: '割引電子記録債権（遡及・保証見合）', type: 'LIABILITY' },
  1123: { ccid: 1123, concat: '10-0000-11440-001-T00-DEN-000-000-000', name: '譲渡電子記録債権（裏書保証見合）', type: 'LIABILITY' },
  1150: { ccid: 1150, concat: '10-0000-11810-001-WHT-C01-000-000-000', name: '仮払源泉所得税（先方控除分）', type: 'ASSET' },
  1501: { ccid: 1501, concat: '10-0000-15110-000-T10-C00-000-000-000', name: '仮払消費税（標準10%）', type: 'ASSET' },
  1502: { ccid: 1502, concat: '10-0000-15120-000-T08-C00-000-000-000', name: '仮払消費税（軽減8%）', type: 'ASSET' },
  2101: { ccid: 2101, concat: '10-0000-21110-000-T00-C00-000-000-000', name: '買掛金（AP債務）', type: 'LIABILITY' },
  2110: { ccid: 2110, concat: '10-0000-21210-001-T00-DEN-000-000-000', name: '電子記録債務（Bills Payable）', type: 'LIABILITY' },
  2201: { ccid: 2201, concat: '10-0000-22110-001-W10-C01-000-000-000', name: '預り源泉所得税（10.21%：100万円以下）', type: 'LIABILITY' },
  2202: { ccid: 2202, concat: '10-0000-22110-002-W20-C02-000-000-000', name: '預り源泉所得税（20.42%：100万円超）', type: 'LIABILITY' },
  2501: { ccid: 2501, concat: '10-0000-25110-000-T10-C00-000-000-000', name: '仮受消費税（標準10%）', type: 'LIABILITY' },
  2502: { ccid: 2502, concat: '10-0000-25120-000-T08-C00-000-000-000', name: '仮受消費税（軽減8%）', type: 'LIABILITY' },
  4001: { ccid: 4001, concat: '10-1000-41110-000-T10-P01-000-000-000', name: '売上高（システム受託・課税10%）', type: 'REVENUE' },
  4002: { ccid: 4002, concat: '10-1000-41120-000-T08-P02-000-000-000', name: '売上高（食品原材料卸・軽減8%）', type: 'REVENUE' },
  5001: { ccid: 5001, concat: '10-2000-51110-000-T10-P01-000-000-000', name: '外注技術費（課税10%）', type: 'EXPENSE' },
  5002: { ccid: 5002, concat: '10-2000-51120-000-T08-P02-000-000-000', name: '原稿・資料購入費（軽減8%）', type: 'EXPENSE' },
  6101: { ccid: 6101, concat: '10-0000-61110-001-T00-DEN-000-000-000', name: '手形・でんさい売却損（割引料）', type: 'EXPENSE' }
};

const DOMAINS = {
  ORG_GL_MASTER: { id: 'ORG_GL_MASTER', label: 'A. 組織・元帳・AFF体系マスタ', x: 16, y: 16, w: 288, h: 436, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  PARTNER_MASTER: { id: 'PARTNER_MASTER', label: 'B. 取引先（サプライヤ・顧客）マスタ', x: 16, y: 468, w: 288, h: 436, color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  TXN_DENSAI_MASTER: { id: 'TXN_DENSAI_MASTER', label: 'C. 条件・税・源泉・銀行・でんさいマスタ', x: 320, y: 16, w: 300, h: 888, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  DENSAI_TXNS: { id: 'DENSAI_TXNS', label: 'D. AP電子記録債務 / AR電子記録債権 トランザクション', x: 636, y: 16, w: 620, h: 888, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  SLA_XLA: { id: 'SLA_XLA', label: 'E. SLA（補助元帳会計 XLA）', x: 1272, y: 16, w: 472, h: 392, color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  GL_LEDGER: { id: 'GL_LEDGER', label: 'F. GL（総勘定元帳・残高）', x: 1272, y: 424, w: 472, h: 480, color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' }
};

const TABLES = {
  // === A. ORG_GL_MASTER (6) ===
  XLE_ENTITY_PROFILES: {
    id: 'XLE_ENTITY_PROFILES', name: 'XLE_ENTITY_PROFILES', jpName: '法的エンティティ・プロファイル', domain: 'ORG_GL_MASTER', caseScope: 'ALL',
    x: 28, y: 58, w: 264, h: 54, pk: 'LEGAL_ENTITY_ID', fks: [],
    desc: '企業グループ内の法人格（法的エンティティ）・法人番号・登記情報を管理する基礎マスタ。',
    keyCols: [
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'PK', desc: '法的エンティティID' },
      { name: 'NAME', type: 'VARCHAR2(240)', role: '', desc: '法人名（株式会社テスト商事）' },
      { name: 'LEGAL_ENTITY_IDENTIFIER', type: 'VARCHAR2(30)', role: '', desc: '法人識別子・インボイス登録番号' },
      { name: 'COUNTRY', type: 'VARCHAR2(60)', role: '', desc: '国コード（JP）' }
    ]
  },
  FUN_ALL_BUSINESS_UNITS_V: {
    id: 'FUN_ALL_BUSINESS_UNITS_V', name: 'FUN_ALL_BUSINESS_UNITS_V', jpName: 'ビジネス・ユニット (BU)', domain: 'ORG_GL_MASTER', caseScope: 'ALL',
    x: 28, y: 120, w: 264, h: 54, pk: 'BU_ID', fks: ['LEGAL_ENTITY_ID', 'PRIMARY_LEDGER_ID'],
    desc: 'AP/ARの取引管理単位（ORG_ID）。法的エンティティとプライマリ元帳へ紐付く。',
    keyCols: [
      { name: 'BU_ID', type: 'NUMBER(18)', role: 'PK', desc: 'ビジネス・ユニットID（ORG_ID）' },
      { name: 'BU_NAME', type: 'VARCHAR2(240)', role: '', desc: 'BU名称（KGJPN_東京本社BU）' },
      { name: 'LEGAL_ENTITY_ID', type: 'NUMBER(18)', role: 'FK', desc: '法的エンティティID' },
      { name: 'PRIMARY_LEDGER_ID', type: 'NUMBER(18)', role: 'FK', desc: '主元帳ID' }
    ]
  },
  GL_LEDGERS: {
    id: 'GL_LEDGERS', name: 'GL_LEDGERS', jpName: '総勘定元帳定義', domain: 'ORG_GL_MASTER', caseScope: 'ALL',
    x: 28, y: 182, w: 264, h: 54, pk: 'LEDGER_ID', fks: ['CHART_OF_ACCOUNTS_ID'],
    desc: '機能通貨（JPY）、会計カレンダ、9セグメントCOA体系、SLA会計基準を統合定義する元帳マスタ。',
    keyCols: [
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'PK', desc: '元帳ID' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: '', desc: '元帳名（JP_PRIMARY_LEDGER）' },
      { name: 'CURRENCY_CODE', type: 'VARCHAR2(15)', role: '', desc: '通貨コード（JPY）' },
      { name: 'CHART_OF_ACCOUNTS_ID', type: 'NUMBER(18)', role: 'FK', desc: '9セグメントCOA体系ID' }
    ]
  },
  GL_PERIOD_STATUSES: {
    id: 'GL_PERIOD_STATUSES', name: 'GL_PERIOD_STATUSES', jpName: '会計期間ステータス', domain: 'ORG_GL_MASTER', caseScope: 'ALL',
    x: 28, y: 244, w: 264, h: 54, pk: 'APPLICATION_ID, LEDGER_ID, PERIOD_NAME', fks: ['LEDGER_ID'],
    desc: 'SQLAP(200) / AR(222) / GL(101) ごとの会計期間クローズ・オープン状態を管理するテーブル。',
    keyCols: [
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: 'PK', desc: '200:AP / 222:AR / 101:GL' },
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '元帳ID' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'PK', desc: '会計期間（2026-05, 2026-06, 2026-08）' },
      { name: 'CLOSING_STATUS', type: 'VARCHAR2(1)', role: '', desc: 'O=オープン / C=クローズ' }
    ]
  },
  FND_KF_STR_INSTANCES_B: {
    id: 'FND_KF_STR_INSTANCES_B', name: 'FND_KF_STR_INSTANCES_B', jpName: 'Key Flexfield 構造インスタンス (AFF)', domain: 'ORG_GL_MASTER', caseScope: 'ALL',
    x: 28, y: 306, w: 264, h: 54, pk: 'STRUCTURE_INSTANCE_ID', fks: [],
    desc: '9セグメントAFF（会社-部門-勘定-補助-税-管理-備考1-備考2-備考3）の体系構造定義。',
    keyCols: [
      { name: 'STRUCTURE_INSTANCE_ID', type: 'NUMBER(18)', role: 'PK', desc: 'COA構造インスタンスID' },
      { name: 'STRUCTURE_INSTANCE_CODE', type: 'VARCHAR2(30)', role: '', desc: '構造コード（JP_9SEG_AFF）' },
      { name: 'APPLICATION_ID', type: 'NUMBER(18)', role: '', desc: '101（General Ledger）' },
      { name: 'KEY_FLEXFIELD_CODE', type: 'VARCHAR2(4)', role: '', desc: 'GL#（Accounting Flexfield）' }
    ]
  },
  GL_CODE_COMBINATIONS: {
    id: 'GL_CODE_COMBINATIONS', name: 'GL_CODE_COMBINATIONS', jpName: '勘定科目組合せ (CCID / 9軸AFF)', domain: 'ORG_GL_MASTER', caseScope: 'ALL',
    x: 28, y: 368, w: 264, h: 54, pk: 'CODE_COMBINATION_ID', fks: ['CHART_OF_ACCOUNTS_ID'],
    desc: 'SEGMENT1〜SEGMENT9の9項目を結合保持し、全仕訳のCCID（勘定組合せID）を提供する中核表。',
    keyCols: [
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'PK', desc: '勘定コード組合せID' },
      { name: 'SEGMENT1..SEGMENT5', type: 'VARCHAR2(25)', role: '', desc: '会社-部門-勘定科目-補助科目-税' },
      { name: 'SEGMENT6..SEGMENT9', type: 'VARCHAR2(25)', role: '', desc: '管理(DEN等)-備考1-備考2-備考3' },
      { name: 'ACCOUNT_TYPE', type: 'VARCHAR2(1)', role: '', desc: 'A=資産, L=負債, E=費用, R=収益' }
    ]
  },

  // === B. PARTNER_MASTER (6) ===
  HZ_PARTIES: {
    id: 'HZ_PARTIES', name: 'HZ_PARTIES', jpName: 'TCAパーティマスタ（取引先共通）', domain: 'PARTNER_MASTER', caseScope: 'ALL',
    x: 28, y: 510, w: 264, h: 54, pk: 'PARTY_ID', fks: [],
    desc: 'サプライヤ（支払先）および顧客（請求先・債務者）の法人基本情報を一元管理するTCA基底表。',
    keyCols: [
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'PK', desc: 'パーティID' },
      { name: 'PARTY_NAME', type: 'VARCHAR2(360)', role: '', desc: '取引先名' },
      { name: 'PARTY_TYPE', type: 'VARCHAR2(30)', role: '', desc: 'ORGANIZATION' },
      { name: 'DUNS_NUMBER_C', type: 'VARCHAR2(30)', role: '', desc: 'でんさい利用者番号/企業識別' }
    ]
  },
  HZ_LOCATIONS: {
    id: 'HZ_LOCATIONS', name: 'HZ_LOCATIONS', jpName: '住所マスタ', domain: 'PARTNER_MASTER', caseScope: 'ALL',
    x: 28, y: 572, w: 264, h: 54, pk: 'LOCATION_ID', fks: [],
    desc: '取引先の登記・請求・支払通知先住所。税務上の課税判定エリアにも利用。',
    keyCols: [
      { name: 'LOCATION_ID', type: 'NUMBER(18)', role: 'PK', desc: 'ロケーションID' },
      { name: 'ADDRESS1', type: 'VARCHAR2(240)', role: '', desc: '住所（東京都千代田区/大阪市）' },
      { name: 'POSTAL_CODE', type: 'VARCHAR2(60)', role: '', desc: '郵便番号' },
      { name: 'COUNTRY', type: 'VARCHAR2(60)', role: '', desc: 'JP' }
    ]
  },
  HZ_PARTY_SITES: {
    id: 'HZ_PARTY_SITES', name: 'HZ_PARTY_SITES', jpName: 'パーティ・サイト', domain: 'PARTNER_MASTER', caseScope: 'ALL',
    x: 28, y: 634, w: 264, h: 54, pk: 'PARTY_SITE_ID', fks: ['PARTY_ID', 'LOCATION_ID'],
    desc: 'パーティと住所を紐付けるサイト情報。APサプライヤサイトやAR請求先サイトの参照元。',
    keyCols: [
      { name: 'PARTY_SITE_ID', type: 'NUMBER(18)', role: 'PK', desc: 'パーティ・サイトID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'FK', desc: 'パーティID' },
      { name: 'LOCATION_ID', type: 'NUMBER(18)', role: 'FK', desc: 'ロケーションID' },
      { name: 'PARTY_SITE_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'サイト番号' }
    ]
  },
  POZ_SUPPLIERS: {
    id: 'POZ_SUPPLIERS', name: 'POZ_SUPPLIERS', jpName: 'サプライヤ（仕入先・外注先）', domain: 'PARTNER_MASTER', caseScope: 'AP',
    x: 28, y: 696, w: 264, h: 54, pk: 'VENDOR_ID', fks: ['PARTY_ID'],
    desc: 'AP電子記録債務の債務相手先およびAR裏書譲渡先の仕入先マスタ。',
    keyCols: [
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'PK', desc: 'サプライヤID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'FK', desc: 'TCAパーティID' },
      { name: 'SEGMENT1', type: 'VARCHAR2(30)', role: '', desc: 'サプライヤ番号（SUP-1001）' },
      { name: 'VENDOR_TYPE_LOOKUP_CODE', type: 'VARCHAR2(30)', role: '', desc: 'CONTRACTOR / VENDOR' }
    ]
  },
  POZ_SUPPLIER_SITES_ALL_M: {
    id: 'POZ_SUPPLIER_SITES_ALL_M', name: 'POZ_SUPPLIER_SITES_ALL_M', jpName: 'サプライヤ・サイト（源泉/AP規定）', domain: 'PARTNER_MASTER', caseScope: 'AP',
    x: 28, y: 758, w: 264, h: 54, pk: 'VENDOR_SITE_ID', fks: ['VENDOR_ID', 'PARTY_SITE_ID', 'PRC_BU_ID'],
    desc: 'BU単位の仕入先サイト。源泉対象フラグ・でんさい支払方法・負債勘定を規定。',
    keyCols: [
      { name: 'VENDOR_SITE_ID', type: 'NUMBER(18)', role: 'PK', desc: 'サプライヤ・サイトID' },
      { name: 'VENDOR_ID', type: 'NUMBER(18)', role: 'FK', desc: 'サプライヤID' },
      { name: 'ALLOW_AWT_FLAG', type: 'VARCHAR2(1)', role: '', desc: '源泉徴収対象（Y）' },
      { name: 'AWT_GROUP_ID', type: 'NUMBER(18)', role: 'FK', desc: '既定源泉グループID' }
    ]
  },
  HZ_CUST_ACCOUNTS: {
    id: 'HZ_CUST_ACCOUNTS', name: 'HZ_CUST_ACCOUNTS', jpName: '顧客アカウント（債権相手先）', domain: 'PARTNER_MASTER', caseScope: 'AR',
    x: 28, y: 820, w: 264, h: 54, pk: 'CUST_ACCOUNT_ID', fks: ['PARTY_ID'],
    desc: 'AR請求先・電子記録債権（BR）の振出人（債務者）となる顧客アカウント定義。',
    keyCols: [
      { name: 'CUST_ACCOUNT_ID', type: 'NUMBER(18)', role: 'PK', desc: '顧客アカウントID' },
      { name: 'PARTY_ID', type: 'NUMBER(18)', role: 'FK', desc: 'TCAパーティID' },
      { name: 'ACCOUNT_NUMBER', type: 'VARCHAR2(30)', role: '', desc: '顧客番号（CUST-2001）' },
      { name: 'ACCOUNT_NAME', type: 'VARCHAR2(240)', role: '', desc: '株式会社大阪商事' }
    ]
  },

  // === C. TXN_DENSAI_MASTER (12) ===
  AP_SYSTEM_PARAMETERS_ALL: {
    id: 'AP_SYSTEM_PARAMETERS_ALL', name: 'AP_SYSTEM_PARAMETERS_ALL', jpName: 'AP買掛管理システム設定', domain: 'TXN_DENSAI_MASTER', caseScope: 'AP',
    x: 332, y: 58, w: 276, h: 56, pk: 'ORG_ID', fks: ['SET_OF_BOOKS_ID'],
    desc: 'AP請求書計算・検証時源泉自動作成(`CREATE_AWT_DISTS_TYPE`)・電子記録債務勘定規定を設定。',
    keyCols: [
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'PK', desc: 'ビジネス・ユニットID' },
      { name: 'ACCTS_PAY_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '買掛金CCID（2101）' },
      { name: 'FUTURE_DATED_PAYMENT_CCID', type: 'NUMBER(18)', role: 'FK', desc: '電子記録債務CCID（2110）' },
      { name: 'CREATE_AWT_DISTS_TYPE', type: 'VARCHAR2(25)', role: '', desc: 'APPROVAL（検証時に源泉計上）' }
    ]
  },
  AR_SYSTEM_PARAMETERS_ALL: {
    id: 'AR_SYSTEM_PARAMETERS_ALL', name: 'AR_SYSTEM_PARAMETERS_ALL', jpName: 'AR売掛管理システム設定', domain: 'TXN_DENSAI_MASTER', caseScope: 'AR',
    x: 332, y: 126, w: 276, h: 56, pk: 'ORG_ID', fks: ['SET_OF_BOOKS_ID'],
    desc: 'AR取引シーケンス・BR（電子記録債権）機能有効化・未取立/取立デフォルトを設定。',
    keyCols: [
      { name: 'ORG_ID', type: 'NUMBER(18)', role: 'PK', desc: 'ビジネス・ユニットID' },
      { name: 'SET_OF_BOOKS_ID', type: 'NUMBER(18)', role: 'FK', desc: '元帳ID' },
      { name: 'BR_ENABLED_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y（電子記録債権・BR有効）' },
      { name: 'DEFAULT_CB_DUE_DATE', type: 'VARCHAR2(30)', role: '', desc: '満期計算ルール' }
    ]
  },
  AP_TERMS_B: {
    id: 'AP_TERMS_B', name: 'AP_TERMS_B', jpName: '支払条件（サイト90日等）', domain: 'TXN_DENSAI_MASTER', caseScope: 'ALL',
    x: 332, y: 194, w: 276, h: 56, pk: 'TERM_ID', fks: [],
    desc: '支払期日・でんさいサイト期間（例: 月末締・90日後満期決済）の条件定義。',
    keyCols: [
      { name: 'TERM_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払条件ID' },
      { name: 'TYPE', type: 'VARCHAR2(15)', role: '', desc: 'NET_90_DENSAI（90日サイト）' },
      { name: 'ENABLED_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y' }
    ]
  },
  RA_CUST_TRX_TYPES_ALL: {
    id: 'RA_CUST_TRX_TYPES_ALL', name: 'RA_CUST_TRX_TYPES_ALL', jpName: 'AR取引タイプ（請求／BR定義）', domain: 'TXN_DENSAI_MASTER', caseScope: 'AR',
    x: 332, y: 262, w: 276, h: 56, pk: 'CUST_TRX_TYPE_SEQ_ID', fks: ['GL_ID_REC', 'GL_ID_REV'],
    desc: 'AR通常請求(`INV`)および電子記録債権(`BR`)の取引クラス・未取立/取立中/割引中CCIDを定義。',
    keyCols: [
      { name: 'CUST_TRX_TYPE_SEQ_ID', type: 'NUMBER(18)', role: 'PK', desc: '取引タイプSEQ_ID' },
      { name: 'NAME', type: 'VARCHAR2(20)', role: '', desc: 'JP_INV / JP_DENSAI_BR' },
      { name: 'TYPE', type: 'VARCHAR2(20)', role: '', desc: 'INV / BR（電子記録債権）' },
      { name: 'GL_ID_UNPAID_REC', type: 'NUMBER(18)', role: 'FK', desc: '未取立電子記録債権CCID（1120）' }
    ]
  },
  ZX_RATES_B: {
    id: 'ZX_RATES_B', name: 'ZX_RATES_B', jpName: '税率マスタ (EBTax 10% / 軽減8%)', domain: 'TXN_DENSAI_MASTER', caseScope: 'ALL',
    x: 332, y: 330, w: 276, h: 56, pk: 'TAX_RATE_ID', fks: [],
    desc: 'Fusion EBTaxの税率定義。明細1用 標準税率10% と 明細2用 軽減税率8% を保持。',
    keyCols: [
      { name: 'TAX_RATE_ID', type: 'NUMBER(15)', role: 'PK', desc: '税率ID（101=10%, 102=8%）' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: '', desc: 'JP_TAX_10 / JP_TAX_08_RED' },
      { name: 'PERCENTAGE_RATE', type: 'NUMBER', role: '', desc: '10.00 / 8.00' },
      { name: 'RATE_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'PERCENTAGE' }
    ]
  },
  AP_AWT_GROUPS: {
    id: 'AP_AWT_GROUPS', name: 'AP_AWT_GROUPS', jpName: '源泉徴収税グループ定義', domain: 'TXN_DENSAI_MASTER', caseScope: 'AP',
    x: 332, y: 398, w: 276, h: 56, pk: 'GROUP_ID', fks: [],
    desc: '100万円以下10.21%・100万円超20.42%の段階源泉税率を組み合わせるグループ定義。',
    keyCols: [
      { name: 'GROUP_ID', type: 'NUMBER(18)', role: 'PK', desc: '源泉グループID（901）' },
      { name: 'NAME', type: 'VARCHAR2(25)', role: '', desc: 'JP_WHT_PROGRESSIVE_26D' },
      { name: 'DESCRIPTION', type: 'VARCHAR2(240)', role: '', desc: '報酬段階源泉（<=100万:10.21%, >100万:20.42%）' }
    ]
  },
  AP_AWT_TAX_RATES_ALL: {
    id: 'AP_AWT_TAX_RATES_ALL', name: 'AP_AWT_TAX_RATES_ALL', jpName: '源泉徴収税率（10.21% / 20.42%）', domain: 'TXN_DENSAI_MASTER', caseScope: 'AP',
    x: 332, y: 466, w: 276, h: 56, pk: 'TAX_RATE_ID', fks: ['TAX_NAME'],
    desc: '金額レンジ（START_AMOUNT / END_AMOUNT）に基づく段階的源泉税率（10.21%と20.42%）を保持。',
    keyCols: [
      { name: 'TAX_RATE_ID', type: 'NUMBER(18)', role: 'PK', desc: '源泉税率ID' },
      { name: 'TAX_NAME', type: 'VARCHAR2(15)', role: '', desc: 'JP_WHT_PROF' },
      { name: 'TAX_RATE', type: 'NUMBER', role: '', desc: '10.21 (<=100万) / 20.42 (>100万)' },
      { name: 'START_AMOUNT', type: 'NUMBER', role: '', desc: '0〜1,000,000 / 1,000,001〜' }
    ]
  },
  CE_BANK_ACCOUNTS: {
    id: 'CE_BANK_ACCOUNTS', name: 'CE_BANK_ACCOUNTS', jpName: '自社銀行・でんさい決済口座', domain: 'TXN_DENSAI_MASTER', caseScope: 'ALL',
    x: 332, y: 534, w: 276, h: 56, pk: 'BANK_ACCOUNT_ID', fks: ['ASSET_CODE_COMBINATION_ID'],
    desc: '電子記録債務の満期引落・電子記録債権の満期入金および割引代金の着金銀行口座。',
    keyCols: [
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'PK', desc: '銀行口座ID（8001）' },
      { name: 'BANK_ACCOUNT_NAME', type: 'VARCHAR2(100)', role: '', desc: 'みずほ銀行 本店 普通（でんさい連携）' },
      { name: 'BANK_ACCOUNT_NUM', type: 'VARCHAR2(30)', role: '', desc: '1234567' },
      { name: 'ASSET_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '普通預金CCID（1001）' }
    ]
  },
  CE_BANK_ACCT_USES_ALL: {
    id: 'CE_BANK_ACCT_USES_ALL', name: 'CE_BANK_ACCT_USES_ALL', jpName: 'BU別銀行口座用途・BR/BP勘定', domain: 'TXN_DENSAI_MASTER', caseScope: 'ALL',
    x: 332, y: 602, w: 276, h: 56, pk: 'BANK_ACCT_USE_ID', fks: ['BANK_ACCOUNT_ID', 'ORG_ID'],
    desc: '銀行口座をBU単位に紐付け、取立中債権・割引保証・現金消込勘定CCIDを規定。',
    keyCols: [
      { name: 'BANK_ACCT_USE_ID', type: 'NUMBER(18)', role: 'PK', desc: '口座用途ID（7001）' },
      { name: 'BANK_ACCOUNT_ID', type: 'NUMBER(18)', role: 'FK', desc: '銀行口座ID（8001）' },
      { name: 'AP_USE_ENABLE_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y（APでんさい支払有効）' },
      { name: 'AR_USE_ENABLE_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y（ARでんさい取立・割引有効）' }
    ]
  },
  IBY_PAYMENT_METHODS_B: {
    id: 'IBY_PAYMENT_METHODS_B', name: 'IBY_PAYMENT_METHODS_B', jpName: '支払方法 (BILLS_PAYABLE)', domain: 'TXN_DENSAI_MASTER', caseScope: 'AP',
    x: 332, y: 670, w: 276, h: 56, pk: 'PAYMENT_METHOD_CODE', fks: [],
    desc: 'Oracle Paymentsの支払方法定義。電子記録債務では将来の満期日指定支払（BILLS_PAYABLE）を使用。',
    keyCols: [
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: 'PK', desc: 'BILLS_PAYABLE（でんさい払）' },
      { name: 'SUPPORT_BILLS_PAYABLE_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y（満期決済型・債務管理）' },
      { name: 'MATURITY_DATE_OFFSET_DAYS', type: 'NUMBER', role: '', desc: '90（振出90日後満期）' }
    ]
  },
  AR_RECEIPT_METHODS: {
    id: 'AR_RECEIPT_METHODS', name: 'AR_RECEIPT_METHODS', jpName: '受取/取立/割引/譲渡方法 (BR)', domain: 'TXN_DENSAI_MASTER', caseScope: 'AR',
    x: 332, y: 738, w: 276, h: 56, pk: 'RECEIPT_METHOD_ID', fks: ['RECEIPT_CLASS_ID'],
    desc: '電子記録債権（BR）の引受生成・銀行取立・銀行割引(FACTORING)・裏書譲渡(ENDORSEMENT)方式を定義。',
    keyCols: [
      { name: 'RECEIPT_METHOD_ID', type: 'NUMBER(18)', role: 'PK', desc: '受取方法ID（410/411/412）' },
      { name: 'NAME', type: 'VARCHAR2(30)', role: '', desc: 'DENSAI_STD / DENSAI_FACT / DENSAI_END' },
      { name: 'PAYMENT_CHANNEL_CODE', type: 'VARCHAR2(30)', role: '', desc: 'BILLS_RECEIVABLE' }
    ]
  },
  AR_RECEIVABLES_TRX_ALL: {
    id: 'AR_RECEIVABLES_TRX_ALL', name: 'AR_RECEIVABLES_TRX_ALL', jpName: '債権調整・割引料活動定義', domain: 'TXN_DENSAI_MASTER', caseScope: 'AR',
    x: 332, y: 806, w: 276, h: 56, pk: 'RECEIVABLES_TRX_ID', fks: ['CODE_COMBINATION_ID'],
    desc: 'AR側での源泉税控除調整（WHT）や銀行割引料（手形売却損 6101）に使う債権活動マスタ。',
    keyCols: [
      { name: 'RECEIVABLES_TRX_ID', type: 'NUMBER(18)', role: 'PK', desc: '債権活動ID（601=WHT, 602=割引料）' },
      { name: 'NAME', type: 'VARCHAR2(50)', role: '', desc: 'WHT_DEDUCTION / FACTORING_FEE' },
      { name: 'TYPE', type: 'VARCHAR2(30)', role: '', desc: 'ADJUSTMENT / BANK_CHARGES' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '仮払源泉(1150) / 割引料(6101)' }
    ]
  },

  // === D. DENSAI_TXNS (21: 左10 + 右11) ===
  AP_INVOICES_ALL: {
    id: 'AP_INVOICES_ALL', name: 'AP_INVOICES_ALL', jpName: 'AP請求書ヘッダ', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 60, w: 286, h: 58, pk: 'INVOICE_ID', fks: ['VENDOR_ID', 'VENDOR_SITE_ID', 'ORG_ID', 'AWT_GROUP_ID'],
    desc: 'AP標準請求書のヘッダ情報。支払方法にBILLS_PAYABLE、源泉グループと税込合計金額を保持。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK', desc: '請求書ID（10001）' },
      { name: 'INVOICE_NUM', type: 'VARCHAR2(50)', role: '', desc: 'AP-DEN-2026-001' },
      { name: 'INVOICE_AMOUNT', type: 'NUMBER', role: '', desc: '2,180,000（税抜200万+税18万）' },
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: '', desc: 'BILLS_PAYABLE（でんさい）' },
      { name: 'PAYMENT_STATUS_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'N→Y（でんさい振出後消込済）' }
    ]
  },
  AP_INVOICE_LINES_ALL: {
    id: 'AP_INVOICE_LINES_ALL', name: 'AP_INVOICE_LINES_ALL', jpName: 'AP請求書明細（2品目+税+源泉）', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 138, w: 286, h: 58, pk: 'INVOICE_ID, LINE_NUMBER', fks: ['INVOICE_ID', 'DEFAULT_DIST_CCID'],
    desc: '品目明細2本（10%対象100万・8%対象100万）および自動生成された税明細・段階源泉明細を保持。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '請求書ID' },
      { name: 'LINE_NUMBER', type: 'NUMBER', role: 'PK', desc: '1,2(品目) 3,4(税) 5,6(源泉)' },
      { name: 'LINE_TYPE_LOOKUP_CODE', type: 'VARCHAR2(25)', role: '', desc: 'ITEM / TAX / AWT' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '100万, 100万, 10万, 8万, -10.21万, -20.42万' }
    ]
  },
  ZX_LINES: {
    id: 'ZX_LINES', name: 'ZX_LINES', jpName: 'EBTax 税明細（AP・AR共通）', domain: 'DENSAI_TXNS', caseScope: 'ALL',
    x: 650, y: 216, w: 286, h: 58, pk: 'TAX_LINE_ID', fks: ['TRX_ID', 'TAX_RATE_ID'],
    desc: 'E-Business Taxが算出する課税詳細。AP/AR問わず明細1(10% = 100,000)・明細2(8% = 80,000)を保持。',
    keyCols: [
      { name: 'TAX_LINE_ID', type: 'NUMBER(15)', role: 'PK', desc: '税明細ID' },
      { name: 'APPLICATION_ID', type: 'NUMBER', role: '', desc: '200(AP) / 222(AR)' },
      { name: 'TAX_RATE_CODE', type: 'VARCHAR2(50)', role: '', desc: 'JP_TAX_10 / JP_TAX_08_RED' },
      { name: 'TAX_AMT', type: 'NUMBER', role: '', desc: '100,000 / 80,000' }
    ]
  },
  AP_INVOICE_DISTRIBUTIONS_ALL: {
    id: 'AP_INVOICE_DISTRIBUTIONS_ALL', name: 'AP_INVOICE_DISTRIBUTIONS_ALL', jpName: 'AP請求書配分（費用・税・源泉）', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 294, w: 286, h: 58, pk: 'INVOICE_DISTRIBUTION_ID', fks: ['INVOICE_ID', 'DIST_CODE_COMBINATION_ID', 'ACCOUNTING_EVENT_ID'],
    desc: '明細ごとの勘定配分（費用2,000,000・仮払消費税180,000・預り源泉-306,300）とSLAイベントリンク元。',
    keyCols: [
      { name: 'INVOICE_DISTRIBUTION_ID', type: 'NUMBER(18)', role: 'PK', desc: '配分ID' },
      { name: 'LINE_TYPE_LOOKUP_CODE', type: 'VARCHAR2(25)', role: '', desc: 'ITEM / REC_TAX / AWT' },
      { name: 'DIST_CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '5001,5002,1501,1502,2201,2202' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '各配分額（正味計 1,873,700）' }
    ]
  },
  AP_PAYMENT_SCHEDULES_ALL: {
    id: 'AP_PAYMENT_SCHEDULES_ALL', name: 'AP_PAYMENT_SCHEDULES_ALL', jpName: 'AP支払予定スケジュール', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 372, w: 286, h: 58, pk: 'INVOICE_ID, PAYMENT_NUM', fks: ['INVOICE_ID'],
    desc: '源泉税306,300円控除後の正味要支払額1,873,700円および支払期限・でんさい振出後残高0を管理。',
    keyCols: [
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '請求書ID' },
      { name: 'PAYMENT_NUM', type: 'NUMBER', role: 'PK', desc: '支払分割番号（1）' },
      { name: 'GROSS_AMOUNT', type: 'NUMBER', role: '', desc: '2,180,000（源泉前総額）' },
      { name: 'AMOUNT_REMAINING', type: 'NUMBER', role: '', desc: '1,873,700 → 0（振出時）' }
    ]
  },
  IBY_DOCS_PAYABLE_ALL: {
    id: 'IBY_DOCS_PAYABLE_ALL', name: 'IBY_DOCS_PAYABLE_ALL', jpName: 'IBY 支払指示ドキュメント', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 450, w: 286, h: 58, pk: 'DOCUMENT_PAYABLE_ID', fks: ['CALLING_APP_DOC_UNIQUE_REF1', 'PAYMENT_ID'],
    desc: 'AP支払処理要求(PPR)からOracle Paymentsへ連携される支払対象ドキュメント（正味1,873,700円）。',
    keyCols: [
      { name: 'DOCUMENT_PAYABLE_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払ドキュメントID' },
      { name: 'PAYMENT_AMOUNT', type: 'NUMBER', role: '', desc: '1,873,700' },
      { name: 'PAYMENT_METHOD_CODE', type: 'VARCHAR2(30)', role: '', desc: 'BILLS_PAYABLE' },
      { name: 'DOCUMENT_STATUS', type: 'VARCHAR2(30)', role: '', desc: 'PAYMENT_CREATED' }
    ]
  },
  IBY_PAYMENTS_ALL: {
    id: 'IBY_PAYMENTS_ALL', name: 'IBY_PAYMENTS_ALL', jpName: 'IBY 統合支払情報（でんさいデータ）', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 528, w: 286, h: 58, pk: 'PAYMENT_ID', fks: ['INTERNAL_BANK_ACCOUNT_ID'],
    desc: 'でんさいネット送信用の支払バッチレコード。支払方法BILLS_PAYABLE・満期日2026-08-14を管理。',
    keyCols: [
      { name: 'PAYMENT_ID', type: 'NUMBER(18)', role: 'PK', desc: 'IBY支払ID（91001）' },
      { name: 'PAYMENT_AMOUNT', type: 'NUMBER', role: '', desc: '1,873,700' },
      { name: 'MATURITY_DATE', type: 'DATE', role: '', desc: '2026-08-14（満期決済日）' },
      { name: 'PAYMENT_STATUS', type: 'VARCHAR2(30)', role: '', desc: 'ISSUED' }
    ]
  },
  AP_CHECKS_ALL: {
    id: 'AP_CHECKS_ALL', name: 'AP_CHECKS_ALL', jpName: 'AP支払（電子記録債務・小切手管理）', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 606, w: 286, h: 58, pk: 'CHECK_ID', fks: ['VENDOR_ID', 'CE_BANK_ACCT_USE_ID', 'PAYMENT_ID'],
    desc: 'APにおける電子記録債務振出レコード。FUTURE_DATED_PMT_FLAG=Y、満期まではISSUED、満期引落でCLEARED。',
    keyCols: [
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払ID（88001）' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '1,873,700' },
      { name: 'STATUS_LOOKUP_CODE', type: 'VARCHAR2(25)', role: '', desc: 'ISSUED（振出）→ CLEARED（満期）' },
      { name: 'MATURITY_EXCHANGE_DATE', type: 'DATE', role: '', desc: '2026-08-14（満期日）' },
      { name: 'FUTURE_DATED_PMT_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y（電子記録債務 / 支払手形）' }
    ]
  },
  AP_INVOICE_PAYMENTS_ALL: {
    id: 'AP_INVOICE_PAYMENTS_ALL', name: 'AP_INVOICE_PAYMENTS_ALL', jpName: 'AP請求書・支払消込明細', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 684, w: 286, h: 58, pk: 'INVOICE_PAYMENT_ID', fks: ['INVOICE_ID', 'CHECK_ID', 'ACCOUNTING_EVENT_ID'],
    desc: '請求書とでんさい支払を結び付け、買掛金を消込・電子記録債務への振替基点となるテーブル。',
    keyCols: [
      { name: 'INVOICE_PAYMENT_ID', type: 'NUMBER(18)', role: 'PK', desc: '請求支払消込ID' },
      { name: 'INVOICE_ID', type: 'NUMBER(18)', role: 'FK', desc: '請求書ID' },
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'FK', desc: '支払ID（88001）' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '1,873,700' }
    ]
  },
  AP_PAYMENT_HISTORY_ALL: {
    id: 'AP_PAYMENT_HISTORY_ALL', name: 'AP_PAYMENT_HISTORY_ALL', jpName: 'AP支払履歴（振出→満期決済）', domain: 'DENSAI_TXNS', caseScope: 'AP',
    x: 650, y: 762, w: 286, h: 58, pk: 'PAYMENT_HISTORY_ID', fks: ['CHECK_ID', 'ACCOUNTING_EVENT_ID', 'ORG_ID'],
    desc: '振出時 PAYMENT CREATED（買掛金→電子記録債務）と、満期決済時 PAYMENT MATURITY（電子記録債務→預金）のライフサイクルを記録。',
    keyCols: [
      { name: 'PAYMENT_HISTORY_ID', type: 'NUMBER(18)', role: 'PK', desc: '支払履歴ID（70001 / 70002）' },
      { name: 'CHECK_ID', type: 'NUMBER(18)', role: 'FK', desc: '支払ID（88001）' },
      { name: 'TRANSACTION_TYPE', type: 'VARCHAR2(30)', role: '', desc: 'PAYMENT CREATED / PAYMENT MATURITY' },
      { name: 'TRANSACTION_AMOUNT', type: 'NUMBER', role: '', desc: '1,873,700' },
      { name: 'POSTED_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'N → Y（SLA転記後）' }
    ]
  },

  // --- D右サブ列: AR & 電子記録債権(BR) (11 tables) ---
  RA_CUSTOMER_TRX_ALL: {
    id: 'RA_CUSTOMER_TRX_ALL', name: 'RA_CUSTOMER_TRX_ALL', jpName: 'AR請求書 & 電子記録債権(BR)本体', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 58, w: 286, h: 56, pk: 'CUSTOMER_TRX_ID', fks: ['BILL_TO_CUSTOMER_ID', 'CUST_TRX_TYPE_SEQ_ID', 'BATCH_ID'],
    desc: '通常AR請求書(INV)と、それを受け取る電子記録債権本体(BR)の両方を格納する中核ヘッダ表。',
    keyCols: [
      { name: 'CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'PK', desc: '取引ID（30001=請求書, 30002=でんさいBR）' },
      { name: 'TRX_NUMBER', type: 'VARCHAR2(20)', role: '', desc: 'AR-INV-2026-001 / DEN-BR-2026-001' },
      { name: 'BR_AMOUNT', type: 'NUMBER', role: '', desc: '1,873,700（BR時）' },
      { name: 'COMPLETE_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y（完了）' }
    ]
  },
  RA_CUSTOMER_TRX_LINES_ALL: {
    id: 'RA_CUSTOMER_TRX_LINES_ALL', name: 'RA_CUSTOMER_TRX_LINES_ALL', jpName: 'AR請求書明細 & BR原債権参照明細', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 132, w: 286, h: 56, pk: 'CUSTOMER_TRX_LINE_ID', fks: ['CUSTOMER_TRX_ID', 'BR_REF_CUSTOMER_TRX_ID', 'BR_REF_PAYMENT_SCHEDULE_ID'],
    desc: 'AR明細（10%/8%品目＋税）に加え、BRレコードでは BR_REF_CUSTOMER_TRX_ID で元売掛請求書を紐付ける。',
    keyCols: [
      { name: 'CUSTOMER_TRX_LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: '明細ID' },
      { name: 'LINE_TYPE', type: 'VARCHAR2(20)', role: '', desc: 'LINE / TAX / BR' },
      { name: 'EXTENDED_AMOUNT', type: 'NUMBER', role: '', desc: '100万, 100万, 10万, 8万 / 1,873,700' },
      { name: 'BR_REF_CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'FK', desc: '元AR請求書ID（30001）' },
      { name: 'BR_REF_PAYMENT_SCHEDULE_ID', type: 'NUMBER(18)', role: 'FK', desc: '元AR支払予定ID' }
    ]
  },
  RA_CUST_TRX_LINE_GL_DIST_ALL: {
    id: 'RA_CUST_TRX_LINE_GL_DIST_ALL', name: 'RA_CUST_TRX_LINE_GL_DIST_ALL', jpName: 'AR請求書・BR勘定配分', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 206, w: 286, h: 56, pk: 'CUST_TRX_LINE_GL_DIST_ID', fks: ['CUSTOMER_TRX_ID', 'CODE_COMBINATION_ID'],
    desc: 'AR請求確定時の売掛金(REC)・売上10%/8%(REV)・仮受消費税(TAX)の勘定配分明細。',
    keyCols: [
      { name: 'CUST_TRX_LINE_GL_DIST_ID', type: 'NUMBER(18)', role: 'PK', desc: 'GL配分ID' },
      { name: 'ACCOUNT_CLASS', type: 'VARCHAR2(20)', role: '', desc: 'REC / REV / TAX' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '1110, 4001, 4002, 2501, 2502' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '2,180,000 / 100万 / 10万 / 8万' }
    ]
  },
  AR_PAYMENT_SCHEDULES_ALL: {
    id: 'AR_PAYMENT_SCHEDULES_ALL', name: 'AR_PAYMENT_SCHEDULES_ALL', jpName: 'AR回収予定スケジュール (INV & BR)', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 280, w: 286, h: 56, pk: 'PAYMENT_SCHEDULE_ID', fks: ['CUSTOMER_TRX_ID', 'CASH_RECEIPT_ID'],
    desc: '売掛請求残高（源泉控除後1,873,700→BR受取で0へ）およびBR満期債権の未決済残高を管理。',
    keyCols: [
      { name: 'PAYMENT_SCHEDULE_ID', type: 'NUMBER(18)', role: 'PK', desc: 'スケジュールID（40001 / 40002）' },
      { name: 'CLASS', type: 'VARCHAR2(20)', role: '', desc: 'INV（請求）/ BR（電子記録債権）' },
      { name: 'AMOUNT_ADJUSTED', type: 'NUMBER', role: '', desc: '-306,300（源泉控除）' },
      { name: 'AMOUNT_DUE_REMAINING', type: 'NUMBER', role: '', desc: '未回収残（受取/決済後 0）' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'OP（未済）→ CL（クローズ）' }
    ]
  },
  AR_BATCHES_ALL: {
    id: 'AR_BATCHES_ALL', name: 'AR_BATCHES_ALL', jpName: 'ARバッチ（BR生成・取立送金・割引）', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 354, w: 286, h: 56, pk: 'BATCH_ID', fks: ['REMIT_BANK_ACCT_USE_ID', 'RECEIPT_METHOD_ID'],
    desc: '電子記録債権の一括生成(CREATION)、銀行取立送金(REMITTANCE)、または銀行割引(FACTORING)の実行単位バッチ。',
    keyCols: [
      { name: 'BATCH_ID', type: 'NUMBER(18)', role: 'PK', desc: 'バッチID（5001 / 5002 / 5003）' },
      { name: 'NAME', type: 'VARCHAR2(50)', role: '', desc: 'BR_CREATE / BR_REMIT / BR_FACTOR' },
      { name: 'TYPE', type: 'VARCHAR2(30)', role: '', desc: 'BR / REMITTANCE' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'COMPLETED_CREATION' }
    ]
  },
  AR_TRANSACTION_HISTORY_ALL: {
    id: 'AR_TRANSACTION_HISTORY_ALL', name: 'AR_TRANSACTION_HISTORY_ALL', jpName: '電子記録債権(BR) 状態遷移履歴', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 428, w: 286, h: 56, pk: 'TRANSACTION_HISTORY_ID', fks: ['CUSTOMER_TRX_ID', 'BATCH_ID', 'EVENT_ID'],
    desc: 'でんさいの全ステータス遷移（PENDING_REMITTANCE→REMITTED / FACTORED / ENDORSED→CLOSED）とSLAイベントを記録する中核表。',
    keyCols: [
      { name: 'TRANSACTION_HISTORY_ID', type: 'NUMBER(18)', role: 'PK', desc: '履歴ID（80001〜）' },
      { name: 'CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'FK', desc: 'BR取引ID' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'PENDING_REMITTANCE / REMITTED / FACTORED / ENDORSED / CLOSED' },
      { name: 'EVENT', type: 'VARCHAR2(30)', role: '', desc: 'COMPLETED / REMITTED / FACTORED / ENDORSED / RISK_ELIMINATED / MATURITY_DATE' },
      { name: 'CURRENT_RECORD_FLAG', type: 'VARCHAR2(1)', role: '', desc: 'Y（最新状態） / N（過去履歴）' }
    ]
  },
  AR_ADJUSTMENTS_ALL: {
    id: 'AR_ADJUSTMENTS_ALL', name: 'AR_ADJUSTMENTS_ALL', jpName: 'AR債権調整（先方控除源泉税・割引料）', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 502, w: 286, h: 56, pk: 'ADJUSTMENT_ID', fks: ['CUSTOMER_TRX_ID', 'PAYMENT_SCHEDULE_ID', 'RECEIVABLES_TRX_ID', 'EVENT_ID'],
    desc: '得意先から天引きされた段階源泉所得税（10.21%=-102,100円、20.42%=-204,200円）を請求書から減額調整する表。',
    keyCols: [
      { name: 'ADJUSTMENT_ID', type: 'NUMBER(18)', role: 'PK', desc: '調整ID（60001 / 60002）' },
      { name: 'CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'FK', desc: '元AR請求書ID' },
      { name: 'RECEIVABLES_TRX_ID', type: 'NUMBER(18)', role: 'FK', desc: '601（WHT_DEDUCTION）' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '-102,100 (10.21%) / -204,200 (20.42%)' },
      { name: 'TYPE', type: 'VARCHAR2(15)', role: '', desc: 'INVOICE / LINE' }
    ]
  },
  AR_CASH_RECEIPTS_ALL: {
    id: 'AR_CASH_RECEIPTS_ALL', name: 'AR_CASH_RECEIPTS_ALL', jpName: 'AR入金（満期振込・割引手取金）', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 576, w: 286, h: 56, pk: 'CASH_RECEIPT_ID', fks: ['PAY_FROM_CUSTOMER', 'RECEIPT_METHOD_ID', 'REMIT_BANK_ACCT_USE_ID'],
    desc: 'でんさい満期時の銀行振込入金（1,873,700円）または銀行割引時の手取着金（990,000円）を記録。',
    keyCols: [
      { name: 'CASH_RECEIPT_ID', type: 'NUMBER(18)', role: 'PK', desc: '入金ID（50001）' },
      { name: 'RECEIPT_NUMBER', type: 'VARCHAR2(30)', role: '', desc: 'BR-RCPT-2026-001 / BR-FACT-2026-001' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '1,873,700 / 990,000' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'APP（充当済）' }
    ]
  },
  AR_CASH_RECEIPT_HISTORY_ALL: {
    id: 'AR_CASH_RECEIPT_HISTORY_ALL', name: 'AR_CASH_RECEIPT_HISTORY_ALL', jpName: 'AR入金履歴（REMITTED→CLEARED）', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 650, w: 286, h: 56, pk: 'CASH_RECEIPT_HISTORY_ID', fks: ['CASH_RECEIPT_ID', 'EVENT_ID'],
    desc: '入金ステータス（REMITTED→CLEARED銀行消込）の履歴とGL日付管理。',
    keyCols: [
      { name: 'CASH_RECEIPT_HISTORY_ID', type: 'NUMBER(18)', role: 'PK', desc: '入金履歴ID' },
      { name: 'CASH_RECEIPT_ID', type: 'NUMBER(18)', role: 'FK', desc: '入金ID' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'CLEARED' },
      { name: 'AMOUNT', type: 'NUMBER', role: '', desc: '1,873,700 / 990,000' }
    ]
  },
  AR_RECEIVABLE_APPLICATIONS_ALL: {
    id: 'AR_RECEIVABLE_APPLICATIONS_ALL', name: 'AR_RECEIVABLE_APPLICATIONS_ALL', jpName: 'AR入金・BR充当消込明細', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 724, w: 286, h: 56, pk: 'RECEIVABLE_APPLICATION_ID', fks: ['CASH_RECEIPT_ID', 'APPLIED_CUSTOMER_TRX_ID', 'APPLIED_PAYMENT_SCHEDULE_ID'],
    desc: '満期入金または割引・譲渡消込を電子記録債権本体（BR）へ充当し、BRの決済完了を記録する表。',
    keyCols: [
      { name: 'RECEIVABLE_APPLICATION_ID', type: 'NUMBER(18)', role: 'PK', desc: '充当ID' },
      { name: 'APPLIED_CUSTOMER_TRX_ID', type: 'NUMBER(18)', role: 'FK', desc: '充当先BR取引ID' },
      { name: 'AMOUNT_APPLIED', type: 'NUMBER', role: '', desc: '1,873,700 / 997,900' },
      { name: 'STATUS', type: 'VARCHAR2(30)', role: '', desc: 'APP / ACTIVITY' }
    ]
  },
  AR_DISTRIBUTIONS_ALL: {
    id: 'AR_DISTRIBUTIONS_ALL', name: 'AR_DISTRIBUTIONS_ALL', jpName: 'AR取引履歴・入金・調整 仕訳配分', domain: 'DENSAI_TXNS', caseScope: 'AR',
    x: 956, y: 798, w: 286, h: 56, pk: 'LINE_ID', fks: ['SOURCE_ID', 'CODE_COMBINATION_ID'],
    desc: 'AR_TRANSACTION_HISTORY_ALL / AR_ADJUSTMENTS_ALL / AR_CASH_RECEIPTS_ALL 等が生成する全貸借配分ソース。',
    keyCols: [
      { name: 'LINE_ID', type: 'NUMBER(18)', role: 'PK', desc: 'AR配分明細ID' },
      { name: 'SOURCE_TABLE', type: 'VARCHAR2(16)', role: '', desc: 'TH(履歴) / ADJ(調整) / CRH(入金)' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '1120,1121,1122,1123,1150,6101,1001' },
      { name: 'AMOUNT_DR / AMOUNT_CR', type: 'NUMBER', role: '', desc: '借方金額 / 貸方金額' }
    ]
  },

  // === E. SLA_XLA (5) ===
  XLA_TRANSACTION_ENTITIES: {
    id: 'XLA_TRANSACTION_ENTITIES', name: 'XLA_TRANSACTION_ENTITIES', jpName: 'SLA 取引エンティティ', domain: 'SLA_XLA', caseScope: 'ALL',
    x: 1288, y: 58, w: 440, h: 56, pk: 'ENTITY_ID', fks: ['APPLICATION_ID', 'LEDGER_ID'],
    desc: 'AP請求/AP支払、AR請求/BR/入金/調整などの取引キーをSLA共通で保持する橋渡しテーブル。',
    keyCols: [
      { name: 'ENTITY_ID', type: 'NUMBER(15)', role: 'PK', desc: 'SLAエンティティID' },
      { name: 'ENTITY_CODE', type: 'VARCHAR2(30)', role: '', desc: 'AP_INVOICES / AP_PAYMENTS / TRANSACTIONS / BILLS_RECEIVABLE' },
      { name: 'TRANSACTION_NUMBER', type: 'VARCHAR2(240)', role: '', desc: '伝票・でんさい番号' },
      { name: 'SOURCE_ID_INT_1', type: 'NUMBER(15)', role: '', desc: 'INVOICE_ID / CHECK_ID / CUSTOMER_TRX_ID' }
    ]
  },
  XLA_EVENTS: {
    id: 'XLA_EVENTS', name: 'XLA_EVENTS', jpName: 'SLA 会計イベント', domain: 'SLA_XLA', caseScope: 'ALL',
    x: 1288, y: 124, w: 440, h: 56, pk: 'EVENT_ID', fks: ['ENTITY_ID'],
    desc: '請求書検証・でんさい振出・満期決済・BR受取・銀行取立・割引・裏書譲渡・リスク消滅の会計事象を管理。',
    keyCols: [
      { name: 'EVENT_ID', type: 'NUMBER(15)', role: 'PK', desc: '会計イベントID' },
      { name: 'EVENT_TYPE_CODE', type: 'VARCHAR2(30)', role: '', desc: 'INVOICE_VALIDATED / PAYMENT_CREATED / REMIT_BR / FACTOR_BR / ENDORSE_BR / BILL_RISK_ELIMINATED' },
      { name: 'EVENT_STATUS_CODE', type: 'VARCHAR2(1)', role: '', desc: 'U(未処理) → P(SLA仕訳完了)' }
    ]
  },
  XLA_AE_HEADERS: {
    id: 'XLA_AE_HEADERS', name: 'XLA_AE_HEADERS', jpName: 'SLA 仕訳ヘッダ', domain: 'SLA_XLA', caseScope: 'ALL',
    x: 1288, y: 190, w: 440, h: 56, pk: 'AE_HEADER_ID', fks: ['EVENT_ID', 'LEDGER_ID'],
    desc: '会計エンジン（Create Accounting）がイベントから生成したSLA仕訳ヘッダ。GL転記ステータスを管理。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: 'SLA仕訳ヘッダID' },
      { name: 'ACCOUNTING_DATE', type: 'DATE', role: '', desc: '計上日・振出日・満期日・割引日' },
      { name: 'GL_TRANSFER_STATUS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'N → Y（GL転送完了）' },
      { name: 'JE_CATEGORY_NAME', type: 'VARCHAR2(30)', role: '', desc: 'Purchase Invoices / Payments / Bills Receivable' }
    ]
  },
  XLA_AE_LINES: {
    id: 'XLA_AE_LINES', name: 'XLA_AE_LINES', jpName: 'SLA 仕訳明細', domain: 'SLA_XLA', caseScope: 'ALL',
    x: 1288, y: 256, w: 440, h: 56, pk: 'AE_HEADER_ID, AE_LINE_NUM', fks: ['AE_HEADER_ID', 'CODE_COMBINATION_ID'],
    desc: '9セグメントCCIDへの正確な借方・貸方仕訳行。全イベントの貸借一致（AP:5,927,400 / AR系:8,107,400）を保証。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: 'SLAヘッダID' },
      { name: 'AE_LINE_NUM', type: 'NUMBER(15)', role: 'PK', desc: '明細行番号' },
      { name: 'ACCOUNTING_CLASS_CODE', type: 'VARCHAR2(30)', role: '', desc: 'LIABILITY / FUTURE_DATED_PMT / BR / CASH / LOSS' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '9セグメントCCID' },
      { name: 'ACCOUNTED_DR / CR', type: 'NUMBER', role: '', desc: '機能通貨(JPY) 借方・貸方' }
    ]
  },
  XLA_DISTRIBUTION_LINKS: {
    id: 'XLA_DISTRIBUTION_LINKS', name: 'XLA_DISTRIBUTION_LINKS', jpName: 'SLA 監査トレースリンク', domain: 'SLA_XLA', caseScope: 'ALL',
    x: 1288, y: 322, w: 440, h: 56, pk: 'AE_HEADER_ID, AE_LINE_NUM, REF_AE_HEADER_ID', fks: ['AE_HEADER_ID', 'SOURCE_DISTRIBUTION_ID_NUM_1'],
    desc: 'SLA仕訳明細と業務配分テーブル（AP_INVOICE_DISTRIBUTIONS_ALL / AP_PAYMENT_HISTORY / AR_DISTRIBUTIONS）を1対1で監査紐付け。',
    keyCols: [
      { name: 'AE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: 'SLAヘッダID' },
      { name: 'SOURCE_DISTRIBUTION_TYPE', type: 'VARCHAR2(30)', role: '', desc: 'AP_INV_DIST / AP_PMT_HIST / AR_DISTRIBUTIONS_ALL' },
      { name: 'SOURCE_DISTRIBUTION_ID_NUM_1', type: 'NUMBER(15)', role: 'FK', desc: '業務配分元ID' }
    ]
  },

  // === F. GL_LEDGER (6) ===
  GL_INTERFACE: {
    id: 'GL_INTERFACE', name: 'GL_INTERFACE', jpName: 'GL インタフェース一時表', domain: 'GL_LEDGER', caseScope: 'ALL',
    x: 1288, y: 466, w: 440, h: 56, pk: 'GROUP_ID', fks: ['LEDGER_ID', 'CODE_COMBINATION_ID'],
    desc: 'SLAからGLへの自動転送データ（Journal Import入力バッファ）。取り込み完了後に削除またはステータス更新。',
    keyCols: [
      { name: 'GROUP_ID', type: 'NUMBER(15)', role: 'PK', desc: 'インポートグループID' },
      { name: 'USER_JE_SOURCE_NAME', type: 'VARCHAR2(25)', role: '', desc: 'Payables / Receivables' },
      { name: 'USER_JE_CATEGORY_NAME', type: 'VARCHAR2(25)', role: '', desc: 'Bills Payable / Bills Receivable' },
      { name: 'ENTERED_DR / CR', type: 'NUMBER', role: '', desc: '借方 / 貸方金額' }
    ]
  },
  GL_JE_BATCHES: {
    id: 'GL_JE_BATCHES', name: 'GL_JE_BATCHES', jpName: 'GL 仕訳バッチ', domain: 'GL_LEDGER', caseScope: 'ALL',
    x: 1288, y: 536, w: 440, h: 56, pk: 'JE_BATCH_ID', fks: [],
    desc: 'GL転記を実行する仕訳バッチ単位。ステータスはU(未転記)からP(転記済)へ遷移。',
    keyCols: [
      { name: 'JE_BATCH_ID', type: 'NUMBER(15)', role: 'PK', desc: '仕訳バッチID' },
      { name: 'NAME', type: 'VARCHAR2(100)', role: '', desc: 'DENSAI_SLA_BATCH_2026' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: '', desc: 'P（Posted：転記済）' },
      { name: 'RUNNING_TOTAL_ACCOUNTED_DR', type: 'NUMBER', role: '', desc: 'バッチ借方合計' }
    ]
  },
  GL_JE_HEADERS: {
    id: 'GL_JE_HEADERS', name: 'GL_JE_HEADERS', jpName: 'GL 仕訳ヘッダ', domain: 'GL_LEDGER', caseScope: 'ALL',
    x: 1288, y: 606, w: 440, h: 56, pk: 'JE_HEADER_ID', fks: ['JE_BATCH_ID', 'LEDGER_ID'],
    desc: 'GL仕訳伝票ヘッダ。元帳・期間・ソース・カテゴリ・貸借バランスを保持。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK', desc: '仕訳ヘッダID' },
      { name: 'JE_BATCH_ID', type: 'NUMBER(15)', role: 'FK', desc: '仕訳バッチID' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: '', desc: '2026-05 / 2026-08' },
      { name: 'STATUS', type: 'VARCHAR2(1)', role: '', desc: 'P（Posted）' }
    ]
  },
  GL_JE_LINES: {
    id: 'GL_JE_LINES', name: 'GL_JE_LINES', jpName: 'GL 仕訳明細', domain: 'GL_LEDGER', caseScope: 'ALL',
    x: 1288, y: 676, w: 440, h: 56, pk: 'JE_HEADER_ID, JE_LINE_NUM', fks: ['JE_HEADER_ID', 'CODE_COMBINATION_ID'],
    desc: '転記対象となる9セグメント勘定別のGL仕訳明細。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: '仕訳ヘッダID' },
      { name: 'JE_LINE_NUM', type: 'NUMBER(15)', role: 'PK', desc: '明細行番号' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'FK', desc: '9セグメントCCID' },
      { name: 'ACCOUNTED_DR / CR', type: 'NUMBER', role: '', desc: '機能通貨(JPY) 借方・貸方' }
    ]
  },
  GL_IMPORT_REFERENCES: {
    id: 'GL_IMPORT_REFERENCES', name: 'GL_IMPORT_REFERENCES', jpName: 'GL-SLA ドリルダウン参照', domain: 'GL_LEDGER', caseScope: 'ALL',
    x: 1288, y: 746, w: 440, h: 56, pk: 'JE_HEADER_ID, JE_LINE_NUM, GL_SL_LINK_ID', fks: ['JE_HEADER_ID'],
    desc: 'GL_JE_LINESとXLA_AE_LINESを GL_SL_LINK_ID で紐付け、GL残高から元のでんさい取引画面への完全ドリルダウンを可能にする表。',
    keyCols: [
      { name: 'JE_HEADER_ID', type: 'NUMBER(15)', role: 'PK/FK', desc: 'GL仕訳ヘッダID' },
      { name: 'JE_LINE_NUM', type: 'NUMBER(15)', role: 'PK', desc: 'GL明細行番号' },
      { name: 'GL_SL_LINK_ID', type: 'NUMBER(15)', role: 'FK', desc: 'SLAリンクID' },
      { name: 'GL_SL_LINK_TABLE', type: 'VARCHAR2(30)', role: '', desc: 'XLAJEL' }
    ]
  },
  GL_BALANCES: {
    id: 'GL_BALANCES', name: 'GL_BALANCES', jpName: 'GL 勘定残高サマリ', domain: 'GL_LEDGER', caseScope: 'ALL',
    x: 1288, y: 816, w: 440, h: 56, pk: 'LEDGER_ID, CODE_COMBINATION_ID, PERIOD_NAME', fks: ['LEDGER_ID', 'CODE_COMBINATION_ID'],
    desc: '転記完了後にリアルタイム集計される勘定科目(CCID)別残高。売掛金/買掛金/でんさい残高が決済・リスク消滅後に正しく0となることを証明。',
    keyCols: [
      { name: 'LEDGER_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '元帳ID' },
      { name: 'CODE_COMBINATION_ID', type: 'NUMBER(18)', role: 'PK/FK', desc: '9セグメントCCID' },
      { name: 'PERIOD_NAME', type: 'VARCHAR2(15)', role: 'PK', desc: '対象会計期間' },
      { name: 'PERIOD_NET_DR / CR', type: 'NUMBER', role: '', desc: '当期発生借方・貸方累計' },
      { name: 'END_BALANCE', type: 'NUMBER', role: '', desc: '期末残高（債権債務は0を確認）' }
    ]
  }
};

const RELATIONS = [
  // Org & AFF master links
  { id: 'r1', from: 'XLE_ENTITY_PROFILES', to: 'FUN_ALL_BUSINESS_UNITS_V', label: 'LEGAL_ENTITY_ID', cases: ['ALL'] },
  { id: 'r2', from: 'FUN_ALL_BUSINESS_UNITS_V', to: 'GL_LEDGERS', label: 'PRIMARY_LEDGER_ID', cases: ['ALL'] },
  { id: 'r3', from: 'GL_LEDGERS', to: 'GL_PERIOD_STATUSES', label: 'LEDGER_ID', cases: ['ALL'] },
  { id: 'r4', from: 'FND_KF_STR_INSTANCES_B', to: 'GL_CODE_COMBINATIONS', label: 'STRUCTURE_INSTANCE_ID', cases: ['ALL'] },
  { id: 'r5', from: 'GL_LEDGERS', to: 'GL_CODE_COMBINATIONS', label: 'CHART_OF_ACCOUNTS_ID', cases: ['ALL'] },

  // Partner links
  { id: 'r6', from: 'HZ_PARTIES', to: 'HZ_PARTY_SITES', label: 'PARTY_ID', cases: ['ALL'] },
  { id: 'r7', from: 'HZ_LOCATIONS', to: 'HZ_PARTY_SITES', label: 'LOCATION_ID', cases: ['ALL'] },
  { id: 'r8', from: 'HZ_PARTIES', to: 'POZ_SUPPLIERS', label: 'PARTY_ID', cases: ['AP_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r9', from: 'POZ_SUPPLIERS', to: 'POZ_SUPPLIER_SITES_ALL_M', label: 'VENDOR_ID', cases: ['AP_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r10', from: 'HZ_PARTIES', to: 'HZ_CUST_ACCOUNTS', label: 'PARTY_ID', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },

  // Master -> Txn links
  { id: 'r11', from: 'CE_BANK_ACCOUNTS', to: 'CE_BANK_ACCT_USES_ALL', label: 'BANK_ACCOUNT_ID', cases: ['ALL'] },
  { id: 'r12', from: 'AP_AWT_GROUPS', to: 'AP_AWT_TAX_RATES_ALL', label: 'AWT_GROUP', cases: ['AP_DENSAI'] },

  // AP_DENSAI flows
  { id: 'r20', from: 'POZ_SUPPLIER_SITES_ALL_M', to: 'AP_INVOICES_ALL', label: 'VENDOR_SITE_ID', cases: ['AP_DENSAI'] },
  { id: 'r21', from: 'AP_TERMS_B', to: 'AP_INVOICES_ALL', label: 'TERMS_ID', cases: ['AP_DENSAI'] },
  { id: 'r22', from: 'IBY_PAYMENT_METHODS_B', to: 'AP_INVOICES_ALL', label: 'BILLS_PAYABLE', cases: ['AP_DENSAI'] },
  { id: 'r23', from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_LINES_ALL', label: 'INVOICE_ID', cases: ['AP_DENSAI'] },
  { id: 'r24', from: 'ZX_RATES_B', to: 'ZX_LINES', label: '10% / 8%', cases: ['ALL'] },
  { id: 'r25', from: 'AP_INVOICE_LINES_ALL', to: 'ZX_LINES', label: 'TRX_LINE_ID', cases: ['AP_DENSAI'] },
  { id: 'r26', from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: 'ITEM/TAX/AWT', cases: ['AP_DENSAI'] },
  { id: 'r27', from: 'AP_INVOICES_ALL', to: 'AP_PAYMENT_SCHEDULES_ALL', label: 'INVOICE_ID', cases: ['AP_DENSAI'] },
  { id: 'r28', from: 'AP_PAYMENT_SCHEDULES_ALL', to: 'IBY_DOCS_PAYABLE_ALL', label: 'PPR選定', cases: ['AP_DENSAI'] },
  { id: 'r29', from: 'IBY_DOCS_PAYABLE_ALL', to: 'IBY_PAYMENTS_ALL', label: 'PAYMENT_ID', cases: ['AP_DENSAI'] },
  { id: 'r30', from: 'IBY_PAYMENTS_ALL', to: 'AP_CHECKS_ALL', label: 'CHECK_ID', cases: ['AP_DENSAI'] },
  { id: 'r31', from: 'CE_BANK_ACCT_USES_ALL', to: 'AP_CHECKS_ALL', label: 'BANK_ACCT_USE_ID', cases: ['AP_DENSAI'] },
  { id: 'r32', from: 'AP_CHECKS_ALL', to: 'AP_INVOICE_PAYMENTS_ALL', label: 'CHECK_ID', cases: ['AP_DENSAI'] },
  { id: 'r33', from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: 'CREATED->MATURITY', cases: ['AP_DENSAI'] },

  // AR_DENSAI & AR_DISCOUNT flows
  { id: 'r40', from: 'HZ_CUST_ACCOUNTS', to: 'RA_CUSTOMER_TRX_ALL', label: 'BILL_TO_CUST', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r41', from: 'RA_CUST_TRX_TYPES_ALL', to: 'RA_CUSTOMER_TRX_ALL', label: 'INV / BR', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r42', from: 'RA_CUSTOMER_TRX_ALL', to: 'RA_CUSTOMER_TRX_LINES_ALL', label: 'BR_REF_TRX', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r43', from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'ZX_LINES', label: '10% / 8%', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r44', from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', label: 'REC/REV/TAX', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r45', from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_PAYMENT_SCHEDULES_ALL', label: 'CUSTOMER_TRX_ID', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r46', from: 'AR_PAYMENT_SCHEDULES_ALL', to: 'AR_ADJUSTMENTS_ALL', label: '源泉 -306,300', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r47', from: 'AR_RECEIVABLES_TRX_ALL', to: 'AR_ADJUSTMENTS_ALL', label: 'WHT活動', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r48', from: 'AR_BATCHES_ALL', to: 'AR_TRANSACTION_HISTORY_ALL', label: 'BATCH_ID', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r49', from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_TRANSACTION_HISTORY_ALL', label: 'BR状態履歴', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r50', from: 'AR_RECEIPT_METHODS', to: 'AR_CASH_RECEIPTS_ALL', label: '取立/割引方法', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r51', from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_CASH_RECEIPT_HISTORY_ALL', label: 'CLEARED', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r52', from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: '充当消込', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r53', from: 'AR_TRANSACTION_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: 'BR配分', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },

  // SLA -> GL flows
  { id: 'r60', from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'AP_INVOICES', cases: ['AP_DENSAI'] },
  { id: 'r61', from: 'AP_PAYMENT_HISTORY_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'AP_PAYMENTS', cases: ['AP_DENSAI'] },
  { id: 'r62', from: 'AR_DISTRIBUTIONS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'BR / AR_TXN', cases: ['AR_DENSAI', 'AR_DISCOUNT'] },
  { id: 'r63', from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', label: 'ENTITY_ID', cases: ['ALL'] },
  { id: 'r64', from: 'XLA_EVENTS', to: 'XLA_AE_HEADERS', label: 'EVENT_ID', cases: ['ALL'] },
  { id: 'r65', from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'AE_HEADER_ID', cases: ['ALL'] },
  { id: 'r66', from: 'XLA_AE_LINES', to: 'XLA_DISTRIBUTION_LINKS', label: '監査リンク', cases: ['ALL'] },
  { id: 'r67', from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'GL転送', cases: ['ALL'] },
  { id: 'r68', from: 'GL_INTERFACE', to: 'GL_JE_BATCHES', label: 'Import', cases: ['ALL'] },
  { id: 'r69', from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', label: 'JE_BATCH_ID', cases: ['ALL'] },
  { id: 'r70', from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', label: 'JE_HEADER_ID', cases: ['ALL'] },
  { id: 'r71', from: 'GL_JE_LINES', to: 'GL_IMPORT_REFERENCES', label: 'GL_SL_LINK_ID', cases: ['ALL'] },
  { id: 'r72', from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '転記(P)', cases: ['ALL'] }
];

// === 共通マスタ初期データ ===
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
      { APPLICATION_ID: 222, LEDGER_ID: 2001, PERIOD_NAME: '2026-05', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 101, LEDGER_ID: 2001, PERIOD_NAME: '2026-05', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 200, LEDGER_ID: 2001, PERIOD_NAME: '2026-08', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 222, LEDGER_ID: 2001, PERIOD_NAME: '2026-08', CLOSING_STATUS: 'O' },
      { APPLICATION_ID: 101, LEDGER_ID: 2001, PERIOD_NAME: '2026-08', CLOSING_STATUS: 'O' }
    ],
    FND_KF_STR_INSTANCES_B: [
      { STRUCTURE_INSTANCE_ID: 50001, STRUCTURE_INSTANCE_CODE: 'JP_9SEG_AFF', APPLICATION_ID: 101, KEY_FLEXFIELD_CODE: 'GL#' }
    ],
    GL_CODE_COMBINATIONS: Object.values(CCID_LIST).map(c => ({
      CODE_COMBINATION_ID: c.ccid,
      SEGMENT_CONCAT: c.concat,
      ACCOUNT_DESC: c.name,
      ACCOUNT_TYPE: c.type
    })),
    HZ_PARTIES: [
      { PARTY_ID: 4001, PARTY_NAME: '株式会社東京デザイン製作所', PARTY_TYPE: 'ORGANIZATION', DUNS_NUMBER_C: 'DENSAI-JP-9001' },
      { PARTY_ID: 4002, PARTY_NAME: '株式会社大阪商事', PARTY_TYPE: 'ORGANIZATION', DUNS_NUMBER_C: 'DENSAI-JP-8002' },
      { PARTY_ID: 4003, PARTY_NAME: '株式会社関東システム開発（譲渡先）', PARTY_TYPE: 'ORGANIZATION', DUNS_NUMBER_C: 'DENSAI-JP-7003' }
    ],
    HZ_LOCATIONS: [
      { LOCATION_ID: 4101, ADDRESS1: '東京都渋谷区恵比寿1-2-3', POSTAL_CODE: '150-0013', COUNTRY: 'JP' },
      { LOCATION_ID: 4102, ADDRESS1: '大阪府大阪市北区梅田2-4-9', POSTAL_CODE: '530-0001', COUNTRY: 'JP' },
      { LOCATION_ID: 4103, ADDRESS1: '東京都港区芝浦3-1-1', POSTAL_CODE: '108-0023', COUNTRY: 'JP' }
    ],
    HZ_PARTY_SITES: [
      { PARTY_SITE_ID: 4201, PARTY_ID: 4001, LOCATION_ID: 4101, PARTY_SITE_NUMBER: 'PS-SUP-01' },
      { PARTY_SITE_ID: 4202, PARTY_ID: 4002, LOCATION_ID: 4102, PARTY_SITE_NUMBER: 'PS-CUS-01' },
      { PARTY_SITE_ID: 4203, PARTY_ID: 4003, LOCATION_ID: 4103, PARTY_SITE_NUMBER: 'PS-END-01' }
    ],
    POZ_SUPPLIERS: [
      { VENDOR_ID: 5001, PARTY_ID: 4001, SEGMENT1: 'SUP-1001', VENDOR_NAME: '株式会社東京デザイン製作所', VENDOR_TYPE_LOOKUP_CODE: 'CONTRACTOR' },
      { VENDOR_ID: 5003, PARTY_ID: 4003, SEGMENT1: 'SUP-1003', VENDOR_NAME: '株式会社関東システム開発', VENDOR_TYPE_LOOKUP_CODE: 'VENDOR' }
    ],
    POZ_SUPPLIER_SITES_ALL_M: [
      { VENDOR_SITE_ID: 5101, VENDOR_ID: 5001, PARTY_SITE_ID: 4201, PRC_BU_ID: 300001, VENDOR_SITE_CODE: 'TOKYO-HQ', ALLOW_AWT_FLAG: 'Y', AWT_GROUP_ID: 901 },
      { VENDOR_SITE_ID: 5103, VENDOR_ID: 5003, PARTY_SITE_ID: 4203, PRC_BU_ID: 300001, VENDOR_SITE_CODE: 'MINATO-END', ALLOW_AWT_FLAG: 'N', AWT_GROUP_ID: null }
    ],
    HZ_CUST_ACCOUNTS: [
      { CUST_ACCOUNT_ID: 6001, PARTY_ID: 4002, ACCOUNT_NUMBER: 'CUST-2001', ACCOUNT_NAME: '株式会社大阪商事' }
    ],
    AP_SYSTEM_PARAMETERS_ALL: [
      { ORG_ID: 300001, ACCTS_PAY_CODE_COMBINATION_ID: 2101, FUTURE_DATED_PAYMENT_CCID: 2110, CREATE_AWT_DISTS_TYPE: 'APPROVAL' }
    ],
    AR_SYSTEM_PARAMETERS_ALL: [
      { ORG_ID: 300001, SET_OF_BOOKS_ID: 2001, BR_ENABLED_FLAG: 'Y', DEFAULT_CB_DUE_DATE: 'TERM_PLUS_90' }
    ],
    AP_TERMS_B: [
      { TERM_ID: 10, TYPE: 'NET_90_DENSAI', DESCRIPTION: '発生90日後 満期でんさい決済', ENABLED_FLAG: 'Y' }
    ],
    RA_CUST_TRX_TYPES_ALL: [
      { CUST_TRX_TYPE_SEQ_ID: 301, NAME: 'JP_STANDARD_INV', TYPE: 'INV', GL_ID_REC: 1110, GL_ID_REV: 4001 },
      { CUST_TRX_TYPE_SEQ_ID: 302, NAME: 'JP_DENSAI_BR', TYPE: 'BR', GL_ID_UNPAID_REC: 1120, GL_ID_REMITTED_REC: 1121 }
    ],
    ZX_RATES_B: [
      { TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', PERCENTAGE_RATE: 10, RATE_TYPE_CODE: 'PERCENTAGE', DESC: '標準消費税10%' },
      { TAX_RATE_ID: 102, TAX_RATE_CODE: 'JP_TAX_08_RED', PERCENTAGE_RATE: 8, RATE_TYPE_CODE: 'PERCENTAGE', DESC: '軽減消費税8%' }
    ],
    AP_AWT_GROUPS: [
      { GROUP_ID: 901, NAME: 'JP_WHT_PROGRESSIVE_26D', DESCRIPTION: '段階源泉（<=100万:10.21% / >100万:20.42%）' }
    ],
    AP_AWT_TAX_RATES_ALL: [
      { TAX_RATE_ID: 911, TAX_NAME: 'JP_WHT_PROF_L1', TAX_RATE: 10.21, START_AMOUNT: 0, END_AMOUNT: 1000000, CCID: 2201 },
      { TAX_RATE_ID: 912, TAX_NAME: 'JP_WHT_PROF_L2', TAX_RATE: 20.42, START_AMOUNT: 1000001, END_AMOUNT: 999999999, CCID: 2202 }
    ],
    CE_BANK_ACCOUNTS: [
      { BANK_ACCOUNT_ID: 8001, BANK_ACCOUNT_NAME: 'みずほ銀行 本店 普通（でんさい決済口座）', BANK_ACCOUNT_NUM: '1234567', ASSET_CODE_COMBINATION_ID: 1001 }
    ],
    CE_BANK_ACCT_USES_ALL: [
      { BANK_ACCT_USE_ID: 7001, BANK_ACCOUNT_ID: 8001, ORG_ID: 300001, AP_USE_ENABLE_FLAG: 'Y', AR_USE_ENABLE_FLAG: 'Y' }
    ],
    IBY_PAYMENT_METHODS_B: [
      { PAYMENT_METHOD_CODE: 'BILLS_PAYABLE', SUPPORT_BILLS_PAYABLE_FLAG: 'Y', MATURITY_DATE_OFFSET_DAYS: 90, DESC: '電子記録債務（90日後満期）' }
    ],
    AR_RECEIPT_METHODS: [
      { RECEIPT_METHOD_ID: 410, NAME: 'DENSAI_BR_STANDARD', PAYMENT_CHANNEL_CODE: 'BILLS_RECEIVABLE', REMITTANCE_TYPE: 'STANDARD' },
      { RECEIPT_METHOD_ID: 411, NAME: 'DENSAI_BR_FACTORING', PAYMENT_CHANNEL_CODE: 'BILLS_RECEIVABLE', REMITTANCE_TYPE: 'FACTORING' },
      { RECEIPT_METHOD_ID: 412, NAME: 'DENSAI_BR_ENDORSEMENT', PAYMENT_CHANNEL_CODE: 'BILLS_RECEIVABLE', REMITTANCE_TYPE: 'ENDORSEMENT' }
    ],
    AR_RECEIVABLES_TRX_ALL: [
      { RECEIVABLES_TRX_ID: 601, NAME: 'WHT_DEDUCTION', TYPE: 'ADJUSTMENT', CODE_COMBINATION_ID: 1150, STATUS: 'A' },
      { RECEIVABLES_TRX_ID: 602, NAME: 'FACTORING_FEE', TYPE: 'BANK_CHARGES', CODE_COMBINATION_ID: 6101, STATUS: 'A' }
    ]
  };
}

// === 3つの取引ケース定義 ===
const CASES = {
  AP_DENSAI: {
    id: 'AP_DENSAI',
    shortTitle: '1. 電子記録債務 (AP)',
    title: 'ケース1：電子記録債務（AP請求計上 → でんさい振出 → 満期支払 → SLA → GL）',
    subtitle: 'AP請求書(明細1:10% / 明細2:8% / 段階源泉10.21%&20.42%)から電子記録債務を振出し、90日後の満期決済をSLA/GLまで追跡します。',
    badgeColor: '#0e7490',
    steps: [
      {
        id: 'S0', title: '1. マスタ確認・BILLS_PAYABLE準備', badge: 'PREPARE', date: '2026-05-15',
        desc: '法的エンティティ・BU・9セグメントAFF(CCID)・サプライヤ(源泉対象)・電子記録債務用支払方法(BILLS_PAYABLE)・段階源泉税率(10.21%/20.42%)の事前マスタ準備。',
        focusTables: ['XLE_ENTITY_PROFILES', 'FUN_ALL_BUSINESS_UNITS_V', 'GL_LEDGERS', 'GL_CODE_COMBINATIONS', 'POZ_SUPPLIERS', 'POZ_SUPPLIER_SITES_ALL_M', 'AP_SYSTEM_PARAMETERS_ALL', 'ZX_RATES_B', 'AP_AWT_GROUPS', 'AP_AWT_TAX_RATES_ALL', 'IBY_PAYMENT_METHODS_B', 'CE_BANK_ACCOUNTS'],
        activeRelIds: ['r1', 'r2', 'r5', 'r8', 'r9', 'r11', 'r12'],
        flows: [
          { from: 'POZ_SUPPLIERS', to: 'POZ_SUPPLIER_SITES_ALL_M', label: 'SUP-1001 サイト' },
          { from: 'AP_AWT_GROUPS', to: 'AP_AWT_TAX_RATES_ALL', label: '10.21% / 20.42%' }
        ]
      },
      {
        id: 'S1', title: '2. AP請求書入力（明細1:10% / 明細2:8%）', badge: 'INVOICE_ENTER', date: '2026-05-15',
        desc: 'AP請求書(AP-DEN-2026-001)を支払方法「BILLS_PAYABLE」で入力。品目明細1(1,000,000円/消費税10%)と品目明細2(1,000,000円/軽減8%)の2明細を作成(ステータス: NEVER_VALIDATED)。',
        focusTables: ['AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'AP_INVOICE_DISTRIBUTIONS_ALL'],
        activeRelIds: ['r20', 'r21', 'r22', 'r23', 'r26'],
        flows: [
          { from: 'POZ_SUPPLIER_SITES_ALL_M', to: 'AP_INVOICES_ALL', label: '請求ヘッダ登録' },
          { from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_LINES_ALL', label: '2品目 2,000,000' },
          { from: 'AP_INVOICE_LINES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: '費用配分' }
        ]
      },
      {
        id: 'S2', title: '3. 検証・EBTax算出・段階源泉徴収', badge: 'VALIDATE_TAX_AWT', date: '2026-05-15',
        desc: '請求書検証を実行。ZX_LINESで明細1(10% = 100,000円)・明細2(8% = 80,000円)の税額を確定し、AP_AWT_TAX_RATES_ALLで段階源泉(<=100万:10.21%=-102,100円 / >100万:20.42%=-204,200円)を算出。正味支払予定額1,873,700円を確定。',
        focusTables: ['ZX_LINES', 'AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_PAYMENT_SCHEDULES_ALL'],
        activeRelIds: ['r24', 'r25', 'r26', 'r27'],
        flows: [
          { from: 'ZX_RATES_B', to: 'ZX_LINES', label: '100,000 / 80,000' },
          { from: 'AP_INVOICE_LINES_ALL', to: 'AP_PAYMENT_SCHEDULES_ALL', label: '源泉-306,300 残1,873,700' }
        ]
      },
      {
        id: 'S3', title: '4. 電子記録債務（でんさい）振出 (ISSUED)', badge: 'ISSUE_DENSAI', date: '2026-05-15',
        desc: '支払処理要求(PPR)によりIBY支払データを生成し、AP_CHECKS_ALLへFUTURE_DATED_PMT_FLAG=Y、STATUS=ISSUED(満期2026-08-14)で登録。請求書残高を0とし、AP_PAYMENT_HISTORY_ALLに「PAYMENT CREATED」を記録（買掛金→電子記録債務）。',
        focusTables: ['IBY_DOCS_PAYABLE_ALL', 'IBY_PAYMENTS_ALL', 'AP_CHECKS_ALL', 'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'AP_PAYMENT_SCHEDULES_ALL', 'AP_INVOICES_ALL'],
        activeRelIds: ['r28', 'r29', 'r30', 'r31', 'r32', 'r33'],
        flows: [
          { from: 'AP_PAYMENT_SCHEDULES_ALL', to: 'IBY_DOCS_PAYABLE_ALL', label: '1,873,700選定' },
          { from: 'IBY_PAYMENTS_ALL', to: 'AP_CHECKS_ALL', label: 'でんさい振出 ISSUED' },
          { from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: 'PAYMENT CREATED' }
        ]
      },
      {
        id: 'S4', title: '5. 電子記録債務の満期支払決済 (CLEARED)', badge: 'MATURITY_CLEAR', date: '2026-08-14',
        desc: '満期日(2026-08-14)到達に伴い、AP_CHECKS_ALLがISSUED→CLEARED(銀行決済完了)へ遷移し、AP_PAYMENT_HISTORY_ALLに第2イベント「PAYMENT MATURITY」(1,873,700円)を生成（電子記録債務→普通預金）。',
        focusTables: ['AP_CHECKS_ALL', 'AP_PAYMENT_HISTORY_ALL', 'CE_BANK_ACCOUNTS'],
        activeRelIds: ['r31', 'r33'],
        flows: [
          { from: 'CE_BANK_ACCT_USES_ALL', to: 'AP_CHECKS_ALL', label: '満期引落 CLEARED' },
          { from: 'AP_CHECKS_ALL', to: 'AP_PAYMENT_HISTORY_ALL', label: 'PAYMENT MATURITY' }
        ]
      },
      {
        id: 'S5', title: '6. SLA 会計作成（3イベント仕訳生成）', badge: 'CREATE_ACCOUNTING', date: '2026-08-14',
        desc: 'Create Accounting実行により、①請求書検証(2,180,000)、②でんさい振出(1,873,700)、③満期決済(1,873,700)の3会計イベントから合計5,927,400円の完全貸借一致SLA仕訳を生成。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'AP_PAYMENT_HISTORY_ALL'],
        activeRelIds: ['r60', 'r61', 'r63', 'r64', 'r65', 'r66'],
        flows: [
          { from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'AP_INVOICES' },
          { from: 'AP_PAYMENT_HISTORY_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'AP_PAYMENTS' },
          { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'Dr/Cr 5,927,400' }
        ]
      },
      {
        id: 'S6', title: '7. GL インポート・転記・残高更新', badge: 'GL_POST', date: '2026-08-14',
        desc: 'GL_INTERFACE経由で仕訳インポート・転記(Status=P)を実行。GL_JE_LINES合計5,927,400円。GL_BALANCES上で買掛金(2101)=0円、電子記録債務(2110)=0円、預金(1001)=-1,873,700円となることを確認。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r67', 'r68', 'r69', 'r70', 'r71', 'r72'],
        flows: [
          { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'Transfer to GL' },
          { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '電子記録債務残 0円' }
        ]
      }
    ]
  },

  AR_DENSAI: {
    id: 'AR_DENSAI',
    shortTitle: '2. 電子記録債権 (AR 満期)',
    title: 'ケース2：電子記録債権（AR請求 → でんさい受取 → 取立送金 → 満期振込入金 → SLA → GL）',
    subtitle: 'AR請求(明細1:10% / 明細2:8%)から先方控除源泉(-306,300円)調整後に電子記録債権(BR)を受取り、取立送金を経て満期振込で入金消込します。',
    badgeColor: '#2563eb',
    steps: [
      {
        id: 'S0', title: '1. AR・BRマスタ／顧客・取立方法設定', badge: 'PREPARE', date: '2026-05-15',
        desc: 'ARシステムパラメータ(BR_ENABLED_FLAG=Y)、取引タイプ(JP_DENSAI_BR)、顧客アカウント(株式会社大阪商事)、受取方法(DENSAI_BR_STANDARD)、源泉控除活動(WHT_DEDUCTION)を準備。',
        focusTables: ['AR_SYSTEM_PARAMETERS_ALL', 'RA_CUST_TRX_TYPES_ALL', 'HZ_CUST_ACCOUNTS', 'AR_RECEIPT_METHODS', 'AR_RECEIVABLES_TRX_ALL', 'ZX_RATES_B', 'CE_BANK_ACCOUNTS'],
        activeRelIds: ['r1', 'r2', 'r10', 'r11'],
        flows: [
          { from: 'HZ_PARTIES', to: 'HZ_CUST_ACCOUNTS', label: 'CUST-2001 大阪商事' },
          { from: 'CE_BANK_ACCOUNTS', to: 'CE_BANK_ACCT_USES_ALL', label: '着金口座連携' }
        ]
      },
      {
        id: 'S1', title: '2. AR請求完了(10%/8%)＆段階源泉税調整', badge: 'AR_INV_AND_WHT', date: '2026-05-15',
        desc: 'AR請求書(AR-INV-2026-001: 品目10% 100万+品目8% 100万+税18万=2,180,000円)を確定後、先方源泉徴収分(10.21%=-102,100円 / 20.42%=-204,200円)をAR_ADJUSTMENTS_ALLで調整し、要回収残高1,873,700円とする。',
        focusTables: ['RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'ZX_LINES', 'RA_CUST_TRX_LINE_GL_DIST_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_ADJUSTMENTS_ALL'],
        activeRelIds: ['r40', 'r41', 'r42', 'r43', 'r44', 'r45', 'r46', 'r47'],
        flows: [
          { from: 'RA_CUSTOMER_TRX_ALL', to: 'RA_CUSTOMER_TRX_LINES_ALL', label: '2明細+税18万' },
          { from: 'AR_PAYMENT_SCHEDULES_ALL', to: 'AR_ADJUSTMENTS_ALL', label: '源泉 -306,300円' }
        ]
      },
      {
        id: 'S2', title: '3. 電子記録債権(BR)受取 (PENDING_REMITTANCE)', badge: 'BR_RECEIVE', date: '2026-05-15',
        desc: 'BR一括生成バッチにより電子記録債権「DEN-BR-2026-001」(1,873,700円, 満期2026-08-14)を受領確定。BR_REF_CUSTOMER_TRX_IDで元請求書を紐付け残高0(CL)へ更新し、AR_TRANSACTION_HISTORY_ALLをPENDING_REMITTANCEに記録。',
        focusTables: ['AR_BATCHES_ALL', 'RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_TRANSACTION_HISTORY_ALL', 'AR_DISTRIBUTIONS_ALL'],
        activeRelIds: ['r42', 'r45', 'r48', 'r49', 'r53'],
        flows: [
          { from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_TRANSACTION_HISTORY_ALL', label: 'PENDING_REMITTANCE' },
          { from: 'AR_TRANSACTION_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: 'Dr 電子記録債権/Cr 売掛' }
        ]
      },
      {
        id: 'S3', title: '4. でんさい銀行取立送金 (REMITTED)', badge: 'BR_REMIT', date: '2026-08-10',
        desc: '満期直前に取立送金バッチを実行。AR_TRANSACTION_HISTORY_ALLをREMITTED状態へ遷移させ、保有電子記録債権(1120)から銀行取立中電子記録債権(1121)へ振替える。',
        focusTables: ['AR_BATCHES_ALL', 'AR_TRANSACTION_HISTORY_ALL', 'AR_DISTRIBUTIONS_ALL', 'CE_BANK_ACCT_USES_ALL'],
        activeRelIds: ['r48', 'r49', 'r53'],
        flows: [
          { from: 'AR_BATCHES_ALL', to: 'AR_TRANSACTION_HISTORY_ALL', label: 'EVENT=REMITTED' },
          { from: 'AR_TRANSACTION_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: '1120 -> 1121振替' }
        ]
      },
      {
        id: 'S4', title: '5. 満期振込入金・消込完了 (MATURITY_DATE / CLOSED)', badge: 'MATURITY_RECEIPT', date: '2026-08-14',
        desc: '2026-08-14に普通預金へ1,873,700円着金。AR_CASH_RECEIPTS_ALL(CLEARED)からBRへ充当(AR_RECEIVABLE_APPLICATIONS_ALL)し、AR_TRANSACTION_HISTORY_ALLがEVENT=MATURITY_DATE、STATUS=CLOSEDで完結。',
        focusTables: ['AR_CASH_RECEIPTS_ALL', 'AR_CASH_RECEIPT_HISTORY_ALL', 'AR_RECEIVABLE_APPLICATIONS_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_TRANSACTION_HISTORY_ALL', 'AR_DISTRIBUTIONS_ALL'],
        activeRelIds: ['r50', 'r51', 'r52', 'r53'],
        flows: [
          { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: 'BR消込 1,873,700' },
          { from: 'AR_TRANSACTION_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: 'Dr 預金 / Cr 取立でんさい' }
        ]
      },
      {
        id: 'S5', title: '6. SLA 会計作成（5イベント一括仕訳生成）', badge: 'CREATE_ACCOUNTING', date: '2026-08-14',
        desc: 'AR請求(2,180,000)・源泉調整(306,300)・BR受取(1,873,700)・BR取立送金(1,873,700)・満期入金(1,873,700)の計5イベントをSLA仕訳化し、総仕訳額8,107,400円を検証。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r62', 'r63', 'r64', 'r65', 'r66'],
        flows: [
          { from: 'AR_DISTRIBUTIONS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'TRANSACTIONS / BR / RCPT' },
          { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'Dr/Cr 8,107,400' }
        ]
      },
      {
        id: 'S6', title: '7. GL インポート・転記・最終残高確認', badge: 'GL_POST', date: '2026-08-14',
        desc: 'GL転記完了(Status=P)。GL_BALANCES上で普通預金Dr 1,873,700 + 仮払源泉Dr 306,300 = 2,180,000、売上・仮受税Cr計2,180,000、売掛金=0、電子記録債権=0、取立中=0を確認。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r67', 'r68', 'r69', 'r70', 'r71', 'r72'],
        flows: [
          { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'Transfer to GL' },
          { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: 'AR/BR残高 0円完結' }
        ]
      }
    ]
  },

  AR_DISCOUNT: {
    id: 'AR_DISCOUNT',
    shortTitle: '3. 電子記録債権 割引・譲渡',
    title: 'ケース3：電子記録債権（分割受取 → 銀行割引[Factoring] ＆ 仕入先裏書譲渡[Endorsement] → リスク消滅）',
    subtitle: '電子記録債権1,873,700円を2分割受取し、BR-A(997,900円)を期日前「銀行割引（割引料7,900円）」、BR-B(875,800円)を買掛先へ「裏書譲渡」して満期リスク消滅まで追跡します。',
    badgeColor: '#7c3aed',
    steps: [
      {
        id: 'S0', title: '1. 割引・譲渡用マスタ＆相手先準備', badge: 'PREPARE', date: '2026-05-15',
        desc: '割引受取方法(DENSAI_BR_FACTORING)、譲渡受取方法(DENSAI_BR_ENDORSEMENT)、割引料活動(FACTORING_FEE -> CCID 6101)、裏書譲渡先の買掛仕入先(関東システム開発 SUP-1003)を準備。',
        focusTables: ['AR_RECEIPT_METHODS', 'AR_RECEIVABLES_TRX_ALL', 'POZ_SUPPLIERS', 'HZ_CUST_ACCOUNTS', 'GL_CODE_COMBINATIONS', 'CE_BANK_ACCOUNTS'],
        activeRelIds: ['r8', 'r9', 'r10', 'r11'],
        flows: [
          { from: 'AR_RECEIPT_METHODS', to: 'AR_RECEIVABLES_TRX_ALL', label: '割引料(6101)/源泉(1150)' },
          { from: 'POZ_SUPPLIERS', to: 'POZ_SUPPLIER_SITES_ALL_M', label: '裏書先 SUP-1003' }
        ]
      },
      {
        id: 'S1', title: '2. AR請求完了(10%/8%)＆段階源泉税調整', badge: 'AR_INV_AND_WHT', date: '2026-05-15',
        desc: 'AR請求書(AR-INV-2026-002: 明細1 10% 100万 + 明細2 8% 100万 + 税18万=2,180,000円)確定後、段階源泉控除(-102,100円 / -204,200円)を調整し要回収額1,873,700円を確定。また譲渡先買掛残875,800円の存在を想定。',
        focusTables: ['RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'ZX_LINES', 'RA_CUST_TRX_LINE_GL_DIST_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_ADJUSTMENTS_ALL'],
        activeRelIds: ['r40', 'r41', 'r42', 'r43', 'r44', 'r45', 'r46', 'r47'],
        flows: [
          { from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_PAYMENT_SCHEDULES_ALL', label: '源泉後 1,873,700' },
          { from: 'AR_RECEIVABLES_TRX_ALL', to: 'AR_ADJUSTMENTS_ALL', label: '-102,100 / -204,200' }
        ]
      },
      {
        id: 'S2', title: '3. でんさい分割受取2件 (PENDING_REMITTANCE)', badge: 'BR_SPLIT_RECEIVE', date: '2026-05-15',
        desc: 'でんさい分割特性を活用し、DEN-BR-2026-002A(997,900円:割引予定)とDEN-BR-2026-002B(875,800円:裏書予定)の2件のBRを発行受領。売掛金1,873,700円を全額電子記録債権へ振替。',
        focusTables: ['AR_BATCHES_ALL', 'RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_TRANSACTION_HISTORY_ALL', 'AR_DISTRIBUTIONS_ALL'],
        activeRelIds: ['r42', 'r45', 'r48', 'r49', 'r53'],
        flows: [
          { from: 'RA_CUSTOMER_TRX_ALL', to: 'AR_TRANSACTION_HISTORY_ALL', label: 'BR-2A(997,900) / BR-2B(875,800)' },
          { from: 'AR_TRANSACTION_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: '保有BR計 1,873,700' }
        ]
      },
      {
        id: 'S3', title: '4. BR-2A 銀行割引実行 (FACTORED / 手取990,000円)', badge: 'BR_FACTORING', date: '2026-06-05',
        desc: 'BR-2A(997,900円)を期日前に銀行へ割引譲渡(STATUS=FACTORED)。割引料7,900円(CCID 6101)を差引いた手取990,000円が普通預金へ着金し、保証債務対照勘定(割引でんさい1122:997,900円)を計上。',
        focusTables: ['AR_BATCHES_ALL', 'AR_TRANSACTION_HISTORY_ALL', 'AR_CASH_RECEIPTS_ALL', 'AR_CASH_RECEIPT_HISTORY_ALL', 'AR_RECEIVABLE_APPLICATIONS_ALL', 'AR_DISTRIBUTIONS_ALL'],
        activeRelIds: ['r48', 'r49', 'r50', 'r51', 'r52', 'r53'],
        flows: [
          { from: 'AR_TRANSACTION_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: '預金99万+割引損7,900' },
          { from: 'AR_CASH_RECEIPTS_ALL', to: 'AR_RECEIVABLE_APPLICATIONS_ALL', label: 'FACTORED 着金' }
        ]
      },
      {
        id: 'S4', title: '5. BR-2B 裏書譲渡(ENDORSED)＆満期リスク消滅(CLOSED)', badge: 'ENDORSE_AND_RISK_ELIM', date: '2026-08-14',
        desc: 'BR-2B(875,800円)を仕入先(SUP-1003)の買掛金返済として裏書譲渡(STATUS=ENDORSED: Dr買掛金2101 / Cr譲渡でんさい1123)。さらに2026-08-14満期無事決済により両BRでRISK_ELIMINATEDを実行、全保証債務と電子記録債権1,873,700円を相殺消滅(CLOSED)。',
        focusTables: ['AR_TRANSACTION_HISTORY_ALL', 'AR_DISTRIBUTIONS_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'POZ_SUPPLIERS'],
        activeRelIds: ['r49', 'r53'],
        flows: [
          { from: 'AR_TRANSACTION_HISTORY_ALL', to: 'AR_DISTRIBUTIONS_ALL', label: 'ENDORSED(875,800) & RISK_ELIMINATED' },
          { from: 'AR_PAYMENT_SCHEDULES_ALL', to: 'AR_TRANSACTION_HISTORY_ALL', label: '全BR CLOSED' }
        ]
      },
      {
        id: 'S5', title: '6. SLA 会計作成（割引・裏書・リスク消滅）', badge: 'CREATE_ACCOUNTING', date: '2026-08-14',
        desc: '請求・源泉・分割受取・銀行割引(FACTORED)・裏書譲渡(ENDORSED)・満期リスク消滅(RISK_ELIMINATED)の全6事象をSLA仕訳生成。総貸借額8,107,400円で完全一致。',
        focusTables: ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
        activeRelIds: ['r62', 'r63', 'r64', 'r65', 'r66'],
        flows: [
          { from: 'AR_DISTRIBUTIONS_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'FACTOR/ENDORSE/RISK_ELIM' },
          { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: 'Dr/Cr 8,107,400' }
        ]
      },
      {
        id: 'S6', title: '7. GL インポート・転記・割引後残高確定', badge: 'GL_POST', date: '2026-08-14',
        desc: 'GL_BALANCES確定：普通預金Dr 990,000 + 割引料Dr 7,900 + 買掛減少Dr 875,800 + 仮払源泉Dr 306,300 ＝ 計2,180,000円が売上・仮受税Cr計2,180,000円と一致し、保有/割引/譲渡でんさいは全て0円完結。',
        focusTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'],
        activeRelIds: ['r67', 'r68', 'r69', 'r70', 'r71', 'r72'],
        flows: [
          { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'Transfer to GL' },
          { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '割引料7,900・保証債務0円' }
        ]
      }
    ]
  }
};

// === ステップ別データ生成ロジック ===
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

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

function computeBalances(jeLines) {
  const map = {};
  for (const l of jeLines) {
    if (!map[l.CODE_COMBINATION_ID]) {
      map[l.CODE_COMBINATION_ID] = {
        LEDGER_ID: 2001,
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID,
        SEGMENT_CONCAT: l.SEGMENT_CONCAT,
        ACCOUNT_NAME: l.ACCOUNT_NAME,
        PERIOD_NAME: '2026-08 (通算)',
        PERIOD_NET_DR: 0,
        PERIOD_NET_CR: 0,
        END_BALANCE: 0
      };
    }
    map[l.CODE_COMBINATION_ID].PERIOD_NET_DR += l.ACCOUNTED_DR;
    map[l.CODE_COMBINATION_ID].PERIOD_NET_CR += l.ACCOUNTED_CR;
    map[l.CODE_COMBINATION_ID].END_BALANCE = map[l.CODE_COMBINATION_ID].PERIOD_NET_DR - map[l.CODE_COMBINATION_ID].PERIOD_NET_CR;
  }
  return Object.values(map).sort((a, b) => a.CODE_COMBINATION_ID - b.CODE_COMBINATION_ID);
}

// ケース別ステップ計算
function computeStateAtStep(caseId, stepIndex) {
  const state = buildCommonMasters();
  // 全トランザクション・SLA・GLテーブル初期化
  const emptyTables = [
    'AP_INVOICES_ALL', 'AP_INVOICE_LINES_ALL', 'ZX_LINES', 'AP_INVOICE_DISTRIBUTIONS_ALL',
    'AP_PAYMENT_SCHEDULES_ALL', 'IBY_DOCS_PAYABLE_ALL', 'IBY_PAYMENTS_ALL', 'AP_CHECKS_ALL',
    'AP_INVOICE_PAYMENTS_ALL', 'AP_PAYMENT_HISTORY_ALL',
    'RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'RA_CUST_TRX_LINE_GL_DIST_ALL',
    'AR_PAYMENT_SCHEDULES_ALL', 'AR_BATCHES_ALL', 'AR_TRANSACTION_HISTORY_ALL',
    'AR_ADJUSTMENTS_ALL', 'AR_CASH_RECEIPTS_ALL', 'AR_CASH_RECEIPT_HISTORY_ALL',
    'AR_RECEIVABLE_APPLICATIONS_ALL', 'AR_DISTRIBUTIONS_ALL',
    'XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS',
    'GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'
  ];
  emptyTables.forEach(t => { state[t] = []; });

  const changedRows = {};
  const markChange = (tbl, key) => {
    if (!changedRows[tbl]) changedRows[tbl] = new Set();
    changedRows[tbl].add(key);
  };

  if (caseId === 'AP_DENSAI') {
    // --- S1以降: AP請求入力 ---
    if (stepIndex >= 1) {
      const validated = stepIndex >= 2;
      const paid = stepIndex >= 3;
      state.AP_INVOICES_ALL = [{
        INVOICE_ID: 10001, INVOICE_NUM: 'AP-DEN-2026-001', VENDOR_ID: 5001, VENDOR_SITE_ID: 5101, ORG_ID: 300001,
        INVOICE_DATE: '2026-05-15', INVOICE_CURRENCY_CODE: 'JPY',
        INVOICE_AMOUNT: validated ? 2180000 : 2000000,
        AMOUNT_PAID: paid ? 1873700 : 0,
        PAYMENT_METHOD_CODE: 'BILLS_PAYABLE', AWT_GROUP_ID: 901,
        VALIDATION_STATUS: validated ? 'VALIDATED' : 'NEVER_VALIDATED',
        PAYMENT_STATUS_FLAG: paid ? 'Y' : 'N'
      }];
      state.AP_INVOICE_LINES_ALL = [
        { INVOICE_ID: 10001, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: 'UIデザイン委託料（標準10%）', AMOUNT: 1000000, TAX_CLASSIFICATION_CODE: 'JP_TAX_10', DEFAULT_DIST_CCID: 5001 },
        { INVOICE_ID: 10001, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'ITEM', DESCRIPTION: '飲料用販促資料制作（軽減8%）', AMOUNT: 1000000, TAX_CLASSIFICATION_CODE: 'JP_TAX_08_RED', DEFAULT_DIST_CCID: 5002 }
      ];
      state.AP_INVOICE_DISTRIBUTIONS_ALL = [
        { INVOICE_DISTRIBUTION_ID: 10101, INVOICE_ID: 10001, LINE_NUMBER: 1, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 5001, AMOUNT: 1000000, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90001 : null, POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10102, INVOICE_ID: 10001, LINE_NUMBER: 2, LINE_TYPE_LOOKUP_CODE: 'ITEM', DIST_CODE_COMBINATION_ID: 5002, AMOUNT: 1000000, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90001 : null, POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N' }
      ];
      if (stepIndex === 1) {
        markChange('AP_INVOICES_ALL', 0); markChange('AP_INVOICE_LINES_ALL', 0); markChange('AP_INVOICE_LINES_ALL', 1);
        markChange('AP_INVOICE_DISTRIBUTIONS_ALL', 0); markChange('AP_INVOICE_DISTRIBUTIONS_ALL', 1);
      }
    }

    // --- S2以降: 検証・税10%/8%・段階源泉10.21%/20.42% ---
    if (stepIndex >= 2) {
      state.ZX_LINES = [
        { TAX_LINE_ID: 20101, APPLICATION_ID: 200, ENTITY_CODE: 'AP_INVOICES', TRX_ID: 10001, TRX_LINE_ID: 1, TAX_RATE_ID: 101, TAX_RATE_CODE: 'JP_TAX_10', TAX_RATE: 10, TAXABLE_AMT: 1000000, TAX_AMT: 100000 },
        { TAX_LINE_ID: 20102, APPLICATION_ID: 200, ENTITY_CODE: 'AP_INVOICES', TRX_ID: 10001, TRX_LINE_ID: 2, TAX_RATE_ID: 102, TAX_RATE_CODE: 'JP_TAX_08_RED', TAX_RATE: 8, TAXABLE_AMT: 1000000, TAX_AMT: 80000 }
      ];
      state.AP_INVOICE_LINES_ALL.push(
        { INVOICE_ID: 10001, LINE_NUMBER: 3, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税(10% 自動生成)', AMOUNT: 100000, TAX_CLASSIFICATION_CODE: 'JP_TAX_10', DEFAULT_DIST_CCID: 1501 },
        { INVOICE_ID: 10001, LINE_NUMBER: 4, LINE_TYPE_LOOKUP_CODE: 'TAX', DESCRIPTION: '仮払消費税(軽減8% 自動生成)', AMOUNT: 80000, TAX_CLASSIFICATION_CODE: 'JP_TAX_08_RED', DEFAULT_DIST_CCID: 1502 },
        { INVOICE_ID: 10001, LINE_NUMBER: 5, LINE_TYPE_LOOKUP_CODE: 'AWT', DESCRIPTION: '源泉徴収税(100万以下 10.21%)', AMOUNT: -102100, TAX_CLASSIFICATION_CODE: 'WHT_1021', DEFAULT_DIST_CCID: 2201 },
        { INVOICE_ID: 10001, LINE_NUMBER: 6, LINE_TYPE_LOOKUP_CODE: 'AWT', DESCRIPTION: '源泉徴収税(100万超 20.42%)', AMOUNT: -204200, TAX_CLASSIFICATION_CODE: 'WHT_2042', DEFAULT_DIST_CCID: 2202 }
      );
      state.AP_INVOICE_DISTRIBUTIONS_ALL.push(
        { INVOICE_DISTRIBUTION_ID: 10103, INVOICE_ID: 10001, LINE_NUMBER: 3, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1501, AMOUNT: 100000, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90001 : null, POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10104, INVOICE_ID: 10001, LINE_NUMBER: 4, LINE_TYPE_LOOKUP_CODE: 'REC_TAX', DIST_CODE_COMBINATION_ID: 1502, AMOUNT: 80000, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90001 : null, POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10105, INVOICE_ID: 10001, LINE_NUMBER: 5, LINE_TYPE_LOOKUP_CODE: 'AWT', DIST_CODE_COMBINATION_ID: 2201, AMOUNT: -102100, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90001 : null, POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N' },
        { INVOICE_DISTRIBUTION_ID: 10106, INVOICE_ID: 10001, LINE_NUMBER: 6, LINE_TYPE_LOOKUP_CODE: 'AWT', DIST_CODE_COMBINATION_ID: 2202, AMOUNT: -204200, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90001 : null, POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N' }
      );
      state.AP_PAYMENT_SCHEDULES_ALL = [{
        INVOICE_ID: 10001, PAYMENT_NUM: 1, DUE_DATE: '2026-08-14', GROSS_AMOUNT: 2180000,
        AWT_WITHHELD_AMOUNT: 306300, AMOUNT_REMAINING: stepIndex >= 3 ? 0 : 1873700,
        PAYMENT_STATUS_FLAG: stepIndex >= 3 ? 'Y' : 'N', PAYMENT_METHOD_CODE: 'BILLS_PAYABLE'
      }];
      if (stepIndex === 2) {
        markChange('AP_INVOICES_ALL', 0); markChange('ZX_LINES', 0); markChange('ZX_LINES', 1);
        [2, 3, 4, 5].forEach(i => { markChange('AP_INVOICE_LINES_ALL', i); markChange('AP_INVOICE_DISTRIBUTIONS_ALL', i); });
        markChange('AP_PAYMENT_SCHEDULES_ALL', 0);
      }
    }

    // --- S3以降: でんさい振出 ---
    if (stepIndex >= 3) {
      const cleared = stepIndex >= 4;
      state.IBY_DOCS_PAYABLE_ALL = [{
        DOCUMENT_PAYABLE_ID: 95001, CALLING_APP_DOC_UNIQUE_REF1: 10001, PAYMENT_ID: 91001,
        PAYMENT_AMOUNT: 1873700, PAYMENT_METHOD_CODE: 'BILLS_PAYABLE', DOCUMENT_STATUS: 'PAYMENT_CREATED'
      }];
      state.IBY_PAYMENTS_ALL = [{
        PAYMENT_ID: 91001, INTERNAL_BANK_ACCOUNT_ID: 8001, PAYMENT_METHOD_CODE: 'BILLS_PAYABLE',
        PAYMENT_AMOUNT: 1873700, PAYMENT_DATE: '2026-05-15', MATURITY_DATE: '2026-08-14', PAYMENT_STATUS: 'ISSUED'
      }];
      state.AP_CHECKS_ALL = [{
        CHECK_ID: 88001, CHECK_NUMBER: 88001, VENDOR_ID: 5001, CE_BANK_ACCT_USE_ID: 7001, PAYMENT_ID: 91001,
        CHECK_DATE: '2026-05-15', AMOUNT: 1873700, PAYMENT_METHOD_CODE: 'BILLS_PAYABLE',
        FUTURE_DATED_PMT_FLAG: 'Y', MATURITY_EXCHANGE_DATE: '2026-08-14',
        STATUS_LOOKUP_CODE: cleared ? 'CLEARED' : 'ISSUED',
        CLEARED_DATE: cleared ? '2026-08-14' : null,
        CLEARED_AMOUNT: cleared ? 1873700 : null
      }];
      state.AP_INVOICE_PAYMENTS_ALL = [{
        INVOICE_PAYMENT_ID: 77001, INVOICE_ID: 10001, CHECK_ID: 88001, PAYMENT_NUM: 1,
        ACCOUNTING_DATE: '2026-05-15', AMOUNT: 1873700, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90002 : null, POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N'
      }];
      state.AP_PAYMENT_HISTORY_ALL = [{
        PAYMENT_HISTORY_ID: 70001, CHECK_ID: 88001, TRANSACTION_TYPE: 'PAYMENT CREATED',
        TRANSACTION_DATE: '2026-05-15', TRANSACTION_AMOUNT: 1873700, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90002 : null,
        POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N', MATCHED_FLAG: 'N', ORG_ID: 300001, CURRENCY_CODE: 'JPY'
      }];
      if (stepIndex === 3) {
        markChange('AP_INVOICES_ALL', 0); markChange('AP_PAYMENT_SCHEDULES_ALL', 0);
        markChange('IBY_DOCS_PAYABLE_ALL', 0); markChange('IBY_PAYMENTS_ALL', 0);
        markChange('AP_CHECKS_ALL', 0); markChange('AP_INVOICE_PAYMENTS_ALL', 0); markChange('AP_PAYMENT_HISTORY_ALL', 0);
      }
    }

    // --- S4以降: 満期決済 ---
    if (stepIndex >= 4) {
      state.AP_PAYMENT_HISTORY_ALL.push({
        PAYMENT_HISTORY_ID: 70002, CHECK_ID: 88001, TRANSACTION_TYPE: 'PAYMENT MATURITY',
        TRANSACTION_DATE: '2026-08-14', TRANSACTION_AMOUNT: 1873700, ACCOUNTING_EVENT_ID: stepIndex >= 5 ? 90003 : null,
        POSTED_FLAG: stepIndex >= 5 ? 'Y' : 'N', MATCHED_FLAG: 'Y', ORG_ID: 300001, CURRENCY_CODE: 'JPY'
      });
      if (stepIndex === 4) {
        markChange('AP_CHECKS_ALL', 0); markChange('AP_PAYMENT_HISTORY_ALL', 1);
      }
    }

    // --- S5以降: SLA会計作成 ---
    if (stepIndex >= 5) {
      const glSt = stepIndex >= 6 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 80001, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_INVOICES', TRANSACTION_NUMBER: 'AP-DEN-2026-001', SOURCE_ID_INT_1: 10001 },
        { ENTITY_ID: 80002, APPLICATION_ID: 200, LEDGER_ID: 2001, ENTITY_CODE: 'AP_PAYMENTS', TRANSACTION_NUMBER: 'DENSAI-CHK-88001', SOURCE_ID_INT_1: 88001 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 90001, ENTITY_ID: 80001, EVENT_TYPE_CODE: 'INVOICE_VALIDATED', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90002, ENTITY_ID: 80002, EVENT_TYPE_CODE: 'PAYMENT_CREATED', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 90003, ENTITY_ID: 80002, EVENT_TYPE_CODE: 'PAYMENT_MATURED', EVENT_DATE: '2026-08-14', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 91001, EVENT_ID: 90001, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Purchase Invoices', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-05' },
        { AE_HEADER_ID: 91002, EVENT_ID: 90002, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Bills Payable', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-05' },
        { AE_HEADER_ID: 91003, EVENT_ID: 90003, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-08-14', JE_CATEGORY_NAME: 'Payments', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-08' }
      ];
      const aeLinesRaw = [
        [91001, 1, 'ITEM_EXPENSE', 5001, 1000000, 0, '外注技術費（課税10%）', 701],
        [91001, 2, 'ITEM_EXPENSE', 5002, 1000000, 0, '原稿資料費（軽減8%）', 702],
        [91001, 3, 'RECOVERABLE_TAX', 1501, 100000, 0, '仮払消費税10%', 703],
        [91001, 4, 'RECOVERABLE_TAX', 1502, 80000, 0, '仮払消費税8%', 704],
        [91001, 5, 'WITHHOLDING_TAX', 2201, 0, 102100, '預り源泉所得税(10.21%:100万以下)', 705],
        [91001, 6, 'WITHHOLDING_TAX', 2202, 0, 204200, '預り源泉所得税(20.42%:100万超)', 706],
        [91001, 7, 'LIABILITY', 2101, 0, 1873700, '買掛金（源泉控除後要支払）', 707],
        [91002, 1, 'LIABILITY', 2101, 1873700, 0, '買掛金消込（でんさい振出）', 708],
        [91002, 2, 'FUTURE_DATED_PMT', 2110, 0, 1873700, '電子記録債務（サイト90日）', 709],
        [91003, 1, 'FUTURE_DATED_PMT', 2110, 1873700, 0, '電子記録債務決済（満期引落）', 710],
        [91003, 2, 'CASH', 1001, 0, 1873700, '普通預金（みずほ銀行引落）', 711]
      ];
      state.XLA_AE_LINES = aeLinesRaw.map(([hid, ln, cls, ccid, dr, cr, desc, linkId]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat,
        ACCOUNT_NAME: CCID_LIST[ccid].name, ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: linkId
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 91001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10101, REF_AE_HEADER_ID: 91001 },
        { AE_HEADER_ID: 91001, AE_LINE_NUM: 5, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10105, REF_AE_HEADER_ID: 91001 },
        { AE_HEADER_ID: 91001, AE_LINE_NUM: 6, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 10106, REF_AE_HEADER_ID: 91001 },
        { AE_HEADER_ID: 91002, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_HIST', SOURCE_DISTRIBUTION_ID_NUM_1: 70001, REF_AE_HEADER_ID: 91002 },
        { AE_HEADER_ID: 91003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_PMT_HIST', SOURCE_DISTRIBUTION_ID_NUM_1: 70002, REF_AE_HEADER_ID: 91003 }
      ];
      if (stepIndex === 5) {
        ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'].forEach(t => {
          state[t].forEach((_, i) => markChange(t, i));
        });
      }
    }

    // --- S6: GL転記 ---
    if (stepIndex >= 6) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6001, LINE_NO: idx + 1, STATUS: 'PROCESSED', USER_JE_SOURCE_NAME: 'Payables',
        USER_JE_CATEGORY_NAME: l.AE_HEADER_ID === 91002 ? 'Bills Payable' : (l.AE_HEADER_ID === 91003 ? 'Payments' : 'Purchase Invoices'),
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [
        { JE_BATCH_ID: 55001, NAME: 'AP_DENSAI_BATCH_2026', STATUS: 'P', DEFAULT_PERIOD_NAME: '2026-08', RUNNING_TOTAL_ACCOUNTED_DR: 5927400, RUNNING_TOTAL_ACCOUNTED_CR: 5927400 }
      ];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66001, JE_BATCH_ID: 55001, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Purchase Invoices', PERIOD_NAME: '2026-05', STATUS: 'P', RUNNING_TOTAL_DR: 2180000, RUNNING_TOTAL_CR: 2180000 },
        { JE_HEADER_ID: 66002, JE_BATCH_ID: 55001, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Bills Payable', PERIOD_NAME: '2026-05', STATUS: 'P', RUNNING_TOTAL_DR: 1873700, RUNNING_TOTAL_CR: 1873700 },
        { JE_HEADER_ID: 66003, JE_BATCH_ID: 55001, LEDGER_ID: 2001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Payments', PERIOD_NAME: '2026-08', STATUS: 'P', RUNNING_TOTAL_DR: 1873700, RUNNING_TOTAL_CR: 1873700 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const jhid = l.AE_HEADER_ID === 91001 ? 66001 : (l.AE_HEADER_ID === 91002 ? 66002 : 66003);
        const per = l.AE_HEADER_ID === 91003 ? '2026-08' : '2026-05';
        return buildJournalRow(jhid, l.AE_LINE_NUM, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, per, l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({
        JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL'
      }));
      state.GL_BALANCES = computeBalances(state.GL_JE_LINES);
      ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'].forEach(t => {
        state[t].forEach((_, i) => markChange(t, i));
      });
    }
  } else if (caseId === 'AR_DENSAI') {
    // --- S1以降: AR通常請求書 + 段階源泉税調整 ---
    if (stepIndex >= 1) {
      const brCreated = stepIndex >= 2;
      state.RA_CUSTOMER_TRX_ALL = [{
        CUSTOMER_TRX_ID: 30001, TRX_NUMBER: 'AR-INV-2026-001', CUST_TRX_TYPE_SEQ_ID: 301, TRX_CLASS: 'INV',
        BILL_TO_CUSTOMER_ID: 6001, TRX_DATE: '2026-05-15', COMPLETE_FLAG: 'Y', BR_AMOUNT: null, INVOICE_CURRENCY_CODE: 'JPY'
      }];
      state.RA_CUSTOMER_TRX_LINES_ALL = [
        { CUSTOMER_TRX_LINE_ID: 31001, CUSTOMER_TRX_ID: 30001, LINE_NUMBER: 1, LINE_TYPE: 'LINE', DESCRIPTION: 'システム受託開発（標準10%）', EXTENDED_AMOUNT: 1000000, TAX_RATE_CODE: 'JP_TAX_10', BR_REF_CUSTOMER_TRX_ID: null },
        { CUSTOMER_TRX_LINE_ID: 31002, CUSTOMER_TRX_ID: 30001, LINE_NUMBER: 2, LINE_TYPE: 'LINE', DESCRIPTION: '食品系教材卸（軽減8%）', EXTENDED_AMOUNT: 1000000, TAX_RATE_CODE: 'JP_TAX_08_RED', BR_REF_CUSTOMER_TRX_ID: null },
        { CUSTOMER_TRX_LINE_ID: 31003, CUSTOMER_TRX_ID: 30001, LINE_NUMBER: 3, LINE_TYPE: 'TAX', DESCRIPTION: '仮受消費税10%', EXTENDED_AMOUNT: 100000, TAX_RATE_CODE: 'JP_TAX_10', BR_REF_CUSTOMER_TRX_ID: null },
        { CUSTOMER_TRX_LINE_ID: 31004, CUSTOMER_TRX_ID: 30001, LINE_NUMBER: 4, LINE_TYPE: 'TAX', DESCRIPTION: '仮受消費税軽減8%', EXTENDED_AMOUNT: 80000, TAX_RATE_CODE: 'JP_TAX_08_RED', BR_REF_CUSTOMER_TRX_ID: null }
      ];
      state.ZX_LINES = [
        { TAX_LINE_ID: 22101, APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', TRX_ID: 30001, TRX_LINE_ID: 31001, TAX_RATE_CODE: 'JP_TAX_10', TAX_RATE: 10, TAXABLE_AMT: 1000000, TAX_AMT: 100000 },
        { TAX_LINE_ID: 22102, APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', TRX_ID: 30001, TRX_LINE_ID: 31002, TAX_RATE_CODE: 'JP_TAX_08_RED', TAX_RATE: 8, TAXABLE_AMT: 1000000, TAX_AMT: 80000 }
      ];
      state.RA_CUST_TRX_LINE_GL_DIST_ALL = [
        { CUST_TRX_LINE_GL_DIST_ID: 32001, CUSTOMER_TRX_ID: 30001, ACCOUNT_CLASS: 'REC', CODE_COMBINATION_ID: 1110, AMOUNT: 2180000, EVENT_ID: stepIndex >= 5 ? 92001 : null },
        { CUST_TRX_LINE_GL_DIST_ID: 32002, CUSTOMER_TRX_ID: 30001, ACCOUNT_CLASS: 'REV', CODE_COMBINATION_ID: 4001, AMOUNT: 1000000, EVENT_ID: stepIndex >= 5 ? 92001 : null },
        { CUST_TRX_LINE_GL_DIST_ID: 32003, CUSTOMER_TRX_ID: 30001, ACCOUNT_CLASS: 'REV', CODE_COMBINATION_ID: 4002, AMOUNT: 1000000, EVENT_ID: stepIndex >= 5 ? 92001 : null },
        { CUST_TRX_LINE_GL_DIST_ID: 32004, CUSTOMER_TRX_ID: 30001, ACCOUNT_CLASS: 'TAX', CODE_COMBINATION_ID: 2501, AMOUNT: 100000, EVENT_ID: stepIndex >= 5 ? 92001 : null },
        { CUST_TRX_LINE_GL_DIST_ID: 32005, CUSTOMER_TRX_ID: 30001, ACCOUNT_CLASS: 'TAX', CODE_COMBINATION_ID: 2502, AMOUNT: 80000, EVENT_ID: stepIndex >= 5 ? 92001 : null }
      ];
      state.AR_ADJUSTMENTS_ALL = [
        { ADJUSTMENT_ID: 60001, CUSTOMER_TRX_ID: 30001, PAYMENT_SCHEDULE_ID: 40001, RECEIVABLES_TRX_ID: 601, AMOUNT: -102100, TYPE: 'LINE', COMMENTS: '源泉控除(<=100万 10.21%)', EVENT_ID: stepIndex >= 5 ? 92002 : null },
        { ADJUSTMENT_ID: 60002, CUSTOMER_TRX_ID: 30001, PAYMENT_SCHEDULE_ID: 40001, RECEIVABLES_TRX_ID: 601, AMOUNT: -204200, TYPE: 'LINE', COMMENTS: '源泉控除(>100万 20.42%)', EVENT_ID: stepIndex >= 5 ? 92002 : null }
      ];
      state.AR_PAYMENT_SCHEDULES_ALL = [{
        PAYMENT_SCHEDULE_ID: 40001, CUSTOMER_TRX_ID: 30001, CLASS: 'INV', DUE_DATE: '2026-08-14',
        AMOUNT_DUE_ORIGINAL: 2180000, AMOUNT_ADJUSTED: -306300,
        AMOUNT_DUE_REMAINING: brCreated ? 0 : 1873700,
        STATUS: brCreated ? 'CL' : 'OP'
      }];
      state.AR_DISTRIBUTIONS_ALL = [
        { LINE_ID: 71001, SOURCE_TABLE: 'ADJ', SOURCE_ID: 60001, CODE_COMBINATION_ID: 1150, AMOUNT_DR: 102100, AMOUNT_CR: 0, NOTE: '仮払源泉税(10.21%)' },
        { LINE_ID: 71002, SOURCE_TABLE: 'ADJ', SOURCE_ID: 60001, CODE_COMBINATION_ID: 1110, AMOUNT_DR: 0, AMOUNT_CR: 102100, NOTE: '売掛金減額' },
        { LINE_ID: 71003, SOURCE_TABLE: 'ADJ', SOURCE_ID: 60002, CODE_COMBINATION_ID: 1150, AMOUNT_DR: 204200, AMOUNT_CR: 0, NOTE: '仮払源泉税(20.42%)' },
        { LINE_ID: 71004, SOURCE_TABLE: 'ADJ', SOURCE_ID: 60002, CODE_COMBINATION_ID: 1110, AMOUNT_DR: 0, AMOUNT_CR: 204200, NOTE: '売掛金減額' }
      ];
      if (stepIndex === 1) {
        ['RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'ZX_LINES', 'RA_CUST_TRX_LINE_GL_DIST_ALL', 'AR_ADJUSTMENTS_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_DISTRIBUTIONS_ALL'].forEach(t => {
          state[t].forEach((_, i) => markChange(t, i));
        });
      }
    }

    // --- S2以降: でんさい(BR)受取 ---
    if (stepIndex >= 2) {
      const cleared = stepIndex >= 4;
      state.AR_BATCHES_ALL.push({ BATCH_ID: 5001, NAME: 'BR_CREATE_202605', TYPE: 'BR', STATUS: 'COMPLETED_CREATION', REMIT_BANK_ACCT_USE_ID: 7001, RECEIPT_METHOD_ID: 410 });
      state.RA_CUSTOMER_TRX_ALL.push({
        CUSTOMER_TRX_ID: 30002, TRX_NUMBER: 'DEN-BR-2026-001', CUST_TRX_TYPE_SEQ_ID: 302, TRX_CLASS: 'BR',
        BILL_TO_CUSTOMER_ID: 6001, TRX_DATE: '2026-05-15', COMPLETE_FLAG: 'Y', BR_AMOUNT: 1873700, BATCH_ID: 5001
      });
      state.RA_CUSTOMER_TRX_LINES_ALL.push({
        CUSTOMER_TRX_LINE_ID: 31005, CUSTOMER_TRX_ID: 30002, LINE_NUMBER: 1, LINE_TYPE: 'BR',
        DESCRIPTION: 'でんさい引受受取(元AR請求紐付)', EXTENDED_AMOUNT: 1873700,
        BR_REF_CUSTOMER_TRX_ID: 30001, BR_REF_PAYMENT_SCHEDULE_ID: 40001
      });
      state.AR_PAYMENT_SCHEDULES_ALL.push({
        PAYMENT_SCHEDULE_ID: 40002, CUSTOMER_TRX_ID: 30002, CLASS: 'BR', DUE_DATE: '2026-08-14',
        AMOUNT_DUE_ORIGINAL: 1873700, AMOUNT_ADJUSTED: 0,
        AMOUNT_DUE_REMAINING: cleared ? 0 : 1873700,
        STATUS: cleared ? 'CL' : 'OP',
        CASH_RECEIPT_ID: cleared ? 50001 : null
      });
      state.AR_TRANSACTION_HISTORY_ALL.push({
        TRANSACTION_HISTORY_ID: 80001, CUSTOMER_TRX_ID: 30002, TRX_DATE: '2026-05-15', GL_DATE: '2026-05-15',
        STATUS: 'PENDING_REMITTANCE', EVENT: 'COMPLETED', CURRENT_RECORD_FLAG: stepIndex === 2 ? 'Y' : 'N',
        POSTABLE_FLAG: 'Y', BATCH_ID: 5001, EVENT_ID: stepIndex >= 5 ? 92003 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3
      });
      state.AR_DISTRIBUTIONS_ALL.push(
        { LINE_ID: 71005, SOURCE_TABLE: 'TH', SOURCE_ID: 80001, CODE_COMBINATION_ID: 1120, AMOUNT_DR: 1873700, AMOUNT_CR: 0, NOTE: '電子記録債権受取(保有)' },
        { LINE_ID: 71006, SOURCE_TABLE: 'TH', SOURCE_ID: 80001, CODE_COMBINATION_ID: 1110, AMOUNT_DR: 0, AMOUNT_CR: 1873700, NOTE: '売掛金消込振替' }
      );
      if (stepIndex === 2) {
        markChange('AR_BATCHES_ALL', 0); markChange('RA_CUSTOMER_TRX_ALL', 1); markChange('RA_CUSTOMER_TRX_LINES_ALL', 4);
        markChange('AR_PAYMENT_SCHEDULES_ALL', 0); markChange('AR_PAYMENT_SCHEDULES_ALL', 1);
        markChange('AR_TRANSACTION_HISTORY_ALL', 0); markChange('AR_DISTRIBUTIONS_ALL', 4); markChange('AR_DISTRIBUTIONS_ALL', 5);
      }
    }

    // --- S3以降: 取立送金 (REMITTED) ---
    if (stepIndex >= 3) {
      state.AR_BATCHES_ALL.push({ BATCH_ID: 5002, NAME: 'BR_REMIT_202608', TYPE: 'REMITTANCE', STATUS: 'COMPLETED_CREATION', REMIT_BANK_ACCT_USE_ID: 7001, RECEIPT_METHOD_ID: 410 });
      state.AR_TRANSACTION_HISTORY_ALL.push({
        TRANSACTION_HISTORY_ID: 80002, CUSTOMER_TRX_ID: 30002, TRX_DATE: '2026-08-10', GL_DATE: '2026-08-10',
        STATUS: 'REMITTED', EVENT: 'REMITTED', CURRENT_RECORD_FLAG: stepIndex === 3 ? 'Y' : 'N',
        POSTABLE_FLAG: 'Y', BATCH_ID: 5002, EVENT_ID: stepIndex >= 5 ? 92004 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3
      });
      state.AR_DISTRIBUTIONS_ALL.push(
        { LINE_ID: 71007, SOURCE_TABLE: 'TH', SOURCE_ID: 80002, CODE_COMBINATION_ID: 1121, AMOUNT_DR: 1873700, AMOUNT_CR: 0, NOTE: '取立送金中でんさい' },
        { LINE_ID: 71008, SOURCE_TABLE: 'TH', SOURCE_ID: 80002, CODE_COMBINATION_ID: 1120, AMOUNT_DR: 0, AMOUNT_CR: 1873700, NOTE: '保有でんさい取立振替' }
      );
      if (stepIndex === 3) {
        markChange('AR_BATCHES_ALL', 1); markChange('AR_TRANSACTION_HISTORY_ALL', 0); markChange('AR_TRANSACTION_HISTORY_ALL', 1);
        markChange('AR_DISTRIBUTIONS_ALL', 6); markChange('AR_DISTRIBUTIONS_ALL', 7);
      }
    }

    // --- S4以降: 満期振込入金・完了 ---
    if (stepIndex >= 4) {
      state.AR_CASH_RECEIPTS_ALL = [{
        CASH_RECEIPT_ID: 50001, RECEIPT_NUMBER: 'BR-RCPT-2026-001', AMOUNT: 1873700, RECEIPT_DATE: '2026-08-14',
        PAY_FROM_CUSTOMER: 6001, RECEIPT_METHOD_ID: 410, REMIT_BANK_ACCT_USE_ID: 7001, STATUS: 'APP'
      }];
      state.AR_CASH_RECEIPT_HISTORY_ALL = [{
        CASH_RECEIPT_HISTORY_ID: 51001, CASH_RECEIPT_ID: 50001, STATUS: 'CLEARED', TRX_DATE: '2026-08-14', GL_DATE: '2026-08-14',
        AMOUNT: 1873700, CURRENT_RECORD_FLAG: 'Y', EVENT_ID: stepIndex >= 5 ? 92005 : null
      }];
      state.AR_RECEIVABLE_APPLICATIONS_ALL = [{
        RECEIVABLE_APPLICATION_ID: 52001, CASH_RECEIPT_ID: 50001, APPLIED_CUSTOMER_TRX_ID: 30002,
        APPLIED_PAYMENT_SCHEDULE_ID: 40002, AMOUNT_APPLIED: 1873700, STATUS: 'APP', APPLY_DATE: '2026-08-14'
      }];
      state.AR_TRANSACTION_HISTORY_ALL.push({
        TRANSACTION_HISTORY_ID: 80003, CUSTOMER_TRX_ID: 30002, TRX_DATE: '2026-08-14', GL_DATE: '2026-08-14',
        STATUS: 'CLOSED', EVENT: 'MATURITY_DATE', CURRENT_RECORD_FLAG: 'Y',
        POSTABLE_FLAG: 'Y', BATCH_ID: 5002, EVENT_ID: stepIndex >= 5 ? 92005 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3
      });
      state.AR_DISTRIBUTIONS_ALL.push(
        { LINE_ID: 71009, SOURCE_TABLE: 'CRH', SOURCE_ID: 51001, CODE_COMBINATION_ID: 1001, AMOUNT_DR: 1873700, AMOUNT_CR: 0, NOTE: '満期振込着金(みずほ銀行)' },
        { LINE_ID: 71010, SOURCE_TABLE: 'APP', SOURCE_ID: 52001, CODE_COMBINATION_ID: 1121, AMOUNT_DR: 0, AMOUNT_CR: 1873700, NOTE: '取立中でんさい決済消込' }
      );
      if (stepIndex === 4) {
        markChange('AR_CASH_RECEIPTS_ALL', 0); markChange('AR_CASH_RECEIPT_HISTORY_ALL', 0);
        markChange('AR_RECEIVABLE_APPLICATIONS_ALL', 0); markChange('AR_PAYMENT_SCHEDULES_ALL', 1);
        markChange('AR_TRANSACTION_HISTORY_ALL', 1); markChange('AR_TRANSACTION_HISTORY_ALL', 2);
        markChange('AR_DISTRIBUTIONS_ALL', 8); markChange('AR_DISTRIBUTIONS_ALL', 9);
      }
    }

    // --- S5以降: SLA会計作成 ---
    if (stepIndex >= 5) {
      const glSt = stepIndex >= 6 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 82001, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'TRANSACTIONS', TRANSACTION_NUMBER: 'AR-INV-2026-001', SOURCE_ID_INT_1: 30001 },
        { ENTITY_ID: 82002, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'ADJUSTMENTS', TRANSACTION_NUMBER: 'ADJ-WHT-60001', SOURCE_ID_INT_1: 60001 },
        { ENTITY_ID: 82003, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'BILLS_RECEIVABLE', TRANSACTION_NUMBER: 'DEN-BR-2026-001', SOURCE_ID_INT_1: 30002 },
        { ENTITY_ID: 82004, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'RECEIPTS', TRANSACTION_NUMBER: 'BR-RCPT-2026-001', SOURCE_ID_INT_1: 50001 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 92001, ENTITY_ID: 82001, EVENT_TYPE_CODE: 'INV_CREATE', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92002, ENTITY_ID: 82002, EVENT_TYPE_CODE: 'ADJ_CREATE', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92003, ENTITY_ID: 82003, EVENT_TYPE_CODE: 'BILL_CREATE', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92004, ENTITY_ID: 82003, EVENT_TYPE_CODE: 'BILL_REMIT', EVENT_DATE: '2026-08-10', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 92005, ENTITY_ID: 82004, EVENT_TYPE_CODE: 'RECP_CREATE', EVENT_DATE: '2026-08-14', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 93001, EVENT_ID: 92001, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Sales Invoices', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-05' },
        { AE_HEADER_ID: 93002, EVENT_ID: 92002, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Adjustment', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-05' },
        { AE_HEADER_ID: 93003, EVENT_ID: 92003, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Bills Receivable', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-05' },
        { AE_HEADER_ID: 93004, EVENT_ID: 92004, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-08-10', JE_CATEGORY_NAME: 'Bills Receivable', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-08' },
        { AE_HEADER_ID: 93005, EVENT_ID: 92005, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-08-14', JE_CATEGORY_NAME: 'Receipts', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-08' }
      ];
      const aeLinesRaw = [
        [93001, 1, 'RECEIVABLE', 1110, 2180000, 0, '売掛金計上（税込）', 721],
        [93001, 2, 'REVENUE', 4001, 0, 1000000, '売上高（標準10%）', 722],
        [93001, 3, 'REVENUE', 4002, 0, 1000000, '売上高（軽減8%）', 723],
        [93001, 4, 'TAX', 2501, 0, 100000, '仮受消費税10%', 724],
        [93001, 5, 'TAX', 2502, 0, 80000, '仮受消費税8%', 725],
        [93002, 1, 'WRITE_OFF', 1150, 102100, 0, '仮払源泉税（<=100万 10.21%）', 726],
        [93002, 2, 'WRITE_OFF', 1150, 204200, 0, '仮払源泉税（>100万 20.42%）', 727],
        [93002, 3, 'RECEIVABLE', 1110, 0, 306300, '売掛金減額（先方源泉控除）', 728],
        [93003, 1, 'BR_UNPAID', 1120, 1873700, 0, '電子記録債権受取（保有）', 729],
        [93003, 2, 'RECEIVABLE', 1110, 0, 1873700, '売掛金消込（でんさい決済）', 730],
        [93004, 1, 'BR_REMITTED', 1121, 1873700, 0, '取立送金中電子記録債権', 731],
        [93004, 2, 'BR_UNPAID', 1120, 0, 1873700, '保有電子記録債権の取立振替', 732],
        [93005, 1, 'CASH', 1001, 1873700, 0, '普通預金（満期振込入金）', 733],
        [93005, 2, 'BR_REMITTED', 1121, 0, 1873700, '取立送金中でんさい決済消込', 734]
      ];
      state.XLA_AE_LINES = aeLinesRaw.map(([hid, ln, cls, ccid, dr, cr, desc, linkId]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat,
        ACCOUNT_NAME: CCID_LIST[ccid].name, ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: linkId
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 93001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 32001, REF_AE_HEADER_ID: 93001 },
        { AE_HEADER_ID: 93002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 71001, REF_AE_HEADER_ID: 93002 },
        { AE_HEADER_ID: 93003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 71005, REF_AE_HEADER_ID: 93003 },
        { AE_HEADER_ID: 93004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 71007, REF_AE_HEADER_ID: 93004 },
        { AE_HEADER_ID: 93005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 71009, REF_AE_HEADER_ID: 93005 }
      ];
      if (stepIndex === 5) {
        ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'].forEach(t => {
          state[t].forEach((_, i) => markChange(t, i));
        });
      }
    }

    // --- S6: GL転記 ---
    if (stepIndex >= 6) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6101, LINE_NO: idx + 1, STATUS: 'PROCESSED', USER_JE_SOURCE_NAME: 'Receivables',
        USER_JE_CATEGORY_NAME: state.XLA_AE_HEADERS.find(h => h.AE_HEADER_ID === l.AE_HEADER_ID).JE_CATEGORY_NAME,
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [
        { JE_BATCH_ID: 55101, NAME: 'AR_DENSAI_BATCH_2026', STATUS: 'P', DEFAULT_PERIOD_NAME: '2026-08', RUNNING_TOTAL_ACCOUNTED_DR: 8107400, RUNNING_TOTAL_ACCOUNTED_CR: 8107400 }
      ];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66101, JE_BATCH_ID: 55101, LEDGER_ID: 2001, JE_SOURCE: 'Receivables', JE_CATEGORY: 'Sales & WHT Adj', PERIOD_NAME: '2026-05', STATUS: 'P', RUNNING_TOTAL_DR: 4360000, RUNNING_TOTAL_CR: 4360000 },
        { JE_HEADER_ID: 66102, JE_BATCH_ID: 55101, LEDGER_ID: 2001, JE_SOURCE: 'Receivables', JE_CATEGORY: 'Bills Receivable & Receipts', PERIOD_NAME: '2026-08', STATUS: 'P', RUNNING_TOTAL_DR: 3747400, RUNNING_TOTAL_CR: 3747400 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const isMay = [93001, 93002, 93003].includes(l.AE_HEADER_ID);
        return buildJournalRow(isMay ? 66101 : 66102, l.AE_LINE_NUM + (l.AE_HEADER_ID % 10) * 10, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, isMay ? '2026-05' : '2026-08', l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({
        JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL'
      }));
      state.GL_BALANCES = computeBalances(state.GL_JE_LINES);
      ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'].forEach(t => {
        state[t].forEach((_, i) => markChange(t, i));
      });
    }
  } else if (caseId === 'AR_DISCOUNT') {
    // --- S1以降: AR通常請求書 + 段階源泉控除 + 買掛先背景 ---
    if (stepIndex >= 1) {
      const brCreated = stepIndex >= 2;
      state.RA_CUSTOMER_TRX_ALL = [{
        CUSTOMER_TRX_ID: 35001, TRX_NUMBER: 'AR-INV-2026-002', CUST_TRX_TYPE_SEQ_ID: 301, TRX_CLASS: 'INV',
        BILL_TO_CUSTOMER_ID: 6001, TRX_DATE: '2026-05-15', COMPLETE_FLAG: 'Y', BR_AMOUNT: null, INVOICE_CURRENCY_CODE: 'JPY'
      }];
      state.RA_CUSTOMER_TRX_LINES_ALL = [
        { CUSTOMER_TRX_LINE_ID: 36001, CUSTOMER_TRX_ID: 35001, LINE_NUMBER: 1, LINE_TYPE: 'LINE', DESCRIPTION: '技術ライセンス提供（標準10%）', EXTENDED_AMOUNT: 1000000, TAX_RATE_CODE: 'JP_TAX_10', BR_REF_CUSTOMER_TRX_ID: null },
        { CUSTOMER_TRX_LINE_ID: 36002, CUSTOMER_TRX_ID: 35001, LINE_NUMBER: 2, LINE_TYPE: 'LINE', DESCRIPTION: '食品卸パック販売（軽減8%）', EXTENDED_AMOUNT: 1000000, TAX_RATE_CODE: 'JP_TAX_08_RED', BR_REF_CUSTOMER_TRX_ID: null },
        { CUSTOMER_TRX_LINE_ID: 36003, CUSTOMER_TRX_ID: 35001, LINE_NUMBER: 3, LINE_TYPE: 'TAX', DESCRIPTION: '仮受消費税10%', EXTENDED_AMOUNT: 100000, TAX_RATE_CODE: 'JP_TAX_10', BR_REF_CUSTOMER_TRX_ID: null },
        { CUSTOMER_TRX_LINE_ID: 36004, CUSTOMER_TRX_ID: 35001, LINE_NUMBER: 4, LINE_TYPE: 'TAX', DESCRIPTION: '仮受消費税軽減8%', EXTENDED_AMOUNT: 80000, TAX_RATE_CODE: 'JP_TAX_08_RED', BR_REF_CUSTOMER_TRX_ID: null }
      ];
      state.ZX_LINES = [
        { TAX_LINE_ID: 24101, APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', TRX_ID: 35001, TRX_LINE_ID: 36001, TAX_RATE_CODE: 'JP_TAX_10', TAX_RATE: 10, TAXABLE_AMT: 1000000, TAX_AMT: 100000 },
        { TAX_LINE_ID: 24102, APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', TRX_ID: 35001, TRX_LINE_ID: 36002, TAX_RATE_CODE: 'JP_TAX_08_RED', TAX_RATE: 8, TAXABLE_AMT: 1000000, TAX_AMT: 80000 }
      ];
      state.RA_CUST_TRX_LINE_GL_DIST_ALL = [
        { CUST_TRX_LINE_GL_DIST_ID: 37001, CUSTOMER_TRX_ID: 35001, ACCOUNT_CLASS: 'REC', CODE_COMBINATION_ID: 1110, AMOUNT: 2180000, EVENT_ID: stepIndex >= 5 ? 94001 : null },
        { CUST_TRX_LINE_GL_DIST_ID: 37002, CUSTOMER_TRX_ID: 35001, ACCOUNT_CLASS: 'REV', CODE_COMBINATION_ID: 4001, AMOUNT: 1000000, EVENT_ID: stepIndex >= 5 ? 94001 : null },
        { CUST_TRX_LINE_GL_DIST_ID: 37003, CUSTOMER_TRX_ID: 35001, ACCOUNT_CLASS: 'REV', CODE_COMBINATION_ID: 4002, AMOUNT: 1000000, EVENT_ID: stepIndex >= 5 ? 94001 : null },
        { CUST_TRX_LINE_GL_DIST_ID: 37004, CUSTOMER_TRX_ID: 35001, ACCOUNT_CLASS: 'TAX', CODE_COMBINATION_ID: 2501, AMOUNT: 100000, EVENT_ID: stepIndex >= 5 ? 94001 : null },
        { CUST_TRX_LINE_GL_DIST_ID: 37005, CUSTOMER_TRX_ID: 35001, ACCOUNT_CLASS: 'TAX', CODE_COMBINATION_ID: 2502, AMOUNT: 80000, EVENT_ID: stepIndex >= 5 ? 94001 : null }
      ];
      state.AR_ADJUSTMENTS_ALL = [
        { ADJUSTMENT_ID: 61001, CUSTOMER_TRX_ID: 35001, PAYMENT_SCHEDULE_ID: 45001, RECEIVABLES_TRX_ID: 601, AMOUNT: -102100, TYPE: 'LINE', COMMENTS: '源泉控除(<=100万 10.21%)', EVENT_ID: stepIndex >= 5 ? 94002 : null },
        { ADJUSTMENT_ID: 61002, CUSTOMER_TRX_ID: 35001, PAYMENT_SCHEDULE_ID: 45001, RECEIVABLES_TRX_ID: 601, AMOUNT: -204200, TYPE: 'LINE', COMMENTS: '源泉控除(>100万 20.42%)', EVENT_ID: stepIndex >= 5 ? 94002 : null }
      ];
      state.AR_PAYMENT_SCHEDULES_ALL = [{
        PAYMENT_SCHEDULE_ID: 45001, CUSTOMER_TRX_ID: 35001, CLASS: 'INV', DUE_DATE: '2026-08-14',
        AMOUNT_DUE_ORIGINAL: 2180000, AMOUNT_ADJUSTED: -306300,
        AMOUNT_DUE_REMAINING: brCreated ? 0 : 1873700,
        STATUS: brCreated ? 'CL' : 'OP'
      }];
      state.AR_DISTRIBUTIONS_ALL = [
        { LINE_ID: 75001, SOURCE_TABLE: 'ADJ', SOURCE_ID: 61001, CODE_COMBINATION_ID: 1150, AMOUNT_DR: 102100, AMOUNT_CR: 0, NOTE: '仮払源泉税(10.21%)' },
        { LINE_ID: 75002, SOURCE_TABLE: 'ADJ', SOURCE_ID: 61001, CODE_COMBINATION_ID: 1110, AMOUNT_DR: 0, AMOUNT_CR: 102100, NOTE: '売掛金減額' },
        { LINE_ID: 75003, SOURCE_TABLE: 'ADJ', SOURCE_ID: 61002, CODE_COMBINATION_ID: 1150, AMOUNT_DR: 204200, AMOUNT_CR: 0, NOTE: '仮払源泉税(20.42%)' },
        { LINE_ID: 75004, SOURCE_TABLE: 'ADJ', SOURCE_ID: 61002, CODE_COMBINATION_ID: 1110, AMOUNT_DR: 0, AMOUNT_CR: 204200, NOTE: '売掛金減額' }
      ];
      // 参考用: 裏書譲渡対象の仕入先AP債務ヘッダ
      state.AP_INVOICES_ALL = [{
        INVOICE_ID: 10999, INVOICE_NUM: 'AP-END-2026-099', VENDOR_ID: 5003, VENDOR_SITE_ID: 5103, ORG_ID: 300001,
        INVOICE_DATE: '2026-05-15', INVOICE_CURRENCY_CODE: 'JPY', INVOICE_AMOUNT: 875800,
        AMOUNT_PAID: stepIndex >= 4 ? 875800 : 0, PAYMENT_METHOD_CODE: 'BR_ENDORSEMENT',
        VALIDATION_STATUS: 'VALIDATED', PAYMENT_STATUS_FLAG: stepIndex >= 4 ? 'Y' : 'N'
      }];
      if (stepIndex === 1) {
        ['RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'ZX_LINES', 'RA_CUST_TRX_LINE_GL_DIST_ALL', 'AR_ADJUSTMENTS_ALL', 'AR_PAYMENT_SCHEDULES_ALL', 'AR_DISTRIBUTIONS_ALL', 'AP_INVOICES_ALL'].forEach(t => {
          state[t].forEach((_, i) => markChange(t, i));
        });
      }
    }

    // --- S2以降: でんさい2件分割受取 ---
    if (stepIndex >= 2) {
      const allClosed = stepIndex >= 4;
      state.AR_BATCHES_ALL.push({ BATCH_ID: 5101, NAME: 'BR_SPLIT_CREATE_05', TYPE: 'BR', STATUS: 'COMPLETED_CREATION', REMIT_BANK_ACCT_USE_ID: 7001, RECEIPT_METHOD_ID: 411 });
      state.RA_CUSTOMER_TRX_ALL.push(
        { CUSTOMER_TRX_ID: 35002, TRX_NUMBER: 'DEN-BR-2026-002A', CUST_TRX_TYPE_SEQ_ID: 302, TRX_CLASS: 'BR', BILL_TO_CUSTOMER_ID: 6001, TRX_DATE: '2026-05-15', COMPLETE_FLAG: 'Y', BR_AMOUNT: 997900, BATCH_ID: 5101 },
        { CUSTOMER_TRX_ID: 35003, TRX_NUMBER: 'DEN-BR-2026-002B', CUST_TRX_TYPE_SEQ_ID: 302, TRX_CLASS: 'BR', BILL_TO_CUSTOMER_ID: 6001, TRX_DATE: '2026-05-15', COMPLETE_FLAG: 'Y', BR_AMOUNT: 875800, BATCH_ID: 5101 }
      );
      state.RA_CUSTOMER_TRX_LINES_ALL.push(
        { CUSTOMER_TRX_LINE_ID: 36005, CUSTOMER_TRX_ID: 35002, LINE_NUMBER: 1, LINE_TYPE: 'BR', DESCRIPTION: '分割でんさいA（銀行割引対象）', EXTENDED_AMOUNT: 997900, BR_REF_CUSTOMER_TRX_ID: 35001, BR_REF_PAYMENT_SCHEDULE_ID: 45001 },
        { CUSTOMER_TRX_LINE_ID: 36006, CUSTOMER_TRX_ID: 35003, LINE_NUMBER: 1, LINE_TYPE: 'BR', DESCRIPTION: '分割でんさいB（裏書譲渡対象）', EXTENDED_AMOUNT: 875800, BR_REF_CUSTOMER_TRX_ID: 35001, BR_REF_PAYMENT_SCHEDULE_ID: 45001 }
      );
      state.AR_PAYMENT_SCHEDULES_ALL.push(
        { PAYMENT_SCHEDULE_ID: 45002, CUSTOMER_TRX_ID: 35002, CLASS: 'BR', DUE_DATE: '2026-08-14', AMOUNT_DUE_ORIGINAL: 997900, AMOUNT_ADJUSTED: 0, AMOUNT_DUE_REMAINING: allClosed ? 0 : 997900, STATUS: allClosed ? 'CL' : 'OP', CASH_RECEIPT_ID: stepIndex >= 3 ? 52001 : null },
        { PAYMENT_SCHEDULE_ID: 45003, CUSTOMER_TRX_ID: 35003, CLASS: 'BR', DUE_DATE: '2026-08-14', AMOUNT_DUE_ORIGINAL: 875800, AMOUNT_ADJUSTED: 0, AMOUNT_DUE_REMAINING: allClosed ? 0 : 875800, STATUS: allClosed ? 'CL' : 'OP', CASH_RECEIPT_ID: null }
      );
      state.AR_TRANSACTION_HISTORY_ALL.push(
        { TRANSACTION_HISTORY_ID: 85001, CUSTOMER_TRX_ID: 35002, TRX_DATE: '2026-05-15', GL_DATE: '2026-05-15', STATUS: 'PENDING_REMITTANCE', EVENT: 'COMPLETED', CURRENT_RECORD_FLAG: stepIndex === 2 ? 'Y' : 'N', POSTABLE_FLAG: 'Y', BATCH_ID: 5101, EVENT_ID: stepIndex >= 5 ? 94003 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3 },
        { TRANSACTION_HISTORY_ID: 85002, CUSTOMER_TRX_ID: 35003, TRX_DATE: '2026-05-15', GL_DATE: '2026-05-15', STATUS: 'PENDING_REMITTANCE', EVENT: 'COMPLETED', CURRENT_RECORD_FLAG: stepIndex < 4 ? 'Y' : 'N', POSTABLE_FLAG: 'Y', BATCH_ID: 5101, EVENT_ID: stepIndex >= 5 ? 94003 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3 }
      );
      state.AR_DISTRIBUTIONS_ALL.push(
        { LINE_ID: 75005, SOURCE_TABLE: 'TH', SOURCE_ID: 85001, CODE_COMBINATION_ID: 1120, AMOUNT_DR: 997900, AMOUNT_CR: 0, NOTE: '電子記録債権A(保有)' },
        { LINE_ID: 75006, SOURCE_TABLE: 'TH', SOURCE_ID: 85001, CODE_COMBINATION_ID: 1110, AMOUNT_DR: 0, AMOUNT_CR: 997900, NOTE: '売掛金振替A' },
        { LINE_ID: 75007, SOURCE_TABLE: 'TH', SOURCE_ID: 85002, CODE_COMBINATION_ID: 1120, AMOUNT_DR: 875800, AMOUNT_CR: 0, NOTE: '電子記録債権B(保有)' },
        { LINE_ID: 75008, SOURCE_TABLE: 'TH', SOURCE_ID: 85002, CODE_COMBINATION_ID: 1110, AMOUNT_DR: 0, AMOUNT_CR: 875800, NOTE: '売掛金振替B' }
      );
      if (stepIndex === 2) {
        markChange('AR_BATCHES_ALL', 0); markChange('RA_CUSTOMER_TRX_ALL', 1); markChange('RA_CUSTOMER_TRX_ALL', 2);
        markChange('RA_CUSTOMER_TRX_LINES_ALL', 4); markChange('RA_CUSTOMER_TRX_LINES_ALL', 5);
        markChange('AR_PAYMENT_SCHEDULES_ALL', 0); markChange('AR_PAYMENT_SCHEDULES_ALL', 1); markChange('AR_PAYMENT_SCHEDULES_ALL', 2);
        markChange('AR_TRANSACTION_HISTORY_ALL', 0); markChange('AR_TRANSACTION_HISTORY_ALL', 1);
        [4, 5, 6, 7].forEach(i => markChange('AR_DISTRIBUTIONS_ALL', i));
      }
    }

    // --- S3以降: パターンA BR-2A銀行割引 (FACTORED) ---
    if (stepIndex >= 3) {
      state.AR_BATCHES_ALL.push({ BATCH_ID: 5102, NAME: 'BR_FACTORING_06', TYPE: 'REMITTANCE', STATUS: 'COMPLETED_CREATION', REMIT_BANK_ACCT_USE_ID: 7001, RECEIPT_METHOD_ID: 411 });
      state.AR_TRANSACTION_HISTORY_ALL.push({
        TRANSACTION_HISTORY_ID: 85003, CUSTOMER_TRX_ID: 35002, TRX_DATE: '2026-06-05', GL_DATE: '2026-06-05',
        STATUS: 'FACTORED', EVENT: 'FACTORED', CURRENT_RECORD_FLAG: stepIndex === 3 ? 'Y' : 'N',
        POSTABLE_FLAG: 'Y', BATCH_ID: 5102, EVENT_ID: stepIndex >= 5 ? 94004 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3
      });
      state.AR_CASH_RECEIPTS_ALL = [{
        CASH_RECEIPT_ID: 52001, RECEIPT_NUMBER: 'BR-FACT-2026-001', AMOUNT: 990000, RECEIPT_DATE: '2026-06-05',
        PAY_FROM_CUSTOMER: 6001, RECEIPT_METHOD_ID: 411, REMIT_BANK_ACCT_USE_ID: 7001, STATUS: 'APP'
      }];
      state.AR_CASH_RECEIPT_HISTORY_ALL = [{
        CASH_RECEIPT_HISTORY_ID: 53001, CASH_RECEIPT_ID: 52001, STATUS: 'CLEARED', TRX_DATE: '2026-06-05', GL_DATE: '2026-06-05',
        AMOUNT: 990000, CURRENT_RECORD_FLAG: 'Y', EVENT_ID: stepIndex >= 5 ? 94004 : null
      }];
      state.AR_RECEIVABLE_APPLICATIONS_ALL = [{
        RECEIVABLE_APPLICATION_ID: 54001, CASH_RECEIPT_ID: 52001, APPLIED_CUSTOMER_TRX_ID: 35002,
        APPLIED_PAYMENT_SCHEDULE_ID: 45002, AMOUNT_APPLIED: 990000, STATUS: 'APP', APPLY_DATE: '2026-06-05'
      }];
      state.AR_DISTRIBUTIONS_ALL.push(
        { LINE_ID: 75009, SOURCE_TABLE: 'CRH', SOURCE_ID: 53001, CODE_COMBINATION_ID: 1001, AMOUNT_DR: 990000, AMOUNT_CR: 0, NOTE: '割引手取金着金(普通預金)' },
        { LINE_ID: 75010, SOURCE_TABLE: 'TH', SOURCE_ID: 85003, CODE_COMBINATION_ID: 6101, AMOUNT_DR: 7900, AMOUNT_CR: 0, NOTE: 'でんさい割引料(売却損)' },
        { LINE_ID: 75011, SOURCE_TABLE: 'TH', SOURCE_ID: 85003, CODE_COMBINATION_ID: 1122, AMOUNT_DR: 0, AMOUNT_CR: 997900, NOTE: '割引電子記録債権(保証見合)' }
      );
      if (stepIndex === 3) {
        markChange('AR_BATCHES_ALL', 1); markChange('AR_TRANSACTION_HISTORY_ALL', 0); markChange('AR_TRANSACTION_HISTORY_ALL', 2);
        markChange('AR_CASH_RECEIPTS_ALL', 0); markChange('AR_CASH_RECEIPT_HISTORY_ALL', 0); markChange('AR_RECEIVABLE_APPLICATIONS_ALL', 0);
        [8, 9, 10].forEach(i => markChange('AR_DISTRIBUTIONS_ALL', i));
      }
    }

    // --- S4以降: パターンB BR-2B裏書譲渡(ENDORSED) + 満期リスク消滅(RISK_ELIMINATED) ---
    if (stepIndex >= 4) {
      state.AR_TRANSACTION_HISTORY_ALL.push(
        {
          TRANSACTION_HISTORY_ID: 85004, CUSTOMER_TRX_ID: 35003, TRX_DATE: '2026-06-15', GL_DATE: '2026-06-15',
          STATUS: 'ENDORSED', EVENT: 'ENDORSED', CURRENT_RECORD_FLAG: 'N',
          POSTABLE_FLAG: 'Y', BATCH_ID: 5102, EVENT_ID: stepIndex >= 5 ? 94005 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3
        },
        {
          TRANSACTION_HISTORY_ID: 85005, CUSTOMER_TRX_ID: 35002, TRX_DATE: '2026-08-14', GL_DATE: '2026-08-14',
          STATUS: 'CLOSED', EVENT: 'RISK_ELIMINATED', CURRENT_RECORD_FLAG: 'Y',
          POSTABLE_FLAG: 'Y', BATCH_ID: 5102, EVENT_ID: stepIndex >= 5 ? 94006 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3
        },
        {
          TRANSACTION_HISTORY_ID: 85006, CUSTOMER_TRX_ID: 35003, TRX_DATE: '2026-08-14', GL_DATE: '2026-08-14',
          STATUS: 'CLOSED', EVENT: 'RISK_ELIMINATED', CURRENT_RECORD_FLAG: 'Y',
          POSTABLE_FLAG: 'Y', BATCH_ID: 5102, EVENT_ID: stepIndex >= 5 ? 94006 : null, POSTING_CONTROL_ID: stepIndex >= 6 ? 1 : -3
        }
      );
      state.AR_DISTRIBUTIONS_ALL.push(
        { LINE_ID: 75012, SOURCE_TABLE: 'TH', SOURCE_ID: 85004, CODE_COMBINATION_ID: 2101, AMOUNT_DR: 875800, AMOUNT_CR: 0, NOTE: '買掛金相殺減少(裏書譲渡)' },
        { LINE_ID: 75013, SOURCE_TABLE: 'TH', SOURCE_ID: 85004, CODE_COMBINATION_ID: 1123, AMOUNT_DR: 0, AMOUNT_CR: 875800, NOTE: '譲渡電子記録債権(保証見合)' },
        { LINE_ID: 75014, SOURCE_TABLE: 'TH', SOURCE_ID: 85005, CODE_COMBINATION_ID: 1122, AMOUNT_DR: 997900, AMOUNT_CR: 0, NOTE: '割引保証消滅(満期正常決済)' },
        { LINE_ID: 75015, SOURCE_TABLE: 'TH', SOURCE_ID: 85005, CODE_COMBINATION_ID: 1120, AMOUNT_DR: 0, AMOUNT_CR: 997900, NOTE: '保有BR-2A 本勘定消込' },
        { LINE_ID: 75016, SOURCE_TABLE: 'TH', SOURCE_ID: 85006, CODE_COMBINATION_ID: 1123, AMOUNT_DR: 875800, AMOUNT_CR: 0, NOTE: '裏書保証消滅(満期正常決済)' },
        { LINE_ID: 75017, SOURCE_TABLE: 'TH', SOURCE_ID: 85006, CODE_COMBINATION_ID: 1120, AMOUNT_DR: 0, AMOUNT_CR: 875800, NOTE: '保有BR-2B 本勘定消込' }
      );
      if (stepIndex === 4) {
        markChange('AP_INVOICES_ALL', 0);
        markChange('AR_PAYMENT_SCHEDULES_ALL', 1); markChange('AR_PAYMENT_SCHEDULES_ALL', 2);
        [1, 2, 3, 4, 5].forEach(i => markChange('AR_TRANSACTION_HISTORY_ALL', i));
        [11, 12, 13, 14, 15, 16].forEach(i => markChange('AR_DISTRIBUTIONS_ALL', i));
      }
    }

    // --- S5以降: SLA会計作成 ---
    if (stepIndex >= 5) {
      const glSt = stepIndex >= 6 ? 'Y' : 'N';
      state.XLA_TRANSACTION_ENTITIES = [
        { ENTITY_ID: 84001, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'TRANSACTIONS', TRANSACTION_NUMBER: 'AR-INV-2026-002', SOURCE_ID_INT_1: 35001 },
        { ENTITY_ID: 84002, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'ADJUSTMENTS', TRANSACTION_NUMBER: 'ADJ-WHT-61001', SOURCE_ID_INT_1: 61001 },
        { ENTITY_ID: 84003, APPLICATION_ID: 222, LEDGER_ID: 2001, ENTITY_CODE: 'BILLS_RECEIVABLE', TRANSACTION_NUMBER: 'DEN-BR-2026-002A/B', SOURCE_ID_INT_1: 35002 }
      ];
      state.XLA_EVENTS = [
        { EVENT_ID: 94001, ENTITY_ID: 84001, EVENT_TYPE_CODE: 'INV_CREATE', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94002, ENTITY_ID: 84002, EVENT_TYPE_CODE: 'ADJ_CREATE', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94003, ENTITY_ID: 84003, EVENT_TYPE_CODE: 'BILL_CREATE', EVENT_DATE: '2026-05-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94004, ENTITY_ID: 84003, EVENT_TYPE_CODE: 'FACTOR_BR', EVENT_DATE: '2026-06-05', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94005, ENTITY_ID: 84003, EVENT_TYPE_CODE: 'ENDORSE_BR', EVENT_DATE: '2026-06-15', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' },
        { EVENT_ID: 94006, ENTITY_ID: 84003, EVENT_TYPE_CODE: 'BILL_RISK_ELIMINATED', EVENT_DATE: '2026-08-14', EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' }
      ];
      state.XLA_AE_HEADERS = [
        { AE_HEADER_ID: 95001, EVENT_ID: 94001, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Sales Invoices', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-05' },
        { AE_HEADER_ID: 95002, EVENT_ID: 94002, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Adjustment', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-05' },
        { AE_HEADER_ID: 95003, EVENT_ID: 94003, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-05-15', JE_CATEGORY_NAME: 'Bills Receivable', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-05' },
        { AE_HEADER_ID: 95004, EVENT_ID: 94004, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-06-05', JE_CATEGORY_NAME: 'Bills Receivable', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-06' },
        { AE_HEADER_ID: 95005, EVENT_ID: 94005, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-06-15', JE_CATEGORY_NAME: 'Bills Receivable', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-06' },
        { AE_HEADER_ID: 95006, EVENT_ID: 94006, LEDGER_ID: 2001, ACCOUNTING_DATE: '2026-08-14', JE_CATEGORY_NAME: 'Bills Receivable', GL_TRANSFER_STATUS_CODE: glSt, PERIOD_NAME: '2026-08' }
      ];
      const aeLinesRaw = [
        [95001, 1, 'RECEIVABLE', 1110, 2180000, 0, '売掛金計上（税込）', 741],
        [95001, 2, 'REVENUE', 4001, 0, 1000000, '売上高（標準10%）', 742],
        [95001, 3, 'REVENUE', 4002, 0, 1000000, '売上高（軽減8%）', 743],
        [95001, 4, 'TAX', 2501, 0, 100000, '仮受消費税10%', 744],
        [95001, 5, 'TAX', 2502, 0, 80000, '仮受消費税8%', 745],
        [95002, 1, 'WRITE_OFF', 1150, 102100, 0, '仮払源泉税（<=100万 10.21%）', 746],
        [95002, 2, 'WRITE_OFF', 1150, 204200, 0, '仮払源泉税（>100万 20.42%）', 747],
        [95002, 3, 'RECEIVABLE', 1110, 0, 306300, '売掛金減額（先方源泉控除）', 748],
        [95003, 1, 'BR_UNPAID', 1120, 1873700, 0, '分割でんさいA/B受取（保有）', 749],
        [95003, 2, 'RECEIVABLE', 1110, 0, 1873700, '売掛金全額振替消込', 750],
        [95004, 1, 'CASH', 1001, 990000, 0, '普通預金（BR-2A 割引手取着金）', 751],
        [95004, 2, 'BANK_CHARGES', 6101, 7900, 0, '手形・でんさい売却損（割引料）', 752],
        [95004, 3, 'BR_FACTORED', 1122, 0, 997900, '割引電子記録債権（保証見合）', 753],
        [95005, 1, 'LIABILITY', 2101, 875800, 0, '買掛金決済減少（BR-2B 裏書譲渡）', 754],
        [95005, 2, 'BR_ENDORSED', 1123, 0, 875800, '譲渡電子記録債権（保証見合）', 755],
        [95006, 1, 'BR_FACTORED', 1122, 997900, 0, '割引保証消滅（満期正常決済）', 756],
        [95006, 2, 'BR_ENDORSED', 1123, 875800, 0, '裏書保証消滅（満期正常決済）', 757],
        [95006, 3, 'BR_UNPAID', 1120, 0, 1873700, '保有電子記録債権A/B 消滅完了', 758]
      ];
      state.XLA_AE_LINES = aeLinesRaw.map(([hid, ln, cls, ccid, dr, cr, desc, linkId]) => ({
        AE_HEADER_ID: hid, AE_LINE_NUM: ln, ACCOUNTING_CLASS_CODE: cls,
        CODE_COMBINATION_ID: ccid, SEGMENT_CONCAT: CCID_LIST[ccid].concat,
        ACCOUNT_NAME: CCID_LIST[ccid].name, ACCOUNTED_DR: dr, ACCOUNTED_CR: cr, DESCRIPTION: desc, GL_SL_LINK_ID: linkId
      }));
      state.XLA_DISTRIBUTION_LINKS = [
        { AE_HEADER_ID: 95001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 37001, REF_AE_HEADER_ID: 95001 },
        { AE_HEADER_ID: 95002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 75001, REF_AE_HEADER_ID: 95002 },
        { AE_HEADER_ID: 95003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 75005, REF_AE_HEADER_ID: 95003 },
        { AE_HEADER_ID: 95004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 75009, REF_AE_HEADER_ID: 95004 },
        { AE_HEADER_ID: 95005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 75012, REF_AE_HEADER_ID: 95005 },
        { AE_HEADER_ID: 95006, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AR_DISTRIBUTIONS_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 75014, REF_AE_HEADER_ID: 95006 }
      ];
      if (stepIndex === 5) {
        ['XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS', 'XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'].forEach(t => {
          state[t].forEach((_, i) => markChange(t, i));
        });
      }
    }

    // --- S6: GL転記 ---
    if (stepIndex >= 6) {
      state.GL_INTERFACE = state.XLA_AE_LINES.map((l, idx) => ({
        GROUP_ID: 6201, LINE_NO: idx + 1, STATUS: 'PROCESSED', USER_JE_SOURCE_NAME: 'Receivables',
        USER_JE_CATEGORY_NAME: state.XLA_AE_HEADERS.find(h => h.AE_HEADER_ID === l.AE_HEADER_ID).JE_CATEGORY_NAME,
        CODE_COMBINATION_ID: l.CODE_COMBINATION_ID, ENTERED_DR: l.ACCOUNTED_DR, ENTERED_CR: l.ACCOUNTED_CR
      }));
      state.GL_JE_BATCHES = [
        { JE_BATCH_ID: 55201, NAME: 'AR_DISCOUNT_ENDORSE_BATCH_2026', STATUS: 'P', DEFAULT_PERIOD_NAME: '2026-08', RUNNING_TOTAL_ACCOUNTED_DR: 8107400, RUNNING_TOTAL_ACCOUNTED_CR: 8107400 }
      ];
      state.GL_JE_HEADERS = [
        { JE_HEADER_ID: 66201, JE_BATCH_ID: 55201, LEDGER_ID: 2001, JE_SOURCE: 'Receivables', JE_CATEGORY: 'Sales & BR Create', PERIOD_NAME: '2026-05', STATUS: 'P', RUNNING_TOTAL_DR: 4360000, RUNNING_TOTAL_CR: 4360000 },
        { JE_HEADER_ID: 66202, JE_BATCH_ID: 55201, LEDGER_ID: 2001, JE_SOURCE: 'Receivables', JE_CATEGORY: 'Factoring & Endorsement', PERIOD_NAME: '2026-06', STATUS: 'P', RUNNING_TOTAL_DR: 1873700, RUNNING_TOTAL_CR: 1873700 },
        { JE_HEADER_ID: 66203, JE_BATCH_ID: 55201, LEDGER_ID: 2001, JE_SOURCE: 'Receivables', JE_CATEGORY: 'BR Risk Eliminated', PERIOD_NAME: '2026-08', STATUS: 'P', RUNNING_TOTAL_DR: 1873700, RUNNING_TOTAL_CR: 1873700 }
      ];
      state.GL_JE_LINES = state.XLA_AE_LINES.map(l => {
        const jhid = [95001, 95002, 95003].includes(l.AE_HEADER_ID) ? 66201 : ([95004, 95005].includes(l.AE_HEADER_ID) ? 66202 : 66203);
        const per = jhid === 66201 ? '2026-05' : (jhid === 66202 ? '2026-06' : '2026-08');
        return buildJournalRow(jhid, l.AE_LINE_NUM + (l.AE_HEADER_ID % 10) * 10, l.CODE_COMBINATION_ID, l.ACCOUNTED_DR, l.ACCOUNTED_CR, l.DESCRIPTION, per, l.GL_SL_LINK_ID);
      });
      state.GL_IMPORT_REFERENCES = state.GL_JE_LINES.map(l => ({
        JE_HEADER_ID: l.JE_HEADER_ID, JE_LINE_NUM: l.JE_LINE_NUM, GL_SL_LINK_ID: l.GL_SL_LINK_ID, GL_SL_LINK_TABLE: 'XLAJEL'
      }));
      state.GL_BALANCES = computeBalances(state.GL_JE_LINES);
      ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES', 'GL_BALANCES'].forEach(t => {
        state[t].forEach((_, i) => markChange(t, i));
      });
    }
  }

  return { state, changedRows };
}

const FusionDENSAI = {
  AFF_SEGMENTS,
  CCID_LIST,
  DOMAINS,
  TABLES,
  RELATIONS,
  CASES,
  computeStateAtStep
};

if (typeof window !== 'undefined') {
  window.FusionDENSAI = FusionDENSAI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FusionDENSAI;
}
