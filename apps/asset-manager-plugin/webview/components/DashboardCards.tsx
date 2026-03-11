import { Card, Col, Row, Statistic, Typography } from 'antd';
import type { DashboardCounts } from '@vscode-monorepo/shared-types';

interface DashboardCardsProps {
  counts: DashboardCounts;
}

const labels = [
  { key: 'skill', title: 'Skills', accent: 'var(--asset-accent-skill)' },
  { key: 'command', title: 'Commands', accent: 'var(--asset-accent-command)' },
  { key: 'rule', title: 'Rules', accent: 'var(--asset-accent-rule)' },
] as const;

export function DashboardCards({ counts }: DashboardCardsProps) {
  return (
    <Row gutter={[12, 12]}>
      {labels.map((item) => (
        <Col key={item.key} span={8}>
          <Card className="asset-stat-card">
            <Typography.Text className="asset-stat-eyebrow">{item.title}</Typography.Text>
            <Statistic
              value={counts[item.key]}
              valueStyle={{
                color: item.accent,
                fontFamily: 'var(--asset-display-font)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
              }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
