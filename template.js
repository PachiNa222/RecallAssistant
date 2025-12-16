/* =========================================
   templates.js: テンプレートデータの定義
   ========================================= */

// テンプレートの定義
// キー（"math", "cooking"など）が呼び出し用IDになります
const TEMPLATES = {
    "math": [
        {
            name: "数学",
            items: [
                { name: "三角関数", relation: "幾何学" },
                { name: "微分積分", relation: "解析学" },
                { name: "確率統計", relation: "応用数学" }
            ]
        },
        {
            name: "物理",
            items: [
                { name: "ニュートン力学", relation: "古典" },
                { name: "相対性理論", relation: "現代" }
            ]
        }
    ],
    "cooking": [
        {
            name: "和食",
            items: [
                { name: "肉じゃが", relation: "煮物" },
                { name: "味噌汁", relation: "汁物" }
            ]
        },
        {
            name: "イタリアン",
            items: [
                { name: "ペペロンチーノ", relation: "パスタ" },
                { name: "マルゲリータ", relation: "ピザ" }
            ]
        }
    ]
};
