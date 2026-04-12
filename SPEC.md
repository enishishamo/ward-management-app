# 入院患者管理アプリ 仕様書

> 最終更新: 2026-04-12
> 本文書はアプリの期待動作を定義し、バグ修正とリファクタリングの基準として使用する。

---

## 第1章: 概要

### 1.1 目的

病棟担当医（主に研修医〜若手医師）が入院患者の管理・タスク追跡を行うための単一ユーザー向けWebアプリケーション。

### 1.2 技術スタック

| 要素 | 技術 |
|------|------|
| フロントエンド | React 18.3 + Vite 5.4 |
| バックエンド | Express 5.2（データ永続化サーバー） |
| 言語 | JavaScript (ES Modules)、TypeScript未使用 |
| スタイリング | インラインスタイル（CSSフレームワークなし） |
| データ永続化 | localStorage + JSON file (server.js経由) |

### 1.3 画面構成

```
┌──────────────────────────────────────┐
│ ヘッダー: [🏥 病棟管理] [Dr▾] [＋患者] │
├──────────────────────────────────────┤
│ タブバー: [📋 予定表] [✅ 今日]        │
├──────────────────────────────────────┤
│ メインパネル（タブ切替で表示）         │
│  - 予定表パネル（Schedule）           │
│  - 今日パネル（Today/TODO）           │
└──────────────────────────────────────┘
```

- **デスクトップ** (width >= 768px): タブで予定表/今日を切替。1パネル表示。
- **モバイル** (width < 768px): ボトムナビゲーションで予定表/今日を切替。今日タブはさらにサマリー/カードの2モード。

### 1.4 病棟一覧

`HCU`, `4N`, `4S`, `5N`, `5S`, `6N`, `6S`, `7N`, `7S`（9病棟）

患者はこの順序でソートされる。

---

## 第2章: データモデル定義

### 2.1 日付形式の規約

| 形式 | 用途 | 例 |
|------|------|-----|
| `M/D` | アプリ内部の日付表現（保存・比較） | `"4/12"` |
| `YYYY-MM-DD` | HTML date input との変換用 | `"2026-04-12"` |

**重要な制限事項:**
- `pMD` 関数は **2026年固定** でDateオブジェクトを生成する: `new Date(2026, M-1, D)`
- 先頭ゼロなし（`"4/1"` であり `"04/01"` ではない）
- 年跨ぎは非対応

### 2.2 Patient（患者）

| フィールド | 型 | 必須 | デフォルト | 制約・備考 |
|-----------|-----|------|-----------|-----------|
| `id` | `string` | Yes | `"p_" + Date.now()` | 一意識別子、変更不可 |
| `name` | `string` | Yes | — | 空文字の場合、保存不可 |
| `room` | `string` | Yes | — | WARDS enum のみ。空の場合、保存不可 |
| `age` | `number` | No | `0` | `parseInt()` で変換、NaN → 0 |
| `sex` | `"M"` \| `"F"` | No | `"M"` | |
| `diagnosis` | `string` | No | `""` | |
| `color` | `string` | No | 自動割当 | `red\|blue\|green\|orange\|purple\|teal` から未使用色を先頭から選択 |
| `doctor` | `string` | No | `""` | 既存医師名ボタン or 新規入力 |
| `admitDate` | `string` | No | 当日 (M/D) | 入院日 |
| `height` | `number` | No | `0` | cm。`parseFloat()` で変換。CCr計算に必要 |
| `weight` | `number` | No | `0` | kg。`parseFloat()` で変換 |
| `cr` | `number` | No | `0` | クレアチニン値。`parseFloat()` で変換 |
| `family` | `string` | No | `""` | `"・"` 区切り or 自由記入 |
| `careLevel` | `string` | No | `""` | CARE_LEVELS enum |
| `dischargePlan` | `string` | No | `""` | M/D形式。編集時のみ入力可 |
| `lastFamilyCall` | `string` | No | `""` | M/D形式。編集時のみ入力可 |

**色パレット:** 6色、各色に6属性 (`bg`, `bd`, `tx`, `dt`, `hd`, `bar`)

```
red   → 背景#FEE2E2 / ドット#EF4444
blue  → 背景#DBEAFE / ドット#3B82F6
green → 背景#DCFCE7 / ドット#22C55E
orange→ 背景#FFF7ED / ドット#F97316
purple→ 背景#F3E8FF / ドット#A855F7
teal  → 背景#F0FDFA / ドット#14B8A6
```

**介護度選択肢:** `なし`, `要支援1`, `要支援2`, `要介護1`〜`要介護5`, `申請中`

