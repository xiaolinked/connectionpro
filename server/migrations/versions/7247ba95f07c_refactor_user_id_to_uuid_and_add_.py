"""Refactor User ID to UUID and add firebase_uid

Revision ID: 7247ba95f07c
Revises: fe7766141d10
Create Date: 2026-01-30 23:31:52.075572

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = '7247ba95f07c'
down_revision = 'fe7766141d10'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add firebase_uid (nullable first)
    op.add_column('user', sa.Column('firebase_uid', sa.String(), nullable=True))
    op.create_index(op.f('ix_user_firebase_uid'), 'user', ['firebase_uid'], unique=True)
    
    # 2. Populate firebase_uid with existing id (which holds the firebase uid string)
    op.execute("UPDATE \"user\" SET firebase_uid = id")
    
    # 3. Make firebase_uid not nullable
    op.alter_column('user', 'firebase_uid', nullable=False)

    # 4. Add new UUID primary key column
    # Ensure pgcrypto or similar is available or use gen_random_uuid() (PG 13+)
    op.add_column('user', sa.Column('uuid_id', sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False))

    # 5. Add temporary UUID FK columns to child tables
    op.add_column('connection', sa.Column('user_uuid', sa.Uuid(), nullable=True))
    op.add_column('log', sa.Column('user_uuid', sa.Uuid(), nullable=True))

    # 6. Populate child table UUIDs
    op.execute("UPDATE connection SET user_uuid = u.uuid_id FROM \"user\" u WHERE connection.user_id = u.id")
    op.execute("UPDATE log SET user_uuid = u.uuid_id FROM \"user\" u WHERE log.user_id = u.id")

    # 7. Drop old FK constraints
    # Note: Constraint names are assumed default. If this fails, check exact names in DB.
    try:
        op.drop_constraint('connection_user_id_fkey', 'connection', type_='foreignkey')
        op.drop_constraint('log_user_id_fkey', 'log', type_='foreignkey')
    except Exception:
        print("Warning: Could not drop FKs by default name. They might not exist or have different names.")

    # 8. Drop old string User ID columns from child tables
    op.drop_index(op.f('ix_connection_user_id'), table_name='connection')
    op.drop_column('connection', 'user_id')
    
    op.drop_index(op.f('ix_log_user_id'), table_name='log')
    op.drop_column('log', 'user_id')

    # 9. Rename new Foreign Keys to user_id
    op.alter_column('connection', 'user_uuid', new_column_name='user_id', nullable=True) # It was optional
    op.create_index(op.f('ix_connection_user_id'), 'connection', ['user_id'], unique=False)

    op.alter_column('log', 'user_uuid', new_column_name='user_id', nullable=True)
    op.create_index(op.f('ix_log_user_id'), 'log', ['user_id'], unique=False)

    # 10. Switch User Primary Key
    op.drop_constraint('user_pkey', 'user', type_='primary')
    op.drop_column('user', 'id')
    op.alter_column('user', 'uuid_id', new_column_name='id')
    op.create_primary_key('user_pkey', 'user', ['id'])
    op.create_index(op.f('ix_user_id'), 'user', ['id'], unique=False)

    # 11. Re-create Foreign Keys
    op.create_foreign_key(None, 'connection', 'user', ['user_id'], ['id'])
    op.create_foreign_key(None, 'log', 'user', ['user_id'], ['id'])


def downgrade() -> None:
    # Irreversible migration for simplicity in this context
    pass
