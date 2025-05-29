from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from neo4j import GraphDatabase
import logging
import traceback
import sys
import json

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Neo4j connection
NEO4J_URI = os.getenv("NEO4J_URI", "")
NEO4J_USER = os.getenv("NEO4J_USER", "")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

logger.info(f"Neo4j connection details: URI={NEO4J_URI}, USER={NEO4J_USER}")

class PathRequest(BaseModel):
    jobId: str
    userSkills: Optional[List[str]] = []

class Neo4jDriver:
    def __init__(self):
        self._driver = None

    def get_driver(self):
        if self._driver is None:
            try:
                logger.info(f"Initializing Neo4j driver with URI: {NEO4J_URI}")
                self._driver = GraphDatabase.driver(
                    NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)
                )
                # Test the connection
                with self._driver.session() as session:
                    result = session.run("RETURN 1 as test")
                    record = result.single()
                    assert record["test"] == 1
                logger.info(f"Successfully connected to Neo4j at {NEO4J_URI}")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j: {e}")
                logger.error(traceback.format_exc())
                raise
        return self._driver

    def close(self):
        if self._driver is not None:
            self._driver.close()
            self._driver = None

neo4j_driver = Neo4jDriver()

# Custom exception handlers to ensure JSON responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"status": "error", "message": "Invalid request data", "detail": str(exc)},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error", "detail": str(exc)},
    )


# Modified get_job_skills function to fix the skill type assignment issue

def get_job_skills(job_id):
    """Get all skills required for a specific job from Neo4j, including related concept nodes"""
    try:
        driver = neo4j_driver.get_driver()
        with driver.session() as session:
            # First, get all skills directly associated with the job
            direct_skills_query = """
            MATCH (j:Job {id: $jobId})-[:REQUIRES]->(s)
            RETURN s.id as id, s.name as name, s.definition as definition, 
                labels(s) as labels
            """
            logger.info(f"Executing query for job skills: {direct_skills_query} with jobId={job_id}")
            result = session.run(direct_skills_query, jobId=job_id)
            
            skills = []
            skill_ids = set()  # Track skill IDs to avoid duplicates
            
            for record in result:
                labels = record["labels"]
                
                # FIXED: Preserve the original node label rather than using precedence logic
                # This ensures HardSkill nodes are correctly identified
                if "HardSkill" in labels:
                    skill_type = "HardSkill"
                elif "Technology" in labels:
                    skill_type = "Technology"
                elif "SoftSkill" in labels:
                    skill_type = "SoftSkill"
                elif "Concept" in labels:
                    skill_type = "Concept"
                else:
                    # Default case
                    skill_type = "HardSkill"
                
                # Log the labels and assigned type for debugging
                logger.info(f"Node labels: {labels}, Assigned type: {skill_type}")
                
                skill_id = record["id"]
                skills.append({
                    "id": skill_id,
                    "name": record["name"],
                    "definition": record["definition"],
                    "type": skill_type
                })
                skill_ids.add(skill_id)
            
            logger.info(f"Found {len(skills)} direct skills for job {job_id}")
            
            # Rest of the function remains the same...
            # If no direct skills found, try to find any skills related to the job
            if not skills:
                broader_query = """
                MATCH (j:Job {id: $jobId})
                OPTIONAL MATCH (j)-[:HAS_DESCRIPTION]->(:Description)-[:MENTIONS]->(s)
                WHERE s:HardSkill OR s:Technology OR s:SoftSkill OR s:Concept
                RETURN DISTINCT s.id as id, s.name as name, s.definition as definition, 
                    labels(s) as labels
                """
                logger.info(f"No direct skills found, trying broader query: {broader_query}")
                broader_result = session.run(broader_query, jobId=job_id)
                
                for record in broader_result:
                    if not record["id"]:
                        continue
                        
                    labels = record["labels"]
                    # Use the same corrected type assignment logic here
                    if "HardSkill" in labels:
                        skill_type = "HardSkill"
                    elif "Technology" in labels:
                        skill_type = "Technology"
                    elif "SoftSkill" in labels:
                        skill_type = "SoftSkill"
                    elif "Concept" in labels:
                        skill_type = "Concept"
                    else:
                        skill_type = "HardSkill"
                    
                    skill_id = record["id"]
                    if skill_id not in skill_ids:
                        skills.append({
                            "id": skill_id,
                            "name": record["name"],
                            "definition": record["definition"],
                            "type": skill_type
                        })
                        skill_ids.add(skill_id)
                
                logger.info(f"Found {len(skills)} skills through broader search")
            
            # Add additional debugging log to see the final distribution of skill types
            type_counts = {}
            for skill in skills:
                stype = skill["type"]
                type_counts[stype] = type_counts.get(stype, 0) + 1
            
            logger.info(f"Skill type distribution: {type_counts}")
            
            return skills
    except Exception as e:
        logger.error(f"Error getting job skills: {e}")
        logger.error(traceback.format_exc())
        return []