**家族構成選択肢:** `配偶者`, `子供`, `独居`, `施設入所`, `キーパーソン遠方`

### 2.3 Order（オーダー）

| フィールド | 型 | 用途 | 備考 |
|-----------|-----|------|------|
| `id` | `number` | 一意識別子 | `Date.now()` |
| `type` | `string` | 種別 | 下記enum参照 |
| `name` | `string` | 名称 | 自由入力 |
| `dates` | `string[]` | 実施日一覧 | M/D形式の配列。ドット表示のオーダーで使用 |
| `startDate` | `string\|null` | バー開始日 | abx（抗菌薬）のみ使用 |
| `endDate` | `string\|null` | バー終了日 | abx（抗菌薬）のみ使用 |
| `specimen` | `string` | 培養検体種 | `"血液"\|"尿"\|"痰"` |
| `gramResult` | `string` | グラム染色結果 | 尿・痰のみ入力可 |
| `resultDate` | `string` | 培養結果日 | M/D形式。空文字 = 結果未着 |
| `reportConfirmed` | `boolean` | 画像レポート確認済 | img typeのみ |

**Order type 一覧:**

| type | 表示方式 | 説明 |
|------|---------|------|
| `drip_main` | ドット (dates[]) | メイン点滴 |
| `med` | ドット (dates[]) | 内服薬 |
| `abx` | バー (startDate/endDate) | 抗菌薬。日数カウント表示、黄色背景 |
| `lab` | ドット (dates[]) | 検査 |
| `culture` | ドット (dates[]) + 結果追跡 | 培養。検体種・グラム染色・結果日を持つ |
| `img` | ドット (dates[]) + レポート確認 | 画像検査 |
| `meeting` | ドット (dates[]) | 面談 |
| `consult` | ドット (dates[]) | 他科依頼 |
| `family_call` | ドット (dates[]) | 家族連絡 |
| `rehab_call` | ドット (dates[]) | リハ連絡 |
| `msw_call` | ドット (dates[]) | MSW連絡 |
| `custom_*` | 設定による | ユーザー定義カテゴリ |

**表示方式の違い:**
- **ドット方式:** `dates[]` に含まれる日付のセルに丸ドットを表示。クリックでtoggle。
- **バー方式 (abx):** `startDate`〜`endDate` 間を連続バーで表示。日数カウント付き。クリック操作でstart/endを調整。

### 2.4 TaskDB（日別タスクデータベース）

localStorageキー: `ward_taskDB`

```
{
  "4/12": {          // キー: M/D形式の日付文字列
    am: {            // AMスロット
      "am0_p_1234": TaskCell,  // キー形式: "am{0-4}_{patientId}"
      "am1_p_1234": TaskCell,
      ...
    },
    pm: {            // PMスロット
      "pm0_p_1234": TaskCell,  // キー形式: "pm{0-3}_{patientId}"
      ...
    },
    vitals: {        // バイタル
      "p_1234": { status: "ok"|"flag"|null, memo: "" }
    },
    karte: {         // カルテ記録
      "p_1234": { checked: false, memo: "" }
    }
  }
}
```

- **AMスロット数:** 5 (am0〜am4)
- **PMスロット数:** 4 (pm0〜pm3)

### 2.5 TaskCell（タスクセル）

```javascript
{
  presetId: string|null,  // null = 空スロット
  icon: string|null,      // 絵文字アイコン
  label: string,          // 表示名
  text: string,           // 自由記載テキスト（type="free"のみ使用）
  type: string|null,      // "lab"|"imaging"|"culture"|"free"|"drip_main"|...
  checked: boolean,       // 完了フラグ
  priority: number|null,  // 優先度（1〜99）。null = 未設定
  detail: {},             // lab type: { [LAB_FIELD]: { checked, memo } }
  auto: boolean           // true = ordersから自動生成されたタスク
}
```

**プリセット一覧（PRESETS）:**

| id | icon | label | type |
|----|------|-------|------|
| `lab` | 🩸 | 血液検査確認 | `lab` |
| `img` | 📷 | 画像検査確認 | `imaging` |
| `culture` | 🧫 | 培養確認 | `culture` |
| `rehab_call` | 🏃 | リハさんに電話 | `rehab_call` |
| `msw_call` | 👩‍⚕️ | MSWに電話 | `msw_call` |
| `family_call` | 📞 | 家族に電話 | `family_call` |
| `consult` | 📨 | 他科コンサルト | `consult` |
| `drip` | 💉 | 点滴確認 | `drip_main` |
| `meds` | 💊 | 投薬確認 | (なし) |
| `free` | ✏️ | 自由記載 | `free` |

