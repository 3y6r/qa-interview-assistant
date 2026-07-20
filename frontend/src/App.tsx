import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { WorkspacePage } from './pages/WorkspacePage';
import { HistoryPage } from './pages/HistoryPage';
import { EditorLayout } from './layouts/EditorLayout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={ruRU}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<EditorLayout />}>
              <Route index element={<WorkspacePage />} />
              <Route path="history" element={<HistoryPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
