from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from ..monitoring.analytics import AnalyticsService
from ..monitoring.monitoring import MonitoringService
from ..monitoring.customer_interaction import CustomerInteractionService
from ..monitoring.config import MonitoringConfig

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

# Initialize services
config = MonitoringConfig()
analytics_service = AnalyticsService(config)
monitoring_service = MonitoringService(config)
customer_service = CustomerInteractionService(config)

@router.get("/dashboard")
async def get_dashboard_data(time_range: str = "24h") -> Dict:
    """Get all dashboard metrics."""
    try:
        return await analytics_service.get_dashboard_data(time_range)
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def get_system_health() -> Dict:
    """Get system health status."""
    try:
        return await monitoring_service.get_system_health()
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def submit_feedback(user_id: str, feedback_data: Dict) -> Dict:
    """Submit customer feedback."""
    try:
        return await customer_service.collect_feedback(
            user_id, "feedback", feedback_data
        )
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def handle_chat(user_id: str, message: str) -> Dict:
    """Handle customer chat interaction."""
    try:
        return await customer_service.handle_chat_interaction(user_id, message)
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/business")
async def get_business_metrics(
    start_time: datetime,
    end_time: datetime = None
) -> Dict:
    """Get business metrics for specified time range."""
    try:
        if not end_time:
            end_time = datetime.utcnow()
        return await analytics_service.get_business_metrics(start_time, end_time)
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/ai")
async def get_ai_metrics(
    start_time: datetime,
    end_time: datetime = None
) -> Dict:
    """Get AI performance metrics."""
    try:
        if not end_time:
            end_time = datetime.utcnow()
        return await analytics_service.get_ai_performance_metrics(
            start_time, end_time
        )
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/customer")
async def get_customer_metrics(
    start_time: datetime,
    end_time: datetime = None
) -> Dict:
    """Get customer interaction metrics."""
    try:
        if not end_time:
            end_time = datetime.utcnow()
        return await analytics_service.get_customer_interaction_metrics(
            start_time, end_time
        )
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/interactions/{user_id}")
async def get_user_interactions(
    user_id: str,
    limit: int = 10
) -> List[Dict]:
    """Get interaction history for a user."""
    try:
        return await customer_service.get_interaction_history(user_id, limit)
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/interactions/{user_id}/metrics")
async def get_user_interaction_metrics(user_id: str) -> Dict:
    """Get interaction metrics for a user."""
    try:
        return await customer_service.get_interaction_metrics(user_id)
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/survey/create")
async def create_survey(
    user_id: str,
    interaction_type: str
) -> Dict:
    """Create satisfaction survey for user."""
    try:
        return await customer_service.create_satisfaction_survey(
            user_id, interaction_type
        )
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/survey/{survey_id}/respond")
async def submit_survey_response(
    survey_id: str,
    responses: Dict
) -> Dict:
    """Submit survey responses."""
    try:
        return await customer_service.process_survey_response(
            survey_id, responses
        )
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export")
async def export_metrics(
    start_time: datetime,
    end_time: datetime = None,
    metrics: List[str] = ["business", "ai", "customer", "system"],
    format: str = "csv"
) -> bytes:
    """Export metrics report."""
    try:
        if not end_time:
            end_time = datetime.utcnow()
        return await analytics_service.export_report(
            start_time, end_time, metrics, format
        )
    except Exception as e:
        await monitoring_service.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))