### 2.6 Consult（上級医相談事項）

localStorageキー: `ward_consults_v2`

```javascript
{
  "p_1234": [               // 患者IDごと
    {
      id: number,           // Date.now()
      text: string,         // 相談内容
      checked: boolean,     // 解決済みフラグ
      urgent: boolean       // 緊急フラグ（🔴表示）
    }
  ]
}
```

### 2.7 Research Labs（ルーチン検査）

localStorageキー: `ward_rLabs_v2`

```javascript
{
  "p_1234": {
    "b12":      { done: boolean, value: string },
    "folate":   { done: boolean, value: string },
    "ferritin": { done: boolean, value: string },
    "tsat":     { done: boolean, value: string },  // TSAT(%) 直接入力
    "tsh":      { done: boolean, value: string },
    "ft4":      { done: boolean, value: string },
    "cortisol": { done: boolean, value: string },
    "retic":    { done: boolean, value: string },
    "hct":      { done: boolean, value: string }
  }
}
```

**自動計算値:**
- **RPI:** `retic% * (Hct / 45)`（小数第1位）。< 2 で赤色表示
- **TSAT:** 直接入力値を表示。< 20% で赤色表示

### 2.8 Discharged Patient（退院患者）

Patient の全フィールド + 以下の追加フィールド:

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `dischargeDate` | `string` | 退院日（M/D形式） |
| `followUp` | `string` | 外来フォロー日（M/D形式、空文字 = なし） |
| `pendingDischTasks` | `string[]` | 退院時に未完了だったチェックリスト項目名 |

### 2.9 Patient Categories（患者別カテゴリ設定）

localStorageキー: `ward_patCats_v2`

```javascript
{
  "p_1234": [
    { type: "abx", icon: "🦠", label: "抗菌薬", isBar: true, showDay: true },
    { type: "drip_main", icon: "💉", label: "メイン点滴" },
    // ... 以下 DEFAULT_CATS 参照
  ]
}
```

**常時表示カテゴリ（削除不可）:** `drip_main`, `med`, `lab`, `family_call`

**デフォルトカテゴリ（11種）:**
abx, drip_main, med, lab, culture, img, meeting, consult, family_call, rehab_call, msw_call

### 2.10 データ永続化

#### localStorageキー一覧

| キー | 内容 | 初期値 |
|------|------|--------|
| `ward_patients_v2` | 患者リスト | `[]` |
| `ward_discharged_v2` | 退院患者リスト | `[]` |
| `ward_orders_v2` | オーダー（患者IDキー） | `{}` |
| `ward_patCats_v2` | カテゴリ設定（患者IDキー） | `{}` |
| `ward_rLabs_v2` | ルーチン検査（患者IDキー） | `{}` |
| `ward_taskDB` | 日別タスクDB | `{}` |
| `ward_consults_v2` | 相談事項（患者IDキー） | `{}` |

#### 保存タイミング

各stateは個別の `useEffect` で、値が変更されるたびに即座に `saveLS()` を呼び出す。

```javascript
useEffect(() => { saveLS("ward_patients_v2", patients); }, [patients]);
useEffect(() => { saveLS("ward_discharged_v2", discharged); }, [discharged]);
useEffect(() => { saveLS("ward_orders_v2", orders); }, [orders]);
useEffect(() => { saveLS("ward_patCats_v2", patCats); }, [patCats]);
useEffect(() => { saveLS("ward_rLabs_v2", rLabs); }, [rLabs]);
useEffect(() => { saveLS("ward_taskDB", taskDB); }, [taskDB]);
useEffect(() => { saveLS("ward_consults_v2", consults); }, [consults]);
```

#### サーバー同期（server.js）

- `GET /api/data` — 起動時にデータをフェッチ。取得成功時にlocalStorageを上書き。
- `POST /api/data` — state変更時に500msデバウンスで全データを送信。
- サーバー未稼働時はlocalStorageのみで動作（graceful fallback）。

#### データマイグレーション

起動時に1回実行: `drip_main`/`med` オーダーの旧形式（`startDate`/`endDate`）を新形式（`dates[]`）に変換する。

---

## 第3章: 予定表パネル（Schedule）

### 3.1 週間ガントチャート

- 月曜始まりの7日間を横軸、患者を縦軸とするテーブル
- 患者は WARDS 順でソート
- 医師フィルター適用時はその医師の患者のみ表示

#### 日付ヘッダー

