CREATE TABLE "user" (
  "id" integer PRIMARY KEY,
  "username" text UNIQUE NOT NULL,
  "email" text UNIQUE NOT NULL,
  "password_hash" text NOT NULL,
  "role" text NOT NULL,
  "department" text DEFAULT 'staff',
  "date_joined" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now()),
  "avatar" url,
  "facility" text,
  "is_active" bool DEFAULT true
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
  "slug" text UNIQUE NOT NULL,
  "category_id" integer NOT NULL,
  "title" text,
  "content" text,
  "views" integer,
  "status" enum DEFAULT 'draft',
  "author_id" integer NOT NULL,
  "published_by" integer NOT NULL,
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
  "created_at" timestamp,
  "public_id" text
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
  "user" integer NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "conversation_uuid" integer NOT NULL,
  "conversation" int,
  "article_ref" integer NOT NULL,
  "was_helpful" bool,
  "created_at" timestamp DEFAULT (now()),
  "response_time" float,
  "confidence_score" float,
  "escalate_suggested" bool DEFAULT false
);

CREATE TABLE "search_logs" (
  "id" integer PRIMARY KEY,
  "user_id" integer NOT NULL,
  "query" text NOT NULL,
  "result_count" integer,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "password_reset_otp" (
  "id" integer PRIMARY KEY,
  "user" integer NOT NULL,
  "otp" text,
  "created_at" timestamp,
  "expires_at" timestamp,
  "used" bool DEFAULT false,
  "verified" bool DEFAULT false
);

CREATE TABLE "notification" (
  "id" integer PRIMARY KEY,
  "recipient_id" integer NOT NULL,
  "sender_id" integer,
  "notification_type" text,
  "content_type" integer,
  "object_id" integer,
  "content_object" integer,
  "title" text,
  "message" text,
  "link" text,
  "read" bool DEFAULT false,
  "read_at" timestamp,
  "email_sent" bool,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "chat_log_source" (
  "chat_log" int NOT NULL,
  "article" int NOT NULL,
  "confidence" float DEFAULT 0,
  "rank" int DEFAULT 0
);

CREATE TABLE "article_chunks" (
  "id" int PRIMARY KEY,
  "article" integer NOT NULL,
  "chunck_index" int,
  "content" text,
  "token_count" int DEFAULT 0,
  "embedding" vector,
  "embedding_model" char,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "conversations" (
  "id" int PRIMARY KEY,
  "user" int NOT NULL,
  "session_key" char,
  "title" char,
  "is_archived" bool DEFAULT false,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "audit_log" (
  "id" int PRIMARY KEY,
  "user" int,
  "user_ip" ip,
  "user_agent" text,
  "action" char,
  "content_type" char,
  "object_id" int,
  "object_repr" char,
  "changes" json,
  "reason" text,
  "timestamp" timestamp
);

ALTER TABLE "audit_log" ADD FOREIGN KEY ("user") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_log" ADD FOREIGN KEY ("object_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_log" ADD FOREIGN KEY ("object_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notification" ADD FOREIGN KEY ("recipient_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "password_reset_otp" ADD FOREIGN KEY ("user") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_chunks" ADD FOREIGN KEY ("article") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversations" ADD FOREIGN KEY ("user") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "chat_log_source" ADD FOREIGN KEY ("article") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "chat_log_source" ADD FOREIGN KEY ("chat_log") REFERENCES "chat_logs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "articles" ADD FOREIGN KEY ("author_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "media" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "articles" ADD FOREIGN KEY ("published_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "articles" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_tags" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "feedback" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "feedback" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "chat_logs" ADD FOREIGN KEY ("user") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "chat_logs" ADD FOREIGN KEY ("article_ref") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "search_logs" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;
