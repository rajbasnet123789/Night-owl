from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json
import uuid
from pydantic import BaseModel, Field


class AgentRole(str, Enum):
    COORDINATOR = "coordinator"
    QUESTION_GENERATOR = "question_generator"
    RESPONSE_EVALUATOR = "response_evaluator"
    TECHNICAL_SCREENER = "technical_screener"
    BEHAVIORAL_ANALYST = "behavioral_analyst"
    SCORING_AGENT = "scoring_agent"
    REPORT_GENERATOR = "report_generator"


class MessageType(str, Enum):
    QUERY = "query"
    RESPONSE = "response"
    TASK = "task"
    RESULT = "result"
    ERROR = "error"
    HANDOFF = "handoff"


@dataclass
class AgentMessage:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sender: AgentRole = AgentRole.COORDINATOR
    receiver: AgentRole = AgentRole.COORDINATOR
    message_type: MessageType = MessageType.QUERY
    content: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    parent_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "sender": self.sender.value,
            "receiver": self.receiver.value,
            "message_type": self.message_type.value,
            "content": self.content,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat(),
            "parent_id": self.parent_id
        }
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict())


class AgentMemory:
    def __init__(self, max_size: int = 100):
        self.messages: List[AgentMessage] = []
        self.max_size = max_size
        self.context: Dict[str, Any] = {}
        
    def add_message(self, message: AgentMessage):
        if len(self.messages) >= self.max_size:
            self.messages.pop(0)
        self.messages.append(message)
        
    def get_recent_messages(self, count: int = 10) -> List[AgentMessage]:
        return self.messages[-count:]
        
    def update_context(self, key: str, value: Any):
        self.context[key] = value
        
    def get_context(self, key: str, default: Any = None) -> Any:
        return self.context.get(key, default)


class BaseAgent(ABC):
    def __init__(self, role: AgentRole, name: str, description: str):
        self.role = role
        self.name = name
        self.description = description
        self.memory = AgentMemory()
        self.is_active = True
        self.performance_metrics = {
            "tasks_completed": 0,
            "avg_response_time": 0.0,
            "success_rate": 1.0,
            "error_count": 0
        }
        
    @abstractmethod
    async def process_message(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message and return response"""
        pass
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        pass
    
    async def send_message(
        self, 
        receiver: AgentRole, 
        message_type: MessageType, 
        content: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> AgentMessage:
        """Create and send a message to another agent"""
        message = AgentMessage(
            sender=self.role,
            receiver=receiver,
            message_type=message_type,
            content=content,
            metadata=metadata or {}
        )
        self.memory.add_message(message)
        return message
    
    def update_metrics(self, success: bool, response_time: float):
        """Update performance metrics"""
        self.performance_metrics["tasks_completed"] += 1
        
        if success:
            total_tasks = self.performance_metrics["tasks_completed"]
            current_avg = self.performance_metrics["avg_response_time"]
            self.performance_metrics["avg_response_time"] = (
                (current_avg * (total_tasks - 1) + response_time) / total_tasks
            )
        else:
            self.performance_metrics["error_count"] += 1
            
        total = self.performance_metrics["tasks_completed"]
        errors = self.performance_metrics["error_count"]
        self.performance_metrics["success_rate"] = (total - errors) / total if total > 0 else 1.0
    
    def get_status(self) -> Dict[str, Any]:
        """Get agent status"""
        return {
            "role": self.role.value,
            "name": self.name,
            "is_active": self.is_active,
            "performance": self.performance_metrics,
            "memory_size": len(self.memory.messages)
        }
    
    def deactivate(self):
        """Deactivate the agent"""
        self.is_active = False
        
    def activate(self):
        """Activate the agent"""
        self.is_active = True