// Oracle Fusion ERP Financials 26D — Subledger Accounting (SLA) & FAH End-to-End Flow Data
// OEDMF 26D Compliant Tables & Columns Only (59 Tables / 68 Relations / 9 Steps)
// AFF Structure: 会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3

const AFF_SEGMENTS = [
  { num: 1, col: 'SEGMENT1', name: '会社', codeLen: 2, example: '01', desc: '01: 日本法人株式会社 (LE_01)' },
  { num: 2, col: 'SEGMENT2', name: '部門', codeLen: 3, example: '100', desc: '100: 本社管理 / 200: 営業部 / 300: 情報システム部' },
  { num: 3, col: 'SEGMENT3', name: '勘定科目', codeLen: 4, example: '1101', desc: '1101:売掛金 / 1201:仮払消費税 / 1301:使用権資産 / 1691:減価償却累計額 / 2101:買掛金 / 2151:仮受消費税 / 2301:リース負債 / 4101:製品売上 / 4102:クラウド収益 / 5101:外注費 / 5201:減価償却費' },
  { num: 4, col: 'SEGMENT4', name: '補助科目', codeLen: 3, example: '001', desc: '000: 共通 / 001: 取引先別管理' },
  { num: 5, col: 'SEGMENT5', name: '税コード', codeLen: 2, example: '10', desc: '00: 対象外 / 10: 消費税10%' },
  { num: 6, col: 'SEGMENT6', name: '管理コード', codeLen: 3, example: '001', desc: '000: なし / 001: 案件A / 002: クラウドSaaS' },
  { num: 7, col: 'SEGMENT7', name: '備考1', codeLen: 3, example: '000', desc: '000: デフォルト（将来拡張用予備）' },
  { num: 8, col: 'SEGMENT8', name: '備考2', codeLen: 3, example: '000', desc: '000: デフォルト（将来拡張用予備）' },
  { num: 9, col: 'SEGMENT9', name: '備考3', codeLen: 3, example: '000', desc: '000: デフォルト（将来拡張用予備）' }
];

const CCID_LIST = [
  { id: 1001, type: 'A', name: '売掛金', aff: '01-100-1101-001-00-000-000-000-000', desc: '資産：売掛金（AR & FAH共用）' },
  { id: 1002, type: 'A', name: '仮払消費税(10%)', aff: '01-100-1201-000-10-000-000-000-000', desc: '資産：仮払消費税10%（AP）' },
  { id: 1003, type: 'A', name: '使用権資産(ROU)', aff: '01-100-1301-000-00-000-000-000-000', desc: '資産：リース使用権資産（LA）' },
  { id: 1004, type: 'A', name: '減価償却累計額', aff: '01-100-1691-000-00-000-000-000-000', desc: '資産控除：備品減価償却累計額（FA）' },
  { id: 2001, type: 'L', name: '買掛金', aff: '01-100-2101-001-00-000-000-000-000', desc: '負債：買掛金（AP）' },
  { id: 2002, type: 'L', name: '仮受消費税(10%)', aff: '01-100-2151-000-10-000-000-000-000', desc: '負債：仮受消費税10%（AR）' },
  { id: 2003, type: 'L', name: 'リース負債', aff: '01-100-2301-001-00-000-000-000-000', desc: '負債：リース負債（LA）' },
  { id: 4001, type: 'R', name: '製品売上高', aff: '01-200-4101-000-10-001-000-000-000', desc: '収益：製品売上高（AR）' },
  { id: 4002, type: 'R', name: 'クラウドサービス収益', aff: '01-200-4102-000-00-002-000-000-000', desc: '収益：クラウドサービス収益（FAH ADR導出）' },
  { id: 5001, type: 'E', name: '外注費', aff: '01-300-5101-000-10-001-000-000-000', desc: '費用：外注費（AP）' },
  { id: 5002, type: 'E', name: '減価償却費', aff: '01-300-5201-000-00-000-000-000-000', desc: '費用：減価償却費（FA）' }
];

// サポート参照 (Supporting References) vs 付加フレックスフィールド (DFF) 徹底比較データ
const SR_VS_DFF_COMPARISON = {
  title: 'SLAにおける「サポート参照 (Supporting References)」vs「DFF (付加フレックスフィールド)」の設計違い',
  subtitle: 'なぜ標準トランザクションのDFFではなく、SLAサポート参照 (XLA_ANALYTICAL_*) を設計・利用するのか？',
  dimensions: [
    {
      aspect: '残高保持機能 (Balances)',
      supportingRef: '【残高有 (`BALANCING_FLAG="Y"`) あり / 残高無 (`N`) 選択可】\n残高有を設定すると `XLA_AC_BALANCES` テーブルに「CCID × 補助コード(AC1) × 会計期間」の期首・期中DR/CR残高を自動集計。残高無は残高表を作らず監査属性のみ保持。',
      dff: '【残高集計なし】\nDFFは取引行 (`ATTRIBUTE1..15`) や仕訳単票 (`GL_JE_LINES.ATTRIBUTE*`) に文字列を格納するのみで、ERP標準での「CCID × 属性値」残高累積テーブルは存在しない。',
      verdict: '取引先別・契約別等の補助元帳残高照会や残高試算表要件がある場合は「残高有サポート参照」が必須。'
    },
    {
      aspect: '格納先テーブル (Storage)',
      supportingRef: '`XLA_AE_LINE_ACS` (`AC1`..`AC5` の専用構造化カラム) ＋ 残高有のみ `XLA_AC_BALANCES`。仕訳明細 (`XLA_AE_LINES`) と1対Nで論理分離され、最大5つの詳細項目を型付きで管理可能。',
      dff: '各サブ元帳トランザクション表 (`AP_INVOICES_ALL.ATTRIBUTE1..15`, `RA_CUSTOMER_TRX_ALL.ATTRIBUTE1..15`) 等。GL連携時も一部制限あり。',
      verdict: 'SLA明細レベルで標準化された検索・OTBI分析軸を持たせるならサポート参照が優位。'
    },
    {
      aspect: 'サブ元帳横断の正規化 (Cross-Subledger)',
      supportingRef: '1つのサポート参照コード (`SR_COUNTERPARTY`) に対し、`XLA_ANALYTICAL_SOURCES` で AP=`VENDOR_NAME`、AR=`BILL_TO_CUSTOMER_NAME`、FAH=`HEADER_CHAR1` のように別々のソースを同一の `AC1 (相手先)` へ正規化マッピングできる！',
      dff: 'サブ元帳ごとにコンテキスト・`ATTRIBUTE` 番号がバラバラ（APの`ATTRIBUTE1`は支払条件、ARの`ATTRIBUTE1`は営業担当など）で横断集計が困難。',
      verdict: 'AP/AR/FA/LA/FAH の5大サブ元帳を跨いで「株式会社グローバル商事」の残高を一元集計可能！'
    },
    {
      aspect: 'ルール適用・アサイン方式',
      supportingRef: '仕訳入力ルール・セット (`XLA_LINE_DEFN_AC_ASSGNS`) に仕訳明細ルール単位で紐付けるため、「このイベント・この勘定クラスの時だけ抽出」が可能。GL転記の要約条件には使われずサブ元帳詳細に残る。',
      dff: '画面入力時にコンテキスト単位で全レコードに割り当てられ、会計ルール（JERS/ADR）から直接参照するにはカスタムソース登録や個別ルール化が必要。',
      verdict: '会計イベント単位・仕訳ルール単位の制御性・拡張性でサポート参照が圧倒的に柔軟。'
    },
    {
      aspect: '会計確定後のトレーサビリティとGL連携',
      supportingRef: 'Create Accounting 実行時にスナップショット値として `XLA_AE_LINE_ACS` に確定保存。GL要約転記してもSLA側では元明細・サポート参照単位でドリルダウン可能。',
      dff: '取引側のDFF変更が会計確定後の仕訳表示とズレるリスクがあり、GLへ全DFF列を持ち運ぶ設定は煩雑。',
      verdict: '監査証拠・証憑項目（外部システム、外部請求書番号、満期日、数量、単価）の保全に「残高無サポート参照」が最適。'
    }
  ],
  useCases: [
    {
      code: 'SR_COUNTERPARTY',
      type: '残高有サポート参照 (`BALANCING_FLAG = Y`)',
      carryForward: 'Y / A (Year End Carry Forward = Always)',
      attributes: 'AC1: 相手先 (COUNTERPARTY_NAME)',
      targetTables: 'XLA_ANALYTICAL_HDRS_B → XLA_AE_LINE_ACS → XLA_AC_BALANCES',
      sampleEffect: 'AR 売掛金(880,000円) と FAH 売掛金(300,000円) の相手先が同一「株式会社グローバル商事」であるため、`XLA_AC_BALANCES` 上で CCID=1001 × 株式会社グローバル商事 = 1,180,000円 に自動合算される！'
    },
    {
      code: 'SR_EXT_TRACE',
      type: '残高無サポート参照 (`BALANCING_FLAG = N`)',
      carryForward: 'N (Carry Forward なし)',
      attributes: 'AC1: 外部システム / AC2: 外部請求書番号 / AC3: 満期日 / AC4: 数量 / AC5: 単価',
      targetTables: 'XLA_ANALYTICAL_HDRS_B → XLA_AE_LINE_ACS (XLA_AC_BALANCESには入らない)',
      sampleEffect: '5項目を構造化して全サブ元帳仕訳 (`XLA_AE_LINE_ACS`) に保持しつつ、不要な組合せ爆発を防ぐため `XLA_AC_BALANCES` へは残高集計しない設計。'
    }
  ]
};

// 全9 SLA / FAH セットアップ画面モック＋テーブル紐付け定義
const SETUP_SCREENS = [
  {
    id: 'SCR_FAH',
    stepNo: 1,
    badge: 'STEP 0 · FAH登録',
    category: 'FAH基盤セットアップ',
    uiPath: '設定および保守 > 会計ハブ > サブ元帳アプリケーションの管理',
    taskName: '1. FAH サブ元帳アプリケーション・イベント・インタフェース定義',
    oedmfTables: ['XLA_SUBLEDGERS', 'XLA_EVENT_CLASSES_B', 'XLA_EVENT_TYPES_B', 'XLA_SOURCES_B', 'XLA_TRANSACTION_INT_CONTROLS'],
    summary: '外部SaaS請求基盤 (POS_BILLING / 請求イベント) を受け入れるため、FAH固有のサブ元帳アプリケーション `XX_FAH_CLOUD` (APPL_ID=20001) とイベントクラス/タイプ、ヘッダ・明細のカスタムソース、及びFBDI/インタフェース取込設定を登録する画面。',
    screenMock: {
      title: 'Fusion Setup UI: サブ元帳アプリケーションの編集 (XX_FAH_CLOUD)',
      fields: [
        { label: 'アプリケーションID / 短縮名', value: '20001 / XX_FAH_CLOUD' },
        { label: '仕訳ソース (JE_SOURCE_NAME)', value: 'XX Cloud Billing Hub' },
        { label: 'イベントクラス / タイプ', value: 'XX_CLOUD_BILLING / XX_CLOUD_REV_RECOG' },
        { label: '結合インポートおよびロード', value: 'Y (COMBINED_IMPORT_AND_LOAD_FLAG)' }
      ],
      columns: ['対象オブジェクト', 'コード / 識別子', 'データ型 / 性質', 'OEDMF 26D 格納テーブル'],
      rows: [
        ['サブ元帳アプリケーション', 'XX_FAH_CLOUD (20001)', 'JE Source: XX Cloud Billing Hub', 'XLA_SUBLEDGERS'],
        ['イベントタイプ', 'XX_CLOUD_REV_RECOG', 'ACCOUNTING_FLAG = Y', 'XLA_EVENT_TYPES_B'],
        ['ヘッダソース (CHAR1 / CHAR2 / DATE1)', 'HEADER_CHAR1 / HEADER_CHAR2 / HEADER_DATE1', '相手先 / 外部請求書番号 / 満期日', 'XLA_SOURCES_B'],
        ['明細ソース (CHAR1 / CHAR2 / NUM1..2)', 'LINE_CHAR1 / LINE_CHAR2 / NUMBER1 / NUMBER2', '外部システム / サービス種別 / 数量 / 単価', 'XLA_SOURCES_B'],
        ['インタフェース制御', 'XX_FAH_CLOUD_INT_CTRL', 'HDR_INT / LINE_INT', 'XLA_TRANSACTION_INT_CONTROLS']
      ]
    }
  },
  {
    id: 'SCR_FORMULA',
    stepNo: 2,
    badge: 'STEP 1 · 算式',
    category: 'Accounting Methods Builder (AMB)',
    uiPath: '設定および保守 > 会計ハブ > ユーザー定義算式の管理',
    taskName: '2. ユーザー定義算式 (User-Defined Formulas) の構築',
    oedmfTables: ['XLA_FORMULAS_B', 'XLA_FORMULA_DETAILS'],
    summary: 'インタフェースからは「数量 (`NUMBER1=300`)」と「単価 (`NUMBER2=1,000`)」のみを連携し、仕訳計上金額 (`300,000`) を SLA エンジン実行時に自動計算するユーザー定義算式 `XX_FAH_LINE_AMT_FML` を定義する画面。',
    screenMock: {
      title: 'Fusion Setup UI: ユーザー定義算式の編集 (XX_FAH_LINE_AMT_FML)',
      fields: [
        { label: '算式コード (FORMULA_CODE)', value: 'XX_FAH_LINE_AMT_FML' },
        { label: 'データ型 (DATATYPE_CODE)', value: 'N (数値 / Number)' },
        { label: '算式表現 (UI表示)', value: '"明細数量(NUMBER1)" * "明細単価(NUMBER2)"' },
        { label: '逆ポーランド内部式 (POSTFIX_EXPR)', value: 'LINE_NUMBER1 LINE_NUMBER2 *' }
      ],
      columns: ['順(USER_SEQ)', '式タイプ(EXPR_TYPE)', '参照ソース / 演算子', 'OEDMF 26D カラム'],
      rows: [
        ['1', 'S (Source)', 'LINE_NUMBER1 (数量 = 300)', 'XLA_FORMULA_DETAILS.POSTFIX_EXPR'],
        ['2', 'S (Source)', 'LINE_NUMBER2 (単価 = 1,000)', 'XLA_FORMULA_DETAILS.POSTFIX_EXPR'],
        ['3', 'O (Operator)', '* (乗算 → 実行時 300,000円 算出)', 'XLA_FORMULA_DETAILS.EXPR_TYPE']
      ]
    }
  },
  {
    id: 'SCR_MAPSET',
    stepNo: 3,
    badge: 'STEP 1 · マッピング',
    category: 'Accounting Methods Builder (AMB)',
    uiPath: '設定および保守 > 会計ハブ > マッピング・セットの管理',
    taskName: '3. マッピング・セット (Mapping Sets) 定義',
    oedmfTables: ['XLA_MAPPING_SETS_B', 'XLA_MAPPING_SET_VALUES'],
    summary: '外部システムの取引種別 (`LINE_CHAR2`) を総勘定元帳の AFF 第3セグメント「勘定科目 (`SEGMENT3`)」に変換する対照表。新規サービス追加時もルール本体を変えず、値マッピング行を追加するだけで運用できる。',
    screenMock: {
      title: 'Fusion Setup UI: マッピング・セットの編集 (XX_FAH_SVC_ACCT_MAP)',
      fields: [
        { label: 'マッピングセットコード', value: 'XX_FAH_SVC_ACCT_MAP' },
        { label: '割当モード / 対象セグメント', value: 'S (Segment) / SEGMENT3 (勘定科目)' },
        { label: '入力ソース (NUM_INPUTS=1)', value: 'LINE_CHAR2 (サービス種別)' },
        { label: '体系 (COA ID)', value: '101 (JP_COA_9SEG)' }
      ],
      columns: ['入力値 (INPUT_VALUE_CONSTANT1)', '出力勘定科目 (VALUE_CONSTANT)', '勘定科目名', '有効フラグ'],
      rows: [
        ['SaaS_USAGE', '4102', 'クラウドサービス収益 (今回のFAH明細で使用)', 'Y'],
        ['CONS_SVC', '4103', '導入コンサルティング収益', 'Y'],
        ['DEFAULT (予備)', '4101', '製品売上高', 'Y']
      ]
    }
  },
  {
    id: 'SCR_ADR',
    stepNo: 4,
    badge: 'STEP 1 · 勘定科目ルール',
    category: 'Accounting Methods Builder (AMB)',
    uiPath: '設定および保守 > 会計ハブ > 勘定科目ルールの管理',
    taskName: '4. 勘定科目ルール (Account Rules / ADR) ＆ 条件定義',
    oedmfTables: ['XLA_SEG_RULES_B', 'XLA_SEG_RULE_DETAILS', 'XLA_CONDITIONS'],
    summary: '仕訳のどの AFF セグメントをどの値／マッピングセット／定数から決定するかを定義。全9セグメント体系 (`会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-2-3`) のうち、FAH収益勘定を決めるルールを例示。',
    screenMock: {
      title: 'Fusion Setup UI: 勘定科目ルールの編集 (XX_FAH_REV_ACCT_ADR)',
      fields: [
        { label: 'ルールコード (SEGMENT_RULE_CODE)', value: 'XX_FAH_REV_ACCT_ADR' },
        { label: '割当タイプ / 対象セグメント', value: 'S (Segment) / SEGMENT3 (勘定科目)' },
        { label: '値タイプ (VALUE_TYPE_CODE)', value: 'M (Mapping Set)' },
        { label: '使用マッピングセット', value: 'XX_FAH_SVC_ACCT_MAP' }
      ],
      columns: ['優先順(SEQ)', '値タイプ', 'マッピングセット / 定数', '適用条件 (XLA_CONDITIONS)'],
      rows: [
        ['10', 'M (Mapping Set)', 'XX_FAH_SVC_ACCT_MAP (Input: LINE_CHAR2)', 'LINE_CHAR2 IS NOT NULL'],
        ['20', 'C (Constant)', '4101 (製品売上高 - フォールバック)', '(条件なし・デフォルト)']
      ]
    }
  },
  {
    id: 'SCR_DESC',
    stepNo: 5,
    badge: 'STEP 1 · 仕訳摘要',
    category: 'Accounting Methods Builder (AMB)',
    uiPath: '設定および保守 > 会計ハブ > 仕訳摘要ルールの管理',
    taskName: '5. 仕訳摘要ルール (Description Rules) 定義',
    oedmfTables: ['XLA_DESCRIPTIONS_B', 'XLA_CONDITIONS'],
    summary: '転記後のGL仕訳検索や監査時に可読性を高めるため、ヘッダ・明細の摘要文字列に取引番号やサービス種別等のソース値を自動埋め込みするルールを定義する。',
    screenMock: {
      title: 'Fusion Setup UI: 仕訳摘要ルールの編集 (XX_FAH_LINE_DESC)',
      fields: [
        { label: '摘要コード (DESCRIPTION_CODE)', value: 'XX_FAH_LINE_DESC' },
        { label: '適用アプリケーション', value: '20001 (XX_FAH_CLOUD)' },
        { label: '言語 / ステータス', value: 'JA / 有効 (ENABLED_FLAG = Y)' },
        { label: '適用条件', value: 'EVENT_TYPE_CODE = XX_CLOUD_REV_RECOG' }
      ],
      columns: ['表示パーツ順', '構成種別', 'テキスト / 埋め込みソース', '生成イメージ'],
      rows: [
        ['1', 'リテラル文字列', '[FAHクラウド請求] 取引番号:', '[FAHクラウド請求] 取引番号:'],
        ['2', 'ソース値参照', 'TRANSACTION_NUMBER / LINE_CHAR2', 'FAH-2026-001 / SaaS_USAGE'],
        ['3', 'ソース値参照', 'HEADER_CHAR1 (相手先名)', '株式会社グローバル商事']
      ]
    }
  },
  {
    id: 'SCR_JLT',
    stepNo: 6,
    badge: 'STEP 2 · 仕訳明細タイプ',
    category: 'Accounting Methods Builder (AMB)',
    uiPath: '設定および保守 > 会計ハブ > 仕訳明細ルールの管理',
    taskName: '6. 仕訳明細ルール (Journal Line Rules / JLT) ＆ 会計属性割当',
    oedmfTables: ['XLA_ACCT_LINE_TYPES_B', 'XLA_JLT_ACCT_ATTRS'],
    summary: '貸借区分 (`NATURAL_SIDE_CODE`: D=借方 / C=貸方)、会計クラス (`REVENUE` / `RECEIVABLE`)、同一CCID明細の集約有無 (`MERGE_DUPLICATE_CODE`) と、「入力金額 (`ENTERED_AMOUNT`) を算式 `XX_FAH_LINE_AMT_FML` から取得する」属性マッピングを定義する。',
    screenMock: {
      title: 'Fusion Setup UI: 仕訳明細ルールの編集 (XX_FAH_REV_CR_JLT & XX_FAH_AR_DR_JLT)',
      fields: [
        { label: 'JLTコード (貸方)', value: 'XX_FAH_REV_CR_JLT (収益認識・貸方)' },
        { label: '会計クラス (ACCOUNTING_CLASS_CODE)', value: 'REVENUE (収益)' },
        { label: '自然残高側 / 重複マージ', value: 'C (Credit) / ALL (集約なし N)' },
        { label: '入力金額ソース (XLA_JLT_ACCT_ATTRS)', value: 'SOURCE_ORIGIN_CODE=F → XX_FAH_LINE_AMT_FML' }
      ],
      columns: ['JLTコード', '借/貸', '会計クラス', 'ENTERED_AMOUNT マッピング元'],
      rows: [
        ['XX_FAH_AR_DR_JLT', 'D (借方)', 'RECEIVABLE (売掛金)', '算式: XX_FAH_LINE_AMT_FML (300×1,000=300,000)'],
        ['XX_FAH_REV_CR_JLT', 'C (貸方)', 'REVENUE (収益)', '算式: XX_FAH_LINE_AMT_FML (300×1,000=300,000)'],
        ['AP_ITEM_EXPENSE (標準参考)', 'D (借方)', 'ITEM EXPENSE', '標準ソース: AP_DIST_AMOUNT']
      ]
    }
  },
  {
    id: 'SCR_SR',
    stepNo: 7,
    badge: 'STEP 2 · サポート参照',
    category: 'SLA独自分析軸 (残高有・残高無)',
    uiPath: '設定および保守 > 会計ハブ > サポート参照の管理',
    taskName: '7. サポート参照 (Supporting References：残高有＆残高無) の定義',
    oedmfTables: ['XLA_ANALYTICAL_HDRS_B', 'XLA_ANALYTICAL_DTLS_B', 'XLA_ANALYTICAL_SOURCES'],
    summary: '本設計の要となる2種類のサポート参照定義。(1) 残高有 (`SR_COUNTERPARTY`, `BALANCING_FLAG=Y`): 相手先を5サブ元帳横断で `AC1` に正規化し `XLA_AC_BALANCES` に残高保持。(2) 残高無 (`SR_EXT_TRACE`, `BALANCING_FLAG=N`): 外部システム(`AC1`), 外部請求書番号(`AC2`), 満期日(`AC3`), 数量(`AC4`), 単価(`AC5`) の5項目を明細追跡用に保持。',
    screenMock: {
      title: 'Fusion Setup UI: サポート参照の管理 (SR_COUNTERPARTY & SR_EXT_TRACE)',
      fields: [
        { label: '残高有コード / フラグ', value: 'SR_COUNTERPARTY / BALANCING_FLAG = Y' },
        { label: '年度末繰越 (YEAR_END_CARRY_FORWARD)', value: 'A (常に繰越 / Always)' },
        { label: '残高無コード / フラグ', value: 'SR_EXT_TRACE / BALANCING_FLAG = N' },
        { label: '残高無5項目構成', value: 'AC1:外部システム / AC2:外部請求書番号 / AC3:満期日 / AC4:数量 / AC5:単価' }
      ],
      columns: ['SRコード', '残高(Y/N)', '詳細コード (ACスロット)', '各サブ元帳マッピング元 (XLA_ANALYTICAL_SOURCES)'],
      rows: [
        ['SR_COUNTERPARTY', 'Y (残高有)', 'COUNTERPARTY (AC1: 相手先)', 'AP:VENDOR_NAME / AR:CUST_NAME / FA:VENDOR_NAME / LA:LESSOR_NAME / FAH:HEADER_CHAR1'],
        ['SR_EXT_TRACE', 'N (残高無)', 'EXT_SYSTEM (AC1: 外部システム)', 'AP:AP_PORTAL / AR:EC_ORDER / FA:ASSET_MGR / LA:LEASE_SYS / FAH:LINE_CHAR1'],
        ['SR_EXT_TRACE', 'N (残高無)', 'EXT_INV_NUM (AC2: 外部請求書番号)', 'AP:INVOICE_NUM / AR:TRX_NUMBER / FA:ASSET_NUMBER / LA:LEASE_NUMBER / FAH:HEADER_CHAR2'],
        ['SR_EXT_TRACE', 'N (残高無)', 'MATURITY_DATE (AC3: 満期日)', 'AP:TERMS_DATE / AR:DUE_DATE / FA:PRORATE_DATE / LA:LEASE_END_DATE / FAH:HEADER_DATE1'],
        ['SR_EXT_TRACE', 'N (残高無)', 'QTY (AC4: 数量) & UNIT_PRICE (AC5: 単価)', 'AP:QTY_INVOICED,UNIT_PRICE / AR:QTY_INVOICED,UNIT_SELLING_PRICE / FAH:NUMBER1,NUMBER2']
      ]
    }
  },
  {
    id: 'SCR_JERS',
    stepNo: 8,
    badge: 'STEP 2 · JERS',
    category: 'Accounting Methods Builder (AMB)',
    uiPath: '設定および保守 > 会計ハブ > 仕訳入力ルール・セットの管理',
    taskName: '8. 仕訳入力ルール・セット (JERS) 構成＆コンポーネント割当',
    oedmfTables: ['XLA_LINE_DEFINITIONS_B', 'XLA_LINE_DEFN_JLT_ASSGNS', 'XLA_LINE_DEFN_ADR_ASSGNS', 'XLA_LINE_DEFN_AC_ASSGNS'],
    summary: 'イベントクラス・イベントタイプごとに、JLT（どの仕訳行を作るか）・摘要・全9セグメントの勘定科目ルール（AFF `01-200-4102-...` 等）・サポート参照（`SR_COUNTERPARTY` & `SR_EXT_TRACE`）を1セットに統合して有効化・検証済 (`VALIDATION_STATUS_CODE = C`) にする。',
    screenMock: {
      title: 'Fusion Setup UI: 仕訳入力ルール・セットの編集 (XX_FAH_CLOUD_JERS)',
      fields: [
        { label: 'JERSコード (LINE_DEFINITION_CODE)', value: 'XX_FAH_CLOUD_JERS' },
        { label: 'イベントクラス / タイプ', value: 'XX_CLOUD_BILLING / XX_CLOUD_REV_RECOG' },
        { label: '検証ステータス', value: 'C (Complete / 有効化完了)' },
        { label: '割当サポート参照', value: 'SR_COUNTERPARTY (残高有) ＋ SR_EXT_TRACE (残高無)' }
      ],
      columns: ['紐付JLT行', '勘定科目ルール (SEGMENT1..9)', '摘要ルール', 'サポート参照 (XLA_LINE_DEFN_AC_ASSGNS)'],
      rows: [
        ['XX_FAH_AR_DR_JLT (借方・売掛金)', 'SEG1:01 / SEG2:100 / SEG3:1101 / SEG4:001 / SEG5..9:00..000', 'XX_FAH_LINE_DESC', 'SR_COUNTERPARTY + SR_EXT_TRACE'],
        ['XX_FAH_REV_CR_JLT (貸方・収益)', 'SEG1:01 / SEG2:200 / SEG3:ADR(4102) / SEG4:000 / SEG5:00 / SEG6:002', 'XX_FAH_LINE_DESC', 'SR_COUNTERPARTY + SR_EXT_TRACE']
      ]
    }
  },
  {
    id: 'SCR_AM_OPT',
    stepNo: 9,
    badge: 'STEP 2 · 会計方式＆元帳',
    category: '元帳・会計方法の有効化',
    uiPath: '設定および保守 > 一般会計 > 会計方式 / 元帳オプションの指定',
    taskName: '9. 会計方式 (Accounting Methods) ＆ 元帳会計オプション (Ledger Options)',
    oedmfTables: ['XLA_ACCTG_METHODS_B', 'XLA_ACCTG_METHOD_RULES', 'GL_LEDGERS', 'XLA_LEDGER_OPTIONS'],
    summary: '5大サブ元帳（AP・AR・FA・LA・FAH）の全 JERS を統括する会計方式 `XX_JP_CORP_AM` を `JP_CORP_LEDGER` へ割り当て、同時に各アプリケーションごとの GL 転送モード (`D=明細転送`) や GL 自動転記 (`ENABLE_SUBMIT_POSTING_FLAG=Y`) を確定させる最終構成。',
    screenMock: {
      title: 'Fusion Setup UI: 会計方式と元帳オプション (XX_JP_CORP_AM / JP_CORP_LEDGER)',
      fields: [
        { label: '会計方式 (SLA_ACCOUNTING_METHOD_CODE)', value: 'XX_JP_CORP_AM (JP法人統合会計方式)' },
        { label: '対象プライマリ元帳 (GL_LEDGERS)', value: 'JP_CORP_LEDGER (LEDGER_ID=300001 / COA=101)' },
        { label: 'GL転送モード (TRANSFER_TO_GL_MODE_CODE)', value: 'D (Detail / 明細単位転送)' },
        { label: 'GL転記自動送信', value: 'Y (ENABLE_SUBMIT_POSTING_FLAG = Y)' }
      ],
      columns: ['サブ元帳(APPL_ID)', '適用JERS (XLA_ACCTG_METHOD_RULES)', 'GL転送モード', '丸め/自動取消設定'],
      rows: [
        ['200 (Payables / AP)', 'AP_STD_INVOICE_JERS (標準 + SR付与)', 'D (詳細)', 'NEAREST / 翌期初自動取消なし'],
        ['222 (Receivables / AR)', 'AR_STD_TRX_JERS (標準 + SR付与)', 'D (詳細)', 'NEAREST / デフォルト'],
        ['140 (Assets / FA)', 'FA_DEPRN_JERS (標準 + SR付与)', 'D (詳細)', 'NEAREST / デフォルト'],
        ['10522 (Lease Accounting / LA)', 'FLA_ROU_COMMENCE_JERS (標準 + SR付与)', 'D (詳細)', 'NEAREST / デフォルト'],
        ['20001 (FAH / XX_FAH_CLOUD)', 'XX_FAH_CLOUD_JERS (ユーザー拡張)', 'D (詳細)', 'NEAREST / 自動転記=Y']
      ]
    }
  }
];

