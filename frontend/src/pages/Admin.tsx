import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { z } from 'zod';

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().min(10, 'ISBN must be at least 10 characters'),
  total_copies: z.number().min(1, 'Must have at least 1 copy')
});
interface Book {
  id: string; title: string; author: string; isbn: string; 
  total_copies: number; available_copies: number; status: string;
}

interface Borrowing {
  id: string; book: { title: string }; user: { name: string; email: string };
  borrowDate: string; dueDate: string; returnDate: string | null; currentFine: number; fineAmount: number;
}

export default function Admin() {
  const queryClient = useQueryClient();
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', total_copies: 1 });

  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({ queryKey: ['admin-books'], queryFn: async () => (await api.get('/books?publisher=me')).data });
  const { data: borrowings, isLoading: borLoading } = useQuery<Borrowing[]>({ queryKey: ['publisher-borrowings'], queryFn: async () => (await api.get('/borrowings?publisher=me')).data });

  const addBookMutation = useMutation({
    mutationFn: async (book: typeof newBook) => api.post('/books', book),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setNewBook({ title: '', author: '', isbn: '', total_copies: 1 });
      toast.success('Book safely added to inventory!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error adding book')
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book deleted successfully');
    }
  });

  if (booksLoading || borLoading) return <div className="p-8 text-center text-muted-foreground">Loading Admin Data...</div>;

  return (
    <div className="space-y-10">
      <div className="pb-4 border-b">
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage Library inventory and user borrowings</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b rounded-t-xl"><CardTitle className="text-lg">Add New Book</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={e => { 
                e.preventDefault(); 
                const result = bookSchema.safeParse(newBook);
                if (!result.success) { toast.error(result.error.issues[0].message); return; }
                addBookMutation.mutate(newBook); 
              }} className="space-y-4">
                <Input placeholder="Book Title" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} required />
                <Input placeholder="Author Name" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} required />
                <Input placeholder="ISBN Number" value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} required />
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Total Copies</label>
                  <Input type="number" min="1" value={newBook.total_copies} onChange={e => setNewBook({...newBook, total_copies: parseInt(e.target.value)})} required />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={addBookMutation.isPending}>Add Inventory</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b rounded-t-xl"><CardTitle className="text-lg">Inventory Management</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr><th className="p-3">Title & ISBN</th><th className="p-3">Copies</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {books?.map((b: Book) => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="font-medium line-clamp-1">{b.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">ISBN: {b.isbn}</div>
                        </td>
                        <td className="p-3 font-medium">{b.available_copies} / {b.total_copies}</td>
                        <td className="p-3"><Badge variant={b.status === 'AVAILABLE' ? 'success' : 'destructive'} className="text-[10px]">{b.status}</Badge></td>
                        <td className="p-3 text-right">
                          <button className="h-8 text-xs font-semibold px-3 border border-red-200 rounded text-red-600 hover:bg-red-50 transition-colors" onClick={() => { if(confirm('Delete book?')) deleteBookMutation.mutate(b.id); }}>DELETE</button>
                        </td>
                      </tr>
                    ))}
                    {books?.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No books in inventory.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b rounded-t-xl"><CardTitle className="text-lg">Borrowed Books (Your Publications)</CardTitle></CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr><th className="p-3">Borrower</th><th className="p-3">Book</th><th className="p-3">Borrowed Dates</th><th className="p-3">Status / Fine</th></tr>
              </thead>
              <tbody className="divide-y">
                {borrowings?.map((b: Borrowing) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{b.user.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{b.user.email}</div>
                    </td>
                    <td className="p-3 max-w-[200px] truncate font-medium text-gray-800" title={b.book.title}>{b.book.title}</td>
                    <td className="p-3 text-xs">
                      <div><span className="text-gray-500">Out:</span> <span className="font-medium">{new Date(b.borrowDate).toLocaleDateString()}</span></div>
                      <div className="mt-0.5"><span className="text-gray-500">Due:</span> <span className="font-medium">{new Date(b.dueDate).toLocaleDateString()}</span></div>
                    </td>
                    <td className="p-3">
                      {b.returnDate ? (
                        <div className="text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded inline-block border border-green-200">Returned (Fine: ${b.fineAmount})</div>
                      ) : (
                        <div className="flex flex-col space-y-1.5 w-fit">
                          <Badge variant="outline" className="bg-white">Active</Badge>
                          {b.currentFine > 0 && <span className="text-xs text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded border border-red-200 text-center">Fine: ${b.currentFine}</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {borrowings?.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No borrowing history.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
