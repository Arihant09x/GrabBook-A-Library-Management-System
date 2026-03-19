import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent, CardTitle, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  status: 'AVAILABLE' | 'OUT_OF_STOCK';
  createdAt: string;
  publisher?: { name: string };
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  
  const { data: books, isLoading, error } = useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: async () => {
      const res = await api.get('/books');
      return res.data;
    }
  });

  const borrowMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 days from now
      await api.post('/borrowings', { bookId, dueDate: dueDate.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book borrowed successfully!', { description: 'You have 14 days to return it.' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to borrow book');
    }
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Library Catalog</h1>
          <p className="text-muted-foreground">Browse and borrow available books</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="flex flex-col h-[380px] animate-pulse border-gray-200">
            <div className="h-44 bg-gray-200 rounded-t-xl" />
            <CardHeader className="py-4">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-10" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="mt-auto px-6 pb-6">
              <div className="h-10 bg-gray-200 rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-destructive">Error loading books.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Library Catalog</h1>
          <p className="text-muted-foreground">Browse and borrow available books</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
        {books?.map((book: Book) => (
          <Card key={book.id} className="flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-gray-200 group">
            <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b overflow-hidden relative">
              <img 
                src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`} 
                alt={book.title} 
                className="max-h-[90%] w-auto object-contain shadow-md rounded group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg'; // fallback
                }}
              />
            </div>
            <CardHeader className="py-4 pb-2">
              <div className="flex justify-between items-start mb-2 space-x-2">
                <Badge variant={book.status === 'AVAILABLE' ? 'success' : 'destructive'} className="text-[10px] px-1.5 py-0 whitespace-nowrap shadow-sm">
                  {book.status === 'AVAILABLE' ? 'Available' : 'Out of Stock'}
                </Badge>
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full">{book.available_copies}/{book.total_copies} left</span>
              </div>
              <CardTitle className="text-lg leading-tight line-clamp-2" title={book.title}>{book.title}</CardTitle>
              <p className="text-sm font-medium text-gray-700 mt-1 line-clamp-1">{book.author}</p>
              <div className="mt-2 text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100 italic">
                Released by: <span className="font-semibold text-gray-700">{book.publisher?.name || 'System'}</span><br/>
                on {new Date(book.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </CardHeader>
            <CardContent className="mt-auto px-6 pb-6 pt-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow" 
                disabled={book.status !== 'AVAILABLE' || borrowMutation.isPending}
                isLoading={borrowMutation.isPending && borrowMutation.variables === book.id}
                onClick={() => borrowMutation.mutate(book.id)}
              >
                {borrowMutation.isPending && borrowMutation.variables === book.id ? 'Processing...' : 'Borrow (14 Days)'}
              </Button>
            </CardContent>
          </Card>
        ))}
        {books?.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
            No books available in the library yet. Admins can add them from the Admin Panel.
          </div>
        )}
      </div>
    </div>
  );
}