const DOMAINS = [
  { id: 'ORG_GL_MASTER', title: 'A. 企業組織・GL基本マスタ (ORG & GL COA 9-Seg)', subtitle: 'LE / OU / GL元帳 / 会計期間 / AFF 9セグメント体系', x: 20, y: 20, w: 540, h: 250, color: '#eff6ff', border: '#93c5fd', headerBg: '#1d4ed8' },
  { id: 'SLA_EVENT_FAH_SETUP', title: 'B. SLAイベントモデル & FAH基盤セットアップ', subtitle: 'Subledger定義 / Event Class & Type / Source / FAH I/F制御 / Ledger Options', x: 20, y: 290, w: 540, h: 250, color: '#f0fdf4', border: '#86efac', headerBg: '#15803d' },
  { id: 'SLA_AMB_RULES', title: 'C. SLAルールセット(AMB): 算式・ADR・JLT・SR(残高有/無)・JERS', subtitle: '算式 / Mapping Set / ADR・条件 / 摘要 / JLT / サポート参照 / JERS / 会計方式', x: 20, y: 560, w: 540, h: 640, color: '#fefce8', border: '#fde047', headerBg: '#a16207' },
  { id: 'SUBLEDGER_TXNS', title: 'D. 5大サブ元帳トランザクション (AP · AR · FA · LA · FAH)', subtitle: 'AP標準請求 / AR請求 / FA償却 / LA使用権資産 / FAH外部I/F→Base表', x: 590, y: 20, w: 630, h: 590, color: '#fff1f2', border: '#fda4af', headerBg: '#be123c' },
  { id: 'SLA_ENGINE_OUTPUT', title: 'E. SLA会計エンジン出力 & サポート参照残高 (XLA_*)', subtitle: 'Entities / Events / AE Headers & Lines / Distribution Links / AE Line ACs / AC Balances', x: 590, y: 630, w: 630, h: 570, color: '#fdf4ff', border: '#f0abfc', headerBg: '#7e22ce' },
  { id: 'GL_LEDGER', title: 'F. 一般会計(GL)転送・インポート・転記残高 (GL_*)', subtitle: 'GL Interface → Batches / Headers / Lines / References → GL Balances', x: 1250, y: 360, w: 390, h: 840, color: '#f0f9ff', border: '#7dd3fc', headerBg: '#0369a1' }
];

