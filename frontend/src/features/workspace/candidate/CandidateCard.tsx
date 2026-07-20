import { useState } from 'react';
import { Card, Button, Modal, Form, Input, Select, Typography } from 'antd';
import { PlusOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useEditorStore } from '../../../stores/editorStore';
import { levelsApi } from '../../../api/levels';
import { LEVELS_QUERY_KEY } from '../../../utils/constants';
import type { Candidate } from '../../../types';
import styles from './CandidateCard.module.css';

export function CandidateCard() {
  const { candidate, setCandidate } = useEditorStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const { data: levels = [] } = useQuery({
    queryKey: [LEVELS_QUERY_KEY],
    queryFn: levelsApi.list,
  });

  const openCreate = () => {
    setEditing(false);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = () => {
    setEditing(true);
    form.setFieldsValue(candidate);
    setModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    setCandidate(values as Candidate);
    setModalOpen(false);
    form.resetFields();
  };

  return (
    <>
      {candidate ? (
        <Card className={styles.card}>
          <div className={styles.row}>
            <UserOutlined className={styles.avatarIcon} />
            <div className={styles.info}>
              <div className={styles.headerRow}>
                <Typography.Title level={5} className={styles.name}>{candidate.candidateName}</Typography.Title>
                <Button type="text" icon={<EditOutlined />} onClick={openEdit} />
              </div>
              <div className={styles.grid}>
                <Typography.Text type="secondary" className={styles.label}>Должность:</Typography.Text>
                <Typography.Text className={styles.value}>{candidate.position}</Typography.Text>
                <Typography.Text type="secondary" className={styles.label}>Уровень:</Typography.Text>
                <Typography.Text>{candidate.level}</Typography.Text>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Button type="dashed" icon={<PlusOutlined />} block onClick={openCreate} className={styles.createButton}>
          Создать карточку кандидата
        </Button>
      )}
      <Modal title={editing ? 'Редактировать кандидата' : 'Новый кандидат'} width={500} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="candidateName" label="ФИО кандидата" rules={[{ required: true }]}>
            <Input size="large" maxLength={100} />
          </Form.Item>
          <Form.Item name="position" label="Должность" rules={[{ required: true }]}>
            <Input size="large" maxLength={100} />
          </Form.Item>
          <Form.Item name="level" label="Уровень" rules={[{ required: true }]}>
            <Select size="large" options={levels.map((l: any) => ({ value: l.name, label: l.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
