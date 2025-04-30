-- 1. 将 email 列重命名为 StudentIdNumber
ALTER TABLE public.users
RENAME COLUMN email TO "StudentIdNumber";

-- 2. 添加 password 列，用于直接存储密码 (TEXT 类型)
ALTER TABLE public.users
ADD COLUMN password TEXT;

-- 3. 将 id 列设置为主键 (如果尚未设置)
-- 首先检查是否已存在名为 users_pkey 的主键约束，如果存在则先删除
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_pkey' AND conrelid = 'public.users'::regclass) THEN
--         ALTER TABLE public.users DROP CONSTRAINT users_pkey;
--     END IF;
-- END
-- $$;


-- 哇靠，这个语句真的太重要了，接下来我希望任何人都可以增删改查数据库
CREATE POLICY "Allow anonymous inserts to users"
    ON public.users FOR INSERT
    TO anon
    WITH CHECK (true);


ALTER TABLE "public"."comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."posts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."postLikes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" DISABLE ROW LEVEL SECURITY;


