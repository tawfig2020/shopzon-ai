from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, List
from pydantic import BaseModel
from ..ml.workflow_coordinator import WorkflowCoordinator
from ..ml.agent_config import AgentType, WorkflowConfig

router = APIRouter(prefix="/agents", tags=["agents"])
coordinator = WorkflowCoordinator()

class InteractionData(BaseModel):
    user_id: str
    interaction_type: str
    data: Dict

class WorkflowResponse(BaseModel):
    workflow_id: str
    status: str
    results: Dict = None
    error: str = None

@router.post("/interact", response_model=WorkflowResponse)
async def process_interaction(interaction: InteractionData):
    """Process user interaction through the multi-agent workflow."""
    try:
        result = await coordinator.process_user_interaction(
            interaction.user_id,
            {
                "type": interaction.interaction_type,
                "data": interaction.data
            }
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflow/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """Get status of a specific workflow execution."""
    status = coordinator.get_workflow_status(workflow_id)
    if not status:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return status

@router.post("/agents/{agent_type}/configure")
async def configure_agent(agent_type: AgentType, config: Dict):
    """Configure specific agent parameters."""
    try:
        agent = coordinator.agents.get(agent_type)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        await agent.configure(config)
        return {"status": "success", "message": f"Agent {agent_type} configured successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agents/status")
async def get_agent_status():
    """Get status of all active agents."""
    status = {
        str(agent_type): {
            "active": agent.is_active(),
            "metrics": agent.get_metrics()
        }
        for agent_type, agent in coordinator.agents.items()
    }
    return status

@router.post("/workflow/configure")
async def configure_workflow(config: WorkflowConfig):
    """Configure workflow parameters."""
    try:
        coordinator.config = config
        coordinator.workflow = coordinator._create_workflow()
        return {"status": "success", "message": "Workflow configured successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    """Get personalized recommendations for a user."""
    try:
        agent = coordinator.agents.get(AgentType.PERSONALIZATION)
        if not agent:
            raise HTTPException(status_code=404, detail="Personalization agent not found")
        
        recommendations = await agent.process({"user_id": user_id})
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pricing/{product_id}")
async def get_dynamic_pricing(product_id: str):
    """Get dynamic pricing for a product."""
    try:
        agent = coordinator.agents.get(AgentType.PRICING)
        if not agent:
            raise HTTPException(status_code=404, detail="Pricing agent not found")
        
        pricing = await agent.process({"product_id": product_id})
        return pricing
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/support/chat")
async def chat_with_support(message: Dict):
    """Interact with customer support agent."""
    try:
        agent = coordinator.agents.get(AgentType.CUSTOMER_SUPPORT)
        if not agent:
            raise HTTPException(status_code=404, detail="Customer support agent not found")
        
        response = await agent.process(message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.on_event("shutdown")
async def shutdown_event():
    """Cleanup when shutting down the API."""
    await coordinator.shutdown()
