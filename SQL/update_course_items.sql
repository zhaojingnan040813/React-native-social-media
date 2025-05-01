-- 这个脚本提供了两个选项来添加weeks_pattern字段

-- 选项1: 如果需要添加weeks_pattern字段作为整数数组
-- ALTER TABLE course_items ADD COLUMN IF NOT EXISTS weeks_pattern integer[] DEFAULT NULL;

-- 选项2: 如果需要添加weeks_pattern字段作为TEXT(JSON格式)
-- ALTER TABLE course_items ADD COLUMN IF NOT EXISTS weeks_pattern TEXT DEFAULT NULL;

-- 注意：您只需要取消其中一个选项的注释并运行即可，
-- 当前这个字段是可选的，我们的应用程序会使用week_start和week_end来判断周次范围

-- 添加示例数据
INSERT INTO time_slots (slot_name, start_time, end_time, display_order)
VALUES 
('1-2节', '08:00:00', '09:40:00', 1),
('3-4节', '10:00:00', '11:30:00', 2),
('5-6节', '13:30:00', '15:10:00', 3),
('7-8节', '15:20:00', '17:00:00', 4),
('9-10节', '17:10:00', '18:50:00', 5)
ON CONFLICT (slot_id) DO NOTHING; 