def get_all_graph_data():
    """Fetch all nodes and relationships from Neo4j for DP calculation"""
    try:
        driver = neo4j_driver.get_driver()
        with driver.session() as session:
            # Get all nodes with relevant labels
            nodes_query = """
            MATCH (n)
            WHERE n:Concept OR n:HardSkill OR n:Technology OR n:SoftSkill OR n:Job
            RETURN n.id as id, n.name as name, labels(n) as labels
            """
            nodes_result = session.run(nodes_query)
            nodes = {}
            label_of = {}
            
            for record in nodes_result:
                node_id = record["id"]
                nodes[node_id] = {
                    "id": node_id,
                    "name": record["name"],
                    "labels": set(record["labels"])
                }
                label_of[node_id] = set(record["labels"])
            
            # Get all REQUIRES relationships
            # (n1)-[:REQUIRES]->(n2) means n1 requires n2 (n2 is prerequisite for n1)
            edges_query = """
            MATCH (n1)-[r:REQUIRES]->(n2)
            RETURN n1.id as source, n2.id as target, 
                   r.score as score, r.predicted as predicted
            """
            edges_result = session.run(edges_query)
            edges = []
            
            for record in edges_result:
                edges.append({
                    "source": record["source"],  # The skill that requires something
                    "target": record["target"],  # The prerequisite
                    "score": record["score"] or 0.5,
                    "predicted": record["predicted"] if record["predicted"] is not None else False
                })
            
            logger.info(f"Found {len(nodes)} nodes and {len(edges)} edges")
            return nodes, label_of, edges
    except Exception as e:
        logger.error(f"Error fetching graph data: {e}")
        raise

