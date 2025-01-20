from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum

class AgentType(Enum):
    DATA_COLLECTION = "data_collection"
    PERSONALIZATION = "personalization"
    LOYALTY = "loyalty"
    PRICING = "pricing"
    SENTIMENT = "sentiment"
    TREND = "trend"
    INVENTORY = "inventory"
    PROMOTION = "promotion"
    CUSTOMER_SUPPORT = "customer_support"

@dataclass
class AgentConfig:
    agent_type: AgentType
    model_name: str
    temperature: float
    max_tokens: int
    tools: List[str]
    memory_type: str
    vertex_ai_config: Dict

@dataclass
class WorkflowConfig:
    enabled_agents: List[AgentType]
    workflow_type: str
    coordination_strategy: str
    max_steps: int
    timeout_seconds: int
    monitoring_interval: int

AGENT_CONFIGS = {
    AgentType.DATA_COLLECTION: AgentConfig(
        agent_type=AgentType.DATA_COLLECTION,
        model_name="gpt-4",
        temperature=0.2,
        max_tokens=150,
        tools=["database_query", "event_tracking", "data_validation"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-2"}
    ),
    AgentType.PERSONALIZATION: AgentConfig(
        agent_type=AgentType.PERSONALIZATION,
        model_name="gpt-4",
        temperature=0.3,
        max_tokens=200,
        tools=["recommendation_engine", "user_profiling", "preference_analysis"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-4"}
    ),
    AgentType.LOYALTY: AgentConfig(
        agent_type=AgentType.LOYALTY,
        model_name="gpt-4",
        temperature=0.3,
        max_tokens=150,
        tools=["reward_calculation", "program_management", "user_segmentation"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-2"}
    ),
    AgentType.PRICING: AgentConfig(
        agent_type=AgentType.PRICING,
        model_name="gpt-4",
        temperature=0.2,
        max_tokens=150,
        tools=["price_optimization", "market_analysis", "competitor_tracking"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-4"}
    ),
    AgentType.SENTIMENT: AgentConfig(
        agent_type=AgentType.SENTIMENT,
        model_name="gpt-4",
        temperature=0.3,
        max_tokens=200,
        tools=["sentiment_analysis", "review_processing", "feedback_aggregation"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-2"}
    ),
    AgentType.TREND: AgentConfig(
        agent_type=AgentType.TREND,
        model_name="gpt-4",
        temperature=0.4,
        max_tokens=200,
        tools=["trend_detection", "seasonal_analysis", "market_prediction"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-4"}
    ),
    AgentType.INVENTORY: AgentConfig(
        agent_type=AgentType.INVENTORY,
        model_name="gpt-4",
        temperature=0.2,
        max_tokens=150,
        tools=["inventory_tracking", "demand_prediction", "reorder_optimization"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-2"}
    ),
    AgentType.PROMOTION: AgentConfig(
        agent_type=AgentType.PROMOTION,
        model_name="gpt-4",
        temperature=0.4,
        max_tokens=200,
        tools=["campaign_management", "offer_generation", "targeting_optimization"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-2"}
    ),
    AgentType.CUSTOMER_SUPPORT: AgentConfig(
        agent_type=AgentType.CUSTOMER_SUPPORT,
        model_name="gpt-4",
        temperature=0.5,
        max_tokens=250,
        tools=["query_resolution", "ticket_management", "knowledge_base"],
        memory_type="conversation_buffer",
        vertex_ai_config={"machine_type": "n1-standard-2"}
    ),
}

DEFAULT_WORKFLOW_CONFIG = WorkflowConfig(
    enabled_agents=list(AgentType),
    workflow_type="parallel",
    coordination_strategy="consensus",
    max_steps=50,
    timeout_seconds=30,
    monitoring_interval=5
)
