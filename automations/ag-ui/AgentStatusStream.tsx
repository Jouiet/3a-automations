import React, { useState, useEffect } from 'react';

/**
 * AG-UI: AgentStatusStream (Real Implementation)
 * Protocol: Server-Sent Events (SSE) via ACP.
 */
export const AgentStatusStream = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [status, setStatus] = useState('disconnected');

    useEffect(() => {
        // Connect to the REAL ACP Server
        const eventSource = new EventSource('http://localhost:3000/acp/v1/stream');

        eventSource.onopen = () => {
            setStatus('connected');
            console.log("[AG-UI] Connected to ACP Stream");
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLogs(prev => [...prev, data]);

                // Auto-scroll
                const terminal = document.getElementById('ag-ui-terminal');
                if (terminal) terminal.scrollTop = terminal.scrollHeight;
            } catch (e) {
                console.error("Parse Error", e);
            }
        };

        eventSource.onerror = (err) => {
            setStatus('error');
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return (
        <div className="p-4 bg-gray-900 text-green-400 font-mono rounded-lg border border-green-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Autonomy Daemon (AG-UI)</h3>
                <span className={`px-2 py-1 rounded text-xs ${status === 'connected' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {status.toUpperCase()}
                </span>
            </div>

            <div id="ag-ui-terminal" className="h-64 overflow-y-auto bg-black p-2 rounded text-sm whitespace-pre-wrap">
                {logs.map((log, index) => (
                    <div key={index} className="mb-1 border-l-2 border-green-600 pl-2">
                        <span className="opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        {' '}[{log.type}] {log.message || `${log.status} job ${log.jobId}`}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgentStatusStream;
