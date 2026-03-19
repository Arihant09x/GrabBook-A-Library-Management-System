import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent, CardTitle, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface Borrowing {
  id: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  fineAmount: number;
  currentFine: number;
  book: { title: string; author: string };
}

export default function MyBooks() {
  const queryClient = useQueryClient();
  
  const { data: borrowings, isLoading } = useQuery<Borrowing[]>({
    queryKey: ['borrowings'],
    queryFn: async () => {
      const res = await api.get('/borrowings');
      return res.data;
    }
  });

  const returnMutation = useMutation({
    mutationFn: async (borrowingId: string) => {
      await api.post('/borrowings/return', { borrowingId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to return book');
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading your books...</div>;

  const activeBooks = borrowings?.filter((b: Borrowing) => !b.returnDate) || [];
  const pastBooks = borrowings?.filter((b: Borrowing) => b.returnDate) || [];

  return (
    <div className="space-y-10">
      <div className="pb-4 border-b">
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Books</h1>
        <p className="text-muted-foreground">Manage your current and past reads</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Currently Borrowed</h2>
        {activeBooks.length === 0 ? (
          <div className="bg-gray-50 text-muted-foreground border p-8 rounded-xl text-center">You haven't borrowed any books currently.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBooks.map((b: Borrowing) => (
              <Card key={b.id} className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1" title={b.book.title}>{b.book.title}</CardTitle>
                  <p className="text-sm text-gray-500 line-clamp-1">{b.book.author}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 pt-2 border-t mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Borrowed:</span>
                      <span className="font-medium">{new Date(b.borrowDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Due Date:</span>
                      <span className={new Date(b.dueDate) < new Date() ? "text-red-500 font-bold bg-red-50 px-1 rounded" : "font-medium"}>
                        {new Date(b.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {b.currentFine > 0 && (
                      <div className="flex justify-between text-sm bg-red-100 border border-red-200 text-red-700 p-2 rounded -mx-2 mt-2">
                        <span className="font-semibold">Current Fine:</span>
                        <span className="font-bold">${b.currentFine.toFixed(2)}</span>
                      </div>
                    )}
                    <Button 
                      className="w-full mt-4 border border-input bg-white hover:bg-gray-50 text-gray-800"
                      onClick={() => returnMutation.mutate(b.id)}
                      disabled={returnMutation.isPending}
                    >
                      {returnMutation.isPending ? 'Returning...' : 'Return Book'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Reading History</h2>
        {pastBooks.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-gray-50 p-6 rounded-lg text-center border">No past history found.</div>
        ) : (
          <div className="border rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Required Book</th>
                  <th className="px-6 py-4">Borrowed Date</th>
                  <th className="px-6 py-4">Returned Date</th>
                  <th className="px-6 py-4 text-right">Fine Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pastBooks.map((b: Borrowing) => (
                  <tr key={b.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{b.book.title}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(b.borrowDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(b.returnDate!).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {b.fineAmount > 0 ? <span className="text-red-600 font-medium">${b.fineAmount.toFixed(2)}</span> : <span className="text-green-600 font-medium whitespace-nowrap">No Fine</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
