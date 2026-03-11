import { Badge, Button, Card, Checkbox, Empty, List, Space, Tag, Typography } from 'antd';
import type { ManagedItemSummary } from '@vscode-monorepo/shared-types';

interface AssetListPaneProps {
  title: string;
  items: ManagedItemSummary[];
  selectedItemId: string | null;
  checkedItemIds: string[];
  onSelect: (item: ManagedItemSummary) => void;
  onToggleChecked: (itemId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onCopyChecked: () => void;
}

export function AssetListPane({
  title,
  items,
  selectedItemId,
  checkedItemIds,
  onSelect,
  onToggleChecked,
  onToggleAll,
  onCopyChecked,
}: AssetListPaneProps) {
  const checkedCount = checkedItemIds.length;
  const allChecked = items.length > 0 && checkedCount === items.length;
  const partiallyChecked = checkedCount > 0 && checkedCount < items.length;

  return (
    <Card
      className="asset-pane asset-pane--list"
      title={title}
      extra={
        <Space size={12} wrap>
          <Checkbox checked={allChecked} indeterminate={partiallyChecked} onChange={(event) => onToggleAll(event.target.checked)}>
            Select all
          </Checkbox>
          <Button size="small" onClick={onCopyChecked} disabled={checkedCount === 0}>
            Copy checked {checkedCount > 0 ? `(${checkedCount})` : ''}
          </Button>
          <Typography.Text type="secondary">{items.length} items</Typography.Text>
        </Space>
      }
    >
      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No assets found" />
      ) : (
        <List
          dataSource={items}
          renderItem={(item) => {
            const selected = selectedItemId === item.id;
            const checked = checkedItemIds.includes(item.id);
            return (
              <List.Item
                className={selected ? 'asset-list-item asset-list-item--selected' : checked ? 'asset-list-item asset-list-item--checked' : 'asset-list-item'}
                onClick={() => onSelect(item)}
              >
                <Space align="start" size={12} style={{ width: '100%' }}>
                  <Checkbox
                    checked={checked}
                    className="asset-list-checkbox"
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onToggleChecked(item.id, event.target.checked)}
                  />
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Typography.Text strong>{item.name}</Typography.Text>
                      <Badge status={item.enabled ? 'processing' : 'default'} text={item.kind} />
                    </Space>
                    {item.description ? (
                      <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                        {item.description}
                      </Typography.Paragraph>
                    ) : null}
                    <Space size={[4, 4]} wrap>
                      {item.categoryIds.map((categoryId) => (
                        <Tag key={categoryId}>{categoryId}</Tag>
                      ))}
                    </Space>
                  </Space>
                </Space>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}