def build_dp_paths(nodes, label_of, edges):
    """Build learning paths using Dynamic Programming according to original algorithm"""
    import networkx as nx
    import math
    
    logger.info(f"Starting DP path calculation with {len(nodes)} nodes and {len(edges)} edges")
    
    # Constants from the original Python algorithm
    Δ, α, β, PRED = 0.3, 0.9, 0.1, 0.7  # scoring constants
    MAX_PATH_LENGTH = 15                # maximum reasonable path length
    LENGTH_PENALTY = 0.03               # penalty for longer paths
    
    # Create a directed graph where edges go from prerequisite to skill
    G = nx.DiGraph()
    
    # Add all nodes
    for node_id in nodes:
        G.add_node(node_id)
    
    logger.info(f"Added {len(nodes)} nodes to graph")
    
    # Calculate the maximum score for normalization
    scores = [float(edge.get("score", 0.5)) for edge in edges if edge.get("score") is not None]
    Smax = max(scores) if scores else 1.0
    logger.info(f"Max score for normalization: {Smax}")
    
    # Add edges - IMPORTANT: In the original algorithm, edges go from prerequisite to skill
    # In Neo4j: (A)-[:REQUIRES]->(B) means A requires B as prerequisite
    # So we need to add edges from B -> A for the DP algorithm
    edge_count = 0
    for edge in edges:
        source_id = edge["source"]  # Skill that requires prerequisite
        target_id = edge["target"]  # Prerequisite
        
        if source_id in nodes and target_id in nodes:
            # Add edge from prerequisite (target) to dependent skill (source)
            G.add_edge(target_id, source_id, 
                      cost=float(edge.get("score", 0.5)),
                      raw=float(edge.get("score", 0.5)),
                      predicted=edge.get("predicted", False))
            edge_count += 1
    
    logger.info(f"Added {edge_count} edges to graph")
    
    # Check for cycles
    try:
        cycles = list(nx.simple_cycles(G))
        if cycles:
            logger.warning(f"Found {len(cycles)} cycles in the graph, removing them")
            # Remove edges to break cycles
            for cycle in cycles:
                if len(cycle) > 1:
                    G.remove_edge(cycle[0], cycle[1])
                    logger.info(f"Removed edge from {cycle[0]} to {cycle[1]} to break cycle")
    except Exception as e:
        logger.warning(f"Error checking for cycles: {e}")
    
    # DP tables for path calculation
    dp = {n: -math.inf for n in G}
    prev = {}
    path_lens = {n: 0 for n in G}
    
    # Initialize sources (nodes with no prerequisites)
    source_count = 0
    for n in G:
        if G.in_degree(n) == 0:
            # Check if it's a concept or hard skill (not a technology)
            node_labels = label_of.get(n, ())
            if "Concept" in node_labels or "HardSkill" in node_labels:
                dp[n] = 0.0
                path_lens[n] = 1
                source_count += 1
    
    logger.info(f"Initialized {source_count} source nodes with no prerequisites")
    
    # If no source nodes, initialize all concept nodes
    if source_count == 0:
        logger.warning("No valid source nodes found. Initializing all concept nodes.")
        for n in G:
            node_labels = label_of.get(n, ())
            if "Concept" in node_labels:
                dp[n] = 0.0
                path_lens[n] = 1
                source_count += 1
        
        logger.info(f"Initialized {source_count} concept nodes as sources")
    
    # If still no sources, initialize some nodes arbitrarily
    if source_count == 0:
        logger.warning("No valid concept nodes found. Initializing nodes arbitrarily.")
        # Find nodes with lowest in-degree
        in_degrees = [(n, G.in_degree(n)) for n in G.nodes()]
        in_degrees.sort(key=lambda x: x[1])
        
        # Initialize some nodes with lowest in-degree
        for n, _ in in_degrees[:10]:  # Initialize up to 10 nodes
            dp[n] = 0.0
            path_lens[n] = 1
            source_count += 1
        
        logger.info(f"Initialized {source_count} arbitrary nodes as sources")
    
    # Check if the graph is a DAG
    is_dag = nx.is_directed_acyclic_graph(G)
    logger.info(f"Graph is a DAG: {is_dag}")
    
    if is_dag:
        # Run DP in topological order for DAG
        try:
            # Process nodes in topological order
            for u in nx.topological_sort(G):
                if dp[u] < -1e8:  # Skip nodes we haven't reached yet
                    continue
                    
                for _, v, d in G.out_edges(u, data=True):
                    # Calculate gain as per the original algorithm
                    cost = d.get("cost", 0.5)
                    s_norm = cost / Smax if Smax else 0.5
                    sem_pen = 0.5  # Default semantic penalty
                    
                    # Length penalty to discourage very long paths
                    length_factor = LENGTH_PENALTY * path_lens[u]
                    
                    # Calculate gain as in the original algorithm
                    gain = Δ - α * s_norm - β * sem_pen - length_factor
                    cand = dp[u] + gain
                    
                    new_path_len = path_lens[u] + 1
                    
                    # Only update if better path and reasonable length
                    if new_path_len <= MAX_PATH_LENGTH and cand > dp[v]:
                        dp[v] = cand
                        prev[v] = u
                        path_lens[v] = new_path_len
            
            logger.info(f"DP completed successfully. Nodes with valid paths: {sum(1 for v in dp.values() if v > -math.inf)}")
            
        except Exception as e:
            logger.error(f"Error running DP in topological order: {e}")
            logger.error(traceback.format_exc())
            # Fall back to simpler algorithm
            is_dag = False
    
    if not is_dag:
        logger.warning("Using Bellman-Ford-like algorithm for path finding.")
        # Simpler algorithm for potential cyclic graphs
        changed = True
        iterations = 0
        
        while changed and iterations < len(G):
            changed = False
            iterations += 1
            
            for u in G.nodes():
                if dp[u] < -1e8:
                    continue
                    
                for _, v, d in G.out_edges(u, data=True):
                    cost = d.get("cost", 0.5)
                    s_norm = cost / Smax if Smax else 0.5
                    sem_pen = 0.5
                    length_factor = LENGTH_PENALTY * path_lens[u]
                    
                    gain = Δ - α * s_norm - β * sem_pen - length_factor
                    cand = dp[u] + gain
                    
                    new_path_len = path_lens[u] + 1
                    
                    if new_path_len <= MAX_PATH_LENGTH and cand > dp[v]:
                        dp[v] = cand
                        prev[v] = u
                        path_lens[v] = new_path_len
                        changed = True
    
    # Check paths counts
    paths_found = 0
    for v in G.nodes():
        if dp[v] > -1e8 and v in prev:
            paths_found += 1
    
    logger.info(f"DP calculation complete. Found {paths_found} paths in total.")
    
    return prev

