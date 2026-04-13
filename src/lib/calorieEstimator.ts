/**
 * 日本食カロリー推定ライブラリ
 * 文部科学省「日本食品標準成分表」を参考に主要食品を収録
 * APIなし・オフライン動作・完全無料
 */

// ─── 食品データベース（100gあたりkcal / 一般的な量g）────────────────────────
interface FoodEntry {
  keywords: string[];
  kcalPer100g: number;
  typicalGrams: number;
  unit?: string; // 表示用
}

const FOOD_DB: FoodEntry[] = [
  // ── ご飯・麺・パン ─────────────────────────────────────────
  { keywords: ['ご飯', 'ごはん', '白米', '米', 'ライス'], kcalPer100g: 168, typicalGrams: 150, unit: '茶碗1杯' },
  { keywords: ['おにぎり', '握り飯'], kcalPer100g: 168, typicalGrams: 100, unit: '1個' },
  { keywords: ['玄米'], kcalPer100g: 165, typicalGrams: 150 },
  { keywords: ['チャーハン', '焼き飯'], kcalPer100g: 190, typicalGrams: 200 },
  { keywords: ['うどん'], kcalPer100g: 105, typicalGrams: 200, unit: '1人前' },
  { keywords: ['そば'], kcalPer100g: 130, typicalGrams: 180 },
  { keywords: ['ラーメン'], kcalPer100g: 150, typicalGrams: 400, unit: '1杯' },
  { keywords: ['スパゲッティ', 'パスタ', 'スパゲティ'], kcalPer100g: 150, typicalGrams: 250 },
  { keywords: ['食パン', 'トースト', 'パン'], kcalPer100g: 264, typicalGrams: 60, unit: '1枚' },
  { keywords: ['コッペパン', 'バゲット', 'フランスパン'], kcalPer100g: 279, typicalGrams: 80 },
  { keywords: ['クロワッサン'], kcalPer100g: 448, typicalGrams: 45, unit: '1個' },
  { keywords: ['焼きそば'], kcalPer100g: 155, typicalGrams: 200 },
  { keywords: ['そうめん', '素麺'], kcalPer100g: 127, typicalGrams: 150 },
  { keywords: ['冷やし中華'], kcalPer100g: 130, typicalGrams: 300 },

  // ── 主菜（肉・魚） ────────────────────────────────────────
  { keywords: ['唐揚げ', 'から揚げ', 'からあげ'], kcalPer100g: 307, typicalGrams: 150, unit: '3〜4個' },
  { keywords: ['焼き鳥', '焼鳥'], kcalPer100g: 220, typicalGrams: 80, unit: '2本' },
  { keywords: ['鶏むね', '鶏胸', 'チキン'], kcalPer100g: 191, typicalGrams: 120 },
  { keywords: ['鶏もも', '鶏腿'], kcalPer100g: 253, typicalGrams: 120 },
  { keywords: ['ハンバーグ'], kcalPer100g: 223, typicalGrams: 150, unit: '1個' },
  { keywords: ['ステーキ', '牛肉'], kcalPer100g: 259, typicalGrams: 150 },
  { keywords: ['豚肉', '豚バラ', 'ポーク'], kcalPer100g: 395, typicalGrams: 100 },
  { keywords: ['豚ロース', 'とんかつ', 'トンカツ'], kcalPer100g: 320, typicalGrams: 150 },
  { keywords: ['生姜焼き', 'しょうが焼き'], kcalPer100g: 260, typicalGrams: 150 },
  { keywords: ['焼き魚', '塩焼き', 'さば', 'サバ'], kcalPer100g: 202, typicalGrams: 100 },
  { keywords: ['鮭', 'サーモン', 'しゃけ'], kcalPer100g: 133, typicalGrams: 100 },
  { keywords: ['刺身', '刺し身', 'まぐろ', 'マグロ'], kcalPer100g: 125, typicalGrams: 80 },
  { keywords: ['寿司', 'すし', '寿し'], kcalPer100g: 168, typicalGrams: 200, unit: '8貫程度' },
  { keywords: ['天ぷら'], kcalPer100g: 350, typicalGrams: 150 },
  { keywords: ['コロッケ'], kcalPer100g: 217, typicalGrams: 80, unit: '1個' },
  { keywords: ['エビフライ', '海老フライ'], kcalPer100g: 250, typicalGrams: 80 },
  { keywords: ['餃子', 'ぎょうざ'], kcalPer100g: 197, typicalGrams: 90, unit: '4〜5個' },
  { keywords: ['シュウマイ', 'しゅうまい'], kcalPer100g: 190, typicalGrams: 60 },

  // ── 副菜・汁物 ────────────────────────────────────────────
  { keywords: ['みそ汁', '味噌汁', '味噌スープ'], kcalPer100g: 20, typicalGrams: 150, unit: '1杯' },
  { keywords: ['豆腐', 'とうふ'], kcalPer100g: 56, typicalGrams: 100 },
  { keywords: ['納豆', 'なっとう'], kcalPer100g: 200, typicalGrams: 50, unit: '1パック' },
  { keywords: ['卵', 'たまご', '玉子', '目玉焼き', 'たまごやき', '卵焼き', 'スクランブル'], kcalPer100g: 151, typicalGrams: 60, unit: '1個' },
  { keywords: ['ゆで卵', '茹で卵'], kcalPer100g: 151, typicalGrams: 55, unit: '1個' },
  { keywords: ['サラダ', '野菜'], kcalPer100g: 20, typicalGrams: 100 },
  { keywords: ['ほうれん草', 'おひたし'], kcalPer100g: 25, typicalGrams: 80 },
  { keywords: ['きんぴら'], kcalPer100g: 110, typicalGrams: 70 },
  { keywords: ['漬物', 'つけもの', 'ぬか漬け'], kcalPer100g: 21, typicalGrams: 30 },
  { keywords: ['冷奴', 'ひやっこ'], kcalPer100g: 56, typicalGrams: 150 },
  { keywords: ['ひじき', 'ひじきの煮物'], kcalPer100g: 58, typicalGrams: 60 },
  { keywords: ['肉じゃが'], kcalPer100g: 80, typicalGrams: 200 },

  // ── カレー・丼・定食 ──────────────────────────────────────
  { keywords: ['カレー', 'カレーライス'], kcalPer100g: 130, typicalGrams: 400, unit: '1皿' },
  { keywords: ['牛丼'], kcalPer100g: 145, typicalGrams: 350, unit: '並盛' },
  { keywords: ['親子丼'], kcalPer100g: 140, typicalGrams: 350 },
  { keywords: ['かつ丼'], kcalPer100g: 160, typicalGrams: 350 },
  { keywords: ['天丼'], kcalPer100g: 170, typicalGrams: 350 },
  { keywords: ['海鮮丼'], kcalPer100g: 135, typicalGrams: 300 },
  { keywords: ['チャーシュー丼', 'ローストビーフ丼'], kcalPer100g: 200, typicalGrams: 300 },
  { keywords: ['定食'], kcalPer100g: 100, typicalGrams: 500, unit: '1食' },

  // ── 洋食・その他 ──────────────────────────────────────────
  { keywords: ['ピザ'], kcalPer100g: 260, typicalGrams: 200, unit: '2〜3切れ' },
  { keywords: ['ハンバーガー'], kcalPer100g: 260, typicalGrams: 150, unit: '1個' },
  { keywords: ['サンドイッチ'], kcalPer100g: 230, typicalGrams: 120, unit: '1個' },
  { keywords: ['グラタン', 'ドリア'], kcalPer100g: 130, typicalGrams: 200 },
  { keywords: ['シチュー', 'クリームシチュー'], kcalPer100g: 90, typicalGrams: 250 },
  { keywords: ['オムライス'], kcalPer100g: 170, typicalGrams: 300 },
  { keywords: ['お好み焼き'], kcalPer100g: 230, typicalGrams: 250 },
  { keywords: ['たこ焼き'], kcalPer100g: 200, typicalGrams: 120, unit: '6個' },

  // ── 飲み物 ────────────────────────────────────────────────
  { keywords: ['コーヒー', 'ブラックコーヒー'], kcalPer100g: 4, typicalGrams: 200, unit: '1杯' },
  { keywords: ['カフェラテ', 'ラテ', 'カプチーノ'], kcalPer100g: 50, typicalGrams: 250 },
  { keywords: ['お茶', '緑茶', '麦茶', '紅茶'], kcalPer100g: 2, typicalGrams: 200 },
  { keywords: ['牛乳', 'ミルク'], kcalPer100g: 67, typicalGrams: 200, unit: '1杯' },
  { keywords: ['オレンジジュース', 'ジュース'], kcalPer100g: 45, typicalGrams: 200 },
  { keywords: ['コーラ', 'ソーダ'], kcalPer100g: 45, typicalGrams: 350 },
  { keywords: ['ビール'], kcalPer100g: 40, typicalGrams: 350, unit: '1缶' },

  // ── おやつ・デザート ──────────────────────────────────────
  { keywords: ['チョコレート', 'チョコ'], kcalPer100g: 557, typicalGrams: 30, unit: '板チョコ1/3' },
  { keywords: ['アイスクリーム', 'アイス'], kcalPer100g: 224, typicalGrams: 100 },
  { keywords: ['ケーキ', 'ショートケーキ'], kcalPer100g: 344, typicalGrams: 100, unit: '1切れ' },
  { keywords: ['クッキー', 'ビスケット'], kcalPer100g: 493, typicalGrams: 30, unit: '3〜4枚' },
  { keywords: ['ポテトチップス', 'スナック'], kcalPer100g: 554, typicalGrams: 60 },
  { keywords: ['おせんべい', 'せんべい'], kcalPer100g: 400, typicalGrams: 30, unit: '2〜3枚' },
  { keywords: ['プリン'], kcalPer100g: 126, typicalGrams: 100, unit: '1個' },
  { keywords: ['ヨーグルト'], kcalPer100g: 62, typicalGrams: 100 },
  { keywords: ['バナナ'], kcalPer100g: 86, typicalGrams: 100, unit: '1本' },
  { keywords: ['りんご', 'リンゴ'], kcalPer100g: 61, typicalGrams: 200, unit: '1個' },
  { keywords: ['みかん', 'オレンジ'], kcalPer100g: 46, typicalGrams: 100, unit: '1個' },
];

