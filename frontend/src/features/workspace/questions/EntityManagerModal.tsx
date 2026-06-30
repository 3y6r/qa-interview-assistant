import { useState } from 'react';
import { Modal, List, Button, Input, Space, Popconfirm, ColorPicker, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './EntityManagerModal.module.css';

interface Item {
  id: number;
  name: string;
  color?: string;
}

interface Props {
  open: boolean;
  title: string;
  items: Item[];
  onClose: () => void;
  onCreate: (name: string, color?: string) => void;
  onUpdate: (id: number, name: string, color?: string) => void;
  onDelete: (id: number) => void;
  showColor?: boolean;
}

export function EntityManagerModal({ open, title, items, onClose, onCreate, onUpdate, onDelete, showColor }: Props) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#108ee9');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim(), showColor ? newColor : undefined);
    setNewName('');
    setNewColor('#108ee9');
  };

  const startEdit = (id: number, name: string, color?: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color || '#108ee9');
  };

  const saveEdit = (id: number) => {
    if (!editName.trim()) return;
    onUpdate(id, editName.trim(), showColor ? editColor : undefined);
    setEditingId(null);
  };

  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null} width={450}>
      <Space.Compact className={styles.createRow}>
        <Input placeholder="Название" value={newName} onChange={(e) => setNewName(e.target.value)} />
        {showColor && <ColorPicker value={newColor} onChange={(c) => setNewColor(c.toHexString())} />}
        <Button type="primary" icon={<PlusOutlined />} disabled={!newName.trim()} onClick={handleCreate}>
          Добавить
        </Button>
      </Space.Compact>

      <List
        dataSource={items}
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
                    <Popconfirm key="delete" title={`Удалить ${item.name}?`} onConfirm={() => onDelete(item.id)}>
                      <Tooltip title="Удалить">
                        <Button type="link" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>,
                  ]
            }
          >
            {editingId === item.id ? (
              <Space.Compact className={styles.editRow}>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                {showColor && <ColorPicker value={editColor} onChange={(c) => setEditColor(c.toHexString())} />}
              </Space.Compact>
            ) : (
              <Space>
                {showColor && <div className={styles.colorDot} style={{ background: item.color || '#108ee9' }} />}
                <span>{item.name}</span>
              </Space>
            )}
          </List.Item>
        )}
      />
    </Modal>
  );
}