def build_path_for_skill(skill_id, prev, nodes):
    """Build and log the learning path for a specific skill using the DP results"""
    if skill_id not in prev:
        logger.info(f"No path found for skill: {nodes[skill_id]['name'] if skill_id in nodes else skill_id}")
        return None
        
    path = []
    current = skill_id
    
    # Build the path from skill back to its prerequisites
    path.append(current)
    
    # Safety counter to prevent infinite loops
    safety_counter = 0
    max_iterations = len(nodes) * 2
    
    while current in prev and safety_counter < max_iterations:
        current = prev[current]
        path.append(current)
        safety_counter += 1
        
    if safety_counter >= max_iterations:
        logger.warning(f"Possible cycle detected in path for skill {skill_id}")
    
    # Reverse to get prerequisites -> skill order
    reversed_path = list(reversed(path))
    
    # Log the path
    skill_name = nodes[skill_id]["name"] if skill_id in nodes else skill_id
    path_names = [nodes[p]["name"] if p in nodes else p for p in reversed_path]
    logger.info(f"Built path for {skill_name}: {' -> '.join(path_names)}")
    
    return reversed_path

@app.post("/generate-path")
async def generate_path(request: PathRequest):
    try:
        job_id = request.jobId
        user_skills = request.userSkills or []
        
        logger.info(f"Generating path for job {job_id} with user skills: {user_skills}")
        
        # Get skills for the job
        skills = get_job_skills(job_id)
        
        if not skills:
            logger.warning(f"No skills found for job {job_id}")
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error", 
                    "message": f"No skills found for job {job_id}"
                }
            )
        
        logger.info(f"Found {len(skills)} skills for job {job_id}")
        
        # Create a skill map for easy lookup
        skill_map = {skill["id"]: skill for skill in skills}
        
        # Filter out skills the user already has
        if user_skills:
            skills = [s for s in skills if s["id"] not in user_skills]
        
        # Get all graph data for DP calculation
        nodes, label_of, edges = get_all_graph_data()
        logger.info(f"Fetched graph data: {len(nodes)} nodes, {len(edges)} edges")
        
        # Define name_of function here, inside this scope
        def name_of(node_id):
            """Get a human-readable name for a node"""
            if node_id in nodes and "name" in nodes[node_id]:
                return nodes[node_id]["name"]
            if str(node_id) in skill_map:
                return skill_map[str(node_id)]["name"]
            return str(node_id)
        
        # Run DP to find optimal paths
        prev = build_dp_paths(nodes, label_of, edges)
        
        # Build paths for each skill
        skill_paths = {}
        prerequisites = []
        
        # Find end skills to build paths for (HardSkill or Technology, not Concept)
        end_skills = [skill for skill in skills 
                    if skill["type"] in ["HardSkill", "Technology", "SoftSkill"]]
        
        logger.info(f"Building paths for {len(end_skills)} end skills")
        
        for skill in end_skills:
            skill_id = skill["id"]
            
            # Build a path using DP result
            path = []
            current = skill_id
            
            # Only start if this skill has a path in the DP results
            if current in prev:
                # Build the path from skill to prerequisites
                path.append(current)
                
                # Safety counter to prevent infinite loops
                safety = 0
                max_iter = len(nodes) * 2
                
                while current in prev and safety < max_iter:
                    current = prev[current]
                    path.append(current)
                    safety += 1
                
                # Reverse to get prerequisites → skill
                path.reverse()
                
                # Only save paths with at least one prerequisite
                if len(path) > 1:
                    skill_paths[skill_id] = path
                    path_names = []
                    for n in path:
                        if n in nodes:
                            path_names.append(name_of(n))
                    logger.info(f"Path for {skill['name']}: {' -> '.join(path_names)}")
                    
                    # Create edges based on path for visualization
                    for i in range(len(path) - 1):
                        source = path[i]
                        target = path[i + 1]
                        
                        # Find if this relationship exists and if it's predicted
                        edge_data = next((e for e in edges 
                                          if e["source"] == target and e["target"] == source), None)
                        
                        is_predicted = False
                        score = 0.7
                        
                        if edge_data:
                            is_predicted = edge_data.get("predicted", False)
                            score = edge_data.get("score", 0.7)
                        
                        # Add to prerequisites list for visualization
                        prerequisites.append({
                            "source": target,  # In Neo4j format: target requires source
                            "target": source,
                            "type": "REQUIRES",
                            "predicted": is_predicted,
                            "score": score
                        })
                else:
                    logger.info(f"No path found for {skill['name']}")
        
        # If no paths found, try to create basic connections
        if not skill_paths:
            logger.warning("No skill paths found with DP, falling back to simple connections")
            # Try to link required skills to relevant concepts
            concept_skills = [s for s in skills if s["type"] == "Concept"]
            
            if concept_skills and end_skills:
                logger.info(f"Creating simple paths with {len(concept_skills)} concepts and {len(end_skills)} skills")
                
                # For each end skill, connect to a concept
                for i, skill in enumerate(end_skills):
                    skill_id = skill["id"]
                    
                    # Choose a concept (cycle through available ones if multiple skills)
                    concept_idx = i % len(concept_skills)
                    concept = concept_skills[concept_idx]
                    
                    # Create a simple path
                    path = [concept["id"], skill_id]
                    skill_paths[skill_id] = path
                    
                    # Add an edge
                    prerequisites.append({
                        "source": skill_id,
                        "target": concept["id"],
                        "type": "REQUIRES",
                        "predicted": True,
                        "score": 0.7
                    })
                    
                    logger.info(f"Created simple path for {skill['name']}: {concept['name']} -> {skill['name']}")
        
        # Ensure we have unique prerequisites
        unique_prereqs = []
        seen_edges = set()
        
        for prereq in prerequisites:
            edge_key = (prereq["source"], prereq["target"])
            if edge_key not in seen_edges:
                seen_edges.add(edge_key)
                unique_prereqs.append(prereq)
        
        logger.info(f"Final result: {len(skills)} skills, {len(unique_prereqs)} prerequisites, {len(skill_paths)} paths")
        
        # Log all paths for debugging
        for skill_id, path in skill_paths.items():
            skill_name = skill_map.get(skill_id, {}).get("name", skill_id)
            path_str = " -> ".join(name_of(n) for n in path)
            logger.info(f"Final path for {skill_name}: {path_str}")
        
        all_node_ids = {s["id"] for s in skills}
        for path in skill_paths.values():
            all_node_ids.update(path)

        all_nodes = []
        for nid in all_node_ids:
            if nid in nodes:                                   # from get_all_graph_data()
                labels = nodes[nid]["labels"]
                ntype = (
                "Technology" if "Technology" in labels else
                "SoftSkill"  if "SoftSkill"  in labels else
                "Concept"    if "Concept"    in labels else
                "HardSkill"
                )

                existing = next((s for s in skills if s["id"] == nid), None)
                all_nodes.append({
                "id": nid,
                "name": nodes[nid]["name"],
                "definition": existing["definition"] if existing else "",
                "type": ntype
                })

