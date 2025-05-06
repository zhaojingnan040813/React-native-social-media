-- 书签表：存储用户收藏的帖子
create table public.bookmarks (
  id bigint primary key not null,
  created_at timestamp with time zone not null default now(),
  "postId" bigint not null, -- 关联到posts表的帖子ID
  "userId" uuid not null -- 关联到users表的用户ID
);
-- 唯一索引：确保同一个用户不能重复收藏同一个帖子
create unique index unique_bookmark on bookmarks using btree ("postId", "userId");




-- 评论表：存储帖子的评论信息
create table public.comments (
  id bigint primary key not null,
  created_at timestamp with time zone not null default now(),
  text text, -- 评论内容
  "userId" uuid, -- 关联到users表的用户ID
  "postId" bigint -- 关联到posts表的帖子ID
);



-- 课程安排表：存储具体的课程安排信息，如时间、地点、周次
create table public.course_items (
  item_id uuid primary key not null default gen_random_uuid(),
  user_id uuid not null, -- 关联到users表的用户ID
  course_id uuid not null, -- 关联到courses表的课程ID
  day_of_week integer not null, -- 星期几 (1-7)
  start_slot integer not null, -- 开始时间段ID (关联到time_slots表)
  end_slot integer not null, -- 结束时间段ID (关联到time_slots表)
  location character varying(100), -- 上课地点
  teacher character varying(50), -- 教师名称
  week_start integer default 1, -- 开始周次
  week_end integer default 20, -- 结束周次
  weeks_pattern text, -- 备用字段，可用于更复杂的周次模式（如单双周）
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
-- 索引：加速按用户ID查询课程安排
create index idx_course_items_user_id on course_items using btree (user_id);
-- 索引：加速按课程ID查询课程安排
create index idx_course_items_course_id on course_items using btree (course_id);




-- 课程表：存储课程的基本信息，如名称、颜色
create table public.courses (
  course_id uuid primary key not null default gen_random_uuid(),
  user_id uuid not null, -- 关联到users表的用户ID
  course_name character varying(100) not null, -- 课程名称
  color character varying(20) default 'blue', -- 课程颜色，用于UI显示
  created_at timestamp with time zone not null default now()
);
-- 索引：加速按用户ID查询课程
create index idx_courses_user_id on courses using btree (user_id);




-- 通知表：存储用户通知信息，如评论、点赞等
create table public.notifications (
  id bigint primary key not null,
  created_at timestamp with time zone not null default now(),
  title text, -- 通知标题
  "senderId" uuid, -- 关联到users表的发送者ID
  "receiverId" uuid, -- 关联到users表的接收者ID
  data text -- 存储通知相关的额外数据，如postId, commentId (JSON格式)
);



-- 帖子点赞表：记录用户对帖子的点赞行为
-- PostgreSQL 默认会将不加引号的标识符转换为全小写
create table public."postLikes" (
  id bigint primary key not null,
  created_at timestamp with time zone not null default now(),
  "postId" bigint, -- 关联到posts表的帖子ID
  "userId" uuid -- 关联到users表的用户ID
);



-- 帖子表：存储用户发布的帖子信息
create table public.posts (
  id bigint primary key not null,
  created_at timestamp with time zone not null default now(),
  body text, -- 帖子正文内容
  file text, -- 关联的图片或视频文件路径 (存储在Supabase Storage)
  "userId" uuid, -- 关联到users表的用户ID
  tags jsonb default '[]'::jsonb -- 帖子的标签 (JSONB格式，存储字符串数组)
);


-- 时间段表：定义课表的时间段，如1-2节、3-4节等
create table public.time_slots (
  slot_id integer primary key not null default nextval('time_slots_slot_id_seq'::regclass),
  slot_name character varying(20) not null, -- 时间段名称 (如: 1-2节)
  start_time time without time zone not null, -- 开始时间
  end_time time without time zone not null, -- 结束时间
  display_order integer not null -- 用于UI排序
);


-- 注意：下面重复定义了 time_slots 表，请删除重复的部分
-- create table public.time_slots (
--   slot_id integer primary key not null default nextval('time_slots_slot_id_seq'::regclass),
--   slot_name character varying(20) not null,
--   start_time time without time zone not null,
--   end_time time without time zone not null,
--   display_order integer not null
-- );


create table public.users (
  id uuid primary key not null,
  created_at timestamp with time zone not null default now(),
  name text,
  image text,
  bio text,
  "StudentIdNumber" text,
  address text,
  "phoneNumber" text,
  password text,
  gender character varying(10),
  birthday date,
  college text,
  major text,
  grade character varying(20),
  email character varying(255)
);

-- 开始开发私信功能，又创建了conversations表和messages表
-- 为会话表创建自增序列
CREATE SEQUENCE conversations_id_seq;

-- 会话表：记录用户之间的私信会话
create table public.conversations (
                                      id bigint primary key not null default nextval('conversations_id_seq'::regclass),
                                      created_at timestamp with time zone not null default now(),
                                      updated_at timestamp with time zone not null default now(),
                                      "user1Id" uuid not null, -- 会话参与者1的用户ID
                                      "user2Id" uuid not null  -- 会话参与者2的用户ID
);

-- 索引：加速按用户查询会话
create index idx_conversations_user1 on conversations using btree ("user1Id");
create index idx_conversations_user2 on conversations using btree ("user2Id");

-- 唯一索引：确保两个用户之间只有一个会话
create unique index unique_conversation on conversations
    using btree (least("user1Id", "user2Id"), greatest("user1Id", "user2Id"));


-- 为消息表创建自增序列
CREATE SEQUENCE messages_id_seq;

-- 消息表：存储私信内容
create table public.messages (
                                 id bigint primary key not null default nextval('messages_id_seq'::regclass),
                                 conversation_id bigint not null, -- 关联到conversations表
                                 "senderId" uuid not null, -- 发送者用户ID
                                 "receiverId" uuid not null, -- 接收者用户ID
                                 content text not null, -- 消息内容
                                 is_read boolean default false, -- 是否已读
                                 media_url text, -- 可选，附加媒体文件的URL
                                 type text default 'text', -- 消息类型：'text'或'audio'等
                                 audio_duration integer, -- 音频消息的时长(秒)
                                 created_at timestamp with time zone not null default now()
);

-- 索引：加速按会话ID查询消息
create index idx_messages_conversation_id on messages using btree (conversation_id);

-- 索引：加速查询未读消息
create index idx_messages_is_read on messages using btree (is_read) where is_read = false;

-- 索引：加速按接收者查询消息
create index idx_messages_receiver_id on messages using btree ("receiverId");



ALTER TABLE public.notifications ADD COLUMN type TEXT, ADD COLUMN isRead BOOLEAN DEFAULT FALSE;


























