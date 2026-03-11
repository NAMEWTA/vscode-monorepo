import { Button, Input, Segmented, Space, Tag, Typography } from 'antd';
import type { ManagedItemKind, WorkspaceContext } from '@vscode-monorepo/shared-types';

interface WorkbenchHeaderProps {
  activeKind: ManagedItemKind;
  query: string;
  globalQuery: string;
  workspace: WorkspaceContext | null;
  onKindChange: (kind: ManagedItemKind) => void;
  onQueryChange: (value: string) => void;
  onGlobalQueryChange: (value: string) => void;
  onCreate: () => void;
  onOpenStorage: () => void;
}

export function WorkbenchHeader({
  activeKind,
  query,
  globalQuery,
  workspace,
  onKindChange,
  onQueryChange,
  onGlobalQueryChange,
  onCreate,
  onOpenStorage,
}: WorkbenchHeaderProps) {
  return (
    <div className="asset-header-shell">
      <div>
        <Typography.Text className="asset-overline">Asset Manager</Typography.Text>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Skills, commands, rules — one workbench.
        </Typography.Title>
        <Space size={8} wrap style={{ marginTop: 10 }}>
          <Tag color="processing">Webview-first</Tag>
          <Tag color="gold">Workspace copy</Tag>
          <Tag color="purple">Scoped persistence</Tag>
          <Tag>{workspace?.hasWorkspace ? `Workspace: ${workspace.name}` : 'No workspace open'}</Tag>
        </Space>
      </div>

      <div className="asset-header-toolbar">
        <Segmented
          value={activeKind}
          options={[
            { label: 'Skills', value: 'skill' },
            { label: 'Commands', value: 'command' },
            { label: 'Rules', value: 'rule' },
          ]}
          onChange={(value) => onKindChange(value as ManagedItemKind)}
        />

        <Input.Search
          allowClear
          value={query}
          placeholder={`Search ${activeKind} by name`}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <Input.Search
          allowClear
          value={globalQuery}
          placeholder="Global search by name"
          onChange={(event) => onGlobalQueryChange(event.target.value)}
        />

        <Space>
          <Button onClick={onOpenStorage}>Open Storage</Button>
          <Button type="primary" onClick={onCreate}>
            New {activeKind}
          </Button>
        </Space>
      </div>
    </div>
  );
}
