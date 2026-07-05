import type { Quiz } from "@/app/data/types"

export const manufacturingListeningQuiz: Quiz = {
  id: "manufacturing-listening",
  title: "製造リスニング",
  questions: [
    // ===== 安全・スローガン =====
    { id: 1,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "5S", choices: [
      "整理・整頓・清掃・清潔・しつけ / workplace organization",
      "機械の点検 / machine inspection",
      "作業スピード / work speed",
      "品質検査 / quality check"
    ], correctIndex: 0, explanation: "【音声】5S\n\n5Sは職場をきれいに保つ基本活動です。" },

    { id: 2,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "安全第一", choices: [
      "安全がいちばん大事 / safety first",
      "早く作業する / work fast",
      "コスト削減 / cost reduction",
      "休憩時間 / break time"
    ], correctIndex: 0, explanation: "【音声】安全第一\n\n作業より安全を優先する考え方です。" },

    { id: 3,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "ヒヤリハット", choices: [
      "事故になりそうだった経験 / near miss",
      "大きな事故 / big accident",
      "休憩時間 / break",
      "安全確認 / safety check"
    ], correctIndex: 0, explanation: "【音声】ヒヤリハット\n\n事故にはならなかったが危険だった出来事です。" },

    { id: 4,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "KY", choices: [
      "危険を予測する / hazard prediction",
      "作業スピード / work speed",
      "品質チェック / quality check",
      "設備管理 / machine control"
    ], correctIndex: 0, explanation: "【音声】KY\n\nKYは危険予知のことです。" },

    { id: 5,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "指差呼称", choices: [
      "指でさして声に出して確認 / point and call",
      "静かに確認する / silent check",
      "書いて確認 / write check",
      "写真を撮る / take photo"
    ], correctIndex: 0, explanation: "【音声】指差呼称\n\n日本の安全確認方法です。" },

    { id: 6,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "保護具", choices: [
      "体を守る道具 / protective equipment",
      "作業工具 / tools",
      "機械 / machine",
      "材料 / material"
    ], correctIndex: 0, explanation: "【音声】保護具\n\nヘルメットや手袋など安全のための道具です。" },

    { id: 7,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "墜落・転落", choices: [
      "高い所から落ちる事故 / fall accident",
      "電気の事故 / electric shock",
      "火の事故 / fire accident",
      "機械の故障 / machine failure"
    ], correctIndex: 0, explanation: "【音声】墜落・転落\n\n高所作業での落下事故です。" },

    { id: 8,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "挟まれ・巻き込まれ", choices: [
      "機械に体がはさまれる事故 / caught in machine",
      "転ぶ事故 / slip accident",
      "火傷 / burn",
      "感電 / electric shock"
    ], correctIndex: 0, explanation: "【音声】挟まれ・巻き込まれ\n\n機械と物の間に挟まれる事故です。" },

    { id: 9,  question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "転倒", choices: [
      "すべって転ぶ / slip and fall",
      "高い所から落ちる / fall from height",
      "火傷 / burn",
      "機械停止 / machine stop"
    ], correctIndex: 0, explanation: "【音声】転倒\n\n床などで滑って倒れる事故です。" },

    { id: 10, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "感電", choices: [
      "電気でショックを受ける / electric shock",
      "火傷 / burn",
      "転ぶ / fall",
      "切れる / cut"
    ], correctIndex: 0, explanation: "【音声】感電\n\n電気による事故です。" },

    // ===== 作業・動作 =====
    { id: 11, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "段取り", choices: [
      "作業の準備 / setup preparation",
      "掃除 / cleaning",
      "運搬 / transport",
      "修理 / repair"
    ], correctIndex: 0, explanation: "【音声】段取り\n\n作業前の準備です。" },

    { id: 12, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "仕込み", choices: [
      "材料や機械の準備 / preparation",
      "加工 / machining",
      "検査 / inspection",
      "運搬 / transport"
    ], correctIndex: 0, explanation: "【音声】仕込み\n\n作業開始前の準備作業です。" },

    { id: 13, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "加工", choices: [
      "材料を形にする / machining",
      "掃除する / cleaning",
      "運ぶ / transport",
      "修理する / repair"
    ], correctIndex: 0, explanation: "【音声】加工\n\n材料を削る・切るなどの作業です。" },

    { id: 14, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "組立", choices: [
      "部品を組み合わせる / assembly",
      "分解 / disassemble",
      "清掃 / cleaning",
      "修理 / repair"
    ], correctIndex: 0, explanation: "【音声】組立\n\n部品を合わせて製品にします。" },

    { id: 15, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "バリ取り", choices: [
      "とがった部分を削る / deburring",
      "塗装する / painting",
      "切断する / cutting",
      "組立する / assembly"
    ], correctIndex: 0, explanation: "【音声】バリ取り\n\n加工後の鋭い部分を取る作業です。" },

    { id: 16, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "溶接", choices: [
      "金属を熱でつなぐ / welding",
      "切断 / cutting",
      "磨く / polishing",
      "塗装 / painting"
    ], correctIndex: 0, explanation: "【音声】溶接\n\n金属を溶かして接合します。" },

    { id: 17, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "塗装", choices: [
      "表面に塗料を塗る / painting",
      "削る / cutting",
      "洗う / washing",
      "組立 / assembly"
    ], correctIndex: 0, explanation: "【音声】塗装\n\n製品の表面に塗料を塗る作業です。" },

    { id: 18, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "梱包", choices: [
      "製品を包む / packaging",
      "加工 / machining",
      "検査 / inspection",
      "修理 / repair"
    ], correctIndex: 0, explanation: "【音声】梱包\n\n出荷のために包装します。" },

    { id: 19, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "養生", choices: [
      "保護するために覆う / protection covering",
      "掃除 / cleaning",
      "切断 / cutting",
      "塗装 / painting"
    ], correctIndex: 0, explanation: "【音声】養生\n\n汚れや傷を防ぐための保護です。" },

    { id: 20, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "搬送", choices: [
      "物を運ぶ / transport",
      "物を作る / produce",
      "検査 / inspect",
      "洗う / wash"
    ], correctIndex: 0, explanation: "【音声】搬送\n\n製品や材料を運ぶ作業です。" },

    // ===== 品質・状態 =====
    { id: 21, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "不良品", choices: [
      "問題のある製品 / defective product",
      "良い製品 / good product",
      "新しい製品 / new product",
      "古い製品 / old product"
    ], correctIndex: 0, explanation: "【音声】不良品\n\n品質に問題がある製品です。" },

    { id: 22, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "良品", choices: [
      "問題のない製品 / good product",
      "壊れた製品 / broken product",
      "古い製品 / old product",
      "汚れた製品 / dirty product"
    ], correctIndex: 0, explanation: "【音声】良品\n\n基準を満たす製品です。" },

    { id: 23, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "歩留まり", choices: [
      "良品の割合 / yield rate",
      "作業時間 / work time",
      "機械の数 / machine number",
      "作業人数 / worker count"
    ], correctIndex: 0, explanation: "【音声】歩留まり\n\n生産量の中で良品の割合です。" },

    { id: 24, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "寸法", choices: [
      "物の大きさ / dimension",
      "重さ / weight",
      "色 / color",
      "材料 / material"
    ], correctIndex: 0, explanation: "【音声】寸法\n\n長さや幅などのサイズです。" },

    { id: 25, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "公差", choices: [
      "許される誤差 / tolerance",
      "重さ / weight",
      "材料 / material",
      "色 / color"
    ], correctIndex: 0, explanation: "【音声】公差\n\n寸法の許容範囲です。" },

    { id: 26, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "キズ", choices: [
      "表面の傷 / scratch",
      "色むら / color uneven",
      "重さ / weight",
      "材料 / material"
    ], correctIndex: 0, explanation: "【音声】キズ\n\n表面のダメージです。" },

    { id: 27, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "汚れ", choices: [
      "表面のよごれ / dirt",
      "傷 / scratch",
      "ひび / crack",
      "変形 / deformation"
    ], correctIndex: 0, explanation: "【音声】汚れ\n\n表面の不純物です。" },

    { id: 28, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "バリ", choices: [
      "加工後のとがり / burr",
      "塗料 / paint",
      "ネジ / screw",
      "金型 / mold"
    ], correctIndex: 0, explanation: "【音声】バリ\n\n加工後にできる鋭い部分です。" },

    { id: 29, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "歪み", choices: [
      "形が曲がる / distortion",
      "傷 / scratch",
      "汚れ / dirt",
      "破損 / break"
    ], correctIndex: 0, explanation: "【音声】歪み\n\n形が曲がることです。" },

    { id: 30, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "亀裂", choices: [
      "細いひび / crack",
      "穴 / hole",
      "色 / color",
      "油 / oil"
    ], correctIndex: 0, explanation: "【音声】亀裂\n\n材料にできる細い割れです。" },

    // ===== 工具・設備 =====
    { id: 31, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "治具", choices: [
      "作業を助ける道具 / jig fixture",
      "機械 / machine",
      "材料 / material",
      "製品 / product"
    ], correctIndex: 0, explanation: "【音声】治具\n\n作業を固定したり補助する道具です。" },

    { id: 32, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "金型", choices: [
      "形を作る型 / mold",
      "工具 / tool",
      "ネジ / screw",
      "材料 / material"
    ], correctIndex: 0, explanation: "【音声】金型\n\n製品の形を作る型です。" },

    { id: 33, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "工具", choices: [
      "作業に使う道具 / tool",
      "材料 / material",
      "機械 / machine",
      "部品 / part"
    ], correctIndex: 0, explanation: "【音声】工具\n\n作業に使う道具の総称です。" },

    { id: 34, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "コンベア", choices: [
      "物を運ぶベルト / conveyor",
      "機械 / machine",
      "台車 / cart",
      "クレーン / crane"
    ], correctIndex: 0, explanation: "【音声】コンベア\n\n物を自動で運ぶ装置です。" },

    { id: 35, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "クレーン", choices: [
      "重い物を持ち上げる機械 / crane",
      "運搬車 / truck",
      "コンベア / conveyor",
      "工具 / tool"
    ], correctIndex: 0, explanation: "【音声】クレーン\n\n重量物を吊り上げる機械です。" },

    { id: 36, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "フォークリフト", choices: [
      "荷物を持ち上げて運ぶ車 / forklift",
      "クレーン / crane",
      "台車 / cart",
      "コンベア / conveyor"
    ], correctIndex: 0, explanation: "【音声】フォークリフト\n\nパレットなどを運ぶ車両です。" },

    { id: 37, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "パレット", choices: [
      "荷物を置く台 / pallet",
      "箱 / box",
      "工具 / tool",
      "部品 / part"
    ], correctIndex: 0, explanation: "【音声】パレット\n\n荷物をまとめて運ぶ台です。" },

    { id: 38, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "台車", choices: [
      "荷物を運ぶ小さな車 / cart",
      "トラック / truck",
      "機械 / machine",
      "工具 / tool"
    ], correctIndex: 0, explanation: "【音声】台車\n\n手で押して運ぶ車です。" },

    { id: 39, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "旋盤", choices: [
      "回して削る機械 / lathe",
      "プレス機 / press machine",
      "溶接機 / welding machine",
      "塗装機 / painting machine"
    ], correctIndex: 0, explanation: "【音声】旋盤\n\n材料を回転させて削る機械です。" },

    { id: 40, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "プレス機", choices: [
      "圧力で形を作る機械 / press machine",
      "旋盤 / lathe",
      "溶接機 / welding machine",
      "研磨機 / grinder"
    ], correctIndex: 0, explanation: "【音声】プレス機\n\n金属を押して成形する機械です。" },

    // ===== 生産管理・現場用語 =====
    { id: 41, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "工程", choices: [
      "作業の流れ / process",
      "材料 / material",
      "部品 / part",
      "工具 / tool"
    ], correctIndex: 0, explanation: "【音声】工程\n\n作業の順番です。" },

    { id: 42, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "リードタイム", choices: [
      "注文から完成までの時間 / lead time",
      "休憩時間 / break time",
      "作業速度 / speed",
      "検査時間 / inspection time"
    ], correctIndex: 0, explanation: "【音声】リードタイム\n\n注文から納品までの時間です。" },

    { id: 43, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "タクトタイム", choices: [
      "1個作る時間 / takt time",
      "休憩時間 / break time",
      "掃除時間 / cleaning time",
      "準備時間 / setup time"
    ], correctIndex: 0, explanation: "【音声】タクトタイム\n\n製品1個の生産時間です。" },

    { id: 44, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "稼働率", choices: [
      "機械が動く割合 / operating rate",
      "生産量 / production",
      "作業人数 / workers",
      "材料量 / material amount"
    ], correctIndex: 0, explanation: "【音声】稼働率\n\n設備の稼働の割合です。" },

    { id: 45, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "生産性", choices: [
      "効率の良さ / productivity",
      "作業時間 / work time",
      "材料費 / material cost",
      "休憩 / break"
    ], correctIndex: 0, explanation: "【音声】生産性\n\n効率よく作る能力です。" },

    // ===== トラブル・メンテナンス =====
    { id: 46, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "故障", choices: [
      "機械が壊れる / machine failure",
      "停止 / stop",
      "修理 / repair",
      "点検 / inspection"
    ], correctIndex: 0, explanation: "【音声】故障\n\n機械が正常に動かない状態です。" },

    { id: 47, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "停止", choices: [
      "機械が止まる / machine stop",
      "修理 / repair",
      "掃除 / cleaning",
      "運搬 / transport"
    ], correctIndex: 0, explanation: "【音声】停止\n\n機械が動かない状態です。" },

    { id: 48, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "チョコ停", choices: [
      "短い停止 / minor stoppage",
      "長い停止 / long stop",
      "故障 / failure",
      "修理 / repair"
    ], correctIndex: 0, explanation: "【音声】チョコ停\n\n短時間の停止です。" },

    { id: 49, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "点検", choices: [
      "状態を確認する / inspection check",
      "修理 / repair",
      "加工 / machining",
      "組立 / assembly"
    ], correctIndex: 0, explanation: "【音声】点検\n\n機械や設備を確認することです。" },

    { id: 50, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "給油", choices: [
      "油を入れる / lubrication",
      "掃除 / cleaning",
      "修理 / repair",
      "検査 / inspection"
    ], correctIndex: 0, explanation: "【音声】給油\n\n機械に油を入れる作業です。" },

    // ===== 組織・働き方 =====
    { id: 51, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "現場", choices: [
      "作業する場所 / workplace",
      "休憩室 / break room",
      "事務所 / office",
      "倉庫 / warehouse"
    ], correctIndex: 0, explanation: "【音声】現場\n\n実際に作業する場所です。" },

    { id: 52, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "朝礼", choices: [
      "朝のミーティング / morning meeting",
      "昼休み / lunch break",
      "作業 / work",
      "掃除 / cleaning"
    ], correctIndex: 0, explanation: "【音声】朝礼\n\n作業前の朝の会議です。" },

    { id: 53, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "交代制", choices: [
      "シフト勤務 / shift work",
      "残業 / overtime",
      "休暇 / holiday",
      "会議 / meeting"
    ], correctIndex: 0, explanation: "【音声】交代制\n\n時間ごとに交代する勤務です。" },

    { id: 54, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "残業", choices: [
      "時間外労働 / overtime",
      "休憩 / break",
      "出勤 / attendance",
      "休日 / holiday"
    ], correctIndex: 0, explanation: "【音声】残業\n\n勤務時間外の仕事です。" },

    { id: 55, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "報告", choices: [
      "結果を伝える / report",
      "連絡 / contact",
      "相談 / consult",
      "会議 / meeting"
    ], correctIndex: 0, explanation: "【音声】報告\n\n上司などに伝えることです。" },

    { id: 56, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "連絡", choices: [
      "情報を伝える / contact",
      "報告 / report",
      "相談 / consult",
      "命令 / order"
    ], correctIndex: 0, explanation: "【音声】連絡\n\n情報を共有することです。" },

    { id: 57, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "相談", choices: [
      "意見を聞く / consult",
      "命令 / order",
      "作業 / work",
      "点検 / check"
    ], correctIndex: 0, explanation: "【音声】相談\n\n問題について話し合うことです。" },

    { id: 58, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "申し送り", choices: [
      "次の人に伝える / handover",
      "作業 / work",
      "休憩 / break",
      "検査 / inspection"
    ], correctIndex: 0, explanation: "【音声】申し送り\n\n交代時に情報を伝えることです。" },

    { id: 59, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "改善", choices: [
      "より良くする / improvement",
      "掃除 / cleaning",
      "修理 / repair",
      "停止 / stop"
    ], correctIndex: 0, explanation: "【音声】改善\n\n作業を良くする活動です。" },

    // ===== 工場環境 =====
    { id: 60, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "騒音", choices: [
      "大きな音 / noise",
      "煙 / smoke",
      "油 / oil",
      "水 / water"
    ], correctIndex: 0, explanation: "【音声】騒音\n\n大きくてうるさい音です。" },

    { id: 61, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "粉塵", choices: [
      "細かいほこり / dust",
      "水 / water",
      "油 / oil",
      "火 / fire"
    ], correctIndex: 0, explanation: "【音声】粉塵\n\n空気中の細かい粉です。" },

    { id: 62, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "油煙", choices: [
      "油の煙 / oil smoke",
      "水蒸気 / steam",
      "火 / fire",
      "砂 / sand"
    ], correctIndex: 0, explanation: "【音声】油煙\n\n油が燃えて出る煙です。" },

    { id: 63, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "引火", choices: [
      "火がつく / ignition",
      "消える / extinguish",
      "壊れる / break",
      "止まる / stop"
    ], correctIndex: 0, explanation: "【音声】引火\n\n火が燃え始めることです。" },

    { id: 64, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "避難", choices: [
      "安全な場所へ逃げる / evacuation",
      "作業 / work",
      "掃除 / cleaning",
      "点検 / inspection"
    ], correctIndex: 0, explanation: "【音声】避難\n\n危険から逃げる行動です。" },

    // ===== 略語・現場用語 =====
    { id: 65, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "報連相", choices: [
      "報告・連絡・相談 / report contact consult",
      "掃除・整頓 / cleaning organize",
      "加工・組立 / machining assembly",
      "安全確認 / safety check"
    ], correctIndex: 0, explanation: "【音声】報連相\n\n職場の基本コミュニケーションです。" },

    { id: 66, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "3K", choices: [
      "きつい・汚い・危険 / hard dirty dangerous",
      "早い・安い・安全 / fast cheap safe",
      "静か・軽い・便利 / quiet light useful",
      "強い・長い・大きい / strong long big"
    ], correctIndex: 0, explanation: "【音声】3K\n\n厳しい仕事環境を表す言葉です。" },

    { id: 67, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "QC", choices: [
      "品質管理 / quality control",
      "安全管理 / safety control",
      "機械管理 / machine control",
      "材料管理 / material control"
    ], correctIndex: 0, explanation: "【音声】QC\n\n品質を管理する活動です。" },

    { id: 68, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "QA", choices: [
      "品質保証 / quality assurance",
      "安全確認 / safety assurance",
      "材料管理 / material control",
      "設備管理 / machine control"
    ], correctIndex: 0, explanation: "【音声】QA\n\n品質を保証する活動です。" },

    { id: 69, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "NC", choices: [
      "数値制御 / numerical control",
      "安全確認 / safety check",
      "品質確認 / quality check",
      "速度制御 / speed control"
    ], correctIndex: 0, explanation: "【音声】NC\n\nコンピュータで機械を制御します。" },

    { id: 70, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "IoT", choices: [
      "機械をネット接続 / internet of things",
      "作業速度 / work speed",
      "品質確認 / quality check",
      "機械停止 / machine stop"
    ], correctIndex: 0, explanation: "【音声】IoT\n\n機械をネットにつなぐ技術です。" },

    { id: 71, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "ポカヨケ", choices: [
      "ミス防止 / mistake proofing",
      "掃除 / cleaning",
      "運搬 / transport",
      "修理 / repair"
    ], correctIndex: 0, explanation: "【音声】ポカヨケ\n\nミスを防ぐ仕組みです。" },

    { id: 72, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "ニコイチ", choices: [
      "2つから1つ作る / combine two into one",
      "1つを2つにする / split",
      "掃除 / cleaning",
      "加工 / machining"
    ], correctIndex: 0, explanation: "【音声】ニコイチ\n\n2つの部品から1つを作ることです。" },

    { id: 73, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "現物", choices: [
      "実際の物 / actual item",
      "写真 / photo",
      "図面 / drawing",
      "説明書 / manual"
    ], correctIndex: 0, explanation: "【音声】現物\n\n実物のことです。" },

    { id: 74, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "DX", choices: [
      "デジタル化 / digital transformation",
      "機械修理 / machine repair",
      "品質管理 / quality control",
      "安全確認 / safety check"
    ], correctIndex: 0, explanation: "【音声】DX\n\nデジタル技術による改革です。" },

    { id: 75, question: "音声を聞いて、意味として正しいものを選んでください。", listeningText: "AGV", choices: [
      "無人搬送車 / automated guided vehicle",
      "フォークリフト / forklift",
      "台車 / cart",
      "クレーン / crane"
    ], correctIndex: 0, explanation: "【音声】AGV\n\n自動で荷物を運ぶ車です。" },
  ]
}