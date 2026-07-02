CREATE TABLE "user" (
  "id" integer PRIMARY KEY,
  "username" text UNIQUE NOT NULL,
  "email" text UNIQUE NOT NULL,
  "password_hash" text NOT NULL,
  "role" text NOT NULL,
  "department" text DEFAULT 'staff',
  "date_joined" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "categories" (
  "id" integer PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "icon" text,
  "slug" text,
  "description" text,
  "parent_id" integer,
  "sort_order" integer DEFAULT 0
);

CREATE TABLE "articles" (
  "id" integer PRIMARY KEY,
  "slug" text,
  "category_id" integer,
  "title" text,
  "content" text,
  "views" integer,
  "status" enum DEFAULT 'draft',
  "author_id" integer NOT NULL,
  "published_by" integer,
  "created_at" timestamp,
  "updated_at" timestamp,
  "published_at" timestamp
);

CREATE TABLE "media" (
  "id" integer PRIMARY KEY,
  "article_id" integer NOT NULL,
  "filename" text NOT NULL,
  "url" text NOT NULL,
  "type" enum NOT NULL,
  "uploaded_by" integer NOT NULL,
  "created_at" timestamp
);

CREATE TABLE "tags" (
  "id" integer PRIMARY KEY,
  "slug" text,
  "name" text UNIQUE NOT NULL
);

CREATE TABLE "article_tags" (
  "id" integer PRIMARY KEY,
  "article_id" integer NOT NULL,
  "tag_id" integer NOT NULL
);

CREATE TABLE "feedback" (
  "id" integer PRIMARY KEY,
  "article_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "chat_logs" (
  "id" integer PRIMARY KEY,
  "user_id" integer NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "conversation_id" integer,
  "article_ref_id" integer,
  "was_helpful" bool,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "search_logs" (
  "id" integer PRIMARY KEY,
  "user_id" integer NOT NULL,
  "query" text NOT NULL,
  "result_count" integer,
  "created_at" timestamp DEFAULT (now())
);

ALTER TABLE "articles" ADD FOREIGN KEY ("author_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "media" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "articles" ADD FOREIGN KEY ("published_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "articles" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_tags" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "feedback" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "feedback" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "chat_logs" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "chat_logs" ADD FOREIGN KEY ("article_ref_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "search_logs" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;
