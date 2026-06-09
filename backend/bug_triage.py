from crewai import Agent, Task, Crew, Process, LLM
from crewai_tools import tool
from fastapi import HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

# ===========================================================================
# REQUEST MODEL
# ===========================================================================

class BugTriageRequest(BaseModel):
    title: str
    description: str
    environment: str
    impact: str

class BugTriageResponse(BaseModel):
    severity: str
    priority: str
    analysis: str
    recommended_team: str
    suggested_fix: str

# ===========================================================================
# TOOLS
# ===========================================================================

@tool("Calculate Bug Severity")
def calculate_severity(bug_description: str) -> str:
    """Calculate bug severity based on description."""
    desc_lower = bug_description.lower()
    
    if any(word in desc_lower for word in ['crash', 'data loss', 'security', 'payment']):
        return "P0 - Critical: Fix immediately, all hands"
    elif any(word in desc_lower for word in ['login', 'broken', 'all users']):
        return "P1 - High: Fix this sprint"
    elif any(word in desc_lower for word in ['slow', 'ui', 'some users']):
        return "P2 - Medium: Fix next sprint"
    else:
        return "P3 - Low: Backlog"

@tool("Assign Team")
def assign_team(bug_description: str) -> str:
    """Assign bug to appropriate team."""
    desc_lower = bug_description.lower()
    
    if any(word in desc_lower for word in ['payment', 'transaction', 'checkout']):
        return "Payment Team (Backend)"
    elif any(word in desc_lower for word in ['login', 'auth', 'password']):
        return "Auth Team (Backend)"
    elif any(word in desc_lower for word in ['ui', 'button', 'screen', 'display']):
        return "Frontend Team"
    elif any(word in desc_lower for word in ['crash', 'ios', 'android', 'mobile']):
        return "Mobile Team"
    else:
        return "QA Team - Needs Investigation"

@tool("Suggest Fix")
def suggest_fix(bug_description: str) -> str:
    """Suggest potential fix based on bug description."""
    desc_lower = bug_description.lower()
    
    fixes = {
        'payment': "Check payment gateway timeout settings, review transaction logs",
        'crash': "Review crash logs, check memory management, test on affected devices",
        'login': "Check auth service health, review session management",
        'ui': "Review recent UI changes, test across browsers/devices",
        'slow': "Profile API response times, check database queries"
    }
    
    for keyword, fix in fixes.items():
        if keyword in desc_lower:
            return fix
    
    return "Review logs, reproduce in staging, check recent deployments"

# ===========================================================================
# PRODUCTION BUG TRIAGE CREW
# ===========================================================================

async def run_bug_triage(request: BugTriageRequest) -> BugTriageResponse:
    """Production-grade bug triage using CrewAI."""
    
    try:
        logger.info(f"Starting triage for bug: {request.title}")
        
        # Format bug for agents
        bug_summary = f"""
        Title: {request.title}
        Description: {request.description}
        Environment: {request.environment}
        Impact: {request.impact}
        """
        
        # Agent 1: Bug Triager
        bug_triager = Agent(
            role='Bug Triager',
            goal='Accurately classify bug severity and priority',
            backstory='Senior QA with 16 years experience in bug classification',
            tools=[calculate_severity],
            verbose=False,  # Production: False
            allow_delegation=False,
            llm=LLM(model="gpt-3.5-turbo")
        )
        
        # Agent 2: Team Router
        team_router = Agent(
            role='Team Router',
            goal='Route bug to correct team and suggest fix',
            backstory='Expert in software architecture and team organization',
            tools=[assign_team, suggest_fix],
            verbose=False,
            allow_delegation=False,
            llm=LLM(model="gpt-3.5-turbo")
        )
        
        # Task 1: Triage
        triage_task = Task(
            description=f"""
            Triage this bug and determine severity:
            {bug_summary}
            
            Use Calculate Bug Severity tool.
            Return severity level and justification.
            """,
            agent=bug_triager,
            expected_output="Severity level with justification"
        )
        
        # Task 2: Route
        route_task = Task(
            description=f"""
            Based on triage results, for this bug:
            {bug_summary}
            
            1. Use Assign Team tool to route to correct team
            2. Use Suggest Fix tool for initial investigation steps
            
            Return team assignment and suggested fix.
            """,
            agent=team_router,
            expected_output="Team assignment and suggested fix"
        )
        
        # Run crew
        crew = Crew(
            agents=[bug_triager, team_router],
            tasks=[triage_task, route_task],
            process=Process.sequential,
            verbose=False
        )
        
        result = crew.kickoff()
        
        # Get individual task outputs
        triage_output = str(triage_task.output)
        route_output = str(result)
        
        # Extract severity
        severity = "P1 - High"  # Default
        for level in ["P0", "P1", "P2", "P3"]:
            if level in triage_output:
                severity = level
                break
        
        logger.info(f"Triage complete: {severity}")
        
        return BugTriageResponse(
            severity=severity,
            priority="Immediate" if "P0" in severity else "This Sprint",
            analysis=triage_output,
            recommended_team=route_output,
            suggested_fix=route_output
        )
        
    except Exception as e:
        logger.error(f"Bug triage failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Triage failed: {str(e)}"
        )