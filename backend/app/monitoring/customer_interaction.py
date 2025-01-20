from google.cloud import bigquery
from typing import Dict, List, Optional
import openai
from datetime import datetime
from .config import MonitoringConfig
from ..ml.specialized_agents import CustomerSupportAgent

class CustomerInteractionService:
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.bq_client = bigquery.Client()
        self.support_agent = CustomerSupportAgent()
        
    async def collect_feedback(self, user_id: str, interaction_type: str, 
                             feedback_data: Dict) -> Dict:
        """Collect and store customer feedback."""
        # Process feedback using sentiment analysis
        sentiment = await self.analyze_sentiment(feedback_data.get("text", ""))
        
        # Prepare feedback document
        feedback_doc = {
            "timestamp": datetime.utcnow(),
            "user_id": user_id,
            "interaction_type": interaction_type,
            "feedback_data": feedback_data,
            "sentiment": sentiment,
            "satisfaction_score": feedback_data.get("rating", 0)
        }
        
        # Store in BigQuery
        table_id = f"{self.config.bigquery.project_id}.{self.config.bigquery.dataset_id}.customer_feedback"
        errors = self.bq_client.insert_rows_json(table_id, [feedback_doc])
        
        if not errors:
            return {"status": "success", "feedback_id": str(feedback_doc["timestamp"])}
        else:
            return {"status": "error", "message": str(errors)}

    async def analyze_sentiment(self, text: str) -> str:
        """Analyze sentiment of text using GPT-4."""
        response = await openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Analyze the sentiment of the following text and respond with either 'positive', 'negative', or 'neutral'."},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content.strip().lower()

    async def handle_chat_interaction(self, user_id: str, message: str) -> Dict:
        """Handle customer chat interaction using AI support agent."""
        # Process message through support agent
        response = await self.support_agent.process_message(user_id, message)
        
        # Log interaction
        interaction_doc = {
            "timestamp": datetime.utcnow(),
            "user_id": user_id,
            "message": message,
            "response": response,
            "interaction_type": "chat"
        }
        
        table_id = f"{self.config.bigquery.project_id}.{self.config.bigquery.dataset_id}.customer_interactions"
        self.bq_client.insert_rows_json(table_id, [interaction_doc])
        
        return {
            "response": response,
            "interaction_id": str(interaction_doc["timestamp"])
        }

    async def create_satisfaction_survey(self, user_id: str, 
                                      interaction_type: str) -> Dict:
        """Create and send customer satisfaction survey."""
        survey_doc = {
            "timestamp": datetime.utcnow(),
            "user_id": user_id,
            "interaction_type": interaction_type,
            "status": "pending",
            "questions": [
                {
                    "id": "overall_satisfaction",
                    "type": "rating",
                    "text": "How satisfied are you with your experience?"
                },
                {
                    "id": "recommendation_likelihood",
                    "type": "rating",
                    "text": "How likely are you to recommend us to others?"
                },
                {
                    "id": "improvement_feedback",
                    "type": "text",
                    "text": "How can we improve our service?"
                }
            ]
        }
        
        table_id = f"{self.config.bigquery.project_id}.{self.config.bigquery.dataset_id}.satisfaction_surveys"
        self.bq_client.insert_rows_json(table_id, [survey_doc])
        
        return {
            "survey_id": str(survey_doc["timestamp"]),
            "questions": survey_doc["questions"]
        }

    async def process_survey_response(self, survey_id: str, 
                                    responses: Dict) -> Dict:
        """Process and store survey responses."""
        response_doc = {
            "timestamp": datetime.utcnow(),
            "survey_id": survey_id,
            "responses": responses
        }
        
        # Calculate satisfaction metrics
        metrics = {
            "overall_satisfaction": responses.get("overall_satisfaction", 0),
            "recommendation_score": responses.get("recommendation_likelihood", 0),
            "has_feedback": bool(responses.get("improvement_feedback"))
        }
        
        # Store response and update survey status
        table_id = f"{self.config.bigquery.project_id}.{self.config.bigquery.dataset_id}.survey_responses"
        self.bq_client.insert_rows_json(table_id, [response_doc])
        
        # Update survey status
        query = f"""
        UPDATE `{self.config.bigquery.dataset_id}.satisfaction_surveys`
        SET status = 'completed'
        WHERE CAST(timestamp AS STRING) = @survey_id
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("survey_id", "STRING", survey_id),
            ]
        )
        
        self.bq_client.query(query, job_config=job_config)
        
        return {
            "status": "success",
            "metrics": metrics
        }

    async def get_interaction_history(self, user_id: str, 
                                    limit: int = 10) -> List[Dict]:
        """Get customer interaction history."""
        query = f"""
        SELECT
            timestamp,
            interaction_type,
            STRUCT(
                message,
                response,
                feedback_data,
                satisfaction_score
            ) as details
        FROM (
            SELECT timestamp, 'chat' as interaction_type, 
                   message, response, NULL as feedback_data, 
                   NULL as satisfaction_score
            FROM `{self.config.bigquery.dataset_id}.customer_interactions`
            WHERE user_id = @user_id
            UNION ALL
            SELECT timestamp, 'feedback' as interaction_type,
                   NULL as message, NULL as response,
                   feedback_data, satisfaction_score
            FROM `{self.config.bigquery.dataset_id}.customer_feedback`
            WHERE user_id = @user_id
        )
        ORDER BY timestamp DESC
        LIMIT @limit
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("user_id", "STRING", user_id),
                bigquery.ScalarQueryParameter("limit", "INTEGER", limit),
            ]
        )
        
        df = self.bq_client.query(query, job_config=job_config).to_dataframe()
        return df.to_dict(orient='records')

    async def get_interaction_metrics(self, user_id: str) -> Dict:
        """Get metrics for customer interactions."""
        query = f"""
        WITH interactions AS (
            SELECT
                COUNT(*) as total_interactions,
                AVG(CASE WHEN satisfaction_score IS NOT NULL 
                    THEN satisfaction_score END) as avg_satisfaction,
                COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) / 
                    COUNT(*) as positive_sentiment_ratio
            FROM `{self.config.bigquery.dataset_id}.customer_feedback`
            WHERE user_id = @user_id
        ),
        chat_metrics AS (
            SELECT
                COUNT(*) as total_chats,
                AVG(TIMESTAMP_DIFF(response_timestamp, timestamp, SECOND)) 
                    as avg_response_time
            FROM `{self.config.bigquery.dataset_id}.customer_interactions`
            WHERE user_id = @user_id
        )
        SELECT * FROM interactions CROSS JOIN chat_metrics
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("user_id", "STRING", user_id),
            ]
        )
        
        df = self.bq_client.query(query, job_config=job_config).to_dataframe()
        return df.to_dict(orient='records')[0]
