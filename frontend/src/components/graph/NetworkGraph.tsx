import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { NetworkGraphData, GraphNode, GraphEdge } from '../../types';
import { ZoomIn, ZoomOut, RefreshCw, Filter, Info, EyeOff, Search } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useTheme } from '../../context/ThemeContext';

interface NetworkGraphProps {
  graphData: NetworkGraphData;
  onSelectNode?: (node: GraphNode) => void;
  height?: string;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  graphData,
  onSelectNode,
  height = 'h-[600px]'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['PERSON', 'PHONE', 'VEHICLE', 'LOCATION', 'ORGANIZATION', 'ACCOUNT']);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [layoutName, setLayoutName] = useState<string>('cose');
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(true);
  const [highlightHubs, setHighlightHubs] = useState<boolean>(true);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Convert API nodes & edges to Cytoscape format
    const elements: any[] = [];

    graphData.nodes.forEach((n) => {
      if (activeFilters.includes(n.type)) {
        elements.push({
          data: {
            id: n.id,
            label: n.label,
            type: n.type,
            degree: n.degree || 0,
            centrality: n.centrality || 0,
            isHub: (n.degree || 0) >= 3 || (n.centrality || 0) > 0.3,
            details: n.details || {}
          }
        });
      }
    });

    graphData.edges.forEach((e) => {
      const srcFiltered = graphData.nodes.find(n => n.id === e.source);
      const tgtFiltered = graphData.nodes.find(n => n.id === e.target);
      if (srcFiltered && tgtFiltered && activeFilters.includes(srcFiltered.type) && activeFilters.includes(tgtFiltered.type)) {
        elements.push({
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            confidence: e.confidence,
            explanation: e.explanation
          }
        });
      }
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': isDark ? '#F8FAFC' : '#0F172A',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'background-color': '#0284C7',
            'border-width': 2,
            'border-color': isDark ? '#38BDF8' : '#0284C7',
            'width': 'mapData(degree, 0, 20, 24, 48)',
            'height': 'mapData(degree, 0, 20, 24, 48)',
            'transition-property': 'background-color, border-color, bounds',
            'transition-duration': 0.2
          }
        },
        {
          selector: 'node[type = "PERSON"]',
          style: {
            'background-color': '#0284C7',
            'border-color': isDark ? '#38BDF8' : '#0284C7'
          }
        },
        {
          selector: 'node[type = "PHONE"]',
          style: {
            'background-color': '#06B6D4',
            'border-color': isDark ? '#67E8F9' : '#0891B2'
          }
        },
        {
          selector: 'node[type = "VEHICLE"]',
          style: {
            'background-color': '#10B981',
            'border-color': isDark ? '#6EE7B7' : '#059669'
          }
        },
        {
          selector: 'node[type = "LOCATION"]',
          style: {
            'background-color': '#F59E0B',
            'border-color': isDark ? '#FCD34D' : '#D97706'
          }
        },
        {
          selector: 'node[type = "ORGANIZATION"]',
          style: {
            'background-color': '#8B5CF6',
            'border-color': isDark ? '#C4B5FD' : '#7C3AED'
          }
        },
        ...(highlightHubs ? [{
          selector: 'node[?isHub]',
          style: {
            'border-width': 4,
            'border-color': '#F59E0B',
            'border-opacity': 1
          }
        }] : []),
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': isDark ? '#334155' : '#CBD5E1',
            'curve-style': 'bezier',
            'label': showEdgeLabels ? 'data(label)' : '',
            'font-size': '9px',
            'color': isDark ? '#94A3B8' : '#475569',
            'text-rotation': 'autorotate',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': isDark ? '#334155' : '#CBD5E1'
          }
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#F43F5E',
            'line-color': '#F43F5E',
            'target-arrow-color': '#F43F5E'
          }
        }
      ],
      layout: {
        name: layoutName as any,
        animate: true,
        animationDuration: 500
      }
    });

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data();
      const selected: GraphNode = {
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type,
        degree: nodeData.degree,
        centrality: nodeData.centrality,
        details: nodeData.details
      };
      setSelectedNode(selected);
      setSelectedEdge(null);
      if (onSelectNode) onSelectNode(selected);
    });

    cy.on('tap', 'edge', (evt) => {
      const edgeData = evt.target.data();
      setSelectedEdge(edgeData as GraphEdge);
      setSelectedNode(null);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData, activeFilters, layoutName, showEdgeLabels, highlightHubs, isDark]);

  // Handle Search Highlight
  useEffect(() => {
    if (!cyRef.current || !searchTerm.trim()) return;
    const cy = cyRef.current;
    cy.nodes().forEach((n) => {
      if (n.data('label').toLowerCase().includes(searchTerm.toLowerCase())) {
        n.select();
      } else {
        n.unselect();
      }
    });
  }, [searchTerm]);

  const toggleFilter = (type: string) => {
    if (activeFilters.includes(type)) {
      setActiveFilters(activeFilters.filter((t) => t !== type));
    } else {
      setActiveFilters([...activeFilters, type]);
    }
  };

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit();

  return (
    <div className={`relative bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden flex flex-col ${height}`}>
      {/* Controls Header */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[
            { type: 'PERSON', label: 'Persons', color: 'blue' },
            { type: 'PHONE', label: 'Phones', color: 'cyan' },
            { type: 'VEHICLE', label: 'Vehicles', color: 'emerald' },
            { type: 'LOCATION', label: 'Locations', color: 'amber' },
            { type: 'ORGANIZATION', label: 'Organizations', color: 'purple' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => toggleFilter(item.type)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                activeFilters.includes(item.type)
                  ? 'bg-slate-700 text-white border border-slate-500 shadow-sm'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 line-through opacity-60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Feature Toggles & Search & Layout Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edge Labels Toggle */}
          <button
            onClick={() => setShowEdgeLabels(!showEdgeLabels)}
            title="Toggle Edge Labels on/off"
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
              showEdgeLabels
                ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Labels: {showEdgeLabels ? 'ON' : 'OFF'}
          </button>

          {/* High Centrality Hubs Toggle */}
          <button
            onClick={() => setHighlightHubs(!highlightHubs)}
            title="Toggle Key Centrality Hubs Highlight"
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
              highlightHubs
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Hubs: {highlightHubs ? 'ON' : 'OFF'}
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find node..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500 w-32"
            />
          </div>

          <select
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            className="bg-slate-800 text-xs text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none"
          >
            <option value="cose">CoSE Physics</option>
            <option value="concentric">Concentric Circles</option>
            <option value="grid">Grid Array</option>
            <option value="circle">Circle Layout</option>
          </select>

          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button onClick={handleZoomIn} title="Zoom In" className="p-1 text-slate-300 hover:bg-slate-700 rounded"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={handleZoomOut} title="Zoom Out" className="p-1 text-slate-300 hover:bg-slate-700 rounded"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button onClick={handleFit} title="Fit Network" className="p-1 text-slate-300 hover:bg-slate-700 rounded"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="absolute right-4 bottom-4 z-20 w-80 bg-[#1E293B]/95 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-2xl animate-fade-in text-xs">
          <div className="flex items-start justify-between border-b border-slate-700/60 pb-2 mb-3">
            <div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">{selectedNode.type} ENTITY</span>
              <h4 className="font-bold text-base text-white mt-0.5">{selectedNode.label}</h4>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white"><EyeOff className="w-4 h-4" /></button>
          </div>

          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Network Connections:</span>
              <span className="font-semibold text-white">{selectedNode.degree} degree</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Degree Centrality:</span>
              <span className="font-mono text-cyan-400 font-bold">{selectedNode.centrality}</span>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-amber-300/90 italic bg-amber-950/40 p-2 rounded border border-amber-500/20">
                Analytical Lead: Central position in network graph. Requires investigator verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Edge Details Drawer */}
      {selectedEdge && (
        <div className="absolute left-4 bottom-4 z-20 w-80 bg-[#1E293B]/95 backdrop-blur-md border border-sky-500/30 rounded-xl p-4 shadow-2xl animate-fade-in text-xs">
          <div className="flex items-start justify-between border-b border-slate-700/60 pb-2 mb-3">
            <div>
              <span className="text-[10px] text-sky-400 font-mono uppercase tracking-wider">RELATIONSHIP EDGE</span>
              <h4 className="font-bold text-sm text-white mt-0.5">{selectedEdge.label}</h4>
            </div>
            <button onClick={() => setSelectedEdge(null)} className="text-slate-400 hover:text-white"><EyeOff className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2 text-slate-300">
            <div>
              <span className="text-slate-400">Confidence Score:</span>
              <span className="ml-2 font-mono text-emerald-400 font-bold">{Math.round((selectedEdge.confidence || 1) * 100)}%</span>
            </div>
            {selectedEdge.explanation && (
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-slate-300 leading-relaxed">
                {selectedEdge.explanation}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
