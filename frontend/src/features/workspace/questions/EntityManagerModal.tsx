import { useState } from 'react';
import { Modal, List, Button, Input, Space, Popconfirm, ColorPicker, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './EntityManagerModal.module.css';

interface Item {
  id: number;
  name: string;
  color?: string;
  isArchived?: boolean;
}

interface Props {
  open: boolean;
  title: string;
  items: Item[];
  onClose: () => void;
  onCreate: (name: string, color?: string) => void;
  onUpdate: (id: number, name: string, color?: string) => void;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  showColor?: boolean;
  itemType: 'tag' | 'category';
}

export function EntityManagerModal({ open, title, items, onClose, onCreate, onUpdate, onArchive, onUnarchive, showColor, itemType }: Props) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#108ee9');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const label = itemType === 'tag' ? 'Тег' : 'Категория';

  const findDuplicate = (name: string, excludeId?: number) =>
    items.find((i) => i.name.toLowerCase() === name.toLowerCase() && i.id !== excludeId);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return;
    const duplicate = findDuplicate(trimmed);
    if (duplicate) {
      if (duplicate.isArchived) {
        onUnarchive(duplicate.id);
        message.success(`${label} «${trimmed}» восстановлен`);
      } else {
        message.warning(`${label} «${trimmed}» уже существует`);
        return;
      }
    } else {
      onCreate(trimmed, showColor ? newColor : undefined);
    }
    setNewName('');
    setNewColor('#108ee9');
  };

  const startEdit = (id: number, name: string, color?: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color || '#108ee9');
  };

  const saveEdit = (id: number) => {
    const trimmed = editName.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return;
    const duplicate = findDuplicate(trimmed, id);
    if (duplicate && !duplicate.isArchived) {
      message.warning(`${label} «${trimmed}» уже существует`);
      return;
    }
    onUpdate(id, trimmed, showColor ? editColor : undefined);
    setEditingId(null);
  };

  const activeItems = items.filter((item) => !item.isArchived);

  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null} width={450}>
      <Space.Compact className={styles.createRow}>
        <Input placeholder="Название (2-30 символов)" maxLength={30} value={newName} onChange={(e) => setNewName(e.target.value)} />
        {showColor && <ColorPicker value={newColor} onChange={(c) => setNewColor(c.toHexString())} />}
        <Button type="primary" icon={<PlusOutlined />} disabled={newName.trim().length < 2 || newName.trim().length > 30} onClick={handleCreate}>
          Добавить
        </Button>
      </Space.Compact>

      <List
        className={styles.list}
        dataSource={activeItems}
        renderItem={(item: Item) => (
          <List.Item
            key={item.id}
            actions={
              editingId === item.id
                ? [
                    <Button key="save" type="link" icon={<CheckOutlined />} onClick={() => saveEdit(item.id)} />,
                    <Button key="cancel" type="link" icon={<CloseOutlined />} onClick={() => setEditingId(null)} />,
                  ]
                : [
                    <Tooltip key="edit" title="Редактировать">
                      <Button type="link" icon={<EditOutlined />} onClick={() => startEdit(item.id, item.name, item.color)} />
                    </Tooltip>,
                    <Popconfirm key="archive" title={`Удалить ${item.name}?`} onConfirm={() => onArchive(item.id)}>
                      <Tooltip title="Удалить">
                        <Button type="link" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>,
                  ]
            }
          >
            <div className={styles.itemContent}>
              {editingId === item.id ? (
                <Space.Compact className={styles.editRow}>
                  <Input value={editName} maxLength={30} onChange={(e) => setEditName(e.target.value)} />
                  {showColor && <ColorPicker value={editColor} onChange={(c) => setEditColor(c.toHexString())} />}
                </Space.Compact>
              ) : (
                <Space>
                  {showColor && <div className={styles.colorDot} style={{ background: item.color || '#108ee9' }} />}
                  <span>{item.name}</span>
                </Space>
              )}
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
}
