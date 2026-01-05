from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'matches',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('room_id', sa.String(length=100), nullable=False),
        sa.Column('black_nickname', sa.String(length=50), nullable=False),
        sa.Column('white_nickname', sa.String(length=50), nullable=False),
        sa.Column('winner', sa.Enum('B', 'W', 'draw', name='winnerenum'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('moves', sa.JSON(), nullable=False),
        sa.Column('final_board', sa.Text(), nullable=False),
        sa.Column('winner_review', sa.String(length=60), nullable=True),
    )


def downgrade():
    op.drop_table('matches')