# ─── Return a richer payload — rename key to learningPaths for clarity ────
        response = {
        "jobId": job_id,
        "skills": all_nodes,                 # ← every node you need to render
        "prerequisites": unique_prereqs,
        "learningPaths": skill_paths        # ← renamed (was “skillPaths”)
        }
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Error generating path: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to generate path: {str(e)}"}
        )
        
def create_simple_skill_relationships(skills):
    """Fallback: Create simple relationships between skills"""
    prerequisites = []
    
    # Group by type
    skill_by_type = {}
    for skill in skills:
        skill_type = skill["type"]
        if skill_type not in skill_by_type:
            skill_by_type[skill_type] = []
        skill_by_type[skill_type].append(skill)
    
    # Sort skills alphabetically within each type for more predictable ordering
    for skill_type in skill_by_type:
        skill_by_type[skill_type].sort(key=lambda s: s["name"])
    
    # Create simple chains within each type
    for skill_type, type_skills in skill_by_type.items():
        for i in range(len(type_skills) - 1):
            prerequisites.append({
                "source": type_skills[i + 1]["id"],  # The more advanced skill
                "target": type_skills[i]["id"],      # The prerequisite skill
                "type": "REQUIRES",
                "predicted": True,
                "score": 0.5
            })
    
    # Create connections between types (e.g., concepts → hard skills → technologies)
    type_order = ["Concept", "HardSkill", "Technology", "SoftSkill"]
    
    prev_type = None
    for skill_type in type_order:
        if skill_type in skill_by_type and len(skill_by_type[skill_type]) > 0:
            if prev_type and prev_type in skill_by_type and len(skill_by_type[prev_type]) > 0:
                # Connect the last skill of previous type to first skill of current type
                prerequisites.append({
                    "source": skill_by_type[skill_type][0]["id"],     # First skill of current type
                    "target": skill_by_type[prev_type][-1]["id"],     # Last skill of previous type
                    "type": "REQUIRES",
                    "predicted": True,
                    "score": 0.5
                })
            prev_type = skill_type
    
    logger.info(f"Created {len(prerequisites)} simple skill relationships")
    return prerequisites