// ─── カロリー推定ロジック ───────────────────────────────────────────────────
export function estimateCalories(description: string): number | null {
  const text = description.toLowerCase();
  let total = 0;
  let matched = 0;

  for (const food of FOOD_DB) {
    const hit = food.keywords.some(kw => text.includes(kw));
    if (!hit) continue;

    // 量の推定（「2個」「大盛り」「少なめ」などを解析）
    let multiplier = 1;
    if (/大盛|おおも|大きめ|2人前/.test(text)) multiplier = 1.4;
    else if (/小盛|少なめ|少量|ちょっと|一口/.test(text)) multiplier = 0.6;
    else if (/2個|2枚|2杯|ふたつ/.test(text)) multiplier = 2;
    else if (/3個|3枚|3杯|みっつ/.test(text)) multiplier = 3;

    const kcal = Math.round((food.kcalPer100g * food.typicalGrams / 100) * multiplier);
    total += kcal;
    matched++;
  }

  if (matched === 0) return null;

  // 調理方法による補正
  if (/揚げ|フライ|天ぷら/.test(text)) total = Math.round(total * 1.1);
  if (/炒め|バター|マヨ/.test(text)) total = Math.round(total * 1.05);

  return total;
}

// 食品名の部分一致検索（オートコンプリート用）
export function searchFoods(query: string): { name: string; kcal: number }[] {
  if (!query) return [];
  const q = query.toLowerCase();
  const results: { name: string; kcal: number }[] = [];
  for (const food of FOOD_DB) {
    const match = food.keywords.find(kw => kw.includes(q) || q.includes(kw));
    if (match) {
      results.push({
        name: food.keywords[0],
        kcal: Math.round(food.kcalPer100g * food.typicalGrams / 100),
      });
    }
    if (results.length >= 5) break;
  }
  return results;
}
