/* =========================================
   JavaScript: ロジックの実装
   ========================================= */

// --- データ管理用の変数 ---
let idCounter = 1;
// ユニークIDを生成するヘルパー関数
function generateId() { return 'id-' + idCounter++; }

// 「記憶」データを保持する配列（カテゴリ > 知識 の階層構造）
let memories = [];
// 「思考」データを保持する配列（思考カードリスト）
let thoughts = [];

// --- DOM要素の取得 ---
const memoryListEl = document.getElementById('memory-list');
const thoughtContainerEl = document.getElementById('thought-container');
const modalOverlay = document.getElementById('modal-overlay');
const categoryGroup = document.getElementById('input-category-group');
const knowledgeGroup = document.getElementById('input-knowledge-group');
const targetCategorySelect = document.getElementById('target-category-select');

// --- 初期化処理（画面ロード時に実行） ---
renderMemories(); // 左側の描画
renderThoughts(); // 右側の描画

// --- イベントリスナー設定 ---

// 【ボタン】記憶追加（「＋」ボタン）クリック時
document.getElementById('add-memory-btn').addEventListener('click', () => {
    // 入力欄をクリア
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-knowledge-name').value = '';
    document.getElementById('new-knowledge-relation').value = '';
    
    // 知識追加用に、既存のカテゴリ一覧をセレクトボックスにセット
    targetCategorySelect.innerHTML = '';
    memories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        targetCategorySelect.appendChild(opt);
    });

    // デフォルト表示（カテゴリ作成モード）にリセット
    const radios = document.getElementsByName('createType');
    radios[0].checked = true;
    toggleModalInputs('category');

    // モーダルを表示
    modalOverlay.style.display = 'flex';
});

// 【ラジオボタン】作成タイプ切り替え時の表示制御
document.getElementsByName('createType').forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleModalInputs(e.target.value);
    });
});

// モーダルの入力欄表示切り替え関数
function toggleModalInputs(type) {
    if (type === 'category') {
        categoryGroup.style.display = 'block';
        knowledgeGroup.style.display = 'none';
    } else {
        categoryGroup.style.display = 'none';
        knowledgeGroup.style.display = 'block';
    }
}

// モーダルを閉じる関数
function closeModal() {
    modalOverlay.style.display = 'none';
}

// 【保存処理】モーダルの「作成」ボタンが押された時
function saveMemory() {
    const type = document.querySelector('input[name="createType"]:checked').value;
    
    if (type === 'category') {
        // カテゴリの新規作成
        const name = document.getElementById('new-category-name').value;
        if (!name) return alert('カテゴリ名を入力してください');
        
        memories.push({
            id: generateId(),
            type: 'category',
            name: name,
            collapsed: false, // 折りたたみ状態
            items: [] // この中に知識が入る
        });

    } else {
        // 知識の新規作成
        if (memories.length === 0) return alert('先にカテゴリを作成してください');
        
        const catId = targetCategorySelect.value;
        const name = document.getElementById('new-knowledge-name').value;
        const relation = document.getElementById('new-knowledge-relation').value;
        
        if (!name || !relation) return alert('知識名と関係を入力してください');

        // 選択されたカテゴリを探して知識を追加
        const category = memories.find(m => m.id === catId);
        if (category) {
            category.items.push({
                id: generateId(),
                type: 'knowledge',
                name: name,
                relation: relation
            });
            category.collapsed = false; // 追加されたことがわかるように展開する
        }
    }
    closeModal();
    renderMemories(); // 画面更新
}

// 【ボタン】思考追加（「＋」ボタン）クリック時
document.getElementById('add-thought-btn').addEventListener('click', () => {
    const name = prompt("思考名を入力してください", "新しい思考");
    if (name) {
        thoughts.push({
            id: generateId(),
            name: name,
            text: "",
            droppedItems: [] // ここにドラッグ＆ドロップされたアイテムID等が入る
        });
        renderThoughts(); // 画面更新
    }
});

// --- 描画系関数（データを元にHTMLを生成） ---