| 要素 | 説明 |
|------|------|
| 曜日 | 日〜土 |
| 日付 | 数字のみ（例: 12） |
| 今日 | 青色ハイライト、下線 |
| クリック | デスクトップ: 今日パネルの日付をその日に変更。モバイル: 日付変更+今日タブに遷移 |

#### 週ナビゲーション

- `◀` ボタン: 7日前に移動
- `▶` ボタン: 7日後に移動
- `今週` ボタン: 現在の週に戻る

### 3.2 患者ヘッダー行

展開/折畳み可能（chevron クリック）。初回登録時は展開状態。

**表示情報:**
```
[▶/▼] ● 氏名 [✎] [退院]
  病棟|年齢♂♀|診断名
  CCr:{値} Wt:{値} Cr:{値}
  家族:{値}|介護:{値}|TEL:{値}
```

- CCr < 30 → 赤色表示
- `✎` ボタン → 患者編集モーダル
- `退院` ボタン → `window.confirm` 後に退院モーダル表示

**展開時の追加ボタン:**
- `入院CL` — 入院チェックリスト表示切替
- `退院CL` — 退院チェックリスト表示切替
- `＋追加` — カテゴリ追加メニュー

### 3.3 入院チェックリスト（18項目）

`同意書(DNAR)`, `同意書(身体拘束)`, `同意書(その他)`, `病名`, `入院決定`, `入院カルテ1号紙`, `複合セット・指示`, `他科依頼`, `入院計画書`, `IC記録`, `持参薬処方`, `点滴`, `内服薬`, `検査`, `追加検査`, `必要時`, `栄養計画`, `かかりつけ診療情報提供書`

- 各項目: チェックボックス + ラベル
- `追加検査` のみメモ入力欄あり
- **注意:** チェック状態は `aCL` state に保存されるが、localStorageには保存されない（ページリロードで消失する）

### 3.4 退院チェックリスト（6項目）

`退院決定`, `退院計画書`, `退院時処方`, `外来F/U`, `情報診療提供書`, `退院サマリ`

- 各項目: チェックボックス + ラベル
- `外来F/U` にチェック時のみ日付入力欄表示（M/D形式テキスト入力）
- **注意:** チェック状態は `dCL` state に保存されるが、localStorageには保存されない

### 3.5 カテゴリ行とオーダー行

#### 表示ルール

1. 常時表示カテゴリ（`drip_main`, `med`, `lab`, `family_call`）は、オーダーが0件でもカテゴリヘッダー行を表示
2. その他のカテゴリは、オーダーが1件以上ある場合のみ表示
3. 常時表示カテゴリには `✕` 削除ボタンなし

#### カテゴリヘッダー行

```
[アイコン] [ラベル]                            [＋ or +血液/+尿/+痰]  [✕]
```

- `culture` タイプ: 「＋」の代わりに `+血液`, `+尿`, `+痰` の3ボタン
- その他: 「＋」ボタンで空オーダーを追加

#### オーダー行: バー表示（abx）

**操作ロジック:**
1. 未配置状態（startDate/endDate なし）でセルクリック → その日に `startDate = endDate = クリック日` を設定
2. 開始日より前をクリック → `startDate` をクリック日に移動
3. 開始日以降をクリック → `endDate` をクリック日に変更（延長/短縮）

**表示:**
- 期間内: 黄色背景の連続バー（`#FDE68A`）
- 開始日: 左に太い枠線、角丸
- 終了日: 右に太い枠線、角丸
- `showDay: true` の場合: バー内に日数カウント（Day1, Day2, ...）を表示
- 名前が空の場合: バーは表示しない（空のまま）

#### オーダー行: ドット表示（drip_main, med, lab, culture, img 等）

**操作ロジック:**
- セルクリック → `dates[]` にその日付をtoggle（追加/削除）
- **培養オーダーの場合:** 既存の日付は除去不可（追加のみ）。日数カウントの基準日(`dates[0]`)が誤って消えることを防止。

**表示:**
- `dates[]` に含まれる日: 丸ドット（患者色で塗りつぶし）
- 含まれない日: 点線の空ドット
- `showDay: true` かつ `dates[0]` が存在: 最初の日付からの日数カウントをドット内に表示
- `resultDate` と同じ日: 緑色ドットに `✓`
- `reportConfirmed` = true: 緑色ドットに `✓`

#### 培養 (culture) オーダーの特殊仕様

