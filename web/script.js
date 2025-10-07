document.addEventListener('DOMContentLoaded', () => {
    const GRID_COLS = 42;
    const GRID_ROWS = 28;

    const TILE_TYPES = [
        { id: 'empty', name: '清空', label: '清', shape: [[0, 0]], category: 'basic', consumesInventory: false },
        { id: 'obstacle', name: '障碍物', label: '障', shape: [[0, 0]], category: 'basic', consumesInventory: false },
        { id: 'walkway-basic', name: '基础行进盲道（1 格）', label: '补行', shape: [[0, 0]], category: 'basic', consumesInventory: false },
        { id: 'hint-basic', name: '基础提示盲道（1 格）', label: '补提', shape: [[0, 0]], category: 'basic', consumesInventory: false },
        { id: 'score-1', name: '1 分得分块（4 格）', label: '1分', shape: [[0, 0], [1, 0], [0, 1], [1, 1]], category: 'score', consumesInventory: false },
        { id: 'score-2', name: '2 分得分块（2 格）', label: '2分', shape: [[0, 0], [1, 0]], category: 'score', consumesInventory: false },
        { id: 'score-3', name: '3 分得分块（2 格）', label: '3分', shape: [[0, 0], [1, 0]], category: 'score', consumesInventory: false },
        { id: 'score-4', name: '4 分得分块（1 格）', label: '4分', shape: [[0, 0]], category: 'score', consumesInventory: false },
        { id: 'score-5', name: '5 分得分块（1 格）', label: '5分', shape: [[0, 0]], category: 'score', consumesInventory: false },
        { id: 'walkway-1', name: '行进盲道（1 格）', label: '行1', shape: [[0, 0]], category: 'walkway', consumesInventory: true, inventoryKey: 'walkway-1' },
        { id: 'walkway-2', name: '行进盲道（2 格）', label: '行2', shape: [[0, 0], [1, 0]], category: 'walkway', consumesInventory: true, inventoryKey: 'walkway-2' },
        { id: 'walkway-3', name: '行进盲道（3 格）', label: '行3', shape: [[0, 0], [1, 0], [2, 0]], category: 'walkway', consumesInventory: true, inventoryKey: 'walkway-3' },
        { id: 'hint-corner', name: '提示盲道（折角，3 格）', label: 'L', shape: [[0, 0], [1, 0], [0, 1]], category: 'hint', consumesInventory: true, inventoryKey: 'hint-corner' },
        { id: 'hint-t', name: '提示盲道（T 型，4 格）', label: 'T', shape: [[0, 0], [-1, 0], [1, 0], [0, 1]], category: 'hint', consumesInventory: true, inventoryKey: 'hint-t' },
        { id: 'hint-x', name: '提示盲道（X 型，5 格）', label: 'X', shape: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]], category: 'hint', consumesInventory: true, inventoryKey: 'hint-x' },
    ];

    const CATEGORIES = [
        { id: 'basic', title: '基础工具' },
        { id: 'score', title: '得分块' },
        { id: 'walkway', title: '行进盲道' },
        { id: 'hint', title: '提示盲道' },
    ];

    const INVENTORY_KEYS = ['walkway-1', 'walkway-2', 'walkway-3', 'hint-corner', 'hint-t', 'hint-x'];

    // --- 全局变量 ---
    let selectedTileId = 'score-1';
    let currentRotation = 0; // 以度数表示
    let currentColor = 'black';
    let inventoryEnabled = false;
    let inventory = createEmptyInventory();
    let gridCells = [];
    let previewLayer = null;
    let lastHoveredCell = null;

    // --- 获取 DOM 元素 ---
    const gridContainer = document.getElementById('grid-container');
    const paletteContainer = document.getElementById('palette');
    const resetButton = document.getElementById('reset-button');
    const restartButton = document.getElementById('restart-button');
    const rotationIndicator = document.getElementById('rotation-indicator');
    const rotateLeftButton = document.getElementById('rotate-left');
    const rotateRightButton = document.getElementById('rotate-right');
    const inventoryForm = document.getElementById('inventory-form');
    const inventoryDisplay = document.getElementById('inventory-display');

    // --- 初始化 ---
    createPalette();
    createGrid();
    initializePreviewLayer();
    updateRotationIndicator();
    updateInventoryDisplay();

    // --- 事件绑定 ---
    resetButton.addEventListener('click', () => resetGrid());
    restartButton.addEventListener('click', () => restartGame());
    rotateLeftButton.addEventListener('click', () => rotate(-90));
    rotateRightButton.addEventListener('click', () => rotate(90));

    document.querySelectorAll('input[name="color"]').forEach(radio => {
        radio.addEventListener('change', event => {
            currentColor = event.target.value;
            refreshPreview();
        });
    });

    inventoryForm.addEventListener('submit', event => {
        event.preventDefault();
        applyInventorySettings(new FormData(inventoryForm));
    });

    // --- 函数定义 ---

    function createPalette() {
        paletteContainer.innerHTML = '';
        CATEGORIES.forEach(category => {
            const section = document.createElement('div');
            section.classList.add('palette-section');

            const title = document.createElement('h3');
            title.textContent = category.title;
            section.appendChild(title);

            const grid = document.createElement('div');
            grid.classList.add('palette-grid');

            TILE_TYPES.filter(tile => tile.category === category.id).forEach(tile => {
                const cell = document.createElement('div');
                cell.classList.add('palette-cell', `tile-${tile.id}`, 'color-black');
                cell.dataset.tileId = tile.id;
                cell.dataset.label = tile.label;
                cell.title = tile.name;
                if (tile.id === selectedTileId) {
                    cell.classList.add('selected');
                }
                cell.addEventListener('click', () => handlePaletteSelection(cell));
                grid.appendChild(cell);
            });

            section.appendChild(grid);
            paletteContainer.appendChild(section);
        });
    }

    function createGrid() {
        gridContainer.innerHTML = '';
        gridCells = [];
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell', 'tile-empty', 'color-black');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.tileId = 'empty';
                cell.dataset.color = 'black';
                cell.addEventListener('click', handleCellClick);
                gridContainer.appendChild(cell);
                gridCells.push(cell);
            }
        }
    }

    function handlePaletteSelection(cell) {
        selectedTileId = cell.dataset.tileId;
        document.querySelectorAll('.palette-cell').forEach(paletteCell => {
            paletteCell.classList.remove('selected');
        });
        cell.classList.add('selected');
        refreshPreview();
    }

    function handleCellClick(event) {
        const cell = event.currentTarget;
        const tile = TILE_TYPES.find(t => t.id === selectedTileId);
        if (!tile) return;

        const baseRow = parseInt(cell.dataset.row, 10);
        const baseCol = parseInt(cell.dataset.col, 10);

        if (!canPlaceTile(tile, baseRow, baseCol)) {
            alert('该位置无法完整放下当前棋子，请选择其他格子或旋转后再试。');
            return;
        }

        if (!consumeInventoryIfNeeded(tile)) {
            return;
        }

        applyTile(tile, baseRow, baseCol);
        checkGameEnd();
        refreshPreview();
    }

    function rotate(delta) {
        currentRotation = (currentRotation + delta) % 360;
        if (currentRotation < 0) {
            currentRotation += 360;
        }
        updateRotationIndicator();
        refreshPreview();
    }

    function updateRotationIndicator() {
        rotationIndicator.textContent = `角度：${currentRotation}°`;
    }

    function initializePreviewLayer() {
        previewLayer = document.createElement('div');
        previewLayer.id = 'preview-layer';
        gridContainer.appendChild(previewLayer);
        gridContainer.addEventListener('mousemove', handleGridMouseMove);
        gridContainer.addEventListener('mouseleave', hidePreview);
    }

    function handleGridMouseMove(event) {
        if (!previewLayer) return;
        const cell = event.target.closest('.grid-cell');
        if (!cell || !cell.dataset.row || !cell.dataset.col) {
            hidePreview();
            return;
        }
        lastHoveredCell = cell;
        updatePreview(cell);
    }

    function updatePreview(cell) {
        if (!previewLayer) return;
        const tile = TILE_TYPES.find(t => t.id === selectedTileId);
        if (!tile) {
            hidePreview();
            return;
        }

        const baseRow = parseInt(cell.dataset.row, 10);
        const baseCol = parseInt(cell.dataset.col, 10);
        const offsets = getRotatedOffsets(tile.shape);
        const cellWidth = cell.offsetWidth;
        const cellHeight = cell.offsetHeight;
        const colorToApply = tile.id === 'empty' ? 'black' : currentColor;
        const canPlace = canPlaceTile(tile, baseRow, baseCol);

        previewLayer.innerHTML = '';
        offsets.forEach(([dx, dy]) => {
            const previewCell = document.createElement('div');
            previewCell.classList.add('preview-cell', `tile-${tile.id}`, `color-${colorToApply}`);
            if (dx === 0 && dy === 0) {
                previewCell.classList.add('preview-anchor');
            }
            const targetCol = baseCol + dx;
            const targetRow = baseRow + dy;
            previewCell.style.width = `${cellWidth}px`;
            previewCell.style.height = `${cellHeight}px`;
            previewCell.style.left = `${targetCol * cellWidth}px`;
            previewCell.style.top = `${targetRow * cellHeight}px`;
            previewLayer.appendChild(previewCell);
        });

        previewLayer.classList.add('visible');
        previewLayer.classList.toggle('preview-invalid', !canPlace);
    }

    function hidePreview() {
        if (!previewLayer) return;
        previewLayer.classList.remove('visible', 'preview-invalid');
        previewLayer.innerHTML = '';
        lastHoveredCell = null;
    }

    function refreshPreview() {
        if (lastHoveredCell) {
            updatePreview(lastHoveredCell);
        }
    }

    function resetGrid(skipConfirm = false) {
        if (!skipConfirm && !confirm('确定要清空整个网格吗？')) {
            return;
        }
        gridCells.forEach(cell => {
            setCellState(cell, 'empty', 'black');
        });
    }

    function restartGame() {
        if (!confirm('重新开始会清空网格并重置棋子数量，确定吗？')) {
            return;
        }
        inventoryForm.reset();
        inventoryEnabled = false;
        inventory = createEmptyInventory();
        updateInventoryDisplay();
        currentColor = 'black';
        document.querySelector('input[name="color"][value="black"]').checked = true;
        currentRotation = 0;
        updateRotationIndicator();
        document.querySelectorAll('.palette-cell').forEach(cell => cell.classList.remove('selected'));
        selectedTileId = 'score-1';
        const defaultSelected = document.querySelector('.palette-cell[data-tile-id="score-1"]');
        if (defaultSelected) {
            defaultSelected.classList.add('selected');
        }
        resetGrid(true);
        refreshPreview();
    }

    function applyInventorySettings(formData) {
        const newInventory = createEmptyInventory();
        ['red', 'blue'].forEach(color => {
            INVENTORY_KEYS.forEach(key => {
                const formKey = `${color}-${key}`;
                const value = parseInt(formData.get(formKey), 10);
                newInventory[color][key] = Number.isFinite(value) && value >= 0 ? value : 0;
            });
        });
        inventory = newInventory;
        inventoryEnabled = true;
        updateInventoryDisplay();
        alert('棋子数量已设置，游戏开始！');
    }

    function updateInventoryDisplay() {
        if (!inventoryEnabled) {
            inventoryDisplay.innerHTML = '<p>请设置红蓝双方的棋子数量以开始游戏。</p>';
            return;
        }

        const rows = INVENTORY_KEYS.map(key => {
            const name = getInventoryName(key);
            return `<tr><td>${name}</td><td>${inventory.red[key]}</td><td>${inventory.blue[key]}</td></tr>`;
        }).join('');

        inventoryDisplay.innerHTML = `
            <table>
                <thead>
                    <tr><th>棋子</th><th>红方剩余</th><th>蓝方剩余</th></tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    function getInventoryName(key) {
        switch (key) {
            case 'walkway-1': return '行进盲道（1 格）';
            case 'walkway-2': return '行进盲道（2 格）';
            case 'walkway-3': return '行进盲道（3 格）';
            case 'hint-corner': return '提示盲道（折角）';
            case 'hint-t': return '提示盲道（T 型）';
            case 'hint-x': return '提示盲道（X 型）';
            default: return key;
        }
    }

    function createEmptyInventory() {
        const result = { red: {}, blue: {} };
        ['red', 'blue'].forEach(color => {
            INVENTORY_KEYS.forEach(key => {
                result[color][key] = 0;
            });
        });
        return result;
    }

    function canPlaceTile(tile, baseRow, baseCol) {
        const offsets = getRotatedOffsets(tile.shape);
        return offsets.every(([dx, dy]) => {
            const targetCol = baseCol + dx;
            const targetRow = baseRow + dy;
            return targetCol >= 0 && targetCol < GRID_COLS && targetRow >= 0 && targetRow < GRID_ROWS;
        });
    }

    function consumeInventoryIfNeeded(tile) {
        if (!tile.consumesInventory || currentColor === 'black') {
            return true;
        }
        if (!inventoryEnabled) {
            return true;
        }
        const remaining = inventory[currentColor][tile.inventoryKey];
        if (remaining <= 0) {
            alert(`${currentColor === 'red' ? '红方' : '蓝方'}的该类型棋子已用完。`);
            return false;
        }
        inventory[currentColor][tile.inventoryKey] -= 1;
        updateInventoryDisplay();
        return true;
    }

    function applyTile(tile, baseRow, baseCol) {
        const offsets = getRotatedOffsets(tile.shape);
        const colorToApply = tile.id === 'empty' ? 'black' : currentColor;

        const cells = offsets.map(([dx, dy]) => {
            const targetCol = baseCol + dx;
            const targetRow = baseRow + dy;
            const index = targetRow * GRID_COLS + targetCol;
            return gridCells[index];
        });

        cells.forEach(cell => setCellState(cell, tile.id, colorToApply));
    }

    function setCellState(cell, tileId, color) {
        cell.className = 'grid-cell';
        cell.classList.add(`tile-${tileId}`, `color-${color}`);
        cell.dataset.tileId = tileId;
        cell.dataset.color = color;
    }

    function getRotatedOffsets(shape) {
        const normalizedRotation = ((currentRotation % 360) + 360) % 360;
        return shape.map(([x, y]) => {
            switch (normalizedRotation) {
                case 90:
                    return [y, -x];
                case 180:
                    return [-x, -y];
                case 270:
                    return [-y, x];
                default:
                    return [x, y];
            }
        });
    }

    function checkGameEnd() {
        if (!inventoryEnabled) {
            return;
        }
        const redRemaining = sumInventory(inventory.red);
        const blueRemaining = sumInventory(inventory.blue);
        if (redRemaining === 0 && blueRemaining === 0) {
            alert('所有棋子已放完，游戏结束！可以重新开始或调整配置。');
        }
    }

    function sumInventory(store) {
        return Object.values(store).reduce((sum, value) => sum + value, 0);
    }
});