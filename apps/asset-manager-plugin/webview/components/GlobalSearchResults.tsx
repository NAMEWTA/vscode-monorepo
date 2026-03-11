import { Card, Empty, List, Space, Tag, Typography } from 'antd';
import type { ManagedItemKind, ManagedItemSummary } from '@vscode-monorepo/shared-types';

interface GlobalSearchResultsProps {
  query: string;
  items: ManagedItemSummary[];
  activeKind: ManagedItemKind;
  selectedItemId: string | null;
  onSelect: (item: ManagedItemSummary) => void;
}

export function GlobalSearchResults({ query, items, activeKind, selectedItemId, onSelect }: GlobalSearchResultsProps) {
  return (
    <Card
      className="asset-pane"
      title="Global Search Results"
      extra={<Typography.Text type="secondary">{query ? `${items.length} match(es)` : '—'}</Typography.Text>}
    >
      {!query.trim() ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Type in the global search box to search all asset names" />
      ) : items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matches found" />
      ) : (
        <List
          dataSource={items}
          renderItem={(item) => {
            const isLocated = item.kind === activeKind && item.id === selectedItemId;
            return (
              <List.Item
                className={isLocated ? 'asset-list-item asset-list-item--selected' : 'asset-list-item'}
                onClick={() => onSelect(item)}
              >
                <div style={{ width: '100%' }}>
                  <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Typography.Text strong>{item.name}</Typography.Text>
                    {isLocated ? <Tag color="processing">Located</Tag> : <Tag>{item.kind}</Tag>}
                  </Space>
                  <div style={{ marginTop: 8 }}>
                    {!isLocated ? <Tag>{item.kind}</Tag> : null}
                    {item.categoryIds.map((categoryId) => (
                      <Tag key={categoryId}>{categoryId}</Tag>
                    ))}
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}