- 検体種別（血液/尿/痰）を持つ
- グラム染色結果入力欄: 尿・痰のみ
- 結果状態: `未` ボタン（黄色）/ `✓済` ラベル（緑色）
- `resultDate` が空 = 未着。`markCulDone` で当日の日付を設定

#### 画像 (img) オーダーの特殊仕様

- レポート確認状態: `レポ未` ボタン（青色）/ `✓済` ラベル（緑色）
- `reportConfirmed` = false → 未確認。`markImgDone` で true に設定

### 3.6 よく使う検査セクション

- 患者行の末尾に折畳み表示
- 9項目の検査値入力（B12, 葉酸, フェリチン, TSAT(%), TSH, FT4, コルチゾール, 網赤%, Hct）
- TSAT, RPI は自動計算・ヘッダーに表示
- 各項目: チェックボックス（完了フラグ） + 値入力欄

### 3.7 退院患者の外来フォロー表示

- 退院済み患者のうち、`followUp` 日が表示中の週に含まれるものを予定表の末尾に表示
- 該当日のセルに「外来」ラベル（紫色）を表示

---

## 第4章: 今日パネル（Today）

### 4.1 日付ナビゲーション

- `◀` / `▶` ボタン: 1日前後に移動
- `今日` / `今日に戻る` ボタン: 当日に移動
- 日付ラベル: `{月}月{日}日（{曜日}）`
- 状態ラベル: 過去（赤） / 本日（緑） / 予定（青）
- **モバイル:** 今日タブをタップした際、`selDate` を当日にリセットする

### 4.2 表示モード（モバイルのみ）

| モード | 説明 |
|--------|------|
| サマリー (summary) | 横スクロールのタイムラインマトリクス（全患者横並び） |
| カード (cards) | 患者ごとの縦積みカード |

### 4.3 タスクセル操作フロー

#### 空セルの場合

1. `＋` ボタンクリック → PresetPickerポップアップ表示
2. プリセット選択 → TaskCell を生成（`presetId`, `icon`, `label`, `type` をセット）
3. `lab`/`culture`/`imaging` タイプの場合、詳細セクションを自動展開

#### タスクがある場合

```
[☑] [▼] [🩸] 血液検査確認    [優先度入力] [✕]
     └── 詳細（lab/culture/imagingのみ）
```

- チェックボックスクリック → `compT(key)` で完了/未完了をtoggle
- `▼` chevron → 詳細展開/折畳み（lab/culture/imagingのみ）
- 優先度入力 → `setPri(key, val)` で優先度を設定
- `✕` → タスクを空セル (`emptyCell()`) に戻す
- `free` タイプのみ: ラベルの代わりにテキスト入力欄

#### lab タイプの詳細

6項目: `血球`, `CRP`, `電解質`, `腎機能`, `肝胆道系`, `その他`

各項目: チェックボックス + メモ入力欄

### 4.4 自動タスク生成（mkAutoTasks）

ordersデータに基づき、AMスロットに自動タスクを挿入する。

#### 生成条件

| オーダー条件 | 生成されるタスク |
|-------------|-----------------|
| `drip_main` の `endDate` == 当日 | `💉 点滴切れ: {name}` |
| `med`/`abx` の `endDate` == 当日 | `💊 内服切れ/抗菌薬切れ: {name}` |
| `lab` の `dates` に当日含む | `🩸 検査: {name}` |
| `family_call` の `dates` に当日含む | `📞 家族に電話 ({name})` |
| `rehab_call` の `dates` に当日含む | `🏃 リハさんに電話 ({name})` |
| `msw_call` の `dates` に当日含む | `👩‍⚕️ MSWに電話 ({name})` |

#### 挿入ルール

1. 自動タスクは `auto: true` フラグ付き
2. 既に同じ `presetId` + `label` の自動タスクがあればスキップ
3. 同じ `type` の手動タスクがあればスキップ
4. 空きスロット（`presetId` が null）の先頭から挿入
5. **スロット満杯時: 自動タスクは挿入されず無視される**
6. 自動タスクはlocalStorageに直接保存されず、`useMemo` で毎回再計算・マージされる

### 4.5 未完了タスク繰越（ensureDay）

新しい日付のデータが存在しない場合に、前日の未完了タスクを繰り越す。

#### 繰越条件

- `presetId` がある（空でない）
- `checked` が false（未完了）
- `auto` が false（自動生成でない）

#### 繰越時の処理

- `priority` を `null` にリセット
- 前日のデータが存在しない場合は空データを生成（繰越なし）

### 4.6 優先度の自動調整ロジック

#### 優先度設定時（setPri）

