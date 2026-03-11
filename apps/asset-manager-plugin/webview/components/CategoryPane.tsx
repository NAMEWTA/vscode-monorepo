import { Button, Card, Flex, Form, Input, List, Modal, Popconfirm, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { Category, ManagedItemKind } from '@vscode-monorepo/shared-types';

interface CategoryPaneProps {
  kind: ManagedItemKind;
  categories: Category[];
  selectedCategoryId?: string;
  onSelect: (categoryId?: string) => void;
  onSave: (category: Category) => Promise<void>;
  onDelete: (category: Category) => Promise<void>;
}

interface CategoryFormValues {
  name: string;
  description?: string;
}

export function CategoryPane({ kind, categories, selectedCategoryId, onSelect, onSave, onDelete }: CategoryPaneProps) {
  const [form] = Form.useForm<CategoryFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    form.setFieldsValue({
      name: editingCategory?.name ?? '',
      description: editingCategory?.description ?? '',
    });
  }, [editingCategory, form, modalOpen]);

  const handleCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleCancel = () => {
    setModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await onSave({
        id: editingCategory?.id ?? '',
        kind,
        name: values.name,
        description: values.description,
        color: editingCategory?.color,
        order: editingCategory?.order,
      });
      handleCancel();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    setDeletingId(category.id);
    try {
      await onDelete(category);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card
        className="asset-pane asset-pane--categories"
        title="Categories"
        extra={
          <Button size="small" type="primary" onClick={handleCreate}>
            New category
          </Button>
        }
      >
        <List
          dataSource={[{ id: '', kind, name: 'All' } as Category, ...categories]}
          renderItem={(category) => {
            const isAll = !category.id;
            const isSelected = selectedCategoryId === category.id || (!selectedCategoryId && isAll);
            const isProtected = category.id === 'default';

            return (
              <List.Item className="asset-category-row">
                <Flex gap={8} align="center" style={{ width: '100%' }}>
                  <Button
                    type={isSelected ? 'primary' : 'text'}
                    block
                    className="asset-category-button"
                    onClick={() => onSelect(category.id || undefined)}
                  >
                    <Flex vertical align="flex-start" gap={4} style={{ width: '100%' }}>
                      <Space size={8} wrap>
                        <span>{category.name}</span>
                        {isAll ? (
                          <Typography.Text type="secondary">All items</Typography.Text>
                        ) : (
                          <Tag>{category.id}</Tag>
                        )}
                      </Space>
                      {category.description ? (
                        <Typography.Text type="secondary" className="asset-category-description">
                          {category.description}
                        </Typography.Text>
                      ) : null}
                    </Flex>
                  </Button>

                  {!isAll ? (
                    <Space.Compact>
                      <Button size="small" onClick={() => handleEdit(category)}>
                        Edit
                      </Button>
                      <Popconfirm
                        title="Delete category?"
                        description={
                          isProtected
                            ? 'Default category is reserved for new assets.'
                            : 'Referenced categories cannot be deleted.'
                        }
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        disabled={isProtected}
                        onConfirm={() => void handleDelete(category)}
                      >
                        <Button size="small" danger loading={deletingId === category.id} disabled={isProtected}>
                          Delete
                        </Button>
                      </Popconfirm>
                    </Space.Compact>
                  ) : null}
                </Flex>
              </List.Item>
            );
          }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editingCategory ? 'Edit category' : 'Create category'}
        okText={editingCategory ? 'Save changes' : 'Create category'}
        onOk={() => void handleSubmit()}
        okButtonProps={{ loading: submitting }}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Category name" rules={[{ required: true, message: 'Category name is required.' }]}>
            <Input placeholder="Reusable prompts" maxLength={80} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Optional notes for this category" autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
