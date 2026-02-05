// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentLogger
 * @dev Smart contract for logging autonomous AI agent actions on-chain
 */
contract AgentLogger {
    // Owner of the contract
    address public owner;
    
    // Mapping from agent address to whether they are authorized
    mapping(address => bool) public authorizedAgents;
    
    // Counter for total actions logged
    uint256 public totalActionsLogged;

    // Structure to store an agent action
    struct AgentAction {
        address agent;
        string actionHash; // Hash of the action (not full data to save gas)
        uint256 cost;
        uint256 timestamp;
    }

    // Array of all actions (for enumeration)
    AgentAction[] public actions;
    
    // Mapping from agent to their actions (indices in the actions array)
    mapping(address => uint256[]) public agentActions;

    // Events
    event ActionLogged(
        address indexed agent,
        string actionHash,
        uint256 cost,
        uint256 timestamp,
        uint256 indexed actionIndex
    );
    
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedAgents[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Log an action for an agent
     * @param actionHash Hash of the action description
     * @param cost Cost of the action in wei
     */
    function logAction(
        string memory actionHash,
        uint256 cost
    ) external onlyAuthorized {
        uint256 actionIndex = actions.length;
        
        AgentAction memory newAction = AgentAction({
            agent: msg.sender,
            actionHash: actionHash,
            cost: cost,
            timestamp: block.timestamp
        });
        
        actions.push(newAction);
        agentActions[msg.sender].push(actionIndex);
        totalActionsLogged++;
        
        emit ActionLogged(
            msg.sender,
            actionHash,
            cost,
            block.timestamp,
            actionIndex
        );
    }

    /**
     * @dev Authorize an agent to log actions
     * @param agent Address of the agent to authorize
     */
    function authorizeAgent(address agent) external onlyOwner {
        require(agent != address(0), "Invalid agent address");
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    /**
     * @dev Revoke an agent's authorization
     * @param agent Address of the agent to revoke
     */
    function revokeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent);
    }

    /**
     * @dev Get the number of actions for a specific agent
     * @param agent Address of the agent
     * @return Number of actions logged by the agent
     */
    function getAgentActionCount(address agent) external view returns (uint256) {
        return agentActions[agent].length;
    }

    /**
     * @dev Get action details by index
     * @param index Index of the action
     * @return agent Address of the agent
     * @return actionHash Hash of the action
     * @return cost Cost of the action
     * @return timestamp Timestamp of the action
     */
    function getAction(uint256 index) external view returns (
        address agent,
        string memory actionHash,
        uint256 cost,
        uint256 timestamp
    ) {
        require(index < actions.length, "Action index out of bounds");
        AgentAction memory action = actions[index];
        return (action.agent, action.actionHash, action.cost, action.timestamp);
    }

    /**
     * @dev Get all action indices for an agent
     * @param agent Address of the agent
     * @return Array of action indices
     */
    function getAgentActionIndices(address agent) external view returns (uint256[] memory) {
        return agentActions[agent];
    }

    /**
     * @dev Transfer ownership of the contract
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
