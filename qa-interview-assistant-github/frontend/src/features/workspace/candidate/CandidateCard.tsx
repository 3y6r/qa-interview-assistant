import { useState } from 'react';
import { Card, Button, Modal, Form, Input, Select, Typography, DatePicker } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEditorStore } from '../../../stores/editorStore';
import { QUESTION_LEVELS } from '../../../utils/constants';
import type { Candidate } from '../../../types';
import styles from './CandidateCard.module.css';

export function CandidateCard() {
  const { candidate, setCandidate } = useEditorStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    const nextCandidate: Candidate = {
      candidateName: values.candidateName,
      position: values.position,
      level: values.level,
      interviewDate: values.interviewDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
    };

    setCandidate(nextCandidate);
    setModalOpen(false);
    form.resetFields();
  };

  if (candidate) {
    return (
      <Card className={styles.card}>
        <div className={styles.row}>
          <UserOutlined className={styles.avatarIcon} />

          <div className={styles.info}>
            <Typography.Title level={5} className={styles.name}>
              {candidate.candidateName}
            </Typography.Title>

            <div className={styles.grid}>
              <Typography.Text type="secondary" className={styles.label}>
                Должность:
              </Typography.Text>
              <Typography.Text className={styles.value}>
                {candidate.position}
              </Typography.Text>

              <Typography.Text type="secondary" className={styles.label}>
                Уровень:
              </Typography.Text>
              <Typography.Text>
                {QUESTION_LEVELS.find((l) => l.value === candidate.level)?.label}
              </Typography.Text>

              <Typography.Text type="secondary" className={styles.label}>
                Дата:
              </Typography.Text>
              <Typography.Text>{dayjs(candidate.interviewDate).format('DD.MM.YYYY')}</Typography.Text>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        block
        onClick={() => setModalOpen(true)}
        className={styles.createButton}
      >
        Создать карточку кандидата
      </Button>

      <Modal
        title="Новый кандидат"
        width={500}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ interviewDate: dayjs() }}
        >
          <Form.Item
            name="candidateName"
            label="ФИО кандидата"
            rules={[{ required: true, message: 'Введите ФИО кандидата' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            name="position"
            label="Должность"
            rules={[{ required: true, message: 'Введите должность' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            name="level"
            label="Уровень"
            rules={[{ required: true, message: 'Выберите уровень' }]}
          >
            <Select
              size="large"
              options={QUESTION_LEVELS.map((l) => ({
                value: l.value,
                label: l.label,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="interviewDate"
            label="Дата собеседования"
            rules={[{ required: true, message: 'Выберите дату собеседования' }]}
          >
            <DatePicker size="large" format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