1. 対象タスクに優先度 `N` を設定
2. AM/PM の全タスクを走査し、優先度 `N` 以上で未完了のタスクの優先度を +1

#### 完了時（compT）

1. 対象タスクの `checked` を toggle
2. 完了にした場合（`!was` = true）:
   - 対象タスクの `priority` を `null` に
   - 優先度が対象より大きい全タスクの優先度を -1
3. 未完了に戻した場合: 元の `priority` を復元（ただし他タスクの調整はなし）

### 4.7 タスク⇔オーダー同期（syncTaskToOrder）

TODOパネルでのタスク操作が、予定表のオーダーに反映される双方向同期。

#### 同期マップ（タスクtype → オーダーtype）

| タスクtype | オーダーtype |
|-----------|-------------|
| `lab` | `lab` |
| `imaging` | `img` |
| `culture` | `culture_blood` |
| `family_call` | `family_call` |
| `rehab_call` | `rehab_call` |
| `msw_call` | `msw_call` |

#### 動作

- **タスク追加時:** 対応するオーダーが存在すれば、そのオーダーの `dates[]` に当日を追加。存在しなければ新規オーダーを作成。
- **タスク削除時:** 対応するオーダーの `dates[]` から当日を除去。
- **自動タスク（`auto: true`）は同期対象外**
- **PMスロットのタスク追加時、`syncTaskToOrder` は呼ばれていない（モバイルカード、デスクトップのPM行）**
  - → 現在のコード上、モバイルカードのPMプリセット追加では `syncTaskToOrder` が呼ばれていない（潜在バグ）

### 4.8 バイタルセクション

各患者に対して:
- `✓ 正常`/`✓ 異常なし` ボタン: `status = "ok"`
- `⚠ 所見`/`⚠ 所見あり` ボタン: `status = "flag"`
- 同じボタン再クリック: `status = null`（未入力に戻る）
- `flag` 選択時: メモ入力欄表示

### 4.9 カルテ記録セクション

各患者に対して:
- チェックボックス + テキストエリア
- チェック時: `済み` ラベル表示
- モバイル: カード/サマリーの下に常時表示

### 4.10 結果確認セクション（pendingConfirms）

#### 培養

- `dates[0]` が存在 & `resultDate` が空 → 表示
- 最初の培養日からの日数（Day N）を計算表示
- `済み` ボタン → `markCulDone`: `resultDate` に当日を設定

#### 画像

- `dates` が1件以上存在 & `reportConfirmed` が false → 表示
- `済み` ボタン → `markImgDone`: `reportConfirmed` を true に設定

### 4.11 上級医相談セクション

- 各患者に相談事項リスト
- 新規追加: `＋` / `＋追加` ボタン → 空の相談事項を追加
- チェックボックス: 解決済みフラグ
- 緊急ボタン（丸）: クリックでtoggle。緊急時は赤色 `!` 表示
- テキスト入力: 相談内容

#### 緊急相談バー

- 未完了 + 緊急 + テキストありの相談事項を、今日パネル上部に一覧表示（赤色バー）

### 4.12 優先度バー

- 優先度が設定され、未完了のタスクを全患者分ソートして上部に一覧表示（黄色バー）
- 各項目: 優先度番号 + アイコン + 患者名 + タスク名

### 4.13 勉強リスト

- グローバル（患者に紐づかない）
- チェックボックス + テキスト入力 + 削除ボタン
- 初期状態: 2件の空項目
- **注意:** localStorageに保存されない（ページリロードで消失）

### 4.14 オーダーチェックリスト行（デスクトップのみ）

今日パネルのテーブル末尾に、各患者の当日のオーダー概要を表示:
- 💉 点滴（当日の dates に含まれるもの）
- 💊 内服（当日の dates に含まれるもの）
- 🦠 抗菌薬（endDate が当日以降のもの）
- 🩸 検査（dates に当日以降が含まれるもの）

---

## 第5章: 患者管理

### 5.1 患者追加

#### トリガー

- ヘッダーの `＋患者` ボタン → PatientModal 表示

#### 必須項目

- `name`（氏名）: 空の場合、保存ボタンが無効（return で無視）
- `room`（病棟）: 空の場合、保存ボタンが無効

#### 新規登録時の初期化処理

```
1. patients に追加
2. orders[pid] に初期オーダー4件を生成:
   - drip_main（空）
   - med（空）
   - lab "血液検査"（空dates）
   - family_call "家族連絡"（空dates）
3. patCats[pid] に DEFAULT_CATS（11種）をコピー
4. rLabs[pid] に空オブジェクトを生成
5. expP[pid] = true（展開状態にする）
```

