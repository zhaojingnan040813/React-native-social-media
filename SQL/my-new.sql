SET client_encoding = 'UTF8';    -- 设置客户端字符集为 UTF-8




-- 创建时间段表（定义上课时间）
CREATE TABLE time_slots (
    slot_id SERIAL PRIMARY KEY,
    slot_name VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    display_order INTEGER NOT NULL
);

-- 创建课程表（用户的课程集合）
CREATE TABLE courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- 逻辑外键，关联到users(id)
    course_name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建课程表项表（课表中的具体课程安排）
CREATE TABLE course_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- 逻辑外键，关联到users(id)
    course_id UUID NOT NULL, -- 逻辑外键，关联到courses(course_id)
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1-7表示周一到周日
    start_slot INTEGER NOT NULL, -- 开始的时间段
    end_slot INTEGER NOT NULL, -- 结束的时间段
    location VARCHAR(100), -- 上课地点
    teacher VARCHAR(50), -- 任课教师
    week_start INTEGER DEFAULT 1, -- 起始周次
    week_end INTEGER DEFAULT 20, -- 结束周次
    weeks_pattern TEXT DEFAULT NULL, -- 周次模式，例如单双周
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_slots CHECK (start_slot <= end_slot)
);

-- 添加索引以提高查询性能
CREATE INDEX idx_course_items_user_id ON course_items(user_id);
CREATE INDEX idx_course_items_course_id ON course_items(course_id);
CREATE INDEX idx_courses_user_id ON courses(user_id);

-- 插入默认时间段数据
INSERT INTO time_slots (slot_name, start_time, end_time, display_order) VALUES
('1-2节', '08:00:00', '09:40:00', 1),
('3-4节', '10:00:00', '11:30:00', 2),
('5-6节', '13:30:00', '15:10:00', 3),
('7-8节', '15:20:00', '17:00:00', 4),
('9-10节', '17:10:00', '19:50:00', 5),
('11-12节', '19:10:00', '21:00:00', 6);

