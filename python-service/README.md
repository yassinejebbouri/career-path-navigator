# Python Path Generation Service

This service provides path generation functionality using Neo4j data and node embeddings.

## Setup

1. Place your `node-embeddings.pt` file in the `models` directory
2. Install dependencies: `pip install -r requirements.txt`
3. Run the service: `python main.py`

## Environment Variables

- `NEO4J_URI`: URI for Neo4j connection (default: neo4j://localhost:7687)
- `NEO4J_USER`: Neo4j username (default: neo4j)
- `NEO4J_PASSWORD`: Neo4j password (default: password)
- `MODEL_PATH`: Path to node embeddings model (default: ./models/node-embeddings.pt)
\`\`\`

```plaintext file="python-service/requirements.txt" type="code"
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
neo4j==5.15.0
torch==2.1.1
numpy==1.26.1
