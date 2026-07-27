from django.db import migrations

# HNSW approximate-nearest-neighbor index for cosine similarity search.
# Requires pgvector >= 0.5.0 (the extension, not just the Python package —
# already enabled via migration 0001). Using RunSQL rather than pgvector-
# python's Django index classes to stay compatible regardless of exactly
# which pgvector-python minor version ends up installed.
CREATE_SQL = (
    "CREATE INDEX IF NOT EXISTS article_chunk_embedding_hnsw_idx "
    "ON chatbot_articlechunk USING hnsw (embedding vector_cosine_ops);"
)
DROP_SQL = "DROP INDEX IF EXISTS article_chunk_embedding_hnsw_idx;"


class Migration(migrations.Migration):

    dependencies = [
        ('chatbot', '0002_conversation_and_articlechunk'),
    ]

    operations = [
        migrations.RunSQL(CREATE_SQL, reverse_sql=DROP_SQL),
    ]
