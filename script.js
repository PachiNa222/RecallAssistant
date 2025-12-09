document.addEventListener('DOMContentLoaded', () => {
    const memoryList = document.getElementById('memory-list');
    const thoughtList = document.getElementById('thought-list');
    const addMemoryBtn = document.getElementById('add-memory-btn');
    const addThoughtBtn = document.getElementById('add-thought-btn');

    // モーダル要素 (記憶用)
    const memoryModal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const closeMemoryBtn = document.getElementById('close-modal-btn');
    const saveMemoryBtn = document.getElementById('save-memory-btn');
    const memoryTypeSelect = document.getElementById('memory-type-select');
    const categoryInput = document.getElementById('category-input');
    const knowledgeInput = document.getElementById('knowledge-input');
    const parentCategorySelect = document.getElementById('parent-category');

    // モーダル要素 (思考用)
    const thoughtModal = document.getElementById('thought-modal');
    const closeThoughtBtn = document.getElementById('close-thought-modal-btn');
    const saveThoughtBtn = document.getElementById('save-thought-btn');
    const thoughtNameEdit = document.getElementById('thought-name-edit');

    let memoryCounter = 0;
    let thoughtCounter = 0;
    let currentEditId = null; // 編集中の要素のID

    // --- サイト初期状態 (記憶も思考もなし) ---
    // 初期データのレンダリングを削除し、リストは空のまま。

    // --- 記憶アイテムの追加/編集関数 ---
    function addMemory(id, name, type, parentId, relation) {
        let item;

        if (id) {
            // 編集モード
            item = memoryList.querySelector(`[data-id="${id}"]`);
            item.setAttribute('data-name', name);
            item.setAttribute('data-relation', relation);
        } else {
            // 新規作成モード
            memoryCounter++;
            id = `memory-${memoryCounter}`;
            item = document.createElement('div');
            item.classList.add('memory-item', `${type}-item`);
            item.setAttribute('draggable', true);
            item.setAttribute('data-id', id);
            item.setAttribute('data-type', type);
            item.setAttribute('data-name', name);
            item.setAttribute('data-relation', relation || '');
        }

        // 共通の描画ロジック
        if (type === 'category') {
            item.innerHTML = `
                <div>
                    <span class="toggle-icon ion-ios-arrow-down"></span>
                    <span class="memory-name">📁 ${name}</span>
                </div>
                <div class="memory-actions">
                    <button class="action-btn edit-memory-btn" data-id="${id}"><i class="icon ion-edit"></i></button>
                    <button class="action-btn delete-memory-btn" data-id="${id}"><i class="icon ion-trash-a delete-btn"></i></button>
                </div>
            `;
            item.setAttribute('data-collapsed', 'false');
            item.classList.remove('knowledge-item');
            item.classList.add('category-item');
        } else { // 知識
            item.innerHTML = `
                <div>
                    <span class="memory-name">💡 ${name}</span>
                    <div class="relation">${relation}</div>
                </div>
                <div class="memory-actions">
                    <button class="action-btn edit-memory-btn" data-id="${id}"><i class="icon ion-edit"></i></button>
                    <button class="action-btn delete-memory-btn" data-id="${id}"><i class="icon ion-trash-a delete-btn"></i></button>
                </div>
            `;
            item.classList.remove('category-item');
            item.classList.add('knowledge-item');
        }

        // 既存の要素の移動（新規作成または編集による親の変更時）
        if (!id || item.parentNode !== memoryList) {
             memoryList.appendChild(item); // とりあえずリストに追加
        }

        // 階層構造の適用（知識の場合）
        if (type === 'knowledge' && parentId) {
            const parentElement = memoryList.querySelector(`[data-id="${parentId}"]`);
            if (parentElement) {
                // 知識を親カテゴリの直後の適切な位置に移動させる（DOM操作）
                let nextSibling = parentElement.nextElementSibling;
                while (nextSibling && nextSibling.classList.contains('knowledge-item')) {
                    nextSibling = nextSibling.nextElementSibling;
                }
                memoryList.insertBefore(item, nextSibling);
            }
        }
        
        setupEventListeners(item);
        updateCategorySelect();
    }

    // --- 思考ブロックの追加/編集関数 ---
    function addThought(id, name = '新しい思考') {
        let block;
        
        if (id) {
            // 編集モード
            block = thoughtList.querySelector(`[data-id="${id}"]`);
            block.querySelector('.thought-name').textContent = name;
        } else {
            // 新規作成モード
            thoughtCounter++;
            id = `thought-${thoughtCounter}`;
            block = document.createElement('div');
            block.classList.add('thought-block');
            block.setAttribute('data-id', id);

            block.innerHTML = `
                <h3>
                    <span class="thought-name">${name}</span>
                    <div class="thought-actions">
                        <button class="action-btn edit-thought-btn" data-id="${id}"><i class="icon ion-edit"></i></button>
                        <button class="action-btn delete-thought-btn" data-id="${id}"><i class="icon ion-trash-a delete-btn"></i></button>
                    </div>
                </h3>
                <div class="free-input-area">
                    <textarea placeholder="自由入力欄"></textarea>
                </div>
                <div class="placement-area" data-thought-id="${id}">配置欄</div>
            `;

            thoughtList.appendChild(block);
        }

        setupThoughtEventListeners(block);
        setupDropZone(block.querySelector('.placement-area'));
    }

    // --- カテゴリ選択肢の更新 ---
    function updateCategorySelect() {
        parentCategorySelect.innerHTML = '<option value="">(なし/カテゴリを選択)</option>';
        memoryList.querySelectorAll('.category-item').forEach(category => {
            const option = document.createElement('option');
            option.value = category.getAttribute('data-id');
            option.textContent = category.getAttribute('data-name');
            parentCategorySelect.appendChild(option);
        });
    }
    
    // --- イベントリスナーの設定 ---
    function setupEventListeners(item) {
        // ドラッグ＆ドロップ設定
        setupDragDrop(item);

        // カテゴリの折りたたみ機能
        if (item.classList.contains('category-item')) {
            item.addEventListener('click', (e) => {
                // 編集・削除ボタンのクリックは無視
                if (e.target.closest('.memory-actions')) return;
                
                const isCollapsed = item.getAttribute('data-collapsed') === 'true';
                item.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
                
                // 次の兄弟要素をチェックし、知識アイテムを非表示/表示
                let next = item.nextElementSibling;
                while (next && next.classList.contains('knowledge-item')) {
                    next.style.display = isCollapsed ? 'flex' : 'none';
                    next = next.nextElementSibling;
                }
            });
        }

        // 編集ボタン
        item.querySelector('.edit-memory-btn').addEventListener('click', () => openMemoryModal(item.getAttribute('data-id')));

        // 削除ボタン
        item.querySelector('.delete-memory-btn').addEventListener('click', (e) => {
            if (confirm('この記憶を削除してもよろしいですか？')) {
                const id = e.currentTarget.getAttribute('data-id');
                const elementToDelete = memoryList.querySelector(`[data-id="${id}"]`);
                
                // カテゴリを削除する場合、配下の知識も削除
                if (elementToDelete.classList.contains('category-item')) {
                    let next = elementToDelete.nextElementSibling;
                    while (next && next.classList.contains('knowledge-item')) {
                        const nextToDelete = next;
                        next = next.nextElementSibling;
                        nextToDelete.remove();
                    }
                }
                
                elementToDelete.remove();
                updateCategorySelect();
            }
        });
    }

    function setupThoughtEventListeners(block) {
        // 編集ボタン
        block.querySelector('.edit-thought-btn').addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const name = block.querySelector('.thought-name').textContent;
            openThoughtModal(id, name);
        });

        // 削除ボタン
        block.querySelector('.delete-thought-btn').addEventListener('click', (e) => {
            if (confirm('この思考ブロックを削除してもよろしいですか？')) {
                e.target.closest('.thought-block').remove();
            }
        });
    }

    // --- 記憶モーダルを開く ---
    function openMemoryModal(id = null) {
        currentEditId = id;
        
        if (id) {
            modalTitle.textContent = '記憶を編集';
            const item = memoryList.querySelector(`[data-id="${id}"]`);
            const type = item.getAttribute('data-type');
            
            memoryTypeSelect.value = type;
            memoryTypeSelect.disabled = true; // 編集時はタイプ変更不可
            
            if (type === 'category') {
                document.getElementById('category-name').value = item.getAttribute('data-name');
                categoryInput.style.display = 'block';
                knowledgeInput.style.display = 'none';
            } else {
                document.getElementById('knowledge-name').value = item.getAttribute('data-name');
                document.getElementById('element-relation').value = item.getAttribute('data-relation');
                categoryInput.style.display = 'none';
                knowledgeInput.style.display = 'block';
                // 所属カテゴリの特定は複雑になるため、今回は簡易的に親の選択をスキップ
            }
        } else {
            modalTitle.textContent = '記憶を追加';
            document.getElementById('category-name').value = '';
            document.getElementById('knowledge-name').value = '';
            document.getElementById('element-relation').value = '';
            memoryTypeSelect.value = 'category';
            memoryTypeSelect.disabled = false;
            categoryInput.style.display = 'block';
            knowledgeInput.style.display = 'none';
        }
        
        memoryModal.style.display = 'block';
    }

    // --- 思考モーダルを開く ---
    function openThoughtModal(id, name) {
        currentEditId = id;
        thoughtNameEdit.value = name;
        thoughtModal.style.display = 'block';
    }

    // --- 記憶モーダル保存処理 ---
    saveMemoryBtn.addEventListener('click', () => {
        const type = memoryTypeSelect.value;
        let name, relation, parentId = null;

        if (type === 'category') {
            name = document.getElementById('category-name').value.trim();
        } else {
            name = document.getElementById('knowledge-name').value.trim();
            relation = document.getElementById('element-relation').value.trim();
            // 新規作成時のみ親カテゴリを選択可能にする
            if (!currentEditId) {
                 parentId = parentCategorySelect.value;
            } else {
                // 編集時はDOM上の位置を優先
                const item = memoryList.querySelector(`[data-id="${currentEditId}"]`);
                const prev = item.previousElementSibling;
                if(prev && prev.classList.contains('category-item')) {
                    parentId = prev.getAttribute('data-id');
                }
            }
        }

        if (name) {
            addMemory(currentEditId, name, type, parentId, relation);
            memoryModal.style.display = 'none';
            currentEditId = null;
        } else {
            alert('名前を入力してください。');
        }
    });

    // --- 思考モーダル保存処理 ---
    saveThoughtBtn.addEventListener('click', () => {
        const newName = thoughtNameEdit.value.trim();
        if (newName && currentEditId) {
            addThought(currentEditId, newName);
            thoughtModal.style.display = 'none';
            currentEditId = null;
        } else {
            alert('思考名を入力してください。');
        }
    });

    // --- モーダル閉じるイベント ---
    closeMemoryBtn.addEventListener('click', () => memoryModal.style.display = 'none');
    closeThoughtBtn.addEventListener('click', () => thoughtModal.style.display = 'none');
    window.onclick = (event) => {
        if (event.target === memoryModal) memoryModal.style.display = 'none';
        if (event.target === thoughtModal) thoughtModal.style.display = 'none';
    };

    // --- ドラッグ＆ドロップ機能 (再定義) ---
    
    // ドラッグ開始時
    function setupDragDrop(item) {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
            e.dataTransfer.effectAllowed = 'copy';
            e.target.style.opacity = '0.4';
        });

        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
    }

    // ドロップゾーンの設定
    function setupDropZone(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'copy';
            dropZone.style.backgroundColor = '#E6FFFA';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.backgroundColor = '#FAFAFA'; 
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = '#FAFAFA';

            const memoryId = e.dataTransfer.getData('text/plain');
            const originalItem = document.querySelector(`[data-id="${memoryId}"]`);
            
            if (originalItem) {
                const name = originalItem.getAttribute('data-name');
                const relation = originalItem.getAttribute('data-relation');
                const type = originalItem.getAttribute('data-type');
                
                const newPlacedItem = document.createElement('span');
                newPlacedItem.classList.add('placed-item');
                
                let content = name;
                if (type === 'knowledge' && relation) {
                    content = `${name} (${relation})`;
                } else if (type === 'category') {
                    content = `[カテゴリ] ${name}`;
                }
                
                newPlacedItem.innerHTML = `${content} <button class="remove-placed-btn"><i class="icon ion-close-round"></i></button>`;

                // 配置欄に追加
                if (dropZone.textContent.includes('配置欄') && dropZone.children.length === 0) {
                    dropZone.textContent = '';
                }
                dropZone.appendChild(newPlacedItem);

                // 配置されたアイテムの削除ボタン機能
                newPlacedItem.querySelector('.remove-placed-btn').addEventListener('click', (btnE) => {
                    btnE.target.closest('.placed-item').remove();
                    if (dropZone.children.length === 0) {
                        dropZone.textContent = '配置欄';
                    }
                });
            }
        });
    }

    // --- ボタンの初期化 ---
    addMemoryBtn.addEventListener('click', () => openMemoryModal(null));
    addThoughtBtn.addEventListener('click', () => addThought(null, '新しい思考'));

    // --- 初期状態の描画（空のリスト） ---
    updateCategorySelect();
});
