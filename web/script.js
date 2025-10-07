document.addEventListener('DOMContentLoaded', () => {
    // --- 配置区域 ---
    const GRID_COLS = 42;
    const GRID_ROWS = 28;
    const NUM_STATES = 5;

    // --- 全局变量 ---
    let selectedState = 1; // 默认选中的状态 (1: 斜线)

    // --- 获取 DOM 元素 ---
    const gridContainer = document.getElementById('grid-container');
    const paletteContainer = document.getElementById('palette');
    const resetButton = document.getElementById('reset-button');

    // --- 函数定义 ---

    /**
     * 创建左侧的调色板
     */
    function createPalette() {
        for (let i = 0; i < NUM_STATES; i++) {
            const paletteCell = document.createElement('div');
            paletteCell.classList.add('palette-cell', `state-${i}`);
            paletteCell.dataset.state = i;

            // 默认选中第一个非空格的状态
            if (i === selectedState) {
                paletteCell.classList.add('selected');
            }

            paletteCell.addEventListener('click', handlePaletteClick);
            paletteContainer.appendChild(paletteCell);
        }
    }

    /**
     * 创建并初始化网格
     */
    function createGrid() {
        gridContainer.innerHTML = ''; // 清空现有网格
        for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell', 'state-0'); // 所有格子默认是状态0 (空白)
            cell.dataset.state = 0;
            cell.addEventListener('click', handleCellClick);
            gridContainer.appendChild(cell);
        }
    }

    /**
     * 处理调色板点击事件
     * @param {MouseEvent} event 
     */
    function handlePaletteClick(event) {
        // 更新全局选中的状态
        selectedState = parseInt(event.target.dataset.state, 10);

        // 更新调色板的视觉效果
        document.querySelectorAll('.palette-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        event.target.classList.add('selected');
    }

    /**
     * 处理网格单元格点击事件
     * @param {MouseEvent} event 
     */
    function handleCellClick(event) {
        const cell = event.target;
        const currentState = parseInt(cell.dataset.state, 10);

        // 移除旧的状态
        cell.classList.remove(`state-${currentState}`);

        // 应用当前在调色板中选中的状态
        cell.classList.add(`state-${selectedState}`);
        cell.dataset.state = selectedState;
    }

    /**
     * 清空网格状态并重置
     */
    function resetGrid() {
        if (confirm('确定要清空所有格子的状态吗？这个操作无法撤销。')) {
            // 只需重新创建一遍网格即可
            createGrid();
            alert('网格已重置。');
        }
    }

    // --- 事件监听 ---
    resetButton.addEventListener('click', resetGrid);

    // --- 初始加载 ---
    createPalette(); // 先创建调色板
    createGrid();    // 再创建网格
});