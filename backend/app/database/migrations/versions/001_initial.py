"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-20 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_superuser', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'))
    )

    # Products table
    op.create_table(
        'products',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('base_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('current_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('category', sa.String(100)),
        sa.Column('inventory_count', sa.Integer, default=0),
        sa.Column('features', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'))
    )

    # User Interactions table
    op.create_table(
        'user_interactions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id')),
        sa.Column('product_id', sa.String(36), sa.ForeignKey('products.id')),
        sa.Column('interaction_type', sa.String(50)),
        sa.Column('value', sa.Float),
        sa.Column('context', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    # Orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id')),
        sa.Column('total_amount', sa.Numeric(10, 2)),
        sa.Column('status', sa.String(50)),
        sa.Column('shipping_address', postgresql.JSONB),
        sa.Column('payment_info', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    # Order Items table
    op.create_table(
        'order_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('order_id', sa.String(36), sa.ForeignKey('orders.id')),
        sa.Column('product_id', sa.String(36), sa.ForeignKey('products.id')),
        sa.Column('quantity', sa.Integer),
        sa.Column('unit_price', sa.Numeric(10, 2)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    # ML Models table
    op.create_table(
        'ml_models',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('version', sa.String(50)),
        sa.Column('type', sa.String(50)),
        sa.Column('metrics', postgresql.JSONB),
        sa.Column('parameters', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_products_category', 'products', ['category'])
    op.create_index('idx_user_interactions_user_product', 
                    'user_interactions', ['user_id', 'product_id'])
    op.create_index('idx_orders_user', 'orders', ['user_id'])
    op.create_index('idx_order_items_order', 'order_items', ['order_id'])

def downgrade():
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('user_interactions')
    op.drop_table('ml_models')
    op.drop_table('products')
    op.drop_table('users')
