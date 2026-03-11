import { Button, Card, Flex, Input, InputNumber, Select, Space, Switch, Tag, Typography } from 'antd';
import type { Category, ManagedItem } from '@vscode-monorepo/shared-types';

interface AssetEditorPaneProps {
  draft: ManagedItem | null;
  categories: Category[];
  saving: boolean;
  onChange: (draft: ManagedItem) => void;
  onSave: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

export function AssetEditorPane({ draft, categories, saving, onChange, onSave, onDelete, onCopy }: AssetEditorPaneProps) {
  if (!draft) {
    return (
      <Card className="asset-pane asset-pane--editor" title="Details">
        <Typography.Text type="secondary">Select an item to inspect or create a new one.</Typography.Text>
      </Card>
    );
  }

  const updateBase = (patch: Partial<ManagedItem>) => onChange({ ...draft, ...patch } as ManagedItem);

  return (
    <Card
      className="asset-pane asset-pane--editor"
      title={draft.id ? `Edit ${draft.kind}` : `Create ${draft.kind}`}
      extra={<Tag>{draft.source}</Tag>}
    >
      <Flex vertical gap={12}>
        <Input value={draft.name} placeholder="Display name" onChange={(event) => updateBase({ name: event.target.value })} />
        <Input.TextArea
          value={draft.description}
          placeholder="Description"
          autoSize={{ minRows: 2, maxRows: 4 }}
          onChange={(event) => updateBase({ description: event.target.value })}
        />
        <Select
          mode="multiple"
          value={draft.categoryIds}
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          onChange={(value) => updateBase({ categoryIds: value })}
        />
        <Input
          value={draft.tags.join(', ')}
          placeholder="tag-a, tag-b"
          onChange={(event) => updateBase({ tags: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
        />
        <Flex align="center" justify="space-between">
          <Typography.Text>Enabled</Typography.Text>
          <Switch checked={draft.enabled} onChange={(checked) => updateBase({ enabled: checked })} />
        </Flex>

        {draft.kind === 'skill' ? (
          <>
            <Input value={draft.trigger} placeholder="Trigger" onChange={(event) => onChange({ ...draft, trigger: event.target.value })} />
            <Input.TextArea
              value={draft.content}
              placeholder="Skill content"
              autoSize={{ minRows: 8, maxRows: 14 }}
              onChange={(event) => onChange({ ...draft, content: event.target.value })}
            />
            <Input
              value={draft.examples.join(', ')}
              placeholder="Examples"
              onChange={(event) => onChange({ ...draft, examples: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
          </>
        ) : null}

        {draft.kind === 'command' ? (
          <>
            <Input value={draft.commandId} placeholder="Command ID" onChange={(event) => onChange({ ...draft, commandId: event.target.value })} />
            <Input value={draft.title} placeholder="Command title" onChange={(event) => onChange({ ...draft, title: event.target.value })} />
            <Input value={draft.when} placeholder="When clause" onChange={(event) => onChange({ ...draft, when: event.target.value })} />
            <Input.TextArea
              value={draft.notes}
              placeholder="Command notes"
              autoSize={{ minRows: 6, maxRows: 10 }}
              onChange={(event) => onChange({ ...draft, notes: event.target.value })}
            />
          </>
        ) : null}

        {draft.kind === 'rule' ? (
          <>
            <Select
              value={draft.scope}
              options={[
                { value: 'global', label: 'Global' },
                { value: 'workspace', label: 'Workspace' },
                { value: 'language', label: 'Language' },
              ]}
              onChange={(value) => onChange({ ...draft, scope: value })}
            />
            <Input.TextArea
              value={draft.content}
              placeholder="Rule content"
              autoSize={{ minRows: 8, maxRows: 14 }}
              onChange={(event) => onChange({ ...draft, content: event.target.value })}
            />
            <Input
              value={draft.appliesTo.join(', ')}
              placeholder="Applies to"
              onChange={(event) => onChange({ ...draft, appliesTo: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
            <InputNumber
              style={{ width: '100%' }}
              value={draft.priority}
              placeholder="Priority"
              onChange={(value) => onChange({ ...draft, priority: typeof value === 'number' ? value : undefined })}
            />
          </>
        ) : null}

        <Space>
          <Button type="primary" loading={saving} onClick={onSave}>
            Save
          </Button>
          <Button onClick={onCopy}>Copy to Workspace
          </Button>
          <Button danger onClick={onDelete}>
            Delete
          </Button>
        </Space>
      </Flex>
    </Card>
  );
}
