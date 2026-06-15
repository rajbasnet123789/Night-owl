from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, field
import json
import uuid
from datetime import datetime
import asyncio


@dataclass
class ToolDefinition:
    """Defines an MCP tool"""
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    handler: Callable = None
    requires_auth: bool = False
    rate_limit: int = 100  # requests per minute
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.input_schema,
            "outputSchema": self.output_schema,
            "requiresAuth": self.requires_auth,
            "rateLimit": self.rate_limit
        }


@dataclass
class ResourceDefinition:
    """Defines an MCP resource"""
    uri: str
    name: str
    description: str
    mime_type: str = "application/json"
    handler: Callable = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "uri": self.uri,
            "name": self.name,
            "description": self.description,
            "mimeType": self.mime_type
        }


@dataclass
class PromptDefinition:
    """Defines an MCP prompt"""
    name: str
    description: str
    arguments: List[Dict[str, Any]] = field(default_factory=list)
    handler: Callable = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "arguments": self.arguments
        }


class MCPServer:
    """Model Context Protocol Server implementation"""
    
    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version
        self.tools: Dict[str, ToolDefinition] = {}
        self.resources: Dict[str, ResourceDefinition] = {}
        self.prompts: Dict[str, PromptDefinition] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.request_history: List[Dict[str, Any]] = []
        
    def register_tool(self, tool: ToolDefinition):
        """Register a tool with the server"""
        self.tools[tool.name] = tool
        
    def register_resource(self, resource: ResourceDefinition):
        """Register a resource with the server"""
        self.resources[resource.uri] = resource
        
    def register_prompt(self, prompt: PromptDefinition):
        """Register a prompt with the server"""
        self.prompts[prompt.name] = prompt
    
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming MCP request"""
        method = request.get("method", "")
        params = request.get("params", {})
        request_id = request.get("id", str(uuid.uuid4()))
        
        self.request_history.append({
            "id": request_id,
            "method": method,
            "params": params,
            "timestamp": datetime.now().isoformat()
        })
        
        try:
            if method == "initialize":
                return await self._handle_initialize(params, request_id)
            elif method == "tools/list":
                return await self._handle_list_tools(request_id)
            elif method == "tools/call":
                return await self._handle_call_tool(params, request_id)
            elif method == "resources/list":
                return await self._handle_list_resources(request_id)
            elif method == "resources/read":
                return await self._handle_read_resource(params, request_id)
            elif method == "prompts/list":
                return await self._handle_list_prompts(request_id)
            elif method == "prompts/get":
                return await self._handle_get_prompt(params, request_id)
            else:
                return self._error_response(request_id, -32601, f"Method not found: {method}")
                
        except Exception as e:
            return self._error_response(request_id, -32603, f"Internal error: {str(e)}")
    
    async def _handle_initialize(self, params: Dict[str, Any], request_id: str) -> Dict[str, Any]:
        """Handle initialize request"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "created_at": datetime.now().isoformat(),
            "client_info": params.get("clientInfo", {}),
            "protocol_version": params.get("protocolVersion", "2024-11-05")
        }
        
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {"listChanged": True},
                    "resources": {"subscribe": True, "listChanged": True},
                    "prompts": {"listChanged": True}
                },
                "serverInfo": {
                    "name": self.name,
                    "version": self.version
                },
                "sessionId": session_id
            }
        }
    
    async def _handle_list_tools(self, request_id: str) -> Dict[str, Any]:
        """Handle tools/list request"""
        tools = [tool.to_dict() for tool in self.tools.values()]
        
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {"tools": tools}
        }
    
    async def _handle_call_tool(self, params: Dict[str, Any], request_id: str) -> Dict[str, Any]:
        """Handle tools/call request"""
        tool_name = params.get("name", "")
        arguments = params.get("arguments", {})
        
        if tool_name not in self.tools:
            return self._error_response(request_id, -32602, f"Tool not found: {tool_name}")
        
        tool = self.tools[tool_name]
        
        if tool.handler:
            try:
                result = await tool.handler(arguments)
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(result) if isinstance(result, (dict, list)) else str(result)
                            }
                        ]
                    }
                }
            except Exception as e:
                return self._error_response(request_id, -32603, f"Tool execution error: {str(e)}")
        else:
            return self._error_response(request_id, -32603, f"Tool handler not implemented: {tool_name}")
    
    async def _handle_list_resources(self, request_id: str) -> Dict[str, Any]:
        """Handle resources/list request"""
        resources = [resource.to_dict() for resource in self.resources.values()]
        
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {"resources": resources}
        }
    
    async def _handle_read_resource(self, params: Dict[str, Any], request_id: str) -> Dict[str, Any]:
        """Handle resources/read request"""
        uri = params.get("uri", "")
        
        if uri not in self.resources:
            return self._error_response(request_id, -32602, f"Resource not found: {uri}")
        
        resource = self.resources[uri]
        
        if resource.handler:
            try:
                content = await resource.handler()
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "contents": [
                            {
                                "uri": uri,
                                "mimeType": resource.mime_type,
                                "text": json.dumps(content) if isinstance(content, (dict, list)) else str(content)
                            }
                        ]
                    }
                }
            except Exception as e:
                return self._error_response(request_id, -32603, f"Resource read error: {str(e)}")
        else:
            return self._error_response(request_id, -32603, f"Resource handler not implemented: {uri}")
    
    async def _handle_list_prompts(self, request_id: str) -> Dict[str, Any]:
        """Handle prompts/list request"""
        prompts = [prompt.to_dict() for prompt in self.prompts.values()]
        
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {"prompts": prompts}
        }
    
    async def _handle_get_prompt(self, params: Dict[str, Any], request_id: str) -> Dict[str, Any]:
        """Handle prompts/get request"""
        prompt_name = params.get("name", "")
        arguments = params.get("arguments", {})
        
        if prompt_name not in self.prompts:
            return self._error_response(request_id, -32602, f"Prompt not found: {prompt_name}")
        
        prompt = self.prompts[prompt_name]
        
        if prompt.handler:
            try:
                messages = await prompt.handler(arguments)
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "description": prompt.description,
                        "messages": messages
                    }
                }
            except Exception as e:
                return self._error_response(request_id, -32603, f"Prompt generation error: {str(e)}")
        else:
            return self._error_response(request_id, -32603, f"Prompt handler not implemented: {prompt_name}")
    
    def _error_response(self, request_id: str, code: int, message: str) -> Dict[str, Any]:
        """Generate error response"""
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {
                "code": code,
                "message": message
            }
        }
    
    def get_server_info(self) -> Dict[str, Any]:
        """Get server information"""
        return {
            "name": self.name,
            "version": self.version,
            "tools_count": len(self.tools),
            "resources_count": len(self.resources),
            "prompts_count": len(self.prompts),
            "sessions_count": len(self.sessions),
            "requests_count": len(self.request_history)
        }