@app.post("/generate-path")
async def generate_path(request: PathRequest):
    try:
        job_id = request.jobId
        user_skills = request.userSkills or []
        
        logger.info(f"Generating path for job {job_id} with user skills: {user_skills}")
        
        # Get skills from Neo4j, including concept nodes
        skills = get_job_skills(job_id)
        
        # If no skills found, return a clear error
        if not skills:
            logger.warning(f"No skills found for job {job_id}")
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error", 
                    "message": f"No skills found for job {job_id}"
                }
            )
        
        # Filter out skills the user already has
        if user_skills:
            skills = [s for s in skills if s["id"] not in user_skills]
        
        # Get all graph data for DP calculation
        nodes, label_of, edges = get_all_graph_data()
        
        # Log the data we'll use for DP calculation
        logger.info(f"Using {len(nodes)} nodes and {len(edges)} edges for DP calculation")
        
        # Run DP to find optimal paths
        prev = build_dp_paths(nodes, label_of, edges)
        
        # Create skill_paths map for the response
        skill_paths = {}
        prerequisites = []
        
        # Identify job-required skills (skills directly associated with the job)
        job_skill_ids = [skill["id"] for skill in skills]
        
        # For each skill in our job, get its learning path
        for skill in skills:
            skill_id = skill["id"]
            
            # Build the learning path for this skill if it has prerequisites
            if skill_id in prev:
                path = build_path_for_skill(skill_id, prev, nodes)
                
                if len(path) > 1:
                    # Store the path
                    skill_paths[skill_id] = path
                    
                    # Create edges along the path
                    for i in range(len(path) - 1):
                        source = path[i]
                        target = path[i + 1]
                        
                        # Find if this is a predicted relationship
                        edge_data = next((e for e in edges if e["source"] == target and e["target"] == source), None)
                        is_predicted = edge_data["predicted"] if edge_data and "predicted" in edge_data else True
                        score = edge_data["score"] if edge_data and "score" in edge_data else 0.7
                        
                        prerequisites.append({
                            "source": target,
                            "target": source,
                            "type": "REQUIRES",
                            "predicted": is_predicted,
                            "score": score
                        })
                else:
                    logger.info(f"No prerequisites found for {skill['name']}")
            else:
                logger.info(f"No path found for {skill['name']}")
        
        # If no paths found, create simple relationships
        if not prerequisites:
            logger.warning("No paths found using DP, falling back to simple relationships")
            prerequisites = create_simple_skill_relationships(skills)
        
        # Remove duplicate edges
        unique_prerequisites = []
        seen = set()
        for prereq in prerequisites:
            key = (prereq["source"], prereq["target"])
            if key not in seen:
                seen.add(key)
                unique_prerequisites.append(prereq)
        
        logger.info(f"Generated path with {len(skills)} skills, {len(unique_prerequisites)} prerequisites and {len(skill_paths)} skill paths")
        
        # Log each skill path for debugging
        for skill_id, path in skill_paths.items():
            skill_name = next((s["name"] for s in skills if s["id"] == skill_id), skill_id)
            path_names = []
            for p in path:
                node_data = next((s for s in skills if s["id"] == p), None)
                if node_data:
                    path_names.append(f"{node_data['name']} ({node_data['type']})")
                else:
                    path_names.append(p)
            logger.info(f"Skill path for {skill_name}: {' -> '.join(path_names)}")
        
        response = {
            "jobId": job_id,
            "skills": skills,
            "prerequisites": unique_prerequisites,
            "skillPaths": skill_paths
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"Error generating path: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to generate path: {str(e)}"}
        )
