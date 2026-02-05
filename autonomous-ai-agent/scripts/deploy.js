const hre = require("hardhat");

async function main() {
    console.log("Deploying AgentLogger contract...");
    console.log("Network:", hre.network.name);

    const AgentLogger = await hre.ethers.getContractFactory("AgentLogger");
    const agentLogger = await AgentLogger.deploy();

    await agentLogger.waitForDeployment();

    const contractAddress = await agentLogger.getAddress();

    console.log("");
    console.log("✅ AgentLogger deployed successfully!");
    console.log("📋 Contract Address:", contractAddress);
    console.log("");
    console.log("Next steps:");
    console.log("1. Copy the contract address above");
    console.log("2. Update CONTRACT_ADDRESS in your .env file");
    console.log("3. Restart your backend server");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
