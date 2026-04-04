CREATE TABLE "user_follows" (
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("follower_id","following_id")
);

CREATE TABLE "post_likes" (
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("post_id","user_id")
);

CREATE TABLE "post_bookmarks" (
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("post_id","user_id")
);

CREATE INDEX "user_follows_following_id_idx" ON "user_follows"("following_id");
CREATE INDEX "post_likes_user_id_idx" ON "post_likes"("user_id");
CREATE INDEX "post_bookmarks_user_id_idx" ON "post_bookmarks"("user_id");

ALTER TABLE "user_follows"
ADD CONSTRAINT "user_follows_follower_id_fkey"
FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_follows"
ADD CONSTRAINT "user_follows_following_id_fkey"
FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_likes"
ADD CONSTRAINT "post_likes_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_likes"
ADD CONSTRAINT "post_likes_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_bookmarks"
ADD CONSTRAINT "post_bookmarks_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_bookmarks"
ADD CONSTRAINT "post_bookmarks_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