def get_all_skills():
    """Get all skills from Neo4j"""
    try:
        driver = neo4j_driver.get_driver()
        with driver.session() as session:
            query = """
            MATCH (s)
            WHERE s:HardSkill OR s:SoftSkill OR s:Technology OR s:Concept
            RETURN s.id as id, s.name as name, s.definition as definition, 
                labels(s) as labels
            """
            result = session.run(query)
            skills = []
            for record in result:
                labels = record["labels"]
                skill_type = "HardSkill"
                if "Technology" in labels:
                    skill_type = "Technology"
                elif "SoftSkill" in labels:
                    skill_type = "SoftSkill"
                elif "Concept" in labels:
                    skill_type = "Concept"
                
                skills.append({
                    "id": record["id"],
                    "name": record["name"],
                    "definition": record["definition"],
                    "type": skill_type
                })
            return skills
    except Exception as e:
        logger.error(f"Error getting all skills: {e}")
        logger.error(traceback.format_exc())
        return []

def get_existing_prerequisites(skills):
    """Get existing prerequisite relationships between the given skills"""
    try:
        # Extract all skill IDs
        skill_ids = [skill["id"] for skill in skills]
        
        driver = neo4j_driver.get_driver()
        with driver.session() as session:
            # Find existing REQUIRES relationships between our skills
            query = """
            MATCH (s1)-[r:REQUIRES]->(s2)
            WHERE s1.id IN $skillIds AND s2.id IN $skillIds
            RETURN s1.id as source, s2.id as target, 
                   r.score as score, r.predicted as predicted
            """
            result = session.run(query, skillIds=skill_ids)
            prerequisites = []
            
            for record in result:
                prerequisites.append({
                    "source": record["source"],
                    "target": record["target"],
                    "type": "REQUIRES",
                    "predicted": record["predicted"] if record["predicted"] is not None else False,
                    "score": record["score"] if record["score"] is not None else 0.5
                })
            
            logger.info(f"Found {len(prerequisites)} existing prerequisite relationships between skills")
            
            # If we don't have enough relationships, look for skill to concept relationships
            if len(prerequisites) < len(skills) / 2:
                # Find any skill that requires a concept
                concept_query = """
                MATCH (s)-[r:REQUIRES]->(c:Concept)
                WHERE s.id IN $skillIds AND c.id IN $skillIds
                RETURN s.id as source, c.id as target, 
                       r.score as score, r.predicted as predicted
                """
                
                concept_result = session.run(concept_query, skillIds=skill_ids)
                
                for record in concept_result:
                    # Add to prerequisites if not already there
                    new_prereq = {
                        "source": record["source"],
                        "target": record["target"],
                        "type": "REQUIRES",
                        "predicted": record["predicted"] if record["predicted"] is not None else False,
                        "score": record["score"] if record["score"] is not None else 0.7
                    }
                    
                    # Check if we already have this relationship
                    if not any(p["source"] == new_prereq["source"] and 
                               p["target"] == new_prereq["target"] for p in prerequisites):
                        prerequisites.append(new_prereq)
            
            logger.info(f"Total prerequisites after adding concept relationships: {len(prerequisites)}")
            return prerequisites
    except Exception as e:
        logger.error(f"Error getting existing prerequisites: {e}")
        logger.error(traceback.format_exc())
        return []

