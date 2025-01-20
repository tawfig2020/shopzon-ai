-- Create monitoring schema
CREATE SCHEMA IF NOT EXISTS monitoring;

-- System Metrics Table
CREATE TABLE IF NOT EXISTS monitoring.system_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    labels JSONB,
    metadata JSONB
);

-- Create index on timestamp and metric_name
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON monitoring.system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON monitoring.system_metrics(metric_name);

-- AI Agent Metrics Table
CREATE TABLE IF NOT EXISTS monitoring.agent_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    agent_type VARCHAR(50) NOT NULL,
    response_time DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    error_rate DOUBLE PRECISION,
    metadata JSONB
);

-- Create index on timestamp and agent_type
CREATE INDEX IF NOT EXISTS idx_agent_metrics_timestamp ON monitoring.agent_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent ON monitoring.agent_metrics(agent_type);

-- Customer Interactions Table
CREATE TABLE IF NOT EXISTS monitoring.customer_interactions (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    duration DOUBLE PRECISION,
    success BOOLEAN,
    metadata JSONB
);

-- Create index on timestamp and user_id
CREATE INDEX IF NOT EXISTS idx_customer_interactions_timestamp ON monitoring.customer_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_user ON monitoring.customer_interactions(user_id);

-- Customer Feedback Table
CREATE TABLE IF NOT EXISTS monitoring.customer_feedback (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100) NOT NULL,
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
    sentiment VARCHAR(20),
    feedback_text TEXT,
    metadata JSONB
);

-- Create index on timestamp and user_id
CREATE INDEX IF NOT EXISTS idx_customer_feedback_timestamp ON monitoring.customer_feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_user ON monitoring.customer_feedback(user_id);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS monitoring.error_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT,
    stack_trace TEXT,
    metadata JSONB
);

-- Create index on timestamp and error_type
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON monitoring.error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON monitoring.error_logs(error_type);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS monitoring.performance_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    endpoint VARCHAR(200),
    response_time DOUBLE PRECISION,
    status_code INTEGER,
    user_id VARCHAR(100),
    metadata JSONB
);

-- Create index on timestamp and endpoint
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON monitoring.performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON monitoring.performance_metrics(endpoint);

-- Create materialized views for common queries
CREATE MATERIALIZED VIEW IF NOT EXISTS monitoring.hourly_system_metrics AS
SELECT
    date_trunc('hour', timestamp) as hour,
    metric_name,
    AVG(metric_value) as avg_value,
    MAX(metric_value) as max_value,
    MIN(metric_value) as min_value,
    COUNT(*) as sample_count
FROM monitoring.system_metrics
GROUP BY date_trunc('hour', timestamp), metric_name;

CREATE MATERIALIZED VIEW IF NOT EXISTS monitoring.daily_agent_performance AS
SELECT
    date_trunc('day', timestamp) as day,
    agent_type,
    AVG(response_time) as avg_response_time,
    AVG(accuracy) as avg_accuracy,
    AVG(error_rate) as avg_error_rate,
    COUNT(*) as interaction_count
FROM monitoring.agent_metrics
GROUP BY date_trunc('day', timestamp), agent_type;

CREATE MATERIALIZED VIEW IF NOT EXISTS monitoring.daily_customer_satisfaction AS
SELECT
    date_trunc('day', timestamp) as day,
    AVG(satisfaction_score) as avg_satisfaction,
    COUNT(*) as feedback_count,
    COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_count,
    COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_count
FROM monitoring.customer_feedback
GROUP BY date_trunc('day', timestamp);

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION monitoring.refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY monitoring.hourly_system_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monitoring.daily_agent_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monitoring.daily_customer_satisfaction;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old data
CREATE OR REPLACE FUNCTION monitoring.cleanup_old_data(days INTEGER)
RETURNS void AS $$
BEGIN
    DELETE FROM monitoring.system_metrics
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * days;
    
    DELETE FROM monitoring.agent_metrics
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * days;
    
    DELETE FROM monitoring.customer_interactions
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * days;
    
    DELETE FROM monitoring.error_logs
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * days;
    
    DELETE FROM monitoring.performance_metrics
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * days;
END;
$$ LANGUAGE plpgsql;