// 全59テーブルのSVG座標・カラム定義 (OEDMF 26D準拠)
const TABLES = [
  // === A. ORG_GL_MASTER (6 tables) ===
  {
    id: 'XLE_ENTITY_PROFILES', domain: 'ORG_GL_MASTER', x: 36, y: 62, w: 246, h: 48,
    shortDesc: '法的エンティティ(会社)マスタ', pk: ['LEGAL_ENTITY_ID'],
    cols: [
      { name: 'LEGAL_ENTITY_ID', role: 'pk' },
      { name: 'NAME', role: 'attr' },
      { name: 'LEGAL_ENTITY_IDENTIFIER', role: 'attr' },
      { name: 'COUNTRY', role: 'attr' },
      { name: 'TRANSACTING_ENTITY_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'HR_ALL_ORGANIZATION_UNITS_F', domain: 'ORG_GL_MASTER', x: 296, y: 62, w: 246, h: 48,
    shortDesc: '事業単位(BU/OU)マスタ', pk: ['ORGANIZATION_ID'],
    cols: [
      { name: 'ORGANIZATION_ID', role: 'pk' },
      { name: 'NAME', role: 'attr' },
      { name: 'EFFECTIVE_START_DATE', role: 'date' },
      { name: 'EFFECTIVE_END_DATE', role: 'date' },
      { name: 'BUSINESS_GROUP_ID', role: 'fk' }
    ]
  },
  {
    id: 'GL_LEDGERS', domain: 'ORG_GL_MASTER', x: 36, y: 122, w: 246, h: 48,
    shortDesc: '元帳・会計方式割当マスタ', pk: ['LEDGER_ID'],
    cols: [
      { name: 'LEDGER_ID', role: 'pk' },
      { name: 'NAME', role: 'attr' },
      { name: 'SHORT_NAME', role: 'attr' },
      { name: 'CHART_OF_ACCOUNTS_ID', role: 'fk' },
      { name: 'CURRENCY_CODE', role: 'attr' },
      { name: 'PERIOD_SET_NAME', role: 'attr' },
      { name: 'SLA_ACCOUNTING_METHOD_CODE', role: 'fk' },
      { name: 'SLA_ACCOUNTING_METHOD_TYPE', role: 'flag' }
    ]
  },
  {
    id: 'GL_PERIOD_STATUSES', domain: 'ORG_GL_MASTER', x: 296, y: 122, w: 246, h: 48,
    shortDesc: '会計期間オープン状況管理', pk: ['APPLICATION_ID', 'LEDGER_ID', 'PERIOD_NAME'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'LEDGER_ID', role: 'pk' },
      { name: 'PERIOD_NAME', role: 'pk' },
      { name: 'CLOSING_STATUS', role: 'flag' },
      { name: 'START_DATE', role: 'date' },
      { name: 'END_DATE', role: 'date' }
    ]
  },
  {
    id: 'FND_ID_FLEX_SEGMENTS', domain: 'ORG_GL_MASTER', x: 36, y: 182, w: 246, h: 48,
    shortDesc: 'AFF 9セグメント体系定義', pk: ['APPLICATION_ID', 'ID_FLEX_CODE', 'ID_FLEX_NUM', 'APPLICATION_COLUMN_NAME'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'ID_FLEX_CODE', role: 'pk' },
      { name: 'ID_FLEX_NUM', role: 'pk' },
      { name: 'APPLICATION_COLUMN_NAME', role: 'pk' },
      { name: 'SEGMENT_NAME', role: 'attr' },
      { name: 'SEGMENT_NUM', role: 'num' }
    ]
  },
  {
    id: 'GL_CODE_COMBINATIONS', domain: 'ORG_GL_MASTER', x: 296, y: 182, w: 246, h: 48,
    shortDesc: '勘定体系(AFF 9セグメント組合せ)', pk: ['CODE_COMBINATION_ID'],
    cols: [
      { name: 'CODE_COMBINATION_ID', role: 'pk' },
      { name: 'CHART_OF_ACCOUNTS_ID', role: 'fk' },
      { name: 'ACCOUNT_TYPE', role: 'flag' },
      { name: 'SEGMENT1', role: 'attr' },
      { name: 'SEGMENT2', role: 'attr' },
      { name: 'SEGMENT3', role: 'attr' },
      { name: 'SEGMENT4', role: 'attr' },
      { name: 'SEGMENT5', role: 'attr' },
      { name: 'SEGMENT6', role: 'attr' },
      { name: 'SEGMENT7', role: 'attr' },
      { name: 'SEGMENT8', role: 'attr' },
      { name: 'SEGMENT9', role: 'attr' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },

  // === B. SLA_EVENT_FAH_SETUP (6 tables) ===
  {
    id: 'XLA_SUBLEDGERS', domain: 'SLA_EVENT_FAH_SETUP', x: 36, y: 332, w: 246, h: 48,
    shortDesc: 'サブ元帳アプリケーション登録(AP/AR/FA/LA/FAH)', pk: ['APPLICATION_ID'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'APPLICATION_SHORT_NAME', role: 'attr' },
      { name: 'JE_SOURCE_NAME', role: 'attr' },
      { name: 'CONTROL_ACCOUNT_TYPE_CODE', role: 'flag' },
      { name: 'VALUATION_METHOD_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_EVENT_CLASSES_B', domain: 'SLA_EVENT_FAH_SETUP', x: 296, y: 332, w: 246, h: 48,
    shortDesc: '会計イベントクラス定義', pk: ['APPLICATION_ID', 'EVENT_CLASS_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'ENTITY_CODE', role: 'attr' },
      { name: 'EVENT_CLASS_CODE', role: 'pk' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_EVENT_TYPES_B', domain: 'SLA_EVENT_FAH_SETUP', x: 36, y: 392, w: 246, h: 48,
    shortDesc: '会計イベントタイプ定義', pk: ['APPLICATION_ID', 'EVENT_TYPE_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'ENTITY_CODE', role: 'attr' },
      { name: 'EVENT_CLASS_CODE', role: 'fk' },
      { name: 'EVENT_TYPE_CODE', role: 'pk' },
      { name: 'ACCOUNTING_FLAG', role: 'flag' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_SOURCES_B', domain: 'SLA_EVENT_FAH_SETUP', x: 296, y: 392, w: 246, h: 48,
    shortDesc: 'トランザクションソース属性定義(FAH/標準)', pk: ['APPLICATION_ID', 'SOURCE_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'SOURCE_CODE', role: 'pk' },
      { name: 'SOURCE_TYPE_CODE', role: 'flag' },
      { name: 'DATATYPE_CODE', role: 'flag' },
      { name: 'VIEW_APPLICATION_ID', role: 'fk' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_TRANSACTION_INT_CONTROLS', domain: 'SLA_EVENT_FAH_SETUP', x: 36, y: 452, w: 246, h: 48,
    shortDesc: 'FAH外部データ取込コントロール定義', pk: ['INTERFACE_CONTROL_ID'],
    cols: [
      { name: 'INTERFACE_CONTROL_ID', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'PROCESSING_GROUP_NAME', role: 'attr' },
      { name: 'HEADER_INTERFACE_TABLE_NAME', role: 'attr' },
      { name: 'LINE_INTERFACE_TABLE_NAME', role: 'attr' },
      { name: 'COMBINED_IMPORT_AND_LOAD_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_LEDGER_OPTIONS', domain: 'SLA_EVENT_FAH_SETUP', x: 296, y: 452, w: 246, h: 48,
    shortDesc: '元帳×サブ元帳別SLA/GL連携設定', pk: ['LEDGER_ID', 'APPLICATION_ID'],
    cols: [
      { name: 'LEDGER_ID', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'TRANSFER_TO_GL_MODE_CODE', role: 'flag' },
      { name: 'ACCT_REVERSAL_OPTION_CODE', role: 'flag' },
      { name: 'ROUNDING_RULE_CODE', role: 'flag' },
      { name: 'ENABLE_SUBMIT_POSTING_FLAG', role: 'flag' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },

  // === C. SLA_AMB_RULES (19 tables) ===
  {
    id: 'XLA_FORMULAS_B', domain: 'SLA_AMB_RULES', x: 36, y: 602, w: 246, h: 46,
    shortDesc: 'ユーザー定義算式ヘッダ', pk: ['APPLICATION_ID', 'FORMULA_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'FORMULA_CODE', role: 'pk' },
      { name: 'FORMULA_ID', role: 'num' },
      { name: 'DATATYPE_CODE', role: 'flag' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_FORMULA_DETAILS', domain: 'SLA_AMB_RULES', x: 296, y: 602, w: 246, h: 46,
    shortDesc: 'ユーザー定義算式詳細(式要素/Postfix)', pk: ['FORMULA_DETAIL_ID'],
    cols: [
      { name: 'FORMULA_DETAIL_ID', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'FORMULA_ID', role: 'fk' },
      { name: 'USER_SEQUENCE', role: 'num' },
      { name: 'EXPR_TYPE', role: 'flag' },
      { name: 'POSTFIX_EXPR', role: 'attr' }
    ]
  },
  {
    id: 'XLA_MAPPING_SETS_B', domain: 'SLA_AMB_RULES', x: 36, y: 660, w: 246, h: 46,
    shortDesc: 'マッピングセット定義ヘッダ', pk: ['MAPPING_SET_CODE'],
    cols: [
      { name: 'MAPPING_SET_CODE', role: 'pk' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'FLEXFIELD_ASSIGN_MODE_CODE', role: 'flag' },
      { name: 'FLEXFIELD_SEGMENT_CODE', role: 'attr' },
      { name: 'NUM_INPUTS', role: 'num' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_MAPPING_SET_VALUES', domain: 'SLA_AMB_RULES', x: 296, y: 660, w: 246, h: 46,
    shortDesc: 'マッピングセット変換値明細', pk: ['MAPPING_SET_VALUE_ID'],
    cols: [
      { name: 'MAPPING_SET_VALUE_ID', role: 'pk' },
      { name: 'MAPPING_SET_CODE', role: 'fk' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'INPUT_VALUE_CONSTANT1', role: 'attr' },
      { name: 'VALUE_CONSTANT', role: 'attr' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_SEG_RULES_B', domain: 'SLA_AMB_RULES', x: 36, y: 718, w: 246, h: 46,
    shortDesc: '勘定科目ルール(ADR)ヘッダ', pk: ['APPLICATION_ID', 'SEGMENT_RULE_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'SEGMENT_RULE_TYPE_CODE', role: 'flag' },
      { name: 'SEGMENT_RULE_CODE', role: 'pk' },
      { name: 'FLEXFIELD_ASSIGN_MODE_CODE', role: 'flag' },
      { name: 'FLEXFIELD_SEGMENT_CODE', role: 'attr' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_SEG_RULE_DETAILS', domain: 'SLA_AMB_RULES', x: 296, y: 718, w: 246, h: 46,
    shortDesc: '勘定科目ルール(ADR)優先順・値決定明細', pk: ['SEGMENT_RULE_DETAIL_ID'],
    cols: [
      { name: 'SEGMENT_RULE_DETAIL_ID', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'SEGMENT_RULE_CODE', role: 'fk' },
      { name: 'USER_SEQUENCE', role: 'num' },
      { name: 'VALUE_TYPE_CODE', role: 'flag' },
      { name: 'VALUE_MAPPING_SET_CODE', role: 'fk' },
      { name: 'VALUE_SOURCE_CODE', role: 'fk' },
      { name: 'VALUE_CONSTANT', role: 'attr' }
    ]
  },
  {
    id: 'XLA_CONDITIONS', domain: 'SLA_AMB_RULES', x: 36, y: 776, w: 246, h: 46,
    shortDesc: 'ルール適用条件式(ADR/摘要共通)', pk: ['CONDITION_ID'],
    cols: [
      { name: 'CONDITION_ID', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'SEGMENT_RULE_DETAIL_ID', role: 'fk' },
      { name: 'DESCRIPTION_DETAIL_ID', role: 'fk' },
      { name: 'USER_SEQUENCE', role: 'num' },
      { name: 'SOURCE_CODE', role: 'fk' },
      { name: 'LINE_OPERATOR_CODE', role: 'flag' },
      { name: 'VALUE_TYPE_CODE', role: 'flag' },
      { name: 'VALUE_CONSTANT', role: 'attr' }
    ]
  },
  {
    id: 'XLA_DESCRIPTIONS_B', domain: 'SLA_AMB_RULES', x: 296, y: 776, w: 246, h: 46,
    shortDesc: '仕訳摘要ルール定義', pk: ['APPLICATION_ID', 'DESCRIPTION_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'DESCRIPTION_TYPE_CODE', role: 'flag' },
      { name: 'DESCRIPTION_CODE', role: 'pk' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_ACCT_LINE_TYPES_B', domain: 'SLA_AMB_RULES', x: 36, y: 834, w: 246, h: 46,
    shortDesc: '仕訳明細ルール(JLT)ヘッダ', pk: ['APPLICATION_ID', 'EVENT_CLASS_CODE', 'ACCOUNTING_LINE_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_CLASS_CODE', role: 'pk' },
      { name: 'ACCOUNTING_LINE_TYPE_CODE', role: 'flag' },
      { name: 'ACCOUNTING_LINE_CODE', role: 'pk' },
      { name: 'ACCOUNTING_CLASS_CODE', role: 'flag' },
      { name: 'NATURAL_SIDE_CODE', role: 'flag' },
      { name: 'ACCOUNTING_ENTRY_TYPE_CODE', role: 'flag' },
      { name: 'MERGE_DUPLICATE_CODE', role: 'flag' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_JLT_ACCT_ATTRS', domain: 'SLA_AMB_RULES', x: 296, y: 834, w: 246, h: 46,
    shortDesc: 'JLT会計属性←ソース/算式割当', pk: ['APPLICATION_ID', 'EVENT_CLASS_CODE', 'ACCOUNTING_LINE_CODE', 'ACCOUNTING_ATTRIBUTE_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_CLASS_CODE', role: 'pk' },
      { name: 'ACCOUNTING_LINE_CODE', role: 'pk' },
      { name: 'ACCOUNTING_ATTRIBUTE_CODE', role: 'pk' },
      { name: 'SOURCE_ORIGIN_CODE', role: 'flag' },
      { name: 'SOURCE_CODE', role: 'fk' }
    ]
  },
  {
    id: 'XLA_ANALYTICAL_HDRS_B', domain: 'SLA_AMB_RULES', x: 36, y: 892, w: 246, h: 46,
    shortDesc: 'サポート参照ヘッダ(残高有Y/残高無N)', pk: ['ANALYTICAL_CRITERION_CODE'],
    cols: [
      { name: 'ANALYTICAL_CRITERION_CODE', role: 'pk' },
      { name: 'ANALYTICAL_CRITERION_TYPE_CODE', role: 'flag' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'BALANCING_FLAG', role: 'flag' },
      { name: 'YEAR_END_CARRY_FORWARD_CODE', role: 'flag' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_ANALYTICAL_DTLS_B', domain: 'SLA_AMB_RULES', x: 296, y: 892, w: 246, h: 46,
    shortDesc: 'サポート参照詳細属性(AC1..AC5定義)', pk: ['ANALYTICAL_CRITERION_CODE', 'ANALYTICAL_DETAIL_CODE'],
    cols: [
      { name: 'ANALYTICAL_CRITERION_CODE', role: 'pk' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'ANALYTICAL_DETAIL_CODE', role: 'pk' },
      { name: 'DATA_TYPE_CODE', role: 'flag' },
      { name: 'GROUPING_ORDER', role: 'num' }
    ]
  },
  {
    id: 'XLA_ANALYTICAL_SOURCES', domain: 'SLA_AMB_RULES', x: 36, y: 950, w: 246, h: 46,
    shortDesc: 'サポート参照×5サブ元帳ソースマッピング', pk: ['APPLICATION_ID', 'ANALYTICAL_CRITERION_CODE', 'ANALYTICAL_DETAIL_CODE', 'EVENT_CLASS_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'ANALYTICAL_CRITERION_CODE', role: 'pk' },
      { name: 'ANALYTICAL_DETAIL_CODE', role: 'pk' },
      { name: 'EVENT_CLASS_CODE', role: 'pk' },
      { name: 'SOURCE_APPLICATION_ID', role: 'fk' },
      { name: 'SOURCE_CODE', role: 'fk' }
    ]
  },
  {
    id: 'XLA_LINE_DEFINITIONS_B', domain: 'SLA_AMB_RULES', x: 296, y: 950, w: 246, h: 46,
    shortDesc: '仕訳入力ルールセット(JERS)ヘッダ', pk: ['APPLICATION_ID', 'LINE_DEFINITION_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_CLASS_CODE', role: 'fk' },
      { name: 'EVENT_TYPE_CODE', role: 'fk' },
      { name: 'LINE_DEFINITION_OWNER_CODE', role: 'flag' },
      { name: 'LINE_DEFINITION_CODE', role: 'pk' },
      { name: 'VALIDATION_STATUS_CODE', role: 'flag' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_LINE_DEFN_JLT_ASSGNS', domain: 'SLA_AMB_RULES', x: 36, y: 1008, w: 246, h: 46,
    shortDesc: 'JERSへのJLT・摘要割当', pk: ['APPLICATION_ID', 'LINE_DEFINITION_CODE', 'ACCOUNTING_LINE_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_CLASS_CODE', role: 'fk' },
      { name: 'EVENT_TYPE_CODE', role: 'fk' },
      { name: 'LINE_DEFINITION_CODE', role: 'pk' },
      { name: 'ACCOUNTING_LINE_CODE', role: 'pk' },
      { name: 'DESCRIPTION_CODE', role: 'fk' },
      { name: 'INHERIT_DESC_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_LINE_DEFN_ADR_ASSGNS', domain: 'SLA_AMB_RULES', x: 296, y: 1008, w: 246, h: 46,
    shortDesc: 'JERSへのAFF勘定科目ルール割当', pk: ['APPLICATION_ID', 'LINE_DEFINITION_CODE', 'ACCOUNTING_LINE_CODE', 'FLEXFIELD_SEGMENT_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_CLASS_CODE', role: 'fk' },
      { name: 'LINE_DEFINITION_CODE', role: 'pk' },
      { name: 'ACCOUNTING_LINE_CODE', role: 'pk' },
      { name: 'FLEXFIELD_SEGMENT_CODE', role: 'pk' },
      { name: 'SEGMENT_RULE_TYPE_CODE', role: 'flag' },
      { name: 'SEGMENT_RULE_CODE', role: 'fk' }
    ]
  },
  {
    id: 'XLA_LINE_DEFN_AC_ASSGNS', domain: 'SLA_AMB_RULES', x: 36, y: 1066, w: 246, h: 46,
    shortDesc: 'JERSへのサポート参照割当', pk: ['APPLICATION_ID', 'LINE_DEFINITION_CODE', 'ACCOUNTING_LINE_CODE', 'ANALYTICAL_CRITERION_CODE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_CLASS_CODE', role: 'fk' },
      { name: 'LINE_DEFINITION_CODE', role: 'pk' },
      { name: 'ACCOUNTING_LINE_CODE', role: 'pk' },
      { name: 'ANALYTICAL_CRITERION_CODE', role: 'pk' },
      { name: 'ANALYTICAL_CRITERION_TYPE_CODE', role: 'flag' }
    ]
  },
  {
    id: 'XLA_ACCTG_METHODS_B', domain: 'SLA_AMB_RULES', x: 296, y: 1066, w: 246, h: 46,
    shortDesc: '会計方式(Accounting Method)ヘッダ', pk: ['ACCOUNTING_METHOD_CODE'],
    cols: [
      { name: 'ACCOUNTING_METHOD_TYPE_CODE', role: 'flag' },
      { name: 'ACCOUNTING_METHOD_CODE', role: 'pk' },
      { name: 'TRANSACTION_COA_ID', role: 'fk' },
      { name: 'ACCOUNTING_COA_ID', role: 'fk' },
      { name: 'ENABLED_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'XLA_ACCTG_METHOD_RULES', domain: 'SLA_AMB_RULES', x: 36, y: 1124, w: 246, h: 46,
    shortDesc: '会計方式×各サブ元帳JERS統合割当', pk: ['ACCTG_METHOD_RULE_ID'],
    cols: [
      { name: 'ACCTG_METHOD_RULE_ID', role: 'pk' },
      { name: 'ACCOUNTING_METHOD_CODE', role: 'fk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'PRODUCT_RULE_TYPE_CODE', role: 'flag' },
      { name: 'PRODUCT_RULE_CODE', role: 'fk' },
      { name: 'START_DATE_ACTIVE', role: 'date' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' }
    ]
  },

  // === D. SUBLEDGER_TXNS (15 tables: AP:2, AR:3, FA:3, LA:3, FAH:4) ===
  // AP (Row 0, y=68)
  {
    id: 'AP_INVOICES_ALL', domain: 'SUBLEDGER_TXNS', x: 608, y: 68, w: 288, h: 50,
    shortDesc: '[AP 200] 買掛請求書ヘッダ (DFF ATTRIBUTE列保有)', pk: ['INVOICE_ID'],
    cols: [
      { name: 'INVOICE_ID', role: 'pk' },
      { name: 'INVOICE_NUM', role: 'attr' },
      { name: 'VENDOR_ID', role: 'fk' },
      { name: 'INVOICE_AMOUNT', role: 'amt' },
      { name: 'INVOICE_DATE', role: 'date' },
      { name: 'ORG_ID', role: 'fk' },
      { name: 'SET_OF_BOOKS_ID', role: 'fk' },
      { name: 'ATTRIBUTE_CATEGORY', role: 'attr' },
      { name: 'ATTRIBUTE1', role: 'attr' },
      { name: 'ATTRIBUTE2', role: 'attr' }
    ]
  },
  {
    id: 'AP_INVOICE_DISTRIBUTIONS_ALL', domain: 'SUBLEDGER_TXNS', x: 912, y: 68, w: 288, h: 50,
    shortDesc: '[AP 200] 買掛請求書配賦明細 (数量・単価・税保有)', pk: ['INVOICE_DISTRIBUTION_ID'],
    cols: [
      { name: 'INVOICE_DISTRIBUTION_ID', role: 'pk' },
      { name: 'INVOICE_ID', role: 'fk' },
      { name: 'DISTRIBUTION_LINE_NUMBER', role: 'num' },
      { name: 'LINE_TYPE_LOOKUP_CODE', role: 'flag' },
      { name: 'AMOUNT', role: 'amt' },
      { name: 'DIST_CODE_COMBINATION_ID', role: 'fk' },
      { name: 'QUANTITY_INVOICED', role: 'num' },
      { name: 'UNIT_PRICE', role: 'num' },
      { name: 'ACCOUNTING_EVENT_ID', role: 'fk' },
      { name: 'POSTED_FLAG', role: 'flag' }
    ]
  },
  // AR (Row 1, y=156)
  {
    id: 'RA_CUSTOMER_TRX_ALL', domain: 'SUBLEDGER_TXNS', x: 608, y: 156, w: 190, h: 50,
    shortDesc: '[AR 222] 売掛請求書ヘッダ', pk: ['CUSTOMER_TRX_ID'],
    cols: [
      { name: 'CUSTOMER_TRX_ID', role: 'pk' },
      { name: 'TRX_NUMBER', role: 'attr' },
      { name: 'TRX_DATE', role: 'date' },
      { name: 'BILL_TO_CUSTOMER_ID', role: 'fk' },
      { name: 'ORG_ID', role: 'fk' },
      { name: 'SET_OF_BOOKS_ID', role: 'fk' },
      { name: 'COMPLETE_FLAG', role: 'flag' },
      { name: 'ATTRIBUTE_CATEGORY', role: 'attr' },
      { name: 'ATTRIBUTE1', role: 'attr' }
    ]
  },
  {
    id: 'RA_CUSTOMER_TRX_LINES_ALL', domain: 'SUBLEDGER_TXNS', x: 810, y: 156, w: 190, h: 50,
    shortDesc: '[AR 222] 売掛請求書明細 (数量・販売単価)', pk: ['CUSTOMER_TRX_LINE_ID'],
    cols: [
      { name: 'CUSTOMER_TRX_LINE_ID', role: 'pk' },
      { name: 'CUSTOMER_TRX_ID', role: 'fk' },
      { name: 'LINE_NUMBER', role: 'num' },
      { name: 'LINE_TYPE', role: 'flag' },
      { name: 'DESCRIPTION', role: 'attr' },
      { name: 'QUANTITY_INVOICED', role: 'num' },
      { name: 'UNIT_SELLING_PRICE', role: 'num' },
      { name: 'EXTENDED_AMOUNT', role: 'amt' }
    ]
  },
  {
    id: 'RA_CUST_TRX_LINE_GL_DIST_ALL', domain: 'SUBLEDGER_TXNS', x: 1012, y: 156, w: 190, h: 50,
    shortDesc: '[AR 222] 売掛会計配賦表', pk: ['CUST_TRX_LINE_GL_DIST_ID'],
    cols: [
      { name: 'CUST_TRX_LINE_GL_DIST_ID', role: 'pk' },
      { name: 'CUSTOMER_TRX_ID', role: 'fk' },
      { name: 'CUSTOMER_TRX_LINE_ID', role: 'fk' },
      { name: 'ACCOUNT_CLASS', role: 'flag' },
      { name: 'AMOUNT', role: 'amt' },
      { name: 'CODE_COMBINATION_ID', role: 'fk' },
      { name: 'EVENT_ID', role: 'fk' },
      { name: 'ACCOUNT_SET_FLAG', role: 'flag' }
    ]
  },
  // FA (Row 2, y=244)
  {
    id: 'FA_ADDITIONS_B', domain: 'SUBLEDGER_TXNS', x: 608, y: 244, w: 190, h: 50,
    shortDesc: '[FA 140] 固定資産台帳ヘッダ', pk: ['ASSET_ID'],
    cols: [
      { name: 'ASSET_ID', role: 'pk' },
      { name: 'ASSET_NUMBER', role: 'attr' },
      { name: 'ASSET_CATEGORY_ID', role: 'fk' },
      { name: 'ATTRIBUTE_CATEGORY_CODE', role: 'attr' },
      { name: 'CURRENT_UNITS', role: 'num' }
    ]
  },
  {
    id: 'FA_TRANSACTION_HEADERS', domain: 'SUBLEDGER_TXNS', x: 810, y: 244, w: 190, h: 50,
    shortDesc: '[FA 140] 資産取引イベント履歴', pk: ['TRANSACTION_HEADER_ID'],
    cols: [
      { name: 'TRANSACTION_HEADER_ID', role: 'pk' },
      { name: 'ASSET_ID', role: 'fk' },
      { name: 'BOOK_TYPE_CODE', role: 'attr' },
      { name: 'TRANSACTION_TYPE_CODE', role: 'flag' },
      { name: 'TRANSACTION_DATE_ENTERED', role: 'date' },
      { name: 'EVENT_ID', role: 'fk' }
    ]
  },
  {
    id: 'FA_DEPRN_DETAIL', domain: 'SUBLEDGER_TXNS', x: 1012, y: 244, w: 190, h: 50,
    shortDesc: '[FA 140] 減価償却詳細配賦', pk: ['BOOK_TYPE_CODE', 'ASSET_ID', 'DISTRIBUTION_ID', 'PERIOD_COUNTER'],
    cols: [
      { name: 'BOOK_TYPE_CODE', role: 'pk' },
      { name: 'ASSET_ID', role: 'pk' },
      { name: 'DISTRIBUTION_ID', role: 'pk' },
      { name: 'PERIOD_COUNTER', role: 'pk' },
      { name: 'DEPRN_RUN_DATE', role: 'date' },
      { name: 'DEPRN_AMOUNT', role: 'amt' },
      { name: 'DEPRN_RESERVE', role: 'amt' },
      { name: 'DEPRN_EXPENSE_CCID', role: 'fk' },
      { name: 'EVENT_ID', role: 'fk' }
    ]
  },
  // LA (Row 3, y=332)
  {
    id: 'FLA_LEASES_ALL', domain: 'SUBLEDGER_TXNS', x: 608, y: 332, w: 190, h: 50,
    shortDesc: '[LA 10522] リース契約マスタ', pk: ['LEASE_ID'],
    cols: [
      { name: 'LEASE_ID', role: 'pk' },
      { name: 'LEASE_NUMBER', role: 'attr' },
      { name: 'LEASE_NAME', role: 'attr' },
      { name: 'ORG_ID', role: 'fk' },
      { name: 'LEASE_ASSET_TYPE_CODE', role: 'flag' },
      { name: 'LEASE_STATUS_CODE', role: 'flag' },
      { name: 'LESSOR_PARTY_ID', role: 'fk' }
    ]
  },
  {
    id: 'FLA_ACCOUNTING_HEADERS_ALL', domain: 'SUBLEDGER_TXNS', x: 810, y: 332, w: 190, h: 50,
    shortDesc: '[LA 10522] リース会計イベントヘッダ', pk: ['TRANSACTION_ID'],
    cols: [
      { name: 'TRANSACTION_ID', role: 'pk' },
      { name: 'LEASE_ID', role: 'fk' },
      { name: 'LEDGER_ID', role: 'fk' },
      { name: 'EVENT_ID', role: 'fk' },
      { name: 'ACCOUNTING_DATE', role: 'date' },
      { name: 'EVENT_TYPE_CODE', role: 'attr' },
      { name: 'ACCOUNTED_IN_GL_FLAG', role: 'flag' }
    ]
  },
  {
    id: 'FLA_ACCOUNTING_LINES', domain: 'SUBLEDGER_TXNS', x: 1012, y: 332, w: 190, h: 50,
    shortDesc: '[LA 10522] 使用権資産・負債会計明細', pk: ['TRANSACTION_LINE_ID'],
    cols: [
      { name: 'TRANSACTION_LINE_ID', role: 'pk' },
      { name: 'TRANSACTION_ID', role: 'fk' },
      { name: 'SCHEDULE_TYPE_CODE', role: 'flag' },
      { name: 'DR_CODE_COMBINATION_ID', role: 'fk' },
      { name: 'CR_CODE_COMBINATION_ID', role: 'fk' },
      { name: 'ENTERED_AMOUNT', role: 'amt' },
      { name: 'ACCOUNTED_AMOUNT', role: 'amt' }
    ]
  },
  // FAH Interface & Base (Row 4 & 5: y=428 & y=516)
  {
    id: 'XLA_TRANSACTION_HEADERS_INT', domain: 'SUBLEDGER_TXNS', x: 608, y: 428, w: 288, h: 50,
    shortDesc: '[FAH 20001] 外部取引ヘッダ・インタフェース表', pk: ['APPLICATION_ID', 'TRANSACTION_NUMBER'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'APPLICATION_SHORT_NAME', role: 'attr' },
      { name: 'TRANSACTION_NUMBER', role: 'pk' },
      { name: 'EVENT_TYPE_CODE', role: 'attr' },
      { name: 'LEDGER_NAME', role: 'attr' },
      { name: 'TRANSACTION_DATE', role: 'date' },
      { name: 'PROCESSING_GROUP_NAME', role: 'attr' },
      { name: 'STATUS_CODE', role: 'flag' },
      { name: 'CHAR1', role: 'attr' },
      { name: 'CHAR2', role: 'attr' },
      { name: 'DATE1', role: 'date' }
    ]
  },
  {
    id: 'XLA_TRANSACTION_LINES_INT', domain: 'SUBLEDGER_TXNS', x: 912, y: 428, w: 288, h: 50,
    shortDesc: '[FAH 20001] 外部取引明細・インタフェース表', pk: ['APPLICATION_ID', 'TRANSACTION_NUMBER', 'LINE_NUMBER'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'TRANSACTION_NUMBER', role: 'pk' },
      { name: 'LINE_NUMBER', role: 'pk' },
      { name: 'CHAR1', role: 'attr' },
      { name: 'CHAR2', role: 'attr' },
      { name: 'NUMBER1', role: 'num' },
      { name: 'NUMBER2', role: 'num' },
      { name: 'NUMBER3', role: 'amt' },
      { name: 'DATE1', role: 'date' },
      { name: 'STATUS_CODE', role: 'flag' }
    ]
  },
  {
    id: 'XLA_TRANSACTION_HEADERS', domain: 'SUBLEDGER_TXNS', x: 608, y: 516, w: 288, h: 50,
    shortDesc: '[FAH 20001] FAH取引ヘッダベース表 (Source実体)', pk: ['APPLICATION_ID', 'EVENT_ID', 'TRANSACTION_NUMBER', 'LEDGER_ID'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_ID', role: 'pk' },
      { name: 'TRANSACTION_NUMBER', role: 'pk' },
      { name: 'LEDGER_ID', role: 'pk' },
      { name: 'TRANSACTION_DATE', role: 'date' },
      { name: 'LEGAL_ENTITY_ID', role: 'fk' },
      { name: 'CHAR1', role: 'attr' },
      { name: 'CHAR2', role: 'attr' },
      { name: 'DATE1', role: 'date' }
    ]
  },
  {
    id: 'XLA_TRANSACTION_LINES', domain: 'SUBLEDGER_TXNS', x: 912, y: 516, w: 288, h: 50,
    shortDesc: '[FAH 20001] FAH取引明細ベース表 (数量・単価源)', pk: ['APPLICATION_ID', 'EVENT_ID', 'LINE_NUMBER', 'TRANSACTION_DATE'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_ID', role: 'pk' },
      { name: 'LINE_NUMBER', role: 'pk' },
      { name: 'TRANSACTION_DATE', role: 'pk' },
      { name: 'CHAR1', role: 'attr' },
      { name: 'CHAR2', role: 'attr' },
      { name: 'NUMBER1', role: 'num' },
      { name: 'NUMBER2', role: 'num' },
      { name: 'NUMBER3', role: 'amt' },
      { name: 'DATE1', role: 'date' }
    ]
  },

  // === E. SLA_ENGINE_OUTPUT (7 tables) ===
  {
    id: 'XLA_TRANSACTION_ENTITIES', domain: 'SLA_ENGINE_OUTPUT', x: 616, y: 690, w: 276, h: 54,
    shortDesc: '全サブ元帳取引エンティティ管理', pk: ['ENTITY_ID'],
    cols: [
      { name: 'ENTITY_ID', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'LEDGER_ID', role: 'fk' },
      { name: 'ENTITY_CODE', role: 'attr' },
      { name: 'SOURCE_ID_INT_1', role: 'fk' },
      { name: 'TRANSACTION_NUMBER', role: 'attr' }
    ]
  },
  {
    id: 'XLA_EVENTS', domain: 'SLA_ENGINE_OUTPUT', x: 918, y: 690, w: 276, h: 54,
    shortDesc: '会計イベント (U:未計上 → P:処理済)', pk: ['EVENT_ID'],
    cols: [
      { name: 'EVENT_ID', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'ENTITY_ID', role: 'fk' },
      { name: 'EVENT_TYPE_CODE', role: 'fk' },
      { name: 'EVENT_DATE', role: 'date' },
      { name: 'EVENT_STATUS_CODE', role: 'flag' },
      { name: 'PROCESS_STATUS_CODE', role: 'flag' }
    ]
  },
  {
    id: 'XLA_AE_HEADERS', domain: 'SLA_ENGINE_OUTPUT', x: 616, y: 800, w: 276, h: 54,
    shortDesc: 'SLA仕訳ヘッダ (GL転送状態管理)', pk: ['AE_HEADER_ID'],
    cols: [
      { name: 'AE_HEADER_ID', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'LEDGER_ID', role: 'fk' },
      { name: 'ENTITY_ID', role: 'fk' },
      { name: 'EVENT_ID', role: 'fk' },
      { name: 'EVENT_TYPE_CODE', role: 'fk' },
      { name: 'ACCOUNTING_DATE', role: 'date' },
      { name: 'GL_TRANSFER_STATUS_CODE', role: 'flag' },
      { name: 'JE_CATEGORY_NAME', role: 'attr' },
      { name: 'PERIOD_NAME', role: 'attr' },
      { name: 'ACCOUNTING_ENTRY_STATUS_CODE', role: 'flag' },
      { name: 'BALANCE_TYPE_CODE', role: 'flag' }
    ]
  },
  {
    id: 'XLA_AE_LINES', domain: 'SLA_ENGINE_OUTPUT', x: 918, y: 800, w: 276, h: 54,
    shortDesc: 'SLA仕訳明細 (12行・算式/ADR計算結果)', pk: ['AE_HEADER_ID', 'AE_LINE_NUM'],
    cols: [
      { name: 'AE_HEADER_ID', role: 'pk' },
      { name: 'AE_LINE_NUM', role: 'pk' },
      { name: 'APPLICATION_ID', role: 'fk' },
      { name: 'CODE_COMBINATION_ID', role: 'fk' },
      { name: 'ACCOUNTING_CLASS_CODE', role: 'flag' },
      { name: 'ENTERED_DR', role: 'amt' },
      { name: 'ENTERED_CR', role: 'amt' },
      { name: 'ACCOUNTED_DR', role: 'amt' },
      { name: 'ACCOUNTED_CR', role: 'amt' },
      { name: 'CURRENCY_CODE', role: 'attr' },
      { name: 'DESCRIPTION', role: 'attr' },
      { name: 'GL_SL_LINK_ID', role: 'fk' },
      { name: 'GL_SL_LINK_TABLE', role: 'attr' }
    ]
  },
  {
    id: 'XLA_DISTRIBUTION_LINKS', domain: 'SLA_ENGINE_OUTPUT', x: 616, y: 910, w: 276, h: 54,
    shortDesc: 'トランザクション明細⇔SLA仕訳紐付リンク', pk: ['APPLICATION_ID', 'AE_HEADER_ID', 'AE_LINE_NUM', 'SOURCE_DISTRIBUTION_ID_NUM_1'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'EVENT_ID', role: 'fk' },
      { name: 'AE_HEADER_ID', role: 'pk' },
      { name: 'AE_LINE_NUM', role: 'pk' },
      { name: 'SOURCE_DISTRIBUTION_TYPE', role: 'attr' },
      { name: 'SOURCE_DISTRIBUTION_ID_NUM_1', role: 'pk' },
      { name: 'UNROUNDED_ENTERED_DR', role: 'amt' },
      { name: 'UNROUNDED_ENTERED_CR', role: 'amt' },
      { name: 'ALLOC_TO_APPLICATION_ID', role: 'fk' }
    ]
  },
  {
    id: 'XLA_AE_LINE_ACS', domain: 'SLA_ENGINE_OUTPUT', x: 918, y: 910, w: 276, h: 54,
    shortDesc: '仕訳明細サポート参照値 (AC1..AC5)', pk: ['AE_HEADER_ID', 'AE_LINE_NUM', 'ANALYTICAL_CRITERION_CODE'],
    cols: [
      { name: 'AE_HEADER_ID', role: 'pk' },
      { name: 'AE_LINE_NUM', role: 'pk' },
      { name: 'ANALYTICAL_CRITERION_CODE', role: 'pk' },
      { name: 'ANALYTICAL_CRITERION_TYPE_CODE', role: 'flag' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'AC1', role: 'attr' },
      { name: 'AC2', role: 'attr' },
      { name: 'AC3', role: 'attr' },
      { name: 'AC4', role: 'attr' },
      { name: 'AC5', role: 'attr' }
    ]
  },
  {
    id: 'XLA_AC_BALANCES', domain: 'SLA_ENGINE_OUTPUT', x: 760, y: 1040, w: 300, h: 56,
    shortDesc: '残高有サポート参照残高 (SR_COUNTERPARTYのみ集計)', pk: ['APPLICATION_ID', 'LEDGER_ID', 'CODE_COMBINATION_ID', 'ANALYTICAL_CRITERION_CODE', 'AC1', 'PERIOD_NAME'],
    cols: [
      { name: 'APPLICATION_ID', role: 'pk' },
      { name: 'LEDGER_ID', role: 'pk' },
      { name: 'CODE_COMBINATION_ID', role: 'pk' },
      { name: 'ANALYTICAL_CRITERION_CODE', role: 'pk' },
      { name: 'ANALYTICAL_CRITERION_TYPE_CODE', role: 'flag' },
      { name: 'AMB_CONTEXT_CODE', role: 'attr' },
      { name: 'AC1', role: 'pk' },
      { name: 'PERIOD_NAME', role: 'pk' },
      { name: 'CURRENCY_CODE', role: 'attr' },
      { name: 'BEGINNING_BALANCE_DR', role: 'amt' },
      { name: 'BEGINNING_BALANCE_CR', role: 'amt' },
      { name: 'PERIOD_BALANCE_DR', role: 'amt' },
      { name: 'PERIOD_BALANCE_CR', role: 'amt' }
    ]
  },

  // === F. GL_LEDGER (6 tables) ===
  {
    id: 'GL_INTERFACE', domain: 'GL_LEDGER', x: 1280, y: 420, w: 330, h: 62,
    shortDesc: 'SLA→GL 転送インタフェース表', pk: ['GROUP_ID', 'GL_SL_LINK_ID'],
    cols: [
      { name: 'STATUS', role: 'flag' },
      { name: 'LEDGER_ID', role: 'fk' },
      { name: 'ACCOUNTING_DATE', role: 'date' },
      { name: 'CURRENCY_CODE', role: 'attr' },
      { name: 'USER_JE_SOURCE_NAME', role: 'attr' },
      { name: 'USER_JE_CATEGORY_NAME', role: 'attr' },
      { name: 'CODE_COMBINATION_ID', role: 'fk' },
      { name: 'ENTERED_DR', role: 'amt' },
      { name: 'ENTERED_CR', role: 'amt' },
      { name: 'ACCOUNTED_DR', role: 'amt' },
      { name: 'ACCOUNTED_CR', role: 'amt' },
      { name: 'GL_SL_LINK_ID', role: 'pk' },
      { name: 'GL_SL_LINK_TABLE', role: 'attr' },
      { name: 'GROUP_ID', role: 'pk' }
    ]
  },
  {
    id: 'GL_JE_BATCHES', domain: 'GL_LEDGER', x: 1280, y: 540, w: 330, h: 62,
    shortDesc: 'GL 仕訳バッチ (U:未転記 → P:転記済)', pk: ['JE_BATCH_ID'],
    cols: [
      { name: 'JE_BATCH_ID', role: 'pk' },
      { name: 'NAME', role: 'attr' },
      { name: 'STATUS', role: 'flag' },
      { name: 'POSTED_DATE', role: 'date' },
      { name: 'DEFAULT_PERIOD_NAME', role: 'attr' },
      { name: 'RUNNING_TOTAL_ACCOUNTED_DR', role: 'amt' },
      { name: 'RUNNING_TOTAL_ACCOUNTED_CR', role: 'amt' }
    ]
  },
  {
    id: 'GL_JE_HEADERS', domain: 'GL_LEDGER', x: 1280, y: 660, w: 330, h: 62,
    shortDesc: 'GL 仕訳ヘッダ (5サブ元帳別ヘッダ)', pk: ['JE_HEADER_ID'],
    cols: [
      { name: 'JE_HEADER_ID', role: 'pk' },
      { name: 'JE_BATCH_ID', role: 'fk' },
      { name: 'LEDGER_ID', role: 'fk' },
      { name: 'JE_SOURCE', role: 'attr' },
      { name: 'JE_CATEGORY', role: 'attr' },
      { name: 'NAME', role: 'attr' },
      { name: 'PERIOD_NAME', role: 'attr' },
      { name: 'STATUS', role: 'flag' },
      { name: 'POSTED_DATE', role: 'date' },
      { name: 'RUNNING_TOTAL_DR', role: 'amt' },
      { name: 'RUNNING_TOTAL_CR', role: 'amt' }
    ]
  },
  {
    id: 'GL_JE_LINES', domain: 'GL_LEDGER', x: 1280, y: 780, w: 330, h: 62,
    shortDesc: 'GL 仕訳明細 (12行・GL_SL_LINK_ID接続)', pk: ['JE_HEADER_ID', 'JE_LINE_NUM'],
    cols: [
      { name: 'JE_HEADER_ID', role: 'pk' },
      { name: 'JE_LINE_NUM', role: 'pk' },
      { name: 'LEDGER_ID', role: 'fk' },
      { name: 'CODE_COMBINATION_ID', role: 'fk' },
      { name: 'PERIOD_NAME', role: 'attr' },
      { name: 'STATUS', role: 'flag' },
      { name: 'ENTERED_DR', role: 'amt' },
      { name: 'ENTERED_CR', role: 'amt' },
      { name: 'ACCOUNTED_DR', role: 'amt' },
      { name: 'ACCOUNTED_CR', role: 'amt' },
      { name: 'GL_SL_LINK_ID', role: 'fk' },
      { name: 'GL_SL_LINK_TABLE', role: 'attr' }
    ]
  },
  {
    id: 'GL_IMPORT_REFERENCES', domain: 'GL_LEDGER', x: 1280, y: 900, w: 330, h: 62,
    shortDesc: 'GL⇔SLA 相互参照リンク表', pk: ['JE_HEADER_ID', 'JE_LINE_NUM', 'GL_SL_LINK_ID'],
    cols: [
      { name: 'JE_BATCH_ID', role: 'fk' },
      { name: 'JE_HEADER_ID', role: 'pk' },
      { name: 'JE_LINE_NUM', role: 'pk' },
      { name: 'SUBLEDGER_DOC_SEQUENCE_VALUE', role: 'num' },
      { name: 'GL_SL_LINK_ID', role: 'pk' },
      { name: 'GL_SL_LINK_TABLE', role: 'attr' }
    ]
  },
  {
    id: 'GL_BALANCES', domain: 'GL_LEDGER', x: 1280, y: 1020, w: 330, h: 62,
    shortDesc: '一般会計 確定勘定残高 (4,250,000円)', pk: ['LEDGER_ID', 'CODE_COMBINATION_ID', 'CURRENCY_CODE', 'PERIOD_NAME'],
    cols: [
      { name: 'LEDGER_ID', role: 'pk' },
      { name: 'CODE_COMBINATION_ID', role: 'pk' },
      { name: 'CURRENCY_CODE', role: 'pk' },
      { name: 'PERIOD_NAME', role: 'pk' },
      { name: 'ACTUAL_FLAG', role: 'flag' },
      { name: 'BEGIN_BALANCE_DR', role: 'amt' },
      { name: 'BEGIN_BALANCE_CR', role: 'amt' },
      { name: 'PERIOD_NET_DR', role: 'amt' },
      { name: 'PERIOD_NET_CR', role: 'amt' }
    ]
  }
];

// 全68リレーション定義 (ER検証済み外部キー関係)
const RELATIONS = [
  // A: Org & GL Master
  { from: 'XLE_ENTITY_PROFILES', to: 'GL_LEDGERS', key: 'LEGAL_ENTITY_ID' },
  { from: 'FND_ID_FLEX_SEGMENTS', to: 'GL_LEDGERS', key: 'CHART_OF_ACCOUNTS_ID' },
  { from: 'FND_ID_FLEX_SEGMENTS', to: 'GL_CODE_COMBINATIONS', key: 'CHART_OF_ACCOUNTS_ID' },
  { from: 'GL_LEDGERS', to: 'GL_PERIOD_STATUSES', key: 'LEDGER_ID' },
  { from: 'GL_LEDGERS', to: 'XLA_ACCTG_METHODS_B', key: 'SLA_ACCOUNTING_METHOD_CODE' },
  // B: Event & FAH Setup
  { from: 'XLA_SUBLEDGERS', to: 'XLA_EVENT_CLASSES_B', key: 'APPLICATION_ID' },
  { from: 'XLA_EVENT_CLASSES_B', to: 'XLA_EVENT_TYPES_B', key: 'EVENT_CLASS_CODE' },
  { from: 'XLA_SUBLEDGERS', to: 'XLA_SOURCES_B', key: 'APPLICATION_ID' },
  { from: 'XLA_SUBLEDGERS', to: 'XLA_TRANSACTION_INT_CONTROLS', key: 'APPLICATION_ID' },
  { from: 'XLA_SUBLEDGERS', to: 'XLA_LEDGER_OPTIONS', key: 'APPLICATION_ID' },
  { from: 'GL_LEDGERS', to: 'XLA_LEDGER_OPTIONS', key: 'LEDGER_ID' },
  // C: AMB Setup Rules
  { from: 'XLA_FORMULAS_B', to: 'XLA_FORMULA_DETAILS', key: 'FORMULA_ID' },
  { from: 'XLA_SOURCES_B', to: 'XLA_FORMULA_DETAILS', key: 'POSTFIX_EXPR' },
  { from: 'XLA_MAPPING_SETS_B', to: 'XLA_MAPPING_SET_VALUES', key: 'MAPPING_SET_CODE' },
  { from: 'XLA_SEG_RULES_B', to: 'XLA_SEG_RULE_DETAILS', key: 'SEGMENT_RULE_CODE' },
  { from: 'XLA_MAPPING_SETS_B', to: 'XLA_SEG_RULE_DETAILS', key: 'VALUE_MAPPING_SET_CODE' },
  { from: 'XLA_SEG_RULE_DETAILS', to: 'XLA_CONDITIONS', key: 'SEGMENT_RULE_DETAIL_ID' },
  { from: 'XLA_SOURCES_B', to: 'XLA_CONDITIONS', key: 'SOURCE_CODE' },
  { from: 'XLA_ACCT_LINE_TYPES_B', to: 'XLA_JLT_ACCT_ATTRS', key: 'ACCOUNTING_LINE_CODE' },
  { from: 'XLA_FORMULAS_B', to: 'XLA_JLT_ACCT_ATTRS', key: 'FORMULA_CODE' },
  { from: 'XLA_ANALYTICAL_HDRS_B', to: 'XLA_ANALYTICAL_DTLS_B', key: 'ANALYTICAL_CRITERION_CODE' },
  { from: 'XLA_ANALYTICAL_DTLS_B', to: 'XLA_ANALYTICAL_SOURCES', key: 'ANALYTICAL_DETAIL_CODE' },
  { from: 'XLA_SOURCES_B', to: 'XLA_ANALYTICAL_SOURCES', key: 'SOURCE_CODE' },
  { from: 'XLA_EVENT_TYPES_B', to: 'XLA_LINE_DEFINITIONS_B', key: 'EVENT_TYPE_CODE' },
  { from: 'XLA_LINE_DEFINITIONS_B', to: 'XLA_LINE_DEFN_JLT_ASSGNS', key: 'LINE_DEFINITION_CODE' },
  { from: 'XLA_ACCT_LINE_TYPES_B', to: 'XLA_LINE_DEFN_JLT_ASSGNS', key: 'ACCOUNTING_LINE_CODE' },
  { from: 'XLA_DESCRIPTIONS_B', to: 'XLA_LINE_DEFN_JLT_ASSGNS', key: 'DESCRIPTION_CODE' },
  { from: 'XLA_LINE_DEFINITIONS_B', to: 'XLA_LINE_DEFN_ADR_ASSGNS', key: 'LINE_DEFINITION_CODE' },
  { from: 'XLA_SEG_RULES_B', to: 'XLA_LINE_DEFN_ADR_ASSGNS', key: 'SEGMENT_RULE_CODE' },
  { from: 'XLA_LINE_DEFINITIONS_B', to: 'XLA_LINE_DEFN_AC_ASSGNS', key: 'LINE_DEFINITION_CODE' },
  { from: 'XLA_ANALYTICAL_HDRS_B', to: 'XLA_LINE_DEFN_AC_ASSGNS', key: 'ANALYTICAL_CRITERION_CODE' },
  { from: 'XLA_ACCTG_METHODS_B', to: 'XLA_ACCTG_METHOD_RULES', key: 'ACCOUNTING_METHOD_CODE' },
  { from: 'XLA_LINE_DEFINITIONS_B', to: 'XLA_ACCTG_METHOD_RULES', key: 'PRODUCT_RULE_CODE' },
  // D: Subledger Txns -> Entities & Events
  { from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', key: 'INVOICE_ID' },
  { from: 'RA_CUSTOMER_TRX_ALL', to: 'RA_CUSTOMER_TRX_LINES_ALL', key: 'CUSTOMER_TRX_ID' },
  { from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', key: 'CUSTOMER_TRX_LINE_ID' },
  { from: 'FA_ADDITIONS_B', to: 'FA_TRANSACTION_HEADERS', key: 'ASSET_ID' },
  { from: 'FA_ADDITIONS_B', to: 'FA_DEPRN_DETAIL', key: 'ASSET_ID' },
  { from: 'FLA_LEASES_ALL', to: 'FLA_ACCOUNTING_HEADERS_ALL', key: 'LEASE_ID' },
  { from: 'FLA_ACCOUNTING_HEADERS_ALL', to: 'FLA_ACCOUNTING_LINES', key: 'TRANSACTION_ID' },
  { from: 'XLA_TRANSACTION_HEADERS_INT', to: 'XLA_TRANSACTION_LINES_INT', key: 'TRANSACTION_NUMBER' },
  { from: 'XLA_TRANSACTION_INT_CONTROLS', to: 'XLA_TRANSACTION_HEADERS_INT', key: 'PROCESSING_GROUP_NAME' },
  { from: 'XLA_TRANSACTION_HEADERS_INT', to: 'XLA_TRANSACTION_HEADERS', key: 'TRANSACTION_NUMBER' },
  { from: 'XLA_TRANSACTION_LINES_INT', to: 'XLA_TRANSACTION_LINES', key: 'LINE_NUMBER' },
  { from: 'XLA_TRANSACTION_HEADERS', to: 'XLA_TRANSACTION_LINES', key: 'EVENT_ID' },
  // Txns -> XLA Entities/Events
  { from: 'AP_INVOICES_ALL', to: 'XLA_TRANSACTION_ENTITIES', key: 'SOURCE_ID_INT_1' },
  { from: 'RA_CUSTOMER_TRX_ALL', to: 'XLA_TRANSACTION_ENTITIES', key: 'SOURCE_ID_INT_1' },
  { from: 'FA_ADDITIONS_B', to: 'XLA_TRANSACTION_ENTITIES', key: 'SOURCE_ID_INT_1' },
  { from: 'FLA_LEASES_ALL', to: 'XLA_TRANSACTION_ENTITIES', key: 'SOURCE_ID_INT_1' },
  { from: 'XLA_TRANSACTION_HEADERS', to: 'XLA_EVENTS', key: 'EVENT_ID' },
  // E: SLA Engine Output
  { from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', key: 'ENTITY_ID' },
  { from: 'XLA_EVENTS', to: 'XLA_AE_HEADERS', key: 'EVENT_ID' },
  { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', key: 'AE_HEADER_ID' },
  { from: 'XLA_AE_LINES', to: 'XLA_DISTRIBUTION_LINKS', key: 'AE_LINE_NUM' },
  { from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'XLA_DISTRIBUTION_LINKS', key: 'INVOICE_DISTRIBUTION_ID' },
  { from: 'RA_CUST_TRX_LINE_GL_DIST_ALL', to: 'XLA_DISTRIBUTION_LINKS', key: 'CUST_TRX_LINE_GL_DIST_ID' },
  { from: 'FA_DEPRN_DETAIL', to: 'XLA_DISTRIBUTION_LINKS', key: 'DISTRIBUTION_ID' },
  { from: 'FLA_ACCOUNTING_LINES', to: 'XLA_DISTRIBUTION_LINKS', key: 'TRANSACTION_LINE_ID' },
  { from: 'XLA_AE_LINES', to: 'XLA_AE_LINE_ACS', key: 'AE_HEADER_ID' },
  { from: 'XLA_ANALYTICAL_HDRS_B', to: 'XLA_AE_LINE_ACS', key: 'ANALYTICAL_CRITERION_CODE' },
  { from: 'XLA_AE_LINE_ACS', to: 'XLA_AC_BALANCES', key: 'AC1' },
  { from: 'GL_CODE_COMBINATIONS', to: 'XLA_AE_LINES', key: 'CODE_COMBINATION_ID' },
  // F: GL Transfer & Posting
  { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', key: 'GL_SL_LINK_ID' },
  { from: 'GL_INTERFACE', to: 'GL_JE_BATCHES', key: 'GROUP_ID' },
  { from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', key: 'JE_BATCH_ID' },
  { from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', key: 'JE_HEADER_ID' },
  { from: 'GL_JE_LINES', to: 'GL_IMPORT_REFERENCES', key: 'GL_SL_LINK_ID' },
  { from: 'GL_JE_LINES', to: 'GL_BALANCES', key: 'CODE_COMBINATION_ID' }
];

// 全59テーブルのステップ連動サンプルデータ定義
// 各行構造: { _createdAt: stepIdx, data: {...}, _updates: { stepIdx: { col: newVal } } }
const TABLE_RECORDS = {
  // === A. ORG_GL_MASTER ===
  XLE_ENTITY_PROFILES: [
    { _createdAt: 0, data: { LEGAL_ENTITY_ID: 50001, NAME: '日本法人株式会社', LEGAL_ENTITY_IDENTIFIER: 'JP-LE-01', COUNTRY: 'JP', TRANSACTING_ENTITY_FLAG: 'Y' } }
  ],
  HR_ALL_ORGANIZATION_UNITS_F: [
    { _createdAt: 0, data: { ORGANIZATION_ID: 3001, NAME: 'JP_CORP_BU', EFFECTIVE_START_DATE: '2026-01-01', EFFECTIVE_END_DATE: '4712-12-31', BUSINESS_GROUP_ID: 1 } }
  ],
  GL_LEDGERS: [
    {
      _createdAt: 0,
      data: {
        LEDGER_ID: 300001, NAME: 'JP_CORP_LEDGER', SHORT_NAME: 'JP_CORP',
        CHART_OF_ACCOUNTS_ID: 101, CURRENCY_CODE: 'JPY', PERIOD_SET_NAME: 'JP_FY_CAL',
        SLA_ACCOUNTING_METHOD_CODE: 'STANDARD_ACCRUAL', SLA_ACCOUNTING_METHOD_TYPE: 'S'
      },
      _updates: {
        2: { SLA_ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', SLA_ACCOUNTING_METHOD_TYPE: 'C' }
      }
    }
  ],
  GL_PERIOD_STATUSES: [
    { _createdAt: 0, data: { APPLICATION_ID: 101, LEDGER_ID: 300001, PERIOD_NAME: '2026-04', CLOSING_STATUS: 'O', START_DATE: '2026-04-01', END_DATE: '2026-04-30' } },
    { _createdAt: 0, data: { APPLICATION_ID: 200, LEDGER_ID: 300001, PERIOD_NAME: '2026-04', CLOSING_STATUS: 'O', START_DATE: '2026-04-01', END_DATE: '2026-04-30' } },
    { _createdAt: 0, data: { APPLICATION_ID: 222, LEDGER_ID: 300001, PERIOD_NAME: '2026-04', CLOSING_STATUS: 'O', START_DATE: '2026-04-01', END_DATE: '2026-04-30' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, LEDGER_ID: 300001, PERIOD_NAME: '2026-04', CLOSING_STATUS: 'O', START_DATE: '2026-04-01', END_DATE: '2026-04-30' } }
  ],
  FND_ID_FLEX_SEGMENTS: AFF_SEGMENTS.map(s => ({
    _createdAt: 0,
    data: {
      APPLICATION_ID: 101, ID_FLEX_CODE: 'GL#', ID_FLEX_NUM: 101,
      APPLICATION_COLUMN_NAME: s.col, SEGMENT_NAME: s.name, SEGMENT_NUM: s.num
    }
  })),
  GL_CODE_COMBINATIONS: CCID_LIST.map(c => {
    const segs = c.aff.split('-');
    return {
      _createdAt: 0,
      data: {
        CODE_COMBINATION_ID: c.id, CHART_OF_ACCOUNTS_ID: 101, ACCOUNT_TYPE: c.type,
        SEGMENT1: segs[0], SEGMENT2: segs[1], SEGMENT3: segs[2],
        SEGMENT4: segs[3], SEGMENT5: segs[4], SEGMENT6: segs[5],
        SEGMENT7: segs[6], SEGMENT8: segs[7], SEGMENT9: segs[8],
        ENABLED_FLAG: 'Y'
      }
    };
  }),

  // === B. SLA_EVENT_FAH_SETUP ===
  XLA_SUBLEDGERS: [
    { _createdAt: 0, data: { APPLICATION_ID: 200, APPLICATION_SHORT_NAME: 'SQLAP', JE_SOURCE_NAME: 'Payables', CONTROL_ACCOUNT_TYPE_CODE: 'Y', VALUATION_METHOD_FLAG: 'N' } },
    { _createdAt: 0, data: { APPLICATION_ID: 222, APPLICATION_SHORT_NAME: 'AR', JE_SOURCE_NAME: 'Receivables', CONTROL_ACCOUNT_TYPE_CODE: 'Y', VALUATION_METHOD_FLAG: 'N' } },
    { _createdAt: 0, data: { APPLICATION_ID: 140, APPLICATION_SHORT_NAME: 'OFA', JE_SOURCE_NAME: 'Assets', CONTROL_ACCOUNT_TYPE_CODE: 'N', VALUATION_METHOD_FLAG: 'N' } },
    { _createdAt: 0, data: { APPLICATION_ID: 10522, APPLICATION_SHORT_NAME: 'FLA', JE_SOURCE_NAME: 'Lease Accounting', CONTROL_ACCOUNT_TYPE_CODE: 'N', VALUATION_METHOD_FLAG: 'N' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, APPLICATION_SHORT_NAME: 'XX_FAH_CLOUD', JE_SOURCE_NAME: 'XX Cloud Billing Hub', CONTROL_ACCOUNT_TYPE_CODE: 'N', VALUATION_METHOD_FLAG: 'N' } }
  ],
  XLA_EVENT_CLASSES_B: [
    { _createdAt: 0, data: { APPLICATION_ID: 200, ENTITY_CODE: 'AP_INVOICES', EVENT_CLASS_CODE: 'INVOICES', ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', EVENT_CLASS_CODE: 'INVOICE', ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 140, ENTITY_CODE: 'DEPRECIATION', EVENT_CLASS_CODE: 'DEPRECIATION', ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 10522, ENTITY_CODE: 'LEASE_TRANSACTIONS', EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, ENTITY_CODE: 'XX_CLOUD_BILLING', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', ENABLED_FLAG: 'Y' } }
  ],
  XLA_EVENT_TYPES_B: [
    { _createdAt: 0, data: { APPLICATION_ID: 200, ENTITY_CODE: 'AP_INVOICES', EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 222, ENTITY_CODE: 'TRANSACTIONS', EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 140, ENTITY_CODE: 'DEPRECIATION', EVENT_CLASS_CODE: 'DEPRECIATION', EVENT_TYPE_CODE: 'DEPRECIATION', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 10522, ENTITY_CODE: 'LEASE_TRANSACTIONS', EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', EVENT_TYPE_CODE: 'LEASE_BOOKING', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, ENTITY_CODE: 'XX_CLOUD_BILLING', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', ACCOUNTING_FLAG: 'Y', ENABLED_FLAG: 'Y' } }
  ],
  XLA_SOURCES_B: [
    { _createdAt: 0, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_CHAR1', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_CHAR2', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_DATE1', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'D', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_CHAR1', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_CHAR2', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_NUMBER1', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'N', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_NUMBER2', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'N', VIEW_APPLICATION_ID: 20001, ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 200, SOURCE_CODE: 'AP_VENDOR_NAME', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 200, ENABLED_FLAG: 'Y' } },
    { _createdAt: 0, data: { APPLICATION_ID: 222, SOURCE_CODE: 'AR_BILL_TO_CUST_NAME', SOURCE_TYPE_CODE: 'S', DATATYPE_CODE: 'C', VIEW_APPLICATION_ID: 222, ENABLED_FLAG: 'Y' } }
  ],
  XLA_TRANSACTION_INT_CONTROLS: [
    {
      _createdAt: 0,
      data: {
        INTERFACE_CONTROL_ID: 9001, APPLICATION_ID: 20001,
        PROCESSING_GROUP_NAME: 'FAH_GRP_202604',
        HEADER_INTERFACE_TABLE_NAME: 'XLA_TRANSACTION_HEADERS_INT',
        LINE_INTERFACE_TABLE_NAME: 'XLA_TRANSACTION_LINES_INT',
        COMBINED_IMPORT_AND_LOAD_FLAG: 'Y'
      }
    }
  ],
  XLA_LEDGER_OPTIONS: [
    {
      _createdAt: 2,
      data: { LEDGER_ID: 300001, APPLICATION_ID: 200, TRANSFER_TO_GL_MODE_CODE: 'D', ACCT_REVERSAL_OPTION_CODE: 'NONE', ROUNDING_RULE_CODE: 'NEAREST', ENABLE_SUBMIT_POSTING_FLAG: 'Y', ENABLED_FLAG: 'Y' }
    },
    {
      _createdAt: 2,
      data: { LEDGER_ID: 300001, APPLICATION_ID: 222, TRANSFER_TO_GL_MODE_CODE: 'D', ACCT_REVERSAL_OPTION_CODE: 'NONE', ROUNDING_RULE_CODE: 'NEAREST', ENABLE_SUBMIT_POSTING_FLAG: 'Y', ENABLED_FLAG: 'Y' }
    },
    {
      _createdAt: 2,
      data: { LEDGER_ID: 300001, APPLICATION_ID: 140, TRANSFER_TO_GL_MODE_CODE: 'D', ACCT_REVERSAL_OPTION_CODE: 'NONE', ROUNDING_RULE_CODE: 'NEAREST', ENABLE_SUBMIT_POSTING_FLAG: 'Y', ENABLED_FLAG: 'Y' }
    },
    {
      _createdAt: 2,
      data: { LEDGER_ID: 300001, APPLICATION_ID: 10522, TRANSFER_TO_GL_MODE_CODE: 'D', ACCT_REVERSAL_OPTION_CODE: 'NONE', ROUNDING_RULE_CODE: 'NEAREST', ENABLE_SUBMIT_POSTING_FLAG: 'Y', ENABLED_FLAG: 'Y' }
    },
    {
      _createdAt: 2,
      data: { LEDGER_ID: 300001, APPLICATION_ID: 20001, TRANSFER_TO_GL_MODE_CODE: 'D', ACCT_REVERSAL_OPTION_CODE: 'NONE', ROUNDING_RULE_CODE: 'NEAREST', ENABLE_SUBMIT_POSTING_FLAG: 'Y', ENABLED_FLAG: 'Y' }
    }
  ],

  // === C. SLA_AMB_RULES ===
  XLA_FORMULAS_B: [
    { _createdAt: 1, data: { APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_CODE: 'XX_FAH_LINE_AMT_FML', FORMULA_ID: 7001, DATATYPE_CODE: 'N', ENABLED_FLAG: 'Y' } }
  ],
  XLA_FORMULA_DETAILS: [
    { _createdAt: 1, data: { FORMULA_DETAIL_ID: 7101, APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_ID: 7001, USER_SEQUENCE: 1, EXPR_TYPE: 'S', POSTFIX_EXPR: 'LINE_NUMBER1' } },
    { _createdAt: 1, data: { FORMULA_DETAIL_ID: 7102, APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_ID: 7001, USER_SEQUENCE: 2, EXPR_TYPE: 'S', POSTFIX_EXPR: 'LINE_NUMBER2' } },
    { _createdAt: 1, data: { FORMULA_DETAIL_ID: 7103, APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', FORMULA_ID: 7001, USER_SEQUENCE: 3, EXPR_TYPE: 'O', POSTFIX_EXPR: '*' } }
  ],
  XLA_MAPPING_SETS_B: [
    { _createdAt: 1, data: { MAPPING_SET_CODE: 'XX_FAH_SVC_ACCT_MAP', AMB_CONTEXT_CODE: 'DEFAULT', APPLICATION_ID: 20001, FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', NUM_INPUTS: 1, ENABLED_FLAG: 'Y' } }
  ],
  XLA_MAPPING_SET_VALUES: [
    { _createdAt: 1, data: { MAPPING_SET_VALUE_ID: 8001, MAPPING_SET_CODE: 'XX_FAH_SVC_ACCT_MAP', AMB_CONTEXT_CODE: 'DEFAULT', INPUT_VALUE_CONSTANT1: 'SaaS_USAGE', VALUE_CONSTANT: '4102', ENABLED_FLAG: 'Y' } },
    { _createdAt: 1, data: { MAPPING_SET_VALUE_ID: 8002, MAPPING_SET_CODE: 'XX_FAH_SVC_ACCT_MAP', AMB_CONTEXT_CODE: 'DEFAULT', INPUT_VALUE_CONSTANT1: 'CONS_SVC', VALUE_CONSTANT: '4103', ENABLED_FLAG: 'Y' } }
  ],
  XLA_SEG_RULES_B: [
    { _createdAt: 1, data: { APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FAH_REV_ACCT_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', ENABLED_FLAG: 'Y' } },
    { _createdAt: 1, data: { APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FAH_DEPT_200_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT2', ENABLED_FLAG: 'Y' } },
    { _createdAt: 1, data: { APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FAH_AR_1101_ADR', FLEXFIELD_ASSIGN_MODE_CODE: 'S', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', ENABLED_FLAG: 'Y' } }
  ],
  XLA_SEG_RULE_DETAILS: [
    { _createdAt: 1, data: { SEGMENT_RULE_DETAIL_ID: 8201, APPLICATION_ID: 20001, SEGMENT_RULE_CODE: 'XX_FAH_REV_ACCT_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'M', VALUE_MAPPING_SET_CODE: 'XX_FAH_SVC_ACCT_MAP', VALUE_SOURCE_CODE: 'LINE_CHAR2', VALUE_CONSTANT: null } },
    { _createdAt: 1, data: { SEGMENT_RULE_DETAIL_ID: 8202, APPLICATION_ID: 20001, SEGMENT_RULE_CODE: 'XX_FAH_REV_ACCT_ADR', USER_SEQUENCE: 20, VALUE_TYPE_CODE: 'C', VALUE_MAPPING_SET_CODE: null, VALUE_SOURCE_CODE: null, VALUE_CONSTANT: '4101' } },
    { _createdAt: 1, data: { SEGMENT_RULE_DETAIL_ID: 8203, APPLICATION_ID: 20001, SEGMENT_RULE_CODE: 'XX_FAH_DEPT_200_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'C', VALUE_MAPPING_SET_CODE: null, VALUE_SOURCE_CODE: null, VALUE_CONSTANT: '200' } },
    { _createdAt: 1, data: { SEGMENT_RULE_DETAIL_ID: 8204, APPLICATION_ID: 20001, SEGMENT_RULE_CODE: 'XX_FAH_AR_1101_ADR', USER_SEQUENCE: 10, VALUE_TYPE_CODE: 'C', VALUE_MAPPING_SET_CODE: null, VALUE_SOURCE_CODE: null, VALUE_CONSTANT: '1101' } }
  ],
  XLA_CONDITIONS: [
    { _createdAt: 1, data: { CONDITION_ID: 8301, APPLICATION_ID: 20001, SEGMENT_RULE_DETAIL_ID: 8201, DESCRIPTION_DETAIL_ID: null, USER_SEQUENCE: 1, SOURCE_CODE: 'LINE_CHAR2', LINE_OPERATOR_CODE: 'IS NOT NULL', VALUE_TYPE_CODE: null, VALUE_CONSTANT: null } },
    { _createdAt: 1, data: { CONDITION_ID: 8302, APPLICATION_ID: 20001, SEGMENT_RULE_DETAIL_ID: null, DESCRIPTION_DETAIL_ID: 8401, USER_SEQUENCE: 1, SOURCE_CODE: 'LINE_CHAR1', LINE_OPERATOR_CODE: '=', VALUE_TYPE_CODE: 'C', VALUE_CONSTANT: 'POS_BILLING' } }
  ],
  XLA_DESCRIPTIONS_B: [
    { _createdAt: 1, data: { APPLICATION_ID: 20001, AMB_CONTEXT_CODE: 'DEFAULT', DESCRIPTION_TYPE_CODE: 'C', DESCRIPTION_CODE: 'XX_FAH_LINE_DESC', ENABLED_FLAG: 'Y' } }
  ],
  XLA_ACCT_LINE_TYPES_B: [
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', ACCOUNTING_LINE_TYPE_CODE: 'C', ACCOUNTING_LINE_CODE: 'XX_FAH_AR_DR_JLT', ACCOUNTING_CLASS_CODE: 'RECEIVABLE', NATURAL_SIDE_CODE: 'D', ACCOUNTING_ENTRY_TYPE_CODE: 'ACTUAL', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', ACCOUNTING_LINE_TYPE_CODE: 'C', ACCOUNTING_LINE_CODE: 'XX_FAH_REV_CR_JLT', ACCOUNTING_CLASS_CODE: 'REVENUE', NATURAL_SIDE_CODE: 'C', ACCOUNTING_ENTRY_TYPE_CODE: 'ACTUAL', MERGE_DUPLICATE_CODE: 'N', ENABLED_FLAG: 'Y' } }
  ],
  XLA_JLT_ACCT_ATTRS: [
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', ACCOUNTING_LINE_CODE: 'XX_FAH_AR_DR_JLT', ACCOUNTING_ATTRIBUTE_CODE: 'ENTERED_AMOUNT', SOURCE_ORIGIN_CODE: 'F', SOURCE_CODE: 'XX_FAH_LINE_AMT_FML' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', ACCOUNTING_LINE_CODE: 'XX_FAH_REV_CR_JLT', ACCOUNTING_ATTRIBUTE_CODE: 'ENTERED_AMOUNT', SOURCE_ORIGIN_CODE: 'F', SOURCE_CODE: 'XX_FAH_LINE_AMT_FML' } }
  ],
  XLA_ANALYTICAL_HDRS_B: [
    { _createdAt: 2, data: { ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', BALANCING_FLAG: 'Y', YEAR_END_CARRY_FORWARD_CODE: 'A', ENABLED_FLAG: 'Y' } },
    { _createdAt: 2, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', BALANCING_FLAG: 'N', YEAR_END_CARRY_FORWARD_CODE: 'N', ENABLED_FLAG: 'Y' } }
  ],
  XLA_ANALYTICAL_DTLS_B: [
    { _createdAt: 2, data: { ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', AMB_CONTEXT_CODE: 'DEFAULT', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', DATA_TYPE_CODE: 'C', GROUPING_ORDER: 1 } },
    { _createdAt: 2, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', AMB_CONTEXT_CODE: 'DEFAULT', ANALYTICAL_DETAIL_CODE: 'EXT_SYSTEM', DATA_TYPE_CODE: 'C', GROUPING_ORDER: 1 } },
    { _createdAt: 2, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', AMB_CONTEXT_CODE: 'DEFAULT', ANALYTICAL_DETAIL_CODE: 'EXT_INV_NUM', DATA_TYPE_CODE: 'C', GROUPING_ORDER: 2 } },
    { _createdAt: 2, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', AMB_CONTEXT_CODE: 'DEFAULT', ANALYTICAL_DETAIL_CODE: 'MATURITY_DATE', DATA_TYPE_CODE: 'D', GROUPING_ORDER: 3 } },
    { _createdAt: 2, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', AMB_CONTEXT_CODE: 'DEFAULT', ANALYTICAL_DETAIL_CODE: 'QTY', DATA_TYPE_CODE: 'N', GROUPING_ORDER: 4 } },
    { _createdAt: 2, data: { ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', AMB_CONTEXT_CODE: 'DEFAULT', ANALYTICAL_DETAIL_CODE: 'UNIT_PRICE', DATA_TYPE_CODE: 'N', GROUPING_ORDER: 5 } }
  ],
  XLA_ANALYTICAL_SOURCES: [
    // 残高有 SR_COUNTERPARTY (5大サブ元帳すべてで同一 AC1 '相手先' へ正規化)
    { _createdAt: 2, data: { APPLICATION_ID: 200, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'INVOICES', SOURCE_APPLICATION_ID: 200, SOURCE_CODE: 'AP_VENDOR_NAME' } },
    { _createdAt: 2, data: { APPLICATION_ID: 222, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'INVOICE', SOURCE_APPLICATION_ID: 222, SOURCE_CODE: 'AR_BILL_TO_CUST_NAME' } },
    { _createdAt: 2, data: { APPLICATION_ID: 140, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'DEPRECIATION', SOURCE_APPLICATION_ID: 140, SOURCE_CODE: 'FA_VENDOR_NAME' } },
    { _createdAt: 2, data: { APPLICATION_ID: 10522, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', SOURCE_APPLICATION_ID: 10522, SOURCE_CODE: 'LA_LESSOR_NAME' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_DETAIL_CODE: 'COUNTERPARTY', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_CHAR1' } },
    // 残高無 SR_EXT_TRACE (代表例: FAH 5項目)
    { _createdAt: 2, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'EXT_SYSTEM', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_CHAR1' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'EXT_INV_NUM', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_CHAR2' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'MATURITY_DATE', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_APPLICATION_ID: 20001, SOURCE_CODE: 'HEADER_DATE1' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'QTY', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_NUMBER1' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_DETAIL_CODE: 'UNIT_PRICE', EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', SOURCE_APPLICATION_ID: 20001, SOURCE_CODE: 'LINE_NUMBER2' } }
  ],
  XLA_LINE_DEFINITIONS_B: [
    { _createdAt: 2, data: { APPLICATION_ID: 200, EVENT_CLASS_CODE: 'INVOICES', EVENT_TYPE_CODE: 'INVOICE VALIDATED', LINE_DEFINITION_OWNER_CODE: 'S', LINE_DEFINITION_CODE: 'AP_STD_INVOICE_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } },
    { _createdAt: 2, data: { APPLICATION_ID: 222, EVENT_CLASS_CODE: 'INVOICE', EVENT_TYPE_CODE: 'INV_CREATE', LINE_DEFINITION_OWNER_CODE: 'S', LINE_DEFINITION_CODE: 'AR_STD_TRX_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } },
    { _createdAt: 2, data: { APPLICATION_ID: 140, EVENT_CLASS_CODE: 'DEPRECIATION', EVENT_TYPE_CODE: 'DEPRECIATION', LINE_DEFINITION_OWNER_CODE: 'S', LINE_DEFINITION_CODE: 'FA_DEPRN_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } },
    { _createdAt: 2, data: { APPLICATION_ID: 10522, EVENT_CLASS_CODE: 'LEASE_COMMENCEMENT', EVENT_TYPE_CODE: 'LEASE_BOOKING', LINE_DEFINITION_OWNER_CODE: 'S', LINE_DEFINITION_CODE: 'FLA_ROU_COMMENCE_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', LINE_DEFINITION_OWNER_CODE: 'C', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', VALIDATION_STATUS_CODE: 'C', ENABLED_FLAG: 'Y' } }
  ],
  XLA_LINE_DEFN_JLT_ASSGNS: [
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_AR_DR_JLT', DESCRIPTION_CODE: 'XX_FAH_LINE_DESC', INHERIT_DESC_FLAG: 'N' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_REV_CR_JLT', DESCRIPTION_CODE: 'XX_FAH_LINE_DESC', INHERIT_DESC_FLAG: 'N' } }
  ],
  XLA_LINE_DEFN_ADR_ASSGNS: [
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_AR_DR_JLT', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FAH_AR_1101_ADR' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_REV_CR_JLT', FLEXFIELD_SEGMENT_CODE: 'SEGMENT2', SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FAH_DEPT_200_ADR' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_REV_CR_JLT', FLEXFIELD_SEGMENT_CODE: 'SEGMENT3', SEGMENT_RULE_TYPE_CODE: 'C', SEGMENT_RULE_CODE: 'XX_FAH_REV_ACCT_ADR' } }
  ],
  XLA_LINE_DEFN_AC_ASSGNS: [
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_AR_DR_JLT', ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_AR_DR_JLT', ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_REV_CR_JLT', ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C' } },
    { _createdAt: 2, data: { APPLICATION_ID: 20001, EVENT_CLASS_CODE: 'XX_CLOUD_BILLING', LINE_DEFINITION_CODE: 'XX_FAH_CLOUD_JERS', ACCOUNTING_LINE_CODE: 'XX_FAH_REV_CR_JLT', ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C' } },
    { _createdAt: 2, data: { APPLICATION_ID: 200, EVENT_CLASS_CODE: 'INVOICES', LINE_DEFINITION_CODE: 'AP_STD_INVOICE_JERS', ACCOUNTING_LINE_CODE: 'AP_LIABILITY_INV', ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C' } },
    { _createdAt: 2, data: { APPLICATION_ID: 222, EVENT_CLASS_CODE: 'INVOICE', LINE_DEFINITION_CODE: 'AR_STD_TRX_JERS', ACCOUNTING_LINE_CODE: 'AR_REC_DEFAULT', ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C' } }
  ],
  XLA_ACCTG_METHODS_B: [
    { _createdAt: 2, data: { ACCOUNTING_METHOD_TYPE_CODE: 'C', ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', TRANSACTION_COA_ID: 101, ACCOUNTING_COA_ID: 101, ENABLED_FLAG: 'Y' } }
  ],
  XLA_ACCTG_METHOD_RULES: [
    { _createdAt: 2, data: { ACCTG_METHOD_RULE_ID: 9501, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 200, PRODUCT_RULE_TYPE_CODE: 'S', PRODUCT_RULE_CODE: 'AP_STD_INVOICE_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } },
    { _createdAt: 2, data: { ACCTG_METHOD_RULE_ID: 9502, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 222, PRODUCT_RULE_TYPE_CODE: 'S', PRODUCT_RULE_CODE: 'AR_STD_TRX_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } },
    { _createdAt: 2, data: { ACCTG_METHOD_RULE_ID: 9503, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 140, PRODUCT_RULE_TYPE_CODE: 'S', PRODUCT_RULE_CODE: 'FA_DEPRN_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } },
    { _createdAt: 2, data: { ACCTG_METHOD_RULE_ID: 9504, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 10522, PRODUCT_RULE_TYPE_CODE: 'S', PRODUCT_RULE_CODE: 'FLA_ROU_COMMENCE_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } },
    { _createdAt: 2, data: { ACCTG_METHOD_RULE_ID: 9505, ACCOUNTING_METHOD_CODE: 'XX_JP_CORP_AM', APPLICATION_ID: 20001, PRODUCT_RULE_TYPE_CODE: 'C', PRODUCT_RULE_CODE: 'XX_FAH_CLOUD_JERS', START_DATE_ACTIVE: '2026-01-01', AMB_CONTEXT_CODE: 'DEFAULT' } }
  ],

  // === D. SUBLEDGER_TXNS ===
  // 1) AP (200)
  AP_INVOICES_ALL: [
    {
      _createdAt: 3,
      data: {
        INVOICE_ID: 10001, INVOICE_NUM: 'AP-2026-001', VENDOR_ID: 501,
        INVOICE_AMOUNT: 550000, INVOICE_DATE: '2026-04-10', ORG_ID: 3001, SET_OF_BOOKS_ID: 300001,
        ATTRIBUTE_CATEGORY: 'JP_AP_EXT', ATTRIBUTE1: 'テックサポート株式会社', ATTRIBUTE2: 'EXT-AP-771'
      }
    }
  ],
  AP_INVOICE_DISTRIBUTIONS_ALL: [
    {
      _createdAt: 3,
      data: {
        INVOICE_DISTRIBUTION_ID: 11001, INVOICE_ID: 10001, DISTRIBUTION_LINE_NUMBER: 1,
        LINE_TYPE_LOOKUP_CODE: 'ITEM', AMOUNT: 500000, DIST_CODE_COMBINATION_ID: 5001,
        QUANTITY_INVOICED: 10, UNIT_PRICE: 50000, ACCOUNTING_EVENT_ID: 500001, POSTED_FLAG: 'N'
      },
      _updates: {
        5: { POSTED_FLAG: 'S' },
        7: { POSTED_FLAG: 'Y' }
      }
    },
    {
      _createdAt: 3,
      data: {
        INVOICE_DISTRIBUTION_ID: 11002, INVOICE_ID: 10001, DISTRIBUTION_LINE_NUMBER: 2,
        LINE_TYPE_LOOKUP_CODE: 'TAX', AMOUNT: 50000, DIST_CODE_COMBINATION_ID: 1002,
        QUANTITY_INVOICED: 1, UNIT_PRICE: 50000, ACCOUNTING_EVENT_ID: 500001, POSTED_FLAG: 'N'
      },
      _updates: {
        5: { POSTED_FLAG: 'S' },
        7: { POSTED_FLAG: 'Y' }
      }
    }
  ],
  // 2) AR (222)
  RA_CUSTOMER_TRX_ALL: [
    {
      _createdAt: 3,
      data: {
        CUSTOMER_TRX_ID: 20001, TRX_NUMBER: 'AR-2026-001', TRX_DATE: '2026-04-12',
        BILL_TO_CUSTOMER_ID: 601, ORG_ID: 3001, SET_OF_BOOKS_ID: 300001, COMPLETE_FLAG: 'Y',
        ATTRIBUTE_CATEGORY: 'JP_AR_EXT', ATTRIBUTE1: '株式会社グローバル商事'
      }
    }
  ],
  RA_CUSTOMER_TRX_LINES_ALL: [
    {
      _createdAt: 3,
      data: {
        CUSTOMER_TRX_LINE_ID: 21001, CUSTOMER_TRX_ID: 20001, LINE_NUMBER: 1,
        LINE_TYPE: 'LINE', DESCRIPTION: '基幹モジュールライセンス', QUANTITY_INVOICED: 4, UNIT_SELLING_PRICE: 200000, EXTENDED_AMOUNT: 800000
      }
    },
    {
      _createdAt: 3,
      data: {
        CUSTOMER_TRX_LINE_ID: 21002, CUSTOMER_TRX_ID: 20001, LINE_NUMBER: 2,
        LINE_TYPE: 'TAX', DESCRIPTION: '消費税(10%)', QUANTITY_INVOICED: 1, UNIT_SELLING_PRICE: 80000, EXTENDED_AMOUNT: 80000
      }
    }
  ],
  RA_CUST_TRX_LINE_GL_DIST_ALL: [
    { _createdAt: 3, data: { CUST_TRX_LINE_GL_DIST_ID: 22001, CUSTOMER_TRX_ID: 20001, CUSTOMER_TRX_LINE_ID: null, ACCOUNT_CLASS: 'REC', AMOUNT: 880000, CODE_COMBINATION_ID: 1001, EVENT_ID: 500002, ACCOUNT_SET_FLAG: 'N' } },
    { _createdAt: 3, data: { CUST_TRX_LINE_GL_DIST_ID: 22002, CUSTOMER_TRX_ID: 20001, CUSTOMER_TRX_LINE_ID: 21001, ACCOUNT_CLASS: 'REV', AMOUNT: 800000, CODE_COMBINATION_ID: 4001, EVENT_ID: 500002, ACCOUNT_SET_FLAG: 'N' } },
    { _createdAt: 3, data: { CUST_TRX_LINE_GL_DIST_ID: 22003, CUSTOMER_TRX_ID: 20001, CUSTOMER_TRX_LINE_ID: 21002, ACCOUNT_CLASS: 'TAX', AMOUNT: 80000, CODE_COMBINATION_ID: 2002, EVENT_ID: 500002, ACCOUNT_SET_FLAG: 'N' } }
  ],
  // 3) FA (140)
  FA_ADDITIONS_B: [
    { _createdAt: 3, data: { ASSET_ID: 30001, ASSET_NUMBER: 'FA-2026-001', ASSET_CATEGORY_ID: 401, ATTRIBUTE_CATEGORY_CODE: 'サーバー機器', CURRENT_UNITS: 2 } }
  ],
  FA_TRANSACTION_HEADERS: [
    { _createdAt: 3, data: { TRANSACTION_HEADER_ID: 31001, ASSET_ID: 30001, BOOK_TYPE_CODE: 'JP_CORP_BOOK', TRANSACTION_TYPE_CODE: 'ADDITION', TRANSACTION_DATE_ENTERED: '2026-04-01', EVENT_ID: 500003 } }
  ],
  FA_DEPRN_DETAIL: [
    { _createdAt: 3, data: { BOOK_TYPE_CODE: 'JP_CORP_BOOK', ASSET_ID: 30001, DISTRIBUTION_ID: 32001, PERIOD_COUNTER: 24316, DEPRN_RUN_DATE: '2026-04-30', DEPRN_AMOUNT: 120000, DEPRN_RESERVE: 120000, DEPRN_EXPENSE_CCID: 5002, EVENT_ID: 500003 } }
  ],
  // 4) LA (10522)
  FLA_LEASES_ALL: [
    { _createdAt: 3, data: { LEASE_ID: 40001, LEASE_NUMBER: 'LA-2026-001', LEASE_NAME: '本社オフィスフロアリース', ORG_ID: 3001, LEASE_ASSET_TYPE_CODE: 'PROPERTY', LEASE_STATUS_CODE: 'ACTIVE', LESSOR_PARTY_ID: 701 } }
  ],
  FLA_ACCOUNTING_HEADERS_ALL: [
    {
      _createdAt: 3,
      data: { TRANSACTION_ID: 41001, LEASE_ID: 40001, LEDGER_ID: 300001, EVENT_ID: 500004, ACCOUNTING_DATE: '2026-04-01', EVENT_TYPE_CODE: 'LEASE_BOOKING', ACCOUNTED_IN_GL_FLAG: 'N' },
      _updates: {
        7: { ACCOUNTED_IN_GL_FLAG: 'Y' }
      }
    }
  ],
  FLA_ACCOUNTING_LINES: [
    { _createdAt: 3, data: { TRANSACTION_LINE_ID: 42001, TRANSACTION_ID: 41001, SCHEDULE_TYPE_CODE: 'ROU_ASSET', DR_CODE_COMBINATION_ID: 1003, CR_CODE_COMBINATION_ID: 2003, ENTERED_AMOUNT: 2400000, ACCOUNTED_AMOUNT: 2400000 } }
  ],
  // 5) FAH (20001) - Step 4で投入＆Base表へロード
  XLA_TRANSACTION_HEADERS_INT: [
    {
      _createdAt: 4,
      data: {
        APPLICATION_ID: 20001, APPLICATION_SHORT_NAME: 'XX_FAH_CLOUD',
        TRANSACTION_NUMBER: 'FAH-2026-001', EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG',
        LEDGER_NAME: 'JP_CORP_LEDGER', TRANSACTION_DATE: '2026-04-20',
        PROCESSING_GROUP_NAME: 'FAH_GRP_202604', STATUS_CODE: 'NEW',
        CHAR1: '株式会社グローバル商事', CHAR2: 'EXT-2026-0891', DATE1: '2026-05-31'
      },
      _updates: {
        4: { STATUS_CODE: 'PROCESSED' } // FAH結合インポート＆ロードが同一Step4後半で完了
      }
    }
  ],
  XLA_TRANSACTION_LINES_INT: [
    {
      _createdAt: 4,
      data: {
        APPLICATION_ID: 20001, TRANSACTION_NUMBER: 'FAH-2026-001', LINE_NUMBER: 1,
        CHAR1: 'POS_BILLING', CHAR2: 'SaaS_USAGE', NUMBER1: 300, NUMBER2: 1000, NUMBER3: 0,
        DATE1: '2026-04-20', STATUS_CODE: 'NEW'
      },
      _updates: {
        4: { STATUS_CODE: 'PROCESSED' }
      }
    }
  ],
  XLA_TRANSACTION_HEADERS: [
    {
      _createdAt: 4,
      data: {
        APPLICATION_ID: 20001, EVENT_ID: 500005, TRANSACTION_NUMBER: 'FAH-2026-001',
        LEDGER_ID: 300001, TRANSACTION_DATE: '2026-04-20', LEGAL_ENTITY_ID: 50001,
        CHAR1: '株式会社グローバル商事', CHAR2: 'EXT-2026-0891', DATE1: '2026-05-31'
      }
    }
  ],
  XLA_TRANSACTION_LINES: [
    {
      _createdAt: 4,
      data: {
        APPLICATION_ID: 20001, EVENT_ID: 500005, LINE_NUMBER: 1, TRANSACTION_DATE: '2026-04-20',
        CHAR1: 'POS_BILLING', CHAR2: 'SaaS_USAGE', NUMBER1: 300, NUMBER2: 1000, NUMBER3: 0, DATE1: '2026-04-20'
      },
      _updates: {
        5: { NUMBER3: 300000 } // Step5の算式評価完了可視化
      }
    }
  ],

  // === E. SLA_ENGINE_OUTPUT ===
  XLA_TRANSACTION_ENTITIES: [
    { _createdAt: 3, data: { ENTITY_ID: 400001, APPLICATION_ID: 200, LEDGER_ID: 300001, ENTITY_CODE: 'AP_INVOICES', SOURCE_ID_INT_1: 10001, TRANSACTION_NUMBER: 'AP-2026-001' } },
    { _createdAt: 3, data: { ENTITY_ID: 400002, APPLICATION_ID: 222, LEDGER_ID: 300001, ENTITY_CODE: 'TRANSACTIONS', SOURCE_ID_INT_1: 20001, TRANSACTION_NUMBER: 'AR-2026-001' } },
    { _createdAt: 3, data: { ENTITY_ID: 400003, APPLICATION_ID: 140, LEDGER_ID: 300001, ENTITY_CODE: 'DEPRECIATION', SOURCE_ID_INT_1: 30001, TRANSACTION_NUMBER: 'FA-2026-001' } },
    { _createdAt: 3, data: { ENTITY_ID: 400004, APPLICATION_ID: 10522, LEDGER_ID: 300001, ENTITY_CODE: 'LEASE_TRANSACTIONS', SOURCE_ID_INT_1: 40001, TRANSACTION_NUMBER: 'LA-2026-001' } },
    { _createdAt: 4, data: { ENTITY_ID: 400005, APPLICATION_ID: 20001, LEDGER_ID: 300001, ENTITY_CODE: 'XX_CLOUD_BILLING', SOURCE_ID_INT_1: 500005, TRANSACTION_NUMBER: 'FAH-2026-001' } }
  ],
  XLA_EVENTS: [
    { _createdAt: 3, data: { EVENT_ID: 500001, APPLICATION_ID: 200, ENTITY_ID: 400001, EVENT_TYPE_CODE: 'INVOICE VALIDATED', EVENT_DATE: '2026-04-10', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, _updates: { 5: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } },
    { _createdAt: 3, data: { EVENT_ID: 500002, APPLICATION_ID: 222, ENTITY_ID: 400002, EVENT_TYPE_CODE: 'INV_CREATE', EVENT_DATE: '2026-04-12', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, _updates: { 5: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } },
    { _createdAt: 3, data: { EVENT_ID: 500003, APPLICATION_ID: 140, ENTITY_ID: 400003, EVENT_TYPE_CODE: 'DEPRECIATION', EVENT_DATE: '2026-04-30', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, _updates: { 5: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } },
    { _createdAt: 3, data: { EVENT_ID: 500004, APPLICATION_ID: 10522, ENTITY_ID: 400004, EVENT_TYPE_CODE: 'LEASE_BOOKING', EVENT_DATE: '2026-04-01', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, _updates: { 5: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } },
    { _createdAt: 4, data: { EVENT_ID: 500005, APPLICATION_ID: 20001, ENTITY_ID: 400005, EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', EVENT_DATE: '2026-04-20', EVENT_STATUS_CODE: 'U', PROCESS_STATUS_CODE: 'U' }, _updates: { 5: { EVENT_STATUS_CODE: 'P', PROCESS_STATUS_CODE: 'P' } } }
  ],
  XLA_AE_HEADERS: [
    { _createdAt: 5, data: { AE_HEADER_ID: 600001, APPLICATION_ID: 200, LEDGER_ID: 300001, ENTITY_ID: 400001, EVENT_ID: 500001, EVENT_TYPE_CODE: 'INVOICE VALIDATED', ACCOUNTING_DATE: '2026-04-10', GL_TRANSFER_STATUS_CODE: 'N', JE_CATEGORY_NAME: 'Purchase Invoices', PERIOD_NAME: '2026-04', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A' }, _updates: { 7: { GL_TRANSFER_STATUS_CODE: 'Y' } } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600002, APPLICATION_ID: 222, LEDGER_ID: 300001, ENTITY_ID: 400002, EVENT_ID: 500002, EVENT_TYPE_CODE: 'INV_CREATE', ACCOUNTING_DATE: '2026-04-12', GL_TRANSFER_STATUS_CODE: 'N', JE_CATEGORY_NAME: 'Sales Invoices', PERIOD_NAME: '2026-04', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A' }, _updates: { 7: { GL_TRANSFER_STATUS_CODE: 'Y' } } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600003, APPLICATION_ID: 140, LEDGER_ID: 300001, ENTITY_ID: 400003, EVENT_ID: 500003, EVENT_TYPE_CODE: 'DEPRECIATION', ACCOUNTING_DATE: '2026-04-30', GL_TRANSFER_STATUS_CODE: 'N', JE_CATEGORY_NAME: 'Depreciation', PERIOD_NAME: '2026-04', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A' }, _updates: { 7: { GL_TRANSFER_STATUS_CODE: 'Y' } } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600004, APPLICATION_ID: 10522, LEDGER_ID: 300001, ENTITY_ID: 400004, EVENT_ID: 500004, EVENT_TYPE_CODE: 'LEASE_BOOKING', ACCOUNTING_DATE: '2026-04-01', GL_TRANSFER_STATUS_CODE: 'N', JE_CATEGORY_NAME: 'Lease Accounting', PERIOD_NAME: '2026-04', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A' }, _updates: { 7: { GL_TRANSFER_STATUS_CODE: 'Y' } } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600005, APPLICATION_ID: 20001, LEDGER_ID: 300001, ENTITY_ID: 400005, EVENT_ID: 500005, EVENT_TYPE_CODE: 'XX_CLOUD_REV_RECOG', ACCOUNTING_DATE: '2026-04-20', GL_TRANSFER_STATUS_CODE: 'N', JE_CATEGORY_NAME: 'Cloud Billing', PERIOD_NAME: '2026-04', ACCOUNTING_ENTRY_STATUS_CODE: 'F', BALANCE_TYPE_CODE: 'A' }, _updates: { 7: { GL_TRANSFER_STATUS_CODE: 'Y' } } }
  ],
  XLA_AE_LINES: [
    // AP (600001) - 3 lines: DR 500k + DR 50k = CR 550k
    { _createdAt: 5, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 1, APPLICATION_ID: 200, CODE_COMBINATION_ID: 5001, ACCOUNTING_CLASS_CODE: 'ITEM EXPENSE', ENTERED_DR: 500000, ENTERED_CR: 0, ACCOUNTED_DR: 500000, ACCOUNTED_CR: 0, CURRENCY_CODE: 'JPY', DESCRIPTION: '[AP] AP-2026-001 外注費', GL_SL_LINK_ID: 700001, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 2, APPLICATION_ID: 200, CODE_COMBINATION_ID: 1002, ACCOUNTING_CLASS_CODE: 'NRTAX', ENTERED_DR: 50000, ENTERED_CR: 0, ACCOUNTED_DR: 50000, ACCOUNTED_CR: 0, CURRENCY_CODE: 'JPY', DESCRIPTION: '[AP] AP-2026-001 仮払消費税10%', GL_SL_LINK_ID: 700002, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 3, APPLICATION_ID: 200, CODE_COMBINATION_ID: 2001, ACCOUNTING_CLASS_CODE: 'LIABILITY', ENTERED_DR: 0, ENTERED_CR: 550000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 550000, CURRENCY_CODE: 'JPY', DESCRIPTION: '[AP] AP-2026-001 買掛金', GL_SL_LINK_ID: 700003, GL_SL_LINK_TABLE: 'XLAJEL' } },
    // AR (600002) - 3 lines: DR 880k = CR 800k + CR 80k
    { _createdAt: 5, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 1, APPLICATION_ID: 222, CODE_COMBINATION_ID: 1001, ACCOUNTING_CLASS_CODE: 'RECEIVABLE', ENTERED_DR: 880000, ENTERED_CR: 0, ACCOUNTED_DR: 880000, ACCOUNTED_CR: 0, CURRENCY_CODE: 'JPY', DESCRIPTION: '[AR] AR-2026-001 売掛金', GL_SL_LINK_ID: 700004, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 2, APPLICATION_ID: 222, CODE_COMBINATION_ID: 4001, ACCOUNTING_CLASS_CODE: 'REVENUE', ENTERED_DR: 0, ENTERED_CR: 800000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 800000, CURRENCY_CODE: 'JPY', DESCRIPTION: '[AR] AR-2026-001 製品売上高', GL_SL_LINK_ID: 700005, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 3, APPLICATION_ID: 222, CODE_COMBINATION_ID: 2002, ACCOUNTING_CLASS_CODE: 'TAX', ENTERED_DR: 0, ENTERED_CR: 80000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 80000, CURRENCY_CODE: 'JPY', DESCRIPTION: '[AR] AR-2026-001 仮受消費税10%', GL_SL_LINK_ID: 700006, GL_SL_LINK_TABLE: 'XLAJEL' } },
    // FA (600003) - 2 lines: DR 120k = CR 120k
    { _createdAt: 5, data: { AE_HEADER_ID: 600003, AE_LINE_NUM: 1, APPLICATION_ID: 140, CODE_COMBINATION_ID: 5002, ACCOUNTING_CLASS_CODE: 'DEPRN_EXP', ENTERED_DR: 120000, ENTERED_CR: 0, ACCOUNTED_DR: 120000, ACCOUNTED_CR: 0, CURRENCY_CODE: 'JPY', DESCRIPTION: '[FA] FA-2026-001 減価償却費', GL_SL_LINK_ID: 700007, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600003, AE_LINE_NUM: 2, APPLICATION_ID: 140, CODE_COMBINATION_ID: 1004, ACCOUNTING_CLASS_CODE: 'DEPRN_RSV', ENTERED_DR: 0, ENTERED_CR: 120000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 120000, CURRENCY_CODE: 'JPY', DESCRIPTION: '[FA] FA-2026-001 減価償却累計額', GL_SL_LINK_ID: 700008, GL_SL_LINK_TABLE: 'XLAJEL' } },
    // LA (600004) - 2 lines: DR 2.4M = CR 2.4M
    { _createdAt: 5, data: { AE_HEADER_ID: 600004, AE_LINE_NUM: 1, APPLICATION_ID: 10522, CODE_COMBINATION_ID: 1003, ACCOUNTING_CLASS_CODE: 'ROU_ASSET', ENTERED_DR: 2400000, ENTERED_CR: 0, ACCOUNTED_DR: 2400000, ACCOUNTED_CR: 0, CURRENCY_CODE: 'JPY', DESCRIPTION: '[LA] LA-2026-001 使用権資産計上', GL_SL_LINK_ID: 700009, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600004, AE_LINE_NUM: 2, APPLICATION_ID: 10522, CODE_COMBINATION_ID: 2003, ACCOUNTING_CLASS_CODE: 'LEASE_LIABILITY', ENTERED_DR: 0, ENTERED_CR: 2400000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 2400000, CURRENCY_CODE: 'JPY', DESCRIPTION: '[LA] LA-2026-001 リース負債計上', GL_SL_LINK_ID: 700010, GL_SL_LINK_TABLE: 'XLAJEL' } },
    // FAH (600005) - 2 lines: DR 300k = CR 300k (Formula 300 * 1000 & ADR SaaS_USAGE -> 4102)
    { _createdAt: 5, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 1, APPLICATION_ID: 20001, CODE_COMBINATION_ID: 1001, ACCOUNTING_CLASS_CODE: 'RECEIVABLE', ENTERED_DR: 300000, ENTERED_CR: 0, ACCOUNTED_DR: 300000, ACCOUNTED_CR: 0, CURRENCY_CODE: 'JPY', DESCRIPTION: '[FAHクラウド請求] 取引番号:FAH-2026-001 / SaaS_USAGE 株式会社グローバル商事', GL_SL_LINK_ID: 700011, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 5, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 2, APPLICATION_ID: 20001, CODE_COMBINATION_ID: 4002, ACCOUNTING_CLASS_CODE: 'REVENUE', ENTERED_DR: 0, ENTERED_CR: 300000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 300000, CURRENCY_CODE: 'JPY', DESCRIPTION: '[FAHクラウド請求] 取引番号:FAH-2026-001 / SaaS_USAGE 株式会社グローバル商事', GL_SL_LINK_ID: 700012, GL_SL_LINK_TABLE: 'XLAJEL' } }
  ],
  XLA_DISTRIBUTION_LINKS: [
    { _createdAt: 5, data: { APPLICATION_ID: 200, EVENT_ID: 500001, AE_HEADER_ID: 600001, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 11001, UNROUNDED_ENTERED_DR: 500000, UNROUNDED_ENTERED_CR: 0, ALLOC_TO_APPLICATION_ID: 200 } },
    { _createdAt: 5, data: { APPLICATION_ID: 200, EVENT_ID: 500001, AE_HEADER_ID: 600001, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 11002, UNROUNDED_ENTERED_DR: 50000, UNROUNDED_ENTERED_CR: 0, ALLOC_TO_APPLICATION_ID: 200 } },
    { _createdAt: 5, data: { APPLICATION_ID: 200, EVENT_ID: 500001, AE_HEADER_ID: 600001, AE_LINE_NUM: 3, SOURCE_DISTRIBUTION_TYPE: 'AP_INV_DIST', SOURCE_DISTRIBUTION_ID_NUM_1: 11001, UNROUNDED_ENTERED_DR: 0, UNROUNDED_ENTERED_CR: 550000, ALLOC_TO_APPLICATION_ID: 200 } },
    { _createdAt: 5, data: { APPLICATION_ID: 222, EVENT_ID: 500002, AE_HEADER_ID: 600002, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 22001, UNROUNDED_ENTERED_DR: 880000, UNROUNDED_ENTERED_CR: 0, ALLOC_TO_APPLICATION_ID: 222 } },
    { _createdAt: 5, data: { APPLICATION_ID: 222, EVENT_ID: 500002, AE_HEADER_ID: 600002, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 22002, UNROUNDED_ENTERED_DR: 0, UNROUNDED_ENTERED_CR: 800000, ALLOC_TO_APPLICATION_ID: 222 } },
    { _createdAt: 5, data: { APPLICATION_ID: 222, EVENT_ID: 500002, AE_HEADER_ID: 600002, AE_LINE_NUM: 3, SOURCE_DISTRIBUTION_TYPE: 'RA_CUST_TRX_LINE_GL_DIST_ALL', SOURCE_DISTRIBUTION_ID_NUM_1: 22003, UNROUNDED_ENTERED_DR: 0, UNROUNDED_ENTERED_CR: 80000, ALLOC_TO_APPLICATION_ID: 222 } },
    { _createdAt: 5, data: { APPLICATION_ID: 140, EVENT_ID: 500003, AE_HEADER_ID: 600003, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FA_DEPRN_DETAIL', SOURCE_DISTRIBUTION_ID_NUM_1: 32001, UNROUNDED_ENTERED_DR: 120000, UNROUNDED_ENTERED_CR: 0, ALLOC_TO_APPLICATION_ID: 140 } },
    { _createdAt: 5, data: { APPLICATION_ID: 140, EVENT_ID: 500003, AE_HEADER_ID: 600003, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'FA_DEPRN_DETAIL', SOURCE_DISTRIBUTION_ID_NUM_1: 32001, UNROUNDED_ENTERED_DR: 0, UNROUNDED_ENTERED_CR: 120000, ALLOC_TO_APPLICATION_ID: 140 } },
    { _createdAt: 5, data: { APPLICATION_ID: 10522, EVENT_ID: 500004, AE_HEADER_ID: 600004, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 42001, UNROUNDED_ENTERED_DR: 2400000, UNROUNDED_ENTERED_CR: 0, ALLOC_TO_APPLICATION_ID: 10522 } },
    { _createdAt: 5, data: { APPLICATION_ID: 10522, EVENT_ID: 500004, AE_HEADER_ID: 600004, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'FLA_ACCOUNTING_LINES', SOURCE_DISTRIBUTION_ID_NUM_1: 42001, UNROUNDED_ENTERED_DR: 0, UNROUNDED_ENTERED_CR: 2400000, ALLOC_TO_APPLICATION_ID: 10522 } },
    { _createdAt: 5, data: { APPLICATION_ID: 20001, EVENT_ID: 500005, AE_HEADER_ID: 600005, AE_LINE_NUM: 1, SOURCE_DISTRIBUTION_TYPE: 'XX_CLOUD_BILLING_L', SOURCE_DISTRIBUTION_ID_NUM_1: 1, UNROUNDED_ENTERED_DR: 300000, UNROUNDED_ENTERED_CR: 0, ALLOC_TO_APPLICATION_ID: 20001 } },
    { _createdAt: 5, data: { APPLICATION_ID: 20001, EVENT_ID: 500005, AE_HEADER_ID: 600005, AE_LINE_NUM: 2, SOURCE_DISTRIBUTION_TYPE: 'XX_CLOUD_BILLING_L', SOURCE_DISTRIBUTION_ID_NUM_1: 1, UNROUNDED_ENTERED_DR: 0, UNROUNDED_ENTERED_CR: 300000, ALLOC_TO_APPLICATION_ID: 20001 } }
  ],
  XLA_AE_LINE_ACS: [
    // AP (600001): 残高有 + 残高無 (主要明細)
    { _createdAt: 6, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'テックサポート株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'AP_PORTAL', AC2: 'EXT-AP-771', AC3: '2026-05-10', AC4: '10', AC5: '50000' } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'テックサポート株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 3, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'テックサポート株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600001, AE_LINE_NUM: 3, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'AP_PORTAL', AC2: 'AP-2026-001', AC3: '2026-05-10', AC4: '1', AC5: '550000' } },
    // AR (600002): 相手先 = 株式会社グローバル商事 (FAHと同一相手先！)
    { _createdAt: 6, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'EC_ORDER', AC2: 'AR-2026-001', AC3: '2026-05-12', AC4: '4', AC5: '200000' } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'EC_ORDER', AC2: 'AR-2026-001', AC3: '2026-05-12', AC4: '4', AC5: '200000' } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600002, AE_LINE_NUM: 3, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', AC2: null, AC3: null, AC4: null, AC5: null } },
    // FA (600003)
    { _createdAt: 6, data: { AE_HEADER_ID: 600003, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'ジャパンITインフラ株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600003, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'ASSET_MGR', AC2: 'FA-2026-001', AC3: '2031-03-31', AC4: '2', AC5: '60000' } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600003, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'ジャパンITインフラ株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
    // LA (600004)
    { _createdAt: 6, data: { AE_HEADER_ID: 600004, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '東京不動産リース株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600004, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'LEASE_SYS', AC2: 'LA-2026-001', AC3: '2029-03-31', AC4: '12', AC5: '200000' } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600004, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '東京不動産リース株式会社', AC2: null, AC3: null, AC4: null, AC5: null } },
    // FAH (600005): 相手先 = 株式会社グローバル商事 (ARと同一相手先！) + 残高無5項目フルセット
    { _createdAt: 6, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 1, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'POS_BILLING', AC2: 'EXT-2026-0891', AC3: '2026-05-31', AC4: '300', AC5: '1000' } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', AC2: null, AC3: null, AC4: null, AC5: null } },
    { _createdAt: 6, data: { AE_HEADER_ID: 600005, AE_LINE_NUM: 2, ANALYTICAL_CRITERION_CODE: 'SR_EXT_TRACE', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'POS_BILLING', AC2: 'EXT-2026-0891', AC3: '2026-05-31', AC4: '300', AC5: '1000' } }
  ],
  XLA_AC_BALANCES: [
    // ★ 残高有 (SR_COUNTERPARTY) のみ集計される！ AR(880,000) + FAH(300,000) = 1,180,000 が CCID=1001×株式会社グローバル商事 で統合！
    { _createdAt: 6, data: { APPLICATION_ID: 200, LEDGER_ID: 300001, CODE_COMBINATION_ID: 5001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'テックサポート株式会社', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 500000, PERIOD_BALANCE_CR: 0 } },
    { _createdAt: 6, data: { APPLICATION_ID: 200, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1002, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'テックサポート株式会社', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 50000, PERIOD_BALANCE_CR: 0 } },
    { _createdAt: 6, data: { APPLICATION_ID: 200, LEDGER_ID: 300001, CODE_COMBINATION_ID: 2001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'テックサポート株式会社', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 550000 } },
    { _createdAt: 6, data: { APPLICATION_ID: 222, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 880000, PERIOD_BALANCE_CR: 0 } },
    { _createdAt: 6, data: { APPLICATION_ID: 222, LEDGER_ID: 300001, CODE_COMBINATION_ID: 4001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 800000 } },
    { _createdAt: 6, data: { APPLICATION_ID: 222, LEDGER_ID: 300001, CODE_COMBINATION_ID: 2002, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 80000 } },
    { _createdAt: 6, data: { APPLICATION_ID: 140, LEDGER_ID: 300001, CODE_COMBINATION_ID: 5002, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'ジャパンITインフラ株式会社', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 120000, PERIOD_BALANCE_CR: 0 } },
    { _createdAt: 6, data: { APPLICATION_ID: 140, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1004, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: 'ジャパンITインフラ株式会社', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 120000 } },
    { _createdAt: 6, data: { APPLICATION_ID: 10522, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1003, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '東京不動産リース株式会社', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 2400000, PERIOD_BALANCE_CR: 0 } },
    { _createdAt: 6, data: { APPLICATION_ID: 10522, LEDGER_ID: 300001, CODE_COMBINATION_ID: 2003, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '東京不動産リース株式会社', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 2400000 } },
    { _createdAt: 6, data: { APPLICATION_ID: 20001, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 300000, PERIOD_BALANCE_CR: 0 } },
    { _createdAt: 6, data: { APPLICATION_ID: 20001, LEDGER_ID: 300001, CODE_COMBINATION_ID: 4002, ANALYTICAL_CRITERION_CODE: 'SR_COUNTERPARTY', ANALYTICAL_CRITERION_TYPE_CODE: 'C', AMB_CONTEXT_CODE: 'DEFAULT', AC1: '株式会社グローバル商事', PERIOD_NAME: '2026-04', CURRENCY_CODE: 'JPY', BEGINNING_BALANCE_DR: 0, BEGINNING_BALANCE_CR: 0, PERIOD_BALANCE_DR: 0, PERIOD_BALANCE_CR: 300000 } }
  ],

  // === F. GL_LEDGER ===
  GL_INTERFACE: [
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-10', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Payables', USER_JE_CATEGORY_NAME: 'Purchase Invoices', CODE_COMBINATION_ID: 5001, ENTERED_DR: 500000, ENTERED_CR: 0, ACCOUNTED_DR: 500000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700001, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-10', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Payables', USER_JE_CATEGORY_NAME: 'Purchase Invoices', CODE_COMBINATION_ID: 1002, ENTERED_DR: 50000, ENTERED_CR: 0, ACCOUNTED_DR: 50000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700002, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-10', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Payables', USER_JE_CATEGORY_NAME: 'Purchase Invoices', CODE_COMBINATION_ID: 2001, ENTERED_DR: 0, ENTERED_CR: 550000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 550000, GL_SL_LINK_ID: 700003, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-12', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Receivables', USER_JE_CATEGORY_NAME: 'Sales Invoices', CODE_COMBINATION_ID: 1001, ENTERED_DR: 880000, ENTERED_CR: 0, ACCOUNTED_DR: 880000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700004, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-12', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Receivables', USER_JE_CATEGORY_NAME: 'Sales Invoices', CODE_COMBINATION_ID: 4001, ENTERED_DR: 0, ENTERED_CR: 800000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 800000, GL_SL_LINK_ID: 700005, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-12', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Receivables', USER_JE_CATEGORY_NAME: 'Sales Invoices', CODE_COMBINATION_ID: 2002, ENTERED_DR: 0, ENTERED_CR: 80000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 80000, GL_SL_LINK_ID: 700006, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-30', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Assets', USER_JE_CATEGORY_NAME: 'Depreciation', CODE_COMBINATION_ID: 5002, ENTERED_DR: 120000, ENTERED_CR: 0, ACCOUNTED_DR: 120000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700007, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-30', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Assets', USER_JE_CATEGORY_NAME: 'Depreciation', CODE_COMBINATION_ID: 1004, ENTERED_DR: 0, ENTERED_CR: 120000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 120000, GL_SL_LINK_ID: 700008, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-01', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Lease Accounting', USER_JE_CATEGORY_NAME: 'Lease Accounting', CODE_COMBINATION_ID: 1003, ENTERED_DR: 2400000, ENTERED_CR: 0, ACCOUNTED_DR: 2400000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700009, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-01', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'Lease Accounting', USER_JE_CATEGORY_NAME: 'Lease Accounting', CODE_COMBINATION_ID: 2003, ENTERED_DR: 0, ENTERED_CR: 2400000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 2400000, GL_SL_LINK_ID: 700010, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-20', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'XX Cloud Billing Hub', USER_JE_CATEGORY_NAME: 'Cloud Billing', CODE_COMBINATION_ID: 1001, ENTERED_DR: 300000, ENTERED_CR: 0, ACCOUNTED_DR: 300000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700011, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } },
    { _createdAt: 7, data: { STATUS: 'PROCESSED', LEDGER_ID: 300001, ACCOUNTING_DATE: '2026-04-20', CURRENCY_CODE: 'JPY', USER_JE_SOURCE_NAME: 'XX Cloud Billing Hub', USER_JE_CATEGORY_NAME: 'Cloud Billing', CODE_COMBINATION_ID: 4002, ENTERED_DR: 0, ENTERED_CR: 300000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 300000, GL_SL_LINK_ID: 700012, GL_SL_LINK_TABLE: 'XLAJEL', GROUP_ID: 88001 } }
  ],
  GL_JE_BATCHES: [
    {
      _createdAt: 7,
      data: { JE_BATCH_ID: 80001, NAME: 'SLA 5大サブ元帳統合転記 2026-04-30', STATUS: 'U', POSTED_DATE: null, DEFAULT_PERIOD_NAME: '2026-04', RUNNING_TOTAL_ACCOUNTED_DR: 4250000, RUNNING_TOTAL_ACCOUNTED_CR: 4250000 },
      _updates: { 8: { STATUS: 'P', POSTED_DATE: '2026-04-30' } }
    }
  ],
  GL_JE_HEADERS: [
    { _createdAt: 7, data: { JE_HEADER_ID: 81001, JE_BATCH_ID: 80001, LEDGER_ID: 300001, JE_SOURCE: 'Payables', JE_CATEGORY: 'Purchase Invoices', NAME: 'AP 買掛請求計上', PERIOD_NAME: '2026-04', STATUS: 'U', POSTED_DATE: null, RUNNING_TOTAL_DR: 550000, RUNNING_TOTAL_CR: 550000 }, _updates: { 8: { STATUS: 'P', POSTED_DATE: '2026-04-30' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81002, JE_BATCH_ID: 80001, LEDGER_ID: 300001, JE_SOURCE: 'Receivables', JE_CATEGORY: 'Sales Invoices', NAME: 'AR 売掛請求計上', PERIOD_NAME: '2026-04', STATUS: 'U', POSTED_DATE: null, RUNNING_TOTAL_DR: 880000, RUNNING_TOTAL_CR: 880000 }, _updates: { 8: { STATUS: 'P', POSTED_DATE: '2026-04-30' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81003, JE_BATCH_ID: 80001, LEDGER_ID: 300001, JE_SOURCE: 'Assets', JE_CATEGORY: 'Depreciation', NAME: 'FA 月次減価償却', PERIOD_NAME: '2026-04', STATUS: 'U', POSTED_DATE: null, RUNNING_TOTAL_DR: 120000, RUNNING_TOTAL_CR: 120000 }, _updates: { 8: { STATUS: 'P', POSTED_DATE: '2026-04-30' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81004, JE_BATCH_ID: 80001, LEDGER_ID: 300001, JE_SOURCE: 'Lease Accounting', JE_CATEGORY: 'Lease Accounting', NAME: 'LA 使用権資産計上', PERIOD_NAME: '2026-04', STATUS: 'U', POSTED_DATE: null, RUNNING_TOTAL_DR: 2400000, RUNNING_TOTAL_CR: 2400000 }, _updates: { 8: { STATUS: 'P', POSTED_DATE: '2026-04-30' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81005, JE_BATCH_ID: 80001, LEDGER_ID: 300001, JE_SOURCE: 'XX Cloud Billing Hub', JE_CATEGORY: 'Cloud Billing', NAME: 'FAH クラウド収益計上', PERIOD_NAME: '2026-04', STATUS: 'U', POSTED_DATE: null, RUNNING_TOTAL_DR: 300000, RUNNING_TOTAL_CR: 300000 }, _updates: { 8: { STATUS: 'P', POSTED_DATE: '2026-04-30' } } }
  ],
  GL_JE_LINES: [
    { _createdAt: 7, data: { JE_HEADER_ID: 81001, JE_LINE_NUM: 1, LEDGER_ID: 300001, CODE_COMBINATION_ID: 5001, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 500000, ENTERED_CR: 0, ACCOUNTED_DR: 500000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700001, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81001, JE_LINE_NUM: 2, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1002, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 50000, ENTERED_CR: 0, ACCOUNTED_DR: 50000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700002, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81001, JE_LINE_NUM: 3, LEDGER_ID: 300001, CODE_COMBINATION_ID: 2001, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 0, ENTERED_CR: 550000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 550000, GL_SL_LINK_ID: 700003, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81002, JE_LINE_NUM: 1, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 880000, ENTERED_CR: 0, ACCOUNTED_DR: 880000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700004, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81002, JE_LINE_NUM: 2, LEDGER_ID: 300001, CODE_COMBINATION_ID: 4001, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 0, ENTERED_CR: 800000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 800000, GL_SL_LINK_ID: 700005, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81002, JE_LINE_NUM: 3, LEDGER_ID: 300001, CODE_COMBINATION_ID: 2002, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 0, ENTERED_CR: 80000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 80000, GL_SL_LINK_ID: 700006, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81003, JE_LINE_NUM: 1, LEDGER_ID: 300001, CODE_COMBINATION_ID: 5002, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 120000, ENTERED_CR: 0, ACCOUNTED_DR: 120000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700007, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81003, JE_LINE_NUM: 2, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1004, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 0, ENTERED_CR: 120000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 120000, GL_SL_LINK_ID: 700008, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81004, JE_LINE_NUM: 1, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1003, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 2400000, ENTERED_CR: 0, ACCOUNTED_DR: 2400000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700009, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81004, JE_LINE_NUM: 2, LEDGER_ID: 300001, CODE_COMBINATION_ID: 2003, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 0, ENTERED_CR: 2400000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 2400000, GL_SL_LINK_ID: 700010, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81005, JE_LINE_NUM: 1, LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 300000, ENTERED_CR: 0, ACCOUNTED_DR: 300000, ACCOUNTED_CR: 0, GL_SL_LINK_ID: 700011, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } },
    { _createdAt: 7, data: { JE_HEADER_ID: 81005, JE_LINE_NUM: 2, LEDGER_ID: 300001, CODE_COMBINATION_ID: 4002, PERIOD_NAME: '2026-04', STATUS: 'U', ENTERED_DR: 0, ENTERED_CR: 300000, ACCOUNTED_DR: 0, ACCOUNTED_CR: 300000, GL_SL_LINK_ID: 700012, GL_SL_LINK_TABLE: 'XLAJEL' }, _updates: { 8: { STATUS: 'P' } } }
  ],
  GL_IMPORT_REFERENCES: [
    { _createdAt: 7, data: { JE_BATCH_ID: 80001, JE_HEADER_ID: 81001, JE_LINE_NUM: 1, SUBLEDGER_DOC_SEQUENCE_VALUE: 500001, GL_SL_LINK_ID: 700001, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 7, data: { JE_BATCH_ID: 80001, JE_HEADER_ID: 81002, JE_LINE_NUM: 1, SUBLEDGER_DOC_SEQUENCE_VALUE: 500002, GL_SL_LINK_ID: 700004, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 7, data: { JE_BATCH_ID: 80001, JE_HEADER_ID: 81003, JE_LINE_NUM: 1, SUBLEDGER_DOC_SEQUENCE_VALUE: 500003, GL_SL_LINK_ID: 700007, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 7, data: { JE_BATCH_ID: 80001, JE_HEADER_ID: 81004, JE_LINE_NUM: 1, SUBLEDGER_DOC_SEQUENCE_VALUE: 500004, GL_SL_LINK_ID: 700009, GL_SL_LINK_TABLE: 'XLAJEL' } },
    { _createdAt: 7, data: { JE_BATCH_ID: 80001, JE_HEADER_ID: 81005, JE_LINE_NUM: 1, SUBLEDGER_DOC_SEQUENCE_VALUE: 500005, GL_SL_LINK_ID: 700011, GL_SL_LINK_TABLE: 'XLAJEL' } }
  ],
  GL_BALANCES: [
    // Total PERIOD_NET_DR = 4,250,000 / Total PERIOD_NET_CR = 4,250,000
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 1001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 1180000, PERIOD_NET_CR: 0 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 1002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 50000, PERIOD_NET_CR: 0 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 1003, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 2400000, PERIOD_NET_CR: 0 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 1004, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 120000 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 2001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 550000 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 2002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 80000 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 2003, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 2400000 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 4001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 800000 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 4002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 0, PERIOD_NET_CR: 300000 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 5001, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 500000, PERIOD_NET_CR: 0 } },
    { _createdAt: 8, data: { LEDGER_ID: 300001, CODE_COMBINATION_ID: 5002, CURRENCY_CODE: 'JPY', PERIOD_NAME: '2026-04', ACTUAL_FLAG: 'A', BEGIN_BALANCE_DR: 0, BEGIN_BALANCE_CR: 0, PERIOD_NET_DR: 120000, PERIOD_NET_CR: 0 } }
  ]
};

// 全9ステップ (STEP 0 〜 STEP 8) フロー定義
const STEPS = [
  {
    index: 0, code: 'S0', shortTitle: '組織・AFF・FAH登録', date: '事前設定①',
    title: 'STEP 0: 組織・AFF 9セグメント体系・FAHアプリケーション基盤セットアップ',
    subtitle: '法的エンティティ・元帳・9軸COA登録と、5大サブ元帳＋FAHイベント/ソース/I/F定義',
    description: [
      'プライマリ元帳 (JP_CORP_LEDGER, LEDGER_ID=300001) および AFF 9セグメント体系（会社-部門-勘定科目-補助科目-税コード-管理コード-備考1-備考2-備考3）を定義します。',
      'XLA_SUBLEDGERS / XLA_EVENT_CLASSES_B / XLA_EVENT_TYPES_B に標準4サブ元帳 (AP/AR/FA/LA) と併せて外部システム用 FAH (XX_FAH_CLOUD / 20001) を登録します。',
      'XLA_SOURCES_B に FAH ヘッダ属性 (相手先/外部請求書番号/満期日) と明細属性 (外部システム/サービス種別/数量/単価) を定義し、XLA_TRANSACTION_INT_CONTROLS で結合取込を有効化します。'
    ],
    insertedTables: [
      'XLE_ENTITY_PROFILES', 'HR_ALL_ORGANIZATION_UNITS_F', 'GL_LEDGERS', 'GL_PERIOD_STATUSES', 'FND_ID_FLEX_SEGMENTS', 'GL_CODE_COMBINATIONS',
      'XLA_SUBLEDGERS', 'XLA_EVENT_CLASSES_B', 'XLA_EVENT_TYPES_B', 'XLA_SOURCES_B', 'XLA_TRANSACTION_INT_CONTROLS'
    ],
    updatedTables: [],
    referencedTables: [],
    activeFlows: [
      { from: 'XLE_ENTITY_PROFILES', to: 'GL_LEDGERS', label: 'LE_01設定' },
      { from: 'FND_ID_FLEX_SEGMENTS', to: 'GL_CODE_COMBINATIONS', label: 'AFF9セグメント検証' },
      { from: 'XLA_SUBLEDGERS', to: 'XLA_EVENT_CLASSES_B', label: 'FAH(20001)登録' },
      { from: 'XLA_EVENT_CLASSES_B', to: 'XLA_EVENT_TYPES_B', label: 'XX_CLOUD_REV_RECOG' },
      { from: 'XLA_SUBLEDGERS', to: 'XLA_SOURCES_B', label: 'CUSTOM SOURCE' },
      { from: 'XLA_SUBLEDGERS', to: 'XLA_TRANSACTION_INT_CONTROLS', label: 'I/F取込設定' }
    ],
    flagChanges: [
      'GL_PERIOD_STATUSES.CLOSING_STATUS = "O" (2026-04 オープン)',
      'XLA_SUBLEDGERS: AP(200), AR(222), FA(140), LA(10522), FAH(20001) 登録完了',
      'XLA_TRANSACTION_INT_CONTROLS.COMBINED_IMPORT_AND_LOAD_FLAG = "Y"'
    ],
    journalPreview: {
      caption: '仕訳データ未生成（基盤・AFF・FAHメタデータ定義フェーズ）',
      lines: [
        { side: 'NET0', aff: 'JP_COA_9SEG (CHART_OF_ACCOUNTS_ID=101)', name: 'AFF 9セグメント＋CCID 11勘定＋FAHソース登録済', amt: '0円' }
      ]
    },
    focusSetupScreenId: 'SCR_FAH'
  },
  {
    index: 1, code: 'S1', shortTitle: '算式・MapSet・ADR設定', date: '事前設定②',
    title: 'STEP 1: SLAルール(AMB前半) — ユーザー定義算式・マッピングセット・ADR・条件・摘要',
    subtitle: '金額自動算出の算式、サービス→勘定科目変換テーブル、条件付きADR・摘要をテーブル構築',
    description: [
      'XLA_FORMULAS_B / XLA_FORMULA_DETAILS に「数量(LINE_NUMBER1) * 単価(LINE_NUMBER2)」のユーザー定義算式 XX_FAH_LINE_AMT_FML を構築します。',
      'XLA_MAPPING_SETS_B / VALUES に「SaaS_USAGE → 4102 (クラウドサービス収益)」の変換表を登録します。',
      'XLA_SEG_RULES_B / DETAILS と XLA_CONDITIONS により「LINE_CHAR2 IS NOT NULL ならマッピングセット XX_FAH_SVC_ACCT_MAP を参照」する勘定科目ルール XX_FAH_REV_ACCT_ADR、及び摘要ルール XX_FAH_LINE_DESC を登録します。'
    ],
    insertedTables: [
      'XLA_FORMULAS_B', 'XLA_FORMULA_DETAILS', 'XLA_MAPPING_SETS_B', 'XLA_MAPPING_SET_VALUES',
      'XLA_SEG_RULES_B', 'XLA_SEG_RULE_DETAILS', 'XLA_CONDITIONS', 'XLA_DESCRIPTIONS_B'
    ],
    updatedTables: [],
    referencedTables: ['XLA_SOURCES_B'],
    activeFlows: [
      { from: 'XLA_SOURCES_B', to: 'XLA_FORMULA_DETAILS', label: 'LINE_NUM1*NUM2' },
      { from: 'XLA_FORMULAS_B', to: 'XLA_FORMULA_DETAILS', label: 'XX_FAH_LINE_AMT_FML' },
      { from: 'XLA_MAPPING_SETS_B', to: 'XLA_MAPPING_SET_VALUES', label: 'SaaS_USAGE→4102' },
      { from: 'XLA_MAPPING_SETS_B', to: 'XLA_SEG_RULE_DETAILS', label: 'MapSet参照' },
      { from: 'XLA_SEG_RULES_B', to: 'XLA_SEG_RULE_DETAILS', label: 'ADR構成' },
      { from: 'XLA_SEG_RULE_DETAILS', to: 'XLA_CONDITIONS', label: '適用条件紐付' }
    ],
    flagChanges: [
      'XLA_FORMULA_DETAILS: POSTFIX_EXPR = "LINE_NUMBER1", "LINE_NUMBER2", "*"',
      'XLA_MAPPING_SET_VALUES: "SaaS_USAGE" → SEGMENT3 = "4102"',
      'XLA_CONDITIONS: LINE_CHAR2 IS NOT NULL (ADR優先順10)'
    ],
    journalPreview: {
      caption: 'ルール部品構築（算式・MapSet・ADR・摘要の作成段階）',
      lines: [
        { side: 'NET0', aff: 'XX_FAH_LINE_AMT_FML', name: '算式: LINE_NUMBER1 * LINE_NUMBER2', amt: '部品定義' },
        { side: 'NET0', aff: 'XX_FAH_SVC_ACCT_MAP', name: 'MapSet: SaaS_USAGE → 4102 / CONS_SVC → 4103', amt: '部品定義' }
      ]
    },
    focusSetupScreenId: 'SCR_FORMULA'
  },
  {
    index: 2, code: 'S2', shortTitle: 'JLT・SR・JERS・会計設定', date: '事前設定③',
    title: 'STEP 2: SLAルール(AMB後半) — JLT・サポート参照(残高有/無)・JERS・会計方式・元帳設定',
    subtitle: '残高有(相手先)＆残高無(5項目)のサポート参照をJERSへ割当、XX_JP_CORP_AMを元帳に有効化',
    description: [
      'XLA_ACCT_LINE_TYPES_B / XLA_JLT_ACCT_ATTRS で借方(RECEIVABLE)・貸方(REVENUE)JLTを作成し、ENTERED_AMOUNTに先ほどの算式 XX_FAH_LINE_AMT_FML を割り当てます。',
      'XLA_ANALYTICAL_HDRS_B / DTLS_B / SOURCES にて 残高有サポート参照 SR_COUNTERPARTY (BALANCING_FLAG="Y", AC1=相手先を5サブ元帳から正規化) と、残高無サポート参照 SR_EXT_TRACE (BALANCING_FLAG="N", AC1〜AC5: 外部システム・外部請求書番号・満期日・数量・単価) を定義します。',
      'XLA_LINE_DEFINITIONS_B (JERS) に JLT / ADR / サポート参照を統合 (VALIDATION_STATUS_CODE="C") し、XLA_ACCTG_METHODS_B / RULES 経由で GL_LEDGERS と XLA_LEDGER_OPTIONS (GL転送モード="D", 自動転記="Y") を有効化します。'
    ],
    insertedTables: [
      'XLA_ACCT_LINE_TYPES_B', 'XLA_JLT_ACCT_ATTRS', 'XLA_ANALYTICAL_HDRS_B', 'XLA_ANALYTICAL_DTLS_B', 'XLA_ANALYTICAL_SOURCES',
      'XLA_LINE_DEFINITIONS_B', 'XLA_LINE_DEFN_JLT_ASSGNS', 'XLA_LINE_DEFN_ADR_ASSGNS', 'XLA_LINE_DEFN_AC_ASSGNS',
      'XLA_ACCTG_METHODS_B', 'XLA_ACCTG_METHOD_RULES', 'XLA_LEDGER_OPTIONS'
    ],
    updatedTables: ['GL_LEDGERS'],
    referencedTables: ['XLA_FORMULAS_B', 'XLA_SEG_RULES_B', 'XLA_DESCRIPTIONS_B', 'XLA_EVENT_TYPES_B'],
    activeFlows: [
      { from: 'XLA_FORMULAS_B', to: 'XLA_JLT_ACCT_ATTRS', label: '算式→金額属性' },
      { from: 'XLA_ANALYTICAL_HDRS_B', to: 'XLA_ANALYTICAL_DTLS_B', label: '残高有Y/無N' },
      { from: 'XLA_ANALYTICAL_DTLS_B', to: 'XLA_ANALYTICAL_SOURCES', label: '5サブ元帳ソース統合' },
      { from: 'XLA_LINE_DEFINITIONS_B', to: 'XLA_LINE_DEFN_JLT_ASSGNS', label: 'JLT＆摘要割当' },
      { from: 'XLA_LINE_DEFINITIONS_B', to: 'XLA_LINE_DEFN_ADR_ASSGNS', label: '9セグメントADR' },
      { from: 'XLA_LINE_DEFINITIONS_B', to: 'XLA_LINE_DEFN_AC_ASSGNS', label: 'SR割当(Y/N)' },
      { from: 'XLA_ACCTG_METHODS_B', to: 'XLA_ACCTG_METHOD_RULES', label: '5サブ元帳JERS統合' },
      { from: 'GL_LEDGERS', to: 'XLA_ACCTG_METHODS_B', label: 'XX_JP_CORP_AM適用' }
    ],
    flagChanges: [
      'GL_LEDGERS.SLA_ACCOUNTING_METHOD_CODE: STANDARD_ACCRUAL → "XX_JP_CORP_AM"',
      'XLA_ANALYTICAL_HDRS_B: SR_COUNTERPARTY (BALANCING_FLAG="Y") / SR_EXT_TRACE (BALANCING_FLAG="N")',
      'XLA_LINE_DEFINITIONS_B.VALIDATION_STATUS_CODE = "C" (コンパイル完了)',
      'XLA_LEDGER_OPTIONS: TRANSFER_TO_GL_MODE_CODE="D", ENABLE_SUBMIT_POSTING_FLAG="Y"'
    ],
    journalPreview: {
      caption: 'SLA全セットアップ完了・有効化済み（全5サブ元帳トランザクション受入準備完了）',
      lines: [
        { side: 'NET0', aff: 'SR_COUNTERPARTY (残高有)', name: 'AC1: 相手先 (5サブ元帳横断正規化)', amt: 'BAL=Y' },
        { side: 'NET0', aff: 'SR_EXT_TRACE (残高無)', name: 'AC1:外部Sys / AC2:外部請求 / AC3:満期日 / AC4:数量 / AC5:単価', amt: 'BAL=N' }
      ]
    },
    focusSetupScreenId: 'SCR_SR'
  },
  {
    index: 3, code: 'S3', shortTitle: '4大サブ元帳取引', date: '2026-04-01〜30',
    title: 'STEP 3: 4大サブ元帳トランザクション計上 (AP · AR · FA · LA) ＆ 会計イベント起票',
    subtitle: '買掛(AP)・売掛(AR)・資産減価償却(FA)・リース(LA)の取引発生と XLA_EVENTS (U) 生成',
    description: [
      '標準4大サブ元帳で取引が確定し、各取引テーブルおよび XLA_TRANSACTION_ENTITIES / XLA_EVENTS (STATUS="U") が作成されます。',
      'AP(200): 外注費 500,000 + 仮払消費税 50,000 = 買掛金 550,000 (相手先: テックサポート株式会社, DFF ATTRIBUTE1/2にも保持)。',
      'AR(222): 売掛金 880,000 = 製品売上 800,000 + 仮受消費税 80,000 (相手先: 株式会社グローバル商事)。',
      'FA(140): サーバー機器の月次減価償却 120,000。 LA(10522): 本社オフィス使用権資産/リース負債 2,400,000。'
    ],
    insertedTables: [
      'AP_INVOICES_ALL', 'AP_INVOICE_DISTRIBUTIONS_ALL',
      'RA_CUSTOMER_TRX_ALL', 'RA_CUSTOMER_TRX_LINES_ALL', 'RA_CUST_TRX_LINE_GL_DIST_ALL',
      'FA_ADDITIONS_B', 'FA_TRANSACTION_HEADERS', 'FA_DEPRN_DETAIL',
      'FLA_LEASES_ALL', 'FLA_ACCOUNTING_HEADERS_ALL', 'FLA_ACCOUNTING_LINES',
      'XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS'
    ],
    updatedTables: [],
    referencedTables: ['XLE_ENTITY_PROFILES', 'HR_ALL_ORGANIZATION_UNITS_F', 'XLA_EVENT_TYPES_B'],
    activeFlows: [
      { from: 'AP_INVOICES_ALL', to: 'AP_INVOICE_DISTRIBUTIONS_ALL', label: 'AP請求 550k' },
      { from: 'RA_CUSTOMER_TRX_ALL', to: 'RA_CUSTOMER_TRX_LINES_ALL', label: 'AR請求 880k' },
      { from: 'RA_CUSTOMER_TRX_LINES_ALL', to: 'RA_CUST_TRX_LINE_GL_DIST_ALL', label: 'GL配賦生成' },
      { from: 'FA_ADDITIONS_B', to: 'FA_DEPRN_DETAIL', label: 'FA償却 120k' },
      { from: 'FLA_LEASES_ALL', to: 'FLA_ACCOUNTING_LINES', label: 'LA使用権 2.4M' },
      { from: 'AP_INVOICES_ALL', to: 'XLA_TRANSACTION_ENTITIES', label: 'Entity登録' },
      { from: 'XLA_TRANSACTION_ENTITIES', to: 'XLA_EVENTS', label: 'Event(U)起票' }
    ],
    flagChanges: [
      'AP_INVOICE_DISTRIBUTIONS_ALL.POSTED_FLAG = "N" / FLA_ACCOUNTING_HEADERS_ALL.ACCOUNTED_IN_GL_FLAG = "N"',
      'XLA_EVENTS (500001..500004): EVENT_STATUS_CODE = "U" (未処理), PROCESS_STATUS_CODE = "U"'
    ],
    journalPreview: {
      caption: 'トランザクション予定仕訳額（まだSLA仕訳未作成・イベントはステータス U）',
      lines: [
        { side: 'NET0', aff: 'AP (200) AP-2026-001', name: 'テックサポート(株) / 外注費+税', amt: '550,000円' },
        { side: 'NET0', aff: 'AR (222) AR-2026-001', name: '(株)グローバル商事 / 製品売上+税', amt: '880,000円' },
        { side: 'NET0', aff: 'FA (140) FA-2026-001', name: 'サーバー機器 月次減価償却', amt: '120,000円' },
        { side: 'NET0', aff: 'LA (10522) LA-2026-001', name: '本社オフィス 使用権資産開始', amt: '2,400,000円' }
      ]
    }
  },
  {
    index: 4, code: 'S4', shortTitle: 'FAH取引I/F取込', date: '2026-04-20',
    title: 'STEP 4: FAH 外部システム取引インタフェース投入 ＆ ベース表・イベント作成',
    subtitle: '外部POS_BILLINGから I/F表へ投入 → FAHインポートで XLA_TRANSACTION_HEADERS/LINES & Event 500005 生成',
    description: [
      '外部システム POS_BILLING から取引番号 FAH-2026-001 (相手先: 株式会社グローバル商事, 外部請求書番号: EXT-2026-0891, 満期日: 2026-05-31, 数量: 300, 単価: 1,000, サービス種別: SaaS_USAGE) が XLA_TRANSACTION_HEADERS_INT / LINES_INT へ投入されます。',
      'この時点では金額カラム(NUMBER3)は 0 のままで、後続のSLAユーザー定義算式で計算されます。',
      'FAH取込バッチ (XLA_TRANSACTION_INT_CONTROLS 参照) が実行され、I/F表 STATUS_CODE を NEW → PROCESSED へ更新すると共に、実体表 XLA_TRANSACTION_HEADERS / LINES および XLA_EVENTS (500005, STATUS="U") を生成します。'
    ],
    insertedTables: [
      'XLA_TRANSACTION_HEADERS_INT', 'XLA_TRANSACTION_LINES_INT',
      'XLA_TRANSACTION_HEADERS', 'XLA_TRANSACTION_LINES',
      'XLA_TRANSACTION_ENTITIES', 'XLA_EVENTS'
    ],
    updatedTables: ['XLA_TRANSACTION_HEADERS_INT', 'XLA_TRANSACTION_LINES_INT'],
    referencedTables: ['XLA_TRANSACTION_INT_CONTROLS'],
    activeFlows: [
      { from: 'XLA_TRANSACTION_INT_CONTROLS', to: 'XLA_TRANSACTION_HEADERS_INT', label: 'GROUP取込制御' },
      { from: 'XLA_TRANSACTION_HEADERS_INT', to: 'XLA_TRANSACTION_LINES_INT', label: 'FAH-2026-001' },
      { from: 'XLA_TRANSACTION_HEADERS_INT', to: 'XLA_TRANSACTION_HEADERS', label: 'ヘッダロード' },
      { from: 'XLA_TRANSACTION_LINES_INT', to: 'XLA_TRANSACTION_LINES', label: '明細ロード(数量300/単価1000)' },
      { from: 'XLA_TRANSACTION_HEADERS', to: 'XLA_EVENTS', label: 'Event 500005(U)生成' }
    ],
    flagChanges: [
      'XLA_TRANSACTION_HEADERS_INT / LINES_INT.STATUS_CODE: "NEW" → "PROCESSED"',
      'XLA_TRANSACTION_LINES.NUMBER1=300, NUMBER2=1000, NUMBER3=0 (次ステップ算式で計算)',
      'XLA_EVENTS (500005): EVENT_STATUS_CODE = "U" (5サブ元帳すべてのイベント出揃う)'
    ],
    journalPreview: {
      caption: 'FAH取引ロード完了（金額は数量300×単価1,000から次ステップの算式で自動算出）',
      lines: [
        { side: 'NET0', aff: 'FAH (20001) FAH-2026-001', name: 'POS_BILLING / SaaS_USAGE / QTY:300 × @1,000 / 相手先:(株)グローバル商事', amt: '未計算(0)' }
      ]
    }
  },
  {
    index: 5, code: 'S5', shortTitle: 'Create Acctg①仕訳生成', date: '2026-04-30',
    title: 'STEP 5: 会計の作成 (Create Accounting Step1) — 算式・ADR評価と仕訳ヘッダ/明細生成',
    subtitle: 'AMBルール実行：FAH算式(300×1,000=300,000)＆ADR(4102)導出、5ヘッダ・12仕訳明細(総額4,250,000円)生成',
    description: [
      'XLA_ACCTG_METHODS_B (XX_JP_CORP_AM) 配下の全JERSが 5大サブ元帳の未処理イベント (500001〜500005) を一括評価します。',
      'FAH明細ではユーザー定義算式 XX_FAH_LINE_AMT_FML が 300 × 1,000 = 300,000円 を計算し、ADR XX_FAH_REV_ACCT_ADR がマッピングセット XX_FAH_SVC_ACCT_MAP 経由で「SaaS_USAGE → 4102 (CCID=4002)」の 9セグメントAFF を導出します。',
      'XLA_AE_HEADERS (5件, GL_TRANSFER_STATUS_CODE="N", ACCOUNTING_ENTRY_STATUS_CODE="F")、XLA_AE_LINES (12行, 貸借合計各 4,250,000円)、XLA_DISTRIBUTION_LINKS を生成し、XLA_EVENTS を "P" (処理済) へ更新します。'
    ],
    insertedTables: ['XLA_AE_HEADERS', 'XLA_AE_LINES', 'XLA_DISTRIBUTION_LINKS'],
    updatedTables: ['XLA_EVENTS', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'XLA_TRANSACTION_LINES'],
    referencedTables: [
      'XLA_ACCTG_METHOD_RULES', 'XLA_LINE_DEFINITIONS_B', 'XLA_FORMULAS_B', 'XLA_FORMULA_DETAILS',
      'XLA_SEG_RULES_B', 'XLA_MAPPING_SET_VALUES', 'XLA_ACCT_LINE_TYPES_B', 'GL_CODE_COMBINATIONS'
    ],
    activeFlows: [
      { from: 'XLA_EVENTS', to: 'XLA_AE_HEADERS', label: '5イベント処理(U→P)' },
      { from: 'XLA_AE_HEADERS', to: 'XLA_AE_LINES', label: '12仕訳明細生成' },
      { from: 'GL_CODE_COMBINATIONS', to: 'XLA_AE_LINES', label: '9セグメントCCID解決' },
      { from: 'XLA_AE_LINES', to: 'XLA_DISTRIBUTION_LINKS', label: '元配賦リンク構築' },
      { from: 'AP_INVOICE_DISTRIBUTIONS_ALL', to: 'XLA_DISTRIBUTION_LINKS', label: 'AP紐付' },
      { from: 'RA_CUST_TRX_LINE_GL_DIST_ALL', to: 'XLA_DISTRIBUTION_LINKS', label: 'AR紐付' },
      { from: 'FA_DEPRN_DETAIL', to: 'XLA_DISTRIBUTION_LINKS', label: 'FA紐付' },
      { from: 'FLA_ACCOUNTING_LINES', to: 'XLA_DISTRIBUTION_LINKS', label: 'LA紐付' }
    ],
    flagChanges: [
      'XLA_EVENTS.EVENT_STATUS_CODE / PROCESS_STATUS_CODE: "U" → "P" (処理済)',
      'AP_INVOICE_DISTRIBUTIONS_ALL.POSTED_FLAG: "N" → "S" (会計計上済・GL未転記)',
      'XLA_AE_HEADERS.ACCOUNTING_ENTRY_STATUS_CODE = "F" (確定済), GL_TRANSFER_STATUS_CODE = "N"'
    ],
    journalPreview: {
      caption: 'SLA 5大サブ元帳 仕訳一括生成結果 (DR計 = CR計 = 4,250,000円 / 12明細)',
      lines: [
        { side: 'DR', aff: '01-300-5101-000-10-001-000-000-000', name: '[AP] 外注費 (ITEM)', amt: '500,000円' },
        { side: 'DR', aff: '01-100-1201-000-10-000-000-000-000', name: '[AP] 仮払消費税10%', amt: '50,000円' },
        { side: 'CR', aff: '01-100-2101-001-00-000-000-000-000', name: '[AP] 買掛金', amt: '550,000円' },
        { side: 'DR', aff: '01-100-1101-001-00-000-000-000-000', name: '[AR] 売掛金 ((株)グローバル商事)', amt: '880,000円' },
        { side: 'CR', aff: '01-200-4101-000-10-001-000-000-000', name: '[AR] 製品売上高', amt: '800,000円' },
        { side: 'CR', aff: '01-100-2151-000-10-000-000-000-000', name: '[AR] 仮受消費税10%', amt: '80,000円' },
        { side: 'DR', aff: '01-300-5201-000-00-000-000-000-000', name: '[FA] 減価償却費', amt: '120,000円' },
        { side: 'CR', aff: '01-100-1691-000-00-000-000-000-000', name: '[FA] 減価償却累計額', amt: '120,000円' },
        { side: 'DR', aff: '01-100-1301-000-00-000-000-000-000', name: '[LA] 使用権資産(ROU)', amt: '2,400,000円' },
        { side: 'CR', aff: '01-100-2301-001-00-000-000-000-000', name: '[LA] リース負債', amt: '2,400,000円' },
        { side: 'DR', aff: '01-100-1101-001-00-000-000-000-000', name: '[FAH] 売掛金 ((株)グローバル商事)', amt: '300,000円' },
        { side: 'CR', aff: '01-200-4102-000-00-002-000-000-000', name: '[FAH] クラウド収益(算式300×1000/MapSet 4102)', amt: '300,000円' }
      ]
    }
  },
  {
    index: 6, code: 'S6', shortTitle: 'Create Acctg②SR&残高', date: '2026-04-30',
    title: 'STEP 6: 会計の作成 (Create Accounting Step2) — サポート参照(残高有/無)とXLA_AC_BALANCES集計',
    subtitle: '全明細のサポート参照値を XLA_AE_LINE_ACS へ保存し、残高有(SR_COUNTERPARTY)のみ XLA_AC_BALANCES へ集計',
    description: [
      'XLA_ANALYTICAL_SOURCES に基づき 5サブ元帳のソース値を評価し、XLA_AE_LINE_ACS へサポート参照値を格納します。',
      '残高有サポート参照 SR_COUNTERPARTY (BALANCING_FLAG="Y") は全12明細分の「相手先 (AC1)」を格納し、さらに XLA_AC_BALANCES へ残高行を作成します。',
      '注目ポイント：AR 売掛金 (880,000) と FAH 売掛金 (300,000) は共に CCID=1001 × 相手先「株式会社グローバル商事」であるため、XLA_AC_BALANCES 上でサブ元帳横断合算 1,180,000円 として管理できます！一方、残高無 SR_EXT_TRACE (外部システム/外部請求書番号/満期日/数量/単価) は XLA_AE_LINE_ACS にのみ保持され、XLA_AC_BALANCES は肥大化しません。'
    ],
    insertedTables: ['XLA_AE_LINE_ACS', 'XLA_AC_BALANCES'],
    updatedTables: [],
    referencedTables: ['XLA_AE_LINES', 'XLA_ANALYTICAL_HDRS_B', 'XLA_ANALYTICAL_DTLS_B', 'XLA_ANALYTICAL_SOURCES', 'XLA_LINE_DEFN_AC_ASSGNS'],
    activeFlows: [
      { from: 'XLA_AE_LINES', to: 'XLA_AE_LINE_ACS', label: '残高有＋残高無出力' },
      { from: 'XLA_ANALYTICAL_HDRS_B', to: 'XLA_AE_LINE_ACS', label: 'SR定義適用' },
      { from: 'XLA_AE_LINE_ACS', to: 'XLA_AC_BALANCES', label: 'BALANCING=Yのみ集計' }
    ],
    flagChanges: [
      'XLA_AE_LINE_ACS: 20行生成 (SR_COUNTERPARTY=12行, SR_EXT_TRACE[AC1..AC5]=8行)',
      'XLA_AC_BALANCES: SR_COUNTERPARTY のみ12残高行生成 (SR_EXT_TRACE は残高表へ出力されない！)',
      '相手先横断残高(CCID=1001×(株)グローバル商事): AR 880,000 + FAH 300,000 = 1,180,000円'
    ],
    journalPreview: {
      caption: 'XLA_AC_BALANCES 集計結果 vs 残高無 SR_EXT_TRACE の格納先比較',
      lines: [
        { side: 'DR', aff: 'SR_COUNTERPARTY (BAL=Y)', name: 'CCID 1001 × (株)グローバル商事 (AR:88万 + FAH:30万 合算可能)', amt: '1,180,000円' },
        { side: 'CR', aff: 'SR_COUNTERPARTY (BAL=Y)', name: 'CCID 2001 × テックサポート(株) (AP買掛金残高)', amt: '550,000円' },
        { side: 'CR', aff: 'SR_COUNTERPARTY (BAL=Y)', name: 'CCID 2003 × 東京不動産リース(株) (LAリース負債)', amt: '2,400,000円' },
        { side: 'NET0', aff: 'SR_EXT_TRACE (BAL=N)', name: 'AC1:POS_BILLING / AC2:EXT-2026-0891 / AC3:2026-05-31 / AC4:300 / AC5:1000', amt: 'AC_BALANCES対象外' }
      ]
    },
    focusSetupScreenId: 'SCR_SR'
  },
  {
    index: 7, code: 'S7', shortTitle: 'GL転送 & インポート', date: '2026-04-30',
    title: 'STEP 7: GL転送 (Transfer Journal Entries to GL) ＆ ジャーナル・インポート実行',
    subtitle: 'XLA_AE_LINES → GL_INTERFACE → GL_JE_BATCHES / HEADERS / LINES / IMPORT_REFERENCES 生成',
    description: [
      'XLA_LEDGER_OPTIONS.TRANSFER_TO_GL_MODE_CODE="D" (Detail) に従い、12本の XLA_AE_LINES が GL_SL_LINK_ID (700001〜700012) 経由で GL_INTERFACE へ転送されます。',
      'XLA_AE_HEADERS.GL_TRANSFER_STATUS_CODE は "N" → "Y" へ、AP/LA側の連携済みフラグも "Y" へ更新されます。',
      'Journal Import が起動し、1つのバッチ GL_JE_BATCHES (80001, STATUS="U") の配下に 5大サブ元帳別ヘッダ GL_JE_HEADERS (81001〜81005) と12明細 GL_JE_LINES、そしてドリルスルー用 GL_IMPORT_REFERENCES を作成します。'
    ],
    insertedTables: ['GL_INTERFACE', 'GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES', 'GL_IMPORT_REFERENCES'],
    updatedTables: ['XLA_AE_HEADERS', 'AP_INVOICE_DISTRIBUTIONS_ALL', 'FLA_ACCOUNTING_HEADERS_ALL'],
    referencedTables: ['XLA_AE_LINES', 'XLA_LEDGER_OPTIONS'],
    activeFlows: [
      { from: 'XLA_AE_LINES', to: 'GL_INTERFACE', label: 'GL_SL_LINK_ID連携' },
      { from: 'GL_INTERFACE', to: 'GL_JE_BATCHES', label: 'Batch 80001(U)' },
      { from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', label: '5サブ元帳Header' },
      { from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', label: '12仕訳明細' },
      { from: 'GL_JE_LINES', to: 'GL_IMPORT_REFERENCES', label: 'SLAドリルスルー参照' }
    ],
    flagChanges: [
      'XLA_AE_HEADERS.GL_TRANSFER_STATUS_CODE: "N" → "Y" (GL転送済)',
      'AP_INVOICE_DISTRIBUTIONS_ALL.POSTED_FLAG: "S" → "Y" / FLA_ACCOUNTING_HEADERS_ALL.ACCOUNTED_IN_GL_FLAG: "N" → "Y"',
      'GL_JE_BATCHES / HEADERS / LINES: STATUS = "U" (未転記 / Unposted)'
    ],
    journalPreview: {
      caption: 'GLジャーナルインポート完了（STATUS="U"：未転記状態 / バッチ 80001）',
      lines: [
        { side: 'NET0', aff: 'BATCH 80001 (STATUS=U)', name: 'Payables(550k) + Receivables(880k) + Assets(120k) + Lease(2.4M) + FAH(300k)', amt: '4,250,000円' }
      ]
    }
  },
  {
    index: 8, code: 'S8', shortTitle: 'GL転記 & 残高確定', date: '2026-04-30',
    title: 'STEP 8: GL転記 (Post Journals) ＆ 一般会計勘定残高 (GL_BALANCES) 更新完結',
    subtitle: 'GLバッチ/ヘッダ/明細ステータスを P (転記済) へ更新し、GL_BALANCES に確定残高 4,250,000円 を反映',
    description: [
      'XLA_LEDGER_OPTIONS.ENABLE_SUBMIT_POSTING_FLAG="Y" により自動起動された GL Posting が GL_JE_BATCHES / HEADERS / LINES の STATUS を "U" → "P" (Posted / POSTED_DATE="2026-04-30") へ更新します。',
      'GL_BALANCES に 11件すべての AFF CCID について 2026-04 期間の確定取引残高 (PERIOD_NET_DR / PERIOD_NET_CR) が計上されます（借方総計 = 貸方総計 = 4,250,000円）。',
      'ここで CCID 1001 (売掛金) 残高は GL_BALANCES 上では 1,180,000円 と総括表示されますが、SLAサポート参照 (XLA_AC_BALANCES / XLA_AE_LINE_ACS) へドリルダウンすることで相手先別残高や外部請求書番号・数量・単価まで完璧に追跡できる全体アーキテクチャが完成します。'
    ],
    insertedTables: ['GL_BALANCES'],
    updatedTables: ['GL_JE_BATCHES', 'GL_JE_HEADERS', 'GL_JE_LINES'],
    referencedTables: ['GL_BALANCES', 'GL_IMPORT_REFERENCES', 'XLA_AC_BALANCES'],
    activeFlows: [
      { from: 'GL_JE_BATCHES', to: 'GL_JE_HEADERS', label: 'STATUS U→P' },
      { from: 'GL_JE_HEADERS', to: 'GL_JE_LINES', label: 'POSTED確定' },
      { from: 'GL_JE_LINES', to: 'GL_BALANCES', label: '11勘定残高更新(4,250,000円)' }
    ],
    flagChanges: [
      'GL_JE_BATCHES.STATUS: "U" → "P" (POSTED_DATE = 2026-04-30)',
      'GL_JE_HEADERS / GL_JE_LINES.STATUS: "U" → "P" (転記完結)',
      'GL_BALANCES: 11 CCID確定残高計上 (PERIOD_NET_DR合計 = PERIOD_NET_CR合計 = 4,250,000円)'
    ],
    journalPreview: {
      caption: 'GL_BALANCES 最終確定残高（全11勘定科目・貸借完全一致 4,250,000円）',
      lines: [
        { side: 'DR', aff: '01-100-1101-001 (1001)', name: '売掛金 (AR 880,000 + FAH 300,000 合算)', amt: '1,180,000円' },
        { side: 'DR', aff: '01-100-1201-000 (1002)', name: '仮払消費税(10%) [AP]', amt: '50,000円' },
        { side: 'DR', aff: '01-100-1301-000 (1003)', name: '使用権資産(ROU) [LA]', amt: '2,400,000円' },
        { side: 'DR', aff: '01-300-5101-000 (5001)', name: '外注費 [AP]', amt: '500,000円' },
        { side: 'DR', aff: '01-300-5201-000 (5002)', name: '減価償却費 [FA]', amt: '120,000円' },
        { side: 'CR', aff: '01-100-1691-000 (1004)', name: '減価償却累計額 [FA]', amt: '120,000円' },
        { side: 'CR', aff: '01-100-2101-001 (2001)', name: '買掛金 [AP]', amt: '550,000円' },
        { side: 'CR', aff: '01-100-2151-000 (2002)', name: '仮受消費税(10%) [AR]', amt: '80,000円' },
        { side: 'CR', aff: '01-100-2301-001 (2003)', name: 'リース負債 [LA]', amt: '2,400,000円' },
        { side: 'CR', aff: '01-200-4101-000 (4001)', name: '製品売上高 [AR]', amt: '800,000円' },
        { side: 'CR', aff: '01-200-4102-000 (4002)', name: 'クラウドサービス収益 [FAH]', amt: '300,000円' }
      ]
    }
  }
];

function computeStateAtStep(stepIndex) {
  const idx = Math.max(0, Math.min(STEPS.length - 1, stepIndex));
  const step = STEPS[idx];
  const insertedSet = new Set(step.insertedTables || []);
  const updatedSet = new Set(step.updatedTables || []);
  const referencedSet = new Set(step.referencedTables || []);

  const tablesState = {};

  for (const tbl of TABLES) {
    const rawRows = TABLE_RECORDS[tbl.id] || [];
    const activeRows = [];
    let hasInsertThisStep = false;
    let hasUpdateThisStep = false;

    for (const r of rawRows) {
      if (r._createdAt > idx) continue;

      const resolvedData = Object.assign({}, r.data);
      const updatedCols = [];
      let rowState = 'existing';

      if (r._createdAt === idx) {
        rowState = 'inserted';
        hasInsertThisStep = true;
      }

      if (r._updates) {
        const updateSteps = Object.keys(r._updates)
          .map(Number)
          .filter(s => s <= idx)
          .sort((a, b) => a - b);

        for (const uStep of updateSteps) {
          const patch = r._updates[uStep];
          for (const [col, val] of Object.entries(patch)) {
            if (uStep === idx) {
              // Preserve _prev for UI diff rendering
              if (!resolvedData._prev) resolvedData._prev = {};
              resolvedData._prev[col] = resolvedData[col];
              updatedCols.push(col);
            }
            resolvedData[col] = val;
          }
          if (uStep === idx) {
            rowState = rowState === 'inserted' ? 'inserted' : 'updated';
            hasUpdateThisStep = true;
          }
        }
      }

      activeRows.push({
        data: resolvedData,
        rowState,
        updatedCols,
        createdAtStep: r._createdAt
      });
    }

    let tableState = 'not_created';
    if (activeRows.length > 0) {
      if ((hasInsertThisStep || insertedSet.has(tbl.id)) && (hasUpdateThisStep || updatedSet.has(tbl.id))) {
        tableState = 'inserted_updated';
      } else if (hasInsertThisStep || insertedSet.has(tbl.id)) {
        tableState = 'inserted';
      } else if (hasUpdateThisStep || updatedSet.has(tbl.id)) {
        tableState = 'updated';
      } else if (referencedSet.has(tbl.id)) {
        tableState = 'referenced';
      } else {
        tableState = 'existing';
      }
    }

    tablesState[tbl.id] = {
      meta: tbl,
      tableState,
      rows: activeRows
    };
  }

  return { step, tablesState };
}

const FusionSLAData = {
  AFF_SEGMENTS,
  CCID_LIST,
  SETUP_SCREENS,
  SR_VS_DFF_COMPARISON,
  DOMAINS,
  TABLES,
  RELATIONS,
  TABLE_RECORDS,
  STEPS,
  computeStateAtStep
};

if (typeof window !== 'undefined') {
  window.FusionSLAData = FusionSLAData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FusionSLAData;
}