@app.get("/health")
async def health_check():
    try:
        # Test Neo4j connection
        driver = neo4j_driver.get_driver()
        connection_info = {
            "uri": NEO4J_URI,
            "user": NEO4J_USER,
            "password_set": bool(NEO4J_PASSWORD)
        }
        
        # Basic connection test
        with driver.session() as session:
            result = session.run("RETURN 1 as n")
            record = result.single()
            assert record["n"] == 1
        
        # Get database stats
        with driver.session() as session:
            stats_result = session.run("""
                MATCH (n)
                RETURN 
                    count(n) as nodeCount,
                    count(DISTINCT labels(n)) as labelCount
            """)
            stats_record = stats_result.single()
            db_stats = {
                "nodeCount": stats_record["nodeCount"],
                "labelCount": stats_record["labelCount"]
            }
        
        # Check for jobs
        with driver.session() as session:
            jobs_result = session.run("MATCH (j:Job) RETURN j.id as id LIMIT 5")
            jobs = [record["id"] for record in jobs_result]
        
        # Check for relationships
        with driver.session() as session:
            rel_result = session.run("""
                MATCH ()-[r]->() 
                RETURN type(r) as type, count(r) as count
            """)
            relationships = {record["type"]: record["count"] for record in rel_result}
        
        response = {
            "status": "healthy",
            "neo4j_connection": "ok",
            "database_stats": db_stats,
            "jobs_found": len(jobs),
            "sample_jobs": jobs,
            "relationships": relationships,
            "connection_info": connection_info
        }
        
        # Verify the response is JSON serializable
        try:
            json.dumps(response)
        except Exception as e:
            logger.error(f"Health response is not JSON serializable: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": "Failed to generate JSON response",
                    "error": str(e)
                }
            )
            
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        logger.error(traceback.format_exc())
        # Return a proper JSON error response
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy", 
                "error": str(e),
                "connection_info": {
                    "uri": NEO4J_URI,
                    "user": NEO4J_USER,
                    "password_set": bool(NEO4J_PASSWORD)
                }
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
