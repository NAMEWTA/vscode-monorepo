import { Alert, Form, Input, Modal, Typography } from 'antd';
import { useEffect } from 'react';
import type { CopyItemsToWorkspaceResponse, ManagedItemSummary, WorkspaceContext } from '@vscode-monorepo/shared-types';

interface CopyToWorkspaceModalProps {
  open: boolean;
  targetPath: string;
  items: ManagedItemSummary[];
  workspace: WorkspaceContext | null;
  submitting: boolean;
  result: CopyItemsToWorkspaceResponse | null;
  onTargetPathChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CopyToWorkspaceModal({
  open,
  targetPath,
  items,
  workspace,
  submitting,
  result,
  onTargetPathChange,
  onConfirm,
  onCancel,
}: CopyToWorkspaceModalProps) {
  useEffect(() => {
    if (!open || !workspace?.defaultTargetPath) {
      return;
    }
    if (!targetPath.trim()) {
      onTargetPathChange(workspace.defaultTargetPath);
    }
  }, [onTargetPathChange, open, targetPath, workspace?.defaultTargetPath]);

  return (
    <Modal
      open={open}
      title="Confirm copy to workspace"
      okText="Copy assets"
      onOk={onConfirm}
      okButtonProps={{ loading: submitting, disabled: !workspace?.hasWorkspace || items.length === 0 }}
      onCancel={onCancel}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="Target path">
          <Input value={targetPath} onChange={(event) => onTargetPathChange(event.target.value)} placeholder="./claude" />
        </Form.Item>
      </Form>

      <Typography.Paragraph type="secondary">
        The target path is relative to the current workspace root and can be edited before copying.
      </Typography.Paragraph>

      <Typography.Paragraph className="asset-modal-summary">
        {items.length === 1 ? '1 asset is ready to copy.' : `${items.length} assets are ready to copy.`}
      </Typography.Paragraph>

      {!workspace?.hasWorkspace ? <Alert type="warning" message="Open a workspace folder before copying assets." /> : null}

      <Typography.Text strong>Assets to copy</Typography.Text>
      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            {item.name} ({item.kind})
          </li>
        ))}
      </ul>

      {result ? (
        <Alert
          style={{ marginTop: 12 }}
          type="success"
          message={`Copied to ${result.targetAbsolutePath}`}
          description={`Wrote ${result.writtenFiles.length} files${result.overwrittenFiles.length ? `, overwrote ${result.overwrittenFiles.length}` : ''}.`}
        />
      ) : null}
    </Modal>
  );
}
