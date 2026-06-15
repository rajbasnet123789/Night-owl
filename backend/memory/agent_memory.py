from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import json
import hashlib
from collections import defaultdict


@dataclass
class MemoryEntry:
    """Represents a single memory entry"""
    content: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)
    importance: float = 0.5  # 0.0 to 1.0
    access_count: int = 0
    last_accessed: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)
    embedding: Optional[List[float]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "importance": self.importance,
            "access_count": self.access_count,
            "last_accessed": self.last_accessed.isoformat(),
            "tags": self.tags
        }


class ConversationMemory:
    """Memory system for conversation history"""
    
    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self.memories: List[MemoryEntry] = []
        self.conversation_summary: str = ""
        self.key_topics: List[str] = []
        
    def add_memory(self, content: Dict[str, Any], importance: float = 0.5, tags: List[str] = None):
        """Add a new memory"""
        entry = MemoryEntry(
            content=content,
            importance=importance,
            tags=tags or []
        )
        
        self.memories.append(entry)
        
        if len(self.memories) > self.max_size:
            self._compress_memories()
        
        self._update_summary(content)
        
    def get_recent_memories(self, count: int = 10) -> List[MemoryEntry]:
        """Get recent memories"""
        sorted_memories = sorted(
            self.memories, 
            key=lambda x: x.timestamp, 
            reverse=True
        )
        return sorted_memories[:count]
    
    def get_important_memories(self, count: int = 5) -> List[MemoryEntry]:
        """Get most important memories"""
        sorted_memories = sorted(
            self.memories, 
            key=lambda x: x.importance, 
            reverse=True
        )
        return sorted_memories[:count]
    
    def search_memories(self, query: str, limit: int = 5) -> List[MemoryEntry]:
        """Search memories by query"""
        query_lower = query.lower()
        matching_memories = []
        
        for memory in self.memories:
            content_str = json.dumps(memory.content).lower()
            if query_lower in content_str or any(tag.lower() in query_lower for tag in memory.tags):
                matching_memories.append(memory)
                memory.access_count += 1
                memory.last_accessed = datetime.now()
        
        matching_memories.sort(key=lambda x: x.importance, reverse=True)
        return matching_memories[:limit]
    
    def get_context_window(self, window_size: int = 20) -> List[Dict[str, Any]]:
        """Get context window for LLM"""
        recent = self.get_recent_memories(window_size)
        return [memory.content for memory in reversed(recent)]
    
    def _compress_memories(self):
        """Compress memories to manage size"""
        if len(self.memories) <= self.max_size:
            return
        
        memories_to_keep = self.max_size // 2
        
        important = self.get_important_memories(memories_to_keep)
        recent = self.get_recent_memories(memories_to_keep)
        
        combined = list({id(m): m for m in important + recent}.values())
        combined.sort(key=lambda x: x.timestamp, reverse=True)
        
        self.memories = combined[:self.max_size]
    
    def _update_summary(self, new_content: Dict[str, Any]):
        """Update conversation summary"""
        if "topic" in new_content:
            topic = new_content["topic"]
            if topic not in self.key_topics:
                self.key_topics.append(topic)
                if len(self.key_topics) > 10:
                    self.key_topics.pop(0)
    
    def get_summary(self) -> str:
        """Get conversation summary"""
        if not self.conversation_summary:
            return "No conversation summary available."
        return self.conversation_summary
    
    def update_summary(self, summary: str):
        """Update conversation summary"""
        self.conversation_summary = summary


class InterviewMemory:
    """Specialized memory for interview sessions"""
    
    def __init__(self):
        self.candidate_info: Dict[str, Any] = {}
        self.interview_phases: List[Dict[str, Any]] = []
        self.question_history: List[Dict[str, Any]] = []
        self.evaluation_history: List[Dict[str, Any]] = []
        self.key_moments: List[MemoryEntry] = []
        
    def set_candidate_info(self, info: Dict[str, Any]):
        """Set candidate information"""
        self.candidate_info = info
        
    def add_interview_phase(self, phase: Dict[str, Any]):
        """Add interview phase record"""
        self.interview_phases.append(phase)
        
    def add_question(self, question: Dict[str, Any], response: str, evaluation: Dict[str, Any]):
        """Add question and response"""
        entry = {
            "question": question,
            "response": response,
            "evaluation": evaluation,
            "timestamp": datetime.now().isoformat()
        }
        self.question_history.append(entry)
        
    def add_key_moment(self, content: Dict[str, Any], importance: float = 0.8):
        """Add key interview moment"""
        entry = MemoryEntry(
            content=content,
            importance=importance,
            tags=["key_moment"]
        )
        self.key_moments.append(entry)
        
    def get_interview_summary(self) -> Dict[str, Any]:
        """Get interview summary"""
        return {
            "candidate_info": self.candidate_info,
            "total_questions": len(self.question_history),
            "phases_completed": len(self.interview_phases),
            "key_moments_count": len(self.key_moments),
            "average_evaluation_score": self._calculate_average_score()
        }
    
    def _calculate_average_score(self) -> float:
        """Calculate average evaluation score"""
        scores = []
        for entry in self.question_history:
            if "evaluation" in entry and "score" in entry["evaluation"]:
                scores.append(entry["evaluation"]["score"])
        
        return sum(scores) / len(scores) if scores else 0.0


class AgentMemoryManager:
    """Central memory manager for all agents"""
    
    def __init__(self):
        self.conversation_memory = ConversationMemory()
        self.interview_memory = InterviewMemory()
        self.agent_memories: Dict[str, ConversationMemory] = {}
        self.shared_memory: Dict[str, Any] = {}
        
    def get_agent_memory(self, agent_id: str) -> ConversationMemory:
        """Get or create memory for specific agent"""
        if agent_id not in self.agent_memories:
            self.agent_memories[agent_id] = ConversationMemory(max_size=50)
        return self.agent_memories[agent_id]
    
    def add_to_shared_memory(self, key: str, value: Any):
        """Add to shared memory"""
        self.shared_memory[key] = value
        
    def get_from_shared_memory(self, key: str, default: Any = None) -> Any:
        """Get from shared memory"""
        return self.shared_memory.get(key, default)
    
    def sync_memories(self, source_agent: str, target_agent: str, keys: List[str] = None):
        """Sync memories between agents"""
        source_memory = self.get_agent_memory(source_agent)
        target_memory = self.get_agent_memory(target_agent)
        
        if keys is None:
            recent = source_memory.get_recent_memories(5)
            for memory in recent:
                target_memory.add_memory(memory.content, memory.importance, memory.tags)
        else:
            for key in keys:
                if key in self.shared_memory:
                    target_memory.add_memory({key: self.shared_memory[key]}, 0.7, [key])
    
    def get_global_context(self) -> Dict[str, Any]:
        """Get global context for decision making"""
        return {
            "conversation_summary": self.conversation_memory.get_summary(),
            "interview_summary": self.interview_memory.get_interview_summary(),
            "shared_memory": self.shared_memory,
            "agent_count": len(self.agent_memories)
        }
    
    def cleanup_old_memories(self, max_age_days: int = 30):
        """Clean up old memories"""
        cutoff_date = datetime.now().timestamp() - (max_age_days * 24 * 3600)
        
        for agent_id, memory in self.agent_memories.items():
            memory.memories = [
                m for m in memory.memories 
                if m.timestamp.timestamp() > cutoff_date
            ]