// 左側：「記憶」リストの描画
function renderMemories() {
    memoryListEl.innerHTML = ''; // 一旦クリア
    
    memories.forEach((cat, index) => {
        // カテゴリのコンテナ
        const catDiv = document.createElement('div');
        catDiv.className = 'category-item';
        
        // ★カテゴリもドラッグ可能にする設定
        catDiv.setAttribute('draggable', 'true');
        // ドラッグ開始時にデータをセットする
        catDiv.ondragstart = (e) => handleDragStart(e, { type: 'category', name: cat.name, id: cat.id });

        // カテゴリヘッダー（名前、開閉ボタン、編集・削除ボタン）
        const header = document.createElement('div');
        header.className = 'category-header';
        
        // 名前部分（クリックで折りたたみ）
        const contentDiv = document.createElement('div');
        contentDiv.className = 'category-content';
        contentDiv.onclick = () => toggleCollapse(index);

        const arrow = document.createElement('span');
        arrow.textContent = cat.collapsed ? '▶' : '▼'; // 折りたたみ状態アイコン
        arrow.style.fontSize = '10px';
        arrow.style.marginRight = '5px';

        const title = document.createElement('span');
        title.textContent = cat.name;

        contentDiv.appendChild(arrow);
        contentDiv.appendChild(title);

        // 操作ボタン部分
        const controls = document.createElement('div');
        
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.textContent = '✎';
        editBtn.onclick = (e) => { e.stopPropagation(); editCategory(index); }; // バブリング防止

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn';
        delBtn.textContent = '×';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteCategory(index); };

        controls.appendChild(editBtn);
        controls.appendChild(delBtn);

        header.appendChild(contentDiv);
        header.appendChild(controls);
        catDiv.appendChild(header);

        // カテゴリ内の知識リスト
        const kList = document.createElement('div');
        kList.className = 'knowledge-list' + (cat.collapsed ? ' collapsed' : '');

        cat.items.forEach((item, kIndex) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'knowledge-item';
            
            // ★「知識」をドラッグ可能にする設定
            itemDiv.setAttribute('draggable', 'true');
            // ★ドラッグ開始時、「関係」も含めたデータをセットする
            itemDiv.ondragstart = (e) => handleDragStart(e, { 
                type: 'knowledge', 
                name: item.name, 
                relation: item.relation, 
                id: item.id 
            });

            // 知識の表示内容（名前＋関係）
            const info = document.createElement('div');
            info.className = 'knowledge-info';
            info.innerHTML = `<span class="knowledge-name">${item.name}</span><span class="knowledge-relation">(${item.relation})</span>`;

            // 知識の操作ボタン
            const itemControls = document.createElement('div');
            const kEditBtn = document.createElement('button');
            kEditBtn.className = 'icon-btn';
            kEditBtn.textContent = '✎';
            kEditBtn.onclick = () => editKnowledge(index, kIndex);

            const kDelBtn = document.createElement('button');
            kDelBtn.className = 'icon-btn';
            kDelBtn.textContent = '×';
            kDelBtn.onclick = () => deleteKnowledge(index, kIndex);

            itemControls.appendChild(kEditBtn);
            itemControls.appendChild(kDelBtn);

            itemDiv.appendChild(info);
            itemDiv.appendChild(itemControls);
            kList.appendChild(itemDiv);
        });

        catDiv.appendChild(kList);
        memoryListEl.appendChild(catDiv);
    });
}

