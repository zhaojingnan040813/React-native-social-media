document.addEventListener('DOMContentLoaded', function() {
    // 初始化课表网格
    initScheduleGrid();
    
    // 加载示例课程数据
    loadSampleCourses();
    
    // 添加课程按钮点击事件
    document.querySelector('.add-btn').addEventListener('click', function() {
        showImportModal();
    });
    
    // 关闭弹窗按钮点击事件
    document.querySelectorAll('.close-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            hideAllModals();
        });
    });
    
    // 导入选项点击事件
    document.getElementById('importFromSystem').addEventListener('click', function() {
        alert('从教务系统导入功能开发中...');
        hideAllModals();
    });
    
    document.getElementById('importFromQR').addEventListener('click', function() {
        alert('扫码导入功能开发中...');
        hideAllModals();
    });
    
    // 课程表单提交事件
    document.getElementById('courseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCourse();
    });
    
    // 删除按钮点击事件
    document.getElementById('deleteBtn').addEventListener('click', function() {
        deleteCourse();
    });
});

// 全局变量
let currentEditingCourse = null;

// 初始化课表网格
function initScheduleGrid() {
    const scheduleGrid = document.querySelector('.schedule-grid');
    scheduleGrid.innerHTML = '';
    
    // 创建7天 x 6个时间段的空白格子
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'empty-cell';
            cell.dataset.row = row + 1;
            cell.dataset.col = col + 1;
            
            // 添加点击事件，点击空白格子添加课程
            cell.addEventListener('click', function() {
                showAddCourseModal(row + 1, col + 1);
            });
            
            scheduleGrid.appendChild(cell);
        }
    }
}

// 加载示例课程数据
function loadSampleCourses() {
    const sampleCourses = [
        {
            name: "信息系统分析与设计",
            location: "@南区402",
            day: 2,
            startSlot: 1,
            endSlot: 1,
            color: "blue",
            timeText: "1-2节"
        },
        {
            name: "医学图像处理学",
            location: "@南区401",
            day: 3,
            startSlot: 2,
            endSlot: 2,
            color: "green",
            timeText: "3-4节"
        },
        {
            name: "Web程序设计",
            location: "@南区401",
            day: 4,
            startSlot: 2,
            endSlot: 2,
            color: "green",
            timeText: "3-4节"
        },
        {
            name: "监考教学楼电子阅览室",
            location: "",
            day: 1,
            startSlot: 2,
            endSlot: 2,
            color: "purple",
            timeText: "3-4节"
        },
        {
            name: "信息系统分析与设计",
            location: "@南区403",
            day: 1,
            startSlot: 3,
            endSlot: 3,
            color: "blue",
            timeText: "5-6节"
        },
        {
            name: "医院信息系统管理",
            location: "@南区405",
            day: 2,
            startSlot: 3,
            endSlot: 4,
            color: "orange",
            timeText: "5-8节"
        }
    ];
    
    sampleCourses.forEach(course => {
        addCourseToGrid(course);
    });
}

// 在网格中添加课程
function addCourseToGrid(course) {
    const scheduleGrid = document.querySelector('.schedule-grid');
    const startIndex = (course.startSlot - 1) * 7 + (course.day - 1);
    const courseHeight = course.endSlot - course.startSlot + 1;
    
    // 移除可能存在的空白单元格
    for (let i = 0; i < courseHeight; i++) {
        const cellIndex = startIndex + (i * 7);
        const existingCell = scheduleGrid.children[cellIndex];
        if (existingCell && existingCell.classList.contains('empty-cell')) {
            existingCell.remove();
        }
    }
    
    // 创建课程块
    const courseBlock = document.createElement('div');
    courseBlock.className = `course-block ${course.color}`;
    courseBlock.style.gridRow = `${course.startSlot} / span ${courseHeight}`;
    courseBlock.style.gridColumn = `${course.day}`;
    
    // 添加课程信息
    const courseName = document.createElement('div');
    courseName.className = 'course-name';
    courseName.textContent = course.name;
    
    const courseLocation = document.createElement('div');
    courseLocation.className = 'course-location';
    courseLocation.textContent = course.location;
    
    if (course.timeText) {
        const courseTime = document.createElement('div');
        courseTime.className = 'course-time';
        courseTime.textContent = course.timeText;
        courseBlock.appendChild(courseTime);
    }
    
    courseBlock.appendChild(courseName);
    courseBlock.appendChild(courseLocation);
    
    // 保存课程数据到元素
    courseBlock.dataset.course = JSON.stringify(course);
    
    // 添加点击事件，点击课程块编辑课程
    courseBlock.addEventListener('click', function(e) {
        e.stopPropagation();
        const courseData = JSON.parse(this.dataset.course);
        showEditCourseModal(courseData, this);
    });
    
    scheduleGrid.appendChild(courseBlock);
}

