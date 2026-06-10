import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useDocumentHead } from './lib/useDocumentHead';

export default function App() {
  useDocumentHead();
  return <RouterProvider router={router} />;
}