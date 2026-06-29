import { useState } from 'react';
import { Card, Button, Modal, Form, Input, Select, Tag, Space, Typography } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useEditorStore } from '../../../stores/editorStore';
import { categoriesApi } from '../../../api/categories';
import { QUESTION_LEVELS } from '../../../utils/constants';
import type { Candidate, Category } from '../../../types';
import styles from './CandidateCard.module.css';

export function CandidateCard() {
  const { candidate, setCandidate } = useEditorStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const handleSubmit = (values: any) => {
    setCandidate(values as Candidate);
    setModalOpen(false);
    form.resetFields();
  };

  if (candidate) {
    const selectedCats = categories.filter((c: Category) => candidate.topicIds.includes(c.id));
    return (
      <Card className={styles.card}>
        <div className={styles.row}>
          <UserOutlined className={styles.avatarIcon} />
          <div className={styles.info}>
            <Typography.Title level={5} className={styles.name}>{candidate.candidateName}</Typography.Title>
            <div className={styles.grid}>
              <Typography.Text type="secondary" className={styles.label}>Должность:</Typography.Text>
              <Typography.Text className={styles.value}>{candidate.position}</Typography.Text>
              <Typography.Text type="secondary" className={styles.label}>Уровень:</Typography.Text>
              <Typography.Text>{QUESTION_LEVELS.find(l => l.value === candidate.level)?.label}</Typography.Text>
              <Typography.Text type="secondary" className={styles.label}>Темы:</Typography.Text>
              <Space size={4} wrap>{selectedCats.map((c: Category) => <Tag key={c.id}>{c.name}</Tag>)}</Space>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Button type="dashed" icon={<PlusOutlined />} block onClick={() => setModalOpen(true)} className={styles.createButton}>
        Создать карточку кандидата
      </Button>
      <Modal title="Новый кандидат" width={500} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="candidateName" label="ФИО кандидата" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="position" label="Должность" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="level" label="Уровень" rules={[{ required: true }]}>
            <Select size="large" options={QUESTION_LEVELS.map(l => ({ value: l.value, label: l.label }))} />
          </Form.Item>
          <Form.Item name="topicIds" label="Темы" rules={[{ required: true, message: 'Выберите хотя бы одну тему' }]}>
            <Select size="large" mode="multiple" options={categories.map((c: Category) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
