import { Alert, App as AntdApp, Col, Layout, Modal, Row, Spin, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { WebviewApp } from '@vscode-monorepo/shared-ui/components';
import type { Category, CopyItemsToWorkspaceResponse, ManagedItemSummary } from '@vscode-monorepo/shared-types';
import { AssetEditorPane } from './components/AssetEditorPane';
import { AssetListPane } from './components/AssetListPane';
import { CategoryPane } from './components/CategoryPane';
import { CopyToWorkspaceModal } from './components/CopyToWorkspaceModal';
import { DashboardCards } from './components/DashboardCards';
import { GlobalSearchResults } from './components/GlobalSearchResults';
import { WorkbenchHeader } from './components/WorkbenchHeader';
import { useAssetWorkbench } from './hooks/useAssetWorkbench';

const { Content } = Layout;

function AppContent() {
  const [messageApi, contextHolder] = message.useMessage();
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetPath, setCopyTargetPath] = useState('./claude');
  const [copySubmitting, setCopySubmitting] = useState(false);
  const [copyResult, setCopyResult] = useState<CopyItemsToWorkspaceResponse | null>(null);
  const [copyItems, setCopyItems] = useState<ManagedItemSummary[]>([]);
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const {
    activeKind,
    categoryId,
    query,
    globalQuery,
    counts,
    storageRoot,
    workspace,
    categories,
    items,
    globalResults,
    selectedItem,
    selectedItemId,
    draft,
    loading,
    saving,
    error,
    actions,
  } = useAssetWorkbench();

  const selectedItemSummary = useMemo<ManagedItemSummary | null>(() => {
    if (!selectedItem) {
      return null;
    }
    return {
      id: selectedItem.id,
      kind: selectedItem.kind,
      name: selectedItem.name,
      description: selectedItem.description,
      categoryIds: selectedItem.categoryIds,
      tags: selectedItem.tags,
      enabled: selectedItem.enabled,
      source: selectedItem.source,
      updatedAt: selectedItem.updatedAt,
    };
  }, [selectedItem]);

  const checkedItems = useMemo(() => items.filter((item) => checkedItemIds.includes(item.id)), [checkedItemIds, items]);

  useEffect(() => {
    setCheckedItemIds((current) => current.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  const openCopyModal = (nextItems: ManagedItemSummary[]) => {
    setCopyResult(null);
    setCopyItems(nextItems);
    setCopyTargetPath(workspace?.defaultTargetPath ?? './claude');
    setCopyModalOpen(true);
  };

  const handleCopyConfirm = async () => {
    try {
      setCopySubmitting(true);
      const result = await actions.copyItems({
        items: copyItems.map((item) => ({ kind: item.kind, id: item.id })),
        targetPath: copyTargetPath,
      });
      setCopyResult(result);
      messageApi.success(`Copied ${copyItems.length} asset(s) to workspace.`);
    } catch (copyError) {
      messageApi.error(copyError instanceof Error ? copyError.message : String(copyError));
    } finally {
      setCopySubmitting(false);
    }
  };

  const handleDeleteRequest = () => {
    if (!selectedItem) {
      messageApi.info('Only saved assets can be deleted.');
      return;
    }
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteSubmitting(true);
      await actions.deleteSelectedItem();
      setDeleteModalOpen(false);
      messageApi.success('Asset deleted.');
    } catch (deleteError) {
      messageApi.error(deleteError instanceof Error ? deleteError.message : String(deleteError));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleSaveCategory = async (category: Category) => {
    try {
      await actions.saveCategory(category);
      messageApi.success(category.id ? 'Category updated.' : 'Category created.');
    } catch (categoryError) {
      messageApi.error(categoryError instanceof Error ? categoryError.message : String(categoryError));
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      await actions.deleteCategory(category);
      messageApi.success('Category deleted.');
    } catch (categoryError) {
      messageApi.error(categoryError instanceof Error ? categoryError.message : String(categoryError));
    }
  };

  return (
    <AntdApp>
      {contextHolder}
      <Layout className="asset-layout">
        <Content className="asset-content">
          <WorkbenchHeader
            activeKind={activeKind}
            query={query}
            globalQuery={globalQuery}
            workspace={workspace}
            onKindChange={(kind) => void actions.selectKind(kind)}
            onQueryChange={(value) => void actions.updateQuery(value)}
            onGlobalQueryChange={(value) => void actions.runGlobalSearch(value)}
            onCreate={actions.createNewItem}
            onOpenStorage={() => void actions.openStorageDirectory()}
          />

          <div className="asset-dashboard-shell">
            <DashboardCards counts={counts} />
          </div>

          {error ? <Alert style={{ marginBottom: 16 }} type="error" message={error} /> : null}
          {storageRoot ? <Typography.Text type="secondary">Storage root: {storageRoot}</Typography.Text> : null}

          <div className="asset-global-search-shell">
            <GlobalSearchResults
              query={globalQuery}
              items={globalResults}
              activeKind={activeKind}
              selectedItemId={selectedItemId}
              onSelect={(item) => void actions.selectItem(item)}
            />
          </div>

          {loading ? (
            <div className="asset-loading-shell">
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[16, 16]} className="asset-workbench-grid">
              <Col xs={24} xl={5}>
                <CategoryPane
                  kind={activeKind}
                  categories={categories}
                  selectedCategoryId={categoryId}
                  onSelect={(nextCategoryId) => void actions.filterByCategory(nextCategoryId)}
                  onSave={handleSaveCategory}
                  onDelete={handleDeleteCategory}
                />
              </Col>
              <Col xs={24} xl={8}>
                <AssetListPane
                  title={`${activeKind[0].toUpperCase()}${activeKind.slice(1)} Library`}
                  items={items}
                  selectedItemId={selectedItemId}
                  checkedItemIds={checkedItemIds}
                  onSelect={(item) => void actions.selectItem(item)}
                  onToggleChecked={(itemId, checked) => {
                    setCheckedItemIds((current) =>
                      checked ? [...new Set([...current, itemId])] : current.filter((currentId) => currentId !== itemId)
                    );
                  }}
                  onToggleAll={(checked) => setCheckedItemIds(checked ? items.map((item) => item.id) : [])}
                  onCopyChecked={() => openCopyModal(checkedItems)}
                />
              </Col>
              <Col xs={24} xl={11}>
                <AssetEditorPane
                  draft={draft}
                  categories={categories}
                  saving={saving}
                  onChange={actions.updateDraft}
                  onSave={() => void actions.saveDraft()}
                  onDelete={handleDeleteRequest}
                  onCopy={() => {
                    if (!selectedItemSummary) {
                      messageApi.info('Save the asset before copying it to the workspace.');
                      return;
                    }
                    openCopyModal([selectedItemSummary]);
                  }}
                />
              </Col>
            </Row>
          )}
        </Content>
      </Layout>

      <CopyToWorkspaceModal
        open={copyModalOpen}
        targetPath={copyTargetPath}
        items={copyItems}
        workspace={workspace}
        submitting={copySubmitting}
        result={copyResult}
        onTargetPathChange={setCopyTargetPath}
        onConfirm={() => void handleCopyConfirm()}
        onCancel={() => setCopyModalOpen(false)}
      />

      <Modal
        open={deleteModalOpen}
        title="Delete asset"
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true, loading: deleteSubmitting }}
        onOk={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteModalOpen(false)}
      >
        <Typography.Paragraph>
          {selectedItem ? `Delete “${selectedItem.name}” from the ${selectedItem.kind} library?` : 'Delete the selected asset?'}
        </Typography.Paragraph>
        <Typography.Text type="secondary">This removes the stored asset and refreshes the current list immediately.</Typography.Text>
      </Modal>
    </AntdApp>
  );
}

export function App() {
  return (
    <WebviewApp>
      <AppContent />
    </WebviewApp>
  );
}
