// --- データ管理 ---
// カテゴリID, 知識ID, 思考IDのユニーク生成用カウンタ
let idCounter = 1;
function generateId() { return 'id-' + idCounter++; }

// データ構造の例（メモリ上のみで保持）
let memories = [
    // 例として初期データを入れたい場合はここに記述
    // { id: 'c1', type: 'category', name: '例: プログラミング', collapsed: false, items: [] }
];

let thoughts = [
    // { id: 't1', name: '思考A', text: '', items: [] } 
];

// --- DOM要素 ---
const memoryListEl = document.getElementById('memory-list');
const thoughtContainerEl = document.getElementById('thought-container');
const modalOverlay = document.getElementById('modal-overlay');
const categoryGroup = document.getElementById('input-category-group');
const knowledgeGroup = document.getElementById('input-knowledge-group');
const targetCategorySelect = document.getElementById('target-category-select');

// --- 初期化 ---
renderMemories();
renderThoughts();

// --- イベントリスナー ---

// 記憶追加ボタン（モーダル表示）
document.getElementById('add-memory-btn').addEventListener('click', () => {
    // モーダルのリセット
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-knowledge-name').value = '';
    document.getElementById('new-knowledge-relation').value = '';
    
    // カテゴリ選択肢の更新
    targetCategorySelect.innerHTML = '';
    memories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        targetCategorySelect.appendChild(opt);
    });

    // 表示切替
    const radios = document.getElementsByName('createType');
    radios[0].checked = true; // デフォルトはカテゴリ
    toggleModalInputs('category');

    modalOverlay.style.display = 'flex';
});

// ラジオボタン切り替え時の表示制御
document.getElementsByName('createType').forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleModalInputs(e.target.value);
    });
});

function toggleModalInputs(type) {
    if (type === 'category') {
        categoryGroup.style.display = 'block';
        knowledgeGroup.style.display = 'none';
    } else {
        categoryGroup.style.display = 'none';
        knowledgeGroup.style.display = 'block';
    }
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

// 記憶の保存処理
function saveMemory() {
    const type = document.querySelector('input[name="createType"]:checked').value;
    
    if (type === 'category') {
        const name = document.getElementById('new-category-name').value;
        if (!name) return alert('カテゴリ名を入力してください');
        
        memories.push({
            id: generateId(),
            type: 'category',
            name: name,
            collapsed: false,
            items: []
        });

    } else {
        if (memories.length === 0) return alert('先にカテゴリを作成してください');
        
        const catId = targetCategorySelect.value;
        const name = document.getElementById('new-knowledge-name').value;
        const relation = document.getElementById('new-knowledge-relation').value;
        
        if (!name || !relation) return alert('知識名と関係を入力してください');

        const category = memories.find(m => m.id === catId);
        if (category) {
            category.items.push({
                id: generateId(),
                type: 'knowledge',
                name: name,
                relation: relation
            });
            // 新規追加時は開く
            category.collapsed = false; 
        }
    }
    closeModal();
    renderMemories();
}

// 思考追加ボタン
document.getElementById('add-thought-btn').addEventListener('click', () => {
    const name = prompt("思考名を入力してください", "新しい思考");
    if (name) {
        thoughts.push({
            id: generateId(),
            name: name,
            text: "",
            droppedItems: []
        });
        renderThoughts();
    }
});

// --- 描画関数 ---

function renderMemories() {
    memoryListEl.innerHTML = '';
    
    memories.forEach((cat, index) => {
        const catDiv = document.createElement('div');
        catDiv.className = 'category-item';
        // ドラッグ可能にする
        catDiv.setAttribute('draggable', 'true');
        catDiv.ondragstart = (e) => handleDragStart(e, { type: 'category', name: cat.name, id: cat.id });

        // ヘッダー（名前、折りたたみ、編集、削除）
        const header = document.createElement('div');
        header.className = 'category-header';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'category-content';
        contentDiv.onclick = () => toggleCollapse(index); // クリックで折りたたみ

        const arrow = document.createElement('span');
        arrow.textContent = cat.collapsed ? '▶' : '▼';
        arrow.style.fontSize = '10px';
        arrow.style.marginRight = '5px';

        const title = document.createElement('span');
        title.textContent = cat.name;

        contentDiv.appendChild(arrow);
        contentDiv.appendChild(title);

        const controls = document.createElement('div');
        
        // 編集ボタン
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.textContent = '✎';
        editBtn.onclick = (e) => { e.stopPropagation(); editCategory(index); };

        // 削除ボタン
        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn';
        delBtn.textContent = '×';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteCategory(index); };

        controls.appendChild(editBtn);
        controls.appendChild(delBtn);

        header.appendChild(contentDiv);
        header.appendChild(controls);
        catDiv.appendChild(header);

        // 知識リスト
        const kList = document.createElement('div');
        kList.className = 'knowledge-list' + (cat.collapsed ? ' collapsed' : '');

        cat.items.forEach((item, kIndex) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'knowledge-item';
            itemDiv.setAttribute('draggable', 'true');
            itemDiv.ondragstart = (e) => handleDragStart(e, { type: 'knowledge', name: item.name, relation: item.relation, id: item.id });

            const info = document.createElement('div');
            info.className = 'knowledge-info';
            info.innerHTML = `<span class="knowledge-name">${item.name}</span><span class="knowledge-relation">(${item.relation})</span>`;

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

function renderThoughts() {
    thoughtContainerEl.innerHTML = '';

    thoughts.forEach((th, index) => {
        const card = document.createElement('div');
        card.className = 'thought-card';

        // ヘッダー
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

        // ボディ
        const body = document.createElement('div');
        body.className = 'thought-body';

        // 自由入力
        const label1 = document.createElement('div');
        label1.className = 'input-area-label';
        label1.textContent = '自由入力欄';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'free-input';
        textarea.value = th.text;
        textarea.oninput = (e) => { thoughts[index].text = e.target.value; };

        // 配置一覧（ドロップゾーン）
        const label2 = document.createElement('div');
        label2.className = 'drop-area-label';
        label2.textContent = '配置一覧 (ドラッグ&ドロップ)';

        const dropZone = document.createElement('div');
        dropZone.className = 'drop-area';
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
        dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
        dropZone.ondrop = (e) => handleDrop(e, index);

        // ドロップされたアイテムの描画
        th.droppedItems.forEach((dItem, dIndex) => {
            const dEl = document.createElement('div');
            dEl.className = 'dropped-item';
            let content = `<b>${dItem.name}</b>`;
            if(dItem.type === 'knowledge') {
                content += ` <small>(${dItem.relation})</small>`;
            } else {
                content += ` <small>[カテゴリ]</small>`;
            }
            dEl.innerHTML = content;
            
            // 削除ボタン（配置から削除）
            const removeBtn = document.createElement('button');
            removeBtn.className = 'icon-btn';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => {
                thoughts[index].droppedItems.splice(dIndex, 1);
                renderThoughts();
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

// --- 操作系ロジック ---

// カテゴリ操作
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

// 知識操作
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

// 思考操作
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

// --- ドラッグ&ドロップ処理 ---

function handleDragStart(e, data) {
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
}

function handleDrop(e, thoughtIndex) {
    e.preventDefault();
    e.target.closest('.drop-area').classList.remove('drag-over');
    
    const raw = e.dataTransfer.getData('text/plain');
    if(!raw) return;

    try {
        const data = JSON.parse(raw);
        // 思考データに追加
        thoughts[thoughtIndex].droppedItems.push(data);
        renderThoughts();
    } catch(err) {
        console.error("Drop error", err);
    }
}