// 右側：「思考」カードの描画
function renderThoughts() {
    thoughtContainerEl.innerHTML = ''; // 一旦クリア

    thoughts.forEach((th, index) => {
        const card = document.createElement('div');
        card.className = 'thought-card';

        // カードヘッダー（思考名、削除ボタン）
        const header = document.createElement('div');
        header.className = 'thought-header';

        const title = document.createElement('div');
        title.className = 'thought-title';
        title.textContent = th.name;
        title.onclick = () => editThoughtName(index);
        title.title = "クリックして名前を編集";

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn';
        delBtn.textContent = '削除';
        delBtn.onclick = () => deleteThought(index);

        header.appendChild(title);
        header.appendChild(delBtn);
        card.appendChild(header);

        // カードボディ
        const body = document.createElement('div');
        body.className = 'thought-body';

        // 自由入力欄
        const label1 = document.createElement('div');
        label1.className = 'input-area-label';
        label1.textContent = '自由入力欄';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'free-input';
        textarea.value = th.text;
        // 入力内容を即座にデータに反映
        textarea.oninput = (e) => { thoughts[index].text = e.target.value; };

        // ★配置一覧（ドロップゾーン）
        const label2 = document.createElement('div');
        label2.className = 'drop-area-label';
        label2.textContent = '配置一覧 (ドラッグ&ドロップ)';

        const dropZone = document.createElement('div');
        dropZone.className = 'drop-area';
        // ドラッグ中の見た目制御
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
        dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
        // ドロップ時の処理
        dropZone.ondrop = (e) => handleDrop(e, index);

        // ドロップされたアイテムの表示ループ
        th.droppedItems.forEach((dItem, dIndex) => {
            const dEl = document.createElement('div');
            dEl.className = 'dropped-item';
            
            let content = '';
            if(dItem.type === 'knowledge') {
                // ★修正箇所：データが「知識」の場合、「知識名」に加えて「関係」も表示するHTMLを作成
                content = `<span class="dropped-name">${dItem.name}</span> <span class="dropped-relation">${dItem.relation}</span>`;
            } else {
                // データが「カテゴリ」の場合
                content = `<span class="dropped-name">${dItem.name}</span> <span class="dropped-category-tag">[カテゴリ]</span>`;
            }
            dEl.innerHTML = content;
            
            // アイテム削除ボタン（配置から削除）
            const removeBtn = document.createElement('button');
            removeBtn.className = 'icon-btn';
            removeBtn.textContent = '×';
            removeBtn.style.marginLeft = "auto";
            removeBtn.onclick = () => {
                thoughts[index].droppedItems.splice(dIndex, 1);
                renderThoughts(); // 再描画
            };
            dEl.appendChild(removeBtn);
            dropZone.appendChild(dEl);
        });

        body.appendChild(label1);
        body.appendChild(textarea);
        body.appendChild(label2);
        body.appendChild(dropZone);

        card.appendChild(body);
        thoughtContainerEl.appendChild(card);
    });
}

// --- データ操作・編集系ロジック ---

function toggleCollapse(index) {
    memories[index].collapsed = !memories[index].collapsed;
    renderMemories();
}
function deleteCategory(index) {
    if(confirm("このカテゴリと含まれる知識を削除しますか？")) {
        memories.splice(index, 1);
        renderMemories();
    }
}
function editCategory(index) {
    const newName = prompt("カテゴリ名を編集:", memories[index].name);
    if(newName) {
        memories[index].name = newName;
        renderMemories();
    }
}

function deleteKnowledge(catIndex, kIndex) {
    if(confirm("この知識を削除しますか？")) {
        memories[catIndex].items.splice(kIndex, 1);
        renderMemories();
    }
}
function editKnowledge(catIndex, kIndex) {
    const item = memories[catIndex].items[kIndex];
    const newName = prompt("知識名を編集:", item.name);
    if(newName !== null) {
        const newRel = prompt("関係を編集:", item.relation);
        if(newRel !== null) {
            item.name = newName;
            item.relation = newRel;
            renderMemories();
        }
    }
}

function deleteThought(index) {
    if(confirm("この思考シートを削除しますか？")) {
        thoughts.splice(index, 1);
        renderThoughts();
    }
}
function editThoughtName(index) {
    const newName = prompt("思考名を編集:", thoughts[index].name);
    if(newName) {
        thoughts[index].name = newName;
        renderThoughts();
    }
}

// --- ★ドラッグ&ドロップの制御ロジック ---

// ドラッグ開始時：データをJSON文字列にして転送用オブジェクトにセット
function handleDragStart(e, data) {
    // 【重要】イベントの伝播を止める。
    // これがないと、知識(子)をドラッグしてもカテゴリ(親)のイベントも発火し、
    // 親のデータ(カテゴリ名)で上書きされてしまいます。
    e.stopPropagation(); 

    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy'; // コピー操作であることを明示
}

// ドロップ時：データを受け取り、対象の「思考」データに追加
function handleDrop(e, thoughtIndex) {
    e.preventDefault(); // デフォルトの挙動（ファイルを開くなど）をキャンセル
    e.target.closest('.drop-area').classList.remove('drag-over'); // 背景色戻す
    
    const raw = e.dataTransfer.getData('text/plain');
    if(!raw) return;

    try {
        // 文字列として受け取ったデータをオブジェクトに戻す
        const data = JSON.parse(raw);
        // 該当する思考カードの配置アイテムリストに追加
        thoughts[thoughtIndex].droppedItems.push(data);
        renderThoughts(); // 再描画して表示
    } catch(err) {
        console.error("Drop error", err);
    }
}