### 5.2 患者編集

- 患者ヘッダーの `✎` ボタン → PatientModal（edit モード）表示
- 追加入力欄: 退院予定、最終家族TEL
- 既存のフィールドはそのまま編集可能

### 5.3 患者削除

#### 処理手順

```
1. window.confirm で確認
2. patients から除去
3. orders[pid] を削除
4. patCats[pid] を削除
5. rLabs[pid] を削除
6. taskDB の全日付分を走査し、該当患者のキーを含むエントリを削除
```

**注意:** consults[pid] は削除されていない（潜在バグ）

### 5.4 退院処理

#### フロー

```
1. 患者ヘッダーの「退院」ボタンクリック
2. window.confirm で確認
3. DischargeModal 表示
4. 外来フォロー予定の有無を選択
5. フォロー予定あり → 日付入力
6. 「退院確定」ボタン:
   a. 退院チェックリスト未完了項目を pendingDischTasks として保存
   b. discharged 配列に患者データ（+ dischargeDate, followUp, pendingDischTasks）を追加
   c. patients から除去
   d. DischargeModal を閉じる
```

### 5.5 退院後の表示

#### 予定表

- 外来フォロー日が表示週に含まれる → その行に「外来」ラベル表示

#### 今日パネル（モバイル）

- **外来フォローリマインダー:** 当日〜翌日の外来フォロー患者を表示（「本日」「明日」ラベル付き）
- **未完了退院タスク:** 退院チェックリストの未完了項目を表示。クリックで完了（`markDischTask`）

#### 今日パネル（デスクトップ）

- 外来フォロー日が当日〜翌日 → 上部にアラートバー表示（「本日」は黄色、「明日」は紫色）

---

## 第6章: 計算ロジック

### 6.1 CCr（Horio式 — 日本人向け推算式）

```
BMI = weight / (height/100)²

男性: CCr = ((33 - 0.065×age - 0.493×BMI) × weight) / (Cr × 14.4)
女性: CCr = ((21 - 0.052×age - 0.202×BMI) × weight) / (Cr × 14.4)
```

出典: Horio, M., et al.: Clin. Exper. Nephrol., 1(2), 110 (1997)

- 結果: 小数第1位まで（`Math.round(x * 10) / 10`）
- 無効条件: `Cr <= 0` or `weight`/`height` が未入力 or `age` が NaN/0以下 → `null`
- 結果が負の場合 → `null`
- 表示: CCr < 30 → 赤色

### 6.2 TSAT（鉄飽和度）

TSATは直接入力方式（手動で検査結果を入力）。自動計算は行わない。

- 表示: TSAT < 20% → 赤色

### 6.3 RPI（網赤血球産生指数）

```
RPI = retic% × (Hct / 45)
```

- 結果: 小数第1位
- 無効条件: retic%/Hct いずれか未入力 → `null`
- 表示: RPI < 2 → 赤色

### 6.4 日数計算（dB）

```
日数 = Math.round((endDate - startDate) / 86400000) + 1
```

- 開始日を Day 1 とする
- 両方の日付が無効の場合 → `null`

### 6.5 日付解析（pMD）

```javascript
pMD("4/12") → new Date(2026, 3, 12)  // 2026年固定
pMD("")     → null
pMD(null)   → null
pMD("abc")  → null  // "/"で分割して要素数が2でない場合
```

### 6.6 曜日付加（addDw）

```javascript
addDw("4/12") → "4/12土"  // 日月火水木金土
addDw("")     → ""
addDw(null)   → ""
```

---

## 第7章: エッジケースと既知の制限

### 7.1 日付関連

| 制限 | 詳細 |
|------|------|
| 年固定 | `pMD` が2026年固定。2027年以降は正しく動作しない |
| 年跨ぎ | 12月→1月の日付比較が不正確になる可能性 |
| 日付形式 | 先頭ゼロなしの M/D 形式のみ |
| HTML date input | `YYYY-MM-DD` ⇔ `M/D` の変換関数で対応 |

### 7.2 データ整合性

| 問題 | 詳細 |
|------|------|
| チェックリスト非永続化 | 入院CL(`aCL`)/退院CL(`dCL`)はlocalStorageに保存されない |
| 勉強リスト非永続化 | `studyList` はlocalStorageに保存されない |
| 患者削除時の不整合 | consults のクリーンアップが漏れている |
| taskDB肥大化 | 古い日付のデータが自動削除されない |
| 同時利用 | 複数タブ/ウィンドウでの同時利用は非対応（storageイベント未監視） |

