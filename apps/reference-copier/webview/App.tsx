/**
 * Main App component for the webview.
 * Wrapped by WebviewApp which provides theme + error boundary.
 */

import { useState } from 'react';
import { Button, Input, Typography, Space, Card, Divider } from 'antd';
import { WebviewApp } from '@vscode-monorepo/shared-ui/components';
import { useExtensionRequest, useVSCodeTheme } from '@vscode-monorepo/shared-ui';

const { Title, Text } = Typography;

function AppContent() {
  const { themeKind, isDark } = useVSCodeTheme();
  const [name, setName] = useState('');

  const greet = useExtensionRequest<{ name: string }, { greeting: string }>('greet');
  const workspaceInfo = useExtensionRequest<
    void,
    { name: string; folders: string[] }
  >('get-workspace-info');

  return (
    <div style={{ padding: 16 }}>
      <Title level={3}>Template Plugin</Title>
      <Text type="secondary">
        Theme: {themeKind} ({isDark ? 'dark' : 'light'})
      </Text>

      <Divider />

      <Card title="Greet Extension Host" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            type="primary"
            onClick={() => greet.execute({ name })}
            loading={greet.loading}
            disabled={!name.trim()}
          >
            Send Greeting
          </Button>
          {greet.data && <Text>{greet.data.greeting}</Text>}
          {greet.error && <Text type="danger">{greet.error.message}</Text>}
        </Space>
      </Card>

      <Divider />

      <Card title="Workspace Info" size="small">
        <Button
          onClick={() => workspaceInfo.execute(undefined as never)}
          loading={workspaceInfo.loading}
        >
          Get Workspace Info
        </Button>
        {workspaceInfo.data && (
          <div style={{ marginTop: 8 }}>
            <Text strong>Name:</Text> <Text>{workspaceInfo.data.name}</Text>
            <br />
            <Text strong>Folders:</Text>
            <ul>
              {workspaceInfo.data.folders.map((f, i) => (
                <li key={i}>
                  <Text code>{f}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}

export function App() {
  return (
    <WebviewApp>
      <AppContent />
    </WebviewApp>
  );
}
