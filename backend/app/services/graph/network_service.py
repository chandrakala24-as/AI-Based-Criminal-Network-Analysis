from typing import List, Dict, Any, Optional
import networkx as nx
from sqlalchemy.orm import Session
from app.models.entity import Person, Phone, Vehicle, Location, Organization
from app.models.relationship import Relationship
from app.models.case import Case

class NetworkGraphService:
    def __init__(self, db: Session):
        self.db = db

    def build_network_graph(
        self,
        case_id: Optional[int] = None,
        entity_type_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        G = nx.Graph()

        # Query relationships
        rel_query = self.db.query(Relationship)
        if case_id:
            rel_query = rel_query.filter(Relationship.case_id == case_id)
        
        relationships = rel_query.all()

        nodes_dict = {}
        edges_list = []

        for rel in relationships:
            src_type = rel.source_entity_type
            src_id = rel.source_entity_id
            tgt_type = rel.target_entity_type
            tgt_id = rel.target_entity_id

            if entity_type_filter:
                if src_type not in entity_type_filter or tgt_type not in entity_type_filter:
                    continue

            src_node_key = f"{src_type}:{src_id}"
            tgt_node_key = f"{tgt_type}:{tgt_id}"

            if src_node_key not in nodes_dict:
                nodes_dict[src_node_key] = {
                    "id": src_node_key,
                    "label": src_id,
                    "type": src_type,
                    "details": {"code": src_id, "entity_type": src_type}
                }

            if tgt_node_key not in nodes_dict:
                nodes_dict[tgt_node_key] = {
                    "id": tgt_node_key,
                    "label": tgt_id,
                    "type": tgt_type,
                    "details": {"code": tgt_id, "entity_type": tgt_type}
                }

            G.add_edge(src_node_key, tgt_node_key, weight=rel.confidence or 1.0)

            edge_key = f"{src_node_key}-{rel.relationship_type}-{tgt_node_key}"
            edges_list.append({
                "id": edge_key,
                "source": src_node_key,
                "target": tgt_node_key,
                "label": rel.relationship_type,
                "confidence": rel.confidence or 1.0,
                "case_id": rel.case_id,
                "explanation": rel.explanation
            })

        # Calculate centralities if graph is non-empty
        if len(G.nodes) > 0:
            deg_centrality = nx.degree_centrality(G)
            try:
                bet_centrality = nx.betweenness_centrality(G)
            except Exception:
                bet_centrality = {node: 0.0 for node in G.nodes}
            try:
                pagerank = nx.pagerank(G, max_iter=200)
            except Exception:
                pagerank = {node: 0.0 for node in G.nodes}

            for node_key, data in nodes_dict.items():
                if node_key in G:
                    data["degree"] = G.degree(node_key)
                    data["centrality"] = round(deg_centrality.get(node_key, 0.0), 3)
                    data["details"]["betweenness_centrality"] = round(bet_centrality.get(node_key, 0.0), 3)
                    data["details"]["pagerank"] = round(pagerank.get(node_key, 0.0), 3)
                else:
                    data["degree"] = 0
                    data["centrality"] = 0.0
        else:
            for data in nodes_dict.values():
                data["degree"] = 0
                data["centrality"] = 0.0

        return {
            "nodes": list(nodes_dict.values()),
            "edges": edges_list,
            "total_nodes": len(nodes_dict),
            "total_edges": len(edges_list)
        }

    def get_top_key_entities(self, limit: int = 10) -> List[Dict[str, Any]]:
        full_graph = self.build_network_graph()
        nodes = full_graph["nodes"]

        # Sort by degree and centrality
        nodes.sort(key=lambda x: (x["degree"], x["centrality"]), reverse=True)
        top = nodes[:limit]

        results = []
        for n in top:
            results.append({
                "entity_id": n["id"],
                "entity_name": n["label"],
                "entity_type": n["type"],
                "connections_count": n["degree"],
                "degree_centrality": n["centrality"],
                "betweenness_centrality": n["details"].get("betweenness_centrality", 0.0),
                "pagerank": n["details"].get("pagerank", 0.0),
                "disclaimer": "High network centrality indicates that this entity occupies an important position in the observed data network. This is not evidence of criminal activity."
            })
        return results