// 显示添加课程弹窗
function showAddCourseModal(row, col) {
    const modal = document.getElementById('courseModal');
    const modalTitle = document.getElementById('modalTitle');
    const deleteBtn = document.getElementById('deleteBtn');
    const courseTimeDisplay = document.getElementById('courseTime');
    
    modalTitle.textContent = '添加课程';
    deleteBtn.style.display = 'none';
    
    // 重置表单
    document.getElementById('courseForm').reset();
    
    // 设置时间段文字
    let timeText = '';
    let weekdayText = '';
    
    switch(col) {
        case 1: weekdayText = '周一'; break;
        case 2: weekdayText = '周二'; break;
        case 3: weekdayText = '周三'; break;
        case 4: weekdayText = '周四'; break;
        case 5: weekdayText = '周五'; break;
        case 6: weekdayText = '周六'; break;
        case 7: weekdayText = '周日'; break;
    }
    
    switch(row) {
        case 1: timeText = '1-2节'; break;
        case 2: timeText = '3-4节'; break;
        case 3: timeText = '5-6节'; break;
        case 4: timeText = '7-8节'; break;
        case 5: timeText = '9-10节'; break;
        case 6: timeText = '11-12节'; break;
    }
    
    // 显示时间
    courseTimeDisplay.textContent = `${weekdayText} ${timeText}`;
    
    // 保存当前编辑的课程信息
    currentEditingCourse = {
        isNew: true,
        day: col,
        startSlot: row,
        endSlot: row,
        timeText: timeText,
        weekdayText: weekdayText
    };
    
    // 显示弹窗
    modal.style.display = 'flex';
}

// 显示编辑课程弹窗
function showEditCourseModal(course, element) {
    const modal = document.getElementById('courseModal');
    const modalTitle = document.getElementById('modalTitle');
    const deleteBtn = document.getElementById('deleteBtn');
    const courseTimeDisplay = document.getElementById('courseTime');
    
    modalTitle.textContent = '编辑课程';
    deleteBtn.style.display = 'block';
    
    // 填充表单
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseLocation').value = course.location;
    document.getElementById('courseColor').value = course.color;
    
    // 设置周几
    let weekdayText = '';
    switch(course.day) {
        case 1: weekdayText = '周一'; break;
        case 2: weekdayText = '周二'; break;
        case 3: weekdayText = '周三'; break;
        case 4: weekdayText = '周四'; break;
        case 5: weekdayText = '周五'; break;
        case 6: weekdayText = '周六'; break;
        case 7: weekdayText = '周日'; break;
    }
    
    // 显示时间
    courseTimeDisplay.textContent = `${weekdayText} ${course.timeText}`;
    
    // 保存当前编辑的课程信息
    currentEditingCourse = {
        isNew: false,
        element: element,
        timeText: course.timeText,
        weekdayText: weekdayText,
        ...course
    };
    
    // 显示弹窗
    modal.style.display = 'flex';
}

// 显示导入弹窗
function showImportModal() {
    const modal = document.getElementById('importModal');
    modal.style.display = 'flex';
}

// 隐藏所有弹窗
function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// 保存课程
function saveCourse() {
    // 获取表单数据
    const name = document.getElementById('courseName').value;
    const location = document.getElementById('courseLocation').value;
    const color = document.getElementById('courseColor').value;
    
    // 创建课程对象
    const course = {
        name: name,
        location: location,
        day: currentEditingCourse.day,
        startSlot: currentEditingCourse.startSlot,
        endSlot: currentEditingCourse.endSlot,
        timeText: currentEditingCourse.timeText,
        color: color
    };
    
    // 如果是编辑现有课程，先移除旧的
    if (!currentEditingCourse.isNew) {
        currentEditingCourse.element.remove();
    }
    
    // 添加到网格
    addCourseToGrid(course);
    
    // 隐藏弹窗
    hideAllModals();
}

// 删除课程
function deleteCourse() {
    if (!currentEditingCourse.isNew && currentEditingCourse.element) {
        // 移除课程元素
        currentEditingCourse.element.remove();
        
        // 重新创建空白单元格
        const scheduleGrid = document.querySelector('.schedule-grid');
        for (let i = currentEditingCourse.startSlot; i <= currentEditingCourse.endSlot; i++) {
            const cell = document.createElement('div');
            cell.className = 'empty-cell';
            cell.dataset.row = i;
            cell.dataset.col = currentEditingCourse.day;
            
            cell.addEventListener('click', function() {
                showAddCourseModal(i, currentEditingCourse.day);
            });
            
            // 将单元格插入到正确的位置
            scheduleGrid.appendChild(cell);
        }
    }
    
    // 隐藏弹窗
    hideAllModals();
} 