### 7.3 スロット上限

| 種別 | 上限 |
|------|------|
| AMスロット | 5（am0〜am4） |
| PMスロット | 4（pm0〜pm3） |

- スロット満杯時: 自動タスクは挿入されない
- 手動追加も不可（空きスロットがないとボタンが反応しない）

### 7.4 パフォーマンス

- localStorage容量上限: 約5MB
- 患者数増加に伴い taskDB が肥大化（全日付分を保持）
- `saveLS` のサイレント失敗: 容量超過時にエラーを握りつぶす

### 7.5 PM タスクの syncTaskToOrder 未対応

- デスクトップ: `tdRows("pm", ...)` で `syncTaskToOrder` が正しく呼ばれる（`onUpdate` 内）
- モバイルカード: PM プリセット追加時に `syncTaskToOrder` が呼ばれていない
  - AM は `syncTaskToOrder(p.id, newCell, emptyCell())` を明示的に呼んでいる
  - PM は `setPmC(prev => ({...prev,[key2]:newCell}))` のみで sync なし

---

## 第8章: UI仕様

### 8.1 モーダル一覧

| モーダル | z-index | 用途 |
|---------|---------|------|
| PatientModal | 200 | 患者追加/編集/削除 |
| DischargeModal | 300 | 退院処理（PatientModal より上） |
| AddCatModal | 200 | カスタムカテゴリ追加 |
| PresetPicker | 200 | タスクプリセット選択（ポップオーバー型） |

### 8.2 レスポンシブ動作

| 条件 | レイアウト |
|------|----------|
| width >= 768px | デスクトップ: トップタブ、テーブル型 |
| width < 768px | モバイル: ボトムナビ、カード/サマリー型 |

- リサイズイベントで動的判定（`window.addEventListener("resize")`)
- iOS Safe Area: `env(safe-area-inset-bottom)` 対応
- iOS ズーム防止: input の font-size を 16px 以上に設定

### 8.3 ErrorBoundary

- `main.jsx` で App コンポーネントをラップ
- エラー発生時: エラーメッセージ表示 + 「localStorageをクリアしてリロード」ボタン

---

## 第9章: 既知バグ修正履歴（回帰防止）

git log から抽出した修正済みバグ一覧:

| コミット | 修正内容 |
|---------|---------|
| `fe3d330` | Lab detail展開、drip preset、abx開始日、CCr解析の4件のバグ修正 |
| `614f58b` | 週ナビゲーション、タスクチェックのループ、サマリー/カード分離 |
| `f337b93` | 今日タブが常に当日にリセットされる問題 |
| `1cf75c1` | Chrome mobile タブ、勉強リスト削除、患者ステータスストリップ |
| `63184d5` | AM/PMタスクtoggle、drip/med日選択 |
| `9ba7439` | consults useEffect順序によるクラッシュ |
| `c097ba5` | タブ、フリーテキスト入力、consults、med/drip日選択の5件 |
| `6ee4229` | モバイルカードレイアウト、iOSズーム |
| `36fe5c1` | バー開始日: クリックで配置、開始日前クリックで移動 |
| `71363e8` | DischargeModalのオーバーフロー (boxSizing) |
| `f4b1743` | フォローアップリマインダー範囲とカレンダーオーバーフロー |

---

## 第10章: 将来の改善提案

### 10.1 アーキテクチャ改善

| 改善項目 | 理由 |
|---------|------|
| コンポーネント分割 | 1798行の単一ファイルは保守困難 |
| TypeScript化 | データモデルの型安全性確保でバグ防止 |
| 状態管理ライブラリ導入 | useReducer or Zustand で複雑なstate更新を整理 |
| 日付ライブラリ導入 | day.js 等で2026年固定問題を解消 |

### 10.2 データ永続化改善

| 改善項目 | 理由 |
|---------|------|
| チェックリスト永続化 | aCL/dCL/studyList がリロードで消失する |
| taskDB自動クリーンアップ | 古い日付のデータがlocalStorageを圧迫 |
| consults削除漏れ修正 | 患者削除時に consults が残る |
| IndexedDB移行 | localStorage 5MB制限の回避 |

### 10.3 機能改善

| 改善項目 | 理由 |
|---------|------|
| PM syncTaskToOrder対応 | モバイルPMタスク追加がオーダーに反映されない |
| 入力バリデーション強化 | 数値フィールドの範囲チェック等 |
| データエクスポート/インポート | バックアップ・端末間移行 |
| 患者数上限の動的調整 | スロット数の柔軟な変更 |
