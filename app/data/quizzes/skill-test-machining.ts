
import type { Quiz } from "@/app/data/types"

export const skillTestMachiningQuiz: Quiz = {
  id: "skill-test-machining",
  title: "技能検定 機械加工 学科",
  description: "技能検定の学科試験対策（○×問題）",
  questions: [
    { id:1, sectionId:"safety", question:"作業服の袖口は、機械に巻き込まれないようボタンを締める。", choices:["〇","×"], correctIndex:0, explanation:"巻き込み事故防止のため袖口は締める。" },
    { id:2, sectionId:"safety", question:"5Sとは、整理、整頓、清掃、清潔、しつけのことである。", choices:["〇","×"], correctIndex:0, explanation:"5Sは整理・整頓・清掃・清潔・しつけ。" },
    { id:3, sectionId:"safety", question:"グラインダー作業では保護めがねを着用する。", choices:["〇","×"], correctIndex:0, explanation:"火花や破片から目を守るため。" },
    { id:4, sectionId:"safety", question:"機械に異常を感じても作業を続ける。", choices:["〇","×"], correctIndex:1, explanation:"異常時はすぐ停止して確認する。" },
    { id:5, sectionId:"safety", question:"ノギスの測定面は使用前に拭く。", choices:["〇","×"], correctIndex:0, explanation:"測定誤差防止。" },
    { id:6, sectionId:"safety", question:"第三角法では正面図の上に平面図を配置する。", choices:["〇","×"], correctIndex:0, explanation:"第三角法の配置ルール。" },
    { id:7, sectionId:"safety", question:"10cmは1000mmである。", choices:["〇","×"], correctIndex:1, explanation:"10cm=100mm。" },
    { id:8, sectionId:"safety", question:"鋼は焼き入れすると硬くなる。", choices:["〇","×"], correctIndex:0, explanation:"焼入れで硬度が上がる。" },
    { id:9, sectionId:"safety", question:"ヒヤリハットは事故後の報告である。", choices:["〇","×"], correctIndex:1, explanation:"事故にならなかった危険事例。" },
    { id:10, sectionId:"safety", question:"電気火災には水をかける。", choices:["〇","×"], correctIndex:1, explanation:"感電危険。適切な消火器を使用。" },
    { id:11, sectionId:"safety", question:"通路に荷物を置くのは危険である。", choices:["〇","×"], correctIndex:0, explanation:"転倒や避難の妨げになる。" },
    { id:12, sectionId:"safety", question:"油のついたウエスはふた付き金属容器へ捨てる。", choices:["〇","×"], correctIndex:0, explanation:"自然発火防止。" },
    { id:13, sectionId:"safety", question:"回転部分に手袋で触れてはいけない。", choices:["〇","×"], correctIndex:0, explanation:"巻き込み事故防止。" },
    { id:14, sectionId:"safety", question:"労働安全衛生法は働く人の安全を守る法律。", choices:["〇","×"], correctIndex:0, explanation:"安全と健康の確保。" },
    { id:15, sectionId:"safety", question:"騒音の大きい場所では耳栓を使用する。", choices:["〇","×"], correctIndex:0, explanation:"聴覚保護。" },

    { id:16, sectionId:"machining", question:"切削速度は工具や材料に関係なく一定。", choices:["〇","×"], correctIndex:1, explanation:"材料や工具で変わる。" },
    { id:17, sectionId:"machining", question:"超硬工具は高速切削に適する。", choices:["〇","×"], correctIndex:0, explanation:"高速加工向き。" },
    { id:18, sectionId:"machining", question:"チップブレーカは切りくずを短くする。", choices:["〇","×"], correctIndex:0, explanation:"巻き付き防止。" },
    { id:19, sectionId:"machining", question:"回転中チャックを手で止める。", choices:["〇","×"], correctIndex:1, explanation:"非常に危険。" },
    { id:20, sectionId:"machining", question:"マシニングの原点復帰は重要である。", choices:["〇","×"], correctIndex:0, explanation:"基準位置の確認。" },
    { id:21, sectionId:"machining", question:"クーラントは冷却と潤滑のため使う。", choices:["〇","×"], correctIndex:0, explanation:"工具寿命向上。" },
    { id:22, sectionId:"machining", question:"構成刃先ができると仕上げ面が良くなる。", choices:["〇","×"], correctIndex:1, explanation:"面粗さ悪化。" },
    { id:23, sectionId:"machining", question:"深穴加工ではドリルを戻し切りくず排出。", choices:["〇","×"], correctIndex:0, explanation:"詰まり防止。" },
    { id:24, sectionId:"machining", question:"ダウンカットは常に刃物寿命が短い。", choices:["〇","×"], correctIndex:1, explanation:"条件次第。" },
    { id:25, sectionId:"machining", question:"刃先が芯高より高いと逃げ角が小さい。", choices:["〇","×"], correctIndex:0, explanation:"切削条件悪化。" },
    { id:26, sectionId:"machining", question:"正面フライスは広い平面加工に適する。", choices:["〇","×"], correctIndex:0, explanation:"平面加工向き。" },
    { id:27, sectionId:"machining", question:"M03は主軸正転。", choices:["〇","×"], correctIndex:0, explanation:"NCコード。" },
    { id:28, sectionId:"machining", question:"G00は直線補間の切削送り。", choices:["〇","×"], correctIndex:1, explanation:"G01が切削送り。" },
    { id:29, sectionId:"machining", question:"加工直後のワークは素手で触らない。", choices:["〇","×"], correctIndex:0, explanation:"高温の可能性。" },
    { id:30, sectionId:"machining", question:"工具摩耗が進むと寸法誤差が出やすい。", choices:["〇","×"], correctIndex:0, explanation:"精度低下。" }
  ]
}
